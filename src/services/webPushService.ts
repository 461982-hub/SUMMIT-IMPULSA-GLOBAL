import { ConfiguracionWebPush, EventoCriticoProyecto, TipoEventoCriticoWebPush } from '../types';
import { reproducirAlertaSonoraRechazo } from '../utils/audioAlertUtils';

const STORAGE_KEY_CONFIG = 'summit_webpush_config_v2';
const STORAGE_KEY_SUBSCRIPTION = 'summit_webpush_sub_v2';
const STORAGE_KEY_HISTORIAL = 'summit_webpush_historial_v2';

// Clave pública VAPID oficial (P-256 descompresa en base64url)
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZ_W9ZsAOYoWm36WUfZ HKb29ydFTrrWBQWC1UODs';

/**
 * Convierte una clave VAPID base64url a Uint8Array requerido por PushManager
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64.replace(/\s+/g, ''));
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Configuración por defecto
 */
export const CONFIG_WEBPUSH_DEFAULT: ConfiguracionWebPush = {
  habilitado: false,
  gerenciaObjetivo: 'todas',
  eventos: {
    aprobacionGG: true,
    rechazoGG: true,
    nuevoSilabo: true,
    cambioEstadoProyecto: true,
    cierreMensualPOA: true,
    alertaAforoCupos: true,
  },
  sonidoHabilitado: true,
  vibracionHabilitada: true,
};

let serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

/**
 * Verifica si el navegador soporta Web Push y Notificaciones
 */
export function soportaWebPush(): boolean {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'Notification' in window;
}

/**
 * Verifica si la aplicación se ejecuta dentro de un iframe (como en el preview)
 */
export function estaEnIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

/**
 * Obtiene el estado actual de los permisos del navegador
 */
export function obtenerEstadoPermiso(): NotificationPermission | 'no_soportado' {
  if (!soportaWebPush()) return 'no_soportado';
  return Notification.permission;
}

/**
 * Carga la configuración guardada en localStorage
 */
export function obtenerConfiguracionWebPush(): ConfiguracionWebPush {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (!raw) return CONFIG_WEBPUSH_DEFAULT;
    return { ...CONFIG_WEBPUSH_DEFAULT, ...JSON.parse(raw) };
  } catch {
    return CONFIG_WEBPUSH_DEFAULT;
  }
}

/**
 * Guarda la configuración en localStorage
 */
export function guardarConfiguracionWebPush(config: ConfiguracionWebPush): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Error al guardar configuración Web Push:', e);
  }
}

/**
 * Obtiene el historial de alertas críticas enviadas
 */
export function obtenerHistorialWebPush(): EventoCriticoProyecto[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORIAL);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Guarda una alerta en el historial
 */
