import React, { useState, useEffect } from 'react';
import { 
  Copy, 
  Sparkles, 
  Calendar, 
  X, 
  Check, 
  BookOpen, 
  Users, 
  Clock, 
  ArrowRight,
  Layers
} from 'lucide-react';
import { ProyectoEducativo } from '../../types';
import { generarSiguienteCorrelativo, formatearCorrelativo } from '../../utils/correlativoUtils';
import { sumarDiasCalendario } from '../../utils/dateUtils';
import { calcularMetricasProyecto } from '../../utils/calculations';

interface DuplicateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyectoBase: ProyectoEducativo | null;
  proyectosExistentes: ProyectoEducativo[];
  onProyectoDuplicado: (nuevo: ProyectoEducativo) => void;
}

export const DuplicateProjectModal: React.FC<DuplicateProjectModalProps> = ({
  isOpen,
  onClose,
  proyectoBase,
  proyectosExistentes,
  onProyectoDuplicado,
}) => {
  const [seccionNueva, setSeccionNueva] = useState('Sección B');
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [fechaInicioNueva, setFechaInicioNueva] = useState('');
  const [horarioNuevo, setHorarioNuevo] = useState('');
  const [diasNuevo, setDiasNuevo] = useState('');
  const [nombreDocenteNuevo, setNombreDocenteNuevo] = useState('');

  useEffect(() => {
    if (proyectoBase) {
      // Determinar sugerencia de sección
      const secActual = proyectoBase.seccion || 'Sección A';
      let secSugerida = 'Sección B';
      if (secActual.toLowerCase().includes('sección a') || secActual.toLowerCase().includes('sec. a')) {
        secSugerida = 'Sección B';
      } else if (secActual.toLowerCase().includes('sección b')) {
        secSugerida = 'Sección C';
      } else {
        secSugerida = 'Nueva Cohorte 2026';
      }

      setSeccionNueva(secSugerida);
      setNombreNuevo(proyectoBase.nombreProyecto);
      
      // Fecha de inicio sugerida: 30 días posteriores o fecha actual
      const hoy = new Date().toISOString().slice(0, 10);
      setFechaInicioNueva(sumarDiasCalendario(hoy, 30));
      setHorarioNuevo(proyectoBase.horario || '06:00 PM - 08:00 PM');
      setDiasNuevo(proyectoBase.diasClase || 'Lunes, Miércoles y Viernes');
      setNombreDocenteNuevo(proyectoBase.nombreDocente);
    }
  }, [proyectoBase]);

  if (!isOpen || !proyectoBase) return null;

  const infoCorrelativo = generarSiguienteCorrelativo(proyectosExistentes, proyectoBase.tipoProyecto);
  const siguienteCorrelativo = infoCorrelativo.numeroCorrelativo;
  const correlativoFormateado = formatearCorrelativo(siguienteCorrelativo);
  const nuevoCodigo = infoCorrelativo.codigoPrograma;
  const hoyISO = new Date().toISOString().slice(0, 10);
  const horaActual = new Date().toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  const handleCrearDuplicado = (e: React.FormEvent) => {
    e.preventDefault();

    const fechaElaboracion = hoyISO;
    const fechaVentaAuto20 = sumarDiasCalendario(fechaElaboracion, 20);

    const nuevoProyecto: ProyectoEducativo = {
      ...proyectoBase,
      id: String(Date.now()),
      numeroCorrelativo: siguienteCorrelativo,
      codigoPrograma: nuevoCodigo,
      codigoFiscalSAR: infoCorrelativo.codigoFiscalSAR,
      nombreProyecto: nombreNuevo.trim() || proyectoBase.nombreProyecto,
      seccion: seccionNueva.trim() || 'Sección B',
      fechaProgramacion: fechaInicioNueva || hoyISO,
      horario: horarioNuevo.trim() || proyectoBase.horario,
      diasClase: diasNuevo.trim() || proyectoBase.diasClase,
      nombreDocente: nombreDocenteNuevo.trim() || proyectoBase.nombreDocente,
      
      // Reinicio de ciclo de vida para nueva cohorte/sección
      fechaElaboracion,
      horaElaboracion: horaActual,
      fechaCreacion: new Date().toISOString(),
      horaCreacion: horaActual,
      fechaHoraGrabacion: `${new Date().toLocaleDateString('es-HN')}, ${horaActual}`,
      diasHabilesVenta: 20,
      diasCalendarioVenta: 20,
      fechaVenta: fechaVentaAuto20,
      seLlevoACabo: 'Planificado',
      decisionPlazoVenta: undefined,
      fechaRegistroDecision: undefined,
      horaRegistroDecision: undefined,
      detalleRegistroDecision: undefined,
      tiempoVentaCumplido: false,
      procesoCerrado: false,
      fechaCierrePorTiempo: undefined,
      motivoCierre: undefined,
      etapaFlujo: 'academica',
      nivelFlujoActual: 1,
      autorizacionAcademica: true,
      fechaAutorizacionAcademica: new Date().toISOString(),
      comercializacionCompletada: false,
      autorizacionComercial: false,
      aprobacionFinalGerenciaGeneral: false,
      alumnosFinal: proyectoBase.alumnosProyectados || 6,
      observaciones: `Nueva cohorte / edición generada a partir de ${proyectoBase.nombreProyecto} (${proyectoBase.seccion || 'Sección A'} - #${proyectoBase.numeroCorrelativo || proyectoBase.id}).`,
    };

    const recalculado = calcularMetricasProyecto(nuevoProyecto);
    onProyectoDuplicado(recalculado);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Cabecera */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Copy className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 bg-blue-500/30 text-blue-200 rounded border border-blue-400/30">
                  Gerencia Académica
                </span>
                <span className="text-xs text-blue-300 font-medium">
                  Nuevo Correlativo: #{correlativoFormateado}
                </span>
              </div>
              <h3 className="text-base font-bold text-white">
                Duplicar Diseño Curricular (Nueva Edición / Sección)
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleCrearDuplicado} className="p-5 space-y-4 text-xs">
          
          <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200 text-slate-800">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
              Programa Base a Clonar
            </span>
            <div className="font-bold text-sm text-blue-950 mt-0.5">
              {proyectoBase.nombreProyecto}
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-600 mt-1 font-medium">
              <span>Sección actual: <strong>{proyectoBase.seccion || 'Sección A'}</strong></span>
              <span>• Nivel: <strong>{proyectoBase.nivel}</strong></span>
              <span>• Horas: <strong>{proyectoBase.horasClase} hrs</strong></span>
              <span>• Temas: <strong>{proyectoBase.cantidadTemas || 4}</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Nombre del Curso / Programa *</label>
              <input
                type="text"
                required
                value={nombreNuevo}
                onChange={(e) => setNombreNuevo(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nueva Sección o Cohorte *</label>
              <input
                type="text"
                required
                value={seccionNueva}
                onChange={(e) => setSeccionNueva(e.target.value)}
                placeholder="Ej. Sección B, Sección Nocturna, Fin de Semana"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-blue-900 focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nueva Fecha de Inicio *</label>
              <input
                type="date"
                required
                value={fechaInicioNueva}
                onChange={(e) => setFechaInicioNueva(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Días de Clase</label>
              <input
                type="text"
                value={diasNuevo}
                onChange={(e) => setDiasNuevo(e.target.value)}
                placeholder="Ej. Sábados, Lunes y Miércoles"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Horario</label>
              <input
                type="text"
                value={horarioNuevo}
                onChange={(e) => setHorarioNuevo(e.target.value)}
                placeholder="Ej. 08:00 AM - 12:00 PM"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Docente Asignado</label>
              <input
                type="text"
                value={nombreDocenteNuevo}
                onChange={(e) => setNombreDocenteNuevo(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 text-xs"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Se conservan automáticamente el temario, la metodología, el nivel, los costos y el sílabo pedagógico del programa original.
              </span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 space-y-1">
            <div className="font-bold flex items-center gap-1 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Beneficios de la Clonación Institucional:
            </div>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Asignación de código correlativo nuevo (<strong>{nuevoCodigo}</strong>).</li>
              <li>Reinicio del plazo de comercialización (20 días calendario a partir de hoy).</li>
              <li>Sello de fecha y hora exacta de registro institucional grabado de forma automática.</li>
            </ul>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-300 text-xs transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Crear Nueva Edición / Sección</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
