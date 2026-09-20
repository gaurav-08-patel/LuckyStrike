import { Router } from "express";
import type { RowDataPacket } from "mysql2";
import { dbPool } from "../config/db";
import { requireAuth } from "../middleware/auth";

const router = Router();

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

router.patch("/:userId/profile", requireAuth, async (req, res) => {
  const { userId } = req.params;
  const authenticatedUserId = req.user?.id;

  if (!authenticatedUserId) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  if (Number(userId) !== authenticatedUserId) {
    return res.status(403).json({ message: "You can only update your own profile." });
  }

  const {
    firstName,
    lastName,
    email,
    gender,
    nationality,
    countryOfResidence,
  } = req.body;

  const [existingRows] = await dbPool.query<DbUserRow[]>(
    "SELECT * FROM users WHERE id = ? LIMIT 1",
    [userId],
  );

  const existingUser = existingRows[0];

  if (!existingUser) {
    return res.status(404).json({ message: "User not found." });
  }

  const nextFirstName =
    typeof firstName === "string"
      ? firstName.trim() || existingUser.first_name || ""
      : existingUser.first_name || "";
  const nextLastName =
    typeof lastName === "string"
      ? lastName.trim() || existingUser.last_name || ""
      : existingUser.last_name || "";
  const nextEmail =
    typeof email === "string" ? email.trim() : existingUser.email || "";
  const nextNationality =
    typeof nationality === "string"
      ? nationality.trim()
      : existingUser.nationality || "";
  const nextCountryOfResidence =
    typeof countryOfResidence === "string"
      ? countryOfResidence.trim()
      : existingUser.country_of_residence || "";

  let normalizedGender = existingUser.gender || "";
  if (typeof gender === "string") {
    const normalized = gender.trim().toLowerCase();
    if (["male", "female", "other"].includes(normalized)) {
      normalizedGender = normalized;
    }
  }

  await dbPool.query(
    `UPDATE users
     SET first_name = ?,
         last_name = ?,
         email = ?,
         gender = ?,
         nationality = ?,
         country_of_residence = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      nextFirstName,
      nextLastName,
      nextEmail,
      normalizedGender,
      nextNationality,
      nextCountryOfResidence,
      userId,
    ],
  );

  const [updatedRows] = await dbPool.query<DbUserRow[]>(
    "SELECT * FROM users WHERE id = ? LIMIT 1",
    [userId],
  );

  return res.status(200).json({
    message: "User profile updated successfully.",
    user: sanitizeUser(updatedRows[0]),
  });
});

export default router;
