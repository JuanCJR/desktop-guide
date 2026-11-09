/**
 * Contenido ORIGINAL del manual, incluido dentro de la aplicación.
 *
 * Aquí están todos los textos que muestra la app recién instalada: la
 * bienvenida, los pasos de inscripción, las materias y prelaciones, el
 * calendario, las preguntas frecuentes, el directorio, etc. Este contenido se
 * muestra hasta que la escuela publique cambios desde el modo edición (ver
 * `src/main/content/content-service.ts`); también es el contenido al que se
 * vuelve con "restablecer".
 *
 * La forma de estos datos (qué campos lleva cada pantalla y sus límites) está
 * definida en `./schema.ts`. Está dividido en secciones, una por pantalla.
 * Para corregir un texto del contenido original, se edita aquí y se genera
 * un instalador nuevo.
 */
import type { ArticleSection, ManualContent, NoticeTone, SectionStyle } from './schema';

/** Arma una sección de artículo con los campos opcionales vacíos. */
function section(
  id: string,
  title: string,
  style: SectionStyle,
  items: string[],
  extra: { body?: string; notice?: string; noticeTone?: NoticeTone } = {},
): ArticleSection {
  return { id, title, style, items, body: '', notice: '', noticeTone: 'info', ...extra };
}

/**
 * Contenido incluido en el instalador. Se muestra hasta que la escuela publica
 * un paquete de contenido firmado. Fuente: "Manual Informativo de Apoyo para la
 * Inducción de Docentes y Estudiantes de Nuevo Ingreso" (Escuela 47, 2026).
 */
