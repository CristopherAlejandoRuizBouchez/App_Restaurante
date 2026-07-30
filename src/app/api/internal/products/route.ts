import { requirePermission } from "@/lib/api/auth-guard";
import { withApiHandler } from "@/lib/api/handler";
import { created, ok } from "@/lib/api/response";
import {
  catalogService,
  createProductSchema,
  listProductsQuerySchema,
} from "@/modules/catalog";

export const GET = withApiHandler(async ({ req, requestId }) => {
  const actor = await requirePermission("product:read");
  const query = listProductsQuerySchema.parse(
    Object.fromEntries(req.nextUrl.searchParams),
  );

  const products = await catalogService.listProducts(actor.restaurantId, query);

  return ok({ products }, requestId);
});

export const POST = withApiHandler(async ({ req, requestId }) => {
  const actor = await requirePermission("product:manage");
  const body = createProductSchema.parse(await req.json());

  const product = await catalogService.createProduct(actor.restaurantId, body);

  return created({ product }, requestId);
});
