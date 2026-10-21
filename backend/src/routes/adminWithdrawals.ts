import { Router } from "express";
import type { RowDataPacket } from "mysql2";
import { dbPool } from "../config/db";
import { requireAuth } from "../middleware/auth";
import { parseDbBooleanFlag } from "../utils/flags";

const router = Router();

interface UserRow extends RowDataPacket {
  id: number;
  phone_number: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  is_admin: number | boolean | string | null;
}

interface WithdrawalRequestRow extends RowDataPacket {
  id: number;
  user_id: number;
  bank_account_id: number;
  amount: string | number;
  currency: string;
  status: string;
  request_note: string | null;
  admin_note: string | null;
  reviewed_by_admin_id: number | null;
  reviewed_at: Date | string | null;
  paid_at: Date | string | null;
  payment_reference: string | null;
  rejection_reason: string | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
  phone_number: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  account_holder_name: string | null;
  bank_name: string | null;
  account_number: string | null;
  iban: string | null;
  ifsc_code: string | null;
  swift_code: string | null;
  branch_name: string | null;
  routing_number: string | null;
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

  try {
    const [rows] = await dbPool.query<UserRow[]>(
      "SELECT is_admin FROM users WHERE id = ? LIMIT 1",
      [userId],
    );

    if (!rows[0] || !parseDbBooleanFlag(rows[0].is_admin)) {
      res.status(403).json({ message: "Admin only." });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "Admin access check failed.",
    });
  }
};

const serializeWithdrawalRequest = (row: WithdrawalRequestRow) => ({
  id: row.id,
  userId: row.user_id,
  bankAccountId: row.bank_account_id,
  amount: Number(row.amount),
  currency: row.currency,
  status: row.status,
  requestNote: row.request_note,
  adminNote: row.admin_note,
  reviewedByAdminId: row.reviewed_by_admin_id,
  reviewedAt: row.reviewed_at,
  paidAt: row.paid_at,
  paymentReference: row.payment_reference,
  rejectionReason: row.rejection_reason,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  user: {
    phoneNumber: row.phone_number,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
  },
  bankAccount: {
    accountHolderName: row.account_holder_name,
    bankName: row.bank_name,
    accountNumber: row.account_number,
    iban: row.iban,
    ifscCode: row.ifsc_code,
    swiftCode: row.swift_code,
    branchName: row.branch_name,
    routingNumber: row.routing_number,
  },
});

