import { ProyectoEducativo, Moneda } from '../types';
import { obtenerRubricaSugerida, sugerirMetodologiaPorDefecto, generarRecursosDidacticosPorDefecto, sugerirCompetenciasClave } from './curricularUtils';
import { formatearMoneda } from './calculations';

export interface PilarCalidad {
  nombre: string;
  puntosObtenidos: number;
  puntosMaximos: number;
  porcentaje: number;
  estaAprobado: boolean;
  detallesCumplidos: string[];
  detallesFaltantes: string[];
}

export interface EstadoCalidadProyecto {
  proyecto: ProyectoEducativo;
  porcentajeGeneral: number;
  categoriaEstado: 'Aprobado' | 'En Revisión' | 'Pendiente' | 'Crítico';
  colorBadge: string;
  colorBarra: string;
  totalPuntos: number;
  totalPuntosPosibles: number;
  pilares: {
    syllabus: PilarCalidad;
    rubrica: PilarCalidad;
    recursosYAula: PilarCalidad;
    docente: PilarCalidad;
    sesiones: PilarCalidad;
    requisitosYSAR: PilarCalidad;
  };
  alertasPendientes: string[];
  validador?: string;
  fechaValidacion?: string;
  observaciones?: string;
}

/**
 * Calcula de forma exhaustiva y transparente el estado de calidad académica de un proyecto educativo.
 */
