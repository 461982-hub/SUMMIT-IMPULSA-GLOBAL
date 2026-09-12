import { TipoProyecto, NivelProyecto, ProyectoEducativo } from '../types';
import { sumarDiasHabiles, sumarDiasCalendario } from './dateUtils';

/**
 * Sugerencias de metodologías pedagógicas estructuradas por lógica según el tipo y nivel de proyecto
 */
export const METODOLOGIAS_SUGERIDAS: Array<{
  nombre: string;
  descripcion: string;
  tiposAplicables: TipoProyecto[];
}> = [
  {
    nombre: 'Aprendizaje Basado en Proyectos (ABP) & Casos Reales',
    descripcion: 'Enfoque práctico orientado a resolver desafíos y desarrollar un proyecto aplicable en el entorno laboral de cada estudiante.',
    tiposAplicables: ['Curso Especializado', 'Diplomado', 'Certificación Profesional', 'Programa Ejecutivo'],
  },
  {
    nombre: 'Metodología Agile & Hands-On (Aprender Haciendo)',
    descripcion: 'Sesiones 80% prácticas con entregables semanales iterativos, simulaciones guiadas y retroalimentación inmediata del docente.',
    tiposAplicables: ['Taller Práctico', 'Curso Especializado', 'Bootcamp Intensivo'],
  },
  {
    nombre: 'Masterclass Ejecutiva & Mentoría Aplicada',
    descripcion: 'Exposición de alto nivel orientada a toma de decisiones estratégicas, análisis de casos de éxito y debates guiados.',
    tiposAplicables: ['Masterclass', 'Seminario Web', 'Programa Ejecutivo'],
  },
  {
    nombre: 'Clase Invertida (Flipped Classroom) & Talleres Sincrónicos',
    descripcion: 'Lecturas y material previo asincrónico en plataforma LMS con sesiones sincrónicas dedicadas a debate, resolución y práctica.',
    tiposAplicables: ['Diplomado', 'Curso Especializado', 'Certificación Profesional'],
  },
  {
    nombre: 'Laboratorio de Simulación y Evaluación por Competencias',
    descripcion: 'Entrenamiento intensivo en software, herramientas especializadas y rúbricas de evaluación técnica certificable.',
    tiposAplicables: ['Taller Práctico', 'Bootcamp Intensivo', 'Certificación Profesional'],
  },
];

/**
 * Retorna la metodología recomendada por defecto según el tipo y nivel del proyecto educativo.
 */
export function sugerirMetodologiaPorDefecto(tipo?: TipoProyecto, nivel?: NivelProyecto): string {
  if (!tipo) return 'Aprendizaje Basado en Proyectos (ABP) & Casos Reales';

  switch (tipo) {
    case 'Taller Práctico':
    case 'Bootcamp Intensivo':
      return 'Metodología Agile & Hands-On (80% Práctica y Entregables en Vivo)';
    case 'Masterclass':
    case 'Seminario Web':
      return 'Masterclass Ejecutiva & Análisis de Casos Estratégicos';
    case 'Diplomado':
    case 'Programa Ejecutivo':
      return 'Aprendizaje Basado en Proyectos (ABP) & Clase Invertida con Casos Reales';
    case 'Certificación Profesional':
      return 'Laboratorio de Simulación y Evaluación Técnica por Competencias';
    case 'Curso Especializado':
    default:
      if (nivel === 'Avanzado') {
        return 'Aprendizaje Basado en Proyectos (ABP) Avanzado & Casos Complejos';
      }
      return 'Aprendizaje Basado en Proyectos (ABP) & Casos Reales';
  }
}

/**
 * Retorna la rúbrica de evaluación sugerida según el tipo de proyecto educativo.
 */
