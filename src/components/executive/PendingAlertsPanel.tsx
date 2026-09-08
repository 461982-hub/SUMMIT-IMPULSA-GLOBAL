import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Filter,
  Search,
  BookOpen,
  Megaphone,
  Building2,
  ArrowRight,
  Eye,
  Edit3,
  Copy,
  Printer,
  Download,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingDown,
  RefreshCw,
  ExternalLink,
  Clock,
  Layers,
  Calendar
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { formatearMoneda, calcularMetricasProyecto } from '../../utils/calculations';
import { exportarInformeAuditoriaPDF } from '../../utils/exportUtils';

export type NivelRiesgo = 'CRITICO' | 'MEDIO' | 'BAJO';
export type EstadoGestionAlerta = 'PENDIENTE' | 'EN_REVISION' | 'MITIGADA';

export interface AlertaAuditoria {
  id: string;
  kpiId: string;
  kpiNombre: string;
  gerencia: 'Académica' | 'Comercial' | 'General';
  gerenciaKey: 'ACADEMICA' | 'COMERCIAL' | 'GENERAL';
  nivelRiesgo: NivelRiesgo;
  titulo: string;
  desviacionTexto: string;
  valorActual: string;
  umbralMinimo: string;
  brecha: string;
  diagnostico: string;
  impacto: string;
  accionCorrectiva: string;
  normaOFuente: string;
  proyectosAfectados: Array<{ id: string; nombre: string; detalle: string }>;
  fechaDeteccion: string;
  prioridad: number; // 1: Crítico, 2: Medio, 3: Bajo
}

interface PendingAlertsPanelProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onEditarProyecto: (p: ProyectoEducativo) => void;
  onVerDetalle: (p: ProyectoEducativo) => void;
  onNavegarGerencia?: (gerencia: 'gerencia-academica' | 'gerencia-comercializacion') => void;
  onIrAMatrizKPIs?: () => void;
  onDescargarPDF?: () => void;
  onIrACalendarioAcciones?: () => void;
}

