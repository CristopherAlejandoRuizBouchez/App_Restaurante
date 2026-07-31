import { requirePermission } from "@/lib/api/auth-guard";
import { withApiHandler } from "@/lib/api/handler";
import { created, ok } from "@/lib/api/response";
import { readJsonBody } from "@/lib/api/read-body";
import { createWebhookSchema, webhookService } from "@/modules/integration";

export const GET = withApiHandler(async ({ requestId }) => {
  const actor = await requirePermission("webhook:manage");
  const webhooks = await webhookService.list(actor.restaurantId);

  return ok({ webhooks }, requestId);
});

export const POST = withApiHandler(async ({ req, requestId }) => {
  const actor = await requirePermission("webhook:manage");
  const body = createWebhookSchema.parse(await readJsonBody(req));

  const webhook = await webhookService.create(actor.restaurantId, {
    name: body.name,
    url: body.url,
    events: [...body.events],
  });

  return created({ webhook }, requestId);
});
