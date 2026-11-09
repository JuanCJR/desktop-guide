/**
 * Formulario de edición de la pantalla "Calendario del semestre".
 *
 * Aparece al pulsar "Editar esta página" en modo edición (ver
 * `./calendar-page.tsx`). Trabaja sobre un borrador de la parte `teacherCalendar` del manual
 * (`@/features/editor/use-section-draft.ts`) y, al guardar, publica el
 * manual completo. Los campos reutilizables vienen de `@/features/editor/`;
 * los límites de cada campo están en `src/shared/content/schema.ts`.
 * Al guardar se revisa que los porcentajes de los cortes sumen 100%.
 */
import { AddButton, ItemCard, ItemControls, TextField } from '@/features/editor/fields';
import { EditorFrame } from '@/features/editor/editor-frame';
import { NumberField } from '@/features/editor/select-field';
import { useSectionDraft } from '@/features/editor/use-section-draft';
import { moveItem, removeAt, replaceAt } from '@/lib/list';
import { newId } from '@/lib/new-id';
import type { CalendarCut, Milestone } from '@shared/content/schema';

export function CalendarEditor({ onClose }: { onClose: () => void }) {
  const { draft, setDraft, errors, saving, save } = useSectionDraft('teacherCalendar', onClose);
  const { cuts, milestones } = draft;
  const setCuts = (next: CalendarCut[]) => {
    setDraft({ ...draft, cuts: next });
  };
  const setMilestones = (next: Milestone[]) => {
    setDraft({ ...draft, milestones: next });
  };

  return (
    <EditorFrame
      title="Calendario del semestre"
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
        <div className="max-w-48">
          <NumberField
            label="Semanas del semestre"
            min={4}
            max={30}
            value={draft.totalWeeks}
            onChange={(totalWeeks) => {
              setDraft({ ...draft, totalWeeks });
            }}
          />
        </div>
      </ItemCard>

      {/* Cortes de evaluación: nombre, porcentaje y semanas que abarcan. */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-brand">Cortes</h2>
        {cuts.map((cut, index) => {
          const update = (patch: Partial<CalendarCut>) => {
            setCuts(replaceAt(cuts, index, { ...cut, ...patch }));
          };
          return (
            <ItemCard
              key={cut.id}
              title={cut.name || `Corte ${index + 1}`}
              controls={
                <ItemControls
                  index={index}
                  count={cuts.length}
                  canRemove={cuts.length > 1}
                  onMove={(delta) => {
                    setCuts(moveItem(cuts, index, delta));
                  }}
                  onRemove={() => {
                    setCuts(removeAt(cuts, index));
                  }}
                />
              }
            >
              <div className="grid gap-4 md:grid-cols-4">
                <TextField
                  label="Nombre"
                  value={cut.name}
                  onChange={(name) => {
                    update({ name });
                  }}
                />
                <NumberField
                  label="Porcentaje (%)"
                  min={0}
                  max={100}
                  value={cut.percent}
                  onChange={(percent) => {
                    update({ percent });
                  }}
                />
                <NumberField
                  label="Desde la semana"
                  min={1}
                  max={30}
                  fallback={1}
                  value={cut.fromWeek}
                  onChange={(fromWeek) => {
                    update({ fromWeek });
                  }}
                />
                <NumberField
                  label="Hasta la semana"
                  min={1}
                  max={30}
                  fallback={1}
                  value={cut.toWeek}
                  onChange={(toWeek) => {
                    update({ toWeek });
                  }}
                />
              </div>
            </ItemCard>
          );
        })}
        <AddButton
          onClick={() => {
            setCuts([
              ...cuts,
              { id: newId('cut'), name: '', percent: 0, fromWeek: 1, toWeek: draft.totalWeeks },
            ]);
          }}
        >
          Agregar corte
        </AddButton>
      </section>

      {/* Fechas clave del semestre (entregas, actividades). */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-brand">Entregas y actividades</h2>
        <p className="text-sm text-muted-foreground">Usa la semana 0 para «antes de iniciar».</p>
        {milestones.map((milestone, index) => {
          const update = (patch: Partial<Milestone>) => {
            setMilestones(replaceAt(milestones, index, { ...milestone, ...patch }));
          };
          return (
            <ItemCard
              key={milestone.id}
              title={milestone.title || `Actividad ${index + 1}`}
              controls={
                <ItemControls
                  index={index}
                  count={milestones.length}
                  onMove={(delta) => {
                    setMilestones(moveItem(milestones, index, delta));
                  }}
                  onRemove={() => {
                    setMilestones(removeAt(milestones, index));
                  }}
                />
              }
            >
              <div className="grid gap-4 md:grid-cols-[8rem_1fr]">
                <NumberField
                  label="Semana"
                  min={0}
                  max={30}
                  value={milestone.week}
                  onChange={(week) => {
                    update({ week });
                  }}
                />
                <TextField
                  label="Título"
                  value={milestone.title}
                  onChange={(title) => {
                    update({ title });
                  }}
                />
              </div>
              <TextField
                label="Descripción"
                multiline
                value={milestone.description}
                onChange={(description) => {
                  update({ description });
                }}
              />
            </ItemCard>
          );
        })}
        <AddButton
          onClick={() => {
            setMilestones([
              ...milestones,
              { id: newId('milestone'), week: 1, title: '', description: '' },
            ]);
          }}
        >
          Agregar actividad
        </AddButton>
      </section>
    </EditorFrame>
  );
}
