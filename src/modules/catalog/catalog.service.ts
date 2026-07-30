import { BusinessRuleError, NotFoundError } from "@/lib/errors";
import { catalogRepository } from "./catalog.repository";
import {
  toCategoryDTO,
  toProductDTO,
  type CategoryDTO,
  type MenuCategoryDTO,
  type ProductDTO,
} from "./catalog.mapper";
import type {
  CreateCategoryInput,
  CreateProductInput,
  ListProductsQuery,
  UpdateCategoryInput,
  UpdateProductInput,
} from "./catalog.schema";

export const catalogService = {
  // ---------- Categorías ----------

  async listCategories(
    restaurantId: string,
    includeInactive = false,
  ): Promise<CategoryDTO[]> {
    const categories = await catalogRepository.listCategories(
      restaurantId,
      includeInactive,
    );
    return categories.map(toCategoryDTO);
  },

  async createCategory(
    restaurantId: string,
    input: CreateCategoryInput,
  ): Promise<CategoryDTO> {
    const category = await catalogRepository.createCategory(
      restaurantId,
      input,
    );
    return toCategoryDTO(category);
  },

  async updateCategory(
    restaurantId: string,
    id: string,
    input: UpdateCategoryInput,
  ): Promise<CategoryDTO> {
    const existing = await catalogRepository.findCategoryById(restaurantId, id);
    if (!existing) throw new NotFoundError("Categoría");

    const updated = await catalogRepository.updateCategory(id, input);
    return toCategoryDTO(updated);
  },

  async deleteCategory(restaurantId: string, id: string): Promise<void> {
    const existing = await catalogRepository.findCategoryById(restaurantId, id);
    if (!existing) throw new NotFoundError("Categoría");

    const productCount = await catalogRepository.countProductsInCategory(id);

    if (productCount > 0) {
      throw new BusinessRuleError(
        "CATEGORY_HAS_PRODUCTS",
        `No se puede eliminar: la categoría tiene ${productCount} producto(s). Movelos o eliminalos primero.`,
      );
    }

    await catalogRepository.softDeleteCategory(id);
  },

  // ---------- Productos ----------

  async listProducts(
    restaurantId: string,
    query: ListProductsQuery,
  ): Promise<ProductDTO[]> {
    const products = await catalogRepository.listProducts(restaurantId, query);
    return products.map(toProductDTO);
  },

  async getProduct(restaurantId: string, id: string): Promise<ProductDTO> {
    const product = await catalogRepository.findProductById(restaurantId, id);
    if (!product) throw new NotFoundError("Producto");

    return toProductDTO(product);
  },

  async createProduct(
    restaurantId: string,
    input: CreateProductInput,
  ): Promise<ProductDTO> {
    const category = await catalogRepository.findCategoryById(
      restaurantId,
      input.categoryId,
    );
    if (!category) throw new NotFoundError("Categoría");

    const product = await catalogRepository.createProduct(restaurantId, input);
    return toProductDTO(product);
  },

  async updateProduct(
    restaurantId: string,
    id: string,
    input: UpdateProductInput,
  ): Promise<ProductDTO> {
    const existing = await catalogRepository.findProductById(restaurantId, id);
    if (!existing) throw new NotFoundError("Producto");

    if (input.categoryId && input.categoryId !== existing.categoryId) {
      const category = await catalogRepository.findCategoryById(
        restaurantId,
        input.categoryId,
      );
      if (!category) throw new NotFoundError("Categoría");
    }

    const updated = await catalogRepository.updateProduct(id, input);
    return toProductDTO(updated);
  },

  async setAvailability(
    restaurantId: string,
    id: string,
    isAvailable: boolean,
  ): Promise<ProductDTO> {
    const existing = await catalogRepository.findProductById(restaurantId, id);
    if (!existing) throw new NotFoundError("Producto");

    const updated = await catalogRepository.setAvailability(id, isAvailable);
    return toProductDTO(updated);
  },

  async deleteProduct(restaurantId: string, id: string): Promise<void> {
    const existing = await catalogRepository.findProductById(restaurantId, id);
    if (!existing) throw new NotFoundError("Producto");

    await catalogRepository.softDeleteProduct(id);
  },

  // ---------- Menú público ----------

  /** Menú completo para el comensal: solo activos y disponibles. */
  async getPublicMenu(restaurantId: string): Promise<MenuCategoryDTO[]> {
    const [categories, products] = await Promise.all([
      catalogRepository.listCategories(restaurantId, false),
      catalogRepository.listProducts(restaurantId, { onlyAvailable: true }),
    ]);

    return categories
      .map((category) => ({
        ...toCategoryDTO(category),
        products: products
          .filter((p) => p.categoryId === category.id)
          .map(toProductDTO),
      }))
      .filter((category) => category.products.length > 0);
  },
};
