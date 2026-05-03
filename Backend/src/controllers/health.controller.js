import mongoose from "mongoose";

export const healthController = {
  live: (_req, res) => res.json({ status: "ok" }),
  ready: (_req, res) => {
    const mongoOk = mongoose.connection.readyState === 1;
    const status = mongoOk ? 200 : 503;
    res
      .status(status)
      .json({ status: mongoOk ? "ok" : "degraded", mongo: mongoOk });
  },
};
