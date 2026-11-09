import type { KeyObject } from 'node:crypto';

import { MAX_PACKAGE_BYTES } from '@shared/content/package';
import type { ContentState, ManualContent } from '@shared/content/schema';

import { createPackage, keyPairMatches, loadPrivateKey, openPackage } from './signing';

/** Persistence of the active signed package (a single file on disk). */
export interface PackageStorage {
  read: () => Promise<string | null>;
  write: (data: string) => Promise<void>;
  remove: () => Promise<void>;
}

export interface ContentServiceOptions {
  storage: PackageStorage;
  bundled: ManualContent;
  /** Bundled public key; `null` disables signed packages entirely. */
  publicKey: KeyObject | null;
  now?: () => Date;
}

export type UnlockResult = { status: 'unlocked' } | { status: 'invalid'; message: string };
export type PublishResult = { status: 'published' } | { status: 'locked' };
export type ImportResult = { status: 'imported' } | { status: 'invalid'; message: string };

const NOT_CONFIGURED = 'Esta instalación no tiene configurada la llave pública de la escuela.';

/**
 * Decides which content the app shows and guards every change behind the
 * school's signature. Free of Electron imports so it can be unit-tested.
 */
export class ContentService {
  private editorKey: KeyObject | null = null;
  private readonly storage: PackageStorage;
  private readonly bundled: ManualContent;
  private readonly publicKey: KeyObject | null;
  private readonly now: () => Date;

  constructor({ storage, bundled, publicKey, now = () => new Date() }: ContentServiceOptions) {
    this.storage = storage;
    this.bundled = bundled;
    this.publicKey = publicKey;
    this.now = now;
  }

  async getState(): Promise<ContentState> {
    const base = {
      signingConfigured: this.publicKey !== null,
      editorUnlocked: this.editorKey !== null,
    };
    const bundledState = (warning: string | null): ContentState => ({
      ...base,
      content: this.bundled,
      source: 'bundled',
      publishedAt: null,
      warning,
    });

    const raw = await this.storage.read();
    if (raw === null) return bundledState(null);
    if (!this.publicKey) return bundledState(NOT_CONFIGURED);

    const opened = openPackage(raw, this.publicKey);
    if (!opened.ok) {
      return bundledState(
        `Se ignoró el contenido guardado (${opened.message}) y se muestra el contenido original.`,
      );
    }
    return {
      ...base,
      content: opened.content,
      source: 'signed-package',
      publishedAt: opened.publishedAt,
      warning: null,
    };
  }

  unlock(privateKeyPem: string, passphrase: string): UnlockResult {
    if (!this.publicKey) return { status: 'invalid', message: NOT_CONFIGURED };
    const loaded = loadPrivateKey(privateKeyPem, passphrase);
    if (!loaded.ok) return { status: 'invalid', message: loaded.message };
    if (!keyPairMatches(loaded.key, this.publicKey)) {
      return { status: 'invalid', message: 'Esta llave no corresponde a esta aplicación.' };
    }
    this.editorKey = loaded.key;
    return { status: 'unlocked' };
  }

  lock(): void {
    this.editorKey = null;
  }

  async publish(content: ManualContent): Promise<PublishResult> {
    if (!this.editorKey) return { status: 'locked' };
    const signed = createPackage(content, this.editorKey, this.now());
    await this.storage.write(JSON.stringify(signed, null, 2));
    return { status: 'published' };
  }

  async importPackage(raw: string): Promise<ImportResult> {
    if (!this.publicKey) return { status: 'invalid', message: NOT_CONFIGURED };
    if (raw.length > MAX_PACKAGE_BYTES) {
      return { status: 'invalid', message: 'El archivo es demasiado grande.' };
    }
    const opened = openPackage(raw, this.publicKey);
    if (!opened.ok) return { status: 'invalid', message: opened.message };
    await this.storage.write(raw);
    return { status: 'imported' };
  }

  /** The stored signed package, ready to be copied to other computers. */
  async exportPackage(): Promise<string | null> {
    return this.storage.read();
  }

  async reset(): Promise<void> {
    await this.storage.remove();
  }
}
