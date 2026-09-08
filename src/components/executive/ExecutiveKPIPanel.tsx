import React from 'react';
import { 
  Percent, 
  Target, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  ArrowUpRight,
  ShieldCheck,
  Scale
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { formatearMoneda } from '../../utils/calculations';

interface ExecutiveKPIPanelProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onIrAControl?: () => void;
  onIrAComercializacion?: () => void;
  onIrAAuditor?: () => void;
}

export const ExecutiveKPIPanel: React.FC<ExecutiveKPIPanelProps> = ({
  proyectos,
  moneda,
  onIrAControl,
  onIrAComercializacion,
  onIrAAuditor,
}) => {
  // Totales financieros consolidados
  const totalInversionGastos = proyectos.reduce((acc, p) => acc + (p.gastoTotalOperativo || 0), 0);
  const totalIngresoNeto = proyectos.reduce((acc, p) => acc + (p.ingresoTotalNeto || p.ingresoRealTotal || 0), 0);
  const totalUtilidadNeta = proyectos.reduce((acc, p) => acc + (p.totalGananciasFinales || 0), 0);

  // 1. Margen de Utilidad Promedio
  const margenPromedio = proyectos.length > 0
    ? proyectos.reduce((acc, p) => acc + (p.margenGananciaOperativa || 0), 0) / proyectos.length
    : 0;

  const margenNetoRealGlobal = totalIngresoNeto > 0
    ? (totalUtilidadNeta / totalIngresoNeto) * 100
    : 0;

  const proyectosMargenSaludable = proyectos.filter((p) => (p.margenGananciaOperativa || 0) >= 30).length;
  const pctProyectosMargenSaludable = proyectos.length > 0 
    ? (proyectosMargenSaludable / proyectos.length) * 100 
    : 0;

  // 2. Tasa de Éxito de Comercialización
  const proyectosExitoComercial = proyectos.filter(
    (p) => (p.alumnosFinal || 0) >= (p.puntoEquilibrioAlumnos || 0)
  ).length;

  const tasaExitoComercial = proyectos.length > 0
    ? (proyectosExitoComercial / proyectos.length) * 100
    : 0;

  const totalAlumnosProyectados = proyectos.reduce((acc, p) => acc + (p.alumnosProyectados || 0), 0);
  const totalAlumnosReales = proyectos.reduce((acc, p) => acc + (p.alumnosFinal || 0), 0);

  const tasaCumplimientoMatricula = totalAlumnosProyectados > 0
    ? (totalAlumnosReales / totalAlumnosProyectados) * 100
    : 0;

  // 3. Rentabilidad Neta Acumulada
  const roiPromedio = totalInversionGastos > 0
    ? (totalUtilidadNeta / totalInversionGastos) * 100
    : 0;

  const proyectosRentables = proyectos.filter((p) => p.totalGananciasFinales >= 0).length;
  const proyectosEnPerdida = proyectos.filter((p) => p.totalGananciasFinales < 0).length;

  return (
    <section 
      id="panel-kpis-gerencia-general"
      aria-label="Panel de Indicadores Clave de Gerencia General" 
      className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4"
    >
      {/* Encabezado del Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              Panel de Indicadores Clave (KPIs Ejecutivos)
            </h3>
            <p className="text-xs text-slate-500">
              Métricas estratégicas consolidadas de rentabilidad, margen y efectividad comercial de toda la cartera
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {onIrAAuditor && (
            <button
              type="button"
              onClick={onIrAAuditor}
              className="text-[11px] font-bold px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-300 flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Auditor Digital</span>
            </button>
          )}
          <span className="text-[11px] font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
            {proyectos.length} {proyectos.length === 1 ? 'Proyecto Activo' : 'Proyectos en Cartera'}
          </span>
          <span className="text-[11px] font-bold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-200">
            Moneda: {moneda}
          </span>
        </div>
      </div>

      {/* Grid con los 3 Indicadores Clave Obligatorios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* KPI 1: MARGEN DE UTILIDAD PROMEDIO */}
        <div 
          id="kpi-margen-promedio"
          className="relative bg-gradient-to-br from-slate-50 to-purple-50/40 rounded-xl p-4 border border-purple-100 hover:border-purple-300 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-purple-600" />
                Margen de Utilidad Promedio
              </span>
              <span 
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  margenPromedio >= 30
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}
              >
                {margenPromedio >= 30 ? 'Meta Superada (≥30%)' : 'Bajo Meta (<30%)'}
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-purple-950 font-mono tracking-tight">
                {margenPromedio.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-500 font-medium">
                margen objetivo medio
              </span>
            </div>

            {/* Barra de progreso con respecto al 30% institucional */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                <span>Referencia base institucional</span>
                <span className="font-semibold text-purple-900">Meta: 30.0%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    margenPromedio >= 30 ? 'bg-purple-600' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, (margenPromedio / 50) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-purple-100/80 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Margen Neto Real sobre Ventas:</span>
              <span className={`font-mono font-bold ${
                margenNetoRealGlobal >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}>
                {margenNetoRealGlobal.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Cumplen meta institucional (≥30%):</span>
              <span className="font-mono font-bold text-slate-800">
                {proyectosMargenSaludable}/{proyectos.length} ({pctProyectosMargenSaludable.toFixed(0)}%)
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: TASA DE ÉXITO DE COMERCIALIZACIÓN */}
        <div 
          id="kpi-tasa-exito-comercial"
          className="relative bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-xl p-4 border border-blue-100 hover:border-blue-300 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-600" />
                Tasa de Éxito de Comercialización
              </span>
              <span 
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  tasaExitoComercial >= 80
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : tasaExitoComercial >= 60
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}
              >
                {tasaExitoComercial >= 80 ? 'Efectividad Alta' : tasaExitoComercial >= 60 ? 'Efectividad Estable' : 'Requiere Refuerzo'}
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-blue-950 font-mono tracking-tight">
                {tasaExitoComercial.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-500 font-medium">
                superan equilibrio
              </span>
            </div>

            {/* Barra de progreso de cumplimiento de matrícula */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                <span>Cumplimiento global de matrícula</span>
                <span className="font-semibold text-blue-900">{tasaCumplimientoMatricula.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    tasaCumplimientoMatricula >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, tasaCumplimientoMatricula))}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-blue-100/80 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Proyectos sin déficit comercial:</span>
              <span className="font-mono font-bold text-slate-800">
                {proyectosExitoComercial} de {proyectos.length} programas
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Inscripciones reales vs meta:</span>
              <span className="font-mono font-bold text-blue-700">
                {totalAlumnosReales} / {totalAlumnosProyectados} alumnos
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: RENTABILIDAD NETA ACUMULADA */}
        <div 
          id="kpi-rentabilidad-neta-acumulada"
          className="relative bg-gradient-to-br from-slate-50 to-emerald-50/40 rounded-xl p-4 border border-emerald-100 hover:border-emerald-300 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                Rentabilidad Neta Acumulada
              </span>
              <span 
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  totalUtilidadNeta >= 0
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border-rose-300'
                }`}
              >
                {totalUtilidadNeta >= 0 ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                    Superávit
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3 text-rose-600" />
                    Déficit
                  </>
                )}
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${
                totalUtilidadNeta >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}>
                {formatearMoneda(totalUtilidadNeta, moneda)}
              </span>
            </div>

            {/* Barra de proyectos rentables vs con pérdida */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                <span>Balance de rentabilidad</span>
                <span className="font-semibold text-emerald-800">
                  ROI: {roiPromedio >= 0 ? '+' : ''}{roiPromedio.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${proyectos.length > 0 ? (proyectosRentables / proyectos.length) * 100 : 0}%` }}
                  title={`${proyectosRentables} proyectos rentables`}
                />
                <div 
                  className="bg-rose-500 h-full transition-all duration-500"
                  style={{ width: `${proyectos.length > 0 ? (proyectosEnPerdida / proyectos.length) * 100 : 0}%` }}
                  title={`${proyectosEnPerdida} proyectos en pérdida`}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-100/80 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Salud de cartera (Ganancia / Pérdida):</span>
              <span className="font-mono font-bold text-slate-800">
                <span className="text-emerald-700">{proyectosRentables} rentables</span> / <span className="text-rose-600">{proyectosEnPerdida} déficit</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Ingreso Neto vs Costos Operativos:</span>
              <span className="font-mono font-semibold text-slate-700">
                {formatearMoneda(totalIngresoNeto, moneda)} / {formatearMoneda(totalInversionGastos, moneda)}
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
