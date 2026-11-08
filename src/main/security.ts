import { app, shell, type WebContents } from 'electron';

const DEV_SERVER_URL = process.env['ELECTRON_RENDERER_URL'];

/**
 * A URL is trusted when it is the packaged renderer (file://) or, during
 * development only, the Vite dev server.
 */
export function isTrustedUrl(rawUrl: string): boolean {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }

  if (url.protocol === 'file:') return true;

  if (!app.isPackaged && DEV_SERVER_URL) {
    return url.origin === new URL(DEV_SERVER_URL).origin;
  }

  return false;
}

/** Only these schemes may be handed to the OS via `shell.openExternal`. */
const EXTERNAL_PROTOCOLS = new Set(['https:', 'mailto:']);

function openExternalSafely(rawUrl: string): void {
  try {
    if (EXTERNAL_PROTOCOLS.has(new URL(rawUrl).protocol)) {
      void shell.openExternal(rawUrl);
    }
  } catch {
    // Ignore malformed URLs.
  }
}

/**
 * Hardens every WebContents created by the app:
 * - blocks `window.open` (external links are opened in the OS browser),
 * - blocks navigation away from the app,
 * - blocks `<webview>` attachment.
 */
export function hardenWebContents(contents: WebContents): void {
  contents.setWindowOpenHandler(({ url }) => {
    openExternalSafely(url);
    return { action: 'deny' };
  });

  contents.on('will-navigate', (event, url) => {
    if (!isTrustedUrl(url)) event.preventDefault();
  });

  contents.on('will-attach-webview', (event) => {
    event.preventDefault();
  });
}
