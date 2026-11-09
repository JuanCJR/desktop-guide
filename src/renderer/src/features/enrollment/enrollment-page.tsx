import { ArrowLeft, ArrowRight, Check, MapPin, RotateCcw } from 'lucide-react';
import { useState } from 'react';

import { Notice } from '@/components/notice';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { useContent } from '@/features/content/content-context';
import { EditablePage } from '@/features/editor/editable-page';
import { usePersistedSet } from '@/hooks/use-persisted-set';
import { cn } from '@/lib/utils';
import type { EnrollmentStep } from '@shared/content/schema';

import { EnrollmentEditor } from './enrollment-editor';

const isStepDone = (step: EnrollmentStep, checked: ReadonlySet<string>) =>
  step.tasks.every((task) => checked.has(task.id));

export function EnrollmentPage() {
  const { enrollment } = useContent().content;
  const { steps } = enrollment;
  const { values: checked, toggle, clear } = usePersistedSet('enrollment-checklist');
  const firstPending = steps.findIndex((step) => !isStepDone(step, checked));
  const [selected, setSelected] = useState(firstPending === -1 ? 0 : firstPending);
  const index = Math.min(selected, steps.length - 1);
  const step = steps[index];
  if (!step) return null;

  return (
    <EditablePage editor={(close) => <EnrollmentEditor onClose={close} />}>
      <PageHeader
        title={enrollment.title}
        description={enrollment.intro}
        actions={
          checked.size > 0 && (
            <Button variant="ghost" size="sm" onClick={clear}>
              <RotateCcw />
              Reiniciar progreso
            </Button>
          )
        }
      />

      <ol className="flex rounded-xl border bg-card px-6 py-5">
        {steps.map((item, i) => {
          const done = isStepDone(item, checked);
          const current = i === index;
          return (
            <li key={item.id} className="relative flex-1">
              {i > 0 && (
                <span
                  aria-hidden
                  className={cn(
                    'absolute top-[17px] right-1/2 h-[3px] w-full',
                    done || current ? 'bg-brand-accent' : 'bg-border',
                  )}
                />
              )}
              <button
                type="button"
                onClick={() => {
                  setSelected(i);
                }}
                aria-current={current ? 'step' : undefined}
                className="relative z-10 flex w-full flex-col items-center gap-2 rounded-md text-center text-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <span
                  className={cn(
                    'grid size-9 place-items-center rounded-full border-2 bg-card text-sm font-bold',
                    done && 'border-brand-accent bg-brand-accent text-brand-foreground',
                    !done &&
                      current &&
                      'border-brand-accent text-brand-accent ring-4 ring-brand-soft',
                    !done && !current && 'border-border text-muted-foreground',
                  )}
                >
                  {done ? <Check className="size-4" aria-label="Completado" /> : i + 1}
                </span>
                <span className={cn(current ? 'font-bold text-brand' : 'text-muted-foreground')}>
                  {item.label}
                  <br />
                  <span className="font-normal">{item.caption}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <article className="mt-5 rounded-xl border bg-card p-6">
        <p className="text-xs font-bold tracking-widest text-brand-accent uppercase">
          Paso {index + 1} de {steps.length}
        </p>
        <h2 className="mt-1 text-xl font-semibold text-brand">{step.title}</h2>
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-brand-soft px-2.5 py-1 text-sm font-medium text-brand">
          <MapPin className="size-4" aria-hidden />
          {step.location}
        </p>

        <div className="mt-5 grid gap-6 md:grid-cols-[1fr_16rem]">
          <ul className="space-y-1">
            {step.tasks.map((task) => (
              <li key={task.id}>
                <label className="flex cursor-pointer items-start gap-3 border-b border-dashed py-2.5 text-[15px]">
                  <input
                    type="checkbox"
                    className="mt-0.5 size-[18px] accent-brand-accent"
                    checked={checked.has(task.id)}
                    onChange={() => {
                      toggle(task.id);
                    }}
                  />
                  <span
                    className={cn(checked.has(task.id) && 'text-muted-foreground line-through')}
                  >
                    {task.text}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          {step.bring.length > 0 && (
            <aside className="rounded-lg bg-muted p-4 text-sm">
              <h3 className="mb-2 font-semibold text-brand">Lleva contigo</h3>
              <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                {step.bring.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </aside>
          )}
        </div>

        {step.notice && (
          <Notice className="mt-5">
            <strong>Importante:</strong> {step.notice}
          </Notice>
        )}

        <div className="mt-6 flex gap-2">
          <Button
            variant="outline"
            disabled={index === 0}
            onClick={() => {
              setSelected(index - 1);
            }}
          >
            <ArrowLeft />
            Paso anterior
          </Button>
          <Button
            disabled={index === steps.length - 1}
            onClick={() => {
              setSelected(index + 1);
            }}
          >
            Siguiente paso
            <ArrowRight />
          </Button>
        </div>
      </article>
      <p className="mt-3 text-xs text-muted-foreground">
        Las casillas que marques se recuerdan solo en esta computadora.
      </p>
    </EditablePage>
  );
}
