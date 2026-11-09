/**
 * Declaración de tipos de `window.api` para la interfaz.
 *
 * Le dice a TypeScript que en la interfaz existe `window.api`, el puente que
 * crea `./index.ts`, con la forma definida en `src/shared/ipc/api.ts`. No
 * contiene código que se ejecute.
 */
import type { DesktopApi } from '../shared/ipc/api';

declare global {
  interface Window {
    readonly api: DesktopApi;
  }
}

export {};
