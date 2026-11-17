/**
 * Imágenes y videos que la escuela sube desde el editor (además de los que
 * trae la app).
 *
 * Cada archivo subido se identifica por su "huella digital" (SHA-256 de su
 * contenido). El contenido del manual guarda esa huella y, como el contenido
 * va firmado, nadie puede cambiar un archivo sin que la app lo note. Los
 * archivos viven en la carpeta de datos de cada computadora
 * (`src/main/content/media-store.ts`) y viajan dentro del archivo `.psm` al
 * exportar (`src/main/content/package-file.ts`). La interfaz los muestra con
 * el protocolo local `psm-media:` (ver `mediaUrl`).
 *
 * Aquí están los límites y la forma de los datos, para que el proceso
 * principal y la interfaz coincidan.
 */
import { z } from 'zod';

const MB = 1024 * 1024;

/** Límites de los archivos subidos (se revisan al subir y al publicar). */
export const MEDIA_LIMITS = {
  /** Tamaño máximo de la imagen original que se elige (JPG o PNG). */
  imageInputBytes: 15 * MB,
  /** La imagen se reduce para que su lado más largo mida como máximo esto. */
  imageMaxSide: 1600,
  /** Tamaño máximo de cada video (MP4). */
  videoBytes: 150 * MB,
  /** Suma máxima de todos los archivos subidos del manual. */
  totalBytes: 500 * MB,
  /** Cantidad máxima de archivos subidos en todo el manual. */
  maxFiles: 40,
} as const;

/** Protocolo local con el que la interfaz pide los archivos subidos. */
export const MEDIA_PROTOCOL = 'psm-media';

const hashSchema = z.string().regex(/^[0-9a-f]{64}$/, 'Archivo inválido.');
const nameSchema = z.string().trim().min(1).max(120);

/** Imagen subida: siempre se guarda como JPG. */
export const uploadedImageSchema = z.object({
  hash: hashSchema,
  ext: z.literal('jpg'),
  name: nameSchema,
  size: z.number().int().positive().max(MEDIA_LIMITS.imageInputBytes),
});
export type UploadedImage = z.infer<typeof uploadedImageSchema>;

/** Video subido (MP4). */
export const uploadedVideoSchema = z.object({
  hash: hashSchema,
  ext: z.literal('mp4'),
  name: nameSchema,
  size: z.number().int().positive().max(MEDIA_LIMITS.videoBytes),
});
export type UploadedVideo = z.infer<typeof uploadedVideoSchema>;

export type UploadedFile = UploadedImage | UploadedVideo;

/** Nombre del archivo en el disco y en el protocolo: `<huella>.<extensión>`. */
export function mediaFileName(file: Pick<UploadedFile, 'hash' | 'ext'>): string {
  return `${file.hash}.${file.ext}`;
}

/** Dirección con la que la interfaz muestra un archivo subido. */
export function mediaUrl(file: Pick<UploadedFile, 'hash' | 'ext'>): string {
  return `${MEDIA_PROTOCOL}://file/${mediaFileName(file)}`;
}

/** Valida un nombre de archivo del almacén (evita rutas raras como `../`). */
export const MEDIA_FILE_NAME = /^[0-9a-f]{64}\.(jpg|mp4)$/;

/** Tamaño legible en MB, para los mensajes ("12,5 MB"). */
export function formatMegabytes(bytes: number): string {
  return `${(bytes / MB).toLocaleString('es-VE', { maximumFractionDigits: 1 })} MB`;
}
