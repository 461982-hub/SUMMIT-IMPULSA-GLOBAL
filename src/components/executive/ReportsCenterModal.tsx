import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  Cloud, 
  CheckCircle2, 
  ExternalLink, 
  FolderSync, 
  AlertCircle, 
  Loader2, 
  Building2, 
  GraduationCap, 
  TrendingUp, 
  ShieldCheck, 
  History,
  Sparkles,
  Download,
  Info,
  BarChart3,
  Scale,
  Receipt
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { MargenComparativaCharts } from './MargenComparativaCharts';
import { DocenteRentabilidadTendenciaChart } from './DocenteRentabilidadTendenciaChart';
import { ProjectsSideBySideComparison } from './ProjectsSideBySideComparison';
import { MonthlyFiscalOptimizerTool } from './MonthlyFiscalOptimizerTool';
import { GrowthProjectionTool } from './GrowthProjectionTool';
import { 
  CATALOGO_REPORTES_POR_GERENCIA, 
  ReporteOpcionConfig, 
  TipoFormatoReporte, 
  generarReportePorGerencia,
  ResultadoGeneracionReporte 
} from '../../utils/reportesGerencialesUtils';
import { 
  obtenerHistorialReportes, 
  ReporteRegistro, 
  TARGET_DRIVE_FOLDER_URL,
  TARGET_DRIVE_FOLDER_ID
} from '../../services/googleDriveService';

interface ReportsCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  gerenciaInicial?: 'Gerencia General' | 'Gerencia Académica' | 'Gerencia de Comercialización' | 'Auditoría Interna' | 'Historial' | 'Visualizador Margenes' | 'Tendencia Docente' | 'Comparador Proyectos' | 'Optimizador Fiscal' | 'Proyección de Crecimiento';
  isDriveConnected: boolean;
  onConectarDrive?: () => Promise<void>;
  onNotificar?: (mensaje: string) => void;
  onActualizarProyecto?: (proyecto: ProyectoEducativo) => void;
  onActualizarVariosProyectos?: (proyectos: ProyectoEducativo[]) => void;
}

