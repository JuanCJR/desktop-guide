/**
 * Every screen of the manual. Kept free of runtime dependencies so it can be
 * shared by the content schema and the renderer navigation.
 */
export const PAGE_IDS = [
  'home',
  'enrollment',
  'prerequisites',
  'grades',
  'saia-first-login',
  'procedures',
  'rules',
  'teacher-onboarding',
  'teacher-calendar',
  'teacher-saia',
  'faq',
  'directory',
  'content-admin',
] as const;

export type PageId = (typeof PAGE_IDS)[number];

/** Pages a quick link on the home screen may point to. */
export const LINKABLE_PAGE_IDS = [
  'enrollment',
  'prerequisites',
  'grades',
  'saia-first-login',
  'procedures',
  'rules',
  'teacher-onboarding',
  'teacher-calendar',
  'teacher-saia',
  'faq',
  'directory',
] as const satisfies readonly PageId[];

export type LinkablePageId = (typeof LINKABLE_PAGE_IDS)[number];
