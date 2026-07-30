import { prisma } from "@/lib/prisma";
import type {
  CreateCategoryInput,
  CreateProductInput,
  ListProductsQuery,
  UpdateCategoryInput,
  UpdateProductInput,
} from "./catalog.schema";

export const catalogRepository = {
  // ---------- Categorías ----------

  listCategories(restaurantId: string, includeInactive = false) {
    return prisma.category.findMany({
      where: {
        restaurantId,
        deletedAt: null,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  },

  findCategoryById(restaurantId: string, id: string) {
    return prisma.category.findFirst({
      where: { id, restaurantId, deletedAt: null },
    });
  },

  createCategory(restaurantId: string, data: CreateCategoryInput) {
    return prisma.category.create({
      data: { ...data, restaurantId },
    });
  },

  updateCategory(id: string, data: UpdateCategoryInput) {
    return prisma.category.update({ where: { id }, data });
  },

  softDeleteCategory(id: string) {
    return prisma.category.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  },

  countProductsInCategory(categoryId: string) {
    return prisma.product.count({
      where: { categoryId, deletedAt: null },
    });
  },

  // ---------- Productos ----------

  listProducts(restaurantId: string, query: ListProductsQuery) {
    return prisma.product.findMany({
      where: {
        restaurantId,
        deletedAt: null,
        ...(query.includeInactive ? {} : { isActive: true }),
        ...(query.onlyAvailable ? { isAvailable: true } : {}),
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  },

  findProductById(restaurantId: string, id: string) {
    return prisma.product.findFirst({
      where: { id, restaurantId, deletedAt: null },
    });
  },

  createProduct(restaurantId: string, data: CreateProductInput) {
    return prisma.product.create({
      data: { ...data, restaurantId },
    });
  },

  updateProduct(id: string, data: UpdateProductInput) {
    return prisma.product.update({ where: { id }, data });
  },

  setAvailability(id: string, isAvailable: boolean) {
    return prisma.product.update({
      where: { id },
      data: { isAvailable },
    });
  },

  softDeleteProduct(id: string) {
    return prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  },
};
