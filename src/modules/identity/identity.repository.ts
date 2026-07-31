import { prisma } from "@/lib/prisma";

export const identityRepository = {
  findUserByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
      include: {
        memberships: {
          include: {
            restaurant: {
              select: { id: true, isActive: true, deletedAt: true },
            },
          },
        },
      },
    });
  },

  createSession(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    ip?: string | undefined;
    userAgent?: string | undefined;
  }) {
    return prisma.session.create({ data });
  },

  findSessionByTokenHash(tokenHash: string) {
    return prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            memberships: true,
          },
        },
      },
    });
  },

  deleteSessionByTokenHash(tokenHash: string) {
    return prisma.session.deleteMany({ where: { tokenHash } });
  },

  deleteAllSessionsForUser(userId: string) {
    return prisma.session.deleteMany({ where: { userId } });
  },

  touchUserLogin(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  },

  deleteExpiredSessions() {
    return prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  },

  // ---------- Dispositivos ----------

  listDevices(restaurantId: string) {
    return prisma.device.findMany({
      where: { restaurantId, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  },

  findDeviceById(restaurantId: string, id: string) {
    return prisma.device.findFirst({
      where: { id, restaurantId },
    });
  },

  registerFailedPin(
    deviceId: string,
    attempts: number,
    lockedUntil: Date | null,
  ) {
    return prisma.device.update({
      where: { id: deviceId },
      data: { failedAttempts: attempts, lockedUntil },
    });
  },

  resetPinAttempts(deviceId: string) {
    return prisma.device.update({
      where: { id: deviceId },
      data: { failedAttempts: 0, lockedUntil: null, lastSeenAt: new Date() },
    });
  },

  createDeviceSession(data: {
    deviceId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return prisma.deviceSession.create({ data });
  },

  findDeviceSessionByTokenHash(tokenHash: string) {
    return prisma.deviceSession.findUnique({
      where: { tokenHash },
      include: { device: true },
    });
  },

  deleteDeviceSessionByTokenHash(tokenHash: string) {
    return prisma.deviceSession.deleteMany({ where: { tokenHash } });
  },
};
