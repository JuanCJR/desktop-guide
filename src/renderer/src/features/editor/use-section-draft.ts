/**
 * Hook que maneja el "borrador" de un formulario de edición.
 *
 * Mientras se edita una pantalla, los cambios se hacen sobre una copia local
 * (el borrador), sin afectar lo que ven los demás. Al guardar, se publica el
 * manual completo con esa parte cambiada (a través de
 * `@/features/content/content-context.ts`). Lo usan los `*-editor.tsx`.
 */
import { useState } from 'react';

import { useContent } from '@/features/content/content-context';
import type { ManualContent } from '@shared/content/schema';

// Cada una de las partes del manual que se pueden editar (inicio, inscripción…).
export type SectionKey = Exclude<keyof ManualContent, 'schemaVersion'>;

/**
 * Copia local de una parte del manual. `save` valida y publica el manual
 * completo con la parte editada y luego llama a `onSaved`.
 */
export function useSectionDraft<K extends SectionKey>(key: K, onSaved: () => void) {
  const { content, publish } = useContent();
  const [draft, setDraft] = useState<ManualContent[K]>(content[key]);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Guarda: si hay errores de validación se muestran; si no, se cierra el editor.
  async function save() {
    setSaving(true);
    try {
      const issues = await publish({ ...content, [key]: draft });
      setErrors(issues);
      if (issues.length === 0) onSaved();
    } catch (error) {
      setErrors([error instanceof Error ? error.message : String(error)]);
    } finally {
      setSaving(false);
    }
  }

  return { draft, setDraft, errors, saving, save };
}
