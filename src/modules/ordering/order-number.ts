/**
 * Número corto y legible para el comensal y el personal: "A-047".
 * Nadie va a leer un cuid en voz alta en un restaurante.
 * La letra rota por bloques de 999 para no repetir dentro del mismo día.
 */
export function buildOrderNumber(dailySequence: number): string {
  const letterIndex = Math.floor((dailySequence - 1) / 999) % 26;
  const letter = String.fromCharCode(65 + letterIndex);
  const number = ((dailySequence - 1) % 999) + 1;

  return `${letter}-${String(number).padStart(3, "0")}`;
}

/** Rango del día actual en la zona horaria del restaurante. */
/**
 * Rango del día actual en la zona horaria del restaurante,
 * expresado en UTC para comparar contra createdAt.
 */
export function todayRange(timezone: string): { start: Date; end: Date } {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  // Cuánto difiere la hora local del restaurante respecto a UTC.
  const localAsUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second"),
  );

  const offsetMs = localAsUtc - Math.floor(now.getTime() / 1000) * 1000;

  // Medianoche local, convertida a UTC.
  const startLocal = Date.UTC(get("year"), get("month") - 1, get("day"));
  const start = new Date(startLocal - offsetMs);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { start, end };
}

/** Convierte "A-047" de vuelta a su número secuencial (47). */
export function parseOrderNumber(orderNumber: string): number {
  const [letter, digits] = orderNumber.split("-");
  if (!letter || !digits) return 0;

  const letterIndex = letter.charCodeAt(0) - 65;
  return letterIndex * 999 + Number(digits);
}
