import { app } from 'electron';

import type { IpcHandler } from '../create-handler';

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

export const ping: IpcHandler<'app:ping'> = ({ message }) => ({
  reply: `pong: ${message}`,
  receivedAt: new Date().toISOString(),
});
