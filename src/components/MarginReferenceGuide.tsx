import React from 'react';
import { Target, HelpCircle, ArrowRight } from 'lucide-react';
import { MARGENES_REFERENCIA } from '../utils/initialData';

export const MarginReferenceGuide: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Guía de Referencia de Márgenes Operativos & Alumnos Mínimos
          </h3>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">
          Parámetros según metodología de la matriz
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {MARGENES_REFERENCIA.map((item) => (
          <div
            key={item.margen}
            className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-base font-black text-slate-900 font-mono">
                {item.margen}%
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">
                ≥ {item.alumnosMinimos} alum.
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1.5 leading-snug">
              {item.descripcion}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
