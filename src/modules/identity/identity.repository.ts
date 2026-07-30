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
};
