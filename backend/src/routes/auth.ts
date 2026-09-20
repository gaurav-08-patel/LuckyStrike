import { Router } from "express";
import jwt from "jsonwebtoken";
import type { RowDataPacket } from "mysql2";
import { dbPool } from "../config/db";
import { requireAuth } from "../middleware/auth";

const router = Router();
const OTP_TTL_MS = 5 * 60 * 1000;
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

interface DbUserRow extends RowDataPacket {
  id: number;
  phone_number: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  gender: string | null;
  nationality: string | null;
  country_of_residence: string | null;
  wallet_balance: string | number | null;
  is_phone_verified: number | boolean;
  is_admin: number | boolean;
  created_at: Date | string | null;
  updated_at: Date | string | null;
}

const normalizePhoneNumber = (phoneNumber: string) => {
  return phoneNumber.replace(/\s+/g, "").trim();
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sanitizeUser = (user: DbUserRow) => ({
  id: user.id,
  phoneNumber: user.phone_number,
  firstName: user.first_name || "",
  lastName: user.last_name || "",
  email: user.email || "",
  gender: user.gender || "",
  nationality: user.nationality || "",
  countryOfResidence: user.country_of_residence || "",
  walletBalance: Number(user.wallet_balance ?? 0),
  isPhoneVerified: Boolean(user.is_phone_verified),
  isAdmin: Boolean(user.is_admin),
  createdAt: user.created_at,
  updatedAt: user.updated_at,
});

router.post("/request-otp", async (req, res) => {
  const phoneNumber = normalizePhoneNumber(String(req.body?.phoneNumber || ""));

  if (!phoneNumber) {
    return res.status(400).json({ message: "Phone number is required." });
  }

  const otp = generateOtp();
  otpStore.set(phoneNumber, {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
  });

  return res.status(200).json({
    message: "OTP sent successfully.",
    phoneNumber,
    otp,
    isOtpPreview: true,
  });
});

router.post("/login-signup", async (req, res) => {
  const phoneNumber = normalizePhoneNumber(String(req.body?.phoneNumber || ""));
  const otp = String(req.body?.otp || "");

  if (!phoneNumber) {
    return res.status(400).json({ message: "Phone number is required." });
  }

  if (!otp) {
    const generatedOtp = generateOtp();
    otpStore.set(phoneNumber, {
      otp: generatedOtp,
      expiresAt: Date.now() + OTP_TTL_MS,
    });

    return res.status(200).json({
      message: "OTP sent successfully.",
      phoneNumber,
      otp: generatedOtp,
      isOtpPreview: true,
    });
  }

  const otpData = otpStore.get(phoneNumber);

  if (!otpData) {
    return res
      .status(400)
      .json({ message: "No OTP found for this phone number." });
  }

  const isOtpValid = otpData.otp === otp && Date.now() < otpData.expiresAt;

  if (!isOtpValid) {
    return res.status(400).json({ message: "Invalid or expired OTP." });
  }

  otpStore.delete(phoneNumber);

  const [existingRows] = await dbPool.query<DbUserRow[]>(
    "SELECT * FROM users WHERE phone_number = ? LIMIT 1",
    [phoneNumber],
  );

  const existingUser = existingRows[0];

  if (existingUser) {
    await dbPool.query(
      "UPDATE users SET is_phone_verified = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [existingUser.id],
    );

    const [updatedRows] = await dbPool.query<DbUserRow[]>(
      "SELECT * FROM users WHERE id = ? LIMIT 1",
      [existingUser.id],
    );

    const user = updatedRows[0];
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || "dev-secret",
      { expiresIn: "30d" },
    );

    return res.status(200).json({
      message: "Login successful.",
      isNewUser: false,
      user: sanitizeUser(user),
      token,
      redirectUrl: "/",
    });
  }

  const [insertResult] = await dbPool.query(
    "INSERT INTO users (phone_number, first_name, last_name, wallet_balance, is_phone_verified, is_admin) VALUES (?, ?, ?, 0, TRUE, FALSE)",
    [phoneNumber, "John", "Doe"],
  );

  const insertId = (insertResult as { insertId: number }).insertId;

  const [newRows] = await dbPool.query<DbUserRow[]>(
    "SELECT * FROM users WHERE id = ? LIMIT 1",
    [insertId],
  );

  const user = newRows[0];
  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: "30d" },
  );

  return res.status(201).json({
    message: "Account created successfully.",
    isNewUser: true,
    user: sanitizeUser(user),
    token,
    redirectUrl: "/whatsapp-verify-page",
  });
});

router.get("/me", requireAuth, async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  const [rows] = await dbPool.query<DbUserRow[]>(
    "SELECT * FROM users WHERE id = ? LIMIT 1",
    [userId],
  );

  const user = rows[0];

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  return res.status(200).json({
    valid: true,
    user: sanitizeUser(user),
  });
});

export default router;
