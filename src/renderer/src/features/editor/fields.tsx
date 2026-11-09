/**
 * Campos reutilizables de los formularios de edición: texto, lista de textos,
 * botones para subir/bajar/eliminar elementos, botón "Agregar" y tarjeta que
 * agrupa los campos de un elemento (un paso, una materia…).
 *
 * Los usan los archivos `*-editor.tsx` de cada pantalla. Los componentes
 * básicos (Input, Button…) vienen de `@/components/ui/` (shadcn/ui).
 */
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { type ReactNode, useId } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { moveItem, removeAt, replaceAt } from '@/lib/list';

/** Campo de texto con su etiqueta; de una línea o de varias (`multiline`). */
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

/** Botones subir / bajar / eliminar de un elemento de una lista editable. */
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

/** Lista editable de textos cortos (requisitos, pasos, …). */
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

/** Botón "Agregar …" para sumar un elemento nuevo a una lista. */
export function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick}>
      <Plus />
      {children}
    </Button>
  );
}

/** Agrupa los campos de un elemento (un paso, una materia…) dentro de una tarjeta. */
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
