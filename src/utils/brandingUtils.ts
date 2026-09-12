import { jsPDF } from 'jspdf';

/**
 * DEFINICIÓN OFICIAL DE MARCA E IDENTIDAD INSTITUCIONAL
 * SUMMIT IMPULSA GLOBAL, S.A. DE C.V.
 * Aplicable de manera estandarizada y obligatoria para todas las Gerencias:
 * - Gerencia General
 * - Gerencia de Academia y Formación
 * - Gerencia Comercial y Matrícula
 * - Gerencia Administrativa y Financiera / Auditoría Interna
 */

export type ClaveGerencia = 
  | 'general' 
  | 'academica' 
  | 'comercial' 
  | 'administrativa' 
  | 'auditoria'
  | 'multigerencial';

export interface InformacionGerencia {
  id: ClaveGerencia;
  nombre: string;
  titular: string;
  cargo: string;
  subtitulo: string;
  colorHex: string;
  colorRgb: [number, number, number];
}

export const SUMMIT_BRANDING = {
  nombreOficial: 'SUMMIT IMPULSA GLOBAL, S.A. DE C.V.',
  nombreComercial: 'SUMMIT IMPULSA GLOBAL',
  razonSocial: 'Summit Impulsa S. de R.L. / S.A. de C.V.',
  rtn: '05019026435770',
  lema: 'Transformando talento en resultados globales.',
  lemaIngles: 'Transforming talent into global results.',
  pais: 'Honduras',
  ciudad: 'San Pedro Sula, Cortés',
  direccionSede: 'Edificio Torre Alianza / Sede Corporativa, San Pedro Sula, Cortés, Honduras',
  telefono: '+504 2234-5678 / +504 9500-1234',
  correoInstitucional: 'comercializacion.summitg@gmail.com',
  sitioWeb: 'https://summitimpulsaglobal.com',
  sistema: 'Sistema Integral Multi-Gerencial POA 2026',
  anoFiscal: '2026',
  gerencias: {
    general: {
      id: 'general' as ClaveGerencia,
      nombre: 'Gerencia General',
      titular: 'Dr. Walter René Pedroza',
      cargo: 'Director General & Auditor Institucional',
      subtitulo: 'Dirección Estratégica, Finanzas & Gobernanza Directiva',
      colorHex: '#2563EB', // Azul Real
      colorRgb: [37, 99, 235] as [number, number, number],
    },
    academica: {
      id: 'academica' as ClaveGerencia,
      nombre: 'Gerencia de Academia y Formación',
      titular: 'Phd. Donal Reyes',
      cargo: 'Director Pedagógico y Curricular',
      subtitulo: 'Diseño Curricular, Cuerpo Docente & Acreditación SAR',
      colorHex: '#059669', // Verde Esmeralda
      colorRgb: [5, 150, 105] as [number, number, number],
    },
    comercial: {
      id: 'comercial' as ClaveGerencia,
      nombre: 'Gerencia de Comercialización',
      titular: 'Msc. Lilian Ordoñez',
      cargo: 'Directora de Comercialización B2C & B2B',
      subtitulo: 'Admisiones, Matrícula Corporativa & Pitch de Ventas',
      colorHex: '#D97706', // Ámbar Corporativo
      colorRgb: [217, 119, 6] as [number, number, number],
    },
    administrativa: {
      id: 'administrativa' as ClaveGerencia,
      nombre: 'Gerencia Administrativa y Financiera',
      titular: 'Licda. Mayra Flores',
      cargo: 'Directora Administrativa y Presupuestaria',
      subtitulo: 'Tesorería, Presupuesto POA & Cumplimiento Fiscal',
      colorHex: '#4F46E5', // Índigo Profundo
      colorRgb: [79, 70, 229] as [number, number, number],
    },
    auditoria: {
      id: 'auditoria' as ClaveGerencia,
      nombre: 'Auditoría Interna & Control de Gestión',
      titular: 'Comité de Auditoría y Cumplimiento',
      cargo: 'Auditor Interno Titular',
      subtitulo: 'Trazabilidad, Fiscalización SAR & Verificación POA',
      colorHex: '#E11D48', // Carmesí / Rose
      colorRgb: [225, 29, 72] as [number, number, number],
    },
    multigerencial: {
      id: 'multigerencial' as ClaveGerencia,
      nombre: 'Comité Multi-Gerencial Coordinado',
      titular: 'Gobernanza Inter-Gerencial',
      cargo: 'Consejo Directivo',
      subtitulo: 'Plan Operativo Anual (POA Sep - Dic 2026)',
      colorHex: '#0F172A', // Slate 900
      colorRgb: [15, 23, 42] as [number, number, number],
    },
  },
};