export function calcularEstadoCalidadProyecto(p: ProyectoEducativo): EstadoCalidadProyecto {
  const v = p.validacionCalidadAcademica;

  // 1. Syllabus & Temario (20 puntos)
  const sylCumplidos: string[] = [];
  const sylFaltantes: string[] = [];
  let sylPts = 0;

  const tieneTemas = Boolean(p.temasImpartir && p.temasImpartir.trim().length > 15) || Boolean(p.cantidadTemas && p.cantidadTemas > 0);
  if (tieneTemas) {
    sylPts += 8;
    sylCumplidos.push('Temario detallado o módulos definidos');
  } else {
    sylFaltantes.push('Falta desglose temático por módulos o sesiones');
  }

  const tieneMetodologia = Boolean(p.metodologia && p.metodologia.trim().length > 5);
  if (tieneMetodologia) {
    sylPts += 4;
    sylCumplidos.push('Metodología pedagógica documentada');
  } else {
    sylFaltantes.push('Falta definir metodología de enseñanza');
  }

  const tieneHorasDesglosadas = (p.horasTeoricas || 0) > 0 || (p.horasPracticas || 0) > 0 || (p.horasClase || 0) > 0;
  if (tieneHorasDesglosadas) {
    sylPts += 4;
    sylCumplidos.push(`Carga horaria asignada (${p.horasClase || 0} hrs)`);
  } else {
    sylFaltantes.push('Carga horaria no especificada');
  }

  const syllabusAprobado = p.estadoSyllabus === 'Aprobado por Dirección' || Boolean(v?.syllabusValidado);
  if (syllabusAprobado) {
    sylPts += 4;
    sylCumplidos.push('Syllabus validado formalmente por Dirección');
  } else {
    sylFaltantes.push('Pendiente visto bueno de Syllabus');
  }

  const pilarSyllabus: PilarCalidad = {
    nombre: 'Syllabus & Contenidos',
    puntosObtenidos: sylPts,
    puntosMaximos: 20,
    porcentaje: Math.round((sylPts / 20) * 100),
    estaAprobado: sylPts >= 16,
    detallesCumplidos: sylCumplidos,
    detallesFaltantes: sylFaltantes,
  };

  // 2. Rúbrica de Evaluación (20 puntos)
  const rubCumplidos: string[] = [];
  const rubFaltantes: string[] = [];
  let rubPts = 0;

  if (p.rubricaEvaluacion) {
    rubPts += 5;
    rubCumplidos.push('Estructura de rúbrica configurada');

    const totalPct = (p.rubricaEvaluacion.proyectoFinalPct || 0) +
                     (p.rubricaEvaluacion.talleresPracticosPct || 0) +
                     (p.rubricaEvaluacion.participacionAsistenciaPct || 0) +
                     (p.rubricaEvaluacion.examenFinalPct || 0);

    if (totalPct === 100) {
      rubPts += 8;
      rubCumplidos.push('Ponderación sumatoria exacta 100%');
    } else {
      rubFaltantes.push(`Ponderación suma ${totalPct}%, debe sumar 100%`);
    }

    if ((p.rubricaEvaluacion.notaMinimaAprobacion || 0) >= 60) {
      rubPts += 4;
      rubCumplidos.push(`Nota mínima de aprobación establecida (${p.rubricaEvaluacion.notaMinimaAprobacion} pts)`);
    } else {
      rubFaltantes.push('Nota mínima de aprobación no definida o menor a 60');
    }
  } else {
    rubFaltantes.push('Sin rúbrica de evaluación registrada');
  }

  if (v?.rubricaValidada) {
    rubPts += 3;
    rubCumplidos.push('Rúbrica auditada y aprobada');
  } else if (!p.rubricaEvaluacion) {
    rubFaltantes.push('Rúbrica pendiente de revisión');
  }

  const pilarRubrica: PilarCalidad = {
    nombre: 'Rúbrica de Evaluación',
    puntosObtenidos: rubPts,
    puntosMaximos: 20,
    porcentaje: Math.round((rubPts / 20) * 100),
    estaAprobado: rubPts >= 17,
    detallesCumplidos: rubCumplidos,
    detallesFaltantes: rubFaltantes,
  };

  // 3. Aula Virtual & Recursos Didácticos (15 puntos)
  const recCumplidos: string[] = [];
  const recFaltantes: string[] = [];
  let recPts = 0;

  const tieneLMSOAula = Boolean(p.enlaceAulaVirtual || p.idReunionVirtual || p.plataformaLMS);
  if (tieneLMSOAula) {
    recPts += 5;
    recCumplidos.push(`LMS/Aula configurada: ${p.plataformaLMS || 'Zoom / Enlace Sincrónico'}`);
  } else {
    recFaltantes.push('Falta enlace de aula virtual o ID de sesión LMS');
  }

  const cantRecursos = p.recursosDidacticos?.length || 0;
  if (cantRecursos >= 2) {
    recPts += 6;
    recCumplidos.push(`${cantRecursos} recursos didácticos cargados`);
  } else if (cantRecursos === 1) {
    recPts += 3;
    recCumplidos.push('1 recurso didáctico disponible');
    recFaltantes.push('Se recomiendan al menos 2 materiales didácticos');
  } else {
    recFaltantes.push('Sin recursos didácticos ni guías subidas');
  }

  if (v?.recursosValidados) {
    recPts += 4;
    recCumplidos.push('Materiales y aula verificados');
  } else {
    recFaltantes.push('Pendiente verificación técnica de enlaces');
  }

  const pilarRecursos: PilarCalidad = {
    nombre: 'Aulas & Recursos Didácticos',
    puntosObtenidos: recPts,
    puntosMaximos: 15,
    porcentaje: Math.round((recPts / 15) * 100),
    estaAprobado: recPts >= 11,
    detallesCumplidos: recCumplidos,
    detallesFaltantes: recFaltantes,
  };

  // 4. Expediente Docente & Titularidad (15 puntos)
  const docCumplidos: string[] = [];
  const docFaltantes: string[] = [];
  let docPts = 0;

  const tieneDocente = Boolean(p.nombreDocente && p.nombreDocente.trim().length > 3 && p.nombreDocente !== 'Docente no asignado');
  if (tieneDocente) {
    docPts += 5;
    docCumplidos.push(`Docente titular asignado: ${p.nombreDocente}`);
  } else {
    docFaltantes.push('No hay docente titular asignado formalmente');
  }

  const tieneEspecialidad = Boolean(p.docenteEspecialidad || p.docenteClasificacion);
  if (tieneEspecialidad) {
    docPts += 4;
    docCumplidos.push(`Especialidad / Grado: ${p.docenteClasificacion || ''} ${p.docenteEspecialidad || ''}`);
  } else {
    docFaltantes.push('Falta clasificar grado o especialidad docente');
  }

  const tieneCvOExpediente = Boolean(p.docenteCvUrl || p.docenteCvPdf || p.docenteExpediente?.universidadEgreso);
  if (tieneCvOExpediente) {
    docPts += 3;
    docCumplidos.push('CV o expediente docente registrado');
  } else {
    docFaltantes.push('Expediente / CV docente pendiente de entrega');
  }

  if (v?.docenteValidado) {
    docPts += 3;
    docCumplidos.push('Expediente docente validado');
  } else {
    docFaltantes.push('Pendiente validación de credenciales docentes');
  }

  const pilarDocente: PilarCalidad = {
    nombre: 'Expediente Docente',
    puntosObtenidos: docPts,
    puntosMaximos: 15,
    porcentaje: Math.round((docPts / 15) * 100),
    estaAprobado: docPts >= 12,
    detallesCumplidos: docCumplidos,
    detallesFaltantes: docFaltantes,
  };

  // 5. Cronograma & Plan de Sesiones (15 puntos)
  const sesCumplidos: string[] = [];
  const sesFaltantes: string[] = [];
  let sesPts = 0;

  const numSesiones = p.sesionesClase?.length || 0;
  if (numSesiones >= 3) {
    sesPts += 8;
    sesCumplidos.push(`Cronograma con ${numSesiones} sesiones estructuradas`);
  } else if (numSesiones > 0) {
    sesPts += 4;
    sesCumplidos.push(`${numSesiones} sesión(es) configurada(s)`);
    sesFaltantes.push('Cronograma de sesiones incompleto');
  } else {
    sesFaltantes.push('Sin sesiones de clase programadas en calendario');
  }

  const tieneFechas = Boolean(p.fechaProgramacion || p.sesionesClase?.some(s => Boolean(s.fecha)));
  if (tieneFechas) {
    sesPts += 4;
    sesCumplidos.push(`Fecha de inicio / programación: ${p.fechaProgramacion || 'Asignada'}`);
  } else {
    sesFaltantes.push('Falta fecha de inicio de clases');
  }

  if (v?.sesionesValidadas) {
    sesPts += 3;
    sesCumplidos.push('Fechas y cronograma validados sin solapamientos');
  } else {
    sesFaltantes.push('Cronograma pendiente de aprobación');
  }

  const pilarSesiones: PilarCalidad = {
    nombre: 'Cronograma & Sesiones',
    puntosObtenidos: sesPts,
    puntosMaximos: 15,
    porcentaje: Math.round((sesPts / 15) * 100),
    estaAprobado: sesPts >= 11,
    detallesCumplidos: sesCumplidos,
    detallesFaltantes: sesFaltantes,
  };

  // 6. Prerrequisitos, Aforo & Cumplimiento SAR (15 puntos)
  const reqCumplidos: string[] = [];
  const reqFaltantes: string[] = [];
  let reqPts = 0;

  const tienePerfilOPrerreq = Boolean(p.prerrequisitos || p.perfilEgreso || (p.competenciasClave && p.competenciasClave.length > 0));
  if (tienePerfilOPrerreq) {
    reqPts += 5;
    reqCumplidos.push('Perfil de egreso o competencias clave definidos');
  } else {
    reqFaltantes.push('Falta perfil de egreso y competencias requeridas');
  }

  const tieneAforo = Boolean(p.aforoYPrerrequisitos?.aforoMaximo || p.alumnosFinal > 0);
  if (tieneAforo) {
    reqPts += 4;
    reqCumplidos.push(`Aforo controlado (Mín: ${p.aforoYPrerrequisitos?.aforoMinimoRequerido || 4}, Máx: ${p.aforoYPrerrequisitos?.aforoMaximo || 25})`);
  } else {
    reqFaltantes.push('Aforo de cupos no estipulado');
  }

  const tieneRegimenSAR = p.cumpleAcreditacionSAR !== undefined || Boolean(p.servicioFiscal) || Boolean(p.requisitosAcreditacionSAR);
  if (tieneRegimenSAR) {
    reqPts += 3;
    reqCumplidos.push(`Tratamiento SAR verificado: ${p.cumpleAcreditacionSAR ? 'Exento Acreditado (0%)' : 'Gravado ISV (15%)'}`);
  } else {
    reqFaltantes.push('Régimen de acreditación SAR no auditado');
  }

  if (v?.requisitosValidados) {
    reqPts += 3;
    reqCumplidos.push('Prerrequisitos y condición fiscal auditados');
  } else {
    reqFaltantes.push('Prerrequisitos pendientes de confirmación');
  }

  const pilarRequisitos: PilarCalidad = {
    nombre: 'Aforo, Perfil & SAR',
    puntosObtenidos: reqPts,
    puntosMaximos: 15,
    porcentaje: Math.round((reqPts / 15) * 100),
    estaAprobado: reqPts >= 11,
    detallesCumplidos: reqCumplidos,
    detallesFaltantes: reqFaltantes,
  };

  const totalPuntos = sylPts + rubPts + recPts + docPts + sesPts + reqPts;
  const porcentajeGeneral = Math.min(100, Math.max(0, totalPuntos));

  // Determinar Categoría de Calidad
  let categoriaEstado: 'Aprobado' | 'En Revisión' | 'Pendiente' | 'Crítico';
  let colorBadge = 'bg-slate-100 text-slate-800 border-slate-300';
  let colorBarra = 'bg-slate-500';

  if (v?.estadoGeneral === 'Aprobado' || porcentajeGeneral >= 88) {
    categoriaEstado = 'Aprobado';
    colorBadge = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    colorBarra = 'bg-emerald-500';
  } else if (v?.estadoGeneral === 'En Revisión' || (porcentajeGeneral >= 65 && porcentajeGeneral < 88)) {
    categoriaEstado = 'En Revisión';
    colorBadge = 'bg-blue-50 text-blue-800 border-blue-300';
    colorBarra = 'bg-blue-500';
  } else if (v?.estadoGeneral === 'Pendiente' || (porcentajeGeneral >= 40 && porcentajeGeneral < 65)) {
    categoriaEstado = 'Pendiente';
    colorBadge = 'bg-amber-50 text-amber-800 border-amber-300';
    colorBarra = 'bg-amber-500';
  } else {
    categoriaEstado = 'Crítico';
    colorBadge = 'bg-rose-50 text-rose-800 border-rose-300';
    colorBarra = 'bg-rose-500';
  }

  // Recopilar alertas principales
  const alertasPendientes = [
    ...sylFaltantes,
    ...rubFaltantes,
    ...recFaltantes,
    ...docFaltantes,
    ...sesFaltantes,
    ...reqFaltantes,
  ];

  return {
    proyecto: p,
    porcentajeGeneral,
    categoriaEstado,
    colorBadge,
    colorBarra,
    totalPuntos,
    totalPuntosPosibles: 100,
    pilares: {
      syllabus: pilarSyllabus,
      rubrica: pilarRubrica,
      recursosYAula: pilarRecursos,
      docente: pilarDocente,
      sesiones: pilarSesiones,
      requisitosYSAR: pilarRequisitos,
    },
    alertasPendientes,
    validador: v?.validadorPor,
    fechaValidacion: v?.fechaValidacion,
    observaciones: v?.observacionesCalidad || p.observacionesAcademicas,
  };
}

