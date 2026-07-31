import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export function generateWebhookSecret(): string {
  return "whsec_" + randomBytes(24).toString("hex");
}

/**
 * Firma con timestamp incluido: sin él, un atacante que capture
 * una petición válida podría reenviarla indefinidamente.
 * Formato: t=<unix>,v1=<hmac>
 */
export function signPayload(
  payload: string,
  secret: string,
  timestamp = Math.floor(Date.now() / 1000),
): string {
  const signature = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  return `t=${timestamp},v1=${signature}`;
}

/** Verificación, para documentarle a tu compañero cómo hacerlo. */
export function verifySignature(
  payload: string,
  header: string,
  secret: string,
  toleranceSeconds = 300,
): boolean {
  const parts = Object.fromEntries(
    header.split(",").map((p) => p.split("=") as [string, string]),
  );

  const timestamp = Number(parts["t"]);
  const received = parts["v1"];

  if (!timestamp || !received) return false;

  const age = Math.abs(Math.floor(Date.now() / 1000) - timestamp);
  if (age > toleranceSeconds) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}
