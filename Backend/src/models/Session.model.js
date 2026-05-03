import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    deviceIds: { type: [String], default: [] },
    severity: {
      type: String,
      enum: ["mild", "moderate", "critical", null],
      default: null,
    },
    summaryHash: String,
    lastActiveAt: { type: Date, default: Date.now, index: true },
    metadata: {
      msgCount: { type: Number, default: 0 },
      locale: String,
      modelVersion: String,
    },
    version: { type: Number, default: 1 },
  },
  { timestamps: true, _id: false }
);

sessionSchema.index({ userId: 1, lastActiveAt: -1 });

export const SessionModel = mongoose.model("Session", sessionSchema);
