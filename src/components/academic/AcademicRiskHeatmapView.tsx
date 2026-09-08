import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell
} from 'recharts';
import {
  AlertTriangle,
  Flame,
  TrendingDown,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  Sliders,
  Filter,
  CheckCircle2,
  Info,
  Layers,
  ArrowRight,
  Sparkles,
  BarChart3,
  Edit3,
  Eye,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  Zap,
  BookOpen,
  Calendar
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { formatearMoneda, calcularMetricasProyecto } from '../../utils/calculations';

interface AcademicRiskHeatmapViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onEditarProyecto: (p: ProyectoEducativo) => void;
  onVerDetalle: (p: ProyectoEducativo) => void;
  onGuardarProyecto?: (p: ProyectoEducativo) => void;
}

export interface ProyectoAnalisisRiesgo {
  proyecto: ProyectoEducativo;
  horasClase: number;
  tarifaHoraDocente: number;
  costoDocente: number;
  gastoTotal: number;
  ingresoTotal: number;
  gananciaFinal: number;
  margenRealPorcentaje: number;
  pesoCostoDocentePorcentaje: number;
  puntoEquilibrio: number;
  alumnosFinal: number;
  scoreRiesgo: number; // 0 - 100
  nivelRiesgo: 'CRITICO' | 'ALTO' | 'MODERADO' | 'BAJO';
  esHorasExcesivas: boolean;
  esMargenPeligroso: boolean;
  colorBadge: string;
  colorBorder: string;
  colorBg: string;
  colorHex: string;
  diagnostico: string;
  accionCorrectiva: string;
}

