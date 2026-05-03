import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { env } from "../config/env.js";

const userOrIp = (req, res) => req.user?.id || ipKeyGenerator(req, res);

export const globalLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIp,
});

export const aiLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.aiMax,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIp,
  message: { success: false, message: "AI rate limit exceeded" },
});

export const authLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) =>
    `${ipKeyGenerator(req, res)}:${req.body?.email || ""}`,
});
