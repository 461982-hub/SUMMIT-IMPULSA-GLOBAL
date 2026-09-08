import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import {
  BarChart3,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Plus,
  ArrowRight,
  TrendingUp,
  Filter,
  Layers,
  ChevronRight,
  Info,
  CalendarDays,
  ShieldCheck,
  ShieldAlert,
  Download,
  Laptop,
  Check,
  RefreshCw,
  Zap,
  Sliders,
  Award
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { formatearMoneda, calcularMetricasProyecto } from '../../utils/calculations';

interface AcademicWorkloadDistributionViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto?: (p: ProyectoEducativo) => void;
  onNuevoProyecto?: () => void;
  onVerDetalle?: (p: ProyectoEducativo) => void;
}

interface SemanaCarga {
  semanaKey: string;
  numeroSemana: number;
  nombreSemana: string;
  rangoFechas: string;
  mes: string;
  horasOcupadas: number;
  capacidadSemanal: number;
  horasDisponibles: number;
  porcentajeOcupacion: number;
  horasSimuladas: number;
  nuevoTotalOcupado: number;
  nuevoPorcentajeOcupacion: number;
  docentesActivos: number;
  proyectosNombres: string[];
  detalles: Array<{
    proyecto: string;
    docente: string;
    horas: number;
    horario: string;
    modalidad: string;
  }>;
}

