/**
 * Catálogo de los videos explicativos que trae la app.
 *
 * Cada video (archivo `.mp4` y sus subtítulos `.vtt`) vive en
 * `@/assets/videos/`; Vite los copia al build y aquí se obtiene su dirección.
 * Las secciones de las páginas de texto eligen qué video muestran con su campo
 * `video` (ver `src/shared/content/videos.ts`); el reproductor está en
 * `@/components/video-player.tsx` y la lista para elegir, en el editor de
 * artículos (`@/features/article/article-editor.tsx`).
 */
import daceGradesSubs from '@/assets/videos/dace-grades.vtt?url';
import daceGrades from '@/assets/videos/dace-grades.mp4';
import saiaAssignmentSubs from '@/assets/videos/saia-assignment.vtt?url';
import saiaAssignment from '@/assets/videos/saia-assignment.mp4';
import saiaClassroomSubs from '@/assets/videos/saia-classroom.vtt?url';
import saiaClassroom from '@/assets/videos/saia-classroom.mp4';
import saiaIntroSubs from '@/assets/videos/saia-intro.vtt?url';
import saiaIntro from '@/assets/videos/saia-intro.mp4';
import saiaStudentSubs from '@/assets/videos/saia-student.vtt?url';
import saiaStudent from '@/assets/videos/saia-student.mp4';
import type { VideoId } from '@shared/content/videos';

export interface VideoInfo {
  /** Nombre que se ve en el editor y debajo del video. */
  title: string;
  /** Duración aproximada, solo para mostrarla. */
  duration: string;
  src: string;
  subtitles: string;
  /**
   * Proporción del video (clase de Tailwind), para reservar su espacio antes
   * de que cargue. El de estudiantes incluye la barra del navegador.
   */
  aspect: string;
}

export const VIDEOS: Record<VideoId, VideoInfo> = {
  'saia-intro': {
    title: 'Recorrido por SAIA para docentes',
    duration: '1:32',
    src: saiaIntro,
    subtitles: saiaIntroSubs,
    aspect: 'aspect-[1920/872]',
  },
  'dace-grades': {
    title: 'Aula DACE: descargar y entregar las actas de notas',
    duration: '4:47',
    src: daceGrades,
    subtitles: daceGradesSubs,
    aspect: 'aspect-[1920/872]',
  },
  'saia-classroom': {
    title: 'Tu aula virtual: unidades, clases en Teams y evaluaciones',
    duration: '4:08',
    src: saiaClassroom,
    subtitles: saiaClassroomSubs,
    aspect: 'aspect-[1920/872]',
  },
  'saia-assignment': {
    title: 'Crear una tarea o evaluación en SAIA',
    duration: '5:28',
    src: saiaAssignment,
    subtitles: saiaAssignmentSubs,
    aspect: 'aspect-[1920/872]',
  },
  'saia-student': {
    title: 'Cómo entrar y usar SAIA (estudiantes)',
    duration: '1:40',
    src: saiaStudent,
    subtitles: saiaStudentSubs,
    aspect: 'aspect-[1918/1020]',
  },
};