router.get("/admin/withdrawals", requireAuth, requireAdmin, async (req, res) => {
  const rawStatus = typeof req.query.status === "string" ? req.query.status : "all";
  const statusFilter = rawStatus.trim().toLowerCase();
  const rawPage = typeof req.query.page === "string" ? req.query.page : "1";
  const rawLimit = typeof req.query.limit === "string" ? req.query.limit : "15";
  const rawSearch = typeof req.query.search === "string" ? req.query.search : "";
  const searchQuery = rawSearch.trim();
  const validStatuses = new Set([
    "all",
    "pending",
    "under_review",
    "approved",
    "rejected",
    "paid",
    "cancelled",
  ]);

  if (!validStatuses.has(statusFilter)) {
    return res.status(400).json({
      message: "status must be one of: all, pending, under_review, approved, rejected, paid, cancelled.",
    });
  }

  const page = Number(rawPage);
  const limit = Number(rawLimit);

  if (!Number.isInteger(page) || page < 1) {
    return res.status(400).json({ message: "page must be a positive integer." });
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({ message: "limit must be between 1 and 100." });
  }

  try {
    const baseJoin = `
      FROM withdrawal_requests wr
      LEFT JOIN users u ON u.id = wr.user_id
      LEFT JOIN user_bank_accounts uba ON uba.id = wr.bank_account_id`;

    const whereClauses: string[] = [];
    const countParams: Array<string | number> = [];

    if (statusFilter !== "all") {
      whereClauses.push("wr.status = ?");
      countParams.push(statusFilter);
    }

    if (searchQuery) {
      whereClauses.push(`(
        CAST(wr.id AS CHAR) LIKE ? OR
        LOWER(COALESCE(u.first_name, '')) LIKE LOWER(?) OR
        LOWER(COALESCE(u.last_name, '')) LIKE LOWER(?) OR
        LOWER(COALESCE(u.email, '')) LIKE LOWER(?) OR
        LOWER(COALESCE(u.phone_number, '')) LIKE LOWER(?) OR
        LOWER(COALESCE(uba.account_holder_name, '')) LIKE LOWER(?) OR
        LOWER(COALESCE(uba.bank_name, '')) LIKE LOWER(?) OR
        LOWER(COALESCE(uba.account_number, '')) LIKE LOWER(?) OR
        LOWER(COALESCE(uba.ifsc_code, '')) LIKE LOWER(?)
      )`);
      const likePattern = `%${searchQuery}%`;
      countParams.push(
        likePattern,
        likePattern,
        likePattern,
        likePattern,
        likePattern,
        likePattern,
        likePattern,
        likePattern,
        likePattern,
      );
    }

    const countQuery = `SELECT COUNT(*) AS total ${baseJoin}${whereClauses.length ? ` WHERE ${whereClauses.join(" AND ")}` : ""}`;
    const [countRows] = await dbPool.query<RowDataPacket[]>(countQuery, countParams);
    const total = Number(countRows[0]?.total ?? 0);
    const offset = (page - 1) * limit;

    let query = `SELECT wr.*, u.phone_number, u.first_name, u.last_name, u.email,
        uba.account_holder_name, uba.bank_name, uba.account_number, uba.iban, uba.ifsc_code, uba.swift_code, uba.branch_name, uba.routing_number
      ${baseJoin}`;

    const params: Array<string | number> = [];

    if (whereClauses.length) {
      query += ` WHERE ${whereClauses.join(" AND ")}`;
      params.push(...countParams);
    }

    query += " ORDER BY wr.created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows] = await dbPool.query<WithdrawalRequestRow[]>(query, params);
    const hasNextPage = offset + rows.length < total;

    return res.status(200).json({
      total,
      count: rows.length,
      hasNextPage,
      page,
      limit,
      requests: rows.map(serializeWithdrawalRequest),
    });
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Unable to fetch withdrawal requests.",
    });
  }
});

router.get("/admin/withdrawals/:id", requireAuth, requireAdmin, async (req, res) => {
  const requestId = Number(req.params.id);

  if (!Number.isInteger(requestId) || requestId <= 0) {
    return res.status(400).json({ message: "Valid withdrawal request id is required." });
  }

  try {
    const [rows] = await dbPool.query<WithdrawalRequestRow[]>(
      `SELECT wr.*, u.phone_number, u.first_name, u.last_name, u.email,
        uba.account_holder_name, uba.bank_name, uba.account_number, uba.iban, uba.ifsc_code, uba.swift_code, uba.branch_name, uba.routing_number
       FROM withdrawal_requests wr
       LEFT JOIN users u ON u.id = wr.user_id
       LEFT JOIN user_bank_accounts uba ON uba.id = wr.bank_account_id
       WHERE wr.id = ?
       LIMIT 1`,
      [requestId],
    );

    if (!rows[0]) {
      return res.status(404).json({ message: "Withdrawal request not found." });
    }

    const [auditRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT wal.*, u.first_name, u.last_name, u.email
       FROM withdrawal_audit_logs wal
       LEFT JOIN users u ON u.id = wal.actor_user_id
       WHERE wal.withdrawal_request_id = ?
       ORDER BY wal.created_at ASC`,
      [requestId],
    );

    const normalizedAuditLogs = (auditRows || []).map((log: any) => ({
      ...log,
      actorName:
       [log.first_name, log.last_name].filter(Boolean).join(" ") ||
       (log.actor_user_id ? `User #${log.actor_user_id}` : "System"),
      actorLabel: log.actor_role === "admin" ? "Admin" : "User",
    }));

    return res.status(200).json({
      request: serializeWithdrawalRequest(rows[0]),
      auditLogs: normalizedAuditLogs,
    });
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Unable to load withdrawal request.",
    });
  }
});

