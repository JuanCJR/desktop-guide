import { useCallback, useState } from 'react';

import { readStringSet, toggleInSet, writeStringSet } from '@/lib/persisted-set';

function getStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** A set of strings remembered on this computer (e.g. checked tasks). */
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
