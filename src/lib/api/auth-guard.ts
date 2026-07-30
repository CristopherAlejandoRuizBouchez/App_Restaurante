import type { Permission } from "@/config/permissions";
import { hasPermission } from "@/config/permissions";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { authService, type AuthActor } from "@/modules/identity";
import { getSessionToken } from "@/lib/api/session-cookie";

/** Exige sesión válida. Lanza 401 si no hay. */
export async function requireAuth(): Promise<AuthActor> {
  const token = await getSessionToken();
  if (!token) throw new UnauthorizedError("No hay sesión activa");

  const actor = await authService.resolveActor(token);
  if (!actor) throw new UnauthorizedError("Sesión inválida o expirada");

  return actor;
}

/** Exige sesión válida Y un permiso concreto. Lanza 401 o 403. */
export async function requirePermission(
  permission: Permission,
): Promise<AuthActor> {
  const actor = await requireAuth();

  if (!hasPermission(actor.role, permission)) {
    throw new ForbiddenError(`Tu rol (${actor.role}) no permite esta acción`);
  }

  return actor;
}
