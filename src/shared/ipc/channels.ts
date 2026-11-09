/**
 * Lista oficial de todos los canales de comunicación (IPC) de la app.
 *
 * Un canal es como una "ventanilla" con nombre por la que la interfaz le pide
 * algo al proceso principal (por ejemplo, `content:get` = "dame el contenido
 * del manual"). Solo existen los canales de esta lista: el preload
 * (`src/preload/index.ts`) rechaza cualquier otro.
 *
 * Para agregar un canal nuevo, se agrega aquí, luego su contrato en
 * `./contract.ts` y su handler en `src/main/ipc/register.ts` (ver CLAUDE.md).
 *
 * No depende de ninguna librería, para que el preload (que corre en un entorno
 * restringido) pueda importarlo sin cargar Zod.
 */
export const IPC_CHANNELS = [
  'app:get-info',
  'app:ping',
  'content:get',
  'content:publish',
  'content:import',
  'content:export',
  'content:reset',
  'editor:unlock',
  'editor:lock',
  'editor:create-key',
] as const;

export type IpcChannel = (typeof IPC_CHANNELS)[number];

/** Indica si un valor es el nombre de un canal permitido. */
export function isIpcChannel(value: unknown): value is IpcChannel {
  return typeof value === 'string' && (IPC_CHANNELS as readonly string[]).includes(value);
}
