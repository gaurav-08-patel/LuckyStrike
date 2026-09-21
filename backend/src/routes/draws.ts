import { Router } from "express";
import type { RowDataPacket } from "mysql2";
import { dbPool } from "../config/db";

const router = Router();

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

router.get("/draws", async (_req, res) => {
  const [rows] = await dbPool.query<DrawRow[]>(
    `SELECT *
     FROM draws
     WHERE status = 'active'
     ORDER BY draw_at ASC`,
  );

  return res.status(200).json(rows);
});

router.get("/draws/:id", async (req, res) => {
  const drawId = Number(req.params.id);

  if (!Number.isInteger(drawId) || drawId <= 0) {
    return res.status(400).json({ message: "Valid draw id is required." });
  }

  const [rows] = await dbPool.query<DrawRow[]>(
    "SELECT * FROM draws WHERE id = ? LIMIT 1",
    [drawId],
  );

  const draw = rows[0];

  if (!draw) {
    return res.status(404).json({ message: "Draw not found." });
  }

  const responseDraw = {
    ...draw,
    prize_amount: Number(draw.prize_amount),
    ticket_price: Number(draw.ticket_price),
    remaining_tickets: Number(draw.max_tickets) - Number(draw.tickets_sold),
  };

  return res.status(200).json(responseDraw);
});

export default router;
