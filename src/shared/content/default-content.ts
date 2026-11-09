import type { ManualContent } from './schema';

/**
 * Content bundled with the installer. It is shown until the school publishes
 * a signed content package. Source: "Manual Informativo de Apoyo para la
 * Inducción de Docentes y Estudiantes de Nuevo Ingreso" (Escuela 47, 2026).
 */
export const DEFAULT_CONTENT: ManualContent = {
  schemaVersion: 1,
  home: {
    title: 'Bienvenido a la Escuela de Ingeniería de Sistemas',
    intro:
      'Todo lo que necesitas para arrancar tu semestre: pasos, requisitos, fechas y a qué oficina ir. Elige tu perfil para ver tu ruta.',
    studentCard: {
      title: 'Soy estudiante',
      description:
        'Voy a inscribir el 2º semestre. Quiero saber los pasos, qué materias puedo ver y dónde consultar mis notas.',
    },
    teacherCard: {
      title: 'Soy docente nuevo',
      description:
        'Me incorporo a la escuela. Necesito el expediente, la PGA, el calendario de cortes y cómo cargar notas.',
    },
    quickLinks: [
      {
        id: 'enrollment-steps',
        title: 'Inscripción en 5 pasos',
        description: 'Biblioteca → Caja → Cartelera → Asesoría → DACE.',
        audience: 'student',
        target: 'enrollment',
      },
      {
        id: 'prerequisites-simulator',
        title: '¿Qué materias me bloquean?',
        description: 'Simulacro de prelaciones de 1º a 2º semestre.',
        audience: 'student',
        target: 'prerequisites',
      },
      {
        id: 'grades',
        title: '¿Dónde veo mis notas?',
        description: 'En la computadora de la Biblioteca, con tu cédula.',
        audience: 'student',
        target: 'grades',
      },
      {
        id: 'cut-off-dates',
        title: 'Fechas de corte',
        description: 'Semanas 6, 12 y 18. Pre-validación una semana antes.',
        audience: 'teacher',
        target: 'teacher-calendar',
      },
      {
        id: 'pga-deadline',
        title: 'PGA: fecha límite',
        description: 'Una por materia, cargada en SAIA antes de terminar la semana 2.',
        audience: 'teacher',
        target: 'teacher-saia',
      },
      {
        id: 'medical-excuse',
        title: 'Justificativo médico',
        description: 'Tienes de 48 a 72 horas hábiles para consignarlo en DACE.',
        audience: 'student',
        target: 'procedures',
      },
    ],
  },
  enrollment: {
    title: 'Inscripción al 2º semestre',
    intro:
      'Desde el 2º semestre la inscripción ya no es automática: la haces tú siguiendo estos 5 pasos en orden.',
    steps: [
      {
        id: 'library',
        label: 'Biblioteca',
        caption: 'récord de notas',
        title: 'Verifica tu récord en la Biblioteca',
        location: 'Biblioteca Central · Edificio Principal, planta baja',
        bring: ['Número de cédula de identidad'],
        tasks: [
          { id: 'library-check-record', text: 'Consulta tu récord de calificaciones' },
          {
            id: 'library-passed-failed',
            text: 'Anota qué materias aprobaste y cuáles reprobaste en 1er semestre',
          },
        ],
        notice: '',
      },
      {
        id: 'cashier',
        label: 'Caja',
        caption: 'pago de matrícula',
        title: 'Paga la matrícula en Caja',
        location: 'Edificio Principal · Módulo de Taquillas',
        bring: ['Récord de notas verificado'],
        tasks: [
          { id: 'cashier-pay', text: 'Cancela el arancel de inscripción del nuevo lapso' },
          { id: 'cashier-first-fee', text: 'Cancela la primera cuota académica' },
          { id: 'cashier-receipt', text: 'Guarda el comprobante de pago' },
        ],
        notice: 'Sin el comprobante de pago no podrás formalizar la inscripción en el paso 5.',
      },
      {
        id: 'board',
        label: 'Cartelera',
        caption: 'arma tu pre-horario',
        title: 'Consulta la oferta en la cartelera',
        location: 'Cartelera informativa de la Escuela de Ingeniería de Sistemas',
        bring: [],
        tasks: [
          { id: 'board-offer', text: 'Revisa las materias ofertadas, secciones y turnos' },
          {
            id: 'board-prerequisites',
            text: 'Verifica que no tengas materias bloqueadas por prelación',
          },
          { id: 'board-draft', text: 'Arma tu borrador de horario sin choques de hora' },
          { id: 'board-form', text: 'Llena la planilla de asesoría' },
        ],
        notice: '',
      },
      {
        id: 'advising',
        label: 'Asesoría',
        caption: 'Jefe de Escuela',
        title: 'Asesoría con el Jefe de Escuela',
        location: 'Jefatura de Escuela · Edificio Principal, primer piso',
        bring: ['Propuesta de horario', 'Planilla de asesoría llena'],
        tasks: [
          {
            id: 'advising-review',
            text: 'La coordinación revisa el pensum y las prelaciones de tu propuesta',
          },
          { id: 'advising-stamp', text: 'Obtén la firma y el sello húmedo de aprobación' },
        ],
        notice:
          'DACE no procesa ninguna inscripción sin la planilla de asesoría firmada y con el sello húmedo de la Jefatura de Escuela.',
      },
      {
        id: 'dace',
        label: 'DACE',
        caption: 'horario definitivo',
        title: 'Formaliza tu inscripción con DACE',
        location: 'Área de laboratorios de computación',
        bring: ['Planilla de asesoría sellada', 'Comprobante de pago de Caja'],
        tasks: [
          {
            id: 'dace-load',
            text: 'El personal de Control de Estudios carga tus materias en el sistema',
          },
          { id: 'dace-print', text: 'Recibe tu horario oficial definitivo impreso' },
        ],
        notice: '',
      },
    ],
  },
  grades: {
    title: '¿Dónde consulto mis notas?',
    intro:
      'Tus calificaciones finales de cada período se consultan en la computadora de la Biblioteca Central.',
    location: 'Biblioteca Central · Edificio Principal, planta baja',
    username: 'Tu número de cédula',
    password: 'Los 5 primeros números de tu cédula',
    steps: [
      'Ve a la Biblioteca Central y ubica la computadora de consulta.',
      'En usuario, escribe tu número de cédula.',
      'En contraseña, escribe los 5 primeros números de tu cédula.',
      'Revisa tus calificaciones del período y anota las materias aprobadas y reprobadas.',
    ],
    note: 'Este récord es el que necesitas en el paso 1 de la inscripción al 2º semestre.',
  },
  prerequisites: {
    title: 'Simulador de prelaciones',
    intro:
      'Marca las materias que reprobaste en 1er semestre y mira cuáles de 2º semestre quedarían bloqueadas.',
    disclaimer:
      'Es un simulacro con las materias de 1º a 2º semestre del Pensum 2011 para que entiendas cómo funcionan las prelaciones. No reemplaza la asesoría con el Jefe de Escuela.',
    failedHint:
      'Puedes nivelar las materias reprobadas en el curso intensivo de verano (máximo 2 materias por período).',
    firstSemester: [
      { code: '4701141', name: 'Matemática I', credits: 4 },
      { code: '4701131', name: 'Álgebra', credits: 3 },
      { code: '4705121', name: 'Introducción a la Computación', credits: 2 },
      { code: '4704121', name: 'Introducción a la Ingeniería de Sistemas', credits: 2 },
    ],
    secondSemester: [
      { code: '4701242', name: 'Matemática II', credits: 4, prerequisites: ['4701141'] },
      { code: '4702232', name: 'Física I', credits: 3, prerequisites: ['4701141'] },
      {
        code: '4701232',
        name: 'Álgebra Lineal',
        credits: 3,
        prerequisites: ['4701131', '4701141'],
      },
      {
        code: '4701222',
        name: 'Lenguaje de Programación I',
        credits: null,
        prerequisites: ['4705121', '4704121'],
      },
    ],
  },
};
