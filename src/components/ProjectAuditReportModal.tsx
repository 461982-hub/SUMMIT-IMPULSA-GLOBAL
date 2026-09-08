import React, { useState, useMemo } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  FileText, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  History, 
  Users, 
  DollarSign, 
  Layers, 
  FileCheck, 
  Building2, 
  ExternalLink,
  ChevronRight,
  Info,
  Sparkles,
  Award
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../types';
import { formatearMoneda, calcularMetricasProyecto } from '../utils/calculations';
import { 
  exportarReporteAuditoriaProyectoPDF, 
  reconstruirCronologiaEstados, 
  extraerNotasAuditor, 
  DictamenAuditoriaTipo,
  ResultadoReporteAuditoriaPDF 
} from '../utils/projectAuditPdfReport';
import { SummitLogo } from './SummitLogo';

interface ProjectAuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyecto: ProyectoEducativo | null;
  moneda: Moneda;
  onNotificar?: (mensaje: string) => void;
}

export const ProjectAuditReportModal: React.FC<ProjectAuditReportModalProps> = ({
  isOpen,
  onClose,
  proyecto,
  moneda,
  onNotificar,
}) => {
  const [tabActiva, setTabActiva] = useState<'resumen' | 'cronologia' | 'historial' | 'notas' | 'configuracion'>('resumen');
  const [auditorNombre, setAuditorNombre] = useState<string>('Lic. Walter Pedroza • Auditor Interno');
  const [auditorCargo, setAuditorCargo] = useState<string>('Dirección de Auditoría Interna & Control de Gestión');
  const [dictamenSeleccionado, setDictamenSeleccionado] = useState<DictamenAuditoriaTipo | ''>('');
  const [notasAdicionales, setNotasAdicionales] = useState<string>('');
  const [guardarEnDrive, setGuardarEnDrive] = useState<boolean>(true);
  const [generandoPDF, setGenerandoPDF] = useState<boolean>(false);
  const [progresoTexto, setProgresoTexto] = useState<string>('');
  const [ultimoResultado, setUltimoResultado] = useState<ResultadoReporteAuditoriaPDF | null>(null);

  const metricas = useMemo(() => {
    if (!proyecto) return null;
    return calcularMetricasProyecto(proyecto);
  }, [proyecto]);

  const cronologia = useMemo(() => {
    if (!proyecto) return [];
    return reconstruirCronologiaEstados(proyecto);
  }, [proyecto]);

  const notasAuditor = useMemo(() => {
    if (!proyecto || !metricas) return [];
    return extraerNotasAuditor(proyecto, metricas, moneda, notasAdicionales, auditorNombre);
  }, [proyecto, metricas, moneda, notasAdicionales, auditorNombre]);

  if (!isOpen || !proyecto || !metricas) return null;

  const margenRealPct = metricas.ingresoRealTotal > 0
    ? (metricas.totalGananciasFinales / metricas.ingresoRealTotal) * 100
    : 0;

  const cumplePuntoEq = metricas.alumnosFinal >= metricas.puntoEquilibrioAlumnos;
  const cumpleMargen = margenRealPct >= 15;

  const dictamenCalculado: DictamenAuditoriaTipo = dictamenSeleccionado || (
    cumplePuntoEq && cumpleMargen
      ? 'FAVORABLE'
      : cumplePuntoEq
      ? 'FAVORABLE_CON_OBSERVACIONES'
      : metricas.totalGananciasFinales >= 0
      ? 'EN_RIESGO'
      : 'DESFAVORABLE'
  );

  const codigoExpediente = `AUD-PROY-2026-${String(proyecto.numeroCorrelativo || proyecto.id).padStart(3, '0')}`;
  const historialCambios = proyecto.historialCambios || [];

  const handleGenerarPDF = async () => {
    setGenerandoPDF(true);
    setProgresoTexto('Iniciando generación de reporte...');
    try {
      const resultado = await exportarReporteAuditoriaProyectoPDF({
        proyecto,
        moneda,
        auditorNombre: auditorNombre.trim() || 'Auditor Interno Titular',
        auditorCargo: auditorCargo.trim() || 'Dirección de Auditoría Interna',
        dictamenAuditor: dictamenCalculado,
        notasAdicionalesAuditor: notasAdicionales.trim() || undefined,
        guardarEnDrive,
        onProgreso: (msg) => setProgresoTexto(msg),
      });

      setUltimoResultado(resultado);
      if (resultado.guardadoEnDrive) {
        onNotificar?.(`✅ Reporte de Auditoría (${resultado.codigoExpediente}) generado y respaldado en Google Drive.`);
      } else {
        onNotificar?.(`📄 Reporte de Auditoría (${resultado.codigoExpediente}) descargado en PDF exitosamente.`);
      }
    } catch (err: any) {
      console.error('Error al generar reporte de auditoría en PDF:', err);
      alert(`Error al generar el reporte de auditoría: ${err.message || 'Error desconocido'}`);
    } finally {
      setGenerandoPDF(false);
      setProgresoTexto('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white print:static">
      <div 
        id="modal-reporte-auditoria"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none animate-in fade-in zoom-in-95 duration-150"
      >
        {/* ENCABEZADO SUPERIOR */}
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 text-white print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-slate-950">
                  {codigoExpediente}
                </span>
                <span className="text-xs text-blue-300 font-semibold">
                  Auditoría Individual de Proyecto
                </span>
              </div>
              <h2 className="text-base font-bold text-white line-clamp-1 mt-0.5">
                Reporte de Auditoría: {proyecto.nombreProyecto}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              id="btn-imprimir-auditoria"
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
              title="Imprimir vista de pantalla"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              id="btn-descargar-auditoria-pdf"
              type="button"
              onClick={handleGenerarPDF}
              disabled={generandoPDF}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{generandoPDF ? (progresoTexto || 'Generando...') : 'Descargar PDF Detallado'}</span>
            </button>

            <button
              id="btn-cerrar-modal-auditoria"
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BARRA DE TABS / PESTAÑAS */}
        <div className="px-6 border-b border-slate-200 bg-slate-50 flex items-center gap-1 sm:gap-2 overflow-x-auto print:hidden">
          <button
            type="button"
            onClick={() => setTabActiva('resumen')}
            className={`py-3 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              tabActiva === 'resumen'
                ? 'border-blue-600 text-blue-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Resumen Ejecutivo</span>
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('cronologia')}
            className={`py-3 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              tabActiva === 'cronologia'
                ? 'border-blue-600 text-blue-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Cronología de Estados ({cronologia.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('historial')}
            className={`py-3 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              tabActiva === 'historial'
                ? 'border-blue-600 text-blue-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4 text-indigo-600" />
            <span>Historial de Cambios ({historialCambios.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('notas')}
            className={`py-3 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              tabActiva === 'notas'
                ? 'border-blue-600 text-blue-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-600" />
            <span>Notas del Auditor ({notasAuditor.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('configuracion')}
            className={`py-3 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              tabActiva === 'configuracion'
                ? 'border-blue-600 text-blue-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4 text-purple-600" />
            <span>Dictamen & Emisión PDF</span>
          </button>
        </div>

        {/* NOTIFICACIÓN DE GENERACIÓN EXITOSA */}
        {ultimoResultado && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-900">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold">PDF Generado Exitosamente: </span>
                <span className="font-mono">{ultimoResultado.nombreArchivo}</span>
                {ultimoResultado.guardadoEnDrive && (
                  <span className="ml-2 font-semibold text-emerald-700">
                    • Respaldado en Google Drive
                  </span>
                )}
              </div>
            </div>
            {ultimoResultado.driveUrl && (
              <a
                href={ultimoResultado.driveUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors"
              >
                <span>Ver en Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* CONTENIDO DEL MODAL */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          
          {/* ========================================================================= */}
          {/* TAB 1: RESUMEN EJECUTIVO */}
          {/* ========================================================================= */}
          {tabActiva === 'resumen' && (
            <div className="space-y-6">
              {/* Tarjeta de Dictamen y Estado Actual */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                      Dictamen Preliminar de Auditoría
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                      dictamenCalculado === 'FAVORABLE' ? 'bg-emerald-100 text-emerald-800' :
                      dictamenCalculado === 'FAVORABLE_CON_OBSERVACIONES' ? 'bg-amber-100 text-amber-800' :
                      dictamenCalculado === 'EN_RIESGO' ? 'bg-orange-100 text-orange-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {dictamenCalculado.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">
                    {proyecto.nombreProyecto}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Docente: <strong className="text-slate-800">{proyecto.nombreDocente}</strong> • Nivel: <strong>{proyecto.nivel || 'Básico'}</strong> • Modalidad: <strong>{proyecto.modalidad || 'Virtual'}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[11px] text-slate-500">Estado de Ejecución</div>
                    <div className="text-sm font-bold text-slate-900">
                      {proyecto.seLlevoACabo === 'Sí' ? '🟢 Realizado / Liquidado' :
                       proyecto.seLlevoACabo === 'En curso' ? '🔵 En Curso Activo' :
                       proyecto.seLlevoACabo === 'Pospuesto' ? '🟡 Pospuesto' : '🔴 Cancelado'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerarPDF}
                    disabled={generandoPDF}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Emitir Dictamen en PDF</span>
                  </button>
                </div>
              </div>

              {/* 4 KPIs Clave */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Ingresos Reales</div>
                  <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
                    {formatearMoneda(metricas.ingresoRealTotal, moneda)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Proy: {formatearMoneda(metricas.ingresoFacturadoTotal || 0, moneda)}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Gasto Operativo</div>
                  <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
                    {formatearMoneda(metricas.gastoTotalOperativo, moneda)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Docente: {formatearMoneda(metricas.costoDocenteCalculado, moneda)}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Utilidad Operativa</div>
                  <div className={`text-lg font-black font-mono mt-0.5 ${
                    metricas.totalGananciasFinales >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {formatearMoneda(metricas.totalGananciasFinales, moneda)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Margen: <strong>{margenRealPct.toFixed(1)}%</strong> (Obj: {proyecto.margenGananciaOperativa}%)
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Aforo vs Pto. Eq.</div>
                  <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
                    {metricas.alumnosFinal} <span className="text-xs font-normal text-slate-500">alumnos</span>
                  </div>
                  <div className={`text-[11px] font-semibold mt-0.5 ${
                    cumplePuntoEq ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    PE: {metricas.puntoEquilibrioAlumnos} alum. ({cumplePuntoEq ? '✓ Cubierto' : '✗ Déficit'})
                  </div>
                </div>
              </div>

              {/* Trazabilidad en 3 Columnas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Col 1: Cronología Resumida */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Cronología ({cronologia.length})</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setTabActiva('cronologia')}
                      className="text-[11px] text-blue-600 hover:underline font-semibold"
                    >
                      Ver todo
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    {cronologia.slice(0, 3).map((item) => (
                      <div key={item.paso} className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="font-bold text-slate-800 line-clamp-1">{item.hito}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{item.fechaLegible} • {item.estadoNuevo}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Col 2: Historial Resumido */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                      <History className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Modificaciones ({historialCambios.length})</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setTabActiva('historial')}
                      className="text-[11px] text-blue-600 hover:underline font-semibold"
                    >
                      Ver todo
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    {historialCambios.length === 0 ? (
                      <div className="text-[11px] text-slate-400 italic p-2">Sin cambios posteriores al registro inicial.</div>
                    ) : (
                      historialCambios.slice(0, 3).map((h, i) => (
                        <div key={h.id || i} className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="font-bold text-slate-800 line-clamp-1">{h.titulo}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{h.usuario || 'Coordinación'}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Col 3: Notas del Auditor */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                      <FileText className="w-3.5 h-3.5 text-amber-600" />
                      <span>Notas & Hallazgos ({notasAuditor.length})</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setTabActiva('notas')}
                      className="text-[11px] text-blue-600 hover:underline font-semibold"
                    >
                      Ver todo
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    {notasAuditor.slice(0, 3).map((n) => (
                      <div key={n.id} className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="font-bold text-slate-800 line-clamp-1">{n.titulo}</div>
                        <div className="text-[10px] text-slate-500 line-clamp-1">{n.contenido}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: CRONOLOGÍA DE ESTADOS */}
          {/* ========================================================================= */}
          {tabActiva === 'cronologia' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>Línea de Tiempo y Cronología de Estados</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Historial secuencial de cada etapa y estado por los que ha transitado el programa.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-md text-slate-700">
                  {cronologia.length} Hitos
                </span>
              </div>

              <div className="space-y-3">
                {cronologia.map((item) => (
                  <div 
                    key={item.paso}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-blue-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center">
                          {item.paso}
                        </div>
                        <h4 className="font-bold text-sm text-slate-900">
                          {item.hito}
                        </h4>
                      </div>
                      <div className="text-xs font-mono text-slate-500">
                        {item.fechaLegible}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Transición de Estado</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-slate-500 font-medium">{item.estadoAnterior}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-bold text-slate-900">{item.estadoNuevo}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Responsable / Instancia</span>
                        <div className="font-semibold text-slate-800 mt-0.5">{item.responsable}</div>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Tiempo en Fase</span>
                        <div className="font-mono text-slate-700 mt-0.5">{item.diasEnFase || 'N/A'}</div>
                      </div>
                    </div>

                    <p className="mt-2.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {item.justificacion}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: HISTORIAL DE CAMBIOS */}
          {/* ========================================================================= */}
          {tabActiva === 'historial' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <History className="w-4 h-4 text-indigo-600" />
                    <span>Registro Completo de Modificaciones Técnicas</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Detalle de modificaciones en costos, tarifas docentes, proyección de aforo y márgenes.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-md text-slate-700">
                  {historialCambios.length} Registros
                </span>
              </div>

              {historialCambios.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs">
                  No hay modificaciones registradas posteriores a la apertura inicial.
                </div>
              ) : (
                <div className="space-y-3">
                  {historialCambios.map((cambio, index) => (
                    <div 
                      key={cambio.id || index}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-700 font-mono text-xs font-bold flex items-center justify-center">
                            #{index + 1}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900">{cambio.titulo}</h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                            {cambio.tipoCambio}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-slate-500">
                          {new Date(cambio.fecha).toLocaleString('es-HN')} • {cambio.usuario || 'Coordinación'}
                        </div>
                      </div>

                      <p className="text-xs text-slate-600">{cambio.descripcion}</p>

                      {cambio.modificaciones && cambio.modificaciones.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                              <tr>
                                <th className="p-2">Campo Modificado</th>
                                <th className="p-2">Valor Anterior</th>
                                <th className="p-2">Valor Nuevo</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                              {cambio.modificaciones.map((m, mIdx) => (
                                <tr key={mIdx} className="hover:bg-slate-50">
                                  <td className="p-2 font-sans font-medium text-slate-800">{m.etiqueta}</td>
                                  <td className="p-2 text-rose-600">{String(m.valorAnterior)}</td>
                                  <td className="p-2 text-emerald-600 font-bold">{String(m.valorNuevo)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {cambio.impactoFinanciero && (
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                          <div>
                            <span className="text-[10px] text-slate-500 font-sans block">Gasto Operativo</span>
                            <span className="font-bold text-slate-800">{formatearMoneda(cambio.impactoFinanciero.gastoOperativoNuevo, moneda)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-sans block">Precio Sugerido</span>
                            <span className="font-bold text-slate-800">{formatearMoneda(cambio.impactoFinanciero.precioSugeridoNuevo, moneda)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-sans block">Ganancia Proyectada</span>
                            <span className="font-bold text-emerald-700">{formatearMoneda(cambio.impactoFinanciero.gananciaFinalNueva, moneda)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-sans block">Punto Equilibrio</span>
                            <span className="font-bold text-blue-700">{cambio.impactoFinanciero.puntoEquilibrioNuevo} alumnos</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: NOTAS DEL AUDITOR & HALLAZGOS */}
          {/* ========================================================================= */}
          {tabActiva === 'notas' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span>Notas de Auditoría y Observaciones Registradas</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Anotaciones del equipo de auditoría, observaciones operativas y hallazgos automáticos.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-md text-slate-700">
                  {notasAuditor.length} Notas
                </span>
              </div>

              <div className="space-y-3">
                {notasAuditor.map((n) => (
                  <div 
                    key={n.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          n.severidad === 'CUMPLIMIENTO_OK' ? 'bg-emerald-100 text-emerald-800' :
                          n.severidad === 'CRITICA' ? 'bg-rose-100 text-rose-800' :
                          n.severidad === 'ADVERTENCIA' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {n.severidad}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900">{n.titulo}</h4>
                      </div>
                      <div className="text-xs font-mono text-slate-500">
                        {n.fechaLegible} • {n.auditorOOrigen}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700">{n.contenido}</p>

                    {n.recomendacion && (
                      <div className="text-xs text-blue-900 bg-blue-50/80 p-2.5 rounded-lg border border-blue-100 flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Recomendación Técnica:</strong> {n.recomendacion}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: CONFIGURACIÓN DEL DICTAMEN Y EMISIÓN */}
          {/* ========================================================================= */}
          {tabActiva === 'configuracion' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span>Configuración del Dictamen Formal de Auditoría</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Personalice los responsables firmantes, el sentido del dictamen y observaciones antes de exportar el PDF.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre del Auditor Responsable
                  </label>
                  <input
                    type="text"
                    value={auditorNombre}
                    onChange={(e) => setAuditorNombre(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Ej. Lic. Walter Pedroza • Auditor Interno"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cargo / Dependencia
                  </label>
                  <input
                    type="text"
                    value={auditorCargo}
                    onChange={(e) => setAuditorCargo(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Ej. Dirección de Auditoría Interna & Control de Gestión"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sentido del Dictamen Conclusivo
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'FAVORABLE', label: 'Favorable (Conforme)', color: 'border-emerald-500 bg-emerald-50 text-emerald-800' },
                    { id: 'FAVORABLE_CON_OBSERVACIONES', label: 'Con Observaciones', color: 'border-amber-500 bg-amber-50 text-amber-800' },
                    { id: 'EN_RIESGO', label: 'En Riesgo Operativo', color: 'border-orange-500 bg-orange-50 text-orange-800' },
                    { id: 'DESFAVORABLE', label: 'Desfavorable (Déficit)', color: 'border-rose-500 bg-rose-50 text-rose-800' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDictamenSeleccionado(opt.id as DictamenAuditoriaTipo)}
                      className={`p-3 rounded-xl border-2 text-xs font-bold transition-all text-center cursor-pointer ${
                        dictamenCalculado === opt.id
                          ? `${opt.color} shadow-xs ring-2 ring-blue-500/20`
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notas Adicionales y Recomendaciones del Auditor (Se incluirán en el PDF)
                </label>
                <textarea
                  rows={3}
                  value={notasAdicionales}
                  onChange={(e) => setNotasAdicionales(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Escriba recomendaciones específicas, acuerdos alcanzados o instrucciones para la Gerencia General..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  id="chk-guardar-drive-auditoria"
                  type="checkbox"
                  checked={guardarEnDrive}
                  onChange={(e) => setGuardarEnDrive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="chk-guardar-drive-auditoria" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Guardar respaldo digital automático en Google Drive (Carpeta Oficial de Auditoría)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={handleGenerarPDF}
                  disabled={generandoPDF}
                  className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{generandoPDF ? (progresoTexto || 'Generando...') : 'Generar y Descargar Reporte de Auditoría (PDF)'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PIE DE PÁGINA DEL MODAL */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Expediente:</span>
            <span className="font-mono">{codigoExpediente}</span>
            <span>•</span>
            <span>SAR: {proyecto.codigoFiscalSAR || 'N/A'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleGenerarPDF}
              disabled={generandoPDF}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>{generandoPDF ? 'Generando PDF...' : 'Generar Reporte PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
