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
import { emitirAutorizacionComercial } from '../utils/poaMonthlyTrackingUtils';
import { SummitLogo } from './SummitLogo';
import { CREDENCIALES_GERENCIAS } from '../utils/gerenciasCredenciales';
import { CommercialAdmissionsCRMView } from './commercial/CommercialAdmissionsCRMView';
import { CommercialCockpitDailyView } from './commercial/CommercialCockpitDailyView';
import { CommercialPOAAlertBanner } from './commercial/CommercialPOAAlertBanner';
import { WorkflowStatusBadge } from './WorkflowStatusBadge';
import { CommercialProjectLauncherModal } from './commercial/CommercialProjectLauncherModal';
import { ControlDecisionComercialSection } from './commercial/ControlDecisionComercialSection';
import { QuickEnrollmentModal } from './commercial/QuickEnrollmentModal';
import { QuickQuoteWhatsAppModal } from './commercial/QuickQuoteWhatsAppModal';
import { QuickLeadImporterModal } from './commercial/QuickLeadImporterModal';
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

export type TabComercial = 
  | 'cockpit'
  | 'pipeline'
  | 'control_matricula';

export const GerenciaComercializacionView: React.FC<GerenciaComercializacionViewProps> = ({
  proyectos,
  moneda,
  onEditarProyecto,
  onVerDetalle,
  onGuardarProyecto,
  onNotificar,
  onAbrirWorkflowStatusModal,
}) => {
  const [tabActiva, setTabActiva] = useState<TabComercial>('control_matricula');
  const [busqueda, setBusqueda] = useState('');
  const [filtroCanal, setFiltroCanal] = useState<string>('todos');
  const [filtroCumplimiento, setFiltroCumplimiento] = useState<string>('todos');
  const [filtroFase, setFiltroFase] = useState<string>('todos');

  // Proyectos trasladados a Comercialización tras la revisión y aprobación financiera de Gerencia General.
  // Flujo Institucional: Gerencia Académica (Creación Sílabo) -> Gerencia General (Revisión Financiera) -> Gerencia Comercial.
  const proyectosOperativos = useMemo(() => {
    return proyectos.filter((p) => {
      // Los programas retornados a Gerencia Académica para corrección financiera no se comercializan hasta subsanarse
      if (p.etapaFlujo === 'elaboracion_academica' && !p.aprobadoPorGerenciaGeneralPrevia) return false;
      return true;
    });
  }, [proyectos]);

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

  // Modal Cotizador Corporativo
  const [mostrarModalCotizadorCorporativo, setMostrarModalCotizadorCorporativo] = useState(false);

  const handleAbrirComercializarProyecto = (id?: string) => {
    setProyectoParaComercializarId(id);
    setMostrarModalComercializar(true);
  };

  // Proyecto en edición rápida comercial
  const [proyectoEditando, setProyectoEditando] = useState<ProyectoEducativo | null>(null);

  // Registro de Fases Comerciales y Precios Early Bird
  const [faseProgId, setFaseProgId] = useState<string>(proyectosOperativos[0]?.id || '');
  const [faseComercialSel, setFaseComercialSel] = useState<NonNullable<ProyectoEducativo['faseComercial']>>('Preventa Early Bird');
  const [faseDescPct, setFaseDescPct] = useState<number>(15);
  const [fasePrecioEB, setFasePrecioEB] = useState<number>(
    Math.round((proyectosOperativos[0]?.precioSugeridoConISV || proyectosOperativos[0]?.precioSugeridoAlumno || 2500) * 0.85)
  );
  const [faseFechaLimite, setFaseFechaLimite] = useState<string>('');
  const [mensajeFaseExito, setMensajeFaseExito] = useState<string | null>(null);

  // Sincronizar selección de Fases & Precios
  const handleCambiarProyectoFase = (id: string) => {
    setFaseProgId(id);
    const p = proyectosOperativos.find((item) => item.id === id);
    if (p) {
      setFaseComercialSel(p.faseComercial || 'Preventa Early Bird');
      setFaseDescPct(p.descuentoPreventaPct || 15);
      const regular = p.precioSugeridoConISV || p.precioSugeridoAlumno || 2500;
      setFasePrecioEB(p.precioEarlyBird || Math.round(regular * (1 - (p.descuentoPreventaPct || 15) / 100)));
      setFaseFechaLimite(p.fechaVenta || '');
    }
  };

  // Handler: Guardar Fases & Precios Manual
  const handleGuardarFasePreciosManual = (e: React.FormEvent) => {
    e.preventDefault();
    const p = proyectosOperativos.find((item) => item.id === faseProgId);
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

  // Métricas consolidadas de comercialización
  const totalAlumnosProyectados = proyectosOperativos.reduce((acc, p) => acc + (p.alumnosProyectados || 0), 0);
  const totalAlumnosReales = proyectosOperativos.reduce((acc, p) => acc + (p.alumnosFinal || 0), 0);
  const tasaCumplimientoGlobal = totalAlumnosProyectados > 0 
    ? (totalAlumnosReales / totalAlumnosProyectados) * 100 
    : 0;

  const totalFacturadoAlumnos = proyectosOperativos.reduce((acc, p) => acc + (p.ingresoTotalConISV || p.ingresoRealTotal), 0);
  const totalGananciaAdicionales = proyectosOperativos.reduce((acc, p) => acc + (p.gananciaAlumnosAdicionales || 0), 0);
  const totalGastoPublicidad = proyectosOperativos.reduce((acc, p) => acc + (p.gastoPublicidad || 0), 0);

  // Embudo agregado
  const totalLeads = proyectosOperativos.reduce((acc, p) => acc + (p.leadsGenerados || p.alumnosProyectados * 8), 0);
  const totalCalificados = proyectosOperativos.reduce((acc, p) => acc + (p.prospectosCalificados || Math.round((p.leadsGenerados || p.alumnosProyectados * 8) * 0.45)), 0);
  const totalReservas = proyectosOperativos.reduce((acc, p) => acc + (p.cuposReservados || Math.round((p.prospectosCalificados || p.alumnosProyectados * 4) * 0.4)), 0);
  
  const tasaConversionGlobal = totalLeads > 0 ? ((totalAlumnosReales / totalLeads) * 100) : 0;
  const cacGlobal = totalAlumnosReales > 0 ? (totalGastoPublicidad / totalAlumnosReales) : 0;
  const roasGlobal = totalGastoPublicidad > 0 ? (totalFacturadoAlumnos / totalGastoPublicidad) : 0;

  // Proyectos que alcanzaron o superaron el punto de equilibrio
  const proyectosRentables = proyectosOperativos.filter((p) => p.alumnosFinal >= p.puntoEquilibrioAlumnos).length;
  const proyectosEnRiesgoVentas = proyectosOperativos.filter((p) => p.alumnosFinal < p.puntoEquilibrioAlumnos).length;

  // Distribución por canales de venta con métricas de conversión y CAC
  const resumenCanales = useMemo(() => {
    const map: Record<string, { 
      count: number; 
      alumnos: number; 
      recaudado: number;
      gastoPublicidad: number;
      leads: number;
    }> = {};

    proyectosOperativos.forEach((p) => {
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
  }, [proyectosOperativos]);

  // Filtrado de proyectos
  const proyectosFiltrados = useMemo(() => {
    return proyectosOperativos.filter((p) => {
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
  }, [proyectosOperativos, busqueda, filtroCanal, filtroFase, filtroCumplimiento]);

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

  // Autorización Comercial (Paso 2): remitir a Gerencia General para revisión y rebaja POA 2026
  const handleAutorizarComercial = (proyecto: ProyectoEducativo) => {
    const actual = emitirAutorizacionComercial(
      proyecto,
      `${CREDENCIALES_GERENCIAS.comercial.lider} - Gerencia Comercial`,
      'Proceso de venta, distribución y matrícula autorizado formalmente. Remitido a Gerencia General para su revisión final y rebaja del POA 2026.'
    );
    onGuardarProyecto(actual);
    onNotificar?.(`🚀 Proyecto #${String(actual.numeroCorrelativo || actual.id).padStart(3, '0')} autorizado comercialmente y transferido a Gerencia General.`);
  };

  // Proyectos en proceso notificados por Gerencia Académica
  const proyectosPendientesComercial = useMemo(() => {
    return proyectosOperativos.filter(
      (p) => !p.comercializacionCompletada || p.etapaFlujo === 'comercializacion' || p.seLlevoACabo === 'Planificado'
    );
  }, [proyectosOperativos]);

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

        {/* Acciones Rápidas Operativas para Gestión Individual (1 Persona) */}
        <div className="mt-4 pt-3 border-t border-emerald-800/60 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-black tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded shadow-xs">
              ⚡ Procesos Básicos
            </span>
            <span className="text-xs text-emerald-200 font-semibold">
              Gestión comercial individual de alta velocidad:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleAbrirMatriculaRapida()}
              className="px-3 py-1.5 rounded-xl font-bold border transition-all text-xs flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-300 shadow-xs cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Matrícula Exprés</span>
            </button>
            <button
              type="button"
              onClick={() => handleAbrirCotizadorWhatsApp()}
              className="px-3 py-1.5 rounded-xl font-bold border transition-all text-xs flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white border-green-400 shadow-xs cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Cotizador WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={() => setMostrarModalCotizadorCorporativo(true)}
              className="px-3 py-1.5 rounded-xl font-bold border transition-all text-xs flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 shadow-xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Cotizador PDF SAR</span>
            </button>
            <button
              type="button"
              onClick={() => setMostrarModalImportadorLeads(true)}
              className="px-3 py-1.5 rounded-xl font-bold border transition-all text-xs flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-teal-300" />
              <span>Importar Leads Excel</span>
            </button>
            <button
              type="button"
              onClick={() => handleAbrirComercializarProyecto()}
              className="px-3 py-1.5 rounded-xl font-black border transition-all text-xs flex items-center gap-1.5 bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 border-emerald-300 shadow-xs hover:scale-[1.02] cursor-pointer"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>Comercializar Curso</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alerta de Cumplimiento POA 2026 & Rebaja Mensual por Facturación Aprobada */}
      <CommercialPOAAlertBanner
        totalProyectos={proyectosOperativos.length}
        proyectos={proyectosOperativos}
        moneda={moneda}
        onIrAPronostico={() => setTabActiva('control_matricula')}
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
          proyectos={proyectosOperativos}
          moneda={moneda}
          onGuardarProyecto={onGuardarProyecto}
          onVerDetalle={onVerDetalle}
          onNotificar={onNotificar}
        />
      </div>

      {/* Aviso de Dependencia Operativa con Gerencia Académica cuando no hay proyectos */}
      {proyectosOperativos.length === 0 && (
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

      {/* Selector de Pestañas: Procesos Básicos para 1 Persona */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-0">
        <button
          type="button"
          onClick={() => setTabActiva('cockpit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
            tabActiva === 'cockpit'
              ? 'bg-slate-900 text-white shadow-xs border-b-2 border-emerald-500'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 border-b-0'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>⚡ Cockpit Diario</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('pipeline')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
            tabActiva === 'pipeline'
              ? 'bg-emerald-700 text-white shadow-xs border-b-2 border-emerald-800'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 border-b-0'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-300" />
          <span>Embudo & Pipeline</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('control_matricula')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
            tabActiva === 'control_matricula'
              ? 'bg-emerald-700 text-white shadow-xs border-b-2 border-emerald-800'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 border-b-0'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-emerald-300" />
          <span>Control de Matrícula ({proyectosOperativos.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VISTA 0: COCKPIT DE OPERACIÓN DIARIA & ALTA VELOCIDAD */}
      {/* ========================================================================= */}
      {tabActiva === 'cockpit' && (
        <div className="animate-in fade-in duration-150">
          <CommercialCockpitDailyView
            proyectos={proyectosOperativos}
            moneda={moneda}
            onAbrirMatriculaRapida={handleAbrirMatriculaRapida}
            onAbrirCotizadorWhatsApp={handleAbrirCotizadorWhatsApp}
            onAbrirImportadorLeads={() => setMostrarModalImportadorLeads(true)}
            onAbrirComercializarProyecto={handleAbrirComercializarProyecto}
            onAjustarAlumnosFinales={handleAjustarAlumnosFinales}
            onEditarProyecto={onEditarProyecto}
            onVerDetalle={onVerDetalle}
            onAutorizarComercial={handleAutorizarComercial}
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
                  {proyectosOperativos.map((p) => {
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
                              {p.autorizacionComercial ? (
                                <span 
                                  className="px-2 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded text-[10px] font-extrabold whitespace-nowrap"
                                  title="Autorizado comercialmente y enviado a Gerencia General"
                                >
                                  ✓ En GG
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAutorizarComercial(p)}
                                  className="px-2 py-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shadow-xs"
                                  title="Autorizar venta y matrícula y pasar a Gerencia General para su revisión y rebaja del POA 2026"
                                >
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>Autorizar a GG</span>
                                </button>
                              )}

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

      {/* Modal Centro de Comercialización de Proyectos de Gerencia Académica */}
      {mostrarModalComercializar && (
        <CommercialProjectLauncherModal
          proyectos={proyectosOperativos}
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
        proyectos={proyectosOperativos}
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
        proyectos={proyectosOperativos}
        moneda={moneda}
      />

      {/* Modal Importador Masivo de Leads desde Excel / Google Sheets */}
      <QuickLeadImporterModal
        isOpen={mostrarModalImportadorLeads}
        onClose={() => setMostrarModalImportadorLeads(false)}
        proyectos={proyectosOperativos}
        moneda={moneda}
        onGuardarProyecto={onGuardarProyecto}
        onNotificar={onNotificar}
      />

      {/* Modal Cotizador Corporativo B2B Imprimible / PDF */}
      <CommercialCorporateQuoteModal
        isOpen={mostrarModalCotizadorCorporativo}
        onClose={() => setMostrarModalCotizadorCorporativo(false)}
        proyectos={proyectosOperativos}
        moneda={moneda}
        onNotificar={onNotificar}
      />

    </div>
  );
};
