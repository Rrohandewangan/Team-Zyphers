import { asyncHandler } from "../utils/asyncHandler.js";
import { buildContainer } from "../config/container.js";
import { ok } from "../middleware/error.middleware.js";

const SEVERITY_MAP = {
  mild: "ROUTINE",
  moderate: "URGENT",
  critical: "EMERGENCY",
};

const normalizeResult = (result) => ({
  severity: SEVERITY_MAP[result.severity] || "INFO",
  confidence: result.confidence ?? 0,
  summary: result.summary,
  advice: result.recommendations || [],
  redFlags: result.redFlags || [],
  language: result.language,
  modelVersion: result.modelVersion,
  facilities: result.facilities || [],
});

export const aiController = {
  triage: asyncHandler(async (req, res) => {
    const { aiOrchestrator } = buildContainer();
    const result = await aiOrchestrator.triage({
      userId: req.user.id,
      sessionId: req.body.sessionId,
      deviceId: req.user.deviceId,
      input: {
        symptoms: req.body.symptoms,
        age: req.body.age,
        sex: req.body.sex,
        history: req.body.history,
        locale: req.body.locale,
      },
      coords:
        typeof req.body.lat === "number" && typeof req.body.lng === "number"
          ? { lat: req.body.lat, lng: req.body.lng }
          : undefined,
    });

    ok(res, normalizeResult(result));
  }),

  triageStream: asyncHandler(async (req, res) => {
    const { aiOrchestrator } = buildContainer();

    res.status(200).set({
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    });
    res.flushHeaders?.();

    const send = (obj) => {
      res.write(`data: ${JSON.stringify(obj)}\n\n`);
    };

    const ping = setInterval(() => res.write(": ping\n\n"), 15_000);
    req.on("close", () => clearInterval(ping));

    try {
      for await (const ev of aiOrchestrator.streamTriage({
        userId: req.user.id,
        sessionId: req.body.sessionId,
        deviceId: req.user.deviceId,
        input: {
          symptoms: req.body.symptoms,
          age: req.body.age,
          sex: req.body.sex,
          history: req.body.history,
          locale: req.body.locale,
        },
        coords:
          typeof req.body.lat === "number" && typeof req.body.lng === "number"
            ? { lat: req.body.lat, lng: req.body.lng }
            : undefined,
      })) {
        if (ev.type === "final") {
          send({ type: "final", result: normalizeResult(ev.result) });
        } else {
          send(ev);
        }
      }
    } catch (err) {
      send({ type: "error", message: err.message || "Stream failed" });
    } finally {
      clearInterval(ping);
      res.end();
    }
  }),
};