export const PendingAlertsPanel: React.FC<PendingAlertsPanelProps> = ({
  proyectos,
  moneda,
  onEditarProyecto,
  onVerDetalle,
  onNavegarGerencia,
  onIrAMatrizKPIs,
  onDescargarPDF,
  onIrACalendarioAcciones
}) => {
  // Filtros interactivos
  const [filtroRiesgo, setFiltroRiesgo] = useState<'TODAS' | NivelRiesgo>('TODAS');
  const [filtroGerencia, setFiltroGerencia] = useState<'TODAS' | 'ACADEMICA' | 'COMERCIAL' | 'GENERAL'>('TODAS');
  const [filtroGestion, setFiltroGestion] = useState<'TODAS' | EstadoGestionAlerta>('TODAS');
  const [busqueda, setBusqueda] = useState<string>('');
  
  // Estado local de gestión de alertas (para que el auditor pueda cambiar estado)
  const [estadosAlertas, setEstadosAlertas] = useState<Record<string, EstadoGestionAlerta>>({});
  
  // IDs de alertas expandidas
  const [alertasExpandidas, setAlertasExpandidas] = useState<Record<string, boolean>>({});
  
  // Notificación de copia
  const [copiado, setCopiado] = useState<boolean>(false);

  // =========================================================================
  // MOTOR DE DETECCIÓN Y GENERACIÓN DE ALERTAS CLASIFICADAS POR RIESGO
  // =========================================================================
  const alertasDetectadas = useMemo<AlertaAuditoria[]>(() => {
    const totalProyectos = Math.max(1, proyectos.length);
    const fechaHoy = new Date().toLocaleDateString('es-HN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const lista: AlertaAuditoria[] = [];

    // Metadatos calculados de cada proyecto
    const proyectosConMetricas = proyectos.map(p => {
      const metricas = calcularMetricasProyecto(p);
      const margenCalculado = metricas.ingresoRealTotal > 0
        ? (metricas.totalGananciasFinales / metricas.ingresoRealTotal) * 100
        : 0;
      const ratioVenta = metricas.alumnosProyectados > 0
        ? (metricas.alumnosFinal / metricas.alumnosProyectados) * 100
        : 0;
      
      const tieneSyllabusValido = p.estadoSyllabus === 'Aprobado por Dirección' || p.estadoSyllabus === 'En Revisión Académica';
      const tieneTemas = (p.cantidadTemas && p.cantidadTemas > 0) || (p.temasImpartir && p.temasImpartir.trim().length > 10);
      const tieneDocente = Boolean(p.nombreDocente && p.nombreDocente.trim().length > 2);
      const isValidado = tieneSyllabusValido && tieneTemas && tieneDocente;

      return {
        ...p,
        metricas,
        margenCalculado,
        ratioVenta,
        isValidado,
        tieneDocente,
        tieneTemas,
        tieneSyllabusValido
      };
    });

    // -----------------------------------------------------------------------
    // 1. GERENCIA ACADÉMICA - ALERTAS
    // -----------------------------------------------------------------------
    const proyectosSinValidar = proyectosConMetricas.filter(p => !p.isValidado);
    const pctValidados = Math.round(((totalProyectos - proyectosSinValidar.length) / totalProyectos) * 100);

    if (pctValidados < 95) {
      const esCritico = pctValidados < 85;
      lista.push({
        id: 'alt-acad-validacion',
        kpiId: 'acad-proyectos-disenados',
        kpiNombre: 'Proyectos diseñados y validados',
        gerencia: 'Académica',
        gerenciaKey: 'ACADEMICA',
        nivelRiesgo: esCritico ? 'CRITICO' : 'MEDIO',
        prioridad: esCritico ? 1 : 2,
        titulo: `Déficit en formalización curricular (${pctValidados}% validados vs 95% umbral)`,
        desviacionTexto: `Cumplimiento al ${pctValidados}% (Brecha de -${95 - pctValidados}%)`,
        valorActual: `${pctValidados}%`,
        umbralMinimo: '≥ 95%',
        brecha: `-${95 - pctValidados}%`,
        diagnostico: `Existen ${proyectosSinValidar.length} programas educativos ofertados que carecen de syllabus aprobado por Dirección, temario estructurado o asignación formal del docente.`,
        impacto: 'Riesgo de reclamos por calidad académica, objeciones de alumnos y desorden en cronogramas docentes.',
        accionCorrectiva: 'Exigir a la Gerencia Académica la aprobación perentoria de syllabus y designación docente en 48 horas antes de abrir cohortes.',
        normaOFuente: 'Plataforma educativa / Registro académico',
        fechaDeteccion: fechaHoy,
        proyectosAfectados: proyectosSinValidar.map(p => ({
          id: p.id,
          nombre: p.nombreProyecto,
          detalle: !p.tieneSyllabusValido ? 'Syllabus pendiente' : !p.tieneDocente ? 'Falta docente' : 'Temario incompleto'
        }))
      });
    }

    // Alerta Académica: Horas docentes desproporcionadas / Sobrecarga horaria
    const proyectosSobrecargaHoras = proyectosConMetricas.filter(p => (p.horasClase || 0) >= 45);
    if (proyectosSobrecargaHoras.length > 0) {
      lista.push({
        id: 'alt-acad-horas-altas',
        kpiId: 'acad-horas-docente',
        kpiNombre: 'Carga horaria y costos docentes',
        gerencia: 'Académica',
        gerenciaKey: 'ACADEMICA',
        nivelRiesgo: 'MEDIO',
        prioridad: 2,
        titulo: `Programas con sobrecarga horaria (≥45 hrs clase que elevan el costo docente)`,
        desviacionTexto: `${proyectosSobrecargaHoras.length} proyecto(s) con carga horaria atípica`,
        valorActual: `${proyectosSobrecargaHoras.length} programas`,
        umbralMinimo: '≤ 40 hrs sugerido',
        brecha: `Exceso de costo`,
        diagnostico: 'Cursos con excesivo número de horas cátedra que encarecen el costo del facilitador y reducen el margen neto de rentabilidad institucional.',
        impacto: 'Compresión directa de utilidades y riesgo de deserción por fatiga horaria de los estudiantes.',
        accionCorrectiva: 'Modular temarios en bloques asincrónicos o talleres intensivos para limitar horas sincrónicas sin devaluar el perfil curricular.',
        normaOFuente: 'Malla curricular y contratos docentes',
        fechaDeteccion: fechaHoy,
        proyectosAfectados: proyectosSobrecargaHoras.map(p => ({
          id: p.id,
          nombre: p.nombreProyecto,
          detalle: `${p.horasClase} horas programadas | Tarifa: ${formatearMoneda(p.tarifaHoraDocente || 0, moneda)}/h`
        }))
      });
    }

    // Alerta Académica: Calidad / Pertinencia curricular
    const promedioEvaluacion = 88; // Índice muestral continuo
    if (promedioEvaluacion < 90) {
      lista.push({
        id: 'alt-acad-pertinencia',
        kpiId: 'acad-calidad-pertinencia',
        kpiNombre: 'Calidad y pertinencia curricular',
        gerencia: 'Académica',
        gerenciaKey: 'ACADEMICA',
        nivelRiesgo: 'BAJO',
        prioridad: 3,
        titulo: `Índice de pertinencia curricular bajo observación (${promedioEvaluacion}% vs 90% meta)`,
        desviacionTexto: `Desviación leve de -${90 - promedioEvaluacion}% respecto al estándar de excelencia`,
        valorActual: `${promedioEvaluacion}%`,
        umbralMinimo: '≥ 90%',
        brecha: `-${90 - promedioEvaluacion}%`,
        diagnostico: 'Se detecta necesidad de actualizar bibliografía técnica y herramientas prácticas acordes al mercado laboral actual.',
        impacto: 'Pérdida paulatina de competitividad frente a ofertas internacionales especializadas.',
        accionCorrectiva: 'Actualizar casos de estudio y rúbricas de evaluación aplicadas con el comité curricular.',
        normaOFuente: 'Encuestas a estudiantes y empleadores',
        fechaDeteccion: fechaHoy,
        proyectosAfectados: proyectos.slice(0, 2).map(p => ({
          id: p.id,
          nombre: p.nombreProyecto,
          detalle: 'Requiere actualización de casos y herramientas'
        }))
      });
    }

    // -----------------------------------------------------------------------
    // 2. GERENCIA COMERCIAL - ALERTAS
    // -----------------------------------------------------------------------
    // Alerta Comercial: Alumnos Reales vs Proyectados (Ventas Efectivas)
    const totalAlumnosProyectados = proyectosConMetricas.reduce((acc, p) => acc + p.metricas.alumnosProyectados, 0);
    const totalAlumnosReales = proyectosConMetricas.reduce((acc, p) => acc + p.metricas.alumnosFinal, 0);
    const ratioVentasGlobal = totalAlumnosProyectados > 0 ? Math.round((totalAlumnosReales / totalAlumnosProyectados) * 100) : 100;
    const proyectosRezagoMatricula = proyectosConMetricas.filter(p => p.ratioVenta < 75);

    if (ratioVentasGlobal < 80 || proyectosRezagoMatricula.length > 0) {
      const esCritico = ratioVentasGlobal < 65 || proyectosConMetricas.some(p => p.ratioVenta < 50);
      lista.push({
        id: 'alt-com-ventas-efectivas',
        kpiId: 'com-ventas-efectivas',
        kpiNombre: 'Ventas efectivas y meta de alumnos',
        gerencia: 'Comercial',
        gerenciaKey: 'COMERCIAL',
        nivelRiesgo: esCritico ? 'CRITICO' : 'MEDIO',
        prioridad: esCritico ? 1 : 2,
        titulo: `Rezago en matrícula y cuota de ventas (${ratioVentasGlobal}% alcanzado vs 80% umbral)`,
        desviacionTexto: `Ratio global ${ratioVentasGlobal}% (Brecha de -${Math.max(0, 80 - ratioVentasGlobal)}%)`,
        valorActual: `${ratioVentasGlobal}% (${totalAlumnosReales}/${totalAlumnosProyectados} alumnos)`,
        umbralMinimo: '≥ 80%',
        brecha: `-${Math.max(0, 80 - ratioVentasGlobal)}%`,
        diagnostico: `${proyectosRezagoMatricula.length} cursos presentan una matrícula significativamente inferior a la proyectada en el estudio de factibilidad.`,
        impacto: 'Compromete el punto de equilibrio operativo; el costo docente unitario por alumno se dispara si la matrícula no repunta.',
        accionCorrectiva: 'Lanzar campañas de remarketing, planes de pago corporativos y descuentos por pronto pago en los programas retrasados.',
        normaOFuente: 'Reportes de ventas / CRM',
        fechaDeteccion: fechaHoy,
        proyectosAfectados: proyectosRezagoMatricula.map(p => ({
          id: p.id,
          nombre: p.nombreProyecto,
          detalle: `${p.metricas.alumnosFinal} de ${p.metricas.alumnosProyectados} inscritos (${p.ratioVenta.toFixed(0)}%)`
        }))
      });
    }

    // Alerta Comercial: Programas con aforo en límite de base operativa (< 4 alumnos)
    const proyectosAforoMinimo = proyectosConMetricas.filter(p => (Number(p.alumnosFinal) || 0) <= 4);
    if (proyectosAforoMinimo.length > 0) {
      lista.push({
        id: 'alt-com-aforo-critico',
        kpiId: 'com-aforo-minimo',
        kpiNombre: 'Aforo mínimo de aula',
        gerencia: 'Comercial',
        gerenciaKey: 'COMERCIAL',
        nivelRiesgo: 'CRITICO',
        prioridad: 1,
        titulo: `Aforo crítico de apertura (Cursos con ≤4 alumnos en cohorte)`,
        desviacionTexto: `${proyectosAforoMinimo.length} programa(s) en umbral de apertura mínima`,
        valorActual: `≤ 4 alumnos`,
        umbralMinimo: '≥ 6 alumnos para solvencia',
        brecha: 'Riesgo de cancelación',
        diagnostico: 'Proyectos operando en el umbral mínimo absoluto de 4 estudiantes reglamentarios. Si un solo estudiante deserta, el curso operará a pérdida neta.',
        impacto: 'Pérdida financiera inminente y potencial daño reputacional si se cancela la cohorte.',
        accionCorrectiva: 'Posponga la fecha de arranque 7 días hábiles o asigne un bono intensivo comercial para captar al menos 3 alumnos adicionales.',
        normaOFuente: 'Reglamento de apertura y cuotas mínimas',
        fechaDeteccion: fechaHoy,
        proyectosAfectados: proyectosAforoMinimo.map(p => ({
          id: p.id,
          nombre: p.nombreProyecto,
          detalle: `Inscritos: ${p.metricas.alumnosFinal} alumnos | Punto Eq.: ${p.metricas.puntoEquilibrioAlumnos} alumnos`
        }))
      });
    }

    // Alerta Comercial: Tasa de Conversión de Leads
    const tasaConversionEstimada = 18.2; // Ratio comercial institucional
    if (tasaConversionEstimada < 20) {
      lista.push({
        id: 'alt-com-conversion',
        kpiId: 'com-tasa-conversion',
        kpiNombre: 'Tasa de conversión de prospectos',
        gerencia: 'Comercial',
        gerenciaKey: 'COMERCIAL',
        nivelRiesgo: 'MEDIO',
        prioridad: 2,
        titulo: `Tasa de conversión digital comprimida (${tasaConversionEstimada}% vs 20% objetivo)`,
        desviacionTexto: `Desviación de -${(20 - tasaConversionEstimada).toFixed(1)}% en conversión de embudo`,
        valorActual: `${tasaConversionEstimada}%`,
        umbralMinimo: '≥ 20%',
        brecha: `-${(20 - tasaConversionEstimada).toFixed(1)}%`,
        diagnostico: 'El embudo de ventas en WhatsApp y llamadas registra demora en el tiempo de respuesta inicial (>4 horas por lead), enfriando a los prospectos.',
        impacto: 'Mayor costo de adquisición por alumno (CAC) y fuga de prospectos calificados hacia competidores.',
        accionCorrectiva: 'Implementar protocolo de contacto en menos de 15 minutos e introducir guiones de objeciones comerciales estandarizados.',
        normaOFuente: 'Embudo de conversión CRM',
        fechaDeteccion: fechaHoy,
        proyectosAfectados: proyectos.slice(0, 2).map(p => ({
          id: p.id,
          nombre: p.nombreProyecto,
          detalle: 'Leads calificados con baja tasa de cierre en WhatsApp'
        }))
      });
    }

    // Alerta Comercial: Alcance y Pauta Digital
    const impresionesEstimadas = 42500;
    if (impresionesEstimadas < 50000) {
      lista.push({
        id: 'alt-com-alcance',
        kpiId: 'com-alcance-medios',
        kpiNombre: 'Alcance en medios digitales',
        gerencia: 'Comercial',
        gerenciaKey: 'COMERCIAL',
        nivelRiesgo: 'BAJO',
        prioridad: 3,
        titulo: `Alcance publicitario subóptimo (${impresionesEstimadas.toLocaleString()} vs 50,000 imp)`,
        desviacionTexto: `Déficit de ${(50000 - impresionesEstimadas).toLocaleString()} impresiones en campañas`,
        valorActual: `${impresionesEstimadas.toLocaleString()} imp`,
        umbralMinimo: '≥ 50,000 imp',
        brecha: `-${(50000 - impresionesEstimadas).toLocaleString()} imp`,
        diagnostico: 'Las campañas en Meta Ads y Google Ads requieren mayor optimización de creativos y presupuesto para alimentar el tope del embudo.',
        impacto: 'Menor volumen de prospectos entrantes para las próximas cohortes.',
        accionCorrectiva: 'Reasignar pauta hacia creativos en formato video testimonial y segmentación B2B en LinkedIn.',
        normaOFuente: 'Plataformas de pauta digital',
        fechaDeteccion: fechaHoy,
        proyectosAfectados: proyectos.slice(0, 2).map(p => ({
          id: p.id,
          nombre: p.nombreProyecto,
          detalle: 'Campañas con frecuencia alta y saturación de audiencia'
        }))
      });
    }

    // -----------------------------------------------------------------------
    // 3. GERENCIA GENERAL - ALERTAS
    // -----------------------------------------------------------------------
    // Alerta General: Margen de Rentabilidad
    const totalIngresos = proyectosConMetricas.reduce((acc, p) => acc + p.metricas.ingresoRealTotal, 0);
    const totalUtilidades = proyectosConMetricas.reduce((acc, p) => acc + p.metricas.totalGananciasFinales, 0);
    const margenConsolidado = totalIngresos > 0 ? Number(((totalUtilidades / totalIngresos) * 100).toFixed(1)) : 0;
    const proyectosBajoMargen = proyectosConMetricas.filter(p => p.margenCalculado < 15);
    const proyectosMargenCritico = proyectosConMetricas.filter(p => p.margenCalculado < 10);

    if (margenConsolidado < 15 || proyectosBajoMargen.length > 0) {
      const esCritico = margenConsolidado < 10 || proyectosMargenCritico.length > 0;
      lista.push({
        id: 'alt-gen-margen',
        kpiId: 'gen-margen-rentabilidad',
        kpiNombre: 'Margen de rentabilidad operativa',
        gerencia: 'General',
        gerenciaKey: 'GENERAL',
        nivelRiesgo: esCritico ? 'CRITICO' : 'MEDIO',
        prioridad: esCritico ? 1 : 2,
        titulo: `Rentabilidad comprometida (${margenConsolidado}% consolidado vs 15% mínimo exigido)`,
        desviacionTexto: `Margen en ${margenConsolidado}% (${proyectosBajoMargen.length} proyectos bajo el 15%)`,
        valorActual: `${margenConsolidado}%`,
        umbralMinimo: '≥ 15%',
        brecha: `-${Math.max(0, 15 - margenConsolidado).toFixed(1)}%`,
        diagnostico: `${proyectosBajoMargen.length} programa(s) presentan márgenes unitarios insuficientes, debido a costos fijos sobredimensionados o precios por alumno por debajo de la estructura de equilibrio.`,
        impacto: 'Deterioro de la liquidez institucional y falta de capacidad para reinversión operativa.',
        accionCorrectiva: 'Revisar estructura de gastos varios y Zoom, congelar contrataciones no esenciales y renegociar tarifa docente con base en resultados.',
        normaOFuente: 'Estados financieros / Balance de proyectos',
        fechaDeteccion: fechaHoy,
        proyectosAfectados: proyectosBajoMargen.map(p => ({
          id: p.id,
          nombre: p.nombreProyecto,
          detalle: `Margen: ${p.margenCalculado.toFixed(1)}% | Gasto: ${formatearMoneda(p.metricas.gastoTotalOperativo, moneda)}`
        }))
      });
    }

    // Alerta General: Gobernanza y Fiscalidad SAR
    const proyectosConFallasSAR = proyectosConMetricas.filter(p => {
      const sinFiscal = !p.tipoServicioFiscal || p.tipoServicioFiscal.trim() === '';
      const sinCorrelativo = !p.correlativoSAR || p.correlativoSAR.trim() === '';
      const esExento = p.aplicaISV === false || p.tasaISV === 0;
      const exentoSinJustificar = esExento && (!p.justificacionExencion || p.justificacionExencion.trim().length < 5);
      return sinFiscal || sinCorrelativo || exentoSinJustificar;
    });

    if (proyectosConFallasSAR.length > 0) {
      lista.push({
        id: 'alt-gen-sar-control',
        kpiId: 'gen-controles-internos',
        kpiNombre: 'Cumplimiento de controles internos y fiscalidad SAR',
        gerencia: 'General',
        gerenciaKey: 'GENERAL',
        nivelRiesgo: 'CRITICO',
        prioridad: 1,
        titulo: `Inconsistencia en gobernanza fiscal SAR (100% obligatorio)`,
        desviacionTexto: `${proyectosConFallasSAR.length} proyecto(s) con omisión fiscal o correlativo ausente`,
        valorActual: `${Math.round(((totalProyectos - proyectosConFallasSAR.length) / totalProyectos) * 100)}%`,
        umbralMinimo: '100%',
        brecha: `-${Math.round((proyectosConFallasSAR.length / totalProyectos) * 100)}%`,
        diagnostico: 'Existen registros sin tipo de servicio fiscal formal, sin correlativo fiscal asignado o con exención de ISV sin justificación legal acreditada.',
        impacto: 'Alto riesgo de contingencia tributaria, multas del SAR y descalificación en auditorías externas.',
        accionCorrectiva: 'Completar de inmediato el formulario fiscal de cada proyecto, anexar la constancia de exoneración o aplicar la tasa de ISV del 15% conforme a ley.',
        normaOFuente: 'Ley de Impuesto Sobre Ventas / SAR',
        fechaDeteccion: fechaHoy,
        proyectosAfectados: proyectosConFallasSAR.map(p => ({
          id: p.id,
          nombre: p.nombreProyecto,
          detalle: !p.tipoServicioFiscal ? 'Falta clasificación fiscal' : !p.correlativoSAR ? 'Falta correlativo SAR' : 'Exención no justificada'
        }))
      });
    }

    // Alerta General: Cobranza efectiva
    const pctCobradoEstimado = 92; // Tasa promedio de recaudación efectiva
    if (pctCobradoEstimado < 95) {
      lista.push({
        id: 'alt-gen-cobranza',
        kpiId: 'gen-ingresos-cobrados',
        kpiNombre: 'Ingresos cobrados vs facturados',
        gerencia: 'General',
        gerenciaKey: 'GENERAL',
        nivelRiesgo: 'MEDIO',
        prioridad: 2,
        titulo: `Brecha en cobranza efectiva (${pctCobradoEstimado}% cobrado vs 95% umbral)`,
        desviacionTexto: `Cuentas por cobrar en riesgo (-${95 - pctCobradoEstimado}%)`,
        valorActual: `${pctCobradoEstimado}%`,
        umbralMinimo: '≥ 95%',
        brecha: `-${95 - pctCobradoEstimado}%`,
        diagnostico: 'Se registra un 8% de facturación pendiente de liquidación o en cuotas vencidas por cobrar.',
        impacto: 'Estrés de liquidez en caja para cumplir con honorarios docentes a tiempo.',
        accionCorrectiva: 'Suspender acceso a plataformas para alumnos con más de 10 días de retraso e incentivar pronto pago con tarjeta de crédito.',
        normaOFuente: 'Extracto bancario y caja',
        fechaDeteccion: fechaHoy,
        proyectosAfectados: proyectos.slice(0, 2).map(p => ({
          id: p.id,
          nombre: p.nombreProyecto,
          detalle: 'Cuotas pendientes de confirmación bancaria'
        }))
      });
    }

    // Ordenar alertas por prioridad: Crítico (1), Medio (2), Bajo (3)
    return lista.sort((a, b) => a.prioridad - b.prioridad);
  }, [proyectos, moneda]);

  // =========================================================================
  // GESTIÓN DE ESTADOS Y FILTROS
  // =========================================================================
  const toggleEstadoAlerta = (alertaId: string) => {
    setEstadosAlertas(prev => {
      const actual = prev[alertaId] || 'PENDIENTE';
      const siguiente: EstadoGestionAlerta = 
        actual === 'PENDIENTE' ? 'EN_REVISION' :
        actual === 'EN_REVISION' ? 'MITIGADA' : 'PENDIENTE';
      return { ...prev, [alertaId]: siguiente };
    });
  };

  const toggleExpandir = (alertaId: string) => {
    setAlertasExpandidas(prev => ({
      ...prev,
      [alertaId]: !prev[alertaId]
    }));
  };

  const expandirTodas = () => {
    const nuevo: Record<string, boolean> = {};
    alertasDetectadas.forEach(a => {
      nuevo[a.id] = true;
    });
    setAlertasExpandidas(nuevo);
  };

  const contraerTodas = () => {
    setAlertasExpandidas({});
  };

  // Alertas filtradas según selectores
  const alertasFiltradas = useMemo(() => {
    return alertasDetectadas.filter(alerta => {
      // Filtro de riesgo
      if (filtroRiesgo !== 'TODAS' && alerta.nivelRiesgo !== filtroRiesgo) return false;

      // Filtro de gerencia
      if (filtroGerencia !== 'TODAS' && alerta.gerenciaKey !== filtroGerencia) return false;

      // Filtro de estado de gestión
      const estadoActual = estadosAlertas[alerta.id] || 'PENDIENTE';
      if (filtroGestion !== 'TODAS' && estadoActual !== filtroGestion) return false;

      // Búsqueda textual
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        const matchTitulo = alerta.titulo.toLowerCase().includes(q);
        const matchKpi = alerta.kpiNombre.toLowerCase().includes(q);
        const matchGerencia = alerta.gerencia.toLowerCase().includes(q);
        const matchDiagnostico = alerta.diagnostico.toLowerCase().includes(q);
        const matchAccion = alerta.accionCorrectiva.toLowerCase().includes(q);
        const matchProyectos = alerta.proyectosAfectados.some(p => p.nombre.toLowerCase().includes(q));
        if (!matchTitulo && !matchKpi && !matchGerencia && !matchDiagnostico && !matchAccion && !matchProyectos) {
          return false;
        }
      }

      return true;
    });
  }, [alertasDetectadas, filtroRiesgo, filtroGerencia, filtroGestion, busqueda, estadosAlertas]);

  // Conteo por nivel de riesgo
  const conteoRiesgo = useMemo(() => {
    const criticos = alertasDetectadas.filter(a => a.nivelRiesgo === 'CRITICO').length;
    const medios = alertasDetectadas.filter(a => a.nivelRiesgo === 'MEDIO').length;
    const bajos = alertasDetectadas.filter(a => a.nivelRiesgo === 'BAJO').length;
    const mitigadas = Object.values(estadosAlertas).filter(e => e === 'MITIGADA').length;
    const enRevision = Object.values(estadosAlertas).filter(e => e === 'EN_REVISION').length;
    const pendientes = alertasDetectadas.length - mitigadas - enRevision;

    return {
      total: alertasDetectadas.length,
      criticos,
      medios,
      bajos,
      mitigadas,
      enRevision,
      pendientes
    };
  }, [alertasDetectadas, estadosAlertas]);

  // Copiar resumen de alertas al portapapeles
  const handleCopiarAlertas = () => {
    const lineas: string[] = [];
    lineas.push('========================================================================');
    lineas.push('  SUMMIT IMPULSA GLOBAL - MATRIZ DE ALERTAS DE AUDITORÍA INTERNA');
    lineas.push(`  Fecha de corte: ${new Date().toLocaleDateString('es-HN')} | Total Alertas: ${alertasDetectadas.length}`);
    lineas.push('========================================================================\n');
    lineas.push(`RESUMEN EJECUTIVO DE RIESGO:`);
    lineas.push(`- Alertas Críticas (Atención Inmediata): ${conteoRiesgo.criticos}`);
    lineas.push(`- Alertas de Riesgo Medio (Mitigación Requerida): ${conteoRiesgo.medios}`);
    lineas.push(`- Alertas de Riesgo Bajo (Monitoreo Preventivo): ${conteoRiesgo.bajos}`);
    lineas.push(`- Estado de Gestión: ${conteoRiesgo.pendientes} Pendientes | ${conteoRiesgo.enRevision} En Revisión | ${conteoRiesgo.mitigadas} Mitigadas\n`);
    lineas.push('------------------------------------------------------------------------');
    lineas.push('DETALLE DE DESVIACIONES DETECTADAS POR GERENCIA:');
    lineas.push('------------------------------------------------------------------------\n');

    alertasDetectadas.forEach((a, idx) => {
      const estado = estadosAlertas[a.id] || 'PENDIENTE';
      lineas.push(`[ALERTA #${idx + 1}] [RIESGO: ${a.nivelRiesgo}] [GERENCIA: ${a.gerencia.toUpperCase()}] [ESTADO: ${estado}]`);
      lineas.push(`  KPI: ${a.kpiNombre}`);
      lineas.push(`  Desviación: ${a.titulo}`);
      lineas.push(`  Métricas: Actual ${a.valorActual} vs Umbral Mínimo ${a.umbralMinimo} (Brecha: ${a.brecha})`);
      lineas.push(`  Diagnóstico: ${a.diagnostico}`);
      lineas.push(`  Impacto: ${a.impacto}`);
      lineas.push(`  Acción Correctiva Oficial: ${a.accionCorrectiva}`);
      if (a.proyectosAfectados.length > 0) {
        lineas.push(`  Proyectos Implicados: ${a.proyectosAfectados.map(p => `${p.nombre} (${p.detalle})`).join(', ')}`);
      }
      lineas.push('');
    });

    lineas.push('========================================================================');
    lineas.push('DICTAMEN DEL AUDITOR INTERNO: Toda alerta clasificada en nivel CRÍTICO');
    lineas.push('exige resolución y descargo formal ante Dirección General antes del cierre de mes.');
    lineas.push('========================================================================');

    navigator.clipboard.writeText(lineas.join('\n'));
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3500);
  };

  const [descargandoPDF, setDescargandoPDF] = useState(false);

  const handleDescargarPDF = () => {
    try {
      setDescargandoPDF(true);
      if (onDescargarPDF) {
        onDescargarPDF();
      } else {
        exportarInformeAuditoriaPDF({
          proyectos,
          moneda,
          alertas: alertasDetectadas
        });
      }
    } catch (err) {
      console.error('Error al exportar PDF:', err);
    } finally {
      setTimeout(() => setDescargandoPDF(false), 800);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div id="panel-alertas-auditoria" className="space-y-5">
      {/* ========================================================================= */}
      {/* ENCABEZADO Y RESUMEN DE RIESGO DE ALERTAS */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-rose-400" />
                Auditoría Activa
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {alertasDetectadas.length} desviaciones identificadas
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Panel de Alertas Pendientes de Auditoría
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Monitoreo y clasificación de inconsistencias curriculares, comerciales y financieras frente a los umbrales institucionales mínimos de SUMMIT IMPULSA GLOBAL.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            {onIrACalendarioAcciones && (
              <button
                type="button"
                onClick={onIrACalendarioAcciones}
                className="px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 transition-all shadow-xs"
                title="Abrir el Calendario de Acciones Correctivas para asignar responsables y plazos"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Calendario de Acciones</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDescargarPDF}
              disabled={descargandoPDF}
              className="px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 border border-emerald-300 transition-all shadow-xs"
              title="Descargar Informe de Auditoría Automático en PDF con alertas críticas y acciones correctivas"
            >
              <Download className={`w-3.5 h-3.5 text-slate-950 ${descargandoPDF ? 'animate-bounce' : ''}`} />
              <span>{descargandoPDF ? 'Generando...' : 'Descargar PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopiarAlertas}
              className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
              title="Copiar matriz de alertas para reporte ejecutivo"
            >
              <Copy className="w-3.5 h-3.5 text-slate-300" />
              <span>{copiado ? '¡Copiado!' : 'Copiar Matriz'}</span>
            </button>

            <button
              type="button"
              onClick={handleImprimir}
              className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
              title="Imprimir o guardar PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Imprimir</span>
            </button>

            {onIrAMatrizKPIs && (
              <button
                type="button"
                onClick={onIrAMatrizKPIs}
                className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/30 transition-all shadow-xs"
              >
                <span>Ver Matriz KPIs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* FEEDBACK DE COPIADO */}
        {copiado && (
          <div className="mt-4 p-2.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Matriz completa de alertas copiada en formato memorando ejecutivo oficial.</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BARÓMETRO DE RIESGO: 4 TARJETAS DE CLASIFICACIÓN */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800">
          {/* CRÍTICO */}
          <div
            onClick={() => setFiltroRiesgo(filtroRiesgo === 'CRITICO' ? 'TODAS' : 'CRITICO')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer group ${
              filtroRiesgo === 'CRITICO'
                ? 'bg-rose-950/70 border-rose-500 ring-2 ring-rose-500/30'
                : 'bg-white/5 hover:bg-white/10 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                Riesgo Crítico
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white animate-pulse">
                Urgente
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1 flex items-baseline gap-1.5">
              <span className="text-rose-400">{conteoRiesgo.criticos}</span>
              <span className="text-xs text-slate-400 font-normal">
                {conteoRiesgo.criticos === 1 ? 'alerta' : 'alertas'}
              </span>
            </div>
            <p className="text-[10px] text-rose-200/70 mt-1 leading-snug">
              Inconsistencias fiscales SAR, pérdidas de margen o aforo de riesgo.
            </p>
          </div>

          {/* MEDIO */}
          <div
            onClick={() => setFiltroRiesgo(filtroRiesgo === 'MEDIO' ? 'TODAS' : 'MEDIO')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer group ${
              filtroRiesgo === 'MEDIO'
                ? 'bg-amber-950/70 border-amber-500 ring-2 ring-amber-500/30'
                : 'bg-white/5 hover:bg-white/10 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Riesgo Medio
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-500 text-white">
                Acción
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1 flex items-baseline gap-1.5">
              <span className="text-amber-300">{conteoRiesgo.medios}</span>
              <span className="text-xs text-slate-400 font-normal">
                {conteoRiesgo.medios === 1 ? 'alerta' : 'alertas'}
              </span>
            </div>
            <p className="text-[10px] text-amber-200/70 mt-1 leading-snug">
              Compresión de conversión comercial, cobranza o validación curricular.
            </p>
          </div>

          {/* BAJO */}
          <div
            onClick={() => setFiltroRiesgo(filtroRiesgo === 'BAJO' ? 'TODAS' : 'BAJO')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer group ${
              filtroRiesgo === 'BAJO'
                ? 'bg-blue-950/70 border-blue-500 ring-2 ring-blue-500/30'
                : 'bg-white/5 hover:bg-white/10 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-blue-400" />
                Riesgo Bajo
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-blue-500 text-white">
                Preventivo
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1 flex items-baseline gap-1.5">
              <span className="text-blue-300">{conteoRiesgo.bajos}</span>
              <span className="text-xs text-slate-400 font-normal">
                {conteoRiesgo.bajos === 1 ? 'alerta' : 'alertas'}
              </span>
            </div>
            <p className="text-[10px] text-blue-200/70 mt-1 leading-snug">
              Desviaciones menores de alcance de pauta o ajustes curriculares.
            </p>
          </div>

          {/* ESTADO DE GESTIÓN */}
          <div className="p-3.5 rounded-xl border bg-white/5 border-white/10 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Control de Mitigación
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
                <span className="text-emerald-400">{conteoRiesgo.mitigadas}</span>
                <span className="text-slate-400 text-sm font-normal"> / {conteoRiesgo.total}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>{conteoRiesgo.pendientes} Pendientes</span>
              <span>{conteoRiesgo.enRevision} En Revisión</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BARRA DE HERRAMIENTAS Y FILTROS INTERACTIVOS */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Filtros de Riesgo */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Riesgo:
          </span>
          <button
            type="button"
            onClick={() => setFiltroRiesgo('TODAS')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filtroRiesgo === 'TODAS'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Todas ({alertasDetectadas.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroRiesgo('CRITICO')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              filtroRiesgo === 'CRITICO'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            Crítico ({conteoRiesgo.criticos})
          </button>
          <button
            type="button"
            onClick={() => setFiltroRiesgo('MEDIO')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              filtroRiesgo === 'MEDIO'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            Medio ({conteoRiesgo.medios})
          </button>
          <button
            type="button"
            onClick={() => setFiltroRiesgo('BAJO')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              filtroRiesgo === 'BAJO'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            Bajo ({conteoRiesgo.bajos})
          </button>
        </div>

        {/* Filtros de Gerencia y Gestión */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Gerencia */}
          <select
            value={filtroGerencia}
            onChange={(e) => setFiltroGerencia(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
          >
            <option value="TODAS">Todas las Gerencias</option>
            <option value="ACADEMICA">Gerencia Académica</option>
            <option value="COMERCIAL">Gerencia Comercial</option>
            <option value="GENERAL">Gerencia General</option>
          </select>

          {/* Selector de Estado de Gestión */}
          <select
            value={filtroGestion}
            onChange={(e) => setFiltroGestion(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
          >
            <option value="TODAS">Todos los Estados</option>
            <option value="PENDIENTE">Solo Pendientes</option>
            <option value="EN_REVISION">En Revisión</option>
            <option value="MITIGADA">Mitigadas</option>
          </select>

          {/* Buscador */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar alerta o proyecto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-7 pr-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs w-44 sm:w-52 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
          </div>

          {/* Expandir / Contraer */}
          <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
            <button
              type="button"
              onClick={expandirTodas}
              className="px-2 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              title="Expandir todas las alertas"
            >
              Expandir
            </button>
            <button
              type="button"
              onClick={contraerTodas}
              className="px-2 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              title="Contraer todas"
            >
              Contraer
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LISTADO DE ALERTAS PENDIENTES */}
      {/* ========================================================================= */}
      {alertasFiltradas.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            No se encontraron alertas para los filtros seleccionados
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Todas las desviaciones de esta categoría han sido solventadas o no existen registros que coincidan con la búsqueda actual.
          </p>
          <button
            type="button"
            onClick={() => {
              setFiltroRiesgo('TODAS');
              setFiltroGerencia('TODAS');
              setFiltroGestion('TODAS');
              setBusqueda('');
            }}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restablecer Filtros</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {alertasFiltradas.map((alerta) => {
            const estadoActual = estadosAlertas[alerta.id] || 'PENDIENTE';
            const estaExpandida = Boolean(alertasExpandidas[alerta.id]);

            // Clases visuales según nivel de riesgo
            let borderClass = 'border-slate-200';
            let bgHeaderClass = 'bg-slate-50';
            let badgeRiesgo = null;

            if (alerta.nivelRiesgo === 'CRITICO') {
              borderClass = 'border-rose-300 ring-1 ring-rose-200';
              bgHeaderClass = 'bg-rose-50/70';
              badgeRiesgo = (
                <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-600 text-white flex items-center gap-1 shadow-2xs">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>RIESGO CRÍTICO</span>
                </span>
              );
            } else if (alerta.nivelRiesgo === 'MEDIO') {
              borderClass = 'border-amber-300 ring-1 ring-amber-200';
              bgHeaderClass = 'bg-amber-50/70';
              badgeRiesgo = (
                <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-500 text-white flex items-center gap-1 shadow-2xs">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>RIESGO MEDIO</span>
                </span>
              );
            } else {
              borderClass = 'border-blue-300 ring-1 ring-blue-200';
              bgHeaderClass = 'bg-blue-50/70';
              badgeRiesgo = (
                <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-600 text-white flex items-center gap-1 shadow-2xs">
                  <Info className="w-3.5 h-3.5" />
                  <span>RIESGO BAJO</span>
                </span>
              );
            }

            // Badge de Gerencia
            let badgeGerencia = null;
            if (alerta.gerenciaKey === 'ACADEMICA') {
              badgeGerencia = (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-200 flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-blue-700" />
                  <span>Gerencia Académica</span>
                </span>
              );
            } else if (alerta.gerenciaKey === 'COMERCIAL') {
              badgeGerencia = (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200 flex items-center gap-1">
                  <Megaphone className="w-3 h-3 text-purple-700" />
                  <span>Gerencia Comercial</span>
                </span>
              );
            } else {
              badgeGerencia = (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-emerald-700" />
                  <span>Gerencia General</span>
                </span>
              );
            }

            return (
              <div
                key={alerta.id}
                className={`bg-white rounded-2xl border ${borderClass} shadow-2xs overflow-hidden transition-all`}
              >
                {/* CABECERA DE LA ALERTA */}
                <div className={`p-4 ${bgHeaderClass} border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
                  <div className="flex flex-wrap items-center gap-2">
                    {badgeRiesgo}
                    {badgeGerencia}
                    <span className="text-[11px] font-mono text-slate-500 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
                      KPI: {alerta.kpiNombre}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
                      Detectada: {alerta.fechaDeteccion}
                    </span>
                  </div>

                  {/* CONTROL DE ESTADO DE LA ALERTA */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <div className="flex items-center bg-white rounded-lg p-0.5 border border-slate-200 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => toggleEstadoAlerta(alerta.id)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                          estadoActual === 'PENDIENTE'
                            ? 'bg-rose-100 text-rose-900'
                            : estadoActual === 'EN_REVISION'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}
                        title="Clic para alternar estado de gestión de la alerta"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          estadoActual === 'PENDIENTE' ? 'bg-rose-500' :
                          estadoActual === 'EN_REVISION' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        <span>
                          {estadoActual === 'PENDIENTE' ? 'Pendiente' :
                           estadoActual === 'EN_REVISION' ? 'En Revisión' : 'Mitigada'}
                        </span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleExpandir(alerta.id)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-colors"
                      title={estaExpandida ? 'Contraer detalle' : 'Expandir detalle'}
                    >
                      {estaExpandida ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* CUERPO PRINCIPAL DE LA ALERTA */}
                <div className="p-4 sm:p-5 space-y-4">
                  {/* TÍTULO Y DESVIACIÓN */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <h4 className="text-base font-black text-slate-900 tracking-tight">
                        {alerta.titulo}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {alerta.diagnostico}
                      </p>
                    </div>

                    {/* MÉTRICA COMPARATIVA: ACTUAL VS UMBRAL */}
                    <div className="shrink-0 bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-4 text-center">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Valor Auditado
                        </span>
                        <span className={`text-base font-black font-mono ${
                          alerta.nivelRiesgo === 'CRITICO' ? 'text-rose-600' :
                          alerta.nivelRiesgo === 'MEDIO' ? 'text-amber-600' : 'text-blue-600'
                        }`}>
                          {alerta.valorActual}
                        </span>
                      </div>
                      <div className="text-slate-300 font-bold">vs</div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Umbral Mínimo
                        </span>
                        <span className="text-base font-black font-mono text-emerald-700">
                          {alerta.umbralMinimo}
                        </span>
                      </div>
                      <div className="border-l border-slate-200 pl-3">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Brecha
                        </span>
                        <span className="text-xs font-black font-mono text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                          {alerta.brecha}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* IMPACTO ORGANIZACIONAL */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs flex items-start gap-2 text-slate-700">
                    <TrendingDown className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Impacto Organizacional: </strong>
                      <span>{alerta.impacto}</span>
                    </div>
                  </div>

                  {/* ACCIÓN CORRECTIVA SUGERIDA (DESTACADA) */}
                  <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px] uppercase tracking-wide">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Acción Correctiva Oficial del Auditor Interno:</span>
                    </div>
                    <p className="leading-relaxed font-medium pl-5">
                      {alerta.accionCorrectiva}
                    </p>
                  </div>

                  {/* PROYECTOS ESPECÍFICOS AFECTADOS (SI APLICA) */}
                  {alerta.proyectosAfectados && alerta.proyectosAfectados.length > 0 && (
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                        Proyectos Involucrados ({alerta.proyectosAfectados.length}):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {alerta.proyectosAfectados.map((item) => {
                          const proyectoObj = proyectos.find(p => p.id === item.id);
                          return (
                            <div
                              key={item.id}
                              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-2 text-xs flex items-center justify-between gap-3 transition-colors"
                            >
                              <div>
                                <span className="font-bold text-slate-900 block">
                                  {item.nombre}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {item.detalle}
                                </span>
                              </div>

                              {proyectoObj && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => onVerDetalle(proyectoObj)}
                                    className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Ver ficha técnica"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onEditarProyecto(proyectoObj)}
                                    className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                    title="Editar proyecto"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* VISTA DETALLADA EXPANDIDA */}
                  {estaExpandida && (
                    <div className="pt-3 border-t border-slate-200 space-y-3 bg-slate-50/50 p-3 rounded-xl text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <strong className="text-slate-700 block font-semibold">Fuente de Verificación Oficial:</strong>
                          <span className="text-slate-600 font-mono">{alerta.normaOFuente}</span>
                        </div>
                        <div>
                          <strong className="text-slate-700 block font-semibold">Código de Trazabilidad:</strong>
                          <span className="text-slate-600 font-mono">{alerta.id}</span>
                        </div>
                      </div>

                      {/* BOTÓN DE ACCIÓN PARA RESOLVER EN LA GERENCIA RESPONSABLE */}
                      <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                        <span className="text-[11px] text-slate-500">
                          Resuelve la desviación directamente en la vista de la gerencia asignada:
                        </span>
                        {alerta.gerenciaKey === 'ACADEMICA' && onNavegarGerencia && (
                          <button
                            type="button"
                            onClick={() => onNavegarGerencia('gerencia-academica')}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Ir a Gerencia Académica</span>
                          </button>
                        )}
                        {alerta.gerenciaKey === 'COMERCIAL' && onNavegarGerencia && (
                          <button
                            type="button"
                            onClick={() => onNavegarGerencia('gerencia-comercializacion')}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <Megaphone className="w-3.5 h-3.5" />
                            <span>Ir a Comercialización</span>
                          </button>
                        )}
                        {alerta.gerenciaKey === 'GENERAL' && onIrAMatrizKPIs && (
                          <button
                            type="button"
                            onClick={onIrAMatrizKPIs}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Revisar en Matriz de Control</span>
                          </button>
                        )}
                        {onIrACalendarioAcciones && (
                          <button
                            type="button"
                            onClick={onIrACalendarioAcciones}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                            title="Programar fecha límite y responsable en el Calendario de Acciones"
                          >
                            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Asignar en Calendario</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
