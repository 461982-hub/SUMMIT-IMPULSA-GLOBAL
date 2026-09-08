import React, { useState, useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  Area,
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
  TrendingUp,
  TrendingDown,
  GraduationCap,
  DollarSign,
  Calendar,
  Sparkles,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Layers,
  HelpCircle,
  BarChart3,
  Clock,
  Award
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { formatearMoneda } from '../../utils/calculations';
import { 
  obtenerClaveMesProyecto, 
  formatearEtiquetaMes, 
  formatearEtiquetaCortaMes 
} from '../../utils/monthUtils';

interface DocenteRentabilidadTendenciaChartProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  embedded?: boolean;
}

export interface ResumenTendenciaMes {
  mesKey: string;
  etiquetaMes: string;
  etiquetaCorta: string;
  cantidadProyectos: number;
  horasTotales: number;
  tarifaDocentePromedioPonderada: number;
  tarifaDocentePromedioSimple: number;
  tarifaDocenteMin: number;
  tarifaDocenteMax: number;
  costoDocenteTotal: number;
  gastoTotalOperativo: number;
  ingresoRealTotal: number;
  gananciaRealTotal: number;
  pesoDocenteEnGastoPct: number;
  rentabilidadRoiPct: number;
  margenUtilidadVentaPct: number;
  alumnosTotales: number;
  deltaTarifaPonderada: number;
  deltaRentabilidadRoi: number;
  proyectos: ProyectoEducativo[];
}

