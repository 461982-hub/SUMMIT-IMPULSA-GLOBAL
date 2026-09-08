import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  UserCheck,
  Building2,
  BookOpen,
  Megaphone,
  Plus,
  Trash2,
  Edit3,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowRight,
  ExternalLink,
  Check,
  RefreshCw,
  Copy,
  Printer,
  CalendarDays,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import {
  ProyectoEducativo,
  Moneda,
  TareaAccionCorrectiva,
  GerenciaResponsable,
  PrioridadAccionCorrectiva,
  EstadoAccionCorrectiva
} from '../../types';
import { formatearMoneda, calcularMetricasProyecto } from '../../utils/calculations';

interface CorrectiveActionsCalendarProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onEditarProyecto?: (p: ProyectoEducativo) => void;
  onVerDetalle?: (p: ProyectoEducativo) => void;
  onNavegarGerencia?: (gerencia: 'gerencia-academica' | 'gerencia-comercializacion') => void;
  onIrAAlertas?: () => void;
}

const STORAGE_KEY = 'summit_calendario_acciones_v1';

// Responsables sugeridos por gerencia
const RESPONSABLES_SUGERIDOS: Record<GerenciaResponsable, Array<{ nombre: string; cargo: string }>> = {
  Académica: [
    { nombre: 'Msc. Roberto Flores', cargo: 'Director Académico & Currículo' },
    { nombre: 'Licda. Karen Medina', cargo: 'Coordinadora de Syllabus y Rúbricas' },
    { nombre: 'Ing. Carlos Mendoza', cargo: 'Comité de Evaluación Docente' }
  ],
  Comercial: [
    { nombre: 'Lic. Denis Alvarado', cargo: 'Gerente de Comercialización' },
    { nombre: 'Licda. Sofía Paz', cargo: 'Líder de Pauta Digital & CRM' },
    { nombre: 'Lic. Javier Orellana', cargo: 'Ejecutivo de Matrícula y Alianzas B2B' }
  ],
  General: [
    { nombre: 'Ing. Walter René Pedroza', cargo: 'Dirección General & Auditoría' },
    { nombre: 'Licda. Patricia Rivera', cargo: 'Auditora Interna / Control de Gestión' },
    { nombre: 'Lic. Marco Vinicio Cruz', cargo: 'Contador General & Gestión SAR' }
  ]
};

