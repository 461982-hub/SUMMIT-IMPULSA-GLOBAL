import React, { useRef, useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  X, 
  Award, 
  BookOpen, 
  Clock, 
  Users, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  Calendar, 
  Laptop, 
  ShieldCheck,
  ExternalLink,
  Plus,
  Edit3,
  Trash2,
  Save,
  AlertTriangle,
  RotateCcw,
  Sliders,
  ChevronDown,
  GraduationCap,
  Search,
  Eye,
  Star,
  UserCheck,
  Briefcase,
  Receipt,
  DollarSign,
  Percent,
  Calculator,
  TrendingUp,
  AlertCircle,
  Info,
  ArrowRight
} from 'lucide-react';
import { ProyectoEducativo, Moneda, NivelProyecto, TipoProyecto, TipoServicioFiscal } from '../../types';
import { SummitLogo } from '../SummitLogo';
import { formatearMoneda, calcularMetricasProyecto } from '../../utils/calculations';
import { obtenerReglaISVPorServicio, REGLAS_ISV_SERVICIOS } from '../../utils/isvRules';
import { generarSiguienteCorrelativo } from '../../utils/correlativoUtils';
import { DocenteBanco, obtenerBancoDocentes } from '../../utils/docenteDirectoryUtils';
import { DocenteDirectoryModal } from './DocenteDirectoryModal';
import { DocenteCvPdfModal } from './DocenteCvPdfModal';
import { guardarSilaboEnStorage, eliminarSilaboDeStorage, obtenerTodosLosSilabos } from '../../utils/silaboCatalogUtils';
import { descargarSilaboPdfOficial } from '../../utils/syllabusPdfGenerator';

const margenesPredefinidos = [40, 50, 70, 80, 100];

export interface OfficialSyllabusModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyecto: ProyectoEducativo | null;
  proyectos?: ProyectoEducativo[];
  moneda?: Moneda;
  modoInicial?: 'vista' | 'crear' | 'editar';
  onGuardarProyecto?: (p: ProyectoEducativo) => void;
  onCrearProyecto?: (p: ProyectoEducativo) => void;
  onEliminarProyecto?: (p: ProyectoEducativo) => void;
}

