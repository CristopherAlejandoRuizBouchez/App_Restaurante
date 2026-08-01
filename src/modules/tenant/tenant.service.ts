import { randomBytes } from "node:crypto";
import { BusinessRuleError, NotFoundError } from "@/lib/errors";
import type { CreateTableInput, UpdateTableInput } from "./tenant.schema";
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

  async createTable(
    restaurantId: string,
    input: CreateTableInput,
  ): Promise<TableDTO> {
    // Código aleatorio: si fuera "mesa-4", cualquiera podría adivinar
    // el de otra mesa y pedir en su nombre.
    const code = randomBytes(5).toString("hex");

    const table = await tenantRepository.createTable({
      restaurantId,
      code,
      label: input.label,
      seats: input.seats,
      sortOrder: input.sortOrder,
    });

    return toTableDTO(table);
  },

  async updateTable(
    restaurantId: string,
    id: string,
    input: UpdateTableInput,
  ): Promise<TableDTO> {
    const existing = await tenantRepository.findTableById(restaurantId, id);
    if (!existing) throw new NotFoundError("Mesa");

    const updated = await tenantRepository.updateTable(id, input);
    return toTableDTO(updated);
  },

  async deleteTable(restaurantId: string, id: string): Promise<void> {
    const existing = await tenantRepository.findTableById(restaurantId, id);
    if (!existing) throw new NotFoundError("Mesa");

    const orderCount = await tenantRepository.countOrdersForTable(id);

    if (orderCount > 0) {
      throw new BusinessRuleError(
        "TABLE_HAS_ORDERS",
        `No se puede eliminar: la mesa tiene ${orderCount} pedido(s) en su historial. Desactivala en su lugar.`,
      );
    }

    await tenantRepository.softDeleteTable(id);
  },
};
