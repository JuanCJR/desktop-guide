/**
 * Single source of truth for every IPC channel name.
 *
 * Kept free of runtime dependencies so the sandboxed preload script can
 * import it without pulling the schema library into its bundle.
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

export function isIpcChannel(value: unknown): value is IpcChannel {
  return typeof value === 'string' && (IPC_CHANNELS as readonly string[]).includes(value);
}