export function obtenerRubricaSugerida(tipo?: TipoProyecto): {
  proyectoFinalPct: number;
  talleresPracticosPct: number;
  participacionAsistenciaPct: number;
  examenFinalPct: number;
  notaMinimaAprobacion: number;
  asistenciaMinimaPct: number;
} {
  switch (tipo) {
    case 'Diplomado':
    case 'Programa Ejecutivo':
      return {
        proyectoFinalPct: 40,
        talleresPracticosPct: 30,
        participacionAsistenciaPct: 15,
        examenFinalPct: 15,
        notaMinimaAprobacion: 80,
        asistenciaMinimaPct: 85,
      };
    case 'Bootcamp Intensivo':
    case 'Taller Práctico':
      return {
        proyectoFinalPct: 50,
        talleresPracticosPct: 35,
        participacionAsistenciaPct: 15,
        examenFinalPct: 0,
        notaMinimaAprobacion: 75,
        asistenciaMinimaPct: 80,
      };
    case 'Certificación Profesional':
      return {
        proyectoFinalPct: 35,
        talleresPracticosPct: 30,
        participacionAsistenciaPct: 10,
        examenFinalPct: 25,
        notaMinimaAprobacion: 80,
        asistenciaMinimaPct: 90,
      };
    case 'Masterclass':
    case 'Seminario Web':
      return {
        proyectoFinalPct: 0,
        talleresPracticosPct: 40,
        participacionAsistenciaPct: 60,
        examenFinalPct: 0,
        notaMinimaAprobacion: 70,
        asistenciaMinimaPct: 80,
      };
    case 'Curso Especializado':
    default:
      return {
        proyectoFinalPct: 40,
        talleresPracticosPct: 35,
        participacionAsistenciaPct: 15,
        examenFinalPct: 10,
        notaMinimaAprobacion: 75,
        asistenciaMinimaPct: 80,
      };
  }
}

/**
 * Recursos didácticos estándar sugeridos para un programa
 */
export function generarRecursosDidacticosPorDefecto(nombreProyecto: string): Array<{
  id: string;
  tipo: 'Presentación PPT/PDF' | 'Grabación de Clase' | 'Plantilla / Código' | 'Guía de Laboratorio' | 'Caso de Estudio';
  titulo: string;
  urlOArchivo?: string;
  estado: 'Disponible' | 'Pendiente';
  fecha?: string;
}> {
  return [
    {
      id: 'rec-1',
      tipo: 'Presentación PPT/PDF',
      titulo: `Syllabus Oficial & Diapositivas Maestras - ${nombreProyecto}`,
      urlOArchivo: 'https://drive.google.com/drive/folders/summit-recursos',
      estado: 'Disponible',
      fecha: new Date().toISOString().split('T')[0],
    },
    {
      id: 'rec-2',
      tipo: 'Plantilla / Código',
      titulo: 'Plantillas de Trabajo, Hojas de Cálculo & Modelos de Caso',
      urlOArchivo: 'https://drive.google.com/drive/folders/summit-plantillas',
      estado: 'Disponible',
      fecha: new Date().toISOString().split('T')[0],
    },
    {
      id: 'rec-3',
      tipo: 'Guía de Laboratorio',
      titulo: 'Guía Práctica de Ejercicios y Rúbrica de Proyecto Final',
      urlOArchivo: 'https://drive.google.com/drive/folders/summit-guias',
      estado: 'Disponible',
      fecha: new Date().toISOString().split('T')[0],
    },
    {
      id: 'rec-4',
      tipo: 'Grabación de Clase',
      titulo: 'Repositorio de Grabaciones Sincrónicas de Clases en Vivo',
      urlOArchivo: 'https://zoom.us/rec/share/summit-grabaciones',
      estado: 'Pendiente',
      fecha: new Date().toISOString().split('T')[0],
    },
  ];
}

/**
 * Sugerir competencias clave según nombre y tipo del programa
 */
export function sugerirCompetenciasClave(nombre: string, tipo?: TipoProyecto): string[] {
  const base = [
    'Dominio de herramientas técnicas y software de especialidad',
    'Capacidad de resolución de problemas basados en casos de negocio reales',
    'Diseño y ejecución de proyectos aplicables al entorno laboral',
  ];

  const nombreLower = nombre.toLowerCase();
  if (nombreLower.includes('excel') || nombreLower.includes('financier') || nombreLower.includes('contab')) {
    return [
      'Modelado financiero y formulación de reportes dinámicos',
      'Automatización de análisis de datos y tablas pivote avanzadas',
      'Auditoría y control de presupuestos y estados de resultados',
      ...base.slice(1),
    ];
  }
  if (nombreLower.includes('power bi') || nombreLower.includes('analis') || nombreLower.includes('data')) {
    return [
      'Extracción, transformación y carga de datos con Power Query / ETL',
      'Modelado DAX y construcción de dashboards interactivos de toma de decisión',
      'Storytelling con datos y métricas KPI de negocio',
      ...base.slice(1),
    ];
  }
  if (nombreLower.includes('ventas') || nombreLower.includes('comercial') || nombreLower.includes('marketing')) {
    return [
      'Estrategias de prospección B2B y cierre consultivo de alto impacto',
      'Gestión de embudo de ventas y manejo de objeciones comerciales',
      'Planificación de campañas omnicanal y fidelización de clientes',
      ...base.slice(1),
    ];
  }
  if (nombreLower.includes('gerenc') || nombreLower.includes('liderazgo') || nombreLower.includes('gestion')) {
    return [
      'Liderazgo de equipos multidisciplinarios y delegación efectiva',
      'Toma de decisiones estratégicas bajo incertidumbre y KPIs',
      'Gestión ágil de proyectos y optimización de flujos operativos',
      ...base.slice(1),
    ];
  }

  return base;
}

