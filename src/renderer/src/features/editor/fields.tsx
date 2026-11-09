import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { type ReactNode, useId } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { moveItem, removeAt, replaceAt } from '@/lib/list';

export function TextField({
  label,
  value,
  onChange,
  multiline = false,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {multiline ? (
        <Textarea
          id={id}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
          }}
        />
      ) : (
        <Input
          id={id}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
          }}
        />
      )}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Up / down / delete buttons for an item of an editable list. */
export function ItemControls({
  index,
  count,
  onMove,
  onRemove,
  canRemove = true,
}: {
  index: number;
  count: number;
  onMove: (delta: number) => void;
  onRemove: () => void;
  canRemove?: boolean;
}) {
  return (
    <div className="flex shrink-0 gap-1">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label="Subir"
        disabled={index === 0}
        onClick={() => {
          onMove(-1);
        }}
      >
        <ArrowUp />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label="Bajar"
        disabled={index === count - 1}
        onClick={() => {
          onMove(1);
        }}
      >
        <ArrowDown />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label="Eliminar"
        disabled={!canRemove}
        onClick={onRemove}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 />
      </Button>
    </div>
  );
}

/** Editable list of short texts (requirements, steps, …). */
export function StringListField({
  label,
  values,
  onChange,
  addLabel,
}: {
  label: string;
  values: readonly string[];
  onChange: (values: string[]) => void;
  addLabel: string;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-1.5 text-sm font-medium">{label}</legend>
      {values.map((value, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            aria-label={`${label} ${index + 1}`}
            value={value}
            onChange={(e) => {
              onChange(replaceAt(values, index, e.target.value));
            }}
          />
          <ItemControls
            index={index}
            count={values.length}
            onMove={(delta) => {
              onChange(moveItem(values, index, delta));
            }}
            onRemove={() => {
              onChange(removeAt(values, index));
            }}
          />
        </div>
      ))}
      <AddButton
        onClick={() => {
          onChange([...values, '']);
        }}
      >
        {addLabel}
      </AddButton>
    </fieldset>
  );
}

export function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick}>
      <Plus />
      {children}
    </Button>
  );
}

/** Groups the fields of one item (a step, a subject…) inside a card. */
export function ItemCard({
  title,
  controls,
  children,
}: {
  title: string;
  controls?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-brand">{title}</h3>
        {controls}
      </div>
      {children}
    </div>
  );
}
