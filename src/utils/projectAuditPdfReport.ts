import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProyectoEducativo, Moneda, HistorialCambioProyecto } from '../types';
import { formatearMoneda, calcularMetricasProyecto } from './calculations';
import { subirReporteADrive } from '../services/googleDriveService';

export type DictamenAuditoriaTipo = 
  | 'FAVORABLE' 
  | 'FAVORABLE_CON_OBSERVACIONES' 
  | 'EN_RIESGO' 
  | 'DESFAVORABLE';

export interface ParametrosReporteAuditoriaProyectoPDF {
  proyecto: ProyectoEducativo;
  moneda: Moneda;
  auditorNombre?: string;
  auditorCargo?: string;
  dictamenAuditor?: DictamenAuditoriaTipo;
  notasAdicionalesAuditor?: string;
  guardarEnDrive?: boolean;
  onProgreso?: (mensaje: string) => void;
}

export interface ItemCronologiaEstado {
  paso: number;
  fecha: string;
  fechaLegible: string;
  hito: string;
  estadoAnterior: string;
  estadoNuevo: string;
  responsable: string;
  diasEnFase?: string;
  justificacion: string;
  tipoHito: 'creacion' | 'comercial' | 'aprobacion' | 'transicion' | 'cierre';
}

export interface ItemNotaAuditor {
  id: string;
  fecha: string;
  fechaLegible: string;
  auditorOOrigen: string;
  tipo: 'Observación Inicial' | 'Ajuste de Costos' | 'Verificación Comercial' | 'Nota de Auditoría' | 'Hallazgo Automático';
  titulo: string;
  contenido: string;
  severidad: 'INFORMATIVA' | 'ADVERTENCIA' | 'CRITICA' | 'CUMPLIMIENTO_OK';
  recomendacion?: string;
}

export interface ResultadoReporteAuditoriaPDF {
  success: boolean;
  nombreArchivo: string;
  codigoExpediente: string;
  proyectoId: string;
  totalCambios: number;
  totalNotasAuditor: number;
  totalTransicionesEstado: number;
  dictamen: DictamenAuditoriaTipo;
  guardadoEnDrive: boolean;
  driveUrl?: string;
  blob: Blob;
  error?: string;
}

/**
 * Reconstruye la cronología completa de los estados y fases del ciclo de vida del proyecto.
 */