/**
 * Genera el plan cronológico de sesiones de clase clase por clase
 */
export function generarPlanSesionesClase(
  cantidadTemas: number,
  horasPorTema: number,
  fechaInicio: string,
  diasClaseTexto: string = 'Lunes, Miércoles y Viernes',
  modalidad: 'Virtual' | 'Presencial' = 'Virtual'
): Array<{
  numeroSesion: number;
  fecha: string;
  tema: string;
  modalidad: 'Virtual' | 'Presencial';
  horas: number;
  entregable: string;
  estado: 'Programada' | 'Impartida' | 'Reprogramada';
}> {
  const temas = Math.max(1, Number(cantidadTemas) || 4);
  const horas = Math.max(1, Number(horasPorTema) || 4);
  const sesiones: Array<{
    numeroSesion: number;
    fecha: string;
    tema: string;
    modalidad: 'Virtual' | 'Presencial';
    horas: number;
    entregable: string;
    estado: 'Programada' | 'Impartida' | 'Reprogramada';
  }> = [];

  let fechaActual = fechaInicio || new Date().toISOString().split('T')[0];

  for (let i = 1; i <= temas; i++) {
    const fechaSesion = i === 1 ? fechaActual : sumarDiasHabiles(fechaActual, (i - 1) * 2) || fechaActual;
    
    sesiones.push({
      numeroSesion: i,
      fecha: fechaSesion,
      tema: `Módulo / Tema ${i}: Fundamentos, Aplicación Práctica y Ejercicios Guiados`,
      modalidad,
      horas,
      entregable: i === temas ? 'Proyecto Final Integrador Evaluado' : `Entregable Práctico de Sesión ${i}`,
      estado: 'Programada',
    });
  }

  return sesiones;
}

/**
 * Genera un código de validación de certificado único oficial
 */
export function generarCodigoValidacionCertificado(idProyecto: number | string, correlativo?: string): string {
  const anio = new Date().getFullYear();
  const idStr = String(idProyecto).padStart(4, '0');
  const corr = correlativo ? `-${correlativo.replace(/[^a-zA-Z0-9]/g, '')}` : '';
  return `SUMMIT-CERT-${anio}-${idStr}${corr}`;
}

/**
 * Interfaz para la configuración paramétrica de horas y temas por nivel académico
 */
export interface ConfiguracionHorasNivel {
  nivel: NivelProyecto;
  cantidadTemas: number;
  horasClasePorTema: number;
  totalHoras: number;
  descripcion?: string;
}

/**
 * Configuración institucional por defecto:
 * - Básico: 4 temas × 3 hrs = 12 horas clase (Norma institucional obligatoria)
 * - Intermedio: 4 temas × 4 hrs = 16 horas clase
 * - Avanzado: 4 temas × 5 hrs = 20 horas clase
 * - Especializado: 6 temas × 4 hrs = 24 horas clase
 * - Todos los niveles: 4 temas × 4 hrs = 16 horas clase
 */
export const CONFIGURACION_HORAS_POR_NIVEL_DEFAULT: Record<NivelProyecto, ConfiguracionHorasNivel> = {
  'Básico': {
    nivel: 'Básico',
    cantidadTemas: 4,
    horasClasePorTema: 3,
    totalHoras: 12,
    descripcion: 'Norma institucional básica (4 temas × 3 hrs/tema = 12 horas clase)',
  },
  'Intermedio': {
    nivel: 'Intermedio',
    cantidadTemas: 4,
    horasClasePorTema: 4,
    totalHoras: 16,
    descripcion: 'Profundización y casos prácticos (4 temas × 4 hrs/tema = 16 horas clase)',
  },
  'Avanzado': {
    nivel: 'Avanzado',
    cantidadTemas: 4,
    horasClasePorTema: 5,
    totalHoras: 20,
    descripcion: 'Especialización y proyectos complejos (4 temas × 5 hrs/tema = 20 horas clase)',
  },
  'Especializado': {
    nivel: 'Especializado',
    cantidadTemas: 6,
    horasClasePorTema: 4,
    totalHoras: 24,
    descripcion: 'Formación técnica intensiva (6 temas × 4 hrs/tema = 24 horas clase)',
  },
  'Todos los niveles': {
    nivel: 'Todos los niveles',
    cantidadTemas: 4,
    horasClasePorTema: 4,
    totalHoras: 16,
    descripcion: 'Curso transversal general (4 temas × 4 hrs/tema = 16 horas clase)',
  },
};

