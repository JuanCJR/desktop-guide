/**
 * Formulario de edición de la pantalla genérica de artículo.
 *
 * Aparece al pulsar "Editar esta página" en modo edición (ver
 * `./article-page.tsx`). Trabaja sobre un borrador de la parte `articleKey` del manual
 * (`@/features/editor/use-section-draft.ts`) y, al guardar, publica el
 * manual completo. Los campos reutilizables vienen de `@/features/editor/`;
 * los límites de cada campo están en `src/shared/content/schema.ts`.
 * Permite cambiar el título, la introducción y cada sección (agregar,
 * quitar o reordenar secciones y sus elementos).
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
import { newId } from '@/lib/new-id';
import type { ArticleKey, ArticleSection, NoticeTone, SectionStyle } from '@shared/content/schema';

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
            },
          ]);
        }}
      >
        Agregar sección
      </AddButton>
    </EditorFrame>
  );
}
