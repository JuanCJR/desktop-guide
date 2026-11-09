/**
 * Utilidades para listas que usan los formularios del modo edición: cambiar,
 * quitar o mover un elemento (por ejemplo, reordenar los pasos de
 * inscripción). Siempre devuelven una lista nueva en vez de modificar la
 * original, que es como React detecta los cambios.
 */

// Reemplaza el elemento de la posición `index`.
export function replaceAt<T>(items: readonly T[], index: number, value: T): T[] {
  return items.map((item, i) => (i === index ? value : item));
}

// Quita el elemento de la posición `index`.
export function removeAt<T>(items: readonly T[], index: number): T[] {
  return items.filter((_, i) => i !== index);
}

/** Mueve el elemento de `index` `delta` posiciones; si se sale de la lista, no hace nada. */
export function moveItem<T>(items: readonly T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) {
    return [...items];
  }
  const next = [...items];
  const [moved] = next.splice(index, 1) as [T];
  next.splice(target, 0, moved);
  return next;
}
