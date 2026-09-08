import React, { useState } from 'react';
import { 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  Save, 
  Sparkles, 
  BookOpen, 
  Percent, 
  Check, 
  HelpCircle,
  BarChart2,
  GraduationCap
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { obtenerRubricaSugerida } from '../../utils/curricularUtils';

interface AcademicEvaluationRubricViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto: (p: ProyectoEducativo) => void;
}

export const AcademicEvaluationRubricView: React.FC<AcademicEvaluationRubricViewProps> = ({
  proyectos,
  onGuardarProyecto,
}) => {
  const [proyectoSeleccionadoId, setProyectoSeleccionadoId] = useState<number>(
    proyectos.length > 0 ? proyectos[0].id : 0
  );

  const proyectoActual = proyectos.find((p) => p.id === proyectoSeleccionadoId) || proyectos[0];

  // Estado local para editar la rúbrica del proyecto actual
  const [rubrica, setRubrica] = useState(() => {
    return proyectoActual?.rubricaEvaluacion || obtenerRubricaSugerida(proyectoActual?.tipoProyecto);
  });

  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  // Sincronizar cuando cambia de proyecto
  const handleSeleccionarProyecto = (p: ProyectoEducativo) => {
    setProyectoSeleccionadoId(p.id);
    setRubrica(p.rubricaEvaluacion || obtenerRubricaSugerida(p.tipoProyecto));
    setGuardadoExitoso(false);
  };

  const totalPorcentaje = (rubrica.proyectoFinalPct || 0) + 
                          (rubrica.talleresPracticosPct || 0) + 
                          (rubrica.participacionAsistenciaPct || 0) + 
                          (rubrica.examenFinalPct || 0);

  const esValido100 = totalPorcentaje === 100;

  const handleGuardarRubrica = () => {
    if (!proyectoActual) return;
    const proyectoActualizado: ProyectoEducativo = {
      ...proyectoActual,
      rubricaEvaluacion: rubrica,
    };
    onGuardarProyecto(proyectoActualizado);
    setGuardadoExitoso(true);
    setTimeout(() => setGuardadoExitoso(false), 3000);
  };

  const handleAplicarSugerida = () => {
    if (!proyectoActual) return;
    const sugerida = obtenerRubricaSugerida(proyectoActual.tipoProyecto);
    setRubrica(sugerida);
  };

  return (
    <div className="space-y-4">
      {/* Header explicativo */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md border border-purple-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="w-5 h-5 text-purple-300" />
            <h3 className="font-black text-base text-white tracking-wide">
              Rúbrica de Evaluación & Criterios de Aprobación
            </h3>
            <span className="bg-purple-500/30 text-purple-200 border border-purple-400/40 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
              Control de Calidad
            </span>
          </div>
          <p className="text-xs text-purple-200/90 max-w-2xl leading-relaxed">
            Configure la ponderación de calificaciones, entregables obligatorios y porcentaje mínimo de asistencia para garantizar la rigurosidad pedagógica y emisión de diplomas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAplicarSugerida}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white rounded-lg text-xs font-bold border border-white/20 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Restablecer Rúbrica Sugerida</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Selector de Programas */}
        <div className="lg:col-span-4 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Seleccionar Programa ({proyectos.length})
            </span>
          </div>
          <div className="space-y-1.5 max-h-[560px] overflow-y-auto pr-1">
            {proyectos.map((p) => {
              const tieneRubrica = !!p.rubricaEvaluacion;
              const isSelected = p.id === proyectoActual?.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSeleccionarProyecto(p)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-purple-50/90 border-purple-400 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold text-purple-900 bg-purple-100/80 px-1.5 py-0.5 rounded">
                      {p.codigoPrograma || `ACAD-${p.id}`}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      tieneRubrica 
                        ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' 
                        : 'text-amber-700 bg-amber-50 border border-amber-200'
                    }`}>
                      {tieneRubrica ? '✓ Rúbrica Activa' : '⚠️ Por Defecto'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1.5 line-clamp-1">
                    {p.nombreProyecto}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                    <span>{p.tipoProyecto}</span>
                    <span className="font-mono font-medium">{p.horasClase} hrs • {p.nombreDocente}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel de Configuración de la Rúbrica */}
        {proyectoActual && (
          <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            {/* Header del curso actual */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded">
                    {proyectoActual.codigoPrograma || `ACAD-${proyectoActual.id}`}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {proyectoActual.tipoProyecto} • {proyectoActual.nivel || 'Intermedio'}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 mt-1">
                  {proyectoActual.nombreProyecto}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGuardarRubrica}
                  disabled={!esValido100}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-xs ${
                    esValido100
                      ? 'bg-purple-600 hover:bg-purple-700 cursor-pointer'
                      : 'bg-slate-400 cursor-not-allowed opacity-70'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Rúbrica</span>
                </button>
              </div>
            </div>

            {guardadoExitoso && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Rúbrica de evaluación guardada con éxito en la base curricular del programa.</span>
              </div>
            )}

            {/* Alerta de porcentaje total */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
              esValido100
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}>
              <div className="flex items-center gap-2">
                {esValido100 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <div>
                  <span className="text-xs font-bold block">
                    {esValido100 
                      ? 'Ponderación Equilibrada: 100% de la Calificación Final' 
                      : `Ponderación Inválida: La suma actual es ${totalPorcentaje}% (Debe ser exactamente 100%)`}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Ajuste los porcentajes de cada componente hasta sumar el 100%.
                  </span>
                </div>
              </div>

              <div className={`text-base font-mono font-black px-2.5 py-1 rounded-lg border ${
                esValido100 ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-rose-100 border-rose-300 text-rose-800'
              }`}>
                {totalPorcentaje}%
              </div>
            </div>

            {/* Desglose de Ponderación de Calificaciones */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                1. Componentes de Calificación & Ponderación
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Proyecto Final */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                      Proyecto Final Integrador (ABP)
                    </label>
                    <span className="text-xs font-mono font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                      {rubrica.proyectoFinalPct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    step="5"
                    value={rubrica.proyectoFinalPct}
                    onChange={(e) => setRubrica({ ...rubrica, proyectoFinalPct: Number(e.target.value) })}
                    className="w-full accent-purple-600 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500">
                    Entregable aplicado con rúbrica de sustentación o código/modelo funcional.
                  </p>
                </div>

                {/* 2. Talleres Prácticos / Labs */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      Talleres Prácticos & Laboratorios
                    </label>
                    <span className="text-xs font-mono font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      {rubrica.talleresPracticosPct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    step="5"
                    value={rubrica.talleresPracticosPct}
                    onChange={(e) => setRubrica({ ...rubrica, talleresPracticosPct: Number(e.target.value) })}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500">
                    Actividades continuas, casos resueltos en clase y tareas hands-on.
                  </p>
                </div>

                {/* 3. Participación & Asistencia */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      Participación Activa & Asistencia
                    </label>
                    <span className="text-xs font-mono font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      {rubrica.participacionAsistenciaPct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    step="5"
                    value={rubrica.participacionAsistenciaPct}
                    onChange={(e) => setRubrica({ ...rubrica, participacionAsistenciaPct: Number(e.target.value) })}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500">
                    Intervenciones de valor, debate técnico y puntualidad en sesiones sincrónicas.
                  </p>
                </div>

                {/* 4. Examen Teórico / Prueba Técnica */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                      Examen Final / Evaluación Técnica
                    </label>
                    <span className="text-xs font-mono font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      {rubrica.examenFinalPct || 0}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="5"
                    value={rubrica.examenFinalPct || 0}
                    onChange={(e) => setRubrica({ ...rubrica, examenFinalPct: Number(e.target.value) })}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500">
                    Prueba conceptual o cuestionario de validación de conocimientos en LMS.
                  </p>
                </div>
              </div>
            </div>

            {/* Criterios Mínimos de Aprobación */}
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                2. Requisitos Mínimos para Obtener Certificado
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-200">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-purple-950">
                      Nota Mínima de Aprobación
                    </label>
                    <span className="text-sm font-mono font-black text-purple-800">
                      {rubrica.notaMinimaAprobacion} / 100 pts
                    </span>
                  </div>
                  <input
                    type="number"
                    min="60"
                    max="100"
                    value={rubrica.notaMinimaAprobacion}
                    onChange={(e) => setRubrica({ ...rubrica, notaMinimaAprobacion: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-purple-300 rounded-lg font-mono font-bold"
                  />
                  <span className="text-[10px] text-purple-700 mt-1 block">
                    Estándar SUMMIT: Mínimo 75% para cursos técnicos y 80% para diplomados.
                  </span>
                </div>

                <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-blue-950">
                      Asistencia Mínima Obligatoria
                    </label>
                    <span className="text-sm font-mono font-black text-blue-800">
                      {rubrica.asistenciaMinimaPct}%
                    </span>
                  </div>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    step="5"
                    value={rubrica.asistenciaMinimaPct}
                    onChange={(e) => setRubrica({ ...rubrica, asistenciaMinimaPct: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-blue-300 rounded-lg font-mono font-bold"
                  />
                  <span className="text-[10px] text-blue-700 mt-1 block">
                    Porcentaje mínimo de asistencia a sesiones sincrónicas para tener derecho a diploma.
                  </span>
                </div>
              </div>
            </div>

            {/* Simulador / Previsualización de Escala */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                📊 Escala de Acreditación Institucional SUMMIT
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-emerald-700">90 - 100 Puntos</span>
                  <div className="font-bold text-slate-800">Aprobado con Mención de Honor</div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-blue-700">{rubrica.notaMinimaAprobacion} - 89 Puntos</span>
                  <div className="font-bold text-slate-800">Aprobado Satisfactoriamente</div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-amber-700">&lt; {rubrica.notaMinimaAprobacion} Puntos</span>
                  <div className="font-bold text-slate-800">Constancia de Participación</div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
