import Joi from "joi";

export const createSessionSchema = Joi.object({
  sessionId: Joi.string().uuid().required(),
  locale: Joi.string().max(10),
});

export const listSessionsSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(50),
  cursor: Joi.string().isoDate(),
});

export const patchSessionSchema = Joi.object({
  expectedVersion: Joi.number().integer().required(),
  severity: Joi.string().valid("mild", "moderate", "critical"),
  summaryHash: Joi.string().length(64),
  metadata: Joi.object({
    msgCount: Joi.number().integer().min(0),
    locale: Joi.string().max(10),
  }),
});
