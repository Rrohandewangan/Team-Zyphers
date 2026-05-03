import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { logger } from "../config/logger.js";
import { env } from "../config/env.js";

export const errorHandler = (err, req, res, _next) => {
  const isApi = err instanceof ApiError;
  const status = isApi ? err.statusCode : 500;

  if (status >= 500) {
    logger.error("[error] unhandled", {
      message: err.message,
      stack: err.stack,
    });
  } else {
    logger.warn("[error] handled", { message: err.message, status });
  }

  res.status(status).json({
    success: false,
    message: err.message || "Internal server error",
    errors: isApi ? err.errors : undefined,
    stack: env.isProd ? undefined : err.stack,
  });
};

export const notFound = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const ok = (res, data, message, status = 200) =>
  res.status(status).json(new ApiResponse(status, data, message));
