import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ProyectoEducativo, Moneda } from '../types';
import { formatearMoneda } from './calculations';
import { obtenerClaveMesProyecto, formatearEtiquetaMes } from './monthUtils';
import { subirReporteADrive } from '../services/googleDriveService';

export type TipoEscenario = 'conservador' | 'base' | 'optimista' | 'personalizado';

export interface ParametrosProyeccion {
  semestreObjetivo: string; // ej. '2027-S1' o '2026-S2'
  crecimientoMatriculaPct: number; // e.g. 10.0 (%)
  inflacionGastosPct: number; // e.g. 5.5 (%)
  incrementoCostoDocentePct: number; // e.g. 7.0 (%)
  ajustePrecioArancelPct: number; // e.g. 5.0 (%)
  escenarioActivo: TipoEscenario;
}

export interface ResultadoProyeccionMes {
  mesKey: string;
  etiquetaMes: string;
  mesNumero: number;
  alumnosProyectados: number;
  ingresosProyectados: number;
  costosDocentesAjustados: number;
  costosOperativosConInflacion: number;
  costoTotalProyectado: number;
  utilidadProyectada: number;
  margenProyectado: number; // %
  puntoEquilibrioAlumnos: number;
}

export interface ProgramaProyectadoDetalle {
  id: string;
  nombre: string;
  docente: string;
  tipoProyecto: string;
  horasClase: number;
  alumnosBase: number;
  alumnosProyectados: number;
  tarifaDocenteBase: number;
  tarifaDocenteAjustada: number;
  costoDocenteBase: number;
  costoDocenteProyectado: number;
  gastosOperativosBase: number;
  gastosOperativosConInflacion: number;
  costoTotalProyectado: number;
  precioBase: number;
  precioAjustado: number;
  ingresoBase: number;
  ingresoProyectado: number;
  utilidadBase: number;
  utilidadProyectada: number;
  margenBase: number;
  margenProyectado: number;
  estadoSemaforo: 'optimo' | 'moderado' | 'riesgo';
  recomendacion: string;
}

export interface AnalisisProyeccionSemestral {
  semestreObjetivo: string;
  etiquetaSemestre: string;
  parametros: ParametrosProyeccion;
  mesesProyectados: ResultadoProyeccionMes[];
  programas: ProgramaProyectadoDetalle[];
  kpisBase: {
    totalIngresos: number;
    totalCostosDocentes: number;
    totalCostosOperativos: number;
    costoTotal: number;
    utilidadNeta: number;
    margenPromedio: number;
    totalAlumnos: number;
    tarifaHoraPromedioDocente: number;
    totalHorasDocentes: number;
    ticketPromedioAlumno: number;
    puntoEquilibrioAlumnos: number;
  };
  kpisProyectados: {
    totalIngresos: number;
    totalCostosDocentes: number;
    totalCostosOperativos: number;
    costoTotal: number;
    utilidadNeta: number;
    margenPromedio: number;
    totalAlumnos: number;
    tarifaHoraPromedioDocente: number;
    ticketPromedioAlumno: number;
    puntoEquilibrioAlumnos: number;
    roiProyectado: number;
    pesoCostoDocenteSobreIngresos: number;
    pesoCostoDocenteHistorico: number;
    deltaIngresosMonto: number;
    deltaIngresosPct: number;
    deltaCostosDocentesMonto: number;
    deltaCostosDocentesPct: number;
    deltaCostosOperativosMonto: number;
    deltaCostosOperativosPct: number;
    deltaCostosTotalesMonto: number;
    deltaCostosTotalesPct: number;
    deltaUtilidadMonto: number;
    deltaUtilidadPct: number;
    deltaMargenPuntos: number;
  };
  elasticidad: {
    impacto1PctDocenteEnMargen: number; // Por cada 1% de aumento docente sin ajuste de arancel
    arancelMinimoCompensatorioPct: number; // % necesario para sostener el margen base
    alumnosAdicionalesNecesarios: number; // Alumnos extra necesarios en el semestre para absorber alzas
  };
  comparativaEscenarios: Array<{
    id: TipoEscenario;
    nombre: string;
    crecimientoMatricula: number;
    inflacion: number;
    aumentoDocente: number;
    ajusteArancel: number;
    ingresos: number;
    costosDocentes: number;
    costosOperativos: number;
    costoTotal: number;
    utilidad: number;
    margen: number;
  }>;
  diagnosticoEjecutivo: {
    titulo: string;
    resumen: string;
    nivelRiesgo: 'Bajo' | 'Moderado' | 'Alto';
    recomendaciones: string[];
  };
}

export const ESCENARIOS_PREDEFINIDOS: Record<TipoEscenario, Omit<ParametrosProyeccion, 'semestreObjetivo' | 'escenarioActivo'>> = {
  conservador: {
    crecimientoMatriculaPct: 0.0,
    inflacionGastosPct: 8.5,
    incrementoCostoDocentePct: 10.0,
    ajustePrecioArancelPct: 0.0,
  },
  base: {
    crecimientoMatriculaPct: 10.0,
    inflacionGastosPct: 5.5,
    incrementoCostoDocentePct: 7.0,
    ajustePrecioArancelPct: 5.0,
  },
  optimista: {
    crecimientoMatriculaPct: 20.0,
    inflacionGastosPct: 4.0,
    incrementoCostoDocentePct: 5.0,
    ajustePrecioArancelPct: 8.0,
  },
  personalizado: {
    crecimientoMatriculaPct: 12.0,
    inflacionGastosPct: 5.5,
    incrementoCostoDocentePct: 7.0,
    ajustePrecioArancelPct: 6.0,
  },
};

