import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { dbPool } from "../config/db";
import { requireAuth } from "../middleware/auth";
import { parseDbBooleanFlag } from "../utils/flags";

const router = Router();

interface RouteErrorShape {
  status: number;
  message: string;
}

interface UserBalanceRow extends RowDataPacket {
  wallet_balance: string | number | null;
  pending_withdrawal_amount: string | number | null;
}

interface BankAccountRow extends RowDataPacket {
  id: number;
  user_id: number;
  account_holder_name: string;
  bank_name: string;
  bank_country: string | null;
  account_number: string;
  iban: string | null;
  ifsc_code: string | null;
  swift_code: string | null;
  branch_name: string | null;
  routing_number: string | null;
  is_default: number | boolean | string | null;
  is_verified: number | boolean | string | null;
  verification_note: string | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
}

interface WithdrawalRequestRow extends RowDataPacket {
  id: number;
  user_id: number;
  bank_account_id: number;
  amount: string | number;
  currency: string;
  status: string;
  request_note: string | null;
  admin_note: string | null;
  reviewed_by_admin_id: number | null;
  reviewed_at: Date | string | null;
  paid_at: Date | string | null;
  payment_reference: string | null;
  rejection_reason: string | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
  account_holder_name: string | null;
  bank_name: string | null;
  bank_country: string | null;
  account_number: string | null;
  iban: string | null;
  ifsc_code: string | null;
  swift_code: string | null;
  branch_name: string | null;
  routing_number: string | null;
  is_default: number | boolean | string | null;
}

const normalizeOptionalText = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const parseRequiredText = (value: unknown, fieldName: string): string => {
  if (typeof value !== "string" || !value.trim()) {
    throw {
      status: 400,
      message: `${fieldName} is required.`,
    } satisfies RouteErrorShape;
  }

  return value.trim();
};

const getRouteError = (error: unknown): RouteErrorShape | null => {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    "message" in error &&
    typeof (error as RouteErrorShape).status === "number" &&
    typeof (error as RouteErrorShape).message === "string"
  ) {
    return error as RouteErrorShape;
  }

  return null;
};

