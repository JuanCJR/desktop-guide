/**
 * Crea un identificador corto y único para los elementos nuevos que se agregan
 * en el modo edición (por ejemplo, `step-1a2b3c4d`). Cumple el formato de
 * identificadores de `src/shared/content/schema.ts`.
 */
export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}
