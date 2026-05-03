import Joi from "joi";

export const announceSchema = Joi.object({
  sessionIds: Joi.array().items(Joi.string().uuid()).max(500),
});

export const issueUploadSchema = Joi.object({
  toDevice: Joi.string().uuid().required(),
  sha256: Joi.string().length(64).required(),
  sizeBytes: Joi.number()
    .integer()
    .min(1)
    .max(50 * 1024 * 1024)
    .required(),
});

export const issueDownloadSchema = Joi.object({
  envelopeId: Joi.string().uuid().required(),
});

export const ackSchema = Joi.object({
  envelopeId: Joi.string().uuid().required(),
});
