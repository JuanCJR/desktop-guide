/**
 * Archivo `.psm` en el disco: el paquete de contenido firmado y, si el manual
 * usa imágenes o videos subidos, esos archivos adentro.
 *
 * Hay dos variantes:
 * - **Solo texto** (la de siempre): el paquete firmado en JSON. Se sigue
 *   usando cuando no hay archivos subidos, así las versiones anteriores de la
 *   app pueden abrirlo.
 * - **Con archivos**: una cabecera `IUPSM-PSM3`, el mismo JSON firmado y luego
 *   cada archivo con su huella (SHA-256), su extensión y su tamaño. Los archivos
 *   no van firmados uno por uno: el contenido firmado guarda sus huellas, y al
 *   importar cada archivo se comprueba contra ellas (`./media-store.ts`).
 *
 * Se lee y escribe por partes (streams), para no cargar videos grandes enteros
 * en memoria. Lo usan los handlers de importar y exportar
 * (`../ipc/handlers/content.ts`).
 */
import { createReadStream, createWriteStream } from 'node:fs';
import { open } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { MEDIA_LIMITS, type UploadedFile } from '@shared/content/media';

import type { MediaStore } from './media-store';

const MAGIC = Buffer.from('IUPSM-PSM3\n', 'latin1');
const ENTRY_HEADER = 64 + 3 + 8; // huella + extensión + tamaño

/** Un archivo guardado dentro del paquete (dónde está y cuánto mide). */
export interface PackageEntry {
  hash: string;
  ext: UploadedFile['ext'];
  offset: number;
  length: number;
}

export type ReadPackageResult =
  { ok: true; json: string; entries: PackageEntry[] } | { ok: false; message: string };

const TOO_BIG = 'El archivo es demasiado grande.';
const DAMAGED = 'El archivo está dañado o no es un paquete de contenido válido.';

/** Escribe el `.psm`: solo el JSON si no hay archivos, o la variante con archivos. */
export async function writePackageFile(
  path: string,
  json: string,
  files: readonly UploadedFile[],
  store: MediaStore,
): Promise<void> {
  if (files.length === 0) {
    await pipeline(Readable.from([json]), createWriteStream(path));
    return;
  }
  const out = createWriteStream(path);
  async function* parts() {
    const body = Buffer.from(json, 'utf8');
    const length = Buffer.alloc(4);
    length.writeUInt32BE(body.length);
    yield Buffer.concat([MAGIC, length, body]);
    for (const file of files) {
      const header = Buffer.alloc(ENTRY_HEADER);
      header.write(file.hash, 0, 'latin1');
      header.write(file.ext, 64, 'latin1');
      header.writeBigUInt64BE(BigInt(file.size), 67);
      yield header;
      for await (const chunk of createReadStream(store.pathFor(file))) yield chunk as Buffer;
    }
  }
  await pipeline(Readable.from(parts()), out);
}

/**
 * Lee el JSON firmado y el índice de archivos del `.psm` (sin copiar todavía
 * los archivos). `maxJsonBytes` limita el tamaño del texto.
 */
export async function readPackageFile(
  path: string,
  maxJsonBytes: number,
): Promise<ReadPackageResult> {
  const handle = await open(path, 'r');
  try {
    const { size } = await handle.stat();
    const head = Buffer.alloc(Math.min(size, MAGIC.length + 4));
    await handle.read(head, 0, head.length, 0);

    // Variante solo texto (la de siempre).
    if (!head.subarray(0, MAGIC.length).equals(MAGIC)) {
      if (size > maxJsonBytes) return { ok: false, message: TOO_BIG };
      const text = Buffer.alloc(size);
      await handle.read(text, 0, size, 0);
      return { ok: true, json: text.toString('utf8'), entries: [] };
    }

    if (head.length < MAGIC.length + 4) return { ok: false, message: DAMAGED };
    const jsonLength = head.readUInt32BE(MAGIC.length);
    if (jsonLength > maxJsonBytes) return { ok: false, message: TOO_BIG };
    let position = MAGIC.length + 4;
    const text = Buffer.alloc(jsonLength);
    const { bytesRead } = await handle.read(text, 0, jsonLength, position);
    if (bytesRead !== jsonLength) return { ok: false, message: DAMAGED };
    position += jsonLength;

    // Índice de archivos: se recorren las cabeceras saltando el contenido.
    const entries: PackageEntry[] = [];
    let total = 0;
    while (position < size) {
      const header = Buffer.alloc(ENTRY_HEADER);
      const read = await handle.read(header, 0, ENTRY_HEADER, position);
      if (read.bytesRead !== ENTRY_HEADER) return { ok: false, message: DAMAGED };
      const hash = header.toString('latin1', 0, 64);
      const ext = header.toString('latin1', 64, 67);
      const length = Number(header.readBigUInt64BE(67));
      position += ENTRY_HEADER;
      if (!/^[0-9a-f]{64}$/.test(hash) || (ext !== 'jpg' && ext !== 'mp4')) {
        return { ok: false, message: DAMAGED };
      }
      if (length > MEDIA_LIMITS.videoBytes || position + length > size) {
        return { ok: false, message: DAMAGED };
      }
      total += length;
      if (total > MEDIA_LIMITS.totalBytes || entries.length >= MEDIA_LIMITS.maxFiles) {
        return { ok: false, message: TOO_BIG };
      }
      entries.push({ hash, ext, offset: position, length });
      position += length;
    }
    return { ok: true, json: text.toString('utf8'), entries };
  } finally {
    await handle.close();
  }
}

/**
 * Copia al almacén los archivos que usa el contenido importado (`needed`),
 * comprobando la huella de cada uno. Los que ya estaban no se vuelven a copiar.
 * Devuelve un mensaje de error si falta alguno o alguno fue alterado.
 */
export async function importPackageMedia(
  path: string,
  entries: readonly PackageEntry[],
  needed: readonly UploadedFile[],
  store: MediaStore,
): Promise<string | null> {
  for (const file of needed) {
    if (await store.has(file)) continue;
    const entry = entries.find((e) => e.hash === file.hash && e.ext === file.ext);
    if (!entry) return `Al paquete le falta el archivo «${file.name}».`;
    try {
      const source =
        entry.length === 0
          ? Readable.from([])
          : createReadStream(path, { start: entry.offset, end: entry.offset + entry.length - 1 });
      await store.write(source, entry.ext, entry.hash);
    } catch {
      return `El archivo «${file.name}» del paquete está dañado o fue modificado.`;
    }
  }
  return null;
}
