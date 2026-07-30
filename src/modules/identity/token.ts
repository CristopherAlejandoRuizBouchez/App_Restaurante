import { createHash, randomBytes } from "node:crypto";

/** Token opaco de 256 bits. Se envía al cliente, nunca se guarda en claro. */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Hash determinista para poder buscar la sesión por índice.
 * SHA-256 es correcto acá: el token ya tiene entropía suficiente,
 * no necesita el costo de bcrypt.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function expiresInHours(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export function expiresInDays(days: number): Date {
  return expiresInHours(days * 24);
}