/**
 * Obtiene los datos de una gerencia por clave o texto aproximado
 */
export function resolverDatosGerencia(gerenciaTexto?: string): InformacionGerencia {
  if (!gerenciaTexto) return SUMMIT_BRANDING.gerencias.general;
  const texto = gerenciaTexto.toLowerCase();
  if (texto.includes('acad')) return SUMMIT_BRANDING.gerencias.academica;
  if (texto.includes('comer') || texto.includes('vent')) return SUMMIT_BRANDING.gerencias.comercial;
  if (texto.includes('admin') || texto.includes('finan')) return SUMMIT_BRANDING.gerencias.administrativa;
  if (texto.includes('audit')) return SUMMIT_BRANDING.gerencias.auditoria;
  if (texto.includes('multi') || texto.includes('comit')) return SUMMIT_BRANDING.gerencias.multigerencial;
  return SUMMIT_BRANDING.gerencias.general;
}

/**
 * Genera el SVG oficial del Escudo de Summit Impulsa Global
 * Con globo terráqueo 3D azul, meridianos, anillo orbital y montañas cromadas.
 */
export function getSummitEscudoSvg(width: number = 80, height: number = 80): string {
  return `
<svg width="${width}" height="${height}" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="summitGlobeGradDoc" cx="38%" cy="32%" r="65%" fx="35%" fy="28%">
      <stop offset="0%" stop-color="#4A90E2" />
      <stop offset="25%" stop-color="#2563EB" />
      <stop offset="60%" stop-color="#1D4ED8" />
      <stop offset="85%" stop-color="#0F2C69" />
      <stop offset="100%" stop-color="#071638" />
    </radialGradient>
    <linearGradient id="summitRingGradDoc" x1="10%" y1="90%" x2="90%" y2="10%">
      <stop offset="0%" stop-color="#64748B" />
      <stop offset="25%" stop-color="#CBD5E1" />
      <stop offset="50%" stop-color="#FFFFFF" />
      <stop offset="75%" stop-color="#94A3B8" />
      <stop offset="100%" stop-color="#334155" />
    </linearGradient>
    <linearGradient id="summitPeakLightDoc" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="40%" stop-color="#F1F5F9" />
      <stop offset="80%" stop-color="#CBD5E1" />
      <stop offset="100%" stop-color="#94A3B8" />
    </linearGradient>
    <linearGradient id="summitPeakDarkDoc" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#94A3B8" />
      <stop offset="50%" stop-color="#475569" />
      <stop offset="100%" stop-color="#1E293B" />
    </linearGradient>
    <linearGradient id="summitPeakMidDoc" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#64748B" />
      <stop offset="50%" stop-color="#CBD5E1" />
      <stop offset="100%" stop-color="#E2E8F0" />
    </linearGradient>
  </defs>
  <circle cx="100" cy="95" r="62" fill="url(#summitGlobeGradDoc)" />
  <g opacity="0.32" stroke="#BAE6FD" stroke-width="1.2" fill="none">
    <ellipse cx="100" cy="95" rx="62" ry="24" transform="rotate(-15 100 95)" />
    <ellipse cx="100" cy="75" rx="54" ry="16" transform="rotate(-15 100 75)" />
    <ellipse cx="100" cy="115" rx="54" ry="16" transform="rotate(-15 100 115)" />
    <ellipse cx="100" cy="95" rx="28" ry="62" transform="rotate(-15 100 95)" />
    <ellipse cx="100" cy="95" rx="48" ry="62" transform="rotate(-15 100 95)" />
    <line x1="40" y1="95" x2="160" y2="95" transform="rotate(-15 100 95)" />
  </g>
  <ellipse cx="78" cy="62" rx="28" ry="16" fill="#FFFFFF" opacity="0.22" transform="rotate(-30 78 62)" />
  <path d="M 45 125 C 25 110, 32 80, 75 62 C 118 44, 168 55, 178 78" stroke="url(#summitRingGradDoc)" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.6" />
  <g>
    <path d="M 128 38 L 102 112 L 128 106 Z" fill="url(#summitPeakLightDoc)" />
    <path d="M 128 38 L 128 106 L 152 98 Z" fill="url(#summitPeakDarkDoc)" />
    <path d="M 128 38 L 128 106" stroke="#FFFFFF" stroke-width="1" />
    <path d="M 104 44 L 82 108 L 104 104 Z" fill="url(#summitPeakLightDoc)" />
    <path d="M 104 44 L 104 104 L 120 96 Z" fill="url(#summitPeakMidDoc)" />
    <path d="M 78 64 L 62 108 L 78 105 Z" fill="url(#summitPeakLightDoc)" />
    <path d="M 78 64 L 78 105 L 94 102 Z" fill="url(#summitPeakDarkDoc)" />
    <path d="M 64 78 L 52 110 L 68 108 Z" fill="url(#summitPeakLightDoc)" />
    <path d="M 148 54 L 136 100 L 158 92 Z" fill="url(#summitPeakLightDoc)" />
    <path d="M 148 54 L 158 92 L 168 84 Z" fill="url(#summitPeakDarkDoc)" />
  </g>
  <path d="M 38 102 C 34 122, 58 144, 98 144 C 138 144, 168 126, 172 106 C 174 98, 170 90, 162 86 C 158 98, 134 116, 98 116 C 62 116, 44 106, 38 102 Z" fill="url(#summitRingGradDoc)" stroke="#E2E8F0" stroke-width="0.8" />
  <path d="M 46 120 C 58 138, 82 148, 114 146 C 142 144, 162 130, 166 118" stroke="#F8FAFC" stroke-width="2.5" stroke-linecap="round" fill="none" />
  <g transform="translate(152, 34) scale(1)">
    <path d="M 0 -10 Q 0 0 10 0 Q 0 0 0 10 Q 0 0 -10 0 Q 0 0 0 -10 Z" fill="#93C5FD" />
    <circle cx="0" cy="0" r="2.5" fill="#FFFFFF" />
  </g>
  <g transform="translate(138, 26) scale(0.65)">
    <path d="M 0 -8 Q 0 0 8 0 Q 0 0 0 8 Q 0 0 -8 0 Q 0 0 0 -8 Z" fill="#BAE6FD" />
    <circle cx="0" cy="0" r="1.5" fill="#FFFFFF" />
  </g>
  <g transform="translate(162, 48) scale(0.75)">
    <path d="M 0 -8 Q 0 0 8 0 Q 0 0 0 8 Q 0 0 -8 0 Q 0 0 0 -8 Z" fill="#60A5FA" />
    <circle cx="0" cy="0" r="1.8" fill="#FFFFFF" />
  </g>
</svg>
`.trim();
}

