import React, { useState } from 'react';
import { ProyectoEducativo, Moneda } from '../../types';
import {
  Calendar,
  Rocket,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Megaphone,
  Mail,
  MessageSquare,
  Video,
  Share2,
  Trash2,
  Edit2,
  CalendarDays,
  Target,
  Sparkles
} from 'lucide-react';
import { formatearMoneda } from '../../utils/calculations';

interface CommercialLaunchCampaignsViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto: (p: ProyectoEducativo) => void;
}

export interface HitoCampana {
  id: string;
  proyectoId: string;
  nombreHito: string;
  fase: 'Expectativa / Teaser' | 'Preventa Early Bird' | 'Lanzamiento Oficial' | 'Masterclass / Webinar' | 'Últimos Cupos / Cierre';
  canalPrincipal: 'WhatsApp Directo' | 'Meta Ads' | 'Email Marketing' | 'Webinar Zoom' | 'LinkedIn Orgánico' | 'Llamadas Salientes';
  fechaInicio: string;
  fechaFin: string;
  metaLeads: number;
  metaInscritos: number;
  presupuestoLPS: number;
  estado: 'Planeada' | 'En Curso' | 'Completada' | 'Pausada';
  notas: string;
}

const HITOS_INICIALES: HitoCampana[] = [];

