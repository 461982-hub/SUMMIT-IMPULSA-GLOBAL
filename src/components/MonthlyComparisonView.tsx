import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { 
  CalendarDays, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Layers, 
  DollarSign, 
  Users, 
  Award, 
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Filter,
  FileDown,
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  ClipboardCheck,
  Scale,
  Target
} from 'lucide-react';
import { ProyectoEducativo, Moneda, ResumenMensual } from '../types';
import { formatearMoneda } from '../utils/calculations';
import { formatearHNL } from '../utils/poa2027Data';
import { 
  calcularResumenesMensuales, 
  compararDosMeses, 
  formatearEtiquetaMes 
} from '../utils/monthUtils';
import { 
  cargarCierresMensuales, 
  calcularRegistroCierreMes, 
  obtenerAlertasGlobalesCierre, 
  obtenerResumenCierresAnio,
  META_MENSUAL_PROYECTOS_POA,
  BREAK_EVEN_PROYECTOS_POA,
  MARGEN_POA_META_PCT
} from '../utils/monthlyCloseUtils';
import { POAMonthlyDeductionTrackingView } from './executive/POAMonthlyDeductionTrackingView';

interface MonthlyComparisonViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onFiltrarPorMes?: (mesKey: string) => void;
  onVerProyectoDetalle?: (proyecto: ProyectoEducativo) => void;
  onExportarReporteMesPDF?: (mesKey: string) => void;
  onAbrirCierreMensual?: (mesKey?: string) => void;
  onGuardarProyecto?: (proyecto: ProyectoEducativo) => void;
}

