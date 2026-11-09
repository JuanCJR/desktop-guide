/**
 * Contrato de la comunicación (IPC) entre la interfaz y el proceso principal.
 *
 * Para cada canal de `./channels.ts` se define qué datos debe enviar la
 * interfaz (`request`) y qué datos recibe de vuelta (`response`). Las reglas se
 * escriben con Zod, una librería que comprueba que los datos tengan la forma
 * esperada (por ejemplo, "un texto de 1 a 200 caracteres").
 *
 * El proceso principal (`src/main/ipc/create-handler.ts`) usa este contrato
 * para validar cada mensaje, así que nunca confía a ciegas en lo que llega.
 */
import { z } from 'zod';

import { contentStateSchema, manualContentSchema } from '../content/schema';
import type { IpcChannel } from './channels';

// Respuestas comunes: "datos no válidos" (con un mensaje) y "el usuario canceló".
const invalidResult = z.object({ status: z.literal('invalid'), message: z.string() });
const cancelledResult = z.object({ status: z.literal('cancelled') });

/**
 * Esquemas de petición y respuesta de cada canal IPC.
 *
 * El proceso principal valida cada petición que llega contra `request` y cada
 * respuesta que sale contra `response`. Si se agrega un canal a `channels.ts`
 * y falta aquí, la compilación falla (lo obliga el `satisfies` del final).
 */
export const ipcContract = {
  // Información general de la app y canal de prueba.
  'app:get-info': {
    request: z.undefined(),
    response: z.object({
      name: z.string(),
      version: z.string(),
      platform: z.string(),
      versions: z.object({
        electron: z.string(),
        chrome: z.string(),
        node: z.string(),
      }),
    }),
  },
  'app:ping': {
    request: z.object({
      message: z.string().trim().min(1).max(200),
    }),
    response: z.object({
      reply: z.string(),
      receivedAt: z.iso.datetime(),
    }),
  },
  // Contenido del manual: leer, publicar, importar, exportar y restablecer.
  'content:get': {
    request: z.undefined(),
    response: contentStateSchema,
  },
  'content:publish': {
    request: manualContentSchema,
    response: z.discriminatedUnion('status', [
      z.object({ status: z.literal('published'), state: contentStateSchema }),
      z.object({ status: z.literal('locked') }),
    ]),
  },
  'content:import': {
    request: z.undefined(),
    response: z.discriminatedUnion('status', [
      z.object({ status: z.literal('imported'), state: contentStateSchema }),
      cancelledResult,
      invalidResult,
    ]),
  },
  'content:export': {
    request: z.undefined(),
    response: z.object({ status: z.enum(['saved', 'cancelled', 'nothing-to-export']) }),
  },
  'content:reset': {
    request: z.undefined(),
    response: contentStateSchema,
  },
  // Modo edición: desbloquear con una llave, bloquear y crear una llave nueva.
  'editor:unlock': {
    request: z.object({ passphrase: z.string().min(1).max(200) }),
    response: z.discriminatedUnion('status', [
      z.object({ status: z.literal('unlocked'), state: contentStateSchema }),
      cancelledResult,
      invalidResult,
    ]),
  },
  'editor:lock': {
    request: z.undefined(),
    response: contentStateSchema,
  },
  'editor:create-key': {
    request: z.object({
      masterPassphrase: z.string().min(1).max(200),
      newPassphrase: z
        .string()
        .min(8, 'La contraseña nueva debe tener al menos 8 caracteres.')
        .max(200),
    }),
    response: z.discriminatedUnion('status', [
      z.object({ status: z.literal('created'), state: contentStateSchema }),
      cancelledResult,
      invalidResult,
    ]),
  },
} as const satisfies Record<IpcChannel, { request: z.ZodType; response: z.ZodType }>;

export type IpcContract = typeof ipcContract;

/** Lo que la interfaz debe enviar por un canal. */
export type IpcRequest<C extends IpcChannel> = z.input<IpcContract[C]['request']>;

/** Lo que la interfaz recibe de vuelta por un canal. */
export type IpcResponse<C extends IpcChannel> = z.output<IpcContract[C]['response']>;
