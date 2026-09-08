import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProyectoEducativo, Moneda } from '../types';
import { formatearMoneda } from './calculations';
import { 
  obtenerClaveMesProyecto, 
  formatearEtiquetaMes, 
  formatearEtiquetaCortaMes 
} from './monthUtils';
import { subirReporteADrive } from '../services/googleDriveService';

export interface ParametrosReporteMensualPDF {
  mesKey: string; // Formato 'YYYY-MM', ej: '2026-08'
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  incluirGraficos?: boolean;
  comentariosPersonalizados?: string;
  autorizadoPor?: string;
  guardarEnDrive?: boolean;
  onProgreso?: (mensaje: string) => void;
}

export interface ResultadoExportacionMensualPDF {
  success: boolean;
  nombreArchivo: string;
  mesKey: string;
  etiquetaMes: string;
  totalProyectos: number;
  totalIngresos: number;
  totalGastos: number;
  totalGanancias: number;
  margenPromedio: number;
  guardadoEnDrive: boolean;
  driveUrl?: string;
  mensajeDrive?: string;
  error?: string;
}

/**
 * Función oficial de exportación de reporte consolidado en PDF para un mes específico.
 * Incluye:
 * 1. Resumen ejecutivo con KPIs de ingresos, gastos, utilidades y márgenes.
 * 2. Gráficos vectoriales de rentabilidad (distribución por proyecto, estructura de costos y cumplimiento de matrícula).
 * 3. Lista completa de proyectos con sus márgenes individuales y semáforos de rendimiento.
 * 4. Desglose detallado de gastos operativos y carga pedagógica docente.
 * 5. Liquidación fiscal SAR Honduras (ISV 15% y retenciones).
 * 6. Bloque de firmas multi-gerenciales y respaldo automático en Google Drive.
 */
