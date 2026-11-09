/** Lowercases and strips accents so "inscripción" matches "inscripcion". */
export function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export interface SearchableTopic<T> {
  item: T;
  title: string;
  keywords: readonly string[];
}

/**
 * Returns the topics whose title or keywords contain every word of the
 * query, ranking title matches first.
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
