import { Save, X } from 'lucide-react';
import type { ReactNode } from 'react';

import { Notice } from '@/components/notice';
import { Button } from '@/components/ui/button';

/** Wrapper of every section editor: title, save/cancel bar and errors. */
export function EditorFrame({
  title,
  saving,
  errors,
  onSave,
  onCancel,
  children,
}: {
  title: string;
  saving: boolean;
  errors: readonly string[];
  onSave: () => void;
  onCancel: () => void;
  children: ReactNode;
}) {
  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <div className="sticky top-0 z-10 -mx-10 flex items-center justify-between gap-4 border-b bg-background/95 px-10 py-3 backdrop-blur">
        <div>
          <p className="text-xs font-semibold tracking-wider text-brand-accent uppercase">
            Editando
          </p>
          <h1 className="text-xl font-bold text-brand">{title}</h1>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            <X />
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            <Save />
            {saving ? 'Guardando…' : 'Guardar y publicar'}
          </Button>
        </div>
      </div>
      {errors.length > 0 && (
        <Notice>
          <p className="font-semibold">Revisa estos campos antes de guardar:</p>
          <ul className="mt-1 list-disc pl-5">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Notice>
      )}
      {children}
    </form>
  );
}
