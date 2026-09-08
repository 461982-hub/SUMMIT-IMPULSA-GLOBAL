import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  GraduationCap,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  FileSpreadsheet,
  FileDown,
  Cloud,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  HelpCircle,
  BarChart3,
  Scale,
  ShieldCheck,
  Percent,
  Search,
  RefreshCw,
  Zap,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { ProyectoEducativo, Moneda } from '../../types';
import { formatearMoneda } from '../../utils/calculations';
import {
  ParametrosProyeccion,
  TipoEscenario,
  ESCENARIOS_PREDEFINIDOS,
  SEMESTRES_DISPONIBLES,
  calcularProyeccionSemestral,
  exportarProyeccionPDF,
  exportarProyeccionExcel
} from '../../utils/growthProjectionUtils';

interface GrowthProjectionToolProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  isDriveConnected?: boolean;
  onNotificar?: (mensaje: string) => void;
}

type TabVista = 'graficos' | 'meses' | 'programas' | 'sensibilidad';

export const GrowthProjectionTool: React.FC<GrowthProjectionToolProps> = ({
  proyectos,
  moneda,
  isDriveConnected = false,
  onNotificar,
}) => {
  // Parámetros de simulación
  const [semestreObjetivo, setSemestreObjetivo] = useState<string>('2027-S1');
  const [escenarioActivo, setEscenarioActivo] = useState<TipoEscenario>('base');
  
  const [crecimientoMatriculaPct, setCrecimientoMatriculaPct] = useState<number>(10.0);
  const [inflacionGastosPct, setInflacionGastosPct] = useState<number>(5.5);
  const [incrementoCostoDocentePct, setIncrementoCostoDocentePct] = useState<number>(7.0);
  const [ajustePrecioArancelPct, setAjustePrecioArancelPct] = useState<number>(5.0);

  // Tab de visualización
  const [tabVista, setTabVista] = useState<TabVista>('graficos');
  const [filtroBusqueda, setFiltroBusqueda] = useState<string>('');

  // Estados de exportación
  const [exportandoPDF, setExportandoPDF] = useState<boolean>(false);
  const [exportandoExcel, setExportandoExcel] = useState<boolean>(false);

  // Cambiar escenario predefinido
  const handleSeleccionarEscenario = (tipo: TipoEscenario) => {
    setEscenarioActivo(tipo);
    if (tipo !== 'personalizado') {
      const valores = ESCENARIOS_PREDEFINIDOS[tipo];
      setCrecimientoMatriculaPct(valores.crecimientoMatriculaPct);
      setInflacionGastosPct(valores.inflacionGastosPct);
      setIncrementoCostoDocentePct(valores.incrementoCostoDocentePct);
      setAjustePrecioArancelPct(valores.ajustePrecioArancelPct);
    }
  };

  // Cuando el usuario mueve un slider individualmente, marcamos 'personalizado'
  const handleCambioParametro = (setter: (v: number) => void, val: number) => {
    setter(val);
    setEscenarioActivo('personalizado');
  };

  // Ejecutar el motor de cálculo
  const parametros: ParametrosProyeccion = useMemo(() => ({
    semestreObjetivo,
    crecimientoMatriculaPct,
    inflacionGastosPct,
    incrementoCostoDocentePct,
    ajustePrecioArancelPct,
    escenarioActivo,
  }), [
    semestreObjetivo,
    crecimientoMatriculaPct,
    inflacionGastosPct,
    incrementoCostoDocentePct,
    ajustePrecioArancelPct,
    escenarioActivo,
  ]);

  const analisis = useMemo(() => {
    return calcularProyeccionSemestral(proyectos, parametros);
  }, [proyectos, parametros]);

  // Filtrado de programas
  const programasFiltrados = useMemo(() => {
    if (!filtroBusqueda.trim()) return analisis.programas;
    const q = filtroBusqueda.toLowerCase();
    return analisis.programas.filter(
      p => p.nombre.toLowerCase().includes(q) ||
           p.docente.toLowerCase().includes(q) ||
           p.tipoProyecto.toLowerCase().includes(q)
    );
  }, [analisis.programas, filtroBusqueda]);

  // Exportar PDF
  const handleExportarPDF = async () => {
    setExportandoPDF(true);
    try {
      const res = await exportarProyeccionPDF(analisis, moneda, isDriveConnected);
      if (res.success) {
        onNotificar?.(
          `Proyección semestral descargada en PDF.${
            res.driveUrl ? ' ¡Respaldada automáticamente en Google Drive!' : ''
          }`
        );
      }
    } catch (e: any) {
      console.error(e);
      onNotificar?.('Error al generar el PDF de proyección: ' + (e.message || 'Error desconocido'));
    } finally {
      setExportandoPDF(false);
    }
  };

  // Exportar Excel
  const handleExportarExcel = async () => {
    setExportandoExcel(true);
    try {
      const res = await exportarProyeccionExcel(analisis, moneda, isDriveConnected);
      if (res.success) {
        onNotificar?.(
          `Modelo de proyección descargado en Excel.${
            res.driveUrl ? ' ¡Respaldado en Google Drive!' : ''
          }`
        );
      }
    } catch (e: any) {
      console.error(e);
      onNotificar?.('Error al exportar Excel: ' + (e.message || 'Error desconocido'));
    } finally {
      setExportandoExcel(false);
    }
  };

  // Datos para gráfico de estructura de costo
  const datosEstructuraCosto = useMemo(() => {
    return [
      { name: 'Costos Docentes (Honorarios)', value: Math.round(analisis.kpisProyectados.totalCostosDocentes), color: '#3b82f6' },
      { name: 'Gastos Operativos (Zoom/Inflación)', value: Math.round(analisis.kpisProyectados.totalCostosOperativos), color: '#f59e0b' },
      { name: 'Utilidad Neta Institucional', value: Math.max(0, Math.round(analisis.kpisProyectados.utilidadNeta)), color: '#10b981' },
    ];
  }, [analisis.kpisProyectados]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Header Principal del Simulador */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-indigo-300" />
                SIMULADOR FINANCIERO ESTRATÉGICO
              </span>
              <span className="text-xs text-indigo-300 font-medium">
                Planeación Semestral SUMMIT IMPULSA GLOBAL
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Proyección de Crecimiento & Rentabilidad Semestral
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Modela el rendimiento económico del próximo ciclo académico combinando el historial de proyectos con
              ajustes por <strong className="text-amber-300 font-semibold">inflación general (BCH)</strong> y <strong className="text-blue-300 font-semibold">revisión salarial docente</strong>.
            </p>
          </div>

          {/* Selector de Semestre y Acciones Rápidas */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-2 flex flex-col">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-indigo-400" />
                Semestre Objetivo
              </label>
              <select
                id="select-semestre-objetivo"
                value={semestreObjetivo}
                onChange={(e) => setSemestreObjetivo(e.target.value)}
                className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {SEMESTRES_DISPONIBLES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-exportar-proyeccion-pdf"
                onClick={handleExportarPDF}
                disabled={exportandoPDF}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
              >
                <FileDown className="w-4 h-4" />
                <span>{exportandoPDF ? 'Generando PDF...' : 'Exportar PDF'}</span>
              </button>

              <button
                id="btn-exportar-proyeccion-excel"
                onClick={handleExportarExcel}
                disabled={exportandoExcel}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{exportandoExcel ? 'Exportando...' : 'Excel (.xlsx)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Indicador de Google Drive */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Semestre Base de Referencia: {analisis.kpisBase.totalAlumnos} alumnos históricos evaluados</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <Cloud className={`w-3.5 h-3.5 ${isDriveConnected ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span>{isDriveConnected ? 'Sincronización en Google Drive activa' : 'Google Drive no vinculado'}</span>
          </div>
        </div>
      </div>

      {/* 2. Barra de Control de Parámetros y Escenarios */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Ajustes de Parámetros & Escenarios Macroeconómicos
            </h3>
          </div>

          {/* Selector de Escenario Rápido */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              id="escenario-btn-conservador"
              type="button"
              onClick={() => handleSeleccionarEscenario('conservador')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                escenarioActivo === 'conservador'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              🛡️ Conservador
            </button>
            <button
              id="escenario-btn-base"
              type="button"
              onClick={() => handleSeleccionarEscenario('base')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                escenarioActivo === 'base'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              ⚖️ Base (Esperado)
            </button>
            <button
              id="escenario-btn-optimista"
              type="button"
              onClick={() => handleSeleccionarEscenario('optimista')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                escenarioActivo === 'optimista'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              🚀 Expansión (Optimista)
            </button>
            <button
              id="escenario-btn-personalizado"
              type="button"
              onClick={() => handleSeleccionarEscenario('personalizado')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                escenarioActivo === 'personalizado'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              ✏️ Personalizado
            </button>
          </div>
        </div>

        {/* 4 Sliders Interactivos de Simulación */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* 1. Crecimiento de Matrícula */}
          <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                Matrícula de Alumnos
              </span>
              <span className={`font-mono font-extrabold px-2 py-0.5 rounded text-xs ${
                crecimientoMatriculaPct >= 0 ? 'bg-indigo-100 text-indigo-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {crecimientoMatriculaPct >= 0 ? `+${crecimientoMatriculaPct}%` : `${crecimientoMatriculaPct}%`}
              </span>
            </div>
            <input
              id="slider-crecimiento-matricula"
              type="range"
              min="-20"
              max="50"
              step="1"
              value={crecimientoMatriculaPct}
              onChange={(e) => handleCambioParametro(setCrecimientoMatriculaPct, parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>-20% (Contracción)</span>
              <span>+50% (Acelerado)</span>
            </div>
          </div>

          {/* 2. Ajuste Inflacionario Gastos */}
          <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                Inflación General / Gastos
              </span>
              <span className="font-mono font-extrabold px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-900">
                +{inflacionGastosPct}%
              </span>
            </div>
            <input
              id="slider-inflacion-gastos"
              type="range"
              min="0"
              max="20"
              step="0.5"
              value={inflacionGastosPct}
              onChange={(e) => handleCambioParametro(setInflacionGastosPct, parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>0% (Estable)</span>
              <span>Ref. BCH ~5.5%</span>
              <span>+20% (Severa)</span>
            </div>
          </div>

          {/* 3. Ajuste Costos Docentes */}
          <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-blue-600" />
                Ajuste Tarifas Docentes
              </span>
              <span className="font-mono font-extrabold px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-900">
                +{incrementoCostoDocentePct}%
              </span>
            </div>
            <input
              id="slider-costo-docente"
              type="range"
              min="0"
              max="30"
              step="0.5"
              value={incrementoCostoDocentePct}
              onChange={(e) => handleCambioParametro(setIncrementoCostoDocentePct, parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>0% (Sin aumento)</span>
              <span>Revisión Salarial</span>
              <span>+30%</span>
            </div>
          </div>

          {/* 4. Ajuste Precios / Aranceles */}
          <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-emerald-600" />
                Ajuste Precio Arancel
              </span>
              <span className={`font-mono font-extrabold px-2 py-0.5 rounded text-xs ${
                ajustePrecioArancelPct >= 0 ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
              }`}>
                {ajustePrecioArancelPct >= 0 ? `+${ajustePrecioArancelPct}%` : `${ajustePrecioArancelPct}%`}
              </span>
            </div>
            <input
              id="slider-ajuste-precio"
              type="range"
              min="-10"
              max="30"
              step="0.5"
              value={ajustePrecioArancelPct}
              onChange={(e) => handleCambioParametro(setAjustePrecioArancelPct, parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>-10% (Descuento)</span>
              <span>Indexación</span>
              <span>+30%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Panel de Métricas y Comparativa Clave (Base vs Proyectado) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ingreso Neto Proyectado */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Ingresos Netos Totales</span>
              <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded ${
                analisis.kpisProyectados.deltaIngresosPct >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {analisis.kpisProyectados.deltaIngresosPct >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {analisis.kpisProyectados.deltaIngresosPct >= 0 ? '+' : ''}{analisis.kpisProyectados.deltaIngresosPct.toFixed(1)}%
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {formatearMoneda(analisis.kpisProyectados.totalIngresos, moneda)}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Base Histórica:</span>
            <span className="font-mono font-bold text-slate-700">{formatearMoneda(analisis.kpisBase.totalIngresos, moneda)}</span>
          </div>
        </div>

        {/* Costo Docente Proyectado */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Costo Docente (Honorarios)</span>
              <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                +{analisis.kpisProyectados.deltaCostosDocentesPct.toFixed(1)}%
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-blue-900 font-mono">
              {formatearMoneda(analisis.kpisProyectados.totalCostosDocentes, moneda)}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Tarifa Promedio / Hora:</span>
            <span className="font-mono font-bold text-blue-800">{formatearMoneda(analisis.kpisProyectados.tarifaHoraPromedioDocente, moneda)}/h</span>
          </div>
        </div>

        {/* Gastos Operativos con Inflación */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Gastos Operativos (Inflación)</span>
              <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                +{analisis.kpisProyectados.deltaCostosOperativosPct.toFixed(1)}%
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-900 font-mono">
              {formatearMoneda(analisis.kpisProyectados.totalCostosOperativos, moneda)}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Factor Inflación Aplicado:</span>
            <span className="font-mono font-bold text-amber-800">+{analisis.parametros.inflacionGastosPct}%</span>
          </div>
        </div>

        {/* Utilidad Neta & Margen Proyectado */}
        <div className={`rounded-2xl p-4 border shadow-xs flex flex-col justify-between ${
          analisis.kpisProyectados.utilidadNeta >= 0
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            : 'bg-rose-50/70 border-rose-200 text-rose-950'
        }`}>
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Utilidad Neta Semestral</span>
              <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded ${
                analisis.kpisProyectados.margenPromedio >= 30 ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
              }`}>
                Margen: {analisis.kpisProyectados.margenPromedio.toFixed(1)}%
              </span>
            </div>
            <div className={`text-xl sm:text-2xl font-black font-mono ${
              analisis.kpisProyectados.utilidadNeta >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              {formatearMoneda(analisis.kpisProyectados.utilidadNeta, moneda)}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-emerald-200/60 text-[11px] flex justify-between">
            <span>Punto Equilibrio Semestre:</span>
            <span className="font-mono font-extrabold">{analisis.kpisProyectados.puntoEquilibrioAlumnos} alumnos</span>
          </div>
        </div>
      </div>

      {/* 4. Selector de Pestañas de Vista */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto no-scrollbar pb-1">
        <button
          id="tab-btn-graficos"
          type="button"
          onClick={() => setTabVista('graficos')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            tabVista === 'graficos'
              ? 'bg-indigo-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Gráficos & Escenarios</span>
        </button>

        <button
          id="tab-btn-meses"
          type="button"
          onClick={() => setTabVista('meses')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            tabVista === 'meses'
              ? 'bg-indigo-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Proyección Mensual (6 Meses)</span>
        </button>

        <button
          id="tab-btn-programas"
          type="button"
          onClick={() => setTabVista('programas')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            tabVista === 'programas'
              ? 'bg-indigo-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Detalle por Programa ({analisis.programas.length})</span>
        </button>

        <button
          id="tab-btn-sensibilidad"
          type="button"
          onClick={() => setTabVista('sensibilidad')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            tabVista === 'sensibilidad'
              ? 'bg-indigo-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Elasticidad Docente & Dictamen</span>
        </button>
      </div>

      {/* 5. Contenido de las Pestañas */}

      {/* TAB 1: Gráficos & Visualizaciones */}
      {tabVista === 'graficos' && (
        <div className="space-y-6">
          {/* Gráfico 1: Evolución Mes a Mes */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  Proyección Mensual: Ingresos, Costos Docentes e Inflación vs Utilidad Neta
                </h4>
                <p className="text-xs text-slate-500">
                  Comportamiento proyectado de los 6 meses del ciclo académico {analisis.etiquetaSemestre}.
                </p>
              </div>
              <div className="text-xs text-slate-600 font-semibold bg-slate-100 px-2.5 py-1 rounded-lg">
                Utilidad Total: <strong className="text-emerald-700 font-mono">{formatearMoneda(analisis.kpisProyectados.utilidadNeta, moneda)}</strong>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={analisis.mesesProyectados} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="etiquetaMes" tick={{ fontSize: 11 }} />
                  <YAxis
                    yAxisId="dinero"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    yAxisId="porcentaje"
                    orientation="right"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${v.toFixed(0)}%`}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => {
                      if (name === 'Margen %') return [`${Number(value).toFixed(1)}%`, name];
                      return [formatearMoneda(Number(value), moneda), name];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Bar yAxisId="dinero" dataKey="ingresosProyectados" name="Ingreso Proyectado" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="dinero" dataKey="costosDocentesAjustados" name="Costo Docente" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="dinero" dataKey="costosOperativosConInflacion" name="Gastos Operativos (Inf)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="dinero" type="monotone" dataKey="utilidadProyectada" name="Utilidad Neta" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                  <Line yAxisId="porcentaje" type="monotone" dataKey="margenProyectado" name="Margen %" stroke="#8b5cf6" strokeDasharray="4 4" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 2 & 3: Comparativa de Escenarios y Estructura del Costo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Comparativa de los 3 Escenarios */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">
                  Comparativa de Escenarios Financieros
                </h4>
                <p className="text-xs text-slate-500 mb-4">
                  Conservador (estancamiento) vs Base (esperado) vs Expansión (alta matrícula).
                </p>

                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analisis.comparativaEscenarios} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="nombre"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v) => v.split(' ')[1] || v}
                      />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(value: any, name: any) => [formatearMoneda(Number(value), moneda), name]}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="ingresos" name="Ingresos" fill="#6366f1" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="costoTotal" name="Costo Total" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="utilidad" name="Utilidad Neta" fill="#10b981" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Mini tabla de márgenes por escenario */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center text-xs mt-3">
                {analisis.comparativaEscenarios.map((esc) => (
                  <div key={esc.id} className="p-2 rounded-lg bg-slate-50 border border-slate-200/60">
                    <span className="block text-[10px] text-slate-500 font-semibold uppercase">
                      {esc.id}
                    </span>
                    <span className={`text-sm font-mono font-bold ${
                      esc.margen >= 30 ? 'text-emerald-700' : 'text-amber-700'
                    }`}>
                      {esc.margen.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Estructura del Costo y Distribución de Ingresos */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">
                  Composición del Ingreso Semestral Proyectado
                </h4>
                <p className="text-xs text-slate-500 mb-3">
                  Distribución entre honorarios docentes, gastos operativos con inflación y utilidad.
                </p>

                <div className="h-56 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={datosEstructuraCosto}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                      >
                        {datosEstructuraCosto.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => formatearMoneda(Number(v), moneda)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Leyenda de la distribución */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                {datosEstructuraCosto.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <span className="text-slate-700">{item.name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      {formatearMoneda(item.value, moneda)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Proyección Mensual (Mes a Mes) */}
      {tabVista === 'meses' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                Calendario de Proyección Financiera Mes a Mes ({analisis.etiquetaSemestre})
              </h4>
              <p className="text-xs text-slate-500">
                Detalle proyectado con estacionalidad académica y ajustes salariales e inflacionarios.
              </p>
            </div>
            <div className="text-xs font-mono font-bold text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
              6 Meses Calendario
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                  <th className="py-2.5 px-3">Mes Calendario</th>
                  <th className="py-2.5 px-3 text-right">Matrícula Estimada</th>
                  <th className="py-2.5 px-3 text-right">Ingresos Proyectados</th>
                  <th className="py-2.5 px-3 text-right">Costo Docente</th>
                  <th className="py-2.5 px-3 text-right">Gastos Ops. (Inf)</th>
                  <th className="py-2.5 px-3 text-right">Costo Total</th>
                  <th className="py-2.5 px-3 text-right">Utilidad Neta</th>
                  <th className="py-2.5 px-3 text-right">Margen %</th>
                  <th className="py-2.5 px-3 text-center">Punto Eq.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analisis.mesesProyectados.map((m) => (
                  <tr key={m.mesKey} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-800 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      {m.etiquetaMes}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {m.alumnosProyectados} alumnos
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatearMoneda(m.ingresosProyectados, moneda)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-blue-700">
                      {formatearMoneda(m.costosDocentesAjustados, moneda)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-amber-700">
                      {formatearMoneda(m.costosOperativosConInflacion, moneda)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800">
                      {formatearMoneda(m.costoTotalProyectado, moneda)}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-mono font-extrabold ${
                      m.utilidadProyectada >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {formatearMoneda(m.utilidadProyectada, moneda)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                        m.margenProyectado >= 30 ? 'bg-emerald-100 text-emerald-800' : m.margenProyectado >= 15 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {m.margenProyectado.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                      {m.puntoEquilibrioAlumnos} alum.
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-900 text-white font-bold border-t border-slate-800 text-xs">
                <tr>
                  <td className="py-3 px-3">TOTAL SEMESTRE</td>
                  <td className="py-3 px-3 text-right font-mono">{analisis.kpisProyectados.totalAlumnos} alumnos</td>
                  <td className="py-3 px-3 text-right font-mono">{formatearMoneda(analisis.kpisProyectados.totalIngresos, moneda)}</td>
                  <td className="py-3 px-3 text-right font-mono text-blue-300">{formatearMoneda(analisis.kpisProyectados.totalCostosDocentes, moneda)}</td>
                  <td className="py-3 px-3 text-right font-mono text-amber-300">{formatearMoneda(analisis.kpisProyectados.totalCostosOperativos, moneda)}</td>
                  <td className="py-3 px-3 text-right font-mono">{formatearMoneda(analisis.kpisProyectados.costoTotal, moneda)}</td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-400">{formatearMoneda(analisis.kpisProyectados.utilidadNeta, moneda)}</td>
                  <td className="py-3 px-3 text-right font-mono text-indigo-300">{analisis.kpisProyectados.margenPromedio.toFixed(1)}%</td>
                  <td className="py-3 px-3 text-center font-mono">{analisis.kpisProyectados.puntoEquilibrioAlumnos} alum.</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Detalle por Programa Educativo */}
      {tabVista === 'programas' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                Proyección Detallada por Programa / Curso Educativo
              </h4>
              <p className="text-xs text-slate-500">
                Impacto individual del incremento docente (+{incrementoCostoDocentePct}%) y gastos (+{inflacionGastosPct}%) en cada programa.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar programa o docente..."
                value={filtroBusqueda}
                onChange={(e) => setFiltroBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                  <th className="py-2.5 px-3">Programa Educativo</th>
                  <th className="py-2.5 px-3">Docente Asignado</th>
                  <th className="py-2.5 px-3 text-center">Horas</th>
                  <th className="py-2.5 px-3 text-right">Alumnos Proy.</th>
                  <th className="py-2.5 px-3 text-right">Tarifa Docente</th>
                  <th className="py-2.5 px-3 text-right">Costo Total Proy.</th>
                  <th className="py-2.5 px-3 text-right">Precio Alumno</th>
                  <th className="py-2.5 px-3 text-right">Ingreso Proy.</th>
                  <th className="py-2.5 px-3 text-right">Utilidad Proy.</th>
                  <th className="py-2.5 px-3 text-right">Margen %</th>
                  <th className="py-2.5 px-3">Dictamen / Recomendación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {programasFiltrados.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-xs truncate">
                      {p.nombre}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {p.docente}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {p.horasClase}h
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      <span className="font-bold">{p.alumnosProyectados}</span>
                      <span className="text-[10px] text-slate-400 block">base: {p.alumnosBase}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-blue-700">
                      <span className="font-bold">{formatearMoneda(p.tarifaDocenteAjustada, moneda)}/h</span>
                      <span className="text-[10px] text-slate-400 block">base: {formatearMoneda(p.tarifaDocenteBase, moneda)}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800">
                      {formatearMoneda(p.costoTotalProyectado, moneda)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-800">
                      <span className="font-bold">{formatearMoneda(p.precioAjustado, moneda)}</span>
                      <span className="text-[10px] text-slate-400 block">base: {formatearMoneda(p.precioBase, moneda)}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatearMoneda(p.ingresoProyectado, moneda)}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-mono font-extrabold ${
                      p.utilidadProyectada >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {formatearMoneda(p.utilidadProyectada, moneda)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                        p.estadoSemaforo === 'optimo' ? 'bg-emerald-100 text-emerald-800' : p.estadoSemaforo === 'moderado' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {p.margenProyectado.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-600">
                      {p.recomendacion}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Elasticidad Docente & Dictamen Estratégico */}
      {tabVista === 'sensibilidad' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tarjeta de Diagnóstico Principal */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h4 className="text-base font-bold text-slate-900">
                Dictamen Ejecutivo de Sostenibilidad Semestral
              </h4>
            </div>

            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              analisis.diagnosticoEjecutivo.nivelRiesgo === 'Bajo'
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : analisis.diagnosticoEjecutivo.nivelRiesgo === 'Moderado'
                ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                : 'bg-rose-50/80 border-rose-200 text-rose-950'
            }`}>
              <div className="shrink-0 mt-0.5">
                {analisis.diagnosticoEjecutivo.nivelRiesgo === 'Bajo' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                )}
              </div>
              <div className="space-y-1">
                <div className="font-bold text-sm flex items-center gap-2">
                  <span>{analisis.diagnosticoEjecutivo.titulo}</span>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    analisis.diagnosticoEjecutivo.nivelRiesgo === 'Bajo'
                      ? 'bg-emerald-200 text-emerald-900'
                      : 'bg-amber-200 text-amber-900'
                  }`}>
                    Riesgo {analisis.diagnosticoEjecutivo.nivelRiesgo}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-700">
                  {analisis.diagnosticoEjecutivo.resumen}
                </p>
              </div>
            </div>

            {/* Recomendaciones Estratégicas */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Recomendaciones Ejecutivas de Blindaje Financiero:
              </span>
              <ul className="space-y-2">
                {analisis.diagnosticoEjecutivo.recomendaciones.map((reco, idx) => (
                  <li key={idx} className="text-xs text-slate-700 flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                    <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{reco}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Tarjetas de Elasticidad y Sensibilidad */}
          <div className="space-y-4">
            {/* Elasticidad Docente */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-blue-700 text-xs font-bold">
                <Percent className="w-4 h-4" />
                <span>Elasticidad del Costo Docente</span>
              </div>
              <div className="text-2xl font-black font-mono text-slate-900">
                {analisis.elasticidad.impacto1PctDocenteEnMargen.toFixed(2)} pts
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Por cada <strong>1% de aumento salarial docente</strong> sin indexar los precios a los alumnos,
                el margen operativo institucional cae en <strong>{analisis.elasticidad.impacto1PctDocenteEnMargen.toFixed(2)} puntos</strong>.
              </p>
            </div>

            {/* Arancel Mínimo Compensatorio */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
                <DollarSign className="w-4 h-4" />
                <span>Arancel Compensatorio Sugerido</span>
              </div>
              <div className="text-2xl font-black font-mono text-emerald-700">
                +{analisis.elasticidad.arancelMinimoCompensatorioPct.toFixed(1)}%
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Incremento arancelario mínimo por alumno para neutralizar la inflación del {analisis.parametros.inflacionGastosPct}% y
                el alza docente del {analisis.parametros.incrementoCostoDocentePct}% manteniendo el margen base.
              </p>
            </div>

            {/* Alumnos Necesarios */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold">
                <GraduationCap className="w-4 h-4" />
                <span>Alumnos Extra Requeridos</span>
              </div>
              <div className="text-2xl font-black font-mono text-indigo-900">
                +{analisis.elasticidad.alumnosAdicionalesNecesarios} alumnos
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Si la institución decide congelar los precios de matrícula para no afectar a los estudiantes,
                se requerirá captar <strong>{analisis.elasticidad.alumnosAdicionalesNecesarios} alumnos adicionales</strong> en el semestre.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
