/**
 * Forma recomendada de que la interfaz le pida algo al proceso principal.
 *
 * Usa el puente `window.api` (creado en `src/preload/index.ts`) y "abre" el
 * sobre de respuesta (`src/shared/ipc/result.ts`): si todo salió bien,
 * devuelve los datos; si no, lanza un error `IpcError` con su código.
 */
import type { IpcInvokeArgs } from '@shared/ipc/api';
import type { IpcChannel } from '@shared/ipc/channels';
import type { IpcResponse } from '@shared/ipc/contract';
import type { IpcError as IpcErrorShape, IpcErrorCode } from '@shared/ipc/result';

// Error que llega del proceso principal (con un código como `INVALID_REQUEST`).
export class IpcError extends Error {
  readonly code: IpcErrorCode;

  constructor({ code, message }: IpcErrorShape) {
    super(message);
    this.name = 'IpcError';
    this.code = code;
  }
}

/**
 * Llamada IPC con tipos que abre el sobre de respuesta: devuelve los datos o
 * lanza un `IpcError`. Usar esta función en lugar de `window.api` directamente.
 */
export async function invoke<C extends IpcChannel>(
  channel: C,
  ...args: IpcInvokeArgs<C>
): Promise<IpcResponse<C>> {
  const result = await window.api.invoke(channel, ...args);
  if (!result.ok) throw new IpcError(result.error);
  return result.data;
}
