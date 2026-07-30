import { requirePermission } from "@/lib/api/auth-guard";
import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { catalogService, updateCategorySchema } from "@/modules/catalog";

export const PATCH = withApiHandler<{ id: string }>(
  async ({ req, params, requestId }) => {
    const actor = await requirePermission("product:manage");
    const body = updateCategorySchema.parse(await req.json());

    const category = await catalogService.updateCategory(
      actor.restaurantId,
      params.id,
      body,
    );

    return ok({ category }, requestId);
  },
);

export const DELETE = withApiHandler<{ id: string }>(
  async ({ params, requestId }) => {
    const actor = await requirePermission("product:manage");
    await catalogService.deleteCategory(actor.restaurantId, params.id);

    return ok({ deleted: true }, requestId);
  },
);
