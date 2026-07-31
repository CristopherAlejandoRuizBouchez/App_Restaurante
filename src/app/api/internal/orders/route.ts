import { requirePermission } from "@/lib/api/auth-guard";
import { withApiHandler } from "@/lib/api/handler";
import { paginated } from "@/lib/api/response";
import { listOrdersQuerySchema, orderingService } from "@/modules/ordering";

export const GET = withApiHandler(async ({ req, requestId }) => {
  const actor = await requirePermission("order:read");
  const query = listOrdersQuerySchema.parse(
    Object.fromEntries(req.nextUrl.searchParams),
  );

  const { orders, total } = await orderingService.listOrders(
    actor.restaurantId,
    query,
  );

  return paginated(
    orders,
    { page: query.page, pageSize: query.pageSize, total },
    requestId,
  );
});