export const DEFAULT_CONTENT: ManualContent = {
  schemaVersion: 1,
  // ----- Pantalla de inicio -----
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
  // ----- Inscripción: pasos del proceso -----
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
  // ----- Consulta de notas -----
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
  // ----- Prelaciones: materias de 1er y 2do semestre -----
  prerequisites: {
    title: 'Simulador de prelaciones',
    intro:
      'Marca las materias que reprobaste en 1er semestre y mira cuáles de 2º semestre quedarían bloqueadas.',
    disclaimer:
      'Es un simulacro con las materias de 1º y 2º semestre del Plan de Estudio 2011 de Ingeniería de Sistemas, para que entiendas cómo funcionan las prelaciones. No reemplaza la asesoría con el Jefe de Escuela.',
    failedHint:
      'Puedes nivelar las materias reprobadas en el curso intensivo de verano (máximo 2 materias por período).',
    firstSemester: [
      { code: '4701121', name: 'Lenguaje y Comunicación', credits: 2 },
      { code: '4703121', name: 'Metodología de la Investigación I', credits: 2 },
      { code: '4701141', name: 'Matemática I', credits: 4 },
      { code: '4702121', name: 'Actividad de Orientación', credits: 2 },
      { code: '4702111', name: 'Educación Física y Deportes I', credits: 1 },
      { code: '4701111', name: 'Actividad de Formación Cultural I', credits: 1 },
      { code: '4704121', name: 'Introducción a la Ingeniería de Sistemas', credits: 2 },
      { code: '4701131', name: 'Álgebra', credits: 3 },
      { code: '4705121', name: 'Introducción a la Computación', credits: 2 },
    ],
    secondSemester: [
      { code: '4703222', name: 'Introducción a la Administración', credits: 2, prerequisites: [] },
      { code: '4702222', name: 'Economía General', credits: 2, prerequisites: [] },
      { code: '4701242', name: 'Matemática II', credits: 4, prerequisites: ['4701141'] },
      {
        code: '4702112',
        name: 'Educación, Salud Física y Deportes II',
        credits: 1,
        prerequisites: [],
      },
      {
        code: '4701112',
        name: 'Actividad de Formación Cultural II',
        credits: 1,
        prerequisites: [],
      },
      { code: '4701122', name: 'Inglés I', credits: 2, prerequisites: [] },
      {
        code: '4701232',
        name: 'Álgebra Lineal',
        credits: 3,
        prerequisites: ['4701131', '4701141'],
      },
      {
        code: '4701222',
        name: 'Lenguaje de Programación I',
        credits: 2,
        prerequisites: ['4704121', '4705121'],
      },
      { code: '4702232', name: 'Física I', credits: 3, prerequisites: ['4701141'] },
    ],
  },
  // ----- Artículo: primer ingreso a SAIA -----
  saiaFirstLogin: {
    title: 'Primer ingreso a SAIA',
    intro:
      'El IUPSM combina clases en aulas físicas con el Sistema de Aprendizaje Interactivo a Distancia (SAIA). Aquí ves cómo saber qué materias son virtuales y cómo entrar por primera vez a la plataforma.',
    sections: [
      section(
        'modalities',
        '¿Presencial o SAIA?',
        'bulleted',
        [
          'Presencial: en tu horario tiene día, bloque de horas y número de aula física en los edificios del campus San Jacinto (por ejemplo, Aula 12, Edif. Maripire). Debes asistir al campus.',
          'A distancia o SAIA: en tu horario aparece con la etiqueta de modalidad virtual. Los contenidos, foros, tareas y evaluaciones se hacen por completo en la plataforma SAIA.',
        ],
        { body: 'Revisa la columna del aula en tu horario oficial de inscripción.' },
      ),
      section(
        'first-login',
        'Primer ingreso paso a paso',
        'numbered',
        [
          'Entra desde el navegador al portal oficial de SAIA del Politécnico Santiago Mariño, extensión Maracay.',
          'Inicia sesión con los datos que te dieron en la matrícula: por lo general, el usuario es tu número de cédula (sin puntos ni letras) y la contraseña es la provisional que asignó el sistema.',
          'La primera vez, el sistema te pedirá cambiar la contraseña por una clave segura personal y verificar tu correo electrónico institucional.',
          'En el panel principal, comprueba que aparezcan todas las materias de tu horario oficial de inscripción.',
        ],
        {
          notice:
            'Si no puedes entrar o no ves tus materias, acude a la Coordinación de SAIA y Tecnología Educativa, en el área de laboratorios de informática.',
        },
      ),
    ],
  },
  // ----- Artículo: trámites y justificativos -----
  procedures: {
    title: 'Trámites y justificativos',
    intro:
      'Los trámites administrativos y la justificación de faltas se hacen por los canales regulares ante Control de Estudios (DACE) y la Jefatura de Escuela.',
    sections: [
      section(
        'medical-excuse',
        'Justificativo médico',
        'numbered',
        [
          'Tienes de 48 a 72 horas hábiles después de la inasistencia para entregar el justificativo.',
          'Consigna el informe médico original, sellado por la institución de salud, en la División de Admisión y Control de Estudios (DACE) para su validación.',
          'Presenta la constancia recibida por DACE en la Jefatura de Escuela de Ingeniería de Sistemas.',
          'Con la notificación de la Jefatura, coordina con tu profesor la evaluación pendiente en la clase de la semana siguiente.',
        ],
        {
          body: 'Si no puedes ir a clases o pierdes una evaluación sumativa por una enfermedad comprobada (incluso si estuviste hospitalizado):',
        },
      ),
      section(
        'documents',
        'Constancias y notas certificadas',
        'numbered',
        [
          'Cancela el arancel del trámite en Caja.',
          'Presenta el comprobante en las taquillas de Control de Estudios (DACE).',
          'DACE emite el documento oficial.',
        ],
        { body: 'Para pedir constancias de estudio o notas certificadas:' },
      ),
      section('lost-id', 'Si pierdes o se daña tu carnet', 'numbered', [
        'Cancela en Caja el arancel por reposición de carnet.',
        'Lleva el comprobante y una copia de tu cédula a Control de Estudios (DACE) para tramitar el duplicado.',
        'Mientras lo emiten, identifícate con el comprobante de pago y tu constancia de estudio.',
      ]),
    ],
  },
  // ----- Artículo: cursos de verano -----
  summer: {
    title: 'Cursos de verano',
    intro:
      'El período intensivo de verano te permite nivelar materias reprobadas o adelantar materias.',
    sections: [
      section('rules', 'Normas', 'bulleted', [
        'Puedes inscribir como máximo 2 materias por período de verano.',
        'Antes, la institución hace un censo estudiantil y publica en cartelera las materias que alcanzaron el mínimo de estudiantes para abrirse.',
      ]),
      section(
        'how-to',
        'Cómo inscribirte',
        'numbered',
        [
          'Verifica en la cartelera que la materia que necesitas fue abierta.',
          'Ve a asesoría en la Jefatura de Escuela para calcular el costo según las unidades de crédito y las horas de la materia.',
          'Cancela el arancel en Caja.',
          'Formaliza tu cupo y tu horario ante Control de Estudios (DACE).',
        ],
        {
          notice:
            'Si reprobaste Matemática I, se recomienda nivelarla en verano: sin ella no puedes inscribir Matemática II, Física I ni Álgebra Lineal.',
        },
      ),
    ],
  },
  // ----- Artículo: normas y carnet -----
  rules: {
    title: 'Normas y carnet',
    intro:
      'El IUPSM exige cumplir el régimen disciplinario, cuidar el decoro y llevar siempre la identificación oficial en todas sus áreas.',
    sections: [
      section(
        'forbidden-clothes',
        'Prendas prohibidas',
        'bulleted',
        [
          'Licras.',
          'Pantalones rotos, rasgados o con desgastes decorativos.',
          'Monos deportivos y shorts.',
          'Blusas escotadas o prendas que atenten contra la moral y el decoro.',
        ],
        {
          body: 'Según la circular de las Jefaturas de Escuelas Administrativas y Tecnológicas, debes asistir vestido de forma pulcra y acorde al entorno universitario.',
          notice:
            'El personal de seguridad no deja entrar con estas prendas, aunque solo vayas a entregar una tarea.',
          noticeTone: 'warning',
        },
      ),
      section('indoor-accessories', 'En aulas, laboratorios, biblioteca y oficinas', 'bulleted', [
        'No se permiten gorras, capuchas, pañoletas ni lentes de sol.',
      ]),
      section('shoes', 'Calzado', 'bulleted', [
        'Usa calzado completamente cerrado en aulas y laboratorios, por seguridad.',
        'No se permite la entrada con sandalias, chancletas ni crocs.',
      ]),
      section(
        'student-id',
        'Carnet estudiantil',
        'bulleted',
        [
          'Llévalo siempre visible, en el pecho o colgado al cuello, desde la garita de acceso y durante toda tu permanencia en la sede.',
          'Te lo pedirán para entrar al recinto, presentar evaluaciones de corte, pedir préstamos en la Biblioteca, pagar en Caja y hacer trámites en Control de Estudios.',
        ],
        {
          notice:
            '¿Aún no tienes carnet? Mientras se hace la jornada de carnetización, lleva tu cédula original y la constancia de inscripción o el horario oficial sellado.',
        },
      ),
    ],
  },
  // ----- Artículo (docentes): ingreso y expediente -----
  teacherOnboarding: {
    title: 'Ingreso y expediente',
    intro:
      'El ingreso a la plantilla docente sigue un protocolo de evaluación curricular, de aptitud y de verificación de documentos ante Recursos Humanos y la Jefatura de Escuela.',
    sections: [
      section('selection', 'Proceso de selección', 'numbered', [
        'Consigna tu currículum vitae actualizado e impreso en el Departamento de Recursos Humanos del IUPSM Extensión Maracay. En esta etapa no se piden soportes originales.',
        'Recursos Humanos y la Jefatura de Escuela evalúan si tu perfil se ajusta a las cátedras disponibles.',
        'Si hay correspondencia, te llaman por teléfono para una entrevista formal sobre tus competencias pedagógicas, tu trayectoria, tu disponibilidad horaria y las modalidades de enseñanza del politécnico.',
        'Si la entrevista es favorable, te indican cómo armar el expediente y la fecha de la microclase.',
      ]),
      section(
        'file',
        'Recaudos del expediente',
        'checklist',
        [
          'Currículum vitae actualizado, fechado y firmado en la última página.',
          'Fondo negro del título universitario de pregrado, registrado ante la oficina principal de registro público.',
          'Copia simple del título de pregrado y de cada título de cuarto nivel (especialización, maestría, doctorado o diplomado).',
          'Tres (3) fotografías de frente, tamaño carnet, recientes e idénticas.',
          'Certificación oficial de calificaciones de pregrado (notas certificadas).',
          'Copia ampliada y legible de la cédula de identidad.',
          'Copia del Registro de Información Fiscal (RIF) vigente.',
          'Constancia o carta de buena conducta de la autoridad civil, la prefectura o el consejo comunal.',
          'Constancias laborales y de experiencia docente o en el ejercicio de la ingeniería.',
          'Mínimo dos (2) cartas de referencia personal o comercial con teléfonos verificables.',
          'Constancia o copia de una cuenta bancaria activa en el banco nómina de la institución (Banco de Venezuela).',
        ],
        {
          body: 'Organiza una carpeta tamaño oficio con originales y copias legibles, y consígnala en Recursos Humanos:',
        },
      ),
      section(
        'micro-class',
        'La microclase',
        'bulleted',
        [
          'Duración: 15 minutos cronometrados de exposición continua.',
          'Tribunal: el Jefe de Escuela de Ingeniería de Sistemas y un profesor titular del área de la materia postulada.',
          'Se evalúa: dominio del tema, modulación de la voz y dicción, estructura de la clase (inicio, desarrollo y cierre), uso de recursos (pizarrón o diapositivas) y capacidad de síntesis.',
        ],
        { notice: 'Es un requisito indispensable antes de formalizar la contratación.' },
      ),
      section('before-semester', 'Antes de iniciar el semestre', 'bulleted', [
        'Asiste a la reunión plenaria pre-semestre (obligatoria), convocada por la Dirección y la Jefatura de Escuela.',
        'Ahí recibes tu Carpeta Docente: horario y carga académica (materias, códigos, secciones, aulas y horas presenciales o en SAIA), tabla oficial de conversión de calificaciones (escala de 0 a 20), reglamentos de convivencia y calendario del semestre de 18 semanas.',
        'Un coordinador o tutor tecnológico te da la inducción al campus virtual SAIA.',
      ]),
    ],
  },
  // ----- Artículo (docentes): PGA y notas en SAIA -----
  teacherSaia: {
    title: 'PGA y notas en SAIA',
    intro:
      'La Planificación General de la Asignatura (PGA) y la carga de las notas de cada corte se hacen en la plataforma SAIA.',
    sections: [
      section(
        'induction',
        'Inducción a SAIA',
        'bulleted',
        [
          'Acceso a tu cuenta institucional.',
          'Estructura de las aulas virtuales.',
          'Asignación de tareas y foros evaluativos.',
          'Administración del libro de calificaciones digital.',
        ],
        {
          body: 'La institución te asigna un coordinador o tutor tecnológico que te capacita en:',
        },
      ),
      section(
        'pga',
        'Planificación General de la Asignatura (PGA)',
        'numbered',
        [
          'Descarga la plantilla oficial editable desde el aula virtual de soporte docente en SAIA.',
          'Llena una PGA por cada materia de tu carga horaria: objetivos, contenidos, estrategias, ponderaciones porcentuales y fechas exactas de evaluación.',
          'Cárgala en el módulo correspondiente de SAIA antes de que termine la semana 2, para su revisión y aprobación por la Jefatura.',
        ],
        {
          body: 'La PGA es el contrato pedagógico formal entre el docente, los alumnos y la institución.',
          notice: 'El plazo de la semana 2 es improrrogable.',
          noticeTone: 'warning',
        },
      ),
      section(
        'grades',
        'Notas de cada corte',
        'numbered',
        [
          'Semana previa al corte (semanas 5, 11 y 17): envía tu planilla digital de calificaciones al correo institucional del validador que te asignó la escuela.',
          'Semana del corte (semanas 6, 12 y 18): asiste en el turno fijado a la revisión presencial con tu validador. Se auditan las notas, el apego al baremo oficial y los errores de transcripción.',
          'Con el visto bueno firmado, entra a SAIA, abre el «Aula DACE» y sube el archivo validado en la carpeta de tu materia, sección y corte.',
        ],
        {
          notice:
            'Está prohibido subir calificaciones al Aula DACE sin la validación previa: es una falta reglamentaria.',
          noticeTone: 'warning',
        },
      ),
      section('thesis', 'Trabajos de grado', 'bulleted', [
        'El Manual Institucional para la Elaboración de Trabajos de Grado del IUPSM está en el aula de soporte profesoral de SAIA y, en físico, en la Jefatura de Escuela.',
      ]),
    ],
  },
  // ----- Artículo (docentes): permisos, asistencia y solvencia -----
  teacherProcedures: {
    title: 'Permisos, asistencia y solvencia',
    intro:
      'Durante el semestre debes cumplir los registros de control de aula y los trámites administrativos de la escuela.',
    sections: [
      section(
        'leave',
        'Permisos',
        'numbered',
        [
          'Acude con antelación a la Jefatura de Escuela y llena la planilla formal de permiso con el motivo.',
          'Coordina de inmediato el plan de recuperación de la clase.',
        ],
        {
          body: 'Cualquier inasistencia programada (salud, fuerza mayor o compromisos laborales) se tramita personalmente ante la Jefatura de Escuela.',
          notice:
            'En una emergencia, avisa a la Jefatura lo antes posible y luego preséntate a llenar el formato de permiso.',
        },
      ),
      section(
        'make-up',
        'Recuperación de clases',
        'numbered',
        [
          'Acuerda con todos los alumnos de la sección un horario extraordinario que no choque con otras materias.',
          'Presenta la propuesta a la Jefatura de Escuela, que verifica la disponibilidad, autoriza la jornada y reserva el aula.',
          'Registra la actividad en la hoja de control de aula, firmada por los estudiantes asistentes.',
        ],
        {
          body: 'Bajo ninguna circunstancia se pueden suspender horas de clase de forma definitiva.',
        },
      ),
      section(
        'attendance',
        'Control de asistencia',
        'bulleted',
        [
          'Semanas 1 a 3: lleva un registro manual a lapicero con nombres y cédulas, porque todavía hay ajustes de inscripción y admisiones tardías.',
          'Entre la semana 2 y la 3: retira en la Jefatura las listas oficiales definitivas y pasa a ellas las asistencias acumuladas.',
        ],
        {
          body: 'El control de asistencia es obligatorio desde la primera clase.',
          notice:
            'Si un estudiante asiste pero no aparece en la lista oficial, no lo retires ni lo descalifiques: lleva su nombre y cédula a la Jefatura para verificarlo.',
        },
      ),
      section(
        'solvency',
        'Solvencia al entregar notas',
        'bulleted',
        [
          'Sello de Caja: el estudiante está al día con los pagos.',
          'Sello de la Jefatura de Escuela: el estudiante es regular en el lapso.',
        ],
        {
          body: 'Antes de dar la nota de un corte, revisa que la planilla de solvencia del estudiante tenga los dos sellos húmedos. Si los tiene, firma la casilla del corte y entrega la calificación.',
          notice:
            'Si falta alguno de los dos sellos, no firmes la planilla ni le des la nota definitiva al estudiante.',
          noticeTone: 'warning',
        },
      ),
    ],
  },
  // ----- Calendario académico de docentes -----
  teacherCalendar: {
    title: 'Calendario del semestre',
    intro:
      'El semestre dura 18 semanas y se califica en tres cortes. Toca una semana para ver qué tienes que entregar.',
    totalWeeks: 18,
    cuts: [
      { id: 'cut-1', name: '1er corte', percent: 30, fromWeek: 1, toWeek: 6 },
      { id: 'cut-2', name: '2do corte', percent: 30, fromWeek: 7, toWeek: 12 },
      { id: 'cut-3', name: '3er corte', percent: 40, fromWeek: 13, toWeek: 18 },
    ],
    milestones: [
      {
        id: 'plenary',
        week: 0,
        title: 'Reunión plenaria pre-semestre',
        description:
          'Reunión obligatoria con la Dirección y la Jefatura de Escuela, donde recibes la Carpeta Docente.',
      },
      {
        id: 'saia-induction',
        week: 0,
        title: 'Inducción a SAIA',
        description: 'Capacitación con el coordinador o tutor tecnológico en el campus virtual.',
      },
      {
        id: 'manual-attendance',
        week: 1,
        title: 'Registro manual de asistencia',
        description:
          'Durante las semanas 1 a 3, anota a lapicero nombres y cédulas de los asistentes.',
      },
      {
        id: 'pga',
        week: 2,
        title: 'PGA cargada en SAIA',
        description:
          'Una PGA por cada materia, antes de que termine la semana 2. Plazo improrrogable.',
      },
      {
        id: 'official-lists',
        week: 3,
        title: 'Listas oficiales definitivas',
        description:
          'Entre la semana 2 y la 3, retira las listas en la Jefatura y pasa a ellas las asistencias.',
      },
      {
        id: 'prevalidation-1',
        week: 5,
        title: 'Pre-validación del 1er corte',
        description: 'Envía tu planilla digital de notas al correo institucional de tu validador.',
      },
      {
        id: 'validation-1',
        week: 6,
        title: 'Validación y carga del 1er corte (30%)',
        description:
          'Revisión presencial con tu validador y, con su visto bueno, carga en el Aula DACE.',
      },
      {
        id: 'prevalidation-2',
        week: 11,
        title: 'Pre-validación del 2do corte',
        description: 'Envía tu planilla digital de notas al correo institucional de tu validador.',
      },
      {
        id: 'validation-2',
        week: 12,
        title: 'Validación y carga del 2do corte (30%)',
        description:
          'Revisión presencial con tu validador y, con su visto bueno, carga en el Aula DACE.',
      },
      {
        id: 'prevalidation-3',
        week: 17,
        title: 'Pre-validación del corte final',
        description: 'Envía tu planilla digital de notas al correo institucional de tu validador.',
      },
      {
        id: 'validation-3',
        week: 18,
        title: 'Validación y carga del corte final (40%)',
        description:
          'Revisión presencial con tu validador, carga en el Aula DACE y cierre del semestre.',
      },
    ],
  },
  // ----- Preguntas frecuentes -----
  faq: {
    title: 'Preguntas frecuentes',
    intro: 'Respuestas rápidas a las dudas más comunes de estudiantes y docentes.',
    items: [
      {
        id: 'student-failed-math',
        audience: 'student',
        question: '¿Qué pasa si repruebo Matemática I en el primer semestre?',
        answer:
          'No podrás inscribir Matemática II, Física I ni Álgebra Lineal en el segundo semestre por el régimen de prelaciones. Se recomienda que te censes en el período intensivo de verano para nivelar Matemática I y no atrasar tu carrera.',
      },
      {
        id: 'student-saia-or-campus',
        audience: 'student',
        question: '¿Cómo sé si una materia de mi horario es presencial o por SAIA?',
        answer:
          'Revisa la columna del aula en tu horario oficial de inscripción. Si tiene un número de aula física (por ejemplo, Aula 12, Edif. Maripire), debes asistir al campus. Si indica modalidad virtual o SAIA, las clases y evaluaciones son solo por el campus en línea.',
      },
      {
        id: 'student-clothes',
        audience: 'student',
        question:
          '¿Puedo entrar con pantalón roto o mono deportivo si solo voy a entregar una tarea?',
        answer:
          'No. El personal de seguridad tiene la orden de no dejar entrar a ningún estudiante con pantalones rotos, licras, monos deportivos, shorts o calzado descubierto, sin importar el trámite que vaya a hacer.',
      },
      {
        id: 'student-lost-id',
        audience: 'student',
        question: '¿Qué hago si pierdo mi carnet estudiantil?',
        answer:
          'Cancela en Caja el arancel por reposición de carnet y ve con el comprobante y una copia de tu cédula a Control de Estudios para tramitar el duplicado. Mientras lo emiten, identifícate con el comprobante de pago y tu constancia de estudio.',
      },
      {
        id: 'student-summer-max',
        audience: 'student',
        question: '¿Cuántas materias puedo inscribir como máximo en el curso de verano?',
        answer:
          'Hasta dos (2) materias por período de verano, siempre que ambas hayan sido aprobadas para abrirse en la oferta oficial de la escuela.',
      },
      {
        id: 'student-sick-exam',
        audience: 'student',
        question:
          '¿Cómo justifico una falta si estuve hospitalizado o enfermo el día de un examen?',
        answer:
          'Dentro de las 48 a 72 horas hábiles siguientes, lleva a Control de Estudios (DACE) el justificativo médico original sellado por la institución de salud. Luego valídalo en la Jefatura de Escuela para acordar con tu profesor la nueva fecha.',
      },
      {
        id: 'student-no-advising',
        audience: 'student',
        question:
          '¿Puedo formalizar mi inscripción de 2º semestre sin pasar por la asesoría del Jefe de Escuela?',
        answer:
          'No. El personal de Control de Estudios no procesa ninguna inscripción sin la planilla de asesoría firmada y con el sello húmedo de la Jefatura de Escuela de Ingeniería de Sistemas.',
      },
      {
        id: 'student-grade-withheld',
        audience: 'student',
        question: '¿Por qué mi profesor no me da la nota si ya presenté todo el corte?',
        answer:
          'Revisa tu solvencia administrativa. Los profesores tienen la instrucción de no firmar la solvencia ni dar calificaciones si la planilla no tiene el sello húmedo de Caja (que confirma que no debes mensualidades) y el sello de la Jefatura de Escuela.',
      },
      {
        id: 'teacher-saia-login',
        audience: 'teacher',
        question: '¿Qué hago si no puedo entrar a SAIA o no veo mis materias?',
        answer:
          'Acude de inmediato a la Coordinación de Tecnología Educativa / SAIA o reporta el problema en la Jefatura de Escuela. El personal técnico verificará tu carga en el sistema y restablecerá tus credenciales.',
      },
      {
        id: 'teacher-pga',
        audience: 'teacher',
        question: '¿Dónde descargo el formato de la PGA y cuál es la fecha máxima para entregarlo?',
        answer:
          'La plantilla editable se descarga desde el aula virtual de soporte docente en SAIA. La fecha límite improrrogable para llenarla y subirla es antes de que termine la semana 2 del semestre.',
      },
      {
        id: 'teacher-missing-student',
        audience: 'teacher',
        question:
          '¿Qué hago si un estudiante asiste a mis clases pero no aparece en la lista oficial?',
        answer:
          'No lo retires ni lo descalifiques. Ve a la Jefatura de Escuela con su cédula y nombre. La Jefatura verificará si es un error de transcripción o si está inscrito en otra sección y, al confirmarlo, emitirá una lista oficial reimpresa.',
      },
      {
        id: 'teacher-sick-student',
        audience: 'teacher',
        question: 'Si un alumno falta a una evaluación por enfermedad, ¿cómo lo evalúo?',
        answer:
          'El alumno tiene de 48 a 72 horas para presentar su justificativo médico en Control de Estudios (DACE) y la Jefatura de Escuela. Cuando la Jefatura valide el comprobante y te notifique, reprograma la evaluación para la clase de la semana siguiente.',
      },
      {
        id: 'teacher-skip-validation',
        audience: 'teacher',
        question: '¿Puedo subir mis notas directamente al Aula DACE sin pasar por la validación?',
        answer:
          'No. Es una falta reglamentaria. Primero envía tu borrador digital en la semana 5, 11 o 17, asiste a la revisión presencial en la semana 6, 12 o 18, obtén la firma de aprobación y solo entonces sube el acta al Aula DACE en SAIA.',
      },
      {
        id: 'teacher-solvency',
        audience: 'teacher',
        question: '¿Puedo firmar la solvencia de un estudiante si le falta el sello de Caja?',
        answer:
          'No. La planilla debe tener el sello de Caja y el de la Jefatura de Escuela. Sin el sello de Caja hay deuda pendiente, así que no firmes ni des la nota definitiva hasta que el alumno regularice su situación.',
      },
      {
        id: 'teacher-emergency',
        audience: 'teacher',
        question: '¿Qué hago si por una emergencia no puedo dar clases?',
        answer:
          'Avisa a la Jefatura de Escuela lo antes posible. Después, preséntate a llenar el formato de permiso, acuerda con tus alumnos una fecha de recuperación y pide a la Jefatura que asigne y reserve el aula.',
      },
      {
        id: 'teacher-thesis',
        audience: 'teacher',
        question: '¿Dónde consulto las normas para asesorar o evaluar Trabajos de Grado?',
        answer:
          'El Manual Institucional para la Elaboración de Trabajos de Grado del IUPSM está para descargar en el aula de soporte profesoral de SAIA y en físico en la Jefatura de Escuela.',
      },
    ],
  },
  // ----- Directorio de oficinas -----
  directory: {
    title: 'Directorio',
    intro:
      'Dependencias de la sede San Jacinto del IUPSM Extensión Maracay y los trámites que atiende cada una.',
    offices: [
      {
        id: 'school-office',
        name: 'Jefatura de Escuela de Ingeniería de Sistemas (47)',
        location: 'Edificio Principal, primer piso',
        services:
          'Asesoría académica, sellado de planillas, permisos docentes, justificación médica y cursos intensivos de verano.',
      },
      {
        id: 'dace',
        name: 'División de Admisión y Control de Estudios (DACE)',
        location: 'Edificio Principal, planta baja',
        services:
          'Inscripciones formales en el sistema, récord de notas, constancias de estudio, emisión y reposición de carnet.',
      },
      {
        id: 'saia',
        name: 'Coordinación de SAIA y Tecnología Educativa',
        location: 'Área de laboratorios de informática',
        services:
          'Soporte de contraseñas, habilitación de aulas virtuales, inducción docente y reporte de fallas técnicas.',
      },
      {
        id: 'cashier',
        name: 'Departamento de Caja y Administración',
        location: 'Edificio Principal, módulo de taquillas',
        services:
          'Cobro de matrículas y cuotas mensuales, sellado de solvencia administrativa, aranceles de constancias y de verano.',
      },
      {
        id: 'library',
        name: 'Biblioteca Central',
        location: 'Edificio Principal, planta baja',
        services:
          'Consulta de calificaciones finales por período, préstamo de libros y sala de estudio y lectura.',
      },
    ],
  },
};
