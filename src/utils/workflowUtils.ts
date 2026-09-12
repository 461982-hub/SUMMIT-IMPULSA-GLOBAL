/**
 * FLUJO DE TRABAJO INTER-GERENCIAL Y AUDITORÍA DE CUMPLIMIENTO
 * Summit Impulsa Global, S.A. de C.V.
 *
 * Flujo secuencial:
 * 1. Gerencia Académica: Crea el proyecto, llena diseño curricular, docente, horas y costos operativos.
 *    Autoriza y envía a Comercialización (Inicia el cronómetro del proyecto).
 * 2. Gerencia de Comercialización: Define canales, pauta, embudo de venta, matrícula real (mínimo 4) y satisfacción.
 *    Autoriza y remite a Gerencia General.
 * 3. Gerencia General: Audita el cumplimiento estricto de los procesos por cada gerencia antes de aprobar y rebajar del POA.
 */

import { ProyectoEducativo } from '../types';

export interface ItemCumplimiento {
  id: string;
  label: string;
  cumplido: boolean;
  detalle: string;
  requerido: boolean;
}

export interface DiagnosticoCumplimientoGerencia {
  gerencia: 'academica' | 'comercial' | 'general';
  titulo: string;
  lider: string;
  autorizado: boolean;
  fechaAutorizacion?: string;
  responsable?: string;
  porcentaje: number;
  completo: boolean;
  items: ItemCumplimiento[];
  faltantes: string[];
}

export interface NivelFlujoInfo {
  nivel: 1 | 2 | 3 | 4;
  titulo: string;
  tituloCorto: string;
  descripcion: string;
  color: 'blue' | 'emerald' | 'purple' | 'amber' | 'indigo';
  bgLight: string;
  borderClass: string;
  badgeClass: string;
  gerenciaActual: string;
  responsableActual: string;
}

export interface TiempoTranscurridoInfo {
  texto: string;
  minutos: number;
  horas: number;
  dias: number;
  formatoLargo: string;
  esReciente: boolean;
}

export interface ValidacionAprobacionGG {
  puedeAprobar: boolean;
  porcentajeTotal: number;
  academicoCompleto: boolean;
  comercialCompleto: boolean;
  bloqueos: string[];
  alertas: string[];
  checklist: Array<{
    gerencia: 'Académica' | 'Comercialización' | 'General';
    item: string;
    cumplido: boolean;
    critico: boolean;
  }>;
}

/**
 * Calcula el cumplimiento de los procesos de la Gerencia Académica
 */
export function calcularCumplimientoAcademico(p: ProyectoEducativo): DiagnosticoCumplimientoGerencia {
  const tieneNombre = Boolean(p.nombreProyecto && p.nombreProyecto.trim().length > 3);
  const tieneDocente = Boolean(p.nombreDocente && p.nombreDocente.trim().length > 3 && !p.nombreDocente.includes('Por definir'));
  const tieneHoras = (Number(p.horasClase) || 0) > 0;
  const tieneObjetivo = Boolean(p.objetivoGeneral && p.objetivoGeneral.trim().length > 5);
  const tieneCostosDirectos = (Number(p.gastoTotalOperativo) || 0) > 0 || (Number(p.tarifaHoraDocente) || 0) > 0;
  const tieneTemario = Boolean((p.temasImpartir && p.temasImpartir.trim().length > 0) || (Number(p.cantidadTemas) || 0) > 0 || p.planificacionPdf);
  const autorizado = Boolean(p.autorizacionAcademica);

  const items: ItemCumplimiento[] = [
    {
      id: 'acad-nombre-obj',
      label: 'Diseño y Objetivo Curricular',
      cumplido: tieneNombre && tieneObjetivo,
      detalle: tieneNombre ? (tieneObjetivo ? 'Nombre y objetivo general definidos' : 'Objetivo curricular pendiente') : 'Nombre del curso pendiente',
      requerido: true,
    },
    {
      id: 'acad-docente',
      label: 'Docente Titular Asignado',
      cumplido: tieneDocente,
      detalle: tieneDocente ? `Docente: ${p.nombreDocente}` : 'Sin docente titular formalizado',
      requerido: true,
    },
    {
      id: 'acad-horas-temas',
      label: 'Carga Horaria & Plan Temático',
      cumplido: tieneHoras && tieneTemario,
      detalle: tieneHoras ? `${p.horasClase} hrs programadas${tieneTemario ? ' con temario' : ' (falta temario)'}` : 'Horas de clase en cero',
      requerido: true,
    },
    {
      id: 'acad-costos',
      label: 'Costos Operativos Directos',
      cumplido: tieneCostosDirectos,
      detalle: tieneCostosDirectos ? 'Tarifa docente y costos fijos configurados' : 'Presupuesto de costos operativos incompleto',
      requerido: true,
    },
    {
      id: 'acad-autorizacion',
      label: 'Firma y Autorización Académica',
      cumplido: autorizado,
      detalle: autorizado 
        ? `Autorizado por ${p.responsableAcademico || 'MSc. Elena Rostrán'} (${p.fechaAutorizacionAcademica ? p.fechaAutorizacionAcademica.slice(0, 10) : 'Fecha registrada'})`
        : 'Pendiente de firma y envío por Gerencia Académica',
      requerido: true,
    },
  ];

  const cumplidos = items.filter(i => i.cumplido).length;
  const porcentaje = Math.round((cumplidos / items.length) * 100);
  const faltantes = items.filter(i => !i.cumplido).map(i => i.label);

  return {
    gerencia: 'academica',
    titulo: 'Gerencia Académica',
    lider: p.responsableAcademico || 'MSc. Elena Rostrán',
    autorizado,
    fechaAutorizacion: p.fechaAutorizacionAcademica,
    responsable: p.responsableAcademico || 'MSc. Elena Rostrán - Gerencia Académica',
    porcentaje,
    completo: porcentaje === 100,
    items,
    faltantes,
  };
}

