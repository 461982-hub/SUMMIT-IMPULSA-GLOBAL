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
import { ProyectoEducativo, Moneda, NotificacionGerencia } from '../types';
import { formatearMoneda, calcularMetricasProyecto } from '../utils/calculations';

// Carpeta oficial de destino en Google Drive proporcionada por el usuario
export const TARGET_DRIVE_FOLDER_ID = '1BfPp5crIA2H5XDqm1010aqtXXGzmS-Rw';
export const TARGET_DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/1BfPp5crIA2H5XDqm1010aqtXXGzmS-Rw?usp=sharing';

// Scopes necesarios para Google Drive y Google Calendar
export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/calendar.events',
];

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const driveAuth = getAuth(app);

const provider = new GoogleAuthProvider();
DRIVE_SCOPES.forEach((scope) => {
  provider.addScope(scope);
});
provider.setCustomParameters({
  prompt: 'consent',
});

const TOKEN_STORAGE_KEY = 'summit_google_oauth_token';
let cachedDriveToken: string | null = null;
let isDriveSigningIn = false;

/**
 * Obtener el token de acceso actual en memoria o sessionStorage
 */
export const getDriveAccessToken = (): string | null => {
  if (cachedDriveToken) return cachedDriveToken;
  try {
    const saved = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (saved) {
      cachedDriveToken = saved;
      return saved;
    }
  } catch (e) {
    console.warn('No se pudo acceder a sessionStorage para el token de Drive:', e);
  }
  return null;
};

/**
 * Guardar el token en memoria y sessionStorage
 */
export const setDriveAccessToken = (token: string | null) => {
  cachedDriveToken = token;
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch (e) {
    console.warn('Error al guardar token de Drive en sessionStorage:', e);
  }
};

/**
 * Iniciar sesión con Google para Drive
 */
export const signInWithGoogleDrive = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isDriveSigningIn = true;
    const result = await signInWithPopup(driveAuth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;

    if (!token) {
      throw new Error('No se pudo obtener el token de acceso OAuth para Google Drive.');
    }

    setDriveAccessToken(token);
    return { user: result.user, accessToken: token };
  } catch (error: any) {
    console.error('Error al autenticar con Google Drive:', error);
    throw error;
  } finally {
    isDriveSigningIn = false;
  }
};

/**
 * Cerrar sesión de Google Drive
 */
export const signOutGoogleDrive = async (): Promise<void> => {
  await signOut(driveAuth);
  setDriveAccessToken(null);
};

/**
 * Listener de sesión de Google
 */
