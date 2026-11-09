import { AddButton, ItemCard, ItemControls, TextField } from '@/features/editor/fields';
import { EditorFrame } from '@/features/editor/editor-frame';
import { useSectionDraft } from '@/features/editor/use-section-draft';
import { moveItem, removeAt, replaceAt } from '@/lib/list';
import { newId } from '@/lib/new-id';
import type { Office } from '@shared/content/schema';

export function DirectoryEditor({ onClose }: { onClose: () => void }) {
  const { draft, setDraft, errors, saving, save } = useSectionDraft('directory', onClose);
  const { offices } = draft;
  const setOffices = (next: Office[]) => {
    setDraft({ ...draft, offices: next });
  };

  return (
    <EditorFrame
      title="Directorio"
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
      {offices.map((office, index) => {
        const update = (patch: Partial<Office>) => {
          setOffices(replaceAt(offices, index, { ...office, ...patch }));
        };
        return (
          <ItemCard
            key={office.id}
            title={office.name || `Dependencia ${index + 1}`}
            controls={
              <ItemControls
                index={index}
                count={offices.length}
                onMove={(delta) => {
                  setOffices(moveItem(offices, index, delta));
                }}
                onRemove={() => {
                  setOffices(removeAt(offices, index));
                }}
              />
            }
          >
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Nombre"
                value={office.name}
                onChange={(name) => {
                  update({ name });
                }}
              />
              <TextField
                label="Ubicación"
                value={office.location}
                onChange={(location) => {
                  update({ location });
                }}
              />
            </div>
            <TextField
              label="Trámites que atiende"
              multiline
              value={office.services}
              onChange={(services) => {
                update({ services });
              }}
            />
          </ItemCard>
        );
      })}
      <AddButton
        onClick={() => {
          setOffices([...offices, { id: newId('office'), name: '', location: '', services: '' }]);
        }}
      >
        Agregar dependencia
      </AddButton>
    </EditorFrame>
  );
}
