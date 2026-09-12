import { NotificacionGerencia, ProyectoEducativo, VistaPrincipal, AvisoProyectoItem } from '../types';
import { CREDENCIALES_GERENCIAS } from './gerenciasCredenciales';

const STORAGE_KEY_NOTIFICACIONES = 'summit_notificaciones_gerencias_v1';

/**
 * Crea una notificación por correo electrónico y bitácora cuando Gerencia Académica graba un Sílabo Oficial.
 * Se remite a Gerencia General para su revisión y aprobación formal, con copia a Comercialización.
 */
export function crearNotificacionSilaboGrabadoRevisionGG(proyecto: ProyectoEducativo): {
  notificacion: NotificacionGerencia;
  aviso: AvisoProyectoItem;
} {
  const codEmpresa = proyecto.codigoProyecto || proyecto.codigoPrograma || 'SIG-ACAD-2026-001';
  const codSAR = proyecto.correlativoSAR || '000-001-01-00000001';
  const codFiscal = proyecto.codigoFiscalSAR || 'SAR-ISV-2026-001';
  const fechaHora = `${new Date().toLocaleDateString('es-HN')} ${new Date().toLocaleTimeString('es-HN')}`;
  
  const correosDestinatarios = [
    CREDENCIALES_GERENCIAS.administracion.correo, // administracion.summitg@gmail.com (Gerencia General)
    CREDENCIALES_GERENCIAS.academica.correo,      // academia.summitg@gmail.com (Gerencia Académica)
    CREDENCIALES_GERENCIAS.comercial.correo,      // comercial.summitg@gmail.com (Gerencia Comercial)
  ];

  const asuntoEmail = `[NUEVO PROYECTO / SÍLABO OFICIAL] Empresa: ${codEmpresa} | SAR: ${codSAR} - ${proyecto.nombreProyecto}`;
  
  const cuerpoEmail = `
================================================================================
SUMMIT IMPULSA GLOBAL, S.A. DE C.V.
NOTIFICACIÓN OFICIAL INTER-GERENCIAL - NUEVO SÍLABO REGISTRADO
================================================================================

Estimadas Gerencias:

La Gerencia Académica ha concluido la formulación pedagógica y registrado el Sílabo Oficial (Proyecto Educativo) en el sistema. Conforme al nuevo flujo de gobernanza institucional, el proyecto ha sido remitido formalmente a la GERENCIA GENERAL para su revisión ejecutiva y dictamen de aprobación previa a su paso a Comercialización.

DATOS INSTITUCIONALES DEL PROGRAMA:
--------------------------------------------------------------------------------
• Código de Control Empresa:     ${codEmpresa}
• Correlativo Fiscal SAR:        ${codSAR} (${codFiscal})
• Nombre del Programa:           ${proyecto.nombreProyecto}
• Tipo de Programa / Nivel:      ${proyecto.tipoProyecto} | Nivel: ${proyecto.nivel || 'Básico'}
• Docente Responsable:           ${proyecto.nombreDocente} (Tarifa: L. ${proyecto.tarifaHoraDocente || 200}/hr)
• Horas Clase Académicas:        ${proyecto.horasClase} horas
• Inversión Operativa Base:      L. ${(proyecto.gastoTotalOperativo || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
• Margen Operativo Objetivo:     ${proyecto.margenGananciaOperativa || 40}%
• Tratamiento Fiscal (SAR):      ${proyecto.aplicaISV ? 'GRAVADO CON ISV (15%)' : 'EXENTO DE ISV'}
• Venta Requerida Base:          L. ${(proyecto.precioVentaRequerido || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
• Cupos / Alumnos Proyectados:   ${proyecto.alumnosProyectados || 6} alumnos
• Precio Sugerido por Alumno:    L. ${(proyecto.precioSugeridoVentaNeto || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })} ${proyecto.aplicaISV ? `(L. ${(proyecto.precioSugeridoConISV || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })} con ISV 15%)` : '(Exento)'}

FLUJO DE APROBACIÓN ACTUAL:
--------------------------------------------------------------------------------
[PASO 1: GERENCIA ACADÉMICA]  -->  REGISTRADO Y SELLADO (Completado)
[PASO 2: GERENCIA GENERAL]    -->  EN REVISIÓN Y APROBACIÓN (Acción Requerida)
[PASO 3: COMERCIALIZACIÓN]    -->  EN ESPERA DE APROBACIÓN DE GG

Destinatarios Notificados:
- Gerencia General: ${CREDENCIALES_GERENCIAS.administracion.correo}
- Gerencia de Comercialización: ${CREDENCIALES_GERENCIAS.comercial.correo}
- Gerencia Académica: ${CREDENCIALES_GERENCIAS.academica.correo}

Fecha y Hora de Emisión: ${fechaHora}
Emitido por: Phd. Donal Reyes - Dirección de Gerencia Académica
================================================================================
`.trim();

  const notificacion: NotificacionGerencia = {
    id: `notif-silabo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    fecha: new Date().toISOString(),
    gerenciaOrigen: 'gerencia-academica',
    gerenciaDestino: 'gerencia-general',
    tipo: 'silabo_creado_revision_gg',
    titulo: `Nuevo Sílabo / Proyecto: ${codEmpresa} - ${proyecto.nombreProyecto}`,
    mensaje: `Gerencia Académica ha formulado el Sílabo Oficial. Se asignaron los correlativos institucional (${codEmpresa}) y fiscal SAR (${codSAR}). Remitido a Gerencia General para revisión y aprobación previa a comercialización.`,
    proyectoId: proyecto.id,
    nombreProyecto: proyecto.nombreProyecto,
    leida: false,
    destinatariosEmails: correosDestinatarios,
    asuntoEmail,
    cuerpoEmail,
    codigoEmpresa: codEmpresa,
    codigoSAR: codSAR,
    correlativoSAR: codSAR,
    estadoEnvioEmail: 'enviado',
    fechaEnvioEmail: fechaHora,
    accion: {
      etiqueta: 'Revisar en Gerencia General →',
      vistaDestino: 'gerencia-general',
      proyectoId: proyecto.id,
    },
  };

  const aviso: AvisoProyectoItem = {
    id: `aviso-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    fechaHora,
    origen: 'Gerencia Académica',
    destino: 'Gerencia General',
    etapa: 'revision_gerencia_general',
    titulo: `Sílabo Oficial Grabado (${codEmpresa} / ${codSAR})`,
    descripcion: `Sílabo formulado por Gerencia Académica y enviado a Gerencia General para revisión y dictamen de aprobación previa a comercialización. Correos notificados: GG, Comercialización y Académica.`,
    codigoEmpresa: codEmpresa,
    codigoSAR: codSAR,
    correosNotificados: correosDestinatarios,
    estadoEnvio: 'Enviado',
  };

  guardarNotificacionEnStorage(notificacion);

  return { notificacion, aviso };
}

