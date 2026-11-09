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

  describe('editor:create-key', () => {
    const { request } = ipcContract['editor:create-key'];

    it('accepts a master passphrase and a new passphrase of 8+ characters', () => {
      expect(request.safeParse({ masterPassphrase: 'x', newPassphrase: '12345678' }).success).toBe(
        true,
      );
    });

    it.each([
      {},
      { masterPassphrase: '', newPassphrase: '12345678' },
      { masterPassphrase: 'x', newPassphrase: 'short' },
    ])('rejects %o', (payload) => {
      expect(request.safeParse(payload).success).toBe(false);
    });
  });

  it('editor:unlock requires a passphrase', () => {
    const { request } = ipcContract['editor:unlock'];
    expect(request.safeParse({ passphrase: 'abc' }).success).toBe(true);
    expect(request.safeParse({ passphrase: '' }).success).toBe(false);
  });
});
