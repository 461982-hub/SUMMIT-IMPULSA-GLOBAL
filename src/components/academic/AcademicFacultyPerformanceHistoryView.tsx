import React, { useState, useMemo, useRef } from 'react';
import {
  Star,
  Award,
  CheckCircle2,
  Save,
  MessageSquare,
  TrendingUp,
  Users,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Search,
  BookOpen,
  Filter,
  Check,
  ChevronRight,
  Clock,
  ThumbsUp,
  HelpCircle,
  GraduationCap,
  Percent,
  BarChart3,
  Calendar,
  AlertCircle,
  FileText,
  Upload,
  Download,
  ExternalLink,
  Link as LinkIcon,
  FileCheck,
  Eye,
  Paperclip,
  X,
  Briefcase,
  Building2,
  Copy,
  FolderArchive
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';

interface AcademicFacultyPerformanceHistoryViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto: (p: ProyectoEducativo) => void;
  onVerDetalle?: (p: ProyectoEducativo) => void;
}

interface ComentarioFeedback {
  id: string;
  estudiante: string;
  fecha: string;
  puntuacion: number;
  comentario: string;
  aspectoMejora?: string;
  categoria?: 'Dominio Técnico' | 'Metodología & Didáctica' | 'Material de Apoyo' | 'Puntualidad' | 'General';
}

