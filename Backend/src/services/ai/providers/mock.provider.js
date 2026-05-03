import { AIProvider } from "./ai.provider.js";

export class MockAIProvider extends AIProvider {
  async complete({ messages }) {
    const last = messages[messages.length - 1]?.content?.toLowerCase() || "";
    let severity = "mild";
    if (/chest pain|unconscious|stroke|bleeding|breathless/.test(last))
      severity = "critical";
    else if (/fever|persistent|severe|vomit/.test(last)) severity = "moderate";
    const payload = {
      severity,
      summary: "Mock triage result for local development.",
      recommendations: [
        "Hydrate",
        "Rest",
        "Consult a clinician if symptoms persist",
      ],
      redFlags:
        severity === "critical" ? ["Seek emergency care immediately"] : [],
      language: "en",
      confidence: 0.7,
    };
    return {
      content: JSON.stringify(payload),
      usage: { total_tokens: 0 },
      model: "mock",
    };
  }

  async *stream({ messages }) {
    const { content, model } = await this.complete({ messages });
    let acc = "";
    for (let i = 0; i < content.length; i += 4) {
      const delta = content.slice(i, i + 4);
      acc += delta;
      await new Promise((r) => setTimeout(r, 20));
      yield { done: false, delta, content: acc, model };
    }
    yield { done: true, delta: "", content: acc, model };
  }
}
