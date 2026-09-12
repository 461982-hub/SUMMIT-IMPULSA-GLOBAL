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
