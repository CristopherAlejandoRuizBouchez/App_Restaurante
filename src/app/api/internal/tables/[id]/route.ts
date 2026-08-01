import { requirePermission } from "@/lib/api/auth-guard";
import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { readJsonBody } from "@/lib/api/read-body";
import { tenantService, updateTableSchema } from "@/modules/tenant";

export const PATCH = withApiHandler<{ id: string }>(
  async ({ req, params, requestId }) => {
    const actor = await requirePermission("table:manage");
    const body = updateTableSchema.parse(await readJsonBody(req));

    const table = await tenantService.updateTable(
      actor.restaurantId,
      params.id,
      body,
    );

    return ok({ table }, requestId);
  },
);

export const DELETE = withApiHandler<{ id: string }>(
  async ({ params, requestId }) => {
    const actor = await requirePermission("table:manage");
    await tenantService.deleteTable(actor.restaurantId, params.id);

    return ok({ deleted: true }, requestId);
  },
);
