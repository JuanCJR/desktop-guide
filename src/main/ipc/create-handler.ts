/**
 * "Envoltorio" de seguridad para cada canal de comunicación (IPC).
 *
 * IPC es el sistema de mensajes entre la interfaz (renderer) y el proceso
 * principal. Cada vez que la interfaz pide algo (por ejemplo, "dame el
 * contenido del manual"), la petición pasa por aquí antes de llegar a su
 * handler (la función que la atiende, en `./handlers/`). Este archivo:
 * 1. Comprueba que el mensaje viene de la propia app.
 * 2. Valida que los datos recibidos tengan la forma esperada (con Zod, según
 *    el contrato de `src/shared/ipc/contract.ts`).
 * 3. Valida también la respuesta y convierte los errores inesperados en un
 *    mensaje genérico, sin filtrar detalles internos.
 *
 * Lo usa `./register.ts` para registrar todos los canales.
 */
import type { IpcMainInvokeEvent } from 'electron';

import type { IpcChannel } from '@shared/ipc/channels';
import { ipcContract, type IpcRequest, type IpcResponse } from '@shared/ipc/contract';
import { ipcFail, ipcOk, type IpcResult } from '@shared/ipc/result';

/** Forma que debe tener la función que atiende un canal concreto. */
export type IpcHandler<C extends IpcChannel> = (
  request: IpcRequest<C>,
  event: IpcMainInvokeEvent,
) => IpcResponse<C> | Promise<IpcResponse<C>>;

export interface CreateHandlerOptions {
  /** Devuelve `true` cuando el mensaje viene de una ventana de confianza de la app. */
  isTrustedSender: (event: IpcMainInvokeEvent) => boolean;
  /** Recibe los errores inesperados; por defecto los escribe con `console.error`. */
  onError?: (channel: IpcChannel, error: unknown) => void;
}

/**
 * Envuelve un handler con la verificación del remitente, la validación de la
 * petición y la respuesta, y el manejo de errores. No importa Electron, así
 * que se puede probar de forma aislada en los tests.
 */
export function createIpcHandler<C extends IpcChannel>(
  channel: C,
  handler: IpcHandler<C>,
  { isTrustedSender, onError = defaultOnError }: CreateHandlerOptions,
): (event: IpcMainInvokeEvent, payload: unknown) => Promise<IpcResult<IpcResponse<C>>> {
  const schema = ipcContract[channel];

  return async (event, payload) => {
    // 1. Rechaza mensajes que no vienen de la propia app.
    if (!isTrustedSender(event)) {
      return ipcFail('FORBIDDEN', `Untrusted sender for "${channel}".`);
    }

    // 2. Rechaza peticiones con datos que no cumplen el contrato.
    const parsed = schema.request.safeParse(payload);
    if (!parsed.success) {
      return ipcFail('INVALID_REQUEST', parsed.error.issues.map((i) => i.message).join('; '));
    }

    // 3. Ejecuta el handler y valida su respuesta; cualquier fallo inesperado
    //    se registra aquí y llega a la interfaz como un error genérico.
    try {
      const result = await handler(parsed.data as IpcRequest<C>, event);
      return ipcOk(schema.response.parse(result) as IpcResponse<C>);
    } catch (error) {
      onError(channel, error);
      return ipcFail('INTERNAL_ERROR', 'Unexpected error while handling the request.');
    }
  };
}

function defaultOnError(channel: IpcChannel, error: unknown): void {
  console.error(`[ipc] ${channel} failed:`, error);
}
