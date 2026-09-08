export interface DocenteBanco {
  id: string;
  nombre: string;
  titulo?: string;
  especialidad: string;
  email?: string;
  telefono?: string;
  tarifaHoraSugerida: number; // LPS por hora
  calificacionNPS?: number;
  biografia?: string;
  cursosImpartidos?: string[];
  estadoSAR?: 'Al Día' | 'En Trámite' | 'Exento';
  cvPdfDataUrl?: string; // Data URL o contenido Base64 del archivo PDF adjuntado
  cvPdfNombre?: string; // Nombre original del archivo (e.g. CV_Walter_Pedroza.pdf)
  cvPdfTamano?: string; // Tamaño legible (e.g. 245 KB)
  cvPdfFechaSubida?: string; // Fecha y hora de carga
}

const STORAGE_KEY_DOCENTES = 'summit_banco_docentes_institucional';

export const DOCENTES_INICIALES: DocenteBanco[] = [
  {
    id: 'doc-001',
    nombre: 'Ing. Walter René Pedroza',
    titulo: 'Ingeniero / Master en Finanzas',
    especialidad: 'Finanzas Corporativas & Modelado Financiero',
    email: 'pedrozawalterrene@gmail.com',
    telefono: '+504 9876-5432',
    tarifaHoraSugerida: 250,
    calificacionNPS: 4.9,
    biografia: 'Especialista en estructuración financiera, control de costos y dirección ejecutiva con más de 12 años de experiencia.',
    cursosImpartidos: ['Finanzas para No Financieros', 'Modelado Financiero en Excel'],
    estadoSAR: 'Al Día',
  },
  {
    id: 'doc-002',
    nombre: 'Lic. Roberto Flores',
    titulo: 'Lic. en Contaduría Pública & Finanzas',
    especialidad: 'Tributación Hondureña (SAR) y Auditoría Fiscal',
    email: 'rflores@summitimpulsa.hn',
    telefono: '+504 9555-1234',
    tarifaHoraSugerida: 200,
    calificacionNPS: 4.8,
    biografia: 'Consultor tributario con amplia trayectoria en aplicación de regímenes de facturación e ISV en Honduras.',
    cursosImpartidos: ['Taller Integral de ISV y Facturación SAR', 'Auditoría Fiscal'],
    estadoSAR: 'Al Día',
  },
  {
    id: 'doc-003',
    nombre: 'M.Sc. Claudia Rivera',
    titulo: 'Master en Gestión de Proyectos PMP',
    especialidad: 'Metodologías Ágiles & Gestión de Proyectos',
    email: 'crivera@summitimpulsa.hn',
    telefono: '+504 9444-5678',
    tarifaHoraSugerida: 220,
    calificacionNPS: 4.9,
    biografia: 'Certificada PMP y Scrum Master con experiencia liderando transformaciones digitales y gestión PMO.',
    cursosImpartidos: ['Gestión de Proyectos con Scrum', 'Preparación para Certificación PMP'],
    estadoSAR: 'Al Día',
  },
  {
    id: 'doc-004',
    nombre: 'Dr. Carlos Meza',
    titulo: 'Doctor en Derecho Mercantil y Laboral',
    especialidad: 'Legislación Laboral & Compliance Corporativo',
    email: 'cmeza@summitimpulsa.hn',
    telefono: '+504 9777-8901',
    tarifaHoraSugerida: 300,
    calificacionNPS: 4.7,
    biografia: 'Abogado especialista en contratos mercantiles, derecho laboral hondureño y resolución de conflictos.',
    cursosImpartidos: ['Derecho Laboral para Recursos Humanos', 'Compliance Corporativo'],
    estadoSAR: 'Al Día',
  },
  {
    id: 'doc-005',
    nombre: 'Lic. Ana Sofía Gómez',
    titulo: 'Licenciada en Marketing Digital & Analítica',
    especialidad: 'Marketing Digital B2B & Pauta en Redes Sociales',
    email: 'agomez@summitimpulsa.hn',
    telefono: '+504 9666-3456',
    tarifaHoraSugerida: 200,
    calificacionNPS: 4.8,
    biografia: 'Especialista en embudos de ventas digitales, Meta Ads, Google Ads y analítica web para negocios en LATAM.',
    cursosImpartidos: ['Marketing Digital para Emprendedores', 'Meta Ads Avanzado'],
    estadoSAR: 'Al Día',
  }
];

export function obtenerBancoDocentes(): DocenteBanco[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DOCENTES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_DOCENTES, JSON.stringify(DOCENTES_INICIALES));
      return DOCENTES_INICIALES;
    }
    const parseados = JSON.parse(raw);
    if (Array.isArray(parseados)) {
      return parseados;
    }
    return DOCENTES_INICIALES;
  } catch (err) {
    console.error('Error al leer banco de docentes de localStorage:', err);
    return DOCENTES_INICIALES;
  }
}

export function restablecerDocentesPorDefecto(): DocenteBanco[] {
  try {
    localStorage.setItem(STORAGE_KEY_DOCENTES, JSON.stringify(DOCENTES_INICIALES));
    window.dispatchEvent(new CustomEvent('summit_banco_docentes_actualizado', { detail: DOCENTES_INICIALES }));
    return DOCENTES_INICIALES;
  } catch (err) {
    console.error('Error al restablecer banco de docentes:', err);
    return DOCENTES_INICIALES;
  }
}

export function guardarDocenteEnBanco(docente: Partial<DocenteBanco>): DocenteBanco {
  const actuales = obtenerBancoDocentes();
  const idExistente = docente.id || `doc-${Date.now()}`;
  
  const nuevoDocente: DocenteBanco = {
    id: idExistente,
    nombre: (docente.nombre || '').trim(),
    titulo: docente.titulo?.trim() || 'Instructor Especialista',
    especialidad: docente.especialidad?.trim() || 'Capacitación Profesional',
    email: docente.email?.trim() || '',
    telefono: docente.telefono?.trim() || '',
    tarifaHoraSugerida: Number(docente.tarifaHoraSugerida) || 200,
    calificacionNPS: Number(docente.calificacionNPS) || 4.8,
    biografia: docente.biografia || '',
    cursosImpartidos: docente.cursosImpartidos || [],
    estadoSAR: docente.estadoSAR || 'Al Día',
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
