/**
 * Recuadro de aviso destacado que se usa en varias pantallas: en amarillo
 * para advertencias y reglas obligatorias, en azul para consejos.
 */
import { CircleAlert, Info } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/** Mensaje destacado: `warning` para reglas obligatorias, `info` para consejos. */
export function Notice({
  tone = 'warning',
  children,
  className,
}: {
  tone?: 'warning' | 'info';
  children: ReactNode;
  className?: string;
}) {
  const Icon = tone === 'warning' ? CircleAlert : Info;
  return (
    <div
      role="note"
      className={cn(
        'flex gap-3 rounded-md border-l-4 px-4 py-3 text-sm leading-relaxed',
        tone === 'warning'
          ? 'border-warning bg-warning-soft text-warning-foreground'
          : 'border-brand-accent bg-brand-soft text-brand',
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}
