import { createHash } from "node:crypto";
import { ConflictError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

const TTL_HOURS = 24;

export interface CachedResponse {
  status: number;
  body: unknown;
}

function hashRequest(body: unknown): string {
  return createHash("sha256").update(JSON.stringify(body)).digest("hex");
}

export const idempotencyService = {
  /**
   * Busca una respuesta cacheada para esta clave.
   * - null  -> primera vez, hay que ejecutar
   * - objeto -> ya se ejecutó, devolver esto sin hacer nada
   * - lanza 409 si la clave se reutiliza con un cuerpo distinto
   */
  async lookup(
    apiKeyId: string,
    key: string,
    body: unknown,
  ): Promise<CachedResponse | null> {
    const existing = await prisma.idempotencyKey.findUnique({
      where: { apiKeyId_key: { apiKeyId, key } },
    });

    if (!existing) return null;

    if (existing.expiresAt < new Date()) {
      await prisma.idempotencyKey.delete({ where: { id: existing.id } });
      return null;
    }

    // Misma clave, cuerpo distinto: bug del cliente, no un reintento.
    if (existing.requestHash !== hashRequest(body)) {
      throw new ConflictError(
        "Esa Idempotency-Key ya se usó con un cuerpo diferente",
      );
    }

    return {
      status: existing.responseStatus,
      body: existing.responseBody,
    };
  },

  async store(
    apiKeyId: string,
    key: string,
    body: unknown,
    response: CachedResponse,
  ): Promise<void> {
    await prisma.idempotencyKey.create({
      data: {
        apiKeyId,
        key,
        requestHash: hashRequest(body),
        responseStatus: response.status,
        responseBody: response.body as never,
        expiresAt: new Date(Date.now() + TTL_HOURS * 60 * 60 * 1000),
      },
    });
  },

  deleteExpired() {
    return prisma.idempotencyKey.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  },
};
