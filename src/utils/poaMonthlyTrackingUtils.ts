/**
 * SISTEMA DE CONTROL DIRECTIVO POA SEP - DIC 2026 - FACTURACIÓN MENSUAL & DEDUCCIÓN POR PROYECTO
 * Summit Impulsa Global, S.A. de C.V.
 *
 * Permite a la Gerencia General dar su Aprobación Final a cada proyecto educativo y,
 * con base en los valores del POA SEP - DIC 2026, rebajar mensualmente lo facturado respecto
 * a lo planificado, verificando si lo facturado concuerda con lo establecido en el POA.
 */

import { ProyectoEducativo, Moneda } from '../types';
import { POA_2027_DATOS, formatearHNL } from './poa2027Data';
import { obtenerClaveMesProyecto, formatearEtiquetaMes } from './monthUtils';

const TASA_CAMBIO_REF = POA_2027_DATOS.resumen.tipoCambio; // 27.00 HNL / USD
export const META_ANUAL_FACTURACION_POA_HNL = POA_2027_DATOS.resumen.ingresosProyectados; // L. 346,320.00

/**
 * Convierte cualquier monto de moneda de la app a Lempiras (HNL)
 */
export function convertirAHNL(monto: number, moneda: Moneda | string = 'LPS'): number {
  if (!monto || isNaN(monto)) return 0;
  if (moneda === 'USD') return monto * TASA_CAMBIO_REF;
  if (moneda === 'EUR') return monto * (TASA_CAMBIO_REF * 1.08);
  if (moneda === 'MXN') return monto * 1.35;
  return monto;
}

/**
 * Retorna la meta mensual de facturación en HNL del POA SEP - DIC 2026 según el mes de ejecución:
 * Septiembre 2026: 16 grupos = L. 74,880.00
 * Octubre 2026: 18 grupos = L. 84,240.00
 * Noviembre 2026: 19 grupos = L. 88,920.00
 * Diciembre 2026: 21 grupos = L. 98,280.00
 * Total cuatrimestre: 74 grupos = L. 346,320.00
 */
export function obtenerMetaFacturacionMensualPOA(mesNumero: number): number {
  if (mesNumero === 9) {
    return 74880.00; // Septiembre 2026
  } else if (mesNumero === 10) {
    return 84240.00; // Octubre 2026
  } else if (mesNumero === 11) {
    return 88920.00; // Noviembre 2026
  } else if (mesNumero === 12) {
    return 98280.00; // Diciembre 2026
  } else {
    return 86580.00; // Promedio mensual cuatrimestral
  }
}

export function obtenerTrimestrePorMes(mesNumero: number): 'Q1' | 'Q2' | 'Q3' | 'Q4' {
  if (mesNumero <= 3) return 'Q1';
  if (mesNumero <= 6) return 'Q2';
  if (mesNumero <= 9) return 'Q3';
  return 'Q4';
}

export interface SeguimientoMensualPOA {
  mesKey: string; // YYYY-MM
  etiquetaMes: string; // ej: "Agosto 2026"
  mesNumero: number;
  anio: number;
  trimestre: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  
  // Metas POA
  metaFacturacionPOAHNL: number; // Planificado en el POA para este mes
  
  // Realidad y Rebajas
  facturacionTotalMesHNL: number; // Todo lo facturado en el mes
  facturacionAprobadaGGHNL: number; // Facturación de proyectos con Aprobación Final de GG (Lo rebajado oficial)
  facturacionPendienteGGHNL: number; // Facturación en espera de Aprobación Final de GG
  
  // Brecha y Cumplimiento
  saldoRestantePOAHNL: number; // Lo que falta facturar para cumplir la meta: max(0, meta - aprobado)
  superavitPOAHNL: number; // Excedente sobre la meta si se superó el plan
  porcentajeCumplimientoAprobado: number; // (facturacionAprobadaGGHNL / meta) * 100
  porcentajeCumplimientoTotal: number; // (facturacionTotalMesHNL / meta) * 100
  
  // Conteo de proyectos
  proyectosTotales: number;
  proyectosAprobadosGG: number;
  proyectosPendientesGG: number;
  
  // Diagnóstico
  estadoCumplimiento: 'META_SUPERADA' | 'EN_CAMINO' | 'DEFICIT_PENDIENTE' | 'SIN_FACTURACION';
  proyectos: ProyectoEducativo[];
}

export interface ResumenConsolidadoPOAMensual {
  metaAnualPOAHNL: number;
  totalFacturadoHNL: number;
  totalAprobadoGGHNL: number;
  totalPendienteGGHNL: number;
  saldoRestanteAnualHNL: number;
  superavitAnualHNL: number;
  porcentajeCumplimientoAnualAprobado: number;
  porcentajeCumplimientoAnualTotal: number;
  proyectosTotales: number;
  proyectosAprobadosGG: number;
  proyectosPendientesGG: number;
  meses: SeguimientoMensualPOA[];
}

