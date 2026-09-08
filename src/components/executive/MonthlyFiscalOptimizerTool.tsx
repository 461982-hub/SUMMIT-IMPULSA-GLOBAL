import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CalendarDays, 
  FileText, 
  FileSpreadsheet, 
  Cloud, 
  ExternalLink, 
  Sparkles, 
  Check, 
  Search, 
  Filter, 
  ArrowRight, 
  BookOpen, 
  GraduationCap, 
  Briefcase, 
  Info, 
  HelpCircle,
  Layers,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2
} from 'lucide-react';
import { ProyectoEducativo, Moneda, TipoServicioFiscal } from '../../types';
import { formatearMoneda, calcularMetricasProyecto } from '../../utils/calculations';
import { obtenerClaveMesProyecto, formatearEtiquetaMes } from '../../utils/monthUtils';
import { 
  analizarOptimizacionFiscalMensual, 
  SugerenciaFiscalProyecto,
  generarReporteOptimizaciónFiscalPDF,
  generarReporteOptimizaciónFiscalExcel 
} from '../../utils/monthlyFiscalOptimizer';
import { crearEntradaHistorialCreacion, detectarCambiosProyecto } from '../../utils/historyUtils';
import { FiscalWithholdingSection } from './FiscalWithholdingSection';

interface MonthlyFiscalOptimizerToolProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  isDriveConnected: boolean;
  onActualizarProyecto?: (proyecto: ProyectoEducativo) => void;
  onActualizarVariosProyectos?: (proyectos: ProyectoEducativo[]) => void;
  onNotificar?: (mensaje: string) => void;
}

