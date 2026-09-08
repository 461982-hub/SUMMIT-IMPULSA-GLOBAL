import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  X, 
  Check, 
  Sparkles, 
  ExternalLink,
  GraduationCap,
  ShieldCheck,
  Star,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';
import { DocenteBanco } from '../../utils/docenteDirectoryUtils';
import { 
  descargarDocenteCvPdf, 
  obtenerDocenteCvPdfBlobUrl 
} from '../../utils/docenteCvPdfUtils';

interface DocenteCvPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  docente: DocenteBanco | null;
}

export const DocenteCvPdfModal: React.FC<DocenteCvPdfModalProps> = ({
  isOpen,
  onClose,
  docente,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [descargando, setDescargando] = useState(false);

  useEffect(() => {
    if (isOpen && docente) {
      if (docente.cvPdfDataUrl) {
        setBlobUrl(docente.cvPdfDataUrl);
      } else {
        const url = obtenerDocenteCvPdfBlobUrl(docente);
        setBlobUrl(url);
        return () => {
          if (url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        };
      }
    } else {
      setBlobUrl(null);
    }
  }, [isOpen, docente]);

  if (!isOpen || !docente) return null;

  const handleDescargar = () => {
    setDescargando(true);
    if (docente.cvPdfDataUrl) {
      // Descarga directa del PDF subido
      const link = document.createElement('a');
      link.href = docente.cvPdfDataUrl;
      link.download = docente.cvPdfNombre || `CV_${docente.nombre.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Descarga del CV oficial generado
      descargarDocenteCvPdf(docente);
    }
    setTimeout(() => setDescargando(false), 1200);
  };

  const handleImprimir = () => {
    if (blobUrl) {
      const win = window.open(blobUrl, '_blank');
      if (win) {
        win.focus();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-5xl h-[92vh] rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col">
        
        {/* Cabecera del Visor de CV en PDF */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-inner">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-blue-500/30 text-blue-200 rounded border border-blue-400/30">
                  {docente.cvPdfDataUrl ? 'CV Adjunto (PDF)' : 'CV Oficial Institucional (PDF)'}
                </span>
                {docente.cvPdfTamano && (
                  <span className="text-[10px] text-blue-300 font-mono">
                    {docente.cvPdfTamano}
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                <span>Curriculum Vitae: {docente.nombre}</span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-imprimir-cv-docente"
              onClick={handleImprimir}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border border-white/15 cursor-pointer"
              title="Abrir en pestaña nueva para imprimir"
            >
              <Printer className="w-3.5 h-3.5 text-blue-300" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              type="button"
              id="btn-descargar-cv-docente"
              onClick={handleDescargar}
              disabled={descargando}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Descargar archivo PDF del CV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{descargando ? 'Descargando...' : 'Descargar PDF'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Cerrar visor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Datos Rápidos del Docente */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-4 text-slate-700">
            <span className="font-bold flex items-center gap-1 text-blue-900">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              {docente.titulo || 'Docente Institucional'}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-600">
              Especialidad: <strong className="text-slate-800">{docente.especialidad}</strong>
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-700 font-mono font-bold">
              Tarifa: L. {docente.tarifaHoraSugerida}/hr
            </span>
            {docente.calificacionNPS && (
              <>
                <span className="text-slate-500">•</span>
                <span className="text-amber-700 font-bold flex items-center gap-0.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {docente.calificacionNPS}/5.0
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {docente.email && (
              <span className="text-slate-500 text-[11px] flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" /> {docente.email}
              </span>
            )}
            {docente.telefono && (
              <span className="text-slate-500 text-[11px] flex items-center gap-1 ml-2">
                <Phone className="w-3 h-3 text-slate-400" /> {docente.telefono}
              </span>
            )}
          </div>
        </div>

        {/* Visor PDF (Iframe con fallback) */}
        <div className="flex-1 bg-slate-200 relative overflow-hidden flex flex-col items-center justify-center">
          {blobUrl ? (
            <iframe
              src={`${blobUrl}#toolbar=1&navpanes=0`}
              className="w-full h-full border-0 bg-white"
              title={`CV PDF - ${docente.nombre}`}
            />
          ) : (
            <div className="text-center p-6 space-y-3">
              <FileText className="w-12 h-12 text-slate-400 mx-auto animate-pulse" />
              <p className="text-sm font-bold text-slate-700">Generando vista previa del CV en PDF...</p>
            </div>
          )}
        </div>

        {/* Barra de pie */}
        <div className="px-5 py-2.5 bg-slate-900 text-white flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-300 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Documento Oficial Certificado por Gerencia Académica • Summit Impulsa Global 2026</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer border border-white/15"
          >
            Cerrar Visor
          </button>
        </div>

      </div>
    </div>
  );
};