export const SEMESTRES_DISPONIBLES = [
  { id: '2026-S2', label: 'II Semestre 2026 (Julio - Diciembre 2026)', meses: ['2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'] },
  { id: '2027-S1', label: 'I Semestre 2027 (Enero - Junio 2027)', meses: ['2027-01', '2027-02', '2027-03', '2027-04', '2027-05', '2027-06'] },
  { id: '2027-S2', label: 'II Semestre 2027 (Julio - Diciembre 2027)', meses: ['2027-07', '2027-08', '2027-09', '2027-10', '2027-11', '2027-12'] },
];

/**
 * Motor Principal de Proyección Financiera Semestral
 */
export function calcularProyeccionSemestral(
  proyectos: ProyectoEducativo[],
  params: ParametrosProyeccion
): AnalisisProyeccionSemestral {
  const infoSemestre = SEMESTRES_DISPONIBLES.find(s => s.id === params.semestreObjetivo) || SEMESTRES_DISPONIBLES[1];
  
  // 1. Establecer Base Histórica
  // Si hay proyectos históricos, calculamos la media semestral representativa
  const proysValidos = proyectos.length > 0 ? proyectos : [];
  
  let baseIngresos = 0;
  let baseCostosDocentes = 0;
  let baseCostosOperativos = 0;
  let baseAlumnos = 0;
  let baseHorasDocentes = 0;
  let sumaTarifasPonderadas = 0;

  proysValidos.forEach(p => {
    const ing = p.ingresoTotalNeto || p.ingresoRealTotal || 0;
    const docenteCost = (p.horasClase || 0) * (p.tarifaHoraDocente || 200) || p.costoDocenteManual || p.costoDocenteCalculado || 0;
    const opsCost = (p.costoZoom || 0) + (p.costoPapeleria || 0) + (p.gastosVarios || 0) + (p.gastoPublicidad || 0);
    const alums = p.alumnosFinal || p.alumnosProyectados || 10;
    const horas = p.horasClase || 20;
    const tarifa = p.tarifaHoraDocente || 200;

    baseIngresos += ing;
    baseCostosDocentes += docenteCost;
    baseCostosOperativos += opsCost;
    baseAlumnos += alums;
    baseHorasDocentes += horas;
    sumaTarifasPonderadas += (tarifa * horas);
  });

  // Factor de normalización semestral: si tenemos N proyectos en total, extrapolamos a un semestre estándar (6 meses)
  // Calculamos la tasa mensual base
  const mesesHistoricosUnicos = new Set(proysValidos.map(p => obtenerClaveMesProyecto(p)));
  const cantMesesHist = Math.max(mesesHistoricosUnicos.size, 1);
  const factorSemestral = (6 / cantMesesHist);

  // Semestre Base Normalizado (6 meses representativos)
  const semBaseIngresos = baseIngresos * factorSemestral;
  const semBaseCostosDocentes = baseCostosDocentes * factorSemestral;
  const semBaseCostosOperativos = baseCostosOperativos * factorSemestral;
  const semBaseCostoTotal = semBaseCostosDocentes + semBaseCostosOperativos;
  const semBaseUtilidad = semBaseIngresos - semBaseCostoTotal;
  const semBaseMargen = semBaseIngresos > 0 ? (semBaseUtilidad / semBaseIngresos) * 100 : 0;
  const semBaseAlumnos = Math.round(baseAlumnos * factorSemestral);
  const tarifaPromedioBase = baseHorasDocentes > 0 ? sumaTarifasPonderadas / baseHorasDocentes : 200;
  const ticketMedioBase = semBaseAlumnos > 0 ? semBaseIngresos / semBaseAlumnos : 1500;
  const puntoEqBase = ticketMedioBase > 0 ? Math.ceil(semBaseCostoTotal / ticketMedioBase) : 0;

  // 2. Factores de Variación del Usuario
  const factorMatricula = 1 + (params.crecimientoMatriculaPct / 100);
  const factorInflacion = 1 + (params.inflacionGastosPct / 100);
  const factorDocente = 1 + (params.incrementoCostoDocentePct / 100);
  const factorArancel = 1 + (params.ajustePrecioArancelPct / 100);

  // 3. Proyecciones Totales Semestrales
  const proyAlumnos = Math.round(semBaseAlumnos * factorMatricula);
  const proyTicketMedio = ticketMedioBase * factorArancel;
  const proyIngresos = proyAlumnos * proyTicketMedio;
  
  const proyCostosDocentes = semBaseCostosDocentes * factorDocente * (1 + (params.crecimientoMatriculaPct * 0.15 / 100)); // lecho elástico 15% por apertura de nuevas secciones
  const proyCostosOperativos = semBaseCostosOperativos * factorInflacion * (1 + (params.crecimientoMatriculaPct * 0.25 / 100)); // licencias y materiales crecen con alumnos
  const proyCostoTotal = proyCostosDocentes + proyCostosOperativos;
  const proyUtilidad = proyIngresos - proyCostoTotal;
  const proyMargen = proyIngresos > 0 ? (proyUtilidad / proyIngresos) * 100 : 0;
  const proyTarifaPromedio = tarifaPromedioBase * factorDocente;
  const proyPuntoEq = proyTicketMedio > 0 ? Math.ceil(proyCostoTotal / proyTicketMedio) : 0;
  const proyRoi = proyCostoTotal > 0 ? (proyUtilidad / proyCostoTotal) * 100 : 0;

  // Deltas
  const deltaIngresosMonto = proyIngresos - semBaseIngresos;
  const deltaIngresosPct = semBaseIngresos > 0 ? (deltaIngresosMonto / semBaseIngresos) * 100 : 0;
  const deltaCostosDocentesMonto = proyCostosDocentes - semBaseCostosDocentes;
  const deltaCostosDocentesPct = semBaseCostosDocentes > 0 ? (deltaCostosDocentesMonto / semBaseCostosDocentes) * 100 : 0;
  const deltaCostosOperativosMonto = proyCostosOperativos - semBaseCostosOperativos;
  const deltaCostosOperativosPct = semBaseCostosOperativos > 0 ? (deltaCostosOperativosMonto / semBaseCostosOperativos) * 100 : 0;
  const deltaCostosTotalesMonto = proyCostoTotal - semBaseCostoTotal;
  const deltaCostosTotalesPct = semBaseCostoTotal > 0 ? (deltaCostosTotalesMonto / semBaseCostoTotal) * 100 : 0;
  const deltaUtilidadMonto = proyUtilidad - semBaseUtilidad;
  const deltaUtilidadPct = semBaseUtilidad !== 0 ? (deltaUtilidadMonto / Math.abs(semBaseUtilidad)) * 100 : 0;
  const deltaMargenPuntos = proyMargen - semBaseMargen;

  // 4. Desglose Mensual (6 meses proyectados con estacionalidad académica típica)
  // Factores de estacionalidad estándar: Mes 1 (Apertura fuerte: 1.15), Mes 2 (Estable: 1.05), Mes 3 (Medio: 0.95), Mes 4 (Intensivo: 1.10), Mes 5 (Cierres: 0.90), Mes 6 (Evaluaciones: 0.85)
  const curvasEstacionales = [1.12, 1.08, 0.96, 1.04, 0.94, 0.86];
  const sumaEstacional = curvasEstacionales.reduce((a, b) => a + b, 0);

  const mesesProyectados: ResultadoProyeccionMes[] = infoSemestre.meses.map((mesKey, idx) => {
    const pesoMes = (curvasEstacionales[idx] || 1.0) / sumaEstacional;
    const mAlumnos = Math.round(proyAlumnos * pesoMes);
    const mIngresos = proyIngresos * pesoMes;
    const mDocente = proyCostosDocentes * pesoMes;
    const mOperativo = proyCostosOperativos * pesoMes;
    const mTotal = mDocente + mOperativo;
    const mUtilidad = mIngresos - mTotal;
    const mMargen = mIngresos > 0 ? (mUtilidad / mIngresos) * 100 : 0;
    const mTicket = mAlumnos > 0 ? mIngresos / mAlumnos : proyTicketMedio;
    const mPuntoEq = mTicket > 0 ? Math.ceil(mTotal / mTicket) : 0;

    return {
      mesKey,
      etiquetaMes: formatearEtiquetaMes(mesKey),
      mesNumero: idx + 1,
      alumnosProyectados: mAlumnos,
      ingresosProyectados: mIngresos,
      costosDocentesAjustados: mDocente,
      costosOperativosConInflacion: mOperativo,
      costoTotalProyectado: mTotal,
      utilidadProyectada: mUtilidad,
      margenProyectado: mMargen,
      puntoEquilibrioAlumnos: mPuntoEq,
    };
  });

  // 5. Proyección Detallada por Programa
  const programas: ProgramaProyectadoDetalle[] = proysValidos.map((p, idx) => {
    const horas = p.horasClase || 20;
    const tarifaBase = p.tarifaHoraDocente || 200;
    const tarifaAjustada = Math.round(tarifaBase * factorDocente);
    const costoDocenteBase = (p.horasClase || 0) * tarifaBase || p.costoDocenteManual || p.costoDocenteCalculado || 4000;
    const costoDocenteProyectado = horas * tarifaAjustada;

    const opsBase = (p.costoZoom || 0) + (p.costoPapeleria || 0) + (p.gastosVarios || 0) + (p.gastoPublicidad || 0);
    const opsAjustados = opsBase * factorInflacion;
    const costoTotalProy = costoDocenteProyectado + opsAjustados;

    const alumsBase = p.alumnosFinal || p.alumnosProyectados || 10;
    const alumsProy = Math.max(Math.round(alumsBase * factorMatricula), 1);

    const precioBase = p.precioSugeridoAlumno || (p.ingresoRealTotal && alumsBase > 0 ? p.ingresoRealTotal / alumsBase : 1500);
    const precioAjustado = Math.round(precioBase * factorArancel);

    const ingBase = p.ingresoTotalNeto || p.ingresoRealTotal || (alumsBase * precioBase);
    const ingProy = alumsProy * precioAjustado;

    const utilBase = p.totalGananciasFinales || (ingBase - (costoDocenteBase + opsBase));
    const utilProy = ingProy - costoTotalProy;
    const margBase = ingBase > 0 ? (utilBase / ingBase) * 100 : 0;
    const margProy = ingProy > 0 ? (utilProy / ingProy) * 100 : 0;

    let semaforo: 'optimo' | 'moderado' | 'riesgo' = 'optimo';
    let reco = 'Excelente margen proyectado. Ampliar cupos.';
    if (margProy < 15) {
      semaforo = 'riesgo';
      reco = 'Margen comprimido por costo docente. Elevar arancel o cupos mínimos.';
    } else if (margProy < 30) {
      semaforo = 'moderado';
      reco = 'Margen equilibrado. Monitorear costos de plataformas y publicidad.';
    }

    return {
      id: p.id || `proy-${idx}`,
      nombre: p.nombreProyecto,
      docente: p.nombreDocente || 'Docente Asignado',
      tipoProyecto: p.tipoProyecto || 'Capacitación Profesional',
      horasClase: horas,
      alumnosBase: alumsBase,
      alumnosProyectados: alumsProy,
      tarifaDocenteBase: tarifaBase,
      tarifaDocenteAjustada: tarifaAjustada,
      costoDocenteBase,
      costoDocenteProyectado,
      gastosOperativosBase: opsBase,
      gastosOperativosConInflacion: opsAjustados,
      costoTotalProyectado: costoTotalProy,
      precioBase,
      precioAjustado,
      ingresoBase: ingBase,
      ingresoProyectado: ingProy,
      utilidadBase: utilBase,
      utilidadProyectada: utilProy,
      margenBase: margBase,
      margenProyectado: margProy,
      estadoSemaforo: semaforo,
      recomendacion: reco,
    };
  });

  // 6. Elasticidad y Sensibilidad
  // Si no ajustamos aranceles, ¿cuánto cae el margen por 1% más de docente?
  const costoDocenteMas1 = semBaseCostosDocentes * 1.01;
  const margenConDocente1 = semBaseIngresos > 0 ? ((semBaseIngresos - (costoDocenteMas1 + semBaseCostosOperativos)) / semBaseIngresos) * 100 : 0;
  const impacto1PctDocenteEnMargen = Math.abs(semBaseMargen - margenConDocente1);

  // Arancel necesario para compensar la inflación + docente sin perder margen base
  const costoProyectadoParaMargenBase = proyCostoTotal / (1 - (semBaseMargen / 100));
  const arancelCompensatorioSugerido = proyAlumnos > 0 ? costoProyectadoParaMargenBase / proyAlumnos : ticketMedioBase;
  const arancelMinimoCompensatorioPct = ticketMedioBase > 0 ? Math.max(0, ((arancelCompensatorioSugerido - ticketMedioBase) / ticketMedioBase) * 100) : 0;

  // Alumnos adicionales necesarios si no se aumentan aranceles
  const utilidadDeseada = semBaseUtilidad;
  const margenUnitarioActual = proyTicketMedio - (proyCostoTotal / Math.max(proyAlumnos, 1));
  const alumnosAdicionalesNecesarios = margenUnitarioActual > 0 ? Math.max(0, Math.ceil((proyCostoTotal + utilidadDeseada - proyIngresos) / proyTicketMedio)) : 5;

  // 7. Comparativa de Escenarios Predefinidos
  const comparativaEscenarios = (['conservador', 'base', 'optimista'] as TipoEscenario[]).map((escKey) => {
    const escParams = ESCENARIOS_PREDEFINIDOS[escKey];
    const fMat = 1 + (escParams.crecimientoMatriculaPct / 100);
    const fInf = 1 + (escParams.inflacionGastosPct / 100);
    const fDoc = 1 + (escParams.incrementoCostoDocentePct / 100);
    const fAra = 1 + (escParams.ajustePrecioArancelPct / 100);

    const eAlumnos = Math.round(semBaseAlumnos * fMat);
    const eTicket = ticketMedioBase * fAra;
    const eIngresos = eAlumnos * eTicket;
    const eDocente = semBaseCostosDocentes * fDoc * (1 + (escParams.crecimientoMatriculaPct * 0.15 / 100));
    const eOperativo = semBaseCostosOperativos * fInf * (1 + (escParams.crecimientoMatriculaPct * 0.25 / 100));
    const eTotal = eDocente + eOperativo;
    const eUtil = eIngresos - eTotal;
    const eMargen = eIngresos > 0 ? (eUtil / eIngresos) * 100 : 0;

    const nombres: Record<TipoEscenario, string> = {
      conservador: 'Escenario Conservador (Estancamiento + Inflación Alta)',
      base: 'Escenario Base (Crecimiento & Ajuste Moderado)',
      optimista: 'Escenario Expansión (Crecimiento Acelerado)',
      personalizado: 'Escenario Personalizado',
    };

    return {
      id: escKey,
      nombre: nombres[escKey],
      crecimientoMatricula: escParams.crecimientoMatriculaPct,
      inflacion: escParams.inflacionGastosPct,
      aumentoDocente: escParams.incrementoCostoDocentePct,
      ajusteArancel: escParams.ajustePrecioArancelPct,
      ingresos: eIngresos,
      costosDocentes: eDocente,
      costosOperativos: eOperativo,
      costoTotal: eTotal,
      utilidad: eUtil,
      margen: eMargen,
    };
  });

  // 8. Diagnóstico Ejecutivo
  let nivelRiesgo: 'Bajo' | 'Moderado' | 'Alto' = 'Bajo';
  let tituloDiag = 'Proyección Financiera Favorable & Sostenible';
  let resumenDiag = `El modelo proyecta una utilidad semestral de ${proyUtilidad >= 0 ? '+' : ''}${Math.round(proyUtilidad)} con un margen operativo del ${proyMargen.toFixed(1)}%.`;
  const recomendaciones: string[] = [];

  if (proyMargen < 15 || proyUtilidad < 0) {
    nivelRiesgo = 'Alto';
    tituloDiag = 'Alerta de Contracción de Márgenes por Alzas Operativas y Docentes';
    resumenDiag = `El aumento simultáneo en costos docentes (+${params.incrementoCostoDocentePct}%) y la inflación (+${params.inflacionGastosPct}%) comprimen la utilidad neta a ${proyMargen.toFixed(1)}%.`;
    recomendaciones.push(`Indexar los aranceles de matrícula al menos en un ${arancelMinimoCompensatorioPct.toFixed(1)}% para absorber las alzas salariales e inflacionarias.`);
    recomendaciones.push(`Fijar un aforo mínimo de punto de equilibrio (${proyPuntoEq} alumnos globales) antes de dar apertura definitiva a cada cohorte.`);
    recomendaciones.push('Renegociar paquetes de horas docentes por módulo en lugar de tarifas fijas por hora individual.');
  } else if (proyMargen < 30) {
    nivelRiesgo = 'Moderado';
    tituloDiag = 'Rendimiento Aceptable con Margen de Maniobra Limitado';
    resumenDiag = `Se mantiene la viabilidad operativa (margen ${proyMargen.toFixed(1)}%), pero se recomienda estricta vigilancia sobre horas docentes y gastos varios.`;
    recomendaciones.push(`Monitorear los programas con márgenes inferiores al 20% para ajustar aranceles tempranos en preventa.`);
    recomendaciones.push(`Aprovechar convenios institucionales para exentar programas de ISV (Art. 15 numeral 1) y resguardar el margen neto.`);
    recomendaciones.push('Incentivar la retención de alumnos existentes mediante rutas de especialización continua (LTV).');
  } else {
    nivelRiesgo = 'Bajo';
    tituloDiag = 'Expansión Estratégica con Alta Capacidad de Absorción de Costos';
    resumenDiag = `La institución cuenta con un margen saludable del ${proyMargen.toFixed(1)}%, lo que le permite absorber holgadamente el incremento salarial docente del ${params.incrementoCostoDocentePct}% y la inflación del ${params.inflacionGastosPct}%.`;
    recomendaciones.push('Reinvertir parte de los excedentes en pauta digital focalizada y equipamiento didáctico de vanguardia.');
    recomendaciones.push('Consolidar programas estrella abriendo segundas secciones en horarios vespertinos y fines de semana.');
    recomendaciones.push('Implementar bonos por desempeño docente atados a encuestas de satisfacción estudiantil (NPS > 4.5).');
  }

  return {
    semestreObjetivo: params.semestreObjetivo,
    etiquetaSemestre: infoSemestre.label,
    parametros: params,
    mesesProyectados,
    programas,
    kpisBase: {
      totalIngresos: semBaseIngresos,
      totalCostosDocentes: semBaseCostosDocentes,
      totalCostosOperativos: semBaseCostosOperativos,
      costoTotal: semBaseCostoTotal,
      utilidadNeta: semBaseUtilidad,
      margenPromedio: semBaseMargen,
      totalAlumnos: semBaseAlumnos,
      tarifaHoraPromedioDocente: tarifaPromedioBase,
      totalHorasDocentes: baseHorasDocentes * factorSemestral,
      ticketPromedioAlumno: ticketMedioBase,
      puntoEquilibrioAlumnos: puntoEqBase,
    },
    kpisProyectados: {
      totalIngresos: proyIngresos,
      totalCostosDocentes: proyCostosDocentes,
      totalCostosOperativos: proyCostosOperativos,
      costoTotal: proyCostoTotal,
      utilidadNeta: proyUtilidad,
      margenPromedio: proyMargen,
      totalAlumnos: proyAlumnos,
      tarifaHoraPromedioDocente: proyTarifaPromedio,
      ticketPromedioAlumno: proyTicketMedio,
      puntoEquilibrioAlumnos: proyPuntoEq,
      roiProyectado: proyRoi,
      pesoCostoDocenteSobreIngresos: proyIngresos > 0 ? (proyCostosDocentes / proyIngresos) * 100 : 0,
      pesoCostoDocenteHistorico: semBaseIngresos > 0 ? (semBaseCostosDocentes / semBaseIngresos) * 100 : 0,
      deltaIngresosMonto,
      deltaIngresosPct,
      deltaCostosDocentesMonto,
      deltaCostosDocentesPct,
      deltaCostosOperativosMonto,
      deltaCostosOperativosPct,
      deltaCostosTotalesMonto,
      deltaCostosTotalesPct,
      deltaUtilidadMonto,
      deltaUtilidadPct,
      deltaMargenPuntos,
    },
    elasticidad: {
      impacto1PctDocenteEnMargen,
      arancelMinimoCompensatorioPct,
      alumnosAdicionalesNecesarios,
    },
    comparativaEscenarios,
    diagnosticoEjecutivo: {
      titulo: tituloDiag,
      resumen: resumenDiag,
      nivelRiesgo,
      recomendaciones,
    },
  };
}

