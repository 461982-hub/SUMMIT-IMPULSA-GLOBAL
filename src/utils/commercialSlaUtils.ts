import { ProyectoEducativo, AvisoProyectoItem, HistorialCambioProyecto } from '../types';
import { 
  contarDiasHabilesEntreFechas, 
  normalizarFechaYYYYMMDD, 
  formatearFechaCorta 
} from './dateUtils';
import { formatearMoneda } from './calculations';

export const TOTAL_DIAS_HABILES_CICLO = 25; // 25 días hábiles totales desde creación en Académica
export const MAX_DIAS_HABILES_GG = 5;       // 5 días hábiles máximos de revisión en Gerencia General
export const MIN_ALUMNOS_INICIO_CURSO = 6;  // Umbral institucional mínimo para iniciar curso y remitir a GG

const formatearHNL = (valor: number) => formatearMoneda(valor, 'LPS');

export interface SlaComercialCalculado {
  totalDiasHabiles: number; // 25
  maxDiasGG: number; // 5
  minAlumnosRequeridos: number; // 6
  
  fechaCreacionAcademica: string;
  fechaCreacionFormateada: string;
  fechaAprobacionGG?: string;
  fechaAprobacionGGFormateada: string;
  
  diasUsadosGG: number; // 1 a 5 días
  diasAhorradosGG: number; // Si GG revisa en menos tiempo, días que se le suman a Comercialización
  diasAsignadosComercial: number; // 25 - diasUsadosGG (ej. 24 si GG tardó 1 día)
  
  diasConsumidosComercial: number;
  diasRestantesComercial: number;
  porcentajeTiempoConsumido: number;
  
  alumnosMatriculados: number;
  cupoMinimoCubierto: boolean; // >= 6
  alumnosFaltantes: number;
  porcentajeAlumnosMeta: number;
  
  cursoIniciadoComercial: boolean;
  remitidoGGParaPOA: boolean;
  aprobadoFinalPOA: boolean;
  montoRebajaPOAHNL: number;
  
  estadoEtiqueta: string;
  colorBadge: string;
}

/**
 * Calcula el SLA institucional de 25 días hábiles totales:
 * - Inicia cuando Gerencia Académica crea el sílabo / proyecto.
 * - Gerencia General tiene hasta 5 días hábiles máximos para revisión y dictamen financiero.
 * - Si Gerencia General lo revisa en menos tiempo (ej. 1 día hábil), los días no usados
 *   se le suman a la Gerencia de Comercialización para su proceso.
 * - Umbral de 6 alumnos matriculados para habilitar el inicio del curso y remitirlo de regreso
 *   a Gerencia General para aprobación final y rebaja del POA.
 */
