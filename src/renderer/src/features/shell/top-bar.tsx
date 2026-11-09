import { Lock, Pencil, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { AudienceTag } from '@/components/audience-tag';
import { Button } from '@/components/ui/button';
import { useContent } from '@/features/content/content-context';
import { NAV_ITEMS } from '@/lib/navigation';
import { type SearchableTopic, searchTopics } from '@/lib/search';
import type { PageId } from '@shared/content/pages';
import type { Audience } from '@shared/content/schema';

interface SearchResult {
  key: string;
  title: string;
  page: PageId;
  audience: Audience | null;
}

export function TopBar({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const { content, state, lock } = useContent();
  const [query, setQuery] = useState('');

  const topics = useMemo<SearchableTopic<SearchResult>[]>(
    () => [
      ...NAV_ITEMS.filter((item) => item.id !== 'home').map((item) => ({
        title: item.label,
        keywords: item.keywords,
        item: { key: item.id, title: item.label, page: item.id, audience: null },
      })),
      ...content.home.quickLinks.map((link) => ({
        title: link.title,
        keywords: [link.description],
        item: { key: link.id, title: link.title, page: link.target, audience: link.audience },
      })),
    ],
    [content],
  );
  const results = searchTopics(topics, query);

  function go(page: PageId) {
    setQuery('');
    onNavigate(page);
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-card px-8">
      <div className="relative w-full max-w-xl">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          aria-label="Buscar en el manual"
          placeholder="Busca: «inscripción», «notas», «verano», «PGA»…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          onKeyDown={(e) => {
            const first = results[0];
            if (e.key === 'Enter' && first) go(first.page);
            if (e.key === 'Escape') setQuery('');
          }}
          className="h-10 w-full rounded-lg border bg-background pr-3 pl-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
        {query.trim() && (
          <ul className="absolute top-12 z-20 w-full overflow-hidden rounded-lg border bg-popover shadow-lg">
            {results.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted-foreground">Sin resultados.</li>
            ) : (
              results.map((result) => (
                <li key={result.key}>
                  <button
                    type="button"
                    onClick={() => {
                      go(result.page);
                    }}
                    className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                  >
                    {result.title}
                    {result.audience && <AudienceTag audience={result.audience} />}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      {state.editorUnlocked && (
        <div className="ml-auto flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-3 py-1 text-xs font-semibold text-warning">
            <Pencil className="size-3.5" aria-hidden />
            Modo edición
          </span>
          <Button size="sm" variant="outline" onClick={() => void lock()}>
            <Lock />
            Bloquear
          </Button>
        </div>
      )}
    </header>
  );
}
