import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { UnauthorizedError } from "@/lib/errors";
import { env } from "@/lib/env";
import { webhookDispatcher } from "@/modules/integration";

/**
 * Procesa la cola de webhooks pendientes.
 * En producción lo invoca Vercel Cron; en desarrollo se llama a mano.
 */
export const GET = withApiHandler(async ({ req, requestId }) => {
  const auth = req.headers.get("authorization");

  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    throw new UnauthorizedError("Cron no autorizado");
  }

  const result = await webhookDispatcher.processPending();

  return ok(result, requestId);
});
