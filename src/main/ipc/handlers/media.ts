/**
 * Handler para subir imágenes y videos desde el editor.
 *
 * Abre el diálogo de Windows para elegir el archivo, revisa los límites y lo
 * guarda en el almacén (`src/main/content/media-store.ts`). Las imágenes se
 * reducen y se comprimen a JPG con `nativeImage` de Electron; los videos MP4
 * se guardan tal cual. Solo funciona con la edición desbloqueada, para que
 * nadie sin la llave pueda llenar el disco. Se registra en `../register.ts`.
 */
import { BrowserWindow, dialog, type IpcMainInvokeEvent, nativeImage } from 'electron';

import { formatMegabytes, MEDIA_LIMITS } from '@shared/content/media';

import type { ContentService } from '../../content/content-service';
import type { ImageEncoder, MediaStore } from '../../content/media-store';
import type { IpcHandler } from '../create-handler';

const FILTERS = {
  image: [{ name: 'Imagen (JPG o PNG)', extensions: ['jpg', 'jpeg', 'png'] }],
  video: [{ name: 'Video MP4', extensions: ['mp4'] }],
};

/** Reduce la imagen (si hace falta) y la convierte a JPG con buena calidad. */
export const encodeImage: ImageEncoder = (sourcePath, maxSide) => {
  const image = nativeImage.createFromPath(sourcePath);
  if (image.isEmpty()) return Promise.resolve(null);
  const { width, height } = image.getSize();
  const scale = Math.min(1, maxSide / Math.max(width, height));
  const resized =
    scale < 1
      ? image.resize({
          width: Math.round(width * scale),
          height: Math.round(height * scale),
          quality: 'best',
        })
      : image;
  return Promise.resolve(resized.toJPEG(85));
};

export function createMediaHandlers(
  service: ContentService,
  store: MediaStore,
): { 'media:upload': IpcHandler<'media:upload'> } {
  return {
    'media:upload': async ({ kind }, event: IpcMainInvokeEvent) => {
      if (!service.isUnlocked()) {
        return { status: 'invalid', message: 'Desbloquea la edición para subir archivos.' };
      }
      const window = BrowserWindow.fromWebContents(event.sender);
      const limit =
        kind === 'image'
          ? `JPG o PNG de hasta ${formatMegabytes(MEDIA_LIMITS.imageInputBytes)}`
          : `MP4 de hasta ${formatMegabytes(MEDIA_LIMITS.videoBytes)}`;
      const options: Electron.OpenDialogOptions = {
        title: kind === 'image' ? `Subir imagen (${limit})` : `Subir video (${limit})`,
        filters: FILTERS[kind],
        properties: ['openFile'],
      };
      const picked = window
        ? await dialog.showOpenDialog(window, options)
        : await dialog.showOpenDialog(options);
      const path = picked.canceled ? undefined : picked.filePaths[0];
      if (!path) return { status: 'cancelled' };

      const result =
        kind === 'image' ? await store.addImage(path, encodeImage) : await store.addVideo(path);
      return result.ok
        ? { status: 'uploaded', file: result.file }
        : { status: 'invalid', message: result.message };
    },
  };
}
