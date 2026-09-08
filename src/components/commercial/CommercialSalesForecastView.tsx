import React, { useState, useMemo } from 'react';
import {
  ProyectoEducativo,
  Moneda,
  TipoProyecto,
} from '../../types';
import { formatearMoneda } from '../../utils/calculations';
import {
  PuntoDatosHistorico,
  ResultadoRegresion,
  PrediccionCohorte,
  PronosticoPorTipo,
  COLORES_TIPO_PROGRAMA,
  COLOR_FALLBACK,
  generarPronosticosPorTipoPrograma,
  generarPronosticoGlobalInstitucional,
} from '../../utils/salesForecasting';
import {
  TrendingUp,
  Target,
  BarChart3,
  Calendar,
  Sparkles,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calculator,
  Info,
  Copy,
  Check,
  Download,
  Filter,
  Layers,
  ChevronRight,
  HelpCircle,
  PlusCircle,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Sliders,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Area,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CommercialSalesForecastViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onEditarProyecto?: (p: ProyectoEducativo) => void;
  onNotificar?: (mensaje: string) => void;
}

export const CommercialSalesForecastView: React.FC<CommercialSalesForecastViewProps> = ({
  proyectos,
  moneda,
  onEditarProyecto,
  onNotificar,
}) => {
  // Lista de proyectos combinada con posibles cohortes simuladas por el usuario
  const [cohortesSimuladas, setCohortesSimuladas] = useState<
    Array<{
      id: string;
      nombreProyecto: string;
      tipoProyecto: TipoProyecto;
      fechaVenta: string;
      alumnosFinal: number;
      precioSugeridoAlumno: number;
      puntoEquilibrioAlumnos: number;
    }>
  >([]);

  // Proyectos totales considerando cohortes añadidas en el simulador interactivo
  const proyectosTotales = useMemo(() => {
    if (cohortesSimuladas.length === 0) return proyectos;
    const simuladosConvertidos: ProyectoEducativo[] = cohortesSimuladas.map((c) => ({
      id: c.id,
      nombreProyecto: c.nombreProyecto,
      tipoProyecto: c.tipoProyecto,
      fechaVenta: c.fechaVenta,
      fechaProgramacion: c.fechaVenta,
      alumnosFinal: c.alumnosFinal,
      alumnosProyectados: c.alumnosFinal,
      precioSugeridoAlumno: c.precioSugeridoAlumno,
      puntoEquilibrioAlumnos: c.puntoEquilibrioAlumnos,
      horasClase: 20,
      tarifaHoraDocente: 200,
      costoZoom: 300,
      costoPapeleria: 100,
      gastosVarios: 100,
      margenGananciaOperativa: 30,
      seLlevoACabo: 'Listo',
      objetivoGeneral: 'Cohorte simulada',
      nombreDocente: 'Docente Titular',
      nivel: 'Especializado',
      metodoVenta: 'Publicidad Paga (Ads)',
      observaciones: 'Punto de datos añadido en simulador',
    } as ProyectoEducativo));

    return [...proyectos, ...simuladosConvertidos];
  }, [proyectos, cohortesSimuladas]);

  // Cálculos estadísticos de regresión agrupados por tipo
  const pronosticosPorTipo = useMemo(() => {
    return generarPronosticosPorTipoPrograma(proyectosTotales);
  }, [proyectosTotales]);

  // Modelo global institucional (benchmark)
  const pronosticoGlobal = useMemo(() => {
    return generarPronosticoGlobalInstitucional(proyectosTotales);
  }, [proyectosTotales]);

  // Pestaña de tipo seleccionada: 'TODOS' o el nombre del tipoProyecto
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string>('TODOS');

  // Modo de visualización de regresión: 'secuencial' (Cohortes en el tiempo) o 'horizonte' (Proyección extendida)
  const [horizonteFuturo, setHorizonteFuturo] = useState<number>(1); // 1 = próxima cohorte, 2 = dos cohortes adelante, etc.

  // Estado para copiar al portapapeles
  const [copiadoExito, setCopiadoExito] = useState(false);

  // Formulario rápido para añadir cohorte de prueba
  const [mostrarFormSimulador, setMostrarFormSimulador] = useState(false);
  const [nuevoNombreCohorte, setNuevoNombreCohorte] = useState('Edición Reciente');
  const [nuevoTipoCohorte, setNuevoTipoCohorte] = useState<TipoProyecto>(
    pronosticosPorTipo[0]?.tipoProyecto || 'Capacitación profesional / Mentoría ejecutiva'
  );
  const [nuevosAlumnosCohorte, setNuevosAlumnosCohorte] = useState<number>(6);

  // Obtener el pronóstico activo según selección
  const pronosticoActivo = useMemo(() => {
    if (tipoSeleccionado === 'TODOS') {
      return pronosticoGlobal;
    }
    return (
      pronosticosPorTipo.find((p) => p.tipoProyecto === tipoSeleccionado) || pronosticosPorTipo[0] || pronosticoGlobal
    );
  }, [tipoSeleccionado, pronosticosPorTipo, pronosticoGlobal]);

  // Métricas agregadas globales
  const metricasGlobales = useMemo(() => {
    const totalEsperadoProxima = pronosticosPorTipo.reduce(
      (acc, p) => acc + p.proximaCohorte.alumnosSugeridos,
      0
    );

    // Tipo con mayor pendiente de crecimiento
    const tiposConDatos = pronosticosPorTipo.filter((p) => p.totalProyectosHistoricos >= 2);
    let tipoMayorCrecimiento = pronosticosPorTipo[0];
    let maxPendiente = -999;
    for (const p of tiposConDatos) {
      if (p.regresion.pendiente > maxPendiente) {
        maxPendiente = p.regresion.pendiente;
        tipoMayorCrecimiento = p;
      }
    }

    // Promedio de R² entre tipos con al menos 2 cohortes
    const r2Promedio =
      tiposConDatos.length > 0
        ? tiposConDatos.reduce((acc, p) => acc + p.regresion.r2, 0) / tiposConDatos.length
        : pronosticoGlobal.regresion.r2;

    const peTotalPromedio = Math.round(
      pronosticosPorTipo.reduce((acc, p) => acc + p.puntoEquilibrioPromedio, 0)
    );

    return {
      totalEsperadoProxima,
      tipoMayorCrecimiento,
      r2Promedio,
      peTotalPromedio,
      margenSeguridadGlobal: totalEsperadoProxima - peTotalPromedio,
    };
  }, [pronosticosPorTipo, pronosticoGlobal]);

  // Manejador para copiar recomendación ejecutiva
  const handleCopiarPronostico = () => {
    const resumen = `*** DICTAMEN DE PRONÓSTICO DE VENTAS (REGRESIÓN LINEAL) - SUMMIT ***\n` +
      `Tipo de Programa: ${pronosticoActivo.tipoProyecto}\n` +
      `Ecuación de Tendencia: ${pronosticoActivo.regresion.ecuacionTexto}\n` +
      `Calidad de Ajuste (R²): ${(pronosticoActivo.regresion.r2 * 100).toFixed(1)}%\n` +
      `Alumnos Esperados Sugeridos (Próxima Cohorte): ${pronosticoActivo.proximaCohorte.alumnosSugeridos} alumnos\n` +
      `Rango Esperado: [${pronosticoActivo.proximaCohorte.rangoInferior} - ${pronosticoActivo.proximaCohorte.rangoSuperior} alumnos]\n` +
      `Punto de Equilibrio Histórico: ${pronosticoActivo.puntoEquilibrioPromedio} alumnos\n` +
      `Margen de Seguridad: +${pronosticoActivo.margenSeguridadAlumnos} alumnos\n` +
      `Diagnóstico: ${pronosticoActivo.etiquetaTendencia}\n` +
      `Recomendación: ${pronosticoActivo.recomendacionComercial}\n` +
      `Generado: ${new Date().toLocaleDateString('es-HN')}`;

    navigator.clipboard.writeText(resumen);
    setCopiadoExito(true);
    if (onNotificar) {
      onNotificar('Dictamen de pronóstico copiado al portapapeles');
    }
    setTimeout(() => setCopiadoExito(false), 3000);
  };

  // Manejador para añadir cohorte de prueba
  const handleAgregarCohortePrueba = (e: React.FormEvent) => {
    e.preventDefault();
    const nueva = {
      id: `sim-${Date.now()}`,
      nombreProyecto: nuevoNombreCohorte,
      tipoProyecto: nuevoTipoCohorte,
      fechaVenta: new Date().toISOString().split('T')[0],
      alumnosFinal: Math.max(1, Number(nuevosAlumnosCohorte) || 1),
      precioSugeridoAlumno: 1800,
      puntoEquilibrioAlumnos: 3,
    };
    setCohortesSimuladas((prev) => [...prev, nueva]);
    setNuevoNombreCohorte('Edición Reciente');
    if (onNotificar) {
      onNotificar(`Cohorte de prueba añadida a ${nuevoTipoCohorte}. La regresión se ha actualizado.`);
    }
  };

  const handleLimpiarSimuladas = () => {
    setCohortesSimuladas([]);
    if (onNotificar) {
      onNotificar('Se han eliminado las cohortes simuladas. Regresando a datos reales.');
    }
  };

  // Exportar Informe Ejecutivo a PDF
  const handleExportarPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
      const verde = [16, 107, 73]; // #106b49

      // Encabezado
      doc.setFillColor(verde[0], verde[1], verde[2]);
      doc.rect(0, 0, 216, 26, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('SUMMIT EDUCATION - PRONÓSTICO DE VENTAS Y DEMANDA', 14, 11);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Modelo Estadístico de Regresión Lineal Simple (y = mx + b) | Emisión: ${new Date().toLocaleDateString('es-HN')}`,
        14,
        18
      );

      // Resumen Ejecutivo Superior
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('1. RESUMEN EJECUTIVO INSTITUCIONAL', 14, 34);

      autoTable(doc, {
        startY: 37,
        head: [['Métrica de Demanda', 'Valor Estimado', 'Observación Estratégica']],
        body: [
          [
            'Matrícula Total Esperada (Próxima Ronda)',
            `${metricasGlobales.totalEsperadoProxima} Alumnos`,
            'Suma de predicciones para las próximas cohortes de cada programa',
          ],
          [
            'Punto de Equilibrio Total Consolidado',
            `${metricasGlobales.peTotalPromedio} Alumnos`,
            `Margen de seguridad institucional: +${metricasGlobales.margenSeguridadGlobal} alumnos`,
          ],
          [
            'Programa con Mayor Aceleración',
            metricasGlobales.tipoMayorCrecimiento?.descripcionCorta || 'N/A',
            `Pendiente de crecimiento: +${metricasGlobales.tipoMayorCrecimiento?.regresion.pendiente.toFixed(2)} alumnos/cohorte`,
          ],
          [
            'Confiabilidad Promedio del Modelo (R²)',
            `${(metricasGlobales.r2Promedio * 100).toFixed(1)}%`,
            'Proporción de la varianza explicada por la secuencia temporal histórica',
          ],
        ],
        theme: 'striped',
        headStyles: { fillColor: [16, 107, 73], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 2.5 },
      });

      // Tabla Detallada por Tipo de Programa
      const finalY1 = (doc as any).lastAutoTable.finalY + 8;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('2. SUGERENCIA DE ALUMNOS POR TIPO DE PROGRAMA', 14, finalY1);

      const filasDetalle = pronosticosPorTipo.map((p) => [
        p.descripcionCorta,
        `${p.totalProyectosHistoricos}`,
        `${p.regresion.promedioY.toFixed(1)}`,
        p.regresion.ecuacionTexto,
        `${(p.regresion.r2 * 100).toFixed(0)}%`,
        `${p.proximaCohorte.alumnosSugeridos} Alumnos`,
        `[${p.proximaCohorte.rangoInferior} - ${p.proximaCohorte.rangoSuperior}]`,
        `${p.puntoEquilibrioPromedio}`,
        p.etiquetaTendencia,
      ]);

      autoTable(doc, {
        startY: finalY1 + 3,
        head: [
          [
            'Tipo de Programa',
            'Hist.',
            'Prom.',
            'Ecuación (y = mx + b)',
            'R²',
            'Sugerido Prox.',
            'Rango [Min-Max]',
            'P. Eq.',
            'Tendencia',
          ],
        ],
        body: filasDetalle,
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        styles: { fontSize: 7.5, cellPadding: 2 },
      });

      // Dictamen y Recomendaciones Específicas
      const finalY2 = (doc as any).lastAutoTable.finalY + 8;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('3. DICTAMEN CUALITATIVO Y RECOMENDACIÓN DE CAPACIDAD', 14, finalY2);

      const filasRecomendaciones = pronosticosPorTipo.map((p) => [
        p.descripcionCorta,
        `Sugerido: ${p.proximaCohorte.alumnosSugeridos} alumnos`,
        p.recomendacionComercial,
      ]);

      autoTable(doc, {
        startY: finalY2 + 3,
        head: [['Línea Formativa', 'Meta Sugerida', 'Acción Comercial y Académica Recomendada']],
        body: filasRecomendaciones,
        theme: 'plain',
        headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        styles: { fontSize: 7.5, cellPadding: 2.5 },
      });

      // Pie de firmas
      const finalY3 = (doc as any).lastAutoTable.finalY + 14;
      if (finalY3 < 250) {
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.line(18, finalY3 + 12, 78, finalY3 + 12);
        doc.text('Gerencia de Comercialización', 25, finalY3 + 16);

        doc.line(138, finalY3 + 12, 198, finalY3 + 12);
        doc.text('Dirección / Gerencia General', 146, finalY3 + 16);
      }

      doc.save(`SUMMIT_Pronostico_Ventas_${new Date().toISOString().split('T')[0]}.pdf`);
      if (onNotificar) {
        onNotificar('Informe de Pronóstico de Ventas generado exitosamente en PDF');
      }
    } catch (error) {
      console.error('Error generando PDF:', error);
      if (onNotificar) {
        onNotificar('Error al exportar el PDF del pronóstico');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. ENCABEZADO Y ACCIONES PRINCIPALES */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 uppercase tracking-wide flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Inteligencia Comercial & Analítica
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                Regresión Lineal Simple: y = mx + b
              </span>
              {cohortesSimuladas.length > 0 && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {cohortesSimuladas.length} Cohorte(s) en Simulación
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Pronóstico de Ventas y Demanda de Alumnos
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
              Calcula la tendencia histórica de matrícula real de cada tipo de programa mediante mínimos cuadrados ordinarios. 
              Sugiere el número de alumnos esperados para la próxima convocatoria, el intervalo de confianza y el margen sobre el punto de equilibrio.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-copiar-pronostico"
              type="button"
              onClick={handleCopiarPronostico}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 transition-all shadow-2xs"
              title="Copiar resumen del pronóstico"
            >
              {copiadoExito ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>Copiar Dictamen</span>
                </>
              )}
            </button>

            <button
              id="btn-exportar-pdf-pronostico"
              type="button"
              onClick={handleExportarPDF}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar PDF</span>
            </button>

            <button
              id="btn-toggle-simulador"
              type="button"
              onClick={() => setMostrarFormSimulador(!mostrarFormSimulador)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs border ${
                mostrarFormSimulador
                  ? 'bg-purple-700 text-white border-purple-800'
                  : 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{mostrarFormSimulador ? 'Ocultar Simulador' : 'Añadir Cohorte Prueba'}</span>
            </button>
          </div>
        </div>

        {/* Formulario desplegable para simular o añadir cohortes de prueba */}
        {mostrarFormSimulador && (
          <div className="mt-4 pt-4 border-t border-slate-200 bg-purple-50/50 rounded-xl p-4 animate-in fade-in">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-purple-700" />
                <span className="text-xs font-bold text-purple-950">
                  Simulador Interactivo: Añadir Datos Históricos Hipotéticos
                </span>
              </div>
              {cohortesSimuladas.length > 0 && (
                <button
                  type="button"
                  onClick={handleLimpiarSimuladas}
                  className="text-[11px] font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 underline"
                >
                  <Trash2 className="w-3 h-3" />
                  Restablecer a datos reales ({cohortesSimuladas.length})
                </button>
              )}
            </div>
            <form onSubmit={handleAgregarCohortePrueba} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Nombre de la Edición</label>
                <input
                  type="text"
                  value={nuevoNombreCohorte}
                  onChange={(e) => setNuevoNombreCohorte(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                  placeholder="Ej. Taller de Verano"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Tipo de Programa</label>
                <select
                  value={nuevoTipoCohorte}
                  onChange={(e) => setNuevoTipoCohorte(e.target.value as TipoProyecto)}
                  className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                >
                  {pronosticosPorTipo.map((p) => (
                    <option key={p.tipoProyecto} value={p.tipoProyecto}>
                      {p.descripcionCorta}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">
                  Alumnos Matriculados Reales (y)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={nuevosAlumnosCohorte}
                  onChange={(e) => setNuevosAlumnosCohorte(Math.max(1, Number(e.target.value)))}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                  required
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full text-xs px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold transition-colors"
                >
                  + Recalcular Regresión
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* 2. TARJETAS DE INDICADORES CLAVE (KPIS DE PRONÓSTICO) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Alumnos Totales Esperados en Próxima Ronda */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Demanda Total Esperada</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                {metricasGlobales.totalEsperadoProxima}
              </span>
              <span className="text-xs font-bold text-emerald-700">Alumnos Sugeridos</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Suma de proyecciones para la próxima cohorte de cada línea educativa.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Punto de equilibrio total:</span>
            <span className="font-bold text-slate-700">{metricasGlobales.peTotalPromedio} alumnos</span>
          </div>
        </div>

        {/* KPI 2: Margen de Seguridad Consolidado */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Margen de Seguridad</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-blue-900">
                +{metricasGlobales.margenSeguridadGlobal}
              </span>
              <span className="text-xs font-bold text-blue-700">Alumnos sobre P.E.</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Capacidad de absorción de costos fijos y rentabilidad garantizada.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Nivel de riesgo global:</span>
            <span className="font-extrabold text-emerald-700">Bajo Riesgo Operativo</span>
          </div>
        </div>

        {/* KPI 3: Línea Formativa Líder en Crecimiento */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Línea Mayor Tracción</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 truncate" title={metricasGlobales.tipoMayorCrecimiento?.tipoProyecto}>
              {metricasGlobales.tipoMayorCrecimiento?.descripcionCorta || 'Capacitación'}
            </div>
            <div className="text-xs font-bold text-indigo-700 mt-0.5">
              Pendiente m = {metricasGlobales.tipoMayorCrecimiento?.regresion.pendiente >= 0 ? '+' : ''}
              {metricasGlobales.tipoMayorCrecimiento?.regresion.pendiente.toFixed(2)} alumnos/cohorte
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Próxima meta sugerida: {metricasGlobales.tipoMayorCrecimiento?.proximaCohorte.alumnosSugeridos} alumnos
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Ajuste del modelo (R²):</span>
            <span className="font-bold text-indigo-900">
              {((metricasGlobales.tipoMayorCrecimiento?.regresion.r2 || 0) * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* KPI 4: Confiabilidad del Ajuste Matemático (R² Promedio) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Bondad de Ajuste R²</span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-purple-900">
                {(metricasGlobales.r2Promedio * 100).toFixed(1)}%
              </span>
              <span className="text-xs font-bold text-purple-700">Explicabilidad</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Precisión de la correlación histórica frente al volumen de alumnos reales.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Muestra total analizada:</span>
            <span className="font-bold text-slate-700">{proyectosTotales.length} cohortes</span>
          </div>
        </div>
      </div>

      {/* 3. BARRA DE SELECCIÓN POR TIPO DE PROGRAMA */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTipoSeleccionado('TODOS')}
          className={`px-3 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex items-center gap-1.5 ${
            tipoSeleccionado === 'TODOS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Vista Consolidada Institucional ({proyectosTotales.length})</span>
        </button>

        {pronosticosPorTipo.map((p) => {
          const colores = COLORES_TIPO_PROGRAMA[p.tipoProyecto] || COLOR_FALLBACK;
          const esActivo = tipoSeleccionado === p.tipoProyecto;

          return (
            <button
              key={p.tipoProyecto}
              type="button"
              onClick={() => setTipoSeleccionado(p.tipoProyecto)}
              className={`px-3 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                esActivo
                  ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
              }`}
            >
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: esActivo ? '#34d399' : p.color }}
              />
              <span>{p.descripcionCorta}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  esActivo ? 'bg-emerald-900 text-emerald-200' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {p.totalProyectosHistoricos}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. SECCIÓN PRINCIPAL DE REGRESIÓN DEL PROGRAMA SELECCIONADO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda (8 cols): Gráfico de Regresión Lineal y Puntos Históricos */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800">
                    {pronosticoActivo.descripcionCorta}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                      pronosticoActivo.tendencia === 'crecimiento_fuerte'
                        ? 'bg-emerald-100 text-emerald-800'
                        : pronosticoActivo.tendencia === 'crecimiento_moderado'
                        ? 'bg-blue-100 text-blue-800'
                        : pronosticoActivo.tendencia === 'estable'
                        ? 'bg-slate-100 text-slate-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {pronosticoActivo.regresion.pendiente > 0 ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : pronosticoActivo.regresion.pendiente < 0 ? (
                      <ArrowDownRight className="w-3 h-3" />
                    ) : (
                      <Minus className="w-3 h-3" />
                    )}
                    {pronosticoActivo.etiquetaTendencia}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Dispersión Histórica de Alumnos y Recta de Regresión Lineal
                </h3>
              </div>

              {/* Selector de horizonte futuro */}
              <div className="flex items-center gap-1.5 text-xs bg-slate-50 p-1 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 px-2">Proyectar a:</span>
                <button
                  type="button"
                  onClick={() => setHorizonteFuturo(1)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                    horizonteFuturo === 1
                      ? 'bg-white text-emerald-800 shadow-2xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cohorte #1 (Prox)
                </button>
                <button
                  type="button"
                  onClick={() => setHorizonteFuturo(2)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                    horizonteFuturo === 2
                      ? 'bg-white text-emerald-800 shadow-2xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cohorte #2
                </button>
                <button
                  type="button"
                  onClick={() => setHorizonteFuturo(3)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                    horizonteFuturo === 3
                      ? 'bg-white text-emerald-800 shadow-2xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cohorte #3
                </button>
              </div>
            </div>

            {/* Gráfico Recharts con Scatter (Alumnos Reales), Line (Regresión) y Predicción */}
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={pronosticoActivo.serieGrafico}
                  margin={{ top: 10, right: 20, left: -10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="etiqueta"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    domain={[0, (dataMax: number) => Math.max(10, Math.ceil(dataMax * 1.3))]}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    label={{
                      value: 'Alumnos',
                      angle: -90,
                      position: 'insideLeft',
                      style: { textAnchor: 'middle', fill: '#94a3b8', fontSize: 10 },
                    }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                          <div className="font-extrabold text-emerald-400">{data.nombreProyecto || data.etiqueta}</div>
                          {data.esHistorico ? (
                            <>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">Matrícula Real:</span>
                                <span className="font-bold text-white">{data.alumnosReales} alumnos</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">Ajuste Regresión:</span>
                                <span className="font-bold text-emerald-300">{data.lineaRegresion} alumnos</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex justify-between gap-4">
                                <span className="text-amber-300 font-bold">Pronóstico Sugerido:</span>
                                <span className="font-black text-amber-300 text-sm">
                                  {data.alumnosPronosticados} alumnos
                                </span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">Intervalo Confianza:</span>
                                <span className="font-bold text-slate-200">
                                  [{data.rangoInferior} - {data.rangoSuperior}]
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 italic">
                                Recta Calculada: {data.lineaRegresion}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

                  {/* Línea de referencia del punto de equilibrio histórico */}
                  <ReferenceLine
                    y={pronosticoActivo.puntoEquilibrioPromedio}
                    stroke="#dc2626"
                    strokeDasharray="4 4"
                    label={{
                      value: `P.E. Promedio (${pronosticoActivo.puntoEquilibrioPromedio})`,
                      fill: '#dc2626',
                      fontSize: 10,
                      position: 'right',
                    }}
                  />

                  {/* Línea ajustada de regresión lineal simple: y = mx + b */}
                  <Line
                    type="monotone"
                    dataKey="lineaRegresion"
                    name="Recta Regresión (y = mx + b)"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={false}
                  />

                  {/* Puntos históricos reales */}
                  <Scatter
                    dataKey="alumnosReales"
                    name="Alumnos Reales Históricos"
                    fill={pronosticoActivo.color}
                    shape="circle"
                  />

                  {/* Punto pronosticado sugerido */}
                  <Scatter
                    dataKey="alumnosPronosticados"
                    name="Alumnos Sugeridos (Pronóstico)"
                    fill="#f59e0b"
                    shape="diamond"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Subnota explicativa */}
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl">
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  Cada círculo representa una edición histórica. El rombo amarillo muestra la sugerencia calculada por mínimos cuadrados.
                </span>
              </div>
              <div className="font-mono font-bold text-slate-700">
                Fórmula: {pronosticoActivo.regresion.ecuacionTexto}
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha (4 cols): Ficha Matemática y Sugerencia Oficial */}
        <div className="lg:col-span-4 space-y-4">
          {/* Tarjeta de Sugerencia Destacada de Alumnos */}
          <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-2xl p-5 shadow-sm border border-emerald-900/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Calculator className="w-24 h-24 text-white" />
            </div>

            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800">
                  Sugerencia Oficial
                </span>
                <span className="text-[11px] font-bold text-slate-300">
                  Cohorte #{pronosticoActivo.proximaCohorte.cohorteIndex}
                </span>
              </div>

              <div>
                <div className="text-xs text-slate-300">Meta Sugerida de Alumnos:</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                    {pronosticoActivo.proximaCohorte.alumnosSugeridos}
                  </span>
                  <span className="text-sm font-bold text-emerald-300">Alumnos</span>
                </div>
                <div className="text-xs text-emerald-200/80 mt-1">
                  Intervalo estimado al 90% de confianza:
                  <span className="font-mono font-bold ml-1 text-white">
                    [{pronosticoActivo.proximaCohorte.rangoInferior} - {pronosticoActivo.proximaCohorte.rangoSuperior}] alumnos
                  </span>
                </div>
              </div>

              {/* Comparativa con Punto de Equilibrio */}
              <div className="bg-white/10 rounded-xl p-3 text-xs space-y-1.5 border border-white/10">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Punto de Equilibrio Requerido:</span>
                  <span className="font-bold text-white">
                    {pronosticoActivo.puntoEquilibrioPromedio} alumnos
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Colchón de Seguridad:</span>
                  <span className="font-black text-emerald-400">
                    +{pronosticoActivo.margenSeguridadAlumnos} alumnos
                  </span>
                </div>
                <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (pronosticoActivo.puntoEquilibrioPromedio /
                          Math.max(1, pronosticoActivo.proximaCohorte.alumnosSugeridos)) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-300 leading-relaxed italic border-t border-white/10 pt-2">
                "{pronosticoActivo.recomendacionComercial}"
              </div>
            </div>
          </div>

          {/* Ficha de Parámetros Estadísticos de la Regresión */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-slate-400" />
              Parámetros del Modelo de Regresión
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Pendiente (m):</span>
                <span className="font-bold text-slate-900 font-mono">
                  {pronosticoActivo.regresion.pendiente >= 0 ? '+' : ''}
                  {pronosticoActivo.regresion.pendiente.toFixed(3)} al/cohorte
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Intercepto base (b):</span>
                <span className="font-bold text-slate-900 font-mono">
                  {pronosticoActivo.regresion.intercepto.toFixed(2)} alumnos
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Coeficiente R²:</span>
                <span className="font-bold text-indigo-700 font-mono">
                  {(pronosticoActivo.regresion.r2 * 100).toFixed(1)}%
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Correlación Pearson (r):</span>
                <span className="font-bold text-slate-800 font-mono">
                  {pronosticoActivo.regresion.r.toFixed(3)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Error Estándar (Se):</span>
                <span className="font-bold text-slate-700 font-mono">
                  ±{pronosticoActivo.regresion.errorEstandar.toFixed(2)} alumnos
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Muestra Histórica (n):</span>
                <span className="font-bold text-slate-900">
                  {pronosticoActivo.regresion.n} proyectos
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. TABLA RESUMEN COMPARATIVA DE TODOS LOS TIPOS DE PROGRAMA */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Matriz Comparativa de Pronóstico por Línea de Programa</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-normal">
                {pronosticosPorTipo.length} tipos de programas evaluados
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Resumen ejecutivo de mínimos cuadrados con sugerencias directas de alumnos esperados para planeación académica y comercial.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-extrabold text-slate-600">
                <th className="py-2.5 px-3">Tipo de Programa</th>
                <th className="py-2.5 px-3 text-center">Cohortes Hist.</th>
                <th className="py-2.5 px-3 text-right">Prom. Histórico</th>
                <th className="py-2.5 px-3 text-center">Ecuación (y = mx + b)</th>
                <th className="py-2.5 px-3 text-center">R² (Ajuste)</th>
                <th className="py-2.5 px-3 text-center font-black text-emerald-900 bg-emerald-50">
                  Alumnos Sugeridos (Prox)
                </th>
                <th className="py-2.5 px-3 text-center">Rango de Confianza</th>
                <th className="py-2.5 px-3 text-center">P.E. Mínimo</th>
                <th className="py-2.5 px-3">Diagnóstico / Tendencia</th>
                <th className="py-2.5 px-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pronosticosPorTipo.map((p) => {
                const esSeleccionado = tipoSeleccionado === p.tipoProyecto;
                return (
                  <tr
                    key={p.tipoProyecto}
                    className={`transition-colors hover:bg-slate-50/80 ${
                      esSeleccionado ? 'bg-emerald-50/60 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: p.color }}
                        />
                        <div>
                          <div className="font-bold text-slate-900">{p.descripcionCorta}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-xs">{p.tipoProyecto}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        {p.totalProyectosHistoricos}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      {p.regresion.promedioY.toFixed(1)} al.
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-600">
                      {p.regresion.ecuacionTexto}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.regresion.r2 >= 0.7
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.regresion.r2 >= 0.3
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {(p.regresion.r2 * 100).toFixed(0)}%
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center bg-emerald-50/60">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-black text-xs shadow-2xs">
                        {p.proximaCohorte.alumnosSugeridos} Alumnos
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-600">
                      [{p.proximaCohorte.rangoInferior} - {p.proximaCohorte.rangoSuperior}]
                    </td>

                    <td className="py-3 px-3 text-center text-slate-700 font-bold">
                      {p.puntoEquilibrioPromedio} al.
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-bold ${
                          p.tendencia === 'crecimiento_fuerte'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.tendencia === 'crecimiento_moderado'
                            ? 'bg-blue-100 text-blue-800'
                            : p.tendencia === 'estable'
                            ? 'bg-slate-100 text-slate-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.etiquetaTendencia}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => setTipoSeleccionado(p.tipoProyecto)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                          esSeleccionado
                            ? 'bg-emerald-800 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {esSeleccionado ? 'Activo' : 'Ver Detalle'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. GUÍA CONCEPTUAL Y FUNDAMENTO MATEMÁTICO */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs text-slate-600 space-y-3">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <HelpCircle className="w-4 h-4 text-emerald-700" />
          <span>Fundamento Metodológico: ¿Cómo funciona la Regresión Lineal en SUMMIT?</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] leading-relaxed">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-1">
            <div className="font-extrabold text-slate-800">1. Pendiente m (Tasa de Crecimiento)</div>
            <p>
              Calcula cuántos alumnos gana (o pierde) el programa en cada nueva cohorte. Una pendiente positiva (ej. +1.4) 
              indica una demanda en expansión, lo que justifica programar aulas más amplias o una segunda sección.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-1">
            <div className="font-extrabold text-slate-800">2. Coeficiente R² (Confiabilidad)</div>
            <p>
              Mide qué porcentaje de las variaciones en la matrícula se explica por la inercia temporal. 
              Un R² superior al 70% indica una alta consistencia de la serie histórica para predecir el futuro.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-1">
            <div className="font-extrabold text-slate-800">3. Protección del Punto de Equilibrio</div>
            <p>
              El pronóstico compara el número sugerido de alumnos contra el punto de equilibrio mínimo para asegurar 
              que la próxima edición comience siempre con margen de ganancia operativo salvaguardado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
