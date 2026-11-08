import { app, BrowserWindow } from 'electron';

import { registerIpcHandlers } from './ipc/register';
import { hardenWebContents } from './security';
import { createMainWindow } from './window';

const APP_USER_MODEL_ID = 'com.desktopguide.app';

// Only one instance of the app may run at a time.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [window] = BrowserWindow.getAllWindows();
    if (window) {
      if (window.isMinimized()) window.restore();
      window.focus();
    }
  });

  app.on('web-contents-created', (_event, contents) => {
    hardenWebContents(contents);
  });

  void app.whenReady().then(() => {
    // Required on Windows for notifications and taskbar grouping.
    app.setAppUserModelId(APP_USER_MODEL_ID);

    registerIpcHandlers();
    createMainWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
