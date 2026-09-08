import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  GraduationCap,
  Award,
  DollarSign,
  Calendar,
  Filter,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Search,
  ChevronRight,
  ArrowUpDown,
  Clock,
  BarChart3,
  Download,
  HelpCircle,
  Eye,
  Users,
  User,
  Briefcase,
  X,
  Target
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { formatearMoneda } from '../../utils/calculations';
import {
  obtenerClaveMesProyecto,
  formatearEtiquetaMes,
  formatearEtiquetaCortaMes
} from '../../utils/monthUtils';

interface DocenteRentabilidadHistoricaViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onVerDetalle?: (p: ProyectoEducativo) => void;
  onEditarProyecto?: (p: ProyectoEducativo) => void;
  embedded?: boolean;
}

export interface MetricasDocenteHistorial {
  nombreDocente: string;
  totalCursos: number;
  totalHoras: number;
  totalAlumnos: number;
  totalIngresos: number;
  totalCostos: number;
  totalUtilidad: number;
  totalCostoDocente: number;
  tarifaPromedioHora: number;
  margenOperativoPromedio: number; // (totalUtilidad / totalIngresos) * 100
  roiPromedio: number; // (totalUtilidad / totalCostos) * 100
  multiplicadorUtilidadHonorario: number; // totalUtilidad / totalCostoDocente
  tendenciaMargen: 'ascendente' | 'estable' | 'descendente';
  variacionMargenPuntos: number;
  clasificacion: 'excelente' | 'solido' | 'moderado' | 'critico';
  proyectos: ProyectoEducativo[];
  primerMes: string;
  ultimoMes: string;
}

// Paleta distintiva de colores para las líneas de instructores
const PALETA_COLORES_DOCENTES = [
  '#4f46e5', // Indigo vibrante
  '#059669', // Emerald
  '#d97706', // Amber cálido
  '#db2777', // Rosa intenso
  '#7c3aed', // Purple profundo
  '#0284c7', // Sky blue
  '#ea580c', // Naranja
  '#0d9488', // Teal
  '#475569', // Slate
];

