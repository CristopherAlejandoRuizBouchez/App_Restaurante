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
export function todayRange(timezone: string): { start: Date; end: Date } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(new Date());

  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? "00";

  const start = new Date(
    `${get("year")}-${get("month")}-${get("day")}T00:00:00`,
  );
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}
