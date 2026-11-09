import { describe, expect, it } from 'vitest';

import { DEFAULT_CONTENT } from './default-content';
import { dependentsOf, evaluatePrerequisites, sumCredits } from './prerequisites';

const { firstSemester, secondSemester } = DEFAULT_CONTENT.prerequisites;

function blockedNames(failed: string[]) {
  return evaluatePrerequisites(firstSemester, secondSemester, new Set(failed))
    .filter((result) => result.blockedBy.length > 0)
    .map((result) => result.subject.name);
}

describe('Plan 2011 data', () => {
  it('has every subject of the 1st and 2nd semester with their credits', () => {
    expect(firstSemester).toHaveLength(9);
    expect(secondSemester).toHaveLength(9);
    expect(sumCredits(firstSemester)).toBe(19);
    expect(sumCredits(secondSemester)).toBe(20);
  });
});

describe('evaluatePrerequisites', () => {
  it('keeps everything available when nothing was failed', () => {
    expect(blockedNames([])).toEqual([]);
  });

  it('failing Matemática I blocks Matemática II, Álgebra Lineal and Física I', () => {
    expect(blockedNames(['4701141'])).toEqual(['Matemática II', 'Álgebra Lineal', 'Física I']);
  });

  it('failing Álgebra only blocks Álgebra Lineal', () => {
    expect(blockedNames(['4701131'])).toEqual(['Álgebra Lineal']);
  });

  it('failing either introduction blocks Lenguaje de Programación I', () => {
    expect(blockedNames(['4705121'])).toEqual(['Lenguaje de Programación I']);
    expect(blockedNames(['4704121'])).toEqual(['Lenguaje de Programación I']);
  });

  it('never blocks subjects without prerequisites', () => {
    const everything = firstSemester.map((subject) => subject.code);
    const free = evaluatePrerequisites(firstSemester, secondSemester, new Set(everything))
      .filter((result) => result.blockedBy.length === 0)
      .map((result) => result.subject.name);
    expect(free).toEqual([
      'Introducción a la Administración',
      'Economía General',
      'Educación, Salud Física y Deportes II',
      'Actividad de Formación Cultural II',
      'Inglés I',
    ]);
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
    expect(blockedNames(['0000000', '4701121'])).toEqual([]);
  });
});

describe('dependentsOf', () => {
  it('lists the subjects that require a given subject', () => {
    expect(dependentsOf('4701141', secondSemester)).toEqual([
      'Matemática II',
      'Álgebra Lineal',
      'Física I',
    ]);
    expect(dependentsOf('4704121', secondSemester)).toEqual(['Lenguaje de Programación I']);
    expect(dependentsOf('4701121', secondSemester)).toEqual([]);
  });
});

describe('sumCredits', () => {
  it('adds credits and counts unknown credits as 0', () => {
    expect(sumCredits([{ credits: 2 }, { credits: null }, { credits: 3 }])).toBe(5);
    expect(sumCredits([])).toBe(0);
  });
});
