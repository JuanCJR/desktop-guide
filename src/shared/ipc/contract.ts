import { z } from 'zod';

import { contentStateSchema, manualContentSchema } from '../content/schema';
import type { IpcChannel } from './channels';

const invalidResult = z.object({ status: z.literal('invalid'), message: z.string() });
const cancelledResult = z.object({ status: z.literal('cancelled') });

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
} as const satisfies Record<IpcChannel, { request: z.ZodType; response: z.ZodType }>;

export type IpcContract = typeof ipcContract;

/** What the renderer must send for a channel. */
export type IpcRequest<C extends IpcChannel> = z.input<IpcContract[C]['request']>;

/** What the renderer receives for a channel. */
export type IpcResponse<C extends IpcChannel> = z.output<IpcContract[C]['response']>;
