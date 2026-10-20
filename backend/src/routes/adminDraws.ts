import { Router } from "express";
import crypto from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { dbPool } from "../config/db";
import { requireAuth } from "../middleware/auth";
import { generateUniqueDisplayCode } from "../utils/displayCodes";
import { settleDraw } from "../utils/drawSettlement";

const router = Router();

const VALID_DRAW_TYPES = ["daily", "weekly", "monthly"] as const;

const parseDateInput = (value: unknown, fieldName: string): Date => {
  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Valid ${fieldName} timestamp is required.`);
  }

  return date;
};

const toUtcMysqlDateTime = (date: Date): string =>
  date.toISOString().slice(0, 19).replace("T", " ");

const resolveDrawImage = (prizeAmount: number): string => {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";

  if (prizeAmount < 10000) {
    return `${backendUrl}/public/images/draw-amt-1.webp`;
  }

  if (prizeAmount < 100000) {
    return `${backendUrl}/public/images/draw-amt-2.webp`;
  }

  return `${backendUrl}/public/images/draw-amt-3.webp`;
};

interface AdminRow extends RowDataPacket {
  is_admin: number | boolean;
}

interface OverviewSummaryRow extends RowDataPacket {
  total_users: string | number;
  active_draws: string | number;
  tickets_sold_7d: string | number;
  open_support_requests: string | number;
  wallet_volume_30d: string | number;
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

  const [rows] = await dbPool.query<AdminRow[]>(
    "SELECT is_admin FROM users WHERE id = ? LIMIT 1",
    [userId],
  );

  const isAdmin = Boolean(rows[0]?.is_admin);

  if (!isAdmin) {
    res.status(403).json({ message: "Admin only." });
    return;
  }

  next();
};

router.get("/admin/overview", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const [summaryRows] = await dbPool.query<OverviewSummaryRow[]>(
      `SELECT
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM draws WHERE status = 'active') AS active_draws,
        (SELECT COUNT(*) FROM tickets WHERE created_at >= NOW() - INTERVAL 7 DAY) AS tickets_sold_7d,
        (SELECT COUNT(*) FROM support_requests WHERE status IN ('received', 'in_review')) AS open_support_requests,
        (SELECT COALESCE(SUM(amount), 0) FROM wallet_transaction_history WHERE type = 'topup' AND created_at >= NOW() - INTERVAL 30 DAY) AS wallet_volume_30d`,
    );

    const summary = summaryRows[0] ?? {
      total_users: 0,
      active_draws: 0,
      tickets_sold_7d: 0,
      open_support_requests: 0,
      wallet_volume_30d: 0,
    };

    const [activeDrawRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT id, draw_code, title, prize_title, prize_amount, ticket_price, max_tickets, tickets_sold, draw_at, expires_at, status
       FROM draws
       ORDER BY created_at DESC
       LIMIT 5`,
    );

    const [recentTicketRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         t.id,
         t.ticket_code,
         t.user_id,
         t.created_at,
         u.first_name,
         u.last_name,
         d.draw_code,
         d.title AS draw_title,
         d.prize_amount,
         d.ticket_price
       FROM tickets t
       LEFT JOIN users u ON u.id = t.user_id
       LEFT JOIN draws d ON d.id = t.draw_id
       ORDER BY t.created_at DESC
       LIMIT 8`,
    );

    const [recentWinnerRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         w.id,
         w.draw_code,
         w.winner_name,
         w.prize_amount,
         w.announced_at,
         d.title AS draw_title
       FROM winners w
       LEFT JOIN draws d ON d.id = w.draw_id
       ORDER BY w.announced_at DESC
       LIMIT 5`,
    );

    const [recentSupportRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         sr.id,
         sr.issue_type,
         sr.subject,
         sr.status,
         sr.created_at,
         u.first_name,
         u.last_name
       FROM support_requests sr
       LEFT JOIN users u ON u.id = sr.user_id
       ORDER BY sr.created_at DESC
       LIMIT 5`,
    );

    return res.status(200).json({
      summary: {
        totalUsers: Number(summary.total_users ?? 0),
        activeDraws: Number(summary.active_draws ?? 0),
        ticketsSoldLast7Days: Number(summary.tickets_sold_7d ?? 0),
        openSupportRequests: Number(summary.open_support_requests ?? 0),
        walletVolumeLast30Days: Number(summary.wallet_volume_30d ?? 0),
      },
      activeDraws: activeDrawRows.map((row) => ({
        id: Number(row.id),
        drawCode: row.draw_code,
        title: row.title,
        prizeTitle: row.prize_title,
        prizeAmount: Number(row.prize_amount ?? 0),
        ticketPrice: Number(row.ticket_price ?? 0),
        maxTickets: Number(row.max_tickets ?? 0),
        ticketsSold: Number(row.tickets_sold ?? 0),
        drawAt: row.draw_at,
        expiresAt: row.expires_at,
        status: row.status,
      })),
      recentTicketPurchases: recentTicketRows.map((row) => ({
        id: Number(row.id),
        ticketCode: row.ticket_code,
        userId: Number(row.user_id),
        userName:
          [row.first_name, row.last_name].filter(Boolean).join(" ") ||
          "Unknown user",
        drawCode: row.draw_code,
        drawTitle: row.draw_title,
        prizeAmount: Number(row.prize_amount ?? 0),
        ticketPrice: Number(row.ticket_price ?? 0),
        createdAt: row.created_at,
      })),
      recentWinners: recentWinnerRows.map((row) => ({
        id: Number(row.id),
        drawCode: row.draw_code,
        winnerName: row.winner_name,
        prizeAmount: Number(row.prize_amount ?? 0),
        announcedAt: row.announced_at,
        drawTitle: row.draw_title,
      })),
      recentSupportRequests: recentSupportRows.map((row) => ({
        id: Number(row.id),
        issueType: row.issue_type,
        subject: row.subject,
        status: row.status,
        createdAt: row.created_at,
        userName:
          [row.first_name, row.last_name].filter(Boolean).join(" ") ||
          "Unknown user",
      })),
    });
  } catch (error) {
    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Unable to load admin overview data.",
    });
  }
});

router.post("/admin/draws", requireAuth, requireAdmin, async (req, res) => {
  const {
    title,
    prizeTitle,
    prizeAmount,
    ticketPrice,
    maxTickets,
    drawType,
    drawAt,
    expiresAt,
  } = req.body as {
    title?: unknown;
    prizeTitle?: unknown;
    prizeAmount?: unknown;
    ticketPrice?: unknown;
    maxTickets?: unknown;
    drawType?: unknown;
    drawAt?: unknown;
    expiresAt?: unknown;
  };

  if (typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ message: "Title is required." });
  }

  if (typeof prizeTitle !== "string" || !prizeTitle.trim()) {
    return res.status(400).json({ message: "Prize title is required." });
  }

  const normalizedDrawType =
    typeof drawType === "string" ? drawType.trim().toLowerCase() : "";

  if (!VALID_DRAW_TYPES.includes(normalizedDrawType as any)) {
    return res.status(400).json({
      message: "drawType must be one of: daily, weekly, monthly.",
    });
  }

  const parsedPrizeAmount = Number(prizeAmount);
  const parsedTicketPrice = Number(ticketPrice);
  const parsedMaxTickets = Number(maxTickets);

  let drawDate: Date;
  let expiresDate: Date;

  try {
    drawDate = parseDateInput(drawAt, "drawAt");
    expiresDate = parseDateInput(expiresAt, "expiresAt");
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Valid draw timestamps are required.",
    });
  }

  if (!Number.isFinite(parsedPrizeAmount) || parsedPrizeAmount <= 0) {
    return res
      .status(400)
      .json({ message: "Prize amount must be a positive number." });
  }

  if (!Number.isFinite(parsedTicketPrice) || parsedTicketPrice <= 0) {
    return res
      .status(400)
      .json({ message: "Ticket price must be a positive number." });
  }

  if (!Number.isInteger(parsedMaxTickets) || parsedMaxTickets <= 0) {
    return res
      .status(400)
      .json({ message: "Max tickets must be a positive integer." });
  }

  if (expiresDate.getTime() >= drawDate.getTime()) {
    return res.status(400).json({
      message: "expiresAt must be earlier than drawAt.",
    });
  }

  const seed = crypto.randomBytes(32).toString("hex");
  const seedHash = crypto.createHash("sha256").update(seed).digest("hex");
  const drawCode = await generateUniqueDisplayCode(
    dbPool,
    "draws",
    "draw_code",
    "DA",
  );

  const image = resolveDrawImage(parsedPrizeAmount);

  const [result] = await dbPool.query<ResultSetHeader>(
    `INSERT INTO draws
        (draw_code, draw_type, title, image, prize_title, prize_amount, ticket_price, max_tickets, draw_at, expires_at, status, rng_seed_hash, rng_seed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
    [
      drawCode,
      normalizedDrawType,
      title.trim(),
      image,
      prizeTitle.trim(),
      parsedPrizeAmount,
      parsedTicketPrice,
      parsedMaxTickets,
      toUtcMysqlDateTime(drawDate),
      toUtcMysqlDateTime(expiresDate),
      seedHash,
      seed,
    ],
  );

  return res.status(201).json({
    message: "Draw created.",
    drawId: result.insertId,
    drawCode,
    rngSeedHash: seedHash,
  });
});

// ONLY FOR MANUAL SETTLEMENT OF DRAWS. AUTOMATIC SETTLEMENT IS IMPLEMENTED BY A CRON JOB IN THE BACKGROUND.
router.post(
  "/admin/draws/:id/settle",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const drawId = Number(req.params.id);

    if (!Number.isInteger(drawId) || drawId <= 0) {
      return res.status(400).json({ message: "Valid draw id is required." });
    }

    const connection = await dbPool.getConnection();

    try {
      const result = await settleDraw(connection, drawId, {
        allowBeforeDrawAt: true,
      });

      return res.status(200).json({
        message: "Draw settled successfully.",
        ...result,
      });
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "Draw settlement failed.",
      });
    } finally {
      connection.release();
    }
  },
);

export default router;