function registrarEnHistorial(evento: EventoCriticoProyecto): void {
  try {
    const actual = obtenerHistorialWebPush();
    const actualizado = [
      {
        ...evento,
        id: evento.id || `push-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        fechaHora: evento.fechaHora || new Date().toLocaleString('es-HN'),
      },
      ...actual,
    ].slice(0, 30);
    localStorage.setItem(STORAGE_KEY_HISTORIAL, JSON.stringify(actualizado));
  } catch (e) {
    console.error('Error guardando en historial Web Push:', e);
  }
}

/**
 * Limpia el historial de alertas Web Push
 */
export function limpiarHistorialWebPush(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_HISTORIAL);
  } catch (e) {
    console.error('Error al limpiar historial Web Push:', e);
  }
}

/**
 * Registra el Service Worker en /sw.js
 */
export async function registrarServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!soportaWebPush()) return null;

  try {
    if (serviceWorkerRegistration) {
      return serviceWorkerRegistration;
    }

    const reg = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    serviceWorkerRegistration = reg;
    console.log('[WebPush] Service Worker registrado exitosamente:', reg.scope);
    return reg;
  } catch (error) {
    console.warn('[WebPush] No se pudo registrar Service Worker (posible contexto iframe o sin SSL):', error);
    return null;
  }
}

/**
 * Solicita permisos de notificación al usuario y suscribe al Service Worker en el PushManager
 */
export async function activarWebPush(
  gerenciaObjetivo: 'todas' | 'general' | 'academica' | 'comercializacion' = 'todas'
): Promise<{
  exito: boolean;
  permiso: NotificationPermission | 'no_soportado';
  mensaje: string;
  subscription?: PushSubscriptionJSON;
}> {
  if (!soportaWebPush()) {
    return {
      exito: false,
      permiso: 'no_soportado',
      mensaje: 'Este navegador o entorno no tiene soporte para la API de Notificaciones o Service Workers.',
    };
  }

  try {
    // 1. Solicitar permiso al navegador
    const permiso = await Notification.requestPermission();

    if (permiso !== 'granted') {
      const config = obtenerConfiguracionWebPush();
      guardarConfiguracionWebPush({ ...config, habilitado: false });
      return {
        exito: false,
        permiso,
        mensaje:
          permiso === 'denied'
            ? 'El permiso de notificaciones fue bloqueado en este navegador. Para recibir alertas críticas debe habilitarlo en la configuración del sitio.'
            : 'El permiso de notificaciones no fue aceptado.',
      };
    }

    // 2. Registrar o verificar Service Worker
    const reg = await registrarServiceWorker();
    let subData: PushSubscriptionJSON | undefined = undefined;

    // 3. Suscribirse a PushManager si está disponible
    if (reg && 'pushManager' in reg) {
      try {
        let subscription = await reg.pushManager.getSubscription();

        if (!subscription) {
          try {
            const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
            subscription = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: convertedVapidKey,
            });
          } catch {
            // Si VAPID falla (ej. localhost/preview), intentar suscripción básica
            subscription = await reg.pushManager.subscribe({
              userVisibleOnly: true,
            });
          }
        }

        if (subscription) {
          subData = subscription.toJSON();
          localStorage.setItem(STORAGE_KEY_SUBSCRIPTION, JSON.stringify(subData));
        }
      } catch (pushErr) {
        console.warn('[WebPush] PushManager subscription warn (continuando con Notification API local):', pushErr);
      }
    }

    // 4. Actualizar configuración activa
    const configActual = obtenerConfiguracionWebPush();
    const nuevaConfig: ConfiguracionWebPush = {
      ...configActual,
      habilitado: true,
      gerenciaObjetivo,
      ultimaSuscripcionFecha: new Date().toISOString(),
      endpointSuscripcion: subData?.endpoint || 'local-notification-worker',
    };
    guardarConfiguracionWebPush(nuevaConfig);

    // 5. Enviar notificación de bienvenida y confirmación
    await despacharNotificacionNavegadorDirecta({
      title: '🔔 Alertas Web Push Activadas • SUMMIT IMPULSA',
      body: `Notificaciones de navegador configuradas para: ${gerenciaObjetivo === 'todas' ? 'Todas las Gerencias' : gerenciaObjetivo.toUpperCase()}. Recibirá alertas de cambios de estado críticos incluso con la aplicación en segundo plano.`,
      tag: 'summit-push-bienvenida',
      vista: 'gerencia-general',
    });

    return {
      exito: true,
      permiso,
      mensaje: '¡Notificaciones Web Push de navegador activadas con éxito!',
      subscription: subData,
    };
  } catch (error: any) {
    console.error('[WebPush] Error al activar Web Push:', error);
    return {
      exito: false,
      permiso: obtenerEstadoPermiso(),
      mensaje: `Ocurrió un inconveniente al solicitar los permisos: ${error?.message || 'Error desconocido'}`,
    };
  }
}

/**
 * Desactiva las notificaciones Web Push
 */
export async function desactivarWebPush(): Promise<boolean> {
  try {
    if (serviceWorkerRegistration && 'pushManager' in serviceWorkerRegistration) {
      const sub = await serviceWorkerRegistration.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
      }
    }
  } catch (e) {
    console.warn('[WebPush] Error al desuscribir de PushManager:', e);
  }

  const config = obtenerConfiguracionWebPush();
  guardarConfiguracionWebPush({
    ...config,
    habilitado: false,
    endpointSuscripcion: undefined,
  });
  localStorage.removeItem(STORAGE_KEY_SUBSCRIPTION);
  return true;
}

/**
 * Reproduce un tono de confirmación institucional elegante
 */
export function reproducirChimeInstitucional(): void {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Acorde Mayor sutil (Do5 -> Mi5 -> Sol5)
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const delay = idx * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0.12, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.35);
    });
  } catch {
    // Silencioso si audio está bloqueado
  }
}

/**
 * Muestra directamente una notificación mediante Service Worker o Notification API
 */
async function despacharNotificacionNavegadorDirecta(params: {
  title: string;
  body: string;
  tag?: string;
  vista?: string;
  proyectoId?: string;
  data?: any;
  actions?: Array<{ action: string; title: string }>;
  vibrate?: number[];
  requireInteraction?: boolean;
}): Promise<boolean> {
  if (!soportaWebPush() || Notification.permission !== 'granted') {
    return false;
  }

  const options: NotificationOptions & Record<string, any> = {
    body: params.body,
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    tag: params.tag || `summit-alert-${Date.now()}`,
    renotify: true,
    requireInteraction: params.requireInteraction !== false,
    vibrate: params.vibrate || [200, 100, 200, 100, 300],
    data: {
      url: window.location.href,
      vista: params.vista || 'gerencia-general',
      proyectoId: params.proyectoId,
      ...params.data,
    },
    actions: params.actions || [
      { action: 'abrir', title: 'Abrir Proyecto ↗' },
      { action: 'descartar', title: 'Entendido' },
    ],
  };

  try {
    const reg = serviceWorkerRegistration || (await navigator.serviceWorker.getRegistration());
    if (reg && reg.showNotification) {
      await reg.showNotification(params.title, options);
      return true;
    }
  } catch (swErr) {
    console.warn('[WebPush] Error en reg.showNotification, intentando new Notification:', swErr);
  }

  try {
    // Fallback nativo
    const notif = new Notification(params.title, {
      body: options.body,
      icon: options.icon,
      tag: options.tag,
    });
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
    return true;
  } catch (nErr) {
    console.error('[WebPush] Error al desplegar Notification:', nErr);
    return false;
  }
}

/**
 * Despacha una alerta de cambio de estado crítico a través de Web Push de Navegador
 */
export async function despacharAlertaCriticaWebPush(
  evento: EventoCriticoProyecto
): Promise<{ despachado: boolean; motivo?: string }> {
  const config = obtenerConfiguracionWebPush();

  // 1. Verificar si está habilitado
  if (!config.habilitado) {
    return { despachado: false, motivo: 'Web Push no está habilitado en las preferencias del usuario' };
  }

  if (Notification.permission !== 'granted') {
    return { despachado: false, motivo: 'El permiso de notificaciones del navegador no está concedido' };
  }

  // 2. Filtrar por gerencia de destino si el usuario configuró una específica
  if (config.gerenciaObjetivo !== 'todas') {
    const match =
      (config.gerenciaObjetivo === 'general' &&
        (evento.gerenciaDestino === 'gerencia-general' || evento.gerenciaDestino === 'todas')) ||
      (config.gerenciaObjetivo === 'academica' &&
        (evento.gerenciaDestino === 'gerencia-academica' || evento.gerenciaDestino === 'todas')) ||
      (config.gerenciaObjetivo === 'comercializacion' &&
        (evento.gerenciaDestino === 'gerencia-comercializacion' || evento.gerenciaDestino === 'todas'));

    if (!match) {
      return { despachado: false, motivo: 'Alerta ignorada por filtro de gerencia' };
    }
  }

  // 3. Filtrar por tipo de evento
  const evConfig = config.eventos;
  let eventoPermitido = true;
  switch (evento.tipo) {
    case 'aprobacion_gg':
      eventoPermitido = evConfig.aprobacionGG;
      break;
    case 'rechazo_gg':
      eventoPermitido = evConfig.rechazoGG;
      break;
    case 'nuevo_silabo':
      eventoPermitido = evConfig.nuevoSilabo;
      break;
    case 'cambio_estado':
      eventoPermitido = evConfig.cambioEstadoProyecto;
      break;
    case 'cierre_poa':
      eventoPermitido = evConfig.cierreMensualPOA;
      break;
    case 'aforo_critico':
      eventoPermitido = evConfig.alertaAforoCupos;
      break;
  }

  if (!eventoPermitido) {
    return { despachado: false, motivo: 'Evento no seleccionado en las preferencias de alerta' };
  }

  // 4. Sonido si está activo
  if (config.sonidoHabilitado) {
    if (evento.tipo === 'rechazo_gg') {
      reproducirAlertaSonoraRechazo();
    } else {
      reproducirChimeInstitucional();
    }
  }

  // 5. Registrar en historial
  registrarEnHistorial(evento);

  // 6. Despachar al sistema operativo vía Service Worker
  const tagUnico = `summit-crit-${evento.tipo}-${evento.proyectoId || Date.now()}`;
  const vibracion = evento.tipo === 'rechazo_gg' ? [300, 100, 300, 100, 400] : [200, 100, 200];

  const exito = await despacharNotificacionNavegadorDirecta({
    title: evento.titulo,
    body: evento.cuerpo,
    tag: tagUnico,
    vista: evento.vistaDestino || 'gerencia-general',
    proyectoId: evento.proyectoId,
    vibrate: config.vibracionHabilitada ? vibracion : [0],
    data: {
      proyectoId: evento.proyectoId,
      codigoEmpresa: evento.codigoEmpresa,
      correlativoSAR: evento.correlativoSAR,
      gerenciaDestino: evento.gerenciaDestino,
    },
    actions: [
      { action: 'abrir', title: evento.accionEtiqueta || 'Ver Proyecto ↗' },
      { action: 'descartar', title: 'Descartar' },
    ],
  });

  return { despachado: exito };
}

/**
 * Envía una notificación de prueba inmediata para validar la configuración del usuario
 */
export async function enviarNotificacionPruebaInmediata(
  gerencia: string = 'Gerencia General'
): Promise<boolean> {
  const config = obtenerConfiguracionWebPush();
  if (config.sonidoHabilitado) {
    reproducirChimeInstitucional();
  }

  return despacharNotificacionNavegadorDirecta({
    title: `⚡ Prueba Web Push • ${gerencia}`,
    body: `La comunicación con el Service Worker y el sistema operativo está activa. Recibirá avisos críticos en tiempo real aun con la app minimizada o en segundo plano.`,
    tag: `summit-test-${Date.now()}`,
    vista: 'gerencia-general',
    vibrate: [150, 80, 150],
  });
}

/**
 * Programa una prueba en segundo plano a través del Service Worker
 * para que el usuario minimice la pestaña y compruebe la recepción sin la app en foco
 */
export async function programarPruebaSegundoPlano(
  segundos: number = 5,
  gerencia: string = 'Gerencia General'
): Promise<boolean> {
  if (!soportaWebPush() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const reg = serviceWorkerRegistration || (await navigator.serviceWorker.getRegistration());
    if (reg && reg.active) {
      reg.active.postMessage({
        type: 'SCHEDULE_BACKGROUND_ALERT',
        delayMs: segundos * 1000,
        payload: {
          title: `🕒 Alerta en Segundo Plano (${gerencia})`,
          options: {
            body: `¡Comprobación exitosa! Esta alerta se generó en segundo plano tras ${segundos} segundos, demostrando que no requiere mantener la app abierta en primer plano.`,
            tag: `summit-bg-test-${Date.now()}`,
            data: { url: window.location.href, vista: 'gerencia-general' },
            actions: [
              { action: 'abrir', title: 'Abrir App' },
              { action: 'descartar', title: 'Cerrar' },
            ],
          },
        },
      });
      return true;
    }
  } catch (e) {
    console.warn('[WebPush] Error enviando mensaje a SW:', e);
  }

  // Fallback con setTimeout del cliente si el SW no responde
  setTimeout(() => {
    despacharNotificacionNavegadorDirecta({
      title: `🕒 Alerta en Segundo Plano (${gerencia})`,
      body: `¡Comprobación exitosa! Notificación nativa recibida tras ${segundos} segundos.`,
      tag: `summit-bg-fallback-${Date.now()}`,
    });
  }, segundos * 1000);

  return true;
}