const serializeBankAccount = (row: BankAccountRow) => ({
  id: row.id,
  userId: row.user_id,
  accountHolderName: row.account_holder_name,
  bankName: row.bank_name,
  bankCountry: row.bank_country,
  accountNumber: row.account_number,
  iban: row.iban,
  ifscCode: row.ifsc_code,
  swiftCode: row.swift_code,
  branchName: row.branch_name,
  routingNumber: row.routing_number,
  isDefault: parseDbBooleanFlag(row.is_default),
  isVerified: parseDbBooleanFlag(row.is_verified),
  verificationNote: row.verification_note,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const serializeWithdrawalRequest = (row: WithdrawalRequestRow) => ({
  id: row.id,
  userId: row.user_id,
  bankAccountId: row.bank_account_id,
  amount: Number(row.amount),
  currency: row.currency,
  status: row.status,
  requestNote: row.request_note,
  adminNote: row.admin_note,
  reviewedByAdminId: row.reviewed_by_admin_id,
  reviewedAt: row.reviewed_at,
  paidAt: row.paid_at,
  paymentReference: row.payment_reference,
  rejectionReason: row.rejection_reason,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  bankAccount: {
    accountHolderName: row.account_holder_name,
    bankName: row.bank_name,
    bankCountry: row.bank_country,
    accountNumber: row.account_number,
    iban: row.iban,
    ifscCode: row.ifsc_code,
    swiftCode: row.swift_code,
    branchName: row.branch_name,
    routingNumber: row.routing_number,
    isDefault: parseDbBooleanFlag(row.is_default),
  },
});

router.get("/withdrawals/bank-accounts", requireAuth, async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  const [rows] = await dbPool.query<BankAccountRow[]>(
    `SELECT *
     FROM user_bank_accounts
     WHERE user_id = ?
     ORDER BY is_default DESC, updated_at DESC, id DESC`,
    [userId],
  );

  return res.status(200).json({
    count: rows.length,
    bankAccounts: rows.map(serializeBankAccount),
  });
});

router.post("/withdrawals/bank-accounts", requireAuth, async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  const rawBankAccountId = req.body?.bankAccountId;
  const hasBankAccountId = rawBankAccountId !== undefined && rawBankAccountId !== null;
  const bankAccountId = hasBankAccountId ? Number(rawBankAccountId) : null;

  if (hasBankAccountId && (!Number.isInteger(bankAccountId) || (bankAccountId ?? 0) <= 0)) {
    return res.status(400).json({ message: "bankAccountId must be a positive integer." });
  }

  let accountHolderName: string;
  let bankName: string;
  let accountNumber: string;

  try {
    accountHolderName = parseRequiredText(req.body?.accountHolderName, "accountHolderName");
    bankName = parseRequiredText(req.body?.bankName, "bankName");
    accountNumber = parseRequiredText(req.body?.accountNumber, "accountNumber");
  } catch (error) {
    const routeError = getRouteError(error);
    if (routeError) {
      return res.status(routeError.status).json({ message: routeError.message });
    }

    return res.status(500).json({ message: "Unable to validate bank account payload." });
  }

  const bankCountry = normalizeOptionalText(req.body?.bankCountry);
  const iban = normalizeOptionalText(req.body?.iban);
  const ifscCode = normalizeOptionalText(req.body?.ifscCode);
  const swiftCode = normalizeOptionalText(req.body?.swiftCode);
  const branchName = normalizeOptionalText(req.body?.branchName);
  const routingNumber = normalizeOptionalText(req.body?.routingNumber);
  const isDefault = parseDbBooleanFlag(req.body?.isDefault);

  const connection = await dbPool.getConnection();

  try {
    await connection.beginTransaction();

    let targetBankAccountId = bankAccountId;

    if (bankAccountId) {
      const [existingRows] = await connection.query<BankAccountRow[]>(
        "SELECT * FROM user_bank_accounts WHERE id = ? AND user_id = ? FOR UPDATE",
        [bankAccountId, userId],
      );

      if (!existingRows[0]) {
        throw {
          status: 404,
          message: "Bank account not found.",
        } satisfies RouteErrorShape;
      }

      if (isDefault) {
        await connection.query(
          "UPDATE user_bank_accounts SET is_default = FALSE WHERE user_id = ?",
          [userId],
        );
      }

      await connection.query(
        `UPDATE user_bank_accounts
         SET account_holder_name = ?, bank_name = ?, bank_country = ?, account_number = ?,
             iban = ?, ifsc_code = ?, swift_code = ?, branch_name = ?, routing_number = ?,
             is_default = ?, updated_at = UTC_TIMESTAMP()
         WHERE id = ? AND user_id = ?`,
        [
          accountHolderName,
          bankName,
          bankCountry,
          accountNumber,
          iban,
          ifscCode,
          swiftCode,
          branchName,
          routingNumber,
          isDefault,
          bankAccountId,
          userId,
        ],
      );
    } else {
      const [countRows] = await connection.query<RowDataPacket[]>(
        "SELECT COUNT(*) AS total FROM user_bank_accounts WHERE user_id = ? FOR UPDATE",
        [userId],
      );

      const totalAccounts = Number(countRows[0]?.total ?? 0);
      const shouldSetDefault = isDefault || totalAccounts === 0;

      if (shouldSetDefault) {
        await connection.query(
          "UPDATE user_bank_accounts SET is_default = FALSE WHERE user_id = ?",
          [userId],
        );
      }

      const [insertResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO user_bank_accounts
          (user_id, account_holder_name, bank_name, bank_country, account_number, iban, ifsc_code, swift_code, branch_name, routing_number, is_default)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          accountHolderName,
          bankName,
          bankCountry,
          accountNumber,
          iban,
          ifscCode,
          swiftCode,
          branchName,
          routingNumber,
          shouldSetDefault,
        ],
      );

      targetBankAccountId = insertResult.insertId;
    }

    const [savedRows] = await connection.query<BankAccountRow[]>(
      "SELECT * FROM user_bank_accounts WHERE id = ? AND user_id = ? LIMIT 1",
      [targetBankAccountId, userId],
    );

    await connection.commit();

    return res.status(bankAccountId ? 200 : 201).json({
      message: bankAccountId ? "Bank account updated." : "Bank account added.",
      bankAccount: savedRows[0] ? serializeBankAccount(savedRows[0]) : null,
    });
  } catch (error) {
    await connection.rollback();

    const routeError = getRouteError(error);
    if (routeError) {
      return res.status(routeError.status).json({ message: routeError.message });
    }

    return res.status(500).json({
      message: error instanceof Error ? error.message : "Unable to save bank account.",
    });
  } finally {
    connection.release();
  }
});

