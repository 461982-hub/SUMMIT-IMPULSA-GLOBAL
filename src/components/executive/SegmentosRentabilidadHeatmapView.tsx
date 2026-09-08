import React, { useState, useMemo } from 'react';
import {
  Flame,
  Layers,
  TrendingUp,
  BarChart3,
  Target,
  Award,
  Sparkles,
  Filter,
  Download,
  Info,
  ChevronRight,
  Eye,
  Edit3,
  GraduationCap,
  Briefcase,
  BookOpen,
  Users,
  DollarSign,
  Percent,
  ShieldAlert,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Compass,
  HelpCircle,
  Lightbulb,
  ArrowUpRight,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import { ProyectoEducativo, Moneda, TipoProyecto, NivelProyecto } from '../../types';
import { formatearMoneda } from '../../utils/calculations';

interface SegmentosRentabilidadHeatmapViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onVerDetalle?: (p: ProyectoEducativo) => void;
  onEditarProyecto?: (p: ProyectoEducativo) => void;
  embedded?: boolean;
}

export type MetricaCalor = 
  | 'margen_operativo' 
  | 'roi' 
  | 'utilidad_neta' 
  | 'ingresos' 
  | 'alumnos' 
  | 'cursos';

export type ModoNiveles = 'core' | 'todos';

interface CeldaSegmento {
  tipo: string;
  tipoCorto: string;
  tipoIcono: React.ReactNode;
  nivel: string;
  cursosCount: number;
  alumnosTotal: number;
  alumnosPromedio: number;
  ingresosTotal: number;
  gastosTotal: number;
  utilidadTotal: number;
  margenOperativoReal: number;
  margenObjetivoPromedio: number;
  roiPromedio: number;
  proyectos: ProyectoEducativo[];
  clasificacion: 'estrella' | 'solido' | 'moderado' | 'riesgo' | 'deficit' | 'vacio';
}

interface ResumenMarginal {
  cursos: number;
  alumnos: number;
  ingresos: number;
  gastos: number;
  utilidad: number;
  margen: number;
  roi: number;
}

const NIVELES_CORE: NivelProyecto[] = ['Básico', 'Intermedio', 'Avanzado'];

const TIPOS_INSTITUCIONALES_BASE: { tipo: TipoProyecto; corto: string; descripcion: string }[] = [
  {
    tipo: 'Capacitación profesional / Mentoría ejecutiva',
    corto: 'Capacitación Profesional',
    descripcion: 'Diplomados, mentorías ejecutivas y especialización técnica',
  },
  {
    tipo: 'Formación académica acreditada (ej. convenios universitarios)',
    corto: 'Acreditada (Universitaria)',
    descripcion: 'Cursos con respaldo académico universitario exentos de ISV',
  },
  {
    tipo: 'Servicios educativos no acreditados (talleres, cursos libres)',
    corto: 'Talleres / Cursos Libres',
    descripcion: 'Programas cortos, workshops prácticos y habilidades rápidas',
  },
  {
    tipo: 'Consultoría empresarial',
    corto: 'Consultoría Empresarial',
    descripcion: 'Asesoría a medida para organizaciones y equipos corporativos',
  },
  {
    tipo: 'Intermediación laboral / servicios de RRHH',
    corto: 'Intermediación / RRHH',
    descripcion: 'Bolsas de empleo, reclutamiento y certificación de talento',
  },
  {
    tipo: 'Servicios administrativos / gestión de proyectos',
    corto: 'Gestión de Proyectos',
    descripcion: 'PMO, administración operativa y soporte organizacional',
  },
];

