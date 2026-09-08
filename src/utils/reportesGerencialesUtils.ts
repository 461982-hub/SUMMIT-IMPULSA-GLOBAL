import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProyectoEducativo, Moneda } from '../types';
import { formatearMoneda, calcularMetricasProyecto } from './calculations';
import { subirReporteADrive, TARGET_DRIVE_FOLDER_ID, TARGET_DRIVE_FOLDER_URL } from '../services/googleDriveService';

export type TipoFormatoReporte = 'PDF' | 'EXCEL' | 'CSV';

export interface ReporteOpcionConfig {
  id: string;
  codigo: string;
  titulo: string;
  subtitulo: string;
  descripcion: string;
  gerencia: 'Gerencia General' | 'Gerencia Académica' | 'Gerencia de Comercialización' | 'Auditoría Interna';
  iconoTipo: 'finanzas' | 'academico' | 'comercial' | 'auditoria';
  formatosDisponibles: TipoFormatoReporte[];
  badge: string;
}

export const CATALOGO_REPORTES_POR_GERENCIA: ReporteOpcionConfig[] = [
  // ================= GERENCIA GENERAL =================
  {
    id: 'gg_pl_consolidado',
    codigo: 'GG-REP-01',
    titulo: 'Estado de Resultados Consolidado (P&L Ejecutivo)',
    subtitulo: 'Ingresos, costos operativos, nómina docente y utilidad neta institucional',
    descripcion: 'Consolida las ventas totales de todos los programas educativos, gastos directos, sueldos docentes, retención fiscal SAR del 15% y utilidad neta neta con margen comparativo EBITDA.',
    gerencia: 'Gerencia General',
    iconoTipo: 'finanzas',
    formatosDisponibles: ['PDF', 'EXCEL', 'CSV'],
    badge: 'Financiero Oficial'
  },
  {
    id: 'gg_rentabilidad_sar',
    codigo: 'GG-REP-02',
    titulo: 'Matriz Estratégica de Rentabilidad y Margen SAR',
    subtitulo: 'Desglose programa por programa con semáforos de rentabilidad y cumplimiento tributario',
    descripcion: 'Evalúa la rentabilidad individual de cada cohorte, identificando cursos altamente rentables (>40%), estables y aquellos en zona de riesgo deficitario, con validación de código fiscal SAR.',
    gerencia: 'Gerencia General',
    iconoTipo: 'finanzas',
    formatosDisponibles: ['PDF', 'EXCEL', 'CSV'],
    badge: 'Estratégico'
  },
  {
    id: 'gg_proyecciones_flujo',
    codigo: 'GG-REP-03',
    titulo: 'Proyecciones de Matrícula y Flujo de Fondos 2026',
    subtitulo: 'Flujo proyectado de ingresos, liquidez disponible y cobertura de costos fijos',
    descripcion: 'Proyección mensualizada de recaudación por colegiaturas, calendario de desembolsos a docentes y superávit operativo estimado para la toma de decisiones directivas.',
    gerencia: 'Gerencia General',
    iconoTipo: 'finanzas',
    formatosDisponibles: ['PDF', 'EXCEL', 'CSV'],
    badge: 'Tesorería'
  },
  {
    id: 'gg_catalogo_integral',
    codigo: 'GG-REP-04',
    titulo: 'Ficha Consolidada Integral de Programas 2026',
    subtitulo: 'Inventario general de diplomados, talleres y certificaciones en ejecución',
    descripcion: 'Padrón oficial de todos los proyectos activos con sus códigos correlativos, niveles de formación, cupos asignados, modalidad y estatus gerencial.',
    gerencia: 'Gerencia General',
    iconoTipo: 'finanzas',
    formatosDisponibles: ['PDF', 'EXCEL', 'CSV'],
    badge: 'Inventario'
  },

  // ================= GERENCIA ACADÉMICA =================
  {
    id: 'ga_carga_horaria',
    codigo: 'GA-REP-01',
    titulo: 'Carga Horaria y Programación de Módulos Docentes',
    subtitulo: 'Distribución de horas teóricas, prácticas y cómputo de horas lectivas',
    descripcion: 'Reporte académico detallado de horas asignadas por módulo, carga por facilitador, intensidad pedagógica semanal y horas efectivas requeridas para certificación.',
    gerencia: 'Gerencia Académica',
    iconoTipo: 'academico',
    formatosDisponibles: ['PDF', 'EXCEL', 'CSV'],
    badge: 'Carga Docente'
  },
  {
    id: 'ga_nomina_docente',
    codigo: 'GA-REP-02',
    titulo: 'Planilla de Honorarios Docentes con Retención ISV 15%',
    subtitulo: 'Liquidación de sueldos docentes, tarifas por hora y retención de ley SAR',
    descripcion: 'Detalle de liquidación financiera para cada catedrático: cálculo de horas impartidas, valor hora contractual, honorarios brutos, deducción del 15% ISV y neto transferible.',
    gerencia: 'Gerencia Académica',
    iconoTipo: 'academico',
    formatosDisponibles: ['PDF', 'EXCEL', 'CSV'],
    badge: 'Planilla SAR'
  },
  {
    id: 'ga_eficiencia_cohortes',
    codigo: 'GA-REP-03',
    titulo: 'Eficiencia Académica y Ratios Alumnos por Docente',
    subtitulo: 'Relación pedagógica alumno/facilitador y tasa de ocupación de aulas',
    descripcion: 'Métricas de calidad educativa que miden el aforo medio por curso, saturación docente, tasa de retención preliminar y viabilidad formativa por nivel.',
    gerencia: 'Gerencia Académica',
    iconoTipo: 'academico',
    formatosDisponibles: ['PDF', 'EXCEL', 'CSV'],
    badge: 'Calidad'
  },
  {
    id: 'ga_cronograma_cohortes',
    codigo: 'GA-REP-04',
    titulo: 'Cronograma Académico y Calendario de Cohortes 2026',
    subtitulo: 'Fechas de inicio, hitos de evaluación, exámenes y entregas finales',
    descripcion: 'Calendario oficial de impartición sincronizado con Google Calendar, estatus de ejecución de clases y fechas límite de registro de calificaciones.',
    gerencia: 'Gerencia Académica',
    iconoTipo: 'academico',
    formatosDisponibles: ['PDF', 'EXCEL', 'CSV'],
    badge: 'Calendario'
  },

  // ================= GERENCIA DE COMERCIALIZACIÓN =================
  {
    id: 'gc_punto_equilibrio',
    codigo: 'GC-REP-01',
    titulo: 'Análisis de Punto de Equilibrio y Matrícula Mínima',
    subtitulo: 'Alumnos necesarios para cubrir costos vs aforo real captado por ventas',
    descripcion: 'Diagnóstico crítico de ventas: cálculo exacto de estudiantes requeridos para costear la nómina y operación, brecha de ventas restante y margen de seguridad comercial.',
    gerencia: 'Gerencia de Comercialización',
    iconoTipo: 'comercial',
    formatosDisponibles: ['PDF', 'EXCEL', 'CSV'],
    badge: 'Ventas Críticas'
  },
  {
    id: 'gc_canales_cac',
    codigo: 'GC-REP-02',
    titulo: 'Rendimiento por Canal de Ventas y Costo de Adquisición (CAC)',
    subtitulo: 'Conversión de matriculados por Redes, WhatsApp, Referidos y Alianzas B2B',
    descripcion: 'Análisis de efectividad de canales comerciales, gasto publicitario distribuido e índice de costo de captación de cada alumno nuevo.',
    gerencia: 'Gerencia de Comercialización',
    iconoTipo: 'comercial',
    formatosDisponibles: ['PDF', 'EXCEL', 'CSV'],
    badge: 'Marketing / CAC'
  },
  {
    id: 'gc_precios_descuentos',
    codigo: 'GC-REP-03',
    titulo: 'Estructura Tarifaria, Becas y Ticket Promedio',
    subtitulo: 'Precios de lista, políticas de descuento por pronto pago e impacto en recaudación',
    descripcion: 'Informe de precios sugeridos al público, volumen de recaudación por cohorte y efecto de las becas parciales en el margen final de cada proyecto.',
    gerencia: 'Gerencia de Comercialización',
    iconoTipo: 'comercial',
    formatosDisponibles: ['PDF', 'EXCEL', 'CSV'],
    badge: 'Tarifas'
  },
  {
    id: 'gc_embudo_ventas',
    codigo: 'GC-REP-04',
    titulo: 'Embudo de Ventas y Metas de Ocupación por Cohorte',
    subtitulo: 'Seguimiento de prospectos, cotizaciones y alumnos confirmados',
    descripcion: 'Monitoreo de la tasa de conversión comercial, comparación con la meta institucional de 25 alumnos por grupo y proyecciones de cierre.',
    gerencia: 'Gerencia de Comercialización',
    iconoTipo: 'comercial',
    formatosDisponibles: ['PDF', 'EXCEL', 'CSV'],
    badge: 'Embudo'
  },

  // ================= AUDITORÍA INTERNA / CONTROL =================
  {
    id: 'ai_dictamen_oficial',
    codigo: 'AI-REP-01',
    titulo: 'Informe Oficial de Auditoría y Dictamen de Cumplimiento',
    subtitulo: 'Revisión exhaustiva de consistencia contable, académica y tributaria SAR',
    descripcion: 'Dictamen ejecutivo formal de auditoría interna con conclusiones sobre la razonabilidad de los costos, contratos docentes, retenciones de ley y sustentación documental.',
    gerencia: 'Auditoría Interna',
    iconoTipo: 'auditoria',
    formatosDisponibles: ['PDF', 'EXCEL', 'CSV'],
    badge: 'Dictamen Oficial'
  },
  {
    id: 'ai_alertas_criticas',
    codigo: 'AI-REP-02',
    titulo: 'Matriz de Alertas Críticas y Desviaciones Presupuestarias',
    subtitulo: 'Catálogo de no-conformidades clasificadas por nivel de riesgo (Crítico/Medio/Bajo)',
    descripcion: 'Identifica cursos que operan a pérdida, inconsistencias en horas académicas declaradas, tarifas por hora desfasadas y proyectos sin confirmación de apertura.',
    gerencia: 'Auditoría Interna',
    iconoTipo: 'auditoria',
    formatosDisponibles: ['PDF', 'EXCEL', 'CSV'],
    badge: 'Riesgo / Alertas'
  },
  {
    id: 'ai_acciones_correctivas',
    codigo: 'AI-REP-03',
    titulo: 'Cronograma de Acciones Correctivas y Compromisos',
    subtitulo: 'Plazos de resolución asignados a Gerencia Académica y Comercial con responsables',
    descripcion: 'Plan de acción correctiva (CAPA) con fechas límite, directores encargados, estatus de avance (Pendiente / En proceso / Resuelto) y observaciones de auditoría.',
    gerencia: 'Auditoría Interna',
    iconoTipo: 'auditoria',
    formatosDisponibles: ['PDF', 'EXCEL', 'CSV'],
    badge: 'Plan Correctivo'
  },
  {
    id: 'ai_cuadro_mando_ratios',
    codigo: 'AI-REP-04',
    titulo: 'Cuadro de Mando de Ratios de Control y Cumplimiento SAR',
    subtitulo: 'Semáforos de tolerancia financiera, retenciones de impuestos y trazabilidad',
    descripcion: 'Tablero normativo de indicadores de riesgo: ratio de cobertura de nómina, margen de maniobra comercial, retención efectiva ISV y bitácora de modificaciones.',
    gerencia: 'Auditoría Interna',
    iconoTipo: 'auditoria',
    formatosDisponibles: ['PDF', 'EXCEL', 'CSV'],
    badge: 'Gobernanza'
  }
];

