import { 
  ProyectoEducativo, 
  Moneda, 
  RegistroCierreMensual, 
  DictamenCierreMensual, 
  EstadoCierreMensual,
  AlertaCierreMensual,
  ChecklistCierreMensual 
} from '../types';
import { POA_2026_DATOS, formatearHNL } from './poa2026Data';
import { obtenerClaveMesProyecto, formatearEtiquetaMes } from './monthUtils';

export const STORAGE_KEY_CIERRES_MENSUALES = 'summit_cierres_mensuales_poa_v1';

export const META_MENSUAL_PROYECTOS_POA = 18.5; // 74 grupos cuatrimestrales (promedio 18.5 grupos/mes)
export const BREAK_EVEN_PROYECTOS_POA = 17.3;   // 69.0 grupos en el cuatrimestre para 100% gastos cubiertos
export const MARGEN_POA_META_PCT = 2.6;         // Margen operativo establecido en POA SEP - DIC 2026

const TASA_CAMBIO_REFERENCIAL = POA_2026_DATOS.resumen.tipoCambio; // 27.00 HNL/USD

/**
 * Convierte un monto a HNL (Lempiras)
 */
function aLempiras(monto: number, moneda: Moneda | string): number {
  if (!monto || isNaN(monto)) return 0;
  if (moneda === 'USD') return monto * TASA_CAMBIO_REFERENCIAL;
  if (moneda === 'EUR') return monto * (TASA_CAMBIO_REFERENCIAL * 1.08);
  if (moneda === 'MXN') return monto * 1.35;
  return monto;
}

/**
 * Retorna la meta mensual de facturación en HNL según el mes del POA SEP - DIC 2026
 */
export function obtenerMetaIngresoMensualPOA(mesNumero: number): number {
  if (mesNumero === 9) {
    return 74880.00; // Septiembre 2026: 16 grupos (L. 74,880.00)
  } else if (mesNumero === 10) {
    return 84240.00; // Octubre 2026: 18 grupos (L. 84,240.00)
  } else if (mesNumero === 11) {
    return 88920.00; // Noviembre 2026: 19 grupos (L. 88,920.00)
  } else if (mesNumero === 12) {
    return 98280.00; // Diciembre 2026: 21 grupos (L. 98,280.00)
  } else {
    return 86580.00; // Promedio mensual cuatrimestral (Total: L. 346,320.00)
  }
}

/**
 * Carga el diccionario de cierres mensuales guardados en LocalStorage
 */
export function cargarCierresMensuales(): Record<string, RegistroCierreMensual> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CIERRES_MENSUALES);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error al cargar cierres mensuales:', error);
    return {};
  }
}

/**
 * Guarda los cierres mensuales en LocalStorage
 */
export function guardarCierresMensuales(cierres: Record<string, RegistroCierreMensual>): void {
  try {
    localStorage.setItem(STORAGE_KEY_CIERRES_MENSUALES, JSON.stringify(cierres));
  } catch (error) {
    console.error('Error al guardar cierres mensuales:', error);
  }
}

const CHECKLIST_DEFAULT: ChecklistCierreMensual = {
  alumnosConciliados: false,
  docentesHonorariosPagados: false,
  marketingConciliado: false,
  fiscalidadSARRevisada: false,
  actaDirectivaFirmada: false,
};

/**
 * Calcula dinámicamente o fusiona la información de cierre para un mes específico
 */
