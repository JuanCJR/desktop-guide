/**
 * Handlers (funciones que responden a la interfaz) del contenido del manual y
 * de las llaves de edición.
 *
 * Aquí se atienden las acciones de la pantalla "Contenido del manual" y del
 * modo edición: leer el contenido, publicar cambios, importar o exportar el
 * archivo de contenido (`.psm`), volver al contenido original, desbloquear o
 * bloquear la edición con una llave, y crear una llave de edición nueva.
 *
 * Este archivo se encarga de la parte "de escritorio" (abrir los diálogos de
 * Windows para elegir o guardar archivos). Las reglas de negocio y las firmas
 * viven en `src/main/content/content-service.ts`. Se registra en
 * `../register.ts`.
 */
import { readFile, stat, writeFile } from 'node:fs/promises';

import { BrowserWindow, dialog, type IpcMainInvokeEvent } from 'electron';

import {
  CONTENT_PACKAGE_EXTENSION,
  EDITOR_KEY_EXTENSION,
  MAX_KEY_FILE_BYTES,
  MAX_PACKAGE_BYTES,
} from '@shared/content/package';

import type { ContentService, OlderPackageInfo } from '../../content/content-service';
import type { IpcHandler } from '../create-handler';

// Filtros de los diálogos de archivos: solo muestran el tipo de archivo esperado.
const PACKAGE_FILTERS = [{ name: 'Contenido del manual', extensions: [CONTENT_PACKAGE_EXTENSION] }];
const EDITOR_KEY_FILTERS = [{ name: 'Llave de edición', extensions: [EDITOR_KEY_EXTENSION] }];
const MASTER_KEY_FILTERS = [{ name: 'Llave maestra', extensions: ['pem'] }];

interface ContentHandlers {
  'content:get': IpcHandler<'content:get'>;
  'content:publish': IpcHandler<'content:publish'>;
  'content:import': IpcHandler<'content:import'>;
  'content:export': IpcHandler<'content:export'>;
  'content:reset': IpcHandler<'content:reset'>;
  'editor:unlock': IpcHandler<'editor:unlock'>;
  'editor:lock': IpcHandler<'editor:lock'>;
  'editor:create-key': IpcHandler<'editor:create-key'>;
}

// Ventana sobre la que se abren los diálogos (para que queden "encima" de la app).
function ownerWindow(event: IpcMainInvokeEvent): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender);
}

// Abre el diálogo "Abrir archivo" de Windows; devuelve `null` si se cancela.
async function pickFile(
  event: IpcMainInvokeEvent,
  title: string,
  filters: Electron.FileFilter[],
): Promise<string | null> {
  const window = ownerWindow(event);
  const options: Electron.OpenDialogOptions = { title, filters, properties: ['openFile'] };
  const result = window
    ? await dialog.showOpenDialog(window, options)
    : await dialog.showOpenDialog(options);
  return result.canceled ? null : (result.filePaths[0] ?? null);
}

// Abre el diálogo "Guardar como" de Windows; devuelve `null` si se cancela.
async function pickSavePath(
  event: IpcMainInvokeEvent,
  options: Electron.SaveDialogOptions,
): Promise<string | null> {
  const window = ownerWindow(event);
  const result = window
    ? await dialog.showSaveDialog(window, options)
    : await dialog.showSaveDialog(options);
  return result.canceled || !result.filePath ? null : result.filePath;
}

// Formato de fecha legible para los avisos, con segundos para distinguir
// publicaciones del mismo minuto (por ejemplo, "9 de noviembre de 2026, 4:36:12 p. m.").
const dateFormatter = new Intl.DateTimeFormat('es-VE', { dateStyle: 'long', timeStyle: 'medium' });

// Pregunta con un aviso de Windows si se quiere reemplazar el contenido actual
// por uno más antiguo. "Cancelar" es la opción por defecto.
async function confirmOlderPackage(
  event: IpcMainInvokeEvent,
  info: OlderPackageInfo,
): Promise<boolean> {
  const window = ownerWindow(event);
  const options: Electron.MessageBoxOptions = {
    type: 'warning',
    title: 'Contenido más antiguo',
    message: 'Este archivo es más antiguo que el contenido que ya tienes.',
    detail:
      `Archivo que quieres importar: ${dateFormatter.format(new Date(info.incoming))}\n` +
      `Contenido actual: ${dateFormatter.format(new Date(info.current))}\n\n` +
      'Si continúas, esta computadora volverá a la versión anterior del manual.',
    buttons: ['Cancelar', 'Reemplazar de todas formas'],
    defaultId: 0,
    cancelId: 0,
    noLink: true,
  };
  const { response } = window
    ? await dialog.showMessageBox(window, options)
    : await dialog.showMessageBox(options);
  return response === 1;
}

