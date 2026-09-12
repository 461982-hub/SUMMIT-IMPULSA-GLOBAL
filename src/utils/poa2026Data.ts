/**
 * MATRIZ MAESTRA POA SEP - DIC 2026 - TABLERO DE CONTROL DIRECTIVO & CUADRO DE MANDO INTEGRAL
 * SUMMIT IMPULSA GLOBAL, S.A. DE C.V.
 * Plan Operativo Anual (POA) SEP - DIC 2026
 * Consolidación en Lempiras (HNL) | Tipo de Cambio Referencial: L. 27.00 / USD
 * Premisa: Modelo Bootstrapping con Cero Capital Inicial (L. 0.00)
 */

export interface POA2026ResumenEjecutivo {
  empresa: string;
  poaTitulo: string;
  periodoVigencia: string;
  tipoCambio: number;
  capitalInicialBootstrapping: number; // L. 0.00
  ingresosProyectados: number; // L. 346,320.00
  egresosOperativos: number; // L. 337,224.90
  superavitOperativoEst: number; // L. 9,095.10 (EBITDA)
  margenOperativoPorcentaje: number; // 2.6%
  metaAnualProyectos: number; // 74 grupos académicos piloto
  promedioProyectosMes: number; // 18.5 grupos/mes
  puntoEquilibrioMes: number; // 17.3 grupos/mes
  puntoEquilibrioAnual: number; // 69.0 grupos (cobertura total de gastos)
  cajaEstimadaCierre: number; // L. 7,276.08
  runwayMeses: number; // 4.0 meses (Sep - Dic 2026)
  premisaBootstrapping: string;
}

export interface POAPresupuestoGerencia {
  gerencia: string;
  eje: string;
  lider: string;
  correo: string;
  sep: number;
  oct: number;
  nov: number;
  dic: number;
  q1: number; // Compatibilidad con vistas trimestrales (Sep = Q3 / inicio)
  q2: number;
  q3: number;
  q4: number;
  totalCuatrimestre: number;
  totalAnual: number; // Compatibilidad
  porcentajePart: number;
  numActividades: number;
  porcentajeActividades: number;
  colorTema: 'purple' | 'blue' | 'emerald';
  estatusControl: string;
}

export interface POAFlujoMensual {
  concepto: string;
  ejeSostenibilidad: string;
  sep: number;
  oct: number;
  nov: number;
  dic: number;
  totalCuatrimestre: number;
  porcentajeFacturacion: string;
  diagnostico: string;
}

export interface POAFlujoTrimestral {
  concepto: string;
  subtitulo: string;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  totalAnual: number;
  porcentaje: string;
}

export interface POAKPI {
  id: string;
  gerencia: 'Gerencia General' | 'Gerencia Académica' | 'Gerencia Comercial' | 'GOBERNANZA GLOBAL';
  areaEje: string;
  indicador: string;
  metaEstrategica: string;
  frecuencia: 'Mensual' | 'Trimestral' | 'Cuatrimestral' | 'Semestral' | 'Anual' | 'Por Grupo' | 'Bimestral';
  lineaBase: string;
  meta: string;
  realProy: string;
  cumplimientoPorcentaje: number;
  semaforo: '🟢 Excelente' | '🟢 Controlado' | '🟢 Integrado' | '🟢 Cumplido' | '🟢 Superado' | '🟢 Validado' | '🟢 Óptimo';
  responsable: string;
}

export interface POAModuloEstrategico {
  modulo: string;
  pestanaOrigen: string;
  indicadorClave: string;
  valorMeta: string;
  metricaRealProy: string;
  desviacionRatio: string;
  semaforo: '🟢 Favorable' | '🟢 Controlado' | '🟢 Activo' | '🟢 Solvente' | '🟢 100% Solvente sin Deuda' | '🔴 Bajo Presupuesto';
  impactoEjecutivo: string;
  responsable: string;
  enlaceRapido: string;
}

