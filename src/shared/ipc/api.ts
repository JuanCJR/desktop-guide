/**
 * Forma de `window.api`, el único "puente" que la interfaz puede usar para
 * pedirle cosas al proceso principal.
 *
 * El puente lo crea `src/preload/index.ts` y la interfaz lo usa a través de
 * `src/renderer/src/lib/ipc.ts`. Como está en `shared/`, el mismo tipo lo
 * comparten todas las partes de la app.
 */
import type { IpcChannel } from './channels';
import type { IpcRequest, IpcResponse } from './contract';
import type { IpcResult } from './result';

/** Los canales cuya petición es `undefined` se llaman sin enviar datos. */
export type IpcInvokeArgs<C extends IpcChannel> = [IpcRequest<C>] extends [undefined]
  ? []
  : [payload: IpcRequest<C>];

/** La API que se expone a la interfaz como `window.api` mediante `contextBridge`. */
export interface DesktopApi {
  invoke: <C extends IpcChannel>(
    channel: C,
    ...args: IpcInvokeArgs<C>
  ) => Promise<IpcResult<IpcResponse<C>>>;
}
