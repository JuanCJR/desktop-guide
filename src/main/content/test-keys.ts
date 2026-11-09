/**
 * Utilidades solo para los tests: crean llaves maestras y de edición de prueba
 * para comprobar el sistema de firmas sin usar las llaves reales de la escuela.
 * La app no usa este archivo; lo usan los archivos `*.test.ts` de esta carpeta.
 */
import { generateKeyPairSync, type KeyObject } from 'node:crypto';

import { createEditorKeyFile, openEditorKeyFile } from './signing';

/** Para tests: un par de llaves maestras y su versión cifrada (PEM). */
export function createMasterKey(passphrase = 'maestra-47') {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const pem = privateKey
    .export({ type: 'pkcs8', format: 'pem', cipher: 'aes-256-cbc', passphrase })
    .toString();
  return { publicKey, privateKey, pem, passphrase };
}

/** Para tests: un archivo de llave de edición certificado por `masterPrivateKey`. */
export function createEditorKey(
  masterPrivateKey: KeyObject,
  masterPublicKey: KeyObject,
  issuedAt: string,
  passphrase = 'edicion-47',
) {
  const { fileText, certificate } = createEditorKeyFile(
    masterPrivateKey,
    passphrase,
    new Date(issuedAt),
  );
  const opened = openEditorKeyFile(fileText, passphrase, masterPublicKey);
  if (!opened.ok) throw new Error(opened.message);
  return { fileText, certificate, key: opened.key, passphrase };
}
