import { afterEach, describe, expect, it, vi } from 'vitest';

import type { DesktopApi } from '@shared/ipc/api';

import { invoke, IpcError } from './ipc';

function stubApi(invokeImpl: DesktopApi['invoke']) {
  vi.stubGlobal('window', { api: { invoke: invokeImpl } });
}

describe('invoke', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves with data when the call succeeds', async () => {
    const data = { reply: 'pong: hi', receivedAt: '1970-01-01T00:00:00.000Z' };
    const spy = vi.fn().mockResolvedValue({ ok: true, data });
    stubApi(spy);

    await expect(invoke('app:ping', { message: 'hi' })).resolves.toEqual(data);
    expect(spy).toHaveBeenCalledWith('app:ping', { message: 'hi' });
  });

  it('throws an IpcError carrying the error code', async () => {
    stubApi(
      vi.fn().mockResolvedValue({ ok: false, error: { code: 'INVALID_REQUEST', message: 'bad' } }),
    );

    const promise = invoke('app:ping', { message: '' });

    await expect(promise).rejects.toBeInstanceOf(IpcError);
    await expect(promise).rejects.toMatchObject({ code: 'INVALID_REQUEST', message: 'bad' });
  });
});
