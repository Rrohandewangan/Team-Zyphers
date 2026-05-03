import { ApiError } from "../utils/ApiError.js";

export const validate =
  (schema, source = "body") =>
  (req, _res, next) => {
    const { value, error } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      return next(
        new ApiError(
          400,
          "Validation failed",
          error.details.map((d) => ({
            path: d.path.join("."),
            message: d.message,
          }))
        )
      );
    }
    if (source === "query") {
      try {
        Object.defineProperty(req, "query", {
          value,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      } catch {
        const current = req.query;
        for (const k of Object.keys(current)) delete current[k];
        Object.assign(current, value);
      }
    } else {
      req[source] = value;
    }
    next();
  };