/**
 * Auto-completa los estándares de calidad faltantes con plantillas oficiales institucional Summit
 * y devuelve el proyecto listo para validación al 100%.
 */
export function autoCompletarEstandaresCalidad(p: ProyectoEducativo, validador: string = 'Dirección Académica'): ProyectoEducativo {
  const rubricaSugerida = p.rubricaEvaluacion || obtenerRubricaSugerida(p.tipoProyecto);
  const metodologiaSugerida = p.metodologia || sugerirMetodologiaPorDefecto(p.tipoProyecto, p.nivel);
  const recursosSugeridos = (p.recursosDidacticos && p.recursosDidacticos.length > 0)
    ? p.recursosDidacticos
    : generarRecursosDidacticosPorDefecto(p.nombreProyecto);
  const competenciasSugeridas = (p.competenciasClave && p.competenciasClave.length > 0)
    ? p.competenciasClave
    : sugerirCompetenciasClave(p.nombreProyecto, p.tipoProyecto);

  // Sesiones mínimas de cronograma si no existen
  const horasTotales = p.horasClase || 20;
  const horasPorSesion = p.horasClasePorTema || 2;
  const totalSesiones = Math.max(4, Math.min(16, Math.ceil(horasTotales / horasPorSesion)));

  const sesionesClase = (p.sesionesClase && p.sesionesClase.length > 0) ? p.sesionesClase : Array.from({ length: totalSesiones }, (_, idx) => ({
    numeroSesion: idx + 1,
    tema: `Módulo ${idx + 1}: Fundamentos & Ejercicios Prácticos Aplicados`,
    horas: horasPorSesion,
    modalidad: (p.modalidad === 'Presencial' ? 'Presencial' : 'Virtual') as 'Virtual' | 'Presencial',
    estado: 'Programada' as const,
    entregable: idx === totalSesiones - 1 ? 'Proyecto Final de Certificación' : 'Taller Práctico en Clase',
  }));

  const fechaActual = new Date().toISOString().split('T')[0];

  return {
    ...p,
    metodologia: metodologiaSugerida,
    rubricaEvaluacion: {
      ...rubricaSugerida,
      proyectoFinalPct: rubricaSugerida.proyectoFinalPct || 40,
      talleresPracticosPct: rubricaSugerida.talleresPracticosPct || 35,
      participacionAsistenciaPct: rubricaSugerida.participacionAsistenciaPct || 15,
      examenFinalPct: rubricaSugerida.examenFinalPct !== undefined ? rubricaSugerida.examenFinalPct : 10,
      notaMinimaAprobacion: rubricaSugerida.notaMinimaAprobacion || 75,
      asistenciaMinimaPct: rubricaSugerida.asistenciaMinimaPct || 80,
    },
    recursosDidacticos: recursosSugeridos,
    competenciasClave: competenciasSugeridas,
    perfilEgreso: p.perfilEgreso || `Profesional capacitado en ${p.nombreProyecto} con habilidades prácticas demostradas para la toma de decisiones y ejecución de proyectos.`,
    prerrequisitos: p.prerrequisitos || 'Conocimientos básicos del área y manejo de computadora.',
    plataformaLMS: p.plataformaLMS || 'Campus Virtual Summit (Zoom + Classroom)',
    enlaceAulaVirtual: p.enlaceAulaVirtual || 'https://zoom.us/j/summit-clase-en-vivo',
    sesionesClase,
    cantidadTemas: p.cantidadTemas || totalSesiones,
    horasClasePorTema: horasPorSesion,
    horasTeoricas: p.horasTeoricas || Math.round(horasTotales * 0.4),
    horasPracticas: p.horasPracticas || Math.round(horasTotales * 0.6),
    estadoSyllabus: 'Aprobado por Dirección',
    aforoYPrerrequisitos: p.aforoYPrerrequisitos || {
      aforoMaximo: 25,
      aforoMinimoRequerido: 6,
      estadoAforo: 'Cupos Disponibles',
      nivelDificultad: (p.nivel === 'Avanzado' ? 'Avanzado' : p.nivel === 'Intermedio' ? 'Intermedio' : 'Introductorio'),
      softwareRequerido: ['Computadora con acceso a Internet', 'Software de especialidad'],
    },
    validacionCalidadAcademica: {
      estadoGeneral: 'Aprobado',
      porcentajeCalidad: 100,
      syllabusValidado: true,
      rubricaValidada: true,
      recursosValidados: true,
      docenteValidado: true,
      sesionesValidadas: true,
      requisitosValidados: true,
      validadorPor: validador,
      fechaValidacion: fechaActual,
      observacionesCalidad: 'Programa auditado y validado conforme a los estándares de calidad curricular institucional Summit Impulsa Global.',
    },
  };
}

