/**
 * Pantalla "Calendario del semestre" (menú Docentes).
 *
 * Muestra:
 * - una línea de tiempo con las semanas del semestre, coloreada por cortes de
 *   evaluación; al elegir una semana se ven sus entregas y actividades,
 * - la lista completa de fechas clave de todo el semestre.
 *
 * Los datos salen del contenido del manual (`teacherCalendar`); su formulario
 * de edición está en `./calendar-editor.tsx`.
 */
import { useState } from 'react';

import { PageHeader } from '@/components/page-header';
import { useContent } from '@/features/content/content-context';
import { EditablePage } from '@/features/editor/editable-page';
import { cn } from '@/lib/utils';
import type { Calendar } from '@shared/content/schema';

import { CalendarEditor } from './calendar-editor';

/** Tonos de fondo para distinguir cortes consecutivos (solo colores del tema). */
const CUT_SHADES = ['bg-brand-accent/10', 'bg-brand-accent/20', 'bg-brand-accent/30'];

const weekLabel = (week: number) => (week === 0 ? 'Antes de iniciar' : `Semana ${week}`);

// Indica a qué corte de evaluación pertenece una semana.
function cutIndexOf(calendar: Calendar, week: number): number {
  return calendar.cuts.findIndex((cut) => week >= cut.fromWeek && week <= cut.toWeek);
}

export function CalendarPage() {
  const calendar = useContent().content.teacherCalendar;
  const weeks = Array.from({ length: calendar.totalWeeks + 1 }, (_, week) => week);
  const milestoneWeeks = new Set(calendar.milestones.map((m) => m.week));
  // Semana elegida en la línea de tiempo (empieza en la del primer hito).
  const [selected, setSelected] = useState<number>(calendar.milestones[0]?.week ?? 1);
  const selectedMilestones = calendar.milestones.filter((m) => m.week === selected);
  const grouped = weeks
    .map((week) => ({ week, items: calendar.milestones.filter((m) => m.week === week) }))
    .filter((group) => group.items.length > 0);

  return (
    <EditablePage editor={(close) => <CalendarEditor onClose={close} />}>
      <PageHeader title={calendar.title} description={calendar.intro} />

      {/* Línea de tiempo: una columna por semana, coloreada por corte. */}
      <section className="rounded-xl border bg-card p-6">
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `4.5rem repeat(${calendar.totalWeeks}, minmax(0, 1fr))` }}
        >
          {weeks.map((week) => {
            const cutIndex = cutIndexOf(calendar, week);
            const hasMilestone = milestoneWeeks.has(week);
            return (
              <button
                key={week}
                type="button"
                aria-pressed={selected === week}
                aria-label={`${weekLabel(week)}${hasMilestone ? ', tiene entregas' : ''}`}
                onClick={() => {
                  setSelected(week);
                }}
                className={cn(
                  'h-11 rounded-md text-xs font-semibold transition-shadow outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                  hasMilestone
                    ? 'bg-brand text-brand-foreground'
                    : cn(CUT_SHADES[cutIndex % CUT_SHADES.length] ?? 'bg-muted', 'text-brand'),
                  week === 0 && !hasMilestone && 'bg-muted',
                  selected === week && 'ring-[3px] ring-warning ring-offset-1',
                )}
              >
                {week === 0 ? 'Antes' : week}
              </button>
            );
          })}
        </div>
        <div
          className="mt-2 grid gap-1.5 text-center text-xs font-bold text-brand"
          style={{ gridTemplateColumns: `4.5rem repeat(${calendar.totalWeeks}, minmax(0, 1fr))` }}
        >
          <span />
          {calendar.cuts.map((cut) => (
            <span
              key={cut.id}
              className="border-t-[3px] border-brand-accent pt-1.5"
              style={{ gridColumn: `${cut.fromWeek + 1} / ${cut.toWeek + 2}` }}
            >
              {cut.name} · {cut.percent}%
            </span>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Las semanas en azul oscuro tienen una entrega o actividad.
        </p>
      </section>

      {/* Entregas y actividades de la semana elegida. */}
      <section className="mt-5" aria-live="polite">
        <h2 className="mb-3 text-xs font-bold tracking-widest text-muted-foreground uppercase">
          {weekLabel(selected)}
        </h2>
        {selectedMilestones.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-card p-4 text-sm text-muted-foreground">
            No hay entregas marcadas para esta semana.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {selectedMilestones.map((milestone) => (
              <article
                key={milestone.id}
                className="rounded-xl border border-warning/40 bg-warning-soft p-4"
              >
                <h3 className="font-semibold text-brand">{milestone.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{milestone.description}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Todas las fechas del semestre, agrupadas por semana. */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-brand">Todo el semestre</h2>
        <ol className="space-y-4 border-l-2 border-brand-soft pl-5">
          {grouped.map((group) => (
            <li key={group.week}>
              <p className="text-xs font-bold tracking-widest text-brand-accent uppercase">
                {weekLabel(group.week)}
              </p>
              <ul className="mt-1 space-y-1.5">
                {group.items.map((milestone) => (
                  <li key={milestone.id} className="text-[15px]">
                    <span className="font-semibold">{milestone.title}.</span>{' '}
                    <span className="text-muted-foreground">{milestone.description}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>
    </EditablePage>
  );
}
