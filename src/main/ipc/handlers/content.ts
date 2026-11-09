import { readFile, stat, writeFile } from 'node:fs/promises';

import { BrowserWindow, dialog, type IpcMainInvokeEvent } from 'electron';

import { CONTENT_PACKAGE_EXTENSION, MAX_PACKAGE_BYTES } from '@shared/content/package';

import type { ContentService } from '../../content/content-service';
import type { IpcHandler } from '../create-handler';

const PACKAGE_FILTERS = [{ name: 'Contenido del manual', extensions: [CONTENT_PACKAGE_EXTENSION] }];
const KEY_FILTERS = [{ name: 'Llave de la escuela', extensions: ['pem'] }];
const MAX_KEY_BYTES = 10_000;

interface ContentHandlers {
  'content:get': IpcHandler<'content:get'>;
  'content:publish': IpcHandler<'content:publish'>;
  'content:import': IpcHandler<'content:import'>;
  'content:export': IpcHandler<'content:export'>;
  'content:reset': IpcHandler<'content:reset'>;
  'editor:unlock': IpcHandler<'editor:unlock'>;
  'editor:lock': IpcHandler<'editor:lock'>;
}

function ownerWindow(event: IpcMainInvokeEvent): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender);
}

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

async function readSmallFile(path: string, maxBytes: number): Promise<string | null> {
  const info = await stat(path);
  if (info.size > maxBytes) return null;
  return readFile(path, 'utf8');
}

export function createContentHandlers(service: ContentService): ContentHandlers {
  return {
    'content:get': () => service.getState(),

    'content:publish': async (content) => {
      const result = await service.publish(content);
      if (result.status === 'locked') return result;
      return { status: 'published', state: await service.getState() };
    },

    'content:import': async (_request, event) => {
      const path = await pickFile(event, 'Importar contenido del manual', PACKAGE_FILTERS);
      if (!path) return { status: 'cancelled' };
      const raw = await readSmallFile(path, MAX_PACKAGE_BYTES);
      if (raw === null) return { status: 'invalid', message: 'El archivo es demasiado grande.' };
      const result = await service.importPackage(raw);
      if (result.status === 'invalid') return result;
      return { status: 'imported', state: await service.getState() };
    },

    'content:export': async (_request, event) => {
      const raw = await service.exportPackage();
      if (raw === null) return { status: 'nothing-to-export' };
      const window = ownerWindow(event);
      const options: Electron.SaveDialogOptions = {
        title: 'Exportar contenido del manual',
        defaultPath: `manual-escuela-47.${CONTENT_PACKAGE_EXTENSION}`,
        filters: PACKAGE_FILTERS,
      };
      const result = window
        ? await dialog.showSaveDialog(window, options)
        : await dialog.showSaveDialog(options);
      if (result.canceled || !result.filePath) return { status: 'cancelled' };
      await writeFile(result.filePath, raw, 'utf8');
      return { status: 'saved' };
    },

    'content:reset': async () => {
      await service.reset();
      return service.getState();
    },

    'editor:unlock': async ({ passphrase }, event) => {
      const path = await pickFile(event, 'Selecciona la llave de la escuela', KEY_FILTERS);
      if (!path) return { status: 'cancelled' };
      const pem = await readSmallFile(path, MAX_KEY_BYTES);
      if (pem === null) {
        return { status: 'invalid', message: 'El archivo no es una llave de la escuela válida.' };
      }
      const result = service.unlock(pem, passphrase);
      if (result.status === 'invalid') return result;
      return { status: 'unlocked', state: await service.getState() };
    },

    'editor:lock': () => {
      service.lock();
      return service.getState();
    },
  };
}
