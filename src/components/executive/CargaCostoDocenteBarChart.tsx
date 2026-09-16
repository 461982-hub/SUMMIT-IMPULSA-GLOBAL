import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import {
  GraduationCap,
  Clock,
  DollarSign,
  TrendingUp,
  Filter,
  Calendar,
  Layers,
  ChevronRight,
  BookOpen,
  UserCheck,
  Award,
  Sparkles,
  BarChart3,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { formatearMoneda } from '../../utils/calculations';
import {
  obtenerClaveMesProyecto,
  formatearEtiquetaMes,
  formatearEtiquetaCortaMes
} from '../../utils/monthUtils';

interface CargaCostoDocenteBarChartProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  embedded?: boolean;
}

export interface ResumenCargaCostoMes {
  mesKey: string;
  etiquetaMes: string;
  etiquetaCorta: string;
  cantidadProyectos: number;
  horasDocenteMes: number;
  costoDocenteMes: number;
  tarifaPromedioMes: number;
  docentesUnicos: string[];
  // Métricas acumuladas progresivas
  horasDocenteAcumuladas: number;
  costoDocenteAcumulado: number;
  proyectosAcumulados: number;
  tarifaPromedioAcumulada: number;
  porcentajeDelCostoTotal: number;
  proyectos: ProyectoEducativo[];
}

