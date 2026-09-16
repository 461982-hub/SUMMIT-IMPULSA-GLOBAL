/**
 * SISTEMA DE AUTENTICACIÓN Y SEGURIDAD POR GERENCIAS (OPCIÓN A)
 * Summit Impulsa Global, S.A. de C.V.
 * 
 * Perfiles Directivos e Institucionales:
 * 1. Gerencia General (Dr. Walter René Pedroza) - PIN: 8826
 * 2. Gerencia Académica (Phd. Donal Reyes) - PIN: 1024
 * 3. Gerencia Comercial y Expansión (Msc. Lilian Ordoñez) - PIN: 2048
 * 4. Auditoría Interna / Control SAR (Lic. Auditoría) - PIN: 4096
 */

export type RolGerencia = 
  | 'gerencia-general' 
  | 'gerencia-academica' 
  | 'gerencia-comercializacion' 
  | 'auditor-interno';

export interface PermisosRol {
  puedeCrearProyectos: boolean;
  puedeEditarAcademica: boolean;
  puedeEditarComercial: boolean;
  puedeDictaminarGeneral: boolean;
  puedeAutorizarCostosFijos: boolean;
  puedeAprobarPOA: boolean;
  puedeRechazarSilabos: boolean;
  puedeEliminarProyectos: boolean;
  puedeModificarConfiguraciones: boolean;
  esSoloLectura: boolean;
}

export interface PerfilGerencia {
  id: RolGerencia;
  claveCorta: 'general' | 'academica' | 'comercial' | 'auditor';
  nombre: string;
  departamento: string;
  titular: string;
  cargo: string;
  correo: string;
  pinDefault: string;
  colorTema: {
    badgeBg: string;
    badgeText: string;
    accentColor: string;
    border: string;
    bgLight: string;
  };
  descripcion: string;
  permisos: PermisosRol;
}

export const PERFILES_GERENCIA: Record<RolGerencia, PerfilGerencia> = {
  'gerencia-general': {
    id: 'gerencia-general',
    claveCorta: 'general',
    nombre: 'Gerencia General',
    departamento: 'Dirección Ejecutiva, Legal & Gobernanza POA',
    titular: 'Dr. Walter René Pedroza',
    cargo: 'Gerente General & Director Ejecutivo',
    correo: 'administracion.summitg@gmail.com',
    pinDefault: '8826',
    colorTema: {
      badgeBg: 'bg-purple-700',
      badgeText: 'text-white',
      accentColor: 'text-purple-600',
      border: 'border-purple-300',
      bgLight: 'bg-purple-50',
    },
    descripcion: 'Control total de la matriz, dictamen oficial de cursos, rebaja de meta mensual POA, autorización de costos fijos y auditoría integral.',
    permisos: {
      puedeCrearProyectos: true,
      puedeEditarAcademica: true,
      puedeEditarComercial: true,
      puedeDictaminarGeneral: true,
      puedeAutorizarCostosFijos: true,
      puedeAprobarPOA: true,
      puedeRechazarSilabos: true,
      puedeEliminarProyectos: true,
      puedeModificarConfiguraciones: true,
      esSoloLectura: false,
    },
  },
  'gerencia-academica': {
    id: 'gerencia-academica',
    claveCorta: 'academica',
    nombre: 'Gerencia Académica',
    departamento: 'Pilar Curricular, Formación & Gestión Docente',
    titular: 'Phd. Donal Reyes',
    cargo: 'Gerente Académico & Director Curricular',
    correo: 'academia.summitg@gmail.com',
    pinDefault: '1024',
    colorTema: {
      badgeBg: 'bg-blue-600',
      badgeText: 'text-white',
      accentColor: 'text-blue-600',
      border: 'border-blue-300',
      bgLight: 'bg-blue-50',
    },
    descripcion: 'Creación de programas educativos, formulación de syllabus, cálculo de tarifas y horas docentes, y expedientes pedagógicos.',
    permisos: {
      puedeCrearProyectos: true,
      puedeEditarAcademica: true,
      puedeEditarComercial: false,
      puedeDictaminarGeneral: false,
      puedeAutorizarCostosFijos: false,
      puedeAprobarPOA: false,
      puedeRechazarSilabos: false,
      puedeEliminarProyectos: false,
      puedeModificarConfiguraciones: false,
      esSoloLectura: false,
    },
  },
  'gerencia-comercializacion': {
    id: 'gerencia-comercializacion',
    claveCorta: 'comercial',
    nombre: 'Gerencia de Comercialización',
    departamento: 'Dirección Comercial, B2B, Expansión & Matrícula',
    titular: 'Msc. Lilian Ordoñez',
    cargo: 'Gerente de Comercialización & Expansión',
    correo: 'comercial.summitg@gmail.com',
    pinDefault: '2048',
    colorTema: {
      badgeBg: 'bg-emerald-600',
      badgeText: 'text-white',
      accentColor: 'text-emerald-600',
      border: 'border-emerald-300',
      bgLight: 'bg-emerald-50',
    },
    descripcion: 'Fijación de precios preventa, gestión de canales de comercialización, matrícula de alumnos reales, cálculo de CAC/ROAS y encuestas de satisfacción.',
    permisos: {
      puedeCrearProyectos: false,
      puedeEditarAcademica: false,
      puedeEditarComercial: true,
      puedeDictaminarGeneral: false,
      puedeAutorizarCostosFijos: false,
      puedeAprobarPOA: false,
      puedeRechazarSilabos: false,
      puedeEliminarProyectos: false,
      puedeModificarConfiguraciones: false,
      esSoloLectura: false,
    },
  },
  'auditor-interno': {
    id: 'auditor-interno',
    claveCorta: 'auditor',
    nombre: 'Auditoría Interna & Control SAR',
    departamento: 'Fiscalización Tributaria, SAR & Cumplimiento Normativo',
    titular: 'Lic. Auditoría & Control Interno',
    cargo: 'Auditor Financiero & Fiscal Institucional',
    correo: 'auditoria.summitg@gmail.com',
    pinDefault: '4096',
    colorTema: {
      badgeBg: 'bg-amber-600',
      badgeText: 'text-white',
      accentColor: 'text-amber-600',
      border: 'border-amber-300',
      bgLight: 'bg-amber-50',
    },
    descripcion: 'Monitoreo de cumplimiento tributario ante el SAR (ISV 15%), control de correlativos de facturación, revisión de márgenes y descarga de actas oficiales.',
    permisos: {
      puedeCrearProyectos: false,
      puedeEditarAcademica: false,
      puedeEditarComercial: false,
      puedeDictaminarGeneral: false,
      puedeAutorizarCostosFijos: false,
      puedeAprobarPOA: false,
      puedeRechazarSilabos: false,
      puedeEliminarProyectos: false,
      puedeModificarConfiguraciones: false,
      esSoloLectura: true,
    },
  },
};