export function calcularSlaComercial(proyecto: ProyectoEducativo): SlaComercialCalculado {
  const hoyStr = normalizarFechaYYYYMMDD();
  
  // 1. Fecha de creación académica (inicio del cronómetro institucional de 25 días hábiles)
  const fechaCreacionRaw = 
    proyecto.fechaEnvioRevisionGG ||
    proyecto.fechaCreacion ||
    proyecto.fechaElaboracion ||
    proyecto.registroAuditoria?.fechaHoraCreacion ||
    proyecto.fechaProgramacion ||
    hoyStr;
    
  const fechaCreacion = normalizarFechaYYYYMMDD(fechaCreacionRaw);
  
  // 2. Fecha de aprobación por Gerencia General (si ya ocurrió)
  const fechaAprobacionGGRaw = 
    proyecto.fechaAprobacionGerenciaGeneralPrevia || 
    proyecto.fechaRevisionGerenciaGeneral ||
    proyecto.fechaEnvioComercializacion;
    
  const tieneAprobacionGG = Boolean(proyecto.aprobadoPorGerenciaGeneralPrevia || fechaAprobacionGGRaw);
  const fechaAprobacionGG = tieneAprobacionGG && fechaAprobacionGGRaw ? normalizarFechaYYYYMMDD(fechaAprobacionGGRaw) : undefined;
  
  // 3. Días hábiles tomados por Gerencia General (máximo 5)
  let diasUsadosGG = 1;
  if (tieneAprobacionGG && fechaAprobacionGG) {
    const diff = contarDiasHabilesEntreFechas(fechaCreacion, fechaAprobacionGG);
    // Mínimo 1 día hábil asignado de revisión, con tope máximo de 5 días
    diasUsadosGG = Math.min(MAX_DIAS_HABILES_GG, Math.max(1, diff));
  } else {
    // Si aún está en revisión por GG
    const diffActual = contarDiasHabilesEntreFechas(fechaCreacion, hoyStr);
    diasUsadosGG = Math.min(MAX_DIAS_HABILES_GG, Math.max(1, diffActual));
  }
  
  // Días ahorrados por GG que se transfieren a Comercialización
  const diasAhorradosGG = Math.max(0, MAX_DIAS_HABILES_GG - diasUsadosGG);
  
  // 4. Días hábiles totales disponibles para Comercialización:
  // Regla: 25 días hábiles totales menos los días hábiles usados por GG.
  // Si GG revisa en 1 día, Comercialización tiene 24 días.
  // Si GG revisa en 5 días, Comercialización tiene 20 días.
  const diasAsignadosComercial = Math.max(1, TOTAL_DIAS_HABILES_CICLO - diasUsadosGG);
  
  // 5. Días consumidos y restantes en Comercialización
  let diasConsumidosComercial = 0;
  if (tieneAprobacionGG && fechaAprobacionGG) {
    diasConsumidosComercial = contarDiasHabilesEntreFechas(fechaAprobacionGG, hoyStr);
  }
  
  const diasRestantesComercial = Math.max(0, diasAsignadosComercial - diasConsumidosComercial);
  const porcentajeTiempoConsumido = Math.min(100, Math.round((diasConsumidosComercial / diasAsignadosComercial) * 100));
  
  // 6. Conteo de alumnos matriculados y umbral institucional de 6 alumnos
  const alumnosMatriculados = Number(proyecto.alumnosFinal || 0);
  const cupoMinimoCubierto = alumnosMatriculados >= MIN_ALUMNOS_INICIO_CURSO;
  const alumnosFaltantes = Math.max(0, MIN_ALUMNOS_INICIO_CURSO - alumnosMatriculados);
  const porcentajeAlumnosMeta = Math.min(100, Math.round((alumnosMatriculados / MIN_ALUMNOS_INICIO_CURSO) * 100));
  
  // 7. Estados de flujo
  const cursoIniciadoComercial = Boolean(
    proyecto.inicioCursoHabilitadoComercial ||
    proyecto.remitidoGGParaAprobacionPOA ||
    (proyecto.autorizacionComercial && cupoMinimoCubierto)
  );
  
  const aprobadoFinalPOA = Boolean(
    proyecto.aprobacionFinalGerenciaGeneral || 
    proyecto.aprobadoInicioDefinitivoGG ||
    proyecto.etapaFlujo === 'aprobado_listo'
  );
  
  const remitidoGGParaPOA = Boolean(
    cursoIniciadoComercial && !aprobadoFinalPOA
  );
  
  // Monto para rebaja del POA
  const precioAlumno = proyecto.precioSugeridoConISV || proyecto.precioSugeridoAlumno || 2500;
  const montoRebajaPOAHNL = proyecto.montoFacturacionAprobadaHNL || 
    (proyecto.ingresoTotalConISV || proyecto.ingresoRealTotal || (precioAlumno * alumnosMatriculados));

  // Etiqueta y color
  let estadoEtiqueta = 'En Proceso';
  let colorBadge = 'bg-blue-100 text-blue-800 border-blue-200';
  
  if (aprobadoFinalPOA) {
    estadoEtiqueta = '✅ Aprobado GG & Rebajado de POA';
    colorBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  } else if (remitidoGGParaPOA) {
    estadoEtiqueta = '🚀 Iniciado por Comercialización (Pendiente Dictamen GG & POA)';
    colorBadge = 'bg-purple-100 text-purple-800 border-purple-300';
  } else if (cupoMinimoCubierto) {
    estadoEtiqueta = `🎯 Cupo Cubierto (${alumnosMatriculados}/6) - Listo para Iniciar`;
    colorBadge = 'bg-teal-100 text-teal-800 border-teal-300 animate-pulse';
  } else if (tieneAprobacionGG) {
    estadoEtiqueta = `📢 En Comercialización (${diasRestantesComercial}d hábiles restantes)`;
    colorBadge = 'bg-amber-100 text-amber-800 border-amber-300';
  } else {
    estadoEtiqueta = '⏳ En Revisión por Gerencia General (Máx 5d hábiles)';
    colorBadge = 'bg-slate-100 text-slate-800 border-slate-300';
  }

  return {
    totalDiasHabiles: TOTAL_DIAS_HABILES_CICLO,
    maxDiasGG: MAX_DIAS_HABILES_GG,
    minAlumnosRequeridos: MIN_ALUMNOS_INICIO_CURSO,
    
    fechaCreacionAcademica: fechaCreacion,
    fechaCreacionFormateada: formatearFechaCorta(fechaCreacion),
    fechaAprobacionGG,
    fechaAprobacionGGFormateada: fechaAprobacionGG ? formatearFechaCorta(fechaAprobacionGG) : 'Pendiente',
    
    diasUsadosGG,
    diasAhorradosGG,
    diasAsignadosComercial,
    
    diasConsumidosComercial,
    diasRestantesComercial,
    porcentajeTiempoConsumido,
    
    alumnosMatriculados,
    cupoMinimoCubierto,
    alumnosFaltantes,
    porcentajeAlumnosMeta,
    
    cursoIniciadoComercial,
    remitidoGGParaPOA,
    aprobadoFinalPOA,
    montoRebajaPOAHNL,
    
    estadoEtiqueta,
    colorBadge,
  };
}

