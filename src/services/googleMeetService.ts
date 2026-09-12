/**
 * SERVICIO GOOGLE MEET API v2 - EXCLUSIVO PARA REUNIONES DE GERENCIAS
 * SUMMIT IMPULSA GLOBAL, S.A. DE C.V.
 *
 * Esta integración está restringida exclusivamente para la coordinación,
 * comités ejecutivos y sesiones de toma de decisión de las Gerencias:
 * - Gerencia General (Dr. Walter René Pedroza / pedrozawalterrene@gmail.com)
 * - Gerencia Académica (Phd. Donal Reyes / academia.summitg@gmail.com)
 * - Gerencia de Comercialización (Msc. Lilian Ordoñez / comercial.summitg@gmail.com)
 * - Auditoría Interna / Administración (Licda. Mayra Flores / administracion.summitg@gmail.com)
 */

import { getDriveAccessToken, signInWithGoogleDrive, setDriveAccessToken } from './googleDriveService';
import { CREDENCIALES_GERENCIAS } from '../utils/gerenciasCredenciales';

export type TipoComiteGerencias = 
  | 'comite_operativo_poa'
  | 'dictamen_gerencia_general'
  | 'conciliacion_academica_comercial'
  | 'auditoria_cumplimiento'
  | 'reunion_extraordinaria';

export interface MeetSpaceResponse {
  name: string;
  meetingUri: string;
  meetingCode: string;
  config?: {
    accessType?: string;
    entryPointAccess?: string;
  };
  esInstantaneo?: boolean;
}

export interface ParticipanteGerencia {
  nombre: string;
  cargo: string;
  correo: string;
  confirmado?: boolean;
}

export interface ReunionGerenciasMeet {
  id: string;
  titulo: string;
  tipoComite: TipoComiteGerencias;
  fecha: string; // YYYY-MM-DD
  hora: string;  // HH:mm
  duracionMinutos: number;
  meetingUri: string;
  meetingCode: string;
  agendaPuntos: string[];
  participantes: ParticipanteGerencia[];
  creadoPor: string;
  creadoEn: string;
  estado: 'programada' | 'en_curso' | 'finalizada';
  notasAcuerdos?: string;
}

export const COMITES_GERENCIAS_INFO: Record<TipoComiteGerencias, {
  nombre: string;
  descripcion: string;
  agendaSugerida: string[];
  color: string;
}> = {
  comite_operativo_poa: {
    nombre: 'Comité Operativo Mensual POA 2026',
    descripcion: 'Revisión y seguimiento del cumplimiento de metas de facturación SEP - DIC 2026 (L 8,820,000.00)',
    agendaSugerida: [
      '1. Revisión de facturación acumulada del mes y deducción POA 2026',
      '2. Evaluación de proyectos en estado "Listo para Iniciar"',
      '3. Ajuste de metas y pronóstico de cierre de mes',
      '4. Plan de contingencia comercial y aceleración de inscritos',
    ],
    color: 'border-blue-500 bg-blue-50 text-blue-900',
  },
  dictamen_gerencia_general: {
    nombre: 'Sesión de Dictamen & Aprobación Final GG',
    descripcion: 'Validación de proyectos remitidos por Comercialización y aprobación para deducción del POA 2026',
    agendaSugerida: [
      '1. Lectura del informe de rentabilidad y margen de contribución',
      '2. Validación del punto de equilibrio y alumnos mínimos alcanzados',
      '3. Emisión de resolución ejecutiva y dictamen de Gerencia General',
      '4. Registro oficial de rebaja de facturación en el tablero POA 2026',
    ],
    color: 'border-purple-500 bg-purple-50 text-purple-900',
  },
  conciliacion_academica_comercial: {
    nombre: 'Mesa de Conciliación Académica - Comercial',
    descripcion: 'Alineación de cohortes, docentes asignados, fechas de inicio y metas de matrícula',
    agendaSugerida: [
      '1. Verificación de horas de clase y días lectivos programados',
      '2. Disponibilidad y contratación de docentes seleccionados',
      '3. Estado del embudo de ventas y alumnos inscritos confirmados',
      '4. Fijación de fecha definitiva de inicio y entrega de credenciales',
    ],
    color: 'border-emerald-500 bg-emerald-50 text-emerald-900',
  },
  auditoria_cumplimiento: {
    nombre: 'Comité de Auditoría Interna & Cumplimiento Fiscal',
    descripcion: 'Verificación de liquidación de retenciones de ISV 12.5%, contratos y transparencia financiera',
    agendaSugerida: [
      '1. Auditoría de recibos por honorarios profesionales de docentes',
      '2. Verificación de aplicación del 12.5% de ISV s/ honorarios',
      '3. Conciliación de ingresos cobrados vs. proyectados',
      '4. Emisión de recomendaciones de control interno institucional',
    ],
    color: 'border-amber-500 bg-amber-50 text-amber-900',
  },
  reunion_extraordinaria: {
    nombre: 'Comité Extraordinario de Gerencias',
    descripcion: 'Sesión urgente para toma de decisiones estratégicas institucionales fuera de ciclo',
    agendaSugerida: [
      '1. Planteamiento del asunto extraordinario',
      '2. Exposición de criterios por cada Gerencia',
      '3. Votación y resolución ejecutiva de Gerencia General',
      '4. Minuta de acuerdos y plazos de cumplimiento perentorio',
    ],
    color: 'border-rose-500 bg-rose-50 text-rose-900',
  },
};

