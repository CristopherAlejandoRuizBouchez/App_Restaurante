import { z } from "zod";
import { requireGuest } from "@/lib/api/guest-guard";
import { withApiHandler } from "@/lib/api/handler";
import { created, ok } from "@/lib/api/response";
import { readJsonBody } from "@/lib/api/read-body";
import { ValidationError } from "@/lib/errors";
import { isValidReason, waiterCallService } from "@/modules/ordering";

const bodySchema = z.object({ reason: z.string().min(1) });

export const POST = withApiHandler(async ({ req, requestId }) => {
  const guest = await requireGuest();
  const body = bodySchema.parse(await readJsonBody(req));

  if (!isValidReason(body.reason)) {
    throw new ValidationError("Motivo desconocido");
  }

  const call = await waiterCallService.create(
    guest.restaurantId,
    guest.sessionId,
    guest.tableId,
    body.reason,
  );

  return created({ call }, requestId);
});

/** Llamado activo, para saber si el botón debe estar deshabilitado. */
export const GET = withApiHandler(async ({ requestId }) => {
  const guest = await requireGuest();
  const call = await waiterCallService.getActiveForSession(guest.sessionId);

  return ok({ call }, requestId);
});
