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

  findTableById(restaurantId: string, id: string) {
    return prisma.table.findFirst({
      where: { id, restaurantId, deletedAt: null },
    });
  },

  createTable(data: {
    restaurantId: string;
    code: string;
    label: string;
    seats: number;
    sortOrder: number;
  }) {
    return prisma.table.create({ data });
  },

  updateTable(id: string, data: Record<string, unknown>) {
    return prisma.table.update({ where: { id }, data });
  },

  softDeleteTable(id: string) {
    return prisma.table.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  },

  countOrdersForTable(tableId: string) {
    return prisma.order.count({ where: { tableId } });
  },
};
