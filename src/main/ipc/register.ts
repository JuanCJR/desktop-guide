import { join } from 'node:path';

import { app, ipcMain, type IpcMainInvokeEvent } from 'electron';

import { DEFAULT_CONTENT } from '@shared/content/default-content';

import type { IpcChannel } from '@shared/ipc/channels';

import { ContentService } from '../content/content-service';
import { createFileStorage } from '../content/file-storage';
import { CONTENT_PUBLIC_KEY_PEM } from '../content/public-key';
import { parsePublicKey } from '../content/signing';
import { isTrustedUrl } from '../security';
import { createIpcHandler, type IpcHandler } from './create-handler';
import { getAppInfo, ping } from './handlers/app';
import { createContentHandlers } from './handlers/content';

/** Every channel in the contract must have exactly one handler here. */
function createHandlers(): { [C in IpcChannel]: IpcHandler<C> } {
  const contentService = new ContentService({
    storage: createFileStorage(join(app.getPath('userData'), 'manual-content.psm')),
    bundled: DEFAULT_CONTENT,
    publicKey: parsePublicKey(CONTENT_PUBLIC_KEY_PEM),
  });
  return {
    'app:get-info': getAppInfo,
    'app:ping': ping,
    ...createContentHandlers(contentService),
  };
}

/** Must be called after `app.whenReady()` (it resolves the userData path). */
export function registerIpcHandlers(): void {
  const handlers = createHandlers();
  const options = {
    isTrustedSender: (event: IpcMainInvokeEvent) =>
      event.senderFrame !== null && isTrustedUrl(event.senderFrame.url),
  };

  for (const channel of Object.keys(handlers) as IpcChannel[]) {
    // `channel` is a union here; the mapped type above guarantees the pairing.
    ipcMain.handle(channel, createIpcHandler(channel, handlers[channel] as never, options));
  }
}