export function reconstruirCronologiaEstados(proyecto: ProyectoEducativo): ItemCronologiaEstado[] {
  const cronologia: ItemCronologiaEstado[] = [];
  const historial = proyecto.historialCambios || [];

  // 1. Hito de Creación
  const eventoCreacion = historial.find(h => h.tipoCambio === 'creacion');
  const fechaCreacionStr = eventoCreacion?.fecha || (proyecto.fechaProgramacion ? `${proyecto.fechaProgramacion}T09:00:00.000Z` : '2026-08-01T08:00:00.000Z');
  
  cronologia.push({
    paso: 1,
    fecha: fechaCreacionStr,
    fechaLegible: formatearFechaCortaHora(fechaCreacionStr),
    hito: 'Registro y Formulación Curricular Inicial',
    estadoAnterior: 'Inexistente',
    estadoNuevo: 'Borrador / Planificado',
    responsable: eventoCreacion?.usuario || 'Coordinación Académica',
    diasEnFase: 'Fase Inicial',
    justificacion: eventoCreacion?.descripcion || `Apertura inicial del proyecto "${proyecto.nombreProyecto}" con ${proyecto.horasClase}h programadas.`,
    tipoHito: 'creacion'
  });

  // 2. Hito Comercial / Apertura de Convocatoria
  if (proyecto.fechaVenta || proyecto.fechaNotificacionComercial || proyecto.comercializacionCompletada) {
    const fechaComercialStr = proyecto.fechaNotificacionComercial || proyecto.fechaVenta || fechaCreacionStr;
    cronologia.push({
      paso: cronologia.length + 1,
      fecha: fechaComercialStr,
      fechaLegible: formatearFechaCortaHora(fechaComercialStr),
      hito: 'Apertura de Convocatoria y Notificación Comercial',
      estadoAnterior: 'Borrador / Planificado',
      estadoNuevo: 'En Comercialización / Convocatoria',
      responsable: 'Gerencia de Comercialización',
      diasEnFase: proyecto.fechaProgramacion && proyecto.fechaVenta ? `${calcularDiasHabiles(proyecto.fechaProgramacion, proyecto.fechaVenta)}d ventana venta` : '15d aprox.',
      justificacion: `Campaña comercial activa para captar meta de ${proyecto.alumnosProyectados} alumnos mediante canal: ${proyecto.metodoVenta}.`,
      tipoHito: 'comercial'
    });
  }

  // 3. Transiciones registradas en el historial de cambios
  const eventosEstado = historial.filter(h => 
    h.tipoCambio === 'estado' || 
    h.modificaciones?.some(m => m.campo === 'seLlevoACabo' || m.campo === 'etapaFlujo')
  );

  eventosEstado.forEach(evento => {
    const modEstado = evento.modificaciones?.find(m => m.campo === 'seLlevoACabo');
    const estadoAnt = modEstado ? String(modEstado.valorAnterior) : 'Planificado';
    const estadoNue = modEstado ? String(modEstado.valorNuevo) : 'Actualizado';

    cronologia.push({
      paso: cronologia.length + 1,
      fecha: evento.fecha,
      fechaLegible: formatearFechaCortaHora(evento.fecha),
      hito: evento.titulo,
      estadoAnterior: estadoAnt,
      estadoNuevo: estadoNue,
      responsable: evento.usuario || 'Dirección de Operaciones',
      diasEnFase: 'Ajuste de ciclo',
      justificacion: evento.descripcion,
      tipoHito: 'transicion'
    });
  });

  // 4. Hito de Aprobación Dirección General (si fue registrado)
  if (proyecto.fechaNotificacionGeneral || proyecto.etapaFlujo === 'dictamen_general' || proyecto.etapaFlujo === 'aprobado_listo') {
    const fechaAprobacion = proyecto.fechaNotificacionGeneral || proyecto.fechaVenta || fechaCreacionStr;
    cronologia.push({
      paso: cronologia.length + 1,
      fecha: fechaAprobacion,
      fechaLegible: formatearFechaCortaHora(fechaAprobacion),
      hito: 'Dictamen de Viabilidad Dirección General',
      estadoAnterior: 'En Comercialización',
      estadoNuevo: 'Aprobado / Autorizado',
      responsable: 'Gerencia General (Finanzas)',
      diasEnFase: 'Validación ejecutiva',
      justificacion: `Revisión de punto de equilibrio (${proyecto.puntoEquilibrioAlumnos || 4} alumnos) y validación de margen proyectado (${proyecto.margenGananciaOperativa}%).`,
      tipoHito: 'aprobacion'
    });
  }

  // 5. Estado Actual / Situación de Cierre
  const estadoFinalEtiqueta = 
    proyecto.seLlevoACabo === 'Sí' ? 'Ejecutado con Éxito / Liquidado' :
    proyecto.seLlevoACabo === 'En curso' ? 'En Ejecución Académica Activa' :
    proyecto.seLlevoACabo === 'Pospuesto' ? 'Pospuesto / En Reprogramación' :
    proyecto.seLlevoACabo === 'Cancelado' ? 'Cancelado por Falta de Aforo' : 'En Planificación Operativa';

  cronologia.push({
    paso: cronologia.length + 1,
    fecha: new Date().toISOString(),
    fechaLegible: formatearFechaCortaHora(new Date().toISOString()),
    hito: 'Estado Actual y Cierre de Auditoría',
    estadoAnterior: 'En Tránsito Operativo',
    estadoNuevo: estadoFinalEtiqueta,
    responsable: 'Auditoría Interna & Control de Gestión',
    diasEnFase: 'Estatus Vigente',
    justificacion: `El proyecto se encuentra formalmente clasificado como "${proyecto.seLlevoACabo}" con ${proyecto.alumnosFinal} alumnos inscritos confirmados.`,
    tipoHito: 'cierre'
  });

  return cronologia;
}

/**
 * Recopila y consolida todas las notas y observaciones de auditoría del proyecto.
 */
