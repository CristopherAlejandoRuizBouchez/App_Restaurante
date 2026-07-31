import { AUTH_CONFIG } from "@/config/auth";
import { BusinessRuleError, UnauthorizedError } from "@/lib/errors";
import { identityRepository } from "./identity.repository";
import { verifyPassword } from "./password";
import { expiresInDays, generateToken, hashToken } from "./token";
import type { AuthActor } from "./identity.types";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export interface DeviceSessionResult {
  token: string;
  expiresAt: Date;
  actor: AuthActor;
}

export const deviceAuthService = {
  /** Dispositivos disponibles para la pantalla de PIN. */
  listDevices(restaurantId: string) {
    return identityRepository.listDevices(restaurantId);
  },

  async loginWithPin(
    restaurantId: string,
    deviceId: string,
    pin: string,
  ): Promise<DeviceSessionResult> {
    const device = await identityRepository.findDeviceById(
      restaurantId,
      deviceId,
    );

    const invalid = new UnauthorizedError("PIN incorrecto");

    if (!device || !device.isActive) {
      // Comparación igual, para no delatar por tiempo que el device no existe.
      await verifyPassword(pin, "$2a$12$invalidhashplaceholder");
      throw invalid;
    }

    if (device.lockedUntil && device.lockedUntil > new Date()) {
      const minutes = Math.ceil(
        (device.lockedUntil.getTime() - Date.now()) / 60_000,
      );
      throw new BusinessRuleError(
        "DEVICE_LOCKED",
        `Dispositivo bloqueado por intentos fallidos. Reintentá en ${minutes} minuto(s).`,
      );
    }

    const pinOk = await verifyPassword(pin, device.pinHash);

    if (!pinOk) {
      const attempts = device.failedAttempts + 1;
      const shouldLock = attempts >= MAX_FAILED_ATTEMPTS;

      await identityRepository.registerFailedPin(
        device.id,
        shouldLock ? 0 : attempts,
        shouldLock ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
      );

      throw invalid;
    }

    await identityRepository.resetPinAttempts(device.id);

    const token = generateToken();
    const expiresAt = expiresInDays(AUTH_CONFIG.DEVICE_SESSION_TTL_DAYS);

    await identityRepository.createDeviceSession({
      deviceId: device.id,
      tokenHash: hashToken(token),
      expiresAt,
    });

    return {
      token,
      expiresAt,
      actor: {
        kind: "device",
        id: device.id,
        name: device.name,
        restaurantId: device.restaurantId,
        role: device.role,
      },
    };
  },

  /** Resuelve el actor desde el token de dispositivo. */
  async resolveActor(token: string): Promise<AuthActor | null> {
    const session = await identityRepository.findDeviceSessionByTokenHash(
      hashToken(token),
    );

    if (!session) return null;
    if (session.expiresAt < new Date()) return null;
    if (!session.device.isActive) return null;

    return {
      kind: "device",
      id: session.device.id,
      name: session.device.name,
      restaurantId: session.device.restaurantId,
      role: session.device.role,
    };
  },

  async logout(token: string): Promise<void> {
    await identityRepository.deleteDeviceSessionByTokenHash(hashToken(token));
  },
};
