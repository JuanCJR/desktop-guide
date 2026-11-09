import type { NextSubject, Subject } from './schema';

export interface SubjectAvailability {
  subject: NextSubject;
  /** Failed first-semester subjects that block this one; empty when available. */
  blockedBy: Subject[];
}

/**
 * Evaluates which next-semester subjects a student may enroll in, given the
 * codes of the first-semester subjects they failed. A subject is blocked when
 * any of its prerequisites was failed.
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

/** Names of the subjects that require the given first-semester subject. */
export function dependentsOf(code: string, secondSemester: readonly NextSubject[]): string[] {
  return secondSemester.filter((s) => s.prerequisites.includes(code)).map((s) => s.name);
}
