/**
 * Service Worker de Notificaciones Web Push de Navegador
 * SUMMIT IMPULSA GLOBAL, S.A. DE C.V.
 * Versión 1.0.0
 * 
 * Permite recibir y mostrar alertas críticas de proyectos a las gerencias
 * incluso cuando la aplicación web no está abierta en primer plano.
 */

const SW_VERSION = 'summit-push-sw-v1.0';

// Instalación inmediata
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activación y toma de control de los clientes abiertos
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Escucha de eventos Web Push nativos enviados desde servidor o push service
self.addEventListener('push', (event) => {
  let pushData = {};

  if (event.data) {
    try {
      pushData = event.data.json();
    } catch (e) {
      pushData = {
        title: 'SUMMIT IMPULSA GLOBAL',
        body: event.data.text() || 'Alerta crítica de proyectos',
      };
    }
  }

  const title = pushData.title || 'Alerta de Proyecto • SUMMIT IMPULSA';
  const options = {
    body: pushData.body || pushData.mensaje || 'Se ha registrado un cambio de estado crítico en la matriz de proyectos.',
    icon: pushData.icon || '/icon-192.svg',
    badge: pushData.badge || '/icon-192.svg',
    tag: pushData.tag || `summit-push-${Date.now()}`,
    renotify: true,
    requireInteraction: pushData.requireInteraction !== false,
    vibrate: pushData.vibrate || [250, 100, 200, 100, 300],
    data: {
      url: pushData.url || '/',
      vista: pushData.vista || 'gerencia-general',
      proyectoId: pushData.proyectoId || null,
      gerenciaDestino: pushData.gerenciaDestino || 'todas',
      timestamp: Date.now(),
      ...pushData.data,
    },
    actions: pushData.actions || [
      { action: 'abrir', title: 'Abrir Proyecto ↗' },
      { action: 'descartar', title: 'Entendido' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Clic en la notificación del sistema operativo
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  if (action === 'descartar') {
    return;
  }

  const notifData = event.notification.data || {};
  const targetUrl = notifData.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si hay una ventana o pestaña ya abierta de la app, enfocarla y pasarle los datos de navegación
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({
            type: 'WEB_PUSH_NAVIGATE',
            vista: notifData.vista,
            proyectoId: notifData.proyectoId,
            data: notifData,
          });
          return client.focus();
        }
      }

      // Si la app está cerrada, abrir una nueva ventana del navegador
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Mensajes enviados desde la aplicación web (para programar o simular notificaciones en segundo plano)
self.addEventListener('message', (event) => {
  if (!event.data) return;

  const { type, payload, delayMs } = event.data;

  if (type === 'SHOW_NOTIFICATION' && payload) {
    self.registration.showNotification(payload.title, payload.options);
  } else if (type === 'SCHEDULE_BACKGROUND_ALERT' && payload) {
    // Permite que la gerencia programe una alerta en segundo plano (ej: prueba en 5 segundos)
    // para verificar que el navegador la emite aun con la pestaña minimizada
    setTimeout(() => {
      self.registration.showNotification(payload.title, {
        ...payload.options,
        icon: payload.options?.icon || '/icon-192.svg',
        badge: payload.options?.badge || '/icon-192.svg',
      });
    }, delayMs || 5000);
  }
});
