import Joi from "joi";

const schema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "test", "staging", "production")
    .default("development"),
  PORT: Joi.number().default(3000),
  SIGNALING_PORT: Joi.number().default(3001),
  LOG_LEVEL: Joi.string().default("info"),
  CORS_ORIGINS: Joi.string().default(""),

  MONGODB_URI: Joi.string()
    .uri({ scheme: [/mongodb(\+srv)?/] })
    .required(),

  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_TTL: Joi.string().default("15m"),
  JWT_REFRESH_TTL_DAYS: Joi.number().default(30),
  JWT_ISSUER: Joi.string().default("vitalis-ai"),
  JWT_AUDIENCE: Joi.string().default("vitalis-clients"),

  AI_PROVIDER: Joi.string().valid("azure-foundry", "mock").default("mock"),
  AI_ENDPOINT: Joi.string()
    .uri()
    .when("AI_PROVIDER", { is: "azure-foundry", then: Joi.required() }),
  AI_KEY: Joi.string().when("AI_PROVIDER", {
    is: "azure-foundry",
    then: Joi.required(),
  }),
  AI_DEPLOYMENT: Joi.string().when("AI_PROVIDER", {
    is: "azure-foundry",
    then: Joi.required(),
  }),
  AI_API_VERSION: Joi.string().default("2024-10-21"),
  AI_TIMEOUT_MS: Joi.number().default(20000),

  MAPS_PROVIDER: Joi.string().valid("google", "osm", "mock").default("osm"),
  MAPS_API_KEY: Joi.string().when("MAPS_PROVIDER", {
    is: "google",
    then: Joi.required(),
  }),

  RELAY_PROVIDER: Joi.string().valid("azure-blob", "mock").default("mock"),
  AZURE_STORAGE_ACCOUNT: Joi.string().when("RELAY_PROVIDER", {
    is: "azure-blob",
    then: Joi.required(),
  }),
  AZURE_STORAGE_KEY: Joi.string().when("RELAY_PROVIDER", {
    is: "azure-blob",
    then: Joi.required(),
  }),
  AZURE_STORAGE_CONTAINER: Joi.string().default("sync-relay"),
  RELAY_TTL_HOURS: Joi.number().default(24),

  RATE_LIMIT_WINDOW_MS: Joi.number().default(60_000),
  RATE_LIMIT_MAX: Joi.number().default(120),
  AI_RATE_LIMIT_MAX: Joi.number().default(30),
}).unknown(true);

const { value, error } = schema.validate(process.env, { abortEarly: false });
if (error) {
  console.error(
    "[env] Invalid configuration:",
    error.details.map((d) => d.message).join("; ")
  );
  process.exit(1);
}

export const env = Object.freeze({
  nodeEnv: value.NODE_ENV,
  isProd: value.NODE_ENV === "production",
  port: value.PORT,
  signalingPort: value.SIGNALING_PORT,
  logLevel: value.LOG_LEVEL,
  corsOrigins: value.CORS_ORIGINS.split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  mongoUri: value.MONGODB_URI,

  jwt: {
    accessSecret: value.JWT_ACCESS_SECRET,
    accessTtl: value.JWT_ACCESS_TTL,
    refreshTtlDays: value.JWT_REFRESH_TTL_DAYS,
    issuer: value.JWT_ISSUER,
    audience: value.JWT_AUDIENCE,
  },

  ai: {
    provider: value.AI_PROVIDER,
    endpoint: value.AI_ENDPOINT,
    key: value.AI_KEY,
    deployment: value.AI_DEPLOYMENT,
    apiVersion: value.AI_API_VERSION,
    timeoutMs: value.AI_TIMEOUT_MS,
  },

  maps: {
    provider: value.MAPS_PROVIDER,
    apiKey: value.MAPS_API_KEY,
  },

  relay: {
    provider: value.RELAY_PROVIDER,
    account: value.AZURE_STORAGE_ACCOUNT,
    key: value.AZURE_STORAGE_KEY,
    container: value.AZURE_STORAGE_CONTAINER,
    ttlHours: value.RELAY_TTL_HOURS,
  },

  rateLimit: {
    windowMs: value.RATE_LIMIT_WINDOW_MS,
    max: value.RATE_LIMIT_MAX,
    aiMax: value.AI_RATE_LIMIT_MAX,
  },
});
