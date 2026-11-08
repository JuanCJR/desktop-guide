import { contextBridge, ipcRenderer } from 'electron';

import type { DesktopApi, IpcInvokeArgs } from '@shared/ipc/api';
import { type IpcChannel, isIpcChannel } from '@shared/ipc/channels';
import type { IpcResponse } from '@shared/ipc/contract';
import type { IpcResult } from '@shared/ipc/result';

/**
 * Minimal, allow-listed bridge. Never expose `ipcRenderer` itself or any
 * Node API to the renderer.
 */
const api: DesktopApi = {
  invoke: <C extends IpcChannel>(
    channel: C,
    ...args: IpcInvokeArgs<C>
  ): Promise<IpcResult<IpcResponse<C>>> => {
    if (!isIpcChannel(channel)) {
      return Promise.reject(new Error(`Unknown IPC channel: ${String(channel)}`));
    }
    return ipcRenderer.invoke(channel, args[0]) as Promise<IpcResult<IpcResponse<C>>>;
  },
};

contextBridge.exposeInMainWorld('api', api);
