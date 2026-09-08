import { ProyectoEducativo, TipoServicioFiscal, DesgloseFiscalCompleto } from '../types';
import { obtenerReglaFiscalPorTipoProyecto, REGLAS_ISV_SERVICIOS } from './isvRules';

export interface ParametrosAjusteFiscal {
  servicioFiscal?: TipoServicioFiscal;
  alumnosSimulados?: number;
  precioNetoPersonalizado?: number;
  aplicaRetencionDocente?: boolean;
  tasaISRCorporativoPersonalizada?: number; // 25, 15, 0
  tasaMunicipalPersonalizada?: number; // 0.20, 0.10, 0
  incluirAporteSolidario?: boolean;
}

export interface DetalleReglaFiscalServicio {
  servicio: TipoServicioFiscal;
  gravaISV: boolean;
  tasaISV: number;
  tasaISRRecomendada: number;
  tasaMunicipalRecomendada: number;
  retencionDocenteRecomendada: number;
  badgeEstado: 'exento' | 'gravado_optimo' | 'gravado_estandar';
  etiquetaBreve: string;
  dictamenSAR: string;
  fundamentoLegalISV: string;
  fundamentoLegalISR: string;
  formularioSARPrincipal: string;
  recomendacionOptimizacion: string;
}

export const DICCIONARIO_REGLAS_FISCALES: Record<TipoServicioFiscal, DetalleReglaFiscalServicio> = {
  'Formación académica acreditada (ej. convenios universitarios)': {
    servicio: 'Formación académica acreditada (ej. convenios universitarios)',
    gravaISV: false,
    tasaISV: 0,
    tasaISRRecomendada: 0, // Régimen educativo exento/convenio de reinversión institucional
    tasaMunicipalRecomendada: 0.10, // Tasa preferencial para educación
    retencionDocenteRecomendada: 12.5,
    badgeEstado: 'exento',
    etiquetaBreve: 'Exento de ISV (0%) • Convenio Universitario',
    dictamenSAR: 'Los programas de formación avalados mediante convenio universitario o educación formal reconocida están expresamente exonerados del 15% ISV según el Código Tributario y la Ley del ISV.',
    fundamentoLegalISV: 'Art. 15 numeral 1 de la Ley del Impuesto Sobre Ventas (Decreto 24-1964 y reformas): Exención formal a servicios de educación superior y técnica acreditada.',
    fundamentoLegalISR: 'Art. 7 literales c y d Ley del ISR: Beneficio tributario y deducibilidad plena en programas de cooperación académica y formación superior no mercantil.',
    formularioSARPrincipal: 'SAR-272 (Retenciones) • SAR-500 (Declaración Jurada ISR Exenta/Convenio)',
    recomendacionOptimizacion: 'Al no gravar 15% ISV, permite ofertar un precio neto al público más competitivo o capturar mayor margen operativo sin inflar el precio final de matrícula.',
  },

  'Capacitación profesional / Mentoría ejecutiva': {
    servicio: 'Capacitación profesional / Mentoría ejecutiva',
    gravaISV: true,
    tasaISV: 15,
    tasaISRRecomendada: 25,
    tasaMunicipalRecomendada: 0.20,
    retencionDocenteRecomendada: 12.5,
    badgeEstado: 'gravado_estandar',
    etiquetaBreve: 'Grava 15% ISV • Régimen Comercial Directo',
    dictamenSAR: 'Las capacitaciones profesionales privadas y mentorías ejecutivas no integradas a grados académicos oficiales se consideran prestaciones de servicios comerciales gravadas.',
    fundamentoLegalISV: 'Art. 1 y 15 Ley del ISV: Los cursos y mentorías técnicas no avaladas por el Consejo de Educación Superior gravan la alícuota general del 15%.',
    fundamentoLegalISR: 'Art. 22 Ley del ISR: Tarifa general del 25% sobre la utilidad operativa neta sujeta a deducción de costos docentes y operativos directos.',
    formularioSARPrincipal: 'SAR-221 (Declaración Mensual ISV) • SAR-500 (ISR Anual)',
    recomendacionOptimizacion: 'El 15% ISV debe facturarse con CAI transparente al estudiante o empresa patrocinante, quien puede utilizar dicho impuesto como Crédito Fiscal SAR.',
  },

  'Consultoría empresarial': {
    servicio: 'Consultoría empresarial',
    gravaISV: true,
    tasaISV: 15,
    tasaISRRecomendada: 25,
    tasaMunicipalRecomendada: 0.20,
    retencionDocenteRecomendada: 12.5,
    badgeEstado: 'gravado_optimo',
    etiquetaBreve: 'Grava 15% ISV • Servicios Profesionales B2B',
    dictamenSAR: 'Actividad calificada como servicio profesional gravado con 15% ISV. En contratos B2B con Grandes Contribuyentes, el pagador puede aplicar retenciones adicionales del 1% o 12.5%.',
    fundamentoLegalISV: 'Art. 1 y 15 Ley del ISV: Servicios técnicos, asesorías empresariales y honorarios profesionales.',
    fundamentoLegalISR: 'Art. 22 Ley del ISR: 25% sobre utilidad imponible. Deducibilidad plena de costos asociados (honorarios consultores, viáticos, plataformas).',
    formularioSARPrincipal: 'SAR-221 (Mensual) • Facturación CAI Fiscal con Rango Autorizado',
    recomendacionOptimizacion: 'Excelente para clientes corporativos corporaciones o pymes ya que el gasto es 100% deducible de su ISR y el ISV se acredita en sus cuentas fiscales.',
  },

  'Servicios educativos no acreditados (talleres, cursos libres)': {
    servicio: 'Servicios educativos no acreditados (talleres, cursos libres)',
    gravaISV: true,
    tasaISV: 15,
    tasaISRRecomendada: 25,
    tasaMunicipalRecomendada: 0.15,
    retencionDocenteRecomendada: 12.5,
    badgeEstado: 'gravado_estandar',
    etiquetaBreve: 'Grava 15% ISV • Educación No Formal / Libre',
    dictamenSAR: 'Talleres prácticos, seminarios y cursos cortos de extensión privada no formal están sujetos al cobro y traslado íntegro del 15% de Impuesto Sobre Ventas.',
    fundamentoLegalISV: 'Ley del ISV (Criterios Administrativos SAR para educación no formal y academias particulares).',
    fundamentoLegalISR: 'Art. 22 Ley del ISR: Tasa corporativa del 25% sobre la utilidad neta operacional.',
    formularioSARPrincipal: 'SAR-221 (ISV Mensual) • SAR-272 (Retención Docente Art. 50)',
    recomendacionOptimizacion: 'Conviene calcular con precisión el punto de equilibrio en base al precio sugerido neto, sumando el 15% ISV en la cotización comercial al alumno.',
  },

  'Intermediación laboral / servicios de RRHH': {
    servicio: 'Intermediación laboral / servicios de RRHH',
    gravaISV: true,
    tasaISV: 15,
    tasaISRRecomendada: 25,
    tasaMunicipalRecomendada: 0.20,
    retencionDocenteRecomendada: 12.5,
    badgeEstado: 'gravado_estandar',
    etiquetaBreve: 'Grava 15% ISV • Headhunting & Servicios Terciarios',
    dictamenSAR: 'Servicios mercantiles terciarios de selección de talento, reclutamiento y evaluación por competencias; sujetos al régimen general SAR.',
    fundamentoLegalISV: 'Ley del ISV: Prestación de servicios comerciales a terceros.',
    fundamentoLegalISR: 'Art. 22 Ley del ISR: 25% general sobre la renta neta gravable.',
    formularioSARPrincipal: 'SAR-221 (ISV) • SAR-500 (ISR Corporativo)',
    recomendacionOptimizacion: 'Al ser servicios B2B, la retención de clientes Gran Contribuyente (1% anticipo ISR o retención ISV) debe conciliarse contra el pago mensual.',
  },

  'Servicios administrativos / gestión de proyectos': {
    servicio: 'Servicios administrativos / gestión de proyectos',
    gravaISV: true,
    tasaISV: 15,
    tasaISRRecomendada: 25,
    tasaMunicipalRecomendada: 0.20,
    retencionDocenteRecomendada: 12.5,
    badgeEstado: 'gravado_estandar',
    etiquetaBreve: 'Grava 15% ISV • Gestión PMO & Servicios Profesionales',
    dictamenSAR: 'Honorarios por supervisión, consultoría de gestión de proyectos y servicios administrativos tercerizados gravados con alícuota ordinaria.',
    fundamentoLegalISV: 'Art. 1 Ley del ISV: Contratos de gestión profesional y administración comercial.',
    fundamentoLegalISR: 'Art. 22 Ley del ISR: 25% de impuesto corporativo sobre utilidad neta.',
    formularioSARPrincipal: 'SAR-221 (ISV) • SAR-272 (Retenciones)',
    recomendacionOptimizacion: 'Los costos directos de herramientas digitales y licencias de software son deducibles como insumos operativos ante la SAR.',
  },
};

