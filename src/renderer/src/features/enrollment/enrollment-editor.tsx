import {
  AddButton,
  ItemCard,
  ItemControls,
  StringListField,
  TextField,
} from '@/features/editor/fields';
import { EditorFrame } from '@/features/editor/editor-frame';
import { useSectionDraft } from '@/features/editor/use-section-draft';
import { Input } from '@/components/ui/input';
import { moveItem, removeAt, replaceAt } from '@/lib/list';
import { newId } from '@/lib/new-id';
import type { EnrollmentStep } from '@shared/content/schema';

function StepFields({
  step,
  onChange,
}: {
  step: EnrollmentStep;
  onChange: (step: EnrollmentStep) => void;
}) {
  const update = (patch: Partial<EnrollmentStep>) => {
    onChange({ ...step, ...patch });
  };
  const { tasks } = step;
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Nombre corto (en la barra de pasos)"
          value={step.label}
          onChange={(label) => {
            update({ label });
          }}
        />
        <TextField
          label="Subtítulo corto"
          value={step.caption}
          onChange={(caption) => {
            update({ caption });
          }}
        />
        <TextField
          label="Título del paso"
          value={step.title}
          onChange={(title) => {
            update({ title });
          }}
        />
        <TextField
          label="Lugar"
          value={step.location}
          onChange={(location) => {
            update({ location });
          }}
        />
      </div>
      <fieldset className="space-y-2">
        <legend className="mb-1.5 text-sm font-medium">Tareas (casillas para marcar)</legend>
        {tasks.map((task, index) => (
          <div key={task.id} className="flex items-center gap-2">
            <Input
              aria-label={`Tarea ${index + 1}`}
              value={task.text}
              onChange={(e) => {
                update({ tasks: replaceAt(tasks, index, { ...task, text: e.target.value }) });
              }}
            />
            <ItemControls
              index={index}
              count={tasks.length}
              canRemove={tasks.length > 1}
              onMove={(delta) => {
                update({ tasks: moveItem(tasks, index, delta) });
              }}
              onRemove={() => {
                update({ tasks: removeAt(tasks, index) });
              }}
            />
          </div>
        ))}
        <AddButton
          onClick={() => {
            update({ tasks: [...tasks, { id: newId('task'), text: '' }] });
          }}
        >
          Agregar tarea
        </AddButton>
      </fieldset>
      <StringListField
        label="Qué llevar"
        values={step.bring}
        addLabel="Agregar documento"
        onChange={(bring) => {
          update({ bring });
        }}
      />
      <TextField
        label="Aviso importante"
        multiline
        value={step.notice}
        hint="Déjalo vacío si este paso no necesita aviso."
        onChange={(notice) => {
          update({ notice });
        }}
      />
    </>
  );
}

export function EnrollmentEditor({ onClose }: { onClose: () => void }) {
  const { draft, setDraft, errors, saving, save } = useSectionDraft('enrollment', onClose);
  const { steps } = draft;
  const setSteps = (next: EnrollmentStep[]) => {
    setDraft({ ...draft, steps: next });
  };

  return (
    <EditorFrame
      title="Ruta de inscripción"
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
      {steps.map((step, index) => (
        <ItemCard
          key={step.id}
          title={`Paso ${index + 1}`}
          controls={
            <ItemControls
              index={index}
              count={steps.length}
              canRemove={steps.length > 1}
              onMove={(delta) => {
                setSteps(moveItem(steps, index, delta));
              }}
              onRemove={() => {
                setSteps(removeAt(steps, index));
              }}
            />
          }
        >
          <StepFields
            step={step}
            onChange={(next) => {
              setSteps(replaceAt(steps, index, next));
            }}
          />
        </ItemCard>
      ))}
      <AddButton
        onClick={() => {
          setSteps([
            ...steps,
            {
              id: newId('step'),
              label: '',
              caption: '',
              title: '',
              location: '',
              bring: [],
              tasks: [{ id: newId('task'), text: '' }],
              notice: '',
            },
          ]);
        }}
      >
        Agregar paso
      </AddButton>
    </EditorFrame>
  );
}
