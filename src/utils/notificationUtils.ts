import { NotificacionGerencia, ProyectoEducativo, VistaPrincipal } from '../types';

const STORAGE_KEY_NOTIFICACIONES = 'summit_notificaciones_gerencias_v1';

/**
 * Crea una notificación para Gerencia de Comercialización cuando se registra un nuevo proyecto.
 */
export function crearNotificacionNuevoProyecto(proyecto: ProyectoEducativo): NotificacionGerencia {
  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    fecha: new Date().toISOString(),
    gerenciaOrigen: 'gerencia-academica',
    gerenciaDestino: 'gerencia-comercializacion',
    tipo: 'nuevo_proyecto',
    titulo: `Nuevo Proyecto en Proceso: ${proyecto.nombreProyecto}`,
    mensaje: `Gerencia Académica ha registrado el proyecto. Ya se encuentra en proceso. Abra la Gerencia de Comercialización para revisar la proyección comercial, fijar la estrategia de venta, canales de captación, costos de publicidad y meta de alumnos.`,
    proyectoId: proyecto.id,
    nombreProyecto: proyecto.nombreProyecto,
    leida: false,
    accion: {
      etiqueta: 'Abrir en Comercialización →',
      vistaDestino: 'gerencia-comercializacion',
      proyectoId: proyecto.id,
    },
  };
}

/**
 * Crea una notificación para Gerencia General cuando Gerencia de Comercialización trabaja el proyecto.
 */
export function crearNotificacionProyectoComercializado(proyecto: ProyectoEducativo): NotificacionGerencia {
  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    fecha: new Date().toISOString(),
    gerenciaOrigen: 'gerencia-comercializacion',
    gerenciaDestino: 'gerencia-general',
    tipo: 'proyecto_comercializado',
    titulo: `Proyecto Comercializado en Proceso: ${proyecto.nombreProyecto}`,
    mensaje: `Gerencia de Comercialización ha trabajado y actualizado la estrategia comercial y matrícula del proyecto. Ya se encuentra en proceso para la revisión financiera, verificación fiscal de ISV/SAR, fijación de tarifas docentes y dictamen final de Gerencia General.`,
    proyectoId: proyecto.id,
    nombreProyecto: proyecto.nombreProyecto,
    leida: false,
    accion: {
      etiqueta: 'Revisar en Gerencia General →',
      vistaDestino: 'gerencia-general',
      proyectoId: proyecto.id,
    },
  };
}

/**
 * Crea una notificación para Gerencia Académica / Comercial cuando Gerencia General emite dictamen final.
 */
export function crearNotificacionDictamenGeneral(proyecto: ProyectoEducativo, aprobado: boolean): NotificacionGerencia {
  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    fecha: new Date().toISOString(),
    gerenciaOrigen: 'gerencia-general',
    gerenciaDestino: 'todas',
    tipo: 'dictamen_general',
    titulo: aprobado 
      ? `Proyecto Aprobado (Listo): ${proyecto.nombreProyecto}` 
      : `Proyecto con Observaciones: ${proyecto.nombreProyecto}`,
    mensaje: aprobado
      ? `Gerencia General ha emitido Dictamen Favorable ("Listo"). El proyecto cuenta con viabilidad financiera, ISV validado y tarifas autorizadas.`
      : `Gerencia General ha modificado el estado del proyecto a "${proyecto.seLlevoACabo}". Revise las observaciones financieras y académicas.`,
    proyectoId: proyecto.id,
    nombreProyecto: proyecto.nombreProyecto,
    leida: false,
    accion: {
      etiqueta: 'Ver Proyecto',
      vistaDestino: 'gerencia-general',
      proyectoId: proyecto.id,
    },
  };
}

/**
 * Crea una notificación para todas las gerencias cuando se ejecuta o actualiza el cierre mensual de proyectos.
 */
export function crearNotificacionCierreMensual(
  mesKey: string,
  etiquetaMes: string,
  dictamen: string,
  cerradoPor: string,
  totalProyectos: number,
  superavitHNL: number
): NotificacionGerencia {
  const esExitoso = dictamen === 'SOBRESALIENTE' || dictamen === 'CUMPLIDO_POA';
  const esDeficit = dictamen === 'DEFICIT_CRITICO';

  return {
    id: `notif-cierre-${mesKey}-${Date.now()}`,
    fecha: new Date().toISOString(),
    gerenciaOrigen: 'gerencia-general',
    gerenciaDestino: 'todas',
    tipo: 'alerta',
    titulo: `Cierre Mensual de Proyectos: ${etiquetaMes} (${dictamen.replace('_', ' ')})`,
    mensaje: `${cerradoPor} ha auditado y cerrado oficialmente el periodo de ${etiquetaMes}. Se consolidaron ${totalProyectos} cursos/programas con un resultado neto de L. ${superavitHNL.toLocaleString('es-HN', { minimumFractionDigits: 2 })}. ${
      esDeficit 
        ? '⚠️ ALERTA: El periodo cerró por debajo del punto de equilibrio mensual (17.25 grupos piloto). Se requiere activar plan de contingencia comercial.'
        : esExitoso
        ? '✅ El periodo cumplió exitosamente con las metas operativas del POA SEP - DIC 2026.'
        : 'ℹ️ El periodo cubrió costos fijos (Break-Even), pero no alcanzó la meta mensual de 18.5 grupos piloto del POA.'
    }`,
    leida: false,
    accion: {
      etiqueta: 'Ver Cierre Mensual →',
      vistaDestino: 'meses',
    },
  };
}

/**
 * Carga las notificaciones almacenadas en LocalStorage
 */
export function cargarNotificacionesGuardadas(): NotificacionGerencia[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFICACIONES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Guarda las notificaciones en LocalStorage
 */
export function guardarNotificacionesStorage(notificaciones: NotificacionGerencia[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_NOTIFICACIONES, JSON.stringify(notificaciones.slice(0, 50)));
  } catch (error) {
    console.error('Error al guardar notificaciones:', error);
  }
}
