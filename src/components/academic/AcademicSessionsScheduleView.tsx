import React, { useState } from 'react';
import { 
  CalendarDays, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  Sparkles, 
  Plus, 
  Trash2, 
  Save, 
  Layers, 
  Laptop, 
  Building,
  AlertCircle,
  FileText
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { generarPlanSesionesClase } from '../../utils/curricularUtils';

interface AcademicSessionsScheduleViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto: (p: ProyectoEducativo) => void;
}

export const AcademicSessionsScheduleView: React.FC<AcademicSessionsScheduleViewProps> = ({
  proyectos,
  onGuardarProyecto,
}) => {
  const [proyectoSeleccionadoId, setProyectoSeleccionadoId] = useState<number>(
    proyectos.length > 0 ? proyectos[0].id : 0
  );

  const proyectoActual = proyectos.find((p) => p.id === proyectoSeleccionadoId) || proyectos[0];

  const [sesiones, setSesiones] = useState(() => {
    if (proyectoActual?.sesionesClase && proyectoActual.sesionesClase.length > 0) {
      return proyectoActual.sesionesClase;
    }
    return generarPlanSesionesClase(
      proyectoActual?.cantidadTemas || 4,
      proyectoActual?.horasClasePorTema || 5,
      proyectoActual?.fechaProgramacion || new Date().toISOString().split('T')[0],
      proyectoActual?.diasClase || 'Lunes, Miércoles y Viernes',
      proyectoActual?.modalidad === 'Presencial' ? 'Presencial' : 'Virtual'
    );
  });

  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  const handleSeleccionarProyecto = (p: ProyectoEducativo) => {
    setProyectoSeleccionadoId(p.id);
    if (p.sesionesClase && p.sesionesClase.length > 0) {
      setSesiones(p.sesionesClase);
    } else {
      setSesiones(
        generarPlanSesionesClase(
          p.cantidadTemas || 4,
          p.horasClasePorTema || 5,
          p.fechaProgramacion || new Date().toISOString().split('T')[0],
          p.diasClase || 'Lunes, Miércoles y Viernes',
          p.modalidad === 'Presencial' ? 'Presencial' : 'Virtual'
        )
      );
    }
    setGuardadoExitoso(false);
  };

  const handleAutoGenerar = () => {
    if (!proyectoActual) return;
    const nuevasSesiones = generarPlanSesionesClase(
      proyectoActual.cantidadTemas || 4,
      proyectoActual.horasClasePorTema || 5,
      proyectoActual.fechaProgramacion || new Date().toISOString().split('T')[0],
      proyectoActual.diasClase || 'Lunes, Miércoles y Viernes',
      proyectoActual.modalidad === 'Presencial' ? 'Presencial' : 'Virtual'
    );
    setSesiones(nuevasSesiones);
  };

  const handleGuardarSesiones = () => {
    if (!proyectoActual) return;
    const proyectoActualizado: ProyectoEducativo = {
      ...proyectoActual,
      sesionesClase: sesiones,
    };
    onGuardarProyecto(proyectoActualizado);
    setGuardadoExitoso(true);
    setTimeout(() => setGuardadoExitoso(false), 3000);
  };

  const handleAgregarSesion = () => {
    const num = sesiones.length + 1;
    const ultFecha = sesiones.length > 0 ? sesiones[sesiones.length - 1].fecha : proyectoActual?.fechaProgramacion;
    
    setSesiones([
      ...sesiones,
      {
        numeroSesion: num,
        fecha: ultFecha || new Date().toISOString().split('T')[0],
        tema: `Sesión ${num}: Tema y Casos de Especialidad`,
        modalidad: proyectoActual?.modalidad === 'Presencial' ? 'Presencial' : 'Virtual',
        horas: proyectoActual?.horasClasePorTema || 4,
        entregable: `Taller Práctico ${num}`,
        estado: 'Programada',
      },
    ]);
  };

  const handleEliminarSesion = (index: number) => {
    setSesiones(sesiones.filter((_, i) => i !== index));
  };

  const handleCambiarCampo = (index: number, campo: string, valor: any) => {
    setSesiones(
      sesiones.map((s, i) => (i === index ? { ...s, [campo]: valor } : s))
    );
  };

  const totalHorasPlanificadas = sesiones.reduce((acc, s) => acc + (Number(s.horas) || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-5 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="w-5 h-5 text-blue-300" />
            <h3 className="font-black text-base text-white tracking-wide">
              Cronograma & Plan de Sesiones Clase por Clase
            </h3>
            <span className="bg-blue-500/30 text-blue-200 border border-blue-400/40 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
              Control de Clases
            </span>
          </div>
          <p className="text-xs text-blue-200/90 max-w-2xl leading-relaxed">
            Planifique cada sesión con fecha exacta, horas lectivas, tema impartido, modalidad sincrónica/presencial y entregable evaluable.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAutoGenerar}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-blue-200 hover:text-white rounded-lg text-xs font-bold border border-white/20 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Regenerar Sesiones</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Selector de Cursos */}
        <div className="lg:col-span-4 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Seleccionar Programa ({proyectos.length})
            </span>
          </div>
          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {proyectos.map((p) => {
              const isSelected = p.id === proyectoActual?.id;
              const totalSes = p.sesionesClase?.length || p.cantidadTemas || 4;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSeleccionarProyecto(p)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-blue-50/90 border-blue-400 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold text-blue-900 bg-blue-100/80 px-1.5 py-0.5 rounded">
                      {p.codigoPrograma || `ACAD-${p.id}`}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 font-mono">
                      {totalSes} sesiones
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1.5 line-clamp-1">
                    {p.nombreProyecto}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                    <span>{p.horario || '06:00 PM - 08:00 PM'}</span>
                    <span className="font-mono">{p.diasClase || 'Lun, Mié y Vie'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel de Cronograma de Sesiones */}
        {proyectoActual && (
          <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                  {proyectoActual.codigoPrograma || `ACAD-${proyectoActual.id}`}
                </span>
                <h3 className="text-sm sm:text-base font-black text-slate-900 mt-1">
                  {proyectoActual.nombreProyecto}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Docente: <strong>{proyectoActual.nombreDocente}</strong> • {proyectoActual.diasClase || 'Lun, Mié y Vie'} • {proyectoActual.horario || 'Noche'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAgregarSesion}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Sesión</span>
                </button>

                <button
                  type="button"
                  onClick={handleGuardarSesiones}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Plan</span>
                </button>
              </div>
            </div>

            {guardadoExitoso && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Cronograma de sesiones actualizado con éxito.</span>
              </div>
            )}

            {/* Métricas de Horas Planificadas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                <span className="text-[10px] font-bold text-blue-900 uppercase">Total Sesiones</span>
                <div className="text-lg font-black text-blue-950 font-mono mt-0.5">
                  {sesiones.length} clases
                </div>
              </div>

              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200">
                <span className="text-[10px] font-bold text-indigo-900 uppercase">Horas Planificadas</span>
                <div className="text-lg font-black text-indigo-950 font-mono mt-0.5">
                  {totalHorasPlanificadas} / {proyectoActual.horasClase} hrs
                </div>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-900 uppercase">Promedio por Clase</span>
                <div className="text-lg font-black text-emerald-950 font-mono mt-0.5">
                  {sesiones.length > 0 ? (totalHorasPlanificadas / sesiones.length).toFixed(1) : 0} hrs/sesión
                </div>
              </div>
            </div>

            {/* Listado Editable de Sesiones */}
            <div className="space-y-3">
              {sesiones.map((ses, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 hover:bg-slate-50/90 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center font-mono">
                        {ses.numeroSesion || idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        Sesión #{ses.numeroSesion || idx + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={ses.estado}
                        onChange={(e) => handleCambiarCampo(idx, 'estado', e.target.value)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border font-semibold ${
                          ses.estado === 'Impartida'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : ses.estado === 'Reprogramada'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-blue-50 text-blue-800 border-blue-300'
                        }`}
                      >
                        <option value="Programada">📅 Programada</option>
                        <option value="Impartida">✓ Impartida</option>
                        <option value="Reprogramada">⚠️ Reprogramada</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleEliminarSesion(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Eliminar sesión"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Fecha</label>
                      <input
                        type="date"
                        value={ses.fecha || ''}
                        onChange={(e) => handleCambiarCampo(idx, 'fecha', e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                      />
                    </div>

                    <div className="sm:col-span-5">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Tema de la Clase</label>
                      <input
                        type="text"
                        value={ses.tema}
                        onChange={(e) => handleCambiarCampo(idx, 'tema', e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Horas</label>
                      <input
                        type="number"
                        min="1"
                        value={ses.horas}
                        onChange={(e) => handleCambiarCampo(idx, 'horas', Number(e.target.value))}
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Modalidad</label>
                      <select
                        value={ses.modalidad || 'Virtual'}
                        onChange={(e) => handleCambiarCampo(idx, 'modalidad', e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded-lg"
                      >
                        <option value="Virtual">Virtual</option>
                        <option value="Presencial">Presencial</option>
                      </select>
                    </div>

                    <div className="sm:col-span-12">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Entregable / Tarea Evaluada</label>
                      <input
                        type="text"
                        placeholder="Ej. Taller #1: Creación de Modelo de Estado de Resultados en Excel"
                        value={ses.entregable || ''}
                        onChange={(e) => handleCambiarCampo(idx, 'entregable', e.target.value)}
                        className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg text-slate-700"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