/**
 * Exporta el Modelo de Proyección Semestral a Formato PDF Oficial
 */
export async function exportarProyeccionPDF(
  analisis: AnalisisProyeccionSemestral,
  moneda: Moneda,
  guardarEnDrive = true
): Promise<{ success: boolean; driveUrl?: string; nombreArchivo: string }> {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const nombreArchivo = `Proyeccion_Crecimiento_${analisis.semestreObjetivo}_${Date.now()}.pdf`;

  // Encabezado
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SUMMIT IMPULSA GLOBAL - DIRECCIÓN FINANCIERA & GERENCIA GENERAL', 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`MODELO DE PROYECCIÓN DE CRECIMIENTO SEMESTRAL | ${analisis.etiquetaSemestre.toUpperCase()}`, 14, 18);

  doc.setFontSize(8);
  doc.text(`Generado: ${new Date().toLocaleString('es-HN')}`, 240, 18);

  // Parámetros de Simulación Utilizados
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(14, 28, 269, 20, 2, 2, 'F');

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('PARÁMETROS DE SIMULACIÓN Y SENSIBILIDAD APLICADOS:', 18, 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`• Crecimiento Matrícula: ${analisis.parametros.crecimientoMatriculaPct >= 0 ? '+' : ''}${analisis.parametros.crecimientoMatriculaPct}%`, 18, 41);
  doc.text(`• Inflación General / Gastos: +${analisis.parametros.inflacionGastosPct}% (BCH Ref.)`, 75, 41);
  doc.text(`• Ajuste Costos Docentes: +${analisis.parametros.incrementoCostoDocentePct}% (Tarifas/Honorarios)`, 145, 41);
  doc.text(`• Ajuste Arancel Alumno: ${analisis.parametros.ajustePrecioArancelPct >= 0 ? '+' : ''}${analisis.parametros.ajustePrecioArancelPct}%`, 225, 41);

  // Resumen de KPIs Clave
  autoTable(doc, {
    startY: 52,
    head: [['Indicador Financiero Clave', 'Semestre Base Histórico', 'Próximo Semestre Proyectado', 'Variación Neta ($)', 'Variación (%)', 'Impacto']],
    body: [
      [
        'Ingresos Netos Totales',
        formatearMoneda(analisis.kpisBase.totalIngresos, moneda),
        formatearMoneda(analisis.kpisProyectados.totalIngresos, moneda),
        formatearMoneda(analisis.kpisProyectados.deltaIngresosMonto, moneda),
        `${analisis.kpisProyectados.deltaIngresosPct >= 0 ? '+' : ''}${analisis.kpisProyectados.deltaIngresosPct.toFixed(1)}%`,
        analisis.kpisProyectados.deltaIngresosPct >= 0 ? 'Expansión de ventas' : 'Contracción'
      ],
      [
        'Costos Docentes (Horas/Honorarios)',
        formatearMoneda(analisis.kpisBase.totalCostosDocentes, moneda),
        formatearMoneda(analisis.kpisProyectados.totalCostosDocentes, moneda),
        formatearMoneda(analisis.kpisProyectados.deltaCostosDocentesMonto, moneda),
        `+${analisis.kpisProyectados.deltaCostosDocentesPct.toFixed(1)}%`,
        `Peso s/ingreso: ${analisis.kpisProyectados.pesoCostoDocenteSobreIngresos.toFixed(1)}%`
      ],
      [
        'Gastos Operativos (Zoom, Papelería, Otros)',
        formatearMoneda(analisis.kpisBase.totalCostosOperativos, moneda),
        formatearMoneda(analisis.kpisProyectados.totalCostosOperativos, moneda),
        formatearMoneda(analisis.kpisProyectados.deltaCostosOperativosMonto, moneda),
        `+${analisis.kpisProyectados.deltaCostosOperativosPct.toFixed(1)}%`,
        `Factor Inflación: +${analisis.parametros.inflacionGastosPct}%`
      ],
      [
        'Costo Total de Operación',
        formatearMoneda(analisis.kpisBase.costoTotal, moneda),
        formatearMoneda(analisis.kpisProyectados.costoTotal, moneda),
        formatearMoneda(analisis.kpisProyectados.deltaCostosTotalesMonto, moneda),
        `+${analisis.kpisProyectados.deltaCostosTotalesPct.toFixed(1)}%`,
        'Inversión operativa total'
      ],
      [
        'Utilidad Neta Semestral',
        formatearMoneda(analisis.kpisBase.utilidadNeta, moneda),
        formatearMoneda(analisis.kpisProyectados.utilidadNeta, moneda),
        formatearMoneda(analisis.kpisProyectados.deltaUtilidadMonto, moneda),
        `${analisis.kpisProyectados.deltaUtilidadPct >= 0 ? '+' : ''}${analisis.kpisProyectados.deltaUtilidadPct.toFixed(1)}%`,
        analisis.kpisProyectados.utilidadNeta >= 0 ? 'Superávit Proyectado' : 'Déficit Proyectado'
      ],
      [
        'Margen Operativo Promedio',
        `${analisis.kpisBase.margenPromedio.toFixed(1)}%`,
        `${analisis.kpisProyectados.margenPromedio.toFixed(1)}%`,
        `${analisis.kpisProyectados.deltaMargenPuntos >= 0 ? '+' : ''}${analisis.kpisProyectados.deltaMargenPuntos.toFixed(1)} pts`,
        '-',
        analisis.kpisProyectados.margenPromedio >= 30 ? 'Saludable (>30%)' : 'En Observación'
      ],
      [
        'Matrícula Total de Alumnos',
        `${analisis.kpisBase.totalAlumnos} alumnos`,
        `${analisis.kpisProyectados.totalAlumnos} alumnos`,
        `+${analisis.kpisProyectados.totalAlumnos - analisis.kpisBase.totalAlumnos}`,
        `+${analisis.parametros.crecimientoMatriculaPct}%`,
        `Punto de Equilibrio: ${analisis.kpisProyectados.puntoEquilibrioAlumnos} alumnos`
      ]
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' }
  });

  // Tabla Mes a Mes
  const prevY = (doc as any).lastAutoTable.finalY || 105;

  autoTable(doc, {
    startY: prevY + 6,
    head: [['Mes Calendario', 'Matrícula Estimada', 'Ingresos Proyectados', 'Costos Docentes', 'Gastos Operativos (Inf.)', 'Costo Total', 'Utilidad Proyectada', 'Margen %']],
    body: analisis.mesesProyectados.map(m => [
      m.etiquetaMes,
      `${m.alumnosProyectados} alumnos`,
      formatearMoneda(m.ingresosProyectados, moneda),
      formatearMoneda(m.costosDocentesAjustados, moneda),
      formatearMoneda(m.costosOperativosConInflacion, moneda),
      formatearMoneda(m.costoTotalProyectado, moneda),
      formatearMoneda(m.utilidadProyectada, moneda),
      `${m.margenProyectado.toFixed(1)}%`
    ]),
    theme: 'striped',
    styles: { fontSize: 7.5, cellPadding: 1.8 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] }
  });

  // Diagnóstico y Recomendaciones en Página 2
  doc.addPage('landscape');

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 297, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`DICTAMEN ESTRATÉGICO & SENSIBILIDAD DOCENTE / INFLACIONARIA - ${analisis.etiquetaSemestre}`, 14, 12);

  // Cuadro de Diagnóstico
  doc.setFillColor(analisis.diagnosticoEjecutivo.nivelRiesgo === 'Bajo' ? 240 : 254, analisis.diagnosticoEjecutivo.nivelRiesgo === 'Bajo' ? 253 : 242, 242);
  doc.roundedRect(14, 24, 269, 26, 2, 2, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`DIAGNÓSTICO: ${analisis.diagnosticoEjecutivo.titulo.toUpperCase()} (Nivel de Riesgo: ${analisis.diagnosticoEjecutivo.nivelRiesgo})`, 18, 31);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(analisis.diagnosticoEjecutivo.resumen, 18, 38, { maxWidth: 260 });
  doc.text(`Sensibilidad Docente: Cada 1% de aumento salarial docente reduce el margen en ${analisis.elasticidad.impacto1PctDocenteEnMargen.toFixed(2)} pts si no se indexan aranceles. Arancel mínimo compensatorio: +${analisis.elasticidad.arancelMinimoCompensatorioPct.toFixed(1)}%.`, 18, 45);

  // Tabla de Programas Detallados
  autoTable(doc, {
    startY: 54,
    head: [['Programa Educativo', 'Docente Asignado', 'Horas', 'Alumnos', 'Tarifa Docente', 'Costo Docente', 'Gastos Ops.', 'Precio Alumno', 'Ingreso Proy.', 'Utilidad Proy.', 'Margen %', 'Dictamen']],
    body: analisis.programas.slice(0, 18).map(p => [
      p.nombre,
      p.docente,
      `${p.horasClase}h`,
      `${p.alumnosProyectados}`,
      formatearMoneda(p.tarifaDocenteAjustada, moneda),
      formatearMoneda(p.costoDocenteProyectado, moneda),
      formatearMoneda(p.gastosOperativosConInflacion, moneda),
      formatearMoneda(p.precioAjustado, moneda),
      formatearMoneda(p.ingresoProyectado, moneda),
      formatearMoneda(p.utilidadProyectada, moneda),
      `${p.margenProyectado.toFixed(1)}%`,
      p.estadoSemaforo === 'optimo' ? 'Óptimo' : p.estadoSemaforo === 'moderado' ? 'Moderado' : 'Revisar'
    ]),
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255] }
  });

  // Firmas Ejecutivas
  const finalY2 = (doc as any).lastAutoTable.finalY || 160;
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.text('_____________________________________', 35, Math.min(finalY2 + 25, 195));
  doc.text('Dirección General & Finanzas', 45, Math.min(finalY2 + 30, 200));

  doc.text('_____________________________________', 120, Math.min(finalY2 + 25, 195));
  doc.text('Gerencia Académica & Docente', 130, Math.min(finalY2 + 30, 200));

  doc.text('_____________________________________', 205, Math.min(finalY2 + 25, 195));
  doc.text('Gerencia Comercial & Matrícula', 215, Math.min(finalY2 + 30, 200));

  // Guardar archivo localmente
  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = nombreArchivo;
  a.click();
  URL.revokeObjectURL(blobUrl);

  // Subir a Drive si aplica
  let driveUrl: string | undefined;
  if (guardarEnDrive) {
    try {
      const uploadRes = await subirReporteADrive({
        titulo: `Proyección Financiera Semestral - ${analisis.etiquetaSemestre}`,
        gerencia: 'Gerencia General',
        formato: 'PDF',
        nombreArchivo,
        contenido: pdfBlob,
        mimeType: 'application/pdf',
      });
      if (uploadRes.success && uploadRes.driveUrl) {
        driveUrl = uploadRes.driveUrl;
      }
    } catch (e) {
      console.warn('No se pudo respaldar en Google Drive:', e);
    }
  }

  return { success: true, driveUrl, nombreArchivo };
}

