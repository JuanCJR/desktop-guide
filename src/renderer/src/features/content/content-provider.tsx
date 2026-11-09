/**
 * Proveedor del contenido del manual: carga el contenido al abrir la app y lo
 * comparte con todas las pantallas (a través de `./content-context.ts`).
 *
 * Aquí está la conexión de la interfaz con el contenido guardado: cada acción
 * (publicar, importar, exportar, restablecer, desbloquear, bloquear, crear
 * llave) le pide el trabajo al proceso principal por IPC (`@/lib/ipc`), y
 * luego actualiza lo que se muestra. Los mensajes que ve el usuario después
 * de cada acción también se definen aquí.
 *
 * Envuelve toda la app en `src/renderer/src/app.tsx`.
 */
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { invoke } from '@/lib/ipc';
import { type ContentState, describeIssues, manualContentSchema } from '@shared/content/schema';

import { ContentContext, type ContentContextValue } from './content-context';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ContentState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Al abrir la app, pide el contenido actual al proceso principal.
  useEffect(() => {
    invoke('content:get')
      .then(setState)
      .catch((error: unknown) => {
        setLoadError(errorMessage(error));
      });
  }, []);

  // Publicar: primero se valida aquí (para mostrar errores en el formulario)
  // y luego el proceso principal lo firma y lo guarda.
  const publish = useCallback<ContentContextValue['publish']>(async (content) => {
    const parsed = manualContentSchema.safeParse(content);
    if (!parsed.success) return describeIssues(parsed.error);
    const result = await invoke('content:publish', parsed.data);
    if (result.status === 'locked') {
      return ['La edición está bloqueada. Vuelve a cargar la llave de la escuela.'];
    }
    setState(result.state);
    return [];
  }, []);

  // Importar / exportar el archivo de contenido para compartirlo entre computadores.
  const importPackage = useCallback<ContentContextValue['importPackage']>(async () => {
    const result = await invoke('content:import');
    if (result.status === 'cancelled') return null;
    if (result.status === 'invalid') return { ok: false, message: result.message };
    setState(result.state);
    return { ok: true, message: 'Contenido actualizado correctamente.' };
  }, []);

  const exportPackage = useCallback<ContentContextValue['exportPackage']>(async () => {
    const result = await invoke('content:export');
    if (result.status === 'cancelled') return null;
    if (result.status === 'nothing-to-export') {
      return {
        ok: false,
        message: 'Todavía no hay contenido publicado. Edita y guarda algún cambio primero.',
      };
    }
    return {
      ok: true,
      message: 'Archivo exportado. Cópialo e impórtalo en las demás computadoras.',
    };
  }, []);

  // Volver al contenido original de la app.
  const reset = useCallback(async () => {
    setState(await invoke('content:reset'));
  }, []);

  // Activar / desactivar el modo edición con la llave de la escuela.
  const unlock = useCallback<ContentContextValue['unlock']>(async (passphrase) => {
    const result = await invoke('editor:unlock', { passphrase });
    if (result.status === 'cancelled') return null;
    if (result.status === 'invalid') return { ok: false, message: result.message };
    setState(result.state);
    return { ok: true, message: 'Edición desbloqueada.' };
  }, []);

  const lock = useCallback(async () => {
    setState(await invoke('editor:lock'));
  }, []);

  // Crear una llave de edición nueva con la llave maestra.
  const createEditorKey = useCallback<ContentContextValue['createEditorKey']>(
    async (masterPassphrase, newPassphrase) => {
      const result = await invoke('editor:create-key', { masterPassphrase, newPassphrase });
      if (result.status === 'cancelled') return null;
      if (result.status === 'invalid') return { ok: false, message: result.message };
      setState(result.state);
      return {
        ok: true,
        message:
          'Llave de edición creada. Ya puedes desbloquear la edición con ella. Si reemplazaste una llave anterior, esa ya no sirve en esta computadora y, en las demás, dejará de servir cuando importen el próximo contenido publicado.',
      };
    },
    [],
  );

  // Mientras el contenido no ha cargado, `value` es `null`.
  const value = useMemo<ContentContextValue | null>(
    () =>
      state && {
        state,
        content: state.content,
        publish,
        importPackage,
        exportPackage,
        reset,
        unlock,
        lock,
        createEditorKey,
      },
    [state, publish, importPackage, exportPackage, reset, unlock, lock, createEditorKey],
  );

  // Mientras carga se muestra "Cargando…"; si falla, se muestra el error.
  if (loadError) {
    return (
      <div role="alert" className="grid min-h-screen place-items-center p-8 text-destructive">
        No se pudo cargar el contenido del manual: {loadError}
      </div>
    );
  }
  if (!value) {
    return (
      <div className="grid min-h-screen place-items-center text-muted-foreground">Cargando…</div>
    );
  }
  return <ContentContext value={value}>{children}</ContentContext>;
}