/**
 * Data URI del escudo oficial en SVG para incrustar en HTML o imágenes
 */
export function getSummitEscudoDataUri(): string {
  const svg = getSummitEscudoSvg(200, 200);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Dibuja el Escudo Oficial de Summit Impulsa Global de manera vectorial
 * directamente en una página de jsPDF con máxima nitidez y proporción geométrica.
 */
export function dibujarEscudoSummitJsPDF(
  doc: jsPDF, 
  cx: number, 
  cy: number, 
  radio: number = 8.5
) {
  // 1. Esfera exterior profunda (Globo azul)
  doc.setFillColor(29, 78, 216); // Azul #1D4ED8
  doc.circle(cx, cy, radio, 'F');

  // 2. Núcleo con gradiente simulado (Azul oscuro inferior)
  doc.setFillColor(15, 23, 42); // Navy #0F172A
  doc.ellipse(cx, cy + radio * 0.35, radio * 0.85, radio * 0.55, 'F');

  // 3. Brillo superior de la esfera
  doc.setFillColor(147, 197, 253); // Sky #93C5FD
  doc.circle(cx - radio * 0.28, cy - radio * 0.32, radio * 0.35, 'F');
  doc.setFillColor(255, 255, 255);
  doc.circle(cx - radio * 0.32, cy - radio * 0.36, radio * 0.16, 'F');

  // 4. Anillo orbital trasero
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(0.4);
  doc.ellipse(cx, cy, radio * 1.35, radio * 0.45, 'S');

  // 5. Picos montañosos plateados (Cromados Summit)
  // Pico central alto (Facetas clara y oscura)
  const picoAltoY = cy - radio * 0.75;
  const basePicosY = cy + radio * 0.35;

  // Pico Izquierdo
  doc.setFillColor(241, 245, 249); // Blanco plateado
  doc.triangle(cx - radio * 0.35, picoAltoY + radio * 0.25, cx - radio * 0.6, basePicosY, cx - radio * 0.35, basePicosY, 'F');
  doc.setFillColor(148, 163, 184); // Sombra metálica
  doc.triangle(cx - radio * 0.35, picoAltoY + radio * 0.25, cx - radio * 0.35, basePicosY, cx - radio * 0.15, basePicosY, 'F');

  // Pico Central (Más alto)
  doc.setFillColor(255, 255, 255); // Brillo frontal
  doc.triangle(cx, picoAltoY, cx - radio * 0.35, basePicosY, cx, basePicosY, 'F');
  doc.setFillColor(100, 116, 139); // Sombra derecha
  doc.triangle(cx, picoAltoY, cx, basePicosY, cx + radio * 0.4, basePicosY, 'F');

  // Pico Derecho menor
  doc.setFillColor(226, 232, 240);
  doc.triangle(cx + radio * 0.35, picoAltoY + radio * 0.35, cx + radio * 0.15, basePicosY, cx + radio * 0.35, basePicosY, 'F');
  doc.setFillColor(71, 85, 105);
  doc.triangle(cx + radio * 0.35, picoAltoY + radio * 0.35, cx + radio * 0.35, basePicosY, cx + radio * 0.6, basePicosY, 'F');

  // 6. Anillo orbital frontal (Abarca y abraza el frente)
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.65);
  doc.line(cx - radio * 1.2, cy + radio * 0.15, cx + radio * 1.2, cy - radio * 0.15);

  // 7. Estrellas de brillo corporativo en esquina superior derecha
  doc.setFillColor(254, 240, 138); // Dorado #FEF08A
  doc.circle(cx + radio * 0.9, cy - radio * 0.75, 0.45, 'F');
  doc.setFillColor(255, 255, 255);
  doc.circle(cx + radio * 0.65, cy - radio * 0.95, 0.35, 'F');
  doc.circle(cx + radio * 1.1, cy - radio * 0.45, 0.3, 'F');
}

