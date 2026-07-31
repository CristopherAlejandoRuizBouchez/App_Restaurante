import { NextResponse, type NextRequest } from "next/server";
import { idempotencyService } from "@/modules/integration";

/**
 * Envuelve una escritura para hacerla idempotente.
 * Si no viene el header, ejecuta normalmente (idempotencia opcional).
 */
export async function withIdempotency(
  req: NextRequest,
  apiKeyId: string,
  body: unknown,
  execute: () => Promise<NextResponse>,
): Promise<NextResponse> {
  const key = req.headers.get("idempotency-key");

  if (!key) return execute();

  const cached = await idempotencyService.lookup(apiKeyId, key, body);

  if (cached) {
    return NextResponse.json(cached.body, {
      status: cached.status,
      headers: { "Idempotency-Replayed": "true" },
    });
  }

  const response = await execute();

  // Solo se cachean las respuestas exitosas: un error debe poder reintentarse.
  if (response.status >= 200 && response.status < 300) {
    const clone = response.clone();
    const responseBody = await clone.json();

    await idempotencyService.store(apiKeyId, key, body, {
      status: response.status,
      body: responseBody,
    });
  }

  return response;
}