export async function exportarReporteMensualConsolidadoPDF(
  params: ParametrosReporteMensualPDF
): Promise<ResultadoExportacionMensualPDF> {
  const {
    mesKey,
    proyectos,
    moneda,
    incluirGraficos = true,
    comentariosPersonalizados,
    autorizadoPor = 'Dirección General & Finanzas',
    guardarEnDrive = true,
    onProgreso,
  } = params;

  onProgreso?.(`Preparando datos consolidados para ${formatearEtiquetaMes(mesKey)}...`);

  // 1. Filtrar proyectos pertenecientes al mes especificado
  const proyectosMes = proyectos.filter((p) => obtenerClaveMesProyecto(p) === mesKey);
  const etiquetaMes = formatearEtiquetaMes(mesKey);
  const etiquetaCorta = formatearEtiquetaCortaMes(mesKey);

  if (proyectosMes.length === 0) {
    throw new Error(`No se encontraron proyectos registrados para el mes ${etiquetaMes} (${mesKey}).`);
  }

  // 2. Cálculos consolidados y KPIs
  const totalProyectos = proyectosMes.length;
  const proyectosRealizados = proyectosMes.filter((p) => p.seLlevoACabo === 'Sí').length;
  const proyectosEnCurso = proyectosMes.filter((p) => p.seLlevoACabo === 'En curso').length;
  const proyectosPlanificados = proyectosMes.filter((p) => p.seLlevoACabo === 'Planificado').length;
  const proyectosCancelados = proyectosMes.filter((p) => p.seLlevoACabo === 'Cancelado' || p.seLlevoACabo === 'No').length;

  const totalHorasClase = proyectosMes.reduce((acc, p) => acc + (p.horasClase || 0), 0);
  const totalCostoDocente = proyectosMes.reduce((acc, p) => acc + (p.costoDocenteCalculado || 0), 0);
  const totalCostoZoom = proyectosMes.reduce((acc, p) => acc + (p.costoZoom || 0), 0);
  const totalCostoPapeleria = proyectosMes.reduce((acc, p) => acc + (p.costoPapeleria || 0), 0);
  const totalGastosVarios = proyectosMes.reduce((acc, p) => acc + (p.gastosVarios || 0), 0);
  const gastoTotalOperativo = proyectosMes.reduce((acc, p) => acc + (p.gastoTotalOperativo || 0), 0);

  const ingresoRealTotal = proyectosMes.reduce((acc, p) => acc + (p.ingresoRealTotal || 0), 0);
  const totalGananciasFinales = proyectosMes.reduce((acc, p) => acc + (p.totalGananciasFinales || 0), 0);
  const gananciaOperativaBase = proyectosMes.reduce((acc, p) => acc + (p.gananciaOperativa || 0), 0);

  const alumnosProyectados = proyectosMes.reduce((acc, p) => acc + (p.alumnosProyectados || 0), 0);
  const alumnosReales = proyectosMes.reduce((acc, p) => acc + (p.alumnosFinal || 0), 0);
  const diferenciaAlumnos = alumnosReales - alumnosProyectados;
  const tasaCumplimientoMatricula = alumnosProyectados > 0 
    ? (alumnosReales / alumnosProyectados) * 100 
    : 0;

  // Márgenes consolidados
  const margenOperativoConsolidado = gastoTotalOperativo > 0 
    ? (totalGananciasFinales / gastoTotalOperativo) * 100 
    : 0;
  const margenSobreVentaConsolidado = ingresoRealTotal > 0 
    ? (totalGananciasFinales / ingresoRealTotal) * 100 
    : 0;

  const ticketPromedio = alumnosReales > 0 ? ingresoRealTotal / alumnosReales : 0;
  const pctGastoDocente = gastoTotalOperativo > 0 
    ? Math.round((totalCostoDocente / gastoTotalOperativo) * 100) 
    : 0;
  const tarifaDocentePromedioPonderada = totalHorasClase > 0 
    ? totalCostoDocente / totalHorasClase 
    : 0;

  // Fiscal SAR
  const totalISVTrasladarSAR = proyectosMes.reduce((acc, p) => acc + (p.isvTotalTrasladarSAR || 0), 0);
  const retencionISVDocente = totalCostoDocente * 0.15;
  const honorariosDocentesNetos = totalCostoDocente - retencionISVDocente;

  // Proyecto más rentable del mes
  const proyectoEstrella = [...proyectosMes].sort((a, b) => (b.totalGananciasFinales || 0) - (a.totalGananciasFinales || 0))[0];

  onProgreso?.('Generando diseño vectorial y gráficos en PDF...');

  // 3. Inicializar documento jsPDF
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Función auxiliar para dibujar encabezado institucional superior
  const dibujarEncabezadoPagina = (esPrimeraPagina: boolean) => {
    // Franja azul marino oscuro (Slate 950)
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, esPrimeraPagina ? 25 : 14, 'F');

    // Línea de acento dorado / azul eléctrico
    doc.setFillColor(37, 99, 235);
    doc.rect(0, esPrimeraPagina ? 25 : 14, pageWidth, 2, 'F');

    if (esPrimeraPagina) {
      // Logotipo y Marca
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
      doc.text(`INFORME EJECUTIVO CONSOLIDADO • CIERRE MENSUAL DE RENTABILIDAD`, margin, 20.5);

      // Metadatos lado derecho
      const fechaHoy = new Date().toLocaleDateString('es-HN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(56, 189, 248); // Sky 400
      doc.text(`MES: ${etiquetaMes.toUpperCase()}`, pageWidth - margin, 10, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(226, 232, 240);
      doc.text(`Emisión: ${fechaHoy} | Moneda: ${moneda}`, pageWidth - margin, 15.5, { align: 'right' });
      doc.text(`Programas Evaluados: ${totalProyectos} cursos / cohortes`, pageWidth - margin, 20.5, { align: 'right' });
    } else {
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(`SUMMIT IMPULSA GLOBAL • CIERRE MENSUAL ${etiquetaMes.toUpperCase()}`, margin, 9.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(191, 219, 254);
      doc.text(`Moneda: ${moneda} | ${totalProyectos} Proyectos`, pageWidth - margin, 9.5, { align: 'right' });
    }
  };

  // --- PÁGINA 1: ENCABEZADO, RESUMEN EJECUTIVO & GRÁFICOS DE RENTABILIDAD ---
  dibujarEncabezadoPagina(true);

  let y = 32;

  // 4. TARJETA INFORMATIVA DEL MES CON METADATOS CLAVE
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Evaluación Consolidada de Rentabilidad: ${etiquetaMes}`, margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Estatus de Ejecución: ${proyectosRealizados} Realizados • ${proyectosEnCurso} En curso • ${proyectosPlanificados} Planificados • ${proyectosCancelados} Cancelados`,
    margin + 4,
    y + 11
  );

  doc.text(
    `Matrícula Estudiantil: ${alumnosReales} alumnos inscritos vs ${alumnosProyectados} proyectados (${tasaCumplimientoMatricula.toFixed(1)}% meta) • Horas Clase Totales: ${totalHorasClase}h`,
    margin + 4,
    y + 15
  );

  y += 22;

  // 5. BLOQUE DE 4 TARJETAS KPIS FINANCIEROS (RESUMEN EJECUTIVO)
  const boxW = (contentWidth - 9) / 4;
  const boxH = 19;

  const kpis = [
    {
      label: 'VENTAS REALES TOTALES',
      valor: formatearMoneda(ingresoRealTotal, moneda),
      sub: `Ticket Prom: ${formatearMoneda(ticketPromedio, moneda)}`,
      bgColor: [239, 246, 255], // Blue 50
      borderColor: [191, 219, 254], // Blue 200
      textColor: [30, 58, 138], // Blue 900
    },
    {
      label: 'GASTO OPERATIVO TOTAL',
      valor: formatearMoneda(gastoTotalOperativo, moneda),
      sub: `Nómina Docente: ${pctGastoDocente}%`,
      bgColor: [254, 242, 242], // Rose 50
      borderColor: [254, 205, 211], // Rose 200
      textColor: [159, 18, 57], // Rose 900
    },
    {
      label: 'UTILIDAD NETA FINAL',
      valor: formatearMoneda(totalGananciasFinales, moneda),
      sub: totalGananciasFinales >= 0 ? 'Superávit Operativo' : 'Déficit Operativo',
      bgColor: totalGananciasFinales >= 0 ? [236, 253, 245] : [255, 241, 242], // Emerald 50 o Rose 50
      borderColor: totalGananciasFinales >= 0 ? [167, 243, 208] : [254, 205, 211],
      textColor: totalGananciasFinales >= 0 ? [6, 95, 70] : [159, 18, 57],
    },
    {
      label: 'MARGEN OPERATIVO %',
      valor: `${margenOperativoConsolidado.toFixed(1)}%`,
      sub: `${margenSobreVentaConsolidado.toFixed(1)}% margen s/ venta`,
      bgColor: [240, 253, 250], // Teal 50
      borderColor: [153, 246, 228], // Teal 200
      textColor: [17, 94, 89], // Teal 900
    },
  ];

  kpis.forEach((kpi, idx) => {
    const kpiX = margin + idx * (boxW + 3);
    doc.setFillColor(kpi.bgColor[0], kpi.bgColor[1], kpi.bgColor[2]);
    doc.setDrawColor(kpi.borderColor[0], kpi.borderColor[1], kpi.borderColor[2]);
    doc.roundedRect(kpiX, y, boxW, boxH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, kpiX + 3.5, y + 4.5);

    doc.setFontSize(10.5);
    doc.setTextColor(kpi.textColor[0], kpi.textColor[1], kpi.textColor[2]);
    doc.text(kpi.valor, kpiX + 3.5, y + 11.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(kpi.sub, kpiX + 3.5, y + 16);
  });

  y += boxH + 6;

  // 6. GRÁFICOS VECTORIALES DE RENTABILIDAD
  if (incluirGraficos) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Gráficos de Rentabilidad, Estructura de Costos y Matrícula', margin, y);

    y += 4;

    // --- GRÁFICO 1: BARRAS HORIZONTALES DE RENTABILIDAD POR PROYECTO ---
    // Marco contenedor
    const chartHeight = Math.min(68, 14 + Math.min(6, totalProyectos) * 8.5);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, chartHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(30, 41, 59);
    doc.text('Distribución de Margen Operativo (%) por Programa', margin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Verde: ≥40% (Alto) • Azul: 25-39% • Ámbar: 10-24% • Rojo: <10%', pageWidth - margin - 4, y + 5, { align: 'right' });

    let barY = y + 9;
    // Mostrar hasta los 6 proyectos principales o todos si son <= 6
    const proyectosGrafico = [...proyectosMes]
      .sort((a, b) => (b.margenGananciaOperativa || 0) - (a.margenGananciaOperativa || 0))
      .slice(0, 6);

    const maxMargen = Math.max(50, ...proyectosGrafico.map(p => Math.abs(p.margenGananciaOperativa || 0)));
    const barMaxWidth = 88; // mm para la barra gráfica

    proyectosGrafico.forEach((p) => {
      const nombreCorto = p.nombreProyecto.length > 28 ? p.nombreProyecto.slice(0, 26) + '...' : p.nombreProyecto;
      const margenVal = p.margenGananciaOperativa || 0;
      const anchoBarra = Math.max(3, Math.min(barMaxWidth, (Math.abs(margenVal) / maxMargen) * barMaxWidth));

      // Nombre del proyecto
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(30, 41, 59);
      doc.text(nombreCorto, margin + 4, barY + 3.8);

      // Color de barra según semáforo
      let r = 16, g = 185, b = 129; // Emerald (≥40%)
      if (margenVal < 10) {
        r = 225; g = 29; b = 72; // Rose
      } else if (margenVal < 25) {
        r = 217; g = 119; b = 6; // Amber
      } else if (margenVal < 40) {
        r = 37; g = 99; b = 235; // Blue
      }

      const barStartX = margin + 52;

      // Barra de fondo gris tenue
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(barStartX, barY, barMaxWidth, 4.5, 1, 1, 'F');

      // Barra de progreso colorida
      doc.setFillColor(r, g, b);
      doc.roundedRect(barStartX, barY, anchoBarra, 4.5, 1, 1, 'F');

      // Etiqueta porcentual
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(r, g, b);
      doc.text(`${margenVal > 0 ? '+' : ''}${margenVal.toFixed(1)}%`, barStartX + barMaxWidth + 2.5, barY + 3.5);

      // Ganancia neta lado derecho
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(6.5);
      doc.text(`Utilidad: ${formatearMoneda(p.totalGananciasFinales || 0, moneda)}`, pageWidth - margin - 4, barY + 3.5, { align: 'right' });

      barY += 7.2;
    });

    y += chartHeight + 4;

    // --- GRÁFICO 2: ESTRUCTURA PORCENTUAL DE GASTOS Y MARGEN NETO ---
    const estCostosH = 28;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, estCostosH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(30, 41, 59);
    doc.text('Estructura de Desembolso Operativo vs. Utilidad Neta del Mes', margin + 4, y + 5);

    // Calcular proporciones sobre el total de ventas (o sobre el gasto total)
    const baseCalculo = Math.max(1, gastoTotalOperativo + Math.max(0, totalGananciasFinales));
    const pctDocente = (totalCostoDocente / baseCalculo) * 100;
    const pctZoom = (totalCostoZoom / baseCalculo) * 100;
    const pctPapeleria = (totalCostoPapeleria / baseCalculo) * 100;
    const pctVarios = (totalGastosVarios / baseCalculo) * 100;
    const pctUtilidad = (Math.max(0, totalGananciasFinales) / baseCalculo) * 100;

    // Barra apilada segmentada
    const stackBarY = y + 8;
    const stackBarW = contentWidth - 8;
    const stackBarH = 6;
    let currX = margin + 4;

    const segmentos = [
      { pct: pctDocente, color: [30, 58, 138], label: 'Docente' },
      { pct: pctZoom, color: [79, 70, 229], label: 'Zoom' },
      { pct: pctPapeleria, color: [14, 165, 233], label: 'Papelería' },
      { pct: pctVarios, color: [245, 158, 11], label: 'Varios' },
      { pct: pctUtilidad, color: [16, 185, 129], label: 'Utilidad Neta' },
    ];

    segmentos.forEach((seg) => {
      const segW = Math.max(1.5, (seg.pct / 100) * stackBarW);
      doc.setFillColor(seg.color[0], seg.color[1], seg.color[2]);
      doc.rect(currX, stackBarY, segW, stackBarH, 'F');
      currX += segW;
    });

    // Leyenda descriptiva abajo de la barra
    let legY = y + 18.5;
    const legColW = stackBarW / 5;

    const itemsLeyenda = [
      { label: 'Nómina Docente', val: formatearMoneda(totalCostoDocente, moneda), pct: pctDocente, color: [30, 58, 138] },
      { label: 'Licencias Zoom', val: formatearMoneda(totalCostoZoom, moneda), pct: pctZoom, color: [79, 70, 229] },
      { label: 'Papelería & Mat.', val: formatearMoneda(totalCostoPapeleria, moneda), pct: pctPapeleria, color: [14, 165, 233] },
      { label: 'Gastos Varios', val: formatearMoneda(totalGastosVarios, moneda), pct: pctVarios, color: [245, 158, 11] },
      { label: 'Utilidad Neta', val: formatearMoneda(totalGananciasFinales, moneda), pct: pctUtilidad, color: [16, 185, 129] },
    ];

    itemsLeyenda.forEach((item, idx) => {
      const legX = margin + 4 + idx * legColW;
      doc.setFillColor(item.color[0], item.color[1], item.color[2]);
      doc.circle(legX + 1.5, legY - 1, 1.2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.2);
      doc.setTextColor(item.color[0], item.color[1], item.color[2]);
      doc.text(item.label, legX + 4, legY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      doc.setTextColor(71, 85, 105);
      doc.text(`${item.val} (${item.pct.toFixed(0)}%)`, legX + 4, legY + 4);
    });

    y += estCostosH + 4;
  }

  // 7. DICTAMEN ESTRATÉGICO GERENCIAL DEL MES
  const dictamenH = 34;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, dictamenH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(15, 23, 42);
  doc.text('Dictamen Ejecutivo y Diagnóstico Financiero del Mes', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(51, 65, 85);

  const textoDiagnostico1 = totalGananciasFinales >= 0
    ? `• Rentabilidad General: El mes concluye con un SUPERÁVIT NETO de ${formatearMoneda(totalGananciasFinales, moneda)}, alcanzando un margen operativo consolidado de ${margenOperativoConsolidado.toFixed(1)}% sobre costos directos.`
    : `• Control de Déficit: El mes registró un DÉFICIT de ${formatearMoneda(Math.abs(totalGananciasFinales), moneda)}. Se requiere ajuste en punto de equilibrio o revisión de cuotas de inscripción.`;

  const textoDiagnostico2 = proyectoEstrella
    ? `• Programa Líder: "${proyectoEstrella.nombreProyecto}" aportó la mayor utilidad neta con ${formatearMoneda(proyectoEstrella.totalGananciasFinales || 0, moneda)} (${proyectoEstrella.margenGananciaOperativa}% de margen).`
    : `• Cohortes en Ejecución: Se completaron ${proyectosRealizados} programas satisfactoriamente.`;

  const textoDiagnostico3 = `• Gestión Docente & Horas: Se impartieron ${totalHorasClase} horas académicas con una tarifa horaria promedio de ${formatearMoneda(tarifaDocentePromedioPonderada, moneda)}/h. La nómina docente representó el ${pctGastoDocente}% del costo operativo total.`;

  const textoDiagnostico4 = `• Matrícula y Ventas: Cumplimiento de inscripciones al ${tasaCumplimientoMatricula.toFixed(1)}% (${alumnosReales} matriculados frente a meta de ${alumnosProyectados}). Ticket promedio por alumno: ${formatearMoneda(ticketPromedio, moneda)}.`;

  doc.text(textoDiagnostico1, margin + 4, y + 10.5);
  doc.text(textoDiagnostico2, margin + 4, y + 15.5);
  doc.text(textoDiagnostico3, margin + 4, y + 20.5);
  doc.text(textoDiagnostico4, margin + 4, y + 25.5);

  if (comentariosPersonalizados) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.8);
    doc.setTextColor(37, 99, 235);
    doc.text(`Nota de Gerencia: ${comentariosPersonalizados}`, margin + 4, y + 30.5);
  }

  // --- PÁGINA 2: LISTA DE PROYECTOS CON SUS MÁRGENES & DETALLES TRIBUTARIOS ---
  doc.addPage();
  dibujarEncabezadoPagina(false);

  let y2 = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Matriz Consolidada de Proyectos y Programas del Mes', margin, y2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Detalle cohorte por cohorte con desglose de alumnos, costos, ventas y margen operativo`, margin, y2 + 4.5);

  y2 += 7;

  // Preparar datos para autoTable de proyectos
  const filasProyectos = proyectosMes.map((p, idx) => {
    const margenVal = p.margenGananciaOperativa || 0;
    const margenStr = `${margenVal > 0 ? '+' : ''}${margenVal.toFixed(1)}%`;
    const semaforo = margenVal >= 40 ? '● Alto' : margenVal >= 25 ? '● Bueno' : margenVal >= 10 ? '▲ Mínimo' : '✖ Riesgo';

    return [
      p.numeroCorrelativo || (idx + 1).toString(),
      p.nombreProyecto,
      p.nombreDocente || 'Por Asignar',
      `${p.tipoProyecto || 'CURSO'}\n(${p.nivel || 'Profesional'})`,
      `${p.alumnosFinal || 0} / ${p.alumnosProyectados || 0}`,
      formatearMoneda(p.gastoTotalOperativo || 0, moneda),
      formatearMoneda(p.ingresoRealTotal || 0, moneda),
      formatearMoneda(p.totalGananciasFinales || 0, moneda),
      `${margenStr}\n${semaforo}`,
      p.seLlevoACabo || 'En curso',
    ];
  });

  autoTable(doc, {
    startY: y2,
    margin: { left: margin, right: margin },
    head: [
      [
        'N°',
        'Proyecto Educativo / Cohorte',
        'Docente Asignado',
        'Tipo & Nivel',
        'Alumnos (Real/Meta)',
        'Gasto Total',
        'Ingreso Total',
        'Utilidad Neta',
        'Margen %',
        'Estado',
      ],
    ],
    body: filasProyectos,
    foot: [
      [
        'TOTALES',
        `${totalProyectos} Programas Consolidados`,
        `${totalHorasClase} hrs totales`,
        'Prom. Ponderado',
        `${alumnosReales} / ${alumnosProyectados} (${tasaCumplimientoMatricula.toFixed(0)}%)`,
        formatearMoneda(gastoTotalOperativo, moneda),
        formatearMoneda(ingresoRealTotal, moneda),
        formatearMoneda(totalGananciasFinales, moneda),
        `${margenOperativoConsolidado > 0 ? '+' : ''}${margenOperativoConsolidado.toFixed(1)}%`,
        proyectosRealizados === totalProyectos ? '100% Hechos' : `${proyectosRealizados} Hechos`,
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 6.8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 6.5,
      textColor: [51, 65, 85],
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontSize: 6.8,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 42, fontStyle: 'bold' },
      2: { cellWidth: 28 },
      3: { cellWidth: 18, halign: 'center', fontSize: 5.8 },
      4: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 18, halign: 'right' },
      6: { cellWidth: 18, halign: 'right' },
      7: { cellWidth: 18, halign: 'right', fontStyle: 'bold', textColor: totalGananciasFinales >= 0 ? [5, 150, 105] : [225, 29, 72] },
      8: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      9: { cellWidth: 16, halign: 'center', fontSize: 6 },
    },
  });

  let currentY = (doc as any).lastAutoTable.finalY + 6;

  // 8. CUADROS COMPACTOS DE CONTROL TRIBUTARIO SAR & DESGLOSE OPERATIVO
  // Si no cabe en esta página, saltar a una nueva
  if (currentY + 65 > pageHeight) {
    doc.addPage();
    dibujarEncabezadoPagina(false);
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Desglose Operativo & Liquidación Tributaria SAR Honduras', margin, currentY);

  currentY += 4;

  const colWidth = (contentWidth - 6) / 2;

  // Cuadro Izquierdo: Estructura de Gastos Directos
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, colWidth, 32, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Desglose de Costos Directos del Mes', margin + 3.5, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);

  const itemsCostos = [
    `• Honorarios Docentes: ${formatearMoneda(totalCostoDocente, moneda)} (${pctGastoDocente}%)`,
    `• Plataforma y Licencias Zoom: ${formatearMoneda(totalCostoZoom, moneda)}`,
    `• Material Didáctico y Papelería: ${formatearMoneda(totalCostoPapeleria, moneda)}`,
    `• Imprevistos y Gastos Varios: ${formatearMoneda(totalGastosVarios, moneda)}`,
  ];
  itemsCostos.forEach((item, i) => {
    doc.text(item, margin + 3.5, currentY + 10 + i * 4.5);
  });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Total Gasto Operativo: ${formatearMoneda(gastoTotalOperativo, moneda)}`, margin + 3.5, currentY + 29);

  // Cuadro Derecho: Tratamiento Fiscal SAR
  const fiscalX = margin + colWidth + 6;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(fiscalX, currentY, colWidth, 32, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 27, 75);
  doc.text('Control Fiscal SAR (ISV 15% & Retenciones)', fiscalX + 3.5, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);

  const itemsFiscal = [
    `• Facturación Bruta con ISV: ${formatearMoneda(ingresoRealTotal + totalISVTrasladarSAR, moneda)}`,
    `• ISV a Trasladar a SAR: ${formatearMoneda(totalISVTrasladarSAR, moneda)}`,
    `• Retención ISV Docentes (15%): ${formatearMoneda(retencionISVDocente, moneda)}`,
    `• Honorarios Líquidos Transferibles: ${formatearMoneda(honorariosDocentesNetos, moneda)}`,
  ];
  itemsFiscal.forEach((item, i) => {
    doc.text(item, fiscalX + 3.5, currentY + 10 + i * 4.5);
  });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9);
  doc.text(`Total Obligación SAR: ${formatearMoneda(totalISVTrasladarSAR + retencionISVDocente, moneda)}`, fiscalX + 3.5, currentY + 29);

  currentY += 38;

  // 9. BLOQUE OFICIAL DE APROBACIÓN Y FIRMAS MULTI-GERENCIALES
  if (currentY + 30 > pageHeight) {
    doc.addPage();
    dibujarEncabezadoPagina(false);
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Certificación y Firmas de Aprobación Multi-Gerencial', margin, currentY);

  currentY += 12;

  const firmaW = (contentWidth - 16) / 3;
  const f1X = margin;
  const f2X = margin + firmaW + 8;
  const f3X = margin + (firmaW + 8) * 2;

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(f1X, currentY, f1X + firmaW, currentY);
  doc.line(f2X, currentY, f2X + firmaW, currentY);
  doc.line(f3X, currentY, f3X + firmaW, currentY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(15, 23, 42);
  doc.text('Gerencia Académica (Phd. Donal Reyes)', f1X + firmaW / 2, currentY + 4, { align: 'center' });
  doc.text('Gerencia Comercial', f2X + firmaW / 2, currentY + 4, { align: 'center' });
  doc.text(autorizadoPor, f3X + firmaW / 2, currentY + 4, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  doc.text('Carga Docente & Syllabus Aprobados', f1X + firmaW / 2, currentY + 7.5, { align: 'center' });
  doc.text('Cumplimiento de Metas de Matrícula', f2X + firmaW / 2, currentY + 7.5, { align: 'center' });
  doc.text('Dictamen Financiero & Cumplimiento SAR', f3X + firmaW / 2, currentY + 7.5, { align: 'center' });

  // 10. PIE DE PÁGINA NUMERADO EN TODAS LAS PÁGINAS
  const totalPaginas = doc.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Generado el ${new Date().toLocaleString('es-HN')} • Summit Impulsa S. de R.L. (RTN: 05019026435770, San Pedro Sula, Cortés) • Matriz de Rentabilidad`,
      margin,
      pageHeight - 6
    );
    doc.text(`Página ${i} de ${totalPaginas}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  // 11. DESCARGA EN NAVEGADOR & RESPALDO AUTOMÁTICO EN GOOGLE DRIVE
  const mesLimpio = mesKey.replace(/[^0-9-]/g, '');
  const nombreArchivo = `Reporte_Consolidado_${etiquetaCorta.replace(/\s+/g, '_').toUpperCase()}_${mesLimpio}_${moneda}.pdf`;

  onProgreso?.('Descargando archivo PDF en el navegador...');

  // Disparar descarga local en el navegador
  doc.save(nombreArchivo);

  let guardadoEnDrive = false;
  let driveUrl: string | undefined;
  let mensajeDrive: string | undefined;

  // Respaldo en Google Drive si está configurado
  if (guardarEnDrive) {
    try {
      onProgreso?.('Sincronizando respaldo automático en Google Drive...');
      const blob = doc.output('blob');
      const driveRes = await subirReporteADrive({
        titulo: `Reporte Consolidado Mensual - ${etiquetaMes}`,
        gerencia: 'Gerencia General',
        formato: 'PDF',
        nombreArchivo,
        contenido: blob,
        mimeType: 'application/pdf',
      });

      if (driveRes.success) {
        guardadoEnDrive = true;
        driveUrl = driveRes.driveUrl;
        mensajeDrive = 'Copia de seguridad guardada exitosamente en Google Drive.';
      } else {
        mensajeDrive = driveRes.error || 'Google Drive no sincronizó el respaldo.';
      }
    } catch (err: any) {
      console.warn('Error en respaldo de reporte mensual a Drive:', err);
      mensajeDrive = `No se pudo respaldar en Drive: ${err.message || 'Error de conexión'}.`;
    }
  }

  return {
    success: true,
    nombreArchivo,
    mesKey,
    etiquetaMes,
    totalProyectos,
    totalIngresos: ingresoRealTotal,
    totalGastos: gastoTotalOperativo,
    totalGanancias: totalGananciasFinales,
    margenPromedio: margenOperativoConsolidado,
    guardadoEnDrive,
    driveUrl,
    mensajeDrive,
  };
}
