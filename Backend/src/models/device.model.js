import mongoose from "mongoose";
import { v4 as uuid } from "uuid";

const deviceSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuid },
    userId: { type: String, required: true, index: true },
    platform: { type: String, enum: ["web", "android", "ios"], required: true },
    name: String,
    pushToken: String,
    publicKey: String,
    lastSeenAt: { type: Date, default: Date.now },
    revokedAt: Date,
  },
  { timestamps: true, _id: false }
);

deviceSchema.index({ userId: 1, revokedAt: 1 });

export const DeviceModel = mongoose.model("Device", deviceSchema);
