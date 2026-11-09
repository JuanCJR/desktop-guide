/** Minimal subset of `Storage`, so the logic can be tested without a DOM. */
export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>;

/**
 * Reads a set of strings saved as a JSON array. Returns an empty set when
 * nothing is stored, the value is malformed or storage is unavailable.
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

/** Saves a set of strings; failures (private mode, quota) are ignored. */
export function writeStringSet(
  storage: KeyValueStorage | null,
  key: string,
  values: ReadonlySet<string>,
): void {
  try {
    storage?.setItem(key, JSON.stringify([...values]));
  } catch {
    // Persistence is a convenience; the UI keeps working without it.
  }
}

/** Returns a copy of `values` with `value` added or removed. */
export function toggleInSet(values: ReadonlySet<string>, value: string): Set<string> {
  const next = new Set(values);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}
