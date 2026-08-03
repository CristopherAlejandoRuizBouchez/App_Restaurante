import { ActorSource } from "@/generated/prisma/client";
import { requireGuest } from "@/lib/api/guest-guard";
import { withApiHandler } from "@/lib/api/handler";
import { created, ok } from "@/lib/api/response";
import { readJsonBody } from "@/lib/api/read-body";
import { prisma } from "@/lib/prisma";
import { createOrderSchema, orderingService } from "@/modules/ordering";

export const POST = withApiHandler(async ({ req, requestId }) => {
  const guest = await requireGuest();
  const body = createOrderSchema.parse(await readJsonBody(req));

  const restaurant = await prisma.restaurant.findUniqueOrThrow({
    where: { id: guest.restaurantId },
    select: { timezone: true, requiresStaffConfirmation: true },
  });

  const order = await orderingService.createOrder(
    {
      restaurantId: guest.restaurantId,
      sessionId: guest.sessionId,
      tableId: guest.tableId,
      guestTokenId: guest.guestTokenId,
      timezone: restaurant.timezone,
      requiresStaffConfirmation: restaurant.requiresStaffConfirmation,
    },
    body,
    { source: ActorSource.CUSTOMER },
  );

  return created({ order }, requestId);
});

export const GET = withApiHandler(async ({ requestId }) => {
  const guest = await requireGuest();

  const result = await orderingService.getSessionOrders(
    guest.restaurantId,
    guest.sessionId,
  );

  return ok(result, requestId);
});