const STORAGE_KEY_CONFIG_HORAS_NIVEL = 'summit_config_horas_por_nivel';

/**
 * Obtiene todas las configuraciones de horas por nivel académico (desde localStorage o valores por defecto)
 */
export function obtenerTodasConfiguracionesHorasNivel(): Record<NivelProyecto, ConfiguracionHorasNivel> {
  if (typeof window === 'undefined') {
    return { ...CONFIGURACION_HORAS_POR_NIVEL_DEFAULT };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG_HORAS_NIVEL);
    if (!raw) return { ...CONFIGURACION_HORAS_POR_NIVEL_DEFAULT };
    const parsed = JSON.parse(raw);
    return {
      ...CONFIGURACION_HORAS_POR_NIVEL_DEFAULT,
      ...parsed,
    };
  } catch (e) {
    return { ...CONFIGURACION_HORAS_POR_NIVEL_DEFAULT };
  }
}

/**
 * Retorna la configuración institucional de temas y horas según el nivel del curso.
 * Por norma institucional, para nivel 'Básico' son 4 temas por 3 horas clase = 12 horas totales.
 * Para el resto de niveles se aplican de la misma manera según las horas configuradas.
 */
export function obtenerConfiguracionHorasPorNivel(nivel?: NivelProyecto): {
  cantidadTemas: number;
  horasPorTema: number;
  totalHoras: number;
  descripcion?: string;
} {
  // Regla institucional inmutable: todo curso básico consta de 12 horas (4 temas × 3 horas/tema)
  if (nivel === 'Básico' || !nivel) {
    return {
      cantidadTemas: 4,
      horasPorTema: 3,
      totalHoras: 12,
      descripcion: 'Norma institucional básica obligatoria (4 temas × 3 hrs/tema = 12 horas clase)',
    };
  }
  const todas = obtenerTodasConfiguracionesHorasNivel();
  const config = (nivel && todas[nivel]) ? todas[nivel] : todas['Básico'];
  return {
    cantidadTemas: config.cantidadTemas,
    horasPorTema: config.horasClasePorTema,
    totalHoras: config.totalHoras,
    descripcion: config.descripcion,
  };
}

/**
 * Guarda en almacenamiento persistente las horas configuradas por nivel
 */
export function guardarConfiguracionHorasNivel(
  config: Record<NivelProyecto, ConfiguracionHorasNivel>
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG_HORAS_NIVEL, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('summit_config_horas_nivel_cambio', { detail: config }));
  } catch (e) {
    console.error('Error al guardar configuración de horas por nivel:', e);
  }
}

/**
 * Restablece la configuración de horas por nivel a los valores institucionales estándar
 */
export function restablecerConfiguracionHorasNivelDefault(): Record<NivelProyecto, ConfiguracionHorasNivel> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY_CONFIG_HORAS_NIVEL);
      window.dispatchEvent(new CustomEvent('summit_config_horas_nivel_cambio', { detail: CONFIGURACION_HORAS_POR_NIVEL_DEFAULT }));
    } catch (e) {
      console.error('Error al restablecer configuración:', e);
    }
  }
  return { ...CONFIGURACION_HORAS_POR_NIVEL_DEFAULT };
}

/**
 * Calcula el total de horas de clase a partir de cantidad de temas y horas por tema.
 */
export function calcularTotalHorasCurso(cantidadTemas: number, horasPorTema: number): number {
  const temas = Math.max(0, Number(cantidadTemas) || 0);
  const horas = Math.max(0, Number(horasPorTema) || 0);
  return temas * horas;
}

/**
 * Valida si un archivo es un documento PDF válido.
 */
export function validarArchivoPDF(file: File): { valido: boolean; error?: string } {
  if (!file) {
    return { valido: false, error: 'No se seleccionó ningún archivo' };
  }
  
  const esPdfMime = file.type === 'application/pdf';
  const esPdfExtension = file.name.toLowerCase().endsWith('.pdf');

  if (!esPdfMime && !esPdfExtension) {
    return { 
      valido: false, 
      error: 'Formato no permitido. Solo se permiten documentos en formato PDF (.pdf)' 
    };
  }

  // Límite de tamaño sugerido: 25MB para no sobrecargar almacenamiento local
  const tamanoMaxMb = 25;
  if (file.size > tamanoMaxMb * 1024 * 1024) {
    return {
      valido: false,
      error: `El archivo PDF excede el tamaño máximo permitido de ${tamanoMaxMb} MB.`
    };
  }

  return { valido: true };
}

