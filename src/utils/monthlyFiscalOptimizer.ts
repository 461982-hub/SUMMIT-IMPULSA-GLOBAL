import { ProyectoEducativo, Moneda, TipoServicioFiscal } from '../types';
import { formatearMoneda, calcularMetricasProyecto } from './calculations';
import { obtenerClaveMesProyecto, formatearEtiquetaMes } from './monthUtils';
import { DICCIONARIO_REGLAS_FISCALES } from './taxCalculations';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { subirReporteADrive } from '../services/googleDriveService';

export interface SugerenciaFiscalProyecto {
  proyectoId: string;
  codigoPrograma: string;
  nombreProyecto: string;
  tipoProyecto: string;
  nivel: string;
  nombreDocente: string;
  mesClave: string;
  horasClase: number;
  alumnosBase: number;
  precioSugeridoAlumno: number;
  volumenIngresosTotal: number;
  servicioFiscalActual: TipoServicioFiscal;
  gravaISVActual: boolean;
  montoISVActual: number;
  servicioFiscalSugerido: TipoServicioFiscal;
  gravaISVSugerido: boolean;
  montoISVSugerido: number;
  ahorroFiscalEstimado: number;
  incrementoMargenEstimado: number;
  esYaOptimo: boolean;
  nivelPrioridad: 'alta' | 'media' | 'optimo';
  justificacionTecnica: string;
  fundamentoLegalSAR: string;
  recomendacionOperativa: string;
}

export interface AnalisisFiscalMensualResultado {
  mesSeleccionado: string;
  etiquetaMes: string;
  proyectosDelMes: ProyectoEducativo[];
  sugerencias: SugerenciaFiscalProyecto[];
  totalIngresosMes: number;
  totalISVActualMes: number;
  totalISVSugeridoMes: number;
  ahorroFiscalTotalMes: number;
  porcentajeEficienciaFiscal: number;
  conteoTotalProyectos: number;
  conteoOptimizables: number;
  conteoYaOptimos: number;
}

/**
 * Motor de análisis tributario inteligente:
 * Evalúa los proyectos según el volumen de ingresos, número de alumnos, horas y tipo de actividad,
 * determinando el régimen y servicio fiscal más eficiente legalmente según la Ley del ISV de Honduras y la SAR.
 */