export const CargaCostoDocenteBarChart: React.FC<CargaCostoDocenteBarChartProps> = ({
  proyectos,
  moneda,
  embedded = false,
}) => {
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [modoVisualizacion, setModoVisualizacion] = useState<'dual' | 'costoAcumulado' | 'cargaHoras'>('dual');
  const [mesSeleccionadoKey, setMesSeleccionadoKey] = useState<string | null>(null);
  const [mostrarReferenciaMedia, setMostrarReferenciaMedia] = useState<boolean>(true);

  // Filtrado reactivo de proyectos
  const proyectosFiltrados = useMemo(() => {
    if (filtroEstado === 'todos') return proyectos;
    return proyectos.filter((p) => p.seLlevoACabo === filtroEstado);
  }, [proyectos, filtroEstado]);

  // Agrupación mensual y cálculo progresivo acumulado
  const { datosMesAMes, kpisGlobales, docentesRanking } = useMemo(() => {
    const agrupado: Record<string, ProyectoEducativo[]> = {};

    proyectosFiltrados.forEach((p) => {
      const key = obtenerClaveMesProyecto(p);
      if (!agrupado[key]) {
        agrupado[key] = [];
      }
      agrupado[key].push(p);
    });

    const mesesOrdenados = Object.keys(agrupado).sort((a, b) => a.localeCompare(b));

    // Primer pase para calcular el gran total de costo y horas
    let costoTotalHistoricoGeneral = 0;
    let horasTotalesHistoricoGeneral = 0;
    const docentesSet = new Set<string>();

    mesesOrdenados.forEach((mesKey) => {
      const proys = agrupado[mesKey];
      proys.forEach((p) => {
        const tarifa = Math.max(0, p.tarifaHoraDocente ?? 200);
        const horas = Math.max(0, p.horasClase || 0);
        const costoDoc = p.costoDocenteManual && p.costoDocenteManual > 0
          ? p.costoDocenteManual
          : horas * tarifa;

        costoTotalHistoricoGeneral += costoDoc;
        horasTotalesHistoricoGeneral += horas;
        if (p.nombreDocente && p.nombreDocente.trim() !== '') {
          docentesSet.add(p.nombreDocente.trim());
        }
      });
    });

    // Segundo pase: cálculo mes a mes y acumulados progresivos
    let acumuladorHoras = 0;
    let acumuladorCosto = 0;
    let acumuladorProyectos = 0;

    const listaMeses: ResumenCargaCostoMes[] = mesesOrdenados.map((mesKey) => {
      const proys = agrupado[mesKey];
      let horasMes = 0;
      let costoMes = 0;
      let sumaTarifasPonderadas = 0;
      const docentesDelMes = new Set<string>();

      proys.forEach((p) => {
        const tarifa = Math.max(0, p.tarifaHoraDocente ?? 200);
        const horas = Math.max(0, p.horasClase || 0);
        const costoDoc = p.costoDocenteManual && p.costoDocenteManual > 0
          ? p.costoDocenteManual
          : horas * tarifa;

        horasMes += horas;
        costoMes += costoDoc;
        sumaTarifasPonderadas += tarifa * (horas > 0 ? horas : 1);

        if (p.nombreDocente && p.nombreDocente.trim()) {
          docentesDelMes.add(p.nombreDocente.trim());
        }
      });

      acumuladorHoras += horasMes;
      acumuladorCosto += costoMes;
      acumuladorProyectos += proys.length;

      const tarifaPromedioMes = horasMes > 0
        ? Math.round(sumaTarifasPonderadas / horasMes)
        : Math.round(costoMes / (proys.length || 1));

      const tarifaPromedioAcumulada = acumuladorHoras > 0
        ? Math.round(acumuladorCosto / acumuladorHoras)
        : 0;

      const porcentajeDelCostoTotal = costoTotalHistoricoGeneral > 0
        ? Number(((costoMes / costoTotalHistoricoGeneral) * 100).toFixed(1))
        : 0;

      return {
        mesKey,
        etiquetaMes: formatearEtiquetaMes(mesKey),
        etiquetaCorta: formatearEtiquetaCortaMes(mesKey),
        cantidadProyectos: proys.length,
        horasDocenteMes: horasMes,
        costoDocenteMes: costoMes,
        tarifaPromedioMes,
        docentesUnicos: Array.from(docentesDelMes),
        horasDocenteAcumuladas: acumuladorHoras,
        costoDocenteAcumulado: acumuladorCosto,
        proyectosAcumulados: acumuladorProyectos,
        tarifaPromedioAcumulada,
        porcentajeDelCostoTotal,
        proyectos: proys,
      };
    });

    // Mes pico de horas y mes pico de costo
    let mesPicoHoras: ResumenCargaCostoMes | null = null;
    let mesPicoCosto: ResumenCargaCostoMes | null = null;

    listaMeses.forEach((m) => {
      if (!mesPicoHoras || m.horasDocenteMes > mesPicoHoras.horasDocenteMes) {
        mesPicoHoras = m;
      }
      if (!mesPicoCosto || m.costoDocenteMes > mesPicoCosto.costoDocenteMes) {
        mesPicoCosto = m;
      }
    });

    const promedioHorasPorMes = listaMeses.length > 0
      ? Math.round(horasTotalesHistoricoGeneral / listaMeses.length)
      : 0;

    const promedioCostoPorMes = listaMeses.length > 0
      ? Math.round(costoTotalHistoricoGeneral / listaMeses.length)
      : 0;

    const tarifaHistoricaGlobal = horasTotalesHistoricoGeneral > 0
      ? Math.round(costoTotalHistoricoGeneral / horasTotalesHistoricoGeneral)
      : 200;

    // Ranking de docentes más activos
    const mapDocentes: Record<string, { horas: number; costo: number; cursos: number }> = {};
    proyectosFiltrados.forEach((p) => {
      const nombre = (p.nombreDocente && p.nombreDocente.trim()) || 'Docente No Asignado';
      const horas = Math.max(0, p.horasClase || 0);
      const tarifa = Math.max(0, p.tarifaHoraDocente ?? 200);
      const costo = p.costoDocenteManual && p.costoDocenteManual > 0 ? p.costoDocenteManual : horas * tarifa;

      if (!mapDocentes[nombre]) {
        mapDocentes[nombre] = { horas: 0, costo: 0, cursos: 0 };
      }
      mapDocentes[nombre].horas += horas;
      mapDocentes[nombre].costo += costo;
      mapDocentes[nombre].cursos += 1;
    });

    const ranking = Object.entries(mapDocentes)
      .map(([nombre, val]) => ({ nombre, ...val }))
      .sort((a, b) => b.horas - a.horas);

    return {
      datosMesAMes: listaMeses,
      kpisGlobales: {
        costoTotalHistorico: costoTotalHistoricoGeneral,
        horasTotalesHistorico: horasTotalesHistoricoGeneral,
        promedioHorasPorMes,
        promedioCostoPorMes,
        tarifaHistoricaGlobal,
        totalMeses: listaMeses.length,
        totalDocentes: docentesSet.size,
        mesPicoHoras,
        mesPicoCosto,
      },
      docentesRanking: ranking,
    };
  }, [proyectosFiltrados]);

  // Selección por defecto del último mes si no hay seleccionado
  const mesSeleccionado = useMemo(() => {
    if (datosMesAMes.length === 0) return null;
    if (mesSeleccionadoKey) {
      const encontrado = datosMesAMes.find((m) => m.mesKey === mesSeleccionadoKey);
      if (encontrado) return encontrado;
    }
    return datosMesAMes[datosMesAMes.length - 1];
  }, [datosMesAMes, mesSeleccionadoKey]);

  // Estados disponibles en los proyectos para el selector
  const estadosDisponibles = useMemo(() => {
    return Array.from(new Set(proyectos.map((p) => p.seLlevoACabo).filter(Boolean)));
  }, [proyectos]);

  return (
    <div className={`space-y-4 ${embedded ? '' : 'p-1'}`} id="carga-costo-docente-barchart-container">
      {/* 1. ENCABEZADO Y CONTROLES INTERACTIVOS */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Carga de Trabajo & Costo Docente Histórico Acumulado por Mes
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                <BarChart3 className="w-3 h-3 text-blue-600" />
                Gráfico de Barras Interactivo
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Auditoría mensual de horas de docencia comprometidas y evolución de la inversión acumulada en honorarios docentes.
            </p>
          </div>
        </div>

        {/* CONTROLES */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Modo de Gráfico */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setModoVisualizacion('dual')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                modoVisualizacion === 'dual'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Comparación simultánea de horas y costo mensual/acumulado"
            >
              Carga vs Costo
            </button>
            <button
              type="button"
              onClick={() => setModoVisualizacion('costoAcumulado')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                modoVisualizacion === 'costoAcumulado'
                  ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Barras de Costo Mensual con curva de acumulación histórica"
            >
              Costo Acumulado
            </button>
            <button
              type="button"
              onClick={() => setModoVisualizacion('cargaHoras')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                modoVisualizacion === 'cargaHoras'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Carga horaria mensual con umbrales de referencia"
            >
              Horas de Clase
            </button>
          </div>

          {/* Filtro por Estado */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-medium text-slate-500">Estado:</span>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="todos">Todos los Estados ({proyectos.length})</option>
              {estadosDisponibles.map((st) => (
                <option key={st} value={st}>
                  {st} ({proyectos.filter((p) => p.seLlevoACabo === st).length})
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Línea de Referencia */}
          <button
            type="button"
            onClick={() => setMostrarReferenciaMedia(!mostrarReferenciaMedia)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
              mostrarReferenciaMedia
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Promedio</span>
          </button>
        </div>
      </div>

      {/* 2. TARJETAS DE INDICADORES CLAVE (KPIS) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* KPI 1: Carga Horaria Acumulada */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Carga Total Histórica
            </span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono mt-1">
            {kpisGlobales.horasTotalesHistorico.toLocaleString()}
            <span className="text-xs font-normal text-slate-500 font-sans"> hrs</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Promedio: {kpisGlobales.promedioHorasPorMes} h/mes</span>
            <span className="font-semibold text-blue-700 bg-blue-50 px-1 py-0.2 rounded">
              {kpisGlobales.totalMeses} meses
            </span>
          </div>
        </div>

        {/* KPI 2: Costo Docente Acumulado */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Costo Docente Acumulado
            </span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-emerald-700 font-mono mt-1">
            {formatearMoneda(kpisGlobales.costoTotalHistorico, moneda)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Media: {formatearMoneda(kpisGlobales.promedioCostoPorMes, moneda)}/mes</span>
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded">
              100% Inversión
            </span>
          </div>
        </div>

        {/* KPI 3: Tarifa Media Histórica */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Tarifa Ponderada
            </span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono mt-1">
            {formatearMoneda(kpisGlobales.tarifaHistoricaGlobal, moneda)}
            <span className="text-xs font-normal text-slate-500 font-sans"> / h</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Tarifa base: L 200/h</span>
            <span className="font-semibold text-amber-800 bg-amber-50 px-1 py-0.2 rounded">
              Efectiva
            </span>
          </div>
        </div>

        {/* KPI 4: Mes Pico de Carga */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Mes Pico de Carga
            </span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 truncate mt-1">
            {kpisGlobales.mesPicoHoras ? kpisGlobales.mesPicoHoras.etiquetaMes : 'Sin datos'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between font-mono">
            <span>{kpisGlobales.mesPicoHoras ? `${kpisGlobales.mesPicoHoras.horasDocenteMes} hrs` : '0'}</span>
            <span className="text-indigo-700 font-semibold font-sans bg-indigo-50 px-1 py-0.2 rounded">
              {kpisGlobales.mesPicoHoras ? `${kpisGlobales.mesPicoHoras.cantidadProyectos} cursos` : '0'}
            </span>
          </div>
        </div>

        {/* KPI 5: Docentes Activos */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Claustro Docente
            </span>
            <UserCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-purple-700 font-mono mt-1">
            {kpisGlobales.totalDocentes}
            <span className="text-xs font-normal text-slate-500 font-sans"> asignados</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{proyectosFiltrados.length} programas</span>
            <span className="font-semibold text-purple-700 bg-purple-50 px-1 py-0.2 rounded">
              Activos
            </span>
          </div>
        </div>
      </div>

      {/* 3. CONTENEDOR PRINCIPAL DEL GRÁFICO DE BARRAS */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Distribución Histórica por Mes</span>
              <span className="text-[10px] font-medium text-slate-500">
                (Haz clic en cualquier barra para ver el detalle de cursos y docentes)
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              {modoVisualizacion === 'dual' && 'Barras Azules: Horas de Carga Docente (Eje Izq.) | Barras Esmeralda: Costo del Mes (Eje Der.) | Línea: Costo Acumulado'}
              {modoVisualizacion === 'costoAcumulado' && 'Barras: Costo Docente Mensual | Curva: Inversión Docente Acumulada Progresiva'}
              {modoVisualizacion === 'cargaHoras' && 'Barras: Total de Horas de Trabajo Docente impartidas en cada mes'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500">Mes seleccionado:</span>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              {mesSeleccionado ? mesSeleccionado.etiquetaMes : 'Ninguno'}
            </span>
          </div>
        </div>

        {datosMesAMes.length === 0 ? (
          <div className="h-72 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-xl">
            <Info className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">No hay proyectos para el filtro seleccionado.</p>
            <p className="text-xs text-slate-400 mt-1">Ajusta el filtro de estado o verifica que existan proyectos con fechas asignadas.</p>
          </div>
        ) : (
          <div className="h-80 sm:h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {modoVisualizacion === 'dual' ? (
                /* MODO DUAL: HORAS (BARRA AZUL) + COSTO (BARRA ESMERALDA) + LINEA ACUMULADA */
                <ComposedChart
                  data={datosMesAMes}
                  margin={{ top: 15, right: 30, left: 15, bottom: 20 }}
                  onClick={(state: any) => {
                    if (state && state.activePayload && state.activePayload.length > 0) {
                      const data = state.activePayload[0].payload as ResumenCargaCostoMes;
                      setMesSeleccionadoKey(data.mesKey);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="etiquetaCorta"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    tickLine={{ stroke: '#CBD5E1' }}
                    axisLine={{ stroke: '#CBD5E1' }}
                  />
                  {/* Eje Izquierdo: Carga de Horas */}
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    tick={{ fontSize: 11, fill: '#2563EB' }}
                    tickLine={{ stroke: '#93C5FD' }}
                    axisLine={{ stroke: '#93C5FD' }}
                    unit=" h"
                  />
                  {/* Eje Derecho: Costo Docente en Moneda */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 10, fill: '#059669' }}
                    tickLine={{ stroke: '#6EE7B7' }}
                    axisLine={{ stroke: '#6EE7B7' }}
                    tickFormatter={(val) => `${moneda} ${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip moneda={moneda} />} />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
                  />
                  {mostrarReferenciaMedia && (
                    <ReferenceLine
                      yAxisId="left"
                      y={kpisGlobales.promedioHorasPorMes}
                      stroke="#94A3B8"
                      strokeDasharray="4 4"
                      label={{
                        value: `Media: ${kpisGlobales.promedioHorasPorMes}h`,
                        fill: '#64748B',
                        fontSize: 10,
                        position: 'insideTopLeft'
                      }}
                    />
                  )}
                  {/* Barra 1: Horas de Carga de Trabajo */}
                  <Bar
                    yAxisId="left"
                    dataKey="horasDocenteMes"
                    name="Carga de Trabajo (Horas)"
                    fill="#3B82F6"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={38}
                    cursor="pointer"
                  >
                    {datosMesAMes.map((entry) => (
                      <Cell
                        key={`cell-hora-${entry.mesKey}`}
                        fill={entry.mesKey === mesSeleccionado?.mesKey ? '#1D4ED8' : '#3B82F6'}
                        opacity={entry.mesKey === mesSeleccionado?.mesKey ? 1 : 0.85}
                      />
                    ))}
                  </Bar>
                  {/* Barra 2: Costo del Mes */}
                  <Bar
                    yAxisId="right"
                    dataKey="costoDocenteMes"
                    name={`Costo Docente Mes (${moneda})`}
                    fill="#10B981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={38}
                    cursor="pointer"
                  >
                    {datosMesAMes.map((entry) => (
                      <Cell
                        key={`cell-costo-${entry.mesKey}`}
                        fill={entry.mesKey === mesSeleccionado?.mesKey ? '#047857' : '#10B981'}
                        opacity={entry.mesKey === mesSeleccionado?.mesKey ? 1 : 0.85}
                      />
                    ))}
                  </Bar>
                  {/* Línea: Costo Acumulado */}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="costoDocenteAcumulado"
                    name={`Costo Acumulado (${moneda})`}
                    stroke="#D97706"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#D97706' }}
                    activeDot={{ r: 6, fill: '#B45309' }}
                  />
                </ComposedChart>
              ) : modoVisualizacion === 'costoAcumulado' ? (
                /* MODO COSTO ACUMULADO */
                <ComposedChart
                  data={datosMesAMes}
                  margin={{ top: 15, right: 30, left: 15, bottom: 20 }}
                  onClick={(state: any) => {
                    if (state && state.activePayload && state.activePayload.length > 0) {
                      const data = state.activePayload[0].payload as ResumenCargaCostoMes;
                      setMesSeleccionadoKey(data.mesKey);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="etiquetaCorta"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    tickLine={{ stroke: '#CBD5E1' }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#059669' }}
                    tickFormatter={(val) => `${moneda} ${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip moneda={moneda} />} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                  {mostrarReferenciaMedia && (
                    <ReferenceLine
                      y={kpisGlobales.promedioCostoPorMes}
                      stroke="#94A3B8"
                      strokeDasharray="4 4"
                      label={{
                        value: `Media Mes: ${formatearMoneda(kpisGlobales.promedioCostoPorMes, moneda)}`,
                        fill: '#64748B',
                        fontSize: 10,
                        position: 'insideTopLeft'
                      }}
                    />
                  )}
                  <Bar
                    dataKey="costoDocenteMes"
                    name={`Costo Docente Mes (${moneda})`}
                    fill="#10B981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                    cursor="pointer"
                  >
                    {datosMesAMes.map((entry) => (
                      <Cell
                        key={`cell-costo-bar-${entry.mesKey}`}
                        fill={entry.mesKey === mesSeleccionado?.mesKey ? '#047857' : '#10B981'}
                      />
                    ))}
                  </Bar>
                  <Line
                    type="monotone"
                    dataKey="costoDocenteAcumulado"
                    name={`Costo Histórico Acumulado (${moneda})`}
                    stroke="#D97706"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#D97706' }}
                  />
                </ComposedChart>
              ) : (
                /* MODO CARGA DE HORAS */
                <BarChart
                  data={datosMesAMes}
                  margin={{ top: 15, right: 20, left: 10, bottom: 20 }}
                  onClick={(state: any) => {
                    if (state && state.activePayload && state.activePayload.length > 0) {
                      const data = state.activePayload[0].payload as ResumenCargaCostoMes;
                      setMesSeleccionadoKey(data.mesKey);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="etiquetaCorta"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    tickLine={{ stroke: '#CBD5E1' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#4F46E5' }}
                    unit=" h"
                  />
                  <Tooltip content={<CustomTooltip moneda={moneda} />} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                  {mostrarReferenciaMedia && (
                    <ReferenceLine
                      y={kpisGlobales.promedioHorasPorMes}
                      stroke="#818CF8"
                      strokeDasharray="4 4"
                      label={{
                        value: `Capacidad Promedio: ${kpisGlobales.promedioHorasPorMes}h`,
                        fill: '#4F46E5',
                        fontSize: 10,
                        position: 'insideTopLeft'
                      }}
                    />
                  )}
                  <Bar
                    dataKey="horasDocenteMes"
                    name="Horas de Clase Impartidas"
                    fill="#6366F1"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={50}
                    cursor="pointer"
                  >
                    {datosMesAMes.map((entry) => (
                      <Cell
                        key={`cell-horas-only-${entry.mesKey}`}
                        fill={
                          entry.mesKey === mesSeleccionado?.mesKey
                            ? '#4338CA'
                            : entry.horasDocenteMes >= kpisGlobales.promedioHorasPorMes
                            ? '#6366F1'
                            : '#A5B4FC'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 4. DETALLE DEL MES SELECCIONADO (DRILLDOWN INTERACTIVO) */}
      {mesSeleccionado && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">
                  Desglose de Cursos y Docentes: {mesSeleccionado.etiquetaMes}
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {mesSeleccionado.cantidadProyectos} programas
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Carga: <strong className="text-slate-800 font-mono">{mesSeleccionado.horasDocenteMes} hrs</strong> • Inversión del mes: <strong className="text-emerald-700 font-mono">{formatearMoneda(mesSeleccionado.costoDocenteMes, moneda)}</strong> ({mesSeleccionado.porcentajeDelCostoTotal}% del histórico) • Acumulado a este mes: <strong className="text-amber-700 font-mono">{formatearMoneda(mesSeleccionado.costoDocenteAcumulado, moneda)}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium">Docentes convocados:</span>
              <span className="text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                {mesSeleccionado.docentesUnicos.length} profesores
              </span>
            </div>
          </div>

          {/* Tabla de Cursos del Mes */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-600">
                  <th className="py-2.5 px-3">Código</th>
                  <th className="py-2.5 px-3">Nombre del Programa</th>
                  <th className="py-2.5 px-3">Docente Titular</th>
                  <th className="py-2.5 px-3 text-right">Horas</th>
                  <th className="py-2.5 px-3 text-right">Tarifa/h</th>
                  <th className="py-2.5 px-3 text-right">Costo Docente</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mesSeleccionado.proyectos.map((proy) => {
                  const tarifa = proy.tarifaHoraDocente ?? 200;
                  const horas = proy.horasClase || 0;
                  const costo = proy.costoDocenteManual && proy.costoDocenteManual > 0
                    ? proy.costoDocenteManual
                    : horas * tarifa;

                  return (
                    <tr key={proy.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-600 text-[11px]">
                        {proy.codigoProyecto || 'SIG-ACAD'}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-xs truncate">
                        {proy.nombreProyecto}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                          <span>{proy.nombreDocente || 'Por Designar'}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                        {horas} h
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {formatearMoneda(tarifa, moneda)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        {formatearMoneda(costo, moneda)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          proy.seLlevoACabo === 'Listo'
                            ? 'bg-emerald-100 text-emerald-800'
                            : proy.seLlevoACabo === 'Planificado'
                            ? 'bg-blue-100 text-blue-800'
                            : proy.seLlevoACabo === 'En proceso'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {proy.seLlevoACabo}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-900">
                  <td colSpan={3} className="py-2 px-3 text-xs">
                    Subtotal Mensual Consolidado
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-blue-700">
                    {mesSeleccionado.horasDocenteMes} h
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-600">
                    {formatearMoneda(mesSeleccionado.tarifaPromedioMes, moneda)}/h
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-emerald-700">
                    {formatearMoneda(mesSeleccionado.costoDocenteMes, moneda)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 5. RANKING DE DOCENTES CON MAYOR CARGA HORARIA */}
      {docentesRanking.length > 0 && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-purple-600" />
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                Distribución de Carga de Trabajo por Docente (Histórico)
              </h4>
            </div>
            <span className="text-[11px] font-medium text-slate-500">
              Total {docentesRanking.length} profesionales
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {docentesRanking.slice(0, 6).map((doc, idx) => {
              const pctHoras = kpisGlobales.horasTotalesHistorico > 0
                ? ((doc.horas / kpisGlobales.horasTotalesHistorico) * 100).toFixed(1)
                : '0';

              return (
                <div
                  key={doc.nombre}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 font-mono">#{idx + 1}</span>
                      <p className="text-xs font-bold text-slate-800 truncate">{doc.nombre}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span>{doc.cursos} programas</span>
                      <span>•</span>
                      <span className="font-mono text-emerald-700 font-semibold">
                        {formatearMoneda(doc.costo, moneda)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold font-mono text-blue-700">{doc.horas} h</span>
                    <span className="block text-[10px] text-slate-400 font-mono">{pctHoras}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente Personalizado para Tooltip Recharts
const CustomTooltip = ({ active, payload, moneda }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ResumenCargaCostoMes;
    return (
      <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-800 text-xs min-w-[240px] space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
          <span className="font-bold text-blue-300">{data.etiquetaMes}</span>
          <span className="text-[10px] font-mono text-slate-400">{data.cantidadProyectos} cursos</span>
        </div>

        <div className="space-y-1 text-[11px]">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              Carga de Trabajo:
            </span>
            <strong className="text-white font-mono">{data.horasDocenteMes} hrs</strong>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Costo Docente Mes:
            </span>
            <strong className="text-emerald-400 font-mono">{formatearMoneda(data.costoDocenteMes, moneda)}</strong>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Costo Acumulado:
            </span>
            <strong className="text-amber-300 font-mono">{formatearMoneda(data.costoDocenteAcumulado, moneda)}</strong>
          </div>

          <div className="flex items-center justify-between text-slate-400 text-[10px] pt-1 border-t border-slate-800">
            <span>Tarifa Promedio Ponderada:</span>
            <span className="font-mono text-slate-300">{formatearMoneda(data.tarifaPromedioMes, moneda)} / h</span>
          </div>

          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span>Horas Acumuladas:</span>
            <span className="font-mono text-slate-300">{data.horasDocenteAcumuladas} hrs</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};
