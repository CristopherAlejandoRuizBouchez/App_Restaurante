import type { Restaurant, Table } from "@/generated/prisma/client";

export interface RestaurantDTO {
  id: string;
  slug: string;
  name: string;
  timezone: string;
  currency: string;
  requiresStaffConfirmation: boolean;
}

export interface TableDTO {
  id: string;
  code: string;
  label: string;
  seats: number;
  isActive: boolean;
}

export function toRestaurantDTO(r: Restaurant): RestaurantDTO {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    timezone: r.timezone,
    currency: r.currency,
    requiresStaffConfirmation: r.requiresStaffConfirmation,
  };
}

export function toTableDTO(t: Table): TableDTO {
  return {
    id: t.id,
    code: t.code,
    label: t.label,
    seats: t.seats,
    isActive: t.isActive,
  };
}
