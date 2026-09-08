import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProyectoEducativo, Moneda } from '../types';
import { formatearMoneda } from './calculations';
import { subirReporteADrive } from '../services/googleDriveService';

export interface ParametrosComparativaExport {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  guardarEnDrive?: boolean;
}

export interface ResultadoExportacionComparativa {
  nombreArchivo: string;
  guardadoEnDrive: boolean;
  driveUrl?: string;
  mensajeDrive?: string;
}

/**
 * Genera un dictamen y recomendación estratégica para un proyecto individual
 */
export function obtenerDiagnosticoComparativo(p: ProyectoEducativo) {
  const margenReal = p.ingresoRealTotal > 0 
    ? (p.totalGananciasFinales / p.ingresoRealTotal) * 100 
    : 0;
  const tasaOcupacion = p.alumnosProyectados > 0 
    ? (p.alumnosFinal / p.alumnosProyectados) * 100 
    : 0;
  const costoPorAlumno = p.alumnosFinal > 0 
    ? p.gastoTotalOperativo / p.alumnosFinal 
    : 0;

  let veredicto = 'Estándar';
  let categoria: 'estrella' | 'saludable' | 'alerta' | 'critico' = 'saludable';
  let recomendacion = '';

  if (p.alumnosFinal < p.puntoEquilibrioAlumnos || p.totalGananciasFinales < 0) {
    veredicto = 'Déficit Operativo';
    categoria = 'critico';
    recomendacion = `No cubrió el punto de equilibrio (${p.puntoEquilibrioAlumnos} alumnos). Para futuras ediciones se requiere elevar la cuota mínima o renegociar costos fijos.`;
  } else if (margenReal >= 45 && tasaOcupacion >= 100) {
    veredicto = 'Programa Estrella (Replicar)';
    categoria = 'estrella';
    recomendacion = `Alto rendimiento financiero (Margen ${margenReal.toFixed(1)}%). Candidato prioritario para abrir nuevas cohortes y escalar cupos.`;
  } else if (margenReal >= 30) {
    veredicto = 'Sólido & Rentable';
    categoria = 'saludable';
    recomendacion = `Margen saludable. Se sugiere mantener el modelo de pricing y docente, impulsando mayor pauta comercial para optimizar ocupación.`;
  } else if (margenReal >= 15) {
    veredicto = 'Margen Moderado';
    categoria = 'alerta';
    recomendacion = `Margen por debajo de la meta institucional (40%). Evaluar ajuste de precio por alumno o aumento de alumnos requeridos para diluir el costo docente.`;
  } else {
    veredicto = 'Margen Crítico';
    categoria = 'critico';
    recomendacion = `Rentabilidad mínima (${margenReal.toFixed(1)}%). Revisar estructura de honorarios docentes y evaluar su viabilidad como programa independiente.`;
  }

  return {
    veredicto,
    categoria,
    recomendacion,
    margenReal,
    tasaOcupacion,
    costoPorAlumno,
  };
}

/**
 * Exporta la comparativa de proyectos seleccionados a formato Excel (.xlsx)
 */
