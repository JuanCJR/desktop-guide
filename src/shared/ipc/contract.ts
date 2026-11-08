import { z } from 'zod';

import type { IpcChannel } from './channels';

/**
 * Request/response schemas for every IPC channel.
 *
 * The main process validates every incoming request against `request` and
 * every outgoing payload against `response`, so the renderer is never
 * trusted blindly. Adding a channel here (and in `channels.ts`) is a
 * compile-time requirement enforced by `satisfies`.
 */
export const ipcContract = {
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
} as const satisfies Record<IpcChannel, { request: z.ZodType; response: z.ZodType }>;

export type IpcContract = typeof ipcContract;

/** What the renderer must send for a channel. */
export type IpcRequest<C extends IpcChannel> = z.input<IpcContract[C]['request']>;

/** What the renderer receives for a channel. */
export type IpcResponse<C extends IpcChannel> = z.output<IpcContract[C]['response']>;
