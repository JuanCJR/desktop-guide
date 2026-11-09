/**
 * Cálculo de prelaciones (materias que dependen de otras).
 *
 * Con estas funciones la pantalla de prelaciones
 * (`src/renderer/src/features/prerequisites/`) le muestra al estudiante qué
 * materias del semestre siguiente puede inscribir según las que reprobó, y
 * cuántas unidades de crédito suman. Los datos de las materias vienen del
 * contenido del manual (`./schema.ts`).
 */
import type { NextSubject, Subject } from './schema';

export interface SubjectAvailability {
  subject: NextSubject;
  /** Materias reprobadas del primer semestre que bloquean esta; vacío si está disponible. */
  blockedBy: Subject[];
}

/**
 * Calcula qué materias del semestre siguiente puede inscribir un estudiante,
 * según los códigos de las materias del primer semestre que reprobó. Una
 * materia queda bloqueada si reprobó cualquiera de sus prelaciones.
 */
export function evaluatePrerequisites(
  firstSemester: readonly Subject[],
  secondSemester: readonly NextSubject[],
  failedCodes: ReadonlySet<string>,
): SubjectAvailability[] {
  const byCode = new Map(firstSemester.map((subject) => [subject.code, subject]));
  return secondSemester.map((subject) => ({
    subject,
    blockedBy: subject.prerequisites
      .filter((code) => failedCodes.has(code))
      .map((code) => byCode.get(code))
      .filter((s): s is Subject => s !== undefined),
  }));
}

/** Nombres de las materias que requieren la materia del primer semestre indicada. */
export function dependentsOf(code: string, secondSemester: readonly NextSubject[]): string[] {
  return secondSemester.filter((s) => s.prerequisites.includes(code)).map((s) => s.name);
}

/** Total de unidades de crédito de las materias; las que no tienen créditos cuentan 0. */
export function sumCredits(subjects: readonly { credits: number | null }[]): number {
  return subjects.reduce((total, subject) => total + (subject.credits ?? 0), 0);
}
