import { Router } from "express";
import User from "../models/User";

const router = Router();
const OTP_TTL_MS = 5 * 60 * 1000;
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

const normalizePhoneNumber = (phoneNumber: string) => {
  return phoneNumber.replace(/\s+/g, "").trim();
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

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

  let user = await User.findOne({ phoneNumber });

  if (user) {
    user.isPhoneVerified = true;
    await user.save();

    return res.status(200).json({
      message: "Login successful.",
      isNewUser: false,
      user: sanitizeUser(user),
      redirectUrl: "/",
    });
  }

  user = await User.create({
    phoneNumber,
    firstName: "John",
    lastName: "Doe",
    walletBalance: 0,
    isPhoneVerified: true,
  });

  return res.status(201).json({
    message: "Account created successfully.",
    isNewUser: true,
    user: sanitizeUser(user),
    redirectUrl: "/whatsapp-verify-page",
  });
});

export default router;