export interface GenerarReporteParams {
  reporteId: string;
  formato: TipoFormatoReporte;
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onProgreso?: (mensaje: string) => void;
}

export interface ResultadoGeneracionReporte {
  success: boolean;
  nombreArchivo: string;
  formato: TipoFormatoReporte;
  tituloReporte: string;
  gerencia: string;
  guardadoEnDrive: boolean;
  driveUrl?: string;
  driveFileId?: string;
  mensajeDrive: string;
  error?: string;
}

/**
 * Disparador unificado para generar el reporte solicitado, descargarlo en el navegador y respaldarlo automáticamente en Google Drive
 */
export const generarReportePorGerencia = async (
  params: GenerarReporteParams
): Promise<ResultadoGeneracionReporte> => {
  const { reporteId, formato, proyectos, moneda, onProgreso } = params;
  const config = CATALOGO_REPORTES_POR_GERENCIA.find((r) => r.id === reporteId);
  if (!config) {
    throw new Error(`Reporte con ID "${reporteId}" no encontrado en el catálogo.`);
  }

  onProgreso?.(`Construyendo ${config.titulo} en formato ${formato}...`);

  const fechaIso = new Date().toISOString().split('T')[0];
  const timeStampCode = Date.now().toString().slice(-4);
  const sanitizedTitulo = config.titulo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .toUpperCase()
    .slice(0, 35);

  let extension = 'pdf';
  let mimeType = 'application/pdf';
  if (formato === 'EXCEL') {
    extension = 'xlsx';
    mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  } else if (formato === 'CSV') {
    extension = 'csv';
    mimeType = 'text/csv; charset=utf-8';
  }

  const nombreArchivo = `${config.codigo}_${sanitizedTitulo}_${fechaIso}_${timeStampCode}.${extension}`;

  let contenidoArchivo: Blob | Uint8Array | string;

  if (formato === 'PDF') {
    contenidoArchivo = construirDocumentoPDF(config, proyectos, moneda);
  } else if (formato === 'EXCEL') {
    contenidoArchivo = construirDocumentoExcel(config, proyectos, moneda);
  } else {
    contenidoArchivo = construirDocumentoCSV(config, proyectos, moneda);
  }

  // 1. Descarga local automática en el navegador
  onProgreso?.(`Descargando archivo local "${nombreArchivo}"...`);
  dispararDescargaNavegador(contenidoArchivo, nombreArchivo, mimeType);

  // 2. Auto-guardado en Google Drive
  onProgreso?.(`Guardando automáticamente en Google Drive (Carpeta Oficial)...`);
  let guardadoEnDrive = false;
  let driveUrl: string | undefined;
  let driveFileId: string | undefined;
  let mensajeDrive = '';

  try {
    const driveRes = await subirReporteADrive({
      titulo: config.titulo,
      gerencia: config.gerencia,
      formato: formato,
      nombreArchivo: nombreArchivo,
      contenido: contenidoArchivo,
      mimeType: mimeType,
      folderId: TARGET_DRIVE_FOLDER_ID,
    });

    if (driveRes.success && driveRes.driveUrl) {
      guardadoEnDrive = true;
      driveUrl = driveRes.driveUrl;
      driveFileId = driveRes.fileId;
      mensajeDrive = `Guardado exitosamente en Google Drive.`;
    } else {
      mensajeDrive = driveRes.error || 'Google Drive no está conectado o requirió autenticación.';
    }
  } catch (err: any) {
    console.warn('Fallo en respaldo automático a Google Drive:', err);
    mensajeDrive = `No se pudo sincronizar en Drive: ${err.message || 'Error de conexión'}.`;
  }

  return {
    success: true,
    nombreArchivo,
    formato,
    tituloReporte: config.titulo,
    gerencia: config.gerencia,
    guardadoEnDrive,
    driveUrl,
    driveFileId,
    mensajeDrive,
  };
};

