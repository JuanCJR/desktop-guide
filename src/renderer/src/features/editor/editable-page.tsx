/**
 * Envoltorio que hace "editable" una pantalla.
 *
 * Normalmente solo muestra la pantalla. Cuando el modo edición está activo
 * (se cargó la llave de la escuela), agrega arriba una barra con el botón
 * "Editar esta página", que cambia la vista por el formulario de edición de
 * esa pantalla. Lo usan las pantallas de `src/renderer/src/features/`.
 */
import { Pencil } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useContent } from '@/features/content/content-context';

/**
 * Muestra la pantalla normal; con la llave de la escuela cargada agrega una
 * barra "Editar esta página" que cambia la vista por su formulario de edición.
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
