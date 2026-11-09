import { BookOpen, GraduationCap } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Audience } from '@shared/content/schema';

const LABELS: Record<Audience, string> = { student: 'Estudiantes', teacher: 'Docentes' };

/** Says who a topic is for: students (light) or teachers (solid navy). */
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