/**
 * Función auxiliar para descargar un Blob o texto en el navegador del usuario
 */
function dispararDescargaNavegador(
  contenido: Blob | Uint8Array | string,
  nombreArchivo: string,
  mimeType: string
) {
  const blob = contenido instanceof Blob 
    ? contenido 
    : typeof contenido === 'string'
      ? new Blob([contenido], { type: mimeType })
      : new Blob([contenido.buffer], { type: mimeType });

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 1000);
}

// =========================================================================
// CONSTRUCTORES DE DOCUMENTOS: PDF, EXCEL Y CSV
// =========================================================================

function construirDocumentoPDF(
  config: ReporteOpcionConfig,
  proyectos: ProyectoEducativo[],
  moneda: Moneda
): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const proyectosConMetricas = proyectos.map((p) => ({
    proyecto: p,
    metricas: calcularMetricasProyecto(p),
  }));

  const totalIngresos = proyectosConMetricas.reduce((acc, item) => acc + (item.metricas.ingresoRealTotal || 0), 0);
  const totalCostos = proyectosConMetricas.reduce((acc, item) => acc + (item.metricas.gastoTotalOperativo || 0), 0);
  const totalGanancias = proyectosConMetricas.reduce((acc, item) => acc + (item.metricas.totalGananciasFinales || 0), 0);
  const totalAlumnos = proyectos.reduce((acc, p) => acc + (p.alumnosFinal || 0), 0);
  const totalRetencionISV = proyectosConMetricas.reduce((acc, item) => acc + (item.metricas.costoDocenteCalculado * 0.15 || 0), 0);
  const margenPromedio = totalIngresos > 0 ? ((totalGanancias / totalIngresos) * 100).toFixed(1) : '0.0';

  // --- 1. ENCABEZADO EJECUTIVO SUPERIOR ---
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 25, 'F');

  // Barra de color representativa por Gerencia
  let barColor: [number, number, number] = [37, 99, 235]; // Blue 600 (General)
  if (config.gerencia === 'Gerencia Académica') barColor = [16, 185, 129]; // Emerald 500
  if (config.gerencia === 'Gerencia de Comercialización') barColor = [245, 158, 11]; // Amber 500
  if (config.gerencia === 'Auditoría Interna') barColor = [225, 29, 72]; // Rose 600

  doc.setFillColor(...barColor);
  doc.rect(0, 25, pageWidth, 2.5, 'F');

  // Marca
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('SUMMIT IMPULSA GLOBAL', margin, 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(191, 219, 254);
  doc.text('Summit Impulsa S. de R.L. • RTN: 05019026435770 • San Pedro Sula, Cortés, Honduras', margin, 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`${config.gerencia.toUpperCase()} | ${config.codigo}`, margin, 20.5);

  const fechaHoy = new Date().toLocaleDateString('es-HN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.text(`Fecha: ${fechaHoy}`, pageWidth - margin, 10, { align: 'right' });
  doc.text(`Moneda: ${moneda} | Respaldo: Google Drive Oficial`, pageWidth - margin, 16, { align: 'right' });
  doc.text(`Programas Evaluados: ${proyectos.length}`, pageWidth - margin, 21, { align: 'right' });

  let y = 33;

  // --- 2. TARJETA DE TÍTULO DEL REPORTE ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(15, 23, 42);
  doc.text(config.titulo, margin + 4, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(config.subtitulo, margin + 4, y + 12);
  doc.text(`Destino y Respaldo Oficial: Carpeta Google Drive ID ${TARGET_DRIVE_FOLDER_ID}`, margin + 4, y + 17);

  y += 26;

  // --- 3. CUADRO RESUMEN DE INDICADORES CLAVE ---
  const boxWidth = (pageWidth - margin * 2 - 9) / 4;
  const kpis = [
    { label: 'INGRESOS TOTALES', valor: formatearMoneda(totalIngresos, moneda), color: [30, 41, 59] },
    { label: 'COSTO TOTAL OPERACIÓN', valor: formatearMoneda(totalCostos, moneda), color: [194, 65, 12] },
    { label: 'UTILIDAD NETA TOTAL', valor: formatearMoneda(totalGanancias, moneda), color: [5, 150, 105] },
    { label: 'MARGEN PROMEDIO', valor: `${margenPromedio}%`, color: [37, 99, 235] },
  ];

  kpis.forEach((kpi, idx) => {
    const xBox = margin + idx * (boxWidth + 3);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(xBox, y, boxWidth, 14, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, xBox + 3, y + 4.5);

    doc.setFontSize(9);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.valor, xBox + 3, y + 10.5);
  });

  y += 18;

  // --- 4. TABLA PRINCIPAL DE DATOS ADAPTADA A LA GERENCIA ---
  let headers: string[][] = [];
  let rows: (string | number)[][] = [];

  if (config.gerencia === 'Gerencia General') {
    headers = [['#', 'Código', 'Programa Educativo', 'Alumnos', 'Precio Vta', 'Ingresos', 'Costos Tot.', 'Utilidad Neta', 'Margen %', 'Estado']];
    rows = proyectosConMetricas.map(({ proyecto: p, metricas: m }, i) => [
      i + 1,
      p.codigoFiscalSAR || p.codigoPrograma || `SAR-${p.numeroCorrelativo || i + 1}`,
      p.nombreProyecto,
      p.alumnosFinal,
      formatearMoneda(m.precioSugeridoAlumno, moneda),
      formatearMoneda(m.ingresoRealTotal, moneda),
      formatearMoneda(m.gastoTotalOperativo, moneda),
      formatearMoneda(m.totalGananciasFinales, moneda),
      `${((m.totalGananciasFinales / (m.ingresoRealTotal || 1)) * 100).toFixed(1)}%`,
      p.seLlevoACabo || 'Planificado'
    ]);
  } else if (config.gerencia === 'Gerencia Académica') {
    headers = [['#', 'Programa Educativo', 'Docente Titular', 'Horas Clase', 'Tarifa/Hora', 'Costo Bruto', 'Ret. ISV 15%', 'Neto Pagar']];
    rows = proyectosConMetricas.map(({ proyecto: p, metricas: m }, i) => {
      const costoDoc = m.costoDocenteCalculado;
      const isv15 = costoDoc * 0.15;
      const netoPagar = costoDoc - isv15;
      return [
        i + 1,
        p.nombreProyecto,
        p.nombreDocente || 'Docente Asignado',
        `${p.horasClase || 0} hrs`,
        formatearMoneda(p.tarifaHoraDocente || 0, moneda),
        formatearMoneda(costoDoc, moneda),
        formatearMoneda(isv15, moneda),
        formatearMoneda(netoPagar, moneda)
      ];
    });
  } else if (config.gerencia === 'Gerencia de Comercialización') {
    headers = [['#', 'Programa Educativo', 'Nivel', 'Alum. Actual', 'Pto. Equilibrio', 'Brecha Alum.', 'Precio Alum.', 'Ingreso Bruto', 'CAC Estimado', 'Dictamen Vtas']];
    rows = proyectosConMetricas.map(({ proyecto: p, metricas: m }, i) => {
      const brecha = p.alumnosFinal - m.puntoEquilibrioAlumnos;
      const cacEst = (p.gastoPublicidad || 0) / (p.alumnosFinal || 1);
      const dictamen = brecha >= 0 ? 'Superávit Comercial' : 'Déficit de Matrícula';
      return [
        i + 1,
        p.nombreProyecto,
        p.nivel || 'Básico',
        p.alumnosFinal,
        m.puntoEquilibrioAlumnos,
        brecha >= 0 ? `+${brecha}` : `${brecha}`,
        formatearMoneda(m.precioSugeridoAlumno, moneda),
        formatearMoneda(m.ingresoRealTotal, moneda),
        formatearMoneda(cacEst, moneda),
        dictamen
      ];
    });
  } else {
    // Auditoría Interna
    headers = [['#', 'Programa', 'Docente', 'Alumnos', 'Pto. Eq.', 'Horas Aud.', 'Retención ISV SAR', 'Margen %', 'Riesgo Auditoría', 'Dictamen']];
    rows = proyectosConMetricas.map(({ proyecto: p, metricas: m }, i) => {
      const riesgo = p.alumnosFinal < m.puntoEquilibrioAlumnos ? 'Crítico (Déficit)' : m.totalGananciasFinales < 0 ? 'Alto Riesgo' : 'Bajo Riesgo (Cumple)';
      return [
        i + 1,
        p.nombreProyecto,
        p.nombreDocente,
        p.alumnosFinal,
        m.puntoEquilibrioAlumnos,
        `${p.horasClase || 0}h`,
        formatearMoneda(m.costoDocenteCalculado * 0.15, moneda),
        `${((m.totalGananciasFinales / (m.ingresoRealTotal || 1)) * 100).toFixed(1)}%`,
        riesgo,
        p.alumnosFinal >= m.puntoEquilibrioAlumnos ? 'Aprobado' : 'Requiere Acción Correctiva'
      ];
    });
  }

  autoTable(doc, {
    startY: y,
    head: headers,
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 6.8,
      textColor: [30, 41, 59],
      cellPadding: 1.8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    styles: {
      overflow: 'linebreak',
    },
    margin: { left: margin, right: margin },
  });

  // @ts-ignore
  let finalY = doc.lastAutoTable?.finalY || y + 50;

  if (finalY > pageHeight - 35) {
    doc.addPage();
    finalY = 20;
  }

  // --- 5. NOTA INSTITUCIONAL Y FIRMAS ---
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Documento institucional generado automáticamente por el Sistema Integral Multi-Gerencial Summit Impulsa Global.`,
    margin,
    finalY + 8
  );
  doc.text(
    `Copia íntegra sincronizada y archivada en Google Drive (Carpeta ID: ${TARGET_DRIVE_FOLDER_ID}). Trazabilidad garantizada bajo normativa tributaria SAR 2026.`,
    margin,
    finalY + 12
  );

  // Espacio para firmas formales
  const firmaY = finalY + 22;
  const colW = (pageWidth - margin * 2) / 3;

  doc.setDrawColor(203, 213, 225);
  doc.line(margin + 5, firmaY, margin + colW - 5, firmaY);
  doc.line(margin + colW + 5, firmaY, margin + colW * 2 - 5, firmaY);
  doc.line(margin + colW * 2 + 5, firmaY, pageWidth - margin - 5, firmaY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(30, 41, 59);
  doc.text('Gerencia Académica (Phd. Donal Reyes)', margin + colW / 2, firmaY + 4, { align: 'center' });
  doc.text('Gerencia Comercial', margin + colW * 1.5, firmaY + 4, { align: 'center' });
  doc.text('Auditoría / Gerencia General', margin + colW * 2.5, firmaY + 4, { align: 'center' });

  // Pie de página institucional numerado en todas las páginas
  const totalPaginas = doc.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `SUMMIT IMPULSA GLOBAL • Summit Impulsa S. de R.L. (RTN: 05019026435770, San Pedro Sula, Cortés) • ${config.codigo} • Fecha: ${fechaHoy}`,
      margin,
      pageHeight - 4.5
    );
    doc.text(`Página ${i} de ${totalPaginas}`, pageWidth - margin, pageHeight - 4.5, { align: 'right' });
  }

  return doc.output('blob');
}

function construirDocumentoExcel(
  config: ReporteOpcionConfig,
  proyectos: ProyectoEducativo[],
  moneda: Moneda
): Blob {
  const wb = XLSX.utils.book_new();

  const proyectosConMetricas = proyectos.map((p) => ({
    proyecto: p,
    metricas: calcularMetricasProyecto(p),
  }));

  // Hoja 1: Reporte Principal
  let dataRows: any[] = [];

  if (config.gerencia === 'Gerencia General') {
    dataRows = proyectosConMetricas.map(({ proyecto: p, metricas: m }, i) => ({
      'Correlativo': p.numeroCorrelativo || i + 1,
      'Código Fiscal SAR': p.codigoFiscalSAR || `SAR-ISV-${p.numeroCorrelativo || i + 1}`,
      'Programa Educativo': p.nombreProyecto,
      'Nivel': p.nivel,
      'Alumnos': p.alumnosFinal,
      'Punto de Equilibrio': m.puntoEquilibrioAlumnos,
      [`Precio Alumno (${moneda})`]: m.precioSugeridoAlumno,
      [`Ingresos Totales (${moneda})`]: m.ingresoRealTotal,
      [`Costos Docentes (${moneda})`]: m.costoDocenteCalculado,
      [`Costos Operativos (${moneda})`]: m.gastoTotalOperativo,
      [`Utilidad Neta (${moneda})`]: m.totalGananciasFinales,
      'Margen %': ((m.totalGananciasFinales / (m.ingresoRealTotal || 1)) * 100).toFixed(1) + '%',
      'Estado Oficial': p.seLlevoACabo || 'Planificado',
    }));
  } else if (config.gerencia === 'Gerencia Académica') {
    dataRows = proyectosConMetricas.map(({ proyecto: p, metricas: m }, i) => ({
      '#': i + 1,
      'Programa Educativo': p.nombreProyecto,
      'Docente Titular': p.nombreDocente,
      'Horas Clase': p.horasClase || 0,
      [`Tarifa / Hora (${moneda})`]: p.tarifaHoraDocente || 0,
      [`Honorarios Brutos (${moneda})`]: m.costoDocenteCalculado,
      [`Retención 15% ISV SAR (${moneda})`]: m.costoDocenteCalculado * 0.15,
      [`Neto a Pagar (${moneda})`]: m.costoDocenteCalculado * 0.85,
      'Código SAR': p.codigoFiscalSAR || 'N/A',
      'Estado Impartición': p.seLlevoACabo || 'Planificado'
    }));
  } else if (config.gerencia === 'Gerencia de Comercialización') {
    dataRows = proyectosConMetricas.map(({ proyecto: p, metricas: m }, i) => ({
      '#': i + 1,
      'Programa Educativo': p.nombreProyecto,
      'Canal de Ventas': p.metodoVenta || 'General',
      'Alumnos Matriculados': p.alumnosFinal,
      'Punto de Equilibrio Mínimo': m.puntoEquilibrioAlumnos,
      'Brecha Comercial': p.alumnosFinal - m.puntoEquilibrioAlumnos,
      [`Precio Venta Alumno (${moneda})`]: m.precioSugeridoAlumno,
      [`Ingreso Proyectado (${moneda})`]: m.ingresoRealTotal,
      [`Presupuesto Publicidad (${moneda})`]: p.gastoPublicidad || 0,
      'Dictamen Comercial': p.alumnosFinal >= m.puntoEquilibrioAlumnos ? 'Cumplido' : 'Déficit de Matrícula'
    }));
  } else {
    // Auditoría Interna
    dataRows = proyectosConMetricas.map(({ proyecto: p, metricas: m }, i) => ({
      '#': i + 1,
      'Programa': p.nombreProyecto,
      'Docente': p.nombreDocente,
      'Alumnos Reales': p.alumnosFinal,
      'Punto Equilibrio': m.puntoEquilibrioAlumnos,
      'Horas Auditadas': p.horasClase || 0,
      [`Costo Docente (${moneda})`]: m.costoDocenteCalculado,
      [`Retención 15% ISV (${moneda})`]: m.costoDocenteCalculado * 0.15,
      [`Utilidad Final (${moneda})`]: m.totalGananciasFinales,
      'Nivel de Riesgo': p.alumnosFinal < m.puntoEquilibrioAlumnos ? 'Crítico' : 'Normal',
      'Dictamen Auditoría': p.alumnosFinal >= m.puntoEquilibrioAlumnos ? 'Conforme' : 'Requiere Plan de Acción'
    }));
  }

  const ws = XLSX.utils.json_to_sheet(dataRows);
  XLSX.utils.book_append_sheet(wb, ws, config.codigo);

  // Hoja 2: Metadata y Respaldo Drive
  const metaRows = [
    { Parámetro: 'Sistema', Valor: 'Summit Impulsa Global' },
    { Parámetro: 'Reporte', Valor: config.titulo },
    { Parámetro: 'Gerencia Responsable', Valor: config.gerencia },
    { Parámetro: 'Fecha Generación', Valor: new Date().toISOString() },
    { Parámetro: 'Moneda Oficial', Valor: moneda },
    { Parámetro: 'Carpeta Google Drive', Valor: TARGET_DRIVE_FOLDER_ID },
    { Parámetro: 'URL Google Drive', Valor: TARGET_DRIVE_FOLDER_URL },
  ];
  const wsMeta = XLSX.utils.json_to_sheet(metaRows);
  XLSX.utils.book_append_sheet(wb, wsMeta, 'Metadatos_Drive');

  const arrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

function construirDocumentoCSV(
  config: ReporteOpcionConfig,
  proyectos: ProyectoEducativo[],
  moneda: Moneda
): string {
  const proyectosConMetricas = proyectos.map((p) => ({
    proyecto: p,
    metricas: calcularMetricasProyecto(p),
  }));

  const escapeCSV = (str: any) => {
    const s = String(str ?? '').replace(/"/g, '""');
    return `"${s}"`;
  };

  let csvContent = '\uFEFF'; // UTF-8 BOM
  csvContent += `# SUMMIT IMPULSA GLOBAL - ${config.titulo.toUpperCase()}\r\n`;
  csvContent += `# Gerencia: ${config.gerencia} | Moneda: ${moneda} | Fecha: ${new Date().toISOString()}\r\n`;
  csvContent += `# Respaldo Drive: ${TARGET_DRIVE_FOLDER_URL}\r\n\r\n`;

  if (config.gerencia === 'Gerencia General') {
    csvContent += 'Correlativo,Codigo_SAR,Programa_Educativo,Nivel,Alumnos,Punto_Equilibrio,Precio_Unitario,Ingresos_Totales,Costos_Operativos,Utilidad_Neta,Margen_Porcentaje,Estado\r\n';
    proyectosConMetricas.forEach(({ proyecto: p, metricas: m }, i) => {
      const margen = ((m.totalGananciasFinales / (m.ingresoRealTotal || 1)) * 100).toFixed(1);
      csvContent += [
        p.numeroCorrelativo || i + 1,
        escapeCSV(p.codigoFiscalSAR || `SAR-${i + 1}`),
        escapeCSV(p.nombreProyecto),
        escapeCSV(p.nivel),
        p.alumnosFinal,
        m.puntoEquilibrioAlumnos,
        m.precioSugeridoAlumno.toFixed(2),
        m.ingresoRealTotal.toFixed(2),
        m.gastoTotalOperativo.toFixed(2),
        m.totalGananciasFinales.toFixed(2),
        `${margen}%`,
        escapeCSV(p.seLlevoACabo || 'Planificado')
      ].join(',') + '\r\n';
    });
  } else if (config.gerencia === 'Gerencia Académica') {
    csvContent += 'Numero,Programa_Educativo,Docente,Horas_Clase,Tarifa_Hora,Honorario_Bruto,Retencion_ISV_15,Neto_Pagar,Estado\r\n';
    proyectosConMetricas.forEach(({ proyecto: p, metricas: m }, i) => {
      const bruto = m.costoDocenteCalculado;
      const isv = bruto * 0.15;
      const neto = bruto - isv;
      csvContent += [
        i + 1,
        escapeCSV(p.nombreProyecto),
        escapeCSV(p.nombreDocente),
        p.horasClase || 0,
        (p.tarifaHoraDocente || 0).toFixed(2),
        bruto.toFixed(2),
        isv.toFixed(2),
        neto.toFixed(2),
        escapeCSV(p.seLlevoACabo || 'Planificado')
      ].join(',') + '\r\n';
    });
  } else if (config.gerencia === 'Gerencia de Comercialización') {
    csvContent += 'Numero,Programa_Educativo,Canal_Ventas,Alumnos_Matriculados,Punto_Equilibrio,Brecha_Alumnos,Precio_Venta,Ingreso_Bruto,Publicidad_Total,Dictamen\r\n';
    proyectosConMetricas.forEach(({ proyecto: p, metricas: m }, i) => {
      const brecha = p.alumnosFinal - m.puntoEquilibrioAlumnos;
      csvContent += [
        i + 1,
        escapeCSV(p.nombreProyecto),
        escapeCSV(p.metodoVenta || 'General'),
        p.alumnosFinal,
        m.puntoEquilibrioAlumnos,
        brecha,
        m.precioSugeridoAlumno.toFixed(2),
        m.ingresoRealTotal.toFixed(2),
        (p.gastoPublicidad || 0).toFixed(2),
        escapeCSV(brecha >= 0 ? 'Meta Cumplida' : 'Déficit de Ventas')
      ].join(',') + '\r\n';
    });
  } else {
    // Auditoría
    csvContent += 'Numero,Programa,Docente,Alumnos,Punto_Equilibrio,Horas_Clase,Costo_Docente,Retencion_ISV,Utilidad_Final,Riesgo,Dictamen\r\n';
    proyectosConMetricas.forEach(({ proyecto: p, metricas: m }, i) => {
      const riesgo = p.alumnosFinal < m.puntoEquilibrioAlumnos ? 'Critico' : 'Normal';
      csvContent += [
        i + 1,
        escapeCSV(p.nombreProyecto),
        escapeCSV(p.nombreDocente),
        p.alumnosFinal,
        m.puntoEquilibrioAlumnos,
        p.horasClase || 0,
        m.costoDocenteCalculado.toFixed(2),
        (m.costoDocenteCalculado * 0.15).toFixed(2),
        m.totalGananciasFinales.toFixed(2),
        escapeCSV(riesgo),
        escapeCSV(p.alumnosFinal >= m.puntoEquilibrioAlumnos ? 'Conforme' : 'Accion Correctiva')
      ].join(',') + '\r\n';
    });
  }

  return csvContent;
}