// Lee un archivo solo si no supera un tamaño máximo, para no cargar archivos
// enormes por error (o a propósito).
async function readSmallFile(path: string, maxBytes: number): Promise<string | null> {
  const info = await stat(path);
  if (info.size > maxBytes) return null;
  return readFile(path, 'utf8');
}

export function createContentHandlers(service: ContentService): ContentHandlers {
  return {
    // Devuelve el contenido que se muestra ahora y el estado del modo edición.
    'content:get': () => service.getState(),

    // Guarda y firma los cambios hechos en el modo edición.
    'content:publish': async (content) => {
      const result = await service.publish(content);
      if (result.status === 'locked') return result;
      return { status: 'published', state: await service.getState() };
    },

    // Carga un archivo de contenido recibido de otro computador (se verifica su firma).
    'content:import': async (_request, event) => {
      const path = await pickFile(event, 'Importar contenido del manual', PACKAGE_FILTERS);
      if (!path) return { status: 'cancelled' };
      const raw = await readSmallFile(path, MAX_PACKAGE_BYTES);
      if (raw === null) return { status: 'invalid', message: 'El archivo es demasiado grande.' };
      const result = await service.importPackage(raw, (info) => confirmOlderPackage(event, info));
      if (result.status !== 'imported') return result;
      return { status: 'imported', state: await service.getState() };
    },

    // Guarda una copia del contenido publicado para llevarla a otros computadores.
    'content:export': async (_request, event) => {
      const raw = await service.exportPackage();
      if (raw === null) return { status: 'nothing-to-export' };
      const path = await pickSavePath(event, {
        title: 'Exportar contenido del manual',
        defaultPath: `manual-escuela-47.${CONTENT_PACKAGE_EXTENSION}`,
        filters: PACKAGE_FILTERS,
      });
      if (!path) return { status: 'cancelled' };
      await writeFile(path, raw, 'utf8');
      return { status: 'saved' };
    },

    // Vuelve al contenido original que viene con la app.
    'content:reset': async () => {
      await service.reset();
      return service.getState();
    },

    // Activa el modo edición: pide el archivo de la llave y lo abre con la contraseña.
    'editor:unlock': async ({ passphrase }, event) => {
      const path = await pickFile(event, 'Selecciona tu llave de edición', EDITOR_KEY_FILTERS);
      if (!path) return { status: 'cancelled' };
      const keyFile = await readSmallFile(path, MAX_KEY_FILE_BYTES);
      if (keyFile === null) {
        return { status: 'invalid', message: 'El archivo no es una llave de edición válida.' };
      }
      const result = await service.unlock(keyFile, passphrase);
      if (result.status === 'invalid') return result;
      return { status: 'unlocked', state: await service.getState() };
    },

    // Sale del modo edición.
    'editor:lock': () => {
      service.lock();
      return service.getState();
    },

    // Crea una llave de edición nueva usando la llave maestra. La nueva llave
    // reemplaza a las anteriores (útil si una se perdió o la robaron).
    'editor:create-key': async ({ masterPassphrase, newPassphrase }, event) => {
      const masterPath = await pickFile(event, 'Selecciona la llave maestra', MASTER_KEY_FILTERS);
      if (!masterPath) return { status: 'cancelled' };
      const masterPem = await readSmallFile(masterPath, MAX_KEY_FILE_BYTES);
      if (masterPem === null) {
        return { status: 'invalid', message: 'El archivo no es una llave maestra válida.' };
      }
      const result = await service.createEditorKey(
        masterPem,
        masterPassphrase,
        newPassphrase,
        async (fileText) => {
          const path = await pickSavePath(event, {
            title: 'Guardar la nueva llave de edición',
            defaultPath: `llave-edicion-escuela-47.${EDITOR_KEY_EXTENSION}`,
            filters: EDITOR_KEY_FILTERS,
          });
          if (!path) return false;
          await writeFile(path, fileText, { encoding: 'utf8', mode: 0o600 });
          return true;
        },
      );
      if (result.status !== 'created') return result;
      return { status: 'created', state: await service.getState() };
    },
  };
}
