import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Copy, 
  Eye, 
  ArrowUpDown, 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  XCircle,
  Info,
  Layers,
  Sparkles,
  FileText,
  FileDown
} from 'lucide-react';
import { ProyectoEducativo, Moneda, TipoProyecto, EstadoProyecto, NivelProyecto } from '../types';
import { formatearMoneda } from '../utils/calculations';
import { formatearEtiquetaMes, formatearEtiquetaCortaMes } from '../utils/monthUtils';
import { coincideTipoProyecto } from './ProjectQuickFilterBar';
import { SmartProjectSearchBar, coincideBusquedaInteligente, CriterioBusqueda } from './SmartProjectSearchBar';

interface SpreadsheetTableProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onEditar: (p: ProyectoEducativo) => void;
  onVerDetalle: (p: ProyectoEducativo) => void;
  onDuplicar: (p: ProyectoEducativo) => void;
  onEliminar: (id: string) => void;
  onActualizarRapido: (id: string, campo: keyof ProyectoEducativo, valor: any) => void;
  onExportarPDF?: (p: ProyectoEducativo) => void;
  mesFiltro?: string;
  onExportarReporteMes?: (mesKey?: string) => void;
  // Props sincronizadas opcionales de búsqueda y filtros rápidos
  busqueda?: string;
  onBusquedaChange?: (v: string) => void;
  filtroTipo?: string;
  onFiltroTipoChange?: (v: string) => void;
  filtroDocente?: string;
  onFiltroDocenteChange?: (v: string) => void;
  filtroEstado?: string;
  onFiltroEstadoChange?: (v: string) => void;
  onLimpiarFiltros?: () => void;
  ocultarBarraFiltrosInterna?: boolean;
}

type CampoOrden = 'id' | 'nombreProyecto' | 'nombreDocente' | 'gastoTotalOperativo' | 'totalGananciasFinales' | 'alumnosFinal' | 'precioSugeridoAlumno';

