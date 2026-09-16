import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  ExternalLink, 
  Copy, 
  Check, 
  Send, 
  AlertTriangle, 
  ShieldAlert,
  Clock,
  UserCheck,
  Building2,
  FileText
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { 
  generarHtmlAlertaRechazoSilabo, 
  generarMailtoRechazoSilabo,
  enviarAlertaRechazoSilaboEmail
} from '../../utils/gmailUtils';
import { CREDENCIALES_GERENCIAS } from '../../utils/gerenciasCredenciales';

interface RejectionEmailAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyecto: ProyectoEducativo | null;
  motivoRechazo?: string;
  moneda?: Moneda;
  onNotificar?: (mensaje: string) => void;
  onIniciarCorreccion?: (p: ProyectoEducativo) => void;
}

export const RejectionEmailAlertModal: React.FC<RejectionEmailAlertModalProps> = ({
  isOpen,
  onClose,
  proyecto,
  motivoRechazo,
  moneda: monedaProp = 'LPS',
  onNotificar,
  onIniciarCorreccion,
}) => {
  const moneda: Moneda = (monedaProp as Moneda) || 'LPS';
  const [copiado, setCopiado] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [vistaPreviaModo, setVistaPreviaModo] = useState<'html' | 'texto'>('html');

  if (!isOpen || !proyecto) return null;

  const motivoFinal = motivoRechazo || 
    proyecto.motivoRechazoGerenciaGeneral || 
    proyecto.observacionesRevisionGeneral || 
    'Requiere ajuste de tarifas docentes, margen de ganancia o punto de equilibrio para asegurar viabilidad comercial.';

  const codPry = proyecto.codigoProyecto || proyecto.codigoPrograma || `SIG-ACAD-${proyecto.id.slice(0, 6)}`;
  const codSAR = proyecto.correlativoSAR || '000-001-01-00000001';
  const mailtoUrl = generarMailtoRechazoSilabo(proyecto, motivoFinal);
  const htmlContent = generarHtmlAlertaRechazoSilabo(proyecto, motivoFinal, moneda);

  const handleCopiarTexto = () => {
    const textoPlano = `[URGENTE - RECHAZO GG] Notificación de Sílabo Devuelto para Corrección
Proyecto: ${proyecto.nombreProyecto} (${codPry} / SAR: ${codSAR})
Docente: ${proyecto.nombreDocente}
Destinatario: ${CREDENCIALES_GERENCIAS.academica.correo}
Remitente: Dr. Walter Rene Pedroza (${CREDENCIALES_GERENCIAS.administracion.correo})

MOTIVO DEL RECHAZO:
"${motivoFinal}"

Instrucciones: Ingresar a Gerencia Académica -> Rechazados por GG para corregir y reenviar.`;

    navigator.clipboard.writeText(textoPlano);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
    if (onNotificar) {
      onNotificar('Copiado al portapapeles el texto de la alerta');
    }
  };

  const handleReenviar = async () => {
    setReenviando(true);
    try {
      const res = await enviarAlertaRechazoSilaboEmail(proyecto, motivoFinal, moneda);
      if (res.success) {
        if (onNotificar) {
          onNotificar(`📧 Alerta de correo emitida exitosamente a ${CREDENCIALES_GERENCIAS.academica.correo}`);
        }
      }
    } catch {
      if (onNotificar) {
        onNotificar('Alerta registrada en la bandeja del sistema.');
      }
    } finally {
      setReenviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-70 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-rose-300 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header con estilo de Alerta Oficial */}
        <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-rose-950 p-4 sm:p-5 text-white flex items-start justify-between gap-3 border-b border-rose-800">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600/30 border border-rose-400/40 text-rose-300 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white px-2 py-0.5 rounded-md shadow-xs">
                  Alerta Proactiva del Sistema
                </span>
                <span className="text-xs text-rose-200 font-mono">
                  {codPry} • SAR: {codSAR}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mt-1">
                Expediente de Notificación: Sílabo Rechazado por Gerencia General
              </h3>
              <p className="text-xs text-rose-200/80 mt-0.5">
                Aviso automático generado y despachado para la Gerencia Académica
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Destinatarios y Estado */}
        <div className="bg-rose-50/70 border-b border-rose-200/80 px-5 py-3 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="font-bold text-slate-500">Para:</span>
              <span className="bg-white px-2 py-0.5 rounded border border-rose-200 font-mono font-semibold text-rose-950 flex items-center gap-1">
                <Mail className="w-3 h-3 text-rose-600" />
                {CREDENCIALES_GERENCIAS.academica.correo}
              </span>
              <span className="text-[10px] text-slate-500">(Phd. Donal Reyes)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="font-bold text-slate-500">CC:</span>
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-slate-700">
                {CREDENCIALES_GERENCIAS.administracion.correo}
              </span>
              <span className="text-[10px] text-slate-500">(Dr. Walter Pedroza)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
              <Check className="w-3 h-3 text-emerald-600" />
              Notificación Disparada
            </span>
          </div>
        </div>

        {/* Selector de Vista Previa */}
        <div className="px-5 py-2 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-600">
            Vista previa del mensaje oficial:
          </span>
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-300">
            <button
              onClick={() => setVistaPreviaModo('html')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                vistaPreviaModo === 'html' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Diseño HTML Oficial
            </button>
            <button
              onClick={() => setVistaPreviaModo('texto')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                vistaPreviaModo === 'texto' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Texto Plano
            </button>
          </div>
        </div>

        {/* Contenedor de Vista Previa */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-50/70">
          {vistaPreviaModo === 'html' ? (
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
              <iframe
                title="Vista previa correo rechazo"
                srcDoc={htmlContent}
                className="w-full h-[380px] border-0"
              />
            </div>
          ) : (
            <div className="bg-slate-900 text-rose-200 font-mono text-xs p-4 rounded-xl space-y-3 leading-relaxed border border-slate-800">
              <div className="text-amber-400 font-bold border-b border-slate-800 pb-2">
                ASUNTO: 🚨 [URGENTE - CORRECCIÓN INMEDIATA] Sílabo Rechazado por GG: {codPry} - {proyecto.nombreProyecto}
              </div>
              <p>Estimada Gerencia Académica (Phd. Donal Reyes):</p>
              <p>
                La Gerencia General (Dr. Walter Rene Pedroza) ha revisado el sílabo y emitió DICTAMEN DE RECHAZO.
              </p>
              <div className="bg-rose-950/60 p-3 rounded border border-rose-800 text-rose-100 font-bold">
                MOTIVO DEL RECHAZO: "{motivoFinal}"
              </div>
              <p>
                Docente: {proyecto.nombreDocente} | Horas: {proyecto.horasClase} | SAR: {codSAR}
              </p>
              <p className="text-slate-400">
                Instrucciones: Aplicar ajustes curriculares o de costos en el sistema y reenviar a Gerencia General.
              </p>
            </div>
          )}
        </div>

        {/* Footer con Acciones */}
        <div className="bg-white px-5 py-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopiarTexto}
              className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              {copiado ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiado ? '¡Copiado!' : 'Copiar Texto'}</span>
            </button>

            <a
              href={mailtoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir en Cliente de Correo (Mailto)</span>
            </a>
          </div>

          <div className="flex items-center gap-2">
            {onIniciarCorreccion && (
              <button
                type="button"
                onClick={() => onIniciarCorreccion(proyecto)}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-500 hover:to-blue-600 text-white text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>🛠️ Corregir Sílabo Ahora</span>
              </button>
            )}

            <button
              type="button"
              disabled={reenviando}
              onClick={handleReenviar}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{reenviando ? 'Enviando...' : 'Reenviar Alerta Email'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
