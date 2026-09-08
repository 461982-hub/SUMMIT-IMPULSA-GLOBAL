import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  XCircle, 
  Search, 
  Filter, 
  Sparkles, 
  Check, 
  BookOpen, 
  Award, 
  Laptop, 
  Users, 
  CalendarDays, 
  ShieldCheck, 
  Download, 
  SlidersHorizontal, 
  RotateCcw, 
  ChevronRight, 
  FileText, 
  CheckSquare, 
  Square, 
  Layers, 
  ExternalLink,
  ShieldAlert,
  ArrowUpDown,
  Zap,
  Eye,
  Info,
  Sliders,
  Flame,
  BarChart3
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { 
  calcularEstadoCalidadProyecto, 
  autoCompletarEstandaresCalidad, 
  validarPilarIndividual, 
  exportarMatrizCalidadCSV,
  EstadoCalidadProyecto 
} from '../../utils/qualityAuditUtils';
import { formatearMoneda } from '../../utils/calculations';

interface AcademicQualityDashboardViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto: (p: ProyectoEducativo) => void;
  onVerDetalle?: (p: ProyectoEducativo) => void;
  onEditarProyecto?: (p: ProyectoEducativo) => void;
  onIrASyllabus?: (p: ProyectoEducativo) => void;
}

