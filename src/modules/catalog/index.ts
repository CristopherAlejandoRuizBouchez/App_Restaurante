export { catalogService } from "./catalog.service";
export {
  createCategorySchema,
  updateCategorySchema,
  createProductSchema,
  updateProductSchema,
  setAvailabilitySchema,
  listProductsQuerySchema,
} from "./catalog.schema";
export type {
  CategoryDTO,
  ProductDTO,
  MenuCategoryDTO,
} from "./catalog.mapper";
