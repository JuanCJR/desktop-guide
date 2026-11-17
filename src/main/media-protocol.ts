/**
 * Protocolo local `psm-media:` para mostrar las imágenes y videos subidos.
 *
 * La interfaz no puede leer archivos de la computadora directamente (por
 * seguridad). En su lugar pide `psm-media://file/<huella>.<ext>` y este código
 * devuelve el archivo del almacén (`./content/media-store.ts`), solo si el
 * nombre es válido. Responde a pedidos por partes ("Range"), que el
 * reproductor de video necesita para poder adelantar o retroceder.
 *
 * No da acceso a internet ni a otras carpetas. Se registra en `./index.ts`; la
 * Content-Security-Policy (`src/renderer/index.html`) lo permite en `img-src` y
 * `media-src`.
 */
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Readable } from 'node:stream';

import { protocol } from 'electron';

import { MEDIA_PROTOCOL } from '@shared/content/media';

import type { MediaStore } from './content/media-store';

const TYPES: Record<string, string> = { jpg: 'image/jpeg', mp4: 'video/mp4' };

/** Debe llamarse antes de que la app esté lista. */
export function registerMediaScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: MEDIA_PROTOCOL,
      privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
    },
  ]);
}

/**
 * Interpreta un encabezado `Range: bytes=a-b` para un archivo de `size` bytes.
 * Devuelve el tramo pedido, o `null` si no hay encabezado o no es válido.
 */
export function parseRange(header: string | null, size: number): [number, number] | null {
  const match = header ? /^bytes=(\d*)-(\d*)$/.exec(header.trim()) : null;
  if (!match || size === 0) return null;
  const [, from = '', to = ''] = match;
  let start: number;
  let end: number;
  if (from === '') {
    // "bytes=-500": los últimos 500 bytes.
    if (to === '') return null;
    start = Math.max(0, size - Number(to));
    end = size - 1;
  } else {
    start = Number(from);
    end = to === '' ? size - 1 : Math.min(Number(to), size - 1);
  }
  return start <= end && start < size ? [start, end] : null;
}

/** Atiende el protocolo; debe llamarse cuando la app está lista. */
export function handleMediaProtocol(store: MediaStore): void {
  protocol.handle(MEDIA_PROTOCOL, async (request) => {
    const url = new URL(request.url);
    const name = url.hostname === 'file' ? url.pathname.replace(/^\//, '') : '';
    const path = store.pathForName(name);
    if (!path) return new Response('No encontrado', { status: 404 });
    let size: number;
    try {
      size = (await stat(path)).size;
    } catch {
      return new Response('No encontrado', { status: 404 });
    }
    const type = TYPES[name.slice(-3)] ?? 'application/octet-stream';
    const range = parseRange(request.headers.get('range'), size);
    const headers = { 'Content-Type': type, 'Accept-Ranges': 'bytes' };
    if (!range) {
      const body = Readable.toWeb(createReadStream(path)) as ReadableStream;
      return new Response(body, {
        status: 200,
        headers: { ...headers, 'Content-Length': String(size) },
      });
    }
    const [start, end] = range;
    const body = Readable.toWeb(createReadStream(path, { start, end })) as ReadableStream;
    return new Response(body, {
      status: 206,
      headers: {
        ...headers,
        'Content-Length': String(end - start + 1),
        'Content-Range': `bytes ${String(start)}-${String(end)}/${String(size)}`,
      },
    });
  });
}