export const MonthlyFiscalOptimizerTool: React.FC<MonthlyFiscalOptimizerToolProps> = ({
  proyectos,
  moneda,
  isDriveConnected,
  onActualizarProyecto,
  onActualizarVariosProyectos,
  onNotificar,
}) => {
  // 1. Detección del mes actual del calendario (año-mes, ej: 2026-09)
  const mesActualCalendario = useMemo(() => {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    return `${anio}-${mes}`;
  }, []);

  // 2. Lista de meses detectados en la cartera
  const mesesDisponibles = useMemo(() => {
    const setMeses = new Set<string>();
    proyectos.forEach((p) => {
      const key = obtenerClaveMesProyecto(p);
      if (key) setMeses.add(key);
    });
    setMeses.add(mesActualCalendario);
    return Array.from(setMeses).sort();
  }, [proyectos, mesActualCalendario]);

  // Mes seleccionado en el filtro (por defecto mes actual del sistema)
  const [mesSeleccionado, setMesSeleccionado] = useState<string>(() => {
    return mesesDisponibles.includes(mesActualCalendario) ? mesActualCalendario : (mesesDisponibles[0] || 'todos');
  });

  // Filtro de estado ('todos' | 'optimizables' | 'ya_optimos')
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'optimizables' | 'ya_optimos'>('todos');
  const [busqueda, setBusqueda] = useState<string>('');
  const [detallesExpandidos, setDetallesExpandidos] = useState<Record<string, boolean>>({});
  const [exportando, setExportando] = useState<string | null>(null);

  // 3. Ejecutar análisis tributario
  const analisis = useMemo(() => {
    return analizarOptimizacionFiscalMensual(proyectos, mesSeleccionado);
  }, [proyectos, mesSeleccionado]);

  // 4. Filtrar sugerencias en vista
  const sugerenciasFiltradas = useMemo(() => {
    return analisis.sugerencias.filter((s) => {
      const matchBusqueda =
        busqueda.trim() === '' ||
        s.nombreProyecto.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.codigoPrograma.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.nombreDocente.toLowerCase().includes(busqueda.toLowerCase());

      const matchEstado =
        filtroEstado === 'todos' ||
        (filtroEstado === 'optimizables' && !s.esYaOptimo) ||
        (filtroEstado === 'ya_optimos' && s.esYaOptimo);

      return matchBusqueda && matchEstado;
    });
  }, [analisis.sugerencias, busqueda, filtroEstado]);

  const toggleDetalle = (proyectoId: string) => {
    setDetallesExpandidos((prev) => ({
      ...prev,
      [proyectoId]: !prev[proyectoId],
    }));
  };

  // 5. Aplicar sugerencia a un proyecto individual
  const handleAplicarSugerencia = (sugerencia: SugerenciaFiscalProyecto) => {
    const proyectoOriginal = proyectos.find((p) => p.id === sugerencia.proyectoId);
    if (!proyectoOriginal) return;

    const aplicaISVActualizado = !sugerencia.servicioFiscalSugerido.includes('acreditada');
    
    // Crear el proyecto actualizado con cálculo de métricas
    const actualizadoBase = {
      ...proyectoOriginal,
      servicioFiscal: sugerencia.servicioFiscalSugerido,
      aplicaISV: sugerencia.gravaISVSugerido,
    };

    const proyectoRecalculado = calcularMetricasProyecto(actualizadoBase);

    // Entrada de historial
    const cambio = detectarCambiosProyecto(proyectoOriginal, proyectoRecalculado, 'Asesor Fiscal Inteligente');
    const historialNuevo = cambio
      ? [cambio, ...(proyectoOriginal.historialCambios || [])]
      : (proyectoOriginal.historialCambios || []);

    const proyectoFinal: ProyectoEducativo = {
      ...proyectoRecalculado,
      historialCambios: historialNuevo,
    };

    if (onActualizarProyecto) {
      onActualizarProyecto(proyectoFinal);
      onNotificar?.(`✅ Régimen fiscal de "${proyectoFinal.nombreProyecto}" optimizado a: ${sugerencia.servicioFiscalSugerido}`);
    } else {
      alert(`Proyecto optimizado a: ${sugerencia.servicioFiscalSugerido}`);
    }
  };

  // 6. Aplicar sugerencias a todos los proyectos optimizables del mes
  const handleAplicarTodas = () => {
    const optimizables = analisis.sugerencias.filter((s) => !s.esYaOptimo);
    if (optimizables.length === 0) {
      onNotificar?.('Todos los programas del mes ya se encuentran en su régimen fiscal más eficiente.');
      return;
    }

    const confirmar = window.confirm(
      `¿Deseas aplicar la sugerencia fiscal óptima a los ${optimizables.length} proyectos del periodo seleccionado? Esta acción minimizará legalmente la carga de ISV de acuerdo a la Ley del ISV de Honduras.`
    );
    if (!confirmar) return;

    if (onActualizarVariosProyectos) {
      const proyectosActualizados = proyectos.map((p) => {
        const sug = optimizables.find((s) => s.proyectoId === p.id);
        if (!sug) return p;

        const base = {
          ...p,
          servicioFiscal: sug.servicioFiscalSugerido,
          aplicaISV: sug.gravaISVSugerido,
        };
        const recalculado = calcularMetricasProyecto(base);
        const cambio = detectarCambiosProyecto(p, recalculado, 'Optimización Fiscal Masiva');
        return {
          ...recalculado,
          historialCambios: cambio ? [cambio, ...(p.historialCambios || [])] : p.historialCambios,
        };
      });

      onActualizarVariosProyectos(proyectosActualizados);
      onNotificar?.(`🚀 ¡Se aplicaron las recomendaciones fiscales a ${optimizables.length} programas! Ahorro legal proyectado: ${formatearMoneda(analisis.ahorroFiscalTotalMes, moneda)}`);
    } else if (onActualizarProyecto) {
      optimizables.forEach((sug) => handleAplicarSugerencia(sug));
      onNotificar?.(`🚀 ¡Se aplicaron las recomendaciones fiscales a ${optimizables.length} programas!`);
    }
  };

  // 7. Descargas de reportes
  const handleDescargarPDF = async () => {
    setExportando('PDF');
    try {
      const res = await generarReporteOptimizaciónFiscalPDF(analisis, moneda);
      if (res.urlDrive) {
        onNotificar?.(`📄 Dictamen Fiscal descargado y guardado en Google Drive (${res.nombreArchivo})`);
      } else {
        onNotificar?.(`📄 Dictamen Fiscal descargado exitosamente (${res.nombreArchivo})`);
      }
    } catch (err: any) {
      console.error(err);
      alert('Error al generar reporte PDF: ' + (err.message || 'Error desconocido'));
    } finally {
      setExportando(null);
    }
  };

  const handleDescargarExcel = async () => {
    setExportando('EXCEL');
    try {
      const res = await generarReporteOptimizaciónFiscalExcel(analisis, moneda);
      if (res.urlDrive) {
        onNotificar?.(`📊 Matriz Fiscal descargada y guardada en Google Drive (${res.nombreArchivo})`);
      } else {
        onNotificar?.(`📊 Matriz Fiscal descargada exitosamente (${res.nombreArchivo})`);
      }
    } catch (err: any) {
      console.error(err);
      alert('Error al generar Excel: ' + (err.message || 'Error desconocido'));
    } finally {
      setExportando(null);
    }
  };

  return (
    <div id="herramienta-optimizador-fiscal" className="space-y-5 animate-fadeIn">
      
      {/* Encabezado y Selector de Periodo */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Herramienta de Optimización Fiscal & Asesor SAR
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Elusión Legal & Cumplimiento SAR
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Analiza los programas del mes según su volumen de ingresos y tipo de actividad para sugerir el servicio fiscal óptimo (Art. 15 numeral 1 Ley del ISV de Honduras y deducciones de ISR).
            </p>
          </div>
        </div>

        {/* Selector de Mes */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-slate-50 p-2 rounded-xl border border-slate-200">
          <CalendarDays className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-semibold text-slate-600">Periodo:</span>
          <select
            value={mesSeleccionado}
            onChange={(e) => setMesSeleccionado(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
            aria-label="Seleccionar periodo fiscal"
          >
            <option value="todos">Todos los Periodos ({proyectos.length} cursos)</option>
            {mesesDisponibles.map((mKey) => (
              <option key={mKey} value={mKey}>
                {formatearEtiquetaMes(mKey)} {mKey === mesActualCalendario ? '★ (Mes Actual)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tarjetas de Indicadores Clave (KPIs) Fiscales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* KPI 1: Volumen de Ingresos Proyectados */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Volumen de Ingresos
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {formatearMoneda(analisis.totalIngresosMes, moneda)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {analisis.conteoTotalProyectos} {analisis.conteoTotalProyectos === 1 ? 'programa en el mes' : 'programas en el mes'}
            </p>
          </div>
        </div>

        {/* KPI 2: Carga ISV Actual (SAR 15%) */}
        <div className="bg-white p-4 rounded-xl border border-rose-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
              Carga ISV Actual (SAR 15%)
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-rose-700 font-mono tracking-tight">
              {formatearMoneda(analisis.totalISVActualMes, moneda)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Impuesto a trasladar bajo régimen actual
            </p>
          </div>
        </div>

        {/* KPI 3: Carga ISV Optimizada Legal */}
        <div className="bg-white p-4 rounded-xl border border-blue-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
              Carga ISV Optimizada
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-blue-700 font-mono tracking-tight">
              {formatearMoneda(analisis.totalISVSugeridoMes, moneda)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Aplicando exenciones de ley (Art. 15)
            </p>
          </div>
        </div>

        {/* KPI 4: Ahorro Fiscal Total Estimado */}
        <div className="bg-white p-4 rounded-xl border border-emerald-300 shadow-xs flex flex-col justify-between bg-gradient-to-br from-white to-emerald-50/40">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Ahorro Fiscal Legal Potencial
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-emerald-700 font-mono tracking-tight">
              {formatearMoneda(analisis.ahorroFiscalTotalMes, moneda)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                +{analisis.porcentajeEficienciaFiscal.toFixed(1)}% eficiencia
              </span>
              <span className="text-[10px] text-slate-500">
                ({analisis.conteoOptimizables} por optimizar)
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Cuadro de Estrategia Tributaria y Dictamen Legal */}
      <div className="bg-slate-900 text-slate-100 p-4 sm:p-5 rounded-2xl shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                Estrategia Tributaria Oficial SUMMIT IMPULSA GLOBAL (Ley del ISV & SAR)
              </span>
            </div>
            <h4 className="text-sm font-bold text-white">
              Acreditación Académica Universitaria: Exención del 100% de ISV (Art. 15 Numeral 1)
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Los diplomados, certificaciones y cursos con carga horaria estructurada pueden acogerse formalmente al 
              <strong> convenio institucional de educación superior</strong>. Esto exime completamente el cobro del 15% de ISV, permitiendo reducir el precio final de matrícula para los estudiantes o trasladar el margen completo a la utilidad institucional de forma 100% legal.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {analisis.conteoOptimizables > 0 && (
              <button
                type="button"
                id="btn-aplicar-todas-sugerencias-fiscales"
                onClick={handleAplicarTodas}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition-all shadow-md hover:shadow-lg"
                title="Actualizar automáticamente todos los proyectos a su régimen óptimo"
              >
                <Sparkles className="w-4 h-4" />
                <span>Aplicar Todas las Sugerencias ({analisis.conteoOptimizables})</span>
              </button>
            )}

            <button
              type="button"
              id="btn-descargar-dictamen-fiscal-pdf"
              onClick={handleDescargarPDF}
              disabled={Boolean(exportando)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-2xs border border-slate-300 disabled:opacity-50"
              title="Descargar dictamen oficial en PDF con respaldo en Drive"
            >
              {exportando === 'PDF' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 text-rose-600" />}
              <span>Dictamen PDF</span>
            </button>

            <button
              type="button"
              id="btn-exportar-matriz-fiscal-excel"
              onClick={handleDescargarExcel}
              disabled={Boolean(exportando)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-2xs border border-slate-300 disabled:opacity-50"
              title="Descargar matriz en Excel"
            >
              {exportando === 'EXCEL' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
              <span>Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sección Oficial de Retenciones de Impuestos (ISV / ISR) según Tipo de Programa & RTN Registrado */}
      <FiscalWithholdingSection
        proyectos={analisis.proyectosDelMes && analisis.proyectosDelMes.length > 0 ? analisis.proyectosDelMes : proyectos}
        moneda={moneda}
        mesSeleccionado={mesSeleccionado}
        onNotificar={onNotificar}
      />

      {/* Barra de Filtros y Búsqueda de Programas */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFiltroEstado('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filtroEstado === 'todos'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({analisis.conteoTotalProyectos})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('optimizables')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              filtroEstado === 'optimizables'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Por Optimizar ({analisis.conteoOptimizables})</span>
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('ya_optimos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              filtroEstado === 'ya_optimos'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ya Óptimos ({analisis.conteoYaOptimos})</span>
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por curso, código o docente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Lista de Programas Evaluados con Sugerencia Fiscal */}
      {sugerenciasFiltradas.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
          <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700">No se encontraron programas con los filtros seleccionados.</p>
          <p className="text-xs text-slate-400 mt-1">Prueba cambiando el mes de consulta o el estado de optimización.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sugerenciasFiltradas.map((sug) => {
            const expandido = Boolean(detallesExpandidos[sug.proyectoId]);

            return (
              <div
                key={sug.proyectoId}
                id={`card-fiscal-${sug.proyectoId}`}
                className={`bg-white rounded-xl border transition-all shadow-2xs hover:shadow-xs p-4 ${
                  sug.esYaOptimo
                    ? 'border-slate-200/90 hover:border-emerald-300'
                    : 'border-amber-200/90 hover:border-rose-300 bg-gradient-to-r from-white via-white to-amber-50/20'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  
                  {/* Información General del Curso */}
                  <div className="flex-1 min-w-[280px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {sug.codigoPrograma}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {sug.tipoProyecto}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {sug.horasClase} hrs • {sug.alumnosBase} alumnos
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">
                        Docente: <strong className="text-slate-700">{sug.nombreDocente}</strong>
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mt-1">
                      {sug.nombreProyecto}
                    </h4>

                    <div className="flex items-center gap-2 mt-1.5 text-xs">
                      <span className="text-slate-500">Volumen Ingresos:</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {formatearMoneda(sug.volumenIngresosTotal, moneda)}
                      </span>
                    </div>
                  </div>

                  {/* Comparativa Fiscal: Actual vs Sugerido */}
                  <div className="flex flex-wrap items-center gap-3 lg:gap-4 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                    
                    {/* Servicio Actual */}
                    <div className="min-w-[130px]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Régimen Actual:
                      </span>
                      <span className="text-xs font-semibold text-slate-700 block truncate max-w-[160px]" title={sug.servicioFiscalActual}>
                        {sug.servicioFiscalActual}
                      </span>
                      <span className={`inline-flex items-center text-[10px] font-bold mt-0.5 px-1.5 py-0.2 rounded ${
                        sug.gravaISVActual ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {sug.gravaISVActual ? `15% ISV (${formatearMoneda(sug.montoISVActual, moneda)})` : 'Exento 0%'}
                      </span>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />

                    {/* Servicio Sugerido */}
                    <div className="min-w-[140px]">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                        Sugerencia SAR Óptima:
                      </span>
                      <span className="text-xs font-bold text-blue-900 block truncate max-w-[180px]" title={sug.servicioFiscalSugerido}>
                        {sug.servicioFiscalSugerido}
                      </span>
                      <span className={`inline-flex items-center text-[10px] font-bold mt-0.5 px-1.5 py-0.2 rounded ${
                        sug.gravaISVSugerido ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {sug.gravaISVSugerido ? `15% ISV (${formatearMoneda(sug.montoISVSugerido, moneda)})` : 'Exento 0% ISV (Art. 15)'}
                      </span>
                    </div>

                    {/* Ahorro Fiscal Estimado */}
                    <div className="text-right min-w-[110px]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Ahorro Fiscal:
                      </span>
                      <span className={`text-sm font-black font-mono block ${
                        sug.ahorroFiscalEstimado > 0 ? 'text-emerald-700' : 'text-slate-600'
                      }`}>
                        {sug.ahorroFiscalEstimado > 0 ? `+${formatearMoneda(sug.ahorroFiscalEstimado, moneda)}` : '0.00'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {sug.esYaOptimo ? '100% Optimizado' : `+${sug.incrementoMargenEstimado.toFixed(1)}% margen`}
                      </span>
                    </div>

                  </div>

                  {/* Acciones para el Proyecto */}
                  <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleDetalle(sug.proyectoId)}
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                      title={expandido ? 'Ocultar dictamen legal' : 'Ver dictamen legal y justificación SAR'}
                    >
                      {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {!sug.esYaOptimo ? (
                      <button
                        type="button"
                        onClick={() => handleAplicarSugerencia(sug)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                        title="Aplicar este servicio fiscal sugerido al proyecto"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Aplicar Sugerencia</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Régimen Óptimo</span>
                      </span>
                    )}
                  </div>

                </div>

                {/* Vista Detallada de Justificación y Fundamento Legal Expandible */}
                {expandido && (
                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs animate-fadeIn">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold mb-1">
                        <Info className="w-3.5 h-3.5 text-blue-600" />
                        <span>Justificación Técnica de Eficiencia:</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        {sug.justificacionTecnica}
                      </p>
                      <div className="mt-2 text-slate-500">
                        <strong className="text-slate-700">Recomendación Operativa:</strong> {sug.recomendacionOperativa}
                      </div>
                    </div>

                    <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-200/70">
                      <div className="flex items-center gap-1.5 text-blue-900 font-bold mb-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                        <span>Fundamento Jurídico-Fiscal SAR (Honduras):</span>
                      </div>
                      <p className="text-blue-950 leading-relaxed font-mono text-[11px]">
                        {sug.fundamentoLegalSAR}
                      </p>
                      <div className="mt-2 text-[11px] text-blue-800 font-semibold">
                        Impacto Financiero: Ahorro directo de {formatearMoneda(sug.ahorroFiscalEstimado, moneda)} en costos de facturación.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Barra Informativa de Google Drive */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Cloud className={`w-4 h-4 ${isDriveConnected ? 'text-emerald-600' : 'text-slate-400'}`} />
          <span>
            {isDriveConnected ? (
              <>
                Sincronización automática de dictámenes fiscales activada con la carpeta oficial de <strong>Google Drive</strong>.
              </>
            ) : (
              <>
                Conecta tu cuenta de Google Drive para respaldar automáticamente todos los dictámenes fiscales en la nube.
              </>
            )}
          </span>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          Normativa Tributaria: Ley ISV Dec. 24-1964 • SAR Honduras 2026
        </span>
      </div>

    </div>
  );
};
