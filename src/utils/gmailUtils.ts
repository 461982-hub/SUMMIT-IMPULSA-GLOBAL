/**
 * UTILIDADES DE INTEGRACIÓN CON LA API DE GMAIL
 * SUMMIT IMPULSA GLOBAL, S.A. DE C.V.
 *
 * Permite enviar reportes y notificaciones ejecutivas de proyectos
 * directamente a las gerencias registradas (Académica, Comercial y General)
 * utilizando el cliente OAuth2 y la librería gapi.
 */

import { ProyectoEducativo, Moneda } from '../types';
import { formatearMoneda } from './calculations';
import { CREDENCIALES_GERENCIAS } from './gerenciasCredenciales';
import { formatearFechaCorta } from './dateUtils';
import { getDriveAccessToken, signInWithGoogleDrive, setDriveAccessToken } from '../services/googleDriveService';

// Declaración global de gapi para TypeScript
declare global {
  interface Window {
    gapi?: any;
  }
}

export const CORREOS_GERENCIAS_DEFAULT = [
  CREDENCIALES_GERENCIAS.academica.correo,    // academia.summitg@gmail.com
  CREDENCIALES_GERENCIAS.comercial.correo,    // comercial.summitg@gmail.com
  CREDENCIALES_GERENCIAS.administracion.correo // administracion.summitg@gmail.com
];

export interface OpcionesEnvioReporte {
  proyecto: ProyectoEducativo;
  moneda: Moneda;
  destinatarios?: string[];
  comentarioAdicional?: string;
  remitenteNombre?: string;
}

export interface ResultadoEnvioEmail {
  success: boolean;
  messageId?: string;
  error?: string;
  destinatarios?: string[];
}

/**
 * Carga e inicializa gapi client si no está presente
 */
export async function cargarGapiClient(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Entorno no compatible con navegador'));
    }

    const initClient = () => {
      if (window.gapi && window.gapi.load) {
        window.gapi.load('client', async () => {
          try {
            resolve(window.gapi.client);
          } catch (err) {
            resolve(window.gapi);
          }
        });
      } else {
        resolve(null);
      }
    };

    if (window.gapi) {
      initClient();
    } else {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => initClient();
      script.onerror = (e) => reject(new Error('No se pudo cargar la librería gapi de Google'));
      document.body.appendChild(script);
    }
  });
}

/**
 * Genera el cuerpo en HTML estructurado para el reporte del proyecto
 */
