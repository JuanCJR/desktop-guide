import { z } from 'zod';

/**
 * Trust chain of the manual content:
 *
 * 1. The **master key** is created once (`pnpm content:master-key`). Its
 *    public half is bundled with the app; the private half is kept offline.
 * 2. The master key certifies **editor keys**, created inside the app. An
 *    editor key file (`.psmkey`) holds the encrypted private key and its
 *    certificate.
 * 3. Content packages (`.psm`) are signed with an editor key and carry its
 *    certificate, so any installation can verify them with the master key.
 *
 * A newer editor certificate replaces older ones: installations refuse to
 * import or unlock with a certificate older than the newest one they saw.
 */

export const CONTENT_PACKAGE_FORMAT = 'iupsm-manual-content';
export const CONTENT_PACKAGE_EXTENSION = 'psm';
export const EDITOR_CERTIFICATE_FORMAT = 'iupsm-editor-certificate';
export const EDITOR_KEY_FORMAT = 'iupsm-editor-key';
export const EDITOR_KEY_EXTENSION = 'psmkey';
export const MAX_PACKAGE_BYTES = 2_000_000;
export const MAX_KEY_FILE_BYTES = 20_000;

export const editorCertificateSchema = z.object({
  format: z.literal(EDITOR_CERTIFICATE_FORMAT),
  /** When the master key issued it; newer certificates replace older ones. */
  issuedAt: z.iso.datetime(),
  /** Editor public key, SPKI PEM. */
  publicKey: z.string().min(1).max(1_000),
  /** Base64 master-key signature of `certificateMessage(issuedAt, publicKey)`. */
  signature: z.string().min(1).max(512),
});
export type EditorCertificate = z.infer<typeof editorCertificateSchema>;

export const contentPackageSchema = z.object({
  format: z.literal(CONTENT_PACKAGE_FORMAT),
  formatVersion: z.literal(2),
  publishedAt: z.iso.datetime(),
  /** `JSON.stringify` of the manual content. */
  payload: z.string().min(2).max(MAX_PACKAGE_BYTES),
  certificate: editorCertificateSchema,
  /** Base64 editor-key signature of `packageMessage(publishedAt, payload)`. */
  signature: z.string().min(1).max(512),
});
export type ContentPackage = z.infer<typeof contentPackageSchema>;

export const editorKeyFileSchema = z.object({
  format: z.literal(EDITOR_KEY_FORMAT),
  certificate: editorCertificateSchema,
  /** PKCS#8 PEM encrypted with the editor's passphrase. */
  privateKey: z.string().min(1).max(MAX_KEY_FILE_BYTES),
});
export type EditorKeyFile = z.infer<typeof editorKeyFileSchema>;

/** The exact text covered by a package signature. */
export function packageMessage(publishedAt: string, payload: string): string {
  return `${CONTENT_PACKAGE_FORMAT}\n${publishedAt}\n${payload}`;
}

/** The exact text covered by a certificate signature. */
export function certificateMessage(issuedAt: string, publicKey: string): string {
  return `${EDITOR_CERTIFICATE_FORMAT}\n${issuedAt}\n${publicKey}`;
}