export const PARTICIPANTES_DEFAULT_GERENCIAS: ParticipanteGerencia[] = [
  {
    nombre: 'Dr. Walter René Pedroza',
    cargo: 'Gerencia General (Voto Decisorio)',
    correo: 'pedrozawalterrene@gmail.com',
    confirmado: true,
  },
  {
    nombre: CREDENCIALES_GERENCIAS.academica.lider, // Phd. Donal Reyes
    cargo: 'Gerencia Académica',
    correo: CREDENCIALES_GERENCIAS.academica.correo, // academia.summitg@gmail.com
    confirmado: true,
  },
  {
    nombre: CREDENCIALES_GERENCIAS.comercial.lider, // Msc. Lilian Ordoñez
    cargo: 'Gerencia de Comercialización',
    correo: CREDENCIALES_GERENCIAS.comercial.correo, // comercial.summitg@gmail.com
    confirmado: true,
  },
  {
    nombre: 'Licda. Mayra Flores / Auditoría Interna',
    cargo: 'Auditoría Interna & Cumplimiento',
    correo: CREDENCIALES_GERENCIAS.administracion.correo, // administracion.summitg@gmail.com
    confirmado: true,
  },
];

const STORAGE_KEY_MEETINGS = 'summit_gerencias_meet_records';

export interface ParametrosCreacionEspacio {
  titulo?: string;
  tipoComite?: TipoComiteGerencias;
  fecha?: string;
  hora?: string;
  duracionMinutos?: number;
  agendaPuntos?: string[];
  participantes?: ParticipanteGerencia[];
  token?: string | null;
}

/**
 * Crea una sala de Google Meet 100% REAL Y ACTIVA en los servidores de Google:
 * 1º Intento: Vía Google Calendar Conference API (hangoutsMeet).
 *    Esta es la forma estándar garantizada en Google Workspace/Gmail: genera una sala
 *    con URL 'https://meet.google.com/xxx-yyyy-zzz' activa e inscrita en Google.
 * 2º Intento: Vía Google Meet API v2 'https://meet.googleapis.com/v2/spaces' con payload vacío.
 * 3º Fallback Seguro: 'https://meet.google.com/new', que abre Google Meet directamente y
 *    Google genera la sala en vivo al instante (sin arrojar "código erróneo o no encontrado").
 */