export const LISTA_SERVICIOS_FISCALES: TipoServicioFiscal[] = [
  'Formación académica acreditada (ej. convenios universitarios)',
  'Capacitación profesional / Mentoría ejecutiva',
  'Consultoría empresarial',
  'Servicios educativos no acreditados (talleres, cursos libres)',
  'Intermediación laboral / servicios de RRHH',
  'Servicios administrativos / gestión de proyectos',
];

/**
 * Calcula el desglose fiscal integral y la ganancia neta post-impuestos
 * para un proyecto educativo en función del tipo de servicio fiscal seleccionado.
 */
export function calcularImpactoFiscalCompleto(
  proyecto: ProyectoEducativo,
  parametros?: ParametrosAjusteFiscal
): DesgloseFiscalCompleto {
  // 1. Determinar el Tipo de Servicio Fiscal
  const servicioFiscal: TipoServicioFiscal = 
    parametros?.servicioFiscal || 
    proyecto.servicioFiscal || 
    (obtenerReglaFiscalPorTipoProyecto(proyecto.tipoProyecto).servicio as TipoServicioFiscal) ||
    'Servicios educativos no acreditados (talleres, cursos libres)';

  const reglaFiscal = DICCIONARIO_REGLAS_FISCALES[servicioFiscal] || DICCIONARIO_REGLAS_FISCALES['Servicios educativos no acreditados (talleres, cursos libres)'];

  // 2. Determinar la base de alumnos (reales inscritos o simulados)
  const alumnosBase = parametros?.alumnosSimulados !== undefined
    ? Math.max(1, parametros.alumnosSimulados)
    : Math.max(1, Number(proyecto.alumnosFinal) || Number(proyecto.alumnosProyectados) || 4);

  // 3. Precios unitarios
  const precioSugeridoNetoAlumno = parametros?.precioNetoPersonalizado !== undefined && parametros.precioNetoPersonalizado > 0
    ? parametros.precioNetoPersonalizado
    : proyecto.precioSugeridoAlumno;

  const gravaISV = reglaFiscal.gravaISV;
  const tasaISV = gravaISV ? reglaFiscal.tasaISV : 0;
  const isvPorAlumno = gravaISV ? precioSugeridoNetoAlumno * (tasaISV / 100) : 0;
  const precioFacturadoPorAlumno = precioSugeridoNetoAlumno + isvPorAlumno;

  // 4. Ingresos agregados
  const ingresoNetoOperativo = alumnosBase * precioSugeridoNetoAlumno;
  const isvTotalTrasladarSAR = alumnosBase * isvPorAlumno;
  const ingresoBrutoFacturado = ingresoNetoOperativo + isvTotalTrasladarSAR;

  // 5. Gastos operativos deducibles
  const costoDocenteCalculado = proyecto.costoDocenteCalculado || (proyecto.horasClase * (proyecto.tarifaHoraDocente || 200));
  const costoZoom = proyecto.costoZoom || 0;
  const costoPapeleria = proyecto.costoPapeleria || 0;
  const gastosVarios = proyecto.gastosVarios || 0;
  const gastoTotalOperativo = costoDocenteCalculado + costoZoom + costoPapeleria + gastosVarios;

  // 6. Utilidad Operativa Pre-Impuestos (EBIT)
  const utilidadOperativaPreImpuestos = ingresoNetoOperativo - gastoTotalOperativo;
  const margenOperativoPreImpuestos = ingresoNetoOperativo > 0
    ? (utilidadOperativaPreImpuestos / ingresoNetoOperativo) * 100
    : 0;

  // 7. Impuesto de Industria y Comercio / Tasa Municipal (Plan de Arbitrios)
  const tasaMunicipalPct = parametros?.tasaMunicipalPersonalizada !== undefined
    ? parametros.tasaMunicipalPersonalizada
    : reglaFiscal.tasaMunicipalRecomendada;
  const tasaMunicipalMonto = ingresoBrutoFacturado * (tasaMunicipalPct / 100);

  // 8. Retención en la Fuente sobre Honorarios Docentes (Art. 50 Ley de ISR)
  const aplicaRetencionDocente = parametros?.aplicaRetencionDocente !== undefined
    ? parametros.aplicaRetencionDocente
    : true;
  const retencionDocentePct = aplicaRetencionDocente ? reglaFiscal.retencionDocenteRecomendada : 0;
  const retencionDocenteMonto = costoDocenteCalculado * (retencionDocentePct / 100);
  const honorarioNetoDocente = costoDocenteCalculado - retencionDocenteMonto;

  // 9. Base imponible e Impuesto Sobre la Renta (ISR Corporativo 25% o exento)
  // En Honduras el impuesto municipal pagado es deducible para efectos de ISR
  const baseImponibleBruta = Math.max(0, utilidadOperativaPreImpuestos - tasaMunicipalMonto);
  const tasaISRCorporativo = parametros?.tasaISRCorporativoPersonalizada !== undefined
    ? parametros.tasaISRCorporativoPersonalizada
    : reglaFiscal.tasaISRRecomendada;

  const isrCorporativoMonto = baseImponibleBruta * (tasaISRCorporativo / 100);

  // Aporte Solidario: 5% sobre la utilidad excedente si aplica (habitualmente si la renta imponible anual supera 1M)
  const incluirAporteSolidario = parametros?.incluirAporteSolidario ?? false;
  const aporteSolidarioMonto = (incluirAporteSolidario && baseImponibleBruta > 0)
    ? baseImponibleBruta * 0.05
    : 0;

  // 10. Total de impuestos directos cargados a la operación
  const totalImpuestosDirectos = tasaMunicipalMonto + isrCorporativoMonto + aporteSolidarioMonto;

  // 11. GANANCIA NETA POST-IMPUESTOS (Resultado Final para SUMMIT)
  const gananciaNetaPostImpuestos = utilidadOperativaPreImpuestos - totalImpuestosDirectos;
  const margenNetoPostImpuestos = ingresoNetoOperativo > 0
    ? (gananciaNetaPostImpuestos / ingresoNetoOperativo) * 100
    : 0;

  const gananciaNetaPorAlumno = alumnosBase > 0
    ? gananciaNetaPostImpuestos / alumnosBase
    : 0;

  // 12. Carga tributaria efectiva directa
  const cargaTributariaEfectivaPct = utilidadOperativaPreImpuestos > 0
    ? (totalImpuestosDirectos / utilidadOperativaPreImpuestos) * 100
    : 0;

  // 13. Flujos consolidados a transferir a entidades fiscales
  const flujoTotalEnterarSAR = isvTotalTrasladarSAR + isrCorporativoMonto + aporteSolidarioMonto + retencionDocenteMonto;
  const flujoTotalAlcaldia = tasaMunicipalMonto;
  const flujoTotalObligacionesFiscales = flujoTotalEnterarSAR + flujoTotalAlcaldia;

  return {
    tipoServicio: servicioFiscal,
    gravaISV,
    tasaISV,
    precioSugeridoNetoAlumno,
    isvPorAlumno,
    precioFacturadoPorAlumno,
    alumnosBase,
    ingresoBrutoFacturado,
    isvTotalTrasladarSAR,
    ingresoNetoOperativo,
    costoDocenteCalculado,
    costoZoom,
    costoPapeleria,
    gastosVarios,
    gastoTotalOperativo,
    utilidadOperativaPreImpuestos,
    margenOperativoPreImpuestos,
    tasaMunicipalPct,
    tasaMunicipalMonto,
    baseImponibleISR: baseImponibleBruta,
    tasaISRCorporativo,
    isrCorporativoMonto,
    aporteSolidarioMonto,
    aplicaRetencionDocente,
    retencionDocentePct,
    retencionDocenteMonto,
    honorarioNetoDocente,
    totalImpuestosDirectos,
    gananciaNetaPostImpuestos,
    margenNetoPostImpuestos,
    gananciaNetaPorAlumno,
    cargaTributariaEfectivaPct,
    flujoTotalEnterarSAR,
    flujoTotalAlcaldia,
    flujoTotalObligacionesFiscales,
    dictamenSAR: reglaFiscal.dictamenSAR,
    fundamentoLegalISV: reglaFiscal.fundamentoLegalISV,
    fundamentoLegalISR: reglaFiscal.fundamentoLegalISR,
    formularioSARPrincipal: reglaFiscal.formularioSARPrincipal,
    recomendacionOptimizacion: reglaFiscal.recomendacionOptimizacion,
    badgeEstado: reglaFiscal.badgeEstado,
  };
}
