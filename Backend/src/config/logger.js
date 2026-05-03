import winston from "winston";
import { AsyncLocalStorage } from "node:async_hooks";
import { env } from "./env.js";

export const als = new AsyncLocalStorage();

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordHash",
  "token",
  "accessToken",
  "refreshToken",
  "authorization",
  "apiKey",
  "api_key",
  "secret",
  "prompt",
  "messages",
  "content",
  "answer",
  "response",
]);

const redact = winston.format((info) => {
  const walk = (obj) => {
    if (!obj || typeof obj !== "object") return;
    for (const k of Object.keys(obj)) {
      if (SENSITIVE_KEYS.has(k)) obj[k] = "[REDACTED]";
      else if (typeof obj[k] === "object") walk(obj[k]);
    }
  };
  walk(info);
  return info;
});

const correlation = winston.format((info) => {
  const store = als.getStore();
  if (store?.correlationId) info.correlationId = store.correlationId;
  if (store?.userId) info.userId = store.userId;
  return info;
});

export const logger = winston.createLogger({
  level: env.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    correlation(),
    redact(),
    env.isProd
      ? winston.format.json()
      : winston.format.prettyPrint({ colorize: true })
  ),
  transports: [new winston.transports.Console()],
});
