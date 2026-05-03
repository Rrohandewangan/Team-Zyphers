import mongoose from "mongoose";
import { v4 as uuid } from "uuid";

const envelopeSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuid },
    userId: { type: String, required: true, index: true },
    fromDevice: { type: String, required: true },
    toDevice: { type: String, required: true, index: true },
    blobPath: { type: String, required: true },
    sha256: { type: String, required: true },
    sizeBytes: Number,
    status: {
      type: String,
      enum: ["pending", "delivered", "expired"],
      default: "pending",
      index: true,
    },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true, _id: false }
);

envelopeSchema.index({ toDevice: 1, status: 1 });

export const SyncEnvelopeModel = mongoose.model("SyncEnvelope", envelopeSchema);
