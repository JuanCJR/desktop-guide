/**
 * Servicio de contenido: el "cerebro" que decide qué contenido del manual se
 * muestra y quién puede cambiarlo.
 *
 * Cómo funciona, en pocas palabras:
 * - La app trae un contenido original incluido (`src/shared/content/default-content.ts`).
 * - Quien tenga una llave de edición (un archivo `.psmkey` más su contraseña)
 *   puede publicar cambios. Cada publicación se guarda como un "paquete"
 *   firmado digitalmente, y la firma prueba que lo publicó la escuela.
 * - Ese paquete se puede exportar e importar en otros computadores; la app
 *   solo lo acepta si la firma es válida.
 * - Si una llave se pierde, se crea una nueva con la llave maestra y las
 *   anteriores dejan de aceptarse.
 *
 * Las operaciones criptográficas están en `./signing.ts`; el guardado en disco,
 * en `./file-storage.ts`. Los canales IPC que exponen este servicio a la
 * interfaz están en `../ipc/handlers/content.ts`. No importa Electron, así que
 * se puede probar con tests (`./content-service.test.ts`).
 */
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

/** Un archivo de texto pequeño en el disco (si no existe, se lee como `null`). */
export interface TextStorage {
  read: () => Promise<string | null>;
  write: (data: string) => Promise<void>;
  remove: () => Promise<void>;
}

export interface ContentServiceOptions {
  /** Dónde se guarda el paquete de contenido firmado que está activo. */
  packageStorage: TextStorage;
  /** Recuerda la llave de edición más nueva vista, para rechazar las reemplazadas. */
  trustStorage: TextStorage;
  /** Contenido original que viene incluido en la app. */
  bundled: ManualContent;
  /** Llave maestra pública incluida en la app; si es `null`, no se puede editar. */
  masterPublicKey: KeyObject | null;
  now?: () => Date;
}

// Posibles resultados de cada operación (se envían a la interfaz).
export type UnlockResult = { status: 'unlocked' } | { status: 'invalid'; message: string };
export type PublishResult = { status: 'published' } | { status: 'locked' };
export type ImportResult =
  { status: 'imported' } | { status: 'cancelled' } | { status: 'invalid'; message: string };

/** Fechas que se comparan cuando el archivo importado es más antiguo que el actual. */
export interface OlderPackageInfo {
  /** Fecha de publicación del archivo que se quiere importar. */
  incoming: string;
  /** Fecha de publicación del contenido que se muestra ahora. */
  current: string;
}
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
 * Decide qué contenido muestra la app y protege cada cambio con las firmas de
 * la escuela. No depende de Electron, así que se puede probar con tests.
 */
export class ContentService {
  // Llave de edición abierta mientras el modo edición está activo (`null` = bloqueado).
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

  /** Fecha de creación de la llave de edición más nueva que ha visto este computador. */
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

  /** Guarda `issuedAt` como la llave más nueva, si es más reciente que la actual. */
  private async rememberKey(issuedAt: string): Promise<void> {
    const current = await this.newestKeyIssuedAt();
    if (current !== null && time(current) >= time(issuedAt)) return;
    await this.trustStorage.write(JSON.stringify({ newestKeyIssuedAt: issuedAt }));
  }

  // Una llave está "reemplazada" si se creó antes que la más nueva conocida.
  private async isReplaced(certificate: EditorCertificate): Promise<boolean> {
    const newest = await this.newestKeyIssuedAt();
    return newest !== null && time(certificate.issuedAt) < time(newest);
  }

  /**
   * Devuelve qué contenido mostrar: el paquete publicado si existe y su firma
   * es válida; si no, el contenido original incluido en la app (con un aviso
   * cuando se tuvo que ignorar algo).
   */
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

    // El contenido ya guardado se aceptó cuando se importó o publicó, así que
    // reemplazar una llave después no lo oculta; solo se rechazan importaciones nuevas.
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

  /** Activa el modo edición si la llave es válida, de la escuela y no está reemplazada. */
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

  /** Sale del modo edición (olvida la llave abierta). */
  lock(): void {
    this.editor = null;
  }

  /** Firma el contenido editado con la llave abierta y lo guarda como contenido activo. */
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

  /** Acepta un paquete de contenido traído de otro computador, si su firma es válida. */
  /**
   * Importa un paquete publicado en otra computadora. Si es más antiguo que el
   * contenido que ya se muestra aquí, pregunta con `confirmOlder` antes de
   * reemplazarlo (sin esa función, no lo reemplaza), para que nadie vuelva a
   * una versión vieja por error.
   */
  async importPackage(
    raw: string,
    confirmOlder?: (info: OlderPackageInfo) => Promise<boolean>,
  ): Promise<ImportResult> {
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

    // Compara con el contenido guardado (si hay uno válido) para avisar si el
    // archivo nuevo es más antiguo.
    const stored = await this.packageStorage.read();
    const current = stored === null ? null : openPackage(stored, this.masterPublicKey);
    if (current?.ok && time(opened.publishedAt) < time(current.publishedAt)) {
      const info = { incoming: opened.publishedAt, current: current.publishedAt };
      const accepted = confirmOlder ? await confirmOlder(info) : false;
      if (!accepted) return { status: 'cancelled' };
    }

    await this.packageStorage.write(raw);
    await this.rememberKey(opened.certificate.issuedAt);
    return { status: 'imported' };
  }

  /**
   * Crea una llave de edición nueva con la llave maestra. La nueva llave
   * reemplaza a todas las anteriores en este computador, y en los demás a
   * medida que importan paquetes publicados con ella. `saveKeyFile` guarda el
   * nuevo archivo `.psmkey` y devuelve `false` si el usuario canceló; las
   * llaves anteriores solo se reemplazan cuando la nueva quedó guardada, para
   * que una cancelación nunca deje a la escuela sin una llave que funcione.
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

  /** El paquete firmado guardado, listo para copiarlo a otros computadores. */
  async exportPackage(): Promise<string | null> {
    return this.packageStorage.read();
  }

  /** Vuelve al contenido original. Las llaves reemplazadas siguen reemplazadas. */
  async reset(): Promise<void> {
    await this.packageStorage.remove();
  }
}
