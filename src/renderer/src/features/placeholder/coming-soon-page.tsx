import { Hourglass } from 'lucide-react';

import { PageHeader } from '@/components/page-header';
import type { NavItem } from '@/lib/navigation';

export function ComingSoonPage({ item }: { item: NavItem }) {
  return (
    <>
      <PageHeader title={item.label} />
      <div className="flex max-w-2xl gap-4 rounded-xl border border-dashed bg-card p-6">
        <Hourglass className="size-6 shrink-0 text-brand-accent" aria-hidden />
        <div>
          <p className="font-semibold text-brand">Sección en preparación</p>
          <p className="mt-1 text-sm text-muted-foreground">{item.comingSoon}</p>
        </div>
      </div>
    </>
  );
}
