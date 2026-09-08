import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  GraduationCap, 
  Clock, 
  Users, 
  Calendar, 
  Plus, 
  Edit3, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Sparkles,
  FileText,
  Video,
  FileSpreadsheet,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Bookmark,
  ShieldCheck,
  ShieldAlert,
  Award,
  Star,
  Laptop,
  Building,
  CheckSquare,
  Square,
  AlertTriangle,
  HelpCircle,
  Eye,
  BarChart3,
  CalendarDays,
  ListFilter,
  Download,
  Check,
  Flame,
  Mail,
  KeyRound,
  Copy,
  XCircle,
  Megaphone,
  Printer,
  CheckSquare2,
  Zap,
} from 'lucide-react';
import { ProyectoEducativo, Moneda, TipoProyecto, NivelProyecto, EstadoProyecto, TipoServicioFiscal } from '../types';
import { formatearMoneda, calcularMetricasProyecto } from '../utils/calculations';
import { obtenerReglaFiscalPorTipoProyecto } from '../utils/isvRules';
import { sumarDiasHabiles, sumarDiasCalendario, contarDiasHabilesEntreFechas } from '../utils/dateUtils';
import { SummitLogo } from './SummitLogo';
import { CREDENCIALES_GERENCIAS } from '../utils/gerenciasCredenciales';
import { WorkflowStatusBadge } from './WorkflowStatusBadge';
import { AcademicEvaluationRubricView } from './academic/AcademicEvaluationRubricView';
import { AcademicVirtualResourcesView } from './academic/AcademicVirtualResourcesView';
import { AcademicCertificatesView } from './academic/AcademicCertificatesView';
import { AcademicSessionsScheduleView } from './academic/AcademicSessionsScheduleView';
import { AcademicGradebookView } from './academic/AcademicGradebookView';
import { AcademicAttendanceView } from './academic/AcademicAttendanceView';
import { AcademicFacultyEvaluationView } from './academic/AcademicFacultyEvaluationView';
import { AcademicFacultyPerformanceHistoryView } from './academic/AcademicFacultyPerformanceHistoryView';
import { AcademicAgreementsAndCapstonesView } from './academic/AcademicAgreementsAndCapstonesView';
import { AcademicCapacityPrerequisitesView } from './academic/AcademicCapacityPrerequisitesView';
import { AcademicMasterFacultyCalendarView } from './academic/AcademicMasterFacultyCalendarView';
import { AcademicWorkloadDistributionView } from './academic/AcademicWorkloadDistributionView';
import { AcademicRiskHeatmapView } from './academic/AcademicRiskHeatmapView';
import { AcademicQualityDashboardView } from './academic/AcademicQualityDashboardView';
import { AcademicDocenteExpedienteSARView } from './academic/AcademicDocenteExpedienteSARView';
import { AcademicAcreditacionConveniosSARView } from './academic/AcademicAcreditacionConveniosSARView';
import { AcademicDocenteRoiDesercionView } from './academic/AcademicDocenteRoiDesercionView';
import { OfficialSyllabusModal } from './academic/OfficialSyllabusModal';
import { DocenteDirectoryModal } from './academic/DocenteDirectoryModal';
import { CurricularMadurezChecklistModal } from './academic/CurricularMadurezChecklistModal';
import { DuplicateProjectModal } from './academic/DuplicateProjectModal';
import { AcademicScheduleCalendarView } from './academic/AcademicScheduleCalendarView';
import { AcademicPOAAlertBanner } from './academic/AcademicPOAAlertBanner';
import { QuickCurricularTemplatesBar } from './academic/QuickCurricularTemplatesBar';
import { AcademicQuickBatchActionsBar } from './academic/AcademicQuickBatchActionsBar';
import { evaluarMadurezCurricular } from '../utils/curricularMadurezUtils';
import { SmartProjectSearchBar, coincideBusquedaInteligente, CriterioBusqueda } from './SmartProjectSearchBar';

interface GerenciaAcademicaViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onEditarProyecto: (p: ProyectoEducativo) => void;
  onVerDetalle: (p: ProyectoEducativo) => void;
  onNuevoProyecto: () => void;
  onGuardarProyecto: (p: ProyectoEducativo) => void;
  onEliminarProyecto?: (p: ProyectoEducativo) => void;
  onAbrirWorkflowStatusModal?: (proyectoId?: string) => void;
  onNotificar?: (mensaje: string) => void;
}

type SubPestanaAcademica = 
  | 'tablero_calidad'
  | 'catalogo' 
  | 'mapa_calor_riesgo'
  | 'docentes' 
  | 'carga_academica'
  | 'historial_docente'
  | 'calendario_docente'
  | 'calendario_aperturas'
  | 'syllabus' 
  | 'evaluacion' 
  | 'recursos' 
  | 'certificacion' 
  | 'cronograma' 
  | 'gradebook' 
  | 'asistencia' 
  | 'docente_nps' 
  | 'convenios_capstones' 
  | 'aforo_requisitos' 
  | 'acreditacion'
  | 'expediente_sar'
  | 'acreditacion_sar'
  | 'roi_desercion';