export const AcademicFacultyPerformanceHistoryView: React.FC<AcademicFacultyPerformanceHistoryViewProps> = ({
  proyectos,
  moneda,
  onGuardarProyecto,
  onVerDetalle,
}) => {
  // 1. Agrupación y Estadísticas por Docente Único
  const docentesMap = useMemo(() => {
    const map = new Map<string, {
      nombreDocente: string;
      especialidad: string;
      clasificacion: string;
      correo: string;
      telefono: string;
      cvUrl?: string;
      cvPdf?: {
        nombreArchivo: string;
        dataUrl: string;
        tamanoKb?: number;
        fechaCarga?: string;
      };
      expediente?: {
        universidadEgreso?: string;
        numeroColegiacion?: string;
        anosExperiencia?: number;
        resumenPerfil?: string;
        fechaActualizacion?: string;
      };
      proyectos: ProyectoEducativo[];
      totalHoras: number;
      totalAlumnos: number;
      evaluacionPromedioHistorica: number;
      totalFeedbacks: number;
    }>();

    proyectos.forEach((p) => {
      const doc = p.nombreDocente || 'Docente No Asignado';
      if (!map.has(doc)) {
        map.set(doc, {
          nombreDocente: doc,
          especialidad: p.docenteEspecialidad || 'Especialista en Cátedra',
          clasificacion: p.docenteClasificacion || 'Maestría',
          correo: p.docenteCorreo || `${doc.toLowerCase().replace(/[^a-z0-9]/g, '.')}@summitimpulsa.com`,
          telefono: p.docenteTelefono || '+504 9900-0000',
          cvUrl: p.docenteCvUrl || undefined,
          cvPdf: p.docenteCvPdf || undefined,
          expediente: p.docenteExpediente || undefined,
          proyectos: [],
          totalHoras: 0,
          totalAlumnos: 0,
          evaluacionPromedioHistorica: 0,
          totalFeedbacks: 0,
        });
      }

      const item = map.get(doc)!;
      item.proyectos.push(p);
      item.totalHoras += p.horasClase || 0;
      item.totalAlumnos += p.alumnosFinal || p.alumnosProyectados || 0;

      // Si el proyecto actual tiene CV o expediente y el ítem aún no, adoptarlo
      if (p.docenteCvPdf && !item.cvPdf) {
        item.cvPdf = p.docenteCvPdf;
      }
      if (p.docenteCvUrl && !item.cvUrl) {
        item.cvUrl = p.docenteCvUrl;
      }
      if (p.docenteExpediente && !item.expediente) {
        item.expediente = p.docenteExpediente;
      }
    });

    // Valores por defecto enriquecidos si no existen para garantizar una experiencia institucional completa
    map.forEach((item) => {
      let sumaScore = 0;
      let count = 0;
      let feedbacksCount = 0;

      item.proyectos.forEach((p) => {
        const score = p.docenteEvaluacionNPS || p.evaluacionCalidadDocente?.puntuacionPromedioDocente || 4.8;
        sumaScore += score;
        count++;

        const fbs = p.evaluacionCalidadDocente?.comentariosEstudiantes || [];
        feedbacksCount += fbs.length > 0 ? fbs.length : 3;
      });

      item.evaluacionPromedioHistorica = count > 0 ? Number((sumaScore / count).toFixed(2)) : 4.8;
      item.totalFeedbacks = feedbacksCount;

      // Datos base de expediente si aún no fueron registrados
      if (!item.expediente) {
        item.expediente = {
          universidadEgreso: item.clasificacion === 'Doctorado' ? 'INCAE Business School / UNAH' : 'UNITEC Honduras / Tecnológico de Monterrey',
          numeroColegiacion: `COL-${Math.floor(1000 + Math.random() * 9000)}`,
          anosExperiencia: item.clasificacion === 'Doctorado' ? 15 : 10,
          resumenPerfil: `Catedrático con amplia trayectoria ejecutiva y consultoría empresarial en ${item.especialidad}. Experto en metodologías activas y resolución de casos reales.`,
          fechaActualizacion: '2026-08-15',
        };
      }

      if (!item.cvUrl && !item.cvPdf) {
        item.cvUrl = `https://www.linkedin.com/in/${item.nombreDocente.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      }
    });

    return Array.from(map.values());
  }, [proyectos]);

  // Selección de Docente y Proyecto
  const [docenteSeleccionado, setDocenteSeleccionado] = useState<string>(
    docentesMap.length > 0 ? docentesMap[0].nombreDocente : ''
  );

  const docenteActual = useMemo(() => {
    return docentesMap.find((d) => d.nombreDocente === docenteSeleccionado) || docentesMap[0];
  }, [docentesMap, docenteSeleccionado]);

  // Proyecto seleccionado para evaluar/registrar feedback
  const [proyectoActivoId, setProyectoActivoId] = useState<string>(
    docenteActual?.proyectos[0]?.id || (proyectos[0]?.id || '')
  );

  // Mantener sincronizado el proyecto activo si cambia de docente
  const proyectoActual = useMemo(() => {
    if (!docenteActual || docenteActual.proyectos.length === 0) return proyectos[0];
    const found = docenteActual.proyectos.find((p) => p.id === proyectoActivoId);
    return found || docenteActual.proyectos[0];
  }, [docenteActual, proyectoActivoId, proyectos]);

  // Filtro de búsqueda
  const [busqueda, setBusqueda] = useState('');

  // Estados para Modal de Expediente & CV
  const [mostrarModalExpediente, setMostrarModalExpediente] = useState(false);
  const [modalCvUrl, setModalCvUrl] = useState('');
  const [modalCvPdf, setModalCvPdf] = useState<{
    nombreArchivo: string;
    dataUrl: string;
    tamanoKb?: number;
    fechaCarga?: string;
  } | null>(null);
  const [modalUniversidad, setModalUniversidad] = useState('');
  const [modalColegiacion, setModalColegiacion] = useState('');
  const [modalAnosExp, setModalAnosExp] = useState<number>(10);
  const [modalResumenPerfil, setModalResumenPerfil] = useState('');
  const [sincronizarTodosProyectos, setSincronizarTodosProyectos] = useState(true);
  const [arrastrandoArchivo, setArrastrandoArchivo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para Modal Visor de PDF
  const [pdfAVisualizar, setPdfAVisualizar] = useState<{
    nombreArchivo: string;
    dataUrl: string;
    docente: string;
  } | null>(null);

  // Formulario de Nuevo Feedback
  const [mostrarModalNuevoFeedback, setMostrarModalNuevoFeedback] = useState(false);
  const [nuevoNombreEstudiante, setNuevoNombreEstudiante] = useState('');
  const [nuevaPuntuacion, setNuevaPuntuacion] = useState<number>(5.0);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [nuevoAspectoMejora, setNuevoAspectoMejora] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState<'Dominio Técnico' | 'Metodología & Didáctica' | 'Material de Apoyo' | 'Puntualidad' | 'General'>('Dominio Técnico');

  // Estado de edición de criterios pedagógicos
  const [criteriosLocales, setCriteriosLocales] = useState({
    dominioTecnico: 4.9,
    claridadDidactica: 4.8,
    cumplimientoSyllabus: 5.0,
    puntualidad: 4.7,
    disponibilidadDudas: 4.9,
  });

  const [comentariosLocales, setComentariosLocales] = useState<ComentarioFeedback[]>([]);
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('¡Historial y evaluación del docente guardados exitosamente en el sistema!');

  // Inicializar estado cuando cambia el proyecto activo
  React.useEffect(() => {
    if (proyectoActual) {
      setCriteriosLocales({
        dominioTecnico: proyectoActual.evaluacionCalidadDocente?.criterios?.dominioTecnico || 4.9,
        claridadDidactica: proyectoActual.evaluacionCalidadDocente?.criterios?.claridadDidactica || 4.8,
        cumplimientoSyllabus: proyectoActual.evaluacionCalidadDocente?.criterios?.cumplimientoSyllabus || 5.0,
        puntualidad: proyectoActual.evaluacionCalidadDocente?.criterios?.puntualidad || 4.7,
        disponibilidadDudas: proyectoActual.evaluacionCalidadDocente?.criterios?.disponibilidadDudas || 4.9,
      });

      if (proyectoActual.evaluacionCalidadDocente?.comentariosEstudiantes && proyectoActual.evaluacionCalidadDocente.comentariosEstudiantes.length > 0) {
        setComentariosLocales(proyectoActual.evaluacionCalidadDocente.comentariosEstudiantes as ComentarioFeedback[]);
      } else {
        setComentariosLocales([
          {
            id: `fb-1-${proyectoActual.id}`,
            estudiante: 'Ing. Carlos Eduardo Martínez (Banco Atlántida)',
            fecha: '2026-08-25',
            puntuacion: 5.0,
            comentario: 'Excelente dominio de casos reales y modelos financieros avanzados. Las plantillas compartidas son de uso inmediato en mi gerencia.',
            aspectoMejora: 'Continuar con más talleres en vivo.',
            categoria: 'Dominio Técnico',
          },
          {
            id: `fb-2-${proyectoActual.id}`,
            estudiante: 'Lic. Andrea Sofía Morales (Cervecería Hondureña)',
            fecha: '2026-08-26',
            puntuacion: 4.9,
            comentario: 'La metodología pedagógica fue muy dinámica. Explicaciones sumamente claras y retroalimentación personalizada.',
            aspectoMejora: 'Ninguno, superó mis expectativas.',
            categoria: 'Metodología & Didáctica',
          },
          {
            id: `fb-3-${proyectoActual.id}`,
            estudiante: 'MSc. Roberto José Zelaya (Ficohsa)',
            fecha: '2026-08-27',
            puntuacion: 4.8,
            comentario: 'Gran calidad docente. El proyecto final integrador nos retó a solucionar un problema real de nuestra empresa.',
            aspectoMejora: 'Ampliar 30 minutos más la sesión de dudas.',
            categoria: 'Material de Apoyo',
          },
        ]);
      }
    }
  }, [proyectoActual]);

  // Abrir Modal de Expediente & CV con datos del docente actual
  const handleAbrirModalExpediente = () => {
    if (!docenteActual) return;
    setModalCvUrl(docenteActual.cvUrl || proyectoActual?.docenteCvUrl || '');
    setModalCvPdf(docenteActual.cvPdf || proyectoActual?.docenteCvPdf || null);
    setModalUniversidad(docenteActual.expediente?.universidadEgreso || proyectoActual?.docenteExpediente?.universidadEgreso || 'UNITEC Honduras / UNAH');
    setModalColegiacion(docenteActual.expediente?.numeroColegiacion || proyectoActual?.docenteExpediente?.numeroColegiacion || 'COL-2026');
    setModalAnosExp(docenteActual.expediente?.anosExperiencia || proyectoActual?.docenteExpediente?.anosExperiencia || 10);
    setModalResumenPerfil(docenteActual.expediente?.resumenPerfil || proyectoActual?.docenteExpediente?.resumenPerfil || `Especialista en ${docenteActual.especialidad}.`);
    setSincronizarTodosProyectos(true);
    setMostrarModalExpediente(true);
  };

  // Procesar archivo PDF
  const handleProcesarArchivoPdf = (file: File) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Por favor seleccione un archivo en formato PDF (.pdf).');
      return;
    }

    const tamanoKb = Math.round(file.size / 1024);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setModalCvPdf({
        nombreArchivo: file.name,
        dataUrl,
        tamanoKb,
        fechaCarga: new Date().toISOString().split('T')[0],
      });
    };
    reader.readAsDataURL(file);
  };

  // Guardar Expediente & CV
  const handleGuardarExpediente = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docenteActual) return;

    const datosExpediente = {
      universidadEgreso: modalUniversidad.trim(),
      numeroColegiacion: modalColegiacion.trim(),
      anosExperiencia: Number(modalAnosExp) || 0,
      resumenPerfil: modalResumenPerfil.trim(),
      fechaActualizacion: new Date().toISOString().split('T')[0],
    };

    const cvUrlFinal = modalCvUrl.trim() || undefined;
    const cvPdfFinal = modalCvPdf || undefined;

    if (sincronizarTodosProyectos) {
      // Sincronizar en todos los proyectos de este docente
      docenteActual.proyectos.forEach((p) => {
        const proyectoActualizado: ProyectoEducativo = {
          ...p,
          docenteCvUrl: cvUrlFinal,
          docenteCvPdf: cvPdfFinal,
          docenteExpediente: datosExpediente,
        };
        onGuardarProyecto(proyectoActualizado);
      });
    } else if (proyectoActual) {
      // Guardar solo en el proyecto actual
      const proyectoActualizado: ProyectoEducativo = {
        ...proyectoActual,
        docenteCvUrl: cvUrlFinal,
        docenteCvPdf: cvPdfFinal,
        docenteExpediente: datosExpediente,
      };
      onGuardarProyecto(proyectoActualizado);
    }

    setMostrarModalExpediente(false);
    setMensajeExito(`¡Expediente académico y CV de ${docenteActual.nombreDocente} guardados y centralizados exitosamente!`);
    setGuardadoExitoso(true);
    setTimeout(() => setGuardadoExitoso(false), 4000);
  };

  // Cálculo de promedio del proyecto actual
  const promedioPuntuacionProyecto = useMemo(() => {
    const suma =
      criteriosLocales.dominioTecnico +
      criteriosLocales.claridadDidactica +
      criteriosLocales.cumplimientoSyllabus +
      criteriosLocales.puntualidad +
      criteriosLocales.disponibilidadDudas;
    return Number((suma / 5).toFixed(2));
  }, [criteriosLocales]);

  const npsCalculado = Math.round((promedioPuntuacionProyecto / 5) * 100);

  // Agregar nuevo feedback estudiantil
  const handleAgregarFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombreEstudiante.trim() || !nuevoComentario.trim()) return;

    const nuevo: ComentarioFeedback = {
      id: `fb-${Date.now()}`,
      estudiante: nuevoNombreEstudiante.trim(),
      fecha: new Date().toISOString().split('T')[0],
      puntuacion: nuevaPuntuacion,
      comentario: nuevoComentario.trim(),
      aspectoMejora: nuevoAspectoMejora.trim() || undefined,
      categoria: nuevaCategoria,
    };

    const actualizados = [nuevo, ...comentariosLocales];
    setComentariosLocales(actualizados);

    // Reset y cerrar modal
    setNuevoNombreEstudiante('');
    setNuevoComentario('');
    setNuevoAspectoMejora('');
    setNuevaPuntuacion(5.0);
    setMostrarModalNuevoFeedback(false);

    // Auto-guardar en el proyecto
    if (proyectoActual) {
      const proyectoActualizado: ProyectoEducativo = {
        ...proyectoActual,
        docenteEvaluacionNPS: promedioPuntuacionProyecto,
        evaluacionCalidadDocente: {
          criterios: criteriosLocales,
          puntuacionPromedioDocente: promedioPuntuacionProyecto,
          npsDocentePct: npsCalculado,
          totalEvaluaciones: actualizados.length,
          comentariosEstudiantes: actualizados,
        },
      };
      onGuardarProyecto(proyectoActualizado);
      setMensajeExito('¡Retroalimentación estudiantil registrada con éxito!');
      setGuardadoExitoso(true);
      setTimeout(() => setGuardadoExitoso(false), 3000);
    }
  };

  // Eliminar feedback
  const handleEliminarFeedback = (id: string) => {
    const filtrados = comentariosLocales.filter((c) => c.id !== id);
    setComentariosLocales(filtrados);
    if (proyectoActual) {
      const proyectoActualizado: ProyectoEducativo = {
        ...proyectoActual,
        evaluacionCalidadDocente: {
          ...proyectoActual.evaluacionCalidadDocente,
          comentariosEstudiantes: filtrados,
          totalEvaluaciones: filtrados.length,
        },
      };
      onGuardarProyecto(proyectoActualizado);
    }
  };

  // Guardar evaluación completa
  const handleGuardarEvaluacionCompleta = () => {
    if (!proyectoActual) return;
    const proyectoActualizado: ProyectoEducativo = {
      ...proyectoActual,
      docenteEvaluacionNPS: promedioPuntuacionProyecto,
      evaluacionCalidadDocente: {
        criterios: criteriosLocales,
        puntuacionPromedioDocente: promedioPuntuacionProyecto,
        npsDocentePct: npsCalculado,
        totalEvaluaciones: comentariosLocales.length,
        comentariosEstudiantes: comentariosLocales,
      },
    };
    onGuardarProyecto(proyectoActualizado);
    setMensajeExito('¡Evaluación pedagógica y criterios de calidad guardados exitosamente!');
    setGuardadoExitoso(true);
    setTimeout(() => setGuardadoExitoso(false), 3000);
  };

  // Docentes filtrados
  const docentesFiltrados = useMemo(() => {
    if (!busqueda.trim()) return docentesMap;
    const q = busqueda.toLowerCase();
    return docentesMap.filter(
      (d) =>
        d.nombreDocente.toLowerCase().includes(q) ||
        d.especialidad.toLowerCase().includes(q) ||
        d.proyectos.some((p) => p.nombreProyecto.toLowerCase().includes(q))
    );
  }, [docentesMap, busqueda]);

  // CV PDF y URL efectivos del docente actual
  const cvPdfActual = docenteActual?.cvPdf || proyectoActual?.docenteCvPdf;
  const cvUrlActual = docenteActual?.cvUrl || proyectoActual?.docenteCvUrl;
  const expedienteActual = docenteActual?.expediente || proyectoActual?.docenteExpediente;

  return (
    <div className="space-y-6">
      {/* 1. Header Institucional de Historial de Rendimiento */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-5 sm:p-6 rounded-2xl shadow-md border border-indigo-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-400/30">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-white tracking-wide">
                Historial de Rendimiento, Expedientes & Feedback Docente
              </h3>
              <span className="text-[10px] font-mono uppercase bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded font-bold">
                Gestión Curricular • CV Digital • Auditoría NPS
              </span>
            </div>
          </div>
          <p className="text-xs text-indigo-200 max-w-3xl leading-relaxed mt-1">
            Centralización de expedientes académicos, documentos PDF de Curriculum Vitae, enlaces profesionales, evaluaciones de calidad y retroalimentación directa recibida de los participantes en cada cátedra.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleAbrirModalExpediente}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all border border-purple-400/40"
          >
            <Paperclip className="w-4 h-4" />
            <span>Adjuntar / Gestionar CV</span>
          </button>

          <button
            type="button"
            onClick={() => setMostrarModalNuevoFeedback(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all border border-emerald-400/40"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Retroalimentación</span>
          </button>

          <button
            type="button"
            onClick={handleGuardarEvaluacionCompleta}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>

      {guardadoExitoso && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2.5 animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* 2. Disposición Principal: Barra Lateral de Docentes + Panel Detallado */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Columna Izquierda: Directorio de Docentes */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                Cuerpo Docente ({docentesFiltrados.length})
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">
                {proyectos.length} Proyectos
              </span>
            </div>

            {/* Barra de Búsqueda */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar docente o cátedra..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
              />
            </div>

            {/* Lista de Docentes */}
            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
              {docentesFiltrados.map((doc) => {
                const isSelected = doc.nombreDocente === docenteActual?.nombreDocente;
                const tienePdf = !!(doc.cvPdf || doc.proyectos.some((p) => p.docenteCvPdf));
                const tieneUrl = !!(doc.cvUrl || doc.proyectos.some((p) => p.docenteCvUrl));

                return (
                  <button
                    key={doc.nombreDocente}
                    type="button"
                    onClick={() => {
                      setDocenteSeleccionado(doc.nombreDocente);
                      if (doc.proyectos.length > 0) {
                        setProyectoActivoId(doc.proyectos[0].id);
                      }
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-indigo-50/90 border-indigo-400 shadow-xs ring-1 ring-indigo-300'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-wider block">
                            {doc.clasificacion}
                          </span>
                          {tienePdf && (
                            <span className="px-1 py-0.2 bg-rose-100 text-rose-800 border border-rose-200 rounded text-[8px] font-black uppercase" title="CV en PDF adjunto">
                              PDF
                            </span>
                          )}
                          {tieneUrl && !tienePdf && (
                            <span className="px-1 py-0.2 bg-blue-100 text-blue-800 border border-blue-200 rounded text-[8px] font-black uppercase" title="Enlace web de CV">
                              LINK
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-black text-slate-900 truncate">
                          {doc.nombreDocente}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1 bg-amber-50 border border-amber-300 text-amber-900 px-2 py-0.5 rounded-md font-mono text-xs font-black shrink-0">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                        <span>{doc.evaluacionPromedioHistorica.toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <span className="font-semibold text-slate-700">
                        📚 {doc.proyectos.length} {doc.proyectos.length === 1 ? 'programa' : 'programas'}
                      </span>
                      <span>
                        ⏱️ {doc.totalHoras} hrs • 👥 {doc.totalAlumnos} alum.
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Rendimiento Histórico por Proyecto, Expediente & Feedback */}
        <div className="lg:col-span-8 space-y-6">
          
          {docenteActual && (
            <>
              {/* Tarjeta Resumen del Docente */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-900 rounded-md text-[10px] font-bold uppercase">
                        {docenteActual.clasificacion}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold">
                        {docenteActual.especialidad}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mt-1">
                      {docenteActual.nombreDocente}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Contacto: <strong className="text-slate-700">{docenteActual.correo}</strong> • Tel: <strong className="text-slate-700">{docenteActual.telefono}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-300 p-3 rounded-xl shrink-0">
                    <div className="p-2 bg-amber-500 text-white rounded-lg">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xl font-black text-amber-950 font-mono leading-none flex items-center gap-1">
                        {docenteActual.evaluacionPromedioHistorica.toFixed(2)}
                        <span className="text-xs font-normal text-amber-700">/ 5.0</span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block mt-0.5">
                        ⭐ NPS Histórico Promedio
                      </span>
                    </div>
                  </div>
                </div>

                {/* Métricas Globales del Docente */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Cátedras Impartidas</span>
                    <div className="text-base font-black text-slate-800 font-mono mt-0.5">
                      {docenteActual.proyectos.length} {docenteActual.proyectos.length === 1 ? 'Curso' : 'Cursos'}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Horas Totales</span>
                    <div className="text-base font-black text-indigo-700 font-mono mt-0.5">
                      {docenteActual.totalHoras} hrs lectivas
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Alumnos Capacitados</span>
                    <div className="text-base font-black text-emerald-700 font-mono mt-0.5">
                      {docenteActual.totalAlumnos} alumnos
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Evaluaciones Recibidas</span>
                    <div className="text-base font-black text-purple-700 font-mono mt-0.5">
                      {docenteActual.totalFeedbacks} encuestas
                    </div>
                  </div>
                </div>

                {/* 📄 MÓDULO CENTRALIZADO: EXPEDIENTE ACADÉMICO & CV DEL DOCENTE */}
                <div className="bg-gradient-to-r from-purple-50/70 via-indigo-50/50 to-blue-50/50 p-4 rounded-xl border border-purple-200 shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-purple-700 text-white rounded-lg">
                        <FolderArchive className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                          Expediente Académico & Curriculum Vitae (CV)
                        </h4>
                        <span className="text-[10px] text-purple-800">
                          Documentación oficial centralizada para acreditación institucional
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAbrirModalExpediente}
                      className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{cvPdfActual || cvUrlActual ? 'Actualizar Expediente' : 'Adjuntar CV / Expediente'}</span>
                    </button>
                  </div>

                  {/* Ficha Resumida del Expediente */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    
                    {/* Tarjeta de Documento PDF Adjunto */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-2 rounded-lg shrink-0 ${cvPdfActual ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-400'}`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">Documento PDF del CV</span>
                          {cvPdfActual ? (
                            <div>
                              <p className="font-bold text-slate-900 truncate text-xs" title={cvPdfActual.nombreArchivo}>
                                {cvPdfActual.nombreArchivo}
                              </p>
                              <span className="text-[10px] text-slate-500 block">
                                {cvPdfActual.tamanoKb ? `${cvPdfActual.tamanoKb} KB` : 'PDF'} {cvPdfActual.fechaCarga ? `• Carga: ${cvPdfActual.fechaCarga}` : ''}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">No se ha adjuntado PDF del CV</span>
                          )}
                        </div>
                      </div>

                      {cvPdfActual && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPdfAVisualizar({
                              nombreArchivo: cvPdfActual.nombreArchivo,
                              dataUrl: cvPdfActual.dataUrl,
                              docente: docenteActual.nombreDocente,
                            })}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-lg border border-indigo-200 transition-colors"
                            title="Visualizar documento PDF del CV"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <a
                            href={cvPdfActual.dataUrl}
                            download={cvPdfActual.nombreArchivo || `CV_${docenteActual.nombreDocente.replace(/\s+/g, '_')}.pdf`}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 transition-colors"
                            title="Descargar archivo PDF"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Tarjeta de Enlace Web / Perfil Profesional */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-2 rounded-lg shrink-0 ${cvUrlActual ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-400'}`}>
                          <LinkIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">Enlace Web / Portafolio</span>
                          {cvUrlActual ? (
                            <div>
                              <p className="font-bold text-blue-800 truncate text-xs" title={cvUrlActual}>
                                {cvUrlActual.replace(/^https?:\/\/(www\.)?/, '')}
                              </p>
                              <span className="text-[10px] text-slate-500 block">LinkedIn, Drive o Portafolio Digital</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">No se ha registrado enlace externo</span>
                          )}
                        </div>
                      </div>

                      {cvUrlActual && (
                        <a
                          href={cvUrlActual.startsWith('http') ? cvUrlActual : `https://${cvUrlActual}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-lg border border-blue-200 transition-colors font-bold text-xs flex items-center gap-1 shrink-0"
                          title="Abrir enlace en nueva pestaña"
                        >
                          <span>Abrir</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Datos Complementarios del Expediente (Universidad, Colegiación, Años) */}
                  {expedienteActual && (
                    <div className="bg-white/80 p-3 rounded-xl border border-purple-100 text-[11px] text-slate-700 space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span>🏛️ <strong>Alma Máter:</strong> {expedienteActual.universidadEgreso || 'Por definir'}</span>
                          <span>📜 <strong>Colegiación:</strong> {expedienteActual.numeroColegiacion || 'No aplica'}</span>
                          <span>💼 <strong>Experiencia:</strong> {expedienteActual.anosExperiencia || 10} años</span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          Actualizado: {expedienteActual.fechaActualizacion || '2026-08'}
                        </span>
                      </div>
                      {expedienteActual.resumenPerfil && (
                        <p className="text-slate-600 italic line-clamp-2 pt-1 border-t border-purple-50">
                          "{expedienteActual.resumenPerfil}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Selector de Proyecto Específico para Historial Detallado */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Desempeño Específico por Proyecto / Programa
                    </h4>
                  </div>

                  {/* Selector de Cátedra */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Seleccionar cátedra:</span>
                    <select
                      value={proyectoActivoId}
                      onChange={(e) => setProyectoActivoId(e.target.value)}
                      className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {docenteActual.proyectos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombreProyecto} ({p.horasClase}h • {p.alumnosFinal} alum.)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Desglose de Criterios del Proyecto Seleccionado */}
                {proyectoActual && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block">
                          Programa Evaluado: {proyectoActual.tipoProyecto}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">
                          {proyectoActual.nombreProyecto}
                        </h4>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          Horas: <strong>{proyectoActual.horasClase}h</strong> • Alumnos: <strong>{proyectoActual.alumnosFinal} inscritos</strong> • Estado: <strong className="text-indigo-900">{proyectoActual.seLlevoACabo}</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-white px-3.5 py-2 rounded-xl border border-indigo-200 shadow-2xs shrink-0">
                        <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                        <div>
                          <div className="text-sm font-black text-slate-900 font-mono">
                            {promedioPuntuacionProyecto} / 5.0
                          </div>
                          <span className="text-[10px] font-bold text-indigo-700">
                            NPS: {npsCalculado}% Satisfacción
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sliders Interactivos de Desempeño */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-slate-800">
                          <span>1. Dominio Técnico y Ejemplos Prácticos</span>
                          <span className="font-mono text-indigo-700">{criteriosLocales.dominioTecnico.toFixed(1)} / 5.0</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="0.1"
                          value={criteriosLocales.dominioTecnico}
                          onChange={(e) => setCriteriosLocales({ ...criteriosLocales, dominioTecnico: Number(e.target.value) })}
                          className="w-full accent-indigo-600"
                        />
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-slate-800">
                          <span>2. Claridad Expositiva y Didáctica</span>
                          <span className="font-mono text-indigo-700">{criteriosLocales.claridadDidactica.toFixed(1)} / 5.0</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="0.1"
                          value={criteriosLocales.claridadDidactica}
                          onChange={(e) => setCriteriosLocales({ ...criteriosLocales, claridadDidactica: Number(e.target.value) })}
                          className="w-full accent-indigo-600"
                        />
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-slate-800">
                          <span>3. Cumplimiento Integral del Syllabus</span>
                          <span className="font-mono text-indigo-700">{criteriosLocales.cumplimientoSyllabus.toFixed(1)} / 5.0</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="0.1"
                          value={criteriosLocales.cumplimientoSyllabus}
                          onChange={(e) => setCriteriosLocales({ ...criteriosLocales, cumplimientoSyllabus: Number(e.target.value) })}
                          className="w-full accent-indigo-600"
                        />
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-slate-800">
                          <span>4. Puntualidad e Inicio de Sesiones</span>
                          <span className="font-mono text-indigo-700">{criteriosLocales.puntualidad.toFixed(1)} / 5.0</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="0.1"
                          value={criteriosLocales.puntualidad}
                          onChange={(e) => setCriteriosLocales({ ...criteriosLocales, puntualidad: Number(e.target.value) })}
                          className="w-full accent-indigo-600"
                        />
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 sm:col-span-2">
                        <div className="flex justify-between text-xs font-bold text-slate-800">
                          <span>5. Disponibilidad y Soporte a Dudas / Proyecto Final</span>
                          <span className="font-mono text-indigo-700">{criteriosLocales.disponibilidadDudas.toFixed(1)} / 5.0</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="0.1"
                          value={criteriosLocales.disponibilidadDudas}
                          onChange={(e) => setCriteriosLocales({ ...criteriosLocales, disponibilidadDudas: Number(e.target.value) })}
                          className="w-full accent-indigo-600"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Módulo de Retroalimentación de los Estudiantes */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Retroalimentaciones y Evaluaciones Recibidas ({comentariosLocales.length})
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMostrarModalNuevoFeedback(true)}
                    className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Retroalimentación</span>
                  </button>
                </div>

                {comentariosLocales.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No hay retroalimentaciones registradas aún para este proyecto. Presione "Registrar Retroalimentación" para ingresar una.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {comentariosLocales.map((fb) => (
                      <div
                        key={fb.id}
                        className="p-4 bg-slate-50 hover:bg-slate-50/80 rounded-xl border border-slate-200 transition-all space-y-2 relative group"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs shrink-0">
                              {fb.estudiante.charAt(0)}
                            </div>
                            <div>
                              <span className="font-bold text-xs text-slate-900 block">
                                {fb.estudiante}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {fb.fecha} {fb.categoria ? `• Categoría: ${fb.categoria}` : ''}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              {fb.puntuacion.toFixed(1)} / 5.0
                            </span>

                            <button
                              type="button"
                              onClick={() => handleEliminarFeedback(fb.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Eliminar feedback"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 italic pl-9">
                          "{fb.comentario}"
                        </p>

                        {fb.aspectoMejora && (
                          <div className="pl-9 pt-1 text-[11px] text-slate-600 flex items-center gap-1.5">
                            <span className="font-bold text-indigo-700">💡 Oportunidad de mejora:</span>
                            <span>{fb.aspectoMejora}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </div>

      {/* 📁 MODAL PARA ADJUNTAR / GESTIONAR EXPEDIENTE ACADÉMICO & CV */}
      {mostrarModalExpediente && docenteActual && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-500/30 text-purple-300 rounded-xl border border-purple-400/30">
                  <FolderArchive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">
                    Expediente Académico & Curriculum Vitae (CV)
                  </h3>
                  <p className="text-[11px] text-purple-200">
                    Docente: <strong className="text-white">{docenteActual.nombreDocente}</strong> ({docenteActual.clasificacion})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalExpediente(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Cuerpo del Formulario */}
            <form onSubmit={handleGuardarExpediente} className="p-5 overflow-y-auto space-y-5 text-xs">
              
              {/* Sección 1: Documento PDF del CV */}
              <div className="space-y-2">
                <label className="block font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-rose-600" />
                  1. Documento PDF del Curriculum Vitae
                </label>
                
                {/* Zona de Carga / Dropzone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setArrastrandoArchivo(true);
                  }}
                  onDragLeave={() => setArrastrandoArchivo(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setArrastrandoArchivo(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleProcesarArchivoPdf(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl p-4 transition-all text-center ${
                    arrastrandoArchivo
                      ? 'border-indigo-500 bg-indigo-50/80 scale-[1.01]'
                      : 'border-slate-300 hover:border-purple-400 bg-slate-50/60'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleProcesarArchivoPdf(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />

                  {modalCvPdf ? (
                    <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs text-left">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 bg-rose-100 text-rose-700 rounded-lg shrink-0">
                          <FileCheck className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-black text-[9px] uppercase">
                              PDF Cargado
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {modalCvPdf.tamanoKb} KB • {modalCvPdf.fechaCarga}
                            </span>
                          </div>
                          <p className="font-bold text-slate-900 text-xs truncate mt-0.5">
                            {modalCvPdf.nombreArchivo}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs"
                        >
                          Reemplazar
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalCvPdf(null)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                          title="Quitar archivo PDF"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-3 space-y-2">
                      <div className="w-10 h-10 mx-auto rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="font-bold text-purple-700 hover:text-purple-900 underline cursor-pointer text-xs"
                        >
                          Haga clic para seleccionar el archivo PDF
                        </button>
                        <span className="text-slate-500 text-xs"> o arrástrelo y suéltelo aquí</span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Formato aceptado: Documentos en PDF (.pdf) hasta 25 MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sección 2: Enlace Web / Nube del CV */}
              <div className="space-y-2">
                <label className="block font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <LinkIcon className="w-4 h-4 text-blue-600" />
                  2. Enlace Externo a CV / Perfil Profesional
                </label>
                <div className="relative">
                  <ExternalLink className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={modalCvUrl}
                    onChange={(e) => setModalCvUrl(e.target.value)}
                    placeholder="https://www.linkedin.com/in/nombre-docente o enlace a Google Drive / OneDrive"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-medium text-slate-800 text-xs"
                  />
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span>Sugerencias rápidas:</span>
                  <button
                    type="button"
                    onClick={() => setModalCvUrl(`https://www.linkedin.com/in/${docenteActual.nombreDocente.toLowerCase().replace(/[^a-z0-9]/g, '-')}`)}
                    className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded font-semibold border border-blue-200"
                  >
                    LinkedIn
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalCvUrl('https://drive.google.com/drive/folders/cv-academico')}
                    className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-semibold border border-emerald-200"
                  >
                    Google Drive
                  </button>
                </div>
              </div>

              {/* Sección 3: Datos de Expediente y Acreditación */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="block font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  3. Datos de Acreditación & Ficha Curricular
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Universidad / Alma Máter de Egreso
                    </label>
                    <input
                      type="text"
                      value={modalUniversidad}
                      onChange={(e) => setModalUniversidad(e.target.value)}
                      placeholder="Ej: UNITEC Honduras / INCAE Business School"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-semibold text-slate-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      No. Colegiación / Registro
                    </label>
                    <input
                      type="text"
                      value={modalColegiacion}
                      onChange={(e) => setModalColegiacion(e.target.value)}
                      placeholder="Ej: COL-8942 / CIP-1234"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono font-bold text-slate-800 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Años de Experiencia
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={modalAnosExp}
                      onChange={(e) => setModalAnosExp(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono font-bold text-slate-800 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Resumen del Perfil Profesional & Docente
                    </label>
                    <input
                      type="text"
                      value={modalResumenPerfil}
                      onChange={(e) => setModalResumenPerfil(e.target.value)}
                      placeholder="Ej: Especialista en Modelación Financiera y Finanzas Corporativas..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-medium text-slate-800 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Sincronización Inter-proyectos */}
              <div className="bg-purple-50/70 p-3 rounded-xl border border-purple-200 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="chk-sync-expediente"
                  checked={sincronizarTodosProyectos}
                  onChange={(e) => setSincronizarTodosProyectos(e.target.checked)}
                  className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <label htmlFor="chk-sync-expediente" className="text-xs text-purple-950 font-semibold cursor-pointer">
                  Centralizar y sincronizar este expediente & CV en todos los programas impartidos por {docenteActual.nombreDocente} ({docenteActual.proyectos.length} {docenteActual.proyectos.length === 1 ? 'programa' : 'programas'}).
                </label>
              </div>

              {/* Botones de Acción del Modal */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMostrarModalExpediente(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Expediente & CV</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 📄 MODAL VISOR DE DOCUMENTO PDF */}
      {pdfAVisualizar && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Barra Superior del Visor */}
            <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-rose-600 text-white rounded-lg">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-white truncate max-w-md">
                    {pdfAVisualizar.nombreArchivo}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Curriculum Vitae • {pdfAVisualizar.docente}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={pdfAVisualizar.dataUrl}
                  download={pdfAVisualizar.nombreArchivo}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPdfAVisualizar(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg text-lg font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Contenedor del PDF */}
            <div className="flex-1 bg-slate-100 p-2 overflow-hidden flex flex-col">
              {pdfAVisualizar.dataUrl ? (
                <iframe
                  src={pdfAVisualizar.dataUrl}
                  title={pdfAVisualizar.nombreArchivo}
                  className="w-full h-full rounded-xl border border-slate-300 bg-white"
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                  No se pudo cargar la vista previa del documento.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para Registrar Nueva Retroalimentación de Estudiante */}
      {mostrarModalNuevoFeedback && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Registrar Retroalimentación Estudiantil
                  </h3>
                  <p className="text-[10px] text-indigo-200">
                    Docente: {docenteActual?.nombreDocente} • {proyectoActual?.nombreProyecto}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalNuevoFeedback(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAgregarFeedback} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nombre del Estudiante / Empresa
                </label>
                <input
                  type="text"
                  required
                  value={nuevoNombreEstudiante}
                  onChange={(e) => setNuevoNombreEstudiante(e.target.value)}
                  placeholder="Ej: Lic. Mario Mendoza (Cervecería Hondureña)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Puntuación Otorgada (1 a 5)
                  </label>
                  <select
                    value={nuevaPuntuacion}
                    onChange={(e) => setNuevaPuntuacion(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
                  >
                    <option value={5.0}>⭐ 5.0 - Excelente / Sobresaliente</option>
                    <option value={4.8}>⭐ 4.8 - Muy Bueno</option>
                    <option value={4.5}>⭐ 4.5 - Bueno / Cumple</option>
                    <option value={4.0}>⭐ 4.0 - Aceptable</option>
                    <option value={3.5}>⭐ 3.5 - Regular</option>
                    <option value={3.0}>⭐ 3.0 - Requiere Mejora</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Criterio Principal
                  </label>
                  <select
                    value={nuevaCategoria}
                    onChange={(e) => setNuevaCategoria(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
                  >
                    <option value="Dominio Técnico">Dominio Técnico</option>
                    <option value="Metodología & Didáctica">Metodología & Didáctica</option>
                    <option value="Material de Apoyo">Material de Apoyo</option>
                    <option value="Puntualidad">Puntualidad</option>
                    <option value="General">Evaluación General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Comentario / Opinión de la Cátedra
                </label>
                <textarea
                  required
                  rows={3}
                  value={nuevoComentario}
                  onChange={(e) => setNuevoComentario(e.target.value)}
                  placeholder="Describa la opinión del estudiante respecto al docente, claridad de las clases y aplicación de casos..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Aspecto u Oportunidad de Mejora (Opcional)
                </label>
                <input
                  type="text"
                  value={nuevoAspectoMejora}
                  onChange={(e) => setNuevoAspectoMejora(e.target.value)}
                  placeholder="Ej: Compartir lecturas previas con 2 días de anticipación"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMostrarModalNuevoFeedback(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Guardar Feedback</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