export function extraerNotasAuditor(
  proyecto: ProyectoEducativo,
  metricas: ReturnType<typeof calcularMetricasProyecto>,
  moneda: Moneda,
  notasAdicionales?: string,
  auditorNombre?: string
): ItemNotaAuditor[] {
  const notas: ItemNotaAuditor[] = [];
  const historial = proyecto.historialCambios || [];

  // 1. Notas manuales registradas en el historial
  const entradasManuales = historial.filter(h => 
    h.tipoCambio === 'manual' || 
    h.titulo.toLowerCase().includes('auditor') || 
    h.usuario?.toLowerCase().includes('auditor') ||
    h.usuario?.toLowerCase().includes('dirección')
  );

  entradasManuales.forEach((item, idx) => {
    notas.push({
      id: `nota-hist-${idx + 1}`,
      fecha: item.fecha,
      fechaLegible: formatearFechaCortaHora(item.fecha),
      auditorOOrigen: item.usuario || 'Auditoría Interna',
      tipo: 'Nota de Auditoría',
      titulo: item.titulo,
      contenido: item.descripcion,
      severidad: item.tipoCambio === 'manual' ? 'INFORMATIVA' : 'ADVERTENCIA',
      recomendacion: 'Dar seguimiento en el comité técnico mensual.'
    });
  });

  // 2. Observaciones generales del proyecto
  if (proyecto.observaciones && proyecto.observaciones.trim().length > 3) {
    notas.push({
      id: 'nota-obs-general',
      fecha: proyecto.fechaProgramacion ? `${proyecto.fechaProgramacion}T12:00:00.000Z` : new Date().toISOString(),
      fechaLegible: formatearFechaCortaHora(proyecto.fechaProgramacion || new Date().toISOString()),
      auditorOOrigen: 'Coordinación del Proyecto',
      tipo: 'Observación Inicial',
      titulo: 'Observaciones de Apertura y Seguimiento',
      contenido: proyecto.observaciones.trim(),
      severidad: 'INFORMATIVA',
      recomendacion: 'Integrado en el expediente operativo del programa.'
    });
  }

  // 3. Hallazgos analíticos automáticos del motor de auditoría
  // Hallazgo A: Punto de Equilibrio
  if (metricas.alumnosFinal < metricas.puntoEquilibrioAlumnos) {
    notas.push({
      id: 'hallazgo-pe-deficit',
      fecha: new Date().toISOString(),
      fechaLegible: formatearFechaCortaHora(new Date().toISOString()),
      auditorOOrigen: 'Motor de Auditoría Algorítmica',
      tipo: 'Hallazgo Automático',
      titulo: 'Déficit de Inscripción frente al Punto de Equilibrio',
      contenido: `El proyecto registró ${metricas.alumnosFinal} alumno(s), ubicándose por debajo de los ${metricas.puntoEquilibrioAlumnos} necesarios para costear la operación directa (${formatearMoneda(metricas.gastoTotalOperativo, moneda)}).`,
      severidad: 'CRITICA',
      recomendacion: 'Requerir renegociación de honorarios docentes o posponer apertura para consolidar una cohorte mínima viable.'
    });
  } else {
    notas.push({
      id: 'hallazgo-pe-ok',
      fecha: new Date().toISOString(),
      fechaLegible: formatearFechaCortaHora(new Date().toISOString()),
      auditorOOrigen: 'Motor de Auditoría Algorítmica',
      tipo: 'Hallazgo Automático',
      titulo: 'Punto de Equilibrio Superado Satisfactoriamente',
      contenido: `Se alcanzaron ${metricas.alumnosFinal} alumnos inscritos, superando el umbral de ${metricas.puntoEquilibrioAlumnos} alumnos con un margen de seguridad de +${metricas.alumnosFinal - metricas.puntoEquilibrioAlumnos} alumnos.`,
      severidad: 'CUMPLIMIENTO_OK',
      recomendacion: 'Continuar con el cronograma y calendarizar la siguiente cohorte formativa.'
    });
  }

  // Hallazgo B: Aforo mínimo institucional (4 alumnos)
  if (metricas.alumnosFinal <= 4 && metricas.alumnosFinal > 0) {
    notas.push({
      id: 'hallazgo-aforo-minimo',
      fecha: new Date().toISOString(),
      fechaLegible: formatearFechaCortaHora(new Date().toISOString()),
      auditorOOrigen: 'Motor de Control de Riesgo',
      tipo: 'Hallazgo Automático',
      titulo: 'Matrícula en Umbral de Riesgo por Deserción (≤ 4 alumnos)',
      contenido: `El curso opera con solo ${metricas.alumnosFinal} alumno(s). La deserción de un solo estudiante generaría un déficit operativo inmediato.`,
      severidad: 'ADVERTENCIA',
      recomendacion: 'Establecer políticas de retención y acompañamiento personalizado a los alumnos matriculados.'
    });
  }

  // Hallazgo C: Validación Curricular / Syllabus
  if (proyecto.estadoSyllabus !== 'Aprobado por Dirección') {
    notas.push({
      id: 'hallazgo-syllabus-pendiente',
      fecha: new Date().toISOString(),
      fechaLegible: formatearFechaCortaHora(new Date().toISOString()),
      auditorOOrigen: 'Auditoría Curricular',
      tipo: 'Hallazgo Automático',
      titulo: 'Validación Curricular Formal Pendiente',
      contenido: `El proyecto registra estado curricular "${proyecto.estadoSyllabus || 'Pendiente'}". Se requiere el visto bueno definitivo de rúbricas y temario.`,
      severidad: 'ADVERTENCIA',
      recomendacion: 'Solicitar a la Gerencia Académica la formalización y carga del Syllabus firmado.'
    });
  }

  // 4. Notas adicionales dictadas por el auditor al generar el reporte
  if (notasAdicionales && notasAdicionales.trim().length > 3) {
    notas.push({
      id: 'nota-auditor-final',
      fecha: new Date().toISOString(),
      fechaLegible: formatearFechaCortaHora(new Date().toISOString()),
      auditorOOrigen: auditorNombre || 'Auditor Interno Titular',
      tipo: 'Nota de Auditoría',
      titulo: 'Dictamen y Conclusiones del Auditor en Comisión',
      contenido: notasAdicionales.trim(),
      severidad: 'INFORMATIVA',
      recomendacion: 'Incorporar como compromiso formal de cumplimiento institucional.'
    });
  }

  return notas;
}

