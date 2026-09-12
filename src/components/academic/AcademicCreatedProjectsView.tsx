import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Plus,
  Trash2,
  Search,
  BookOpen,
  Clock,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  Check,
  X,
  Edit3,
  Eye,
  Printer,
  Copy,
  ShieldCheck,
  ShieldAlert,
  ArrowUpDown,
  Filter,
  Layers,
  Sparkles,
  Calendar
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { formatearMoneda } from '../../utils/calculations';
import { exportarAExcel, exportarACSV } from '../../utils/exportUtils';
import { WorkflowStatusBadge } from '../WorkflowStatusBadge';

export function esProyectoCreadoPorAcademica(p: ProyectoEducativo): boolean {
  if (!p) return false;
  if (p.gerenciaOrigen === 'gerencia-academica') return true;
  if (p.creadoPorGerencia === 'gerencia-academica') return true;
  if (p.registroAuditoria?.creadoPor?.toLowerCase().includes('académic')) return true;
  if (p.responsableAcademico && p.responsableAcademico.length > 0) return true;
  if (p.codigoSilaboOrigen || p.esSilaboBase || p.silaboOrigenId) return true;
  if (p.fechaElaboracion) return true;
  // Todo programa educativo en la arquitectura institucional proviene de la Gerencia Académica
  if (p.gerenciaOrigen !== 'gerencia-comercializacion' && p.gerenciaOrigen !== 'gerencia-general') {
    return true;
  }
  return false;
}

interface AcademicCreatedProjectsViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onEditarProyecto: (p: ProyectoEducativo) => void;
  onVerDetalle: (p: ProyectoEducativo) => void;
  onNuevoProyecto?: () => void;
  onGuardarProyecto: (p: ProyectoEducativo) => void;
  onEliminarProyecto?: (p: ProyectoEducativo) => void;
  onEliminarMultiples?: (ids: string[]) => void;
  onAbrirWorkflowStatusModal?: (proyectoId?: string) => void;
  onNotificar?: (mensaje: string) => void;
  onAbrirSyllabusPDF?: (p: ProyectoEducativo) => void;
}

