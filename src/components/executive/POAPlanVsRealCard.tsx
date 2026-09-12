import React, { useState } from 'react';
import { 
  TrendingUp, 
  Target, 
  Layers, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Scale, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles,
  BarChart3,
  Calendar,
  Building2,
  GraduationCap,
  Megaphone
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { calcularComparativaPOAVsRealidad } from '../../utils/poaComparisonUtils';
import { formatearHNL } from '../../utils/poa2026Data';

interface POAPlanVsRealCardProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onAbrirTableroPOA: () => void;
}

export const POAPlanVsRealCard: React.FC<POAPlanVsRealCardProps> = ({
  proyectos,
  moneda,
  onAbrirTableroPOA,
}) => {
  const [vistaInterna, setVistaInterna] = useState<'financiero' | 'gerencias' | 'trimestres'>('financiero');

  const comparativa = calcularComparativaPOAVsRealidad(proyectos, moneda);
  const { ingresos, superavit, proyectosTotales, puntoEquilibrio, margenOperativo, gerencias, trimestres } = comparativa;

  // Semáforo global
  const estadoGlobal = proyectosTotales.realidadApp >= 124
    ? 'verde'
    : proyectosTotales.realidadApp >= 44
    ? 'amarillo'
    : 'rojo';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      
      {/* Barra Superior del Comparador */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-indigo-900/60">
        
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/80 border border-indigo-400/30 text-white shadow-inner shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                PLANIFICACIÓN ANUAL VS. REALIDAD OPERATIVA
              </span>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                estadoGlobal === 'verde'
                  ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400/50'
                  : estadoGlobal === 'amarillo'
                  ? 'bg-amber-500/30 text-amber-200 border-amber-400/50'
                  : 'bg-rose-500/30 text-rose-200 border-rose-400/50'
              }`}>
                {estadoGlobal === 'verde' ? '🟢 Meta POA Cumplida' : estadoGlobal === 'amarillo' ? '🟡 En Seguimiento (Break-Even Cubierto)' : '🔴 Déficit Operativo'}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white mt-0.5 flex items-center gap-2">
              <span>POA SEP - DIC 2026: Planificación vs. Ejecución en Tiempo Real</span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={onAbrirTableroPOA}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs border border-indigo-400/40 cursor-pointer"
            title="Abrir Tablero de Control Directivo & Cuadro de Mando Integral completo"
          >
            <span>Ver Tablero Completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Selector de Vistas Secundarias del Comparador */}
      <div className="flex items-center justify-between p-3 bg-slate-50 border-b border-slate-200 text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setVistaInterna('financiero')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              vistaInterna === 'financiero'
                ? 'bg-white text-indigo-900 shadow-xs border border-slate-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Resumen Financiero (Plan vs. Real)
          </button>
          <button
            onClick={() => setVistaInterna('gerencias')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              vistaInterna === 'gerencias'
                ? 'bg-white text-indigo-900 shadow-xs border border-slate-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Por Gerencias (Presupuestos)
          </button>
          <button
            onClick={() => setVistaInterna('trimestres')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              vistaInterna === 'trimestres'
                ? 'bg-white text-indigo-900 shadow-xs border border-slate-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Flujo Trimestral Q1 - Q4
          </button>
        </div>

        <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
          Tipo de Cambio: <strong>L. 27.00 / USD</strong> • Consolidación HNL
        </span>
      </div>

      {/* Contenido: 1. Resumen Financiero Plan vs Real */}
      {vistaInterna === 'financiero' && (
        <div className="p-4 sm:p-5 space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* 1. Ingresos */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Ingresos Operativos</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-lg font-black font-mono text-slate-900">
                  {formatearHNL(ingresos.realidadApp)}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  ingresos.porcentajeCumplimiento >= 85 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {ingresos.porcentajeCumplimiento.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200">
                <span>Plan POA 2026:</span>
                <span className="font-semibold font-mono text-slate-700">{formatearHNL(ingresos.planificadoPOA)}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] mt-1">
                <span className="text-slate-500">Brecha / Varianza:</span>
                <span className={`font-mono font-bold ${ingresos.varianza >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {ingresos.varianza >= 0 ? `+${formatearHNL(ingresos.varianza)}` : `-${formatearHNL(Math.abs(ingresos.varianza))}`}
                </span>
              </div>
            </div>

            {/* 2. Superávit Operativo */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Superávit Neto</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-lg font-black font-mono text-slate-900">
                  {formatearHNL(superavit.realidadApp)}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  superavit.porcentajeCumplimiento >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {superavit.porcentajeCumplimiento.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200">
                <span>Plan POA 2026:</span>
                <span className="font-semibold font-mono text-slate-700">{formatearHNL(superavit.planificadoPOA)}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] mt-1">
                <span className="text-slate-500">Margen Real:</span>
                <span className="font-mono font-bold text-indigo-700">
                  {margenOperativo.realidadApp.toFixed(1)}% (Meta: 42.6%)
                </span>
              </div>
            </div>

            {/* 3. Proyectos Formulados (Rebaja Automática) */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Cartera de Proyectos</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-lg font-black font-mono text-slate-900">
                  {proyectosTotales.realidadApp} / 124
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  proyectosTotales.porcentajeCumplimiento >= 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {proyectosTotales.porcentajeCumplimiento.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200">
                <span>Faltantes p/Meta:</span>
                <span className="font-bold font-mono text-rose-600">
                  {Math.max(0, 124 - proyectosTotales.realidadApp)} proyectos
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] mt-1">
                <span className="text-slate-500">Rebaja Dinámica:</span>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                  -1 por curso
                </span>
              </div>
            </div>

            {/* 4. Punto de Equilibrio (Break-Even) */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Punto de Equilibrio</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-lg font-black font-mono text-slate-900">
                  {puntoEquilibrio.realidadApp} / 44
                </span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                  puntoEquilibrio.realidadApp >= 44 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {puntoEquilibrio.realidadApp >= 44 ? 'Cubierto' : 'Riesgo Déficit'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200">
                <span>Meta Mínima:</span>
                <span className="font-semibold font-mono text-slate-700">44 proy. (4 / mes)</span>
              </div>
              <div className="flex items-center justify-between text-[11px] mt-1">
                <span className="text-slate-500">Estado Solvencia:</span>
                <span className="font-bold text-slate-800 text-[11px]">
                  {puntoEquilibrio.realidadApp >= 44 ? '100% Costos solventes' : `Faltan ${Math.max(0, 44 - puntoEquilibrio.realidadApp)} proy.`}
                </span>
              </div>
            </div>

          </div>

          {/* Barra de Progreso Integral de la Planificación Anual */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
              <span className="flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-600" />
                <span>Ejecución del Plan Anual de Facturación (L. 1,969,000.00):</span>
              </span>
              <span className="font-mono text-indigo-900">
                {formatearHNL(ingresos.realidadApp)} de {formatearHNL(ingresos.planificadoPOA)} ({ingresos.porcentajeCumplimiento.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, ingresos.porcentajeCumplimiento)}%` }}
              />
            </div>
          </div>

        </div>
      )}

      {/* Contenido: 2. Comparativa por Gerencias */}
      {vistaInterna === 'gerencias' && (
        <div className="p-4 sm:p-5 overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2 px-3">Gerencia / Responsable</th>
                <th className="py-2 px-3 text-right">Presupuesto POA 2026</th>
                <th className="py-2 px-3 text-right">Ejecución Real en App</th>
                <th className="py-2 px-3 text-right">Saldo / Varianza</th>
                <th className="py-2 px-3 text-center">% Ejecutado</th>
                <th className="py-2 px-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {gerencias.map((g, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-900">{g.gerencia}</div>
                    <div className="text-[11px] text-slate-500">{g.lider} • {g.correo}</div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                    {formatearHNL(g.presupuestoPOAHNL)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-900">
                    {formatearHNL(g.costoEjecutadoHNL)}
                  </td>
                  <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                    g.varianzaPresupuestoHNL >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {formatearHNL(g.varianzaPresupuestoHNL)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold">
                    {g.porcentajeEjecucion.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-center">
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
      )}

      {/* Contenido: 3. Comparativa Trimestral Q1 - Q4 */}
      {vistaInterna === 'trimestres' && (
        <div className="p-4 sm:p-5 overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2 px-3">Periodo Trimestral</th>
                <th className="py-2 px-3 text-right">Ingresos Plan</th>
                <th className="py-2 px-3 text-right">Ingresos Real</th>
                <th className="py-2 px-3 text-right">Egresos Plan</th>
                <th className="py-2 px-3 text-right">Egresos Real</th>
                <th className="py-2 px-3 text-right">Flujo Neto Real</th>
                <th className="py-2 px-3 text-center">Proy. Real / Plan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {trimestres.map((t) => (
                <tr key={t.trimestre} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900">{t.nombre}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">{formatearHNL(t.ingresosPlan)}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-900">{formatearHNL(t.ingresosReal)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">{formatearHNL(t.egresosPlan)}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">{formatearHNL(t.egresosReal)}</td>
                  <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                    t.flujoNetoReal >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {formatearHNL(t.flujoNetoReal)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold">
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
      )}

    </div>
  );
};
