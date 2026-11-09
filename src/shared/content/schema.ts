/**
 * Estructura (esquema) de todo el contenido editable del manual.
 *
 * Todo el manual es un único documento de datos (JSON) que debe cumplir las
 * reglas de este archivo: qué campos tiene cada pantalla, cuántos caracteres
 * caben en cada texto, qué listas son obligatorias, etc. Gracias a eso la
 * escuela puede actualizar el contenido desde la app sin tocar el código.
 *
 * Las reglas se escriben con Zod (una librería que valida datos) y los
 * mensajes de error están en español porque se muestran en los formularios.
 *
 * Lo usan:
 * - el proceso principal, para validar los paquetes firmados
 *   (`src/main/content/signing.ts`);
 * - la interfaz, para validar los formularios del modo edición
 *   (los archivos `*-editor.tsx` de `src/renderer/src/features/`).
 * El contenido original que cumple este esquema está en `./default-content.ts`.
 */
import { z } from 'zod';

import { LINKABLE_PAGE_IDS } from './pages';

// ---------------------------------------------------------------------------
// Reglas básicas reutilizables (textos, identificadores, códigos de materia)
// ---------------------------------------------------------------------------

const EMPTY_MESSAGE = 'Este campo no puede estar vacío.';

// Texto obligatorio de hasta `max` caracteres (se ignoran espacios al inicio y al final).
const text = (max: number) =>
  z.string().trim().min(1, EMPTY_MESSAGE).max(max, `Máximo ${max} caracteres.`);

// Texto opcional: si se deja vacío, ese elemento no se muestra en la pantalla.
const optionalText = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres.`);

// Identificador interno de cada elemento (minúsculas, números y guiones).
const idSchema = z.string().regex(/^[a-z0-9-]{1,64}$/, 'Identificador inválido.');

// Código de una materia: exactamente 7 dígitos.
export const subjectCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{7}$/, 'El código debe tener 7 dígitos.');

// A quién va dirigido un elemento: estudiantes o docentes.
export const audienceSchema = z.enum(['student', 'teacher']);
export type Audience = z.infer<typeof audienceSchema>;

// ---------------------------------------------------------------------------
// Pantalla de inicio
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Pantalla de inscripción (pasos del proceso)
// ---------------------------------------------------------------------------

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
  /** Aviso destacado; si se deja vacío, no se muestra. */
  notice: optionalText(400),
});
export type EnrollmentStep = z.infer<typeof enrollmentStepSchema>;

const enrollmentSchema = z.object({
  title: text(120),
  intro: text(400),
  steps: z.array(enrollmentStepSchema).min(1, 'Agrega al menos un paso.').max(10),
});

// ---------------------------------------------------------------------------
// Pantalla de consulta de notas
// ---------------------------------------------------------------------------

const gradesSchema = z.object({
  title: text(120),
  intro: text(400),
  location: text(160),
  username: text(120),
  password: text(120),
  steps: z.array(text(200)).min(1, 'Agrega al menos un paso.').max(10),
  /** Nota adicional; si se deja vacía, no se muestra. */
  note: optionalText(400),
});

// ---------------------------------------------------------------------------
// Pantalla de prelaciones (materias y sus requisitos)
// ---------------------------------------------------------------------------

export const subjectSchema = z.object({
  code: subjectCodeSchema,
  name: text(80),
  /** Unidades de crédito; `null` cuando el manual no las indica. */
  credits: z.number().int().min(1).max(12).nullable(),
});
export type Subject = z.infer<typeof subjectSchema>;

// Materia del semestre siguiente: además lleva los códigos de sus prelaciones.
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
  // Revisiones extra: ningún código de materia repetido, y cada prelación
  // debe ser una materia del primer semestre.
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

// ---------------------------------------------------------------------------
// Páginas tipo "artículo" (texto con secciones: pasos, viñetas o listas)
// ---------------------------------------------------------------------------

/** Cómo se muestran los elementos de una sección: numerados, con viñetas o como lista de verificación. */
export const sectionStyleSchema = z.enum(['numbered', 'bulleted', 'checklist']);
export type SectionStyle = z.infer<typeof sectionStyleSchema>;

// Tono de un aviso: advertencia o información.
export const noticeToneSchema = z.enum(['warning', 'info']);
export type NoticeTone = z.infer<typeof noticeToneSchema>;

export const articleSectionSchema = z.object({
  id: idSchema,
  title: text(120),
  /** Párrafo de introducción de la sección; si se deja vacío, no se muestra. */
  body: optionalText(800),
  style: sectionStyleSchema,
  items: z.array(text(400)).max(20),
  /** Mensaje destacado; si se deja vacío, no se muestra. */
  notice: optionalText(400),
  noticeTone: noticeToneSchema,
});
export type ArticleSection = z.infer<typeof articleSectionSchema>;

/** Una página genérica: título, introducción y secciones de pasos, viñetas o listas. */
export const articleSchema = z.object({
  title: text(120),
  intro: text(600),
  sections: z.array(articleSectionSchema).min(1, 'Agrega al menos una sección.').max(12),
});
export type Article = z.infer<typeof articleSchema>;

/** Partes del contenido que se muestran con la página genérica de artículo. */
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

// ---------------------------------------------------------------------------
// Calendario académico de docentes (cortes de evaluación y fechas clave)
// ---------------------------------------------------------------------------

// Un corte de evaluación: nombre, porcentaje de la nota y semanas que abarca.
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
  /** Semana del hito; 0 = antes de que empiece el semestre. */
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
  // Revisiones extra: semanas en orden y dentro del semestre, y porcentajes
  // de los cortes que sumen exactamente 100%.
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

// ---------------------------------------------------------------------------
// Preguntas frecuentes
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Directorio de oficinas
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// El manual completo: une todas las pantallas anteriores
// ---------------------------------------------------------------------------

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
  // Revisión extra: dentro de cada lista no puede haber identificadores repetidos.
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

// ---------------------------------------------------------------------------
// Estado del contenido que se envía a la interfaz
// ---------------------------------------------------------------------------

/** De dónde viene el contenido que se muestra: el original de la app o un paquete firmado. */
export const contentSourceSchema = z.enum(['bundled', 'signed-package']);
export type ContentSource = z.infer<typeof contentSourceSchema>;

/** Lo que la interfaz debe mostrar en este momento, más el estado del modo edición. */
export const contentStateSchema = z.object({
  content: manualContentSchema,
  source: contentSourceSchema,
  /** Fecha en que se publicó el paquete firmado; `null` para el contenido original. */
  publishedAt: z.iso.datetime().nullable(),
  /** Aviso cuando se rechazó el contenido guardado y se volvió al contenido original. */
  warning: z.string().nullable(),
  /** Si esta instalación tiene la llave maestra y puede verificar paquetes firmados. */
  signingConfigured: z.boolean(),
  /** Si hay una llave de edición abierta en esta sesión (permite editar). */
  editorUnlocked: z.boolean(),
  /** Fecha de la llave de edición más nueva vista en este computador; las más antiguas se rechazan. */
  activeKeyIssuedAt: z.iso.datetime().nullable(),
});
export type ContentState = z.infer<typeof contentStateSchema>;

/** Convierte los errores de validación en mensajes cortos en español para la interfaz. */
export function describeIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => issue.message);
}