export function generarHtmlReporteProyecto(
  proyecto: ProyectoEducativo,
  moneda: Moneda,
  comentarioAdicional?: string
): string {
  const costoTotal = (proyecto.gastoTotalOperativo || 0) + (proyecto.costoDocenteCalculado || 0);
  const utilidad = proyecto.totalGananciasFinales !== undefined
    ? proyecto.totalGananciasFinales
    : ((proyecto.ingresoRealTotal || 0) - (proyecto.gastoTotalOperativo || 0));
  const margen = (proyecto.ingresoRealTotal || 0) > 0
    ? ((utilidad / (proyecto.ingresoRealTotal || 0)) * 100).toFixed(1)
    : '0.0';

  const estadoAprobacion = proyecto.aprobacionFinalGerenciaGeneral
    ? '✅ APROBADO POR GERENCIA GENERAL'
    : '⏳ PENDIENTE DE APROBACIÓN POR GERENCIA GENERAL';

  const estadoComercial = proyecto.seLlevoACabo || 'En proceso';
  const nombre = proyecto.nombreProyecto || 'Proyecto Educativo';
  const codigo = proyecto.codigoFiscalSAR || proyecto.codigoPrograma || `PRY-${proyecto.id.slice(0, 8)}`;
  const alumnosInscritos = proyecto.alumnosFinal ?? proyecto.alumnosProyectados ?? 0;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0f172a; padding: 24px; color: #ffffff; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.02em; color: #ffffff; }
    .header p { margin: 6px 0 0 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
    .content { padding: 24px; }
    .project-banner { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
    .project-title { font-size: 18px; font-weight: 800; color: #14532d; margin: 0 0 4px 0; }
    .project-meta { font-size: 12px; color: #166534; font-family: monospace; }
    .grid-metrics { display: table; width: 100%; border-collapse: separate; border-spacing: 10px; margin-bottom: 20px; }
    .metric-col { display: table-cell; width: 50%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; vertical-align: top; }
    .metric-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; display: block; }
    .metric-value { font-size: 18px; font-weight: 800; font-family: monospace; color: #0f172a; }
    .metric-value.green { color: #15803d; }
    .metric-value.blue { color: #1d4ed8; }
    .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; color: #334155; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px; margin: 20px 0 12px 0; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
    .data-table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
    .data-table td.label { font-weight: 600; color: #475569; width: 40%; }
    .data-table td.val { color: #0f172a; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .badge-approved { background: #dcfce7; color: #15803d; }
    .badge-pending { background: #fef3c7; color: #b45309; }
    .comment-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 4px; margin-top: 20px; font-size: 13px; color: #1e40af; }
    .footer { background: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; }
    .footer a { color: #2563eb; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SUMMIT IMPULSA GLOBAL</h1>
      <p>Reporte Oficial de Proyecto Educativo • POA 2026</p>
    </div>

    <div class="content">
      <div class="project-banner">
        <div class="project-title">${nombre}</div>
        <div class="project-meta">
          Código: ${codigo} | Sección: ${proyecto.seccion || 'A'} | Modalidad: ${proyecto.modalidad || 'Virtual'}
        </div>
      </div>

      <div class="grid-metrics">
        <div class="metric-col">
          <span class="metric-label">Ingreso Real Estimado</span>
          <div class="metric-value green">${formatearMoneda(proyecto.ingresoRealTotal || 0, moneda)}</div>
        </div>
        <div class="metric-col">
          <span class="metric-label">Utilidad Operativa Neta</span>
          <div class="metric-value blue">${formatearMoneda(utilidad, moneda)} (${margen}%)</div>
        </div>
      </div>

      <div class="section-title">Parámetros Académicos & Operativos</div>
      <table class="data-table">
        <tr>
          <td class="label">Horas Clase Totales:</td>
          <td class="val">${proyecto.horasClase || 0} horas</td>
        </tr>
        <tr>
          <td class="label">Horario & Días:</td>
          <td class="val">${proyecto.horario || 'N/A'} (${proyecto.diasClase || 'N/A'})</td>
        </tr>
        <tr>
          <td class="label">Fecha Programada:</td>
          <td class="val">${formatearFechaCorta(proyecto.fechaProgramacion)}</td>
        </tr>
        <tr>
          <td class="label">Alumnos Inscritos:</td>
          <td class="val"><strong>${alumnosInscritos}</strong> alumnos (Punto de Equilibrio: ${proyecto.puntoEquilibrioAlumnos || 0})</td>
        </tr>
        <tr>
          <td class="label">Costo Total Docente / Directo:</td>
          <td class="val">${formatearMoneda(costoTotal, moneda)}</td>
        </tr>
        <tr>
          <td class="label">Estado de Matrícula:</td>
          <td class="val">${estadoComercial}</td>
        </tr>
        <tr>
          <td class="label">Dictamen Gerencia General:</td>
          <td class="val">
            <span class="badge ${proyecto.aprobacionFinalGerenciaGeneral ? 'badge-approved' : 'badge-pending'}">
              ${estadoAprobacion}
            </span>
          </td>
        </tr>
      </table>

      ${comentarioAdicional ? `
      <div class="comment-box">
        <strong>Nota Institucional Adjunta:</strong><br/>
        ${comentarioAdicional.replace(/\n/g, '<br/>')}
      </div>
      ` : ''}
    </div>

    <div class="footer">
      <p style="margin: 0 0 6px 0;">
        <strong>SUMMIT IMPULSA GLOBAL, S.A. DE C.V.</strong><br/>
        Sistema Integral de Rentabilidad y Gobernanza Multi-Gerencia
      </p>
      <p style="margin: 0; font-size: 10px; color: #94a3b8;">
        Distribuido a: Gerencia Académica (${CREDENCIALES_GERENCIAS.academica.correo}), Gerencia Comercial (${CREDENCIALES_GERENCIAS.comercial.correo}), Gerencia General (${CREDENCIALES_GERENCIAS.administracion.correo}).
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Función principal solicitada por el usuario:
 * enviarReportePorEmail
 *
 * Utiliza la API de Gmail (vía gapi o HTTP REST autorizado) para enviar
 * el cuerpo del reporte del proyecto a los correos de las gerencias registradas.
 */
export async function enviarReportePorEmail(opciones: OpcionesEnvioReporte): Promise<ResultadoEnvioEmail> {
  const {
    proyecto,
    moneda,
    destinatarios = CORREOS_GERENCIAS_DEFAULT,
    comentarioAdicional,
  } = opciones;

  if (!destinatarios || destinatarios.length === 0) {
    throw new Error('Debe especificar al menos un correo destinatario.');
  }

  // 1. Verificar o adquirir token OAuth2 de Google
  let token = getDriveAccessToken();
  if (!token) {
    const authResult = await signInWithGoogleDrive();
    token = authResult.accessToken;
    setDriveAccessToken(token);
  }

  if (!token) {
    throw new Error('No se pudo obtener el token de autorización OAuth2 de Google.');
  }

  // 2. Cargar e inicializar gapi si es posible
  try {
    await cargarGapiClient();
    if (window.gapi?.client) {
      window.gapi.client.setToken({ access_token: token });
    }
  } catch (e) {
    console.warn('Aviso al cargar gapi, se usará endpoint REST de Gmail:', e);
  }

  // 3. Formatear correo MIME RFC 2822
  const codPry = proyecto.codigoFiscalSAR || proyecto.codigoPrograma || `PRY-${proyecto.id.slice(0, 8)}`;
  const nomPry = proyecto.nombreProyecto || 'Proyecto Educativo';
  const asunto = `[REPORTE OFICIAL] [${codPry}] ${nomPry} - Summit Impulsa Global`;
  const cuerpoHtml = generarHtmlReporteProyecto(proyecto, moneda, comentarioAdicional);

  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(asunto)))}?=`;
  const emailLines = [
    `To: ${destinatarios.join(', ')}`,
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

  // 4. Enviar mediante gapi si está disponible con el módulo gmail, o mediante REST API con Bearer token
  try {
    let resultMessageId: string | undefined;

    if (window.gapi?.client?.gmail?.users?.messages?.send) {
      const gapiResponse = await window.gapi.client.gmail.users.messages.send({
        userId: 'me',
        resource: {
          raw: base64UrlEmail,
        },
      });
      resultMessageId = gapiResponse.result?.id;
    } else {
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(`Error en API de Gmail: ${msg}`);
      }

      const resJson = await response.json();
      resultMessageId = resJson.id;
    }

    return {
      success: true,
      messageId: resultMessageId,
      destinatarios,
    };
  } catch (error: any) {
    console.error('Error al enviar reporte vía Gmail API:', error);
    return {
      success: false,
      error: error?.message || 'Error desconocido al enviar reporte vía Gmail.',
      destinatarios,
    };
  }
}

/**
 * Genera el cuerpo en HTML estructurado para la alerta de sílabo rechazado por Gerencia General
 */
export function generarHtmlAlertaRechazoSilabo(
  proyecto: ProyectoEducativo,
  motivoRechazo: string,
  moneda: Moneda = 'LPS'
): string {
  const codPry = proyecto.codigoProyecto || proyecto.codigoPrograma || `SIG-ACAD-${proyecto.id.slice(0, 6)}`;
  const codSAR = proyecto.correlativoSAR || '000-001-01-00000001';
  const nombre = proyecto.nombreProyecto || 'Proyecto Educativo';
  const fechaHora = `${new Date().toLocaleDateString('es-HN')} ${new Date().toLocaleTimeString('es-HN')}`;
  const costoTotal = (proyecto.gastoTotalOperativo || 0) + (proyecto.costoDocenteCalculado || 0);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fff1f2; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 2px solid #fda4af; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(225, 29, 72, 0.1); }
    .header { background: linear-gradient(135deg, #881337 0%, #4c0519 100%); padding: 26px 24px; color: #ffffff; text-align: center; }
    .badge-urgent { display: inline-block; background: #e11d48; color: #ffffff; font-size: 11px; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; margin-bottom: 10px; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 900; letter-spacing: -0.02em; color: #ffffff; }
    .header p { margin: 6px 0 0 0; font-size: 12px; color: #fecdd3; }
    .content { padding: 26px 24px; }
    .alert-banner { background: #fff1f2; border: 2px solid #f43f5e; border-radius: 10px; padding: 16px; margin-bottom: 22px; }
    .alert-title { font-size: 15px; font-weight: 800; color: #9f1239; margin: 0 0 4px 0; }
    .alert-meta { font-size: 12px; color: #881337; font-family: monospace; }
    .motivo-box { background: #ffffff; border-left: 5px solid #e11d48; padding: 14px 18px; border-radius: 6px; margin: 18px 0; border-top: 1px solid #ffe4e6; border-right: 1px solid #ffe4e6; border-bottom: 1px solid #ffe4e6; }
    .motivo-label { font-size: 11px; font-weight: 900; color: #9f1239; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 6px; }
    .motivo-text { font-size: 13px; font-weight: 600; color: #4c0519; line-height: 1.55; margin: 0; }
    .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #475569; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px; margin: 22px 0 12px 0; letter-spacing: 0.05em; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
    .data-table td { padding: 9px 12px; border-bottom: 1px solid #f8fafc; }
    .data-table td.label { font-weight: 700; color: #64748b; width: 42%; }
    .data-table td.val { color: #0f172a; font-weight: 600; }
    .steps-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 14px 18px; margin-top: 20px; font-size: 12px; color: #334155; }
    .steps-box ol { margin: 6px 0 0 18px; padding: 0; }
    .steps-box li { margin-bottom: 4px; }
    .footer { background: #f8fafc; padding: 18px 24px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge-urgent">🚨 ALERTA PROACTIVA INTER-GERENCIAL</span>
      <h1>SUMMIT IMPULSA GLOBAL</h1>
      <p>Notificación de Sílabo Devuelto para Corrección Inmediata</p>
    </div>

    <div class="content">
      <div class="alert-banner">
        <div class="alert-title">SÍLABO RECHAZADO POR GERENCIA GENERAL</div>
        <div class="alert-meta">
          Código Empresa: ${codPry} | SAR: ${codSAR} | Programa: ${nombre}
        </div>
      </div>

      <p style="font-size: 13px; line-height: 1.5; color: #334155; margin-top: 0;">
        Estimada <strong>Gerencia Académica (Phd. Donal Reyes)</strong>:
      </p>
      <p style="font-size: 13px; line-height: 1.5; color: #334155;">
        La <strong>Gerencia General (Dr. Walter Rene Pedroza)</strong> ha completado la revisión financiera y pedagógica del sílabo oficial registrado y ha emitido un <strong>DICTAMEN DE RECHAZO / RETORNO</strong>. El proyecto no puede trasladarse a Comercialización hasta que los puntos señalados sean subsanados.
      </p>

      <div class="motivo-box">
        <span class="motivo-label">Dictamen & Razón del Rechazo emitida por Gerencia General:</span>
        <p class="motivo-text">"${motivoRechazo}"</p>
      </div>

      <div class="section-title">Parámetros del Programa Retornado</div>
      <table class="data-table">
        <tr>
          <td class="label">Programa Académico:</td>
          <td class="val">${nombre}</td>
        </tr>
        <tr>
          <td class="label">Docente Asignado:</td>
          <td class="val">${proyecto.nombreDocente || 'Docente Especialista'}</td>
        </tr>
        <tr>
          <td class="label">Carga Horaria:</td>
          <td class="val">${proyecto.horasClase || 0} horas clase</td>
        </tr>
        <tr>
          <td class="label">Costo Operativo Base:</td>
          <td class="val">${formatearMoneda(costoTotal, moneda)}</td>
        </tr>
        <tr>
          <td class="label">Punto de Equilibrio:</td>
          <td class="val">${proyecto.puntoEquilibrioAlumnos || 0} participantes requeridos</td>
        </tr>
        <tr>
          <td class="label">Fecha y Hora de Emisión:</td>
          <td class="val">${fechaHora}</td>
        </tr>
        <tr>
          <td class="label">Firmado por:</td>
          <td class="val">Dr. Walter Rene Pedroza — Gerencia General</td>
        </tr>
      </table>

      <div class="steps-box">
        <strong style="color: #0f172a; text-transform: uppercase; font-size: 11px;">Protocolo de Corrección Académica:</strong>
        <ol>
          <li>Ingresar a la pestaña <strong>Gerencia Académica</strong> en el sistema SUMMIT.</li>
          <li>Acceder a la subpestaña <strong>❌ Rechazados por GG</strong> o pulsar <strong>"🛠️ Corregir Sílabo"</strong> en la ficha del programa.</li>
          <li>Ajustar la tarifa hora docente, costos directos o cupos mínimos para cumplir la meta de margen del 25% con ISV 15%.</li>
          <li>Guardar el sílabo actualizado. El sistema generará automáticamente un nuevo sello y lo remitirá a Gerencia General para su aprobación definitiva.</li>
        </ol>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 4px 0; font-weight: 700; color: #334155;">
        SUMMIT IMPULSA GLOBAL, S.A. DE C.V. — Sistema de Gobernanza Educativa
      </p>
      <p style="margin: 0; font-size: 10px; color: #94a3b8;">
        Destinatarios: Gerencia Académica (${CREDENCIALES_GERENCIAS.academica.correo}) con copia a Gerencia General (${CREDENCIALES_GERENCIAS.administracion.correo}).
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Genera el enlace URI mailto para abrir directamente en el cliente de correo predeterminado
 */
export function generarMailtoRechazoSilabo(
  proyecto: ProyectoEducativo,
  motivoRechazo: string
): string {
  const codPry = proyecto.codigoProyecto || proyecto.codigoPrograma || `SIG-ACAD-${proyecto.id.slice(0, 6)}`;
  const nombre = proyecto.nombreProyecto || 'Programa Educativo';
  const destinatario = CREDENCIALES_GERENCIAS.academica.correo;
  const cc = CREDENCIALES_GERENCIAS.administracion.correo;
  const asunto = `[URGENTE - RECHAZO GG] Corrección Inmediata de Sílabo: ${codPry} - ${nombre}`;
  
  const cuerpo = `SUMMIT IMPULSA GLOBAL - ALERTA PROACTIVA DE GERENCIA GENERAL
================================================================================
ATENCIÓN URGENTE: GERENCIA ACADÉMICA (Phd. Donal Reyes)
De: Dr. Walter Rene Pedroza (Gerencia General)
Fecha: ${new Date().toLocaleDateString('es-HN')} ${new Date().toLocaleTimeString('es-HN')}

El sílabo oficial del proyecto "${nombre}" (${codPry}) ha sido RECHAZADO por la Gerencia General y requiere corrección inmediata antes de ser trasladado a Comercialización.

MOTIVO Y OBSERVACIONES DE GERENCIA GENERAL:
--------------------------------------------------------------------------------
"${motivoRechazo}"
--------------------------------------------------------------------------------

ACCIONES REQUERIDAS:
1. Abrir el sílabo en la pestaña "Gerencia Académica" -> "Rechazados por GG".
2. Aplicar los ajustes en costos operativos, tarifa docente o precios.
3. Reenviar a Gerencia General para su dictamen de aprobación definitiva.

Atentamente,
Dr. Walter Rene Pedroza
Gerencia General
Summit Impulsa Global, S.A. de C.V.
`;

  return `mailto:${encodeURIComponent(destinatario)}?cc=${encodeURIComponent(cc)}&subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
}

export interface ResultadoAlertaRechazoEmail {
  success: boolean;
  messageId?: string;
  simulado: boolean;
  destinatarios: string[];
  asunto: string;
  cuerpoHtml: string;
  mailtoUrl: string;
  error?: string;
}

/**
 * Envía la alerta de rechazo de sílabo por email a la Gerencia Académica
 * Intenta enviar vía Gmail API si hay credenciales disponibles,
 * o genera el registro interactivo con fallback a mailto.
 */
export async function enviarAlertaRechazoSilaboEmail(
  proyecto: ProyectoEducativo,
  motivoRechazo: string,
  moneda: Moneda = 'LPS',
  destinatariosPersonalizados?: string[]
): Promise<ResultadoAlertaRechazoEmail> {
  const codPry = proyecto.codigoProyecto || proyecto.codigoPrograma || `SIG-ACAD-${proyecto.id.slice(0, 6)}`;
  const nombre = proyecto.nombreProyecto || 'Programa Educativo';
  const destinatarios = destinatariosPersonalizados || [
    CREDENCIALES_GERENCIAS.academica.correo,      // academia.summitg@gmail.com
    CREDENCIALES_GERENCIAS.administracion.correo, // administracion.summitg@gmail.com
  ];

  const asunto = `🚨 [URGENTE - CORRECCIÓN INMEDIATA] Sílabo Rechazado por GG: ${codPry} - ${nombre}`;
  const cuerpoHtml = generarHtmlAlertaRechazoSilabo(proyecto, motivoRechazo, moneda);
  const mailtoUrl = generarMailtoRechazoSilabo(proyecto, motivoRechazo);

  // 1. Intentar enviar vía Gmail API si hay token activo
  try {
    const token = getDriveAccessToken();
    if (token) {
      await cargarGapiClient();
      const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(asunto)))}?=`;
      const emailLines = [
        `To: ${destinatarios.join(', ')}`,
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
        body: JSON.stringify({ raw: base64UrlEmail }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          messageId: data.id,
          simulado: false,
          destinatarios,
          asunto,
          cuerpoHtml,
          mailtoUrl,
        };
      }
    }
  } catch (err) {
    console.warn('Envío Gmail API no completado directamente, activando modo simulado/registrado:', err);
  }

  // Fallback: notificación registrada con éxito en el sistema y enlace mailto disponible
  return {
    success: true,
    messageId: `msg-alerta-rechazo-${Date.now()}`,
    simulado: true,
    destinatarios,
    asunto,
    cuerpoHtml,
    mailtoUrl,
  };
}
