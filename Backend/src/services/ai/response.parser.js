import { ApiError } from "../../utils/ApiError.js";

const ALLOWED_SEVERITY = new Set(["mild", "moderate", "critical"]);

export const responseParser = {
  parse(raw) {
    let obj;
    try {
      obj = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      throw new ApiError(502, "AI returned non-JSON output");
    }
    if (!ALLOWED_SEVERITY.has(obj.severity)) {
      throw new ApiError(502, "AI returned invalid severity");
    }
    return {
      severity: obj.severity,
      summary: String(obj.summary ?? "").slice(0, 500),
      recommendations: Array.isArray(obj.recommendations)
        ? obj.recommendations.slice(0, 5)
        : [],
      redFlags: Array.isArray(obj.redFlags) ? obj.redFlags : [],
      language: obj.language || "en",
      confidence: typeof obj.confidence === "number" ? obj.confidence : 0,
    };
  },
};
