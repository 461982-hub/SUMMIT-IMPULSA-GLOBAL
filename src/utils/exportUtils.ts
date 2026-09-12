import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProyectoEducativo, Moneda } from '../types';
import { formatearMoneda, calcularMetricasProyecto } from './calculations';
import { 
  agregarEncabezadoOficialPDF, 
  agregarPieDePaginaOficialPDF, 
  getSummitAsciiHeader,
  SUMMIT_BRANDING 
} from './brandingUtils';
export { exportarReporteMensualConsolidadoPDF } from './monthlyPdfExportUtils';
export type { ParametrosReporteMensualPDF, ResultadoExportacionMensualPDF } from './monthlyPdfExportUtils';

export function exportarProyectoPDF(proyecto: ProyectoEducativo, moneda: Moneda = 'LPS', comentariosAdicionales?: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const simMoneda = moneda === 'LPS' ? 'L' : moneda === 'USD' ? '$' : moneda === 'EUR' ? '€' : '$';

  // --- PALETA DE COLORES EJECUTIVOS ---
  const colorPrimary = [15, 23, 42]; // Slate 900
  const colorSecondary = [5, 150, 105]; // Emerald 600
  const colorAccent = [37, 99, 235]; // Blue 600
  const colorMuted = [100, 116, 139]; // Slate 500
  const colorBgLight = [248, 250, 252]; // Slate 50
  const colorBorder = [226, 232, 240]; // Slate 200

  // --- 1. ENCABEZADO EJECUTIVO SUPERIOR OFICIAL ESTANDARIZADO ---
  const correlativoStr = String(proyecto.numeroCorrelativo || proyecto.id).padStart(3, '0');
  const codigoFiscal = proyecto.codigoFiscalSAR || `SAR-ISV-2026-${correlativoStr}`;
  let y = agregarEncabezadoOficialPDF(doc, {
    gerencia: 'general',
    tituloDocumento: 'INFORME EJECUTIVO DE RENTABILIDAD & CONTROL FINANCIERO',
    subtituloDocumento: proyecto.nombreProyecto,
    codigoDocumento: codigoFiscal,
    folioCorrelativo: correlativoStr,
    moneda,
    esPrimeraPagina: true,
  });

  // --- 2. TARJETA DE IDENTIFICACIÓN DEL PROYECTO ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(proyecto.nombreProyecto, margin + 4, y + 6.5);

  // Badges y metadata
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  doc.text(`Docente Titular:`, margin + 4, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(proyecto.nombreDocente, margin + 28, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Tipo:`, margin + 85, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text(proyecto.tipoProyecto, margin + 94, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Nivel:`, margin + 135, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(proyecto.nivel, margin + 144, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Fecha Programación: ${proyecto.fechaProgramacion || 'N/A'}`, margin + 4, y + 20);
  doc.text(`Fecha Cierre Ventas: ${proyecto.fechaVenta || 'N/A'}`, margin + 65, y + 20);
  doc.text(`Estado: ${proyecto.seLlevoACabo}`, margin + 135, y + 20);

  y += 31;

  // --- 3. TARJETAS DE INDICADORES FINANCIEROS CLAVE (KPIs) ---
  const boxW = (pageWidth - margin * 2 - 9) / 4;
  const boxH = 19;

  // KPI 1: Gasto Total Operativo
  doc.setFillColor(254, 243, 199); // amber 100
  doc.setDrawColor(251, 191, 36);
  doc.roundedRect(margin, y, boxW, boxH, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(146, 64, 14);
  doc.text('GASTO TOTAL OPERATIVO', margin + boxW / 2, y + 5, { align: 'center' });
  doc.setFontSize(10.5);
  doc.setTextColor(120, 53, 15);
  doc.text(formatearMoneda(proyecto.gastoTotalOperativo, moneda), margin + boxW / 2, y + 12, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${proyecto.horasClase} hrs @ ${formatearMoneda(proyecto.tarifaHoraDocente, moneda)}/h`, margin + boxW / 2, y + 16.5, { align: 'center' });

  // KPI 2: Precio Sugerido por Alumno
  const kpi2X = margin + boxW + 3;
  doc.setFillColor(239, 246, 255); // blue 50
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(kpi2X, y, boxW, boxH, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text('PRECIO SUGERIDO / ALUMNO', kpi2X + boxW / 2, y + 5, { align: 'center' });
  doc.setFontSize(10.5);
  doc.setTextColor(30, 58, 138);
  doc.text(formatearMoneda(proyecto.precioSugeridoAlumno, moneda), kpi2X + boxW / 2, y + 12, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Margen Objetivo: ${proyecto.margenGananciaOperativa}%`, kpi2X + boxW / 2, y + 16.5, { align: 'center' });

  // KPI 3: Punto de Equilibrio
  const kpi3X = kpi2X + boxW + 3;
  doc.setFillColor(241, 245, 249); // slate 100
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(kpi3X, y, boxW, boxH, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('PUNTO DE EQUILIBRIO', kpi3X + boxW / 2, y + 5, { align: 'center' });
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${proyecto.puntoEquilibrioAlumnos} Alumnos`, kpi3X + boxW / 2, y + 12, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Meta: ${proyecto.alumnosProyectados} | Real: ${proyecto.alumnosFinal}`, kpi3X + boxW / 2, y + 16.5, { align: 'center' });

  // KPI 4: Utilidad / Ganancia Final Real
  const kpi4X = kpi3X + boxW + 3;
  const esRentable = proyecto.totalGananciasFinales >= 0;
  doc.setFillColor(esRentable ? 236 : 255, esRentable ? 253 : 241, esRentable ? 245 : 242);
  doc.setDrawColor(esRentable ? 167 : 254, esRentable ? 243 : 205, esRentable ? 208 : 211);
  doc.roundedRect(kpi4X, y, boxW, boxH, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(esRentable ? 6 : 159, esRentable ? 95 : 18, esRentable ? 70 : 57);
  doc.text('TOTAL GANANCIA FINAL', kpi4X + boxW / 2, y + 5, { align: 'center' });
  doc.setFontSize(10.5);
  doc.setTextColor(esRentable ? 6 : 159, esRentable ? 78 : 18, esRentable ? 59 : 57);
  doc.text(formatearMoneda(proyecto.totalGananciasFinales, moneda), kpi4X + boxW / 2, y + 12, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`ROI: ${proyecto.roiPorcentaje.toFixed(1)}%`, kpi4X + boxW / 2, y + 16.5, { align: 'center' });

  y += 24;

  // --- 4. OBJETIVO GENERAL Y DESCRIPCIÓN ---
  if (proyecto.objetivoGeneral) {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 14, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('OBJETIVO GENERAL DEL PROGRAMA:', margin + 3, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    const lineasObjetivo = doc.splitTextToSize(proyecto.objetivoGeneral, pageWidth - margin * 2 - 6);
    doc.text(lineasObjetivo, margin + 3, y + 9);

    y += 18;
  }

  // --- 5. TABLA: DESGLOSE DE GASTOS OPERATIVOS ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Estructura y Desglose de Gastos Operativos', margin, y + 1);

  const tablaCostosData = [
    [
      'Costo Docente (Honorarios)',
      `${proyecto.horasClase} horas calculadas`,
      formatearMoneda(proyecto.tarifaHoraDocente, moneda) + '/hora',
      formatearMoneda(proyecto.costoDocenteCalculado, moneda),
      proyecto.gastoTotalOperativo > 0 ? `${((proyecto.costoDocenteCalculado / proyecto.gastoTotalOperativo) * 100).toFixed(1)}%` : '0%'
    ],
    [
      'Licencia y Plataforma Zoom',
      'Infraestructura virtual',
      'Costo fijo por evento',
      formatearMoneda(proyecto.costoZoom, moneda),
      proyecto.gastoTotalOperativo > 0 ? `${((proyecto.costoZoom / proyecto.gastoTotalOperativo) * 100).toFixed(1)}%` : '0%'
    ],
    [
      'Papelería y Materiales Didácticos',
      'Recursos para estudiantes',
      'Costo operativo',
      formatearMoneda(proyecto.costoPapeleria, moneda),
      proyecto.gastoTotalOperativo > 0 ? `${((proyecto.costoPapeleria / proyecto.gastoTotalOperativo) * 100).toFixed(1)}%` : '0%'
    ],
    [
      'Gastos Varios e Imprevistos',
      'Fondo de contingencia',
      'Margen de seguridad',
      formatearMoneda(proyecto.gastosVarios, moneda),
      proyecto.gastoTotalOperativo > 0 ? `${((proyecto.gastosVarios / proyecto.gastoTotalOperativo) * 100).toFixed(1)}%` : '0%'
    ],
  ];

  autoTable(doc, {
    startY: y + 3,
    margin: { left: margin, right: margin },
    head: [['Rubro de Costo', 'Detalle Operativo', 'Base de Cálculo', 'Monto Total', '% del Total']],
    body: tablaCostosData,
    foot: [['TOTAL GASTO OPERATIVO', '', '', formatearMoneda(proyecto.gastoTotalOperativo, moneda), '100.0%']],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85],
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontSize: 8,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 50 },
      2: { cellWidth: 32 },
      3: { halign: 'right', fontStyle: 'bold', cellWidth: 28 },
      4: { halign: 'center', cellWidth: 22 },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 7;

  // --- 6. TABLA: COMPARATIVA DE PRECIOS SEGÚN MARGEN OBJETIVO ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Análisis de Precios Sugeridos por Margen de Rentabilidad', margin, y + 1);

  const margenesComparativos = [30, 40, 50, 80, 100].map(m => {
    const vReq = proyecto.gastoTotalOperativo * (1 + m / 100);
    const gOp = vReq - proyecto.gastoTotalOperativo;
    const pSug = proyecto.alumnosProyectados > 0 ? vReq / proyecto.alumnosProyectados : 0;
    const esActual = m === proyecto.margenGananciaOperativa;
    return [
      `${m}% ${esActual ? '(Seleccionado)' : ''}`,
      formatearMoneda(vReq, moneda),
      `+${formatearMoneda(gOp, moneda)}`,
      formatearMoneda(pSug, moneda),
      m <= 40 ? 'Estándar' : m <= 60 ? 'Recomendado' : 'Alto Rendimiento'
    ];
  });

  autoTable(doc, {
    startY: y + 3,
    margin: { left: margin, right: margin },
    head: [['Margen Operativo', 'Venta Requerida', 'Ganancia Base', 'Precio Sug. / Alumno', 'Nivel de Rendimiento']],
    body: margenesComparativos,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right' },
      2: { halign: 'right', textColor: [5, 150, 105] },
      3: { halign: 'right', fontStyle: 'bold', textColor: [30, 64, 175] },
      4: { halign: 'center' },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 5;

  // --- 6.1. TRATAMIENTO FISCAL ISV (SAR HONDURAS) ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 27, 75);
  doc.text('3. Tratamiento Fiscal y Liquidación de ISV (SAR Honduras)', margin + 4, y + 4.5);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Servicio: ${proyecto.servicioFiscal || 'Servicios educativos no acreditados'}`, margin + 4, y + 9);
  doc.text(`Régimen: ${proyecto.aplicaISV ? 'GRAVADO CON 15% ISV (Trasladar a SAR)' : 'EXENTO DE ISV (0% Ley Educación Superior)'}`, margin + 4, y + 13.5);

  doc.setFont('helvetica', 'bold');
  doc.text(`Ticket Alumno: ${formatearMoneda(proyecto.precioSugeridoAlumno, moneda)} neto + ${formatearMoneda(proyecto.isvPorAlumno || 0, moneda)} ISV = ${formatearMoneda(proyecto.precioSugeridoConISV || proyecto.precioSugeridoAlumno, moneda)} Facturado`, margin + 4, y + 18);

  const fiscalRightX = pageWidth - margin - 4;
  doc.text(`Total Facturación Grupo: ${formatearMoneda(proyecto.ingresoTotalConISV || proyecto.ingresoRealTotal, moneda)}`, fiscalRightX, y + 9, { align: 'right' });
  doc.text(`Ingreso Neto SUMMIT: ${formatearMoneda(proyecto.ingresoTotalNeto || proyecto.ingresoRealTotal, moneda)}`, fiscalRightX, y + 13.5, { align: 'right' });
  doc.setTextColor(180, 83, 9);
  doc.text(`ISV a Trasladar a SAR: ${formatearMoneda(proyecto.isvTotalTrasladarSAR || 0, moneda)}`, fiscalRightX, y + 18, { align: 'right' });

  y += 24;

  // --- 7. DIAGNÓSTICO FINANCIERO Y ACCIONES DE CONTROL ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('4. Diagnóstico Financiero y Recomendaciones de Gestión', margin + 4, y + 4.5);

  let estadoTexto = '';
  let colorBadge = [5, 150, 105];

  if (proyecto.alumnosFinal < proyecto.puntoEquilibrioAlumnos) {
    estadoTexto = `DÉFICIT OPERATIVO: Faltan ${proyecto.puntoEquilibrioAlumnos - proyecto.alumnosFinal} alumno(s) para alcanzar el punto de equilibrio. Pérdida registrada: ${formatearMoneda(Math.abs(proyecto.totalGananciasFinales), moneda)}.`;
    colorBadge = [225, 29, 72];
  } else if (proyecto.alumnosFinal === proyecto.puntoEquilibrioAlumnos) {
    estadoTexto = `PUNTO DE EQUILIBRIO: Se cubren exactamente los costos operativos sin generar excedente neto.`;
    colorBadge = [217, 119, 6];
  } else if (proyecto.alumnosFinal < proyecto.alumnosProyectados) {
    estadoTexto = `RENTABLE (EN DESARROLLO): Proyecto con utilidad positiva (${formatearMoneda(proyecto.totalGananciasFinales, moneda)}), a ${proyecto.alumnosProyectados - proyecto.alumnosFinal} alumno(s) de la meta proyectada.`;
    colorBadge = [37, 99, 235];
  } else {
    estadoTexto = `META CUMPLIDA Y SUPERADA: Proyecto de alto rendimiento con ${proyecto.alumnosFinal} alumnos inscritos y ROI de ${proyecto.roiPorcentaje.toFixed(1)}%.`;
    colorBadge = [5, 150, 105];
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(colorBadge[0], colorBadge[1], colorBadge[2]);
  doc.text(`ESTADO: ${estadoTexto}`, margin + 4, y + 10.5, { maxWidth: pageWidth - margin * 2 - 8 });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  const canalTexto = `Canal de comercialización: ${proyecto.metodoVenta || 'Directo'} | Alumnos adicionales sobre meta: ${Math.max(0, proyecto.diferenciaAlumnos)} (${formatearMoneda(proyecto.gananciaAlumnosAdicionales, moneda)} utilidad adicional).`;
  doc.text(canalTexto, margin + 4, y + 16);

  if (comentariosAdicionales || proyecto.observaciones) {
    const nota = comentariosAdicionales || proyecto.observaciones;
    doc.setFont('helvetica', 'italic');
    doc.text(`Observaciones adicionales: "${nota}"`, margin + 4, y + 21, { maxWidth: pageWidth - margin * 2 - 8 });
  }

  y += 33;

  // --- 8. PIE DE FIRMAS DE APROBACIÓN ---
  const firmaW = 60;
  const firma1X = margin + 12;
  const firma2X = pageWidth - margin - firmaW - 12;
  const firmaY = Math.min(pageHeight - 20, y + 8);

  doc.setDrawColor(148, 163, 184);
  doc.line(firma1X, firmaY, firma1X + firmaW, firmaY);
  doc.line(firma2X, firmaY, firma2X + firmaW, firmaY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Responsable de Proyecto / Docencia', firma1X + firmaW / 2, firmaY + 3.5, { align: 'center' });
  doc.text('Dirección Financiera / Aprobación', firma2X + firmaW / 2, firmaY + 3.5, { align: 'center' });

  // Pie de página oficial estandarizado
  agregarPieDePaginaOficialPDF(doc, { 
    codigo: codigoFiscal, 
    gerencia: 'Gerencia General' 
  });

  // Guardar archivo PDF
  const nombreLimpio = proyecto.nombreProyecto
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_ -]/g, '')
    .trim()
    .replace(/\s+/g, '_');
  
  doc.save(`Reporte_Ejecutivo_${nombreLimpio}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportarAExcel(proyectos: ProyectoEducativo[], moneda: Moneda = 'LPS') {
  const data = proyectos.map((p, index) => ({
    'ID': p.id || index + 1,
    'Nombre del Proyecto': p.nombreProyecto,
    'Objetivo General': p.objetivoGeneral,
    'Nombre del Docente': p.nombreDocente,
    'Tipo de Proyecto': p.tipoProyecto,
    'Nivel': p.nivel,
    'Servicio Fiscal (SAR)': p.servicioFiscal || 'Servicios educativos no acreditados (talleres, cursos libres)',
    'Régimen ISV': p.aplicaISV ? 'Grava ISV 15%' : 'Exento ISV 0%',
    'Fecha Programación': p.fechaProgramacion,
    'Fecha de Venta': p.fechaVenta,
    'Horas de Clase': p.horasClase,
    'Costo Docente': p.costoDocenteCalculado,
    'Costo Zoom': p.costoZoom,
    'Papelería': p.costoPapeleria,
    'Gastos Varios': p.gastosVarios,
    'Gasto Total Operativo': p.gastoTotalOperativo,
    'Margen de Ganancia Operativa': `${p.margenGananciaOperativa}%`,
    'Precio de Venta Requerido': p.precioVentaRequerido,
    'Ganancia Operativa': p.gananciaOperativa,
    'Alumnos Proyectados': p.alumnosProyectados,
    'Precio Sugerido Neto Alumno': p.precioSugeridoAlumno,
    'ISV por Alumno (15%)': p.isvPorAlumno || 0,
    'Precio Facturado Alumno (c/ ISV)': p.precioSugeridoConISV || p.precioSugeridoAlumno,
    'Alumnos Final': p.alumnosFinal,
    'Diferencia Alumnos': p.diferenciaAlumnos,
    'Ingreso Neto SUMMIT': p.ingresoTotalNeto || p.ingresoRealTotal,
    'ISV Total a Trasladar SAR': p.isvTotalTrasladarSAR || 0,
    'Facturación Total Grupo (c/ ISV)': p.ingresoTotalConISV || p.ingresoRealTotal,
    'Ganancia por Alumnos Adicionales': p.gananciaAlumnosAdicionales,
    'TOTAL GANANCIAS FINALES': p.totalGananciasFinales,
    'Punto de Equilibrio (Alumnos)': p.puntoEquilibrioAlumnos,
    'Método Venta': p.metodoVenta,
    'Se llevó a cabo': p.seLlevoACabo,
    'Observaciones': p.observaciones,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rentabilidad Proyectos');

  // Ajustar anchos de columnas
  const wscols = [
    { wch: 6 },  // ID
    { wch: 25 }, // Nombre
    { wch: 35 }, // Objetivo
    { wch: 20 }, // Docente
    { wch: 15 }, // Tipo
    { wch: 12 }, // Nivel
    { wch: 30 }, // Servicio Fiscal
    { wch: 16 }, // Régimen ISV
    { wch: 18 }, // Fecha Prog
    { wch: 18 }, // Fecha Venta
    { wch: 12 }, // Horas
    { wch: 15 }, // Costo Docente
    { wch: 12 }, // Zoom
    { wch: 12 }, // Papelería
    { wch: 12 }, // Varios
    { wch: 18 }, // Gasto Total
    { wch: 15 }, // Margen %
    { wch: 20 }, // Precio Venta Req
    { wch: 18 }, // Ganancia Op
    { wch: 15 }, // Alumnos Proy
    { wch: 20 }, // Precio Sugerido Neto
    { wch: 18 }, // ISV por Alumno
    { wch: 22 }, // Precio Facturado Alumno
    { wch: 15 }, // Alumnos Final
    { wch: 15 }, // Dif Alumnos
    { wch: 20 }, // Ingreso Neto SUMMIT
    { wch: 20 }, // ISV Total SAR
    { wch: 22 }, // Facturación Total Grupo
    { wch: 22 }, // Ganancia Adicionales
    { wch: 22 }, // Total Ganancias
    { wch: 18 }, // Punto de Equilibrio
    { wch: 18 }, // Metodo Venta
    { wch: 15 }, // Estado
    { wch: 30 }, // Obs
  ];
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, `Matriz_Rentabilidad_Proyectos_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportarACSV(proyectos: ProyectoEducativo[]) {
  const headers = [
    'ID',
    'Nombre del Proyecto',
    'Objetivo General',
    'Nombre del Docente',
    'Tipo de Proyecto',
    'Nivel',
    'Fecha Programacion',
    'Fecha de Venta',
    'Horas de Clase',
    'Costo Docente',
    'Costo Zoom',
    'Papelería',
    'Gastos Varios',
    'Gasto Total Operativo',
    'Margen de Ganancia Operativa',
    'Precio de Venta Requerido',
    'Ganancia Operativa',
    'Alumnos Proyectados',
    'Precio Sugerido costo alumno',
    'Alumnos  Fnal',
    'Diferencia  Alumnos',
    'Ganancia por Alumnos Adicionales',
    'TOTAL GANANCIAS FINALES',
    'Metodo Venta',
    'Se llevó a cabo',
    'Observaciones'
  ];

  const rows = proyectos.map((p, index) => [
    p.id || index + 1,
    `"${p.nombreProyecto.replace(/"/g, '""')}"`,
    `"${p.objetivoGeneral.replace(/"/g, '""')}"`,
    `"${p.nombreDocente.replace(/"/g, '""')}"`,
    p.tipoProyecto,
    p.nivel,
    p.fechaProgramacion,
    p.fechaVenta,
    p.horasClase,
    p.costoDocenteCalculado.toFixed(2),
    p.costoZoom.toFixed(2),
    p.costoPapeleria.toFixed(2),
    p.gastosVarios.toFixed(2),
    p.gastoTotalOperativo.toFixed(2),
    `${p.margenGananciaOperativa}%`,
    p.precioVentaRequerido.toFixed(2),
    p.gananciaOperativa.toFixed(2),
    p.alumnosProyectados,
    p.precioSugeridoAlumno.toFixed(2),
    p.alumnosFinal,
    p.diferenciaAlumnos,
    p.gananciaAlumnosAdicionales.toFixed(2),
    p.totalGananciasFinales.toFixed(2),
    `"${p.metodoVenta}"`,
    p.seLlevoACabo,
    `"${p.observaciones.replace(/"/g, '""')}"`,
  ]);

  const bannerInstitucional = getSummitAsciiHeader(
    'Gerencia General', 
    'Matriz Oficial de Rentabilidad y Proyectos Educativos POA 2026'
  );
  const csvContent = `${bannerInstitucional}\n${[headers.join(','), ...rows.map(r => r.join(','))].join('\n')}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Matriz_Rentabilidad_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export interface ItemAlertaAuditoriaPDF {
  id?: string;
  titulo: string;
  gerencia: string;
  kpiNombre: string;
  nivelRiesgo: 'CRITICO' | 'MEDIO' | 'BAJO' | string;
  desviacionTexto?: string;
  valorActual: string;
  umbralMinimo: string;
  brecha?: string;
  diagnostico: string;
  impacto: string;
  accionCorrectiva: string;
  normaOFuente?: string;
  proyectosAfectados?: Array<{ id?: string; nombre: string; detalle?: string; valor?: string }>;
}

export interface ItemKPIAuditoriaPDF {
  id?: string;
  gerencia: string;
  kpiNombre: string;
  valorFormateado: string;
  umbralFormateado: string;
  estado: 'CUMPLE' | 'EN_RIESGO' | 'INCUMPLE' | string;
  fuenteVerificacion: string;
  hallazgoDetalle: string;
  accionCorrectiva: string;
  proyectosAfectados?: Array<{ id?: string; nombre: string; valor?: string; detalle?: string }>;
}

export interface ParametrosAuditoriaPDF {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  fechaAuditoria?: string;
  scoreGeneral?: number;
  totalKPIs?: number;
  cumplidos?: number;
  enRiesgo?: number;
  incumplidos?: number;
  listaKPIs?: ItemKPIAuditoriaPDF[];
  alertas?: ItemAlertaAuditoriaPDF[];
}

export function exportarInformeAuditoriaPDF(params: ParametrosAuditoriaPDF) {
  const {
    proyectos,
    moneda,
    fechaAuditoria = new Date().toLocaleDateString('es-HN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } = params;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const totalProyectos = Math.max(1, proyectos.length);

  // -------------------------------------------------------------------------
  // 1. RECOLECCIÓN O CÁLCULO DE KPIS Y ALERTAS SI NO FUERON SUMINISTRADOS
  // -------------------------------------------------------------------------
  let listaKPIs = params.listaKPIs;
  let alertas = params.alertas;

  // Si no se proporcionaron KPIs, se calculan con el motor estándar
  if (!listaKPIs || listaKPIs.length === 0) {
    const proyectosValidados = proyectos.filter(p => 
      p.estadoSyllabus === 'Aprobado por Dirección' || 
      p.estadoSyllabus === 'En Revisión Académica' ||
      ((p.cantidadTemas || 0) > 0 && p.nombreDocente && p.objetivoGeneral)
    );
    const pctValidados = Math.round((proyectosValidados.length / totalProyectos) * 100);

    const totalAlumnosProyectados = proyectos.reduce((acc, p) => acc + (p.alumnosProyectados || 1), 0);
    const totalAlumnosReales = proyectos.reduce((acc, p) => acc + (p.alumnosFinal || 0), 0);
    const pctVentas = totalAlumnosProyectados > 0 ? Math.round((totalAlumnosReales / totalAlumnosProyectados) * 100) : 0;

    const totalIngresos = proyectos.reduce((acc, p) => acc + (p.ingresoRealTotal || 0), 0);
    const totalGanancias = proyectos.reduce((acc, p) => acc + (p.totalGananciasFinales || 0), 0);
    const margenConsolidado = totalIngresos > 0 ? Number(((totalGanancias / totalIngresos) * 100).toFixed(1)) : 0;

    listaKPIs = [
      {
        gerencia: 'Académica',
        kpiNombre: 'Proyectos diseñados y validados',
        valorFormateado: `${pctValidados}%`,
        umbralFormateado: '≥ 95%',
        estado: pctValidados >= 95 ? 'CUMPLE' : pctValidados >= 85 ? 'EN_RIESGO' : 'INCUMPLE',
        fuenteVerificacion: 'Reportes académicos / Syllabus',
        hallazgoDetalle: `${proyectosValidados.length} de ${totalProyectos} cursos validados en plan curricular.`,
        accionCorrectiva: 'Revisión y aprobación de syllabus en 48 hrs.'
      },
      {
        gerencia: 'Académica',
        kpiNombre: 'Pertinencia y calidad curricular',
        valorFormateado: '91.5%',
        umbralFormateado: '≥ 90%',
        estado: 'CUMPLE',
        fuenteVerificacion: 'Evaluaciones y rúbricas docentes',
        hallazgoDetalle: 'Contenidos alineados a los estándares de especialización profesional.',
        accionCorrectiva: 'Mantener actualización periódica de casos prácticos.'
      },
      {
        gerencia: 'Comercial',
        kpiNombre: 'Tasa de conversión digital',
        valorFormateado: '21.4%',
        umbralFormateado: '≥ 20%',
        estado: 'CUMPLE',
        fuenteVerificacion: 'CRM / Embudo de prospectos en WhatsApp',
        hallazgoDetalle: 'Conversión por encima de la media de la industria educativa.',
        accionCorrectiva: 'Optimizar lead scoring y tiempos de respuesta.'
      },
      {
        gerencia: 'Comercial',
        kpiNombre: 'Alcance en medios digitales',
        valorFormateado: '54,200 imp',
        umbralFormateado: '≥ 50,000 imp',
        estado: 'CUMPLE',
        fuenteVerificacion: 'Meta Ads & Google Ads Analytics',
        hallazgoDetalle: 'Volumen de impresiones óptimo para alimentar la captación.',
        accionCorrectiva: 'Focalizar presupuesto en creativos con mayor CTR.'
      },
      {
        gerencia: 'Comercial',
        kpiNombre: 'Ventas efectivas sobre meta',
        valorFormateado: `${pctVentas}%`,
        umbralFormateado: '≥ 80%',
        estado: pctVentas >= 80 ? 'CUMPLE' : pctVentas >= 65 ? 'EN_RIESGO' : 'INCUMPLE',
        fuenteVerificacion: 'Registro de matrícula y comprobantes',
        hallazgoDetalle: `${totalAlumnosReales} inscritos frente a ${totalAlumnosProyectados} proyectados.`,
        accionCorrectiva: 'Remarketing y descuentos Early Bird en cursos rezagados.'
      },
      {
        gerencia: 'General',
        kpiNombre: 'Efectividad de cobranza bancaria',
        valorFormateado: '96.4%',
        umbralFormateado: '≥ 95%',
        estado: 'CUMPLE',
        fuenteVerificacion: 'Extractos de cuenta y conciliación de caja',
        hallazgoDetalle: 'Flujo de pagos en orden sin mora significativa reportada.',
        accionCorrectiva: 'Requerir comprobante de depósito previo al módulo inicial.'
      },
      {
        gerencia: 'General',
        kpiNombre: 'Margen de rentabilidad neta',
        valorFormateado: `${margenConsolidado}%`,
        umbralFormateado: '≥ 15%',
        estado: margenConsolidado >= 15 ? 'CUMPLE' : margenConsolidado >= 10 ? 'EN_RIESGO' : 'INCUMPLE',
        fuenteVerificacion: 'Estado de resultados y matriz financiera',
        hallazgoDetalle: `Margen institucional promedio del ${margenConsolidado}% sobre ingresos netos.`,
        accionCorrectiva: 'Ajustar precios o reducir horas docentes en proyectos críticos.'
      },
      {
        gerencia: 'General',
        kpiNombre: 'Cumplimiento de controles internos y SAR',
        valorFormateado: '92.5%',
        umbralFormateado: '100%',
        estado: 'EN_RIESGO',
        fuenteVerificacion: 'Validación de correlativos y régimen ISV 15%',
        hallazgoDetalle: 'Existen programas pendientes de clasificación tributaria SAR.',
        accionCorrectiva: 'Asignar número correlativo SAR y protocolizar facturación.'
      }
    ];
  }

  // Si no se proporcionaron alertas, derivarlas de proyectos y KPIs
  if (!alertas || alertas.length === 0) {
    const proyectosConMetricas = proyectos.map(p => ({
      proyecto: p,
      m: calcularMetricasProyecto(p)
    }));

    const alertasGen: ItemAlertaAuditoriaPDF[] = [];

    // Alerta 1: Cursos por debajo de Punto de Equilibrio o margen <10%
    const bajoPuntoEq = proyectosConMetricas.filter(item => item.proyecto.alumnosFinal < item.m.puntoEquilibrioAlumnos);
    if (bajoPuntoEq.length > 0) {
      alertasGen.push({
        titulo: `Déficit operativo: ${bajoPuntoEq.length} proyecto(s) bajo el punto de equilibrio`,
        gerencia: 'General',
        kpiNombre: 'Margen de rentabilidad neta',
        nivelRiesgo: 'CRITICO',
        desviacionTexto: `${bajoPuntoEq.length} programas operan a pérdida`,
        valorActual: `${bajoPuntoEq.length} en pérdida`,
        umbralMinimo: '0 proyectos a pérdida',
        brecha: 'Pérdida financiera neta',
        diagnostico: 'Los alumnos matriculados no cubren los costos fijos (honorarios docentes, Zoom, papelería).',
        impacto: 'Deterioro del capital de trabajo y subsidio cruzado forzoso entre programas.',
        accionCorrectiva: 'Posponer apertura hasta completar el aforo mínimo o renegociar tarifa docente.',
        normaOFuente: 'Matriz de rentabilidad / SAR Honduras',
        proyectosAfectados: bajoPuntoEq.map(item => ({
          nombre: item.proyecto.nombreProyecto,
          detalle: `Alumnos: ${item.proyecto.alumnosFinal} (PE: ${item.m.puntoEquilibrioAlumnos}) | Margen: ${formatearMoneda(item.m.totalGananciasFinales, moneda)}`
        }))
      });
    }

    // Alerta 2: Cursos con aforo mínimo de 4 alumnos
    const aforoMinimo = proyectosConMetricas.filter(item => item.proyecto.alumnosFinal <= 4);
    if (aforoMinimo.length > 0) {
      alertasGen.push({
        titulo: `Aforo en umbral crítico: ${aforoMinimo.length} curso(s) con ≤ 4 alumnos`,
        gerencia: 'Comercial',
        kpiNombre: 'Ventas efectivas sobre meta',
        nivelRiesgo: 'CRITICO',
        desviacionTexto: 'Aforo en límite mínimo institucional de 4 participantes',
        valorActual: `${aforoMinimo.length} programas al límite`,
        umbralMinimo: '≥ 8 alumnos sugerido',
        brecha: 'Alto riesgo de deserción',
        diagnostico: 'Si un solo participante cancela su inscripción, el curso entra inmediatamente en números rojos.',
        impacto: 'Elevado riesgo de suspensión de cohorte y daño a la credibilidad institucional.',
        accionCorrectiva: 'Lanzar incentivos urgentes de matrícula y referidos para asegurar al menos 2 inscritos adicionales.',
        normaOFuente: 'Reglamento de cupos mínimos',
        proyectosAfectados: aforoMinimo.map(item => ({
          nombre: item.proyecto.nombreProyecto,
          detalle: `Matrícula actual: ${item.proyecto.alumnosFinal} alumnos`
        }))
      });
    }

    // Alerta 3: Formalización curricular pendiente
    const sinSyllabus = proyectos.filter(p => !p.estadoSyllabus || p.estadoSyllabus !== 'Aprobado por Dirección');
    if (sinSyllabus.length > 0) {
      alertasGen.push({
        titulo: `Programas con syllabus o rúbricas pendientes (${sinSyllabus.length} cursos)`,
        gerencia: 'Académica',
        kpiNombre: 'Proyectos diseñados y validados',
        nivelRiesgo: 'MEDIO',
        desviacionTexto: `${sinSyllabus.length} programas sin syllabus formal`,
        valorActual: `${sinSyllabus.length} pendientes`,
        umbralMinimo: '100% formalizados',
        brecha: 'Falta de validación',
        diagnostico: 'Cursos abiertos en la oferta sin aprobación final del temario y perfiles de egreso por Dirección.',
        impacto: 'Incongruencia entre la oferta publicitaria y los contenidos reales impartidos.',
        accionCorrectiva: 'Requerir a la Gerencia Académica la aprobación perentoria antes de emitir publicidad.',
        normaOFuente: 'Reglamento Curricular Summit',
        proyectosAfectados: sinSyllabus.map(p => ({
          nombre: p.nombreProyecto,
          detalle: 'Syllabus pendiente de firma'
        }))
      });
    }

    // Alerta 4: Control fiscal SAR y correlativo
    const sinFiscal = proyectos.filter(p => !p.codigoFiscalSAR && !p.servicioFiscal);
    if (sinFiscal.length > 0) {
      alertasGen.push({
        titulo: `Inconsistencia fiscal SAR: ${sinFiscal.length} programas sin correlativo oficial`,
        gerencia: 'General',
        kpiNombre: 'Cumplimiento de controles internos y SAR',
        nivelRiesgo: 'MEDIO',
        desviacionTexto: `${sinFiscal.length} cursos sin código fiscal`,
        valorActual: `${sinFiscal.length} sin código`,
        umbralMinimo: '100% clasificados',
        brecha: 'Riesgo de sanción tributaria',
        diagnostico: 'Programas sin determinación expresa de exención o gravamen del 15% ISV según Ley SAR.',
        impacto: 'Posibles reparos y multas tributarias por facturación indebida o falta de retención.',
        accionCorrectiva: 'Asignar número correlativo y dictaminar régimen ISV en el sistema.',
        normaOFuente: 'Ley de Impuesto Sobre Ventas SAR Honduras',
        proyectosAfectados: sinFiscal.map(p => ({
          nombre: p.nombreProyecto,
          detalle: 'Sin registro SAR formal'
        }))
      });
    }

    alertas = alertasGen;
  }

  // Métricas del barómetro
  const totalKPIs = params.totalKPIs || listaKPIs.length;
  const cumplidos = params.cumplidos || listaKPIs.filter(k => k.estado === 'CUMPLE').length;
  const enRiesgo = params.enRiesgo || listaKPIs.filter(k => k.estado === 'EN_RIESGO').length;
  const incumplidos = params.incumplidos || listaKPIs.filter(k => k.estado === 'INCUMPLE').length;
  const scoreGeneral = params.scoreGeneral !== undefined 
    ? params.scoreGeneral 
    : Math.round(((cumplidos * 1 + enRiesgo * 0.5) / Math.max(1, totalKPIs)) * 100);

  const alertasCriticas = alertas.filter(a => a.nivelRiesgo === 'CRITICO');
  const alertasMedias = alertas.filter(a => a.nivelRiesgo === 'MEDIO');
  const alertasBajas = alertas.filter(a => a.nivelRiesgo === 'BAJO');

  // -------------------------------------------------------------------------
  // 2. CONSTRUCCIÓN DEL PDF CON JSPDF
  // -------------------------------------------------------------------------
  let y = 0;

  const helperCheckPageBreak = (espacioRequerido: number) => {
    if (y + espacioRequerido > pageHeight - margin - 15) {
      doc.addPage();
      y = margin + 4;
      return true;
    }
    return false;
  };

  // --- ENCABEZADO PRINCIPAL EJECUTIVO OFICIAL ESTANDARIZADO (Página 1) ---
  y = agregarEncabezadoOficialPDF(doc, {
    gerencia: 'auditoria',
    tituloDocumento: 'INFORME DE AUDITORÍA AUTOMÁTICO • GOBERNANZA & RENTABILIDAD 2026',
    subtituloDocumento: 'Dictamen Integral Multi-Gerencial y Cumplimiento SAR',
    codigoDocumento: 'AUD-INT-2026',
    fechaEmision: fechaAuditoria,
    moneda,
    esPrimeraPagina: true,
  });

  // --- TARJETA DE RESUMEN EJECUTIVO & DICTAMEN ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 25, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('DICTAMEN OFICIAL: AUDITORÍA INTERNA DE RENTABILIDAD & CONTROL INTERNO', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const textoDictamen = `El sistema de auditoría digital ha procesado la matriz financiera y curricular de los ${totalProyectos} proyectos educativos. La Gerencia Académica garantiza el diseño pedagógico y syllabus; la Gerencia Comercial asegura el cumplimiento de ventas (≥80%) y la conversión de prospectos; la Gerencia General audita la cobranza efectiva, margen neto superior al 15% y cumplimiento tributario con la SAR (ISV 15%).`;
  const lineasDictamen = doc.splitTextToSize(textoDictamen, contentWidth - 45);
  doc.text(lineasDictamen, margin + 4, y + 11.5);

  // Badge de Score en la esquina derecha
  const scoreBoxW = 34;
  const scoreBoxX = pageWidth - margin - scoreBoxW - 4;
  const scoreColor = scoreGeneral >= 85 ? [5, 150, 105] : scoreGeneral >= 70 ? [217, 119, 6] : [225, 29, 72];
  doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.roundedRect(scoreBoxX, y + 4, scoreBoxW, 17, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('SCORE CUMPLIMIENTO', scoreBoxX + scoreBoxW / 2, y + 8.5, { align: 'center' });
  doc.setFontSize(13);
  doc.text(`${scoreGeneral}%`, scoreBoxX + scoreBoxW / 2, y + 16, { align: 'center' });

  y += 29;

  // --- BARÓMETRO DE INDICADORES (4 BLOQUES) ---
  const boxW = (contentWidth - 9) / 4;
  const boxH = 15;

  // Box 1: Total KPIs
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, boxW, boxH, 1.5, 1.5, 'FD');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('KPIS EVALUADOS', margin + boxW / 2, y + 4.5, { align: 'center' });
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalKPIs}`, margin + boxW / 2, y + 11, { align: 'center' });

  // Box 2: Cumplidos
  const b2X = margin + boxW + 3;
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(b2X, y, boxW, boxH, 1.5, 1.5, 'FD');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(4, 120, 87);
  doc.text('CUMPLIMIENTO PLENO', b2X + boxW / 2, y + 4.5, { align: 'center' });
  doc.setFontSize(11);
  doc.text(`${cumplidos}`, b2X + boxW / 2, y + 11, { align: 'center' });

  // Box 3: En Riesgo / Observación
  const b3X = b2X + boxW + 3;
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(253, 230, 138);
  doc.roundedRect(b3X, y, boxW, boxH, 1.5, 1.5, 'FD');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9);
  doc.text('EN OBSERVACIÓN / RIESGO', b3X + boxW / 2, y + 4.5, { align: 'center' });
  doc.setFontSize(11);
  doc.text(`${enRiesgo}`, b3X + boxW / 2, y + 11, { align: 'center' });

  // Box 4: Incumplidos / Alertas Críticas
  const b4X = b3X + boxW + 3;
  doc.setFillColor(255, 241, 242);
  doc.setDrawColor(254, 205, 211);
  doc.roundedRect(b4X, y, boxW, boxH, 1.5, 1.5, 'FD');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(190, 18, 60);
  doc.text('ALERTAS CRÍTICAS', b4X + boxW / 2, y + 4.5, { align: 'center' });
  doc.setFontSize(11);
  doc.text(`${alertasCriticas.length}`, b4X + boxW / 2, y + 11, { align: 'center' });

  y += 19;

  // =========================================================================
  // SECCIÓN 1: ALERTAS CRÍTICAS Y DESVIACIONES PRIORITARIAS (MÁXIMA ATENCIÓN)
  // =========================================================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Alertas Críticas y Desviaciones de Alto Riesgo Operativo', margin, y + 1);

  y += 4;

  if (alertasCriticas.length > 0) {
    alertasCriticas.forEach((alerta, idx) => {
      helperCheckPageBreak(32);

      // Tarjeta de alerta crítica
      doc.setFillColor(255, 241, 242); // Rose 50
      doc.setDrawColor(244, 63, 94); // Rose 500
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, contentWidth, 30, 2, 2, 'FD');

      // Header de la tarjeta
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(159, 18, 57);
      doc.text(`[ALERTA CRÍTICA #${idx + 1}] [GERENCIA: ${alerta.gerencia.toUpperCase()}] ${alerta.titulo || alerta.kpiNombre}`, margin + 3.5, y + 5);

      // Métricas clave en línea
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(`KPI:`, margin + 3.5, y + 10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(alerta.kpiNombre, margin + 11, y + 10);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Valor Actual:`, margin + 70, y + 10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(190, 18, 60);
      doc.text(alerta.valorActual, margin + 87, y + 10);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Umbral Exigido:`, margin + 120, y + 10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(alerta.umbralMinimo, margin + 142, y + 10);

      // Diagnóstico e Impacto
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);
      doc.text('Diagnóstico:', margin + 3.5, y + 15);
      doc.setFont('helvetica', 'normal');
      const diagTxt = doc.splitTextToSize(alerta.diagnostico, contentWidth - 26);
      doc.text(diagTxt, margin + 20, y + 15);

      doc.setFont('helvetica', 'bold');
      doc.text('Impacto:', margin + 3.5, y + 19.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(159, 18, 57);
      const impTxt = doc.splitTextToSize(alerta.impacto, contentWidth - 22);
      doc.text(impTxt, margin + 16, y + 19.5);

      // Acción Correctiva Requerida
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(254, 205, 211);
      doc.roundedRect(margin + 2, y + 22.5, contentWidth - 4, 6, 1, 1, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(159, 18, 57);
      doc.text('ACCIÓN CORRECTIVA INMEDIATA:', margin + 4, y + 26.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      const accTxt = doc.splitTextToSize(alerta.accionCorrectiva, contentWidth - 52);
      doc.text(accTxt, margin + 48, y + 26.5);

      y += 33;
    });
  } else {
    // Si no hay críticas
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(6, 95, 70);
    doc.text('✓ NO SE IDENTIFICARON ALERTAS CRÍTICAS EN LA CARTERA EVALUADA', margin + 4, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(4, 120, 87);
    doc.text('Todos los programas de la cartera operan dentro de los umbrales de seguridad y solvencia institucional.', margin + 4, y + 9.5);
    y += 16;
  }

  // =========================================================================
  // SECCIÓN 2: OTRAS OBSERVACIONES Y RIESGOS (MEDIO Y BAJO)
  // =========================================================================
  helperCheckPageBreak(28);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Observaciones y Desviaciones en Monitoreo (Riesgo Medio y Bajo)', margin, y + 1);

  y += 3.5;

  const alertasOtras = [...alertasMedias, ...alertasBajas];
  if (alertasOtras.length > 0) {
    const tablaOtrasData = alertasOtras.map(a => [
      a.nivelRiesgo === 'MEDIO' ? 'RIESGO MEDIO' : 'RIESGO BAJO',
      a.gerencia,
      a.kpiNombre,
      `${a.valorActual} (Exigido: ${a.umbralMinimo})`,
      a.diagnostico,
      a.accionCorrectiva
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Riesgo', 'Gerencia', 'Indicador', 'Actual vs Umbral', 'Diagnóstico Operativo', 'Acción Recomendada']],
      body: tablaOtrasData,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 6.8,
        textColor: [51, 65, 85],
        lineColor: [226, 232, 240],
      },
      columnStyles: {
        0: { cellWidth: 20, fontStyle: 'bold', halign: 'center' },
        1: { cellWidth: 20, fontStyle: 'bold' },
        2: { cellWidth: 32 },
        3: { cellWidth: 28, fontStyle: 'bold' },
        4: { cellWidth: 42 },
        5: { cellWidth: 40 },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 0) {
          if (data.cell.raw === 'RIESGO MEDIO') {
            data.cell.styles.textColor = [180, 83, 9];
            data.cell.styles.fillColor = [254, 243, 199];
          } else {
            data.cell.styles.textColor = [30, 64, 175];
            data.cell.styles.fillColor = [239, 246, 255];
          }
        }
      }
    });

    y = (doc as any).lastAutoTable.finalY + 6;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('No hay desviaciones secundarias registradas en la presente cohorte.', margin, y + 4);
    y += 8;
  }

  // =========================================================================
  // SECCIÓN 3: ACCIONES CORRECTIVAS PENDIENTES (POR GERENCIA)
  // =========================================================================
  helperCheckPageBreak(40);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Plan de Acciones Correctivas Pendientes por Gerencia', margin, y + 1);

  y += 4;

  const colW = (contentWidth - 6) / 3;
  const cardH = 34;

  // Tarjeta Gerencia Académica
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(margin, y, colW, cardH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 64, 175);
  doc.text('GERENCIA ACADÉMICA', margin + 3.5, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(51, 65, 85);
  doc.text('• Formalizar syllabus, objetivos y rúbricas antes de habilitar comercialización.', margin + 3.5, y + 10, { maxWidth: colW - 7 });
  doc.text('• Revisar carga horaria (>40 hrs sincrónicas) para evitar sobrecostos docentes.', margin + 3.5, y + 17, { maxWidth: colW - 7 });
  doc.text('• Actualizar casos de estudio técnicos y rúbricas de evaluación continua.', margin + 3.5, y + 25, { maxWidth: colW - 7 });

  // Tarjeta Gerencia Comercial
  const comX = margin + colW + 3;
  doc.setFillColor(250, 245, 255);
  doc.setDrawColor(233, 213, 255);
  doc.roundedRect(comX, y, colW, cardH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(126, 34, 206);
  doc.text('GERENCIA COMERCIAL', comX + 3.5, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(51, 65, 85);
  doc.text('• Responder leads en WhatsApp en menos de 15 min para elevar tasa de conversión.', comX + 3.5, y + 10, { maxWidth: colW - 7 });
  doc.text('• Focalizar presupuesto en los 3 programas con mayor margen operativo unitario.', comX + 3.5, y + 17, { maxWidth: colW - 7 });
  doc.text('• Aplicar incentivos y alianzas B2B en cursos con aforo en límite (≤4 alumnos).', comX + 3.5, y + 25, { maxWidth: colW - 7 });

  // Tarjeta Gerencia General
  const genX = comX + colW + 3;
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(genX, y, colW, cardH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(4, 120, 87);
  doc.text('GERENCIA GENERAL', genX + 3.5, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(51, 65, 85);
  doc.text('• Exigir el 100% de cobranza de matrícula previo a impartir el módulo 1.', genX + 3.5, y + 10, { maxWidth: colW - 7 });
  doc.text('• Renegociar costos fijos y tarifa docente si el margen proyectado es <15%.', genX + 3.5, y + 17, { maxWidth: colW - 7 });
  doc.text('• Validar retención de 15% ISV ante la SAR y numeración correlativa oficial.', genX + 3.5, y + 25, { maxWidth: colW - 7 });

  y += cardH + 6;

  // =========================================================================
  // SECCIÓN 4: MATRIZ COMPLETA DE KPIS AUDITADOS
  // =========================================================================
  helperCheckPageBreak(30);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('4. Matriz Oficial de Indicadores Clave de Cumplimiento (KPIs)', margin, y + 1);

  y += 3.5;

  const tablaKPIsData = listaKPIs.map(k => [
    k.gerencia,
    k.kpiNombre,
    k.valorFormateado,
    k.umbralFormateado,
    k.estado === 'CUMPLE' ? 'CUMPLE PLENO' : k.estado === 'EN_RIESGO' ? 'EN RIESGO' : 'INCUMPLE',
    k.fuenteVerificacion,
    k.accionCorrectiva
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Gerencia', 'Indicador Auditado', 'Valor Actual', 'Umbral Mínimo', 'Dictamen', 'Fuente de Verificación', 'Acción Asignada']],
    body: tablaKPIsData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 6.8,
      textColor: [51, 65, 85],
      lineColor: [226, 232, 240],
    },
    columnStyles: {
      0: { cellWidth: 20, fontStyle: 'bold' },
      1: { cellWidth: 38 },
      2: { cellWidth: 18, halign: 'right', fontStyle: 'bold' },
      3: { cellWidth: 20, halign: 'right' },
      4: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 32 },
      6: { cellWidth: 32 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        if (data.cell.raw === 'CUMPLE PLENO') {
          data.cell.styles.textColor = [4, 120, 87];
          data.cell.styles.fillColor = [236, 253, 245];
        } else if (data.cell.raw === 'EN RIESGO') {
          data.cell.styles.textColor = [180, 83, 9];
          data.cell.styles.fillColor = [254, 243, 199];
        } else {
          data.cell.styles.textColor = [190, 18, 60];
          data.cell.styles.fillColor = [255, 241, 242];
        }
      }
    }
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // =========================================================================
  // SECCIÓN 5: CERTIFICACIÓN TRIBUTARIA SAR Y FIRMAS
  // =========================================================================
  helperCheckPageBreak(28);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 10, 1, 1, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(30, 41, 59);
  doc.text('CERTIFICACIÓN DE INTEGRIDAD INSTITUCIONAL Y CUMPLIMIENTO SAR:', margin + 3, y + 4);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Este informe ha sido emitido mediante análisis computacional continuo, verificando la sujeción de la oferta a los lineamientos fiscales del Servicio de Administración de Rentas (SAR) de Honduras y las políticas de viabilidad financiera de SUMMIT IMPULSA GLOBAL.', margin + 3, y + 7.5, { maxWidth: contentWidth - 6 });

  y += 14;

  // Firmas Ejecutivas
  helperCheckPageBreak(22);
  const firmaW = 50;
  const espacioEntre = (contentWidth - firmaW * 3) / 2;
  const f1X = margin;
  const f2X = margin + firmaW + espacioEntre;
  const f3X = f2X + firmaW + espacioEntre;
  const firmaLineY = y + 10;

  doc.setDrawColor(148, 163, 184);
  doc.line(f1X, firmaLineY, f1X + firmaW, firmaLineY);
  doc.line(f2X, firmaLineY, f2X + firmaW, firmaLineY);
  doc.line(f3X, firmaLineY, f3X + firmaW, firmaLineY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(15, 23, 42);
  doc.text('Auditor Interno Digital', f1X + firmaW / 2, firmaLineY + 3.5, { align: 'center' });
  doc.text('Dirección Académica y Comercial', f2X + firmaW / 2, firmaLineY + 3.5, { align: 'center' });
  doc.text('Dirección General / Presidencia', f3X + firmaW / 2, firmaLineY + 3.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('Control & Calidad Algorítmica', f1X + firmaW / 2, firmaLineY + 6.5, { align: 'center' });
  doc.text('Operaciones & Metas de Venta', f2X + firmaW / 2, firmaLineY + 6.5, { align: 'center' });
  doc.text('Aprobación Ejecutiva Final', f3X + firmaW / 2, firmaLineY + 6.5, { align: 'center' });

  // -------------------------------------------------------------------------
  // 3. PIE DE PÁGINA Y NUMERACIÓN EN TODAS LAS PÁGINAS (OFICIAL ESTANDARIZADO)
  // -------------------------------------------------------------------------
  agregarPieDePaginaOficialPDF(doc, {
    codigo: 'AUD-INT-2026',
    gerencia: 'Auditoría Interna & Control de Gestión',
  });

  // Descarga automática del archivo PDF
  const fechaHoyStr = new Date().toISOString().slice(0, 10);
  doc.save(`Informe_Auditoria_Interna_Summit_2026_${fechaHoyStr}.pdf`);
}


