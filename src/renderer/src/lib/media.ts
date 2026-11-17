/**
 * Resuelve una imagen o un video de una sección (de los que trae la app o de
 * los subidos desde el editor) en lo que necesita la interfaz para mostrarlo:
 * su dirección, su nombre y, en los videos, sus subtítulos y proporción.
 *
 * Los de la app vienen de `./images.ts` y `./videos.ts`; los subidos se piden
 * al proceso principal con el protocolo local `psm-media:`
 * (`src/main/media-protocol.ts`).
 */
import { mediaUrl, type UploadedVideo } from '@shared/content/media';
import type { SectionImage } from '@shared/content/schema';
import type { VideoId } from '@shared/content/videos';

import { IMAGES } from './images';
import { VIDEOS } from './videos';

/** Un video de una sección: uno de la app (su id) o uno subido. */
export type VideoRef = VideoId | UploadedVideo;

export interface ResolvedImage {
  src: string;
  /** Nombre de la imagen (para el editor y como descripción si no tiene pie de foto). */
  title: string;
}

export interface ResolvedVideo {
  src: string;
  title: string;
  duration: string;
  /** Subtítulos en español; los videos subidos no tienen. */
  subtitles: string | null;
  /** Clase de proporción de Tailwind; vacía en los subidos (se usa la del video). */
  aspect: string;
}

export function resolveImage(image: SectionImage): ResolvedImage {
  if ('id' in image) return IMAGES[image.id];
  return { src: mediaUrl(image.file), title: image.file.name };
}

export function resolveVideo(video: VideoRef): ResolvedVideo {
  if (typeof video === 'string') return VIDEOS[video];
  return { src: mediaUrl(video), title: video.name, duration: '', subtitles: null, aspect: '' };
}
