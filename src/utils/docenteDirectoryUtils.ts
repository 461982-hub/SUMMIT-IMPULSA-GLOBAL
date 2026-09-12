export interface DocenteBanco {
  id: string;
  nombre: string;
  titulo?: string;
  especialidad: string;
  email?: string;
  correo?: string; // Alias de compatibilidad
  telefono?: string;
  tarifaHoraSugerida: number; // LPS por hora
  calificacionNPS?: number;
  biografia?: string;
  cursosImpartidos?: string[];
  estadoSAR?: 'Al Día' | 'En Trámite' | 'Exento';
  clasificacion?: 'Licenciatura' | 'Ingeniería' | 'Maestría' | 'Doctorado' | 'Posdoctorado' | 'Técnico';
  cvPdfDataUrl?: string; // Data URL o contenido Base64 del archivo PDF adjuntado
  cvPdfNombre?: string; // Nombre original del archivo (e.g. CV_Docente.pdf)
  cvPdfTamano?: string; // Tamaño legible (e.g. 245 KB)
  cvPdfFechaSubida?: string; // Fecha y hora de carga
}

const STORAGE_KEY_DOCENTES = 'summit_banco_docentes_institucional';

// Banco inicial vacío listo para comenzar a ingresar datos reales
export const DOCENTES_INICIALES: DocenteBanco[] = [];

const MOCK_DOCENTE_IDS = ['doc-001', 'doc-002', 'doc-003', 'doc-004', 'doc-005'];

export function obtenerBancoDocentes(): DocenteBanco[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DOCENTES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_DOCENTES, JSON.stringify([]));
      return [];
    }
    const parseados = JSON.parse(raw);
    if (Array.isArray(parseados)) {
      // Si la lista almacenada solo contiene los docentes de muestra anteriores, limpiarla para datos reales
      const soloMuestra = parseados.length > 0 && parseados.every(d => MOCK_DOCENTE_IDS.includes(d.id));
      if (soloMuestra) {
        localStorage.setItem(STORAGE_KEY_DOCENTES, JSON.stringify([]));
        return [];
      }
      return parseados;
    }
    return [];
  } catch (err) {
    console.error('Error al leer banco de docentes de localStorage:', err);
    return [];
  }
}

export function vaciarBancoDocentes(): void {
  try {
    localStorage.setItem(STORAGE_KEY_DOCENTES, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('summit_banco_docentes_actualizado', { detail: [] }));
  } catch (err) {
    console.error('Error al vaciar banco de docentes:', err);
  }
}

export function restablecerDocentesPorDefecto(): DocenteBanco[] {
  try {
    localStorage.setItem(STORAGE_KEY_DOCENTES, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('summit_banco_docentes_actualizado', { detail: [] }));
    return [];
  } catch (err) {
    console.error('Error al restablecer banco de docentes:', err);
    return [];
  }
}

export function guardarDocenteEnBanco(docente: Partial<DocenteBanco>): DocenteBanco {
  const actuales = obtenerBancoDocentes();
  const idExistente = docente.id || `doc-${Date.now()}`;
  
  const nuevoDocente: DocenteBanco = {
    id: idExistente,
    nombre: (docente.nombre || '').trim(),
    titulo: docente.titulo?.trim() || 'Instructor Especialista',
    clasificacion: docente.clasificacion,
    especialidad: docente.especialidad?.trim() || 'Capacitación Profesional',
    email: docente.email?.trim() || docente.correo?.trim() || '',
    telefono: docente.telefono?.trim() || '',
    tarifaHoraSugerida: Number(docente.tarifaHoraSugerida) || 200,
    calificacionNPS: Number(docente.calificacionNPS) || 4.8,
    biografia: docente.biografia || '',
    cursosImpartidos: docente.cursosImpartidos || [],
    estadoSAR: docente.estadoSAR || 'Al Día',
    cvPdfDataUrl: docente.cvPdfDataUrl,
    cvPdfNombre: docente.cvPdfNombre,
    cvPdfTamano: docente.cvPdfTamano,
    cvPdfFechaSubida: docente.cvPdfFechaSubida,
  };

  const indice = actuales.findIndex(d => d.id === idExistente || d.nombre.toLowerCase() === nuevoDocente.nombre.toLowerCase());
  let actualizados: DocenteBanco[];

  if (indice >= 0) {
    actualizados = [...actuales];
    actualizados[indice] = { ...actuales[indice], ...nuevoDocente };
  } else {
    actualizados = [nuevoDocente, ...actuales];
  }

  try {
    localStorage.setItem(STORAGE_KEY_DOCENTES, JSON.stringify(actualizados));
    window.dispatchEvent(new CustomEvent('summit_banco_docentes_actualizado', { detail: actualizados }));
  } catch (err) {
    console.error('Error al guardar en localStorage:', err);
  }

  return nuevoDocente;
}

export function eliminarDocenteDelBanco(id: string): void {
  const actuales = obtenerBancoDocentes();
  const actualizados = actuales.filter(d => d.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY_DOCENTES, JSON.stringify(actualizados));
    window.dispatchEvent(new CustomEvent('summit_banco_docentes_actualizado', { detail: actualizados }));
  } catch (err) {
    console.error('Error al eliminar docente del banco:', err);
  }
}

export function buscarDocentePorNombre(nombre: string): DocenteBanco | undefined {
  if (!nombre) return undefined;
  const lista = obtenerBancoDocentes();
  const normalized = nombre.toLowerCase().trim();
  return lista.find(d => d.nombre.toLowerCase().includes(normalized) || normalized.includes(d.nombre.toLowerCase()));
}