/**
 * Valida un pilar específico del proyecto y recalcula el estado
 */
export function validarPilarIndividual(
  p: ProyectoEducativo,
  pilarKey: 'syllabusValidado' | 'rubricaValidada' | 'recursosValidados' | 'docenteValidado' | 'sesionesValidadas' | 'requisitosValidados',
  valor: boolean,
  validador: string = 'Dirección Académica',
  observaciones?: string
): ProyectoEducativo {
  const vActual = p.validacionCalidadAcademica || {
    estadoGeneral: 'En Revisión',
    syllabusValidado: false,
    rubricaValidada: false,
    recursosValidados: false,
    docenteValidado: false,
    sesionesValidadas: false,
    requisitosValidados: false,
  };

  const actualizado = {
    ...vActual,
    [pilarKey]: valor,
    validadorPor: validador,
    fechaValidacion: new Date().toISOString().split('T')[0],
    observacionesCalidad: observaciones || vActual.observacionesCalidad,
  };

  // Contar cuántos están validados
  const totalValidados = [
    actualizado.syllabusValidado,
    actualizado.rubricaValidada,
    actualizado.recursosValidados,
    actualizado.docenteValidado,
    actualizado.sesionesValidadas,
    actualizado.requisitosValidados,
  ].filter(Boolean).length;

  if (totalValidados === 6) {
    actualizado.estadoGeneral = 'Aprobado';
  } else if (totalValidados >= 3) {
    actualizado.estadoGeneral = 'En Revisión';
  } else {
    actualizado.estadoGeneral = 'Pendiente';
  }

  return {
    ...p,
    validacionCalidadAcademica: actualizado,
    estadoSyllabus: actualizado.syllabusValidado ? 'Aprobado por Dirección' : p.estadoSyllabus,
  };
}

