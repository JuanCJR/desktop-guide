/**
 * Serializable envelope returned by every IPC handler.
 *
 * Errors thrown inside `ipcMain.handle` lose their type and details when
 * crossing the process boundary, so handlers always resolve with this shape
 * instead of rejecting.
 */
export type IpcErrorCode = 'INVALID_REQUEST' | 'FORBIDDEN' | 'INTERNAL_ERROR';

export interface IpcError {
  code: IpcErrorCode;
  message: string;
}

export type IpcResult<T> = { ok: true; data: T } | { ok: false; error: IpcError };

export const ipcOk = <T>(data: T): IpcResult<T> => ({ ok: true, data });

export const ipcFail = <T = never>(code: IpcErrorCode, message: string): IpcResult<T> => ({
  ok: false,
  error: { code, message },
});
