/**
 * "Sobre" estándar con el que todo canal IPC responde a la interfaz: o trae
 * los datos pedidos (`ok: true`) o trae un error con un código (`ok: false`).
 *
 * Por qué existe: los errores lanzados dentro del proceso principal pierden su
 * tipo y sus detalles al cruzar a la interfaz, así que los handlers siempre
 * responden con esta forma en lugar de fallar. Lo usa
 * `src/main/ipc/create-handler.ts` (al responder) y
 * `src/renderer/src/lib/ipc.ts` (al leer la respuesta).
 */
// Tipos de error posibles: datos inválidos, remitente no permitido o fallo interno.
export type IpcErrorCode = 'INVALID_REQUEST' | 'FORBIDDEN' | 'INTERNAL_ERROR';

export interface IpcError {
  code: IpcErrorCode;
  message: string;
}

export type IpcResult<T> = { ok: true; data: T } | { ok: false; error: IpcError };

// Atajos para construir una respuesta correcta o una de error.
export const ipcOk = <T>(data: T): IpcResult<T> => ({ ok: true, data });

export const ipcFail = <T = never>(code: IpcErrorCode, message: string): IpcResult<T> => ({
  ok: false,
  error: { code, message },
});
