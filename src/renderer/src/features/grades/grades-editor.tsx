/**
 * Formulario de edición de la pantalla "Consulta de notas".
 *
 * Aparece al pulsar "Editar esta página" en modo edición (ver
 * `./grades-page.tsx`). Trabaja sobre un borrador de la parte `grades` del manual
 * (`@/features/editor/use-section-draft.ts`) y, al guardar, publica el
 * manual completo. Los campos reutilizables vienen de `@/features/editor/`;
 * los límites de cada campo están en `src/shared/content/schema.ts`.
 */
import { ItemCard, StringListField, TextField } from '@/features/editor/fields';
import { EditorFrame } from '@/features/editor/editor-frame';
import { useSectionDraft } from '@/features/editor/use-section-draft';

export function GradesEditor({ onClose }: { onClose: () => void }) {
  const { draft, setDraft, errors, saving, save } = useSectionDraft('grades', onClose);
  const field = (key: 'title' | 'intro' | 'location' | 'username' | 'password' | 'note') => ({
    value: draft[key],
    onChange: (value: string) => {
      setDraft({ ...draft, [key]: value });
    },
  });

  return (
    <EditorFrame
      title="Consulta de notas"
      saving={saving}
      errors={errors}
      onSave={() => void save()}
      onCancel={onClose}
    >
      <ItemCard title="Información">
        <TextField label="Título" {...field('title')} />
        <TextField label="Introducción" multiline {...field('intro')} />
        <div className="grid gap-4 md:grid-cols-3">
          <TextField label="Dónde" {...field('location')} />
          <TextField label="Usuario" {...field('username')} />
          <TextField label="Contraseña" {...field('password')} />
        </div>
      </ItemCard>
      <ItemCard title="Paso a paso">
        <StringListField
          label="Pasos"
          values={draft.steps}
          addLabel="Agregar paso"
          onChange={(steps) => {
            setDraft({ ...draft, steps });
          }}
        />
      </ItemCard>
      <ItemCard title="Nota final">
        <TextField label="Nota" multiline hint="Déjala vacía para ocultarla." {...field('note')} />
      </ItemCard>
    </EditorFrame>
  );
}
