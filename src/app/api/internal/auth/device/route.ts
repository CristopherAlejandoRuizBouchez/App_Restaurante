import { z } from "zod";
import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { readJsonBody } from "@/lib/api/read-body";
import { setDeviceCookie } from "@/lib/api/device-cookie";
import { NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { deviceAuthService } from "@/modules/identity";

const bodySchema = z.object({
  restaurantSlug: z.string().min(1),
  deviceId: z.string().min(1, "Seleccioná un dispositivo"),
  pin: z
    .string()
    .min(4, "El PIN debe tener al menos 4 dígitos")
    .max(8)
    .regex(/^\d+$/, "El PIN solo puede tener números"),
});

export const POST = withApiHandler(async ({ req, requestId }) => {
  const body = bodySchema.parse(await readJsonBody(req));

  const restaurant = await prisma.restaurant.findFirst({
    where: { slug: body.restaurantSlug, isActive: true, deletedAt: null },
    select: { id: true },
  });

  if (!restaurant) throw new NotFoundError("Restaurante");

  const result = await deviceAuthService.loginWithPin(
    restaurant.id,
    body.deviceId,
    body.pin,
  );

  await setDeviceCookie(result.token, result.expiresAt);

  return ok({ actor: result.actor }, requestId);
});
