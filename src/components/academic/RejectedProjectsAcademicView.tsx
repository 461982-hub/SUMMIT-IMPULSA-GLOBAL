import React, { useState } from 'react';
import { 
  XCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench, 
  Eye, 
  Search, 
  Calendar, 
  Clock, 
  User, 
  DollarSign, 
  ArrowRight, 
  FileText,
  Building2,
  RotateCcw,
  Sparkles,
  Mail
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { formatearMoneda } from '../../utils/calculations';

interface RejectedProjectsAcademicViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onCorregirProyecto: (p: ProyectoEducativo) => void;
  onVerFicha: (p: ProyectoEducativo) => void;
  onEliminarProyecto?: (p: ProyectoEducativo) => void;
  onVerAlertaEmail?: (p: ProyectoEducativo) => void;
}

export const RejectedProjectsAcademicView: React.FC<RejectedProjectsAcademicViewProps> = ({
  proyectos,
  moneda,
  onCorregirProyecto,
  onVerFicha,
  onEliminarProyecto,
  onVerAlertaEmail,
}) => {
  const [busqueda, setBusqueda] = useState('');

  // Proyectos rechazados por Gerencia General que requieren corrección de Gerencia Académica
  const proyectosRechazados = proyectos.filter(
    (p) =>
      p.rechazadoPorGerenciaGeneral === true ||
      p.etapaFlujo === 'rechazado_gerencia_general' ||
      (p.etapaFlujo === 'elaboracion_academica' && Boolean(p.motivoRechazoGerenciaGeneral))
  );

  const proyectosFiltrados = proyectosRechazados.filter((p) => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    return (
      p.nombreProyecto.toLowerCase().includes(q) ||
      (p.codigoProyecto && p.codigoProyecto.toLowerCase().includes(q)) ||
      (p.correlativoSAR && p.correlativoSAR.toLowerCase().includes(q)) ||
      (p.nombreDocente && p.nombreDocente.toLowerCase().includes(q)) ||
      (p.motivoRechazoGerenciaGeneral && p.motivoRechazoGerenciaGeneral.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* ENCABEZADO DE SECCIÓN & EXPLICACIÓN DEL FLUJO INSTITUCIONAL */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-900 rounded-2xl p-5 text-white shadow-md border border-rose-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-rose-600/30 border border-rose-400/40 flex items-center justify-center text-rose-300 shrink-0">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black uppercase tracking-wide text-white">
                  Proyectos & Sílabos Rechazados por Gerencia General
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white font-mono shadow-xs">
                  {proyectosRechazados.length} pendientes de corrección
                </span>
              </div>
              <p className="text-xs text-rose-200/90 mt-1 max-w-3xl leading-relaxed">
                Bandeja oficial de subsanación curricular. Cuando Gerencia General identifica inconsistencias financieras o académicas en la revisión de la ficha completa, el sílabo retorna a esta sección con la razón explícita del dictamen. Aplique los ajustes requeridos y reenvíe el expediente para su aprobación y pase a Comercialización.
              </p>
            </div>
          </div>

          {/* Resumen del ciclo */}
          <div className="bg-white/10 rounded-xl p-3 border border-white/10 shrink-0 text-xs space-y-1">
            <div className="font-bold text-rose-200 text-[11px] uppercase tracking-wider">
              Ciclo Institucional SUMMIT
            </div>
            <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
              <span className="font-bold text-rose-400">1. Rechazo GG</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="font-bold text-amber-300">2. Corrección Académica</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="font-bold text-blue-300">3. Reenvío a GG</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="font-bold text-emerald-300">4. Comercialización</span>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTRADO */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por proyecto, código, docente o motivo de rechazo..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:bg-white transition-colors"
          />
        </div>

        <div className="text-xs font-semibold text-slate-600">
          Mostrando <span className="font-bold text-rose-900">{proyectosFiltrados.length}</span> de <span className="font-bold">{proyectosRechazados.length}</span> programas rechazados
        </div>
      </div>

      {/* ESTADO VACÍO: SI NO HAY RECHAZADOS */}
      {proyectosRechazados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-base font-bold text-slate-900">
              ¡Sin Sílabos Rechazados!
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              No hay proyectos ni sílabos devueltos por Gerencia General pendientes de corrección. Todos los expedientes académicos están aprobados o en proceso regular de evaluación.
            </p>
          </div>
        </div>
      ) : proyectosFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
          No se encontraron proyectos rechazados con el criterio "{busqueda}".
        </div>
      ) : (
        /* LISTADO DE PROYECTOS RECHAZADOS CON SU MOTIVO Y OPCIÓN DE CORREGIR */
        <div className="space-y-4">
          {proyectosFiltrados.map((p) => {
            const codEmpresa = p.codigoProyecto || p.codigoPrograma || `SIG-ACAD-${p.id}`;
            const codSAR = p.correlativoSAR || 'Sin asignar';
            const motivoRechazo = p.motivoRechazoGerenciaGeneral || p.observacionesRevisionGeneral || 'Se identificaron inconsistencias financieras o en la estructura del sílabo. Requiere ajuste curricular y presupuestario.';
            const fechaRechazo = p.fechaRechazoGerenciaGeneral 
              ? new Date(p.fechaRechazoGerenciaGeneral).toLocaleString('es-HN') 
              : p.fechaModificacion || 'Reciente';

            return (
              <div 
                key={p.id}
                className="bg-white rounded-2xl border-2 border-rose-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Cabecera del Expediente */}
                <div className="bg-rose-50/70 px-5 py-3 border-b border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 bg-rose-600 text-white rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                      <XCircle className="w-3 h-3" />
                      <span>Rechazado por Gerencia General</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                      Empresa: {codEmpresa}
                    </span>
                    <span className="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      SAR: {codSAR}
                    </span>
                    <span className="text-xs font-semibold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      Nivel: {p.nivel || 'Básico'}
                    </span>
                  </div>

                  <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1 shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Fecha de Rechazo: <strong className="text-slate-700">{fechaRechazo}</strong></span>
                  </div>
                </div>

                {/* Contenido Central */}
                <div className="p-5 space-y-4">
                  <div>
                    <h4 className="text-base font-black text-slate-900 tracking-tight">
                      {p.nombreProyecto}
                    </h4>
                    {p.objetivoGeneral && (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {p.objetivoGeneral}
                      </p>
                    )}
                  </div>

                  {/* CAJA DE ALERTA: RAZÓN DEL RECHAZO DICTADA POR GERENCIA GENERAL */}
                  <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300 space-y-2">
                    <div className="flex items-center gap-2 text-rose-950 font-black text-xs uppercase tracking-wide">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Razón del Rechazo por Gerencia General (Dictamen Oficial)</span>
                    </div>
                    <div className="text-xs text-rose-900 font-medium bg-white/90 p-3 rounded-lg border border-rose-200 leading-relaxed">
                      "{motivoRechazo}"
                    </div>
                    <p className="text-[11px] text-rose-800">
                      💡 <strong>Acción requerida:</strong> Presione el botón <strong>"🛠️ Corregir Sílabo / Proyecto"</strong> a continuación. Se abrirá el formulario completo del sílabo para ajustar los costos, horas, módulos o tarifas. Al guardar, el expediente volverá automáticamente a Gerencia General para su revisión y aprobación.
                    </p>
                  </div>

                  {/* Resumen de Datos Clave */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block font-semibold">Docente Propuesto:</span>
                      <span className="font-bold text-slate-800 truncate block">{p.nombreDocente || 'Por asignar'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block font-semibold">Horas Clase:</span>
                      <span className="font-bold text-slate-800">{p.horasClase || 0} hrs</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block font-semibold">Costo Operativo:</span>
                      <span className="font-bold text-slate-800">{formatearMoneda(p.gastoTotalOperativo || 0, moneda)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block font-semibold">Precio Final Sugerido (ISV):</span>
                      <span className="font-bold text-emerald-700 font-mono">
                        {formatearMoneda(p.precioFinalAlumnoConISV || p.precioSugeridoVentaNeto || 0, moneda)}
                      </span>
                    </div>
                  </div>

                  {/* BOTONERA DE ACCIÓN: CORREGIR Y REENVIAR */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-[11px] text-slate-500 font-medium">
                        Estado actual: <span className="font-bold text-rose-700">En corrección académica</span>
                      </div>
                      <span className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono">
                        <Mail className="w-3 h-3 text-emerald-600" />
                        Alerta email emitida a: academia.summitg@gmail.com
                      </span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                      {/* Botón Ver Alerta Email */}
                      {onVerAlertaEmail && (
                        <button
                          type="button"
                          onClick={() => onVerAlertaEmail(p)}
                          className="w-full sm:w-auto px-3 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-800 text-xs font-bold transition-colors cursor-pointer border border-rose-300 flex items-center justify-center gap-1.5 shadow-2xs"
                          title="Ver y reenviar la alerta oficial por correo electrónico"
                        >
                          <Mail className="w-3.5 h-3.5 text-rose-600" />
                          <span>Ver Alerta Email</span>
                        </button>
                      )}

                      {/* Botón Ver Ficha Actual */}
                      <button
                        type="button"
                        onClick={() => onVerFicha(p)}
                        className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer border border-slate-300 flex items-center justify-center gap-1.5"
                        title="Ver la ficha completa del sílabo antes de editar"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span>Ver Ficha</span>
                      </button>

                      {/* Botón Principal: Corregir Sílabo / Proyecto */}
                      <button
                        type="button"
                        onClick={() => onCorregirProyecto(p)}
                        className="w-full sm:w-auto px-4.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-700 hover:from-rose-500 hover:to-indigo-600 text-white text-xs font-black transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                        title="Abrir editor para corregir el sílabo y reenviarlo a Gerencia General"
                      >
                        <Wrench className="w-4 h-4 text-white" />
                        <span>🛠️ Corregir Sílabo</span>
                      </button>
                    </div>
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
