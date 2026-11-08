import type { IpcChannel } from './channels';
import type { IpcRequest, IpcResponse } from './contract';
import type { IpcResult } from './result';

/** Channels whose request is `undefined` are invoked without a payload. */
export type IpcInvokeArgs<C extends IpcChannel> = [IpcRequest<C>] extends [undefined]
  ? []
  : [payload: IpcRequest<C>];

/** The API exposed to the renderer as `window.api` via `contextBridge`. */
export interface DesktopApi {
  invoke: <C extends IpcChannel>(
    channel: C,
    ...args: IpcInvokeArgs<C>
  ) => Promise<IpcResult<IpcResponse<C>>>;
}
