import Joi from "joi";

export const facilityNearbySchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  type: Joi.string()
    .valid("hospital", "doctor", "pharmacy", "clinic")
    .default("hospital"),
  radiusMeters: Joi.number().integer().min(500).max(100000).default(5000),
  radius: Joi.number().integer().min(500).max(100000),
}).rename("radius", "radiusMeters", { ignoreUndefined: true, override: true });
