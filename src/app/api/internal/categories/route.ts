import { requirePermission } from "@/lib/api/auth-guard";
import { withApiHandler } from "@/lib/api/handler";
import { created, ok } from "@/lib/api/response";
import { catalogService, createCategorySchema } from "@/modules/catalog";

export const GET = withApiHandler(async ({ req, requestId }) => {
  const actor = await requirePermission("product:read");
  const includeInactive =
    req.nextUrl.searchParams.get("includeInactive") === "true";

  const categories = await catalogService.listCategories(
    actor.restaurantId,
    includeInactive,
  );

  return ok({ categories }, requestId);
});

export const POST = withApiHandler(async ({ req, requestId }) => {
  const actor = await requirePermission("product:manage");
  const body = createCategorySchema.parse(await req.json());

  const category = await catalogService.createCategory(
    actor.restaurantId,
    body,
  );

  return created({ category }, requestId);
});