/**
 * Crea una notificación cuando Gerencia General aprueba el Sílabo y lo traslada formalmente
 * a Gerencia de Comercialización para inicio de captación, pauta y ventas.
 */
export function crearNotificacionAprobacionGGAComercializacion(
  proyecto: ProyectoEducativo,
  observaciones?: string
): {
  notificacion: NotificacionGerencia;
  aviso: AvisoProyectoItem;
} {
  const codEmpresa = proyecto.codigoProyecto || proyecto.codigoPrograma || 'SIG-ACAD-2026-001';
  const codSAR = proyecto.correlativoSAR || '000-001-01-00000001';
  const fechaHora = `${new Date().toLocaleDateString('es-HN')} ${new Date().toLocaleTimeString('es-HN')}`;
  
  const correosDestinatarios = [
    CREDENCIALES_GERENCIAS.comercial.correo,      // comercial.summitg@gmail.com (Gerencia Comercial)
    CREDENCIALES_GERENCIAS.academica.correo,      // academia.summitg@gmail.com (Gerencia Académica)
    CREDENCIALES_GERENCIAS.administracion.correo, // administracion.summitg@gmail.com (Gerencia General)
  ];

  const asuntoEmail = `[APROBACIÓN GG - PASE A COMERCIALIZACIÓN] ${codEmpresa} - ${proyecto.nombreProyecto}`;
  
  const cuerpoEmail = `
================================================================================
SUMMIT IMPULSA GLOBAL, S.A. DE C.V.
NOTIFICACIÓN OFICIAL INTER-GERENCIAL - APROBACIÓN POR GERENCIA GENERAL
================================================================================

Estimada Gerencia de Comercialización & Gerencia Académica:

La GERENCIA GENERAL ha revisado minuciosamente y APROBADO formalmente el Sílabo Oficial correspondiente al programa "${proyecto.nombreProyecto}".

Con esta resolución ejecutiva, el proyecto se traslada formalmente a la GERENCIA DE COMERCIALIZACIÓN para la puesta en marcha inmediata de la estrategia comercial, pauta publicitaria, fijación de canales de captación y matrícula de alumnos.

DICTAMEN DE GERENCIA GENERAL:
--------------------------------------------------------------------------------
• Código de Control Empresa:     ${codEmpresa}
• Correlativo Fiscal SAR:        ${codSAR}
• Margen Operativo Aprobado:     ${proyecto.margenGananciaOperativa || 40}%
• Meta Mínima de Cupos:          ${proyecto.alumnosProyectados || 6} alumnos
• Precio Base Sugerido:          L. ${(proyecto.precioSugeridoVentaNeto || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
• Dictamen Ejecutivo:            ${observaciones || 'Aprobado formalmente por Gerencia General. Viabilidad financiera y curricular validada. Autorizado para comercialización.'}

Fecha y Hora de Aprobación: ${fechaHora}
Aprobado por: Dr. Walter Pedroza - Dirección de Gerencia General
================================================================================
`.trim();

  const notificacion: NotificacionGerencia = {
    id: `notif-aprob-gg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    fecha: new Date().toISOString(),
    gerenciaOrigen: 'gerencia-general',
    gerenciaDestino: 'gerencia-comercializacion',
    tipo: 'aprobado_gg_a_comercializacion',
    titulo: `Proyecto Aprobado por GG ➔ En Comercialización: ${codEmpresa}`,
    mensaje: `Gerencia General ha aprobado formalmente el proyecto "${proyecto.nombreProyecto}". Se encuentra habilitado en Gerencia de Comercialización para activar ventas y matrícula.`,
    proyectoId: proyecto.id,
    nombreProyecto: proyecto.nombreProyecto,
    leida: false,
    destinatariosEmails: correosDestinatarios,
    asuntoEmail,
    cuerpoEmail,
    codigoEmpresa: codEmpresa,
    codigoSAR: codSAR,
    correlativoSAR: codSAR,
    estadoEnvioEmail: 'enviado',
    fechaEnvioEmail: fechaHora,
    accion: {
      etiqueta: 'Abrir en Comercialización →',
      vistaDestino: 'gerencia-comercializacion',
      proyectoId: proyecto.id,
    },
  };

  const aviso: AvisoProyectoItem = {
    id: `aviso-gg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    fechaHora,
    origen: 'Gerencia General',
    destino: 'Gerencia de Comercialización',
    etapa: 'comercializacion',
    titulo: `Aprobado por GG y Trasladado a Comercialización (${codEmpresa})`,
    descripcion: `Gerencia General auditó el sílabo y autorizó el pase a Comercialización. Notificación enviada a los correos institucionales.`,
    codigoEmpresa: codEmpresa,
    codigoSAR: codSAR,
    correosNotificados: correosDestinatarios,
    estadoEnvio: 'Enviado',
  };

  guardarNotificacionEnStorage(notificacion);

  return { notificacion, aviso };
}

