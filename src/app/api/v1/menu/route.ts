import { requireScope } from "@/lib/api/auth-api-key";
import { withApiHandler } from "@/lib/api/handler";
import { paginated } from "@/lib/api/response";
import { listOrdersQuerySchema, orderingService } from "@/modules/ordering";

export const GET = withApiHandler(async ({ req, requestId }) => {
  const { restaurantId } = await requireScope(req, "orders:read");
  const query = listOrdersQuerySchema.parse(
    Object.fromEntries(req.nextUrl.searchParams),
  );

  const { orders, total } = await orderingService.listOrders(
    restaurantId,
    query,
  );

  return paginated(
    orders,
    { page: query.page, pageSize: query.pageSize, total },
    requestId,
  );
});