// Generador de tareas predeterminadas derivadas de las alertas críticas de los proyectos
function generarTareasDerivadasDeAlertas(proyectos: ProyectoEducativo[], moneda: Moneda): TareaAccionCorrectiva[] {
  const hoy = new Date();
  const formatFecha = (diasOffset: number) => {
    const d = new Date(hoy);
    d.setDate(d.getDate() + diasOffset);
    return d.toISOString().slice(0, 10);
  };
  const hoyStr = hoy.toISOString().slice(0, 10);

  const tareas: TareaAccionCorrectiva[] = [];

  const proyectosConMetricas = proyectos.map(p => ({
    proyecto: p,
    m: calcularMetricasProyecto(p),
    margen: p.ingresoRealTotal > 0 ? (p.totalGananciasFinales / p.ingresoRealTotal) * 100 : 0
  }));

  // 1. Alerta Crítica: Cursos bajo punto de equilibrio o con margen <10%
  const bajoPE = proyectosConMetricas.filter(item => item.proyecto.alumnosFinal < item.m.puntoEquilibrioAlumnos);
  if (bajoPE.length > 0) {
    tareas.push({
      id: 'tarea-pe-deficit',
      alertaOrigenId: 'alt-gen-pe-deficit',
      titulo: `Reestructuración de costos en ${bajoPE.length} cohorte(s) bajo el punto de equilibrio`,
      descripcion: `Renegociar horas/tarifas docentes y recortar gastos administrativos de Zoom/papelería para salvaguardar la viabilidad operativa sin incurrir en déficit neto.`,
      gerencia: 'General',
      gerenciaKey: 'GENERAL',
      responsableNombre: 'Ing. Walter René Pedroza',
      responsableCargo: 'Dirección General & Auditoría',
      fechaLimite: formatFecha(5), // En 5 días
      fechaCreacion: hoyStr,
      prioridad: 'CRITICA',
      estado: 'PENDIENTE',
      kpiVinculado: 'Margen de rentabilidad operativa',
      proyectosAfectados: bajoPE.map(item => ({
        id: item.proyecto.id,
        nombre: item.proyecto.nombreProyecto,
        detalle: `Alumnos: ${item.proyecto.alumnosFinal} (PE: ${item.m.puntoEquilibrioAlumnos}) | Margen: ${formatearMoneda(item.m.totalGananciasFinales, moneda)}`
      })),
      avancePorcentaje: 15,
      notasSeguimiento: 'Se convocó a reunión extraordinaria con el facilitador para acordar esquema variable.'
    });
  }

  // 2. Alerta Crítica: Programas con aforo mínimo de aula (≤ 4 alumnos)
  const aforoCritico = proyectosConMetricas.filter(item => Number(item.proyecto.alumnosFinal) <= 4);
  if (aforoCritico.length > 0) {
    tareas.push({
      id: 'tarea-aforo-critico',
      alertaOrigenId: 'alt-com-aforo-critico',
      titulo: `Campaña relámpago de captación para ${aforoCritico.length} programa(s) en límite de cupo (≤4 alumnos)`,
      descripcion: `Lanzar incentivos corporativos 2x1 y promociones con empresas aliadas para sumar al menos 2 estudiantes adicionales por curso y evitar cancelaciones.`,
      gerencia: 'Comercial',
      gerenciaKey: 'COMERCIAL',
      responsableNombre: 'Lic. Denis Alvarado',
      responsableCargo: 'Gerente de Comercialización',
      fechaLimite: formatFecha(3), // En 3 días (urgente)
      fechaCreacion: hoyStr,
      prioridad: 'CRITICA',
      estado: 'EN_PROCESO',
      kpiVinculado: 'Aforo mínimo de aula y ventas efectivas',
      proyectosAfectados: aforoCritico.map(item => ({
        id: item.proyecto.id,
        nombre: item.proyecto.nombreProyecto,
        detalle: `Matrícula: ${item.proyecto.alumnosFinal} alumnos inscritos`
      })),
      avancePorcentaje: 40,
      notasSeguimiento: 'Enviados 25 correos y mensajes a base de datos de exalumnos con tarifa preferencial.'
    });
  }

  // 3. Alerta Crítica: Cumplimiento y Gobernanza fiscal SAR
  const sinFiscal = proyectos.filter(p => !p.codigoFiscalSAR && !p.servicioFiscal);
  if (sinFiscal.length > 0) {
    tareas.push({
      id: 'tarea-sar-fiscal',
      alertaOrigenId: 'alt-gen-sar-control',
      titulo: `Determinación tributaria SAR y correlativo en ${sinFiscal.length} proyecto(s)`,
      descripcion: `Asignar número correlativo SAR, clasificar legalmente la exención o gravar con 15% ISV según el Servicio de Administración de Rentas.`,
      gerencia: 'General',
      gerenciaKey: 'GENERAL',
      responsableNombre: 'Lic. Marco Vinicio Cruz',
      responsableCargo: 'Contador General & Gestión SAR',
      fechaLimite: formatFecha(4),
      fechaCreacion: hoyStr,
      prioridad: 'CRITICA',
      estado: 'PENDIENTE',
      kpiVinculado: 'Cumplimiento de controles internos y fiscalidad SAR',
      proyectosAfectados: sinFiscal.map(p => ({
        id: p.id,
        nombre: p.nombreProyecto,
        detalle: 'Pendiente de correlativo y clasificación de ISV'
      })),
      avancePorcentaje: 0,
      notasSeguimiento: 'Formularios descargados; pendiente de firma del contador para timbrado.'
    });
  }

  // 4. Alerta Académica: Formalización de syllabus y temarios pendientes
  const sinSyllabus = proyectos.filter(p => !p.estadoSyllabus || p.estadoSyllabus !== 'Aprobado por Dirección');
  if (sinSyllabus.length > 0) {
    tareas.push({
      id: 'tarea-acad-syllabus',
      alertaOrigenId: 'alt-acad-syllabus',
      titulo: `Aprobación y firma curricular de syllabus en ${sinSyllabus.length} programa(s)`,
      descripcion: `Revisar objetivos pedagógicos, competencias de egreso y desglose temático con el docente para emitir la aprobación oficial de Dirección.`,
      gerencia: 'Académica',
      gerenciaKey: 'ACADEMICA',
      responsableNombre: 'Msc. Roberto Flores',
      responsableCargo: 'Director Académico & Currículo',
      fechaLimite: formatFecha(6),
      fechaCreacion: hoyStr,
      prioridad: 'ALTA',
      estado: 'PENDIENTE',
      kpiVinculado: 'Proyectos diseñados y validados',
      proyectosAfectados: sinSyllabus.map(p => ({
        id: p.id,
        nombre: p.nombreProyecto,
        detalle: `Estado actual: ${p.estadoSyllabus || 'Pendiente'}`
      })),
      avancePorcentaje: 25,
      notasSeguimiento: 'Reunión con docentes agendada para homologar los 4 módulos faltantes.'
    });
  }

  // 5. Alerta Comercial: Optimización de tiempos de respuesta en WhatsApp CRM
  tareas.push({
    id: 'tarea-com-crm-leads',
    alertaOrigenId: 'alt-com-conversion',
    titulo: 'Protocolo de contacto en < 15 min en WhatsApp y seguimiento a leads tibios',
    descripcion: 'Configurar respuestas automáticas, guiones estandarizados y turnos de guardia comercial para evitar enfriamiento de prospectos calificados.',
    gerencia: 'Comercial',
    gerenciaKey: 'COMERCIAL',
    responsableNombre: 'Licda. Sofía Paz',
    responsableCargo: 'Líder de Pauta Digital & CRM',
    fechaLimite: formatFecha(8),
    fechaCreacion: hoyStr,
    prioridad: 'MEDIA',
    estado: 'EN_PROCESO',
    kpiVinculado: 'Tasa de conversión de prospectos',
    avancePorcentaje: 60,
    notasSeguimiento: 'Plantillas redactadas y cargadas en la plataforma de mensajería comercial.'
  });

  // 6. Alerta General: Control y liquidación de cobranza bancaria
  tareas.push({
    id: 'tarea-gen-cobranza',
    alertaOrigenId: 'alt-gen-cobranza',
    titulo: 'Conciliación bancaria estricta y bloqueo de accesos por mora previa a Módulo 1',
    descripcion: 'Validar comprobantes de depósito bancario de todos los matriculados antes de entregar credenciales de acceso al aula virtual Zoom.',
    gerencia: 'General',
    gerenciaKey: 'GENERAL',
    responsableNombre: 'Licda. Patricia Rivera',
    responsableCargo: 'Auditora Interna / Control de Gestión',
    fechaLimite: formatFecha(10),
    fechaCreacion: hoyStr,
    prioridad: 'MEDIA',
    estado: 'PENDIENTE',
    kpiVinculado: 'Efectividad de cobranza bancaria',
    avancePorcentaje: 30,
    notasSeguimiento: 'Coordinado con contabilidad para emitir recibos oficiales dentro de 24 horas.'
  });

  return tareas;
}

