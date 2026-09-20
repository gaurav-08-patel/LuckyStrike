import { Router } from "express";
import type { RowDataPacket } from "mysql2";
import { dbPool } from "../config/db";
import { requireAuth } from "../middleware/auth";
import { updateWalletBalance } from "../utils/wallet";

const router = Router();

interface DbUserRow extends RowDataPacket {
  id: number;
  wallet_balance: string | number | null;
}

interface WalletTransactionRow extends RowDataPacket {
  id: number;
  user_id: number;
  type: string;
  amount: string | number;
  balance_after: string | number;
  reference_type: string | null;
  reference_id: number | null;
  created_at: Date | string;
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

router.post("/wallet/topup", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  const amount = Number(req.body?.amount);

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return res
      .status(400)
      .json({ message: "A valid amount greater than 0 is required." });
  }

  const connection = await dbPool.getConnection();

  try {
    await connection.beginTransaction();

    const balanceAfter = await updateWalletBalance(
      connection,
      userId,
      amount,
      "topup",
      "topup",
      null,
    );

    await connection.commit();

    return res.status(200).json({
      message: "Top-up successful.",
      balance: balanceAfter,
    });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({
      message: "Top-up failed.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  } finally {
    connection.release();
  }
});

router.get("/wallet/transactions", requireAuth, async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  const [rows] = await dbPool.query<WalletTransactionRow[]>(
    `SELECT *
     FROM wallet_transaction_history
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId],
  );

  return res.status(200).json(rows);
});

export default router;
