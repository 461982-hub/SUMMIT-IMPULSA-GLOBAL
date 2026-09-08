import React, { useState, useMemo } from 'react';
import { 
  Eye, 
  Edit3, 
  Trash2, 
  Copy, 
  Search, 
  Filter, 
  Users, 
  DollarSign, 
  Calendar, 
  Clock, 
  TrendingUp, 
  CheckCircle, 
  Layers, 
  AlertCircle,
  XCircle,
  FileText
} from 'lucide-react';
import { ProyectoEducativo, Moneda, EstadoProyecto } from '../types';
import { formatearMoneda } from '../utils/calculations';

interface CardsViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onEditar: (p: ProyectoEducativo) => void;
  onVerDetalle: (p: ProyectoEducativo) => void;
  onDuplicar: (p: ProyectoEducativo) => void;
  onEliminar: (p: ProyectoEducativo) => void;
  onExportarPDF?: (p: ProyectoEducativo) => void;
}

export const CardsView: React.FC<CardsViewProps> = ({
  proyectos,
  moneda,
  onEditar,
  onVerDetalle,
  onDuplicar,
  onEliminar,
  onExportarPDF,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  const proyectosFiltrados = useMemo(() => {
    return proyectos.filter((p) => {
      const matchBusqueda =
        p.nombreProyecto.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.nombreDocente.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.objetivoGeneral.toLowerCase().includes(busqueda.toLowerCase());

      const matchTipo = filtroTipo === 'todos' || p.tipoProyecto === filtroTipo;
      const matchEstado = filtroEstado === 'todos' || p.seLlevoACabo === filtroEstado;

      return matchBusqueda && matchTipo && matchEstado;
    });
  }, [proyectos, busqueda, filtroTipo, filtroEstado]);

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
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            {estado}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Controles de Búsqueda y Filtro */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-busqueda-cards"
            type="text"
            placeholder="Buscar por proyecto o docente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium"
          >
            <option value="todos">Todos los Tipos</option>
            <option value="CURSO">Cursos</option>
            <option value="TALLER">Talleres</option>
            <option value="DIPLOMADO">Diplomados</option>
            <option value="BOOTCAMP">Bootcamps</option>
            <option value="MASTERCLASS">Masterclasses</option>
            <option value="SEMINARIO">Seminarios</option>
          </select>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium"
          >
            <option value="todos">Todos los Estados</option>
            <option value="Sí">Sí (Realizados)</option>
            <option value="En curso">En curso</option>
            <option value="Planificado">Planificados</option>
            <option value="Pospuesto">Pospuestos</option>
            <option value="No">No / Cancelados</option>
          </select>
        </div>
      </div>

      {/* Grid de Tarjetas de Proyectos */}
      {proyectosFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <p className="font-semibold text-slate-700">
            {proyectos.length === 0 ? 'No hay fichas de proyectos aún' : 'No se encontraron proyectos con los filtros aplicados'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {proyectos.length === 0 ? 'Los programas formativos se crean y configuran desde el módulo 1. Gerencia Académica.' : 'Prueba cambiando el término de búsqueda o selecciona un proyecto.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {proyectosFiltrados.map((p) => {
            const esRentable = p.totalGananciasFinales >= 0;
            return (
              <div
                key={p.id}
                id={`card-proyecto-${p.id}`}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
              >
                {/* Header de la Tarjeta */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-blue-800 bg-blue-100/80 border border-blue-300 px-1.5 py-0.5 rounded text-[10px]">
                        #{String(p.numeroCorrelativo || p.id).padStart(3, '0')}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                        {p.tipoProyecto}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {p.codigoPrograma || `SUM-2026-${String(p.numeroCorrelativo || p.id).padStart(3, '0')}`}
                      </span>
                    </div>
                    {getEstadoBadge(p.seLlevoACabo)}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-2 line-clamp-1" title={p.nombreProyecto}>
                    {p.nombreProyecto}
                  </h3>

                  <div className="flex items-center justify-between text-xs text-slate-600 mt-1">
                    <span>Docente: <strong className="text-slate-800">{p.nombreDocente}</strong></span>
                    <span className="text-[10px] font-mono text-purple-800 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                      {p.codigoFiscalSAR || `SAR-ISV-2026-${String(p.numeroCorrelativo || p.id).padStart(3, '0')}`}
                    </span>
                  </div>
                </div>

                {/* Cuerpo con Métricas Clave */}
                <div className="p-4 space-y-3 flex-1">
                  {p.objetivoGeneral && (
                    <p className="text-xs text-slate-500 line-clamp-2 italic">
                      "{p.objetivoGeneral}"
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Gasto Operativo:</span>
                      <span className="font-mono font-bold text-amber-800 text-xs">
                        {formatearMoneda(p.gastoTotalOperativo, moneda)}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{p.horasClase} hrs de clase</span>
                    </div>

                    <div className="bg-blue-50/70 p-2.5 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-blue-700 block">Precio / Alumno:</span>
                        {p.aplicaISV ? (
                          <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1 rounded">15% ISV</span>
                        ) : (
                          <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1 rounded">Exento</span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-blue-900 text-xs">
                        {formatearMoneda(p.precioSugeridoAlumno, moneda)}
                      </span>
                      {p.aplicaISV && p.precioSugeridoConISV && (
                        <span className="text-[10px] text-amber-900 font-mono block">
                          Total c/ISV: {formatearMoneda(p.precioSugeridoConISV, moneda)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1.5 px-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-600 flex items-center gap-1 text-[11px]">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      Alumnos:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-800">
                        {p.alumnosFinal} <span className="text-slate-400 font-normal">/ {p.alumnosProyectados} proy.</span>
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        p.diferenciaAlumnos > 0 ? 'bg-emerald-100 text-emerald-800' : p.diferenciaAlumnos < 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {p.diferenciaAlumnos > 0 ? `+${p.diferenciaAlumnos}` : p.diferenciaAlumnos}
                      </span>
                    </div>
                  </div>

                  {/* Resultado Ganancia Final */}
                  <div className={`p-3 rounded-lg border flex items-center justify-between ${
                    esRentable ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider block">Total Ganancias</span>
                      <span className="text-base font-black font-mono">
                        {formatearMoneda(p.totalGananciasFinales, moneda)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] block opacity-80">P. Equilibrio</span>
                      <span className="text-xs font-mono font-bold">
                        {p.puntoEquilibrioAlumnos} alumnos
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer de Acciones */}
                <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 truncate max-w-[120px]">
                    {p.metodoVenta}
                  </span>

                  <div className="flex items-center gap-1">
                    {onExportarPDF && (
                      <button
                        onClick={() => onExportarPDF(p)}
                        className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Exportar Reporte Ejecutivo PDF"
                      >
                        <FileText className="w-4 h-4 text-rose-600" />
                      </button>
                    )}
                    <button
                      onClick={() => onVerDetalle(p)}
                      className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Ver Análisis y Sensibilidad"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditar(p)}
                      className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar Proyecto"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDuplicar(p)}
                      className="p-1.5 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Duplicar Proyecto"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEliminar(p)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Eliminar Proyecto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
