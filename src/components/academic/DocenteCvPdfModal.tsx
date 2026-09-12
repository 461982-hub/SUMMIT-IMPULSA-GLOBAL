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
  // Modo de vista: 'planilla' (Planilla oficial de la empresa) o 'original' (PDF cargado)
  const [modoVista, setModoVista] = useState<'planilla' | 'original'>('planilla');
  const [urlPlanillaEmpresa, setUrlPlanillaEmpresa] = useState<string | null>(null);
  const [descargando, setDescargando] = useState(false);

  useEffect(() => {
    if (isOpen && docente) {
      // Siempre generar la Planilla Oficial de la Empresa con el formato institucional
      const url = obtenerDocenteCvPdfBlobUrl(docente);
      setUrlPlanillaEmpresa(url);
      setModoVista('planilla'); // Por defecto siempre mostrar la planilla de la empresa

      return () => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      };
    } else {
      setUrlPlanillaEmpresa(null);
    }
  }, [isOpen, docente]);

  if (!isOpen || !docente) return null;

  const tienePdfCargado = Boolean(docente.cvPdfDataUrl);
  const urlActual = (modoVista === 'original' && tienePdfCargado && docente.cvPdfDataUrl)
    ? docente.cvPdfDataUrl
    : urlPlanillaEmpresa;

  const handleDescargarPlanilla = () => {
    setDescargando(true);
    descargarDocenteCvPdf(docente);
    setTimeout(() => setDescargando(false), 1200);
  };

  const handleDescargarOriginal = () => {
    if (docente.cvPdfDataUrl) {
      const link = document.createElement('a');
      link.href = docente.cvPdfDataUrl;
      link.download = docente.cvPdfNombre || `CV_Original_${docente.nombre.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleImprimir = () => {
    if (urlActual) {
      const win = window.open(urlActual, '_blank');
      if (win) {
        win.focus();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-5xl h-[92vh] rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col">
        
        {/* Cabecera del Visor de CV en PDF con Planilla de la Empresa */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-inner shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-500/30 text-emerald-200 rounded border border-emerald-400/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Planilla Oficial de la Empresa</span>
                </span>
                {tienePdfCargado && (
                  <span className="text-[10px] font-bold text-blue-200 bg-blue-500/25 px-2 py-0.5 rounded border border-blue-400/20 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>CV Adjunto: {docente.cvPdfNombre} ({docente.cvPdfTamano || 'PDF'})</span>
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 mt-0.5">
                <span>Curriculum Vitae: {docente.nombre}</span>
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {tienePdfCargado && (
              <button
                type="button"
                id="btn-descargar-cv-original"
                onClick={handleDescargarOriginal}
                className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/15 cursor-pointer"
                title="Descargar archivo PDF original adjunto"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">CV Original</span>
              </button>
            )}

            <button
              type="button"
              id="btn-imprimir-cv-docente"
              onClick={handleImprimir}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border border-white/15 cursor-pointer"
              title="Abrir en pestaña nueva para imprimir"
            >
              <Printer className="w-3.5 h-3.5 text-blue-300" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              type="button"
              id="btn-descargar-cv-docente"
              onClick={handleDescargarPlanilla}
              disabled={descargando}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Descargar PDF con la planilla institucional de la empresa"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{descargando ? 'Generando...' : 'Descargar Planilla (.PDF)'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer ml-1"
              title="Cerrar visor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pestañas de Cambio de Vista cuando hay archivo cargado */}
        {tienePdfCargado && (
          <div className="bg-slate-800 text-white px-5 py-1.5 flex items-center justify-between border-b border-slate-700 text-xs shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-semibold hidden sm:inline">
                Formato de Visualización:
              </span>
              <div className="inline-flex rounded-lg bg-slate-900/90 p-0.5 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setModoVista('planilla')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    modoVista === 'planilla'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Planilla Oficial de la Empresa (Membretada)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModoVista('original')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    modoVista === 'original'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3 h-3 text-blue-300" />
                  <span>Archivo Original Adjunto</span>
                </button>
              </div>
            </div>

            <div className="text-[11px] text-emerald-400 font-medium hidden md:flex items-center gap-1">
              <Check className="w-3 h-3" />
              <span>Homologado con Planilla Summit Impulsa Global</span>
            </div>
          </div>
        )}

        {/* Barra de Datos Rápidos del Docente */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-4 text-slate-700">
            <span className="font-bold flex items-center gap-1 text-blue-900">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              {docente.clasificacion || docente.titulo || 'Docente Institucional'}
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
          {urlActual ? (
            <iframe
              key={`${modoVista}-${docente.id}`}
              src={`${urlActual}#toolbar=1&navpanes=0`}
              className="w-full h-full border-0 bg-white"
              title={`CV PDF - ${docente.nombre}`}
            />
          ) : (
            <div className="text-center p-6 space-y-3">
              <FileText className="w-12 h-12 text-slate-400 mx-auto animate-pulse" />
              <p className="text-sm font-bold text-slate-700">Generando Planilla Oficial de la Empresa en PDF...</p>
            </div>
          )}
        </div>

        {/* Barra de pie */}
        <div className="px-5 py-2.5 bg-slate-900 text-white flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-300 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Planilla Certificada por Gerencia de Academia y Formación • Summit Impulsa Global, S.A. de C.V.</span>
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