export const initGoogleDriveAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(driveAuth, async (user: User | null) => {
    if (user) {
      const currentToken = getDriveAccessToken();
      if (onAuthSuccess) {
        onAuthSuccess(user, currentToken);
      }
    } else {
      setDriveAccessToken(null);
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export interface DriveUploadedFile {
  id: string;
  name: string;
  webViewLink?: string;
  modifiedTime?: string;
  size?: string;
  isUpdate: boolean;
}

export interface DriveSyncResult {
  success: boolean;
  timestamp: string;
  files: DriveUploadedFile[];
  folderId: string;
  folderUrl: string;
  error?: string;
}

/**
 * Buscar si un archivo existe dentro de la carpeta especificada
 */
export const findFileInDriveFolder = async (
  fileName: string,
  folderId: string = TARGET_DRIVE_FOLDER_ID,
  accessToken?: string
): Promise<{ id: string; name: string; webViewLink?: string; modifiedTime?: string } | null> => {
  const token = accessToken || getDriveAccessToken();
  if (!token) throw new Error('No hay sesión de Google activa con token de acceso.');

  const query = `'${folderId}' in parents and name = '${fileName.replace(/'/g, "\\'")}' and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,modifiedTime,webViewLink,size)&supportsAllDrives=true&includeItemsFromAllDrives=true`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.warn(`[Google Drive] Error al buscar archivo "${fileName}":`, res.status, errorText);
    return null;
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0];
  }
  return null;
};

/**
 * Subir o actualizar un archivo en la carpeta de Google Drive usando Multipart Upload
 */
export const uploadOrUpdateDriveFile = async (
  fileName: string,
  content: string,
  mimeType: string = 'application/json',
  folderId: string = TARGET_DRIVE_FOLDER_ID,
  accessToken?: string
): Promise<DriveUploadedFile> => {
  const token = accessToken || getDriveAccessToken();
  if (!token) {
    throw new Error('Token de Google Drive no disponible. Conecta tu cuenta para sincronizar.');
  }

  // Comprobar si ya existe el archivo en la carpeta
  const existingFile = await findFileInDriveFolder(fileName, folderId, token);
  const boundary = '-------SummitDriveBoundary' + Date.now();
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;

  if (existingFile) {
    // Actualizar archivo existente (PATCH)
    const metadata = {
      name: fileName,
      mimeType: mimeType,
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n` +
      content +
      closeDelim;

    const res = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart&supportsAllDrives=true&fields=id,name,webViewLink,modifiedTime,size`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Error actualizando archivo en Drive (${res.status}): ${errText}`);
    }

    const updated = await res.json();
    return {
      id: updated.id || existingFile.id,
      name: updated.name || fileName,
      webViewLink: updated.webViewLink || `https://drive.google.com/file/d/${existingFile.id}/view`,
      modifiedTime: updated.modifiedTime || new Date().toISOString(),
      isUpdate: true,
    };
  } else {
    // Crear archivo nuevo (POST)
    const metadata = {
      name: fileName,
      parents: [folderId],
      mimeType: mimeType,
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n` +
      content +
      closeDelim;

    const res = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,webViewLink,modifiedTime,size`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      // Si la carpeta compartida requiere permisos adicionales
      if (res.status === 403 || res.status === 404) {
        throw new Error(
          `No se pudo escribir en la carpeta "${folderId}". Verifica que la cuenta de Google tenga permisos de "Editor" en esa carpeta compartida. Detalle: ${errText}`
        );
      }
      throw new Error(`Error creando archivo en Google Drive (${res.status}): ${errText}`);
    }

    const created = await res.json();
    return {
      id: created.id,
      name: created.name || fileName,
      webViewLink: created.webViewLink || `https://drive.google.com/file/d/${created.id}/view`,
      modifiedTime: created.modifiedTime || new Date().toISOString(),
      isUpdate: false,
    };
  }
};

/**
 * Genera el informe ejecutivo consolidado en formato Markdown legible para Google Drive / Docs
 */
export const generarInformeEjecutivoMarkdown = (
  proyectos: ProyectoEducativo[],
  moneda: Moneda
): string => {
  const fechaGeneracion = new Date().toLocaleString('es-HN', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const proyectosConMetricas = proyectos.map((p) => ({
    proyecto: p,
    metricas: calcularMetricasProyecto(p),
  }));

  const totalIngresos = proyectosConMetricas.reduce((acc, item) => acc + (item.metricas.ingresoRealTotal || 0), 0);
  const totalCostos = proyectosConMetricas.reduce((acc, item) => acc + (item.metricas.gastoTotalOperativo || 0), 0);
  const totalGanancias = proyectosConMetricas.reduce((acc, item) => acc + (item.metricas.totalGananciasFinales || 0), 0);
  const totalAlumnos = proyectos.reduce((acc, p) => acc + (p.alumnosFinal || 0), 0);
  const totalRetencionISV = proyectosConMetricas.reduce((acc, item) => acc + (item.metricas.costoDocenteCalculado * 0.15 || 0), 0);
  const margenPromedio = totalIngresos > 0 ? ((totalGanancias / totalIngresos) * 100).toFixed(1) : '0.0';

  const proyectosCriticos = proyectosConMetricas.filter((item) => item.proyecto.alumnosFinal < item.metricas.puntoEquilibrioAlumnos);

  let md = `# SUMMIT IMPULSA GLOBAL
## MATRIZ DE RENTABILIDAD Y PROYECTOS EDUCATIVOS 2026
**Ubicación Oficial de Respaldo:** Google Drive  
**Fecha y Hora de Auto-Generación:** ${fechaGeneracion}  
**Moneda Oficial:** ${moneda}  
**Total de Proyectos:** ${proyectos.length}

---

### 1. RESUMEN FINANCIERO Y OPERATIVO CONSOLIDADO

| Indicador Estratégico | Valor Consolidado |
| :--- | :--- |
| **Ingresos Brutos Proyectados/Reales** | ${formatearMoneda(totalIngresos, moneda)} |
| **Costos Totales (Docentes + Operación)** | ${formatearMoneda(totalCostos, moneda)} |
| **Utilidad Neta Consolidada** | ${formatearMoneda(totalGanancias, moneda)} |
| **Margen Neto Promedio** | ${margenPromedio}% |
| **Alumnos Totales Matriculados** | ${totalAlumnos} alumnos |
| **Retención Fiscal SAR (15% ISV Docente)** | ${formatearMoneda(totalRetencionISV, moneda)} |
| **Proyectos en Riesgo / Bajo Equilibrio** | ${proyectosCriticos.length} proyecto(s) |

---

### 2. DETALLE DE PROYECTOS EDUCATIVOS REGISTRADOS

`;

  if (proyectos.length === 0) {
    md += `*No hay proyectos registrados en la matriz en este momento.*\n\n`;
  } else {
    md += `| Correlativo | Código | Nombre del Programa | Nivel | Alumnos | Precio Venta | Ingresos Totales | Costos Totales | Utilidad Neta | Margen % | Estado Dictamen |\n`;
    md += `| :---: | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n`;

    proyectosConMetricas.forEach(({ proyecto: p, metricas: m }) => {
      const corr = p.numeroCorrelativo ? String(p.numeroCorrelativo).padStart(3, '0') : '---';
      const cod = p.codigoFiscalSAR || p.codigoPrograma || '---';
      const nom = p.nombreProyecto.replace(/\|/g, '-');
      const mod = p.nivel || 'Básico';
      const alum = `${p.alumnosFinal} (PE: ${m.puntoEquilibrioAlumnos})`;
      const precio = formatearMoneda(m.precioSugeridoAlumno, moneda);
      const ing = formatearMoneda(m.ingresoRealTotal, moneda);
      const cost = formatearMoneda(m.gastoTotalOperativo, moneda);
      const uti = formatearMoneda(m.totalGananciasFinales, moneda);
      const margen = m.ingresoRealTotal > 0 ? `${((m.totalGananciasFinales / m.ingresoRealTotal) * 100).toFixed(1)}%` : '0.0%';
      const estado = p.seLlevoACabo || 'Planificado';

      md += `| ${corr} | ${cod} | ${nom} | ${mod} | ${alum} | ${precio} | ${ing} | ${cost} | ${uti} | ${margen} | ${estado} |\n`;
    });
  }

  md += `\n---

### 3. PROTOCOLO DE AUDITORÍA Y CUMPLIMIENTO FISCAL (SAR)
- **Tributación 15% ISV:** Los honorarios docentes reflejan el cálculo y retención de ley aplicable, validado contra exoneraciones del sistema educativo formal y gravamen sobre capacitaciones corporativas.
- **Puntos de Equilibrio:** Los cursos bajo punto de equilibrio se encuentran debidamente señalizados para renegociación o ajuste de aforo comercial.
- **Trazabilidad:** Cada cambio en la matriz cuenta con sello de fecha, usuario y gerencia responsable.

*Documento generado automáticamente por el Sistema Integral Multi-Gerencial Summit Impulsa Global y sincronizado en Google Drive.*
`;

  return md;
};

/**
 * Ejecuta la sincronización completa de toda la información en la carpeta de Google Drive
 */
export const syncAllDataToDrive = async (params: {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  notificaciones?: NotificacionGerencia[];
  accessToken?: string;
  folderId?: string;
}): Promise<DriveSyncResult> => {
  const {
    proyectos,
    moneda,
    notificaciones = [],
    accessToken,
    folderId = TARGET_DRIVE_FOLDER_ID,
  } = params;

  const token = accessToken || getDriveAccessToken();
  if (!token) {
    throw new Error('No hay sesión de Google activa con permisos de Drive. Conecta tu cuenta de Google.');
  }

  const timestamp = new Date().toISOString();
  const fechaLegible = new Date().toLocaleString('es-HN');
  const uploadedFiles: DriveUploadedFile[] = [];

  const proyectosConMetricas = proyectos.map((p) => ({
    proyecto: p,
    metricas: calcularMetricasProyecto(p),
  }));

  // 1. Archivo Base de Datos Principal JSON
  const payloadDatabase = {
    sistema: 'Summit Impulsa Global - Matriz de Rentabilidad Multi-Gerencial',
    version: '3.0-google-drive-sync',
    carpetaDestinoId: folderId,
    fechaSincronizacion: timestamp,
    fechaLegible: fechaLegible,
    moneda: moneda,
    totalProyectos: proyectos.length,
    metricasConsolidadas: {
      totalIngresos: proyectosConMetricas.reduce((acc, item) => acc + (item.metricas.ingresoRealTotal || 0), 0),
      totalCostos: proyectosConMetricas.reduce((acc, item) => acc + (item.metricas.gastoTotalOperativo || 0), 0),
      totalGanancias: proyectosConMetricas.reduce((acc, item) => acc + (item.metricas.totalGananciasFinales || 0), 0),
      totalAlumnos: proyectos.reduce((acc, p) => acc + (p.alumnosFinal || 0), 0),
    },
    proyectos: proyectos,
    notificaciones: notificaciones,
  };

  const jsonContent = JSON.stringify(payloadDatabase, null, 2);
  const fileJson = await uploadOrUpdateDriveFile(
    'MATRIZ_PROYECTOS_SUMMIT_2026.json',
    jsonContent,
    'application/json',
    folderId,
    token
  );
  uploadedFiles.push(fileJson);

  // 2. Informe Ejecutivo Consolidado en Markdown (fácil de leer en Google Drive)
  const markdownReport = generarInformeEjecutivoMarkdown(proyectos, moneda);
  const fileMarkdown = await uploadOrUpdateDriveFile(
    'INFORME_EJECUTIVO_CONSOLIDADO.md',
    markdownReport,
    'text/markdown',
    folderId,
    token
  );
  uploadedFiles.push(fileMarkdown);

  // 3. Registro de Auditoría y Dictámenes en JSON
  const auditData = {
    fechaInforme: timestamp,
    carpetaDestinoId: folderId,
    moneda: moneda,
    resumenAuditoria: {
      proyectosAuditados: proyectos.length,
      proyectosListos: proyectos.filter((p) => p.seLlevoACabo === 'Listo').length,
      proyectosPlanificados: proyectos.filter((p) => !p.seLlevoACabo || p.seLlevoACabo === 'Planificado').length,
      proyectosEnPeligro: proyectosConMetricas.filter((item) => item.proyecto.alumnosFinal < item.metricas.puntoEquilibrioAlumnos).length,
    },
    historialAuditoria: proyectos.map((p) => ({
      id: p.id,
      numeroCorrelativo: p.numeroCorrelativo,
      nombre: p.nombreProyecto,
      seLlevoACabo: p.seLlevoACabo,
      etapaFlujo: p.etapaFlujo || 'elaboracion_academica',
      historialCambios: p.historialCambios || [],
    })),
  };

  const auditJson = JSON.stringify(auditData, null, 2);
  const fileAudit = await uploadOrUpdateDriveFile(
    'AUDITORIA_Y_ALERTAS_GERENCIALES.json',
    auditJson,
    'application/json',
    folderId,
    token
  );
  uploadedFiles.push(fileAudit);

  return {
    success: true,
    timestamp: timestamp,
    files: uploadedFiles,
    folderId: folderId,
    folderUrl: TARGET_DRIVE_FOLDER_URL,
  };
};

/**
 * Descarga y recupera los proyectos guardados en Google Drive
 */
export const restoreDataFromDrive = async (
  folderId: string = TARGET_DRIVE_FOLDER_ID,
  accessToken?: string
): Promise<{ proyectos: ProyectoEducativo[]; moneda?: Moneda } | null> => {
  const token = accessToken || getDriveAccessToken();
  if (!token) throw new Error('No hay sesión de Google activa.');

  const fileMeta = await findFileInDriveFolder('MATRIZ_PROYECTOS_SUMMIT_2026.json', folderId, token);
  if (!fileMeta) {
    throw new Error('No se encontró el archivo MATRIZ_PROYECTOS_SUMMIT_2026.json en la carpeta designada.');
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileMeta.id}?alt=media&supportsAllDrives=true`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Error al leer archivo de Google Drive (${res.status})`);
  }

  const data = await res.json();
  if (data && Array.isArray(data.proyectos)) {
    return {
      proyectos: data.proyectos,
      moneda: data.moneda,
    };
  }

  return null;
};

