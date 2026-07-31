import type { NextRequest } from "next/server";
import type { ApiScope } from "@/config/scopes";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { apiKeyService } from "@/modules/integration";

export interface ApiKeyContext {
  apiKeyId: string;
  restaurantId: string;
  scopes: string[];
}

function extractKey(req: NextRequest): string {
  const header = req.headers.get("authorization");

  if (!header?.startsWith("Bearer ")) {
    throw new UnauthorizedError(
      "Falta el header Authorization: Bearer <api-key>",
    );
  }

  return header.slice("Bearer ".length).trim();
}

/** Valida la API Key. Lanza 401 si no sirve. */
export async function requireApiKey(req: NextRequest): Promise<ApiKeyContext> {
  const key = extractKey(req);
  const resolved = await apiKeyService.resolve(key);

  if (!resolved) throw new UnauthorizedError("API Key inválida o revocada");

  apiKeyService.touch(resolved.id);

  return {
    apiKeyId: resolved.id,
    restaurantId: resolved.restaurantId,
    scopes: resolved.scopes,
  };
}

/** Valida la API Key Y exige un scope concreto. Lanza 401 o 403. */
export async function requireScope(
  req: NextRequest,
  scope: ApiScope,
): Promise<ApiKeyContext> {
  const ctx = await requireApiKey(req);

  if (!ctx.scopes.includes(scope)) {
    throw new ForbiddenError(
      `Esta API Key no tiene el scope requerido: ${scope}`,
    );
  }

  return ctx;
}
