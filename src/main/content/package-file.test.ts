import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { UploadedFile } from '@shared/content/media';

import { MediaStore } from './media-store';
import { importPackageMedia, readPackageFile, writePackageFile } from './package-file';

let dir: string;
let source: MediaStore;
let target: MediaStore;
const JSON_TEXT = JSON.stringify({ format: 'iupsm-manual-content', payload: '{}' });

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'psm-'));
  source = new MediaStore(join(dir, 'a'));
  target = new MediaStore(join(dir, 'b'));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

async function upload(data: string, ext: UploadedFile['ext']): Promise<UploadedFile> {
  const { hash, size } = await source.write(Readable.from([Buffer.from(data)]), ext);
  return ext === 'jpg'
    ? { hash, ext, size, name: 'foto.jpg' }
    : { hash, ext, size, name: 'video.mp4' };
}

describe('package file', () => {
  it('keeps the plain JSON format when there are no uploaded files', async () => {
    const path = join(dir, 'solo-texto.psm');
    await writePackageFile(path, JSON_TEXT, [], source);
    expect(await readFile(path, 'utf8')).toBe(JSON_TEXT);
    expect(await readPackageFile(path, 1_000_000)).toEqual({
      ok: true,
      json: JSON_TEXT,
      entries: [],
    });
  });

  it('round-trips the signed JSON and the uploaded files', async () => {
    const image = await upload('imagen', 'jpg');
    const video = await upload('video'.repeat(1000), 'mp4');
    const path = join(dir, 'con-archivos.psm');
    await writePackageFile(path, JSON_TEXT, [image, video], source);

    const read = await readPackageFile(path, 1_000_000);
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.json).toBe(JSON_TEXT);
    expect(read.entries.map((e) => [e.hash, e.ext, e.length])).toEqual([
      [image.hash, 'jpg', image.size],
      [video.hash, 'mp4', video.size],
    ]);
    expect(await importPackageMedia(path, read.entries, [image, video], target)).toBeNull();
    expect(await readFile(target.pathFor(video))).toEqual(await readFile(source.pathFor(video)));
  });

  it('reports files that are missing from the package', async () => {
    const image = await upload('imagen', 'jpg');
    const missing = await upload('otra', 'jpg');
    const path = join(dir, 'incompleto.psm');
    await writePackageFile(path, JSON_TEXT, [image], source);
    const read = await readPackageFile(path, 1_000_000);
    if (!read.ok) throw new Error(read.message);
    expect(await importPackageMedia(path, read.entries, [image, missing], target)).toMatch(
      /le falta/,
    );
  });

  it('detects a file that was modified inside the package', async () => {
    const image = await upload('imagen original', 'jpg');
    const path = join(dir, 'alterado.psm');
    await writePackageFile(path, JSON_TEXT, [image], source);
    const bytes = await readFile(path);
    const last = bytes.length - 1;
    bytes.writeUInt8((bytes.readUInt8(last) ^ 0xff) & 0xff, last); // cambia el último byte de la imagen
    await writeFile(path, bytes);
    const read = await readPackageFile(path, 1_000_000);
    if (!read.ok) throw new Error(read.message);
    expect(await importPackageMedia(path, read.entries, [image], target)).toMatch(/modificado/);
    expect(await target.has(image)).toBe(false);
  });

  it('rejects truncated packages and oversized JSON', async () => {
    const image = await upload('imagen', 'jpg');
    const path = join(dir, 'cortado.psm');
    await writePackageFile(path, JSON_TEXT, [image], source);
    const bytes = await readFile(path);
    await writeFile(path, bytes.subarray(0, bytes.length - 3));
    expect(await readPackageFile(path, 1_000_000)).toMatchObject({ ok: false });
    expect(await readPackageFile(path, 10)).toMatchObject({ ok: false });
  });
});
