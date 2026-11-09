import { describe, expect, it } from 'vitest';

import { type KeyValueStorage, readStringSet, toggleInSet, writeStringSet } from './persisted-set';

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

describe('persisted string sets', () => {
  it('round-trips values', () => {
    const storage = memoryStorage();
    writeStringSet(storage, 'k', new Set(['a', 'b']));
    expect(readStringSet(storage, 'k')).toEqual(new Set(['a', 'b']));
  });

  it.each(['not json', '{"a":1}', '42'])('ignores malformed data %j', (raw) => {
    expect(readStringSet(memoryStorage({ k: raw }), 'k')).toEqual(new Set());
  });

  it('keeps only strings', () => {
    expect(readStringSet(memoryStorage({ k: '["a",1,null]' }), 'k')).toEqual(new Set(['a']));
  });

  it('tolerates missing or failing storage', () => {
    const failing: KeyValueStorage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(readStringSet(null, 'k')).toEqual(new Set());
    expect(readStringSet(failing, 'k')).toEqual(new Set());
    expect(() => {
      writeStringSet(failing, 'k', new Set(['a']));
    }).not.toThrow();
  });

  it('toggles without mutating the original', () => {
    const original = new Set(['a']);
    expect(toggleInSet(original, 'b')).toEqual(new Set(['a', 'b']));
    expect(toggleInSet(original, 'a')).toEqual(new Set());
    expect(original).toEqual(new Set(['a']));
  });
});