export const ReportsCenterModal: React.FC<ReportsCenterModalProps> = ({
  isOpen,
  onClose,
  proyectos,
  moneda,
  gerenciaInicial = 'Gerencia General',
  isDriveConnected,
  onConectarDrive,
  onNotificar,
  onActualizarProyecto,
  onActualizarVariosProyectos
}) => {
  const [tabActiva, setTabActiva] = useState<string>(gerenciaInicial);
  const [reporteEnProceso, setReporteEnProceso] = useState<string | null>(null);
  const [progresoMensaje, setProgresoMensaje] = useState<string>('');
  const [ultimoResultado, setUltimoResultado] = useState<ResultadoGeneracionReporte | null>(null);
  const [historialReportes, setHistorialReportes] = useState<ReporteRegistro[]>([]);
  const [conectandoDrive, setConectandoDrive] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTabActiva(gerenciaInicial);
      setHistorialReportes(obtenerHistorialReportes());
    }
  }, [isOpen, gerenciaInicial]);

  if (!isOpen) return null;

  const refrescarHistorial = () => {
    setHistorialReportes(obtenerHistorialReportes());
  };

  const handleGenerar = async (config: ReporteOpcionConfig, formato: TipoFormatoReporte) => {
    const keyProceso = `${config.id}_${formato}`;
    setReporteEnProceso(keyProceso);
    setUltimoResultado(null);
    setProgresoMensaje(`Iniciando generación de ${config.titulo}...`);

    try {
      const resultado = await generarReportePorGerencia({
        reporteId: config.id,
        formato,
        proyectos,
        moneda,
        onProgreso: (msg) => setProgresoMensaje(msg)
      });

      setUltimoResultado(resultado);
      refrescarHistorial();

      if (resultado.guardadoEnDrive) {
        onNotificar?.(`✅ Reporte guardado automáticamente en Google Drive: ${resultado.nombreArchivo}`);
      } else {
        onNotificar?.(`📄 Reporte descargado localmente: ${resultado.nombreArchivo}`);
      }
    } catch (err: any) {
      console.error('Error generando reporte:', err);
      alert(`Ocurrió un error al generar el reporte: ${err.message || 'Error desconocido'}`);
    } finally {
      setReporteEnProceso(null);
      setProgresoMensaje('');
    }
  };

  const handleConectarGoogle = async () => {
    if (!onConectarDrive) return;
    setConectandoDrive(true);
    try {
      await onConectarDrive();
      refrescarHistorial();
    } catch (e: any) {
      console.error('Error al conectar Google:', e);
    } finally {
      setConectandoDrive(false);
    }
  };

  const pestañas = [
    { id: 'Proyección de Crecimiento', label: 'Proyección de Crecimiento', icono: TrendingUp, count: 'Simulador' },
    { id: 'Optimizador Fiscal', label: 'Optimización Fiscal SAR', icono: Receipt, count: 'Sugerencias' },
    { id: 'Comparador Proyectos', label: 'Comparar Programas (Lado a Lado)', icono: Scale, count: 'Tabla Resumen' },
    { id: 'Visualizador Margenes', label: 'Comparativa de Márgenes', icono: BarChart3, count: 'Gráficos' },
    { id: 'Tendencia Docente', label: 'Evolución Tarifa vs Rentabilidad', icono: TrendingUp, count: 'Mes a Mes' },
    { id: 'Gerencia General', label: 'Gerencia General', icono: Building2, count: 4 },
    { id: 'Gerencia Académica', label: 'Gerencia Académica', icono: GraduationCap, count: 4 },
    { id: 'Gerencia de Comercialización', label: 'Gerencia Comercial', icono: TrendingUp, count: 4 },
    { id: 'Auditoría Interna', label: 'Auditoría Interna', icono: ShieldCheck, count: 4 },
    { id: 'Historial', label: 'Historial en Drive', icono: History, count: historialReportes.length },
  ];

  const reportesFiltrados = CATALOGO_REPORTES_POR_GERENCIA.filter(
    (r) => r.gerencia === tabActiva
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div 
        id="modal-centro-reportes"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden my-auto"
      >
        {/* Cabecera del Modal */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Centro de Reportes Ejecutivos por Gerencia
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/40">
                  <Cloud className="w-3 h-3 text-blue-300" />
                  Auto-Sync Drive
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Genera informes oficiales adaptados a cada gerencia con respaldo automático inmediato en Google Drive.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Estado de Google Drive */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isDriveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-slate-600 font-medium">
              {isDriveConnected ? (
                <>
                  <strong className="text-emerald-700">Google Drive Conectado:</strong> Cada reporte generado se guarda automáticamente en la carpeta oficial.
                </>
              ) : (
                <>
                  <strong className="text-amber-700">Google Drive no sincronizado:</strong> Conecta tu cuenta para archivar los reportes en la nube automáticamente.
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isDriveConnected && onConectarDrive && (
              <button
                onClick={handleConectarGoogle}
                disabled={conectandoDrive}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
              >
                {conectandoDrive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />}
                Conectar Google Drive
              </button>
            )}
            <a
              href={TARGET_DRIVE_FOLDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors shadow-2xs"
            >
              <FolderSync className="w-3.5 h-3.5 text-blue-600" />
              <span>Ver Carpeta Drive</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Banner de Notificación del Último Reporte Generado */}
        {ultimoResultado && (
          <div className={`px-5 py-3 border-b flex items-start justify-between gap-3 animate-fadeIn ${
            ultimoResultado.guardadoEnDrive 
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900' 
              : 'bg-blue-50/90 border-blue-200 text-blue-900'
          }`}>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className={`w-5 h-5 mt-0.5 shrink-0 ${ultimoResultado.guardadoEnDrive ? 'text-emerald-600' : 'text-blue-600'}`} />
              <div>
                <p className="text-xs font-bold">
                  ¡Reporte generado con éxito!
                </p>
                <p className="text-xs mt-0.5 opacity-90">
                  Archivo: <span className="font-mono font-semibold">{ultimoResultado.nombreArchivo}</span> ({ultimoResultado.formato})
                </p>
                {ultimoResultado.guardadoEnDrive ? (
                  <p className="text-[11px] text-emerald-800 font-semibold mt-1 flex items-center gap-1">
                    <Cloud className="w-3 h-3 text-emerald-600" />
                    Copia archivada automáticamente en Google Drive Oficial.
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-600 mt-1">
                    {ultimoResultado.mensajeDrive}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {ultimoResultado.driveUrl && (
                <a
                  href={ultimoResultado.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir en Drive
                </a>
              )}
              <button
                onClick={() => setUltimoResultado(null)}
                className="text-slate-400 hover:text-slate-600 text-xs px-2 py-1"
              >
                Ocultar
              </button>
            </div>
          </div>
        )}

        {/* Indicador de Proceso Activo */}
        {reporteEnProceso && (
          <div className="px-5 py-2.5 bg-blue-600 text-white text-xs flex items-center gap-2.5 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="font-semibold">{progresoMensaje || 'Generando y sincronizando reporte...'}</span>
          </div>
        )}

        {/* Navegación por Pestañas de Gerencia */}
        <div className="px-5 pt-3 border-b border-slate-200 bg-white flex items-center gap-2 overflow-x-auto no-scrollbar">
          {pestañas.map((tab) => {
            const Icono = tab.icono;
            const esActiva = tabActiva === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-reportes-${tab.id.toLowerCase().replace(/ /g, '-')}`}
                onClick={() => setTabActiva(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
                  esActiva
                    ? 'border-blue-600 text-blue-700 bg-blue-50/70 shadow-2xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icono className={`w-4 h-4 ${esActiva ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-extrabold ${
                  esActiva ? 'bg-blue-200 text-blue-900' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Contenedor del Catálogo de Reportes */}
        <div className="p-5 flex-1 overflow-y-auto bg-slate-50/50 space-y-4">
          {tabActiva === 'Proyección de Crecimiento' ? (
            /* Herramienta de Proyección de Crecimiento y Simulación Financiera Semestral */
            <GrowthProjectionTool
              proyectos={proyectos}
              moneda={moneda}
              isDriveConnected={isDriveConnected}
              onNotificar={onNotificar}
            />
          ) : tabActiva === 'Optimizador Fiscal' ? (
            /* Herramienta de Optimización Fiscal Mensual y Asesor SAR */
            <MonthlyFiscalOptimizerTool
              proyectos={proyectos}
              moneda={moneda}
              isDriveConnected={isDriveConnected}
              onActualizarProyecto={onActualizarProyecto}
              onActualizarVariosProyectos={onActualizarVariosProyectos}
              onNotificar={onNotificar}
            />
          ) : tabActiva === 'Comparador Proyectos' ? (
            /* Comparador Lado a Lado de Programas Educativos */
            <ProjectsSideBySideComparison
              proyectos={proyectos}
              moneda={moneda}
              isDriveConnected={isDriveConnected}
              onNotificar={onNotificar}
            />
          ) : tabActiva === 'Visualizador Margenes' ? (
            /* Herramienta de Visualización con Recharts */
            <MargenComparativaCharts proyectos={proyectos} moneda={moneda} />
          ) : tabActiva === 'Tendencia Docente' ? (
            /* Visualizador de Evolución Histórica de Tarifa Docente vs Rentabilidad Real */
            <DocenteRentabilidadTendenciaChart proyectos={proyectos} moneda={moneda} />
          ) : tabActiva === 'Historial' ? (
            /* Vista de Historial de Reportes Guardados */
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Bitácora de Reportes Respaldados en Google Drive
                  </h3>
                  <p className="text-xs text-slate-500">
                    Registro de informes generados con enlace directo y comprobante de sincronización.
                  </p>
                </div>
                <button
                  onClick={refrescarHistorial}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                >
                  <FolderSync className="w-3.5 h-3.5" />
                  Actualizar Lista
                </button>
              </div>

              {historialReportes.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
                  <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-medium">Aún no has generado reportes en esta sesión.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Selecciona una gerencia arriba y haz clic en PDF o Excel para generar tu primer reporte con auto-guardado en Drive.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
                  {historialReportes.map((rep) => (
                    <div key={rep.id} className="p-3.5 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors">
                      <div className="flex items-start gap-3 min-w-[260px]">
                        <div className={`p-2 rounded-lg shrink-0 ${
                          rep.formato === 'PDF' ? 'bg-rose-100 text-rose-700' :
                          rep.formato === 'EXCEL' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {rep.formato === 'PDF' ? <FileText className="w-4 h-4" /> :
                           rep.formato === 'EXCEL' ? <FileSpreadsheet className="w-4 h-4" /> :
                           <FileCode className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-slate-900">{rep.titulo}</p>
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                              {rep.gerencia}
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                            {rep.nombreArchivo}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                            <span>{new Date(rep.fechaCreacion).toLocaleString('es-HN')}</span>
                            {rep.tamanio && <span>• {rep.tamanio}</span>}
                            <span>• Formato {rep.formato}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {rep.estadoDrive === 'subido' && rep.driveUrl ? (
                          <a
                            href={rep.driveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Abrir en Drive
                          </a>
                        ) : rep.estadoDrive === 'pendiente' ? (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                            <Cloud className="w-3 h-3 text-amber-600" />
                            Descarga Local
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            Error en Drive
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Lista de Reportes por Gerencia */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportesFiltrados.map((rep) => {
                const isExecutingThis = reporteEnProceso?.startsWith(rep.id);

                return (
                  <div
                    key={rep.id}
                    id={`card-reporte-${rep.id}`}
                    className="bg-white rounded-xl border border-slate-200/90 hover:border-blue-300 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Cabecera de la tarjeta */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono text-[10px] font-bold border border-slate-200">
                            {rep.codigo}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold">
                            {rep.badge}
                          </span>
                        </div>
                        <div className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                          <Cloud className="w-3 h-3" />
                          Auto-Drive
                        </div>
                      </div>

                      {/* Título y subtítulo */}
                      <h4 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-blue-700 transition-colors">
                        {rep.titulo}
                      </h4>
                      <p className="text-xs text-slate-600 font-medium mt-1">
                        {rep.subtitulo}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                        {rep.descripcion}
                      </p>
                    </div>

                    {/* Botones de Opciones de Formato */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                        <span>Generar formato & guardar en Drive:</span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        {/* Botón PDF */}
                        <button
                          id={`btn-generar-${rep.id}-pdf`}
                          onClick={() => handleGenerar(rep, 'PDF')}
                          disabled={Boolean(reporteEnProceso)}
                          className="flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 rounded-lg transition-colors disabled:opacity-50"
                          title="Descargar PDF y archivar en Google Drive"
                        >
                          {reporteEnProceso === `${rep.id}_PDF` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-rose-600" />
                          )}
                          <span>PDF</span>
                        </button>

                        {/* Botón Excel */}
                        <button
                          id={`btn-generar-${rep.id}-excel`}
                          onClick={() => handleGenerar(rep, 'EXCEL')}
                          disabled={Boolean(reporteEnProceso)}
                          className="flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-200 rounded-lg transition-colors disabled:opacity-50"
                          title="Descargar Excel (.xlsx) y archivar en Google Drive"
                        >
                          {reporteEnProceso === `${rep.id}_EXCEL` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                          <span>Excel</span>
                        </button>

                        {/* Botón CSV */}
                        <button
                          id={`btn-generar-${rep.id}-csv`}
                          onClick={() => handleGenerar(rep, 'CSV')}
                          disabled={Boolean(reporteEnProceso)}
                          className="flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-200 rounded-lg transition-colors disabled:opacity-50"
                          title="Descargar CSV y archivar en Google Drive"
                        >
                          {reporteEnProceso === `${rep.id}_CSV` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <FileCode className="w-3.5 h-3.5 text-blue-600" />
                          )}
                          <span>CSV</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pie del Modal */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Total de Programas Disponibles para Análisis: <strong className="text-slate-800">{proyectos.length}</strong>
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
};
