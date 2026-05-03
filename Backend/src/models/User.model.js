import mongoose from "mongoose";
import { v4 as uuid } from "uuid";

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuid },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, trim: true, sparse: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, trim: true },
    locale: { type: String, default: "en-IN" },
    age: { type: Number },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    bloodGroup: { type: String },
    emergencyContact: { type: String, trim: true },
    profileComplete: { type: Boolean, default: false },
  },
  { timestamps: true, _id: false }
);

userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const UserModel = mongoose.model("User", userSchema);
