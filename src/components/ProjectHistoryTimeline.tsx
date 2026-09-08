import React, { useState } from 'react';
import { 
  History, 
  Plus, 
  DollarSign, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Sparkles, 
  FileText, 
  Filter, 
  ArrowRight, 
  User, 
  Layers, 
  Send,
  HelpCircle,
  Tag,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Download,
  FileCheck
} from 'lucide-react';
import { 
  ProyectoEducativo, 
  HistorialCambioProyecto, 
  TipoCambioHistorial, 
  Moneda 
} from '../types';
import { formatearMoneda } from '../utils/calculations';
import { formatearFechaHistorial, crearEntradaHistorialManual } from '../utils/historyUtils';
import { ProjectAuditReportModal } from './ProjectAuditReportModal';

interface ProjectHistoryTimelineProps {
  proyecto: ProyectoEducativo;
  moneda: Moneda;
  onAgregarHistorial?: (entrada: HistorialCambioProyecto) => void;
  onAbrirReporteAuditoria?: () => void;
}

export const ProjectHistoryTimeline: React.FC<ProjectHistoryTimelineProps> = ({
  proyecto,
  moneda,
  onAgregarHistorial,
  onAbrirReporteAuditoria,
}) => {
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [mostrarFormularioNota, setMostrarFormularioNota] = useState<boolean>(false);
  const [modalAuditoriaAbierto, setModalAuditoriaAbierto] = useState<boolean>(false);
  const [tituloNota, setTituloNota] = useState<string>('');
  const [descripcionNota, setDescripcionNota] = useState<string>('');
  const [tipoNota, setTipoNota] = useState<TipoCambioHistorial>('manual');
  const [autorNota, setAutorNota] = useState<string>('Coordinación Financiera');
  const [expandirTodos, setExpandirTodos] = useState<boolean>(true);

  const historial = proyecto.historialCambios || [];

  // Filtrado de eventos
  const historialFiltrado = historial.filter((item) => {
    if (filtroTipo === 'todos') return true;
    if (filtroTipo === 'costos') return item.tipoCambio === 'costos';
    if (filtroTipo === 'proyeccion') return item.tipoCambio === 'proyeccion';
    if (filtroTipo === 'margen_precio') return item.tipoCambio === 'margen_precio';
    if (filtroTipo === 'estado') return item.tipoCambio === 'estado';
    if (filtroTipo === 'manual') return item.tipoCambio === 'manual';
    return true;
  });

  const handleGuardarNotaManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tituloNota.trim() || !descripcionNota.trim()) return;

    if (onAgregarHistorial) {
      const nuevaEntrada = crearEntradaHistorialManual(
        tituloNota.trim(),
        descripcionNota.trim(),
        tipoNota,
        autorNota.trim() || 'Dirección Financiera'
      );
      onAgregarHistorial(nuevaEntrada);
      setTituloNota('');
      setDescripcionNota('');
      setMostrarFormularioNota(false);
    }
  };

  const obtenerIconoTipo = (tipo: TipoCambioHistorial) => {
    switch (tipo) {
      case 'creacion':
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
      case 'costos':
        return <DollarSign className="w-4 h-4 text-amber-600" />;
      case 'proyeccion':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'margen_precio':
        return <TrendingUp className="w-4 h-4 text-indigo-600" />;
      case 'estado':
        return <CheckCircle2 className="w-4 h-4 text-teal-600" />;
      case 'docente':
        return <User className="w-4 h-4 text-purple-600" />;
      case 'manual':
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  const obtenerBadgeTipo = (tipo: TipoCambioHistorial) => {
    switch (tipo) {
      case 'creacion':
        return { label: 'Creación Inicial', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'costos':
        return { label: 'Ajuste de Costos', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'proyeccion':
        return { label: 'Proyección / Alumnos', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'margen_precio':
        return { label: 'Margen y Precios', bg: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
      case 'estado':
        return { label: 'Estado de Proyecto', bg: 'bg-teal-100 text-teal-800 border-teal-300' };
      case 'docente':
        return { label: 'Docencia / General', bg: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'manual':
      default:
        return { label: 'Nota de Auditoría', bg: 'bg-slate-100 text-slate-800 border-slate-300' };
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Barra de Controles y Resumen de Auditoría */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Historial de Auditoría y Ajustes ({historial.length} registros)
            </h4>
            <p className="text-[11px] text-slate-500">
              Trazabilidad cronológica de variaciones en costos, metas de alumnos y rentabilidad
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-abrir-reporte-auditoria-pdf"
            type="button"
            onClick={() => {
              if (onAbrirReporteAuditoria) {
                onAbrirReporteAuditoria();
              } else {
                setModalAuditoriaAbierto(true);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
            title="Generar Reporte de Auditoría detallado en PDF (Historial de cambios, notas del auditor y cronología de estados)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-200" />
            <span>Reporte de Auditoría (PDF)</span>
          </button>

          {onAgregarHistorial && (
            <button
              id="btn-nueva-nota-historial"
              onClick={() => setMostrarFormularioNota(!mostrarFormularioNota)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>{mostrarFormularioNota ? 'Cancelar Nota' : 'Añadir Nota de Ajuste'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Banner de Auditoría y Trazabilidad */}
      <div className="bg-linear-to-r from-blue-900 to-slate-900 text-white rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500/30 border border-blue-400/30 flex items-center justify-center shrink-0">
            <FileCheck className="w-4 h-4 text-blue-300" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">
              Expediente Oficial de Auditoría & Trazabilidad
            </div>
            <div className="text-[11px] text-slate-300">
              Genera el informe oficial en PDF con la cronología de estados por los que ha pasado este proyecto, notas del auditor y registro de modificaciones.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (onAbrirReporteAuditoria) {
              onAbrirReporteAuditoria();
            } else {
              setModalAuditoriaAbierto(true);
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer self-start sm:self-center"
        >
          <Download className="w-3.5 h-3.5 text-slate-900" />
          <span>Descargar PDF</span>
        </button>
      </div>

      {/* Formulario Desplegable para Agregar Nota de Ajuste Manual */}
      {mostrarFormularioNota && (
        <form 
          id="form-nota-auditoria"
          onSubmit={handleGuardarNotaManual}
          className="bg-white border-2 border-emerald-500/40 rounded-xl p-4 shadow-sm space-y-3 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-600" />
              Registrar Nota / Justificación de Ajuste Financiero
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Fecha: {new Date().toLocaleDateString('es-ES')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Tipo de Ajuste
              </label>
              <select
                value={tipoNota}
                onChange={(e) => setTipoNota(e.target.value as TipoCambioHistorial)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
              >
                <option value="costos">Ajuste de Costos Operativos o Honorarios</option>
                <option value="proyeccion">Ajuste de Metas de Alumnos o Cierre</option>
                <option value="margen_precio">Revisión de Precios o Margen Deseado</option>
                <option value="estado">Cambio de Estado o Fecha</option>
                <option value="docente">Acuerdo con Docente Titular</option>
                <option value="manual">Nota General de Auditoría Financiera</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Responsable / Autor del Ajuste
              </label>
              <input
                type="text"
                value={autorNota}
                onChange={(e) => setAutorNota(e.target.value)}
                placeholder="Ej: Dirección Académica, Docente..."
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Título Breve del Cambio o Evento
            </label>
            <input
              type="text"
              value={tituloNota}
              onChange={(e) => setTituloNota(e.target.value)}
              placeholder="Ej: Autorización de horas adicionales por taller intensivo"
              className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Detalle y Justificación
            </label>
            <textarea
              value={descripcionNota}
              onChange={(e) => setDescripcionNota(e.target.value)}
              placeholder="Especifique el motivo del cambio, acuerdos comerciales o impacto esperado en la rentabilidad..."
              rows={2}
              className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setMostrarFormularioNota(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Guardar en Historial</span>
            </button>
          </div>
        </form>
      )}

      {/* Chips de Filtrado Rápido */}
      <div className="flex flex-wrap items-center gap-1.5 pb-1 border-b border-slate-200">
        <span className="text-[11px] font-bold text-slate-500 uppercase mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3" />
          Filtrar:
        </span>
        <button
          onClick={() => setFiltroTipo('todos')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
            filtroTipo === 'todos'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Todos ({historial.length})
        </button>
        <button
          onClick={() => setFiltroTipo('costos')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
            filtroTipo === 'costos'
              ? 'bg-amber-700 text-white'
              : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
          }`}
        >
          Costos ({historial.filter(h => h.tipoCambio === 'costos').length})
        </button>
        <button
          onClick={() => setFiltroTipo('proyeccion')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
            filtroTipo === 'proyeccion'
              ? 'bg-blue-700 text-white'
              : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
          }`}
        >
          Alumnos / Meta ({historial.filter(h => h.tipoCambio === 'proyeccion').length})
        </button>
        <button
          onClick={() => setFiltroTipo('margen_precio')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
            filtroTipo === 'margen_precio'
              ? 'bg-indigo-700 text-white'
              : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
          }`}
        >
          Márgenes ({historial.filter(h => h.tipoCambio === 'margen_precio').length})
        </button>
        <button
          onClick={() => setFiltroTipo('estado')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
            filtroTipo === 'estado'
              ? 'bg-teal-700 text-white'
              : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
          }`}
        >
          Estado ({historial.filter(h => h.tipoCambio === 'estado').length})
        </button>
        <button
          onClick={() => setFiltroTipo('manual')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
            filtroTipo === 'manual'
              ? 'bg-slate-700 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Notas ({historial.filter(h => h.tipoCambio === 'manual').length})
        </button>
      </div>

      {/* Línea de Tiempo de Cambios */}
      {historialFiltrado.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300 p-6">
          <History className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
          <h5 className="text-xs font-bold text-slate-700">Sin registros para este filtro</h5>
          <p className="text-[11px] text-slate-500 mt-0.5">
            No se han registrado modificaciones en esta categoría específica.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-3 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          
          {historialFiltrado.map((item, index) => {
            const badge = obtenerBadgeTipo(item.tipoCambio);
            const deltaGasto = item.impactoFinanciero 
              ? item.impactoFinanciero.gastoOperativoNuevo - item.impactoFinanciero.gastoOperativoAnterior 
              : 0;
            const deltaPrecio = item.impactoFinanciero 
              ? item.impactoFinanciero.precioSugeridoNuevo - item.impactoFinanciero.precioSugeridoAnterior 
              : 0;
            const deltaGanancia = item.impactoFinanciero 
              ? item.impactoFinanciero.gananciaFinalNueva - item.impactoFinanciero.gananciaFinalAnterior 
              : 0;

            return (
              <div 
                key={item.id || index}
                id={`historial-item-${item.id || index}`}
                className="relative group"
              >
                {/* Nodo de la línea de tiempo */}
                <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-slate-300 group-hover:border-emerald-500 flex items-center justify-center shadow-xs transition-colors">
                  {obtenerIconoTipo(item.tipoCambio)}
                </div>

                {/* Tarjeta del Registro */}
                <div className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-4 shadow-2xs hover:shadow-xs transition-all space-y-3">
                  
                  {/* Encabezado del Evento */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badge.bg}`}>
                        {badge.label}
                      </span>
                      <h5 className="text-xs font-bold text-slate-900">
                        {item.titulo}
                      </h5>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <User className="w-3 h-3 text-slate-400" />
                        {item.usuario || 'Sistema'}
                      </span>
                      <span>•</span>
                      <span>{formatearFechaHistorial(item.fecha)}</span>
                    </div>
                  </div>

                  {/* Descripción Textual */}
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.descripcion}
                  </p>

                  {/* Tabla de Modificaciones de Campos (Diff de valores) */}
                  {item.modificaciones && item.modificaciones.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Valores Modificados:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {item.modificaciones.map((mod, mIdx) => (
                          <div 
                            key={mIdx}
                            className="bg-white p-2 rounded border border-slate-200 text-xs flex items-center justify-between"
                          >
                            <span className="text-[11px] font-medium text-slate-600">
                              {mod.etiqueta}:
                            </span>
                            <div className="flex items-center gap-1.5 font-mono text-[11px]">
                              <span className="text-slate-400 line-through">
                                {mod.tipo === 'moneda' 
                                  ? formatearMoneda(Number(mod.valorAnterior) || 0, moneda)
                                  : mod.valorAnterior}
                              </span>
                              <ArrowRight className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span className="font-bold text-slate-900">
                                {mod.tipo === 'moneda' 
                                  ? formatearMoneda(Number(mod.valorNuevo) || 0, moneda)
                                  : mod.valorNuevo}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Impacto Financiero Calculado (Delta) */}
                  {item.impactoFinanciero && item.tipoCambio !== 'creacion' && (
                    <div className="border-t border-slate-100 pt-2.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                        Impacto en Métricas Clave de Rentabilidad:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        
                        {/* Gasto Total */}
                        <div className="bg-amber-50/60 border border-amber-200 rounded p-2 text-center">
                          <span className="text-[9px] font-bold text-amber-800 uppercase block">Gasto Operativo</span>
                          <span className="text-xs font-bold font-mono text-amber-950 block">
                            {formatearMoneda(item.impactoFinanciero.gastoOperativoNuevo, moneda)}
                          </span>
                          {deltaGasto !== 0 && (
                            <span className={`text-[10px] font-mono font-semibold ${deltaGasto > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {deltaGasto > 0 ? '+' : ''}{formatearMoneda(deltaGasto, moneda)}
                            </span>
                          )}
                        </div>

                        {/* Precio Sugerido */}
                        <div className="bg-blue-50/60 border border-blue-200 rounded p-2 text-center">
                          <span className="text-[9px] font-bold text-blue-800 uppercase block">Precio Sugerido</span>
                          <span className="text-xs font-bold font-mono text-blue-950 block">
                            {formatearMoneda(item.impactoFinanciero.precioSugeridoNuevo, moneda)}
                          </span>
                          {deltaPrecio !== 0 && (
                            <span className="text-[10px] font-mono font-semibold text-blue-700">
                              {deltaPrecio > 0 ? '+' : ''}{formatearMoneda(deltaPrecio, moneda)}
                            </span>
                          )}
                        </div>

                        {/* Ganancia Neta Final */}
                        <div className="bg-emerald-50/60 border border-emerald-200 rounded p-2 text-center">
                          <span className="text-[9px] font-bold text-emerald-800 uppercase block">Ganancia Final</span>
                          <span className="text-xs font-bold font-mono text-emerald-950 block">
                            {formatearMoneda(item.impactoFinanciero.gananciaFinalNueva, moneda)}
                          </span>
                          {deltaGanancia !== 0 && (
                            <span className={`text-[10px] font-mono font-semibold ${deltaGanancia >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {deltaGanancia > 0 ? '+' : ''}{formatearMoneda(deltaGanancia, moneda)}
                            </span>
                          )}
                        </div>

                        {/* Punto de Equilibrio */}
                        <div className="bg-slate-100 border border-slate-200 rounded p-2 text-center">
                          <span className="text-[9px] font-bold text-slate-700 uppercase block">Pto. Equilibrio</span>
                          <span className="text-xs font-bold font-mono text-slate-900 block">
                            {item.impactoFinanciero.puntoEquilibrioNuevo} alumnos
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Ant: {item.impactoFinanciero.puntoEquilibrioAnterior}
                          </span>
                        </div>

                      </div>
                    </div>
                  )}

                </div>
              </div>
            );
          })}

        </div>
      )}

      {/* Modal del Reporte Detallado de Auditoría en PDF */}
      <ProjectAuditReportModal
        isOpen={modalAuditoriaAbierto}
        onClose={() => setModalAuditoriaAbierto(false)}
        proyecto={proyecto}
        moneda={moneda}
      />

    </div>
  );
};