export const AcademicCreatedProjectsView: React.FC<AcademicCreatedProjectsViewProps> = ({
  proyectos,
  moneda,
  onEditarProyecto,
  onVerDetalle,
  onNuevoProyecto,
  onGuardarProyecto,
  onEliminarProyecto,
  onEliminarMultiples,
  onAbrirWorkflowStatusModal,
  onNotificar,
  onAbrirSyllabusPDF,
}) => {
  // Filtro base: proyectos que pertenecen a o fueron creados por la Gerencia Académica
  const proyectosAcademicos = useMemo(() => {
    return proyectos.filter(esProyectoCreadoPorAcademica);
  }, [proyectos]);

  // Estados de búsqueda y filtrado
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroDocente, setFiltroDocente] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroSAR, setFiltroSAR] = useState<string>('todos');
  const [ordenCampo, setOrdenCampo] = useState<'correlativo' | 'nombre' | 'fecha' | 'horas' | 'costo'>('correlativo');
  const [ordenAsc, setOrdenAsc] = useState<boolean>(false);

  // Selección múltiple para acciones masivas (borrado en lote)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modales de Confirmación de Borrado
  const [proyectoABorrar, setProyectoABorrar] = useState<ProyectoEducativo | null>(null);
  const [mostrarModalBorradoMasivo, setMostrarModalBorradoMasivo] = useState(false);

  // Lista de docentes únicos para el selector
  const listaDocentes = useMemo(() => {
    const setDoc = new Set<string>();
    proyectosAcademicos.forEach((p) => {
      if (p.nombreDocente && p.nombreDocente.trim()) {
        setDoc.add(p.nombreDocente.trim());
      }
    });
    return Array.from(setDoc).sort();
  }, [proyectosAcademicos]);

  // Proyectos filtrados
  const proyectosFiltrados = useMemo(() => {
    return proyectosAcademicos
      .filter((p) => {
        // Búsqueda por texto
        const query = busqueda.toLowerCase().trim();
        const coincideTexto =
          !query ||
          p.nombreProyecto.toLowerCase().includes(query) ||
          (p.codigoPrograma && p.codigoPrograma.toLowerCase().includes(query)) ||
          p.nombreDocente.toLowerCase().includes(query) ||
          (p.codigoSilaboOrigen && p.codigoSilaboOrigen.toLowerCase().includes(query)) ||
          (p.codigoFiscalSAR && p.codigoFiscalSAR.toLowerCase().includes(query)) ||
          String(p.numeroCorrelativo || '').includes(query);

        // Filtro tipo
        const coincideTipo = filtroTipo === 'todos' || p.tipoProyecto === filtroTipo;

        // Filtro docente
        const coincideDocente = filtroDocente === 'todos' || p.nombreDocente === filtroDocente;

        // Filtro estado
        const coincideEstado = filtroEstado === 'todos' || p.seLlevoACabo === filtroEstado;

        // Filtro SAR
        const esAcreditado = p.cumpleAcreditacionSAR || p.tipoProyecto === 'Formación académica acreditada (ej. convenios universitarios)' || p.tipoProyecto === 'DIPLOMADO';
        const coincideSAR =
          filtroSAR === 'todos' ||
          (filtroSAR === 'exento' && esAcreditado) ||
          (filtroSAR === 'grava' && !esAcreditado);

        return coincideTexto && coincideTipo && coincideDocente && coincideEstado && coincideSAR;
      })
      .sort((a, b) => {
        let comp = 0;
        if (ordenCampo === 'correlativo') {
          comp = (a.numeroCorrelativo || 0) - (b.numeroCorrelativo || 0);
        } else if (ordenCampo === 'nombre') {
          comp = a.nombreProyecto.localeCompare(b.nombreProyecto);
        } else if (ordenCampo === 'horas') {
          comp = (a.horasClase || 0) - (b.horasClase || 0);
        } else if (ordenCampo === 'costo') {
          comp = (a.costoDocenteCalculado || 0) - (b.costoDocenteCalculado || 0);
        } else if (ordenCampo === 'fecha') {
          const fA = a.fechaHoraGrabacion || a.fechaCreacion || a.fechaElaboracion || '';
          const fB = b.fechaHoraGrabacion || b.fechaCreacion || b.fechaElaboracion || '';
          comp = fA.localeCompare(fB);
        }
        return ordenAsc ? comp : -comp;
      });
  }, [proyectosAcademicos, busqueda, filtroTipo, filtroDocente, filtroEstado, filtroSAR, ordenCampo, ordenAsc]);

  // Resumen numérico de la gestión de Gerencia Académica
  const resumen = useMemo(() => {
    const total = proyectosAcademicos.length;
    const totalHoras = proyectosAcademicos.reduce((acc, p) => acc + (p.horasClase || 0), 0);
    const totalDocente = proyectosAcademicos.reduce((acc, p) => acc + (p.costoDocenteCalculado || ((p.horasClase || 0) * (p.tarifaHoraDocente || 200))), 0);
    const conSilaboBase = proyectosAcademicos.filter((p) => Boolean(p.codigoSilaboOrigen || p.silaboOrigenId || p.esSilaboBase)).length;
    const enComercializacion = proyectosAcademicos.filter((p) => p.comercializacionCompletada || p.etapaFlujo === 'comercializacion').length;
    const listos = proyectosAcademicos.filter((p) => p.seLlevoACabo === 'Listo').length;

    return {
      total,
      totalHoras,
      totalDocente,
      conSilaboBase,
      enComercializacion,
      listos,
    };
  }, [proyectosAcademicos]);

  // Manejador de selección de filas
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === proyectosFiltrados.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(proyectosFiltrados.map((p) => p.id)));
    }
  };

  // Manejador para confirmar eliminación individual
  const handleConfirmarBorradoIndividual = () => {
    if (!proyectoABorrar) return;
    const nombre = proyectoABorrar.nombreProyecto;
    if (onEliminarProyecto) {
      onEliminarProyecto(proyectoABorrar);
    }
    // Remover de seleccionados si estaba
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(proyectoABorrar.id);
      return next;
    });
    setProyectoABorrar(null);
    onNotificar?.(`Proyecto "${nombre}" eliminado de los registros de Gerencia Académica.`);
  };

  // Manejador para confirmar eliminación masiva
  const handleConfirmarBorradoMasivo = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    if (onEliminarMultiples) {
      onEliminarMultiples(ids);
    } else if (onEliminarProyecto) {
      // Fallback: eliminar uno a uno
      ids.forEach((id) => {
        const p = proyectos.find((item) => item.id === id);
        if (p) onEliminarProyecto(p);
      });
    }

    setSelectedIds(new Set());
    setMostrarModalBorradoMasivo(false);
    onNotificar?.(`${ids.length} proyectos eliminados definitivamente de la matriz académica.`);
  };

  return (
    <div className="space-y-6" id="vista-proyectos-creados-academica">
      {/* 1. ENCABEZADO DESTACADO DE LA GERENCIA ACADÉMICA */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 flex items-center gap-1">
                <GraduationCap className="w-3 h-3 text-indigo-300" />
                Paso 1 del Flujo Institucional
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Custodiado por Phd. Donal Reyes
              </span>
              <span className="text-xs text-slate-300 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Sellado de Hora y Fecha Automático
              </span>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Proyectos Creados por la Gerencia Académica</span>
              <span className="px-2 py-0.5 text-xs font-mono font-bold bg-indigo-600 text-white rounded-lg shadow-xs">
                {proyectosAcademicos.length}
              </span>
            </h2>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Consolidado oficial de toda la oferta formativa, diplomados, talleres y cursos diseñados curricularmente en la <strong>Gerencia Académica</strong>. Cada propuesta incluye objetivos pedagógicos, horas lectivas, tarifa docente asignada y vinculación a sílabos acreditados.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {selectedIds.size > 0 && (
              <button
                type="button"
                id="btn-borrar-masivo-academica"
                onClick={() => setMostrarModalBorradoMasivo(true)}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-950/40 flex items-center gap-2 transition-all animate-in fade-in zoom-in-95 cursor-pointer"
                title={`Eliminar los ${selectedIds.size} proyectos seleccionados`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Borrar Seleccionados ({selectedIds.size})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => exportarAExcel(proyectosFiltrados, moneda)}
              className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Descargar listado en formato Excel"
            >
              <Download className="w-3.5 h-3.5 text-indigo-300" />
              <span>Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. TARJETAS DE MÉTRICAS EJECUTIVAS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Proyectos</span>
            <GraduationCap className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900">
            {resumen.total}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Elaborados por Académica</p>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Carga Horaria</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 font-mono">
            {resumen.totalHoras} hrs
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Total horas lectivas</p>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Presupuesto Docente</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm sm:text-base font-black text-slate-900 font-mono truncate">
            {formatearMoneda(resumen.totalDocente, moneda)}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Honorarios planificados</p>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Sílabos Base</span>
            <BookOpen className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-purple-950 font-mono">
            {resumen.conSilaboBase}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Vinculados a catálogo</p>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">En Comercial</span>
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-950 font-mono">
            {resumen.enComercializacion}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">En venta / Paso 2</p>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Listos / GG</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-950 font-mono">
            {resumen.listos}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Aprobación final emitida</p>
        </div>
      </div>

      {/* 3. BARRA DE BÚSQUEDA Y FILTROS MÚLTIPLES */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="input-busqueda-proyectos-academicos"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre de curso, código (SUM-2026-...), docente o sílabo base..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 placeholder-slate-400"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Filtro Tipo */}
            <select
              id="filtro-tipo-academicos"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="todos">Todos los Tipos</option>
              <option value="CURSO">Curso</option>
              <option value="DIPLOMADO">Diplomado</option>
              <option value="TALLER">Taller</option>
              <option value="Formación académica acreditada (ej. convenios universitarios)">Formación Acreditada</option>
              <option value="Servicios educativos no acreditados (talleres, cursos libres)">Cursos Libres</option>
            </select>

            {/* Filtro Docente */}
            <select
              id="filtro-docente-academicos"
              value={filtroDocente}
              onChange={(e) => setFiltroDocente(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="todos">Todos los Docentes ({listaDocentes.length})</option>
              {listaDocentes.map((doc) => (
                <option key={doc} value={doc}>{doc}</option>
              ))}
            </select>

            {/* Filtro Estado */}
            <select
              id="filtro-estado-academicos"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="todos">Todos los Estados</option>
              <option value="Planificado">Planificado</option>
              <option value="En curso">En curso</option>
              <option value="Listo">Listo (Aprobado GG)</option>
              <option value="No se llevó a cabo">No se llevó a cabo</option>
            </select>

            {/* Filtro SAR */}
            <select
              id="filtro-sar-academicos"
              value={filtroSAR}
              onChange={(e) => setFiltroSAR(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="todos">Régimen Fiscal (Todos)</option>
              <option value="exento">Exento 0% (Acreditado)</option>
              <option value="grava">Grava 15% ISV</option>
            </select>

            {(busqueda || filtroTipo !== 'todos' || filtroDocente !== 'todos' || filtroEstado !== 'todos' || filtroSAR !== 'todos') && (
              <button
                type="button"
                onClick={() => {
                  setBusqueda('');
                  setFiltroTipo('todos');
                  setFiltroDocente('todos');
                  setFiltroEstado('todos');
                  setFiltroSAR('todos');
                }}
                className="px-2 py-1 text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Barra de estado de selección */}
        <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 text-slate-500">
          <div className="flex items-center gap-2">
            <span>
              Mostrando <strong>{proyectosFiltrados.length}</strong> de <strong>{proyectosAcademicos.length}</strong> proyectos de Gerencia Académica
            </span>
            {selectedIds.size > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">
                {selectedIds.size} seleccionados
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Ordenar por:</span>
            <select
              value={ordenCampo}
              onChange={(e) => setOrdenCampo(e.target.value as any)}
              className="bg-transparent border-0 font-bold text-slate-700 text-[11px] cursor-pointer focus:ring-0"
            >
              <option value="correlativo">Nº Correlativo</option>
              <option value="nombre">Nombre</option>
              <option value="horas">Carga Horaria</option>
              <option value="costo">Inversión Docente</option>
              <option value="fecha">Fecha Creación</option>
            </select>
            <button
              type="button"
              onClick={() => setOrdenAsc(!ordenAsc)}
              className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors"
              title={ordenAsc ? 'Ascendente' : 'Descendente'}
            >
              <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. TABLA DETALLADA DE PROYECTOS CREADOS POR GERENCIA ACADÉMICA */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {proyectosFiltrados.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-base font-bold text-slate-900">
                {proyectosAcademicos.length === 0
                  ? 'No hay proyectos creados aún en Gerencia Académica'
                  : 'No se encontraron proyectos con los filtros actuales'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {proyectosAcademicos.length === 0
                  ? 'Los proyectos formativos en Gerencia Académica se formalizan mediante la opción "+ Crear Sílabo Oficial" en la barra superior o directamente desde el Tablero Principal.'
                  : 'Prueba modificando los criterios de búsqueda o limpiando los filtros seleccionados.'}
              </p>
            </div>
            {proyectosAcademicos.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setBusqueda('');
                  setFiltroTipo('todos');
                  setFiltroDocente('todos');
                  setFiltroEstado('todos');
                  setFiltroSAR('todos');
                }}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Restablecer todos los filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" id="tabla-proyectos-creados-academica">
              <thead className="bg-slate-900 text-white uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-3.5 text-center w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === proyectosFiltrados.length && proyectosFiltrados.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-slate-400 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5"
                      title="Seleccionar todos los proyectos visibles"
                    />
                  </th>
                  <th className="py-3 px-3">Código & Programa Formativo</th>
                  <th className="py-3 px-3">Sílabo Base Oficial</th>
                  <th className="py-3 px-3">Docente Designado</th>
                  <th className="py-3 px-3 text-center">Carga (Horas)</th>
                  <th className="py-3 px-3 text-center">Honorarios Docente</th>
                  <th className="py-3 px-3 text-center">Régimen SAR</th>
                  <th className="py-3 px-3 text-center">Flujo Institucional</th>
                  <th className="py-3 px-3 text-right">Acciones de Gestión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {proyectosFiltrados.map((p) => {
                  const isSelected = selectedIds.has(p.id);
                  const horasT = p.horasTeoricas || Math.round((p.horasClase || 0) * 0.4);
                  const horasP = p.horasPracticas || Math.round((p.horasClase || 0) * 0.6);
                  const esAcreditado = p.cumpleAcreditacionSAR || p.tipoProyecto === 'Formación académica acreditada (ej. convenios universitarios)' || p.tipoProyecto === 'DIPLOMADO';
                  const tieneSilabo = Boolean(p.codigoSilaboOrigen || p.silaboOrigenId);

                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-indigo-50/60' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Checkbox de selección */}
                      <td className="py-3.5 px-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(p.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5"
                        />
                      </td>

                      {/* Código & Programa */}
                      <td className="py-3.5 px-3 max-w-sm">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="text-[9px] font-mono font-black text-indigo-800 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                            #{String(p.numeroCorrelativo || p.id).padStart(3, '0')}
                          </span>
                          <span className="text-[9px] font-mono font-extrabold uppercase px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-300 rounded">
                            {p.codigoPrograma || `SUM-2026-${String(p.numeroCorrelativo || p.id).padStart(3, '0')}`}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                            {p.tipoProyecto}
                          </span>
                          {(p.fechaHoraGrabacion || p.horaCreacion || p.fechaCreacion) && (
                            <span className="text-[9px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1" title={p.fechaHoraGrabacion ? `Grabado automáticamente el: ${p.fechaHoraGrabacion}` : 'Hora exacta de creación'}>
                              <Clock className="w-2.5 h-2.5 text-emerald-600" />
                              <span>{p.fechaHoraGrabacion || p.horaCreacion || new Date(p.fechaCreacion!).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                            </span>
                          )}
                        </div>

                        <div
                          className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer text-xs transition-colors"
                          onClick={() => onVerDetalle(p)}
                          title="Clic para ver la ficha técnica completa del proyecto"
                        >
                          {p.nombreProyecto}
                        </div>

                        <div className="flex items-center gap-2 mt-1 flex-wrap text-[10px] text-slate-500">
                          <span className="text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-semibold border border-indigo-100">
                            📌 {p.seccion || 'Sección A'}
                          </span>
                          <span>🗓️ {p.diasClase || 'Lunes a Viernes'}</span>
                          <span className="font-mono">⏰ {p.horario || '06:00 PM - 08:00 PM'}</span>
                        </div>
                      </td>

                      {/* Sílabo Base Oficial */}
                      <td className="py-3.5 px-3">
                        {tieneSilabo ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 text-purple-900 border border-purple-200">
                              <BookOpen className="w-3 h-3 text-purple-600" />
                              {p.codigoSilaboOrigen || 'Sílabo Base'}
                            </span>
                            <div className="text-[10px] text-slate-500 truncate max-w-[150px]" title={p.nombreSilaboOrigen || ''}>
                              {p.nombreSilaboOrigen || 'Acreditado por Dirección'}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Diseño Curricular Original
                          </span>
                        )}
                      </td>

                      {/* Docente Designado */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {p.nombreDocente ? p.nombreDocente.charAt(0).toUpperCase() : 'D'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block text-xs">
                              {p.nombreDocente}
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate max-w-[130px]">
                              {p.docenteEspecialidad || 'Especialista en Capacitación'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Carga Horaria */}
                      <td className="py-3.5 px-3 text-center font-mono">
                        <div className="font-bold text-slate-900 text-xs">
                          {p.horasClase} hrs
                        </div>
                        <div className="text-[9px] text-slate-500">
                          {horasT}h T / {horasP}h P
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          {p.modalidad || 'Virtual Sincrónica'}
                        </div>
                      </td>

                      {/* Honorarios Docente */}
                      <td className="py-3.5 px-3 text-center font-mono">
                        <span className="font-bold text-slate-800 block text-xs">
                          {formatearMoneda(p.tarifaHoraDocente || 200, moneda)}/hr
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold block">
                          Total: {formatearMoneda(p.costoDocenteCalculado, moneda)}
                        </span>
                      </td>

                      {/* Régimen SAR */}
                      <td className="py-3.5 px-3 text-center">
                        {esAcreditado ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300" title="Exento de ISV por acreditación y convenio institucional">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Exento 0%
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300" title="Grava 15% ISV (Servicio educativo no acreditado)">
                            <ShieldAlert className="w-3 h-3 text-amber-600" />
                            Grava 15%
                          </span>
                        )}
                      </td>

                      {/* Flujo Institucional */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <WorkflowStatusBadge
                            proyecto={p}
                            onClick={onAbrirWorkflowStatusModal ? () => onAbrirWorkflowStatusModal(p.id) : undefined}
                          />
                          <span className="text-[9px] text-slate-500 font-mono">
                            {p.seLlevoACabo}
                          </span>
                        </div>
                      </td>

                      {/* ACCIONES DE GESTIÓN (INCLUYENDO BORRAR DESTACADO) */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                          {/* BOTÓN BORRAR PROYECTO (SOLICITADO EXPLÍCITAMENTE) */}
                          <button
                            type="button"
                            id={`btn-borrar-proyecto-${p.id}`}
                            onClick={() => setProyectoABorrar(p)}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer border border-rose-200 hover:border-rose-600"
                            title={`Eliminar el proyecto "${p.nombreProyecto}"`}
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Borrar</span>
                          </button>

                          {/* BOTÓN EDITAR */}
                          <button
                            type="button"
                            id={`btn-editar-proyecto-${p.id}`}
                            onClick={() => onEditarProyecto(p)}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer border border-blue-200 hover:border-blue-600"
                            title="Editar proyecto"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span className="hidden sm:inline">Editar</span>
                          </button>

                          {/* BOTÓN VER FICHA */}
                          <button
                            type="button"
                            onClick={() => onVerDetalle(p)}
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Ver ficha técnica completa"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* BOTÓN SYLLABUS PDF */}
                          {onAbrirSyllabusPDF && (
                            <button
                              type="button"
                              onClick={() => onAbrirSyllabusPDF(p)}
                              className="p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                              title="Generar Sílabo Oficial en PDF"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. MODAL DE CONFIRMACIÓN DE BORRADO INDIVIDUAL */}
      {proyectoABorrar && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div
            id="modal-confirmar-borrar-proyecto-academico"
            className="bg-white rounded-2xl shadow-2xl border border-rose-200 w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
          >
            {/* Header del modal */}
            <div className="px-5 py-4 border-b border-rose-100 flex items-center justify-between bg-rose-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-200 shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-950">
                    Eliminar Proyecto Académico
                  </h3>
                  <p className="text-[11px] text-rose-700">
                    Confirmación de eliminación irreversible
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProyectoABorrar(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-5 space-y-3.5 text-xs">
              <p className="text-slate-600 leading-relaxed">
                ¿Estás seguro de que deseas eliminar permanentemente este proyecto creado por la Gerencia Académica? Se removerá de la matriz general, de comercialización y de los reportes institucionales.
              </p>

              {/* Ficha resumen del proyecto a borrar */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                    {proyectoABorrar.codigoPrograma || `SUM-2026-${String(proyectoABorrar.numeroCorrelativo || proyectoABorrar.id).padStart(3, '0')}`}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded">
                    {proyectoABorrar.tipoProyecto}
                  </span>
                </div>

                <div className="font-black text-slate-900 text-sm">
                  {proyectoABorrar.nombreProyecto}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-200/70">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Docente:</span>
                    <span className="font-semibold">{proyectoABorrar.nombreDocente}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Carga Horaria:</span>
                    <span className="font-semibold font-mono">{proyectoABorrar.horasClase} horas</span>
                  </div>
                </div>

                {(proyectoABorrar.fechaHoraGrabacion || proyectoABorrar.fechaCreacion) && (
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Creado el: {proyectoABorrar.fechaHoraGrabacion || proyectoABorrar.fechaCreacion}</span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Atención:</strong> Esta operación no puede deshacerse. Si el proyecto ya fue compartido a Comercialización, también se dará de baja del flujo.
                </span>
              </div>
            </div>

            {/* Footer con botones de confirmación */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setProyectoABorrar(null)}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirmar-eliminar-proyecto-definitivo"
                onClick={handleConfirmarBorradoIndividual}
                className="px-4 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Eliminar Proyecto</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL DE CONFIRMACIÓN DE BORRADO MASIVO */}
      {mostrarModalBorradoMasivo && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div
            id="modal-confirmar-borrado-masivo"
            className="bg-white rounded-2xl shadow-2xl border border-rose-200 w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
          >
            <div className="px-5 py-4 border-b border-rose-100 flex items-center justify-between bg-rose-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-200 shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-950">
                    Borrar {selectedIds.size} Proyectos Seleccionados
                  </h3>
                  <p className="text-[11px] text-rose-700">
                    Acción en lote irreversible
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalBorradoMasivo(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <p className="text-slate-600 leading-relaxed">
                ¿Estás seguro de que deseas eliminar permanentemente los <strong>{selectedIds.size}</strong> proyectos seleccionados de la Gerencia Académica?
              </p>

              <div className="max-h-48 overflow-y-auto space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {Array.from(selectedIds).map((id) => {
                  const p = proyectos.find((item) => item.id === id);
                  if (!p) return null;
                  return (
                    <div key={id} className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 last:border-0">
                      <span className="font-semibold text-slate-800 truncate max-w-[280px]">
                        {p.nombreProyecto}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {p.codigoPrograma || `#${p.numeroCorrelativo}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 text-[11px] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  Esta acción eliminará todos los registros seleccionados de la matriz institucional y no podrán recuperarse.
                </span>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setMostrarModalBorradoMasivo(false)}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirmar-borrado-masivo-definitivo"
                onClick={handleConfirmarBorradoMasivo}
                className="px-4 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar {selectedIds.size} Proyectos</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
