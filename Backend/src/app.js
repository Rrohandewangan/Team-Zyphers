import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";

import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { correlationId } from "./middleware/correlationId.middleware.js";
import { globalLimiter } from "./middleware/rateLimit.middleware.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";

import apiRoutes from "./routes/index.js";
import healthRoutes from "./routes/health.routes.js";
import { buildContainer } from "./config/container.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigins.length ? env.corsOrigins : true,
    credentials: false,
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(correlationId);
app.use(
  morgan(env.isProd ? "combined" : "dev", {
    stream: {
      write: (msg) => logger.http?.(msg.trim()) || logger.info(msg.trim()),
    },
  })
);

app.use("/health", healthRoutes);

app.use("/api/v1", globalLimiter, apiRoutes);

app.use(notFound);
app.use(errorHandler);

buildContainer();

export default app;
