import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { IpcChannel } from '@shared/ipc/channels';

import { isTrustedUrl } from '../security';
import { createIpcHandler, type IpcHandler } from './create-handler';
import { getAppInfo, ping } from './handlers/app';

/** Every channel in the contract must have exactly one handler here. */
const handlers: { [C in IpcChannel]: IpcHandler<C> } = {
  'app:get-info': getAppInfo,
  'app:ping': ping,
};

export function registerIpcHandlers(): void {
  const options = {
    isTrustedSender: (event: IpcMainInvokeEvent) =>
      event.senderFrame !== null && isTrustedUrl(event.senderFrame.url),
  };

  for (const channel of Object.keys(handlers) as IpcChannel[]) {
    // `channel` is a union here; the mapped type above guarantees the pairing.
    ipcMain.handle(channel, createIpcHandler(channel, handlers[channel] as never, options));
  }
}
