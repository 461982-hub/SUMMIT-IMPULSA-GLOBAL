/**
 * DESGLOSE Y SEGUIMIENTO MENSUAL POR GERENCIA - CUMPLIMIENTO POA SEP - DIC 2026
 * Summit Impulsa Global, S.A. de C.V.
 *
 * Calcula presupuesto asignado, facturado real y cantidad de grupos por mes
 * para cada una de las 3 gerencias durante el cuatrimestre de pilotaje Sep - Dic 2026.
 */

import { ProyectoEducativo, Moneda } from '../types';
import { POA_2026_DATOS } from './poa2026Data';
import { convertirAHNL } from './poaMonthlyTrackingUtils';
import { obtenerClaveMesProyecto } from './monthUtils';

export interface DesgloseMensualGerencia {
  mesNumero: number;
  nombreMes: string;
  nombreCorto: string;
  presupuestoAsignadoHNL: number;
  facturadoHNL: number;
  cantidadProyectos: number;
  proyectosAprobadosGG: number;
  porcentajeEjecucion: number;
}

export interface MetricasGerenciaPOA {
  id: 'gerencia-academica' | 'gerencia-comercializacion' | 'gerencia-general';
  nombre: string;
  lider: string;
  correo: string;
  presupuestoAnualHNL: number;
  participacionPOA: string;
  numActividades: number;
  totalFacturadoHNL: number;
  totalProyectos: number;
  proyectosAprobadosGG: number;
  porcentajeCumplimientoPresupuesto: number;
  meses: DesgloseMensualGerencia[];
}

export interface ResumenEstadosPOA {
  totalProyectos: number;
  proyectosListos: number;
  proyectosEnProceso: number;
  proyectosPlanificados: number;
  proyectosCancelados: number;
  
  // Aprobación de Gerencia General (Sello POA)
  proyectosAprobadosGG: number;
  proyectosPendientesGG: number;
  facturacionAprobadaGGHNL: number;
  facturacionPendienteGGHNL: number;

  // Facturación Global
  facturacionTotalHNL: number;
  metaFacturacionAnualHNL: number;
  porcentajeFacturacionGlobal: number;
  porcentajeFacturacionAprobada: number;

  // Metas de Proyectos
  metaAnualProyectos: number; // 74 grupos piloto
  puntoEquilibrioProyectos: number; // 69 grupos
  porcentajeCursosAlcanzados: number;
  cumplePuntoEquilibrio: boolean;
  cumpleMetaAnual: boolean;

  // Diagnóstico Directivo
  diagnostico: {
    semaforo: '🟢 ÓPTIMO' | '🟡 EN PROGRESO' | '🔴 ATENCIÓN REQUERIDA';
    color: 'emerald' | 'amber' | 'rose';
    titulo: string;
    mensaje: string;
  };
}

const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const NOMBRES_CORTOS_MESES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

// Presupuestos mensuales oficiales del POA SEP - DIC 2026 por gerencia (Índices 0 a 11)
const PRESUPUESTOS_MENSUALES_POR_GERENCIA = {
  academica: [
    0, 0, 0, 0, 0, 0, 0, 0,
    57400, // Sep 2026
    61200, // Oct 2026
    64100, // Nov 2026
    68400  // Dic 2026 (Total: L. 251,100)
  ],
  comercial: [
    0, 0, 0, 0, 0, 0, 0, 0,
    26500, // Sep 2026
    24500, // Oct 2026
    23500, // Nov 2026
    27500  // Dic 2026 (Total: L. 102,000)
  ],
  general: [
    0, 0, 0, 0, 0, 0, 0, 0,
    31000, // Sep 2026
    24000, // Oct 2026
    28000, // Nov 2026
    24000  // Dic 2026 (Total: L. 107,000)
  ],
};

/**
 * Calcula métricas mensuales para cada una de las 3 gerencias
 */
