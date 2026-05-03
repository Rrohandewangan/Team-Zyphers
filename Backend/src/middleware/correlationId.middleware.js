import { v4 as uuid } from "uuid";
import { als } from "../config/logger.js";

export const correlationId = (req, res, next) => {
  const cid = req.header("x-correlation-id") || uuid();
  res.setHeader("x-correlation-id", cid);
  als.run({ correlationId: cid }, () => {
    req.correlationId = cid;
    next();
  });
};
