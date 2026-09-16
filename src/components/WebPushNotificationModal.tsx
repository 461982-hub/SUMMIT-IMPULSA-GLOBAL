import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  BellOff, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  Smartphone, 
  Laptop, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  ExternalLink, 
  Check, 
  Send, 
  Layers, 
  Building2, 
  GraduationCap, 
  Megaphone,
  AlertOctagon,
  RefreshCw,
  Trash2,
  HelpCircle,
  Vibrate
} from 'lucide-react';
import { 
  obtenerConfiguracionWebPush, 
  guardarConfiguracionWebPush, 
  activarWebPush, 
  desactivarWebPush, 
  obtenerEstadoPermiso, 
  soportaWebPush, 
  estaEnIframe, 
  enviarNotificacionPruebaInmediata, 
  programarPruebaSegundoPlano, 
  obtenerHistorialWebPush, 
  limpiarHistorialWebPush 
} from '../services/webPushService';
import { ConfiguracionWebPush, EventoCriticoProyecto } from '../types';

interface WebPushNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEjecutarAccion?: (vista: any, proyectoId?: string) => void;
}

export const WebPushNotificationModal: React.FC<WebPushNotificationModalProps> = ({
  isOpen,
  onClose,
  onEjecutarAccion,
}) => {
  const [config, setConfig] = useState<ConfiguracionWebPush>(obtenerConfiguracionWebPush());
  const [permisoNavegador, setPermisoNavegador] = useState<string>(obtenerEstadoPermiso());
  const [cargando, setCargando] = useState(false);
  const [mensajeEstado, setMensajeEstado] = useState<{ tipo: 'exito' | 'error' | 'info'; texto: string } | null>(null);
  const [cuentaRegresiva, setCuentaRegresiva] = useState<number | null>(null);
  const [historial, setHistorial] = useState<EventoCriticoProyecto[]>([]);
  const [tabActiva, setTabActiva] = useState<'ajustes' | 'historial' | 'guia'>('ajustes');

  const enIframe = estaEnIframe();
  const compatible = soportaWebPush();

  useEffect(() => {
    if (isOpen) {
      setConfig(obtenerConfiguracionWebPush());
      setPermisoNavegador(obtenerEstadoPermiso());
      setHistorial(obtenerHistorialWebPush());
      setMensajeEstado(null);
    }
  }, [isOpen]);

  // Manejo del temporizador de prueba en segundo plano
  useEffect(() => {
    if (cuentaRegresiva === null) return;
    if (cuentaRegresiva <= 0) {
      setCuentaRegresiva(null);
      setMensajeEstado({
        tipo: 'exito',
        texto: '¡Alerta enviada por el Service Worker! Revise la bandeja de notificaciones de su sistema operativo.',
      });
      return;
    }
    const t = setTimeout(() => {
      setCuentaRegresiva((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(t);
  }, [cuentaRegresiva]);

  if (!isOpen) return null;

  const handleToggleActivar = async () => {
    setCargando(true);
    setMensajeEstado(null);

    if (config.habilitado) {
      // Desactivar
      await desactivarWebPush();
      const updated = { ...config, habilitado: false };
      setConfig(updated);
      setPermisoNavegador(obtenerEstadoPermiso());
      setMensajeEstado({
        tipo: 'info',
        texto: 'Notificaciones Web Push desactivadas.',
      });
      setCargando(false);
      return;
    }

    // Activar
    const res = await activarWebPush(config.gerenciaObjetivo);
    setPermisoNavegador(res.permiso);
    if (res.exito) {
      const updated = obtenerConfiguracionWebPush();
      setConfig(updated);
      setMensajeEstado({
        tipo: 'exito',
        texto: res.mensaje,
      });
    } else {
      setMensajeEstado({
        tipo: 'error',
        texto: res.mensaje,
      });
    }
    setCargando(false);
  };

  const handleGuardarCambios = (nuevaConfig: ConfiguracionWebPush) => {
    setConfig(nuevaConfig);
    guardarConfiguracionWebPush(nuevaConfig);
  };

  const handleToggleEvento = (key: keyof ConfiguracionWebPush['eventos']) => {
    const nuevosEventos = {
      ...config.eventos,
      [key]: !config.eventos[key],
    };
    const nueva = { ...config, eventos: nuevosEventos };
    handleGuardarCambios(nueva);
  };

  const handleProbarInmediato = async () => {
    setCargando(true);
    const exito = await enviarNotificacionPruebaInmediata(
      config.gerenciaObjetivo === 'todas'
        ? 'Todas las Gerencias'
        : config.gerenciaObjetivo.toUpperCase()
    );
    if (exito) {
      setMensajeEstado({
        tipo: 'exito',
        texto: '¡Notificación de prueba enviada a su sistema operativo!',
      });
      setHistorial(obtenerHistorialWebPush());
    } else {
      setMensajeEstado({
        tipo: 'error',
        texto: 'No se pudo mostrar la notificación. Verifique los permisos del navegador o ábrala en una pestaña independiente.',
      });
    }
    setCargando(false);
  };

  const handleProbarSegundoPlano = async () => {
    const delay = 5;
    setCuentaRegresiva(delay);
    await programarPruebaSegundoPlano(
      delay,
      config.gerenciaObjetivo === 'todas'
        ? 'Todas las Gerencias'
        : config.gerenciaObjetivo.toUpperCase()
    );
    setMensajeEstado({
      tipo: 'info',
      texto: `¡Temporizador activado! Minimice esta ventana o cambie de pestaña. En ${delay} segundos recibirá la notificación nativa en su escritorio/móvil.`,
    });
  };

  const handleLimpiarHistorial = () => {
    limpiarHistorialWebPush();
    setHistorial([]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera Corporativa */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between border-b border-blue-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shadow-inner">
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white tracking-tight">
                  Sistema de Notificaciones Web Push de Navegador
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 tracking-wider">
                  Segundo Plano
                </span>
              </div>
              <p className="text-xs text-blue-200/80 mt-0.5">
                Alertas nativas del sistema operativo a las gerencias ante cambios de estado críticos, sin requerir mantener la aplicación abierta.
              </p>
            </div>
          </div>

          <button
            id="btn-cerrar-modal-webpush"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Pestañas y Estado */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Tabs */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setTabActiva('ajustes')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                tabActiva === 'ajustes'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Configuración y Filtros</span>
            </button>
            <button
              onClick={() => setTabActiva('historial')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                tabActiva === 'historial'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Historial Despachado ({historial.length})</span>
            </button>
            <button
              onClick={() => setTabActiva('guia')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                tabActiva === 'guia'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>¿Cómo Funciona?</span>
            </button>
          </div>

          {/* Estado de conexión Service Worker & Permisos */}
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
              <span className={`w-2 h-2 rounded-full ${
                config.habilitado && permisoNavegador === 'granted'
                  ? 'bg-emerald-500 animate-pulse'
                  : permisoNavegador === 'denied'
                  ? 'bg-rose-500'
                  : 'bg-amber-400'
              }`} />
              <span>
                {config.habilitado && permisoNavegador === 'granted'
                  ? 'Web Push Activo (SW /sw.js)'
                  : permisoNavegador === 'denied'
                  ? 'Permiso Bloqueado en Navegador'
                  : 'Inactivo / Requiere Activación'}
              </span>
            </div>
          </div>
        </div>

        {/* Mensaje de retroalimentación en vivo */}
        {mensajeEstado && (
          <div className={`px-6 py-2.5 text-xs font-medium border-b flex items-center justify-between ${
            mensajeEstado.tipo === 'exito'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : mensajeEstado.tipo === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-blue-50 text-blue-900 border-blue-200'
          }`}>
            <div className="flex items-center gap-2">
              {mensajeEstado.tipo === 'exito' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              {mensajeEstado.tipo === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
              {mensajeEstado.tipo === 'info' && <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />}
              <span>{mensajeEstado.texto}</span>
            </div>
            <button 
              onClick={() => setMensajeEstado(null)}
              className="text-slate-400 hover:text-slate-700 text-xs font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Banner informativo si está en iFrame */}
        {enIframe && (
          <div className="mx-6 mt-4 p-3 bg-amber-50/90 border border-amber-300/80 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <p className="font-bold">Vista dentro de marco (iFrame de previsualización)</p>
                <p className="text-[11px] text-amber-800">
                  Para otorgar permisos de notificaciones del sistema operativo y recibir avisos con la ventana minimizada, se recomienda abrir en pestaña independiente.
                </p>
              </div>
            </div>
            <button
              onClick={() => window.open(window.location.href, '_blank')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shrink-0 transition-colors shadow-2xs"
            >
              <span>Abrir Pestaña</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Cuerpo del Modal */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/40">
          {tabActiva === 'ajustes' && (
            <>
              {/* Sección 1: Switch Maestro y Panel de Control */}
              <div className="p-4.5 bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    config.habilitado && permisoNavegador === 'granted'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {config.habilitado ? <BellRing className="w-6 h-6" /> : <BellOff className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      Notificaciones de Navegador (Web Push API)
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {config.habilitado
                        ? 'Servicio activo mediante Service Worker en segundo plano.'
                        : 'Active el servicio para recibir alertas de escritorio cuando ocurran cambios críticos.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    id="btn-toggle-webpush-maestro"
                    disabled={cargando}
                    onClick={handleToggleActivar}
                    className={`px-4.5 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 shadow-xs cursor-pointer ${
                      config.habilitado
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                    }`}
                  >
                    {cargando ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : config.habilitado ? (
                      <>
                        <BellOff className="w-4 h-4" />
                        <span>Desactivar Web Push</span>
                      </>
                    ) : (
                      <>
                        <BellRing className="w-4 h-4" />
                        <span>Activar Notificaciones</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Sección 2: Selector de Gerencia Objetivo */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Gerencia Receptor de Alertas en este Equipo</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'todas', etiqueta: 'Todas las Gerencias', desc: 'Alertas globales directivas', icono: Layers, color: 'border-blue-300 bg-blue-50/50' },
                    { id: 'general', etiqueta: 'Gerencia General', desc: 'Dr. Walter Pedroza', icono: Building2, color: 'border-purple-300 bg-purple-50/50' },
                    { id: 'academica', etiqueta: 'Gerencia Académica', desc: 'Phd. Donal Reyes', icono: GraduationCap, color: 'border-indigo-300 bg-indigo-50/50' },
                    { id: 'comercializacion', etiqueta: 'G. Comercialización', desc: 'Lic. Mario Valle', icono: Megaphone, color: 'border-emerald-300 bg-emerald-50/50' },
                  ].map((g) => {
                    const IconoG = g.icono;
                    const seleccionada = config.gerenciaObjetivo === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => handleGuardarCambios({ ...config, gerenciaObjetivo: g.id as any })}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          seleccionada
                            ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500/20 shadow-xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <IconoG className={`w-4 h-4 ${seleccionada ? 'text-blue-700' : 'text-slate-500'}`} />
                          {seleccionada && <Check className="w-3.5 h-3.5 text-blue-700 font-bold" />}
                        </div>
                        <p className="font-bold text-xs text-slate-900">{g.etiqueta}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{g.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sección 3: Matriz de Eventos Críticos */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Eventos Críticos que Disparan Notificaciones Web Push</span>
                  </label>
                  <span className="text-[11px] text-slate-500">Seleccione los disparadores deseados</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Evento 1: Rechazo Urgente GG */}
                  <div 
                    onClick={() => handleToggleEvento('rechazoGG')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      config.eventos.rechazoGG
                        ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-300'
                        : 'bg-white border-slate-200 opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={config.eventos.rechazoGG}
                      onChange={() => {}}
                      className="mt-1 w-4 h-4 rounded text-rose-600 border-slate-300"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                        <span className="font-bold text-xs text-rose-950">🚨 Retorno para Corrección Inmediata (GG)</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Notifica de inmediato a Gerencia Académica cuando Dirección General rechaza un sílabo por ajustes obligatorios de costos.
                      </p>
                    </div>
                  </div>

                  {/* Evento 2: Aprobación GG */}
                  <div 
                    onClick={() => handleToggleEvento('aprobacionGG')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      config.eventos.aprobacionGG
                        ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300'
                        : 'bg-white border-slate-200 opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={config.eventos.aprobacionGG}
                      onChange={() => {}}
                      className="mt-1 w-4 h-4 rounded text-emerald-600 border-slate-300"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-bold text-xs text-emerald-950">✅ Aprobación de GG → Pase a Comercialización</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Alerta a Comercialización para habilitar venta, pauta publicitaria en redes sociales y captación de alumnos.
                      </p>
                    </div>
                  </div>

                  {/* Evento 3: Nuevo Sílabo Registrado */}
                  <div 
                    onClick={() => handleToggleEvento('nuevoSilabo')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      config.eventos.nuevoSilabo
                        ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-300'
                        : 'bg-white border-slate-200 opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={config.eventos.nuevoSilabo}
                      onChange={() => {}}
                      className="mt-1 w-4 h-4 rounded text-blue-600 border-slate-300"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-bold text-xs text-blue-950">📘 Nuevo Sílabo Oficial para Dictamen GG</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Alerta a Gerencia General cuando Académica registra un proyecto con correlativos SAR para su dictamen de aprobación.
                      </p>
                    </div>
                  </div>

                  {/* Evento 4: Cambio Estado Proyecto */}
                  <div 
                    onClick={() => handleToggleEvento('cambioEstadoProyecto')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      config.eventos.cambioEstadoProyecto
                        ? 'bg-purple-50/70 border-purple-300 ring-1 ring-purple-300'
                        : 'bg-white border-slate-200 opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={config.eventos.cambioEstadoProyecto}
                      onChange={() => {}}
                      className="mt-1 w-4 h-4 rounded text-purple-600 border-slate-300"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-purple-600" />
                        <span className="font-bold text-xs text-purple-950">🔄 Cambios Críticos (Listo, Cancelado, Denegado)</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Avisa cuando un proyecto culmina con dictamen favorable 'Listo', o pasa a estado Cancelado o Pospuesto.
                      </p>
                    </div>
                  </div>

                  {/* Evento 5: Cierre Mensual POA */}
                  <div 
                    onClick={() => handleToggleEvento('cierreMensualPOA')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      config.eventos.cierreMensualPOA
                        ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-300'
                        : 'bg-white border-slate-200 opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={config.eventos.cierreMensualPOA}
                      onChange={() => {}}
                      className="mt-1 w-4 h-4 rounded text-amber-600 border-slate-300"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span className="font-bold text-xs text-amber-950">📊 Auditoría de Cierre Mensual & Déficit POA</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Alerta en caso de cierres mensuales deficitarios o por debajo de la meta de 18.5 proyectos del POA Sep-Dic 2026.
                      </p>
                    </div>
                  </div>

                  {/* Evento 6: Aforo Crítico Cupos */}
                  <div 
                    onClick={() => handleToggleEvento('alertaAforoCupos')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      config.eventos.alertaAforoCupos
                        ? 'bg-teal-50/70 border-teal-300 ring-1 ring-teal-300'
                        : 'bg-white border-slate-200 opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={config.eventos.alertaAforoCupos}
                      onChange={() => {}}
                      className="mt-1 w-4 h-4 rounded text-teal-600 border-slate-300"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-teal-600" />
                        <span className="font-bold text-xs text-teal-950">👥 Cupos Críticos & Aforo Completo (Sold Out)</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Avisa a las gerencias cuando un curso llena sus cupos proyectados o alcanza rentabilidad máxima.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección 4: Preferencias de Audio y Vibración */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={config.sonidoHabilitado}
                      onChange={(e) => handleGuardarCambios({ ...config, sonidoHabilitado: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <div className="flex items-center gap-1.5">
                      {config.sonidoHabilitado ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                      <span>Alerta de Audio Acústica</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={config.vibracionHabilitada}
                      onChange={(e) => handleGuardarCambios({ ...config, vibracionHabilitada: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <div className="flex items-center gap-1.5">
                      <Vibrate className="w-4 h-4 text-purple-600" />
                      <span>Vibración en Dispositivos Móviles</span>
                    </div>
                  </label>
                </div>

                <span className="text-[11px] text-slate-400">
                  Usa Web Audio API estándar sin descargas externas
                </span>
              </div>

              {/* Sección 5: Pruebas de Funcionamiento en Vivo */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-xl border border-blue-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <h5 className="font-extrabold text-xs text-blue-950">
                      Pruebas de Notificación Nativa y Segundo Plano
                    </h5>
                  </div>
                  <span className="text-[10px] font-bold text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded-md">
                    Verificación Service Worker
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Compruebe la recepción de avisos nativos. Puede enviar una prueba inmediata o programar un disparo en segundo plano para minimizar la ventana y confirmar que la alerta llega sin tener la app abierta.
                </p>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    disabled={cargando || !config.habilitado}
                    onClick={handleProbarInmediato}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar Notificación Inmediata</span>
                  </button>

                  <button
                    type="button"
                    disabled={cargando || !config.habilitado || cuentaRegresiva !== null}
                    onClick={handleProbarSegundoPlano}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {cuentaRegresiva !== null 
                        ? `Minimice la app: disparando en ${cuentaRegresiva}s...` 
                        : 'Probar Segundo Plano (5s - Minimice la app)'}
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}

          {tabActiva === 'historial' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Historial de Alertas Críticas Despachadas por Web Push
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Eventos enviados al Service Worker y al sistema operativo
                  </p>
                </div>
                {historial.length > 0 && (
                  <button
                    onClick={handleLimpiarHistorial}
                    className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 font-semibold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpiar historial</span>
                  </button>
                )}
              </div>

              {historial.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-6">
                  <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No hay alertas despachadas recientemente</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                    Aparecerán aquí cuando se aprueben proyectos, se retornen por observaciones financieras o se modifique su estado de ejecución.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {historial.map((ev, i) => (
                    <div 
                      key={ev.id || i}
                      className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          ev.tipo === 'rechazo_gg'
                            ? 'bg-rose-100 text-rose-800'
                            : ev.tipo === 'aprobacion_gg'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {ev.tipo.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-[10px] text-slate-400">{ev.fechaHora}</span>
                      </div>
                      <h5 className="font-bold text-slate-900">{ev.titulo}</h5>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{ev.cuerpo}</p>
                      {ev.codigoEmpresa && (
                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2 pt-1 border-t border-slate-100">
                          <span>Empresa: {ev.codigoEmpresa}</span>
                          {ev.correlativoSAR && <span>SAR: {ev.correlativoSAR}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tabActiva === 'guia' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-1">
                  Arquitectura de Notificaciones Web Push (Service Worker)
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  El sistema utiliza la especificación de <strong>Web Push API</strong> y <strong>Service Workers</strong> estándar W3C. Esto permite que el navegador se mantenga escuchando en segundo plano, recibiendo avisos del sistema aunque la pestaña de la aplicación no esté activa o se encuentre minimizada.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="w-7 h-7 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-bold mb-2">
                    1
                  </div>
                  <h5 className="font-bold text-slate-800 text-xs">Service Worker Activo</h5>
                  <p className="text-[11px] text-slate-500 mt-1">
                    El archivo <code className="text-blue-600">/sw.js</code> corre en un hilo independiente del navegador y persiste en segundo plano.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="w-7 h-7 rounded bg-purple-100 text-purple-700 flex items-center justify-center font-bold mb-2">
                    2
                  </div>
                  <h5 className="font-bold text-slate-800 text-xs">Integración al SO</h5>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Las alertas aparecen en el Centro de Notificaciones de Windows, macOS, Android y Linux con el icono oficial de SUMMIT.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="w-7 h-7 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-2">
                    3
                  </div>
                  <h5 className="font-bold text-slate-800 text-xs">Clic con Acción Directa</h5>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Al hacer clic en la alerta nativa, el navegador abre o enfoca la ventana y navega directamente a la gerencia correspondiente.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 text-blue-900 text-[11px] space-y-1">
                <p className="font-bold">Recomendación para Gerentes y Líderes de Área:</p>
                <p>
                  Para una experiencia óptima, autorice los permisos cuando el navegador lo solicite. Si utiliza Google Chrome, Edge, Brave o Safari, asegúrese de que el "Modo Concentración" o "No Molestar" del sistema operativo no esté silenciando las notificaciones.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>SUMMIT IMPULSA GLOBAL • Web Push Engine v1.0</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
