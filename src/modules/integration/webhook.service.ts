import { randomUUID } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import {
  isValidEvent,
  type WebhookEvent,
  type WebhookEventType,
} from "./events";
import { generateWebhookSecret } from "./webhook-signer";

export interface WebhookEndpointDTO {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  consecutiveFails: number;
  createdAt: string;
}

export const webhookService = {
  async create(
    restaurantId: string,
    input: { name: string; url: string; events: string[] },
  ) {
    const invalid = input.events.filter((e) => !isValidEvent(e));
    if (invalid.length > 0) {
      throw new ValidationError("Eventos desconocidos", [
        { field: "events", issue: invalid.join(", ") },
      ]);
    }

    const secret = generateWebhookSecret();

    const endpoint = await prisma.webhookEndpoint.create({
      data: { restaurantId, ...input, secret },
    });

    return {
      id: endpoint.id,
      name: endpoint.name,
      url: endpoint.url,
      events: endpoint.events,
      secret, // única vez que se muestra
    };
  },

  async list(restaurantId: string): Promise<WebhookEndpointDTO[]> {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
    });

    return endpoints.map((e) => ({
      id: e.id,
      name: e.name,
      url: e.url,
      events: e.events,
      isActive: e.isActive,
      consecutiveFails: e.consecutiveFails,
      createdAt: e.createdAt.toISOString(),
    }));
  },

  async delete(restaurantId: string, id: string): Promise<void> {
    const endpoint = await prisma.webhookEndpoint.findFirst({
      where: { id, restaurantId },
    });
    if (!endpoint) throw new NotFoundError("Webhook");

    await prisma.webhookEndpoint.delete({ where: { id } });
  },

  /**
   * Encola un evento para todos los endpoints suscritos.
   * Recibe el cliente de transacción para que la escritura sea atómica
   * junto con la operación que originó el evento.
   */
  async enqueue(
    tx: Prisma.TransactionClient,
    restaurantId: string,
    type: WebhookEventType,
    data: unknown,
  ): Promise<void> {
    const endpoints = await tx.webhookEndpoint.findMany({
      where: { restaurantId, isActive: true, events: { has: type } },
      select: { id: true },
    });

    if (endpoints.length === 0) return;

    const event: WebhookEvent = {
      id: `evt_${randomUUID()}`,
      type,
      createdAt: new Date().toISOString(),
      apiVersion: "v1",
      restaurantId,
      data,
    };

    await tx.webhookDelivery.createMany({
      data: endpoints.map((e) => ({
        endpointId: e.id,
        eventId: event.id,
        eventType: type,
        payload: event as never,
      })),
    });

    logger.info("webhook.enqueued", {
      eventId: event.id,
      type,
      endpoints: endpoints.length,
    });
  },

  async listDeliveries(restaurantId: string, endpointId: string) {
    const endpoint = await prisma.webhookEndpoint.findFirst({
      where: { id: endpointId, restaurantId },
    });
    if (!endpoint) throw new NotFoundError("Webhook");

    return prisma.webhookDelivery.findMany({
      where: { endpointId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        eventId: true,
        eventType: true,
        status: true,
        attempts: true,
        lastStatusCode: true,
        lastError: true,
        deliveredAt: true,
        createdAt: true,
      },
    });
  },
};
