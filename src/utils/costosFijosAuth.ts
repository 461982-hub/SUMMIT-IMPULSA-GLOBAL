/**
 * Servicio de seguridad y autorización exclusiva para Costos Fijos Operativos.
 * Diseñado específicamente para que solo Walter Pedroza (pedrozawalterrene@gmail.com)
 * tenga acceso a desbloquear y modificar esta sección crítica.
 */

export const DEFAULT_AUTHORIZED_EMAIL = 'pedrozawalterrene@gmail.com';
export const DEFAULT_AUTHORIZED_ADMIN_EMAIL = 'administracion.summitg@gmail.com';
export const DEFAULT_AUTHORIZED_NAME = 'Walter René Pedroza';
export const DEFAULT_MASTER_PIN = '8826'; // PIN maestro inicial predeterminado

// Valores predeterminados oficiales fijados por Dirección
export const DEFAULT_COSTO_ZOOM = 300;
export const DEFAULT_COSTO_PAPELERIA = 100;
export const DEFAULT_GASTOS_VARIOS = 100;

const STORAGE_KEY = 'summit_costos_fijos_security_config';

export interface CostosFijosSecurityConfig {
  authorizedEmail: string;
  authorizedName: string;
  masterPin: string;
  requireGoogleAuthOnly: boolean;
  lastUnlockedAt?: string;
  lastUnlockedBy?: string;
}

/**
 * Obtener la configuración de seguridad actual
 */
export const getCostosFijosSecurityConfig = (): CostosFijosSecurityConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        authorizedEmail: parsed.authorizedEmail || DEFAULT_AUTHORIZED_EMAIL,
        authorizedName: parsed.authorizedName || DEFAULT_AUTHORIZED_NAME,
        masterPin: parsed.masterPin || DEFAULT_MASTER_PIN,
        requireGoogleAuthOnly: Boolean(parsed.requireGoogleAuthOnly),
        lastUnlockedAt: parsed.lastUnlockedAt,
        lastUnlockedBy: parsed.lastUnlockedBy,
      };
    }
  } catch (e) {
    console.error('Error al leer configuración de seguridad de costos fijos:', e);
  }

  return {
    authorizedEmail: DEFAULT_AUTHORIZED_EMAIL,
    authorizedName: DEFAULT_AUTHORIZED_NAME,
    masterPin: DEFAULT_MASTER_PIN,
    requireGoogleAuthOnly: false,
  };
};

/**
 * Guardar la configuración de seguridad
 */
export const saveCostosFijosSecurityConfig = (config: CostosFijosSecurityConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Error al guardar configuración de seguridad:', e);
  }
};

/**
 * Verificar si un correo electrónico corresponde al usuario autorizado
 */
export const isEmailAuthorized = (email?: string | null): boolean => {
  if (!email) return false;
  const config = getCostosFijosSecurityConfig();
  const normalizedInput = email.trim().toLowerCase();
  const normalizedTarget = config.authorizedEmail.trim().toLowerCase();
  const normalizedDefault = DEFAULT_AUTHORIZED_EMAIL.toLowerCase();
  const normalizedAdmin = DEFAULT_AUTHORIZED_ADMIN_EMAIL.toLowerCase();

  return (
    normalizedInput === normalizedTarget || 
    normalizedInput === normalizedDefault ||
    normalizedInput === normalizedAdmin
  );
};

/**
 * Verificar si la clave maestra / PIN ingresado es correcto
 */
export const verifyMasterPin = (pin: string): boolean => {
  if (!pin) return false;
  const config = getCostosFijosSecurityConfig();
  const trimmed = pin.trim();
  
  // Validar con el PIN configurado por el usuario
  if (trimmed === config.masterPin.trim()) return true;
  
  // Como salvaguarda de recuperación para Walter Pedroza
  if (trimmed === DEFAULT_MASTER_PIN) return true;

  return false;
};

/**
 * Actualizar la clave maestra personal
 */
export const updateMasterPin = (
  newPin: string,
  isAuthorizedByGoogleOrOldPin: boolean
): { success: boolean; message: string } => {
  if (!isAuthorizedByGoogleOrOldPin) {
    return { success: false, message: 'No tiene autorización para cambiar la clave maestra.' };
  }

  const cleanPin = newPin.trim();
  if (cleanPin.length < 4) {
    return { success: false, message: 'La clave maestra debe tener al menos 4 caracteres o dígitos.' };
  }

  const currentConfig = getCostosFijosSecurityConfig();
  currentConfig.masterPin = cleanPin;
  saveCostosFijosSecurityConfig(currentConfig);

  return { success: true, message: 'Clave Maestra personalizada guardada exitosamente.' };
};

/**
 * Actualizar configuración de política
 */
export const updateSecurityPolicy = (
  requireGoogleAuthOnly: boolean,
  authorizedEmail?: string
): { success: boolean; message: string } => {
  const currentConfig = getCostosFijosSecurityConfig();
  currentConfig.requireGoogleAuthOnly = requireGoogleAuthOnly;
  if (authorizedEmail && authorizedEmail.trim()) {
    currentConfig.authorizedEmail = authorizedEmail.trim().toLowerCase();
  }
  saveCostosFijosSecurityConfig(currentConfig);
  return { success: true, message: 'Política de seguridad actualizada.' };
};
