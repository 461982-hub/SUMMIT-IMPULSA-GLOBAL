/**
 * COMPARADOR SIMULTÁNEO: PLANIFICACIÓN POA SEP - DIC 2026 VS. REALIDAD EJECUTADA EN LA APP
 * Summit Impulsa Global, S.A. de C.V.
 *
 * Contrasta en tiempo real el Plan Operativo Anual (POA SEP - DIC 2026) con los datos
 * operativos y financieros reales formulados en la plataforma.
 */

import { ProyectoEducativo, Moneda } from '../types';
import { POA_2027_DATOS } from './poa2027Data';

export interface ComparativaMetrica {
  concepto: string;
  planificadoPOA: number;
  realidadApp: number;
  varianza: number; // Real - Plan
  porcentajeCumplimiento: number;
  unidad: 'moneda' | 'numero' | 'porcentaje';
  semaforo: 'verde' | 'amarillo' | 'rojo';
  interpretacion: string;
}

export interface ComparativaGerencia {
  gerencia: string;
  lider: string;
  correo: string;
  presupuestoPOAHNL: number;
  costoEjecutadoHNL: number;
  varianzaPresupuestoHNL: number;
  porcentajeEjecucion: number;
  estado: 'Optimo' | 'Alerta' | 'Sobregiro';
}

export interface ComparativaTrimestral {
  trimestre: string;
  nombre: string;
  ingresosPlan: number;
  ingresosReal: number;
  egresosPlan: number;
  egresosReal: number;
  flujoNetoPlan: number;
  flujoNetoReal: number;
  proyectosPlan: number;
  proyectosReal: number;
}

export interface ComparativaKPIReal {
  id: string;
  indicador: string;
  gerencia: string;
  metaPlanificada: string;
  valorRealCalculado: string;
  porcentajeCumplimiento: number;
  semaforo: 'verde' | 'amarillo' | 'rojo';
  detalle: string;
}

export interface ComparativaPOAResultado {
  // Resumen Ejecutivo Financiero
  ingresos: ComparativaMetrica;
  egresos: ComparativaMetrica;
  superavit: ComparativaMetrica;
  margenOperativo: ComparativaMetrica;
  proyectosTotales: ComparativaMetrica;
  puntoEquilibrio: ComparativaMetrica;
  cajaCierre: ComparativaMetrica;
  runway: ComparativaMetrica;

  // Comparativa por Gerencias
  gerencias: ComparativaGerencia[];

  // Comparativa Trimestral Q1 - Q4
  trimestres: ComparativaTrimestral[];

  // 10 KPIs calculados dinámicamente
  kpisDinamicos: ComparativaKPIReal[];

  // Totales reales en HNL
  totalesReales: {
    totalIngresosHNL: number;
    totalCostosHNL: number;
    totalUtilidadHNL: number;
    totalProyectos: number;
    totalEstudiantes: number;
    totalHorasDocentes: number;
    totalDocentesHonorariosHNL: number;
    totalMarketingComisionesHNL: number;
    totalFijosAsignadosHNL: number;
    margenRealPonderado: number;
    roiRealPonderado: number;
  };
}

/**
 * Calcula la comparativa completa y simultánea entre la planificación
 * del POA SEP - DIC 2026 y los proyectos reales registrados en la aplicación.
 */
