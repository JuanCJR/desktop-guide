import { generateKeyPairSync, type KeyObject } from 'node:crypto';

import { createEditorKeyFile, openEditorKeyFile } from './signing';

/** Test helper: a master key pair and its encrypted PEM. */
export function createMasterKey(passphrase = 'maestra-47') {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const pem = privateKey
    .export({ type: 'pkcs8', format: 'pem', cipher: 'aes-256-cbc', passphrase })
    .toString();
  return { publicKey, privateKey, pem, passphrase };
}

/** Test helper: an editor key file certified by `masterPrivateKey`. */
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
