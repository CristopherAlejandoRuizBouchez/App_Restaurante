import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { getSessionToken } from "@/lib/api/session-cookie";
import { UnauthorizedError } from "@/lib/errors";
import { authService } from "@/modules/identity";

export const GET = withApiHandler(async ({ requestId }) => {
  const token = await getSessionToken();
  if (!token) throw new UnauthorizedError("No hay sesión activa");

  const actor = await authService.resolveActor(token);
  if (!actor) throw new UnauthorizedError("Sesión inválida o expirada");

  return ok({ actor }, requestId);
});
