import React, { useState, useMemo } from 'react';
import { 
  X, 
  Clock, 
  GraduationCap, 
  Megaphone, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Check, 
  ArrowRight, 
  Building2, 
  Search, 
  Calendar, 
  DollarSign, 
  Users, 
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Info
} from 'lucide-react';
import { ProyectoEducativo, Moneda, VistaPrincipal } from '../types';
import { 
  obtenerNivelFlujo, 
  calcularCumplimientoAcademico, 
  calcularCumplimientoComercial, 
  calcularTiempoTranscurrido, 
  validarAprobacionGerenciaGeneral 
} from '../utils/workflowUtils';
import { formatearMoneda } from '../utils/calculations';
import { formatearHNL } from '../utils/poa2027Data';
import { emitirAprobacionFinalGerenciaGeneral } from '../utils/poaMonthlyTrackingUtils';
import { SummitLogo } from './SummitLogo';

interface WorkflowStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyectos: ProyectoEducativo[];
  proyectoInicialId?: string;
  moneda: Moneda;
  onGuardarProyecto: (p: ProyectoEducativo) => void;
  onNavegarGerencia?: (vista: VistaPrincipal) => void;
  vistaActual?: VistaPrincipal;
}

export const WorkflowStatusModal: React.FC<WorkflowStatusModalProps> = ({
  isOpen,
  onClose,
  proyectos,
  proyectoInicialId,
  moneda,
  onGuardarProyecto,
  onNavegarGerencia,
  vistaActual,
}) => {
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroNivel, setFiltroNivel] = useState<'todos' | '1' | '2' | '3' | '4'>('todos');
  const [proyectoSeleccionadoId, setProyectoSeleccionadoId] = useState<string>(() => {
    if (proyectoInicialId) return proyectoInicialId;
    return proyectos[0]?.id || '';
  });
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Proyecto activo seleccionado para auditar
  const proyectoActivo = useMemo(() => {
    const encontrado = proyectos.find(p => p.id === proyectoSeleccionadoId);
    return encontrado || proyectos[0] || null;
  }, [proyectos, proyectoSeleccionadoId]);

  // Diagnósticos y validaciones del proyecto activo
  const diagAcad = useMemo(() => {
    return proyectoActivo ? calcularCumplimientoAcademico(proyectoActivo) : null;
  }, [proyectoActivo]);

  const diagCom = useMemo(() => {
    return proyectoActivo ? calcularCumplimientoComercial(proyectoActivo) : null;
  }, [proyectoActivo]);

  const nivelInfo = useMemo(() => {
    return proyectoActivo ? obtenerNivelFlujo(proyectoActivo) : null;
  }, [proyectoActivo]);

  const tiempoInfo = useMemo(() => {
    return proyectoActivo ? calcularTiempoTranscurrido(proyectoActivo.fechaCreacion || proyectoActivo.fechaProgramacion) : null;
  }, [proyectoActivo]);

  const validacionGG = useMemo(() => {
    return proyectoActivo ? validarAprobacionGerenciaGeneral(proyectoActivo) : null;
  }, [proyectoActivo]);

  // Lista de proyectos filtrada para el selector lateral
  const proyectosFiltrados = useMemo(() => {
    return proyectos.filter(p => {
      const matchTexto = 
        p.nombreProyecto.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        p.nombreDocente.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        (p.codigoPrograma && p.codigoPrograma.toLowerCase().includes(filtroTexto.toLowerCase()));

      if (!matchTexto) return false;
      if (filtroNivel === 'todos') return true;

      const nivelP = obtenerNivelFlujo(p).nivel;
      return nivelP.toString() === filtroNivel;
    });
  }, [proyectos, filtroTexto, filtroNivel]);

  if (!isOpen) return null;

  // Acciones de autorización ágil inter-gerencial
  const handleAutorizarAcademica = () => {
    if (!proyectoActivo) return;
    const ahora = new Date().toISOString();
    const proyectoActualizado: ProyectoEducativo = {
      ...proyectoActivo,
      autorizacionAcademica: true,
      fechaAutorizacionAcademica: ahora,
      responsableAcademico: 'MSc. Elena Rostrán - Gerencia Académica',
      etapaFlujo: 'comercializacion',
      seLlevoACabo: proyectoActivo.seLlevoACabo === 'Planificado' ? 'Planificado' : proyectoActivo.seLlevoACabo,
    };
    onGuardarProyecto(proyectoActualizado);
    setMensajeExito(`¡Fase Académica autorizada para "${proyectoActivo.nombreProyecto}"! Se remitió a Gerencia de Comercialización.`);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  const handleAutorizarComercial = () => {
    if (!proyectoActivo) return;
    const ahora = new Date().toISOString();
    const proyectoActualizado: ProyectoEducativo = {
      ...proyectoActivo,
      autorizacionComercial: true,
      comercializacionCompletada: true,
      fechaAutorizacionComercial: ahora,
      responsableComercial: 'Lic. Carlos Mendoza - Gerencia Comercial',
      etapaFlujo: 'dictamen_general',
      seLlevoACabo: 'En proceso',
    };
    onGuardarProyecto(proyectoActualizado);
    setMensajeExito(`¡Fase Comercial autorizada para "${proyectoActivo.nombreProyecto}"! Remitido a Gerencia General para dictamen.`);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  const handleAprobarGerenciaGeneral = () => {
    if (!proyectoActivo) return;
    const proyectoAprobado = emitirAprobacionFinalGerenciaGeneral(
      proyectoActivo,
      'Dr. Walter Pedroza - Gerencia General',
      'Cumple al 100% los requisitos de Gerencia Académica y Gerencia Comercial. Dictamen de rentabilidad favorable y deducción POA activa.',
      moneda
    );
    onGuardarProyecto(proyectoAprobado);
    setMensajeExito(`¡Dictamen emitido con éxito! El proyecto cuenta con aprobación final de Gerencia General y rebaja su facturación del POA.`);
    setTimeout(() => setMensajeExito(null), 4500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Encabezado Principal del Modal */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-4 sm:p-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-xl">
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase font-bold tracking-wider text-indigo-300">
                  Summit Impulsa Global • Sistema de Gestión de Procesos
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-400/20 text-indigo-200 border border-indigo-400/30">
                  Flujo Inter-Gerencial
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2 mt-0.5">
                <span>Rastreador de Nivel, Status y Tiempos de Proyectos</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mensaje de Confirmación / Alerta en Vivo */}
        {mensajeExito && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 text-xs text-emerald-900 font-bold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{mensajeExito}</span>
            </div>
            <button onClick={() => setMensajeExito(null)} className="text-emerald-700 hover:text-emerald-950">
              ✕
            </button>
          </div>
        )}

        {/* Contenido en Dos Columnas: Selector de Proyectos + Panel de Auditoría */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          
          {/* Columna Izquierda: Lista de Selección de Proyectos */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/70 flex flex-col shrink-0">
            {/* Buscador y Filtro de Nivel */}
            <div className="p-3 border-b border-slate-200 space-y-2 bg-white">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar programa o docente..."
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Filtro por Nivel */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setFiltroNivel('todos')}
                  className={`px-2 py-0.8 rounded-md font-bold transition-colors shrink-0 ${
                    filtroNivel === 'todos' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  Todos ({proyectos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroNivel('1')}
                  className={`px-2 py-0.8 rounded-md font-bold transition-colors shrink-0 ${
                    filtroNivel === '1' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-900 hover:bg-blue-200'
                  }`}
                >
                  N1 Acad.
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroNivel('2')}
                  className={`px-2 py-0.8 rounded-md font-bold transition-colors shrink-0 ${
                    filtroNivel === '2' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                  }`}
                >
                  N2 Com.
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroNivel('3')}
                  className={`px-2 py-0.8 rounded-md font-bold transition-colors shrink-0 ${
                    filtroNivel === '3' ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-900 hover:bg-purple-200'
                  }`}
                >
                  N3 Dict.
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroNivel('4')}
                  className={`px-2 py-0.8 rounded-md font-bold transition-colors shrink-0 ${
                    filtroNivel === '4' ? 'bg-indigo-700 text-white' : 'bg-indigo-100 text-indigo-900 hover:bg-indigo-200'
                  }`}
                >
                  N4 Listo
                </button>
              </div>
            </div>

            {/* Lista Scrollable */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-200/80 p-1.5 space-y-1">
              {proyectosFiltrados.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No se encontraron proyectos con ese filtro.
                </div>
              ) : (
                proyectosFiltrados.map((p) => {
                  const nInfo = obtenerNivelFlujo(p);
                  const tInfo = calcularTiempoTranscurrido(p.fechaCreacion || p.fechaProgramacion);
                  const esSeleccionado = p.id === proyectoActivo?.id;

                  return (
                    <div
                      key={p.id}
                      onClick={() => setProyectoSeleccionadoId(p.id)}
                      className={`p-2.5 rounded-xl cursor-pointer transition-all ${
                        esSeleccionado 
                          ? 'bg-indigo-50 border-2 border-indigo-600 shadow-xs' 
                          : 'bg-white hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="text-xs font-bold text-slate-900 line-clamp-1">
                          {p.nombreProyecto}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-black shrink-0 border ${
                          nInfo.nivel === 4 ? 'bg-indigo-100 text-indigo-900 border-indigo-300' :
                          nInfo.nivel === 3 ? 'bg-purple-100 text-purple-900 border-purple-300' :
                          nInfo.nivel === 2 ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                          'bg-blue-100 text-blue-900 border-blue-300'
                        }`}>
                          N{nInfo.nivel}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        Docente: <span className="font-semibold text-slate-700">{p.nombreDocente}</span>
                      </div>

                      <div className="flex items-center justify-between mt-1.5 text-[10px] pt-1.5 border-t border-slate-100">
                        <span className="font-mono text-slate-600 flex items-center gap-1" title={p.fechaHoraGrabacion ? `Grabado: ${p.fechaHoraGrabacion}` : tInfo.texto}>
                          <Clock className="w-2.5 h-2.5 text-emerald-600" />
                          {p.horaCreacion ? `${p.horaCreacion} (${tInfo.texto})` : tInfo.texto}
                        </span>
                        <span className="font-bold text-slate-800">
                          {p.alumnosFinal} inscritos
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Columna Derecha: Auditoría y Detalle de Flujo del Proyecto Seleccionado */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-white">
            {proyectoActivo ? (
              <>
                {/* Cabecera del Proyecto Seleccionado */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                        {proyectoActivo.codigoPrograma || `ID-${proyectoActivo.id}`}
                      </span>
                      <span className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                        {proyectoActivo.tipoProyecto}
                      </span>
                      {tiempoInfo && (
                        <span className="text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Tiempo en Flujo: <strong>{tiempoInfo.formatoLargo}</strong></span>
                        </span>
                      )}
                      {(proyectoActivo.horaCreacion || proyectoActivo.fechaHoraGrabacion) && (
                        <span className="text-[11px] font-mono font-bold text-emerald-900 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-md flex items-center gap-1" title={proyectoActivo.fechaHoraGrabacion ? `Grabado: ${proyectoActivo.fechaHoraGrabacion}` : 'Hora de creación'}>
                          <Clock className="w-3 h-3 text-emerald-600" />
                          <span>Sello al Grabar: <strong>{proyectoActivo.fechaHoraGrabacion || proyectoActivo.horaCreacion}</strong></span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-xl font-black text-slate-900">
                      {proyectoActivo.nombreProyecto}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Docente: <strong className="text-slate-800">{proyectoActivo.nombreDocente}</strong> • Horas: <strong className="text-slate-800">{proyectoActivo.horasClase} hrs</strong> • Matrícula Real: <strong className="text-emerald-700">{proyectoActivo.alumnosFinal} inscritos</strong>
                    </p>
                  </div>

                  {/* Badge de Nivel Actual */}
                  <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
                    <span className={`px-3 py-1.5 rounded-xl font-black text-xs border flex items-center gap-2 ${nivelInfo?.badgeClass}`}>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{nivelInfo?.titulo}</span>
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Gerencia Responsable: <strong>{nivelInfo?.gerenciaActual}</strong>
                    </span>
                  </div>
                </div>

                {/* 1. STEPPER HORIZONTAL: NIVEL 1 -> NIVEL 2 -> NIVEL 3 -> NIVEL 4 */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-indigo-600" />
                      Línea de Proceso y Niveles de Flujo de Trabajo
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Cumplimiento General: <strong className="text-indigo-700 font-mono">{validacionGG?.porcentajeTotal}%</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2">
                    {/* Nivel 1 */}
                    <div className={`p-3 rounded-xl border transition-all ${
                      nivelInfo?.nivel === 1 
                        ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20 shadow-xs' 
                        : diagAcad?.autorizado 
                        ? 'bg-emerald-50/50 border-emerald-300' 
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-blue-900 uppercase">Nivel 1</span>
                        {diagAcad?.autorizado ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-1">Gerencia Académica</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Diseño curricular, docente, horas y costos operativos directos.</p>
                      <div className="mt-2 text-[10px] font-semibold text-slate-700">
                        {diagAcad?.autorizado ? (
                          <span className="text-emerald-700 font-bold">✅ Autorizado</span>
                        ) : (
                          <span className="text-amber-700 font-bold">⏳ En diseño</span>
                        )}
                      </div>
                    </div>

                    {/* Nivel 2 */}
                    <div className={`p-3 rounded-xl border transition-all ${
                      nivelInfo?.nivel === 2 
                        ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs' 
                        : diagCom?.autorizado 
                        ? 'bg-emerald-50/50 border-emerald-300' 
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-900 uppercase">Nivel 2</span>
                        {diagCom?.autorizado ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : nivelInfo?.nivel === 2 ? (
                          <Clock className="w-4 h-4 text-amber-500" />
                        ) : (
                          <span className="text-[10px] text-slate-400">Pendiente</span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-1">Comercialización</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Canales, matrícula mínima (≥4), embudo y precios.</p>
                      <div className="mt-2 text-[10px] font-semibold text-slate-700">
                        {diagCom?.autorizado ? (
                          <span className="text-emerald-700 font-bold">✅ Comercializado</span>
                        ) : nivelInfo?.nivel === 2 ? (
                          <span className="text-amber-700 font-bold">⏳ Captando alumnos</span>
                        ) : (
                          <span className="text-slate-400">Por iniciar</span>
                        )}
                      </div>
                    </div>

                    {/* Nivel 3 */}
                    <div className={`p-3 rounded-xl border transition-all ${
                      nivelInfo?.nivel === 3 
                        ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-500/20 shadow-xs' 
                        : proyectoActivo.aprobacionFinalGerenciaGeneral 
                        ? 'bg-emerald-50/50 border-emerald-300' 
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-purple-900 uppercase">Nivel 3</span>
                        {proyectoActivo.aprobacionFinalGerenciaGeneral ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : nivelInfo?.nivel === 3 ? (
                          <Clock className="w-4 h-4 text-purple-600 animate-pulse" />
                        ) : (
                          <span className="text-[10px] text-slate-400">Pendiente</span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-1">Gerencia General</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Auditoría integral de cumplimiento de procesos por gerencia.</p>
                      <div className="mt-2 text-[10px] font-semibold text-slate-700">
                        {proyectoActivo.aprobacionFinalGerenciaGeneral ? (
                          <span className="text-emerald-700 font-bold">✅ Dictaminado</span>
                        ) : nivelInfo?.nivel === 3 ? (
                          <span className="text-purple-700 font-bold">⚖️ En revisión</span>
                        ) : (
                          <span className="text-slate-400">En espera</span>
                        )}
                      </div>
                    </div>

                    {/* Nivel 4 */}
                    <div className={`p-3 rounded-xl border transition-all ${
                      nivelInfo?.nivel === 4 
                        ? 'bg-indigo-50/90 border-indigo-400 ring-2 ring-indigo-500/20 shadow-xs' 
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-indigo-900 uppercase">Nivel 4</span>
                        {nivelInfo?.nivel === 4 ? (
                          <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <span className="text-[10px] text-slate-400">Falta Dictamen</span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-1">Aprobado Listo</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Autorizado para ejecución. Rebaja facturación de meta POA.</p>
                      <div className="mt-2 text-[10px] font-semibold text-slate-700">
                        {nivelInfo?.nivel === 4 ? (
                          <span className="text-indigo-800 font-bold">🚀 En Ejecución</span>
                        ) : (
                          <span className="text-slate-400">No habilitado</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. MATRIZ DE AUDITORÍA: CUMPLIMIENTO DE PROCESOS POR CADA GERENCIA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Panel de Cumplimiento: Gerencia Académica */}
                  <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-3">
                    <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-blue-700" />
                        <h4 className="text-xs font-bold text-blue-950 uppercase">
                          1. Gerencia Académica ({diagAcad?.porcentaje}%)
                        </h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        diagAcad?.autorizado ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {diagAcad?.autorizado ? 'Autorizado' : 'Pendiente'}
                      </span>
                    </div>

                    <p className="text-[11px] text-blue-900/80">
                      Líder responsable: <strong>{diagAcad?.lider}</strong>
                    </p>

                    <div className="space-y-1.5">
                      {diagAcad?.items.map((item) => (
                        <div key={item.id} className="p-2 rounded-lg bg-white border border-blue-100 flex items-start justify-between gap-2 text-xs">
                          <div>
                            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                              {item.cumplido ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              ) : (
                                <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              )}
                              <span>{item.label}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 block ml-5">
                              {item.detalle}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                            item.cumplido ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {item.cumplido ? 'Cumplido' : 'Faltante'}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Botón de Autorización Rápida si falta firma académica */}
                    {!diagAcad?.autorizado && (
                      <button
                        type="button"
                        onClick={handleAutorizarAcademica}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Completar y Autorizar Fase Académica</span>
                      </button>
                    )}
                  </div>

                  {/* Panel de Cumplimiento: Gerencia de Comercialización */}
                  <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                      <div className="flex items-center gap-2">
                        <Megaphone className="w-4 h-4 text-emerald-700" />
                        <h4 className="text-xs font-bold text-emerald-950 uppercase">
                          2. Gerencia Comercial ({diagCom?.porcentaje}%)
                        </h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        diagCom?.autorizado ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {diagCom?.autorizado ? 'Autorizado' : 'Pendiente'}
                      </span>
                    </div>

                    <p className="text-[11px] text-emerald-900/80">
                      Líder responsable: <strong>{diagCom?.lider}</strong>
                    </p>

                    <div className="space-y-1.5">
                      {diagCom?.items.map((item) => (
                        <div key={item.id} className="p-2 rounded-lg bg-white border border-emerald-100 flex items-start justify-between gap-2 text-xs">
                          <div>
                            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                              {item.cumplido ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              ) : (
                                <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              )}
                              <span>{item.label}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 block ml-5">
                              {item.detalle}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                            item.cumplido ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {item.cumplido ? 'Cumplido' : 'Faltante'}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Botón de Autorización Rápida si falta firma comercial */}
                    {!diagCom?.autorizado && (
                      <button
                        type="button"
                        onClick={handleAutorizarComercial}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Completar y Autorizar Fase Comercial</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. CONDICIONES DE APROBACIÓN DE GERENCIA GENERAL */}
                <div className="p-4 sm:p-5 rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/30 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-200 pb-3">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-purple-700" />
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
                          3. Dictamen de Aprobación • Gerencia General
                        </h4>
                        <span className="text-[11px] text-slate-600">
                          Requisito institucional: ambas gerencias deben llenar y autorizar sus procesos para emitir aprobación y descontar la facturación del POA.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-slate-500">Facturación a Rebajar:</span>
                      <strong className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {formatearMoneda(proyectoActivo.ingresoRealTotal || 0, moneda)}
                      </strong>
                    </div>
                  </div>

                  {/* Estado de Viabilidad de Aprobación */}
                  {validacionGG?.puedeAprobar ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-950">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-black text-emerald-900 block">
                          ¡Cumplimiento Integral 100% Verificado!
                        </span>
                        <p className="text-[11px] text-emerald-800 mt-0.5">
                          Tanto la Gerencia Académica como la Gerencia de Comercialización han llenado y autorizado todos sus procesos requeridos. El proyecto está completamente listo para dictamen ejecutivo.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-xs text-amber-950">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="font-black text-amber-900 block">
                          Procesos Pendientes de Cumplimiento
                        </span>
                        <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5">
                          {validacionGG?.bloqueos.map((b, idx) => (
                            <li key={idx}><strong>{b}</strong></li>
                          ))}
                        </ul>
                        <p className="text-[10px] text-amber-700 mt-1">
                          Para garantizar el cumplimiento de la política de calidad, cada gerencia debe autorizar su parte antes de emitir la aprobación final.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Acciones de Gerencia General */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="text-xs text-slate-500">
                      Estado Actual del Proyecto: <strong className="text-slate-800">{proyectoActivo.seLlevoACabo}</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      {proyectoActivo.aprobacionFinalGerenciaGeneral ? (
                        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-900 border border-emerald-300 px-4 py-2 rounded-xl text-xs font-black">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          <span>Aprobado por Gerencia General (Rebaja POA Aplicada)</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleAprobarGerenciaGeneral}
                          disabled={!validacionGG?.puedeAprobar}
                          className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                            validacionGG?.puedeAprobar
                              ? 'bg-purple-700 hover:bg-purple-800 text-white hover:scale-[1.02]'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                          }`}
                          title={validacionGG?.puedeAprobar ? 'Emitir dictamen aprobatorio' : 'Bloqueado hasta que ambas gerencias completen sus procesos'}
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Aprobar Proyecto & Rebajar de Meta POA</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <Building2 className="w-12 h-12 mx-auto text-slate-300" />
                <p className="text-sm font-semibold">Selecciona un proyecto de la lista para auditar su flujo institucional.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Informativo con Navegación Rápida */}
        <div className="bg-slate-100 border-t border-slate-200 p-3 px-5 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px]">
            <Info className="w-3.5 h-3.5 text-indigo-600" />
            <span>
              Flujo oficial: <strong>1. Académica</strong> (Diseño) ➔ <strong>2. Comercialización</strong> (Venta) ➔ <strong>3. Gerencia General</strong> (Aprobación & POA).
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onNavegarGerencia && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavegarGerencia('gerencia-academica');
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer"
                >
                  Ir a Académica
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavegarGerencia('gerencia-comercializacion');
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer"
                >
                  Ir a Comercial
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
