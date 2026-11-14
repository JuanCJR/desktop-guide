/**
 * Reproductor de los videos explicativos de la app, con subtítulos en español.
 *
 * Lo usan las páginas de texto (`@/features/article/article-page.tsx`) cuando
 * una sección tiene un video elegido. Los videos y subtítulos están en
 * `@/assets/videos/` y su lista en `@/lib/videos.ts`. Se cargan desde los
 * archivos de la app, sin internet.
 */
import { CirclePlay } from 'lucide-react';

import { VIDEOS } from '@/lib/videos';
import type { VideoId } from '@shared/content/videos';

export function VideoPlayer({ video }: { video: VideoId }) {
  const info = VIDEOS[video];
  return (
    <figure className="overflow-hidden rounded-lg border bg-muted">
      {/* `preload="metadata"`: solo lee la duración hasta que se pulse reproducir. */}
      <video controls preload="metadata" className="aspect-[1920/872] w-full bg-black">
        <source src={info.src} type="video/mp4" />
        <track kind="subtitles" srcLang="es" label="Español" src={info.subtitles} default />
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
