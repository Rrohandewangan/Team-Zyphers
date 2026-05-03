import axios from "axios";
import { logger, als } from "../config/logger.js";

const httpClient = axios.create({ timeout: 15_000 });

httpClient.interceptors.request.use((config) => {
  const cid = als.getStore()?.correlationId;
  if (cid) config.headers["x-correlation-id"] = cid;
  return config;
});

httpClient.interceptors.response.use(
  (res) => res,
  (err) => {
    logger.warn("[http] outbound failure", {
      url: err.config?.url,
      method: err.config?.method,
      status: err.response?.status,
      code: err.code,
    });
    return Promise.reject(err);
  }
);

export default httpClient;

export async function withRetry(
  fn,
  { attempts = 3, baseMs = 250, retryOn = [429, 500, 502, 503, 504] } = {}
) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = err.response?.status;
      const retriable = !status || retryOn.includes(status);
      if (!retriable || i === attempts - 1) break;
      const delay = baseMs * 2 ** i + Math.floor(Math.random() * 100);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}
