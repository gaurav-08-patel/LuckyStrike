import { Router } from "express";
import type { RowDataPacket } from "mysql2";
import { dbPool } from "../config/db";
import { requireAuth } from "../middleware/auth";

const router = Router();

interface DbUserRow extends RowDataPacket {
  wallet_balance: string | number | null;
}

router.get("/wallet", requireAuth, async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  const [rows] = await dbPool.query<DbUserRow[]>(
    "SELECT wallet_balance FROM users WHERE id = ? LIMIT 1",
    [userId],
  );

  const user = rows[0];

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  return res.status(200).json({
    balance: Number(user.wallet_balance ?? 0),
  });
});

export default router;
