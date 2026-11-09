/**
 * Pantalla "Directorio" (menú General): una tarjeta por oficina con su nombre,
 * ubicación y los servicios que ofrece. Los datos salen del contenido del
 * manual (`directory`); su formulario de edición está en
 * `./directory-editor.tsx`.
 */
import { MapPin } from 'lucide-react';

import { PageHeader } from '@/components/page-header';
import { useContent } from '@/features/content/content-context';
import { EditablePage } from '@/features/editor/editable-page';

import { DirectoryEditor } from './directory-editor';

export function DirectoryPage() {
  const { directory } = useContent().content;

  return (
    <EditablePage editor={(close) => <DirectoryEditor onClose={close} />}>
      <PageHeader title={directory.title} description={directory.intro} />
      <div className="grid gap-4 md:grid-cols-2">
        {directory.offices.map((office) => (
          <article key={office.id} className="rounded-xl border bg-card p-5">
            <h2 className="font-semibold text-brand">{office.name}</h2>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-brand-soft px-2.5 py-1 text-sm font-medium text-brand">
              <MapPin className="size-4" aria-hidden />
              {office.location}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{office.services}</p>
          </article>
        ))}
      </div>
    </EditablePage>
  );
}
