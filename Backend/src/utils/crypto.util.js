import crypto from "node:crypto";

export const sha256 = (input) =>
  crypto
    .createHash("sha256")
    .update(typeof input === "string" ? input : JSON.stringify(input))
    .digest("hex");

export const randomToken = (bytes = 48) =>
  crypto.randomBytes(bytes).toString("base64url");

export const timingSafeEqual = (a, b) => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
};
