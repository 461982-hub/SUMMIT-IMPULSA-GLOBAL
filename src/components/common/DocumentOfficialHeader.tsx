import React from 'react';
import { SummitLogo } from '../SummitLogo';
import { SUMMIT_BRANDING, resolverDatosGerencia, ClaveGerencia } from '../../utils/brandingUtils';
import { ShieldCheck } from 'lucide-react';

interface DocumentOfficialHeaderProps {
  gerencia?: string | ClaveGerencia;
  tituloDocumento: string;
  subtituloDocumento?: string;
  folioCorrelativo?: string;
  codigoDocumento?: string;
  fechaEmision?: string;
  estadoValidez?: string;
  compact?: boolean;
  className?: string;
}

export const DocumentOfficialHeader: React.FC<DocumentOfficialHeaderProps> = ({
  gerencia = 'general',
  tituloDocumento,
  subtituloDocumento,
  folioCorrelativo,
  codigoDocumento,
  fechaEmision,
  estadoValidez = 'OFICIAL CERTIFICADO',
  compact = false,
  className = '',
}) => {
  const gerenciaData = resolverDatosGerencia(gerencia);
  const fecha = fechaEmision || new Date().toLocaleDateString('es-HN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className={`w-full overflow-hidden rounded-2xl border border-slate-200 shadow-xs bg-white ${className}`}>
      {/* Barra superior institucional Navy con acento */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-4 sm:p-5 relative">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          {/* Logo y Razón Social */}
          <div className="flex items-center gap-3.5">
            <div className="shrink-0 bg-slate-900/80 p-2 rounded-2xl border border-slate-700/60 shadow-inner">
              <SummitLogo variant="icon" size={compact ? 44 : 52} />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black tracking-tight text-white uppercase">
                  {SUMMIT_BRANDING.nombreOficial}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  {estadoValidez}
                </span>
              </div>
              
              {/* Lema Oficial Obligatorio */}
              <p className="text-xs font-semibold text-amber-300 italic tracking-wide mt-0.5">
                "{SUMMIT_BRANDING.lema}"
              </p>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-300 mt-1">
                <span>RTN: <strong className="text-white">{SUMMIT_BRANDING.rtn}</strong></span>
                <span>•</span>
                <span>{SUMMIT_BRANDING.ciudad}, {SUMMIT_BRANDING.pais}</span>
                <span>•</span>
                <span className="text-indigo-200 font-medium">{SUMMIT_BRANDING.sistema}</span>
              </div>
            </div>
          </div>

          {/* Gerencia Titular y Metadatos de Emisión */}
          <div className="text-left md:text-right border-t md:border-t-0 pt-2 md:pt-0 border-slate-800 w-full md:w-auto">
            <div 
              className="inline-block px-2.5 py-1 rounded-lg text-xs font-black tracking-wider uppercase mb-1 shadow-xs"
              style={{ backgroundColor: `${gerenciaData.colorHex}33`, color: '#93C5FD', border: `1px solid ${gerenciaData.colorHex}66` }}
            >
              {gerenciaData.nombre}
            </div>
            <div className="text-xs text-slate-200 font-bold">
              {gerenciaData.titular}
            </div>
            <div className="text-[11px] text-slate-400">
              {gerenciaData.cargo}
            </div>
            <div className="text-[10px] font-mono text-amber-300 mt-1">
              {codigoDocumento || (folioCorrelativo ? `FOLIO: ${folioCorrelativo}` : 'POA-2026-OFICIAL')} • {fecha}
            </div>
          </div>

        </div>
      </div>

      {/* Franja de Color de Gerencia y Título del Documento */}
      <div 
        className="px-5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-white text-xs font-bold"
        style={{ backgroundColor: gerenciaData.colorHex }}
      >
        <div className="flex items-center gap-2 tracking-wide uppercase">
          <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-black">
            DOCUMENTO INSTITUCIONAL
          </span>
          <span className="text-sm font-black">{tituloDocumento}</span>
        </div>
        {subtituloDocumento && (
          <div className="text-white/90 text-xs font-medium">
            {subtituloDocumento}
          </div>
        )}
      </div>
    </div>
  );
};