const STORAGE_KEY_USUARIO_ACTIVO = 'summit_auth_usuario_activo_gerencia';
const STORAGE_KEY_PINS = 'summit_auth_pins_gerencias_v1';

/**
 * Obtiene los PINs actuales guardados en el navegador o los valores por defecto
 */
export function getPinsConfigurados(): Record<RolGerencia, string> {
  try {
    const data = localStorage.getItem(STORAGE_KEY_PINS);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        'gerencia-general': parsed['gerencia-general'] || PERFILES_GERENCIA['gerencia-general'].pinDefault,
        'gerencia-academica': parsed['gerencia-academica'] || PERFILES_GERENCIA['gerencia-academica'].pinDefault,
        'gerencia-comercializacion': parsed['gerencia-comercializacion'] || PERFILES_GERENCIA['gerencia-comercializacion'].pinDefault,
        'auditor-interno': parsed['auditor-interno'] || PERFILES_GERENCIA['auditor-interno'].pinDefault,
      };
    }
  } catch (e) {
    console.error('Error al cargar PINs de gerencia:', e);
  }

  return {
    'gerencia-general': PERFILES_GERENCIA['gerencia-general'].pinDefault,
    'gerencia-academica': PERFILES_GERENCIA['gerencia-academica'].pinDefault,
    'gerencia-comercializacion': PERFILES_GERENCIA['gerencia-comercializacion'].pinDefault,
    'auditor-interno': PERFILES_GERENCIA['auditor-interno'].pinDefault,
  };
}

/**
 * Guarda un nuevo PIN para una gerencia específica
 */
export function actualizarPinGerencia(rol: RolGerencia, nuevoPin: string): boolean {
  if (!nuevoPin || nuevoPin.trim().length < 4) return false;
  try {
    const pins = getPinsConfigurados();
    pins[rol] = nuevoPin.trim();
    localStorage.setItem(STORAGE_KEY_PINS, JSON.stringify(pins));
    return true;
  } catch (e) {
    console.error('Error al guardar PIN:', e);
    return false;
  }
}

/**
 * Valida si el PIN ingresado coincide con el del rol seleccionado
 */
export function validarPinGerencia(rol: RolGerencia, pinIngresado: string): boolean {
  const pins = getPinsConfigurados();
  const pinEsperado = pins[rol];
  return pinIngresado.trim() === pinEsperado.trim();
}

/**
 * Obtiene el perfil actualmente activo
 */
export function getUsuarioActivo(): PerfilGerencia {
  try {
    const rolGuardado = localStorage.getItem(STORAGE_KEY_USUARIO_ACTIVO) as RolGerencia | null;
    if (rolGuardado && PERFILES_GERENCIA[rolGuardado]) {
      return PERFILES_GERENCIA[rolGuardado];
    }
  } catch (e) {
    console.error('Error al leer usuario activo:', e);
  }

  // Por defecto, Gerencia General está activa
  return PERFILES_GERENCIA['gerencia-general'];
}

/**
 * Establece el nuevo perfil activo tras autenticación
 */
export function setUsuarioActivo(rol: RolGerencia): void {
  try {
    localStorage.setItem(STORAGE_KEY_USUARIO_ACTIVO, rol);
    window.dispatchEvent(new CustomEvent('summit-auth-usuario-cambio', { detail: { rol } }));
  } catch (e) {
    console.error('Error al guardar usuario activo:', e);
  }
}

/**
 * Cierra la sesión activa y retorna a Gerencia General por defecto
 */
export function cerrarSesionGerencia(): void {
  setUsuarioActivo('gerencia-general');
}

/**
 * Verifica si el usuario actual posee un permiso determinado
 */
export function usuarioTienePermiso(permiso: keyof PermisosRol, rolActual?: RolGerencia): boolean {
  const rol = rolActual ? PERFILES_GERENCIA[rolActual] : getUsuarioActivo();
  return Boolean(rol.permisos[permiso]);
}
