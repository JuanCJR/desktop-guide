/**
 * "Puente" entre la interfaz y el proceso principal (preload).
 *
 * Este código corre justo antes de cargar la interfaz y decide qué puede usar
 * ella del sistema. Por seguridad, la interfaz (`src/renderer/`) no tiene
 * acceso directo a archivos ni a Electron: solo recibe `window.api.invoke`, que
 * envía un mensaje por un canal IPC permitido al proceso principal
 * (`src/main/ipc/register.ts`) y devuelve su respuesta.
 *
 * Los canales permitidos están en `src/shared/ipc/channels.ts`. La interfaz
 * usa este puente a través de `src/renderer/src/lib/ipc.ts`.
 */
import { contextBridge, ipcRenderer } from 'electron';

import type { DesktopApi, IpcInvokeArgs } from '@shared/ipc/api';
import { type IpcChannel, isIpcChannel } from '@shared/ipc/channels';
import type { IpcResponse } from '@shared/ipc/contract';
import type { IpcResult } from '@shared/ipc/result';

/**
 * Puente mínimo con lista de canales permitidos. Nunca se debe exponer
 * `ipcRenderer` completo ni ninguna API de Node a la interfaz.
 */
const api: DesktopApi = {
  invoke: <C extends IpcChannel>(
    channel: C,
    ...args: IpcInvokeArgs<C>
  ): Promise<IpcResult<IpcResponse<C>>> => {
    // Rechaza cualquier canal que no esté en la lista de permitidos.
    if (!isIpcChannel(channel)) {
      return Promise.reject(new Error(`Unknown IPC channel: ${String(channel)}`));
    }
    return ipcRenderer.invoke(channel, args[0]) as Promise<IpcResult<IpcResponse<C>>>;
  },
};

// Publica el puente en la interfaz como `window.api`.
contextBridge.exposeInMainWorld('api', api);
