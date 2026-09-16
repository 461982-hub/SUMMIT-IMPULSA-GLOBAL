import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  agregarEncabezadoOficialPDF, 
  agregarPieDePaginaOficialPDF, 
  dibujarEscudoSummitJsPDF, 
  SUMMIT_BRANDING 
} from './brandingUtils';
import { DocenteBanco } from './docenteDirectoryUtils';
import { NivelProyecto, TipoProyecto } from '../types';

export interface DatosGeneracionSilabo {
  nombreProyecto: string;
  codigoPrograma?: string;
  codigoFiscalSAR?: string;
  correlativoSAR?: string;
  tipoProyecto?: TipoProyecto | string;
  nivel?: NivelProyecto;
  cantidadTemas?: number;
  horasClasePorTema?: number;
  totalHorasCurso: number;
  metodologia: string;
  objetivoGeneral?: string;
  temasImpartir?: string;
  modalidad?: string;
  horario?: string;
  diasClase?: string;
  rubricaEvaluacion?: {
    proyectoFinalPct?: number;
    talleresPracticosPct?: number;
    participacionAsistenciaPct?: number;
    examenFinalPct?: number;
    notaMinimaAprobacion?: number;
    asistenciaMinimaPct?: number;
  };
  docente?: {
    nombre: string;
    titulo?: string;
    especialidad?: string;
    email?: string;
    telefono?: string;
    tarifaHoraSugerida?: number;
    biografia?: string;
    estadoSAR?: string;
  };
}

export interface ResultadoGeneracionSilabo {
  nombreArchivo: string;
  dataUrl: string;
  tamanoKb: number;
  fechaCarga: string;
}

/**
 * Valida si los requisitos mínimos para generar el Sílabo Oficial están cumplidos
 */
export function validarRequisitosSilabo(datos: Partial<DatosGeneracionSilabo>): {
  completo: boolean;
  faltantes: string[];
} {
  const faltantes: string[] = [];

  if (!datos.nombreProyecto || datos.nombreProyecto.trim().length < 3) {
    faltantes.push('Nombre del Proyecto / Programa Formativo');
  }

  if (!datos.docente?.nombre || datos.docente.nombre.trim().length < 2) {
    faltantes.push('Docente Titular Asignado (Selección de Banco o Registro)');
  }

  if (!datos.totalHorasCurso || datos.totalHorasCurso <= 0) {
    faltantes.push('Total de Horas de Clase (definir temas y horas por tema)');
  }

  if (!datos.metodologia || datos.metodologia.trim().length < 4) {
    faltantes.push('Metodología Pedagógica a Implementar');
  }

  return {
    completo: faltantes.length === 0,
    faltantes,
  };
}

/**
 * Genera el documento oficial de Sílabo Curricular en formato PDF con la identidad de Summit Impulsa Global.
 */