router.post("/withdrawals/request", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  const bankAccountId = Number(req.body?.bankAccountId);
  const amount = Number(req.body?.amount);
  const note = normalizeOptionalText(req.body?.note);

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  if (!Number.isInteger(bankAccountId) || bankAccountId <= 0) {
    return res.status(400).json({ message: "bankAccountId must be a positive integer." });
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ message: "amount must be greater than 0." });
  }

  const connection = await dbPool.getConnection();

  try {
    await connection.beginTransaction();

    const [userRows] = await connection.query<UserBalanceRow[]>(
      "SELECT wallet_balance, pending_withdrawal_amount FROM users WHERE id = ? FOR UPDATE",
      [userId],
    );

    if (!userRows[0]) {
      throw {
        status: 404,
        message: "User not found.",
      } satisfies RouteErrorShape;
    }

    const [bankAccountRows] = await connection.query<BankAccountRow[]>(
      "SELECT * FROM user_bank_accounts WHERE id = ? AND user_id = ? FOR UPDATE",
      [bankAccountId, userId],
    );

    if (!bankAccountRows[0]) {
      throw {
        status: 404,
        message: "Selected bank account was not found for this user.",
      } satisfies RouteErrorShape;
    }

    const walletBalance = Number(userRows[0].wallet_balance ?? 0);
    const pendingWithdrawalAmount = Number(userRows[0].pending_withdrawal_amount ?? 0);
    const availableBalance = Math.max(walletBalance - pendingWithdrawalAmount, 0);

    if (amount > availableBalance) {
      throw {
        status: 400,
        message: "Insufficient available wallet balance for this withdrawal request.",
      } satisfies RouteErrorShape;
    }

    const [insertResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO withdrawal_requests
        (user_id, bank_account_id, amount, status, request_note, created_at, updated_at)
       VALUES (?, ?, ?, 'pending', ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
      [userId, bankAccountId, amount, note],
    );

    await connection.query(
      "UPDATE users SET pending_withdrawal_amount = pending_withdrawal_amount + ? WHERE id = ?",
      [amount, userId],
    );

    await connection.query(
      `INSERT INTO withdrawal_audit_logs
        (withdrawal_request_id, actor_user_id, actor_role, action, old_status, new_status, note, created_at)
       VALUES (?, ?, 'user', 'requested', NULL, 'pending', ?, UTC_TIMESTAMP())`,
      [
        insertResult.insertId,
        userId,
        note || "Withdrawal request submitted.",
      ],
    );

    await connection.commit();

    return res.status(201).json({
      message: "Withdrawal request submitted.",
      requestId: insertResult.insertId,
      status: "pending",
      availableBalanceAfterRequest: availableBalance - amount,
      pendingWithdrawalAmount: pendingWithdrawalAmount + amount,
    });
  } catch (error) {
    await connection.rollback();

    const routeError = getRouteError(error);
    if (routeError) {
      return res.status(routeError.status).json({ message: routeError.message });
    }

    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Unable to submit withdrawal request.",
    });
  } finally {
    connection.release();
  }
});

router.get("/withdrawals/my-requests", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  const rawStatus = typeof req.query.status === "string" ? req.query.status : "all";
  const statusFilter = rawStatus.trim().toLowerCase();
  const validStatuses = new Set([
    "all",
    "pending",
    "under_review",
    "approved",
    "rejected",
    "paid",
    "cancelled",
  ]);

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  if (!validStatuses.has(statusFilter)) {
    return res.status(400).json({
      message:
        "status must be one of: all, pending, under_review, approved, rejected, paid, cancelled.",
    });
  }

  let query = `SELECT wr.*,
      uba.account_holder_name, uba.bank_name, uba.bank_country, uba.account_number,
      uba.iban, uba.ifsc_code, uba.swift_code, uba.branch_name, uba.routing_number, uba.is_default
    FROM withdrawal_requests wr
    LEFT JOIN user_bank_accounts uba ON uba.id = wr.bank_account_id
    WHERE wr.user_id = ?`;
  const params: Array<string | number> = [userId];

  if (statusFilter !== "all") {
    query += " AND wr.status = ?";
    params.push(statusFilter);
  }

  query += " ORDER BY wr.created_at DESC";

  const [rows] = await dbPool.query<WithdrawalRequestRow[]>(query, params);

  return res.status(200).json({
    count: rows.length,
    requests: rows.map(serializeWithdrawalRequest),
  });
});

export default router;