/**
 * Calcula el cumplimiento de los procesos de la Gerencia de Comercialización
 */
export function calcularCumplimientoComercial(p: ProyectoEducativo): DiagnosticoCumplimientoGerencia {
  const tieneMetodo = Boolean(p.metodoVenta && p.metodoVenta.trim().length > 0);
  const tieneMatriculaMinima = (Number(p.alumnosFinal) || 0) >= 4;
  const tieneProyeccion = (Number(p.alumnosProyectados) || 0) >= 1;
  const tienePreciosComerciales = (Number(p.precioSugeridoConISV) || Number(p.precioSugeridoAlumno) || 0) > 0;
  const autorizado = Boolean(p.autorizacionComercial || p.comercializacionCompletada);

  const items: ItemCumplimiento[] = [
    {
      id: 'com-canal',
      label: 'Canal de Venta Asignado',
      cumplido: tieneMetodo,
      detalle: tieneMetodo ? `Canal: ${p.metodoVenta}` : 'Método de captación no definido',
      requerido: true,
    },
    {
      id: 'com-matricula',
      label: 'Matrícula Mínima Pagada (≥ 4 alumnos)',
      cumplido: tieneMatriculaMinima,
      detalle: tieneMatriculaMinima 
        ? `${p.alumnosFinal} inscritos confirmados (Supera mínimo de 4)` 
        : `Solo ${p.alumnosFinal || 0} inscritos (Mínimo institucional: 4)`,
      requerido: true,
    },
    {
      id: 'com-embudo',
      label: 'Proyección & Embudo Comercial',
      cumplido: tieneProyeccion,
      detalle: tieneProyeccion ? `Meta: ${p.alumnosProyectados} alumnos proyectados` : 'Meta de prospección no registrada',
      requerido: true,
    },
    {
      id: 'com-precios',
      label: 'Tarifa y Precio por Alumno',
      cumplido: tienePreciosComerciales,
      detalle: tienePreciosComerciales ? 'Tarifa sugerida y recaudación calculada' : 'Estructura de precios pendiente',
      requerido: true,
    },
    {
      id: 'com-autorizacion',
      label: 'Firma y Autorización Comercial',
      cumplido: autorizado,
      detalle: autorizado 
        ? `Autorizado por ${p.responsableComercial || 'Lic. Carlos Mendoza'} (${p.fechaAutorizacionComercial ? p.fechaAutorizacionComercial.slice(0, 10) : 'Fecha registrada'})`
        : 'Pendiente de cierre y autorización comercial',
      requerido: true,
    },
  ];

  const cumplidos = items.filter(i => i.cumplido).length;
  const porcentaje = Math.round((cumplidos / items.length) * 100);
  const faltantes = items.filter(i => !i.cumplido).map(i => i.label);

  return {
    gerencia: 'comercial',
    titulo: 'Gerencia de Comercialización',
    lider: p.responsableComercial || 'Lic. Carlos Mendoza',
    autorizado,
    fechaAutorizacion: p.fechaAutorizacionComercial,
    responsable: p.responsableComercial || 'Lic. Carlos Mendoza - Gerencia Comercial',
    porcentaje,
    completo: porcentaje === 100,
    items,
    faltantes,
  };
}

/**
 * Calcula el nivel y estado actual del proyecto en el flujo institucional
 */
