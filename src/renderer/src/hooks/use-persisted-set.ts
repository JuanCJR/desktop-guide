/**
 * Hook de React para recordar en este computador un conjunto de elementos
 * marcados (por ejemplo, las tareas de inscripción ya hechas), aunque se cierre
 * la app. Un "hook" es una función de React que guarda estado en un componente.
 *
 * La lógica de lectura y guardado está en `@/lib/persisted-set.ts`.
 */
import { useCallback, useState } from 'react';

import { readStringSet, toggleInSet, writeStringSet } from '@/lib/persisted-set';

// Almacenamiento local del navegador interno; `null` si no está disponible.
function getStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Un conjunto de textos que se recuerda en este computador (por ejemplo, tareas marcadas). */
export function usePersistedSet(key: string) {
  const [values, setValues] = useState<Set<string>>(() => readStringSet(getStorage(), key));

  const update = useCallback(
    (next: Set<string>) => {
      setValues(next);
      writeStringSet(getStorage(), key, next);
    },
    [key],
  );

  const toggle = useCallback(
    (value: string) => {
      update(toggleInSet(values, value));
    },
    [update, values],
  );

  const clear = useCallback(() => {
    update(new Set());
  }, [update]);

  return { values, toggle, clear };
}
