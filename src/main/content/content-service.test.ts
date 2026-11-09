import { generateKeyPairSync } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { DEFAULT_CONTENT } from '@shared/content/default-content';
import type { ManualContent } from '@shared/content/schema';

import { ContentService, type PackageStorage } from './content-service';

const school = generateKeyPairSync('ed25519');
const PASSPHRASE = 'escuela-47';
const schoolPem = school.privateKey
  .export({
    type: 'pkcs8',
    format: 'pem',
    cipher: 'aes-256-cbc',
    passphrase: PASSPHRASE,
  })
  .toString();
const strangerPem = generateKeyPairSync('ed25519')
  .privateKey.export({
    type: 'pkcs8',
    format: 'pem',
    cipher: 'aes-256-cbc',
    passphrase: PASSPHRASE,
  })
  .toString();

function memoryStorage(initial: string | null = null): PackageStorage & { data: string | null } {
  const storage = {
    data: initial,
    read: () => Promise.resolve(storage.data),
    write: (value: string) => {
      storage.data = value;
      return Promise.resolve();
    },
    remove: () => {
      storage.data = null;
      return Promise.resolve();
    },
  };
  return storage;
}

function createService(storage = memoryStorage(), publicKey = school.publicKey) {
  return new ContentService({
    storage,
    bundled: DEFAULT_CONTENT,
    publicKey,
    now: () => new Date('2026-11-09T12:00:00.000Z'),
  });
}

const edited: ManualContent = {
  ...DEFAULT_CONTENT,
  home: { ...DEFAULT_CONTENT.home, title: 'Título actualizado' },
};

describe('ContentService', () => {
  it('shows the bundled content until something is published', async () => {
    const state = await createService().getState();
    expect(state).toMatchObject({
      source: 'bundled',
      publishedAt: null,
      warning: null,
      signingConfigured: true,
      editorUnlocked: false,
    });
    expect(state.content).toBe(DEFAULT_CONTENT);
  });

  it('refuses to publish while locked', async () => {
    const storage = memoryStorage();
    expect(await createService(storage).publish(edited)).toEqual({ status: 'locked' });
    expect(storage.data).toBeNull();
  });

  it('refuses keys with a wrong passphrase or from another school', () => {
    const service = createService();
    expect(service.unlock(schoolPem, 'wrong').status).toBe('invalid');
    expect(service.unlock(strangerPem, PASSPHRASE)).toEqual({
      status: 'invalid',
      message: 'Esta llave no corresponde a esta aplicación.',
    });
  });

  it('publishes signed content once unlocked', async () => {
    const service = createService();
    expect(service.unlock(schoolPem, PASSPHRASE)).toEqual({ status: 'unlocked' });
    expect(await service.publish(edited)).toEqual({ status: 'published' });

    const state = await service.getState();
    expect(state).toMatchObject({
      source: 'signed-package',
      publishedAt: '2026-11-09T12:00:00.000Z',
      editorUnlocked: true,
    });
    expect(state.content.home.title).toBe('Título actualizado');

    service.lock();
    expect((await service.getState()).editorUnlocked).toBe(false);
  });

  it('falls back to bundled content when the stored file was tampered with', async () => {
    const storage = memoryStorage();
    const service = createService(storage);
    service.unlock(schoolPem, PASSPHRASE);
    await service.publish(edited);
    storage.data = (storage.data ?? '').replace('Título actualizado', 'Información falsa');

    const state = await service.getState();
    expect(state.source).toBe('bundled');
    expect(state.content).toBe(DEFAULT_CONTENT);
    expect(state.warning).toContain('firma');
  });

  it('imports packages published on another computer', async () => {
    const publisher = createService();
    publisher.unlock(schoolPem, PASSPHRASE);
    await publisher.publish(edited);
    const exported = await publisher.exportPackage();

    const reader = createService();
    expect(await reader.importPackage(exported ?? '')).toEqual({ status: 'imported' });
    expect((await reader.getState()).content.home.title).toBe('Título actualizado');
  });

  it('rejects forged packages and keeps the current content', async () => {
    const storage = memoryStorage();
    const reader = createService(storage);
    const forged = JSON.stringify({
      format: 'iupsm-manual-content',
      formatVersion: 1,
      publishedAt: '2026-11-09T12:00:00.000Z',
      payload: JSON.stringify(edited),
      signature: 'AAAA',
    });
    expect((await reader.importPackage(forged)).status).toBe('invalid');
    expect(storage.data).toBeNull();
  });

  it('restores the bundled content', async () => {
    const service = createService();
    service.unlock(schoolPem, PASSPHRASE);
    await service.publish(edited);
    await service.reset();
    expect((await service.getState()).source).toBe('bundled');
    expect(await service.exportPackage()).toBeNull();
  });

  it('works read-only when no public key is configured', async () => {
    const service = createService(memoryStorage('{}'), null as never);
    const state = await service.getState();
    expect(state).toMatchObject({ source: 'bundled', signingConfigured: false });
    expect(state.warning).not.toBeNull();
    expect(service.unlock(schoolPem, PASSPHRASE).status).toBe('invalid');
  });
});
