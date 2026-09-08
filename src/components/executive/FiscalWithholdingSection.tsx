import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Receipt, 
  Calculator, 
  Check, 
  Copy, 
  AlertCircle, 
  Info, 
  FileText, 
  Users, 
  Sparkles, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  BookOpen, 
  Percent,
  Download,
  DollarSign
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { INSTITUCION_INFO } from '../../utils/institutionalInfo';
import { formatearMoneda } from '../../utils/calculations';
import { obtenerReglaFiscalPorTipoProyecto } from '../../utils/isvRules';

interface FiscalWithholdingSectionProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  mesSeleccionado: string;
  onNotificar?: (mensaje: string) => void;
}

// Clasificación unificada de tipos de programas educativos y su tratamiento fiscal ante el SAR
export interface DefinicionProgramaFiscal {
  id: string;
  nombre: string;
  esExentoISV: boolean;
  tasaISV: number;
  tasaISRDocenteEstandar: number; // 12.5% con RTN registrado
  baseLegalISV: string;
  baseLegalISR: string;
  descripcion: string;
  formularioISV: string;
  formularioISR: string;
}

export const PROGRAMAS_EDUCATIVOS_FISCALES: DefinicionProgramaFiscal[] = [
  {
    id: 'DIPLOMADO',
    nombre: 'Diplomado / Formación Acreditada',
    esExentoISV: true,
    tasaISV: 0,
    tasaISRDocenteEstandar: 12.5,
    baseLegalISV: 'Art. 15 Numeral 1 Ley del ISV (Decreto 24-1964): Exención expresa a programas de educación superior y técnica formal avalada.',
    baseLegalISR: 'Art. 50 Ley del Impuesto Sobre la Renta: Retención del 12.5% en concepto de honorarios profesionales sobre servicios docentes.',
    descripcion: 'Programas de alta especialización con carga horaria estructurada y convenio institucional. Exonerado 100% de ISV.',
    formularioISV: 'SAR-221 (Ventas Exentas)',
    formularioISR: 'SAR-272 (Retención Docente 12.5%)',
  },
  {
    id: 'CURSO',
    nombre: 'Curso Profesional / Especialización',
    esExentoISV: false,
    tasaISV: 15,
    tasaISRDocenteEstandar: 12.5,
    baseLegalISV: 'Art. 1 y 15 Ley del ISV: Alícuota general del 15% sobre servicios privados de capacitación profesional no universitaria.',
    baseLegalISR: 'Art. 50 Ley de ISR: Agente de Retención aplica 12.5% sobre el honorario facturado por el facilitador.',
    descripcion: 'Cursos técnicos y de actualización para profesionales independientes o empresas.',
    formularioISV: 'SAR-221 (Ventas Gravadas 15%)',
    formularioISR: 'SAR-272 (Retención Docente 12.5%)',
  },
  {
    id: 'TALLER',
    nombre: 'Taller Práctico / Workshop',
    esExentoISV: false,
    tasaISV: 15,
    tasaISRDocenteEstandar: 12.5,
    baseLegalISV: 'Art. 1 Ley del ISV: Educación no formal y talleres prácticos de corta duración sujetos al 15% de ISV.',
    baseLegalISR: 'Art. 50 Ley de ISR: Retención obligatoria del 12.5% por servicios profesionales prestados en territorio nacional.',
    descripcion: 'Entrenamientos cortos orientados a habilidades técnicas puntuales.',
    formularioISV: 'SAR-221 (Ventas Gravadas 15%)',
    formularioISR: 'SAR-272 (Retención Docente 12.5%)',
  },
  {
    id: 'BOOTCAMP',
    nombre: 'Bootcamp Intensivo',
    esExentoISV: false,
    tasaISV: 15,
    tasaISRDocenteEstandar: 12.5,
    baseLegalISV: 'Ley del ISV: Prestación de servicios de inmersión técnica no incorporada a currículo de educación formal.',
    baseLegalISR: 'Art. 50 Ley de ISR: Retención del 12.5% sobre honorarios docentes pagados a residentes.',
    descripcion: 'Programas intensivos de desarrollo de software, análisis de datos y competencias tecnológicas.',
    formularioISV: 'SAR-221 (Ventas Gravadas 15%)',
    formularioISR: 'SAR-272 (Retención Docente 12.5%)',
  },
  {
    id: 'SEMINARIO',
    nombre: 'Seminario / Jornada de Actualización',
    esExentoISV: false,
    tasaISV: 15,
    tasaISRDocenteEstandar: 12.5,
    baseLegalISV: 'Ley del ISV: Eventos corporativos y seminarios de actualización empresarial gravados al 15%.',
    baseLegalISR: 'Art. 50 Ley de ISR: Retención del 12.5% a expositores y conferencistas independientes.',
    descripcion: 'Eventos de un día o fin de semana orientados a directivos y equipos corporativos.',
    formularioISV: 'SAR-221 (Ventas Gravadas 15%)',
    formularioISR: 'SAR-272 (Retención Docente 12.5%)',
  },
  {
    id: 'MASTERCLASS',
    nombre: 'Masterclass Ejecutiva',
    esExentoISV: false,
    tasaISV: 15,
    tasaISRDocenteEstandar: 12.5,
    baseLegalISV: 'Ley del ISV: Clases magistrales y asesorías especializadas de alta gerencia sujetas al 15% ISV.',
    baseLegalISR: 'Art. 50 Ley de ISR: Retención del 12.5% de ISR sobre honorarios de facilitadores principales.',
    descripcion: 'Sesiones magistrales con expertos de la industria dirigidas a tomadores de decisiones.',
    formularioISV: 'SAR-221 (Ventas Gravadas 15%)',
    formularioISR: 'SAR-272 (Retención Docente 12.5%)',
  },
  {
    id: 'CONSULTORIA',
    nombre: 'Consultoría Empresarial / B2B',
    esExentoISV: false,
    tasaISV: 15,
    tasaISRDocenteEstandar: 12.5,
    baseLegalISV: 'Art. 1 y 15 Ley del ISV: Servicios profesionales y consultorías comerciales gravadas al 15%.',
    baseLegalISR: 'Art. 50 Ley de ISR: Retención de 12.5% a consultores individuales (o 1% si es Gran Contribuyente).',
    descripcion: 'Asesorías directas para transformación digital, optimización operativa y finanzas.',
    formularioISV: 'SAR-221 (Ventas Gravadas 15%)',
    formularioISR: 'SAR-272 (Retención Honorarios 12.5%)',
  },
];

