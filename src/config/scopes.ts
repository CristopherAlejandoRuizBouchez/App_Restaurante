/**
 * Scopes de la API pública. Una key solo puede hacer lo que sus scopes permiten.
 * Nomenclatura idéntica a los permisos internos: recurso:accion
 */
export const API_SCOPES = [
  "products:read",
  "products:write",
  "categories:read",
  "tables:read",
  "orders:read",
  "orders:write",
  "reports:read",
  "webhooks:manage",
] as const;

export type ApiScope = (typeof API_SCOPES)[number];

/** Conjuntos predefinidos, para no armar la lista a mano cada vez. */
export const SCOPE_PRESETS: Record<string, readonly ApiScope[]> = {
  readonly: [
    "products:read",
    "categories:read",
    "tables:read",
    "orders:read",
    "reports:read",
  ],
  automation: [
    "products:read",
    "products:write",
    "categories:read",
    "tables:read",
    "orders:read",
    "orders:write",
    "webhooks:manage",
  ],
  full: API_SCOPES,
};

export function isValidScope(value: string): value is ApiScope {
  return (API_SCOPES as readonly string[]).includes(value);
}
