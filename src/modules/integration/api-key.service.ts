import { createHash, randomBytes } from "node:crypto";
import type { ApiScope } from "@/config/scopes";
import { NotFoundError } from "@/lib/errors";
import { isProduction } from "@/lib/env";
import { prisma } from "@/lib/prisma";

function generateApiKey(): string {
  const prefix = isProduction ? "sk_live_" : "sk_test_";
  return prefix + randomBytes(24).toString("hex");
}

function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export interface CreatedApiKey {
  id: string;
  name: string;
  /** Valor en claro. Se devuelve UNA SOLA VEZ. */
  key: string;
  keyPrefix: string;
  scopes: string[];
}

export interface ApiKeyDTO {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface ResolvedApiKey {
  id: string;
  restaurantId: string;
  scopes: string[];
}

export const apiKeyService = {
  async create(
    restaurantId: string,
    name: string,
    scopes: ApiScope[],
    expiresAt?: Date,
  ): Promise<CreatedApiKey> {
    const key = generateApiKey();

    const record = await prisma.apiKey.create({
      data: {
        restaurantId,
        name,
        keyHash: hashApiKey(key),
        keyPrefix: key.slice(0, 16),
        scopes,
        expiresAt: expiresAt ?? null,
      },
    });

    return {
      id: record.id,
      name: record.name,
      key, // única oportunidad de verla
      keyPrefix: record.keyPrefix,
      scopes: record.scopes,
    };
  },

  async list(restaurantId: string): Promise<ApiKeyDTO[]> {
    const keys = await prisma.apiKey.findMany({
      where: { restaurantId, revokedAt: null },
      orderBy: { createdAt: "desc" },
    });

    return keys.map((k) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      scopes: k.scopes,
      isActive: k.isActive,
      lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
      createdAt: k.createdAt.toISOString(),
    }));
  },

  async revoke(restaurantId: string, id: string): Promise<void> {
    const key = await prisma.apiKey.findFirst({
      where: { id, restaurantId, revokedAt: null },
    });
    if (!key) throw new NotFoundError("API Key");

    await prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date(), isActive: false },
    });
  },

  /** Resuelve una key en claro. Devuelve null si no sirve. */
  async resolve(key: string): Promise<ResolvedApiKey | null> {
    const record = await prisma.apiKey.findUnique({
      where: { keyHash: hashApiKey(key) },
      select: {
        id: true,
        restaurantId: true,
        scopes: true,
        isActive: true,
        revokedAt: true,
        expiresAt: true,
      },
    });

    if (!record) return null;
    if (!record.isActive || record.revokedAt) return null;
    if (record.expiresAt && record.expiresAt < new Date()) return null;

    return {
      id: record.id,
      restaurantId: record.restaurantId,
      scopes: record.scopes,
    };
  },

  /** Marca de uso. Sin await en el llamador: no debe bloquear la respuesta. */
  touch(id: string): void {
    void prisma.apiKey
      .update({ where: { id }, data: { lastUsedAt: new Date() } })
      .catch(() => {
        // Actualizar la marca de uso nunca debe romper una petición válida.
      });
  },
};
