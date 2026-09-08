import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Cell, 
  ComposedChart, 
  Line 
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Layers, 
  Award, 
  Filter, 
  Info, 
  Sparkles, 
  Compass, 
  PieChart, 
  Target, 
  ArrowUpRight,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import { ProyectoEducativo, Moneda, TipoProyecto, NivelProyecto } from '../../types';
import { formatearMoneda } from '../../utils/calculations';
import { DocenteRentabilidadTendenciaChart } from './DocenteRentabilidadTendenciaChart';

interface MargenComparativaChartsProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
}

const PALETA_COLORES = [
  '#2563eb', // Blue
  '#0d9488', // Teal
  '#d97706', // Amber
  '#7c3aed', // Purple
  '#e11d48', // Rose
  '#059669', // Emerald
  '#475569', // Slate
];

const NIVELES_ORDEN: NivelProyecto[] = ['Básico', 'Intermedio', 'Avanzado', 'Especializado', 'Todos los niveles'];

export const MargenComparativaCharts: React.FC<MargenComparativaChartsProps> = ({
  proyectos,
  moneda,
}) => {
  const [vistaGrafico, setVistaGrafico] = useState<'tipo' | 'nivel' | 'cruzado' | 'radar' | 'tendencia'>('tipo');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [metricaVisible, setMetricaVisible] = useState<'margen' | 'ganancia'>('margen');

  // Filtrado de proyectos
  const proyectosFiltrados = useMemo(() => {
    if (filtroEstado === 'todos') return proyectos;
    return proyectos.filter((p) => p.seLlevoACabo === filtroEstado);
  }, [proyectos, filtroEstado]);

  // 1. Agrupación por Tipo de Proyecto
  const datosPorTipo = useMemo(() => {
    const agrupado: Record<string, {
      tipo: string;
      tipoCorto: string;
      cantidad: number;
      margenSuma: number;
      margenMin: number;
      margenMax: number;
      gananciaTotal: number;
      gastoTotal: number;
      ingresoTotal: number;
      alumnosTotal: number;
    }> = {};

    proyectosFiltrados.forEach((p) => {
      const tipo = p.tipoProyecto || 'Sin categorizar';
      const tipoCorto = tipo.length > 22 ? `${tipo.slice(0, 20)}...` : tipo;
      const margen = Number(p.margenGananciaOperativa) || 0;
      const ganancia = Number(p.gananciaOperativa) || 0;
      const gasto = Number(p.gastoTotalOperativo) || 0;
      const ingreso = Number(p.precioVentaRequerido) || (gasto + ganancia);
      const alumnos = Number(p.alumnosFinal) || Number(p.alumnosProyectados) || 4;

      if (!agrupado[tipo]) {
        agrupado[tipo] = {
          tipo,
          tipoCorto,
          cantidad: 0,
          margenSuma: 0,
          margenMin: margen,
          margenMax: margen,
          gananciaTotal: 0,
          gastoTotal: 0,
          ingresoTotal: 0,
          alumnosTotal: 0,
        };
      }

      agrupado[tipo].cantidad += 1;
      agrupado[tipo].margenSuma += margen;
      agrupado[tipo].margenMin = Math.min(agrupado[tipo].margenMin, margen);
      agrupado[tipo].margenMax = Math.max(agrupado[tipo].margenMax, margen);
      agrupado[tipo].gananciaTotal += ganancia;
      agrupado[tipo].gastoTotal += gasto;
      agrupado[tipo].ingresoTotal += ingreso;
      agrupado[tipo].alumnosTotal += alumnos;
    });

    return Object.values(agrupado).map((item) => ({
      ...item,
      margenPromedio: Number((item.margenSuma / (item.cantidad || 1)).toFixed(1)),
      gananciaPromedio: Math.round(item.gananciaTotal / (item.cantidad || 1)),
      alumnosPromedio: Number((item.alumnosTotal / (item.cantidad || 1)).toFixed(1)),
    })).sort((a, b) => b.margenPromedio - a.margenPromedio);
  }, [proyectosFiltrados]);

  // 2. Agrupación por Nivel Académico
  const datosPorNivel = useMemo(() => {
    const agrupado: Record<string, {
      nivel: string;
      cantidad: number;
      margenSuma: number;
      margenMin: number;
      margenMax: number;
      gananciaTotal: number;
      gastoTotal: number;
      ingresoTotal: number;
      alumnosTotal: number;
    }> = {};

    proyectosFiltrados.forEach((p) => {
      const nivel = (p.nivel || 'Básico') as string;
      const margen = Number(p.margenGananciaOperativa) || 0;
      const ganancia = Number(p.gananciaOperativa) || 0;
      const gasto = Number(p.gastoTotalOperativo) || 0;
      const ingreso = Number(p.precioVentaRequerido) || (gasto + ganancia);
      const alumnos = Number(p.alumnosFinal) || Number(p.alumnosProyectados) || 4;

      if (!agrupado[nivel]) {
        agrupado[nivel] = {
          nivel,
          cantidad: 0,
          margenSuma: 0,
          margenMin: margen,
          margenMax: margen,
          gananciaTotal: 0,
          gastoTotal: 0,
          ingresoTotal: 0,
          alumnosTotal: 0,
        };
      }

      agrupado[nivel].cantidad += 1;
      agrupado[nivel].margenSuma += margen;
      agrupado[nivel].margenMin = Math.min(agrupado[nivel].margenMin, margen);
      agrupado[nivel].margenMax = Math.max(agrupado[nivel].margenMax, margen);
      agrupado[nivel].gananciaTotal += ganancia;
      agrupado[nivel].gastoTotal += gasto;
      agrupado[nivel].ingresoTotal += ingreso;
      agrupado[nivel].alumnosTotal += alumnos;
    });

    return Object.values(agrupado).map((item) => ({
      ...item,
      margenPromedio: Number((item.margenSuma / (item.cantidad || 1)).toFixed(1)),
      gananciaPromedio: Math.round(item.gananciaTotal / (item.cantidad || 1)),
      alumnosPromedio: Number((item.alumnosTotal / (item.cantidad || 1)).toFixed(1)),
    })).sort((a, b) => {
      const idxA = NIVELES_ORDEN.indexOf(a.nivel as NivelProyecto);
      const idxB = NIVELES_ORDEN.indexOf(b.nivel as NivelProyecto);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return b.margenPromedio - a.margenPromedio;
    });
  }, [proyectosFiltrados]);

  // 3. Matriz Cruzada (Tipo × Nivel)
  const matrizCruzada = useMemo(() => {
    const tipos: string[] = Array.from(new Set(proyectosFiltrados.map((p) => p.tipoProyecto || 'Sin categorizar')));
    const niveles = NIVELES_ORDEN.filter((n) => proyectosFiltrados.some((p) => p.nivel === n));
    if (niveles.length === 0) niveles.push('Básico', 'Intermedio', 'Avanzado');

    return tipos.map((tipo: string) => {
      const tipoCorto = tipo.length > 20 ? `${tipo.slice(0, 18)}...` : tipo;
      const fila: any = { tipo, tipoCorto };

      niveles.forEach((nivel) => {
        const matching = proyectosFiltrados.filter(
          (p) => (p.tipoProyecto || 'Sin categorizar') === tipo && p.nivel === nivel
        );
        if (matching.length > 0) {
          const avgMargen = matching.reduce((acc, cur) => acc + (Number(cur.margenGananciaOperativa) || 0), 0) / matching.length;
          fila[nivel] = Number(avgMargen.toFixed(1));
          fila[`${nivel}_count`] = matching.length;
        } else {
          fila[nivel] = 0;
          fila[`${nivel}_count`] = 0;
        }
      });

      return fila;
    });
  }, [proyectosFiltrados]);

  // 4. Datos para Radar multidimensional de rendimiento por nivel
  const datosRadar = useMemo(() => {
    return datosPorNivel.map((item) => ({
      nivel: item.nivel,
      margen: item.margenPromedio,
      gananciaK: Math.round(item.gananciaPromedio / 100) / 10, // Escala en miles
      alumnos: item.alumnosPromedio * 5, // Normalizado para visualización
      volumen: item.cantidad * 10
    }));
  }, [datosPorNivel]);

  // 5. Estadísticas clave para el encabezado
  const estadisticas = useMemo(() => {
    if (proyectosFiltrados.length === 0) {
      return {
        margenPromedioGlobal: 0,
        tipoMasRentable: 'N/A',
        margenTipoMax: 0,
        nivelMasRentable: 'N/A',
        margenNivelMax: 0,
        totalGananciaProyectada: 0,
        proyectoEstrella: null as ProyectoEducativo | null
      };
    }

    const sumaMargenes = proyectosFiltrados.reduce((acc, p) => acc + (Number(p.margenGananciaOperativa) || 0), 0);
    const margenPromedioGlobal = Number((sumaMargenes / proyectosFiltrados.length).toFixed(1));
    const totalGananciaProyectada = proyectosFiltrados.reduce((acc, p) => acc + (Number(p.gananciaOperativa) || 0), 0);

    const tipoMax = datosPorTipo[0] || { tipo: 'N/A', margenPromedio: 0 };
    const nivelMax = [...datosPorNivel].sort((a, b) => b.margenPromedio - a.margenPromedio)[0] || { nivel: 'N/A', margenPromedio: 0 };

    // Proyecto estrella (mayor ganancia neta o margen)
    const estrella = [...proyectosFiltrados].sort((a, b) => (b.gananciaOperativa || 0) - (a.gananciaOperativa || 0))[0] || null;

    return {
      margenPromedioGlobal,
      tipoMasRentable: tipoMax.tipo,
      margenTipoMax: tipoMax.margenPromedio,
      nivelMasRentable: nivelMax.nivel,
      margenNivelMax: nivelMax.margenPromedio,
      totalGananciaProyectada,
      proyectoEstrella: estrella
    };
  }, [proyectosFiltrados, datosPorTipo, datosPorNivel]);

  // Estados únicos disponibles para el filtro
  const estadosDisponibles = useMemo(() => {
    return Array.from(new Set(proyectos.map((p) => p.seLlevoACabo).filter(Boolean)));
  }, [proyectos]);

  return (
    <div className="space-y-4">
      {/* Tarjetas Superiores de Indicadores de Margen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Margen Global Prom.
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-800 font-mono mt-1">
            {estadisticas.margenPromedioGlobal}%
          </div>
          <span className="text-[10px] text-slate-500">
            {proyectosFiltrados.length} proyectos evaluados
          </span>
        </div>

        <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
              Tipo Más Rentable
            </span>
            <Award className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-sm font-bold text-emerald-950 truncate mt-1" title={estadisticas.tipoMasRentable}>
            {estadisticas.tipoMasRentable}
          </div>
          <span className="text-[10px] font-semibold text-emerald-700">
            Margen: {estadisticas.margenTipoMax}%
          </span>
        </div>

        <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-200/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-indigo-800 uppercase tracking-wider">
              Nivel Más Rentable
            </span>
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-sm font-bold text-indigo-950 truncate mt-1">
            Nivel {estadisticas.nivelMasRentable}
          </div>
          <span className="text-[10px] font-semibold text-indigo-700">
            Margen: {estadisticas.margenNivelMax}%
          </span>
        </div>

        <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
              Ganancia Acumulada
            </span>
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-sm font-bold text-amber-950 font-mono mt-1">
            {formatearMoneda(estadisticas.totalGananciaProyectada, moneda)}
          </div>
          <span className="text-[10px] text-amber-700">
            Utilidad operativa neta
          </span>
        </div>
      </div>

      {/* Barra de Controles y Filtros */}
      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5 text-slate-600" />
            Vista:
          </span>

          <button
            type="button"
            onClick={() => setVistaGrafico('tipo')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              vistaGrafico === 'tipo'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            Por Tipo de Proyecto
          </button>

          <button
            type="button"
            onClick={() => setVistaGrafico('nivel')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              vistaGrafico === 'nivel'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            Por Nivel Académico
          </button>

          <button
            type="button"
            onClick={() => setVistaGrafico('cruzado')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              vistaGrafico === 'cruzado'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            Matriz Cruzada (Tipo × Nivel)
          </button>

          <button
            type="button"
            onClick={() => setVistaGrafico('radar')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              vistaGrafico === 'radar'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            Radar Multidimensional
          </button>

          <button
            type="button"
            onClick={() => setVistaGrafico('tendencia')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
              vistaGrafico === 'tendencia'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Tarifa Docente vs. Rentabilidad
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Métrica a visualizar */}
          <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setMetricaVisible('margen')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                metricaVisible === 'margen' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Margen %
            </button>
            <button
              type="button"
              onClick={() => setMetricaVisible('ganancia')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                metricaVisible === 'ganancia' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ganancia ({moneda})
            </button>
          </div>

          {/* Filtro por estado */}
          {estadosDisponibles.length > 0 && (
            <div className="flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg px-2 py-1 font-medium focus:ring-1 focus:ring-blue-500"
              >
                <option value="todos">Todos los Estados ({proyectos.length})</option>
                {estadosDisponibles.map((st) => (
                  <option key={st} value={st}>
                    {st} ({proyectos.filter((p) => p.seLlevoACabo === st).length})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ÁREA PRINCIPAL DE GRÁFICOS RECHARTS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {proyectosFiltrados.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <Info className="w-8 h-8 mx-auto text-slate-400" />
            <p className="font-semibold text-sm">No hay proyectos para los filtros seleccionados.</p>
            <p className="text-xs text-slate-400">Seleccione "Todos los Estados" o añada proyectos para visualizar la comparativa.</p>
          </div>
        ) : (
          <>
            {/* VISTA 1: Por Tipo de Proyecto */}
            {vistaGrafico === 'tipo' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                      <span>Comparativa de Rentabilidad por Tipo de Proyecto</span>
                      <span className="text-[10px] font-normal text-slate-500">
                        ({datosPorTipo.length} categorías)
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Muestra el margen porcentual promedio y la ganancia neta proyectada por línea de negocio institucional.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                    {metricaVisible === 'margen' ? 'Métrica: Margen Operativo (%)' : `Métrica: Ganancia Operativa (${moneda})`}
                  </span>
                </div>

                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={datosPorTipo}
                      margin={{ top: 10, right: 20, left: 10, bottom: 45 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis 
                        dataKey="tipoCorto" 
                        angle={-15} 
                        textAnchor="end" 
                        interval={0}
                        height={50}
                        tick={{ fontSize: 11, fill: '#475569' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={(val) => metricaVisible === 'margen' ? `${val}%` : `${val.toLocaleString()}`}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1.5 max-w-xs">
                                <p className="font-bold text-blue-300 border-b border-slate-800 pb-1">
                                  {data.tipo}
                                </p>
                                <div className="flex justify-between gap-4">
                                  <span className="text-slate-400">Proyectos:</span>
                                  <span className="font-bold">{data.cantidad}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-slate-400">Margen Promedio:</span>
                                  <span className="font-bold text-emerald-400">{data.margenPromedio}%</span>
                                </div>
                                <div className="flex justify-between gap-4 text-[11px]">
                                  <span className="text-slate-400">Rango Margen:</span>
                                  <span>{data.margenMin}% - {data.margenMax}%</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-slate-400">Ganancia Total:</span>
                                  <span className="font-mono font-bold text-amber-300">{formatearMoneda(data.gananciaTotal, moneda)}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-slate-400">Alumnos Promedio:</span>
                                  <span className="font-bold">{data.alumnosPromedio}</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                      />
                      {metricaVisible === 'margen' ? (
                        <>
                          <Bar 
                            dataKey="margenPromedio" 
                            name="Margen Promedio (%)" 
                            radius={[6, 6, 0, 0]}
                            fill="#2563eb"
                          >
                            {datosPorTipo.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={PALETA_COLORES[index % PALETA_COLORES.length]} />
                            ))}
                          </Bar>
                          <Line 
                            type="monotone" 
                            dataKey="margenMax" 
                            name="Margen Máximo (%)" 
                            stroke="#059669" 
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                        </>
                      ) : (
                        <Bar 
                          dataKey="gananciaTotal" 
                          name={`Ganancia Total (${moneda})`} 
                          radius={[6, 6, 0, 0]}
                          fill="#0d9488"
                        >
                          {datosPorTipo.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PALETA_COLORES[index % PALETA_COLORES.length]} />
                          ))}
                        </Bar>
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* VISTA 2: Por Nivel Académico */}
            {vistaGrafico === 'nivel' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                      <span>Comparativa de Márgenes por Nivel Académico</span>
                      <span className="text-[10px] font-normal text-slate-500">
                        (Básico, Intermedio, Avanzado, etc.)
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Evalúa cómo varía la rentabilidad según la complejidad académica del programa de estudio.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                    {metricaVisible === 'margen' ? 'Métrica: Margen Operativo (%)' : `Métrica: Ganancia (${moneda})`}
                  </span>
                </div>

                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={datosPorNivel}
                      margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis 
                        dataKey="nivel" 
                        tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={(val) => metricaVisible === 'margen' ? `${val}%` : `${val.toLocaleString()}`}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1.5 max-w-xs">
                                <p className="font-bold text-indigo-300 border-b border-slate-800 pb-1">
                                  Nivel: {data.nivel}
                                </p>
                                <div className="flex justify-between gap-4">
                                  <span className="text-slate-400">Total Proyectos:</span>
                                  <span className="font-bold">{data.cantidad}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-slate-400">Margen Promedio:</span>
                                  <span className="font-bold text-emerald-400">{data.margenPromedio}%</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-slate-400">Ganancia Total:</span>
                                  <span className="font-mono font-bold text-amber-300">{formatearMoneda(data.gananciaTotal, moneda)}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-slate-400">Alumnos Inscritos:</span>
                                  <span className="font-bold">{data.alumnosTotal}</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Bar 
                        dataKey={metricaVisible === 'margen' ? 'margenPromedio' : 'gananciaTotal'}
                        name={metricaVisible === 'margen' ? 'Margen Promedio (%)' : `Ganancia Total (${moneda})`}
                        radius={[6, 6, 0, 0]}
                        fill="#7c3aed"
                      >
                        {datosPorNivel.map((entry, index) => {
                          const coloresNivel: Record<string, string> = {
                            'Básico': '#0d9488',
                            'Intermedio': '#2563eb',
                            'Avanzado': '#7c3aed',
                            'Especializado': '#e11d48',
                            'Todos los niveles': '#d97706',
                          };
                          return (
                            <Cell key={`cell-${index}`} fill={coloresNivel[entry.nivel] || PALETA_COLORES[index % PALETA_COLORES.length]} />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* VISTA 3: Matriz Cruzada (Tipo × Nivel) */}
            {vistaGrafico === 'cruzado' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                      <span>Matriz Cruzada: Margen por Tipo de Proyecto y Nivel</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Comparativa directa del margen promedio (%) en cada nivel académico para cada tipología.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                    Vista Agrupada
                  </span>
                </div>

                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={matrizCruzada}
                      margin={{ top: 10, right: 20, left: 10, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis 
                        dataKey="tipoCorto" 
                        angle={-15} 
                        textAnchor="end" 
                        interval={0}
                        height={45}
                        tick={{ fontSize: 10, fill: '#475569' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={(val) => `${val}%`}
                      />
                      <Tooltip 
                        formatter={(val: any, name: any) => [`${val}% de margen`, `Nivel ${name}`]}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="Básico" name="Básico" fill="#0d9488" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Intermedio" name="Intermedio" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Avanzado" name="Avanzado" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Especializado" name="Especializado" fill="#e11d48" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* VISTA 4: Radar Multidimensional */}
            {vistaGrafico === 'radar' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                      <Compass className="w-3.5 h-3.5 text-blue-600" />
                      <span>Análisis Multidimensional por Nivel Académico</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Visualización de balance entre Margen %, Ganancia y Volumen de Proyectos por nivel.
                    </p>
                  </div>
                </div>

                <div className="h-72 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={datosRadar} outerRadius="75%">
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="nivel" tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Radar 
                        name="Margen Promedio (%)" 
                        dataKey="margen" 
                        stroke="#2563eb" 
                        fill="#3b82f6" 
                        fillOpacity={0.4} 
                      />
                      <Radar 
                        name="Volumen Relativo" 
                        dataKey="volumen" 
                        stroke="#0d9488" 
                        fill="#14b8a6" 
                        fillOpacity={0.3} 
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Tooltip formatter={(value: any, name: any) => [`${value}`, name]} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* VISTA 5: Evolución Histórica Tarifa vs Rentabilidad */}
            {vistaGrafico === 'tendencia' && (
              <DocenteRentabilidadTendenciaChart
                proyectos={proyectosFiltrados}
                moneda={moneda}
                embedded={true}
              />
            )}

            {/* TABLA EJECUTIVA RESUMEN DE MÁRGENES (VISTAS GENERALES) */}
            {vistaGrafico !== 'tendencia' && (
              <>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                      Detalle Tabular de Rentabilidad por Categoría
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Ordenado por mayor margen operativo
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2">Categoría / Tipo</th>
                          <th className="px-3 py-2 text-center">Proyectos</th>
                          <th className="px-3 py-2 text-right">Margen Promedio</th>
                          <th className="px-3 py-2 text-right">Rango Margen</th>
                          <th className="px-3 py-2 text-right">Ganancia Total</th>
                          <th className="px-3 py-2 text-right">Gasto Operativo</th>
                          <th className="px-3 py-2 text-center">Alumnos Prom.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {datosPorTipo.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-3 py-2 font-medium text-slate-800">
                              <div className="flex items-center gap-1.5">
                                <span 
                                  className="w-2.5 h-2.5 rounded-full shrink-0" 
                                  style={{ backgroundColor: PALETA_COLORES[idx % PALETA_COLORES.length] }} 
                                />
                                <span>{row.tipo}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-center font-bold text-slate-700">
                              {row.cantidad}
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-blue-700">
                              {row.margenPromedio}%
                            </td>
                            <td className="px-3 py-2 text-right text-[11px] text-slate-500 font-mono">
                              {row.margenMin}% - {row.margenMax}%
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-700">
                              {formatearMoneda(row.gananciaTotal, moneda)}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-slate-600">
                              {formatearMoneda(row.gastoTotal, moneda)}
                            </td>
                            <td className="px-3 py-2 text-center font-medium text-slate-600">
                              {row.alumnosPromedio}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* HALLAZGOS E INSIGHTS EJECUTIVOS */}
                <div className="mt-4 p-3 bg-blue-50/60 rounded-xl border border-blue-200/80 text-xs space-y-1.5">
                  <div className="font-bold text-blue-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Dictamen Estratégico de Rentabilidad para Gerencia</span>
                  </div>
                  <ul className="text-blue-900/90 text-[11px] space-y-1 list-disc list-inside">
                    <li>
                      <strong>Línea líder en rentabilidad:</strong> <em>{estadisticas.tipoMasRentable}</em> alcanza el margen promedio más alto con <strong>{estadisticas.margenTipoMax}%</strong>.
                    </li>
                    <li>
                      <strong>Nivel con mejor relación margen/costo:</strong> El nivel <em>{estadisticas.nivelMasRentable}</em> promedia <strong>{estadisticas.margenNivelMax}%</strong> de ganancia neta sobre costo.
                    </li>
                    {estadisticas.proyectoEstrella && (
                      <li>
                        <strong>Programa de mayor impacto económico:</strong> <em>{estadisticas.proyectoEstrella.nombreProyecto || 'Proyecto #'+estadisticas.proyectoEstrella.numeroCorrelativo}</em> con una utilidad neta proyectada de <strong>{formatearMoneda(estadisticas.proyectoEstrella.gananciaOperativa, moneda)}</strong> ({estadisticas.proyectoEstrella.margenGananciaOperativa}% margen).
                      </li>
                    )}
                  </ul>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