export function calcularRegistroCierreMes(
  mesKey: string,
  proyectos: ProyectoEducativo[],
  moneda: Moneda | string = 'LPS',
  cierreGuardado?: RegistroCierreMensual
): RegistroCierreMensual {
  const [anioStr, mesStr] = mesKey.split('-');
  const anio = parseInt(anioStr, 10) || new Date().getFullYear();
  const mesNumero = parseInt(mesStr, 10) || 1;
  const etiquetaMes = formatearEtiquetaMes(mesKey);

  // Filtrar proyectos de este mes
  const proyectosDelMes = proyectos.filter((p) => obtenerClaveMesProyecto(p) === mesKey);

  const totalRegistrados = proyectosDelMes.length;
  const completados = proyectosDelMes.filter((p) => p.seLlevoACabo === 'Sí').length;
  const enCurso = proyectosDelMes.filter((p) => p.seLlevoACabo === 'En curso').length;
  const cancelados = proyectosDelMes.filter((p) => p.seLlevoACabo === 'No' || p.seLlevoACabo === 'Cancelado').length;

  const ingresoRealHNL = proyectosDelMes.reduce((sum, p) => sum + aLempiras(p.ingresoRealTotal || 0, moneda), 0);
  const gastoRealHNL = proyectosDelMes.reduce((sum, p) => sum + aLempiras(p.gastoTotalOperativo || 0, moneda), 0);
  const superavitNetoHNL = ingresoRealHNL - gastoRealHNL;

  const margenOperativoReal = ingresoRealHNL > 0 ? (superavitNetoHNL / ingresoRealHNL) * 100 : 0;

  const alumnosReales = proyectosDelMes.reduce((sum, p) => sum + (p.alumnosFinal || 0), 0);
  const alumnosProyectados = proyectosDelMes.reduce((sum, p) => sum + (p.alumnosProyectados || 0), 0);

  const ingresoMetaPOAHNL = obtenerMetaIngresoMensualPOA(mesNumero);

  // Determinación del Dictamen
  let dictamen: DictamenCierreMensual = 'DEFICIT_CRITICO';
  if (totalRegistrados >= META_MENSUAL_PROYECTOS_POA && superavitNetoHNL > 0 && margenOperativoReal >= MARGEN_POA_META_PCT) {
    dictamen = 'SOBRESALIENTE';
  } else if (totalRegistrados >= META_MENSUAL_PROYECTOS_POA && superavitNetoHNL >= 0) {
    dictamen = 'CUMPLIDO_POA';
  } else if (totalRegistrados >= BREAK_EVEN_PROYECTOS_POA && superavitNetoHNL >= 0) {
    dictamen = 'BREAK_EVEN_MINIMO';
  } else {
    dictamen = 'DEFICIT_CRITICO';
  }

  const alertaDeficit = totalRegistrados < BREAK_EVEN_PROYECTOS_POA || superavitNetoHNL < 0;
  const alertaMargenBajo = totalRegistrados > 0 && margenOperativoReal < MARGEN_POA_META_PCT;
  const alertaMetaProyectos = totalRegistrados < META_MENSUAL_PROYECTOS_POA;

  const alertas: string[] = [];
  if (totalRegistrados < BREAK_EVEN_PROYECTOS_POA) {
    alertas.push(`🔴 Alerta Crítica: Se registraron ${totalRegistrados} de los ${BREAK_EVEN_PROYECTOS_POA} grupos mínimos requeridos para Break-Even mensual. Faltan ${(BREAK_EVEN_PROYECTOS_POA - totalRegistrados).toFixed(1)} grupos para cubrir costos operativos.`);
  } else if (totalRegistrados < META_MENSUAL_PROYECTOS_POA) {
    alertas.push(`🟡 Alerta POA 2026: Se alcanzaron ${totalRegistrados} grupos (supera punto de equilibrio), pero faltan ${(META_MENSUAL_PROYECTOS_POA - totalRegistrados).toFixed(1)} para la meta de 18.5 grupos mensuales.`);
  }

  if (superavitNetoHNL < 0) {
    alertas.push(`🔴 Déficit Financiero: El balance mensual presenta saldo negativo de ${formatearHNL(Math.abs(superavitNetoHNL))}.`);
  }

  if (alertaMargenBajo && totalRegistrados > 0) {
    alertas.push(`⚠️ Margen Bajo: Margen de ${margenOperativoReal.toFixed(1)}% por debajo de la meta directiva del ${MARGEN_POA_META_PCT}%.`);
  }

  if (dictamen === 'SOBRESALIENTE') {
    alertas.push(`🟢 Cumplimiento Sobresaliente: Supera la meta de 18.5 grupos mensuales con superávit y margen operativo positivo.`);
  }

  // Si ya existía un cierre guardado, preservar su estado, responsable y checklist
  return {
    mesKey,
    anio,
    mesNumero,
    etiquetaMes,
    estado: cierreGuardado?.estado || 'ABIERTO',
    fechaCierre: cierreGuardado?.fechaCierre,
    cerradoPor: cierreGuardado?.cerradoPor,
    cargoCerrador: cierreGuardado?.cargoCerrador,
    metaProyectosPOA: META_MENSUAL_PROYECTOS_POA,
    breakEvenProyectosPOA: BREAK_EVEN_PROYECTOS_POA,
    proyectosRegistrados: totalRegistrados,
    proyectosCompletados: completados,
    proyectosEnCurso: enCurso,
    proyectosCancelados: cancelados,
    ingresoMetaPOAHNL,
    ingresoRealHNL,
    gastoRealHNL,
    superavitNetoHNL,
    margenOperativoReal,
    alumnosReales,
    alumnosProyectados,
    dictamen,
    alertaDeficit,
    alertaMargenBajo,
    alertaMetaProyectos,
    alertas,
    checklist: cierreGuardado?.checklist || { ...CHECKLIST_DEFAULT },
    observaciones: cierreGuardado?.observaciones || '',
    planAccionSiguienteMes: cierreGuardado?.planAccionSiguienteMes || '',
    historial: cierreGuardado?.historial || [],
  };
}

