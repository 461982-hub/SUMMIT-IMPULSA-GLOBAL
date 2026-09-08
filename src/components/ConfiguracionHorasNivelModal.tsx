import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Clock, 
  BookOpen, 
  RotateCcw, 
  CheckCircle2, 
  X, 
  AlertCircle, 
  Sparkles, 
  Save, 
  Award,
  HelpCircle
} from 'lucide-react';
import { NivelProyecto } from '../types';
import { 
  ConfiguracionHorasNivel, 
  CONFIGURACION_HORAS_POR_NIVEL_DEFAULT, 
  obtenerTodasConfiguracionesHorasNivel, 
  guardarConfiguracionHorasNivel, 
  restablecerConfiguracionHorasNivelDefault 
} from '../utils/curricularUtils';

interface ConfiguracionHorasNivelModalProps {
  isOpen: boolean;
  onClose: () => void;
  nivelActual?: NivelProyecto;
  onConfiguracionGuardada?: (configuraciones: Record<NivelProyecto, ConfiguracionHorasNivel>) => void;
}

const NIVELES_DISPONIBLES: NivelProyecto[] = [
  'Básico',
  'Intermedio',
  'Avanzado',
  'Especializado',
  'Todos los niveles'
];

export const ConfiguracionHorasNivelModal: React.FC<ConfiguracionHorasNivelModalProps> = ({
  isOpen,
  onClose,
  nivelActual,
  onConfiguracionGuardada
}) => {
  const [configuraciones, setConfiguraciones] = useState<Record<NivelProyecto, ConfiguracionHorasNivel>>(() => {
    return obtenerTodasConfiguracionesHorasNivel();
  });
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);
  const [mensajeAlerta, setMensajeAlerta] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConfiguraciones(obtenerTodasConfiguracionesHorasNivel());
      setGuardadoExitoso(false);
      setMensajeAlerta(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCampoChange = (
    nivel: NivelProyecto,
    campo: 'cantidadTemas' | 'horasClasePorTema' | 'totalHoras' | 'descripcion',
    valor: any
  ) => {
    setConfiguraciones(prev => {
      const configActual = prev[nivel] || {
        nivel,
        cantidadTemas: 4,
        horasClasePorTema: 3,
        totalHoras: 12,
        descripcion: ''
      };

      const actualizado: ConfiguracionHorasNivel = {
        ...configActual,
        [campo]: valor
      };

      // Si cambia cantidad de temas o de horas por tema, sincronizar totalHoras
      if (campo === 'cantidadTemas') {
        const temas = Math.max(1, Number(valor) || 1);
        actualizado.cantidadTemas = temas;
        actualizado.totalHoras = temas * (Number(actualizado.horasClasePorTema) || 1);
      } else if (campo === 'horasClasePorTema') {
        const horas = Math.max(1, Number(valor) || 1);
        actualizado.horasClasePorTema = horas;
        actualizado.totalHoras = (Number(actualizado.cantidadTemas) || 1) * horas;
      } else if (campo === 'totalHoras') {
        actualizado.totalHoras = Math.max(1, Number(valor) || 1);
      }

      return {
        ...prev,
        [nivel]: actualizado
      };
    });
  };

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    guardarConfiguracionHorasNivel(configuraciones);
    onConfiguracionGuardada?.(configuraciones);
    setGuardadoExitoso(true);
    setMensajeAlerta('Configuración institucional de horas por nivel guardada exitosamente. Las horas se colocarán de forma automática en Costos Operativos.');
    setTimeout(() => {
      setGuardadoExitoso(false);
      onClose();
    }, 1200);
  };

  const handleRestablecer = () => {
    const res = restablecerConfiguracionHorasNivelDefault();
    setConfiguraciones(res);
    onConfiguracionGuardada?.(res);
    setMensajeAlerta('Se han restablecido los valores institucionales por defecto (Básico: 12 horas, etc.).');
    setTimeout(() => setMensajeAlerta(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Encabezado */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-blue-200 border border-white/15">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                Configuración Institucional de Horas por Nivel Académico
              </h3>
              <p className="text-xs text-blue-100">
                Define las horas de clase y temas que se colocarán automáticamente en la sección 2. Costos Operativos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensaje de Confirmación */}
        {mensajeAlerta && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{mensajeAlerta}</span>
          </div>
        )}

        {/* Explicación de la Regla Institucional */}
        <div className="mx-5 mt-4 p-3.5 bg-blue-50/80 rounded-xl border border-blue-200 text-xs text-blue-950 space-y-1">
          <div className="flex items-center gap-2 font-bold text-blue-900">
            <Clock className="w-4 h-4 text-blue-700" />
            <span>Automatización de Horas en Costos Operativos</span>
          </div>
          <p className="text-[11px] text-blue-800 leading-relaxed">
            Al seleccionar cualquier nivel académico (ejemplo: <strong>Básico = 12 horas</strong>, resultado de 4 temas × 3 hrs), el sistema coloca automáticamente el valor en el campo <strong>"Horas de Clase"</strong> de la sección <strong>2. Costos Operativos</strong>. Puedes configurar las horas y temas de todos los niveles en esta tabla.
          </p>
        </div>

        {/* Formulario / Lista de Niveles */}
        <form onSubmit={handleGuardar} className="p-5 space-y-4">
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {NIVELES_DISPONIBLES.map((nv) => {
              const config = configuraciones[nv] || CONFIGURACION_HORAS_POR_NIVEL_DEFAULT[nv];
              const esActual = nivelActual === nv;

              return (
                <div 
                  key={nv}
                  className={`p-3.5 rounded-xl border transition-all ${
                    esActual 
                      ? 'bg-indigo-50/40 border-indigo-300 ring-2 ring-indigo-200' 
                      : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <Award className={`w-4 h-4 ${nv === 'Básico' ? 'text-blue-600' : 'text-indigo-600'}`} />
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                        Nivel {nv}
                      </span>
                      {nv === 'Básico' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                          Norma Institucional Base: 12 hrs
                        </span>
                      )}
                      {esActual && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300">
                          Nivel Seleccionado Actualmente
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                      Total a colocar en Costos: <span className="text-blue-700 font-black">{config.totalHoras} hrs</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Cantidad de Temas
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="24"
                        value={config.cantidadTemas}
                        onChange={(e) => handleCampoChange(nv, 'cantidadTemas', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Módulos o temas del syllabus
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Horas Clase por Tema
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="40"
                        step="0.5"
                        value={config.horasClasePorTema}
                        onChange={(e) => handleCampoChange(nv, 'horasClasePorTema', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Duración por cada tema
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Total Horas Clase (Automático)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          max="200"
                          value={config.totalHoras}
                          onChange={(e) => handleCampoChange(nv, 'totalHoras', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-blue-50/70 border border-blue-300 rounded-lg font-mono font-black text-blue-900 focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const calculado = (Number(config.cantidadTemas) || 1) * (Number(config.horasClasePorTema) || 1);
                            handleCampoChange(nv, 'totalHoras', calculado);
                          }}
                          className="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-300 cursor-pointer"
                          title="Recalcular automáticamente Temas × Horas"
                        >
                          Auto
                        </button>
                      </div>
                      <span className="text-[10px] text-blue-700 font-medium mt-0.5 block">
                        Se asignará a sección 2. Costos
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={handleRestablecer}
              className="w-full sm:w-auto px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer Valores Institucionales</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardadoExitoso}
                className="w-1/2 sm:w-auto px-5 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {guardadoExitoso ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>¡Guardado!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar Configuración</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
