/**
 * Formulario de edición de la pantalla "Simulador de prelaciones".
 *
 * Aparece al pulsar "Editar esta página" en modo edición (ver
 * `./prerequisites-page.tsx`). Trabaja sobre un borrador de la parte `prerequisites` del manual
 * (`@/features/editor/use-section-draft.ts`) y, al guardar, publica el
 * manual completo. Los campos reutilizables vienen de `@/features/editor/`;
 * los límites de cada campo están en `src/shared/content/schema.ts`.
 * Permite editar las materias de cada semestre (código, nombre, créditos) y
 * las prelaciones de las materias del 2º semestre.
 */
import { useId } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AddButton, ItemCard, ItemControls, TextField } from '@/features/editor/fields';
import { EditorFrame } from '@/features/editor/editor-frame';
import { useSectionDraft } from '@/features/editor/use-section-draft';
import { moveItem, removeAt, replaceAt } from '@/lib/list';
import { toggleInSet } from '@/lib/persisted-set';
import type { NextSubject, Subject } from '@shared/content/schema';

// Convierte el texto del campo de créditos en número (vacío = sin créditos).
function parseCredits(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

// Campos comunes de una materia: código, nombre y créditos.
function SubjectFields<T extends Subject>({
  subject,
  onChange,
}: {
  subject: T;
  onChange: (subject: T) => void;
}) {
  const id = useId();
  return (
    <div className="grid gap-4 md:grid-cols-[10rem_1fr_7rem]">
      <TextField
        label="Código"
        value={subject.code}
        onChange={(code) => {
          onChange({ ...subject, code });
        }}
      />
      <TextField
        label="Nombre"
        value={subject.name}
        onChange={(name) => {
          onChange({ ...subject, name });
        }}
      />
      <div className="space-y-1.5">
        <Label htmlFor={id}>U.C.</Label>
        <Input
          id={id}
          type="number"
          min={1}
          max={12}
          value={subject.credits ?? ''}
          placeholder="—"
          onChange={(e) => {
            onChange({ ...subject, credits: parseCredits(e.target.value) });
          }}
        />
      </div>
    </div>
  );
}

export function PrerequisitesEditor({ onClose }: { onClose: () => void }) {
  const { draft, setDraft, errors, saving, save } = useSectionDraft('prerequisites', onClose);
  const { firstSemester, secondSemester } = draft;
  const setFirst = (next: Subject[]) => {
    setDraft({ ...draft, firstSemester: next });
  };
  const setSecond = (next: NextSubject[]) => {
    setDraft({ ...draft, secondSemester: next });
  };
  const text = (key: 'title' | 'intro' | 'disclaimer' | 'failedHint') => ({
    value: draft[key],
    onChange: (value: string) => {
      setDraft({ ...draft, [key]: value });
    },
  });

  return (
    <EditorFrame
      title="Simulador de prelaciones"
      saving={saving}
      errors={errors}
      onSave={() => void save()}
      onCancel={onClose}
    >
      <ItemCard title="Textos">
        <TextField label="Título" {...text('title')} />
        <TextField label="Introducción" multiline {...text('intro')} />
        <TextField label="Aclaración del simulacro" multiline {...text('disclaimer')} />
        <TextField label="Consejo cuando se reprueba" multiline {...text('failedHint')} />
      </ItemCard>

      {/* Materias del 1er semestre. */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-brand">Materias de 1er semestre</h2>
        {firstSemester.map((subject, index) => (
          <ItemCard
            key={index}
            title={subject.name || `Materia ${index + 1}`}
            controls={
              <ItemControls
                index={index}
                count={firstSemester.length}
                canRemove={firstSemester.length > 1}
                onMove={(delta) => {
                  setFirst(moveItem(firstSemester, index, delta));
                }}
                onRemove={() => {
                  setFirst(removeAt(firstSemester, index));
                }}
              />
            }
          >
            <SubjectFields
              subject={subject}
              onChange={(next) => {
                setFirst(replaceAt(firstSemester, index, next));
              }}
            />
          </ItemCard>
        ))}
        <AddButton
          onClick={() => {
            setFirst([...firstSemester, { code: '', name: '', credits: null }]);
          }}
        >
          Agregar materia de 1er semestre
        </AddButton>
      </section>

      {/* Materias del 2º semestre, cada una con sus prelaciones. */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-brand">Materias de 2º semestre</h2>
        {secondSemester.map((subject, index) => (
          <ItemCard
            key={index}
            title={subject.name || `Materia ${index + 1}`}
            controls={
              <ItemControls
                index={index}
                count={secondSemester.length}
                canRemove={secondSemester.length > 1}
                onMove={(delta) => {
                  setSecond(moveItem(secondSemester, index, delta));
                }}
                onRemove={() => {
                  setSecond(removeAt(secondSemester, index));
                }}
              />
            }
          >
            <SubjectFields
              subject={subject}
              onChange={(next) => {
                setSecond(replaceAt(secondSemester, index, next));
              }}
            />
            <fieldset>
              <legend className="mb-2 text-sm font-medium">
                Prelada por (reprobar cualquiera la bloquea)
              </legend>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {firstSemester.map((first) => (
                  <label key={first.code} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 accent-brand-accent"
                      checked={subject.prerequisites.includes(first.code)}
                      onChange={() => {
                        const next = toggleInSet(new Set(subject.prerequisites), first.code);
                        setSecond(
                          replaceAt(secondSemester, index, {
                            ...subject,
                            prerequisites: firstSemester
                              .map((s) => s.code)
                              .filter((code) => next.has(code)),
                          }),
                        );
                      }}
                    />
                    {first.name || first.code}
                  </label>
                ))}
              </div>
            </fieldset>
          </ItemCard>
        ))}
        <AddButton
          onClick={() => {
            setSecond([
              ...secondSemester,
              { code: '', name: '', credits: null, prerequisites: [] },
            ]);
          }}
        >
          Agregar materia de 2º semestre
        </AddButton>
      </section>
    </EditorFrame>
  );
}
