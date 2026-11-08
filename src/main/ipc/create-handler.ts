import type { IpcMainInvokeEvent } from 'electron';

import type { IpcChannel } from '@shared/ipc/channels';
import { ipcContract, type IpcRequest, type IpcResponse } from '@shared/ipc/contract';
import { ipcFail, ipcOk, type IpcResult } from '@shared/ipc/result';

export type IpcHandler<C extends IpcChannel> = (
  request: IpcRequest<C>,
  event: IpcMainInvokeEvent,
) => IpcResponse<C> | Promise<IpcResponse<C>>;

export interface CreateHandlerOptions {
  /** Returns `true` when the event comes from a trusted renderer frame. */
  isTrustedSender: (event: IpcMainInvokeEvent) => boolean;
  /** Receives unexpected errors; defaults to `console.error`. */
  onError?: (channel: IpcChannel, error: unknown) => void;
}

/**
 * Wraps a typed handler with sender verification, request/response schema
 * validation and error serialization. Pure (no Electron runtime imports) so
 * it can be unit-tested in isolation.
 */
export function createIpcHandler<C extends IpcChannel>(
  channel: C,
  handler: IpcHandler<C>,
  { isTrustedSender, onError = defaultOnError }: CreateHandlerOptions,
): (event: IpcMainInvokeEvent, payload: unknown) => Promise<IpcResult<IpcResponse<C>>> {
  const schema = ipcContract[channel];

  return async (event, payload) => {
    if (!isTrustedSender(event)) {
      return ipcFail('FORBIDDEN', `Untrusted sender for "${channel}".`);
    }

    const parsed = schema.request.safeParse(payload);
    if (!parsed.success) {
      return ipcFail('INVALID_REQUEST', parsed.error.issues.map((i) => i.message).join('; '));
    }

    try {
      const result = await handler(parsed.data as IpcRequest<C>, event);
      return ipcOk(schema.response.parse(result) as IpcResponse<C>);
    } catch (error) {
      onError(channel, error);
      return ipcFail('INTERNAL_ERROR', 'Unexpected error while handling the request.');
    }
  };
}

function defaultOnError(channel: IpcChannel, error: unknown): void {
  console.error(`[ipc] ${channel} failed:`, error);
}
