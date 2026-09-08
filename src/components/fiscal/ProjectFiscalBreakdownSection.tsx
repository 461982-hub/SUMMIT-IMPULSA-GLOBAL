import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Building2, 
  GraduationCap, 
  Briefcase, 
  Users, 
  BookOpen, 
  Award,
  Sliders, 
  FileText, 
  Scale, 
  ArrowRight,
  Sparkles,
  Info,
  Save,
  Check
} from 'lucide-react';
import { ProyectoEducativo, Moneda, TipoServicioFiscal, HistorialCambioProyecto } from '../../types';
import { formatearMoneda } from '../../utils/calculations';
import { 
  calcularImpactoFiscalCompleto, 
  LISTA_SERVICIOS_FISCALES, 
  DICCIONARIO_REGLAS_FISCALES 
} from '../../utils/taxCalculations';

interface ProjectFiscalBreakdownSectionProps {
  proyecto: ProyectoEducativo;
  moneda: Moneda;
  onActualizarProyecto?: (proyectoActualizado: ProyectoEducativo) => void;
  onAgregarHistorial?: (proyectoId: string, entrada: HistorialCambioProyecto) => void;
}

export const ProjectFiscalBreakdownSection: React.FC<ProjectFiscalBreakdownSectionProps> = ({
  proyecto,
  moneda,
  onActualizarProyecto,
  onAgregarHistorial,
}) => {
  // Servicio fiscal seleccionado en la simulación interactiva
  const [servicioSeleccionado, setServicioSeleccionado] = useState<TipoServicioFiscal>(
    (proyecto.servicioFiscal as TipoServicioFiscal) || 'Servicios educativos no acreditados (talleres, cursos libres)'
  );

  // Parámetros interactivos de ajuste fiscal
  const [alumnosSimulados, setAlumnosSimulados] = useState<number>(
    Number(proyecto.alumnosFinal) || Number(proyecto.alumnosProyectados) || 4
  );
  const [aplicaRetencionDocente, setAplicaRetencionDocente] = useState<boolean>(true);
  const [tasaISRCustom, setTasaISRCustom] = useState<number | undefined>(undefined);
  const [tasaMunicipalCustom, setTasaMunicipalCustom] = useState<number | undefined>(undefined);
  const [incluirAporteSolidario, setIncluirAporteSolidario] = useState<boolean>(false);
  const [guardadoExitoso, setGuardadoExitoso] = useState<boolean>(false);

  // Cálculo del desglose fiscal dinámico
  const desglose = useMemo(() => {
    return calcularImpactoFiscalCompleto(proyecto, {
      servicioFiscal: servicioSeleccionado,
      alumnosSimulados,
      aplicaRetencionDocente,
      tasaISRCorporativoPersonalizada: tasaISRCustom,
      tasaMunicipalPersonalizada: tasaMunicipalCustom,
      incluirAporteSolidario,
    });
  }, [
    proyecto,
    servicioSeleccionado,
    alumnosSimulados,
    aplicaRetencionDocente,
    tasaISRCustom,
    tasaMunicipalCustom,
    incluirAporteSolidario,
  ]);

  // Comparación contra el escenario original pre-impuestos
  const diferenciaGanancia = desglose.gananciaNetaPostImpuestos - desglose.utilidadOperativaPreImpuestos;
  const reduccionPorcentaje = desglose.utilidadOperativaPreImpuestos > 0
    ? (Math.abs(diferenciaGanancia) / desglose.utilidadOperativaPreImpuestos) * 100
    : 0;

  // Icono descriptivo por servicio fiscal
  const getIconoServicio = (tipo: TipoServicioFiscal) => {
    switch (tipo) {
      case 'Formación académica acreditada (ej. convenios universitarios)':
        return <GraduationCap className="w-4 h-4" />;
      case 'Capacitación profesional / Mentoría ejecutiva':
        return <Award className="w-4 h-4" />;
      case 'Consultoría empresarial':
        return <Briefcase className="w-4 h-4" />;
      case 'Servicios educativos no acreditados (talleres, cursos libres)':
        return <BookOpen className="w-4 h-4" />;
      case 'Intermediación laboral / servicios de RRHH':
        return <Users className="w-4 h-4" />;
      case 'Servicios administrativos / gestión de proyectos':
        return <Building2 className="w-4 h-4" />;
      default:
        return <Receipt className="w-4 h-4" />;
    }
  };

  // Guardar el servicio fiscal seleccionado en el proyecto
  const handleGuardarRegimenEnProyecto = () => {
    if (!onActualizarProyecto) return;

    const reglaActual = DICCIONARIO_REGLAS_FISCALES[servicioSeleccionado];
    const proyectoActualizado: ProyectoEducativo = {
      ...proyecto,
      servicioFiscal: servicioSeleccionado,
      aplicaISV: reglaActual.gravaISV,
      tasaISV: reglaActual.tasaISV,
      isvPorAlumno: desglose.isvPorAlumno,
      precioSugeridoConISV: desglose.precioFacturadoPorAlumno,
      isvVentaRequeridaTotal: reglaActual.gravaISV ? proyecto.precioVentaRequerido * 0.15 : 0,
      precioVentaRequeridoConISV: reglaActual.gravaISV ? proyecto.precioVentaRequerido * 1.15 : proyecto.precioVentaRequerido,
      isvTotalTrasladarSAR: desglose.isvTotalTrasladarSAR,
      ingresoFacturadoTotal: desglose.ingresoBrutoFacturado,
      ingresoTotalConISV: desglose.ingresoBrutoFacturado,
      ingresoTotalNeto: desglose.ingresoNetoOperativo,
      gananciaNetaPostImpuestos: desglose.gananciaNetaPostImpuestos,
      margenNetoPostImpuestos: desglose.margenNetoPostImpuestos,
      isrCorporativoTotal: desglose.isrCorporativoMonto,
      retencionDocenteTotal: desglose.retencionDocenteMonto,
      tasaMunicipalTotal: desglose.tasaMunicipalMonto,
    };

    if (onAgregarHistorial) {
      const entradaHistorial: HistorialCambioProyecto = {
        id: `hist-fiscal-${Date.now()}`,
        fecha: new Date().toISOString(),
        usuario: 'Gerencia General / Control Fiscal SAR',
        tipoCambio: 'manual',
        titulo: `Actualización de Régimen Fiscal: ${servicioSeleccionado}`,
        descripcion: `Se actualizó el tipo de servicio fiscal del proyecto a "${servicioSeleccionado}". ISV: ${reglaActual.gravaISV ? '15% Gravado' : '0% Exento'}. Ganancia neta post-impuestos proyectada: ${formatearMoneda(desglose.gananciaNetaPostImpuestos, moneda)} (${desglose.margenNetoPostImpuestos.toFixed(1)}%).`,
        modificaciones: [
          {
            campo: 'servicioFiscal',
            etiqueta: 'Tipo de Servicio Fiscal',
            valorAnterior: proyecto.servicioFiscal || 'No asignado',
            valorNuevo: servicioSeleccionado,
            tipo: 'texto',
          },
          {
            campo: 'aplicaISV',
            etiqueta: 'Grava 15% ISV',
            valorAnterior: proyecto.aplicaISV ? 'Sí' : 'No',
            valorNuevo: reglaActual.gravaISV ? 'Sí' : 'No',
            tipo: 'texto',
          },
          {
            campo: 'gananciaNetaPostImpuestos',
            etiqueta: 'Ganancia Neta Post-Impuestos',
            valorAnterior: proyecto.gananciaNetaPostImpuestos || proyecto.totalGananciasFinales,
            valorNuevo: desglose.gananciaNetaPostImpuestos,
            tipo: 'moneda',
          },
        ],
      };
      onAgregarHistorial(proyecto.id, entradaHistorial);
    }

    onActualizarProyecto(proyectoActualizado);
    setGuardadoExitoso(true);
    setTimeout(() => setGuardadoExitoso(false), 3500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Encabezado y Acción de Guardar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl border border-indigo-900 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Receipt className="w-3.5 h-3.5 text-indigo-400" />
                Módulo Fiscal & Tributario SAR
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Regulaciones SAR Honduras
              </span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Desglose Fiscal Integral & Ganancia Neta Post-Impuestos
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Evalúa en tiempo real el impacto del <strong>15% ISV</strong>, <strong>ISR Corporativo (25%)</strong>, <strong>Retención Docente (12.5% Art. 50)</strong> y <strong>Tasa Municipal</strong> según la naturaleza fiscal del servicio prestado.
            </p>
          </div>

          {onActualizarProyecto && (
            <div className="shrink-0 flex items-center gap-2">
              <button
                id="btn-guardar-regimen-fiscal"
                type="button"
                onClick={handleGuardarRegimenEnProyecto}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  guardadoExitoso
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {guardadoExitoso ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>¡Régimen Guardado!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Aplicar Régimen al Proyecto</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Selector de Tipo de Servicio Fiscal */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider block">
              1. Selección de Clasificación Tributaria (SAR)
            </span>
            <h4 className="text-sm font-bold text-slate-900">
              Tipo de Servicio Fiscal Aplicable
            </h4>
          </div>
          <span className="text-xs text-slate-500">
            Haz clic en cualquier categoría para simular su tratamiento legal
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {LISTA_SERVICIOS_FISCALES.map((tipo) => {
            const regla = DICCIONARIO_REGLAS_FISCALES[tipo];
            const esSeleccionado = servicioSeleccionado === tipo;
            const esActualEnProyecto = (proyecto.servicioFiscal || 'Servicios educativos no acreditados (talleres, cursos libres)') === tipo;

            return (
              <button
                key={tipo}
                type="button"
                id={`btn-servicio-fiscal-${tipo.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => {
                  setServicioSeleccionado(tipo);
                  // Si pasa a convenio acreditado, sugerimos 0% ISR por defecto para régimen educativo
                  if (tipo === 'Formación académica acreditada (ej. convenios universitarios)') {
                    setTasaISRCustom(0);
                    setTasaMunicipalCustom(0.10);
                  } else {
                    setTasaISRCustom(undefined);
                    setTasaMunicipalCustom(undefined);
                  }
                }}
                className={`text-left p-3 rounded-xl border transition-all text-xs flex flex-col justify-between relative group ${
                  esSeleccionado
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                      <span className={esSeleccionado ? 'text-indigo-600' : 'text-slate-500'}>
                        {getIconoServicio(tipo)}
                      </span>
                      <span className="truncate max-w-[190px]">{tipo.split('(')[0].trim()}</span>
                    </div>

                    {regla.gravaISV ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                        15% ISV
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shrink-0">
                        0% Exento
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {regla.etiquetaBreve}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-200/60 text-[10px]">
                  <span className="text-slate-500 font-mono">
                    ISR: {tipo === 'Formación académica acreditada (ej. convenios universitarios)' ? '0% (Exento)' : '25% Corp'}
                  </span>
                  {esActualEnProyecto && (
                    <span className="font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded">
                      En Proyecto
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tarjetas Principales de Ganancia Post-Impuestos (Executive Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* 1. Ganancia Neta Post-Impuestos */}
        <div className={`p-4 rounded-2xl border shadow-xs transition-all ${
          desglose.gananciaNetaPostImpuestos >= 0 
            ? 'border-emerald-300 bg-gradient-to-br from-emerald-50/90 to-emerald-100/50' 
            : 'border-rose-300 bg-gradient-to-br from-rose-50/90 to-rose-100/50'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-950">
              Ganancia Neta Post-Impuestos
            </span>
            <span className={`p-1 rounded-lg ${desglose.gananciaNetaPostImpuestos >= 0 ? 'bg-emerald-200/70 text-emerald-900' : 'bg-rose-200/70 text-rose-900'}`}>
              <DollarSign className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className={`text-2xl font-black font-mono mt-1.5 ${
            desglose.gananciaNetaPostImpuestos >= 0 ? 'text-emerald-950' : 'text-rose-950'
          }`}>
            {formatearMoneda(desglose.gananciaNetaPostImpuestos, moneda)}
          </div>

          <div className="mt-2 text-[11px] text-slate-700 space-y-0.5">
            <div className="flex items-center justify-between">
              <span>Pre-Impuestos (EBIT):</span>
              <span className="font-mono font-bold text-slate-900">
                {formatearMoneda(desglose.utilidadOperativaPreImpuestos, moneda)}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Impacto tributario:</span>
              <span className="font-mono font-bold text-rose-700">
                -{formatearMoneda(desglose.totalImpuestosDirectos, moneda)} ({reduccionPorcentaje.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>

        {/* 2. Margen Neto Post-Impuestos */}
        <div className="p-4 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/90 to-blue-100/50 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-950">
              Margen Neto Post-Impuestos
            </span>
            <span className="p-1 rounded-lg bg-blue-200/70 text-blue-900">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="text-2xl font-black font-mono text-blue-950 mt-1.5">
            {desglose.margenNetoPostImpuestos.toFixed(1)}%
          </div>

          <div className="mt-2 text-[11px] text-slate-700 space-y-0.5">
            <div className="flex items-center justify-between">
              <span>Margen Operativo Bruto:</span>
              <span className="font-mono font-bold text-slate-900">
                {desglose.margenOperativoPreImpuestos.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-blue-800">
              <span>Retención de valor:</span>
              <span className="font-mono font-bold">
                {desglose.utilidadOperativaPreImpuestos > 0
                  ? `${((desglose.gananciaNetaPostImpuestos / desglose.utilidadOperativaPreImpuestos) * 100).toFixed(0)}% retenido`
                  : '0%'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Ganancia Neta por Alumno */}
        <div className="p-4 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/90 to-indigo-100/50 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-950">
              Ganancia Neta / Alumno
            </span>
            <span className="p-1 rounded-lg bg-indigo-200/70 text-indigo-900">
              <Users className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="text-2xl font-black font-mono text-indigo-950 mt-1.5">
            {formatearMoneda(desglose.gananciaNetaPorAlumno, moneda)}
          </div>

          <div className="mt-2 text-[11px] text-slate-700 space-y-0.5">
            <div className="flex items-center justify-between">
              <span>Precio cobrado neto:</span>
              <span className="font-mono font-bold text-slate-900">
                {formatearMoneda(desglose.precioSugeridoNetoAlumno, moneda)}
              </span>
            </div>
            <div className="flex items-center justify-between text-indigo-800">
              <span>Base inscrita:</span>
              <span className="font-mono font-bold">
                {desglose.alumnosBase} alumnos
              </span>
            </div>
          </div>
        </div>

        {/* 4. Carga Tributaria Directa Total */}
        <div className="p-4 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/90 to-amber-100/50 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-950">
              Carga Fiscal Directa Total
            </span>
            <span className="p-1 rounded-lg bg-amber-200/70 text-amber-900">
              <Scale className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="text-2xl font-black font-mono text-amber-950 mt-1.5">
            {formatearMoneda(desglose.totalImpuestosDirectos, moneda)}
          </div>

          <div className="mt-2 text-[11px] text-slate-700 space-y-0.5">
            <div className="flex items-center justify-between">
              <span>Tasa efectiva s/ EBIT:</span>
              <span className="font-mono font-bold text-amber-900">
                {desglose.cargaTributariaEfectivaPct.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-amber-800">
              <span>ISR ({desglose.tasaISRCorporativo}%) + Alcaldía:</span>
              <span className="font-mono font-bold">
                {formatearMoneda(desglose.isrCorporativoMonto + desglose.tasaMunicipalMonto, moneda)}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Cascada de Resultados Fiscales (P&L Fiscal Statement) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-700" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Estado de Resultados Fiscal Detallado (P&L Cascada)
            </h4>
          </div>
          <span className="text-[11px] font-mono font-semibold text-slate-600 bg-white px-2.5 py-0.5 rounded border border-slate-200">
            Base: {desglose.alumnosBase} alumnos inscritos
          </span>
        </div>

        <div className="p-4 sm:p-5 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <th className="py-2 px-3">Rubro Financiero & Fiscal</th>
                <th className="py-2 px-3">Concepto / Criterio Legal</th>
                <th className="py-2 px-3 text-right">Monto Unitario / Alumno</th>
                <th className="py-2 px-3 text-right font-bold text-slate-900">Total Proyecto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              
              {/* 1. Ingreso Bruto Facturado */}
              <tr className="hover:bg-slate-50/60">
                <td className="py-2.5 px-3 font-sans font-semibold text-slate-800 flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">(+)</span> Ingreso Bruto Facturado
                </td>
                <td className="py-2.5 px-3 font-sans text-slate-600 text-[11px]">
                  Facturación fiscal con CAI ({desglose.gravaISV ? 'Incluye 15% ISV' : 'Exento'})
                </td>
                <td className="py-2.5 px-3 text-right text-slate-700">
                  {formatearMoneda(desglose.precioFacturadoPorAlumno, moneda)}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                  {formatearMoneda(desglose.ingresoBrutoFacturado, moneda)}
                </td>
              </tr>

              {/* 2. ISV Trasladado */}
              <tr className={desglose.gravaISV ? 'bg-amber-50/40 text-amber-950' : 'text-slate-400'}>
                <td className="py-2.5 px-3 font-sans font-semibold flex items-center gap-1.5">
                  <span className="text-amber-700 font-bold">(-)</span> Débito Fiscal ISV (15%)
                </td>
                <td className="py-2.5 px-3 font-sans text-[11px]">
                  {desglose.gravaISV 
                    ? 'Impuesto indirecto recaudado; se entera mensualmente a la SAR (no es ingreso de SUMMIT)' 
                    : 'Art. 15 num. 1 Ley del ISV: Educación formal acreditada exenta de ISV'}
                </td>
                <td className="py-2.5 px-3 text-right font-semibold">
                  {desglose.gravaISV ? `-${formatearMoneda(desglose.isvPorAlumno, moneda)}` : 'L 0.00'}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-amber-900">
                  {desglose.gravaISV ? `-${formatearMoneda(desglose.isvTotalTrasladarSAR, moneda)}` : 'L 0.00'}
                </td>
              </tr>

              {/* 3. Subtotal Ingreso Neto Operativo */}
              <tr className="bg-slate-50 font-bold text-slate-900 border-t border-b border-slate-200">
                <td className="py-2.5 px-3 font-sans flex items-center gap-1.5">
                  <span className="text-blue-600 font-bold">(=)</span> Ingreso Neto Operativo SUMMIT
                </td>
                <td className="py-2.5 px-3 font-sans text-slate-600 text-[11px] font-normal">
                  Ingreso real que percibe la institución disponible para costos y utilidad
                </td>
                <td className="py-2.5 px-3 text-right text-blue-900">
                  {formatearMoneda(desglose.precioSugeridoNetoAlumno, moneda)}
                </td>
                <td className="py-2.5 px-3 text-right text-blue-900">
                  {formatearMoneda(desglose.ingresoNetoOperativo, moneda)}
                </td>
              </tr>

              {/* 4. Gastos Operativos Deducibles */}
              <tr className="hover:bg-slate-50/60">
                <td className="py-2.5 px-3 font-sans font-semibold text-slate-800 flex items-center gap-1.5">
                  <span className="text-rose-600 font-bold">(-)</span> Gastos Operativos Totales
                </td>
                <td className="py-2.5 px-3 font-sans text-slate-600 text-[11px]">
                  Docente ({formatearMoneda(desglose.costoDocenteCalculado, moneda)}), Zoom ({formatearMoneda(desglose.costoZoom, moneda)}), Materiales ({formatearMoneda(desglose.costoPapeleria, moneda)}), Varios ({formatearMoneda(desglose.gastosVarios, moneda)})
                </td>
                <td className="py-2.5 px-3 text-right text-slate-600">
                  -{formatearMoneda(desglose.gastoTotalOperativo / desglose.alumnosBase, moneda)}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-rose-800">
                  -{formatearMoneda(desglose.gastoTotalOperativo, moneda)}
                </td>
              </tr>

              {/* 5. Utilidad Operativa Pre-Impuestos (EBIT) */}
              <tr className="bg-indigo-50/40 font-bold text-indigo-950 border-t border-b border-indigo-100">
                <td className="py-2.5 px-3 font-sans flex items-center gap-1.5">
                  <span className="text-indigo-700 font-bold">(=)</span> Utilidad Operativa Pre-Impuestos (EBIT)
                </td>
                <td className="py-2.5 px-3 font-sans text-indigo-800 text-[11px] font-normal">
                  Rendimiento operativo antes de gravámenes municipales e ISR ({desglose.margenOperativoPreImpuestos.toFixed(1)}% margen)
                </td>
                <td className="py-2.5 px-3 text-right text-indigo-900">
                  {formatearMoneda(desglose.utilidadOperativaPreImpuestos / desglose.alumnosBase, moneda)}
                </td>
                <td className="py-2.5 px-3 text-right text-indigo-950 text-sm">
                  {formatearMoneda(desglose.utilidadOperativaPreImpuestos, moneda)}
                </td>
              </tr>

              {/* 6. Tasa Municipal */}
              <tr className="hover:bg-slate-50/60">
                <td className="py-2.5 px-3 font-sans font-semibold text-slate-800 flex items-center gap-1.5">
                  <span className="text-amber-700 font-bold">(-)</span> Tasa Municipal Industria & Comercio
                </td>
                <td className="py-2.5 px-3 font-sans text-slate-600 text-[11px]">
                  Plan de Arbitrios Municipal ({desglose.tasaMunicipalPct}% s/ volumen bruto facturado)
                </td>
                <td className="py-2.5 px-3 text-right text-slate-600">
                  -{formatearMoneda(desglose.tasaMunicipalMonto / desglose.alumnosBase, moneda)}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-amber-900">
                  -{formatearMoneda(desglose.tasaMunicipalMonto, moneda)}
                </td>
              </tr>

              {/* 7. Impuesto Sobre la Renta (ISR Corporativo 25%) */}
              <tr className="hover:bg-slate-50/60">
                <td className="py-2.5 px-3 font-sans font-semibold text-slate-800 flex items-center gap-1.5">
                  <span className="text-rose-700 font-bold">(-)</span> Impuesto Sobre la Renta (ISR SAR)
                </td>
                <td className="py-2.5 px-3 font-sans text-slate-600 text-[11px]">
                  {desglose.tasaISRCorporativo > 0
                    ? `Art. 22 Ley del ISR (${desglose.tasaISRCorporativo}% sobre renta neta gravable de ${formatearMoneda(desglose.baseImponibleISR, moneda)})`
                    : 'Régimen de cooperación educativa / Convenio universitario exento de ISR (0%)'}
                </td>
                <td className="py-2.5 px-3 text-right text-slate-600">
                  {desglose.tasaISRCorporativo > 0 ? `-${formatearMoneda(desglose.isrCorporativoMonto / desglose.alumnosBase, moneda)}` : 'L 0.00'}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-rose-900">
                  {desglose.tasaISRCorporativo > 0 ? `-${formatearMoneda(desglose.isrCorporativoMonto, moneda)}` : 'L 0.00 (Exento)'}
                </td>
              </tr>

              {/* 8. Aporte Solidario si aplica */}
              {desglose.aporteSolidarioMonto > 0 && (
                <tr className="hover:bg-slate-50/60 bg-amber-50/30">
                  <td className="py-2.5 px-3 font-sans font-semibold text-amber-900 flex items-center gap-1.5">
                    <span className="text-amber-700 font-bold">(-)</span> Aporte Solidario Temporal (5%)
                  </td>
                  <td className="py-2.5 px-3 font-sans text-amber-800 text-[11px]">
                    Sobretasa SAR sobre el excedente de renta imponible anual
                  </td>
                  <td className="py-2.5 px-3 text-right text-amber-900">
                    -{formatearMoneda(desglose.aporteSolidarioMonto / desglose.alumnosBase, moneda)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-amber-950">
                    -{formatearMoneda(desglose.aporteSolidarioMonto, moneda)}
                  </td>
                </tr>
              )}

              {/* 9. RESULTADO FINAL: GANANCIA NETA POST-IMPUESTOS */}
              <tr className="bg-emerald-100/70 text-emerald-950 font-black border-t-2 border-emerald-300">
                <td className="py-3 px-3 font-sans text-sm flex items-center gap-1.5">
                  <span className="text-emerald-700 text-base">(=)</span> GANANCIA NETA POST-IMPUESTOS
                </td>
                <td className="py-3 px-3 font-sans text-emerald-900 text-xs font-semibold">
                  Utilidad final líquida disponible para SUMMIT tras satisfacer todas las obligaciones fiscales
                </td>
                <td className="py-3 px-3 text-right text-sm">
                  {formatearMoneda(desglose.gananciaNetaPorAlumno, moneda)}
                </td>
                <td className="py-3 px-3 text-right text-base text-emerald-950 font-mono">
                  {formatearMoneda(desglose.gananciaNetaPostImpuestos, moneda)}
                </td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>

      {/* Doble Columna: Retención en la Fuente Docente (Art. 50) y Ajustes de Simulación */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Panel 1: Retención SAR en la Fuente a Docentes (Art. 50 Ley de ISR) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-purple-700" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Retención en la Fuente a Docentes (Art. 50 Ley de ISR)
              </h4>
            </div>
            <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
              Formulario SAR-272
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Como persona jurídica legalmente constituida en Honduras (<strong>Summit Impulsa S. de R.L.</strong> • RTN: <span className="font-mono font-bold text-purple-900">05019026435770</span> • San Pedro Sula, Cortés, Honduras), SUMMIT actúa como <strong>Agente de Retención</strong> sobre los honorarios pagados a instructores y facilitadores independientes.
          </p>

          <div className="bg-purple-50/60 p-3.5 rounded-xl border border-purple-200 space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="font-sans text-slate-600">Honorario Total Docente Pactado:</span>
              <span className="font-bold text-slate-900">
                {formatearMoneda(desglose.costoDocenteCalculado, moneda)}
              </span>
            </div>

            <div className="flex items-center justify-between text-purple-900 font-semibold">
              <span className="font-sans">
                (-) Retención 12.5% SAR ({aplicaRetencionDocente ? 'Aplicada' : 'Exonerada c/ Constancia'}):
              </span>
              <span>
                {aplicaRetencionDocente ? `-${formatearMoneda(desglose.retencionDocenteMonto, moneda)}` : 'L 0.00'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-purple-200 text-emerald-900 font-bold">
              <span className="font-sans">Neto Líquido a Transferir al Docente:</span>
              <span className="text-sm">
                {formatearMoneda(desglose.honorarioNetoDocente, moneda)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="text-xs text-slate-700 font-medium flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={aplicaRetencionDocente}
                onChange={(e) => setAplicaRetencionDocente(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
              />
              <span>Aplicar retención del 12.5% a honorarios docentes</span>
            </label>
            <span className="text-[10px] text-slate-400">
              {aplicaRetencionDocente ? 'Persona natural s/ pagos a cuenta' : 'Tiene constancia SAR vigente'}
            </span>
          </div>
        </div>

        {/* Panel 2: Simulador Rápido de Sensibilidad Fiscal */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-700" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Simulador de Sensibilidad & Ajuste Fiscal
              </h4>
            </div>
            <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
              Personalización
            </span>
          </div>

          {/* Slider de Alumnos */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Volumen de Alumnos para el Cálculo:</span>
              <span className="font-mono font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {alumnosSimulados} alumnos
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="35"
              value={alumnosSimulados}
              onChange={(e) => setAlumnosSimulados(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>1</span>
              <span>BEP: {proyecto.puntoEquilibrioAlumnos}</span>
              <span>Proyectados: {proyecto.alumnosProyectados}</span>
              <span>Finales: {proyecto.alumnosFinal}</span>
              <span>35</span>
            </div>
          </div>

          {/* Ajustes avanzados de tasas */}
          <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
            <div>
              <span className="text-[11px] font-medium text-slate-600 block mb-1">
                Tasa ISR Corporativo:
              </span>
              <select
                value={desglose.tasaISRCorporativo}
                onChange={(e) => setTasaISRCustom(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
              >
                <option value={25}>25% - Régimen General SAR</option>
                <option value={15}>15% - Régimen Preferencial / Pyme</option>
                <option value={0}>0% - Convenio Educativo Exento</option>
              </select>
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-600 block mb-1">
                Tasa Municipal (Alcaldía):
              </span>
              <select
                value={desglose.tasaMunicipalPct}
                onChange={(e) => setTasaMunicipalCustom(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
              >
                <option value={0.20}>0.20% - General Comercio</option>
                <option value={0.10}>0.10% - Fomento Educativo</option>
                <option value={0.00}>0.00% - Exento</option>
              </select>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between text-xs">
            <label className="text-slate-700 font-medium flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={incluirAporteSolidario}
                onChange={(e) => setIncluirAporteSolidario(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
              />
              <span>Incluir Aporte Solidario 5% (Utilidad anual &gt; L 1M)</span>
            </label>
          </div>
        </div>

      </div>

      {/* Dictamen Jurídico SAR & Recomendación de Optimización */}
      <div className="bg-amber-50/80 p-4 sm:p-5 rounded-2xl border border-amber-200/90 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-800" />
          <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
            Dictamen Oficial SAR & Fundamento Jurídico-Fiscal
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Criterio del Servicio de Administración de Rentas (SAR)
              </span>
              <p className="text-slate-800 font-medium leading-relaxed">
                {desglose.dictamenSAR}
              </p>
            </div>

            <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-1 text-[11px]">
              <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                Fundamento Legal de ISV & Exenciones
              </span>
              <p className="text-slate-700 leading-relaxed font-mono">
                {desglose.fundamentoLegalISV}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-1 text-[11px]">
              <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block">
                Fundamento de ISR & Formularios Oficiales
              </span>
              <p className="text-slate-700 leading-relaxed font-mono">
                {desglose.fundamentoLegalISR}
              </p>
              <div className="pt-1.5 mt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-sans">
                <span>Formularios de Declaración:</span>
                <strong className="text-indigo-900 font-mono">{desglose.formularioSARPrincipal}</strong>
              </div>
            </div>

            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 space-y-1 text-[11px]">
              <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-700" />
                Recomendación de Eficiencia Tributaria para SUMMIT
              </span>
              <p className="text-emerald-950 leading-relaxed font-medium">
                {desglose.recomendacionOptimizacion}
              </p>
            </div>
          </div>
        </div>

        {/* Resumen de Flujo Consolidado */}
        <div className="pt-3 border-t border-amber-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
          <div className="text-amber-900">
            <strong>Flujo Total a Enterar al Fisco (SAR + Alcaldía): </strong>
            <span className="font-mono font-bold text-slate-900">
              {formatearMoneda(desglose.flujoTotalObligacionesFiscales, moneda)}
            </span>
            <span className="text-slate-500 text-[11px] ml-1">
              (ISV: {formatearMoneda(desglose.isvTotalTrasladarSAR, moneda)} • ISR: {formatearMoneda(desglose.isrCorporativoMonto, moneda)} • Ret. Docente: {formatearMoneda(desglose.retencionDocenteMonto, moneda)} • Tasa Mun.: {formatearMoneda(desglose.tasaMunicipalMonto, moneda)})
            </span>
          </div>

          {desglose.gravaISV ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-200/70 px-2.5 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3 text-amber-800" />
              Régimen Gravado con Crédito Fiscal para Clientes B2B
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-900 bg-emerald-200/70 px-2.5 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3 text-emerald-800" />
              100% Exento de ISV según Art. 15 Num. 1
            </span>
          )}
        </div>
      </div>

    </div>
  );
};