router.post("/admin/withdrawals/:id/approve", requireAuth, requireAdmin, async (req, res) => {
  const requestId = Number(req.params.id);
  const adminNote = typeof req.body?.adminNote === "string" ? req.body.adminNote.trim() : "";

  if (!Number.isInteger(requestId) || requestId <= 0) {
    return res.status(400).json({ message: "Valid withdrawal request id is required." });
  }

  const adminUserId = req.user?.id;

  if (!adminUserId) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  const connection = await dbPool.getConnection();

  try {
    await connection.beginTransaction();

    const [requestRows] = await connection.query<WithdrawalRequestRow[]>(
      "SELECT * FROM withdrawal_requests WHERE id = ? FOR UPDATE",
      [requestId],
    );

    if (!requestRows[0]) {
      throw new Error("Withdrawal request not found.");
    }

    const request = requestRows[0];

    if (request.status === "paid") {
      throw new Error("This withdrawal has already been paid.");
    }

    if (request.status === "rejected" || request.status === "cancelled") {
      throw new Error("This withdrawal request cannot be approved.");
    }

    await connection.query(
      `UPDATE withdrawal_requests
       SET status = 'approved', admin_note = ?, reviewed_by_admin_id = ?, reviewed_at = UTC_TIMESTAMP(), updated_at = UTC_TIMESTAMP()
       WHERE id = ?`,
      [adminNote || null, adminUserId, requestId],
    );

    await connection.query(
      `INSERT INTO withdrawal_audit_logs
        (withdrawal_request_id, actor_user_id, actor_role, action, old_status, new_status, note, created_at)
       VALUES (?, ?, 'admin', 'approved', ?, 'approved', ?, UTC_TIMESTAMP())`,
      [requestId, adminUserId, request.status || null, adminNote || "Withdrawal approved by admin."],
    );

    await connection.commit();

    return res.status(200).json({
      message: "Withdrawal request approved.",
      status: "approved",
    });
  } catch (error) {
    await connection.rollback();
    return res.status(400).json({
      message: error instanceof Error ? error.message : "Unable to approve withdrawal request.",
    });
  } finally {
    connection.release();
  }
});

router.post("/admin/withdrawals/:id/reject", requireAuth, requireAdmin, async (req, res) => {
  const requestId = Number(req.params.id);
  const adminNote = typeof req.body?.adminNote === "string" ? req.body.adminNote.trim() : "";
  const rejectionReason = typeof req.body?.rejectionReason === "string" ? req.body.rejectionReason.trim() : "";

  if (!Number.isInteger(requestId) || requestId <= 0) {
    return res.status(400).json({ message: "Valid withdrawal request id is required." });
  }

  const adminUserId = req.user?.id;

  if (!adminUserId) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  const connection = await dbPool.getConnection();

  try {
    await connection.beginTransaction();

    const [requestRows] = await connection.query<WithdrawalRequestRow[]>(
      "SELECT * FROM withdrawal_requests WHERE id = ? FOR UPDATE",
      [requestId],
    );

    if (!requestRows[0]) {
      throw new Error("Withdrawal request not found.");
    }

    const request = requestRows[0];

    if (request.status === "paid" || request.status === "rejected" || request.status === "cancelled") {
      throw new Error("This withdrawal request cannot be rejected.");
    }

    await connection.query(
      `UPDATE withdrawal_requests
       SET status = 'rejected', admin_note = ?, rejection_reason = ?, reviewed_by_admin_id = ?, reviewed_at = UTC_TIMESTAMP(), updated_at = UTC_TIMESTAMP()
       WHERE id = ?`,
      [adminNote || null, rejectionReason || adminNote || null, adminUserId, requestId],
    );

    await connection.query(
      "UPDATE users SET pending_withdrawal_amount = GREATEST(pending_withdrawal_amount - ?, 0) WHERE id = ?",
      [Number(request.amount), request.user_id],
    );

    await connection.query(
      `INSERT INTO withdrawal_audit_logs
        (withdrawal_request_id, actor_user_id, actor_role, action, old_status, new_status, note, created_at)
       VALUES (?, ?, 'admin', 'rejected', ?, 'rejected', ?, UTC_TIMESTAMP())`,
      [requestId, adminUserId, request.status || null, rejectionReason || adminNote || "Withdrawal rejected by admin."],
    );

    await connection.commit();

    return res.status(200).json({
      message: "Withdrawal request rejected.",
      status: "rejected",
    });
  } catch (error) {
    await connection.rollback();
    return res.status(400).json({
      message: error instanceof Error ? error.message : "Unable to reject withdrawal request.",
    });
  } finally {
    connection.release();
  }
});

