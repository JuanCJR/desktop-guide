import {
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  type KeyObject,
  sign,
  verify,
} from 'node:crypto';

import {
  certificateMessage,
  CONTENT_PACKAGE_FORMAT,
  type ContentPackage,
  contentPackageSchema,
  type EditorCertificate,
  editorCertificateSchema,
  EDITOR_KEY_FORMAT,
  editorKeyFileSchema,
  packageMessage,
} from '@shared/content/package';
import { type ManualContent, manualContentSchema } from '@shared/content/schema';

export type OpenPackageResult =
  | { ok: true; content: ManualContent; publishedAt: string; certificate: EditorCertificate }
  | { ok: false; message: string };

export type LoadKeyResult = { ok: true; key: KeyObject } | { ok: false; message: string };

export type OpenEditorKeyResult =
  { ok: true; key: KeyObject; certificate: EditorCertificate } | { ok: false; message: string };

const INVALID_KEY_FILE = 'El archivo no es una llave de edición válida.';
const WRONG_KEY_OR_PASSWORD = 'La llave o la contraseña no son correctas.';

function signText(text: string, key: KeyObject): string {
  return sign(null, Buffer.from(text), key).toString('base64');
}

function verifyText(text: string, signature: string, key: KeyObject): boolean {
  try {
    return verify(null, Buffer.from(text), key, Buffer.from(signature, 'base64'));
  } catch {
    return false;
  }
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

/** Parses a bundled Ed25519 public key; returns `null` if missing or invalid. */
export function parsePublicKey(pem: string | null): KeyObject | null {
  if (!pem) return null;
  try {
    const key = createPublicKey(pem);
    return key.asymmetricKeyType === 'ed25519' ? key : null;
  } catch {
    return null;
  }
}

/** Decrypts an Ed25519 private key PEM with its passphrase. */
export function loadPrivateKey(pem: string, passphrase: string): LoadKeyResult {
  try {
    const key = createPrivateKey({ key: pem, format: 'pem', passphrase });
    if (key.asymmetricKeyType !== 'ed25519') return { ok: false, message: WRONG_KEY_OR_PASSWORD };
    return { ok: true, key };
  } catch {
    return { ok: false, message: WRONG_KEY_OR_PASSWORD };
  }
}

/** Whether `privateKey` is the counterpart of `publicKey`. */
export function keyPairMatches(privateKey: KeyObject, publicKey: KeyObject): boolean {
  const derived = createPublicKey(privateKey).export({ format: 'der', type: 'spki' });
  const expected = publicKey.export({ format: 'der', type: 'spki' });
  return derived.equals(expected);
}

/** Returns the certified editor public key, or `null` if the master did not sign it. */
export function verifyCertificate(
  certificate: EditorCertificate,
  masterPublicKey: KeyObject,
): KeyObject | null {
  const message = certificateMessage(certificate.issuedAt, certificate.publicKey);
  if (!verifyText(message, certificate.signature, masterPublicKey)) return null;
  return parsePublicKey(certificate.publicKey);
}

/**
 * Creates a new editor key certified by the master key. Returns the content
 * of the `.psmkey` file (private key encrypted with `passphrase`).
 */
export function createEditorKeyFile(
  masterPrivateKey: KeyObject,
  passphrase: string,
  now: Date = new Date(),
): { fileText: string; certificate: EditorCertificate } {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const issuedAt = now.toISOString();
  const publicPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
  const certificate = editorCertificateSchema.parse({
    format: 'iupsm-editor-certificate',
    issuedAt,
    publicKey: publicPem,
    signature: signText(certificateMessage(issuedAt, publicPem), masterPrivateKey),
  });
  const encrypted = privateKey
    .export({ type: 'pkcs8', format: 'pem', cipher: 'aes-256-cbc', passphrase })
    .toString();
  const fileText = JSON.stringify(
    { format: EDITOR_KEY_FORMAT, certificate, privateKey: encrypted },
    null,
    2,
  );
  return { fileText, certificate };
}

/** Opens a `.psmkey` file: checks the certificate and decrypts the private key. */
export function openEditorKeyFile(
  raw: string,
  passphrase: string,
  masterPublicKey: KeyObject,
): OpenEditorKeyResult {
  const parsed = editorKeyFileSchema.safeParse(parseJson(raw));
  if (!parsed.success) return { ok: false, message: INVALID_KEY_FILE };

  const { certificate, privateKey } = parsed.data;
  const certifiedKey = verifyCertificate(certificate, masterPublicKey);
  if (!certifiedKey) {
    return { ok: false, message: 'Esta llave no fue creada con la llave maestra de la escuela.' };
  }
  const loaded = loadPrivateKey(privateKey, passphrase);
  if (!loaded.ok) return loaded;
  if (!keyPairMatches(loaded.key, certifiedKey)) return { ok: false, message: INVALID_KEY_FILE };
  return { ok: true, key: loaded.key, certificate };
}

/** Builds a package signed with the editor key. */
export function createPackage(
  content: ManualContent,
  editorKey: KeyObject,
  certificate: EditorCertificate,
  now: Date = new Date(),
): ContentPackage {
  const publishedAt = now.toISOString();
  const payload = JSON.stringify(content);
  return {
    format: CONTENT_PACKAGE_FORMAT,
    formatVersion: 2,
    publishedAt,
    payload,
    certificate,
    signature: signText(packageMessage(publishedAt, payload), editorKey),
  };
}

/** Parses and verifies a raw package (certificate + signature + schema). Never throws. */
export function openPackage(raw: string, masterPublicKey: KeyObject): OpenPackageResult {
  const envelope = contentPackageSchema.safeParse(parseJson(raw));
  if (!envelope.success) {
    return { ok: false, message: 'El archivo no es un paquete de contenido válido.' };
  }

  const { publishedAt, payload, certificate, signature } = envelope.data;
  const editorKey = verifyCertificate(certificate, masterPublicKey);
  if (!editorKey || !verifyText(packageMessage(publishedAt, payload), signature, editorKey)) {
    return {
      ok: false,
      message: 'La firma no es válida: este contenido no fue publicado por la escuela.',
    };
  }

  const content = manualContentSchema.safeParse(parseJson(payload));
  if (!content.success) {
    return { ok: false, message: 'El paquete fue creado con una versión incompatible.' };
  }
  return { ok: true, content: content.data, publishedAt, certificate };
}
