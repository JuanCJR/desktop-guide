/**
 * Compatibilidad hacia adelante del contenido publicado.
 *
 * Cuando una versión nueva de la app agrega secciones al manual (por ejemplo,
 * una página nueva), los paquetes `.psm` publicados con la versión anterior no
 * las traen. Sin esta función, el esquema (`./schema.ts`) los rechazaría y la
 * app volvería al contenido original, perdiendo lo que la escuela editó.
 *
 * `fillMissingSections` completa solo las secciones que FALTAN con las del
 * contenido original (`./default-content.ts`); las que sí vienen en el paquete
 * se dejan tal cual. La usa `src/main/content/signing.ts` después de verificar
 * la firma, así que no permite colar contenido sin firmar.
 */
import type { ManualContent } from './schema';

export function fillMissingSections(raw: unknown, defaults: ManualContent): unknown {
  // Si no es un objeto, no hay nada que completar: el esquema lo rechazará.
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return raw;
  const completed: Record<string, unknown> = { ...raw };
  for (const [key, value] of Object.entries(defaults)) {
    if (!(key in completed)) completed[key] = value;
  }
  return completed;
}
