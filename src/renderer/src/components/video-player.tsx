/**
 * Reproductor de los videos explicativos de la app, con subtítulos en español.
 *
 * Lo usan las páginas de texto (`@/features/article/article-page.tsx`) cuando
 * una sección tiene un video elegido: uno de la app (`@/lib/videos.ts`) o uno
 * subido desde el editor (ver `@/lib/media.ts`). Todo se carga desde la
 * computadora, sin internet.
 */
import { CirclePlay } from 'lucide-react';

import { cn } from '@/lib/utils';
import { resolveVideo, type VideoRef } from '@/lib/media';

export function VideoPlayer({ video }: { video: VideoRef }) {
  const info = resolveVideo(video);
  return (
    <figure className="overflow-hidden rounded-lg border bg-muted">
      {/* `preload="metadata"`: solo lee la duración hasta que se pulse reproducir. */}
      <video controls preload="metadata" className={cn('w-full bg-black', info.aspect)}>
        <source src={info.src} type="video/mp4" />
        {info.subtitles && (
          <track kind="subtitles" srcLang="es" label="Español" src={info.subtitles} default />
        )}
      </video>
      <figcaption className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground">
        <CirclePlay className="size-4 shrink-0 text-brand-accent" aria-hidden />
        <span>
          {info.title}
          {info.duration && ` · ${info.duration}`}
        </span>
      </figcaption>
    </figure>
  );
}
