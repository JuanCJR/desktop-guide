/**
 * Lista de todas las pantallas (páginas) del manual.
 *
 * Cada pantalla tiene un identificador fijo (por ejemplo, `enrollment` =
 * inscripción). Esta lista la usan el esquema del contenido (`./schema.ts`) y
 * el menú de navegación de la interfaz (`src/renderer/src/lib/navigation.ts`).
 * No depende de ninguna librería para poder compartirse en toda la app.
 */
export const PAGE_IDS = [
  'home',
  'enrollment',
  'prerequisites',
  'grades',
  'saia-first-login',
  'procedures',
  'summer',
  'rules',
  'teacher-onboarding',
  'teacher-calendar',
  'teacher-saia',
  'teacher-procedures',
  'faq',
  'directory',
  'content-admin',
] as const;

export type PageId = (typeof PAGE_IDS)[number];

/** Pantallas a las que puede apuntar un acceso rápido de la pantalla de inicio. */
export const LINKABLE_PAGE_IDS = [
  'enrollment',
  'prerequisites',
  'grades',
  'saia-first-login',
  'procedures',
  'summer',
  'rules',
  'teacher-onboarding',
  'teacher-calendar',
  'teacher-saia',
  'teacher-procedures',
  'faq',
  'directory',
] as const satisfies readonly PageId[];

export type LinkablePageId = (typeof LINKABLE_PAGE_IDS)[number];
