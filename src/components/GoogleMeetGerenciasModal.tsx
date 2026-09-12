import React, { useState, useEffect } from 'react';
import { 
  X, 
  Video, 
  Copy, 
  Check, 
  ExternalLink, 
  Mail, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Users, 
  Plus, 
  Sparkles, 
  Building2, 
  Lock, 
  AlertCircle,
  Play,
  FileText,
  Trash2,
  Pencil,
  RotateCcw,
  Send,
  AlertTriangle,
  CheckCircle2,
  Radio
} from 'lucide-react';
import { 
  ReunionGerenciasMeet, 
  TipoComiteGerencias, 
  ParticipanteGerencia,
  COMITES_GERENCIAS_INFO, 
  PARTICIPANTES_DEFAULT_GERENCIAS,
  crearEspacioGoogleMeet, 
  obtenerReunionesGerenciasGuardadas, 
  registrarNuevaReunionGerencias,
  actualizarReunionGerenciasCompleta,
  eliminarReunionGerencias,
  enviarConvocatoriaGerenciasEmail,
  ResultadoEnvioGerencias,
  sanitizarEnlaceGoogleMeet,
  generarEnlaceGoogleCalendarWeb
} from '../services/googleMeetService';

interface GoogleMeetGerenciasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificar?: (mensaje: string) => void;
}

