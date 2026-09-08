import React, { useState } from 'react';
import { ProyectoEducativo, Moneda } from '../../types';
import {
  UserX,
  Plus,
  CheckCircle2,
  AlertTriangle,
  PieChart as PieIcon,
  Search,
  Filter,
  Trash2,
  Repeat,
  DollarSign,
  TrendingDown,
  Calendar,
  PhoneCall,
  MessageSquare
} from 'lucide-react';
import { formatearMoneda } from '../../utils/calculations';

interface CommercialLostLeadsAnalysisViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto: (p: ProyectoEducativo) => void;
}

export type MotivoPerdida =
  | 'Precio / Fuera de Presupuesto'
  | 'Incompatibilidad de Horario'
  | 'Preferencia por Modalidad Presencial'
  | 'Temario no Adaptado a su Necesidad'
  | 'Eligió Oferta de la Competencia'
  | 'Falta de Respuesta / No Contactable'
  | 'Postergó para Futura Cohorte'
  | 'Empresa No Aprobó Patrocinio';

export interface LeadPerdido {
  id: string;
  nombreProspecto: string;
  telefono: string;
  correo: string;
  proyectoId: string;
  motivoPrincipal: MotivoPerdida;
  valorPerdidoLPS: number;
  fechaPerdida: string;
  notasDetalle: string;
  estadoReactivacion: 'Reactivable Próxima Cohorte' | 'En Campaña de Recuperación' | 'Descartado Total' | 'Reactivado y Matriculado';
  fechaRecordatorio: string;
}

const LEADS_PERDIDOS_INICIALES: LeadPerdido[] = [];