/**
 * Ejecuta el cierre mensual oficial de proyectos
 */
export function ejecutarCierreMensual(
  mesKey: string,
  datosCierre: {
    cerradoPor: string;
    cargoCerrador: string;
    observaciones?: string;
    planAccionSiguienteMes?: string;
    checklist: ChecklistCierreMensual;
  },
  proyectos: ProyectoEducativo[],
  moneda: Moneda | string = 'LPS'
): {
  registroActualizado: RegistroCierreMensual;
  proyectosActualizados: ProyectoEducativo[];
  todosCierres: Record<string, RegistroCierreMensual>;
} {
  const cierres = cargarCierresMensuales();
  const actual = calcularRegistroCierreMes(mesKey, proyectos, moneda, cierres[mesKey]);

  const fechaCierre = new Date().toISOString();

  const historial = [
    ...(actual.historial || []),
    {
      fecha: fechaCierre,
      accion: 'CIERRE_MENSUAL_EJECUTADO',
      usuario: datosCierre.cerradoPor,
      detalle: `Dictamen: ${actual.dictamen} | Proyectos: ${actual.proyectosRegistrados}/${actual.metaProyectosPOA} | Superávit: ${formatearHNL(actual.superavitNetoHNL)}`,
    },
  ];

  const registroActualizado: RegistroCierreMensual = {
    ...actual,
    estado: 'CERRADO_AUDITADO',
    fechaCierre,
    cerradoPor: datosCierre.cerradoPor,
    cargoCerrador: datosCierre.cargoCerrador,
    observaciones: datosCierre.observaciones || '',
    planAccionSiguienteMes: datosCierre.planAccionSiguienteMes || '',
    checklist: { ...datosCierre.checklist, actaDirectivaFirmada: true },
    historial,
  };

  cierres[mesKey] = registroActualizado;
  guardarCierresMensuales(cierres);

  // Marcar los proyectos de este mes como cerrados en cierre mensual
  const proyectosActualizados = proyectos.map((p) => {
    if (obtenerClaveMesProyecto(p) === mesKey) {
      return {
        ...p,
        cerradoEnCierreMensual: true,
        fechaCierreMensual: fechaCierre,
      };
    }
    return p;
  });

  return {
    registroActualizado,
    proyectosActualizados,
    todosCierres: cierres,
  };
}

/**
 * Reabre un mes cerrado para permitir modificaciones directivas
 */
export function reabrirMesCierre(
  mesKey: string,
  usuario: string,
  motivo: string,
  proyectos: ProyectoEducativo[],
  moneda: Moneda | string = 'LPS'
): {
  registroActualizado: RegistroCierreMensual;
  proyectosActualizados: ProyectoEducativo[];
  todosCierres: Record<string, RegistroCierreMensual>;
} {
  const cierres = cargarCierresMensuales();
  const actual = calcularRegistroCierreMes(mesKey, proyectos, moneda, cierres[mesKey]);

  const fecha = new Date().toISOString();
  const historial = [
    ...(actual.historial || []),
    {
      fecha,
      accion: 'MES_REABIERTO',
      usuario,
      detalle: `Motivo de reapertura: ${motivo}`,
    },
  ];

  const registroActualizado: RegistroCierreMensual = {
    ...actual,
    estado: 'EN_REVISION',
    historial,
  };

  cierres[mesKey] = registroActualizado;
  guardarCierresMensuales(cierres);

  // Quitar la marca estricta de cerrado de los proyectos
  const proyectosActualizados = proyectos.map((p) => {
    if (obtenerClaveMesProyecto(p) === mesKey) {
      return {
        ...p,
        cerradoEnCierreMensual: false,
      };
    }
    return p;
  });

  return {
    registroActualizado,
    proyectosActualizados,
    todosCierres: cierres,
  };
}

/**
 * Retorna la lista de alertas activas para todos los meses con proyectos
 */
