import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  X,
  GraduationCap,
  Users,
  Layers,
  BookOpen,
  Award,
  Presentation,
  Flame,
  Sparkles,
  RotateCcw,
  Check,
  ChevronDown,
  Filter,
  SlidersHorizontal,
  FolderOpen
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../types';

export type CriterioBusqueda = 'todos' | 'nombre' | 'docente' | 'tipo';

export interface SmartProjectSearchBarProps {
  proyectos: ProyectoEducativo[];
  busqueda: string;
  onBusquedaChange: (valor: string) => void;
  filtroTipo: string;
  onFiltroTipoChange: (tipo: string) => void;
  filtroDocente: string;
  onFiltroDocenteChange: (docente: string) => void;
  filtroEstado?: string;
  onFiltroEstadoChange?: (estado: string) => void;
  totalFiltrados: number;
  onLimpiarFiltros: () => void;
  className?: string;
  placeholder?: string;
  moneda?: Moneda;
  criterioActivo?: CriterioBusqueda;
  onCriterioActivoChange?: (criterio: CriterioBusqueda) => void;
  mostrarFiltrosAvanzados?: boolean;
}

// Función para normalizar texto eliminando tildes y pasando a minúsculas
export const normalizarTexto = (texto: string = ''): string => {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

// Función para verificar coincidencia con soporte para múltiples tokens y prefijos
export const coincideBusquedaInteligente = (
  proyecto: ProyectoEducativo,
  query: string,
  criterio: CriterioBusqueda = 'todos'
): boolean => {
  if (!query || !query.trim()) return true;

  const queryNorm = normalizarTexto(query);

  // Soporte de prefijos especiales como "docente: ana" o "tipo: taller"
  if (queryNorm.startsWith('docente:')) {
    const val = queryNorm.replace('docente:', '').trim();
    return normalizarTexto(proyecto.nombreDocente).includes(val);
  }
  if (queryNorm.startsWith('tipo:')) {
    const val = queryNorm.replace('tipo:', '').trim();
    return normalizarTexto(proyecto.tipoProyecto).includes(val);
  }
  if (queryNorm.startsWith('nombre:') || queryNorm.startsWith('proyecto:')) {
    const val = queryNorm.replace(/^(nombre|proyecto):/, '').trim();
    return (
      normalizarTexto(proyecto.nombreProyecto).includes(val) ||
      normalizarTexto(proyecto.codigoPrograma || '').includes(val)
    );
  }

  const nombreNorm = normalizarTexto(proyecto.nombreProyecto);
  const docenteNorm = normalizarTexto(proyecto.nombreDocente);
  const tipoNorm = normalizarTexto(proyecto.tipoProyecto);
  const codigoNorm = normalizarTexto(proyecto.codigoPrograma || '');
  const observacionesNorm = normalizarTexto(proyecto.observaciones || '');
  const objetivoNorm = normalizarTexto(proyecto.objetivoGeneral || '');

  if (criterio === 'nombre') {
    return nombreNorm.includes(queryNorm) || codigoNorm.includes(queryNorm);
  }

  if (criterio === 'docente') {
    return docenteNorm.includes(queryNorm);
  }

  if (criterio === 'tipo') {
    return tipoNorm.includes(queryNorm);
  }

  // Búsqueda Global (criterio === 'todos') con soporte multi-token
  const tokens = queryNorm.split(/\s+/).filter(Boolean);
  return tokens.every((token) => {
    return (
      nombreNorm.includes(token) ||
      docenteNorm.includes(token) ||
      tipoNorm.includes(token) ||
      codigoNorm.includes(token) ||
      observacionesNorm.includes(token) ||
      objetivoNorm.includes(token)
    );
  });
};

export const SmartProjectSearchBar: React.FC<SmartProjectSearchBarProps> = ({
  proyectos,
  busqueda,
  onBusquedaChange,
  filtroTipo,
  onFiltroTipoChange,
  filtroDocente,
  onFiltroDocenteChange,
  filtroEstado = 'todos',
  onFiltroEstadoChange,
  totalFiltrados,
  onLimpiarFiltros,
  className = '',
  placeholder = 'Buscar por nombre de curso, docente o tipo de programa...',
  criterioActivo: criterioProp,
  onCriterioActivoChange: onCriterioChangeProp,
  mostrarFiltrosAvanzados = true,
}) => {
  const [criterioLocal, setCriterioLocal] = useState<CriterioBusqueda>('todos');
  const criterio = criterioProp !== undefined ? criterioProp : criterioLocal;
  const setCriterio = onCriterioChangeProp || setCriterioLocal;

  const [mostrarSugerencias, setMostrarSugerencias] = useState<boolean>(false);
  const [menuDocentesAbierto, setMenuDocentesAbierto] = useState<boolean>(false);
  const [busquedaDocenteInput, setBusquedaDocenteInput] = useState<string>('');

  const contenedorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickAfuera = (event: MouseEvent) => {
      if (contenedorRef.current && !contenedorRef.current.contains(event.target as Node)) {
        setMostrarSugerencias(false);
        setMenuDocentesAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickAfuera);
    return () => document.removeEventListener('mousedown', handleClickAfuera);
  }, []);

  // Lista única de docentes con su conteo de proyectos
  const docentesConConteo = useMemo(() => {
    const mapa = new Map<string, number>();
    proyectos.forEach((p) => {
      const doc = p.nombreDocente?.trim();
      if (doc) {
        mapa.set(doc, (mapa.get(doc) || 0) + 1);
      }
    });

    return Array.from(mapa.entries())
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad || a.nombre.localeCompare(b.nombre));
  }, [proyectos]);

  // Conteo dinámico por tipo de proyecto
  const conteoPorTipo = useMemo(() => {
    const conteos: Record<string, number> = {
      todos: proyectos.length,
      CURSO: 0,
      TALLER: 0,
      DIPLOMADO: 0,
      BOOTCAMP: 0,
      MASTERCLASS: 0,
      SEMINARIO: 0,
    };

    proyectos.forEach((p) => {
      const pTipo = (p.tipoProyecto || '').toUpperCase();
      if (pTipo.includes('CURSO') || pTipo.includes('EDUCATIVOS NO ACREDITADOS')) conteos.CURSO++;
      if (pTipo.includes('TALLER')) conteos.TALLER++;
      if (pTipo.includes('DIPLOMADO')) conteos.DIPLOMADO++;
      if (pTipo.includes('BOOTCAMP')) conteos.BOOTCAMP++;
      if (pTipo.includes('MASTERCLASS')) conteos.MASTERCLASS++;
      if (pTipo.includes('SEMINARIO')) conteos.SEMINARIO++;
    });

    return conteos;
  }, [proyectos]);

  // Tipos disponibles para chips rápidos
  const tiposFiltro = [
    { id: 'todos', label: 'Todos los Tipos', icon: Layers, count: conteoPorTipo.todos },
    { id: 'CURSO', label: 'Cursos', icon: BookOpen, count: conteoPorTipo.CURSO },
    { id: 'TALLER', label: 'Talleres', icon: Presentation, count: conteoPorTipo.TALLER },
    { id: 'DIPLOMADO', label: 'Diplomados', icon: Award, count: conteoPorTipo.DIPLOMADO },
    { id: 'BOOTCAMP', label: 'Bootcamps', icon: Flame, count: conteoPorTipo.BOOTCAMP },
    { id: 'MASTERCLASS', label: 'Masterclasses', icon: Sparkles, count: conteoPorTipo.MASTERCLASS },
    { id: 'SEMINARIO', label: 'Seminarios', icon: GraduationCap, count: conteoPorTipo.SEMINARIO },
  ].filter((t) => t.id === 'todos' || t.count > 0);

  // Sugerencias inteligentes mientras escribe
  const sugerencias = useMemo(() => {
    const query = normalizarTexto(busqueda);
    if (!query || query.length < 1) {
      return { proyectos: [], docentes: [], tipos: [] };
    }

    // Proyectos coincidentes (máx 5)
    const proyectosMatch = proyectos
      .filter((p) => normalizarTexto(p.nombreProyecto).includes(query) || normalizarTexto(p.codigoPrograma || '').includes(query))
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        nombre: p.nombreProyecto,
        docente: p.nombreDocente,
        tipo: p.tipoProyecto,
        codigo: p.codigoPrograma || ''
      }));

    // Docentes coincidentes (máx 4)
    const docentesMatch = docentesConConteo
      .filter((d) => normalizarTexto(d.nombre).includes(query))
      .slice(0, 4);

    // Tipos de curso coincidentes
    const tiposMatch = tiposFiltro
      .filter((t) => t.id !== 'todos' && normalizarTexto(t.label).includes(query))
      .slice(0, 3);

    return {
      proyectos: proyectosMatch,
      docentes: docentesMatch,
      tipos: tiposMatch,
    };
  }, [busqueda, proyectos, docentesConConteo, tiposFiltro]);

  const haySugerencias =
    sugerencias.proyectos.length > 0 ||
    sugerencias.docentes.length > 0 ||
    sugerencias.tipos.length > 0;

  const hayFiltrosActivos = Boolean(
    busqueda.trim() !== '' ||
    filtroTipo !== 'todos' ||
    filtroDocente !== 'todos' ||
    (filtroEstado && filtroEstado !== 'todos') ||
    criterio !== 'todos'
  );

  return (
    <div
      ref={contenedorRef}
      id="smart-project-search-bar"
      className={`bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 sm:p-4 transition-all space-y-3 relative ${className}`}
    >
      {/* 1. FILA PRINCIPAL: INPUT DE BÚSQUEDA INTELIGENTE + SELECTOR DE CRITERIO */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
        
        {/* Contenedor del Input con Autocomplete */}
        <div className="relative flex-1">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-purple-600 absolute left-3.5 pointer-events-none" />
            <input
              ref={inputRef}
              id="input-smart-search-projects"
              type="text"
              value={busqueda}
              onChange={(e) => {
                onBusquedaChange(e.target.value);
                setMostrarSugerencias(true);
              }}
              onFocus={() => {
                if (busqueda.trim().length > 0) setMostrarSugerencias(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setMostrarSugerencias(false);
                }
              }}
              placeholder={placeholder}
              className="w-full pl-10 pr-9 py-2.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-300 focus:border-purple-600 rounded-xl font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all shadow-2xs"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => {
                  onBusquedaChange('');
                  setMostrarSugerencias(false);
                  inputRef.current?.focus();
                }}
                className="absolute right-3 w-5 h-5 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                title="Borrar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* MENÚ FLOTANTE DE SUGERENCIAS INTELIGENTES (AUTOCOMPLETE) */}
          {mostrarSugerencias && haySugerencias && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
              
              {/* Sugerencias de Proyectos */}
              {sugerencias.proyectos.length > 0 && (
                <div className="p-2 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FolderOpen className="w-3 h-3 text-purple-600" />
                    <span>Cursos y Programas</span>
                  </div>
                  {sugerencias.proyectos.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        onBusquedaChange(p.nombre);
                        setMostrarSugerencias(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-purple-50 flex items-center justify-between text-xs text-slate-800 transition-colors group cursor-pointer"
                    >
                      <div className="truncate">
                        <span className="font-semibold text-slate-900 group-hover:text-purple-900">
                          {p.nombre}
                        </span>
                        <div className="text-[10px] text-slate-500 truncate flex items-center gap-2">
                          {p.codigo && <span className="font-mono text-purple-700 font-bold">{p.codigo}</span>}
                          <span>Docente: {p.docente}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-purple-700 bg-purple-100/70 px-1.5 py-0.5 rounded shrink-0 ml-2">
                        {p.tipo}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Sugerencias de Docentes */}
              {sugerencias.docentes.length > 0 && (
                <div className="p-2 space-y-1 bg-slate-50/50">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-blue-600" />
                    <span>Docentes Asignados</span>
                  </div>
                  {sugerencias.docentes.map((d) => (
                    <button
                      key={d.nombre}
                      type="button"
                      onClick={() => {
                        onFiltroDocenteChange(d.nombre);
                        onBusquedaChange('');
                        setMostrarSugerencias(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-blue-50 flex items-center justify-between text-xs text-slate-800 transition-colors cursor-pointer group"
                    >
                      <span className="font-medium text-slate-900 group-hover:text-blue-900">
                        {d.nombre}
                      </span>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full shrink-0">
                        {d.cantidad} {d.cantidad === 1 ? 'proyecto' : 'proyectos'}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Sugerencias de Tipos */}
              {sugerencias.tipos.length > 0 && (
                <div className="p-2 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="w-3 h-3 text-emerald-600" />
                    <span>Tipo de Programa</span>
                  </div>
                  {sugerencias.tipos.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        onFiltroTipoChange(t.id);
                        onBusquedaChange('');
                        setMostrarSugerencias(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 flex items-center justify-between text-xs text-slate-800 transition-colors cursor-pointer group"
                    >
                      <span className="font-semibold text-slate-900 group-hover:text-emerald-900">
                        {t.label}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                        {t.count} disponibles
                      </span>
                    </button>
                  ))}
                </div>
              )}

            </div>
          )}
        </div>

        {/* Criterio de Búsqueda Rápida: [Todos] [Nombre] [Docente] [Tipo] */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 text-xs overflow-x-auto">
          <span className="text-[10px] font-bold text-slate-500 uppercase px-1.5 hidden sm:inline">
            Campo:
          </span>
          <button
            type="button"
            onClick={() => setCriterio('todos')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              criterio === 'todos'
                ? 'bg-purple-900 text-white shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setCriterio('nombre')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              criterio === 'nombre'
                ? 'bg-purple-900 text-white shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Nombre
          </button>
          <button
            type="button"
            onClick={() => setCriterio('docente')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              criterio === 'docente'
                ? 'bg-purple-900 text-white shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Docente
          </button>
          <button
            type="button"
            onClick={() => setCriterio('tipo')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              criterio === 'tipo'
                ? 'bg-purple-900 text-white shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Tipo
          </button>
        </div>

        {/* Contador y Limpiador */}
        <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              <strong className="text-slate-900 font-bold font-mono">{totalFiltrados}</strong> de {proyectos.length}
            </span>
          </div>

          {hayFiltrosActivos && (
            <button
              type="button"
              onClick={onLimpiarFiltros}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
              title="Restablecer todos los filtros"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Restablecer</span>
            </button>
          )}
        </div>

      </div>

      {/* 2. CHIPS RÁPIDOS POR TIPO DE CURSO */}
      {mostrarFiltrosAvanzados && (
        <div className="pt-2 border-t border-slate-100 space-y-2">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            
            {/* Chips por Tipo de Curso */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 hidden md:inline">
                Filtrar Tipo:
              </span>
              {tiposFiltro.map((tipo) => {
                const esActivo = filtroTipo === tipo.id;
                const Icono = tipo.icon;

                return (
                  <button
                    key={tipo.id}
                    type="button"
                    onClick={() => onFiltroTipoChange(tipo.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                      esActivo
                        ? 'bg-purple-900 text-white shadow-xs border border-purple-950 font-bold ring-2 ring-purple-400/30'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    <Icono className={`w-3.5 h-3.5 ${esActivo ? 'text-purple-200' : 'text-slate-500'}`} />
                    <span>{tipo.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        esActivo
                          ? 'bg-purple-700 text-white'
                          : 'bg-slate-200/80 text-slate-700'
                      }`}
                    >
                      {tipo.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Menú Desplegable de Docentes */}
            {docentesConConteo.length > 0 && (
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setMenuDocentesAbierto(!menuDocentesAbierto)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    filtroDocente !== 'todos'
                      ? 'bg-blue-50 text-blue-800 border-blue-300 font-bold'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span className="max-w-[130px] truncate">
                    {filtroDocente === 'todos' ? 'Filtrar Docente' : filtroDocente}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {menuDocentesAbierto && (
                  <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl border border-slate-200 shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                    <input
                      type="text"
                      placeholder="Buscar docente..."
                      value={busquedaDocenteInput}
                      onChange={(e) => setBusquedaDocenteInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 mb-1"
                    />
                    <div className="max-h-48 overflow-y-auto space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          onFiltroDocenteChange('todos');
                          setMenuDocentesAbierto(false);
                          setBusquedaDocenteInput('');
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer ${
                          filtroDocente === 'todos' ? 'bg-blue-100 text-blue-900 font-bold' : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span>Todos los Docentes</span>
                        {filtroDocente === 'todos' && <Check className="w-3 h-3 text-blue-700" />}
                      </button>

                      {docentesConConteo
                        .filter((d) => normalizarTexto(d.nombre).includes(normalizarTexto(busquedaDocenteInput)))
                        .map((d) => (
                          <button
                            key={d.nombre}
                            type="button"
                            onClick={() => {
                              onFiltroDocenteChange(d.nombre);
                              setMenuDocentesAbierto(false);
                              setBusquedaDocenteInput('');
                            }}
                            className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer ${
                              filtroDocente === d.nombre ? 'bg-blue-100 text-blue-900 font-bold' : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <span className="truncate pr-2">{d.nombre}</span>
                            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-200/70 px-1.5 py-0.2 rounded-full">
                              {d.cantidad}
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* 3. TAGS ACTIVOS SI HAY FILTROS APLICADOS */}
          {hayFiltrosActivos && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Filtros Activos:
              </span>

              {busqueda && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-50 text-purple-900 border border-purple-200 text-[11px] font-medium">
                  <span>Búsqueda: <strong className="font-bold">"{busqueda}"</strong></span>
                  <button
                    type="button"
                    onClick={() => onBusquedaChange('')}
                    className="hover:text-purple-700 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {filtroTipo !== 'todos' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-[11px] font-medium">
                  <span>Tipo: <strong className="font-bold">{filtroTipo}</strong></span>
                  <button
                    type="button"
                    onClick={() => onFiltroTipoChange('todos')}
                    className="hover:text-emerald-700 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {filtroDocente !== 'todos' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 text-[11px] font-medium">
                  <span>Docente: <strong className="font-bold">{filtroDocente}</strong></span>
                  <button
                    type="button"
                    onClick={() => onFiltroDocenteChange('todos')}
                    className="hover:text-blue-700 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {filtroEstado && filtroEstado !== 'todos' && onFiltroEstadoChange && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-medium">
                  <span>Estado: <strong className="font-bold">{filtroEstado}</strong></span>
                  <button
                    type="button"
                    onClick={() => onFiltroEstadoChange('todos')}
                    className="hover:text-amber-700 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {criterio !== 'todos' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-300 text-[11px] font-medium">
                  <span>Campo: <strong className="font-bold uppercase">{criterio}</strong></span>
                  <button
                    type="button"
                    onClick={() => setCriterio('todos')}
                    className="hover:text-slate-900 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
