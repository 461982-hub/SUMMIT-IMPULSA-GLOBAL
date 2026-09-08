import React, { useState, useMemo } from 'react';
import { 
  X, 
  FileDown, 
  CalendarDays, 
  TrendingUp, 
  DollarSign, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Sparkles,
  CloudUpload,
  BarChart3
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { formatearMoneda } from '../../utils/calculations';
import { 
  obtenerClaveMesProyecto, 
  formatearEtiquetaMes, 
  formatearEtiquetaCortaMes,
  calcularResumenesMensuales 
} from '../../utils/monthUtils';
import { exportarReporteMensualConsolidadoPDF, ResultadoExportacionMensualPDF } from '../../utils/monthlyPdfExportUtils';

interface ExportMonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  mesInicial?: string; // 'todos' o 'YYYY-MM'
  listaMesesDisponibles?: { mesKey: string; etiqueta: string; cantidad: number }[];
  isDriveConnected?: boolean;
  onNotificar?: (mensaje: string) => void;
}

export const ExportMonthlyReportModal: React.FC<ExportMonthlyReportModalProps> = ({
  isOpen,
  onClose,
  proyectos,
  moneda,
  mesInicial = 'todos',
  listaMesesDisponibles = [],
  isDriveConnected = false,
  onNotificar,
}) => {
  // Lista de meses calculados si no se proporcionan
  const mesesOpciones = useMemo(() => {
    if (listaMesesDisponibles && listaMesesDisponibles.length > 0) {
      return listaMesesDisponibles;
    }
    const resumenes = calcularResumenesMensuales(proyectos);
    return resumenes.map((r) => ({
      mesKey: r.mesKey,
      etiqueta: r.etiquetaMes,
      cantidad: r.totalProyectos,
    }));
  }, [listaMesesDisponibles, proyectos]);

  // Mes seleccionado
  const [mesSeleccionado, setMesSeleccionado] = useState<string>(() => {
    if (mesInicial && mesInicial !== 'todos') return mesInicial;
    if (mesesOpciones.length > 0) return mesesOpciones[mesesOpciones.length - 1].mesKey;
    return '';
  });

  const [incluirGraficos, setIncluirGraficos] = useState<boolean>(true);
  const [autorizadoPor, setAutorizadoPor] = useState<string>('Dirección General & Finanzas');
  const [comentarios, setComentarios] = useState<string>('');
  const [guardarEnDrive, setGuardarEnDrive] = useState<boolean>(true);

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [mensajeProgreso, setMensajeProgreso] = useState<string>('');
  const [resultadoExito, setResultadoExito] = useState<ResultadoExportacionMensualPDF | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Proyectos filtrados para el mes seleccionado
  const proyectosDelMes = useMemo(() => {
    if (!mesSeleccionado) return [];
    return proyectos.filter((p) => obtenerClaveMesProyecto(p) === mesSeleccionado);
  }, [proyectos, mesSeleccionado]);

  // Métricas del mes seleccionado para preview
  const metricasPreview = useMemo(() => {
    if (proyectosDelMes.length === 0) return null;

    const totalIngresos = proyectosDelMes.reduce((sum, p) => sum + (p.ingresoRealTotal || 0), 0);
    const totalGastos = proyectosDelMes.reduce((sum, p) => sum + (p.gastoTotalOperativo || 0), 0);
    const totalGanancias = proyectosDelMes.reduce((sum, p) => sum + (p.totalGananciasFinales || 0), 0);
    const totalAlumnos = proyectosDelMes.reduce((sum, p) => sum + (p.alumnosFinal || 0), 0);
    const metaAlumnos = proyectosDelMes.reduce((sum, p) => sum + (p.alumnosProyectados || 0), 0);
    const margen = totalGastos > 0 ? (totalGanancias / totalGastos) * 100 : 0;
    const completados = proyectosDelMes.filter((p) => p.seLlevoACabo === 'Sí').length;

    return {
      totalIngresos,
      totalGastos,
      totalGanancias,
      totalAlumnos,
      metaAlumnos,
      margen,
      completados,
      totalProyectos: proyectosDelMes.length,
    };
  }, [proyectosDelMes]);

  if (!isOpen) return null;

  const handleExportar = async () => {
    if (!mesSeleccionado || proyectosDelMes.length === 0) {
      setErrorMsg('Selecciona un mes válido con proyectos registrados.');
      return;
    }

    setIsExporting(true);
    setErrorMsg(null);
    setResultadoExito(null);

    try {
      const res = await exportarReporteMensualConsolidadoPDF({
        mesKey: mesSeleccionado,
        proyectos,
        moneda,
        incluirGraficos,
        comentariosPersonalizados: comentarios.trim() || undefined,
        autorizadoPor: autorizadoPor.trim() || 'Dirección General & Finanzas',
        guardarEnDrive: guardarEnDrive && isDriveConnected,
        onProgreso: (msg) => setMensajeProgreso(msg),
      });

      setResultadoExito(res);
      onNotificar?.(
        `Reporte consolidado de ${res.etiquetaMes} exportado exitosamente.${
          res.guardadoEnDrive ? ' Copia respaldada en Drive.' : ''
        }`
      );
    } catch (err: any) {
      console.error('Error al exportar reporte consolidado mensual en PDF:', err);
      setErrorMsg(err.message || 'Ocurrió un error inesperado al generar el PDF.');
    } finally {
      setIsExporting(false);
      setMensajeProgreso('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Encabezado del Modal */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 flex items-center justify-between border-b border-blue-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-inner">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  Exportar Reporte Consolidado en PDF
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                  Cierre Mensual
                </span>
              </div>
              <p className="text-xs text-blue-200/80 mt-0.5">
                Resumen ejecutivo, gráficos vectoriales de rentabilidad y matriz de proyectos con márgenes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {/* 1. Selector del Mes Específico */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-blue-600" />
              <span>Seleccionar Mes a Consolidar</span>
            </label>
            <div className="relative">
              <select
                value={mesSeleccionado}
                onChange={(e) => {
                  setMesSeleccionado(e.target.value);
                  setResultadoExito(null);
                  setErrorMsg(null);
                }}
                disabled={isExporting}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
              >
                {mesesOpciones.length === 0 ? (
                  <option value="">No hay proyectos con fecha registrada</option>
                ) : (
                  mesesOpciones.map((m) => (
                    <option key={m.mesKey} value={m.mesKey}>
                      {m.etiqueta} ({m.cantidad} {m.cantidad === 1 ? 'programa' : 'programas'})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* 2. Tarjeta Resumen Preview del Mes */}
          {metricasPreview ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Previsualización de Datos a Exportar ({formatearEtiquetaMes(mesSeleccionado)})
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {metricasPreview.totalProyectos} cursos registrados
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Ventas Reales</span>
                  <span className="text-xs font-bold text-blue-900 block font-mono">
                    {formatearMoneda(metricasPreview.totalIngresos, moneda)}
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Gasto Operativo</span>
                  <span className="text-xs font-bold text-rose-900 block font-mono">
                    {formatearMoneda(metricasPreview.totalGastos, moneda)}
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Utilidad Neta</span>
                  <span className={`text-xs font-bold block font-mono ${
                    metricasPreview.totalGanancias >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {formatearMoneda(metricasPreview.totalGanancias, moneda)}
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Margen Operativo</span>
                  <span className={`text-xs font-bold block font-mono ${
                    metricasPreview.margen >= 30 ? 'text-emerald-700' : 'text-blue-700'
                  }`}>
                    {metricasPreview.margen.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-600 px-1 pt-1">
                <span>
                  <strong>Matrícula:</strong> {metricasPreview.totalAlumnos} alumnos inscritos de {metricasPreview.metaAlumnos} previstos
                </span>
                <span>
                  <strong>Ejecución:</strong> {metricasPreview.completados} de {metricasPreview.totalProyectos} concluidos
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center text-amber-800">
              No hay proyectos encontrados para el mes seleccionado.
            </div>
          )}

          {/* 3. Contenido Incluido en el Reporte PDF */}
          <div className="border border-blue-100 bg-blue-50/50 rounded-xl p-3.5 space-y-2">
            <span className="text-[11px] font-bold text-blue-950 uppercase tracking-wide flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
              Estructura Oficial del Reporte Consolidado PDF
            </span>
            <ul className="text-[11px] text-blue-900/90 space-y-1.5 list-disc list-inside">
              <li><strong>Página 1 - Resumen Ejecutivo:</strong> Membrete institucional, 4 KPIs clave, dictamen automatizado de rentabilidad y gráficos vectoriales (distribución de márgenes, composición de gastos y efectividad de matrícula).</li>
              <li><strong>Página 2 - Matriz de Proyectos:</strong> Listado oficial con número de correlativo, programa, docente, horas, ventas, gastos, ganancia neta y semáforos de margen individual.</li>
              <li><strong>Liquidación y SAR:</strong> Desglose de nómina docente, costos de plataforma/materiales y retención del 15% ISV (SAR Honduras).</li>
              <li><strong>Certificación:</strong> Bloque de 3 firmas para Gerencia Académica, Comercial y General.</li>
            </ul>
          </div>

          {/* 4. Opciones de Configuración */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Gráficos Vectoriales de Rentabilidad</span>
                <span className="text-[11px] text-slate-500">Incluir barras de margen por curso y gráfica de estructura de desembolsos</span>
              </div>
              <input
                type="checkbox"
                checked={incluirGraficos}
                onChange={(e) => setIncluirGraficos(e.target.checked)}
                disabled={isExporting}
                className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {isDriveConnected && (
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div>
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <CloudUpload className="w-4 h-4 text-emerald-600" />
                    Respaldo Automático en Google Drive
                  </span>
                  <span className="text-[11px] text-emerald-700">Subir automáticamente una copia a la carpeta oficial de Drive</span>
                </div>
                <input
                  type="checkbox"
                  checked={guardarEnDrive}
                  onChange={(e) => setGuardarEnDrive(e.target.checked)}
                  disabled={isExporting}
                  className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500 cursor-pointer"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Autorizado Por (Firma Dirección)
                </label>
                <input
                  type="text"
                  value={autorizadoPor}
                  onChange={(e) => setAutorizadoPor(e.target.value)}
                  disabled={isExporting}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nota o Comentario Ejecutivo (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Metas de margen superadas en cohortes de posgrado"
                  value={comentarios}
                  onChange={(e) => setComentarios(e.target.value)}
                  disabled={isExporting}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Mensajes de Progreso y Alertas */}
          {isExporting && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-blue-900 animate-pulse">
              <Clock className="w-4 h-4 text-blue-600 animate-spin" />
              <span className="font-semibold">{mensajeProgreso || 'Generando reporte consolidado en PDF...'}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-900">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {resultadoExito && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">
                  ¡Reporte consolidado generado y descargado con éxito!
                </p>
                <p className="text-[11px] text-emerald-800 font-mono">
                  {resultadoExito.nombreArchivo}
                </p>
                {resultadoExito.mensajeDrive && (
                  <p className="text-[11px] text-emerald-700">
                    {resultadoExito.mensajeDrive}
                  </p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Pie de Acciones del Modal */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500">
            {metricasPreview ? (
              <span>
                Reporte de <strong>{formatearEtiquetaMes(mesSeleccionado)}</strong> ({metricasPreview.totalProyectos} proyectos)
              </span>
            ) : (
              <span>Selecciona un mes para exportar</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Cerrar
            </button>

            <button
              type="button"
              onClick={handleExportar}
              disabled={isExporting || !metricasPreview}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileDown className="w-4 h-4" />
              <span>{isExporting ? 'Generando PDF...' : 'Generar y Descargar PDF'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
