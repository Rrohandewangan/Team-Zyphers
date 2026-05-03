import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    text: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

messageSchema.index({ sessionId: 1, createdAt: 1 });

export const MessageModel = mongoose.model("Message", messageSchema);
