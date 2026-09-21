import { Router } from "express";
import type { RowDataPacket } from "mysql2";
import { dbPool } from "../config/db";
import { requireAuth } from "../middleware/auth";
import { generateUniqueDisplayCode } from "../utils/displayCodes";
import { updateWalletBalance } from "../utils/wallet";

const router = Router();

interface DrawRow extends RowDataPacket {
  id: number;
  ticket_price: string | number;
  max_tickets: number;
  tickets_sold: number;
  status: string;
  expires_at: Date | string;
}

interface UserBalanceRow extends RowDataPacket {
  wallet_balance: string | number;
}

router.post("/draws/:id/buy", requireAuth, async (req, res) => {
  const drawId = Number(req.params.id);
  const quantity = Number(req.body?.quantity);
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  if (!Number.isInteger(drawId) || drawId <= 0) {
    return res.status(400).json({ message: "Valid draw id is required." });
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ message: "Valid quantity is required." });
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

    if (new Date(draw.expires_at).getTime() <= Date.now()) {
      throw new Error("Ticket sales have ended for this draw.");
    }

    if (draw.tickets_sold + quantity > draw.max_tickets) {
      throw new Error("Not enough tickets remaining.");
    }

    const totalCost = Number(draw.ticket_price) * quantity;

    const [userRows] = await connection.query<UserBalanceRow[]>(
      "SELECT wallet_balance FROM users WHERE id = ? FOR UPDATE",
      [userId],
    );

    const currentBalance = Number(userRows[0]?.wallet_balance ?? 0);

    if (currentBalance < totalCost) {
      throw new Error("Insufficient wallet balance.");
    }

    await updateWalletBalance(
      connection,
      userId,
      -totalCost,
      "ticket_purchase",
      "draw",
      drawId,
    );

    const ticketCodes = [] as string[];
    for (let i = 0; i < quantity; i += 1) {
      const ticketCode = await generateUniqueDisplayCode(
        connection,
        "tickets",
        "ticket_code",
        "TK",
      );
      ticketCodes.push(ticketCode);
    }

    const ticketValues = ticketCodes.map((ticketCode) => [
      ticketCode,
      drawId,
      userId,
    ]);

    await connection.query(
      "INSERT INTO tickets (ticket_code, draw_id, user_id) VALUES ?",
      [ticketValues as any],
    );

    await connection.query(
      "UPDATE draws SET tickets_sold = tickets_sold + ? WHERE id = ?",
      [quantity, drawId],
    );

    await connection.commit();

    return res.status(200).json({
      message: "Tickets purchased successfully.",
      quantity,
      totalCost,
      ticketCodes,
    });
  } catch (error) {
    await connection.rollback();
    return res.status(400).json({
      message:
        error instanceof Error ? error.message : "Ticket purchase failed.",
    });
  } finally {
    connection.release();
  }
});

export default router;
