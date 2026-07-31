import { WebhookDeliveryStatus } from "@/generated/prisma/client";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { signPayload } from "./webhook-signer";

/** Backoff exponencial en segundos. 6 intentos, ~3 horas de ventana. */
const RETRY_DELAYS = [10, 60, 300, 1800, 7200, 10800];
const MAX_ATTEMPTS = RETRY_DELAYS.length;
const TIMEOUT_MS = 10_000;
const FAILS_BEFORE_DISABLE = 20;

export const webhookDispatcher = {
  /** Procesa las entregas pendientes. Lo llama el cron. */
  async processPending(limit = 25): Promise<{ processed: number }> {
    const pending = await prisma.webhookDelivery.findMany({
      where: {
        status: {
          in: [WebhookDeliveryStatus.PENDING, WebhookDeliveryStatus.FAILED],
        },
        nextAttemptAt: { lte: new Date() },
      },
      include: { endpoint: true },
      orderBy: { nextAttemptAt: "asc" },
      take: limit,
    });

    for (const delivery of pending) {
      await this.attempt(delivery.id);
    }

    return { processed: pending.length };
  },

  async attempt(deliveryId: string): Promise<void> {
    const delivery = await prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: { endpoint: true },
    });

    if (!delivery || !delivery.endpoint.isActive) return;

    const payload = JSON.stringify(delivery.payload);
    const signature = signPayload(payload, delivery.endpoint.secret);
    const attempts = delivery.attempts + 1;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(delivery.endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-SmartMenu-Signature": signature,
          "X-SmartMenu-Event-Id": delivery.eventId,
          "X-SmartMenu-Event-Type": delivery.eventType,
        },
        body: payload,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (response.ok) {
        await prisma.$transaction([
          prisma.webhookDelivery.update({
            where: { id: deliveryId },
            data: {
              status: WebhookDeliveryStatus.DELIVERED,
              attempts,
              lastStatusCode: response.status,
              deliveredAt: new Date(),
            },
          }),
          prisma.webhookEndpoint.update({
            where: { id: delivery.endpointId },
            data: { consecutiveFails: 0 },
          }),
        ]);

        logger.info("webhook.delivered", {
          eventId: delivery.eventId,
          attempts,
        });
        return;
      }

      await this.recordFailure(
        delivery.id,
        delivery.endpointId,
        attempts,
        response.status,
        `HTTP ${response.status}`,
      );
    } catch (error) {
      await this.recordFailure(
        delivery.id,
        delivery.endpointId,
        attempts,
        null,
        error instanceof Error ? error.message : "Error desconocido",
      );
    }
  },

  async recordFailure(
    deliveryId: string,
    endpointId: string,
    attempts: number,
    statusCode: number | null,
    error: string,
  ): Promise<void> {
    const exhausted = attempts >= MAX_ATTEMPTS;
    const delaySeconds = RETRY_DELAYS[attempts - 1] ?? 10800;

    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: exhausted
          ? WebhookDeliveryStatus.EXHAUSTED
          : WebhookDeliveryStatus.FAILED,
        attempts,
        lastStatusCode: statusCode,
        lastError: error.slice(0, 500),
        nextAttemptAt: new Date(Date.now() + delaySeconds * 1000),
      },
    });

    const endpoint = await prisma.webhookEndpoint.update({
      where: { id: endpointId },
      data: { consecutiveFails: { increment: 1 } },
    });

    // Un endpoint muerto no puede seguir consumiendo recursos indefinidamente.
    if (endpoint.consecutiveFails >= FAILS_BEFORE_DISABLE) {
      await prisma.webhookEndpoint.update({
        where: { id: endpointId },
        data: { isActive: false, disabledAt: new Date() },
      });

      logger.error("webhook.endpoint_disabled", {
        endpointId,
        consecutiveFails: endpoint.consecutiveFails,
      });
    }

    logger.warn("webhook.failed", {
      deliveryId,
      attempts,
      statusCode,
      error,
      exhausted,
    });
  },

  /** Reintento manual desde el panel. */
  async retry(deliveryId: string): Promise<void> {
    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: WebhookDeliveryStatus.PENDING,
        nextAttemptAt: new Date(),
      },
    });

    await this.attempt(deliveryId);
  },
};