export async function exportarComparativaProyectosExcel({
  proyectos,
  moneda,
  guardarEnDrive = false,
}: ParametrosComparativaExport): Promise<ResultadoExportacionComparativa> {
  const fechaHoyStr = new Date().toISOString().slice(0, 10);
  const nombreArchivo = `Comparativa_Programas_Educativos_Summit_${fechaHoyStr}.xlsx`;

  // Construcción de la matriz comparativa de filas
  const headers = ['Métrica / Indicador Clave', ...proyectos.map((p) => p.nombreProyecto)];

  const filas: any[][] = [
    headers,
    // Sección 1: Formato
    ['--- FICHA ACADÉMICA ---', ...proyectos.map(() => '')],
    ['Correlativo Institucional', ...proyectos.map((p) => `#${p.numeroCorrelativo || 'S/N'}`)],
    ['Docente Titular', ...proyectos.map((p) => p.nombreDocente || 'Por asignar')],
    ['Tipo de Programa', ...proyectos.map((p) => p.tipoProyecto)],
    ['Nivel Académico', ...proyectos.map((p) => p.nivel)],
    ['Horas de Clase', ...proyectos.map((p) => `${p.horasClase} hrs`)],
    ['Tarifa por Hora Docente', ...proyectos.map((p) => formatearMoneda(p.tarifaHoraDocente, moneda))],
    ['Estado Actual', ...proyectos.map((p) => p.seLlevoACabo)],
    ['Mes de Control / Cohorte', ...proyectos.map((p) => p.mesControl || '2026-08')],
    
    // Sección 2: Demanda y Matrícula
    ['--- DEMANDA Y MATRÍCULA ---', ...proyectos.map(() => '')],
    ['Alumnos Proyectados (Meta)', ...proyectos.map((p) => p.alumnosProyectados)],
    ['Alumnos Reales Finales', ...proyectos.map((p) => p.alumnosFinal)],
    ['Cumplimiento de Matrícula (%)', ...proyectos.map((p) => `${((p.alumnosFinal / p.alumnosProyectados) * 100).toFixed(1)}%`)],
    ['Punto de Equilibrio (Alumnos)', ...proyectos.map((p) => p.puntoEquilibrioAlumnos)],
    ['Margen de Seguridad (Alumnos)', ...proyectos.map((p) => p.alumnosFinal - p.puntoEquilibrioAlumnos)],
    
    // Sección 3: Precios e Ingresos
    ['--- PRECIOS E INGRESOS ---', ...proyectos.map(() => '')],
    ['Precio Sugerido Neto por Alumno', ...proyectos.map((p) => formatearMoneda(p.precioSugeridoAlumno, moneda))],
    ['Tratamiento Fiscal (SAR)', ...proyectos.map((p) => p.aplicaISV ? 'Grava ISV 15%' : 'Exento ISV 0%')],
    ['Precio Sugerido con ISV', ...proyectos.map((p) => formatearMoneda(p.precioSugeridoConISV || p.precioSugeridoAlumno, moneda))],
    ['Ingreso Proyectado Total', ...proyectos.map((p) => formatearMoneda(p.precioVentaRequerido, moneda))],
    ['Ingreso Real Facturado', ...proyectos.map((p) => formatearMoneda(p.ingresoRealTotal, moneda))],
    
    // Sección 4: Estructura de Costos
    ['--- ESTRUCTURA DE COSTOS ---', ...proyectos.map(() => '')],
    ['Costo Docente (Honorarios)', ...proyectos.map((p) => formatearMoneda(p.costoDocenteCalculado, moneda))],
    ['Costo Licencia Zoom', ...proyectos.map((p) => formatearMoneda(p.costoZoom, moneda))],
    ['Papelería y Materiales', ...proyectos.map((p) => formatearMoneda(p.costoPapeleria, moneda))],
    ['Gastos Varios / Imprevistos', ...proyectos.map((p) => formatearMoneda(p.gastosVarios, moneda))],
    ['Gasto Total Operativo', ...proyectos.map((p) => formatearMoneda(p.gastoTotalOperativo, moneda))],
    ['Costo Operativo por Alumno', ...proyectos.map((p) => formatearMoneda(p.alumnosFinal > 0 ? p.gastoTotalOperativo / p.alumnosFinal : 0, moneda))],
    
    // Sección 5: Rentabilidad
    ['--- RENTABILIDAD Y RETORNO ---', ...proyectos.map(() => '')],
    ['Ganancia Neta Final (Utilidad)', ...proyectos.map((p) => formatearMoneda(p.totalGananciasFinales, moneda))],
    ['Margen Real Obtenido (%)', ...proyectos.map((p) => `${p.ingresoRealTotal > 0 ? ((p.totalGananciasFinales / p.ingresoRealTotal) * 100).toFixed(1) : '0.0'}%`)],
    ['Margen Operativo Proyectado (%)', ...proyectos.map((p) => `${p.margenGananciaOperativa}%`)],
    ['Retorno sobre Inversión (ROI %)', ...proyectos.map((p) => `${p.roiPorcentaje.toFixed(1)}%`)],
    ['Ganancia Neta por Alumno', ...proyectos.map((p) => formatearMoneda(p.alumnosFinal > 0 ? p.totalGananciasFinales / p.alumnosFinal : 0, moneda))],
    ['Ganancia por Hora Académica', ...proyectos.map((p) => formatearMoneda(p.horasClase > 0 ? p.totalGananciasFinales / p.horasClase : 0, moneda))],
    ['Retención Tributaria SAR (15%)', ...proyectos.map((p) => formatearMoneda(p.isvTotalTrasladarSAR || (p.aplicaISV ? p.ingresoRealTotal * 0.15 : 0), moneda))],
    
    // Sección 6: Veredicto
    ['--- VEREDICTO Y DECISIÓN ---', ...proyectos.map(() => '')],
    ['Diagnóstico Estratégico', ...proyectos.map((p) => obtenerDiagnosticoComparativo(p).veredicto)],
    ['Recomendación para Programas Similares', ...proyectos.map((p) => obtenerDiagnosticoComparativo(p).recomendacion)],
  ];

  const ws = XLSX.utils.aoa_to_sheet(filas);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Comparativa_Lado_A_Lado');

  // Generar buffer para descarga / drive
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  let guardadoEnDrive = false;
  let driveUrl: string | undefined;
  let mensajeDrive: string | undefined;

  if (guardarEnDrive) {
    try {
      const res = await subirReporteADrive({
        nombreArchivo,
        contenido: blob,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        gerencia: 'Gerencia General',
        titulo: `Comparativa Lado a Lado (${proyectos.length} programas)`,
        formato: 'EXCEL',
      });
      guardadoEnDrive = res.success;
      driveUrl = res.driveUrl;
      mensajeDrive = res.error;
    } catch (e: any) {
      console.warn('Error subiendo comparativa a Drive:', e);
    }
  }

  // Descarga local
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return {
    nombreArchivo,
    guardadoEnDrive,
    driveUrl,
    mensajeDrive,
  };
}

