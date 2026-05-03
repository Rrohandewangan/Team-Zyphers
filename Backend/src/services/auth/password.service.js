import bcrypt from "bcryptjs";

export const passwordService = {
  hash: (plain) => bcrypt.hash(plain, 12),
  verify: (plain, hash) => bcrypt.compare(plain, hash),
};