export const CorrectiveActionsCalendar: React.FC<CorrectiveActionsCalendarProps> = ({
  proyectos,
  moneda,
  onEditarProyecto,
  onVerDetalle,
  onNavegarGerencia,
  onIrAAlertas
}) => {
  // Lista de tareas persistente en localStorage
  const [tareas, setTareas] = useState<TareaAccionCorrectiva[]>(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY);
      if (guardado) {
        const parsed = JSON.parse(guardado);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error al cargar tareas de acciones correctivas:', e);
    }
    return generarTareasDerivadasDeAlertas(proyectos, moneda);
  });

  // Guardar en localStorage cada vez que cambian las tareas
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tareas));
    } catch (e) {
      console.error('Error al guardar tareas en localStorage:', e);
    }
  }, [tareas]);

  // Vistas disponibles
  const [modoVista, setModoVista] = useState<'calendario' | 'cronograma'>('calendario');

  // Filtros interactivos
  const [filtroGerencia, setFiltroGerencia] = useState<'TODAS' | GerenciaResponsable>('TODAS');
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | EstadoAccionCorrectiva>('TODOS');
  const [filtroPrioridad, setFiltroPrioridad] = useState<'TODAS' | PrioridadAccionCorrectiva>('TODAS');
  const [busqueda, setBusqueda] = useState<string>('');

  // Navegación del Calendario mensual
  const [fechaCalendario, setFechaCalendario] = useState<Date>(() => new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

  // Modal para Crear / Editar Tarea
  const [tareaEnEdicion, setTareaEnEdicion] = useState<TareaAccionCorrectiva | null>(null);
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [modoModal, setModoModal] = useState<'crear' | 'editar'>('crear');

  // Feedback de acción
  const [mensajeNotificacion, setMensajeNotificacion] = useState<string | null>(null);

  const mostrarNotificacion = (msg: string) => {
    setMensajeNotificacion(msg);
    setTimeout(() => setMensajeNotificacion(null), 3500);
  };

  // Sincronizar con alertas críticas detectadas actualmente
  const handleSincronizarAlertas = () => {
    const tareasNuevasDerivadas = generarTareasDerivadasDeAlertas(proyectos, moneda);
    setTareas(prev => {
      // Conservar las que ya existen con sus modificaciones
      const existentesIds = new Set(prev.map(t => t.id));
      const aAgregar = tareasNuevasDerivadas.filter(t => !existentesIds.has(t.id));
      return [...prev, ...aAgregar];
    });
    mostrarNotificacion('¡Tareas de acciones correctivas sincronizadas con las alertas actuales!');
  };

  // Restablecer todas a las sugeridas por el motor de auditoría
  const handleRestablecerSugeridas = () => {
    if (window.confirm('¿Deseas restablecer el plan de acciones correctivas con las alertas críticas detectadas hoy?')) {
      const sugeridas = generarTareasDerivadasDeAlertas(proyectos, moneda);
      setTareas(sugeridas);
      mostrarNotificacion('Plan de acciones correctivas restablecido con éxito.');
    }
  };

  // Cambiar estado de una tarea
  const handleCambiarEstado = (id: string, nuevoEstado: EstadoAccionCorrectiva) => {
    setTareas(prev =>
      prev.map(t => {
        if (t.id === id) {
          const completada = nuevoEstado === 'COMPLETADA';
          return {
            ...t,
            estado: nuevoEstado,
            avancePorcentaje: completada ? 100 : t.avancePorcentaje,
            fechaCompletada: completada ? new Date().toISOString().slice(0, 10) : undefined
          };
        }
        return t;
      })
    );
  };

  // Eliminar tarea
  const handleEliminarTarea = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta acción correctiva del calendario?')) {
      setTareas(prev => prev.filter(t => t.id !== id));
      mostrarNotificacion('Acción correctiva eliminada.');
    }
  };

  // Abrir modal para crear tarea nueva
  const handleAbrirCrear = (fechaSugerida?: string) => {
    const hoyStr = new Date().toISOString().slice(0, 10);
    const nueva: TareaAccionCorrectiva = {
      id: 'tarea-' + Date.now(),
      titulo: '',
      descripcion: '',
      gerencia: 'General',
      gerenciaKey: 'GENERAL',
      responsableNombre: RESPONSABLES_SUGERIDOS['General'][0].nombre,
      responsableCargo: RESPONSABLES_SUGERIDOS['General'][0].cargo,
      fechaLimite: fechaSugerida || hoyStr,
      fechaCreacion: hoyStr,
      prioridad: 'CRITICA',
      estado: 'PENDIENTE',
      avancePorcentaje: 0,
      notasSeguimiento: ''
    };
    setTareaEnEdicion(nueva);
    setModoModal('crear');
    setModalAbierto(true);
  };

  // Abrir modal para editar tarea
  const handleAbrirEditar = (t: TareaAccionCorrectiva) => {
    setTareaEnEdicion({ ...t });
    setModoModal('editar');
    setModalAbierto(true);
  };

  // Guardar tarea desde el modal
  const handleGuardarModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tareaEnEdicion || !tareaEnEdicion.titulo.trim()) {
      alert('El título de la acción correctiva es obligatorio.');
      return;
    }

    // Mapear gerenciaKey
    let key: 'ACADEMICA' | 'COMERCIAL' | 'GENERAL' = 'GENERAL';
    if (tareaEnEdicion.gerencia === 'Académica') key = 'ACADEMICA';
    else if (tareaEnEdicion.gerencia === 'Comercial') key = 'COMERCIAL';

    const tareaFinal: TareaAccionCorrectiva = {
      ...tareaEnEdicion,
      gerenciaKey: key,
      avancePorcentaje: Number(tareaEnEdicion.avancePorcentaje) || 0
    };

    setTareas(prev => {
      const idx = prev.findIndex(t => t.id === tareaFinal.id);
      if (idx >= 0) {
        const clon = [...prev];
        clon[idx] = tareaFinal;
        return clon;
      }
      return [tareaFinal, ...prev];
    });

    setModalAbierto(false);
    setTareaEnEdicion(null);
    mostrarNotificacion(modoModal === 'crear' ? 'Nueva acción correctiva programada con éxito.' : 'Acción correctiva actualizada.');
  };

  // Cómputo de estadísticas para el Barómetro
  const stats = useMemo(() => {
    const hoyStr = new Date().toISOString().slice(0, 10);
    const total = tareas.length;
    const completadas = tareas.filter(t => t.estado === 'COMPLETADA').length;
    const enProceso = tareas.filter(t => t.estado === 'EN_PROCESO').length;
    const pendientes = tareas.filter(t => t.estado === 'PENDIENTE').length;
    const criticas = tareas.filter(t => t.prioridad === 'CRITICA' && t.estado !== 'COMPLETADA').length;
    const vencidas = tareas.filter(t => t.estado !== 'COMPLETADA' && t.fechaLimite < hoyStr).length;
    const pctAvanceGeneral = total > 0 ? Math.round((completadas / total) * 100) : 0;

    return {
      total,
      completadas,
      enProceso,
      pendientes,
      criticas,
      vencidas,
      pctAvanceGeneral
    };
  }, [tareas]);

  // Tareas filtradas para la lista y el calendario
  const tareasFiltradas = useMemo(() => {
    const hoyStr = new Date().toISOString().slice(0, 10);

    return tareas.filter(t => {
      if (filtroGerencia !== 'TODAS' && t.gerencia !== filtroGerencia) return false;
      if (filtroPrioridad !== 'TODAS' && t.prioridad !== filtroPrioridad) return false;

      if (filtroEstado !== 'TODOS') {
        if (filtroEstado === 'VENCIDA') {
          if (t.estado === 'COMPLETADA' || t.fechaLimite >= hoyStr) return false;
        } else if (t.estado !== filtroEstado) {
          return false;
        }
      }

      if (busqueda.trim()) {
        const b = busqueda.toLowerCase();
        const coincideTitulo = t.titulo.toLowerCase().includes(b);
        const coincideResp = t.responsableNombre.toLowerCase().includes(b);
        const coincideCargo = t.responsableCargo.toLowerCase().includes(b);
        const coincideDesc = t.descripcion.toLowerCase().includes(b);
        const coincideKpi = t.kpiVinculado?.toLowerCase().includes(b);
        if (!coincideTitulo && !coincideResp && !coincideCargo && !coincideDesc && !coincideKpi) {
          return false;
        }
      }

      return true;
    });
  }, [tareas, filtroGerencia, filtroEstado, filtroPrioridad, busqueda]);

  // -------------------------------------------------------------------------
  // LÓGICA DEL CALENDARIO MENSUAL
  // -------------------------------------------------------------------------
  const anioCalendario = fechaCalendario.getFullYear();
  const mesCalendario = fechaCalendario.getMonth();

  const nombreMes = fechaCalendario.toLocaleDateString('es-HN', { month: 'long', year: 'numeric' });

  // Días del mes actual
  const diasEnMes = useMemo(() => {
    const primerDia = new Date(anioCalendario, mesCalendario, 1);
    const ultimoDia = new Date(anioCalendario, mesCalendario + 1, 0);

    // Ajuste para que lunes sea día 0 (0: Lunes, 6: Domingo)
    let diaSemanaInicio = primerDia.getDay() - 1;
    if (diaSemanaInicio === -1) diaSemanaInicio = 6;

    const totalDias = ultimoDia.getDate();
    const diasArray: Array<{
      fechaStr: string;
      numeroDia: number;
      esMesActual: boolean;
      esHoy: boolean;
    }> = [];

    const hoyStr = new Date().toISOString().slice(0, 10);

    // Días de relleno del mes anterior
    const ultimoDiaMesAnterior = new Date(anioCalendario, mesCalendario, 0).getDate();
    for (let i = diaSemanaInicio - 1; i >= 0; i--) {
      const num = ultimoDiaMesAnterior - i;
      const f = new Date(anioCalendario, mesCalendario - 1, num);
      const str = f.toISOString().slice(0, 10);
      diasArray.push({
        fechaStr: str,
        numeroDia: num,
        esMesActual: false,
        esHoy: str === hoyStr
      });
    }

    // Días del mes actual
    for (let d = 1; d <= totalDias; d++) {
      const f = new Date(anioCalendario, mesCalendario, d);
      // Evitar desfase de zona horaria usando componentes locales
      const yStr = f.getFullYear();
      const mStr = String(f.getMonth() + 1).padStart(2, '0');
      const dStr = String(f.getDate()).padStart(2, '0');
      const str = `${yStr}-${mStr}-${dStr}`;
      diasArray.push({
        fechaStr: str,
        numeroDia: d,
        esMesActual: true,
        esHoy: str === hoyStr
      });
    }

    // Rellenar hasta completar semanas (múltiplo de 7)
    const restante = 7 - (diasArray.length % 7);
    if (restante < 7) {
      for (let r = 1; r <= restante; r++) {
        const f = new Date(anioCalendario, mesCalendario + 1, r);
        const yStr = f.getFullYear();
        const mStr = String(f.getMonth() + 1).padStart(2, '0');
        const dStr = String(f.getDate()).padStart(2, '0');
        const str = `${yStr}-${mStr}-${dStr}`;
        diasArray.push({
          fechaStr: str,
          numeroDia: r,
          esMesActual: false,
          esHoy: str === hoyStr
        });
      }
    }

    return diasArray;
  }, [anioCalendario, mesCalendario]);

  // Tareas mapeadas por fecha para el calendario
  const tareasPorFecha = useMemo(() => {
    const mapa: Record<string, TareaAccionCorrectiva[]> = {};
    tareasFiltradas.forEach(t => {
      if (!mapa[t.fechaLimite]) {
        mapa[t.fechaLimite] = [];
      }
      mapa[t.fechaLimite].push(t);
    });
    return mapa;
  }, [tareasFiltradas]);

  const navegarMes = (delta: number) => {
    setFechaCalendario(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const irAHoy = () => {
    setFechaCalendario(new Date());
    setDiaSeleccionado(new Date().toISOString().slice(0, 10));
  };

  // Helper para formato de vencimiento
  const calcularTextoVencimiento = (fechaLimite: string, estado: EstadoAccionCorrectiva) => {
    if (estado === 'COMPLETADA') {
      return { texto: 'Completada', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    }
    const hoyStr = new Date().toISOString().slice(0, 10);
    if (fechaLimite < hoyStr) {
      const diffMs = new Date(hoyStr).getTime() - new Date(fechaLimite).getTime();
      const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return {
        texto: `Vencida hace ${dias} día(s)`,
        color: 'text-rose-700 bg-rose-50 border-rose-200 font-bold animate-pulse'
      };
    }
    if (fechaLimite === hoyStr) {
      return {
        texto: 'Vence HOY',
        color: 'text-amber-700 bg-amber-50 border-amber-300 font-bold'
      };
    }
    const diffMs = new Date(fechaLimite).getTime() - new Date(hoyStr).getTime();
    const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return {
      texto: `Vence en ${dias} día(s)`,
      color: 'text-blue-700 bg-blue-50 border-blue-200'
    };
  };

  // Helper para color por gerencia
  const getBadgeGerencia = (gerencia: GerenciaResponsable) => {
    switch (gerencia) {
      case 'Académica':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          icon: BookOpen,
          text: 'Gerencia Académica'
        };
      case 'Comercial':
        return {
          bg: 'bg-purple-50 text-purple-800 border-purple-200',
          icon: Megaphone,
          text: 'Gerencia Comercial'
        };
      case 'General':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: Building2,
          text: 'Gerencia General'
        };
    }
  };

  // Helper para color por prioridad
  const getBadgePrioridad = (prio: PrioridadAccionCorrectiva) => {
    switch (prio) {
      case 'CRITICA':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-black';
      case 'ALTA':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
      case 'MEDIA':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'BAJA':
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ===================================================================== */}
      {/* BANNER PRINCIPAL DEL CALENDARIO DE ACCIONES CORRECTIVAS */}
      {/* ===================================================================== */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-emerald-950 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-emerald-900/40 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-emerald-400" />
                Gobernanza & Mitigación de Desviaciones
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-200">
                Plan de Trabajo Inter-Gerencial
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <CalendarDays className="w-6 h-6 text-emerald-400 shrink-0" />
              Calendario de Acciones Correctivas de Auditoría Interna
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
              Asignación de fechas límite, compromisos y responsables por gerencia (Académica, Comercial y General) para subsanar desviaciones críticas y garantizar la rentabilidad de las cohortes.
            </p>
          </div>

          {/* Acciones principales */}
          <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
            <button
              type="button"
              onClick={() => handleAbrirCrear()}
              className="px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 border border-emerald-300 transition-all shadow-sm"
              title="Programar una nueva tarea correctiva con fecha límite y responsable"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>+ Nueva Acción</span>
            </button>

            <button
              type="button"
              onClick={handleSincronizarAlertas}
              className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
              title="Detectar alertas críticas en los proyectos y agregarlas como acciones al calendario"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-300" />
              <span>Sincronizar Alertas</span>
            </button>

            {onIrAAlertas && (
              <button
                type="button"
                onClick={onIrAAlertas}
                className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 transition-all"
                title="Ver las alertas originales en el panel de riesgos"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-300" />
                <span>Ver Alertas</span>
              </button>
            )}
          </div>
        </div>

        {/* ===================================================================== */}
        {/* BARÓMETRO DE ESTADÍSTICAS DEL PLAN CORRECTIVO */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 pt-4 border-t border-slate-800">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[11px] font-semibold text-slate-300 block">Total Acciones</span>
            <div className="text-xl font-black text-white mt-1 font-mono">{stats.total}</div>
            <span className="text-[10px] text-slate-400 block mt-0.5">En seguimiento</span>
          </div>

          <div className="bg-rose-500/10 rounded-xl p-3 border border-rose-500/30">
            <span className="text-[11px] font-semibold text-rose-200 block flex items-center justify-between">
              <span>Críticas Abiertas</span>
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            </span>
            <div className="text-xl font-black text-rose-300 mt-1 font-mono">{stats.criticas}</div>
            <span className="text-[10px] text-rose-300/80 block mt-0.5">Alta prioridad</span>
          </div>

          <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/30">
            <span className="text-[11px] font-semibold text-amber-200 block flex items-center justify-between">
              <span>Vencidas / En Riesgo</span>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </span>
            <div className="text-xl font-black text-amber-300 mt-1 font-mono">{stats.vencidas}</div>
            <span className="text-[10px] text-amber-300/80 block mt-0.5">Plazo excedido</span>
          </div>

          <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/30">
            <span className="text-[11px] font-semibold text-blue-200 block flex items-center justify-between">
              <span>En Proceso</span>
              <Layers className="w-3.5 h-3.5 text-blue-400" />
            </span>
            <div className="text-xl font-black text-blue-300 mt-1 font-mono">{stats.enProceso}</div>
            <span className="text-[10px] text-blue-300/80 block mt-0.5">Ejecutándose</span>
          </div>

          <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/30">
            <span className="text-[11px] font-semibold text-emerald-200 block flex items-center justify-between">
              <span>Cumplidas ({stats.pctAvanceGeneral}%)</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </span>
            <div className="text-xl font-black text-emerald-300 mt-1 font-mono">{stats.completadas}</div>
            <span className="text-[10px] text-emerald-300/80 block mt-0.5">Subsanadas</span>
          </div>
        </div>
      </div>

      {/* NOTIFICACIÓN FLOTANTE */}
      {mensajeNotificacion && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{mensajeNotificacion}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* BARRA DE HERRAMIENTAS: SELECTOR DE VISTAS Y FILTROS */}
      {/* ===================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        {/* Selector de modo de vista */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start">
          <button
            type="button"
            onClick={() => setModoVista('calendario')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              modoVista === 'calendario'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>Vista Calendario Mensual</span>
          </button>
          <button
            type="button"
            onClick={() => setModoVista('cronograma')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              modoVista === 'cronograma'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Vista Cronograma / Lista ({tareasFiltradas.length})</span>
          </button>
        </div>

        {/* Filtros rápidos por gerencia y estado */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Gerencia */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setFiltroGerencia('TODAS')}
              className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all ${
                filtroGerencia === 'TODAS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setFiltroGerencia('Académica')}
              className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all ${
                filtroGerencia === 'Académica' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Académica
            </button>
            <button
              type="button"
              onClick={() => setFiltroGerencia('Comercial')}
              className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all ${
                filtroGerencia === 'Comercial' ? 'bg-white text-purple-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Comercial
            </button>
            <button
              type="button"
              onClick={() => setFiltroGerencia('General')}
              className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all ${
                filtroGerencia === 'General' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              General
            </button>
          </div>

          {/* Estado */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="PENDIENTE">Pendientes</option>
            <option value="EN_PROCESO">En Proceso</option>
            <option value="COMPLETADA">Completadas</option>
            <option value="VENCIDA">⚠️ Vencidas</option>
          </select>

          {/* Búsqueda */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar responsable o tarea..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs w-48 focus:bg-white transition-all"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* VISTA 1: CALENDARIO MENSUAL INTERACTIVO */}
      {/* ===================================================================== */}
      {modoVista === 'calendario' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
          {/* Header del Calendario mensual */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 capitalize flex items-center gap-2">
                  <span>{nombreMes}</span>
                  <span className="text-xs font-normal text-slate-500">({diasEnMes.filter(d => d.esMesActual).length} días)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Haz clic en cualquier día para ver sus tareas programadas o programar una nueva acción.
                </p>
              </div>
            </div>

            {/* Controles de mes */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => navegarMes(-1)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                title="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={irAHoy}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => navegarMes(1)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                title="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-black text-slate-500 uppercase tracking-wider py-1">
            <span>Lun</span>
            <span>Mar</span>
            <span>Mié</span>
            <span>Jue</span>
            <span>Vie</span>
            <span className="text-slate-400">Sáb</span>
            <span className="text-slate-400">Dom</span>
          </div>

          {/* Cuadrícula de días del mes */}
          <div className="grid grid-cols-7 gap-1.5">
            {diasEnMes.map((dia, idx) => {
              const tareasDelDia = tareasPorFecha[dia.fechaStr] || [];
              const tieneCritica = tareasDelDia.some(t => t.prioridad === 'CRITICA' && t.estado !== 'COMPLETADA');
              const tieneVencida = tareasDelDia.some(t => t.estado !== 'COMPLETADA' && dia.fechaStr < new Date().toISOString().slice(0, 10));
              const esSeleccionado = diaSeleccionado === dia.fechaStr;

              return (
                <div
                  key={idx}
                  onClick={() => setDiaSeleccionado(dia.fechaStr)}
                  className={`min-h-[88px] sm:min-h-[105px] p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer relative group ${
                    dia.esHoy
                      ? 'bg-emerald-50/50 border-emerald-400 ring-2 ring-emerald-400/30'
                      : esSeleccionado
                      ? 'bg-slate-50 border-slate-400 ring-2 ring-slate-400/20'
                      : dia.esMesActual
                      ? 'bg-white hover:bg-slate-50 border-slate-200'
                      : 'bg-slate-50/50 border-slate-100 text-slate-400 opacity-60'
                  }`}
                >
                  {/* Cabecera del día */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-black rounded-md w-6 h-6 flex items-center justify-center ${
                        dia.esHoy
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : dia.esMesActual
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {dia.numeroDia}
                    </span>

                    {/* Botón rápido para agregar tarea a este día */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAbrirCrear(dia.fechaStr);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 text-slate-600 rounded transition-opacity"
                      title={`Programar tarea para el ${dia.fechaStr}`}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Indicadores / Chips de tareas de este día */}
                  <div className="space-y-1 my-1 overflow-hidden">
                    {tareasDelDia.slice(0, 2).map((t) => {
                      const badgeG = getBadgeGerencia(t.gerencia);
                      const completada = t.estado === 'COMPLETADA';

                      return (
                        <div
                          key={t.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAbrirEditar(t);
                          }}
                          className={`text-[10px] leading-tight px-1.5 py-0.5 rounded border truncate flex items-center gap-1 font-medium transition-transform hover:scale-[1.02] ${
                            completada
                              ? 'bg-slate-100 text-slate-500 border-slate-200 line-through'
                              : t.prioridad === 'CRITICA'
                              ? 'bg-rose-100 text-rose-900 border-rose-300 font-bold'
                              : badgeG.bg
                          }`}
                          title={`${t.titulo} | Responsable: ${t.responsableNombre} (${t.gerencia})`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              completada ? 'bg-emerald-500' : t.prioridad === 'CRITICA' ? 'bg-rose-600' : 'bg-blue-600'
                            }`}
                          />
                          <span className="truncate">{t.titulo}</span>
                        </div>
                      );
                    })}

                    {tareasDelDia.length > 2 && (
                      <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-1 py-0.5 rounded block text-center">
                        +{tareasDelDia.length - 2} más
                      </span>
                    )}
                  </div>

                  {/* Pie de día: alerta visual si hay críticas */}
                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                    {tieneVencida ? (
                      <span className="text-rose-600 font-bold flex items-center gap-0.5">
                        <AlertTriangle className="w-2.5 h-2.5" /> Vencida
                      </span>
                    ) : tieneCritica ? (
                      <span className="text-rose-600 font-bold">● Crítica</span>
                    ) : (
                      <span />
                    )}
                    {tareasDelDia.length > 0 && (
                      <span className="font-bold text-slate-600">{tareasDelDia.length}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ================================================================= */}
          {/* DETALLE DEL DÍA SELECCIONADO */}
          {/* ================================================================= */}
          {diaSeleccionado && (
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-black text-slate-800">
                    Acciones programadas para la fecha: <span className="font-mono text-emerald-700">{diaSeleccionado}</span>
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
                    {(tareasPorFecha[diaSeleccionado] || []).length} tarea(s)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAbrirCrear(diaSeleccionado)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Agregar para este día</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiaSeleccionado(null)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Cerrar
                  </button>
                </div>
              </div>

              {/* Lista de tareas de ese día */}
              <div className="mt-3 space-y-2">
                {(tareasPorFecha[diaSeleccionado] || []).length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2 text-center">
                    No hay acciones correctivas con fecha límite para este día. Puedes presionar "+ Agregar para este día" para calendarizar una.
                  </p>
                ) : (
                  tareasPorFecha[diaSeleccionado].map(t => (
                    <TarjetaTarea
                      key={t.id}
                      tarea={t}
                      onEditar={() => handleAbrirEditar(t)}
                      onEliminar={() => handleEliminarTarea(t.id)}
                      onCambiarEstado={(st) => handleCambiarEstado(t.id, st)}
                      onVerDetalle={onVerDetalle}
                      onEditarProyecto={onEditarProyecto}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* VISTA 2: VISTA CRONOGRAMA / LISTA COMPLETA DE TAREAS */}
      {/* ===================================================================== */}
      {modoVista === 'cronograma' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200">
            <span className="text-xs font-black text-slate-800 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              Cronograma de Acciones Correctivas ({tareasFiltradas.length} registradas)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRestablecerSugeridas}
                className="text-[11px] text-slate-500 hover:text-slate-800 underline transition-colors"
              >
                Restablecer a sugeridas por auditoría
              </button>
            </div>
          </div>

          {tareasFiltradas.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No se encontraron tareas con los filtros seleccionados</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Prueba cambiando los filtros de gerencia o estado, o haz clic en "Sincronizar Alertas" para cargar las tareas automáticas del motor de auditoría.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFiltroGerencia('TODAS');
                  setFiltroEstado('TODOS');
                  setBusqueda('');
                }}
                className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                Limpiar Filtros
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tareasFiltradas.map(t => (
                <TarjetaTarea
                  key={t.id}
                  tarea={t}
                  onEditar={() => handleAbrirEditar(t)}
                  onEliminar={() => handleEliminarTarea(t.id)}
                  onCambiarEstado={(st) => handleCambiarEstado(t.id, st)}
                  onVerDetalle={onVerDetalle}
                  onEditarProyecto={onEditarProyecto}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL PARA CREAR / EDITAR ACCIÓN CORRECTIVA */}
      {/* ===================================================================== */}
      {modalAbierto && tareaEnEdicion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in zoom-in-95">
            {/* Header del Modal */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-emerald-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-400/30">
                  <CalendarDays className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {modoModal === 'crear' ? 'Programar Nueva Acción Correctiva' : 'Editar Acción Correctiva y Responsable'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Asigna fecha límite, responsable por gerencia y notas de seguimiento operativo.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleGuardarModal} className="p-5 sm:p-6 space-y-4 text-xs">
              {/* Título de la acción */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título de la Acción Correctiva <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={tareaEnEdicion.titulo}
                  onChange={(e) => setTareaEnEdicion({ ...tareaEnEdicion, titulo: e.target.value })}
                  placeholder="Ej: Renegociación de tarifa docente y punto de equilibrio en cohorte X"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Descripción detallada */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descripción y Procedimiento de Subsanación
                </label>
                <textarea
                  rows={2}
                  value={tareaEnEdicion.descripcion}
                  onChange={(e) => setTareaEnEdicion({ ...tareaEnEdicion, descripcion: e.target.value })}
                  placeholder="Explica detalladamente la causa raíz detectada y la acción concreta para resolverla..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-normal focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Gerencia Responsable y Sugerencia de Responsable */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Gerencia Responsable <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={tareaEnEdicion.gerencia}
                    onChange={(e) => {
                      const nuevaG = e.target.value as GerenciaResponsable;
                      const primerSugerido = RESPONSABLES_SUGERIDOS[nuevaG][0];
                      setTareaEnEdicion({
                        ...tareaEnEdicion,
                        gerencia: nuevaG,
                        responsableNombre: primerSugerido.nombre,
                        responsableCargo: primerSugerido.cargo
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="Académica">Gerencia Académica</option>
                    <option value="Comercial">Gerencia Comercial</option>
                    <option value="General">Gerencia General / Auditoría</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Plantilla Rápida de Responsable
                  </label>
                  <select
                    onChange={(e) => {
                      const idx = Number(e.target.value);
                      if (idx >= 0) {
                        const r = RESPONSABLES_SUGERIDOS[tareaEnEdicion.gerencia][idx];
                        if (r) {
                          setTareaEnEdicion({
                            ...tareaEnEdicion,
                            responsableNombre: r.nombre,
                            responsableCargo: r.cargo
                          });
                        }
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-700 font-medium"
                  >
                    <option value="-1">-- Seleccionar titular sugerido --</option>
                    {RESPONSABLES_SUGERIDOS[tareaEnEdicion.gerencia].map((r, i) => (
                      <option key={i} value={i}>
                        {r.nombre} ({r.cargo})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nombre y Cargo Personalizado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre del Responsable <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={tareaEnEdicion.responsableNombre}
                    onChange={(e) => setTareaEnEdicion({ ...tareaEnEdicion, responsableNombre: e.target.value })}
                    placeholder="Ej: Msc. Roberto Flores"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cargo / Rol Oficial
                  </label>
                  <input
                    type="text"
                    value={tareaEnEdicion.responsableCargo}
                    onChange={(e) => setTareaEnEdicion({ ...tareaEnEdicion, responsableCargo: e.target.value })}
                    placeholder="Ej: Director Académico"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-700"
                  />
                </div>
              </div>

              {/* Fecha Límite y Botones rápidos */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Fecha Límite de Ejecución <span className="text-rose-600">*</span>
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-500 font-semibold">Plazos rápidos:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 2);
                        setTareaEnEdicion({ ...tareaEnEdicion, fechaLimite: d.toISOString().slice(0, 10) });
                      }}
                      className="px-2 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                    >
                      +2 días
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 7);
                        setTareaEnEdicion({ ...tareaEnEdicion, fechaLimite: d.toISOString().slice(0, 10) });
                      }}
                      className="px-2 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                    >
                      +1 semana
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 15);
                        setTareaEnEdicion({ ...tareaEnEdicion, fechaLimite: d.toISOString().slice(0, 10) });
                      }}
                      className="px-2 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                    >
                      +15 días
                    </button>
                  </div>
                </div>

                <input
                  type="date"
                  required
                  value={tareaEnEdicion.fechaLimite}
                  onChange={(e) => setTareaEnEdicion({ ...tareaEnEdicion, fechaLimite: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                />
              </div>

              {/* Prioridad y Estado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nivel de Prioridad / Riesgo
                  </label>
                  <select
                    value={tareaEnEdicion.prioridad}
                    onChange={(e) => setTareaEnEdicion({ ...tareaEnEdicion, prioridad: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="CRITICA">🔴 CRÍTICA (Acción Inmediata)</option>
                    <option value="ALTA">🟠 ALTA (Plazo de 48-72h)</option>
                    <option value="MEDIA">🟡 MEDIA (Plazo semanal)</option>
                    <option value="BAJA">🔵 BAJA (Monitoreo regular)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estado Actual
                  </label>
                  <select
                    value={tareaEnEdicion.estado}
                    onChange={(e) => setTareaEnEdicion({ ...tareaEnEdicion, estado: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="PENDIENTE">⏳ PENDIENTE</option>
                    <option value="EN_PROCESO">🔄 EN PROCESO</option>
                    <option value="COMPLETADA">✅ COMPLETADA / SUBSANADA</option>
                  </select>
                </div>
              </div>

              {/* Porcentaje de Avance */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Porcentaje de Avance: <span className="font-mono text-emerald-700">{tareaEnEdicion.avancePorcentaje}%</span>
                  </label>
                  <span className="text-[10px] text-slate-500">
                    {tareaEnEdicion.avancePorcentaje === 100 ? 'Completamente resuelto' : 'En seguimiento'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={tareaEnEdicion.avancePorcentaje}
                  onChange={(e) => setTareaEnEdicion({ ...tareaEnEdicion, avancePorcentaje: Number(e.target.value) })}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Notas de Seguimiento */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bitácora de Acuerdos y Seguimiento
                </label>
                <textarea
                  rows={2}
                  value={tareaEnEdicion.notasSeguimiento || ''}
                  onChange={(e) => setTareaEnEdicion({ ...tareaEnEdicion, notasSeguimiento: e.target.value })}
                  placeholder="Registra minutas de reunión, memorándums, acuerdos con el facilitador o comprobantes fiscales..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Botones de acción */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-xs transition-colors"
                >
                  Guardar Acción Correctiva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ===========================================================================
// SUB-COMPONENTE: TARJETA DE TAREA INDIVIDUAL
// ===========================================================================
interface TarjetaTareaProps {
  tarea: TareaAccionCorrectiva;
  onEditar: () => void;
  onEliminar: () => void;
  onCambiarEstado: (st: EstadoAccionCorrectiva) => void;
  onVerDetalle?: (p: ProyectoEducativo) => void;
  onEditarProyecto?: (p: ProyectoEducativo) => void;
}

const TarjetaTarea: React.FC<TarjetaTareaProps> = ({
  tarea,
  onEditar,
  onEliminar,
  onCambiarEstado,
  onVerDetalle,
  onEditarProyecto
}) => {
  const badgeG = (() => {
    switch (tarea.gerencia) {
      case 'Académica':
        return { bg: 'bg-blue-50 text-blue-800 border-blue-200', text: 'Gerencia Académica', icon: BookOpen };
      case 'Comercial':
        return { bg: 'bg-purple-50 text-purple-800 border-purple-200', text: 'Gerencia Comercial', icon: Megaphone };
      case 'General':
        return { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', text: 'Gerencia General', icon: Building2 };
    }
  })();

  const badgePrio = (() => {
    switch (tarea.prioridad) {
      case 'CRITICA':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-black';
      case 'ALTA':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
      case 'MEDIA':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'BAJA':
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  })();

  const hoyStr = new Date().toISOString().slice(0, 10);
  const esVencida = tarea.estado !== 'COMPLETADA' && tarea.fechaLimite < hoyStr;
  const esHoy = tarea.fechaLimite === hoyStr;

  return (
    <div
      className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs transition-all hover:shadow-md ${
        tarea.estado === 'COMPLETADA'
          ? 'border-emerald-200 bg-emerald-50/20'
          : esVencida
          ? 'border-rose-300 bg-rose-50/20'
          : 'border-slate-200'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        {/* Lado izquierdo: Datos de la tarea */}
        <div className="space-y-2 flex-1">
          {/* Fila de Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] border flex items-center gap-1 font-bold ${badgeG.bg}`}>
              <badgeG.icon className="w-3 h-3" />
              <span>{badgeG.text}</span>
            </span>

            <span className={`px-2.5 py-0.5 rounded-full text-[10px] border ${badgePrio}`}>
              {tarea.prioridad === 'CRITICA' ? 'PRIORIDAD CRÍTICA' : `PRIORIDAD ${tarea.prioridad}`}
            </span>

            {/* Estado de Vencimiento */}
            {tarea.estado === 'COMPLETADA' ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Completada el {tarea.fechaCompletada || tarea.fechaLimite}
              </span>
            ) : esVencida ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 animate-pulse">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                VENCIDA ({tarea.fechaLimite})
              </span>
            ) : esHoy ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-600" />
                Vence HOY ({tarea.fechaLimite})
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1 font-mono">
                <CalendarIcon className="w-3 h-3 text-slate-500" />
                Límite: {tarea.fechaLimite}
              </span>
            )}

            {tarea.kpiVinculado && (
              <span className="text-[10px] text-slate-400 font-medium">
                KPI: {tarea.kpiVinculado}
              </span>
            )}
          </div>

          {/* Título de la tarea */}
          <h4
            className={`text-sm sm:text-base font-black text-slate-900 ${
              tarea.estado === 'COMPLETADA' ? 'line-through text-slate-500' : ''
            }`}
          >
            {tarea.titulo}
          </h4>

          {/* Descripción */}
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
            {tarea.descripcion}
          </p>

          {/* Proyectos vinculados / afectados */}
          {tarea.proyectosAfectados && tarea.proyectosAfectados.length > 0 && (
            <div className="pt-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                Programas Educativos Vinculados:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {tarea.proyectosAfectados.map((p, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 text-slate-800 border border-slate-200 font-medium flex items-center gap-1"
                  >
                    <span>{p.nombre}</span>
                    {p.detalle && <span className="text-slate-500 font-normal">({p.detalle})</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bitácora de seguimiento */}
          {tarea.notasSeguimiento && (
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-700">
              <span className="font-bold text-slate-900 block mb-0.5">Seguimiento Operativo:</span>
              <p className="italic">{tarea.notasSeguimiento}</p>
            </div>
          )}
        </div>

        {/* Lado derecho: Responsable asignado y Controles de avance */}
        <div className="w-full lg:w-72 bg-slate-50/80 rounded-xl p-3.5 border border-slate-200 space-y-3 shrink-0">
          {/* Responsable */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 shadow-2xs">
              <UserCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Responsable Asignado:
              </span>
              <div className="text-xs font-black text-slate-900 truncate">
                {tarea.responsableNombre}
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {tarea.responsableCargo}
              </div>
            </div>
          </div>

          {/* Barra de Avance */}
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-bold text-slate-700">Avance:</span>
              <span className="font-mono font-black text-slate-900">{tarea.avancePorcentaje}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  tarea.avancePorcentaje === 100
                    ? 'bg-emerald-500'
                    : tarea.avancePorcentaje >= 50
                    ? 'bg-blue-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${tarea.avancePorcentaje}%` }}
              />
            </div>
          </div>

          {/* Botones de cambio de estado rápido */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-1.5">
            {tarea.estado !== 'COMPLETADA' ? (
              <button
                type="button"
                onClick={() => onCambiarEstado('COMPLETADA')}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs w-full justify-center"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Marcar Subsanada</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onCambiarEstado('EN_PROCESO')}
                className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors w-full justify-center"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reabrir Acción</span>
              </button>
            )}

            <button
              type="button"
              onClick={onEditar}
              className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
              title="Editar fecha límite o responsable"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onEliminar}
              className="p-1.5 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
              title="Eliminar tarea"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
