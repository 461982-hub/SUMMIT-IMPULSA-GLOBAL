import React from 'react';
import { SUMMIT_BRANDING } from '../../utils/brandingUtils';
import { SummitLogo } from '../SummitLogo';
import { ShieldCheck, Award } from 'lucide-react';

interface DocumentOfficialFooterProps {
  gerenciaNombre?: string;
  codigoDocumento?: string;
  className?: string;
}

export const DocumentOfficialFooter: React.FC<DocumentOfficialFooterProps> = ({
  gerenciaNombre = 'Gerencias Institucionales',
  codigoDocumento,
  className = '',
}) => {
  return (
    <div className={`w-full mt-6 pt-4 border-t border-slate-200 bg-slate-50/80 rounded-xl p-4 text-xs text-slate-600 ${className}`}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        
        {/* Logo y Certificación */}
        <div className="flex items-center gap-3">
          <SummitLogo variant="icon" size={32} />
          <div>
            <div className="font-black text-slate-900 flex items-center gap-1.5 justify-center sm:justify-start">
              <span>{SUMMIT_BRANDING.nombreOficial}</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
            </div>
            <div className="text-[11px] font-semibold text-blue-700 italic">
              "{SUMMIT_BRANDING.lema}"
            </div>
          </div>
        </div>

        {/* Datos de Validez */}
        <div className="text-center sm:text-right text-[11px] text-slate-500">
          <div>
            RTN: <strong className="text-slate-800">{SUMMIT_BRANDING.rtn}</strong> • {SUMMIT_BRANDING.ciudad}, {SUMMIT_BRANDING.pais}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Gobernanza POA 2026 • {gerenciaNombre} • {codigoDocumento || 'Certificado Oficial Digital'}
          </div>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1.5">
        <Award className="w-3 h-3 text-amber-500 shrink-0" />
        <span>
          Documento oficial y formal de Summit Impulsa Global, S.A. de C.V. Su emisión garantiza respaldo pedagógico, fiscal (SAR) y gobernanza directiva inter-gerencial.
        </span>
      </div>
    </div>
  );
};
