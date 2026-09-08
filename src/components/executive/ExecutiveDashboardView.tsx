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
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  Percent,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Award,
  DollarSign,
  ShieldCheck,
  Target,
  BarChart3,
  Sparkles,
  PieChart as PieChartIcon,
  HelpCircle,
  GraduationCap,
  ChevronRight,
  Flame
} from 'lucide-react';
import { ProyectoEducativo, Moneda, TipoProyecto } from '../../types';
import { formatearMoneda } from '../../utils/calculations';
import { DocenteRentabilidadHistoricaView } from './DocenteRentabilidadHistoricaView';
import { SegmentosRentabilidadHeatmapView } from './SegmentosRentabilidadHeatmapView';

interface ExecutiveDashboardViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onVerDetalle: (p: ProyectoEducativo) => void;
  onEditarProyecto: (p: ProyectoEducativo) => void;
}

type TipoGrafico = 'roi_margen' | 'ingresos_gastos_utilidad' | 'por_tipo' | 'rentabilidad_docentes' | 'mapa_calor';

export const ExecutiveDashboardView: React.FC<ExecutiveDashboardViewProps> = ({
  proyectos,
  moneda,
  onVerDetalle,
  onEditarProyecto,
}) => {
  const [tipoGrafico, setTipoGrafico] = useState<TipoGrafico>('roi_margen');
  const [filtroNivel, setFiltroNivel] = useState<string>('todos');

  // Filtrado de proyectos si se selecciona un tipo específico
  const proyectosFiltrados = useMemo(() => {
    if (filtroNivel === 'todos') return proyectos;
    return proyectos.filter((p) => p.tipoProyecto === filtroNivel);
  }, [proyectos, filtroNivel]);

  // 1. Cálculos Financieros Globales
  const totalInversionGastos = useMemo(() => {
    return proyectos.reduce((acc, p) => acc + (p.gastoTotalOperativo || 0), 0);
  }, [proyectos]);

  const totalIngresoNeto = useMemo(() => {
    return proyectos.reduce((acc, p) => acc + (p.ingresoTotalNeto || p.ingresoRealTotal || 0), 0);
  }, [proyectos]);

  const totalUtilidadNeta = useMemo(() => {
    return proyectos.reduce((acc, p) => acc + (p.totalGananciasFinales || 0), 0);
  }, [proyectos]);

  // 2. Margen de Ganancia Promedio
  const margenPromedioConfigurado = useMemo(() => {
    if (proyectos.length === 0) return 0;
    return proyectos.reduce((acc, p) => acc + (p.margenGananciaOperativa || 0), 0) / proyectos.length;
  }, [proyectos]);

  const margenRealConsolidado = useMemo(() => {
    if (totalIngresoNeto <= 0) return 0;
    return (totalUtilidadNeta / totalIngresoNeto) * 100;
  }, [totalUtilidadNeta, totalIngresoNeto]);

  // 3. Tasa de Éxito de Proyectos
  const proyectosExitosos = useMemo(() => {
    return proyectos.filter((p) => p.totalGananciasFinales >= 0);
  }, [proyectos]);

  const proyectosConPerdida = useMemo(() => {
    return proyectos.filter((p) => p.totalGananciasFinales < 0);
  }, [proyectos]);

  const tasaExito = useMemo(() => {
    if (proyectos.length === 0) return 0;
    return (proyectosExitosos.length / proyectos.length) * 100;
  }, [proyectos, proyectosExitosos]);

  const proyectosSuperanPuntoEquilibrio = useMemo(() => {
    return proyectos.filter((p) => p.alumnosFinal >= (p.puntoEquilibrioAlumnos || 0)).length;
  }, [proyectos]);

  const tasaPuntoEquilibrio = useMemo(() => {
    if (proyectos.length === 0) return 0;
    return (proyectosSuperanPuntoEquilibrio / proyectos.length) * 100;
  }, [proyectos, proyectosSuperanPuntoEquilibrio]);

  // 4. Retorno de Inversión Proyectado (ROI Proyectado)
  const roiProyectadoConsolidado = useMemo(() => {
    if (totalInversionGastos <= 0) return 0;
    return (totalUtilidadNeta / totalInversionGastos) * 100;
  }, [totalUtilidadNeta, totalInversionGastos]);

  const multiplicadorInversion = useMemo(() => {
    if (totalInversionGastos <= 0) return 0;
    return (totalIngresoNeto / totalInversionGastos);
  }, [totalIngresoNeto, totalInversionGastos]);

  // 5. Datos para el Gráfico de Barras por Proyecto (ROI & Margen)
  const datosGraficoProyectos = useMemo(() => {
    return proyectosFiltrados.map((p) => {
      const nombreCorto = p.nombreProyecto.length > 20
        ? p.nombreProyecto.substring(0, 18) + '...'
        : p.nombreProyecto;

      return {
        id: p.id,
        nombre: nombreCorto,
        nombreCompleto: p.nombreProyecto,
        docente: p.nombreDocente,
        roi: Number(p.roiPorcentaje.toFixed(1)),
        margen: Number(p.margenGananciaOperativa.toFixed(1)),
        margenReal: p.ingresoTotalNeto > 0 ? Number(((p.totalGananciasFinales / p.ingresoTotalNeto) * 100).toFixed(1)) : 0,
        gastos: p.gastoTotalOperativo,
        ingresos: p.ingresoTotalNeto || p.ingresoRealTotal,
        utilidad: p.totalGananciasFinales,
        alumnos: p.alumnosFinal,
        puntoEquilibrio: p.puntoEquilibrioAlumnos,
        tipo: p.tipoProyecto,
        proyectoOriginal: p,
      };
    });
  }, [proyectosFiltrados]);

  // 6. Datos agrupados por Tipo de Proyecto
  const datosGraficoPorTipo = useMemo(() => {
    const agrupado: Record<string, { tipo: string; count: number; gastos: number; ingresos: number; utilidad: number }> = {};
    proyectos.forEach((p) => {
      const tipo = p.tipoProyecto || 'CURSO';
      if (!agrupado[tipo]) {
        agrupado[tipo] = { tipo, count: 0, gastos: 0, ingresos: 0, utilidad: 0 };
      }
      agrupado[tipo].count += 1;
      agrupado[tipo].gastos += p.gastoTotalOperativo || 0;
      agrupado[tipo].ingresos += (p.ingresoTotalNeto || p.ingresoRealTotal || 0);
      agrupado[tipo].utilidad += p.totalGananciasFinales || 0;
    });

    return Object.values(agrupado).map((item) => {
      const roi = item.gastos > 0 ? Number(((item.utilidad / item.gastos) * 100).toFixed(1)) : 0;
      const margen = item.ingresos > 0 ? Number(((item.utilidad / item.ingresos) * 100).toFixed(1)) : 0;
      return {
        ...item,
        roi,
        margen,
      };
    });
  }, [proyectos]);

  // Top Proyectos
  const topProyectosROI = useMemo(() => {
    return [...proyectos].sort((a, b) => b.roiPorcentaje - a.roiPorcentaje).slice(0, 4);
  }, [proyectos]);

  // Top Docente con mayor margen operativo promedio
  const topDocenteKpi = useMemo(() => {
    const agrupado: Record<string, { ingresos: number; utilidad: number; cursos: number }> = {};
    proyectos.forEach((p) => {
      const doc = (p.nombreDocente || '').trim() || 'Sin Asignar';
      if (!agrupado[doc]) agrupado[doc] = { ingresos: 0, utilidad: 0, cursos: 0 };
      agrupado[doc].ingresos += (p.ingresoRealTotal || p.ingresoTotalNeto || 0);
      agrupado[doc].utilidad += (p.totalGananciasFinales || 0);
      agrupado[doc].cursos += 1;
    });

    const lista = Object.entries(agrupado).map(([doc, val]) => ({
      docente: doc,
      cursos: val.cursos,
      margen: val.ingresos > 0 ? Number(((val.utilidad / val.ingresos) * 100).toFixed(1)) : 0,
      utilidad: val.utilidad,
    })).sort((a, b) => b.margen - a.margen);

    return lista[0] || null;
  }, [proyectos]);

  return (
    <div className="space-y-6">
      {/* 1. KPIs Ejecutivos Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Margen de Ganancia Promedio */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Margen Ganancia Promedio</span>
            <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
              {margenPromedioConfigurado.toFixed(1)}%
            </span>
            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
              Configurado
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Margen Real sobre Ventas:</span>
            <span className={`font-bold font-mono ${margenRealConsolidado >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {margenRealConsolidado.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* KPI 2: Tasa de Éxito de Proyectos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tasa de Éxito de Proyectos</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700 font-mono tracking-tight">
              {tasaExito.toFixed(1)}%
            </span>
            <span className="text-xs font-semibold text-slate-500">
              ({proyectosExitosos.length} de {proyectos.length} rentables)
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Superan Punto Equilibrio:</span>
            <span className="font-bold text-slate-800 font-mono">
              {tasaPuntoEquilibrio.toFixed(1)}% ({proyectosSuperanPuntoEquilibrio}/{proyectos.length})
            </span>
          </div>
        </div>

        {/* KPI 3: Retorno de Inversión Proyectado (ROI) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ROI Proyectado Global</span>
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-black font-mono tracking-tight ${
              roiProyectadoConsolidado >= 0 ? 'text-indigo-900' : 'text-rose-600'
            }`}>
              {roiProyectadoConsolidado.toFixed(1)}%
            </span>
            {roiProyectadoConsolidado >= 30 ? (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> Óptimo
              </span>
            ) : roiProyectadoConsolidado >= 0 ? (
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                Viable
              </span>
            ) : (
              <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                <ArrowDownRight className="w-3 h-3" /> Déficit
              </span>
            )}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Multiplicador de Retorno:</span>
            <span className="font-bold text-slate-800 font-mono">
              {multiplicadorInversion.toFixed(2)}x por {moneda} invertido
            </span>
          </div>
        </div>

        {/* KPI 4: Utilidad Neta Consolidada */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Utilidad Neta Total</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
              totalUtilidadNeta >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}>
              {formatearMoneda(totalUtilidadNeta, moneda)}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Inversión Total:</span>
            <span className="font-bold text-amber-800 font-mono">
              {formatearMoneda(totalInversionGastos, moneda)}
            </span>
          </div>
        </div>

      </div>

      {/* 2. Sección Principal del Gráfico de Barras con Recharts */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        
        {/* Cabecera del Gráfico con Controles Interactivos */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">
                Comparativa Ejecutiva de Rendimiento & Rentabilidad
              </h3>
              {topDocenteKpi && tipoGrafico !== 'rentabilidad_docentes' && (
                <button
                  type="button"
                  onClick={() => setTipoGrafico('rentabilidad_docentes')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
                  title="Ver tendencia histórica de rentabilidad por docente"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Top Docente: <strong>{topDocenteKpi.docente}</strong> ({topDocenteKpi.margen}% margen)</span>
                  <ChevronRight className="w-3 h-3 text-indigo-500" />
                </button>
              )}
              {tipoGrafico !== 'mapa_calor' && (
                <button
                  type="button"
                  onClick={() => setTipoGrafico('mapa_calor')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 transition-colors cursor-pointer"
                  title="Ver mapa de calor de rentabilidad por nivel y tipo"
                >
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span>Mapa de Calor: Nivel × Tipo</span>
                  <ChevronRight className="w-3 h-3 text-orange-500" />
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Visualización analítica de métricas clave por proyecto y tipología institucional.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Selector de Modo de Gráfico */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setTipoGrafico('roi_margen')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  tipoGrafico === 'roi_margen'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ROI (%) vs Margen (%)
              </button>
              <button
                type="button"
                onClick={() => setTipoGrafico('ingresos_gastos_utilidad')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  tipoGrafico === 'ingresos_gastos_utilidad'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Financiero ({moneda})
              </button>
              <button
                type="button"
                onClick={() => setTipoGrafico('por_tipo')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  tipoGrafico === 'por_tipo'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Por Modalidad
              </button>
              <button
                id="btn-tab-rentabilidad-docentes-dash"
                type="button"
                onClick={() => setTipoGrafico('rentabilidad_docentes')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  tipoGrafico === 'rentabilidad_docentes'
                    ? 'bg-indigo-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                <span>Rentabilidad Docente</span>
              </button>
              <button
                id="btn-tab-heatmap-dash"
                type="button"
                onClick={() => setTipoGrafico('mapa_calor')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  tipoGrafico === 'mapa_calor'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Flame className={`w-3.5 h-3.5 ${tipoGrafico === 'mapa_calor' ? 'text-white' : 'text-orange-500'}`} />
                <span>Mapa de Calor</span>
              </button>
            </div>

            {/* Filtro por tipo cuando está en vista por proyectos */}
            {tipoGrafico !== 'por_tipo' && tipoGrafico !== 'rentabilidad_docentes' && tipoGrafico !== 'mapa_calor' && (
              <select
                value={filtroNivel}
                onChange={(e) => setFiltroNivel(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 focus:ring-2 focus:ring-purple-500"
              >
                <option value="todos">Todos los Programas ({proyectos.length})</option>
                <option value="DIPLOMADO">Diplomados</option>
                <option value="CURSO">Cursos</option>
                <option value="CERTIFICACION">Certificaciones</option>
                <option value="MAESTRIA">Maestrías</option>
                <option value="TALLER">Talleres</option>
              </select>
            )}
          </div>
        </div>

        {/* Contenedor del Gráfico de Recharts, Vista de Rentabilidad Docente o Mapa de Calor */}
        {tipoGrafico === 'mapa_calor' ? (
          <div className="mt-4 w-full">
            <SegmentosRentabilidadHeatmapView
              proyectos={proyectos}
              moneda={moneda}
              onVerDetalle={onVerDetalle}
              onEditarProyecto={onEditarProyecto}
              embedded={true}
            />
          </div>
        ) : tipoGrafico === 'rentabilidad_docentes' ? (
          <div className="mt-4 w-full">
            <DocenteRentabilidadHistoricaView
              proyectos={proyectos}
              moneda={moneda}
              onVerDetalle={onVerDetalle}
              onEditarProyecto={onEditarProyecto}
              embedded={true}
            />
          </div>
        ) : (
          <>
            <div className="mt-6 h-80 sm:h-96 w-full">
              {tipoGrafico === 'roi_margen' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={datosGraficoProyectos}
                margin={{ top: 20, right: 30, left: 10, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="nombre"
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  height={60}
                />
                <YAxis
                  unit="%"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  formatter={(value: any, name: any) => {
                    const label = name === 'roi' ? 'ROI Proyectado' : name === 'margen' ? 'Margen Operativo' : 'Margen Real';
                    return [`${Number(value).toFixed(1)}%`, label];
                  }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0 && payload[0].payload) {
                      const data = payload[0].payload;
                      return `${data.nombreCompleto} (${data.docente})`;
                    }
                    return label;
                  }}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    border: '1px solid #334155',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                  formatter={(value) => {
                    if (value === 'roi') return <span className="font-bold text-indigo-700">Retorno de Inversión (ROI %)</span>;
                    if (value === 'margen') return <span className="font-bold text-purple-700">Margen de Ganancia (%)</span>;
                    return value;
                  }}
                />
                <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1.5} />
                <ReferenceLine y={30} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Meta ROI (30%)', position: 'top', fill: '#10b981', fontSize: 10 }} />
                <Bar
                  dataKey="roi"
                  name="roi"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={38}
                >
                  {datosGraficoProyectos.map((entry, index) => (
                    <Cell
                      key={`cell-roi-${index}`}
                      fill={entry.roi >= 30 ? '#4f46e5' : entry.roi >= 0 ? '#818cf8' : '#f43f5e'}
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="margen"
                  name="margen"
                  fill="#a855f7"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={38}
                />
              </BarChart>
            </ResponsiveContainer>
          )}

          {tipoGrafico === 'ingresos_gastos_utilidad' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={datosGraficoProyectos}
                margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="nombre"
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any, name: any) => {
                    const label = name === 'ingresos' ? 'Ingreso Neto' : name === 'gastos' ? 'Gasto Operativo' : 'Utilidad Final';
                    return [formatearMoneda(Number(value), moneda), label];
                  }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0 && payload[0].payload) {
                      return payload[0].payload.nombreCompleto;
                    }
                    return label;
                  }}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    border: '1px solid #334155',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                  formatter={(value) => {
                    if (value === 'ingresos') return <span className="font-bold text-emerald-700">Ingreso Neto</span>;
                    if (value === 'gastos') return <span className="font-bold text-amber-700">Gasto Operativo</span>;
                    if (value === 'utilidad') return <span className="font-bold text-indigo-700">Utilidad Final</span>;
                    return value;
                  }}
                />
                <ReferenceLine y={0} stroke="#94a3b8" />
                <Bar dataKey="ingresos" name="ingresos" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="gastos" name="gastos" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="utilidad" name="utilidad" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={28}>
                  {datosGraficoProyectos.map((entry, index) => (
                    <Cell
                      key={`cell-utilidad-${index}`}
                      fill={entry.utilidad >= 0 ? '#6366f1' : '#e11d48'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {tipoGrafico === 'por_tipo' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={datosGraficoPorTipo}
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="tipo" tick={{ fontSize: 12, fontWeight: 'bold', fill: '#334155' }} />
                <YAxis unit="%" tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(value: any, name: any) => {
                    const label = name === 'roi' ? 'ROI Promedio (%)' : 'Margen Promedio (%)';
                    return [`${Number(value).toFixed(1)}%`, label];
                  }}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    border: '1px solid #334155',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                  formatter={(value) => {
                    if (value === 'roi') return <span className="font-bold text-indigo-700">ROI Promedio (%)</span>;
                    if (value === 'margen') return <span className="font-bold text-purple-700">Margen Promedio (%)</span>;
                    return value;
                  }}
                />
                <ReferenceLine y={0} stroke="#94a3b8" />
                <Bar dataKey="roi" name="roi" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={45} />
                <Bar dataKey="margen" name="margen" fill="#9333ea" radius={[6, 6, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          )}
          </div>

          {/* Leyenda y Notas Explicativas */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>ROI Óptimo (&ge;30%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                <span>ROI Positivo (0-29%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>En Déficit (&lt;0%)</span>
              </span>
            </div>
            <span className="text-[11px] text-slate-400 italic">
              * Datos calculados en tiempo real con las fórmulas oficiales de SUMMIT Impulsa Global.
            </span>
          </div>
        </>
        )}
      </div>

      {/* 3. Panel Inferior: Top Proyectos & Diagnóstico Estratégico */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top 4 Proyectos con Mayor ROI */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <h4 className="text-sm font-bold text-slate-900">
                Top Programas con Mayor Retorno de Inversión (ROI)
              </h4>
            </div>
            <span className="text-[11px] text-slate-500 font-semibold">
              Rendimiento Financiero
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {topProyectosROI.map((p, idx) => {
              const esRentable = p.totalGananciasFinales >= 0;
              return (
                <div
                  key={p.id}
                  onClick={() => onVerDetalle(p)}
                  className="p-3.5 bg-slate-50 hover:bg-purple-50/50 rounded-xl border border-slate-200 hover:border-purple-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                        #{idx + 1} {p.tipoProyecto}
                      </span>
                      <h5 className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition-colors line-clamp-1">
                        {p.nombreProyecto}
                      </h5>
                    </div>
                    <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-md ${
                      p.roiPorcentaje >= 30
                        ? 'bg-emerald-100 text-emerald-800'
                        : p.roiPorcentaje >= 0
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {p.roiPorcentaje.toFixed(1)}% ROI
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-slate-200/80 text-[11px]">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Margen</span>
                      <span className="font-bold text-purple-700 font-mono">{p.margenGananciaOperativa}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Inscritos</span>
                      <span className="font-bold text-slate-700 font-mono">{p.alumnosFinal} alum.</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Utilidad</span>
                      <span className={`font-bold font-mono ${esRentable ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {formatearMoneda(p.totalGananciasFinales, moneda)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Diagnóstico Ejecutivo de Cartera */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-2xl border border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <h4 className="text-sm font-bold text-white">
                Dictamen Estratégico de Dirección
              </h4>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              La cartera cuenta con un <strong>margen de ganancia promedio de {margenPromedioConfigurado.toFixed(1)}%</strong> y una <strong>tasa de éxito del {tasaExito.toFixed(1)}%</strong> en proyectos rentables.
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10">
                <span className="text-slate-300">Programas Rentables</span>
                <span className="font-bold font-mono text-emerald-400">{proyectosExitosos.length}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10">
                <span className="text-slate-300">Programas en Riesgo / Déficit</span>
                <span className="font-bold font-mono text-rose-400">{proyectosConPerdida.length}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10">
                <span className="text-slate-300">Multiplicador de Inversión</span>
                <span className="font-bold font-mono text-purple-300">{multiplicadorInversion.toFixed(2)}x</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Validado bajo estándares de rentabilidad de SUMMIT Impulsa Global.</span>
          </div>
        </div>

      </div>

    </div>
  );
};
