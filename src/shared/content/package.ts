import { z } from 'zod';

/**
 * Envelope of a signed content package (`.psm` file). The school signs
 * `publishedAt` + `payload` with its private key; every installation verifies
 * the signature with the bundled public key before accepting the content.
 */
export const CONTENT_PACKAGE_FORMAT = 'iupsm-manual-content';
export const CONTENT_PACKAGE_EXTENSION = 'psm';
export const MAX_PACKAGE_BYTES = 2_000_000;

export const contentPackageSchema = z.object({
  format: z.literal(CONTENT_PACKAGE_FORMAT),
  formatVersion: z.literal(1),
  publishedAt: z.iso.datetime(),
  /** `JSON.stringify` of the manual content. */
  payload: z.string().min(2).max(MAX_PACKAGE_BYTES),
  /** Base64 Ed25519 signature of `signedMessage(publishedAt, payload)`. */
  signature: z.string().min(1).max(512),
});

export type ContentPackage = z.infer<typeof contentPackageSchema>;

/** The exact bytes covered by the signature. */
export function signedMessage(publishedAt: string, payload: string): string {
  return `${CONTENT_PACKAGE_FORMAT}\n${publishedAt}\n${payload}`;
}
