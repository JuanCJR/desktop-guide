/**
 * Registro de todos los canales de comunicación (IPC) de la app.
 *
 * Aquí se conecta cada canal declarado en `src/shared/ipc/channels.ts` con la
 * función que lo atiende (en `./handlers/`). También se crea el servicio de
 * contenido (`../content/content-service.ts`), que decide qué contenido del
 * manual se muestra y protege los cambios con firmas digitales.
 *
 * Lo llama `../index.ts` al arrancar la app.
 */
import { join } from 'node:path';

import { app, ipcMain, type IpcMainInvokeEvent } from 'electron';

import { DEFAULT_CONTENT } from '@shared/content/default-content';

import type { IpcChannel } from '@shared/ipc/channels';

import { ContentService } from '../content/content-service';
import { createFileStorage } from '../content/file-storage';
import { MASTER_PUBLIC_KEY_PEM } from '../content/public-key';
import { parsePublicKey } from '../content/signing';
import { isTrustedUrl } from '../security';
import { createIpcHandler, type IpcHandler } from './create-handler';
import { getAppInfo, ping } from './handlers/app';
import { createContentHandlers } from './handlers/content';

/** Cada canal del contrato debe tener exactamente un handler aquí. */
function createHandlers(): { [C in IpcChannel]: IpcHandler<C> } {
  // El contenido publicado y el registro de llaves se guardan en la carpeta de
  // datos del usuario en Windows (userData), no dentro de la instalación.
  const contentService = new ContentService({
    packageStorage: createFileStorage(join(app.getPath('userData'), 'manual-content.psm')),
    trustStorage: createFileStorage(join(app.getPath('userData'), 'editor-key-trust.json')),
    bundled: DEFAULT_CONTENT,
    masterPublicKey: parsePublicKey(MASTER_PUBLIC_KEY_PEM),
  });
  return {
    'app:get-info': getAppInfo,
    'app:ping': ping,
    ...createContentHandlers(contentService),
  };
}

/** Debe llamarse después de `app.whenReady()` (necesita la ruta de userData). */
export function registerIpcHandlers(): void {
  const handlers = createHandlers();
  // Solo se aceptan mensajes enviados desde páginas de la propia app.
  const options = {
    isTrustedSender: (event: IpcMainInvokeEvent) =>
      event.senderFrame !== null && isTrustedUrl(event.senderFrame.url),
  };

  for (const channel of Object.keys(handlers) as IpcChannel[]) {
    // Aquí `channel` es una unión de tipos; el tipo de `createHandlers`
    // garantiza que cada canal va con su handler correcto.
    ipcMain.handle(channel, createIpcHandler(channel, handlers[channel] as never, options));
  }
}
