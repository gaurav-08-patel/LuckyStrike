import { Router } from "express";
import type { RowDataPacket } from "mysql2";
import { dbPool } from "../config/db";
import { normalizePublicWinner, type PublicWinnerRow } from "../utils/winnerPublic";

const router = Router();

interface WinnerRow extends RowDataPacket, PublicWinnerRow {}

router.get("/winners", async (req, res) => {
  const limit = Number(req.query.limit ?? 12);
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 50) : 12;

  const [rows] = await dbPool.query<WinnerRow[]>(
    `SELECT *
     FROM winners
     ORDER BY announced_at DESC, id DESC
     LIMIT ?`,
    [safeLimit],
  );

  const winners = rows.map((row) => normalizePublicWinner(row));

  return res.status(200).json(winners);
});

export default router;
