import type { IpcInvokeArgs } from '@shared/ipc/api';
import type { IpcChannel } from '@shared/ipc/channels';
import type { IpcResponse } from '@shared/ipc/contract';
import type { IpcError as IpcErrorShape, IpcErrorCode } from '@shared/ipc/result';

export class IpcError extends Error {
  readonly code: IpcErrorCode;

  constructor({ code, message }: IpcErrorShape) {
    super(message);
    this.name = 'IpcError';
    this.code = code;
  }
}

/**
 * Typed IPC call that unwraps the result envelope: resolves with the data or
 * throws an `IpcError`. Use this instead of `window.api` directly.
 */
export async function invoke<C extends IpcChannel>(
  channel: C,
  ...args: IpcInvokeArgs<C>
): Promise<IpcResponse<C>> {
  const result = await window.api.invoke(channel, ...args);
  if (!result.ok) throw new IpcError(result.error);
  return result.data;
}