export const DocenteRentabilidadTendenciaChart: React.FC<DocenteRentabilidadTendenciaChartProps> = ({
  proyectos,
  moneda,
  embedded = false,
}) => {
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [metricaRentabilidad, setMetricaRentabilidad] = useState<'roi' | 'margenVenta' | 'utilidad'>('roi');
  const [tipoTarifa, setTipoTarifa] = useState<'ponderada' | 'simple'>('ponderada');
  const [mostrarReferenciaMeta, setMostrarReferenciaMeta] = useState<boolean>(true);

  // Filtrado de proyectos
  const proyectosFiltrados = useMemo(() => {
    if (filtroEstado === 'todos') return proyectos;
    return proyectos.filter((p) => p.seLlevoACabo === filtroEstado);
  }, [proyectos, filtroEstado]);

  // Agrupación y cálculo histórico mes a mes
  const datosMesAMes = useMemo<ResumenTendenciaMes[]>(() => {
    const agrupado: Record<string, ProyectoEducativo[]> = {};

    proyectosFiltrados.forEach((p) => {
      const key = obtenerClaveMesProyecto(p);
      if (!agrupado[key]) {
        agrupado[key] = [];
      }
      agrupado[key].push(p);
    });

    const mesesOrdenados = Object.keys(agrupado).sort((a, b) => a.localeCompare(b));

    let tarifaAnterior = 0;
    let rentabilidadAnterior = 0;

    return mesesOrdenados.map((mesKey, index) => {
      const proys = agrupado[mesKey];
      const cantidadProyectos = proys.length;

      // Métricas de docentes
      let sumaPonderadaTarifa = 0;
      let horasTotales = 0;
      let sumaTarifasSimples = 0;
      let tarifaMin = Infinity;
      let tarifaMax = -Infinity;
      let costoDocenteTotal = 0;

      proys.forEach((p) => {
        const tarifa = Math.max(0, p.tarifaHoraDocente ?? 200);
        const horas = Math.max(0, p.horasClase || 0);
        const costoDocente = p.costoDocenteManual && p.costoDocenteManual > 0
          ? p.costoDocenteManual
          : horas * tarifa;

        horasTotales += horas;
        sumaPonderadaTarifa += tarifa * (horas > 0 ? horas : 1);
        sumaTarifasSimples += tarifa;
        costoDocenteTotal += costoDocente;

        if (tarifa < tarifaMin) tarifaMin = tarifa;
        if (tarifa > tarifaMax) tarifaMax = tarifa;
      });

      if (tarifaMin === Infinity) tarifaMin = 0;
      if (tarifaMax === -Infinity) tarifaMax = 0;

      const tarifaPonderada = horasTotales > 0
        ? Math.round(sumaPonderadaTarifa / horasTotales)
        : Math.round(sumaTarifasSimples / (cantidadProyectos || 1));

      const tarifaSimple = Math.round(sumaTarifasSimples / (cantidadProyectos || 1));

      // Métricas financieras reales
      const gastoTotalOperativo = proys.reduce((acc, p) => acc + (p.gastoTotalOperativo || 0), 0);
      const ingresoRealTotal = proys.reduce((acc, p) => acc + (p.ingresoRealTotal || 0), 0);
      const gananciaRealTotal = proys.reduce((acc, p) => acc + (p.totalGananciasFinales || 0), 0);
      const alumnosTotales = proys.reduce((acc, p) => acc + (Number(p.alumnosFinal) || 0), 0);

      // Rentabilidad real
      const rentabilidadRoiPct = gastoTotalOperativo > 0
        ? Number(((gananciaRealTotal / gastoTotalOperativo) * 100).toFixed(1))
        : 0;

      const margenUtilidadVentaPct = ingresoRealTotal > 0
        ? Number(((gananciaRealTotal / ingresoRealTotal) * 100).toFixed(1))
        : 0;

      const pesoDocenteEnGastoPct = gastoTotalOperativo > 0
        ? Number(((costoDocenteTotal / gastoTotalOperativo) * 100).toFixed(1))
        : 0;

      // Variaciones vs mes anterior
      const deltaTarifaPonderada = index === 0 ? 0 : tarifaPonderada - tarifaAnterior;
      const deltaRentabilidadRoi = index === 0 ? 0 : Number((rentabilidadRoiPct - rentabilidadAnterior).toFixed(1));

      tarifaAnterior = tarifaPonderada;
      rentabilidadAnterior = rentabilidadRoiPct;

      return {
        mesKey,
        etiquetaMes: formatearEtiquetaMes(mesKey),
        etiquetaCorta: formatearEtiquetaCortaMes(mesKey),
        cantidadProyectos,
        horasTotales,
        tarifaDocentePromedioPonderada: tarifaPonderada,
        tarifaDocentePromedioSimple: tarifaSimple,
        tarifaDocenteMin: tarifaMin,
        tarifaDocenteMax: tarifaMax,
        costoDocenteTotal,
        gastoTotalOperativo,
        ingresoRealTotal,
        gananciaRealTotal,
        pesoDocenteEnGastoPct,
        rentabilidadRoiPct,
        margenUtilidadVentaPct,
        alumnosTotales,
        deltaTarifaPonderada,
        deltaRentabilidadRoi,
        proyectos: proys,
      };
    });
  }, [proyectosFiltrados]);

  // Indicadores Globales de la Tendencia
  const kpisGlobales = useMemo(() => {
    if (datosMesAMes.length === 0) {
      return {
        tarifaPromedioHistorica: 0,
        tarifaMinGlobal: 0,
        tarifaMaxGlobal: 0,
        rentabilidadPromedioPonderada: 0,
        margenVentaPromedio: 0,
        totalGastoDocente: 0,
        totalGastoOperativo: 0,
        pesoDocenteGlobal: 0,
        mesMayorRentabilidad: null,
        mesMayorTarifa: null,
        coeficienteCorrelacion: 0,
        diagnosticoTexto: 'Sin datos disponibles para calcular la tendencia.',
        tipoDiagnostico: 'neutral' as 'positivo' | 'alerta' | 'neutral',
      };
    }

    let sumaHoras = 0;
    let sumaCostoDocente = 0;
    let sumaGastoOperativo = 0;
    let sumaIngresos = 0;
    let sumaGanancias = 0;

    let minTarifa = Infinity;
    let maxTarifa = -Infinity;

    datosMesAMes.forEach((m) => {
      sumaHoras += m.horasTotales;
      sumaCostoDocente += m.costoDocenteTotal;
      sumaGastoOperativo += m.gastoTotalOperativo;
      sumaIngresos += m.ingresoRealTotal;
      sumaGanancias += m.gananciaRealTotal;

      if (m.tarifaDocenteMin < minTarifa) minTarifa = m.tarifaDocenteMin;
      if (m.tarifaDocenteMax > maxTarifa) maxTarifa = m.tarifaDocenteMax;
    });

    const tarifaPromedioHistorica = sumaHoras > 0
      ? Math.round(sumaCostoDocente / sumaHoras)
      : 200;

    const rentabilidadPromedioPonderada = sumaGastoOperativo > 0
      ? Number(((sumaGanancias / sumaGastoOperativo) * 100).toFixed(1))
      : 0;

    const margenVentaPromedio = sumaIngresos > 0
      ? Number(((sumaGanancias / sumaIngresos) * 100).toFixed(1))
      : 0;

    const pesoDocenteGlobal = sumaGastoOperativo > 0
      ? Number(((sumaCostoDocente / sumaGastoOperativo) * 100).toFixed(1))
      : 0;

    // Mes pico de rentabilidad
    const mesMayorRentabilidad = [...datosMesAMes].sort((a, b) => b.rentabilidadRoiPct - a.rentabilidadRoiPct)[0];
    const mesMayorTarifa = [...datosMesAMes].sort((a, b) => b.tarifaDocentePromedioPonderada - a.tarifaDocentePromedioPonderada)[0];

    // Correlación de Pearson entre Tarifa Docente y Rentabilidad Real (ROI)
    let n = datosMesAMes.length;
    let r = 0;
    if (n >= 2) {
      const avgX = datosMesAMes.reduce((acc, d) => acc + d.tarifaDocentePromedioPonderada, 0) / n;
      const avgY = datosMesAMes.reduce((acc, d) => acc + d.rentabilidadRoiPct, 0) / n;

      let num = 0;
      let denX = 0;
      let denY = 0;

      datosMesAMes.forEach((d) => {
        const dx = d.tarifaDocentePromedioPonderada - avgX;
        const dy = d.rentabilidadRoiPct - avgY;
        num += dx * dy;
        denX += dx * dx;
        denY += dy * dy;
      });

      const den = Math.sqrt(denX * denY);
      r = den > 0 ? num / den : 0;
    }

    let diagnosticoTexto = '';
    let tipoDiagnostico: 'positivo' | 'alerta' | 'neutral' = 'neutral';

    if (r > 0.3) {
      tipoDiagnostico = 'positivo';
      diagnosticoTexto = `Correlación Positiva (+${r.toFixed(2)}): Los meses con docentes de mayor tarifa corresponden a programas de alta especialidad que captaron mayor ticket o número de alumnos, logrando márgenes reales superiores sin erosionar la rentabilidad.`;
    } else if (r < -0.3) {
      tipoDiagnostico = 'alerta';
      diagnosticoTexto = `Correlación Inversa (-${Math.abs(r).toFixed(2)}): Alzas en la tarifa docente presionaron los márgenes reales a la baja. Se recomienda vigilar que los cursos con honorarios docentes elevados exijan una meta de alumnos más estricta o mayor precio de venta.`;
    } else {
      tipoDiagnostico = 'neutral';
      diagnosticoTexto = `Equilibrio Estable (r = ${r.toFixed(2)}): La política de precios y el aforo institucional amortiguan eficazmente las variaciones en la tarifa horaria docente, manteniendo la rentabilidad en torno a la meta de dirección.`;
    }

    return {
      tarifaPromedioHistorica,
      tarifaMinGlobal: minTarifa === Infinity ? 0 : minTarifa,
      tarifaMaxGlobal: maxTarifa === -Infinity ? 0 : maxTarifa,
      rentabilidadPromedioPonderada,
      margenVentaPromedio,
      totalGastoDocente: sumaCostoDocente,
      totalGastoOperativo: sumaGastoOperativo,
      pesoDocenteGlobal,
      mesMayorRentabilidad,
      mesMayorTarifa,
      coeficienteCorrelacion: r,
      diagnosticoTexto,
      tipoDiagnostico,
    };
  }, [datosMesAMes]);

  // Preparación de datos para Recharts
  const chartData = useMemo(() => {
    return datosMesAMes.map((m) => {
      const valorTarifa = tipoTarifa === 'ponderada' 
        ? m.tarifaDocentePromedioPonderada 
        : m.tarifaDocentePromedioSimple;

      const valorRentabilidad = metricaRentabilidad === 'roi'
        ? m.rentabilidadRoiPct
        : metricaRentabilidad === 'margenVenta'
        ? m.margenUtilidadVentaPct
        : m.gananciaRealTotal;

      return {
        mesKey: m.mesKey,
        etiqueta: m.etiquetaCorta,
        etiquetaMes: m.etiquetaMes,
        tarifaDocente: valorTarifa,
        rentabilidad: valorRentabilidad,
        rentabilidadRoi: m.rentabilidadRoiPct,
        margenVenta: m.margenUtilidadVentaPct,
        gananciaReal: m.gananciaRealTotal,
        costoDocente: m.costoDocenteTotal,
        gastoTotal: m.gastoTotalOperativo,
        ingresoReal: m.ingresoRealTotal,
        proyectosCount: m.cantidadProyectos,
        horas: m.horasTotales,
        alumnos: m.alumnosTotales,
        pesoDocente: m.pesoDocenteEnGastoPct,
      };
    });
  }, [datosMesAMes, tipoTarifa, metricaRentabilidad]);

  // Estados únicos disponibles en los proyectos
  const estadosDisponibles = useMemo(() => {
    return Array.from(new Set(proyectos.map((p) => p.seLlevoACabo).filter(Boolean)));
  }, [proyectos]);

  return (
    <div className={`space-y-4 ${embedded ? '' : 'p-1 sm:p-2'}`} id="tendencia-docente-rentabilidad-container">
      {/* CABECERA Y CONTEXTO */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0 shadow-2xs">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Evolución Histórica: Tarifa Hora Docente vs. Rentabilidad Real
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                <Calendar className="w-3 h-3 text-blue-600" />
                Seguimiento Mes a Mes
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Evalúa cómo incide la variación de honorarios académicos docentes en la rentabilidad neta lograda en cada ciclo de ventas.
            </p>
          </div>
        </div>

        {/* CONTROLES RÁPIDOS DE FILTRADO */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro por Estado */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-medium text-slate-500">Estado:</span>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="todos">Todos ({proyectos.length})</option>
              {estadosDisponibles.map((st) => (
                <option key={st} value={st}>
                  {st} ({proyectos.filter((p) => p.seLlevoACabo === st).length})
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Métrica de Rentabilidad */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
            <button
              type="button"
              onClick={() => setMetricaRentabilidad('roi')}
              className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer ${
                metricaRentabilidad === 'roi'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Rentabilidad sobre costo operativo (ROI %)"
            >
              Margen Costo (ROI %)
            </button>
            <button
              type="button"
              onClick={() => setMetricaRentabilidad('margenVenta')}
              className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer ${
                metricaRentabilidad === 'margenVenta'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Margen neto sobre ventas (% Utilidad)"
            >
              Margen Ventas %
            </button>
            <button
              type="button"
              onClick={() => setMetricaRentabilidad('utilidad')}
              className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer ${
                metricaRentabilidad === 'utilidad'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title={`Utilidad neta real en ${moneda}`}
            >
              Utilidad ({moneda})
            </button>
          </div>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Tarifa Hora Docente Promedio */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Tarifa Docente Promedio
            </span>
            <GraduationCap className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono mt-1">
            {formatearMoneda(kpisGlobales.tarifaPromedioHistorica, moneda)}
            <span className="text-xs font-normal text-slate-500 font-sans"> / h</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Rango: {formatearMoneda(kpisGlobales.tarifaMinGlobal, moneda)} - {formatearMoneda(kpisGlobales.tarifaMaxGlobal, moneda)}</span>
            <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
              Base: L 200/h
            </span>
          </div>
        </div>

        {/* 2. Rentabilidad Real Promedio */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Rentabilidad Real Ponderada
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold font-mono mt-1 text-emerald-700">
            {kpisGlobales.rentabilidadPromedioPonderada}%
            <span className="text-xs font-normal text-slate-500 font-sans"> ROI</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Margen sobre ventas: <strong className="text-slate-700">{kpisGlobales.margenVentaPromedio}%</strong></span>
            <span className={`font-semibold px-1.5 py-0.2 rounded text-[10px] ${
              kpisGlobales.rentabilidadPromedioPonderada >= 30
                ? 'bg-emerald-50 text-emerald-800'
                : 'bg-amber-50 text-amber-800'
            }`}>
              Meta: 30%
            </span>
          </div>
        </div>

        {/* 3. Inversión Docente vs Gasto */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Gasto Docente Acumulado
            </span>
            <DollarSign className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono mt-1">
            {formatearMoneda(kpisGlobales.totalGastoDocente, moneda)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Participación: <strong className="text-indigo-700">{kpisGlobales.pesoDocenteGlobal}%</strong> del gasto</span>
            <span className="text-slate-400">Total {formatearMoneda(kpisGlobales.totalGastoOperativo, moneda)}</span>
          </div>
        </div>

        {/* 4. Mes Pico de Rentabilidad */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Mes Mayor Desempeño
            </span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-sm sm:text-base font-extrabold text-slate-900 truncate mt-1">
            {kpisGlobales.mesMayorRentabilidad ? kpisGlobales.mesMayorRentabilidad.etiquetaMes : 'N/A'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
            {kpisGlobales.mesMayorRentabilidad ? (
              <>
                <span>ROI: <strong className="text-emerald-700 font-mono">{kpisGlobales.mesMayorRentabilidad.rentabilidadRoiPct}%</strong></span>
                <span className="font-mono text-slate-600">Tarifa: {formatearMoneda(kpisGlobales.mesMayorRentabilidad.tarifaDocentePromedioPonderada, moneda)}/h</span>
              </>
            ) : (
              <span>Sin registros</span>
            )}
          </div>
        </div>
      </div>

      {/* ÁREA PRINCIPAL: GRÁFICO COMBINADO DE DOBLE EJE */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">
                Visualización de Doble Eje: Tarifa Docente (Izquierda) vs. Rentabilidad (Derecha)
              </h4>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Eje Y1 (Azul): Tarifa por hora en {moneda} • Eje Y2 (Verde):{' '}
              {metricaRentabilidad === 'roi' ? 'Rentabilidad ROI (%)' : metricaRentabilidad === 'margenVenta' ? 'Margen sobre Venta (%)' : `Utilidad Real (${moneda})`}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {/* Toggle Tipo Tarifa */}
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <span>Tarifa:</span>
              <button
                type="button"
                onClick={() => setTipoTarifa('ponderada')}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${
                  tipoTarifa === 'ponderada' ? 'bg-blue-100 text-blue-800 font-bold' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Ponderada
              </button>
              <button
                type="button"
                onClick={() => setTipoTarifa('simple')}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${
                  tipoTarifa === 'simple' ? 'bg-blue-100 text-blue-800 font-bold' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Simple
              </button>
            </div>

            {/* Checkbox Meta 30% */}
            {metricaRentabilidad !== 'utilidad' && (
              <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={mostrarReferenciaMeta}
                  onChange={(e) => setMostrarReferenciaMeta(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span>Línea Meta 30%</span>
              </label>
            )}
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="py-14 text-center text-slate-400 space-y-2">
            <Calendar className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-semibold text-sm text-slate-600">No hay información de meses para graficar.</p>
            <p className="text-xs text-slate-400">Verifique los filtros seleccionados o añada nuevos proyectos con fecha de impartición.</p>
          </div>
        ) : (
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 15, right: 30, left: 10, bottom: 25 }}
              >
                <defs>
                  <linearGradient id="colorTarifaDocente" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="colorRentabilidad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                
                <XAxis
                  dataKey="etiqueta"
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />

                {/* Eje Izquierdo: Tarifa Docente (Moneda / hora) */}
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  stroke="#2563eb"
                  tick={{ fontSize: 11, fill: '#2563eb' }}
                  tickFormatter={(val) => `${moneda} ${val}`}
                  domain={['auto', 'auto']}
                  axisLine={{ stroke: '#93c5fd' }}
                  tickLine={false}
                />

                {/* Eje Derecho: Rentabilidad Real (% o Moneda) */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#059669"
                  tick={{ fontSize: 11, fill: '#059669' }}
                  tickFormatter={(val) => metricaRentabilidad === 'utilidad' ? `${val.toLocaleString()}` : `${val}%`}
                  domain={['auto', 'auto']}
                  axisLine={{ stroke: '#6ee7b7' }}
                  tickLine={false}
                />

                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900/95 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs min-w-[240px] space-y-2 backdrop-blur-xs">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                          <span className="font-bold text-slate-200">{data.etiquetaMes}</span>
                          <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                            {data.proyectosCount} curso(s) • {data.horas}h
                          </span>
                        </div>

                        <div className="space-y-1.5 text-[11px]">
                          <div className="flex items-center justify-between text-blue-300">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                              Tarifa Docente Prom.:
                            </span>
                            <strong className="font-mono">{formatearMoneda(data.tarifaDocente, moneda)}/h</strong>
                          </div>

                          <div className="flex items-center justify-between text-emerald-300">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              Rentabilidad Real (ROI):
                            </span>
                            <strong className="font-mono font-bold">{data.rentabilidadRoi}%</strong>
                          </div>

                          <div className="flex items-center justify-between text-slate-300">
                            <span>Margen sobre Ventas:</span>
                            <strong className="font-mono">{data.margenVenta}%</strong>
                          </div>

                          <div className="flex items-center justify-between text-amber-300">
                            <span>Utilidad Neta Real:</span>
                            <strong className="font-mono">{formatearMoneda(data.gananciaReal, moneda)}</strong>
                          </div>

                          <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-slate-400 text-[10px]">
                            <span>Costo Docente Total:</span>
                            <span className="font-mono">{formatearMoneda(data.costoDocente, moneda)} ({data.pesoDocente}% del gasto)</span>
                          </div>

                          <div className="flex items-center justify-between text-slate-400 text-[10px]">
                            <span>Alumnos Inscritos:</span>
                            <span className="font-semibold text-slate-200">{data.alumnos} participantes</span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />

                <Legend
                  verticalAlign="top"
                  height={36}
                  wrapperStyle={{ fontSize: '11px', paddingBottom: '4px' }}
                  formatter={(value) => {
                    if (value === 'tarifaDocente') return `Tarifa Hora Docente (${moneda}/h)`;
                    if (value === 'rentabilidad') {
                      return metricaRentabilidad === 'roi'
                        ? 'Rentabilidad Real ROI (%)'
                        : metricaRentabilidad === 'margenVenta'
                        ? 'Margen Real sobre Ventas (%)'
                        : `Utilidad Real (${moneda})`;
                    }
                    return value;
                  }}
                />

                {/* Línea de referencia estándar de Meta 30% */}
                {mostrarReferenciaMeta && metricaRentabilidad !== 'utilidad' && (
                  <ReferenceLine
                    yAxisId="right"
                    y={30}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: 'Meta 30%',
                      position: 'insideTopRight',
                      fill: '#d97706',
                      fontSize: 10,
                      fontWeight: 'bold',
                    }}
                  />
                )}

                {/* Área y Línea de Tarifa Docente (Eje Izquierdo) */}
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="tarifaDocente"
                  name="tarifaDocente"
                  fill="url(#colorTarifaDocente)"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#1d4ed8' }}
                />

                {/* Línea de Rentabilidad Real (Eje Derecho) */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="rentabilidad"
                  name="rentabilidad"
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#047857' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* DICTAMEN ESTRATÉGICO Y ANÁLISIS DE CORRELACIÓN */}
        <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
          kpisGlobales.tipoDiagnostico === 'positivo'
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            : kpisGlobales.tipoDiagnostico === 'alerta'
            ? 'bg-amber-50/70 border-amber-200 text-amber-950'
            : 'bg-blue-50/70 border-blue-200 text-blue-950'
        }`}>
          <div className="font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Diagnóstico de Elasticidad & Sensibilidad Docente</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/80 border border-slate-200 text-slate-700">
              Pearson r: {kpisGlobales.coeficienteCorrelacion.toFixed(2)}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed opacity-90">
            {kpisGlobales.diagnosticoTexto}
          </p>
        </div>

        {/* TABLA COMPARATIVA MES A MES */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Evolución Mensual Detallada
            </span>
            <span className="text-[10px] text-slate-500">
              {datosMesAMes.length} períodos registrados
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">Mes / Período</th>
                  <th className="px-3 py-2.5 text-center">Cursos</th>
                  <th className="px-3 py-2.5 text-center">Horas</th>
                  <th className="px-3 py-2.5 text-right">Tarifa Docente Prom.</th>
                  <th className="px-3 py-2.5 text-right">Costo Docente Total</th>
                  <th className="px-3 py-2.5 text-center">% del Gasto</th>
                  <th className="px-3 py-2.5 text-right">Rentabilidad ROI</th>
                  <th className="px-3 py-2.5 text-right">Utilidad Neta</th>
                  <th className="px-3 py-2.5 text-center">Estado Margen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {datosMesAMes.map((m, idx) => {
                  const tieneMeta = m.rentabilidadRoiPct >= 30;
                  const esBajo = m.rentabilidadRoiPct < 15;

                  return (
                    <tr key={m.mesKey} className="hover:bg-slate-50/80 transition-colors">
                      {/* Mes */}
                      <td className="px-3 py-2.5 font-bold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                          <span>{m.etiquetaMes}</span>
                        </div>
                      </td>

                      {/* Cursos */}
                      <td className="px-3 py-2.5 text-center font-medium text-slate-700">
                        {m.cantidadProyectos}
                      </td>

                      {/* Horas */}
                      <td className="px-3 py-2.5 text-center text-slate-600 font-mono">
                        {m.horasTotales}h
                      </td>

                      {/* Tarifa Docente */}
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1 font-mono font-bold text-blue-700">
                          <span>{formatearMoneda(m.tarifaDocentePromedioPonderada, moneda)}/h</span>
                          {idx > 0 && m.deltaTarifaPonderada !== 0 && (
                            <span 
                              className={`text-[9px] flex items-center font-sans ${
                                m.deltaTarifaPonderada > 0 ? 'text-amber-600' : 'text-emerald-600'
                              }`}
                              title={`Variación de ${m.deltaTarifaPonderada > 0 ? '+' : ''}${m.deltaTarifaPonderada} vs mes previo`}
                            >
                              {m.deltaTarifaPonderada > 0 ? (
                                <ArrowUpRight className="w-2.5 h-2.5" />
                              ) : (
                                <ArrowDownRight className="w-2.5 h-2.5" />
                              )}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Costo Docente Total */}
                      <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                        {formatearMoneda(m.costoDocenteTotal, moneda)}
                      </td>

                      {/* % del Gasto */}
                      <td className="px-3 py-2.5 text-center font-mono text-[11px] text-slate-600">
                        {m.pesoDocenteEnGastoPct}%
                      </td>

                      {/* Rentabilidad ROI */}
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1 font-mono font-extrabold text-slate-900">
                          <span className={tieneMeta ? 'text-emerald-700' : esBajo ? 'text-rose-600' : 'text-amber-600'}>
                            {m.rentabilidadRoiPct}%
                          </span>
                          {idx > 0 && m.deltaRentabilidadRoi !== 0 && (
                            <span 
                              className={`text-[9px] flex items-center font-sans ${
                                m.deltaRentabilidadRoi > 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                              title={`Variación de ${m.deltaRentabilidadRoi > 0 ? '+' : ''}${m.deltaRentabilidadRoi} pts vs mes previo`}
                            >
                              {m.deltaRentabilidadRoi > 0 ? (
                                <ArrowUpRight className="w-2.5 h-2.5" />
                              ) : (
                                <ArrowDownRight className="w-2.5 h-2.5" />
                              )}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Utilidad Neta */}
                      <td className="px-3 py-2.5 text-right font-mono font-semibold text-emerald-700">
                        {formatearMoneda(m.gananciaRealTotal, moneda)}
                      </td>

                      {/* Estado Margen */}
                      <td className="px-3 py-2.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tieneMeta
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : esBajo
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {tieneMeta ? (
                            <>
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Óptimo (≥30%)
                            </>
                          ) : esBajo ? (
                            <>
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Comprimido (&lt;15%)
                            </>
                          ) : (
                            <>
                              <Minus className="w-2.5 h-2.5" />
                              Aceptable (15-29%)
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
