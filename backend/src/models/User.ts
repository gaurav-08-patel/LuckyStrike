import { Schema, model, type Document, type Types } from "mongoose";

export type Gender = "male" | "female" | "other";

export interface IUser extends Document {
  phoneNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  gender?: Gender;
  nationality?: string;
  countryOfResidence?: string;
  walletBalance: number;
  isPhoneVerified: boolean;
  otp?: string;
  otpExpiresAt?: Date | null;
  cart?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    firstName: {
      type: String,
      default: "John",
      trim: true,
    },
    lastName: {
      type: String,
      default: "Doe",
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", ""],
      default: "",
    },
    nationality: {
      type: String,
      default: "",
      trim: true,
    },
    countryOfResidence: {
      type: String,
      default: "",
      trim: true,
    },
    walletBalance: {
      type: Number,
      default: 0,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      default: "",
    },
    otpExpiresAt: {
      type: Date,
      default: null,
    },
    cart: {
      type: Schema.Types.ObjectId,
      ref: "Cart",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const User = model<IUser>("User", userSchema);

export default User;
