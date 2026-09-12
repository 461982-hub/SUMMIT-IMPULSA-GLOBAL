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
  ArrowRight,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { POA_2026_DATOS, formatearHNL } from '../../utils/poa2026Data';
import { calcularSeguimientoMensualPOA } from '../../utils/poaMonthlyTrackingUtils';

interface CommercialPOAAlertBannerProps {
  totalProyectos: number;
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onIrAPronostico?: () => void;
}

export const CommercialPOAAlertBanner: React.FC<CommercialPOAAlertBannerProps> = ({
  totalProyectos,
  proyectos = [],
  moneda,
  onIrAPronostico,
}) => {
  const [mostrarDetalleTrimestral, setMostrarDetalleTrimestral] = useState(false);

  // Metas cuatrimestrales extraídas de la Matriz POA 2026 (Sep - Dic 2026)
  const META_ANUAL = POA_2026_DATOS.resumen.metaAnualProyectos;
  const PUNTO_EQUILIBRIO_ANUAL = POA_2026_DATOS.resumen.puntoEquilibrioAnual;
  const PROMEDIO_MES = POA_2026_DATOS.resumen.promedioProyectosMes;
  const META_FACTURACION_ANUAL_HNL = POA_2026_DATOS.resumen.ingresosProyectados;

  // Seguimiento mensual con utilidades POA
  const seguimientoMensual = calcularSeguimientoMensualPOA(proyectos, moneda);
  
  // Proyectos con aprobación final de Gerencia General
  const proyectosConAprobacionGG = proyectos.filter(p => p.aprobacionFinalGerenciaGeneral);
  const facturacionTotalAprobadaHNL = proyectosConAprobacionGG.reduce(
    (acc, p) => acc + (p.montoFacturacionAprobadaHNL || (p.ingresoRealTotal * (moneda === 'USD' ? 27 : 1))),
    0
  );

  const porcentajeCumplimientoFacturacion = Math.min(
    100, 
    (facturacionTotalAprobadaHNL / META_FACTURACION_ANUAL_HNL) * 100
  );

  // Cálculos automáticos y reactivos
  const proyectosPendientes = Math.max(0, META_ANUAL - totalProyectos);
  const porcentajeCumplimientoCursos = Math.min(100, (totalProyectos / META_ANUAL) * 100);
  const cumplePuntoEquilibrio = totalProyectos >= PUNTO_EQUILIBRIO_ANUAL;
  const cumpleMetaAnual = totalProyectos >= META_ANUAL;
  const faltantePuntoEquilibrio = Math.max(0, PUNTO_EQUILIBRIO_ANUAL - totalProyectos);

  // Desglose trimestral comercial
  const metaPorTrimestre = 31;
  const trimestres = [
    { id: 'Q1', nombre: 'Q1 (Ene - Mar)', meta: metaPorTrimestre, metaHNL: 694750 },
    { id: 'Q2', nombre: 'Q2 (Abr - Jun)', meta: metaPorTrimestre, metaHNL: 694750 },
    { id: 'Q3', nombre: 'Q3 (Jul - Sep)', meta: metaPorTrimestre, metaHNL: 694750 },
    { id: 'Q4', nombre: 'Q4 (Oct - Dic)', meta: metaPorTrimestre, metaHNL: 694750 },
  ];

  const proyectosPorTrimestre = trimestres.map((t, idx) => {
    const proyectosDelTrimestre = proyectos.filter(p => {
      const fecha = p.fechaInicio || p.fechaProgramacion;
      if (!fecha) return false;
      const mes = new Date(fecha).getMonth() + 1;
      if (idx === 0) return mes >= 1 && mes <= 3;
      if (idx === 1) return mes >= 4 && mes <= 6;
      if (idx === 2) return mes >= 7 && mes <= 9;
      return mes >= 10 && mes <= 12;
    });

    const reales = proyectosDelTrimestre.length;
    const aprobadosGG = proyectosDelTrimestre.filter(p => p.aprobacionFinalGerenciaGeneral).length;
    const facturacionHNL = proyectosDelTrimestre
      .filter(p => p.aprobacionFinalGerenciaGeneral)
      .reduce((sum, p) => sum + (p.montoFacturacionAprobadaHNL || (p.ingresoRealTotal * (moneda === 'USD' ? 27 : 1))), 0);

    const faltantes = Math.max(0, t.meta - reales);
    const avance = Math.min(100, (reales / t.meta) * 100);
    const avanceHNL = Math.min(100, (facturacionHNL / t.metaHNL) * 100);

    return {
      ...t,
      reales,
      aprobadosGG,
      facturacionHNL,
      faltantes,
      avance,
      avanceHNL,
    };
  });

  return (
    <div 
      className={`rounded-2xl border transition-all duration-300 shadow-sm overflow-hidden mb-6 ${
        cumpleMetaAnual
          ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-emerald-300'
          : !cumplePuntoEquilibrio
          ? 'bg-gradient-to-r from-rose-50 via-amber-50/50 to-rose-50 border-rose-300 shadow-rose-100/50'
          : 'bg-gradient-to-r from-emerald-50/60 via-indigo-50/40 to-blue-50/60 border-indigo-200'
      }`}
    >
      {/* Barra de Encabezado de Comercialización */}
      <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        <div className="flex items-start gap-3.5">
          <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 shadow-xs ${
            cumpleMetaAnual
              ? 'bg-emerald-600 text-white'
              : !cumplePuntoEquilibrio
              ? 'bg-rose-600 text-white animate-pulse'
              : 'bg-indigo-600 text-white'
          }`}>
            {cumpleMetaAnual ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : !cumplePuntoEquilibrio ? (
              <ShieldAlert className="w-6 h-6" />
            ) : (
              <Briefcase className="w-6 h-6" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                cumpleMetaAnual
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : !cumplePuntoEquilibrio
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : 'bg-indigo-100 text-indigo-900 border-indigo-300'
              }`}>
                {cumpleMetaAnual 
                  ? '🟢 META POA SEP - DIC 2026 COMERCIAL ALCANZADA' 
                  : !cumplePuntoEquilibrio 
                  ? '🔴 ALERTA DE COMERCIALIZACIÓN: DÉFICIT OPERATIVO POA SEP - DIC 2026' 
                  : '🔵 GERENCIA DE COMERCIALIZACIÓN: CUMPLIMIENTO POA SEP - DIC 2026'}
              </span>

              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                <Sparkles className="w-3 h-3 text-indigo-600" />
                <span>Rebaja Mensual por Facturación Aprobada</span>
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
              Control Estratégico de Ventas y Cumplimiento de Metas POA SEP - DIC 2026
            </h3>

            <p className="text-xs text-slate-600 mt-0.5 max-w-3xl leading-relaxed">
              La Gerencia de Comercialización es responsable de la colocación de matrículas y de la facturación mensual para cumplir la meta institucional de <strong>{META_ANUAL} grupos piloto</strong> ({META_FACTURACION_ANUAL_HNL.toLocaleString('en-US', { style: 'currency', currency: 'HNL' })}). Los programas con <strong>Aprobación Final de la Gerencia General</strong> descuentan mensualmente la meta planificada.
            </p>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 self-end lg:self-center">
          <button
            type="button"
            onClick={() => setMostrarDetalleTrimestral(!mostrarDetalleTrimestral)}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <span>{mostrarDetalleTrimestral ? 'Ocultar Desglose Q' : 'Desglose Trimestral'}</span>
            {mostrarDetalleTrimestral ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

      </div>

      {/* Grid de Contadores de Cumplimiento Comercial */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 sm:p-5 pt-0">
        
        {/* 1. Meta POA Cursos */}
        <div className="bg-white/90 p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">Meta Anual Cursos</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 mt-0.5">
            {totalProyectos} / {META_ANUAL}
          </div>
          <span className="text-[10px] font-bold text-indigo-700 block mt-0.5">
            {porcentajeCumplimientoCursos.toFixed(1)}% cursos en cartera
          </span>
        </div>

        {/* 2. Facturación Aprobada GG vs Meta POA */}
        <div className="bg-white/90 p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">Facturación Aprobada GG</span>
            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
              Oficial
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-800 mt-0.5">
            {formatearHNL(facturacionTotalAprobadaHNL)}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {porcentajeCumplimientoFacturacion.toFixed(1)}% de {formatearHNL(META_FACTURACION_ANUAL_HNL)}
          </span>
        </div>

        {/* 3. Cursos con Sello GG */}
        <div className="bg-white/90 p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">Cursos Aprobados GG</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-indigo-900 mt-0.5">
            {proyectosConAprobacionGG.length} <span className="text-xs font-normal text-slate-400">/ {totalProyectos}</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {totalProyectos - proyectosConAprobacionGG.length} pendientes dictamen GG
          </span>
        </div>

        {/* 4. Break-Even Supervivencia */}
        <div className="bg-white/90 p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">Break-Even Operativo</span>
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
              ? 'Supervivencia asegurada' 
              : `Faltan ${faltantePuntoEquilibrio} cursos p/break-even`}
          </span>
        </div>

      </div>

      {/* Barra de Progreso Visual */}
      <div className="px-4 sm:px-5 pb-4">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
          <span className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-indigo-600" />
            <span>Facturación Real Rebajada vs Meta POA 2026:</span>
            <span className="font-mono text-emerald-900 font-bold">
              {formatearHNL(facturacionTotalAprobadaHNL)} / {formatearHNL(META_FACTURACION_ANUAL_HNL)}
            </span>
          </span>
          <span className="font-mono text-xs font-black text-slate-900">
            {porcentajeCumplimientoFacturacion.toFixed(1)}%
          </span>
        </div>

        <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-indigo-600 to-emerald-600 transition-all duration-500 rounded-full"
            style={{ width: `${porcentajeCumplimientoFacturacion}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
          <span>L. 0.00</span>
          <span className="font-semibold text-slate-700">
            Cursos Aprobados GG: {proyectosConAprobacionGG.length} de {totalProyectos}
          </span>
          <span className="font-bold text-indigo-950">
            Meta POA: {formatearHNL(META_FACTURACION_ANUAL_HNL)}
          </span>
        </div>
      </div>

      {/* Desglose Trimestral */}
      {mostrarDetalleTrimestral && (
        <div className="p-4 sm:p-5 pt-3 border-t border-slate-200/80 bg-white/80 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Desglose Comercial Trimestral (31 Cursos / ~L. 694,750 por Trimestre)</span>
            </h4>
            <span className="text-[11px] text-slate-500">
              POA Total: 124 proyectos
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {proyectosPorTrimestre.map(trim => (
              <div 
                key={trim.id}
                className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>{trim.nombre}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                    trim.reales >= trim.meta ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {trim.reales} / {trim.meta}
                  </span>
                </div>

                <div className="text-[11px]">
                  <span className="text-slate-500">Fact. Aprobada GG: </span>
                  <span className="font-bold font-mono text-emerald-800">
                    {formatearHNL(trim.facturacionHNL)}
                  </span>
                </div>

                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.min(100, trim.avanceHNL)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                  <span>Sello GG:</span>
                  <span className="font-mono font-bold text-indigo-900">
                    {trim.aprobadosGG} cursos
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
