import { Router } from "express";
import type { RowDataPacket } from "mysql2";
import { dbPool } from "../config/db";
import { requireAuth } from "../middleware/auth";

const router = Router();

const VALID_DRAW_TYPES = ["daily", "weekly", "monthly"] as const;

interface DrawRow extends RowDataPacket {
  id: number;
  draw_code: string;
  draw_type: "daily" | "weekly" | "monthly";
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

router.get("/draws", async (req, res) => {
  const rawLimit = Number(req.query.limit ?? 5);
  const rawOffset = Number(req.query.offset ?? 0);
  const drawType = String(req.query.drawType ?? "all").toLowerCase();

  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 50) : 5;
  const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0;

  if (drawType !== "all" && !VALID_DRAW_TYPES.includes(drawType as any)) {
    return res.status(400).json({
      message: "drawType must be one of: all, daily, weekly, monthly.",
    });
  }

  const conditions: string[] = ["status = 'active'"];
  const params: unknown[] = [];

  if (drawType !== "all") {
    conditions.push("draw_type = ?");
    params.push(drawType);
  }

  const [countRows] = await dbPool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total
     FROM draws
     WHERE ${conditions.join(" AND ")}`,
    params,
  );

  const total = Number(countRows[0]?.total ?? 0);

  const query = `SELECT *
     FROM draws
     WHERE ${conditions.join(" AND ")}
     ORDER BY draw_at ASC
     LIMIT ? OFFSET ?`;

  const [rows] = await dbPool.query<DrawRow[]>(query, [
    ...params,
    limit,
    offset,
  ]);

  const draws = rows.map((draw) => ({
    ...draw,
    prize_amount: Number(draw.prize_amount),
    ticket_price: Number(draw.ticket_price),
    remaining_tickets: Number(draw.max_tickets) - Number(draw.tickets_sold),
  }));

  return res.status(200).json({
    draws,
    total,
    limit,
    offset,
    hasMore: offset + draws.length < total,
  });
});

router.get("/admin/draws", requireAuth, async (req, res) => {
  const status = String(req.query.status || "all").toLowerCase();
  const drawType = String(req.query.drawType || "all").toLowerCase();

  const allowedStatuses = ["active", "completed", "closed", "all"] as const;

  if (!allowedStatuses.includes(status as any)) {
    return res.status(400).json({
      message: "status must be one of: all, active, completed, closed.",
    });
  }

  if (drawType !== "all" && !VALID_DRAW_TYPES.includes(drawType as any)) {
    return res.status(400).json({
      message: "drawType must be one of: all, daily, weekly, monthly.",
    });
  }

  let query = "SELECT * FROM draws";
  const params: unknown[] = [];
  const conditions: string[] = [];

  if (status !== "all") {
    conditions.push("status = ?");
    params.push(status);
  }

  if (drawType !== "all") {
    conditions.push("draw_type = ?");
    params.push(drawType);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }

  query += " ORDER BY draw_at DESC";

  const [rows] = await dbPool.query<DrawRow[]>(query, params);

  const response = rows.map((draw) => ({
    ...draw,
    prize_amount: Number(draw.prize_amount),
    ticket_price: Number(draw.ticket_price),
    remaining_tickets: Number(draw.max_tickets) - Number(draw.tickets_sold),
  }));

  return res.status(200).json(response);
});

router.get("/draws/:id", async (req, res) => {
  const rawIdentifier = String(req.params.id ?? "").trim();

  if (!rawIdentifier) {
    return res
      .status(400)
      .json({ message: "Draw id or draw_code is required." });
  }

  const isNumericId = /^\d+$/.test(rawIdentifier);

  const query = isNumericId
    ? "SELECT * FROM draws WHERE id = ? LIMIT 1"
    : "SELECT * FROM draws WHERE LOWER(draw_code) = LOWER(?) LIMIT 1";

  const params = isNumericId ? [Number(rawIdentifier)] : [rawIdentifier];

  if (
    isNumericId &&
    (!Number.isInteger(Number(rawIdentifier)) || Number(rawIdentifier) <= 0)
  ) {
    return res.status(400).json({ message: "Valid draw id is required." });
  }

  const [rows] = await dbPool.query<DrawRow[]>(query, params);

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
