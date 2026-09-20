import type { Pool, PoolConnection } from "mysql2/promise";
import type { RowDataPacket } from "mysql2";

export type WalletMovementType =
  | "topup"
  | "withdrawal"
  | "prize_credit"
  | "ticket_purchase";

export type WalletDbConnection = Pool | PoolConnection;

interface UserBalanceRow extends RowDataPacket {
  wallet_balance: string | number | null;
}

export const updateWalletBalance = async (
  connection: WalletDbConnection,
  userId: number,
  amount: number,
  type: WalletMovementType,
  referenceType: string | null = null,
  referenceId: number | null = null,
): Promise<number> => {
  await connection.query(
    "UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?",
    [amount, userId],
  );

  const [rows] = await connection.query<UserBalanceRow[]>(
    "SELECT wallet_balance FROM users WHERE id = ? LIMIT 1",
    [userId],
  );

  const balanceAfter = Number(rows[0]?.wallet_balance ?? 0);

  await connection.query(
    `INSERT INTO wallet_transaction_history
      (user_id, type, amount, balance_after, reference_type, reference_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, type, amount, balanceAfter, referenceType, referenceId],
  );

  return balanceAfter;
};