export interface OpcionesEncabezadoPDF {
  gerencia?: string | ClaveGerencia;
  tituloDocumento: string;
  subtituloDocumento?: string;
  codigoDocumento?: string;
  folioCorrelativo?: string;
  fechaEmision?: string;
  moneda?: string;
  esPrimeraPagina?: boolean;
}

/**
 * Agrega el Encabezado Oficial Institucional estandarizado a cualquier documento jsPDF
 * Cumple con todas las normas de estandarización y formalidad para las 4 gerencias.
 * Retorna la coordenada Y libre para continuar imprimiendo el contenido.
 */
export function agregarEncabezadoOficialPDF(
  doc: jsPDF, 
  opciones: OpcionesEncabezadoPDF
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const esPrimera = opciones.esPrimeraPagina !== false;
  const gerenciaData = resolverDatosGerencia(opciones.gerencia as string);

  if (esPrimera) {
    // 1. Barra superior Navy / Slate 900
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 28, 'F');

    // 2. Franja de color distintivo de la Gerencia
    doc.setFillColor(gerenciaData.colorRgb[0], gerenciaData.colorRgb[1], gerenciaData.colorRgb[2]);
    doc.rect(0, 28, pageWidth, 2.5, 'F');

    // 3. Dibujar Escudo Oficial Vectorial de Summit
    dibujarEscudoSummitJsPDF(doc, margin + 7, 14, 8.5);

    // 4. Textos Corporativos Oficiales
    const textoX = margin + 19;

    // Nombre Oficial
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.text(SUMMIT_BRANDING.nombreOficial, textoX, 9);

    // Lema Institucional en destaque
    doc.setFont('helvetica', 'bolditalic');
    doc.setFontSize(7.2);
    doc.setTextColor(254, 240, 138); // Amarillo dorado oro
    doc.text(`"${SUMMIT_BRANDING.lema}"`, textoX, 13.5);

    // Ficha Fiscal y Geográfica
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.4);
    doc.setTextColor(191, 219, 254); // Azul hielo
    doc.text(
      `Summit Impulsa S. de R.L. • RTN: ${SUMMIT_BRANDING.rtn} • ${SUMMIT_BRANDING.ciudad}, ${SUMMIT_BRANDING.pais}`,
      textoX,
      17.5
    );

    // Identificación de la Gerencia Emisora y Título del Documento
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(
      `${gerenciaData.nombre.toUpperCase()} • ${opciones.tituloDocumento.toUpperCase()}`,
      textoX,
      22.5
    );

    // 5. Metadatos en Columna Derecha (Folio, Fecha, Estado)
    const derechaX = pageWidth - margin;
    const fecha = opciones.fechaEmision || new Date().toLocaleDateString('es-HN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    if (opciones.codigoDocumento || opciones.folioCorrelativo) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(254, 240, 138); // Oro
      doc.text(
        opciones.codigoDocumento || `FOLIO: ${opciones.folioCorrelativo}`,
        derechaX,
        9.5,
        { align: 'right' }
      );
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(226, 232, 240);
    doc.text(`Emisión Oficial: ${fecha}`, derechaX, 14.5, { align: 'right' });
    doc.text(
      `Titular: ${gerenciaData.titular}`,
      derechaX,
      18.5,
      { align: 'right' }
    );
    doc.text(
      `Gobernanza POA 2026 • Folio SAR`,
      derechaX,
      22.5,
      { align: 'right' }
    );

    return 36; // Coordenada Y disponible
  } else {
    // Encabezado Secundario para páginas siguientes
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 13, 'F');

    doc.setFillColor(gerenciaData.colorRgb[0], gerenciaData.colorRgb[1], gerenciaData.colorRgb[2]);
    doc.rect(0, 13, pageWidth, 1.2, 'F');

    // Mini escudo
    dibujarEscudoSummitJsPDF(doc, margin + 4, 6.5, 4.2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(
      `${SUMMIT_BRANDING.nombreComercial} • ${opciones.tituloDocumento}`,
      margin + 11,
      8.5
    );

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(191, 219, 254);
    doc.text(
      `"${SUMMIT_BRANDING.lema}" • ${gerenciaData.nombre}`,
      pageWidth - margin,
      8.5,
      { align: 'right' }
    );

    return 19; // Coordenada Y disponible
  }
}

