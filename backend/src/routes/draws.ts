import { Router } from "express";
import type { RowDataPacket } from "mysql2";
import { dbPool } from "../config/db";

const router = Router();

interface DrawRow extends RowDataPacket {
  id: number;
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

export default router;