export function obtenerNivelFlujo(p: ProyectoEducativo): NivelFlujoInfo {
  // Proceso Cerrado - Si la decisión fue "No" o el estado es "No se llevó a cabo"
  if (p.decisionPlazoVenta === 'No' || (p.seLlevoACabo === 'No se llevó a cabo' && p.decisionPlazoVenta !== 'Si') || (p.procesoCerrado && p.decisionPlazoVenta !== 'Si')) {
    return {
      nivel: 1,
      titulo: 'Proceso Cerrado: No se llevó a cabo',
      tituloCorto: 'No se llevó a cabo',
      descripcion: p.motivoCierre || (p.detalleRegistroDecision ? p.detalleRegistroDecision : 'Decisión institucional en Gerencia de Comercialización: No se llevó a cabo dentro del plazo de 20 días calendario.'),
      color: 'amber',
      bgLight: 'bg-rose-50',
      borderClass: 'border-rose-300',
      badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
      gerenciaActual: 'Control Institucional',
      responsableActual: 'Proceso Cerrado',
    };
  }

  // Nivel 4: Aprobado por Gerencia General y listo para ejecución / facturado en POA
  if (p.aprobacionFinalGerenciaGeneral || p.seLlevoACabo === 'Listo' || p.seLlevoACabo === 'Sí') {
    return {
      nivel: 4,
      titulo: 'Nivel 4: Aprobado & En Ejecución',
      tituloCorto: 'Aprobado Listo',
      descripcion: 'Proyecto con dictamen final favorable de Gerencia General. En ejecución operativa y facturación.',
      color: 'indigo',
      bgLight: 'bg-indigo-50',
      borderClass: 'border-indigo-300',
      badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
      gerenciaActual: 'Dirección General & Operaciones',
      responsableActual: typeof p.aprobadoPorGerenciaGeneral === 'string' 
        ? p.aprobadoPorGerenciaGeneral 
        : 'Dr. Walter Pedroza - Gerencia General',
    };
  }

  // Nivel 3: En Gerencia de Comercialización (aprobado previamente por GG)
  if (p.etapaFlujo === 'comercializacion' || p.aprobadoPorGerenciaGeneralPrevia || p.fechaEnvioComercializacion) {
    return {
      nivel: 3,
      titulo: 'Nivel 3: Gerencia de Comercialización',
      tituloCorto: 'En Comercialización',
      descripcion: 'Aprobado por Gerencia General. En campaña de venta, captación de prospectos, cotizaciones y matrícula.',
      color: 'emerald',
      bgLight: 'bg-emerald-50',
      borderClass: 'border-emerald-300',
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      gerenciaActual: 'Gerencia de Comercialización',
      responsableActual: p.responsableComercial || 'Lic. Carlos Mendoza - Comercialización',
    };
  }

  // Nivel 2: En Gerencia General para Revisión y Aprobación (Nuevo flujo oficial)
  if (p.etapaFlujo === 'revision_gerencia_general' || p.etapaFlujo === 'dictamen_general' || p.autorizacionAcademica) {
    return {
      nivel: 2,
      titulo: 'Nivel 2: Revisión y Aprobación Gerencia General',
      tituloCorto: 'Revisión Gerencia General',
      descripcion: 'Sílabo formalizado con correlativos Empresa y SAR. En revisión ejecutiva por Gerencia General previo a comercialización.',
      color: 'purple',
      bgLight: 'bg-purple-50',
      borderClass: 'border-purple-300',
      badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
      gerenciaActual: 'Gerencia General',
      responsableActual: 'Dr. Walter Pedroza - Gerencia General',
    };
  }

  // Nivel 1: Elaboración en Gerencia Académica
  return {
    nivel: 1,
    titulo: 'Nivel 1: Elaboración Académica (Sílabo Oficial)',
    tituloCorto: 'Sílabo en Académica',
    descripcion: 'Diseño pedagógico del Sílabo Oficial, honorarios docentes, gastos operativos y correlativos institucionales.',
    color: 'blue',
    bgLight: 'bg-blue-50',
    borderClass: 'border-blue-300',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    gerenciaActual: 'Gerencia Académica',
    responsableActual: p.responsableAcademico || 'Phd. Donal Reyes - Gerencia Académica',
  };
}

/**
 * Calcula el tiempo transcurrido desde que se creó el proyecto (cronómetro del flujo)
 */