/**
 * Genera el Reporte de Auditoría Detallado en PDF para un proyecto específico.
 */
export async function exportarReporteAuditoriaProyectoPDF(
  params: ParametrosReporteAuditoriaProyectoPDF
): Promise<ResultadoReporteAuditoriaPDF> {
  const {
    proyecto,
    moneda,
    auditorNombre = 'Lic. Walter Pedroza • Auditor Interno',
    auditorCargo = 'Dirección de Auditoría Interna & Control de Gestión',
    dictamenAuditor,
    notasAdicionalesAuditor,
    guardarEnDrive = true,
    onProgreso
  } = params;

  onProgreso?.('Calculando métricas y verificando trazabilidad de cambios...');

  const metricas = calcularMetricasProyecto(proyecto);
  const cronologia = reconstruirCronologiaEstados(proyecto);
  const notasAuditor = extraerNotasAuditor(proyecto, metricas, moneda, notasAdicionalesAuditor, auditorNombre);
  const historialCambios = proyecto.historialCambios || [];

  // Determinar dictamen automático si no se proporcionó
  const margenRealPct = metricas.ingresoRealTotal > 0
    ? (metricas.totalGananciasFinales / metricas.ingresoRealTotal) * 100
    : 0;

  const cumplePuntoEq = metricas.alumnosFinal >= metricas.puntoEquilibrioAlumnos;
  const cumpleMargen = margenRealPct >= 15;
  const dictamenFinal: DictamenAuditoriaTipo = dictamenAuditor || (
    cumplePuntoEq && cumpleMargen
      ? 'FAVORABLE'
      : cumplePuntoEq
      ? 'FAVORABLE_CON_OBSERVACIONES'
      : metricas.totalGananciasFinales >= 0
      ? 'EN_RIESGO'
      : 'DESFAVORABLE'
  );

  onProgreso?.('Estructurando documento de auditoría con tablas de historial y estados...');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const simMoneda = moneda === 'LPS' ? 'L' : moneda === 'USD' ? '$' : moneda === 'EUR' ? '€' : '$';
  const codigoExpediente = `AUD-PROY-2026-${String(proyecto.numeroCorrelativo || proyecto.id).padStart(3, '0')}`;
  const fechaHoyStr = new Date().toLocaleDateString('es-HN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  let y = 0;

  // Función para verificar salto de página y dibujar encabezado secundario
  const helperCheckPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 15) {
      doc.addPage();
      dibujarEncabezadoPaginaSecundaria();
      y = margin + 14;
    }
  };

  const dibujarEncabezadoPaginaSecundaria = () => {
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, margin - 4, contentWidth, 8, 'F');
    doc.setFillColor(37, 99, 235);
    doc.rect(margin, margin + 4, contentWidth, 0.8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`EXPEDIENTE ${codigoExpediente} • ${proyecto.nombreProyecto}`, margin + 3, margin + 1.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`Auditoría Interna • Folio Confidencial`, pageWidth - margin - 3, margin + 1.5, { align: 'right' });
  };

  // =========================================================================
  // PÁGINA 1: ENCABEZADO INSTITUCIONAL DE AUDITORÍA
  // =========================================================================
  doc.setFillColor(15, 23, 42); // Navy / Slate 900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Franja decorativa dorada / azul
  doc.setFillColor(37, 99, 235); // Blue 600
  doc.rect(0, 28, pageWidth, 2.5, 'F');

  // Títulos institucionales
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('SUMMIT IMPULSA GLOBAL', margin, 9.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(191, 219, 254);
  doc.text('Summit Impulsa S. de R.L. • RTN: 05019026435770 • San Pedro Sula, Cortés, Honduras', margin, 14.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('INFORME DETALLADO DE AUDITORÍA, HISTORIAL DE CAMBIOS Y TRAZABILIDAD', margin, 21);

  // Folio y Metadatos en el encabezado derecho
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(254, 240, 138); // Amarillo oro
  doc.text(`EXPEDIENTE: ${codigoExpediente}`, pageWidth - margin, 11, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(226, 232, 240);
  doc.text(`Emisión: ${fechaHoyStr}`, pageWidth - margin, 17, { align: 'right' });
  doc.text(`Moneda: ${moneda} (${simMoneda}) | SAR: ${proyecto.codigoFiscalSAR || 'REG-SAR-2026'}`, pageWidth - margin, 23, { align: 'right' });

  y = 36;

  // =========================================================================
  // TARJETA DE IDENTIFICACIÓN Y DICTAMEN DEL PROYECTO
  // =========================================================================
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 32, 2, 2, 'FD');

  // Título del Proyecto
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(proyecto.nombreProyecto, margin + 4, y + 6.5);

  // Badge de Dictamen en esquina superior derecha
  const dictamenColor = 
    dictamenFinal === 'FAVORABLE' ? [5, 150, 105] :
    dictamenFinal === 'FAVORABLE_CON_OBSERVACIONES' ? [217, 119, 6] :
    dictamenFinal === 'EN_RIESGO' ? [234, 88, 12] : [225, 29, 72];

  const dictamenTexto = 
    dictamenFinal === 'FAVORABLE' ? 'DICTAMEN: CONFORME' :
    dictamenFinal === 'FAVORABLE_CON_OBSERVACIONES' ? 'DICTAMEN: CON OBSERVACIONES' :
    dictamenFinal === 'EN_RIESGO' ? 'DICTAMEN: EN RIESGO' : 'DICTAMEN: NO CONFORME';

  doc.setFillColor(dictamenColor[0], dictamenColor[1], dictamenColor[2]);
  doc.roundedRect(pageWidth - margin - 58, y + 2.5, 54, 6.5, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(dictamenTexto, pageWidth - margin - 31, y + 6.8, { align: 'center' });

  // Cuadrícula de datos descriptivos
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  // Fila 1
  doc.text('Docente Titular:', margin + 4, y + 13.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${proyecto.nombreDocente} (Tarifa: ${formatearMoneda(proyecto.tarifaHoraDocente || 200, moneda)}/h)`, margin + 28, y + 13.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Modalidad / Carga:', margin + 105, y + 13.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${proyecto.modalidad || 'Virtual Sincrónica'} (${proyecto.horasClase} hrs)`, margin + 132, y + 13.5);

  // Fila 2
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Tipo de Programa:', margin + 4, y + 19.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text(proyecto.tipoProyecto, margin + 28, y + 19.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Nivel Académico:', margin + 105, y + 19.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text(proyecto.nivel || 'Básico', margin + 132, y + 19.5);

  // Fila 3
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Estado de Ejecución:', margin + 4, y + 25.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(
    proyecto.seLlevoACabo === 'Sí' ? 5 : proyecto.seLlevoACabo === 'Cancelado' ? 225 : 217,
    proyecto.seLlevoACabo === 'Sí' ? 150 : proyecto.seLlevoACabo === 'Cancelado' ? 29 : 119,
    proyecto.seLlevoACabo === 'Sí' ? 105 : proyecto.seLlevoACabo === 'Cancelado' ? 72 : 6
  );
  doc.text(`${proyecto.seLlevoACabo} (${cronologia[cronologia.length - 1]?.estadoNuevo || 'Vigente'})`, margin + 34, y + 25.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Fechas del Ciclo:', margin + 105, y + 25.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Prog: ${proyecto.fechaProgramacion || 'N/A'} • Venta: ${proyecto.fechaVenta || 'N/A'}`, margin + 132, y + 25.5);

  y += 37;

  // =========================================================================
  // BLOQUE DE 4 TARJETAS KPIS FINANCIEROS Y DE CUMPLIMIENTO
  // =========================================================================
  const cardW = (contentWidth - 6) / 4;
  const cardH = 17;

  const kpis = [
    {
      titulo: 'VENTAS REALES',
      valor: formatearMoneda(metricas.ingresoRealTotal, moneda),
      sub: `Proy: ${formatearMoneda(metricas.ingresoFacturadoTotal || 0, moneda)}`,
      colorBg: [239, 246, 255],
      colorBorde: [191, 219, 254],
      colorText: [30, 58, 138]
    },
    {
      titulo: 'GASTO OPERATIVO',
      valor: formatearMoneda(metricas.gastoTotalOperativo, moneda),
      sub: `Docente: ${formatearMoneda(metricas.costoDocenteCalculado, moneda)}`,
      colorBg: [254, 242, 242],
      colorBorde: [254, 202, 202],
      colorText: [153, 27, 27]
    },
    {
      titulo: 'UTILIDAD NETA',
      valor: formatearMoneda(metricas.totalGananciasFinales, moneda),
      sub: `Margen: ${margenRealPct.toFixed(1)}% (Obj: ${proyecto.margenGananciaOperativa}%)`,
      colorBg: metricas.totalGananciasFinales >= 0 ? [240, 253, 244] : [255, 241, 242],
      colorBorde: metricas.totalGananciasFinales >= 0 ? [187, 247, 208] : [254, 205, 211],
      colorText: metricas.totalGananciasFinales >= 0 ? [22, 101, 52] : [159, 18, 57]
    },
    {
      titulo: 'ALUMNOS & PUNTO EQ.',
      valor: `${metricas.alumnosFinal} Inscritos`,
      sub: `Pto. Eq: ${metricas.puntoEquilibrioAlumnos} alum. (${metricas.alumnosFinal >= metricas.puntoEquilibrioAlumnos ? 'Cubierto' : 'Déficit'})`,
      colorBg: [248, 250, 252],
      colorBorde: [226, 232, 240],
      colorText: [51, 65, 85]
    }
  ];

  kpis.forEach((kpi, i) => {
    const kpiX = margin + i * (cardW + 2);
    doc.setFillColor(kpi.colorBg[0], kpi.colorBg[1], kpi.colorBg[2]);
    doc.setDrawColor(kpi.colorBorde[0], kpi.colorBorde[1], kpi.colorBorde[2]);
    doc.roundedRect(kpiX, y, cardW, cardH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.titulo, kpiX + cardW / 2, y + 4.2, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(kpi.colorText[0], kpi.colorText[1], kpi.colorText[2]);
    doc.text(kpi.valor, kpiX + cardW / 2, y + 10, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(71, 85, 105);
    doc.text(kpi.sub, kpiX + cardW / 2, y + 14.5, { align: 'center' });
  });

  y += cardH + 7;

  // =========================================================================
  // SECCIÓN 1: CRONOLOGÍA DE ESTADOS Y CICLO DE VIDA DEL PROGRAMA
  // =========================================================================
  helperCheckPageBreak(25);

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFillColor(37, 99, 235);
  doc.rect(margin, y, 2.5, 6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. CRONOLOGÍA DE ESTADOS Y CICLO DE VIDA DEL PROYECTO', margin + 5, y + 4.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Total de hitos registrados: ${cronologia.length}`, pageWidth - margin - 2, y + 4.2, { align: 'right' });

  y += 8;

  const filasCronologia = cronologia.map((c) => [
    `#${c.paso}`,
    c.fechaLegible,
    c.hito,
    c.estadoAnterior,
    c.estadoNuevo,
    c.responsable,
    c.justificacion
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['#', 'Fecha / Hora', 'Hito del Ciclo de Vida', 'Estado Ant.', 'Estado Resultante', 'Responsable', 'Detalle / Justificación Técnica']],
    body: filasCronologia,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 6.8,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 2
    },
    styles: {
      fontSize: 6.2,
      textColor: [30, 41, 59],
      cellPadding: 1.8,
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 24, fontStyle: 'bold' },
      2: { cellWidth: 34, fontStyle: 'bold' },
      3: { cellWidth: 22, textColor: [100, 116, 139] },
      4: { cellWidth: 26, fontStyle: 'bold' },
      5: { cellWidth: 25, textColor: [71, 85, 105] },
      6: { cellWidth: 'auto' }
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        // Colorear estado resultante
        if (data.column.index === 4) {
          const val = String(data.cell.raw);
          if (val.includes('Ejecutado') || val.includes('Aprobado') || val.includes('Sí')) {
            data.cell.styles.textColor = [5, 150, 105];
            data.cell.styles.fontStyle = 'bold';
          } else if (val.includes('Cancelado') || val.includes('Déficit')) {
            data.cell.styles.textColor = [225, 29, 72];
            data.cell.styles.fontStyle = 'bold';
          } else if (val.includes('Comercialización') || val.includes('Convocatoria')) {
            data.cell.styles.textColor = [37, 99, 235];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    }
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // =========================================================================
  // SECCIÓN 2: HISTORIAL DETALLADO DE CAMBIOS Y MODIFICACIONES
  // =========================================================================
  helperCheckPageBreak(25);

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFillColor(5, 150, 105); // Verde esmeralda
  doc.rect(margin, y, 2.5, 6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. HISTORIAL COMPLETO DE MODIFICACIONES, PARÁMETROS E IMPACTO FINANCIERO', margin + 5, y + 4.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Total eventos registrados: ${historialCambios.length}`, pageWidth - margin - 2, y + 4.2, { align: 'right' });

  y += 8;

  if (historialCambios.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('No se registran cambios posteriores a la creación inicial. El proyecto conserva sus parámetros presupuestarios de origen.', margin + 4, y + 7.5);
    y += 18;
  } else {
    const filasHistorial = historialCambios.map((h, index) => {
      const tipoTexto = 
        h.tipoCambio === 'creacion' ? 'Creación Inicial' :
        h.tipoCambio === 'costos' ? 'Ajuste Costos' :
        h.tipoCambio === 'proyeccion' ? 'Meta / Alumnos' :
        h.tipoCambio === 'margen_precio' ? 'Margen & Precios' :
        h.tipoCambio === 'estado' ? 'Estado' :
        h.tipoCambio === 'docente' ? 'Docencia' : 'Nota / Manual';

      // Resumen de campos modificados
      const camposTexto = h.modificaciones && h.modificaciones.length > 0
        ? h.modificaciones.map(m => `${m.etiqueta}: ${m.valorAnterior} → ${m.valorNuevo}`).join('\n')
        : h.descripcion;

      // Resumen impacto financiero
      let impactoTexto = 'N/A (Sin variación financiera)';
      if (h.impactoFinanciero) {
        const deltaGasto = (h.impactoFinanciero.gastoOperativoNuevo || 0) - (h.impactoFinanciero.gastoOperativoAnterior || 0);
        const deltaGanancia = (h.impactoFinanciero.gananciaFinalNueva || 0) - (h.impactoFinanciero.gananciaFinalAnterior || 0);
        impactoTexto = `Gastos: ${formatearMoneda(h.impactoFinanciero.gastoOperativoNuevo || 0, moneda)} (${deltaGasto >= 0 ? '+' : ''}${formatearMoneda(deltaGasto, moneda)})\n` +
                       `Ganancia: ${formatearMoneda(h.impactoFinanciero.gananciaFinalNueva || 0, moneda)} (${deltaGanancia >= 0 ? '+' : ''}${formatearMoneda(deltaGanancia, moneda)})\n` +
                       `P. Eq: ${h.impactoFinanciero.puntoEquilibrioNuevo} alumnos`;
      }

      return [
        `#${index + 1}`,
        formatearFechaCortaHora(h.fecha),
        tipoTexto,
        h.usuario || 'Coordinación',
        `${h.titulo}\n${camposTexto}`,
        impactoTexto
      ];
    });

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['#', 'Fecha / Hora', 'Categoría', 'Usuario / Autor', 'Título y Campos Modificados (Anterior → Nuevo)', 'Impacto Financiero Registrado']],
      body: filasHistorial,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 6.8,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: 2
      },
      styles: {
        fontSize: 6.2,
        textColor: [30, 41, 59],
        cellPadding: 2,
        lineColor: [226, 232, 240],
        lineWidth: 0.15,
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { cellWidth: 7, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 23, fontStyle: 'bold' },
        2: { cellWidth: 22, fontStyle: 'bold' },
        3: { cellWidth: 24, textColor: [71, 85, 105] },
        4: { cellWidth: 'auto' },
        5: { cellWidth: 46, fontStyle: 'normal', textColor: [51, 65, 85] }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 2) {
          const val = String(data.cell.raw);
          if (val.includes('Costos')) data.cell.styles.textColor = [180, 83, 9];
          if (val.includes('Creación')) data.cell.styles.textColor = [5, 150, 105];
          if (val.includes('Meta') || val.includes('Alumnos')) data.cell.styles.textColor = [37, 99, 235];
          if (val.includes('Margen')) data.cell.styles.textColor = [79, 70, 229];
        }
      }
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // =========================================================================
  // SECCIÓN 3: REGISTRO Y NOTAS DEL AUDITOR INTERNO & HALLAZGOS
  // =========================================================================
  helperCheckPageBreak(25);

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFillColor(217, 119, 6); // Ambar dorado
  doc.rect(margin, y, 2.5, 6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. NOTAS DEL AUDITOR, HALLAZGOS Y EVALUACIÓN DE CONTROL INTERNO', margin + 5, y + 4.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Total notas y hallazgos: ${notasAuditor.length}`, pageWidth - margin - 2, y + 4.2, { align: 'right' });

  y += 8;

  const filasNotas = notasAuditor.map((n, idx) => [
    `#${idx + 1}`,
    n.fechaLegible,
    n.auditorOOrigen,
    n.tipo,
    `${n.titulo}\n${n.contenido}`,
    n.severidad === 'CUMPLIMIENTO_OK' ? 'CONFORME' : n.severidad,
    n.recomendacion || 'Sin recomendación requerida'
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['#', 'Fecha', 'Auditor / Fuente', 'Tipo', 'Hallazgo / Nota Técnica', 'Nivel Riesgo', 'Acción Recomendada']],
    body: filasNotas,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 6.8,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 2
    },
    styles: {
      fontSize: 6.2,
      textColor: [30, 41, 59],
      cellPadding: 2,
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 22, fontStyle: 'bold' },
      2: { cellWidth: 26, fontStyle: 'bold', textColor: [71, 85, 105] },
      3: { cellWidth: 23 },
      4: { cellWidth: 'auto' },
      5: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 42, textColor: [51, 65, 85] }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const val = String(data.cell.raw);
        if (val === 'CONFORME') {
          data.cell.styles.textColor = [5, 150, 105];
          data.cell.styles.fillColor = [240, 253, 244];
        } else if (val === 'CRITICA') {
          data.cell.styles.textColor = [225, 29, 72];
          data.cell.styles.fillColor = [255, 241, 242];
        } else if (val === 'ADVERTENCIA') {
          data.cell.styles.textColor = [217, 119, 6];
          data.cell.styles.fillColor = [254, 252, 232];
        }
      }
    }
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // =========================================================================
  // SECCIÓN 4: CERTIFICACIÓN TÉCNICA, DICTAMEN FINAL Y FIRMAS
  // =========================================================================
  helperCheckPageBreak(38);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('CERTIFICACIÓN FORMAL DE AUDITORÍA Y TRAZABILIDAD DOCUMENTAL:', margin + 3, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  const textoCertificacion = 
    `Se certifica que los datos, costos, nómina docente y registros de matrícula correspondientes al programa "${proyecto.nombreProyecto}" han sido sometidos a auditoría de control interno, confrontando el historial inmutable de modificaciones y la cronología de estados frente a las normas de viabilidad económica y tributaria SAR Honduras.`;
  doc.text(textoCertificacion, margin + 3, y + 8, { maxWidth: contentWidth - 6 });

  y += 20;

  // Bloque de Firmas Ejecutivas
  helperCheckPageBreak(25);

  const firmaWidth = 52;
  const espacioFirmas = (contentWidth - firmaWidth * 3) / 2;
  const firma1X = margin;
  const firma2X = margin + firmaWidth + espacioFirmas;
  const firma3X = firma2X + firmaWidth + espacioFirmas;
  const lineaFirmaY = y + 10;

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(firma1X, lineaFirmaY, firma1X + firmaWidth, lineaFirmaY);
  doc.line(firma2X, lineaFirmaY, firma2X + firmaWidth, lineaFirmaY);
  doc.line(firma3X, lineaFirmaY, firma3X + firmaWidth, lineaFirmaY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text(auditorNombre, firma1X + firmaWidth / 2, lineaFirmaY + 3.8, { align: 'center' });
  doc.text('Gerencia Administrativa y Financiera', firma2X + firmaWidth / 2, lineaFirmaY + 3.8, { align: 'center' });
  doc.text('Dirección General / Presidencia', firma3X + firmaWidth / 2, lineaFirmaY + 3.8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text(auditorCargo, firma1X + firmaWidth / 2, lineaFirmaY + 7, { align: 'center' });
  doc.text('Validación Presupuestaria y SAR', firma2X + firmaWidth / 2, lineaFirmaY + 7, { align: 'center' });
  doc.text('Aprobación Ejecutiva Definitiva', firma3X + firmaWidth / 2, lineaFirmaY + 7, { align: 'center' });

  // =========================================================================
  // PIE DE PÁGINA Y NUMERACIÓN EN TODAS LAS PÁGINAS
  // =========================================================================
  const totalPaginas = doc.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 8, pageWidth - margin, pageHeight - 8);

    doc.setFontSize(6.2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `SUMMIT IMPULSA GLOBAL • Summit Impulsa S. de R.L. (RTN: 05019026435770, San Pedro Sula, Cortés) • Expediente ${codigoExpediente} • Fecha: ${fechaHoyStr}`,
      margin,
      pageHeight - 4.5
    );
    doc.text(
      `Página ${i} de ${totalPaginas}`,
      pageWidth - margin,
      pageHeight - 4.5,
      { align: 'right' }
    );
  }

  // Descarga del Archivo PDF en el navegador
  const nombreLimpio = proyecto.nombreProyecto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .slice(0, 30);

  const nombreArchivo = `Reporte_Auditoria_${codigoExpediente}_${nombreLimpio}.pdf`;
  const pdfBlob = doc.output('blob');

  // Disparar descarga local
  doc.save(nombreArchivo);

  // Respaldo en Google Drive si está habilitado
  let driveUrl: string | undefined;
  let guardadoEnDriveExitoso = false;

  if (guardarEnDrive) {
    try {
      onProgreso?.('Respaldando informe de auditoría en Google Drive...');
      const driveRes = await subirReporteADrive({
        titulo: `Reporte de Auditoría: ${proyecto.nombreProyecto} (${codigoExpediente})`,
        gerencia: 'Auditoría Interna & Control de Gestión',
        formato: 'PDF',
        nombreArchivo,
        contenido: pdfBlob,
        mimeType: 'application/pdf',
      });
      if (driveRes.success) {
        guardadoEnDriveExitoso = true;
        driveUrl = driveRes.driveUrl;
      }
    } catch (e) {
      console.warn('Error subiendo reporte de auditoría a Drive:', e);
    }
  }

  return {
    success: true,
    nombreArchivo,
    codigoExpediente,
    proyectoId: proyecto.id,
    totalCambios: historialCambios.length,
    totalNotasAuditor: notasAuditor.length,
    totalTransicionesEstado: cronologia.length,
    dictamen: dictamenFinal,
    guardadoEnDrive: guardadoEnDriveExitoso,
    driveUrl,
    blob: pdfBlob
  };
}

function formatearFechaCortaHora(fechaISO: string): string {
  try {
    const d = new Date(fechaISO);
    if (isNaN(d.getTime())) return fechaISO;
    return d.toLocaleDateString('es-HN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return fechaISO;
  }
}

function calcularDiasHabiles(fechaInicioStr: string, fechaFinStr: string): number {
  try {
    const inicio = new Date(fechaInicioStr);
    const fin = new Date(fechaFinStr);
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) return 15;
    let dias = 0;
    const cur = new Date(inicio);
    while (cur <= fin) {
      const diaSem = cur.getDay();
      if (diaSem !== 0 && diaSem !== 6) dias++;
      cur.setDate(cur.getDate() + 1);
    }
    return Math.max(1, dias);
  } catch {
    return 15;
  }
}
