import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { UnauthorizedError } from "@/lib/errors";
import { env } from "@/lib/env";

export interface ApiKeyContext {
  restaurantId: string;
}

/** Comparación en tiempo constante: no filtra información por latencia. */
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Valida la API Key del header Authorization: Bearer <key>.
 * TEMPORAL: en el módulo 4 esto pasa a keys en base de datos con scopes.
 */
export function requireApiKey(req: NextRequest): ApiKeyContext {
  const header = req.headers.get("authorization");

  if (!header?.startsWith("Bearer ")) {
    throw new UnauthorizedError(
      "Falta el header Authorization: Bearer <api-key>",
    );
  }

  const key = header.slice("Bearer ".length).trim();

  if (!safeCompare(key, env.PUBLIC_API_KEY)) {
    throw new UnauthorizedError("API Key inválida");
  }

  return { restaurantId: env.PUBLIC_API_RESTAURANT_ID };
}
