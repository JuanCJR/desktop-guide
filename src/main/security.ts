/**
 * Reglas de seguridad de las ventanas de la aplicación.
 *
 * Evita que la interfaz abra páginas de internet dentro de la app o navegue a
 * sitios externos. Los enlaces externos (por ejemplo, a la web del instituto)
 * se abren en el navegador normal del computador.
 *
 * Se usa en `./index.ts` (para cada ventana nueva) y en `./ipc/register.ts`
 * (para comprobar que cada mensaje viene de la propia app).
 */
import { app, shell, type WebContents } from 'electron';

const DEV_SERVER_URL = process.env['ELECTRON_RENDERER_URL'];

/**
 * Indica si una dirección es "de confianza", es decir, si pertenece a la propia
 * app: los archivos empaquetados (file://) o, solo en desarrollo, el servidor
 * local de Vite.
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

/** Solo estos tipos de enlace se pueden abrir fuera de la app (web segura y correo). */
const EXTERNAL_PROTOCOLS = new Set(['https:', 'mailto:']);

// Abre un enlace en el navegador o el correo del sistema, solo si es seguro.
function openExternalSafely(rawUrl: string): void {
  try {
    if (EXTERNAL_PROTOCOLS.has(new URL(rawUrl).protocol)) {
      void shell.openExternal(rawUrl);
    }
  } catch {
    // Se ignoran las direcciones mal formadas.
  }
}

/**
 * Aplica las protecciones a cada contenido web que crea la app:
 * - bloquea `window.open` (los enlaces externos se abren en el navegador),
 * - bloquea la navegación fuera de la app,
 * - bloquea la inserción de `<webview>` (páginas incrustadas).
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
