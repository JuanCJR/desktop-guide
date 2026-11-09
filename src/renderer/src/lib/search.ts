/**
 * Lógica del buscador de la barra superior (`features/shell/top-bar.tsx`).
 *
 * Compara lo que escribe la persona con el nombre y las palabras clave de cada
 * pantalla (definidas en `./navigation.ts`), sin importar mayúsculas ni tildes.
 */

/** Pasa a minúsculas y quita las tildes, para que "inscripción" coincida con "inscripcion". */
export function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export interface SearchableTopic<T> {
  item: T;
  title: string;
  keywords: readonly string[];
}

/**
 * Devuelve los temas cuyo título o palabras clave contienen todas las palabras
 * buscadas, mostrando primero los que coinciden en el título.
 */
export function searchTopics<T>(
  topics: readonly SearchableTopic<T>[],
  query: string,
  limit = 8,
): T[] {
  const words = normalizeText(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  return topics
    .map((topic) => {
      const title = normalizeText(topic.title);
      const haystack = `${title} ${topic.keywords.map(normalizeText).join(' ')}`;
      if (!words.every((word) => haystack.includes(word))) return null;
      const score = words.filter((word) => title.includes(word)).length;
      return { item: topic.item, score };
    })
    .filter((match): match is { item: T; score: number } => match !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((match) => match.item);
}
