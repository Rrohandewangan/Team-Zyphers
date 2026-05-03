import mongoose from "mongoose";
import { v4 as uuid } from "uuid";

const refreshTokenSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuid },
    userId: { type: String, required: true, index: true },
    deviceId: { type: String, required: true, index: true },
    familyId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    revokedAt: Date,
    replacedBy: String,
  },
  { timestamps: true, _id: false }
);

export const RefreshTokenModel = mongoose.model(
  "RefreshToken",
  refreshTokenSchema
);
