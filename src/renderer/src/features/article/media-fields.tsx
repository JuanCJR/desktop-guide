/**
 * Campos del editor de artículos para las imágenes y el video de una sección.
 *
 * Permiten elegir imágenes y videos de los que trae la app o subir archivos
 * propios desde la computadora (botones «Subir imagen…» y «Subir video…»).
 * La subida la hace el proceso principal (canal `media:upload`,
 * `src/main/ipc/handlers/media.ts`), que revisa los límites de
 * `src/shared/content/media.ts`. Lo usa `./article-editor.tsx`.
 */
import { CircleAlert, ImageUp, Loader2, Video } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { AddButton, ItemControls, TextField } from '@/features/editor/fields';
import { SelectField } from '@/features/editor/select-field';
import { IMAGES } from '@/lib/images';
import { invoke } from '@/lib/ipc';
import { moveItem, removeAt, replaceAt } from '@/lib/list';
import { resolveImage, type VideoRef } from '@/lib/media';
import { VIDEOS } from '@/lib/videos';
import { IMAGE_IDS, type ImageId, MAX_SECTION_IMAGES } from '@shared/content/images';
import {
  formatMegabytes,
  MEDIA_LIMITS,
  type UploadedImage,
  type UploadedVideo,
} from '@shared/content/media';
import type { SectionImage } from '@shared/content/schema';
import { VIDEO_IDS, type VideoId } from '@shared/content/videos';

// Lista de imágenes de la app para elegir.
const IMAGE_OPTIONS: readonly (readonly [ImageId, string])[] = IMAGE_IDS.map(
  (id) => [id, IMAGES[id].title] as const,
);

// Lista de videos para elegir; "none" = sin video y "uploaded" = el subido.
const NO_VIDEO = 'none';
const UPLOADED = 'uploaded';
type VideoOption = VideoId | typeof NO_VIDEO | typeof UPLOADED;

/**
 * Sube un archivo y devuelve lo que el proceso principal guardó. Mientras
 * tanto marca `busy`; si algo falla, deja el mensaje en `error`.
 */
function useUpload() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function upload<K extends 'image' | 'video'>(
    kind: K,
  ): Promise<(K extends 'image' ? UploadedImage : UploadedVideo) | null> {
    setBusy(true);
    setError(null);
    try {
      const result = await invoke('media:upload', { kind });
      if (result.status === 'cancelled') return null;
      if (result.status === 'invalid') {
        setError(result.message);
        return null;
      }
      return result.file as K extends 'image' ? UploadedImage : UploadedVideo;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      return null;
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, upload };
}

// Mensaje de error de una subida (si lo hay).
function UploadError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-2 text-sm text-warning-foreground">
      <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
      {message}
    </p>
  );
}

/**
 * Imágenes de una sección: de la app (se elige cuál) o subidas, con su pie de
 * foto, su orden y la opción de quitarlas. Máximo MAX_SECTION_IMAGES.
 */
