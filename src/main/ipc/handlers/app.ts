/**
 * Handlers (funciones que responden a la interfaz) de información general de
 * la app: nombre, versión y versiones de Electron, Chrome y Node.
 *
 * Se registran en `../register.ts`; sus datos de entrada y salida están
 * definidos en `src/shared/ipc/contract.ts`.
 */
import { app } from 'electron';

import type { IpcHandler } from '../create-handler';

// Devuelve el nombre, la versión y la plataforma de la app.
export const getAppInfo: IpcHandler<'app:get-info'> = () => ({
  name: app.getName(),
  version: app.getVersion(),
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
});

// Canal de ejemplo/prueba: responde "pong" al mensaje recibido.
export const ping: IpcHandler<'app:ping'> = ({ message }) => ({
  reply: `pong: ${message}`,
  receivedAt: new Date().toISOString(),
});
