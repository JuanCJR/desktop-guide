/**
 * Campos de selección y de número para los formularios de edición (por
 * ejemplo, elegir "Estudiantes" o "Docentes", o indicar una semana).
 */
import { useId } from 'react';

import { Label } from '@/components/ui/label';

// Estilo compartido por los campos de selección y de número.
export const selectClass =
  'h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

/** Lista desplegable con su etiqueta; `options` asocia cada valor con el texto que se ve. */
export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (value: T) => void;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        className={selectClass}
        value={value}
        onChange={(e) => {
          const match = options.find(([option]) => option === e.target.value);
          if (match) onChange(match[0]);
        }}
      >
        {options.map(([option, text]) => (
          <option key={option} value={option}>
            {text}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Campo de número entero con su etiqueta. Si se deja vacío o es inválido, usa `fallback`. */
export function NumberField({
  label,
  value,
  min,
  max,
  onChange,
  fallback = 0,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  fallback?: number;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        className={selectClass}
        value={value}
        onChange={(e) => {
          const parsed = Number.parseInt(e.target.value, 10);
          onChange(Number.isNaN(parsed) ? fallback : parsed);
        }}
      />
    </div>
  );
}
