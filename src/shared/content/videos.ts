/**
 * Videos explicativos incluidos en la app (no se pueden cambiar desde el editor,
 * porque van dentro del instalador; lo que sí se edita es en qué sección se
 * muestra cada uno).
 *
 * Los archivos viven en `src/renderer/src/assets/videos/` y su catálogo (título,
 * archivo y subtítulos) en `src/renderer/src/lib/videos.ts`. El esquema del
 * contenido (`./schema.ts`) usa esta lista para validar qué video lleva una
 * sección.
 */
export const VIDEO_IDS = [
  'saia-intro',
  'dace-grades',
  'saia-classroom',
  'saia-assignment',
] as const;
export type VideoId = (typeof VIDEO_IDS)[number];
