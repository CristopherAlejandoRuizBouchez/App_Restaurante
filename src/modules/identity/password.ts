import bcrypt from "bcryptjs";
import { AUTH_CONFIG } from "@/config/auth";

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, AUTH_CONFIG.BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
