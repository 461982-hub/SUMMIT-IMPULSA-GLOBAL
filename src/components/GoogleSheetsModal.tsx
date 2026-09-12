import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Download, 
  Layers, 
  ShieldCheck, 
  GraduationCap, 
  Megaphone, 
  Building2,
  Copy,
  Check
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../types';
import { formatearMoneda } from '../utils/calculations';
import { formatearHNL } from '../utils/poa2026Data';
import { 
  exportarProyectoAGoogleSheets, 
  exportarConsolidadoPOAApi, 
  ResultadoExportacionSheets 
} from '../services/googleSheetsService';
import { TARGET_DRIVE_FOLDER_URL } from '../services/googleDriveService';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyecto?: ProyectoEducativo | null;
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  proyecto,
  proyectos,
  moneda,
}) => {
  const [modo, setModo] = useState<'individual' | 'consolidado'>(proyecto ? 'individual' : 'consolidado');
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoExportacionSheets | null>(null);
  const [copiado, setCopiado] = useState(false);

  if (!isOpen) return null;

  const handleExportar = async () => {
    setCargando(true);
    setResultado(null);
    try {
      let res: ResultadoExportacionSheets;
      if (modo === 'individual' && proyecto) {
        res = await exportarProyectoAGoogleSheets(proyecto, moneda);
      } else {
        res = await exportarConsolidadoPOAApi(proyectos, moneda);
      }
      setResultado(res);
    } catch (err: any) {
      setResultado({
        success: false,
        error: err?.message || 'Error al comunicarse con Google Sheets API',
      });
    } finally {
      setCargando(false);
    }
  };

  const handleCopiarEnlace = () => {
    if (resultado?.spreadsheetUrl) {
      navigator.clipboard.writeText(resultado.spreadsheetUrl);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Encabezado Google Sheets */}
        <div className="bg-emerald-950 px-6 py-4 flex items-center justify-between text-white border-b border-emerald-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight flex items-center gap-1.5">
                <span>Integración Google Sheets API</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  POA 2026
                </span>
              </h3>
              <p className="text-[11px] text-emerald-300/80">
                Exportación en vivo a hojas de cálculo oficiales de Google
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-400 hover:text-white p-1 rounded-lg hover:bg-emerald-900/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          
          {/* Selector de modo si hay un proyecto activo */}
          {proyecto && (
            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => { setModo('individual'); setResultado(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  modo === 'individual'
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ficha del Proyecto Actual
              </button>
              <button
                type="button"
                onClick={() => { setModo('consolidado'); setResultado(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  modo === 'consolidado'
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Consolidado POA 2026 ({proyectos.length} Proyectos)
              </button>
            </div>
          )}

          {/* Resumen del contenido a exportar */}
          {modo === 'individual' && proyecto ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-slate-500">
                  Proyecto a exportar
                </span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                  proyecto.aprobacionFinalGerenciaGeneral 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {proyecto.aprobacionFinalGerenciaGeneral ? '✅ Rebajado POA 2026' : '⏳ En Proceso de Flujo'}
                </span>
              </div>
              <div className="text-sm font-bold text-slate-900">
                {proyecto.nombreProyecto}
              </div>
              <div className="text-xs text-slate-600 font-mono">
                Código: {proyecto.codigoFiscalSAR || proyecto.codigoPrograma || proyecto.id} • Docente: {proyecto.nombreDocente}
              </div>
              <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400">Ingreso Real: </span>
                  <strong className="text-slate-900">{formatearMoneda(proyecto.ingresoRealTotal || 0, moneda)}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Matrícula: </span>
                  <strong className="text-slate-900">{proyecto.alumnosFinal || 0} alumnos</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-slate-500">
                  Cartera Consolidada
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                  {proyectos.length} Proyectos (Sep - Dic 2026)
                </span>
              </div>
              <div className="text-sm font-bold text-slate-900">
                Tablero de Control POA SEP - DIC 2026
              </div>
              <p className="text-xs text-slate-600">
                Generará una hoja con el resumen de deducción mensual por mes (Septiembre a Diciembre 2026) y la matriz completa de proyectos con trazabilidad inter-gerencial.
              </p>
            </div>
          )}

          {/* Explicación de las 4 Pestañas en Sheets */}
          <div className="bg-emerald-50/50 border border-emerald-200/70 rounded-xl p-3 text-xs text-emerald-950 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-emerald-900">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              Estructura sincronizada en Google Sheets:
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-emerald-800 pl-1">
              <li><strong>Paso 1 (Académica):</strong> Estructura curricular, temas y cuerpo docente.</li>
              <li><strong>Paso 2 (Comercial):</strong> Canales, precios, descuentos y lista de matriculados.</li>
              <li><strong>Paso 3 (General):</strong> Dictamen oficial y deducción formal del POA 2026.</li>
            </ul>
          </div>

          {/* Resultado de la exportación */}
          {resultado && (
            <div className={`p-4 rounded-xl border ${
              resultado.success 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}>
              {resultado.success ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-sm">
                        ¡Hoja de cálculo generada con éxito en Google Sheets!
                      </div>
                      <div className="text-xs text-emerald-700 mt-0.5">
                        Archivo: <strong>{resultado.titulo}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      href={resultado.spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir en Google Sheets</span>
                    </a>

                    <button
                      type="button"
                      onClick={handleCopiarEnlace}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100/50 text-emerald-900 rounded-lg text-xs font-semibold transition-colors"
                    >
                      {copiado ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiado ? 'Enlace copiado' : 'Copiar enlace'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">No se pudo exportar a Google Sheets:</span>
                    <p className="mt-0.5 text-rose-800">{resultado.error}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <a
              href={TARGET_DRIVE_FOLDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-slate-500 hover:text-emerald-700 underline flex items-center gap-1"
            >
              <span>Carpeta oficial en Google Drive</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={handleExportar}
                disabled={cargando}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                {cargando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Conectando con Sheets API...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>{resultado?.success ? 'Volver a Generar' : 'Crear en Google Sheets'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
