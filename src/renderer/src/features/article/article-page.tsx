import { Notice } from '@/components/notice';
import { PageHeader } from '@/components/page-header';
import { useContent } from '@/features/content/content-context';
import { EditablePage } from '@/features/editor/editable-page';
import { usePersistedSet } from '@/hooks/use-persisted-set';
import { cn } from '@/lib/utils';
import type { ArticleKey, ArticleSection } from '@shared/content/schema';

import { ArticleEditor } from './article-editor';

function Checklist({ storageKey, items }: { storageKey: string; items: readonly string[] }) {
  const { values: checked, toggle } = usePersistedSet(storageKey);
  const done = items.filter((item) => checked.has(item)).length;
  return (
    <>
      <div className="mb-3 flex items-center gap-3 text-sm text-muted-foreground">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-brand-soft">
          <div
            className="h-full rounded-full bg-brand-accent transition-[width]"
            style={{ width: `${items.length === 0 ? 0 : (done / items.length) * 100}%` }}
          />
        </div>
        {done} de {items.length} listos
      </div>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item}>
            <label className="flex cursor-pointer items-start gap-3 border-b border-dashed py-2 text-[15px]">
              <input
                type="checkbox"
                className="mt-1 size-[18px] shrink-0 accent-brand-accent"
                checked={checked.has(item)}
                onChange={() => {
                  toggle(item);
                }}
              />
              <span className={cn(checked.has(item) && 'text-muted-foreground line-through')}>
                {item}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </>
  );
}

function SectionItems({ section, storageKey }: { section: ArticleSection; storageKey: string }) {
  if (section.items.length === 0) return null;
  if (section.style === 'checklist') {
    return <Checklist storageKey={storageKey} items={section.items} />;
  }
  if (section.style === 'numbered') {
    return (
      <ol className="space-y-3">
        {section.items.map((item, index) => (
          <li key={index} className="flex gap-3 text-[15px] leading-relaxed">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-brand-foreground">
              {index + 1}
            </span>
            <span className="pt-0.5">{item}</span>
          </li>
        ))}
      </ol>
    );
  }
  return (
    <ul className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed marker:text-brand-accent">
      {section.items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

/** Generic page made of sections (steps, bullets or checklists), editable by the school. */
export function ArticlePage({ articleKey }: { articleKey: ArticleKey }) {
  const article = useContent().content[articleKey];

  return (
    <EditablePage editor={(close) => <ArticleEditor articleKey={articleKey} onClose={close} />}>
      <PageHeader title={article.title} description={article.intro} />
      <div className="space-y-5">
        {article.sections.map((section) => (
          <section key={section.id} className="rounded-xl border bg-card p-6">
            <h2 className="text-lg font-semibold text-brand">{section.title}</h2>
            {section.body && (
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                {section.body}
              </p>
            )}
            {section.items.length > 0 && (
              <div className="mt-4">
                <SectionItems
                  section={section}
                  storageKey={`checklist:${articleKey}:${section.id}`}
                />
              </div>
            )}
            {section.notice && (
              <Notice tone={section.noticeTone} className="mt-4">
                {section.notice}
              </Notice>
            )}
          </section>
        ))}
      </div>
    </EditablePage>
  );
}