export interface ReporteRegistro {
  id: string;
  titulo: string;
  gerencia: string;
  formato: 'PDF' | 'EXCEL' | 'CSV' | 'MARKDOWN';
  nombreArchivo: string;
  fechaCreacion: string;
  driveFileId?: string;
  driveUrl?: string;
  estadoDrive: 'subido' | 'pendiente' | 'error';
  error?: string;
  tamanio?: string;
}

const REPORTES_STORAGE_KEY = 'summit_reportes_generados_drive';

export const obtenerHistorialReportes = (): ReporteRegistro[] => {
  try {
    const raw = localStorage.getItem(REPORTES_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Error leyendo historial de reportes:', e);
    return [];
  }
};

export const guardarRegistroReporte = (nuevo: ReporteRegistro) => {
  try {
    const actuales = obtenerHistorialReportes();
    const filtrados = actuales.filter((r) => r.id !== nuevo.id);
    const actualizados = [nuevo, ...filtrados].slice(0, 50);
    localStorage.setItem(REPORTES_STORAGE_KEY, JSON.stringify(actualizados));
  } catch (e) {
    console.warn('Error guardando historial de reportes:', e);
  }
};

export const subirReporteADrive = async (params: {
  titulo: string;
  gerencia: string;
  formato: 'PDF' | 'EXCEL' | 'CSV' | 'MARKDOWN';
  nombreArchivo: string;
  contenido: Blob | Uint8Array | string;
  mimeType: string;
  folderId?: string;
  accessToken?: string;
}): Promise<{ success: boolean; driveUrl?: string; fileId?: string; error?: string }> => {
  const {
    titulo,
    gerencia,
    formato,
    nombreArchivo,
    contenido,
    mimeType,
    folderId = TARGET_DRIVE_FOLDER_ID,
    accessToken,
  } = params;

  const token = accessToken || getDriveAccessToken();
  const registroId = 'rep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const fechaStr = new Date().toISOString();

  if (!token) {
    const nuevoRegistro: ReporteRegistro = {
      id: registroId,
      titulo,
      gerencia,
      formato,
      nombreArchivo,
      fechaCreacion: fechaStr,
      estadoDrive: 'pendiente',
      error: 'Google Drive no autenticado. Inicia sesión con Google para respaldar automáticamente.',
    };
    guardarRegistroReporte(nuevoRegistro);
    return {
      success: false,
      error: 'Google Drive no está conectado. El reporte se descargó en tu equipo y se guardará en Drive en cuanto conectes tu cuenta.',
    };
  }

  try {
    const boundary = '-------SummitReportBoundary' + Date.now();
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelim = `\r\n--${boundary}--`;

    const metadata = {
      name: nombreArchivo,
      parents: [folderId],
      mimeType: mimeType,
      description: `Reporte de ${gerencia} - ${titulo}. Generado automáticamente por Summit Impulsa Global el ${new Date().toLocaleString('es-HN')}.`,
    };

    const metaBlob = new Blob(
      [
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${mimeType}\r\n\r\n`,
      ],
      { type: 'text/plain' }
    );

    const dataBlob = contenido instanceof Blob 
      ? contenido 
      : typeof contenido === 'string' 
        ? new Blob([contenido], { type: mimeType })
        : new Blob([contenido], { type: mimeType });

    const closeBlob = new Blob([closeDelim], { type: 'text/plain' });

    const multipartBlob = new Blob([metaBlob, dataBlob, closeBlob], {
      type: `multipart/related; boundary=${boundary}`,
    });

    const res = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,webViewLink,modifiedTime,size`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBlob,
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      const nuevoRegistro: ReporteRegistro = {
        id: registroId,
        titulo,
        gerencia,
        formato,
        nombreArchivo,
        fechaCreacion: fechaStr,
        estadoDrive: 'error',
        error: `Error HTTP ${res.status}: ${errText}`,
      };
      guardarRegistroReporte(nuevoRegistro);
      return { success: false, error: errText };
    }

    const created = await res.json();
    const driveUrl = created.webViewLink || `https://drive.google.com/file/d/${created.id}/view`;

    const nuevoRegistro: ReporteRegistro = {
      id: registroId,
      titulo,
      gerencia,
      formato,
      nombreArchivo,
      fechaCreacion: fechaStr,
      driveFileId: created.id,
      driveUrl: driveUrl,
      estadoDrive: 'subido',
      tamanio: created.size ? `${(parseInt(created.size, 10) / 1024).toFixed(1)} KB` : undefined,
    };
    guardarRegistroReporte(nuevoRegistro);

    return {
      success: true,
      fileId: created.id,
      driveUrl: driveUrl,
    };
  } catch (err: any) {
    console.error('Error al subir reporte a Google Drive:', err);
    const nuevoRegistro: ReporteRegistro = {
      id: registroId,
      titulo,
      gerencia,
      formato,
      nombreArchivo,
      fechaCreacion: fechaStr,
      estadoDrive: 'error',
      error: err.message || 'Error de conexión',
    };
    guardarRegistroReporte(nuevoRegistro);
    return { success: false, error: err.message };
  }
};
