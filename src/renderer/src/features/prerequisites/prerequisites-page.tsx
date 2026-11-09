/**
 * Pantalla "Simulador de prelaciones" (menú Estudiantes).
 *
 * El estudiante marca las materias del 1er semestre que reprobó y la pantalla
 * le muestra qué materias del 2º semestre podría inscribir, cuáles quedan
 * bloqueadas (y por qué) y cuántas unidades de crédito suman. El cálculo está
 * en `src/shared/content/prerequisites.ts`. Los datos salen del contenido del
 * manual (`prerequisites`); su formulario de edición está en
 * `./prerequisites-editor.tsx`.
 */
import { CircleAlert, Lock, LockOpen, RotateCcw } from 'lucide-react';
import { useState } from 'react';

import { Notice } from '@/components/notice';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { useContent } from '@/features/content/content-context';
import { EditablePage } from '@/features/editor/editable-page';
import { toggleInSet } from '@/lib/persisted-set';
import { cn } from '@/lib/utils';
import { dependentsOf, evaluatePrerequisites, sumCredits } from '@shared/content/prerequisites';

import { PrerequisitesEditor } from './prerequisites-editor';

// Texto de unidades de crédito (UC) junto al nombre de la materia, si las tiene.
const credits = (value: number | null) => (value === null ? '' : ` · ${value} UC`);

export function PrerequisitesPage() {
  const { prerequisites } = useContent().content;
  const { firstSemester, secondSemester } = prerequisites;
  // Materias marcadas como reprobadas (no se guardan: es solo una simulación).
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set());
  const results = evaluatePrerequisites(firstSemester, secondSemester, failed);
  const availableSubjects = results.filter((r) => r.blockedBy.length === 0).map((r) => r.subject);
  const available = availableSubjects.length;
  const availableCredits = sumCredits(availableSubjects);
  const totalCredits = sumCredits(secondSemester);

  return (
    <EditablePage editor={(close) => <PrerequisitesEditor onClose={close} />}>
      <PageHeader
        title={prerequisites.title}
        description={prerequisites.intro}
        actions={
          failed.size > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFailed(new Set());
              }}
            >
              <RotateCcw />
              Limpiar
            </Button>
          )
        }
      />
      <Notice tone="info">{prerequisites.disclaimer}</Notice>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* Columna izquierda: materias del 1er semestre para marcar las reprobadas. */}
        <section className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold text-brand">1er semestre</h2>
          <p className="mb-3 text-sm text-muted-foreground">Marca las que reprobaste:</p>
          <ul className="space-y-2">
            {firstSemester.map((subject) => {
              const isFailed = failed.has(subject.code);
              const dependents = dependentsOf(subject.code, secondSemester);
              return (
                <li key={subject.code}>
                  <label
                    className={cn(
                      'relative flex cursor-pointer items-center justify-between gap-4 rounded-lg border px-4 py-3 transition-colors',
                      isFailed ? 'border-warning bg-warning-soft' : 'hover:border-brand-accent',
                    )}
                  >
                    <span>
                      <span className="block font-medium">{subject.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {subject.code}
                        {credits(subject.credits)}
                        {dependents.length > 0 && ` · Prela: ${dependents.join(', ')}`}
                      </span>
                    </span>
                    <span className="flex items-center gap-2 text-xs font-semibold">
                      <span className={isFailed ? 'text-warning' : 'text-muted-foreground'}>
                        {isFailed ? 'Reprobada' : 'Aprobada'}
                      </span>
                      <input
                        type="checkbox"
                        role="switch"
                        className="peer sr-only"
                        checked={isFailed}
                        onChange={() => {
                          setFailed(toggleInSet(failed, subject.code));
                        }}
                      />
                      <span
                        aria-hidden
                        className={cn(
                          'relative h-6 w-10 rounded-full transition-colors peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50',
                          isFailed ? 'bg-warning' : 'bg-border',
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-1 size-4 rounded-full bg-card transition-all',
                            isFailed ? 'left-5' : 'left-1',
                          )}
                        />
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Columna derecha: resultado para el 2º semestre (disponibles y bloqueadas). */}
        <section className="rounded-xl border bg-card p-5" aria-live="polite">
          <h2 className="font-semibold text-brand">2º semestre</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Podrías inscribir {available} de {results.length} materias ({availableCredits} de{' '}
            {totalCredits} UC).
          </p>
          <ul className="space-y-2">
            {results.map(({ subject, blockedBy }) => {
              const blocked = blockedBy.length > 0;
              return (
                <li
                  key={subject.code}
                  className={cn(
                    'flex items-center justify-between gap-4 rounded-lg border px-4 py-3',
                    blocked && 'bg-muted',
                  )}
                >
                  <span>
                    <span className={cn('block font-medium', blocked && 'text-muted-foreground')}>
                      {subject.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {blocked
                        ? `Bloqueada por: ${blockedBy.map((s) => s.name).join(', ')}`
                        : `${subject.code}${credits(subject.credits)}${
                            subject.prerequisites.length === 0 ? ' · Sin prelación' : ''
                          }`}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold',
                      blocked ? 'bg-warning-soft text-warning' : 'bg-success-soft text-success',
                    )}
                  >
                    {blocked ? (
                      <Lock className="size-3.5" aria-hidden />
                    ) : (
                      <LockOpen className="size-3.5" aria-hidden />
                    )}
                    {blocked ? 'Bloqueada' : 'Disponible'}
                  </span>
                </li>
              );
            })}
          </ul>
          {failed.size > 0 && (
            <p className="mt-4 flex gap-2 text-sm text-warning-foreground">
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              {prerequisites.failedHint}
            </p>
          )}
        </section>
      </div>
    </EditablePage>
  );
}