export const AcademicQualityDashboardView: React.FC<AcademicQualityDashboardViewProps> = ({
  proyectos,
  moneda,
  onGuardarProyecto,
  onVerDetalle,
  onEditarProyecto,
  onIrASyllabus,
}) => {
  // Filtros y búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'Aprobado' | 'En Revisión' | 'Pendiente' | 'Crítico'>('todos');
  const [filtroModalidad, setFiltroModalidad] = useState<string>('todos');
  const [filtroNivel, setFiltroNivel] = useState<string>('todos');
  const [filtroDocente, setFiltroDocente] = useState<string>('todos');
  const [vistaModo, setVistaModo] = useState<'tarjetas' | 'kanban' | 'tabla'>('tarjetas');

  // Proyecto seleccionado para auditoría y validación rápida en modal
  const [proyectoEnValidacion, setProyectoEnValidacion] = useState<ProyectoEducativo | null>(null);
  const [nombreValidador, setNombreValidador] = useState('Dirección Académica Summit');
  const [observacionTexto, setObservacionTexto] = useState('');
  const [toastMensaje, setToastMensaje] = useState<string | null>(null);

  const mostrarToast = (msg: string) => {
    setToastMensaje(msg);
    setTimeout(() => setToastMensaje(null), 3500);
  };

  // Cálculo de auditoría de todos los proyectos
  const estadosProyectos = useMemo(() => {
    return proyectos.map((p) => calcularEstadoCalidadProyecto(p));
  }, [proyectos]);

  // Lista de docentes únicos
  const docentesUnicos = useMemo(() => {
    const set = new Set<string>();
    proyectos.forEach(p => {
      if (p.nombreDocente && p.nombreDocente.trim()) set.add(p.nombreDocente.trim());
    });
    return Array.from(set).sort();
  }, [proyectos]);

  // Métricas globales del tablero
  const metricasGlobales = useMemo(() => {
    if (estadosProyectos.length === 0) {
      return {
        promedioGeneral: 0,
        totalAprobados: 0,
        totalEnRevision: 0,
        totalPendientes: 0,
        totalCriticos: 0,
        totalPuntosSumados: 0,
      };
    }

    const totalAprobados = estadosProyectos.filter(e => e.categoriaEstado === 'Aprobado').length;
    const totalEnRevision = estadosProyectos.filter(e => e.categoriaEstado === 'En Revisión').length;
    const totalPendientes = estadosProyectos.filter(e => e.categoriaEstado === 'Pendiente').length;
    const totalCriticos = estadosProyectos.filter(e => e.categoriaEstado === 'Crítico').length;

    const suma = estadosProyectos.reduce((acc, curr) => acc + curr.porcentajeGeneral, 0);
    const promedioGeneral = Math.round(suma / estadosProyectos.length);

    return {
      promedioGeneral,
      totalAprobados,
      totalEnRevision,
      totalPendientes,
      totalCriticos,
      totalPuntosSumados: suma,
    };
  }, [estadosProyectos]);

  // Filtrado de proyectos
  const proyectosFiltrados = useMemo(() => {
    return estadosProyectos.filter((item) => {
      const p = item.proyecto;
      const matchBusqueda = 
        p.nombreProyecto.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.nombreDocente.toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.codigoPrograma && p.codigoPrograma.toLowerCase().includes(busqueda.toLowerCase())) ||
        (p.modalidad && p.modalidad.toLowerCase().includes(busqueda.toLowerCase()));

      const matchEstado = filtroEstado === 'todos' || item.categoriaEstado === filtroEstado;
      const matchModalidad = filtroModalidad === 'todos' || (p.modalidad || 'Virtual Sincrónica') === filtroModalidad;
      const matchNivel = filtroNivel === 'todos' || p.nivel === filtroNivel;
      const matchDocente = filtroDocente === 'todos' || p.nombreDocente === filtroDocente;

      return matchBusqueda && matchEstado && matchModalidad && matchNivel && matchDocente;
    });
  }, [estadosProyectos, busqueda, filtroEstado, filtroModalidad, filtroNivel, filtroDocente]);

  // Handler: Aprobación inmediata en 1 clic
  const handleAprobarUnClic = (p: ProyectoEducativo) => {
    const actualizado: ProyectoEducativo = {
      ...p,
      estadoSyllabus: 'Aprobado por Dirección',
      validacionCalidadAcademica: {
        estadoGeneral: 'Aprobado',
        porcentajeCalidad: 100,
        syllabusValidado: true,
        rubricaValidada: true,
        recursosValidados: true,
        docenteValidado: true,
        sesionesValidadas: true,
        requisitosValidados: true,
        validadorPor: 'Dirección Académica',
        fechaValidacion: new Date().toISOString().split('T')[0],
        observacionesCalidad: 'Validado al 100% mediante aprobación rápida directa de Dirección Académica.',
      }
    };
    onGuardarProyecto(actualizado);
    mostrarToast(`✓ "${p.nombreProyecto}" aprobado con 100% de calidad académica`);
  };

  // Handler: Auto-completar y validar con estándares Summit
  const handleAutoCompletarSummit = (p: ProyectoEducativo) => {
    const completado = autoCompletarEstandaresCalidad(p, 'Dirección Académica Summit');
    onGuardarProyecto(completado);
    mostrarToast(`✨ Estándares oficiales Summit aplicados a "${p.nombreProyecto}"`);
  };

  // Handler: Aprobación masiva de proyectos con >= 75%
  const handleAprobacionMasivaOptimos = () => {
    const candidatos = estadosProyectos.filter(e => e.porcentajeGeneral >= 75 && e.categoriaEstado !== 'Aprobado');
    if (candidatos.length === 0) {
      mostrarToast('Todos los programas elegibles ya están aprobados.');
      return;
    }

    candidatos.forEach(item => {
      const p = item.proyecto;
      const completado = autoCompletarEstandaresCalidad(p, 'Comité Curricular Summit');
      onGuardarProyecto(completado);
    });

    mostrarToast(`✓ Se validaron y aprobaron ${candidatos.length} proyectos con puntaje óptimo.`);
  };

  // Manejo de modal de validación detallada
  const estadoProyectoEnValidacion = useMemo(() => {
    if (!proyectoEnValidacion) return null;
    return calcularEstadoCalidadProyecto(proyectoEnValidacion);
  }, [proyectoEnValidacion]);

  const handleTogglePilar = (
    pilarKey: 'syllabusValidado' | 'rubricaValidada' | 'recursosValidados' | 'docenteValidado' | 'sesionesValidadas' | 'requisitosValidados',
    valorActual: boolean
  ) => {
    if (!proyectoEnValidacion) return;
    const actualizado = validarPilarIndividual(
      proyectoEnValidacion,
      pilarKey,
      !valorActual,
      nombreValidador,
      observacionTexto
    );
    setProyectoEnValidacion(actualizado);
    onGuardarProyecto(actualizado);
  };

  const handleGuardarModalValidacion = () => {
    if (!proyectoEnValidacion) return;
    const vActual = proyectoEnValidacion.validacionCalidadAcademica || {
      estadoGeneral: 'En Revisión',
      syllabusValidado: false,
      rubricaValidada: false,
      recursosValidados: false,
      docenteValidado: false,
      sesionesValidadas: false,
      requisitosValidados: false,
    };

    const actualizado: ProyectoEducativo = {
      ...proyectoEnValidacion,
      validacionCalidadAcademica: {
        ...vActual,
        validadorPor: nombreValidador,
        fechaValidacion: new Date().toISOString().split('T')[0],
        observacionesCalidad: observacionTexto || vActual.observacionesCalidad,
      }
    };
    onGuardarProyecto(actualizado);
    setProyectoEnValidacion(null);
    mostrarToast(`✓ Auditoría de calidad guardada para "${actualizado.nombreProyecto}"`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast de notificación flotante */}
      {toastMensaje && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-emerald-500/40 animate-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMensaje}</span>
        </div>
      )}

      {/* Header Institucional & Medidor General de Calidad */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                Aseguramiento de la Calidad Curricular
              </span>
              <span className="text-xs text-slate-500 font-medium">Auditoría & Validación Rápida</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Award className="w-6 h-6 text-blue-600" />
              <span>Tablero de Calidad de Proyectos Educativos</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl">
              Monitoreo integral de los 6 pilares de calidad pedagógica: Syllabus, Rúbrica de Evaluación, Aulas & Recursos Virtuales, Expediente Docente, Cronograma de Sesiones y Régimen de Acreditación SAR.
            </p>
          </div>

          {/* Acciones Rápidas Superiores */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              id="btn-aprobacion-masiva-calidad"
              onClick={handleAprobacionMasivaOptimos}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-colors border border-emerald-500"
              title="Aprobar de inmediato todos los proyectos con avance ≥ 75%"
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>Aprobación Rápida Masiva (≥75%)</span>
            </button>

            <button
              id="btn-exportar-calidad-csv"
              onClick={() => exportarMatrizCalidadCSV(proyectos, moneda)}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 border border-slate-200 shadow-2xs transition-colors"
              title="Descargar matriz de auditoría de calidad académica en formato CSV"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Exportar Matriz CSV</span>
            </button>
          </div>
        </div>

        {/* 5 Tarjetas de Resumen & Barra de Progreso Global */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-100">
          
          {/* Card 1: Índice Global de Calidad */}
          <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-200">Salud Curricular</span>
              <Award className="w-4 h-4 text-amber-300" />
            </div>
            <div className="my-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-white">{metricasGlobales.promedioGeneral}%</span>
                <span className="text-[11px] text-blue-200 font-medium">promedio</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 mt-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    metricasGlobales.promedioGeneral >= 80 ? 'bg-emerald-400' : 
                    metricasGlobales.promedioGeneral >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                  }`}
                  style={{ width: `${metricasGlobales.promedioGeneral}%` }}
                />
              </div>
            </div>
            <span className="text-[10px] text-blue-200/80">Estándar institucional: ≥ 85%</span>
          </div>

          {/* Card 2: Aprobados (100% Validados) */}
          <div 
            onClick={() => setFiltroEstado(filtroEstado === 'Aprobado' ? 'todos' : 'Aprobado')}
            className={`cursor-pointer rounded-xl p-3.5 border transition-all ${
              filtroEstado === 'Aprobado'
                ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300'
                : 'bg-white hover:bg-emerald-50/50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800">100% Validados</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {metricasGlobales.totalAprobados}
            </div>
            <span className="text-[10px] text-slate-500">Listos para lanzamiento</span>
          </div>

          {/* Card 3: En Revisión (65% - 87%) */}
          <div 
            onClick={() => setFiltroEstado(filtroEstado === 'En Revisión' ? 'todos' : 'En Revisión')}
            className={`cursor-pointer rounded-xl p-3.5 border transition-all ${
              filtroEstado === 'En Revisión'
                ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-300'
                : 'bg-white hover:bg-blue-50/50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-800">En Revisión</span>
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-700 mt-1">
              {metricasGlobales.totalEnRevision}
            </div>
            <span className="text-[10px] text-slate-500">Falta 1 ó 2 requisitos</span>
          </div>

          {/* Card 4: Pendientes (40% - 64%) */}
          <div 
            onClick={() => setFiltroEstado(filtroEstado === 'Pendiente' ? 'todos' : 'Pendiente')}
            className={`cursor-pointer rounded-xl p-3.5 border transition-all ${
              filtroEstado === 'Pendiente'
                ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300'
                : 'bg-white hover:bg-amber-50/50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-800">Pendientes</span>
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-700 mt-1">
              {metricasGlobales.totalPendientes}
            </div>
            <span className="text-[10px] text-slate-500">Contenidos en elaboración</span>
          </div>

          {/* Card 5: Críticos (< 40%) */}
          <div 
            onClick={() => setFiltroEstado(filtroEstado === 'Crítico' ? 'todos' : 'Crítico')}
            className={`cursor-pointer rounded-xl p-3.5 border transition-all ${
              filtroEstado === 'Crítico'
                ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-300'
                : 'bg-white hover:bg-rose-50/50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-800">Críticos / Incompletos</span>
              <Flame className="w-4 h-4 text-rose-600 fill-rose-500" />
            </div>
            <div className="text-2xl font-black text-rose-700 mt-1">
              {metricasGlobales.totalCriticos}
            </div>
            <span className="text-[10px] text-slate-500">Requieren intervención</span>
          </div>

        </div>
      </div>

      {/* Barra de Filtros, Búsqueda y Selector de Modo de Vista */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Input de búsqueda */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por programa, código, docente o modalidad..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
            />
          </div>

          {/* Filtros desplegables */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Filtro por Estado */}
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos los Estados</option>
              <option value="Aprobado">🟢 Validados (Aprobados)</option>
              <option value="En Revisión">🔵 En Revisión Curricular</option>
              <option value="Pendiente">🟡 Pendientes</option>
              <option value="Crítico">🔴 Críticos / Incompletos</option>
            </select>

            {/* Filtro por Docente */}
            <select
              value={filtroDocente}
              onChange={(e) => setFiltroDocente(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos los Docentes</option>
              {docentesUnicos.map((doc) => (
                <option key={doc} value={doc}>{doc}</option>
              ))}
            </select>

            {/* Filtro por Modalidad */}
            <select
              value={filtroModalidad}
              onChange={(e) => setFiltroModalidad(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todas las Modalidades</option>
              <option value="Virtual Sincrónica">Virtual Sincrónica</option>
              <option value="Presencial">Presencial</option>
              <option value="Híbrida">Híbrida</option>
              <option value="Asincrónica LMS">Asincrónica LMS</option>
            </select>

            {/* Toggle de vistas */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 ml-auto">
              <button
                onClick={() => setVistaModo('tarjetas')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
                  vistaModo === 'tarjetas' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Vista de tarjetas con barras de progreso detalladas"
              >
                Tarjetas
              </button>
              <button
                onClick={() => setVistaModo('kanban')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
                  vistaModo === 'kanban' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Vista Tablero Kanban de Estados de Calidad"
              >
                Tablero Kanban
              </button>
              <button
                onClick={() => setVistaModo('tabla')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
                  vistaModo === 'tabla' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Vista de matriz comparativa"
              >
                Matriz
              </button>
            </div>

          </div>

        </div>

        {/* Indicador de resultados activos */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span>
            Mostrando <strong>{proyectosFiltrados.length}</strong> de <strong>{proyectos.length}</strong> proyectos educativos auditados.
          </span>
          {(busqueda || filtroEstado !== 'todos' || filtroDocente !== 'todos' || filtroModalidad !== 'todos') && (
            <button
              onClick={() => {
                setBusqueda('');
                setFiltroEstado('todos');
                setFiltroDocente('todos');
                setFiltroModalidad('todos');
              }}
              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* VISTA 1: TARJETAS CON BARRAS DE PROGRESO DETALLADAS */}
      {vistaModo === 'tarjetas' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {proyectosFiltrados.map((item) => {
            const p = item.proyecto;
            const pct = item.porcentajeGeneral;

            return (
              <div 
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
              >
                {/* Cabecera de la Tarjeta */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                          {p.codigoPrograma || `PRG-${p.id}`}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
                          {p.tipoProyecto}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
                          {p.modalidad || 'Virtual Sincrónica'}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-slate-900 mt-1.5 line-clamp-1">
                        {p.nombreProyecto}
                      </h4>
                    </div>

                    {/* Badge de Estado de Calidad */}
                    <div className={`px-2.5 py-1 rounded-full text-xs font-black border flex items-center gap-1.5 shrink-0 ${item.colorBadge}`}>
                      {item.categoriaEstado === 'Aprobado' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      {item.categoriaEstado === 'En Revisión' && <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />}
                      {item.categoriaEstado === 'Pendiente' && <AlertCircle className="w-3.5 h-3.5 text-amber-600" />}
                      {item.categoriaEstado === 'Crítico' && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                      <span>{item.categoriaEstado}</span>
                    </div>
                  </div>

                  {/* Datos del docente y carga horaria */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <strong>Docente:</strong> {p.nombreDocente || 'No asignado'}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      <strong>Carga:</strong> {p.horasClase || 0} hrs ({p.horasTeoricas || 0}T / {p.horasPracticas || 0}P)
                    </span>
                  </div>
                </div>

                {/* BARRA DE PROGRESO PRINCIPAL DE CALIDAD */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-slate-700 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-blue-600" />
                      <span>Avance de Calidad Curricular</span>
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-black text-slate-900">{pct}%</span>
                      <span className="text-[10px] text-slate-500 font-medium">({item.totalPuntos}/100 pts)</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${item.colorBarra}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* DESGLOSE EN BARRAS MINI DE LOS 6 PILARES */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-[10px]">
                    
                    {/* Pilar 1: Syllabus */}
                    <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between font-bold text-slate-700">
                        <span className="truncate">Syllabus</span>
                        <span className={item.pilares.syllabus.estaAprobado ? 'text-emerald-700' : 'text-amber-700'}>
                          {item.pilares.syllabus.puntosObtenidos}/{item.pilares.syllabus.puntosMaximos}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div 
                          className={`h-full ${item.pilares.syllabus.estaAprobado ? 'bg-emerald-500' : 'bg-amber-400'}`}
                          style={{ width: `${item.pilares.syllabus.porcentaje}%` }}
                        />
                      </div>
                    </div>

                    {/* Pilar 2: Rúbrica */}
                    <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between font-bold text-slate-700">
                        <span className="truncate">Rúbrica</span>
                        <span className={item.pilares.rubrica.estaAprobado ? 'text-emerald-700' : 'text-amber-700'}>
                          {item.pilares.rubrica.puntosObtenidos}/{item.pilares.rubrica.puntosMaximos}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div 
                          className={`h-full ${item.pilares.rubrica.estaAprobado ? 'bg-emerald-500' : 'bg-amber-400'}`}
                          style={{ width: `${item.pilares.rubrica.porcentaje}%` }}
                        />
                      </div>
                    </div>

                    {/* Pilar 3: Aulas & Recursos */}
                    <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between font-bold text-slate-700">
                        <span className="truncate">Aula & Rec.</span>
                        <span className={item.pilares.recursosYAula.estaAprobado ? 'text-emerald-700' : 'text-amber-700'}>
                          {item.pilares.recursosYAula.puntosObtenidos}/{item.pilares.recursosYAula.puntosMaximos}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div 
                          className={`h-full ${item.pilares.recursosYAula.estaAprobado ? 'bg-emerald-500' : 'bg-amber-400'}`}
                          style={{ width: `${item.pilares.recursosYAula.porcentaje}%` }}
                        />
                      </div>
                    </div>

                    {/* Pilar 4: Docente */}
                    <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between font-bold text-slate-700">
                        <span className="truncate">Expediente Doc.</span>
                        <span className={item.pilares.docente.estaAprobado ? 'text-emerald-700' : 'text-amber-700'}>
                          {item.pilares.docente.puntosObtenidos}/{item.pilares.docente.puntosMaximos}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div 
                          className={`h-full ${item.pilares.docente.estaAprobado ? 'bg-emerald-500' : 'bg-amber-400'}`}
                          style={{ width: `${item.pilares.docente.porcentaje}%` }}
                        />
                      </div>
                    </div>

                    {/* Pilar 5: Sesiones */}
                    <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between font-bold text-slate-700">
                        <span className="truncate">Cronograma</span>
                        <span className={item.pilares.sesiones.estaAprobado ? 'text-emerald-700' : 'text-amber-700'}>
                          {item.pilares.sesiones.puntosObtenidos}/{item.pilares.sesiones.puntosMaximos}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div 
                          className={`h-full ${item.pilares.sesiones.estaAprobado ? 'bg-emerald-500' : 'bg-amber-400'}`}
                          style={{ width: `${item.pilares.sesiones.porcentaje}%` }}
                        />
                      </div>
                    </div>

                    {/* Pilar 6: SAR & Aforo */}
                    <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between font-bold text-slate-700">
                        <span className="truncate">SAR & Aforo</span>
                        <span className={item.pilares.requisitosYSAR.estaAprobado ? 'text-emerald-700' : 'text-amber-700'}>
                          {item.pilares.requisitosYSAR.puntosObtenidos}/{item.pilares.requisitosYSAR.puntosMaximos}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div 
                          className={`h-full ${item.pilares.requisitosYSAR.estaAprobado ? 'bg-emerald-500' : 'bg-amber-400'}`}
                          style={{ width: `${item.pilares.requisitosYSAR.porcentaje}%` }}
                        />
                      </div>
                    </div>

                  </div>
                </div>

                {/* Alertas pendientes y observaciones */}
                {item.alertasPendientes.length > 0 && item.categoriaEstado !== 'Aprobado' && (
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 text-xs text-amber-900 space-y-1">
                    <span className="font-bold flex items-center gap-1 text-[11px] text-amber-800">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      Requisitos pendientes de validación ({item.alertasPendientes.length}):
                    </span>
                    <ul className="text-[11px] text-amber-950/80 list-disc list-inside space-y-0.5 pl-1">
                      {item.alertasPendientes.slice(0, 2).map((alerta, idx) => (
                        <li key={idx} className="line-clamp-1">{alerta}</li>
                      ))}
                      {item.alertasPendientes.length > 2 && (
                        <li className="text-[10px] text-amber-700 font-bold">
                          +{item.alertasPendientes.length - 2} observación(es) adicional(es)
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Trazabilidad: Validador y fecha */}
                {item.validador && (
                  <div className="text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-1.5">
                    <span>Auditado por: <strong>{item.validador}</strong></span>
                    <span>Fecha: <strong>{item.fechaValidacion || 'Reciente'}</strong></span>
                  </div>
                )}

                {/* BOTONES DE ACCIÓN RÁPIDA DE VALIDACIÓN */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    {/* Botón Auditoría Detallada en Modal */}
                    <button
                      onClick={() => {
                        setProyectoEnValidacion(p);
                        setObservacionTexto(item.observaciones || '');
                        setNombreValidador(item.validador || 'Dirección Académica Summit');
                      }}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-lg flex items-center gap-1.5 border border-blue-200 transition-colors"
                      title="Auditar contenidos y validar pilar por pilar"
                    >
                      <Sliders className="w-3.5 h-3.5 text-blue-600" />
                      <span>Validar Contenidos</span>
                    </button>

                    {/* Botón Auto-completar Summit si está incompleto */}
                    {item.categoriaEstado !== 'Aprobado' && (
                      <button
                        onClick={() => handleAutoCompletarSummit(p)}
                        className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-lg flex items-center gap-1 border border-amber-200 transition-colors"
                        title="Aplicar plantilla estándar Summit a los requisitos faltantes"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span className="hidden sm:inline">Auto-Completar</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 ml-auto">
                    {/* Botón de Aprobación en 1 Clic */}
                    {item.categoriaEstado !== 'Aprobado' ? (
                      <button
                        onClick={() => handleAprobarUnClic(p)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                        title="Aprobar todos los contenidos con visto bueno oficial al 100%"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Aprobar 100%</span>
                      </button>
                    ) : (
                      <span className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded-lg flex items-center gap-1 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aprobado Oficial
                      </span>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* VISTA 2: TABLERO KANBAN DE ESTADOS DE CALIDAD */}
      {vistaModo === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Columna 1: Aprobados (Verde) */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
              <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>100% Validados</span>
              </span>
              <span className="px-2 py-0.5 text-xs font-black rounded-full bg-emerald-100 text-emerald-800">
                {proyectosFiltrados.filter(i => i.categoriaEstado === 'Aprobado').length}
              </span>
            </div>

            <div className="space-y-3">
              {proyectosFiltrados.filter(i => i.categoriaEstado === 'Aprobado').map(item => (
                <div key={item.proyecto.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-500">{item.proyecto.codigoPrograma || `PRG-${item.proyecto.id}`}</span>
                    <span className="text-xs font-black text-emerald-600">{item.porcentajeGeneral}%</span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-800 line-clamp-2">{item.proyecto.nombreProyecto}</h5>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${item.porcentajeGeneral}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span>{item.proyecto.nombreDocente}</span>
                    <button 
                      onClick={() => setProyectoEnValidacion(item.proyecto)}
                      className="text-blue-600 hover:text-blue-800 font-bold"
                    >
                      Revisar
                    </button>
                  </div>
                </div>
              ))}
              {proyectosFiltrados.filter(i => i.categoriaEstado === 'Aprobado').length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4 italic">No hay proyectos aprobados en este filtro</p>
              )}
            </div>
          </div>

          {/* Columna 2: En Revisión (Azul) */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-blue-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-blue-200">
              <span className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <span>En Revisión</span>
              </span>
              <span className="px-2 py-0.5 text-xs font-black rounded-full bg-blue-100 text-blue-800">
                {proyectosFiltrados.filter(i => i.categoriaEstado === 'En Revisión').length}
              </span>
            </div>

            <div className="space-y-3">
              {proyectosFiltrados.filter(i => i.categoriaEstado === 'En Revisión').map(item => (
                <div key={item.proyecto.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-500">{item.proyecto.codigoPrograma || `PRG-${item.proyecto.id}`}</span>
                    <span className="text-xs font-black text-blue-600">{item.porcentajeGeneral}%</span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-800 line-clamp-2">{item.proyecto.nombreProyecto}</h5>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-500 h-full" style={{ width: `${item.porcentajeGeneral}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] pt-1">
                    <button 
                      onClick={() => handleAprobarUnClic(item.proyecto)}
                      className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold"
                    >
                      Aprobar
                    </button>
                    <button 
                      onClick={() => setProyectoEnValidacion(item.proyecto)}
                      className="text-blue-600 hover:text-blue-800 font-bold"
                    >
                      Auditar
                    </button>
                  </div>
                </div>
              ))}
              {proyectosFiltrados.filter(i => i.categoriaEstado === 'En Revisión').length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4 italic">Sin proyectos en revisión</p>
              )}
            </div>
          </div>

          {/* Columna 3: Pendientes (Ámbar) */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-amber-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200">
              <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Pendientes</span>
              </span>
              <span className="px-2 py-0.5 text-xs font-black rounded-full bg-amber-100 text-amber-800">
                {proyectosFiltrados.filter(i => i.categoriaEstado === 'Pendiente').length}
              </span>
            </div>

            <div className="space-y-3">
              {proyectosFiltrados.filter(i => i.categoriaEstado === 'Pendiente').map(item => (
                <div key={item.proyecto.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-500">{item.proyecto.codigoPrograma || `PRG-${item.proyecto.id}`}</span>
                    <span className="text-xs font-black text-amber-600">{item.porcentajeGeneral}%</span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-800 line-clamp-2">{item.proyecto.nombreProyecto}</h5>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-amber-400 h-full" style={{ width: `${item.porcentajeGeneral}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] pt-1">
                    <button 
                      onClick={() => handleAutoCompletarSummit(item.proyecto)}
                      className="text-amber-700 hover:text-amber-900 font-bold"
                    >
                      ✨ Auto-completar
                    </button>
                    <button 
                      onClick={() => setProyectoEnValidacion(item.proyecto)}
                      className="text-blue-600 hover:text-blue-800 font-bold"
                    >
                      Validar
                    </button>
                  </div>
                </div>
              ))}
              {proyectosFiltrados.filter(i => i.categoriaEstado === 'Pendiente').length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4 italic">Sin proyectos pendientes</p>
              )}
            </div>
          </div>

          {/* Columna 4: Críticos (Rojo) */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-rose-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-rose-200">
              <span className="text-xs font-black text-rose-900 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-600 fill-rose-500" />
                <span>Críticos</span>
              </span>
              <span className="px-2 py-0.5 text-xs font-black rounded-full bg-rose-100 text-rose-800">
                {proyectosFiltrados.filter(i => i.categoriaEstado === 'Crítico').length}
              </span>
            </div>

            <div className="space-y-3">
              {proyectosFiltrados.filter(i => i.categoriaEstado === 'Crítico').map(item => (
                <div key={item.proyecto.id} className="bg-white p-3 rounded-xl border border-rose-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-500">{item.proyecto.codigoPrograma || `PRG-${item.proyecto.id}`}</span>
                    <span className="text-xs font-black text-rose-600">{item.porcentajeGeneral}%</span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-800 line-clamp-2">{item.proyecto.nombreProyecto}</h5>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-rose-500 h-full" style={{ width: `${item.porcentajeGeneral}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] pt-1">
                    <button 
                      onClick={() => handleAutoCompletarSummit(item.proyecto)}
                      className="px-2 py-1 bg-amber-500 text-white rounded text-[10px] font-bold"
                    >
                      ✨ Corregir
                    </button>
                    <button 
                      onClick={() => setProyectoEnValidacion(item.proyecto)}
                      className="text-rose-700 hover:text-rose-900 font-bold"
                    >
                      Detalle
                    </button>
                  </div>
                </div>
              ))}
              {proyectosFiltrados.filter(i => i.categoriaEstado === 'Crítico').length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4 italic">No hay proyectos en estado crítico</p>
              )}
            </div>
          </div>

        </div>
      )}

      {/* VISTA 3: MATRIZ DE AUDITORÍA EN TABLA */}
      {vistaModo === 'tabla' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-3 px-3.5">Código & Programa</th>
                  <th className="py-3 px-3.5">Docente</th>
                  <th className="py-3 px-3.5 text-center">Calidad (%)</th>
                  <th className="py-3 px-3.5 text-center">Estado</th>
                  <th className="py-3 px-3.5 text-center">Syllabus (20p)</th>
                  <th className="py-3 px-3.5 text-center">Rúbrica (20p)</th>
                  <th className="py-3 px-3.5 text-center">Aula (15p)</th>
                  <th className="py-3 px-3.5 text-center">Docente (15p)</th>
                  <th className="py-3 px-3.5 text-center">Sesiones (15p)</th>
                  <th className="py-3 px-3.5 text-center">SAR/Req (15p)</th>
                  <th className="py-3 px-3.5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {proyectosFiltrados.map((item) => {
                  const p = item.proyecto;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900">{p.nombreProyecto}</div>
                        <div className="text-[10px] text-slate-500">{p.codigoPrograma || `PRG-${p.id}`} • {p.tipoProyecto}</div>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-medium text-slate-800">{p.nombreDocente}</div>
                        <div className="text-[10px] text-slate-500">{p.modalidad || 'Virtual'}</div>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span className="text-sm font-black text-slate-900">{item.porcentajeGeneral}%</span>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${item.colorBadge}`}>
                          {item.categoriaEstado}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span className={item.pilares.syllabus.estaAprobado ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                          {item.pilares.syllabus.puntosObtenidos}/20
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span className={item.pilares.rubrica.estaAprobado ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                          {item.pilares.rubrica.puntosObtenidos}/20
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span className={item.pilares.recursosYAula.estaAprobado ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                          {item.pilares.recursosYAula.puntosObtenidos}/15
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span className={item.pilares.docente.estaAprobado ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                          {item.pilares.docente.puntosObtenidos}/15
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span className={item.pilares.sesiones.estaAprobado ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                          {item.pilares.sesiones.puntosObtenidos}/15
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span className={item.pilares.requisitosYSAR.estaAprobado ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                          {item.pilares.requisitosYSAR.puntosObtenidos}/15
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right space-x-1">
                        <button
                          onClick={() => setProyectoEnValidacion(p)}
                          className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200"
                        >
                          Auditar
                        </button>
                        {item.categoriaEstado !== 'Aprobado' && (
                          <button
                            onClick={() => handleAprobarUnClic(p)}
                            className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg"
                          >
                            Aprobar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL INTERACTIVO DE VALIDACIÓN RÁPIDA DE CONTENIDOS (AUDITORÍA PILAR POR PILAR) */}
      {proyectoEnValidacion && estadoProyectoEnValidacion && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Cabecera del modal */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-500/30 text-blue-200 border border-blue-400/30">
                    Auditoría Curricular en Vivo
                  </span>
                  <span className="text-xs text-slate-300">
                    {proyectoEnValidacion.codigoPrograma || `PRG-${proyectoEnValidacion.id}`}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  {proyectoEnValidacion.nombreProyecto}
                </h3>
              </div>

              <button
                onClick={() => setProyectoEnValidacion(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Cuerpo con scroll */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 flex-1">
              
              {/* Barra de estado rápido dentro del modal */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-blue-900 block">Puntaje Actual de Calidad</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-black text-blue-950">{estadoProyectoEnValidacion.porcentajeGeneral}%</span>
                    <span className="text-xs font-semibold text-blue-700">({estadoProyectoEnValidacion.totalPuntos} de 100 puntos)</span>
                  </div>
                </div>

                {/* Acciones de auto-completar y aprobar dentro del modal */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      const completado = autoCompletarEstandaresCalidad(proyectoEnValidacion, nombreValidador);
                      setProyectoEnValidacion(completado);
                      onGuardarProyecto(completado);
                      mostrarToast('✓ Estándares Summit aplicados al proyecto.');
                    }}
                    className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg flex items-center gap-1.5 border border-amber-300 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    <span>Auto-completar Plantilla Oficial</span>
                  </button>

                  <button
                    onClick={() => {
                      handleAprobarUnClic(proyectoEnValidacion);
                      setProyectoEnValidacion(null);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Aprobar Todo (100%)</span>
                  </button>
                </div>
              </div>

              {/* LISTA DE LOS 6 PILARES CON SWITCHES INTERACTIVOS */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Validación por Criterios Pedagógicos
                </h4>

                {/* 1. Pilar Syllabus */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <BookOpen className="w-4 h-4 text-purple-600" />
                      <div>
                        <span className="font-bold text-slate-800 text-xs">1. Syllabus & Desglose Temático (20 pts)</span>
                        <div className="text-[11px] text-slate-500">
                          {estadoProyectoEnValidacion.pilares.syllabus.detallesCumplidos.join(' • ') || 'Sin temario'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleTogglePilar('syllabusValidado', Boolean(proyectoEnValidacion.validacionCalidadAcademica?.syllabusValidado))}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all ${
                        proyectoEnValidacion.validacionCalidadAcademica?.syllabusValidado
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {proyectoEnValidacion.validacionCalidadAcademica?.syllabusValidado ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Validado</span>
                        </>
                      ) : (
                        <>
                          <Square className="w-3.5 h-3.5" />
                          <span>Marcar Validado</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 2. Pilar Rúbrica */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Award className="w-4 h-4 text-amber-600" />
                      <div>
                        <span className="font-bold text-slate-800 text-xs">2. Rúbrica de Evaluación Sumatoria 100% (20 pts)</span>
                        <div className="text-[11px] text-slate-500">
                          {proyectoEnValidacion.rubricaEvaluacion
                            ? `Proyecto: ${proyectoEnValidacion.rubricaEvaluacion.proyectoFinalPct}% • Talleres: ${proyectoEnValidacion.rubricaEvaluacion.talleresPracticosPct}% • Asistencia: ${proyectoEnValidacion.rubricaEvaluacion.participacionAsistenciaPct}%`
                            : 'Falta rúbrica de evaluación'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleTogglePilar('rubricaValidada', Boolean(proyectoEnValidacion.validacionCalidadAcademica?.rubricaValidada))}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all ${
                        proyectoEnValidacion.validacionCalidadAcademica?.rubricaValidada
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {proyectoEnValidacion.validacionCalidadAcademica?.rubricaValidada ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Validado</span>
                        </>
                      ) : (
                        <>
                          <Square className="w-3.5 h-3.5" />
                          <span>Marcar Validado</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 3. Pilar Aulas & Recursos */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Laptop className="w-4 h-4 text-blue-600" />
                      <div>
                        <span className="font-bold text-slate-800 text-xs">3. Aulas Virtuales & Recursos Didácticos (15 pts)</span>
                        <div className="text-[11px] text-slate-500">
                          {proyectoEnValidacion.enlaceAulaVirtual || proyectoEnValidacion.plataformaLMS || 'Sin aula virtual configurada'} • {proyectoEnValidacion.recursosDidacticos?.length || 0} recursos
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleTogglePilar('recursosValidados', Boolean(proyectoEnValidacion.validacionCalidadAcademica?.recursosValidados))}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all ${
                        proyectoEnValidacion.validacionCalidadAcademica?.recursosValidados
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {proyectoEnValidacion.validacionCalidadAcademica?.recursosValidados ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Validado</span>
                        </>
                      ) : (
                        <>
                          <Square className="w-3.5 h-3.5" />
                          <span>Marcar Validado</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 4. Pilar Docente */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <div>
                        <span className="font-bold text-slate-800 text-xs">4. Expediente Docente & Credenciales (15 pts)</span>
                        <div className="text-[11px] text-slate-500">
                          Titular: {proyectoEnValidacion.nombreDocente} • {proyectoEnValidacion.docenteEspecialidad || 'Especialista'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleTogglePilar('docenteValidado', Boolean(proyectoEnValidacion.validacionCalidadAcademica?.docenteValidado))}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all ${
                        proyectoEnValidacion.validacionCalidadAcademica?.docenteValidado
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {proyectoEnValidacion.validacionCalidadAcademica?.docenteValidado ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Validado</span>
                        </>
                      ) : (
                        <>
                          <Square className="w-3.5 h-3.5" />
                          <span>Marcar Validado</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 5. Pilar Cronograma */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <CalendarDays className="w-4 h-4 text-teal-600" />
                      <div>
                        <span className="font-bold text-slate-800 text-xs">5. Cronograma & Sesiones de Clase (15 pts)</span>
                        <div className="text-[11px] text-slate-500">
                          {proyectoEnValidacion.sesionesClase?.length || 0} sesiones estructuradas • Inicio: {proyectoEnValidacion.fechaProgramacion || 'Pendiente'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleTogglePilar('sesionesValidadas', Boolean(proyectoEnValidacion.validacionCalidadAcademica?.sesionesValidadas))}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all ${
                        proyectoEnValidacion.validacionCalidadAcademica?.sesionesValidadas
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {proyectoEnValidacion.validacionCalidadAcademica?.sesionesValidadas ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Validado</span>
                        </>
                      ) : (
                        <>
                          <Square className="w-3.5 h-3.5" />
                          <span>Marcar Validado</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 6. Pilar SAR & Aforo */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="font-bold text-slate-800 text-xs">6. Aforo, Perfil de Egreso & Acreditación SAR (15 pts)</span>
                        <div className="text-[11px] text-slate-500">
                          {proyectoEnValidacion.cumpleAcreditacionSAR ? 'Exento SAR (0%)' : 'Gravado ISV (15%)'} • Aforo: {proyectoEnValidacion.alumnosFinal} alum.
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleTogglePilar('requisitosValidados', Boolean(proyectoEnValidacion.validacionCalidadAcademica?.requisitosValidados))}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all ${
                        proyectoEnValidacion.validacionCalidadAcademica?.requisitosValidados
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {proyectoEnValidacion.validacionCalidadAcademica?.requisitosValidados ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Validado</span>
                        </>
                      ) : (
                        <>
                          <Square className="w-3.5 h-3.5" />
                          <span>Marcar Validado</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>

              {/* Dictamen y Observaciones del Validador */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Responsable de la Validación Académica:
                    </label>
                    <input
                      type="text"
                      value={nombreValidador}
                      onChange={(e) => setNombreValidador(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Fecha de Auditoría:
                    </label>
                    <input
                      type="text"
                      disabled
                      value={new Date().toLocaleDateString('es-HN', { year: 'numeric', month: 'long', day: 'numeric' })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-100 text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dictamen / Observaciones de Calidad Curricular:
                  </label>
                  <textarea
                    rows={2}
                    value={observacionTexto}
                    onChange={(e) => setObservacionTexto(e.target.value)}
                    placeholder="Escribe comentarios de retroalimentación, acuerdos con el docente o instrucciones de mejora..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

            </div>

            {/* Footer del Modal */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                onClick={() => setProyectoEnValidacion(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancelar
              </button>

              <button
                onClick={handleGuardarModalValidacion}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Guardar Auditoría de Calidad
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
