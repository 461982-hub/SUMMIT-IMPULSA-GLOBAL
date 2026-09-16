import React, { useState } from 'react';
import { 
  Bell, 
  X, 
  CheckCheck, 
  Megaphone, 
  Building2, 
  GraduationCap, 
  Clock, 
  ArrowRight, 
  Trash2, 
  Sparkles,
  ExternalLink,
  Info,
  AlertOctagon,
  Wrench,
  Mail,
  BellRing,
  Settings
} from 'lucide-react';
import { NotificacionGerencia, VistaPrincipal } from '../types';
import { obtenerConfiguracionWebPush, obtenerEstadoPermiso } from '../services/webPushService';

interface NotificationsCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notificaciones: NotificacionGerencia[];
  onMarcarLeida: (id: string) => void;
  onMarcarTodasLeidas: () => void;
  onLimpiarNotificaciones: () => void;
  onEjecutarAccion: (vista: VistaPrincipal, proyectoId?: string) => void;
  onAbrirConfigWebPush?: () => void;
}

export const NotificationsCenterModal: React.FC<NotificationsCenterModalProps> = ({
  isOpen,
  onClose,
  notificaciones,
  onMarcarLeida,
  onMarcarTodasLeidas,
  onLimpiarNotificaciones,
  onEjecutarAccion,
  onAbrirConfigWebPush,
}) => {
  const [filtro, setFiltro] = useState<'todas' | 'no_leidas' | 'rechazos' | 'comercial' | 'general' | 'academica'>('todas');
  const webPushConfig = obtenerConfiguracionWebPush();
  const permisoNavegador = obtenerEstadoPermiso();

  if (!isOpen) return null;

  const noLeidasCount = notificaciones.filter((n) => !n.leida).length;
  const rechazosCount = notificaciones.filter(
    (n) => n.tipo === 'retorno_gg_a_academica' || n.tipo === 'silabo_rechazado_gg'
  ).length;

  const notificacionesFiltradas = notificaciones.filter((n) => {
    if (filtro === 'no_leidas') return !n.leida;
    if (filtro === 'rechazos') {
      return n.tipo === 'retorno_gg_a_academica' || n.tipo === 'silabo_rechazado_gg';
    }
    if (filtro === 'comercial') return n.gerenciaDestino === 'gerencia-comercializacion';
    if (filtro === 'general') return n.gerenciaDestino === 'gerencia-general';
    if (filtro === 'academica') return n.gerenciaDestino === 'gerencia-academica';
    return true;
  });

  const getIconoOrigen = (origen: NotificacionGerencia['gerenciaOrigen'], tipo?: string) => {
    if (tipo === 'retorno_gg_a_academica' || tipo === 'silabo_rechazado_gg') {
      return <AlertOctagon className="w-4 h-4 text-rose-600" />;
    }
    switch (origen) {
      case 'gerencia-academica':
        return <GraduationCap className="w-4 h-4 text-blue-600" />;
      case 'gerencia-comercializacion':
        return <Megaphone className="w-4 h-4 text-emerald-600" />;
      case 'gerencia-general':
        return <Building2 className="w-4 h-4 text-purple-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-600" />;
    }
  };

  const getEtiquetaOrigen = (origen: NotificacionGerencia['gerenciaOrigen']) => {
    switch (origen) {
      case 'gerencia-academica':
        return 'G. Académica';
      case 'gerencia-comercializacion':
        return 'G. Comercial';
      case 'gerencia-general':
        return 'G. General';
      default:
        return 'Sistema';
    }
  };

  const getEtiquetaDestino = (destino: NotificacionGerencia['gerenciaDestino']) => {
    switch (destino) {
      case 'gerencia-comercializacion':
        return 'G. Comercial';
      case 'gerencia-general':
        return 'G. General';
      case 'gerencia-academica':
        return 'G. Académica';
      default:
        return 'Todas';
    }
  };

  const formatearFechaHora = (fechaIso: string) => {
    try {
      const fecha = new Date(fechaIso);
      return fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' • ' + fecha.toLocaleDateString();
    } catch {
      return fechaIso;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del Centro de Notificaciones */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center relative">
              <Bell className="w-4 h-4" />
              {noLeidasCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {noLeidasCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                Centro de Notificaciones Inter-Gerenciales
                {noLeidasCount > 0 && (
                  <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
                    {noLeidasCount} pendiente{noLeidasCount > 1 ? 's' : ''}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                Flujo de comunicación automatizado: Académica → Comercialización → Dirección General
              </p>
            </div>
          </div>

          <button
            id="btn-cerrar-notificaciones-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Notificaciones Web Push (Navegador y Segundo Plano) */}
        {onAbrirConfigWebPush && (
          <div className="px-5 py-2 bg-gradient-to-r from-blue-50/90 to-indigo-50/80 border-b border-blue-100 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <BellRing className="w-3 h-3" />
              </div>
              <span className="text-[11px] text-slate-700">
                Web Push API (Segundo Plano):{' '}
                <strong className={webPushConfig.habilitado && permisoNavegador === 'granted' ? 'text-emerald-700 font-extrabold' : 'text-slate-600'}>
                  {webPushConfig.habilitado && permisoNavegador === 'granted' ? '● Activo en este navegador' : '○ Inactivo / Configurar'}
                </strong>
              </span>
            </div>
            <button
              onClick={() => {
                onClose();
                onAbrirConfigWebPush();
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs transition-colors"
            >
              <Settings className="w-3 h-3 text-blue-600" />
              <span>Configurar Web Push</span>
            </button>
          </div>
        )}

        {/* Barra de Filtros y Acciones Globales */}
        <div className="px-5 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFiltro('todas')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                filtro === 'todas'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas ({notificaciones.length})
            </button>
            <button
              onClick={() => setFiltro('no_leidas')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                filtro === 'no_leidas'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              No leídas ({noLeidasCount})
            </button>
            <button
              onClick={() => setFiltro('rechazos')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 ${
                filtro === 'rechazos'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-rose-100 text-rose-900 hover:bg-rose-200 border border-rose-300'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
              <span>🚨 Rechazos GG ({rechazosCount})</span>
            </button>
            <button
              onClick={() => setFiltro('academica')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                filtro === 'academica'
                  ? 'bg-blue-700 text-white'
                  : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
              }`}
            >
              <GraduationCap className="w-3 h-3" />
              <span>G. Académica</span>
            </button>
            <button
              onClick={() => setFiltro('general')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                filtro === 'general'
                  ? 'bg-purple-700 text-white'
                  : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
              }`}
            >
              <Building2 className="w-3 h-3" />
              <span>G. General</span>
            </button>
            <button
              onClick={() => setFiltro('comercial')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                filtro === 'comercial'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <Megaphone className="w-3 h-3" />
              <span>G. Comercial</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {noLeidasCount > 0 && (
              <button
                onClick={onMarcarTodasLeidas}
                className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar todas leídas
              </button>
            )}
            {notificaciones.length > 0 && (
              <button
                onClick={onLimpiarNotificaciones}
                className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1"
                title="Borrar todo el historial"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Lista de Mensajes y Notificaciones */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50/50">
          {notificacionesFiltradas.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-700">No hay notificaciones en este filtro</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                Los avisos entre Gerencia Académica, Comercialización y Dirección General aparecerán automáticamente al registrar o trabajar proyectos.
              </p>
            </div>
          ) : (
            notificacionesFiltradas.map((notif) => {
              const esRechazo = notif.tipo === 'retorno_gg_a_academica' || notif.tipo === 'silabo_rechazado_gg';

              return (
                <div
                  key={notif.id}
                  onClick={() => !notif.leida && onMarcarLeida(notif.id)}
                  className={`p-3.5 rounded-xl border transition-all relative ${
                    esRechazo
                      ? notif.leida
                        ? 'bg-rose-50/40 border-rose-200 text-slate-800'
                        : 'bg-rose-50/90 border-rose-400 shadow-sm ring-1 ring-rose-300'
                      : notif.leida
                      ? 'bg-white border-slate-200/90 text-slate-700'
                      : 'bg-blue-50/70 border-blue-200/90 shadow-xs'
                  }`}
                >
                  {/* Header de la tarjeta */}
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg border shadow-2xs ${
                        esRechazo ? 'bg-rose-100 border-rose-300 text-rose-600' : 'bg-white border-slate-200'
                      }`}>
                        {getIconoOrigen(notif.gerenciaOrigen, notif.tipo)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {esRechazo ? (
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-rose-600 text-white shadow-2xs">
                              🚨 RETORNO PARA CORRECCIÓN INMEDIATA
                            </span>
                          ) : (
                            <span className="text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {getEtiquetaOrigen(notif.gerenciaOrigen)} → {getEtiquetaDestino(notif.gerenciaDestino)}
                            </span>
                          )}
                          {!notif.leida && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-rose-600 text-white animate-pulse">
                              Nuevo
                            </span>
                          )}
                        </div>
                        <h4 className={`text-xs font-bold mt-0.5 ${esRechazo ? 'text-rose-950 font-black' : 'text-slate-900'}`}>
                          {notif.titulo}
                        </h4>
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatearFechaHora(notif.fecha)}
                    </span>
                  </div>

                  {/* Mensaje de la notificación */}
                  <p className="text-xs text-slate-600 ml-8 leading-relaxed">
                    {notif.mensaje}
                  </p>

                  {/* Indicador de correo en alertas de rechazo */}
                  {esRechazo && (
                    <div className="ml-8 mt-2 flex items-center gap-1.5 text-[11px] text-rose-800 bg-rose-100/80 px-2.5 py-1 rounded-md border border-rose-300">
                      <Mail className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Alerta despachada a: <strong className="font-mono text-rose-950">academia.summitg@gmail.com</strong></span>
                    </div>
                  )}

                  {/* Botón de acción si aplica */}
                  {notif.accion && (
                    <div className="mt-3 ml-8 flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarcarLeida(notif.id);
                          onClose();
                          onEjecutarAccion(notif.accion!.vistaDestino, notif.accion!.proyectoId);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-xs font-bold transition-colors shadow-xs ${
                          esRechazo ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {esRechazo ? <Wrench className="w-3.5 h-3.5" /> : null}
                        <span>{notif.accion.etiqueta}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {!notif.leida && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarcarLeida(notif.id);
                          }}
                          className="text-[10px] text-slate-400 hover:text-slate-700"
                        >
                          Marcar como leída
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            SUMMIT Educational Business Suite • Notificaciones automáticas
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200/80 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
