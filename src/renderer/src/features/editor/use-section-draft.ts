import { useState } from 'react';

import { useContent } from '@/features/content/content-context';
import type { ManualContent } from '@shared/content/schema';

export type SectionKey = Exclude<keyof ManualContent, 'schemaVersion'>;

/**
 * Local copy of one section of the manual. `save` validates and publishes the
 * whole manual with the edited section, then calls `onSaved`.
 */
export function useSectionDraft<K extends SectionKey>(key: K, onSaved: () => void) {
  const { content, publish } = useContent();
  const [draft, setDraft] = useState<ManualContent[K]>(content[key]);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

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
