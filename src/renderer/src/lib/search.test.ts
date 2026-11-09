import { describe, expect, it } from 'vitest';

import { normalizeText, searchTopics } from './search';

const topics = [
  { item: 'enrollment', title: 'Mi ruta de inscripción', keywords: ['caja', 'asesoría'] },
  { item: 'grades', title: 'Consulta de notas', keywords: ['biblioteca', 'cédula'] },
  { item: 'rules', title: 'Normas y carnet', keywords: ['vestimenta'] },
];

describe('normalizeText', () => {
  it('lowercases and removes accents', () => {
    expect(normalizeText('  Inscripción ÁLGEBRA ')).toBe('inscripcion algebra');
  });
});

describe('searchTopics', () => {
  it('matches titles and keywords ignoring accents', () => {
    expect(searchTopics(topics, 'inscripcion')).toEqual(['enrollment']);
    expect(searchTopics(topics, 'cedula')).toEqual(['grades']);
  });

  it('requires every word of the query', () => {
    expect(searchTopics(topics, 'notas biblioteca')).toEqual(['grades']);
    expect(searchTopics(topics, 'notas caja')).toEqual([]);
  });

  it('ranks title matches first', () => {
    const ranked = searchTopics(
      [
        { item: 'keyword', title: 'Otra cosa', keywords: ['carnet'] },
        { item: 'title', title: 'Carnet', keywords: [] },
      ],
      'carnet',
    );
    expect(ranked).toEqual(['title', 'keyword']);
  });

  it('returns nothing for an empty query and respects the limit', () => {
    expect(searchTopics(topics, '   ')).toEqual([]);
    expect(searchTopics(topics, 'a', 2)).toHaveLength(2);
  });
});
