import { z } from 'zod';

import { LINKABLE_PAGE_IDS } from './pages';

/**
 * Schema of every editable text of the manual. The whole manual is a single
 * JSON document validated with this schema, so the school can update it
 * without touching code. Shared by main (validation of signed packages) and
 * renderer (validation of the editor forms).
 */

const EMPTY_MESSAGE = 'Este campo no puede estar vacío.';

const text = (max: number) =>
  z.string().trim().min(1, EMPTY_MESSAGE).max(max, `Máximo ${max} caracteres.`);

const optionalText = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres.`);

const idSchema = z.string().regex(/^[a-z0-9-]{1,64}$/, 'Identificador inválido.');

export const subjectCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{7}$/, 'El código debe tener 7 dígitos.');

export const audienceSchema = z.enum(['student', 'teacher']);
export type Audience = z.infer<typeof audienceSchema>;

const roleCardSchema = z.object({
  title: text(60),
  description: text(240),
});

export const quickLinkSchema = z.object({
  id: idSchema,
  title: text(80),
  description: text(200),
  audience: audienceSchema,
  target: z.enum(LINKABLE_PAGE_IDS),
});
export type QuickLink = z.infer<typeof quickLinkSchema>;

const homeSchema = z.object({
  title: text(120),
  intro: text(400),
  studentCard: roleCardSchema,
  teacherCard: roleCardSchema,
  quickLinks: z.array(quickLinkSchema).max(12, 'Máximo 12 accesos.'),
});

export const enrollmentTaskSchema = z.object({
  id: idSchema,
  text: text(200),
});

export const enrollmentStepSchema = z.object({
  id: idSchema,
  label: text(30),
  caption: text(50),
  title: text(120),
  location: text(160),
  bring: z.array(text(160)).max(10),
  tasks: z.array(enrollmentTaskSchema).min(1, 'Agrega al menos una tarea.').max(12),
  /** Highlighted warning; an empty string hides it. */
  notice: optionalText(400),
});
export type EnrollmentStep = z.infer<typeof enrollmentStepSchema>;

const enrollmentSchema = z.object({
  title: text(120),
  intro: text(400),
  steps: z.array(enrollmentStepSchema).min(1, 'Agrega al menos un paso.').max(10),
});

const gradesSchema = z.object({
  title: text(120),
  intro: text(400),
  location: text(160),
  username: text(120),
  password: text(120),
  steps: z.array(text(200)).min(1, 'Agrega al menos un paso.').max(10),
  /** Extra note; an empty string hides it. */
  note: optionalText(400),
});

export const subjectSchema = z.object({
  code: subjectCodeSchema,
  name: text(80),
  /** Credit units; `null` when the manual does not state them. */
  credits: z.number().int().min(1).max(12).nullable(),
});
export type Subject = z.infer<typeof subjectSchema>;

export const nextSubjectSchema = subjectSchema.extend({
  prerequisites: z.array(subjectCodeSchema).max(6),
});
export type NextSubject = z.infer<typeof nextSubjectSchema>;

const prerequisitesSchema = z
  .object({
    title: text(120),
    intro: text(400),
    disclaimer: text(400),
    failedHint: text(400),
    firstSemester: z.array(subjectSchema).min(1).max(12),
    secondSemester: z.array(nextSubjectSchema).min(1).max(12),
  })
  .superRefine((value, ctx) => {
    const firstCodes = new Set(value.firstSemester.map((s) => s.code));
    const allCodes = [...value.firstSemester, ...value.secondSemester].map((s) => s.code);
    const seen = new Set<string>();
    for (const code of allCodes) {
      if (seen.has(code)) {
        ctx.addIssue({ code: 'custom', message: `El código ${code} está repetido.` });
      }
      seen.add(code);
    }
    value.secondSemester.forEach((subject, index) => {
      for (const prerequisite of subject.prerequisites) {
        if (!firstCodes.has(prerequisite)) {
          ctx.addIssue({
            code: 'custom',
            path: ['secondSemester', index, 'prerequisites'],
            message: `${subject.name}: la prelación ${prerequisite} no es una materia de 1er semestre.`,
          });
        }
      }
    });
  });

/** How the items of an article section are shown. */
export const sectionStyleSchema = z.enum(['numbered', 'bulleted', 'checklist']);
export type SectionStyle = z.infer<typeof sectionStyleSchema>;

export const noticeToneSchema = z.enum(['warning', 'info']);
export type NoticeTone = z.infer<typeof noticeToneSchema>;

export const articleSectionSchema = z.object({
  id: idSchema,
  title: text(120),
  /** Intro paragraph of the section; an empty string hides it. */
  body: optionalText(800),
  style: sectionStyleSchema,
  items: z.array(text(400)).max(20),
  /** Highlighted message; an empty string hides it. */
  notice: optionalText(400),
  noticeTone: noticeToneSchema,
});
export type ArticleSection = z.infer<typeof articleSectionSchema>;

/** A generic page: title, intro and sections of steps, bullets or checklists. */
export const articleSchema = z.object({
  title: text(120),
  intro: text(600),
  sections: z.array(articleSectionSchema).min(1, 'Agrega al menos una sección.').max(12),
});
export type Article = z.infer<typeof articleSchema>;

/** Content keys rendered with the generic article page. */
export const ARTICLE_KEYS = [
  'saiaFirstLogin',
  'procedures',
  'summer',
  'rules',
  'teacherOnboarding',
  'teacherSaia',
  'teacherProcedures',
] as const;
export type ArticleKey = (typeof ARTICLE_KEYS)[number];

export const calendarCutSchema = z.object({
  id: idSchema,
  name: text(40),
  percent: z.number().int().min(0).max(100),
  fromWeek: z.number().int().min(1).max(30),
  toWeek: z.number().int().min(1).max(30),
});
export type CalendarCut = z.infer<typeof calendarCutSchema>;

export const milestoneSchema = z.object({
  id: idSchema,
  /** 0 = before the semester starts. */
  week: z.number().int().min(0).max(30),
  title: text(100),
  description: text(400),
});
export type Milestone = z.infer<typeof milestoneSchema>;

const calendarSchema = z
  .object({
    title: text(120),
    intro: text(400),
    totalWeeks: z.number().int().min(4).max(30),
    cuts: z.array(calendarCutSchema).min(1).max(6),
    milestones: z.array(milestoneSchema).max(40),
  })
  .superRefine((value, ctx) => {
    value.cuts.forEach((cut, index) => {
      if (cut.fromWeek > cut.toWeek || cut.toWeek > value.totalWeeks) {
        ctx.addIssue({
          code: 'custom',
          path: ['cuts', index],
          message: `${cut.name}: las semanas deben ir de menor a mayor y no pasar de ${value.totalWeeks}.`,
        });
      }
    });
    const percent = value.cuts.reduce((sum, cut) => sum + cut.percent, 0);
    if (percent !== 100) {
      ctx.addIssue({
        code: 'custom',
        path: ['cuts'],
        message: `Los porcentajes de los cortes suman ${percent}%, deben sumar 100%.`,
      });
    }
    value.milestones.forEach((milestone, index) => {
      if (milestone.week > value.totalWeeks) {
        ctx.addIssue({
          code: 'custom',
          path: ['milestones', index],
          message: `${milestone.title}: la semana ${milestone.week} no existe en el semestre.`,
        });
      }
    });
  });
export type Calendar = z.infer<typeof calendarSchema>;

export const faqItemSchema = z.object({
  id: idSchema,
  audience: audienceSchema,
  question: text(200),
  answer: text(1200),
});
export type FaqItem = z.infer<typeof faqItemSchema>;

const faqSchema = z.object({
  title: text(120),
  intro: text(400),
  items: z.array(faqItemSchema).max(60),
});

export const officeSchema = z.object({
  id: idSchema,
  name: text(120),
  location: text(160),
  services: text(400),
});
export type Office = z.infer<typeof officeSchema>;

const directorySchema = z.object({
  title: text(120),
  intro: text(400),
  offices: z.array(officeSchema).max(30),
});

export const manualContentSchema = z
  .object({
    schemaVersion: z.literal(1),
    home: homeSchema,
    enrollment: enrollmentSchema,
    grades: gradesSchema,
    prerequisites: prerequisitesSchema,
    saiaFirstLogin: articleSchema,
    procedures: articleSchema,
    summer: articleSchema,
    rules: articleSchema,
    teacherOnboarding: articleSchema,
    teacherSaia: articleSchema,
    teacherProcedures: articleSchema,
    teacherCalendar: calendarSchema,
    faq: faqSchema,
    directory: directorySchema,
  })
  .superRefine((value, ctx) => {
    const checkUnique = (ids: string[], label: string) => {
      if (new Set(ids).size !== ids.length) {
        ctx.addIssue({ code: 'custom', message: `Hay identificadores repetidos en ${label}.` });
      }
    };
    checkUnique(
      value.home.quickLinks.map((link) => link.id),
      'los accesos rápidos',
    );
    checkUnique(
      value.enrollment.steps.map((step) => step.id),
      'los pasos de inscripción',
    );
    checkUnique(
      value.enrollment.steps.flatMap((step) => step.tasks.map((task) => task.id)),
      'las tareas de inscripción',
    );
    for (const key of ARTICLE_KEYS) {
      checkUnique(
        value[key].sections.map((section) => section.id),
        `las secciones de «${value[key].title}»`,
      );
    }
    checkUnique(
      value.teacherCalendar.milestones.map((m) => m.id),
      'las fechas del calendario',
    );
    checkUnique(
      value.faq.items.map((item) => item.id),
      'las preguntas frecuentes',
    );
    checkUnique(
      value.directory.offices.map((office) => office.id),
      'el directorio',
    );
  });

export type ManualContent = z.infer<typeof manualContentSchema>;

/** Where the content currently shown comes from. */
export const contentSourceSchema = z.enum(['bundled', 'signed-package']);
export type ContentSource = z.infer<typeof contentSourceSchema>;

/** Snapshot of the content the renderer should display. */
export const contentStateSchema = z.object({
  content: manualContentSchema,
  source: contentSourceSchema,
  /** ISO date when the signed package was published; `null` for bundled content. */
  publishedAt: z.iso.datetime().nullable(),
  /** Set when a stored package was rejected and the app fell back to bundled content. */
  warning: z.string().nullable(),
  /** Whether this installation can verify signed packages at all. */
  signingConfigured: z.boolean(),
  /** Whether an editor key is loaded in this session, enabling edits. */
  editorUnlocked: z.boolean(),
  /** Issue date of the newest editor key seen on this computer; older keys are refused. */
  activeKeyIssuedAt: z.iso.datetime().nullable(),
});
export type ContentState = z.infer<typeof contentStateSchema>;

/** Formats Zod issues as short Spanish messages for the UI. */
export function describeIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => issue.message);
}
