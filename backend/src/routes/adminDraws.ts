import { Router } from "express";
import crypto from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { dbPool } from "../config/db";
import { requireAuth } from "../middleware/auth";
import { generateUniqueDisplayCode } from "../utils/displayCodes";

const router = Router();

interface AdminRow extends RowDataPacket {
  is_admin: number | boolean;
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
  const drawDate = new Date(String(drawAt));
  const expiresDate = new Date(String(expiresAt));

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

  if (Number.isNaN(drawDate.getTime())) {
    return res
      .status(400)
      .json({ message: "Valid drawAt timestamp is required." });
  }

  if (Number.isNaN(expiresDate.getTime())) {
    return res
      .status(400)
      .json({ message: "Valid expiresAt timestamp is required." });
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
      drawDate.toISOString().slice(0, 19).replace("T", " "),
      expiresDate.toISOString().slice(0, 19).replace("T", " "),
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

export default router;
