/**
 * Lógica para recordar en este computador un conjunto de textos (por ejemplo,
 * las tareas de inscripción que el estudiante ya marcó como hechas), aunque se
 * cierre la app. Se guarda en el almacenamiento local del navegador interno.
 *
 * Lo usa el hook `src/renderer/src/hooks/use-persisted-set.ts`. Está separado
 * para poder probarlo con tests sin una ventana real.
 */

/** Parte mínima de `Storage`, para poder probar la lógica sin una ventana real. */
export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>;

/**
 * Lee un conjunto de textos guardado como lista JSON. Devuelve un conjunto
 * vacío si no hay nada guardado, si el valor está dañado o si no hay almacenamiento.
 */
export function readStringSet(storage: KeyValueStorage | null, key: string): Set<string> {
  try {
    const raw = storage?.getItem(key);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((value): value is string => typeof value === 'string'));
  } catch {
    return new Set();
  }
}

/** Guarda un conjunto de textos; si falla (sin espacio, modo privado) se ignora. */
export function writeStringSet(
  storage: KeyValueStorage | null,
  key: string,
  values: ReadonlySet<string>,
): void {
  try {
    storage?.setItem(key, JSON.stringify([...values]));
  } catch {
    // Recordar es solo una comodidad; la interfaz sigue funcionando sin ello.
  }
}

/** Devuelve una copia de `values` con `value` agregado o quitado (como marcar/desmarcar). */
export function toggleInSet(values: ReadonlySet<string>, value: string): Set<string> {
  const next = new Set(values);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}
