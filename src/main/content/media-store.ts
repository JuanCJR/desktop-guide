/**
 * Almacén de las imágenes y videos subidos desde el editor.
 *
 * Los archivos se guardan en una carpeta de la computadora (dentro de la
 * carpeta de datos de la app) con el nombre `<huella>.<extensión>`, donde la
 * huella es el SHA-256 de su contenido. Así un mismo archivo nunca se guarda
 * dos veces, y al importar un `.psm` se puede comprobar que cada archivo es
 * exactamente el que se publicó (el contenido firmado guarda la huella).
 *
 * No depende de Electron: la reducción de imágenes se recibe como una función
 * (`encodeImage`), que en la app usa `nativeImage` (ver
 * `../ipc/handlers/media.ts`). Lo usan `./content-service.ts` (para borrar lo
 * que ya no se usa) y `./package-file.ts` (para exportar e importar).
 */
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, open, readdir, rename, rm, stat } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import {
  formatMegabytes,
  MEDIA_FILE_NAME,
  MEDIA_LIMITS,
  mediaFileName,
  type UploadedFile,
  type UploadedImage,
  type UploadedVideo,
} from '@shared/content/media';

export type AddResult<T> = { ok: true; file: T } | { ok: false; message: string };

/** Reduce y comprime una imagen; devuelve el JPG o `null` si no es una imagen válida. */
export type ImageEncoder = (sourcePath: string, maxSide: number) => Promise<Buffer | null>;

// Nombre que se muestra del archivo: el original sin la ruta (máx. 120 caracteres).
function displayName(sourcePath: string, ext: string): string {
  const base = basename(sourcePath, extname(sourcePath)).trim() || 'archivo';
  return `${base.slice(0, 110)}.${ext}`;
}

export class MediaStore {
  constructor(private readonly dir: string) {}

  /** Ruta en el disco de un archivo del almacén. */
  pathFor(file: Pick<UploadedFile, 'hash' | 'ext'>): string {
    return join(this.dir, mediaFileName(file));
  }

  /** Ruta de un nombre pedido por la interfaz, o `null` si el nombre no es válido. */
  pathForName(name: string): string | null {
    return MEDIA_FILE_NAME.test(name) ? join(this.dir, name) : null;
  }

  /** Indica si el archivo ya está en el almacén. */
  async has(file: Pick<UploadedFile, 'hash' | 'ext'>): Promise<boolean> {
    try {
      return (await stat(this.pathFor(file))).isFile();
    } catch {
      return false;
    }
  }

  /**
   * Guarda lo que llega por `source` calculando su huella mientras se copia, y
   * lo deja con su nombre definitivo. Si se indica `expectedHash` y no
   * coincide, lo descarta y lanza un error (archivo alterado).
   */
  async write(source: Readable, ext: UploadedFile['ext'], expectedHash?: string) {
    await mkdir(this.dir, { recursive: true });
    const temporary = join(this.dir, `.${randomUUID()}.tmp`);
    const hash = createHash('sha256');
    let size = 0;
    source.on('data', (chunk: Buffer) => {
      hash.update(chunk);
      size += chunk.length;
    });
    try {
      await pipeline(source, createWriteStream(temporary));
      const digest = hash.digest('hex');
      if (expectedHash !== undefined && digest !== expectedHash) {
        throw new Error('Un archivo del paquete no coincide con el que se publicó.');
      }
      await rename(temporary, this.pathFor({ hash: digest, ext }));
      return { hash: digest, size };
    } finally {
      await rm(temporary, { force: true });
    }
  }

  /** Agrega una imagen elegida por el usuario: la reduce, la comprime a JPG y la guarda. */
  async addImage(sourcePath: string, encode: ImageEncoder): Promise<AddResult<UploadedImage>> {
    const info = await stat(sourcePath);
    if (info.size > MEDIA_LIMITS.imageInputBytes) {
      return {
        ok: false,
        message: `La imagen pesa ${formatMegabytes(info.size)}; el máximo es ${formatMegabytes(MEDIA_LIMITS.imageInputBytes)}.`,
      };
    }
    const jpg = await encode(sourcePath, MEDIA_LIMITS.imageMaxSide);
    if (!jpg) return { ok: false, message: 'El archivo no es una imagen JPG o PNG válida.' };
    const { hash, size } = await this.write(Readable.from([jpg]), 'jpg');
    return { ok: true, file: { hash, ext: 'jpg', name: displayName(sourcePath, 'jpg'), size } };
  }

  /** Agrega un video MP4 elegido por el usuario (sin modificarlo). */
  async addVideo(sourcePath: string): Promise<AddResult<UploadedVideo>> {
    const info = await stat(sourcePath);
    if (info.size > MEDIA_LIMITS.videoBytes) {
      return {
        ok: false,
        message: `El video pesa ${formatMegabytes(info.size)}; el máximo es ${formatMegabytes(MEDIA_LIMITS.videoBytes)}. Comprímelo antes de subirlo.`,
      };
    }
    if (!(await looksLikeMp4(sourcePath))) {
      return { ok: false, message: 'El archivo no es un video MP4 válido.' };
    }
    const { hash, size } = await this.write(createReadStream(sourcePath), 'mp4');
    return { ok: true, file: { hash, ext: 'mp4', name: displayName(sourcePath, 'mp4'), size } };
  }

  /** Borra los archivos que ya no usa ningún contenido (`keep` = nombres a conservar). */
  async prune(keep: ReadonlySet<string>): Promise<void> {
    let names: string[];
    try {
      names = await readdir(this.dir);
    } catch {
      return;
    }
    await Promise.all(
      names
        .filter((name) => !keep.has(name) && (MEDIA_FILE_NAME.test(name) || name.endsWith('.tmp')))
        .map((name) => rm(join(this.dir, name), { force: true })),
    );
  }
}

// Un MP4 tiene la marca "ftyp" en los bytes 4 a 7.
async function looksLikeMp4(path: string): Promise<boolean> {
  const handle = await open(path, 'r');
  try {
    const header = Buffer.alloc(12);
    const { bytesRead } = await handle.read(header, 0, 12, 0);
    return bytesRead === 12 && header.toString('latin1', 4, 8) === 'ftyp';
  } finally {
    await handle.close();
  }
}