export function calcularMetricasPorGerencia(
  proyectos: ProyectoEducativo[],
  moneda: Moneda = 'LPS'
): Record<'academica' | 'comercial' | 'general', MetricasGerenciaPOA> {
  // Mapa de proyectos por mes (mesNumero: 1 a 12)
  const proyectosPorMes = Array.from({ length: 12 }, () => [] as ProyectoEducativo[]);

  proyectos.forEach(p => {
    const fecha = p.mesControl || p.fechaProgramacion || p.fechaVenta;
    let mesIndex = 0; // Default mes 1 si no hay fecha
    if (fecha) {
      const d = new Date(fecha);
      if (!isNaN(d.getTime())) {
        mesIndex = d.getMonth(); // 0 a 11
      }
    } else {
      const key = obtenerClaveMesProyecto(p);
      if (key) {
        const partes = key.split('-');
        if (partes.length === 2) {
          mesIndex = Math.max(0, Math.min(11, parseInt(partes[1], 10) - 1));
        }
      }
    }
    proyectosPorMes[mesIndex].push(p);
  });

  // 1. GERENCIA ACADÉMICA
  const mesesAcademica: DesgloseMensualGerencia[] = proyectosPorMes.map((proys, idx) => {
    const presupuestoMes = PRESUPUESTOS_MENSUALES_POR_GERENCIA.academica[idx];
    const facturadoMes = proys.reduce((sum, p) => sum + convertirAHNL(p.ingresoRealTotal || 0, moneda), 0);
    const proyectosAprobados = proys.filter(p => p.aprobacionFinalGerenciaGeneral).length;
    const porcentaje = presupuestoMes > 0 ? (facturadoMes / presupuestoMes) * 100 : 0;

    return {
      mesNumero: idx + 1,
      nombreMes: NOMBRES_MESES[idx],
      nombreCorto: NOMBRES_CORTOS_MESES[idx],
      presupuestoAsignadoHNL: presupuestoMes,
      facturadoHNL: facturadoMes,
      cantidadProyectos: proys.length,
      proyectosAprobadosGG: proyectosAprobados,
      porcentajeEjecucion: porcentaje,
    };
  });

  const totalFacturadoAcademica = mesesAcademica.reduce((sum, m) => sum + m.facturadoHNL, 0);
  const totalProyectosAcademica = proyectos.length;
  const proyectosAprobadosAcademica = proyectos.filter(p => p.aprobacionFinalGerenciaGeneral).length;

  const academica: MetricasGerenciaPOA = {
    id: 'gerencia-academica',
    nombre: 'Gerencia Académica',
    lider: 'Phd. Donal Reyes',
    correo: 'academia.summitg@gmail.com',
    presupuestoAnualHNL: 251100,
    participacionPOA: '54.6%',
    numActividades: 16,
    totalFacturadoHNL: totalFacturadoAcademica,
    totalProyectos: totalProyectosAcademica,
    proyectosAprobadosGG: proyectosAprobadosAcademica,
    porcentajeCumplimientoPresupuesto: (totalFacturadoAcademica / 251100) * 100,
    meses: mesesAcademica,
  };

  // 2. GERENCIA COMERCIAL
  const mesesComercial: DesgloseMensualGerencia[] = proyectosPorMes.map((proys, idx) => {
    const presupuestoMes = PRESUPUESTOS_MENSUALES_POR_GERENCIA.comercial[idx];
    // En comercial, se cuentan proyectos con alumnos o comercialización iniciada
    const proysComercial = proys.filter(p => p.comercializacionCompletada || (p.alumnosFinal && p.alumnosFinal > 0) || p.seLlevoACabo !== 'Cancelado');
    const facturadoMes = proysComercial.reduce((sum, p) => sum + convertirAHNL(p.ingresoRealTotal || 0, moneda), 0);
    const proyectosAprobados = proysComercial.filter(p => p.aprobacionFinalGerenciaGeneral).length;
    const porcentaje = presupuestoMes > 0 ? (facturadoMes / presupuestoMes) * 100 : 0;

    return {
      mesNumero: idx + 1,
      nombreMes: NOMBRES_MESES[idx],
      nombreCorto: NOMBRES_CORTOS_MESES[idx],
      presupuestoAsignadoHNL: presupuestoMes,
      facturadoHNL: facturadoMes,
      cantidadProyectos: proysComercial.length,
      proyectosAprobadosGG: proyectosAprobados,
      porcentajeEjecucion: porcentaje,
    };
  });

  const totalFacturadoComercial = mesesComercial.reduce((sum, m) => sum + m.facturadoHNL, 0);
  const totalProyectosComercial = proyectos.filter(p => p.comercializacionCompletada || (p.alumnosFinal && p.alumnosFinal > 0) || p.seLlevoACabo !== 'Cancelado').length;
  const proyectosAprobadosComercial = proyectos.filter(p => p.aprobacionFinalGerenciaGeneral).length;

  const comercial: MetricasGerenciaPOA = {
    id: 'gerencia-comercializacion',
    nombre: 'Gerencia Comercial y Expansión',
    lider: 'Msc. Lilian Ordoñez',
    correo: 'comercial.summitg@gmail.com',
    presupuestoAnualHNL: 102000,
    participacionPOA: '22.2%',
    numActividades: 12,
    totalFacturadoHNL: totalFacturadoComercial,
    totalProyectos: totalProyectosComercial,
    proyectosAprobadosGG: proyectosAprobadosComercial,
    porcentajeCumplimientoPresupuesto: (totalFacturadoComercial / 102000) * 100,
    meses: mesesComercial,
  };

  // 3. GERENCIA GENERAL
  const mesesGeneral: DesgloseMensualGerencia[] = proyectosPorMes.map((proys, idx) => {
    const presupuestoMes = PRESUPUESTOS_MENSUALES_POR_GERENCIA.general[idx];
    // En Gerencia General, la facturación oficial se basa en proyectos con Aprobación Final GG
    const proysAprobados = proys.filter(p => p.aprobacionFinalGerenciaGeneral);
    const facturadoMesAprobado = proysAprobados.reduce((sum, p) => sum + convertirAHNL(p.ingresoRealTotal || 0, moneda), 0);
    const porcentaje = presupuestoMes > 0 ? (facturadoMesAprobado / presupuestoMes) * 100 : 0;

    return {
      mesNumero: idx + 1,
      nombreMes: NOMBRES_MESES[idx],
      nombreCorto: NOMBRES_CORTOS_MESES[idx],
      presupuestoAsignadoHNL: presupuestoMes,
      facturadoHNL: facturadoMesAprobado,
      cantidadProyectos: proys.length,
      proyectosAprobadosGG: proysAprobados.length,
      porcentajeEjecucion: porcentaje,
    };
  });

  const totalFacturadoGeneral = proyectos
    .filter(p => p.aprobacionFinalGerenciaGeneral)
    .reduce((sum, p) => sum + convertirAHNL(p.ingresoRealTotal || 0, moneda), 0);
  const totalProyectosGeneral = proyectos.length;
  const proyectosAprobadosGeneral = proyectos.filter(p => p.aprobacionFinalGerenciaGeneral).length;

  const general: MetricasGerenciaPOA = {
    id: 'gerencia-general',
    nombre: 'Gerencia General',
    lider: 'Dr. Walter Pedroza',
    correo: 'administracion.summitg@gmail.com',
    presupuestoAnualHNL: 107000,
    participacionPOA: '23.3%',
    numActividades: 12,
    totalFacturadoHNL: totalFacturadoGeneral,
    totalProyectos: totalProyectosGeneral,
    proyectosAprobadosGG: proyectosAprobadosGeneral,
    porcentajeCumplimientoPresupuesto: (totalFacturadoGeneral / 107000) * 100,
    meses: mesesGeneral,
  };

  return {
    academica,
    comercial,
    general,
  };
}

