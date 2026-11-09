import { Pencil } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useContent } from '@/features/content/content-context';

/**
 * Shows the page normally; when the school key is loaded it adds an
 * "Editar esta página" bar that swaps the view for its editor.
 */
export function EditablePage({
  children,
  editor,
}: {
  children: ReactNode;
  editor: (close: () => void) => ReactNode;
}) {
  const { state } = useContent();
  const [editing, setEditing] = useState(false);
  const close = () => {
    setEditing(false);
  };

  if (editing && state.editorUnlocked) return editor(close);

  return (
    <>
      {state.editorUnlocked && (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-dashed border-brand-accent bg-brand-soft px-4 py-2.5 text-sm text-brand">
          <span>Modo edición activo: puedes cambiar el contenido de esta página.</span>
          <Button
            size="sm"
            onClick={() => {
              setEditing(true);
            }}
          >
            <Pencil />
            Editar esta página
          </Button>
        </div>
      )}
      {children}
    </>
  );
}