export const AcademicRiskHeatmapView: React.FC<AcademicRiskHeatmapViewProps> = ({
  proyectos,
  moneda,
  onEditarProyecto,
  onVerDetalle,
  onGuardarProyecto
}) => {
  // Umbrales dinámicos configurables por el usuario
  const [umbralHorasExcesivas, setUmbralHorasExcesivas] = useState<number>(45);
  const [umbralHorasModeradas, setUmbralHorasModeradas] = useState<number>(30);
  const [umbralMargenPeligroso, setUmbralMargenPeligroso] = useState<number>(25);
  const [umbralMargenSaludable, setUmbralMargenSaludable] = useState<number>(40);

  // Filtros de navegación
  const [vistaModo, setVistaModo] = useState<'matriz' | 'scatter' | 'tabla'>('matriz');
  const [filtroNivelRiesgo, setFiltroNivelRiesgo] = useState<string>('todos');
  const [filtroDocente, setFiltroDocente] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');
  const [mostrarConfigUmbrales, setMostrarConfigUmbrales] = useState<boolean>(false);

  // Estado para el simulador de corrección de riesgo en vivo
  const [proyectoSimulando, setProyectoSimulando] = useState<ProyectoEducativo | null>(null);
  const [horasSimuladas, setHorasSimuladas] = useState<number>(0);
  const [alumnosSimulados, setAlumnosSimulados] = useState<number>(0);
  const [margenDeseadoSimulado, setMargenDeseadoSimulado] = useState<number>(30);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Lista de docentes únicos para filtro
  const docentesUnicos = useMemo(() => {
    const set = new Set<string>();
    proyectos.forEach((p) => {
      if (p.nombreDocente) set.add(p.nombreDocente);
    });
    return Array.from(set).sort();
  }, [proyectos]);

  // Análisis y cálculo del vector de riesgo para cada proyecto
  const proyectosAnalizados: ProyectoAnalisisRiesgo[] = useMemo(() => {
    return proyectos.map((p) => {
      const metricas = calcularMetricasProyecto(p);
      const horasClase = Math.max(0, metricas.horasClase || 0);
      const tarifaHora = Math.max(0, metricas.tarifaHoraDocente ?? 200);
      const costoDocente = metricas.costoDocenteCalculado;
      const gastoTotal = Math.max(1, metricas.gastoTotalOperativo);
      const ingresoTotal = metricas.ingresoRealTotal;
      const gananciaFinal = metricas.totalGananciasFinales;

      // Margen operativo real alcanzado
      const margenRealPorcentaje =
        ingresoTotal > 0 ? (gananciaFinal / ingresoTotal) * 100 : 0;

      // Qué porcentaje del gasto operativo total se lo lleva el docente
      const pesoCostoDocentePorcentaje = (costoDocente / gastoTotal) * 100;

      // Banderas lógicas de riesgo
      const esHorasExcesivas = horasClase >= umbralHorasExcesivas;
      const esHorasModeradas =
        horasClase >= umbralHorasModeradas && horasClase < umbralHorasExcesivas;
      const esMargenPeligroso = margenRealPorcentaje < umbralMargenPeligroso;
      const esMargenModerado =
        margenRealPorcentaje >= umbralMargenPeligroso &&
        margenRealPorcentaje < umbralMargenSaludable;
      const esMargenSaludable = margenRealPorcentaje >= umbralMargenSaludable;

      // Score de riesgo ponderado (0 = óptimo, 100 = peligro máximo)
      let scoreRiesgo = 0;

      // Componente Margen (0 a 55 pts): penalización fuerte si el margen cae bajo el umbral
      if (margenRealPorcentaje < 10) scoreRiesgo += 55;
      else if (margenRealPorcentaje < umbralMargenPeligroso) scoreRiesgo += 42;
      else if (esMargenModerado) scoreRiesgo += 22;
      else scoreRiesgo += 5;

      // Componente Horas Docentes (0 a 30 pts): penalización por carga docente excesiva
      if (horasClase >= 60) scoreRiesgo += 30;
      else if (esHorasExcesivas) scoreRiesgo += 22;
      else if (esHorasModeradas) scoreRiesgo += 12;
      else scoreRiesgo += 2;

      // Componente Peso del Costo Docente (0 a 15 pts): si se come más del 70% del presupuesto
      if (pesoCostoDocentePorcentaje >= 75) scoreRiesgo += 15;
      else if (pesoCostoDocentePorcentaje >= 60) scoreRiesgo += 8;

      // Clasificación semafórica
      let nivelRiesgo: 'CRITICO' | 'ALTO' | 'MODERADO' | 'BAJO';
      let colorBadge: string;
      let colorBorder: string;
      let colorBg: string;
      let colorHex: string;
      let diagnostico: string;
      let accionCorrectiva: string;

      if (scoreRiesgo >= 65 || (esHorasExcesivas && esMargenPeligroso)) {
        nivelRiesgo = 'CRITICO';
        colorBadge = 'bg-rose-100 text-rose-900 border-rose-300';
        colorBorder = 'border-rose-400';
        colorBg = 'bg-rose-50/80';
        colorHex = '#e11d48';
        diagnostico = `Doble alerta crítica: Carga de ${horasClase}h consume el ${pesoCostoDocentePorcentaje.toFixed(0)}% del gasto con margen de solo ${margenRealPorcentaje.toFixed(1)}%. Alto riesgo de pérdida operativa si caen alumnos.`;
        accionCorrectiva = `Reducir de ${horasClase}h a ${Math.max(20, horasClase - 10)}h migrando talleres a asincrónico, o incrementar el aforo mínimo de ${metricas.alumnosFinal} a ${metricas.alumnosFinal + 4} alumnos.`;
      } else if (scoreRiesgo >= 45 || esMargenPeligroso || (esHorasExcesivas && esMargenModerado)) {
        nivelRiesgo = 'ALTO';
        colorBadge = 'bg-orange-100 text-orange-900 border-orange-300';
        colorBorder = 'border-orange-400';
        colorBg = 'bg-orange-50/80';
        colorHex = '#ea580c';
        diagnostico = esMargenPeligroso
          ? `Margen comprimido (${margenRealPorcentaje.toFixed(1)}% < ${umbralMargenPeligroso}%). El precio sugerido no amortigua contingencias operativas.`
          : `Horas elevadas (${horasClase}h) generan fatiga docente y costo de ${formatearMoneda(costoDocente, moneda)}.`;
        accionCorrectiva = esMargenPeligroso
          ? `Ajustar precio sugerido por alumno o elevar el aforo base proyectado para ampliar el margen sobre el 30%.`
          : `Revisar desglose teórico/práctico para compactar sesiones y proteger la rentabilidad.`;
      } else if (scoreRiesgo >= 25 || esMargenModerado || esHorasModeradas) {
        nivelRiesgo = 'MODERADO';
        colorBadge = 'bg-amber-100 text-amber-900 border-amber-300';
        colorBorder = 'border-amber-300';
        colorBg = 'bg-amber-50/70';
        colorHex = '#d97706';
        diagnostico = `Equilibrio aceptable pero en zona de vigilancia. Margen del ${margenRealPorcentaje.toFixed(1)}% con ${horasClase}h docentes.`;
        accionCorrectiva = `Monitorear punto de equilibrio (${metricas.puntoEquilibrioAlumnos} alumnos) durante la campaña de ventas.`;
      } else {
        nivelRiesgo = 'BAJO';
        colorBadge = 'bg-emerald-100 text-emerald-900 border-emerald-300';
        colorBorder = 'border-emerald-300';
        colorBg = 'bg-emerald-50/70';
        colorHex = '#059669';
        diagnostico = `Proyecto saludable y altamente sostenible. Margen robusto del ${margenRealPorcentaje.toFixed(1)}% y carga docente eficiente (${horasClase}h).`;
        accionCorrectiva = `Mantener estructura actual. Proyecto modelo para réplica en futuras cohortes.`;
      }

      return {
        proyecto: metricas,
        horasClase,
        tarifaHoraDocente: tarifaHora,
        costoDocente,
        gastoTotal,
        ingresoTotal,
        gananciaFinal,
        margenRealPorcentaje,
        pesoCostoDocentePorcentaje,
        puntoEquilibrio: metricas.puntoEquilibrioAlumnos,
        alumnosFinal: metricas.alumnosFinal,
        scoreRiesgo,
        nivelRiesgo,
        esHorasExcesivas,
        esMargenPeligroso,
        colorBadge,
        colorBorder,
        colorBg,
        colorHex,
        diagnostico,
        accionCorrectiva
      };
    });
  }, [proyectos, umbralHorasExcesivas, umbralHorasModeradas, umbralMargenPeligroso, umbralMargenSaludable, moneda]);

  // Proyectos filtrados
  const proyectosFiltrados = useMemo(() => {
    return proyectosAnalizados.filter((item) => {
      if (filtroNivelRiesgo !== 'todos' && item.nivelRiesgo !== filtroNivelRiesgo) {
        return false;
      }
      if (filtroDocente !== 'todos' && item.proyecto.nombreDocente !== filtroDocente) {
        return false;
      }
      if (busqueda.trim()) {
        const query = busqueda.toLowerCase();
        const matchNombre = item.proyecto.nombreProyecto.toLowerCase().includes(query);
        const matchDocente = (item.proyecto.nombreDocente || '').toLowerCase().includes(query);
        const matchTipo = (item.proyecto.tipoProyecto || '').toLowerCase().includes(query);
        if (!matchNombre && !matchDocente && !matchTipo) return false;
      }
      return true;
    });
  }, [proyectosAnalizados, filtroNivelRiesgo, filtroDocente, busqueda]);

  // Contadores para el cuadro de mando
  const resumenRiesgo = useMemo(() => {
    const total = proyectosAnalizados.length;
    const criticos = proyectosAnalizados.filter((p) => p.nivelRiesgo === 'CRITICO').length;
    const altos = proyectosAnalizados.filter((p) => p.nivelRiesgo === 'ALTO').length;
    const moderados = proyectosAnalizados.filter((p) => p.nivelRiesgo === 'MODERADO').length;
    const bajos = proyectosAnalizados.filter((p) => p.nivelRiesgo === 'BAJO').length;

    const horasExcesivasCount = proyectosAnalizados.filter((p) => p.esHorasExcesivas).length;
    const margenesPeligrososCount = proyectosAnalizados.filter((p) => p.esMargenPeligroso).length;

    return {
      total,
      criticos,
      altos,
      moderados,
      bajos,
      horasExcesivasCount,
      margenesPeligrososCount
    };
  }, [proyectosAnalizados]);

  // Matriz de distribución 3x3 para el Heatmap
  const celdasMatriz = useMemo(() => {
    // Filas (Margen):
    // 0: Margen Saludable (>= umbralMargenSaludable)
    // 1: Margen Moderado (umbralMargenPeligroso a < umbralMargenSaludable)
    // 2: Margen Crítico (< umbralMargenPeligroso)
    // Columnas (Horas):
    // 0: Horas Controladas (< umbralHorasModeradas)
    // 1: Horas Medias (umbralHorasModeradas a < umbralHorasExcesivas)
    // 2: Horas Excesivas (>= umbralHorasExcesivas)

    const grid: Array<Array<{
      key: string;
      filaLabel: string;
      colLabel: string;
      nivelAlerta: 'CRITICO' | 'ALTO' | 'MODERADO' | 'OPTIMO';
      bgClass: string;
      badgeText: string;
      proyectos: ProyectoAnalisisRiesgo[];
    }>> = [
      // Fila 0: Margen Saludable (>= 40%)
      [
        {
          key: 'saludable-bajas',
          filaLabel: `Margen Saludable (≥${umbralMargenSaludable}%)`,
          colLabel: `Horas Bajas (<${umbralHorasModeradas}h)`,
          nivelAlerta: 'OPTIMO',
          bgClass: 'bg-emerald-500/10 border-emerald-300 hover:bg-emerald-500/20',
          badgeText: 'Máxima Eficiencia',
          proyectos: []
        },
        {
          key: 'saludable-medias',
          filaLabel: `Margen Saludable (≥${umbralMargenSaludable}%)`,
          colLabel: `Horas Medias (${umbralHorasModeradas}-${umbralHorasExcesivas - 1}h)`,
          nivelAlerta: 'OPTIMO',
          bgClass: 'bg-emerald-500/10 border-emerald-300 hover:bg-emerald-500/20',
          badgeText: 'Sólido & Rentable',
          proyectos: []
        },
        {
          key: 'saludable-excesivas',
          filaLabel: `Margen Saludable (≥${umbralMargenSaludable}%)`,
          colLabel: `Horas Excesivas (≥${umbralHorasExcesivas}h)`,
          nivelAlerta: 'MODERADO',
          bgClass: 'bg-amber-500/15 border-amber-300 hover:bg-amber-500/25',
          badgeText: 'Vigilar Sobrecarga',
          proyectos: []
        }
      ],
      // Fila 1: Margen Moderado (25% - 39%)
      [
        {
          key: 'moderado-bajas',
          filaLabel: `Margen Moderado (${umbralMargenPeligroso}-${umbralMargenSaludable - 1}%)`,
          colLabel: `Horas Bajas (<${umbralHorasModeradas}h)`,
          nivelAlerta: 'MODERADO',
          bgClass: 'bg-emerald-500/5 border-slate-300 hover:bg-emerald-500/15',
          badgeText: 'Estable',
          proyectos: []
        },
        {
          key: 'moderado-medias',
          filaLabel: `Margen Moderado (${umbralMargenPeligroso}-${umbralMargenSaludable - 1}%)`,
          colLabel: `Horas Medias (${umbralHorasModeradas}-${umbralHorasExcesivas - 1}h)`,
          nivelAlerta: 'MODERADO',
          bgClass: 'bg-amber-500/15 border-amber-300 hover:bg-amber-500/25',
          badgeText: 'En Observación',
          proyectos: []
        },
        {
          key: 'moderado-excesivas',
          filaLabel: `Margen Moderado (${umbralMargenPeligroso}-${umbralMargenSaludable - 1}%)`,
          colLabel: `Horas Excesivas (≥${umbralHorasExcesivas}h)`,
          nivelAlerta: 'ALTO',
          bgClass: 'bg-orange-500/20 border-orange-400 hover:bg-orange-500/30',
          badgeText: 'Desgaste Docente',
          proyectos: []
        }
      ],
      // Fila 2: Margen Crítico (< 25%)
      [
        {
          key: 'critico-bajas',
          filaLabel: `Margen Crítico (<${umbralMargenPeligroso}%)`,
          colLabel: `Horas Bajas (<${umbralHorasModeradas}h)`,
          nivelAlerta: 'ALTO',
          bgClass: 'bg-orange-500/20 border-orange-400 hover:bg-orange-500/30',
          badgeText: 'Sub-Precio / Mal Costeo',
          proyectos: []
        },
        {
          key: 'critico-medias',
          filaLabel: `Margen Crítico (<${umbralMargenPeligroso}%)`,
          colLabel: `Horas Medias (${umbralHorasModeradas}-${umbralHorasExcesivas - 1}h)`,
          nivelAlerta: 'CRITICO',
          bgClass: 'bg-rose-500/25 border-rose-400 hover:bg-rose-500/35',
          badgeText: 'Alerta de Margen',
          proyectos: []
        },
        {
          key: 'critico-excesivas',
          filaLabel: `Margen Crítico (<${umbralMargenPeligroso}%)`,
          colLabel: `Horas Excesivas (≥${umbralHorasExcesivas}h)`,
          nivelAlerta: 'CRITICO',
          bgClass: 'bg-rose-600/35 border-rose-500 hover:bg-rose-600/45 ring-2 ring-rose-400',
          badgeText: '🔴 ZONA MÁXIMO PELIGRO',
          proyectos: []
        }
      ]
    ];

    proyectosFiltrados.forEach((item) => {
      let r = 1;
      if (item.margenRealPorcentaje >= umbralMargenSaludable) r = 0;
      else if (item.margenRealPorcentaje < umbralMargenPeligroso) r = 2;

      let c = 1;
      if (item.horasClase < umbralHorasModeradas) c = 0;
      else if (item.horasClase >= umbralHorasExcesivas) c = 2;

      grid[r][c].proyectos.push(item);
    });

    return grid;
  }, [proyectosFiltrados, umbralHorasExcesivas, umbralHorasModeradas, umbralMargenPeligroso, umbralMargenSaludable]);

  // Datos para el gráfico de dispersión / Scatter
  const scatterData = useMemo(() => {
    return proyectosFiltrados.map((item) => ({
      x: item.horasClase,
      y: Math.round(item.margenRealPorcentaje * 10) / 10,
      z: item.costoDocente,
      nombre: item.proyecto.nombreProyecto,
      docente: item.proyecto.nombreDocente,
      nivelRiesgo: item.nivelRiesgo,
      color: item.colorHex,
      itemRef: item
    }));
  }, [proyectosFiltrados]);

  // Acciones de simulación rápida de corrección
  const handleAbrirSimulador = (item: ProyectoAnalisisRiesgo) => {
    setProyectoSimulando(item.proyecto);
    setHorasSimuladas(item.horasClase);
    setAlumnosSimulados(item.alumnosFinal);
    setMargenDeseadoSimulado(item.proyecto.margenGananciaOperativa || 30);
  };

  const metricasSimuladas = useMemo(() => {
    if (!proyectoSimulando) return null;
    const clon = {
      ...proyectoSimulando,
      horasClase: horasSimuladas,
      alumnosFinal: alumnosSimulados,
      margenGananciaOperativa: margenDeseadoSimulado
    };
    const res = calcularMetricasProyecto(clon);
    const margenReal = res.ingresoRealTotal > 0 ? (res.totalGananciasFinales / res.ingresoRealTotal) * 100 : 0;
    const esExcesiva = horasSimuladas >= umbralHorasExcesivas;
    const esPeligroso = margenReal < umbralMargenPeligroso;
    let nivel: 'CRITICO' | 'ALTO' | 'MODERADO' | 'BAJO' = 'BAJO';
    if (esExcesiva && esPeligroso) nivel = 'CRITICO';
    else if (esPeligroso || (esExcesiva && margenReal < umbralMargenSaludable)) nivel = 'ALTO';
    else if (margenReal < umbralMargenSaludable || horasSimuladas >= umbralHorasModeradas) nivel = 'MODERADO';

    return {
      resultado: res,
      margenReal,
      nivel
    };
  }, [proyectoSimulando, horasSimuladas, alumnosSimulados, margenDeseadoSimulado, umbralHorasExcesivas, umbralMargenPeligroso, umbralMargenSaludable]);

  const handleAplicarCorreccion = () => {
    if (!proyectoSimulando || !metricasSimuladas || !onGuardarProyecto) return;
    const actualizado: ProyectoEducativo = {
      ...proyectoSimulando,
      horasClase: horasSimuladas,
      alumnosFinal: alumnosSimulados,
      margenGananciaOperativa: margenDeseadoSimulado
    };
    onGuardarProyecto(actualizado);
    setMensajeExito(`¡Corrección aplicada con éxito al proyecto "${actualizado.nombreProyecto}"!`);
    setProyectoSimulando(null);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* CABECERA PRINCIPAL: MAPA DE CALOR DE RIESGO ACADÉMICO */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-indigo-950 rounded-2xl p-5 sm:p-6 text-white shadow-lg border border-rose-900/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-400/40 flex items-center gap-1">
                <Flame className="w-3 h-3 text-rose-400 fill-rose-400" />
                Matriz de Riesgo 2D
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-200">
                Horas Docentes Excesivas vs. Márgenes Comprimidos
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
              Mapa de Calor de Riesgo Curricular y Financiero
            </h2>
            <p className="text-xs text-rose-200/90 mt-1 max-w-3xl leading-relaxed">
              Monitorea en tiempo real qué programas formativos presentan una <strong>carga docente desproporcionada</strong> que devora el presupuesto o un <strong>margen operativo peligrosamente bajo</strong> que los hace vulnerables ante caídas mínimas en matrícula.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setMostrarConfigUmbrales(!mostrarConfigUmbrales)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                mostrarConfigUmbrales
                  ? 'bg-rose-600 text-white border-rose-400 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
              title="Ajustar los umbrales de horas y margen del mapa de calor"
            >
              <Sliders className="w-4 h-4" />
              <span>Configurar Umbrales</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PANEL DESPLEGABLE DE UMBRALES CONFIGURABLES */}
        {/* ========================================================================= */}
        {mostrarConfigUmbrales && (
          <div className="mt-5 pt-4 border-t border-rose-800/60 bg-white/5 rounded-xl p-4 border border-white/10 text-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-rose-400" />
                Calibración de Sensibilidad del Mapa de Calor
              </span>
              <button
                type="button"
                onClick={() => {
                  setUmbralHorasExcesivas(45);
                  setUmbralHorasModeradas(30);
                  setUmbralMargenPeligroso(25);
                  setUmbralMargenSaludable(40);
                }}
                className="text-[10px] text-rose-300 hover:text-white underline"
              >
                Restablecer Valores Predeterminados
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  🔴 Horas Excesivas (≥ {umbralHorasExcesivas} hrs)
                </label>
                <input
                  type="range"
                  min="30"
                  max="80"
                  step="5"
                  value={umbralHorasExcesivas}
                  onChange={(e) => setUmbralHorasExcesivas(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
                <span className="text-[10px] text-rose-300 block mt-0.5">
                  Proyectos con {umbralHorasExcesivas}h o más entrarán en alerta roja por carga docente.
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  🟡 Horas Moderadas (&lt; {umbralHorasModeradas} hrs)
                </label>
                <input
                  type="range"
                  min="15"
                  max="40"
                  step="5"
                  value={umbralHorasModeradas}
                  onChange={(e) => setUmbralHorasModeradas(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <span className="text-[10px] text-amber-300 block mt-0.5">
                  Proyectos por debajo de {umbralHorasModeradas}h se catalogan como carga ágil.
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  🔴 Margen Peligroso (&lt; {umbralMargenPeligroso}%)
                </label>
                <input
                  type="range"
                  min="15"
                  max="35"
                  step="1"
                  value={umbralMargenPeligroso}
                  onChange={(e) => setUmbralMargenPeligroso(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
                <span className="text-[10px] text-rose-300 block mt-0.5">
                  Márgenes menores a {umbralMargenPeligroso}% se marcan como alto riesgo de déficit.
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  🟢 Margen Saludable (≥ {umbralMargenSaludable}%)
                </label>
                <input
                  type="range"
                  min="30"
                  max="55"
                  step="5"
                  value={umbralMargenSaludable}
                  onChange={(e) => setUmbralMargenSaludable(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <span className="text-[10px] text-emerald-300 block mt-0.5">
                  Márgenes sobre {umbralMargenSaludable}% cumplen con la meta de rentabilidad óptima.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BARÓMETRO DE RIESGO: 4 TARJETAS DE SÍNTESIS */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-rose-900/60">
          <div
            onClick={() => setFiltroNivelRiesgo(filtroNivelRiesgo === 'CRITICO' ? 'todos' : 'CRITICO')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              filtroNivelRiesgo === 'CRITICO'
                ? 'bg-rose-500/30 border-rose-400 ring-2 ring-rose-400 shadow-md'
                : 'bg-white/5 hover:bg-rose-500/20 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between text-rose-300 text-xs font-bold">
              <span>🔴 Zona Crítica</span>
              <Flame className="w-3.5 h-3.5 fill-rose-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {resumenRiesgo.criticos}
            </div>
            <span className="text-[10px] text-rose-200 block">Horas excesivas + Margen bajo</span>
          </div>

          <div
            onClick={() => setFiltroNivelRiesgo(filtroNivelRiesgo === 'ALTO' ? 'todos' : 'ALTO')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              filtroNivelRiesgo === 'ALTO'
                ? 'bg-orange-500/30 border-orange-400 ring-2 ring-orange-400 shadow-md'
                : 'bg-white/5 hover:bg-orange-500/20 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between text-orange-300 text-xs font-bold">
              <span>🟠 Riesgo Alto</span>
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {resumenRiesgo.altos}
            </div>
            <span className="text-[10px] text-orange-200 block">Margen frágil o sobrecarga</span>
          </div>

          <div
            onClick={() => setFiltroNivelRiesgo(filtroNivelRiesgo === 'MODERADO' ? 'todos' : 'MODERADO')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              filtroNivelRiesgo === 'MODERADO'
                ? 'bg-amber-500/30 border-amber-400 ring-2 ring-amber-400 shadow-md'
                : 'bg-white/5 hover:bg-amber-500/20 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between text-amber-300 text-xs font-bold">
              <span>🟡 En Observación</span>
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {resumenRiesgo.moderados}
            </div>
            <span className="text-[10px] text-amber-200 block">Parámetros equilibrados</span>
          </div>

          <div
            onClick={() => setFiltroNivelRiesgo(filtroNivelRiesgo === 'BAJO' ? 'todos' : 'BAJO')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              filtroNivelRiesgo === 'BAJO'
                ? 'bg-emerald-500/30 border-emerald-400 ring-2 ring-emerald-400 shadow-md'
                : 'bg-white/5 hover:bg-emerald-500/20 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between text-emerald-300 text-xs font-bold">
              <span>🟢 Zona Segura</span>
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {resumenRiesgo.bajos}
            </div>
            <span className="text-[10px] text-emerald-200 block">Horas eficientes & Margen ≥40%</span>
          </div>
        </div>
      </div>

      {/* MENSAJE DE ÉXITO TRAS APLICAR CORRECCIÓN */}
      {mensajeExito && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BARRA DE HERRAMIENTAS: SELECTOR DE VISTAS Y FILTROS */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Selector de Modos de Vista */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg w-full md:w-auto">
          <button
            type="button"
            onClick={() => setVistaModo('matriz')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
              vistaModo === 'matriz'
                ? 'bg-white text-rose-950 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-rose-600" />
            <span>Matriz 3x3 de Calor</span>
          </button>

          <button
            type="button"
            onClick={() => setVistaModo('scatter')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
              vistaModo === 'scatter'
                ? 'bg-white text-rose-950 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Cuadrante Scatter (Horas vs Margen)</span>
          </button>

          <button
            type="button"
            onClick={() => setVistaModo('tabla')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
              vistaModo === 'tabla'
                ? 'bg-white text-rose-950 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Termómetro Detallado ({proyectosFiltrados.length})</span>
          </button>
        </div>

        {/* Filtros por Docente y Búsqueda */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 sm:w-44">
            <select
              value={filtroDocente}
              onChange={(e) => setFiltroDocente(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-700"
            >
              <option value="todos">Todos los Docentes</option>
              {docentesUnicos.map((doc) => (
                <option key={doc} value={doc}>
                  {doc}
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 sm:w-52">
            <input
              type="text"
              placeholder="Buscar proyecto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          {(filtroNivelRiesgo !== 'todos' || filtroDocente !== 'todos' || busqueda) && (
            <button
              type="button"
              onClick={() => {
                setFiltroNivelRiesgo('todos');
                setFiltroDocente('todos');
                setBusqueda('');
              }}
              className="px-2.5 py-1.5 text-xs text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg font-bold"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: MATRIZ DE CALOR 3X3 (HEATMAP MATRIX) */}
      {/* ========================================================================= */}
      {vistaModo === 'matriz' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-600" />
                  Cuadrícula Bidimensional de Riesgo (Horas Docentes vs. Margen Operativo)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Las celdas inferiores derechas representan la <strong>Zona Crítica</strong> (exceso de horas docentes y margen menor al {umbralMargenPeligroso}%).
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-bold text-slate-600">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Zona Segura
                </span>
                <span className="flex items-center gap-1.5 font-bold text-slate-600">
                  <span className="w-3 h-3 rounded-full bg-amber-400"></span> Alerta
                </span>
                <span className="flex items-center gap-1.5 font-bold text-slate-600">
                  <span className="w-3 h-3 rounded-full bg-rose-600"></span> Peligro
                </span>
              </div>
            </div>

            {/* Cabecera de Columnas: Nivel de Horas Docentes */}
            <div className="grid grid-cols-12 gap-3 mb-2 text-center text-xs font-bold text-slate-700">
              <div className="col-span-3 text-left pl-2 font-mono text-[11px] text-slate-400 uppercase">
                Margen Operativo \ Horas
              </div>
              <div className="col-span-3 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200 text-emerald-950">
                <span>Horas Ligeras (&lt; {umbralHorasModeradas}h)</span>
                <span className="block text-[10px] font-normal text-emerald-700">Bajo costo directo</span>
              </div>
              <div className="col-span-3 bg-amber-50/70 p-2 rounded-lg border border-amber-200 text-amber-950">
                <span>Horas Moderadas ({umbralHorasModeradas} - {umbralHorasExcesivas - 1}h)</span>
                <span className="block text-[10px] font-normal text-amber-700">Carga estándar</span>
              </div>
              <div className="col-span-3 bg-rose-50/70 p-2 rounded-lg border border-rose-200 text-rose-950">
                <span>Horas Excesivas (≥ {umbralHorasExcesivas}h)</span>
                <span className="block text-[10px] font-normal text-rose-700">Sobrecarga y alto costo</span>
              </div>
            </div>

            {/* Filas de la Matriz 3x3 */}
            <div className="space-y-3">
              {celdasMatriz.map((fila, filaIdx) => (
                <div key={filaIdx} className="grid grid-cols-12 gap-3">
                  {/* Etiqueta de la Fila (Margen Operativo) */}
                  <div className="col-span-3 flex flex-col justify-center p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-xs font-black text-slate-900">
                      {fila[0].filaLabel}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      {filaIdx === 0
                        ? '🟢 Rentabilidad Excelente'
                        : filaIdx === 1
                        ? '🟡 Rentabilidad Aceptable'
                        : '🔴 Rentabilidad en Riesgo'}
                    </span>
                  </div>

                  {/* Las 3 Celdas de la Fila */}
                  {fila.map((celda) => (
                    <div
                      key={celda.key}
                      className={`col-span-3 rounded-xl p-3 border transition-all min-h-[140px] flex flex-col justify-between ${celda.bgClass}`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/80 text-slate-800 border border-slate-200">
                            {celda.badgeText}
                          </span>
                          <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-white font-mono text-slate-900 shadow-xs border border-slate-200">
                            {celda.proyectos.length} {celda.proyectos.length === 1 ? 'prog.' : 'progs.'}
                          </span>
                        </div>

                        {/* Listado de proyectos en esta celda */}
                        <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-0.5">
                          {celda.proyectos.map((item) => (
                            <div
                              key={item.proyecto.id}
                              className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs hover:border-indigo-400 transition-all text-xs"
                            >
                              <div className="flex items-start justify-between gap-1">
                                <span
                                  onClick={() => onVerDetalle(item.proyecto)}
                                  className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer line-clamp-1"
                                  title={item.proyecto.nombreProyecto}
                                >
                                  {item.proyecto.nombreProyecto}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-slate-600 mt-1 font-mono">
                                <span>⏰ {item.horasClase} hrs</span>
                                <span
                                  className={`font-bold ${
                                    item.margenRealPorcentaje < umbralMargenPeligroso
                                      ? 'text-rose-600'
                                      : item.margenRealPorcentaje >= umbralMargenSaludable
                                      ? 'text-emerald-700'
                                      : 'text-amber-600'
                                  }`}
                                >
                                  Margen: {item.margenRealPorcentaje.toFixed(1)}%
                                </span>
                              </div>

                              {/* Botón de Corrección / Simulación Rápida si está en riesgo */}
                              {(item.nivelRiesgo === 'CRITICO' || item.nivelRiesgo === 'ALTO') && (
                                <button
                                  type="button"
                                  onClick={() => handleAbrirSimulador(item)}
                                  className="mt-1.5 w-full py-1 text-[10px] font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded flex items-center justify-center gap-1 transition-colors"
                                >
                                  <Zap className="w-3 h-3 text-rose-600" />
                                  <span>Simular Corrección</span>
                                </button>
                              )}
                            </div>
                          ))}

                          {celda.proyectos.length === 0 && (
                            <div className="text-[11px] text-slate-400 text-center py-5 italic">
                              Sin proyectos en este cuadrante
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 mt-2 border-t border-slate-200/50 text-[10px] text-slate-500 font-mono flex items-center justify-between">
                        <span>Horas: {celda.colLabel.split(' ')[0]}</span>
                        <span>{celda.nivelAlerta}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: GRÁFICO DE DISPERSIÓN SCATTER (HORAS VS MARGEN OPERATIVO) */}
      {/* ========================================================================= */}
      {vistaModo === 'scatter' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                Dispersión de Sensibilidad: Horas de Clase vs. Margen Operativo Real
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cada punto es un proyecto educativo. Los puntos en la esquina inferior derecha representan el <strong>máximo riesgo de solvencia</strong>.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-500">
              Líneas de referencia: {umbralHorasExcesivas}h (Límite Carga) | {umbralMargenPeligroso}% (Límite Margen)
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Horas de Clase"
                  unit=" hrs"
                  domain={[0, 90]}
                  label={{ value: 'Horas Docentes de Clase (hrs)', position: 'insideBottom', offset: -10, fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Margen Operativo"
                  unit="%"
                  domain={[-10, 70]}
                  label={{ value: 'Margen Operativo Real (%)', angle: -90, position: 'insideLeft', fontSize: 11 }}
                />
                <ZAxis type="number" dataKey="z" range={[80, 400]} name="Costo Docente" />
                
                {/* Líneas de umbral */}
                <ReferenceLine
                  x={umbralHorasExcesivas}
                  stroke="#e11d48"
                  strokeDasharray="4 4"
                  label={{ value: `Horas Excesivas (≥${umbralHorasExcesivas}h)`, fill: '#e11d48', fontSize: 10, position: 'top' }}
                />
                <ReferenceLine
                  y={umbralMargenPeligroso}
                  stroke="#e11d48"
                  strokeDasharray="4 4"
                  label={{ value: `Margen Peligroso (<${umbralMargenPeligroso}%)`, fill: '#e11d48', fontSize: 10, position: 'right' }}
                />
                <ReferenceLine
                  y={umbralMargenSaludable}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  label={{ value: `Margen Óptimo (≥${umbralMargenSaludable}%)`, fill: '#10b981', fontSize: 10, position: 'right' }}
                />

                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const item: ProyectoAnalisisRiesgo = data.itemRef;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700 max-w-xs">
                          <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1">
                            <span className="font-bold text-white truncate">{data.nombre}</span>
                            <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${item.colorBadge}`}>
                              {data.nivelRiesgo}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-300">
                            Docente: <strong>{data.docente}</strong>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1">
                            <div>
                              <span className="text-slate-400 block">Horas Clase:</span>
                              <span className="font-bold text-amber-300">{data.x} hrs</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Margen Real:</span>
                              <span className={`font-bold ${data.y < 25 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {data.y}%
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Costo Docente:</span>
                              <span className="text-slate-200">{formatearMoneda(item.costoDocente, moneda)}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Punto Equilibrio:</span>
                              <span className="text-slate-200">{item.puntoEquilibrio} alumnos</span>
                            </div>
                          </div>
                          <div className="text-[10px] text-rose-300 border-t border-slate-800 pt-1.5 leading-tight">
                            💡 {item.accionCorrectiva}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                <Scatter name="Proyectos" data={scatterData}>
                  {scatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 3: TABLA DETALLADA CON TERMÓMETRO Y ACCIONES CORRECTIVAS */}
      {/* ========================================================================= */}
      {vistaModo === 'tabla' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Auditoría Semafórica de Proyectos ({proyectosFiltrados.length})
              </h3>
              <p className="text-xs text-slate-500">
                Termómetro de riesgo individual, desglose de carga horaria, porcentaje de absorción docente y acciones recomendadas.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Nivel de Riesgo</th>
                  <th className="py-3 px-3">Programa / Curso</th>
                  <th className="py-3 px-3">Docente Asignado</th>
                  <th className="py-3 px-3 text-center">Horas Docentes</th>
                  <th className="py-3 px-3 text-center">Costo Docente / Gasto Total</th>
                  <th className="py-3 px-3 text-center">Margen Operativo Real</th>
                  <th className="py-3 px-3">Diagnóstico & Recomendación Correctiva</th>
                  <th className="py-3 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {proyectosFiltrados.map((item) => {
                  return (
                    <tr key={item.proyecto.id} className="hover:bg-slate-50 transition-colors">
                      {/* Nivel de Riesgo con Badge y Barra */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${item.colorBadge}`}>
                          {item.nivelRiesgo === 'CRITICO' && <Flame className="w-3 h-3 text-rose-600 fill-rose-600" />}
                          {item.nivelRiesgo === 'ALTO' && <AlertTriangle className="w-3 h-3 text-orange-600" />}
                          {item.nivelRiesgo === 'MODERADO' && <Clock className="w-3 h-3 text-amber-600" />}
                          {item.nivelRiesgo === 'BAJO' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {item.nivelRiesgo}
                        </span>
                        <div className="w-20 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div
                            className={`h-full ${
                              item.nivelRiesgo === 'CRITICO'
                                ? 'bg-rose-600'
                                : item.nivelRiesgo === 'ALTO'
                                ? 'bg-orange-500'
                                : item.nivelRiesgo === 'MODERADO'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${item.scoreRiesgo}%` }}
                          ></div>
                        </div>
                      </td>

                      {/* Nombre y Tipo de Proyecto */}
                      <td className="py-3 px-3 max-w-xs">
                        <div
                          onClick={() => onVerDetalle(item.proyecto)}
                          className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer text-xs"
                        >
                          {item.proyecto.nombreProyecto}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                          <span className="bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                            {item.proyecto.tipoProyecto}
                          </span>
                          <span className="font-mono">
                            Qe: {item.puntoEquilibrio} alum.
                          </span>
                        </div>
                      </td>

                      {/* Docente */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-800 block text-xs">
                          {item.proyecto.nombreDocente}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formatearMoneda(item.tarifaHoraDocente, moneda)}/hr
                        </span>
                      </td>

                      {/* Horas Docentes con alerta */}
                      <td className="py-3 px-3 text-center font-mono">
                        <div className={`font-black text-xs ${item.esHorasExcesivas ? 'text-rose-600' : 'text-slate-800'}`}>
                          {item.horasClase} hrs
                        </div>
                        <span className="text-[9px] text-slate-500 block">
                          {item.esHorasExcesivas ? '⚠️ Excesivas' : item.horasClase >= umbralHorasModeradas ? 'Moderadas' : 'Ligeras'}
                        </span>
                      </td>

                      {/* Costo Docente y Peso en el Presupuesto */}
                      <td className="py-3 px-3 text-center font-mono">
                        <div className="font-bold text-slate-800 text-xs">
                          {formatearMoneda(item.costoDocente, moneda)}
                        </div>
                        <span
                          className={`text-[10px] font-bold block ${
                            item.pesoCostoDocentePorcentaje >= 70
                              ? 'text-rose-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {item.pesoCostoDocentePorcentaje.toFixed(0)}% del gasto
                        </span>
                      </td>

                      {/* Margen Operativo Real con alerta */}
                      <td className="py-3 px-3 text-center font-mono">
                        <div
                          className={`font-black text-xs ${
                            item.margenRealPorcentaje < umbralMargenPeligroso
                              ? 'text-rose-600'
                              : item.margenRealPorcentaje >= umbralMargenSaludable
                              ? 'text-emerald-700'
                              : 'text-amber-600'
                          }`}
                        >
                          {item.margenRealPorcentaje.toFixed(1)}%
                        </div>
                        <span className="text-[9px] text-slate-500 block">
                          {item.margenRealPorcentaje < umbralMargenPeligroso
                            ? '🔴 Crítico'
                            : item.margenRealPorcentaje >= umbralMargenSaludable
                            ? '🟢 Óptimo'
                            : '🟡 Aceptable'}
                        </span>
                      </td>

                      {/* Diagnóstico & Recomendación Correctiva */}
                      <td className="py-3 px-3 max-w-sm">
                        <p className="text-[11px] text-slate-700 font-medium leading-snug">
                          {item.diagnostico}
                        </p>
                        <p className="text-[10px] text-blue-700 font-semibold mt-1 flex items-center gap-1">
                          <span>💡</span>
                          <span>{item.accionCorrectiva}</span>
                        </p>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAbrirSimulador(item)}
                            className="px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-1 transition-colors"
                            title="Simular ajuste de horas y aforo en vivo"
                          >
                            <Zap className="w-3 h-3 text-rose-600" />
                            <span>Corregir</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditarProyecto(item.proyecto)}
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Editar proyecto completo"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL SIMULADOR RÁPIDO DE CORRECCIÓN DE RIESGO EN VIVO */}
      {/* ========================================================================= */}
      {proyectoSimulando && metricasSimuladas && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-rose-900 to-indigo-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm">
                    Simulador de Mitigación de Riesgo Académico
                  </h3>
                  <p className="text-[11px] text-rose-200">
                    Ajusta horas docentes o aforo para devolver el proyecto a la Zona Verde
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProyectoSimulando(null)}
                className="text-rose-200 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Programa seleccionado:</span>
                <h4 className="font-black text-slate-900 text-sm mt-0.5">{proyectoSimulando.nombreProyecto}</h4>
                <div className="flex items-center gap-2 mt-1 text-slate-600 text-[11px]">
                  <span>Docente: <strong>{proyectoSimulando.nombreDocente}</strong></span>
                  <span>•</span>
                  <span>Tarifa: <strong>{formatearMoneda(proyectoSimulando.tarifaHoraDocente || 200, moneda)}/h</strong></span>
                </div>
              </div>

              {/* Sliders de Simulación */}
              <div className="space-y-3 bg-blue-50/50 p-3.5 rounded-xl border border-blue-200">
                <div>
                  <div className="flex items-center justify-between mb-1 font-bold text-slate-800">
                    <label>1. Carga de Horas de Clase:</label>
                    <span className="font-mono text-indigo-700">{horasSimuladas} hrs</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    step="2"
                    value={horasSimuladas}
                    onChange={(e) => setHorasSimuladas(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>10h (Ágil)</span>
                    <span>30h (Estándar)</span>
                    <span>{umbralHorasExcesivas}h+ (Excesiva)</span>
                    <span>80h</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1 font-bold text-slate-800">
                    <label>2. Alumnos Matriculados Finales (Aforo):</label>
                    <span className="font-mono text-indigo-700">{alumnosSimulados} alumnos</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="35"
                    step="1"
                    value={alumnosSimulados}
                    onChange={(e) => setAlumnosSimulados(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Base mín: 4</span>
                    <span>10 cupos</span>
                    <span>20 cupos</span>
                    <span>35 cupos</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1 font-bold text-slate-800">
                    <label>3. Margen Operativo Deseado (%):</label>
                    <span className="font-mono text-indigo-700">{margenDeseadoSimulado}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="60"
                    step="5"
                    value={margenDeseadoSimulado}
                    onChange={(e) => setMargenDeseadoSimulado(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Comparación Antes vs. Después de la Simulación */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Estado Original</span>
                  <div className="mt-1 space-y-1 font-mono text-[11px]">
                    <div>Horas: <strong>{proyectoSimulando.horasClase}h</strong></div>
                    <div>Gasto: <strong>{formatearMoneda(proyectoSimulando.gastoTotalOperativo, moneda)}</strong></div>
                    <div>Margen: <strong className="text-rose-700">
                      {proyectoSimulando.ingresoRealTotal > 0
                        ? ((proyectoSimulando.totalGananciasFinales / proyectoSimulando.ingresoRealTotal) * 100).toFixed(1)
                        : '0'}%
                    </strong></div>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border ${
                  metricasSimuladas.nivel === 'BAJO'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : metricasSimuladas.nivel === 'MODERADO'
                    ? 'bg-amber-50 border-amber-300 text-amber-950'
                    : 'bg-rose-50 border-rose-300 text-rose-950'
                }`}>
                  <span className="text-[10px] font-bold uppercase block">Simulación Resultante</span>
                  <div className="mt-1 space-y-1 font-mono text-[11px]">
                    <div>Horas: <strong>{horasSimuladas}h</strong></div>
                    <div>Gasto: <strong>{formatearMoneda(metricasSimuladas.resultado.gastoTotalOperativo, moneda)}</strong></div>
                    <div>Margen: <strong className="text-emerald-700">{metricasSimuladas.margenReal.toFixed(1)}%</strong></div>
                    <div className="font-sans font-bold text-[10px] mt-1">
                      Dictamen: {metricasSimuladas.nivel === 'BAJO' ? '✅ ZONA SEGURA' : metricasSimuladas.nivel === 'MODERADO' ? '⚠️ ZONA OBSERVACIÓN' : '🔴 CONTINÚA EN RIESGO'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProyectoSimulando(null)}
                  className="px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                {onGuardarProyecto && (
                  <button
                    type="button"
                    onClick={handleAplicarCorreccion}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aplicar & Guardar Corrección</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