export const OfficialSyllabusModal: React.FC<OfficialSyllabusModalProps> = ({
  isOpen,
  onClose,
  proyecto,
  proyectos = [],
  moneda = 'HNL',
  modoInicial = 'vista',
  onGuardarProyecto,
  onCrearProyecto,
  onEliminarProyecto,
}) => {
  // Lista de proyectos y sílabos disponibles: dar prioridad a sílabos creados
  const silabosRegistrados = useMemo(() => {
    return obtenerTodosLosSilabos(proyectos);
  }, [proyectos]);

  const listaProyectos = silabosRegistrados.length > 0 
    ? silabosRegistrados 
    : (proyectos && proyectos.length > 0 ? proyectos : (proyecto ? [proyecto] : []));
  
  // Estados de navegación y modo
  const [proyectoActivoId, setProyectoActivoId] = useState<string>(proyecto?.id || '');
  const [modo, setModo] = useState<'vista' | 'editar' | 'crear'>(() => modoInicial || 'vista');
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [mensajeAlerta, setMensajeAlerta] = useState<{ tipo: 'exito' | 'error' | 'info'; texto: string } | null>(null);

  const monedaFormato: 'LPS' | 'USD' | 'EUR' | 'MXN' = 
    (moneda === 'HNL' || moneda === 'LPS') ? 'LPS' : 
    (moneda === 'USD' ? 'USD' : (moneda === 'EUR' ? 'EUR' : (moneda === 'MXN' ? 'MXN' : 'LPS')));

  // Estados para formulario de edición / creación
  const [proyectoEditando, setProyectoEditando] = useState<Partial<ProyectoEducativo>>({});
  const [modulosEditando, setModulosEditando] = useState<Array<{ numero: number; titulo: string; horas: number }>>([]);
  const [rubricaEditando, setRubricaEditando] = useState({
    proyectoFinalPct: 40,
    talleresPracticosPct: 35,
    participacionAsistenciaPct: 15,
    examenFinalPct: 10,
    notaMinimaAprobacion: 75,
    asistenciaMinimaPct: 80,
  });

  // Estados para Banco de Docentes
  const [bancoDocentes, setBancoDocentes] = useState<DocenteBanco[]>(() => obtenerBancoDocentes());
  const [filtroDocente, setFiltroDocente] = useState('');
  const [mostrarBuscadorDocente, setMostrarBuscadorDocente] = useState(false);
  const [modalDirectorioDocentesAbierto, setModalDirectorioDocentesAbierto] = useState(false);
  const [docenteParaVerCv, setDocenteParaVerCv] = useState<DocenteBanco | null>(null);

  const printableAreaRef = useRef<HTMLDivElement>(null);

  // Sincronizar banco de docentes con eventos globales
  useEffect(() => {
    const handleActualizacion = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setBancoDocentes(e.detail);
      } else {
        setBancoDocentes(obtenerBancoDocentes());
      }
    };
    window.addEventListener('summit_banco_docentes_actualizado', handleActualizacion);
    return () => {
      window.removeEventListener('summit_banco_docentes_actualizado', handleActualizacion);
    };
  }, []);

  // Función para asignar docente seleccionado del banco
  const handleAsignarDocenteDelBanco = (docente: DocenteBanco) => {
    setProyectoEditando((prev) => ({
      ...prev,
      nombreDocente: docente.nombre,
      docenteEspecialidad: docente.especialidad || prev.docenteEspecialidad,
      profesionDocente: docente.clasificacion || docente.titulo || prev.profesionDocente,
      docenteClasificacion: (docente.clasificacion as any) || prev.docenteClasificacion,
      tarifaHoraDocente: docente.tarifaHoraSugerida || prev.tarifaHoraDocente,
      costoHoraDocente: docente.tarifaHoraSugerida || prev.costoHoraDocente,
      docenteCorreo: docente.email || docente.correo || prev.docenteCorreo,
      docenteTelefono: docente.telefono || prev.docenteTelefono,
      docenteEvaluacionNPS: docente.calificacionNPS || 5.0,
      docenteCvPdf: docente.cvPdfDataUrl || prev.docenteCvPdf,
      docenteCvPdfNombre: docente.cvPdfNombre || prev.docenteCvPdfNombre,
      docenteCvPdfTamano: docente.cvPdfTamano || prev.docenteCvPdfTamano,
      docenteCvPdfFechaSubida: docente.cvPdfFechaSubida || prev.docenteCvPdfFechaSubida,
    }));
    setFiltroDocente('');
    setMostrarBuscadorDocente(false);
    setMensajeAlerta({
      tipo: 'exito',
      texto: `Docente "${docente.nombre}" vinculado exitosamente al sílabo desde el Banco Institucional.`,
    });
    setTimeout(() => setMensajeAlerta(null), 3000);
  };

  // Sincronizar ID activo al abrir o cambiar la prop de proyecto
  useEffect(() => {
    if (!isOpen) return;

    if (modoInicial === 'crear') {
      handleIniciarCreacion('curso_basico');
      setConfirmarEliminar(false);
      setMensajeAlerta(null);
      return;
    }

    if (proyecto?.id) {
      setProyectoActivoId(proyecto.id);
      setModo(modoInicial || 'vista');
      setConfirmarEliminar(false);
      setMensajeAlerta(null);
    } else if (listaProyectos.length > 0) {
      setProyectoActivoId(listaProyectos[0].id);
      setModo('vista');
    } else {
      handleIniciarCreacion('curso_basico');
    }
  }, [proyecto?.id, isOpen, listaProyectos.length, modoInicial]);

  if (!isOpen) return null;

  // Proyecto actual seleccionado
  const proyectoActual = listaProyectos.find(p => p.id === proyectoActivoId) || proyecto || (listaProyectos.length > 0 ? listaProyectos[0] : null);
  
  if (!proyectoActual && modo !== 'crear') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-2xl border border-slate-200">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto shadow-inner">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-slate-900">Catálogo Listo para el POA 2026</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            La base de proyectos ha sido inicializada para arrancar con números reales. Gerencia Académica puede formular y registrar el primer sílabo oficial garantizado por Phd. Donal Reyes.
          </p>
          <div className="flex gap-2 justify-center pt-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cerrar
            </button>
            <button
              onClick={handleIniciarCreacion}
              className="px-4 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-transform hover:scale-[1.02]"
            >
              + Registrar Primer Sílabo Real
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Extractor modular de temas
  const extraerModulosDeProyecto = (p: Partial<ProyectoEducativo> | null): Array<{ numero: number; titulo: string; horas: number }> => {
    if (!p) return [];
    const totalHoras = p.horasClase || 12;
    const numTemas = p.cantidadTemas || 4;
    const horasPorTema = p.horasClasePorTema || Math.max(1, Math.round(totalHoras / numTemas));

    const lista: Array<{ numero: number; titulo: string; horas: number }> = [];
    if (p.temasImpartir && p.temasImpartir.trim()) {
      const lineas = p.temasImpartir
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);

      lineas.forEach((linea, index) => {
        const limpia = linea.replace(/^([0-9]+\.|\*|-|Módulo\s+[0-9]+:?|Tema\s+[0-9]+:?)\s*/i, '');
        lista.push({
          numero: index + 1,
          titulo: limpia || `Módulo ${index + 1}`,
          horas: horasPorTema,
        });
      });
    }

    if (lista.length === 0) {
      for (let i = 1; i <= numTemas; i++) {
        let desc = 'Fundamentos teóricos y conceptualización';
        if (i === 2) desc = 'Herramientas operativas y aplicación guiada';
        if (i === 3) desc = 'Resolución de casos de estudio y simulación práctica';
        if (i >= 4) desc = 'Taller integrador, buenas prácticas y proyecto final';
        lista.push({
          numero: i,
          titulo: `Módulo ${i}: ${desc}`,
          horas: horasPorTema,
        });
      }
    }
    return lista;
  };

  // Correlativo institucional y SAR generado automáticamente para creación o cuando se formaliza nuevo programa
  const siguienteCorrelativoAuto = useMemo(() => {
    return generarSiguienteCorrelativo(
      listaProyectos,
      proyectoEditando.tipoProyecto || 'Curso',
      2026,
      proyectoEditando.aplicaISV ?? true
    );
  }, [listaProyectos, proyectoEditando.tipoProyecto, proyectoEditando.aplicaISV]);

  // Datos calculados del proyecto actual con correlativos institucionales y SAR
  const numCorrelativo = modo === 'crear'
    ? siguienteCorrelativoAuto.numeroCorrelativo
    : (proyectoActual?.numeroCorrelativo || 1);
  const correlativoPad3 = String(numCorrelativo).padStart(3, '0');
  const correlativoPad8 = String(numCorrelativo).padStart(8, '0');
  
  const codigoEmpresa = modo === 'crear'
    ? siguienteCorrelativoAuto.codigoProyecto
    : (proyectoActual?.codigoProyecto || proyectoActual?.codigoPrograma || `SIG-ACAD-2026-${correlativoPad3}`);
  const codigoOficial = codigoEmpresa;
  
  const correlativoSAR = modo === 'crear'
    ? siguienteCorrelativoAuto.correlativoSAR
    : (proyectoActual?.correlativoSAR || `000-001-01-${correlativoPad8}`);
  
  const codigoFiscalSAR = modo === 'crear'
    ? siguienteCorrelativoAuto.codigoFiscalSAR
    : (proyectoActual?.codigoFiscalSAR || (proyectoActual?.aplicaISV ? `SAR-ISV-2026-${correlativoPad3}` : `SAR-EXENTO-2026-${correlativoPad3}`));

  // Sellos de Auditoría Institucional (Fecha y Hora de Creación)
  const fechaCreacionAuditoria = useMemo(() => {
    if (modo === 'crear') {
      return new Date().toLocaleDateString('es-HN');
    }
    return proyectoActual?.fechaCreacion 
      ? new Date(proyectoActual.fechaCreacion).toLocaleDateString('es-HN')
      : (proyectoActual?.fechaElaboracion || new Date().toLocaleDateString('es-HN'));
  }, [modo, proyectoActual]);

  const horaCreacionAuditoria = useMemo(() => {
    if (modo === 'crear') {
      return new Date().toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    }
    return proyectoActual?.horaCreacion || proyectoActual?.horaElaboracion || '08:30:00 AM';
  }, [modo, proyectoActual]);
  const totalHoras = proyectoActual?.horasClase || 12;
  const horasTeoricas = proyectoActual?.horasTeoricas || Math.round(totalHoras * 0.4);
  const horasPracticas = proyectoActual?.horasPracticas || Math.round(totalHoras * 0.6);
  const listaModulosActuales = extraerModulosDeProyecto(proyectoActual);
  const numTemas = listaModulosActuales.length || proyectoActual?.cantidadTemas || 4;
  const horasPorTema = proyectoActual?.horasClasePorTema || Math.max(1, Math.round(totalHoras / numTemas));

  const rubrica = proyectoActual?.rubricaEvaluacion || {
    proyectoFinalPct: 40,
    talleresPracticosPct: 35,
    participacionAsistenciaPct: 15,
    examenFinalPct: 10,
    notaMinimaAprobacion: 75,
    asistenciaMinimaPct: 80,
  };

  // Métricas financieras y régimen fiscal para vista oficial
  const metricas = useMemo(() => {
    if (!proyectoActual) return null;
    return calcularMetricasProyecto({
      ...proyectoActual,
      horasClase: proyectoActual.horasClase || 12,
      tarifaHoraDocente: proyectoActual.tarifaHoraDocente ?? 200,
      costoZoom: proyectoActual.costoZoom ?? 300,
      costoPapeleria: proyectoActual.costoPapeleria ?? 100,
      gastosVarios: proyectoActual.gastosVarios ?? 100,
      margenGananciaOperativa: (proyectoActual.margenGananciaOperativa && margenesPredefinidos.includes(proyectoActual.margenGananciaOperativa)) 
        ? proyectoActual.margenGananciaOperativa 
        : 40,
      alumnosProyectados: proyectoActual.alumnosProyectados ?? 6,
      alumnosFinal: proyectoActual.alumnosFinal ?? 6,
      aplicaISV: proyectoActual.aplicaISV ?? false,
    });
  }, [proyectoActual]);

  const reglaFiscalActual = useMemo(() => {
    return obtenerReglaISVPorServicio(proyectoActual?.servicioFiscal || 'Capacitación profesional / Mentoría ejecutiva');
  }, [proyectoActual?.servicioFiscal]);

  // Cálculos en vivo para el formulario de edición/creación
  const calculoEditando = useMemo(() => {
    return calcularMetricasProyecto({
      ...proyectoEditando,
      horasClase: proyectoEditando.horasClase || 12,
      tarifaHoraDocente: proyectoEditando.tarifaHoraDocente ?? 200,
      costoZoom: proyectoEditando.costoZoom ?? 300,
      costoPapeleria: proyectoEditando.costoPapeleria ?? 100,
      gastosVarios: proyectoEditando.gastosVarios ?? 100,
      margenGananciaOperativa: (proyectoEditando.margenGananciaOperativa && margenesPredefinidos.includes(proyectoEditando.margenGananciaOperativa))
        ? proyectoEditando.margenGananciaOperativa
        : 40,
      alumnosProyectados: proyectoEditando.alumnosProyectados ?? 6,
      alumnosFinal: proyectoEditando.alumnosFinal ?? 6,
      aplicaISV: proyectoEditando.aplicaISV ?? false,
    } as any);
  }, [proyectoEditando]);

  const reglaFiscalEditando = useMemo(() => {
    return obtenerReglaISVPorServicio(proyectoEditando?.servicioFiscal || 'Capacitación profesional / Mentoría ejecutiva');
  }, [proyectoEditando?.servicioFiscal]);

  // Vinculación y búsqueda con el Banco de Docentes
  const docenteEnBancoEditando = useMemo(() => {
    const nom = (proyectoEditando.nombreDocente || '').trim().toLowerCase();
    if (!nom) return null;
    return bancoDocentes.find((d) => d.nombre?.trim().toLowerCase() === nom) || null;
  }, [bancoDocentes, proyectoEditando.nombreDocente]);

  const docenteActualEnBanco = useMemo(() => {
    const nom = (proyectoActual?.nombreDocente || '').trim().toLowerCase();
    if (!nom) return null;
    return bancoDocentes.find((d) => d.nombre?.trim().toLowerCase() === nom) || null;
  }, [bancoDocentes, proyectoActual?.nombreDocente]);

  const docentesFiltrados = bancoDocentes.filter((d) => {
    if (!filtroDocente.trim()) return true;
    const term = filtroDocente.toLowerCase();
    return (
      d.nombre.toLowerCase().includes(term) ||
      d.especialidad.toLowerCase().includes(term) ||
      (d.titulo && d.titulo.toLowerCase().includes(term)) ||
      (d.clasificacion && d.clasificacion.toLowerCase().includes(term))
    );
  });

  // Acciones de Gerencia Académica
  const [generandoPdfDescarga, setGenerandoPdfDescarga] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleGuardarPDF = () => {
    if (!proyectoActual) return;
    setGenerandoPdfDescarga(true);
    try {
      const docenteInfo = docenteActualEnBanco || {
        nombre: proyectoActual.nombreDocente,
        titulo: 'Docente Especialista',
        especialidad: proyectoActual.docenteEspecialidad || 'Capacitación Profesional',
        email: proyectoActual.docenteEmail || 'contacto@summitimpulsa.hn',
        telefono: proyectoActual.docenteTelefono || 'N/D',
        tarifaHoraSugerida: proyectoActual.tarifaHoraDocente || 200,
        biografia: proyectoActual.docenteBiografia || 'Docente titular asignado al programa formativo.',
        estadoSAR: proyectoActual.docenteEstadoSAR || 'Registrado',
      };

      const resultado = descargarSilaboPdfOficial({
        nombreProyecto: proyectoActual.nombreProyecto,
        codigoPrograma: codigoEmpresa,
        codigoFiscalSAR: codigoFiscalSAR,
        correlativoSAR: correlativoSAR,
        tipoProyecto: proyectoActual.tipoProyecto,
        nivel: proyectoActual.nivel,
        cantidadTemas: numTemas,
        horasClasePorTema: horasPorTema,
        totalHorasCurso: totalHoras,
        metodologia: proyectoActual.metodologia || 'Aprendizaje Basado en Proyectos (ABP) & Casos Prácticos Aplicados',
        objetivoGeneral: proyectoActual.objetivoGeneral,
        temasImpartir: proyectoActual.temasImpartir,
        modalidad: proyectoActual.modalidad,
        horario: proyectoActual.horario,
        diasClase: proyectoActual.diasClase,
        rubricaEvaluacion: rubrica,
        docente: {
          nombre: docenteInfo.nombre,
          titulo: docenteInfo.titulo,
          especialidad: docenteInfo.especialidad,
          email: docenteInfo.email,
          telefono: docenteInfo.telefono,
          tarifaHoraSugerida: docenteInfo.tarifaHoraSugerida,
          biografia: docenteInfo.biografia,
          estadoSAR: docenteInfo.estadoSAR,
        },
      });

      setMensajeAlerta({
        tipo: 'exito',
        texto: `¡Sílabo Oficial descargado exitosamente como "${resultado.nombreArchivo}" (${resultado.tamanoKb} KB)!`,
      });
      setTimeout(() => setMensajeAlerta(null), 5000);
    } catch (err) {
      console.error('Error al descargar PDF del sílabo:', err);
      setMensajeAlerta({
        tipo: 'error',
        texto: 'Ocurrió un error al compilar y guardar el documento PDF del Sílabo Oficial.',
      });
      setTimeout(() => setMensajeAlerta(null), 5000);
    } finally {
      setGenerandoPdfDescarga(false);
    }
  };

  const handleCopiarTexto = () => {
    if (!proyectoActual) return;
    const textoCompleto = `
SUMMIT IMPULSA GLOBAL - SÍLABO OFICIAL INSTITUCIONAL
=====================================================
CÓDIGO OFICIAL: ${codigoOficial}
PROGRAMA: ${proyectoActual.nombreProyecto}
NIVEL ACADÉMICO: ${proyectoActual.nivel || 'Básico'}
DOCENTE TITULAR: ${proyectoActual.nombreDocente} (${proyectoActual.docenteEspecialidad || 'Especialista Docente'})
MODALIDAD: ${proyectoActual.modalidad || 'Virtual Sincrónica'} (${proyectoActual.plataformaLMS || 'Zoom Pro'})
CARGA HORARIA: ${totalHoras} Horas Totales (${horasTeoricas}h Teóricas / ${horasPracticas}h Prácticas)
HORARIO: ${proyectoActual.horario || '06:00 PM - 08:00 PM'} | DÍAS: ${proyectoActual.diasClase || 'Lunes, Miércoles y Viernes'}
FECHA DE INICIO: ${proyectoActual.fechaProgramacion || 'Por definir'}

OBJETIVO GENERAL:
${proyectoActual.objetivoGeneral || 'Formación especializada orientada al desarrollo de competencias aplicadas.'}

METODOLOGÍA PEDAGÓGICA:
${proyectoActual.metodologia || 'Aprendizaje Basado en Proyectos (ABP) & Casos Prácticos Aplicados'}

ESTRUCTURA MODULAR (${numTemas} Módulos):
${listaModulosActuales.map(m => `  • Módulo ${m.numero} (${m.horas} hrs): ${m.titulo}`).join('\n')}

POLÍTICA DE EVALUACIÓN:
  - Proyecto Final Aplicado: ${rubrica.proyectoFinalPct}%
  - Talleres Prácticos y Asignaciones: ${rubrica.talleresPracticosPct}%
  - Asistencia y Participación Activa: ${rubrica.participacionAsistenciaPct}%
  - Evaluación / Test de Conocimiento: ${rubrica.examenFinalPct || 10}%
  - NOTA MÍNIMA DE APROBACIÓN: ${rubrica.notaMinimaAprobacion} / 100 puntos
  - ASISTENCIA MÍNIMA REQUERIDA: ${rubrica.asistenciaMinimaPct}%

CERTIFICACIÓN:
${proyectoActual.tipoCertificacion || 'Diploma de Aprobación Formal'} emitida por Summit Impulsa Global.

AUTORIZACIÓN Y VALIDEZ CURRICULAR:
  • Phd. Donal Reyes — Dirección de Gerencia Académica (Summit Impulsa Global)
  • ${proyectoActual.nombreDocente} — Docente Titular y Facilitador del Programa
    `.trim();

    navigator.clipboard.writeText(textoCompleto).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  };

  // 1. INICIAR EDICIÓN / ACTUALIZACIÓN
  const handleIniciarEdicion = () => {
    if (!proyectoActual) return;
    setProyectoEditando({
      ...proyectoActual,
      tarifaHoraDocente: proyectoActual.tarifaHoraDocente ?? 200,
      costoHoraDocente: proyectoActual.costoHoraDocente ?? proyectoActual.tarifaHoraDocente ?? 200,
      costoZoom: proyectoActual.costoZoom ?? 300,
      costoPapeleria: proyectoActual.costoPapeleria ?? 100,
      gastosVarios: proyectoActual.gastosVarios ?? 100,
      margenGananciaOperativa: (proyectoActual.margenGananciaOperativa && margenesPredefinidos.includes(proyectoActual.margenGananciaOperativa))
        ? proyectoActual.margenGananciaOperativa
        : 40,
      alumnosProyectados: proyectoActual.alumnosProyectados ?? 6,
      alumnosFinal: proyectoActual.alumnosFinal ?? 6,
      servicioFiscal: proyectoActual.servicioFiscal || 'Capacitación profesional / Mentoría ejecutiva',
      aplicaISV: proyectoActual.aplicaISV ?? true,
      observaciones: proyectoActual.observaciones || 'Estructura básica curricular elaborada por Dirección de Gerencia Académica (Phd. Donal Reyes).',
    });
    setModulosEditando(extraerModulosDeProyecto(proyectoActual));
    setRubricaEditando(proyectoActual.rubricaEvaluacion || {
      proyectoFinalPct: 40,
      talleresPracticosPct: 35,
      participacionAsistenciaPct: 15,
      examenFinalPct: 10,
      notaMinimaAprobacion: 75,
      asistenciaMinimaPct: 80,
    });
    setModo('editar');
  };

  // 2. INICIAR CREACIÓN DE NUEVO SÍLABO
  function handleIniciarCreacion(tipoPreset: 'curso_basico' | 'diplomado' = 'curso_basico') {
    const correlativosAuto = generarSiguienteCorrelativo(
      listaProyectos,
      tipoPreset === 'curso_basico' ? 'Curso' : 'Diplomado',
      2026,
      true
    );
    const esCursoBasico = tipoPreset === 'curso_basico';
    const docenteInicial = bancoDocentes.length > 0 ? bancoDocentes[0] : null;
    const ahora = new Date();
    const ahoraIso = ahora.toISOString();
    const fechaHoy = ahora.toLocaleDateString('es-HN');
    const horaHoy = ahora.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    setProyectoEditando({
      id: `p-${Date.now()}`,
      nombreProyecto: esCursoBasico ? 'Nuevo Curso Básico 2026' : 'Nuevo Diplomado Ejecutivo 2026',
      numeroCorrelativo: correlativosAuto.numeroCorrelativo,
      codigoProyecto: correlativosAuto.codigoProyecto,
      codigoPrograma: correlativosAuto.codigoProyecto,
      correlativoSAR: correlativosAuto.correlativoSAR,
      codigoFiscalSAR: correlativosAuto.codigoFiscalSAR,
      tipoProyecto: esCursoBasico ? 'Curso' : 'Diplomado',
      esSilaboBase: true,
      tieneSilabo: true,
      tipoRegistro: 'silabo_oficial',
      creadoPorAcademica: true,
      origenRegistro: 'gerencia-academica',
      etapaFlujo: 'elaboracion_academica',
      nivelFlujoActual: 1,
      nivel: esCursoBasico ? 'Básico' : 'Intermedio',
      modalidad: 'Virtual Sincrónica',
      plataformaLMS: 'Zoom Pro',
      horasClase: esCursoBasico ? 12 : 40,
      horasTeoricas: esCursoBasico ? 4 : 16,
      horasPracticas: esCursoBasico ? 8 : 24,
      tarifaHoraDocente: docenteInicial?.tarifaHoraSugerida || 200,
      costoHoraDocente: docenteInicial?.tarifaHoraSugerida || 200,
      costoZoom: 300,
      costoPapeleria: 100,
      gastosVarios: 100,
      margenGananciaOperativa: 40,
      alumnosProyectados: 6,
      alumnosFinal: 6,
      servicioFiscal: 'Capacitación profesional / Mentoría ejecutiva',
      aplicaISV: true,
      metodoVenta: 'Corporativo',
      seLlevoACabo: 'Planificado',
      observaciones: 'Sílabo Oficial registrado por Gerencia Académica. Remitido a Gerencia General para su revisión y dictamen financiero.',
      nombreDocente: docenteInicial?.nombre || 'Phd. Donal Reyes',
      docenteEspecialidad: docenteInicial?.especialidad || 'Dirección Pedagógica y Gestión Estratégica',
      profesionDocente: docenteInicial?.clasificacion || docenteInicial?.titulo || 'Licenciatura',
      docenteClasificacion: (docenteInicial?.clasificacion as any) || 'Licenciatura',
      docenteCorreo: docenteInicial?.email || docenteInicial?.correo || '',
      docenteTelefono: docenteInicial?.telefono || '',
      docenteEvaluacionNPS: docenteInicial?.calificacionNPS || 5.0,
      docenteCvPdf: docenteInicial?.cvPdfDataUrl,
      docenteCvPdfNombre: docenteInicial?.cvPdfNombre,
      docenteCvPdfTamano: docenteInicial?.cvPdfTamano,
      docenteCvPdfFechaSubida: docenteInicial?.cvPdfFechaSubida,
      horario: '06:00 PM - 08:00 PM',
      diasClase: 'Lunes, Miércoles y Viernes',
      fechaProgramacion: ahoraIso.split('T')[0],
      fechaVenta: ahoraIso.split('T')[0],
      fechaCreacion: ahoraIso,
      horaCreacion: horaHoy,
      fechaHoraGrabacion: `${fechaHoy}, ${horaHoy}`,
      fechaElaboracion: fechaHoy,
      horaElaboracion: horaHoy,
      registroAuditoria: {
        creadoPor: 'Phd. Donal Reyes - Dirección de Gerencia Académica',
        fechaHoraCreacion: `${fechaHoy}, ${horaHoy}`,
        ultimaModificacion: `${fechaHoy}, ${horaHoy}`,
        equipoModifico: 'Gerencia Académica',
      },
      objetivoGeneral: esCursoBasico 
        ? 'Desarrollar competencias prácticas y operativas esenciales en el área temática establecida con rigor metodológico.'
        : 'Desarrollar competencias técnicas, estratégicas y operativas aplicadas al contexto profesional moderno.',
      metodologia: 'Aprendizaje Basado en Proyectos (ABP) & Casos Prácticos Aplicados',
      tipoCertificacion: 'Diploma de Aprobación Formal con Validez Institucional',
      autorizacionAcademica: true,
      responsableAcademico: 'Phd. Donal Reyes - Dirección de Gerencia Académica',
    });

    if (esCursoBasico) {
      setModulosEditando([
        { numero: 1, titulo: 'Fundamentos y Conceptos Clave', horas: 3 },
        { numero: 2, titulo: 'Herramientas Básicas y Ejercicios Prácticos', horas: 3 },
        { numero: 3, titulo: 'Casos Guiados de Aplicación Directa', horas: 3 },
        { numero: 4, titulo: 'Proyecto Integrador y Evaluación de Salida', horas: 3 },
      ]);
    } else {
      setModulosEditando([
        { numero: 1, titulo: 'Fundamentos y Marco Conceptual Aplicado', horas: 10 },
        { numero: 2, titulo: 'Herramientas Técnicas y Desarrollo de Habilidades', horas: 10 },
        { numero: 3, titulo: 'Análisis de Casos Reales y Simulación Práctica', horas: 10 },
        { numero: 4, titulo: 'Taller Integrador Final y Proyecto de Aplicación', horas: 10 },
      ]);
    }

    setRubricaEditando({
      proyectoFinalPct: 40,
      talleresPracticosPct: 35,
      participacionAsistenciaPct: 15,
      examenFinalPct: 10,
      notaMinimaAprobacion: 75,
      asistenciaMinimaPct: 80,
    });

    setModo('crear');
  };

  // 3. GUARDAR ACTUALIZACIÓN DE SÍLABO EXISTENTE
  const handleGuardarEdicion = () => {
    if (!proyectoEditando.nombreProyecto?.trim()) {
      setMensajeAlerta({ tipo: 'error', texto: 'El nombre del programa no puede estar vacío.' });
      return;
    }

    const esCursoBasico = proyectoEditando.nivel === 'Básico' ||
      /b[áa]sico/i.test(proyectoEditando.nombreProyecto || '') ||
      (proyectoEditando.tipoProyecto === 'Curso' && !proyectoEditando.nivel);

    const temasConsolidados = modulosEditando
      .map(m => `Módulo ${m.numero}: ${m.titulo}`)
      .join('\n');

    const totalHorasCalculadas = modulosEditando.reduce((acc, m) => acc + (Number(m.horas) || 0), 0);
    const horasClase = esCursoBasico ? 12 : (totalHorasCalculadas > 0 ? totalHorasCalculadas : (proyectoEditando.horasClase || 24));
    const cantidadTemas = esCursoBasico ? 4 : modulosEditando.length;
    const horasClasePorTema = esCursoBasico ? 3 : (modulosEditando.length > 0 ? Math.round(horasClase / modulosEditando.length) : 10);

    const metricasNuevas = calcularMetricasProyecto({
      ...proyectoEditando,
      horasClase,
      tarifaHoraDocente: proyectoEditando.tarifaHoraDocente ?? 200,
      costoZoom: proyectoEditando.costoZoom ?? 300,
      costoPapeleria: proyectoEditando.costoPapeleria ?? 100,
      gastosVarios: proyectoEditando.gastosVarios ?? 100,
      margenGananciaOperativa: (proyectoEditando.margenGananciaOperativa && margenesPredefinidos.includes(proyectoEditando.margenGananciaOperativa))
        ? proyectoEditando.margenGananciaOperativa
        : 40,
      alumnosProyectados: proyectoEditando.alumnosProyectados ?? 6,
      alumnosFinal: proyectoEditando.alumnosFinal ?? 6,
      aplicaISV: proyectoEditando.aplicaISV ?? false,
    } as any);

    const correlativosAuto = generarSiguienteCorrelativo(
      listaProyectos,
      proyectoEditando.tipoProyecto,
      2026,
      proyectoEditando.aplicaISV
    );

    const numCorrelativo = (proyectoActual as any)?.numeroCorrelativo || correlativosAuto.numeroCorrelativo;
    const codigoProyecto = (proyectoActual as any)?.codigoProyecto || `SIG-ACAD-2026-${String(numCorrelativo).padStart(3, '0')}`;
    const correlativoSAR = (proyectoActual as any)?.correlativoSAR || `000-001-01-${String(numCorrelativo).padStart(8, '0')}`;
    const codigoFiscalSAR = (proyectoActual as any)?.codigoFiscalSAR || (proyectoEditando.aplicaISV ? `SAR-ISV-2026-${String(numCorrelativo).padStart(3, '0')}` : `SAR-EXENTO-2026-${String(numCorrelativo).padStart(3, '0')}`);

    const proyectoActualizado: ProyectoEducativo = {
      ...(proyectoActual as ProyectoEducativo),
      ...proyectoEditando,
      ...metricasNuevas,
      numeroCorrelativo: numCorrelativo,
      codigoProyecto,
      codigoPrograma: codigoProyecto,
      correlativoSAR,
      codigoFiscalSAR,
      nivel: esCursoBasico ? 'Básico' : (proyectoEditando.nivel || 'Básico'),
      esSilaboBase: true,
      tieneSilabo: true,
      tipoRegistro: 'silabo_oficial',
      creadoPorAcademica: true,
      origenRegistro: 'gerencia-academica',
      etapaFlujo: 'revision_gerencia_general',
      autorizacionAcademica: true,
      fechaAutorizacionAcademica: new Date().toLocaleDateString('es-HN'),
      fechaEnvioRevisionGG: new Date().toISOString(),
      horasClase,
      cantidadTemas,
      horasClasePorTema,
      temasImpartir: temasConsolidados,
      rubricaEvaluacion: rubricaEditando,
      fechaModificacion: new Date().toLocaleDateString('es-HN'),
      horaModificacion: new Date().toLocaleTimeString('es-HN'),
      horaUltimaModificacion: new Date().toLocaleTimeString('es-HN'),
      responsableAcademico: 'Phd. Donal Reyes - Dirección de Gerencia Académica',
    };

    if (onGuardarProyecto) {
      onGuardarProyecto(proyectoActualizado);
    }

    setModo('vista');
    setMensajeAlerta({ 
      tipo: 'exito', 
      texto: `¡Sílabo Oficial "${proyectoActualizado.nombreProyecto}" registrado como Proyecto! Correlativo Empresa: ${codigoProyecto} | SAR: ${correlativoSAR}. Remitido a Gerencia General para revisión y aprobación previa a comercialización. Notificación enviada a las gerencias.` 
    });
    setTimeout(() => setMensajeAlerta(null), 5500);
  };

  // 4. GUARDAR NUEVO PROGRAMA Y SÍLABO
  const handleGuardarNuevoPrograma = () => {
    if (!proyectoEditando.nombreProyecto?.trim()) {
      setMensajeAlerta({ tipo: 'error', texto: 'Ingrese el nombre del nuevo programa.' });
      return;
    }

    const temasConsolidados = modulosEditando
      .map(m => `Módulo ${m.numero}: ${m.titulo}`)
      .join('\n');

    const esCursoBasico = proyectoEditando.nivel === 'Básico' ||
      /b[áa]sico/i.test(proyectoEditando.nombreProyecto || '') ||
      (proyectoEditando.tipoProyecto === 'Curso' && !proyectoEditando.nivel);

    const totalHorasCalculadas = modulosEditando.reduce((acc, m) => acc + (Number(m.horas) || 0), 0);
    const horasClase = esCursoBasico ? 12 : (totalHorasCalculadas > 0 ? totalHorasCalculadas : (proyectoEditando.horasClase || 40));
    const cantidadTemas = esCursoBasico ? 4 : modulosEditando.length;
    const horasClasePorTema = esCursoBasico ? 3 : (modulosEditando.length > 0 ? Math.round(horasClase / modulosEditando.length) : 10);

    const metricasNuevas = calcularMetricasProyecto({
      ...proyectoEditando,
      horasClase,
      tarifaHoraDocente: proyectoEditando.tarifaHoraDocente ?? 200,
      costoZoom: proyectoEditando.costoZoom ?? 300,
      costoPapeleria: proyectoEditando.costoPapeleria ?? 100,
      gastosVarios: proyectoEditando.gastosVarios ?? 100,
      margenGananciaOperativa: (proyectoEditando.margenGananciaOperativa && margenesPredefinidos.includes(proyectoEditando.margenGananciaOperativa))
        ? proyectoEditando.margenGananciaOperativa
        : 40,
      alumnosProyectados: proyectoEditando.alumnosProyectados ?? 6,
      alumnosFinal: proyectoEditando.alumnosFinal ?? 6,
      aplicaISV: proyectoEditando.aplicaISV ?? false,
    } as any);

    const correlativosAuto = generarSiguienteCorrelativo(
      listaProyectos,
      proyectoEditando.tipoProyecto,
      2026,
      proyectoEditando.aplicaISV
    );

    const numCorrelativo = correlativosAuto.numeroCorrelativo;
    const codigoProyecto = correlativosAuto.codigoProyecto;
    const correlativoSAR = correlativosAuto.correlativoSAR;
    const codigoFiscalSAR = correlativosAuto.codigoFiscalSAR;

    const nuevoId = proyectoEditando.id || `p-${Date.now()}`;
    const nuevoProyecto: ProyectoEducativo = {
      ...(proyectoEditando as ProyectoEducativo),
      ...metricasNuevas,
      id: nuevoId,
      numeroCorrelativo: numCorrelativo,
      codigoProyecto,
      codigoPrograma: codigoProyecto,
      correlativoSAR,
      codigoFiscalSAR,
      nivel: esCursoBasico ? 'Básico' : (proyectoEditando.nivel || 'Básico'),
      esSilaboBase: true,
      tieneSilabo: true,
      tipoRegistro: 'silabo_oficial',
      creadoPorAcademica: true,
      origenRegistro: 'gerencia-academica',
      etapaFlujo: 'revision_gerencia_general',
      autorizacionAcademica: true,
      fechaAutorizacionAcademica: new Date().toLocaleDateString('es-HN'),
      fechaEnvioRevisionGG: new Date().toISOString(),
      horasClase,
      cantidadTemas,
      horasClasePorTema,
      temasImpartir: temasConsolidados,
      rubricaEvaluacion: rubricaEditando,
      fechaCreacion: new Date().toISOString(),
      horaCreacion: new Date().toLocaleTimeString('es-HN'),
      fechaHoraGrabacion: `${new Date().toLocaleDateString('es-HN')}, ${new Date().toLocaleTimeString('es-HN')}`,
      responsableAcademico: 'Phd. Donal Reyes - Dirección de Gerencia Académica',
    };

    // Guardar en el almacenamiento persistente de sílabos
    guardarSilaboEnStorage(nuevoProyecto);

    if (onCrearProyecto) {
      onCrearProyecto(nuevoProyecto);
    } else if (onGuardarProyecto) {
      onGuardarProyecto(nuevoProyecto);
    }

    setProyectoActivoId(nuevoId);
    setModo('vista');
    setMensajeAlerta({
      tipo: 'exito',
      texto: `¡Nuevo Sílabo Oficial "${nuevoProyecto.nombreProyecto}" formalizado como Proyecto! Correlativo Empresa: ${codigoProyecto} | SAR: ${correlativoSAR}. Remitido a Gerencia General para su revisión y aprobación. Notificación por correo enviada a las gerencias.`,
    });
    setTimeout(() => setMensajeAlerta(null), 5500);
  };

  // 5. BORRADO / ELIMINACIÓN DE PROGRAMA Y SÍLABO
  const handleConfirmarEliminacion = () => {
    if (!proyectoActual) return;
    const nombreEliminado = proyectoActual.nombreProyecto;
    const idEliminado = proyectoActual.id;

    eliminarSilaboDeStorage(idEliminado);

    if (onEliminarProyecto) {
      onEliminarProyecto(proyectoActual);
    }

    setConfirmarEliminar(false);

    // Cambiar al siguiente proyecto disponible o cerrar
    const restantes = listaProyectos.filter(p => p.id !== idEliminado);
    if (restantes.length > 0) {
      setProyectoActivoId(restantes[0].id);
      setModo('vista');
      setMensajeAlerta({
        tipo: 'exito',
        texto: `Programa "${nombreEliminado}" eliminado correctamente del catálogo.`,
      });
      setTimeout(() => setMensajeAlerta(null), 4000);
    } else {
      onClose();
    }
  };

  // Manejo de módulos dinámicos
  const handleAgregarModulo = () => {
    const nuevoNum = modulosEditando.length + 1;
    setModulosEditando([
      ...modulosEditando,
      { numero: nuevoNum, titulo: `Módulo ${nuevoNum}: Aplicación y Casos de Estudio`, horas: 10 }
    ]);
  };

  const handleEliminarModulo = (indexAEliminar: number) => {
    if (modulosEditando.length <= 1) {
      setMensajeAlerta({ tipo: 'error', texto: 'El sílabo debe contener al menos un módulo temático.' });
      return;
    }
    const filtrados = modulosEditando
      .filter((_, idx) => idx !== indexAEliminar)
      .map((mod, idx) => ({ ...mod, numero: idx + 1 }));
    setModulosEditando(filtrados);
  };

  const handleCambiarModulo = (idx: number, campo: 'titulo' | 'horas', valor: any) => {
    const copia = [...modulosEditando];
    copia[idx] = { ...copia[idx], [campo]: valor };
    setModulosEditando(copia);
  };

  // Suma de ponderación de rúbrica
  const sumaPonderacion = 
    (Number(rubricaEditando.proyectoFinalPct) || 0) +
    (Number(rubricaEditando.talleresPracticosPct) || 0) +
    (Number(rubricaEditando.participacionAsistenciaPct) || 0) +
    (Number(rubricaEditando.examenFinalPct) || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] print:max-h-none print:border-none print:shadow-none print:rounded-none">
        
        {/* BARRA SUPERIOR DE CONTROL INSTITUCIONAL (Print:hidden) */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 print:hidden border-b border-blue-800/40">
          
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-blue-500/30 text-blue-200 rounded border border-blue-400/30">
                  GERENCIA ACADÉMICA
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 bg-amber-500/20 text-amber-200 rounded border border-amber-400/30 hidden sm:inline-flex items-center gap-1.5 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>Flujo: Traslado a Gerencia General para Revisión Financiera</span>
                </span>

                {/* Selector rápido de programas si hay más de uno */}
                {listaProyectos.length > 1 && modo === 'vista' ? (
                  <div className="relative inline-block">
                    <select
                      id="select-programa-syllabo"
                      value={proyectoActual?.id}
                      onChange={(e) => {
                        setProyectoActivoId(e.target.value);
                        setMensajeAlerta(null);
                      }}
                      className="text-xs font-mono font-bold bg-blue-900/80 text-blue-100 border border-blue-500/40 rounded-lg px-2.5 py-1 pr-6 cursor-pointer hover:bg-blue-800/90 transition-colors focus:ring-1 focus:ring-blue-400 appearance-none"
                      title="Cambiar de programa para ver o editar su sílabo"
                    >
                      {listaProyectos.map((p) => (
                        <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                          {p.codigoPrograma || `SMT-${p.id}`} • {p.nombreProyecto}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-blue-300 absolute right-1.5 top-2 pointer-events-none" />
                  </div>
                ) : (
                  <span className="text-xs text-blue-200 font-mono font-bold">
                    {codigoOficial}
                  </span>
                )}

                {modo !== 'vista' && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded">
                    {modo === 'editar' ? 'Modo Actualización' : 'Modo Creación'}
                  </span>
                )}
              </div>

              <h3 className="text-sm font-bold text-white truncate max-w-sm sm:max-w-md mt-0.5">
                {modo === 'crear' 
                  ? 'Diseño y Registro de Sílabo Oficial (Proyecto Educativo)' 
                  : (proyectoActual?.nombreProyecto ? `Sílabo Oficial: ${proyectoActual.nombreProyecto}` : 'Sílabo Oficial y Estructura Curricular')}
              </h3>
            </div>
          </div>

          {/* BOTONERA DE ACCIONES DE GERENCIA ACADÉMICA */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap self-end sm:self-center">
            
            {modo === 'vista' ? (
              <>
                {/* 0. Botón Crear Sílabo Oficial */}
                <button
                  type="button"
                  id="btn-crear-nuevo-silabo-modal"
                  onClick={() => handleIniciarCreacion('curso_basico')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-colors cursor-pointer shadow-xs border border-emerald-400/30"
                  title="Diseñar y formalizar una nueva estructura curricular oficial (Sílabo Oficial) con correlativo automático"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>+ Crear Sílabo Oficial</span>
                </button>

                {/* 1. Botón Actualizar Sílabo */}
                <button
                  type="button"
                  id="btn-actualizar-syllabo"
                  onClick={handleIniciarEdicion}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-colors cursor-pointer shadow-xs"
                  title="Editar y actualizar la información pedagógica del sílabo para garantizar su precisión"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Actualizar</span>
                </button>

                {/* 2. Botón Borrar / Eliminar */}
                <button
                  type="button"
                  id="btn-eliminar-syllabo"
                  onClick={() => setConfirmarEliminar(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer"
                  title="Eliminar este programa y sílabo del catálogo institucional"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Eliminar</span>
                </button>

                <div className="h-5 w-px bg-white/20 mx-0.5" />

                {/* Copiar al Portapapeles */}
                <button
                  type="button"
                  onClick={handleCopiarTexto}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors cursor-pointer border border-white/15"
                  title="Copiar contenido en formato texto"
                >
                  {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                  <span className="hidden md:inline">{copiado ? 'Copiado' : 'Copiar'}</span>
                </button>

                {/* Imprimir en PDF */}
                <button
                  type="button"
                  id="btn-imprimir-silabo-pdf"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs border border-blue-400/30"
                  title="Imprimir documento oficial en PDF o enviar a impresora (Ctrl + P)"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Imprimir en PDF</span>
                  <span className="sm:hidden">Imprimir</span>
                </button>

                {/* Guardar en PDF */}
                <button
                  type="button"
                  id="btn-guardar-silabo-pdf"
                  onClick={handleGuardarPDF}
                  disabled={generandoPdfDescarga}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs border border-emerald-400/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Guardar y descargar archivo PDF oficial (.pdf) con membrete y firmas institucionales"
                >
                  {generandoPdfDescarga ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">{generandoPdfDescarga ? 'Generando...' : 'Guardar en PDF'}</span>
                  <span className="sm:hidden">{generandoPdfDescarga ? '...' : 'Guardar PDF'}</span>
                </button>
              </>
            ) : (
              <>
                {/* Botón Cancelar Edición/Creación */}
                <button
                  type="button"
                  onClick={() => {
                    setModo('vista');
                    setMensajeAlerta(null);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Cancelar</span>
                </button>

                {/* Botón Guardar */}
                <button
                  type="button"
                  id="btn-guardar-cambios-syllabo"
                  onClick={modo === 'editar' ? handleGuardarEdicion : handleGuardarNuevoPrograma}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-colors cursor-pointer shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{modo === 'editar' ? 'Guardar Sílabo Oficial (Proyecto)' : 'Formalizar Proyecto (Sílabo Oficial)'}</span>
                </button>
              </>
            )}

            {/* Cerrar Modal */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors ml-1 cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ALERTA DE MENSAJES Y ACCIONES REALIZADAS */}
        {mensajeAlerta && (
          <div className={`px-5 py-2.5 text-xs font-bold flex items-center justify-between border-b ${
            mensajeAlerta.tipo === 'exito' 
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
              : mensajeAlerta.tipo === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-blue-50 text-blue-900 border-blue-200'
          } print:hidden`}>
            <div className="flex items-center gap-2">
              {mensajeAlerta.tipo === 'exito' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              {mensajeAlerta.tipo === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600" />}
              <span>{mensajeAlerta.texto}</span>
            </div>
            <button
              type="button"
              onClick={() => setMensajeAlerta(null)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer text-sm font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* MODAL DE CONFIRMACIÓN DE BORRADO */}
        {confirmarEliminar && proyectoActual && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs print:hidden animate-in fade-in duration-150">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <p className="font-black text-rose-950 text-xs">
                  ¿Confirma la eliminación del programa y su sílabo oficial?
                </p>
                <p className="text-rose-800 text-[11px] mt-0.5">
                  Se removerá "{proyectoActual.nombreProyecto}" ({codigoOficial}) del catálogo de Gerencia Académica.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => setConfirmarEliminar(false)}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirmar-eliminar-syllabo"
                onClick={handleConfirmarEliminacion}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              >
                Sí, Eliminar Programa
              </button>
            </div>
          </div>
        )}

        {/* CONTENIDO PRINCIPAL: VISTA PREVIA IMPRIMIBLE O FORMULARIO DE EDICIÓN/CREACIÓN */}
        {modo === 'vista' && proyectoActual ? (
          /* =========================================================================
             1. VISTA OFICIAL DEL SÍLABO (FORMATO INSTITUCIONAL SUMMIT IMPULSA)
             ========================================================================= */
          <div ref={printableAreaRef} className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-900 print:p-8 print:overflow-visible font-sans">
            
            {/* Encabezado Membretado Oficial */}
            <div className="border-b-2 border-blue-900 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <SummitLogo variant="full" size="md" />
                  <div className="border-l border-slate-300 pl-3.5">
                    <div className="text-[11px] font-black uppercase tracking-widest text-blue-950">
                      DIRECCIÓN PEDAGÓGICA Y CURRICULAR
                    </div>
                    <div className="text-[10px] text-slate-600 font-medium">
                      Summit Impulsa Global • Sistema de Gestión Académica
                    </div>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-1.5">
                  <div className="inline-block px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg text-right shadow-2xs">
                    <div className="text-[9px] font-bold text-blue-700 uppercase tracking-wider">Control Empresa (Correlativo)</div>
                    <div className="text-sm font-black font-mono text-blue-950">{codigoEmpresa}</div>
                    <div className="text-[9px] font-mono text-slate-500">
                      {proyectoActual.fechaHoraGrabacion || proyectoActual.horaCreacion ? `Grabado: ${proyectoActual.fechaHoraGrabacion || proyectoActual.horaCreacion}` : 'Período Oficial: 2026'}
                    </div>
                  </div>
                  <div className="inline-block px-2.5 py-0.5 bg-amber-50 border border-amber-300 rounded text-right">
                    <div className="text-[8px] font-black text-amber-800 uppercase tracking-wider">Correlativo Fiscal SAR</div>
                    <div className="text-xs font-mono font-bold text-amber-950">{correlativoSAR}</div>
                  </div>
                </div>
              </div>

              {/* Banner de Flujo Inter-Gerencial y Avisos */}
              <div className="mt-3 p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-slate-50 border-slate-200">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    proyectoActual.etapaFlujo === 'revision_gerencia_general'
                      ? 'bg-purple-600 animate-pulse'
                      : proyectoActual.etapaFlujo === 'comercializacion'
                      ? 'bg-emerald-600'
                      : 'bg-blue-600'
                  }`} />
                  <span className="font-bold text-slate-800">
                    {proyectoActual.etapaFlujo === 'revision_gerencia_general'
                      ? 'Flujo Oficial: Remitido a Gerencia General para Revisión y Aprobación'
                      : proyectoActual.etapaFlujo === 'comercializacion'
                      ? 'Flujo Oficial: Aprobado por GG y Habilitado en Comercialización'
                      : 'Flujo Oficial: Formulado como Sílabo / Proyecto en Gerencia Académica'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1 shrink-0">
                  <span className="text-emerald-700 font-bold">✓ Notificación por correo activa</span>
                </div>
              </div>

              <div className="mt-4 text-center sm:text-left">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                  SÍLABO OFICIAL DEL CURSO • PROGRAMA ACADÉMICO
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-950 mt-1.5 tracking-tight">
                  {proyectoActual.nombreProyecto}
                </h1>
                <p className="text-xs text-slate-600 font-medium mt-1">
                  {proyectoActual.objetivoGeneral || 'Desarrollo de competencias técnicas, estratégicas y operativas aplicadas al contexto empresarial.'}
                </p>
              </div>
            </div>

            {/* 1. Datos Generales de la Asignatura */}
            <div className="space-y-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                <BookOpen className="w-3.5 h-3.5 text-blue-700" />
                1. Ficha Técnica y Datos Generales del Programa
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Nivel Académico</span>
                  <span className="font-bold text-blue-900 block mt-0.5">{proyectoActual.nivel || 'Básico'}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Carga Horaria Total</span>
                  <span className="font-black text-slate-900 font-mono block mt-0.5">{totalHoras} Horas de Clase</span>
                  <span className="text-[9px] text-slate-500">{horasTeoricas}h Teóricas • {horasPracticas}h Prácticas</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Modalidad de Impartición</span>
                  <span className="font-bold text-slate-900 block mt-0.5">{proyectoActual.modalidad || 'Virtual Sincrónica'}</span>
                  <span className="text-[9px] text-slate-500">{proyectoActual.plataformaLMS || 'Zoom Pro'}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Horario y Días</span>
                  <span className="font-bold text-slate-900 block mt-0.5 truncate">{proyectoActual.horario || '06:00 PM - 08:00 PM'}</span>
                  <span className="text-[9px] text-slate-500 truncate block">{proyectoActual.diasClase || 'Lunes, Miércoles y Viernes'}</span>
                </div>
              </div>
            </div>

            {/* 2. Cuerpo Docente Responsable */}
            <div className="space-y-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                <Users className="w-3.5 h-3.5 text-blue-700" />
                2. Docente Titular y Facilitador
              </h2>
              <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="text-xs font-bold text-blue-950 flex items-center gap-2 flex-wrap">
                    <span>{proyectoActual.nombreDocente}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 bg-blue-200 text-blue-900 rounded">
                      Docente Asignado
                    </span>
                    {docenteActualEnBanco && (
                      <button
                        type="button"
                        onClick={() => setDocenteParaVerCv(docenteActualEnBanco)}
                        className="print:hidden px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        title="Ver Curriculum Vitae con la Planilla Oficial de la Empresa"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Ver CVPDF</span>
                      </button>
                    )}
                  </div>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    {proyectoActual.docenteEspecialidad || 'Especialista en Capacitación Profesional y Desarrollo de Competencias'}
                  </p>
                </div>
                <div className="text-right text-[11px] text-slate-600 shrink-0">
                  <div>Sección: <strong className="text-slate-900">{proyectoActual.seccion || 'Sección A'}</strong></div>
                  <div>Fecha Inicio: <strong className="font-mono text-slate-900">{proyectoActual.fechaProgramacion || 'Programada'}</strong></div>
                </div>
              </div>
            </div>

            {/* 3. Metodología Pedagógica */}
            <div className="space-y-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                3. Metodología de Enseñanza y Enfoque Didáctico
              </h2>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 space-y-1.5">
                <p className="font-bold text-slate-900">
                  {proyectoActual.metodologia || 'Aprendizaje Basado en Proyectos (ABP) & Casos Prácticos Aplicados'}
                </p>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  El curso combina exposición conceptual sincrónica con talleres aplicados y análisis de casos reales. Se promueve la participación activa, el debate guiado y la entrega de un proyecto práctico acumulativo que consolida las competencias transferibles al ámbito laboral.
                </p>
              </div>
            </div>

            {/* 4. Desglose Temático y Distribución Modular */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <h2 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-700" />
                  4. Estructura Modular y Contenido Temático ({numTemas} Módulos)
                </h2>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {horasPorTema} hrs / módulo • {totalHoras} hrs totales
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200 text-xs">
                {listaModulosActuales.map((mod) => (
                  <div key={mod.numero} className="p-3 bg-white hover:bg-slate-50/80 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-900 font-bold flex items-center justify-center shrink-0 text-xs font-mono">
                        {mod.numero}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{mod.titulo}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Ejercicios guiados, aplicación de plantillas y discusión de casos prácticos.
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-xs font-black font-mono text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {mod.horas} horas
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Criterios de Evaluación y Acreditación */}
            <div className="space-y-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                <Award className="w-3.5 h-3.5 text-blue-700" />
                5. Sistema de Evaluación y Requisitos de Aprobación
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 font-bold block uppercase">Proyecto Integrador</span>
                  <span className="text-lg font-black text-emerald-950 font-mono block mt-0.5">{rubrica.proyectoFinalPct}%</span>
                  <span className="text-[9px] text-emerald-700">Entregable práctico final</span>
                </div>
                <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-[10px] text-blue-800 font-bold block uppercase">Talleres & Casos</span>
                  <span className="text-lg font-black text-blue-950 font-mono block mt-0.5">{rubrica.talleresPracticosPct}%</span>
                  <span className="text-[9px] text-blue-700">Asignaciones en clase</span>
                </div>
                <div className="p-2.5 bg-purple-50 rounded-lg border border-purple-200">
                  <span className="text-[10px] text-purple-800 font-bold block uppercase">Participación</span>
                  <span className="text-lg font-black text-purple-950 font-mono block mt-0.5">{rubrica.participacionAsistenciaPct}%</span>
                  <span className="text-[9px] text-purple-700">Interacción y debates</span>
                </div>
                <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200">
                  <span className="text-[10px] text-amber-800 font-bold block uppercase">Nota Mínima</span>
                  <span className="text-lg font-black text-amber-950 font-mono block mt-0.5">{rubrica.notaMinimaAprobacion} pts</span>
                  <span className="text-[9px] text-amber-700">Asistencia mín: {rubrica.asistenciaMinimaPct}%</span>
                </div>
              </div>
            </div>

            {/* 6. Costos Operativos del Programa */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <h2 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-blue-700" />
                  6. Costos Operativos del Programa
                </h2>
                <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Moneda: {moneda}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase mb-0.5">
                    <span>Honorarios Docente</span>
                    <span className="font-mono">{proyectoActual.horasClase || 12}h × {formatearMoneda(proyectoActual.tarifaHoraDocente ?? 200, monedaFormato)}/h</span>
                  </div>
                  <span className="text-base font-black text-slate-900 font-mono block">
                    {formatearMoneda(metricas?.costoDocenteCalculado ?? ((proyectoActual.horasClase || 12) * (proyectoActual.tarifaHoraDocente ?? 200)), monedaFormato)}
                  </span>
                  <span className="text-[9px] text-slate-500">Inversión docente directa</span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Plataforma Zoom HD</span>
                  <span className="text-base font-black text-slate-900 font-mono block mt-0.5">
                    {formatearMoneda(proyectoActual.costoZoom ?? 300, monedaFormato)}
                  </span>
                  <span className="text-[9px] text-slate-500">Infraestructura y grabación</span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Materiales / Didáctica</span>
                  <span className="text-base font-black text-slate-900 font-mono block mt-0.5">
                    {formatearMoneda(proyectoActual.costoPapeleria ?? 100, monedaFormato)}
                  </span>
                  <span className="text-[9px] text-slate-500">Guías, plantillas y diplomas</span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Gastos Varios / Imprevistos</span>
                  <span className="text-base font-black text-slate-900 font-mono block mt-0.5">
                    {formatearMoneda(proyectoActual.gastosVarios ?? 100, monedaFormato)}
                  </span>
                  <span className="text-[9px] text-slate-500">Soporte y contingencias</span>
                </div>
              </div>

              <div className="p-2.5 bg-amber-50/90 rounded-lg border border-amber-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-950">Gasto Total Operativo Presupuestado:</span>
                  <span className="text-[11px] text-amber-800">
                    (Inversión directa para impartición académica)
                  </span>
                </div>
                <span className="text-sm font-black text-amber-950 font-mono px-2.5 py-0.5 bg-amber-100 rounded border border-amber-300">
                  {formatearMoneda(metricas?.gastoTotalOperativo ?? 0, monedaFormato)}
                </span>
              </div>
            </div>

            {/* 7. Régimen Fiscal & Tratamiento ISV (SAR) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <h2 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-blue-700" />
                  7. Régimen Fiscal & Tratamiento ISV (SAR)
                </h2>
                {proyectoActual.aplicaISV ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    ✅ Grava ISV (15%)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    ❌ Exento de ISV (0%)
                  </span>
                )}
              </div>

              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/90 space-y-2 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">
                      Clasificación Oficial SAR del Servicio
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {proyectoActual.servicioFiscal || 'Capacitación profesional / Mentoría ejecutiva'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">
                      Tratamiento Tributario SAR
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {proyectoActual.aplicaISV ? 'Servicio Gravado con 15% ISV (Facturación SAR con CAI)' : 'Educación Formal y Formación Exenta de ISV'}
                    </span>
                  </div>
                </div>

                <div className="p-2 bg-white rounded-lg border border-amber-200 text-[11px] text-slate-700 leading-relaxed">
                  <strong className="text-amber-950 block mb-0.5">Dictamen Fiscal SAR:</strong>
                  {reglaFiscalActual.observaciones}
                </div>

                <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-amber-200/60">
                  <span><strong>Base Legal:</strong> {reglaFiscalActual.baseLegal || 'Art. 1 y 15 Ley del Impuesto Sobre Ventas - SAR Honduras'}</span>
                  <span>Régimen de Facturación Oficial Vigente</span>
                </div>
              </div>
            </div>

            {/* 8. Margen & Proyección de Alumnos */}
            <div className="space-y-2.5">
              <h2 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                <Percent className="w-3.5 h-3.5 text-blue-700" />
                8. Margen & Proyección de Alumnos
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-[10px] text-blue-800 font-bold uppercase block">Margen Operativo Objetivo</span>
                  <span className="text-lg font-black text-blue-950 font-mono block mt-0.5">
                    {proyectoActual.margenGananciaOperativa ?? 40}%
                  </span>
                  <span className="text-[9px] text-blue-700">Rentabilidad institucional proyectada</span>
                </div>

                <div className="p-2.5 bg-indigo-50 rounded-lg border border-indigo-200">
                  <span className="text-[10px] text-indigo-800 font-bold uppercase block">Venta Requerida Base</span>
                  <span className="text-lg font-black text-indigo-950 font-mono block mt-0.5">
                    {formatearMoneda(metricas?.precioVentaRequerido || 0, monedaFormato)}
                  </span>
                  <span className="text-[9px] text-indigo-700">Ingreso neto para cubrir costo y margen</span>
                </div>

                <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase block">Ganancia Operativa Base</span>
                  <span className="text-lg font-black text-emerald-950 font-mono block mt-0.5">
                    +{formatearMoneda(metricas?.gananciaOperativa || 0, monedaFormato)}
                  </span>
                  <span className="text-[9px] text-emerald-700">Utilidad operativa neta proyectada</span>
                </div>
              </div>
            </div>

            {/* 9. Alumnos Proyectados (Meta Mínima) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <h2 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-700" />
                  9. Alumnos Proyectados (Meta Mínima)
                </h2>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Estándar Institucional: Base Mínima 6 Alumnos
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Meta de Captación Proyectada</span>
                    <span className="text-xs font-black text-blue-900 font-mono bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                      {proyectoActual.alumnosProyectados || 6} Alumnos
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {Number(proyectoActual.alumnosProyectados || 6) >= 6 
                      ? '✓ Cumple con el estándar de quórum de 6 participantes para apertura académica garantizada.' 
                      : '⚠ Menor a 6 participantes: la Dirección Académica requiere consolidar quórum para viabilidad.'}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Punto de Equilibrio (Break-Even)</span>
                    <span className="text-xs font-black text-emerald-900 font-mono bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                      {metricas?.puntoEquilibrioAlumnos || 0} Alumnos
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Número mínimo exacto de estudiantes matriculados para cubrir el 100% de los costos operativos del programa.
                  </p>
                </div>
              </div>
            </div>

            {/* 10. Observaciones Curriculares & Requisitos Académicos */}
            <div className="space-y-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                <FileText className="w-3.5 h-3.5 text-blue-700" />
                10. Observaciones Curriculares & Requisitos Académicos
              </h2>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed">
                <p>
                  {proyectoActual.observaciones || 'Programa curricular diseñado conforme a la normativa y estándares de calidad académica de Summit Impulsa Global. Perfil de ingreso y competencias alineadas al marco de cualificaciones profesionales. La impartición docente se realizará bajo supervisión directa de Gerencia Académica.'}
                </p>
              </div>
            </div>

            {/* 11. Documento adjunto de referencia curricular */}
            {proyectoActual.planificacionPdf && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs print:hidden">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="text-slate-700 truncate font-semibold">
                    11. Documento PDF de Planificación Curricular Adjunto: <strong>{proyectoActual.planificacionPdf.nombreArchivo}</strong>
                  </span>
                </div>
                <a
                  href={proyectoActual.planificacionPdf.dataUrl}
                  download={proyectoActual.planificacionPdf.nombreArchivo}
                  className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 inline-flex items-center gap-1 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" /> Descargar PDF Original
                </a>
              </div>
            )}

            {/* 12. Resultados Financieros en Vivo */}
            <div className="space-y-2.5">
              <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 shadow-md border border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                      12. Resultados Financieros en Vivo
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    Moneda Oficial: {moneda}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/80">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Gasto Total Operativo</span>
                    <span className="text-sm font-black text-amber-400 font-mono block mt-0.5">
                      {formatearMoneda(metricas?.gastoTotalOperativo || 0, monedaFormato)}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/80">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Venta Requerida Base ({proyectoActual.margenGananciaOperativa ?? 40}%)</span>
                    <span className="text-sm font-semibold text-slate-200 font-mono block mt-0.5">
                      {formatearMoneda(metricas?.precioVentaRequerido || 0, monedaFormato)}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/80">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">15% ISV Total Curso</span>
                    <span className="text-sm font-semibold text-amber-400 font-mono block mt-0.5">
                      {formatearMoneda(metricas?.isvVentaRequeridaTotal || 0, monedaFormato)}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/80">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Venta + ISV</span>
                    <span className="text-sm font-bold text-emerald-300 font-mono block mt-0.5">
                      {formatearMoneda(metricas?.precioVentaRequeridoConISV || metricas?.precioVentaRequerido || 0, monedaFormato)}
                    </span>
                  </div>
                </div>

                {/* Tarjeta de Precio Sugerido por Alumno & Desglose ISV */}
                <div className="bg-blue-950/70 border border-blue-800/70 rounded-lg p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-blue-200">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Precio Sugerido Neto / Alumno:</span>
                    <span className="font-mono text-blue-300 font-bold text-xs">
                      {formatearMoneda(metricas?.precioSugeridoAlumno || 0, monedaFormato)}
                    </span>
                  </div>

                  {proyectoActual.aplicaISV ? (
                    <div className="flex items-center justify-between text-[11px] text-amber-300 font-semibold pt-1 border-t border-blue-900/60">
                      <span>+ 15% Impuesto Sobre Ventas (ISV SAR):</span>
                      <span className="font-mono">
                        +{formatearMoneda(metricas?.isvPorAlumno || 0, monedaFormato)}
                      </span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-emerald-400 font-semibold pt-1 border-t border-blue-900/60 flex items-center justify-between">
                      <span>Tratamiento Fiscal (SAR Honduras):</span>
                      <span>Exento de ISV (0% Ley SAR)</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs font-black text-amber-300 pt-1.5 border-t border-blue-800/80">
                    <span className="uppercase tracking-wider">Precio Final Sugerido por Alumno (con ISV):</span>
                    <span className="font-mono text-sm text-emerald-300 font-black">
                      {formatearMoneda(metricas?.precioFinalAlumnoConISV || metricas?.precioSugeridoAlumno || 0, monedaFormato)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>Ganancia Operativa Proyectada: <strong className="text-emerald-400">+{formatearMoneda(metricas?.gananciaOperativa || 0, monedaFormato)}</strong></span>
                  <span>ROI Estimado: <strong className="text-emerald-400">{(metricas?.roiPorcentaje || 0).toFixed(1)}%</strong></span>
                  <span>Punto Equilibrio: <strong className="text-blue-300">{metricas?.puntoEquilibrioAlumnos || 0} alumnos</strong></span>
                </div>
              </div>
            </div>

            {/* 13. Cuadro de Firmas Oficiales (DIRECCIÓN ACADÉMICA: Phd. Donal Reyes) */}
            <div className="pt-6 border-t-2 border-slate-300">
              <div className="grid grid-cols-2 gap-8 text-center pt-8">
                <div>
                  <div className="w-52 mx-auto border-b-2 border-slate-900 pb-1 mb-1">
                    <div className="font-serif italic text-slate-800 text-base font-semibold tracking-wide">
                      Phd. Donal Reyes
                    </div>
                  </div>
                  <div className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Phd. Donal Reyes
                  </div>
                  <div className="text-[10px] text-slate-600 font-bold uppercase">
                    Dirección de Gerencia Académica
                  </div>
                  <div className="text-[9px] text-slate-400 font-medium">
                    Summit Impulsa Global • Sello de Autorización y Validez Curricular
                  </div>
                </div>

                <div>
                  <div className="w-52 mx-auto border-b-2 border-slate-900 pb-1 mb-1">
                    <div className="font-serif italic text-slate-800 text-base font-semibold tracking-wide">
                      {proyectoActual.nombreDocente}
                    </div>
                  </div>
                  <div className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    {proyectoActual.nombreDocente}
                  </div>
                  <div className="text-[10px] text-slate-600 font-bold uppercase">
                    {proyectoActual.docenteEspecialidad || 'Docente Titular y Facilitador'}
                  </div>
                  <div className="text-[9px] text-slate-400 font-medium">
                    Cuerpo Docente Institucional Acreditado
                  </div>
                </div>
              </div>
            </div>

            {/* Pie de página institucional */}
            <div className="pt-3 border-t border-slate-200 text-center text-[9px] text-slate-400 font-mono">
              Documento de control académico interno y público • Summit Impulsa Global • Todos los derechos reservados • Código de Verificación: {codigoOficial} • Autorizado por Phd. Donal Reyes
            </div>

          </div>
        ) : (
          /* =========================================================================
             2. MODO ACTUALIZACIÓN / CREACIÓN CURRICULAR (FORMULARIO GERENCIA ACADÉMICA)
             ========================================================================= */
          <div className="p-6 overflow-y-auto space-y-6">
            
            {/* Banner orientativo del Flujo Institucional */}
            <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-xl flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-600 text-white shrink-0 shadow-2xs">
                <Sliders className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-black text-blue-950 uppercase tracking-wider">
                    {modo === 'editar' ? 'Actualización y Remisión de Sílabo Oficial' : 'Diseño y Registro de Sílabo Oficial (Proyecto Educativo)'}
                  </h4>
                  <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold">
                    Paso 1: Gerencia Académica
                  </span>
                </div>
                <p className="text-[11px] text-blue-900 leading-relaxed">
                  Gerencia Académica: Al registrarse el sílabo oficial con su estructura pedagógica y costos, <strong>se traslada automáticamente a la Gerencia General para su revisión y dictamen financiero</strong>. 
                  Posteriormente, si la Gerencia General aprueba la viabilidad financiera, pasa formalmente a la <strong>Gerencia de Comercialización</strong> para el inicio de ventas y matrícula. 
                  Si la Gerencia General encuentra inconsistencias en la parte financiera, <strong>el proyecto se regresa a la Gerencia Académica para su corrección</strong>.
                </p>
                <div className="pt-1 flex items-center gap-4 text-[10px] font-semibold text-indigo-900">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Código y Correlativo SAR Automáticos
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    Sellos de Auditoría (Fecha y Hora)
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    Custodia: Phd. Donal Reyes
                  </span>
                </div>
              </div>
            </div>

            {/* Formulario en Secciones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              
              {/* SECCIÓN 1: FICHA TÉCNICA INSTITUCIONAL & AUDITORÍA */}
              <div className="space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span className="font-black text-slate-900 text-xs uppercase">
                      1. Ficha Técnica Institucional
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded border border-blue-200">
                    Gobernanza Oficial
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nombre del Programa Académico *
                  </label>
                  <input
                    type="text"
                    value={proyectoEditando.nombreProyecto || ''}
                    onChange={(e) => setProyectoEditando({ ...proyectoEditando, nombreProyecto: e.target.value })}
                    placeholder="Ej. Diplomado Ejecutivo en Gestión de Proyectos"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* CÓDIGO OFICIAL AUTOMÁTICO SEGÚN CORRELATIVO */}
                <div className="p-3 bg-indigo-50/80 rounded-lg border border-indigo-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-indigo-950 uppercase flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Código Oficial Institucional (Correlativo Automático)
                    </span>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-indigo-600 text-white rounded shadow-2xs">
                      Correlativo #{String(numCorrelativo).padStart(3, '0')}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-2 rounded border border-indigo-200">
                      <span className="text-[10px] font-bold text-slate-500 block">Código Empresa</span>
                      <span className="text-xs font-mono font-black text-blue-900">{codigoEmpresa}</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-indigo-200">
                      <span className="text-[10px] font-bold text-slate-500 block">Correlativo SAR</span>
                      <span className="text-xs font-mono font-black text-slate-800">{correlativoSAR}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-indigo-800 italic">
                    * El código oficial se asigna correlativamente de forma automática y se vincula al registro fiscal SAR.
                  </p>
                </div>

                {/* SELLOS DE AUDITORÍA (FECHA Y HORA DE CREACIÓN) */}
                <div className="p-3 bg-emerald-50/80 rounded-lg border border-emerald-200 space-y-1.5">
                  <div className="flex items-center justify-between text-emerald-950">
                    <span className="text-[11px] font-black uppercase flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-700" />
                      Sellos de Auditoría de Creación
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-200 text-emerald-900 rounded">
                      Inalterable
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white p-2 rounded border border-emerald-200">
                      <span className="text-[10px] text-slate-500 font-bold block">Fecha de Creación:</span>
                      <strong className="text-slate-800 font-mono">{fechaCreacionAuditoria}</strong>
                    </div>
                    <div className="bg-white p-2 rounded border border-emerald-200">
                      <span className="text-[10px] text-slate-500 font-bold block">Hora de Creación:</span>
                      <strong className="text-slate-800 font-mono">{horaCreacionAuditoria}</strong>
                    </div>
                  </div>
                  <div className="text-[10px] text-emerald-900 pt-0.5">
                    Custodia Curricular: <strong>Phd. Donal Reyes</strong> (Gerencia Académica).
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Tipo de Formación
                    </label>
                    <select
                      value={proyectoEditando.tipoProyecto || 'Diplomado'}
                      onChange={(e) => {
                        const nuevoTipo = e.target.value as TipoProyecto;
                        const esCurso = nuevoTipo === 'Curso';
                        const esBasico = proyectoEditando.nivel === 'Básico' || esCurso;
                        setProyectoEditando({
                          ...proyectoEditando,
                          tipoProyecto: nuevoTipo,
                          nivel: esBasico ? 'Básico' : (proyectoEditando.nivel || 'Básico'),
                          horasClase: esBasico ? 12 : (proyectoEditando.horasClase || 24),
                          horasTeoricas: esBasico ? 4 : (proyectoEditando.horasTeoricas || 10),
                          horasPracticas: esBasico ? 8 : (proyectoEditando.horasPracticas || 14),
                        });
                        if (esBasico) {
                          setModulosEditando([
                            { numero: 1, titulo: modulosEditando[0]?.titulo || 'Fundamentos y Conceptos Clave', horas: 3 },
                            { numero: 2, titulo: modulosEditando[1]?.titulo || 'Herramientas Básicas y Ejercicios Prácticos', horas: 3 },
                            { numero: 3, titulo: modulosEditando[2]?.titulo || 'Casos Guiados de Aplicación Directa', horas: 3 },
                            { numero: 4, titulo: modulosEditando[3]?.titulo || 'Proyecto Integrador y Evaluación de Salida', horas: 3 },
                          ]);
                        }
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Diplomado">Diplomado</option>
                      <option value="Curso">Curso (Norma básica 12 hrs)</option>
                      <option value="Certificación">Certificación</option>
                      <option value="Taller">Taller</option>
                      <option value="Conferencia">Conferencia</option>
                      <option value="Seminario">Seminario</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nivel Académico
                    </label>
                    <select
                      value={proyectoEditando.nivel || 'Básico'}
                      onChange={(e) => {
                        const nuevoNivel = e.target.value as NivelProyecto;
                        if (nuevoNivel === 'Básico') {
                          setProyectoEditando({
                            ...proyectoEditando,
                            nivel: 'Básico',
                            horasClase: 12,
                            horasTeoricas: 4,
                            horasPracticas: 8,
                          });
                          setModulosEditando([
                            { numero: 1, titulo: modulosEditando[0]?.titulo || 'Fundamentos y Conceptos Clave', horas: 3 },
                            { numero: 2, titulo: modulosEditando[1]?.titulo || 'Herramientas Básicas y Ejercicios Prácticos', horas: 3 },
                            { numero: 3, titulo: modulosEditando[2]?.titulo || 'Casos Guiados de Aplicación Directa', horas: 3 },
                            { numero: 4, titulo: modulosEditando[3]?.titulo || 'Proyecto Integrador y Evaluación de Salida', horas: 3 },
                          ]);
                        } else if (nuevoNivel === 'Intermedio') {
                          setProyectoEditando({
                            ...proyectoEditando,
                            nivel: 'Intermedio',
                            horasClase: 24,
                            horasTeoricas: 10,
                            horasPracticas: 14,
                          });
                        } else if (nuevoNivel === 'Avanzado') {
                          setProyectoEditando({
                            ...proyectoEditando,
                            nivel: 'Avanzado',
                            horasClase: 32,
                            horasTeoricas: 12,
                            horasPracticas: 20,
                          });
                        } else {
                          setProyectoEditando({ ...proyectoEditando, nivel: nuevoNivel });
                        }
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Básico">Básico (Auto: 12 horas - Norma Institucional)</option>
                      <option value="Intermedio">Intermedio</option>
                      <option value="Avanzado">Avanzado</option>
                      <option value="Maestría / Alta Especialización">Maestría / Alta Especialización</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Modalidad
                    </label>
                    <select
                      value={proyectoEditando.modalidad || 'Virtual Sincrónica'}
                      onChange={(e) => setProyectoEditando({ ...proyectoEditando, modalidad: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Virtual Sincrónica">Virtual Sincrónica</option>
                      <option value="Híbrida">Híbrida</option>
                      <option value="Presencial">Presencial</option>
                      <option value="Asincrónica LMS">Asincrónica LMS</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold text-slate-700">
                        Carga Horaria Total
                      </label>
                      {proyectoEditando.nivel === 'Básico' && (
                        <span className="text-[9px] font-black text-blue-800 bg-blue-100 border border-blue-200 px-1 py-0.2 rounded">
                          ⚡ 12h Básico
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      min={1}
                      value={proyectoEditando.horasClase || 12}
                      onChange={(e) => setProyectoEditando({ ...proyectoEditando, horasClase: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      Horas Teóricas
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={proyectoEditando.horasTeoricas || 10}
                      onChange={(e) => setProyectoEditando({ ...proyectoEditando, horasTeoricas: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      Horas Prácticas
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={proyectoEditando.horasPracticas || 14}
                      onChange={(e) => setProyectoEditando({ ...proyectoEditando, horasPracticas: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Horario de Impartición
                    </label>
                    <input
                      type="text"
                      value={proyectoEditando.horario || ''}
                      onChange={(e) => setProyectoEditando({ ...proyectoEditando, horario: e.target.value })}
                      placeholder="Ej. 06:00 PM - 08:00 PM"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Días de Clase
                    </label>
                    <input
                      type="text"
                      value={proyectoEditando.diasClase || ''}
                      onChange={(e) => setProyectoEditando({ ...proyectoEditando, diasClase: e.target.value })}
                      placeholder="Ej. Lunes, Miércoles y Viernes"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: DOCENCIA Y ENFOQUE PEDAGÓGICO */}
              <div className="space-y-3.5 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span className="font-black text-slate-900 text-xs uppercase">
                      2. Facilitador y Propósito Pedagógico
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalDirectorioDocentesAbierto(true)}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Explorar el Banco de Docentes Institucional"
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Banco de Docentes ({bancoDocentes.length})</span>
                  </button>
                </div>

                {/* BLOQUE DE BÚSQUEDA Y COLOCACIÓN DESDE EL BANCO DE DOCENTES */}
                <div className="p-3 bg-white rounded-xl border border-indigo-200 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-indigo-950 uppercase tracking-wide flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                      Buscar y colocar desde el Banco de Docentes
                    </label>
                    <span className="text-[10px] text-indigo-600 font-bold">
                      {bancoDocentes.length} {bancoDocentes.length === 1 ? 'docente en banco' : 'docentes en banco'}
                    </span>
                  </div>

                  {/* Selector rápido dropdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <div className="sm:col-span-8">
                      <select
                        value={docenteEnBancoEditando ? docenteEnBancoEditando.id : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) return;
                          if (val === '__nuevo__' || val === '__explorar__') {
                            setModalDirectorioDocentesAbierto(true);
                          } else {
                            const encontrado = bancoDocentes.find((d) => d.id === val);
                            if (encontrado) handleAsignarDocenteDelBanco(encontrado);
                          }
                        }}
                        className="w-full px-2.5 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-indigo-500 rounded-lg text-xs font-semibold text-slate-900 transition-colors cursor-pointer"
                      >
                        <option value="">
                          {bancoDocentes.length === 0
                            ? '-- Banco vacío: Clic para registrar un docente --'
                            : '-- Seleccionar Docente del Banco Institucional --'}
                        </option>
                        {bancoDocentes.map((d) => (
                          <option key={d.id} value={d.id}>
                            🎓 {d.nombre} — {d.especialidad} ({d.clasificacion || d.titulo || 'Docente'}) • L. {d.tarifaHoraSugerida}/h
                          </option>
                        ))}
                        <option value="__nuevo__">+ Registrar Nuevo Docente en el Banco...</option>
                        <option value="__explorar__">🔍 Abrir Directorio Completo del Banco...</option>
                      </select>
                    </div>

                    <div className="sm:col-span-4">
                      <button
                        type="button"
                        onClick={() => setMostrarBuscadorDocente(!mostrarBuscadorDocente)}
                        className={`w-full px-2.5 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
                          mostrarBuscadorDocente 
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>{mostrarBuscadorDocente ? 'Cerrar Buscador' : 'Buscar por Texto'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Buscador interactivo en tiempo real */}
                  {mostrarBuscadorDocente && (
                    <div className="p-2.5 bg-indigo-50/70 rounded-lg border border-indigo-200 space-y-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          value={filtroDocente}
                          onChange={(e) => setFiltroDocente(e.target.value)}
                          placeholder="Buscar por nombre, especialidad o titulación..."
                          className="w-full pl-8 pr-7 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          autoFocus
                        />
                        {filtroDocente && (
                          <button
                            type="button"
                            onClick={() => setFiltroDocente('')}
                            className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Lista de resultados filtrados */}
                      <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                        {docentesFiltrados.length === 0 ? (
                          <div className="text-center py-2.5 text-xs text-slate-500">
                            No se encontraron docentes coincidentes con "{filtroDocente}".{' '}
                            <button
                              type="button"
                              onClick={() => setModalDirectorioDocentesAbierto(true)}
                              className="text-indigo-600 font-bold underline hover:text-indigo-800 ml-1"
                            >
                              Registrar en el Banco
                            </button>
                          </div>
                        ) : (
                          docentesFiltrados.map((d) => (
                            <div
                              key={d.id}
                              onClick={() => handleAsignarDocenteDelBanco(d)}
                              className="p-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg flex items-center justify-between gap-2 cursor-pointer transition-colors"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900 text-xs truncate">{d.nombre}</span>
                                  <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-semibold shrink-0">
                                    {d.clasificacion || d.titulo || 'Docente'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 truncate">{d.especialidad}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] font-mono font-bold text-slate-700">
                                  L. {d.tarifaHoraSugerida}/h
                                </span>
                                <button
                                  type="button"
                                  className="px-2 py-1 bg-indigo-600 text-white rounded text-[10px] font-bold"
                                >
                                  Colocar
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tarjeta de Docente Vinculado actualmente */}
                  {docenteEnBancoEditando ? (
                    <div className="p-2.5 bg-emerald-50/80 border border-emerald-300 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                          {docenteEnBancoEditando.nombre ? docenteEnBancoEditando.nombre.charAt(0).toUpperCase() : 'D'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-emerald-950 text-xs">
                              {docenteEnBancoEditando.nombre}
                            </span>
                            <span className="text-[9px] font-bold bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded">
                              ✓ En Banco de Docentes
                            </span>
                            {docenteEnBancoEditando.clasificacion && (
                              <span className="text-[9px] bg-white border border-emerald-200 text-emerald-800 px-1.5 py-0.2 rounded font-medium">
                                {docenteEnBancoEditando.clasificacion}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-emerald-800 mt-0.5 truncate">
                            {docenteEnBancoEditando.especialidad} • Tarifa: L. {docenteEnBancoEditando.tarifaHoraSugerida}/h • NPS: {docenteEnBancoEditando.calificacionNPS || 5.0}★
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Botón Ver CVPDF con la planilla de la empresa */}
                        <button
                          type="button"
                          id="btn-ver-cvpdf-silabo"
                          onClick={() => setDocenteParaVerCv(docenteEnBancoEditando)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                          title="Visualizar el CV en PDF con la Planilla Oficial"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Ver CVPDF</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProyectoEditando((prev) => ({
                              ...prev,
                              nombreDocente: '',
                              docenteEspecialidad: '',
                            }));
                          }}
                          className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-md text-[10px] font-bold transition-colors cursor-pointer"
                          title="Limpiar campos para escribir o buscar otro docente"
                        >
                          Cambiar
                        </button>
                      </div>
                    </div>
                  ) : (
                    bancoDocentes.length === 0 && (
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] flex items-center justify-between gap-2">
                        <span>El Banco no tiene docentes registrados aún.</span>
                        <button
                          type="button"
                          onClick={() => setModalDirectorioDocentesAbierto(true)}
                          className="text-amber-900 font-bold underline hover:text-amber-950 shrink-0"
                        >
                          + Registrar Docente con CV
                        </button>
                      </div>
                    )
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Docente Titular Asignado
                  </label>
                  <input
                    type="text"
                    value={proyectoEditando.nombreDocente || ''}
                    onChange={(e) => setProyectoEditando({ ...proyectoEditando, nombreDocente: e.target.value })}
                    placeholder="Ej. Ing. Walter René Pedroza"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Especialidad y Perfil Profesional del Docente
                  </label>
                  <input
                    type="text"
                    value={proyectoEditando.docenteEspecialidad || ''}
                    onChange={(e) => setProyectoEditando({ ...proyectoEditando, docenteEspecialidad: e.target.value })}
                    placeholder="Ej. Especialista en Normativa Fiscal, Finanzas y Estrategia"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Objetivo General del Programa
                  </label>
                  <textarea
                    rows={2}
                    value={proyectoEditando.objetivoGeneral || ''}
                    onChange={(e) => setProyectoEditando({ ...proyectoEditando, objetivoGeneral: e.target.value })}
                    placeholder="Describa el objetivo formativo general..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Metodología Didáctica Aplicada
                  </label>
                  <textarea
                    rows={2}
                    value={proyectoEditando.metodologia || ''}
                    onChange={(e) => setProyectoEditando({ ...proyectoEditando, metodologia: e.target.value })}
                    placeholder="Ej. Aprendizaje Basado en Proyectos (ABP), estudio de casos reales..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                  />
                </div>

                {/* Sello oficial no editable */}
                <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
                  <div className="text-[11px] text-blue-900">
                    <span className="font-bold">Firma Institucional Garantizada: </span>
                    <span>Phd. Donal Reyes — Dirección de Gerencia Académica</span>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: ESTRUCTURA MODULAR / TEMAS */}
              <div className="md:col-span-2 space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span className="font-black text-slate-900 text-xs uppercase">
                      3. Estructura Modular y Desglose de Horas ({modulosEditando.length} Módulos)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAgregarModulo}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Módulo</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {modulosEditando.map((mod, idx) => (
                    <div key={idx} className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center gap-3">
                      <span className="w-6 h-6 rounded bg-blue-100 text-blue-900 font-bold flex items-center justify-center shrink-0 font-mono text-xs">
                        {mod.numero}
                      </span>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={mod.titulo}
                          onChange={(e) => handleCambiarModulo(idx, 'titulo', e.target.value)}
                          placeholder={`Título o descripción del Módulo ${mod.numero}`}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-900 focus:bg-white"
                        />
                      </div>
                      <div className="w-24 shrink-0 flex items-center gap-1">
                        <input
                          type="number"
                          min={1}
                          value={mod.horas}
                          onChange={(e) => handleCambiarModulo(idx, 'horas', Number(e.target.value))}
                          className="w-14 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-bold text-right"
                        />
                        <span className="text-[10px] text-slate-500">hrs</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleEliminarModulo(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title="Eliminar módulo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECCIÓN 4: RÚBRICA DE EVALUACIÓN */}
              <div className="md:col-span-2 space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span className="font-black text-slate-900 text-xs uppercase">
                      4. Rúbrica y Criterios de Aprobación
                    </span>
                  </div>

                  <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                    sumaPonderacion === 100 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                      : 'bg-amber-50 text-amber-700 border-amber-300'
                  }`}>
                    {sumaPonderacion === 100 
                      ? '✓ Ponderación exacta: 100%' 
                      : `⚠ Suma actual: ${sumaPonderacion}% (Debe ser 100%)`}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      Proyecto Integrador (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={rubricaEditando.proyectoFinalPct}
                      onChange={(e) => setRubricaEditando({ ...rubricaEditando, proyectoFinalPct: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-emerald-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      Talleres y Casos (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={rubricaEditando.talleresPracticosPct}
                      onChange={(e) => setRubricaEditando({ ...rubricaEditando, talleresPracticosPct: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-blue-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      Participación (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={rubricaEditando.participacionAsistenciaPct}
                      onChange={(e) => setRubricaEditando({ ...rubricaEditando, participacionAsistenciaPct: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-purple-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      Examen / Evaluación (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={rubricaEditando.examenFinalPct}
                      onChange={(e) => setRubricaEditando({ ...rubricaEditando, examenFinalPct: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-amber-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      Nota Mínima de Aprobación (puntos)
                    </label>
                    <input
                      type="number"
                      min={60}
                      max={100}
                      value={rubricaEditando.notaMinimaAprobacion}
                      onChange={(e) => setRubricaEditando({ ...rubricaEditando, notaMinimaAprobacion: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      Asistencia Mínima Requerida (%)
                    </label>
                    <input
                      type="number"
                      min={50}
                      max={100}
                      value={rubricaEditando.asistenciaMinimaPct}
                      onChange={(e) => setRubricaEditando({ ...rubricaEditando, asistenciaMinimaPct: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* SECCIÓN 6: COSTOS OPERATIVOS DEL PROGRAMA */}
            <div className="space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  <span className="font-black text-slate-900 text-xs uppercase">
                    6. Costos Operativos del Programa
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Moneda: {moneda}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tarifa por Hora Docente
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={proyectoEditando.tarifaHoraDocente ?? 200}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setProyectoEditando({ 
                        ...proyectoEditando, 
                        tarifaHoraDocente: val,
                        costoHoraDocente: val 
                      });
                    }}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Honorarios: {formatearMoneda(((proyectoEditando.horasClase || 12) * (proyectoEditando.tarifaHoraDocente ?? 200)), monedaFormato)}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Plataforma Digital (Zoom HD)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={proyectoEditando.costoZoom ?? 300}
                    onChange={(e) => setProyectoEditando({ ...proyectoEditando, costoZoom: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Licencia, grabación y nube
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Papelería y Diplomas
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={proyectoEditando.costoPapeleria ?? 100}
                    onChange={(e) => setProyectoEditando({ ...proyectoEditando, costoPapeleria: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Material didáctico y acreditación
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Gastos Varios e Imprevistos
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={proyectoEditando.gastosVarios ?? 100}
                    onChange={(e) => setProyectoEditando({ ...proyectoEditando, gastosVarios: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Soporte técnico y contingencia
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-between text-xs">
                <span className="font-bold text-amber-950">Gasto Total Operativo Calculado:</span>
                <span className="text-sm font-black text-amber-950 font-mono">
                  {formatearMoneda(calculoEditando?.gastoTotalOperativo ?? 0, monedaFormato)}
                </span>
              </div>
            </div>

            {/* SECCIÓN 7: RÉGIMEN FISCAL & TRATAMIENTO ISV (SAR) */}
            <div className="space-y-3 bg-amber-50/40 p-4 rounded-xl border border-amber-200/80">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-amber-700" />
                  <span className="font-black text-slate-900 text-xs uppercase">
                    7. Régimen Fiscal & Tratamiento ISV (SAR)
                  </span>
                </div>
                <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                  SAR Honduras Vigente
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tipo de Servicio Fiscal Oficial
                  </label>
                  <select
                    value={proyectoEditando.servicioFiscal || 'Capacitación profesional / Mentoría ejecutiva'}
                    onChange={(e) => {
                      const nuevoServicio = e.target.value as TipoServicioFiscal;
                      const regla = obtenerReglaISVPorServicio(nuevoServicio);
                      setProyectoEditando({
                        ...proyectoEditando,
                        servicioFiscal: nuevoServicio,
                        aplicaISV: regla.gravaISV,
                      });
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
                  >
                    {REGLAS_ISV_SERVICIOS.map((r) => (
                      <option key={r.servicio} value={r.servicio}>
                        {r.servicio} {r.gravaISV ? '(Grava 15%)' : '(Exento 0%)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col justify-center">
                  <label className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-amber-200 cursor-pointer hover:bg-amber-50/50">
                    <input
                      type="checkbox"
                      checked={!!proyectoEditando.aplicaISV}
                      onChange={(e) => setProyectoEditando({ ...proyectoEditando, aplicaISV: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900 block">
                        {proyectoEditando.aplicaISV ? '✅ Grava 15% de Impuesto Sobre Ventas (ISV)' : '❌ Exento de ISV (0% Ley SAR)'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {proyectoEditando.aplicaISV ? 'Facturación fiscal con CAI SAR.' : 'Educación formal exenta de ISV.'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-amber-200 text-[11px] text-slate-700 leading-relaxed">
                <strong className="text-amber-950 block mb-0.5">Dictamen SAR Oficial:</strong>
                {reglaFiscalEditando.observaciones}
              </div>
            </div>

            {/* SECCIÓN 8 & 9: MARGEN, VENTA REQUERIDA Y PROYECCIÓN DE ALUMNOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 8. MARGEN & VENTA REQUERIDA */}
              <div className="space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-blue-600" />
                    <span className="font-black text-slate-900 text-xs uppercase">
                      8. Margen & Proyección de Alumnos
                    </span>
                  </div>
                  <span className="text-xs font-mono font-black text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                    {proyectoEditando.margenGananciaOperativa ?? 40}%
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Margen de Ganancia Operativa Objetivo
                    </label>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Exclusivo: 40%, 50%, 70%, 80%, 100%
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5">
                    {margenesPredefinidos.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setProyectoEditando({ ...proyectoEditando, margenGananciaOperativa: m })}
                        className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                          (proyectoEditando.margenGananciaOperativa ?? 40) === m
                            ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-400/50'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        {m}%
                      </button>
                    ))}
                  </div>

                  <div className="pt-1.5">
                    <input
                      type="range"
                      min={0}
                      max={margenesPredefinidos.length - 1}
                      step={1}
                      value={(() => {
                        const val = proyectoEditando.margenGananciaOperativa ?? 40;
                        const idx = margenesPredefinidos.indexOf(val);
                        return idx !== -1 ? idx : 0;
                      })()}
                      onChange={(e) => {
                        const idx = Number(e.target.value);
                        setProyectoEditando({ ...proyectoEditando, margenGananciaOperativa: margenesPredefinidos[idx] });
                      }}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5 px-0.5">
                      {margenesPredefinidos.map((m) => (
                        <span 
                          key={m} 
                          className={(proyectoEditando.margenGananciaOperativa ?? 40) === m ? 'text-blue-700 font-black' : ''}
                        >
                          {m}%
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 9. ALUMNOS PROYECTADOS (META MÍNIMA) */}
              <div className="space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="font-black text-slate-900 text-xs uppercase">
                      9. Alumnos Proyectados (Meta Mínima)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">
                    Base: 6 Alumnos
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Cantidad de Alumnos Proyectados
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={proyectoEditando.alumnosProyectados ?? 6}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setProyectoEditando({ 
                        ...proyectoEditando, 
                        alumnosProyectados: val,
                        alumnosFinal: val 
                      });
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                  />

                  {Number(proyectoEditando.alumnosProyectados || 6) < 6 && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Se recomienda una meta mínima de 6 alumnos para rentabilidad institucional.</span>
                    </div>
                  )}

                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                    <span>Punto de Equilibrio:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {calculoEditando?.puntoEquilibrioAlumnos || 0} alumnos
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 10: OBSERVACIONES */}
            <div className="space-y-2 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="font-black text-slate-900 text-xs uppercase">
                  10. Observaciones Curriculares & Requisitos Académicos
                </span>
              </div>
              <textarea
                rows={3}
                value={proyectoEditando.observaciones || ''}
                onChange={(e) => setProyectoEditando({ ...proyectoEditando, observaciones: e.target.value })}
                placeholder="Observaciones pedagógicas, consideraciones de admisión, perfil docente y lineamientos..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
              />
            </div>

            {/* SECCIÓN 12: RESULTADOS FINANCIEROS EN VIVO */}
            <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 shadow-md border border-slate-800 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">
                    12. Resultados Financieros en Vivo
                  </h3>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  {moneda}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/80">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Gasto Total Operativo</span>
                  <span className="text-sm font-black text-amber-400 font-mono block mt-0.5">
                    {formatearMoneda(calculoEditando?.gastoTotalOperativo || 0, monedaFormato)}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/80">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Venta Requerida Base ({proyectoEditando.margenGananciaOperativa ?? 40}%)</span>
                  <span className="text-sm font-semibold text-slate-200 font-mono block mt-0.5">
                    {formatearMoneda(calculoEditando?.precioVentaRequerido || 0, monedaFormato)}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/80">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">15% ISV Total Curso</span>
                  <span className="text-sm font-semibold text-amber-400 font-mono block mt-0.5">
                    {formatearMoneda(calculoEditando?.isvVentaRequeridaTotal || 0, monedaFormato)}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/80">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Venta + ISV</span>
                  <span className="text-sm font-bold text-emerald-300 font-mono block mt-0.5">
                    {formatearMoneda(calculoEditando?.precioVentaRequeridoConISV || calculoEditando?.precioVentaRequerido || 0, monedaFormato)}
                  </span>
                </div>
              </div>

              {/* Tarjeta de Precio Sugerido por Alumno & Desglose ISV */}
              <div className="bg-blue-950/70 border border-blue-800/70 rounded-lg p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between text-blue-200">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Precio Sugerido Neto / Alumno:</span>
                  <span className="font-mono text-blue-300 font-bold text-xs">
                    {formatearMoneda(calculoEditando?.precioSugeridoAlumno || 0, monedaFormato)}
                  </span>
                </div>

                {proyectoEditando.aplicaISV ? (
                  <div className="flex items-center justify-between text-[11px] text-amber-300 font-semibold pt-1 border-t border-blue-900/60">
                    <span>+ 15% Impuesto Sobre Ventas (ISV SAR):</span>
                    <span className="font-mono">
                      +{formatearMoneda(calculoEditando?.isvPorAlumno || 0, monedaFormato)}
                    </span>
                  </div>
                ) : (
                  <div className="text-[10px] text-emerald-400 font-semibold pt-1 border-t border-blue-900/60 flex items-center justify-between">
                    <span>Tratamiento Fiscal (SAR Honduras):</span>
                    <span>Exento de ISV (0% Ley SAR)</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs font-black text-amber-300 pt-1.5 border-t border-blue-800/80">
                  <span className="uppercase tracking-wider">Precio Final Sugerido por Alumno (con ISV):</span>
                  <span className="font-mono text-sm text-emerald-300 font-black">
                    {formatearMoneda(calculoEditando?.precioFinalAlumnoConISV || calculoEditando?.precioSugeridoAlumno || 0, monedaFormato)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                <span>Ganancia Operativa Proyectada: <strong className="text-emerald-400">+{formatearMoneda(calculoEditando?.gananciaOperativa || 0, monedaFormato)}</strong></span>
                <span>ROI Estimado: <strong className="text-emerald-400">{(calculoEditando?.roiPorcentaje || 0).toFixed(1)}%</strong></span>
                <span>Punto Equilibrio: <strong className="text-blue-300">{calculoEditando?.puntoEquilibrioAlumnos || 0} alumnos</strong></span>
              </div>
            </div>

            {/* Botones inferiores en modo edición/creación */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setModo('vista');
                  setMensajeAlerta(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-guardar-formulario-syllabo"
                onClick={modo === 'editar' ? handleGuardarEdicion : handleGuardarNuevoPrograma}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black rounded-lg text-xs transition-all cursor-pointer shadow-md flex items-center gap-1.5 hover:scale-[1.02]"
              >
                <Save className="w-4 h-4" />
                <span>{modo === 'editar' ? 'Guardar Cambios y Remitir a Gerencia General' : 'Registrar Sílabo y Trasladar a Gerencia General'}</span>
                <ArrowRight className="w-4 h-4 text-emerald-200" />
              </button>
            </div>

          </div>
        )}

        {/* BARRA INFERIOR DE ACCIONES (Print:hidden) */}
        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs print:hidden">
          <span className="text-slate-600 text-[11px]">
            {modo === 'vista' ? (
              <>Sugerencia: Usa <strong>Imprimir en PDF</strong> (o Ctrl + P) o <strong>Guardar en PDF</strong> para descargar el archivo oficial. Firma y Sello: <strong>Phd. Donal Reyes</strong>.</>
            ) : (
              <>Flujo Institucional: <strong>Al guardar, el sílabo se transfiere automáticamente a Gerencia General para su revisión y dictamen financiero.</strong></>
            )}
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {modo === 'vista' && (
              <>
                <button
                  type="button"
                  id="btn-footer-crear-silabo"
                  onClick={() => handleIniciarCreacion('curso_basico')}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  title="Diseñar y registrar un nuevo Sílabo Oficial"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>+ Crear Sílabo Oficial</span>
                </button>

                <button
                  type="button"
                  id="btn-footer-imprimir-pdf"
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  title="Imprimir documento oficial en PDF o enviar a impresora (Ctrl + P)"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir en PDF</span>
                </button>

                <button
                  type="button"
                  id="btn-footer-guardar-pdf"
                  onClick={handleGuardarPDF}
                  disabled={generandoPdfDescarga}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                  title="Guardar y descargar archivo PDF oficial (.pdf)"
                >
                  {generandoPdfDescarga ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>{generandoPdfDescarga ? 'Generando...' : 'Guardar en PDF'}</span>
                </button>
              </>
            )}

            {modo !== 'vista' && (
              <button
                type="button"
                onClick={() => setModo('vista')}
                className="px-3 py-1.5 bg-white hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-300 transition-colors cursor-pointer"
              >
                Volver a Vista Previa
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>

      {/* Modal del Directorio / Banco de Docentes */}
      <DocenteDirectoryModal
        isOpen={modalDirectorioDocentesAbierto}
        onClose={() => setModalDirectorioDocentesAbierto(false)}
        onSeleccionarDocente={(docente) => {
          handleAsignarDocenteDelBanco(docente);
          setModalDirectorioDocentesAbierto(false);
        }}
        moneda={moneda as any}
      />

      {/* Modal para visualizar CV (PDF) con la planilla oficial */}
      {docenteParaVerCv && (
        <DocenteCvPdfModal
          isOpen={Boolean(docenteParaVerCv)}
          onClose={() => setDocenteParaVerCv(null)}
          docente={docenteParaVerCv}
          moneda={moneda as any}
        />
      )}
    </div>
  );
};
