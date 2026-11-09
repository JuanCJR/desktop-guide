/**
 * Formulario de edición de la pantalla de inicio.
 *
 * Aparece al pulsar "Editar esta página" en modo edición (ver
 * `./home-page.tsx`). Trabaja sobre un borrador de la parte `home` del manual
 * (`@/features/editor/use-section-draft.ts`) y, al guardar, publica el
 * manual completo. Los campos reutilizables vienen de `@/features/editor/`;
 * los límites de cada campo están en `src/shared/content/schema.ts`.
 * Permite cambiar la bienvenida, las tarjetas de perfil y los accesos rápidos.
 */
import { Label } from '@/components/ui/label';
import { AddButton, ItemCard, ItemControls, TextField } from '@/features/editor/fields';
import { EditorFrame } from '@/features/editor/editor-frame';
import { useSectionDraft } from '@/features/editor/use-section-draft';
import { moveItem, removeAt, replaceAt } from '@/lib/list';
import { findNavItem } from '@/lib/navigation';
import { newId } from '@/lib/new-id';
import { LINKABLE_PAGE_IDS } from '@shared/content/pages';
import { audienceSchema, type QuickLink } from '@shared/content/schema';

const selectClass =
  'h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

export function HomeEditor({ onClose }: { onClose: () => void }) {
  const { draft, setDraft, errors, saving, save } = useSectionDraft('home', onClose);
  const links = draft.quickLinks;
  const setLinks = (quickLinks: QuickLink[]) => {
    setDraft({ ...draft, quickLinks });
  };

  return (
    <EditorFrame
      title="Inicio"
      saving={saving}
      errors={errors}
      onSave={() => void save()}
      onCancel={onClose}
    >
      <ItemCard title="Bienvenida">
        <TextField
          label="Título"
          value={draft.title}
          onChange={(title) => {
            setDraft({ ...draft, title });
          }}
        />
        <TextField
          label="Texto de introducción"
          multiline
          value={draft.intro}
          onChange={(intro) => {
            setDraft({ ...draft, intro });
          }}
        />
      </ItemCard>

      <div className="grid gap-4 md:grid-cols-2">
        {(['studentCard', 'teacherCard'] as const).map((key) => (
          <ItemCard
            key={key}
            title={key === 'studentCard' ? 'Tarjeta Estudiante' : 'Tarjeta Docente'}
          >
            <TextField
              label="Título"
              value={draft[key].title}
              onChange={(title) => {
                setDraft({ ...draft, [key]: { ...draft[key], title } });
              }}
            />
            <TextField
              label="Descripción"
              multiline
              value={draft[key].description}
              onChange={(description) => {
                setDraft({ ...draft, [key]: { ...draft[key], description } });
              }}
            />
          </ItemCard>
        ))}
      </div>

      {/* Accesos rápidos: título, descripción, público y pantalla de destino. */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-brand">Lo más consultado</h2>
        {links.map((link, index) => {
          const update = (patch: Partial<QuickLink>) => {
            setLinks(replaceAt(links, index, { ...link, ...patch }));
          };
          return (
            <ItemCard
              key={link.id}
              title={`Acceso ${index + 1}`}
              controls={
                <ItemControls
                  index={index}
                  count={links.length}
                  onMove={(delta) => {
                    setLinks(moveItem(links, index, delta));
                  }}
                  onRemove={() => {
                    setLinks(removeAt(links, index));
                  }}
                />
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Título"
                  value={link.title}
                  onChange={(title) => {
                    update({ title });
                  }}
                />
                <TextField
                  label="Descripción"
                  value={link.description}
                  onChange={(description) => {
                    update({ description });
                  }}
                />
                <div className="space-y-1.5">
                  <Label htmlFor={`${link.id}-audience`}>Dirigido a</Label>
                  <select
                    id={`${link.id}-audience`}
                    className={selectClass}
                    value={link.audience}
                    onChange={(e) => {
                      update({ audience: audienceSchema.parse(e.target.value) });
                    }}
                  >
                    <option value="student">Estudiantes</option>
                    <option value="teacher">Docentes</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`${link.id}-target`}>Lleva a la página</Label>
                  <select
                    id={`${link.id}-target`}
                    className={selectClass}
                    value={link.target}
                    onChange={(e) => {
                      const target = LINKABLE_PAGE_IDS.find((id) => id === e.target.value);
                      if (target) update({ target });
                    }}
                  >
                    {LINKABLE_PAGE_IDS.map((id) => (
                      <option key={id} value={id}>
                        {findNavItem(id).label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </ItemCard>
          );
        })}
        <AddButton
          onClick={() => {
            setLinks([
              ...links,
              {
                id: newId('link'),
                title: '',
                description: '',
                audience: 'student',
                target: 'enrollment',
              },
            ]);
          }}
        >
          Agregar acceso
        </AddButton>
      </section>
    </EditorFrame>
  );
}
