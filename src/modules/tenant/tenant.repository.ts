import { prisma } from "@/lib/prisma";

export const tenantRepository = {
  findById(restaurantId: string) {
    return prisma.restaurant.findFirst({
      where: { id: restaurantId, deletedAt: null },
    });
  },

  findTables(restaurantId: string) {
    return prisma.table.findMany({
      where: { restaurantId, deletedAt: null },
      orderBy: { sortOrder: "asc" },
    });
  },

  findTableByCode(restaurantId: string, code: string) {
    return prisma.table.findFirst({
      where: { restaurantId, code, deletedAt: null, isActive: true },
    });
  },
};
