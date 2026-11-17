/**
 * Formulario de edición de la pantalla genérica de artículo.
 *
 * Aparece al pulsar "Editar esta página" en modo edición (ver
 * `./article-page.tsx`). Trabaja sobre un borrador de la parte `articleKey` del manual
 * (`@/features/editor/use-section-draft.ts`) y, al guardar, publica el
 * manual completo. Los campos reutilizables vienen de `@/features/editor/`;
 * los límites de cada campo están en `src/shared/content/schema.ts`.
 * Permite cambiar el título, la introducción y cada sección (agregar,
 * quitar o reordenar secciones y sus elementos) y elegir sus imágenes y su video.
 */
import {
  AddButton,
  ItemCard,
  ItemControls,
  StringListField,
  TextField,
} from '@/features/editor/fields';
import { EditorFrame } from '@/features/editor/editor-frame';
import { SelectField } from '@/features/editor/select-field';
import { useSectionDraft } from '@/features/editor/use-section-draft';
import { moveItem, removeAt, replaceAt } from '@/lib/list';
import { IMAGES } from '@/lib/images';
import { newId } from '@/lib/new-id';
import { VIDEOS } from '@/lib/videos';
import type { ArticleKey, ArticleSection, NoticeTone, SectionStyle } from '@shared/content/schema';
import { IMAGE_IDS, type ImageId, MAX_SECTION_IMAGES } from '@shared/content/images';
import type { SectionImage } from '@shared/content/schema';
import { VIDEO_IDS, type VideoId } from '@shared/content/videos';

// Opciones que se muestran en las listas desplegables del formulario.
const STYLE_OPTIONS = [
  ['numbered', 'Pasos numerados'],
  ['bulleted', 'Lista con viñetas'],
  ['checklist', 'Lista para marcar (✓)'],
] as const satisfies readonly (readonly [SectionStyle, string])[];

const TONE_OPTIONS = [
  ['info', 'Información (azul)'],
  ['warning', 'Importante (naranja)'],
] as const satisfies readonly (readonly [NoticeTone, string])[];

// Lista de videos para elegir; "none" significa que la sección no lleva video.
const NO_VIDEO = 'none';
const VIDEO_OPTIONS: readonly (readonly [VideoId | typeof NO_VIDEO, string])[] = [
  [NO_VIDEO, 'Sin video'],
  ...VIDEO_IDS.map((id) => [id, VIDEOS[id].title] as const),
];

// Lista de imágenes para elegir (todas las que trae la app).
const IMAGE_OPTIONS: readonly (readonly [ImageId, string])[] = IMAGE_IDS.map(
  (id) => [id, IMAGES[id].title] as const,
);