export const SegmentosRentabilidadHeatmapView: React.FC<SegmentosRentabilidadHeatmapViewProps> = ({
  proyectos,
  moneda,
  onVerDetalle,
  onEditarProyecto,
  embedded = false,
}) => {
  // Filtros y Estados
  const [metricaActiva, setMetricaActiva] = useState<MetricaCalor>('margen_operativo');
  const [modoNiveles, setModoNiveles] = useState<ModoNiveles>('core');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroDocente, setFiltroDocente] = useState<string>('todos');
  const [celdaSeleccionada, setCeldaSeleccionada] = useState<CeldaSegmento | null>(null);
  const [mostrarModalAyuda, setMostrarModalAyuda] = useState<boolean>(false);
  const [soloConCursos, setSoloConCursos] = useState<boolean>(false);

  // Lista de docentes únicos para filtro
  const listaDocentes = useMemo(() => {
    const docs = Array.from(new Set(proyectos.map((p) => (p.nombreDocente || '').trim()).filter(Boolean)));
    return docs.sort();
  }, [proyectos]);

  // Filtrado de proyectos base
  const proyectosFiltrados = useMemo(() => {
    return proyectos.filter((p) => {
      // Estado
      if (filtroEstado !== 'todos') {
        if (filtroEstado === 'listos') {
          if (!(p.seLlevoACabo === 'Listo' || p.seLlevoACabo === 'Sí' || p.seLlevoACabo === 'Realizar')) return false;
        } else if (filtroEstado === 'proceso') {
          if (!(p.seLlevoACabo === 'En proceso' || p.seLlevoACabo === 'Planificado' || p.seLlevoACabo === 'En curso')) return false;
        } else if (filtroEstado === 'concluidos') {
          if (p.seLlevoACabo === 'Cancelado' || p.seLlevoACabo === 'Denegado' || p.seLlevoACabo === 'No') return false;
        }
      }

      // Docente
      if (filtroDocente !== 'todos') {
        if ((p.nombreDocente || '').trim() !== filtroDocente) return false;
      }

      return true;
    });
  }, [proyectos, filtroEstado, filtroDocente]);

  // Niveles a desplegar en las columnas
  const nivelesVisibles = useMemo(() => {
    if (modoNiveles === 'core') {
      return NIVELES_CORE;
    }
    // Incluir otros niveles que existan en los proyectos (ej: Especializado, Todos los niveles)
    const otros = Array.from(
      new Set(
        proyectosFiltrados
          .map((p) => p.nivel as NivelProyecto)
          .filter((n) => n && !NIVELES_CORE.includes(n))
      )
    );
    return [...NIVELES_CORE, ...otros];
  }, [modoNiveles, proyectosFiltrados]);

  // Tipos de proyectos a desplegar en las filas
  const tiposVisibles = useMemo(() => {
    // Tomar los tipos institucionales conocidos
    const conocidos = TIPOS_INSTITUCIONALES_BASE.map((t) => t.tipo);
    // Tomar los tipos adicionales presentes en los proyectos
    const extras: string[] = Array.from(
      new Set(
        proyectosFiltrados
          .map((p) => String(p.tipoProyecto || ''))
          .filter((t) => Boolean(t) && !conocidos.includes(t))
      )
    );

    const todos = [
      ...TIPOS_INSTITUCIONALES_BASE,
      ...extras.map((t: string) => ({
        tipo: t,
        corto: t.length > 24 ? `${t.slice(0, 22)}...` : t,
        descripcion: 'Tipología adicional registrada en la institución',
      })),
    ];

    if (soloConCursos) {
      return todos.filter((item) =>
        proyectosFiltrados.some((p) => (p.tipoProyecto || '').trim() === item.tipo.trim())
      );
    }

    return todos;
  }, [proyectosFiltrados, soloConCursos]);

  // Función para obtener icono del tipo
  const getTipoIcon = (tipo: string) => {
    const t = tipo.toLowerCase();
    if (t.includes('capacitación') || t.includes('mentoría')) {
      return <Briefcase className="w-4 h-4 text-indigo-600" />;
    }
    if (t.includes('acreditada') || t.includes('universitarios')) {
      return <GraduationCap className="w-4 h-4 text-emerald-600" />;
    }
    if (t.includes('no acreditados') || t.includes('talleres') || t.includes('libres')) {
      return <BookOpen className="w-4 h-4 text-amber-600" />;
    }
    if (t.includes('consultoría')) {
      return <Target className="w-4 h-4 text-blue-600" />;
    }
    if (t.includes('intermediación') || t.includes('rrhh')) {
      return <Users className="w-4 h-4 text-purple-600" />;
    }
    return <Layers className="w-4 h-4 text-slate-600" />;
  };

  // Matriz cruzada calculada (Tipo x Nivel)
  const matrizCalculada = useMemo(() => {
    const matriz: Record<string, Record<string, CeldaSegmento>> = {};

    tiposVisibles.forEach((tipoItem) => {
      matriz[tipoItem.tipo] = {};

      nivelesVisibles.forEach((nivel) => {
        const matching = proyectosFiltrados.filter(
          (p) => (p.tipoProyecto || '').trim() === tipoItem.tipo.trim() && p.nivel === nivel
        );

        const cursosCount = matching.length;
        const alumnosTotal = matching.reduce((acc, p) => acc + (Number(p.alumnosFinal) || 0), 0);
        const alumnosPromedio = cursosCount > 0 ? Number((alumnosTotal / cursosCount).toFixed(1)) : 0;
        
        const ingresosTotal = matching.reduce(
          (acc, p) => acc + (Number(p.ingresoRealTotal) || Number(p.ingresoTotalNeto) || 0),
          0
        );
        const gastosTotal = matching.reduce(
          (acc, p) => acc + (Number(p.gastoTotalOperativo) || 0),
          0
        );
        const utilidadTotal = matching.reduce(
          (acc, p) => acc + (Number(p.totalGananciasFinales) || 0),
          0
        );

        const margenOperativoReal = ingresosTotal > 0
          ? Number(((utilidadTotal / ingresosTotal) * 100).toFixed(1))
          : 0;

        const margenObjetivoPromedio = cursosCount > 0
          ? Number(
              (
                matching.reduce((acc, p) => acc + (Number(p.margenGananciaOperativa) || 0), 0) /
                cursosCount
              ).toFixed(1)
            )
          : 0;

        const roiPromedio = gastosTotal > 0
          ? Number(((utilidadTotal / gastosTotal) * 100).toFixed(1))
          : 0;

        let clasificacion: CeldaSegmento['clasificacion'] = 'vacio';
        if (cursosCount > 0) {
          if (utilidadTotal < 0 || margenOperativoReal < 0) {
            clasificacion = 'deficit';
          } else if (margenOperativoReal >= 35) {
            clasificacion = 'estrella';
          } else if (margenOperativoReal >= 25) {
            clasificacion = 'solido';
          } else if (margenOperativoReal >= 15) {
            clasificacion = 'moderado';
          } else {
            clasificacion = 'riesgo';
          }
        }

        matriz[tipoItem.tipo][nivel] = {
          tipo: tipoItem.tipo,
          tipoCorto: tipoItem.corto,
          tipoIcono: getTipoIcon(tipoItem.tipo),
          nivel,
          cursosCount,
          alumnosTotal,
          alumnosPromedio,
          ingresosTotal,
          gastosTotal,
          utilidadTotal,
          margenOperativoReal,
          margenObjetivoPromedio,
          roiPromedio,
          proyectos: matching,
          clasificacion,
        };
      });
    });

    return matriz;
  }, [tiposVisibles, nivelesVisibles, proyectosFiltrados]);

  // Resumen Marginal por Tipo (Filas)
  const totalesPorTipo = useMemo(() => {
    const resumen: Record<string, ResumenMarginal> = {};

    tiposVisibles.forEach((t) => {
      let cursos = 0;
      let alumnos = 0;
      let ingresos = 0;
      let gastos = 0;
      let utilidad = 0;

      nivelesVisibles.forEach((n) => {
        const celda = matrizCalculada[t.tipo]?.[n];
        if (celda) {
          cursos += celda.cursosCount;
          alumnos += celda.alumnosTotal;
          ingresos += celda.ingresosTotal;
          gastos += celda.gastosTotal;
          utilidad += celda.utilidadTotal;
        }
      });

      const margen = ingresos > 0 ? Number(((utilidad / ingresos) * 100).toFixed(1)) : 0;
      const roi = gastos > 0 ? Number(((utilidad / gastos) * 100).toFixed(1)) : 0;

      resumen[t.tipo] = { cursos, alumnos, ingresos, gastos, utilidad, margen, roi };
    });

    return resumen;
  }, [tiposVisibles, nivelesVisibles, matrizCalculada]);

  // Resumen Marginal por Nivel (Columnas)
  const totalesPorNivel = useMemo(() => {
    const resumen: Record<string, ResumenMarginal> = {};

    nivelesVisibles.forEach((n) => {
      let cursos = 0;
      let alumnos = 0;
      let ingresos = 0;
      let gastos = 0;
      let utilidad = 0;

      tiposVisibles.forEach((t) => {
        const celda = matrizCalculada[t.tipo]?.[n];
        if (celda) {
          cursos += celda.cursosCount;
          alumnos += celda.alumnosTotal;
          ingresos += celda.ingresosTotal;
          gastos += celda.gastosTotal;
          utilidad += celda.utilidadTotal;
        }
      });

      const margen = ingresos > 0 ? Number(((utilidad / ingresos) * 100).toFixed(1)) : 0;
      const roi = gastos > 0 ? Number(((utilidad / gastos) * 100).toFixed(1)) : 0;

      resumen[n] = { cursos, alumnos, ingresos, gastos, utilidad, margen, roi };
    });

    return resumen;
  }, [nivelesVisibles, tiposVisibles, matrizCalculada]);

  // Consolidado Institucional Total
  const consolidadoGlobal = useMemo(() => {
    let cursos = 0;
    let alumnos = 0;
    let ingresos = 0;
    let gastos = 0;
    let utilidad = 0;

    Object.values(totalesPorNivel).forEach((val: ResumenMarginal) => {
      cursos += val.cursos;
      alumnos += val.alumnos;
      ingresos += val.ingresos;
      gastos += val.gastos;
      utilidad += val.utilidad;
    });

    const margen = ingresos > 0 ? Number(((utilidad / ingresos) * 100).toFixed(1)) : 0;
    const roi = gastos > 0 ? Number(((utilidad / gastos) * 100).toFixed(1)) : 0;

    return { cursos, alumnos, ingresos, gastos, utilidad, margen, roi };
  }, [totalesPorNivel]);

  // Lista aplanada de todos los segmentos con cursos para rankings
  const segmentosConCursos = useMemo(() => {
    const lista: CeldaSegmento[] = [];
    tiposVisibles.forEach((t) => {
      nivelesVisibles.forEach((n) => {
        const c = matrizCalculada[t.tipo]?.[n];
        if (c && c.cursosCount > 0) {
          lista.push(c);
        }
      });
    });
    return lista;
  }, [tiposVisibles, nivelesVisibles, matrizCalculada]);

  // Top Segmentos Más Rentables (por margen operativo %)
  const rankingMargen = useMemo(() => {
    return [...segmentosConCursos].sort((a, b) => b.margenOperativoReal - a.margenOperativoReal);
  }, [segmentosConCursos]);

  // Top Segmento por Volumen de Facturación
  const rankingFacturacion = useMemo(() => {
    return [...segmentosConCursos].sort((a, b) => b.ingresosTotal - a.ingresosTotal);
  }, [segmentosConCursos]);

  // Segmentos en Riesgo / Déficit
  const segmentosEnRiesgo = useMemo(() => {
    return segmentosConCursos.filter(
      (s) => s.margenOperativoReal < 15 || s.utilidadTotal < 0
    );
  }, [segmentosConCursos]);

  // Segmentos Vacíos con Potencial (Gaps de Cartera)
  const segmentosVacios = useMemo(() => {
    const vacios: { tipo: string; tipoCorto: string; nivel: string }[] = [];
    tiposVisibles.forEach((t) => {
      nivelesVisibles.forEach((n) => {
        const c = matrizCalculada[t.tipo]?.[n];
        if (!c || c.cursosCount === 0) {
          vacios.push({ tipo: t.tipo, tipoCorto: t.corto, nivel: n });
        }
      });
    });
    return vacios;
  }, [tiposVisibles, nivelesVisibles, matrizCalculada]);

  // Hallazgo Principal: Nivel más rentable vs Tipo más rentable
  const diagnostiGlobal = useMemo(() => {
    const nivelesArray = (Object.entries(totalesPorNivel) as [string, ResumenMarginal][]).filter(([, v]) => v.cursos > 0);
    const tiposArray = (Object.entries(totalesPorTipo) as [string, ResumenMarginal][]).filter(([, v]) => v.cursos > 0);

    const nivelTop = nivelesArray.sort((a, b) => b[1].margen - a[1].margen)[0];
    const tipoTop = tiposArray.sort((a, b) => b[1].margen - a[1].margen)[0];

    return {
      nivelLider: nivelTop ? { nivel: nivelTop[0], ...nivelTop[1] } : null,
      tipoLider: tipoTop
        ? {
            tipo: tipoTop[0],
            nombreCorto:
              TIPOS_INSTITUCIONALES_BASE.find((t) => t.tipo === tipoTop[0])?.corto || tipoTop[0],
            ...tipoTop[1],
          }
        : null,
    };
  }, [totalesPorNivel, totalesPorTipo]);

  // Función de estilo y color según el valor de la métrica en la celda
  const getEstiloCelda = (celda: CeldaSegmento) => {
    if (celda.cursosCount === 0) {
      return {
        bg: 'bg-slate-50/80 hover:bg-slate-100/80 text-slate-400 border border-dashed border-slate-200',
        badge: 'text-slate-400 bg-slate-100',
        valorText: 'text-slate-300 font-medium',
        tag: 'Sin Cursos',
        tagColor: 'bg-slate-100 text-slate-500',
      };
    }

    if (metricaActiva === 'margen_operativo' || metricaActiva === 'roi') {
      const valor = metricaActiva === 'margen_operativo' ? celda.margenOperativoReal : celda.roiPromedio;

      if (valor < 0) {
        return {
          bg: 'bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-900 shadow-2xs',
          badge: 'text-rose-800 bg-rose-200/80',
          valorText: 'text-rose-700 font-black',
          tag: 'Déficit',
          tagColor: 'bg-rose-600 text-white',
        };
      }
      if (valor >= 35) {
        return {
          bg: 'bg-emerald-600 hover:bg-emerald-700 border border-emerald-600 text-white shadow-xs',
          badge: 'text-emerald-950 bg-emerald-100 font-bold',
          valorText: 'text-white font-black',
          tag: '⭐ Estrella',
          tagColor: 'bg-emerald-900/80 text-emerald-100 border border-emerald-400/40',
        };
      }
      if (valor >= 28) {
        return {
          bg: 'bg-emerald-500 hover:bg-emerald-600 border border-emerald-500 text-white shadow-xs',
          badge: 'text-emerald-900 bg-white font-bold',
          valorText: 'text-white font-black',
          tag: 'Óptimo',
          tagColor: 'bg-emerald-800/80 text-emerald-100',
        };
      }
      if (valor >= 20) {
        return {
          bg: 'bg-emerald-100 hover:bg-emerald-200/90 border border-emerald-300 text-emerald-950 shadow-2xs',
          badge: 'text-emerald-800 bg-emerald-200',
          valorText: 'text-emerald-900 font-black',
          tag: 'Sólido',
          tagColor: 'bg-emerald-700 text-white',
        };
      }
      if (valor >= 10) {
        return {
          bg: 'bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 shadow-2xs',
          badge: 'text-amber-800 bg-amber-200',
          valorText: 'text-amber-900 font-black',
          tag: 'Moderado',
          tagColor: 'bg-amber-600 text-white',
        };
      }
      return {
        bg: 'bg-orange-100 hover:bg-orange-200 border border-orange-300 text-orange-950 shadow-2xs',
        badge: 'text-orange-800 bg-orange-200',
        valorText: 'text-orange-900 font-black',
        tag: 'Bajo Margen',
        tagColor: 'bg-orange-600 text-white',
      };
    }

    // Para métricas de dinero o conteo
    if (metricaActiva === 'utilidad_neta') {
      if (celda.utilidadTotal < 0) {
        return {
          bg: 'bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-900',
          badge: 'text-rose-800 bg-rose-200',
          valorText: 'text-rose-700 font-black',
          tag: 'Pérdida',
          tagColor: 'bg-rose-600 text-white',
        };
      }
      return {
        bg: 'bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-950',
        badge: 'text-indigo-800 bg-indigo-200',
        valorText: 'text-indigo-900 font-black',
        tag: 'Rentable',
        tagColor: 'bg-indigo-700 text-white',
      };
    }

    return {
      bg: 'bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-950',
      badge: 'text-purple-800 bg-purple-200',
      valorText: 'text-purple-900 font-black',
      tag: 'Activo',
      tagColor: 'bg-purple-700 text-white',
    };
  };

  // Formato del valor principal desplegado en la celda
  const formatearValorMetrica = (celda: CeldaSegmento) => {
    if (celda.cursosCount === 0) return '—';

    switch (metricaActiva) {
      case 'margen_operativo':
        return `${celda.margenOperativoReal.toFixed(1)}%`;
      case 'roi':
        return `${celda.roiPromedio.toFixed(1)}%`;
      case 'utilidad_neta':
        return formatearMoneda(celda.utilidadTotal, moneda);
      case 'ingresos':
        return formatearMoneda(celda.ingresosTotal, moneda);
      case 'alumnos':
        return `${celda.alumnosTotal} alum.`;
      case 'cursos':
        return `${celda.cursosCount} prog.`;
      default:
        return `${celda.margenOperativoReal.toFixed(1)}%`;
    }
  };

  // Exportar matriz a CSV
  const handleExportarCSV = () => {
    const encabezados = ['Tipo de Programa', ...nivelesVisibles, 'Total Cursos', 'Total Alumnos', 'Ingresos Netos', 'Gastos Totales', 'Utilidad Neta', 'Margen Real (%)', 'ROI Promedio (%)'];
    
    const filas = tiposVisibles.map((t) => {
      const resumenT = totalesPorTipo[t.tipo] || { cursos: 0, alumnos: 0, ingresos: 0, gastos: 0, utilidad: 0, margen: 0, roi: 0 };
      
      const valoresNiveles = nivelesVisibles.map((n) => {
        const c = matrizCalculada[t.tipo]?.[n];
        if (!c || c.cursosCount === 0) return 'Sin cursos';
        return `${c.margenOperativoReal}% (${c.cursosCount} cursos - ${c.alumnosTotal} alum.)`;
      });

      return [
        `"${t.tipo.replace(/"/g, '""')}"`,
        ...valoresNiveles.map((v) => `"${v}"`),
        resumenT.cursos,
        resumenT.alumnos,
        resumenT.ingresos,
        resumenT.gastos,
        resumenT.utilidad,
        `${resumenT.margen}%`,
        `${resumenT.roi}%`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [encabezados.join(','), ...filas].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SUMMIT_Mapa_Calor_Rentabilidad_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-6 ${embedded ? '' : 'p-1 sm:p-2'}`}>
      {/* 1. Encabezado Ejecutivo & Diagnóstico Global */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 bg-orange-500/20 text-orange-400 rounded-xl border border-orange-500/30">
                <Flame className="w-6 h-6" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    Mapa de Calor de Rentabilidad (Heatmap)
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500 text-white shadow-2xs">
                    Nivel × Tipo de Curso
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Matriz cruzada institucional para identificar al instante los segmentos educativos más rentables y optimizar la cartera.
                </p>
              </div>
            </div>
          </div>

          {/* Acciones del Encabezado */}
          <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setMostrarModalAyuda(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-purple-300" />
              <span>Guía de Interpretación</span>
            </button>
            <button
              type="button"
              onClick={handleExportarCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all cursor-pointer"
              title="Descargar matriz en formato CSV para Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Diagnóstico Sintético Automático */}
        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Nivel Más Rentable</span>
              <span className="font-bold text-white text-sm font-mono">
                {diagnostiGlobal.nivelLider
                  ? `${diagnostiGlobal.nivelLider.nivel} (${diagnostiGlobal.nivelLider.margen}% margen)`
                  : 'Sin datos suficientes'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Línea de Curso Líder</span>
              <span className="font-bold text-white text-sm font-mono truncate block max-w-[200px]" title={diagnostiGlobal.tipoLider?.tipo}>
                {diagnostiGlobal.tipoLider
                  ? `${diagnostiGlobal.tipoLider.nombreCorto} (${diagnostiGlobal.tipoLider.margen}%)`
                  : 'Sin datos'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Segmento Estrella #1</span>
              <span className="font-bold text-white text-sm font-mono truncate block max-w-[200px]" title={rankingMargen[0] ? `${rankingMargen[0].tipoCorto} (${rankingMargen[0].nivel})` : ''}>
                {rankingMargen[0]
                  ? `${rankingMargen[0].tipoCorto} • ${rankingMargen[0].nivel} (${rankingMargen[0].margenOperativoReal}%)`
                  : 'Sin datos'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Barra de Control: Métrica Térmica, Filtro de Niveles y Estados */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Selector de Métrica Térmica */}
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span>Colorear Mapa Según:</span>
            </span>
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setMetricaActiva('margen_operativo')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  metricaActiva === 'margen_operativo'
                    ? 'bg-white text-orange-950 shadow-xs ring-1 ring-orange-500/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                % Margen Operativo Real
              </button>
              <button
                type="button"
                onClick={() => setMetricaActiva('roi')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  metricaActiva === 'roi'
                    ? 'bg-white text-indigo-950 shadow-xs ring-1 ring-indigo-500/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                % Retorno ROI
              </button>
              <button
                type="button"
                onClick={() => setMetricaActiva('utilidad_neta')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  metricaActiva === 'utilidad_neta'
                    ? 'bg-white text-emerald-950 shadow-xs ring-1 ring-emerald-500/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Utilidad Neta ({moneda})
              </button>
              <button
                type="button"
                onClick={() => setMetricaActiva('ingresos')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  metricaActiva === 'ingresos'
                    ? 'bg-white text-blue-950 shadow-xs ring-1 ring-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ingresos Facturados
              </button>
              <button
                type="button"
                onClick={() => setMetricaActiva('alumnos')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  metricaActiva === 'alumnos'
                    ? 'bg-white text-purple-950 shadow-xs ring-1 ring-purple-500/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Alumnos Inscritos
              </button>
              <button
                type="button"
                onClick={() => setMetricaActiva('cursos')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  metricaActiva === 'cursos'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cantidad Cursos
              </button>
            </div>
          </div>

          {/* Filtros de Alcance */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Modo Niveles: Core (Básico, Intermedio, Avanzado) vs Todos */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setModoNiveles('core')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  modoNiveles === 'core'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Básico, Intermedio y Avanzado"
              >
                Core (3 Niveles)
              </button>
              <button
                type="button"
                onClick={() => setModoNiveles('todos')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  modoNiveles === 'todos'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Incluye Especializado y Todos los niveles si existen"
              >
                Todos los Niveles
              </button>
            </div>

            {/* Filtro por Estado */}
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 cursor-pointer"
            >
              <option value="todos">Todos los Estados</option>
              <option value="listos">Solo Listos / Ejecutados</option>
              <option value="proceso">En Proceso / Planificados</option>
            </select>

            {/* Filtro por Docente */}
            {listaDocentes.length > 1 && (
              <select
                value={filtroDocente}
                onChange={(e) => setFiltroDocente(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 cursor-pointer max-w-[150px]"
              >
                <option value="todos">Todos los Docentes</option>
                {listaDocentes.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}

            {/* Toggle solo con cursos */}
            <button
              type="button"
              onClick={() => setSoloConCursos(!soloConCursos)}
              className={`px-2.5 py-1.5 rounded-xl font-semibold border transition-all cursor-pointer ${
                soloConCursos
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {soloConCursos ? 'Filas Activas' : 'Todas las Filas'}
            </button>
          </div>
        </div>

        {/* Leyenda Visual de la Escala Térmica */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-bold mr-1">Escala de Margen:</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[11px]">
              &ge;35% Estrella
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white font-bold text-[11px]">
              28% - 34% Óptimo
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-[11px]">
              20% - 27% Sólido
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px]">
              10% - 19% Moderado
            </span>
            <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-900 border border-orange-300 font-bold text-[11px]">
              0% - 9% Bajo
            </span>
            <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300 font-bold text-[11px]">
              &lt;0% Déficit
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-400 border border-dashed border-slate-200 text-[11px]">
              — Sin Cursos
            </span>
          </div>

          <span className="text-[11px] text-slate-400 italic">
            * Haz clic en cualquier celda para abrir el detalle completo del segmento.
          </span>
        </div>
      </div>

      {/* 3. Matriz del Mapa de Calor (Heatmap Table) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider">
                <th className="p-3.5 pl-5 font-bold border-b border-slate-800 w-[240px]">
                  Tipo de Programa / Modalidad
                </th>
                {nivelesVisibles.map((nivel) => (
                  <th
                    key={nivel}
                    className="p-3.5 text-center font-black border-b border-slate-800 min-w-[130px]"
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-white text-xs">{nivel}</span>
                      <span className="text-[10px] text-indigo-300 font-normal lowercase tracking-normal">
                        Nivel Académico
                      </span>
                    </div>
                  </th>
                ))}
                <th className="p-3.5 pr-5 text-right font-black border-b border-slate-800 bg-slate-950 w-[150px]">
                  <div className="flex flex-col items-end">
                    <span className="text-amber-300 text-xs">Total Tipo</span>
                    <span className="text-[10px] text-slate-400 font-normal tracking-normal lowercase">
                      Consolidado Fila
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {tiposVisibles.map((t) => {
                const resumenFila = totalesPorTipo[t.tipo] || {
                  cursos: 0,
                  alumnos: 0,
                  ingresos: 0,
                  gastos: 0,
                  utilidad: 0,
                  margen: 0,
                  roi: 0,
                };

                return (
                  <tr key={t.tipo} className="hover:bg-slate-50/50 transition-colors">
                    {/* Etiqueta de la Fila (Tipo de Curso) */}
                    <td className="p-3.5 pl-5 font-semibold text-slate-900 bg-slate-50/40 border-r border-slate-100">
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 p-1 rounded-md bg-white border border-slate-200 shadow-2xs shrink-0">
                          {getTipoIcon(t.tipo)}
                        </span>
                        <div>
                          <span className="font-bold text-slate-900 text-xs block">
                            {t.corto}
                          </span>
                          <span className="text-[10px] text-slate-400 line-clamp-1 font-normal" title={t.descripcion}>
                            {t.descripcion}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Celdas del Heatmap por cada Nivel */}
                    {nivelesVisibles.map((nivel) => {
                      const celda = matrizCalculada[t.tipo]?.[nivel] || {
                        tipo: t.tipo,
                        tipoCorto: t.corto,
                        tipoIcono: getTipoIcon(t.tipo),
                        nivel,
                        cursosCount: 0,
                        alumnosTotal: 0,
                        alumnosPromedio: 0,
                        ingresosTotal: 0,
                        gastosTotal: 0,
                        utilidadTotal: 0,
                        margenOperativoReal: 0,
                        margenObjetivoPromedio: 0,
                        roiPromedio: 0,
                        proyectos: [],
                        clasificacion: 'vacio',
                      };

                      const estilo = getEstiloCelda(celda);
                      const tieneCursos = celda.cursosCount > 0;

                      return (
                        <td
                          key={nivel}
                          onClick={() => {
                            if (tieneCursos) setCeldaSeleccionada(celda);
                          }}
                          className={`p-3 text-center transition-all border-r border-slate-100 ${
                            tieneCursos ? 'cursor-pointer hover:scale-[1.02] transform' : 'cursor-default'
                          }`}
                        >
                          <div
                            className={`p-2.5 rounded-xl transition-all flex flex-col items-center justify-center min-h-[78px] ${estilo.bg}`}
                          >
                            {/* Valor Principal */}
                            <span className={`text-base tracking-tight font-mono ${estilo.valorText}`}>
                              {formatearValorMetrica(celda)}
                            </span>

                            {/* Detalle Secundario */}
                            {tieneCursos ? (
                              <div className="mt-1 flex flex-col items-center gap-0.5">
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${estilo.badge}`}>
                                  {celda.cursosCount} {celda.cursosCount === 1 ? 'curso' : 'cursos'} • {celda.alumnosTotal} alum.
                                </span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md mt-0.5 ${estilo.tagColor}`}>
                                  {estilo.tag}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 mt-1 italic">
                                Sin oferta
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    {/* Columna Marginal: Total por Tipo de Curso */}
                    <td className="p-3 pr-5 text-right bg-slate-50/70 border-l border-slate-200">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-black font-mono text-indigo-900">
                          {resumenFila.cursos > 0 ? `${resumenFila.margen}% margen` : '—'}
                        </span>
                        <span className="text-[11px] font-bold text-slate-600 font-mono">
                          {resumenFila.cursos > 0 ? formatearMoneda(resumenFila.utilidad, moneda) : '—'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {resumenFila.cursos} cursos • {resumenFila.alumnos} alum.
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Fila Marginal Inferior: Totales por Nivel */}
              <tr className="bg-slate-900 text-white font-bold border-t-2 border-slate-800">
                <td className="p-3.5 pl-5 font-black text-amber-300">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    <span>Total por Nivel</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal lowercase block">
                    Consolidado Columnas
                  </span>
                </td>

                {nivelesVisibles.map((nivel) => {
                  const resNivel = totalesPorNivel[nivel] || {
                    cursos: 0,
                    alumnos: 0,
                    ingresos: 0,
                    gastos: 0,
                    utilidad: 0,
                    margen: 0,
                    roi: 0,
                  };

                  return (
                    <td key={nivel} className="p-3 text-center border-r border-slate-800">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-black text-white font-mono">
                          {resNivel.cursos > 0 ? `${resNivel.margen}%` : '—'}
                        </span>
                        <span className="text-[10px] text-emerald-300 font-mono">
                          {resNivel.cursos > 0 ? formatearMoneda(resNivel.utilidad, moneda) : 'L 0'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {resNivel.cursos} cursos • {resNivel.alumnos} alum.
                        </span>
                      </div>
                    </td>
                  );
                })}

                {/* Gran Total Consolidado */}
                <td className="p-3.5 pr-5 text-right bg-slate-950 text-white border-l border-slate-800">
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                      Total Institucional
                    </span>
                    <span className="text-sm font-black text-emerald-400 font-mono">
                      {consolidadoGlobal.margen}% Margen
                    </span>
                    <span className="text-[11px] font-bold text-white font-mono">
                      {formatearMoneda(consolidadoGlobal.utilidad, moneda)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {consolidadoGlobal.cursos} cursos • {consolidadoGlobal.alumnos} alumnos
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Diagnóstico Ejecutivo: Top Segmentos Más Rentables vs En Riesgo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Podio de los Segmentos Más Rentables */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">
                Top Segmentos Educativos Más Rentables (Mayor Margen %)
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              Ranking de Cartera
            </span>
          </div>

          {rankingMargen.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No hay proyectos registrados con los filtros actuales.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rankingMargen.slice(0, 4).map((seg, idx) => {
                const esLider = idx === 0;
                return (
                  <div
                    key={`${seg.tipo}-${seg.nivel}`}
                    onClick={() => setCeldaSeleccionada(seg)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer group ${
                      esLider
                        ? 'bg-gradient-to-br from-emerald-50 to-teal-50/50 border-emerald-300 hover:border-emerald-400 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 hover:bg-purple-50/40 border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                          esLider ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          #{idx + 1}
                        </span>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                            Nivel {seg.nivel}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition-colors line-clamp-1">
                            {seg.tipoCorto}
                          </h4>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-md text-xs font-mono font-black bg-emerald-100 text-emerald-800">
                        {seg.margenOperativoReal.toFixed(1)}% Margen
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-200/80 text-[11px]">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Retorno ROI</span>
                        <span className="font-bold text-indigo-700 font-mono">
                          {seg.roiPromedio.toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Matrícula</span>
                        <span className="font-bold text-slate-700 font-mono">
                          {seg.alumnosTotal} alum.
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Utilidad Neta</span>
                        <span className="font-bold text-emerald-700 font-mono">
                          {formatearMoneda(seg.utilidadTotal, moneda)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Oportunidades de Expansión (Segmentos Vacíos) */}
          {segmentosVacios.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  Hay <strong>{segmentosVacios.length} segmentos vacíos</strong> en la matriz donde la institución aún no ofrece programas (ej. {segmentosVacios[0]?.tipoCorto} en {segmentosVacios[0]?.nivel}).
                </span>
              </div>
              <span className="text-indigo-600 font-semibold cursor-pointer shrink-0" onClick={() => setSoloConCursos(false)}>
                Ver gaps en matriz
              </span>
            </div>
          )}
        </div>

        {/* Diagnóstico Estratégico y Cuadrantes */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">
                Dictamen Estratégico de Dirección
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Basado en las directrices de la Gerencia General de SUMMIT Impulsa Global, se recomienda:
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                <span className="font-bold text-emerald-400 block mb-0.5">
                  🌟 Segmento a Escalar (Estrella):
                </span>
                <p className="text-slate-300 text-[11px]">
                  {rankingMargen[0]
                    ? `${rankingMargen[0].tipoCorto} en Nivel ${rankingMargen[0].nivel} lidera con ${rankingMargen[0].margenOperativoReal}% de margen. Aumentar pauta comercial y aperturar nuevas cohortes.`
                    : 'Registra proyectos para generar recomendaciones.'}
                </p>
              </div>

              <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                <span className="font-bold text-blue-400 block mb-0.5">
                  🐄 Vaca Lechera (Mayor Liquidez):
                </span>
                <p className="text-slate-300 text-[11px]">
                  {rankingFacturacion[0]
                    ? `${rankingFacturacion[0].tipoCorto} (${rankingFacturacion[0].nivel}) genera el mayor ingreso acumulado (${formatearMoneda(rankingFacturacion[0].ingresosTotal, moneda)}). Mantener retención.`
                    : 'Sin datos.'}
                </p>
              </div>

              {segmentosEnRiesgo.length > 0 && (
                <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20">
                  <span className="font-bold text-rose-400 block mb-0.5">
                    ⚠️ Segmento a Optimizar ({segmentosEnRiesgo.length} en alerta):
                  </span>
                  <p className="text-slate-300 text-[11px]">
                    {segmentosEnRiesgo[0].tipoCorto} ({segmentosEnRiesgo[0].nivel}) presenta margen de {segmentosEnRiesgo[0].margenOperativoReal}%. Ajustar tarifa de docente o elevar el punto de equilibrio.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Algoritmo de optimización de portafolio SUMMIT.</span>
          </div>
        </div>

      </div>

      {/* 5. Modal / Drawer de Detalle por Celda de Segmento (Drill-Down) */}
      {celdaSeleccionada && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
            {/* Cabecera del Modal */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/10 rounded-xl border border-white/10 text-white">
                    {celdaSeleccionada.tipoIcono}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500 text-white uppercase tracking-wider">
                        Nivel {celdaSeleccionada.nivel}
                      </span>
                      <span className="text-xs text-slate-300">
                        {celdaSeleccionada.cursosCount} {celdaSeleccionada.cursosCount === 1 ? 'curso' : 'cursos'}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                      {celdaSeleccionada.tipo}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCeldaSeleccionada(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tiras Financieras Rápidas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/10 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Margen Operativo</span>
                  <span className="text-base font-black text-emerald-300 font-mono">
                    {celdaSeleccionada.margenOperativoReal.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Retorno ROI</span>
                  <span className="text-base font-black text-purple-300 font-mono">
                    {celdaSeleccionada.roiPromedio.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Utilidad Neta</span>
                  <span className="text-base font-black text-white font-mono">
                    {formatearMoneda(celdaSeleccionada.utilidadTotal, moneda)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Alumnos Totales</span>
                  <span className="text-base font-black text-amber-300 font-mono">
                    {celdaSeleccionada.alumnosTotal} alum.
                  </span>
                </div>
              </div>
            </div>

            {/* Cuerpo del Modal: Desglose de Cursos del Segmento */}
            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Programas Educativos en este Segmento
                </h4>
                <span className="text-xs text-slate-500">
                  Ingreso Total: <strong>{formatearMoneda(celdaSeleccionada.ingresosTotal, moneda)}</strong>
                </span>
              </div>

              <div className="space-y-2.5">
                {celdaSeleccionada.proyectos.map((p) => {
                  const esRentable = (p.totalGananciasFinales || 0) >= 0;
                  return (
                    <div
                      key={p.id}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {p.nombreProyecto}
                            </span>
                            <span className={`px-2 py-0.2 rounded-md text-[10px] font-bold ${
                              p.seLlevoACabo === 'Listo' || p.seLlevoACabo === 'Sí'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {p.seLlevoACabo}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 block mt-0.5">
                            Docente: <strong>{p.nombreDocente || 'Sin Asignar'}</strong> • {p.alumnosFinal} alumnos • {p.horasClase} hrs
                          </span>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <div className="text-right mr-1">
                            <span className={`text-xs font-bold font-mono block ${esRentable ? 'text-emerald-700' : 'text-rose-600'}`}>
                              {formatearMoneda(p.totalGananciasFinales || 0, moneda)}
                            </span>
                            <span className="text-[10px] text-purple-700 font-mono">
                              {p.roiPorcentaje.toFixed(1)}% ROI
                            </span>
                          </div>

                          {onVerDetalle && (
                            <button
                              type="button"
                              onClick={() => {
                                setCeldaSeleccionada(null);
                                onVerDetalle(p);
                              }}
                              className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                              title="Ver ficha detallada"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {onEditarProyecto && (
                            <button
                              type="button"
                              onClick={() => {
                                setCeldaSeleccionada(null);
                                onEditarProyecto(p);
                              }}
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                              title="Editar proyecto"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dictamen del Segmento */}
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-950">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Dictamen de Optimización para este Segmento:</span>
                </div>
                <p className="text-indigo-900 leading-relaxed">
                  {celdaSeleccionada.margenOperativoReal >= 30
                    ? `Este segmento supera el umbral institucional del 30% de rentabilidad. Se recomienda diseñar programas avanzados complementarios y extender la oferta a empresas corporativas.`
                    : celdaSeleccionada.margenOperativoReal >= 15
                    ? `Segmento con desempeño aceptable pero con margen de mejora. Se sugiere optimizar los honorarios docentes o buscar acuerdos de volumen para incrementar la rentabilidad.`
                    : `Segmento en zona crítica. Los ingresos actuales apenas cubren o no logran cubrir los costos operativos (docente, zoom, papelería). Es imprescindible elevar la matrícula mínima requerida.`}
                </p>
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setCeldaSeleccionada(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal de Ayuda e Interpretación */}
      {mostrarModalAyuda && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 my-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <h3 className="text-base font-bold text-slate-900">
                  ¿Cómo interpretar el Mapa de Calor de Rentabilidad?
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalAyuda(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                El <strong>Mapa de Calor (Heatmap)</strong> cruza las dos variables clave de la cartera académica de SUMMIT Impulsa Global:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                <li><strong>Columnas:</strong> Nivel del programa formativo (Básico, Intermedio, Avanzado).</li>
                <li><strong>Filas:</strong> Modalidad o tipología de servicio (Capacitación profesional, Convenios universitarios, Talleres libres, Consultoría, etc.).</li>
              </ul>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-900 block">Fórmulas Oficiales de Rentabilidad:</span>
                <p>• <strong>Margen Operativo Real (%):</strong> (Utilidad Neta Total / Ingresos Totales Reales) × 100</p>
                <p>• <strong>Retorno de Inversión (ROI %):</strong> (Utilidad Neta Total / Gasto Operativo Total) × 100</p>
                <p>• <strong>Utilidad Neta:</strong> Ingresos Facturados Netos − Gastos Operativos (Docente + Zoom + Materiales)</p>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                <span className="font-bold block mb-1">Criterios de Acción Ejecutiva:</span>
                <p>• <strong>Verde Esmeralda (&ge;30%):</strong> Segmentos prioritarios para escalabilidad comercial.</p>
                <p>• <strong>Amarillo / Naranja (10% - 29%):</strong> Requiere optimización de cupos mínimos o tarifas por hora.</p>
                <p>• <strong>Rojo (&lt;0%):</strong> Segmento en déficit. Revisión urgente con la Gerencia Académica.</p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setMostrarModalAyuda(false)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
