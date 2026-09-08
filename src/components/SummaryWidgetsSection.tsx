import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  Percent, 
  Target, 
  CalendarDays, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles, 
  Filter, 
  ChevronRight,
  Info,
  Layers
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../types';
import { formatearMoneda } from '../utils/calculations';
import { obtenerClaveMesProyecto, formatearEtiquetaMes } from '../utils/monthUtils';

interface SummaryWidgetsSectionProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onFiltrarCriticos?: () => void;
  onIrAMatriz?: () => void;
  mesFiltroActivo?: string;
  onCambiarMesFiltro?: (mesKey: string) => void;
}

export const SummaryWidgetsSection: React.FC<SummaryWidgetsSectionProps> = ({
  proyectos,
  moneda,
  onFiltrarCriticos,
  onIrAMatriz,
  mesFiltroActivo = 'todos',
  onCambiarMesFiltro,
}) => {
  // Determinar mes actual del calendario (año-mes, ej: 2026-09)
  const mesActualCalendario = useMemo(() => {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    return `${anio}-${mes}`;
  }, []);

  // Mes seleccionado para el widget de margen mensual
  const [mesSeleccionadoWidget, setMesSeleccionadoWidget] = useState<string>(() => {
    if (mesFiltroActivo && mesFiltroActivo !== 'todos') {
      return mesFiltroActivo;
    }
    return mesActualCalendario;
  });

  // Lista de meses disponibles en los proyectos para el selector rápido
  const mesesDisponibles = useMemo(() => {
    const setMeses = new Set<string>();
    proyectos.forEach((p) => {
      const key = obtenerClaveMesProyecto(p);
      if (key) setMeses.add(key);
    });
    // Asegurar que el mes calendario actual esté en la lista para referencia
    setMeses.add(mesActualCalendario);
    return Array.from(setMeses).sort();
  }, [proyectos, mesActualCalendario]);

  // Si cambia el filtro global de mes externo, sincronizar el widget
  React.useEffect(() => {
    if (mesFiltroActivo && mesFiltroActivo !== 'todos') {
      setMesSeleccionadoWidget(mesFiltroActivo);
    }
  }, [mesFiltroActivo]);

  // ==========================================
  // 1. KPI: INGRESOS TOTALES PROYECTADOS
  // ==========================================
  // En SUMMIT, el precioVentaRequerido es la meta de ingreso proyectada institucional
  // requerida para cubrir todos los costos operativos más el margen de ganancia configurado.
  const totalIngresosProyectados = useMemo(() => {
    return proyectos.reduce((acc, p) => acc + (p.precioVentaRequerido || 0), 0);
  }, [proyectos]);

  const totalIngresosReales = useMemo(() => {
    return proyectos.reduce((acc, p) => acc + (p.ingresoRealTotal || p.ingresoTotalNeto || 0), 0);
  }, [proyectos]);

  const pctEjecucionIngresos = useMemo(() => {
    if (totalIngresosProyectados <= 0) return 0;
    return (totalIngresosReales / totalIngresosProyectados) * 100;
  }, [totalIngresosReales, totalIngresosProyectados]);

  const brechaIngresos = totalIngresosReales - totalIngresosProyectados;

  // ==========================================
  // 2. KPI: MARGEN DE GANANCIA PROMEDIO DEL MES ACTUAL
  // ==========================================
  // Proyectos específicos del mes seleccionado en el widget (por defecto mes actual)
  const proyectosMesActual = useMemo(() => {
    return proyectos.filter((p) => obtenerClaveMesProyecto(p) === mesSeleccionadoWidget);
  }, [proyectos, mesSeleccionadoWidget]);

  // Margen de ganancia promedio de los proyectos del mes actual
  const margenPromedioMesActual = useMemo(() => {
    if (proyectosMesActual.length === 0) return 0;
    const sumaMargenes = proyectosMesActual.reduce((acc, p) => acc + (p.margenGananciaOperativa || 0), 0);
    return sumaMargenes / proyectosMesActual.length;
  }, [proyectosMesActual]);

  // Margen de ganancia real consolidado del mes (utilidad neta del mes / ingresos netos del mes)
  const margenRealMesActual = useMemo(() => {
    const ingresosMes = proyectosMesActual.reduce((acc, p) => acc + (p.ingresoTotalNeto || p.ingresoRealTotal || 0), 0);
    const utilidadMes = proyectosMesActual.reduce((acc, p) => acc + (p.totalGananciasFinales || 0), 0);
    if (ingresosMes <= 0) return 0;
    return (utilidadMes / ingresosMes) * 100;
  }, [proyectosMesActual]);

  const utilidadMesActual = useMemo(() => {
    return proyectosMesActual.reduce((acc, p) => acc + (p.totalGananciasFinales || 0), 0);
  }, [proyectosMesActual]);

  // Margen promedio global de toda la cartera para referencia comparativa
  const margenPromedioGlobal = useMemo(() => {
    if (proyectos.length === 0) return 0;
    return proyectos.reduce((acc, p) => acc + (p.margenGananciaOperativa || 0), 0) / proyectos.length;
  }, [proyectos]);

  // ==========================================
  // 3. KPI: TASA DE PROYECTOS CRÍTICOS
  // ==========================================
  // Un proyecto se considera crítico si:
  // a) Sus alumnos reales no alcanzan el punto de equilibrio mínimo requerido (alumnosFinal < puntoEquilibrioAlumnos)
  // b) O genera ganancias finales negativas (totalGananciasFinales < 0)
  // c) O está denegado/cancelado con costos incurridos
  const proyectosCriticos = useMemo(() => {
    return proyectos.filter(
      (p) =>
        (p.alumnosFinal < p.puntoEquilibrioAlumnos) ||
        (p.totalGananciasFinales < 0) ||
        (p.seLlevoACabo === 'Denegado' && p.gastoTotalOperativo > 0)
    );
  }, [proyectos]);

  const tasaProyectosCriticos = useMemo(() => {
    if (proyectos.length === 0) return 0;
    return (proyectosCriticos.length / proyectos.length) * 100;
  }, [proyectos, proyectosCriticos]);

  const perdidaTotalEnRiesgo = useMemo(() => {
    return proyectosCriticos.reduce((acc, p) => {
      return p.totalGananciasFinales < 0 ? acc + Math.abs(p.totalGananciasFinales) : acc;
    }, 0);
  }, [proyectosCriticos]);

  // ==========================================
  // 4. KPI COMPLEMENTARIO: EFICIENCIA DE ALUMNOS & PUNTO DE EQUILIBRIO
  // ==========================================
  const totalAlumnosProyectados = useMemo(() => {
    return proyectos.reduce((acc, p) => acc + (p.alumnosProyectados || 0), 0);
  }, [proyectos]);

  const totalAlumnosReales = useMemo(() => {
    return proyectos.reduce((acc, p) => acc + (p.alumnosFinal || 0), 0);
  }, [proyectos]);

  const proyectosSuperanPuntoEquilibrio = useMemo(() => {
    return proyectos.filter((p) => p.alumnosFinal >= p.puntoEquilibrioAlumnos).length;
  }, [proyectos]);

  const tasaPuntoEquilibrio = useMemo(() => {
    if (proyectos.length === 0) return 0;
    return (proyectosSuperanPuntoEquilibrio / proyectos.length) * 100;
  }, [proyectos, proyectosSuperanPuntoEquilibrio]);

  // Estado del mes seleccionado vs mes actual del sistema
  const esMesActual = mesSeleccionadoWidget === mesActualCalendario;

  return (
    <section 
      id="seccion-widgets-resumen"
      aria-label="Widgets de Resumen"
      className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4 transition-all"
    >
      {/* Encabezado de la Sección de Widgets de Resumen */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold shadow-2xs">
            <Sparkles className="w-4 h-4 text-purple-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Widgets de Resumen
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200/70">
                KPIs Clave
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Indicadores clave de rendimiento financiero y operativo en tiempo real
            </p>
          </div>
        </div>

        {/* Controles rápidos de la sección */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Selector de Mes para el Widget de Margen Mensual */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
            <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500 font-medium">Mes:</span>
            <select
              value={mesSeleccionadoWidget}
              onChange={(e) => {
                const nuevoMes = e.target.value;
                setMesSeleccionadoWidget(nuevoMes);
                if (onCambiarMesFiltro && nuevoMes !== mesFiltroActivo) {
                  // Opcionalmente sincroniza si el usuario lo desea
                }
              }}
              className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer text-xs"
              aria-label="Seleccionar mes para cálculo de margen"
            >
              {mesesDisponibles.map((mKey) => (
                <option key={mKey} value={mKey}>
                  {formatearEtiquetaMes(mKey)} {mKey === mesActualCalendario ? '(Mes Actual)' : ''}
                </option>
              ))}
            </select>
          </div>

          {onIrAMatriz && (
            <button
              type="button"
              onClick={onIrAMatriz}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg border border-slate-200 transition-colors"
              title="Ir a la Matriz Maestra de Proyectos"
            >
              <span>Ver Matriz</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Grid de Tarjetas Visuales con Iconos (4 KPIs Clave) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* ============================================================
            WIDGET 1: INGRESOS TOTALES PROYECTADOS
           ============================================================ */}
        <div 
          id="widget-ingresos-totales-proyectados"
          className="bg-slate-50/60 hover:bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Ingresos Totales Proyectados
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            {/* Valor Principal */}
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                {formatearMoneda(totalIngresosProyectados, moneda)}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-md ${
                  pctEjecucionIngresos >= 100 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : pctEjecucionIngresos >= 75 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {pctEjecucionIngresos >= 100 ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <Target className="w-3 h-3" />
                  )}
                  {pctEjecucionIngresos.toFixed(1)}% ejecutado
                </span>
                <span className="text-[11px] text-slate-500">
                  en {proyectos.length} {proyectos.length === 1 ? 'programa' : 'programas'}
                </span>
              </div>
            </div>
          </div>

          {/* Sub-indicador comparativo con Ingreso Real */}
          <div className="mt-4 pt-2.5 border-t border-slate-200/80 text-xs flex items-center justify-between text-slate-600">
            <span className="text-slate-500">Recaudación Real:</span>
            <span className="font-bold text-slate-900 font-mono">
              {formatearMoneda(totalIngresosReales, moneda)}
            </span>
          </div>
        </div>

        {/* ============================================================
            WIDGET 2: MARGEN DE GANANCIA PROMEDIO DEL MES ACTUAL
           ============================================================ */}
        <div 
          id="widget-margen-mes-actual"
          className="bg-slate-50/60 hover:bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Margen Promedio ({esMesActual ? 'Mes Actual' : 'Mes'})
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            {/* Valor Principal */}
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                  {margenPromedioMesActual.toFixed(1)}%
                </span>
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                  margenPromedioMesActual >= 30 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : margenPromedioMesActual >= 20 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {margenPromedioMesActual >= 30 ? 'Óptimo (≥30%)' : margenPromedioMesActual >= 20 ? 'Aceptable' : 'Bajo'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-500">
                <CalendarDays className="w-3 h-3 text-slate-400" />
                <span className="font-semibold text-slate-700">
                  {formatearEtiquetaMes(mesSeleccionadoWidget)}
                </span>
                <span>• {proyectosMesActual.length} {proyectosMesActual.length === 1 ? 'curso' : 'cursos'}</span>
              </div>
            </div>
          </div>

          {/* Sub-indicador: Utilidad neta acumulada en el mes */}
          <div className="mt-4 pt-2.5 border-t border-slate-200/80 text-xs flex items-center justify-between text-slate-600">
            <span className="text-slate-500">Utilidad Neta Mes:</span>
            <span className={`font-bold font-mono ${utilidadMesActual >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {formatearMoneda(utilidadMesActual, moneda)}
            </span>
          </div>
        </div>

        {/* ============================================================
            WIDGET 3: TASA DE PROYECTOS CRÍTICOS
           ============================================================ */}
        <div 
          id="widget-tasa-proyectos-criticos"
          className={`p-4 rounded-xl border transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between ${
            proyectosCriticos.length > 0 
              ? 'bg-rose-50/40 hover:bg-white border-rose-200 hover:border-rose-400' 
              : 'bg-slate-50/60 hover:bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Tasa de Proyectos Críticos
              </span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                proyectosCriticos.length > 0 
                  ? 'bg-rose-100 text-rose-700 border-rose-200' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-100'
              }`}>
                {proyectosCriticos.length > 0 ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <ShieldCheck className="w-5 h-5" />
                )}
              </div>
            </div>

            {/* Valor Principal */}
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                  proyectosCriticos.length > 0 ? 'text-rose-700' : 'text-emerald-700'
                }`}>
                  {tasaProyectosCriticos.toFixed(1)}%
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                  proyectosCriticos.length === 0 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : tasaProyectosCriticos <= 20 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {proyectosCriticos.length === 0 ? 'Sin Riesgo' : `${proyectosCriticos.length} en riesgo`}
                </span>
              </div>

              <div className="mt-1.5 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Déficit / Pérdida en riesgo:</span>
                <span className="font-bold font-mono text-rose-700">
                  {formatearMoneda(perdidaTotalEnRiesgo, moneda)}
                </span>
              </div>
            </div>
          </div>

          {/* Acción o Estado de Proyectos Críticos */}
          <div className="mt-4 pt-2.5 border-t border-slate-200/80 text-xs flex items-center justify-between">
            <span className="text-slate-500">
              {proyectosCriticos.length} de {proyectos.length} con déficit
            </span>
            {proyectosCriticos.length > 0 && onFiltrarCriticos && (
              <button
                type="button"
                onClick={onFiltrarCriticos}
                className="font-bold text-rose-700 hover:text-rose-900 underline text-[11px] transition-colors cursor-pointer"
              >
                Filtrar en Matriz
              </button>
            )}
            {proyectosCriticos.length === 0 && (
              <span className="font-semibold text-emerald-700 text-[11px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Cartera 100% sana
              </span>
            )}
          </div>
        </div>

        {/* ============================================================
            WIDGET 4: COBERTURA DE MATRÍCULA & PUNTO DE EQUILIBRIO
           ============================================================ */}
        <div 
          id="widget-cobertura-matricula"
          className="bg-slate-50/60 hover:bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Superan Punto Equilibrio
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
            </div>

            {/* Valor Principal */}
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                  {tasaPuntoEquilibrio.toFixed(1)}%
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  ({proyectosSuperanPuntoEquilibrio}/{proyectos.length} cursos)
                </span>
              </div>

              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                <span>Alumnos inscritos:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {totalAlumnosReales} de {totalAlumnosProyectados} proyectados
                </span>
              </div>
            </div>
          </div>

          {/* Sub-indicador: Promedio alumnos por curso */}
          <div className="mt-4 pt-2.5 border-t border-slate-200/80 text-xs flex items-center justify-between text-slate-600">
            <span className="text-slate-500">Promedio Alumnos/Curso:</span>
            <span className="font-bold text-blue-900 font-mono">
              {proyectos.length > 0 ? (totalAlumnosReales / proyectos.length).toFixed(1) : '0'} alumnos
            </span>
          </div>
        </div>

      </div>
    </section>
  );
};
