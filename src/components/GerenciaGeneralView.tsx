import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  DollarSign, 
  Percent, 
  Receipt, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Edit3, 
  Search, 
  TrendingUp, 
  Scale, 
  Sparkles, 
  ChevronRight, 
  Printer, 
  Download,
  GraduationCap,
  Megaphone,
  Check,
  X,
  Layers,
  ArrowRight,
  BarChart3,
  LayoutDashboard,
  FileSpreadsheet,
  LayoutGrid,
  CalendarDays,
  BookOpen,
  ShieldAlert,
  Flame,
  Mail,
  Target,
  Clock,
  Zap,
  RotateCcw,
  FileCheck,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { 
  crearNotificacionAprobacionGGAComercializacion,
  crearNotificacionRetornoGGAAcademica 
} from '../utils/notificationUtils';
import { ProyectoEducativo, Moneda, TipoServicioFiscal, EstadoProyecto, VistaPrincipal } from '../types';
import { formatearMoneda, calcularMetricasProyecto } from '../utils/calculations';
import { REGLAS_ISV_SERVICIOS, obtenerReglaISVPorServicio } from '../utils/isvRules';
import { SummitLogo } from './SummitLogo';
import { CREDENCIALES_GERENCIAS } from '../utils/gerenciasCredenciales';
import { ExecutiveKPIPanel } from './executive/ExecutiveKPIPanel';
import { ExecutiveDashboardView } from './executive/ExecutiveDashboardView';
import { ProfitabilityControlCenter } from './ProfitabilityControlCenter';
import { SpreadsheetTable } from './SpreadsheetTable';
import { MarginReferenceGuide } from './MarginReferenceGuide';
import { SummaryCards } from './SummaryCards';
import { CardsView } from './CardsView';
import { MonthlyComparisonView } from './MonthlyComparisonView';
import { AnalyticsView } from './AnalyticsView';
import { ISVTaxGuideSection } from './ISVTaxGuideSection';
import { FormulasExplanationGuide } from './FormulasExplanationGuide';
import { InternalAuditorView } from './executive/InternalAuditorView';
import { GrowthProjectionTool } from './executive/GrowthProjectionTool';
import { DocenteRentabilidadHistoricaView } from './executive/DocenteRentabilidadHistoricaView';
import { SegmentosRentabilidadHeatmapView } from './executive/SegmentosRentabilidadHeatmapView';
import { ProjectQuickFilterBar, coincideTipoProyecto, coincideBusquedaInteligente, CriterioBusqueda } from './ProjectQuickFilterBar';
import { SummaryWidgetsSection } from './SummaryWidgetsSection';
import { POAPlanVsRealCard } from './executive/POAPlanVsRealCard';
import { POAMonthlyDeductionTrackingView } from './executive/POAMonthlyDeductionTrackingView';
import { ExecutiveFastApprovalBar } from './executive/ExecutiveFastApprovalBar';
import { 
  emitirAprobacionFinalGerenciaGeneral, 
  revocarAprobacionFinalGerenciaGeneral 
} from '../utils/poaMonthlyTrackingUtils';
import { aprobarInicioDefinitivoYRebajarPOAGG } from '../utils/commercialSlaUtils';
import { validarAprobacionGerenciaGeneral } from '../utils/workflowUtils';
import { WorkflowStatusBadge } from './WorkflowStatusBadge';
import { OfficialSyllabusModal } from './academic/OfficialSyllabusModal';
import { ExecutiveSyllabusReviewView } from './executive/ExecutiveSyllabusReviewView';
import { ColaRevisionProyectosGG } from './executive/ColaRevisionProyectosGG';

export type SubPestanaGeneral = 
  | 'dashboard'
  | 'control_poa'
  | 'revision_silabos'
  | 'mapa_calor'
  | 'rentabilidad_docentes'
  | 'auditor_interno'
  | 'control'
  | 'matriz'
  | 'tarjetas'
  | 'dictamen'
  | 'meses'
  | 'analitica'
  | 'proyeccion'
  | 'isv'
  | 'guia';

interface GerenciaGeneralViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onEditarProyecto: (p: ProyectoEducativo) => void;
  onVerDetalle: (p: ProyectoEducativo) => void;
  onGenerarReportePDF: (p: ProyectoEducativo) => void;
  onGuardarProyecto: (p: ProyectoEducativo) => void;
  onNavegarGerencia?: (gerencia: 'gerencia-academica' | 'gerencia-comercializacion') => void;
  onDuplicarProyecto?: (p: ProyectoEducativo) => void;
  onEliminarProyecto?: (p: ProyectoEducativo) => void;
  onEliminarPorId?: (id: string) => void;
  onActualizarRapido?: (id: string, campo: keyof ProyectoEducativo, valor: any) => void;
  subPestanaInicial?: SubPestanaGeneral;
  onCambiarSubPestana?: (tab: SubPestanaGeneral) => void;
  onFiltrarPorMes?: (mesKey: string) => void;
  mesFiltro?: string;
  onExportarReporteMesPDF?: (mesKey?: string) => void;
  onAbrirTableroPOA?: () => void;
  onAbrirWorkflowStatusModal?: (proyectoId?: string) => void;
  onAbrirComercializarProyecto?: (proyectoId?: string) => void;
  onNotificar?: (mensaje: string) => void;
}

