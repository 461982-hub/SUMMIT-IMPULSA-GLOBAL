import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DocenteBanco } from './docenteDirectoryUtils';
import { 
  agregarEncabezadoOficialPDF, 
  agregarPieDePaginaOficialPDF, 
  SUMMIT_BRANDING 
} from './brandingUtils';

/**
 * Genera el documento PDF formal del Curriculum Vitae / Hoja de Vida Institucional del Docente.
 */
export function generarDocenteCvPdf(docente: DocenteBanco): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // --- PALETA DE COLORES INSTITUCIONALES ---
  const colorDark = [15, 23, 42]; // Slate 900
  const colorNavy = [30, 58, 138]; // Blue 900
  const colorBlueAccent = [37, 99, 235]; // Blue 600
  const colorEmerald = [5, 150, 105]; // Emerald 600
  const colorMuted = [100, 116, 139]; // Slate 500
  const colorBgLight = [248, 250, 252]; // Slate 50
  const colorBorder = [226, 232, 240]; // Slate 200

  // 1. ENCABEZADO SUPERIOR EJECUTIVO (OFICIAL ESTANDARIZADO DE LA EMPRESA)
  const codigoDocente = `EXP-DOC-${docente.id.toUpperCase()}`;
  let y = agregarEncabezadoOficialPDF(doc, {
    gerencia: 'academica',
    tituloDocumento: 'PLANILLA OFICIAL DE CURRICULUM VITAE',
    subtituloDocumento: 'Expediente Institucional de Docente & Facilitador Acreditado',
    codigoDocumento: codigoDocente,
    folioCorrelativo: docente.id.toUpperCase(),
    esPrimeraPagina: true,
  });

  // 2. BLOQUE HERO DEL DOCENTE (Tarjeta de Perfil)
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 38, 2.5, 2.5, 'FD');

  // Avatar / Insignia Iniciales
  doc.setFillColor(30, 58, 138); // Blue 900
  doc.circle(margin + 14, y + 19, 11, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const iniciales = (docente.nombre || 'D')
    .split(' ')
    .filter(n => n.length > 2)
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'DC';
  doc.text(iniciales, margin + 14, y + 22.5, { align: 'center' });

  // Datos Principales
  const infoX = margin + 30;
  doc.setTextColor(30, 58, 138);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const gradoTxt = (docente.clasificacion || docente.titulo || 'DOCENTE INSTITUCIONAL').toUpperCase();
  doc.text(gradoTxt, infoX, y + 9);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(docente.nombre, infoX, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Especialidad Principal: ${docente.especialidad}`, infoX, y + 22);

  // Subtítulo de Planilla de la Empresa
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(5, 150, 105); // Emerald 600
  doc.text('PLANILLA OFICIAL SUMMIT IMPULSA GLOBAL • POA 2026', infoX, y + 28);

  // Mini Badges de Tarifa y Calificación a la derecha
  const rightX = pageWidth - margin - 5;

  // Badge Tarifa
  doc.setFillColor(236, 253, 245); // Emerald 50
  doc.setDrawColor(167, 243, 208); // Emerald 200
  doc.roundedRect(rightX - 52, y + 6, 52, 11, 1.5, 1.5, 'FD');
  doc.setTextColor(6, 95, 70);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('TARIFA REGISTRADA / HORA:', rightX - 50, y + 10.5);
  doc.setFontSize(8.5);
  doc.text(`L. ${docente.tarifaHoraSugerida.toFixed(2)}`, rightX - 2, y + 15, { align: 'right' });

  // Badge NPS / Estado SAR
  doc.setFillColor(239, 246, 255); // Blue 50
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(rightX - 52, y + 20, 52, 11, 1.5, 1.5, 'FD');
  doc.setTextColor(30, 64, 175);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  const nps = docente.calificacionNPS ? `${docente.calificacionNPS} / 5.0 ⭐` : 'Excelente (5.0)';
  doc.text(`CALIFICACIÓN NPS: ${nps}`, rightX - 50, y + 24.5);
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Régimen SAR: ${docente.estadoSAR || 'Al Día'}`, rightX - 50, y + 29);

  y += 42;

  // 2.1 BLOQUE DE INTEGRACIÓN DEL EXPEDIENTE DE CV ADJUNTO EN LA PLANILLA
  const tieneCvAdjunto = Boolean(docente.cvPdfNombre || docente.cvPdfDataUrl);
  doc.setFillColor(tieneCvAdjunto ? 240 : 248, tieneCvAdjunto ? 253 : 250, tieneCvAdjunto ? 244 : 252);
  doc.setDrawColor(tieneCvAdjunto ? 187 : 226, tieneCvAdjunto ? 247 : 232, tieneCvAdjunto ? 208 : 240);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 16, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(tieneCvAdjunto ? 22 : 30, tieneCvAdjunto ? 101 : 58, tieneCvAdjunto ? 52 : 138);
  doc.text(
    tieneCvAdjunto 
      ? '✓ EXPEDIENTE CURRICULAR ORIGINAL CARGADO E INTEGRADO EN ESTA PLANILLA' 
      : 'ℹ EXPEDIENTE CURRICULAR REGISTRADO DIRECTAMENTE EN LA PLANILLA CORPORATIVA',
    margin + 4, 
    y + 5.5
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(51, 65, 85);
  if (tieneCvAdjunto) {
    const nombreArchivoLimpio = (docente.cvPdfNombre || 'CV_Docente_Adjunto.pdf').substring(0, 55);
    const tamanoTxt = docente.cvPdfTamano ? ` • ${docente.cvPdfTamano}` : '';
    const fechaTxt = docente.cvPdfFechaSubida ? ` • Fecha Carga: ${docente.cvPdfFechaSubida}` : '';
    doc.text(`Archivo Certificado: "${nombreArchivoLimpio}"${tamanoTxt}${fechaTxt}`, margin + 4, y + 10.5);
    doc.text('Estado: Homologado por Gerencia de Academia conforme a normativas de contratación docente POA 2026.', margin + 4, y + 14);
  } else {
    doc.text('Este documento funge como Hoja de Vida Oficial certificada por Summit Impulsa Global, S.A. de C.V.', margin + 4, y + 10.5);
    doc.text('Los atestados, formación académica y trayectoria han sido validados por la Dirección Curricular.', margin + 4, y + 14);
  }

  y += 20;

  // 3. TABLA DE DATOS DE CONTACTO & LOCALIZACIÓN
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['DATOS DE CONTACTO INSTITUCIONAL', 'ESTADO ADMINISTRATIVO Y OPERATIVO']],
    body: [
      [
        `Correo Electrónico: ${docente.email || docente.correo || 'No registrado'}\nTeléfono / WhatsApp: ${docente.telefono || 'No registrado'}\nSede Operativa: San Pedro Sula / Tegucigalpa, Honduras`,
        `Modalidades: Presencial, Virtual Sincrónica e Híbrida\nDisponibilidad Horaria: Semanal / Fines de Semana\nConvenio Docente: Vigente Ciclo POA 2026`
      ]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 3,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: (pageWidth - (margin * 2)) * 0.55 },
      1: { cellWidth: (pageWidth - (margin * 2)) * 0.45 },
    }
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // 4. SECCIÓN BIOGRAFÍA / RESUMEN PROFESIONAL
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - (margin * 2), 6.5, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y + 6.5, pageWidth - margin, y + 6.5);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('RESUMEN PROFESIONAL Y TRAYECTORIA ACADÉMICA', margin + 3, y + 4.5);

  y += 9;

  const biografiaTexto = docente.biografia && docente.biografia.trim().length > 0
    ? docente.biografia
    : `${docente.nombre} es un profesional de alta calificación académica y práctica en el área de ${docente.especialidad}, con reconocida trayectoria en formación ejecutiva, asesoría y facilitación de programas estratégicos para Summit Impulsa Global.`;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const bioLines = doc.splitTextToSize(biografiaTexto, pageWidth - (margin * 2) - 6);
  doc.text(bioLines, margin + 3, y);

  y += (bioLines.length * 4.5) + 6;

  // 5. SECCIÓN COMPETENCIAS Y CURSOS ASIGNADOS
  const cursos = (docente.cursosImpartidos && docente.cursosImpartidos.length > 0)
    ? docente.cursosImpartidos
    : [`Programa Especializado en ${docente.especialidad}`, 'Talleres de Capacitación Corporativa In-Company'];

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['#', 'PROGRAMA O CURSO ASOCIADO', 'ENFOQUE / COMPETENCIA', 'MODALIDAD']],
    body: cursos.map((curso, idx) => [
      String(idx + 1),
      curso,
      docente.especialidad,
      'Virtual / Presencial'
    ]),
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 80, fontStyle: 'bold' },
      2: { cellWidth: 60 },
      3: { cellWidth: 'auto', halign: 'center' },
    }
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // 6. VALIDACIÓN INSTITUCIONAL, FIRMA Y SELLO
  // Asegurar que quepa en la página
  if (y > pageHeight - 50) {
    doc.addPage();
    y = 20;
  }

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 34, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 58, 138);
  doc.text('VALIDACIÓN INSTITUCIONAL Y REGISTRO CURRICULAR', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('El presente documento certifica que el perfil docente se encuentra validado por la Gerencia Académica de Summit Impulsa Global,', margin + 4, y + 11);
  doc.text('conforme al cumplimiento de normativas de formación continua, competencias profesionales y acreditación tributaria aplicable.', margin + 4, y + 15);

  // Línea de firma y sello
  const firmaX = pageWidth - margin - 60;
  doc.setDrawColor(100, 116, 139);
  doc.line(firmaX, y + 25, firmaX + 54, y + 25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Phd. Donal Reyes', firmaX + 27, y + 28.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Dirección y Gerencia Académica', firmaX + 27, y + 31.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Summit Impulsa Global • POA 2026', firmaX + 27, y + 34, { align: 'center' });

  // Sello digital / Verificación
  doc.setDrawColor(37, 99, 235);
  doc.roundedRect(margin + 4, y + 19, 44, 11, 1, 1, 'D');
  doc.setTextColor(37, 99, 235);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('SELLO DE VALIDACIÓN DIGITAL', margin + 6, y + 23);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(71, 85, 105);
  doc.text(`CÓD: SIG-ACAD-${docente.id.toUpperCase()}-2026`, margin + 6, y + 27);

  // PIE DE PÁGINA (OFICIAL ESTANDARIZADO)
  agregarPieDePaginaOficialPDF(doc, {
    codigo: `SIG-ACAD-${docente.id.toUpperCase()}-2026`,
    gerencia: 'Gerencia de Academia y Formación',
  });

  return doc;
}

/**
 * Descarga directamente el CV Institucional en formato PDF.
 */
export function descargarDocenteCvPdf(docente: DocenteBanco): void {
  const doc = generarDocenteCvPdf(docente);
  const nombreLimpio = (docente.nombre || 'Docente')
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, '_')
    .substring(0, 30);
  doc.save(`CV_${nombreLimpio}_Summit_Impulsa.pdf`);
}

/**
 * Obtiene el Blob URL del CV generado para visualización en iframe/modal o pestaña nueva.
 */
export function obtenerDocenteCvPdfBlobUrl(docente: DocenteBanco): string {
  const doc = generarDocenteCvPdf(docente);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}

/**
 * Convierte un archivo PDF subido por el usuario a Data URL (base64) para almacenamiento seguro.
 */
export function leerArchivoPdfComoDataUrl(file: File): Promise<{ dataUrl: string; nombre: string; tamano: string }> {
  return new Promise((resolve, reject) => {
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      reject(new Error('El archivo seleccionado debe ser un documento PDF.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const sizeBytes = file.size;
      const tamano = sizeBytes < 1024 * 1024
        ? `${Math.round(sizeBytes / 1024)} KB`
        : `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;

      resolve({
        dataUrl,
        nombre: file.name,
        tamano,
      });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
