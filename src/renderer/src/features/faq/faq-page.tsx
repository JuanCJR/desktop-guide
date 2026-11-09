import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { AudienceTag } from '@/components/audience-tag';
import { PageHeader } from '@/components/page-header';
import { useContent } from '@/features/content/content-context';
import { EditablePage } from '@/features/editor/editable-page';
import { cn } from '@/lib/utils';
import type { Audience } from '@shared/content/schema';

import { FaqEditor } from './faq-editor';

type Filter = Audience | 'all';

const FILTERS: readonly (readonly [Filter, string])[] = [
  ['all', 'Todas'],
  ['student', 'Estudiantes'],
  ['teacher', 'Docentes'],
];

export function FaqPage() {
  const { faq } = useContent().content;
  const [filter, setFilter] = useState<Filter>('all');
  const items = faq.items.filter((item) => filter === 'all' || item.audience === filter);

  return (
    <EditablePage editor={(close) => <FaqEditor onClose={close} />}>
      <PageHeader title={faq.title} description={faq.intro} />

      <div role="group" aria-label="Filtrar preguntas" className="mb-5 flex gap-2">
        {FILTERS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => {
              setFilter(value);
            }}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
              filter === value
                ? 'border-brand bg-brand text-brand-foreground'
                : 'bg-card text-brand hover:border-brand-accent',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <details key={item.id} className="group rounded-xl border bg-card">
            <summary className="flex cursor-pointer list-none items-start gap-3 p-5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
              <span className="flex-1">
                <AudienceTag audience={item.audience} className="mb-2" />
                <span className="block font-semibold text-foreground">{item.question}</span>
              </span>
              <ChevronDown
                className="mt-1 size-5 shrink-0 text-brand-accent transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <p className="px-5 pb-5 text-[15px] leading-relaxed text-muted-foreground">
              {item.answer}
            </p>
          </details>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">No hay preguntas en esta categoría.</p>
        )}
      </div>
    </EditablePage>
  );
}
