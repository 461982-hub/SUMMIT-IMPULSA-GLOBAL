/**
 * SISTEMA DE SEGURIDAD DIRECTIVA & CONTROL DE CUMPLIMIENTO POA SEP - DIC 2026
 * Summit Impulsa Global, S.A. de C.V.
 *
 * Parámetro de Seguridad:
 * "Solo la Gerencia General puede realizar cambios de cualquier índole,
 * esto para garantizar el cumplimiento del POA."
 *
 * Titular autorizado: Dr. Walter René Pedroza (administracion.summitg@gmail.com / pedrozawalterrene@gmail.com)
 * PIN Maestro de Respaldo: 8826
 */

import { verifyMasterPin, isEmailAuthorized, DEFAULT_AUTHORIZED_EMAIL, DEFAULT_AUTHORIZED_ADMIN_EMAIL } from './costosFijosAuth';

const STORAGE_PARAM_KEY = 'summit_parametro_seguridad_solo_gerencia_general';
const SESSION_AUTH_KEY = 'summit_session_gerencia_general_autorizada';
const SESSION_AUTH_TIMESTAMP_KEY = 'summit_session_gg_auth_timestamp';
const SESSION_TIMEOUT_MS = 6 * 60 * 60 * 1000; // 6 horas de sesión activa

/**
 * Consulta si el parámetro de seguridad exclusiva de Gerencia General está activo.
 * Por defecto es TRUE para garantizar el cumplimiento estricto del POA SEP - DIC 2026.
 */
export function isSeguridadSoloGerenciaGeneralActiva(): boolean {
  try {
    const valor = localStorage.getItem(STORAGE_PARAM_KEY);
    if (valor === null) {
      // Activo por defecto según directriz de gobernanza
      return true;
    }
    return valor === 'true';
  } catch (e) {
    console.error('Error al leer parámetro de seguridad de Gerencia General:', e);
    return true;
  }
}

/**
 * Permite a la Gerencia General activar o desactivar este parámetro de seguridad.
 */
export function setSeguridadSoloGerenciaGeneralActiva(activa: boolean): void {
  try {
    localStorage.setItem(STORAGE_PARAM_KEY, activa ? 'true' : 'false');
    // Disparar evento para que componentes reactivos se sincronicen
    window.dispatchEvent(new CustomEvent('summit-seguridad-gg-cambio', { detail: { activa } }));
  } catch (e) {
    console.error('Error al guardar parámetro de seguridad:', e);
  }
}

/**
 * Verifica si el usuario actual cuenta con autorización de Gerencia General.
 * Valida sesión en sessionStorage o coincidencia de correo electrónico Google.
 */
export function isGerenciaGeneralAutorizada(emailUsuario?: string | null): boolean {
  // 1. Si no está activo el parámetro, no se requiere restricción
  if (!isSeguridadSoloGerenciaGeneralActiva()) {
    return true;
  }

  // 2. Si el correo de Google coincide con las cuentas del Dr. Walter Pedroza
  if (emailUsuario && isEmailAuthorized(emailUsuario)) {
    return true;
  }

  // 3. Si la sesión fue autorizada mediante el PIN maestro en esta pestaña
  try {
    const authSession = sessionStorage.getItem(SESSION_AUTH_KEY);
    const timestampStr = sessionStorage.getItem(SESSION_AUTH_TIMESTAMP_KEY);
    
    if (authSession === 'true' && timestampStr) {
      const timestamp = parseInt(timestampStr, 10);
      if (Date.now() - timestamp < SESSION_TIMEOUT_MS) {
        return true;
      } else {
        // Expiró la sesión
        sessionStorage.removeItem(SESSION_AUTH_KEY);
        sessionStorage.removeItem(SESSION_AUTH_TIMESTAMP_KEY);
      }
    }
  } catch (e) {
    console.error('Error al verificar sesión de Gerencia General:', e);
  }

  return false;
}

/**
 * Autoriza la sesión activa como Gerencia General mediante PIN maestro
 */
export function autorizarGerenciaGeneralConPin(pin: string): { success: boolean; message: string } {
  if (verifyMasterPin(pin)) {
    try {
      sessionStorage.setItem(SESSION_AUTH_KEY, 'true');
      sessionStorage.setItem(SESSION_AUTH_TIMESTAMP_KEY, Date.now().toString());
      window.dispatchEvent(new CustomEvent('summit-seguridad-gg-auth', { detail: { autorizada: true } }));
      return {
        success: true,
        message: 'Identidad de Gerencia General verificada exitosamente. Permisos de modificación habilitados.',
      };
    } catch (e) {
      console.error('Error guardando sesión:', e);
    }
    return { success: true, message: 'Identidad verificada exitosamente.' };
  }

  return {
    success: false,
    message: 'PIN incorrecto. Solo la Gerencia General (Dr. Walter Pedroza) está facultada para realizar cambios.',
  };
}

/**
 * Cierra la sesión autorizada de Gerencia General
 */
export function cerrarSesionGerenciaGeneral(): void {
  try {
    sessionStorage.removeItem(SESSION_AUTH_KEY);
    sessionStorage.removeItem(SESSION_AUTH_TIMESTAMP_KEY);
    window.dispatchEvent(new CustomEvent('summit-seguridad-gg-auth', { detail: { autorizada: false } }));
  } catch (e) {
    console.error('Error cerrando sesión:', e);
  }
}

/**
 * Valida si se puede proceder con una modificación en el sistema.
 */
export function verificarPermisoModificacion(emailUsuario?: string | null): { 
  permitido: boolean; 
  motivo?: string 
} {
  if (!isSeguridadSoloGerenciaGeneralActiva()) {
    return { permitido: true };
  }

  if (isGerenciaGeneralAutorizada(emailUsuario)) {
    return { permitido: true };
  }

  return {
    permitido: false,
    motivo: 'Parámetro de Seguridad Activo: Solo la Gerencia General (Dr. Walter Pedroza / administracion.summitg@gmail.com) puede realizar cambios de cualquier índole para garantizar el estricto cumplimiento del POA SEP - DIC 2026.',
  };
}

export const DATOS_SEGURIDAD_GERENCIA_GENERAL = {
  titular: 'Dr. Walter René Pedroza',
  cargo: 'Gerencia General / Dirección Ejecutiva',
  correoOficial: 'administracion.summitg@gmail.com',
  correoAlterno: 'pedrozawalterrene@gmail.com',
  pinPredeterminado: '8826',
  proposito: 'Garantizar el cumplimiento del Plan Operativo Anual (POA) SEP - DIC 2026 y blindar las metas de facturación.',
};
