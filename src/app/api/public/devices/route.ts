import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { env } from "@/lib/env";
import { deviceAuthService } from "@/modules/identity";

/**
 * Lista los dispositivos para la pantalla de PIN.
 * Solo devuelve id y nombre: sin el PIN no sirve de nada.
 */
export const GET = withApiHandler(async ({ requestId }) => {
  const devices = await deviceAuthService.listDevices(
    env.PUBLIC_API_RESTAURANT_ID,
  );

  return ok({ devices }, requestId);
});
