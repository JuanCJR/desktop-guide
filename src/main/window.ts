/**
 * Creación de la ventana principal de la aplicación.
 *
 * Define el tamaño, el título y, sobre todo, las opciones de seguridad de la
 * ventana donde se muestra la interfaz (el "renderer", en `src/renderer/`).
 * Lo llama `./index.ts` al arrancar la app.
 */
import { join } from 'node:path';

import { app, BrowserWindow } from 'electron';

export function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    title: 'Manual de Inducción · IUPSM',
    // Opciones de seguridad (no se deben relajar): la interfaz no tiene acceso
    // directo al sistema; solo puede usar lo que expone `src/preload/index.ts`.
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      devTools: !app.isPackaged,
    },
  });

  // La ventana se muestra cuando ya está lista, para evitar un parpadeo en blanco.
  window.once('ready-to-show', () => {
    window.show();
  });

  // En desarrollo se carga la interfaz desde el servidor local (con recarga
  // automática); en la app instalada, desde los archivos empaquetados.
  const devServerUrl = process.env['ELECTRON_RENDERER_URL'];
  if (!app.isPackaged && devServerUrl) {
    void window.loadURL(devServerUrl);
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return window;
}
