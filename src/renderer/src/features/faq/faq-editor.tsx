/**
 * Formulario de edición de la pantalla "Preguntas frecuentes".
 *
 * Aparece al pulsar "Editar esta página" en modo edición (ver
 * `./faq-page.tsx`). Trabaja sobre un borrador de la parte `faq` del manual
 * (`@/features/editor/use-section-draft.ts`) y, al guardar, publica el
 * manual completo. Los campos reutilizables vienen de `@/features/editor/`;
 * los límites de cada campo están en `src/shared/content/schema.ts`.
 * Permite agregar, quitar y reordenar preguntas y elegir su público.
 */
import { AddButton, ItemCard, ItemControls, TextField } from '@/features/editor/fields';
import { EditorFrame } from '@/features/editor/editor-frame';
import { SelectField } from '@/features/editor/select-field';
import { useSectionDraft } from '@/features/editor/use-section-draft';
import { moveItem, removeAt, replaceAt } from '@/lib/list';
import { newId } from '@/lib/new-id';
import type { Audience, FaqItem } from '@shared/content/schema';

// Opciones de público para cada pregunta.
const AUDIENCE_OPTIONS = [
  ['student', 'Estudiantes'],
  ['teacher', 'Docentes'],
] as const satisfies readonly (readonly [Audience, string])[];

export function FaqEditor({ onClose }: { onClose: () => void }) {
  const { draft, setDraft, errors, saving, save } = useSectionDraft('faq', onClose);
  const { items } = draft;
  const setItems = (next: FaqItem[]) => {
    setDraft({ ...draft, items: next });
  };

  return (
    <EditorFrame
      title="Preguntas frecuentes"
      saving={saving}
      errors={errors}
      onSave={() => void save()}
      onCancel={onClose}
    >
      <ItemCard title="Encabezado">
        <TextField
          label="Título"
          value={draft.title}
          onChange={(title) => {
            setDraft({ ...draft, title });
          }}
        />
        <TextField
          label="Introducción"
          multiline
          value={draft.intro}
          onChange={(intro) => {
            setDraft({ ...draft, intro });
          }}
        />
      </ItemCard>
      {items.map((item, index) => {
        const update = (patch: Partial<FaqItem>) => {
          setItems(replaceAt(items, index, { ...item, ...patch }));
        };
        return (
          <ItemCard
            key={item.id}
            title={`Pregunta ${index + 1}`}
            controls={
              <ItemControls
                index={index}
                count={items.length}
                onMove={(delta) => {
                  setItems(moveItem(items, index, delta));
                }}
                onRemove={() => {
                  setItems(removeAt(items, index));
                }}
              />
            }
          >
            <div className="grid gap-4 md:grid-cols-[1fr_12rem]">
              <TextField
                label="Pregunta"
                value={item.question}
                onChange={(question) => {
                  update({ question });
                }}
              />
              <SelectField
                label="Dirigida a"
                value={item.audience}
                options={AUDIENCE_OPTIONS}
                onChange={(audience) => {
                  update({ audience });
                }}
              />
            </div>
            <TextField
              label="Respuesta"
              multiline
              value={item.answer}
              onChange={(answer) => {
                update({ answer });
              }}
            />
          </ItemCard>
        );
      })}
      <AddButton
        onClick={() => {
          setItems([...items, { id: newId('faq'), audience: 'student', question: '', answer: '' }]);
        }}
      >
        Agregar pregunta
      </AddButton>
    </EditorFrame>
  );
}
