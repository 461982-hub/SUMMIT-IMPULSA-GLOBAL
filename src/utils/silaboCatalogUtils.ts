import { ProyectoEducativo, TipoProyecto, NivelProyecto, TipoServicioFiscal } from '../types';

export interface SilaboOficial {
  id: string;
  codigoPrograma: string;
  nombreProyecto: string;
  tipoProyecto: TipoProyecto;
  nivel: NivelProyecto;
  horasClase: number;
  horasTeoricas?: number;
  horasPracticas?: number;
  cantidadTemas: number;
  horasClasePorTema: number;
  objetivoGeneral: string;
  temasImpartir: string;
  metodologia: string;
  nombreDocente: string;
  docenteClasificacion: 'Licenciatura' | 'Especialidad' | 'Maestría' | 'Doctorado';
  docenteEspecialidad: string;
  docenteCorreo: string;
  docenteTelefono: string;
  tarifaHoraDocente: number;
  servicioFiscal: TipoServicioFiscal;
  aplicaISV: boolean;
  tipoCertificacion?: string;
  competenciasClave?: string[];
  responsableAcademico?: string;
  esSilaboBase?: boolean;
  tipoRegistro?: 'silabo_base';
}

/**
 * Catálogo Oficial de Sílabos Base: Inicia completamente limpio y vacío.
 * Solo contendrá los sílabos que el usuario cree y guarde en la sección de Sílabo PDF.
 */
export const CATALOGO_SILABOS_OFICIALES: SilaboOficial[] = [];

export const STORAGE_KEY_SILABOS_LOCAL = 'summit_silabos_creados_pdf';

/**
 * Guarda un sílabo en el almacenamiento local para persistencia inmediata.
 */
export function guardarSilaboEnStorage(silabo: SilaboOficial | ProyectoEducativo): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SILABOS_LOCAL);
    const lista: SilaboOficial[] = raw ? JSON.parse(raw) : [];
    const index = lista.findIndex(
      (s) => s.id === silabo.id || (s.codigoPrograma && s.codigoPrograma === (silabo as any).codigoPrograma)
    );
    const esBasico = silabo.nivel === 'Básico' || /b[áa]sico/i.test(silabo.nombreProyecto || '');
    const normalizado: SilaboOficial = {
      id: silabo.id,
      codigoPrograma: (silabo as any).codigoPrograma || `SMT-SIL-${silabo.id}`,
      nombreProyecto: silabo.nombreProyecto,
      tipoProyecto: silabo.tipoProyecto,
      nivel: esBasico ? 'Básico' : (silabo.nivel || 'Intermedio'),
      horasClase: esBasico ? 12 : (silabo.horasClase || 24),
      horasTeoricas: esBasico ? 4 : silabo.horasTeoricas,
      horasPracticas: esBasico ? 8 : silabo.horasPracticas,
      cantidadTemas: esBasico ? 4 : (silabo.cantidadTemas || 4),
      horasClasePorTema: esBasico ? 3 : (silabo.horasClasePorTema || 6),
      objetivoGeneral: silabo.objetivoGeneral || '',
      temasImpartir: silabo.temasImpartir || '',
      metodologia: silabo.metodologia || 'Aprendizaje Basado en Proyectos (ABP)',
      nombreDocente: silabo.nombreDocente || '',
      docenteClasificacion: (silabo.docenteClasificacion as any) || 'Licenciatura',
      docenteEspecialidad: silabo.docenteEspecialidad || '',
      docenteCorreo: silabo.docenteCorreo || '',
      docenteTelefono: silabo.docenteTelefono || '',
      tarifaHoraDocente: Number(silabo.tarifaHoraDocente) || 200,
      servicioFiscal: (silabo.servicioFiscal as any) || 'Capacitación profesional / Mentoría ejecutiva',
      aplicaISV: silabo.aplicaISV !== undefined ? silabo.aplicaISV : true,
      tipoCertificacion: silabo.tipoCertificacion,
      competenciasClave: silabo.competenciasClave,
      responsableAcademico: silabo.responsableAcademico || 'Dirección de Gerencia Académica',
      esSilaboBase: true,
      tipoRegistro: 'silabo_base',
    };
    if (index >= 0) {
      lista[index] = normalizado;
    } else {
      lista.unshift(normalizado);
    }
    localStorage.setItem(STORAGE_KEY_SILABOS_LOCAL, JSON.stringify(lista));
    window.dispatchEvent(new CustomEvent('summit_silabos_actualizados', { detail: lista }));
  } catch (e) {
    console.error('Error al guardar sílabo local:', e);
  }
}