export function analizarOptimizacionFiscalMensual(
  proyectos: ProyectoEducativo[],
  mesSeleccionado: string = 'todos'
): AnalisisFiscalMensualResultado {
  // 1. Filtrar proyectos por mes (o todos)
  const proyectosFiltrados = mesSeleccionado === 'todos'
    ? proyectos
    : proyectos.filter((p) => obtenerClaveMesProyecto(p) === mesSeleccionado);

  const sugerencias: SugerenciaFiscalProyecto[] = proyectosFiltrados.map((p) => {
    const mesClave = obtenerClaveMesProyecto(p);
    const alumnos = Math.max(1, Number(p.alumnosFinal) || Number(p.alumnosProyectados) || 4);
    const volumenIngresos = p.ingresoRealTotal || p.ingresoTotalNeto || (p.precioSugeridoAlumno * alumnos) || p.precioVentaRequerido || 0;
    const horas = p.horasClase || 0;
    const nombreLower = (p.nombreProyecto || '').toLowerCase();
    const tipoLower = (p.tipoProyecto || '').toLowerCase();
    const nivelLower = (p.nivel || '').toLowerCase();

    // Servicio fiscal actual del proyecto
    const servicioActual: TipoServicioFiscal = (p.servicioFiscal as TipoServicioFiscal) ||
      'Servicios educativos no acreditados (talleres, cursos libres)';
    const reglaActual = DICCIONARIO_REGLAS_FISCALES[servicioActual] || DICCIONARIO_REGLAS_FISCALES['Servicios educativos no acreditados (talleres, cursos libres)'];
    const gravaISVActual = p.aplicaISV !== undefined ? p.aplicaISV : reglaActual.gravaISV;
    const montoISVActual = gravaISVActual ? volumenIngresos * 0.15 : 0;

    // Reglas de inferencia tributaria basada en actividad y volumen:
    let servicioSugerido: TipoServicioFiscal = servicioActual;
    let justificacionTecnica = '';
    let fundamentoLegalSAR = '';
    let recomendacionOperativa = '';
    let nivelPrioridad: 'alta' | 'media' | 'optimo' = 'optimo';

    // Criterio 1: Actividades con estructura académica formal (Diplomados, Certificaciones, Cursos > 20 hrs o Especializaciones)
    const esFormatoAcademicoExtenso = 
      tipoLower.includes('diplomado') || 
      nombreLower.includes('diplomado') ||
      tipoLower.includes('certificacion') || 
      nombreLower.includes('certificación') || 
      nombreLower.includes('certificacion') ||
      nombreLower.includes('especializ') ||
      nombreLower.includes('acreditad') ||
      horas >= 20;

    // Criterio 2: Actividades de Consultoría o Mentoría Ejecutiva de Alto Valor B2B (empresas/corporativo)
    const esConsultoriaOMentoriaB2B =
      tipoLower.includes('consultor') ||
      nombreLower.includes('consultor') ||
      tipoLower.includes('mentor') ||
      nombreLower.includes('mentor') ||
      nombreLower.includes('corporativ') ||
      nombreLower.includes('in-company') ||
      (volumenIngresos >= 35000 && (p.precioSugeridoAlumno >= 3500 || horas <= 16));

    // Criterio 3: Gestión administrativa / RRHH
    const esGestionAdminORRHH =
      tipoLower.includes('rrhh') ||
      nombreLower.includes('rrhh') ||
      nombreLower.includes('talento') ||
      tipoLower.includes('administra') ||
      nombreLower.includes('pmo') ||
      nombreLower.includes('gestion');

    if (esFormatoAcademicoExtenso) {
      // Máxima eficiencia fiscal para formación: Acogerse a Formación Acreditada (Convenio Universitario)
      servicioSugerido = 'Formación académica acreditada (ej. convenios universitarios)';
      justificacionTecnica = 'Por su carga horaria sustancial y diseño curricular, este programa califica plenamente para emitirse bajo el convenio institucional de educación superior de SUMMIT IMPULSA GLOBAL.';
      fundamentoLegalSAR = 'Art. 15 numeral 1 de la Ley del Impuesto Sobre Ventas de Honduras (SAR): Exención formal del 15% de ISV para servicios de educación superior y técnica acreditada. Tasa municipal preferencial (0.10%).';
      recomendacionOperativa = 'Formalizar el aval institucional en el certificado y facturar con tarifa exenta CAI. Esto elimina un 15% de sobrecosto impositivo para el participante o incrementa la ganancia líquida de SUMMIT.';
      
      if (servicioActual !== 'Formación académica acreditada (ej. convenios universitarios)') {
        nivelPrioridad = 'alta';
      } else {
        nivelPrioridad = 'optimo';
      }
    } else if (esConsultoriaOMentoriaB2B) {
      // Consultoría empresarial o mentoría ejecutiva
      if (tipoLower.includes('consultor') || nombreLower.includes('consultor')) {
        servicioSugerido = 'Consultoría empresarial';
        justificacionTecnica = 'Programa enfocado en asesoría estratégica B2B. A las empresas patrocinantes les conviene facturar bajo consultoría profesional porque deducen el 100% del ISR empresarial.';
        fundamentoLegalSAR = 'Art. 1 y 15 Ley del ISV (Servicios Profesionales Técnicos) y Art. 11 Ley del ISR. El 15% de ISV es aprovechado por el cliente como Crédito Fiscal SAR mensual.';
        recomendacionOperativa = 'Emitir factura CAI detallando servicios de consultoría profesional y retener el 12.5% sobre honorarios docentes para blindar a SUMMIT ante el Art. 50 de la Ley de ISR.';
      } else {
        servicioSugerido = 'Capacitación profesional / Mentoría ejecutiva';
        justificacionTecnica = 'Servicio corporativo de desarrollo de competencias ejecutivas. Facturación empresarial deducible de renta con traslado formal de ISV.';
        fundamentoLegalSAR = 'Art. 1 Ley del ISV y Ley del ISR para programas de entrenamiento profesional de personal corporativo.';
        recomendacionOperativa = 'Transparentar el 15% ISV en la cotización comercial al cliente B2B para que sea recuperado vía crédito fiscal sin perjudicar el margen operativo de SUMMIT.';
      }

      if (servicioActual === servicioSugerido) {
        nivelPrioridad = 'optimo';
      } else {
        nivelPrioridad = 'media';
      }
    } else if (esGestionAdminORRHH) {
      servicioSugerido = tipoLower.includes('rrhh') 
        ? 'Intermediación laboral / servicios de RRHH' 
        : 'Servicios administrativos / gestión de proyectos';
      justificacionTecnica = 'Actividad terciaria de intermediación o gestión operativa de proyectos. Sujeta a régimen general de facturación con deducibilidad de gastos directos.';
      fundamentoLegalSAR = 'Art. 1 Ley del ISV y Art. 22 Ley del ISR. Deducibilidad total de costos directos de plataformas tecnológicas y licencias.';
      recomendacionOperativa = 'Registrar comprobantes de pago docentes y licencias de software para deducir de la renta neta gravable anual ante la SAR.';
      nivelPrioridad = servicioActual === servicioSugerido ? 'optimo' : 'media';
    } else {
      // Cursos libres / talleres cortos de baja intensidad
      // Si el volumen de ingresos es moderado (< L 25,000) o dirigido a público general, evaluar si vincular a extensión
      if (horas >= 12 || volumenIngresos >= 20000) {
        servicioSugerido = 'Formación académica acreditada (ej. convenios universitarios)';
        justificacionTecnica = 'Cursos de extensión que pueden homologarse bajo el programa de educación continua universitaria para beneficiarse de la exención legal del 15% de ISV.';
        fundamentoLegalSAR = 'Art. 15 num. 1 Ley del ISV (Educación y Extensión Académica Reconocida).';
        recomendacionOperativa = 'Integrar al padrón de diplomados breves o cursos de extensión de SUMMIT para reducir la carga fiscal y hacer el precio de matrícula más competitivo.';
        nivelPrioridad = servicioActual === 'Formación académica acreditada (ej. convenios universitarios)' ? 'optimo' : 'alta';
      } else {
        servicioSugerido = 'Servicios educativos no acreditados (talleres, cursos libres)';
        justificacionTecnica = 'Taller práctico de corta duración para público particular. Se mantiene en régimen general de educación no formal.';
        fundamentoLegalSAR = 'Ley del Impuesto Sobre Ventas de Honduras: Alícuota general del 15% trasladable al consumidor final.';
        recomendacionOperativa = 'Asegurar que el precio al público incluya el 15% de ISV claramente desglosado para no afectar el margen operativo presupuestado.';
        nivelPrioridad = 'optimo';
      }
    }

    const reglaSugerida = DICCIONARIO_REGLAS_FISCALES[servicioSugerido] || DICCIONARIO_REGLAS_FISCALES['Servicios educativos no acreditados (talleres, cursos libres)'];
    const gravaISVSugerido = reglaSugerida.gravaISV;
    const montoISVSugerido = gravaISVSugerido ? volumenIngresos * 0.15 : 0;
    const ahorroFiscalEstimado = Math.max(0, montoISVActual - montoISVSugerido);
    const incrementoMargenEstimado = volumenIngresos > 0 ? (ahorroFiscalEstimado / volumenIngresos) * 100 : 0;
    const esYaOptimo = servicioActual === servicioSugerido && gravaISVActual === gravaISVSugerido;

    return {
      proyectoId: p.id,
      codigoPrograma: p.codigoPrograma || 'PRG',
      nombreProyecto: p.nombreProyecto,
      tipoProyecto: p.tipoProyecto,
      nivel: p.nivel || 'Básico',
      nombreDocente: p.nombreDocente,
      mesClave,
      horasClase: horas,
      alumnosBase: alumnos,
      precioSugeridoAlumno: p.precioSugeridoAlumno || 0,
      volumenIngresosTotal: volumenIngresos,
      servicioFiscalActual: servicioActual,
      gravaISVActual,
      montoISVActual,
      servicioFiscalSugerido: servicioSugerido,
      gravaISVSugerido,
      montoISVSugerido,
      ahorroFiscalEstimado,
      incrementoMargenEstimado,
      esYaOptimo,
      nivelPrioridad: esYaOptimo ? 'optimo' : nivelPrioridad,
      justificacionTecnica,
      fundamentoLegalSAR,
      recomendacionOperativa,
    };
  });

  const totalIngresosMes = sugerencias.reduce((acc, s) => acc + s.volumenIngresosTotal, 0);
  const totalISVActualMes = sugerencias.reduce((acc, s) => acc + s.montoISVActual, 0);
  const totalISVSugeridoMes = sugerencias.reduce((acc, s) => acc + s.montoISVSugerido, 0);
  const ahorroFiscalTotalMes = Math.max(0, totalISVActualMes - totalISVSugeridoMes);
  const porcentajeEficienciaFiscal = totalISVActualMes > 0
    ? ((totalISVActualMes - totalISVSugeridoMes) / totalISVActualMes) * 100
    : 100;

  const conteoTotalProyectos = sugerencias.length;
  const conteoOptimizables = sugerencias.filter((s) => !s.esYaOptimo).length;
  const conteoYaOptimos = sugerencias.filter((s) => s.esYaOptimo).length;

  return {
    mesSeleccionado,
    etiquetaMes: mesSeleccionado === 'todos' ? 'Todos los Meses' : formatearEtiquetaMes(mesSeleccionado),
    proyectosDelMes: proyectosFiltrados,
    sugerencias,
    totalIngresosMes,
    totalISVActualMes,
    totalISVSugeridoMes,
    ahorroFiscalTotalMes,
    porcentajeEficienciaFiscal,
    conteoTotalProyectos,
    conteoOptimizables,
    conteoYaOptimos,
  };
}

