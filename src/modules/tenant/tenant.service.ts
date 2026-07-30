import { NotFoundError } from "@/lib/errors";
import { tenantRepository } from "./tenant.repository";
import {
  toRestaurantDTO,
  toTableDTO,
  type RestaurantDTO,
  type TableDTO,
} from "./tenant.mapper";

export const tenantService = {
  async getRestaurant(restaurantId: string): Promise<RestaurantDTO> {
    const restaurant = await tenantRepository.findById(restaurantId);
    if (!restaurant) throw new NotFoundError("Restaurante");

    return toRestaurantDTO(restaurant);
  },

  async listTables(restaurantId: string): Promise<TableDTO[]> {
    const tables = await tenantRepository.findTables(restaurantId);
    return tables.map(toTableDTO);
  },

  async getTableByCode(restaurantId: string, code: string): Promise<TableDTO> {
    const table = await tenantRepository.findTableByCode(restaurantId, code);
    if (!table) throw new NotFoundError("Mesa");

    return toTableDTO(table);
  },
};
