import { z } from "zod";
import { requireScope } from "@/lib/api/auth-api-key";
import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { reportingService } from "@/modules/reporting";

const querySchema = z.object({
  days: z.coerce.number().int().min(0).max(365).default(0),
});

export const GET = withApiHandler(async ({ req, requestId }) => {
  const { restaurantId } = await requireScope(req, "reports:read");
  const query = querySchema.parse(Object.fromEntries(req.nextUrl.searchParams));

  const restaurant = await prisma.restaurant.findUniqueOrThrow({
    where: { id: restaurantId },
    select: { timezone: true },
  });

  const summary = await reportingService.getSalesSummary(
    restaurantId,
    restaurant.timezone,
    query.days,
  );

  return ok({ summary }, requestId);
});
