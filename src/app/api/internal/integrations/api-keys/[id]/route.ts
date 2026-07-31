import { requirePermission } from "@/lib/api/auth-guard";
import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { apiKeyService } from "@/modules/integration";

export const DELETE = withApiHandler<{ id: string }>(
  async ({ params, requestId }) => {
    const actor = await requirePermission("apikey:manage");
    await apiKeyService.revoke(actor.restaurantId, params.id);

    return ok({ revoked: true }, requestId);
  },
);
