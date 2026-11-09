import { describe, expect, it } from 'vitest';

import { DEFAULT_CONTENT } from '@shared/content/default-content';
import type { ManualContent } from '@shared/content/schema';

import { ContentService, type TextStorage } from './content-service';
import { createEditorKey, createMasterKey } from './test-keys';

const master = createMasterKey();
const otherMaster = createMasterKey();
const oldEditor = createEditorKey(master.privateKey, master.publicKey, '2026-10-01T00:00:00.000Z');
const NOW = '2026-11-09T12:00:00.000Z';

function memoryStorage(initial: string | null = null): TextStorage & { data: string | null } {
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

function createService(
  packageStorage = memoryStorage(),
  trustStorage = memoryStorage(),
  masterPublicKey: typeof master.publicKey | null = master.publicKey,
) {
  return new ContentService({
    packageStorage,
    trustStorage,
    bundled: DEFAULT_CONTENT,
    masterPublicKey,
    now: () => new Date(NOW),
  });
}

const edited: ManualContent = {
  ...DEFAULT_CONTENT,
  home: { ...DEFAULT_CONTENT.home, title: 'Título actualizado' },
};

/** Publishes `edited` with `editor` and returns the exported package. */
async function publishWith(editor: typeof oldEditor): Promise<string> {
  const service = createService();
  await service.unlock(editor.fileText, editor.passphrase);
  await service.publish(edited);
  return (await service.exportPackage()) ?? '';
}

/** Saves the created key file into `saved` and reports it as saved. */
function saveInto(saved: { text: string | null }) {
  return (fileText: string) => {
    saved.text = fileText;
    return Promise.resolve(true);
  };
}

describe('ContentService', () => {
  it('shows the bundled content until something is published', async () => {
    const state = await createService().getState();
    expect(state).toMatchObject({
      source: 'bundled',
      publishedAt: null,
      warning: null,
      signingConfigured: true,
      editorUnlocked: false,
      activeKeyIssuedAt: null,
    });
    expect(state.content).toBe(DEFAULT_CONTENT);
  });

  it('refuses to publish while locked', async () => {
    const storage = memoryStorage();
    expect(await createService(storage).publish(edited)).toEqual({ status: 'locked' });
    expect(storage.data).toBeNull();
  });

  it('refuses a wrong passphrase or a key from another school', async () => {
    const service = createService();
    expect((await service.unlock(oldEditor.fileText, 'wrong')).status).toBe('invalid');
    const foreign = createEditorKey(otherMaster.privateKey, otherMaster.publicKey, NOW);
    expect((await service.unlock(foreign.fileText, foreign.passphrase)).status).toBe('invalid');
  });

  it('publishes signed content once unlocked', async () => {
    const service = createService();
    expect(await service.unlock(oldEditor.fileText, oldEditor.passphrase)).toEqual({
      status: 'unlocked',
    });
    expect(await service.publish(edited)).toEqual({ status: 'published' });

    const state = await service.getState();
    expect(state).toMatchObject({
      source: 'signed-package',
      publishedAt: NOW,
      editorUnlocked: true,
      activeKeyIssuedAt: oldEditor.certificate.issuedAt,
    });
    expect(state.content.home.title).toBe('Título actualizado');

    service.lock();
    expect((await service.getState()).editorUnlocked).toBe(false);
  });

  it('falls back to bundled content when the stored file was tampered with', async () => {
    const storage = memoryStorage();
    const service = createService(storage);
    await service.unlock(oldEditor.fileText, oldEditor.passphrase);
    await service.publish(edited);
    storage.data = (storage.data ?? '').replace('Título actualizado', 'Información falsa');

    const state = await service.getState();
    expect(state.source).toBe('bundled');
    expect(state.warning).toContain('firma');
  });

  it('imports packages published on another computer and rejects forged ones', async () => {
    const reader = createService();
    expect(await reader.importPackage(await publishWith(oldEditor))).toEqual({
      status: 'imported',
    });
    expect((await reader.getState()).content.home.title).toBe('Título actualizado');

    const forged = (await publishWith(oldEditor)).replace('Título actualizado', 'Falso');
    expect((await reader.importPackage(forged)).status).toBe('invalid');
    expect((await reader.getState()).content.home.title).toBe('Título actualizado');
  });

  describe('creating a new editor key with the master key', () => {
    it('rejects a wrong master passphrase, another master or a short passphrase', async () => {
      const service = createService();
      const save = saveInto({ text: null });
      expect((await service.createEditorKey(master.pem, 'wrong', 'nueva-clave', save)).status).toBe(
        'invalid',
      );
      expect(
        (
          await service.createEditorKey(
            otherMaster.pem,
            otherMaster.passphrase,
            'nueva-clave',
            save,
          )
        ).status,
      ).toBe('invalid');
      expect(
        (await service.createEditorKey(master.pem, master.passphrase, 'corta', save)).status,
      ).toBe('invalid');
    });

    it('creates a working key and replaces older keys on this computer', async () => {
      const trust = memoryStorage();
      const service = createService(memoryStorage(), trust);
      await service.unlock(oldEditor.fileText, oldEditor.passphrase);

      const saved = { text: null as string | null };
      expect(
        await service.createEditorKey(
          master.pem,
          master.passphrase,
          'nueva-clave',
          saveInto(saved),
        ),
      ).toEqual({ status: 'created', issuedAt: NOW });

      // Creating a key locks the session that used the old key.
      expect((await service.getState()).editorUnlocked).toBe(false);
      expect((await service.getState()).activeKeyIssuedAt).toBe(NOW);
      expect(await service.unlock(oldEditor.fileText, oldEditor.passphrase)).toMatchObject({
        status: 'invalid',
        message: expect.stringContaining('reemplazada') as unknown,
      });
      expect(await service.unlock(saved.text ?? '', 'nueva-clave')).toEqual({ status: 'unlocked' });
      expect(await service.publish(edited)).toEqual({ status: 'published' });
    });

    it('keeps older keys valid if saving the new key is cancelled', async () => {
      const service = createService();
      const cancelled = await service.createEditorKey(
        master.pem,
        master.passphrase,
        'nueva-clave',
        () => Promise.resolve(false),
      );
      expect(cancelled).toEqual({ status: 'cancelled' });
      expect(await service.unlock(oldEditor.fileText, oldEditor.passphrase)).toEqual({
        status: 'unlocked',
      });
    });

    it('other computers learn about the new key when they import its content', async () => {
      const newEditor = createEditorKey(master.privateKey, master.publicKey, NOW);
      const reader = createService();

      expect((await reader.importPackage(await publishWith(newEditor))).status).toBe('imported');
      // A package or session made with the replaced key is now refused here.
      expect((await reader.importPackage(await publishWith(oldEditor))).status).toBe('invalid');
      expect((await reader.unlock(oldEditor.fileText, oldEditor.passphrase)).status).toBe(
        'invalid',
      );
    });

    it('keeps showing stored content after its key was replaced', async () => {
      const packages = memoryStorage();
      const service = createService(packages);
      await service.unlock(oldEditor.fileText, oldEditor.passphrase);
      await service.publish(edited);
      await service.createEditorKey(
        master.pem,
        master.passphrase,
        'nueva-clave',
        saveInto({ text: null }),
      );
      const state = await service.getState();
      expect(state.source).toBe('signed-package');
      expect(state.content.home.title).toBe('Título actualizado');
    });
  });

  it('restoring the original content keeps replaced keys replaced', async () => {
    const newEditor = createEditorKey(master.privateKey, master.publicKey, NOW);
    const service = createService();
    await service.importPackage(await publishWith(newEditor));
    await service.reset();
    expect((await service.getState()).source).toBe('bundled');
    expect((await service.unlock(oldEditor.fileText, oldEditor.passphrase)).status).toBe('invalid');
  });

  it('ignores a corrupted trust file', async () => {
    const service = createService(memoryStorage(), memoryStorage('not json'));
    expect((await service.getState()).activeKeyIssuedAt).toBeNull();
    expect((await service.unlock(oldEditor.fileText, oldEditor.passphrase)).status).toBe(
      'unlocked',
    );
  });

  it('works read-only when no master key is configured', async () => {
    const service = createService(memoryStorage('{}'), memoryStorage(), null);
    const state = await service.getState();
    expect(state).toMatchObject({ source: 'bundled', signingConfigured: false });
    expect(state.warning).not.toBeNull();
    expect((await service.unlock(oldEditor.fileText, oldEditor.passphrase)).status).toBe('invalid');
  });
});