export function ImagesField({
  images,
  onChange,
}: {
  images: readonly SectionImage[];
  onChange: (images: SectionImage[]) => void;
}) {
  const { busy, error, upload } = useUpload();
  const full = images.length >= MAX_SECTION_IMAGES;
  return (
    <fieldset className="space-y-3">
      <legend className="mb-1.5 text-sm font-medium">Imágenes</legend>
      {images.map((image, index) => (
        <div key={index} className="flex items-start gap-3 rounded-md border p-3">
          <img
            src={resolveImage(image).src}
            alt=""
            className="mt-6 hidden w-28 shrink-0 rounded border sm:block"
          />
          <div className="grid flex-1 gap-3">
            {'id' in image ? (
              <SelectField
                label={`Imagen ${String(index + 1)}`}
                value={image.id}
                options={IMAGE_OPTIONS}
                onChange={(id) => {
                  onChange(replaceAt(images, index, { ...image, id }));
                }}
              />
            ) : (
              <p className="text-sm">
                <span className="font-medium">Imagen {index + 1} (subida):</span> {image.file.name}{' '}
                <span className="text-muted-foreground">· {formatMegabytes(image.file.size)}</span>
              </p>
            )}
            <TextField
              label="Pie de foto"
              hint="Opcional."
              value={image.caption}
              onChange={(caption) => {
                onChange(replaceAt(images, index, { ...image, caption }));
              }}
            />
          </div>
          <ItemControls
            index={index}
            count={images.length}
            onMove={(delta) => {
              onChange(moveItem(images, index, delta));
            }}
            onRemove={() => {
              onChange(removeAt(images, index));
            }}
          />
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        {!full && (
          <AddButton
            onClick={() => {
              // Propone la primera imagen de la app que todavía no está en la sección.
              const unused = IMAGE_IDS.find(
                (id) => !images.some((image) => 'id' in image && image.id === id),
              );
              onChange([...images, { id: unused ?? IMAGE_IDS[0], caption: '' }]);
            }}
          >
            Agregar imagen de la app
          </AddButton>
        )}
        {!full && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => {
              void upload('image').then((file) => {
                if (file) onChange([...images, { file, caption: '' }]);
              });
            }}
          >
            {busy ? <Loader2 className="animate-spin" /> : <ImageUp />}
            Subir imagen…
          </Button>
        )}
        <span className="text-xs text-muted-foreground">
          JPG o PNG de hasta {formatMegabytes(MEDIA_LIMITS.imageInputBytes)}; se reduce a{' '}
          {MEDIA_LIMITS.imageMaxSide} px.
          {full && ` Máximo ${String(MAX_SECTION_IMAGES)} imágenes por sección.`}
        </span>
      </div>
      <UploadError message={error} />
    </fieldset>
  );
}

/** Video de una sección: ninguno, uno de la app o uno subido. */
export function VideoField({
  video,
  onChange,
}: {
  video: VideoRef | null | undefined;
  onChange: (video: VideoRef | null) => void;
}) {
  const { busy, error, upload } = useUpload();
  const uploaded = video && typeof video === 'object' ? video : null;
  const options: (readonly [VideoOption, string])[] = [
    [NO_VIDEO, 'Sin video'],
    ...VIDEO_IDS.map((id) => [id, VIDEOS[id].title] as const),
  ];
  if (uploaded) options.push([UPLOADED, `Video subido: ${uploaded.name}`]);
  let value: VideoOption = NO_VIDEO;
  if (typeof video === 'string') value = video;
  else if (uploaded) value = UPLOADED;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-64 flex-1">
          <SelectField<VideoOption>
            label="Video"
            value={value}
            options={options}
            onChange={(next) => {
              if (next === UPLOADED) return;
              onChange(next === NO_VIDEO ? null : next);
            }}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => {
            void upload('video').then((file) => {
              if (file) onChange(file);
            });
          }}
        >
          {busy ? <Loader2 className="animate-spin" /> : <Video />}
          {busy ? 'Subiendo…' : 'Subir video…'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {uploaded ? `${uploaded.name} · ${formatMegabytes(uploaded.size)}. ` : ''}
        MP4 de hasta {formatMegabytes(MEDIA_LIMITS.videoBytes)}. Los videos subidos no llevan
        subtítulos.
      </p>
      <UploadError message={error} />
    </div>
  );
}

/** Cuánto ocupan los archivos subidos de todo el manual, frente a los límites. */
export function UploadsUsage({ count, bytes }: { count: number; bytes: number }) {
  const over = count > MEDIA_LIMITS.maxFiles || bytes > MEDIA_LIMITS.totalBytes;
  return (
    <p
      className={
        over ? 'text-sm font-medium text-warning-foreground' : 'text-sm text-muted-foreground'
      }
    >
      Archivos subidos en todo el manual: {count} de {MEDIA_LIMITS.maxFiles} ·{' '}
      {formatMegabytes(bytes)} de {formatMegabytes(MEDIA_LIMITS.totalBytes)}.
      {over && ' Quita algún archivo para poder guardar.'}
    </p>
  );
}
