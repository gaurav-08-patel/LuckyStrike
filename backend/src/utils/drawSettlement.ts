import crypto from "node:crypto";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { updateWalletBalance } from "./wallet";

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

interface SettledDrawResult {
  drawId: number;
  drawStatus: "completed";
  winnerUserId: number;
  winningTicketId: number;
  winningTicketCode: string;
  prizeAmount: number;
  totalTickets: number;
}

export const settleDraw = async (
  connection: PoolConnection,
  drawId: number,
): Promise<SettledDrawResult> => {
  await connection.beginTransaction();

  try {
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
    const hashHex = crypto.createHash("sha256").update(seedInput).digest("hex");

    const winnerIndex = Number(
      BigInt(`0x${hashHex}`) % BigInt(ticketRows.length),
    );

    const winningTicket = ticketRows[winnerIndex];
    const winnerUserId = winningTicket.user_id;
    const prizeAmount = Number(draw.prize_amount);

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

    await updateWalletBalance(
      connection,
      winnerUserId,
      prizeAmount,
      "prize_credit",
      "draw",
      drawId,
    );

    await connection.commit();

    return {
      drawId,
      drawStatus: "completed",
      winnerUserId,
      winningTicketId: winningTicket.id,
      winningTicketCode: winningTicket.ticket_code,
      prizeAmount,
      totalTickets: ticketRows.length,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  }
};