export function obtenerAlertasGlobalesCierre(
  proyectos: ProyectoEducativo[],
  moneda: Moneda | string = 'LPS'
): AlertaCierreMensual[] {
  const cierres = cargarCierresMensuales();
  const mesesSet = new Set<string>();

  proyectos.forEach((p) => {
    const key = obtenerClaveMesProyecto(p);
    if (key) mesesSet.add(key);
  });

  const clavesOrdenadas = Array.from(mesesSet).sort();
  const alertas: AlertaCierreMensual[] = [];

  clavesOrdenadas.forEach((mesKey) => {
    const registro = calcularRegistroCierreMes(mesKey, proyectos, moneda, cierres[mesKey]);

    if (registro.estado === 'ABIERTO' || registro.estado === 'EN_REVISION') {
      if (registro.proyectosRegistrados < BREAK_EVEN_PROYECTOS_POA) {
        alertas.push({
          id: `alerta-break-even-${mesKey}`,
          mesKey,
          etiquetaMes: registro.etiquetaMes,
          nivel: 'CRITICA',
          titulo: `Déficit en ${registro.etiquetaMes}: Debajo de Break-Even`,
          mensaje: `Solo cuenta con ${registro.proyectosRegistrados} de los ${BREAK_EVEN_PROYECTOS_POA} grupos mínimos requeridos para solventar costos operativos fijos y docencia.`,
          accionSugerida: 'Aperturar y comercializar grupos prioritarios para alcanzar el punto de equilibrio.',
        });
      } else if (registro.proyectosRegistrados < META_MENSUAL_PROYECTOS_POA) {
        alertas.push({
          id: `alerta-meta-poa-${mesKey}`,
          mesKey,
          etiquetaMes: registro.etiquetaMes,
          nivel: 'PREVENTIVA',
          titulo: `Brecha POA 2026 en ${registro.etiquetaMes}: ${registro.proyectosRegistrados}/${META_MENSUAL_PROYECTOS_POA} Grupos`,
          mensaje: `Se cubrió el punto de equilibrio, pero faltan ${(META_MENSUAL_PROYECTOS_POA - registro.proyectosRegistrados).toFixed(1)} grupos para la meta mensual de 18.5 grupos del POA SEP-DIC 2026.`,
          accionSugerida: 'Impulsar captación comercial y aperturas grupales para alcanzar la meta cuatrimestral.',
        });
      }
    } else if (registro.estado === 'CERRADO_AUDITADO' && registro.dictamen === 'DEFICIT_CRITICO') {
      alertas.push({
        id: `alerta-cerrado-deficit-${mesKey}`,
        mesKey,
        etiquetaMes: registro.etiquetaMes,
        nivel: 'CRITICA',
        titulo: `${registro.etiquetaMes} Cerrado con Déficit Crítico`,
        mensaje: `El periodo fue cerrado con balance negativo o volumen menor a ${BREAK_EVEN_PROYECTOS_POA} grupos (${registro.proyectosRegistrados} proyectos).`,
        accionSugerida: 'Monitorear plan de acción correctiva en el siguiente mes para compensar el déficit acumulado.',
      });
    }
  });

  return alertas;
}

/**
 * Resumen consolidado del estado de todos los meses
 */
export function obtenerResumenCierresAnio(
  proyectos: ProyectoEducativo[],
  moneda: Moneda | string = 'LPS'
): {
  totalMesesRegistrados: number;
  totalMesesCerrados: number;
  mesesAbiertos: number;
  mesesConDeficit: number;
  mesesCumplidos: number;
  proyectosEnMesesCerrados: number;
} {
  const cierres = cargarCierresMensuales();
  const mesesSet = new Set<string>();

  proyectos.forEach((p) => {
    const key = obtenerClaveMesProyecto(p);
    if (key) mesesSet.add(key);
  });

  const claves = Array.from(mesesSet);
  let totalMesesCerrados = 0;
  let mesesAbiertos = 0;
  let mesesConDeficit = 0;
  let mesesCumplidos = 0;
  let proyectosEnMesesCerrados = 0;

  claves.forEach((mesKey) => {
    const reg = calcularRegistroCierreMes(mesKey, proyectos, moneda, cierres[mesKey]);
    if (reg.estado === 'CERRADO_AUDITADO') {
      totalMesesCerrados++;
      proyectosEnMesesCerrados += reg.proyectosRegistrados;
      if (reg.dictamen === 'DEFICIT_CRITICO') mesesConDeficit++;
      if (reg.dictamen === 'SOBRESALIENTE' || reg.dictamen === 'CUMPLIDO_POA') mesesCumplidos++;
    } else {
      mesesAbiertos++;
      if (reg.dictamen === 'DEFICIT_CRITICO') mesesConDeficit++;
      if (reg.dictamen === 'SOBRESALIENTE' || reg.dictamen === 'CUMPLIDO_POA') mesesCumplidos++;
    }
  });

  return {
    totalMesesRegistrados: claves.length,
    totalMesesCerrados,
    mesesAbiertos,
    mesesConDeficit,
    mesesCumplidos,
    proyectosEnMesesCerrados,
  };
}
