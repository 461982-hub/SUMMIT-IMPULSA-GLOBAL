import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Search, 
  Filter, 
  BookOpen, 
  UserCheck, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Calendar, 
  Clock, 
  AlertCircle, 
  Send, 
  Sparkles,
  Award,
  Receipt,
  Rocket
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { formatearMoneda } from '../../utils/calculations';

interface ExecutiveSyllabusReviewViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onVerFichaCompleta: (p: ProyectoEducativo) => void;
  onAprobarViabilidad: (p: ProyectoEducativo) => void;
  onRechazarProyecto: (p: ProyectoEducativo) => void;
  onAbrirAjusteFinanciero?: (p: ProyectoEducativo) => void;
  onAbrirComercializarProyecto?: (proyectoId?: string) => void;
}

export const ExecutiveSyllabusReviewView: React.FC<ExecutiveSyllabusReviewViewProps> = ({
  proyectos,
  moneda,
  onVerFichaCompleta,
  onAprobarViabilidad,
  onRechazarProyecto,
  onAbrirAjusteFinanciero,
  onAbrirComercializarProyecto,
}) => {
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pendientes' | 'corregidos' | 'rechazados' | 'aprobados'>('pendientes');
  const [busqueda, setBusqueda] = useState('');

  // Proyectos categorizados
  const pendientes = useMemo(() => {
    return proyectos.filter(
      p => p.etapaFlujo === 'revision_gerencia_general' || 
           (!p.aprobadoPorGerenciaGeneralPrevia && !p.rechazadoPorGerenciaGeneral && (p.seLlevoACabo === 'Planificado' || p.seLlevoACabo === 'En proceso'))
    );
  }, [proyectos]);

  const corregidos = useMemo(() => {
    return proyectos.filter(
      p => p.etapaFlujo === 'revision_gerencia_general' && p.corregidoReenviadoRevisionGG
    );
  }, [proyectos]);

  const rechazados = useMemo(() => {
    return proyectos.filter(
      p => p.etapaFlujo === 'rechazado_gerencia_general' || p.rechazadoPorGerenciaGeneral === true
    );
  }, [proyectos]);

  const aprobados = useMemo(() => {
    return proyectos.filter(
      p => p.etapaFlujo === 'comercializacion' || p.aprobadoPorGerenciaGeneralPrevia === true
    );
  }, [proyectos]);

  const proyectosFiltrados = useMemo(() => {
    return proyectos.filter(p => {
      // Filtro por estado
      if (filtroEstado === 'pendientes') {
        const esPendiente = p.etapaFlujo === 'revision_gerencia_general' || 
          (!p.aprobadoPorGerenciaGeneralPrevia && !p.rechazadoPorGerenciaGeneral && (p.seLlevoACabo === 'Planificado' || p.seLlevoACabo === 'En proceso'));
        if (!esPendiente) return false;
      } else if (filtroEstado === 'corregidos') {
        if (!(p.etapaFlujo === 'revision_gerencia_general' && p.corregidoReenviadoRevisionGG)) return false;
      } else if (filtroEstado === 'rechazados') {
        const esRechazado = p.etapaFlujo === 'rechazado_gerencia_general' || p.rechazadoPorGerenciaGeneral === true;
        if (!esRechazado) return false;
      } else if (filtroEstado === 'aprobados') {
        const esAprobado = p.etapaFlujo === 'comercializacion' || p.aprobadoPorGerenciaGeneralPrevia === true;
        if (!esAprobado) return false;
      }

      // Búsqueda
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        const coincide = 
          p.nombreProyecto.toLowerCase().includes(q) ||
          p.nombreDocente.toLowerCase().includes(q) ||
          (p.codigoProyecto && p.codigoProyecto.toLowerCase().includes(q)) ||
          (p.codigoPrograma && p.codigoPrograma.toLowerCase().includes(q));
        if (!coincide) return false;
      }

      return true;
    });
  }, [proyectos, filtroEstado, busqueda]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner de Ciclo de Gobernanza Institucional */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-xl border border-purple-800/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-purple-300" />
                <span>Ciclo Institucional Summit</span>
              </span>
              <span className="text-xs text-purple-200/80">Académica → Gerencia General → Comercialización</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white mt-1 flex items-center gap-2">
              <span>Revisión y Aprobación de Fichas de Sílabos y Proyectos</span>
            </h2>
            <p className="text-xs text-purple-200/90 mt-1 max-w-3xl leading-relaxed">
              Consulte la ficha pedagógica y financiera completa de cada sílabo formulado por Gerencia Académica. Valide el costeo (honorarios docentes, Zoom, papelería, gastos varios y el precio sugerido con 15% de ISV ya sumado). Apruebe para trasladar a Comercialización o devuelva a Académica con la razón específica para su corrección.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-purple-900/60 p-2.5 rounded-xl border border-purple-500/30 shrink-0">
            <div className="text-right">
              <span className="text-[10px] text-purple-300 uppercase font-bold block">Pendientes GG</span>
              <span className="text-xl font-black text-amber-300 font-mono">{pendientes.length}</span>
            </div>
            <div className="w-px h-8 bg-purple-700 mx-1" />
            <div className="text-right">
              <span className="text-[10px] text-purple-300 uppercase font-bold block">Aprobados Comercial</span>
              <span className="text-xl font-black text-emerald-300 font-mono">{aprobados.length}</span>
            </div>
          </div>
        </div>

        {/* Pestañas de Filtrado */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-purple-800/70">
          <button
            type="button"
            onClick={() => setFiltroEstado('pendientes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filtroEstado === 'pendientes'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'bg-white/10 hover:bg-white/20 text-purple-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>⏳ Pendientes de Revisión ({pendientes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroEstado('corregidos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filtroEstado === 'corregidos'
                ? 'bg-indigo-500 text-white shadow-md font-black ring-2 ring-indigo-300'
                : 'bg-white/10 hover:bg-white/20 text-purple-100'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>🔄 Corregidos por Académica ({corregidos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroEstado('rechazados')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filtroEstado === 'rechazados'
                ? 'bg-rose-600 text-white shadow-md font-black ring-2 ring-rose-400'
                : 'bg-white/10 hover:bg-white/20 text-purple-100'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>❌ Rechazados por GG ({rechazados.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroEstado('aprobados')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filtroEstado === 'aprobados'
                ? 'bg-emerald-500 text-white shadow-md font-black ring-2 ring-emerald-300'
                : 'bg-white/10 hover:bg-white/20 text-purple-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>✅ En Comercialización ({aprobados.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroEstado('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filtroEstado === 'todos'
                ? 'bg-white text-slate-900 shadow-md font-black'
                : 'bg-white/10 hover:bg-white/20 text-purple-100'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Todos ({proyectos.length})</span>
          </button>
        </div>
      </div>

      {/* Buscador de Sílabos */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar sílabo por título, docente, código SIG-ACAD..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>
        <span className="text-xs text-slate-500 font-bold px-2">
          Mostrando {proyectosFiltrados.length} programas
        </span>
      </div>

      {/* Lista de Fichas de Sílabos */}
      {proyectosFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No se encontraron sílabos en esta vista</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {busqueda
              ? 'Pruebe con otros términos de búsqueda.'
              : filtroEstado === 'pendientes'
              ? '¡Excelente! No hay sílabos pendientes de dictamen en este momento.'
              : filtroEstado === 'rechazados'
              ? 'No hay proyectos en estado de rechazo o devolución actualmente.'
              : 'Seleccione otra categoría en los filtros superiores.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {proyectosFiltrados.map((p) => {
            const esPendiente = p.etapaFlujo === 'revision_gerencia_general' || (!p.aprobadoPorGerenciaGeneralPrevia && !p.rechazadoPorGerenciaGeneral);
            const esRechazado = p.etapaFlujo === 'rechazado_gerencia_general' || p.rechazadoPorGerenciaGeneral;
            const esCorregido = p.corregidoReenviadoRevisionGG && p.etapaFlujo === 'revision_gerencia_general';
            const esAprobado = p.etapaFlujo === 'comercializacion' || p.aprobadoPorGerenciaGeneralPrevia;

            // Precio sugerido con ISV
            const precioBase = p.precioSugeridoVenta || 0;
            const isvTasa = p.aplicaISV !== false ? 0.15 : 0;
            const precioConISV = p.precioSugeridoConISV || (precioBase * (1 + isvTasa));

            return (
              <div
                key={p.id}
                className={`bg-white rounded-2xl border transition-all hover:shadow-lg flex flex-col justify-between overflow-hidden ${
                  esRechazado
                    ? 'border-rose-300 ring-1 ring-rose-200'
                    : esCorregido
                    ? 'border-indigo-400 ring-2 ring-indigo-300 shadow-md'
                    : esPendiente
                    ? 'border-amber-300 ring-1 ring-amber-200'
                    : 'border-slate-200'
                }`}
              >
                {/* Cabecera de la Tarjeta */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 text-[10px] font-mono font-bold">
                      {p.codigoProyecto || p.codigoPrograma || 'SIG-ACAD-2026'}
                    </span>

                    {/* Estado del Flujo */}
                    {esRechazado ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300 text-[10px] font-bold flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        <span>Rechazado por GG</span>
                      </span>
                    ) : esCorregido ? (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300 text-[10px] font-black flex items-center gap-1 animate-pulse">
                        <RotateCcw className="w-3 h-3 text-indigo-600" />
                        <span>Corregido por Académica</span>
                      </span>
                    ) : esAprobado ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Aprobado GG: Dr. Walter Rene Pedroza</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Pendiente Revisión GG</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-900 leading-snug line-clamp-2" title={p.nombreProyecto}>
                      {p.nombreProyecto}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700">{p.modalidad || 'Online'}</span>
                      <span>•</span>
                      <span>{p.horasTotales || p.duracionHoras || 0} horas académicas</span>
                    </div>
                  </div>

                  {/* Banner de Razón de Rechazo */}
                  {esRechazado && p.motivoRechazoGerenciaGeneral && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-xs space-y-1">
                      <span className="text-[10px] font-bold text-rose-800 uppercase flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-600" />
                        Razón del Rechazo Registrada:
                      </span>
                      <p className="text-[11px] text-rose-900 italic leading-relaxed">
                        "{p.motivoRechazoGerenciaGeneral}"
                      </p>
                    </div>
                  )}

                  {/* Banner de Reenvío Corregido */}
                  {esCorregido && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-2.5 text-xs text-indigo-900 space-y-0.5">
                      <span className="text-[10px] font-black uppercase text-indigo-800 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        Subsanado por Gerencia Académica
                      </span>
                      <p className="text-[11px] leading-relaxed">
                        Académica ajustó los costos/tarifa y lo reenvió a Gerencia General para su aprobación final.
                      </p>
                    </div>
                  )}

                  {/* Datos del Docente & Horas */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                        Docente:
                      </span>
                      <span className="font-bold text-slate-800">{p.nombreDocente || 'Por asignar'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Tarifa por Hora:</span>
                      <span className="font-mono font-bold text-slate-700">
                        {formatearMoneda(p.pagoPorHoraDocente || 0, moneda)}/h
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Honorarios Docente Totales:</span>
                      <span className="font-mono font-bold text-indigo-900">
                        {formatearMoneda(p.costoTotalDocente || 0, moneda)}
                      </span>
                    </div>
                  </div>

                  {/* Estructura Financiera de la Ficha */}
                  <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 text-[11px]">Costos Operativos Totales:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatearMoneda(p.gastoTotalOperativo || 0, moneda)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-600">Punto de Equilibrio:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {p.puntoEquilibrioAlumnos || 0} alumnos
                      </span>
                    </div>

                    {/* PRECIO SUGERIDO CON ISV 15% SUMADO */}
                    <div className="pt-2 border-t border-purple-200/70 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase text-purple-900 block flex items-center gap-1">
                          <Receipt className="w-3 h-3 text-purple-700" />
                          Precio Sugerido Final
                        </span>
                        <span className="text-[9px] text-purple-700">
                          {p.aplicaISV !== false ? '(Incluye ISV 15%)' : '(Exento ISV)'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black font-mono text-purple-950">
                          {formatearMoneda(precioConISV, moneda)}
                        </span>
                        {p.aplicaISV !== false && (
                          <span className="text-[9px] text-slate-500 block font-mono">
                            Base: {formatearMoneda(precioBase, moneda)} + ISV {formatearMoneda(precioConISV - precioBase, moneda)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Barra de Acciones de Gerencia General */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2">
                  {esAprobado && (
                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-800 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Aprobado por Gerencia General. Dr. Walter Rene Pedroza</span>
                    </div>
                  )}

                  {/* Botón Principal: Ver Ficha Completa del Sílabo */}
                  <button
                    type="button"
                    id={`btn-ver-ficha-completa-${p.id}`}
                    onClick={() => onVerFichaCompleta(p)}
                    className="w-full py-2 bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    title="Ver la Ficha Completa del Sílabo Oficial con objetivos, temas, régimen fiscal, costos y firmas"
                  >
                    <FileText className="w-3.5 h-3.5 text-purple-200" />
                    <span>📄 Ver Ficha Completa del Sílabo</span>
                  </button>

                  {/* Acciones de Decisión */}
                  {esAprobado ? (
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        id={`btn-comercializar-syllabus-${p.id}`}
                        onClick={() => (onAbrirComercializarProyecto ? onAbrirComercializarProyecto(p.id) : onAprobarViabilidad(p))}
                        className="w-full py-2 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 text-slate-950 rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01] border border-emerald-300 cursor-pointer"
                        title="Procesos cumplidos: Comercializar Sílabo / Proyecto (Redes Sociales, Matrícula, Precios, Embudo)"
                      >
                        <Rocket className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                        <span>Comercializar Sílabo/Proyecto</span>
                      </button>
                      <div className="flex items-center justify-between text-[11px] px-1 text-slate-400">
                        <button
                          type="button"
                          onClick={() => onAprobarViabilidad(p)}
                          className="hover:text-emerald-700 underline cursor-pointer"
                        >
                          Revisar dictamen
                        </button>
                        <button
                          type="button"
                          onClick={() => onRechazarProyecto(p)}
                          className="hover:text-rose-700 underline cursor-pointer"
                        >
                          Reconsiderar rechazo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        id={`btn-aprobar-gg-card-${p.id}`}
                        onClick={() => onAprobarViabilidad(p)}
                        className="py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                        title="Aprobar y trasladar formalmente a Gerencia de Comercialización para venta"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Aprobar Sílabo/Proyecto</span>
                      </button>

                      <button
                        type="button"
                        id={`btn-rechazar-gg-card-${p.id}`}
                        onClick={() => onRechazarProyecto(p)}
                        className={`py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                          esRechazado
                            ? 'bg-rose-100 text-rose-900 border border-rose-300'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                        title="Rechazar y regresar a Gerencia Académica con la razón específica"
                      >
                        <XCircle className="w-3 h-3 text-rose-600" />
                        <span>{esRechazado ? 'Actualizar Rechazo' : 'Rechazar Sílabo'}</span>
                      </button>
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
