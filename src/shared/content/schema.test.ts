import { describe, expect, it } from 'vitest';

import { DEFAULT_CONTENT } from './default-content';
import { type ManualContent, manualContentSchema } from './schema';

const clone = (): ManualContent => structuredClone(DEFAULT_CONTENT);

describe('manualContentSchema', () => {
  it('accepts the bundled content', () => {
    expect(manualContentSchema.parse(DEFAULT_CONTENT)).toEqual(DEFAULT_CONTENT);
  });

  it('trims texts', () => {
    const content = clone();
    content.home.title = '  Hola  ';
    expect(manualContentSchema.parse(content).home.title).toBe('Hola');
  });

  it('rejects empty required texts', () => {
    const content = clone();
    content.enrollment.title = '   ';
    expect(manualContentSchema.safeParse(content).success).toBe(false);
  });

  it('allows an empty optional notice', () => {
    const content = clone();
    content.grades.note = '';
    expect(manualContentSchema.safeParse(content).success).toBe(true);
  });

  it('rejects malformed subject codes', () => {
    const content = clone();
    content.prerequisites.firstSemester[0] = { code: '47', name: 'Matemática I', credits: 4 };
    expect(manualContentSchema.safeParse(content).success).toBe(false);
  });

  it('rejects prerequisites that are not first-semester subjects', () => {
    const content = clone();
    content.prerequisites.secondSemester[0]?.prerequisites.push('9999999');
    const result = manualContentSchema.safeParse(content);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain('9999999');
  });

  it('rejects repeated subject codes', () => {
    const content = clone();
    content.prerequisites.firstSemester.push({ code: '4701141', name: 'Copia', credits: 1 });
    expect(manualContentSchema.safeParse(content).success).toBe(false);
  });

  it('rejects repeated task ids', () => {
    const content = clone();
    const [first, second] = content.enrollment.steps;
    if (!first || !second) throw new Error('fixture');
    second.tasks.push({ ...first.tasks[0], id: first.tasks[0]?.id ?? '', text: 'Otra' });
    expect(manualContentSchema.safeParse(content).success).toBe(false);
  });

  it('rejects quick links to unknown pages', () => {
    const content = clone() as unknown as { home: { quickLinks: { target: string }[] } };
    const [link] = content.home.quickLinks;
    if (link) link.target = 'nowhere';
    expect(manualContentSchema.safeParse(content).success).toBe(false);
  });

  describe('teacher calendar', () => {
    it('requires the cut percentages to add up to 100', () => {
      const content = clone();
      const [cut] = content.teacherCalendar.cuts;
      if (cut) cut.percent = 50;
      const result = manualContentSchema.safeParse(content);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toContain('100%');
    });

    it('rejects cuts or milestones outside the semester', () => {
      const content = clone();
      const [cut] = content.teacherCalendar.cuts;
      if (cut) cut.toWeek = 25;
      expect(manualContentSchema.safeParse(content).success).toBe(false);

      const other = clone();
      other.teacherCalendar.milestones.push({
        id: 'late',
        week: 19,
        title: 'Tarde',
        description: 'Fuera del semestre',
      });
      expect(manualContentSchema.safeParse(other).success).toBe(false);
    });

    it('rejects a cut whose weeks are reversed', () => {
      const content = clone();
      const [cut] = content.teacherCalendar.cuts;
      if (cut) cut.fromWeek = 6;
      if (cut) cut.toWeek = 1;
      expect(manualContentSchema.safeParse(content).success).toBe(false);
    });
  });

  describe('articles', () => {
    it('require at least one section', () => {
      const content = clone();
      content.rules.sections = [];
      expect(manualContentSchema.safeParse(content).success).toBe(false);
    });

    it('reject repeated section ids', () => {
      const content = clone();
      const [first] = content.summer.sections;
      if (first) content.summer.sections.push({ ...first });
      expect(manualContentSchema.safeParse(content).success).toBe(false);
    });

    it('reject an unknown section style', () => {
      const content = clone() as unknown as { rules: { sections: { style: string }[] } };
      const [first] = content.rules.sections;
      if (first) first.style = 'table';
      expect(manualContentSchema.safeParse(content).success).toBe(false);
    });
  });

  it('rejects repeated FAQ ids', () => {
    const content = clone();
    const [first] = content.faq.items;
    if (first) content.faq.items.push({ ...first });
    expect(manualContentSchema.safeParse(content).success).toBe(false);
  });

  it('bundles FAQ for both audiences and the five offices', () => {
    const audiences = new Set(DEFAULT_CONTENT.faq.items.map((item) => item.audience));
    expect(audiences).toEqual(new Set(['student', 'teacher']));
    expect(DEFAULT_CONTENT.directory.offices).toHaveLength(5);
  });
});