export const GoogleMeetGerenciasModal: React.FC<GoogleMeetGerenciasModalProps> = ({
  isOpen,
  onClose,
  onNotificar,
}) => {
  const [reuniones, setReuniones] = useState<ReunionGerenciasMeet[]>([]);
  
  // Estado para creación de nueva reunión
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoComiteGerencias>('comite_operativo_poa');
  const [titulo, setTitulo] = useState<string>(COMITES_GERENCIAS_INFO.comite_operativo_poa.nombre);
  const [fecha, setFecha] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [hora, setHora] = useState<string>('10:00');
  const [duracion, setDuracion] = useState<number>(60);
  const [customMeetUri, setCustomMeetUri] = useState<string>('');
  const [creando, setCreando] = useState<boolean>(false);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [reunionRecienCreada, setReunionRecienCreada] = useState<ReunionGerenciasMeet | null>(null);

  // Estado para modal de edición completa
  const [reunionEnEdicion, setReunionEnEdicion] = useState<ReunionGerenciasMeet | null>(null);
  const [nuevoPuntoAgenda, setNuevoPuntoAgenda] = useState<string>('');
  const [nuevoParticipante, setNuevoParticipante] = useState<{ nombre: string; cargo: string; correo: string }>({
    nombre: '',
    cargo: '',
    correo: '',
  });
  const [mostrandoAgregarParticipante, setMostrandoAgregarParticipante] = useState<boolean>(false);

  // Estado para confirmación de eliminación
  const [reunionParaEliminar, setReunionParaEliminar] = useState<ReunionGerenciasMeet | null>(null);

  // Estado para modal/drawer de envío de invitaciones a las gerencias
  const [reunionParaInvitar, setReunionParaInvitar] = useState<ReunionGerenciasMeet | null>(null);
  const [enviandoEmails, setEnviandoEmails] = useState<boolean>(false);
  const [resultadoEnvio, setResultadoEnvio] = useState<ResultadoEnvioGerencias | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReuniones(obtenerReunionesGerenciasGuardadas());
    }
  }, [isOpen]);

  // Actualizar título por defecto al cambiar el tipo de comité
  const handleCambioTipo = (nuevoTipo: TipoComiteGerencias) => {
    setTipoSeleccionado(nuevoTipo);
    setTitulo(COMITES_GERENCIAS_INFO[nuevoTipo].nombre);
  };

  // Crear reunión generando sala oficial o personalizada
  const handleCrearReunion = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCreando(true);

    try {
      let meetingUri = customMeetUri.trim();
      let meetingCode = '';

      if (meetingUri) {
        const sanitizado = sanitizarEnlaceGoogleMeet(meetingUri);
        meetingUri = sanitizado.meetingUri;
        meetingCode = sanitizado.meetingCode;
      } else {
        // Generar mediante API oficial de Google (Calendar Conference / Meet API v2)
        const space = await crearEspacioGoogleMeet({
          titulo: titulo.trim() || COMITES_GERENCIAS_INFO[tipoSeleccionado].nombre,
          tipoComite: tipoSeleccionado,
          fecha,
          hora,
          duracionMinutos: duracion,
          agendaPuntos: COMITES_GERENCIAS_INFO[tipoSeleccionado].agendaSugerida,
          participantes: PARTICIPANTES_DEFAULT_GERENCIAS,
        });
        const sanitizado = sanitizarEnlaceGoogleMeet(space.meetingUri || space.meetingCode);
        meetingUri = sanitizado.meetingUri;
        meetingCode = sanitizado.meetingCode;
      }

      const nuevaReunion: ReunionGerenciasMeet = {
        id: `meet-gerencia-${Date.now()}`,
        titulo: titulo.trim() || COMITES_GERENCIAS_INFO[tipoSeleccionado].nombre,
        tipoComite: tipoSeleccionado,
        fecha,
        hora,
        duracionMinutos: duracion,
        meetingUri,
        meetingCode,
        agendaPuntos: [...COMITES_GERENCIAS_INFO[tipoSeleccionado].agendaSugerida],
        participantes: [...PARTICIPANTES_DEFAULT_GERENCIAS],
        creadoPor: 'Dr. Walter René Pedroza - Gerencia General',
        creadoEn: new Date().toISOString(),
        estado: 'programada',
      };

      const actualizadas = registrarNuevaReunionGerencias(nuevaReunion);
      setReuniones(actualizadas);
      setReunionRecienCreada(nuevaReunion);
      setCustomMeetUri('');
      onNotificar?.(`📹 Sala creada para ${nuevaReunion.titulo} (${nuevaReunion.meetingCode})`);
    } catch (err: any) {
      console.error('Error al crear sala de Google Meet:', err);
      onNotificar?.('⚠️ Error al generar sala de Google Meet: ' + (err.message || 'Error desconocido'));
    } finally {
      setCreando(false);
    }
  };

  const copiarEnlace = (enlace: string, id: string) => {
    const s = sanitizarEnlaceGoogleMeet(enlace);
    navigator.clipboard.writeText(s.meetingUri);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2500);
    onNotificar?.(`📋 Enlace de Google Meet copiado: ${s.meetingUri}`);
  };

  // Guardar cambios de edición completa
  const handleGuardarEdicion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reunionEnEdicion) return;

    const sanitizado = sanitizarEnlaceGoogleMeet(reunionEnEdicion.meetingUri || reunionEnEdicion.meetingCode);

    const reunionFinalizada: ReunionGerenciasMeet = {
      ...reunionEnEdicion,
      meetingUri: sanitizado.meetingUri,
      meetingCode: sanitizado.meetingCode,
    };

    const actualizadas = actualizarReunionGerenciasCompleta(reunionFinalizada);
    setReuniones(actualizadas);
    setReunionEnEdicion(null);
    onNotificar?.(`✅ Cambios guardados para la reunión: ${reunionFinalizada.titulo}`);
  };

  // Confirmar y eliminar reunión
  const handleConfirmarEliminar = () => {
    if (!reunionParaEliminar) return;
    const actualizadas = eliminarReunionGerencias(reunionParaEliminar.id);
    setReuniones(actualizadas);
    if (reunionRecienCreada?.id === reunionParaEliminar.id) {
      setReunionRecienCreada(null);
    }
    onNotificar?.(`🗑️ Reunión "${reunionParaEliminar.titulo}" eliminada de la agenda`);
    setReunionParaEliminar(null);
  };

  // Generar nuevo enlace en edición
  const handleGenerarEnlaceEdicion = async () => {
    if (!reunionEnEdicion) return;
    setCreando(true);
    try {
      const space = await crearEspacioGoogleMeet({
        titulo: reunionEnEdicion.titulo,
        tipoComite: reunionEnEdicion.tipoComite,
        fecha: reunionEnEdicion.fecha,
        hora: reunionEnEdicion.hora,
        duracionMinutos: reunionEnEdicion.duracionMinutos,
        agendaPuntos: reunionEnEdicion.agendaPuntos,
        participantes: reunionEnEdicion.participantes,
      });

      setReunionEnEdicion({
        ...reunionEnEdicion,
        meetingUri: space.meetingUri,
        meetingCode: space.meetingCode,
      });
      onNotificar?.('⚡ Nuevo enlace oficial de Google Meet generado');
    } catch (e: any) {
      onNotificar?.('⚠️ Error al regenerar enlace: ' + (e.message || 'Error'));
    } finally {
      setCreando(false);
    }
  };

  // Enviar invitación por correo a cada gerencia
  const handleEnviarConvocatoria = async (correoEspecifico?: string) => {
    if (!reunionParaInvitar) return;
    setEnviandoEmails(true);
    try {
      const res = await enviarConvocatoriaGerenciasEmail(reunionParaInvitar, correoEspecifico);
      setResultadoEnvio(res);

      if (res.exitoso) {
        onNotificar?.('✉️ Convocatoria enviada exitosamente a los correos de las Gerencias');
      } else {
        onNotificar?.('⚠️ Aviso: Puede abrir su cliente de correo si no autorizó el envío directo');
      }
    } catch (err: any) {
      console.error('Error al enviar convocatoria:', err);
      onNotificar?.('⚠️ Error al enviar correo: ' + err.message);
    } finally {
      setEnviandoEmails(false);
    }
  };

  // Fallback con cliente de correo (mailto) con los correos de cada gerencia
  const handleAbrirMailto = (reunion: ReunionGerenciasMeet) => {
    const correos = reunion.participantes.map(p => p.correo).join(',');
    const asunto = encodeURIComponent(`[SUMMIT IMPULSA] Convocatoria a Reunión de Gerencias: ${reunion.titulo}`);
    const cuerpo = encodeURIComponent(
      `Estimados Líderes de Gerencia,\n\n` +
      `Se convoca formalmente a la sesión institucional:\n\n` +
      `📌 Asunto: ${reunion.titulo}\n` +
      `📅 Fecha: ${reunion.fecha}\n` +
      `⏰ Hora: ${reunion.hora} (Duración: ${reunion.duracionMinutos} min)\n` +
      `🔗 Sala Google Meet: ${reunion.meetingUri}\n` +
      `🔑 Código de Reunión: ${reunion.meetingCode}\n\n` +
      `Agenda de Puntos Institucionales:\n` +
      reunion.agendaPuntos.map(p => `  • ${p}`).join('\n') +
      `\n\nParticipantes Oficiales Convocados:\n` +
      reunion.participantes.map(p => `  - ${p.nombre} (${p.cargo}) -> ${p.correo}`).join('\n') +
      `\n\nFavor conectarse puntualmente.\n\n` +
      `Dr. Walter René Pedroza\n` +
      `Gerencia General | Summit Impulsa Global, S.A. de C.V.`
    );

    window.open(`mailto:${correos}?subject=${asunto}&body=${cuerpo}`, '_blank');
    onNotificar?.('✉️ Abriendo cliente de correo dirigido a todas las Gerencias');
  };

  if (!isOpen) return null;

  return (
    <div 
      id="modal-google-meet-gerencias"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Cabecera Exclusiva */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-5 text-white flex items-center justify-between border-b border-indigo-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-2 flex items-center justify-center text-white shadow-md shrink-0">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  EXCLUSIVO REUNIÓN DE LAS GERENCIAS
                </span>
                <span className="text-[11px] text-indigo-300 font-semibold">
                  Google Meet & Calendar API
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-0.5">
                Comités Directivos & Salas de Google Meet
              </h3>
            </div>
          </div>

          <button
            id="btn-cerrar-google-meet-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aviso Institucional */}
        <div className="bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-slate-800 text-xs text-slate-300 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Convocatorias dirigidas a: <strong>General</strong> (pedrozawalterrene@gmail.com), <strong>Académica</strong> (academia.summitg@gmail.com), <strong>Comercial</strong> (comercial.summitg@gmail.com) y <strong>Auditoría</strong> (administracion.summitg@gmail.com).
            </span>
          </div>
          <a
            href="https://meet.google.com/new"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-bold underline shrink-0"
            title="Abrir Google Meet para iniciar reunión instantánea"
          >
            <span>Crear Sala en Vivo</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Panel de Nueva Convocatoria */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Programar Nueva Reunión de Gerencias</span>
              </h4>
              <span className="text-xs text-slate-500 font-medium">
                Crea enlaces activos sin error de código
              </span>
            </div>

            <form onSubmit={handleCrearReunion} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tipo de Comité */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipo de Comité Inter-Gerencial
                  </label>
                  <select
                    id="select-tipo-comite-meet"
                    value={tipoSeleccionado}
                    onChange={(e) => handleCambioTipo(e.target.value as TipoComiteGerencias)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    {Object.entries(COMITES_GERENCIAS_INFO).map(([key, info]) => (
                      <option key={key} value={key}>
                        {info.nombre}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {COMITES_GERENCIAS_INFO[tipoSeleccionado].descripcion}
                  </p>
                </div>

                {/* Título de la Sesión */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título / Objeto de la Sesión
                  </label>
                  <input
                    id="input-titulo-comite-meet"
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ej. Comité Ordinario de Evaluación POA 2026"
                    required
                  />
                </div>
              </div>

              {/* Fecha, Hora y Duración */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Fecha</span>
                  </label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Hora</span>
                  </label>
                  <input
                    type="time"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Duración Estimada
                  </label>
                  <select
                    value={duracion}
                    onChange={(e) => setDuracion(Number(e.target.value))}
                    className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                  >
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>60 minutos (Estándar)</option>
                    <option value={90}>90 minutos</option>
                    <option value={120}>2 horas (Extraordinaria)</option>
                  </select>
                </div>
              </div>

              {/* Enlace opcional predefinido / Sala personalizada */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Video className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Enlace o Código de Google Meet (Opcional / Automático)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const clip = await navigator.clipboard.readText();
                          if (clip) {
                            setCustomMeetUri(clip);
                            const s = sanitizarEnlaceGoogleMeet(clip);
                            onNotificar?.(`📋 Código detectado: ${s.meetingCode}`);
                          }
                        } catch {
                          onNotificar?.('Pegue su enlace o código de Google Meet en el campo.');
                        }
                      }}
                      className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 transition-colors"
                      title="Pegar enlace copiado desde Google Meet"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Pegar portapapeles</span>
                    </button>
                    <a 
                      href="https://meet.google.com/new" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 transition-colors"
                      title="Abrir Google Meet para iniciar una nueva reunión en vivo"
                    >
                      <span>Iniciar en Meet (meet.google.com/new)</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <input
                  type="text"
                  value={customMeetUri}
                  onChange={(e) => setCustomMeetUri(e.target.value)}
                  placeholder="Deje en blanco para generar automáticamente con Google, o pegue su enlace (ej: abc-defg-hij)"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                {customMeetUri.trim() && (() => {
                  const s = sanitizarEnlaceGoogleMeet(customMeetUri);
                  return (
                    <div className="mt-1.5 flex items-center gap-2 text-[11px]">
                      {s.esCodigoValido ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Código Google Meet verificado: <strong>{s.meetingCode}</strong> ({s.meetingUri})</span>
                        </span>
                      ) : (
                        <span className="text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200 font-medium flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          <span>Enlace seguro de inicio directo: <strong>{s.meetingUri}</strong></span>
                        </span>
                      )}
                    </div>
                  );
                })()}
                <p className="text-[10px] text-slate-500 mt-1">
                  Si se deja en blanco, el sistema genera la sala automáticamente a través de Google Calendar y Meet API.
                </p>
              </div>

              {/* Botón de Acción Principal */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  id="btn-generar-meet-gerencias"
                  type="submit"
                  disabled={creando}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <Video className="w-4 h-4" />
                  <span>{creando ? 'Creando Sala Real en Google...' : 'Crear Sala de Google Meet para Gerencias'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Banner de Reunión Recién Creada */}
          {reunionRecienCreada && (
            <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white p-4 rounded-2xl border border-emerald-500/50 shadow-lg animate-in zoom-in-95">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-400 text-emerald-950 rounded font-mono">
                      ✓ SALA GENERADA SIN ERROR
                    </span>
                    <span className="text-xs text-emerald-300 font-bold">
                      {reunionRecienCreada.fecha} a las {reunionRecienCreada.hora}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-white mt-1">
                    {reunionRecienCreada.titulo}
                  </h4>
                  {(() => {
                    const s = sanitizarEnlaceGoogleMeet(reunionRecienCreada.meetingUri || reunionRecienCreada.meetingCode);
                    return (
                      <>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-200 mt-1 font-mono">
                          <span className="underline font-semibold">{s.meetingUri}</span>
                          <span>Código: {s.meetingCode}</span>
                        </div>
                        {s.esInstantaneo && (
                          <div className="mt-1 text-[11px] text-amber-200 bg-amber-950/40 px-2.5 py-1 rounded border border-amber-400/30">
                            💡 Al hacer clic en <strong>Entrar</strong>, Google Meet abrirá tu sesión en vivo y le asignará un código único. Puedes copiar ese código y pegarlo en <strong>Modificar</strong> para que todas las gerencias tengan el mismo enlace fijo.
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copiarEnlace(reunionRecienCreada.meetingUri, reunionRecienCreada.id)}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 border border-white/20 cursor-pointer"
                  >
                    {copiadoId === reunionRecienCreada.id ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiadoId === reunionRecienCreada.id ? '¡Copiado!' : 'Copiar Link'}</span>
                  </button>

                  <a
                    href={generarEnlaceGoogleCalendarWeb(reunionRecienCreada)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                    title="Agendar en Google Calendar con Meet y los correos de las 4 Gerencias"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Google Calendar</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setReunionParaInvitar(reunionRecienCreada);
                      setResultadoEnvio(null);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Convocatoria a Gerencias</span>
                  </button>

                  <a
                    href={sanitizarEnlaceGoogleMeet(reunionRecienCreada.meetingUri).meetingUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 text-xs font-black rounded-lg transition-colors flex items-center gap-1.5 shadow-md"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Entrar a Google Meet</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Historial de Reuniones de Gerencias */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Sesiones y Comités Programados ({reuniones.length})</span>
              </h4>
              <span className="text-xs text-slate-500">
                Opciones completas para Modificar, Borrar o Invitar a Gerencias
              </span>
            </div>

            {reuniones.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs">
                No hay reuniones registradas. Cree una nueva sesión en el formulario superior.
              </div>
            ) : (
              <div className="space-y-3">
                {reuniones.map((reu) => (
                  <div 
                    key={reu.id}
                    className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-200 transition-all shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${COMITES_GERENCIAS_INFO[reu.tipoComite]?.color || 'bg-slate-100 text-slate-700'}`}>
                          {COMITES_GERENCIAS_INFO[reu.tipoComite]?.nombre || reu.tipoComite}
                        </span>
                        <span className="text-sm font-bold text-slate-900">{reu.titulo}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          reu.estado === 'en_curso' ? 'bg-emerald-100 text-emerald-800 animate-pulse' :
                          reu.estado === 'finalizada' ? 'bg-slate-100 text-slate-600' : 'bg-blue-50 text-blue-800'
                        }`}>
                          {reu.estado.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {reu.fecha}
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {reu.hora} ({reu.duracionMinutos} min)
                        </span>
                        <span className="font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {sanitizarEnlaceGoogleMeet(reu.meetingUri || reu.meetingCode).meetingCode}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          👥 {reu.participantes.length} gerencias convocadas
                        </span>
                      </div>

                      {/* Resumen de participantes convocados */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {reu.participantes.map((part, pIdx) => (
                          <span 
                            key={pIdx} 
                            className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono"
                            title={`${part.nombre} (${part.cargo}): ${part.correo}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>{part.correo}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Acciones de la reunión: Modificar, Borrar, Invitar, Copiar y Entrar */}
                    <div className="flex flex-wrap items-center gap-1.5 self-end lg:self-center shrink-0">
                      {/* Botón Modificar / Editar */}
                      <button
                        type="button"
                        onClick={() => {
                          setReunionEnEdicion({
                            ...reu,
                            agendaPuntos: [...reu.agendaPuntos],
                            participantes: reu.participantes.map(p => ({ ...p })),
                          });
                        }}
                        className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border border-amber-200 cursor-pointer"
                        title="Modificar todos los elementos de esta reunión"
                      >
                        <Pencil className="w-3.5 h-3.5 text-amber-600" />
                        <span>Modificar</span>
                      </button>

                      {/* Botón Borrar / Eliminar */}
                      <button
                        type="button"
                        onClick={() => setReunionParaEliminar(reu)}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border border-rose-200 cursor-pointer"
                        title="Borrar reunión"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Borrar</span>
                      </button>

                      {/* Botón Invitar por Correo a las Gerencias */}
                      <button
                        type="button"
                        onClick={() => {
                          setReunionParaInvitar(reu);
                          setResultadoEnvio(null);
                        }}
                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border border-blue-200 cursor-pointer"
                        title="Enviar correo de convocatoria oficial a las 4 Gerencias"
                      >
                        <Mail className="w-3.5 h-3.5 text-blue-600" />
                        <span>Invitar</span>
                      </button>

                      {/* Botón Agendar en Google Calendar */}
                      <a
                        href={generarEnlaceGoogleCalendarWeb(reu)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border border-indigo-200"
                        title="Abrir en Google Calendar con Meet y las 4 Gerencias invitadas"
                      >
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Calendar</span>
                      </a>

                      {/* Botón Copiar Link */}
                      <button
                        type="button"
                        onClick={() => copiarEnlace(sanitizarEnlaceGoogleMeet(reu.meetingUri || reu.meetingCode).meetingUri, reu.id)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Copiar enlace de Google Meet"
                      >
                        {copiadoId === reu.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiadoId === reu.id ? 'Copiado' : 'Link'}</span>
                      </button>

                      {/* Botón Entrar a Google Meet */}
                      <a
                        href={sanitizarEnlaceGoogleMeet(reu.meetingUri || reu.meetingCode).meetingUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black transition-colors flex items-center gap-1 shadow-2xs"
                        title="Ingresar directamente a la videollamada"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Entrar</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Summit Impulsa Global, S.A. de C.V. — Gobernanza Inter-Gerencial POA 2026</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL DE EDICIÓN COMPLETA: MODIFICAR TODOS LOS ELEMENTOS DE LA REUNIÓN */}
      {/* ========================================================================= */}
      {reunionEnEdicion && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Cabecera Edición */}
            <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-slate-900 p-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="text-base font-black">Modificar Todos los Elementos de la Reunión</h3>
                  <p className="text-xs text-amber-200">Ajuste título, fechas, enlaces de Meet, puntos de agenda y correos de las gerencias</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReunionEnEdicion(null)}
                className="text-amber-200 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario de Edición */}
            <form onSubmit={handleGuardarEdicion} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tipo de Comité */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipo de Comité
                  </label>
                  <select
                    value={reunionEnEdicion.tipoComite}
                    onChange={(e) => {
                      const nuevoTipo = e.target.value as TipoComiteGerencias;
                      setReunionEnEdicion({
                        ...reunionEnEdicion,
                        tipoComite: nuevoTipo,
                      });
                    }}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-semibold"
                  >
                    {Object.entries(COMITES_GERENCIAS_INFO).map(([k, info]) => (
                      <option key={k} value={k}>{info.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estado de la Sesión
                  </label>
                  <select
                    value={reunionEnEdicion.estado}
                    onChange={(e) => setReunionEnEdicion({
                      ...reunionEnEdicion,
                      estado: e.target.value as 'programada' | 'en_curso' | 'finalizada',
                    })}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="programada">PROGRAMADA</option>
                    <option value="en_curso">EN CURSO (Sesión Activa)</option>
                    <option value="finalizada">FINALIZADA (Concluida)</option>
                  </select>
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título de la Reunión
                </label>
                <input
                  type="text"
                  value={reunionEnEdicion.titulo}
                  onChange={(e) => setReunionEnEdicion({
                    ...reunionEnEdicion,
                    titulo: e.target.value,
                  })}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-bold text-slate-800"
                  required
                />
              </div>

              {/* Fecha, Hora y Duración */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={reunionEnEdicion.fecha}
                    onChange={(e) => setReunionEnEdicion({ ...reunionEnEdicion, fecha: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hora</label>
                  <input
                    type="time"
                    value={reunionEnEdicion.hora}
                    onChange={(e) => setReunionEnEdicion({ ...reunionEnEdicion, hora: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duración (Minutos)</label>
                  <select
                    value={reunionEnEdicion.duracionMinutos}
                    onChange={(e) => setReunionEnEdicion({ ...reunionEnEdicion, duracionMinutos: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg"
                  >
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>60 minutos</option>
                    <option value={90}>90 minutos</option>
                    <option value={120}>120 minutos (2 horas)</option>
                  </select>
                </div>
              </div>

              {/* Enlace y Código de Google Meet */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-emerald-600" />
                    <span>Configuración del Enlace de Google Meet</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={creando}
                      onClick={handleGenerarEnlaceEdicion}
                      className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold rounded transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Regenerar con Google</span>
                    </button>
                    <a
                      href="https://meet.google.com/new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-[11px] font-bold rounded transition-colors flex items-center gap-1"
                    >
                      <span>meet.google.com/new</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-600">URL de la Sala (meetingUri)</label>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const clip = await navigator.clipboard.readText();
                            if (clip) {
                              const s = sanitizarEnlaceGoogleMeet(clip);
                              setReunionEnEdicion({
                                ...reunionEnEdicion,
                                meetingUri: s.meetingUri,
                                meetingCode: s.meetingCode,
                              });
                              onNotificar?.(`📋 Código detectado y aplicado: ${s.meetingCode}`);
                            }
                          } catch {
                            onNotificar?.('Pegue manualmente su enlace o código de Google Meet.');
                          }
                        }}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                        title="Pegar enlace o código desde el portapapeles"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Pegar Portapapeles</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={reunionEnEdicion.meetingUri}
                      onChange={(e) => {
                        const val = e.target.value;
                        const s = sanitizarEnlaceGoogleMeet(val);
                        setReunionEnEdicion({
                          ...reunionEnEdicion,
                          meetingUri: val,
                          meetingCode: s.meetingCode,
                        });
                      }}
                      onBlur={() => {
                        const s = sanitizarEnlaceGoogleMeet(reunionEnEdicion.meetingUri);
                        setReunionEnEdicion({
                          ...reunionEnEdicion,
                          meetingUri: s.meetingUri,
                          meetingCode: s.meetingCode,
                        });
                      }}
                      placeholder="Ej: https://meet.google.com/abc-defg-hij o https://meet.google.com/new"
                      className="w-full text-xs px-3 py-1.5 font-mono border border-slate-300 rounded-lg bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Código de Reunión</label>
                    <input
                      type="text"
                      value={reunionEnEdicion.meetingCode}
                      onChange={(e) => {
                        const val = e.target.value;
                        const s = sanitizarEnlaceGoogleMeet(val);
                        setReunionEnEdicion({
                          ...reunionEnEdicion,
                          meetingCode: val,
                          meetingUri: s.meetingUri,
                        });
                      }}
                      onBlur={() => {
                        const s = sanitizarEnlaceGoogleMeet(reunionEnEdicion.meetingCode);
                        setReunionEnEdicion({
                          ...reunionEnEdicion,
                          meetingCode: s.meetingCode,
                          meetingUri: s.meetingUri,
                        });
                      }}
                      className="w-full text-xs px-3 py-1.5 font-mono border border-slate-300 rounded-lg bg-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Puntos de la Agenda */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Puntos de la Agenda ({reunionEnEdicion.agendaPuntos.length})</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setReunionEnEdicion({
                        ...reunionEnEdicion,
                        agendaPuntos: [...COMITES_GERENCIAS_INFO[reunionEnEdicion.tipoComite].agendaSugerida],
                      });
                    }}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restablecer sugerida</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {reunionEnEdicion.agendaPuntos.map((punto, pIdx) => (
                    <div key={pIdx} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 w-5 text-right">{pIdx + 1}.</span>
                      <input
                        type="text"
                        value={punto}
                        onChange={(e) => {
                          const nuevaLista = [...reunionEnEdicion.agendaPuntos];
                          nuevaLista[pIdx] = e.target.value;
                          setReunionEnEdicion({ ...reunionEnEdicion, agendaPuntos: nuevaLista });
                        }}
                        className="flex-1 text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const nuevaLista = reunionEnEdicion.agendaPuntos.filter((_, idx) => idx !== pIdx);
                          setReunionEnEdicion({ ...reunionEnEdicion, agendaPuntos: nuevaLista });
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar punto"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {/* Agregar nuevo punto */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={nuevoPuntoAgenda}
                      onChange={(e) => setNuevoPuntoAgenda(e.target.value)}
                      placeholder="Escribir nuevo punto para la agenda..."
                      className="flex-1 text-xs px-3 py-1.5 border border-dashed border-slate-300 rounded-lg bg-slate-50"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (nuevoPuntoAgenda.trim()) {
                            setReunionEnEdicion({
                              ...reunionEnEdicion,
                              agendaPuntos: [...reunionEnEdicion.agendaPuntos, nuevoPuntoAgenda.trim()],
                            });
                            setNuevoPuntoAgenda('');
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (nuevoPuntoAgenda.trim()) {
                          setReunionEnEdicion({
                            ...reunionEnEdicion,
                            agendaPuntos: [...reunionEnEdicion.agendaPuntos, nuevoPuntoAgenda.trim()],
                          });
                          setNuevoPuntoAgenda('');
                        }
                      }}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      + Agregar
                    </button>
                  </div>
                </div>
              </div>

              {/* Participantes / Gerencias convocadas */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Gerencias Convocadas & Correos de Destino</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setMostrandoAgregarParticipante(!mostrandoAgregarParticipante)}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{mostrandoAgregarParticipante ? 'Cancelar' : 'Agregar Gerencia/Invitado'}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {reunionEnEdicion.participantes.map((part, pIdx) => (
                    <div key={pIdx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 items-center">
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          value={part.nombre}
                          onChange={(e) => {
                            const actualizados = [...reunionEnEdicion.participantes];
                            actualizados[pIdx].nombre = e.target.value;
                            setReunionEnEdicion({ ...reunionEnEdicion, participantes: actualizados });
                          }}
                          placeholder="Nombre del líder"
                          className="w-full text-xs px-2.5 py-1 bg-white border border-slate-300 rounded font-bold"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          value={part.cargo}
                          onChange={(e) => {
                            const actualizados = [...reunionEnEdicion.participantes];
                            actualizados[pIdx].cargo = e.target.value;
                            setReunionEnEdicion({ ...reunionEnEdicion, participantes: actualizados });
                          }}
                          placeholder="Cargo / Gerencia"
                          className="w-full text-xs px-2.5 py-1 bg-white border border-slate-300 rounded"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="email"
                          value={part.correo}
                          onChange={(e) => {
                            const actualizados = [...reunionEnEdicion.participantes];
                            actualizados[pIdx].correo = e.target.value;
                            setReunionEnEdicion({ ...reunionEnEdicion, participantes: actualizados });
                          }}
                          placeholder="correo@summit.com"
                          className="w-full text-xs px-2.5 py-1 bg-white border border-slate-300 rounded font-mono text-indigo-700"
                        />
                      </div>
                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            const actualizados = reunionEnEdicion.participantes.filter((_, idx) => idx !== pIdx);
                            setReunionEnEdicion({ ...reunionEnEdicion, participantes: actualizados });
                          }}
                          className="p-1 text-rose-500 hover:bg-rose-100 rounded transition-colors cursor-pointer"
                          title="Eliminar participante"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Formulario para agregar participante */}
                  {mostrandoAgregarParticipante && (
                    <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-200 space-y-2">
                      <span className="text-[11px] font-bold text-indigo-900 block">Nuevo Participante / Asesor Convocado:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Nombre Completo"
                          value={nuevoParticipante.nombre}
                          onChange={(e) => setNuevoParticipante({ ...nuevoParticipante, nombre: e.target.value })}
                          className="text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded"
                        />
                        <input
                          type="text"
                          placeholder="Cargo o Rol"
                          value={nuevoParticipante.cargo}
                          onChange={(e) => setNuevoParticipante({ ...nuevoParticipante, cargo: e.target.value })}
                          className="text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded"
                        />
                        <input
                          type="email"
                          placeholder="Correo institucional"
                          value={nuevoParticipante.correo}
                          onChange={(e) => setNuevoParticipante({ ...nuevoParticipante, correo: e.target.value })}
                          className="text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (nuevoParticipante.nombre.trim() && nuevoParticipante.correo.trim()) {
                              setReunionEnEdicion({
                                ...reunionEnEdicion,
                                participantes: [
                                  ...reunionEnEdicion.participantes,
                                  {
                                    nombre: nuevoParticipante.nombre.trim(),
                                    cargo: nuevoParticipante.cargo.trim() || 'Participante',
                                    correo: nuevoParticipante.correo.trim(),
                                    confirmado: true,
                                  },
                                ],
                              });
                              setNuevoParticipante({ nombre: '', cargo: '', correo: '' });
                              setMostrandoAgregarParticipante(false);
                            }
                          }}
                          className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700 transition-colors cursor-pointer"
                        >
                          Añadir a la Lista
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notas y Acuerdos de la Reunión */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notas, Acuerdos o Instrucciones Previas
                </label>
                <textarea
                  rows={3}
                  value={reunionEnEdicion.notasAcuerdos || ''}
                  onChange={(e) => setReunionEnEdicion({ ...reunionEnEdicion, notasAcuerdos: e.target.value })}
                  placeholder="Registre aquí los antecedentes, consignas o acuerdos adoptados..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setReunionEnEdicion(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Guardar Todos los Cambios
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN DE REUNIÓN */}
      {/* ========================================================================= */}
      {reunionParaEliminar && (
        <div className="fixed inset-0 z-70 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-rose-200 p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">¿Eliminar esta reunión convocada?</h4>
                <p className="text-xs text-slate-500">Esta acción removerá la sesión de la agenda de comités.</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-800">{reunionParaEliminar.titulo}</div>
              <div className="text-slate-500">Fecha: {reunionParaEliminar.fecha} a las {reunionParaEliminar.hora}</div>
              <div className="font-mono text-indigo-600">{reunionParaEliminar.meetingCode}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReunionParaEliminar(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminar}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirmar Eliminación</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE ENVÍO DE CONVOCATORIA A LOS CORREOS DE CADA GERENCIA */}
      {/* ========================================================================= */}
      {reunionParaInvitar && (
        <div className="fixed inset-0 z-70 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Cabecera */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/30 border border-blue-400/40 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-blue-300" />
                </div>
                <div>
                  <h3 className="text-sm font-black">Convocatoria Oficial a las Gerencias</h3>
                  <p className="text-[11px] text-blue-200">Envío directo al correo asignado a cada gerencia institucional</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReunionParaInvitar(null)}
                className="text-blue-300 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              
              {/* Resumen de la sesión */}
              <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-200/80 space-y-1">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                  {COMITES_GERENCIAS_INFO[reunionParaInvitar.tipoComite]?.nombre || reunionParaInvitar.tipoComite}
                </span>
                <h4 className="text-sm font-black text-slate-900 mt-1">{reunionParaInvitar.titulo}</h4>
                <div className="flex flex-wrap items-center gap-3 text-slate-600 font-medium pt-1">
                  <span>📅 {reunionParaInvitar.fecha}</span>
                  <span>⏰ {reunionParaInvitar.hora} ({reunionParaInvitar.duracionMinutos} min)</span>
                  <span className="font-mono font-bold text-indigo-700">🔑 {reunionParaInvitar.meetingCode}</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono pt-1">
                  Sala: <a href={reunionParaInvitar.meetingUri} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{reunionParaInvitar.meetingUri}</a>
                </div>
              </div>

              {/* Lista de Correos de las Gerencias */}
              <div>
                <span className="font-bold text-slate-800 block mb-2">
                  Destinatarios Oficiales Convocados ({reunionParaInvitar.participantes.length} Gerencias):
                </span>
                <div className="space-y-2">
                  {reunionParaInvitar.participantes.map((part, pIdx) => {
                    const statusEnvio = resultadoEnvio?.destinatariosEnviados?.find(d => d.correo.toLowerCase() === part.correo.toLowerCase());
                    return (
                      <div 
                        key={pIdx}
                        className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{part.nombre}</div>
                          <div className="text-[11px] text-indigo-600 font-semibold">{part.cargo}</div>
                          <div className="text-[11px] font-mono text-slate-500 mt-0.5">{part.correo}</div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {statusEnvio && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                              statusEnvio.enviado 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {statusEnvio.enviado ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertTriangle className="w-3 h-3 text-rose-600" />}
                              <span>{statusEnvio.enviado ? 'Enviado OK' : 'Pendiente/Manual'}</span>
                            </span>
                          )}

                          <button
                            type="button"
                            disabled={enviandoEmails}
                            onClick={() => handleEnviarConvocatoria(part.correo)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            title={`Enviar solo a ${part.correo}`}
                          >
                            <Send className="w-3 h-3 text-blue-600" />
                            <span>Enviar a este correo</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Botones de acción masiva */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-800">Opciones de Despacho Institucional:</div>
                    <div className="text-[11px] text-slate-500">Se enviará el formato ejecutivo formal con la sala de Meet a cada uno de los correos.</div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAbrirMailto(reunionParaInvitar)}
                      className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Abrir plantilla pre-llenada en su aplicación de correo (Outlook, Gmail, etc.)"
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-600" />
                      <span>Abrir en Cliente de Correo</span>
                    </button>

                    <button
                      type="button"
                      disabled={enviandoEmails}
                      onClick={() => handleEnviarConvocatoria()}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{enviandoEmails ? 'Enviando a las Gerencias...' : 'Enviar a los Correos de las 4 Gerencias'}</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setReunionParaInvitar(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
