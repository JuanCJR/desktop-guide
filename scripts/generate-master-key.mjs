// Script para generar la llave MAESTRA de la escuela. Se ejecuta una sola vez,
// antes de distribuir la aplicación, desde una terminal:
//
//   pnpm content:master-key <output-master-key.pem>
//
// Qué hace:
// - Escribe la llave maestra privada, cifrada con una contraseña, en la ruta
//   indicada. Esa llave debe quedar FUERA del repositorio y lejos del uso
//   diario (por ejemplo, en un pendrive guardado en la Dirección). Solo hace
//   falta para crear una llave de edición nueva desde la app cuando una se
//   pierde o la roban.
// - Escribe la llave maestra pública en src/main/content/public-key.ts. Ese
//   archivo sí se guarda en el repositorio, y al generar el instalador cada
//   copia de la app confía en él.
//
// Las llaves de edición (las que se usan para editar el manual) se crean dentro
// de la app, en "Contenido del manual", usando esta llave maestra.
//
// La contraseña se lee de la variable CONTENT_KEY_PASSPHRASE o se pide en la
// terminal.
import { generateKeyPairSync } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';

// Valida la ruta de salida: es obligatoria y nunca se sobrescribe una llave
// existente, para no perder una llave maestra por accidente.
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

// Obtiene la contraseña que protegerá la llave maestra (mínimo 8 caracteres).
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

// Crea el par de llaves (privada + pública) con el algoritmo Ed25519. La
// privada queda cifrada con la contraseña.
const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem', cipher: 'aes-256-cbc', passphrase },
});

// Guarda la llave privada con permisos restringidos (solo el dueño la lee).
writeFileSync(outputPath, privateKey, { mode: 0o600 });

// Reescribe src/main/content/public-key.ts con la llave pública nueva. Nota:
// el comentario de ese archivo generado queda en inglés porque forma parte del
// texto que este script escribe.
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
