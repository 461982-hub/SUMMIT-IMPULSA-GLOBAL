import React, { useState } from 'react';
import { 
  Target, 
  ShieldCheck, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Award, 
  Clock, 
  Layers, 
  FileSpreadsheet, 
  FileDown, 
  Sparkles,
  Check,
  X,
  ExternalLink
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { 
  calcularSeguimientoMensualPOA, 
  SeguimientoMensualPOA, 
  emitirAprobacionFinalGerenciaGeneral, 
  revocarAprobacionFinalGerenciaGeneral,
  META_ANUAL_FACTURACION_POA_HNL
} from '../../utils/poaMonthlyTrackingUtils';
import { formatearHNL } from '../../utils/poa2026Data';
import { formatearMoneda } from '../../utils/calculations';

interface POAMonthlyDeductionTrackingViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto: (p: ProyectoEducativo) => void;
  onVerDetalle?: (p: ProyectoEducativo) => void;
  onEditarProyecto?: (p: ProyectoEducativo) => void;
  filtroMesInicial?: string;
}

export const POAMonthlyDeductionTrackingView: React.FC<POAMonthlyDeductionTrackingViewProps> = ({
  proyectos,
  moneda,
  onGuardarProyecto,
  onVerDetalle,
  onEditarProyecto,
  filtroMesInicial,
}) => {
  const [mesExpandido, setMesExpandido] = useState<string | null>(filtroMesInicial || null);
  const [filtroTrimestre, setFiltroTrimestre] = useState<'TODOS' | 'Q1' | 'Q2' | 'Q3' | 'Q4'>('TODOS');
  const [mensajeConfirmacion, setMensajeConfirmacion] = useState<string | null>(null);

  const consolidado = calcularSeguimientoMensualPOA(proyectos, moneda);

  const mesesFiltrados = consolidado.meses.filter((m) => {
    if (filtroTrimestre === 'TODOS') return true;
    return m.trimestre === filtroTrimestre;
  });

  const handleAprobarProyecto = (proyecto: ProyectoEducativo) => {
    const proyectoAprobado = emitirAprobacionFinalGerenciaGeneral(
      proyecto,
      'Dr. Walter Pedroza - Gerencia General',
      'Aprobado formalmente por Gerencia General. Cumple rentabilidad y descuenta meta de facturación mensual del POA SEP - DIC 2026.',
      moneda
    );
    onGuardarProyecto(proyectoAprobado);

    const montoDesc = formatearHNL(proyectoAprobado.montoFacturacionAprobadaHNL || 0);
    setMensajeConfirmacion(`¡Proyecto "${proyecto.nombreProyecto}" aprobado formalmente! Se rebajaron ${montoDesc} de la meta mensual del POA.`);
    setTimeout(() => setMensajeConfirmacion(null), 4500);
  };

  const handleRevocarProyecto = (proyecto: ProyectoEducativo) => {
    const proyectoRevocado = revocarAprobacionFinalGerenciaGeneral(
      proyecto,
      'Dr. Walter Pedroza - Gerencia General',
      'Aprobación final revocada por la Gerencia General.'
    );
    onGuardarProyecto(proyectoRevocado);
    setMensajeConfirmacion(`Se revocó la aprobación final de "${proyecto.nombreProyecto}". El monto ya no descuenta la meta del POA.`);
    setTimeout(() => setMensajeConfirmacion(null), 4500);
  };

  return (
    <div className="space-y-6">
      
      {/* Notificación Flotante de Aprobación */}
      {mensajeConfirmacion && (
        <div className="bg-emerald-900 text-white px-4 py-3 rounded-xl border border-emerald-600 shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{mensajeConfirmacion}</span>
          </div>
          <button 
            onClick={() => setMensajeConfirmacion(null)}
            className="text-emerald-300 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Encabezado Directivo Principal */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-400/40 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
                Control Directivo • Gerencia General
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/40">
                POA SEP - DIC 2026
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Facturación Mensual vs. Planificación POA SEP - DIC 2026</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
              Sistema de verificación de cumplimiento financiero: Cada proyecto requiere la <strong>Aprobación Final de la Gerencia General</strong> para rebajar mensualmente su facturación real contra la cuota planificada en el Plan Operativo Anual.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Tipo de Cambio POA</span>
              <span className="text-xs font-mono font-black text-emerald-400">L. 27.00 / USD</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Tarjetas Métricas Clave de Facturación vs POA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Meta Anual POA */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Meta Cuatrimestral POA 2026
            </span>
            <Target className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {formatearHNL(consolidado.metaAnualPOAHNL)}
          </div>
          <p className="text-[11px] text-slate-500">
            Cuota planificada de 74 grupos piloto distribuidos en Sep - Dic 2026
          </p>
        </div>

        {/* 2. Facturación Aprobada por Gerencia General (Rebaja Oficial) */}
        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
              Facturación Aprobada (Rebajada)
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900 font-mono">
            {formatearHNL(consolidado.totalAprobadoGGHNL)}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
            <span>{consolidado.porcentajeCumplimientoAnualAprobado.toFixed(1)}% de la meta anual</span>
            <span>•</span>
            <span>{consolidado.proyectosAprobadosGG} proyectos con sello GG</span>
          </div>
        </div>

        {/* 3. Facturación en Espera de Aprobación */}
        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
              Facturación Pendiente de Sello GG
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 font-mono">
            {formatearHNL(consolidado.totalPendienteGGHNL)}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700">
            <span>{consolidado.proyectosPendientesGG} cursos en espera</span>
            <span>•</span>
            <span>Rebajarán al aprobarse</span>
          </div>
        </div>

        {/* 4. Saldo Restante Anual por Facturar */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
              Saldo Restante por Facturar
            </span>
            <TrendingUp className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 font-mono">
            {formatearHNL(consolidado.saldoRestanteAnualHNL)}
          </div>
          <p className="text-[11px] text-slate-500">
            {consolidado.superavitAnualHNL > 0 ? (
              <span className="text-emerald-700 font-bold">¡Meta superada en {formatearHNL(consolidado.superavitAnualHNL)}!</span>
            ) : (
              `Brecha restante para completar el 100% del POA 2026`
            )}
          </p>
        </div>

      </div>

      {/* Selector de Trimestres y Filtros */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="font-bold text-slate-700 mr-1">Filtrar Periodo:</span>
          {(['TODOS', 'Q3', 'Q4'] as const).map((trim) => (
            <button
              key={trim}
              onClick={() => setFiltroTrimestre(trim as any)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                filtroTrimestre === trim
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {trim === 'TODOS' ? 'Todos los Meses (Sep-Dic)' : `${trim}`}
            </button>
          ))}
        </div>

        <div className="text-[11px] text-slate-500">
          Mostrando <strong>{mesesFiltrados.length}</strong> periodos mensuales evaluados
        </div>
      </div>

      {/* Matriz Detallada Mes a Mes con Rebajas y Aprobaciones */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
              <span>Matriz de Rebaja Mensual de Facturación POA SEP - DIC 2026</span>
            </h3>
            <p className="text-[11px] text-slate-300">
              Despliega cada mes para inspeccionar los proyectos y emitir o revocar la Aprobación Final de la Gerencia General
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Periodo / Mes</th>
                <th className="py-3 px-3 text-center">Trimestre</th>
                <th className="py-3 px-3 text-right">Meta Planificada POA</th>
                <th className="py-3 px-3 text-right font-bold text-emerald-800 bg-emerald-50/50">
                  Facturado Aprobado GG (Rebajado)
                </th>
                <th className="py-3 px-3 text-right text-amber-800 bg-amber-50/50">
                  Pendiente de Sello GG
                </th>
                <th className="py-3 px-3 text-right font-bold text-slate-900">
                  Saldo Restante por Facturar
                </th>
                <th className="py-3 px-3 text-center">% Cumplimiento</th>
                <th className="py-3 px-3 text-center">Estado Directivo</th>
                <th className="py-3 px-3 text-center">Cursos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mesesFiltrados.map((m) => {
                const estaExpandido = mesExpandido === m.mesKey;
                const esMetaSuperada = m.estadoCumplimiento === 'META_SUPERADA';
                const esEnCamino = m.estadoCumplimiento === 'EN_CAMINO';
                const porcentaje = Math.min(100, m.porcentajeCumplimientoAprobado);

                return (
                  <React.Fragment key={m.mesKey}>
                    <tr className={`hover:bg-slate-50 transition-colors ${estaExpandido ? 'bg-indigo-50/30' : ''}`}>
                      
                      {/* Mes y Botón de Despliegue */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setMesExpandido(estaExpandido ? null : m.mesKey)}
                            className="p-1 text-slate-400 hover:text-slate-800 rounded transition-colors cursor-pointer"
                            title="Ver cursos impartidos y sus aprobaciones"
                          >
                            {estaExpandido ? <ChevronUp className="w-4 h-4 text-indigo-600" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <span>{m.etiquetaMes}</span>
                        </div>
                      </td>

                      {/* Trimestre */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {m.trimestre}
                        </span>
                      </td>

                      {/* Meta Planificada POA */}
                      <td className="py-3.5 px-3 text-right font-mono font-semibold text-slate-700">
                        {formatearHNL(m.metaFacturacionPOAHNL)}
                      </td>

                      {/* Facturado Aprobado GG (Rebajado) */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-800 bg-emerald-50/30">
                        {formatearHNL(m.facturacionAprobadaGGHNL)}
                        {m.facturacionAprobadaGGHNL > 0 && (
                          <div className="text-[9px] text-emerald-600 font-sans">
                            -{formatearHNL(m.facturacionAprobadaGGHNL)} al POA
                          </div>
                        )}
                      </td>

                      {/* Pendiente de Aprobación GG */}
                      <td className="py-3.5 px-3 text-right font-mono text-amber-800 bg-amber-50/30 font-medium">
                        {formatearHNL(m.facturacionPendienteGGHNL)}
                        {m.proyectosPendientesGG > 0 && (
                          <div className="text-[9px] text-amber-600 font-sans">
                            {m.proyectosPendientesGG} cursos en espera
                          </div>
                        )}
                      </td>

                      {/* Saldo Restante por Facturar */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                        {m.saldoRestantePOAHNL === 0 ? (
                          <span className="text-emerald-700 font-bold">
                            Cubierto (+{formatearHNL(m.superavitPOAHNL)})
                          </span>
                        ) : (
                          formatearHNL(m.saldoRestantePOAHNL)
                        )}
                      </td>

                      {/* % Cumplimiento y Barra */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="space-y-1 w-24 mx-auto">
                          <div className="font-mono font-bold text-slate-900 text-xs">
                            {m.porcentajeCumplimientoAprobado.toFixed(1)}%
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full ${
                                esMetaSuperada
                                  ? 'bg-emerald-500'
                                  : esEnCamino
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${porcentaje}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Estado Directivo */}
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          esMetaSuperada
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : esEnCamino
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-rose-100 text-rose-900 border-rose-300'
                        }`}>
                          {esMetaSuperada ? '🟢 Meta Superada' : esEnCamino ? '🟡 En Camino' : '🔴 Déficit / Pendiente'}
                        </span>
                      </td>

                      {/* Cursos */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => setMesExpandido(estaExpandido ? null : m.mesKey)}
                          className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer border border-indigo-200"
                        >
                          <span>{m.proyectosTotales} cursos</span>
                        </button>
                      </td>

                    </tr>

                    {/* Fila Desplegable con los Proyectos del Mes y sus Aprobaciones */}
                    {estaExpandido && (
                      <tr className="bg-slate-50">
                        <td colSpan={9} className="p-4 border-y border-slate-200">
                          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
                            
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                              <div>
                                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Cursos del Periodo {m.etiquetaMes} ({m.proyectos.length} registrados)</span>
                                </h4>
                                <p className="text-[11px] text-slate-500">
                                  Emite o revoca la Aprobación Final de la Gerencia General para aplicar la rebaja mensual a la meta del POA.
                                </p>
                              </div>

                              <div className="flex items-center gap-3 text-xs font-mono">
                                <div>
                                  <span className="text-slate-500">Aprobados GG: </span>
                                  <strong className="text-emerald-700">{m.proyectosAprobadosGG}</strong>
                                </div>
                                <div>
                                  <span className="text-slate-500">Pendientes: </span>
                                  <strong className="text-amber-700">{m.proyectosPendientesGG}</strong>
                                </div>
                              </div>
                            </div>

                            {m.proyectos.length === 0 ? (
                              <div className="p-4 text-center text-slate-500 text-xs">
                                No hay proyectos programados para este mes aún.
                              </div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                  <thead className="bg-slate-100/70 text-slate-700 font-bold text-[11px]">
                                    <tr>
                                      <th className="py-2.5 px-3">Proyecto / Docente</th>
                                      <th className="py-2.5 px-2 text-center">Tipo</th>
                                      <th className="py-2.5 px-2 text-center">Alumnos</th>
                                      <th className="py-2.5 px-3 text-right">Facturación Estimada</th>
                                      <th className="py-2.5 px-3 text-center">Estado Operativo</th>
                                      <th className="py-2.5 px-3 text-center">Aprobación Final GG</th>
                                      <th className="py-2.5 px-3 text-right">Acción Directiva</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {m.proyectos.map((p) => {
                                      const estaAprobado = Boolean(p.aprobacionFinalGerenciaGeneral);
                                      const facturacionHNL = (p.ingresoRealTotal || 0) * (moneda === 'USD' ? 27 : 1);

                                      return (
                                        <tr key={p.id} className="hover:bg-slate-50">
                                          
                                          {/* Proyecto */}
                                          <td className="py-2.5 px-3">
                                            <div className="font-bold text-slate-900">
                                              {p.nombreProyecto}
                                            </div>
                                            <div className="text-[11px] text-slate-500">
                                              Docente: <strong className="text-slate-700">{p.nombreDocente}</strong> ({p.horasClase} hrs)
                                            </div>
                                          </td>

                                          {/* Tipo */}
                                          <td className="py-2.5 px-2 text-center text-[10px]">
                                            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                                              {p.tipoProyecto.length > 25 ? p.tipoProyecto.slice(0, 25) + '...' : p.tipoProyecto}
                                            </span>
                                          </td>

                                          {/* Alumnos */}
                                          <td className="py-2.5 px-2 text-center font-mono font-semibold">
                                            {p.alumnosFinal} <span className="text-slate-400 font-normal">/ {p.alumnosProyectados}</span>
                                          </td>

                                          {/* Facturación */}
                                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                            {formatearMoneda(p.ingresoRealTotal, moneda)}
                                          </td>

                                          {/* Estado Operativo */}
                                          <td className="py-2.5 px-3 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                              p.seLlevoACabo === 'Listo' || p.seLlevoACabo === 'Sí'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : p.seLlevoACabo === 'En proceso'
                                                ? 'bg-amber-100 text-amber-800'
                                                : 'bg-slate-100 text-slate-700'
                                            }`}>
                                              {p.seLlevoACabo}
                                            </span>
                                          </td>

                                          {/* Aprobación Final GG */}
                                          <td className="py-2.5 px-3 text-center">
                                            {estaAprobado ? (
                                              <div className="inline-flex flex-col items-center">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded-full text-[10px] font-black border border-emerald-300">
                                                  <ShieldCheck className="w-3 h-3 text-emerald-700" />
                                                  <span>Aprobado por GG</span>
                                                </span>
                                                <span className="text-[9px] text-emerald-700 font-semibold mt-0.5">
                                                  Rebaja L. {facturacionHNL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </span>
                                              </div>
                                            ) : (
                                              <div className="inline-flex flex-col items-center">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full text-[10px] font-bold border border-amber-300">
                                                  <Clock className="w-3 h-3 text-amber-700" />
                                                  <span>Pendiente Aprobación</span>
                                                </span>
                                                <span className="text-[9px] text-slate-500 mt-0.5">
                                                  No rebaja el POA aún
                                                </span>
                                              </div>
                                            )}
                                          </td>

                                          {/* Acciones */}
                                          <td className="py-2.5 px-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                              {estaAprobado ? (
                                                <button
                                                  type="button"
                                                  onClick={() => handleRevocarProyecto(p)}
                                                  className="px-2 py-1 text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                                                  title="Revocar aprobación final de Gerencia General"
                                                >
                                                  Revocar
                                                </button>
                                              ) : (
                                                <button
                                                  type="button"
                                                  onClick={() => handleAprobarProyecto(p)}
                                                  className="px-2.5 py-1 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                                                  title="Emitir Aprobación Final de Gerencia General y rebajar del POA"
                                                >
                                                  <Check className="w-3 h-3" />
                                                  <span>Aprobar y Rebajar POA</span>
                                                </button>
                                              )}

                                              {onVerDetalle && (
                                                <button
                                                  type="button"
                                                  onClick={() => onVerDetalle(p)}
                                                  className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                                                  title="Ver ficha completa del proyecto"
                                                >
                                                  <ExternalLink className="w-3.5 h-3.5" />
                                                </button>
                                              )}
                                            </div>
                                          </td>

                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}

                          </div>
                        </td>
                      </tr>
                    )}

                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
