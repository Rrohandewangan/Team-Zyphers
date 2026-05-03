import { promptBuilder } from "./prompt.builder.js";
import { responseParser } from "./response.parser.js";
import { sessionService } from "../session/session.service.js";
import { sha256 } from "../../utils/crypto.util.js";
import { logger } from "../../config/logger.js";

export class AIOrchestrator {
  constructor({ aiProvider, facilityService }) {
    this.aiProvider = aiProvider;
    this.facilityService = facilityService;
  }

  async triage({ userId, sessionId, deviceId, input, coords }) {
    const priorMessages = await loadPriorMessages(sessionId, userId);
    const { system, messages, schema } = promptBuilder.build({
      ...input,
      priorMessages,
    });
    const start = Date.now();
    const { content, usage, model } = await this.aiProvider.complete({
      system,
      messages,
      schema,
    });

    let parsed;
    try {
      parsed = responseParser.parse(content);
    } catch (err) {
      logger.warn("[ai] parse failed, retrying with stricter system prompt");
      const retry = await this.aiProvider.complete({
        system: `${system}\nIMPORTANT: previous output was invalid. Return ONLY valid JSON matching the schema.`,
        messages,
        schema,
      });
      parsed = responseParser.parse(retry.content);
    }

    const latencyMs = Date.now() - start;

    await sessionService.touchAfterTriage({
      sessionId,
      userId,
      deviceId,
      severity: parsed.severity,
      summaryHash: sha256(parsed.summary),
      modelVersion: model,
      locale: parsed.language,
    });

    await persistTurn({ sessionId, userId, input, parsed });

    logger.info("[ai] triage complete", {
      sessionId,
      severity: parsed.severity,
      latencyMs,
      tokens: usage?.total_tokens,
      model,
    });

    let facilities;
    const needsFacilities =
      parsed.severity === "moderate" || parsed.severity === "critical";
    if (needsFacilities && coords?.lat && coords?.lng && this.facilityService) {
      try {
        facilities = await this.facilityService.nearby({
          lat: coords.lat,
          lng: coords.lng,
          type: "hospital",
          radiusMeters: 5000,
        });
      } catch (err) {
        logger.warn("[ai] facility lookup failed, returning triage only", {
          error: err.message,
        });
      }
    }

    return { ...parsed, modelVersion: model, facilities };
  }

  async *streamTriage({ userId, sessionId, deviceId, input, coords }) {
    if (typeof this.aiProvider.stream !== "function") {
      throw new Error("AI provider does not support streaming");
    }
    const priorMessages = await loadPriorMessages(sessionId, userId);
    const { system, messages, schema } = promptBuilder.build({
      ...input,
      priorMessages,
    });
    const start = Date.now();

    let model;
    let accumulated = "";

    try {
      for await (const ev of this.aiProvider.stream({
        system,
        messages,
        schema,
      })) {
        if (ev.model) model = ev.model;
        if (ev.delta) {
          accumulated = ev.content;
          yield {
            type: "delta",
            text: ev.delta,
            partialSummary: extractPartialSummary(accumulated),
          };
        }
        if (ev.done) break;
      }
    } catch (err) {
      logger.warn("[ai] stream failed", { error: err.message });
      yield { type: "error", message: err.message };
      return;
    }

    let parsed;
    try {
      parsed = responseParser.parse(accumulated);
    } catch (err) {
      logger.warn("[ai] stream parse failed", { error: err.message });
      yield {
        type: "error",
        message: "AI returned invalid output. Please try again.",
      };
      return;
    }

    const latencyMs = Date.now() - start;
    await sessionService.touchAfterTriage({
      sessionId,
      userId,
      deviceId,
      severity: parsed.severity,
      summaryHash: sha256(parsed.summary),
      modelVersion: model,
      locale: parsed.language,
    });

    await persistTurn({ sessionId, userId, input, parsed });

    logger.info("[ai] stream triage complete", {
      sessionId,
      severity: parsed.severity,
      latencyMs,
      model,
    });

    let facilities;
    const needsFacilities =
      parsed.severity === "moderate" || parsed.severity === "critical";
    if (needsFacilities && coords?.lat && coords?.lng && this.facilityService) {
      try {
        facilities = await this.facilityService.nearby({
          lat: coords.lat,
          lng: coords.lng,
          type: "hospital",
          radiusMeters: 5000,
        });
      } catch (err) {
        logger.warn("[ai] facility lookup failed during stream", {
          error: err.message,
        });
      }
    }

    yield {
      type: "final",
      result: { ...parsed, modelVersion: model, facilities },
    };
  }
}

function extractPartialSummary(buf) {
  const m = buf.match(/"summary"\s*:\s*"((?:[^"\\]|\\.)*)/);
  if (!m) return "";
  return m[1]
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

async function loadPriorMessages(sessionId, userId, n = 10) {
  if (!sessionId || !userId) return [];
  try {
    const docs = await sessionService.recentHistory({
      sessionId,
      userId,
      limit: n,
    });
    return docs.map((d) => ({
      role: d.role,
      content:
        d.role === "assistant" && d.payload?.summary
          ? d.payload.summary
          : d.text,
    }));
  } catch (err) {
    logger.warn("[ai] failed to load prior messages", { error: err.message });
    return [];
  }
}

async function persistTurn({ sessionId, userId, input, parsed }) {
  if (!sessionId || !userId) return;
  try {
    await sessionService.addMessage({
      sessionId,
      userId,
      role: "user",
      text: input.symptoms,
    });
    await sessionService.addMessage({
      sessionId,
      userId,
      role: "assistant",
      text: parsed.summary,
      payload: {
        severity: parsed.severity,
        confidence: parsed.confidence,
        recommendations: parsed.recommendations,
        redFlags: parsed.redFlags,
        language: parsed.language,
      },
    });
  } catch (err) {
    logger.warn("[ai] failed to persist transcript", { error: err.message });
  }
}
