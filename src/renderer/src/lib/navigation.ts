/**
 * Menú de navegación de la app: qué pantallas hay, en qué grupo aparecen
 * (Estudiantes, Docentes, General), con qué nombre e ícono, y qué palabras
 * permiten encontrarlas en el buscador.
 *
 * Lo usan el menú lateral (`features/shell/app-sidebar.tsx`), el buscador de
 * la barra superior (`features/shell/top-bar.tsx`) y la página de artículos
 * (`features/article/article-page.tsx`). Los íconos vienen de lucide-react.
 * Para agregar una pantalla al menú, se agrega aquí y en
 * `src/shared/content/pages.ts`.
 */
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
  Sun,
  UserCheck,
} from 'lucide-react';

import type { PageId } from '@shared/content/pages';
import type { ArticleKey, Audience } from '@shared/content/schema';

export interface NavItem {
  id: PageId;
  label: string;
  icon: LucideIcon;
  /** Palabras extra con las que el buscador debe encontrar esta pantalla. */
  keywords: readonly string[];
}

export interface NavSection {
  title: string | null;
  items: readonly NavItem[];
}

// Grupos y pantallas del menú lateral, en el orden en que se muestran.
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
      },
      {
        id: 'procedures',
        label: 'Trámites y justificativos',
        icon: FileText,
        keywords: ['justificativo', 'medico', 'constancia', 'carnet', 'reposicion', 'falta'],
      },
      {
        id: 'summer',
        label: 'Cursos de verano',
        icon: Sun,
        keywords: ['verano', 'intensivo', 'nivelar', 'reprobada', 'adelantar'],
      },
      {
        id: 'rules',
        label: 'Normas y carnet',
        icon: ShieldCheck,
        keywords: ['vestimenta', 'ropa', 'carnet', 'prohibido', 'calzado', 'gorra'],
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
      },
      {
        id: 'teacher-calendar',
        label: 'Calendario del semestre',
        icon: CalendarDays,
        keywords: ['cortes', 'semanas', 'fechas', 'validacion', 'porcentajes'],
      },
      {
        id: 'teacher-saia',
        label: 'PGA y notas en SAIA',
        icon: Monitor,
        keywords: ['pga', 'planificacion', 'aula dace', 'notas', 'subir', 'validador'],
      },
      {
        id: 'teacher-procedures',
        label: 'Permisos y asistencia',
        icon: UserCheck,
        keywords: ['permiso', 'recuperacion', 'asistencia', 'lista', 'solvencia', 'sello'],
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
      },
      {
        id: 'directory',
        label: 'Directorio',
        icon: Building2,
        keywords: ['oficinas', 'ubicacion', 'donde queda', 'jefatura', 'caja', 'biblioteca'],
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

// Todas las pantallas del menú en una sola lista (sin grupos).
export const NAV_ITEMS: readonly NavItem[] = NAV_SECTIONS.flatMap((section) => section.items);

// Busca los datos de menú (nombre, ícono) de una pantalla.
export function findNavItem(id: PageId): NavItem {
  const item = NAV_ITEMS.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Unknown page: ${id}`);
  return item;
}

/** Pantalla y público (estudiantes o docentes) de cada artículo genérico del contenido. */
export const ARTICLE_PAGES = {
  saiaFirstLogin: { page: 'saia-first-login', audience: 'student' },
  procedures: { page: 'procedures', audience: 'student' },
  summer: { page: 'summer', audience: 'student' },
  rules: { page: 'rules', audience: 'student' },
  teacherOnboarding: { page: 'teacher-onboarding', audience: 'teacher' },
  teacherSaia: { page: 'teacher-saia', audience: 'teacher' },
  teacherProcedures: { page: 'teacher-procedures', audience: 'teacher' },
} as const satisfies Record<ArticleKey, { page: PageId; audience: Audience }>;