/**
 * Exporta la matriz de calidad de todos los proyectos a un archivo CSV descargable
 */
export function exportarMatrizCalidadCSV(proyectos: ProyectoEducativo[], moneda: Moneda) {
  const headers = [
    'Codigo',
    'Programa Educativo',
    'Nivel',
    'Modalidad',
    'Docente Titular',
    'Horas Clase',
    'Puntaje Calidad (%)',
    'Estado Calidad',
    'Syllabus',
    'Rubrica',
    'Aula y Recursos',
    'Docente',
    'Sesiones',
    'SAR y Requisitos',
    'Validador',
    'Fecha Validacion',
    'Observaciones'
  ];

  const rows = proyectos.map((p) => {
    const estado = calcularEstadoCalidadProyecto(p);
    return [
      `"${p.codigoPrograma || 'PRG-' + p.id}"`,
      `"${p.nombreProyecto.replace(/"/g, '""')}"`,
      `"${p.nivel || 'Intermedio'}"`,
      `"${p.modalidad || 'Virtual Sincrónica'}"`,
      `"${(p.nombreDocente || 'No asignado').replace(/"/g, '""')}"`,
      p.horasClase || 0,
      estado.porcentajeGeneral,
      `"${estado.categoriaEstado}"`,
      estado.pilares.syllabus.estaAprobado ? 'APROBADO' : 'PENDIENTE',
      estado.pilares.rubrica.estaAprobado ? 'APROBADO' : 'PENDIENTE',
      estado.pilares.recursosYAula.estaAprobado ? 'APROBADO' : 'PENDIENTE',
      estado.pilares.docente.estaAprobado ? 'APROBADO' : 'PENDIENTE',
      estado.pilares.sesiones.estaAprobado ? 'APROBADO' : 'PENDIENTE',
      estado.pilares.requisitosYSAR.estaAprobado ? 'APROBADO' : 'PENDIENTE',
      `"${(estado.validador || 'No auditado').replace(/"/g, '""')}"`,
      `"${estado.fechaValidacion || 'N/A'}"`,
      `"${(estado.observaciones || '').replace(/"/g, '""')}"`
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Matriz_Calidad_Academica_Summit_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
