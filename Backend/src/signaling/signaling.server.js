import http from "node:http";
import { WebSocketServer } from "ws";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { tokenService } from "../services/auth/token.service.js";
import { signalingService } from "../services/sync/signaling.service.js";
import { deviceRepo } from "../repositories/device.repo.js";
import connectDB, { disconnectDB } from "../db/dbconnect.js";

const PING_INTERVAL_MS = 30_000;

function authenticate(req) {
  try {
    const url = new URL(req.url, "http://x");
    const token =
      url.searchParams.get("token") ||
      (req.headers["sec-websocket-protocol"] || "")
        .split(",")
        .map((s) => s.trim())
        .find(Boolean);
    if (!token) return null;
    const payload = tokenService.verifyAccess(token);
    return { userId: payload.sub, deviceId: payload.deviceId };
  } catch {
    return null;
  }
}

async function start() {
  await connectDB();

  const server = http.createServer((_req, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "vitalis-signaling" }));
  });

  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 64 * 1024,
  });

  wss.on("connection", async (ws, req) => {
    const auth = authenticate(req);
    if (!auth) {
      ws.close(1008, "unauthorized");
      return;
    }
    ws.deviceId = auth.deviceId;
    ws.userId = auth.userId;
    ws.isAlive = true;

    signalingService.register(auth.deviceId, ws);
    await deviceRepo.touch(auth.deviceId);
    logger.info("[ws] connected", {
      deviceId: auth.deviceId,
      userId: auth.userId,
    });

    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("message", async (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return ws.send(
          JSON.stringify({ type: "error", message: "invalid_json" })
        );
      }

      if (msg.type === "ping") return ws.send(JSON.stringify({ type: "pong" }));

      if (msg.type !== "signal" || typeof msg.to !== "string") {
        return ws.send(
          JSON.stringify({ type: "error", message: "invalid_message" })
        );
      }

      const target = await deviceRepo.findById(msg.to);
      if (!target || target.userId !== auth.userId || target.revokedAt) {
        return ws.send(
          JSON.stringify({ type: "error", message: "peer_forbidden" })
        );
      }

      const ok = signalingService.relay(msg.to, {
        type: "signal",
        from: auth.deviceId,
        payload: msg.payload,
      });
      if (!ok)
        ws.send(JSON.stringify({ type: "peer_offline", deviceId: msg.to }));
    });

    ws.on("close", () => {
      signalingService.unregister(auth.deviceId);
      logger.info("[ws] disconnected", { deviceId: auth.deviceId });
    });
  });

  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      try {
        ws.ping();
      } catch {
        
      }
    });
  }, PING_INTERVAL_MS);

  server.listen(env.signalingPort, () => {
    logger.info(`[ws] vitalis-signaling listening on :${env.signalingPort}`);
  });

  const shutdown = async () => {
    clearInterval(interval);
    wss.close();
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

start().catch((err) => {
  logger.error("[ws] boot failed", { error: err.message, stack: err.stack });
  process.exit(1);
});