/**
 * Elimina un sílabo del almacenamiento local.
 */
export function eliminarSilaboDeStorage(idOcodigo: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SILABOS_LOCAL);
    if (!raw) return;
    const lista: SilaboOficial[] = JSON.parse(raw);
    const target = (idOcodigo || '').trim().toLowerCase();
    const filtrada = lista.filter((s) => {
      const sid = (s.id || '').trim().toLowerCase();
      const scod = (s.codigoPrograma || '').trim().toLowerCase();
      return sid !== target && scod !== target;
    });
    localStorage.setItem(STORAGE_KEY_SILABOS_LOCAL, JSON.stringify(filtrada));
    window.dispatchEvent(new CustomEvent('summit_silabos_actualizados', { detail: filtrada }));
  } catch (e) {
    console.error('Error al eliminar sílabo local:', e);
  }
}

/**
 * Obtiene la lista de Sílabos Base Oficiales:
 * SOLO incluye los sílabos creados y guardados por el usuario en la sección de Sílabo PDF / Gerencia Académica.
 * Si no hay sílabos creados y guardados, devuelve un arreglo estrictamente vacío [].
 */
export function obtenerTodosLosSilabos(proyectosExistentes: ProyectoEducativo[] = []): SilaboOficial[] {
  const codigosExistentes = new Set<string>();
  const idsExistentes = new Set<string>();
  const resultado: SilaboOficial[] = [];

  // 1. Extraer sílabos oficiales creados por el usuario en el array de proyectos
  const silabosRegistrados = proyectosExistentes.filter(
    (p) => p.esSilaboBase === true || 
           p.tipoRegistro === 'silabo_base' || 
           p.tipoRegistro === 'silabo_oficial' ||
           (p as any).creadoPorAcademica === true ||
           (p as any).origenRegistro === 'gerencia-academica' ||
           p.tieneSilabo === true ||
           (p.codigoProyecto && p.codigoProyecto.startsWith('SIG-ACAD-')) ||
           (p.codigoPrograma && p.codigoPrograma.startsWith('SIG-ACAD-'))
  );

  for (const p of silabosRegistrados) {
    if (idsExistentes.has(p.id)) continue;
    const cod = (p.codigoPrograma || '').trim().toUpperCase();
    if (cod && codigosExistentes.has(cod)) continue;

    const esBasico = p.nivel === 'Básico' || /b[áa]sico/i.test(p.nombreProyecto || '');
    const silabo: SilaboOficial = {
      id: p.id,
      codigoPrograma: p.codigoPrograma || `SMT-SIL-${p.id}`,
      nombreProyecto: p.nombreProyecto,
      tipoProyecto: p.tipoProyecto,
      nivel: esBasico ? 'Básico' : (p.nivel || 'Intermedio'),
      horasClase: esBasico ? 12 : (p.horasClase || 24),
      horasTeoricas: esBasico ? 4 : p.horasTeoricas,
      horasPracticas: esBasico ? 8 : p.horasPracticas,
      cantidadTemas: esBasico ? 4 : (p.cantidadTemas || 4),
      horasClasePorTema: esBasico ? 3 : (p.horasClasePorTema || 6),
      objetivoGeneral: p.objetivoGeneral || '',
      temasImpartir: p.temasImpartir || '',
      metodologia: p.metodologia || 'Aprendizaje Basado en Proyectos (ABP)',
      nombreDocente: p.nombreDocente || '',
      docenteClasificacion: (p.docenteClasificacion as any) || 'Licenciatura',
      docenteEspecialidad: p.docenteEspecialidad || '',
      docenteCorreo: p.docenteCorreo || '',
      docenteTelefono: p.docenteTelefono || '',
      tarifaHoraDocente: Number(p.tarifaHoraDocente) || 200,
      servicioFiscal: (p.servicioFiscal as any) || 'Capacitación profesional / Mentoría ejecutiva',
      aplicaISV: p.aplicaISV !== undefined ? p.aplicaISV : true,
      tipoCertificacion: p.tipoCertificacion,
      competenciasClave: p.competenciasClave,
      responsableAcademico: p.responsableAcademico || 'Dirección de Gerencia Académica',
      esSilaboBase: true,
      tipoRegistro: 'silabo_base',
    };

    resultado.push(silabo);
    idsExistentes.add(p.id);
    if (silabo.codigoPrograma) codigosExistentes.add(silabo.codigoPrograma.trim().toUpperCase());
  }

  // 2. Extraer de almacenamiento local de sílabos (si existe)
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_SILABOS_LOCAL) : null;
    if (raw) {
      const parseados: SilaboOficial[] = JSON.parse(raw);
      if (Array.isArray(parseados)) {
        for (const s of parseados) {
          if (s && s.id && s.nombreProyecto && !idsExistentes.has(s.id)) {
            resultado.push(s);
            idsExistentes.add(s.id);
            if (s.codigoPrograma) codigosExistentes.add(s.codigoPrograma.trim().toUpperCase());
          }
        }
      }
    }
  } catch (e) {
    console.error('Error al leer sílabos de localStorage:', e);
  }

  // Si no hay ninguno creado, devuelve []
  return resultado;
}

