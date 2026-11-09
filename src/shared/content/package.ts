/**
 * Formatos de los archivos de contenido (`.psm`) y de llaves de edición
 * (`.psmkey`), y el texto exacto que se firma en cada uno.
 *
 * Las firmas se crean y comprueban en `src/main/content/signing.ts`. Este
 * archivo solo describe la forma de los datos (con Zod, una librería que
 * valida estructuras) para que el proceso principal y la interfaz coincidan.
 */
import { z } from 'zod';

/**
 * Cadena de confianza del contenido del manual:
 *
 * 1. La **llave maestra** se crea una sola vez (`pnpm content:master-key`). Su
 *    mitad pública va incluida en la app; la mitad privada se guarda fuera de
 *    línea (por ejemplo, en un pendrive).
 * 2. La llave maestra certifica las **llaves de edición**, que se crean dentro
 *    de la app. Un archivo de llave de edición (`.psmkey`) contiene la llave
 *    privada cifrada y su certificado.
 * 3. Los paquetes de contenido (`.psm`) se firman con una llave de edición y
 *    llevan su certificado, así cualquier instalación puede verificarlos con
 *    la llave maestra.
 *
 * Un certificado de edición más nuevo reemplaza a los anteriores: cada
 * instalación rechaza importar o desbloquear con un certificado más antiguo
 * que el más nuevo que haya visto.
 */

// Nombres de formato, extensiones de archivo y tamaños máximos permitidos.
export const CONTENT_PACKAGE_FORMAT = 'iupsm-manual-content';
export const CONTENT_PACKAGE_EXTENSION = 'psm';
export const EDITOR_CERTIFICATE_FORMAT = 'iupsm-editor-certificate';
export const EDITOR_KEY_FORMAT = 'iupsm-editor-key';
export const EDITOR_KEY_EXTENSION = 'psmkey';
export const MAX_PACKAGE_BYTES = 2_000_000;
export const MAX_KEY_FILE_BYTES = 20_000;

export const editorCertificateSchema = z.object({
  format: z.literal(EDITOR_CERTIFICATE_FORMAT),
  /** Cuándo lo emitió la llave maestra; los certificados más nuevos reemplazan a los anteriores. */
  issuedAt: z.iso.datetime(),
  /** Llave pública de edición (formato SPKI PEM). */
  publicKey: z.string().min(1).max(1_000),
  /** Firma de la llave maestra (en base64) sobre `certificateMessage(issuedAt, publicKey)`. */
  signature: z.string().min(1).max(512),
});
export type EditorCertificate = z.infer<typeof editorCertificateSchema>;

export const contentPackageSchema = z.object({
  format: z.literal(CONTENT_PACKAGE_FORMAT),
  formatVersion: z.literal(2),
  publishedAt: z.iso.datetime(),
  /** El contenido del manual convertido a texto (`JSON.stringify`). */
  payload: z.string().min(2).max(MAX_PACKAGE_BYTES),
  certificate: editorCertificateSchema,
  /** Firma de la llave de edición (en base64) sobre `packageMessage(publishedAt, payload)`. */
  signature: z.string().min(1).max(512),
});
export type ContentPackage = z.infer<typeof contentPackageSchema>;

export const editorKeyFileSchema = z.object({
  format: z.literal(EDITOR_KEY_FORMAT),
  certificate: editorCertificateSchema,
  /** Llave privada (PKCS#8 PEM) cifrada con la contraseña de quien edita. */
  privateKey: z.string().min(1).max(MAX_KEY_FILE_BYTES),
});
export type EditorKeyFile = z.infer<typeof editorKeyFileSchema>;

/** El texto exacto que cubre la firma de un paquete de contenido. */
export function packageMessage(publishedAt: string, payload: string): string {
  return `${CONTENT_PACKAGE_FORMAT}\n${publishedAt}\n${payload}`;
}

/** El texto exacto que cubre la firma de un certificado. */
export function certificateMessage(issuedAt: string, publicKey: string): string {
  return `${EDITOR_CERTIFICATE_FORMAT}\n${issuedAt}\n${publicKey}`;
}