/**
 * Genera un informe en PDF formal con el Plan de Optimización Fiscal Mensual
 * y dictamen tributario conforme a la Ley del ISV de Honduras y SAR.
 */
export async function generarReporteOptimizaciónFiscalPDF(
  analisis: AnalisisFiscalMensualResultado,
  moneda: Moneda = 'LPS'
): Promise<{ blob: Blob; nombreArchivo: string; urlDrive?: string }> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const fechaStr = new Date().toLocaleDateString('es-HN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Cabecera institucional
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('SUMMIT IMPULSA GLOBAL — CENTRO DE REPORTES FISCALES', 14, 9.5);

  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('Summit Impulsa S. de R.L. • RTN: 05019026435770 • San Pedro Sula, Cortés, Honduras', 14, 15);
  doc.text(`INFORME DE ESTRATEGIA TRIBUTARIA Y OPTIMIZACIÓN FISCAL • PERIODO: ${analisis.etiquetaMes.toUpperCase()}`, 14, 20);
  doc.text(`Fecha de emisión: ${fechaStr}`, 220, 20);

  // Cuadro de Resumen Ejecutivo
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('1. DICTAMEN EJECUTIVO DE IMPACTO TRIBUTARIO MENSUAL', 14, 32);

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 35, 269, 22, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);

  doc.text('Volumen Ingresos Proyectados:', 18, 41);
  doc.text('Carga ISV Actual (SAR 15%):', 82, 41);
  doc.text('Carga ISV Optimizada Legal:', 148, 41);
  doc.text('Ahorro Impositivo Estimado:', 214, 41);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatearMoneda(analisis.totalIngresosMes, moneda), 18, 48);

  doc.setTextColor(225, 29, 72); // rose-600
  doc.text(formatearMoneda(analisis.totalISVActualMes, moneda), 82, 48);

  doc.setTextColor(37, 99, 235); // blue-600
  doc.text(formatearMoneda(analisis.totalISVSugeridoMes, moneda), 148, 48);

  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text(`${formatearMoneda(analisis.ahorroFiscalTotalMes, moneda)} (${analisis.porcentajeEficienciaFiscal.toFixed(1)}% optimizado)`, 214, 48);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Programas Evaluados: ${analisis.conteoTotalProyectos} | Oportunidades de Reclasificación Legal: ${analisis.conteoOptimizables} | Programas en Régimen Óptimo: ${analisis.conteoYaOptimos}`,
    18,
    53
  );

  // Tabla con detalles
  const tableData = analisis.sugerencias.map((s) => [
    s.codigoPrograma,
    s.nombreProyecto.slice(0, 32),
    s.tipoProyecto,
    `${s.horasClase}h`,
    formatearMoneda(s.volumenIngresosTotal, moneda),
    s.servicioFiscalActual.replace(' (ej. convenios universitarios)', '').replace(' (talleres, cursos libres)', ''),
    s.gravaISVActual ? '15%' : '0% (Exento)',
    s.servicioFiscalSugerido.replace(' (ej. convenios universitarios)', '').replace(' (talleres, cursos libres)', ''),
    s.gravaISVSugerido ? '15%' : '0% (Exento)',
    formatearMoneda(s.ahorroFiscalEstimado, moneda),
    s.esYaOptimo ? 'Óptimo' : 'Sugerido'
  ]);

  autoTable(doc, {
    startY: 61,
    head: [[
      'Cód.',
      'Programa / Curso',
      'Tipo',
      'Horas',
      'Ingresos',
      'Servicio Actual',
      'ISV Act.',
      'Servicio Sugerido (SAR)',
      'ISV Sug.',
      'Ahorro',
      'Estado'
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 6.8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 46 },
      2: { cellWidth: 20 },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 24, halign: 'right' },
      5: { cellWidth: 38 },
      6: { cellWidth: 16, halign: 'center' },
      7: { cellWidth: 40 },
      8: { cellWidth: 16, halign: 'center' },
      9: { cellWidth: 22, halign: 'right' },
      10: { cellWidth: 20, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        if (data.column.index === 9 && data.cell.raw !== '0' && !String(data.cell.raw).includes('0.00')) {
          data.cell.styles.textColor = [5, 150, 105];
          data.cell.styles.fontStyle = 'bold';
        }
        if (data.column.index === 10) {
          if (data.cell.raw === 'Óptimo') {
            data.cell.styles.textColor = [37, 99, 235];
          } else {
            data.cell.styles.textColor = [225, 29, 72];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    }
  });

  // Fundamento Jurídico en Pie de Página
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 170;
  if (finalY < 185) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('FUNDAMENTACIÓN JURÍDICO-TRIBUTARIA (SAR HONDURAS):', 14, finalY);

    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(
      '• Art. 15 numeral 1 de la Ley del ISV: Exención formal para servicios de educación formal y convenios de extensión académica universitaria.',
      14,
      finalY + 5
    );
    doc.text(
      '• Art. 11 y 22 Ley del ISR: Deducción completa del gasto corporativo en consultorías y capacitaciones empresariales con retención docente Art. 50 (12.5%).',
      14,
      finalY + 9
    );
  }

  // Pie de página institucional en todas las páginas
  const totalPaginas = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `SUMMIT IMPULSA GLOBAL • Summit Impulsa S. de R.L. (RTN: 05019026435770, San Pedro Sula, Cortés) • Dictamen Fiscal SAR • Emisión: ${fechaStr}`,
      14,
      pageHeight - 4.5
    );
    doc.text(`Página ${i} de ${totalPaginas}`, pageWidth - 14, pageHeight - 4.5, { align: 'right' });
  }

  const nombreArchivo = `Dictamen_Fiscal_Mensual_${analisis.mesSeleccionado}_${Date.now()}.pdf`;
  const pdfBlob = doc.output('blob');

  // Intentar guardar en Google Drive si está conectado
  let urlDrive: string | undefined;
  try {
    const uploadRes = await subirReporteADrive({
      titulo: `Dictamen de Optimización Fiscal Mensual - ${analisis.etiquetaMes}`,
      gerencia: 'Auditoría Interna',
      formato: 'PDF',
      nombreArchivo,
      contenido: pdfBlob,
      mimeType: 'application/pdf',
    });
    if (uploadRes.success && uploadRes.driveUrl) {
      urlDrive = uploadRes.driveUrl;
    }
  } catch (err) {
    console.warn('No se pudo respaldar en Drive automáticamente:', err);
  }

  // Descarga local
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return { blob: pdfBlob, nombreArchivo, urlDrive };
}

/**
 * Exporta la matriz de análisis fiscal a hoja de cálculo Excel (.xlsx)
 */
export async function generarReporteOptimizaciónFiscalExcel(
  analisis: AnalisisFiscalMensualResultado,
  moneda: Moneda = 'LPS'
): Promise<{ nombreArchivo: string; urlDrive?: string }> {
  const data = analisis.sugerencias.map((s) => ({
    'Código': s.codigoPrograma,
    'Programa Educativo': s.nombreProyecto,
    'Tipo de Proyecto': s.tipoProyecto,
    'Docente': s.nombreDocente,
    'Mes Asignado': s.mesClave,
    'Horas': s.horasClase,
    'Alumnos': s.alumnosBase,
    'Precio Unitario': s.precioSugeridoAlumno,
    'Volumen Ingresos': s.volumenIngresosTotal,
    'Servicio Fiscal Actual': s.servicioFiscalActual,
    'Grava ISV Actual': s.gravaISVActual ? 'SÍ (15%)' : 'EXENTO (0%)',
    'ISV Actual': s.montoISVActual,
    'Servicio Fiscal Sugerido (SAR)': s.servicioFiscalSugerido,
    'Grava ISV Sugerido': s.gravaISVSugerido ? 'SÍ (15%)' : 'EXENTO (0%)',
    'ISV Sugerido': s.montoISVSugerido,
    'Ahorro Fiscal Estimado': s.ahorroFiscalEstimado,
    'Incremento Margen (%)': Number(s.incrementoMargenEstimado.toFixed(2)),
    'Estado': s.esYaOptimo ? 'Óptimo' : 'Requiere Ajuste',
    'Justificación Legal / Técnica': s.justificacionTecnica,
    'Fundamento Legal SAR': s.fundamentoLegalSAR,
    'Recomendación Operativa': s.recomendacionOperativa,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Optimizacion_Fiscal_SAR');

  const nombreArchivo = `Matriz_Optimizacion_Fiscal_${analisis.mesSeleccionado}_${Date.now()}.xlsx`;
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  let urlDrive: string | undefined;
  try {
    const uploadRes = await subirReporteADrive({
      titulo: `Matriz de Optimización Fiscal Mensual - ${analisis.etiquetaMes}`,
      gerencia: 'Auditoría Interna',
      formato: 'EXCEL',
      nombreArchivo,
      contenido: blob,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    if (uploadRes.success && uploadRes.driveUrl) {
      urlDrive = uploadRes.driveUrl;
    }
  } catch (err) {
    console.warn('No se pudo respaldar en Drive automáticamente:', err);
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

  return { nombreArchivo, urlDrive };
}
