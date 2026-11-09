/** Short unique id for items created in the editor (matches the content id schema). */
export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}
