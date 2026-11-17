/**
 * Catálogo de las imágenes de referencia que trae la app (cuadros de los
 * videos, con los datos personales difuminados).
 *
 * Los archivos (.webp) viven en `@/assets/images/`; Vite los copia al build y
 * aquí se obtiene su dirección. Las secciones de las páginas de texto eligen sus
 * imágenes con el campo `images` (ver `src/shared/content/images.ts`); la
 * galería que las muestra está en `@/components/image-gallery.tsx` y la lista
 * para elegirlas, en el editor de artículos.
 */
import daceDownloadReports from '@/assets/images/dace-download-reports.webp';
import daceSubmitReports from '@/assets/images/dace-submit-reports.webp';
import saiaAddActivity from '@/assets/images/saia-add-activity.webp';
import saiaAssignmentAvailability from '@/assets/images/saia-assignment-availability.webp';
import saiaCourseTasks from '@/assets/images/saia-course-tasks.webp';
import saiaEditMode from '@/assets/images/saia-edit-mode.webp';
import saiaGradingSummary from '@/assets/images/saia-grading-summary.webp';
import saiaLoginMicrosoft from '@/assets/images/saia-login-microsoft.webp';
import saiaMyCourses from '@/assets/images/saia-my-courses.webp';
import saiaPersonalArea from '@/assets/images/saia-personal-area.webp';
import saiaSaveButtons from '@/assets/images/saia-save-buttons.webp';
import saiaSubmissionTypes from '@/assets/images/saia-submission-types.webp';
import type { ImageId } from '@shared/content/images';

export interface ImageInfo {
  /** Nombre que se ve en el editor; también describe la imagen si no tiene pie de foto. */
  title: string;
  src: string;
}

export const IMAGES: Record<ImageId, ImageInfo> = {
  'saia-login-microsoft': {
    title: 'Estudiantes: entrar con «Microsoft 365»',
    src: saiaLoginMicrosoft,
  },
  'saia-personal-area': { title: 'Estudiantes: Área personal', src: saiaPersonalArea },
  'saia-my-courses': { title: 'Estudiantes: Mis cursos', src: saiaMyCourses },
  'saia-course-tasks': {
    title: 'Estudiantes: tareas y asesorías de una materia',
    src: saiaCourseTasks,
  },
  'dace-download-reports': {
    title: 'Docentes: descarga de actas (Aula DACE)',
    src: daceDownloadReports,
  },
  'dace-submit-reports': {
    title: 'Docentes: entrega de actas (locales y foráneos)',
    src: daceSubmitReports,
  },
  'saia-edit-mode': { title: 'Docentes: Modo de edición activado', src: saiaEditMode },
  'saia-add-activity': {
    title: 'Docentes: «Añadir una actividad o recurso»',
    src: saiaAddActivity,
  },
  'saia-assignment-availability': {
    title: 'Docentes: Disponibilidad de una tarea',
    src: saiaAssignmentAvailability,
  },
  'saia-submission-types': { title: 'Docentes: Tipos de entrega', src: saiaSubmissionTypes },
  'saia-save-buttons': { title: 'Docentes: botones «Guardar cambios…»', src: saiaSaveButtons },
  'saia-grading-summary': { title: 'Docentes: Sumario de calificaciones', src: saiaGradingSummary },
};
