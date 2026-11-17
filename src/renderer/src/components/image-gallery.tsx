/**
 * Galería de imágenes de referencia de una sección (cuadros de los videos).
 *
 * La usan las páginas de texto (`@/features/article/article-page.tsx`). Cada
 * imagen se ve en miniatura con su pie de foto; al hacer clic se abre en grande
 * en una ventana que se cierra con Esc, con la X o haciendo clic en la imagen.
 * Las imágenes y sus nombres están en `@/lib/images.ts`.
 */
import { X, ZoomIn } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { IMAGES } from '@/lib/images';
import { cn } from '@/lib/utils';
import type { SectionImage } from '@shared/content/schema';

export function ImageGallery({ images }: { images: readonly SectionImage[] }) {
  const [open, setOpen] = useState<SectionImage | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Abre o cierra la ventana nativa cuando cambia la imagen elegida.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (images.length === 0) return null;
  const describe = (image: SectionImage) => image.caption || IMAGES[image.id].title;

  return (
    <>
      <div className={cn('grid gap-4', images.length > 1 && 'sm:grid-cols-2')}>
        {images.map((image, index) => (
          <figure key={`${image.id}-${String(index)}`} className="space-y-2">
            <button
              type="button"
              className="group relative block w-full overflow-hidden rounded-lg border bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              onClick={() => {
                setOpen(image);
              }}
              aria-label={`Ver en grande: ${describe(image)}`}
            >
              <img
                src={IMAGES[image.id].src}
                alt={describe(image)}
                loading="lazy"
                className="w-full transition-transform group-hover:scale-[1.02]"
              />
              <span className="absolute right-2 bottom-2 rounded-full bg-background/90 p-1.5 text-brand opacity-0 shadow transition-opacity group-hover:opacity-100">
                <ZoomIn className="size-4" aria-hidden />
              </span>
            </button>
            {image.caption && (
              <figcaption className="text-sm text-muted-foreground">{image.caption}</figcaption>
            )}
          </figure>
        ))}
      </div>

      {/* Imagen en grande. Esc la cierra (evento "close" del diálogo nativo). */}
      <dialog
        ref={dialogRef}
        className="m-auto max-h-[92vh] max-w-[92vw] rounded-xl bg-card p-0 shadow-xl backdrop:bg-black/70"
        onClose={() => {
          setOpen(null);
        }}
      >
        {open && (
          <figure>
            <div className="flex items-center justify-between gap-4 border-b px-4 py-2">
              <figcaption className="text-sm text-foreground">{describe(open)}</figcaption>
              <button
                type="button"
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Cerrar"
                onClick={() => {
                  setOpen(null);
                }}
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <img
              src={IMAGES[open.id].src}
              alt={describe(open)}
              className="max-h-[80vh] w-auto cursor-zoom-out"
              onClick={() => {
                setOpen(null);
              }}
            />
          </figure>
        )}
      </dialog>
    </>
  );
}