/**
 * Exporta el Modelo de Proyección Semestral a Formato Excel (.xlsx) Multi-Hoja
 */
export async function exportarProyeccionExcel(
  analisis: AnalisisProyeccionSemestral,
  moneda: Moneda,
  guardarEnDrive = true
): Promise<{ success: boolean; driveUrl?: string; nombreArchivo: string }> {
  const wb = XLSX.utils.book_new();
  const nombreArchivo = `Proyeccion_Financiera_${analisis.semestreObjetivo}_${Date.now()}.xlsx`;

  // Hoja 1: Resumen Ejecutivo y Parámetros
  const wsResumenData = [
    ['SUMMIT IMPULSA GLOBAL - MODELO DE PROYECCIÓN DE CRECIMIENTO SEMESTRAL'],
    ['Semestre Proyectado:', analisis.etiquetaSemestre],
    ['Fecha de Generación:', new Date().toLocaleString('es-HN')],
    ['Moneda:', moneda],
    [],
    ['PARÁMETROS DE SIMULACIÓN'],
    ['Crecimiento de Matrícula (%):', `${analisis.parametros.crecimientoMatriculaPct}%`],
    ['Ajuste Inflacionario de Gastos (%):', `${analisis.parametros.inflacionGastosPct}%`],
    ['Ajuste de Costos Docentes (%):', `${analisis.parametros.incrementoCostoDocentePct}%`],
    ['Ajuste de Precios de Aranceles (%):', `${analisis.parametros.ajustePrecioArancelPct}%`],
    ['Escenario Seleccionado:', analisis.parametros.escenarioActivo.toUpperCase()],
    [],
    ['COMPARATIVA FINANCIERA (BASE HISTÓRICO VS PROYECCIÓN PRÓXIMO SEMESTRE)'],
    ['Métrica', 'Semestre Base Histórico', 'Próximo Semestre Proyectado', 'Variación Neta', 'Variación %'],
    ['Ingresos Netos', analisis.kpisBase.totalIngresos, analisis.kpisProyectados.totalIngresos, analisis.kpisProyectados.deltaIngresosMonto, `${analisis.kpisProyectados.deltaIngresosPct.toFixed(1)}%`],
    ['Costos Docentes', analisis.kpisBase.totalCostosDocentes, analisis.kpisProyectados.totalCostosDocentes, analisis.kpisProyectados.deltaCostosDocentesMonto, `${analisis.kpisProyectados.deltaCostosDocentesPct.toFixed(1)}%`],
    ['Gastos Operativos (con Inflación)', analisis.kpisBase.totalCostosOperativos, analisis.kpisProyectados.totalCostosOperativos, analisis.kpisProyectados.deltaCostosOperativosMonto, `${analisis.kpisProyectados.deltaCostosOperativosPct.toFixed(1)}%`],
    ['Costo Total de Operación', analisis.kpisBase.costoTotal, analisis.kpisProyectados.costoTotal, analisis.kpisProyectados.deltaCostosTotalesMonto, `${analisis.kpisProyectados.deltaCostosTotalesPct.toFixed(1)}%`],
    ['Utilidad Neta Semestral', analisis.kpisBase.utilidadNeta, analisis.kpisProyectados.utilidadNeta, analisis.kpisProyectados.deltaUtilidadMonto, `${analisis.kpisProyectados.deltaUtilidadPct.toFixed(1)}%`],
    ['Margen Operativo (%)', `${analisis.kpisBase.margenPromedio.toFixed(1)}%`, `${analisis.kpisProyectados.margenPromedio.toFixed(1)}%`, `${analisis.kpisProyectados.deltaMargenPuntos.toFixed(1)} pts`, '-'],
    ['Matrícula de Alumnos', analisis.kpisBase.totalAlumnos, analisis.kpisProyectados.totalAlumnos, analisis.kpisProyectados.totalAlumnos - analisis.kpisBase.totalAlumnos, `${analisis.parametros.crecimientoMatriculaPct}%`],
    ['Punto de Equilibrio (Alumnos)', analisis.kpisBase.puntoEquilibrioAlumnos, analisis.kpisProyectados.puntoEquilibrioAlumnos, '-', '-'],
    [],
    ['ANÁLISIS DE SENSIBILIDAD & ELASTICIDAD DOCENTE'],
    ['Impacto por cada 1% de aumento salarial docente en margen:', `${analisis.elasticidad.impacto1PctDocenteEnMargen.toFixed(2)} pts porcentuales`],
    ['Ajuste de arancel mínimo sugerido para sostener margen:', `+${analisis.elasticidad.arancelMinimoCompensatorioPct.toFixed(1)}%`],
    ['Alumnos extra necesarios si no se ajusta arancel:', `${analisis.elasticidad.alumnosAdicionalesNecesarios} alumnos`]
  ];

  const wsResumen = XLSX.utils.aoa_to_sheet(wsResumenData);
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Ejecutivo');

  // Hoja 2: Proyección Mensual (Mes a Mes)
  const wsMesesData = [
    ['PROYECCIÓN MENSUAL A 6 MESES - SUMMIT IMPULSA GLOBAL'],
    ['Mes', 'Etiqueta', 'Matrícula Alumnos', 'Ingresos Proyectados', 'Costos Docentes', 'Gastos Operativos (Inf)', 'Costo Total', 'Utilidad Neta', 'Margen %', 'Punto Equilibrio'],
    ...analisis.mesesProyectados.map(m => [
      m.mesNumero,
      m.etiquetaMes,
      m.alumnosProyectados,
      m.ingresosProyectados,
      m.costosDocentesAjustados,
      m.costosOperativosConInflacion,
      m.costoTotalProyectado,
      m.utilidadProyectada,
      m.margenProyectado / 100,
      m.puntoEquilibrioAlumnos
    ])
  ];

  const wsMeses = XLSX.utils.aoa_to_sheet(wsMesesData);
  XLSX.utils.book_append_sheet(wb, wsMeses, 'Proyeccion Mensual');

  // Hoja 3: Detalle por Programa
  const wsProgramasData = [
    ['DETALLE DE PROYECCIÓN POR PROGRAMA EDUCATIVO'],
    ['Programa', 'Docente', 'Tipo', 'Horas', 'Alumnos Base', 'Alumnos Proy', 'Tarifa Docente Base', 'Tarifa Docente Ajustada', 'Costo Docente Proy', 'Gastos Ops Proy', 'Costo Total Proy', 'Precio Alumno Base', 'Precio Alumno Proy', 'Ingreso Proy', 'Utilidad Proy', 'Margen Proy %', 'Semáforo', 'Recomendación'],
    ...analisis.programas.map(p => [
      p.nombre,
      p.docente,
      p.tipoProyecto,
      p.horasClase,
      p.alumnosBase,
      p.alumnosProyectados,
      p.tarifaDocenteBase,
      p.tarifaDocenteAjustada,
      p.costoDocenteProyectado,
      p.gastosOperativosConInflacion,
      p.costoTotalProyectado,
      p.precioBase,
      p.precioAjustado,
      p.ingresoProyectado,
      p.utilidadProyectada,
      p.margenProyectado / 100,
      p.estadoSemaforo,
      p.recomendacion
    ])
  ];

  const wsProgramas = XLSX.utils.aoa_to_sheet(wsProgramasData);
  XLSX.utils.book_append_sheet(wb, wsProgramas, 'Detalle Programas');

  // Hoja 4: Comparativa de Escenarios
  const wsEscenariosData = [
    ['MATRIZ DE ESCENARIOS FINANCIEROS (CONSERVADOR VS BASE VS OPTIMISTA)'],
    ['Escenario', 'Crecimiento Matrícula %', 'Inflación %', 'Aumento Docente %', 'Ajuste Arancel %', 'Ingresos Proyectados', 'Costos Docentes', 'Gastos Operativos', 'Costo Total', 'Utilidad Neta', 'Margen %'],
    ...analisis.comparativaEscenarios.map(e => [
      e.nombre,
      `${e.crecimientoMatricula}%`,
      `${e.inflacion}%`,
      `${e.aumentoDocente}%`,
      `${e.ajusteArancel}%`,
      e.ingresos,
      e.costosDocentes,
      e.costosOperativos,
      e.costoTotal,
      e.utilidad,
      e.margen / 100
    ])
  ];

  const wsEscenarios = XLSX.utils.aoa_to_sheet(wsEscenariosData);
  XLSX.utils.book_append_sheet(wb, wsEscenarios, 'Escenarios');

  // Descarga y subida
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = nombreArchivo;
  a.click();
  URL.revokeObjectURL(blobUrl);

  let driveUrl: string | undefined;
  if (guardarEnDrive) {
    try {
      const uploadRes = await subirReporteADrive({
        titulo: `Modelo Financiero Semestral Excel - ${analisis.etiquetaSemestre}`,
        gerencia: 'Gerencia General',
        formato: 'EXCEL',
        nombreArchivo,
        contenido: blob,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      if (uploadRes.success && uploadRes.driveUrl) {
        driveUrl = uploadRes.driveUrl;
      }
    } catch (e) {
      console.warn('No se pudo subir Excel a Drive:', e);
    }
  }

  return { success: true, driveUrl, nombreArchivo };
}
