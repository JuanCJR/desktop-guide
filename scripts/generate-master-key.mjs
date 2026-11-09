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
// La contraseña se lee de la variable CONTENT_KEY_PASSPHRASE o se pide dos
// veces en la terminal, sin mostrarla en pantalla.
import { generateKeyPairSync } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';

// Largo mínimo obligatorio y largo recomendado de la contraseña.
const MIN_LENGTH = 8;
const RECOMMENDED_LENGTH = 12;
// Carpeta raíz del proyecto: la llave privada nunca debe quedar dentro de ella.
const repoRoot = resolve(import.meta.dirname, '..');

/** Lector de líneas compartido por todas las preguntas cuando la entrada no es una terminal. */
let pipedLines = null;

/** Lee una línea de la terminal sin mostrar lo que se escribe. */
async function askHidden(prompt) {
  if (!stdin.isTTY) {
    // No es una terminal (por ejemplo, entrada por tubería): lee la siguiente línea tal cual.
    stdout.write(prompt);
    pipedLines ??= createInterface({ input: stdin, terminal: false })[Symbol.asyncIterator]();
    const { value } = await pipedLines.next();
    stdout.write('\n');
    return value ?? '';
  }
  // Terminal real: lee tecla por tecla sin mostrarlas. Enter termina, Ctrl+C
  // cancela y Retroceso borra el último carácter.
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

// Valida la ruta de salida: es obligatoria, no puede estar dentro del
// repositorio (para no subirla por accidente) y nunca se sobrescribe una llave
// existente, para no perder una llave maestra.
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
  // En WSL o Linux, una ruta como "E:/llave.pem" no es la unidad E: de
  // Windows sino una carpeta relativa; se sugiere la ruta correcta.
  const windowsDrive = /^([A-Za-z]):[\\/]/.exec(output);
  if (windowsDrive && process.platform !== 'win32') {
    const drive = windowsDrive[1].toLowerCase();
    console.error(
      `Tip: in WSL the Windows drive ${windowsDrive[1]}: is /mnt/${drive}/, ` +
        `e.g. /mnt/${drive}/${output.slice(3)}`,
    );
  }
  process.exit(1);
}
if (existsSync(outputPath)) {
  console.error(`Refusing to overwrite ${outputPath}.`);
  process.exit(1);
}

// Obtiene la contraseña que protegerá la llave maestra. Se pide dos veces para
// evitar errores de tipeo: si no coinciden, no se escribe nada.
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

// Crea el par de llaves (privada + pública) con el algoritmo Ed25519. La
// privada queda cifrada con la contraseña.
const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem', cipher: 'aes-256-cbc', passphrase },
});

// Guarda la llave privada con permisos restringidos (solo el dueño la lee).
writeFileSync(outputPath, privateKey, { mode: 0o600 });

// Reescribe src/main/content/public-key.ts con la llave pública nueva, con el
// mismo comentario explicativo que ya tiene ese archivo.
const publicKeyFile = resolve(import.meta.dirname, '../src/main/content/public-key.ts');
writeFileSync(
  publicKeyFile,
  `/**
 * Mitad pública de la llave maestra de la escuela, que certifica las llaves de
 * edición. La usa \`../ipc/register.ts\` para que la app pueda comprobar que el
 * contenido y las llaves fueron creados por la escuela.
 *
 * Se genera con \`pnpm content:master-key\` (ver
 * \`scripts/generate-master-key.mjs\`); reemplazarla invalida todas las llaves de
 * edición y paquetes de contenido creados con la anterior. La llave maestra
 * privada nunca debe guardarse en el repositorio.
 */
export const MASTER_PUBLIC_KEY_PEM: string | null = \`${publicKey.trim()}\`;
`,
);

console.info(`Master key written to ${outputPath} (keep it offline, never commit it).`);
console.info(`Master public key written to ${publicKeyFile}. Commit it and rebuild.`);
console.info('Next: open the app > Contenido del manual > Crear llave de edición.');