/**
 * Exporta la comparativa ejecutiva lado a lado en un informe formal PDF
 */
export async function exportarComparativaProyectosPDF({
  proyectos,
  moneda,
  guardarEnDrive = false,
}: ParametrosComparativaExport): Promise<ResultadoExportacionComparativa> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  // Header decorativo
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 20, 'F');
  doc.setFillColor(37, 99, 235); // Blue 600
  doc.rect(0, 20, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('SUMMIT IMPULSA GLOBAL • CENTRO DE REPORTES EJECUTIVOS', margin, 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(191, 219, 254);
  doc.text('Informe Oficial de Comparativa Lado a Lado y Análisis de Decisión para Programas Educativos', margin, 14.5);

  const fechaHoy = new Date().toLocaleDateString('es-HN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`Fecha de Emisión: ${fechaHoy} | Moneda: ${moneda}`, pageWidth - margin, 12, { align: 'right' });

  let y = 27;

  // Título de la sección
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Matriz Comparativa de ${proyectos.length} Programas Educativos Seleccionados`, margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Evaluación integral de rendimiento académico, unit economics, costos directos y rentabilidad neta.', margin, y + 4.5);

  y += 9;

  // Preparación de datos para la tabla
  const tableHead = [
    [
      'Métrica Clave / Indicador',
      ...proyectos.map((p) => `${p.nombreProyecto}\n(Docente: ${p.nombreDocente || 'Por asignar'})`),
    ],
  ];

  const tableBody = [
    // Bloque 1
    ['FICHA ACADÉMICA', ...proyectos.map(() => '')],
    ['Tipo de Programa', ...proyectos.map((p) => p.tipoProyecto)],
    ['Nivel Académico', ...proyectos.map((p) => p.nivel)],
    ['Carga Horaria & Tarifa', ...proyectos.map((p) => `${p.horasClase} hrs @ ${formatearMoneda(p.tarifaHoraDocente, moneda)}/h`)],
    ['Estado del Programa', ...proyectos.map((p) => p.seLlevoACabo)],

    // Bloque 2
    ['MATRÍCULA Y CONVERSIÓN', ...proyectos.map(() => '')],
    ['Alumnos: Reales / Meta Proyectada', ...proyectos.map((p) => `${p.alumnosFinal} inscritos / ${p.alumnosProyectados} meta`)],
    ['Cumplimiento de Matrícula (%)', ...proyectos.map((p) => `${((p.alumnosFinal / p.alumnosProyectados) * 100).toFixed(1)}%`)],
    ['Punto de Equilibrio (Alumnos)', ...proyectos.map((p) => `${p.puntoEquilibrioAlumnos} alumnos`)],
    ['Margen de Seguridad (Superávit)', ...proyectos.map((p) => `+${p.alumnosFinal - p.puntoEquilibrioAlumnos} alumnos`)],

    // Bloque 3
    ['PRECIOS E INGRESOS', ...proyectos.map(() => '')],
    ['Precio Sugerido Neto / Alumno', ...proyectos.map((p) => formatearMoneda(p.precioSugeridoAlumno, moneda))],
    ['Régimen Fiscal (SAR)', ...proyectos.map((p) => p.aplicaISV ? 'Grava ISV 15%' : 'Exento ISV 0%')],
    ['Ingreso Real Facturado Total', ...proyectos.map((p) => formatearMoneda(p.ingresoRealTotal, moneda))],

    // Bloque 4
    ['ESTRUCTURA DE COSTOS', ...proyectos.map(() => '')],
    ['Costo Docente (Honorarios)', ...proyectos.map((p) => formatearMoneda(p.costoDocenteCalculado, moneda))],
    ['Infraestructura Virtual (Zoom)', ...proyectos.map((p) => formatearMoneda(p.costoZoom, moneda))],
    ['Papelería & Gastos Varios', ...proyectos.map((p) => formatearMoneda(p.costoPapeleria + p.gastosVarios, moneda))],
    ['Gasto Total Operativo', ...proyectos.map((p) => formatearMoneda(p.gastoTotalOperativo, moneda))],
    ['Costo Operativo por Alumno', ...proyectos.map((p) => formatearMoneda(p.alumnosFinal > 0 ? p.gastoTotalOperativo / p.alumnosFinal : 0, moneda))],

    // Bloque 5
    ['RENTABILIDAD Y RETORNO', ...proyectos.map(() => '')],
    ['Ganancia Neta Final (Utilidad)', ...proyectos.map((p) => formatearMoneda(p.totalGananciasFinales, moneda))],
    ['Margen de Utilidad Real (%)', ...proyectos.map((p) => `${p.ingresoRealTotal > 0 ? ((p.totalGananciasFinales / p.ingresoRealTotal) * 100).toFixed(1) : '0.0'}%`)],
    ['Retorno de Inversión (ROI %)', ...proyectos.map((p) => `${p.roiPorcentaje.toFixed(1)}%`)],
    ['Ganancia Neta por Alumno', ...proyectos.map((p) => formatearMoneda(p.alumnosFinal > 0 ? p.totalGananciasFinales / p.alumnosFinal : 0, moneda))],
    ['Reserva Tributaria SAR (15%)', ...proyectos.map((p) => formatearMoneda(p.isvTotalTrasladarSAR || (p.aplicaISV ? p.ingresoRealTotal * 0.15 : 0), moneda))],

    // Bloque 6
    ['DECISIÓN ESTRATÉGICA', ...proyectos.map(() => '')],
    ['Diagnóstico Ejecutivo', ...proyectos.map((p) => obtenerDiagnosticoComparativo(p).veredicto)],
    ['Recomendación para Programas Similares', ...proyectos.map((p) => obtenerDiagnosticoComparativo(p).recomendacion)],
  ];

  const colWidth = Math.max(38, (contentWidth - 62) / proyectos.length);
  const columnStylesConfig: Record<number, any> = {
    0: { cellWidth: 62, fontStyle: 'bold', textColor: [30, 41, 59] },
  };
  proyectos.forEach((_, idx) => {
    columnStylesConfig[idx + 1] = { cellWidth: colWidth };
  });

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.2,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 6.8,
      textColor: [51, 65, 85],
      cellPadding: 2,
    },
    columnStyles: columnStylesConfig,
    didParseCell: (data) => {
      const fila = data.row.index;
      // Resaltar encabezados de bloque
      if (
        fila === 0 ||
        fila === 5 ||
        fila === 10 ||
        fila === 14 ||
        fila === 20 ||
        fila === 26
      ) {
        data.cell.styles.fillColor = [241, 245, 249];
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [30, 58, 138];
      }
      // Resaltar margen real
      if (fila === 22 && data.column.index > 0) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [4, 120, 87];
      }
      // Resaltar Ganancia Neta
      if (fila === 21 && data.column.index > 0) {
        data.cell.styles.fontStyle = 'bold';
      }
      // Resaltar Diagnóstico
      if (fila === 27 && data.column.index > 0) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [254, 249, 195];
      }
    },
  });

  // Pie de página oficial
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 8, pageWidth - margin, pageHeight - 8);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `SUMMIT IMPULSA GLOBAL • Comparativa Lado a Lado de Programas • Emisión: ${fechaHoy}`,
      margin,
      pageHeight - 4
    );
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 4, { align: 'right' });
  }

  const fechaHoyStr = new Date().toISOString().slice(0, 10);
  const nombreArchivo = `Comparativa_Programas_Summit_${fechaHoyStr}.pdf`;
  const pdfBlob = doc.output('blob');

  let guardadoEnDrive = false;
  let driveUrl: string | undefined;
  let mensajeDrive: string | undefined;

  if (guardarEnDrive) {
    try {
      const res = await subirReporteADrive({
        nombreArchivo,
        contenido: pdfBlob,
        mimeType: 'application/pdf',
        gerencia: 'Gerencia General',
        titulo: `Comparativa Lado a Lado (${proyectos.length} programas)`,
        formato: 'PDF',
      });
      guardadoEnDrive = res.success;
      driveUrl = res.driveUrl;
      mensajeDrive = res.error;
    } catch (e: any) {
      console.warn('Error subiendo comparativa PDF a Drive:', e);
    }
  }

  doc.save(nombreArchivo);

  return {
    nombreArchivo,
    guardadoEnDrive,
    driveUrl,
    mensajeDrive,
  };
}
