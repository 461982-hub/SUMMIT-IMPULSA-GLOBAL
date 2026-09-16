import React, { useEffect } from 'react';
import { 
  Bell, 
  X, 
  ArrowRight, 
  Megaphone, 
  Building2, 
  GraduationCap, 
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Mail,
  Wrench
} from 'lucide-react';
import { NotificacionGerencia, VistaPrincipal } from '../types';

interface NotificationBannerToastProps {
  notificacion: NotificacionGerencia | null;
  onCerrar: () => void;
  onEjecutarAccion: (vista: VistaPrincipal, proyectoId?: string) => void;
}

export const NotificationBannerToast: React.FC<NotificationBannerToastProps> = ({
  notificacion,
  onCerrar,
  onEjecutarAccion,
}) => {
  useEffect(() => {
    if (!notificacion) return;
    // Las alertas urgentes de rechazo permanecen un poco más (16s) para que no se pierdan
    const duracion = (notificacion.tipo === 'retorno_gg_a_academica' || notificacion.tipo === 'silabo_rechazado_gg') ? 16000 : 12000;
    const timer = setTimeout(() => {
      onCerrar();
    }, duracion);
    return () => clearTimeout(timer);
  }, [notificacion, onCerrar]);

  if (!notificacion) return null;

  const esRechazoUrgente = 
    notificacion.tipo === 'retorno_gg_a_academica' || 
    notificacion.tipo === 'silabo_rechazado_gg';

  const getTema = () => {
    if (esRechazoUrgente) {
      return {
        bg: 'bg-rose-950/98 text-white border-rose-500 shadow-2xl ring-4 ring-rose-500/25',
        badgeBg: 'bg-rose-600 text-white font-black',
        btnBg: 'bg-rose-500 hover:bg-rose-400 text-white font-black shadow-lg shadow-rose-950/50',
        icono: <AlertOctagon className="w-5 h-5 text-rose-300 animate-pulse" />,
        destinoTexto: '🚨 Gerencia Académica — ¡Corrección Requerida!',
        pingColor: 'bg-rose-400',
      };
    }

    switch (notificacion.gerenciaDestino) {
      case 'gerencia-comercializacion':
        return {
          bg: 'bg-emerald-950/95 text-white border-emerald-700',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          btnBg: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black',
          icono: <Megaphone className="w-5 h-5 text-emerald-400" />,
          destinoTexto: 'Gerencia de Comercialización',
          pingColor: 'bg-emerald-400',
        };
      case 'gerencia-general':
        return {
          bg: 'bg-slate-950/95 text-white border-purple-700',
          badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          btnBg: 'bg-purple-500 hover:bg-purple-400 text-slate-950 font-black',
          icono: <Building2 className="w-5 h-5 text-purple-400" />,
          destinoTexto: 'Gerencia General (Dirección)',
          pingColor: 'bg-purple-400',
        };
      case 'gerencia-academica':
        return {
          bg: 'bg-slate-900/95 text-white border-indigo-500',
          badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
          btnBg: 'bg-indigo-500 hover:bg-indigo-400 text-white font-black',
          icono: <GraduationCap className="w-5 h-5 text-indigo-400" />,
          destinoTexto: 'Gerencia Académica',
          pingColor: 'bg-indigo-400',
        };
      default:
        return {
          bg: 'bg-slate-900/95 text-white border-blue-600',
          badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          btnBg: 'bg-blue-500 hover:bg-blue-400 text-white font-black',
          icono: <Bell className="w-5 h-5 text-blue-400" />,
          destinoTexto: 'Notificación del Sistema',
          pingColor: 'bg-blue-400',
        };
    }
  };

  const tema = getTema();

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-60 max-w-md w-full animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className={`rounded-2xl p-4 shadow-2xl border backdrop-blur-md ${tema.bg} space-y-3`}>
        
        {/* Header con Badge de Gerencia Destino */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 shrink-0">
              {tema.icono}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${tema.badgeBg}`}>
                  {tema.destinoTexto}
                </span>
                <span className={`w-2 h-2 rounded-full ${tema.pingColor} animate-ping`}></span>
              </div>
              <h4 className="text-xs font-bold mt-1 text-slate-100 line-clamp-1">
                {notificacion.titulo}
              </h4>
            </div>
          </div>

          <button
            onClick={onCerrar}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            title="Cerrar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mensaje descriptivo */}
        <p className="text-xs text-slate-300 ml-1 leading-relaxed">
          {notificacion.mensaje}
        </p>

        {/* Aviso de correo electrónico automático */}
        {esRechazoUrgente && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-900/60 border border-rose-700/60 text-[11px] text-rose-200">
            <Mail className="w-3.5 h-3.5 text-rose-300 shrink-0" />
            <span>Alerta por correo enviada a: <strong className="font-mono text-white">academia.summitg@gmail.com</strong></span>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={onCerrar}
            className="text-xs text-slate-400 hover:text-slate-200 underline font-medium px-2 py-1"
          >
            Entendido
          </button>

          {notificacion.accion && (
            <button
              type="button"
              onClick={() => {
                onCerrar();
                onEjecutarAccion(notificacion.accion!.vistaDestino, notificacion.accion!.proyectoId);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs shadow-lg transition-transform active:scale-95 ${tema.btnBg}`}
            >
              {esRechazoUrgente ? <Wrench className="w-3.5 h-3.5" /> : null}
              <span>{notificacion.accion.etiqueta}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
