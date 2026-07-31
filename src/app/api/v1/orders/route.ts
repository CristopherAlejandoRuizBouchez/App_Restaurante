import { readJsonBody } from "@/lib/api/read-body";
import { ActorSource } from "@/generated/prisma/client";
import { requireScope } from "@/lib/api/auth-api-key";
import { withApiHandler } from "@/lib/api/handler";
import { withIdempotency } from "@/lib/api/idempotency";
import { created, paginated } from "@/lib/api/response";
import { NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import {
  createOrderApiSchema,
  listOrdersQuerySchema,
  orderingService,
  tableSessionService,
} from "@/modules/ordering";

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

export const POST = withApiHandler(async ({ req, requestId }) => {
  const { restaurantId, apiKeyId } = await requireScope(req, "orders:write");
  const rawBody = await readJsonBody(req);

  return withIdempotency(req, apiKeyId, rawBody, async () => {
    const body = createOrderApiSchema.parse(rawBody);

    const table = await prisma.table.findFirst({
      where: {
        id: body.tableId,
        restaurantId,
        deletedAt: null,
        isActive: true,
      },
    });
    if (!table) throw new NotFoundError("Mesa");

    const restaurant = await prisma.restaurant.findUniqueOrThrow({
      where: { id: restaurantId },
      select: { timezone: true, requiresStaffConfirmation: true },
    });

    const session = await tableSessionService.getOrOpenSession(
      restaurantId,
      table.id,
    );

    const order = await orderingService.createOrder(
      {
        restaurantId,
        sessionId: session.id,
        tableId: table.id,
        timezone: restaurant.timezone,
        requiresStaffConfirmation: restaurant.requiresStaffConfirmation,
      },
      { items: body.items, notes: body.notes },
      { source: ActorSource.API, name: "Make" },
    );

    return created({ order }, requestId);
  });
});
