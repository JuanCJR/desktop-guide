/**
 * Etiqueta pequeña que indica a quién va dirigido un tema: "Estudiantes" o
 * "Docentes". Se usa en varias pantallas (inicio, artículos, preguntas
 * frecuentes).
 */
import { BookOpen, GraduationCap } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Audience } from '@shared/content/schema';

const LABELS: Record<Audience, string> = { student: 'Estudiantes', teacher: 'Docentes' };

/** Indica para quién es un tema: estudiantes (fondo claro) o docentes (azul marino sólido). */
export function AudienceTag({ audience, className }: { audience: Audience; className?: string }) {
  const Icon = audience === 'student' ? GraduationCap : BookOpen;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        audience === 'student' ? 'bg-brand-soft text-brand' : 'bg-brand text-brand-foreground',
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {LABELS[audience]}
    </span>
  );
}
