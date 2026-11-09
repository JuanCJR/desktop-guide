import { KeyRound, MapPin, UserRound } from 'lucide-react';

import { Notice } from '@/components/notice';
import { PageHeader } from '@/components/page-header';
import { useContent } from '@/features/content/content-context';
import { EditablePage } from '@/features/editor/editable-page';

import { GradesEditor } from './grades-editor';

export function GradesPage() {
  const { grades } = useContent().content;

  return (
    <EditablePage editor={(close) => <GradesEditor onClose={close} />}>
      <PageHeader title={grades.title} description={grades.intro} />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <MapPin className="size-5 text-brand-accent" aria-hidden />
          <p className="mt-3 text-xs font-bold tracking-widest text-muted-foreground uppercase">
            Dónde
          </p>
          <p className="mt-1 font-semibold text-brand">{grades.location}</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <UserRound className="size-5 text-brand-accent" aria-hidden />
          <p className="mt-3 text-xs font-bold tracking-widest text-muted-foreground uppercase">
            Usuario
          </p>
          <p className="mt-1 font-semibold text-brand">{grades.username}</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <KeyRound className="size-5 text-brand-accent" aria-hidden />
          <p className="mt-3 text-xs font-bold tracking-widest text-muted-foreground uppercase">
            Contraseña
          </p>
          <p className="mt-1 font-semibold text-brand">{grades.password}</p>
        </div>
      </div>

      <section className="mt-6 rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold text-brand">Paso a paso</h2>
        <ol className="mt-4 space-y-3">
          {grades.steps.map((step, index) => (
            <li key={index} className="flex gap-3 text-[15px]">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-brand-foreground">
                {index + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {grades.note && (
        <Notice tone="info" className="mt-5">
          {grades.note}
        </Notice>
      )}
    </EditablePage>
  );
}
