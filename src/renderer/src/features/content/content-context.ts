/**
 * "Contexto" del contenido del manual: la forma de compartir el contenido y
 * sus acciones (publicar, importar, exportar, desbloquear…) con todas las
 * pantallas sin tener que pasarlo de componente en componente.
 *
 * El valor lo llena `./content-provider.tsx`; las pantallas lo leen con
 * `useContent()`.
 */
import { createContext, useContext } from 'react';

import type { ContentState, ManualContent } from '@shared/content/schema';

// Resultado de una acción, con el mensaje que se le muestra al usuario.
export type ActionResult = { ok: true; message: string } | { ok: false; message: string };

export interface ContentContextValue {
  state: ContentState;
  content: ManualContent;
  /** Valida, firma y guarda todo el manual. Devuelve los errores de validación, si los hay. */
  publish: (content: ManualContent) => Promise<string[]>;
  importPackage: () => Promise<ActionResult | null>;
  exportPackage: () => Promise<ActionResult | null>;
  reset: () => Promise<void>;
  unlock: (passphrase: string) => Promise<ActionResult | null>;
  lock: () => Promise<void>;
  /** Crea una llave de edición nueva con la llave maestra y reemplaza las anteriores. */
  createEditorKey: (
    masterPassphrase: string,
    newPassphrase: string,
  ) => Promise<ActionResult | null>;
}

export const ContentContext = createContext<ContentContextValue | null>(null);

// Lo que usan las pantallas para leer el contenido y llamar a las acciones.
export function useContent(): ContentContextValue {
  const value = useContext(ContentContext);
  if (!value) throw new Error('useContent must be used inside <ContentProvider>.');
  return value;
}