export const FiscalWithholdingSection: React.FC<FiscalWithholdingSectionProps> = ({
  proyectos,
  moneda,
  mesSeleccionado,
  onNotificar,
}) => {
  const [tabInterna, setTabInterna] = useState<'cartera' | 'simulador'>('cartera');
  const [copiado, setCopiado] = useState(false);

  // Estados del Simulador Interactivo
  const [tipoProgramaSimulado, setTipoProgramaSimulado] = useState<string>('DIPLOMADO');
  const [precioMatricula, setPrecioMatricula] = useState<number>(3500);
  const [cantidadAlumnos, setCantidadAlumnos] = useState<number>(12);
  const [honorarioDocenteBruto, setHonorarioDocenteBruto] = useState<number>(12000);
  const [condicionDocente, setCondicionDocente] = useState<'nacional_con_rtn' | 'extranjero_no_domiciliado' | 'empresa_con_constancia'>('nacional_con_rtn');
  const [tipoCliente, setTipoCliente] = useState<'particular' | 'empresa_agente_retencion'>('particular');
  const [rtnDocenteSimulado, setRtnDocenteSimulado] = useState<string>('05011988123456');
  const [nombreDocenteSimulado, setNombreDocenteSimulado] = useState<string>('Lic. Carlos Alberto Mendoza');

  // Definición del tipo seleccionado en el simulador
  const programaSimuladoDef = useMemo(() => {
    return (
      PROGRAMAS_EDUCATIVOS_FISCALES.find((p) => p.id === tipoProgramaSimulado) ||
      PROGRAMAS_EDUCATIVOS_FISCALES[0]
    );
  }, [tipoProgramaSimulado]);

  // Cálculos del Simulador Interactivo
  const calculoSimulador = useMemo(() => {
    const totalIngresoNeto = Math.max(0, precioMatricula * cantidadAlumnos);
    const tasaISV = programaSimuladoDef.esExentoISV ? 0 : 15;
    const isvTotal = totalIngresoNeto * (tasaISV / 100);
    const totalFacturadoBruto = totalIngresoNeto + isvTotal;

    // Retención de ISR sobre honorarios docentes según condición
    let tasaISRDocente = 12.5; // Por defecto Art. 50 Ley ISR
    let descripCondicion = 'Docente Nacional con RTN (12.5% ISR Art. 50)';
    if (condicionDocente === 'extranjero_no_domiciliado') {
      tasaISRDocente = 25.0; // Art. 5 Ley ISR No Domiciliados
      descripCondicion = 'Docente No Domiciliado (25.0% ISR Art. 5)';
    } else if (condicionDocente === 'empresa_con_constancia') {
      tasaISRDocente = 0.0; // Con constancia SAR de pagos a cuenta
      descripCondicion = 'Persona Jurídica con Constancia Pagos a Cuenta SAR (0%)';
    }

    const retencionISRDocente = honorarioDocenteBruto * (tasaISRDocente / 100);
    const honorarioLiquidoDocente = Math.max(0, honorarioDocenteBruto - retencionISRDocente);

    // Retención del cliente si es Agente de Retención / Gran Contribuyente
    // Retiene 1% de anticipo de ISR si la factura es mayor a L. 1,000 según Acuerdo SAR
    let retencionSufridaClienteISR = 0;
    let retencionSufridaClienteISV = 0;
    if (tipoCliente === 'empresa_agente_retencion' && totalFacturadoBruto > 1000) {
      retencionSufridaClienteISR = totalIngresoNeto * 0.01; // 1% anticipo ISR
      if (!programaSimuladoDef.esExentoISV) {
        // En servicios gravados con ISV, las empresas designadas retienen habitualmente el 100% o porcentaje del ISV
        retencionSufridaClienteISV = isvTotal;
      }
    }

    const totalRetenidoSufrido = retencionSufridaClienteISR + retencionSufridaClienteISV;
    const cobroEfectivoRecibido = totalFacturadoBruto - totalRetenidoSufrido;

    // Ahorro fiscal generado al estudiante/cliente en diplomados
    const ahorroFiscalISV = programaSimuladoDef.esExentoISV
      ? totalIngresoNeto * 0.15
      : 0;

    return {
      totalIngresoNeto,
      tasaISV,
      isvTotal,
      totalFacturadoBruto,
      tasaISRDocente,
      descripCondicion,
      retencionISRDocente,
      honorarioLiquidoDocente,
      retencionSufridaClienteISR,
      retencionSufridaClienteISV,
      totalRetenidoSufrido,
      cobroEfectivoRecibido,
      ahorroFiscalISV,
    };
  }, [
    precioMatricula,
    cantidadAlumnos,
    honorarioDocenteBruto,
    condicionDocente,
    tipoCliente,
    programaSimuladoDef,
  ]);

  // Análisis y cálculo automático sobre la cartera de proyectos
  const carteraAnalisis = useMemo(() => {
    // Clasificar los proyectos por categoría de programa
    const grupos: Record<
      string,
      {
        tipoDef: DefinicionProgramaFiscal;
        proyectos: ProyectoEducativo[];
        conteo: number;
        ingresoNetoTotal: number;
        isvTotal: number;
        costoDocenteTotal: number;
        retencionISRDocenteTotal: number;
        honorarioLiquidoTotal: number;
        ahorroISVTotal: number;
      }
    > = {};

    // Inicializar grupos
    PROGRAMAS_EDUCATIVOS_FISCALES.forEach((def) => {
      grupos[def.id] = {
        tipoDef: def,
        proyectos: [],
        conteo: 0,
        ingresoNetoTotal: 0,
        isvTotal: 0,
        costoDocenteTotal: 0,
        retencionISRDocenteTotal: 0,
        honorarioLiquidoTotal: 0,
        ahorroISVTotal: 0,
      };
    });

    // Mapear cada proyecto
    proyectos.forEach((p) => {
      const tipoLower = (p.tipoProyecto || '').toLowerCase();
      let matchId = 'CURSO';

      if (
        tipoLower.includes('diplomad') ||
        tipoLower.includes('acreditad') ||
        tipoLower.includes('convenio')
      ) {
        matchId = 'DIPLOMADO';
      } else if (tipoLower.includes('taller') || tipoLower.includes('workshop')) {
        matchId = 'TALLER';
      } else if (tipoLower.includes('bootcamp')) {
        matchId = 'BOOTCAMP';
      } else if (tipoLower.includes('seminario') || tipoLower.includes('conferencia')) {
        matchId = 'SEMINARIO';
      } else if (tipoLower.includes('masterclass') || tipoLower.includes('mentor')) {
        matchId = 'MASTERCLASS';
      } else if (tipoLower.includes('consultor')) {
        matchId = 'CONSULTORIA';
      }

      const grupo = grupos[matchId] || grupos['CURSO'];
      grupo.proyectos.push(p);
      grupo.conteo += 1;

      const alumnos = Number(p.alumnosFinal) || Number(p.alumnosProyectados) || 4;
      const ingresoNeto = (p.precioSugeridoAlumno || 0) * alumnos;
      grupo.ingresoNetoTotal += ingresoNeto;

      // ISV según regla del programa
      const esExento = grupo.tipoDef.esExentoISV || p.aplicaISV === false;
      const isv = esExento ? 0 : ingresoNeto * 0.15;
      grupo.isvTotal += isv;

      if (esExento) {
        grupo.ahorroISVTotal += ingresoNeto * 0.15;
      }

      // Costo docente y retención ISR (12.5% oficial SAR-272)
      const costoDoc = p.costoDocenteCalculado || (p.horasClase * (p.tarifaHoraDocente || 200));
      grupo.costoDocenteTotal += costoDoc;
      const retencionISR = costoDoc * 0.125;
      grupo.retencionISRDocenteTotal += retencionISR;
      grupo.honorarioLiquidoTotal += costoDoc - retencionISR;
    });

    // Totales de la cartera
    let granTotalIngresos = 0;
    let granTotalISV = 0;
    let granTotalCostoDocente = 0;
    let granTotalRetencionISR = 0;
    let granTotalHonorarioLiquido = 0;
    let granTotalAhorroISV = 0;

    Object.values(grupos).forEach((g) => {
      granTotalIngresos += g.ingresoNetoTotal;
      granTotalISV += g.isvTotal;
      granTotalCostoDocente += g.costoDocenteTotal;
      granTotalRetencionISR += g.retencionISRDocenteTotal;
      granTotalHonorarioLiquido += g.honorarioLiquidoTotal;
      granTotalAhorroISV += g.ahorroISVTotal;
    });

    return {
      grupos: Object.values(grupos).filter((g) => g.conteo > 0),
      todosGrupos: Object.values(grupos),
      totales: {
        proyectosConteo: proyectos.length,
        granTotalIngresos,
        granTotalISV,
        granTotalCostoDocente,
        granTotalRetencionISR,
        granTotalHonorarioLiquido,
        granTotalAhorroISV,
      },
    };
  }, [proyectos]);

  // Copiar Comprobante de Retención Virtual al portapapeles
  const handleCopiarComprobante = () => {
    const texto = `=====================================================
COMPROBANTE OFICIAL DE RETENCIÓN DE IMPUESTOS (SAR-272)
AGENTE DE RETENCIÓN: ${INSTITUCION_INFO.razonSocial}
RTN REGISTRADO: ${INSTITUCION_INFO.rtn}
DOMICILIO: ${INSTITUCION_INFO.direccion}
=====================================================
Fecha de Emisión: ${new Date().toLocaleDateString('es-HN')}
Programa Educativo: ${programaSimuladoDef.nombre}
Tipo de Actividad: ${programaSimuladoDef.descripcion}

DATOS DEL SUJETO RETENIDO (DOCENTE / FACILITADOR):
Nombre: ${nombreDocenteSimulado}
RTN Docente: ${rtnDocenteSimulado}
Condición Fiscal: ${calculoSimulador.descripCondicion}

LIQUIDACIÓN DE HONORARIOS Y RETENCIÓN DE ISR:
- Honorario Bruto Pactado: ${formatearMoneda(honorarioDocenteBruto, moneda)}
- Tasa de Retención Aplicada: ${calculoSimulador.tasaISRDocente}% (Art. 50 Ley ISR)
- IMPUESTO RETENIDO (ISR): ${formatearMoneda(calculoSimulador.retencionISRDocente, moneda)}
- VALOR NETO A DESEMBOLSAR AL DOCENTE: ${formatearMoneda(calculoSimulador.honorarioLiquidoDocente, moneda)}

TRATAMIENTO DE IMPUESTO SOBRE VENTAS (ISV):
- Condición ISV del Programa: ${programaSimuladoDef.esExentoISV ? 'EXENTO 0% (Art. 15 Numeral 1 Ley ISV)' : 'GRAVADO 15% (Ley del ISV)'}
- ISV Trasladado / Facturado: ${formatearMoneda(calculoSimulador.isvTotal, moneda)}

Base Legal: ${programaSimuladoDef.baseLegalISR}
Constancia emitida para efectos de deducción y liquidación formal ante el SAR.
=====================================================`;

    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true);
      onNotificar?.('📋 Comprobante de retención copiado al portapapeles con éxito');
      setTimeout(() => setCopiado(false), 3000);
    });
  };

  return (
    <section 
      id="seccion-retenciones-fiscales-rtn" 
      className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all"
    >
      {/* Encabezado Principal con Respaldo del RTN Institucional */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white p-5 sm:p-6 border-b border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                Agente de Retención SAR Oficial
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-extrabold bg-amber-400 text-slate-950 border border-amber-300 shadow-2xs">
                RTN: {INSTITUCION_INFO.rtn}
              </span>
            </div>

            <h3 className="text-base sm:text-xl font-black text-white tracking-tight">
              Cálculo Automático de Retenciones de Impuestos (ISV / ISR)
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Liquidación y retención en la fuente aplicada a programas educativos según normativa del SAR en Honduras. 
              <strong> {INSTITUCION_INFO.razonSocial}</strong> actúa como Agente de Retención legal acreditado en San Pedro Sula.
            </p>
          </div>

          {/* Selector de Pestañas de la Sección */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setTabInterna('cartera')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                tabInterna === 'cartera'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Retenciones de Cartera</span>
            </button>
            <button
              type="button"
              onClick={() => setTabInterna('simulador')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                tabInterna === 'simulador'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Simulador por Tipo de Programa</span>
            </button>
          </div>

        </div>

        {/* Barra de Datos Registrados del Sistema */}
        <div className="mt-4 pt-3.5 border-t border-slate-700/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-semibold">Razón Social Registrada:</span>
            <span className="font-bold text-white truncate block">{INSTITUCION_INFO.razonSocial}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-semibold">Domicilio Fiscal:</span>
            <span className="font-semibold text-slate-200 truncate block">{INSTITUCION_INFO.direccion}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-semibold">Retención ISR Docente:</span>
            <span className="font-mono font-bold text-emerald-400">12.5% (Art. 50 Ley de ISR)</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-semibold">Exención Diplomados:</span>
            <span className="font-mono font-bold text-blue-400">0% ISV (Art. 15 Numeral 1)</span>
          </div>
        </div>
      </div>

      {/* CONTENIDO 1: RETENCIONES DE LA CARTERA DEL PERIODO */}
      {tabInterna === 'cartera' && (
        <div className="p-5 sm:p-6 space-y-6 animate-fadeIn">
          
          {/* Tarjetas Resumen de Retenciones Acumuladas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            
            <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  Retención ISR Docente (12.5%)
                </span>
                <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900">
                  SAR-272
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-800 font-mono mt-2">
                {formatearMoneda(carteraAnalisis.totales.granTotalRetencionISR, moneda)}
              </div>
              <p className="text-[11px] text-emerald-700 mt-1">
                A enterar al SAR antes del 10 del mes siguiente
              </p>
            </div>

            <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
                  Honorarios Netos a Pagar
                </span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-blue-900 font-mono mt-2">
                {formatearMoneda(carteraAnalisis.totales.granTotalHonorarioLiquido, moneda)}
              </div>
              <p className="text-[11px] text-blue-700 mt-1">
                Desembolso líquido post-retención de ISR
              </p>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                  ISV Trasladado (15%)
                </span>
                <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-950">
                  SAR-221
                </span>
              </div>
              <div className="text-2xl font-black text-amber-800 font-mono mt-2">
                {formatearMoneda(carteraAnalisis.totales.granTotalISV, moneda)}
              </div>
              <p className="text-[11px] text-amber-700 mt-1">
                Sobre programas gravados (cursos libres/talleres)
              </p>
            </div>

            <div className="bg-purple-50/70 border border-purple-200 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">
                  Ahorro Fiscal Exención ISV
                </span>
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-purple-800 font-mono mt-2">
                {formatearMoneda(carteraAnalisis.totales.granTotalAhorroISV, moneda)}
              </div>
              <p className="text-[11px] text-purple-700 mt-1">
                Exoneración legal en diplomados (Art. 15)
              </p>
            </div>

          </div>

          {/* Tabla de Liquidación por Tipo de Programa Educativo */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Desglose de Retenciones Tributarias por Tipo de Programa ({proyectos.length} Proyectos)
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Agente de Retención: <strong>{INSTITUCION_INFO.razonSocial}</strong> • RTN: <strong className="font-mono text-slate-800">{INSTITUCION_INFO.rtn}</strong>
              </span>
            </div>

            {carteraAnalisis.grupos.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No hay proyectos en la cartera seleccionada para calcular retenciones.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Tipo de Programa Educativo</th>
                      <th className="py-2.5 px-3 text-center">Cursos</th>
                      <th className="py-2.5 px-3 text-right">Facturación / Base</th>
                      <th className="py-2.5 px-3 text-center">Régimen ISV</th>
                      <th className="py-2.5 px-3 text-right">ISV Calculado</th>
                      <th className="py-2.5 px-3 text-right">Honorario Docente Bruto</th>
                      <th className="py-2.5 px-3 text-right text-emerald-800 bg-emerald-50/50">
                        Retención ISR (12.5%)
                      </th>
                      <th className="py-2.5 px-3 text-right text-blue-900 bg-blue-50/50">
                        Líquido a Pagar
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {carteraAnalisis.grupos.map((grupo) => (
                      <tr key={grupo.tipoDef.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{grupo.tipoDef.nombre}</div>
                          <span className="text-[10px] text-slate-500 leading-tight block">
                            {grupo.tipoDef.descripcion}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-700">
                          {grupo.conteo}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-medium text-slate-800">
                          {formatearMoneda(grupo.ingresoNetoTotal, moneda)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            grupo.tipoDef.esExentoISV 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {grupo.tipoDef.esExentoISV ? '0% Exento (Art. 15)' : '15% Gravado'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-medium">
                          {grupo.isvTotal > 0 ? (
                            <span className="text-amber-800">{formatearMoneda(grupo.isvTotal, moneda)}</span>
                          ) : (
                            <span className="text-emerald-700 font-bold">L 0.00 (Exento)</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          {formatearMoneda(grupo.costoDocenteTotal, moneda)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800 bg-emerald-50/30">
                          {formatearMoneda(grupo.retencionISRDocenteTotal, moneda)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-blue-900 bg-blue-50/30">
                          {formatearMoneda(grupo.honorarioLiquidoTotal, moneda)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-300">
                    <tr>
                      <td className="py-2.5 px-3 uppercase text-[11px]">Totales Consolidados</td>
                      <td className="py-2.5 px-3 text-center">{carteraAnalisis.totales.proyectosConteo}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatearMoneda(carteraAnalisis.totales.granTotalIngresos, moneda)}</td>
                      <td className="py-2.5 px-3 text-center text-[10px] text-slate-600">ISV / SAR-221</td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-800">{formatearMoneda(carteraAnalisis.totales.granTotalISV, moneda)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatearMoneda(carteraAnalisis.totales.granTotalCostoDocente, moneda)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-800 bg-emerald-100/60">{formatearMoneda(carteraAnalisis.totales.granTotalRetencionISR, moneda)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-blue-900 bg-blue-100/60">{formatearMoneda(carteraAnalisis.totales.granTotalHonorarioLiquido, moneda)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Nota de Procedimiento Operativo Tributario */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-slate-900">Procedimiento Legal ante el SAR (Honduras):</strong>
              <p className="leading-relaxed">
                Por disposición del Artículo 50 de la Ley del Impuesto Sobre la Renta y Decreto 24-1964, 
                <strong> Summit Impulsa S. de R.L. (RTN: 05019026435770)</strong> debe retener el 12.5% de todo pago por honorarios profesionales efectuado a docentes con RTN registrado. 
                Dicho valor retenido debe enterarse mediante el formulario <strong>SAR-272</strong> dentro de los primeros 10 días calendario del mes siguiente, entregando al facilitador la correspondiente Constancia Oficial de Retención.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* CONTENIDO 2: SIMULADOR INTERACTIVO POR TIPO DE PROGRAMA */}
      {tabInterna === 'simulador' && (
        <div className="p-5 sm:p-6 space-y-6 animate-fadeIn">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Panel de Parámetros de Entrada */}
            <div className="lg:col-span-6 space-y-4">
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-emerald-600" />
                    Parámetros del Programa Educativo
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    Emisor: RTN {INSTITUCION_INFO.rtn}
                  </span>
                </div>

                {/* Selector de Tipo de Programa */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipo de Programa Educativo:
                  </label>
                  <select
                    value={tipoProgramaSimulado}
                    onChange={(e) => setTipoProgramaSimulado(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {PROGRAMAS_EDUCATIVOS_FISCALES.map((prog) => (
                      <option key={prog.id} value={prog.id}>
                        {prog.nombre} — {prog.esExentoISV ? '0% ISV (Exento)' : '15% ISV (Gravado)'}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {programaSimuladoDef.baseLegalISV}
                  </p>
                </div>

                {/* Precios y Alumnos */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Precio Matrícula / Alumno:
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                        {moneda === 'USD' ? '$' : 'L.'}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={precioMatricula}
                        onChange={(e) => setPrecioMatricula(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Alumnos Proyectados:
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={cantidadAlumnos}
                      onChange={(e) => setCantidadAlumnos(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Honorarios del Docente / Facilitador */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Honorario Bruto del Docente / Facilitador:
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                      {moneda === 'USD' ? '$' : 'L.'}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={honorarioDocenteBruto}
                      onChange={(e) => setHonorarioDocenteBruto(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Condición Fiscal del Docente */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Condición Fiscal del Docente (Sujeto Pasivo Retenido):
                  </label>
                  <select
                    value={condicionDocente}
                    onChange={(e) => setCondicionDocente(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="nacional_con_rtn">
                      Docente Nacional con RTN Válido (12.5% Retención ISR - Art. 50 Ley de ISR)
                    </option>
                    <option value="extranjero_no_domiciliado">
                      Docente Extranjero No Domiciliado (25.0% Retención ISR - Art. 5 Ley de ISR)
                    </option>
                    <option value="empresa_con_constancia">
                      Persona Jurídica con Constancia de Pagos a Cuenta SAR (0% Retención Directa)
                    </option>
                  </select>
                </div>

                {/* Tipo de Cliente */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Perfil del Alumno / Cliente Contratante:
                  </label>
                  <select
                    value={tipoCliente}
                    onChange={(e) => setTipoCliente(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="particular">
                      Alumno Particular / Consumidor Final (Sin retención aplicada a SUMMIT)
                    </option>
                    <option value="empresa_agente_retencion">
                      Empresa Gran Contribuyente / Agente SAR (Retiene 1% anticipo ISR)
                    </option>
                  </select>
                </div>

                {/* Datos Opcionales del Docente para el Comprobante */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Nombre del Docente:
                    </label>
                    <input
                      type="text"
                      value={nombreDocenteSimulado}
                      onChange={(e) => setNombreDocenteSimulado(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      RTN del Docente (14 dígitos):
                    </label>
                    <input
                      type="text"
                      maxLength={14}
                      value={rtnDocenteSimulado}
                      onChange={(e) => setRtnDocenteSimulado(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>

              </div>

            </div>

            {/* Panel de Resultados y Comprobante Oficial Virtual */}
            <div className="lg:col-span-6 space-y-4">
              
              {/* Tarjeta de Liquidación de Retenciones */}
              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 shadow-md space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Liquidación Tributaria Instantánea
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    SAR Agente Nº {INSTITUCION_INFO.rtn}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Régimen ISV:</span>
                    <span className={`text-xs font-black block mt-0.5 ${
                      programaSimuladoDef.esExentoISV ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {programaSimuladoDef.esExentoISV ? '0% EXENTO (Art. 15 Numeral 1)' : '15% GRAVADO (SAR-221)'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-200 mt-1 block">
                      ISV Trasladado: {formatearMoneda(calculoSimulador.isvTotal, moneda)}
                    </span>
                  </div>

                  <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Retención ISR Docente:</span>
                    <span className="text-xs font-black text-emerald-300 block mt-0.5">
                      {calculoSimulador.tasaISRDocente}% (Art. 50 Ley de ISR)
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 mt-1 block font-bold">
                      Retenido: -{formatearMoneda(calculoSimulador.retencionISRDocente, moneda)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-semibold">
                    Pago Líquido al Docente (Post-Retención):
                  </span>
                  <span className="text-base font-black font-mono text-white">
                    {formatearMoneda(calculoSimulador.honorarioLiquidoDocente, moneda)}
                  </span>
                </div>

                {programaSimuladoDef.esExentoISV && (
                  <div className="bg-emerald-950/40 border border-emerald-800/60 p-2 rounded-lg text-[11px] text-emerald-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong>Beneficio Fiscal:</strong> Se genera un ahorro de <strong>{formatearMoneda(calculoSimulador.ahorroFiscalISV, moneda)}</strong> para los estudiantes en este Diplomado.
                    </span>
                  </div>
                )}
              </div>

              {/* Vista Previa del Comprobante de Retención SAR-272 */}
              <div className="bg-amber-50/50 rounded-xl border border-amber-200/90 p-4 shadow-2xs relative">
                <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-800" />
                    <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                      Comprobante Oficial de Retención (SAR-272)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopiarComprobante}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-200/80 hover:bg-amber-300 text-amber-900 transition-colors shadow-2xs cursor-pointer"
                    title="Copiar comprobante para control o envío al docente"
                  >
                    {copiado ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiado ? '¡Copiado!' : 'Copiar Comprobante'}</span>
                  </button>
                </div>

                <div className="mt-3 font-mono text-[11px] text-slate-800 space-y-1.5 bg-white p-3 rounded-lg border border-amber-200/80 shadow-2xs leading-relaxed">
                  <div className="text-center font-bold text-slate-900 border-b border-slate-200 pb-1.5">
                    {INSTITUCION_INFO.razonSocial}
                    <div className="text-[10px] text-slate-600 font-normal">
                      RTN: <strong className="text-slate-900">{INSTITUCION_INFO.rtn}</strong> • {INSTITUCION_INFO.direccion}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-[10px]">
                    <div>
                      <span className="text-slate-500 block">Docente / Facilitador:</span>
                      <strong className="text-slate-900">{nombreDocenteSimulado}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">RTN Sujeto Pasivo:</span>
                      <strong className="text-slate-900">{rtnDocenteSimulado}</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-dashed border-slate-200 space-y-1 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Honorario Profesional Bruto:</span>
                      <span className="font-bold">{formatearMoneda(honorarioDocenteBruto, moneda)}</span>
                    </div>
                    <div className="flex justify-between text-rose-700 font-bold">
                      <span>(-) Retención ISR ({calculoSimulador.tasaISRDocente}% Art. 50):</span>
                      <span>-{formatearMoneda(calculoSimulador.retencionISRDocente, moneda)}</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-black border-t border-slate-300 pt-1 text-[11px]">
                      <span>(=) Valor Líquido a Pagar al Docente:</span>
                      <span className="text-blue-900">{formatearMoneda(calculoSimulador.honorarioLiquidoDocente, moneda)}</span>
                    </div>
                  </div>

                  <div className="mt-2 text-[9px] text-slate-500 italic border-t border-slate-100 pt-1">
                    * El valor retenido de {formatearMoneda(calculoSimulador.retencionISRDocente, moneda)} será enterado al SAR mediante declaración SAR-272 por {INSTITUCION_INFO.razonSocial}.
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      )}

    </section>
  );
};
