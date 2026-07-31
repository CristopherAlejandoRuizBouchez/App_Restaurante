/**
 * El dinero SIEMPRE se guarda y transporta en centavos (Int).
 * La conversión a texto es responsabilidad exclusiva de la capa de UI.
 */

export function formatMoney(
  cents: number,
  currency = "MXN",
  locale = "es-MX",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(cents / 100);
}

/** Convierte lo que escribe un humano ("129.90") a centavos. */
export function parseMoneyToCents(input: string | number): number {
  const value = typeof input === "number" ? input : Number(input);
  if (!Number.isFinite(value)) {
    throw new Error("Monto inválido");
  }
  return Math.round(value * 100);
}
