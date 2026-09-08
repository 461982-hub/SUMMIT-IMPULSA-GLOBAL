import React, { useState, useMemo } from 'react';
import { 
  Scale, 
  ArrowLeftRight, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Sparkles, 
  DollarSign, 
  Users, 
  BookOpen, 
  Clock, 
  ShieldCheck, 
  FileSpreadsheet, 
  FileText, 
  X, 
  Search, 
  Filter, 
  Layers, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Cloud, 
  Loader2,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { formatearMoneda } from '../../utils/calculations';
import { 
  obtenerDiagnosticoComparativo,
  exportarComparativaProyectosExcel,
  exportarComparativaProyectosPDF 
} from '../../utils/comparisonExportUtils';

interface ProjectsSideBySideComparisonProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  isDriveConnected?: boolean;
  onNotificar?: (mensaje: string) => void;
  onVerProyectoDetalle?: (proyecto: ProyectoEducativo) => void;
}

export const ProjectsSideBySideComparison: React.FC<ProjectsSideBySideComparisonProps> = ({
  proyectos,
  moneda,
  isDriveConnected = false,
  onNotificar,
  onVerProyectoDetalle,
}) => {
  // Estado de proyectos seleccionados (IDs)
  const [seleccionadosIds, setSeleccionadosIds] = useState<string[]>(() => {
    // Por defecto preseleccionar los 3 primeros proyectos o los 2 más representativos
    if (proyectos.length >= 3) {
      return [proyectos[0].id, proyectos[1].id, proyectos[2].id];
    }
    return proyectos.slice(0, 2).map((p) => p.id);
  });

  // Filtros en el selector de proyectos
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroDocente, setFiltroDocente] = useState<string>('todos');
  const [selectorAbierto, setSelectorAbierto] = useState(false);

  // Opciones de visualización
  const [resaltarMejor, setResaltarMejor] = useState(true);
  const [mostrarBenchmark, setMostrarBenchmark] = useState(true);

  // Estado de exportación
  const [exportando, setExportando] = useState<'excel' | 'pdf' | null>(null);

  // Lista de proyectos seleccionados en orden
  const proyectosSeleccionados = useMemo(() => {
    return seleccionadosIds
      .map((id) => proyectos.find((p) => p.id === id))
      .filter((p): p is ProyectoEducativo => p !== undefined);
  }, [seleccionadosIds, proyectos]);

  // Lista de tipos de proyectos y docentes únicos para filtros
  const tiposUnicos = useMemo(() => {
    const setTipos = new Set<string>();
    proyectos.forEach((p) => {
      if (p.tipoProyecto) setTipos.add(p.tipoProyecto);
    });
    return Array.from(setTipos);
  }, [proyectos]);

  const docentesUnicos = useMemo(() => {
    const setDocentes = new Set<string>();
    proyectos.forEach((p) => {
      if (p.nombreDocente) setDocentes.add(p.nombreDocente);
    });
    return Array.from(setDocentes);
  }, [proyectos]);

  // Proyectos disponibles para seleccionar filtrados
  const proyectosDisponibles = useMemo(() => {
    return proyectos.filter((p) => {
      const matchBusqueda =
        busqueda === '' ||
        p.nombreProyecto.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.nombreDocente.toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.codigoPrograma && p.codigoPrograma.toLowerCase().includes(busqueda.toLowerCase()));

      const matchTipo = filtroTipo === 'todos' || p.tipoProyecto === filtroTipo;
      const matchDocente = filtroDocente === 'todos' || p.nombreDocente === filtroDocente;

      return matchBusqueda && matchTipo && matchDocente;
    });
  }, [proyectos, busqueda, filtroTipo, filtroDocente]);

  // Toggle selección de un proyecto
  const toggleSeleccion = (id: string) => {
    setSeleccionadosIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const quitarSeleccion = (id: string) => {
    setSeleccionadosIds((prev) => prev.filter((item) => item !== id));
  };

  // Presets de selección rápida
  const aplicarPreset = (preset: 'top3' | 'activos' | 'riesgo' | 'mismoTipo' | 'limpiar') => {
    if (preset === 'limpiar') {
      setSeleccionadosIds([]);
      return;
    }

    if (preset === 'top3') {
      const ordenados = [...proyectos].sort((a, b) => {
        const margenA = a.ingresoRealTotal > 0 ? (a.totalGananciasFinales / a.ingresoRealTotal) : 0;
        const margenB = b.ingresoRealTotal > 0 ? (b.totalGananciasFinales / b.ingresoRealTotal) : 0;
        return margenB - margenA;
      });
      setSeleccionadosIds(ordenados.slice(0, 3).map((p) => p.id));
      onNotificar?.('Seleccionados los 3 programas con mayor margen real');
      return;
    }

    if (preset === 'activos') {
      const activos = proyectos.filter((p) => p.seLlevoACabo === 'Sí' || p.seLlevoACabo === 'En curso' || p.seLlevoACabo === 'Listo');
      setSeleccionadosIds(activos.slice(0, 4).map((p) => p.id));
      onNotificar?.(`Seleccionados programas en estado activo/realizado`);
      return;
    }

    if (preset === 'riesgo') {
      const riesgo = proyectos.filter((p) => {
        const margen = p.ingresoRealTotal > 0 ? (p.totalGananciasFinales / p.ingresoRealTotal) * 100 : 0;
        return margen < 25 || p.alumnosFinal < p.puntoEquilibrioAlumnos;
      });
      if (riesgo.length > 0) {
        setSeleccionadosIds(riesgo.slice(0, 3).map((p) => p.id));
        onNotificar?.('Seleccionados programas con alertas o margen bajo');
      } else {
        onNotificar?.('No se detectaron programas en riesgo crítico');
      }
      return;
    }

    if (preset === 'mismoTipo') {
      if (proyectosSeleccionados.length > 0) {
        const tipoBase = proyectosSeleccionados[0].tipoProyecto;
        const coincidentes = proyectos.filter((p) => p.tipoProyecto === tipoBase);
        setSeleccionadosIds(coincidentes.slice(0, 4).map((p) => p.id));
        onNotificar?.(`Seleccionados programas similares de tipo: ${tipoBase}`);
      } else if (tiposUnicos.length > 0) {
        const coincidentes = proyectos.filter((p) => p.tipoProyecto === tiposUnicos[0]);
        setSeleccionadosIds(coincidentes.slice(0, 4).map((p) => p.id));
        onNotificar?.(`Seleccionados programas de tipo: ${tiposUnicos[0]}`);
      }
    }
  };

  // Cálculos comparativos del grupo seleccionado
  const metricasGrupo = useMemo(() => {
    if (proyectosSeleccionados.length === 0) return null;

    let maxMargen = -Infinity;
    let maxMargenId = '';
    let maxAlumnos = -Infinity;
    let maxAlumnosId = '';
    let minCostoAlumno = Infinity;
    let minCostoAlumnoId = '';
    let maxMargenSeguridad = -Infinity;
    let maxMargenSeguridadId = '';
    let maxGananciaNeta = -Infinity;
    let maxGananciaNetaId = '';

    let sumIngreso = 0;
    let sumGasto = 0;
    let sumGanancia = 0;
    let sumAlumnosReales = 0;
    let sumAlumnosProy = 0;
    let sumHoras = 0;
    let sumPrecio = 0;

    proyectosSeleccionados.forEach((p) => {
      const margen = p.ingresoRealTotal > 0 ? (p.totalGananciasFinales / p.ingresoRealTotal) * 100 : 0;
      const costoAlumno = p.alumnosFinal > 0 ? p.gastoTotalOperativo / p.alumnosFinal : 0;
      const margenSeg = p.alumnosFinal - p.puntoEquilibrioAlumnos;

      if (margen > maxMargen) {
        maxMargen = margen;
        maxMargenId = p.id;
      }
      if (p.alumnosFinal > maxAlumnos) {
        maxAlumnos = p.alumnosFinal;
        maxAlumnosId = p.id;
      }
      if (costoAlumno < minCostoAlumno && costoAlumno > 0) {
        minCostoAlumno = costoAlumno;
        minCostoAlumnoId = p.id;
      }
      if (margenSeg > maxMargenSeguridad) {
        maxMargenSeguridad = margenSeg;
        maxMargenSeguridadId = p.id;
      }
      if (p.totalGananciasFinales > maxGananciaNeta) {
        maxGananciaNeta = p.totalGananciasFinales;
        maxGananciaNetaId = p.id;
      }

      sumIngreso += p.ingresoRealTotal;
      sumGasto += p.gastoTotalOperativo;
      sumGanancia += p.totalGananciasFinales;
      sumAlumnosReales += p.alumnosFinal;
      sumAlumnosProy += p.alumnosProyectados;
      sumHoras += p.horasClase;
      sumPrecio += p.precioSugeridoAlumno;
    });

    const count = proyectosSeleccionados.length;

    return {
      liderMargen: proyectosSeleccionados.find((p) => p.id === maxMargenId),
      liderMargenValor: maxMargen,
      liderAlumnos: proyectosSeleccionados.find((p) => p.id === maxAlumnosId),
      liderAlumnosValor: maxAlumnos,
      liderEficiencia: proyectosSeleccionados.find((p) => p.id === minCostoAlumnoId),
      liderEficienciaValor: minCostoAlumno,
      liderMargenSeguridad: proyectosSeleccionados.find((p) => p.id === maxMargenSeguridadId),
      liderMargenSeguridadValor: maxMargenSeguridad,
      liderGanancia: proyectosSeleccionados.find((p) => p.id === maxGananciaNetaId),
      liderGananciaValor: maxGananciaNeta,
      promedios: {
        ingresoRealTotal: sumIngreso / count,
        gastoTotalOperativo: sumGasto / count,
        totalGananciasFinales: sumGanancia / count,
        margenRealPonderado: sumIngreso > 0 ? (sumGanancia / sumIngreso) * 100 : 0,
        alumnosFinal: sumAlumnosReales / count,
        alumnosProyectados: sumAlumnosProy / count,
        costoPorAlumno: sumAlumnosReales > 0 ? sumGasto / sumAlumnosReales : 0,
        precioSugeridoAlumno: sumPrecio / count,
        horasClase: sumHoras / count,
      }
    };
  }, [proyectosSeleccionados]);

  // Exportar a Excel
  const handleExportarExcel = async () => {
    if (proyectosSeleccionados.length < 2) return;
    setExportando('excel');
    try {
      const res = await exportarComparativaProyectosExcel({
        proyectos: proyectosSeleccionados,
        moneda,
        guardarEnDrive: isDriveConnected,
      });
      if (res.guardadoEnDrive) {
        onNotificar?.(`✅ Comparativa guardada en Excel y respaldada en Google Drive.`);
      } else {
        onNotificar?.(`📄 Archivo Excel de comparativa descargado.`);
      }
    } catch (e: any) {
      console.error('Error exportando Excel:', e);
      alert(`Error al exportar: ${e.message || 'Desconocido'}`);
    } finally {
      setExportando(null);
    }
  };

  // Exportar a PDF
  const handleExportarPDF = async () => {
    if (proyectosSeleccionados.length < 2) return;
    setExportando('pdf');
    try {
      const res = await exportarComparativaProyectosPDF({
        proyectos: proyectosSeleccionados,
        moneda,
        guardarEnDrive: isDriveConnected,
      });
      if (res.guardadoEnDrive) {
        onNotificar?.(`✅ Comparativa ejecutiva en PDF guardada en Google Drive.`);
      } else {
        onNotificar?.(`📄 Reporte PDF de comparativa descargado.`);
      }
    } catch (e: any) {
      console.error('Error exportando PDF:', e);
      alert(`Error al exportar: ${e.message || 'Desconocido'}`);
    } finally {
      setExportando(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Barra Superior de Control y Selección de Proyectos */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Comparador Lado a Lado de Programas Educativos</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    {proyectosSeleccionados.length} Seleccionados
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Compara métricas financieras, unit economics, costos y viabilidad para tomar decisiones sobre programas similares.
                </p>
              </div>
            </div>
          </div>

          {/* Acciones de Exportación y Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectorAbierto(!selectorAbierto)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Gestionar Proyectos</span>
              {selectorAbierto ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {proyectosSeleccionados.length >= 2 && (
              <>
                <button
                  onClick={handleExportarExcel}
                  disabled={exportando !== null}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  title="Exportar tabla comparativa a Microsoft Excel"
                >
                  {exportando === 'excel' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
                  <span>Excel</span>
                </button>

                <button
                  onClick={handleExportarPDF}
                  disabled={exportando !== null}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Descargar informe ejecutivo en PDF con tablas y dictámenes"
                >
                  {exportando === 'pdf' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                  <span>Descargar PDF</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Chips de Proyectos Actualmente Seleccionados */}
        <div className="pt-3">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Programas en Comparación Activa:
            </span>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 text-[11px]">Presets rápidos:</span>
              <button
                onClick={() => aplicarPreset('top3')}
                className="text-[11px] font-semibold text-blue-700 hover:underline px-1.5 py-0.5 rounded bg-blue-50 cursor-pointer"
              >
                Top 3 Rentables
              </button>
              <button
                onClick={() => aplicarPreset('mismoTipo')}
                className="text-[11px] font-semibold text-indigo-700 hover:underline px-1.5 py-0.5 rounded bg-indigo-50 cursor-pointer"
              >
                Mismo Tipo
              </button>
              <button
                onClick={() => aplicarPreset('activos')}
                className="text-[11px] font-semibold text-emerald-700 hover:underline px-1.5 py-0.5 rounded bg-emerald-50 cursor-pointer"
              >
                Activos
              </button>
              <button
                onClick={() => aplicarPreset('limpiar')}
                className="text-[11px] font-semibold text-rose-600 hover:underline px-1.5 py-0.5 rounded bg-rose-50 cursor-pointer"
              >
                Limpiar
              </button>
            </div>
          </div>

          {proyectosSeleccionados.length === 0 ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>No hay proyectos seleccionados. Haz clic en <strong>Gestionar Proyectos</strong> o en un preset rápido para comenzar.</span>
              </div>
              <button
                onClick={() => aplicarPreset('top3')}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-xs cursor-pointer"
              >
                Cargar Top 3
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {proyectosSeleccionados.map((p, idx) => {
                const diagnostico = obtenerDiagnosticoComparativo(p);
                return (
                  <div
                    key={p.id}
                    className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-800 shadow-2xs group hover:border-blue-300 transition-colors"
                  >
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="max-w-[200px] truncate" title={p.nombreProyecto}>
                      {p.nombreProyecto}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                      diagnostico.margenReal >= 40 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : diagnostico.margenReal >= 25 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {diagnostico.margenReal.toFixed(0)}%
                    </span>
                    <button
                      onClick={() => quitarSeleccion(p.id)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                      title="Quitar de la comparativa"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

              {proyectosSeleccionados.length < 2 && (
                <span className="text-xs text-amber-700 font-medium italic flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  Selecciona al menos 1 proyecto más para activar la tabla lado a lado.
                </span>
              )}
            </div>
          )}
        </div>

        {/* Panel Desplegable: Catálogo Rápido para Añadir / Quitar Proyectos */}
        {selectorAbierto && (
          <div className="mt-3 pt-3 border-t border-slate-200 animate-fadeIn">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {/* Buscador */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por programa o docente..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>

              {/* Filtro Tipo */}
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium"
              >
                <option value="todos">Todos los Tipos</option>
                {tiposUnicos.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              {/* Filtro Docente */}
              <select
                value={filtroDocente}
                onChange={(e) => setFiltroDocente(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium"
              >
                <option value="todos">Todos los Docentes</option>
                {docentesUnicos.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Cuadrícula de Proyectos Disponibles para Seleccionar */}
            <div className="max-h-52 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-1 border border-slate-100 rounded-lg bg-slate-50/60">
              {proyectosDisponibles.map((p) => {
                const isSelected = seleccionadosIds.includes(p.id);
                const margen = p.ingresoRealTotal > 0 ? (p.totalGananciasFinales / p.ingresoRealTotal) * 100 : 0;

                return (
                  <button
                    key={p.id}
                    onClick={() => toggleSeleccion(p.id)}
                    className={`p-2 rounded-lg text-left transition-all border flex items-start justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-400'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{p.nombreProyecto}</p>
                      <p className="text-[11px] text-slate-500 truncate">{p.nombreDocente} • {p.horasClase}h</p>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                        <span className="font-semibold text-slate-600">{p.alumnosFinal} alumnos</span>
                        <span>•</span>
                        <span className={`font-bold ${margen >= 40 ? 'text-emerald-700' : margen >= 25 ? 'text-blue-700' : 'text-amber-700'}`}>
                          {margen.toFixed(1)}% margen
                        </span>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Si hay menos de 2 seleccionados: Estado de Guía */}
      {proyectosSeleccionados.length < 2 && (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-800">
              Selecciona dos o más proyectos para comparar
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              La comparativa lado a lado te permitirá evaluar programas similares, contrastar precios al público, tarifas docentes y márgenes netos para la toma de decisiones.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={() => aplicarPreset('top3')}
              className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              Comparar los 3 más rentables
            </button>
            <button
              onClick={() => aplicarPreset('mismoTipo')}
              className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
            >
              Comparar programas del mismo tipo
            </button>
          </div>
        </div>
      )}

      {/* 3. Panel de Métricas de Liderazgo (Key Takeaways) */}
      {proyectosSeleccionados.length >= 2 && metricasGrupo && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Tarjeta 1: Mayor Rentabilidad */}
          <div className="bg-white rounded-xl border border-emerald-200/90 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-emerald-800 text-xs font-bold mb-1">
              <span className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                Líder en Rentabilidad
              </span>
              <span className="text-[11px] font-mono bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded font-bold">
                {metricasGrupo.liderMargenValor.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs font-bold text-slate-900 truncate" title={metricasGrupo.liderMargen?.nombreProyecto}>
              {metricasGrupo.liderMargen?.nombreProyecto}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Utilidad neta: <strong className="text-slate-800">{formatearMoneda(metricasGrupo.liderMargen?.totalGananciasFinales || 0, moneda)}</strong>
            </p>
          </div>

          {/* Tarjeta 2: Mayor Demanda */}
          <div className="bg-white rounded-xl border border-blue-200/90 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-blue-800 text-xs font-bold mb-1">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                Mayor Demanda / Alumnos
              </span>
              <span className="text-[11px] font-mono bg-blue-100 text-blue-900 px-1.5 py-0.2 rounded font-bold">
                {metricasGrupo.liderAlumnosValor} inscritos
              </span>
            </div>
            <p className="text-xs font-bold text-slate-900 truncate" title={metricasGrupo.liderAlumnos?.nombreProyecto}>
              {metricasGrupo.liderAlumnos?.nombreProyecto}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Ocupación: <strong className="text-slate-800">{((metricasGrupo.liderAlumnos?.alumnosFinal || 0) / (metricasGrupo.liderAlumnos?.alumnosProyectados || 1) * 100).toFixed(0)}%</strong> de la meta
            </p>
          </div>

          {/* Tarjeta 3: Mayor Eficiencia de Costos */}
          <div className="bg-white rounded-xl border border-indigo-200/90 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-indigo-800 text-xs font-bold mb-1">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                Menor Costo por Alumno
              </span>
              <span className="text-[11px] font-mono bg-indigo-100 text-indigo-900 px-1.5 py-0.2 rounded font-bold">
                {formatearMoneda(metricasGrupo.liderEficienciaValor, moneda)}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-900 truncate" title={metricasGrupo.liderEficiencia?.nombreProyecto}>
              {metricasGrupo.liderEficiencia?.nombreProyecto}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Gasto total: <strong className="text-slate-800">{formatearMoneda(metricasGrupo.liderEficiencia?.gastoTotalOperativo || 0, moneda)}</strong>
            </p>
          </div>

          {/* Tarjeta 4: Mayor Margen de Seguridad */}
          <div className="bg-white rounded-xl border border-amber-200/90 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-amber-800 text-xs font-bold mb-1">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                Colchón de Seguridad
              </span>
              <span className="text-[11px] font-mono bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                +{metricasGrupo.liderMargenSeguridadValor} alumnos
              </span>
            </div>
            <p className="text-xs font-bold text-slate-900 truncate" title={metricasGrupo.liderMargenSeguridad?.nombreProyecto}>
              {metricasGrupo.liderMargenSeguridad?.nombreProyecto}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Sobre punto equilibrio (<strong className="text-slate-800">{metricasGrupo.liderMargenSeguridad?.puntoEquilibrioAlumnos} mín</strong>)
            </p>
          </div>
        </div>
      )}

      {/* 4. Tabla Resumen Lado a Lado */}
      {proyectosSeleccionados.length >= 2 && metricasGrupo && (
        <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
          {/* Barra de opciones de la tabla */}
          <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-slate-700 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={resaltarMejor}
                  onChange={(e) => setResaltarMejor(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Resaltar métrica ganadora</span>
              </label>

              <label className="flex items-center gap-1.5 text-slate-700 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={mostrarBenchmark}
                  onChange={(e) => setMostrarBenchmark(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Mostrar columna Promedio Grupo</span>
              </label>
            </div>

            <span className="text-[11px] text-slate-500 font-medium">
              Mostrando {proyectosSeleccionados.length} programas lado a lado
            </span>
          </div>

          {/* Tabla de Comparación con Scroll Horizontal */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white border-b border-slate-800">
                  <th className="py-3 px-4 font-bold text-slate-200 uppercase tracking-wider text-[11px] min-w-[200px] sticky left-0 bg-slate-900 z-10">
                    Métrica / Indicador Clave
                  </th>

                  {proyectosSeleccionados.map((p, idx) => (
                    <th key={p.id} className="py-3 px-4 min-w-[220px] font-bold border-l border-slate-800">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-mono text-[10px] text-blue-300">
                              #{p.numeroCorrelativo || (idx + 1)}
                            </span>
                          </div>
                          <p className="text-xs text-white font-bold mt-0.5 line-clamp-1" title={p.nombreProyecto}>
                            {p.nombreProyecto}
                          </p>
                          <p className="text-[10px] text-slate-300 font-normal truncate">
                            Docente: {p.nombreDocente || 'Por asignar'}
                          </p>
                        </div>
                        <button
                          onClick={() => quitarSeleccion(p.id)}
                          className="text-slate-400 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
                          title="Quitar de la comparativa"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </th>
                  ))}

                  {mostrarBenchmark && (
                    <th className="py-3 px-4 min-w-[170px] bg-slate-800/90 text-blue-200 font-bold border-l border-slate-700">
                      <div className="text-[11px] font-bold text-white flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-blue-400" />
                        <span>Promedio Grupo</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-normal">Benchmark de referencia</p>
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {/* ============================================================ */}
                {/* SECCIÓN 1: FICHA ACADÉMICA */}
                {/* ============================================================ */}
                <tr className="bg-slate-100/80 font-bold text-slate-800 text-[11px]">
                  <td colSpan={proyectosSeleccionados.length + (mostrarBenchmark ? 2 : 1)} className="py-2 px-4 sticky left-0 bg-slate-100/90">
                    <span className="text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                      1. Ficha Académica & Formato
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-4 font-semibold text-slate-700 sticky left-0 bg-white border-r border-slate-100">
                    Tipo de Proyecto
                  </td>
                  {proyectosSeleccionados.map((p) => (
                    <td key={p.id} className="py-2.5 px-4 text-slate-800">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[11px] font-semibold border border-blue-200">
                        {p.tipoProyecto}
                      </span>
                    </td>
                  ))}
                  {mostrarBenchmark && <td className="py-2.5 px-4 text-slate-400 text-[11px] italic bg-slate-50/50">Cualitativo</td>}
                </tr>

                <tr>
                  <td className="py-2.5 px-4 font-semibold text-slate-700 sticky left-0 bg-white border-r border-slate-100">
                    Nivel del Programa
                  </td>
                  {proyectosSeleccionados.map((p) => (
                    <td key={p.id} className="py-2.5 px-4 text-slate-800 font-medium">
                      {p.nivel}
                    </td>
                  ))}
                  {mostrarBenchmark && <td className="py-2.5 px-4 text-slate-400 text-[11px] italic bg-slate-50/50">Cualitativo</td>}
                </tr>

                <tr>
                  <td className="py-2.5 px-4 font-semibold text-slate-700 sticky left-0 bg-white border-r border-slate-100">
                    Carga Horaria & Tarifa Docente
                  </td>
                  {proyectosSeleccionados.map((p) => (
                    <td key={p.id} className="py-2.5 px-4 text-slate-800">
                      <div className="font-semibold">{p.horasClase} horas</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {formatearMoneda(p.tarifaHoraDocente, moneda)} / hora
                      </div>
                    </td>
                  ))}
                  {mostrarBenchmark && (
                    <td className="py-2.5 px-4 text-slate-700 font-semibold bg-slate-50/50">
                      {metricasGrupo.promedios.horasClase.toFixed(0)} hrs prom.
                    </td>
                  )}
                </tr>

                <tr>
                  <td className="py-2.5 px-4 font-semibold text-slate-700 sticky left-0 bg-white border-r border-slate-100">
                    Estado Actual
                  </td>
                  {proyectosSeleccionados.map((p) => (
                    <td key={p.id} className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.seLlevoACabo === 'Sí' || p.seLlevoACabo === 'Listo'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.seLlevoACabo === 'En curso' || p.seLlevoACabo === 'En proceso'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {p.seLlevoACabo}
                      </span>
                    </td>
                  ))}
                  {mostrarBenchmark && <td className="py-2.5 px-4 text-slate-400 text-[11px] italic bg-slate-50/50">-</td>}
                </tr>

                {/* ============================================================ */}
                {/* SECCIÓN 2: DEMANDA Y MATRÍCULA */}
                {/* ============================================================ */}
                <tr className="bg-slate-100/80 font-bold text-slate-800 text-[11px]">
                  <td colSpan={proyectosSeleccionados.length + (mostrarBenchmark ? 2 : 1)} className="py-2 px-4 sticky left-0 bg-slate-100/90">
                    <span className="text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      2. Demanda, Matrícula & Punto de Equilibrio
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-4 font-semibold text-slate-700 sticky left-0 bg-white border-r border-slate-100">
                    Alumnos Reales vs Meta
                  </td>
                  {proyectosSeleccionados.map((p) => {
                    const esLiderAlumnos = resaltarMejor && p.id === metricasGrupo.liderAlumnos?.id;
                    return (
                      <td key={p.id} className={`py-2.5 px-4 ${esLiderAlumnos ? 'bg-emerald-50/70 font-bold text-emerald-950' : 'text-slate-800'}`}>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-extrabold">{p.alumnosFinal}</span>
                          <span className="text-slate-400 text-[11px]">/ {p.alumnosProyectados} meta</span>
                          {esLiderAlumnos && <Award className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                      </td>
                    );
                  })}
                  {mostrarBenchmark && (
                    <td className="py-2.5 px-4 font-bold text-slate-700 bg-slate-50/50">
                      {metricasGrupo.promedios.alumnosFinal.toFixed(1)} alumnos prom.
                    </td>
                  )}
                </tr>

                <tr>
                  <td className="py-2.5 px-4 font-semibold text-slate-700 sticky left-0 bg-white border-r border-slate-100">
                    Tasa de Cumplimiento (%)
                  </td>
                  {proyectosSeleccionados.map((p) => {
                    const pct = (p.alumnosFinal / p.alumnosProyectados) * 100;
                    return (
                      <td key={p.id} className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full ${pct >= 100 ? 'bg-emerald-500' : pct >= 80 ? 'bg-blue-500' : 'bg-amber-500'}`}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                          <span className="font-bold text-[11px] font-mono">{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                    );
                  })}
                  {mostrarBenchmark && (
                    <td className="py-2.5 px-4 font-semibold text-slate-700 bg-slate-50/50 font-mono">
                      {((metricasGrupo.promedios.alumnosFinal / metricasGrupo.promedios.alumnosProyectados) * 100).toFixed(0)}%
                    </td>
                  )}
                </tr>

                <tr>
                  <td className="py-2.5 px-4 font-semibold text-slate-700 sticky left-0 bg-white border-r border-slate-100">
                    Punto de Equilibrio
                  </td>
                  {proyectosSeleccionados.map((p) => (
                    <td key={p.id} className="py-2.5 px-4 text-slate-800 font-mono">
                      <strong>{p.puntoEquilibrioAlumnos}</strong> alumnos mín.
                    </td>
                  ))}
                  {mostrarBenchmark && <td className="py-2.5 px-4 text-slate-400 bg-slate-50/50">-</td>}
                </tr>

                <tr>
                  <td className="py-2.5 px-4 font-semibold text-slate-700 sticky left-0 bg-white border-r border-slate-100">
                    Margen de Seguridad (Alumnos)
                  </td>
                  {proyectosSeleccionados.map((p) => {
                    const margenSeg = p.alumnosFinal - p.puntoEquilibrioAlumnos;
                    const esLider = resaltarMejor && p.id === metricasGrupo.liderMargenSeguridad?.id;
                    return (
                      <td key={p.id} className={`py-2.5 px-4 ${esLider ? 'bg-amber-50/60 font-bold' : ''}`}>
                        <span className={`font-bold font-mono ${margenSeg >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {margenSeg >= 0 ? `+${margenSeg}` : margenSeg} alumnos
                        </span>
                      </td>
                    );
                  })}
                  {mostrarBenchmark && <td className="py-2.5 px-4 text-slate-400 bg-slate-50/50">-</td>}
                </tr>

                {/* ============================================================ */}
                {/* SECCIÓN 3: PRECIOS E INGRESOS */}
                {/* ============================================================ */}
                <tr className="bg-slate-100/80 font-bold text-slate-800 text-[11px]">
                  <td colSpan={proyectosSeleccionados.length + (mostrarBenchmark ? 2 : 1)} className="py-2 px-4 sticky left-0 bg-slate-100/90">
                    <span className="text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                      3. Precios al Público & Facturación
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-4 font-semibold text-slate-700 sticky left-0 bg-white border-r border-slate-100">
                    Precio Sugerido Neto
                  </td>
                  {proyectosSeleccionados.map((p) => (
                    <td key={p.id} className="py-2.5 px-4 text-slate-900 font-bold font-mono">
                      {formatearMoneda(p.precioSugeridoAlumno, moneda)}
                    </td>
                  ))}
                  {mostrarBenchmark && (
                    <td className="py-2.5 px-4 font-bold text-slate-700 bg-slate-50/50 font-mono">
                      {formatearMoneda(metricasGrupo.promedios.precioSugeridoAlumno, moneda)}
                    </td>
                  )}
                </tr>

                <tr>
                  <td className="py-2.5 px-4 font-semibold text-slate-700 sticky left-0 bg-white border-r border-slate-100">
                    Régimen Fiscal SAR (ISV)
                  </td>
                  {proyectosSeleccionados.map((p) => (
                    <td key={p.id} className="py-2.5 px-4 text-[11px]">
                      <span className={`px-1.5 py-0.5 rounded font-semibold ${p.aplicaISV ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-emerald-50 text-emerald-900 border border-emerald-200'}`}>
                        {p.aplicaISV ? 'Grava 15% ISV' : 'Exento (0%)'}
                      </span>
                    </td>
                  ))}
                  {mostrarBenchmark && <td className="py-2.5 px-4 text-slate-400 bg-slate-50/50">-</td>}
                </tr>

                <tr>
                  <td className="py-2.5 px-4 font-semibold text-slate-700 sticky left-0 bg-white border-r border-slate-100">
                    Ingreso Real Facturado
                  </td>
                  {proyectosSeleccionados.map((p) => (
                    <td key={p.id} className="py-2.5 px-4 font-bold text-slate-900 font-mono">
                      {formatearMoneda(p.ingresoRealTotal, moneda)}
                    </td>
                  ))}
                  {mostrarBenchmark && (
                    <td className="py-2.5 px-4 font-bold text-slate-700 bg-slate-50/50 font-mono">
                      {formatearMoneda(metricasGrupo.promedios.ingresoRealTotal, moneda)}
                    </td>
                  )}
                </tr>

                {/* ============================================================ */}
                {/* SECCIÓN 4: ESTRUCTURA DE COSTOS Y UNIT ECONOMICS */}
                {/* ============================================================ */}
                <tr className="bg-slate-100/80 font-bold text-slate-800 text-[11px]">
                  <td colSpan={proyectosSeleccionados.length + (mostrarBenchmark ? 2 : 1)} className="py-2 px-4 sticky left-0 bg-slate-100/90">
                    <span className="text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      4. Estructura de Gastos & Costo Unitario
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-4 font-semibold text-slate-700 sticky left-0 bg-white border-r border-slate-100">
                    Costo Docente (Honorarios)
                  </td>
                  {proyectosSeleccionados.map((p) => {
                    const pctDocente = p.gastoTotalOperativo > 0 ? (p.costoDocenteCalculado / p.gastoTotalOperativo) * 100 : 0;
                    return (
                      <td key={p.id} className="py-2.5 px-4 text-slate-800 font-mono">
                        <div>{formatearMoneda(p.costoDocenteCalculado, moneda)}</div>
                        <span className="text-[10px] text-slate-400 font-normal">({pctDocente.toFixed(0)}% del gasto)</span>
                      </td>
                    );
                  })}
                  {mostrarBenchmark && <td className="py-2.5 px-4 text-slate-400 bg-slate-50/50">-</td>}
                </tr>

                <tr>
                  <td className="py-2.5 px-4 font-semibold text-slate-700 sticky left-0 bg-white border-r border-slate-100">
                    Gasto Total Operativo
                  </td>
                  {proyectosSeleccionados.map((p) => (
                    <td key={p.id} className="py-2.5 px-4 text-slate-900 font-bold font-mono">
                      {formatearMoneda(p.gastoTotalOperativo, moneda)}
                    </td>
                  ))}
                  {mostrarBenchmark && (
                    <td className="py-2.5 px-4 font-bold text-slate-700 bg-slate-50/50 font-mono">
                      {formatearMoneda(metricasGrupo.promedios.gastoTotalOperativo, moneda)}
                    </td>
                  )}
                </tr>

                {/* MÉTRICA DE ORO: Costo Operativo por Alumno */}
                <tr className="bg-indigo-50/30">
                  <td className="py-2.5 px-4 font-bold text-indigo-950 sticky left-0 bg-indigo-50/80 border-r border-indigo-100">
                    <div className="flex items-center gap-1">
                      <span>Costo Operativo por Alumno</span>
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1 rounded font-normal">Clave</span>
                    </div>
                  </td>
                  {proyectosSeleccionados.map((p) => {
                    const costoAlumno = p.alumnosFinal > 0 ? p.gastoTotalOperativo / p.alumnosFinal : 0;
                    const esLiderEficiencia = resaltarMejor && p.id === metricasGrupo.liderEficiencia?.id;
                    return (
                      <td key={p.id} className={`py-2.5 px-4 font-mono font-bold ${esLiderEficiencia ? 'bg-emerald-50 text-emerald-900' : 'text-slate-900'}`}>
                        <div className="flex items-center gap-1">
                          <span>{formatearMoneda(costoAlumno, moneda)}</span>
                          {esLiderEficiencia && <Award className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                      </td>
                    );
                  })}
                  {mostrarBenchmark && (
                    <td className="py-2.5 px-4 font-bold text-indigo-900 bg-indigo-50/60 font-mono">
                      {formatearMoneda(metricasGrupo.promedios.costoPorAlumno, moneda)}
                    </td>
                  )}
                </tr>

                {/* ============================================================ */}
                {/* SECCIÓN 5: RENTABILIDAD Y RETORNO FINANCIERO */}
                {/* ============================================================ */}
                <tr className="bg-slate-100/80 font-bold text-slate-800 text-[11px]">
                  <td colSpan={proyectosSeleccionados.length + (mostrarBenchmark ? 2 : 1)} className="py-2 px-4 sticky left-0 bg-slate-100/90">
                    <span className="text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                      5. Rentabilidad, SAR & Retorno de Inversión
                    </span>
                  </td>
                </tr>

                {/* Margen Real Obtenido */}
                <tr className="bg-blue-50/20">
                  <td className="py-2.5 px-4 font-bold text-slate-900 sticky left-0 bg-blue-50/60 border-r border-blue-100">
                    Margen Real de Utilidad (%)
                  </td>
                  {proyectosSeleccionados.map((p) => {
                    const margen = p.ingresoRealTotal > 0 ? (p.totalGananciasFinales / p.ingresoRealTotal) * 100 : 0;
                    const esLiderMargen = resaltarMejor && p.id === metricasGrupo.liderMargen?.id;
                    return (
                      <td key={p.id} className={`py-2.5 px-4 ${esLiderMargen ? 'bg-emerald-100/60 text-emerald-950 font-black' : ''}`}>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-xs font-mono font-extrabold ${
                            margen >= 40 
                              ? 'bg-emerald-600 text-white' 
                              : margen >= 25 
                              ? 'bg-blue-600 text-white' 
                              : margen >= 10 
                              ? 'bg-amber-500 text-white' 
                              : 'bg-rose-600 text-white'
                          }`}>
                            {margen.toFixed(1)}%
                          </span>
                          {esLiderMargen && <Award className="w-4 h-4 text-emerald-700" />}
                        </div>
                      </td>
                    );
                  })}
                  {mostrarBenchmark && (
                    <td className="py-2.5 px-4 font-extrabold text-blue-950 bg-blue-50/70 font-mono text-xs">
                      {metricasGrupo.promedios.margenRealPonderado.toFixed(1)}% prom.
                    </td>
                  )}
                </tr>

                {/* Ganancia Neta Final */}
                <tr>
                  <td className="py-2.5 px-4 font-bold text-slate-800 sticky left-0 bg-white border-r border-slate-100">
                    Ganancia Neta Final (Utilidad)
                  </td>
                  {proyectosSeleccionados.map((p) => {
                    const esLiderGanancia = resaltarMejor && p.id === metricasGrupo.liderGanancia?.id;
                    return (
                      <td key={p.id} className={`py-2.5 px-4 font-mono font-bold ${esLiderGanancia ? 'bg-emerald-50 text-emerald-950' : 'text-slate-900'}`}>
                        <div className="flex items-center gap-1">
                          <span className={p.totalGananciasFinales >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                            {formatearMoneda(p.totalGananciasFinales, moneda)}
                          </span>
                          {esLiderGanancia && <Award className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                      </td>
                    );
                  })}
                  {mostrarBenchmark && (
                    <td className="py-2.5 px-4 font-bold text-slate-700 bg-slate-50/50 font-mono">
                      {formatearMoneda(metricasGrupo.promedios.totalGananciasFinales, moneda)}
                    </td>
                  )}
                </tr>

                {/* Ganancia Neta por Alumno */}
                <tr>
                  <td className="py-2.5 px-4 font-semibold text-slate-700 sticky left-0 bg-white border-r border-slate-100">
                    Ganancia Neta por Alumno
                  </td>
                  {proyectosSeleccionados.map((p) => {
                    const gananciaAlumno = p.alumnosFinal > 0 ? p.totalGananciasFinales / p.alumnosFinal : 0;
                    return (
                      <td key={p.id} className="py-2.5 px-4 font-mono text-slate-800 font-semibold">
                        {formatearMoneda(gananciaAlumno, moneda)} / alum.
                      </td>
                    );
                  })}
                  {mostrarBenchmark && <td className="py-2.5 px-4 text-slate-400 bg-slate-50/50">-</td>}
                </tr>

                {/* Retorno de Inversión (ROI) */}
                <tr>
                  <td className="py-2.5 px-4 font-semibold text-slate-700 sticky left-0 bg-white border-r border-slate-100">
                    Retorno Operativo (ROI %)
                  </td>
                  {proyectosSeleccionados.map((p) => (
                    <td key={p.id} className="py-2.5 px-4 font-mono font-bold text-slate-800">
                      {p.roiPorcentaje.toFixed(1)}%
                    </td>
                  ))}
                  {mostrarBenchmark && <td className="py-2.5 px-4 text-slate-400 bg-slate-50/50">-</td>}
                </tr>

                {/* Retención Tributaria SAR */}
                <tr>
                  <td className="py-2.5 px-4 font-semibold text-slate-700 sticky left-0 bg-white border-r border-slate-100">
                    Retención SAR Estimada (15%)
                  </td>
                  {proyectosSeleccionados.map((p) => {
                    const sarMonto = p.isvTotalTrasladarSAR || (p.aplicaISV ? p.ingresoRealTotal * 0.15 : 0);
                    return (
                      <td key={p.id} className="py-2.5 px-4 font-mono text-slate-600 text-[11px]">
                        {formatearMoneda(sarMonto, moneda)}
                      </td>
                    );
                  })}
                  {mostrarBenchmark && <td className="py-2.5 px-4 text-slate-400 bg-slate-50/50">-</td>}
                </tr>

                {/* ============================================================ */}
                {/* SECCIÓN 6: DIAGNÓSTICO ESTRATÉGICO & TOMA DE DECISIONES */}
                {/* ============================================================ */}
                <tr className="bg-amber-100/70 font-bold text-slate-900 text-[11px]">
                  <td colSpan={proyectosSeleccionados.length + (mostrarBenchmark ? 2 : 1)} className="py-2 px-4 sticky left-0 bg-amber-100/80">
                    <span className="text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                      6. Diagnóstico y Recomendación de Decisión para Programas Similares
                    </span>
                  </td>
                </tr>

                {/* Veredicto */}
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-800 sticky left-0 bg-white border-r border-slate-100">
                    Veredicto Institucional
                  </td>
                  {proyectosSeleccionados.map((p) => {
                    const diag = obtenerDiagnosticoComparativo(p);
                    return (
                      <td key={p.id} className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${
                          diag.categoria === 'estrella'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : diag.categoria === 'saludable'
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : diag.categoria === 'alerta'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-rose-100 text-rose-900 border border-rose-300'
                        }`}>
                          {diag.categoria === 'estrella' && <Sparkles className="w-3 h-3 text-emerald-700" />}
                          {diag.categoria === 'alerta' && <AlertTriangle className="w-3 h-3 text-amber-700" />}
                          <span>{diag.veredicto}</span>
                        </span>
                      </td>
                    );
                  })}
                  {mostrarBenchmark && <td className="py-3 px-4 text-slate-400 bg-slate-50/50">-</td>}
                </tr>

                {/* Recomendación Accionable */}
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-700 sticky left-0 bg-white border-r border-slate-100">
                    Recomendación para Programas Similares
                  </td>
                  {proyectosSeleccionados.map((p) => {
                    const diag = obtenerDiagnosticoComparativo(p);
                    return (
                      <td key={p.id} className="py-3 px-4 text-[11px] text-slate-600 leading-relaxed bg-slate-50/30">
                        <p>{diag.recomendacion}</p>
                        {onVerProyectoDetalle && (
                          <button
                            onClick={() => onVerProyectoDetalle(p)}
                            className="text-blue-600 hover:text-blue-800 font-bold mt-1.5 flex items-center gap-1 cursor-pointer"
                          >
                            <span>Ver ficha completa</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    );
                  })}
                  {mostrarBenchmark && (
                    <td className="py-3 px-4 text-[11px] text-slate-500 bg-slate-50/50 italic">
                      Utiliza este benchmark para alinear los precios sugeridos y techos de honorarios en convocatorias futuras.
                    </td>
                  )}
                </tr>

              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Conclusiones y Síntesis Ejecutiva de la Comparativa */}
      {proyectosSeleccionados.length >= 2 && metricasGrupo && (
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Síntesis de Decisión para la Dirección Académica y Comercial:</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700 pt-1">
            <div className="p-3 bg-white/80 rounded-lg border border-blue-100 space-y-1">
              <strong className="text-slate-900 block flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Patrón de Éxito en Rentabilidad:
              </strong>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                El programa <strong>{metricasGrupo.liderMargen?.nombreProyecto}</strong> alcanza el margen más elevado ({metricasGrupo.liderMargenValor.toFixed(1)}%). Su estructura combina un precio por alumno de {formatearMoneda(metricasGrupo.liderMargen?.precioSugeridoAlumno || 0, moneda)} con un aforo saludable, logrando un costo operativo por alumno de apenas {formatearMoneda(metricasGrupo.liderMargen ? (metricasGrupo.liderMargen.gastoTotalOperativo / metricasGrupo.liderMargen.alumnosFinal) : 0, moneda)}.
              </p>
            </div>

            <div className="p-3 bg-white/80 rounded-lg border border-blue-100 space-y-1">
              <strong className="text-slate-900 block flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-blue-600" />
                Guía para Diseñar Programas Similares:
              </strong>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                El promedio del grupo fija un punto de equilibrio en <strong>{metricasGrupo.promedios.alumnosFinal.toFixed(0)} alumnos</strong> y un margen de <strong>{metricasGrupo.promedios.margenRealPonderado.toFixed(1)}%</strong>. Al lanzar ofertas equivalentes, se recomienda mantener honorarios docentes por debajo del 65% del presupuesto operativo para garantizar el cumplimiento de la meta institucional del 40%.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