export const DocenteRentabilidadHistoricaView: React.FC<DocenteRentabilidadHistoricaViewProps> = ({
  proyectos,
  moneda,
  onVerDetalle,
  onEditarProyecto,
  embedded = false,
}) => {
  // Estados de control interactivo
  const [busqueda, setBusqueda] = useState('');
  const [metricaActiva, setMetricaActiva] = useState<'margen' | 'roi' | 'utilidad'>('margen');
  const [modoVisualizacion, setModoVisualizacion] = useState<'comparativa' | 'ranking' | 'individual'>('comparativa');
  const [docenteSeleccionado, setDocenteSeleccionado] = useState<string | null>(null);
  const [ordenarPor, setOrdenarPor] = useState<'margen' | 'roi' | 'utilidad' | 'cursos' | 'alumnos'>('margen');
  const [ordenAsc, setOrdenAsc] = useState(false);
  const [filtroNivelMargen, setFiltroNivelMargen] = useState<'todos' | 'alto' | 'medio' | 'bajo'>('todos');
  const [docenteDetalleModal, setDocenteDetalleModal] = useState<MetricasDocenteHistorial | null>(null);

  // 1. Agrupación y cálculo histórico de métricas por docente
  const metricasPorDocente = useMemo<MetricasDocenteHistorial[]>(() => {
    const agrupado: Record<string, ProyectoEducativo[]> = {};

    proyectos.forEach((p) => {
      const nombre = (p.nombreDocente || '').trim() || 'Sin Docente Asignado';
      if (!agrupado[nombre]) {
        agrupado[nombre] = [];
      }
      agrupado[nombre].push(p);
    });

    return Object.entries(agrupado).map(([nombreDocente, proysDocente]) => {
      // Ordenar proyectos cronológicamente
      const proysOrdenados = [...proysDocente].sort((a, b) => {
        const fechaA = a.fechaProgramacion || a.fechaVenta || '';
        const fechaB = b.fechaProgramacion || b.fechaVenta || '';
        return fechaA.localeCompare(fechaB);
      });

      const totalCursos = proysOrdenados.length;
      let totalHoras = 0;
      let totalAlumnos = 0;
      let totalIngresos = 0;
      let totalCostos = 0;
      let totalUtilidad = 0;
      let totalCostoDocente = 0;
      let sumaTarifas = 0;

      proysOrdenados.forEach((p) => {
        const horas = Math.max(0, p.horasClase || 0);
        const tarifa = Math.max(0, p.tarifaHoraDocente || 200);
        const alumnos = Math.max(0, Number(p.alumnosFinal) || 0);
        const costoDocente = p.costoDocenteManual && p.costoDocenteManual > 0
          ? p.costoDocenteManual
          : horas * tarifa;
        const costoOperativo = Math.max(0, p.gastoTotalOperativo || 0);
        const ingreso = Math.max(0, p.ingresoRealTotal || p.ingresoTotalNeto || 0);
        const utilidad = p.totalGananciasFinales !== undefined 
          ? p.totalGananciasFinales 
          : (ingreso - costoOperativo);

        totalHoras += horas;
        totalAlumnos += alumnos;
        totalIngresos += ingreso;
        totalCostos += costoOperativo;
        totalUtilidad += utilidad;
        totalCostoDocente += costoDocente;
        sumaTarifas += tarifa;
      });

      const tarifaPromedioHora = totalHoras > 0
        ? Math.round(totalCostoDocente / totalHoras)
        : Math.round(sumaTarifas / (totalCursos || 1));

      // Margen Operativo Promedio (%) = (Utilidad Total / Ingresos Totales) * 100
      const margenOperativoPromedio = totalIngresos > 0
        ? Number(((totalUtilidad / totalIngresos) * 100).toFixed(1))
        : 0;

      // ROI Promedio (%) = (Utilidad Total / Costos Totales) * 100
      const roiPromedio = totalCostos > 0
        ? Number(((totalUtilidad / totalCostos) * 100).toFixed(1))
        : 0;

      // Multiplicador de utilidad por lempira de honorario docente
      const multiplicadorUtilidadHonorario = totalCostoDocente > 0
        ? Number((totalUtilidad / totalCostoDocente).toFixed(2))
        : 0;

      // Cálculo de tendencia de margen comparando primera mitad vs segunda mitad de cursos
      let tendenciaMargen: 'ascendente' | 'estable' | 'descendente' = 'estable';
      let variacionMargenPuntos = 0;

      if (totalCursos >= 2) {
        const mitad = Math.floor(totalCursos / 2);
        const primeraMitad = proysOrdenados.slice(0, mitad);
        const segundaMitad = proysOrdenados.slice(mitad);

        const ingPri = primeraMitad.reduce((acc, p) => acc + (p.ingresoRealTotal || 0), 0);
        const utiPri = primeraMitad.reduce((acc, p) => acc + (p.totalGananciasFinales || 0), 0);
        const margPri = ingPri > 0 ? (utiPri / ingPri) * 100 : 0;

        const ingSeg = segundaMitad.reduce((acc, p) => acc + (p.ingresoRealTotal || 0), 0);
        const utiSeg = segundaMitad.reduce((acc, p) => acc + (p.totalGananciasFinales || 0), 0);
        const margSeg = ingSeg > 0 ? (utiSeg / ingSeg) * 100 : 0;

        variacionMargenPuntos = Number((margSeg - margPri).toFixed(1));
        if (variacionMargenPuntos >= 2) {
          tendenciaMargen = 'ascendente';
        } else if (variacionMargenPuntos <= -2) {
          tendenciaMargen = 'descendente';
        } else {
          tendenciaMargen = 'estable';
        }
      }

      // Clasificación de rentabilidad operativa
      let clasificacion: 'excelente' | 'solido' | 'moderado' | 'critico' = 'moderado';
      if (margenOperativoPromedio >= 35) {
        clasificacion = 'excelente';
      } else if (margenOperativoPromedio >= 25) {
        clasificacion = 'solido';
      } else if (margenOperativoPromedio >= 15) {
        clasificacion = 'moderado';
      } else {
        clasificacion = 'critico';
      }

      const primerMes = proysOrdenados[0] ? obtenerClaveMesProyecto(proysOrdenados[0]) : '';
      const ultimoMes = proysOrdenados[proysOrdenados.length - 1] 
        ? obtenerClaveMesProyecto(proysOrdenados[proysOrdenados.length - 1]) 
        : '';

      return {
        nombreDocente,
        totalCursos,
        totalHoras,
        totalAlumnos,
        totalIngresos,
        totalCostos,
        totalUtilidad,
        totalCostoDocente,
        tarifaPromedioHora,
        margenOperativoPromedio,
        roiPromedio,
        multiplicadorUtilidadHonorario,
        tendenciaMargen,
        variacionMargenPuntos,
        clasificacion,
        proyectos: proysOrdenados,
        primerMes,
        ultimoMes,
      };
    });
  }, [proyectos]);

  // Selección por defecto del primer docente si no hay ninguno seleccionado
  React.useEffect(() => {
    if (!docenteSeleccionado && metricasPorDocente.length > 0) {
      // Seleccionar el docente con mayor margen operativo promedio por defecto
      const topDoc = [...metricasPorDocente].sort((a, b) => b.margenOperativoPromedio - a.margenOperativoPromedio)[0];
      if (topDoc) {
        setDocenteSeleccionado(topDoc.nombreDocente);
      }
    }
  }, [metricasPorDocente, docenteSeleccionado]);

  // Docentes filtrados y ordenados
  const docentesFiltradosYOrdenados = useMemo(() => {
    return metricasPorDocente
      .filter((d) => {
        // Búsqueda por nombre
        if (busqueda.trim() && !d.nombreDocente.toLowerCase().includes(busqueda.toLowerCase())) {
          return false;
        }
        // Filtro por nivel de margen
        if (filtroNivelMargen === 'alto' && d.margenOperativoPromedio < 30) return false;
        if (filtroNivelMargen === 'medio' && (d.margenOperativoPromedio < 15 || d.margenOperativoPromedio >= 30)) return false;
        if (filtroNivelMargen === 'bajo' && d.margenOperativoPromedio >= 15) return false;
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (ordenarPor === 'margen') diff = b.margenOperativoPromedio - a.margenOperativoPromedio;
        else if (ordenarPor === 'roi') diff = b.roiPromedio - a.roiPromedio;
        else if (ordenarPor === 'utilidad') diff = b.totalUtilidad - a.totalUtilidad;
        else if (ordenarPor === 'cursos') diff = b.totalCursos - a.totalCursos;
        else if (ordenarPor === 'alumnos') diff = b.totalAlumnos - a.totalAlumnos;
        return ordenAsc ? -diff : diff;
      });
  }, [metricasPorDocente, busqueda, filtroNivelMargen, ordenarPor, ordenAsc]);

  // Top destacados del historial
  const topDocentes = useMemo(() => {
    const ordenadosPorMargen = [...metricasPorDocente].sort((a, b) => b.margenOperativoPromedio - a.margenOperativoPromedio);
    const ordenadosPorUtilidad = [...metricasPorDocente].sort((a, b) => b.totalUtilidad - a.totalUtilidad);
    const ordenadosPorMultiplicador = [...metricasPorDocente].sort((a, b) => b.multiplicadorUtilidadHonorario - a.multiplicadorUtilidadHonorario);

    // Margen operativo promedio general institucional
    const totalIngresosTodos = metricasPorDocente.reduce((acc, d) => acc + d.totalIngresos, 0);
    const totalUtilidadTodos = metricasPorDocente.reduce((acc, d) => acc + d.totalUtilidad, 0);
    const margenInstitucionalPromedio = totalIngresosTodos > 0
      ? Number(((totalUtilidadTodos / totalIngresosTodos) * 100).toFixed(1))
      : 0;

    return {
      topMargen: ordenadosPorMargen[0] || null,
      topUtilidad: ordenadosPorUtilidad[0] || null,
      topEficiencia: ordenadosPorMultiplicador[0] || null,
      margenInstitucionalPromedio,
      totalInstructores: metricasPorDocente.length,
    };
  }, [metricasPorDocente]);

  // 2. Construcción de serie de tiempo mes a mes para graficar la tendencia
  const datosGraficoTendencia = useMemo(() => {
    // Extraer todos los meses únicos del historial
    const mesesSet = new Set<string>();
    proyectos.forEach((p) => {
      mesesSet.add(obtenerClaveMesProyecto(p));
    });

    const mesesOrdenados = Array.from(mesesSet).sort((a, b) => a.localeCompare(b));

    // Mapeo de docente a color fijo
    const mapaColores: Record<string, string> = {};
    metricasPorDocente.forEach((doc, idx) => {
      mapaColores[doc.nombreDocente] = PALETA_COLORES_DOCENTES[idx % PALETA_COLORES_DOCENTES.length];
    });

    // Para cada mes, calcular la métrica de cada docente activo ese mes
    const serieTemporal = mesesOrdenados.map((mesKey) => {
      const proysMes = proyectos.filter((p) => obtenerClaveMesProyecto(p) === mesKey);
      
      // Margen promedio institucional de ese mes
      const ingMes = proysMes.reduce((acc, p) => acc + (p.ingresoRealTotal || 0), 0);
      const utiMes = proysMes.reduce((acc, p) => acc + (p.totalGananciasFinales || 0), 0);
      const gastMes = proysMes.reduce((acc, p) => acc + (p.gastoTotalOperativo || 0), 0);
      
      const margenInstitucionalMes = ingMes > 0 ? Number(((utiMes / ingMes) * 100).toFixed(1)) : 0;
      const roiInstitucionalMes = gastMes > 0 ? Number(((utiMes / gastMes) * 100).toFixed(1)) : 0;

      const puntoMes: Record<string, any> = {
        mesKey,
        etiquetaCorta: formatearEtiquetaCortaMes(mesKey),
        etiquetaMes: formatearEtiquetaMes(mesKey),
        promedioInstitucionalMargen: margenInstitucionalMes,
        promedioInstitucionalRoi: roiInstitucionalMes,
        utilidadInstitucional: utiMes,
      };

      // Métrica por cada docente en este mes
      metricasPorDocente.forEach((doc) => {
        const proysDocMes = proysMes.filter((p) => (p.nombreDocente || '').trim() === doc.nombreDocente);
        if (proysDocMes.length > 0) {
          const ingDocMes = proysDocMes.reduce((acc, p) => acc + (p.ingresoRealTotal || 0), 0);
          const utiDocMes = proysDocMes.reduce((acc, p) => acc + (p.totalGananciasFinales || 0), 0);
          const gastDocMes = proysDocMes.reduce((acc, p) => acc + (p.gastoTotalOperativo || 0), 0);

          const margDoc = ingDocMes > 0 ? Number(((utiDocMes / ingDocMes) * 100).toFixed(1)) : 0;
          const roiDoc = gastDocMes > 0 ? Number(((utiDocMes / gastDocMes) * 100).toFixed(1)) : 0;

          puntoMes[`margen_${doc.nombreDocente}`] = margDoc;
          puntoMes[`roi_${doc.nombreDocente}`] = roiDoc;
          puntoMes[`utilidad_${doc.nombreDocente}`] = utiDocMes;
          puntoMes[`cursos_${doc.nombreDocente}`] = proysDocMes.length;
        } else {
          // No activo en este mes
          puntoMes[`margen_${doc.nombreDocente}`] = null;
          puntoMes[`roi_${doc.nombreDocente}`] = null;
          puntoMes[`utilidad_${doc.nombreDocente}`] = null;
          puntoMes[`cursos_${doc.nombreDocente}`] = 0;
        }
      });

      return puntoMes;
    });

    return {
      mesesOrdenados,
      mapaColores,
      serieTemporal,
    };
  }, [proyectos, metricasPorDocente]);

  // 3. Datos para el gráfico de barras comparativas (Ranking directo de instructores)
  const datosGraficoRanking = useMemo(() => {
    return docentesFiltradosYOrdenados.map((d) => ({
      nombre: d.nombreDocente,
      nombreCorto: d.nombreDocente.split(' ')[0] + ' ' + (d.nombreDocente.split(' ')[1] || ''),
      margen: d.margenOperativoPromedio,
      roi: d.roiPromedio,
      utilidad: d.totalUtilidad,
      cursos: d.totalCursos,
      alumnos: d.totalAlumnos,
      tarifa: d.tarifaPromedioHora,
      clasificacion: d.clasificacion,
    }));
  }, [docentesFiltradosYOrdenados]);

  // Docente actualmente enfocado para la vista individual
  const docenteEnfocado = useMemo(() => {
    if (!docenteSeleccionado) return metricasPorDocente[0] || null;
    return metricasPorDocente.find((d) => d.nombreDocente === docenteSeleccionado) || metricasPorDocente[0] || null;
  }, [metricasPorDocente, docenteSeleccionado]);

  // Exportar a CSV de Rentabilidad por Docente
  const exportarCSVDocentes = () => {
    const encabezados = [
      'Instructor',
      'Cursos Impartidos',
      'Horas Totales',
      'Alumnos Atendidos',
      'Tarifa Promedio Hora',
      'Total Costo Honorarios',
      'Total Costo Operativo',
      'Ingresos Totales',
      'Utilidad Neta Total',
      'Margen Operativo Promedio (%)',
      'ROI Promedio (%)',
      'Multiplicador Utilidad/Honorario',
      'Tendencia Histórica',
      'Clasificación'
    ];

    const filas = metricasPorDocente.map((d) => [
      `"${d.nombreDocente}"`,
      d.totalCursos,
      d.totalHoras,
      d.totalAlumnos,
      d.tarifaPromedioHora,
      d.totalCostoDocente,
      d.totalCostos,
      d.totalIngresos,
      d.totalUtilidad,
      `${d.margenOperativoPromedio}%`,
      `${d.roiPromedio}%`,
      `${d.multiplicadorUtilidadHonorario}x`,
      d.tendenciaMargen,
      d.clasificacion
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [encabezados.join(','), ...filas.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rentabilidad_docentes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className={`space-y-6 ${embedded ? '' : 'p-2 sm:p-4'}`}
      id="vista-rentabilidad-por-docente"
    >
      {/* 1. CABECERA EJECUTIVA Y CONTEXTO ESTRATÉGICO */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white p-5 sm:p-6 rounded-2xl border border-indigo-800/80 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 text-indigo-300 flex items-center justify-center shrink-0 shadow-inner">
            <GraduationCap className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Tendencia de Rentabilidad por Docente & Desempeño Histórico
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                <Sparkles className="w-3 h-3 text-indigo-300" />
                Auditoría de Margen Operativo
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Analiza la evolución temporal del margen operativo y retorno generado por cada instructor, permitiendo identificar qué docentes maximizan la rentabilidad institucional a lo largo del tiempo.
            </p>
          </div>
        </div>

        {/* Acciones de exportación y resumen */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={exportarCSVDocentes}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer shadow-xs"
            title="Exportar informe de instructores a CSV"
          >
            <Download className="w-3.5 h-3.5 text-indigo-300" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* 2. TARJETAS DESTACADAS: TOP INSTRUCTORES DE MAYOR MARGEN OPERATIVO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Top 1: Mayor Margen Operativo Promedio */}
        <div className="bg-white p-4 rounded-2xl border-2 border-indigo-200 shadow-xs relative overflow-hidden group hover:border-indigo-400 transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              Mayor Margen Promedio
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
              #1 Top Performer
            </span>
          </div>
          <div className="text-lg font-black text-slate-900 truncate">
            {topDocentes.topMargen ? topDocentes.topMargen.nombreDocente : 'Sin datos'}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-indigo-600">
              {topDocentes.topMargen ? `${topDocentes.topMargen.margenOperativoPromedio}%` : '0%'}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              margen operativo promedio
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>{topDocentes.topMargen?.totalCursos || 0} cursos impartidos</span>
            <span className="font-semibold text-emerald-700">
              {topDocentes.topMargen ? formatearMoneda(topDocentes.topMargen.totalUtilidad, moneda) : 'L 0'} neta
            </span>
          </div>
        </div>

        {/* Top 2: Mayor Volumen de Utilidad Neta */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              Mayor Utilidad Acumulada
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              Volumen Neto
            </span>
          </div>
          <div className="text-lg font-black text-slate-900 truncate">
            {topDocentes.topUtilidad ? topDocentes.topUtilidad.nombreDocente : 'Sin datos'}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-emerald-600">
              {topDocentes.topUtilidad ? formatearMoneda(topDocentes.topUtilidad.totalUtilidad, moneda) : '0'}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>ROI: {topDocentes.topUtilidad?.roiPromedio || 0}%</span>
            <span className="font-semibold text-slate-700">
              {topDocentes.topUtilidad?.totalAlumnos || 0} alumnos
            </span>
          </div>
        </div>

        {/* Top 3: Eficiencia Utilidad por Honorario */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
              Mejor Ratio Honorario
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
              Eficiencia Costo
            </span>
          </div>
          <div className="text-lg font-black text-slate-900 truncate">
            {topDocentes.topEficiencia ? topDocentes.topEficiencia.nombreDocente : 'Sin datos'}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-purple-600">
              {topDocentes.topEficiencia ? `${topDocentes.topEficiencia.multiplicadorUtilidadHonorario}x` : '0x'}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              retorno / honorario
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>Tarifa: {topDocentes.topEficiencia?.tarifaPromedioHora || 0}/h</span>
            <span className="font-semibold text-purple-700">
              {topDocentes.topEficiencia?.margenOperativoPromedio || 0}% margen
            </span>
          </div>
        </div>

        {/* Indicador 4: Benchmark Institucional */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-indigo-400" />
              Meta Institucional
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-indigo-300 border border-white/10">
              Estándar
            </span>
          </div>
          <div className="text-lg font-black text-white">
            Margen Objetivo: 30%
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-indigo-400">
              {topDocentes.margenInstitucionalPromedio}%
            </span>
            <span className="text-xs text-slate-400 font-medium">
              margen promedio global
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>{topDocentes.totalInstructores} instructores en total</span>
            <span className={topDocentes.margenInstitucionalPromedio >= 30 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {topDocentes.margenInstitucionalPromedio >= 30 ? 'Cumple Meta' : 'Bajo Revisión'}
            </span>
          </div>
        </div>

      </div>

      {/* 3. CONTENEDOR PRINCIPAL: GRÁFICO DE TENDENCIA TEMPORAL Y CONTROLES */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        
        {/* Barra superior de configuración del gráfico */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span>Evolución Histórica: Rentabilidad a lo Largo del Tiempo</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Traza la curva de margen operativo (%) y ganancias generadas por cada instructor en cada ciclo mensual.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Modo de Visualización del Gráfico */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setModoVisualizacion('comparativa')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  modoVisualizacion === 'comparativa'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Líneas temporales comparativas de instructores"
              >
                Tendencia Multilínea
              </button>
              <button
                type="button"
                onClick={() => setModoVisualizacion('ranking')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  modoVisualizacion === 'ranking'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Ranking de barras de margen promedio"
              >
                Ranking Comparativo
              </button>
              <button
                type="button"
                onClick={() => setModoVisualizacion('individual')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  modoVisualizacion === 'individual'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Análisis a fondo del docente seleccionado"
              >
                Docente Específico
              </button>
            </div>

            {/* Métrica Seleccionada */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setMetricaActiva('margen')}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  metricaActiva === 'margen'
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Margen Operativo sobre Ventas (%)"
              >
                Margen Operativo (%)
              </button>
              <button
                type="button"
                onClick={() => setMetricaActiva('roi')}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  metricaActiva === 'roi'
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Retorno sobre Inversión Operativa (%)"
              >
                ROI (%)
              </button>
              <button
                type="button"
                onClick={() => setMetricaActiva('utilidad')}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  metricaActiva === 'utilidad'
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Utilidad Neta Real en moneda"
              >
                Utilidad ({moneda})
              </button>
            </div>
          </div>
        </div>

        {/* Selector de Docente cuando está en modo Individual */}
        {modoVisualizacion === 'individual' && (
          <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-700 shrink-0" />
              <span className="font-bold text-indigo-900">
                Selecciona instructor para auditar su trayectoria histórica:
              </span>
            </div>
            <select
              value={docenteSeleccionado || ''}
              onChange={(e) => setDocenteSeleccionado(e.target.value)}
              className="bg-white border border-indigo-300 rounded-lg px-3 py-1.5 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
            >
              {metricasPorDocente.map((d) => (
                <option key={d.nombreDocente} value={d.nombreDocente}>
                  {d.nombreDocente} ({d.margenOperativoPromedio}% margen prom. • {d.totalCursos} cursos)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ÁREA DE GRÁFICO (RECHARTS) */}
        <div className="h-80 sm:h-96 w-full pt-2">
          
          {/* MODO 1: COMPARATIVA MULTILÍNEA TEMPORAL */}
          {modoVisualizacion === 'comparativa' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={datosGraficoTendencia.serieTemporal}
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="etiquetaCorta"
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  unit={metricaActiva === 'utilidad' ? '' : '%'}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => metricaActiva === 'utilidad' ? `${(val / 1000).toFixed(0)}k` : `${val}%`}
                  axisLine={{ stroke: '#cbd5e1' }}
                  domain={metricaActiva === 'utilidad' ? ['auto', 'auto'] : [0, 'auto']}
                />
                <Tooltip
                  formatter={(value: any, name: any) => {
                    if (value === null || value === undefined) return ['Sin cursos impartidos', name];
                    if (metricaActiva === 'utilidad') {
                      return [formatearMoneda(Number(value), moneda), name];
                    }
                    return [`${Number(value).toFixed(1)}%`, name];
                  }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0 && payload[0].payload) {
                      return payload[0].payload.etiquetaMes;
                    }
                    return label;
                  }}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    border: '1px solid #334155',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                />
                
                {/* Línea de Meta 30% Institucional */}
                {metricaActiva !== 'utilidad' && (
                  <ReferenceLine
                    y={30}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: 'Meta SUMMIT (30%)',
                      position: 'insideTopRight',
                      fill: '#d97706',
                      fontSize: 10,
                      fontWeight: 'bold',
                    }}
                  />
                )}

                {/* Líneas por cada docente */}
                {metricasPorDocente.map((doc, idx) => {
                  const keyData = metricaActiva === 'margen' 
                    ? `margen_${doc.nombreDocente}` 
                    : metricaActiva === 'roi'
                    ? `roi_${doc.nombreDocente}`
                    : `utilidad_${doc.nombreDocente}`;

                  const color = datosGraficoTendencia.mapaColores[doc.nombreDocente] || '#4f46e5';

                  return (
                    <Line
                      key={doc.nombreDocente}
                      type="monotone"
                      dataKey={keyData}
                      name={doc.nombreDocente}
                      stroke={color}
                      strokeWidth={2.5}
                      connectNulls={true}
                      dot={{ r: 4, fill: color, strokeWidth: 2, stroke: '#ffffff' }}
                      activeDot={{ r: 6, fill: color }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          )}

          {/* MODO 2: RANKING COMPARATIVO DE BARRAS DE MARGEN OPERATIVO */}
          {modoVisualizacion === 'ranking' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={datosGraficoRanking}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 90, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  unit={metricaActiva === 'utilidad' ? '' : '%'}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => metricaActiva === 'utilidad' ? `${(val / 1000).toFixed(0)}k` : `${val}%`}
                />
                <YAxis
                  dataKey="nombre"
                  type="category"
                  tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 600 }}
                  width={110}
                />
                <Tooltip
                  formatter={(value: any) => {
                    if (metricaActiva === 'utilidad') {
                      return [formatearMoneda(Number(value), moneda), 'Utilidad Total Acumulada'];
                    }
                    if (metricaActiva === 'roi') {
                      return [`${Number(value).toFixed(1)}%`, 'ROI Promedio'];
                    }
                    return [`${Number(value).toFixed(1)}%`, 'Margen Operativo Promedio'];
                  }}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    border: '1px solid #334155',
                    fontSize: '12px',
                  }}
                />
                {metricaActiva !== 'utilidad' && (
                  <ReferenceLine
                    x={30}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    label={{ value: 'Meta (30%)', position: 'top', fill: '#059669', fontSize: 10, fontWeight: 'bold' }}
                  />
                )}
                <Bar
                  dataKey={metricaActiva === 'margen' ? 'margen' : metricaActiva === 'roi' ? 'roi' : 'utilidad'}
                  name={metricaActiva === 'margen' ? 'Margen Operativo (%)' : metricaActiva === 'roi' ? 'ROI (%)' : 'Utilidad'}
                  radius={[0, 6, 6, 0]}
                  maxBarSize={32}
                >
                  {datosGraficoRanking.map((entry, index) => {
                    const color = entry.margen >= 35 
                      ? '#4f46e5' 
                      : entry.margen >= 25 
                      ? '#059669' 
                      : entry.margen >= 15 
                      ? '#d97706' 
                      : '#e11d48';
                    return <Cell key={`cell-doc-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* MODO 3: TENDENCIA INDIVIDUAL DETALLADA DE UN DOCENTE */}
          {modoVisualizacion === 'individual' && docenteEnfocado && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={datosGraficoTendencia.serieTemporal}
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="colorDocenteIndividual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="etiquetaCorta"
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                />
                <YAxis
                  unit={metricaActiva === 'utilidad' ? '' : '%'}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => metricaActiva === 'utilidad' ? `${(val / 1000).toFixed(0)}k` : `${val}%`}
                  domain={[0, 'auto']}
                />
                <Tooltip
                  formatter={(value: any, name: any) => {
                    if (value === null) return ['Sin curso impartido', name];
                    return metricaActiva === 'utilidad' 
                      ? [formatearMoneda(Number(value), moneda), name]
                      : [`${Number(value).toFixed(1)}%`, name];
                  }}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    border: '1px solid #334155',
                    fontSize: '12px',
                  }}
                />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }} />
                
                {metricaActiva !== 'utilidad' && (
                  <ReferenceLine
                    y={30}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    label={{ value: 'Meta Institucional (30%)', position: 'top', fill: '#059669', fontSize: 10 }}
                  />
                )}

                {/* Línea promedio institucional de fondo */}
                <Line
                  type="monotone"
                  dataKey={metricaActiva === 'margen' ? 'promedioInstitucionalMargen' : 'promedioInstitucionalRoi'}
                  name="Promedio General Institución"
                  stroke="#94a3b8"
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                  dot={false}
                />

                {/* Área y Línea del docente seleccionado */}
                <Area
                  type="monotone"
                  dataKey={metricaActiva === 'margen' ? `margen_${docenteEnfocado.nombreDocente}` : metricaActiva === 'roi' ? `roi_${docenteEnfocado.nombreDocente}` : `utilidad_${docenteEnfocado.nombreDocente}`}
                  name={`${docenteEnfocado.nombreDocente}`}
                  stroke="#4f46e5"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorDocenteIndividual)"
                  connectNulls={true}
                  dot={{ r: 5, fill: '#4f46e5', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 7, fill: '#3730a3' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

        </div>

        {/* NOTA METODOLÓGICA Y LEYENDA */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              <span>Alto Margen (≥35%)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <span>Margen Sólido (25-34%)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
              <span>Margen Moderado (15-24%)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
              <span>Margen Comprimido (&lt;15%)</span>
            </span>
          </div>
          <span className="text-[11px] text-slate-400 italic">
            * El Margen Operativo Promedio pondera la utilidad neta final sobre el ingreso total facturado de cada cohorte.
          </span>
        </div>
      </div>

      {/* 4. TABLA CLASIFICATORIA & RANKING DE INSTRUCTORES */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Cabecera de la tabla con buscador y filtros */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>Desglose Consolidado: Margen Operativo por Docente</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifica a los instructores con mayor rentabilidad histórica para priorizar asignaciones docentes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Buscador */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar instructor..."
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 w-36 sm:w-48"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filtro por nivel de margen */}
            <select
              value={filtroNivelMargen}
              onChange={(e) => setFiltroNivelMargen(e.target.value as any)}
              className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="todos">Todos los Niveles</option>
              <option value="alto">Alto Margen (≥30%)</option>
              <option value="medio">Moderado (15-29%)</option>
              <option value="bajo">Bajo (&lt;15%)</option>
            </select>
          </div>
        </div>

        {/* Tabla Responsiva */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Ranking / Instructor</th>
                <th className="px-3 py-3 text-center">Cursos</th>
                <th className="px-3 py-3 text-center">Horas</th>
                <th className="px-3 py-3 text-center">Alumnos</th>
                <th className="px-3 py-3 text-right">Tarifa / Hora</th>
                <th className="px-3 py-3 text-right">Ingresos Totales</th>
                <th className="px-3 py-3 text-right">Utilidad Neta</th>
                <th 
                  className="px-4 py-3 text-right cursor-pointer hover:bg-slate-200/70 transition-colors"
                  onClick={() => {
                    if (ordenarPor === 'margen') setOrdenAsc(!ordenAsc);
                    else { setOrdenarPor('margen'); setOrdenAsc(false); }
                  }}
                  title="Ordenar por Margen Operativo Promedio"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Margen Promedio</span>
                    <ArrowUpDown className="w-3 h-3 text-indigo-600" />
                  </div>
                </th>
                <th className="px-3 py-3 text-center">Tendencia</th>
                <th className="px-3 py-3 text-center">Diagnóstico</th>
                <th className="px-3 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {docentesFiltradosYOrdenados.map((doc, idx) => {
                const esTop1 = idx === 0 && ordenarPor === 'margen' && !ordenAsc;
                const superaMeta = doc.margenOperativoPromedio >= 30;

                return (
                  <tr
                    key={doc.nombreDocente}
                    className="hover:bg-indigo-50/40 transition-colors group cursor-pointer"
                    onClick={() => setDocenteDetalleModal(doc)}
                  >
                    {/* Instructor */}
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                          esTop1
                            ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-800'
                            : idx === 2
                            ? 'bg-amber-700/30 text-amber-900'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{doc.nombreDocente}</span>
                            {esTop1 && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200">
                                Líder
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-normal block">
                            Historial: {formatearEtiquetaCortaMes(doc.primerMes)} - {formatearEtiquetaCortaMes(doc.ultimoMes)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Cursos */}
                    <td className="px-3 py-3 text-center font-bold text-slate-700">
                      {doc.totalCursos}
                    </td>

                    {/* Horas */}
                    <td className="px-3 py-3 text-center font-mono text-slate-600">
                      {doc.totalHoras}h
                    </td>

                    {/* Alumnos */}
                    <td className="px-3 py-3 text-center font-mono text-slate-700">
                      {doc.totalAlumnos}
                    </td>

                    {/* Tarifa / Hora */}
                    <td className="px-3 py-3 text-right font-mono text-slate-700">
                      {formatearMoneda(doc.tarifaPromedioHora, moneda)}/h
                    </td>

                    {/* Ingresos Totales */}
                    <td className="px-3 py-3 text-right font-mono text-slate-700">
                      {formatearMoneda(doc.totalIngresos, moneda)}
                    </td>

                    {/* Utilidad Neta */}
                    <td className="px-3 py-3 text-right font-mono font-bold text-emerald-700">
                      {formatearMoneda(doc.totalUtilidad, moneda)}
                    </td>

                    {/* Margen Operativo Promedio */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`font-mono text-sm font-black ${
                          superaMeta 
                            ? 'text-indigo-700' 
                            : doc.margenOperativoPromedio >= 20 
                            ? 'text-slate-800' 
                            : 'text-rose-600'
                        }`}>
                          {doc.margenOperativoPromedio}%
                        </span>
                        <div className="w-16 bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              superaMeta 
                                ? 'bg-indigo-600' 
                                : doc.margenOperativoPromedio >= 20 
                                ? 'bg-emerald-500' 
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(5, doc.margenOperativoPromedio * 1.5))}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Tendencia */}
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                        doc.tendenciaMargen === 'ascendente'
                          ? 'text-emerald-700'
                          : doc.tendenciaMargen === 'descendente'
                          ? 'text-rose-700'
                          : 'text-slate-500'
                      }`}>
                        {doc.tendenciaMargen === 'ascendente' ? (
                          <>
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                            <span>+{doc.variacionMargenPuntos}%</span>
                          </>
                        ) : doc.tendenciaMargen === 'descendente' ? (
                          <>
                            <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
                            <span>{doc.variacionMargenPuntos}%</span>
                          </>
                        ) : (
                          <>
                            <Minus className="w-3.5 h-3.5 text-slate-400" />
                            <span>Estable</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Diagnóstico */}
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        doc.clasificacion === 'excelente'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : doc.clasificacion === 'solido'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : doc.clasificacion === 'moderado'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        {doc.clasificacion === 'excelente' ? (
                          <>
                            <Sparkles className="w-2.5 h-2.5 text-indigo-600" />
                            Líder (≥35%)
                          </>
                        ) : doc.clasificacion === 'solido' ? (
                          <>
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            Sólido (25-34%)
                          </>
                        ) : doc.clasificacion === 'moderado' ? (
                          <>
                            <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                            Moderado
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                            Crítico
                          </>
                        )}
                      </span>
                    </td>

                    {/* Acción */}
                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDocenteDetalleModal(doc);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Ver Cursos</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* 5. MODAL DE DRILLDOWN: HISTORIAL DETALLADO DE CURSOS DEL DOCENTE */}
      {docenteDetalleModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setDocenteDetalleModal(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">
                      {docenteDetalleModal.nombreDocente}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                      {docenteDetalleModal.clasificacion.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Historial de {docenteDetalleModal.totalCursos} programas académicos impartidos
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDocenteDetalleModal(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* KPIs Rápidos del Docente */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <span className="text-[10px] font-bold text-indigo-700 uppercase block">Margen Operativo</span>
                <span className="text-xl font-black font-mono text-indigo-900">
                  {docenteDetalleModal.margenOperativoPromedio}%
                </span>
              </div>
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Utilidad Acumulada</span>
                <span className="text-xl font-black font-mono text-emerald-900">
                  {formatearMoneda(docenteDetalleModal.totalUtilidad, moneda)}
                </span>
              </div>
              <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                <span className="text-[10px] font-bold text-purple-700 uppercase block">Alumnos Totales</span>
                <span className="text-xl font-black font-mono text-purple-900">
                  {docenteDetalleModal.totalAlumnos}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-600 uppercase block">Tarifa Promedio</span>
                <span className="text-xl font-black font-mono text-slate-800">
                  {formatearMoneda(docenteDetalleModal.tarifaPromedioHora, moneda)}/h
                </span>
              </div>
            </div>

            {/* Listado de Proyectos Específicos del Docente */}
            <div className="mt-4">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                <span>Programas en el Historial</span>
              </h5>

              <div className="space-y-2">
                {docenteDetalleModal.proyectos.map((p) => {
                  const margenProyecto = p.ingresoRealTotal && p.ingresoRealTotal > 0
                    ? Number(((p.totalGananciasFinales / p.ingresoRealTotal) * 100).toFixed(1))
                    : p.margenGananciaOperativa;
                  const fechaEtiqueta = p.fechaProgramacion || p.fechaVenta || 'Fecha no registrada';

                  return (
                    <div
                      key={p.id}
                      className="p-3.5 bg-slate-50 hover:bg-indigo-50/40 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-indigo-700 uppercase">
                            {p.tipoProyecto}
                          </span>
                          <span className="text-[10px] text-slate-400">• {fechaEtiqueta}</span>
                        </div>
                        <h6 className="text-xs font-bold text-slate-900 mt-0.5">
                          {p.nombreProyecto}
                        </h6>
                        <span className="text-[11px] text-slate-500">
                          {p.horasClase} horas • {p.alumnosFinal} inscritos • Tarifa {formatearMoneda(p.tarifaHoraDocente || 200, moneda)}/h
                        </span>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Utilidad Neta</span>
                          <span className="font-bold font-mono text-emerald-700 text-xs">
                            {formatearMoneda(p.totalGananciasFinales, moneda)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Margen</span>
                          <span className={`font-black font-mono text-xs ${
                            margenProyecto >= 30 ? 'text-indigo-700' : 'text-slate-800'
                          }`}>
                            {margenProyecto}%
                          </span>
                        </div>
                        {onVerDetalle && (
                          <button
                            type="button"
                            onClick={() => {
                              onVerDetalle(p);
                              setDocenteDetalleModal(null);
                            }}
                            className="px-2 py-1 bg-white border border-slate-300 hover:border-indigo-400 rounded-lg text-[11px] font-bold text-indigo-700 transition-colors cursor-pointer"
                          >
                            Ver Ficha
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recomendación Estratégica Automática */}
            <div className="mt-5 p-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 text-xs">
              <div className="font-bold text-indigo-950 flex items-center gap-1.5 mb-1">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Dictamen Estratégico de Asignación Docente</span>
              </div>
              <p className="text-indigo-900/90 leading-relaxed text-[11px]">
                {docenteDetalleModal.margenOperativoPromedio >= 35 ? (
                  `Instructor de Alto Margen: ${docenteDetalleModal.nombreDocente} promedia un margen operativo excepcional del ${docenteDetalleModal.margenOperativoPromedio}%. Genera ${docenteDetalleModal.multiplicadorUtilidadHonorario}x veces su honorario en utilidad neta. Se recomienda prioritariamente para aperturas de nuevas cohortes corporativas y diplomados de alta demanda.`
                ) : docenteDetalleModal.margenOperativoPromedio >= 25 ? (
                  `Instructor Sólido: Margen promedio del ${docenteDetalleModal.margenOperativoPromedio}%, cumpliendo satisfactoriamente los estándares institucionales. Rentabilidad constante con buen aforo de alumnos.`
                ) : (
                  `Margen Sensible: Su margen del ${docenteDetalleModal.margenOperativoPromedio}% requiere monitoreo de cupo mínimo. Se sugiere elevar la meta de alumnos de equilibrio o ajustar el precio sugerido por participante antes de aperturar nuevos módulos.`
                )}
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