/**
 * Función ejecutada por la GERENCIA DE COMERCIALIZACIÓN para dar inicio formal al curso
 * una vez alcanzado o superado el cupo mínimo de 6 alumnos.
 * Traslada el proyecto de regreso a la GERENCIA GENERAL para su Aprobación Final y Rebaja del POA.
 */
export function habilitarInicioCursoPorComercializacion(
  proyecto: ProyectoEducativo,
  responsableComercial: string = 'Lic. Walter Rene / Gerencia Comercialización'
): ProyectoEducativo {
  const alumnos = Number(proyecto.alumnosFinal || 0);
  if (alumnos < MIN_ALUMNOS_INICIO_CURSO) {
    throw new Error(`No se puede iniciar el curso: se requieren mínimo ${MIN_ALUMNOS_INICIO_CURSO} alumnos matriculados (actualmente: ${alumnos}).`);
  }

  const ahora = new Date().toISOString();
  const fechaHoy = ahora.slice(0, 10);
  const horaHoy = new Date().toLocaleTimeString('es-HN');

  const sla = calcularSlaComercial(proyecto);
  const codEmpresa = proyecto.codigoProyecto || proyecto.codigoPrograma || 'SIG-ACAD-2026-001';
  const precioPorAlumno = proyecto.precioSugeridoConISV || proyecto.precioSugeridoAlumno || 2500;
  const montoRecaudado = proyecto.ingresoTotalConISV || proyecto.ingresoRealTotal || (precioPorAlumno * alumnos);

  const descripcionCierre = `La Gerencia de Comercialización cubrió y consolidó la matrícula oficial con ${alumnos} alumnos (mínimo de 6 alcanzado con éxito). Se dio inicio al curso "${proyecto.nombreProyecto}" en ${sla.diasConsumidosComercial} días hábiles (de ${sla.diasAsignadosComercial}d asignados). Se traslada formalmente a GERENCIA GENERAL para Dictamen Definitivo y Rebaja de Metas del POA 2026 (${formatearHNL(montoRecaudado)}).`;

  const avisoComercial: AvisoProyectoItem = {
    id: `aviso-comercial-inicio-${Date.now()}`,
    fechaHora: `${fechaHoy} ${horaHoy}`,
    origen: 'Gerencia de Comercialización',
    destino: 'Gerencia General',
    etapa: 'dictamen_general',
    titulo: `🚀 Inicio de Curso Habilitado por Comercialización (${alumnos}/6 Alumnos) - ${codEmpresa}`,
    descripcion: descripcionCierre,
    codigoEmpresa: codEmpresa,
    codigoSAR: proyecto.correlativoSAR || '000-001-01-00000001',
    correosNotificados: ['administracion.summitg@gmail.com', 'comercial.summitg@gmail.com', 'academia.summitg@gmail.com'],
    estadoEnvio: 'Enviado',
  };

  const historialItem: HistorialCambioProyecto = {
    id: `hist-comercial-inicio-${Date.now()}`,
    fecha: ahora,
    usuario: responsableComercial,
    tipoCambio: 'estado',
    titulo: `Inicio de Curso Formalizado por Comercialización (${alumnos} Alumnos Matriculados)`,
    descripcion: descripcionCierre,
  };

  return {
    ...proyecto,
    inicioCursoHabilitadoComercial: true,
    fechaInicioCursoHabilitado: ahora,
    autorizacionComercial: true,
    comercializacionCompletada: true,
    fechaAutorizacionComercial: fechaHoy,
    responsableComercial,
    aprobadoPorComercial: responsableComercial,
    observacionesAutorizacionComercial: descripcionCierre,
    remitidoGGParaAprobacionPOA: true,
    etapaFlujo: 'dictamen_general',
    seLlevoACabo: 'Realizar',
    diasHabilesAsignadosComercial: sla.diasAsignadosComercial,
    diasHabilesTomadosGG: sla.diasUsadosGG,
    avisosProyecto: [avisoComercial, ...(proyecto.avisosProyecto || [])],
    historialCambios: [historialItem, ...(proyecto.historialCambios || [])],
    registroAuditoria: {
      ...proyecto.registroAuditoria,
      ultimaModificacion: `${fechaHoy} por ${responsableComercial} (Inicio de Curso Autorizado - ${alumnos} Alumnos)`,
      equipoModifico: 'Gerencia de Comercialización',
    }
  };
}

