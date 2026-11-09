/**
 * Aquí arranca la aplicación.
 *
 * Este es el punto de entrada del "proceso principal" de Electron: la parte de
 * la app que corre con acceso al sistema operativo (archivos, ventanas,
 * diálogos). La interfaz visual vive aparte, en `src/renderer/`, y se comunica
 * con esta parte mediante IPC (mensajes entre procesos).
 *
 * Al iniciar:
 * 1. Se asegura de que solo haya una copia de la app abierta.
 * 2. Aplica las reglas de seguridad a cada ventana (`./security.ts`).
 * 3. Registra los canales de comunicación con la interfaz (`./ipc/register.ts`).
 * 4. Abre la ventana principal (`./window.ts`).
 */
import { join } from 'node:path';

import { app, BrowserWindow } from 'electron';

import { registerIpcHandlers } from './ipc/register';
import { hardenWebContents } from './security';
import { createMainWindow } from './window';

// Identificador de la app en Windows (agrupa las ventanas en la barra de tareas).
const APP_USER_MODEL_ID = 'com.desktopguide.app';

// Carpeta donde la app guarda el contenido publicado y el registro de llaves.
// La app se llamaba "Desktop Guide" y Electron nombra esta carpeta según el
// nombre de la app; se fija el nombre original para que, al cambiar el nombre
// visible, las computadoras que ya la tienen instalada no pierdan sus datos.
// Debe definirse antes de cualquier otra cosa (incluido el bloqueo de abajo).
app.setPath('userData', join(app.getPath('appData'), 'Desktop Guide'));

// Solo puede haber una copia de la app abierta a la vez. Si ya hay una, esta
// segunda copia se cierra.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  // Si alguien intenta abrir la app otra vez, se trae al frente la ventana que
  // ya estaba abierta en lugar de abrir otra.
  app.on('second-instance', () => {
    const [window] = BrowserWindow.getAllWindows();
    if (window) {
      if (window.isMinimized()) window.restore();
      window.focus();
    }
  });

  // Cada ventana o contenido web que se crea recibe las reglas de seguridad.
  app.on('web-contents-created', (_event, contents) => {
    hardenWebContents(contents);
  });

  // Cuando Electron está listo: se registran los canales IPC y se abre la ventana.
  void app.whenReady().then(() => {
    // Necesario en Windows para las notificaciones y el agrupado en la barra de tareas.
    app.setAppUserModelId(APP_USER_MODEL_ID);

    registerIpcHandlers();
    createMainWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
  });

  // Al cerrar todas las ventanas, la app termina (salvo en macOS, por convención).
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