/**
 * Agrega el Pie de Página Oficial a todas las páginas de un jsPDF
 */
export function agregarPieDePaginaOficialPDF(
  doc: jsPDF, 
  opciones?: { codigo?: string; gerencia?: string }
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const totalPaginas = doc.getNumberOfPages();
  const fechaHoy = new Date().toLocaleDateString('es-HN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);

    // Línea divisoria
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(margin, pageHeight - 9, pageWidth - margin, pageHeight - 9);

    // Texto de certificación institucional con el lema
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `${SUMMIT_BRANDING.nombreOficial} • "${SUMMIT_BRANDING.lema}"`,
      margin,
      pageHeight - 5.5
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `RTN: ${SUMMIT_BRANDING.rtn} • San Pedro Sula, Cortés • Documento Oficial Certificado • ${opciones?.codigo || 'POA-2026'} • ${fechaHoy}`,
      margin,
      pageHeight - 2.8
    );

    // Paginación
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(30, 41, 59);
    doc.text(
      `Página ${i} de ${totalPaginas}`,
      pageWidth - margin,
      pageHeight - 4.2,
      { align: 'right' }
    );
  }
}

/**
 * Genera el encabezado ASCII / texto para archivos CSV, Markdown o texto plano
 */
export function getSummitAsciiHeader(
  gerenciaNombre: string, 
  titulo: string, 
  correlativo?: string
): string {
  return [
    '========================================================================================',
    '                           SUMMIT IMPULSA GLOBAL, S.A. DE C.V.                          ',
    `                     "${SUMMIT_BRANDING.lema}"                     `,
    `      RTN: ${SUMMIT_BRANDING.rtn} • ${SUMMIT_BRANDING.ciudad}, ${SUMMIT_BRANDING.pais}      `,
    '         Sistema Integral Multi-Gerencial • Gobernanza Institucional POA 2026          ',
    '========================================================================================',
    `GERENCIA RESPONSABLE : ${gerenciaNombre.toUpperCase()}`,
    `DOCUMENTO EMITIDO    : ${titulo.toUpperCase()}${correlativo ? ` • CORRELATIVO: ${correlativo}` : ''}`,
    `FECHA DE EMISIÓN     : ${new Date().toLocaleString('es-HN')}`,
    'VALIDEZ Y CONTROL    : Documento Oficial Validado para Todas las Gerencias',
    '========================================================================================\n',
  ].join('\n');
}

