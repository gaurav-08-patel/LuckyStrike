import { Router } from "express";
import crypto from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { dbPool } from "../config/db";
import { requireAuth } from "../middleware/auth";
import { generateUniqueDisplayCode } from "../utils/displayCodes";
import { settleDraw } from "../utils/drawSettlement";

const router = Router();

const parseDateInput = (value: unknown, fieldName: string): Date => {
  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Valid ${fieldName} timestamp is required.`);
  }

  return date;
};

const toUtcMysqlDateTime = (date: Date): string =>
  date.toISOString().slice(0, 19).replace("T", " ");

interface AdminRow extends RowDataPacket {
  is_admin: number | boolean;
}

interface DrawRow extends RowDataPacket {
  id: number;
  draw_code: string;
  title: string;
  prize_title: string;
  prize_amount: string | number;
  ticket_price: string | number;
  max_tickets: number;
  tickets_sold: number;
  draw_at: Date | string;
  expires_at: Date | string;
  status: string;
  winner_user_id: number | null;
  rng_seed_hash: string | null;
  rng_seed: string | null;
  created_at: Date | string;
}

interface TicketRow extends RowDataPacket {
  id: number;
  ticket_code: string;
  draw_id: number;
  user_id: number;
  status: string;
  created_at: Date | string;
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

router.post("/admin/draws", requireAuth, requireAdmin, async (req, res) => {
  const {
    title,
    prizeTitle,
    prizeAmount,
    ticketPrice,
    maxTickets,
    drawAt,
    expiresAt,
  } = req.body as {
    title?: unknown;
    prizeTitle?: unknown;
    prizeAmount?: unknown;
    ticketPrice?: unknown;
    maxTickets?: unknown;
    drawAt?: unknown;
    expiresAt?: unknown;
  };

  if (typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ message: "Title is required." });
  }

  if (typeof prizeTitle !== "string" || !prizeTitle.trim()) {
    return res.status(400).json({ message: "Prize title is required." });
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

  const [result] = await dbPool.query<ResultSetHeader>(
    `INSERT INTO draws
        (draw_code, title, prize_title, prize_amount, ticket_price, max_tickets, draw_at, expires_at, status, rng_seed_hash, rng_seed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
    [
      drawCode,
      title.trim(),
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
      const result = await settleDraw(connection, drawId);

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