/**
 * Función ejecutada por la GERENCIA GENERAL para dar la APROBACIÓN FINAL DE INICIO
 * y aplicar la REBAJA FORMAL DE METAS DEL POA 2026.
 */
export function aprobarInicioDefinitivoYRebajarPOAGG(
  proyecto: ProyectoEducativo,
  usuarioAprobador: string = 'Dr. Walter Rene Pedroza - Gerencia General',
  observacionesAdicionales?: string
): ProyectoEducativo {
  const ahora = new Date().toISOString();
  const fechaHoy = ahora.slice(0, 10);
  const horaHoy = new Date().toLocaleTimeString('es-HN');

  const alumnos = Number(proyecto.alumnosFinal || 6);
  const codEmpresa = proyecto.codigoProyecto || proyecto.codigoPrograma || 'SIG-ACAD-2026-001';
  const precioPorAlumno = proyecto.precioSugeridoConISV || proyecto.precioSugeridoAlumno || 2500;
  const montoFacturadoTotal = proyecto.montoFacturacionAprobadaHNL || 
    proyecto.ingresoTotalConISV || 
    proyecto.ingresoRealTotal || 
    (precioPorAlumno * alumnos);

  const motivoAprobacion = observacionesAdicionales?.trim() || 
    `Aprobación Ejecutiva de Inicio de Curso y Rebaja Formal de Metas del Plan Operativo Anual (POA 2026). Dr. Walter Rene Pedroza. Con ${alumnos} alumnos matriculados confirmados, se imputa una facturación de ${formatearHNL(montoFacturadoTotal)} que rebaja la cuota del mes correspondiente.`;

  const avisoGG: AvisoProyectoItem = {
    id: `aviso-gg-aprob-final-${Date.now()}`,
    fechaHora: `${fechaHoy} ${horaHoy}`,
    origen: 'Gerencia General',
    destino: 'Todas las Gerencias',
    etapa: 'aprobado_listo',
    titulo: `✅ Aprobación Final de Inicio & Rebaja de POA Imputada (${codEmpresa})`,
    descripcion: motivoAprobacion,
    codigoEmpresa: codEmpresa,
    codigoSAR: proyecto.correlativoSAR || '000-001-01-00000001',
    correosNotificados: ['administracion.summitg@gmail.com', 'comercial.summitg@gmail.com', 'academia.summitg@gmail.com'],
    estadoEnvio: 'Enviado',
  };

  const historialItem: HistorialCambioProyecto = {
    id: `hist-gg-aprob-final-${Date.now()}`,
    fecha: ahora,
    usuario: usuarioAprobador,
    tipoCambio: 'estado',
    titulo: `Aprobación Final de Inicio y Rebaja de Metas del POA`,
    descripcion: motivoAprobacion,
  };

  return {
    ...proyecto,
    aprobacionFinalGerenciaGeneral: true,
    aprobadoInicioDefinitivoGG: true,
    fechaAprobacionInicioDefinitivoGG: fechaHoy,
    fechaAprobacionGerenciaGeneral: fechaHoy,
    aprobadoPorGerenciaGeneral: usuarioAprobador,
    observacionesAprobacionGeneral: motivoAprobacion,
    montoFacturacionAprobadaHNL: montoFacturadoTotal,
    seLlevoACabo: 'Listo',
    etapaFlujo: 'aprobado_listo',
    avisosProyecto: [avisoGG, ...(proyecto.avisosProyecto || [])],
    historialCambios: [historialItem, ...(proyecto.historialCambios || [])],
    registroAuditoria: {
      ...proyecto.registroAuditoria,
      ultimaModificacion: `${fechaHoy} por ${usuarioAprobador} (Aprobado Inicio y Rebajado POA: ${formatearHNL(montoFacturadoTotal)})`,
      equipoModifico: 'Gerencia General - Dr. Walter Rene Pedroza',
    }
  };
}
