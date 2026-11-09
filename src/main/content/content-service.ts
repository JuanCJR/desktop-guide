import type { KeyObject } from 'node:crypto';

import { type EditorCertificate, MAX_PACKAGE_BYTES } from '@shared/content/package';
import type { ContentState, ManualContent } from '@shared/content/schema';

import {
  createEditorKeyFile,
  createPackage,
  keyPairMatches,
  loadPrivateKey,
  openEditorKeyFile,
  openPackage,
} from './signing';

/** A small text file on disk (missing file = `null`). */
export interface TextStorage {
  read: () => Promise<string | null>;
  write: (data: string) => Promise<void>;
  remove: () => Promise<void>;
}

export interface ContentServiceOptions {
  /** The active signed content package. */
  packageStorage: TextStorage;
  /** Remembers the newest editor key seen, to reject replaced keys. */
  trustStorage: TextStorage;
  bundled: ManualContent;
  /** Bundled master public key; `null` disables signed content entirely. */
  masterPublicKey: KeyObject | null;
  now?: () => Date;
}

export type UnlockResult = { status: 'unlocked' } | { status: 'invalid'; message: string };
export type PublishResult = { status: 'published' } | { status: 'locked' };
export type ImportResult = { status: 'imported' } | { status: 'invalid'; message: string };
export type CreateKeyResult =
  | { status: 'created'; issuedAt: string }
  | { status: 'cancelled' }
  | { status: 'invalid'; message: string };

const NOT_CONFIGURED = 'Esta instalación no tiene configurada la llave maestra de la escuela.';
const REPLACED_KEY =
  'Esta llave fue reemplazada por una más nueva y ya no se acepta. Usa la llave de edición vigente.';
export const MIN_PASSPHRASE_LENGTH = 8;

const time = (iso: string) => Date.parse(iso);

/**
 * Decides which content the app shows and guards every change behind the
 * school's signatures. Free of Electron imports so it can be unit-tested.
 */
export class ContentService {
  private editor: { key: KeyObject; certificate: EditorCertificate } | null = null;
  private readonly packageStorage: TextStorage;
  private readonly trustStorage: TextStorage;
  private readonly bundled: ManualContent;
  private readonly masterPublicKey: KeyObject | null;
  private readonly now: () => Date;

  constructor(options: ContentServiceOptions) {
    this.packageStorage = options.packageStorage;
    this.trustStorage = options.trustStorage;
    this.bundled = options.bundled;
    this.masterPublicKey = options.masterPublicKey;
    this.now = options.now ?? (() => new Date());
  }

  /** Issue date of the newest editor key this computer has seen. */
  private async newestKeyIssuedAt(): Promise<string | null> {
    try {
      const raw = await this.trustStorage.read();
      if (!raw) return null;
      const value: unknown = (JSON.parse(raw) as { newestKeyIssuedAt?: unknown }).newestKeyIssuedAt;
      return typeof value === 'string' && !Number.isNaN(time(value)) ? value : null;
    } catch {
      return null;
    }
  }

  /** Records `issuedAt` as the newest key if it is newer than the current one. */
  private async rememberKey(issuedAt: string): Promise<void> {
    const current = await this.newestKeyIssuedAt();
    if (current !== null && time(current) >= time(issuedAt)) return;
    await this.trustStorage.write(JSON.stringify({ newestKeyIssuedAt: issuedAt }));
  }

  private async isReplaced(certificate: EditorCertificate): Promise<boolean> {
    const newest = await this.newestKeyIssuedAt();
    return newest !== null && time(certificate.issuedAt) < time(newest);
  }

