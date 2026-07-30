import { requireApiKey } from "@/lib/api/auth-api-key";
import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { catalogService, listProductsQuerySchema } from "@/modules/catalog";

export const GET = withApiHandler(async ({ req, requestId }) => {
  const { restaurantId } = requireApiKey(req);
  const query = listProductsQuerySchema.parse(
    Object.fromEntries(req.nextUrl.searchParams),
  );

  const products = await catalogService.listProducts(restaurantId, query);

  return ok({ products }, requestId);
});
