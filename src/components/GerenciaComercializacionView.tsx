import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Users, 
  Target, 
  Calendar, 
  Share2, 
  Edit3, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  Plus, 
  Minus,
  Megaphone,
  ShoppingBag,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  Percent,
  BarChart3,
  Layers,
  Zap,
  Activity,
  ArrowRight,
  Clock,
  Sliders,
  PieChart,
  Tag,
  Rocket,
  MessageSquare,
  Send,
  Copy,
  Check,
  Star,
  Award,
  Mail,
  Phone,
  FileText,
  Building2,
  Ticket,
  UserCheck,
  Repeat,
  Trophy,
  Save,
  Handshake,
  BookOpen,
  UserX,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  KeyRound,
  Upload,
} from 'lucide-react';
import { ProyectoEducativo, Moneda, MetodoVenta, EstadoProyecto } from '../types';
import { formatearMoneda, calcularMetricasProyecto } from '../utils/calculations';
import { SummitLogo } from './SummitLogo';
import { CREDENCIALES_GERENCIAS } from '../utils/gerenciasCredenciales';
import { CommercialOnePagerView } from './commercial/CommercialOnePagerView';
import { CommercialB2BProposalsView } from './commercial/CommercialB2BProposalsView';
import { CommercialDiscountPoliciesView } from './commercial/CommercialDiscountPoliciesView';
import { CommercialAdmissionsCRMView } from './commercial/CommercialAdmissionsCRMView';
import { CommercialCrossSellingLTVView } from './commercial/CommercialCrossSellingLTVView';
import { CommercialSalesAdvisorsView } from './commercial/CommercialSalesAdvisorsView';
import { CommercialLaunchCampaignsView } from './commercial/CommercialLaunchCampaignsView';
import { 
  CommercialInstitutionalAlliancesView, 
  ConvenioInstitucional, 
  CONVENIOS_INICIALES 
} from './commercial/CommercialInstitutionalAlliancesView';
import { CommercialSalesPlaybookView } from './commercial/CommercialSalesPlaybookView';
import { CommercialLostLeadsAnalysisView } from './commercial/CommercialLostLeadsAnalysisView';
import { CommercialSalesForecastView } from './commercial/CommercialSalesForecastView';
import { CommercialPOAAlertBanner } from './commercial/CommercialPOAAlertBanner';
import { WorkflowStatusBadge } from './WorkflowStatusBadge';
import { CommercialProjectLauncherModal } from './commercial/CommercialProjectLauncherModal';
import { ControlDecisionComercialSection } from './commercial/ControlDecisionComercialSection';
import { QuickEnrollmentModal } from './commercial/QuickEnrollmentModal';
import { QuickQuoteWhatsAppModal } from './commercial/QuickQuoteWhatsAppModal';
import { QuickLeadImporterModal } from './commercial/QuickLeadImporterModal';
import { CommercialCockpitDailyView } from './commercial/CommercialCockpitDailyView';
import { QuickCommercialActionsBar } from './commercial/QuickCommercialActionsBar';
import { CommercialEmailTemplatesModal } from './commercial/CommercialEmailTemplatesModal';
import { CommercialAdvisorCommissionCalculatorModal } from './commercial/CommercialAdvisorCommissionCalculatorModal';
import { CommercialCorporateQuoteModal } from './commercial/CommercialCorporateQuoteModal';

interface GerenciaComercializacionViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onEditarProyecto: (p: ProyectoEducativo) => void;
  onVerDetalle: (p: ProyectoEducativo) => void;
  onGuardarProyecto: (p: ProyectoEducativo) => void;
  onNotificar?: (mensaje: string) => void;
  onAbrirWorkflowStatusModal?: (proyectoId?: string) => void;
}

export type MacroHubComercial = 'cockpit' | 'admisiones' | 'ventas_b2b' | 'finanzas_metas';

type TabComercial = 
  | 'cockpit'
  | 'pronostico_ventas'
  | 'pipeline' 
  | 'cac_roi' 
  | 'fases_precios' 
  | 'control_matricula' 
  | 'simulador_metas' 
  | 'encuestas_satisfaccion'
  | 'one_pager'
  | 'propuestas_b2b'
  | 'politicas_descuentos'
  | 'crm_admisiones'
  | 'cross_selling_ltv'
  | 'asesores_comisiones'
  | 'calendario_lanzamientos'
  | 'alianzas_convenios'
  | 'playbook_speeches'
  | 'analisis_lost_leads';

