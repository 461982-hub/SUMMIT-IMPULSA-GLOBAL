import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  RefreshCw, 
  UploadCloud, 
  LogOut, 
  ExternalLink, 
  AlertCircle,
  Clock,
  Sparkles,
  Plus
} from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  initGoogleCalendarAuth, 
  signInWithGoogleCalendar, 
  signOutGoogleCalendar,
  fetchGoogleCalendarEvents,
  createGoogleCalendarEvent,
  GoogleCalendarEventResponse,
  combinarFechaHoraAISO
} from '../../services/googleCalendarService';
import { SesionCalendarioMaestro } from './AcademicMasterFacultyCalendarView';

interface GoogleCalendarIntegrationBarProps {
  todasLasSesiones: SesionCalendarioMaestro[];
  onEventosGoogleCargados: (eventos: GoogleCalendarEventResponse[]) => void;
  onAbrirProgramadorManual: (fechaPrevia?: string) => void;
  onNotificarExito: (msg: string) => void;
  onNotificarError: (msg: string) => void;
}

export const GoogleCalendarIntegrationBar: React.FC<GoogleCalendarIntegrationBarProps> = ({
  todasLasSesiones,
  onEventosGoogleCargados,
  onAbrirProgramadorManual,
  onNotificarExito,
  onNotificarError,
}) => {
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [hasCalendarToken, setHasCalendarToken] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null);
  const [totalEventosSincronizados, setTotalEventosSincronizados] = useState<number>(0);
  const [ultimaSincronizacion, setUltimaSincronizacion] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initGoogleCalendarAuth(
      (user, token) => {
        setGoogleUser(user);
        setHasCalendarToken(!!token);
        if (token) {
          cargarEventosGoogle();
        }
      },
      () => {
        setGoogleUser(null);
        setHasCalendarToken(false);
        onEventosGoogleCargados([]);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleConectarGoogle = async () => {
    try {
      setIsAuthenticating(true);
      const { user, accessToken } = await signInWithGoogleCalendar();
      setGoogleUser(user);
      setHasCalendarToken(!!accessToken);
      onNotificarExito(`¡Conectado exitosamente con Google Calendar como ${user.displayName || user.email}!`);
      await cargarEventosGoogle();
    } catch (err: any) {
      console.error('Error al conectar Google Calendar:', err);
      onNotificarError(err.message || 'No se pudo completar la conexión con Google Calendar.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDesconectarGoogle = async () => {
    try {
      await signOutGoogleCalendar();
      setGoogleUser(null);
      setHasCalendarToken(false);
      onEventosGoogleCargados([]);
      onNotificarExito('Sesión de Google Calendar desconectada.');
    } catch (err: any) {
      console.error('Error al desconectar:', err);
      onNotificarError('Error al cerrar sesión de Google Calendar.');
    }
  };

  const cargarEventosGoogle = async () => {
    try {
      setIsSyncing(true);
      const eventos = await fetchGoogleCalendarEvents();
      onEventosGoogleCargados(eventos);
      setTotalEventosSincronizados(eventos.length);
      const now = new Date();
      setUltimaSincronizacion(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err: any) {
      console.error('Error al cargar eventos de Google Calendar:', err);
      // Si el token expira o falta reautenticación
      if (err.message?.includes('token') || err.message?.includes('401') || err.message?.includes('403')) {
        setHasCalendarToken(false);
        onNotificarError('Se requiere renovar el permiso de Google Calendar. Haz clic en Conectar.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportarTodasLasClases = async () => {
    if (!hasCalendarToken) {
      onNotificarError('Debes conectar tu cuenta de Google Calendar primero.');
      return;
    }

    if (todasLasSesiones.length === 0) {
      onNotificarError('No hay sesiones programadas en este momento para exportar.');
      return;
    }

    try {
      setIsExporting(true);
      setExportProgress({ current: 0, total: todasLasSesiones.length });
      let creados = 0;

      for (let i = 0; i < todasLasSesiones.length; i++) {
        const s = todasLasSesiones[i];
        setExportProgress({ current: i + 1, total: todasLasSesiones.length });

        const startISO = combinarFechaHoraAISO(s.fecha, s.horaInicio);
        const endISO = combinarFechaHoraAISO(s.fecha, s.horaFin);

        try {
          await createGoogleCalendarEvent({
            summary: `🎓 ${s.nombreProyecto} - Sesión #${s.numeroSesion}`,
            description: `Docente Responsable: ${s.nombreDocente}\nTema: ${s.tema}\nCódigo Programa: ${s.codigoPrograma}\nModalidad: ${s.modalidad}\nAula/Plataforma: ${s.plataformaAula}\n\nGenerado desde el Módulo de Control Curricular & Carga Docente.`,
            location: s.plataformaAula || (s.modalidad === 'Presencial' ? 'Aula Magna' : 'Google Meet / Zoom'),
            start: {
              dateTime: startISO,
              timeZone: 'America/Tegucigalpa',
            },
            end: {
              dateTime: endISO,
              timeZone: 'America/Tegucigalpa',
            },
          });
          creados++;
        } catch (err) {
          console.warn(`Error al subir clase #${s.numeroSesion}:`, err);
        }
      }

      onNotificarExito(`¡${creados} clases fueron exportadas a tu Google Calendar correctamente!`);
      await cargarEventosGoogle();
    } catch (err: any) {
      onNotificarError(err.message || 'Ocurrió un problema durante la sincronización a Google Calendar.');
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  return (
    <div 
      id="barra-conexion-google-calendar"
      className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 border border-indigo-500/30 shadow-sm"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Lado izquierdo: Identidad de Google Calendar & Estado */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white p-2 flex items-center justify-center shrink-0 shadow-sm">
            {/* SVG oficial de Google Calendar */}
            <svg className="w-full h-full" viewBox="0 0 48 48">
              <path fill="#4285F4" d="M38 42H10c-2.2 0-4-1.8-4-4V14c0-2.2 1.8-4 4-4h28c2.2 0 4 1.8 4 4v24c0 2.2-1.8 4-4 4z"/>
              <path fill="#34A853" d="M10 10h28v6H10z"/>
              <path fill="#EA4335" d="M14 6v8M34 6v8" stroke="#EA4335" strokeWidth="4" strokeLinecap="round"/>
              <path fill="#FFF" d="M18 24h12v12H18z"/>
              <circle cx="24" cy="30" r="4" fill="#4285F4"/>
            </svg>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                Sincronización con Google Calendar
              </h3>
              {googleUser && hasCalendarToken ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Conectado y Activo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  No Conectado
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 mt-0.5">
              {googleUser && hasCalendarToken ? (
                <span>
                  Sincronizado con: <strong className="text-white font-medium">{googleUser.email}</strong>
                  {ultimaSincronizacion && ` • Última sinc.: ${ultimaSincronizacion}`}
                  {totalEventosSincronizados > 0 && ` (${totalEventosSincronizados} eventos leídos)`}
                </span>
              ) : (
                <span>Conecta tu cuenta de Google para agendar, actualizar y reflejar las clases en tu calendario institucional o personal.</span>
              )}
            </p>
          </div>
        </div>

        {/* Lado derecho: Acciones y Botón Oficial de Google */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Botón de Colocar Fecha y Hora Manual */}
          <button
            type="button"
            onClick={() => onAbrirProgramadorManual()}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-xs transition-all border border-indigo-400/40 hover:scale-[1.02]"
            title="Ingresar manualmente fecha y hora para una sesión o clase"
          >
            <Clock className="w-3.5 h-3.5 text-indigo-200" />
            <span>Colocar Fecha & Hora Manual</span>
          </button>

          {googleUser && hasCalendarToken ? (
            <>
              {/* Actualizar / Recargar Eventos */}
              <button
                type="button"
                onClick={cargarEventosGoogle}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-xs transition-all border border-white/10 disabled:opacity-50"
                title="Actualizar eventos desde Google Calendar"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-300 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sincronizando...' : 'Recargar Agenda'}</span>
              </button>

              {/* Exportar Todas las Clases al Google Calendar */}
              <button
                type="button"
                onClick={handleExportarTodasLasClases}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-all shadow-xs disabled:opacity-50"
                title="Publicar todas las clases de la cartera actual a tu Google Calendar"
              >
                <UploadCloud className="w-3.5 h-3.5 text-emerald-100" />
                <span>
                  {isExporting && exportProgress 
                    ? `Subiendo (${exportProgress.current}/${exportProgress.total})...`
                    : 'Exportar Clases a Google'}
                </span>
              </button>

              {/* Cerrar Sesión */}
              <button
                type="button"
                onClick={handleDesconectarGoogle}
                className="p-2 bg-white/10 hover:bg-rose-500/30 text-slate-300 hover:text-rose-200 rounded-xl transition-all border border-white/10"
                title="Desconectar Google Calendar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            /* Botón Oficial "Conectar con Google" */
            <button
              type="button"
              onClick={handleConectarGoogle}
              disabled={isAuthenticating}
              className="group relative flex items-center gap-2.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 rounded-xl font-bold text-xs shadow-md transition-all border border-slate-200 hover:shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {isAuthenticating ? (
                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
              ) : (
                /* Icono SVG de Google */
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
              )}
              <span className="tracking-tight text-slate-800">
                {isAuthenticating ? 'Conectando...' : 'Conectar con Google Calendar'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