export function generarSilaboPdfOficial(datos: DatosGeneracionSilabo, autoDescargar: boolean = false): ResultadoGeneracionSilabo {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const codigoDoc = datos.codigoPrograma || datos.codigoFiscalSAR || datos.correlativoSAR || `SIL-2026-${Date.now().toString().slice(-4)}`;
  const nombreLimpio = datos.nombreProyecto.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
  const nombreArchivo = `Silabo_Oficial_${nombreLimpio || 'Programa'}.pdf`;

  const margin = 14;
  const pageWidth = 210;
  const contentWidth = pageWidth - margin * 2;

  // 1. ENCABEZADO OFICIAL DE PÁGINA 1
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 26, 'F');
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 26, 210, 2, 'F');

  // Escudo oficial vectorial
  dibujarEscudoSummitJsPDF(doc, 20, 13, 8.5);

  // Títulos
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('SUMMIT IMPULSA GLOBAL', 32, 10.5);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(191, 219, 254);
  doc.text('Summit Impulsa S. de R.L. • RTN: 05019026435770 • San Pedro Sula, Cortés, Honduras', 32, 15.5);
  doc.text('DIRECCIÓN ACADÉMICA & CALIDAD CURRICULAR • SÍLABO OFICIAL', 32, 20.5);

  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.text(`CÓD: ${codigoDoc}`, 196, 11, { align: 'right' });
  doc.text(`Emisión: ${new Date().toLocaleDateString('es-HN')}`, 196, 16.5, { align: 'right' });
  doc.text(`Versión: 2026.1`, 196, 21, { align: 'right' });

  let currentY = 34;

  // Banner del Nombre del Programa
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(margin, currentY, contentWidth, 14, 2, 2, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const tituloTruncado = doc.splitTextToSize(datos.nombreProyecto.toUpperCase(), contentWidth - 8);
  doc.text(tituloTruncado[0] || datos.nombreProyecto.toUpperCase(), margin + 4, currentY + 9);

  currentY += 18;

  // 2. FICHA TÉCNICA DEL PROGRAMA FORMATIVO (AutoTable)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('1. FICHA TÉCNICA DEL PROGRAMA FORMATIVO', margin, currentY);
  currentY += 3;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'left',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    body: [
      [
        { content: 'Código Oficial:', styles: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 35 } },
        { content: codigoDoc },
        { content: 'Nivel Académico:', styles: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 35 } },
        { content: datos.nivel || 'Básico' },
      ],
      [
        { content: 'Tipo de Programa:', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: datos.tipoProyecto || 'Capacitación Profesional' },
        { content: 'Modalidad:', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: datos.modalidad || 'Presencial / Sincrónica' },
      ],
      [
        { content: 'Carga Horaria Total:', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: `${datos.totalHorasCurso} Horas de Clase Teórico-Prácticas` },
        { content: 'Estructura Temática:', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: `${datos.cantidadTemas || 4} Módulos / Temas (${datos.horasClasePorTema || 3} hrs c/u)` },
      ],
      [
        { content: 'Horario Programado:', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: datos.horario || 'Conforme a calendario oficial' },
        { content: 'Días de Impartición:', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: datos.diasClase || 'Sesiones programadas en cronograma' },
      ],
    ],
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // 3. DATOS DEL DOCENTE TITULAR
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('2. PERFIL DEL DOCENTE TITULAR', margin, currentY);
  currentY += 3;

  const docData = datos.docente || {
    nombre: 'Por Asignar',
    titulo: 'Instructor Certificado',
    especialidad: 'Especialista en la Materia',
    email: 'contacto@summitimpulsa.hn',
    telefono: 'N/D',
  };

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    body: [
      [
        { content: 'Docente Titular:', styles: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 35 } },
        { content: docData.nombre, styles: { fontStyle: 'bold', textColor: [30, 58, 138] } },
        { content: 'Grado / Título:', styles: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 35 } },
        { content: docData.titulo || 'Especialista' },
      ],
      [
        { content: 'Especialidad Principal:', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: docData.especialidad || 'Capacitación Profesional' },
        { content: 'Contacto Oficial:', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: `${docData.email || 'N/D'} • Tel: ${docData.telefono || 'N/D'}` },
      ],
      [
        { content: 'Reseña Curricular:', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { 
          colSpan: 3, 
          content: docData.biografia || 'Profesional con probada trayectoria técnica y docente en el sector corporativo e institucional.' 
        },
      ],
    ],
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // 4. OBJETIVO GENERAL DE APRENDIZAJE
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('3. OBJETIVO GENERAL DE APRENDIZAJE', margin, currentY);
  currentY += 3;

  const objetivoTexto = datos.objetivoGeneral && datos.objetivoGeneral.trim().length > 10
    ? datos.objetivoGeneral
    : `Desarrollar en los participantes las competencias técnico-prácticas fundamentales de ${datos.nombreProyecto}, capacitándolos para aplicar métodos, herramientas y estándares profesionales con alto nivel de desempeño en su entorno laboral.`;

  doc.setFillColor(248, 250, 252);
  doc.rect(margin, currentY, contentWidth, 14, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, currentY, contentWidth, 14, 'S');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const lineasObjetivo = doc.splitTextToSize(objetivoTexto, contentWidth - 6);
  doc.text(lineasObjetivo, margin + 3, currentY + 4.5);

  currentY += 18;

  // 5. CONTENIDO TEMÁTICO / PROGRAMÁTICO
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('4. CONTENIDO PROGRAMÁTICO & MÓDULOS DE APRENDIZAJE', margin, currentY);
  currentY += 3;

  // Parsear temas si vienen en texto con saltos de línea
  let filasTemas: Array<[string, string, string]> = [];
  if (datos.temasImpartir && datos.temasImpartir.trim().length > 0) {
    const lineas = datos.temasImpartir.split('\n').map(l => l.trim()).filter(Boolean);
    filasTemas = lineas.map((linea, idx) => {
      const numModulo = `Módulo ${idx + 1}`;
      return [numModulo, linea, `${datos.horasClasePorTema || 3} Horas`];
    });
  }

  if (filasTemas.length === 0) {
    const cant = datos.cantidadTemas || 4;
    for (let i = 1; i <= cant; i++) {
      filasTemas.push([
        `Módulo ${i}`,
        `Unidad Temática ${i}: Competencias aplicadas y análisis de casos prácticos`,
        `${datos.horasClasePorTema || 3} Horas`,
      ]);
    }
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235], // blue-600
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    head: [['Módulo', 'Descripción Temática y Competencias a Desarrollar', 'Duración']],
    body: filasTemas,
    columnStyles: {
      0: { cellWidth: 25, fontStyle: 'bold', halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 25, fontStyle: 'bold', halign: 'center' },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // Salto de página si queda poco espacio para la metodología y rúbrica
  if (currentY > 215) {
    doc.addPage();
    // Encabezado de página secundaria
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 14, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`SUMMIT IMPULSA GLOBAL • SÍLABO: ${datos.nombreProyecto.toUpperCase().slice(0, 45)}`, 14, 9);
    doc.setFontSize(7.5);
    doc.text(`CÓD: ${codigoDoc}`, 196, 9, { align: 'right' });
    currentY = 22;
  }

  // 6. METODOLOGÍA PEDAGÓGICA
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('5. METODOLOGÍA PEDAGÓGICA Y ESTRATEGIA DE ENSEÑANZA', margin, currentY);
  currentY += 3;

  doc.setFillColor(248, 250, 252);
  doc.rect(margin, currentY, contentWidth, 13, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, currentY, contentWidth, 13, 'S');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const metTexto = datos.metodologia || 'Aprendizaje Basado en Proyectos (ABP) con sesiones interactivas, resolución de casos y evaluación formativa continua.';
  const lineasMet = doc.splitTextToSize(metTexto, contentWidth - 6);
  doc.text(lineasMet, margin + 3, currentY + 4.5);

  currentY += 17;

  // 7. SISTEMA DE EVALUACIÓN Y RÚBRICA ACADÉMICA
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('6. SISTEMA DE EVALUACIÓN Y CRITERIOS DE APROBACIÓN', margin, currentY);
  currentY += 3;

  const rubrica = datos.rubricaEvaluacion || {
    proyectoFinalPct: 40,
    talleresPracticosPct: 35,
    participacionAsistenciaPct: 15,
    examenFinalPct: 10,
    notaMinimaAprobacion: 75,
    asistenciaMinimaPct: 80,
  };

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    head: [['Criterio de Evaluación', 'Ponderación', 'Descripción / Evidencia']],
    body: [
      ['Proyecto Integrador / Caso Real', `${rubrica.proyectoFinalPct ?? 40}%`, 'Entrega final aplicada a una problemática del contexto laboral del participante.'],
      ['Talleres Prácticos & Laboratorios', `${rubrica.talleresPracticosPct ?? 35}%`, 'Ejercicios guiados, simulaciones y entregables modulares por sesión.'],
      ['Asistencia y Participación Activa', `${rubrica.participacionAsistenciaPct ?? 15}%`, `Asistencia mínima obligatoria del ${rubrica.asistenciaMinimaPct ?? 80}% y participación en debates técnicos.`],
      ['Evaluación Teórico-Práctica', `${rubrica.examenFinalPct ?? 10}%`, 'Cuestionario de validación de conocimientos y conceptos clave del programa.'],
      [
        { content: 'TOTAL:', styles: { fontStyle: 'bold', halign: 'right' } },
        { content: '100%', styles: { fontStyle: 'bold', halign: 'center', textColor: [37, 99, 235] } },
        { content: `Nota mínima para obtención de diploma/certificado: ${rubrica.notaMinimaAprobacion ?? 75}% | Asistencia mínima: ${rubrica.asistenciaMinimaPct ?? 80}%`, styles: { fontStyle: 'italic' } },
      ],
    ],
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold' },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 'auto' },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // Si no cabe el bloque de firmas, pasar a siguiente página
  if (currentY > 240) {
    doc.addPage();
    currentY = 25;
  }

  // 8. FORMALIZACIÓN Y FIRMAS ACADÉMICAS
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('FORMALIZACIÓN CURRICULAR & APROBACIÓN ACADÉMICA:', margin, currentY);
  currentY += 15;

  const colW = (contentWidth - 10) / 3;

  // Firma 1: Docente Titular
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(margin, currentY, margin + colW, currentY);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(docData.nombre, margin + colW / 2, currentY + 4, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Docente Titular Asignado', margin + colW / 2, currentY + 7.5, { align: 'center' });

  // Firma 2: Dirección Académica
  const f2X = margin + colW + 5;
  doc.line(f2X, currentY, f2X + colW, currentY);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Phd. Donal Reyes', f2X + colW / 2, currentY + 4, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Dirección de Gerencia Académica', f2X + colW / 2, currentY + 7.5, { align: 'center' });

  // Firma 3: Gerencia General (Aprobación y Auditoría)
  const f3X = margin + (colW + 5) * 2;
  doc.line(f3X, currentY, f3X + colW, currentY);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Dr. Walter Rene Pedroza', f3X + colW / 2, currentY + 4, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text('Aprobado por Gerencia General', f3X + colW / 2, currentY + 7.5, { align: 'center' });
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Seguridad y Auditoría Institucional', f3X + colW / 2, currentY + 10.5, { align: 'center' });

  // Pie de página estandarizado en todas las páginas generadas
  agregarPieDePaginaOficialPDF(doc, {
    codigo: codigoDoc,
    gerencia: 'Dirección Académica & Calidad',
  });

  // Si se solicita descarga directa en el navegador
  if (autoDescargar) {
    doc.save(nombreArchivo);
  }

  const dataUrl = doc.output('datauristring');
  // Calcular tamaño aproximado en KB
  const tamanoKb = Math.round((dataUrl.length * 0.75) / 1024);

  return {
    nombreArchivo,
    dataUrl,
    tamanoKb,
    fechaCarga: new Date().toISOString(),
  };
}

/**
 * Genera y descarga directamente el archivo PDF del Sílabo Oficial.
 */
export function descargarSilaboPdfOficial(datos: DatosGeneracionSilabo): ResultadoGeneracionSilabo {
  return generarSilaboPdfOficial(datos, true);
}
