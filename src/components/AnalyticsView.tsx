import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { 
  TrendingUp, 
  PieChart as PieChartIcon, 
  Award, 
  Users, 
  DollarSign, 
  CheckCircle,
  BookOpen
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../types';
import { formatearMoneda } from '../utils/calculations';

interface AnalyticsViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
}

const COLORES_PIE = ['#10b981', '#3b82f6', '#a855f7', '#f59e0b', '#ec4899', '#6366f1'];

interface DocenteStats {
  docente: string;
  proyectos: number;
  gananciaTotal: number;
  alumnosTotales: number;
  costoTotal: number;
}

interface TipoStats {
  tipo: string;
  total: number;
  ganancia: number;
  gasto: number;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ proyectos, moneda }) => {
  // Datos para gráfico de barras por proyecto
  const datosPorProyecto = proyectos.map((p) => ({
    nombre: p.nombreProyecto.length > 15 ? p.nombreProyecto.slice(0, 15) + '...' : p.nombreProyecto,
    nombreCompleto: p.nombreProyecto,
    Gastos: p.gastoTotalOperativo,
    Ingresos: p.ingresoRealTotal,
    Ganancia: p.totalGananciasFinales,
    Alumnos: p.alumnosFinal,
  }));

  // Datos consolidados de desglose de costos
  const totalDocente = proyectos.reduce((acc, p) => acc + p.costoDocenteCalculado, 0);
  const totalZoom = proyectos.reduce((acc, p) => acc + p.costoZoom, 0);
  const totalPapeleria = proyectos.reduce((acc, p) => acc + p.costoPapeleria, 0);
  const totalVarios = proyectos.reduce((acc, p) => acc + p.gastosVarios, 0);

  const datosCostos = [
    { name: 'Costo Docente', value: totalDocente },
    { name: 'Plataforma Zoom', value: totalZoom },
    { name: 'Papelería y Materiales', value: totalPapeleria },
    { name: 'Gastos Varios', value: totalVarios },
  ].filter(d => d.value > 0);

  // Agrupado por Docente
  const rentabilidadPorDocente: Record<string, DocenteStats> = proyectos.reduce((acc, p) => {
    const doc = p.nombreDocente || 'Sin Docente';
    if (!acc[doc]) {
      acc[doc] = { docente: doc, proyectos: 0, gananciaTotal: 0, alumnosTotales: 0, costoTotal: 0 };
    }
    acc[doc].proyectos += 1;
    acc[doc].gananciaTotal += p.totalGananciasFinales;
    acc[doc].alumnosTotales += p.alumnosFinal;
    acc[doc].costoTotal += p.gastoTotalOperativo;
    return acc;
  }, {} as Record<string, DocenteStats>);

  const listaDocentes: DocenteStats[] = (Object.values(rentabilidadPorDocente) as DocenteStats[]).sort((a, b) => b.gananciaTotal - a.gananciaTotal);

  // Agrupado por Tipo de Proyecto
  const rentabilidadPorTipo: Record<string, TipoStats> = proyectos.reduce((acc, p) => {
    const tipo = p.tipoProyecto || 'CURSO';
    if (!acc[tipo]) {
      acc[tipo] = { tipo, total: 0, ganancia: 0, gasto: 0 };
    }
    acc[tipo].total += 1;
    acc[tipo].ganancia += p.totalGananciasFinales;
    acc[tipo].gasto += p.gastoTotalOperativo;
    return acc;
  }, {} as Record<string, TipoStats>);

  const listaTipos: TipoStats[] = Object.values(rentabilidadPorTipo) as TipoStats[];

  if (proyectos.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
          <TrendingUp className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No hay métricas analíticas aún</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          A medida que registres tus cursos y talleres, aquí se generarán automáticamente las comparativas de rentabilidad, desglose de costos y rendimiento por docente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 1. Gráficos Principales en Grid de 2 Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Gráfico de Barras: Comparativa Financiera por Proyecto (8 cols) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Comparativa Financiera: Gastos vs Ingresos vs Ganancia Neta
              </h3>
              <p className="text-xs text-slate-500">
                Visualización de rentabilidad por cada proyecto educativo en {moneda}
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosPorProyecto} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="nombre" 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(v) => `${v.toLocaleString()}`}
                />
                <Tooltip 
                  formatter={(value: number) => [formatearMoneda(value, moneda), '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Gastos" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Gasto Operativo" />
                <Bar dataKey="Ingresos" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Ingreso Real" />
                <Bar dataKey="Ganancia" fill="#10b981" radius={[4, 4, 0, 0]} name="Ganancia Neta" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico Circular: Desglose Consolidado de Gastos (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-amber-600" />
              Distribución de Costos Operativos
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Porcentaje acumulado por rubro de gasto
            </p>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={datosCostos}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {datosCostos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORES_PIE[index % COLORES_PIE.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [formatearMoneda(value, moneda), '']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            {datosCostos.map((item, idx) => {
              const total = datosCostos.reduce((a, b) => a + b.value, 0);
              const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
              return (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORES_PIE[idx % COLORES_PIE.length] }} />
                    <span className="text-slate-600">{item.name}</span>
                  </div>
                  <span className="font-mono font-semibold text-slate-900">
                    {pct}% ({formatearMoneda(item.value, moneda)})
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 2. Rendimiento por Docente y por Formato Académico */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Tabla Rendimiento por Docente */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-600" />
            Rentabilidad por Docente
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Evaluación de utilidades generadas y alumnos capacitados por facilitador
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Docente</th>
                  <th className="py-2 px-2 text-center">Cursos</th>
                  <th className="py-2 px-2 text-center">Alumnos</th>
                  <th className="py-2 px-3 text-right">Ganancia Neta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listaDocentes.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {d.docente}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-600 font-mono">
                      {d.proyectos}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-600 font-mono">
                      {d.alumnosTotales}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                      d.gananciaTotal >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {formatearMoneda(d.gananciaTotal, moneda)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rendimiento por Tipo de Proyecto */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            Rendimiento por Tipo de Proyecto
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Comparativa de utilidades según formato (Curso, Taller, Bootcamp, etc.)
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Formato</th>
                  <th className="py-2 px-2 text-center">Cantidad</th>
                  <th className="py-2 px-3 text-right">Gasto Operativo</th>
                  <th className="py-2 px-3 text-right">Ganancia Neta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listaTipos.map((t, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700">
                        {t.tipo}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-600 font-mono">
                      {t.total}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700 font-mono">
                      {formatearMoneda(t.gasto, moneda)}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                      t.ganancia >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {formatearMoneda(t.ganancia, moneda)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
