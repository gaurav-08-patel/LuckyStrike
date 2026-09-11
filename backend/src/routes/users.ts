import { Router } from "express";
import User from "../models/User";

const router = Router();

const sanitizeUser = (user: any) => ({
  id: user._id.toString(),
  _id: user._id.toString(),
  phoneNumber: user.phoneNumber,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email || "",
  gender: user.gender || "",
  nationality: user.nationality || "",
  countryOfResidence: user.countryOfResidence || "",
  walletBalance: user.walletBalance ?? 0,
  isPhoneVerified: user.isPhoneVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

router.patch("/:userId/profile", async (req, res) => {
  const { userId } = req.params;
  const {
    firstName,
    lastName,
    email,
    gender,
    nationality,
    countryOfResidence,
  } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  if (typeof firstName === "string")
    user.firstName = firstName.trim() || user.firstName;
  if (typeof lastName === "string")
    user.lastName = lastName.trim() || user.lastName;
  if (typeof email === "string") user.email = email.trim();

  if (typeof gender === "string") {
    const normalizedGender = gender.trim().toLowerCase();
    if (["male", "female", "other"].includes(normalizedGender)) {
      user.gender = normalizedGender as "male" | "female" | "other";
    }
  }

  if (typeof nationality === "string") user.nationality = nationality.trim();
  if (typeof countryOfResidence === "string")
    user.countryOfResidence = countryOfResidence.trim();

  await user.save();

  return res.status(200).json({
    message: "User profile updated successfully.",
    user: sanitizeUser(user),
  });
});

export default router;
