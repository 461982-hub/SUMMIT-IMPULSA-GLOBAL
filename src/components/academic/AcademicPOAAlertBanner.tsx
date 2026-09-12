import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Sparkles, 
  Target, 
  TrendingUp, 
  Calendar, 
  Layers, 
  ChevronDown, 
  ChevronUp,
  Flame,
  ShieldCheck,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { ProyectoEducativo } from '../../types';
import { POA_2026_DATOS } from '../../utils/poa2026Data';

interface AcademicPOAAlertBannerProps {
  totalProyectos: number;
  proyectos?: ProyectoEducativo[];
  onNuevoProyecto?: () => void;
}

export const AcademicPOAAlertBanner: React.FC<AcademicPOAAlertBannerProps> = ({
  totalProyectos,
  proyectos = [],
  onNuevoProyecto,
}) => {
  const [mostrarDetalleTrimestral, setMostrarDetalleTrimestral] = useState(false);

  // Metas extraídas directamente de la Matriz POA 2026 (Sep - Dic 2026)
  const META_ANUAL = POA_2026_DATOS.resumen.metaAnualProyectos;
  const PUNTO_EQUILIBRIO_ANUAL = POA_2026_DATOS.resumen.puntoEquilibrioAnual;
  const PROMEDIO_MES = POA_2026_DATOS.resumen.promedioProyectosMes;

  // Cálculos automáticos y reactivos
  const proyectosPendientes = Math.max(0, META_ANUAL - totalProyectos);
  const porcentajeCumplimiento = Math.min(100, (totalProyectos / META_ANUAL) * 100);
  const cumplePuntoEquilibrio = totalProyectos >= PUNTO_EQUILIBRIO_ANUAL;
  const cumpleMetaAnual = totalProyectos >= META_ANUAL;

  const faltantePuntoEquilibrio = Math.max(0, PUNTO_EQUILIBRIO_ANUAL - totalProyectos);
  const porcentajePuntoEquilibrio = Math.min(100, (totalProyectos / PUNTO_EQUILIBRIO_ANUAL) * 100);

  // Estimación trimestral (Meta Q1: 31, Q2: 31, Q3: 31, Q4: 31 = 124)
  const metaPorTrimestre = 31;
  const trimestres = [
    { id: 'Q1', nombre: 'Q1 (Ene - Mar)', meta: metaPorTrimestre },
    { id: 'Q2', nombre: 'Q2 (Abr - Jun)', meta: metaPorTrimestre },
    { id: 'Q3', nombre: 'Q3 (Jul - Sep)', meta: metaPorTrimestre },
    { id: 'Q4', nombre: 'Q4 (Oct - Dic)', meta: metaPorTrimestre },
  ];

  // Distribuir proyectos reales entre trimestres según fecha o de forma proporcional
  const proyectosPorTrimestre = trimestres.map((t, idx) => {
    // Si los proyectos tienen fecha, agrupar por mes
    const reales = proyectos.filter(p => {
      if (!p.fechaInicio) return false;
      const mes = new Date(p.fechaInicio).getMonth() + 1;
      if (idx === 0) return mes >= 1 && mes <= 3;
      if (idx === 1) return mes >= 4 && mes <= 6;
      if (idx === 2) return mes >= 7 && mes <= 9;
      return mes >= 10 && mes <= 12;
    }).length;

    const faltantes = Math.max(0, t.meta - reales);
    const avance = Math.min(100, (reales / t.meta) * 100);

    return {
      ...t,
      reales,
      faltantes,
      avance,
    };
  });

  return (
    <div 
      className={`rounded-2xl border transition-all duration-300 shadow-sm overflow-hidden ${
        cumpleMetaAnual
          ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-emerald-300'
          : !cumplePuntoEquilibrio
          ? 'bg-gradient-to-r from-rose-50 via-amber-50/50 to-rose-50 border-rose-300 shadow-rose-100/50'
          : 'bg-gradient-to-r from-amber-50 via-blue-50/40 to-amber-50 border-amber-300'
      }`}
    >
      {/* Barra de Encabezado de Alerta */}
      <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        <div className="flex items-start gap-3.5">
          <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 shadow-xs ${
            cumpleMetaAnual
              ? 'bg-emerald-600 text-white'
              : !cumplePuntoEquilibrio
              ? 'bg-rose-600 text-white animate-pulse'
              : 'bg-amber-500 text-white'
          }`}>
            {cumpleMetaAnual ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : !cumplePuntoEquilibrio ? (
              <ShieldAlert className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                cumpleMetaAnual
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : !cumplePuntoEquilibrio
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}>
                {cumpleMetaAnual 
                  ? '🟢 META POA SEP - DIC 2026 ALCANZADA' 
                  : !cumplePuntoEquilibrio 
                  ? '🔴 ALERTA CRÍTICA: DÉFICIT OPERATIVO POA SEP - DIC 2026' 
                  : '🟡 ALERTA DE SEGUIMIENTO: META POA EN CURSO'}
              </span>

              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                <Sparkles className="w-3 h-3 text-indigo-600" />
                <span>Rebaja Automática Activa</span>
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
              {cumpleMetaAnual ? (
                `¡Excelente! Se ha alcanzado la meta del piloto de ${META_ANUAL} grupos formativos (${totalProyectos} registrados).`
              ) : !cumplePuntoEquilibrio ? (
                `Se requiere formular proyectos: Solo ${totalProyectos} de ${META_ANUAL} grupos registrados en el POA 2026.`
              ) : (
                `Punto de equilibrio superado (${totalProyectos}/${PUNTO_EQUILIBRIO_ANUAL}). Restan ${proyectosPendientes} grupos para cumplir la meta de ${META_ANUAL}.`
              )}
            </h3>

            <p className="text-xs text-slate-600 mt-0.5 max-w-3xl leading-relaxed">
              {!cumplePuntoEquilibrio ? (
                <>
                  La institución se encuentra por debajo del <strong className="text-rose-900">Punto de Equilibrio ({PUNTO_EQUILIBRIO_ANUAL} grupos piloto)</strong>. Cada nuevo proyecto curricular que formule la Gerencia Académica <strong className="text-indigo-900">rebajará automáticamente</strong> el saldo pendiente hasta cumplir la meta de {META_ANUAL} grupos piloto.
                </>
              ) : !cumpleMetaAnual ? (
                <>
                  Se ha cubierto el break-even operativo ({totalProyectos} de {PUNTO_EQUILIBRIO_ANUAL} grupos mínimos). Continúa formulando programas para completar los <strong className="text-indigo-900">{proyectosPendientes} grupos faltantes</strong> y garantizar el superávit operativo estimado.
                </>
              ) : (
                <>
                  El catálogo formativo cumple plenamente con la cartera planificada para el piloto Sep - Dic 2026 de Summit Impulsa Global, S.A. de C.V.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Control de Desglose Trimestral */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 self-end lg:self-center">
          <button
            onClick={() => setMostrarDetalleTrimestral(!mostrarDetalleTrimestral)}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <span>{mostrarDetalleTrimestral ? 'Ocultar Desglose' : 'Ver Desglose Q1-Q4'}</span>
            {mostrarDetalleTrimestral ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

      </div>

      {/* Grid de Contadores de Cumplimiento (Rebaja Dinámica) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 sm:p-5 pt-0">
        
        {/* 1. Meta POA 2026 */}
        <div className="bg-white/90 p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">Meta Anual POA</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 mt-0.5">
            {META_ANUAL}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            Ritmo: {PROMEDIO_MES} proy/mes
          </span>
        </div>

        {/* 2. Formulados / En Cartera */}
        <div className="bg-white/90 p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">Formulados Actuales</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-blue-900 mt-0.5">
            {totalProyectos}
          </div>
          <span className="text-[10px] font-bold text-blue-700 block mt-0.5">
            {porcentajeCumplimiento.toFixed(1)}% de la meta
          </span>
        </div>

        {/* 3. Proyectos Faltantes (Rebaja en Tiempo Real) */}
        <div className={`p-3 rounded-xl border shadow-2xs ${
          cumpleMetaAnual
            ? 'bg-emerald-100/60 border-emerald-300 text-emerald-950'
            : proyectosPendientes > 80
            ? 'bg-rose-100/70 border-rose-300 text-rose-950'
            : 'bg-amber-100/70 border-amber-300 text-amber-950'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-tight block">Faltantes por Registrar</span>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white/80 border border-current">
              Rebaja -1
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono mt-0.5">
            {proyectosPendientes} {proyectosPendientes === 1 ? 'proy.' : 'proy.'}
          </div>
          <span className="text-[10px] font-bold block mt-0.5 opacity-90">
            {cumpleMetaAnual ? '¡Meta completada!' : 'Se descuenta al formular'}
          </span>
        </div>

        {/* 4. Punto de Equilibrio (Break-Even) */}
        <div className="bg-white/90 p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">Break-Even Mínimo</span>
            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
              cumplePuntoEquilibrio ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {cumplePuntoEquilibrio ? 'Cubierto' : 'Riesgo'}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 mt-0.5">
            {totalProyectos} / {PUNTO_EQUILIBRIO_ANUAL}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {cumplePuntoEquilibrio 
              ? '100% de costos cubiertos' 
              : `Faltan ${faltantePuntoEquilibrio} proy. p/equilibrio`}
          </span>
        </div>

      </div>

      {/* Barra de Progreso Visual de la Meta del Piloto de 74 Grupos */}
      <div className="px-4 sm:px-5 pb-4">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
          <span className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-indigo-600" />
            <span>Progreso hacia los {META_ANUAL} Grupos del POA 2026:</span>
            <span className="font-mono text-indigo-900">{totalProyectos} de {META_ANUAL}</span>
          </span>
          <span className="font-mono text-xs font-black text-slate-900">
            {porcentajeCumplimiento.toFixed(1)}%
          </span>
        </div>

        <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
          {/* Marca de Break-Even (44 proyectos / 124 = 35.48%) */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-slate-600 z-10" 
            style={{ left: `${(PUNTO_EQUILIBRIO_ANUAL / META_ANUAL) * 100}%` }}
            title="Punto de Equilibrio: 44 Proyectos (35.5%)"
          />

          {/* Relleno de Progreso Real */}
          <div 
            className={`h-full transition-all duration-500 rounded-full ${
              cumpleMetaAnual 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                : cumplePuntoEquilibrio
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                : 'bg-gradient-to-r from-rose-500 to-amber-500'
            }`}
            style={{ width: `${porcentajeCumplimiento}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
          <span>0 proy.</span>
          <span className="font-semibold text-slate-700">📌 Break-Even: 44 proy. (35.5%)</span>
          <span className="font-bold text-indigo-950">🎯 Meta Final: 124 proy. (100%)</span>
        </div>
      </div>

      {/* Desglose Opcional por Trimestre Q1 - Q4 */}
      {mostrarDetalleTrimestral && (
        <div className="p-4 sm:p-5 pt-3 border-t border-slate-200/80 bg-white/70 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Desglose de Metas Trimestrales (31 Proyectos por Trimestre)</span>
            </h4>
            <span className="text-[11px] text-slate-500">
              Total POA: 124 proyectos
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {proyectosPorTrimestre.map(trim => (
              <div 
                key={trim.id}
                className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs text-xs"
              >
                <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                  <span>{trim.nombre}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                    trim.reales >= trim.meta ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {trim.reales} / {trim.meta}
                  </span>
                </div>

                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1 mb-1.5">
                  <div 
                    className={`h-full ${trim.reales >= trim.meta ? 'bg-emerald-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(100, trim.avance)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>Faltantes:</span>
                  <span className={`font-mono font-bold ${trim.faltantes === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {trim.faltantes === 0 ? 'Completado' : `${trim.faltantes} proy.`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 p-2.5 rounded-lg bg-blue-50/80 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
            <span>
              ℹ️ Cada nuevo proyecto oficializado mediante Sílabo Oficial o registrado desde el Tablero Principal descuenta en tiempo real la meta anual del POA.
            </span>
          </div>
        </div>
      )}

    </div>
  );
};
