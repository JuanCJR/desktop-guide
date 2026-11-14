import { describe, expect, it } from 'vitest';

import { DEFAULT_CONTENT } from './default-content';
import { fillMissingSections } from './migrate';
import { manualContentSchema } from './schema';

describe('fillMissingSections', () => {
  it('adds the sections an older package does not have', () => {
    const { teacherRules: _rules, teacherEvaluation: _evaluation, ...older } = DEFAULT_CONTENT;
    const filled = fillMissingSections(older, DEFAULT_CONTENT) as typeof DEFAULT_CONTENT;
    expect(filled.teacherRules).toEqual(DEFAULT_CONTENT.teacherRules);
    expect(filled.teacherEvaluation).toEqual(DEFAULT_CONTENT.teacherEvaluation);
    expect(manualContentSchema.safeParse(filled).success).toBe(true);
  });

  it('keeps the sections the package already has', () => {
    const edited = { ...DEFAULT_CONTENT, home: { ...DEFAULT_CONTENT.home, title: 'Editado' } };
    const { teacherRules: _rules, ...older } = edited;
    const filled = fillMissingSections(older, DEFAULT_CONTENT) as typeof DEFAULT_CONTENT;
    expect(filled.home.title).toBe('Editado');
  });

  it('does not repair sections that exist but are invalid', () => {
    const broken = { ...DEFAULT_CONTENT, home: null };
    const filled = fillMissingSections(broken, DEFAULT_CONTENT);
    expect(manualContentSchema.safeParse(filled).success).toBe(false);
  });

  it.each([null, 'text', 42, ['a']])('returns non-objects unchanged: %j', (value) => {
    expect(fillMissingSections(value, DEFAULT_CONTENT)).toBe(value);
  });
});
