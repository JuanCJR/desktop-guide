import { describe, expect, it } from 'vitest';

import { DEFAULT_CONTENT } from './default-content';
import { dependentsOf, evaluatePrerequisites } from './prerequisites';

const { firstSemester, secondSemester } = DEFAULT_CONTENT.prerequisites;

function blockedNames(failed: string[]) {
  return evaluatePrerequisites(firstSemester, secondSemester, new Set(failed))
    .filter((result) => result.blockedBy.length > 0)
    .map((result) => result.subject.name);
}

describe('evaluatePrerequisites', () => {
  it('keeps everything available when nothing was failed', () => {
    expect(blockedNames([])).toEqual([]);
  });

  it('failing Matemática I blocks Matemática II, Física I and Álgebra Lineal', () => {
    expect(blockedNames(['4701141'])).toEqual(['Matemática II', 'Física I', 'Álgebra Lineal']);
  });

  it('failing Álgebra only blocks Álgebra Lineal', () => {
    expect(blockedNames(['4701131'])).toEqual(['Álgebra Lineal']);
  });

  it('failing either introduction blocks Lenguaje de Programación I', () => {
    expect(blockedNames(['4705121'])).toEqual(['Lenguaje de Programación I']);
    expect(blockedNames(['4704121'])).toEqual(['Lenguaje de Programación I']);
  });

  it('lists every failed prerequisite that blocks a subject', () => {
    const result = evaluatePrerequisites(
      firstSemester,
      secondSemester,
      new Set(['4701131', '4701141']),
    ).find((r) => r.subject.code === '4701232');
    expect(result?.blockedBy.map((s) => s.name)).toEqual(['Álgebra', 'Matemática I']);
  });

  it('ignores failed codes that are not prerequisites', () => {
    expect(blockedNames(['0000000'])).toEqual([]);
  });
});

describe('dependentsOf', () => {
  it('lists the subjects that require a given subject', () => {
    expect(dependentsOf('4701141', secondSemester)).toEqual([
      'Matemática II',
      'Física I',
      'Álgebra Lineal',
    ]);
    expect(dependentsOf('4704121', secondSemester)).toEqual(['Lenguaje de Programación I']);
  });
});
