import { createContext, useContext } from 'react';

import type { ContentState, ManualContent } from '@shared/content/schema';

export type ActionResult = { ok: true; message: string } | { ok: false; message: string };

export interface ContentContextValue {
  state: ContentState;
  content: ManualContent;
  /** Validates, signs and saves the whole manual. Returns validation errors, if any. */
  publish: (content: ManualContent) => Promise<string[]>;
  importPackage: () => Promise<ActionResult | null>;
  exportPackage: () => Promise<ActionResult | null>;
  reset: () => Promise<void>;
  unlock: (passphrase: string) => Promise<ActionResult | null>;
  lock: () => Promise<void>;
  /** Creates a new editor key with the master key, replacing older keys. */
  createEditorKey: (
    masterPassphrase: string,
    newPassphrase: string,
  ) => Promise<ActionResult | null>;
}

export const ContentContext = createContext<ContentContextValue | null>(null);

export function useContent(): ContentContextValue {
  const value = useContext(ContentContext);
  if (!value) throw new Error('useContent must be used inside <ContentProvider>.');
  return value;
}
