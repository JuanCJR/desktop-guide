import { createPrivateKey, createPublicKey, type KeyObject, sign, verify } from 'node:crypto';

import {
  CONTENT_PACKAGE_FORMAT,
  type ContentPackage,
  contentPackageSchema,
  signedMessage,
} from '@shared/content/package';
import { type ManualContent, manualContentSchema } from '@shared/content/schema';

export type OpenPackageResult =
  { ok: true; content: ManualContent; publishedAt: string } | { ok: false; message: string };

export type LoadKeyResult = { ok: true; key: KeyObject } | { ok: false; message: string };

/** Parses the bundled public key; returns `null` if it is missing or invalid. */
export function parsePublicKey(pem: string | null): KeyObject | null {
  if (!pem) return null;
  try {
    const key = createPublicKey(pem);
    return key.asymmetricKeyType === 'ed25519' ? key : null;
  } catch {
    return null;
  }
}

/** Decrypts the school's private key file with its passphrase. */
export function loadPrivateKey(pem: string, passphrase: string): LoadKeyResult {
  try {
    const key = createPrivateKey({ key: pem, format: 'pem', passphrase });
    if (key.asymmetricKeyType !== 'ed25519') {
      return { ok: false, message: 'El archivo no es una llave de la escuela válida.' };
    }
    return { ok: true, key };
  } catch {
    return { ok: false, message: 'La llave o la contraseña no son correctas.' };
  }
}

/** Whether `privateKey` is the counterpart of `publicKey`. */
export function keyPairMatches(privateKey: KeyObject, publicKey: KeyObject): boolean {
  const derived = createPublicKey(privateKey).export({ format: 'der', type: 'spki' });
  const expected = publicKey.export({ format: 'der', type: 'spki' });
  return derived.equals(expected);
}

/** Builds a signed package with the given content. */
export function createPackage(
  content: ManualContent,
  privateKey: KeyObject,
  now: Date = new Date(),
): ContentPackage {
  const publishedAt = now.toISOString();
  const payload = JSON.stringify(content);
  const signature = sign(null, Buffer.from(signedMessage(publishedAt, payload)), privateKey);
  return {
    format: CONTENT_PACKAGE_FORMAT,
    formatVersion: 1,
    publishedAt,
    payload,
    signature: signature.toString('base64'),
  };
}

/** Parses, verifies and validates a raw package file. Never throws. */
export function openPackage(raw: string, publicKey: KeyObject): OpenPackageResult {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, message: 'El archivo no es un paquete de contenido válido.' };
  }

  const envelope = contentPackageSchema.safeParse(json);
  if (!envelope.success) {
    return { ok: false, message: 'El archivo no es un paquete de contenido válido.' };
  }

  const { publishedAt, payload, signature } = envelope.data;
  const authentic = verify(
    null,
    Buffer.from(signedMessage(publishedAt, payload)),
    publicKey,
    Buffer.from(signature, 'base64'),
  );
  if (!authentic) {
    return {
      ok: false,
      message: 'La firma no es válida: este contenido no fue publicado por la escuela.',
    };
  }

  let content: unknown;
  try {
    content = JSON.parse(payload);
  } catch {
    return { ok: false, message: 'El contenido del paquete está dañado.' };
  }
  const parsed = manualContentSchema.safeParse(content);
  if (!parsed.success) {
    return { ok: false, message: 'El paquete fue creado con una versión incompatible.' };
  }
  return { ok: true, content: parsed.data, publishedAt };
}
