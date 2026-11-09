import { describe, expect, it } from 'vitest';

import { moveItem, removeAt, replaceAt } from './list';

describe('list helpers', () => {
  const items = ['a', 'b', 'c'];

  it('replaces and removes by index', () => {
    expect(replaceAt(items, 1, 'x')).toEqual(['a', 'x', 'c']);
    expect(removeAt(items, 0)).toEqual(['b', 'c']);
    expect(items).toEqual(['a', 'b', 'c']);
  });

  it('moves items up and down', () => {
    expect(moveItem(items, 0, 1)).toEqual(['b', 'a', 'c']);
    expect(moveItem(items, 2, -2)).toEqual(['c', 'a', 'b']);
  });

  it('ignores moves out of range', () => {
    expect(moveItem(items, 0, -1)).toEqual(items);
    expect(moveItem(items, 2, 1)).toEqual(items);
    expect(moveItem(items, 5, -1)).toEqual(items);
  });
});
