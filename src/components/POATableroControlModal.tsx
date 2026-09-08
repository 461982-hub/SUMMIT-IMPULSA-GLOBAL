import React, { useState } from 'react';
import { 
  X, 
  TrendingUp, 
  DollarSign, 
  ShieldCheck, 
  PieChart, 
  BarChart3, 
  Users, 
  Target, 
  Download, 
  Building2, 
  GraduationCap, 
  Megaphone,
  CheckCircle2,
  Mail,
  ArrowRight,
  Printer,
  Calendar
} from 'lucide-react';
import { POA_2027_DATOS, formatearHNL } from '../utils/poa2027Data';
import { SummitLogo } from './SummitLogo';
import { VistaPrincipal, ProyectoEducativo, Moneda } from '../types';
import { calcularComparativaPOAVsRealidad } from '../utils/poaComparisonUtils';

interface POATableroControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavegarGerencia?: (vista: VistaPrincipal) => void;
  proyectos?: ProyectoEducativo[];
  moneda?: Moneda;
}

export const POATableroControlModal: React.FC<POATableroControlModalProps> = ({
  isOpen,
  onClose,
  onNavegarGerencia,
  proyectos = [],
  moneda = 'LPS',
}) => {
  const [tabActiva, setTabActiva] = useState<'comparativa' | 'resumen' | 'presupuestos' | 'flujo' | 'kpis'>('comparativa');

  if (!isOpen) return null;

  const { resumen, presupuestosGerencias, flujoTrimestral, kpis } = POA_2027_DATOS;
  const comparativa = calcularComparativaPOAVsRealidad(proyectos, moneda);

  const exportarCSVMatriz = () => {
    let csv = `"SUMMIT IMPULSA GLOBAL, S.A. DE C.V. | PLAN OPERATIVO ANUAL (POA) SEP - DIC 2026"\n`;
    csv += `"TABLERO DE CONTROL DIRECTIVO - CUADRO DE MANDO INTEGRAL & CONSOLIDACIÓN EN LEMPIRAS (HNL) | Tipo de Cambio: L. ${resumen.tipoCambio.toFixed(2)}"\n\n`;
    
    csv += `"1. CONSOLIDACIÓN PRESUPUESTARIA POR GERENCIA (HNL - CUATRIMESTRE SEP-DIC 2026)"\n`;
    csv += `"Gerencia","Líder / Responsable","Correo","Sep 2026","Oct 2026","Nov 2026","Dic 2026","Total Cuatrimestre (HNL)","% Part.","N° Actividades","% Actividades"\n`;
    presupuestosGerencias.forEach(g => {
      csv += `"${g.gerencia} (${g.eje})","${g.lider}","${g.correo}","${g.q1}","${g.q2}","${g.q3}","${g.q4}","${g.totalAnual}","${g.porcentajePart}%","${g.numActividades}","${g.porcentajeActividades}%"\n`;
    });
    csv += `"TOTAL ASIGNADO","Summit Impulsa Global","","L. 114,900.00","L. 109,700.00","L. 115,600.00","L. 119,900.00","L. 460,100.00","100.0%","44","100.0%"\n\n`;

    csv += `"2. BALANCE Y FLUJO NETO MENSUAL CONSOLIDADO (HNL)"\n`;
    csv += `"Concepto","Detalle","Sep 2026","Oct 2026","Nov 2026","Dic 2026","Total Cuatrimestre","% Margen"\n`;
    flujoTrimestral.forEach(f => {
      csv += `"${f.concepto}","${f.subtitulo}","${f.q1}","${f.q2}","${f.q3}","${f.q4}","${f.totalAnual}","${f.porcentaje}"\n`;
    });
    csv += `\n"3. CUADRO DE MANDO INTEGRAL - KPIS ESTRATÉGICOS SEP-DIC 2026"\n`;
    csv += `"Gerencia","Área / Eje","Indicador","Meta Estratégica","Frecuencia","Línea Base","Meta","Real / Proy.","% Cumplimiento","Semáforo","Responsable"\n`;
    kpis.forEach(k => {
      csv += `"${k.gerencia}","${k.areaEje}","${k.indicador}","${k.metaEstrategica}","${k.frecuencia}","${k.lineaBase}","${k.meta}","${k.realProy}","${k.cumplimientoPorcentaje}%","${k.semaforo}","${k.responsable}"\n`;
    });

    csv += `\n"4. COMPARATIVA SIMULTÁNEA: PLANIFICACIÓN POA SEP-DIC 2026 VS. REALIDAD OPERATIVA EN APP"\n`;
    csv += `"Métrica / Variable","Planificado POA 2026","Realidad en App","Varianza / Brecha","% Cumplimiento","Estado"\n`;
    csv += `"Ingresos Operativos Totales","${formatearHNL(comparativa.ingresos.planificadoPOA)}","${formatearHNL(comparativa.ingresos.realidadApp)}","${formatearHNL(comparativa.ingresos.varianza)}","${comparativa.ingresos.porcentajeCumplimiento.toFixed(1)}%","${comparativa.ingresos.semaforo}"\n`;
    csv += `"Egresos y Costos Totales","${formatearHNL(comparativa.egresos.planificadoPOA)}","${formatearHNL(comparativa.egresos.realidadApp)}","${formatearHNL(comparativa.egresos.varianza)}","${comparativa.egresos.porcentajeCumplimiento.toFixed(1)}%","${comparativa.egresos.semaforo}"\n`;
    csv += `"Superávit Neto Acumulado","${formatearHNL(comparativa.superavit.planificadoPOA)}","${formatearHNL(comparativa.superavit.realidadApp)}","${formatearHNL(comparativa.superavit.varianza)}","${comparativa.superavit.porcentajeCumplimiento.toFixed(1)}%","${comparativa.superavit.semaforo}"\n`;
    csv += `"Margen Operativo (%)","${comparativa.margenOperativo.planificadoPOA}%","${comparativa.margenOperativo.realidadApp.toFixed(1)}%","${(comparativa.margenOperativo.realidadApp - comparativa.margenOperativo.planificadoPOA).toFixed(1)}%","${((comparativa.margenOperativo.realidadApp / (comparativa.margenOperativo.planificadoPOA || 1)) * 100).toFixed(1)}%","${comparativa.margenOperativo.semaforo}"\n`;
    csv += `"Cartera de Grupos Pilotaje","${comparativa.proyectosTotales.planificadoPOA} grupos","${comparativa.proyectosTotales.realidadApp} grupos","Faltan ${Math.max(0, 74 - comparativa.proyectosTotales.realidadApp)}","${comparativa.proyectosTotales.porcentajeCumplimiento.toFixed(1)}%","${comparativa.proyectosTotales.semaforo}"\n`;
    csv += `"Punto de Equilibrio (Break-Even)","${comparativa.puntoEquilibrio.planificadoPOA} grupos mín.","${comparativa.puntoEquilibrio.realidadApp} grupos actuales","${comparativa.puntoEquilibrio.realidadApp >= 69 ? 'Solvente' : `Faltan ${Math.ceil(69 - comparativa.puntoEquilibrio.realidadApp)}`}","${comparativa.puntoEquilibrio.porcentajeCumplimiento.toFixed(1)}%","${comparativa.puntoEquilibrio.semaforo}"\n`;
    csv += `"Runway de Cobertura","${comparativa.runway.planificadoPOA} meses","${comparativa.runway.realidadApp} meses","${comparativa.runway.realidadApp >= 4 ? 'Saludable' : 'Alerta'}","${comparativa.runway.porcentajeCumplimiento.toFixed(1)}%","${comparativa.runway.semaforo}"\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `POA_2026_Matriz_Directiva_Summit_Impulsa.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-slate-50 w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Cabecera Principal */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-900/60">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="bg-white/10 p-2.5 rounded-xl border border-white/20 shadow-inner shrink-0">
              <SummitLogo variant="icon" size="md" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 bg-blue-500/30 text-blue-200 border border-blue-400/30 rounded">
                  {resumen.empresa}
                </span>
                <span className="text-xs text-indigo-300 font-bold">
                  {resumen.poaTitulo}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  T/C Ref: L. {resumen.tipoCambio.toFixed(2)} / USD
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                Tablero de Control Directivo • Cuadro de Mando Integral (HNL)
              </h2>
              <p className="text-xs text-slate-300 max-w-3xl mt-0.5">
                Consolidación presupuestaria, flujo neto trimestral bootstrapping, runway de caja y KPIs de gobernanza para Dirección General, Académica y Comercial.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={exportarCSVMatriz}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-2xs"
              title="Descargar Matriz POA SEP - DIC 2026 en formato CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Descargar CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-300 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title="Imprimir tablero directivo"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 6 Hero Metric Cards (Simultáneo: Planificado POA vs. Realidad App) */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-2 p-3 sm:p-4 bg-white border-b border-slate-200">
          
          {/* 1. Capital Inicial */}
          <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">Capital Inicial</span>
            <div className="text-sm sm:text-base font-black font-mono text-slate-900 mt-0.5">
              {formatearHNL(resumen.capitalInicialBootstrapping)}
            </div>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded inline-block mt-1">
              🟢 100% Fondos Propios
            </span>
          </div>

          {/* 2. Ingresos Proyectados vs Real */}
          <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase truncate">Ingresos Operat.</span>
              <span className={`text-[9px] font-bold px-1 rounded ${
                comparativa.ingresos.porcentajeCumplimiento >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {comparativa.ingresos.porcentajeCumplimiento.toFixed(0)}%
              </span>
            </div>
            <div className="text-sm sm:text-base font-black font-mono text-blue-900 mt-0.5">
              {formatearHNL(comparativa.ingresos.realidadApp)}
            </div>
            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded inline-block mt-1 truncate">
              Plan: {formatearHNL(resumen.ingresosProyectados)}
            </span>
          </div>

          {/* 3. Superávit Operativo vs Real */}
          <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase truncate">Superávit Neto</span>
              <span className={`text-[9px] font-bold px-1 rounded ${
                comparativa.superavit.realidadApp >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {comparativa.margenOperativo.realidadApp.toFixed(0)}% mg
              </span>
            </div>
            <div className={`text-sm sm:text-base font-black font-mono mt-0.5 ${
              comparativa.superavit.realidadApp >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {formatearHNL(comparativa.superavit.realidadApp)}
            </div>
            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded inline-block mt-1 truncate">
              Plan: {formatearHNL(resumen.superavitOperativoEst)}
            </span>
          </div>

          {/* 4. Meta Anual de Proyectos (Rebaja Automática) */}
          <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase truncate">Proyectos (POA)</span>
              <span className="text-[9px] font-bold bg-indigo-100 text-indigo-800 px-1 rounded">
                -1 auto
              </span>
            </div>
            <div className="text-sm sm:text-base font-black font-mono text-indigo-900 mt-0.5">
              {comparativa.proyectosTotales.realidadApp} / 124
            </div>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded inline-block mt-1 truncate">
              {Math.max(0, 124 - comparativa.proyectosTotales.realidadApp)} faltantes
            </span>
          </div>

          {/* 5. Punto de Equilibrio */}
          <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase truncate">Break-Even</span>
              <span className={`text-[9px] font-black px-1 rounded ${
                comparativa.puntoEquilibrio.realidadApp >= 44 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {comparativa.puntoEquilibrio.realidadApp >= 44 ? 'Solvente' : 'Déficit'}
              </span>
            </div>
            <div className="text-sm sm:text-base font-black text-amber-900 mt-0.5">
              {comparativa.puntoEquilibrio.realidadApp} / 44
            </div>
            <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded inline-block mt-1 truncate">
              Min. {resumen.puntoEquilibrioMes} proy/mes
            </span>
          </div>

          {/* 6. Caja Estimada al Cierre */}
          <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase truncate">Runway Caja</span>
              <span className="text-[9px] font-bold bg-purple-100 text-purple-800 px-1 rounded">
                {comparativa.runway.realidadApp}m
              </span>
            </div>
            <div className="text-sm sm:text-base font-black font-mono text-purple-900 mt-0.5">
              {formatearHNL(comparativa.cajaCierre.realidadApp)}
            </div>
            <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded inline-block mt-1 truncate">
              Plan: {formatearHNL(resumen.cajaEstimadaCierre)}
            </span>
          </div>

        </div>

        {/* Selector de Pestañas */}
        <div className="flex items-center gap-1 sm:gap-2 px-4 pt-3 border-b border-slate-200 bg-slate-100 text-xs overflow-x-auto">
          <button
            onClick={() => setTabActiva('comparativa')}
            className={`px-3 py-2 font-bold rounded-t-lg transition-colors border-t border-x flex items-center gap-1.5 shrink-0 ${
              tabActiva === 'comparativa'
                ? 'bg-white text-indigo-950 border-slate-300 shadow-xs'
                : 'text-indigo-700 bg-indigo-50/60 hover:text-indigo-950 border-transparent'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Planificación POA vs. Realidad App</span>
          </button>
          <button
            onClick={() => setTabActiva('resumen')}
            className={`px-3 py-2 font-bold rounded-t-lg transition-colors border-t border-x shrink-0 ${
              tabActiva === 'resumen'
                ? 'bg-white text-indigo-950 border-slate-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            Vista General & Consolidación
          </button>
          <button
            onClick={() => setTabActiva('presupuestos')}
            className={`px-3 py-2 font-bold rounded-t-lg transition-colors border-t border-x shrink-0 ${
              tabActiva === 'presupuestos'
                ? 'bg-white text-indigo-950 border-slate-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            1. Presupuesto por Gerencia
          </button>
          <button
            onClick={() => setTabActiva('flujo')}
            className={`px-3 py-2 font-bold rounded-t-lg transition-colors border-t border-x shrink-0 ${
              tabActiva === 'flujo'
                ? 'bg-white text-indigo-950 border-slate-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            2. Balance y Flujo Trimestral
          </button>
          <button
            onClick={() => setTabActiva('kpis')}
            className={`px-3 py-2 font-bold rounded-t-lg transition-colors border-t border-x shrink-0 ${
              tabActiva === 'kpis'
                ? 'bg-white text-indigo-950 border-slate-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            3. Cuadro de Mando Integral (KPIs)
          </button>
        </div>

        {/* Contenido Dinámico según Tab */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 0: PLANIFICACIÓN POA SEP - DIC 2026 VS REALIDAD OPERATIVA */}
          {tabActiva === 'comparativa' && (
            <div className="space-y-6">
              
              {/* Alerta de Estado y Explicación de la Lógica */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                      Sincronización Simultánea
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                      comparativa.proyectosTotales.realidadApp >= 74
                        ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400/50'
                        : comparativa.proyectosTotales.realidadApp >= 69
                        ? 'bg-amber-500/30 text-amber-200 border-amber-400/50'
                        : 'bg-rose-500/30 text-rose-200 border-rose-400/50'
                    }`}>
                      {comparativa.proyectosTotales.realidadApp >= 74 
                        ? '🟢 Meta de 74 Grupos Piloto Cumplida' 
                        : comparativa.proyectosTotales.realidadApp >= 69 
                        ? `🟡 En Seguimiento (${Math.max(0, 74 - comparativa.proyectosTotales.realidadApp)} grupos por formular)` 
                        : `🔴 Alerta Déficit (${Math.max(0, Math.ceil(69 - comparativa.puntoEquilibrio.realidadApp))} para Break-Even)`}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    POA SEP - DIC 2026 (Planificación Cuatrimestral) vs. Realidad Operativa de la Empresa
                  </h3>
                  <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                    El documento POA SEP - DIC 2026 establece la meta de <strong>74 grupos piloto</strong> (promedio 18.5/mes), facturación de <strong>L. 346,320.00</strong> y un punto de equilibrio de <strong>69.0 grupos</strong> (17.3/mes). Conforme se formulan cursos en la aplicación, el sistema rebaja dinámicamente las metas y recalcula la rentabilidad real.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  {onNavegarGerencia && (
                    <button
                      onClick={() => {
                        onClose();
                        onNavegarGerencia('gerencia-academica');
                      }}
                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5"
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Formular en Académica</span>
                    </button>
                  )}
                  {onNavegarGerencia && (
                    <button
                      onClick={() => {
                        onClose();
                        onNavegarGerencia('gerencia-comercializacion');
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5"
                    >
                      <Megaphone className="w-3.5 h-3.5" />
                      <span>Impulsar Comercial</span>
                    </button>
                  )}
                </div>
              </div>

              {/* TABLA 1: Matriz Comparativa Financiera y Operativa Consolidada */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-black text-slate-900">
                      1. Comparativa Consolidada: Planificado POA SEP-DIC 2026 vs. Realidad en App
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    HNL (Lempiras) • T/C 27.00
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3">Variable / Indicador Clave</th>
                        <th className="py-2.5 px-3 text-right">Plan POA 2026</th>
                        <th className="py-2.5 px-3 text-right">Realidad en App</th>
                        <th className="py-2.5 px-3 text-right">Varianza / Brecha</th>
                        <th className="py-2.5 px-3 text-center">% Cumplimiento</th>
                        <th className="py-2.5 px-3 text-center">Estado Semáforo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      
                      {/* Ingresos */}
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-black text-slate-900">Ingresos Operativos Totales</div>
                          <div className="text-[11px] text-slate-500">Facturación anual por matrícula y cursos</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                          {formatearHNL(comparativa.ingresos.planificadoPOA)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-blue-900 text-sm">
                          {formatearHNL(comparativa.ingresos.realidadApp)}
                        </td>
                        <td className={`py-3 px-3 text-right font-mono font-bold ${
                          comparativa.ingresos.varianza >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {comparativa.ingresos.varianza >= 0 ? `+${formatearHNL(comparativa.ingresos.varianza)}` : `-${formatearHNL(Math.abs(comparativa.ingresos.varianza))}`}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold">
                          {comparativa.ingresos.porcentajeCumplimiento.toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap text-[11px]">
                          {comparativa.ingresos.semaforo}
                        </td>
                      </tr>

                      {/* Egresos */}
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-black text-slate-900">Egresos y Costos Totales</div>
                          <div className="text-[11px] text-slate-500">Gastos administrativos, honorarios docentes y marketing</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                          {formatearHNL(comparativa.egresos.planificadoPOA)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-slate-900 text-sm">
                          {formatearHNL(comparativa.egresos.realidadApp)}
                        </td>
                        <td className={`py-3 px-3 text-right font-mono font-bold ${
                          comparativa.egresos.varianza <= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {formatearHNL(comparativa.egresos.varianza)}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold">
                          {comparativa.egresos.porcentajeCumplimiento.toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap text-[11px]">
                          {comparativa.egresos.semaforo}
                        </td>
                      </tr>

                      {/* Superávit */}
                      <tr className="hover:bg-slate-50 transition-colors bg-indigo-50/20">
                        <td className="py-3 px-3">
                          <div className="font-black text-indigo-950">Superávit Neto Operativo</div>
                          <div className="text-[11px] text-slate-500">Resultado neto después de todos los costos operativos</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                          {formatearHNL(comparativa.superavit.planificadoPOA)}
                        </td>
                        <td className={`py-3 px-3 text-right font-mono font-black text-sm ${
                          comparativa.superavit.realidadApp >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {formatearHNL(comparativa.superavit.realidadApp)}
                        </td>
                        <td className={`py-3 px-3 text-right font-mono font-bold ${
                          comparativa.superavit.varianza >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {comparativa.superavit.varianza >= 0 ? `+${formatearHNL(comparativa.superavit.varianza)}` : `-${formatearHNL(Math.abs(comparativa.superavit.varianza))}`}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold">
                          {comparativa.superavit.porcentajeCumplimiento.toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap text-[11px]">
                          {comparativa.superavit.semaforo}
                        </td>
                      </tr>

                      {/* Margen */}
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-black text-slate-900">Margen Operativo (%)</div>
                          <div className="text-[11px] text-slate-500">Rentabilidad porcentual sobre ingresos totales</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                          {comparativa.margenOperativo.planificadoPOA}%
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-indigo-900 text-sm">
                          {comparativa.margenOperativo.realidadApp.toFixed(1)}%
                        </td>
                        <td className={`py-3 px-3 text-right font-mono font-bold ${
                          comparativa.margenOperativo.realidadApp >= comparativa.margenOperativo.planificadoPOA ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                          {(comparativa.margenOperativo.realidadApp - comparativa.margenOperativo.planificadoPOA).toFixed(1)} pts
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold">
                          {((comparativa.margenOperativo.realidadApp / comparativa.margenOperativo.planificadoPOA) * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap text-[11px]">
                          {comparativa.margenOperativo.semaforo}
                        </td>
                      </tr>

                      {/* Proyectos Formulados con Rebaja Automática */}
                      <tr className="hover:bg-slate-50 transition-colors bg-purple-50/20">
                        <td className="py-3 px-3">
                          <div className="font-black text-purple-950 flex items-center gap-1.5">
                            <span>Cartera de Cursos Formulados</span>
                            <span className="text-[10px] px-1.5 py-0.2 bg-purple-200 text-purple-900 rounded font-bold">
                              Rebaja Automática -1
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">Cursos registrados en la app vs. meta del POA</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                          {comparativa.proyectosTotales.planificadoPOA} proyectos
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-purple-900 text-sm">
                          {comparativa.proyectosTotales.realidadApp} formulados
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">
                          {Math.max(0, 124 - comparativa.proyectosTotales.realidadApp)} restantes
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold">
                          {comparativa.proyectosTotales.porcentajeCumplimiento.toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap text-[11px]">
                          {comparativa.proyectosTotales.semaforo}
                        </td>
                      </tr>

                      {/* Punto de Equilibrio */}
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-black text-slate-900">Punto de Equilibrio (Break-Even)</div>
                          <div className="text-[11px] text-slate-500">Volumen mínimo de cursos para cubrir 100% costos</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                          {comparativa.puntoEquilibrio.planificadoPOA} proy.
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-amber-900 text-sm">
                          {comparativa.puntoEquilibrio.realidadApp} proy.
                        </td>
                        <td className={`py-3 px-3 text-right font-mono font-bold ${
                          comparativa.puntoEquilibrio.realidadApp >= 44 ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                          {comparativa.puntoEquilibrio.realidadApp >= 44 ? '100% Cubierto' : `Faltan ${44 - comparativa.puntoEquilibrio.realidadApp} proy.`}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold">
                          {comparativa.puntoEquilibrio.porcentajeCumplimiento.toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap text-[11px]">
                          {comparativa.puntoEquilibrio.semaforo}
                        </td>
                      </tr>

                      {/* Runway de Caja */}
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-black text-slate-900">Runway de Cobertura de Caja</div>
                          <div className="text-[11px] text-slate-500">Meses de solvencia considerando saldo neto de efectivo</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                          {comparativa.runway.planificadoPOA} meses
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-purple-900 text-sm">
                          {comparativa.runway.realidadApp} meses
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                          {comparativa.runway.realidadApp >= 12 ? '🟢 &gt; 12 meses' : '🟡 &lt; 12 meses'}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold">
                          {comparativa.runway.porcentajeCumplimiento.toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap text-[11px]">
                          {comparativa.runway.semaforo}
                        </td>
                      </tr>

                    </tbody>
                  </table>
                </div>
              </div>

              {/* TABLA 2: Comparativa por Gerencias */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-black text-slate-900">
                      2. Presupuestos Asignados vs. Ejecución Real por Gerencia
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    Summit Impulsa Global, S.A. de C.V.
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3">Gerencia / Dirección</th>
                        <th className="py-2.5 px-3">Líder Oficial & Correo</th>
                        <th className="py-2.5 px-3 text-right">Presupuesto POA 2026</th>
                        <th className="py-2.5 px-3 text-right">Ejecución Real en App</th>
                        <th className="py-2.5 px-3 text-right">Saldo Disponible</th>
                        <th className="py-2.5 px-3 text-center">% Ejecutado</th>
                        <th className="py-2.5 px-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {comparativa.gerencias.map((g, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-black text-slate-900">{g.gerencia}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-800">{g.lider}</div>
                            <div className="text-[11px] font-mono text-slate-500">{g.correo}</div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                            {formatearHNL(g.presupuestoPOAHNL)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-indigo-900">
                            {formatearHNL(g.costoEjecutadoHNL)}
                          </td>
                          <td className={`py-3 px-3 text-right font-mono font-bold ${
                            g.varianzaPresupuestoHNL >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {formatearHNL(g.varianzaPresupuestoHNL)}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold">
                            {g.porcentajeEjecucion.toFixed(1)}%
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                              g.estado === 'Optimo' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {g.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TABLA 3: Flujo Mensual Sep - Dic 2026 (Plan vs Real) */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-black text-slate-900">
                      3. Flujo Neto Mensual Bootstrapping: Plan POA SEP-DIC 2026 vs. Realidad
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    Cuatrimestre Piloto 2026
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3">Mes Cuatrimestre</th>
                        <th className="py-2.5 px-3 text-right">Ingresos Plan</th>
                        <th className="py-2.5 px-3 text-right">Ingresos Real</th>
                        <th className="py-2.5 px-3 text-right">Egresos Plan</th>
                        <th className="py-2.5 px-3 text-right">Egresos Real</th>
                        <th className="py-2.5 px-3 text-right">Flujo Neto Real</th>
                        <th className="py-2.5 px-3 text-center">Grupos (Real / Plan)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {comparativa.trimestres.map((t) => (
                        <tr key={t.trimestre} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 font-black text-slate-900">{t.nombre}</td>
                          <td className="py-3 px-3 text-right font-mono text-slate-600">{formatearHNL(t.ingresosPlan)}</td>
                          <td className="py-3 px-3 text-right font-mono font-black text-blue-900">{formatearHNL(t.ingresosReal)}</td>
                          <td className="py-3 px-3 text-right font-mono text-slate-600">{formatearHNL(t.egresosPlan)}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">{formatearHNL(t.egresosReal)}</td>
                          <td className={`py-3 px-3 text-right font-mono font-black ${
                            t.flujoNetoReal >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {formatearHNL(t.flujoNetoReal)}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold">
                            <span className={`px-2 py-0.5 rounded text-[11px] ${
                              t.proyectosReal >= t.proyectosPlan ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {t.proyectosReal} / {t.proyectosPlan}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 1: RESUMEN / VISTA GENERAL */}
          {tabActiva === 'resumen' && (
            <div className="space-y-6">
              
              {/* Bloque de Gerencias y Líderes */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-black text-slate-900">
                      Gobernanza Directiva y Distribución Presupuestaria SEP - DIC 2026
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    Total Presupuesto Cuatrimestral: L. 460,100.00
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {presupuestosGerencias.map((g) => {
                    const vista = g.gerencia.includes('Académica')
                      ? 'gerencia-academica'
                      : g.gerencia.includes('Comercial')
                      ? 'gerencia-comercializacion'
                      : 'gerencia-general';

                    return (
                      <div 
                        key={g.gerencia}
                        className={`p-4 rounded-xl border transition-all ${
                          g.colorTema === 'purple'
                            ? 'bg-purple-50/50 border-purple-200'
                            : g.colorTema === 'blue'
                            ? 'bg-blue-50/50 border-blue-200'
                            : 'bg-emerald-50/50 border-emerald-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <span className="uppercase tracking-wider">{g.gerencia}</span>
                          <span className="px-2 py-0.5 rounded-full bg-white font-mono text-[11px] shadow-2xs">
                            {g.porcentajePart}% del POA
                          </span>
                        </div>
                        <div className="text-sm font-black text-slate-900 mt-1">
                          {g.lider}
                        </div>
                        <div className="text-xs text-slate-600 font-medium">
                          {g.eje}
                        </div>

                        {/* Correo Oficial */}
                        <div className="mt-2.5 flex items-center gap-1.5 text-xs font-mono bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span className="text-slate-800 font-bold truncate select-all">{g.correo}</span>
                        </div>

                        {/* Monto Presupuestario */}
                        <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-baseline justify-between">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold block">Presupuesto Anual</span>
                            <span className="text-base font-black font-mono text-slate-900">{formatearHNL(g.totalAnual)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 uppercase font-bold block">Actividades</span>
                            <span className="text-xs font-bold text-slate-700">{g.numActividades} ({g.porcentajeActividades}%)</span>
                          </div>
                        </div>

                        {onNavegarGerencia && (
                          <button
                            onClick={() => {
                              onClose();
                              onNavegarGerencia(vista as VistaPrincipal);
                            }}
                            className="mt-3 w-full py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                          >
                            <span>Ir a {g.gerencia}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Síntesis de Flujo y Superávit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Cuadro de Flujo Bootstrapping */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
                  <h4 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>Balance Anual & Superávit Operativo</span>
                  </h4>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="font-semibold text-slate-700">Ingresos Proyectados (124 Proyectos):</span>
                      <span className="font-mono font-black text-slate-900">{formatearHNL(resumen.ingresosProyectados)}</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="font-semibold text-slate-700">Egresos Operativos (Fijos Lean + Variables):</span>
                      <span className="font-mono font-black text-rose-700">{formatearHNL(1129850)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <div>
                        <span className="font-black text-emerald-950 block">Superávit Operativo Estimado</span>
                        <span className="text-[10px] text-emerald-800 font-medium">Margen Operativo 42.6%</span>
                      </div>
                      <span className="text-base font-mono font-black text-emerald-800">{formatearHNL(resumen.superavitOperativoEst)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50 border border-purple-200">
                      <div>
                        <span className="font-black text-purple-950 block">Saldo de Caja Acumulado Cierre</span>
                        <span className="text-[10px] text-purple-800 font-medium">Capital inicial L. 10k + Runway &gt; 19 meses</span>
                      </div>
                      <span className="text-base font-mono font-black text-purple-800">{formatearHNL(resumen.cajaEstimadaCierre)}</span>
                    </div>
                  </div>
                </div>

                {/* Síntesis de Cumplimiento de KPIs */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      <span>Semáforo del Cuadro de Mando Integral (10 KPIs)</span>
                    </h4>

                    <div className="space-y-2 text-xs">
                      {kpis.slice(0, 5).map(kpi => (
                        <div key={kpi.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                          <div>
                            <span className="font-bold text-slate-800 block text-[11px]">{kpi.indicador}</span>
                            <span className="text-[10px] text-slate-500">{kpi.gerencia} • {kpi.responsable}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-slate-900">{kpi.realProy}</span>
                            <span className="text-[10px] block text-emerald-600 font-bold">{kpi.cumplimientoPorcentaje}% {kpi.semaforo}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setTabActiva('kpis')}
                    className="mt-3 text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center justify-end gap-1"
                  >
                    <span>Ver todos los 10 KPIs detallados</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: 1. CONSOLIDACIÓN PRESUPUESTARIA POR GERENCIA */}
          {tabActiva === 'presupuestos' && (
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    1. Consolidación Presupuestaria por Gerencia (HNL - Cuatrimestre SEP - DIC 2026)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Desglose mensual por eje operativo, líder responsable y actividades programadas para el pilotaje.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200">
                  Total Asignado: L. 460,100.00 (44 Actividades)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-bold">
                      <th className="py-2.5 px-3">Gerencia / Eje Operativo</th>
                      <th className="py-2.5 px-3">Líder / Responsable</th>
                      <th className="py-2.5 px-3">Correo Oficial</th>
                      <th className="py-2.5 px-2 text-right">Sep 2026</th>
                      <th className="py-2.5 px-2 text-right">Oct 2026</th>
                      <th className="py-2.5 px-2 text-right">Nov 2026</th>
                      <th className="py-2.5 px-2 text-right">Dic 2026</th>
                      <th className="py-2.5 px-3 text-right">Total Cuatrimestre (HNL)</th>
                      <th className="py-2.5 px-2 text-right">% Part.</th>
                      <th className="py-2.5 px-2 text-center">Act.</th>
                      <th className="py-2.5 px-2 text-right">% Act.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {presupuestosGerencias.map((g) => (
                      <tr key={g.gerencia} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-sans font-bold text-slate-900">
                          <div>{g.gerencia}</div>
                          <div className="text-[10px] text-slate-500 font-normal">{g.eje}</div>
                        </td>
                        <td className="py-2.5 px-3 font-sans font-semibold text-slate-800">{g.lider}</td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px] select-all">{g.correo}</td>
                        <td className="py-2.5 px-2 text-right text-slate-700">{formatearHNL(g.q1)}</td>
                        <td className="py-2.5 px-2 text-right text-slate-700">{formatearHNL(g.q2)}</td>
                        <td className="py-2.5 px-2 text-right text-slate-700">{formatearHNL(g.q3)}</td>
                        <td className="py-2.5 px-2 text-right text-slate-700">{formatearHNL(g.q4)}</td>
                        <td className="py-2.5 px-3 text-right font-black text-slate-900 bg-slate-50">{formatearHNL(g.totalAnual)}</td>
                        <td className="py-2.5 px-2 text-right font-bold text-indigo-700">{g.porcentajePart}%</td>
                        <td className="py-2.5 px-2 text-center font-bold text-slate-800">{g.numActividades}</td>
                        <td className="py-2.5 px-2 text-right text-slate-600">{g.porcentajeActividades}%</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-900 text-white font-bold">
                      <td className="py-3 px-3 font-sans" colSpan={3}>
                        TOTAL PRESUPUESTO ASIGNADO (Summit Impulsa Global)
                      </td>
                      <td className="py-3 px-2 text-right">L. 114,900.00</td>
                      <td className="py-3 px-2 text-right">L. 109,700.00</td>
                      <td className="py-3 px-2 text-right">L. 115,600.00</td>
                      <td className="py-3 px-2 text-right">L. 119,900.00</td>
                      <td className="py-3 px-3 text-right font-black text-amber-300">L. 460,100.00</td>
                      <td className="py-3 px-2 text-right">100.0%</td>
                      <td className="py-3 px-2 text-center">44</td>
                      <td className="py-3 px-2 text-right">100.0%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: 2. BALANCE Y FLUJO NETO TRIMESTRAL CONSOLIDADO */}
          {tabActiva === 'flujo' && (
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    2. Balance y Flujo Neto Trimestral Consolidado (HNL) - Modelo Bootstrapping
                  </h3>
                  <p className="text-xs text-slate-500">
                    Evolución de caja operativa partiendo del capital inicial de L. 10,000.00 hacia un superávit de L. 839,150.00.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                  Margen Operativo: 42.6%
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-bold">
                      <th className="py-3 px-3">Línea del Flujo / Concepto</th>
                      <th className="py-3 px-3">Estructura</th>
                      <th className="py-3 px-2 text-right">Q1 (Ene-Mar)</th>
                      <th className="py-3 px-2 text-right">Q2 (Abr-Jun)</th>
                      <th className="py-3 px-2 text-right">Q3 (Jul-Sep)</th>
                      <th className="py-3 px-2 text-right">Q4 (Oct-Dic)</th>
                      <th className="py-3 px-3 text-right font-black">Total Anual (HNL)</th>
                      <th className="py-3 px-3 text-right">% Sobre Ingresos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {flujoTrimestral.map((f, idx) => {
                      const isSuperavit = f.concepto.includes('Flujo Neto');
                      const isCaja = f.concepto.includes('Saldo de Caja');

                      return (
                        <tr 
                          key={f.concepto}
                          className={`${
                            isSuperavit 
                              ? 'bg-emerald-50/70 font-bold text-emerald-950' 
                              : isCaja 
                              ? 'bg-purple-50/70 font-bold text-purple-950' 
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <td className="py-3 px-3 font-sans font-bold">
                            {f.concepto}
                          </td>
                          <td className="py-3 px-3 font-sans text-slate-600 font-normal">{f.subtitulo}</td>
                          <td className="py-3 px-2 text-right">{formatearHNL(f.q1)}</td>
                          <td className="py-3 px-2 text-right">{formatearHNL(f.q2)}</td>
                          <td className="py-3 px-2 text-right">{formatearHNL(f.q3)}</td>
                          <td className="py-3 px-2 text-right">{formatearHNL(f.q4)}</td>
                          <td className={`py-3 px-3 text-right font-black ${isSuperavit ? 'text-emerald-700' : isCaja ? 'text-purple-700' : 'text-slate-900'}`}>
                            {formatearHNL(f.totalAnual)}
                          </td>
                          <td className="py-3 px-3 text-right font-sans font-bold">{f.porcentaje}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: 3. CUADRO DE MANDO INTEGRAL (KPIS ESTRATÉGICOS) */}
          {tabActiva === 'kpis' && (
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    3. Cuadro de Mando Integral • Indicadores Clave de Desempeño (KPIs Estratégicos SEP - DIC 2026)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Metas, frecuencias, líneas base, proyección real y semáforos asignados por gerencia y gobernanza global.
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                  10 KPIs 100% Cumplidos o Superados
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-bold">
                      <th className="py-2.5 px-3">Gerencia</th>
                      <th className="py-2.5 px-3">Área / Eje</th>
                      <th className="py-2.5 px-3">Indicador Clave (KPI)</th>
                      <th className="py-2.5 px-3">Meta Estratégica 2026</th>
                      <th className="py-2.5 px-2">Frecuencia</th>
                      <th className="py-2.5 px-2 text-right">Línea Base</th>
                      <th className="py-2.5 px-2 text-right">Meta</th>
                      <th className="py-2.5 px-3 text-right">Real / Proy.</th>
                      <th className="py-2.5 px-2 text-right">% Cumpl.</th>
                      <th className="py-2.5 px-2 text-center">Semáforo</th>
                      <th className="py-2.5 px-3">Responsable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {kpis.map((kpi) => (
                      <tr key={kpi.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{kpi.gerencia}</td>
                        <td className="py-2.5 px-3 text-slate-600">{kpi.areaEje}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{kpi.indicador}</td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">{kpi.metaEstrategica}</td>
                        <td className="py-2.5 px-2 text-slate-600">{kpi.frecuencia}</td>
                        <td className="py-2.5 px-2 text-right font-mono text-slate-500">{kpi.lineaBase}</td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-700">{kpi.meta}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-indigo-900">{kpi.realProy}</td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-emerald-700">{kpi.cumplimientoPorcentaje}%</td>
                        <td className="py-2.5 px-2 text-center whitespace-nowrap text-[11px]">{kpi.semaforo}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">{kpi.responsable}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer del Modal */}
        <div className="bg-slate-100 px-5 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Matriz Oficial POA SEP - DIC 2026 validada para SUMMIT IMPULSA GLOBAL, S.A. DE C.V.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportarCSVMatriz}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold rounded-lg transition-colors text-xs"
            >
              Exportar Matriz CSV
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors text-xs"
            >
              Cerrar Tablero
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
