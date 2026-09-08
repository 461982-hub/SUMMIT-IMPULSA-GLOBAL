import React, { useState, useMemo } from 'react';
import { 
  CalendarDays, 
  Clock, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  Laptop, 
  Building,
  UploadCloud,
  Check,
  X,
  Sparkles,
  Info
} from 'lucide-react';
import { ProyectoEducativo } from '../../types';
import { SesionCalendarioMaestro } from './AcademicMasterFacultyCalendarView';
import { 
  getCalendarAccessToken, 
  createGoogleCalendarEvent,
  combinarFechaHoraAISO 
} from '../../services/googleCalendarService';

interface ManualScheduleSessionModalProps {
  proyectos: ProyectoEducativo[];
  sesionExistente?: SesionCalendarioMaestro | null;
  fechaInicial?: string;
  todasLasSesiones: SesionCalendarioMaestro[];
  onCerrar: () => void;
  onGuardar: (datos: {
    proyectoId: string;
    numeroSesion?: number;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    horas: number;
    tema: string;
    nombreDocente: string;
    modalidad: 'Virtual' | 'Presencial' | 'Híbrida';
    plataformaAula: string;
    sincronizadoGoogle?: boolean;
  }) => void;
  onNotificarExito: (msg: string) => void;
  onNotificarError: (msg: string) => void;
}

