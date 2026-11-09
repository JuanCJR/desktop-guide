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

export const manualContentSchema = z
  .object({
    schemaVersion: z.literal(1),
    home: homeSchema,
    enrollment: enrollmentSchema,
    grades: gradesSchema,
    prerequisites: prerequisitesSchema,
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
