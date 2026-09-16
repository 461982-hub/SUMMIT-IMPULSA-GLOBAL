import React, { useState } from 'react';
import { 
  AlertOctagon, 
  XCircle, 
  Wrench, 
  Mail, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  Clock, 
  User, 
  FileText,
  ExternalLink,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { formatearMoneda } from '../../utils/calculations';
import { CREDENCIALES_GERENCIAS } from '../../utils/gerenciasCredenciales';

interface AcademicUrgentRejectionBannerProps {
  proyectosRechazados: ProyectoEducativo[];
  moneda: Moneda;
  onCorregirProyecto: (p: ProyectoEducativo) => void;
  onVerEmailAlerta: (p: ProyectoEducativo) => void;
  onIrABandejaRechazados: () => void;
}

export const AcademicUrgentRejectionBanner: React.FC<AcademicUrgentRejectionBannerProps> = ({
  proyectosRechazados,
  moneda,
  onCorregirProyecto,
  onVerEmailAlerta,
  onIrABandejaRechazados,
}) => {
  const [colapsado, setColapsado] = useState(false);

  if (proyectosRechazados.length === 0) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-r from-rose-950 via-slate-900 to-rose-900 border-2 border-rose-500/80 shadow-xl overflow-hidden animate-in slide-in-from-top-3 duration-300 ring-4 ring-rose-500/10">
      {/* Header del Banner */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white border-b border-rose-800/60">
        <div className="flex items-start sm:items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-rose-600 border border-rose-400 flex items-center justify-center text-white shrink-0 shadow-md">
              <AlertOctagon className="w-6 h-6 animate-pulse" />
            </div>
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-400 rounded-full animate-ping"></span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-widest bg-rose-600 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                🚨 ALERTA PROACTIVA DEL SISTEMA
              </span>
              <span className="text-[11px] font-bold text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded-md border border-rose-800 font-mono">
                {proyectosRechazados.length} Sílabo{proyectosRechazados.length > 1 ? 's' : ''} Devuelto{proyectosRechazados.length > 1 ? 's' : ''} para Corrección Inmediata
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-white mt-1">
              Atención Urgente Gerencia Académica (Phd. Donal Reyes)
            </h3>
            <p className="text-xs text-rose-200/90 mt-0.5 max-w-2xl">
              La Gerencia General (Dr. Walter Rene Pedroza) ha devuelto expedientes con observaciones que requieren ajuste presupuestario o curricular antes de ser trasladados a Comercialización.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={onIrABandejaRechazados}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Ver Bandeja Completa</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setColapsado(!colapsado)}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs transition-colors cursor-pointer"
            title={colapsado ? 'Expandir alerta' : 'Minimizar alerta'}
          >
            {colapsado ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Contenido Desplegable con los Sílabos Rechazados */}
      {!colapsado && (
        <div className="p-4 sm:p-5 bg-slate-950/40 space-y-3.5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {proyectosRechazados.map((p) => {
              const codEmpresa = p.codigoProyecto || p.codigoPrograma || `SIG-ACAD-${p.id.slice(0, 6)}`;
              const codSAR = p.correlativoSAR || '000-001-01-00000001';
              const motivoRechazo = p.motivoRechazoGerenciaGeneral || p.observacionesRevisionGeneral || 'Se identificaron inconsistencias presupuestarias o de carga horaria.';
              const fechaRechazo = p.fechaRechazoGerenciaGeneral 
                ? new Date(p.fechaRechazoGerenciaGeneral).toLocaleString('es-HN') 
                : p.fechaModificacion || 'Reciente';

              return (
                <div
                  key={p.id}
                  className="bg-slate-900/90 border border-rose-500/40 rounded-xl p-3.5 sm:p-4 space-y-3 text-white hover:border-rose-400 transition-all shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-bold bg-rose-500/30 text-rose-200 border border-rose-400/40 px-2 py-0.5 rounded">
                          {codEmpresa}
                        </span>
                        <span className="text-[10px] font-mono bg-white/10 text-slate-300 px-1.5 py-0.5 rounded">
                          SAR: {codSAR}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-black text-white mt-1 line-clamp-1">
                        {p.nombreProyecto}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Docente: <strong className="text-slate-200">{p.nombreDocente || 'Por asignar'}</strong> • Horas: <strong className="text-slate-200">{p.horasClase || 0} hrs</strong>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-rose-300 block font-mono">
                        {fechaRechazo}
                      </span>
                    </div>
                  </div>

                  {/* Caja de Dictamen / Motivo del Rechazo */}
                  <div className="bg-rose-950/70 border border-rose-600/50 rounded-lg p-2.5 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-rose-400 shrink-0" />
                      Dictamen & Motivo de Rechazo (Dr. Walter Rene Pedroza):
                    </span>
                    <p className="text-xs text-rose-100 italic line-clamp-3 leading-snug">
                      "{motivoRechazo}"
                    </p>
                  </div>

                  {/* Estado de Alerta por Correo y Botones de Acción */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 border-t border-white/10">
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 bg-emerald-950/50 border border-emerald-500/30 px-2 py-1 rounded-md">
                      <Mail className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Alerta emitida a: <strong className="font-mono">{CREDENCIALES_GERENCIAS.academica.correo}</strong></span>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => onVerEmailAlerta(p)}
                        className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Ver detalle del correo electrónico institucional enviado"
                      >
                        <Mail className="w-3 h-3" />
                        <span>Ver Correo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onCorregirProyecto(p)}
                        className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white text-xs font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Abrir formulario del sílabo para corregir los costos o contenidos y reenviar a Gerencia General"
                      >
                        <Wrench className="w-3.5 h-3.5 text-white" />
                        <span>🛠️ Corregir Sílabo Ahora</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