export const ManualScheduleSessionModal: React.FC<ManualScheduleSessionModalProps> = ({
  proyectos,
  sesionExistente,
  fechaInicial,
  todasLasSesiones,
  onCerrar,
  onGuardar,
  onNotificarExito,
  onNotificarError,
}) => {
  // Proyecto seleccionado
  const [proyectoId, setProyectoId] = useState<string>(
    sesionExistente?.proyectoId || (proyectos.length > 0 ? proyectos[0].id : '')
  );

  const proyectoSeleccionado = useMemo(() => {
    return proyectos.find((p) => p.id === proyectoId);
  }, [proyectos, proyectoId]);

  // Campos manuales de fecha y hora
  const [fechaManual, setFechaManual] = useState<string>(
    sesionExistente?.fecha || fechaInicial || (proyectoSeleccionado?.fechaProgramacion || '2026-09-15')
  );

  const [horaInicioManual, setHoraInicioManual] = useState<string>(
    sesionExistente?.horaInicio || '18:00'
  );

  const [horaFinManual, setHoraFinManual] = useState<string>(
    sesionExistente?.horaFin || '20:00'
  );

  // Docente, tema y aula
  const [nombreDocente, setNombreDocente] = useState<string>(
    sesionExistente?.nombreDocente || proyectoSeleccionado?.nombreDocente || ''
  );

  const [tema, setTema] = useState<string>(
    sesionExistente?.tema || 'Módulo Curricular: Sesión Especializada'
  );

  const [modalidad, setModalidad] = useState<'Virtual' | 'Presencial' | 'Híbrida'>(
    sesionExistente?.modalidad || (proyectoSeleccionado?.modalidad as any) || 'Virtual'
  );

  const [plataformaAula, setPlataformaAula] = useState<string>(
    sesionExistente?.plataformaAula || 
    (proyectoSeleccionado?.modalidad === 'Presencial' ? 'Aula Magna - Campus Central' : 'Google Meet / Zoom')
  );

  const [sincronizarGoogle, setSincronizarGoogle] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Cálculo de horas efectivas a partir de la hora de inicio y fin manuales
  const horasCalculadas = useMemo(() => {
    const [hIni, mIni] = horaInicioManual.split(':').map((x) => parseInt(x, 10) || 0);
    const [hFin, mFin] = horaFinManual.split(':').map((x) => parseInt(x, 10) || 0);
    const minutosInicio = hIni * 60 + mIni;
    const minutosFin = hFin * 60 + mFin;
    const diff = minutosFin - minutosInicio;
    if (diff <= 0) return 2; // default 2 horas si horario invertido
    return Math.round((diff / 60) * 10) / 10;
  }, [horaInicioManual, horaFinManual]);

  const [horasManual, setHorasManual] = useState<number>(
    sesionExistente?.horas || horasCalculadas
  );

  // Formato amigable de fecha en español (ej: Martes, 15 de Septiembre de 2026)
  const fechaFormateada = useMemo(() => {
    if (!fechaManual) return '';
    try {
      const [y, m, d] = fechaManual.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('es-HN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return fechaManual;
    }
  }, [fechaManual]);

  // Detección en vivo de solapamientos para esta fecha y docente
  const solapamientosDetectados = useMemo(() => {
    if (!nombreDocente || !fechaManual) return [];

    const [hIni, mIni] = horaInicioManual.split(':').map((x) => parseInt(x, 10) || 0);
    const [hFin, mFin] = horaFinManual.split(':').map((x) => parseInt(x, 10) || 0);
    const minInicio = hIni * 60 + mIni;
    const minFin = hFin * 60 + mFin;

    return todasLasSesiones.filter((s) => {
      // Ignorar la misma sesión que estamos editando
      if (sesionExistente && s.id === sesionExistente.id) return false;

      // Mismo docente y misma fecha
      const mismoDocente = s.nombreDocente.toLowerCase().trim() === nombreDocente.toLowerCase().trim();
      const mismaFecha = s.fecha === fechaManual;

      if (!mismoDocente || !mismaFecha) return false;

      // Comprobar cruce de horario
      const [sIniH, sIniM] = s.horaInicio.split(':').map((x) => parseInt(x, 10) || 0);
      const [sFinH, sFinM] = s.horaFin.split(':').map((x) => parseInt(x, 10) || 0);
      const sMinIni = sIniH * 60 + sIniM;
      const sMinFin = sFinH * 60 + sFinM;

      // Solapamiento: el inicio de una es menor que el fin de la otra y viceversa
      return minInicio < sMinFin && minFin > sMinIni;
    });
  }, [todasLasSesiones, nombreDocente, fechaManual, horaInicioManual, horaFinManual, sesionExistente]);

  // Presets rápidos de horarios comunes
  const presetsHorarios = [
    { label: 'Mañana (08:00 - 10:00)', ini: '08:00', fin: '10:00' },
    { label: 'Mediodía (12:00 - 14:00)', ini: '12:00', fin: '14:00' },
    { label: 'Tarde (14:00 - 17:00)', ini: '14:00', fin: '17:00' },
    { label: 'Noche 1 (18:00 - 20:00)', ini: '18:00', fin: '20:00' },
    { label: 'Noche 2 (19:00 - 21:30)', ini: '19:00', fin: '21:30' },
  ];

  const handleGuardarFormulario = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let syncGoogleExito = false;
    const hasToken = !!getCalendarAccessToken();

    // Si tiene token de Google Calendar y activó la sincronización
    if (sincronizarGoogle && hasToken) {
      try {
        const startISO = combinarFechaHoraAISO(fechaManual, horaInicioManual);
        const endISO = combinarFechaHoraAISO(fechaManual, horaFinManual);

        const nombreProg = proyectoSeleccionado?.nombreProyecto || 'Programa Educativo';

        await createGoogleCalendarEvent({
          summary: `🎓 ${nombreProg}: ${tema}`,
          description: `Docente: ${nombreDocente}\nModalidad: ${modalidad}\nAula/Acceso: ${plataformaAula}\nHoras Lectivas: ${horasManual}h\n\nAgendado manualmente desde el Módulo Curricular & Carga Docente.`,
          location: plataformaAula,
          start: {
            dateTime: startISO,
            timeZone: 'America/Tegucigalpa',
          },
          end: {
            dateTime: endISO,
            timeZone: 'America/Tegucigalpa',
          },
        });
        syncGoogleExito = true;
        onNotificarExito(`¡Clase guardada y programada en tu Google Calendar para el ${fechaManual} a las ${horaInicioManual}!`);
      } catch (err: any) {
        console.warn('No se pudo crear en Google Calendar:', err);
        onNotificarError(`Sesión guardada en el sistema, pero falló el envío a Google Calendar: ${err.message}`);
      }
    }

    onGuardar({
      proyectoId,
      numeroSesion: sesionExistente?.numeroSesion,
      fecha: fechaManual,
      horaInicio: horaInicioManual,
      horaFin: horaFinManual,
      horas: horasManual || horasCalculadas,
      tema,
      nombreDocente,
      modalidad,
      plataformaAula,
      sincronizadoGoogle: syncGoogleExito,
    });

    setIsSubmitting(false);
    onCerrar();
  };

  const hasGoogleToken = !!getCalendarAccessToken();

  return (
    <div 
      id="modal-configuracion-manual-fecha-hora"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        
        {/* Encabezado del Modal */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white px-5 py-4 flex items-center justify-between border-b border-indigo-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/30 text-indigo-300 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base tracking-tight text-white">
                {sesionExistente ? 'Modificación Manual de Fecha y Hora' : 'Colocar Manualmente Fecha y Hora'}
              </h3>
              <p className="text-[11px] text-indigo-200/80">
                {sesionExistente 
                  ? `Reprogramar sesión #${sesionExistente.numeroSesion} de ${sesionExistente.nombreProyecto}`
                  : 'Fija el día, rango horario y sincroniza con Google Calendar'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="text-slate-400 hover:text-white p-1 rounded-lg text-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleGuardarFormulario} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* 1. Selección de Programa Educativo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Programa / Proyecto Formativo
            </label>
            <select
              value={proyectoId}
              onChange={(e) => {
                setProyectoId(e.target.value);
                const p = proyectos.find((proj) => proj.id === e.target.value);
                if (p && !sesionExistente) {
                  setNombreDocente(p.nombreDocente || '');
                  if (p.modalidad) setModalidad(p.modalidad as any);
                }
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              {proyectos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombreProyecto} ({p.codigoPrograma || 'Sin Código'})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Asignación del Docente e Instructor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Docente Responsable
              </label>
              <input
                type="text"
                required
                value={nombreDocente}
                onChange={(e) => setNombreDocente(e.target.value)}
                placeholder="Nombre del instructor"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tema / Contenido de la Sesión
              </label>
              <input
                type="text"
                required
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                placeholder="Tema a impartir"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 3. SECCIÓN PRINCIPAL: CONFIGURACIÓN MANUAL DE FECHA Y HORAS */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wide text-indigo-950 flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-indigo-600" />
                Definición Manual de Fecha y Horario
              </span>
              <span className="text-[11px] font-mono text-indigo-700 font-bold bg-indigo-100/80 px-2 py-0.5 rounded-md">
                {horasCalculadas} hrs calculadas
              </span>
            </div>

            {/* Input Fecha Manual */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Fecha de la Clase (Manual)
              </label>
              <input
                type="date"
                required
                value={fechaManual}
                onChange={(e) => setFechaManual(e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-white border border-slate-300 rounded-xl font-mono font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              {fechaFormateada && (
                <p className="text-[11px] font-medium text-slate-600 capitalize mt-1 pl-1">
                  📅 {fechaFormateada}
                </p>
              )}
            </div>

            {/* Input Rango de Horario (Inicio y Fin Manuales) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Hora Inicio (Manual)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Formato 24 Horas</span>
                </label>
                <input
                  type="time"
                  required
                  value={horaInicioManual}
                  onChange={(e) => {
                    setHoraInicioManual(e.target.value);
                  }}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Hora Fin (Manual)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Formato 24 Horas</span>
                </label>
                <input
                  type="time"
                  required
                  value={horaFinManual}
                  onChange={(e) => {
                    setHoraFinManual(e.target.value);
                  }}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>

            {/* Botones de Presets Rápidos para Horarios Comunes */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                Accesos directos de horario habitual:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presetsHorarios.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setHoraInicioManual(preset.ini);
                      setHoraFinManual(preset.fin);
                    }}
                    className={`px-2.5 py-1 text-[11px] rounded-lg border font-semibold transition-all ${
                      horaInicioManual === preset.ini && horaFinManual === preset.fin
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {preset.ini} - {preset.fin}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Modalidad y Plataforma / Aula */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Modalidad
              </label>
              <select
                value={modalidad}
                onChange={(e) => setModalidad(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-semibold"
              >
                <option value="Virtual">Virtual Sincrónica</option>
                <option value="Presencial">Presencial (Campus / Aula)</option>
                <option value="Híbrida">Híbrida</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Aula / Enlace de Reunión
              </label>
              <input
                type="text"
                value={plataformaAula}
                onChange={(e) => setPlataformaAula(e.target.value)}
                placeholder="Aula Magna 102 o Enlace Zoom / Google Meet"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          {/* 5. Alerta en Vivo si se detecta Solapamiento con otra clase */}
          {solapamientosDetectados.length > 0 ? (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-rose-700">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>⚠️ Alerta de Solapamiento Detectada:</span>
              </div>
              <p className="text-[11px] text-rose-800">
                El docente <strong>{nombreDocente}</strong> ya tiene asignada otra sesión en este mismo horario ({horaInicioManual} - {horaFinManual}) el día {fechaManual}:
              </p>
              <ul className="list-disc list-inside pl-1 text-[11px] text-rose-700 font-mono">
                {solapamientosDetectados.map((c) => (
                  <li key={c.id}>
                    {c.nombreProyecto} ({c.horaInicio} - {c.horaFin})
                  </li>
                ))}
              </ul>
              <span className="text-[10px] text-rose-600 block pt-0.5">
                Puedes ajustar la hora manualmente arriba para evitar el cruce.
              </span>
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Horario disponible sin solapamientos docentes para este día.</span>
            </div>
          )}

          {/* 6. Opción de Sincronización Directa a Google Calendar */}
          <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white shadow-xs flex items-center justify-center p-1 shrink-0">
                <svg className="w-full h-full" viewBox="0 0 48 48">
                  <path fill="#4285F4" d="M38 42H10c-2.2 0-4-1.8-4-4V14c0-2.2 1.8-4 4-4h28c2.2 0 4 1.8 4 4v24c0 2.2-1.8 4-4 4z"/>
                  <path fill="#34A853" d="M10 10h28v6H10z"/>
                  <path fill="#EA4335" d="M14 6v8M34 6v8" stroke="#EA4335" strokeWidth="4" strokeLinecap="round"/>
                  <path fill="#FFF" d="M18 24h12v12H18z"/>
                </svg>
              </div>
              <div>
                <span className="font-bold text-slate-800 block">Sincronizar a Google Calendar</span>
                <span className="text-[11px] text-slate-500">
                  {hasGoogleToken 
                    ? 'Crear evento automáticamente en tu agenda principal de Google' 
                    : 'Conecta tu cuenta de Google en la barra superior para sincronizar'}
                </span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={sincronizarGoogle && hasGoogleToken}
                disabled={!hasGoogleToken}
                onChange={(e) => setSincronizarGoogle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Botones de Acción */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={onCerrar}
              className="w-full sm:w-auto px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-xl font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition-all flex items-center justify-center gap-2 hover:scale-[1.01] disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>
                {isSubmitting 
                  ? 'Guardando...' 
                  : sesionExistente 
                  ? 'Confirmar Reprogramación Manual' 
                  : 'Guardar Sesión con Fecha y Hora'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