export function calcularTiempoTranscurrido(fechaInicio?: string, fechaReferencia = new Date()): TiempoTranscurridoInfo {
  if (!fechaInicio) {
    return {
      texto: 'Recién iniciado',
      minutos: 0,
      horas: 0,
      dias: 0,
      formatoLargo: 'Menos de 1 hora en flujo',
      esReciente: true,
    };
  }

  const inicio = new Date(fechaInicio).getTime();
  const fin = fechaReferencia.getTime();
  
  if (isNaN(inicio) || inicio > fin) {
    return {
      texto: 'Hoy',
      minutos: 0,
      horas: 0,
      dias: 0,
      formatoLargo: 'Iniciado recientemente',
      esReciente: true,
    };
  }

  const difMs = fin - inicio;
  const minutosTotales = Math.floor(difMs / (1000 * 60));
  const horasTotales = Math.floor(difMs / (1000 * 60 * 60));
  const diasTotales = Math.floor(difMs / (1000 * 60 * 60 * 24));
  const horasRestantes = horasTotales % 24;
  const minutosRestantes = minutosTotales % 60;

  let texto = '';
  let formatoLargo = '';

  if (diasTotales === 0) {
    if (horasTotales === 0) {
      texto = `${Math.max(1, minutosTotales)}m`;
      formatoLargo = `${Math.max(1, minutosTotales)} minutos en flujo`;
    } else {
      texto = `${horasTotales}h ${minutosRestantes}m`;
      formatoLargo = `${horasTotales} horas y ${minutosRestantes} minutos en flujo`;
    }
  } else {
    texto = `${diasTotales}d ${horasRestantes}h`;
    formatoLargo = `${diasTotales} días y ${horasRestantes} horas en flujo institucional`;
  }

  return {
    texto,
    minutos: minutosTotales,
    horas: horasTotales,
    dias: diasTotales,
    formatoLargo,
    esReciente: diasTotales <= 2,
  };
}

/**
 * Valida si un proyecto cumple todos los procesos y requisitos para ser aprobado por Gerencia General
 */
export function validarAprobacionGerenciaGeneral(p: ProyectoEducativo): ValidacionAprobacionGG {
  const diagAcad = calcularCumplimientoAcademico(p);
  const diagCom = calcularCumplimientoComercial(p);

  const bloqueos: string[] = [];
  const alertas: string[] = [];

  // Bloqueo si el proceso está cerrado institucionalmente
  if (p.seLlevoACabo === 'No se llevó a cabo' || p.procesoCerrado) {
    bloqueos.push('El proyecto está cerrado institucionalmente (No se llevó a cabo por cumplimiento del plazo de 20 días calendario).');
  }

  // Validaciones académicas
  if (!diagAcad.autorizado) {
    bloqueos.push('Gerencia Académica no ha emitido su firma ni autorización formal.');
  }
  if (!p.nombreDocente || p.nombreDocente.includes('Por definir')) {
    bloqueos.push('Falta asignar formalmente el docente titular del programa.');
  }
  if (!p.horasClase || p.horasClase <= 0) {
    bloqueos.push('La carga horaria académica no ha sido configurada.');
  }

  // Validaciones comerciales
  if (!diagCom.autorizado) {
    bloqueos.push('Gerencia de Comercialización no ha remitido ni autorizado la venta del proyecto.');
  }
  if ((Number(p.alumnosFinal) || 0) < 4) {
    bloqueos.push(`Matrícula insuficiente: cuenta con ${p.alumnosFinal || 0} alumnos. El mínimo institucional es de 4 inscritos pagados.`);
  }
  if (!p.metodoVenta) {
    alertas.push('Canal de venta principal no especificado formalmente.');
  }

  const porcentajeTotal = Math.round((diagAcad.porcentaje + diagCom.porcentaje) / 2);
  const puedeAprobar = bloqueos.length === 0;

  const checklist = [
    {
      gerencia: 'Académica' as const,
      item: 'Diseño Curricular & Horas de Clase',
      cumplido: Boolean(p.nombreProyecto && p.horasClase > 0),
      critico: true,
    },
    {
      gerencia: 'Académica' as const,
      item: 'Docente Titular Asignado',
      cumplido: Boolean(p.nombreDocente && !p.nombreDocente.includes('Por definir')),
      critico: true,
    },
    {
      gerencia: 'Académica' as const,
      item: 'Costos Operativos Directos',
      cumplido: Boolean((p.gastoTotalOperativo || 0) > 0),
      critico: true,
    },
    {
      gerencia: 'Académica' as const,
      item: 'Autorización y Firma Académica',
      cumplido: Boolean(p.autorizacionAcademica),
      critico: true,
    },
    {
      gerencia: 'Comercialización' as const,
      item: 'Canal de Venta & Embudo',
      cumplido: Boolean(p.metodoVenta),
      critico: false,
    },
    {
      gerencia: 'Comercialización' as const,
      item: 'Base Mínima de 4 Alumnos Inscritos',
      cumplido: (Number(p.alumnosFinal) || 0) >= 4,
      critico: true,
    },
    {
      gerencia: 'Comercialización' as const,
      item: 'Autorización y Firma Comercial',
      cumplido: Boolean(p.autorizacionComercial || p.comercializacionCompletada),
      critico: true,
    },
  ];

  return {
    puedeAprobar,
    porcentajeTotal,
    academicoCompleto: diagAcad.completo,
    comercialCompleto: diagCom.completo,
    bloqueos,
    alertas,
    checklist,
  };
}
