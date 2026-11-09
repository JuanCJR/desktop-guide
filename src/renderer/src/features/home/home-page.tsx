/**
 * Pantalla de inicio de la app.
 *
 * Muestra la bienvenida, dos tarjetas para elegir el perfil (estudiante o
 * docente) y los accesos rápidos a lo más consultado. Al hacer clic en una
 * tarjeta o acceso, avisa a `src/renderer/src/app.tsx` para cambiar de
 * pantalla. Los textos salen del contenido del manual (`home`); su
 * formulario de edición está en `./home-editor.tsx`.
 */
import { ArrowRight, BookOpen, GraduationCap, type LucideIcon } from 'lucide-react';

import { AudienceTag } from '@/components/audience-tag';
import { Button } from '@/components/ui/button';
import { useContent } from '@/features/content/content-context';
import { EditablePage } from '@/features/editor/editable-page';
import sealUrl from '@/assets/psm-seal.png';
import type { PageId } from '@shared/content/pages';

import { HomeEditor } from './home-editor';

// Tarjeta de perfil (estudiante o docente) con un botón que lleva a su ruta.
function RoleCard({
  icon: Icon,
  title,
  description,
  action,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="flex gap-5 rounded-xl border bg-card p-6">
      <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
        <Icon className="size-7" aria-hidden />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-brand">{title}</h2>
        <p className="mt-1.5 mb-4 text-sm leading-relaxed text-muted-foreground">{description}</p>
        <Button onClick={onClick}>
          {action}
          <ArrowRight />
        </Button>
      </div>
    </div>
  );
}

export function HomePage({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const { home } = useContent().content;

  return (
    <EditablePage editor={(close) => <HomeEditor onClose={close} />}>
      {/* Bienvenida: recuadro azul con el título y la introducción. */}
      <section className="relative overflow-hidden rounded-2xl bg-brand px-9 py-8 text-brand-foreground">
        <div
          aria-hidden
          className="absolute -top-16 -right-10 size-80 rotate-12 bg-[repeating-linear-gradient(90deg,color-mix(in_oklab,var(--brand-foreground)_10%,transparent)_0_6px,transparent_6px_16px)]"
        />
        <div className="relative flex items-center gap-8">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight">{home.title}</h1>
            <p className="mt-3 leading-relaxed opacity-85">{home.intro}</p>
          </div>
          <img src={sealUrl} alt="" className="ml-auto hidden size-28 shrink-0 lg:block" />
        </div>
      </section>

      {/* Tarjetas de perfil: estudiantes van a su ruta de inscripción; docentes, a su guía de ingreso. */}
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <RoleCard
          icon={GraduationCap}
          title={home.studentCard.title}
          description={home.studentCard.description}
          action="Ver mi ruta"
          onClick={() => {
            onNavigate('enrollment');
          }}
        />
        <RoleCard
          icon={BookOpen}
          title={home.teacherCard.title}
          description={home.teacherCard.description}
          action="Ver mi guía"
          onClick={() => {
            onNavigate('teacher-onboarding');
          }}
        />
      </div>

      {/* Accesos rápidos a lo más consultado. */}
      {home.quickLinks.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-xs font-bold tracking-widest text-muted-foreground uppercase">
            Lo más consultado
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {home.quickLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => {
                  onNavigate(link.target);
                }}
                className="group flex flex-col items-start gap-2 rounded-xl border bg-card p-4 text-left transition-colors outline-none hover:border-brand-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <AudienceTag audience={link.audience} />
                <span className="font-semibold text-foreground group-hover:text-brand">
                  {link.title}
                </span>
                <span className="text-sm text-muted-foreground">{link.description}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </EditablePage>
  );
}