router.post("/admin/withdrawals/:id/pay", requireAuth, requireAdmin, async (req, res) => {
  const requestId = Number(req.params.id);
  const adminNote = typeof req.body?.adminNote === "string" ? req.body.adminNote.trim() : "";
  const paymentReference = typeof req.body?.paymentReference === "string" ? req.body.paymentReference.trim() : "";

  if (!Number.isInteger(requestId) || requestId <= 0) {
    return res.status(400).json({ message: "Valid withdrawal request id is required." });
  }

  const adminUserId = req.user?.id;

  if (!adminUserId) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  const connection = await dbPool.getConnection();

  try {
    await connection.beginTransaction();

    const [requestRows] = await connection.query<WithdrawalRequestRow[]>(
      "SELECT * FROM withdrawal_requests WHERE id = ? FOR UPDATE",
      [requestId],
    );

    if (!requestRows[0]) {
      throw new Error("Withdrawal request not found.");
    }

    const request = requestRows[0];

    if (request.status !== "approved") {
      throw new Error("Only approved withdrawals can be marked as paid.");
    }

    const [userRows] = await connection.query<RowDataPacket[]>(
      "SELECT wallet_balance, pending_withdrawal_amount FROM users WHERE id = ? FOR UPDATE",
      [request.user_id],
    );

    const currentBalance = Number(userRows[0]?.wallet_balance ?? 0);
    const currentPending = Number(userRows[0]?.pending_withdrawal_amount ?? 0);
    const amount = Number(request.amount);

    const newBalance = currentBalance - amount;
    const newPendingAmount = Math.max(currentPending - amount, 0);

    await connection.query(
      "UPDATE users SET wallet_balance = ?, pending_withdrawal_amount = ? WHERE id = ?",
      [newBalance, newPendingAmount, request.user_id],
    );

    await connection.query(
      `UPDATE withdrawal_requests
       SET status = 'paid', admin_note = ?, payment_reference = ?, reviewed_by_admin_id = ?, reviewed_at = UTC_TIMESTAMP(), paid_at = UTC_TIMESTAMP(), updated_at = UTC_TIMESTAMP()
       WHERE id = ?`,
      [adminNote || null, paymentReference || null, adminUserId, requestId],
    );

    await connection.query(
      `INSERT INTO wallet_transaction_history
        (user_id, type, amount, balance_after, reference_type, reference_id, created_at)
       VALUES (?, 'withdrawal_paid', ?, ?, 'withdrawal_paid', ?, UTC_TIMESTAMP())`,
      [request.user_id, -amount, newBalance, requestId],
    );

    await connection.query(
      `INSERT INTO withdrawal_audit_logs
        (withdrawal_request_id, actor_user_id, actor_role, action, old_status, new_status, note, created_at)
       VALUES (?, ?, 'admin', 'paid', ?, 'paid', ?, UTC_TIMESTAMP())`,
      [requestId, adminUserId, request.status, adminNote || paymentReference || "Withdrawal paid."],
    );

    await connection.commit();

    return res.status(200).json({
      message: "Withdrawal marked as paid.",
      status: "paid",
      walletBalance: newBalance,
      pendingWithdrawalAmount: newPendingAmount,
    });
  } catch (error) {
    await connection.rollback();
    return res.status(400).json({
      message: error instanceof Error ? error.message : "Unable to pay withdrawal request.",
    });
  } finally {
    connection.release();
  }
});

export default router;
