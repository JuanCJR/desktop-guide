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

  useEffect(() => {
    invoke('content:get')
      .then(setState)
      .catch((error: unknown) => {
        setLoadError(errorMessage(error));
      });
  }, []);

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

  const reset = useCallback(async () => {
    setState(await invoke('content:reset'));
  }, []);

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
      },
    [state, publish, importPackage, exportPackage, reset, unlock, lock],
  );

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
