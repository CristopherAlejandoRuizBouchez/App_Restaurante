type ClassValue = string | undefined | null | false;

/** Une clases de Tailwind ignorando valores falsy. */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