export const AcademicWorkloadDistributionView: React.FC<AcademicWorkloadDistributionViewProps> = ({
  proyectos,
  moneda,
  onGuardarProyecto,
  onNuevoProyecto,
  onVerDetalle,
}) => {
  // Configuración de Capacidad Institucional por Semana (horas de aula/docentes disponibles en la institución)
  const [capacidadInstitucionalSemanal, setCapacidadInstitucionalSemanal] = useState<number>(100);
  
  // Filtros de Vista
  const [filtroMes, setFiltroMes] = useState<string>('todos');
  const [filtroModalidad, setFiltroModalidad] = useState<string>('todos');
  const [filtroDocente, setFiltroDocente] = useState<string>('todos');
  
  // Vista activa de desglose (Gráfico Combinado Semanal vs Desglose Docente vs Matriz Franjas)
  const [tabGrafico, setTabGrafico] = useState<'semanal' | 'docentes' | 'franjas' | 'simulador'>('semanal');

  // Estado del Simulador de Asignación de Nuevo Proyecto
  const [simularActivo, setSimularActivo] = useState<boolean>(true);
  const [nuevoNombre, setNuevoNombre] = useState<string>('Diplomado en Inteligencia Artificial Aplicada a Finanzas');
  const [nuevoTipo, setNuevoTipo] = useState<string>('DIPLOMADO');
  const [nuevoHorasTotales, setNuevoHorasTotales] = useState<number>(24);
  const [nuevoDuracionSemanas, setNuevoDuracionSemanas] = useState<number>(6);
  const [nuevoSemanaInicio, setNuevoSemanaInicio] = useState<number>(36); // Sem 36 (Sep 01)
  const [nuevoDocentePropuesto, setNuevoDocentePropuesto] = useState<string>('');
  const [nuevoModalidad, setNuevoModalidad] = useState<string>('Virtual Sincrónica');
  const [nuevoHorarioTexto, setNuevoHorarioTexto] = useState<string>('Martes y Jueves (18:00 - 20:00)');
  const [nuevoProyectoCreado, setNuevoProyectoCreado] = useState<boolean>(false);

  // Lista de docentes únicos
  const listaDocentes = useMemo(() => {
    const set = new Set<string>();
    proyectos.forEach((p) => {
      if (p.nombreDocente) set.add(p.nombreDocente);
    });
    return Array.from(set);
  }, [proyectos]);

  // Inicializar docente propuesto en simulador si está vacío
  React.useEffect(() => {
    if (!nuevoDocentePropuesto && listaDocentes.length > 0) {
      setNuevoDocentePropuesto(listaDocentes[0]);
    }
  }, [listaDocentes, nuevoDocentePropuesto]);

  // Cálculo de horas por semana para el proyecto simulado
  const nuevoHorasPorSemana = useMemo(() => {
    if (nuevoDuracionSemanas <= 0) return 0;
    return Number((nuevoHorasTotales / nuevoDuracionSemanas).toFixed(1));
  }, [nuevoHorasTotales, nuevoDuracionSemanas]);

  // Generación de la serie de 12 semanas (Horizonte Académico Sep - Nov 2026)
  const semanasData = useMemo<SemanaCarga[]>(() => {
    const baseSemanas = [
      { num: 34, nombre: 'Sem 34', rango: '18 Ago - 24 Ago', mes: 'Agosto' },
      { num: 35, nombre: 'Sem 35', rango: '25 Ago - 31 Ago', mes: 'Agosto' },
      { num: 36, nombre: 'Sem 36', rango: '01 Sep - 07 Sep', mes: 'Septiembre' },
      { num: 37, nombre: 'Sem 37', rango: '08 Sep - 14 Sep', mes: 'Septiembre' },
      { num: 38, nombre: 'Sem 38', rango: '15 Sep - 21 Sep', mes: 'Septiembre' },
      { num: 39, nombre: 'Sem 39', rango: '22 Sep - 28 Sep', mes: 'Septiembre' },
      { num: 40, nombre: 'Sem 40', rango: '29 Sep - 05 Oct', mes: 'Octubre' },
      { num: 41, nombre: 'Sem 41', rango: '06 Oct - 12 Oct', mes: 'Octubre' },
      { num: 42, nombre: 'Sem 42', rango: '13 Oct - 19 Oct', mes: 'Octubre' },
      { num: 43, nombre: 'Sem 43', rango: '20 Oct - 26 Oct', mes: 'Octubre' },
      { num: 44, nombre: 'Sem 44', rango: '27 Oct - 02 Nov', mes: 'Noviembre' },
      { num: 45, nombre: 'Sem 45', rango: '03 Nov - 09 Nov', mes: 'Noviembre' },
      { num: 46, nombre: 'Sem 46', rango: '10 Nov - 16 Nov', mes: 'Noviembre' },
      { num: 47, nombre: 'Sem 47', rango: '17 Nov - 23 Nov', mes: 'Noviembre' },
    ];

    return baseSemanas.map((sem) => {
      // Filtrar proyectos que aplican según filtros globales
      let horasOcupadasEnSemana = 0;
      const docentesEnSemana = new Set<string>();
      const proyectosNombres: string[] = [];
      const detalles: Array<{
        proyecto: string;
        docente: string;
        horas: number;
        horario: string;
        modalidad: string;
      }> = [];

      proyectos.forEach((p, idx) => {
        // Aplicar filtros
        if (filtroModalidad !== 'todos' && p.modalidad && !p.modalidad.toLowerCase().includes(filtroModalidad.toLowerCase())) {
          return;
        }
        if (filtroDocente !== 'todos' && p.nombreDocente !== filtroDocente) {
          return;
        }

        // Distribución horaria modelada por programa
        // Si el proyecto tiene fecha de inicio, calculamos su ventana de duración
        const totalHoras = p.horasClase || 20;
        const duracionSemanasEst = Math.max(2, Math.min(10, Math.ceil(totalHoras / 4)));
        
        // Asignación de semanas activas del proyecto (basado en índice/id para consistencia determinista)
        const inicioOffset = (idx % 6); 
        const semanaInicioProy = 35 + inicioOffset;
        const semanaFinProy = semanaInicioProy + duracionSemanasEst - 1;

        if (sem.num >= semanaInicioProy && sem.num <= semanaFinProy) {
          const horasSemanales = Number((totalHoras / duracionSemanasEst).toFixed(1));
          horasOcupadasEnSemana += horasSemanales;
          docentesEnSemana.add(p.nombreDocente || 'Docente');
          proyectosNombres.push(p.nombreProyecto);
          detalles.push({
            proyecto: p.nombreProyecto,
            docente: p.nombreDocente || 'No Asignado',
            horas: horasSemanales,
            horario: p.horario || '18:00 - 20:00',
            modalidad: p.modalidad || 'Virtual',
          });
        }
      });

      // Cálculo de Horas Simuladas del Nuevo Proyecto
      let horasSimuladas = 0;
      if (simularActivo) {
        const semFinSim = nuevoSemanaInicio + nuevoDuracionSemanas - 1;
        if (sem.num >= nuevoSemanaInicio && sem.num <= semFinSim) {
          horasSimuladas = nuevoHorasPorSemana;
        }
      }

      const horasOcupadasFinal = Number(horasOcupadasEnSemana.toFixed(1));
      const capacidad = capacidadInstitucionalSemanal;
      const horasDisponibles = Math.max(0, Number((capacidad - horasOcupadasFinal).toFixed(1)));
      const porcentajeOcupacion = Math.min(100, Math.round((horasOcupadasFinal / capacidad) * 100));

      const nuevoTotalOcupado = Number((horasOcupadasFinal + horasSimuladas).toFixed(1));
      const nuevoPorcentajeOcupacion = Math.min(100, Math.round((nuevoTotalOcupado / capacidad) * 100));

      return {
        semanaKey: `sem-${sem.num}`,
        numeroSemana: sem.num,
        nombreSemana: sem.nombre,
        rangoFechas: sem.rango,
        mes: sem.mes,
        horasOcupadas: horasOcupadasFinal,
        capacidadSemanal: capacidad,
        horasDisponibles,
        porcentajeOcupacion,
        horasSimuladas,
        nuevoTotalOcupado,
        nuevoPorcentajeOcupacion,
        docentesActivos: docentesEnSemana.size,
        proyectosNombres,
        detalles,
      };
    });
  }, [
    proyectos,
    capacidadInstitucionalSemanal,
    filtroModalidad,
    filtroDocente,
    simularActivo,
    nuevoSemanaInicio,
    nuevoDuracionSemanas,
    nuevoHorasPorSemana,
  ]);

  // Semanas filtradas por mes
  const semanasFiltradas = useMemo(() => {
    if (filtroMes === 'todos') return semanasData;
    return semanasData.filter((s) => s.mes.toLowerCase() === filtroMes.toLowerCase());
  }, [semanasData, filtroMes]);

  // Estadísticas Agregadas Globales
  const statsGlobales = useMemo(() => {
    const totalHorasOcupadasPromedio = semanasData.length > 0
      ? Number((semanasData.reduce((acc, s) => acc + s.horasOcupadas, 0) / semanasData.length).toFixed(1))
      : 0;

    const totalHorasDisponiblesPromedio = Math.max(
      0,
      Number((capacidadInstitucionalSemanal - totalHorasOcupadasPromedio).toFixed(1))
    );

    const porcentajeOcupacionPromedio = Math.round(
      (totalHorasOcupadasPromedio / capacidadInstitucionalSemanal) * 100
    );

    // Semana pico de máxima carga
    const semanaPico = [...semanasData].sort((a, b) => b.horasOcupadas - a.horasOcupadas)[0];
    
    // Semana más libre con mayor disponibilidad
    const semanaMasLibre = [...semanasData].sort((a, b) => a.horasOcupadas - b.horasOcupadas)[0];

    // Chequeo de viabilidad del proyecto simulado
    const semanasConSobrecarga = semanasData.filter((s) => s.nuevoPorcentajeOcupacion > 90);
    const esSimulacionViable = semanasConSobrecarga.length === 0;

    return {
      totalHorasOcupadasPromedio,
      totalHorasDisponiblesPromedio,
      porcentajeOcupacionPromedio,
      semanaPico,
      semanaMasLibre,
      esSimulacionViable,
      semanasConSobrecarga,
    };
  }, [semanasData, capacidadInstitucionalSemanal]);

  // Estadísticas por Docente (Carga vs Capacidad Semanal)
  const cargaPorDocente = useMemo(() => {
    const map = new Map<string, {
      nombre: string;
      especialidad: string;
      horasSemanalesAsignadas: number;
      horasSemanalesDisponibles: number;
      capacidadMaximaSemanal: number;
      porcentajeCarga: number;
      proyectosCount: number;
      proyectosLista: string[];
      estado: 'DISPONIBLE' | 'OPTIMA' | 'ALTA' | 'SOBRECARGA';
    }>();

    listaDocentes.forEach((doc) => {
      const proyectosDoc = proyectos.filter((p) => p.nombreDocente === doc);
      const totalHoras = proyectosDoc.reduce((acc, p) => acc + (p.horasClase || 0), 0);
      // Promedio semanal asumiendo 8 semanas de ciclo
      const horasSemanales = Number((totalHoras / 8).toFixed(1));
      const capacidadMax = 20; // 20h semanales de límite contractual estándar
      const horasDisp = Math.max(0, Number((capacidadMax - horasSemanales).toFixed(1)));
      const pct = Math.min(100, Math.round((horasSemanales / capacidadMax) * 100));

      let estado: 'DISPONIBLE' | 'OPTIMA' | 'ALTA' | 'SOBRECARGA' = 'DISPONIBLE';
      if (pct > 95) estado = 'SOBRECARGA';
      else if (pct >= 75) estado = 'ALTA';
      else if (pct >= 40) estado = 'OPTIMA';

      map.set(doc, {
        nombre: doc,
        especialidad: proyectosDoc[0]?.docenteEspecialidad || 'Especialista',
        horasSemanalesAsignadas: horasSemanales,
        horasSemanalesDisponibles: horasDisp,
        capacidadMaximaSemanal: capacidadMax,
        porcentajeCarga: pct,
        proyectosCount: proyectosDoc.length,
        proyectosLista: proyectosDoc.map((p) => p.nombreProyecto),
        estado,
      });
    });

    return Array.from(map.values()).sort((a, b) => b.horasSemanalesAsignadas - a.horasSemanalesAsignadas);
  }, [listaDocentes, proyectos]);

  // Matriz de Ocupación por Franja Horaria (Lunes a Sábado x Turnos)
  const matrizFranjas = useMemo(() => {
    const franjas = [
      { id: 'matutina', nombre: 'Mañana (08:00 - 12:00)', capacidadSlots: 10 },
      { id: 'vespertina', nombre: 'Tarde (14:00 - 18:00)', capacidadSlots: 10 },
      { id: 'nocturna', nombre: 'Noche (18:00 - 21:30)', capacidadSlots: 12 },
    ];

    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    return dias.map((dia) => {
      const turnos = franjas.map((f) => {
        // Calcular ocupación estimada en este turno
        let ocupados = 0;
        proyectos.forEach((p) => {
          const horario = (p.horario || '').toLowerCase();
          const diasP = (p.diasClase || '').toLowerCase();
          
          const coincideDia = diasP.includes(dia.toLowerCase()) || diasP.includes(dia.substring(0, 3).toLowerCase());
          
          let coincideTurno = false;
          if (f.id === 'nocturna' && (horario.includes('pm') || horario.includes('18:') || horario.includes('19:') || horario.includes('20:'))) {
            coincideTurno = true;
          } else if (f.id === 'matutina' && (horario.includes('am') || horario.includes('08:') || horario.includes('09:') || horario.includes('10:'))) {
            coincideTurno = true;
          } else if (f.id === 'vespertina' && (horario.includes('14:') || horario.includes('15:') || horario.includes('16:'))) {
            coincideTurno = true;
          }

          if (coincideDia && coincideTurno) {
            ocupados++;
          }
        });

        // Asegurar rango válido
        const ocupadosFinal = Math.min(f.capacidadSlots, ocupados);
        const disponibles = f.capacidadSlots - ocupadosFinal;
        const pctOcupacion = Math.round((ocupadosFinal / f.capacidadSlots) * 100);

        return {
          franjaId: f.id,
          franjaNombre: f.nombre,
          capacidadSlots: f.capacidadSlots,
          ocupados: ocupadosFinal,
          disponibles,
          pctOcupacion,
        };
      });

      return {
        dia,
        turnos,
      };
    });
  }, [proyectos]);

  // Aplicar Proyecto Simulado al Catálogo Real
  const handleAplicarNuevoProyecto = () => {
    if (!nuevoNombre.trim()) return;

    if (onGuardarProyecto) {
      const nuevoId = String(Math.floor(1000 + Math.random() * 9000));
      const nuevoObj = calcularMetricasProyecto({
        id: nuevoId,
        nombreProyecto: nuevoNombre.trim(),
        tipoProyecto: nuevoTipo as any,
        nivel: 'Intermedio',
        codigoPrograma: `ACAD-2026-0${nuevoId}`,
        nombreDocente: nuevoDocentePropuesto || 'Docente Titular',
        docenteEspecialidad: 'Especialista en Cátedra',
        horasClase: nuevoHorasTotales,
        tarifaHoraDocente: 200,
        costoZoom: 350,
        costoPapeleria: 0,
        gastosVarios: 150,
        margenGananciaOperativa: 35,
        horasTeoricas: Math.round(nuevoHorasTotales * 0.4),
        horasPracticas: Math.round(nuevoHorasTotales * 0.6),
        modalidad: nuevoModalidad,
        horario: nuevoHorarioTexto,
        diasClase: 'Martes y Jueves',
        seccion: 'Sección A',
        fechaProgramacion: '2026-09-01',
        fechaVenta: '2026-08-25',
        metodoVenta: 'Redes sociales',
        seLlevoACabo: 'En curso',
        observaciones: 'Asignado mediante Simulador de Distribución de Carga Académica.',
        alumnosProyectados: 15,
        alumnosFinal: 15,
        objetivoGeneral: `Desarrollar competencias profesionales de alto impacto a través de ${nuevoHorasTotales} horas de formación especializada.`,
        aforoYPrerrequisitos: {
          aforoMaximo: 25,
          aforoMinimoRequerido: 8,
          estadoAforo: 'Cupos Disponibles',
          nivelDificultad: 'Intermedio',
          experienciaPreviaRequerida: 'Conocimientos básicos del área.',
        },
      });

      onGuardarProyecto(nuevoObj);
      setNuevoProyectoCreado(true);
      setTimeout(() => setNuevoProyectoCreado(false), 4000);
    }
  };

  // Tooltip personalizado para Recharts
  const CustomTooltipSemanal = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: SemanaCarga = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-2 max-w-xs z-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 gap-2">
            <div>
              <span className="font-bold text-white block">{data.nombreSemana} ({data.mes})</span>
              <span className="text-[10px] text-slate-400 font-mono">{data.rangoFechas}</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
              data.porcentajeOcupacion > 85 ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40' :
              data.porcentajeOcupacion > 65 ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' :
              'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
            }`}>
              {data.porcentajeOcupacion}% Ocupado
            </span>
          </div>

          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex justify-between text-indigo-300">
              <span>● Horas Ocupadas:</span>
              <span className="font-bold">{data.horasOcupadas} hrs</span>
            </div>
            <div className="flex justify-between text-emerald-400">
              <span>● Capacidad Disponible:</span>
              <span className="font-bold">{data.horasDisponibles} hrs</span>
            </div>
            <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1">
              <span>Capacidad Semanal Total:</span>
              <span>{data.capacidadSemanal} hrs</span>
            </div>

            {simularActivo && data.horasSimuladas > 0 && (
              <div className="bg-amber-950/80 border border-amber-500/40 p-1.5 rounded text-[10px] text-amber-200 mt-1 space-y-0.5">
                <div className="flex justify-between font-bold">
                  <span>+ Simulación Nuevo Proyecto:</span>
                  <span>+{data.horasSimuladas} hrs/sem</span>
                </div>
                <div className="flex justify-between text-amber-300">
                  <span>Nueva Ocupación Total:</span>
                  <span>{data.nuevoTotalOcupado}h ({data.nuevoPorcentajeOcupacion}%)</span>
                </div>
              </div>
            )}
          </div>

          {data.proyectosNombres.length > 0 && (
            <div className="pt-1.5 border-t border-slate-800 text-[10px] text-slate-300 space-y-0.5">
              <span className="font-bold text-slate-400 uppercase tracking-wider block">
                Cátedras en Sesión ({data.proyectosNombres.length}):
              </span>
              <ul className="list-disc pl-3 space-y-0.5 text-slate-300">
                {data.proyectosNombres.slice(0, 3).map((nom, i) => (
                  <li key={i} className="truncate max-w-[220px]">{nom}</li>
                ))}
                {data.proyectosNombres.length > 3 && (
                  <li className="text-slate-400 italic">+{data.proyectosNombres.length - 3} programas más...</li>
                )}
              </ul>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Institucional de Distribución de Carga Académica */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-5 sm:p-6 rounded-2xl shadow-md border border-indigo-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/30">
              <BarChart3 className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-white tracking-wide">
                Distribución de Carga Académica & Capacidad Semanal
              </h3>
              <span className="text-[10px] font-mono uppercase bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded font-bold">
                Recharts Analytics • Horas Ocupadas vs. Disponibles • Simulador de Nuevos Proyectos
              </span>
            </div>
          </div>
          <p className="text-xs text-indigo-200 max-w-3xl leading-relaxed mt-1">
            Visualización analítica de la carga horaria semanal impartida vs. capacidad instalada de aulas y docentes. Diseñada para balancear la carga docente y planificar la asignación estratégica de nuevos diplomados, talleres y programas ejecutivos sin cuellos de botella.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setSimularActivo(!simularActivo)}
            className={`flex items-center gap-1.5 px-3.5 py-2 font-bold text-xs rounded-xl shadow-xs transition-all border ${
              simularActivo
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-300 font-black'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
            }`}
          >
            <Zap className={`w-4 h-4 ${simularActivo ? 'fill-slate-950' : ''}`} />
            <span>{simularActivo ? 'Simulador de Asignación: ACTIVO' : 'Activar Simulador de Carga'}</span>
          </button>

          {onNuevoProyecto && (
            <button
              type="button"
              onClick={onNuevoProyecto}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all border border-blue-400/40"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Proyecto</span>
            </button>
          )}
        </div>
      </div>

      {nuevoProyectoCreado && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2.5 animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>¡Nuevo proyecto "{nuevoNombre}" asignado e insertado exitosamente en el catálogo de Gerencia Académica!</span>
        </div>
      )}

      {/* 2. Tarjetas de Resumen & KPIs de Capacidad Semanal */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Carga Semanal Promedio</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-indigo-700 font-mono">
            {statsGlobales.totalHorasOcupadasPromedio} hrs/sem
          </div>
          <div className="text-[11px] text-slate-500">
            Impartidas en {proyectos.length} cátedras activas
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Capacidad Libre Promedio</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">
            {statsGlobales.totalHorasDisponiblesPromedio} hrs/sem
          </div>
          <div className="text-[11px] text-slate-500">
            Espacio disponible para nuevos cursos
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tasa de Ocupación Global</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono flex items-center gap-1.5">
            {statsGlobales.porcentajeOcupacionPromedio}%
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              statsGlobales.porcentajeOcupacionPromedio > 80 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {statsGlobales.porcentajeOcupacionPromedio > 80 ? 'Alta Demanda' : 'Nivel Óptimo'}
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            Base instalada: {capacidadInstitucionalSemanal}h máx/sem
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ventana de Oportunidad</span>
            <CalendarDays className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-base sm:text-lg font-black text-amber-700 font-mono truncate">
            {statsGlobales.semanaMasLibre?.nombreSemana} ({statsGlobales.semanaMasLibre?.horasDisponibles}h libres)
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            Rango: {statsGlobales.semanaMasLibre?.rangoFechas}
          </div>
        </div>
      </div>

      {/* 3. Barra de Navegación de Vistas del Gráfico & Filtros */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Pestañas de Vista */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setTabGrafico('semanal')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              tabGrafico === 'semanal'
                ? 'bg-white text-indigo-950 shadow-xs ring-1 ring-slate-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Cronograma Semanal (Ocupadas vs Disponibles)</span>
          </button>

          <button
            type="button"
            onClick={() => setTabGrafico('docentes')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              tabGrafico === 'docentes'
                ? 'bg-white text-indigo-950 shadow-xs ring-1 ring-slate-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Carga por Docente ({listaDocentes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTabGrafico('franjas')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              tabGrafico === 'franjas'
                ? 'bg-white text-indigo-950 shadow-xs ring-1 ring-slate-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span>Matriz de Horarios & Días</span>
          </button>
        </div>

        {/* Filtros Dinámicos */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Filtro Mes */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Mes:</span>
            <select
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none text-xs cursor-pointer"
            >
              <option value="todos">Todos los Meses</option>
              <option value="agosto">Agosto</option>
              <option value="septiembre">Septiembre</option>
              <option value="octubre">Octubre</option>
              <option value="noviembre">Noviembre</option>
            </select>
          </div>

          {/* Filtro Modalidad */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Modalidad:</span>
            <select
              value={filtroModalidad}
              onChange={(e) => setFiltroModalidad(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none text-xs cursor-pointer"
            >
              <option value="todos">Todas</option>
              <option value="virtual">Virtual</option>
              <option value="presencial">Presencial</option>
              <option value="híbrida">Híbrida</option>
            </select>
          </div>

          {/* Ajuste de Capacidad Máxima */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Tope Semanal:</span>
            <select
              value={capacidadInstitucionalSemanal}
              onChange={(e) => setCapacidadInstitucionalSemanal(Number(e.target.value))}
              className="bg-transparent font-bold text-indigo-700 focus:outline-none text-xs font-mono cursor-pointer"
            >
              <option value={80}>80h / sem</option>
              <option value={100}>100h / sem</option>
              <option value={120}>120h / sem</option>
              <option value={150}>150h / sem</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. VISTA PRINCIPAL: GRÁFICO RECHARTS DE DISTRIBUCIÓN SEMANAL */}
      {tabGrafico === 'semanal' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>Horas de Clase Ocupadas vs. Disponibles por Semana (Período 2026)</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Las barras apiladas representan las horas en sesión (azul) y el remanente disponible (verde) hasta el tope institucional de {capacidadInstitucionalSemanal}h/sem.
              </p>
            </div>

            {/* Leyenda Rápida */}
            <div className="flex items-center gap-3 text-xs font-bold shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-indigo-600 inline-block" />
                <span className="text-slate-700">Horas Ocupadas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-emerald-400 inline-block" />
                <span className="text-slate-700">Capacidad Libre</span>
              </div>
              {simularActivo && (
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-amber-400 inline-block animate-pulse" />
                  <span className="text-amber-800 font-extrabold">+ Simulación ({nuevoHorasPorSemana}h/sem)</span>
                </div>
              )}
            </div>
          </div>

          {/* Gráfico Recharts ComposedChart */}
          <div className="w-full h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={semanasFiltradas}
                margin={{ top: 20, right: 25, bottom: 20, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="nombreSemana"
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                  unit="h"
                  domain={[0, capacidadInstitucionalSemanal + 20]}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  unit="%"
                  domain={[0, 120]}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltipSemanal />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', fontWeight: 'bold' }}
                />

                {/* Línea de Capacidad Máxima Institucional */}
                <ReferenceLine
                  yAxisId="left"
                  y={capacidadInstitucionalSemanal}
                  stroke="#E11D48"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Límite Máximo Institucional (${capacidadInstitucionalSemanal}h)`,
                    position: 'insideTopRight',
                    fill: '#E11D48',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                />

                {/* Barra Apilada: Horas Ocupadas */}
                <Bar
                  yAxisId="left"
                  dataKey="horasOcupadas"
                  name="Horas Ocupadas"
                  stackId="carga"
                  fill="#4F46E5"
                  radius={[0, 0, 4, 4]}
                />

                {/* Barra Apilada Simulada (si está activa) */}
                {simularActivo && (
                  <Bar
                    yAxisId="left"
                    dataKey="horasSimuladas"
                    name="+ Carga Simulada Nuevo Curso"
                    stackId="carga"
                    fill="#F59E0B"
                  />
                )}

                {/* Barra Apilada: Horas Disponibles */}
                <Bar
                  yAxisId="left"
                  dataKey="horasDisponibles"
                  name="Horas Disponibles"
                  stackId="carga"
                  fill="#34D399"
                  radius={[4, 4, 0, 0]}
                />

                {/* Línea de Porcentaje de Ocupación */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey={simularActivo ? 'nuevoPorcentajeOcupacion' : 'porcentajeOcupacion'}
                  name="% Saturación Semanal"
                  stroke="#0F172A"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#0F172A', strokeWidth: 1 }}
                  activeDot={{ r: 6, fill: '#E11D48' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Diagnóstico Semanal & Recomendaciones */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <span className="font-extrabold flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Mejores Semanas para Nuevas Aperturas
              </span>
              <p className="text-[11px] text-emerald-950">
                Las <strong>Semanas 34, 35 y 46</strong> cuentan con más del <strong>65% de capacidad libre</strong>, ideales para lanzar programas de 20h a 30h sin sobrecargar la infraestructura virtual o presencial.
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <span className="font-extrabold flex items-center gap-1.5 text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Picos de Mayor Concentración Horaria
              </span>
              <p className="text-[11px] text-amber-950">
                La <strong>Semana 38 y 39</strong> presentan la mayor demanda horaria ({statsGlobales.semanaPico?.horasOcupadas}h ocupadas). Se sugiere evitar iniciar nuevas cátedras en esas fechas.
              </p>
            </div>

            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-xs text-indigo-900 space-y-1">
              <span className="font-extrabold flex items-center gap-1.5 text-indigo-800">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Impacto del Proyecto Simulado
              </span>
              <p className="text-[11px] text-indigo-950">
                {statsGlobales.esSimulacionViable ? (
                  <span>✅ <strong>Factibilidad Positiva:</strong> El nuevo curso de {nuevoHorasTotales}h distribuidas a {nuevoHorasPorSemana}h/sem cabe holgadamente sin superar el límite de saturación.</span>
                ) : (
                  <span>⚠️ <strong>Precaución de Saturación:</strong> Se detectan {statsGlobales.semanasConSobrecarga.length} semanas con ocupación superior al 90%.</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. VISTA DE CARGA Y DISPONIBILIDAD POR DOCENTE */}
      {tabGrafico === 'docentes' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Carga Semanal Impartida vs. Disponibilidad por Docente</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Control de balance docente frente al límite contractual estándar de 20 horas académicas semanales por instructor.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl">
              {listaDocentes.length} Docentes en Catálogo
            </span>
          </div>

          {/* Gráfico Horizontal Recharts de Docentes */}
          <div className="w-full h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={cargaPorDocente}
                layout="vertical"
                margin={{ top: 10, right: 30, bottom: 10, left: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" unit="h" domain={[0, 25]} tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis dataKey="nombre" type="category" tick={{ fontSize: 11, fill: '#1E293B', fontWeight: 600 }} />
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} hrs/semana`, name === 'horasSemanalesAsignadas' ? 'Horas Asignadas' : 'Horas Libres']}
                  contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '10px', fontSize: '12px' }}
                />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                <ReferenceLine x={20} stroke="#E11D48" strokeDasharray="3 3" label={{ value: 'Tope 20h', fill: '#E11D48', fontSize: 10 }} />
                <Bar dataKey="horasSemanalesAsignadas" name="Horas Asignadas" stackId="a" fill="#6366F1" radius={[0, 0, 0, 0]} />
                <Bar dataKey="horasSemanalesDisponibles" name="Disponibilidad Libre" stackId="a" fill="#34D399" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabla Desglosada de Docentes */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-3">Instructor</th>
                  <th className="py-2.5 px-3">Especialidad</th>
                  <th className="py-2.5 px-3 text-center">Cátedras Asignadas</th>
                  <th className="py-2.5 px-3 text-center">Horas/Semana</th>
                  <th className="py-2.5 px-3 text-center">Capacidad Disponible</th>
                  <th className="py-2.5 px-3 text-center">Saturación</th>
                  <th className="py-2.5 px-3 text-right">Diagnóstico para Nuevos Proyectos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cargaPorDocente.map((doc) => (
                  <tr key={doc.nombre} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {doc.nombre}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {doc.especialidad}
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-slate-800">
                      {doc.proyectosCount} {doc.proyectosCount === 1 ? 'curso' : 'cursos'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-indigo-700">
                      {doc.horasSemanalesAsignadas} h/sem
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-600">
                      {doc.horasSemanalesDisponibles} h libres
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full ${
                              doc.porcentajeCarga > 85 ? 'bg-rose-500' :
                              doc.porcentajeCarga > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${doc.porcentajeCarga}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] font-bold text-slate-700">{doc.porcentajeCarga}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {doc.estado === 'DISPONIBLE' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Alta Disponibilidad para Cátedra
                        </span>
                      )}
                      {doc.estado === 'OPTIMA' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                          <Check className="w-3 h-3 text-blue-600" />
                          Carga Balanceada
                        </span>
                      )}
                      {doc.estado === 'ALTA' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Carga Alta (Priorizar otros)
                        </span>
                      )}
                      {doc.estado === 'SOBRECARGA' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          Sobrecarga (No asignar)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. VISTA DE MATRIZ DE HORARIOS Y DÍAS (HEATMAP) */}
      {tabGrafico === 'franjas' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>Mapa de Ocupación por Días y Franjas Horarias (Aulas & Zoom)</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Identifica las franjas horarias con menor congestión para programar nuevas secciones sin colisión de espacios.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded border border-emerald-200">🟢 0-30% Libre</span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded border border-amber-200">🟡 31-70% Moderado</span>
              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded border border-rose-200">🔴 71-100% Ocupado</span>
            </div>
          </div>

          {/* Matriz de Celdas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {matrizFranjas.map((item) => (
              <div key={item.dia} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="font-black text-slate-900 text-xs uppercase tracking-wider">{item.dia}</span>
                  <span className="text-[10px] text-slate-500 font-semibold">3 Franjas</span>
                </div>

                <div className="space-y-2">
                  {item.turnos.map((t) => {
                    const esLibre = t.pctOcupacion <= 30;
                    const esModerado = t.pctOcupacion > 30 && t.pctOcupacion <= 70;
                    return (
                      <div
                        key={t.franjaId}
                        className={`p-2.5 rounded-lg border transition-all text-xs ${
                          esLibre
                            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                            : esModerado
                            ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                            : 'bg-rose-50/80 border-rose-200 text-rose-950'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-[11px]">
                          <span>{t.franjaNombre}</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-white/80 border">
                            {t.ocupados} / {t.capacidadSlots} slots
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] mt-1.5 opacity-90">
                          <span>{t.disponibles} aulas libres</span>
                          <span className="font-bold">{t.pctOcupacion}% Ocupado</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. MÓDULO INTERACTIVO: SIMULADOR DE ASIGNACIÓN DE NUEVOS PROYECTOS */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 p-5 sm:p-6 rounded-2xl border border-indigo-700 text-white shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-indigo-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold">
              <Zap className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                Simulador de Impacto para Asignación de Nuevos Proyectos
              </h4>
              <span className="text-[11px] text-indigo-200">
                Prueba el ingreso de un nuevo programa antes de abrir matrícula y verifica su compatibilidad con la capacidad semanal.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAplicarNuevoProyecto}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Aplicar & Registrar Cátedra</span>
            </button>
          </div>
        </div>

        {/* Formulario del Simulador */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider block">
              Nombre del Programa Prospecto
            </label>
            <input
              type="text"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              className="w-full bg-slate-800/90 border border-indigo-600/60 rounded-xl px-3 py-2 text-white font-medium text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
              placeholder="Ej. Certificación en Gestión de Riesgos..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider block">
              Tipo & Formato Académico
            </label>
            <select
              value={nuevoTipo}
              onChange={(e) => setNuevoTipo(e.target.value)}
              className="w-full bg-slate-800/90 border border-indigo-600/60 rounded-xl px-3 py-2 text-white font-bold text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
            >
              <option value="DIPLOMADO">Diplomado Especializado</option>
              <option value="Curso Especializado">Curso Especializado</option>
              <option value="Taller Práctico">Taller Práctico Intensivo</option>
              <option value="Certificación Profesional">Certificación Profesional</option>
              <option value="Programa Ejecutivo">Programa Ejecutivo</option>
              <option value="Masterclass">Masterclass</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider block">
              Horas Totales & Semanas
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min={4}
                max={120}
                value={nuevoHorasTotales}
                onChange={(e) => setNuevoHorasTotales(Math.max(1, Number(e.target.value)))}
                className="bg-slate-800/90 border border-indigo-600/60 rounded-xl px-2.5 py-2 text-white font-bold text-xs text-center font-mono"
                title="Horas Totales de Clase"
              />
              <input
                type="number"
                min={1}
                max={24}
                value={nuevoDuracionSemanas}
                onChange={(e) => setNuevoDuracionSemanas(Math.max(1, Number(e.target.value)))}
                className="bg-slate-800/90 border border-indigo-600/60 rounded-xl px-2.5 py-2 text-white font-bold text-xs text-center font-mono"
                title="Cantidad de Semanas"
              />
            </div>
            <span className="text-[10px] text-amber-300 font-mono block">
              = {nuevoHorasPorSemana} hrs/semana
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider block">
              Semana de Inicio
            </label>
            <select
              value={nuevoSemanaInicio}
              onChange={(e) => setNuevoSemanaInicio(Number(e.target.value))}
              className="w-full bg-slate-800/90 border border-indigo-600/60 rounded-xl px-3 py-2 text-white font-bold text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
            >
              <option value={34}>Semana 34 (18 Ago - 24 Ago)</option>
              <option value={35}>Semana 35 (25 Ago - 31 Ago)</option>
              <option value={36}>Semana 36 (01 Sep - 07 Sep)</option>
              <option value={37}>Semana 37 (08 Sep - 14 Sep)</option>
              <option value={38}>Semana 38 (15 Sep - 21 Sep)</option>
              <option value={39}>Semana 39 (22 Sep - 28 Sep)</option>
              <option value={40}>Semana 40 (29 Sep - 05 Oct)</option>
              <option value={41}>Semana 41 (06 Oct - 12 Oct)</option>
              <option value={42}>Semana 42 (13 Oct - 19 Oct)</option>
              <option value={43}>Semana 43 (20 Oct - 26 Oct)</option>
              <option value={44}>Semana 44 (27 Oct - 02 Nov)</option>
              <option value={45}>Semana 45 (03 Nov - 09 Nov)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider block">
              Docente Asignado
            </label>
            <select
              value={nuevoDocentePropuesto}
              onChange={(e) => setNuevoDocentePropuesto(e.target.value)}
              className="w-full bg-slate-800/90 border border-indigo-600/60 rounded-xl px-3 py-2 text-white font-bold text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
            >
              {listaDocentes.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider block">
              Modalidad de Impartición
            </label>
            <select
              value={nuevoModalidad}
              onChange={(e) => setNuevoModalidad(e.target.value)}
              className="w-full bg-slate-800/90 border border-indigo-600/60 rounded-xl px-3 py-2 text-white font-bold text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
            >
              <option value="Virtual Sincrónica">Virtual Sincrónica (Zoom Pro)</option>
              <option value="Presencial">Presencial (Campus Summit)</option>
              <option value="Híbrida Flex">Híbrida Flex (Aulas Duales)</option>
            </select>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider block">
              Franja Horaria y Días Propuestos
            </label>
            <input
              type="text"
              value={nuevoHorarioTexto}
              onChange={(e) => setNuevoHorarioTexto(e.target.value)}
              className="w-full bg-slate-800/90 border border-indigo-600/60 rounded-xl px-3 py-2 text-white font-medium text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
              placeholder="Ej. Lunes y Miércoles (18:00 - 20:00)"
            />
          </div>
        </div>

        {/* Resumen de Factibilidad del Simulador */}
        <div className="bg-white/10 p-3.5 rounded-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${statsGlobales.esSimulacionViable ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'}`}>
              {statsGlobales.esSimulacionViable ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </div>
            <div>
              <span className="font-bold text-white block">
                {statsGlobales.esSimulacionViable ? 'Dictamen Académico: Factibilidad Alta' : 'Dictamen Académico: Alerta de Saturación'}
              </span>
              <span className="text-[11px] text-indigo-200">
                {statsGlobales.esSimulacionViable
                  ? `La institución cuenta con suficiente margen horario (+${statsGlobales.totalHorasDisponiblesPromedio}h promedio) durante las ${nuevoDuracionSemanas} semanas.`
                  : `Se recomienda mover la fecha de inicio o balancear la carga de ${nuevoDocentePropuesto}.`
                }
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-indigo-200 font-mono text-[11px] shrink-0">
            <span>Carga Semanal: <strong>+{nuevoHorasPorSemana}h/sem</strong></span>
            <span>•</span>
            <span>Total: <strong>{nuevoHorasTotales} hrs</strong></span>
          </div>
        </div>
      </div>

    </div>
  );
};
