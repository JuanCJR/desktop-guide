import { createHash } from 'node:crypto';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { MEDIA_LIMITS } from '@shared/content/media';

import { MediaStore } from './media-store';

let dir: string;
let store: MediaStore;
const sha = (data: Buffer) => createHash('sha256').update(data).digest('hex');
// Comienzo de un MP4 real: tamaño de la caja + "ftyp" + marca.
const mp4 = Buffer.concat([
  Buffer.from([0, 0, 0, 24]),
  Buffer.from('ftypisom'),
  Buffer.alloc(100, 7),
]);

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'media-'));
  store = new MediaStore(join(dir, 'media'));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('MediaStore', () => {
  it('stores a video under its SHA-256 and keeps the original name for display', async () => {
    const source = join(dir, 'Clase grabada.mp4');
    await writeFile(source, mp4);
    const result = await store.addVideo(source);
    expect(result).toEqual({
      ok: true,
      file: { hash: sha(mp4), ext: 'mp4', name: 'Clase grabada.mp4', size: mp4.length },
    });
    expect(await readFile(store.pathFor({ hash: sha(mp4), ext: 'mp4' }))).toEqual(mp4);
    expect(await store.has({ hash: sha(mp4), ext: 'mp4' })).toBe(true);
  });

  it('rejects files that are not MP4 videos', async () => {
    const source = join(dir, 'falso.mp4');
    await writeFile(source, Buffer.from('esto no es un video'));
    expect(await store.addVideo(source)).toMatchObject({ ok: false });
  });

  it('stores the encoded JPG of an image and rejects files the encoder cannot read', async () => {
    const source = join(dir, 'foto.png');
    await writeFile(source, Buffer.from('png'));
    const jpg = Buffer.from('jpg-bytes');
    const ok = await store.addImage(source, () => Promise.resolve(jpg));
    expect(ok).toEqual({
      ok: true,
      file: { hash: sha(jpg), ext: 'jpg', name: 'foto.jpg', size: jpg.length },
    });
    expect(await store.addImage(source, () => Promise.resolve(null))).toMatchObject({ ok: false });
  });

  it('rejects images over the upload limit before reading them', async () => {
    const source = join(dir, 'enorme.jpg');
    await writeFile(source, Buffer.alloc(MEDIA_LIMITS.imageInputBytes + 1));
    let called = false;
    const result = await store.addImage(source, () => {
      called = true;
      return Promise.resolve(Buffer.from('x'));
    });
    expect(result).toMatchObject({ ok: false });
    expect(called).toBe(false);
  });

  it('refuses data whose hash does not match and leaves nothing behind', async () => {
    await expect(store.write(Readable.from([mp4]), 'mp4', 'f'.repeat(64))).rejects.toThrow();
    expect(await readdir(join(dir, 'media'))).toEqual([]);
  });

  it('only accepts valid file names from the protocol', () => {
    expect(store.pathForName(`${'a'.repeat(64)}.jpg`)).not.toBeNull();
    expect(store.pathForName('../manual-content.psm')).toBeNull();
    expect(store.pathForName(`${'a'.repeat(64)}.exe`)).toBeNull();
  });

  it('prunes files that are no longer used', async () => {
    const a = await store.write(Readable.from([Buffer.from('a')]), 'jpg');
    const b = await store.write(Readable.from([Buffer.from('b')]), 'jpg');
    await store.prune(new Set([`${a.hash}.jpg`]));
    expect(await readdir(join(dir, 'media'))).toEqual([`${a.hash}.jpg`]);
    expect(await store.has({ hash: b.hash, ext: 'jpg' })).toBe(false);
  });
});