export const POA_2026_DATOS: {
  resumen: POA2026ResumenEjecutivo;
  presupuestosGerencias: POAPresupuestoGerencia[];
  flujoMensual: POAFlujoMensual[];
  flujoTrimestral: POAFlujoTrimestral[];
  kpis: POAKPI[];
  modulosEstrategicos: POAModuloEstrategico[];
} = {
  resumen: {
    empresa: 'SUMMIT IMPULSA GLOBAL, S.A. DE C.V.',
    poaTitulo: 'PLAN OPERATIVO ANUAL (POA) SEP - DIC 2026',
    periodoVigencia: 'Septiembre - Diciembre 2026 (Ejecución Inmediata)',
    tipoCambio: 27.00,
    capitalInicialBootstrapping: 0.00, // Modelo Bootstrapping con Cero Capital Inicial
    ingresosProyectados: 346320.00, // 100% Matrícula Previa Cobrada
    egresosOperativos: 337224.90, // Estructura Lean de Operación
    superavitOperativoEst: 9095.10, // EBITDA cuatrimestral
    margenOperativoPorcentaje: 2.6, // 2.6% Margen Operativo Cuatrimestral
    metaAnualProyectos: 74, // 74 grupos académicos piloto (PRJ-06)
    promedioProyectosMes: 18.5, // 18.5 grupos / mes
    puntoEquilibrioMes: 17.3, // ~17.3 grupos / mes
    puntoEquilibrioAnual: 69.0, // 69.0 Grupos para Cobertura Total de Costos
    cajaEstimadaCierre: 7276.08, // Caja Final: L. 7,276.08
    runwayMeses: 4.0,
    premisaBootstrapping: '100% Autofinanciado sin Deuda | Cobro Anticipado Inmediato de Matrículas',
  },
  presupuestosGerencias: [
    {
      gerencia: 'Gerencia General',
      eje: 'Administración, Legal, SAR, TI ERP',
      lider: 'Dr. Walter Pedroza',
      correo: 'administracion.summitg@gmail.com',
      sep: 31000,
      oct: 24000,
      nov: 28000,
      dic: 24000,
      q1: 31000,
      q2: 24000,
      q3: 28000,
      q4: 24000,
      totalCuatrimestre: 107000,
      totalAnual: 107000,
      porcentajePart: 23.3,
      numActividades: 12,
      porcentajeActividades: 30.0,
      colorTema: 'purple',
      estatusControl: '🟢 Control Presupuestario',
    },
    {
      gerencia: 'Gerencia Académica',
      eje: 'Pilar Central Formativo & LMS',
      lider: 'Phd. Donal Reyes',
      correo: 'academia.summitg@gmail.com',
      sep: 57400,
      oct: 61200,
      nov: 64100,
      dic: 68400,
      q1: 57400,
      q2: 61200,
      q3: 64100,
      q4: 68400,
      totalCuatrimestre: 251100,
      totalAnual: 251100,
      porcentajePart: 54.6,
      numActividades: 16,
      porcentajeActividades: 40.0,
      colorTema: 'blue',
      estatusControl: '🟢 Variables x Grupo',
    },
    {
      gerencia: 'Gerencia Comercial y Expansión',
      eje: 'B2B, Marketing, Alianzas',
      lider: 'Msc. Lilian Ordoñez',
      correo: 'comercial.summitg@gmail.com',
      sep: 26500,
      oct: 24500,
      nov: 23500,
      dic: 27500,
      q1: 26500,
      q2: 24500,
      q3: 23500,
      q4: 27500,
      totalCuatrimestre: 102000,
      totalAnual: 102000,
      porcentajePart: 22.2,
      numActividades: 12,
      porcentajeActividades: 30.0,
      colorTema: 'emerald',
      estatusControl: '🟢 Enfoque Conversión',
    },
  ],
  flujoMensual: [
    {
      concepto: 'Ingresos Proyectados (Cursos Académicos)',
      ejeSostenibilidad: 'Cobro Anticipado Inmediato (100% Previo)',
      sep: 74880.00,
      oct: 84240.00,
      nov: 88920.00,
      dic: 98280.00,
      totalCuatrimestre: 346320.00,
      porcentajeFacturacion: '100.0%',
      diagnostico: '🟢 Cobro Anticipado Inmediato',
    },
    {
      concepto: '(-) Egresos Operativos (Docencia + Comisiones + Fijos)',
      ejeSostenibilidad: 'Estructura Lean de Operación',
      sep: 73886.46,
      oct: 81622.27,
      nov: 86490.18,
      dic: 95225.98,
      totalCuatrimestre: 337224.90,
      porcentajeFacturacion: '97.4%',
      diagnostico: '🟢 Costos Variables y Fijos Controlados',
    },
    {
      concepto: '(=) Flujo Neto Operativo (Superávit Mensual EBITDA)',
      ejeSostenibilidad: 'Margen de Operación Piloto (2.6%)',
      sep: 993.54,
      oct: 2617.73,
      nov: 2429.82,
      dic: 3054.02,
      totalCuatrimestre: 9095.10,
      porcentajeFacturacion: '2.6%',
      diagnostico: '🟢 Superávit Operativo en todos los meses',
    },
    {
      concepto: 'Saldo de Caja Acumulado (Capital Inicial L. 0.00)',
      ejeSostenibilidad: 'Runway Disponible Real',
      sep: 794.83,
      oct: 2889.01,
      nov: 4832.87,
      dic: 7276.08,
      totalCuatrimestre: 7276.08,
      porcentajeFacturacion: '2.1%',
      diagnostico: '🟢 Cierre Positivo en Caja (L. 7,276.08)',
    },
  ],
  flujoTrimestral: [
    {
      concepto: 'Ingresos Proyectados (Sep-Dic)',
      subtitulo: '74 Grupos Piloto Cobrados al 100%',
      q1: 74880.00,
      q2: 84240.00,
      q3: 88920.00,
      q4: 98280.00,
      totalAnual: 346320.00,
      porcentaje: '100.0%',
    },
    {
      concepto: 'Egresos Operativos (Lean)',
      subtitulo: 'Docencia, Comisiones, Hosting & Gastos Fijos',
      q1: 73886.46,
      q2: 81622.27,
      q3: 86490.18,
      q4: 95225.98,
      totalAnual: 337224.90,
      porcentaje: '97.4%',
    },
    {
      concepto: 'Superávit Operativo EBITDA',
      subtitulo: 'Margen Neto de Autofinanciamiento',
      q1: 993.54,
      q2: 2617.73,
      q3: 2429.82,
      q4: 3054.02,
      totalAnual: 9095.10,
      porcentaje: '2.6%',
    },
  ],
  kpis: [
    {
      id: 'kpi-01',
      gerencia: 'Gerencia General',
      areaEje: 'Gestión de Liquidez & Runway',
      indicador: 'Runway de Caja Operativa Disponible',
      metaEstrategica: '≥ 4 meses de cobertura autónoma',
      frecuencia: 'Mensual',
      lineaBase: '0 meses',
      meta: '4 meses (Sep-Dic)',
      realProy: '4 meses',
      cumplimientoPorcentaje: 100.0,
      semaforo: '🟢 Excelente',
      responsable: 'Dr. Walter Pedroza',
    },
    {
      id: 'kpi-02',
      gerencia: 'Gerencia General',
      areaEje: 'Eficiencia Lean & Burn Rate',
      indicador: 'Índice de Gastos Fijos sobre Facturación',
      metaEstrategica: '≤ 40% de gastos fijos operativos',
      frecuencia: 'Mensual',
      lineaBase: '0%',
      meta: '≤ 40.0%',
      realProy: '36.1%',
      cumplimientoPorcentaje: 100.0,
      semaforo: '🟢 Controlado',
      responsable: 'Dr. Walter Pedroza',
    },
    {
      id: 'kpi-03',
      gerencia: 'Gerencia General',
      areaEje: 'Automatización & Facturación SAR',
      indicador: 'Procesos Lean sin Overhead Administrativo',
      metaEstrategica: '≥ 85% operaciones digitalizadas con CAI',
      frecuencia: 'Bimestral',
      lineaBase: '0%',
      meta: '85.0%',
      realProy: '90.0%',
      cumplimientoPorcentaje: 105.9,
      semaforo: '🟢 Integrado',
      responsable: 'Dr. Walter Pedroza',
    },
    {
      id: 'kpi-04',
      gerencia: 'Gerencia Académica',
      areaEje: 'Calidad Formativa',
      indicador: 'Satisfacción de alumnos en cursos piloto',
      metaEstrategica: 'Índice satisfacción VoC ≥ 92%',
      frecuencia: 'Por Grupo',
      lineaBase: '0%',
      meta: '92.0%',
      realProy: '94.0%',
      cumplimientoPorcentaje: 102.2,
      semaforo: '🟢 Excelente',
      responsable: 'Phd. Donal Reyes',
    },
    {
      id: 'kpi-05',
      gerencia: 'Gerencia Académica',
      areaEje: 'Ejecución de Proyectos',
      indicador: 'Cumplimiento de programas y clases en tiempo',
      metaEstrategica: '100% de cursos ejecutados con éxito',
      frecuencia: 'Mensual',
      lineaBase: '0%',
      meta: '100.0%',
      realProy: '100.0%',
      cumplimientoPorcentaje: 100.0,
      semaforo: '🟢 Cumplido',
      responsable: 'Phd. Donal Reyes',
    },
    {
      id: 'kpi-06',
      gerencia: 'Gerencia Académica',
      areaEje: 'Claustro Docente Variable',
      indicador: 'Retención de docentes bajo honorarios variables',
      metaEstrategica: 'Retención ≥ 85% de facilitadores clave',
      frecuencia: 'Cuatrimestral',
      lineaBase: '0%',
      meta: '85.0%',
      realProy: '92.0%',
      cumplimientoPorcentaje: 108.2,
      semaforo: '🟢 Excelente',
      responsable: 'Phd. Donal Reyes',
    },
    {
      id: 'kpi-07',
      gerencia: 'Gerencia Comercial',
      areaEje: 'Alianzas Estratégicas',
      indicador: 'Convenios institucionales y matrículas masivas',
      metaEstrategica: 'Mínimo 3 convenios marco activos',
      frecuencia: 'Cuatrimestral',
      lineaBase: '0 convenios',
      meta: '3 convenios',
      realProy: '3 convenios',
      cumplimientoPorcentaje: 100.0,
      semaforo: '🟢 Cumplido',
      responsable: 'Msc. Lilian Ordoñez',
    },
    {
      id: 'kpi-08',
      gerencia: 'Gerencia Comercial',
      areaEje: 'Pipeline Outbound B2B',
      indicador: 'Tasa de conversión de matrícula en cursos',
      metaEstrategica: 'Tasa de cierre de inscripciones ≥ 25%',
      frecuencia: 'Mensual',
      lineaBase: '0%',
      meta: '25.0%',
      realProy: '28.5%',
      cumplimientoPorcentaje: 114.0,
      semaforo: '🟢 Superado',
      responsable: 'Msc. Lilian Ordoñez',
    },
    {
      id: 'kpi-09',
      gerencia: 'Gerencia Comercial',
      areaEje: 'Cobertura de Break-Even',
      indicador: 'Grupos impartidos vs. Punto de Equilibrio',
      metaEstrategica: 'Promedio ≥ 17.3 grupos mensuales (Punto de Equilibrio)',
      frecuencia: 'Mensual',
      lineaBase: '0 grupos',
      meta: '17.3 grupos/mes',
      realProy: '18.5 grupos/mes',
      cumplimientoPorcentaje: 107.3,
      semaforo: '🟢 Superado',
      responsable: 'Msc. Lilian Ordoñez',
    },
    {
      id: 'kpi-10',
      gerencia: 'Gerencia Comercial',
      areaEje: 'Volumen Total Entregables',
      indicador: 'Volumen Total de Grupos Académicos Pilotaje',
      metaEstrategica: 'Meta cuatrimestral: 74 grupos básicos (PRJ-06)',
      frecuencia: 'Cuatrimestral',
      lineaBase: '0 grupos',
      meta: '74 grupos',
      realProy: '74 grupos',
      cumplimientoPorcentaje: 100.0,
      semaforo: '🟢 Validado',
      responsable: 'Msc. Lilian Ordoñez',
    },
    {
      id: 'kpi-11',
      gerencia: 'GOBERNANZA GLOBAL',
      areaEje: 'Sostenibilidad Bootstrapping',
      indicador: 'Eficiencia Integral de Autofinanciamiento',
      metaEstrategica: 'Cumplimiento consolidado ≥ 100%',
      frecuencia: 'Cuatrimestral',
      lineaBase: '0.0',
      meta: '100.0%',
      realProy: '125.0%',
      cumplimientoPorcentaje: 125.0,
      semaforo: '🟢 Óptimo',
      responsable: 'Junta Directiva',
    },
  ],
  modulosEstrategicos: [
    {
      modulo: '1. Control Real vs. Presupuestado',
      pestanaOrigen: 'Control Real vs Ppto',
      indicadorClave: 'Desviación en Superávit Operativo (EBITDA)',
      valorMeta: 'L. 993.54',
      metricaRealProy: 'L. 993.50',
      desviacionRatio: '-0.0%',
      semaforo: '🔴 Bajo Presupuesto',
      impactoEjecutivo: 'Control de desvíos en tiempo real sobre facturación y costos docentes.',
      responsable: 'Dr. Walter Pedroza',
      enlaceRapido: 'Ver Control Real vs Ppto',
    },
    {
      modulo: '2. Embudo Comercial & Conversión',
      pestanaOrigen: 'Embudo Comercial & CAC',
      indicadorClave: 'Tasa de Conversión General (Lead a Cierre)',
      valorMeta: '7.00%',
      metricaRealProy: '7.7%',
      desviacionRatio: '+0.7%',
      semaforo: '🟢 Favorable',
      impactoEjecutivo: '74 grupos matriculados a través de canales digitales y convenios gremiales.',
      responsable: 'Msc. Lilian Ordoñez',
      enlaceRapido: 'Ver Embudo Comercial',
    },
    {
      modulo: '3. Costo de Adquisición de Clientes (CAC)',
      pestanaOrigen: 'Embudo Comercial & CAC',
      indicadorClave: 'CAC Unitario vs. Ticket Promedio',
      valorMeta: 'L. 500.00',
      metricaRealProy: 'L. 468.00',
      desviacionRatio: '10.0% del ticket',
      semaforo: '🟢 Controlado',
      impactoEjecutivo: 'CAC eficiente que representa sólo el 10.0% del ticket de venta (L. 4,680).',
      responsable: 'Msc. Lilian Ordoñez',
      enlaceRapido: 'Ver Métricas CAC',
    },
    {
      modulo: '4. Matriz de Gestión de Riesgos',
      pestanaOrigen: 'Riesgos & Escenarios',
      indicadorClave: 'Fondo de Contingencia Asignado',
      valorMeta: 'L. 18,000.00',
      metricaRealProy: 'L. 18,000.00',
      desviacionRatio: '6 Riesgos Mitigados',
      semaforo: '🟢 Activo',
      impactoEjecutivo: 'Blindaje de liquidez para proteger la acumulación del capital de arranque.',
      responsable: 'Junta Directiva',
      enlaceRapido: 'Ver Matriz Riesgos',
    },
    {
      modulo: '5. Simulador Sensibilidad What-If',
      pestanaOrigen: 'Riesgos & Escenarios',
      indicadorClave: 'Caja Final en Escenario Pesimista (75%)',
      valorMeta: 'L. 0.00',
      metricaRealProy: 'L. 4,497.10',
      desviacionRatio: 'Margen de Seguridad',
      semaforo: '🟢 Solvente',
      impactoEjecutivo: 'La empresa preserva liquidez positiva incluso con caída del 25% en matrículas.',
      responsable: 'Dr. Walter Pedroza',
      enlaceRapido: 'Ver Escenarios What-If',
    },
    {
      modulo: '6. Unit Economics & Calce Semanal',
      pestanaOrigen: 'Catálogo & Flujo Semanal',
      indicadorClave: 'Break-Even por Cohorte y Calce Semanal',
      valorMeta: '5 Alumnos / Grupo',
      metricaRealProy: '5 Alumnos',
      desviacionRatio: '16 Semanas en Positivo',
      semaforo: '🟢 100% Solvente sin Deuda',
      impactoEjecutivo: 'Cobro anticipado de matrículas previo al desembolso de nómina docente y fijos.',
      responsable: 'Phd. Donal Reyes',
      enlaceRapido: 'Ver Catálogo & Flujo',
    },
  ],
};

// Exportación de alias maestro
export const POA_2026_DATOS_MAESTRO = POA_2026_DATOS;

export function formatearHNL(valor: number | undefined | null): string {
  if (valor === undefined || valor === null || isNaN(valor)) return 'L. 0.00';
  return new Intl.NumberFormat('es-HN', {
    style: 'currency',
    currency: 'HNL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor).replace('HNL', 'L.');
}
