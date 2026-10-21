import { Router } from "express";
import type { RowDataPacket } from "mysql2";
import { dbPool } from "../config/db";
import { requireAuth } from "../middleware/auth";
import { parseDbBooleanFlag } from "../utils/flags";

const router = Router();

const VALID_SUPPORT_STATUSES = [
  "received",
  "in_review",
  "resolved",
  "closed",
] as const;

interface SupportRequestRow extends RowDataPacket {
  id: number;
  user_id: number;
  issue_type: string;
  subject: string;
  message: string;
  status: string;
  created_at: Date | string | null;
  updated_at: Date | string | null;
}

interface UserRow extends RowDataPacket {
  id: number;
  phone_number: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  is_admin: number | boolean | string | null;
}

const requireAdmin = async (
  req: any,
  res: any,
  next: () => void,
): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }

  const [rows] = await dbPool.query<UserRow[]>(
    "SELECT is_admin FROM users WHERE id = ? LIMIT 1",
    [userId],
  );

  const isAdmin = parseDbBooleanFlag(rows[0]?.is_admin);

  if (!isAdmin) {
    res.status(403).json({ message: "Admin only." });
    return;
  }

  next();
};

const serializeSupportRequest = (row: SupportRequestRow) => ({
  id: row.id,
  userId: row.user_id,
  issueType: row.issue_type,
  subject: row.subject,
  message: row.message,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

router.post("/", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  const { issueType, subject, message } = req.body ?? {};

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  if (typeof issueType !== "string" || !issueType.trim()) {
    return res.status(400).json({ message: "Issue type is required." });
  }

  if (typeof subject !== "string" || !subject.trim()) {
    return res.status(400).json({ message: "Subject is required." });
  }

  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ message: "Message is required." });
  }

  const normalizedIssueType = issueType.trim().slice(0, 50);
  const normalizedSubject = subject.trim().slice(0, 200);
  const normalizedMessage = message.trim().slice(0, 5000);

  try {
    const [result] = await dbPool.query(
      `INSERT INTO support_requests (user_id, issue_type, subject, message, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'received', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [userId, normalizedIssueType, normalizedSubject, normalizedMessage],
    );

    const insertId = (result as { insertId?: number }).insertId;

    const [rows] = await dbPool.query<SupportRequestRow[]>(
      `SELECT id, user_id, issue_type, subject, message, status, created_at, updated_at
       FROM support_requests
       WHERE id = ?
       LIMIT 1`,
      [insertId],
    );

    const row = rows[0];

    return res.status(202).json({
      message: "Support request submitted successfully.",
      request: row ? serializeSupportRequest(row) : null,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Support request could not be saved.",
    });
  }
});

router.get("/recent", requireAuth, async (_req, res) => {
  try {
    const [rows] = await dbPool.query<SupportRequestRow[]>(
      `SELECT id, user_id, issue_type, subject, message, status, created_at, updated_at
       FROM support_requests
       ORDER BY created_at DESC
       LIMIT 10`,
    );

    return res.status(200).json({
      count: rows.length,
      requests: rows.map(serializeSupportRequest),
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Unable to fetch support requests.",
    });
  }
});

router.get("/admin/requests", requireAuth, requireAdmin, async (req, res) => {
  const rawStatus =
    typeof req.query.status === "string" ? req.query.status : "all";
  const statusFilter = rawStatus.trim().toLowerCase();
  const searchTerm =
    typeof req.query.search === "string" ? req.query.search.trim() : "";
  const sortDirection =
    typeof req.query.sort === "string" &&
    ["asc", "desc"].includes(req.query.sort.toLowerCase())
      ? req.query.sort.toLowerCase()
      : typeof req.query.order === "string" &&
          ["asc", "desc"].includes(req.query.order.toLowerCase())
        ? req.query.order.toLowerCase()
        : "desc";

  const page = Number(req.query.page ?? 1);
  const rawLimit = Number(req.query.limit ?? 15);
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const maxLimit = 15;
  const safeLimit =
    Number.isInteger(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, maxLimit)
      : 15;

  if (
    statusFilter !== "all" &&
    !VALID_SUPPORT_STATUSES.includes(statusFilter as any)
  ) {
    return res.status(400).json({
      message: `status must be one of: all, ${VALID_SUPPORT_STATUSES.join(", ")}.`,
    });
  }

  const offset = (safePage - 1) * safeLimit;

  try {
    const conditions: string[] = [];
    const params: any[] = [];

    if (statusFilter !== "all") {
      conditions.push("sr.status = ?");
      params.push(statusFilter);
    }

    if (searchTerm.length > 0) {
      conditions.push(`(
       LOWER(sr.issue_type) LIKE ? OR
       LOWER(sr.subject) LIKE ? OR
       LOWER(sr.message) LIKE ? OR
       LOWER(u.first_name) LIKE ? OR
       LOWER(u.last_name) LIKE ? OR
       LOWER(u.email) LIKE ? OR
       LOWER(CAST(u.phone_number AS CHAR)) LIKE ?
      )`);

      const searchPattern = `%${searchTerm.toLowerCase()}%`;
      params.push(
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
      );
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const [countRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total
       FROM support_requests sr
       INNER JOIN users u ON u.id = sr.user_id
       ${whereClause}`,
      params,
    );

    const total = Number(countRows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));

    const [rows] = await dbPool.query<SupportRequestRow[]>(
      `SELECT sr.id, sr.user_id, sr.issue_type, sr.subject, sr.message, sr.status, sr.created_at, sr.updated_at,
              u.phone_number, u.first_name, u.last_name, u.email
       FROM support_requests sr
       INNER JOIN users u ON u.id = sr.user_id
       ${whereClause}
       ORDER BY sr.created_at ${sortDirection.toUpperCase()}
       LIMIT ? OFFSET ?`,
      [...params, safeLimit, offset],
    );

    const requests = rows.map((row) => ({
      ...serializeSupportRequest(row),
      user: {
        id: row.user_id,
        phoneNumber: (row as any).phone_number,
        firstName: (row as any).first_name,
        lastName: (row as any).last_name,
        email: (row as any).email,
      },
    }));

    return res.status(200).json({
      status: statusFilter,
      sort: sortDirection,
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1,
      count: requests.length,
      requests,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Unable to fetch support requests for review.",
    });
  }
});

router.patch(
  "/admin/requests/:id/status",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const { id } = req.params;
    const { status } = req.body ?? {};

    if (!id || Number.isNaN(Number(id))) {
      return res
        .status(400)
        .json({ message: "Valid support request id is required." });
    }

    if (
      typeof status !== "string" ||
      !VALID_SUPPORT_STATUSES.includes(status as any)
    ) {
      return res.status(400).json({
        message: `Status must be one of: ${VALID_SUPPORT_STATUSES.join(", ")}.`,
      });
    }

    try {
      const [result] = await dbPool.query(
        `UPDATE support_requests
         SET status = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [status, Number(id)],
      );

      if ((result as any).affectedRows === 0) {
        return res.status(404).json({ message: "Support request not found." });
      }

      const [rows] = await dbPool.query<SupportRequestRow[]>(
        `SELECT id, user_id, issue_type, subject, message, status, created_at, updated_at
         FROM support_requests
         WHERE id = ?
         LIMIT 1`,
        [Number(id)],
      );

      return res.status(200).json({
        message: "Support request status updated.",
        request: rows[0] ? serializeSupportRequest(rows[0]) : null,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: error?.message || "Unable to update support request status.",
      });
    }
  },
);

export default router;
