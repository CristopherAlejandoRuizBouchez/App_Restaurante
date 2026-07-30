import { requirePermission } from "@/lib/api/auth-guard";
import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { catalogService, updateProductSchema } from "@/modules/catalog";

export const GET = withApiHandler<{ id: string }>(
  async ({ params, requestId }) => {
    const actor = await requirePermission("product:read");
    const product = await catalogService.getProduct(
      actor.restaurantId,
      params.id,
    );

    return ok({ product }, requestId);
  },
);

export const PATCH = withApiHandler<{ id: string }>(
  async ({ req, params, requestId }) => {
    const actor = await requirePermission("product:manage");
    const body = updateProductSchema.parse(await req.json());

    const product = await catalogService.updateProduct(
      actor.restaurantId,
      params.id,
      body,
    );

    return ok({ product }, requestId);
  },
);

export const DELETE = withApiHandler<{ id: string }>(
  async ({ params, requestId }) => {
    const actor = await requirePermission("product:manage");
    await catalogService.deleteProduct(actor.restaurantId, params.id);

    return ok({ deleted: true }, requestId);
  },
);
