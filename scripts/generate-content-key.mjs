// Generates the school's signing key pair for content packages.
//
//   pnpm content:keygen <output-private-key.pem>
//
// - Writes the private key, encrypted with a passphrase, to the given path.
//   Keep it OUT of the repository (e.g. on the school's USB drive).
// - Writes the public key to src/main/content/public-key.ts. Commit that file
//   and rebuild the installer so every copy of the app trusts the new key.
//
// The passphrase is read from CONTENT_KEY_PASSPHRASE or asked interactively.
import { generateKeyPairSync } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';

const output = process.argv[2];
if (!output) {
  console.error('Usage: pnpm content:keygen <output-private-key.pem>');
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
  passphrase = await rl.question('Passphrase for the private key (min. 8 characters): ');
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
 * Public key used to verify signed content packages. Generated with
 * \`pnpm content:keygen\`; replacing it invalidates packages signed with the
 * previous key. The matching private key must never be committed.
 */
export const CONTENT_PUBLIC_KEY_PEM: string | null = \`${publicKey.trim()}\`;
`,
);

console.info(`Private key written to ${outputPath} (keep it safe, never commit it).`);
console.info(`Public key written to ${publicKeyFile}.`);
