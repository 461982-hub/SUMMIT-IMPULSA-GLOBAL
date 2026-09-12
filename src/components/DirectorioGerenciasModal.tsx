import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Copy, 
  Check, 
  GraduationCap, 
  Megaphone, 
  Building2, 
  ShieldCheck, 
  ShieldAlert,
  Lock,
  Unlock,
  ArrowRight,
  UserCheck,
  Briefcase,
  PieChart,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Target,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  KeyRound,
  Video
} from 'lucide-react';
import { ProyectoEducativo, Moneda, VistaPrincipal } from '../types';
import { LISTA_CREDENCIALES_GERENCIAS, CredencialGerencia } from '../utils/gerenciasCredenciales';
import { formatearHNL } from '../utils/poa2026Data';
import { SummitLogo } from './SummitLogo';
import { 
  calcularMetricasPorGerencia, 
  calcularResumenEstadosPOA, 
  MetricasGerenciaPOA 
} from '../utils/poaGerenciasBreakdown';
import { 
  isSeguridadSoloGerenciaGeneralActiva, 
  isGerenciaGeneralAutorizada, 
  DATOS_SEGURIDAD_GERENCIA_GENERAL,
  cerrarSesionGerenciaGeneral
} from '../utils/gerenciaGeneralSecurity';

interface DirectorioGerenciasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSeleccionarGerencia?: (vista: VistaPrincipal) => void;
  onAbrirTableroPOA?: () => void;
  gerenciaInicialId?: string;
  proyectos?: ProyectoEducativo[];
  moneda?: Moneda;
  onSolicitarAutorizacionGG?: (accionDesc?: string) => void;
  onAbrirGoogleMeetGerenciasModal?: () => void;
}

type TabDirectorio = 'directorio_desarrollo' | 'resumen_estados' | 'seguridad_gg';

