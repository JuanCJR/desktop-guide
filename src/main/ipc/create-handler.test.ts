import type { IpcMainInvokeEvent } from 'electron';
import { describe, expect, it, vi } from 'vitest';

import { createIpcHandler } from './create-handler';

const event = {} as IpcMainInvokeEvent;
const trusted = { isTrustedSender: () => true, onError: vi.fn() };

const pingHandler = () => ({ reply: 'pong', receivedAt: new Date(0).toISOString() });

describe('createIpcHandler', () => {
  it('returns ok with validated data', async () => {
    const handle = createIpcHandler('app:ping', pingHandler, trusted);

    await expect(handle(event, { message: 'hi' })).resolves.toEqual({
      ok: true,
      data: { reply: 'pong', receivedAt: '1970-01-01T00:00:00.000Z' },
    });
  });

  it('passes the parsed (trimmed) request to the handler', async () => {
    const handler = vi.fn(pingHandler);
    await createIpcHandler('app:ping', handler, trusted)(event, { message: '  hi  ' });

    expect(handler).toHaveBeenCalledWith({ message: 'hi' }, event);
  });

  it('rejects untrusted senders without calling the handler', async () => {
    const handler = vi.fn(pingHandler);
    const handle = createIpcHandler('app:ping', handler, { isTrustedSender: () => false });

    const result = await handle(event, { message: 'hi' });

    expect(result).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
    expect(handler).not.toHaveBeenCalled();
  });

  it('rejects invalid payloads', async () => {
    const handle = createIpcHandler('app:ping', pingHandler, trusted);

    await expect(handle(event, { message: '' })).resolves.toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });
  });

  it('serializes thrown errors without leaking details', async () => {
    const onError = vi.fn();
    const boom = new Error('secret details');
    const handle = createIpcHandler(
      'app:ping',
      () => {
        throw boom;
      },
      { isTrustedSender: () => true, onError },
    );

    const result = await handle(event, { message: 'hi' });

    expect(result).toEqual({
      ok: false,
      error: { code: 'INTERNAL_ERROR', message: 'Unexpected error while handling the request.' },
    });
    expect(onError).toHaveBeenCalledWith('app:ping', boom);
  });

  it('treats responses that break the contract as internal errors', async () => {
    const handle = createIpcHandler(
      'app:ping',
      () => ({ reply: 'pong', receivedAt: 'not-a-date' }),
      trusted,
    );

    await expect(handle(event, { message: 'hi' })).resolves.toMatchObject({
      ok: false,
      error: { code: 'INTERNAL_ERROR' },
    });
  });
});