export async function crearEspacioGoogleMeet(
  params?: ParametrosCreacionEspacio | string | null
): Promise<MeetSpaceResponse> {
  const p: ParametrosCreacionEspacio = typeof params === 'string' 
    ? { token: params } 
    : (params || {});

  let authToken = p.token || getDriveAccessToken();

  if (!authToken) {
    try {
      const authResult = await signInWithGoogleDrive();
      authToken = authResult.accessToken;
      setDriveAccessToken(authToken);
    } catch (e) {
      console.warn('Google Meet: No se obtuvo token OAuth, se usará enlace de inicio rápido:', e);
    }
  }

  if (authToken) {
    // 1º INTENTO: Google Calendar API v3 con conferenceDataVersion=1
    // Genera una sala Google Meet oficial ('hangoutsMeet') y evita errores de "reunión no encontrada"
    try {
      const fecha = p.fecha || new Date().toISOString().split('T')[0];
      const hora = p.hora || '10:00';
      const duracion = p.duracionMinutos || 60;
      const startDateTime = `${fecha}T${hora}:00`;
      const startDate = new Date(startDateTime);
      const endDate = !isNaN(startDate.getTime())
        ? new Date(startDate.getTime() + duracion * 60000)
        : new Date(Date.now() + duracion * 60000);

      const agendaTexto = (p.agendaPuntos || []).map((pt, i) => `${i + 1}. ${pt}`).join('\n');
      const participantesLista = p.participantes || PARTICIPANTES_DEFAULT_GERENCIAS;

      const calPayload = {
        summary: `[SUMMIT GERENCIAS] ${p.titulo || 'Reunión de Gerencias'}`,
        description: `Sesión de Comités de Gerencias - Summit Impulsa Global, S.A. de C.V.\n\nAgenda:\n${agendaTexto}\n\nConvocatoria enviada a las Gerencias Institucionales.`,
        start: {
          dateTime: !isNaN(startDate.getTime()) ? startDate.toISOString() : new Date().toISOString(),
          timeZone: 'America/Tegucigalpa',
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: 'America/Tegucigalpa',
        },
        conferenceData: {
          createRequest: {
            requestId: `meet-gerencia-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        },
        attendees: participantesLista.map(part => ({
          email: part.correo,
          displayName: `${part.nombre} (${part.cargo})`,
        })),
      };

      const calRes = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(calPayload),
        }
      );

      if (calRes.ok) {
        const calData = await calRes.json();
        const hangoutLink = 
          calData.hangoutLink || 
          calData.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri;

        if (hangoutLink) {
          const code = hangoutLink.replace('https://meet.google.com/', '').trim();
          return {
            name: `spaces/${code}`,
            meetingUri: hangoutLink,
            meetingCode: code,
          };
        }
      } else {
        const errCal = await calRes.text();
        console.warn('Calendar Conference API no generó link directo:', errCal);
      }
    } catch (calError) {
      console.warn('Error al intentar Calendar Conference API:', calError);
    }

    // 2º INTENTO: Google Meet API v2 Spaces (con body vacío conforme a la especificación)
    try {
      const meetRes = await fetch('https://meet.googleapis.com/v2/spaces', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (meetRes.ok) {
        const meetData = await meetRes.json();
        if (meetData.meetingUri) {
          const code = meetData.meetingCode || meetData.meetingUri.replace('https://meet.google.com/', '');
          return {
            name: meetData.name || `spaces/${code}`,
            meetingUri: meetData.meetingUri,
            meetingCode: code,
            config: meetData.config,
          };
        }
      } else {
        const errMeet = await meetRes.text();
        console.warn('Google Meet API v2 error:', errMeet);
      }
    } catch (meetError) {
      console.warn('Error al llamar Google Meet API v2:', meetError);
    }
  }

  // 3º FALLBACK SEGURO: Enlace de creación instantánea directa de Google Meet
  // Al hacer clic, Google Meet crea la sala de inmediato y sin error de código.
  return {
    name: 'spaces/new',
    meetingUri: 'https://meet.google.com/new',
    meetingCode: 'meet.google.com/new',
    esInstantaneo: true,
  };
}

export interface MeetUrlSanitizada {
  meetingUri: string;
  meetingCode: string;
  esCodigoValido: boolean;
  esInstantaneo: boolean;
}

/**
 * Normaliza y valida estrictamente cualquier URL o código de Google Meet:
 * - Evita duplicaciones como 'https://meet.google.com/meet.google.com/...'
 * - Evita códigos de ejemplo como 'xxx-yyyy-zzz'
 * - Extrae el código canónico de 10 letras [a-z]{3}-[a-z]{4}-[a-z]{3}
 * - Si es 'new' o inicio en vivo, garantiza 'https://meet.google.com/new'
 */
export function sanitizarEnlaceGoogleMeet(entradaRaw?: string | null): MeetUrlSanitizada {
  if (!entradaRaw || typeof entradaRaw !== 'string') {
    return {
      meetingUri: 'https://meet.google.com/new',
      meetingCode: 'meet.google.com/new',
      esCodigoValido: false,
      esInstantaneo: true,
    };
  }

  let texto = entradaRaw.trim();

  // Limpiar dobles prefijos accidentales producidos por concatenaciones
  texto = texto.replace(/^https?:\/\/meet\.google\.com\/https?:\/\/meet\.google\.com\//i, 'https://meet.google.com/');
  texto = texto.replace(/^https?:\/\/meet\.google\.com\/meet\.google\.com\//i, 'https://meet.google.com/');
  texto = texto.replace(/^meet\.google\.com\/meet\.google\.com\//i, 'meet.google.com/');

  // Si es o contiene 'new' (sala instantánea legítima de Google)
  if (
    texto.toLowerCase() === 'new' ||
    texto.toLowerCase().endsWith('/new') ||
    texto.toLowerCase().includes('meet.google.com/new')
  ) {
    return {
      meetingUri: 'https://meet.google.com/new',
      meetingCode: 'meet.google.com/new',
      esCodigoValido: false,
      esInstantaneo: true,
    };
  }

  // Descartar placeholders o textos que Google Meet rechaza con "Verifica el código de reunión"
  if (
    texto.includes('xxx-yyyy-zzz') ||
    texto.includes('sum-poa') ||
    texto.includes('meet-comite') ||
    texto.includes('meet-gerencia') ||
    texto.includes('Enlace Oficial') ||
    texto.includes('Iniciar en vivo') ||
    texto.includes(' ')
  ) {
    return {
      meetingUri: 'https://meet.google.com/new',
      meetingCode: 'meet.google.com/new',
      esCodigoValido: false,
      esInstantaneo: true,
    };
  }

  // Buscar patrón canónico de Google Meet: 3 letras - 4 letras - 3 letras
  const matchHyphens = texto.match(/([a-z]{3})-([a-z]{4})-([a-z]{3})/i);
  if (matchHyphens) {
    const code = `${matchHyphens[1]}-${matchHyphens[2]}-${matchHyphens[3]}`.toLowerCase();
    return {
      meetingUri: `https://meet.google.com/${code}`,
      meetingCode: code,
      esCodigoValido: true,
      esInstantaneo: false,
    };
  }

  // Buscar 10 letras consecutivas sin guiones (ejemplo: abcdefghij)
  const matchCompact = texto.match(/\b([a-z]{3})([a-z]{4})([a-z]{3})\b/i);
  if (matchCompact) {
    const code = `${matchCompact[1]}-${matchCompact[2]}-${matchCompact[3]}`.toLowerCase();
    return {
      meetingUri: `https://meet.google.com/${code}`,
      meetingCode: code,
      esCodigoValido: true,
      esInstantaneo: false,
    };
  }

  // Si no encaja con ningún código real, retornar creación instantánea segura
  return {
    meetingUri: 'https://meet.google.com/new',
    meetingCode: 'meet.google.com/new',
    esCodigoValido: false,
    esInstantaneo: true,
  };
}

/**
 * Genera un enlace web directo para programar la reunión en Google Calendar
 * con Google Meet habilitado y con los 4 correos de las Gerencias pre-cargados
 */
export function generarEnlaceGoogleCalendarWeb(reunion: ReunionGerenciasMeet): string {
  const sanitize = sanitizarEnlaceGoogleMeet(reunion.meetingUri);
  const titulo = encodeURIComponent(`[SUMMIT GERENCIAS] ${reunion.titulo}`);
  
  const startStr = `${reunion.fecha.replace(/-/g, '')}T${reunion.hora.replace(':', '')}00`;
  const [h, m] = reunion.hora.split(':').map(Number);
  const durMin = reunion.duracionMinutos || 60;
  const totalMin = (h || 10) * 60 + (m || 0) + durMin;
  const endH = String(Math.floor(totalMin / 60) % 24).padStart(2, '0');
  const endM = String(totalMin % 60).padStart(2, '0');
  const endStr = `${reunion.fecha.replace(/-/g, '')}T${endH}${endM}00`;

  const agenda = (reunion.agendaPuntos || []).map((p, i) => `${i + 1}. ${p}`).join('%0A');
  const detalles = encodeURIComponent(
    `Sesión Oficial de Gerencias - Summit Impulsa Global, S.A. de C.V.\n\n` +
    `Sala Google Meet: ${sanitize.meetingUri}\n` +
    `Código: ${sanitize.meetingCode}\n\n` +
    `Agenda:\n`
  ) + agenda;

  const emails = (reunion.participantes || PARTICIPANTES_DEFAULT_GERENCIAS)
    .map(p => p.correo)
    .join(',');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titulo}&dates=${startStr}/${endStr}&details=${detalles}&add=${emails}`;
}

/**
 * Normaliza o repara reuniones guardadas previamente con códigos de prueba no válidos
 */
function repararReunionesGuardadas(lista: ReunionGerenciasMeet[]): ReunionGerenciasMeet[] {
  return lista.map(r => {
    const sanitizado = sanitizarEnlaceGoogleMeet(r.meetingUri || r.meetingCode);
    return {
      ...r,
      meetingUri: sanitizado.meetingUri,
      meetingCode: sanitizado.meetingCode,
    };
  });
}

/**
 * Guardar y recuperar reuniones programadas de gerencias en almacenamiento local
 */
export function obtenerReunionesGerenciasGuardadas(): ReunionGerenciasMeet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MEETINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const reparadas = repararReunionesGuardadas(parsed);
        guardarReunionesGerencias(reparadas);
        return reparadas;
      }
    }
  } catch (e) {
    console.warn('Error al leer reuniones de gerencias:', e);
  }

  const hoy = new Date();
  const fechaHoy = hoy.toISOString().split('T')[0];

  const defaultReuniones: ReunionGerenciasMeet[] = [
    {
      id: 'meet-comite-poa-inicial',
      titulo: 'Comité Ordinario de Gerencias: Cumplimiento POA 2026',
      tipoComite: 'comite_operativo_poa',
      fecha: fechaHoy,
      hora: '10:00',
      duracionMinutos: 60,
      meetingUri: 'https://meet.google.com/new',
      meetingCode: 'meet.google.com/new',
      agendaPuntos: COMITES_GERENCIAS_INFO.comite_operativo_poa.agendaSugerida,
      participantes: PARTICIPANTES_DEFAULT_GERENCIAS,
      creadoPor: 'Dr. Walter René Pedroza - Gerencia General',
      creadoEn: new Date().toISOString(),
      estado: 'programada',
      notasAcuerdos: 'Sesión oficial para seguimiento de proyectos en comercialización y rebajas al POA 2026.',
    },
  ];

  guardarReunionesGerencias(defaultReuniones);
  return defaultReuniones;
}

export function guardarReunionesGerencias(reuniones: ReunionGerenciasMeet[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_MEETINGS, JSON.stringify(reuniones));
  } catch (e) {
    console.warn('Error al guardar reuniones de gerencias:', e);
  }
}

export function registrarNuevaReunionGerencias(reunion: ReunionGerenciasMeet): ReunionGerenciasMeet[] {
  const actuales = obtenerReunionesGerenciasGuardadas();
  const actualizadas = [reunion, ...actuales.filter(r => r.id !== reunion.id)];
  guardarReunionesGerencias(actualizadas);
  return actualizadas;
}

/**
 * Modificar TODOS los elementos de una reunión
 */
export function actualizarReunionGerenciasCompleta(reunionActualizada: ReunionGerenciasMeet): ReunionGerenciasMeet[] {
  const actuales = obtenerReunionesGerenciasGuardadas();
  const actualizadas = actuales.map(r => r.id === reunionActualizada.id ? reunionActualizada : r);
  guardarReunionesGerencias(actualizadas);
  return actualizadas;
}

/**
 * Eliminar (borrar) una reunión de la lista
 */
export function eliminarReunionGerencias(reunionId: string): ReunionGerenciasMeet[] {
  const actuales = obtenerReunionesGerenciasGuardadas();
  const actualizadas = actuales.filter(r => r.id !== reunionId);
  guardarReunionesGerencias(actualizadas);
  return actualizadas;
}

export function actualizarEstadoReunionGerencias(
  reunionId: string, 
  nuevoEstado: 'programada' | 'en_curso' | 'finalizada',
  notasAcuerdos?: string
): ReunionGerenciasMeet[] {
  const actuales = obtenerReunionesGerenciasGuardadas();
  const actualizadas = actuales.map(r => {
    if (r.id === reunionId) {
      return {
        ...r,
        estado: nuevoEstado,
        notasAcuerdos: notasAcuerdos !== undefined ? notasAcuerdos : r.notasAcuerdos,
      };
    }
    return r;
  });
  guardarReunionesGerencias(actualizadas);
  return actualizadas;
}

/**
 * Genera el cuerpo en HTML formal para la convocatoria institucional
 */
export function generarHtmlConvocatoriaGerencias(reunion: ReunionGerenciasMeet): string {
  const sanitize = sanitizarEnlaceGoogleMeet(reunion.meetingUri || reunion.meetingCode);
  const agendaList = reunion.agendaPuntos.map(pt => `<li style="margin-bottom: 6px;">${pt}</li>`).join('');
  const participantesList = reunion.participantes.map(p => `
    <tr>
      <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #1e293b;">${p.nombre}</td>
      <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; color: #4338ca;">${p.cargo}</td>
      <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; color: #64748b;">${p.correo}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Convocatoria Institucional - ${reunion.titulo}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
    .card { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); color: #ffffff; padding: 24px; text-align: center; }
    .content { padding: 24px; color: #334155; }
    .btn-meet { display: inline-block; background: #059669; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: bold; margin: 16px 0; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; background: #dcfce7; color: #166534; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #34d399; margin-bottom: 6px;">
        SUMMIT IMPULSA GLOBAL, S.A. DE C.V.
      </div>
      <h2 style="margin: 0; font-size: 20px; font-weight: 900;">CONVOCATORIA A REUNIÓN DE GERENCIAS</h2>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #cbd5e1;">${reunion.titulo}</p>
    </div>

    <div class="content">
      <p style="margin-top: 0; font-size: 14px;">
        Estimados Líderes de las Gerencias Institucionales,<br/>
        Por medio de la presente se les convoca formalmente a la sesión directiva:
      </p>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; width: 140px;"><strong>📅 Fecha:</strong></td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: bold;">${reunion.fecha}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>⏰ Hora:</strong></td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: bold;">${reunion.hora} (${reunion.duracionMinutos} minutos)</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>🏢 Carácter:</strong></td>
          <td style="padding: 6px 0;"><span class="badge">${COMITES_GERENCIAS_INFO[reunion.tipoComite]?.nombre || reunion.tipoComite}</span></td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>🔑 Código Meet:</strong></td>
          <td style="padding: 6px 0; font-family: monospace; font-weight: bold; color: #4338ca;">${sanitize.meetingCode}</td>
        </tr>
      </table>

      <div style="text-align: center; margin: 20px 0;">
        <a href="${sanitize.meetingUri}" target="_blank" class="btn-meet">
          📹 Ingresar a la Sala en Google Meet
        </a>
        <div style="font-size: 11px; color: #64748b; font-family: monospace; margin-top: 4px;">
          ${sanitize.meetingUri}
        </div>
      </div>

      <h4 style="margin: 20px 0 8px 0; font-size: 14px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
        📌 Agenda de Puntos Institucionales
      </h4>
      <ul style="font-size: 13px; color: #334155; padding-left: 20px;">
        ${agendaList}
      </ul>

      <h4 style="margin: 20px 0 8px 0; font-size: 14px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
        👥 Gerencias Convocadas (Asistencia Oficial)
      </h4>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="background: #f1f5f9; text-align: left;">
            <th style="padding: 6px 10px;">Nombre</th>
            <th style="padding: 6px 10px;">Gerencia / Cargo</th>
            <th style="padding: 6px 10px;">Correo Destino</th>
          </tr>
        </thead>
        <tbody>
          ${participantesList}
        </tbody>
      </table>

      ${reunion.notasAcuerdos ? `
      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px; margin-top: 20px; font-size: 12px; color: #1e3a8a;">
        <strong>Nota / Instrucción de Gerencia General:</strong><br/>
        ${reunion.notasAcuerdos.replace(/\n/g, '<br/>')}
      </div>
      ` : ''}
    </div>

    <div style="background: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
      Summit Impulsa Global, S.A. de C.V. — Sistema de Gobernanza Directiva POA 2026<br/>
      Convocatoria exclusiva para Gerencias Institucionales.
    </div>
  </div>
</body>
</html>
  `.trim();
}

export interface ResultadoEnvioGerencias {
  exitoso: boolean;
  destinatariosEnviados: {
    nombre: string;
    cargo: string;
    correo: string;
    enviado: boolean;
    error?: string;
  }[];
  errorGeneral?: string;
}

/**
 * Envia la invitación al correo de cada una de las gerencias:
 * - pedrozawalterrene@gmail.com (Gerencia General)
 * - academia.summitg@gmail.com (Gerencia Académica)
 * - comercial.summitg@gmail.com (Gerencia Comercial)
 * - administracion.summitg@gmail.com (Auditoría Interna / Administración)
 */
export async function enviarConvocatoriaGerenciasEmail(
  reunion: ReunionGerenciasMeet,
  correoEspecifico?: string
): Promise<ResultadoEnvioGerencias> {
  const participantes = correoEspecifico
    ? reunion.participantes.filter(p => p.correo.toLowerCase() === correoEspecifico.toLowerCase())
    : reunion.participantes;

  let token = getDriveAccessToken();
  if (!token) {
    try {
      const auth = await signInWithGoogleDrive();
      token = auth.accessToken;
      setDriveAccessToken(token);
    } catch (e) {
      console.warn('OAuth para envío por Gmail no disponible:', e);
    }
  }

  const cuerpoHtml = generarHtmlConvocatoriaGerencias(reunion);
  const asunto = `[CONVOCATORIA GERENCIAS] ${reunion.titulo} - ${reunion.fecha} ${reunion.hora}`;
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(asunto)))}?=`;

  const resultados = [];

  for (const part of participantes) {
    if (!token) {
      resultados.push({
        nombre: part.nombre,
        cargo: part.cargo,
        correo: part.correo,
        enviado: false,
        error: 'Requiere autorización de Google para envío directo vía API',
      });
      continue;
    }

    try {
      const emailLines = [
        `To: ${part.correo}`,
        `Subject: ${utf8Subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        '',
        cuerpoHtml,
      ];

      const emailRaw = emailLines.join('\r\n');
      const base64UrlEmail = btoa(unescape(encodeURIComponent(emailRaw)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: base64UrlEmail,
        }),
      });

      if (response.ok) {
        resultados.push({
          nombre: part.nombre,
          cargo: part.cargo,
          correo: part.correo,
          enviado: true,
        });
      } else {
        const errJson = await response.json().catch(() => ({}));
        resultados.push({
          nombre: part.nombre,
          cargo: part.cargo,
          correo: part.correo,
          enviado: false,
          error: errJson?.error?.message || `HTTP ${response.status}`,
        });
      }
    } catch (err: any) {
      resultados.push({
        nombre: part.nombre,
        cargo: part.cargo,
        correo: part.correo,
        enviado: false,
        error: err.message || 'Error al conectar con Gmail API',
      });
    }
  }

  const algunExitoso = resultados.some(r => r.enviado);
  return {
    exitoso: algunExitoso,
    destinatariosEnviados: resultados,
  };
}

