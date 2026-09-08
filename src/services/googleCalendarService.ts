import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Scopes requeridos y configurados para Google Calendar y Google Drive
export const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/drive.file',
];

// Inicialización segura de Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => {
  provider.addScope(scope);
});
// Solicitar acceso offline si fuera necesario y forzar selección de cuenta si lo desea
provider.setCustomParameters({
  prompt: 'consent',
});

// Cache del access token en memoria y sessionStorage
const TOKEN_STORAGE_KEY = 'summit_google_oauth_token';
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const getCachedOAuthToken = (): string | null => {
  if (cachedAccessToken) return cachedAccessToken;
  try {
    const saved = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (saved) {
      cachedAccessToken = saved;
      return saved;
    }
  } catch (e) {
    console.warn(e);
  }
  return null;
};

export const setCachedOAuthToken = (token: string | null) => {
  cachedAccessToken = token;
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch (e) {
    console.warn(e);
  }
};

/**
 * Inicializa el listener de autenticación con Google
 */
export const initGoogleCalendarAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const activeToken = getCachedOAuthToken();
      if (activeToken) {
        if (onAuthSuccess) onAuthSuccess(user, activeToken);
      } else if (!isSigningIn) {
        if (onAuthSuccess) onAuthSuccess(user, null);
      }
    } else {
      setCachedOAuthToken(null);
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Iniciar sesión con Google con los scopes de Google Calendar y Drive
 */
export const signInWithGoogleCalendar = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isDriveSigningIn();
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;

    if (!token) {
      throw new Error('No se pudo obtener el token de acceso de Google.');
    }

    setCachedOAuthToken(token);
    return { user: result.user, accessToken: token };
  } catch (error: any) {
    console.error('Error al conectar con Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

const isDriveSigningIn = () => {};

/**
 * Obtener el token de acceso en memoria
 */
export const getCalendarAccessToken = (): string | null => {
  return getCachedOAuthToken();
};

/**
 * Cerrar sesión de Google Calendar
 */
export const signOutGoogleCalendar = async (): Promise<void> => {
  await signOut(auth);
  setCachedOAuthToken(null);
};

export interface GoogleCalendarEventPayload {
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string; // Formato ISO 8601 con offset o UTC
    date?: string; // Formato YYYY-MM-DD para eventos de todo el día
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: { email: string; displayName?: string }[];
  reminders?: {
    useDefault: boolean;
    overrides?: { method: 'email' | 'popup'; minutes: number }[];
  };
}

export interface GoogleCalendarEventResponse {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  status?: string;
}

/**
 * Obtiene los eventos del calendario principal del usuario
 */
export const fetchGoogleCalendarEvents = async (
  timeMin?: string,
  timeMax?: string
): Promise<GoogleCalendarEventResponse[]> => {
  const token = cachedAccessToken;
  if (!token) {
    throw new Error('Debes iniciar sesión con Google Calendar para ver eventos.');
  }

  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', '100');

  if (timeMin) {
    url.searchParams.set('timeMin', timeMin);
  } else {
    // Por defecto desde el inicio del mes actual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    url.searchParams.set('timeMin', startOfMonth.toISOString());
  }

  if (timeMax) {
    url.searchParams.set('timeMax', timeMax);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error?.message || `Error HTTP ${response.status} de Google Calendar API`;
    throw new Error(message);
  }

  const data = await response.json();
  return data.items || [];
};

/**
 * Crea un evento en el Google Calendar principal del usuario
 */
export const createGoogleCalendarEvent = async (
  eventPayload: GoogleCalendarEventPayload
): Promise<GoogleCalendarEventResponse> => {
  const token = cachedAccessToken;
  if (!token) {
    throw new Error('Debes iniciar sesión con Google Calendar para programar eventos.');
  }

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventPayload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error?.message || `Error HTTP ${response.status} al crear evento en Google Calendar`;
    throw new Error(message);
  }

  return await response.json();
};

/**
 * Convierte fecha manual YYYY-MM-DD y hora manual HH:mm a formato ISO con zona horaria
 */
export function combinarFechaHoraAISO(fechaStr: string, horaStr: string): string {
  // Asegurar formato YYYY-MM-DD
  const fechaPartes = fechaStr.split('-');
  const y = parseInt(fechaPartes[0], 10) || 2026;
  const m = parseInt(fechaPartes[1], 10) || 9;
  const d = parseInt(fechaPartes[2], 10) || 1;

  // Asegurar formato HH:mm
  const horaPartes = horaStr.split(':');
  const h = parseInt(horaPartes[0], 10) || 18;
  const min = parseInt(horaPartes[1], 10) || 0;

  // Creamos el objeto Date local
  const date = new Date(y, m - 1, d, h, min, 0);

  // Obtener offset local en formato ±HH:mm (por ej. -06:00 para Tegucigalpa / Honduras)
  const offsetMin = -date.getTimezoneOffset();
  const signo = offsetMin >= 0 ? '+' : '-';
  const offsetHoras = Math.floor(Math.abs(offsetMin) / 60).toString().padStart(2, '0');
  const offsetMinutos = (Math.abs(offsetMin) % 60).toString().padStart(2, '0');
  const offsetStr = `${signo}${offsetHoras}:${offsetMinutos}`;

  const yyyy = date.getFullYear();
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  const hh = date.getHours().toString().padStart(2, '0');
  const mi = date.getMinutes().toString().padStart(2, '0');

  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:00${offsetStr}`;
}