/**
 * Calcula el resumen consolidado de estados institucionales ("¿En qué estado estamos?")
 */
export function calcularResumenEstadosPOA(
  proyectos: ProyectoEducativo[],
  moneda: Moneda = 'LPS'
): ResumenEstadosPOA {
  const totalProyectos = proyectos.length;
  const proyectosListos = proyectos.filter(p => p.seLlevoACabo === 'Listo').length;
  const proyectosEnProceso = proyectos.filter(p => p.seLlevoACabo === 'En proceso' || p.seLlevoACabo === 'En curso').length;
  const proyectosPlanificados = proyectos.filter(p => p.seLlevoACabo === 'Planificado').length;
  const proyectosCancelados = proyectos.filter(p => p.seLlevoACabo === 'Cancelado').length;

  const proyectosAprobadosGG = proyectos.filter(p => p.aprobacionFinalGerenciaGeneral).length;
  const proyectosPendientesGG = totalProyectos - proyectosAprobadosGG;

  const facturacionTotalHNL = proyectos.reduce((sum, p) => sum + convertirAHNL(p.ingresoRealTotal || 0, moneda), 0);
  const facturacionAprobadaGGHNL = proyectos
    .filter(p => p.aprobacionFinalGerenciaGeneral)
    .reduce((sum, p) => sum + convertirAHNL(p.ingresoRealTotal || 0, moneda), 0);
  const facturacionPendienteGGHNL = Math.max(0, facturacionTotalHNL - facturacionAprobadaGGHNL);

  const metaFacturacionAnualHNL = POA_2026_DATOS.resumen.ingresosProyectados;
  const metaAnualProyectos = POA_2026_DATOS.resumen.metaAnualProyectos;
  const puntoEquilibrioProyectos = POA_2026_DATOS.resumen.puntoEquilibrioAnual;

  const porcentajeFacturacionGlobal = Math.min(100, (facturacionTotalHNL / metaFacturacionAnualHNL) * 100);
  const porcentajeFacturacionAprobada = Math.min(100, (facturacionAprobadaGGHNL / metaFacturacionAnualHNL) * 100);
  const porcentajeCursosAlcanzados = Math.min(100, (totalProyectos / metaAnualProyectos) * 100);

  const cumplePuntoEquilibrio = totalProyectos >= puntoEquilibrioProyectos;
  const cumpleMetaAnual = totalProyectos >= metaAnualProyectos;

  let diagnostico: ResumenEstadosPOA['diagnostico'];
  if (porcentajeFacturacionAprobada >= 80 || (cumplePuntoEquilibrio && porcentajeFacturacionGlobal >= 75)) {
    diagnostico = {
      semaforo: '🟢 ÓPTIMO',
      color: 'emerald',
      titulo: 'En Ruta de Cumplimiento Óptimo',
      mensaje: 'La facturación formal y el volumen de grupos avanzan sólidamente hacia las metas del POA SEP - DIC 2026 (74 grupos).',
    };
  } else if (totalProyectos > 0) {
    diagnostico = {
      semaforo: '🟡 EN PROGRESO',
      color: 'amber',
      titulo: 'Desarrollo en Curso - Dictámenes Pendientes',
      mensaje: 'Existen grupos en el flujo de Comercialización y pendientes de Aprobación Final de Gerencia General para consolidar formalmente el POA 2026.',
    };
  } else {
    diagnostico = {
      semaforo: '🔴 ATENCIÓN REQUERIDA',
      color: 'rose',
      titulo: 'Sin Grupos Aprobados Registrados',
      mensaje: 'Se requiere iniciar el registro y apertura de los grupos académicos para alimentar el cumplimiento del POA SEP - DIC 2026.',
    };
  }

  return {
    totalProyectos,
    proyectosListos,
    proyectosEnProceso,
    proyectosPlanificados,
    proyectosCancelados,
    proyectosAprobadosGG,
    proyectosPendientesGG,
    facturacionAprobadaGGHNL,
    facturacionPendienteGGHNL,
    facturacionTotalHNL,
    metaFacturacionAnualHNL,
    porcentajeFacturacionGlobal,
    porcentajeFacturacionAprobada,
    metaAnualProyectos,
    puntoEquilibrioProyectos,
    porcentajeCursosAlcanzados,
    cumplePuntoEquilibrio,
    cumpleMetaAnual,
    diagnostico,
  };
}
