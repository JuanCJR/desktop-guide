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
// The passphrase is read from CONTENT_KEY_PASSPHRASE or asked twice
// interactively, without echoing it on screen.
import { generateKeyPairSync } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';

const MIN_LENGTH = 8;
const RECOMMENDED_LENGTH = 12;
const repoRoot = resolve(import.meta.dirname, '..');

/** Line reader shared by every question when stdin is not a terminal. */
let pipedLines = null;

/** Reads a line from the terminal without showing what is typed. */
async function askHidden(prompt) {
  if (!stdin.isTTY) {
    // Not a terminal (e.g. piped input): read the next line as-is.
    stdout.write(prompt);
    pipedLines ??= createInterface({ input: stdin, terminal: false })[Symbol.asyncIterator]();
    const { value } = await pipedLines.next();
    stdout.write('\n');
    return value ?? '';
  }
  return new Promise((resolvePromise) => {
    let value = '';
    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    const finish = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off('data', onData);
      stdout.write('\n');
    };
    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === '\r' || char === '\n') {
          finish();
          resolvePromise(value);
          return;
        }
        if (char === '\u0003') {
          finish();
          process.exit(130);
        }
        if (char === '\u007f' || char === '\b') {
          value = value.slice(0, -1);
        } else {
          value += char;
        }
      }
    };
    stdin.on('data', onData);
  });
}

const output = process.argv[2];
if (!output) {
  console.error('Usage: pnpm content:master-key <output-master-key.pem>');
  process.exit(1);
}
const outputPath = resolve(output);
const insideRepo = !relative(repoRoot, outputPath).startsWith('..');
if (insideRepo) {
  console.error(
    `Refusing to write the master key inside the repository (${outputPath}). ` +
      'Choose a folder outside it, e.g. a USB drive.',
  );
  process.exit(1);
}
if (existsSync(outputPath)) {
  console.error(`Refusing to overwrite ${outputPath}.`);
  process.exit(1);
}

let passphrase = process.env.CONTENT_KEY_PASSPHRASE ?? '';
if (!passphrase) {
  passphrase = await askHidden(
    `Passphrase for the master key (min. ${MIN_LENGTH}, ${RECOMMENDED_LENGTH}+ recommended): `,
  );
  const confirmation = await askHidden('Repeat the passphrase: ');
  if (confirmation !== passphrase) {
    console.error('The passphrases do not match. Nothing was written.');
    process.exit(1);
  }
  await pipedLines?.return?.();
}
if (passphrase.length < MIN_LENGTH) {
  console.error(`The passphrase must have at least ${MIN_LENGTH} characters.`);
  process.exit(1);
}
if (passphrase.length < RECOMMENDED_LENGTH) {
  console.warn(`Warning: a passphrase of ${RECOMMENDED_LENGTH}+ characters is recommended.`);
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
