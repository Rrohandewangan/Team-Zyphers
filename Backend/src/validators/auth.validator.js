import Joi from "joi";

const deviceSchema = Joi.object({
  platform: Joi.string().valid("web", "android", "ios").required(),
  name: Joi.string().max(100),
  pushToken: Joi.string().max(500),
  publicKey: Joi.string().max(2048),
});

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  name: Joi.string().max(120),
  phone: Joi.string().max(32),
  locale: Joi.string().max(10),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  device: deviceSchema.required(),
});

export const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const logoutSchema = Joi.object({
  refreshToken: Joi.string().required(),
});