export const GerenciaGeneralView: React.FC<GerenciaGeneralViewProps> = ({
  proyectos,
  moneda,
  onEditarProyecto,
  onVerDetalle,
  onGenerarReportePDF,
  onGuardarProyecto,
  onNavegarGerencia,
  onDuplicarProyecto,
  onEliminarProyecto,
  onEliminarPorId,
  onActualizarRapido,
  subPestanaInicial = 'dashboard',
  onCambiarSubPestana,
  onFiltrarPorMes,
  mesFiltro = 'todos',
  onExportarReporteMesPDF,
  onAbrirTableroPOA,
  onAbrirWorkflowStatusModal,
  onAbrirComercializarProyecto,
  onNotificar,
}) => {
  const [subPestana, setSubPestana] = useState<SubPestanaGeneral>(subPestanaInicial);

  useEffect(() => {
    if (subPestanaInicial) {
      setSubPestana(subPestanaInicial);
    }
  }, [subPestanaInicial]);

  const cambiarSubPestana = (tab: SubPestanaGeneral) => {
    setSubPestana(tab);
    if (onCambiarSubPestana) {
      onCambiarSubPestana(tab);
    }
  };

  const [busqueda, setBusqueda] = useState('');
  const [filtroFiscal, setFiltroFiscal] = useState<string>('todos');
  const [filtroRentabilidad, setFiltroRentabilidad] = useState<string>('todos');
  const [filtroFlujo, setFiltroFlujo] = useState<string>('todos');

  // Modal para retorno de proyecto a Gerencia Académica por corrección financiera
  const [proyectoParaRetornar, setProyectoParaRetornar] = useState<ProyectoEducativo | null>(null);
  const [motivoRetornoGeneral, setMotivoRetornoGeneral] = useState<string>('');

  // Modal para ver la Ficha Completa del Sílabo Oficial para revisión y aprobación
  const [proyectoSilaboModal, setProyectoSilaboModal] = useState<ProyectoEducativo | null>(null);

  // Filtro de revisión de sílabos
  const [filtroRevisionSilabos, setFiltroRevisionSilabos] = useState<'todos' | 'pendientes' | 'corregidos' | 'rechazados' | 'aprobados'>('todos');
  const [busquedaSilabos, setBusquedaSilabos] = useState('');

  // Búsqueda y filtros rápidos de la vista principal para la matriz de proyectos
  const [busquedaMatriz, setBusquedaMatriz] = useState('');
  const [criterioBusquedaMatriz, setCriterioBusquedaMatriz] = useState<CriterioBusqueda>('todos');
  const [filtroTipoMatriz, setFiltroTipoMatriz] = useState<string>('todos');
  const [filtroDocenteMatriz, setFiltroDocenteMatriz] = useState<string>('todos');
  const [filtroEstadoMatriz, setFiltroEstadoMatriz] = useState<string>('todos');
  const [filtroSoloCriticos, setFiltroSoloCriticos] = useState<boolean>(false);

  // Filtrado reactivo e instantáneo para la matriz de proyectos
  const proyectosFiltradosMatriz = useMemo(() => {
    return proyectos.filter((p) => {
      const matchBusqueda = coincideBusquedaInteligente(p, busquedaMatriz, criterioBusquedaMatriz);
      const matchTipo = coincideTipoProyecto(p, filtroTipoMatriz);
      const matchDocente =
        filtroDocenteMatriz === 'todos' ||
        p.nombreDocente.trim().toLowerCase() === filtroDocenteMatriz.trim().toLowerCase();
      const matchEstado = filtroEstadoMatriz === 'todos' || p.seLlevoACabo === filtroEstadoMatriz;
      const matchCriticos =
        !filtroSoloCriticos ||
        p.alumnosFinal < p.puntoEquilibrioAlumnos ||
        p.totalGananciasFinales < 0 ||
        (p.seLlevoACabo === 'Denegado' && p.gastoTotalOperativo > 0);

      return matchBusqueda && matchTipo && matchDocente && matchEstado && matchCriticos;
    });
  }, [proyectos, busquedaMatriz, criterioBusquedaMatriz, filtroTipoMatriz, filtroDocenteMatriz, filtroEstadoMatriz, filtroSoloCriticos]);

  const handleLimpiarFiltrosMatriz = () => {
    setBusquedaMatriz('');
    setCriterioBusquedaMatriz('todos');
    setFiltroTipoMatriz('todos');
    setFiltroDocenteMatriz('todos');
    setFiltroEstadoMatriz('todos');
    setFiltroSoloCriticos(false);
  };

  const handleFiltrarCriticosDesdeWidget = () => {
    setFiltroSoloCriticos(true);
    cambiarSubPestana('matriz');
  };

  // Proyecto en edición ejecutiva
  const [proyectoEditando, setProyectoEditando] = useState<ProyectoEducativo | null>(null);

  // Proyectos en riesgo por debajo de punto de equilibrio
  const proyectosEnRiesgo = useMemo(() => {
    return proyectos.filter(p => p.alumnosFinal < p.puntoEquilibrioAlumnos).length;
  }, [proyectos]);

  // Proyectos pendientes de dictamen de Gerencia General (trasladados desde Académica)
  const proyectosPendientesDictamen = useMemo(() => {
    return proyectos.filter(
      p => p.etapaFlujo === 'revision_gerencia_general' || 
           (!p.aprobadoPorGerenciaGeneralPrevia && !p.rechazadoPorGerenciaGeneral && (p.seLlevoACabo === 'Planificado' || p.seLlevoACabo === 'En proceso'))
    );
  }, [proyectos]);

  // Proyectos corregidos por Académica y reenviados a GG
  const proyectosCorregidosReenviados = useMemo(() => {
    return proyectos.filter(
      p => p.etapaFlujo === 'revision_gerencia_general' && p.corregidoReenviadoRevisionGG
    );
  }, [proyectos]);

  // Proyectos rechazados por Gerencia General (devueltos a Académica)
  const proyectosRechazadosGG = useMemo(() => {
    return proyectos.filter(
      p => p.etapaFlujo === 'rechazado_gerencia_general' || p.rechazadoPorGerenciaGeneral === true
    );
  }, [proyectos]);

  // Proyectos aprobados por GG para comercialización
  const proyectosAprobadosComercial = useMemo(() => {
    return proyectos.filter(
      p => p.etapaFlujo === 'comercializacion' || p.aprobadoPorGerenciaGeneralPrevia === true
    );
  }, [proyectos]);

  const proyectosListos = useMemo(() => {
    return proyectos.filter(p => p.seLlevoACabo === 'Listo' || p.seLlevoACabo === 'Sí' || p.seLlevoACabo === 'Realizar');
  }, [proyectos]);

  // Proyectos cerrados automáticamente por plazo de venta de 20 días calendario cumplido
  const proyectosNoLlevadosACabo = useMemo(() => {
    return proyectos.filter(p => p.seLlevoACabo === 'No se llevó a cabo' || p.procesoCerrado || p.tiempoVentaCumplido);
  }, [proyectos]);

  // Métricas de Dirección General & Finanzas
  const totalInversionGastos = proyectos.reduce((acc, p) => acc + (p.gastoTotalOperativo || 0), 0);
  const totalFacturacionBruta = proyectos.reduce((acc, p) => acc + (p.ingresoTotalConISV || p.ingresoRealTotal), 0);
  const totalIngresoNeto = proyectos.reduce((acc, p) => acc + (p.ingresoTotalNeto || p.ingresoRealTotal), 0);
  const totalISVAlaSAR = proyectos.reduce((acc, p) => acc + (p.isvTotalTrasladarSAR || 0), 0);
  const totalUtilidadNeta = proyectos.reduce((acc, p) => acc + (p.totalGananciasFinales || 0), 0);

  const margenPromedio = proyectos.length > 0
    ? proyectos.reduce((acc, p) => acc + (p.margenGananciaOperativa || 0), 0) / proyectos.length
    : 0;

  const roiPromedio = totalInversionGastos > 0
    ? (totalUtilidadNeta / totalInversionGastos) * 100
    : 0;

  const proyectosRentables = proyectos.filter((p) => p.totalGananciasFinales >= 0).length;
  const proyectosEnPerdida = proyectos.filter((p) => p.totalGananciasFinales < 0).length;

  // Filtrado
  const proyectosFiltrados = useMemo(() => {
    return proyectos.filter((p) => {
      const matchBusqueda = 
        p.nombreProyecto.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.nombreDocente.toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.servicioFiscal && p.servicioFiscal.toLowerCase().includes(busqueda.toLowerCase()));

      let matchFiscal = true;
      if (filtroFiscal === 'grava') matchFiscal = p.aplicaISV === true;
      if (filtroFiscal === 'exento') matchFiscal = p.aplicaISV === false;

      let matchRentabilidad = true;
      if (filtroRentabilidad === 'ganancia') matchRentabilidad = p.totalGananciasFinales >= 0;
      if (filtroRentabilidad === 'perdida') matchRentabilidad = p.totalGananciasFinales < 0;

      let matchFlujo = true;
      if (filtroFlujo === 'pendientes') matchFlujo = p.seLlevoACabo === 'Planificado' || p.seLlevoACabo === 'En proceso';
      if (filtroFlujo === 'listos') matchFlujo = p.seLlevoACabo === 'Listo' || p.seLlevoACabo === 'Sí' || p.seLlevoACabo === 'Realizar';
      if (filtroFlujo === 'no_llevados') matchFlujo = p.seLlevoACabo === 'No se llevó a cabo' || p.procesoCerrado || p.tiempoVentaCumplido;
      if (filtroFlujo === 'denegados') matchFlujo = p.seLlevoACabo === 'Denegado' || p.seLlevoACabo === 'No' || p.seLlevoACabo === 'Cancelado';

      return matchBusqueda && matchFiscal && matchRentabilidad && matchFlujo;
    });
  }, [proyectos, busqueda, filtroFiscal, filtroRentabilidad, filtroFlujo]);

  // Emitir Dictamen Rápido
  const handleEmitirDictamen = (p: ProyectoEducativo, nuevoEstado: EstadoProyecto) => {
    const proyectoActualizado = calcularMetricasProyecto({
      ...p,
      seLlevoACabo: nuevoEstado,
    });
    onGuardarProyecto(proyectoActualizado);
  };

  // Aprobar Viabilidad Financiera de Silabo y Trasladar formalmente a Comercialización
  const handleAprobarViabilidadYTrasladarComercial = (p: ProyectoEducativo, motivo?: string) => {
    const ahora = new Date().toISOString();
    const fechaHoy = new Date().toLocaleDateString('es-HN');
    const motivoFinal = motivo && motivo.trim().length > 0
      ? motivo.trim()
      : `Aprobado por Gerencia General. Dr. Walter Rene Pedroza (${fechaHoy}). Viabilidad pedagógica y financiera con ISV 15% revisada y aprobada formalmente. Sílabo Oficial habilitado para comercialización y venta.`;

    const proyectoActualizado: ProyectoEducativo = {
      ...p,
      etapaFlujo: 'comercializacion',
      aprobadoPorGerenciaGeneralPrevia: true,
      aprobadoGerenciaGeneral: true,
      aprobadoPor: 'Dr. Walter Rene Pedroza - Gerencia General',
      motivoAprobacionGerenciaGeneral: motivoFinal,
      rechazadoPorGerenciaGeneral: false,
      motivoRechazoGerenciaGeneral: undefined,
      fechaAprobacionGerenciaGeneralPrevia: ahora,
      fechaRevisionGerenciaGeneral: fechaHoy,
      fechaEnvioComercializacion: ahora,
      seLlevoACabo: 'Planificado',
      observacionesRevisionGeneral: `Aprobado por Gerencia General. Dr. Walter Rene Pedroza (${fechaHoy}): ${motivoFinal}`,
      registroAuditoria: {
        ...p.registroAuditoria,
        ultimaModificacion: `${fechaHoy} por Dr. Walter Rene Pedroza (Aprobado por Gerencia General)`,
        equipoModifico: 'Gerencia General - Dr. Walter Rene Pedroza',
      }
    };

    const { notificacion, aviso } = crearNotificacionAprobacionGGAComercializacion(
      proyectoActualizado,
      proyectoActualizado.observacionesRevisionGeneral
    );

    proyectoActualizado.avisosProyecto = [aviso, ...(proyectoActualizado.avisosProyecto || [])];

    onGuardarProyecto(proyectoActualizado);

    if (onNotificar) {
      onNotificar(`✅ Sílabo / Proyecto "${p.nombreProyecto}" APROBADO por Gerencia General (Dr. Walter Rene Pedroza) y enviado a Comercialización.`);
    }
  };

  // Retornar Proyecto a Gerencia Académica por Inconsistencia Financiera
  const handleConfirmarRetornoAcademica = () => {
    if (!proyectoParaRetornar) return;
    const ahora = new Date().toISOString();
    const fechaHoy = new Date().toLocaleDateString('es-HN');
    const horaHoy = new Date().toLocaleTimeString('es-HN');
    const motivoFinal = motivoRetornoGeneral.trim() || 'La Gerencia General determinó que el sílabo requiere corrección (costos operativos, tarifa docente o margen de rentabilidad). Se devuelve a Gerencia Académica para su ajuste.';

    const proyectoActualizado: ProyectoEducativo = {
      ...proyectoParaRetornar,
      etapaFlujo: 'rechazado_gerencia_general',
      rechazadoPorGerenciaGeneral: true,
      motivoRechazoGerenciaGeneral: motivoFinal,
      fechaRechazoGerenciaGeneral: ahora,
      aprobadoPorGerenciaGeneralPrevia: false,
      seLlevoACabo: 'Planificado',
      observacionesRevisionGeneral: `RECHAZADO POR GERENCIA GENERAL (${fechaHoy} ${horaHoy}): ${motivoFinal}`,
      fechaModificacion: fechaHoy,
      horaModificacion: horaHoy,
      registroAuditoria: {
        ...proyectoParaRetornar.registroAuditoria,
        ultimaModificacion: `${fechaHoy}, ${horaHoy} por Gerencia General (Rechazado y Devuelto a Académica)`,
        equipoModifico: 'Gerencia General',
      }
    };

    const { notificacion, aviso } = crearNotificacionRetornoGGAAcademica(
      proyectoActualizado,
      motivoFinal
    );

    proyectoActualizado.avisosProyecto = [aviso, ...(proyectoActualizado.avisosProyecto || [])];

    onGuardarProyecto(proyectoActualizado);
    setProyectoParaRetornar(null);
    setMotivoRetornoGeneral('');

    if (onNotificar) {
      onNotificar(`⚠️ Proyecto "${proyectoParaRetornar.nombreProyecto}" RECHAZADO y devuelto a Gerencia Académica.`);
    }
  };

  // Rechazar Sílabo / Proyecto directamente desde Modal de Ficha Oficial
  const handleRechazarDesdeModal = (p: ProyectoEducativo, motivo: string) => {
    const ahora = new Date().toISOString();
    const fechaHoy = new Date().toLocaleDateString('es-HN');
    const horaHoy = new Date().toLocaleTimeString('es-HN');
    const motivoFinal = motivo.trim() || 'La Gerencia General determinó que el sílabo requiere corrección (costos operativos, tarifa docente o margen de rentabilidad).';

    const proyectoActualizado: ProyectoEducativo = {
      ...p,
      etapaFlujo: 'rechazado_gerencia_general',
      rechazadoPorGerenciaGeneral: true,
      motivoRechazoGerenciaGeneral: motivoFinal,
      motivoAprobacionGerenciaGeneral: undefined,
      fechaRechazoGerenciaGeneral: ahora,
      aprobadoPorGerenciaGeneralPrevia: false,
      aprobadoGerenciaGeneral: false,
      seLlevoACabo: 'Planificado',
      observacionesRevisionGeneral: `RECHAZADO POR GERENCIA GENERAL (${fechaHoy} ${horaHoy}): ${motivoFinal}`,
      fechaModificacion: fechaHoy,
      horaModificacion: horaHoy,
      registroAuditoria: {
        ...p.registroAuditoria,
        ultimaModificacion: `${fechaHoy}, ${horaHoy} por Gerencia General (Rechazado y Devuelto a Académica)`,
        equipoModifico: 'Gerencia General',
      }
    };

    const { notificacion, aviso } = crearNotificacionRetornoGGAAcademica(
      proyectoActualizado,
      motivoFinal
    );

    proyectoActualizado.avisosProyecto = [aviso, ...(proyectoActualizado.avisosProyecto || [])];
    onGuardarProyecto(proyectoActualizado);

    if (onNotificar) {
      onNotificar(`⚠️ Proyecto "${p.nombreProyecto}" RECHAZADO y devuelto a Gerencia Académica con la observación.`);
    }
  };

  // Aprobación Final de la Gerencia General & Deducción Mensual POA
  const handleAprobarFinalGG = (p: ProyectoEducativo, motivo?: string) => {
    const proyectoAprobado = aprobarInicioDefinitivoYRebajarPOAGG(
      p,
      'Dr. Walter Rene Pedroza - Gerencia General',
      motivo || 'Aprobado formalmente por Gerencia General tras validar cumplimiento 100% de procesos académicos y comerciales con quórum cubierto (mínimo 6 alumnos). Descuenta meta de facturación mensual del POA SEP - DIC 2026.'
    );
    onGuardarProyecto(proyectoAprobado);
    if (onNotificar) {
      onNotificar(`✅ ¡Aprobación Final de Inicio de Curso & Rebaja de POA imputada para "${p.nombreProyecto}"!`);
    }
  };

  const handleRevocarFinalGG = (p: ProyectoEducativo) => {
    const proyectoRevocado = revocarAprobacionFinalGerenciaGeneral(
      p,
      'Dr. Walter Pedroza - Gerencia General',
      'Aprobación final revocada por la Gerencia General.'
    );
    onGuardarProyecto(proyectoRevocado);
  };

  // Guardar cambios financieros de Gerencia General
  const handleGuardarCambiosEjecutivos = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proyectoEditando) return;
    const proyectoRecalculado = calcularMetricasProyecto(proyectoEditando);
    onGuardarProyecto(proyectoRecalculado);
    setProyectoEditando(null);
  };

  const handleCambiarServicioFiscalModal = (servicio: TipoServicioFiscal) => {
    if (!proyectoEditando) return;
    const regla = obtenerReglaISVPorServicio(servicio);
    setProyectoEditando({
      ...proyectoEditando,
      servicioFiscal: servicio,
      aplicaISV: regla.gravaISV,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Banner de Identidad de Gerencia General */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="bg-white/10 p-2 rounded-2xl border border-white/20 shadow-inner shrink-0">
              <SummitLogo variant="icon" size="md" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 bg-purple-500/30 text-purple-200 border border-purple-400/30 rounded">
                  SUMMIT IMPULSA GLOBAL
                </span>
                <span className="text-xs text-purple-300 font-medium">Dirección Ejecutiva & Finanzas (Paso 3)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                Gerencia General: Dictamen Financiero & Ficha Oficial
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                Supervisión estratégica de rentabilidad, dictamen de proyectos trasladados ('Listo' para imprimir), validación de tarifas docentes y régimen fiscal SAR (ISV 15%).
              </p>

              {/* Líder Oficial y Cuenta Institucional (POA 2026) */}
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-purple-500/40 text-xs font-mono text-purple-200 shadow-2xs">
                  <span className="text-[10px] text-purple-300 font-sans font-semibold">Líder:</span>
                  <span className="font-bold text-white font-sans">{CREDENCIALES_GERENCIAS.administracion.lider}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-purple-500/40 text-xs font-mono text-purple-200 shadow-2xs">
                  <Mail className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[10px] text-purple-300 font-sans font-semibold">Correo:</span>
                  <span className="font-bold text-white select-all">{CREDENCIALES_GERENCIAS.administracion.correo}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/80 border border-purple-400/40 text-xs text-purple-200">
                  <span className="text-[10px] font-bold text-purple-300">POA 2026:</span>
                  <span className="font-bold font-mono text-white">L. 153,600.00</span>
                  <span className="text-[10px] text-purple-300">(33.4% • 13 act.)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Widget de Utilidad Consolidada en Cabecera */}
          <div className="flex items-center gap-3 bg-slate-900/90 p-3 rounded-xl border border-slate-700/80 shrink-0 self-start lg:self-center">
            <TrendingUp className="w-6 h-6 text-purple-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Utilidad Neta Consolidada</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-lg font-black font-mono ${
                  totalUtilidadNeta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {formatearMoneda(totalUtilidadNeta, moneda)}
                </span>
                <span className="text-[10px] text-purple-300">(ROI: {roiPromedio.toFixed(1)}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Acciones Rápidas Directivas Adaptada (Responsive & Sin Desbordamientos) */}
        <div className="mt-4 pt-3.5 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-black tracking-wider bg-purple-400/20 text-purple-300 border border-purple-400/30 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
              <Zap className="w-3.5 h-3.5 text-purple-300 fill-purple-300" />
              <span>Operaciones Directivas en 1 Clic</span>
            </span>
            <span className="text-xs text-slate-300/80 hidden xl:inline">
              Supervisión de rentabilidad, dictamen fiscal SAR y auditoría ejecutiva
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => cambiarSubPestana('dictamen')}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
              title="Revisar y emitir Dictamen Oficial de proyectos listos"
            >
              <Scale className="w-3.5 h-3.5 text-slate-950 shrink-0" />
              <span>Dictamen & Minuta Oficial</span>
            </button>

            <button
              type="button"
              onClick={() => cambiarSubPestana('auditor_interno')}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors border border-emerald-500/50 cursor-pointer"
              title="Auditoría automática de márgenes, tarifas docentes y cumplimiento SAR"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span>Auditor Interno Digital</span>
            </button>

            {onAbrirWorkflowStatusModal && (
              <button
                type="button"
                id="btn-workflow-status-general"
                onClick={() => onAbrirWorkflowStatusModal()}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-indigo-800/80 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors border border-indigo-500/40 cursor-pointer"
                title="Auditar cumplimiento inter-gerencial, nivel de flujo y tiempos"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-200 shrink-0" />
                <span>Nivel & Status</span>
              </button>
            )}

            <button
              type="button"
              id="btn-revisar-silabos-cabecera"
              onClick={() => cambiarSubPestana('revision_silabos')}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
              title="Revisar fichas completas de sílabos, validar costos, aprobar y enviar a Comercialización o rechazar"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>Ficha Completa de Sílabos</span>
              {proyectosPendientesDictamen.length > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 text-[10px] rounded-full font-black">
                  {proyectosPendientesDictamen.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => cambiarSubPestana('control_poa')}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-purple-800 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors border border-purple-500/50 cursor-pointer"
              title="Control del POA 2026 y metas de facturación institucional"
            >
              <FileCheck className="w-3.5 h-3.5 text-purple-300 shrink-0" />
              <span>Control POA 2026</span>
            </button>
          </div>
        </div>

        {/* 4 KPIs Clave de Finanzas & Tributación */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[11px] font-semibold text-slate-300 block">Inversión Operativa</span>
            <div className="text-xl sm:text-2xl font-black text-amber-300 mt-0.5 font-mono">
              {formatearMoneda(totalInversionGastos, moneda)}
            </div>
            <span className="text-[10px] text-slate-400">Costos autorizados</span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[11px] font-semibold text-slate-300 block">Ingreso Neto SUMMIT</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-300 mt-0.5 font-mono">
              {formatearMoneda(totalIngresoNeto, moneda)}
            </div>
            <span className="text-[10px] text-slate-400">Ingreso antes de costos</span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[11px] font-semibold text-slate-300 block">Obligación SAR ISV</span>
            <div className="text-xl sm:text-2xl font-black text-blue-300 mt-0.5 font-mono">
              {formatearMoneda(totalISVAlaSAR, moneda)}
            </div>
            <span className="text-[10px] text-slate-400">15% a remitir a SAR</span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[11px] font-semibold text-slate-300 block">Dictamen de Cartera</span>
            <div className="text-xs font-bold text-white mt-1 space-y-0.5">
              <div className="text-emerald-300">✅ {proyectosListos.length} listos para imprimir</div>
              <div className="text-amber-300">⏳ {proyectosPendientesDictamen.length} en evaluación</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjeta Ejecutiva Comparativa: Plan Cuatrimestral POA SEP - DIC 2026 vs Realidad Operativa */}
      <POAPlanVsRealCard
        proyectos={proyectos}
        moneda={moneda}
        onAbrirTableroPOA={onAbrirTableroPOA || (() => {})}
      />

      {/* Panel de Indicadores Clave (KPIs Ejecutivos) */}
      <ExecutiveKPIPanel
        proyectos={proyectos}
        moneda={moneda}
        onIrAControl={() => cambiarSubPestana('control')}
        onIrAComercializacion={() => onNavegarGerencia && onNavegarGerencia('gerencia-comercializacion')}
        onIrAAuditor={() => cambiarSubPestana('auditor_interno')}
      />

      {/* Selector de Pestañas de la Gerencia General */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          onClick={() => cambiarSubPestana('dashboard')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            subPestana === 'dashboard'
              ? 'bg-purple-900 text-white shadow-xs border border-purple-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white border border-slate-200'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-purple-300" />
          <span>Dashboard Ejecutivo</span>
        </button>

        {/* SUBPESTAÑA PRIORITARIA: COLA DE REVISIÓN Y DICTAMEN DE SÍLABOS */}
        <button
          id="btn-subpestana-cola-revision-gg"
          type="button"
          onClick={() => cambiarSubPestana('revision_silabos')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
            subPestana === 'revision_silabos'
              ? 'bg-gradient-to-r from-purple-800 to-indigo-900 text-white shadow-md border border-purple-600 ring-2 ring-purple-400 font-black'
              : 'text-purple-950 hover:text-purple-900 hover:bg-purple-100/70 bg-purple-50 border border-purple-300'
          }`}
          title="Cola de proyectos pendientes de revisión por Gerencia General (Aprobar o Rechazar con motivo obligatorio)"
        >
          <Clock className="w-3.5 h-3.5 text-purple-600" />
          <span>📋 Cola de Revisión de Sílabos</span>
          {proyectos.filter(p => !p.aprobadoPorGerenciaGeneralPrevia && !p.rechazadoPorGerenciaGeneral).length > 0 && (
            <span className="px-1.5 py-0.2 bg-purple-700 text-white text-[10px] rounded-full font-mono font-black animate-pulse shadow-xs">
              {proyectos.filter(p => !p.aprobadoPorGerenciaGeneralPrevia && !p.rechazadoPorGerenciaGeneral).length}
            </span>
          )}
        </button>

        <button
          id="btn-tab-control-poa-mensual"
          type="button"
          onClick={() => cambiarSubPestana('control_poa')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
            subPestana === 'control_poa'
              ? 'bg-gradient-to-r from-emerald-800 to-indigo-900 text-white shadow-xs border border-emerald-600 ring-2 ring-emerald-500/30'
              : 'text-slate-700 hover:text-slate-900 hover:bg-emerald-50 bg-white border border-emerald-200'
          }`}
        >
          <Target className="w-3.5 h-3.5 text-emerald-500" />
          <span>POA 2026: Rebaja Mensual</span>
          <span className="px-1.5 py-0.2 bg-emerald-600 text-white text-[10px] rounded-full font-black">
            Rebaja Oficial
          </span>
        </button>

        <button
          id="btn-tab-mapa-calor-gerencia"
          type="button"
          onClick={() => cambiarSubPestana('mapa_calor')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
            subPestana === 'mapa_calor'
              ? 'bg-orange-600 text-white shadow-xs border border-orange-500 ring-2 ring-orange-400/30'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white border border-slate-200'
          }`}
        >
          <Flame className={`w-3.5 h-3.5 ${subPestana === 'mapa_calor' ? 'text-white' : 'text-orange-500'}`} />
          <span>Mapa de Calor</span>
          <span className="px-1.5 py-0.2 bg-orange-700 text-white text-[10px] rounded-full font-black">
            Nivel × Tipo
          </span>
        </button>

        <button
          id="btn-tab-rentabilidad-docentes"
          type="button"
          onClick={() => cambiarSubPestana('rentabilidad_docentes')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
            subPestana === 'rentabilidad_docentes'
              ? 'bg-purple-900 text-white shadow-xs border border-purple-800 ring-2 ring-purple-500/30'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white border border-slate-200'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
          <span>Rentabilidad por Docente</span>
          <span className="px-1.5 py-0.2 bg-indigo-600 text-white text-[10px] rounded-full font-black">
            Historial
          </span>
        </button>

        <button
          type="button"
          onClick={() => cambiarSubPestana('auditor_interno')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            subPestana === 'auditor_interno'
              ? 'bg-emerald-900 text-white shadow-xs border border-emerald-800 ring-2 ring-emerald-500/30'
              : 'text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
          <span>Auditor Interno Digital</span>
          <span className="px-1.5 py-0.2 bg-emerald-600 text-white text-[10px] rounded-full font-black">
            Automático
          </span>
        </button>

        <button
          type="button"
          onClick={() => cambiarSubPestana('control')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            subPestana === 'control'
              ? 'bg-purple-900 text-white shadow-xs border border-purple-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Control 360°</span>
          {proyectosEnRiesgo > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          )}
        </button>

        <button
          type="button"
          onClick={() => cambiarSubPestana('matriz')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            subPestana === 'matriz'
              ? 'bg-purple-900 text-white shadow-xs border border-purple-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white border border-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          <span>Matriz Maestra</span>
        </button>

        <button
          type="button"
          onClick={() => cambiarSubPestana('tarjetas')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            subPestana === 'tarjetas'
              ? 'bg-purple-900 text-white shadow-xs border border-purple-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white border border-slate-200'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
          <span>Fichas / Tarjetas</span>
        </button>

        {/* SUBPESTAÑA REVISIÓN DE SÍLABOS & PROYECTOS (CICLO SUMMIT) */}
        <button
          type="button"
          id="btn-subpestana-revision-silabos"
          onClick={() => cambiarSubPestana('revision_silabos')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
            subPestana === 'revision_silabos'
              ? 'bg-gradient-to-r from-purple-800 to-indigo-900 text-white shadow-md border border-purple-600 ring-2 ring-purple-400 font-black'
              : 'text-purple-950 hover:text-purple-900 hover:bg-purple-100/70 bg-purple-50 border border-purple-200'
          }`}
          title="Ver Ficha Completa de Sílabos y Proyectos para Dictamen Ejecutivo"
        >
          <BookOpen className="w-4 h-4 text-purple-600" />
          <span>📄 Ficha Completa Sílabos</span>
          {proyectosPendientesDictamen.length > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 text-[10px] rounded-full font-black animate-pulse">
              {proyectosPendientesDictamen.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => cambiarSubPestana('dictamen')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            subPestana === 'dictamen'
              ? 'bg-purple-900 text-white shadow-xs border border-purple-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white border border-slate-200'
          }`}
        >
          <Scale className="w-3.5 h-3.5 text-amber-400" />
          <span>Dictamen & Fiscal ({proyectos.length})</span>
          {proyectosPendientesDictamen.length > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[10px] rounded-full font-black">
              {proyectosPendientesDictamen.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => cambiarSubPestana('meses')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            subPestana === 'meses'
              ? 'bg-purple-900 text-white shadow-xs border border-purple-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white border border-slate-200'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5 text-blue-400" />
          <span>Comparativa Mensual</span>
        </button>

        <button
          type="button"
          onClick={() => cambiarSubPestana('analitica')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            subPestana === 'analitica'
              ? 'bg-purple-900 text-white shadow-xs border border-purple-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white border border-slate-200'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
          <span>Analítica & Métricas</span>
        </button>

        <button
          id="btn-tab-proyeccion-crecimiento"
          type="button"
          onClick={() => cambiarSubPestana('proyeccion')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            subPestana === 'proyeccion'
              ? 'bg-purple-900 text-white shadow-xs border border-purple-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white border border-slate-200'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
          <span>Proyección Crecimiento</span>
        </button>

        <button
          type="button"
          onClick={() => cambiarSubPestana('isv')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            subPestana === 'isv'
              ? 'bg-purple-900 text-white shadow-xs border border-purple-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white border border-slate-200'
          }`}
        >
          <Receipt className="w-3.5 h-3.5 text-amber-400" />
          <span>Régimen SAR ISV 15%</span>
        </button>

        <button
          type="button"
          onClick={() => cambiarSubPestana('guia')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            subPestana === 'guia'
              ? 'bg-purple-900 text-white shadow-xs border border-purple-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white border border-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-purple-400" />
          <span>Fórmulas & Guía</span>
        </button>
      </div>

      {/* Centro de Aprobación Rápida en 1 Clic y Minuta POA (Gerencia General) */}
      <ExecutiveFastApprovalBar
        proyectos={proyectos}
        moneda={moneda}
        onGuardarProyecto={onGuardarProyecto}
        onNotificar={onNotificar}
        esGGAutorizada={true}
      />

      {/* Barra de Búsqueda con Filtros Rápidos de la Vista Principal */}
      <ProjectQuickFilterBar
        proyectos={proyectos}
        busqueda={busquedaMatriz}
        onBusquedaChange={setBusquedaMatriz}
        criterioActivo={criterioBusquedaMatriz}
        onCriterioActivoChange={setCriterioBusquedaMatriz}
        filtroTipo={filtroTipoMatriz}
        onFiltroTipoChange={setFiltroTipoMatriz}
        filtroDocente={filtroDocenteMatriz}
        onFiltroDocenteChange={setFiltroDocenteMatriz}
        filtroEstado={filtroEstadoMatriz}
        onFiltroEstadoChange={setFiltroEstadoMatriz}
        totalFiltrados={proyectosFiltradosMatriz.length}
        onLimpiarFiltros={handleLimpiarFiltrosMatriz}
        mostrarBotonIrAMatriz={subPestana !== 'matriz'}
        onIrAMatriz={() => cambiarSubPestana('matriz')}
      />

      {/* NUEVA SECCIÓN DE WIDGETS DE RESUMEN (KPIs Clave: Ingresos Proyectados, Margen Mes Actual, Tasa Crítica) */}
      <SummaryWidgetsSection
        proyectos={proyectos}
        moneda={moneda}
        onFiltrarCriticos={handleFiltrarCriticosDesdeWidget}
        onIrAMatriz={() => cambiarSubPestana('matriz')}
        mesFiltroActivo={mesFiltro}
        onCambiarMesFiltro={onFiltrarPorMes}
      />

      {/* Banner Informativo si se activó el filtro de proyectos críticos desde el widget */}
      {filtroSoloCriticos && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 px-4 flex items-center justify-between gap-3 text-xs shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
            <span className="text-rose-900 font-semibold">
              Filtro Activo: Mostrando únicamente proyectos críticos o en déficit operativo ({proyectosFiltradosMatriz.length} programas identificados)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setFiltroSoloCriticos(false)}
            className="text-rose-700 hover:text-rose-900 font-bold underline cursor-pointer text-xs"
          >
            Quitar filtro de críticos
          </button>
        </div>
      )}

      {/* VISTA 1: DASHBOARD EJECUTIVO */}
      {subPestana === 'dashboard' && (
        <div className="space-y-6">
          {/* COLA DE REVISIÓN Y DICTAMEN DE SÍLABOS PENDIENTES */}
          <ColaRevisionProyectosGG
            proyectos={proyectos}
            moneda={moneda}
            onVerFichaCompleta={(p) => setProyectoSilaboModal(p)}
            onAprobarProyecto={(p, motivo) => handleAprobarViabilidadYTrasladarComercial(p, motivo)}
            onRechazarProyecto={(p, motivo) => handleRechazarDesdeModal(p, motivo)}
            onAprobarInicioDefinitivoYRebajarPOA={handleAprobarFinalGG}
            onAbrirComercializarProyecto={onAbrirComercializarProyecto}
            titulo="Cola Prioritaria de Revisión & Dictamen (Gerencia General)"
            subtitulo="Proyectos remitidos por Gerencia Académica que requieren aprobación ejecutiva obligatoria antes de trasladarse a Comercialización."
          />

          <ExecutiveDashboardView
            proyectos={proyectos}
            moneda={moneda}
            onVerDetalle={onVerDetalle}
            onEditarProyecto={onEditarProyecto}
          />
        </div>
      )}

      {/* VISTA: CUMPLIMIENTO MENSUAL POA & REBAJA DE FACTURACIÓN */}
      {subPestana === 'control_poa' && (
        <div className="space-y-6">
          <POAMonthlyDeductionTrackingView
            proyectos={proyectos}
            moneda={moneda}
            onGuardarProyecto={onGuardarProyecto}
            onVerDetalle={onVerDetalle}
            onEditarProyecto={onEditarProyecto}
            filtroMesInicial={mesFiltro}
          />
        </div>
      )}

      {/* VISTA: MAPA DE CALOR (HEATMAP) DE RENTABILIDAD POR NIVEL Y TIPO */}
      {subPestana === 'mapa_calor' && (
        <div className="space-y-6">
          <SegmentosRentabilidadHeatmapView
            proyectos={proyectos}
            moneda={moneda}
            onVerDetalle={onVerDetalle}
            onEditarProyecto={onEditarProyecto}
            embedded={false}
          />
        </div>
      )}

      {/* VISTA: TENDENCIA DE RENTABILIDAD POR DOCENTE */}
      {subPestana === 'rentabilidad_docentes' && (
        <div className="space-y-6">
          <DocenteRentabilidadHistoricaView
            proyectos={proyectos}
            moneda={moneda}
            onVerDetalle={onVerDetalle}
            onEditarProyecto={onEditarProyecto}
          />
        </div>
      )}

      {/* VISTA AUDITOR INTERNO DIGITAL */}
      {subPestana === 'auditor_interno' && (
        <div className="space-y-6">
          <InternalAuditorView
            proyectos={proyectos}
            moneda={moneda}
            onEditarProyecto={onEditarProyecto}
            onVerDetalle={onVerDetalle}
            onNavegarGerencia={onNavegarGerencia}
          />
        </div>
      )}

      {/* VISTA 2: CENTRO DE CONTROL 360° */}
      {subPestana === 'control' && (
        <div className="space-y-6">
          <ProfitabilityControlCenter
            proyectos={proyectos}
            moneda={moneda}
            onEditar={onEditarProyecto}
            onVerDetalle={onVerDetalle}
            onActualizarRapido={onActualizarRapido || (() => {})}
            onExportarPDF={onGenerarReportePDF}
          />
        </div>
      )}

      {/* VISTA 3: MATRIZ MAESTRA DE CÁLCULO */}
      {subPestana === 'matriz' && (
        <div className="space-y-6">
          <SummaryCards proyectos={proyectosFiltradosMatriz} moneda={moneda} />
          <SpreadsheetTable
            proyectos={filtroSoloCriticos ? proyectosFiltradosMatriz : proyectos}
            moneda={moneda}
            onEditar={onEditarProyecto}
            onVerDetalle={onVerDetalle}
            onDuplicar={onDuplicarProyecto || (() => {})}
            onEliminar={(id) => onEliminarPorId ? onEliminarPorId(id) : undefined}
            onActualizarRapido={onActualizarRapido || (() => {})}
            onExportarPDF={onGenerarReportePDF}
            mesFiltro={mesFiltro}
            onExportarReporteMes={onExportarReporteMesPDF}
            busqueda={busquedaMatriz}
            onBusquedaChange={setBusquedaMatriz}
            filtroTipo={filtroTipoMatriz}
            onFiltroTipoChange={setFiltroTipoMatriz}
            filtroDocente={filtroDocenteMatriz}
            onFiltroDocenteChange={setFiltroDocenteMatriz}
            filtroEstado={filtroEstadoMatriz}
            onFiltroEstadoChange={setFiltroEstadoMatriz}
            onLimpiarFiltros={handleLimpiarFiltrosMatriz}
            ocultarBarraFiltrosInterna={true}
          />
          <MarginReferenceGuide />
        </div>
      )}

      {/* VISTA 4: FICHAS / TARJETAS */}
      {subPestana === 'tarjetas' && (
        <div className="space-y-6">
          <CardsView
            proyectos={proyectosFiltradosMatriz}
            moneda={moneda}
            onEditar={onEditarProyecto}
            onVerDetalle={onVerDetalle}
            onDuplicar={onDuplicarProyecto || (() => {})}
            onEliminar={onEliminarProyecto || (() => {})}
            onExportarPDF={onGenerarReportePDF}
          />
        </div>
      )}

      {/* VISTA DE REVISIÓN Y APROBACIÓN DE SÍLABOS & PROYECTOS (CICLO SUMMIT) */}
      {subPestana === 'revision_silabos' && (
        <div className="space-y-8">
          <ColaRevisionProyectosGG
            proyectos={proyectos}
            moneda={moneda}
            onVerFichaCompleta={(p) => setProyectoSilaboModal(p)}
            onAprobarProyecto={(p, motivo) => handleAprobarViabilidadYTrasladarComercial(p, motivo)}
            onRechazarProyecto={(p, motivo) => handleRechazarDesdeModal(p, motivo)}
            onAprobarInicioDefinitivoYRebajarPOA={handleAprobarFinalGG}
            onAbrirComercializarProyecto={onAbrirComercializarProyecto}
          />

          <div className="pt-6 border-t border-slate-200">
            <h4 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              <span>Matriz Detallada de Comparativa Financiera de Sílabos</span>
            </h4>
            <ExecutiveSyllabusReviewView
              proyectos={proyectos}
              moneda={moneda}
              onVerFichaCompleta={(p) => setProyectoSilaboModal(p)}
              onAprobarViabilidad={(p) => handleAprobarViabilidadYTrasladarComercial(p)}
              onRechazarProyecto={(p) => setProyectoParaRetornar(p)}
              onAbrirAjusteFinanciero={(p) => setProyectoEditando(p)}
              onAbrirComercializarProyecto={onAbrirComercializarProyecto}
            />
          </div>
        </div>
      )}

      {/* VISTA 2: DICTAMEN & CONTROL FISCAL SAR */}
      {subPestana === 'dictamen' && (
        <div className="space-y-6">
          {/* Alerta / Handoff Banner de Proyectos Trasladados */}
          {proyectosPendientesDictamen.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {proyectosPendientesDictamen.length}
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Proyectos Trasladados Pendientes de Dictamen Financiero
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Hay {proyectosPendientesDictamen.length} programas trasladados desde Académica y Comercialización en espera de dictamen 'Listo' para autorizar su ejecución e impresión oficial.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFiltroFlujo('pendientes')}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors shrink-0 flex items-center gap-1.5"
              >
                <span>Filtrar Pendientes ({proyectosPendientesDictamen.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Banner de Control: Proyectos Cerrados por Plazo de Venta (20 Días Calendario) */}
          {proyectosNoLlevadosACabo.length > 0 && (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {proyectosNoLlevadosACabo.length}
                </div>
                <div>
                  <h4 className="text-xs font-black text-rose-950 uppercase tracking-wide flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    Control Institucional: Proyectos que No se Llevaron a Cabo ({proyectosNoLlevadosACabo.length})
                  </h4>
                  <p className="text-xs text-rose-800 mt-0.5">
                    Programas con plazo de comercialización vencido (20 días calendario) registrados formalmente como cerrados sin ejecución.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFiltroFlujo('no_llevados')}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors shrink-0 flex items-center gap-1.5"
              >
                <span>Ver Cerrados ({proyectosNoLlevadosACabo.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Barra de Filtros y Búsqueda */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por proyecto, docente o servicio fiscal..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Filtro Flujo Dictamen */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-medium">Dictamen:</span>
                <select
                  value={filtroFlujo}
                  onChange={(e) => setFiltroFlujo(e.target.value)}
                  className="px-2 py-1 bg-purple-50 border border-purple-300 text-purple-950 rounded-lg text-xs font-bold"
                >
                  <option value="todos">Todos ({proyectos.length})</option>
                  <option value="pendientes">⏳ Pendientes de Dictamen ({proyectosPendientesDictamen.length})</option>
                  <option value="listos">✅ Aprobados 'Listo' ({proyectosListos.length})</option>
                  <option value="no_llevados">⏹️ No se llevaron a cabo ({proyectosNoLlevadosACabo.length})</option>
                  <option value="denegados">❌ Denegados</option>
                </select>
              </div>

              {/* Filtro Fiscal */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-medium">SAR ISV:</span>
                <select
                  value={filtroFiscal}
                  onChange={(e) => setFiltroFiscal(e.target.value)}
                  className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                >
                  <option value="todos">Todos los Regímenes</option>
                  <option value="grava">Grava 15% ISV</option>
                  <option value="exento">Exento (0% ISV)</option>
                </select>
              </div>

              {/* Filtro Rentabilidad */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-medium">Resultado:</span>
                <select
                  value={filtroRentabilidad}
                  onChange={(e) => setFiltroRentabilidad(e.target.value)}
                  className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                >
                  <option value="todos">Todos los Resultados</option>
                  <option value="ganancia">Con Ganancia (Rentable)</option>
                  <option value="perdida">Con Pérdida (Déficit)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabla Financiera y Fiscal de Gerencia General */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                  Control Financiero, Tarifas & Dictamen Fiscal ({proyectosFiltrados.length})
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Paso 3 del flujo institucional: Dictamen oficial de rentabilidad
              </span>
            </div>

            {proyectosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <Building2 className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-medium">No hay proyectos que coincidan con los filtros ejecutivos.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-900 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Proyecto / Docente</th>
                      <th className="py-2.5 px-3 text-center">Estado / Dictamen</th>
                      <th className="py-2.5 px-3 text-center">Gasto Total</th>
                      <th className="py-2.5 px-3 text-center">Régimen SAR</th>
                      <th className="py-2.5 px-3 text-center">Punto Equilibrio</th>
                      <th className="py-2.5 px-3 text-center">Utilidad Final</th>
                      <th className="py-2.5 px-3 text-center">ROI (%)</th>
                      <th className="py-2.5 px-3 text-center">Aprobación GG & POA</th>
                      <th className="py-2.5 px-3 text-right">Dictamen & Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {proyectosFiltrados.map((p) => {
                      const esRentable = p.totalGananciasFinales >= 0;
                      const esListo = p.seLlevoACabo === 'Listo' || p.seLlevoACabo === 'Sí' || p.seLlevoACabo === 'Realizar';
                      const esPendiente = p.seLlevoACabo === 'Planificado' || p.seLlevoACabo === 'En proceso';
                      const facturacionHNL = (p.montoFacturacionAprobadaHNL || ((p.ingresoRealTotal || 0) * (moneda === 'USD' ? 27 : 1)));

                      return (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          
                          {/* Proyecto */}
                          <td className="py-3 px-3 max-w-xs">
                            <div className="font-bold text-slate-900 hover:text-purple-700 cursor-pointer" onClick={() => onVerDetalle(p)}>
                              {p.nombreProyecto}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Docente: <strong className="text-slate-700">{p.nombreDocente}</strong> ({p.horasClase} hrs) • Canal: <span className="font-medium text-emerald-800">{p.metodoVenta || 'Por definir'}</span>
                            </div>
                          </td>

                          {/* Estado Dictamen & Nivel Flujo */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <WorkflowStatusBadge 
                                proyecto={p} 
                                onClick={onAbrirWorkflowStatusModal ? () => onAbrirWorkflowStatusModal(p.id) : undefined} 
                              />
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                esListo
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : p.seLlevoACabo === 'No se llevó a cabo'
                                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                  : p.seLlevoACabo === 'En proceso'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : p.seLlevoACabo === 'Denegado'
                                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                  : 'bg-blue-100 text-blue-900 border border-blue-300'
                              }`}>
                                {esListo 
                                  ? '✅ Listo (Aprobado)' 
                                  : p.seLlevoACabo === 'No se llevó a cabo'
                                  ? '⏹️ No se llevó a cabo'
                                  : p.seLlevoACabo === 'En proceso' 
                                  ? '⏳ Comercialización' 
                                  : p.seLlevoACabo === 'Denegado' 
                                  ? '❌ Denegado' 
                                  : '📋 Planificado'}
                              </span>
                            </div>
                          </td>

                          {/* Gasto Operativo */}
                          <td className="py-3 px-3 text-center font-mono font-bold text-amber-800">
                            {formatearMoneda(p.gastoTotalOperativo, moneda)}
                          </td>

                          {/* Régimen SAR */}
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.aplicaISV
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            }`}>
                              {p.aplicaISV ? 'Grava 15%' : 'Exento (0%)'}
                            </span>
                          </td>

                          {/* Punto Equilibrio */}
                          <td className="py-3 px-3 text-center font-mono font-semibold text-slate-700">
                            {p.puntoEquilibrioAlumnos} alum.
                            <span className="text-[10px] text-slate-500 block">
                              (Inscritos: {p.alumnosFinal})
                            </span>
                          </td>

                          {/* Utilidad Final */}
                          <td className="py-3 px-3 text-center font-mono font-bold">
                            <span className={`text-xs ${esRentable ? 'text-emerald-700 font-bold' : 'text-rose-600'}`}>
                              {formatearMoneda(p.totalGananciasFinales, moneda)}
                            </span>
                          </td>

                          {/* ROI */}
                          <td className="py-3 px-3 text-center font-mono font-bold">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                              p.roiPorcentaje >= 30
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.roiPorcentaje >= 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {p.roiPorcentaje.toFixed(1)}%
                            </span>
                          </td>

                          {/* Aprobación Final GG & Rebaja POA */}
                          <td className="py-3 px-3 text-center">
                            {p.aprobacionFinalGerenciaGeneral ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded-full text-[10px] font-black border border-emerald-300">
                                  <ShieldCheck className="w-3 h-3 text-emerald-700" />
                                  <span>Aprobado GG</span>
                                </span>
                                <span className="text-[9px] text-emerald-700 font-bold mt-0.5">
                                  -L. {facturacionHNL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRevocarFinalGG(p)}
                                  className="text-[9px] text-rose-600 hover:text-rose-800 underline mt-0.5 font-semibold cursor-pointer"
                                  title="Revocar aprobación final de Gerencia General"
                                >
                                  Revocar
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex flex-col items-center">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full text-[10px] font-bold border border-amber-300">
                                  <Clock className="w-3 h-3 text-amber-700" />
                                  <span>Pendiente GG</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleAprobarFinalGG(p)}
                                  className="mt-1 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                                  title="Emitir Aprobación Final y descontar de la meta mensual del POA"
                                >
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>Aprobar & Rebajar</span>
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Acciones */}
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              
                              {/* Botón: Ver Ficha Completa del Sílabo o Proyecto */}
                              <button
                                type="button"
                                id={`btn-ver-ficha-silabo-${p.id}`}
                                onClick={() => setProyectoSilaboModal(p)}
                                className="px-2 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                                title="Ver Ficha Completa del Sílabo Oficial para revisión de costos, temas, docentes y firmas"
                              >
                                <FileText className="w-3 h-3 text-purple-200" />
                                <span>Ficha Sílabo</span>
                              </button>

                              {/* Botón: Aprobar Viabilidad y Trasladar a Comercialización */}
                              {(!p.aprobadoPorGerenciaGeneralPrevia || p.etapaFlujo === 'revision_gerencia_general') ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleAprobarViabilidadYTrasladarComercial(p)}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                                    title="Aprobar viabilidad de costos y margen. Trasladar formalmente a Comercialización"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Aprobar Viabilidad</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setProyectoParaRetornar(p)}
                                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                    title="Regresar a Gerencia Académica si no ve bien la parte financiera"
                                  >
                                    <RotateCcw className="w-3 h-3 text-rose-600" />
                                    <span>Regresar a Académica</span>
                                  </button>
                                </>
                              ) : (
                                !esListo && (
                                  <button
                                    type="button"
                                    onClick={() => handleEmitirDictamen(p, 'Listo')}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                                    title="Marcar proyecto como 'Listo'"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Aprobar 'Listo'</span>
                                  </button>
                                )
                              )}

                              {/* Botón de Imprimir Ficha Oficial cuando está Listo */}
                              {esListo && (
                                <button
                                  type="button"
                                  onClick={() => onGenerarReportePDF(p)}
                                  className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
                                  title="Imprimir Dictamen Oficial con 3 firmas institucionales"
                                >
                                  <Printer className="w-3 h-3" />
                                  <span>Ficha Oficial</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setProyectoEditando(p)}
                                className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded text-[10px] font-bold flex items-center gap-1 transition-colors"
                                title="Ajustar parámetros financieros y fiscales"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Ajustar</span>
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

      {/* VISTA 6: COMPARATIVA MENSUAL */}
      {subPestana === 'meses' && (
        <div className="space-y-6">
          <MonthlyComparisonView
            proyectos={proyectos}
            moneda={moneda}
            onFiltrarPorMes={(mesKey) => {
              if (onFiltrarPorMes) onFiltrarPorMes(mesKey);
              cambiarSubPestana('matriz');
            }}
            onVerProyectoDetalle={onVerDetalle}
            onExportarReporteMesPDF={onExportarReporteMesPDF}
            onGuardarProyecto={onGuardarProyecto}
          />
        </div>
      )}

      {/* VISTA 7: ANALÍTICA & MÉTRICAS */}
      {subPestana === 'analitica' && (
        <div className="space-y-6">
          <AnalyticsView proyectos={proyectos} moneda={moneda} />
        </div>
      )}

      {/* VISTA: PROYECCIÓN DE CRECIMIENTO & SIMULADOR FINANCIERO */}
      {subPestana === 'proyeccion' && (
        <div className="space-y-6">
          <GrowthProjectionTool proyectos={proyectos} moneda={moneda} />
        </div>
      )}

      {/* VISTA 8: RÉGIMEN FISCAL SAR (ISV 15%) */}
      {subPestana === 'isv' && (
        <div className="space-y-6">
          <ISVTaxGuideSection moneda={moneda} proyectos={proyectos} />
        </div>
      )}

      {/* VISTA 9: GUÍA DE FÓRMULAS & GLOSARIO */}
      {subPestana === 'guia' && (
        <div className="space-y-6">
          <FormulasExplanationGuide moneda={moneda} tabInicial="formulas" />
        </div>
      )}

      {/* Modal de Ajuste Financiero & Fiscal de Gerencia General */}
      {proyectoEditando && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="bg-slate-950 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-sm">
                  Dictamen & Parámetros Financieros - Gerencia General
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setProyectoEditando(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarCambiosEjecutivos} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Proyecto en Dictamen
                </label>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900">
                  {proyectoEditando.nombreProyecto}
                </div>
              </div>

              {/* Dictamen de Estado */}
              <div className="bg-purple-50/70 p-3 rounded-xl border border-purple-200 space-y-2">
                <label className="block text-xs font-bold text-purple-950">
                  Dictamen Ejecutivo / Estado de Ejecución
                </label>
                <select
                  value={proyectoEditando.seLlevoACabo}
                  onChange={(e) => setProyectoEditando({ ...proyectoEditando, seLlevoACabo: e.target.value as EstadoProyecto })}
                  className="w-full px-3 py-2 text-xs bg-white border border-purple-300 rounded-lg font-bold text-purple-950"
                >
                  <option value="Listo">✅ Listo (Aprobado por Gerencia General para Realizar / Imprimir)</option>
                  <option value="En proceso">⏳ En proceso (Comercialización activa)</option>
                  <option value="Planificado">📋 Planificado (Inicial)</option>
                  <option value="Denegado">❌ Denegado (No aprobado por rentabilidad)</option>
                  <option value="Sí">Sí (Completado y ejecutado)</option>
                  <option value="Pospuesto">Pospuesto</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tarifa Docente Autorizada por Hora ({moneda}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={proyectoEditando.tarifaHoraDocente}
                    onChange={(e) => setProyectoEditando({ ...proyectoEditando, tarifaHoraDocente: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-500">
                    Subtotal Docente: {formatearMoneda(proyectoEditando.horasClase * proyectoEditando.tarifaHoraDocente, moneda)}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Margen de Ganancia Operativa (%) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-xs font-bold font-mono text-purple-900 bg-purple-100 px-2 py-0.5 rounded">
                      {proyectoEditando.margenGananciaOperativa}%
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1 mb-1">
                    {[40, 50, 70, 80, 100].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setProyectoEditando({ ...proyectoEditando, margenGananciaOperativa: m })}
                        className={`py-1 text-xs font-bold rounded text-center transition-all cursor-pointer ${
                          proyectoEditando.margenGananciaOperativa === m
                            ? 'bg-purple-700 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {m}%
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-500">Exclusivo política institucional: 40%, 50%, 70%, 80%, 100%</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Régimen Fiscal SAR (Honduras)</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={proyectoEditando.aplicaISV}
                      onChange={(e) => setProyectoEditando({ ...proyectoEditando, aplicaISV: e.target.checked })}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-[11px] font-semibold text-slate-700">Aplica 15% ISV</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-600 mb-1">
                    Tipo de Servicio en Factura Fiscal
                  </label>
                  <select
                    value={proyectoEditando.servicioFiscal}
                    onChange={(e) => handleCambiarServicioFiscalModal(e.target.value as TipoServicioFiscal)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                  >
                    {REGLAS_ISV_SERVICIOS.map((regla) => (
                      <option key={regla.servicio} value={regla.servicio}>
                        {regla.servicio} ({regla.gravaISV ? 'Grava 15%' : 'Exento'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-600 mb-1">
                    Gastos Varios / Imprevistos Autorizados ({moneda})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={proyectoEditando.gastosVarios}
                    onChange={(e) => setProyectoEditando({ ...proyectoEditando, gastosVarios: Number(e.target.value) })}
                    className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono"
                  />
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
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Guardar y Emitir Dictamen
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Modal de Retorno de Proyecto a Gerencia Académica */}
      {proyectoParaRetornar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-rose-200 overflow-hidden flex flex-col">
            <div className="bg-rose-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-300" />
                <span className="text-sm font-black">Regresar a Gerencia Académica por Inconsistencia Financiera</span>
              </div>
              <button
                type="button"
                onClick={() => setProyectoParaRetornar(null)}
                className="text-rose-200 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-900 space-y-1">
                <span className="font-bold block text-[11px] uppercase tracking-wider">Flujo de Gobernanza Institucional</span>
                <p className="text-[11px] leading-relaxed">
                  Si la Gerencia General no ve bien la parte financiera del proyecto <strong>"{proyectoParaRetornar.nombreProyecto}"</strong> ({proyectoParaRetornar.codigoProyecto || proyectoParaRetornar.codigoPrograma || 'SIG-ACAD-2026-001'}), se regresa formalmente a la <strong>Gerencia Académica</strong> para su corrección de costos antes de enviarlo a Comercialización.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-700">
                  Motivo de Inconsistencia Financiera Observada:
                </label>
                <textarea
                  rows={3}
                  value={motivoRetornoGeneral}
                  onChange={(e) => setMotivoRetornoGeneral(e.target.value)}
                  placeholder="Describa la observación: ej. La tarifa por hora docente excede el tope o el margen de rentabilidad está por debajo del 25%..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 block">Observaciones frecuentes:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Tarifa docente excede el límite presupuestario',
                      'Margen operativo proyectado insuficiente',
                      'Costos operativos indirectos no justificados',
                      'Ajustar horas prácticas y honorarios totales'
                    ].map((motivo) => (
                      <button
                        key={motivo}
                        type="button"
                        onClick={() => setMotivoRetornoGeneral(motivo)}
                        className="px-2 py-1 bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-900 rounded-md text-[10px] font-medium transition-colors cursor-pointer"
                      >
                        + {motivo}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-[11px] text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Destino: <strong>Gerencia Académica</strong></span>
                  <span>Responsable: <strong>Phd. Donal Reyes</strong></span>
                </div>
                <div>Aviso por Correo: <strong>{CREDENCIALES_GERENCIAS.academica.correo}</strong></div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setProyectoParaRetornar(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirmar-retorno-gg-view"
                onClick={handleConfirmarRetornoAcademica}
                className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Confirmar y Devolver a Académica</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Oficial de Ficha Completa del Sílabo o Proyecto */}
      {proyectoSilaboModal && (
        <OfficialSyllabusModal
          isOpen={true}
          proyecto={proyectoSilaboModal}
          proyectos={proyectos}
          moneda={moneda}
          modoInicial="vista"
          rolActual="gerencia_general"
          onClose={() => setProyectoSilaboModal(null)}
          onGuardarProyecto={(pActualizado) => {
            onGuardarProyecto(pActualizado);
            setProyectoSilaboModal(pActualizado);
          }}
          onAprobarGG={(p) => {
            handleAprobarViabilidadYTrasladarComercial(p);
            setProyectoSilaboModal(null);
          }}
          onRechazarGG={(p, motivo) => {
            handleRechazarDesdeModal(p, motivo);
            setProyectoSilaboModal(null);
          }}
        />
      )}

    </div>
  );
};
