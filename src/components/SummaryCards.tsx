import React from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  PieChart, 
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../types';
import { formatearMoneda } from '../utils/calculations';

interface SummaryCardsProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ proyectos, moneda }) => {
  const totalCostosOperativos = proyectos.reduce((acc, p) => acc + p.gastoTotalOperativo, 0);
  const totalPrecioVentaRequerido = proyectos.reduce((acc, p) => acc + p.precioVentaRequerido, 0);
  const totalIngresoRealNeto = proyectos.reduce((acc, p) => acc + p.ingresoRealTotal, 0);
  const totalGananciaFinal = proyectos.reduce((acc, p) => acc + p.totalGananciasFinales, 0);
  const totalAlumnosProyectados = proyectos.reduce((acc, p) => acc + p.alumnosProyectados, 0);
  const totalAlumnosReales = proyectos.reduce((acc, p) => acc + p.alumnosFinal, 0);
  
  // Consolidación Fiscal Automática ISV
  const totalFacturadoConISV = proyectos.reduce((acc, p) => acc + (p.ingresoTotalConISV || p.ingresoRealTotal), 0);
  const totalISVTrasladarSAR = proyectos.reduce((acc, p) => acc + (p.isvTotalTrasladarSAR || 0), 0);
  const proyectosGravados = proyectos.filter(p => p.aplicaISV).length;
  const proyectosExentos = proyectos.filter(p => !p.aplicaISV).length;

  const proyectosCompletados = proyectos.filter(p => p.seLlevoACabo === 'Sí').length;
  const proyectosEnCurso = proyectos.filter(p => p.seLlevoACabo === 'En curso').length;

  const margenGlobalReal = (totalIngresoRealNeto > 0 && totalCostosOperativos > 0)
    ? (totalGananciaFinal / totalCostosOperativos) * 100 
    : 0;

  return (
    <div className="space-y-4 mb-6">
      
      {/* 4 Tarjetas Principales de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Gasto Total Operativo */}
        <div 
          id="card-gasto-total"
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Gasto Total Operativo
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {formatearMoneda(totalCostosOperativos, moneda)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <span>En {proyectos.length} proyectos registrados</span>
            </div>
          </div>
        </div>

        {/* 2. Ingreso Neto Real (SUMMIT) */}
        <div 
          id="card-ingresos-totales"
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Ingreso Neto SUMMIT
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-extrabold text-blue-700">
              {formatearMoneda(totalIngresoRealNeto, moneda)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <span>Meta requerida: {formatearMoneda(totalPrecioVentaRequerido, moneda)}</span>
            </div>
          </div>
        </div>

        {/* 3. Total Ganancias Finales */}
        <div 
          id="card-ganancias-finales"
          className={`bg-white rounded-xl p-4 border shadow-xs flex flex-col justify-between ${
            totalGananciaFinal >= 0 ? 'border-emerald-200' : 'border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Ganancia Neta Final
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              totalGananciaFinal >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-xl sm:text-2xl font-black ${
              totalGananciaFinal >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              {formatearMoneda(totalGananciaFinal, moneda)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-medium">
              <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                margenGlobalReal >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                ROI: {margenGlobalReal.toFixed(1)}%
              </span>
              <span className="text-slate-500">sobre inversión</span>
            </div>
          </div>
        </div>

        {/* 4. Alumnos Totales & Ejecución */}
        <div 
          id="card-alumnos-totales"
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Alumnos & Ejecución
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {totalAlumnosReales}
              </span>
              <span className="text-xs font-medium text-slate-500">
                / {totalAlumnosProyectados} proyectados
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> {proyectosCompletados} realizados
              </span>
              {proyectosEnCurso > 0 && (
                <span className="text-amber-700 font-semibold">
                  • {proyectosEnCurso} en curso
                </span>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Banner Consolidado Fiscal SAR Honduras (Cálculo Automático) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-3.5 sm:p-4 border border-indigo-900/60 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Consolidado Fiscal & Régimen ISV (SAR Honduras)
                </span>
                <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 px-1.5 py-0.2 rounded">
                  Automático
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {proyectosGravados} proyectos gravados con 15% ISV • {proyectosExentos} exentos de ISV (Educación Acreditada)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-6 border-t md:border-t-0 border-indigo-900/50 pt-2 md:pt-0">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Facturación Total (c/ ISV)
              </span>
              <span className="text-sm sm:text-base font-black font-mono text-slate-100">
                {formatearMoneda(totalFacturadoConISV, moneda)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Ingreso Neto SUMMIT
              </span>
              <span className="text-sm sm:text-base font-black font-mono text-emerald-400">
                {formatearMoneda(totalIngresoRealNeto, moneda)}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <span className="text-[10px] text-amber-300/90 uppercase font-semibold block">
                ISV a Trasladar SAR (15%)
              </span>
              <span className="text-sm sm:text-base font-black font-mono text-amber-400">
                {formatearMoneda(totalISVTrasladarSAR, moneda)}
              </span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