  async getState(): Promise<ContentState> {
    const base = {
      signingConfigured: this.masterPublicKey !== null,
      editorUnlocked: this.editor !== null,
      activeKeyIssuedAt: await this.newestKeyIssuedAt(),
    };
    const bundledState = (warning: string | null): ContentState => ({
      ...base,
      content: this.bundled,
      source: 'bundled',
      publishedAt: null,
      warning,
    });

    const raw = await this.packageStorage.read();
    if (raw === null) return bundledState(null);
    if (!this.masterPublicKey) return bundledState(NOT_CONFIGURED);

    // Content already stored was accepted when imported or published, so a
    // later key replacement does not hide it; only new imports are refused.
    const opened = openPackage(raw, this.masterPublicKey);
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

  async unlock(keyFileText: string, passphrase: string): Promise<UnlockResult> {
    if (!this.masterPublicKey) return { status: 'invalid', message: NOT_CONFIGURED };
    const opened = openEditorKeyFile(keyFileText, passphrase, this.masterPublicKey);
    if (!opened.ok) return { status: 'invalid', message: opened.message };
    if (await this.isReplaced(opened.certificate)) {
      return { status: 'invalid', message: REPLACED_KEY };
    }
    await this.rememberKey(opened.certificate.issuedAt);
    this.editor = { key: opened.key, certificate: opened.certificate };
    return { status: 'unlocked' };
  }

  lock(): void {
    this.editor = null;
  }

  async publish(content: ManualContent): Promise<PublishResult> {
    if (!this.editor) return { status: 'locked' };
    if (await this.isReplaced(this.editor.certificate)) {
      this.editor = null;
      return { status: 'locked' };
    }
    const signed = createPackage(content, this.editor.key, this.editor.certificate, this.now());
    await this.packageStorage.write(JSON.stringify(signed, null, 2));
    return { status: 'published' };
  }

  async importPackage(raw: string): Promise<ImportResult> {
    if (!this.masterPublicKey) return { status: 'invalid', message: NOT_CONFIGURED };
    if (raw.length > MAX_PACKAGE_BYTES) {
      return { status: 'invalid', message: 'El archivo es demasiado grande.' };
    }
    const opened = openPackage(raw, this.masterPublicKey);
    if (!opened.ok) return { status: 'invalid', message: opened.message };
    if (await this.isReplaced(opened.certificate)) {
      return {
        status: 'invalid',
        message: 'Este archivo fue publicado con una llave que ya fue reemplazada.',
      };
    }
    await this.packageStorage.write(raw);
    await this.rememberKey(opened.certificate.issuedAt);
    return { status: 'imported' };
  }

  /**
   * Creates a new editor key with the master key. The new key replaces every
   * older one on this computer, and on others as they import its packages.
   * `saveKeyFile` stores the new `.psmkey` file and returns `false` if the
   * user cancelled; older keys are only replaced once it was saved, so a
   * cancelled save never leaves the school without a working key.
   */
  async createEditorKey(
    masterKeyPem: string,
    masterPassphrase: string,
    newPassphrase: string,
    saveKeyFile: (fileText: string) => Promise<boolean>,
  ): Promise<CreateKeyResult> {
    if (!this.masterPublicKey) return { status: 'invalid', message: NOT_CONFIGURED };
    if (newPassphrase.length < MIN_PASSPHRASE_LENGTH) {
      return {
        status: 'invalid',
        message: `La contraseña nueva debe tener al menos ${MIN_PASSPHRASE_LENGTH} caracteres.`,
      };
    }
    const master = loadPrivateKey(masterKeyPem, masterPassphrase);
    if (!master.ok) {
      return { status: 'invalid', message: 'La llave maestra o su contraseña no son correctas.' };
    }
    if (!keyPairMatches(master.key, this.masterPublicKey)) {
      return { status: 'invalid', message: 'Esa no es la llave maestra de esta aplicación.' };
    }
    const { fileText, certificate } = createEditorKeyFile(master.key, newPassphrase, this.now());
    if (!(await saveKeyFile(fileText))) return { status: 'cancelled' };
    await this.rememberKey(certificate.issuedAt);
    this.editor = null;
    return { status: 'created', issuedAt: certificate.issuedAt };
  }

  /** The stored signed package, ready to be copied to other computers. */
  async exportPackage(): Promise<string | null> {
    return this.packageStorage.read();
  }

  /** Back to the bundled content. Replaced keys stay replaced. */
  async reset(): Promise<void> {
    await this.packageStorage.remove();
  }
}
