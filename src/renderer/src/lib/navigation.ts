import {
  Building2,
  CalendarDays,
  CircleHelp,
  ClipboardList,
  FileText,
  GraduationCap,
  House,
  Library,
  ListChecks,
  type LucideIcon,
  Monitor,
  Settings,
  ShieldCheck,
} from 'lucide-react';

import type { PageId } from '@shared/content/pages';

export interface NavItem {
  id: PageId;
  label: string;
  icon: LucideIcon;
  /** Extra words that should find this page in the search box. */
  keywords: readonly string[];
  /** Shown while the page is still being written. */
  comingSoon?: string;
}

export interface NavSection {
  title: string | null;
  items: readonly NavItem[];
}

export const NAV_SECTIONS: readonly NavSection[] = [
  {
    title: null,
    items: [{ id: 'home', label: 'Inicio', icon: House, keywords: ['bienvenida', 'portada'] }],
  },
  {
    title: 'Estudiantes',
    items: [
      {
        id: 'enrollment',
        label: 'Mi ruta de inscripción',
        icon: ListChecks,
        keywords: ['inscribir', 'segundo semestre', 'pasos', 'caja', 'asesoria', 'dace', 'horario'],
      },
      {
        id: 'prerequisites',
        label: 'Simulador de prelaciones',
        icon: GraduationCap,
        keywords: ['pensum', 'materias', 'reprobar', 'bloqueada', 'verano', 'matematica'],
      },
      {
        id: 'grades',
        label: 'Consulta de notas',
        icon: Library,
        keywords: ['notas', 'calificaciones', 'biblioteca', 'record', 'cedula', 'contraseña'],
      },
      {
        id: 'saia-first-login',
        label: 'Primer ingreso a SAIA',
        icon: Monitor,
        keywords: ['saia', 'plataforma', 'contraseña', 'usuario', 'virtual'],
        comingSoon: 'Los 4 pasos para entrar por primera vez al campus virtual SAIA, con capturas.',
      },
      {
        id: 'procedures',
        label: 'Trámites y justificativos',
        icon: FileText,
        keywords: ['justificativo', 'medico', 'constancia', 'carnet', 'reposicion', 'falta'],
        comingSoon: 'Justificativos médicos (48–72 h), constancias y reposición de carnet.',
      },
      {
        id: 'rules',
        label: 'Normas y carnet',
        icon: ShieldCheck,
        keywords: ['vestimenta', 'ropa', 'carnet', 'prohibido', 'calzado', 'gorra'],
        comingSoon: 'Código de vestimenta y uso obligatorio del carnet.',
      },
    ],
  },
  {
    title: 'Docentes',
    items: [
      {
        id: 'teacher-onboarding',
        label: 'Ingreso y expediente',
        icon: ClipboardList,
        keywords: ['expediente', 'recaudos', 'microclase', 'entrevista', 'curriculum'],
        comingSoon: 'Postulación, recaudos del expediente y la microclase de 15 minutos.',
      },
      {
        id: 'teacher-calendar',
        label: 'Calendario del semestre',
        icon: CalendarDays,
        keywords: ['cortes', 'semanas', 'fechas', 'validacion', 'porcentajes'],
        comingSoon: 'Las 18 semanas con los cortes, la PGA y las fechas de validación de notas.',
      },
      {
        id: 'teacher-saia',
        label: 'PGA y notas en SAIA',
        icon: Monitor,
        keywords: ['pga', 'planificacion', 'aula dace', 'notas', 'subir', 'solvencia'],
        comingSoon: 'Paso a paso con capturas para cargar la PGA y las notas en el Aula DACE.',
      },
    ],
  },
  {
    title: 'General',
    items: [
      {
        id: 'faq',
        label: 'Preguntas frecuentes',
        icon: CircleHelp,
        keywords: ['dudas', 'preguntas', 'faq'],
        comingSoon: 'Las preguntas frecuentes de estudiantes y docentes.',
      },
      {
        id: 'directory',
        label: 'Directorio',
        icon: Building2,
        keywords: ['oficinas', 'ubicacion', 'donde queda', 'jefatura', 'caja', 'biblioteca'],
        comingSoon: 'Dependencias del IUPSM, dónde quedan y qué trámites atienden.',
      },
      {
        id: 'content-admin',
        label: 'Contenido del manual',
        icon: Settings,
        keywords: ['actualizar', 'importar', 'exportar', 'editar', 'version'],
      },
    ],
  },
];

export const NAV_ITEMS: readonly NavItem[] = NAV_SECTIONS.flatMap((section) => section.items);

export function findNavItem(id: PageId): NavItem {
  const item = NAV_ITEMS.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Unknown page: ${id}`);
  return item;
}
