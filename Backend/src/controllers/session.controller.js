import { asyncHandler } from "../utils/asyncHandler.js";
import { sessionService } from "../services/session/session.service.js";
import { ok } from "../middleware/error.middleware.js";

const SEVERITY_MAP = {
  mild: "ROUTINE",
  moderate: "URGENT",
  critical: "EMERGENCY",
};

const normalizeSession = (s) => ({
  id: s._id ?? s.id,
  severity: s.severity ? SEVERITY_MAP[s.severity] || "INFO" : undefined,
  lastActiveAt: s.lastActiveAt,
  metadata: s.metadata,
  deviceIds: s.deviceIds,
  version: s.version,
});

export const sessionController = {
  create: asyncHandler(async (req, res) => {
    const session = await sessionService.createOrUpdate({
      sessionId: req.body.sessionId,
      userId: req.user.id,
      deviceId: req.user.deviceId,
      locale: req.body.locale,
    });
    ok(res, { session: normalizeSession(session) }, "Session upserted", 201);
  }),

  list: asyncHandler(async (req, res) => {
    const sessions = await sessionService.list({
      userId: req.user.id,
      limit: req.query.limit,
      cursor: req.query.cursor,
    });
    ok(res, { items: sessions.map(normalizeSession) });
  }),

  get: asyncHandler(async (req, res) => {
    const session = await sessionService.get({
      id: req.params.id,
      userId: req.user.id,
    });
    ok(res, { session: normalizeSession(session) });
  }),

  patch: asyncHandler(async (req, res) => {
    const { expectedVersion, ...patch } = req.body;
    const session = await sessionService.patch({
      id: req.params.id,
      userId: req.user.id,
      expectedVersion,
      patch,
    });
    ok(res, { session: normalizeSession(session) });
  }),

  remove: asyncHandler(async (req, res) => {
    await sessionService.remove({ id: req.params.id, userId: req.user.id });
    ok(res, { deleted: true });
  }),

  messages: asyncHandler(async (req, res) => {
    const items = await sessionService.listMessages({
      id: req.params.id,
      userId: req.user.id,
      limit: Number(req.query.limit) || 100,
    });
    ok(res, {
      items: items.map((m) => ({
        id: String(m._id),
        role: m.role,
        text: m.text,
        payload: m.payload,
        createdAt: m.createdAt,
      })),
    });
  }),
};
