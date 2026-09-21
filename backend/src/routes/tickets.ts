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

interface MyTicketRow extends RowDataPacket {
  id: number;
  ticket_code: string;
  draw_id: number;
  user_id: number;
  status: string;
  created_at: Date | string;
  draw_code: string;
  draw_title: string;
  prize_title: string;
  prize_amount: string | number;
  ticket_price: string | number;
  draw_at: Date | string;
  expires_at: Date | string;
  draw_status: string;
}

router.get("/my-tickets", requireAuth, async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  const [rows] = await dbPool.query<MyTicketRow[]>(
    `SELECT
      t.id,
      t.ticket_code,
      t.draw_id,
      t.user_id,
      t.status,
      t.created_at,
      d.draw_code,
      d.title AS draw_title,
      d.prize_title,
      d.prize_amount,
      d.ticket_price,
      d.draw_at,
      d.expires_at,
      d.status AS draw_status
     FROM tickets t
     LEFT JOIN draws d ON d.id = t.draw_id
     WHERE t.user_id = ?
     ORDER BY t.created_at DESC`,
    [userId],
  );

  const tickets = rows.map((ticket) => ({
    id: ticket.id,
    ticketCode: ticket.ticket_code,
    status: ticket.status,
    createdAt: ticket.created_at,
    draw: {
      id: ticket.draw_id,
      drawCode: ticket.draw_code,
      title: ticket.draw_title,
      prizeTitle: ticket.prize_title,
      prizeAmount: Number(ticket.prize_amount),
      ticketPrice: Number(ticket.ticket_price),
      drawAt: ticket.draw_at,
      expiresAt: ticket.expires_at,
      status: ticket.draw_status,
    },
  }));

  return res.status(200).json({
    tickets,
    total: tickets.length,
  });
});

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