/**
 * Calcula el seguimiento mensual del POA y las rebajas ejecutadas por Gerencia General
 */
export function calcularSeguimientoMensualPOA(
  proyectos: ProyectoEducativo[],
  moneda: Moneda | string = 'LPS'
): ResumenConsolidadoPOAMensual {
  // 1. Agrupar proyectos por clave de mes (YYYY-MM)
  const mapaMeses = new Map<string, ProyectoEducativo[]>();

  proyectos.forEach((p) => {
    const key = obtenerClaveMesProyecto(p);
    if (!key) return;
    if (!mapaMeses.has(key)) {
      mapaMeses.set(key, []);
    }
    mapaMeses.get(key)!.push(p);
  });

  // Si no hay proyectos, al menos proveer el mes actual
  if (mapaMeses.size === 0) {
    const hoy = new Date();
    const keyActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    mapaMeses.set(keyActual, []);
  }

  // 2. Ordenar las claves cronológicamente
  const clavesOrdenadas = Array.from(mapaMeses.keys()).sort();

  const mesesSeguimiento: SeguimientoMensualPOA[] = clavesOrdenadas.map((mesKey) => {
    const [anioStr, mesStr] = mesKey.split('-');
    const anio = parseInt(anioStr, 10) || new Date().getFullYear();
    const mesNumero = parseInt(mesStr, 10) || 1;
    const etiquetaMes = formatearEtiquetaMes(mesKey);
    const trimestre = obtenerTrimestrePorMes(mesNumero);
    const metaFacturacionPOAHNL = obtenerMetaFacturacionMensualPOA(mesNumero);

    const listaProyectos = mapaMeses.get(mesKey) || [];

    let facturacionTotalMesHNL = 0;
    let facturacionAprobadaGGHNL = 0;
    let facturacionPendienteGGHNL = 0;
    let proyectosAprobadosGG = 0;
    let proyectosPendientesGG = 0;

    listaProyectos.forEach((p) => {
      const ingresoHNL = convertirAHNL(p.ingresoRealTotal || 0, moneda);
      facturacionTotalMesHNL += ingresoHNL;

      const estaAprobadoGG = Boolean(p.aprobacionFinalGerenciaGeneral);
      if (estaAprobadoGG) {
        facturacionAprobadaGGHNL += ingresoHNL;
        proyectosAprobadosGG += 1;
      } else {
        facturacionPendienteGGHNL += ingresoHNL;
        proyectosPendientesGG += 1;
      }
    });

    const saldoRestantePOAHNL = Math.max(0, metaFacturacionPOAHNL - facturacionAprobadaGGHNL);
    const superavitPOAHNL = Math.max(0, facturacionAprobadaGGHNL - metaFacturacionPOAHNL);

    const porcentajeCumplimientoAprobado = metaFacturacionPOAHNL > 0
      ? (facturacionAprobadaGGHNL / metaFacturacionPOAHNL) * 100
      : 0;

    const porcentajeCumplimientoTotal = metaFacturacionPOAHNL > 0
      ? (facturacionTotalMesHNL / metaFacturacionPOAHNL) * 100
      : 0;

    let estadoCumplimiento: SeguimientoMensualPOA['estadoCumplimiento'] = 'SIN_FACTURACION';
    if (facturacionAprobadaGGHNL >= metaFacturacionPOAHNL) {
      estadoCumplimiento = 'META_SUPERADA';
    } else if (facturacionAprobadaGGHNL >= metaFacturacionPOAHNL * 0.5) {
      estadoCumplimiento = 'EN_CAMINO';
    } else if (facturacionAprobadaGGHNL > 0 || facturacionPendienteGGHNL > 0) {
      estadoCumplimiento = 'DEFICIT_PENDIENTE';
    } else {
      estadoCumplimiento = 'SIN_FACTURACION';
    }

    return {
      mesKey,
      etiquetaMes,
      mesNumero,
      anio,
      trimestre,
      metaFacturacionPOAHNL,
      facturacionTotalMesHNL,
      facturacionAprobadaGGHNL,
      facturacionPendienteGGHNL,
      saldoRestantePOAHNL,
      superavitPOAHNL,
      porcentajeCumplimientoAprobado,
      porcentajeCumplimientoTotal,
      proyectosTotales: listaProyectos.length,
      proyectosAprobadosGG,
      proyectosPendientesGG,
      estadoCumplimiento,
      proyectos: listaProyectos,
    };
  });

  // 3. Resumen Consolidado Anual
  const metaAnualPOAHNL = META_ANUAL_FACTURACION_POA_HNL;
  let totalFacturadoHNL = 0;
  let totalAprobadoGGHNL = 0;
  let totalPendienteGGHNL = 0;
  let proyectosTotales = 0;
  let proyectosAprobadosGG = 0;
  let proyectosPendientesGG = 0;

  mesesSeguimiento.forEach((m) => {
    totalFacturadoHNL += m.facturacionTotalMesHNL;
    totalAprobadoGGHNL += m.facturacionAprobadaGGHNL;
    totalPendienteGGHNL += m.facturacionPendienteGGHNL;
    proyectosTotales += m.proyectosTotales;
    proyectosAprobadosGG += m.proyectosAprobadosGG;
    proyectosPendientesGG += m.proyectosPendientesGG;
  });

  const saldoRestanteAnualHNL = Math.max(0, metaAnualPOAHNL - totalAprobadoGGHNL);
  const superavitAnualHNL = Math.max(0, totalAprobadoGGHNL - metaAnualPOAHNL);
  const porcentajeCumplimientoAnualAprobado = metaAnualPOAHNL > 0
    ? (totalAprobadoGGHNL / metaAnualPOAHNL) * 100
    : 0;
  const porcentajeCumplimientoAnualTotal = metaAnualPOAHNL > 0
    ? (totalFacturadoHNL / metaAnualPOAHNL) * 100
    : 0;

  return {
    metaAnualPOAHNL,
    totalFacturadoHNL,
    totalAprobadoGGHNL,
    totalPendienteGGHNL,
    saldoRestanteAnualHNL,
    superavitAnualHNL,
    porcentajeCumplimientoAnualAprobado,
    porcentajeCumplimientoAnualTotal,
    proyectosTotales,
    proyectosAprobadosGG,
    proyectosPendientesGG,
    meses: mesesSeguimiento,
  };
}

