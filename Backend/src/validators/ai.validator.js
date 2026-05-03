import Joi from "joi";

export const triageSchema = Joi.object({
  sessionId: Joi.string().uuid().required(),
  symptoms: Joi.string().min(3).max(4000).required(),
  age: Joi.number().integer().min(0).max(130),
  sex: Joi.string().valid("male", "female", "other"),
  history: Joi.array().items(Joi.string().max(200)).max(20),
  locale: Joi.string().max(10),
  lat: Joi.number().min(-90).max(90),
  lng: Joi.number().min(-180).max(180),
});
