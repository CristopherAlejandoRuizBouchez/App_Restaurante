import { requirePermission } from "@/lib/api/auth-guard";
import { withApiHandler } from "@/lib/api/handler";
import { created, ok } from "@/lib/api/response";
import { readJsonBody } from "@/lib/api/read-body";
import { apiKeyService, createApiKeySchema } from "@/modules/integration";

export const GET = withApiHandler(async ({ requestId }) => {
  const actor = await requirePermission("apikey:manage");
  const keys = await apiKeyService.list(actor.restaurantId);

  return ok({ apiKeys: keys }, requestId);
});

export const POST = withApiHandler(async ({ req, requestId }) => {
  const actor = await requirePermission("apikey:manage");
  const body = createApiKeySchema.parse(await readJsonBody(req));

  const apiKey = await apiKeyService.create(
    actor.restaurantId,
    body.name,
    body.scopes,
  );

  return created({ apiKey }, requestId);
});
