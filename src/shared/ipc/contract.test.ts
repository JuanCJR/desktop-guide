import { describe, expect, it } from 'vitest';

import { IPC_CHANNELS, isIpcChannel } from './channels';
import { ipcContract } from './contract';

describe('IPC contract', () => {
  it('defines schemas for every declared channel', () => {
    expect(Object.keys(ipcContract).sort()).toEqual([...IPC_CHANNELS].sort());
  });

  it('recognises only declared channels', () => {
    expect(isIpcChannel('app:ping')).toBe(true);
    expect(isIpcChannel('app:unknown')).toBe(false);
    expect(isIpcChannel(42)).toBe(false);
  });

  describe('app:ping', () => {
    const { request } = ipcContract['app:ping'];

    it('accepts a valid message', () => {
      expect(request.parse({ message: '  hello ' })).toEqual({ message: 'hello' });
    });

    it.each([{}, { message: '' }, { message: '   ' }, { message: 'x'.repeat(201) }])(
      'rejects %o',
      (payload) => {
        expect(request.safeParse(payload).success).toBe(false);
      },
    );
  });
});