export const GerenciaAcademicaView: React.FC<GerenciaAcademicaViewProps> = ({
  proyectos,
  moneda,
  onEditarProyecto,
  onVerDetalle,
  onNuevoProyecto,
  onGuardarProyecto,
  onEliminarProyecto,
  onAbrirWorkflowStatusModal,
  onNotificar,
}) => {
  const [subPestana, setSubPestana] = useState<SubPestanaAcademica>('catalogo');
  const [busqueda, setBusqueda] = useState('');
  const [criterioBusqueda, setCriterioBusqueda] = useState<CriterioBusqueda>('todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroDocente, setFiltroDocente] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroModalidad, setFiltroModalidad] = useState<string>('todos');

  // Proyecto en edición rápida académica
  const [proyectoEditando, setProyectoEditando] = useState<ProyectoEducativo | null>(null);
  
  // Proyecto seleccionado para ver/editar Syllabus
  const [programaSyllabusSeleccionado, setProgramaSyllabusSeleccionado] = useState<ProyectoEducativo | null>(
    proyectos.length > 0 ? proyectos[0] : null
  );

  // Estados de control para las 6 Mejoras de Gerencia Académica
  const [syllabusModalAbierto, setSyllabusModalAbierto] = useState(false);
  const [proyectoSyllabusModal, setProyectoSyllabusModal] = useState<ProyectoEducativo | null>(null);

  const [docenteDirectoryModalAbierto, setDocenteDirectoryModalAbierto] = useState(false);

  const [madurezChecklistModalAbierto, setMadurezChecklistModalAbierto] = useState(false);
  const [proyectoMadurezModal, setProyectoMadurezModal] = useState<ProyectoEducativo | null>(null);

  const [duplicateModalAbierto, setDuplicateModalAbierto] = useState(false);
  const [proyectoDuplicar, setProyectoDuplicar] = useState<ProyectoEducativo | null>(null);

  // Lista de docentes únicos y estadísticas por docente
  const statsDocentes = useMemo(() => {
    const map = new Map<string, {
      nombre: string;
      especialidad: string;
      totalHoras: number;
      programas: ProyectoEducativo[];
      calificacionNPS: number;
      costoAcumulado: number;
      ingresoGenerado: number;
      alumnosAtendidos: number;
    }>();

    proyectos.forEach((p) => {
      const doc = p.nombreDocente.trim() || 'Docente no asignado';
      const actual = map.get(doc) || {
        nombre: doc,
        especialidad: p.docenteEspecialidad || 'Especialista en Capacitación',
        totalHoras: 0,
        programas: [],
        calificacionNPS: p.docenteEvaluacionNPS || 4.8,
        costoAcumulado: 0,
        ingresoGenerado: 0,
        alumnosAtendidos: 0,
      };

      actual.totalHoras += p.horasClase || 0;
      actual.programas.push(p);
      actual.costoAcumulado += p.costoDocenteCalculado || ((p.horasClase || 0) * (p.tarifaHoraDocente || 200));
      actual.ingresoGenerado += p.ingresoRealTotal || 0;
      actual.alumnosAtendidos += p.alumnosFinal || 0;
      if (p.docenteEvaluacionNPS) actual.calificacionNPS = p.docenteEvaluacionNPS;
      if (p.docenteEspecialidad) actual.especialidad = p.docenteEspecialidad;

      map.set(doc, actual);
    });

    return Array.from(map.values()).sort((a, b) => b.totalHoras - a.totalHoras);
  }, [proyectos]);

  // Docentes únicos para selector de filtros
  const docentesUnicos = useMemo(() => {
    return statsDocentes.map(d => d.nombre);
  }, [statsDocentes]);

  // Métricas globales de la Gerencia Académica
  const totalHorasClase = proyectos.reduce((acc, p) => acc + (p.horasClase || 0), 0);
  const totalHorasTeoricas = proyectos.reduce((acc, p) => acc + (p.horasTeoricas || Math.round((p.horasClase || 0) * 0.4)), 0);
  const totalHorasPracticas = proyectos.reduce((acc, p) => acc + (p.horasPracticas || Math.round((p.horasClase || 0) * 0.6)), 0);
  const totalDocentes = statsDocentes.length;
  const programasCompletados = proyectos.filter((p) => p.seLlevoACabo === 'Sí').length;
  const programasEnCurso = proyectos.filter((p) => p.seLlevoACabo === 'En curso').length;
  const programasPlanificados = proyectos.filter((p) => p.seLlevoACabo === 'Planificado').length;
  
  // Programas con acreditación formal SAR
  const programasAcreditados = proyectos.filter(p => p.cumpleAcreditacionSAR || p.tipoProyecto === 'Formación académica acreditada (ej. convenios universitarios)' || p.tipoProyecto === 'DIPLOMADO').length;
  
  // Promedio NPS Docente
  const promedioNPS = useMemo(() => {
    if (proyectos.length === 0) return 4.8;
    const suma = proyectos.reduce((acc, p) => acc + (p.docenteEvaluacionNPS || 4.8), 0);
    return (suma / proyectos.length).toFixed(1);
  }, [proyectos]);

  // Ratio promedio Alumno / Docente
  const ratioPromedioAlumnos = useMemo(() => {
    if (proyectos.length === 0) return 4;
    const totalAlumnos = proyectos.reduce((acc, p) => acc + (p.alumnosFinal || 4), 0);
    return (totalAlumnos / proyectos.length).toFixed(1);
  }, [proyectos]);

  // Filtrado de proyectos
  const proyectosFiltrados = useMemo(() => {
    return proyectos.filter((p) => {
      const matchBusqueda = coincideBusquedaInteligente(p, busqueda, criterioBusqueda);
      const matchTipo = filtroTipo === 'todos' || p.tipoProyecto === filtroTipo;
      const matchDocente = filtroDocente === 'todos' || p.nombreDocente === filtroDocente;
      const matchEstado = filtroEstado === 'todos' || p.seLlevoACabo === filtroEstado;
      const matchModalidad = filtroModalidad === 'todos' || (p.modalidad || 'Virtual Sincrónica') === filtroModalidad;

      return matchBusqueda && matchTipo && matchDocente && matchEstado && matchModalidad;
    });
  }, [proyectos, busqueda, criterioBusqueda, filtroTipo, filtroDocente, filtroEstado, filtroModalidad]);

  // Handler para guardar cambios académicos rápidos
  const handleGuardarCambiosAcademicos = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proyectoEditando) return;
    
    // Verificación automática de acreditación SAR si están los 4 checks
    const req = proyectoEditando.requisitosAcreditacionSAR;
    const cumple = req ? (req.tieneConvenio && req.horasMinimas && req.evaluacionFormal && req.temarioAprobado) : false;

    // Control de plazo de comercialización (20 días calendario automáticos desde la creación académica)
    const fechaElaboracionFinal = proyectoEditando.fechaElaboracion || proyectoEditando.fechaProgramacion || new Date().toISOString().slice(0, 10);
    const fechaVentaAuto20 = sumarDiasCalendario(fechaElaboracionFinal, 20);
    const fechaVentaFinal = proyectoEditando.fechaVenta || fechaVentaAuto20;

    // Respetar estado previo o decisión registrada por Gerencia de Comercialización
    const esDecisionNo = proyectoEditando.decisionPlazoVenta === 'No' || proyectoEditando.seLlevoACabo === 'No se llevó a cabo';
    const estadoFinal = esDecisionNo ? ('No se llevó a cabo' as const) : proyectoEditando.seLlevoACabo;

    const actualizado: ProyectoEducativo = {
      ...proyectoEditando,
      fechaElaboracion: fechaElaboracionFinal,
      diasHabilesVenta: 20,
      diasCalendarioVenta: 20,
      decisionPlazoVenta: proyectoEditando.decisionPlazoVenta,
      fechaRegistroDecision: proyectoEditando.fechaRegistroDecision,
      horaRegistroDecision: proyectoEditando.horaRegistroDecision,
      detalleRegistroDecision: proyectoEditando.detalleRegistroDecision,
      tiempoVentaCumplido: esDecisionNo,
      procesoCerrado: esDecisionNo,
      fechaCierrePorTiempo: esDecisionNo ? proyectoEditando.fechaCierrePorTiempo : undefined,
      motivoCierre: esDecisionNo ? proyectoEditando.motivoCierre : undefined,
      fechaProgramacion: fechaElaboracionFinal,
      fechaVenta: fechaVentaFinal,
      seLlevoACabo: estadoFinal,
      etapaFlujo: esDecisionNo ? 'cerrado' : proyectoEditando.etapaFlujo,
      cumpleAcreditacionSAR: cumple,
      aplicaISV: !cumple && proyectoEditando.aplicaISV !== false,
      alumnosProyectados: Number(proyectoEditando.alumnosProyectados) === 4 ? 6 : (Number(proyectoEditando.alumnosProyectados) || 6),
      margenGananciaOperativa: Number(proyectoEditando.margenGananciaOperativa) === 30 ? 40 : (Number(proyectoEditando.margenGananciaOperativa) || 40),
      alumnosFinal: Math.max(6, Number(proyectoEditando.alumnosFinal) || 6),
    };

    const recalculado = calcularMetricasProyecto(actualizado);
    onGuardarProyecto(recalculado);
    setProyectoEditando(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Banner de Identidad de Gerencia Académica */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-indigo-800/80">
        {/* Encabezado: Identidad, Logo y Líder */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="bg-white/10 p-2.5 rounded-2xl border border-white/20 shadow-inner shrink-0 backdrop-blur-xs">
              <SummitLogo variant="icon" size="md" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 bg-blue-500/30 text-blue-200 border border-blue-400/30 rounded">
                  SUMMIT IMPULSA GLOBAL
                </span>
                <span className="text-xs text-blue-300 font-medium">Gerencia Académica & Curricular</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                Dirección Pedagógica y Oferta Formativa
              </h2>
              <p className="text-xs sm:text-sm text-blue-100/80 mt-1 max-w-2xl">
                Diseño curricular, control de carga docente por hora, semáforo de acreditación SAR/Educación Superior, cronograma de aperturas y planes de estudio (Syllabus).
              </p>

              {/* Líder Oficial y Cuenta Institucional (POA 2026) */}
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-950/90 border border-blue-400/40 text-xs font-mono text-blue-200 shadow-2xs">
                  <span className="text-[10px] text-blue-300 font-sans font-semibold">Líder:</span>
                  <span className="font-bold text-white font-sans">{CREDENCIALES_GERENCIAS.academica.lider}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-950/90 border border-blue-400/40 text-xs font-mono text-blue-200 shadow-2xs">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[10px] text-blue-300 font-sans font-semibold">Correo:</span>
                  <span className="font-bold text-white select-all">{CREDENCIALES_GERENCIAS.academica.correo}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-900/60 border border-blue-400/30 text-xs text-blue-200">
                  <span className="text-[10px] font-bold text-blue-300">POA 2026:</span>
                  <span className="font-bold font-mono text-white">L. 153,600.00</span>
                  <span className="text-[10px] text-blue-300">(33.4% • 18 act.)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Widget de Oferta Formativa en Cabecera */}
          <div className="flex items-center gap-3 bg-blue-950/90 p-3 rounded-xl border border-blue-700/80 shrink-0 self-start lg:self-center">
            <GraduationCap className="w-6 h-6 text-blue-400 shrink-0" />
            <div>
              <span className="text-[10px] text-blue-300 uppercase font-bold block">Oferta Formativa Activa</span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black font-mono text-white">
                  {proyectos.length} Programas
                </span>
                <span className="text-[10px] text-blue-300">({totalDocentes} doc. • ⭐ {promedioNPS})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Operaciones Académicas en 1 Clic Adaptada (Responsive & Sin Desbordamientos) */}
        <div className="mt-4 pt-3.5 border-t border-indigo-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-black tracking-wider bg-blue-400/20 text-blue-300 border border-blue-400/30 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
              <Zap className="w-3.5 h-3.5 text-blue-300 fill-blue-300" />
              <span>Operaciones Académicas en 1 Clic</span>
            </span>
            <span className="text-xs text-blue-200/80 hidden xl:inline">
              Formulación curricular, directorio docente, sílabos PDF y checklist de entrega
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              id="btn-abrir-directorio-docentes-hero"
              onClick={() => setDocenteDirectoryModalAbierto(true)}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors border border-emerald-500/50 cursor-pointer"
              title="Administrar Banco de Docentes Institucionales, tarifas y especialidades"
            >
              <Users className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span>Banco Docentes</span>
            </button>

            <button
              type="button"
              id="btn-abrir-silabo-pdf-hero"
              onClick={() => {
                setProyectoSyllabusModal(programaSyllabusSeleccionado || proyectos[0] || null);
                setSyllabusModalAbierto(true);
              }}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-indigo-800/80 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors border border-indigo-500/40 cursor-pointer"
              title="Generar y previsualizar Sílabo Oficial en PDF con membrete institucional"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
              <span>Sílabo PDF</span>
            </button>

            <button
              type="button"
              id="btn-abrir-madurez-checklist-hero"
              onClick={() => {
                setProyectoMadurezModal(programaSyllabusSeleccionado || proyectos[0] || null);
                setMadurezChecklistModalAbierto(true);
              }}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-amber-900/80 hover:bg-amber-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors border border-amber-500/40 cursor-pointer"
              title="Checklist de Entrega y Madurez Curricular previa a comercialización"
            >
              <CheckSquare2 className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>Checklist Entrega</span>
            </button>

            {onAbrirWorkflowStatusModal && (
              <button
                type="button"
                id="btn-workflow-status-academica"
                onClick={() => onAbrirWorkflowStatusModal()}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-teal-800/80 hover:bg-teal-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors border border-teal-500/40 cursor-pointer"
                title="Rastreador de Nivel, Status y Tiempos de los Proyectos"
              >
                <Layers className="w-3.5 h-3.5 text-teal-200 shrink-0" />
                <span>Nivel & Status</span>
              </button>
            )}

            <button
              type="button"
              id="btn-crear-programa-academico"
              onClick={onNuevoProyecto}
              className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.02] border border-emerald-300 cursor-pointer"
              title="Crear y formular un nuevo programa académico oficial (Exclusivo Gerencia Académica)"
            >
              <Plus className="w-3.5 h-3.5 text-slate-950 stroke-[3] shrink-0" />
              <span>Nuevo Proyecto / Programa</span>
            </button>
          </div>
        </div>

        {/* 6 KPIs Clave de Gerencia Académica */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 mt-6 pt-5 border-t border-indigo-800/60">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[11px] font-semibold text-blue-200 block">Total Programas</span>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5">
              {proyectos.length}
            </div>
            <span className="text-[10px] text-blue-300/80">En catálogo formativo</span>
          </div>

          <div
            onClick={() => setSubPestana('mapa_calor_riesgo')}
            className="bg-rose-500/20 hover:bg-rose-500/30 transition-colors rounded-xl p-3 border border-rose-400/40 cursor-pointer group"
            title="Ver mapa de calor de proyectos con horas excesivas o márgenes comprimidos"
          >
            <span className="text-[11px] font-semibold text-rose-200 block flex items-center justify-between">
              <span>Riesgo Crítico</span>
              <Flame className="w-3.5 h-3.5 text-rose-400 fill-rose-400 group-hover:scale-110 transition-transform" />
            </span>
            <div className="text-xl sm:text-2xl font-black text-rose-300 mt-0.5">
              {proyectos.filter(p => (p.horasClase || 0) >= 45 || (p.ingresoRealTotal > 0 && (p.totalGananciasFinales / p.ingresoRealTotal) < 0.25)).length}
            </div>
            <span className="text-[10px] text-rose-200/90 font-medium">Horas o Margen frágil</span>
          </div>

          <div
            onClick={() => setSubPestana('carga_academica')}
            className="bg-white/5 hover:bg-white/10 transition-colors rounded-xl p-3 border border-white/10 cursor-pointer group"
          >
            <span className="text-[11px] font-semibold text-blue-200 block flex items-center justify-between">
              <span>Carga Horaria</span>
              <BarChart3 className="w-3.5 h-3.5 text-amber-300 group-hover:scale-110 transition-transform" />
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-300 mt-0.5">
              {totalHorasClase} hrs
            </div>
            <span className="text-[10px] text-blue-300/80">{totalHorasTeoricas}h T • {totalHorasPracticas}h P</span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[11px] font-semibold text-blue-200 block">Plantilla Docente</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-300 mt-0.5">
              {totalDocentes}
            </div>
            <span className="text-[10px] text-blue-300/80">NPS: ⭐ {promedioNPS}/5.0</span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[11px] font-semibold text-blue-200 block">Ratio Alumno/Doc.</span>
            <div className="text-xl sm:text-2xl font-black text-purple-300 mt-0.5">
              {ratioPromedioAlumnos} : 1
            </div>
            <span className="text-[10px] text-blue-300/80">Base mín: 4 alum.</span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[11px] font-semibold text-blue-200 block">Acreditación SAR</span>
            <div className="text-xl sm:text-2xl font-black text-cyan-300 mt-0.5">
              {programasAcreditados} / {proyectos.length}
            </div>
            <span className="text-[10px] text-blue-300/80">Exentos de ISV</span>
          </div>
        </div>
      </div>

      {/* Banner de Monitoreo de Metas POA SEP - DIC 2026 */}
      <AcademicPOAAlertBanner
        totalProyectos={proyectos.length}
        proyectos={proyectos}
        onNuevoProyecto={onNuevoProyecto}
      />

      {/* Controles de Rentabilidad y Valores de Referencia POA 2026 */}
      <QuickCurricularTemplatesBar
        proyectos={proyectos}
        onCrearProyecto={onGuardarProyecto}
        onEditarProyecto={onEditarProyecto}
        onNuevoProyecto={onNuevoProyecto}
        onAbrirSyllabusModal={(p) => {
          setProyectoSyllabusModal(p || null);
          setSyllabusModalAbierto(true);
        }}
        moneda={moneda}
        totalProyectosActuales={proyectos.length}
      />

      {/* Barra de Operaciones Académicas Rápidas en 1 Clic (Syllabus, Rúbricas, Traspaso a Comercialización) */}
      <AcademicQuickBatchActionsBar
        proyectos={proyectos}
        moneda={moneda}
        onGuardarProyecto={onGuardarProyecto}
        onNotificar={onNotificar}
        onAbrirWorkflowStatusModal={onAbrirWorkflowStatusModal}
      />

      {/* Sub-navegación de la Gerencia Académica Expandida */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-xl border border-slate-200 text-xs">
        <button
          id="btn-subpestana-tablero-calidad"
          onClick={() => setSubPestana('tablero_calidad')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all ${
            subPestana === 'tablero_calidad'
              ? 'bg-blue-600 text-white shadow-xs border border-blue-500 ring-2 ring-blue-400 font-black'
              : 'text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-amber-400 fill-amber-300" />
          <span>Tablero de Calidad</span>
        </button>

        <button
          onClick={() => setSubPestana('catalogo')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-colors ${
            subPestana === 'catalogo'
              ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
          <span>Catálogo Curricular</span>
        </button>

        <button
          onClick={() => setSubPestana('mapa_calor_riesgo')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-colors ${
            subPestana === 'mapa_calor_riesgo'
              ? 'bg-rose-600 text-white shadow-xs border border-rose-500 ring-2 ring-rose-400 font-black'
              : 'text-rose-700 bg-rose-50/80 hover:bg-rose-100 border border-rose-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-400" />
          <span>🔥 Mapa de Calor de Riesgo</span>
        </button>

        <button
          onClick={() => setSubPestana('carga_academica')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-colors ${
            subPestana === 'carga_academica'
              ? 'bg-white text-indigo-950 shadow-xs border border-indigo-300 ring-1 ring-indigo-400 font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
          <span>📊 Distribución de Carga (Ocupadas vs Disponibles)</span>
        </button>

        <button
          onClick={() => setSubPestana('docentes')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-colors ${
            subPestana === 'docentes'
              ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-indigo-600" />
          <span>Cuerpo Docente ({statsDocentes.length})</span>
        </button>

        <button
          onClick={() => setSubPestana('historial_docente')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-colors ${
            subPestana === 'historial_docente'
              ? 'bg-white text-indigo-950 shadow-xs border border-indigo-300 ring-1 ring-indigo-400'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
          <span>⭐ Historial de Rendimiento & Feedback</span>
        </button>

        <button
          onClick={() => setSubPestana('calendario_docente')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-colors ${
            subPestana === 'calendario_docente'
              ? 'bg-white text-blue-900 shadow-xs border border-slate-200 ring-1 ring-indigo-400'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
          <span>📅 Calendario & Carga Docente</span>
        </button>

        <button
          onClick={() => setSubPestana('calendario_aperturas')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-colors ${
            subPestana === 'calendario_aperturas'
              ? 'bg-white text-blue-900 shadow-xs border border-slate-200 ring-2 ring-cyan-400 font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-cyan-600" />
          <span>🗓️ Calendario de Aperturas & Fechas</span>
        </button>

        <button
          onClick={() => setSubPestana('syllabus')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-colors ${
            subPestana === 'syllabus'
              ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-purple-600" />
          <span>Planes de Estudio (Syllabus) & PDF</span>
        </button>

        <button
          onClick={() => setSubPestana('evaluacion')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-colors ${
            subPestana === 'evaluacion'
              ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-amber-600" />
          <span>Rúbricas & Criterios de Aprobación</span>
        </button>

        <button
          onClick={() => setSubPestana('recursos')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-colors ${
            subPestana === 'recursos'
              ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Laptop className="w-3.5 h-3.5 text-blue-600" />
          <span>Aulas Virtuales & Recursos</span>
        </button>

        <button
          onClick={() => setSubPestana('certificacion')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-colors ${
            subPestana === 'certificacion'
              ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
          <span>Certificación & Diplomas (QR)</span>
        </button>

        <button
          onClick={() => setSubPestana('cronograma')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-colors ${
            subPestana === 'cronograma'
              ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
          <span>Cronograma & Sesiones</span>
        </button>

        <button
          onClick={() => setSubPestana('gradebook')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-colors ${
            subPestana === 'gradebook'
              ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-blue-600" />
          <span>Actas & Calificaciones (Gradebook)</span>
        </button>

        <button
          onClick={() => setSubPestana('asistencia')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-colors ${
            subPestana === 'asistencia'
              ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-emerald-600" />
          <span>Control de Asistencia & Alerta</span>
        </button>

        <button
          onClick={() => setSubPestana('docente_nps')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-colors ${
            subPestana === 'docente_nps'
              ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-purple-600" />
          <span>Evaluación Docente (NPS)</span>
        </button>

        <button
          onClick={() => setSubPestana('convenios_capstones')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-colors ${
            subPestana === 'convenios_capstones'
              ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
          <span>Convenios & Banco de Proyectos</span>
        </button>

        <button
          onClick={() => setSubPestana('aforo_requisitos')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-colors ${
            subPestana === 'aforo_requisitos'
              ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Laptop className="w-3.5 h-3.5 text-teal-600" />
          <span>Aforo & Prerrequisitos</span>
        </button>

        <button
          onClick={() => setSubPestana('acreditacion')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-colors ${
            subPestana === 'acreditacion'
              ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Acreditación SAR (0% ISV)</span>
        </button>

        <button
          onClick={() => setSubPestana('expediente_sar')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-colors ${
            subPestana === 'expediente_sar'
              ? 'bg-blue-700 text-white shadow-xs border border-blue-600 font-black'
              : 'text-blue-900 bg-blue-50/80 hover:bg-blue-100 border border-blue-200 font-semibold'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-blue-600" />
          <span>📑 Expediente Docente & Retención SAR</span>
        </button>

        <button
          onClick={() => setSubPestana('acreditacion_sar')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-colors ${
            subPestana === 'acreditacion_sar'
              ? 'bg-emerald-700 text-white shadow-xs border border-emerald-600 font-black'
              : 'text-emerald-900 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200 font-semibold'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>🏛️ Auditoría Convenios & Dictamen Exención (15%)</span>
        </button>

        <button
          onClick={() => setSubPestana('roi_desercion')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-colors ${
            subPestana === 'roi_desercion'
              ? 'bg-indigo-700 text-white shadow-xs border border-indigo-600 font-black'
              : 'text-indigo-900 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200 font-semibold'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
          <span>📈 ROI Docente & Break-Even de Deserción</span>
        </button>
      </div>


      {/* VISTA NUEVA: TABLERO DE CALIDAD & VALIDACIÓN RÁPIDA DE CONTENIDOS */}
      {subPestana === 'tablero_calidad' && (
        <AcademicQualityDashboardView
          proyectos={proyectos}
          moneda={moneda}
          onGuardarProyecto={onGuardarProyecto}
          onVerDetalle={onVerDetalle}
          onEditarProyecto={onEditarProyecto}
          onIrASyllabus={(p) => {
            setProgramaSyllabusSeleccionado(p);
            setSubPestana('syllabus');
          }}
        />
      )}

      {/* VISTA 1: CATÁLOGO & GESTIÓN CURRICULAR */}
      {subPestana === 'catalogo' && (
        <div className="space-y-4">
          {/* SECCIÓN DESTACADA: APERTURA DE NUEVO PROGRAMA ACADÉMICO (Sello de Hora Automático) */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-emerald-950 text-white rounded-2xl p-4 sm:p-5 border border-emerald-500/40 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
            <div className="flex items-start sm:items-center gap-3.5 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
                <Plus className="w-6 h-6 stroke-[3]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 rounded">
                    Exclusivo Gerencia Académica
                  </span>
                  <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    Sello de Hora Automático y Control de Flujo Directo
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white mt-1">
                  Apertura y Registro de Nuevo Programa Educativo
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
                  Diseña la propuesta curricular, syllabus, carga docente y metas de cupos. Al guardar, se sella automáticamente la hora exacta de creación y se enlaza directamente a la <strong>Gerencia de Comercialización</strong> para su venta y difusión.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 relative z-10 self-stretch sm:self-auto justify-end">
              <button
                type="button"
                id="btn-destacado-nuevo-proyecto-academica"
                onClick={onNuevoProyecto}
                className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
                <span>+ Crear Nuevo Proyecto / Programa</span>
              </button>
            </div>
          </div>

          {/* Banner de acceso rápido al Tablero de Calidad */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border border-blue-200/80 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-xl shrink-0">
                <Award className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <span className="font-black text-blue-950 block text-xs">
                  Tablero de Calidad Curricular & Validación de Contenidos
                </span>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  Evalúa el cumplimiento de los 6 pilares académicos (Syllabus, Rúbrica, Recursos, Docente, Sesiones y SAR) con barras de progreso y tarjetas de estado interactivas.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSubPestana('tablero_calidad')}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shrink-0 flex items-center gap-1.5 shadow-xs transition-colors text-xs"
            >
              <span>⭐ Abrir Tablero de Calidad</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {/* Banner de alerta de riesgo curricular y financiero */}
          {proyectos.some(p => (p.horasClase || 0) >= 45 || (p.ingresoRealTotal > 0 && (p.totalGananciasFinales / p.ingresoRealTotal) < 0.25)) && (
            <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border border-rose-200 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-100 text-rose-700 rounded-xl shrink-0">
                  <Flame className="w-5 h-5 fill-rose-500 text-rose-600" />
                </div>
                <div>
                  <span className="font-black text-rose-950 block text-xs">
                    Alerta Temprana: Riesgo de Sobrecarga Docente y Márgenes Bajos
                  </span>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    Se detectaron programas con horas docentes elevadas (≥45h) o márgenes operativos &lt;25%. Revisa la matriz bidimensional para aplicar mitigaciones.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSubPestana('mapa_calor_riesgo')}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shrink-0 flex items-center gap-1.5 shadow-xs transition-colors text-xs"
              >
                <span>🔥 Abrir Mapa de Calor</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Barra de Filtros y Búsqueda Inteligente */}
          <div className="space-y-2">
            <SmartProjectSearchBar
              proyectos={proyectos}
              busqueda={busqueda}
              onBusquedaChange={setBusqueda}
              criterioActivo={criterioBusqueda}
              onCriterioActivoChange={setCriterioBusqueda}
              filtroTipo={filtroTipo}
              onFiltroTipoChange={setFiltroTipo}
              filtroDocente={filtroDocente}
              onFiltroDocenteChange={setFiltroDocente}
              filtroEstado={filtroEstado}
              onFiltroEstadoChange={setFiltroEstado}
              totalFiltrados={proyectosFiltrados.length}
              onLimpiarFiltros={() => {
                setBusqueda('');
                setCriterioBusqueda('todos');
                setFiltroTipo('todos');
                setFiltroDocente('todos');
                setFiltroEstado('todos');
                setFiltroModalidad('todos');
              }}
              moneda={moneda}
              placeholder="Buscar por programa formativo, docente o tipo de curso..."
            />

            {/* Filtros complementarios para Modalidad y Estado Académico */}
            <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                {/* Filtro Modalidad */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Modalidad:</span>
                  <select
                    id="filtro-modalidad-academica"
                    value={filtroModalidad}
                    onChange={(e) => setFiltroModalidad(e.target.value)}
                    className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    <option value="todos">Todas las Modalidades</option>
                    <option value="Virtual Sincrónica">Virtual Sincrónica</option>
                    <option value="Presencial">Presencial</option>
                    <option value="Híbrida">Híbrida</option>
                    <option value="Asincrónica LMS">Asincrónica LMS</option>
                  </select>
                </div>

                {/* Filtro Estado */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Estado Académico:</span>
                  <select
                    id="filtro-estado-academico"
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    <option value="todos">Todos los Estados</option>
                    <option value="Planificado">Planificado</option>
                    <option value="En curso">En curso</option>
                    <option value="Sí">Finalizado (Sí)</option>
                    <option value="Pospuesto">Pospuesto</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              {(filtroModalidad !== 'todos' || filtroEstado !== 'todos' || filtroTipo !== 'todos' || filtroDocente !== 'todos' || busqueda) && (
                <button
                  type="button"
                  onClick={() => {
                    setBusqueda('');
                    setCriterioBusqueda('todos');
                    setFiltroTipo('todos');
                    setFiltroDocente('todos');
                    setFiltroEstado('todos');
                    setFiltroModalidad('todos');
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                >
                  Restablecer filtros
                </button>
              )}
            </div>
          </div>

          {/* Tabla de Gestión Académica */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Programas Formativos ({proyectosFiltrados.length})
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  Alimentación académica curricular & asignación pedagógica
                </span>
                <button
                  id="btn-nuevo-programa-tabla"
                  onClick={onNuevoProyecto}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                  title="Registrar nuevo programa formativo desde Gerencia Académica"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Registrar Programa</span>
                </button>
              </div>
            </div>

            {proyectosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <GraduationCap className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-medium">No se encontraron programas con los filtros seleccionados.</p>
                <button
                  onClick={onNuevoProyecto}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-bold"
                >
                  <Plus className="w-3.5 h-3.5" /> Registrar nuevo programa formativo
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-blue-50/70 text-blue-950 uppercase text-[10px] font-bold border-b border-blue-100">
                    <tr>
                      <th className="py-2.5 px-3">Código & Programa</th>
                      <th className="py-2.5 px-3">Docente & Especialidad</th>
                      <th className="py-2.5 px-3 text-center">Modalidad & LMS</th>
                      <th className="py-2.5 px-3 text-center">Carga Horaria (T/P)</th>
                      <th className="py-2.5 px-3 text-center">Costo Docente / hr</th>
                      <th className="py-2.5 px-3 text-center">Régimen SAR</th>
                      <th className="py-2.5 px-3 text-center">Estado Académico</th>
                      <th className="py-2.5 px-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {proyectosFiltrados.map((p) => {
                      const horasT = p.horasTeoricas || Math.round((p.horasClase || 0) * 0.4);
                      const horasP = p.horasPracticas || Math.round((p.horasClase || 0) * 0.6);
                      const esAcreditado = p.cumpleAcreditacionSAR || p.tipoProyecto === 'Formación académica acreditada (ej. convenios universitarios)' || p.tipoProyecto === 'DIPLOMADO';

                      return (
                        <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                          
                          {/* Código & Programa */}
                          <td className="py-3 px-3 max-w-xs">
                            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                              <span className="text-[9px] font-mono font-black text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                                #{String(p.numeroCorrelativo || p.id).padStart(3, '0')}
                              </span>
                              <span className="text-[9px] font-mono font-extrabold uppercase px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-300 rounded">
                                {p.codigoPrograma || `SUM-2026-${String(p.numeroCorrelativo || p.id).padStart(3, '0')}`}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                                {p.tipoProyecto}
                              </span>
                              {(p.fechaHoraGrabacion || p.horaCreacion || p.fechaCreacion) && (
                                <span className="text-[9px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1" title={p.fechaHoraGrabacion ? `Grabado automáticamente el: ${p.fechaHoraGrabacion}` : 'Hora de creación automática'}>
                                  <Clock className="w-2.5 h-2.5 text-emerald-600" />
                                  <span>{p.fechaHoraGrabacion || p.horaCreacion || new Date(p.fechaCreacion!).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                                </span>
                              )}
                            </div>
                            <div className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer text-xs" onClick={() => onVerDetalle(p)}>
                              {p.nombreProyecto}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap text-[10px]">
                              <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                📌 {p.seccion || 'Sección A'}
                              </span>
                              <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                🗓️ {p.diasClase || 'Lunes, Miércoles y Viernes'}
                              </span>
                              <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                                ⏰ {p.horario || '06:00 PM - 08:00 PM'}
                              </span>
                            </div>
                            {p.objetivoGeneral && (
                              <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5" title={p.objetivoGeneral}>
                                {p.objetivoGeneral}
                              </p>
                            )}
                          </td>

                          {/* Docente & Especialidad */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <div>
                                <span className="font-bold text-slate-800 block">{p.nombreDocente}</span>
                                <span className="text-[10px] text-slate-500 block truncate max-w-[140px]">
                                  {p.docenteEspecialidad || 'Especialista en Capacitación'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Modalidad & LMS */}
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                                {p.modalidad || 'Virtual Sincrónica'}
                              </span>
                              <span className="text-[9px] text-slate-500 mt-0.5 truncate max-w-[120px]">
                                {p.plataformaLMS || 'Zoom Pro'}
                              </span>
                            </div>
                          </td>

                          {/* Carga Horaria (T/P) */}
                          <td className="py-3 px-3 text-center font-mono">
                            <div className="font-bold text-slate-900 text-xs">
                              {p.horasClase} hrs
                            </div>
                            <div className="text-[9px] text-slate-500">
                              {horasT}h T / {horasP}h P
                            </div>
                          </td>

                          {/* Costo Docente / hr */}
                          <td className="py-3 px-3 text-center font-mono">
                            <span className="font-bold text-slate-800 block text-xs">
                              {formatearMoneda(p.tarifaHoraDocente || 200, moneda)}/hr
                            </span>
                            <span className="text-[9px] text-slate-500 block">
                              Total: {formatearMoneda(p.costoDocenteCalculado, moneda)}
                            </span>
                          </td>

                          {/* Régimen SAR */}
                          <td className="py-3 px-3 text-center">
                            {esAcreditado ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300" title="Exento de ISV por acreditación y convenio">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                Exento 0%
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300" title="Grava 15% ISV (Servicio no acreditado)">
                                <ShieldAlert className="w-3 h-3 text-amber-600" />
                                Grava 15%
                              </span>
                            )}
                          </td>

                          {/* Estado & Nivel de Flujo */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <WorkflowStatusBadge 
                                proyecto={p} 
                                onClick={onAbrirWorkflowStatusModal ? () => onAbrirWorkflowStatusModal(p.id) : undefined} 
                              />
                              
                              {/* Registro formal de la decisión (SÍ / NO) */}
                              {p.decisionPlazoVenta === 'Si' && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300" title={p.fechaRegistroDecision ? `Decisión SÍ registrada el ${p.fechaRegistroDecision} ${p.horaRegistroDecision || ''}` : 'Proceso en curso'}>
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                  <span>Decisión: SÍ (Continúa)</span>
                                </span>
                              )}
                              {(p.decisionPlazoVenta === 'No' || p.seLlevoACabo === 'No se llevó a cabo') && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300" title={p.fechaRegistroDecision ? `Cerrado el ${p.fechaRegistroDecision} ${p.horaRegistroDecision || ''}` : 'Cerrado sin ejecución'}>
                                  <XCircle className="w-2.5 h-2.5 text-rose-600" />
                                  <span>Decisión: NO (Cerrado)</span>
                                </span>
                              )}

                              <span className="text-[9px] text-slate-500 font-mono">
                                Estado: {p.seLlevoACabo}
                              </span>

                              {/* Medidor de Madurez Curricular & Checklist */}
                              {(() => {
                                const madurez = evaluarMadurezCurricular(p);
                                return (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setProyectoMadurezModal(p);
                                      setMadurezChecklistModalAbierto(true);
                                    }}
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black border transition-all cursor-pointer hover:scale-105 ${
                                      madurez.score >= 85
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                        : madurez.score >= 60
                                        ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                        : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                                    }`}
                                    title={`Madurez Curricular: ${madurez.score}%. Clic para abrir el Checklist de Entrega Académica.`}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                    <span>Madurez: {madurez.score}%</span>
                                  </button>
                                );
                              })()}
                            </div>
                          </td>

                          {/* Acciones */}
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setProyectoEditando(p)}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
                                title="Edición de parámetros académicos"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span className="hidden sm:inline">Editar</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setProyectoSyllabusModal(p);
                                  setSyllabusModalAbierto(true);
                                }}
                                className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
                                title="Generar e imprimir Sílabo Oficial en PDF con membrete institucional"
                              >
                                <Printer className="w-3 h-3 text-purple-600" />
                                <span className="hidden sm:inline">PDF</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setProyectoDuplicar(p);
                                  setDuplicateModalAbierto(true);
                                }}
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
                                title="Duplicar programa educativo (crear nueva cohorte/sección)"
                              >
                                <Copy className="w-3 h-3 text-amber-700" />
                                <span className="hidden sm:inline">Clonar</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setProgramaSyllabusSeleccionado(p);
                                  setSubPestana('syllabus');
                                }}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
                                title="Ver Syllabus"
                              >
                                <FileText className="w-3 h-3" />
                                <span className="hidden sm:inline">Syllabus</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onVerDetalle(p)}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                                title="Ficha completa"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VISTA 2: MATRIZ DE CARGA DOCENTE & COSTO PEDAGÓGICO */}
      {subPestana === 'docentes' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Matriz de Carga Horaria & Honorarios Docentes ({statsDocentes.length} Instructores)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Control de asignación horaria, honorarios totales acumulados, rendimiento NPS y valor pedagógico por instructor.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSubPestana('historial_docente')}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  <span>Ver Historial de Rendimiento & Feedback</span>
                </button>
                <div className="text-right pl-3 border-l border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Total Horas Impartidas</span>
                  <span className="text-lg font-black text-indigo-700 font-mono">{totalHorasClase} Horas Académicas</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {statsDocentes.map((doc, idx) => {
                const costoPromedioHora = doc.totalHoras > 0 ? (doc.costoAcumulado / doc.totalHoras) : 200;
                const valorGeneradoPorHora = doc.totalHoras > 0 ? (doc.ingresoGenerado / doc.totalHoras) : 0;
                
                // Nivel de carga horaria
                const nivelCarga = doc.totalHoras >= 40 ? 'Alta' : doc.totalHoras >= 20 ? 'Óptima' : 'Ligera';
                const badgeCargaColor = doc.totalHoras >= 40 
                  ? 'bg-amber-100 text-amber-800 border-amber-200' 
                  : doc.totalHoras >= 20 
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                  : 'bg-blue-100 text-blue-800 border-blue-200';

                return (
                  <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-indigo-300 transition-all hover:shadow-xs">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="font-black text-slate-900 text-sm block">{doc.nombre}</span>
                        <span className="text-[11px] text-slate-500 font-medium block">{doc.especialidad}</span>
                      </div>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${badgeCargaColor}`}>
                        Carga {nivelCarga}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 py-2 border-y border-slate-200/80 my-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Carga Asignada</span>
                        <span className="font-mono font-bold text-slate-800 text-sm">{doc.totalHoras} hrs</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Programas</span>
                        <span className="font-mono font-bold text-slate-800 text-sm">{doc.programas.length} Cursos</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Honorarios Totales</span>
                        <span className="font-mono font-bold text-rose-700 text-xs">{formatearMoneda(doc.costoAcumulado, moneda)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Valor Generado/hr</span>
                        <span className="font-mono font-bold text-emerald-700 text-xs">{formatearMoneda(valorGeneradoPorHora, moneda)}/h</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <div className="flex items-center gap-1 text-amber-600 font-bold text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>NPS: {doc.calificacionNPS.toFixed(1)} / 5.0</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSubPestana('historial_docente')}
                        className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1 transition-colors"
                      >
                        <FileText className="w-3 h-3 text-indigo-600" />
                        <span>Expediente & CV</span>
                      </button>
                    </div>

                    {/* Lista rápida de cursos asignados */}
                    <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cursos Asignados:</span>
                      {doc.programas.map((p) => (
                        <div key={p.id} className="flex items-center justify-between text-slate-700 hover:text-blue-600 cursor-pointer" onClick={() => onVerDetalle(p)}>
                          <span className="truncate max-w-[180px] font-medium">• {p.nombreProyecto}</span>
                          <span className="font-mono text-[10px] text-slate-500">{p.horasClase}h</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VISTA: DISTRIBUCIÓN DE CARGA ACADÉMICA & SIMULADOR DE NUEVOS PROYECTOS */}
      {subPestana === 'carga_academica' && (
        <AcademicWorkloadDistributionView
          proyectos={proyectos}
          moneda={moneda}
          onGuardarProyecto={onGuardarProyecto}
          onNuevoProyecto={onNuevoProyecto}
          onVerDetalle={onVerDetalle}
        />
      )}

      {/* VISTA: HISTORIAL DE RENDIMIENTO DOCENTE & FEEDBACK POR PROYECTO */}
      {subPestana === 'historial_docente' && (
        <AcademicFacultyPerformanceHistoryView
          proyectos={proyectos}
          moneda={moneda}
          onGuardarProyecto={onGuardarProyecto}
          onVerDetalle={onVerDetalle}
        />
      )}

      {/* VISTA 3: AUDITOR & SEMÁFORO DE ACREDITACIÓN SAR */}
      {subPestana === 'acreditacion' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Auditoría Curricular y Criterio de Exención Fiscal (SAR Honduras)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-3xl">
                  Según la Ley del Impuesto Sobre Ventas del SAR, la <strong>Formación Académica Acreditada</strong> bajo convenios con centros de educación superior está <strong>exenta de 15% ISV</strong>. Si el programa no reúne los 4 pilares, debe tributar y trasladar el 15% ISV al SAR.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-right">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Programas Exentos</span>
                  <span className="text-lg font-black text-emerald-700 font-mono">{programasAcreditados} de {proyectos.length}</span>
                </div>
              </div>
            </div>

            {/* Los 4 Pilares de Acreditación SAR */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 my-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-extrabold text-blue-700 uppercase block">1. Convenio Institucional</span>
                <p className="text-xs font-medium text-slate-800 mt-1">Convenio formal vigente con Universidad o Colegio Profesional.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-extrabold text-indigo-700 uppercase block">2. Horas Mínimas</span>
                <p className="text-xs font-medium text-slate-800 mt-1">Carga curricular de al menos 20 a 30 horas académicas formales.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-extrabold text-amber-700 uppercase block">3. Evaluación Formal</span>
                <p className="text-xs font-medium text-slate-800 mt-1">Sistema de rúbrica, asistencia y nota mínima de aprobación.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-extrabold text-emerald-700 uppercase block">4. Syllabus Aprobado</span>
                <p className="text-xs font-medium text-slate-800 mt-1">Plan de estudio con módulos y competencias avaladas.</p>
              </div>
            </div>

            {/* Matriz de Evaluación por Programa */}
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Programa</th>
                    <th className="py-2.5 px-3 text-center">1. Convenio</th>
                    <th className="py-2.5 px-3 text-center">2. Carga Horaria</th>
                    <th className="py-2.5 px-3 text-center">3. Evaluación</th>
                    <th className="py-2.5 px-3 text-center">4. Syllabus</th>
                    <th className="py-2.5 px-3 text-center">Dictamen Fiscal SAR</th>
                    <th className="py-2.5 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {proyectos.map((p) => {
                    const req = p.requisitosAcreditacionSAR || {
                      tieneConvenio: p.tipoProyecto === 'Formación académica acreditada (ej. convenios universitarios)' || p.tipoProyecto === 'DIPLOMADO',
                      horasMinimas: (p.horasClase || 0) >= 20,
                      evaluacionFormal: true,
                      temarioAprobado: true,
                    };

                    const esExento = req.tieneConvenio && req.horasMinimas && req.evaluacionFormal && req.temarioAprobado;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          <div>{p.nombreProyecto}</div>
                          <span className="text-[10px] text-slate-500 font-normal">{p.tipoProyecto}</span>
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          {req.tieneConvenio ? (
                            <span className="inline-flex items-center text-emerald-700 font-bold text-[11px] gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Sí
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-rose-600 font-bold text-[11px] gap-1">
                              <AlertCircle className="w-3.5 h-3.5" /> No
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-center font-mono">
                          {req.horasMinimas ? (
                            <span className="text-emerald-700 font-bold text-[11px]">
                              ✅ {p.horasClase} hrs
                            </span>
                          ) : (
                            <span className="text-amber-700 font-bold text-[11px]">
                              ⚠️ {p.horasClase} hrs (&lt;20h)
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          {req.evaluacionFormal ? (
                            <span className="text-emerald-700 font-bold text-[11px]">✅ Aprobado</span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Pendiente</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          {req.temarioAprobado ? (
                            <span className="text-emerald-700 font-bold text-[11px]">✅ Validado</span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Sin syllabus</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          {esExento ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              Exento 0% ISV
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <ShieldAlert className="w-3 h-3 text-amber-600" />
                              Grava 15% ISV (SAR)
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setProyectoEditando(p)}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[11px] font-bold"
                          >
                            Auditar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 4: CRONOGRAMA ACADÉMICO & APERTURAS */}
      {subPestana === 'cronograma' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-amber-600" />
                  Cronograma & Calendario de Aperturas Académicas
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Planificación temporal de fechas de inicio, fechas de corte de matrícula y estado operativo.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {proyectos.map((p) => {
                return (
                  <div key={p.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:shadow-xs transition-all">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                        {p.codigoPrograma || `ACAD-2026-0${p.id}`}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.seLlevoACabo === 'Sí'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.seLlevoACabo === 'En curso'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.seLlevoACabo}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-xs mb-1 hover:text-blue-600 cursor-pointer" onClick={() => onVerDetalle(p)}>
                      {p.nombreProyecto}
                    </h4>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mb-3">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      <span>{p.nombreDocente}</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="text-slate-500 text-[11px] flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-blue-500" /> Fecha de Inicio:
                        </span>
                        <span className="font-mono font-bold text-slate-900 text-[11px]">
                          {p.fechaProgramacion || 'Pendiente'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="text-slate-500 text-[11px] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-500" /> Carga Total:
                        </span>
                        <span className="font-mono font-bold text-slate-900 text-[11px]">
                          {p.horasClase} Horas
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="text-slate-500 text-[11px] flex items-center gap-1">
                          <Laptop className="w-3 h-3 text-purple-500" /> Modalidad:
                        </span>
                        <span className="font-semibold text-slate-900 text-[11px]">
                          {p.modalidad || 'Virtual Sincrónica'}
                        </span>
                      </div>
                      
                      {/* Sección, Horario y Días en Cronograma */}
                      <div className="pt-1.5 border-t border-slate-100 space-y-1 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Sección:</span>
                          <span className="font-semibold text-blue-700">{p.seccion || 'Sección A'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Días:</span>
                          <span className="font-medium text-slate-800">{p.diasClase || 'Lunes, Miércoles y Viernes'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Horario:</span>
                          <span className="font-mono font-semibold text-slate-800">{p.horario || '06:00 PM - 08:00 PM'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setProgramaSyllabusSeleccionado(p);
                          setSubPestana('syllabus');
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                      >
                        Ver Syllabus & Plan de Estudio <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VISTA 5: FICHA CURRICULAR & PLAN DE ESTUDIO (SYLLABUS) */}
      {subPestana === 'syllabus' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Selector lateral de programas */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs h-fit space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Seleccionar Programa ({proyectos.length})
            </h3>
            <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
              {proyectos.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProgramaSyllabusSeleccionado(p)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs ${
                    programaSyllabusSeleccionado?.id === p.id
                      ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-xs font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-[9px] font-mono uppercase px-1 rounded bg-slate-200/80 text-slate-800">
                      {p.codigoPrograma || `ACAD-2026-0${p.id}`}
                    </span>
                    <span className="text-[10px] text-slate-500">{p.horasClase}h</span>
                  </div>
                  <div className="truncate">{p.nombreProyecto}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Ficha técnica del Syllabus seleccionado */}
          {programaSyllabusSeleccionado ? (
            <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 rounded">
                      {programaSyllabusSeleccionado.codigoPrograma || `ACAD-2026-0${programaSyllabusSeleccionado.id}`}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-800 rounded">
                      {programaSyllabusSeleccionado.tipoProyecto}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                      Nivel {programaSyllabusSeleccionado.nivel}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">
                    {programaSyllabusSeleccionado.nombreProyecto}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    {programaSyllabusSeleccionado.objetivoGeneral || 'Programa de formación técnica y ejecutiva orientada al desarrollo de competencias prácticas.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setProyectoSyllabusModal(programaSyllabusSeleccionado);
                      setSyllabusModalAbierto(true);
                    }}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer transition-all"
                    title="Generar y previsualizar documento imprimible del Sílabo Oficial en PDF con membrete institucional"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Sílabo Oficial PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProyectoMadurezModal(programaSyllabusSeleccionado);
                      setMadurezChecklistModalAbierto(true);
                    }}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-lg flex items-center gap-1.5 shrink-0 cursor-pointer transition-all"
                    title="Abrir checklist de madurez curricular previa al lanzamiento comercial"
                  >
                    <CheckSquare2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Checklist Entrega</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProyectoEditando(programaSyllabusSeleccionado)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shrink-0 cursor-pointer transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                </div>
              </div>

              {/* Parámetros Académicos Clave */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block">Docente Titular</span>
                  <span className="text-xs font-bold text-slate-900 block mt-0.5 truncate">{programaSyllabusSeleccionado.nombreDocente}</span>
                  <span className="text-[10px] text-slate-500 block truncate">{programaSyllabusSeleccionado.docenteEspecialidad || 'Especialista Docente'}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block">Sección / Grupo</span>
                  <span className="text-xs font-bold text-blue-700 block mt-0.5">{programaSyllabusSeleccionado.seccion || 'Sección A'}</span>
                  <span className="text-[10px] text-slate-500 block">Nivel {programaSyllabusSeleccionado.nivel}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block">Horario & Días</span>
                  <span className="text-xs font-mono font-bold text-slate-900 block mt-0.5 truncate">{programaSyllabusSeleccionado.horario || '06:00 PM - 08:00 PM'}</span>
                  <span className="text-[10px] text-slate-600 block truncate">{programaSyllabusSeleccionado.diasClase || 'Lunes, Miércoles y Viernes'}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block">Modalidad & Aula</span>
                  <span className="text-xs font-bold text-slate-900 block mt-0.5">{programaSyllabusSeleccionado.modalidad || 'Virtual Sincrónica'}</span>
                  <span className="text-[10px] text-slate-500 block truncate">{programaSyllabusSeleccionado.plataformaLMS || 'Zoom Pro'}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block">Carga Horaria</span>
                  <span className="text-xs font-bold text-slate-900 block mt-0.5">{programaSyllabusSeleccionado.horasClase} Horas Totales</span>
                  <span className="text-[10px] text-slate-500 block">
                    {programaSyllabusSeleccionado.horasTeoricas || Math.round((programaSyllabusSeleccionado.horasClase || 0) * 0.4)}h Teor / {programaSyllabusSeleccionado.horasPracticas || Math.round((programaSyllabusSeleccionado.horasClase || 0) * 0.6)}h Práct
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block">Certificación</span>
                  <span className="text-xs font-bold text-slate-900 block mt-0.5 truncate">{programaSyllabusSeleccionado.tipoCertificacion || 'Diploma de Aprobación'}</span>
                  <span className="text-[10px] text-emerald-700 font-semibold block truncate">{programaSyllabusSeleccionado.convenioUniversitario || 'SUMMIT Academy'}</span>
                </div>
              </div>

              {/* Metodología Pedagógica & Parámetros Curriculares */}
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/80 pb-2">
                  <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Metodología de Impartición & Planificación Curricular
                  </span>
                  
                  {/* Estado de Aprobación Académica del Syllabus */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-600">Estado Syllabus:</span>
                    <select
                      value={programaSyllabusSeleccionado.estadoSyllabus || 'Aprobado por Dirección'}
                      onChange={(e) => {
                        const nuevoEstado = e.target.value as any;
                        const actualizado = {
                          ...programaSyllabusSeleccionado,
                          estadoSyllabus: nuevoEstado
                        };
                        onGuardarProyecto(actualizado);
                        setProgramaSyllabusSeleccionado(actualizado);
                      }}
                      className="text-[10px] font-bold px-2 py-1 bg-white border border-emerald-300 rounded-lg text-emerald-900"
                    >
                      <option value="En Elaboración">✏️ En Elaboración</option>
                      <option value="En Revisión Académica">🔍 En Revisión Académica</option>
                      <option value="Aprobado por Dirección">✓ Aprobado por Dirección</option>
                    </select>
                  </div>
                </div>

                {/* Métricas de temas y horas */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Cantidad de Temas</span>
                    <div className="text-sm font-black text-slate-800 font-mono mt-0.5">
                      {programaSyllabusSeleccionado.cantidadTemas || 4} temas / módulos
                    </div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Horas Clase por Tema</span>
                    <div className="text-sm font-black text-emerald-700 font-mono mt-0.5">
                      {programaSyllabusSeleccionado.horasClasePorTema || (programaSyllabusSeleccionado.horasClase ? Math.max(1, Math.round(programaSyllabusSeleccionado.horasClase / (programaSyllabusSeleccionado.cantidadTemas || 4))) : (programaSyllabusSeleccionado.nivel === 'Básico' ? 3 : 5))} hrs/tema
                    </div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-300 bg-emerald-50/40">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase">Total Horas Curso</span>
                    <div className="text-sm font-black text-emerald-950 font-mono mt-0.5">
                      {programaSyllabusSeleccionado.horasClase} horas totales
                    </div>
                  </div>
                </div>

                {/* Metodología Pedagógica */}
                <div className="bg-white p-3 rounded-lg border border-emerald-200/80">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    🎯 Metodología Pedagógica
                  </span>
                  <p className="text-xs font-semibold text-slate-800">
                    {programaSyllabusSeleccionado.metodologia || 'Aprendizaje Basado en Proyectos (ABP) & Casos Prácticos Aplicados'}
                  </p>
                </div>

                {/* Documento de Planificación Curricular PDF */}
                {programaSyllabusSeleccionado.planificacionPdf && (
                  <div className="bg-white p-3 rounded-lg border border-rose-200 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate">
                          {programaSyllabusSeleccionado.planificacionPdf.nombreArchivo}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Documento Oficial de Planificación Curricular {programaSyllabusSeleccionado.planificacionPdf.tamanoKb ? `• ${programaSyllabusSeleccionado.planificacionPdf.tamanoKb} KB` : ''}
                        </div>
                      </div>
                    </div>
                    <a
                      href={programaSyllabusSeleccionado.planificacionPdf.dataUrl}
                      download={programaSyllabusSeleccionado.planificacionPdf.nombreArchivo}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar PDF</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Temario y Módulos */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-600" />
                  Estructura Temática y Módulos del Curso
                </span>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-medium">
                  {programaSyllabusSeleccionado.temarioResumen || 'Módulo 1: Fundamentos y Conceptos Clave | Módulo 2: Herramientas y Casos Prácticos | Módulo 3: Proyecto Final Integrador'}
                </div>
              </div>

              {/* Competencias Clave */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-600" />
                  Competencias Profesionales a Desarrollar
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(programaSyllabusSeleccionado.competenciasClave && programaSyllabusSeleccionado.competenciasClave.length > 0) ? (
                    programaSyllabusSeleccionado.competenciasClave.map((c, i) => (
                      <span key={i} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
                        ✓ {c}
                      </span>
                    ))
                  ) : (
                    <>
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
                        ✓ Aplicación de metodologías técnicas
                      </span>
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
                        ✓ Resolución de casos reales de negocio
                      </span>
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
                        ✓ Dominio de herramientas especializadas
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 bg-white p-8 text-center text-slate-400 rounded-xl border border-slate-200">
              Seleccione un programa del catálogo lateral para visualizar su Syllabus completo.
            </div>
          )}
        </div>
      )}

      {/* VISTA 6: RÚBRICAS DE EVALUACIÓN & CRITERIOS DE APROBACIÓN */}
      {subPestana === 'evaluacion' && (
        <AcademicEvaluationRubricView
          proyectos={proyectos}
          moneda={moneda}
          onGuardarProyecto={onGuardarProyecto}
        />
      )}

      {/* VISTA 7: AULAS VIRTUALES & RECURSOS DIDÁCTICOS */}
      {subPestana === 'recursos' && (
        <AcademicVirtualResourcesView
          proyectos={proyectos}
          moneda={moneda}
          onGuardarProyecto={onGuardarProyecto}
        />
      )}

      {/* VISTA 8: CERTIFICACIÓN & EMISIÓN DE DIPLOMAS (QR) */}
      {subPestana === 'certificacion' && (
        <AcademicCertificatesView
          proyectos={proyectos}
          moneda={moneda}
          onGuardarProyecto={onGuardarProyecto}
        />
      )}

      {/* VISTA: CALENDARIO GENERAL & CARGA DOCENTE (ANTI-SOLAPAMIENTOS) */}
      {subPestana === 'calendario_docente' && (
        <AcademicMasterFacultyCalendarView
          proyectos={proyectos}
          moneda={moneda}
          onGuardarProyecto={onGuardarProyecto}
          onVerDetalle={onVerDetalle}
        />
      )}

      {/* VISTA: CALENDARIO DE APERTURAS & CONTROL DE INICIOS */}
      {subPestana === 'calendario_aperturas' && (
        <AcademicScheduleCalendarView
          proyectos={proyectos}
          onSeleccionarProyecto={(p) => onVerDetalle(p)}
          onEditarProyecto={(p) => setProyectoEditando(p)}
        />
      )}

      {/* VISTA 9: CRONOGRAMA & PLAN DE SESIONES CLASE POR CLASE */}
      {subPestana === 'cronograma' && (
        <AcademicSessionsScheduleView
          proyectos={proyectos}
          moneda={moneda}
          onGuardarProyecto={onGuardarProyecto}
        />
      )}

      {/* VISTA 10: LIBRO DE CALIFICACIONES & ACTAS OFICIALES (GRADEBOOK) */}
      {subPestana === 'gradebook' && (
        <AcademicGradebookView
          proyectos={proyectos}
          moneda={moneda}
          onGuardarProyecto={onGuardarProyecto}
        />
      )}

      {/* VISTA 11: CONTROL DE ASISTENCIA & ALERTA TEMPRANA */}
      {subPestana === 'asistencia' && (
        <AcademicAttendanceView
          proyectos={proyectos}
          moneda={moneda}
          onGuardarProyecto={onGuardarProyecto}
        />
      )}

      {/* VISTA 12: EVALUACIÓN DOCENTE & NPS ACADÉMICO */}
      {subPestana === 'docente_nps' && (
        <AcademicFacultyEvaluationView
          proyectos={proyectos}
          moneda={moneda}
          onGuardarProyecto={onGuardarProyecto}
        />
      )}

      {/* VISTA 13: CONVENIOS UNIVERSITARIOS & BANCO DE PROYECTOS */}
      {subPestana === 'convenios_capstones' && (
        <AcademicAgreementsAndCapstonesView
          proyectos={proyectos}
          moneda={moneda}
          onGuardarProyecto={onGuardarProyecto}
        />
      )}

      {/* VISTA 14: AFORO PEDAGÓGICO & PRERREQUISITOS */}
      {subPestana === 'aforo_requisitos' && (
        <AcademicCapacityPrerequisitesView
          proyectos={proyectos}
          moneda={moneda}
          onGuardarProyecto={onGuardarProyecto}
        />
      )}

      {/* VISTA 15: MAPA DE CALOR DE RIESGO ACADÉMICO (HORAS EXCESIVAS VS MÁRGENES COMPRIMIDOS) */}
      {subPestana === 'mapa_calor_riesgo' && (
        <AcademicRiskHeatmapView
          proyectos={proyectos}
          moneda={moneda}
          onEditarProyecto={onEditarProyecto}
          onVerDetalle={onVerDetalle}
          onGuardarProyecto={onGuardarProyecto}
        />
      )}

      {/* VISTA 16: EXPEDIENTE FISCAL DOCENTE & RETENCIÓN SAR-272 */}
      {subPestana === 'expediente_sar' && (
        <AcademicDocenteExpedienteSARView
          proyectos={proyectos}
          moneda={moneda}
          onGuardarProyecto={onGuardarProyecto}
        />
      )}

      {/* VISTA 17: AUDITORÍA DE ACREDITACIONES, CONVENIOS & EXENCIÓN ISV 15% */}
      {subPestana === 'acreditacion_sar' && (
        <AcademicAcreditacionConveniosSARView
          proyectos={proyectos}
          moneda={moneda}
          onGuardarProyecto={onGuardarProyecto}
        />
      )}

      {/* VISTA 18: MATRIZ DE RENTABILIDAD DOCENTE & SIMULADOR DE DESERCIÓN / BREAK-EVEN */}
      {subPestana === 'roi_desercion' && (
        <AcademicDocenteRoiDesercionView
          proyectos={proyectos}
          moneda={moneda}
          onGuardarProyecto={onGuardarProyecto}
        />
      )}


      {/* Modal de Edición Rápida y Curricular Académica */}
      {proyectoEditando && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="bg-blue-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-300" />
                <h3 className="font-bold text-sm">
                  Gestión Curricular y Académica - SUMMIT
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setProyectoEditando(null)}
                className="text-blue-200 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarCambiosAcademicos} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Código y Nombre */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código Curricular
                  </label>
                  <input
                    type="text"
                    value={proyectoEditando.codigoPrograma || `ACAD-2026-0${proyectoEditando.id}`}
                    onChange={(e) => setProyectoEditando({ ...proyectoEditando, codigoPrograma: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre del Programa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={proyectoEditando.nombreProyecto}
                    onChange={(e) => setProyectoEditando({ ...proyectoEditando, nombreProyecto: e.target.value })}
                    required
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>

              {/* Objetivo General */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Objetivo General / Competencias Pedagógicas
                </label>
                <textarea
                  rows={2}
                  value={proyectoEditando.objetivoGeneral || ''}
                  onChange={(e) => setProyectoEditando({ ...proyectoEditando, objetivoGeneral: e.target.value })}
                  placeholder="Describa el objetivo pedagógico del programa..."
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Docente, Especialidad y Calificación */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Docente Asignado
                  </label>
                  <input
                    type="text"
                    value={proyectoEditando.nombreDocente}
                    onChange={(e) => setProyectoEditando({ ...proyectoEditando, nombreDocente: e.target.value })}
                    required
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Especialidad Docente
                  </label>
                  <input
                    type="text"
                    value={proyectoEditando.docenteEspecialidad || ''}
                    onChange={(e) => setProyectoEditando({ ...proyectoEditando, docenteEspecialidad: e.target.value })}
                    placeholder="Ej. Finanzas & Power BI"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Evaluación NPS Docente (1 - 5)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={proyectoEditando.docenteEvaluacionNPS || 4.8}
                    onChange={(e) => setProyectoEditando({ ...proyectoEditando, docenteEvaluacionNPS: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold text-amber-700"
                  />
                </div>
              </div>

              {/* Horas Totales, Horas Teóricas y Horas Prácticas */}
              <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-blue-950 mb-1">
                    Horas de Clase Totales
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={proyectoEditando.horasClase}
                    onChange={(e) => {
                      const total = Number(e.target.value);
                      const ht = Math.round(total * 0.4);
                      const hp = total - ht;
                      setProyectoEditando({ 
                        ...proyectoEditando, 
                        horasClase: total,
                        horasTeoricas: ht,
                        horasPracticas: hp
                      });
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-blue-300 rounded-lg font-mono font-bold text-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Horas Teóricas
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={proyectoEditando.horasTeoricas ?? Math.round((proyectoEditando.horasClase || 0) * 0.4)}
                    onChange={(e) => setProyectoEditando({ ...proyectoEditando, horasTeoricas: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Horas Prácticas / Talleres
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={proyectoEditando.horasPracticas ?? Math.round((proyectoEditando.horasClase || 0) * 0.6)}
                    onChange={(e) => setProyectoEditando({ ...proyectoEditando, horasPracticas: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Programación & Logística Académica: Sección, Horario y Días */}
              <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-600" />
                    Logística & Horario del Programa
                  </span>
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded border border-blue-300">
                    Control Curricular
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sección / Grupo
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Sección A (Noche)"
                      value={proyectoEditando.seccion || ''}
                      onChange={(e) => setProyectoEditando({ ...proyectoEditando, seccion: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                    />
                    <div className="flex flex-wrap gap-1 mt-1">
                      {['Sec. A', 'Sec. B', 'Matutina', 'Sabatina'].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setProyectoEditando({ ...proyectoEditando, seccion: sec })}
                          className="text-[9px] px-1.5 py-0.2 bg-white text-slate-600 hover:text-blue-700 hover:border-blue-400 border border-slate-200 rounded font-mono"
                        >
                          {sec}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Horario de Clase
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 06:00 PM - 08:00 PM"
                      value={proyectoEditando.horario || ''}
                      onChange={(e) => setProyectoEditando({ ...proyectoEditando, horario: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                    />
                    <div className="flex flex-wrap gap-1 mt-1">
                      {['06:00 PM - 08:00 PM', '07:00 PM - 09:00 PM', '08:00 AM - 12:00 PM'].map((hor) => (
                        <button
                          key={hor}
                          type="button"
                          onClick={() => setProyectoEditando({ ...proyectoEditando, horario: hor })}
                          className="text-[9px] px-1.5 py-0.2 bg-white text-slate-600 hover:text-blue-700 hover:border-blue-400 border border-slate-200 rounded font-mono truncate max-w-[120px]"
                          title={hor}
                        >
                          {hor}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Días de Clase
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Lunes, Miércoles y Viernes"
                      value={proyectoEditando.diasClase || ''}
                      onChange={(e) => setProyectoEditando({ ...proyectoEditando, diasClase: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                    />
                    <div className="flex flex-wrap gap-1 mt-1">
                      {['Lun, Mié y Vie', 'Mar y Jue', 'Sábados', 'Lun a Jue'].map((dia) => (
                        <button
                          key={dia}
                          type="button"
                          onClick={() => setProyectoEditando({ ...proyectoEditando, diasClase: dia === 'Lun, Mié y Vie' ? 'Lunes, Miércoles y Viernes' : dia === 'Mar y Jue' ? 'Martes y Jueves' : dia === 'Lun a Jue' ? 'Lunes a Jueves' : 'Sábados' })}
                          className="text-[9px] px-1.5 py-0.2 bg-white text-slate-600 hover:text-blue-700 hover:border-blue-400 border border-slate-200 rounded font-mono"
                        >
                          {dia}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modalidad, Plataforma LMS y Certificación */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Modalidad
                  </label>
                  <select
                    value={proyectoEditando.modalidad || 'Virtual Sincrónica'}
                    onChange={(e) => setProyectoEditando({ ...proyectoEditando, modalidad: e.target.value as any })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="Virtual Sincrónica">Virtual Sincrónica</option>
                    <option value="Presencial">Presencial</option>
                    <option value="Híbrida">Híbrida</option>
                    <option value="Asincrónica LMS">Asincrónica LMS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Plataforma / Aula
                  </label>
                  <input
                    type="text"
                    value={proyectoEditando.plataformaLMS || 'Zoom Pro'}
                    onChange={(e) => setProyectoEditando({ ...proyectoEditando, plataformaLMS: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Certificación
                  </label>
                  <select
                    value={proyectoEditando.tipoCertificacion || 'Diploma de Aprobación'}
                    onChange={(e) => setProyectoEditando({ ...proyectoEditando, tipoCertificacion: e.target.value as any })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="Diploma de Aprobación">Diploma de Aprobación</option>
                    <option value="Certificado de Participación">Certificado de Participación</option>
                    <option value="Título Acreditado Universitario">Título Acreditado Universitario</option>
                    <option value="Certificación Profesional Internacional">Certificación Profesional Internacional</option>
                  </select>
                </div>
              </div>

              {/* Temario Modular */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estructura Temática / Temario Modular (Syllabus)
                </label>
                <textarea
                  rows={2}
                  value={proyectoEditando.temarioResumen || ''}
                  onChange={(e) => setProyectoEditando({ ...proyectoEditando, temarioResumen: e.target.value })}
                  placeholder="Módulo 1: ... | Módulo 2: ... | Módulo 3: ..."
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                />
              </div>

              {/* Auditoría de Acreditación SAR */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 block flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Auditoría de Requisitos para Exención Fiscal SAR (0% ISV)
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={proyectoEditando.requisitosAcreditacionSAR?.tieneConvenio ?? false}
                      onChange={(e) => {
                        const actual = proyectoEditando.requisitosAcreditacionSAR || { tieneConvenio: false, horasMinimas: false, evaluacionFormal: true, temarioAprobado: true };
                        setProyectoEditando({
                          ...proyectoEditando,
                          requisitosAcreditacionSAR: { ...actual, tieneConvenio: e.target.checked }
                        });
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>1. Convenio Universitario Vigente</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={proyectoEditando.requisitosAcreditacionSAR?.horasMinimas ?? ((proyectoEditando.horasClase || 0) >= 20)}
                      onChange={(e) => {
                        const actual = proyectoEditando.requisitosAcreditacionSAR || { tieneConvenio: false, horasMinimas: false, evaluacionFormal: true, temarioAprobado: true };
                        setProyectoEditando({
                          ...proyectoEditando,
                          requisitosAcreditacionSAR: { ...actual, horasMinimas: e.target.checked }
                        });
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>2. Horas Mínimas Académicas (≥20h)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={proyectoEditando.requisitosAcreditacionSAR?.evaluacionFormal ?? true}
                      onChange={(e) => {
                        const actual = proyectoEditando.requisitosAcreditacionSAR || { tieneConvenio: false, horasMinimas: false, evaluacionFormal: true, temarioAprobado: true };
                        setProyectoEditando({
                          ...proyectoEditando,
                          requisitosAcreditacionSAR: { ...actual, evaluacionFormal: e.target.checked }
                        });
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>3. Sistema de Evaluación Formal</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={proyectoEditando.requisitosAcreditacionSAR?.temarioAprobado ?? true}
                      onChange={(e) => {
                        const actual = proyectoEditando.requisitosAcreditacionSAR || { tieneConvenio: false, horasMinimas: false, evaluacionFormal: true, temarioAprobado: true };
                        setProyectoEditando({
                          ...proyectoEditando,
                          requisitosAcreditacionSAR: { ...actual, temarioAprobado: e.target.checked }
                        });
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>4. Syllabus Curricular Validado</span>
                  </label>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProyectoEditando(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Guardar Datos Académicos
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 1. Modal de Generación del Sílabo Oficial en PDF con Membrete */}
      {syllabusModalAbierto && (
        <OfficialSyllabusModal
          isOpen={syllabusModalAbierto}
          onClose={() => {
            setSyllabusModalAbierto(false);
            setProyectoSyllabusModal(null);
          }}
          proyecto={proyectoSyllabusModal || programaSyllabusSeleccionado || proyectos[0] || null}
          proyectos={proyectos}
          moneda={moneda}
          onGuardarProyecto={(actualizado) => {
            onGuardarProyecto(actualizado);
            if (programaSyllabusSeleccionado?.id === actualizado.id) {
              setProgramaSyllabusSeleccionado(actualizado);
            }
          }}
          onCrearProyecto={(nuevo) => {
            onGuardarProyecto(nuevo);
            setProgramaSyllabusSeleccionado(nuevo);
            if (onNotificar) {
              onNotificar(`Nuevo programa "${nuevo.nombreProyecto}" registrado exitosamente.`);
            }
          }}
          onEliminarProyecto={(aEliminar) => {
            if (onEliminarProyecto) {
              onEliminarProyecto(aEliminar);
            }
            if (programaSyllabusSeleccionado?.id === aEliminar.id) {
              const restantes = proyectos.filter(p => p.id !== aEliminar.id);
              setProgramaSyllabusSeleccionado(restantes[0] || null);
            }
            if (onNotificar) {
              onNotificar(`Programa "${aEliminar.nombreProyecto}" eliminado del catálogo.`);
            }
          }}
          onNuevoProyecto={onNuevoProyecto}
        />
      )}

      {/* 2. Modal del Directorio & Banco de Docentes Institucional */}
      <DocenteDirectoryModal
        isOpen={docenteDirectoryModalAbierto}
        onClose={() => setDocenteDirectoryModalAbierto(false)}
        onSeleccionarDocente={(docente) => {
          // Si hay un programa seleccionado, ofrecer asignarle el docente
          if (programaSyllabusSeleccionado) {
            const actualizado = {
              ...programaSyllabusSeleccionado,
              nombreDocente: docente.nombre,
              docenteEspecialidad: docente.especialidad,
              tarifaHoraDocente: docente.tarifaHoraSugerida,
              costoDocenteCalculado: (programaSyllabusSeleccionado.horasClase || 12) * docente.tarifaHoraSugerida,
            };
            onGuardarProyecto(actualizado);
            setProgramaSyllabusSeleccionado(actualizado);
          }
          setDocenteDirectoryModalAbierto(false);
        }}
      />

      {/* 3. Modal de Checklist de Madurez Curricular y Entrega Académica */}
      {madurezChecklistModalAbierto && (
        <CurricularMadurezChecklistModal
          isOpen={madurezChecklistModalAbierto}
          onClose={() => {
            setMadurezChecklistModalAbierto(false);
            setProyectoMadurezModal(null);
          }}
          proyecto={proyectoMadurezModal || programaSyllabusSeleccionado || proyectos[0] || null}
          proyectos={proyectos}
          onGuardarProyecto={(actualizado) => {
            onGuardarProyecto(actualizado);
            if (programaSyllabusSeleccionado?.id === actualizado.id) {
              setProgramaSyllabusSeleccionado(actualizado);
            }
          }}
          onAbrirGeneradorSyllabus={(p) => {
            setProyectoSyllabusModal(p);
            setSyllabusModalAbierto(true);
          }}
        />
      )}

      {/* 4. Modal de Duplicación Rápida de Proyectos / Nuevas Cohortes */}
      {duplicateModalAbierto && (
        <DuplicateProjectModal
          isOpen={duplicateModalAbierto}
          onClose={() => {
            setDuplicateModalAbierto(false);
            setProyectoDuplicar(null);
          }}
          proyectoBase={proyectoDuplicar || programaSyllabusSeleccionado || proyectos[0] || null}
          proyectosExistentes={proyectos}
          moneda={moneda}
          onDuplicarProyecto={(nuevoProyecto) => {
            onGuardarProyecto(nuevoProyecto);
            setProgramaSyllabusSeleccionado(nuevoProyecto);
            setDuplicateModalAbierto(false);
            setProyectoDuplicar(null);
            onVerDetalle(nuevoProyecto);
          }}
        />
      )}

    </div>
  );
};