/**
 * Guarda una notificación individual en localStorage de manera persistente
 */
export function guardarNotificacionEnStorage(notif: NotificacionGerencia) {
  try {
    const existentes = cargarNotificacionesGuardadas();
    const actualizadas = [notif, ...existentes.filter(n => n.id !== notif.id)].slice(0, 50);
    localStorage.setItem(STORAGE_KEY_NOTIFICACIONES, JSON.stringify(actualizadas));
  } catch (e) {
    console.error('Error guardando notificación en localStorage:', e);
  }
}

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
 * Crea una notificación cuando Gerencia General rechaza o retorna un proyecto a Gerencia Académica
 * para su corrección financiera antes de poder ser enviado a Comercialización.
 */
export function crearNotificacionRetornoGGAAcademica(
  proyecto: ProyectoEducativo,
  motivoCorreccion: string
): {
  notificacion: NotificacionGerencia;
  aviso: AvisoProyectoItem;
} {
  const codEmpresa = proyecto.codigoProyecto || proyecto.codigoPrograma || 'SIG-ACAD-2026-001';
  const codSAR = proyecto.correlativoSAR || '000-001-01-00000001';
  const fechaHora = `${new Date().toLocaleDateString('es-HN')} ${new Date().toLocaleTimeString('es-HN')}`;
  
  const correosDestinatarios = [
    CREDENCIALES_GERENCIAS.academica.correo,      // academia.summitg@gmail.com
    CREDENCIALES_GERENCIAS.administracion.correo, // administracion.summitg@gmail.com
  ];

  const asuntoEmail = `[RETORNO PARA CORRECCIÓN FINANCIERA] ${codEmpresa} - ${proyecto.nombreProyecto}`;
  
  const cuerpoEmail = `
================================================================================
SUMMIT IMPULSA GLOBAL, S.A. DE C.V.
NOTIFICACIÓN INTER-GERENCIAL - RETORNO A GERENCIA ACADÉMICA PARA CORRECCIÓN
================================================================================

Estimada Gerencia Académica (Phd. Donal Reyes):

La GERENCIA GENERAL ha revisado la parte financiera del Sílabo Oficial / Proyecto "${proyecto.nombreProyecto}" (${codEmpresa}).

RESOLUCIÓN FINANCIERA: RETORNADO A GERENCIA ACADÉMICA PARA CORRECCIÓN
--------------------------------------------------------------------------------
La parte financiera del proyecto requiere ajustes antes de ser transferida a la Gerencia de Comercialización.

MOTIVO Y OBSERVACIONES FINANCIERAS DE GG:
${motivoCorreccion || 'Ajustar estructura de costos, tarifa docente o margen de ganancia operativa para asegurar la viabilidad institucional.'}

INSTRUCCIONES PARA GERENCIA ACADÉMICA:
1. Abrir el Sílabo Oficial en modo edición.
2. Aplicar las correcciones en costos, tarifa hora docente o margen operativo.
3. Guardar y registrar el sílabo actualizado para remitirlo nuevamente a Gerencia General con nuevo sello de auditoría.

Fecha y Hora de Dictamen: ${fechaHora}
Emitido por: Dr. Walter Pedroza - Dirección de Gerencia General
================================================================================
`.trim();

  const notificacion: NotificacionGerencia = {
    id: `notif-retorno-gg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    fecha: new Date().toISOString(),
    gerenciaOrigen: 'gerencia-general',
    gerenciaDestino: 'gerencia-academica',
    tipo: 'retorno_gg_a_academica',
    titulo: `Proyecto Retornado para Corrección Financiera: ${codEmpresa}`,
    mensaje: `Gerencia General ha retornado el proyecto "${proyecto.nombreProyecto}" a Gerencia Académica para su corrección financiera: ${motivoCorreccion}`,
    proyectoId: proyecto.id,
    nombreProyecto: proyecto.nombreProyecto,
    leida: false,
    destinatariosEmails: correosDestinatarios,
    asuntoEmail,
    cuerpoEmail,
    codigoEmpresa: codEmpresa,
    codigoSAR: codSAR,
    correlativoSAR: codSAR,
    estadoEnvioEmail: 'enviado',
    fechaEnvioEmail: fechaHora,
    accion: {
      etiqueta: 'Abrir y Corregir Sílabo →',
      vistaDestino: 'gerencia-academica',
      proyectoId: proyecto.id,
    },
  };

  const aviso: AvisoProyectoItem = {
    id: `aviso-retorno-gg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    fechaHora,
    origen: 'Gerencia General',
    destino: 'Gerencia Académica',
    etapa: 'elaboracion_academica',
    titulo: `Retornado por GG para Corrección Financiera: ${codEmpresa}`,
    descripcion: `Gerencia General retornó el proyecto a Gerencia Académica. Observación financiera: ${motivoCorreccion}`,
    codigoEmpresa: codEmpresa,
    codigoSAR: codSAR,
    correosNotificados: correosDestinatarios,
    estadoEnvio: 'Entregado',
  };

  return { notificacion, aviso };
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
