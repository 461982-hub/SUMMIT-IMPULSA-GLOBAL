import { ProyectoEducativo } from '../types';

export interface ItemMadurezCurricular {
  id: string;
  categoria: 'Datos Generales' | 'Estructura Curricular' | 'Docente & Finanzas' | 'Logística & LMS' | 'Evaluación & Regulación';
  titulo: string;
  descripcion: string;
  peso: number; // Porcentaje de peso sobre 100
  completado: boolean;
  detalle?: string;
  sugerenciaAccion?: string;
}

export interface EvaluacionMadurezCurricular {
  score: number; // 0 - 100
  nivel: 'Completo (Listo para Comercialización)' | 'Madurez Intermedia' | 'En Diseño Inicial';
  badgeColor: {
    bg: string;
    text: string;
    border: string;
    dot: string;
  };
  items: ItemMadurezCurricular[];
  itemsCompletadosCount: number;
  itemsTotalesCount: number;
  listoParaVenta: boolean;
  faltantesCriticos: string[];
}

export function evaluarMadurezCurricular(proyecto: Partial<ProyectoEducativo>): EvaluacionMadurezCurricular {
  const items: ItemMadurezCurricular[] = [];

  // 1. Nombre y Código de Programa
  const tieneNombre = Boolean(proyecto.nombreProyecto && proyecto.nombreProyecto.trim().length >= 5);
  items.push({
    id: 'item-nombre',
    categoria: 'Datos Generales',
    titulo: 'Nombre Oficial y Código del Curso',
    descripcion: 'Título claro y descriptivo del programa académico registrado formalmente.',
    peso: 15,
    completado: tieneNombre,
    detalle: proyecto.nombreProyecto || 'Sin nombre asignado',
    sugerenciaAccion: 'Ingresa un nombre formal para la oferta educativa.',
  });

  // 2. Objetivo General y Competencias
  const tieneObjetivo = Boolean(proyecto.objetivoGeneral && proyecto.objetivoGeneral.trim().length >= 15);
  items.push({
    id: 'item-objetivo',
    categoria: 'Estructura Curricular',
    titulo: 'Objetivo de Aprendizaje y Competencias',
    descripcion: 'Objetivo pedagógico claro que oriente las metas que alcanzará el estudiante.',
    peso: 15,
    completado: tieneObjetivo,
    detalle: proyecto.objetivoGeneral ? `${proyecto.objetivoGeneral.slice(0, 60)}...` : 'Pendiente de redacción',
    sugerenciaAccion: 'Redacta el objetivo formativo general del curso.',
  });

  // 3. Estructura Temática y Horas por Nivel
  const tieneTemas = Boolean((proyecto.cantidadTemas && proyecto.cantidadTemas >= 1) && (proyecto.horasClase && proyecto.horasClase >= 1));
  items.push({
    id: 'item-temas',
    categoria: 'Estructura Curricular',
    titulo: 'Planificación Temática y Horas Clase',
    descripcion: 'Distribución modular de temas y carga horaria alineada con el nivel académico.',
    peso: 20,
    completado: tieneTemas,
    detalle: tieneTemas 
      ? `${proyecto.cantidadTemas} temas • ${proyecto.horasClase} horas totales (Nivel: ${proyecto.nivel || 'Básico'})` 
      : 'Estructura de temas y horas incompleta',
    sugerenciaAccion: 'Define la cantidad de temas y verifica las horas totales de clase.',
  });

  // 4. Metodología de Impartición
  const tieneMetodologia = Boolean(proyecto.metodologia && proyecto.metodologia.trim().length > 3);
  items.push({
    id: 'item-metodologia',
    categoria: 'Estructura Curricular',
    titulo: 'Metodología Pedagógica',
    descripcion: 'Enfoque didáctico (ABP, Casos de Estudio, Clase Magistral + Taller).',
    peso: 10,
    completado: tieneMetodologia,
    detalle: proyecto.metodologia || 'No especificada',
    sugerenciaAccion: 'Selecciona una metodología pedagógica recomendada.',
  });

  // 5. Docente Titular y Tarifa Horaria
  const tieneDocente = Boolean(
    proyecto.nombreDocente && 
    proyecto.nombreDocente.trim().length > 2 && 
    proyecto.nombreDocente.toLowerCase() !== 'por definir' &&
    proyecto.nombreDocente.toLowerCase() !== 'pendiente'
  );
  const tieneTarifa = Boolean(Number(proyecto.tarifaHoraDocente) > 0 || Number(proyecto.costoDocenteManual) > 0);
  items.push({
    id: 'item-docente',
    categoria: 'Docente & Finanzas',
    titulo: 'Docente Titular y Tarifa por Hora',
    descripcion: 'Instructor asignado con honorarios por hora pactados para el costeo operativo.',
    peso: 15,
    completado: tieneDocente && tieneTarifa,
    detalle: tieneDocente ? `${proyecto.nombreDocente} (L. ${proyecto.tarifaHoraDocente || 200}/hr)` : 'Docente pendiente de asignación',
    sugerenciaAccion: 'Asigna un docente titular desde el Banco de Docentes.',
  });

  // 6. Modalidad, Horario y LMS
  const tieneLogistica = Boolean(proyecto.modalidad && proyecto.horario && proyecto.diasClase);
  items.push({
    id: 'item-logistica',
    categoria: 'Logística & LMS',
    titulo: 'Modalidad, Días, Horario y Plataforma LMS',
    descripcion: 'Condiciones de impartición (Zoom, Classroom, días y franja horaria definida).',
    peso: 15,
    completado: tieneLogistica,
    detalle: tieneLogistica ? `${proyecto.modalidad} • ${proyecto.diasClase} (${proyecto.horario})` : 'Horario o modalidad pendiente',
    sugerenciaAccion: 'Define los días de clase, horario y plataforma virtual.',
  });

  // 7. Sílabo Oficial / Planificación PDF
  const tieneSyllabus = Boolean(proyecto.planificacionPdf?.dataUrl || proyecto.temasImpartir || proyecto.estadoSyllabus === 'Aprobado por Dirección');
  items.push({
    id: 'item-syllabus',
    categoria: 'Evaluación & Regulación',
    titulo: 'Sílabo Estructurado o PDF Adjunto',
    descripcion: 'Documento o temario curricular formal revisado por la Dirección Académica.',
    peso: 10,
    completado: tieneSyllabus,
    detalle: proyecto.planificacionPdf ? `PDF: ${proyecto.planificacionPdf.nombreArchivo}` : (tieneSyllabus ? 'Temario estructurado en sistema' : 'Sin documento o temario adjunto'),
    sugerenciaAccion: 'Adjunta el PDF de planificación curricular o redacta el desglose temático.',
  });

  const scoreCalculado = items.reduce((acc, it) => acc + (it.completado ? it.peso : 0), 0);
  const score = Math.min(100, Math.round(scoreCalculado));
  const completados = items.filter(i => i.completado).length;

  let nivel: EvaluacionMadurezCurricular['nivel'] = 'En Diseño Inicial';
  let badgeColor = {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  };

  if (score >= 85) {
    nivel = 'Completo (Listo para Comercialización)';
    badgeColor = {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-300',
      dot: 'bg-emerald-500',
    };
  } else if (score >= 50) {
    nivel = 'Madurez Intermedia';
    badgeColor = {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-300',
      dot: 'bg-amber-500',
    };
  }

  const faltantesCriticos = items.filter(i => !i.completado).map(i => i.titulo);

  return {
    score,
    nivel,
    badgeColor,
    items,
    itemsCompletadosCount: completados,
    itemsTotalesCount: items.length,
    listoParaVenta: score >= 85,
    faltantesCriticos,
  };
}