export const DirectorioGerenciasModal: React.FC<DirectorioGerenciasModalProps> = ({
  isOpen,
  onClose,
  onSeleccionarGerencia,
  onAbrirTableroPOA,
  gerenciaInicialId,
  proyectos = [],
  moneda = 'LPS' as Moneda,
  onSolicitarAutorizacionGG,
  onAbrirGoogleMeetGerenciasModal,
}) => {
  const [tabActiva, setTabActiva] = useState<TabDirectorio>('directorio_desarrollo');
  const [copiadoCampo, setCopiadoCampo] = useState<string | null>(null);
  const [gerenciaExpandidaMeses, setGerenciaExpandidaMeses] = useState<string | null>(null);
  const [mesSeleccionadoDetalle, setMesSeleccionadoDetalle] = useState<number | null>(null);
  
  // Estado de seguridad de Gerencia General
  const [esGGAutorizada, setEsGGAutorizada] = useState(() => isGerenciaGeneralAutorizada());
  const seguridadActiva = isSeguridadSoloGerenciaGeneralActiva();

  // Escuchar eventos de cambio de autorización GG
  useEffect(() => {
    const handleAuthChange = () => {
      setEsGGAutorizada(isGerenciaGeneralAutorizada());
    };
    window.addEventListener('summit-seguridad-gg-auth', handleAuthChange);
    return () => window.removeEventListener('summit-seguridad-gg-auth', handleAuthChange);
  }, []);

  // Métricas calculadas por gerencia y por mes
  const metricasGerencias = useMemo(() => {
    return calcularMetricasPorGerencia(proyectos, moneda);
  }, [proyectos, moneda]);

  // Resumen ejecutivo de estados
  const resumenEstados = useMemo(() => {
    return calcularResumenEstadosPOA(proyectos, moneda);
  }, [proyectos, moneda]);

  if (!isOpen) return null;

  const copiarAlPortapapeles = (texto: string, campoId: string) => {
    navigator.clipboard.writeText(texto);
    setCopiadoCampo(campoId);
    setTimeout(() => {
      setCopiadoCampo(null);
    }, 2000);
  };

  const getIconoGerencia = (id: string) => {
    switch (id) {
      case 'gerencia-academica':
        return <GraduationCap className="w-5 h-5 text-blue-600" />;
      case 'gerencia-comercializacion':
        return <Megaphone className="w-5 h-5 text-emerald-600" />;
      case 'gerencia-general':
        return <Building2 className="w-5 h-5 text-purple-600" />;
      default:
        return <ShieldCheck className="w-5 h-5 text-slate-600" />;
    }
  };

  const toggleExpandirMeses = (gerenciaId: string) => {
    if (gerenciaExpandidaMeses === gerenciaId) {
      setGerenciaExpandidaMeses(null);
    } else {
      setGerenciaExpandidaMeses(gerenciaId);
    }
  };

  return (
    <div 
      id="modal-directorio-gerencias"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-5 text-white flex items-center justify-between border-b border-indigo-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-xl border border-white/20 shrink-0">
              <SummitLogo variant="icon" size="sm" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 bg-blue-500/30 text-blue-200 border border-blue-400/30 rounded">
                  SUMMIT IMPULSA GLOBAL, S.A. DE C.V.
                </span>
                <span className="text-[11px] text-indigo-300 font-semibold">
                  Gobernanza POA SEP - DIC 2026
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                  esGGAutorizada
                    ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
                    : 'bg-amber-500/20 text-amber-200 border-amber-400/30'
                }`}>
                  {esGGAutorizada ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  <span>{esGGAutorizada ? 'Gerencia General Autorizada' : 'Seguridad GG: Solo Lectura'}</span>
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-0.5">
                Directorio Institucional & Control de Cumplimiento POA SEP - DIC 2026
              </h3>
            </div>
          </div>

          <button
            id="btn-cerrar-directorio-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Pestañas / Navegación */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            
            <button
              id="tab-directorio-desarrollo"
              type="button"
              onClick={() => setTabActiva('directorio_desarrollo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                tabActiva === 'directorio_desarrollo'
                  ? 'bg-indigo-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Cuentas de Correo & Presupuesto Mensual</span>
            </button>

            <button
              id="tab-resumen-estados-poa"
              type="button"
              onClick={() => setTabActiva('resumen_estados')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                tabActiva === 'resumen_estados'
                  ? 'bg-indigo-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span>¿En qué Estado Estamos? (Resumen POA)</span>
            </button>

            <button
              id="tab-seguridad-directiva-gg"
              type="button"
              onClick={() => setTabActiva('seguridad_gg')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                tabActiva === 'seguridad_gg'
                  ? 'bg-indigo-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Parámetro de Seguridad GG</span>
            </button>

            {onAbrirGoogleMeetGerenciasModal && (
              <button
                id="btn-directorio-abrir-meet"
                type="button"
                onClick={onAbrirGoogleMeetGerenciasModal}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-xs"
                title="Exclusivo para la Reunión de las Gerencias (Google Meet)"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Reunión de Gerencias (Meet)</span>
              </button>
            )}

          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Presupuesto Operativo Asignado: <strong>L. 1,601,500.00</strong></span>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL SCROLLEABLE */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">

          {/* VISTA 1: DIRECTORIO DE CORREOS, FACTURADO Y PROYECTOS POR MES POR GERENCIA */}
          {tabActiva === 'directorio_desarrollo' && (
            <div className="space-y-4">
              
              {/* Banner explicativo */}
              <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-900">
                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">
                      Seguimiento Departamental de Presupuesto Asignado y Facturación Mensual
                    </span>
                    <span className="text-blue-800/90 text-[11.5px] leading-relaxed">
                      Cada gerencia cuenta con su correo oficial, cuota asignada en el POA SEP - DIC 2026 y el registro mensual de proyectos y facturación para supervisar en tiempo real el cumplimiento institucional.
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-100 text-blue-900 rounded font-bold border border-blue-200">
                    {proyectos.length} Proyectos Registrados
                  </span>
                </div>
              </div>

              {/* Tarjetas de las 3 Gerencias */}
              <div className="space-y-4">
                {LISTA_CREDENCIALES_GERENCIAS.map((gerencia) => {
                  const esSeleccionada = gerenciaInicialId === gerencia.id;
                  
                  // Obtener métricas calculadas correspondientes
                  const claveGerencia = gerencia.claveCorta; // 'academica' | 'comercial' | 'administracion'
                  const metricas = claveGerencia === 'academica' 
                    ? metricasGerencias.academica 
                    : claveGerencia === 'comercial' 
                    ? metricasGerencias.comercial 
                    : metricasGerencias.general;

                  const estaExpandidoMeses = gerenciaExpandidaMeses === gerencia.id;

                  return (
                    <div
                      key={gerencia.id}
                      id={`tarjeta-directorio-${gerencia.id}`}
                      className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-xs ${
                        gerencia.id === 'gerencia-academica'
                          ? 'bg-blue-50/40 border-blue-200 hover:border-blue-300'
                          : gerencia.id === 'gerencia-comercializacion'
                          ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300'
                          : 'bg-purple-50/40 border-purple-200 hover:border-purple-300'
                      } ${esSeleccionada ? 'ring-2 ring-blue-500/50' : ''}`}
                    >
                      {/* Cabecera de la Gerencia */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs shrink-0">
                            {getIconoGerencia(gerencia.id)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-slate-900 tracking-tight">
                                {gerencia.nombreGerencia}
                              </span>
                              <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${gerencia.colorTema.badgeBg} ${gerencia.colorTema.badgeText}`}>
                                Paso {gerencia.pasoFlujo}
                              </span>
                              {gerencia.id === 'gerencia-general' && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 border border-purple-200">
                                  🛡️ Autoridad Exclusiva de Modificación
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 font-medium">
                              {gerencia.departamento}
                            </p>
                          </div>
                        </div>

                        {onSeleccionarGerencia && (
                          <button
                            type="button"
                            onClick={() => {
                              onSeleccionarGerencia(gerencia.id as VistaPrincipal);
                              onClose();
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
                            title={`Ir a la vista de ${gerencia.nombreGerencia}`}
                          >
                            <span>Abrir Gerencia</span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                        )}
                      </div>

                      {/* Grid de 4 Indicadores Clave: Líder, Correo, Presupuesto Asignado y Facturado / Proyectos */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3.5">
                        
                        {/* 1. Líder Responsable */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 mb-1">
                            <UserCheck className="w-3.5 h-3.5 text-slate-600" />
                            <span>Líder Responsable</span>
                          </div>
                          <div className="text-sm font-black text-slate-900 truncate">
                            {gerencia.lider}
                          </div>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            Dirección de Área
                          </span>
                        </div>

                        {/* 2. Correo Oficial Institucional */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5 text-blue-600" />
                              <span>Correo Oficial</span>
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">Gmail</span>
                          </div>
                          <div className="flex items-center justify-between gap-1 mt-0.5 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                            <span className="text-xs font-mono font-bold text-slate-900 truncate select-all" title={gerencia.correo}>
                              {gerencia.correo}
                            </span>
                            <button
                              type="button"
                              onClick={() => copiarAlPortapapeles(gerencia.correo, `correo-${gerencia.id}`)}
                              className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors shrink-0 cursor-pointer"
                              title="Copiar correo oficial"
                            >
                              {copiadoCampo === `correo-${gerencia.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* 3. Presupuesto Asignado POA 2026 */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                            <span className="flex items-center gap-1">
                              <PieChart className="w-3.5 h-3.5 text-purple-600" />
                              <span>Presupuesto POA 2026</span>
                            </span>
                            <span className="text-[10px] text-purple-700 font-black">{gerencia.participacionPresupuesto}</span>
                          </div>
                          <div className="text-sm font-black font-mono text-slate-900">
                            {formatearHNL(gerencia.presupuestoAnualHNL)}
                          </div>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            {gerencia.numActividades} actividades POA asignadas
                          </span>
                        </div>

                        {/* 4. Lo Facturado & Proyectos Gestionados */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Facturado Acumulado</span>
                            </span>
                            <span className="text-[10px] font-black text-indigo-700 font-mono">
                              {metricas.totalProyectos} proy.
                            </span>
                          </div>
                          <div className="text-sm font-black font-mono text-emerald-800">
                            {formatearHNL(metricas.totalFacturadoHNL)}
                          </div>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            {metricas.proyectosAprobadosGG} con Aprobación Final GG
                          </span>
                        </div>

                      </div>

                      {/* Botón para desplegar el desglose Mensual */}
                      <div className="mt-3 pt-3 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-xs text-slate-600 font-medium">
                          {gerencia.descripcion}
                        </span>

                        <button
                          type="button"
                          onClick={() => toggleExpandirMeses(gerencia.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-all shadow-2xs shrink-0 self-start sm:self-auto cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                          <span>
                            {estaExpandidoMeses 
                              ? 'Ocultar Desarrollo por Mes' 
                              : 'Ver Facturado y Proyectos por Mes (Cuatrimestre Sep-Dic 2026)'}
                          </span>
                          {estaExpandidoMeses ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* DESGLOSE DETALLADO POR MES (SEP-DIC 2026) */}
                      {estaExpandidoMeses && (
                        <div className="mt-3.5 pt-3 border-t border-slate-200 bg-white/90 rounded-xl p-3.5 animate-in fade-in duration-200 space-y-3">
                          
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Desarrollo Mensual POA SEP - DIC 2026: {gerencia.nombreGerencia}</span>
                              </h4>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Comparativo del presupuesto mensual asignado en el POA vs lo facturado y cantidad de proyectos ejecutados en cada mes.
                              </p>
                            </div>
                            
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-800 rounded border border-indigo-200">
                              Presupuesto Cuatrimestre: {formatearHNL(gerencia.presupuestoAnualHNL)}
                            </span>
                          </div>

                          {/* Grid de los 12 meses */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                            {metricas.meses.map((m) => {
                              const tieneProyectos = m.cantidadProyectos > 0;
                              const tieneFacturacion = m.facturadoHNL > 0;
                              const superaPresupuesto = m.facturadoHNL >= m.presupuestoAsignadoHNL;

                              return (
                                <div 
                                  key={m.mesNumero}
                                  className={`p-2.5 rounded-xl border text-xs transition-all ${
                                    tieneProyectos || tieneFacturacion
                                      ? 'bg-white border-slate-300 shadow-2xs'
                                      : 'bg-slate-50/60 border-slate-200 text-slate-400'
                                  }`}
                                >
                                  {/* Cabecera del Mes */}
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                                    <span className="font-bold text-slate-900">
                                      {m.nombreCorto} <span className="text-[10px] font-normal text-slate-500">({m.nombreMes})</span>
                                    </span>
                                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                      tieneProyectos 
                                        ? 'bg-indigo-100 text-indigo-900' 
                                        : 'bg-slate-100 text-slate-500'
                                    }`}>
                                      {m.cantidadProyectos} proy.
                                    </span>
                                  </div>

                                  {/* Lo Facturado en el Mes */}
                                  <div className="mt-1.5">
                                    <div className="flex items-center justify-between text-[10.5px]">
                                      <span className="text-slate-500 font-medium">Facturado:</span>
                                      <span className="font-bold font-mono text-emerald-800">
                                        {formatearHNL(m.facturadoHNL)}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Presupuesto Asignado del Mes */}
                                  <div className="mt-1">
                                    <div className="flex items-center justify-between text-[10.5px]">
                                      <span className="text-slate-500 font-medium">Asignado POA:</span>
                                      <span className="font-mono text-slate-700">
                                        {formatearHNL(m.presupuestoAsignadoHNL)}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Barra de Desarrollo */}
                                  <div className="mt-1.5">
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full transition-all ${
                                          superaPresupuesto ? 'bg-emerald-500' : 'bg-indigo-500'
                                        }`}
                                        style={{ width: `${Math.min(100, m.porcentajeEjecucion)}%` }}
                                      />
                                    </div>
                                    <div className="flex items-center justify-between text-[9px] text-slate-500 mt-0.5">
                                      <span>Ejecución:</span>
                                      <span className={`font-mono font-bold ${
                                        superaPresupuesto ? 'text-emerald-700' : 'text-slate-700'
                                      }`}>
                                        {m.porcentajeEjecucion.toFixed(1)}%
                                      </span>
                                    </div>
                                  </div>

                                  {/* Sello GG si aplica */}
                                  {m.proyectosAprobadosGG > 0 && (
                                    <div className="mt-1 pt-1 border-t border-slate-100 flex items-center justify-between text-[9.5px] text-purple-700 font-semibold">
                                      <span>Aprobados GG:</span>
                                      <span className="font-mono font-bold">{m.proyectosAprobadosGG}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* VISTA 2: ¿EN QUÉ ESTADO ESTAMOS? (RESUMEN EJECUTIVO POA SEP - DIC 2026) */}
          {tabActiva === 'resumen_estados' && (
            <div className="space-y-4">
              
              {/* Diagnóstico Ejecutivo de Estado */}
              <div className={`p-4 rounded-2xl border ${
                resumenEstados.diagnostico.color === 'emerald'
                  ? 'bg-emerald-50 border-emerald-300'
                  : resumenEstados.diagnostico.color === 'amber'
                  ? 'bg-amber-50 border-amber-300'
                  : 'bg-rose-50 border-rose-300'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    resumenEstados.diagnostico.color === 'emerald'
                      ? 'bg-emerald-600 text-white'
                      : resumenEstados.diagnostico.color === 'amber'
                      ? 'bg-amber-600 text-white'
                      : 'bg-rose-600 text-white'
                  }`}>
                    {resumenEstados.diagnostico.color === 'emerald' ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <Target className="w-6 h-6" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/80 border border-slate-200">
                        {resumenEstados.diagnostico.semaforo}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        Diagnóstico Institucional POA SEP - DIC 2026
                      </span>
                    </div>

                    <h4 className="text-base font-black text-slate-900">
                      {resumenEstados.diagnostico.titulo}
                    </h4>

                    <p className="text-xs text-slate-700 leading-relaxed max-w-3xl">
                      {resumenEstados.diagnostico.mensaje}
                    </p>
                  </div>
                </div>
              </div>

              {/* 4 Métricas de Estados Clave */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                
                {/* 1. Facturación Aprobada vs Meta Anual */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">
                    Facturación Aprobada GG
                  </span>
                  <div className="text-xl font-black font-mono text-emerald-800">
                    {formatearHNL(resumenEstados.facturacionAprobadaGGHNL)}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {resumenEstados.porcentajeFacturacionAprobada.toFixed(1)}% de {formatearHNL(resumenEstados.metaFacturacionAnualHNL)}
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                    <div 
                      className="h-full bg-emerald-600"
                      style={{ width: `${resumenEstados.porcentajeFacturacionAprobada}%` }}
                    />
                  </div>
                </div>

                {/* 2. Cursos del Portafolio vs Meta Anual */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">
                    Meta Anual Cursos (POA)
                  </span>
                  <div className="text-xl font-black font-mono text-slate-900">
                    {resumenEstados.totalProyectos} / {resumenEstados.metaAnualProyectos}
                  </div>
                  <div className="text-[11px] text-indigo-700 font-bold">
                    {resumenEstados.porcentajeCursosAlcanzados.toFixed(1)}% del objetivo anual
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                    <div 
                      className="h-full bg-indigo-600"
                      style={{ width: `${resumenEstados.porcentajeCursosAlcanzados}%` }}
                    />
                  </div>
                </div>

                {/* 3. Dictámenes y Sello de Gerencia General */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">
                    Sello Final Gerencia General
                  </span>
                  <div className="text-xl font-black font-mono text-purple-900">
                    {resumenEstados.proyectosAprobadosGG} <span className="text-xs font-normal text-slate-400">/ {resumenEstados.totalProyectos}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {resumenEstados.proyectosPendientesGG} proyectos en trámite dictamen
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                    <div 
                      className="h-full bg-purple-600"
                      style={{ width: `${resumenEstados.totalProyectos > 0 ? (resumenEstados.proyectosAprobadosGG / resumenEstados.totalProyectos) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* 4. Punto de Equilibrio de Supervivencia */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">
                    Break-Even Institucional
                  </span>
                  <div className="text-xl font-black font-mono text-slate-900">
                    {resumenEstados.totalProyectos} / {resumenEstados.puntoEquilibrioProyectos}
                  </div>
                  <div className={`text-[11px] font-bold ${
                    resumenEstados.cumplePuntoEquilibrio ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {resumenEstados.cumplePuntoEquilibrio ? 'Punto de equilibrio superado' : `Faltan ${resumenEstados.puntoEquilibrioProyectos - resumenEstados.totalProyectos} cursos`}
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                    <div 
                      className={`h-full ${resumenEstados.cumplePuntoEquilibrio ? 'bg-emerald-600' : 'bg-rose-500'}`}
                      style={{ width: `${Math.min(100, (resumenEstados.totalProyectos / resumenEstados.puntoEquilibrioProyectos) * 100)}%` }}
                    />
                  </div>
                </div>

              </div>

              {/* Desglose de Estados de Ejecución (Pipeline de Proyectos) */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Resumen por Estado de Ejecución de Proyectos</span>
                  </h4>
                  <span className="text-xs text-slate-500">
                    Total Cartera: <strong>{resumenEstados.totalProyectos} programas</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  
                  {/* Listos */}
                  <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                      <span>Listo / Realizado</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-black font-mono text-emerald-950">
                      {resumenEstados.proyectosListos}
                    </div>
                    <span className="text-[10px] text-emerald-700 block">
                      Dictamen favorable y matrícula concluida
                    </span>
                  </div>

                  {/* En Proceso */}
                  <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                      <span>En Comercialización</span>
                      <TrendingUp className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="text-2xl font-black font-mono text-amber-950">
                      {resumenEstados.proyectosEnProceso}
                    </div>
                    <span className="text-[10px] text-amber-700 block">
                      En captación de alumnos y matrículas
                    </span>
                  </div>

                  {/* Planificados */}
                  <div className="bg-blue-50/70 border border-blue-200 p-3 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                      <span>En Diseño Curricular</span>
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-2xl font-black font-mono text-blue-950">
                      {resumenEstados.proyectosPlanificados}
                    </div>
                    <span className="text-[10px] text-blue-700 block">
                      Fase inicial en Gerencia Académica
                    </span>
                  </div>

                  {/* Con Sello GG */}
                  <div className="bg-purple-50/70 border border-purple-200 p-3 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-purple-900">
                      <span>Rebaja Oficial POA</span>
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-2xl font-black font-mono text-purple-950">
                      {resumenEstados.proyectosAprobadosGG}
                    </div>
                    <span className="text-[10px] text-purple-700 block">
                      Con Aprobación Final de Gerencia General
                    </span>
                  </div>

                </div>
              </div>

              {/* Matriz Sintética de Gerencias */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                    Distribución y Desarrollo Presupuestario por Gerencia
                  </h4>
                  <span className="text-xs text-slate-500">
                    Suma Asignada: <strong>L. 1,601,500.00</strong>
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5">Gerencia Institucional</th>
                        <th className="px-4 py-2.5">Líder Directivo</th>
                        <th className="px-4 py-2.5 text-right">Presupuesto Asignado</th>
                        <th className="px-4 py-2.5 text-center">Part. POA</th>
                        <th className="px-4 py-2.5 text-right">Facturado</th>
                        <th className="px-4 py-2.5 text-center">Proyectos</th>
                        <th className="px-4 py-2.5 text-center">Aprobados GG</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      
                      {/* Académica */}
                      <tr className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-3 font-bold text-blue-950 flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-blue-600" />
                          <span>Gerencia Académica</span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">Phd. Donal Reyes</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          {formatearHNL(759500)}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-blue-700">47.4%</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-800">
                          {formatearHNL(metricasGerencias.academica.totalFacturadoHNL)}
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold">
                          {metricasGerencias.academica.totalProyectos}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-purple-800 font-bold">
                          {metricasGerencias.academica.proyectosAprobadosGG}
                        </td>
                      </tr>

                      {/* Comercial */}
                      <tr className="hover:bg-emerald-50/30 transition-colors">
                        <td className="px-4 py-3 font-bold text-emerald-950 flex items-center gap-2">
                          <Megaphone className="w-4 h-4 text-emerald-600" />
                          <span>Gerencia Comercial y Expansión</span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">Msc. Lilian Ordoñez</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          {formatearHNL(330000)}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-emerald-700">20.6%</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-800">
                          {formatearHNL(metricasGerencias.comercial.totalFacturadoHNL)}
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold">
                          {metricasGerencias.comercial.totalProyectos}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-purple-800 font-bold">
                          {metricasGerencias.comercial.proyectosAprobadosGG}
                        </td>
                      </tr>

                      {/* General */}
                      <tr className="hover:bg-purple-50/30 transition-colors">
                        <td className="px-4 py-3 font-bold text-purple-950 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-purple-600" />
                          <span>Gerencia General</span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">Dr. Walter Pedroza</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          {formatearHNL(512000)}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-purple-700">32.0%</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-purple-900">
                          {formatearHNL(metricasGerencias.general.totalFacturadoHNL)}
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold">
                          {metricasGerencias.general.totalProyectos}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-purple-800 font-bold">
                          {metricasGerencias.general.proyectosAprobadosGG}
                        </td>
                      </tr>

                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* VISTA 3: PARÁMETRO DE SEGURIDAD EXCLUSIVA DE GERENCIA GENERAL */}
          {tabActiva === 'seguridad_gg' && (
            <div className="space-y-4">
              
              {/* Tarjeta Informativa de Política */}
              <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 bg-purple-700 text-white rounded-xl shrink-0 shadow-xs">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-purple-200 text-purple-900 rounded border border-purple-300">
                        PARÁMETRO DE SEGURIDAD ESTRICTA
                      </span>
                      <span className="text-xs font-bold text-purple-800">
                        Blindaje del Cumplimiento POA SEP - DIC 2026
                      </span>
                    </div>

                    <h3 className="text-base font-black text-purple-950">
                      Exclusividad de Modificación para la Gerencia General
                    </h3>

                    <p className="text-xs text-purple-900/90 leading-relaxed max-w-3xl">
                      Para garantizar el cumplimiento riguroso del <strong>Plan Operativo Anual (POA) SEP - DIC 2026</strong>, <strong>únicamente la Gerencia General (Dr. Walter René Pedroza)</strong> está facultada para realizar modificaciones de cualquier índole en el sistema: creación de programas, edición de precios y honorarios, cambios de estado en el pipeline, eliminación de cursos o ajustes a los presupuestos.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-purple-200/70 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-purple-200">
                    <span className="text-[10px] text-slate-500 font-bold block">Titular Facultado</span>
                    <span className="font-bold text-slate-900">{DATOS_SEGURIDAD_GERENCIA_GENERAL.titular}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-purple-200">
                    <span className="text-[10px] text-slate-500 font-bold block">Correo Oficial Autenticado</span>
                    <span className="font-mono font-bold text-purple-900 truncate block">
                      {DATOS_SEGURIDAD_GERENCIA_GENERAL.correoOficial}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-purple-200">
                    <span className="text-[10px] text-slate-500 font-bold block">Estado de la Regla</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Activa (Garantía Obligatoria)</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Estado de la Sesión del Usuario */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">
                      Estado de Autorización en esta Sesión
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Verifique su identidad como Gerencia General para habilitar cambios en el sistema.
                    </p>
                  </div>

                  <div className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 ${
                    esGGAutorizada 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {esGGAutorizada ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>{esGGAutorizada ? 'Sesión Autorizada (Modificaciones Permitidas)' : 'Modo Supervisión / Solo Lectura'}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                  <div className="text-xs text-slate-600">
                    {esGGAutorizada ? (
                      <span>Usted está validado como <strong>Gerencia General</strong>. Todas las acciones de creación, edición y dictamen están desbloqueadas.</span>
                    ) : (
                      <span>Cualquier intento de crear o modificar un proyecto solicitará la Clave Maestra o la cuenta oficial de Google.</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {esGGAutorizada ? (
                      <button
                        type="button"
                        onClick={() => {
                          cerrarSesionGerenciaGeneral();
                          setEsGGAutorizada(false);
                        }}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Bloquear / Cerrar Sesión GG
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (onSolicitarAutorizacionGG) {
                            onSolicitarAutorizacionGG('habilitar permisos de modificación en el sistema');
                          }
                        }}
                        className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>Autenticar como Gerencia General (PIN 8826)</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Footer Modal */}
        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Notificaciones oficiales enlazadas con Gmail institucional de cada área.</span>
          </div>

          <div className="flex items-center gap-2">
            {onAbrirTableroPOA && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAbrirTableroPOA();
                }}
                className="px-3.5 py-2 bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200 font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
              >
                Ver Matriz POA 2026
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Entendido / Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