export const SpreadsheetTable: React.FC<SpreadsheetTableProps> = ({
  proyectos,
  moneda,
  onEditar,
  onVerDetalle,
  onDuplicar,
  onEliminar,
  onActualizarRapido,
  onExportarPDF,
  mesFiltro,
  onExportarReporteMes,
  busqueda: busquedaProp,
  onBusquedaChange: onBusquedaChangeProp,
  filtroTipo: filtroTipoProp,
  onFiltroTipoChange: onFiltroTipoChangeProp,
  filtroDocente: filtroDocenteProp,
  onFiltroDocenteChange: onFiltroDocenteChangeProp,
  filtroEstado: filtroEstadoProp,
  onFiltroEstadoChange: onFiltroEstadoChangeProp,
  onLimpiarFiltros: onLimpiarFiltrosProp,
  ocultarBarraFiltrosInterna = false,
}) => {
  // Estado local para fallback cuando no se pasan props controladas
  const [busquedaLocal, setBusquedaLocal] = useState('');
  const [filtroTipoLocal, setFiltroTipoLocal] = useState<string>('todos');
  const [filtroEstadoLocal, setFiltroEstadoLocal] = useState<string>('todos');
  const [filtroDocenteLocal, setFiltroDocenteLocal] = useState<string>('todos');
  const [criterioBusqueda, setCriterioBusqueda] = useState<CriterioBusqueda>('todos');

  // Valores efectivos (props controladas o estado local)
  const busqueda = busquedaProp !== undefined ? busquedaProp : busquedaLocal;
  const setBusqueda = onBusquedaChangeProp || setBusquedaLocal;

  const filtroTipo = filtroTipoProp !== undefined ? filtroTipoProp : filtroTipoLocal;
  const setFiltroTipo = onFiltroTipoChangeProp || setFiltroTipoLocal;

  const filtroEstado = filtroEstadoProp !== undefined ? filtroEstadoProp : filtroEstadoLocal;
  const setFiltroEstado = onFiltroEstadoChangeProp || setFiltroEstadoLocal;

  const filtroDocente = filtroDocenteProp !== undefined ? filtroDocenteProp : filtroDocenteLocal;
  const setFiltroDocente = onFiltroDocenteChangeProp || setFiltroDocenteLocal;

  const handleLimpiarFiltros = () => {
    setCriterioBusqueda('todos');
    if (onLimpiarFiltrosProp) {
      onLimpiarFiltrosProp();
    } else {
      setBusqueda('');
      setFiltroTipo('todos');
      setFiltroEstado('todos');
      setFiltroDocente('todos');
    }
  };

  const [campoOrden, setCampoOrden] = useState<CampoOrden>('id');
  const [ordenAsc, setOrdenAsc] = useState<boolean>(true);

  // Lista única de docentes
  const docentesUnicos = useMemo(() => {
    const list = Array.from(new Set(proyectos.map(p => p.nombreDocente).filter(Boolean)));
    return list.sort();
  }, [proyectos]);

  // Filtrado y ordenamiento enriquecido con búsqueda inteligente multicriterio
  const proyectosFiltrados = useMemo(() => {
    return proyectos
      .filter(p => {
        const matchBusqueda = coincideBusquedaInteligente(p, busqueda, criterioBusqueda);
        const matchTipo = coincideTipoProyecto(p, filtroTipo);
        const matchEstado = filtroEstado === 'todos' || p.seLlevoACabo === filtroEstado;
        const matchDocente =
          filtroDocente === 'todos' ||
          p.nombreDocente.trim().toLowerCase() === filtroDocente.trim().toLowerCase();

        return matchBusqueda && matchTipo && matchEstado && matchDocente;
      })
      .sort((a, b) => {
        let valA = a[campoOrden];
        let valB = b[campoOrden];

        if (typeof valA === 'string') {
          return ordenAsc
            ? (valA as string).localeCompare(valB as string)
            : (valB as string).localeCompare(valA as string);
        }

        return ordenAsc ? (Number(valA) - Number(valB)) : (Number(valB) - Number(valA));
      });
  }, [proyectos, busqueda, filtroTipo, filtroEstado, filtroDocente, campoOrden, ordenAsc]);

  const handleOrdenar = (campo: CampoOrden) => {
    if (campoOrden === campo) {
      setOrdenAsc(!ordenAsc);
    } else {
      setCampoOrden(campo);
      setOrdenAsc(true);
    }
  };

  const getEstadoBadge = (estado: EstadoProyecto) => {
    switch (estado) {
      case 'Sí':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            Sí (Realizado)
          </span>
        );
      case 'En curso':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" />
            En curso
          </span>
        );
      case 'Planificado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <Layers className="w-3 h-3 text-purple-600" />
            Planificado
          </span>
        );
      case 'Pospuesto':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            Pospuesto
          </span>
        );
      case 'No se llevó a cabo':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-600" />
            No se llevó a cabo (Plazo 20d)
          </span>
        );
      case 'Cancelado':
      case 'No':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            {estado}
          </span>
        );
      default:
        return <span className="text-xs text-slate-600">{estado}</span>;
    }
  };

  // Totales de la fila resumen
  const totalHoras = proyectosFiltrados.reduce((acc, p) => acc + p.horasClase, 0);
  const totalCostoDocente = proyectosFiltrados.reduce((acc, p) => acc + p.costoDocenteCalculado, 0);
  const totalZoom = proyectosFiltrados.reduce((acc, p) => acc + p.costoZoom, 0);
  const totalPapeleria = proyectosFiltrados.reduce((acc, p) => acc + p.costoPapeleria, 0);
  const totalGastosVarios = proyectosFiltrados.reduce((acc, p) => acc + p.gastosVarios, 0);
  const totalGastoOp = proyectosFiltrados.reduce((acc, p) => acc + p.gastoTotalOperativo, 0);
  const totalPrecioVentaReq = proyectosFiltrados.reduce((acc, p) => acc + p.precioVentaRequerido, 0);
  const totalGananciaOp = proyectosFiltrados.reduce((acc, p) => acc + p.gananciaOperativa, 0);
  const totalAlumnosProy = proyectosFiltrados.reduce((acc, p) => acc + p.alumnosProyectados, 0);
  const totalAlumnosFin = proyectosFiltrados.reduce((acc, p) => acc + p.alumnosFinal, 0);
  const totalGananciaAdicional = proyectosFiltrados.reduce((acc, p) => acc + p.gananciaAlumnosAdicionales, 0);
  const totalGananciasFin = proyectosFiltrados.reduce((acc, p) => acc + p.totalGananciasFinales, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      
      {/* Barra de Filtros y Búsqueda Inteligente */}
      {!ocultarBarraFiltrosInterna ? (
        <div className="p-3 border-b border-slate-200 bg-slate-50/60 space-y-2">
          <SmartProjectSearchBar
            proyectos={proyectos}
            busqueda={busqueda}
            onBusquedaChange={setBusqueda}
            filtroTipo={filtroTipo}
            onFiltroTipoChange={setFiltroTipo}
            filtroDocente={filtroDocente}
            onFiltroDocenteChange={setFiltroDocente}
            filtroEstado={filtroEstado}
            onFiltroEstadoChange={setFiltroEstado}
            criterioActivo={criterioBusqueda}
            onCriterioActivoChange={setCriterioBusqueda}
            totalFiltrados={proyectosFiltrados.length}
            onLimpiarFiltros={handleLimpiarFiltros}
            moneda={moneda}
            placeholder="Buscar por nombre de curso, docente o tipo de programa..."
          />

          {/* Acciones Secundarias: Filtro de Estado y Botón Reporte Consolidado PDF */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Estado del Proyecto:</span>
              <select
                id="filtro-estado-tabla"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium cursor-pointer shadow-2xs"
              >
                <option value="todos">Todos los Estados</option>
                <option value="Sí">Sí (Realizados)</option>
                <option value="En curso">En curso</option>
                <option value="Planificado">Planificados</option>
                <option value="Pospuesto">Pospuestos</option>
                <option value="No">No / Cancelados</option>
                <option value="No se llevó a cabo">No se llevó a cabo (Plazo 20d)</option>
              </select>
            </div>

            {onExportarReporteMes && (
              <button
                type="button"
                onClick={() => onExportarReporteMes(mesFiltro !== 'todos' ? mesFiltro : undefined)}
                className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl shadow-2xs transition-colors cursor-pointer"
                title={
                  mesFiltro && mesFiltro !== 'todos'
                    ? `Exportar Reporte Consolidado PDF de ${formatearEtiquetaMes(mesFiltro)}`
                    : 'Exportar Reporte Consolidado Mensual en PDF'
                }
              >
                <FileDown className="w-3.5 h-3.5 text-blue-600" />
                <span>Reporte Consolidado PDF</span>
                {mesFiltro && mesFiltro !== 'todos' && (
                  <span className="bg-blue-200 text-blue-900 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {formatearEtiquetaCortaMes(mesFiltro)}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">
              Mostrando {proyectosFiltrados.length} de {proyectos.length} proyectos en la matriz
            </span>
            {(busqueda || filtroTipo !== 'todos' || filtroDocente !== 'todos' || filtroEstado !== 'todos') && (
              <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-purple-200">
                Filtros activos aplicados
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {(busqueda || filtroTipo !== 'todos' || filtroDocente !== 'todos' || filtroEstado !== 'todos') && (
              <button
                onClick={handleLimpiarFiltros}
                className="text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1 cursor-pointer"
              >
                Limpiar filtros
              </button>
            )}

            {onExportarReporteMes && (
              <button
                onClick={() => onExportarReporteMes(mesFiltro !== 'todos' ? mesFiltro : undefined)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                title="Exportar Reporte Consolidado Mensual en PDF"
              >
                <FileDown className="w-3.5 h-3.5 text-blue-600" />
                <span>Reporte Consolidado PDF</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Contenedor de la Tabla Estilo Hoja de Cálculo con Scroll Horizontal Fluido */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            
            {/* Fila de Super-Encabezados agrupados por Gerencias */}
            <tr className="bg-slate-100/80 text-[11px] font-bold text-slate-600 border-b border-slate-200">
              <th colSpan={7} className="px-3 py-1.5 border-r border-slate-300 text-blue-900 bg-blue-50/70 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <span>🎓 1. Gerencia Académica</span>
                  <span className="text-[9px] font-semibold text-blue-700 bg-blue-200/70 px-1.5 py-0.2 rounded font-normal normal-case">
                    (Diseño Curricular, Docente, Horas & Fechas)
                  </span>
                </span>
              </th>
              <th colSpan={6} className="px-3 py-1.5 border-r border-slate-300 text-purple-950 bg-purple-50/70 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <span>🏛️ 2. Gerencia General & Finanzas</span>
                  <span className="text-[9px] font-semibold text-purple-700 bg-purple-200/70 px-1.5 py-0.2 rounded font-normal normal-case">
                    (Tarifas Aut., Gastos, Margen % & SAR ISV)
                  </span>
                </span>
              </th>
              <th colSpan={5} className="px-3 py-1.5 border-r border-slate-300 text-emerald-950 bg-emerald-50/70 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <span>📈 3. Gerencia de Comercialización</span>
                  <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-200/70 px-1.5 py-0.2 rounded font-normal normal-case">
                    (Metas, Inscritos Reales & Canales)
                  </span>
                </span>
              </th>
              <th colSpan={4} className="px-3 py-1.5 border-r border-slate-300 text-slate-900 bg-slate-200/70 uppercase tracking-wider">
                💰 4. Liquidación & Utilidad Consolidada
              </th>
              <th colSpan={4} className="px-3 py-1.5 text-slate-700 uppercase tracking-wider bg-slate-100">
                ⚙️ 5. Acciones
              </th>
            </tr>

            {/* Fila de Columnas exactas de la Hoja de Cálculo */}
            <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-300 select-none whitespace-nowrap">
              
              {/* ID */}
              <th 
                onClick={() => handleOrdenar('id')}
                className="px-2.5 py-2.5 cursor-pointer hover:bg-slate-200 border-r border-slate-200 text-center w-12"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>ID</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* Nombre del Proyecto */}
              <th 
                onClick={() => handleOrdenar('nombreProyecto')}
                className="px-3 py-2.5 cursor-pointer hover:bg-slate-200 border-r border-slate-200 min-w-[180px]"
              >
                <div className="flex items-center gap-1">
                  <span>Nombre del Proyecto</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* Objetivo General */}
              <th className="px-3 py-2.5 border-r border-slate-200 min-w-[200px]">
                Objetivo General
              </th>

              {/* Nombre del Docente */}
              <th 
                onClick={() => handleOrdenar('nombreDocente')}
                className="px-3 py-2.5 cursor-pointer hover:bg-slate-200 border-r border-slate-200 min-w-[140px]"
              >
                <div className="flex items-center gap-1">
                  <span>Nombre Docente</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* Tipo */}
              <th className="px-2.5 py-2.5 border-r border-slate-200 text-center">Tipo</th>

              {/* Nivel */}
              <th className="px-2.5 py-2.5 border-r border-slate-200 text-center">Nivel</th>

              {/* Fecha Programación */}
              <th className="px-2.5 py-2.5 border-r border-slate-300 text-center">Fecha Prog.</th>

              {/* Horas de Clase */}
              <th className="px-2.5 py-2.5 border-r border-slate-200 text-center bg-amber-50/30">Horas</th>

              {/* Costo Docente (200 lps) */}
              <th className="px-3 py-2.5 border-r border-slate-200 text-right bg-amber-50/30">
                Costo Docente
              </th>

              {/* Costo Zoom */}
              <th className="px-2.5 py-2.5 border-r border-slate-200 text-right bg-amber-50/30">Zoom</th>

              {/* Papelería */}
              <th className="px-2.5 py-2.5 border-r border-slate-200 text-right bg-amber-50/30">Papelería</th>

              {/* Gastos Varios */}
              <th className="px-2.5 py-2.5 border-r border-slate-200 text-right bg-amber-50/30">Varios</th>

              {/* Gasto Total Operativo */}
              <th 
                onClick={() => handleOrdenar('gastoTotalOperativo')}
                className="px-3 py-2.5 cursor-pointer hover:bg-amber-100 border-r border-slate-300 text-right font-bold text-amber-900 bg-amber-100/60"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Gasto Total Operativo</span>
                  <ArrowUpDown className="w-3 h-3 text-amber-600" />
                </div>
              </th>

              {/* Margen de Ganancia Operativa */}
              <th className="px-2.5 py-2.5 border-r border-slate-200 text-center bg-blue-50/30">Margen %</th>

              {/* Precio de Venta Requerido */}
              <th className="px-3 py-2.5 border-r border-slate-200 text-right bg-blue-50/30 font-semibold">
                Venta Requerida
              </th>

              {/* Ganancia Operativa */}
              <th className="px-3 py-2.5 border-r border-slate-200 text-right bg-blue-50/30">
                Ganancia Op.
              </th>

              {/* Alumnos Proyectados */}
              <th className="px-2.5 py-2.5 border-r border-slate-200 text-center bg-blue-50/30">Alum. Proy.</th>

              {/* Precio Sugerido Costo Alumno */}
              <th 
                onClick={() => handleOrdenar('precioSugeridoAlumno')}
                className="px-3 py-2.5 cursor-pointer hover:bg-blue-100 border-r border-slate-300 text-right font-bold text-blue-900 bg-blue-100/60"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Precio Sug. / Alumno</span>
                  <ArrowUpDown className="w-3 h-3 text-blue-600" />
                </div>
              </th>

              {/* Alumnos Final */}
              <th 
                onClick={() => handleOrdenar('alumnosFinal')}
                className="px-2.5 py-2.5 cursor-pointer hover:bg-emerald-100 border-r border-slate-200 text-center font-bold bg-emerald-50/40"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Alum. Final</span>
                  <ArrowUpDown className="w-3 h-3 text-emerald-600" />
                </div>
              </th>

              {/* Diferencia Alumnos */}
              <th className="px-2.5 py-2.5 border-r border-slate-200 text-center bg-emerald-50/40">Dif.</th>

              {/* Ganancia Alumnos Adicionales */}
              <th className="px-3 py-2.5 border-r border-slate-200 text-right bg-emerald-50/40">
                Ganancia Adic.
              </th>

              {/* TOTAL GANANCIAS FINALES */}
              <th 
                onClick={() => handleOrdenar('totalGananciasFinales')}
                className="px-3 py-2.5 cursor-pointer hover:bg-emerald-200 border-r border-slate-300 text-right font-black text-emerald-950 bg-emerald-200/70"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>TOTAL GANANCIAS</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-emerald-800" />
                </div>
              </th>

              {/* Método Venta */}
              <th className="px-2.5 py-2.5 border-r border-slate-200">Método Venta</th>

              {/* Se llevó a cabo */}
              <th className="px-3 py-2.5 border-r border-slate-200 text-center">Se llevó a cabo</th>

              {/* Observaciones */}
              <th className="px-3 py-2.5 border-r border-slate-200 min-w-[150px]">Observaciones</th>

              {/* Acciones */}
              <th className="px-3 py-2.5 text-center sticky right-0 bg-slate-50 shadow-xs">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 text-slate-800">
            {proyectosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={27} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Info className="w-6 h-6 text-slate-400" />
                    <p className="font-semibold text-slate-700">
                      {proyectos.length === 0 ? 'No hay proyectos registrados aún' : 'No se encontraron proyectos con los filtros aplicados'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {proyectos.length === 0 
                        ? 'La matriz está lista. Los nuevos proyectos y programas formativos se crean desde el módulo 1. Gerencia Académica.' 
                        : 'Intenta cambiar los filtros de búsqueda o restablecer los criterios.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              proyectosFiltrados.map((p, index) => {
                const esRentable = p.totalGananciasFinales >= 0;
                return (
                  <tr 
                    key={p.id} 
                    id={`fila-proyecto-${p.id}`}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    
                    {/* ID & Correlativo */}
                    <td className="px-2 py-2 text-center border-r border-slate-200">
                      <div className="flex flex-col items-center">
                        <span className="font-mono font-bold text-blue-800 bg-blue-50/90 border border-blue-200 px-1.5 py-0.5 rounded text-[11px]">
                          #{String(p.numeroCorrelativo || p.id).padStart(3, '0')}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono mt-0.5 whitespace-nowrap">
                          {p.codigoPrograma || `SUM-2026-${String(p.numeroCorrelativo || p.id).padStart(3, '0')}`}
                        </span>
                      </div>
                    </td>

                    {/* Nombre del Proyecto */}
                    <td className="px-3 py-2 font-bold text-slate-900 border-r border-slate-200">
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => onVerDetalle(p)}
                          className="text-left hover:text-emerald-600 hover:underline flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                        >
                          <span>{p.nombreProyecto}</span>
                        </button>
                        <div className="flex items-center gap-1 flex-wrap">
                          {p.aplicaISV ? (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-1 py-0.2 rounded" title="Servicio gravado con 15% ISV ante el SAR">
                              ISV 15%
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1 py-0.2 rounded" title="Educación formal / acreditada - Exento ISV por Ley SAR">
                              Exento ISV (0%)
                            </span>
                          )}
                          <span className="text-[9px] text-slate-400 font-mono" title="Correlativo de Control Fiscal SAR">
                            {p.codigoFiscalSAR || `SAR-ISV-2026-${String(p.numeroCorrelativo || p.id).padStart(3, '0')}`}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Objetivo General */}
                    <td className="px-3 py-2 text-slate-600 border-r border-slate-200 max-w-[220px] truncate" title={p.objetivoGeneral}>
                      {p.objetivoGeneral || <span className="text-slate-300 italic">Sin objetivo</span>}
                    </td>

                    {/* Nombre del Docente */}
                    <td className="px-3 py-2 font-medium text-slate-800 border-r border-slate-200">
                      {p.nombreDocente}
                    </td>

                    {/* Tipo */}
                    <td className="px-2.5 py-2 text-center border-r border-slate-200">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {p.tipoProyecto}
                      </span>
                    </td>

                    {/* Nivel */}
                    <td className="px-2.5 py-2 text-center text-slate-600 border-r border-slate-200 text-[11px]">
                      {p.nivel}
                    </td>

                    {/* Fecha Programación */}
                    <td className="px-2.5 py-2 text-center text-slate-600 font-mono text-[11px] border-r border-slate-300">
                      {p.fechaProgramacion}
                    </td>

                    {/* Horas de Clase */}
                    <td className="px-2.5 py-2 text-center font-mono text-slate-700 bg-amber-50/20 border-r border-slate-200">
                      {p.horasClase} h
                    </td>

                    {/* Costo Docente */}
                    <td className="px-3 py-2 text-right font-mono text-slate-700 bg-amber-50/20 border-r border-slate-200">
                      {formatearMoneda(p.costoDocenteCalculado, moneda)}
                    </td>

                    {/* Costo Zoom */}
                    <td className="px-2.5 py-2 text-right font-mono text-slate-600 bg-amber-50/20 border-r border-slate-200">
                      {formatearMoneda(p.costoZoom, moneda)}
                    </td>

                    {/* Papelería */}
                    <td className="px-2.5 py-2 text-right font-mono text-slate-600 bg-amber-50/20 border-r border-slate-200">
                      {formatearMoneda(p.costoPapeleria, moneda)}
                    </td>

                    {/* Gastos Varios */}
                    <td className="px-2.5 py-2 text-right font-mono text-slate-600 bg-amber-50/20 border-r border-slate-200">
                      {formatearMoneda(p.gastosVarios, moneda)}
                    </td>

                    {/* Gasto Total Operativo */}
                    <td className="px-3 py-2 text-right font-mono font-bold text-amber-900 bg-amber-100/40 border-r border-slate-300">
                      {formatearMoneda(p.gastoTotalOperativo, moneda)}
                    </td>

                    {/* Margen de Ganancia Operativa */}
                    <td className="px-2.5 py-2 text-center font-mono font-semibold text-blue-700 bg-blue-50/20 border-r border-slate-200">
                      {p.margenGananciaOperativa}%
                    </td>

                    {/* Precio de Venta Requerido */}
                    <td className="px-3 py-2 text-right font-mono font-semibold text-slate-800 bg-blue-50/20 border-r border-slate-200">
                      <div>{formatearMoneda(p.precioVentaRequerido, moneda)}</div>
                      {p.aplicaISV && (
                        <div className="text-[10px] font-medium text-amber-700 font-mono" title="Venta requerida total del curso con 15% ISV">
                          +15% ISV: {formatearMoneda(p.precioVentaRequeridoConISV || (p.precioVentaRequerido * 1.15), moneda)}
                        </div>
                      )}
                    </td>

                    {/* Ganancia Operativa */}
                    <td className="px-3 py-2 text-right font-mono text-emerald-700 bg-blue-50/20 border-r border-slate-200">
                      {formatearMoneda(p.gananciaOperativa, moneda)}
                    </td>

                    {/* Alumnos Proyectados */}
                    <td className="px-2.5 py-2 text-center font-mono font-semibold text-slate-700 bg-blue-50/20 border-r border-slate-200">
                      {p.alumnosProyectados}
                    </td>

                    {/* Precio Sugerido Costo Alumno */}
                    <td className="px-3 py-2 text-right font-mono font-bold text-blue-900 bg-blue-100/40 border-r border-slate-300">
                      <div>{formatearMoneda(p.precioSugeridoAlumno, moneda)}</div>
                      {p.aplicaISV && p.precioSugeridoConISV && (
                        <div className="text-[10px] font-normal text-amber-800" title="Precio total con 15% de ISV incluido">
                          c/ ISV: {formatearMoneda(p.precioSugeridoConISV, moneda)}
                        </div>
                      )}
                    </td>

                    {/* Alumnos Final (Con edición rápida o visual) */}
                    <td className="px-2.5 py-2 text-center font-mono font-bold text-slate-900 bg-emerald-50/30 border-r border-slate-200">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          min="4"
                          value={p.alumnosFinal}
                          onChange={(e) => onActualizarRapido(p.id, 'alumnosFinal', Math.max(4, Number(e.target.value)))}
                          className="w-12 text-center bg-white border border-slate-300 rounded py-0.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          title="Haz clic para modificar alumnos reales (Mínimo: 4)"
                        />
                      </div>
                    </td>

                    {/* Diferencia Alumnos */}
                    <td className="px-2.5 py-2 text-center font-mono font-bold border-r border-slate-200 bg-emerald-50/30">
                      <span className={`px-1.5 py-0.5 rounded text-[11px] ${
                        p.diferenciaAlumnos > 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.diferenciaAlumnos < 0
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {p.diferenciaAlumnos > 0 ? `+${p.diferenciaAlumnos}` : p.diferenciaAlumnos}
                      </span>
                    </td>

                    {/* Ganancia por Alumnos Adicionales */}
                    <td className="px-3 py-2 text-right font-mono text-slate-700 bg-emerald-50/30 border-r border-slate-200">
                      {formatearMoneda(p.gananciaAlumnosAdicionales, moneda)}
                    </td>

                    {/* TOTAL GANANCIAS FINALES */}
                    <td className={`px-3 py-2 text-right font-mono font-black border-r border-slate-300 ${
                      esRentable 
                        ? 'text-emerald-800 bg-emerald-100/80' 
                        : 'text-rose-800 bg-rose-100/80'
                    }`}>
                      {formatearMoneda(p.totalGananciasFinales, moneda)}
                    </td>

                    {/* Método Venta */}
                    <td className="px-2.5 py-2 text-slate-600 text-[11px] border-r border-slate-200 truncate max-w-[130px]" title={p.metodoVenta}>
                      {p.metodoVenta}
                    </td>

                    {/* Se llevó a cabo */}
                    <td className="px-3 py-2 text-center border-r border-slate-200 whitespace-nowrap">
                      <div className="flex flex-col items-center gap-0.5">
                        {getEstadoBadge(p.seLlevoACabo)}
                        {p.decisionPlazoVenta === 'Si' && (
                          <span className="text-[9px] font-bold text-emerald-700 font-mono bg-emerald-50 px-1 rounded border border-emerald-200" title={p.fechaRegistroDecision ? `Decisión SÍ registrada: ${p.fechaRegistroDecision} ${p.horaRegistroDecision || ''}` : 'Continúa en proceso'}>
                            SÍ (Continúa)
                          </span>
                        )}
                        {p.decisionPlazoVenta === 'No' && (
                          <span className="text-[9px] font-bold text-rose-700 font-mono bg-rose-50 px-1 rounded border border-rose-200" title={p.fechaRegistroDecision ? `Decisión NO registrada: ${p.fechaRegistroDecision} ${p.horaRegistroDecision || ''}` : 'Cerrado formalmente'}>
                            NO (Cerrado)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Observaciones */}
                    <td className="px-3 py-2 text-slate-500 text-[11px] border-r border-slate-200 max-w-[160px] truncate" title={p.observaciones}>
                      {p.observaciones || '—'}
                    </td>

                    {/* Acciones */}
                    <td className="px-3 py-2 text-center sticky right-0 bg-white group-hover:bg-slate-50 transition-colors shadow-xs">
                      <div className="flex items-center justify-center gap-1">
                        {onExportarPDF && (
                          <button
                            id={`btn-pdf-${p.id}`}
                            onClick={() => onExportarPDF(p)}
                            className="p-1 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                            title="Exportar Reporte Ejecutivo PDF"
                          >
                            <FileText className="w-3.5 h-3.5 text-rose-600" />
                          </button>
                        )}
                        <button
                          id={`btn-detalle-${p.id}`}
                          onClick={() => onVerDetalle(p)}
                          className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                          title="Ver Análisis y Simulador de Alumnos"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`btn-editar-${p.id}`}
                          onClick={() => onEditar(p)}
                          className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                          title="Editar Proyecto"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`btn-duplicar-${p.id}`}
                          onClick={() => onDuplicar(p)}
                          className="p-1 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors"
                          title="Duplicar Proyecto"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`btn-eliminar-${p.id}`}
                          onClick={() => onEliminar(p.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Eliminar Proyecto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>

          {/* Fila de Totales / Resumen consolidado */}
          {proyectosFiltrados.length > 0 && (
            <tfoot>
              <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300 select-none whitespace-nowrap">
                <td className="px-2.5 py-3 text-center text-xs font-black border-r border-slate-300">
                  TOTAL
                </td>
                <td colSpan={6} className="px-3 py-3 text-slate-700 font-bold border-r border-slate-300">
                  {proyectosFiltrados.length} Proyectos Evaluados
                </td>
                
                {/* Horas */}
                <td className="px-2.5 py-3 text-center font-mono border-r border-slate-200 bg-amber-100/50">
                  {totalHoras} h
                </td>

                {/* Costo Docente */}
                <td className="px-3 py-3 text-right font-mono border-r border-slate-200 bg-amber-100/50">
                  {formatearMoneda(totalCostoDocente, moneda)}
                </td>

                {/* Zoom */}
                <td className="px-2.5 py-3 text-right font-mono border-r border-slate-200 bg-amber-100/50">
                  {formatearMoneda(totalZoom, moneda)}
                </td>

                {/* Papeleria */}
                <td className="px-2.5 py-3 text-right font-mono border-r border-slate-200 bg-amber-100/50">
                  {formatearMoneda(totalPapeleria, moneda)}
                </td>

                {/* Varios */}
                <td className="px-2.5 py-3 text-right font-mono border-r border-slate-200 bg-amber-100/50">
                  {formatearMoneda(totalGastosVarios, moneda)}
                </td>

                {/* Gasto Total Operativo */}
                <td className="px-3 py-3 text-right font-mono font-black text-amber-950 bg-amber-200/80 border-r border-slate-300">
                  {formatearMoneda(totalGastoOp, moneda)}
                </td>

                {/* Margen Promedio */}
                <td className="px-2.5 py-3 text-center font-mono border-r border-slate-200 bg-blue-100/50">
                  {(proyectosFiltrados.reduce((acc, p) => acc + p.margenGananciaOperativa, 0) / proyectosFiltrados.length).toFixed(0)}%
                </td>

                {/* Venta Requerida */}
                <td className="px-3 py-3 text-right font-mono border-r border-slate-200 bg-blue-100/50">
                  {formatearMoneda(totalPrecioVentaReq, moneda)}
                </td>

                {/* Ganancia Op */}
                <td className="px-3 py-3 text-right font-mono text-emerald-800 border-r border-slate-200 bg-blue-100/50">
                  {formatearMoneda(totalGananciaOp, moneda)}
                </td>

                {/* Alumnos Proy */}
                <td className="px-2.5 py-3 text-center font-mono border-r border-slate-200 bg-blue-100/50">
                  {totalAlumnosProy}
                </td>

                {/* Precio Sugerido Promedio */}
                <td className="px-3 py-3 text-right font-mono font-bold text-blue-950 bg-blue-200/70 border-r border-slate-300">
                  —
                </td>

                {/* Alumnos Final */}
                <td className="px-2.5 py-3 text-center font-mono font-black text-slate-900 border-r border-slate-200 bg-emerald-100/60">
                  {totalAlumnosFin}
                </td>

                {/* Diferencia Alumnos */}
                <td className="px-2.5 py-3 text-center font-mono font-black border-r border-slate-200 bg-emerald-100/60">
                  {totalAlumnosFin - totalAlumnosProy > 0 ? `+${totalAlumnosFin - totalAlumnosProy}` : totalAlumnosFin - totalAlumnosProy}
                </td>

                {/* Ganancia Adicionales */}
                <td className="px-3 py-3 text-right font-mono text-emerald-800 border-r border-slate-200 bg-emerald-100/60">
                  {formatearMoneda(totalGananciaAdicional, moneda)}
                </td>

                {/* TOTAL GANANCIAS FINALES */}
                <td className={`px-3 py-3 text-right font-mono text-sm font-black border-r border-slate-300 ${
                  totalGananciasFin >= 0 ? 'text-emerald-950 bg-emerald-300/80' : 'text-rose-950 bg-rose-300/80'
                }`}>
                  {formatearMoneda(totalGananciasFin, moneda)}
                </td>

                <td colSpan={4} className="px-3 py-3 text-xs text-slate-500 font-normal">
                  Consolidado financiero en tiempo real
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

    </div>
  );
};
