/**
 * Imágenes de referencia incluidas en la app: cuadros sacados de los videos
 * explicativos (con los datos personales difuminados) que muestran en qué
 * parte de SAIA está cada cosa.
 *
 * Igual que los videos, van dentro del instalador; desde el editor se elige en
 * qué sección se muestra cada una y con qué pie de foto. Los archivos viven en
 * `src/renderer/src/assets/images/` y su catálogo en
 * `src/renderer/src/lib/images.ts`. El esquema (`./schema.ts`) usa esta lista
 * para validar las imágenes de cada sección.
 */
export const IMAGE_IDS = [
  'saia-login-microsoft',
  'saia-personal-area',
  'saia-my-courses',
  'saia-course-tasks',
  'dace-download-reports',
  'dace-submit-reports',
  'saia-edit-mode',
  'saia-add-activity',
  'saia-assignment-availability',
  'saia-submission-types',
  'saia-save-buttons',
  'saia-grading-summary',
] as const;
export type ImageId = (typeof IMAGE_IDS)[number];

/** Máximo de imágenes por sección, para que las páginas no queden demasiado largas. */
export const MAX_SECTION_IMAGES = 6;
