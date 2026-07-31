export interface PricedLine {
  productId: string;
  productName: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  notes?: string | undefined;
}

export interface OrderTotals {
  lines: PricedLine[];
  subtotalCents: number;
  totalCents: number;
}

/**
 * ÚNICO lugar donde se calculan totales.
 * Cuando lleguen modificadores, propinas o impuestos, se agregan acá
 * y todo el sistema los hereda sin tocar nada más.
 */
export const pricingService = {
  calculate(lines: Omit<PricedLine, "lineTotalCents">[]): OrderTotals {
    const priced: PricedLine[] = lines.map((line) => ({
      ...line,
      lineTotalCents: line.unitPriceCents * line.quantity,
    }));

    const subtotalCents = priced.reduce(
      (sum, line) => sum + line.lineTotalCents,
      0,
    );

    return {
      lines: priced,
      subtotalCents,
      // Hoy total = subtotal. Impuestos y propina entran acá cuando existan.
      totalCents: subtotalCents,
    };
  },
};