export const MonthlyComparisonView: React.FC<MonthlyComparisonViewProps> = ({
  proyectos,
  moneda,
  onFiltrarPorMes,
  onVerProyectoDetalle,
  onExportarReporteMesPDF,
  onAbrirCierreMensual,
  onGuardarProyecto,
}) => {
  const resumenesMensuales = useMemo(() => calcularResumenesMensuales(proyectos), [proyectos]);

  // Registros de Cierre Mensual & Alertas POA
  const cierresGuardados = useMemo(() => cargarCierresMensuales(), [proyectos]);
  const alertasCierres = useMemo(() => obtenerAlertasGlobalesCierre(proyectos, moneda), [proyectos, moneda]);
  const resumenCierres = useMemo(() => obtenerResumenCierresAnio(proyectos, moneda), [proyectos, moneda]);

  // Selección de meses para comparador cara a cara
  const [mesBaseKey, setMesBaseKey] = useState<string>(() => {
    if (resumenesMensuales.length >= 2) return resumenesMensuales[resumenesMensuales.length - 2].mesKey;
    if (resumenesMensuales.length === 1) return resumenesMensuales[0].mesKey;
    return '';
  });

  const [mesComparadoKey, setMesComparadoKey] = useState<string>(() => {
    if (resumenesMensuales.length >= 1) return resumenesMensuales[resumenesMensuales.length - 1].mesKey;
    return '';
  });

  // Fila expandida en la matriz mensual
  const [mesExpandido, setMesExpandido] = useState<string | null>(null);

  // Modo de visualización: 'evolucion' | 'cara-a-cara' | 'tabla' | 'cierres' | 'poa_rebaja'
  const [tabModo, setTabModo] = useState<'evolucion' | 'cara-a-cara' | 'tabla' | 'cierres' | 'poa_rebaja'>('evolucion');

  // Cálculos consolidados para KPIs
  const totalMeses = resumenesMensuales.length;
  const mejorMes = useMemo(() => {
    if (resumenesMensuales.length === 0) return null;
    return [...resumenesMensuales].sort((a, b) => b.totalGananciasFinales - a.totalGananciasFinales)[0];
  }, [resumenesMensuales]);

  const totalGananciaGlobal = resumenesMensuales.reduce((acc, m) => acc + m.totalGananciasFinales, 0);
  const promedioGananciaMensual = totalMeses > 0 ? totalGananciaGlobal / totalMeses : 0;
  const totalAlumnosGlobal = resumenesMensuales.reduce((acc, m) => acc + m.alumnosReales, 0);
  const promedioAlumnosMensual = totalMeses > 0 ? Math.round(totalAlumnosGlobal / totalMeses) : 0;

  // Comparación cara a cara
  const objMesBase = resumenesMensuales.find(m => m.mesKey === mesBaseKey);
  const objMesComparado = resumenesMensuales.find(m => m.mesKey === mesComparadoKey);
  const resultadoComparativa = useMemo(() => {
    if (objMesBase && objMesComparado) {
      return compararDosMeses(objMesBase, objMesComparado);
    }
    return null;
  }, [objMesBase, objMesComparado]);

  // Datos para gráficos de evolución
  const datosGraficoFinanciero = resumenesMensuales.map(m => ({
    mes: m.etiquetaCorta,
    mesCompleto: m.etiquetaMes,
    Ingresos: m.ingresoRealTotal,
    Gastos: m.gastoTotalOperativo,
    Ganancia: m.totalGananciasFinales,
    Margen: Math.round(m.margenRealPromedio),
    ROI: Math.round(m.roiPromedio),
  }));

  const datosGraficoAlumnos = resumenesMensuales.map(m => ({
    mes: m.etiquetaCorta,
    Proyectados: m.alumnosProyectados,
    Inscritos: m.alumnosReales,
    Cursos: m.totalProyectos,
  }));

  if (proyectos.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 shadow-xs space-y-3">
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
          <CalendarDays className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">
          Control Mensual y Comparativas
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          A medida que registres tus cursos y programas con su fecha de programación o fecha de venta, el sistema organizará automáticamente los cierres mensuales para comparar ingresos, gastos y rendimientos mes a mes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Encabezado y Selector de Sub-Modos */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-xs">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Control y Comparativa Mensual
              </h2>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                {totalMeses} {totalMeses === 1 ? 'Mes Registrado' : 'Meses Analizados'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Evaluación de crecimiento, rendimiento financiero y variación de utilidades mes a mes
            </p>
          </div>
        </div>

        {/* Pestañas de la Comparativa */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-medium self-start md:self-auto flex-wrap gap-1">
          <button
            onClick={() => setTabModo('evolucion')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              tabModo === 'evolucion'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            <span>Evolución Histórica</span>
          </button>

          <button
            onClick={() => setTabModo('cara-a-cara')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              tabModo === 'cara-a-cara'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Comparar 2 Meses (A vs B)</span>
          </button>

          <button
            onClick={() => setTabModo('tabla')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              tabModo === 'tabla'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Matriz de Meses</span>
          </button>

          <button
            onClick={() => setTabModo('cierres')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              tabModo === 'cierres'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-purple-600" />
            <span>Auditoría & Cierres POA</span>
          </button>

          <button
            onClick={() => setTabModo('poa_rebaja')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              tabModo === 'poa_rebaja'
                ? 'bg-gradient-to-r from-emerald-700 to-indigo-800 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-emerald-500" />
            <span>Rebaja Mensual POA</span>
          </button>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {onAbrirCierreMensual && (
            <button
              onClick={() => onAbrirCierreMensual()}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Gestionar Cierre Mensual de Proyectos y Cumplimiento POA"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Cierre Mensual</span>
            </button>
          )}

          {onExportarReporteMesPDF && (
            <button
              onClick={() => onExportarReporteMesPDF(resumenesMensuales[resumenesMensuales.length - 1]?.mesKey)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer border border-slate-300"
              title="Exportar reporte consolidado en PDF del mes más reciente"
            >
              <FileDown className="w-3.5 h-3.5 text-slate-600" />
              <span>PDF Mes</span>
            </button>
          )}
        </div>
      </div>

      {/* Banner de Alertas Activas de Cierre Mensual */}
      {alertasCierres.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <h4 className="text-xs font-black uppercase tracking-wide">
                Alertas Activas de Cierre Mensual & Break-Even POA ({alertasCierres.length})
              </h4>
            </div>
            {onAbrirCierreMensual && (
              <button
                onClick={() => onAbrirCierreMensual(alertasCierres[0]?.mesKey)}
                className="text-xs font-bold text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Atender Cierre ({alertasCierres[0]?.etiquetaMes})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {alertasCierres.slice(0, 4).map((al) => (
              <div key={al.id} className="p-3 rounded-lg bg-white border border-amber-200 text-xs flex items-start gap-2 shadow-2xs">
                <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${al.nivel === 'CRITICA' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900">{al.titulo}</span>
                  <p className="text-slate-600 leading-relaxed">{al.mensaje}</p>
                  <p className="text-[11px] text-indigo-700 font-medium">💡 {al.accionSugerida}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tarjetas KPI de Cierre Multimes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Mes Más Rentable
            </span>
            <div className="text-base font-bold text-slate-900 mt-0.5 truncate max-w-[170px]">
              {mejorMes ? mejorMes.etiquetaMes : '-'}
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
              {mejorMes ? formatearMoneda(mejorMes.totalGananciasFinales, moneda) : '0'} en utilidades
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Promedio Ganancia / Mes
            </span>
            <div className="text-base font-bold text-slate-900 mt-0.5">
              {formatearMoneda(promedioGananciaMensual, moneda)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Total periodo: {formatearMoneda(totalGananciaGlobal, moneda)}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Promedio Alumnos / Mes
            </span>
            <div className="text-base font-bold text-slate-900 mt-0.5">
              {promedioAlumnosMensual} alumnos
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {totalAlumnosGlobal} alumnos acumulados
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Cursos Realizados
            </span>
            <div className="text-base font-bold text-slate-900 mt-0.5">
              {resumenesMensuales.reduce((acc, m) => acc + m.proyectosRealizados, 0)} / {proyectos.length}
            </div>
            <p className="text-[11px] text-purple-700 font-semibold mt-0.5">
              {resumenesMensuales.reduce((acc, m) => acc + m.proyectosEnCurso, 0)} actualmente en curso
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* CONTENIDO SEGÚN SUB-MODO */}

      {/* 1. MODO: EVOLUCIÓN HISTÓRICA MES A MES */}
      {tabModo === 'evolucion' && (
        <div className="space-y-6">
          
          {/* Gráfico Principal de Ingresos, Gastos y Ganancias por Mes */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Evolución Financiera Mensual (Gastos vs Ingresos vs Utilidad)
                </h3>
                <p className="text-xs text-slate-500">
                  Comparativa de flujo de caja y rentabilidad acumulada por periodo mensual en {moneda}
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosGraficoFinanciero} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(v) => `${v.toLocaleString()}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatearMoneda(value, moneda), '']}
                    labelFormatter={(label) => `Mes: ${label}`}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Gastos" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Gasto Operativo Total" />
                  <Bar dataKey="Ingresos" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Ingreso Total Real" />
                  <Bar dataKey="Ganancia" fill="#10b981" radius={[4, 4, 0, 0]} name="Ganancia Neta Final" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grid de 2 Gráficos de Tendencia: Alumnos y Márgenes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Gráfico de Alumnos por Mes */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Alumnos: Meta Proyectada vs Inscritos Reales
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Comportamiento de la matrícula y volumen de estudiantes por mes
              </p>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datosGraficoAlumnos} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="Proyectados" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Meta Alumnos" />
                    <Bar dataKey="Inscritos" fill="#6366f1" radius={[4, 4, 0, 0]} name="Alumnos Reales" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico de Línea: ROI y Margen % */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Tendencia de Margen Real y ROI (%)
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Porcentaje de rendimiento sobre inversión operativa
              </p>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={datosGraficoFinanciero} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis 
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value}%`, '']}
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="Margen" stroke="#a855f7" strokeWidth={2.5} dot={{ r: 4 }} name="Margen Real %" />
                    <Line type="monotone" dataKey="ROI" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} name="ROI %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 2. MODO: COMPARADOR CARA A CARA (MES A vs MES B) */}
      {tabModo === 'cara-a-cara' && (
        <div className="space-y-6">
          
          {/* Selector de Meses a Comparar */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Selecciona los 2 Meses para la Comparación Directa</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Mes Base de Referencia (Mes A):
                </label>
                <select
                  value={mesBaseKey}
                  onChange={(e) => setMesBaseKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  {resumenesMensuales.map((m) => (
                    <option key={`base-${m.mesKey}`} value={m.mesKey}>
                      {m.etiquetaMes} ({m.totalProyectos} cursos • {formatearMoneda(m.totalGananciasFinales, moneda)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-200 space-y-2">
                <label className="block text-xs font-bold text-indigo-950">
                  Mes a Evaluar / Comparar (Mes B):
                </label>
                <select
                  value={mesComparadoKey}
                  onChange={(e) => setMesComparadoKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold bg-white border border-indigo-300 rounded-lg text-indigo-950 focus:ring-2 focus:ring-indigo-500"
                >
                  {resumenesMensuales.map((m) => (
                    <option key={`comp-${m.mesKey}`} value={m.mesKey}>
                      {m.etiquetaMes} ({m.totalProyectos} cursos • {formatearMoneda(m.totalGananciasFinales, moneda)})
                    </option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          {/* Resultado de la Comparación Cara a Cara */}
          {resultadoComparativa && (
            <div className="space-y-6">
              
              {/* Tarjetas de Variación (Delta Δ) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Variación en Ingresos */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">
                    Variación de Ingresos
                  </span>
                  <div className={`text-lg font-black flex items-center gap-1 ${
                    resultadoComparativa.deltaIngresos >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {resultadoComparativa.deltaIngresos >= 0 ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5" />
                    )}
                    <span>{formatearMoneda(resultadoComparativa.deltaIngresos, moneda)}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {resultadoComparativa.deltaIngresosPct >= 0 ? '+' : ''}
                    {resultadoComparativa.deltaIngresosPct.toFixed(1)}% vs {resultadoComparativa.mesBase.etiquetaCorta}
                  </p>
                </div>

                {/* Variación en Utilidad Neta */}
                <div className={`p-4 rounded-xl border shadow-xs space-y-1 ${
                  resultadoComparativa.deltaGanancias >= 0 ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'
                }`}>
                  <span className="text-[11px] font-bold uppercase text-slate-700">
                    Variación Ganancia Neta
                  </span>
                  <div className={`text-lg font-black flex items-center gap-1 ${
                    resultadoComparativa.deltaGanancias >= 0 ? 'text-emerald-800' : 'text-rose-800'
                  }`}>
                    {resultadoComparativa.deltaGanancias >= 0 ? (
                      <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-rose-600" />
                    )}
                    <span>{formatearMoneda(resultadoComparativa.deltaGanancias, moneda)}</span>
                  </div>
                  <p className="text-[11px] font-bold font-mono text-slate-700">
                    {resultadoComparativa.deltaGananciasPct >= 0 ? '+' : ''}
                    {resultadoComparativa.deltaGananciasPct.toFixed(1)}% de crecimiento neto
                  </p>
                </div>

                {/* Variación en Alumnos */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">
                    Variación Alumnos
                  </span>
                  <div className={`text-lg font-black flex items-center gap-1 ${
                    resultadoComparativa.deltaAlumnos >= 0 ? 'text-indigo-700' : 'text-slate-700'
                  }`}>
                    {resultadoComparativa.deltaAlumnos >= 0 ? (
                      <ArrowUpRight className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-rose-600" />
                    )}
                    <span>
                      {resultadoComparativa.deltaAlumnos >= 0 ? `+${resultadoComparativa.deltaAlumnos}` : resultadoComparativa.deltaAlumnos} alumnos
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {resultadoComparativa.deltaAlumnosPct >= 0 ? '+' : ''}
                    {resultadoComparativa.deltaAlumnosPct.toFixed(1)}% en inscripciones
                  </p>
                </div>

                {/* Variación en ROI */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">
                    Variación en ROI
                  </span>
                  <div className={`text-lg font-black flex items-center gap-1 ${
                    resultadoComparativa.deltaROI >= 0 ? 'text-purple-700' : 'text-slate-700'
                  }`}>
                    {resultadoComparativa.deltaROI >= 0 ? (
                      <ArrowUpRight className="w-5 h-5 text-purple-600" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-rose-600" />
                    )}
                    <span>
                      {resultadoComparativa.deltaROI >= 0 ? `+${resultadoComparativa.deltaROI.toFixed(1)}` : resultadoComparativa.deltaROI.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {resultadoComparativa.mesBase.roiPromedio.toFixed(1)}% ➔ {resultadoComparativa.mesComparado.roiPromedio.toFixed(1)}%
                  </p>
                </div>

              </div>

              {/* Tabla Comparativa Lado a Lado */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Desglose Detallado Frente a Frente</span>
                  </h4>
                  <span className="text-[11px] text-slate-300 font-medium">
                    {resultadoComparativa.mesBase.etiquetaMes} vs {resultadoComparativa.mesComparado.etiquetaMes}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                      <tr>
                        <th className="py-3 px-4">Indicador Financiero / Académico</th>
                        <th className="py-3 px-4 text-right font-bold text-slate-900">
                          {resultadoComparativa.mesBase.etiquetaMes} (A)
                        </th>
                        <th className="py-3 px-4 text-right font-bold text-indigo-900 bg-indigo-50/50">
                          {resultadoComparativa.mesComparado.etiquetaMes} (B)
                        </th>
                        <th className="py-3 px-4 text-right font-bold text-slate-900">
                          Diferencia Neta (B - A)
                        </th>
                        <th className="py-3 px-4 text-right font-bold text-slate-900">
                          Impacto %
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      
                      <tr className="hover:bg-slate-50 font-sans">
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          Cursos Totales Ofertados
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">
                          {resultadoComparativa.mesBase.totalProyectos}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono bg-indigo-50/30 font-bold text-indigo-950">
                          {resultadoComparativa.mesComparado.totalProyectos}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold">
                          {resultadoComparativa.deltaProyectos >= 0 ? `+${resultadoComparativa.deltaProyectos}` : resultadoComparativa.deltaProyectos} cursos
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">
                          {resultadoComparativa.mesBase.totalProyectos > 0 
                            ? `${((resultadoComparativa.deltaProyectos / resultadoComparativa.mesBase.totalProyectos) * 100).toFixed(0)}%` 
                            : '-'}
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50 font-sans">
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          Alumnos Reales Matriculados
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">
                          {resultadoComparativa.mesBase.alumnosReales}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono bg-indigo-50/30 font-bold text-indigo-950">
                          {resultadoComparativa.mesComparado.alumnosReales}
                        </td>
                        <td className={`py-2.5 px-4 text-right font-mono font-semibold ${
                          resultadoComparativa.deltaAlumnos >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {resultadoComparativa.deltaAlumnos >= 0 ? `+${resultadoComparativa.deltaAlumnos}` : resultadoComparativa.deltaAlumnos} alumnos
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">
                          {resultadoComparativa.deltaAlumnosPct >= 0 ? '+' : ''}{resultadoComparativa.deltaAlumnosPct.toFixed(1)}%
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50 font-sans">
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          Gasto Total Operativo
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-700">
                          {formatearMoneda(resultadoComparativa.mesBase.gastoTotalOperativo, moneda)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono bg-indigo-50/30 font-bold text-indigo-950">
                          {formatearMoneda(resultadoComparativa.mesComparado.gastoTotalOperativo, moneda)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-800">
                          {formatearMoneda(resultadoComparativa.deltaGastos, moneda)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">
                          {resultadoComparativa.deltaGastosPct >= 0 ? '+' : ''}{resultadoComparativa.deltaGastosPct.toFixed(1)}%
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50 font-sans">
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          Ingreso Real Facturado
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-700">
                          {formatearMoneda(resultadoComparativa.mesBase.ingresoRealTotal, moneda)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono bg-indigo-50/30 font-bold text-indigo-950">
                          {formatearMoneda(resultadoComparativa.mesComparado.ingresoRealTotal, moneda)}
                        </td>
                        <td className={`py-2.5 px-4 text-right font-mono font-bold ${
                          resultadoComparativa.deltaIngresos >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {formatearMoneda(resultadoComparativa.deltaIngresos, moneda)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">
                          {resultadoComparativa.deltaIngresosPct >= 0 ? '+' : ''}{resultadoComparativa.deltaIngresosPct.toFixed(1)}%
                        </td>
                      </tr>

                      <tr className="bg-emerald-50/40 hover:bg-emerald-50/70 font-sans font-bold">
                        <td className="py-3 px-4 text-emerald-950">
                          Ganancia Neta Final (Utilidad)
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-900">
                          {formatearMoneda(resultadoComparativa.mesBase.totalGananciasFinales, moneda)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono bg-indigo-100/50 text-indigo-950 text-sm">
                          {formatearMoneda(resultadoComparativa.mesComparado.totalGananciasFinales, moneda)}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono text-sm ${
                          resultadoComparativa.deltaGanancias >= 0 ? 'text-emerald-800' : 'text-rose-800'
                        }`}>
                          {formatearMoneda(resultadoComparativa.deltaGanancias, moneda)}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono text-sm ${
                          resultadoComparativa.deltaGananciasPct >= 0 ? 'text-emerald-800' : 'text-rose-800'
                        }`}>
                          {resultadoComparativa.deltaGananciasPct >= 0 ? '+' : ''}{resultadoComparativa.deltaGananciasPct.toFixed(1)}%
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50 font-sans">
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          Margen Real Promedio
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">
                          {resultadoComparativa.mesBase.margenRealPromedio.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono bg-indigo-50/30 font-bold text-indigo-950">
                          {resultadoComparativa.mesComparado.margenRealPromedio.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold">
                          {(resultadoComparativa.mesComparado.margenRealPromedio - resultadoComparativa.mesBase.margenRealPromedio).toFixed(1)} pts
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">
                          -
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50 font-sans">
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          Precio Promedio Ticket / Alumno
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-700">
                          {formatearMoneda(resultadoComparativa.mesBase.precioTicketPromedio, moneda)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono bg-indigo-50/30 font-bold text-indigo-950">
                          {formatearMoneda(resultadoComparativa.mesComparado.precioTicketPromedio, moneda)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-800">
                          {formatearMoneda(resultadoComparativa.mesComparado.precioTicketPromedio - resultadoComparativa.mesBase.precioTicketPromedio, moneda)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">
                          -
                        </td>
                      </tr>

                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* 3. MODO: MATRIZ CONSOLIDADA DE CIERRES MENSUALES */}
      {tabModo === 'tabla' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Matriz de Cierres y Controles por Mes</span>
              </h3>
              <p className="text-[11px] text-slate-300">
                Haz clic en cualquier mes para desplegar los cursos realizados y ver sus detalles
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Mes / Periodo</th>
                  <th className="py-3 px-2 text-center">Cursos</th>
                  <th className="py-3 px-2 text-center">Realizados</th>
                  <th className="py-3 px-3 text-center">Alumnos (Meta / Real)</th>
                  <th className="py-3 px-3 text-right">Gasto Operativo</th>
                  <th className="py-3 px-3 text-right">Ingreso Real</th>
                  <th className="py-3 px-3 text-right font-bold text-slate-900">Ganancia Neta</th>
                  <th className="py-3 px-2 text-center">Margen %</th>
                  <th className="py-3 px-2 text-center">ROI %</th>
                  <th className="py-3 px-3 text-center">Estado</th>
                  <th className="py-3 px-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resumenesMensuales.map((m) => {
                  const estaExpandido = mesExpandido === m.mesKey;
                  const esRentable = m.totalGananciasFinales >= 0;

                  return (
                    <React.Fragment key={m.mesKey}>
                      <tr className={`hover:bg-slate-50 transition-colors ${estaExpandido ? 'bg-blue-50/40' : ''}`}>
                        <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                          <button
                            onClick={() => setMesExpandido(estaExpandido ? null : m.mesKey)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                            title="Expandir proyectos del mes"
                          >
                            {estaExpandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <span>{m.etiquetaMes}</span>
                        </td>
                        <td className="py-3 px-2 text-center font-mono font-semibold text-slate-700">
                          {m.totalProyectos}
                        </td>
                        <td className="py-3 px-2 text-center font-mono text-emerald-700 font-semibold">
                          {m.proyectosRealizados}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          <span className="text-slate-500">{m.alumnosProyectados}</span>
                          <span className="text-slate-300 mx-1">/</span>
                          <span className={`font-bold ${m.alumnosReales >= m.alumnosProyectados ? 'text-emerald-700' : 'text-slate-900'}`}>
                            {m.alumnosReales}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          {formatearMoneda(m.gastoTotalOperativo, moneda)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-900 font-semibold">
                          {formatearMoneda(m.ingresoRealTotal, moneda)}
                        </td>
                        <td className={`py-3 px-3 text-right font-mono font-bold ${
                          esRentable ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {formatearMoneda(m.totalGananciasFinales, moneda)}
                        </td>
                        <td className="py-3 px-2 text-center font-mono font-semibold text-purple-700">
                          {m.margenRealPromedio.toFixed(1)}%
                        </td>
                        <td className="py-3 px-2 text-center font-mono font-semibold text-blue-700">
                          {m.roiPromedio.toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            esRentable
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            {esRentable ? 'Rentable' : 'Déficit'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {onAbrirCierreMensual && (
                              <button
                                onClick={() => onAbrirCierreMensual(m.mesKey)}
                                className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                                  cierresGuardados[m.mesKey]?.estado === 'CERRADO_AUDITADO'
                                    ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                                    : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
                                }`}
                                title="Gestionar Cierre y Auditoría POA de este mes"
                              >
                                <Lock className="w-3 h-3" />
                                <span>{cierresGuardados[m.mesKey]?.estado === 'CERRADO_AUDITADO' ? 'Auditado' : 'Cierre'}</span>
                              </button>
                            )}
                            {onFiltrarPorMes && (
                              <button
                                onClick={() => onFiltrarPorMes(m.mesKey)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                                title="Filtrar matriz principal por este mes"
                              >
                                <Filter className="w-3 h-3" />
                                <span>Matriz</span>
                              </button>
                            )}
                            {onExportarReporteMesPDF && (
                              <button
                                onClick={() => onExportarReporteMesPDF(m.mesKey)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors cursor-pointer"
                                title={`Exportar reporte consolidado en PDF de ${m.etiquetaMes}`}
                              >
                                <FileDown className="w-3 h-3 text-rose-600" />
                                <span>PDF</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Fila Desplegable con los cursos de este mes */}
                      {estaExpandido && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={11} className="p-4 border-y border-slate-200">
                            <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
                              <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                                <span>Cursos y Programas Impartidos en {m.etiquetaMes} ({m.proyectos.length})</span>
                                <span className="text-[11px] text-slate-500 font-normal">
                                  Precio Promedio Ticket: {formatearMoneda(m.precioTicketPromedio, moneda)}
                                </span>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                  <thead className="bg-slate-100/70 text-slate-700 font-semibold">
                                    <tr>
                                      <th className="py-2 px-3">Proyecto / Curso</th>
                                      <th className="py-2 px-2">Docente</th>
                                      <th className="py-2 px-2 text-center">Tipo</th>
                                      <th className="py-2 px-2 text-center">Alumnos</th>
                                      <th className="py-2 px-2 text-right">Precio Sugerido</th>
                                      <th className="py-2 px-2 text-right">Gasto</th>
                                      <th className="py-2 px-2 text-right">Ingreso</th>
                                      <th className="py-2 px-3 text-right font-bold">Ganancia Neta</th>
                                      <th className="py-2 px-2 text-center">Estado</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 font-mono">
                                    {m.proyectos.map((p) => (
                                      <tr key={p.id} className="hover:bg-slate-50">
                                        <td className="py-2 px-3 font-sans font-bold text-slate-900">
                                          {onVerProyectoDetalle ? (
                                            <button
                                              onClick={() => onVerProyectoDetalle(p)}
                                              className="text-left hover:text-blue-600 hover:underline"
                                            >
                                              {p.nombreProyecto}
                                            </button>
                                          ) : (
                                            p.nombreProyecto
                                          )}
                                        </td>
                                        <td className="py-2 px-2 font-sans text-slate-700">
                                          {p.nombreDocente}
                                        </td>
                                        <td className="py-2 px-2 text-center font-sans text-[11px]">
                                          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                                            {p.tipoProyecto}
                                          </span>
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                          {p.alumnosFinal} / {p.alumnosProyectados}
                                        </td>
                                        <td className="py-2 px-2 text-right">
                                          {formatearMoneda(p.precioSugeridoAlumno, moneda)}
                                        </td>
                                        <td className="py-2 px-2 text-right text-slate-600">
                                          {formatearMoneda(p.gastoTotalOperativo, moneda)}
                                        </td>
                                        <td className="py-2 px-2 text-right text-slate-900 font-semibold">
                                          {formatearMoneda(p.ingresoRealTotal, moneda)}
                                        </td>
                                        <td className={`py-2 px-3 text-right font-bold ${
                                          p.totalGananciasFinales >= 0 ? 'text-emerald-700' : 'text-rose-700'
                                        }`}>
                                          {formatearMoneda(p.totalGananciasFinales, moneda)}
                                        </td>
                                        <td className="py-2 px-2 text-center font-sans">
                                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                            p.seLlevoACabo === 'Sí' ? 'bg-emerald-100 text-emerald-800' :
                                            p.seLlevoACabo === 'En curso' ? 'bg-blue-100 text-blue-800' :
                                            'bg-slate-100 text-slate-700'
                                          }`}>
                                            {p.seLlevoACabo}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. MODO: TABLERO DE CIERRES MENSUALES & CUMPLIMIENTO POA */}
      {tabModo === 'cierres' && (
        <div className="space-y-4">
          
          {/* Tarjetas Resumen de Cierres */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Meses Evaluados</span>
              <div className="text-2xl font-black text-slate-900">{resumenCierres.totalMesesRegistrados}</div>
              <p className="text-[11px] text-slate-400">Total de periodos con cursos registrados</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-emerald-700 uppercase">Meses Cerrados & Auditados</span>
              <div className="text-2xl font-black text-emerald-700">{resumenCierres.totalMesesCerrados}</div>
              <p className="text-[11px] text-slate-400">Cierres firmados con liquidación formal</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-amber-700 uppercase">Meses Abiertos en Curso</span>
              <div className="text-2xl font-black text-amber-700">{resumenCierres.mesesAbiertos}</div>
              <p className="text-[11px] text-slate-400">Pendientes de conciliación final</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-rose-700 uppercase">Periodos con Alerta / Déficit</span>
              <div className="text-2xl font-black text-rose-700">{resumenCierres.mesesConDeficit}</div>
              <p className="text-[11px] text-slate-400">&lt; 4 cursos (Debajo de Break-Even)</p>
            </div>
          </div>

          {/* Tabla de Cierres y Cumplimiento POA */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-400" />
                  <span>Auditoría de Cierres Mensuales & Metas POA SEP - DIC 2026</span>
                </h3>
                <p className="text-[11px] text-slate-300">
                  Control mensual de cumplimiento de supervivencia operativa (17.25 grupos piloto Break-Even) y meta cuatrimestral (18.5 grupos/mes)
                </p>
              </div>

              {onAbrirCierreMensual && (
                <button
                  onClick={() => onAbrirCierreMensual()}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer self-start sm:self-auto"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Ejecutar Cierre de Periodo</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Periodo / Mes</th>
                    <th className="py-3 px-3 text-center">Estado Oficial</th>
                    <th className="py-3 px-3 text-center">Cursos vs Meta POA</th>
                    <th className="py-3 px-3 text-right">Facturación Real</th>
                    <th className="py-3 px-3 text-right">Gastos Operativos</th>
                    <th className="py-3 px-3 text-right">Superávit Neto</th>
                    <th className="py-3 px-2 text-center">Margen %</th>
                    <th className="py-3 px-3 text-center">Dictamen POA</th>
                    <th className="py-3 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resumenesMensuales.map((m) => {
                    const cierre = calcularRegistroCierreMes(m.mesKey, proyectos, moneda, cierresGuardados[m.mesKey]);
                    const estaCerrado = cierre.estado === 'CERRADO_AUDITADO';
                    const esSobresaliente = cierre.dictamen === 'SOBRESALIENTE';
                    const esCumplido = cierre.dictamen === 'CUMPLIDO_POA';
                    const esBreakEven = cierre.dictamen === 'BREAK_EVEN_MINIMO';
                    const esDeficit = cierre.dictamen === 'DEFICIT_CRITICO';

                    return (
                      <tr key={m.mesKey} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div>{cierre.etiquetaMes}</div>
                          {estaCerrado && cierre.cerradoPor && (
                            <div className="text-[10px] text-slate-400 font-normal">
                              Por: {cierre.cerradoPor}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            estaCerrado
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}>
                            {estaCerrado ? <Lock className="w-3 h-3 text-emerald-600" /> : <Unlock className="w-3 h-3 text-amber-600" />}
                            <span>{estaCerrado ? 'Cerrado & Auditado' : 'Abierto en Curso'}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <div className="space-y-1">
                            <div className="font-mono font-bold text-slate-900">
                              {cierre.proyectosRegistrados} <span className="text-slate-400 font-normal">/ {META_MENSUAL_PROYECTOS_POA} cursos</span>
                            </div>
                            <div className="w-24 mx-auto bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full ${
                                  cierre.proyectosRegistrados >= 10
                                    ? 'bg-emerald-500'
                                    : cierre.proyectosRegistrados >= 4
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(100, (cierre.proyectosRegistrados / 10) * 100)}%` }}
                              />
                            </div>
                            <div className="text-[9px] text-slate-400">
                              B-Even: 4 cursos
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-right font-mono font-semibold text-blue-950">
                          {formatearHNL(cierre.ingresoRealHNL)}
                        </td>

                        <td className="py-3.5 px-3 text-right font-mono text-slate-600">
                          {formatearHNL(cierre.gastoRealHNL)}
                        </td>

                        <td className={`py-3.5 px-3 text-right font-mono font-bold ${
                          cierre.superavitNetoHNL >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {formatearHNL(cierre.superavitNetoHNL)}
                        </td>

                        <td className="py-3.5 px-2 text-center font-mono font-bold text-purple-700">
                          {cierre.margenOperativoReal.toFixed(1)}%
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            esSobresaliente
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : esCumplido
                              ? 'bg-teal-100 text-teal-900 border border-teal-300'
                              : esBreakEven
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-rose-100 text-rose-900 border border-rose-300'
                          }`}>
                            {esSobresaliente ? '🟢 Sobresaliente' : esCumplido ? '🟢 Cumplido POA' : esBreakEven ? '🟡 Break-Even Cubierto' : '🔴 Déficit Crítico'}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {onAbrirCierreMensual && (
                              <button
                                onClick={() => onAbrirCierreMensual(m.mesKey)}
                                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                                  estaCerrado 
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                }`}
                                title={estaCerrado ? 'Ver acta oficial y auditoría' : 'Auditar y ejecutar cierre del periodo'}
                              >
                                <Lock className="w-3 h-3" />
                                <span>{estaCerrado ? 'Ver Acta' : 'Cerrar Mes'}</span>
                              </button>
                            )}

                            {onExportarReporteMesPDF && (
                              <button
                                onClick={() => onExportarReporteMesPDF(m.mesKey)}
                                className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer border border-slate-200"
                                title="Exportar reporte PDF"
                              >
                                <FileDown className="w-3 h-3 text-slate-600" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* VISTA 5: SEGUIMIENTO DE REBAJA MENSUAL DE FACTURACIÓN POA SEP - DIC 2026 */}
      {tabModo === 'poa_rebaja' && (
        <div className="space-y-6">
          <POAMonthlyDeductionTrackingView
            proyectos={proyectos}
            moneda={moneda}
            onGuardarProyecto={onGuardarProyecto}
            onVerDetalle={onVerProyectoDetalle}
            filtroMesInicial={mesComparadoKey || mesBaseKey}
          />
        </div>
      )}

    </div>
  );
};
