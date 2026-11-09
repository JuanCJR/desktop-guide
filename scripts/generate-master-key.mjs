// Generates the school's MASTER key. Run it once, before distributing the app.
//
//   pnpm content:master-key <output-master-key.pem>
//
// - Writes the master private key, encrypted with a passphrase, to the given
//   path. Keep it OUT of the repository and away from day-to-day use (e.g. a
//   sealed USB drive at the Direction). It is only needed to create a new
//   editor key from the app when one is lost or stolen.
// - Writes the master public key to src/main/content/public-key.ts. Commit
//   that file and build the installer so every copy of the app trusts it.
//
// Editor keys (the ones used to edit) are created inside the app, in
// "Contenido del manual", with this master key.
//
// The passphrase is read from CONTENT_KEY_PASSPHRASE or asked interactively.
import { generateKeyPairSync } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';

const output = process.argv[2];
if (!output) {
  console.error('Usage: pnpm content:master-key <output-master-key.pem>');
  process.exit(1);
}
const outputPath = resolve(output);
if (existsSync(outputPath)) {
  console.error(`Refusing to overwrite ${outputPath}.`);
  process.exit(1);
}

let passphrase = process.env.CONTENT_KEY_PASSPHRASE ?? '';
if (!passphrase) {
  const rl = createInterface({ input: stdin, output: stdout });
  passphrase = await rl.question('Passphrase for the master key (min. 8 characters): ');
  rl.close();
}
if (passphrase.length < 8) {
  console.error('The passphrase must have at least 8 characters.');
  process.exit(1);
}

const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem', cipher: 'aes-256-cbc', passphrase },
});

writeFileSync(outputPath, privateKey, { mode: 0o600 });

const publicKeyFile = resolve(import.meta.dirname, '../src/main/content/public-key.ts');
writeFileSync(
  publicKeyFile,
  `/**
 * Public half of the school's master key, which certifies editor keys.
 * Generated with \`pnpm content:master-key\`; replacing it invalidates every
 * editor key and package made with the previous one. The master private key
 * must never be committed.
 */
export const MASTER_PUBLIC_KEY_PEM: string | null = \`${publicKey.trim()}\`;
`,
);

console.info(`Master key written to ${outputPath} (keep it offline, never commit it).`);
console.info(`Master public key written to ${publicKeyFile}. Commit it and rebuild.`);
console.info('Next: open the app > Contenido del manual > Crear llave de edición nueva.');
