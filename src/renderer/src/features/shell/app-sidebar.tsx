/**
 * Menú lateral de la app (la columna azul de la izquierda).
 *
 * Muestra el logo, los grupos de pantallas (Estudiantes, Docentes, General) y,
 * abajo, la versión de la app. La lista de pantallas sale de
 * `@/lib/navigation.ts`. Al hacer clic en una opción, avisa a
 * `src/renderer/src/app.tsx` para que cambie de pantalla.
 */
import { useEffect, useState } from 'react';

import sealUrl from '@/assets/psm-seal.png';
import { invoke } from '@/lib/ipc';
import { NAV_SECTIONS } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import type { PageId } from '@shared/content/pages';

export function AppSidebar({
  current,
  onNavigate,
}: {
  current: PageId;
  onNavigate: (page: PageId) => void;
}) {
  const [version, setVersion] = useState<string | null>(null);

  // Pide al proceso principal la versión de la app para mostrarla al pie.
  useEffect(() => {
    invoke('app:get-info')
      .then((info) => {
        setVersion(info.version);
      })
      .catch(() => {
        setVersion(null);
      });
  }, []);

  return (
    <aside className="flex w-72 shrink-0 flex-col bg-sidebar px-4 py-5 text-sidebar-foreground">
      <div className="mb-6 flex items-center gap-3 px-1">
        <img src={sealUrl} alt="Logo del Politécnico Santiago Mariño" className="size-11" />
        <div className="leading-tight">
          <p className="font-semibold text-brand-foreground">Manual de Inducción</p>
          <p className="text-xs opacity-70">Escuela 47 · Ing. de Sistemas</p>
        </div>
      </div>
      {/* Grupos de pantallas; la opción actual se resalta. */}
      <nav
        aria-label="Secciones del manual"
        className="-mr-2 flex-1 [scrollbar-width:thin] [scrollbar-color:var(--sidebar-active)_transparent] space-y-3 overflow-y-auto pr-2"
      >
        {NAV_SECTIONS.map((section, index) => (
          <div key={section.title ?? index}>
            {section.title && (
              <p className="mb-1 px-3 text-[11px] font-semibold tracking-widest uppercase opacity-50">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = item.id === current;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-current={active ? 'page' : undefined}
                      onClick={() => {
                        onNavigate(item.id);
                      }}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-left text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-foreground/60',
                        active
                          ? 'bg-sidebar-active font-semibold text-brand-foreground'
                          : 'hover:bg-sidebar-active/40 hover:text-brand-foreground',
                      )}
                    >
                      <item.icon className="size-4 shrink-0" aria-hidden />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <p className="mt-4 px-3 text-[11px] opacity-50">
        IUPSM · Extensión Maracay{version && ` · v${version}`}
      </p>
    </aside>
  );
}