/**
 * Genera el encabezado HTML formal para correos, Google Meet o Google Drive HTML
 */
export function getSummitHtmlEmailHeader(
  gerenciaNombre: string, 
  titulo: string
): string {
  return `
    <div style="background: linear-gradient(135deg, #071638 0%, #0f2c69 50%, #1e1b4b 100%); color: #ffffff; padding: 24px 20px; text-align: center; border-bottom: 3px solid #3b82f6;">
      <div style="display: inline-block; margin-bottom: 10px;">
        ${getSummitEscudoSvg(56, 56)}
      </div>
      <div style="font-size: 11px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #60a5fa; margin-bottom: 3px;">
        ${SUMMIT_BRANDING.nombreOficial}
      </div>
      <div style="font-size: 11.5px; font-style: italic; color: #fef08a; margin-bottom: 8px; font-weight: 600;">
        "${SUMMIT_BRANDING.lema}"
      </div>
      <div style="font-size: 9.5px; color: #cbd5e1; margin-bottom: 12px;">
        RTN: ${SUMMIT_BRANDING.rtn} • ${SUMMIT_BRANDING.ciudad}, ${SUMMIT_BRANDING.pais} • ${gerenciaNombre}
      </div>
      <h2 style="margin: 0; font-size: 18px; font-weight: 900; letter-spacing: 0.5px; color: #ffffff;">
        ${titulo}
      </h2>
    </div>
  `.trim();
}

/**
 * Genera el pie de página HTML formal para correos y reportes web
 */
export function getSummitHtmlEmailFooter(): string {
  return `
    <div style="background: #f8fafc; padding: 18px 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
      <div style="font-weight: 800; color: #0f2c69; margin-bottom: 4px;">
        ${SUMMIT_BRANDING.nombreOficial}
      </div>
      <div style="font-style: italic; color: #3b82f6; font-size: 10.5px; margin-bottom: 6px;">
        "${SUMMIT_BRANDING.lema}"
      </div>
      <div>
        RTN: ${SUMMIT_BRANDING.rtn} • San Pedro Sula, Cortés, Honduras • Sistema Integral Multi-Gerencial POA 2026<br/>
        Documento y notificación oficial con validez inter-gerencial. Prohibida su alteración no autorizada.
      </div>
    </div>
  `.trim();
}
