import React from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Sparkles,
  CalendarDays,
  Trash2,
  RotateCcw,
  Building2,
  GraduationCap,
  Megaphone,
  Bell,
  Cloud,
  FolderSync,
  FileText,
  TrendingUp,
  ShieldCheck,
  History,
  ExternalLink,
  BarChart3,
  FileDown,
  Scale,
  Receipt,
  Mail,
  Layers,
  Clock,
  Zap
} from 'lucide-react';
import { Moneda, ProyectoEducativo, VistaPrincipal, NotificacionGerencia } from '../types';
import { SummitLogo } from './SummitLogo';
import { TARGET_DRIVE_FOLDER_URL } from '../services/googleDriveService';
import { CREDENCIALES_GERENCIAS } from '../utils/gerenciasCredenciales';

export type { VistaPrincipal };

interface HeaderProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  setMoneda: (m: Moneda) => void;
  onNuevoProyecto?: () => void;
  onExportarExcel?: () => void;
  onExportarCSV?: () => void;
  onImprimir?: () => void;
  onAbrirSimulador: () => void;
  onVaciarDatos?: () => void;
  onCargarPlantilla?: () => void;
  vistaActual: VistaPrincipal;
  setVistaActual: (v: VistaPrincipal) => void;
  mesFiltro?: string; // 'todos' o '2026-08'
  setMesFiltro?: (mes: string) => void;
  listaMesesDisponibles?: { mesKey: string; etiqueta: string }[];
  notificaciones?: NotificacionGerencia[];
  onAbrirNotificaciones?: () => void;
  onAbrirGoogleDriveModal?: () => void;
  onAbrirCentroReportes?: (gerenciaInicial?: 'Gerencia General' | 'Gerencia Académica' | 'Gerencia de Comercialización' | 'Auditoría Interna' | 'Historial' | 'Visualizador Margenes' | 'Tendencia Docente' | 'Comparador Proyectos' | 'Optimizador Fiscal' | 'Proyección de Crecimiento') => void;
  onAbrirDirectorioGerencias?: () => void;
  onAbrirTableroPOA?: () => void;
  onAbrirWorkflowStatusModal?: (proyectoId?: string) => void;
  isDriveConnected?: boolean;
  isDriveSyncing?: boolean;
  onExportarReporteMesPDF?: (mesKey?: string) => void;
  onAbrirOperacionRapida?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  proyectos,
  moneda,
  setMoneda,
  onNuevoProyecto,
  onExportarExcel,
  onExportarCSV,
  onImprimir,
  onAbrirSimulador,
  onVaciarDatos,
  onCargarPlantilla,
  vistaActual,
  setVistaActual,
  mesFiltro = 'todos',
  setMesFiltro,
  listaMesesDisponibles = [],
  notificaciones = [],
  onAbrirNotificaciones,
  onAbrirGoogleDriveModal,
  onAbrirCentroReportes,
  onAbrirDirectorioGerencias,
  onAbrirTableroPOA,
  onAbrirWorkflowStatusModal,
  isDriveConnected = false,
  isDriveSyncing = false,
  onExportarReporteMesPDF,
  onAbrirOperacionRapida,
}) => {
  const noLeidasTotales = notificaciones.filter((n) => !n.leida).length;
  const noLeidasComercial = notificaciones.filter(
    (n) => !n.leida && n.gerenciaDestino === 'gerencia-comercializacion'
  ).length;
  const noLeidasGeneral = notificaciones.filter(
    (n) => !n.leida && n.gerenciaDestino === 'gerencia-general'
  ).length;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Barra Superior */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
          
          {/* Logo & Titulo Corporativo SUMMIT */}
          <div className="flex items-center gap-3">
            <SummitLogo variant="horizontal" size="sm" showTagline={true} />
            <div className="hidden xl:flex flex-col pl-3 border-l border-slate-200 text-left">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200 uppercase tracking-wider">
                  Matriz Multi-Gerencia 2026
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  RTN: 05019026435770
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                Summit Impulsa S. de R.L. • San Pedro Sula, Cortés, Honduras
              </span>
            </div>
          </div>

          {/* Acciones Rápidas & Utilidades */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Botón de Centro de Notificaciones */}
            {onAbrirNotificaciones && (
              <button
                id="btn-abrir-notificaciones"
                onClick={onAbrirNotificaciones}
                className="relative inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-2xs"
                title="Centro de Notificaciones Inter-Gerenciales"
              >
                <Bell className={`w-3.5 h-3.5 ${noLeidasTotales > 0 ? 'text-rose-600 animate-bounce' : 'text-slate-500'}`} />
                <span className="hidden sm:inline">Avisos</span>
                {noLeidasTotales > 0 && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-black text-white bg-rose-600 rounded-full">
                    {noLeidasTotales}
                  </span>
                )}
              </button>
            )}

            {/* Botón Centro de Operación Rápida 1 Clic (Todas las Gerencias) */}
            {onAbrirOperacionRapida && (
              <button
                id="btn-operacion-rapida-global-header"
                onClick={onAbrirOperacionRapida}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-black text-slate-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-600 rounded-lg transition-all shadow-xs group cursor-pointer border border-amber-500/40 animate-pulse"
                title="Centro de Operación Rápida • Acciones de 1 Clic en todas las gerencias"
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950 group-hover:scale-110 transition-transform" />
                <span>1 Clic</span>
                <span className="hidden sm:inline font-extrabold text-[9px] bg-slate-950 text-amber-300 px-1.5 py-0.2 rounded-full">
                  Rápido
                </span>
              </button>
            )}

            {/* Botón Directorio de Correos & Credenciales Oficiales por Gerencia */}
            {onAbrirDirectorioGerencias && (
              <button
                id="btn-directorio-gerencias-header"
                onClick={onAbrirDirectorioGerencias}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-950 bg-blue-50/80 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-2xs group"
                title="Ver correos institucionales y líderes oficiales asignados a cada gerencia"
              >
                <Mail className="w-3.5 h-3.5 text-blue-700 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline font-bold">Correos Gerencias</span>
                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-black bg-blue-600 text-white">
                  3
                </span>
              </button>
            )}

            {/* Botón Tablero Directivo POA 2026 */}
            {onAbrirTableroPOA && (
              <button
                id="btn-tablero-poa-2026-header"
                onClick={onAbrirTableroPOA}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-purple-950 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors shadow-2xs group"
                title="Abrir Tablero de Control Directivo • Cuadro de Mando Integral POA SEP - DIC 2026"
              >
                <BarChart3 className="w-3.5 h-3.5 text-purple-700 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline font-black">POA 2026</span>
                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-purple-600 text-white">
                  Piloto
                </span>
              </button>
            )}

            {/* Botón Rastreador de Flujo & Nivel de Proyectos */}
            {onAbrirWorkflowStatusModal && (
              <button
                id="btn-workflow-status-header"
                onClick={() => onAbrirWorkflowStatusModal()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-indigo-950 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors shadow-2xs group cursor-pointer"
                title="Ver en qué nivel o status se encuentra cada proyecto, auditar cumplimiento y cronómetro"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-700 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline font-black">Nivel & Status</span>
                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-600 text-white">
                  Flujo
                </span>
              </button>
            )}

            {/* Filtro Rápido por Mes (si está disponible) */}
            {setMesFiltro && listaMesesDisponibles.length > 0 && (
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700">
                <CalendarDays className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
                <select
                  id="select-filtro-mes"
                  value={mesFiltro}
                  onChange={(e) => setMesFiltro(e.target.value)}
                  className="bg-transparent font-semibold text-slate-900 focus:outline-none cursor-pointer text-xs"
                >
                  <option value="todos">Todos los Meses ({proyectos.length})</option>
                  {listaMesesDisponibles.map((m) => (
                    <option key={m.mesKey} value={m.mesKey}>
                      {m.etiqueta}
                    </option>
                  ))}
                </select>
                {onExportarReporteMesPDF && (
                  <button
                    onClick={() => onExportarReporteMesPDF(mesFiltro !== 'todos' ? mesFiltro : undefined)}
                    className={`ml-1.5 p-1 rounded transition-colors cursor-pointer ${
                      mesFiltro !== 'todos'
                        ? 'text-blue-700 hover:text-blue-900 hover:bg-blue-100 bg-blue-50'
                        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                    }`}
                    title={
                      mesFiltro !== 'todos'
                        ? `Exportar Reporte Consolidado PDF del mes seleccionado (${mesFiltro})`
                        : 'Exportar Reporte Consolidado PDF por Mes'
                    }
                  >
                    <FileDown className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Selector de Moneda */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700">
              <span className="text-slate-500 mr-1.5 font-medium">Moneda:</span>
              <select
                id="select-moneda"
                value={moneda}
                onChange={(e) => setMoneda(e.target.value as Moneda)}
                className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value="LPS">LPS (L)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="MXN">MXN ($)</option>
              </select>
            </div>

            {/* Simulador Rápido */}
            <button
              id="btn-simulador"
              onClick={onAbrirSimulador}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
              title="Simulador Integral de Proyectos"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span className="hidden md:inline">Simulador</span>
            </button>

            {/* Botón Acceso Google Drive Auto-Guardado */}
            {onAbrirGoogleDriveModal && (
              <button
                id="btn-header-google-drive"
                onClick={onAbrirGoogleDriveModal}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors border shadow-2xs ${
                  isDriveConnected
                    ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                }`}
                title="Gestión de auto-guardado en Google Drive"
              >
                <Cloud className={`w-3.5 h-3.5 ${isDriveConnected ? 'text-blue-600' : 'text-amber-600'} ${isDriveSyncing ? 'animate-pulse' : ''}`} />
                <span className="hidden md:inline">Drive</span>
                <span className={`w-1.5 h-1.5 rounded-full ${isDriveConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </button>
            )}

            {/* Opciones de Reportes por Gerencia con Auto-Guardado en Google Drive */}
            <div className="relative group">
              <button
                id="btn-centro-reportes-header"
                onClick={() => onAbrirCentroReportes?.()}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-2xs group"
                title="Centro de reportes ejecutivos por gerencia con auto-guardado en Google Drive"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
                <span>Reportes por Gerencia</span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-black bg-blue-600 text-white">
                  Drive Auto
                </span>
              </button>

              {/* Menú desplegable organizado por Gerencia */}
              <div className="absolute right-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 hidden group-hover:block z-50 animate-fadeIn">
                <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Opciones por Gerencia
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                    <Cloud className="w-2.5 h-2.5" /> Auto Drive
                  </span>
                </div>

                {/* Herramienta de Proyección de Crecimiento Semestral */}
                <button
                  id="menu-rep-proyeccion-crecimiento"
                  onClick={() => onAbrirCentroReportes?.('Proyección de Crecimiento')}
                  className="w-full text-left px-3 py-2 text-xs text-indigo-900 bg-indigo-50/70 hover:bg-indigo-100 hover:text-indigo-950 flex items-center gap-2.5 transition-colors border-b border-indigo-200/60"
                >
                  <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span>Proyección de Crecimiento</span>
                      <span className="text-[9px] bg-indigo-200 text-indigo-900 px-1 rounded font-extrabold">Semestral</span>
                    </div>
                    <div className="text-[10px] text-slate-500">Inflación, costos docentes y márgenes</div>
                  </div>
                </button>

                {/* Herramienta de Optimización Fiscal y Asesor SAR */}
                <button
                  id="menu-rep-optimizador-fiscal"
                  onClick={() => onAbrirCentroReportes?.('Optimizador Fiscal')}
                  className="w-full text-left px-3 py-2 text-xs text-emerald-900 bg-emerald-50/60 hover:bg-emerald-100 hover:text-emerald-950 flex items-center gap-2.5 transition-colors border-b border-emerald-200/60"
                >
                  <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Receipt className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span>Optimización Fiscal SAR</span>
                      <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1 rounded font-extrabold">Smart</span>
                    </div>
                    <div className="text-[10px] text-slate-500">Sugerencias impositivas y ahorro mensual</div>
                  </div>
                </button>

                {/* Visualizador de Márgenes Recharts */}
                <button
                  id="menu-rep-visualizador-margenes"
                  onClick={() => onAbrirCentroReportes?.('Visualizador Margenes')}
                  className="w-full text-left px-3 py-2 text-xs text-indigo-800 bg-indigo-50/50 hover:bg-indigo-100 hover:text-indigo-950 flex items-center gap-2.5 transition-colors border-b border-indigo-100/60"
                >
                  <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <BarChart3 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span>Comparativa de Márgenes</span>
                      <span className="text-[9px] bg-indigo-200 text-indigo-900 px-1 rounded font-extrabold">Recharts</span>
                    </div>
                    <div className="text-[10px] text-slate-500">Por Tipo de Proyecto y Nivel Académico</div>
                  </div>
                </button>

                {/* Comparador Lado a Lado de Proyectos */}
                <button
                  id="menu-rep-comparador-proyectos"
                  onClick={() => onAbrirCentroReportes?.('Comparador Proyectos')}
                  className="w-full text-left px-3 py-2 text-xs text-blue-800 bg-blue-50/50 hover:bg-blue-100 hover:text-blue-950 flex items-center gap-2.5 transition-colors border-b border-blue-100/60"
                >
                  <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Scale className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span>Comparar Programas (Lado a Lado)</span>
                      <span className="text-[9px] bg-blue-200 text-blue-900 px-1 rounded font-extrabold">Tabla</span>
                    </div>
                    <div className="text-[10px] text-slate-500">Métricas clave, unit economics y decisiones</div>
                  </div>
                </button>

                {/* 1. Gerencia General */}
                <button
                  id="menu-rep-gerencia-general"
                  onClick={() => onAbrirCentroReportes?.('Gerencia General')}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-900 flex items-center gap-2.5 transition-colors"
                >
                  <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">Gerencia General</div>
                    <div className="text-[10px] text-slate-500">P&L, Rentabilidad SAR, Proyecciones</div>
                  </div>
                </button>

                {/* 2. Gerencia Académica */}
                <button
                  id="menu-rep-gerencia-academica"
                  onClick={() => onAbrirCentroReportes?.('Gerencia Académica')}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2.5 transition-colors"
                >
                  <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">Gerencia Académica</div>
                    <div className="text-[10px] text-slate-500">Carga Horaria, Planilla Docente, ISV 15%</div>
                  </div>
                </button>

                {/* 3. Gerencia Comercial */}
                <button
                  id="menu-rep-gerencia-comercial"
                  onClick={() => onAbrirCentroReportes?.('Gerencia de Comercialización')}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-900 flex items-center gap-2.5 transition-colors"
                >
                  <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">Gerencia Comercial</div>
                    <div className="text-[10px] text-slate-500">Punto de Equilibrio, CAC, Tarifas</div>
                  </div>
                </button>

                {/* 4. Auditoría Interna */}
                <button
                  id="menu-rep-auditoria-interna"
                  onClick={() => onAbrirCentroReportes?.('Auditoría Interna')}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-rose-50 hover:text-rose-900 flex items-center gap-2.5 transition-colors"
                >
                  <div className="w-6 h-6 rounded-md bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">Auditoría Interna</div>
                    <div className="text-[10px] text-slate-500">Dictámenes, Alertas, Acciones Correctivas</div>
                  </div>
                </button>

                <div className="border-t border-slate-100 mt-1 pt-1">
                  {/* Historial en Drive */}
                  <button
                    id="menu-rep-historial-drive"
                    onClick={() => onAbrirCentroReportes?.('Historial')}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <History className="w-3.5 h-3.5 text-slate-400" />
                      <span>Historial de Reportes en Drive</span>
                    </span>
                  </button>

                  {/* Acceso a Carpeta Google Drive */}
                  <a
                    href={TARGET_DRIVE_FOLDER_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-left px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-50 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <FolderSync className="w-3.5 h-3.5 text-blue-600" />
                      <span>Abrir Carpeta Google Drive</span>
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>

                  {onImprimir && (
                    <button
                      id="btn-imprimir"
                      onClick={onImprimir}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-400" />
                      <span>Imprimir Vista Actual</span>
                    </button>
                  )}

                  {onCargarPlantilla && (
                    <button
                      id="btn-cargar-plantilla"
                      onClick={onCargarPlantilla}
                      className="w-full text-left px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-50 flex items-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                      <span>Reiniciar Matriz (POA 2026 en Blanco)</span>
                    </button>
                  )}

                  {onVaciarDatos && (
                    <button
                      id="btn-vaciar-datos"
                      onClick={onVaciarDatos}
                      className="w-full text-left px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Vaciar Todos los Datos</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Barra de Módulos por Gerencias y Vistas */}
      <div className="bg-slate-50/90 border-t border-slate-200/80 px-4 sm:px-6 lg:px-8 py-1.5 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
          
          {/* Bloque 1: Las 3 Gerencias Internas */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
              Flujo Automatizado:
            </span>

            {/* 1. Gerencia Académica (Paso 1: Elabora el Proyecto) */}
            <button
              id="btn-gerencia-academica"
              onClick={() => setVistaActual('gerencia-academica')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                vistaActual === 'gerencia-academica'
                  ? 'bg-blue-700 text-white shadow-xs ring-1 ring-blue-600'
                  : 'bg-white text-slate-700 hover:text-blue-900 border border-slate-200 hover:bg-blue-50'
              }`}
              title={`Paso 1: Elaboración Curricular y Docentes • ${CREDENCIALES_GERENCIAS.academica.lider} (${CREDENCIALES_GERENCIAS.academica.correo})`}
            >
              <GraduationCap className={`w-3.5 h-3.5 ${vistaActual === 'gerencia-academica' ? 'text-blue-200' : 'text-blue-600'}`} />
              <div className="flex flex-col items-start leading-tight">
                <span className="flex items-center gap-1">
                  <span className="text-[9px] px-1 py-0.2 rounded bg-blue-100/80 text-blue-900 font-extrabold">1</span>
                  <span>G. Académica</span>
                </span>
                <span className="hidden xl:inline text-[9px] font-medium opacity-90">
                  {CREDENCIALES_GERENCIAS.academica.lider}
                </span>
              </div>
            </button>

            <span className="text-slate-300 font-bold hidden sm:inline">→</span>

            {/* 2. Gerencia de Comercialización (Paso 2: Vende / Comercializa) */}
            <button
              id="btn-gerencia-comercializacion"
              onClick={() => setVistaActual('gerencia-comercializacion')}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                vistaActual === 'gerencia-comercializacion'
                  ? 'bg-emerald-700 text-white shadow-xs ring-1 ring-emerald-600'
                  : 'bg-white text-slate-700 hover:text-emerald-900 border border-slate-200 hover:bg-emerald-50'
              }`}
              title={`Paso 2: Comercialización y Matrícula • ${CREDENCIALES_GERENCIAS.comercial.lider} (${CREDENCIALES_GERENCIAS.comercial.correo})`}
            >
              <Megaphone className={`w-3.5 h-3.5 ${vistaActual === 'gerencia-comercializacion' ? 'text-emerald-200' : 'text-emerald-600'}`} />
              <div className="flex flex-col items-start leading-tight">
                <span className="flex items-center gap-1">
                  <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100/80 text-emerald-900 font-extrabold">2</span>
                  <span>G. Comercial</span>
                </span>
                <span className="hidden xl:inline text-[9px] font-medium opacity-90">
                  {CREDENCIALES_GERENCIAS.comercial.lider}
                </span>
              </div>
              {noLeidasComercial > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-black bg-rose-600 text-white rounded-full animate-pulse shadow-xs ml-0.5">
                  {noLeidasComercial}
                </span>
              )}
            </button>

            <span className="text-slate-300 font-bold hidden sm:inline">→</span>

            {/* 3. Gerencia General (Paso 3: Aprueba Financiera & Rentable) */}
            <button
              id="btn-gerencia-general"
              onClick={() => setVistaActual('gerencia-general')}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                vistaActual === 'gerencia-general' || ['control', 'tabla', 'tarjetas', 'meses', 'analitica', 'isv', 'guia', 'modificar'].includes(vistaActual)
                  ? 'bg-slate-900 text-white shadow-xs ring-1 ring-slate-800'
                  : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-100'
              }`}
              title={`Paso 3: Aprobación Financiera y Dictamen Final • ${CREDENCIALES_GERENCIAS.administracion.lider} (${CREDENCIALES_GERENCIAS.administracion.correo})`}
            >
              <Building2 className={`w-3.5 h-3.5 ${vistaActual === 'gerencia-general' || ['control', 'tabla', 'tarjetas', 'meses', 'analitica', 'isv', 'guia', 'modificar'].includes(vistaActual) ? 'text-purple-400' : 'text-purple-600'}`} />
              <div className="flex flex-col items-start leading-tight">
                <span className="flex items-center gap-1">
                  <span className="text-[9px] px-1 py-0.2 rounded bg-purple-100 text-purple-900 font-extrabold">3</span>
                  <span>G. General</span>
                </span>
                <span className="hidden xl:inline text-[9px] font-medium opacity-90">
                  {CREDENCIALES_GERENCIAS.administracion.lider}
                </span>
              </div>
              {noLeidasGeneral > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-black bg-rose-600 text-white rounded-full animate-pulse shadow-xs ml-0.5">
                  {noLeidasGeneral}
                </span>
              )}
            </button>
          </div>

          {/* Etiqueta Informativa Institucional */}
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-600">Sistema Integral Multi-Gerencial</span>
          </div>

        </div>
      </div>
    </header>
  );
};