export const GerenciaComercializacionView: React.FC<GerenciaComercializacionViewProps> = ({
  proyectos,
  moneda,
  onEditarProyecto,
  onVerDetalle,
  onGuardarProyecto,
  onNotificar,
  onAbrirWorkflowStatusModal,
}) => {
  const [macroHubActivo, setMacroHubActivo] = useState<MacroHubComercial>('cockpit');
  const [tabActiva, setTabActiva] = useState<TabComercial>('cockpit');
  const [busqueda, setBusqueda] = useState('');
  const [filtroCanal, setFiltroCanal] = useState<string>('todos');
  const [filtroCumplimiento, setFiltroCumplimiento] = useState<string>('todos');
  const [filtroFase, setFiltroFase] = useState<string>('todos');

  // Modales de Alta Velocidad (Fast-Track)
  const [mostrarModalMatriculaRapida, setMostrarModalMatriculaRapida] = useState(false);
  const [proyectoMatriculaRapida, setProyectoMatriculaRapida] = useState<ProyectoEducativo | null>(null);

  const [mostrarModalCotizadorWhatsApp, setMostrarModalCotizadorWhatsApp] = useState(false);
  const [proyectoCotizadorWhatsApp, setProyectoCotizadorWhatsApp] = useState<ProyectoEducativo | null>(null);

  const [mostrarModalImportadorLeads, setMostrarModalImportadorLeads] = useState(false);

  const handleAbrirMatriculaRapida = (p?: ProyectoEducativo) => {
    setProyectoMatriculaRapida(p || null);
    setMostrarModalMatriculaRapida(true);
  };

  const handleAbrirCotizadorWhatsApp = (p?: ProyectoEducativo) => {
    setProyectoCotizadorWhatsApp(p || null);
    setMostrarModalCotizadorWhatsApp(true);
  };

  // Modal Central de Comercialización de Proyectos de Académica
  const [mostrarModalComercializar, setMostrarModalComercializar] = useState(false);
  const [proyectoParaComercializarId, setProyectoParaComercializarId] = useState<string | undefined>(undefined);

  // Modales de Simplificación Comercial (Correos B2B/B2C, Comisiones Asesores, Cotizador Corporativo)
  const [mostrarModalEmails, setMostrarModalEmails] = useState(false);
  const [mostrarModalComisiones, setMostrarModalComisiones] = useState(false);
  const [mostrarModalCotizadorCorporativo, setMostrarModalCotizadorCorporativo] = useState(false);

  const handleAbrirComercializarProyecto = (id?: string) => {
    setProyectoParaComercializarId(id);
    setMostrarModalComercializar(true);
  };

  // Proyecto en edición rápida comercial
  const [proyectoEditando, setProyectoEditando] = useState<ProyectoEducativo | null>(null);

  // Modal de generación y envío de encuesta de satisfacción
  const [encuestaModalProyecto, setEncuestaModalProyecto] = useState<ProyectoEducativo | null>(null);
  const [copiadoExitoso, setCopiadoExitoso] = useState(false);

  // Estado del simulador de metas comerciales (alumnos adicionales a simular)
  const [simuladorAlumnosExtra, setSimuladorAlumnosExtra] = useState<Record<string, number>>({});

  // =========================================================================
  // ESPACIOS DE REGISTRO MANUAL DIRECTO (FORMULARIOS INTERACTIVOS)
  // =========================================================================

  // 1. Registro Manual de Leads y Embudo (Pipeline)
  const [pipelineProgId, setPipelineProgId] = useState<string>(proyectos[0]?.id || '');
  const [pipelineLeads, setPipelineLeads] = useState<number>(proyectos[0]?.leadsGenerados || 40);
  const [pipelineCalificados, setPipelineCalificados] = useState<number>(proyectos[0]?.prospectosCalificados || 18);
  const [pipelineReservas, setPipelineReservas] = useState<number>(proyectos[0]?.cuposReservados || 8);
  const [pipelineInscritos, setPipelineInscritos] = useState<number>(proyectos[0]?.alumnosFinal || 8);
  const [pipelineCanal, setPipelineCanal] = useState<MetodoVenta>(proyectos[0]?.metodoVenta || 'Publicidad Paga (Ads)' as MetodoVenta);
  const [mensajePipelineExito, setMensajePipelineExito] = useState<string | null>(null);

  // 2. Registro Manual de Inversión en Pauta & Presupuesto Publicitario (CAC / ROAS)
  const [pautaProgId, setPautaProgId] = useState<string>(proyectos[0]?.id || '');
  const [pautaCanal, setPautaCanal] = useState<MetodoVenta>('Publicidad Paga (Ads)');
  const [pautaMontoLPS, setPautaMontoLPS] = useState<number>(1500);
  const [pautaLeadsEst, setPautaLeadsEst] = useState<number>(25);
  const [pautaPeriodo, setPautaPeriodo] = useState<string>('Campaña Activa');
  const [mensajePautaExito, setMensajePautaExito] = useState<string | null>(null);

  // 3. Registro Manual de Fases Comerciales y Precios Early Bird
  const [faseProgId, setFaseProgId] = useState<string>(proyectos[0]?.id || '');
  const [faseComercialSel, setFaseComercialSel] = useState<NonNullable<ProyectoEducativo['faseComercial']>>('Preventa Early Bird');
  const [faseDescPct, setFaseDescPct] = useState<number>(15);
  const [fasePrecioEB, setFasePrecioEB] = useState<number>(
    Math.round((proyectos[0]?.precioSugeridoConISV || proyectos[0]?.precioSugeridoAlumno || 2500) * 0.85)
  );
  const [faseFechaLimite, setFaseFechaLimite] = useState<string>('');
  const [mensajeFaseExito, setMensajeFaseExito] = useState<string | null>(null);

  // 4. Registro Manual de Encuestas CSAT & Testimonios de Estudiantes
  const [csatProgId, setCsatProgId] = useState<string>(proyectos[0]?.id || '');
  const [csatEstudianteNombre, setCsatEstudianteNombre] = useState<string>('');
  const [csatEmpresa, setCsatEmpresa] = useState<string>('');
  const [csatCalificacion, setCsatCalificacion] = useState<number>(5.0);
  const [csatNpsScore, setCsatNpsScore] = useState<number>(10);
  const [csatComentario, setCsatComentario] = useState<string>('');
  const [csatAutorizadoMarketing, setCsatAutorizadoMarketing] = useState<boolean>(true);
  const [mensajeCsatExito, setMensajeCsatExito] = useState<string | null>(null);

  // 5. Alianzas Institucionales & Convenios (Eje Permanente de Comercialización)
  const [convenios, setConvenios] = useState<ConvenioInstitucional[]>(CONVENIOS_INICIALES);
  const [alianzasExpandidas, setAlianzasExpandidas] = useState<boolean>(true);
  const [copiadoConvenioId, setCopiadoConvenioId] = useState<string | null>(null);

  const handleAjustarAlumnosConvenio = (id: string, incremento: number) => {
    setConvenios((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nuevos = Math.max(0, c.alumnosMatriculados + incremento);
          const valorEstimadoPorAlumno = 3200 * (1 - c.descuentoAfiliadosPct / 100);
          return {
            ...c,
            alumnosMatriculados: nuevos,
            facturadoTotalLPS: Math.round(nuevos * valorEstimadoPorAlumno),
          };
        }
        return c;
      })
    );
  };

  const handleCopiarCodigoConvenio = (id: string, codigo: string) => {
    navigator.clipboard.writeText(codigo);
    setCopiadoConvenioId(id);
    setTimeout(() => setCopiadoConvenioId(null), 2500);
  };

  // Sincronizar selección de Pipeline
  const handleCambiarProyectoPipeline = (id: string) => {
    setPipelineProgId(id);
    const p = proyectos.find((item) => item.id === id);
    if (p) {
      setPipelineLeads(p.leadsGenerados || p.alumnosProyectados * 8);
      setPipelineCalificados(p.prospectosCalificados || Math.round((p.leadsGenerados || p.alumnosProyectados * 8) * 0.45));
      setPipelineReservas(p.cuposReservados || Math.round((p.prospectosCalificados || 10) * 0.4));
      setPipelineInscritos(p.alumnosFinal || 4);
      setPipelineCanal(p.metodoVenta || 'Publicidad Paga (Ads)');
    }
  };

  // Sincronizar selección de Pauta
  const handleCambiarProyectoPauta = (id: string) => {
    setPautaProgId(id);
    const p = proyectos.find((item) => item.id === id);
    if (p) {
      setPautaMontoLPS(p.gastoPublicidad || 1500);
      setPautaCanal(p.metodoVenta || 'Publicidad Paga (Ads)');
      setPautaLeadsEst(p.leadsGenerados || 25);
    }
  };

  // Sincronizar selección de Fases & Precios
  const handleCambiarProyectoFase = (id: string) => {
    setFaseProgId(id);
    const p = proyectos.find((item) => item.id === id);
    if (p) {
      setFaseComercialSel(p.faseComercial || 'Preventa Early Bird');
      setFaseDescPct(p.descuentoPreventaPct || 15);
      const regular = p.precioSugeridoConISV || p.precioSugeridoAlumno || 2500;
      setFasePrecioEB(p.precioEarlyBird || Math.round(regular * (1 - (p.descuentoPreventaPct || 15) / 100)));
      setFaseFechaLimite(p.fechaVenta || '');
    }
  };

  // Handler: Guardar Pipeline Manual
  const handleGuardarPipelineManual = (e: React.FormEvent) => {
    e.preventDefault();
    const p = proyectos.find((item) => item.id === pipelineProgId);
    if (!p) return;

    const actualizado: ProyectoEducativo = {
      ...p,
      leadsGenerados: Math.max(0, Number(pipelineLeads)),
      prospectosCalificados: Math.max(0, Number(pipelineCalificados)),
      cuposReservados: Math.max(0, Number(pipelineReservas)),
      alumnosFinal: Math.max(4, Number(pipelineInscritos)),
      metodoVenta: pipelineCanal,
    };

    onGuardarProyecto(actualizado);
    setMensajePipelineExito(`¡Embudo del curso "${p.nombreProyecto}" actualizado exitosamente!`);
    setTimeout(() => setMensajePipelineExito(null), 3500);
  };

  // Handler: Guardar Pauta Publicitaria Manual
  const handleGuardarPautaManual = (e: React.FormEvent) => {
    e.preventDefault();
    const p = proyectos.find((item) => item.id === pautaProgId);
    if (!p) return;

    const actualizado: ProyectoEducativo = {
      ...p,
      gastoPublicidad: Math.max(0, Number(pautaMontoLPS)),
      metodoVenta: pautaCanal,
      leadsGenerados: Math.max(Number(p.leadsGenerados || 0), Number(pautaLeadsEst)),
    };

    onGuardarProyecto(actualizado);
    setMensajePautaExito(`¡Inversión de ${formatearMoneda(pautaMontoLPS, moneda)} registrada para "${p.nombreProyecto}"!`);
    setTimeout(() => setMensajePautaExito(null), 3500);
  };

  // Handler: Guardar Fases & Precios Manual
  const handleGuardarFasePreciosManual = (e: React.FormEvent) => {
    e.preventDefault();
    const p = proyectos.find((item) => item.id === faseProgId);
    if (!p) return;

    const actualizado: ProyectoEducativo = {
      ...p,
      faseComercial: faseComercialSel,
      descuentoPreventaPct: Number(faseDescPct),
      precioEarlyBird: Number(fasePrecioEB),
      fechaVenta: faseFechaLimite,
    };

    onGuardarProyecto(actualizado);
    setMensajeFaseExito(`¡Estrategia de precios y fase "${faseComercialSel}" guardada para "${p.nombreProyecto}"!`);
    setTimeout(() => setMensajeFaseExito(null), 3500);
  };

  // Handler: Guardar Encuesta CSAT y Testimonio Manual
  const handleGuardarEncuestaManual = (e: React.FormEvent) => {
    e.preventDefault();
    const p = proyectos.find((item) => item.id === csatProgId);
    if (!p || !csatEstudianteNombre.trim() || !csatComentario.trim()) return;

    const comentariosPrevios = p.encuestaSatisfaccion?.comentariosEstudiantes || [];
    const nuevoComentario = {
      id: `csat-${Date.now()}`,
      estudiante: csatEstudianteNombre.trim() + (csatEmpresa.trim() ? ` (${csatEmpresa.trim()})` : ''),
      puntuacion: Number(csatCalificacion),
      comentario: csatComentario.trim(),
      fecha: new Date().toISOString().split('T')[0],
    };

    const nuevosComentarios = [nuevoComentario, ...comentariosPrevios];
    const totalPuntos = nuevosComentarios.reduce((acc, c) => acc + c.puntuacion, 0);
    const nuevoPromedio = Number((totalPuntos / nuevosComentarios.length).toFixed(1));

    const actualizado: ProyectoEducativo = {
      ...p,
      calificacionCurso: nuevoPromedio,
      encuestaSatisfaccion: {
        estado: 'Respuestas Recibidas',
        fechaEnvio: p.encuestaSatisfaccion?.fechaEnvio || new Date().toISOString().split('T')[0],
        enlaceEncuesta: p.encuestaSatisfaccion?.enlaceEncuesta || `https://encuestas.summit.hn/evaluacion?curso=${p.codigoPrograma || p.id}`,
        totalRespuestas: nuevosComentarios.length,
        calificacionPromedio: nuevoPromedio,
        metricaCSAT: Math.round((nuevoPromedio / 5.0) * 100),
        metricaNPS: Math.round((csatNpsScore / 10) * 100),
        comentariosEstudiantes: nuevosComentarios,
      },
    };

    onGuardarProyecto(actualizado);
    setCsatEstudianteNombre('');
    setCsatEmpresa('');
    setCsatComentario('');
    setMensajeCsatExito(`¡Encuesta y testimonio de ${nuevoComentario.estudiante} registrados con éxito!`);
    setTimeout(() => setMensajeCsatExito(null), 3500);
  };

  // Handler: Eliminar Testimonio CSAT
  const handleEliminarComentarioCSAT = (proyectoId: string, comentarioId: string) => {
    const p = proyectos.find((item) => item.id === proyectoId);
    if (!p || !p.encuestaSatisfaccion?.comentariosEstudiantes) return;

    const filtrados = p.encuestaSatisfaccion.comentariosEstudiantes.filter((c) => c.id !== comentarioId);
    const totalPuntos = filtrados.reduce((acc, c) => acc + c.puntuacion, 0);
    const nuevoPromedio = filtrados.length > 0 ? Number((totalPuntos / filtrados.length).toFixed(1)) : 5.0;

    const actualizado: ProyectoEducativo = {
      ...p,
      calificacionCurso: nuevoPromedio,
      encuestaSatisfaccion: {
        ...p.encuestaSatisfaccion,
        totalRespuestas: filtrados.length,
        calificacionPromedio: nuevoPromedio,
        comentariosEstudiantes: filtrados,
      },
    };

    onGuardarProyecto(actualizado);
  };

  // Métricas consolidadas de comercialización
  const totalAlumnosProyectados = proyectos.reduce((acc, p) => acc + (p.alumnosProyectados || 0), 0);
  const totalAlumnosReales = proyectos.reduce((acc, p) => acc + (p.alumnosFinal || 0), 0);
  const tasaCumplimientoGlobal = totalAlumnosProyectados > 0 
    ? (totalAlumnosReales / totalAlumnosProyectados) * 100 
    : 0;

  const totalFacturadoAlumnos = proyectos.reduce((acc, p) => acc + (p.ingresoTotalConISV || p.ingresoRealTotal), 0);
  const totalGananciaAdicionales = proyectos.reduce((acc, p) => acc + (p.gananciaAlumnosAdicionales || 0), 0);
  const totalGastoPublicidad = proyectos.reduce((acc, p) => acc + (p.gastoPublicidad || 0), 0);

  // Embudo agregado
  const totalLeads = proyectos.reduce((acc, p) => acc + (p.leadsGenerados || p.alumnosProyectados * 8), 0);
  const totalCalificados = proyectos.reduce((acc, p) => acc + (p.prospectosCalificados || Math.round((p.leadsGenerados || p.alumnosProyectados * 8) * 0.45)), 0);
  const totalReservas = proyectos.reduce((acc, p) => acc + (p.cuposReservados || Math.round((p.prospectosCalificados || p.alumnosProyectados * 4) * 0.4)), 0);
  
  const tasaConversionGlobal = totalLeads > 0 ? ((totalAlumnosReales / totalLeads) * 100) : 0;
  const cacGlobal = totalAlumnosReales > 0 ? (totalGastoPublicidad / totalAlumnosReales) : 0;
  const roasGlobal = totalGastoPublicidad > 0 ? (totalFacturadoAlumnos / totalGastoPublicidad) : 0;

  // Proyectos que alcanzaron o superaron el punto de equilibrio
  const proyectosRentables = proyectos.filter((p) => p.alumnosFinal >= p.puntoEquilibrioAlumnos).length;
  const proyectosEnRiesgoVentas = proyectos.filter((p) => p.alumnosFinal < p.puntoEquilibrioAlumnos).length;

  // Distribución por canales de venta con métricas de conversión y CAC
  const resumenCanales = useMemo(() => {
    const map: Record<string, { 
      count: number; 
      alumnos: number; 
      recaudado: number;
      gastoPublicidad: number;
      leads: number;
    }> = {};

    proyectos.forEach((p) => {
      const canal = p.metodoVenta || 'Sin definir';
      if (!map[canal]) {
        map[canal] = { count: 0, alumnos: 0, recaudado: 0, gastoPublicidad: 0, leads: 0 };
      }
      const leadsProg = p.leadsGenerados || (p.alumnosProyectados * 8);
      const gastoPub = p.gastoPublicidad || 0;
      map[canal].count += 1;
      map[canal].alumnos += p.alumnosFinal;
      map[canal].recaudado += (p.ingresoTotalConISV || p.ingresoRealTotal);
      map[canal].gastoPublicidad += gastoPub;
      map[canal].leads += leadsProg;
    });

    return Object.entries(map).map(([canal, info]) => {
      const cac = info.alumnos > 0 ? info.gastoPublicidad / info.alumnos : 0;
      const roas = info.gastoPublicidad > 0 ? info.recaudado / info.gastoPublicidad : 0;
      const conversion = info.leads > 0 ? (info.alumnos / info.leads) * 100 : 0;
      return {
        canal,
        ...info,
        cac,
        roas,
        conversion
      };
    }).sort((a, b) => b.alumnos - a.alumnos);
  }, [proyectos]);

  // Filtrado de proyectos
  const proyectosFiltrados = useMemo(() => {
    return proyectos.filter((p) => {
      const matchBusqueda = 
        p.nombreProyecto.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.nombreDocente.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.metodoVenta.toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.codigoPrograma && p.codigoPrograma.toLowerCase().includes(busqueda.toLowerCase()));

      const matchCanal = filtroCanal === 'todos' || p.metodoVenta === filtroCanal;
      const matchFase = filtroFase === 'todos' || (p.faseComercial || 'Venta Regular') === filtroFase;
      
      let matchCumplimiento = true;
      if (filtroCumplimiento === 'superado') {
        matchCumplimiento = p.alumnosFinal >= p.alumnosProyectados;
      } else if (filtroCumplimiento === 'bajo_meta') {
        matchCumplimiento = p.alumnosFinal < p.alumnosProyectados;
      } else if (filtroCumplimiento === 'bajo_equilibrio') {
        matchCumplimiento = p.alumnosFinal < p.puntoEquilibrioAlumnos;
      }

      return matchBusqueda && matchCanal && matchFase && matchCumplimiento;
    });
  }, [proyectos, busqueda, filtroCanal, filtroFase, filtroCumplimiento]);

  // Actualización rápida de alumnos (+1 / -1) con base mínima de 4
  const handleAjustarAlumnosFinales = (p: ProyectoEducativo, delta: number) => {
    const nuevoTotal = Math.max(4, p.alumnosFinal + delta);
    onGuardarProyecto({
      ...p,
      alumnosFinal: nuevoTotal,
    });
  };

  // Guardar cambios comerciales completos
  const handleGuardarCambiosComerciales = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proyectoEditando) return;
    const nuevoEstado: EstadoProyecto = 
      proyectoEditando.seLlevoACabo === 'Planificado' ? 'En proceso' : proyectoEditando.seLlevoACabo;

    const proyectoActualizado = calcularMetricasProyecto({
      ...proyectoEditando,
      seLlevoACabo: nuevoEstado,
      metodoVenta: proyectoEditando.metodoVenta || 'Redes sociales',
      calificacionCurso: Number(proyectoEditando.calificacionCurso) || 5.0,
      encuestaSatisfaccion: proyectoEditando.encuestaSatisfaccion || {
        estado: 'No Generada',
        calificacionPromedio: Number(proyectoEditando.calificacionCurso) || 5.0,
      },
      comercializacionCompletada: true,
      autorizacionComercial: true,
      fechaAutorizacionComercial: new Date().toISOString(),
      responsableComercial: 'Lic. Carlos Mendoza - Gerencia Comercial',
      etapaFlujo: 'dictamen_general',
      fechaNotificacionGeneral: new Date().toISOString(),
      alumnosFinal: Math.max(4, Number(proyectoEditando.alumnosFinal) || 4),
      alumnosProyectados: Math.max(1, Number(proyectoEditando.alumnosProyectados) || 1),
      leadsGenerados: Math.max(0, Number(proyectoEditando.leadsGenerados) || 0),
      prospectosCalificados: Math.max(0, Number(proyectoEditando.prospectosCalificados) || 0),
      cuposReservados: Math.max(0, Number(proyectoEditando.cuposReservados) || 0),
      gastoPublicidad: Math.max(0, Number(proyectoEditando.gastoPublicidad) || 0),
      precioEarlyBird: Number(proyectoEditando.precioEarlyBird) || 0,
      descuentoPreventaPct: Number(proyectoEditando.descuentoPreventaPct) || 0,
      metaVentaIngreso: Number(proyectoEditando.metaVentaIngreso) || 0,
      observaciones: proyectoEditando.observaciones || '',
    });

    onGuardarProyecto(proyectoActualizado);
    setProyectoEditando(null);
  };

  // Proyectos en proceso notificados por Gerencia Académica
  const proyectosPendientesComercial = useMemo(() => {
    return proyectos.filter(
      (p) => !p.comercializacionCompletada || p.etapaFlujo === 'comercializacion' || p.seLlevoACabo === 'Planificado'
    );
  }, [proyectos]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Banner de Identidad de Gerencia de Comercialización */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-emerald-800/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="bg-white/10 p-2 rounded-2xl border border-white/20 shadow-inner shrink-0">
              <SummitLogo variant="icon" size="md" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 rounded">
                  SUMMIT IMPULSA GLOBAL
                </span>
                <span className="text-xs text-emerald-300 font-medium">Gerencia de Comercialización & Ventas</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                Dirección Comercial y Matrícula
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-2xl">
                Alimentación y gestión comercial: embudo de conversión de leads, análisis de CAC/ROAS por canal publicitario, gestión de precios preventa Early Bird y control de inscripciones reales (Base mínima: 4).
              </p>

              {/* Líder Oficial y Cuenta Institucional (POA 2026) */}
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/90 border border-emerald-400/40 text-xs font-mono text-emerald-200 shadow-2xs">
                  <span className="text-[10px] text-emerald-300 font-sans font-semibold">Líder:</span>
                  <span className="font-bold text-white font-sans">{CREDENCIALES_GERENCIAS.comercial.lider}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/90 border border-emerald-400/40 text-xs font-mono text-emerald-200 shadow-2xs">
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] text-emerald-300 font-sans font-semibold">Correo:</span>
                  <span className="font-bold text-white select-all">{CREDENCIALES_GERENCIAS.comercial.correo}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-900/60 border border-emerald-400/30 text-xs text-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-300">POA 2026:</span>
                  <span className="font-bold font-mono text-white">L. 152,900.00</span>
                  <span className="text-[10px] text-emerald-300">(33.2% • 13 act.)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Widget de Cumplimiento Global en Cabecera */}
          <div className="flex items-center gap-3 bg-emerald-950/90 p-3 rounded-xl border border-emerald-700/60 shrink-0 self-start lg:self-center">
            <Target className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-emerald-300 uppercase font-bold block">Cumplimiento Global</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black font-mono text-white">
                  {tasaCumplimientoGlobal.toFixed(1)}%
                </span>
                <span className="text-[10px] text-emerald-300">({totalAlumnosReales}/{totalAlumnosProyectados} cupos)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Acciones Rápidas Comerciales Adaptada (Responsive & Sin Desbordamientos) */}
        <div className="mt-4 pt-3.5 border-t border-emerald-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-black tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>Operaciones Comerciales en 1 Clic</span>
            </span>
            <span className="text-xs text-emerald-200/80 hidden xl:inline">
              Acceso prioritario a matrícula, cotizaciones y activación comercial
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => handleAbrirMatriculaRapida()}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
              title="Registrar una matrícula en 30 segundos sin formularios lentos"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950 shrink-0" />
              <span>Matrícula Exprés (30s)</span>
            </button>

            <button
              type="button"
              onClick={() => handleAbrirCotizadorWhatsApp()}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors border border-emerald-500/50 cursor-pointer"
              title="Generar cotizaciones oficiales con desglose ISV SAR y compartir por WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span>WhatsApp & Cotizador</span>
            </button>

            {onAbrirWorkflowStatusModal && (
              <button
                id="btn-workflow-status-comercial"
                type="button"
                onClick={() => onAbrirWorkflowStatusModal()}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-teal-800/80 hover:bg-teal-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors border border-teal-500/40 cursor-pointer"
                title="Rastreador de Nivel, Status y Tiempos de los Proyectos"
              >
                <Layers className="w-3.5 h-3.5 text-teal-200 shrink-0" />
                <span>Nivel & Status</span>
              </button>
            )}

            <button
              id="btn-comercial-comercializar-proyecto"
              type="button"
              onClick={() => handleAbrirComercializarProyecto()}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm hover:shadow-emerald-500/20 transition-all hover:scale-[1.02] border border-emerald-300 cursor-pointer"
              title="Comercializar Proyectos elaborados por Gerencia Académica (Redes Sociales, Precios, Embudo y Difusión)"
            >
              <Rocket className="w-3.5 h-3.5 text-slate-950 stroke-[2.5] shrink-0" />
              <span>Comercializar Proyecto</span>
            </button>
          </div>
        </div>

        {/* 4 KPIs de Ventas & Alumnos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-emerald-800/60">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="flex items-center justify-between text-emerald-200 text-[11px] font-semibold">
              <span>Matrícula Real</span>
              <Users className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-emerald-300">{totalAlumnosReales}</span>
              <span className="text-xs text-emerald-200/70 font-mono">/ {totalAlumnosProyectados} meta</span>
            </div>
            <span className="text-[10px] text-emerald-300/80">Alumnos inscritos confirmados</span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="flex items-center justify-between text-emerald-200 text-[11px] font-semibold">
              <span>Recaudación Facturada</span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5 font-mono">
              {formatearMoneda(totalFacturadoAlumnos, moneda)}
            </div>
            <span className="text-[10px] text-emerald-300/80">Cobro total con ISV</span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="flex items-center justify-between text-emerald-200 text-[11px] font-semibold">
              <span>CAC Promedio</span>
              <Percent className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-300 mt-0.5 font-mono">
              {formatearMoneda(cacGlobal, moneda)}
            </div>
            <span className="text-[10px] text-emerald-300/80">Costo de adquisición x alumno</span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="flex items-center justify-between text-emerald-200 text-[11px] font-semibold">
              <span>ROAS / Retorno Pauta</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-300 mt-0.5 font-mono">
              {roasGlobal > 0 ? `${roasGlobal.toFixed(1)}x` : 'N/D'}
            </div>
            <span className="text-[10px] text-emerald-300/80">Facturado / Inversión Pauta</span>
          </div>
        </div>

        {/* Barra de Acceso Rápido para Rellenar Datos Manuales (Exclusivo Gerencia Comercial) */}
        <div className="mt-4 pt-3 border-t border-emerald-800/60 flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-black tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded shadow-xs">
              ✍️ Alimentación Manual Integral
            </span>
            <span className="text-xs text-emerald-200 font-semibold">
              Acceso directo a todos los formularios de captura y rellenado comercial:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => handleAbrirComercializarProyecto()}
              className="px-3 py-1 rounded-lg font-black border transition-all text-[11px] flex items-center gap-1.5 bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 border-emerald-300 shadow-xs hover:scale-[1.02] cursor-pointer"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>Comercializar Proyecto Académico</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('seccion-control-decision-comercial');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-2.5 py-1 rounded-lg font-bold border transition-colors text-[11px] flex items-center gap-1 bg-amber-400/90 hover:bg-amber-400 text-slate-950 border-amber-300 shadow-xs cursor-pointer"
            >
              <span>⚡ Decisión 20d Calendario</span>
            </button>
            <button
              type="button"
              onClick={() => setMostrarModalEmails(true)}
              className="px-2.5 py-1 rounded-lg font-bold border transition-colors text-[11px] flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white border-blue-400 shadow-xs cursor-pointer"
            >
              <span>📧 Correos B2B/B2C</span>
            </button>
            <button
              type="button"
              onClick={() => setMostrarModalComisiones(true)}
              className="px-2.5 py-1 rounded-lg font-bold border transition-colors text-[11px] flex items-center gap-1 bg-teal-600 hover:bg-teal-500 text-white border-teal-400 shadow-xs cursor-pointer"
            >
              <span>🧮 Comisiones Asesores</span>
            </button>
            <button
              type="button"
              onClick={() => setMostrarModalCotizadorCorporativo(true)}
              className="px-2.5 py-1 rounded-lg font-bold border transition-colors text-[11px] flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 shadow-xs cursor-pointer"
            >
              <span>🏢 Cotizador PDF SAR</span>
            </button>
            <button
              type="button"
              onClick={() => setTabActiva('pipeline')}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-colors text-[11px] flex items-center gap-1 ${
                tabActiva === 'pipeline'
                  ? 'bg-emerald-500 text-white border-emerald-400 shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
              }`}
            >
              <span>✍️ Embudo & Leads</span>
            </button>
            <button
              type="button"
              onClick={() => setTabActiva('cac_roi')}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-colors text-[11px] flex items-center gap-1 ${
                tabActiva === 'cac_roi'
                  ? 'bg-emerald-500 text-white border-emerald-400 shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
              }`}
            >
              <span>✍️ Pauta & Ads CAC</span>
            </button>
            <button
              type="button"
              onClick={() => setTabActiva('fases_precios')}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-colors text-[11px] flex items-center gap-1 ${
                tabActiva === 'fases_precios'
                  ? 'bg-emerald-500 text-white border-emerald-400 shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
              }`}
            >
              <span>✍️ Fases & Precios</span>
            </button>
            <button
              type="button"
              onClick={() => setTabActiva('control_matricula')}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-colors text-[11px] flex items-center gap-1 ${
                tabActiva === 'control_matricula'
                  ? 'bg-emerald-500 text-white border-emerald-400 shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
              }`}
            >
              <span>✍️ Matrícula Real</span>
            </button>
            <button
              type="button"
              onClick={() => setTabActiva('crm_admisiones')}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-colors text-[11px] flex items-center gap-1 ${
                tabActiva === 'crm_admisiones'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
              }`}
            >
              <span>✍️ CRM Prospectos</span>
            </button>
            <button
              type="button"
              onClick={() => setTabActiva('asesores_comisiones')}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-colors text-[11px] flex items-center gap-1 ${
                tabActiva === 'asesores_comisiones'
                  ? 'bg-teal-600 text-white border-teal-400 shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
              }`}
            >
              <span>✍️ Asesores & Metas</span>
            </button>
            <button
              type="button"
              onClick={() => setTabActiva('propuestas_b2b')}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-colors text-[11px] flex items-center gap-1 ${
                tabActiva === 'propuestas_b2b'
                  ? 'bg-amber-600 text-white border-amber-400 shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
              }`}
            >
              <span>✍️ Cotizador B2B</span>
            </button>
            <button
              type="button"
              onClick={() => setTabActiva('politicas_descuentos')}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-colors text-[11px] flex items-center gap-1 ${
                tabActiva === 'politicas_descuentos'
                  ? 'bg-orange-600 text-white border-orange-400 shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
              }`}
            >
              <span>✍️ Cupones & Becas</span>
            </button>
            <button
              type="button"
              onClick={() => setTabActiva('one_pager')}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-colors text-[11px] flex items-center gap-1 ${
                tabActiva === 'one_pager'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
              }`}
            >
              <span>✍️ Ficha & One-Pager</span>
            </button>
            <button
              type="button"
              onClick={() => setTabActiva('cross_selling_ltv')}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-colors text-[11px] flex items-center gap-1 ${
                tabActiva === 'cross_selling_ltv'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
              }`}
            >
              <span>✍️ Re-compra LTV</span>
            </button>
            <button
              type="button"
              onClick={() => setTabActiva('encuestas_satisfaccion')}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-colors text-[11px] flex items-center gap-1 ${
                tabActiva === 'encuestas_satisfaccion'
                  ? 'bg-rose-600 text-white border-rose-400 shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
              }`}
            >
              <span>✍️ Encuestas CSAT</span>
            </button>
            <button
              type="button"
              onClick={() => setTabActiva('calendario_lanzamientos')}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-colors text-[11px] flex items-center gap-1 ${
                tabActiva === 'calendario_lanzamientos'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
              }`}
            >
              <span>✍️ Roadmap Lanzamiento</span>
            </button>
            <button
              type="button"
              onClick={() => setTabActiva('alianzas_convenios')}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-colors text-[11px] flex items-center gap-1 ${
                tabActiva === 'alianzas_convenios'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
              }`}
            >
              <span>✍️ Convenios Gremios</span>
            </button>
            <button
              type="button"
              onClick={() => setTabActiva('playbook_speeches')}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-colors text-[11px] flex items-center gap-1 ${
                tabActiva === 'playbook_speeches'
                  ? 'bg-teal-600 text-white border-teal-400 shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
              }`}
            >
              <span>✍️ Speeches & Playbook</span>
            </button>
            <button
              type="button"
              onClick={() => setTabActiva('analisis_lost_leads')}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-colors text-[11px] flex items-center gap-1 ${
                tabActiva === 'analisis_lost_leads'
                  ? 'bg-rose-700 text-white border-rose-500 shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
              }`}
            >
              <span>✍️ Lost Leads</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alerta de Cumplimiento POA 2026 & Rebaja Mensual por Facturación Aprobada */}
      <CommercialPOAAlertBanner
        totalProyectos={proyectos.length}
        proyectos={proyectos}
        moneda={moneda}
        onIrAPronostico={() => setTabActiva('pronostico_ventas')}
      />

      {/* Barra Rápida de Aceleración y Simplificación Comercial en 1 Clic */}
      <QuickCommercialActionsBar
        proyectos={proyectos}
        moneda={moneda}
        onGuardarProyecto={onGuardarProyecto}
        onNotificar={onNotificar}
        onAbrirEmails={() => setMostrarModalEmails(true)}
        onAbrirComisiones={() => setMostrarModalComisiones(true)}
        onAbrirCotizadorCorporativo={() => setMostrarModalCotizadorCorporativo(true)}
      />

      {/* Bandeja de Proyectos Notificados por Gerencia Académica */}
      {proyectosPendientesComercial.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                    Aviso Académico → Comercial
                  </span>
                  <span className="text-xs font-bold text-emerald-900">
                    {proyectosPendientesComercial.length} Proyecto{proyectosPendientesComercial.length > 1 ? 's' : ''} en proceso recibido{proyectosPendientesComercial.length > 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-xs text-emerald-800 mt-1">
                  Gerencia Académica ha registrado cursos que requieren fijar su estrategia de venta, canal publicitario, precio preventa e inicio de captación.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {proyectosPendientesComercial.slice(0, 2).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProyectoEditando(p)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[150px]">{p.nombreProyecto}</span>
                  <span className="text-[10px] opacity-80">⚡ Trabajar</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sección Oficial de Gerencia de Comercialización: Control de Decisión en Plazo de 20 Días Calendario Corridos */}
      <div id="seccion-control-decision-comercial">
        <ControlDecisionComercialSection
          proyectos={proyectos}
          moneda={moneda}
          onGuardarProyecto={onGuardarProyecto}
          onVerDetalle={onVerDetalle}
          onNotificar={onNotificar}
        />
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN PERMANENTE: ALIANZAS INSTITUCIONALES & CONVENIOS GREMIALES */}
      {/* ========================================================================= */}
      {(() => {
        const conveniosActivos = convenios.filter((c) => c.estado === 'Activo Vigente');
        const totalAlumnosConvenios = convenios.reduce((acc, c) => acc + c.alumnosMatriculados, 0);
        const totalFacturadoConvenios = convenios.reduce((acc, c) => acc + c.facturadoTotalLPS, 0);
        const descuentoPromedioConvenios = convenios.length > 0 
          ? Math.round(convenios.reduce((acc, c) => acc + c.descuentoAfiliadosPct, 0) / convenios.length) 
          : 0;

        return (
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-blue-800/40 rounded-2xl p-4 text-white shadow-md">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center shrink-0 shadow-inner">
                  <Handshake className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full">
                      🤝 Eje Permanente Comercial
                    </span>
                    <span className="text-sm font-black text-white">
                      Red de Alianzas Estratégicas & Convenios Institucionales
                    </span>
                  </div>
                  <p className="text-xs text-blue-200/80 mt-0.5">
                    Acuerdos marco de captación con colegios profesionales, cámaras de comercio y corporativos afiliados.
                  </p>
                </div>
              </div>

              {/* 4 KPIs Rápidos de Alianzas */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 flex flex-col items-center">
                  <span className="text-[9px] text-blue-200 uppercase font-semibold">Convenios Activos</span>
                  <span className="text-xs font-black text-blue-300 font-mono">{conveniosActivos.length} Entidades</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 flex flex-col items-center">
                  <span className="text-[9px] text-emerald-200 uppercase font-semibold">Alumnos Afiliados</span>
                  <span className="text-xs font-black text-emerald-300 font-mono">{totalAlumnosConvenios} Matriculados</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 flex flex-col items-center">
                  <span className="text-[9px] text-amber-200 uppercase font-semibold">Facturación Alianzas</span>
                  <span className="text-xs font-black text-amber-300 font-mono">{formatearMoneda(totalFacturadoConvenios, moneda)}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 flex flex-col items-center">
                  <span className="text-[9px] text-purple-200 uppercase font-semibold">Dscto. Promedio</span>
                  <span className="text-xs font-black text-purple-300 font-mono">{descuentoPromedioConvenios}% Beca</span>
                </div>

                <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                  <button
                    type="button"
                    onClick={() => setTabActiva('alianzas_convenios')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                    title="Abrir panel completo de alianzas y convenios"
                  >
                    <span>Gestionar Alianzas</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setAlianzasExpandidas(!alianzasExpandidas)}
                    className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs transition-colors"
                    title={alianzasExpandidas ? 'Contraer vista rápida' : 'Expandir vista rápida'}
                  >
                    {alianzasExpandidas ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Tarjetas Rápidas Desplegadas */}
            {alianzasExpandidas && (
              <div className="mt-3 pt-3 border-t border-blue-900/60">
                {convenios.length === 0 ? (
                  <div className="bg-slate-900/70 border border-blue-500/30 rounded-xl p-4 text-center">
                    <p className="text-xs font-semibold text-blue-200">
                      No hay convenios institucionales ni gremiales registrados en este momento.
                    </p>
                    <p className="text-[11px] text-slate-300 mt-1 max-w-xl mx-auto">
                      En cumplimiento con la directriz del POA 2026, los convenios deben suscribirse y vincularse a la oferta curricular aprobada por la Gerencia Académica.
                    </p>
                    <button
                      type="button"
                      onClick={() => setTabActiva('alianzas_convenios')}
                      className="mt-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Registrar Convenio Institucional (POA 2026)</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    {convenios.slice(0, 3).map((conv) => (
                      <div
                        key={conv.id}
                        className="bg-slate-900/80 border border-blue-500/20 rounded-xl p-3 flex flex-col justify-between gap-2.5 hover:border-blue-400/40 transition-all"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1.5 mb-1">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                              {conv.tipo}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-mono font-bold">
                              {conv.descuentoAfiliadosPct}% OFF
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-white line-clamp-1" title={conv.nombreInstitucion}>
                            {conv.nombreInstitucion}
                          </h4>
                          <p className="text-[10px] text-slate-300 mt-0.5 line-clamp-1">
                            Contacto: {conv.contactoClave} • {conv.telefono}
                          </p>
                        </div>

                        {/* Código de Descuento Rápido y Contador */}
                        <div className="flex items-center justify-between gap-2 bg-slate-950/60 p-2 rounded-lg border border-white/5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold text-amber-300 tracking-wider">
                              {conv.codigoConvenio}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopiarCodigoConvenio(conv.id, conv.codigoConvenio)}
                              className="p-1 hover:bg-white/10 rounded text-slate-300 hover:text-white transition-colors"
                              title="Copiar código de convenio"
                            >
                              {copiadoConvenioId === conv.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>

                          {/* Control rápido de Alumnos Matriculados (+ / -) */}
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="text-[9px] text-slate-400">Alumnos:</span>
                            <button
                              type="button"
                              onClick={() => handleAjustarAlumnosConvenio(conv.id, -1)}
                              className="w-4 h-4 rounded bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center font-bold text-[10px]"
                              title="Restar 1 alumno"
                            >
                              -
                            </button>
                            <span className="font-mono font-bold text-emerald-300 text-xs px-1">
                              {conv.alumnosMatriculados}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAjustarAlumnosConvenio(conv.id, 1)}
                              className="w-4 h-4 rounded bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px]"
                              title="Sumar 1 alumno matriculado"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-blue-300/80 mt-2.5 pt-2 border-t border-blue-900/40">
                  <span>💡 Los códigos de convenio se validan en el cotizador B2B y checkout de admisiones.</span>
                  <button
                    type="button"
                    onClick={() => setTabActiva('alianzas_convenios')}
                    className="text-blue-300 hover:text-white font-bold underline transition-colors"
                  >
                    Ver todos los {convenios.length} convenios y registrar nuevo →
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Aviso de Dependencia Operativa con Gerencia Académica cuando no hay proyectos */}
      {proyectos.length === 0 && (
        <div className="bg-gradient-to-r from-amber-900/40 via-amber-950/60 to-slate-900 border-2 border-amber-500/50 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded shadow-xs">
                  POA 2026 • Dependencia Operativa
                </span>
                <h3 className="text-sm font-black text-amber-200">
                  Esperando Proyectos Académicos de Gerencia Académica (Phd. Donal Reyes)
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Toda la gestión comercial (embudo de conversión, pauta publicitaria, convenios institucionales, asesores comerciales, cotizaciones B2B y políticas de precios) depende de la oferta de proyectos formativos formulada por la Gerencia Académica.
                Al registrarse nuevos cursos en el POA 2026, las métricas, herramientas y catálogos comerciales se vincularán de forma inmediata.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Selector de Macro-Hubs de la Gerencia Comercial (Menos clics, navegación instantánea) */}
      <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 shadow-inner">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setMacroHubActivo('cockpit');
              setTabActiva('cockpit');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-black text-xs transition-all cursor-pointer ${
              macroHubActivo === 'cockpit' && tabActiva === 'cockpit'
                ? 'bg-slate-900 text-white shadow-md ring-2 ring-emerald-500/50'
                : 'bg-white hover:bg-slate-200 text-slate-800 shadow-2xs'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>⚡ Cockpit Diario</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMacroHubActivo('admisiones');
              if (tabActiva === 'cockpit') setTabActiva('crm_admisiones');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              macroHubActivo === 'admisiones'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-white hover:bg-slate-200 text-slate-700 shadow-2xs'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-300" />
            <span>🎯 Admisiones & CRM</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMacroHubActivo('ventas_b2b');
              if (tabActiva === 'cockpit') setTabActiva('fases_precios');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              macroHubActivo === 'ventas_b2b'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-white hover:bg-slate-200 text-slate-700 shadow-2xs'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-emerald-300" />
            <span>💼 Ventas, Precios & B2B</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMacroHubActivo('finanzas_metas');
              if (tabActiva === 'cockpit') setTabActiva('pronostico_ventas');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              macroHubActivo === 'finanzas_metas'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-white hover:bg-slate-200 text-slate-700 shadow-2xs'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
            <span>📈 Finanzas & Comisiones</span>
          </button>
        </div>

        <div className="flex items-center gap-2 pr-1">
          <button
            type="button"
            onClick={() => setMostrarModalImportadorLeads(true)}
            className="text-xs font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-50 border border-teal-200 shadow-2xs transition-colors cursor-pointer"
            title="Importar masivamente leads desde Excel o Google Sheets"
          >
            <Upload className="w-3 h-3 text-teal-600" />
            <span>Importar Excel</span>
          </button>

          <button
            type="button"
            onClick={() => handleAbrirComercializarProyecto()}
            className="text-xs font-black text-white flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-xs transition-all cursor-pointer"
          >
            <Rocket className="w-3 h-3 text-amber-300" />
            <span>Comercializar Curso</span>
          </button>
        </div>
      </div>

      {/* Selector de Sub-Pestañas Contextuales (o Modo Clásico) */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          onClick={() => {
            setMacroHubActivo('cockpit');
            setTabActiva('cockpit');
          }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-black text-xs transition-all whitespace-nowrap ${
            tabActiva === 'cockpit'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 border-b-0'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>⚡ Cockpit Diario</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('pipeline')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-bold text-xs transition-all whitespace-nowrap ${
            tabActiva === 'pipeline'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 border-b-0'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Embudo & Pipeline</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('cac_roi')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-bold text-xs transition-all whitespace-nowrap ${
            tabActiva === 'cac_roi'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 border-b-0'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>CAC & ROAS</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('fases_precios')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-bold text-xs transition-all whitespace-nowrap ${
            tabActiva === 'fases_precios'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 border-b-0'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Fases & Precios</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('control_matricula')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-bold text-xs transition-all whitespace-nowrap ${
            tabActiva === 'control_matricula'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 border-b-0'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Control Matrícula ({proyectos.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('simulador_metas')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-bold text-xs transition-all whitespace-nowrap ${
            tabActiva === 'simulador_metas'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 border-b-0'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Simulador Metas</span>
        </button>

        {/* 6 Nuevos Módulos Comerciales Especializados */}
        <button
          type="button"
          onClick={() => setTabActiva('one_pager')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-bold text-xs transition-all whitespace-nowrap ${
            tabActiva === 'one_pager'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'bg-white hover:bg-blue-50 text-blue-900 border border-slate-200 border-b-0'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>One-Pagers & Pitch</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('propuestas_b2b')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-bold text-xs transition-all whitespace-nowrap ${
            tabActiva === 'propuestas_b2b'
              ? 'bg-amber-700 text-white shadow-xs'
              : 'bg-white hover:bg-amber-50 text-amber-900 border border-slate-200 border-b-0'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Cotizador B2B</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('politicas_descuentos')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-bold text-xs transition-all whitespace-nowrap ${
            tabActiva === 'politicas_descuentos'
              ? 'bg-orange-700 text-white shadow-xs'
              : 'bg-white hover:bg-orange-50 text-orange-900 border border-slate-200 border-b-0'
          }`}
        >
          <Ticket className="w-3.5 h-3.5" />
          <span>Políticas & Margen</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('crm_admisiones')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-bold text-xs transition-all whitespace-nowrap ${
            tabActiva === 'crm_admisiones'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'bg-white hover:bg-purple-50 text-purple-900 border border-slate-200 border-b-0'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>CRM Admisiones</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('cross_selling_ltv')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-bold text-xs transition-all whitespace-nowrap ${
            tabActiva === 'cross_selling_ltv'
              ? 'bg-indigo-700 text-white shadow-xs'
              : 'bg-white hover:bg-indigo-50 text-indigo-900 border border-slate-200 border-b-0'
          }`}
        >
          <Repeat className="w-3.5 h-3.5" />
          <span>Re-compra & LTV</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('asesores_comisiones')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-bold text-xs transition-all whitespace-nowrap ${
            tabActiva === 'asesores_comisiones'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-white hover:bg-teal-50 text-teal-900 border border-slate-200 border-b-0'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Asesores & Comisiones</span>
        </button>

        <button
          id="tab-encuestas-satisfaccion"
          type="button"
          onClick={() => setTabActiva('encuestas_satisfaccion')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-bold text-xs transition-all whitespace-nowrap ${
            tabActiva === 'encuestas_satisfaccion'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'bg-white hover:bg-rose-50 text-rose-900 border border-slate-200 border-b-0'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Encuestas CSAT</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('calendario_lanzamientos')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-bold text-xs transition-all whitespace-nowrap ${
            tabActiva === 'calendario_lanzamientos'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white hover:bg-emerald-50 text-emerald-900 border border-slate-200 border-b-0'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span>Roadmap Lanzamiento</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('alianzas_convenios')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-bold text-xs transition-all whitespace-nowrap ${
            tabActiva === 'alianzas_convenios'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'bg-white hover:bg-blue-50 text-blue-900 border border-slate-200 border-b-0'
          }`}
        >
          <Handshake className="w-3.5 h-3.5" />
          <span>Convenios & Gremios</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('playbook_speeches')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-bold text-xs transition-all whitespace-nowrap ${
            tabActiva === 'playbook_speeches'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-white hover:bg-teal-50 text-teal-900 border border-slate-200 border-b-0'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Speeches & Playbook</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('analisis_lost_leads')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-bold text-xs transition-all whitespace-nowrap ${
            tabActiva === 'analisis_lost_leads'
              ? 'bg-rose-800 text-white shadow-xs'
              : 'bg-white hover:bg-rose-50 text-rose-950 border border-slate-200 border-b-0'
          }`}
        >
          <UserX className="w-3.5 h-3.5" />
          <span>Lost Leads & Fugas</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VISTA 0: COCKPIT DE OPERACIÓN DIARIA & ALTA VELOCIDAD */}
      {/* ========================================================================= */}
      {tabActiva === 'cockpit' && (
        <div className="animate-in fade-in duration-150">
          <CommercialCockpitDailyView
            proyectos={proyectos}
            moneda={moneda}
            onAbrirMatriculaRapida={handleAbrirMatriculaRapida}
            onAbrirCotizadorWhatsApp={handleAbrirCotizadorWhatsApp}
            onAbrirImportadorLeads={() => setMostrarModalImportadorLeads(true)}
            onAbrirComercializarProyecto={handleAbrirComercializarProyecto}
            onAjustarAlumnosFinales={handleAjustarAlumnosFinales}
            onEditarProyecto={onEditarProyecto}
            onVerDetalle={onVerDetalle}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 1: PIPELINE & EMBUDO DE CONVERSIÓN */}
      {/* ========================================================================= */}
      {tabActiva === 'pipeline' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Embudo Visual Global */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  Embudo de Conversión Integral SUMMIT (Sales Funnel)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Trazabilidad desde el primer contacto del prospecto hasta el pago de la matrícula confirmada
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Conversión Final:</span>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-black font-mono">
                  {tasaConversionGlobal.toFixed(1)}% de Leads
                </span>
              </div>
            </div>

            {/* 4 Etapas del Embudo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
              
              {/* Etapa 1: Leads / Prospectos */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-slate-400" />
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">1. Leads Generados</span>
                  <Megaphone className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-black text-slate-900 font-mono">{totalLeads}</div>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">✍️ Manual</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Interesados iniciales en anuncios, formularios y redes.</p>
                <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-600 flex justify-between items-center">
                  <span>Base de contacto (100%)</span>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('form-manual-embudo');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-[10px] font-bold text-slate-700 hover:text-emerald-700 underline"
                  >
                    ✍️ Rellenar
                  </button>
                </div>
              </div>

              {/* Etapa 2: Calificados */}
              <div className="bg-blue-50/70 rounded-xl p-4 border border-blue-200 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900">2. Calificados</span>
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-black text-blue-950 font-mono">{totalCalificados}</div>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">✍️ Manual</span>
                </div>
                <p className="text-[11px] text-blue-800/80 mt-1">Prospectos con perfil adecuado y capacidad de pago.</p>
                <div className="mt-3 pt-2 border-t border-blue-200 text-[10px] text-blue-900 flex justify-between items-center">
                  <span>Tasa: <strong className="font-mono">{totalLeads > 0 ? ((totalCalificados / totalLeads) * 100).toFixed(1) : 0}%</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('form-manual-embudo');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-[10px] font-bold text-blue-800 hover:text-blue-950 underline"
                  >
                    ✍️ Rellenar
                  </button>
                </div>
              </div>

              {/* Etapa 3: Reservas de Cupo */}
              <div className="bg-amber-50/70 rounded-xl p-4 border border-amber-200 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900">3. Cupos Reservados</span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-black text-amber-950 font-mono">{totalReservas}</div>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">✍️ Manual</span>
                </div>
                <p className="text-[11px] text-amber-800/80 mt-1">Pre-inscritos con promesa de pago o formulario lleno.</p>
                <div className="mt-3 pt-2 border-t border-amber-200 text-[10px] text-amber-900 flex justify-between items-center">
                  <span>Tasa: <strong className="font-mono">{totalCalificados > 0 ? ((totalReservas / totalCalificados) * 100).toFixed(1) : 0}%</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('form-manual-embudo');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-[10px] font-bold text-amber-800 hover:text-amber-950 underline"
                  >
                    ✍️ Rellenar
                  </button>
                </div>
              </div>

              {/* Etapa 4: Matriculados Confirmados */}
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-300 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-950">4. Alumnos Pagados</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-black text-emerald-950 font-mono">{totalAlumnosReales}</div>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-bold">✍️ Manual</span>
                </div>
                <p className="text-[11px] text-emerald-800/80 mt-1">Matrícula cerrada y facturada formalmente.</p>
                <div className="mt-3 pt-2 border-t border-emerald-200 text-[10px] text-emerald-950 flex justify-between items-center">
                  <span>Tasa: <strong className="font-mono">{totalReservas > 0 ? ((totalAlumnosReales / totalReservas) * 100).toFixed(1) : 0}%</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('form-manual-embudo');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-[10px] font-bold text-emerald-800 hover:text-emerald-950 underline"
                  >
                    ✍️ Rellenar
                  </button>
                </div>
              </div>

            </div>

            {/* Barra Gráfica de Conversión Progresiva */}
            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-800 block mb-2">
                Eficiencia de Retención del Embudo Comercial
              </span>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                <div 
                  className="bg-slate-400 h-full" 
                  style={{ width: `${Math.max(10, (totalLeads / totalLeads) * 100)}%` }} 
                  title={`Leads: ${totalLeads}`} 
                />
                <div 
                  className="bg-blue-500 h-full" 
                  style={{ width: `${Math.max(5, (totalCalificados / totalLeads) * 100)}%` }} 
                  title={`Calificados: ${totalCalificados}`} 
                />
                <div 
                  className="bg-amber-500 h-full" 
                  style={{ width: `${Math.max(5, (totalReservas / totalLeads) * 100)}%` }} 
                  title={`Reservas: ${totalReservas}`} 
                />
                <div 
                  className="bg-emerald-600 h-full" 
                  style={{ width: `${Math.max(5, (totalAlumnosReales / totalLeads) * 100)}%` }} 
                  title={`Inscritos: ${totalAlumnosReales}`} 
                />
              </div>
              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 mt-2">
                <span>Leads (100%)</span>
                <span>Calificados ({((totalCalificados / totalLeads) * 100).toFixed(0)}%)</span>
                <span>Reservas ({((totalReservas / totalLeads) * 100).toFixed(0)}%)</span>
                <span className="font-bold text-emerald-700">Matriculados ({tasaConversionGlobal.toFixed(1)}%)</span>
              </div>
            </div>
          </div>

          {/* FORMULARIO MANUAL: Alimentador de Leads & Embudo por Programa */}
          <div id="form-manual-embudo" className="bg-white rounded-xl border border-emerald-200 shadow-xs p-5 bg-gradient-to-br from-white to-emerald-50/20 scroll-mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-emerald-100">
              <div>
                <h3 className="text-sm font-black text-emerald-950 flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">✍️</span>
                  Registro y Actualización Manual del Embudo por Programa
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ingresa directamente las métricas de captación, reservas y cierres para sincronizar el pipeline comercial.
                </p>
              </div>
              {mensajePipelineExito && (
                <div className="px-3 py-1.5 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-bold animate-in fade-in">
                  ✓ {mensajePipelineExito}
                </div>
              )}
            </div>

            <form onSubmit={handleGuardarPipelineManual} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                {/* Selector de Programa */}
                <div className="lg:col-span-2 space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Programa Educativo
                  </label>
                  <select
                    value={pipelineProgId}
                    onChange={(e) => handleCambiarProyectoPipeline(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    {proyectos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.codigoPrograma || `SUM-${p.id}`} — {p.nombreProyecto}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Canal de Captación */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Canal Principal
                  </label>
                  <select
                    value={pipelineCanal}
                    onChange={(e) => setPipelineCanal(e.target.value as MetodoVenta)}
                    className="w-full text-xs px-2.5 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="Publicidad Paga (Ads)">Publicidad Paga (Ads)</option>
                    <option value="Ventas Directas / Llamadas">Ventas Directas / Llamadas</option>
                    <option value="Eventos / Webinars">Eventos / Webinars</option>
                    <option value="Referidos">Referidos</option>
                    <option value="Organico Redes Sociales">Orgánico Redes</option>
                    <option value="Convenio Corporativo">Convenio Corporativo</option>
                    <option value="Email Marketing">Email Marketing</option>
                  </select>
                </div>

                {/* 1. Leads */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    1. Leads Totales
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={pipelineLeads}
                    onChange={(e) => setPipelineLeads(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* 2. Calificados */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                    2. Calificados
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={pipelineCalificados}
                    onChange={(e) => setPipelineCalificados(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full text-xs font-mono font-bold px-3 py-2 bg-blue-50/50 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* 3. Reservas */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                    3. Reservados
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={pipelineReservas}
                    onChange={(e) => setPipelineReservas(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full text-xs font-mono font-bold px-3 py-2 bg-amber-50/50 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <span className="font-semibold">4. Inscritos Oficiales (Mínimo 4):</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPipelineInscritos((prev) => Math.max(4, prev - 1))}
                      className="w-7 h-7 bg-slate-200 hover:bg-slate-300 rounded font-bold text-slate-800 flex items-center justify-center text-sm"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={4}
                      value={pipelineInscritos}
                      onChange={(e) => setPipelineInscritos(Math.max(4, parseInt(e.target.value, 10) || 4))}
                      className="w-16 text-center text-xs font-mono font-black py-1.5 bg-emerald-50 border border-emerald-300 rounded-md text-emerald-950"
                    />
                    <button
                      type="button"
                      onClick={() => setPipelineInscritos((prev) => prev + 1)}
                      className="w-7 h-7 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold flex items-center justify-center text-sm"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    (Conversión estimada: {pipelineLeads > 0 ? ((pipelineInscritos / pipelineLeads) * 100).toFixed(1) : 0}%)
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-black inline-flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar y Actualizar Embudo</span>
                </button>
              </div>
            </form>
          </div>

          {/* Desglose de Embudo por Programa Educativo */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                Embudo & Rendimiento de Conversión por Programa
              </h3>
              <span className="text-[11px] text-slate-500">Métricas comparativas individuales</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Programa</th>
                    <th className="py-2.5 px-3 text-center">Canal</th>
                    <th className="py-2.5 px-3 text-center font-mono">Leads</th>
                    <th className="py-2.5 px-3 text-center font-mono">Calificados</th>
                    <th className="py-2.5 px-3 text-center font-mono">Reservas</th>
                    <th className="py-2.5 px-3 text-center font-mono">Inscritos</th>
                    <th className="py-2.5 px-3 text-center">Tasa Conversión</th>
                    <th className="py-2.5 px-3 text-center">Salud del Embudo</th>
                    <th className="py-2.5 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {proyectos.map((p) => {
                    const leads = p.leadsGenerados || (p.alumnosProyectados * 8);
                    const calificados = p.prospectosCalificados || Math.round(leads * 0.45);
                    const reservas = p.cuposReservados || Math.round(calificados * 0.4);
                    const inscritos = p.alumnosFinal;
                    const convPct = leads > 0 ? ((inscritos / leads) * 100) : 0;
                    const cubrioEquilibrio = inscritos >= p.puntoEquilibrioAlumnos;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-xs">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[9px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1 py-0.2 rounded">
                              #{String(p.numeroCorrelativo || p.id).padStart(3, '0')}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">{p.codigoPrograma || `SUM-2026-${String(p.numeroCorrelativo || p.id).padStart(3, '0')}`}</span>
                          </div>
                          <div className="truncate font-bold">{p.nombreProyecto}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {p.metodoVenta}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-700">{leads}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-blue-800">{calificados}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-amber-800">{reservas}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-800 bg-emerald-50/50">
                          {inscritos}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            convPct >= 15 ? 'bg-emerald-100 text-emerald-800' :
                            convPct >= 8 ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {convPct.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            cubrioEquilibrio 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}>
                            {cubrioEquilibrio ? '🎯 Meta Cubierta' : '⚠️ Reforzar Pauta'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleAbrirComercializarProyecto(p.id)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold inline-flex items-center gap-1 shadow-2xs transition-all hover:scale-[1.02] cursor-pointer"
                              title="Comercializar este proyecto académico (Redes sociales, ventas, precios)"
                            >
                              <Rocket className="w-3 h-3" />
                              Comercializar
                            </button>
                            <button
                              type="button"
                              onClick={() => setProyectoEditando(p)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              Editar
                            </button>
                          </div>
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

      {/* ========================================================================= */}
      {/* VISTA 2: ANÁLISIS DE CAC & ROAS POR CANAL */}
      {/* ========================================================================= */}
      {tabActiva === 'cac_roi' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Tarjetas de Resumen CAC & Eficiencia */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>Inversión Total en Publicidad</span>
                <Megaphone className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                {formatearMoneda(totalGastoPublicidad, moneda)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Presupuesto consolidado de pauta y medios.</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>Costo Adquisición Promedio (CAC)</span>
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-blue-900 font-mono mt-1">
                {formatearMoneda(cacGlobal, moneda)}
              </div>
              <p className="text-[11px] text-blue-700/80 mt-1">Inversión promedio para captar cada alumno.</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>Multiplicador ROAS Global</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
                {roasGlobal.toFixed(2)}x
              </div>
              <p className="text-[11px] text-emerald-700/80 mt-1">
                Por cada L 1.00 en publicidad se recaudan L {roasGlobal.toFixed(2)}
              </p>
            </div>
          </div>

          {/* FORMULARIO MANUAL: Registro de Pauta Publicitaria & Campañas */}
          <div className="bg-white rounded-xl border border-blue-200 shadow-xs p-5 bg-gradient-to-br from-white to-blue-50/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-blue-100">
              <div>
                <h3 className="text-sm font-black text-blue-950 flex items-center gap-2">
                  <span className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">✍️</span>
                  Registro Manual de Inversión en Pauta & Presupuesto Publicitario
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Asigna montos ejecutados en Meta Ads, TikTok, Google Ads o eventos para calcular el CAC y ROAS exactos.
                </p>
              </div>
              {mensajePautaExito && (
                <div className="px-3 py-1.5 bg-blue-100 border border-blue-300 text-blue-900 rounded-lg text-xs font-bold animate-in fade-in">
                  ✓ {mensajePautaExito}
                </div>
              )}
            </div>

            <form onSubmit={handleGuardarPautaManual} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Selector de Programa */}
                <div className="lg:col-span-2 space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Programa a Pautar
                  </label>
                  <select
                    value={pautaProgId}
                    onChange={(e) => handleCambiarProyectoPauta(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    {proyectos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.codigoPrograma || `SUM-${p.id}`} — {p.nombreProyecto}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Canal de Publicidad */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Canal Publicitario
                  </label>
                  <select
                    value={pautaCanal}
                    onChange={(e) => setPautaCanal(e.target.value as MetodoVenta)}
                    className="w-full text-xs px-2.5 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="Publicidad Paga (Ads)">Meta Ads (Facebook / Instagram)</option>
                    <option value="Organico Redes Sociales">TikTok Ads & Reels</option>
                    <option value="Ventas Directas / Llamadas">Google Search & YouTube</option>
                    <option value="Eventos / Webinars">Eventos & Webinars</option>
                    <option value="Convenio Corporativo">LinkedIn B2B Ads</option>
                    <option value="Email Marketing">Email Marketing & CRM</option>
                  </select>
                </div>

                {/* Monto de Inversión */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                    Presupuesto Invertido (LPS)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={pautaMontoLPS}
                    onChange={(e) => setPautaMontoLPS(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full text-xs font-mono font-bold px-3 py-2 bg-blue-50/40 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Leads Estimados */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Leads Esperados
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={pautaLeadsEst}
                    onChange={(e) => setPautaLeadsEst(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-500">
                  <span>CAC Proyectado para este curso: </span>
                  <span className="font-bold text-blue-950 font-mono">
                    {formatearMoneda(pautaMontoLPS / Math.max(4, proyectos.find(p => p.id === pautaProgId)?.alumnosFinal || 4), moneda)} x alumno
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-black inline-flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Asignar Presupuesto de Pauta</span>
                </button>
              </div>
            </form>
          </div>

          {/* Matriz Comparativa de Canales de Captación */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-600" />
                Matriz de Eficiencia Publicitaria por Canal de Comercialización
              </h3>
              <span className="text-[11px] text-slate-500">Ordenado por alumnos generados</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Canal de Comercialización</th>
                    <th className="py-2.5 px-3 text-center">Cursos</th>
                    <th className="py-2.5 px-3 text-center font-mono">Alumnos Matr.</th>
                    <th className="py-2.5 px-3 text-center font-mono">Inversión Pauta</th>
                    <th className="py-2.5 px-3 text-center font-mono">Facturación</th>
                    <th className="py-2.5 px-3 text-center font-mono">CAC x Alumno</th>
                    <th className="py-2.5 px-3 text-center font-mono">ROAS</th>
                    <th className="py-2.5 px-3 text-center">Diagnóstico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resumenCanales.map((c) => {
                    const ticketPromedio = c.alumnos > 0 ? c.recaudado / c.alumnos : 0;
                    const relacionTicketCAC = c.cac > 0 ? (ticketPromedio / c.cac) : 999;
                    const esExcelente = c.roas >= 4 || relacionTicketCAC >= 4;

                    return (
                      <tr key={c.canal} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {c.canal}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-600">{c.count}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-emerald-800">{c.alumnos}</td>
                        <td className="py-3 px-3 text-center font-mono text-slate-700">
                          {formatearMoneda(c.gastoPublicidad, moneda)}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                          {formatearMoneda(c.recaudado, moneda)}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-blue-900 bg-blue-50/30">
                          {c.cac > 0 ? formatearMoneda(c.cac, moneda) : 'Orgánico (L 0.00)'}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-black text-emerald-700 bg-emerald-50/30">
                          {c.roas > 0 ? `${c.roas.toFixed(1)}x` : 'N/A'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            esExcelente 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                              : c.roas >= 2 
                              ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {esExcelente ? '🚀 Alta Rentabilidad' : c.roas >= 2 ? '✅ Estable' : '⚠️ Optimizar Pauta'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Guía de Estrategia CAC para SUMMIT */}
          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 flex items-start gap-3 text-xs text-emerald-950">
            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-emerald-900">Recomendación Estratégica de Inversión</h4>
              <p>
                Los canales con mayor ratio de retorno (WhatsApp Business y Referidos Institucionales) deben ser el canal de cierre prioritario. En Meta Ads y TikTok Ads, mantén un CAC inferior al 25% del ticket promedio sugerido por curso para preservar el margen operativo objetivo del 30% al 50%.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 3: FASES COMERCIALES & ESTRATEGIA DE PRECIOS EARLY BIRD */}
      {/* ========================================================================= */}
      {tabActiva === 'fases_precios' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-purple-50 rounded-xl p-3.5 border border-purple-200">
              <span className="text-[11px] font-extrabold uppercase text-purple-900 block">1. Preventa Early Bird</span>
              <div className="text-sm font-bold text-purple-950 mt-1">Pronto Pago (10% - 20% Desc.)</div>
              <p className="text-[10px] text-purple-800 mt-1">Objetivo: Asegurar los primeros 4 cupos para alcanzar el punto de equilibrio rápido.</p>
            </div>

            <div className="bg-emerald-50 rounded-xl p-3.5 border border-emerald-200">
              <span className="text-[11px] font-extrabold uppercase text-emerald-900 block">2. Venta Regular</span>
              <div className="text-sm font-bold text-emerald-950 mt-1">Precio de Lista Sugerido</div>
              <p className="text-[10px] text-emerald-800 mt-1">Tarifa estándar que garantiza el margen neto planificado del curso.</p>
            </div>

            <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-200">
              <span className="text-[11px] font-extrabold uppercase text-amber-900 block">3. Cierre Final / Last Minute</span>
              <div className="text-sm font-bold text-amber-950 mt-1">Últimos Cupos Disponibles</div>
              <p className="text-[10px] text-amber-800 mt-1">Campañas de escasez y remarketing intensivo a prospectos calificados.</p>
            </div>

            <div className="bg-blue-50 rounded-xl p-3.5 border border-blue-200">
              <span className="text-[11px] font-extrabold uppercase text-blue-900 block">4. Venta Corporativa / B2B</span>
              <div className="text-sm font-bold text-blue-950 mt-1">Grupos de 3+ Alumnos</div>
              <p className="text-[10px] text-blue-800 mt-1">Convenios empresariales con facturación sujeta al régimen SAR correspondiente.</p>
            </div>
          </div>

          {/* FORMULARIO MANUAL: Configuración de Fases y Precios Early Bird */}
          <div className="bg-white rounded-xl border border-purple-200 shadow-xs p-5 bg-gradient-to-br from-white to-purple-50/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-purple-100">
              <div>
                <h3 className="text-sm font-black text-purple-950 flex items-center gap-2">
                  <span className="p-1.5 bg-purple-100 text-purple-800 rounded-lg">✍️</span>
                  Configuración Manual de Fases Comerciales & Precios Early Bird
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define la fase de venta activa, porcentaje de descuento por pronto pago y precio neto promocional.
                </p>
              </div>
              {mensajeFaseExito && (
                <div className="px-3 py-1.5 bg-purple-100 border border-purple-300 text-purple-900 rounded-lg text-xs font-bold animate-in fade-in">
                  ✓ {mensajeFaseExito}
                </div>
              )}
            </div>

            <form onSubmit={handleGuardarFasePreciosManual} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Selector de Programa */}
                <div className="lg:col-span-2 space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Programa Educativo
                  </label>
                  <select
                    value={faseProgId}
                    onChange={(e) => handleCambiarProyectoFase(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  >
                    {proyectos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.codigoPrograma || `SUM-${p.id}`} — {p.nombreProyecto}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fase Comercial Activa */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-purple-900 uppercase tracking-wider">
                    Fase Comercial Activa
                  </label>
                  <select
                    value={faseComercialSel}
                    onChange={(e) => setFaseComercialSel(e.target.value as NonNullable<ProyectoEducativo['faseComercial']>)}
                    className="w-full text-xs px-2.5 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden font-semibold text-purple-950"
                  >
                    <option value="Preventa Early Bird">Preventa Early Bird</option>
                    <option value="Venta Regular">Venta Regular</option>
                    <option value="Cierre Final">Cierre Final</option>
                    <option value="Venta Corporativa">Venta Corporativa</option>
                  </select>
                </div>

                {/* % Descuento Early Bird */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    % Descuento Preventa
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={faseDescPct}
                    onChange={(e) => {
                      const pct = Math.min(50, Math.max(0, parseInt(e.target.value, 10) || 0));
                      setFaseDescPct(pct);
                      const target = proyectos.find((p) => p.id === faseProgId);
                      const regular = target?.precioSugeridoConISV || target?.precioSugeridoAlumno || 2500;
                      setFasePrecioEB(Math.round(regular * (1 - pct / 100)));
                    }}
                    className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>

                {/* Precio Early Bird Resultante */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-purple-900 uppercase tracking-wider">
                    Precio Early Bird (LPS)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={fasePrecioEB}
                    onChange={(e) => setFasePrecioEB(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full text-xs font-mono font-bold px-3 py-2 bg-purple-50/50 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden text-purple-950"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-500">
                  <span>Precio de Lista Regular: </span>
                  <span className="font-bold text-slate-800 font-mono">
                    {formatearMoneda(proyectos.find(p => p.id === faseProgId)?.precioSugeridoConISV || proyectos.find(p => p.id === faseProgId)?.precioSugeridoAlumno || 2500, moneda)}
                  </span>
                  <span className="mx-2 text-slate-300">|</span>
                  <span>Ahorro para el alumno: </span>
                  <span className="font-bold text-emerald-700 font-mono">
                    {formatearMoneda(((proyectos.find(p => p.id === faseProgId)?.precioSugeridoConISV || 2500) - fasePrecioEB), moneda)}
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-black inline-flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Tarifas Comerciales</span>
                </button>
              </div>
            </form>
          </div>

          {/* Tabla de Estrategia de Precios por Curso */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                Matriz de Precios, Preventa Early Bird & Margen
              </h3>
              <span className="text-[11px] text-slate-500">Configuración de tarifas comerciales</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Programa</th>
                    <th className="py-2.5 px-3 text-center">Fase Activa</th>
                    <th className="py-2.5 px-3 text-center font-mono">Precio Regular (c/ ISV)</th>
                    <th className="py-2.5 px-3 text-center font-mono">Precio Early Bird</th>
                    <th className="py-2.5 px-3 text-center font-mono">% Descuento</th>
                    <th className="py-2.5 px-3 text-center font-mono">Punto Equilibrio</th>
                    <th className="py-2.5 px-3 text-center">Margen con Descuento</th>
                    <th className="py-2.5 px-3 text-right">Ajustar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {proyectos.map((p) => {
                    const regularPrice = p.precioSugeridoConISV || p.precioSugeridoAlumno;
                    const earlyBird = p.precioEarlyBird || Math.round(regularPrice * 0.85);
                    const descPct = p.descuentoPreventaPct || 15;
                    const fase = p.faseComercial || 'Venta Regular';

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs">
                          <div>{p.nombreProyecto}</div>
                          <div className="text-[10px] text-slate-500">Docente: {p.nombreDocente}</div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            fase === 'Preventa Early Bird' ? 'bg-purple-100 text-purple-900 border border-purple-300' :
                            fase === 'Cierre Final' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                            fase === 'Venta Corporativa' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                            'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}>
                            {fase}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                          {formatearMoneda(regularPrice, moneda)}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-purple-900 bg-purple-50/40">
                          {formatearMoneda(earlyBird, moneda)}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-semibold text-purple-800">
                          -{descPct}%
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-700">
                          {p.puntoEquilibrioAlumnos} alumnos
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-emerald-800">
                          {Math.max(15, p.margenGananciaOperativa - (descPct * 0.5)).toFixed(0)}% neto
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setProyectoEditando(p)}
                            className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded text-[11px] font-bold inline-flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            Editar Precios
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

      {/* ========================================================================= */}
      {/* VISTA 4: CONTROL DE MATRÍCULA & TABLA INTEGRAL DE VENTAS */}
      {/* ========================================================================= */}
      {tabActiva === 'control_matricula' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          
          {/* Barra de Filtros y Búsqueda */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por curso, docente o canal..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Filtro Canal */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-medium">Canal:</span>
                <select
                  value={filtroCanal}
                  onChange={(e) => setFiltroCanal(e.target.value)}
                  className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                >
                  <option value="todos">Todos los Canales</option>
                  <option value="Redes sociales">Redes sociales</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Publicidad Paga (Ads)">Publicidad Paga (Ads)</option>
                  <option value="Email Marketing">Email Marketing</option>
                  <option value="Referidos">Referidos</option>
                  <option value="Convenios / Empresas">Convenios / Empresas</option>
                  <option value="Llamadas / Telemarketing">Llamadas / Telemarketing</option>
                  <option value="Página Web">Página Web</option>
                </select>
              </div>

              {/* Filtro Fase Comercial */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-medium">Fase:</span>
                <select
                  value={filtroFase}
                  onChange={(e) => setFiltroFase(e.target.value)}
                  className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                >
                  <option value="todos">Todas las Fases</option>
                  <option value="Preventa Early Bird">Preventa Early Bird</option>
                  <option value="Venta Regular">Venta Regular</option>
                  <option value="Cierre Final">Cierre Final</option>
                  <option value="Venta Corporativa">Venta Corporativa</option>
                </select>
              </div>

              {/* Filtro Cumplimiento */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-medium">Cumplimiento:</span>
                <select
                  value={filtroCumplimiento}
                  onChange={(e) => setFiltroCumplimiento(e.target.value)}
                  className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                >
                  <option value="todos">Todos los Proyectos</option>
                  <option value="superado">Meta Alcanzada / Superada</option>
                  <option value="bajo_meta">Por debajo de Meta Proyectada</option>
                  <option value="bajo_equilibrio">En Riesgo (Bajo Punto Equilibrio)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabla de Matrícula & Gestión Comercial */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Control & Alimentación de Matrícula Comercial ({proyectosFiltrados.length})
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                Ajuste rápido de inscritos (Base mínima: 4)
              </span>
            </div>

            {proyectosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <Users className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-medium">No hay proyectos coincidentes con los filtros comerciales.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-emerald-50/70 text-emerald-950 uppercase text-[10px] font-bold border-b border-emerald-100">
                    <tr>
                      <th className="py-2.5 px-3">Programa & Docente</th>
                      <th className="py-2.5 px-3 text-center">Canal & Fase</th>
                      <th className="py-2.5 px-3 text-center">Fecha Cierre</th>
                      <th className="py-2.5 px-3 text-center">Ticket Sugerido</th>
                      <th className="py-2.5 px-3 text-center">Alumnos Meta</th>
                      <th className="py-2.5 px-3 text-center">Inscritos Reales</th>
                      <th className="py-2.5 px-3 text-center">Diferencia</th>
                      <th className="py-2.5 px-3 text-center">Viabilidad</th>
                      <th className="py-2.5 px-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {proyectosFiltrados.map((p) => {
                      const dif = p.diferenciaAlumnos;
                      const cubrioPuntoEquilibrio = p.alumnosFinal >= p.puntoEquilibrioAlumnos;

                      return (
                        <tr key={p.id} className="hover:bg-emerald-50/30 transition-colors">
                          
                          {/* Programa */}
                          <td className="py-3 px-3 max-w-xs">
                            <div className="font-bold text-slate-900 hover:text-emerald-700 cursor-pointer" onClick={() => onVerDetalle(p)}>
                              {p.nombreProyecto}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Docente: <strong className="text-slate-700">{p.nombreDocente}</strong>
                            </div>
                          </td>

                          {/* Canal & Fase */}
                          <td className="py-3 px-3 text-center">
                            <div className="space-y-1">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 block">
                                {p.metodoVenta}
                              </span>
                              <span className="text-[9px] text-slate-500 block">
                                {p.faseComercial || 'Venta Regular'}
                              </span>
                            </div>
                          </td>

                          {/* Fecha Venta */}
                          <td className="py-3 px-3 text-center font-mono text-slate-700">
                            <div className="flex items-center justify-center gap-1 text-[11px]">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{p.fechaVenta || 'Sin límite'}</span>
                            </div>
                          </td>

                          {/* Ticket Sugerido */}
                          <td className="py-3 px-3 text-center font-mono">
                            <div className="font-bold text-slate-900">
                              {formatearMoneda(p.precioSugeridoConISV || p.precioSugeridoAlumno, moneda)}
                            </div>
                            <span className="text-[10px] text-slate-500 block">
                              ({formatearMoneda(p.precioSugeridoAlumno, moneda)} neto)
                            </span>
                          </td>

                          {/* Meta Alumnos */}
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                            {p.alumnosProyectados}
                          </td>

                          {/* Alumnos Reales con control rápido */}
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                              <button
                                type="button"
                                onClick={() => handleAjustarAlumnosFinales(p, -1)}
                                className="w-5 h-5 rounded bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shadow-2xs cursor-pointer"
                                title="Restar 1 alumno"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-mono font-black text-sm text-emerald-800 px-1 min-w-[20px] text-center">
                                {p.alumnosFinal}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAjustarAlumnosFinales(p, 1)}
                                className="w-5 h-5 rounded bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shadow-2xs cursor-pointer"
                                title="Sumar 1 alumno inscrito"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          {/* Diferencia */}
                          <td className="py-3 px-3 text-center font-mono font-bold">
                            <span className={`px-1.5 py-0.5 rounded text-[11px] ${
                              dif > 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : dif < 0
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {dif > 0 ? `+${dif}` : dif}
                            </span>
                          </td>

                          {/* Estado Viabilidad & Nivel de Flujo */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <WorkflowStatusBadge 
                                proyecto={p} 
                                onClick={onAbrirWorkflowStatusModal ? () => onAbrirWorkflowStatusModal(p.id) : undefined} 
                              />
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                cubrioPuntoEquilibrio
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {cubrioPuntoEquilibrio ? '✅ Viable' : '⚠️ En Riesgo'} • Eq: {p.puntoEquilibrioAlumnos}
                              </span>
                            </div>
                          </td>

                          {/* Acciones */}
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setProyectoEditando(p)}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
                                title="Edición rápida de metas y datos comerciales"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span className="hidden sm:inline">Editar</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onVerDetalle(p)}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                                title="Ver ficha completa"
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

      {/* ========================================================================= */}
      {/* VISTA 5: SIMULADOR DE METAS COMERCIALES & BRECHAS DE RECAUDACIÓN */}
      {/* ========================================================================= */}
      {tabActiva === 'simulador_metas' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white p-5 rounded-xl border border-teal-800 shadow-xs">
            <div className="flex items-center gap-3">
              <Sliders className="w-6 h-6 text-teal-400 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-white">
                  Simulador de Crecimiento & Brechas Comerciales
                </h3>
                <p className="text-xs text-teal-200 mt-0.5">
                  Proyecta cuánto ingreso neto y superávit adicional se genera por cada alumno extra cerrado por el equipo de ventas.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {proyectos.map((p) => {
              const extraSim = simuladorAlumnosExtra[p.id] || 0;
              const totalSimAlumnos = p.alumnosFinal + extraSim;
              const precioUnitario = p.precioSugeridoAlumno;
              const ingresoExtraSim = extraSim * precioUnitario;
              const gananciaTotalSim = p.totalGananciasFinales + ingresoExtraSim;

              return (
                <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{p.nombreProyecto}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Ticket: {formatearMoneda(precioUnitario, moneda)} c/u
                      </span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold font-mono">
                      Eq: {p.puntoEquilibrioAlumnos} alum.
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Alumnos Reales Actuales:</span>
                    <span className="font-mono font-bold text-slate-800">{p.alumnosFinal} inscritos</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-teal-900">Simular Cierre de Alumnos Extras:</span>
                      <span className="font-mono font-bold text-teal-700">+{extraSim} alumnos</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="15"
                      value={extraSim}
                      onChange={(e) => setSimuladorAlumnosExtra({
                        ...simuladorAlumnosExtra,
                        [p.id]: Number(e.target.value)
                      })}
                      className="w-full accent-teal-600 cursor-pointer"
                    />
                  </div>

                  <div className="bg-teal-50/70 p-3 rounded-lg border border-teal-200 text-xs space-y-1.5">
                    <div className="flex justify-between text-teal-950">
                      <span>Ingreso Marginal Extra:</span>
                      <span className="font-mono font-bold text-teal-800">
                        +{formatearMoneda(ingresoExtraSim, moneda)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-bold border-t border-teal-200/60 pt-1">
                      <span>Ganancia Neta Proyectada:</span>
                      <span className="font-mono text-emerald-800">
                        {formatearMoneda(gananciaTotalSim, moneda)}
                      </span>
                    </div>
                  </div>

                  {extraSim > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        onGuardarProyecto({
                          ...p,
                          alumnosFinal: totalSimAlumnos,
                          alumnosProyectados: Math.max(p.alumnosProyectados, totalSimAlumnos),
                        });
                        setSimuladorAlumnosExtra({
                          ...simuladorAlumnosExtra,
                          [p.id]: 0
                        });
                      }}
                      className="w-full py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>✍️ Aplicar y Guardar {totalSimAlumnos} Alumnos en Proyecto</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 6: ENCUESTAS DE SATISFACCIÓN & CALIFICACIÓN DE CURSOS (GERENCIA COMERCIAL) */}
      {/* ========================================================================= */}
      {tabActiva === 'encuestas_satisfaccion' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Tarjetas de Resumen CSAT & Encuestas */}
          {(() => {
            const proyectosConCalificacion = proyectos.filter(p => p.calificacionCurso && Number(p.calificacionCurso) > 0);
            const sumaCalificaciones = proyectosConCalificacion.reduce((acc, p) => acc + (Number(p.calificacionCurso) || 5), 0);
            const calificacionPromedio = proyectosConCalificacion.length > 0 
              ? (sumaCalificaciones / proyectosConCalificacion.length) 
              : 4.9;

            const totalEncuestasEnviadas = proyectos.filter(p => p.encuestaSatisfaccion?.estado === 'Enviada' || p.encuestaSatisfaccion?.estado === 'Completada').length;
            const totalEncuestasCompletadas = proyectos.filter(p => p.encuestaSatisfaccion?.estado === 'Completada').length;

            return (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs">
                    <span>Calificación Promedio Portafolio</span>
                    <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-indigo-950 font-mono">
                      {calificacionPromedio.toFixed(1)}
                    </span>
                    <span className="text-sm text-slate-400 font-bold">/ 5.0</span>
                  </div>
                  <div className="flex text-amber-400 text-xs mt-1">
                    {['★', '★', '★', '★', '★'].map((s, i) => (
                      <span key={i} className={i < Math.round(calificacionPromedio) ? 'text-amber-500' : 'text-slate-300'}>
                        ★
                      </span>
                    ))}
                    <span className="ml-2 text-[10px] text-slate-500 font-medium">({proyectosConCalificacion.length} evaluados)</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs">
                    <span>Encuestas Enviadas a Alumnos</span>
                    <Send className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-black text-blue-900 font-mono mt-1">
                    {totalEncuestasEnviadas} <span className="text-xs text-slate-400 font-normal">/ {proyectos.length} cursos</span>
                  </div>
                  <p className="text-[11px] text-blue-700/80 mt-1">Distribuidas por Gerencia Comercial</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs">
                    <span>Encuestas Completadas</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-emerald-800 font-mono mt-1">
                    {totalEncuestasCompletadas} <span className="text-xs text-slate-400 font-normal">cursos listos</span>
                  </div>
                  <p className="text-[11px] text-emerald-700/80 mt-1">Feedback consolidado</p>
                </div>

                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-4 rounded-xl shadow-xs">
                  <div className="flex items-center justify-between text-indigo-200 text-xs">
                    <span>NPS Institucional Estimado</span>
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-black text-amber-300 font-mono mt-1">
                    +92 NPS
                  </div>
                  <p className="text-[10px] text-indigo-200 mt-1">Nivel Excelente de Recomendación</p>
                </div>
              </div>
            );
          })()}

          {/* Tabla de Control de Encuestas y Calificaciones por Curso */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  Gestión y Distribución de Encuestas de Satisfacción Estudiantil
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  La Gerencia Comercial genera y envía los enlaces de satisfacción a los alumnos matriculados para recopilar la calificación y calidad docente.
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  Total Cursos: {proyectos.length}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Programa / Curso</th>
                    <th className="py-2.5 px-3">Sección & Horario</th>
                    <th className="py-2.5 px-3">Docente Asignado</th>
                    <th className="py-2.5 px-3 text-center">Alumnos</th>
                    <th className="py-2.5 px-3 text-center">Calificación (1.0 - 5.0)</th>
                    <th className="py-2.5 px-3 text-center">Estado de Encuesta</th>
                    <th className="py-2.5 px-3 text-right">Acciones Comerciales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {proyectos.map((p) => {
                    const calificacionActual = p.calificacionCurso ? Number(p.calificacionCurso) : 5.0;
                    const estadoEncuesta = p.encuestaSatisfaccion?.estado || 'Enviada';

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[9px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1 py-0.2 rounded">
                              #{String(p.numeroCorrelativo || p.id).padStart(3, '0')}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">{p.codigoPrograma || `SUM-2026-${String(p.numeroCorrelativo || p.id).padStart(3, '0')}`}</span>
                          </div>
                          <div className="font-bold text-slate-900">{p.nombreProyecto}</div>
                          <span className="text-[10px] text-slate-500">{p.tipoProyecto}</span>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-semibold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded text-[11px] inline-block mb-1 border border-blue-200">
                            {p.seccion || 'Sección A'}
                          </div>
                          <div className="text-[11px] text-slate-600">{p.diasClase || 'Lunes a Viernes'}</div>
                          <div className="text-[10px] font-mono text-slate-500">{p.horario || '06:00 PM - 08:00 PM'}</div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{p.nombreDocente}</div>
                          <div className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            <Award className="w-2.5 h-2.5 text-blue-600" />
                            {p.docenteClasificacion || 'Licenciatura'}
                          </div>
                          {p.docenteTelefono && (
                            <div className="text-[10px] text-emerald-700 font-mono mt-0.5">
                              📞 {p.docenteTelefono}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                          {p.alumnosFinal} <span className="text-[10px] text-slate-400 font-normal">estudiantes</span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center gap-1.5 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                            <span className="text-amber-500 font-bold">★</span>
                            <span className="font-mono font-black text-amber-950 text-xs">
                              {calificacionActual.toFixed(1)}
                            </span>
                            <span className="text-[10px] text-slate-400">/ 5.0</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            estadoEncuesta === 'Completada'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : estadoEncuesta === 'Enviada'
                              ? 'bg-blue-100 text-blue-900 border-blue-300'
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                          }`}>
                            <CheckCircle2 className="w-3 h-3" />
                            {estadoEncuesta}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              id={`btn-generar-encuesta-${p.id}`}
                              type="button"
                              onClick={() => setEncuestaModalProyecto(p)}
                              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1 shadow-xs transition-colors"
                              title="Generar y enviar enlace de encuesta a los estudiantes"
                            >
                              <Send className="w-3 h-3" />
                              <span>Generar / Enviar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onVerDetalle(p)}
                              className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold"
                            >
                              Detalles
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* FORMULARIO MANUAL: Registro Directo de Encuestas CSAT & Testimonios */}
          <div className="bg-white rounded-xl border border-indigo-200 shadow-xs p-5 bg-gradient-to-br from-white to-indigo-50/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-indigo-100">
              <div>
                <h3 className="text-sm font-black text-indigo-950 flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-100 text-indigo-800 rounded-lg">✍️</span>
                  Registro Manual de Encuesta de Satisfacción & Testimonio de Estudiante
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ingresa las evaluaciones cualitativas y cuantitativas recibidas por WhatsApp, correo o formularios impresos para nutrir el portafolio comercial.
                </p>
              </div>
              {mensajeCsatExito && (
                <div className="px-3 py-1.5 bg-indigo-100 border border-indigo-300 text-indigo-900 rounded-lg text-xs font-bold animate-in fade-in">
                  ✓ {mensajeCsatExito}
                </div>
              )}
            </div>

            <form onSubmit={handleGuardarEncuestaManual} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Selector de Programa */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Programa Evaluado
                  </label>
                  <select
                    value={csatProgId}
                    onChange={(e) => setCsatProgId(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    {proyectos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.codigoPrograma || `SUM-${p.id}`} — {p.nombreProyecto}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nombre del Estudiante */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Nombre del Estudiante
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Ing. Carla Mendoza"
                    value={csatEstudianteNombre}
                    onChange={(e) => setCsatEstudianteNombre(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                {/* Empresa / Cargo */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Empresa / Organización (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Banco Ficohsa / Gerente TI"
                    value={csatEmpresa}
                    onChange={(e) => setCsatEmpresa(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                {/* Calificación de 1 a 5 y NPS */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                      Estrellas (1 - 5)
                    </label>
                    <select
                      value={csatCalificacion}
                      onChange={(e) => setCsatCalificacion(parseFloat(e.target.value))}
                      className="w-full text-xs font-bold font-mono px-2 py-2 bg-amber-50 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-amber-950"
                    >
                      <option value={5.0}>★★★★★ 5.0 (Excelente)</option>
                      <option value={4.5}>★★★★½ 4.5 (Muy Bueno)</option>
                      <option value={4.0}>★★★★☆ 4.0 (Bueno)</option>
                      <option value={3.5}>★★★½☆ 3.5 (Aceptable)</option>
                      <option value={3.0}>★★★☆☆ 3.0 (Regular)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
                      NPS (0 - 10)
                    </label>
                    <select
                      value={csatNpsScore}
                      onChange={(e) => setCsatNpsScore(parseInt(e.target.value, 10))}
                      className="w-full text-xs font-bold font-mono px-2 py-2 bg-indigo-50 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-indigo-950"
                    >
                      <option value={10}>10 (Promotor Top)</option>
                      <option value={9}>9 (Promotor)</option>
                      <option value={8}>8 (Pasivo)</option>
                      <option value={7}>7 (Pasivo)</option>
                      <option value={6}>6 (Detractor)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Comentario / Testimonio Cualitativo */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Testimonio Cualitativo / Comentario del Alumno
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ej. El enfoque práctico y la experiencia del docente me permitieron aplicar los conocimientos directamente en los proyectos de mi empresa..."
                  value={csatComentario}
                  onChange={(e) => setCsatComentario(e.target.value)}
                  className="w-full text-xs p-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={csatAutorizadoMarketing}
                    onChange={(e) => setCsatAutorizadoMarketing(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Autorizado por el alumno para uso en piezas publicitarias y One-Pagers</span>
                </label>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-black inline-flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Encuesta & Testimonio</span>
                </button>
              </div>
            </form>
          </div>

          {/* Banco de Testimonios y Reseñas Recibidas */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Banco de Testimonios & Reseñas Registradas
              </h3>
              <span className="text-xs text-slate-500">
                Total acumulado en el sistema
              </span>
            </div>

            {(() => {
              const todosLosComentarios = proyectos.flatMap((p) =>
                (p.encuestaSatisfaccion?.comentariosEstudiantes || []).map((c) => ({
                  ...c,
                  proyectoId: p.id,
                  proyectoNombre: p.nombreProyecto,
                  codigoPrograma: p.codigoPrograma || `SUM-${p.id}`,
                }))
              );

              if (todosLosComentarios.length === 0) {
                return (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No hay testimonios registrados manualmente aún. Utiliza el formulario superior para añadir la primera reseña.
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {todosLosComentarios.map((c) => (
                    <div
                      key={c.id}
                      className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2 relative group hover:border-indigo-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 font-bold block mb-1">
                            {c.codigoPrograma}
                          </span>
                          <span className="font-bold text-slate-900 block">{c.estudiante}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-amber-900 font-bold font-mono text-[11px]">
                          <span>★</span>
                          <span>{c.puntuacion.toFixed(1)}</span>
                        </div>
                      </div>

                      <p className="text-slate-600 italic text-[11px] bg-white p-2.5 rounded-lg border border-slate-100">
                        "{c.comentario}"
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 border-t border-slate-200">
                        <span>{c.fecha}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(`"${c.comentario}" — ${c.estudiante}, Curso: ${c.proyectoNombre}`);
                              alert('¡Testimonio copiado al portapapeles!');
                            }}
                            className="text-indigo-600 hover:text-indigo-800 font-bold"
                          >
                            Copiar cita
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEliminarComentarioCSAT(c.proyectoId, c.id)}
                            className="text-rose-600 hover:text-rose-800"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 7: ONE-PAGERS & GUÍA DE PITCH COMERCIAL (SALES ENABLEMENT) */}
      {/* ========================================================================= */}
      {tabActiva === 'one_pager' && (
        <CommercialOnePagerView
          proyectos={proyectos}
          moneda={moneda}
          onGuardarProyecto={onGuardarProyecto}
        />
      )}

      {/* ========================================================================= */}
      {/* VISTA 8: COTIZADOR & PROPUESTAS B2B / IN-COMPANY */}
      {/* ========================================================================= */}
      {tabActiva === 'propuestas_b2b' && (
        <CommercialB2BProposalsView
          proyectos={proyectos}
          moneda={moneda}
          onGuardarProyecto={onGuardarProyecto}
        />
      )}

      {/* ========================================================================= */}
      {/* VISTA 9: POLÍTICAS DE DESCUENTOS, BECAS & ALERTA DE MARGEN */}
      {/* ========================================================================= */}
      {tabActiva === 'politicas_descuentos' && (
        <CommercialDiscountPoliciesView
          proyectos={proyectos}
          moneda={moneda}
          onGuardarProyecto={onGuardarProyecto}
        />
      )}

      {/* ========================================================================= */}
      {/* VISTA 10: CRM DE ADMISIONES & TRASPASO AL AULA VIRTUAL */}
      {/* ========================================================================= */}
      {tabActiva === 'crm_admisiones' && (
        <CommercialAdmissionsCRMView
          proyectos={proyectos}
          moneda={moneda}
          onGuardarProyecto={onGuardarProyecto}
        />
      )}

      {/* ========================================================================= */}
      {/* VISTA 11: MOTOR DE RE-COMPRA & RUTAS DE CARRERA (LTV) */}
      {/* ========================================================================= */}
      {tabActiva === 'cross_selling_ltv' && (
        <CommercialCrossSellingLTVView
          proyectos={proyectos}
          moneda={moneda}
          onGuardarProyecto={onGuardarProyecto}
        />
      )}

      {/* ========================================================================= */}
      {/* VISTA 12: TABLERO DE RENDIMIENTO DE ASESORES & COMISIONES */}
      {/* ========================================================================= */}
      {tabActiva === 'asesores_comisiones' && (
        <CommercialSalesAdvisorsView
          proyectos={proyectos}
          moneda={moneda}
          onGuardarProyecto={onGuardarProyecto}
        />
      )}

      {/* ========================================================================= */}
      {/* VISTA 13: CRONOGRAMA & ROADMAP DE CAMPAÑAS DE LANZAMIENTO */}
      {/* ========================================================================= */}
      {tabActiva === 'calendario_lanzamientos' && (
        <CommercialLaunchCampaignsView
          proyectos={proyectos}
          moneda={moneda}
          onGuardarProyecto={onGuardarProyecto}
        />
      )}

      {/* ========================================================================= */}
      {/* VISTA 14: ALIANZAS INSTITUCIONALES & CONVENIOS GREMIALES */}
      {/* ========================================================================= */}
      {tabActiva === 'alianzas_convenios' && (
        <CommercialInstitutionalAlliancesView
          proyectos={proyectos}
          moneda={moneda}
          onGuardarProyecto={onGuardarProyecto}
          conveniosCompartidos={convenios}
          setConveniosCompartidos={setConvenios}
        />
      )}

      {/* ========================================================================= */}
      {/* VISTA 15: GUIONES DE VENTA, SPEECHES & PLAYBOOK DE OBJECIONES */}
      {/* ========================================================================= */}
      {tabActiva === 'playbook_speeches' && (
        <CommercialSalesPlaybookView
          proyectos={proyectos}
          moneda={moneda}
          onGuardarProyecto={onGuardarProyecto}
        />
      )}

      {/* ========================================================================= */}
      {/* VISTA 16: ANÁLISIS DE MOTIVOS DE PÉRDIDA & LOST LEADS */}
      {/* ========================================================================= */}
      {tabActiva === 'analisis_lost_leads' && (
        <CommercialLostLeadsAnalysisView
          proyectos={proyectos}
          moneda={moneda}
          onGuardarProyecto={onGuardarProyecto}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: GENERADOR Y DIFUSIÓN DE ENCUESTA DE SATISFACCIÓN */}
      {/* ========================================================================= */}
      {encuestaModalProyecto && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="bg-gradient-to-r from-indigo-950 to-purple-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/30 flex items-center justify-center text-indigo-200">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    Generador de Encuesta de Satisfacción SUMMIT
                  </h3>
                  <span className="text-[10px] text-indigo-200">
                    Gerencia Comercial • Distribución a Estudiantes
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEncuestaModalProyecto(null)}
                className="text-indigo-200 hover:text-white text-base font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Resumen del Proyecto */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{encuestaModalProyecto.nombreProyecto}</span>
                  <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    {encuestaModalProyecto.codigoPrograma || `SUM-2026-${String(encuestaModalProyecto.numeroCorrelativo || encuestaModalProyecto.id).padStart(3, '0')}`}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Docente: <strong>{encuestaModalProyecto.nombreDocente}</strong> ({encuestaModalProyecto.docenteClasificacion || 'Licenciatura'}) • Sección {encuestaModalProyecto.seccion || 'A'}
                </p>
                <p className="text-slate-500 text-[11px]">
                  Matrícula activa: <strong className="text-slate-800">{encuestaModalProyecto.alumnosFinal} estudiantes inscritos</strong>
                </p>
              </div>

              {/* Ajustar Calificación Recibida */}
              <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 space-y-2">
                <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider">
                  Registrar / Actualizar Calificación del Curso (1.0 - 5.0)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1.0"
                    max="5.0"
                    step="0.1"
                    value={encuestaModalProyecto.calificacionCurso || 5.0}
                    onChange={(e) => {
                      setEncuestaModalProyecto({
                        ...encuestaModalProyecto,
                        calificacionCurso: parseFloat(e.target.value)
                      });
                    }}
                    className="flex-1 accent-amber-600 cursor-pointer"
                  />
                  <span className="text-base font-black font-mono text-amber-950 bg-white px-3 py-1 rounded-lg border border-amber-300">
                    {Number(encuestaModalProyecto.calificacionCurso || 5.0).toFixed(1)} ★
                  </span>
                </div>
              </div>

              {/* Mensaje de Difusión Estudiantil WhatsApp / Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Plantilla de Envío para Estudiantes (WhatsApp / Correo)
                </label>
                <div className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs font-mono whitespace-pre-line leading-relaxed border border-slate-800">
                  {`🎓 *SUMMIT - Encuesta de Satisfacción del Curso*\n\nEstimado(a) estudiante del curso *${encuestaModalProyecto.nombreProyecto}* (${encuestaModalProyecto.seccion || 'Sección A'}):\n\nPara la Gerencia Comercial y Académica de SUMMIT, su opinión es vital para certificar la excelencia del docente *${encuestaModalProyecto.nombreDocente}*.\n\n👉 *Enlace para responder:* https://encuestas.summit.hn/evaluacion?curso=${encuestaModalProyecto.codigoPrograma || encuestaModalProyecto.id}&token=CSAT-${encuestaModalProyecto.id}\n\n¡Muchas gracias por su compromiso con la excelencia educativa!`}
                </div>
              </div>

              {/* Estado de la Encuesta */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estado de Distribución
                  </label>
                  <select
                    value={encuestaModalProyecto.encuestaSatisfaccion?.estado || 'Enviada'}
                    onChange={(e) => {
                      const nuevoEstado = e.target.value as 'Pendiente' | 'Generada' | 'Enviada' | 'Completada';
                      setEncuestaModalProyecto({
                        ...encuestaModalProyecto,
                        encuestaSatisfaccion: {
                          estado: nuevoEstado,
                          fechaEnvio: new Date().toISOString().split('T')[0],
                          enlaceEncuesta: `https://encuestas.summit.hn/evaluacion?curso=${encuestaModalProyecto.codigoPrograma || encuestaModalProyecto.id}`,
                          promedioObtenido: Number(encuestaModalProyecto.calificacionCurso || 5.0)
                        }
                      });
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-semibold text-slate-800"
                  >
                    <option value="Generada">Generada (Lista)</option>
                    <option value="Enviada">Enviada a Estudiantes</option>
                    <option value="Completada">Completada (Resultados listos)</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      const msg = `🎓 *SUMMIT - Encuesta de Satisfacción*\nCurso: ${encuestaModalProyecto.nombreProyecto}\nDocente: ${encuestaModalProyecto.nombreDocente}\nEnlace: https://encuestas.summit.hn/evaluacion?curso=${encuestaModalProyecto.codigoPrograma || encuestaModalProyecto.id}`;
                      navigator.clipboard.writeText(msg);
                      setCopiadoExitoso(true);
                      setTimeout(() => setCopiadoExitoso(false), 2500);
                    }}
                    className="w-full px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 flex items-center justify-center gap-1.5"
                  >
                    {copiadoExitoso ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">¡Copiado al Portapapeles!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-600" />
                        <span>Copiar Mensaje WhatsApp</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Botones de acción del Modal */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEncuestaModalProyecto(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const actualizado: ProyectoEducativo = {
                      ...encuestaModalProyecto,
                      calificacionCurso: encuestaModalProyecto.calificacionCurso || 5.0,
                      encuestaSatisfaccion: {
                        estado: encuestaModalProyecto.encuestaSatisfaccion?.estado || 'Enviada',
                        fechaEnvio: new Date().toISOString().split('T')[0],
                        enlaceEncuesta: `https://encuestas.summit.hn/evaluacion?curso=${encuestaModalProyecto.codigoPrograma || encuestaModalProyecto.id}`,
                        promedioObtenido: Number(encuestaModalProyecto.calificacionCurso || 5.0)
                      }
                    };
                    onGuardarProyecto(actualizado);
                    setEncuestaModalProyecto(null);
                  }}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Guardar y Confirmar Envío
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE ALIMENTACIÓN COMERCIAL COMPLETA */}
      {/* ========================================================================= */}
      {proyectoEditando && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="bg-gradient-to-r from-emerald-950 to-teal-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/30 flex items-center justify-center text-emerald-200">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    Alimentador Comercial & Ventas - SUMMIT
                  </h3>
                  <span className="text-[10px] text-emerald-300">
                    Parámetros de matrícula, embudo, pauta y fases de venta
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProyectoEditando(null)}
                className="text-emerald-200 hover:text-white text-base font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarCambiosComerciales} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Programa en Campaña Comercial
                </label>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 flex justify-between items-center">
                  <span>{proyectoEditando.nombreProyecto}</span>
                  <span className="text-[10px] text-slate-500 font-mono">Docente: {proyectoEditando.nombreDocente}</span>
                </div>
              </div>

              {/* Embudo de Ventas: Leads -> Calificados -> Reservas -> Inscritos */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  1. Embudo de Conversión (Leads & Matrículas)
                </span>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Leads Totales
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={proyectoEditando.leadsGenerados || ''}
                      onChange={(e) => setProyectoEditando({ ...proyectoEditando, leadsGenerados: Number(e.target.value) })}
                      placeholder="Ej: 50"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-blue-900 mb-0.5">
                      Calificados
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={proyectoEditando.prospectosCalificados || ''}
                      onChange={(e) => setProyectoEditando({ ...proyectoEditando, prospectosCalificados: Number(e.target.value) })}
                      placeholder="Ej: 25"
                      className="w-full px-2.5 py-1.5 text-xs bg-blue-50/50 border border-blue-300 rounded-lg font-mono font-bold text-blue-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-amber-900 mb-0.5">
                      Reservas
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={proyectoEditando.cuposReservados || ''}
                      onChange={(e) => setProyectoEditando({ ...proyectoEditando, cuposReservados: Number(e.target.value) })}
                      placeholder="Ej: 10"
                      className="w-full px-2.5 py-1.5 text-xs bg-amber-50/50 border border-amber-300 rounded-lg font-mono font-bold text-amber-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-950 mb-0.5">
                      Inscritos (Pagados) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="4"
                      value={proyectoEditando.alumnosFinal}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setProyectoEditando({ ...proyectoEditando, alumnosFinal: val < 4 ? 4 : val });
                      }}
                      required
                      className="w-full px-2.5 py-1.5 text-xs bg-emerald-50 border border-emerald-400 rounded-lg font-mono font-black text-emerald-950"
                    />
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  * Regla institucional SUMMIT: La base mínima de alumnos para impartir el curso es de 4.
                </span>
              </div>

              {/* Metas, Canal y Publicidad */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Meta de Alumnos (Proyectados) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={proyectoEditando.alumnosProyectados}
                    onChange={(e) => setProyectoEditando({ ...proyectoEditando, alumnosProyectados: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Inversión en Publicidad / Ads (LPS)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={proyectoEditando.gastoPublicidad || ''}
                    onChange={(e) => setProyectoEditando({ ...proyectoEditando, gastoPublicidad: Number(e.target.value) })}
                    placeholder="Ej: 1500"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

              </div>

              {/* Fases Comerciales y Tarifas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fase Comercial Activa
                  </label>
                  <select
                    value={proyectoEditando.faseComercial || 'Venta Regular'}
                    onChange={(e) => setProyectoEditando({ 
                      ...proyectoEditando, 
                      faseComercial: e.target.value as ProyectoEducativo['faseComercial'] 
                    })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-semibold text-slate-800"
                  >
                    <option value="Preventa Early Bird">Preventa Early Bird</option>
                    <option value="Venta Regular">Venta Regular</option>
                    <option value="Cierre Final">Cierre Final</option>
                    <option value="Venta Corporativa">Venta Corporativa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Precio Early Bird (Preventa LPS)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={proyectoEditando.precioEarlyBird || ''}
                    onChange={(e) => setProyectoEditando({ ...proyectoEditando, precioEarlyBird: Number(e.target.value) })}
                    placeholder="Ej: 1400"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fecha Cierre de Venta
                  </label>
                  <input
                    type="date"
                    value={proyectoEditando.fechaVenta}
                    onChange={(e) => setProyectoEditando({ ...proyectoEditando, fechaVenta: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Sección: Comercialización & Estado del Ciclo de Vida */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                  <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Megaphone className="w-3.5 h-3.5 text-emerald-600" />
                    Comercialización & Estado del Ciclo de Vida
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Gerencia Comercial & General
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Método de Venta
                      </label>
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        Gerencia Comercial
                      </span>
                    </div>
                    <select
                      id="select-metodo-venta-comercial"
                      value={proyectoEditando.metodoVenta}
                      onChange={(e) => {
                        const nuevoMetodo = e.target.value as MetodoVenta;
                        const nuevoEstado: EstadoProyecto = proyectoEditando.seLlevoACabo === 'Planificado' ? 'En proceso' : proyectoEditando.seLlevoACabo;
                        setProyectoEditando({ 
                          ...proyectoEditando, 
                          metodoVenta: nuevoMetodo,
                          seLlevoACabo: nuevoEstado
                        });
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Redes sociales">Redes sociales</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Publicidad Paga (Ads)">Publicidad Paga (Ads)</option>
                      <option value="Email Marketing">Email Marketing</option>
                      <option value="Referidos">Referidos</option>
                      <option value="Convenios / Empresas">Convenios / Empresas</option>
                      <option value="Llamadas / Telemarketing">Llamadas / Telemarketing</option>
                      <option value="Página Web">Página Web</option>
                      <option value="Otro">Otro</option>
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Al asignarse por Comercialización, avanza automáticamente a <span className="font-semibold text-amber-700">En proceso</span>.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Se llevó a cabo / Estado
                      </label>
                      <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                        Dictamen Gerencial
                      </span>
                    </div>
                    <select
                      id="select-estado-comercial"
                      value={proyectoEditando.seLlevoACabo}
                      onChange={(e) => setProyectoEditando({ ...proyectoEditando, seLlevoACabo: e.target.value as EstadoProyecto })}
                      className={`w-full px-2.5 py-1.5 text-xs border rounded-lg font-bold ${
                        proyectoEditando.seLlevoACabo === 'Listo' || proyectoEditando.seLlevoACabo === 'Sí' || proyectoEditando.seLlevoACabo === 'Realizar'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : proyectoEditando.seLlevoACabo === 'En proceso' || proyectoEditando.seLlevoACabo === 'En curso'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : proyectoEditando.seLlevoACabo === 'Denegado' || proyectoEditando.seLlevoACabo === 'No' || proyectoEditando.seLlevoACabo === 'Cancelado'
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-purple-50 text-purple-800 border-purple-300'
                      }`}
                    >
                      <option value="Planificado">Planificado (Inicial)</option>
                      <option value="En proceso">En proceso (Comercialización activa)</option>
                      <option value="Listo">Listo (Aprobado para Realizar / Imprimir)</option>
                      <option value="Denegado">Denegado (Rechazado por Gerencia)</option>
                      <option value="Sí">Sí (Completado y ejecutado)</option>
                      <option value="Pospuesto">Pospuesto</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {proyectoEditando.seLlevoACabo === 'Planificado' && 'Inicial: Pendiente de comercialización.'}
                      {proyectoEditando.seLlevoACabo === 'En proceso' && 'En proceso: Comercialización en marcha.'}
                      {proyectoEditando.seLlevoACabo === 'Listo' && 'Listo: Aprobado por Dirección para imprimir y ejecutar.'}
                      {proyectoEditando.seLlevoACabo === 'Denegado' && 'Denegado: No aprobado.'}
                    </p>
                  </div>
                </div>

                {/* Sección: Calificación del Curso & Encuesta de Satisfacción */}
                <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Calificación del Curso & Encuesta de Satisfacción Estudiantil
                    </span>
                    <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-300">
                      Gerencia de Comercialización
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Calificación del Curso (Escala 1.0 - 5.0)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          id="input-calificacion-curso-comercial"
                          type="number"
                          step="0.1"
                          min="1.0"
                          max="5.0"
                          value={proyectoEditando.calificacionCurso || 5.0}
                          onChange={(e) => setProyectoEditando({ ...proyectoEditando, calificacionCurso: Number(e.target.value) })}
                          className="w-24 px-2.5 py-1.5 text-xs bg-white border border-indigo-300 rounded-lg font-bold text-indigo-900 font-mono focus:ring-1 focus:ring-indigo-500"
                        />
                        <div className="flex items-center gap-1 text-amber-500 text-xs">
                          {['★', '★', '★', '★', '★'].map((star, idx) => (
                            <span key={idx} className={idx < Math.round(Number(proyectoEditando.calificacionCurso) || 5) ? 'text-amber-500' : 'text-slate-300'}>
                              ★
                            </span>
                          ))}
                          <span className="text-[11px] font-bold text-slate-700 ml-1">
                            ({proyectoEditando.calificacionCurso || '5.0'} / 5.0)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/90 p-2.5 rounded-lg border border-indigo-100 text-[11px] text-slate-600 flex flex-col justify-center">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">Canal de retroalimentación:</span>
                        <span className="font-semibold text-indigo-700">Encuesta CSAT / NPS</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        La Gerencia Comercial genera el link de evaluación y lo distribuye a los estudiantes vía WhatsApp y correo al finalizar el curso.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observaciones Comerciales & Estrategia
                </label>
                <textarea
                  rows={2}
                  value={proyectoEditando.observaciones || ''}
                  onChange={(e) => setProyectoEditando({ ...proyectoEditando, observaciones: e.target.value })}
                  placeholder="Canales activados, promociones o acuerdos de pago pactados con los prospectos..."
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-800 uppercase font-bold block">Punto de Equilibrio:</span>
                  <span className="font-mono font-bold text-emerald-950">{proyectoEditando.puntoEquilibrioAlumnos} alumnos requeridos</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-800 uppercase font-bold block">Precio por Alumno c/ ISV:</span>
                  <span className="font-mono font-bold text-emerald-950">{formatearMoneda(proyectoEditando.precioSugeridoConISV || proyectoEditando.precioSugeridoAlumno, moneda)}</span>
                </div>
              </div>

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
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Guardar Datos Comerciales
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Modal Centro de Comercialización de Proyectos de Gerencia Académica */}
      {mostrarModalComercializar && (
        <CommercialProjectLauncherModal
          proyectos={proyectos}
          moneda={moneda}
          proyectoInicialId={proyectoParaComercializarId}
          onCerrar={() => {
            setMostrarModalComercializar(false);
            setProyectoParaComercializarId(undefined);
          }}
          onGuardarProyecto={onGuardarProyecto}
          onEditarProyecto={onEditarProyecto}
          onVerDetalle={onVerDetalle}
          onNotificar={onNotificar}
          onAbrirWorkflowStatusModal={onAbrirWorkflowStatusModal}
        />
      )}

      {/* Modal Matrícula Exprés (Fast-Track 30 Segundos) */}
      <QuickEnrollmentModal
        isOpen={mostrarModalMatriculaRapida}
        onClose={() => {
          setMostrarModalMatriculaRapida(false);
          setProyectoMatriculaRapida(null);
        }}
        proyecto={proyectoMatriculaRapida}
        proyectos={proyectos}
        moneda={moneda}
        onGuardarProyecto={onGuardarProyecto}
        onNotificar={onNotificar}
      />

      {/* Modal WhatsApp & Cotizador Rápido con Desglose Fiscal SAR */}
      <QuickQuoteWhatsAppModal
        isOpen={mostrarModalCotizadorWhatsApp}
        onClose={() => {
          setMostrarModalCotizadorWhatsApp(false);
          setProyectoCotizadorWhatsApp(null);
        }}
        proyecto={proyectoCotizadorWhatsApp}
        proyectos={proyectos}
        moneda={moneda}
      />

      {/* Modal Importador Masivo de Leads desde Excel / Google Sheets */}
      <QuickLeadImporterModal
        isOpen={mostrarModalImportadorLeads}
        onClose={() => setMostrarModalImportadorLeads(false)}
        proyectos={proyectos}
        moneda={moneda}
        onGuardarProyecto={onGuardarProyecto}
        onNotificar={onNotificar}
      />

      {/* Modal Plantillas de Correo Institucional B2B / B2C */}
      <CommercialEmailTemplatesModal
        isOpen={mostrarModalEmails}
        onClose={() => setMostrarModalEmails(false)}
        proyectos={proyectos}
        moneda={moneda}
        onNotificar={onNotificar}
      />

      {/* Modal Calculadora de Comisiones y Metas para Asesores */}
      <CommercialAdvisorCommissionCalculatorModal
        isOpen={mostrarModalComisiones}
        onClose={() => setMostrarModalComisiones(false)}
        proyectos={proyectos}
        moneda={moneda}
        onNotificar={onNotificar}
      />

      {/* Modal Cotizador Corporativo B2B Imprimible / PDF */}
      <CommercialCorporateQuoteModal
        isOpen={mostrarModalCotizadorCorporativo}
        onClose={() => setMostrarModalCotizadorCorporativo(false)}
        proyectos={proyectos}
        moneda={moneda}
        onNotificar={onNotificar}
      />

    </div>
  );
};
