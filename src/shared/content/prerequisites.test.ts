import { describe, expect, it } from 'vitest';

import { DEFAULT_CONTENT } from './default-content';
import { dependentsOf, evaluatePrerequisites, sumCredits } from './prerequisites';

const { firstSemester, secondSemester } = DEFAULT_CONTENT.prerequisites;

function blockedNames(failed: string[]) {
  return evaluatePrerequisites(firstSemester, secondSemester, new Set(failed))
    .filter((result) => result.blockedBy.length > 0)
    .map((result) => result.subject.name);
}

// Pensum oficial de Ingeniería de Sistemas (47), lapso 2012-1: código → [UC, prelaciones].
// Copiado a mano de la hoja de la escuela para comprobar que los datos del
// manual coinciden con él.
const OFFICIAL_FIRST: Record<string, number> = {
  '4701111': 1,
  '4701121': 2,
  '4701131': 3,
  '4701141': 4,
  '4702111': 1,
  '4702121': 2,
  '4703121': 2,
  '4704121': 2,
  '4705121': 2,
};
const OFFICIAL_SECOND: Record<string, [number, string[]]> = {
  '4701112': [1, []],
  '4701122': [2, []],
  '4701222': [2, ['4704121', '4705121']],
  '4701232': [3, ['4701131', '4701141']],
  '4701242': [4, ['4701141']],
  '4702112': [1, []],
  '4702222': [2, []],
  '4702232': [3, ['4701141']],
  '4703222': [2, []],
};

describe('official pensum data (lapso 2012-1)', () => {
  it('has every subject of the 1st and 2nd semester with their credits', () => {
    expect(firstSemester).toHaveLength(9);
    expect(secondSemester).toHaveLength(9);
    expect(sumCredits(firstSemester)).toBe(19);
    expect(sumCredits(secondSemester)).toBe(20);
  });

  it('matches the official codes and credits of the 1st semester', () => {
    expect(Object.fromEntries(firstSemester.map((s) => [s.code, s.credits]))).toEqual(
      OFFICIAL_FIRST,
    );
  });

  it('matches the official codes, credits and prerequisites of the 2nd semester', () => {
    expect(
      Object.fromEntries(
        secondSemester.map((s) => [s.code, [s.credits, [...s.prerequisites].sort()]]),
      ),
    ).toEqual(OFFICIAL_SECOND);
  });

  it('only uses prerequisites that are 1st semester subjects', () => {
    const codes = new Set(firstSemester.map((s) => s.code));
    for (const subject of secondSemester) {
      for (const code of subject.prerequisites) expect(codes.has(code)).toBe(true);
    }
  });
});

describe('every combination of failed subjects', () => {
  it('blocks a subject exactly when one of its official prerequisites was failed', () => {
    const codes = Object.keys(OFFICIAL_FIRST);
    // 2^9 = 512 combinaciones posibles de materias reprobadas.
    for (let mask = 0; mask < 1 << codes.length; mask++) {
      const failed = new Set(codes.filter((_, i) => (mask >> i) & 1));
      for (const { subject, blockedBy } of evaluatePrerequisites(
        firstSemester,
        secondSemester,
        failed,
      )) {
        const official = OFFICIAL_SECOND[subject.code]?.[1] ?? [];
        const expected = official.filter((code) => failed.has(code)).sort();
        expect(blockedBy.map((s) => s.code).sort()).toEqual(expected);
      }
    }
  });
});

describe('evaluatePrerequisites', () => {
  it('keeps everything available when nothing was failed', () => {
    expect(blockedNames([])).toEqual([]);
  });

  it('failing Matemáticas I blocks Matemáticas II, Álgebra Lineal and Física I', () => {
    expect(blockedNames(['4701141'])).toEqual(['Matemáticas II', 'Álgebra Lineal', 'Física I']);
  });

  it('failing Álgebra I only blocks Álgebra Lineal', () => {
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
    expect(result?.blockedBy.map((s) => s.name)).toEqual(['Álgebra I', 'Matemáticas I']);
  });

  it('ignores failed codes that are not prerequisites', () => {
    expect(blockedNames(['0000000', '4701121'])).toEqual([]);
  });
});

describe('dependentsOf', () => {
  it('lists the subjects that require a given subject', () => {
    expect(dependentsOf('4701141', secondSemester)).toEqual([
      'Matemáticas II',
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
