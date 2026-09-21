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
      await connection.beginTransaction();

      const [drawRows] = await connection.query<DrawRow[]>(
        "SELECT * FROM draws WHERE id = ? FOR UPDATE",
        [drawId],
      );

      const draw = drawRows[0];

      if (!draw) {
        throw new Error("Draw not found.");
      }

      if (draw.status !== "active") {
        throw new Error("Draw is not active.");
      }

      if (new Date(draw.expires_at).getTime() > Date.now()) {
        throw new Error("Draw has not expired yet.");
      }

      if (!draw.rng_seed || !draw.rng_seed_hash) {
        throw new Error("Draw seed is missing.");
      }

      const computedSeedHash = crypto
        .createHash("sha256")
        .update(draw.rng_seed)
        .digest("hex");

      if (computedSeedHash !== draw.rng_seed_hash) {
        throw new Error("Seed hash mismatch. Draw cannot be settled.");
      }

      const [ticketRows] = await connection.query<TicketRow[]>(
        "SELECT * FROM tickets WHERE draw_id = ? ORDER BY id ASC",
        [drawId],
      );

      if (ticketRows.length === 0) {
        throw new Error("No tickets were sold for this draw.");
      }

      const seedInput = `${draw.rng_seed}:${draw.id}:${draw.rng_seed_hash}`;
      const hashHex = crypto
        .createHash("sha256")
        .update(seedInput)
        .digest("hex");
      const winnerIndex = Number(
        BigInt(`0x${hashHex}`) % BigInt(ticketRows.length),
      );
      const winningTicket = ticketRows[winnerIndex];
      const winnerUserId = winningTicket.user_id;

      await connection.query(
        `UPDATE tickets
       SET status = CASE WHEN id = ? THEN 'won' ELSE 'lost' END
       WHERE draw_id = ?`,
        [winningTicket.id, drawId],
      );

      await connection.query(
        "UPDATE draws SET status = 'completed', winner_user_id = ? WHERE id = ?",
        [winnerUserId, drawId],
      );

      const prizeAmount = Number(draw.prize_amount);

      await import("../utils/wallet.js").then(({ updateWalletBalance }) =>
        updateWalletBalance(
          connection,
          winnerUserId,
          prizeAmount,
          "prize_credit",
          "draw",
          drawId,
        ),
      );

      await connection.commit();

      return res.status(200).json({
        message: "Draw settled successfully.",
        drawId,
        drawStatus: "completed",
        winnerUserId,
        winningTicketId: winningTicket.id,
        winningTicketCode: winningTicket.ticket_code,
        prizeAmount,
        totalTickets: ticketRows.length,
      });
    } catch (error) {
      await connection.rollback();
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