export function calcularComparativaPOAVsRealidad(
  proyectos: ProyectoEducativo[],
  monedaApp: Moneda | string = 'LPS'
): ComparativaPOAResultado {
  const { resumen, presupuestosGerencias } = POA_2027_DATOS;
  const TIPO_CAMBIO = resumen.tipoCambio; // 27.00 L/USD
  const metaEgresos = resumen.egresosOperativos || 337224.90;

  // Función para normalizar cualquier monto a Lempiras (HNL)
  const aHNL = (monto: number): number => {
    return monedaApp === 'USD' ? monto * TIPO_CAMBIO : monto;
  };

  // 1. Agregación de datos reales de la cartera de proyectos
  let totalIngresosHNL = 0;
  let totalCostosHNL = 0;
  let totalUtilidadHNL = 0;
  let totalEstudiantes = 0;
  let totalHorasDocentes = 0;
  let totalDocentesHonorariosHNL = 0;
  let totalMarketingComisionesHNL = 0;
  let totalFijosAsignadosHNL = 0;

  let totalAcreditados = 0;
  let sumaNPS = 0;
  let totalCalificadosNPS = 0;
  let proyectosConMargenPositivo = 0;

  // Distribución trimestral real
  const ingresosTrimestrales = [0, 0, 0, 0];
  const egresosTrimestrales = [0, 0, 0, 0];
  const proyectosTrimestrales = [0, 0, 0, 0];

  proyectos.forEach((p) => {
    const ing = aHNL(p.ingresoRealTotal || 0);
    const cost = aHNL(p.gastoTotalOperativo || 0);
    const util = aHNL(p.totalGananciasFinales ?? (ing - cost));

    totalIngresosHNL += ing;
    totalCostosHNL += cost;
    totalUtilidadHNL += util;
    totalEstudiantes += (p.alumnosFinal || p.alumnosProyectados || 0);
    totalHorasDocentes += p.horasClase || 0;

    const honorarios = aHNL(p.costoDocenteCalculado || p.costoDocenteManual || ((p.tarifaHoraDocente || 200) * (p.horasClase || 0)));
    totalDocentesHonorariosHNL += honorarios;

    const mkt = aHNL(p.gastoPublicidad || 0);
    totalMarketingComisionesHNL += mkt;

    const platformAndOther = aHNL((p.costoZoom || 0) + (p.costoPapeleria || 0) + (p.gastosVarios || 0));
    const fijos = aHNL(cost - honorarios - mkt);
    totalFijosAsignadosHNL += fijos > 0 ? fijos : platformAndOther;

    if (p.cumpleAcreditacionSAR || p.aplicaISV === false) {
      totalAcreditados++;
    }

    if (p.docenteEvaluacionNPS && p.docenteEvaluacionNPS > 0) {
      sumaNPS += p.docenteEvaluacionNPS;
      totalCalificadosNPS++;
    }

    if (util > 0) {
      proyectosConMargenPositivo++;
    }

    // Clasificar en trimestre por fechaProgramacion o mesControl
    let qIdx = 0;
    if (p.fechaProgramacion) {
      const parts = p.fechaProgramacion.split('-');
      if (parts.length >= 2) {
        const m = parseInt(parts[1], 10);
        if (m <= 3) qIdx = 0;
        else if (m <= 6) qIdx = 1;
        else if (m <= 9) qIdx = 2;
        else qIdx = 3;
      }
    } else if (p.mesControl) {
      const parts = p.mesControl.split('-');
      if (parts.length >= 2) {
        const m = parseInt(parts[1], 10);
        if (m <= 3) qIdx = 0;
        else if (m <= 6) qIdx = 1;
        else if (m <= 9) qIdx = 2;
        else qIdx = 3;
      }
    }

    ingresosTrimestrales[qIdx] += ing;
    egresosTrimestrales[qIdx] += cost;
    proyectosTrimestrales[qIdx] += 1;
  });

  const totalProyectos = proyectos.length;
  const margenRealPonderado = totalIngresosHNL > 0 ? (totalUtilidadHNL / totalIngresosHNL) * 100 : 0;
  const roiRealPonderado = totalCostosHNL > 0 ? (totalUtilidadHNL / totalCostosHNL) * 100 : 0;
  const promedioNPSDocente = totalCalificadosNPS > 0 ? (sumaNPS / totalCalificadosNPS) : 4.8;

  // 2. Metricas Comparativas Principales
  const pctIngresos = resumen.ingresosProyectados > 0 ? (totalIngresosHNL / resumen.ingresosProyectados) * 100 : 0;
  const ingresosMetrica: ComparativaMetrica = {
    concepto: 'Ingresos Operativos Totales',
    planificadoPOA: resumen.ingresosProyectados,
    realidadApp: totalIngresosHNL,
    varianza: totalIngresosHNL - resumen.ingresosProyectados,
    porcentajeCumplimiento: pctIngresos,
    unidad: 'moneda',
    semaforo: pctIngresos >= 90 ? 'verde' : pctIngresos >= 50 ? 'amarillo' : 'rojo',
    interpretacion: pctIngresos >= 100 
      ? 'Superó la meta de ingresos del POA SEP - DIC 2026' 
      : `Registra el ${pctIngresos.toFixed(1)}% de la facturación proyectada para el piloto cuatrimestral.`,
  };

  const pctEgresos = metaEgresos > 0 ? (totalCostosHNL / metaEgresos) * 100 : 0;
  const egresosMetrica: ComparativaMetrica = {
    concepto: 'Egresos y Costos Totales',
    planificadoPOA: metaEgresos,
    realidadApp: totalCostosHNL,
    varianza: totalCostosHNL - metaEgresos,
    porcentajeCumplimiento: pctEgresos,
    unidad: 'moneda',
    semaforo: totalCostosHNL <= metaEgresos ? 'verde' : 'rojo',
    interpretacion: totalCostosHNL <= metaEgresos 
      ? 'Estructura de costos dentro del presupuesto lean (L. 337,224.90).' 
      : 'Costos reales superan el presupuesto cuatrimestral proyectado.',
  };

  const pctSuperavit = resumen.superavitOperativoEst > 0 ? (totalUtilidadHNL / resumen.superavitOperativoEst) * 100 : 0;
  const superavitMetrica: ComparativaMetrica = {
    concepto: 'Superávit Operativo EBITDA',
    planificadoPOA: resumen.superavitOperativoEst,
    realidadApp: totalUtilidadHNL,
    varianza: totalUtilidadHNL - resumen.superavitOperativoEst,
    porcentajeCumplimiento: pctSuperavit,
    unidad: 'moneda',
    semaforo: pctSuperavit >= 85 ? 'verde' : pctSuperavit >= 45 ? 'amarillo' : 'rojo',
    interpretacion: pctSuperavit >= 100 
      ? 'Superávit alcanzado y superado con creces.' 
      : `Se ha acumulado el ${pctSuperavit.toFixed(1)}% de la utilidad cuatrimestral planificada.`,
  };

  const margenMetrica: ComparativaMetrica = {
    concepto: 'Margen Operativo Ponderado',
    planificadoPOA: resumen.margenOperativoPorcentaje,
    realidadApp: margenRealPonderado,
    varianza: margenRealPonderado - resumen.margenOperativoPorcentaje,
    porcentajeCumplimiento: (margenRealPonderado / (resumen.margenOperativoPorcentaje || 1)) * 100,
    unidad: 'porcentaje',
    semaforo: margenRealPonderado >= resumen.margenOperativoPorcentaje ? 'verde' : margenRealPonderado >= 1.5 ? 'amarillo' : 'rojo',
    interpretacion: margenRealPonderado >= resumen.margenOperativoPorcentaje 
      ? `Rentabilidad por encima de la meta del ${resumen.margenOperativoPorcentaje}% del POA.` 
      : 'Margen comprimido; vigilar costos docentes y cobro anticipado de matrículas.',
  };

  const pctProyectos = (totalProyectos / resumen.metaAnualProyectos) * 100;
  const proyectosMetrica: ComparativaMetrica = {
    concepto: 'Volumen Total de Grupos Académicos',
    planificadoPOA: resumen.metaAnualProyectos,
    realidadApp: totalProyectos,
    varianza: totalProyectos - resumen.metaAnualProyectos,
    porcentajeCumplimiento: pctProyectos,
    unidad: 'numero',
    semaforo: pctProyectos >= 100 ? 'verde' : pctProyectos >= 35.5 ? 'amarillo' : 'rojo',
    interpretacion: totalProyectos >= resumen.metaAnualProyectos 
      ? '100% de los grupos académicos piloto (74) formulados y registrados.' 
      : `Faltan ${Math.max(0, resumen.metaAnualProyectos - totalProyectos)} grupos para completar los 74 comprometidos.`,
  };

  const puntoEquilibrioMetrica: ComparativaMetrica = {
    concepto: 'Punto de Equilibrio (Break-Even)',
    planificadoPOA: resumen.puntoEquilibrioAnual,
    realidadApp: totalProyectos,
    varianza: totalProyectos - resumen.puntoEquilibrioAnual,
    porcentajeCumplimiento: (totalProyectos / resumen.puntoEquilibrioAnual) * 100,
    unidad: 'numero',
    semaforo: totalProyectos >= resumen.puntoEquilibrioAnual ? 'verde' : 'rojo',
    interpretacion: totalProyectos >= resumen.puntoEquilibrioAnual 
      ? 'Punto de equilibrio superado; 100% de costos cubiertos.' 
      : `Riesgo de déficit; faltan ${Math.max(0, Math.ceil(resumen.puntoEquilibrioAnual - totalProyectos))} grupos para cubrir costos mínimos.`,
  };

  // Estimación de caja y runway real
  const cajaRealEstimada = resumen.capitalInicialBootstrapping + totalUtilidadHNL;
  const cajaMetrica: ComparativaMetrica = {
    concepto: 'Saldo de Caja Estimado (con L. 10k base)',
    planificadoPOA: resumen.cajaEstimadaCierre,
    realidadApp: cajaRealEstimada,
    varianza: cajaRealEstimada - resumen.cajaEstimadaCierre,
    porcentajeCumplimiento: (cajaRealEstimada / resumen.cajaEstimadaCierre) * 100,
    unidad: 'moneda',
    semaforo: cajaRealEstimada >= resumen.cajaEstimadaCierre ? 'verde' : cajaRealEstimada > 50000 ? 'amarillo' : 'rojo',
    interpretacion: cajaRealEstimada >= resumen.cajaEstimadaCierre 
      ? 'Posición de liquidez y reservas superior a la estimada en el POA.' 
      : 'Caja operativa en formación.',
  };

  const gastoPromedioMensual = totalCostosHNL > 0 ? (totalCostosHNL / Math.max(1, totalProyectos / 10.3)) : (1129850 / 12);
  const runwayRealMeses = gastoPromedioMensual > 0 ? (cajaRealEstimada / gastoPromedioMensual) : 19.0;
  const runwayMetrica: ComparativaMetrica = {
    concepto: 'Runway / Cobertura Financiera (Meses)',
    planificadoPOA: resumen.runwayMeses,
    realidadApp: Math.min(36, Number(runwayRealMeses.toFixed(1))),
    varianza: Number((runwayRealMeses - resumen.runwayMeses).toFixed(1)),
    porcentajeCumplimiento: (runwayRealMeses / resumen.runwayMeses) * 100,
    unidad: 'numero',
    semaforo: runwayRealMeses >= 12 ? 'verde' : runwayRealMeses >= 6 ? 'amarillo' : 'rojo',
    interpretacion: runwayRealMeses >= 12 
      ? 'Autonomía de caja asegurada (> 12 meses).' 
      : 'Requiere acelerar ingresos para extender el runway.',
  };

  // 3. Comparativa por Gerencias
  const gerenciaGeneralPOA = presupuestosGerencias.find(g => g.gerencia.includes('General'))?.totalAnual || 512000;
  const gerenciaAcademicaPOA = presupuestosGerencias.find(g => g.gerencia.includes('Académica'))?.totalAnual || 759500;
  const gerenciaComercialPOA = presupuestosGerencias.find(g => g.gerencia.includes('Comercial'))?.totalAnual || 330000;

  const gerencias: ComparativaGerencia[] = [
    {
      gerencia: 'Gerencia General',
      lider: 'Dr. Walter Pedroza',
      correo: 'administracion.summitg@gmail.com',
      presupuestoPOAHNL: gerenciaGeneralPOA,
      costoEjecutadoHNL: totalFijosAsignadosHNL,
      varianzaPresupuestoHNL: gerenciaGeneralPOA - totalFijosAsignadosHNL,
      porcentajeEjecucion: gerenciaGeneralPOA > 0 ? (totalFijosAsignadosHNL / gerenciaGeneralPOA) * 100 : 0,
      estado: totalFijosAsignadosHNL <= gerenciaGeneralPOA ? 'Optimo' : 'Sobregiro',
    },
    {
      gerencia: 'Gerencia Académica',
      lider: 'Phd. Donal Reyes',
      correo: 'academia.summitg@gmail.com',
      presupuestoPOAHNL: gerenciaAcademicaPOA,
      costoEjecutadoHNL: totalDocentesHonorariosHNL,
      varianzaPresupuestoHNL: gerenciaAcademicaPOA - totalDocentesHonorariosHNL,
      porcentajeEjecucion: gerenciaAcademicaPOA > 0 ? (totalDocentesHonorariosHNL / gerenciaAcademicaPOA) * 100 : 0,
      estado: totalDocentesHonorariosHNL <= gerenciaAcademicaPOA ? 'Optimo' : 'Sobregiro',
    },
    {
      gerencia: 'Gerencia Comercial y Expansión',
      lider: 'Msc. Lilian Ordoñez',
      correo: 'comercial.summitg@gmail.com',
      presupuestoPOAHNL: gerenciaComercialPOA,
      costoEjecutadoHNL: totalMarketingComisionesHNL,
      varianzaPresupuestoHNL: gerenciaComercialPOA - totalMarketingComisionesHNL,
      porcentajeEjecucion: gerenciaComercialPOA > 0 ? (totalMarketingComisionesHNL / gerenciaComercialPOA) * 100 : 0,
      estado: totalMarketingComisionesHNL <= gerenciaComercialPOA ? 'Optimo' : 'Sobregiro',
    },
  ];

  // 4. Comparativa Trimestral Q1 - Q4
  const trimestresNombres = [
    { id: 'Q1', nombre: 'Q1 (Ene - Mar)', planIng: 188000, planEg: 152600, planProy: 31 },
    { id: 'Q2', nombre: 'Q2 (Abr - Jun)', planIng: 515000, planEg: 281500, planProy: 31 },
    { id: 'Q3', nombre: 'Q3 (Jul - Sep)', planIng: 540000, planEg: 309850, planProy: 31 },
    { id: 'Q4', nombre: 'Q4 (Oct - Dic)', planIng: 726000, planEg: 385900, planProy: 31 },
  ];

  const trimestres: ComparativaTrimestral[] = trimestresNombres.map((t, i) => {
    const ingReal = ingresosTrimestrales[i];
    const egReal = egresosTrimestrales[i];
    return {
      trimestre: t.id,
      nombre: t.nombre,
      ingresosPlan: t.planIng,
      ingresosReal: ingReal,
      egresosPlan: t.planEg,
      egresosReal: egReal,
      flujoNetoPlan: t.planIng - t.planEg,
      flujoNetoReal: ingReal - egReal,
      proyectosPlan: t.planProy,
      proyectosReal: proyectosTrimestrales[i],
    };
  });

  // 5. 10 KPIs Estratégicos Dinámicos
  const kpisDinamicos: ComparativaKPIReal[] = [
    {
      id: 'kpi-1',
      indicador: 'EBITDA / Margen Operativo',
      gerencia: 'Gerencia General',
      metaPlanificada: '>= 42.6% Anual',
      valorRealCalculado: `${margenRealPonderado.toFixed(1)}%`,
      porcentajeCumplimiento: Math.min(150, (margenRealPonderado / 42.6) * 100),
      semaforo: margenRealPonderado >= 42.6 ? 'verde' : margenRealPonderado >= 25 ? 'amarillo' : 'rojo',
      detalle: `Margen neto consolidado sobre L. ${totalIngresosHNL.toLocaleString()} facturados.`,
    },
    {
      id: 'kpi-2',
      indicador: 'Disciplina Presupuestaria',
      gerencia: 'Gerencia General',
      metaPlanificada: '100% Sin Sobrepasos (L. 1.60M techo)',
      valorRealCalculado: `${(100 - Math.max(0, (totalCostosHNL / 1129850) * 100 - 100)).toFixed(0)}%`,
      porcentajeCumplimiento: totalCostosHNL <= 1129850 ? 100 : 70,
      semaforo: totalCostosHNL <= 1129850 ? 'verde' : 'rojo',
      detalle: `Costos ejecutados: L. ${totalCostosHNL.toLocaleString()} vs L. 1,129,850 planificados.`,
    },
    {
      id: 'kpi-3',
      indicador: 'Cartera de Proyectos Registrados',
      gerencia: 'Gerencia Académica',
      metaPlanificada: '124 Proyectos / Año',
      valorRealCalculado: `${totalProyectos} Proyectos`,
      porcentajeCumplimiento: Math.min(100, (totalProyectos / 124) * 100),
      semaforo: totalProyectos >= 124 ? 'verde' : totalProyectos >= 44 ? 'amarillo' : 'rojo',
      detalle: `Rebaja automática activa: Faltan ${Math.max(0, 124 - totalProyectos)} proyectos para cumplir meta anual.`,
    },
    {
      id: 'kpi-4',
      indicador: 'Punto de Equilibrio Mínimo',
      gerencia: 'Gerencia General',
      metaPlanificada: '44 Proyectos / Año (4 proy/mes)',
      valorRealCalculado: `${totalProyectos} / 44`,
      porcentajeCumplimiento: Math.min(100, (totalProyectos / 44) * 100),
      semaforo: totalProyectos >= 44 ? 'verde' : 'rojo',
      detalle: totalProyectos >= 44 ? 'Break-even superado; costos 100% solventes.' : 'En zona de déficit operativo.',
    },
    {
      id: 'kpi-5',
      indicador: 'Satisfacción y Calidad Docente (NPS)',
      gerencia: 'Gerencia Académica',
      metaPlanificada: 'NPS >= 4.5 / 5.0 (>= 90%)',
      valorRealCalculado: `⭐ ${promedioNPSDocente.toFixed(2)} / 5.0`,
      porcentajeCumplimiento: Math.min(100, (promedioNPSDocente / 4.5) * 100),
      semaforo: promedioNPSDocente >= 4.5 ? 'verde' : 'amarillo',
      detalle: 'Evaluación consolidada del claustro docente formativo.',
    },
    {
      id: 'kpi-6',
      indicador: 'Acreditación y Cumplimiento SAR',
      gerencia: 'Gerencia Académica',
      metaPlanificada: '100% Cursos Exentos ISV (SAR)',
      valorRealCalculado: `${totalProyectos > 0 ? ((totalAcreditados / totalProyectos) * 100).toFixed(0) : 100}%`,
      porcentajeCumplimiento: totalProyectos > 0 ? (totalAcreditados / totalProyectos) * 100 : 100,
      semaforo: totalAcreditados === totalProyectos ? 'verde' : 'amarillo',
      detalle: `${totalAcreditados} de ${totalProyectos} cursos cuentan con respaldo de acreditación SAR.`,
    },
    {
      id: 'kpi-7',
      indicador: 'Facturación y Ventas Brutas',
      gerencia: 'Gerencia Comercial',
      metaPlanificada: 'L. 1,969,000.00 Anual',
      valorRealCalculado: `L. ${totalIngresosHNL.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      porcentajeCumplimiento: Math.min(100, pctIngresos),
      semaforo: pctIngresos >= 85 ? 'verde' : pctIngresos >= 45 ? 'amarillo' : 'rojo',
      detalle: `Progreso comercial: ${pctIngresos.toFixed(1)}% de la cuota anual del POA.`,
    },
    {
      id: 'kpi-8',
      indicador: 'Volumen de Estudiantes Matriculados',
      gerencia: 'Gerencia Comercial',
      metaPlanificada: '>= 620 Alumnos Anuales (Prom. 5/curso)',
      valorRealCalculado: `${totalEstudiantes} Alumnos`,
      porcentajeCumplimiento: Math.min(100, (totalEstudiantes / 620) * 100),
      semaforo: totalEstudiantes >= 620 ? 'verde' : totalEstudiantes >= 220 ? 'amarillo' : 'rojo',
      detalle: `Promedio actual: ${totalProyectos > 0 ? (totalEstudiantes / totalProyectos).toFixed(1) : 0} alumnos por curso.`,
    },
    {
      id: 'kpi-9',
      indicador: 'Cobertura de Caja y Runway',
      gerencia: 'Gerencia General',
      metaPlanificada: '>= 12 Meses (Proy: 19 Meses)',
      valorRealCalculado: `${runwayRealMeses.toFixed(1)} Meses`,
      porcentajeCumplimiento: Math.min(100, (runwayRealMeses / 12) * 100),
      semaforo: runwayRealMeses >= 12 ? 'verde' : runwayRealMeses >= 6 ? 'amarillo' : 'rojo',
      detalle: `Caja proyectada de L. ${cajaRealEstimada.toLocaleString(undefined, { maximumFractionDigits: 0 })} con L. 10k inicial.`,
    },
    {
      id: 'kpi-10',
      indicador: 'Retorno de Inversión (ROI) Global',
      gerencia: 'GOBERNANZA GLOBAL',
      metaPlanificada: 'ROI Promedio >= 70.0%',
      valorRealCalculado: `${roiRealPonderado.toFixed(1)}%`,
      porcentajeCumplimiento: Math.min(100, (roiRealPonderado / 70) * 100),
      semaforo: roiRealPonderado >= 70 ? 'verde' : roiRealPonderado >= 35 ? 'amarillo' : 'rojo',
      detalle: `Rentabilidad generada sobre cada lempira invertido en costos operativos.`,
    },
  ];

  return {
    ingresos: ingresosMetrica,
    egresos: egresosMetrica,
    superavit: superavitMetrica,
    margenOperativo: margenMetrica,
    proyectosTotales: proyectosMetrica,
    puntoEquilibrio: puntoEquilibrioMetrica,
    cajaCierre: cajaMetrica,
    runway: runwayMetrica,
    gerencias,
    trimestres,
    kpisDinamicos,
    totalesReales: {
      totalIngresosHNL,
      totalCostosHNL,
      totalUtilidadHNL,
      totalProyectos,
      totalEstudiantes,
      totalHorasDocentes,
      totalDocentesHonorariosHNL,
      totalMarketingComisionesHNL,
      totalFijosAsignadosHNL,
      margenRealPonderado,
      roiRealPonderado,
    },
  };
}
