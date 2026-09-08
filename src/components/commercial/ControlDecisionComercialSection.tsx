import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight, 
  Eye, 
  HelpCircle,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { 
  sumarDiasCalendario, 
  contarDiasCalendarioEntreFechas, 
  formatearFechaCorta 
} from '../../utils/dateUtils';
import { formatearMoneda, calcularMetricasProyecto } from '../../utils/calculations';

interface ControlDecisionComercialSectionProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto: (p: ProyectoEducativo) => void;
  onVerDetalle?: (p: ProyectoEducativo) => void;
  onNotificar?: (mensaje: string) => void;
  filtroProyectoId?: string;
}

export const ControlDecisionComercialSection: React.FC<ControlDecisionComercialSectionProps> = ({
  proyectos,
  moneda,
  onGuardarProyecto,
  onVerDetalle,
  onNotificar,
  filtroProyectoId,
}) => {
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pendientes' | 'continuaron' | 'cerrados'>('todos');
  const [busquedaLocal, setBusquedaLocal] = useState('');

  // Fecha de hoy en formato YYYY-MM-DD
  const hoyStr = new Date().toISOString().slice(0, 10);

  // Proyectos a evaluar
  const proyectosFiltrados = proyectos.filter((p) => {
    if (filtroProyectoId && p.id !== filtroProyectoId) return false;

    if (busquedaLocal) {
      const q = busquedaLocal.toLowerCase();
      const coincide = 
        p.nombreProyecto.toLowerCase().includes(q) ||
        p.nombreDocente.toLowerCase().includes(q) ||
        (p.codigoPrograma && p.codigoPrograma.toLowerCase().includes(q));
      if (!coincide) return false;
    }

    if (filtroEstado === 'pendientes') {
      return !p.decisionPlazoVenta && p.seLlevoACabo !== 'No se llevó a cabo' && !p.procesoCerrado;
    }
    if (filtroEstado === 'continuaron') {
      return p.decisionPlazoVenta === 'Si' || (p.seLlevoACabo !== 'No se llevó a cabo' && !p.procesoCerrado && p.fechaRegistroDecision);
    }
    if (filtroEstado === 'cerrados') {
      return p.decisionPlazoVenta === 'No' || p.seLlevoACabo === 'No se llevó a cabo' || p.procesoCerrado;
    }

    return true;
  });

  // Métricas rápidas
  const totalCerradosNo = proyectos.filter(p => p.decisionPlazoVenta === 'No' || p.seLlevoACabo === 'No se llevó a cabo' || p.procesoCerrado).length;
  const totalContinuaronSi = proyectos.filter(p => p.decisionPlazoVenta === 'Si' || (p.seLlevoACabo !== 'No se llevó a cabo' && p.fechaRegistroDecision && !p.procesoCerrado)).length;
  const totalPendientes = proyectos.length - totalCerradosNo - totalContinuaronSi;

  // Manejador para registrar decisión "SÍ" (El proceso continúa)
  const handleRegistrarDecisionSi = (proyecto: ProyectoEducativo) => {
    const ahora = new Date();
    const fechaHoy = ahora.toISOString().slice(0, 10);
    const horaHoy = ahora.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    const actualizado = calcularMetricasProyecto({
      ...proyecto,
      decisionPlazoVenta: 'Si',
      tiempoVentaCumplido: false,
      seLlevoACabo: proyecto.seLlevoACabo === 'No se llevó a cabo' ? 'En proceso' : (proyecto.seLlevoACabo || 'En proceso'),
      procesoCerrado: false,
      etapaFlujo: proyecto.etapaFlujo === 'cerrado' ? 'comercializacion' : proyecto.etapaFlujo,
      fechaRegistroDecision: fechaHoy,
      horaRegistroDecision: horaHoy,
      detalleRegistroDecision: `Decisión registrada en Gerencia de Comercialización: SÍ - El proceso continúa su curso institucional hacia matrícula y dictamen de Gerencia General (${fechaHoy} ${horaHoy}).`,
    });

    onGuardarProyecto(actualizado);
    if (onNotificar) {
      onNotificar(`✅ Decisión registrada: SÍ — El proyecto "${proyecto.nombreProyecto}" continúa en el flujo institucional.`);
    }
  };

  // Manejador para registrar decisión "NO" (El proceso se cierra automáticamente como "No se llevó a cabo")
  const handleRegistrarDecisionNo = (proyecto: ProyectoEducativo) => {
    const ahora = new Date();
    const fechaHoy = ahora.toISOString().slice(0, 10);
    const horaHoy = ahora.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    const actualizado = calcularMetricasProyecto({
      ...proyecto,
      decisionPlazoVenta: 'No',
      tiempoVentaCumplido: true,
      seLlevoACabo: 'No se llevó a cabo',
      procesoCerrado: true,
      etapaFlujo: 'cerrado',
      fechaCierrePorTiempo: fechaHoy,
      fechaRegistroDecision: fechaHoy,
      horaRegistroDecision: horaHoy,
      motivoCierre: `Decisión en Gerencia de Comercialización: NO - Proceso cerrado formalmente como "No se llevó a cabo" (Plazo de 20 días calendario cumplido) (${fechaHoy} ${horaHoy}).`,
      detalleRegistroDecision: `Decisión registrada en Gerencia de Comercialización: NO - Proceso cerrado formalmente como "No se llevó a cabo" dentro del plazo de 20 días calendario (${fechaHoy} ${horaHoy}).`,
    });

    onGuardarProyecto(actualizado);
    if (onNotificar) {
      onNotificar(`⏹️ Decisión registrada: NO — El proyecto "${proyecto.nombreProyecto}" ha sido cerrado formalmente como "No se llevó a cabo".`);
    }
  };

  return (
    <div className="bg-white border-2 border-emerald-300/80 rounded-2xl p-5 shadow-xs space-y-4">
      
      {/* Encabezado Principal de la Sección de Control de Decisión */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-700" />
              Control Institucional Comercial
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
              ⚡ 20 Días Calendario Corridos
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
            <span>Decisión en Plazo de Comercialización (20 Días Calendario)</span>
          </h3>
          <p className="text-xs text-slate-600 mt-0.5 max-w-3xl leading-relaxed">
            Una vez que la Gerencia Académica crea y elabora el proyecto, inicia el plazo institucional de <strong>20 días calendario</strong> para su comercialización.
            Si se selecciona <strong>"Sí"</strong>, el proceso <strong>continúa</strong> hacia la matrícula y dictamen general. 
            Si se selecciona <strong>"No"</strong>, el proceso <strong>se cierra automáticamente</strong> como <strong>"No se llevó a cabo"</strong>. 
            Ambos procesos quedan formalmente registrados con fecha, hora y detalle para el control institucional.
          </p>
        </div>

        {/* Resumen numérico */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setFiltroEstado('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              filtroEstado === 'todos' 
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Todos ({proyectos.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('pendientes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              filtroEstado === 'pendientes' 
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs' 
                : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
            }`}
          >
            Pendientes ({totalPendientes})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('continuaron')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              filtroEstado === 'continuaron' 
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            Continúan: SÍ ({totalContinuaronSi})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('cerrados')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              filtroEstado === 'cerrados' 
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs' 
                : 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100'
            }`}
          >
            Cerrados: NO ({totalCerradosNo})
          </button>
        </div>
      </div>

      {/* Lista de Proyectos con el Control de Decisión en Plazo de 20 Días Calendario */}
      <div className="space-y-3">
        {proyectosFiltrados.length === 0 ? (
          <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            No se encontraron proyectos bajo el filtro seleccionado.
          </div>
        ) : (
          proyectosFiltrados.map((p) => {
            const fechaCreacion = p.fechaElaboracion || p.fechaCreacion?.slice(0, 10) || p.fechaProgramacion || hoyStr;
            const fechaLimiteAuto20 = p.fechaVenta || sumarDiasCalendario(fechaCreacion, 20);
            const diasTranscurridos = Math.max(0, contarDiasCalendarioEntreFechas(fechaCreacion, hoyStr));
            const diasRestantes = Math.max(0, contarDiasCalendarioEntreFechas(hoyStr, fechaLimiteAuto20));
            const plazoExcedido = diasTranscurridos > 20 && !p.decisionPlazoVenta;

            const esSi = p.decisionPlazoVenta === 'Si';
            const esNo = p.decisionPlazoVenta === 'No' || p.seLlevoACabo === 'No se llevó a cabo' || p.procesoCerrado;

            return (
              <div 
                key={p.id}
                className={`p-4 rounded-xl border transition-all ${
                  esNo 
                    ? 'bg-rose-50/70 border-rose-300' 
                    : esSi 
                    ? 'bg-emerald-50/70 border-emerald-300' 
                    : plazoExcedido 
                    ? 'bg-amber-50/80 border-amber-300' 
                    : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  
                  {/* Información del Proyecto y Fechas */}
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-300 shadow-2xs">
                        {p.codigoPrograma || 'PROG-2026'}
                      </span>
                      <span className="text-xs font-black text-slate-900 truncate">
                        {p.nombreProyecto}
                      </span>
                      <span className="text-xs text-slate-600">
                        • Facilitador: <strong className="text-slate-800">{p.nombreDocente}</strong>
                      </span>
                      {p.numeroCorrelativo && (
                        <span className="text-[10px] font-mono text-slate-500">
                          (Corr: {p.numeroCorrelativo})
                        </span>
                      )}
                    </div>

                    {/* Barra de Cronología: Creación Académica vs Fin Plazo 20 Días Calendario */}
                    <div className="flex items-center gap-2 text-xs flex-wrap text-slate-600">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        <Calendar className="w-3 h-3 text-emerald-600" />
                        Creación Académica: <strong className="font-mono text-emerald-950">{formatearFechaCorta(fechaCreacion)}</strong>
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="inline-flex items-center gap-1 font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        <Clock className="w-3 h-3 text-blue-600" />
                        Límite Venta (20d Calendario): <strong className="font-mono">{formatearFechaCorta(fechaLimiteAuto20)}</strong>
                      </span>
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                        ⏱️ Transcurridos: {diasTranscurridos}/20 días corridos ({diasRestantes > 0 ? `${diasRestantes}d restantes` : 'Plazo cumplido'})
                      </span>
                    </div>

                    {/* Registro de Auditoría Formal de la Decisión */}
                    {p.fechaRegistroDecision && (
                      <div className="text-[11px] flex items-center gap-1.5 flex-wrap mt-1">
                        <span className={`font-bold px-2 py-0.5 rounded border ${
                          esNo 
                            ? 'bg-rose-100 text-rose-900 border-rose-300' 
                            : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        }`}>
                          {esNo ? '⏹️ Registrado: NO (No se llevó a cabo)' : '✅ Registrado: SÍ (El proceso continúa)'}
                        </span>
                        <span className="text-slate-500 font-mono">
                          Fecha/Hora: {p.fechaRegistroDecision} {p.horaRegistroDecision || ''}
                        </span>
                        {p.detalleRegistroDecision && (
                          <span className="text-slate-600 italic">
                            — {p.detalleRegistroDecision}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Acciones: Botones Sí (Continúa) / No (Cerrar) y Ficha del Proyecto */}
                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                    
                    {/* Botón SÍ: El proceso continúa */}
                    <button
                      type="button"
                      onClick={() => handleRegistrarDecisionSi(p)}
                      title="Registra formalmente que el proyecto continúa activo en el flujo institucional"
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border shadow-2xs ${
                        esSi
                          ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-400'
                          : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-current" />
                      <span>Sí</span>
                      <span className="text-[10px] font-normal opacity-90">(Continúa)</span>
                    </button>

                    {/* Botón NO: Se cierra automáticamente como No se llevó a cabo */}
                    <button
                      type="button"
                      onClick={() => handleRegistrarDecisionNo(p)}
                      title="Cierra automáticamente el proceso y lo registra formalmente como 'No se llevó a cabo'"
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border shadow-2xs ${
                        esNo
                          ? 'bg-rose-600 text-white border-rose-700 ring-2 ring-rose-400'
                          : 'bg-white text-rose-800 border-rose-300 hover:bg-rose-50'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5 text-current" />
                      <span>No</span>
                      <span className="text-[10px] font-normal opacity-90">(Cerrar)</span>
                    </button>

                    {/* Botón Ver Ficha del Proyecto */}
                    {onVerDetalle && (
                      <button
                        type="button"
                        onClick={() => onVerDetalle(p)}
                        className="p-2 bg-white text-slate-700 hover:text-slate-950 border border-slate-300 hover:border-slate-400 rounded-xl transition-colors shadow-2xs cursor-pointer"
                        title="Abrir la Ficha Completa del Proyecto"
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                      </button>
                    )}
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