/**
 * Busca un sílabo por ID, código de programa o coincidencia de nombre
 */
export function buscarSilabo(
  identificador: string,
  proyectosExistentes: ProyectoEducativo[] = []
): SilaboOficial | undefined {
  if (!identificador) return undefined;
  const lista = obtenerTodosLosSilabos(proyectosExistentes);
  const busqueda = identificador.trim().toLowerCase();

  return (
    lista.find((s) => s.id === identificador) ||
    lista.find((s) => s.codigoPrograma.toLowerCase() === busqueda) ||
    lista.find((s) => s.nombreProyecto.toLowerCase() === busqueda)
  );
}

/**
 * Extrae la carga pedagógica completa de un sílabo para inyectarla automáticamente en un proyecto operativo
 */
export function extraerDatosPedagogicosDeSilabo(silabo: SilaboOficial | ProyectoEducativo) {
  const esCursoBasico = silabo.nivel === 'Básico' ||
    /b[áa]sico/i.test(silabo.nombreProyecto || '') ||
    (silabo.tipoProyecto === 'Curso' && !silabo.nivel);

  const horasClase = esCursoBasico ? 12 : (Number(silabo.horasClase) || 24);
  const cantidadTemas = esCursoBasico ? 4 : (Number(silabo.cantidadTemas) || 4);
  const horasClasePorTema = esCursoBasico ? 3 : (Number(silabo.horasClasePorTema) || Math.max(1, Math.round(horasClase / cantidadTemas)));
  const tarifaHoraDocente = Number(silabo.tarifaHoraDocente) || 200;

  return {
    nombreProyecto: silabo.nombreProyecto,
    objetivoGeneral: silabo.objetivoGeneral || '',
    temasImpartir: silabo.temasImpartir || '',
    cantidadTemas,
    horasClasePorTema,
    horasClase,
    metodologia: silabo.metodologia || 'Aprendizaje Basado en Proyectos (ABP) & Casos Reales',
    nivel: (esCursoBasico ? 'Básico' : (silabo.nivel || 'Básico')) as NivelProyecto,
    tipoProyecto: silabo.tipoProyecto || 'Capacitación profesional / Mentoría ejecutiva',
    servicioFiscal: silabo.servicioFiscal || 'Capacitación profesional / Mentoría ejecutiva',
    aplicaISV: silabo.aplicaISV !== undefined ? silabo.aplicaISV : true,
    nombreDocente: silabo.nombreDocente || '',
    docenteClasificacion: (silabo.docenteClasificacion as any) || 'Licenciatura',
    docenteEspecialidad: silabo.docenteEspecialidad || '',
    docenteCorreo: silabo.docenteCorreo || '',
    docenteTelefono: silabo.docenteTelefono || '',
    tarifaHoraDocente,
    silaboOrigenId: silabo.id,
    codigoSilaboOrigen: silabo.codigoPrograma || `SMT-SIL-${silabo.id}`,
    nombreSilaboOrigen: silabo.nombreProyecto,
  };
}
