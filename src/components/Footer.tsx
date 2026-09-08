import React from 'react';
import { Building2, MapPin, FileCheck2, ShieldCheck, Mail } from 'lucide-react';
import { SummitLogo } from './SummitLogo';
import { INSTITUCION_INFO } from '../utils/institutionalInfo';

interface FooterProps {
  onCargarPlantilla?: () => void;
  onVaciarDatos?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onCargarPlantilla, onVaciarDatos }) => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Identidad y Razón Social */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <SummitLogo variant="compact" size="sm" showTagline={false} />
            <div className="sm:border-l sm:border-slate-200 sm:pl-3">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-slate-800">
                <span>{INSTITUCION_INFO.razonSocial}</span>
                <span className="text-slate-300">•</span>
                <span className="text-blue-800 font-extrabold">{INSTITUCION_INFO.nombreComercial}</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {INSTITUCION_INFO.lema}
              </p>
            </div>
          </div>

          {/* Respaldo Institucional y Fiscal: RTN & Dirección */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 text-xs">
            {/* RTN */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl shadow-2xs transition-colors">
              <Building2 className="w-3.5 h-3.5 text-purple-700 shrink-0" />
              <div className="flex items-baseline gap-1 text-[11px]">
                <span className="font-semibold text-slate-600">RTN:</span>
                <span className="font-mono font-bold text-slate-900 tracking-wider">
                  {INSTITUCION_INFO.rtn}
                </span>
              </div>
            </div>

            {/* Dirección */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl shadow-2xs transition-colors">
              <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <div className="flex items-baseline gap-1 text-[11px]">
                <span className="font-semibold text-slate-600">Dirección:</span>
                <span className="font-medium text-slate-900">
                  {INSTITUCION_INFO.direccion}
                </span>
              </div>
            </div>

            {/* Correo / Contacto */}
            <a
              href={`mailto:${INSTITUCION_INFO.correoContacto}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/60 hover:bg-blue-100/60 border border-blue-200/80 text-blue-900 rounded-xl shadow-2xs transition-colors text-[11px] font-semibold"
            >
              <Mail className="w-3.5 h-3.5 text-blue-700 shrink-0" />
              <span>{INSTITUCION_INFO.correoContacto}</span>
            </a>
          </div>

        </div>

        {/* Línea divisoria y Badges de Cumplimiento Legal */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Persona Jurídica Constituida en Honduras
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
              <FileCheck2 className="w-3 h-3 text-blue-600" />
              Agente de Retención SAR
            </span>
            <span className="text-[10px] text-slate-400">
              Ley del ISV (Decreto 24-1964)
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 text-[11px]">
            {onCargarPlantilla && (
              <button
                type="button"
                onClick={onCargarPlantilla}
                className="text-slate-400 hover:text-slate-700 underline cursor-pointer"
              >
                Cargar datos de ejemplo
              </button>
            )}
            {onCargarPlantilla && onVaciarDatos && <span className="text-slate-300">•</span>}
            {onVaciarDatos && (
              <button
                type="button"
                onClick={onVaciarDatos}
                className="text-rose-400 hover:text-rose-600 underline cursor-pointer"
              >
                Vaciar matriz
              </button>
            )}
            <span className="text-slate-400">
              © {new Date().getFullYear()} {INSTITUCION_INFO.razonSocial}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
