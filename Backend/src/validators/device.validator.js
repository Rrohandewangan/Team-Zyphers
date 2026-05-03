import Joi from "joi";

export const registerDeviceSchema = Joi.object({
  platform: Joi.string().valid("web", "android", "ios").required(),
  name: Joi.string().max(100),
  pushToken: Joi.string().max(500),
  publicKey: Joi.string().max(2048),
});
