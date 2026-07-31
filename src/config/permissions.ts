import type { Role } from "@/generated/prisma/client";

/**
 * Permisos del sistema. Nomenclatura: recurso:accion
 * Agregar uno acá obliga a declararlo en cada rol (TypeScript lo exige).
 */
export const PERMISSIONS = [
  "restaurant:read",
  "restaurant:update",

  "webhook:manage",
  "apikey:manage",

  "user:read",
  "user:invite",
  "user:update",
  "user:delete",

  "device:read",
  "device:manage",

  "table:read",
  "table:manage",

  "product:read",
  "product:manage",
  "product:availability",

  "order:read",
  "order:create",
  "order:update_status",
  "order:cancel",

  "report:read",

  "integration:manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const STAFF_PERMISSIONS: Permission[] = [
  "restaurant:read",
  "table:read",
  "product:read",
  "product:availability",
  "order:read",
  "order:create",
  "order:update_status",
];

const MANAGER_PERMISSIONS: Permission[] = [
  ...STAFF_PERMISSIONS,
  "user:read",
  "device:read",
  "table:manage",
  "product:manage",
  "order:cancel",
  "report:read",
];

const ADMIN_PERMISSIONS: Permission[] = [
  ...MANAGER_PERMISSIONS,
  "restaurant:update",
  "user:invite",
  "user:update",
  "device:manage",
  "integration:manage",
  "webhook:manage",
  "apikey:manage",
];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  OWNER: PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
  MANAGER: MANAGER_PERMISSIONS,
  STAFF: STAFF_PERMISSIONS,

  // La tablet de cocina: solo lee pedidos y mueve estados.
  // Aunque se la roben, no puede ver ventas ni tocar precios.
  KITCHEN: ["order:read", "order:update_status", "product:availability"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
