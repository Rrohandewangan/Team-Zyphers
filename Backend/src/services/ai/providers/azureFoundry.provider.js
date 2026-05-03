import { AIProvider } from "./ai.provider.js";
import httpClient, { withRetry } from "../../../utils/httpClient.js";
import axios from "axios";
import { env } from "../../../config/env.js";
import { ApiError } from "../../../utils/ApiError.js";

export class AzureFoundryProvider extends AIProvider {
  constructor({ endpoint, apiKey, deployment, apiVersion, timeoutMs }) {
    super();
    this.endpoint = endpoint.replace(/\/$/, "");
    this.apiKey = apiKey;
    this.deployment = deployment;
    this.apiVersion = apiVersion;
    this.timeoutMs = timeoutMs;
  }

  #buildBody({ system, messages, schema, stream = false }) {
    const isNextGen = /^(gpt-5|o\d)/i.test(this.deployment);
    return {
      messages: [{ role: "system", content: system }, ...messages],
      ...(isNextGen
        ? { max_completion_tokens: 800 }
        : { max_tokens: 800, temperature: 0.2 }),
      ...(schema && {
        response_format: {
          type: "json_schema",
          json_schema: { name: "triage_response", schema, strict: true },
        },
      }),
      ...(stream && { stream: true }),
    };
  }

  get #url() {
    return `${this.endpoint}/openai/deployments/${this.deployment}/chat/completions?api-version=${this.apiVersion}`;
  }

  async complete({ system, messages, schema, signal }) {
    const url = this.#url;
    const body = this.#buildBody({ system, messages, schema });

    try {
      const res = await withRetry(() =>
        httpClient.post(url, body, {
          headers: {
            "api-key": this.apiKey,
            "content-type": "application/json",
          },
          timeout: this.timeoutMs,
          signal,
        })
      );
      const choice = res.data?.choices?.[0]?.message?.content;
      if (!choice) throw new ApiError(502, "Empty response from AI provider");
      return { content: choice, usage: res.data.usage, model: res.data.model };
    } catch (err) {
      if (err instanceof ApiError) throw err;
      const status = err.response?.status;
      const apiMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message;
      throw new ApiError(
        status >= 400 && status < 500 ? 502 : 503,
        `AI provider error: ${apiMsg}`,
        { url, status, data: err.response?.data }
      );
    }
  }

  async *stream({ system, messages, schema, signal }) {
    const url = this.#url;
    const body = this.#buildBody({ system, messages, schema, stream: true });

    let res;
    try {
      res = await axios.post(url, body, {
        headers: {
          "api-key": this.apiKey,
          "content-type": "application/json",
          accept: "text/event-stream",
        },
        timeout: this.timeoutMs,
        signal,
        responseType: "stream",
      });
    } catch (err) {
      const status = err.response?.status;
      const apiMsg = err.response?.data?.error?.message || err.message;
      throw new ApiError(
        status >= 400 && status < 500 ? 502 : 503,
        `AI provider error: ${apiMsg}`
      );
    }

    let buffer = "";
    let accumulated = "";
    let model;

    for await (const chunk of res.data) {
      buffer += chunk.toString("utf8");

      let nl;
      while ((nl = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 2);
        if (!frame.startsWith("data:")) continue;

        const payload = frame.slice(5).trim();
        if (payload === "[DONE]") {
          yield { done: true, delta: "", content: accumulated, model };
          return;
        }

        let json;
        try {
          json = JSON.parse(payload);
        } catch {
          continue;
        }

        model ||= json.model;
        const delta = json.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta.length > 0) {
          accumulated += delta;
          yield { done: false, delta, content: accumulated, model };
        }
      }
    }

    yield { done: true, delta: "", content: accumulated, model };
  }
}

export const buildAzureFoundryProvider = () =>
  new AzureFoundryProvider({
    endpoint: env.ai.endpoint,
    apiKey: env.ai.key,
    deployment: env.ai.deployment,
    apiVersion: env.ai.apiVersion,
    timeoutMs: env.ai.timeoutMs,
  });
