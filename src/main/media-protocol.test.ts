import { describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({ protocol: {} }));

const { parseRange } = await import('./media-protocol');

describe('parseRange', () => {
  it('reads explicit, open-ended and suffix ranges', () => {
    expect(parseRange('bytes=0-99', 1000)).toEqual([0, 99]);
    expect(parseRange('bytes=500-', 1000)).toEqual([500, 999]);
    expect(parseRange('bytes=-100', 1000)).toEqual([900, 999]);
    expect(parseRange('bytes=900-5000', 1000)).toEqual([900, 999]);
  });

  it('ignores missing or invalid ranges', () => {
    expect(parseRange(null, 1000)).toBeNull();
    expect(parseRange('bytes=2000-', 1000)).toBeNull();
    expect(parseRange('bytes=50-10', 1000)).toBeNull();
    expect(parseRange('items=0-1', 1000)).toBeNull();
    expect(parseRange('bytes=-', 1000)).toBeNull();
  });
});
