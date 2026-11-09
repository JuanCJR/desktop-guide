import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utilidad de estilos: combina clases de Tailwind (el sistema de estilos de la
 * interfaz) y resuelve conflictos entre ellas. La usan casi todos los
 * componentes visuales. Es la convención de shadcn/ui.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