/**
 * Convierte un archivo a DataURL (Base64) de forma asincrónica
 */
export function convertirArchivoADataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Genera una lista de estudiantes de muestra con calificaciones y estado según la rúbrica
 */
export function generarEstudiantesMuestraGradebook(cantidad: number = 8): Array<{
  idEstudiante: string;
  nombreEstudiante: string;
  correo: string;
  empresa: string;
  notaTalleres: number;
  notaProyectoFinal: number;
  notaParticipacion: number;
  notaExamen: number;
  asistenciaPct: number;
  promedioFinal: number;
  estadoFinal: 'Aprobado con Distinción' | 'Aprobado' | 'En Recuperación' | 'Reprobado';
  observaciones: string;
}> {
  const nombres = [
    { nom: 'Ing. Carlos Eduardo Martínez', emp: 'Banco Atlántida', cor: 'cmartinez@bancoatlan.hn' },
    { nom: 'Lic. Andrea Sofía Morales', emp: 'Cervecería Hondureña', cor: 'andrea.morales@ab-inbev.com' },
    { nom: 'MSc. Roberto José Zelaya', emp: 'Ficohsa Seguros', cor: 'rzelaya@ficohsa.com' },
    { nom: 'Lic. Claudia María Flores', emp: 'Tigo Business Honduras', cor: 'claudia.flores@millicom.com' },
    { nom: 'Ing. Fernando Gabriel Ramos', emp: 'Grupo Karim\'s', cor: 'f.ramos@karimsgroup.com' },
    { nom: 'Lic. Gabriela Isabel Pineda', emp: 'Corporación Dinant', cor: 'gpineda@dinant.com' },
    { nom: 'Ing. Luis Mario Bueso', emp: 'Grupo Terra / Uno Petrol', cor: 'luis.bueso@terralogistics.hn' },
    { nom: 'Lic. Karen Vanessa Rivera', emp: 'BAC Credomatic', cor: 'karen.rivera@baccredomatic.hn' },
  ];

  return nombres.slice(0, cantidad).map((est, i) => {
    const notaTalleres = 80 + Math.floor(Math.random() * 20);
    const notaProyectoFinal = 75 + Math.floor(Math.random() * 25);
    const notaParticipacion = 85 + Math.floor(Math.random() * 15);
    const notaExamen = 78 + Math.floor(Math.random() * 22);
    const asistenciaPct = 85 + Math.floor(Math.random() * 15);

    const prom = Math.round(
      notaTalleres * 0.35 +
      notaProyectoFinal * 0.40 +
      notaParticipacion * 0.15 +
      notaExamen * 0.10
    );

    let estadoFinal: 'Aprobado con Distinción' | 'Aprobado' | 'En Recuperación' | 'Reprobado' = 'Aprobado';
    if (prom >= 92 && asistenciaPct >= 90) estadoFinal = 'Aprobado con Distinción';
    else if (prom >= 75 && asistenciaPct >= 80) estadoFinal = 'Aprobado';
    else if (prom >= 65) estadoFinal = 'En Recuperación';
    else estadoFinal = 'Reprobado';

    return {
      idEstudiante: `EST-2026-${String(i + 1).padStart(3, '0')}`,
      nombreEstudiante: est.nom,
      correo: est.cor,
      empresa: est.emp,
      notaTalleres,
      notaProyectoFinal,
      notaParticipacion,
      notaExamen,
      asistenciaPct,
      promedioFinal: prom,
      estadoFinal,
      observaciones: estadoFinal === 'Aprobado con Distinción' ? 'Excelente desempeño y entrega de caso real sobresaliente.' : 'Cumplió todos los requisitos académicos.',
    };
  });
}

/**
 * Genera registro de asistencia de muestra para todas las sesiones
 */
export function generarAsistenciaMuestra(sesiones: Array<{ numeroSesion: number; fecha?: string; tema: string }>, estudiantes: Array<{ idEstudiante: string; nombreEstudiante: string }>) {
  return sesiones.map((ses) => ({
    numeroSesion: ses.numeroSesion,
    fecha: ses.fecha || new Date().toISOString().split('T')[0],
    tema: ses.tema,
    registros: estudiantes.map((est) => ({
      idEstudiante: est.idEstudiante,
      nombreEstudiante: est.nombreEstudiante,
      estado: (Math.random() > 0.12 ? 'Presente' : Math.random() > 0.5 ? 'Tardanza' : 'Falta Justificada') as any,
    })),
  }));
}