export const CommercialLostLeadsAnalysisView: React.FC<CommercialLostLeadsAnalysisViewProps> = ({
  proyectos,
  moneda,
  onGuardarProyecto: _onGuardarProyecto,
}) => {
  const [leadsPerdidos, setLeadsPerdidos] = useState<LeadPerdido[]>(LEADS_PERDIDOS_INICIALES);

  const [busqueda, setBusqueda] = useState('');
  const [filtroMotivo, setFiltroMotivo] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Formulario manual
  const [nombreProspecto, setNombreProspecto] = useState('');
  const [telefono, setTelefono] = useState('+504 ');
  const [correo, setCorreo] = useState('');
  const [proyectoId, setProyectoId] = useState<string>(proyectos[0]?.id || '');
  const [motivoPrincipal, setMotivoPrincipal] = useState<MotivoPerdida>('Precio / Fuera de Presupuesto');
  const [valorPerdidoLPS, setValorPerdidoLPS] = useState<number>(2800);
  const [notasDetalle, setNotasDetalle] = useState('');
  const [estadoReactivacion, setEstadoReactivacion] = useState<LeadPerdido['estadoReactivacion']>('Reactivable Próxima Cohorte');
  const [fechaRecordatorio, setFechaRecordatorio] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );

  const handleCrearPerdido = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreProspecto.trim()) return;

    const nuevo: LeadPerdido = {
      id: `lost-${Date.now()}`,
      nombreProspecto: nombreProspecto.trim(),
      telefono: telefono.trim(),
      correo: correo.trim(),
      proyectoId,
      motivoPrincipal,
      valorPerdidoLPS: Number(valorPerdidoLPS),
      fechaPerdida: new Date().toISOString().split('T')[0],
      notasDetalle: notasDetalle.trim(),
      estadoReactivacion,
      fechaRecordatorio
    };

    setLeadsPerdidos([nuevo, ...leadsPerdidos]);
    setNombreProspecto('');
    setTelefono('+504 ');
    setCorreo('');
    setNotasDetalle('');
    setMostrarFormulario(false);
    setMensajeExito(`¡Prospecto perdido "${nuevo.nombreProspecto}" documentado para campaña de recuperación!`);
    setTimeout(() => setMensajeExito(null), 3500);
  };

  const handleCambiarEstado = (id: string, nuevoEstado: LeadPerdido['estadoReactivacion']) => {
    setLeadsPerdidos(leadsPerdidos.map(l => l.id === id ? { ...l, estadoReactivacion: nuevoEstado } : l));
  };

  const handleEliminar = (id: string) => {
    setLeadsPerdidos(leadsPerdidos.filter(l => l.id !== id));
  };

  // Métricas
  const totalPerdidos = leadsPerdidos.length;
  const valorTotalPerdido = leadsPerdidos.reduce((acc, l) => acc + l.valorPerdidoLPS, 0);
  const reactivablesCount = leadsPerdidos.filter(l => l.estadoReactivacion === 'Reactivable Próxima Cohorte' || l.estadoReactivacion === 'En Campaña de Recuperación').length;

  // Conteo por motivo
  const conteoPorMotivo: Record<string, number> = leadsPerdidos.reduce((acc, l) => {
    acc[l.motivoPrincipal] = (acc[l.motivoPrincipal] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const entriesMotivo = Object.entries(conteoPorMotivo) as [string, number][];
  const motivoMasFrecuente = entriesMotivo.sort((a, b) => b[1] - a[1])[0] || ['Sin datos', 0];

  const leadsFiltrados = leadsPerdidos.filter(l => {
    if (filtroMotivo !== 'todos' && l.motivoPrincipal !== filtroMotivo) return false;
    if (filtroEstado !== 'todos' && l.estadoReactivacion !== filtroEstado) return false;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      return (
        l.nombreProspecto.toLowerCase().includes(q) ||
        l.telefono.toLowerCase().includes(q) ||
        l.notasDetalle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white p-5 rounded-2xl border border-rose-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-300 text-xs font-bold mb-2">
              <UserX className="w-3.5 h-3.5" />
              <span>Diagnóstico de Deserción & Lost Leads</span>
            </div>
            <h2 className="text-xl font-black tracking-tight">
              Análisis de Motivos de Pérdida de Prospectos
            </h2>
            <p className="text-xs text-rose-200/80 mt-0.5">
              Identificación de cuellos de botella en precios, horarios y objeciones no resueltas para campañas de reactivación.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>✍️ Registrar Prospecto Perdido</span>
          </button>
        </div>

        {/* Métricas clave */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-rose-800/60 text-xs">
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
            <span className="text-[11px] text-rose-300">Total Deserciones</span>
            <div className="text-lg font-black font-mono">{totalPerdidos} prospectos</div>
          </div>
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
            <span className="text-[11px] text-rose-300">Causa Principal</span>
            <div className="text-xs font-black truncate text-amber-300 mt-1">{motivoMasFrecuente[0]}</div>
          </div>
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
            <span className="text-[11px] text-rose-300">Facturación en la Mesa</span>
            <div className="text-lg font-black font-mono text-rose-400">
              {formatearMoneda(valorTotalPerdido, moneda)}
            </div>
          </div>
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
            <span className="text-[11px] text-rose-300">Reactivables / Futuros</span>
            <div className="text-lg font-black font-mono text-emerald-400">{reactivablesCount} prospectos</div>
          </div>
        </div>
      </div>

      {mensajeExito && (
        <div className="p-3 bg-rose-50 border border-rose-300 text-rose-950 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* Formulario Manual de Registro de Pérdida */}
      {mostrarFormulario && (
        <form onSubmit={handleCrearPerdido} className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-rose-100">
            <h3 className="text-sm font-black text-rose-950 flex items-center gap-2">
              <UserX className="w-4 h-4 text-rose-600" />
              <span>Documentar Causa de Deserción del Prospecto</span>
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
                Nombre del Prospecto *
              </label>
              <input
                type="text"
                required
                value={nombreProspecto}
                onChange={(e) => setNombreProspecto(e.target.value)}
                placeholder="Ej: Lic. Elena Morales"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Teléfono / WhatsApp
              </label>
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="prospecto@empresa.hn"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Programa de Interés
              </label>
              <select
                value={proyectoId}
                onChange={(e) => setProyectoId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-semibold"
              >
                {proyectos.map(p => (
                  <option key={p.id} value={p.id}>{p.nombreProyecto}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-rose-950 mb-1">
                Motivo Principal de Pérdida *
              </label>
              <select
                value={motivoPrincipal}
                onChange={(e) => setMotivoPrincipal(e.target.value as MotivoPerdida)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-rose-300 rounded-lg font-semibold text-rose-900"
              >
                <option value="Precio / Fuera de Presupuesto">Precio / Fuera de Presupuesto</option>
                <option value="Incompatibilidad de Horario">Incompatibilidad de Horario</option>
                <option value="Preferencia por Modalidad Presencial">Preferencia por Modalidad Presencial</option>
                <option value="Temario no Adaptado a su Necesidad">Temario no Adaptado a su Necesidad</option>
                <option value="Eligió Oferta de la Competencia">Eligió Oferta de la Competencia</option>
                <option value="Falta de Respuesta / No Contactable">Falta de Respuesta / No Contactable</option>
                <option value="Postergó para Futura Cohorte">Postergó para Futura Cohorte</option>
                <option value="Empresa No Aprobó Patrocinio">Empresa No Aprobó Patrocinio</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor del Curso ({moneda})
              </label>
              <input
                type="number"
                min="0"
                value={valorPerdidoLPS}
                onChange={(e) => setValorPerdidoLPS(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estado de Reactivación
              </label>
              <select
                value={estadoReactivacion}
                onChange={(e) => setEstadoReactivacion(e.target.value as LeadPerdido['estadoReactivacion'])}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
              >
                <option value="Reactivable Próxima Cohorte">Reactivable Próxima Cohorte</option>
                <option value="En Campaña de Recuperación">En Campaña de Recuperación</option>
                <option value="Descartado Total">Descartado Total</option>
                <option value="Reactivado y Matriculado">Reactivado y Matriculado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha de Recordatorio / Seguimiento Futuro
              </label>
              <input
                type="date"
                value={fechaRecordatorio}
                onChange={(e) => setFechaRecordatorio(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notas y Feedback Cualitativo del Prospecto
            </label>
            <textarea
              rows={2}
              value={notasDetalle}
              onChange={(e) => setNotasDetalle(e.target.value)}
              placeholder="¿Qué comentó exactamente en la llamada o chat? ¿Qué oferta alternativa aceptaría?..."
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="submit"
              className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Guardar en Base de Recuperación</span>
            </button>
          </div>
        </form>
      )}

      {/* Gráfico y Distribución de Causas de Pérdida */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-rose-600" />
          <span>Distribución Porcentual de Motivos de Pérdida</span>
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {entriesMotivo.map(([motivo, count]) => {
            const pct = totalPerdidos > 0 ? ((count / totalPerdidos) * 100).toFixed(0) : 0;
            return (
              <div key={motivo} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold block truncate" title={motivo}>
                  {motivo}
                </span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-base font-black font-mono text-slate-900">{count}</span>
                  <span className="text-xs font-mono font-bold text-rose-700">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filtros y listado */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por prospecto, teléfono o notas..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
          />
        </div>

        <select
          value={filtroMotivo}
          onChange={(e) => setFiltroMotivo(e.target.value)}
          className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
        >
          <option value="todos">Todos los Motivos</option>
          <option value="Precio / Fuera de Presupuesto">Precio / Dinero</option>
          <option value="Incompatibilidad de Horario">Incompatibilidad de Horario</option>
          <option value="Empresa No Aprobó Patrocinio">Patrocinio No Aprobado</option>
          <option value="Postergó para Futura Cohorte">Postergación</option>
        </select>
      </div>

      {/* Tarjetas de Prospectos Perdidos */}
      {leadsFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
          <UserX className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-black text-slate-800">
            No hay registros de leads o prospectos no inscritos
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            El equipo comercial puede registrar manualmente prospectos que no concretaron la matrícula, detallando el motivo para su posterior reactivación.
          </p>
          <button
            type="button"
            onClick={() => setMostrarFormulario(true)}
            className="mt-4 px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Primer Prospecto Perdido</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leadsFiltrados.map((l) => {
          const prog = proyectos.find(p => p.id === l.proyectoId);
          return (
            <div
              key={l.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between hover:border-rose-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                    {l.motivoPrincipal}
                  </span>
                  <select
                    value={l.estadoReactivacion}
                    onChange={(e) => handleCambiarEstado(l.id, e.target.value as LeadPerdido['estadoReactivacion'])}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border cursor-pointer ${
                      l.estadoReactivacion === 'Reactivado y Matriculado'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        : l.estadoReactivacion === 'En Campaña de Recuperación'
                        ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
                        : l.estadoReactivacion === 'Descartado Total'
                        ? 'bg-slate-100 text-slate-500 border-slate-200'
                        : 'bg-blue-50 text-blue-900 border-blue-200'
                    }`}
                  >
                    <option value="Reactivable Próxima Cohorte">Reactivable</option>
                    <option value="En Campaña de Recuperación">En Recuperación</option>
                    <option value="Reactivado y Matriculado">✓ Reactivado y Ganado</option>
                    <option value="Descartado Total">Descartado</option>
                  </select>
                </div>

                <h4 className="text-sm font-black text-slate-900">
                  {l.nombreProspecto}
                </h4>

                <p className="text-[11px] text-slate-600 font-semibold mt-0.5 truncate">
                  📚 {prog ? prog.nombreProyecto : 'Curso Asignado'}
                </p>

                <div className="mt-2 space-y-1 text-xs text-slate-500">
                  {l.telefono && (
                    <p className="text-[11px] font-mono flex items-center gap-1">
                      <PhoneCall className="w-3 h-3 text-slate-400" />
                      {l.telefono}
                    </p>
                  )}
                  {l.correo && (
                    <p className="text-[11px] text-blue-700 truncate">
                      ✉️ {l.correo}
                    </p>
                  )}
                </div>

                {l.notasDetalle && (
                  <p className="text-[11px] text-slate-600 italic mt-2.5 bg-rose-50/40 p-2 rounded-lg border border-rose-100/60 leading-relaxed">
                    "{l.notasDetalle}"
                  </p>
                )}
              </div>

              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 font-mono">
                  <Calendar className="w-3 h-3" />
                  Re-contactar: {l.fechaRecordatorio}
                </span>
                <button
                  type="button"
                  onClick={() => handleEliminar(l.id)}
                  className="text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
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