export const CommercialLaunchCampaignsView: React.FC<CommercialLaunchCampaignsViewProps> = ({
  proyectos,
  moneda,
  onGuardarProyecto: _onGuardarProyecto,
}) => {
  const [hitos, setHitos] = useState<HitoCampana[]>(HITOS_INICIALES);

  const [filtroProyecto, setFiltroProyecto] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Formulario manual
  const [nuevoProyectoId, setNuevoProyectoId] = useState<string>(proyectos[0]?.id || '');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaFase, setNuevaFase] = useState<HitoCampana['fase']>('Preventa Early Bird');
  const [nuevoCanal, setNuevoCanal] = useState<HitoCampana['canalPrincipal']>('Meta Ads');
  const [nuevaFechaInicio, setNuevaFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [nuevaFechaFin, setNuevaFechaFin] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [nuevaMetaLeads, setNuevaMetaLeads] = useState(30);
  const [nuevaMetaInscritos, setNuevaMetaInscritos] = useState(5);
  const [nuevoPresupuesto, setNuevoPresupuesto] = useState(1500);
  const [nuevoEstado, setNuevoEstado] = useState<HitoCampana['estado']>('Planeada');
  const [nuevasNotas, setNuevasNotas] = useState('');

  const handleAgregarHito = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;

    const nuevo: HitoCampana = {
      id: `camp-${Date.now()}`,
      proyectoId: nuevoProyectoId,
      nombreHito: nuevoNombre.trim(),
      fase: nuevaFase,
      canalPrincipal: nuevoCanal,
      fechaInicio: nuevaFechaInicio,
      fechaFin: nuevaFechaFin,
      metaLeads: Number(nuevaMetaLeads),
      metaInscritos: Number(nuevaMetaInscritos),
      presupuestoLPS: Number(nuevoPresupuesto),
      estado: nuevoEstado,
      notas: nuevasNotas.trim()
    };

    setHitos([nuevo, ...hitos]);
    setNuevoNombre('');
    setNuevasNotas('');
    setMostrarFormulario(false);
    setMensajeExito(`¡Campaña "${nuevo.nombreHito}" programada exitosamente en el cronograma!`);
    setTimeout(() => setMensajeExito(null), 3500);
  };

  const handleCambiarEstado = (id: string, nuevoEstado: HitoCampana['estado']) => {
    setHitos(hitos.map(h => h.id === id ? { ...h, estado: nuevoEstado } : h));
  };

  const handleEliminar = (id: string) => {
    setHitos(hitos.filter(h => h.id !== id));
  };

  const hitosFiltrados = hitos.filter(h => {
    if (filtroProyecto !== 'todos' && h.proyectoId !== filtroProyecto) return false;
    if (filtroEstado !== 'todos' && h.estado !== filtroEstado) return false;
    return true;
  });

  const totalCampanas = hitos.length;
  const campanasEnCurso = hitos.filter(h => h.estado === 'En Curso').length;
  const totalPresupuesto = hitos.reduce((acc, h) => acc + h.presupuestoLPS, 0);
  const totalMetasInscritos = hitos.reduce((acc, h) => acc + h.metaInscritos, 0);

  const getIconoCanal = (canal: HitoCampana['canalPrincipal']) => {
    switch (canal) {
      case 'WhatsApp Directo': return <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />;
      case 'Meta Ads': return <Megaphone className="w-3.5 h-3.5 text-blue-600" />;
      case 'Email Marketing': return <Mail className="w-3.5 h-3.5 text-indigo-600" />;
      case 'Webinar Zoom': return <Video className="w-3.5 h-3.5 text-amber-600" />;
      case 'LinkedIn Orgánico': return <Share2 className="w-3.5 h-3.5 text-sky-600" />;
      default: return <Target className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header y Resumen Ejecutivo */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-900 text-white p-5 rounded-2xl border border-emerald-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>Cronograma Estratégico de Lanzamiento</span>
            </div>
            <h2 className="text-xl font-black tracking-tight">
              Calendario & Roadmap de Campañas Comerciales
            </h2>
            <p className="text-xs text-emerald-200/80 mt-0.5">
              Planificación por hitos temporales: preventa, webinars de conversión masiva y sprints de cierre.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>✍️ Programar Nuevo Hito / Campaña</span>
          </button>
        </div>

        {/* Métricas clave */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-emerald-800/60 text-xs">
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
            <span className="text-[11px] text-emerald-300">Total Campañas</span>
            <div className="text-lg font-black font-mono">{totalCampanas}</div>
          </div>
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
            <span className="text-[11px] text-emerald-300">Activas En Curso</span>
            <div className="text-lg font-black font-mono text-amber-300">{campanasEnCurso}</div>
          </div>
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
            <span className="text-[11px] text-emerald-300">Presupuesto Asignado</span>
            <div className="text-lg font-black font-mono">{formatearMoneda(totalPresupuesto, moneda)}</div>
          </div>
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
            <span className="text-[11px] text-emerald-300">Meta Alumnos Sprints</span>
            <div className="text-lg font-black font-mono text-emerald-400">{totalMetasInscritos} cupos</div>
          </div>
        </div>
      </div>

      {/* Alerta de éxito */}
      {mensajeExito && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* Formulario Manual de Alta de Campaña */}
      {mostrarFormulario && (
        <form onSubmit={handleAgregarHito} className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
            <h3 className="text-sm font-black text-emerald-950 flex items-center gap-2">
              <Rocket className="w-4 h-4 text-emerald-600" />
              <span>Registrar Nuevo Hito Comercial o Campaña de Venta</span>
            </h3>
            <button
              type="button"
              onClick={() => setMostrarFormulario(false)}
              className="text-xs text-slate-400 hover:text-slate-700"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Programa Académico Asignado
              </label>
              <select
                value={nuevoProyectoId}
                onChange={(e) => setNuevoProyectoId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold"
              >
                {proyectos.map(p => (
                  <option key={p.id} value={p.id}>{p.nombreProyecto}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nombre de la Campaña / Hito de Lanzamiento *
              </label>
              <input
                type="text"
                required
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                placeholder="Ej: Sprint Final WhatsApp 48 Horas con Descuento Directo"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fase de Campaña
              </label>
              <select
                value={nuevaFase}
                onChange={(e) => setNuevaFase(e.target.value as HitoCampana['fase'])}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
              >
                <option value="Expectativa / Teaser">Expectativa / Teaser</option>
                <option value="Preventa Early Bird">Preventa Early Bird</option>
                <option value="Lanzamiento Oficial">Lanzamiento Oficial</option>
                <option value="Masterclass / Webinar">Masterclass / Webinar</option>
                <option value="Últimos Cupos / Cierre">Últimos Cupos / Cierre</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Canal Principal
              </label>
              <select
                value={nuevoCanal}
                onChange={(e) => setNuevoCanal(e.target.value as HitoCampana['canalPrincipal'])}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
              >
                <option value="WhatsApp Directo">WhatsApp Directo</option>
                <option value="Meta Ads">Meta Ads</option>
                <option value="Email Marketing">Email Marketing</option>
                <option value="Webinar Zoom">Webinar Zoom</option>
                <option value="LinkedIn Orgánico">LinkedIn Orgánico</option>
                <option value="Llamadas Salientes">Llamadas Salientes</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={nuevaFechaInicio}
                onChange={(e) => setNuevaFechaInicio(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha Fin
              </label>
              <input
                type="date"
                value={nuevaFechaFin}
                onChange={(e) => setNuevaFechaFin(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Meta de Leads
              </label>
              <input
                type="number"
                min="0"
                value={nuevaMetaLeads}
                onChange={(e) => setNuevaMetaLeads(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Meta de Inscritos
              </label>
              <input
                type="number"
                min="0"
                value={nuevaMetaInscritos}
                onChange={(e) => setNuevaMetaInscritos(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold text-emerald-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Presupuesto ({moneda})
              </label>
              <input
                type="number"
                min="0"
                value={nuevoPresupuesto}
                onChange={(e) => setNuevoPresupuesto(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estado Inicial
              </label>
              <select
                value={nuevoEstado}
                onChange={(e) => setNuevoEstado(e.target.value as HitoCampana['estado'])}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
              >
                <option value="Planeada">Planeada</option>
                <option value="En Curso">En Curso</option>
                <option value="Completada">Completada</option>
                <option value="Pausada">Pausada</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Estrategia y Notas de Ejecución
            </label>
            <textarea
              rows={2}
              value={nuevasNotas}
              onChange={(e) => setNuevasNotas(e.target.value)}
              placeholder="Instrucciones para el equipo de ventas y pauta..."
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Guardar Hito en Calendario</span>
            </button>
          </div>
        </form>
      )}

      {/* Filtros de visualización */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-slate-500" />
          <span className="font-bold text-slate-800">Filtrar Cronograma:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filtroProyecto}
            onChange={(e) => setFiltroProyecto(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg"
          >
            <option value="todos">Todos los Programas</option>
            {proyectos.map(p => (
              <option key={p.id} value={p.id}>{p.nombreProyecto}</option>
            ))}
          </select>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg"
          >
            <option value="todos">Todos los Estados</option>
            <option value="Planeada">Planeadas</option>
            <option value="En Curso">En Curso</option>
            <option value="Completada">Completadas</option>
            <option value="Pausada">Pausadas</option>
          </select>
        </div>
      </div>

      {/* Listado / Cronograma Visual de Campañas */}
      {hitosFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
          <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-black text-slate-800">
            No hay hitos o fases de campaña programadas en el cronograma
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Planifique el lanzamiento comercial de cada programa educativo aprobado: configure preventas Early Bird, webinars informativos y cierres de cupos con sus metas de leads y presupuesto.
          </p>
          <button
            type="button"
            onClick={() => setMostrarFormulario(true)}
            className="mt-4 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Planificar Primer Hito de Lanzamiento</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hitosFiltrados.map((h) => {
          const prog = proyectos.find(p => p.id === h.proyectoId);
          return (
            <div
              key={h.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between hover:border-emerald-300 transition-all"
            >
              <div>
                {/* Header de la tarjeta */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {h.fase}
                  </span>
                  <select
                    value={h.estado}
                    onChange={(e) => handleCambiarEstado(h.id, e.target.value as HitoCampana['estado'])}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border cursor-pointer ${
                      h.estado === 'En Curso'
                        ? 'bg-amber-50 text-amber-900 border-amber-300 font-black'
                        : h.estado === 'Completada'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        : h.estado === 'Pausada'
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : 'bg-blue-50 text-blue-900 border-blue-200'
                    }`}
                  >
                    <option value="Planeada">Planeada</option>
                    <option value="En Curso">⚡ En Curso</option>
                    <option value="Completada">✓ Completada</option>
                    <option value="Pausada">Pausada</option>
                  </select>
                </div>

                <h4 className="text-sm font-black text-slate-900 leading-snug">
                  {h.nombreHito}
                </h4>

                <p className="text-[11px] text-emerald-700 font-semibold mt-1 truncate">
                  📚 {prog ? prog.nombreProyecto : 'Programa Académico'}
                </p>

                {/* Fechas y Canal */}
                <div className="mt-3 pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Vigencia:
                    </span>
                    <span className="font-mono text-[11px] font-bold text-slate-800">
                      {h.fechaInicio} al {h.fechaFin}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Canal:</span>
                    <span className="font-semibold flex items-center gap-1 text-[11px] text-slate-800">
                      {getIconoCanal(h.canalPrincipal)}
                      {h.canalPrincipal}
                    </span>
                  </div>
                </div>

                {/* Métricas previstas */}
                <div className="grid grid-cols-3 gap-1.5 bg-slate-50 p-2 rounded-xl mt-3 text-center">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Leads</span>
                    <span className="text-xs font-black font-mono text-slate-800">{h.metaLeads}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Cupos Meta</span>
                    <span className="text-xs font-black font-mono text-emerald-700">{h.metaInscritos}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Pauta</span>
                    <span className="text-xs font-black font-mono text-slate-800">
                      {formatearMoneda(h.presupuestoLPS, moneda)}
                    </span>
                  </div>
                </div>

                {h.notas && (
                  <p className="text-[11px] text-slate-500 italic mt-2.5 bg-amber-50/50 p-2 rounded-lg border border-amber-100/60">
                    "{h.notas}"
                  </p>
                )}
              </div>

              {/* Botón eliminar */}
              <div className="mt-4 pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleEliminar(h.id)}
                  className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
