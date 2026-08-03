import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { deviceAuthService } from "@/modules/identity";

export const GET = withApiHandler(async ({ req, requestId }) => {
  const slug = req.nextUrl.searchParams.get("restaurante");

  if (!slug) {
    throw new ValidationError("Falta el parámetro 'restaurante'");
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: { slug, isActive: true, deletedAt: null },
    select: { id: true, name: true },
  });

  if (!restaurant) throw new NotFoundError("Restaurante");

  const devices = await deviceAuthService.listDevices(restaurant.id);

  return ok(
    { devices, restaurantId: restaurant.id, restaurantName: restaurant.name },
    requestId,
  );
});
