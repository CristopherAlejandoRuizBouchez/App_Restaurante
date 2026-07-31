import type { Permission } from "@/config/permissions";
import { hasPermission } from "@/config/permissions";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import {
  authService,
  deviceAuthService,
  type AuthActor,
} from "@/modules/identity";
import { getSessionToken } from "@/lib/api/session-cookie";
import { getDeviceToken } from "@/lib/api/device-cookie";

/**
 * Exige una identidad válida: usuario del panel o dispositivo con PIN.
 * Ambos devuelven el mismo AuthActor, así que los endpoints no cambian.
 */
export async function requireAuth(): Promise<AuthActor> {
  const userToken = await getSessionToken();

  if (userToken) {
    const actor = await authService.resolveActor(userToken);
    if (actor) return actor;
  }

  const deviceToken = await getDeviceToken();

  if (deviceToken) {
    const actor = await deviceAuthService.resolveActor(deviceToken);
    if (actor) return actor;
  }

  throw new UnauthorizedError("No hay sesión activa");
}

/** Exige identidad válida Y un permiso concreto. Lanza 401 o 403. */
export async function requirePermission(
  permission: Permission,
): Promise<AuthActor> {
  const actor = await requireAuth();

  if (!hasPermission(actor.role, permission)) {
    throw new ForbiddenError(`Tu rol (${actor.role}) no permite esta acción`);
  }

  return actor;
}