// Imágenes de referencia de una sección: elegir cuál, su pie de foto, el orden
// y quitarlas. Como máximo MAX_SECTION_IMAGES por sección.
function ImagesField({
  images,
  onChange,
}: {
  images: readonly SectionImage[];
  onChange: (images: SectionImage[]) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-1.5 text-sm font-medium">Imágenes de referencia</legend>
      {images.map((image, index) => (
        <div key={index} className="flex items-start gap-3 rounded-md border p-3">
          <img
            src={IMAGES[image.id].src}
            alt=""
            className="mt-6 hidden w-28 shrink-0 rounded border sm:block"
          />
          <div className="grid flex-1 gap-3">
            <SelectField
              label={`Imagen ${String(index + 1)}`}
              value={image.id}
              options={IMAGE_OPTIONS}
              onChange={(id) => {
                onChange(replaceAt(images, index, { ...image, id }));
              }}
            />
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
      {images.length < MAX_SECTION_IMAGES && (
        <AddButton
          onClick={() => {
            // Propone la primera imagen que todavía no está en la sección.
            const unused = IMAGE_IDS.find((id) => !images.some((image) => image.id === id));
            onChange([...images, { id: unused ?? IMAGE_IDS[0], caption: '' }]);
          }}
        >
          Agregar imagen
        </AddButton>
      )}
    </fieldset>
  );
}

// Campos de una sección: título, texto, estilo, elementos y aviso.
function SectionFields({
  section,
  onChange,
}: {
  section: ArticleSection;
  onChange: (section: ArticleSection) => void;
}) {
  const update = (patch: Partial<ArticleSection>) => {
    onChange({ ...section, ...patch });
  };
  return (
    <>
      <div className="grid gap-4 md:grid-cols-[1fr_16rem]">
        <TextField
          label="Título de la sección"
          value={section.title}
          onChange={(title) => {
            update({ title });
          }}
        />
        <SelectField
          label="Cómo se muestran los elementos"
          value={section.style}
          options={STYLE_OPTIONS}
          onChange={(style) => {
            update({ style });
          }}
        />
      </div>
      <TextField
        label="Texto introductorio"
        multiline
        hint="Opcional. Déjalo vacío para ocultarlo."
        value={section.body}
        onChange={(body) => {
          update({ body });
        }}
      />
      <StringListField
        label="Elementos"
        values={section.items}
        addLabel="Agregar elemento"
        onChange={(items) => {
          update({ items });
        }}
      />
      <div className="grid gap-4 md:grid-cols-[1fr_16rem]">
        <TextField
          label="Aviso destacado"
          multiline
          hint="Opcional. Déjalo vacío para ocultarlo."
          value={section.notice}
          onChange={(notice) => {
            update({ notice });
          }}
        />
        <SelectField
          label="Tipo de aviso"
          value={section.noticeTone}
          options={TONE_OPTIONS}
          onChange={(noticeTone) => {
            update({ noticeTone });
          }}
        />
      </div>
      <ImagesField
        images={section.images ?? []}
        onChange={(images) => {
          update({ images });
        }}
      />
      <SelectField
        label="Video explicativo"
        value={section.video ?? NO_VIDEO}
        options={VIDEO_OPTIONS}
        onChange={(video) => {
          update({ video: video === NO_VIDEO ? null : video });
        }}
      />
    </>
  );
}

export function ArticleEditor({
  articleKey,
  onClose,
}: {
  articleKey: ArticleKey;
  onClose: () => void;
}) {
  const { draft, setDraft, errors, saving, save } = useSectionDraft(articleKey, onClose);
  const { sections } = draft;
  const setSections = (next: ArticleSection[]) => {
    setDraft({ ...draft, sections: next });
  };

  return (
    <EditorFrame
      title={draft.title || 'Página'}
      saving={saving}
      errors={errors}
      onSave={() => void save()}
      onCancel={onClose}
    >
      <ItemCard title="Encabezado">
        <TextField
          label="Título"
          value={draft.title}
          onChange={(title) => {
            setDraft({ ...draft, title });
          }}
        />
        <TextField
          label="Introducción"
          multiline
          value={draft.intro}
          onChange={(intro) => {
            setDraft({ ...draft, intro });
          }}
        />
      </ItemCard>
      {sections.map((section, index) => (
        <ItemCard
          key={section.id}
          title={`Sección ${index + 1}`}
          controls={
            <ItemControls
              index={index}
              count={sections.length}
              canRemove={sections.length > 1}
              onMove={(delta) => {
                setSections(moveItem(sections, index, delta));
              }}
              onRemove={() => {
                setSections(removeAt(sections, index));
              }}
            />
          }
        >
          <SectionFields
            section={section}
            onChange={(next) => {
              setSections(replaceAt(sections, index, next));
            }}
          />
        </ItemCard>
      ))}
      <AddButton
        onClick={() => {
          setSections([
            ...sections,
            {
              id: newId('section'),
              title: '',
              body: '',
              style: 'bulleted',
              items: [],
              notice: '',
              noticeTone: 'info',
              video: null,
              images: [],
            },
          ]);
        }}
      >
        Agregar sección
      </AddButton>
    </EditorFrame>
  );
}
