import { AUTH_CONFIG } from "@/config/auth";
import { UnauthorizedError } from "@/lib/errors";
import { identityRepository } from "./identity.repository";
import { verifyPassword } from "./password";
import { expiresInHours, generateToken, hashToken } from "./token";
import type { AuthActor, SessionResult } from "./identity.types";

interface LoginInput {
  email: string;
  password: string;
  ip?: string | undefined;
  userAgent?: string | undefined;
}

export const authService = {
  async login(input: LoginInput): Promise<SessionResult> {
    const user = await identityRepository.findUserByEmail(input.email);

    // Mensaje idéntico para email inexistente y contraseña incorrecta:
    // distinguirlos permitiría enumerar qué correos están registrados.
    const invalid = new UnauthorizedError("Email o contraseña incorrectos");

    if (!user || !user.isActive) {
      // Comparación de todos modos, para no filtrar por tiempo de respuesta
      // que el email no existe.
      await verifyPassword(input.password, "$2a$12$invalidhashplaceholder");
      throw invalid;
    }

    const passwordOk = await verifyPassword(input.password, user.passwordHash);
    if (!passwordOk) throw invalid;

    const membership = user.memberships.find(
      (m) => m.restaurant.isActive && m.restaurant.deletedAt === null,
    );

    if (!membership) {
      throw new UnauthorizedError(
        "El usuario no tiene acceso a ningún restaurante",
      );
    }

    const token = generateToken();
    const expiresAt = expiresInHours(AUTH_CONFIG.SESSION_TTL_HOURS);

    await identityRepository.createSession({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt,
      ip: input.ip,
      userAgent: input.userAgent,
    });

    await identityRepository.touchUserLogin(user.id);

    const actor: AuthActor = {
      kind: "user",
      id: user.id,
      name: user.name,
      restaurantId: membership.restaurantId,
      role: membership.role,
    };

    return { token, expiresAt, actor };
  },

  /** Resuelve el actor a partir del token. Devuelve null si no es válido. */
  async resolveActor(token: string): Promise<AuthActor | null> {
    const session = await identityRepository.findSessionByTokenHash(
      hashToken(token),
    );

    if (!session) return null;

    if (session.expiresAt < new Date()) {
      await identityRepository.deleteSessionByTokenHash(session.tokenHash);
      return null;
    }

    if (!session.user.isActive || session.user.deletedAt) return null;

    const membership = session.user.memberships[0];
    if (!membership) return null;

    return {
      kind: "user",
      id: session.user.id,
      name: session.user.name,
      restaurantId: membership.restaurantId,
      role: membership.role,
    };
  },

  async logout(token: string): Promise<void> {
    await identityRepository.deleteSessionByTokenHash(hashToken(token));
  },

  /** Cierra todas las sesiones del usuario. Para "cerrar sesión en todos lados". */
  async logoutAll(userId: string): Promise<void> {
    await identityRepository.deleteAllSessionsForUser(userId);
  },
};
