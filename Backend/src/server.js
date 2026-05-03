import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import connectDB, { disconnectDB } from "./db/dbconnect.js";
import app from "./app.js";

const start = async () => {
  await connectDB();

  const server = app.listen(env.port, () => {
    logger.info(`[http] vitalis-api listening on :${env.port}`);
  });

  const shutdown = async (signal) => {
    logger.info(`[shutdown] received ${signal}`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("unhandledRejection", (err) =>
    logger.error("[unhandledRejection]", { err })
  );
  process.on("uncaughtException", (err) => {
    logger.error("[uncaughtException]", { err });
    process.exit(1);
  });
};

start().catch((err) => {
  logger.error("[boot] failed", { error: err.message, stack: err.stack });
  process.exit(1);
});