/**
 * Aprueba un proyecto por parte de la Gerencia General para rebajar formalmente del POA
 */
export function emitirAprobacionFinalGerenciaGeneral(
  proyecto: ProyectoEducativo,
  aprobadoPor: string = 'Dr. Walter Pedroza - Gerencia General',
  observaciones: string = 'Aprobado formalmente por Gerencia General. Cumple rentabilidad y descuenta meta de facturación mensual del POA SEP - DIC 2026.',
  moneda: Moneda | string = 'LPS'
): ProyectoEducativo {
  const fechaHoy = new Date().toISOString().split('T')[0];
  const montoFacturadoHNL = convertirAHNL(proyecto.ingresoRealTotal || 0, moneda);

  const historial = [
    ...(proyecto.historialCambios || []),
    {
      id: `hist-gg-${Date.now()}`,
      fecha: new Date().toISOString(),
      usuario: aprobadoPor,
      tipoCambio: 'aprobacion' as any,
      titulo: 'Aprobación Final de Gerencia General (Rebaja POA)',
      descripcion: `Proyecto aprobado formalmente. Se descuentan ${formatearHNL(montoFacturadoHNL)} de la meta de facturación del mes ${proyecto.mesControl || 'correspondiente'}.`,
    },
  ];

  return {
    ...proyecto,
    aprobacionFinalGerenciaGeneral: true,
    fechaAprobacionGerenciaGeneral: fechaHoy,
    aprobadoPorGerenciaGeneral: aprobadoPor,
    observacionesAprobacionGeneral: observaciones,
    montoFacturacionAprobadaHNL: montoFacturadoHNL,
    seLlevoACabo: proyecto.seLlevoACabo === 'Planificado' || proyecto.seLlevoACabo === 'En proceso' ? 'Listo' : proyecto.seLlevoACabo,
    etapaFlujo: 'aprobado_listo',
    fechaNotificacionGeneral: new Date().toISOString(),
    historialCambios: historial,
  };
}

/**
 * Revoca la aprobación final de un proyecto
 */
export function revocarAprobacionFinalGerenciaGeneral(
  proyecto: ProyectoEducativo,
  usuario: string = 'Dr. Walter Pedroza - Gerencia General',
  motivo: string = 'Aprobación revocada por revisión presupuestaria o ajuste de cupos.'
): ProyectoEducativo {
  const historial = [
    ...(proyecto.historialCambios || []),
    {
      id: `hist-gg-rev-${Date.now()}`,
      fecha: new Date().toISOString(),
      usuario,
      tipoCambio: 'aprobacion' as any,
      titulo: 'Revocación de Aprobación Final de Gerencia General',
      descripcion: `Se revoca la aprobación final. Motivo: ${motivo}. La facturación deja de descontar la meta mensual del POA.`,
    },
  ];

  return {
    ...proyecto,
    aprobacionFinalGerenciaGeneral: false,
    fechaAprobacionGerenciaGeneral: undefined,
    aprobadoPorGerenciaGeneral: undefined,
    observacionesAprobacionGeneral: motivo,
    montoFacturacionAprobadaHNL: 0,
    etapaFlujo: 'dictamen_general',
    historialCambios: historial,
  };
}
