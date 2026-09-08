import React, { useState } from 'react';
import { 
  X, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Calendar, 
  CheckCircle2, 
  BookOpen, 
  Target, 
  Sliders, 
  Clock, 
  AlertCircle,
  FileSpreadsheet,
  FileText,
  Edit3,
  Download,
  History,
  Activity,
  Receipt,
  Phone,
  Mail,
  GraduationCap,
  Star,
  Sparkles,
  Award,
  ShieldCheck,
  XCircle,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { ProyectoEducativo, Moneda, HistorialCambioProyecto } from '../types';
import { formatearMoneda, calcularMetricasProyecto } from '../utils/calculations';
import { ProjectHistoryTimeline } from './ProjectHistoryTimeline';
import { obtenerReglaISVPorServicio } from '../utils/isvRules';
import { formatearFechaCorta, contarDiasCalendarioEntreFechas, sumarDiasCalendario } from '../utils/dateUtils';
import { SummitLogo } from './SummitLogo';
import { ProjectFiscalBreakdownSection } from './fiscal/ProjectFiscalBreakdownSection';
import { calcularImpactoFiscalCompleto } from '../utils/taxCalculations';
import { ProjectAuditReportModal } from './ProjectAuditReportModal';
import { ProjectBreakEvenChart } from './ProjectBreakEvenChart';

interface ProjectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyecto: ProyectoEducativo | null;
  moneda: Moneda;
  onEditar: (p: ProyectoEducativo) => void;
  onExportarPDF?: (p: ProyectoEducativo) => void;
  onExportarAuditoriaPDF?: (p: ProyectoEducativo) => void;
  onAgregarHistorial?: (proyectoId: string, entrada: HistorialCambioProyecto) => void;
  onActualizarProyecto?: (p: ProyectoEducativo) => void;
  vistaActual?: string;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  isOpen,
  onClose,
  proyecto,
  moneda,
  onEditar,
  onExportarPDF,
  onExportarAuditoriaPDF,
  onAgregarHistorial,
  onActualizarProyecto,
  vistaActual,
}) => {
  const [tabActiva, setTabActiva] = useState<'financiero' | 'punto_equilibrio' | 'fiscal' | 'historial'>('financiero');
  const [simuladorAlumnos, setSimuladorAlumnos] = useState<number>(4);
  const [modalAuditoriaAbierto, setModalAuditoriaAbierto] = useState<boolean>(false);

  if (!isOpen || !proyecto) return null;

  // Cálculo de cronología de comercialización (20 días calendario corridos)
  const hoyStr = new Date().toISOString().slice(0, 10);
  const fechaCreacionAcademica = proyecto.fechaElaboracion || proyecto.fechaCreacion?.slice(0, 10) || proyecto.fechaProgramacion || hoyStr;
  const fechaLimiteVenta20 = proyecto.fechaVenta || sumarDiasCalendario(fechaCreacionAcademica, 20);
  const diasCalendarioTranscurridos = Math.max(0, contarDiasCalendarioEntreFechas(fechaCreacionAcademica, hoyStr));
  const diasCalendarioRestantes = Math.max(0, contarDiasCalendarioEntreFechas(hoyStr, fechaLimiteVenta20));
  const esDecisionSi = proyecto.decisionPlazoVenta === 'Si';
  const esDecisionNo = proyecto.decisionPlazoVenta === 'No' || proyecto.seLlevoACabo === 'No se llevó a cabo' || proyecto.procesoCerrado;

  // Manejador para registrar decisión SÍ (El proceso continúa)
  const handleDecisionSi = () => {
    const ahora = new Date();
    const fechaHoy = ahora.toISOString().slice(0, 10);
    const horaHoy = ahora.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    const actualizado = calcularMetricasProyecto({
      ...proyecto,
      decisionPlazoVenta: 'Si',
      tiempoVentaCumplido: false,
      seLlevoACabo: proyecto.seLlevoACabo === 'No se llevó a cabo' ? 'En proceso' : (proyecto.seLlevoACabo || 'En proceso'),
      procesoCerrado: false,
      etapaFlujo: proyecto.etapaFlujo === 'cerrado' ? 'comercializacion' : proyecto.etapaFlujo,
      fechaRegistroDecision: fechaHoy,
      horaRegistroDecision: horaHoy,
      detalleRegistroDecision: `Decisión registrada en Gerencia de Comercialización: SÍ - El proceso continúa su curso institucional hacia matrícula y dictamen de Gerencia General (${fechaHoy} ${horaHoy}).`,
    });

    if (onActualizarProyecto) {
      onActualizarProyecto(actualizado);
    } else {
      onEditar(actualizado);
    }
  };

  // Manejador para registrar decisión NO (Cerrar automáticamente: No se llevó a cabo)
  const handleDecisionNo = () => {
    const ahora = new Date();
    const fechaHoy = ahora.toISOString().slice(0, 10);
    const horaHoy = ahora.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    const actualizado = calcularMetricasProyecto({
      ...proyecto,
      decisionPlazoVenta: 'No',
      tiempoVentaCumplido: true,
      seLlevoACabo: 'No se llevó a cabo',
      procesoCerrado: true,
      etapaFlujo: 'cerrado',
      fechaCierrePorTiempo: fechaHoy,
      fechaRegistroDecision: fechaHoy,
      horaRegistroDecision: horaHoy,
      motivoCierre: `Decisión en Gerencia de Comercialización: NO - Proceso cerrado formalmente como "No se llevó a cabo" (Plazo de 20 días calendario cumplido) (${fechaHoy} ${horaHoy}).`,
      detalleRegistroDecision: `Decisión registrada en Gerencia de Comercialización: NO - Proceso cerrado formalmente como "No se llevó a cabo" dentro del plazo de 20 días calendario (${fechaHoy} ${horaHoy}).`,
    });

    if (onActualizarProyecto) {
      onActualizarProyecto(actualizado);
    } else {
      onEditar(actualizado);
    }
  };

  const totalCambios = proyecto.historialCambios?.length || 0;

  // Cálculo del desglose fiscal rápido para el resumen
  const desgloseFiscalRapido = calcularImpactoFiscalCompleto(proyecto);

  // Cálculos dinámicos del simulador "¿Qué pasa si inscribo X alumnos?"
  const simuladorAlumnosNum = Math.max(0, simuladorAlumnos);
  const ingresoSimulado = simuladorAlumnosNum * proyecto.precioSugeridoAlumno;
  const gananciaSimulada = ingresoSimulado - proyecto.gastoTotalOperativo;
  const roiSimulado = proyecto.gastoTotalOperativo > 0 
    ? (gananciaSimulada / proyecto.gastoTotalOperativo) * 100 
    : 0;

  const desgloseCostos = [
    { nombre: 'Costo Docente', valor: proyecto.costoDocenteCalculado, porcentaje: ((proyecto.costoDocenteCalculado / (proyecto.gastoTotalOperativo || 1)) * 100).toFixed(1), color: 'bg-emerald-500' },
    { nombre: 'Plataforma Zoom', valor: proyecto.costoZoom, porcentaje: ((proyecto.costoZoom / (proyecto.gastoTotalOperativo || 1)) * 100).toFixed(1), color: 'bg-blue-500' },
    { nombre: 'Papelería y Materiales', valor: proyecto.costoPapeleria, porcentaje: ((proyecto.costoPapeleria / (proyecto.gastoTotalOperativo || 1)) * 100).toFixed(1), color: 'bg-purple-500' },
    { nombre: 'Gastos Varios / Imprevistos', valor: proyecto.gastosVarios, porcentaje: ((proyecto.gastosVarios / (proyecto.gastoTotalOperativo || 1)) * 100).toFixed(1), color: 'bg-amber-500' },
  ];

  // Escenarios de márgenes comparativos (30%, 40%, 50%, 80%, 100%)
  const escenariosMargenes = [30, 40, 50, 80, 100].map(m => {
    const ventaReq = proyecto.gastoTotalOperativo * (1 + m / 100);
    const gananciaOp = ventaReq - proyecto.gastoTotalOperativo;
    const precioSugerido = ventaReq / (proyecto.alumnosProyectados || 1);
    return {
      margen: m,
      ventaReq,
      gananciaOp,
      precioSugerido,
    };
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        id="modal-detalle-proyecto"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
      >
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <SummitLogo variant="icon" size="sm" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-black text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                  #{String(proyecto.numeroCorrelativo || proyecto.id).padStart(3, '0')}
                </span>
                <h2 className="text-lg font-bold text-slate-900">
                  {proyecto.nombreProyecto}
                </h2>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  {proyecto.codigoPrograma || `SUM-2026-${String(proyecto.numeroCorrelativo || proyecto.id).padStart(3, '0')}`}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                  {proyecto.tipoProyecto}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-mono text-purple-800 bg-purple-50 border border-purple-200">
                  SAR: {proyecto.codigoFiscalSAR || `SAR-ISV-2026-${String(proyecto.numeroCorrelativo || proyecto.id).padStart(3, '0')}`}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>Docente: <strong className="text-slate-700">{proyecto.nombreDocente}</strong></span>
                <span>•</span>
                <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                  📌 {proyecto.seccion || 'Sección A'}
                </span>
                <span className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                  🗓️ {proyecto.diasClase || 'Lunes, Miércoles y Viernes'}
                </span>
                <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                  ⏰ {proyecto.horario || '06:00 PM - 08:00 PM'}
                </span>
                <span>• Inicio: <strong className="text-slate-800 font-mono">{formatearFechaCorta(proyecto.fechaProgramacion)}</strong></span>
                {proyecto.fechaVenta && (
                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    ⚡ Fin Venta: <strong className="font-mono">{formatearFechaCorta(proyecto.fechaVenta)}</strong> ({contarDiasCalendarioEntreFechas(proyecto.fechaElaboracion || proyecto.fechaProgramacion, proyecto.fechaVenta)}d calendario)
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-modal-exportar-auditoria-pdf"
              type="button"
              onClick={() => {
                if (onExportarAuditoriaPDF) {
                  onExportarAuditoriaPDF(proyecto);
                } else {
                  setModalAuditoriaAbierto(true);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-800 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors border border-blue-300 shadow-xs cursor-pointer"
              title="Generar Reporte de Auditoría detallado en PDF (Historial de cambios, notas del auditor y cronología de estados)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
              <span className="hidden sm:inline">Auditoría PDF</span>
            </button>

            {onExportarPDF && (
              <button
                id="btn-modal-exportar-pdf"
                onClick={() => onExportarPDF(proyecto)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors border border-emerald-300 shadow-xs"
                title="Generar y exportar reporte ejecutivo en PDF"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">Reporte PDF</span>
              </button>
            )}
            <button
              onClick={() => {
                onClose();
                onEditar(proyecto);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Selector de Pestañas (Tabs) */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center gap-4 sm:gap-6 overflow-x-auto">
          <button
            id="tab-analisis-financiero"
            onClick={() => setTabActiva('financiero')}
            className={`py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              tabActiva === 'financiero'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>Análisis Financiero & Sensibilidad</span>
          </button>

          <button
            id="tab-punto-equilibrio"
            onClick={() => setTabActiva('punto_equilibrio')}
            className={`py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              tabActiva === 'punto_equilibrio'
                ? 'border-purple-600 text-purple-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span>Gráfico de Punto de Equilibrio</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200">
              {proyecto.puntoEquilibrioAlumnos} alumnos
            </span>
          </button>

          <button
            id="tab-desglose-fiscal"
            onClick={() => setTabActiva('fiscal')}
            className={`py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              tabActiva === 'fiscal'
                ? 'border-indigo-600 text-indigo-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4 text-indigo-600" />
            <span>Desglose Fiscal & Post-Impuestos</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              desgloseFiscalRapido.gravaISV
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
            }`}>
              {desgloseFiscalRapido.gravaISV ? '15% ISV' : '0% Exento'}
            </span>
          </button>

          <button
            id="tab-historial-cambios"
            onClick={() => setTabActiva('historial')}
            className={`py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              tabActiva === 'historial'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4 text-blue-600" />
            <span>Historial de Cambios & Auditoría</span>
            {totalCambios > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                tabActiva === 'historial'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {totalCambios}
              </span>
            )}
          </button>
        </div>

        {/* Contenido con Scroll */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {tabActiva === 'historial' ? (
            <ProjectHistoryTimeline 
              proyecto={proyecto}
              moneda={moneda}
              onAgregarHistorial={onAgregarHistorial ? (entrada) => onAgregarHistorial(proyecto.id, entrada) : undefined}
              onAbrirReporteAuditoria={() => {
                if (onExportarAuditoriaPDF) {
                  onExportarAuditoriaPDF(proyecto);
                } else {
                  setModalAuditoriaAbierto(true);
                }
              }}
            />
          ) : tabActiva === 'punto_equilibrio' ? (
            <ProjectBreakEvenChart
              proyecto={proyecto}
              moneda={moneda}
              alumnosSimulados={simuladorAlumnos}
              onCambiarAlumnosSimulados={setSimuladorAlumnos}
            />
          ) : tabActiva === 'fiscal' ? (
            <ProjectFiscalBreakdownSection
              proyecto={proyecto}
              moneda={moneda}
              onActualizarProyecto={onActualizarProyecto}
              onAgregarHistorial={onAgregarHistorial}
            />
          ) : (
            <>
              {/* Sección de Control de Comercialización & Decisión Institucional (Plazo de 20 Días Calendario Corridos) - Exclusivo para controles de Gerencia de Comercialización / vistas no académicas */}
              {vistaActual !== 'gerencia-academica' && (
                <div className={`p-4 rounded-2xl border-2 transition-all shadow-xs ${
                  esDecisionNo
                    ? 'bg-rose-50/85 border-rose-300'
                    : esDecisionSi
                    ? 'bg-emerald-50/85 border-emerald-300'
                    : 'bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-slate-50 border-emerald-300'
                }`}>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-700" />
                          Gerencia de Comercialización
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                          ⚡ 20 Días Calendario Corridos
                        </span>
                        <span className="text-xs font-black text-slate-900">
                          Decisión en Plazo de Comercialización
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                        Plazo formal institucional asignado a la Gerencia de Comercialización a partir de la elaboración académica (<strong>20 días calendario corridos</strong>).
                        Si se selecciona <strong>"Sí"</strong>, el proceso <strong>continúa</strong> activamente en el flujo institucional. Si se selecciona <strong>"No"</strong>, el proceso <strong>se cierra automáticamente</strong> como <strong>"No se llevó a cabo"</strong>. Ambos procesos quedan registrados para el control y trazabilidad de todo.
                      </p>

                      <div className="flex items-center gap-2 text-xs flex-wrap text-slate-600 pt-0.5">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                          <Calendar className="w-3 h-3 text-emerald-600" />
                          Creación Académica: <strong className="font-mono text-emerald-950">{formatearFechaCorta(fechaCreacionAcademica)}</strong>
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="inline-flex items-center gap-1 font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          <Clock className="w-3 h-3 text-blue-600" />
                          Fin Comercialización (20d): <strong className="font-mono">{formatearFechaCorta(fechaLimiteVenta20)}</strong>
                        </span>
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                          ⏱️ Transcurridos: {diasCalendarioTranscurridos}/20 días calendario ({diasCalendarioRestantes > 0 ? `${diasCalendarioRestantes}d restantes` : 'Plazo cumplido'})
                        </span>
                      </div>

                      {/* Registro de Auditoría de la Decisión */}
                      {proyecto.fechaRegistroDecision && (
                        <div className="text-[11px] flex items-center gap-1.5 flex-wrap pt-1">
                          <span className={`font-bold px-2 py-0.5 rounded border ${
                            esDecisionNo
                              ? 'bg-rose-100 text-rose-900 border-rose-300'
                              : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          }`}>
                            {esDecisionNo ? '⏹️ Registrado: NO (No se llevó a cabo)' : '✅ Registrado: SÍ (El proceso continúa)'}
                          </span>
                          <span className="text-slate-500 font-mono">
                            Fecha/Hora: {proyecto.fechaRegistroDecision} {proyecto.horaRegistroDecision || ''}
                          </span>
                          {proyecto.detalleRegistroDecision && (
                            <span className="text-slate-600 italic">
                              — {proyecto.detalleRegistroDecision}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Botones de Decisión Sí / No */}
                    <div className="flex items-center gap-2 shrink-0 self-start lg:self-center bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[11px] font-bold text-slate-700 block text-right sm:inline">
                        ¿El proceso continúa?
                      </span>

                      <button
                        type="button"
                        onClick={handleDecisionSi}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border shadow-2xs ${
                          esDecisionSi
                            ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-400'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                        }`}
                        title="Registra formalmente que el proyecto continúa activamente en el flujo institucional"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Sí</span>
                        <span className="text-[10px] font-normal opacity-90">(Continúa)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDecisionNo}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border shadow-2xs ${
                          esDecisionNo
                            ? 'bg-rose-600 text-white border-rose-700 ring-2 ring-rose-400'
                            : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                        }`}
                        title="Cierra automáticamente el proceso y queda registrado formalmente como 'No se llevó a cabo'"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>No</span>
                        <span className="text-[10px] font-normal opacity-90">(Cerrar)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tarjetas Principales de Resumen del Proyecto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                
                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60">
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                    Gasto Total Operativo
                  </span>
                  <div className="text-lg font-black text-amber-950 font-mono mt-1">
                    {formatearMoneda(proyecto.gastoTotalOperativo, moneda)}
                  </div>
                  <p className="text-[11px] text-amber-700 mt-1">
                    {proyecto.horasClase}h clase ({formatearMoneda(proyecto.tarifaHoraDocente, moneda)}/h)
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60">
                  <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
                    Precio Sugerido Alumno
                  </span>
                  <div className="text-lg font-black text-blue-950 font-mono mt-1">
                    {formatearMoneda(proyecto.precioSugeridoAlumno, moneda)}
                  </div>
                  <p className="text-[11px] text-blue-700 mt-1">
                    {proyecto.alumnosProyectados} alumnos • {proyecto.margenGananciaOperativa}% margen
                  </p>
                </div>

                <div className={`p-3.5 rounded-xl border ${
                  proyecto.totalGananciasFinales >= 0 ? 'border-emerald-200 bg-emerald-50/60' : 'border-rose-200 bg-rose-50/60'
                }`}>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Ganancia Pre-Impuestos (EBIT)
                  </span>
                  <div className={`text-lg font-black font-mono mt-1 ${
                    proyecto.totalGananciasFinales >= 0 ? 'text-emerald-900' : 'text-rose-900'
                  }`}>
                    {formatearMoneda(proyecto.totalGananciasFinales, moneda)}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    {proyecto.alumnosFinal} inscritos (ROI: {proyecto.roiPorcentaje.toFixed(1)}%)
                  </p>
                </div>

                <div className={`p-3.5 rounded-xl border cursor-pointer hover:shadow-xs transition-all ${
                  desgloseFiscalRapido.gananciaNetaPostImpuestos >= 0 
                    ? 'border-indigo-300 bg-gradient-to-br from-indigo-50/90 to-purple-50/50' 
                    : 'border-rose-300 bg-gradient-to-br from-rose-50/90 to-rose-100/50'
                }`}
                onClick={() => setTabActiva('fiscal')}
                title="Haz clic para ver el desglose fiscal detallado"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-950">
                      Ganancia Post-Impuestos
                    </span>
                    <span className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-0.5">
                      Ver Desglose →
                    </span>
                  </div>
                  <div className={`text-lg font-black font-mono mt-1 ${
                    desgloseFiscalRapido.gananciaNetaPostImpuestos >= 0 ? 'text-indigo-950' : 'text-rose-950'
                  }`}>
                    {formatearMoneda(desgloseFiscalRapido.gananciaNetaPostImpuestos, moneda)}
                  </div>
                  <p className="text-[11px] text-indigo-900 mt-1 flex items-center justify-between">
                    <span>Margen Neto: <strong>{desgloseFiscalRapido.margenNetoPostImpuestos.toFixed(1)}%</strong></span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {desgloseFiscalRapido.gravaISV ? 'ISV 15%' : 'Exento'}
                    </span>
                  </p>
                </div>

              </div>

              {/* Régimen Fiscal y Tratamiento ISV (SAR) */}
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-amber-200/80 pb-2">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-amber-800" />
                    <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                      Régimen Fiscal ISV (Servicio de Administración de Rentas - SAR)
                    </h4>
                  </div>
                  {proyecto.aplicaISV ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-amber-200 text-amber-950 border border-amber-300">
                      ✅ Grava 15% ISV
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-950 border border-emerald-300">
                      ❌ Exento de ISV (0%)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
                      Servicio Clasificado:
                    </span>
                    <p className="font-bold text-slate-900">
                      {proyecto.servicioFiscal || 'Servicios educativos no acreditados (talleres, cursos libres)'}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-1 bg-white p-2 rounded border border-amber-200/60 leading-relaxed">
                      <strong>Dictamen SAR:</strong> {obtenerReglaISVPorServicio(proyecto.servicioFiscal).observaciones}
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Venta Requerida Base Curso:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatearMoneda(proyecto.precioVentaRequerido, moneda)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-amber-800">
                      <span>15% ISV Total Curso:</span>
                      <span className="font-mono font-bold">
                        {proyecto.aplicaISV ? `+${formatearMoneda(proyecto.isvVentaRequeridaTotal || (proyecto.precioVentaRequerido * 0.15), moneda)}` : 'L 0.00 (Exento)'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-100 font-bold text-emerald-950">
                      <span>Total Venta Curso + ISV:</span>
                      <span className="font-mono text-xs text-emerald-800">
                        {formatearMoneda(proyecto.precioVentaRequeridoConISV || (proyecto.precioVentaRequerido * (proyecto.aplicaISV ? 1.15 : 1)), moneda)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-amber-200">
                      <span className="text-slate-600">Precio Sugerido / Alumno:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatearMoneda(proyecto.precioSugeridoAlumno, moneda)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-amber-800">
                      <span>ISV por Alumno (15%):</span>
                      <span className="font-mono font-bold">
                        {proyecto.aplicaISV ? `+${formatearMoneda(proyecto.isvPorAlumno || 0, moneda)}` : 'L 0.00 (Exento)'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-amber-200 font-bold text-amber-950">
                      <span>Precio Facturado al Alumno:</span>
                      <span className="font-mono text-sm text-amber-900">
                        {formatearMoneda(proyecto.precioSugeridoConISV || proyecto.precioSugeridoAlumno, moneda)}
                      </span>
                    </div>

                    {proyecto.alumnosFinal > 0 && proyecto.aplicaISV && (
                      <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 border-t border-slate-100">
                        <span>Total ISV a Trasladar a SAR ({proyecto.alumnosFinal} alumnos):</span>
                        <span className="font-mono font-bold text-amber-800">
                          {formatearMoneda((proyecto.isvPorAlumno || 0) * proyecto.alumnosFinal, moneda)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Banner directo hacia el Desglose Fiscal Completo */}
                <div className="pt-2.5 border-t border-amber-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                  <div className="text-xs">
                    <span className="text-slate-600 font-medium">Ganancia Neta Estimada Post-Impuestos (ISR + Tasas): </span>
                    <strong className="font-mono text-indigo-950 text-sm font-bold ml-1">
                      {formatearMoneda(desgloseFiscalRapido.gananciaNetaPostImpuestos, moneda)}
                    </strong>
                    <span className="text-slate-500 text-[11px] ml-1">
                      ({desgloseFiscalRapido.margenNetoPostImpuestos.toFixed(1)}% margen neto líquido)
                    </span>
                  </div>
                  <button
                    id="btn-ver-desglose-fiscal-completo"
                    type="button"
                    onClick={() => setTabActiva('fiscal')}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-900 bg-white hover:bg-indigo-50 border border-indigo-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5 text-indigo-700" />
                    <span>Ver Desglose Fiscal Completo (ISR & Retenciones) →</span>
                  </button>
                </div>
              </div>

              {/* Objetivo General y Temas a Impartir (Curricular) */}
              <div className="space-y-4">
                {proyecto.objetivoGeneral && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                      Objetivo General del Proyecto
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {proyecto.objetivoGeneral}
                    </p>
                  </div>
                )}

                {/* Temas a Impartir (Abajo del Objetivo General) */}
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-700" />
                      Planificación Curricular & Metodología de Impartición
                    </h4>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      Gerencia Académica
                    </span>
                  </div>

                  {/* Métricas Curriculares */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Cantidad de Temas</span>
                      <div className="text-sm font-black text-slate-800 font-mono mt-0.5">
                        {proyecto.cantidadTemas || 4} temas / módulos
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Horas Clase por Tema</span>
                      <div className="text-sm font-black text-emerald-700 font-mono mt-0.5">
                        {proyecto.horasClasePorTema || (proyecto.horasClase ? Math.max(1, Math.round(proyecto.horasClase / (proyecto.cantidadTemas || 4))) : (proyecto.nivel === 'Básico' ? 3 : 5))} hrs/tema
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-emerald-300 bg-emerald-50/40">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase">Total Horas Curso</span>
                      <div className="text-sm font-black text-emerald-950 font-mono mt-0.5">
                        {proyecto.horasClase} horas totales
                      </div>
                    </div>
                  </div>

                  {/* Metodología Pedagógica */}
                  {proyecto.metodologia && (
                    <div className="bg-white p-3 rounded-lg border border-emerald-200/80">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                        🎯 Metodología Pedagógica a Implementar
                      </span>
                      <p className="text-xs font-semibold text-slate-800">
                        {proyecto.metodologia}
                      </p>
                    </div>
                  )}

                  {/* Temas / Syllabus */}
                  {proyecto.temasImpartir ? (
                    <div className="bg-white p-3 rounded-lg border border-emerald-200/80 text-xs text-slate-800 font-mono whitespace-pre-line leading-relaxed">
                      {proyecto.temasImpartir}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic bg-white p-3 rounded-lg border border-emerald-100">
                      No se han desglosado temas específicos para este curso. Puede editarlos en el formulario del proyecto.
                    </p>
                  )}

                  {/* Documento de Planificación del Curso (PDF) */}
                  {proyecto.planificacionPdf && (
                    <div className="bg-white p-3 rounded-lg border border-rose-200 flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 truncate">
                            {proyecto.planificacionPdf.nombreArchivo}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Documento de Planificación Curricular {proyecto.planificacionPdf.tamanoKb ? `• ${proyecto.planificacionPdf.tamanoKb} KB` : ''}
                          </div>
                        </div>
                      </div>
                      <a
                        href={proyecto.planificacionPdf.dataUrl}
                        download={proyecto.planificacionPdf.nombreArchivo}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar PDF</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Perfil Docente y Calificación del Curso (Grid 2 Columnas) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Perfil del Docente Asignado */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                      Cuerpo Docente y Contacto Directo
                    </h4>
                    <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                      {proyecto.docenteClasificacion || 'Licenciatura'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Docente Responsable:</span>
                      <strong className="text-slate-900 font-semibold">{proyecto.nombreDocente}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Grado Académico:</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-blue-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                        <Award className="w-3 h-3 text-blue-600" />
                        {proyecto.docenteClasificacion || 'Licenciatura'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Número de Contacto:</span>
                      {proyecto.docenteTelefono ? (
                        <a 
                          href={`tel:${proyecto.docenteTelefono}`}
                          className="inline-flex items-center gap-1 font-mono font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          {proyecto.docenteTelefono}
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">No registrado</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Correo Institucional:</span>
                      {proyecto.docenteCorreo ? (
                        <a 
                          href={`mailto:${proyecto.docenteCorreo}`}
                          className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 truncate max-w-[200px]"
                          title={proyecto.docenteCorreo}
                        >
                          <Mail className="w-3 h-3 text-blue-600" />
                          {proyecto.docenteCorreo}
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">docente@summit.hn</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Calificación del Curso y Encuesta de Satisfacción */}
                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
                    <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      Evaluación & Satisfacción Estudiantil
                    </h4>
                    <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-300">
                      Gerencia Comercial
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Calificación del Curso:</span>
                      <div className="flex items-center gap-1.5">
                        <div className="flex text-amber-500 text-xs">
                          {['★', '★', '★', '★', '★'].map((star, idx) => (
                            <span key={idx} className={idx < Math.round(Number(proyecto.calificacionCurso) || 5) ? 'text-amber-500' : 'text-slate-300'}>
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-sm font-black font-mono text-indigo-950 bg-white px-2 py-0.5 rounded border border-indigo-200">
                          {proyecto.calificacionCurso ? Number(proyecto.calificacionCurso).toFixed(1) : '5.0'} / 5.0
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Estado de la Encuesta:</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border ${
                        proyecto.encuestaSatisfaccion?.estado === 'Completada'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : proyecto.encuestaSatisfaccion?.estado === 'Enviada'
                          ? 'bg-blue-100 text-blue-900 border-blue-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}>
                        <CheckCircle2 className="w-3 h-3" />
                        {proyecto.encuestaSatisfaccion?.estado || 'Enviada a Estudiantes'}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-indigo-100 text-[11px] text-slate-600 leading-relaxed">
                      <span className="font-semibold text-slate-800">Proceso Comercial: </span>
                      La Gerencia Comercial genera la encuesta de satisfacción y la distribuye por WhatsApp y correo a los {proyecto.alumnosFinal} estudiantes registrados para calcular el NPS y feedback docente.
                    </div>
                  </div>
                </div>
              </div>

              {proyecto.observaciones && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600">
                  <strong className="text-slate-800">Observaciones Generales:</strong> {proyecto.observaciones}
                </div>
              )}

              {/* Desglose de Gastos Operativos */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  Desglose de Gastos Operativos (Fijos y Variables)
                </h4>
                
                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                  {/* Barra proporcional */}
                  <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden">
                    {desgloseCostos.map((item, idx) => (
                      <div
                        key={idx}
                        className={`${item.color} h-full`}
                        style={{ width: `${item.porcentaje}%` }}
                        title={`${item.nombre}: ${item.porcentaje}%`}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                    {desgloseCostos.map((c, idx) => (
                      <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${c.color}`} />
                          <span className="text-[11px] font-semibold text-slate-700 truncate">{c.nombre}</span>
                        </div>
                        <div className="text-sm font-bold font-mono text-slate-900 mt-1">
                          {formatearMoneda(c.valor, moneda)}
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {c.porcentaje}% del total
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Visualización del Gráfico de Punto de Equilibrio (Ingresos vs Costos Totales) */}
              <ProjectBreakEvenChart
                proyecto={proyecto}
                moneda={moneda}
                alumnosSimulados={simuladorAlumnos}
                onCambiarAlumnosSimulados={setSimuladorAlumnos}
              />

              {/* Simulador Interactivo de Inscripciones */}
              <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-purple-400" />
                    <h4 className="text-xs font-bold text-purple-200 uppercase tracking-wider">
                      Simulador de Sensibilidad: ¿Qué pasa si inscribo más o menos alumnos?
                    </h4>
                  </div>
                  <span className="text-xs font-mono text-emerald-400">
                    Punto de Equilibrio: <strong>{proyecto.puntoEquilibrioAlumnos} alumnos</strong>
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Seleccionar número de alumnos simulados:</span>
                    <span className="text-base font-bold font-mono text-purple-300 bg-purple-950/80 px-3 py-0.5 rounded border border-purple-800">
                      {simuladorAlumnosNum} alumnos
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={simuladorAlumnosNum}
                    onChange={(e) => setSimuladorAlumnos(Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>0</span>
                    <span>5</span>
                    <span>10</span>
                    <span>15</span>
                    <span>20</span>
                    <span>25</span>
                    <span>30 alumnos</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase">Ingreso Simulado</span>
                    <div className="text-base font-bold font-mono text-blue-300">
                      {formatearMoneda(ingresoSimulado, moneda)}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {simuladorAlumnosNum} × {formatearMoneda(proyecto.precioSugeridoAlumno, moneda)}
                    </span>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase">Gasto Fijo Operativo</span>
                    <div className="text-base font-bold font-mono text-amber-300">
                      {formatearMoneda(proyecto.gastoTotalOperativo, moneda)}
                    </div>
                    <span className="text-[10px] text-slate-400">Costo total cubierto</span>
                  </div>

                  <div className={`p-3 rounded-lg border ${
                    gananciaSimulada >= 0 ? 'bg-emerald-950/80 border-emerald-700 text-emerald-100' : 'bg-rose-950/80 border-rose-700 text-rose-100'
                  }`}>
                    <span className="text-[10px] uppercase font-bold">Utilidad Simulada</span>
                    <div className="text-base font-black font-mono">
                      {formatearMoneda(gananciaSimulada, moneda)}
                    </div>
                    <span className="text-[10px]">
                      ROI: {roiSimulado.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Matriz de Escenarios por Margen de Referencia */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-blue-600" />
                  Comparativa de Precios según Margen de Rentabilidad Deseado
                </h4>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Margen Objetivo</th>
                        <th className="p-2.5 text-right">Venta Total Requerida</th>
                        <th className="p-2.5 text-right">Ganancia Operativa Base</th>
                        <th className="p-2.5 text-right font-bold text-blue-900">Precio Sugerido / Alumno</th>
                        <th className="p-2.5 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      {escenariosMargenes.map((esc) => {
                        const esActual = esc.margen === proyecto.margenGananciaOperativa;
                        return (
                          <tr key={esc.margen} className={esActual ? 'bg-blue-50/70 font-semibold text-blue-900' : 'hover:bg-slate-50'}>
                            <td className="p-2.5 font-sans font-bold">
                              {esc.margen}% {esActual && <span className="text-[10px] bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded ml-1.5">Actual</span>}
                            </td>
                            <td className="p-2.5 text-right">{formatearMoneda(esc.ventaReq, moneda)}</td>
                            <td className="p-2.5 text-right text-emerald-700">+{formatearMoneda(esc.gananciaOp, moneda)}</td>
                            <td className="p-2.5 text-right font-bold text-blue-800">{formatearMoneda(esc.precioSugerido, moneda)}</td>
                            <td className="p-2.5 text-center font-sans text-[11px] text-slate-500">
                              {esc.margen <= 40 ? 'Estándar' : esc.margen <= 60 ? 'Óptimo' : 'Alto Rendimiento'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              id="btn-modal-footer-auditoria-pdf"
              type="button"
              onClick={() => {
                if (onExportarAuditoriaPDF) {
                  onExportarAuditoriaPDF(proyecto);
                } else {
                  setModalAuditoriaAbierto(true);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-800 hover:text-blue-700 bg-white hover:bg-blue-50 border border-slate-300 hover:border-blue-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Reporte de Auditoría PDF</span>
            </button>

            {onExportarPDF && (
              <button
                onClick={() => onExportarPDF(proyecto)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-800 hover:text-emerald-700 bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-300 rounded-lg transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Exportar Informe Financiero PDF</span>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>

      {/* Modal de Reporte Detallado de Auditoría en PDF */}
      <ProjectAuditReportModal
        isOpen={modalAuditoriaAbierto}
        onClose={() => setModalAuditoriaAbierto(false)}
        proyecto={proyecto}
        moneda={moneda}
      />
    </div>
  );
};

