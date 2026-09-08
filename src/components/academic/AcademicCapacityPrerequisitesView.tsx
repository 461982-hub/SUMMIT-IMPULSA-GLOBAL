import React, { useState } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Save, 
  AlertCircle, 
  Laptop, 
  Layers, 
  Sparkles, 
  ShieldCheck, 
  FileQuestion, 
  Gauge, 
  AlertTriangle
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';

interface AcademicCapacityPrerequisitesViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto: (p: ProyectoEducativo) => void;
}

export const AcademicCapacityPrerequisitesView: React.FC<AcademicCapacityPrerequisitesViewProps> = ({
  proyectos,
  onGuardarProyecto,
}) => {
  const [proyectoSeleccionadoId, setProyectoSeleccionadoId] = useState<string>(
    proyectos.length > 0 ? proyectos[0].id : ''
  );

  const proyectoActual = proyectos.find((p) => p.id === proyectoSeleccionadoId) || proyectos[0];

  const [aforoMaximo, setAforoMaximo] = useState<number>(
    proyectoActual?.aforoYPrerrequisitos?.aforoMaximo || 25
  );
  const [aforoMinimoRequerido, setAforoMinimoRequerido] = useState<number>(
    proyectoActual?.aforoYPrerrequisitos?.aforoMinimoRequerido || 8
  );
  const [nivelDificultad, setNivelDificultad] = useState<any>(
    proyectoActual?.aforoYPrerrequisitos?.nivelDificultad || (proyectoActual?.nivel === 'Avanzado' ? 'Avanzado' : 'Intermedio')
  );
  const [experienciaPrevia, setExperienciaPrevia] = useState(
    proyectoActual?.aforoYPrerrequisitos?.experienciaPreviaRequerida || proyectoActual?.prerrequisitos || 'Conocimientos básicos en gestión empresarial y manejo intermedio de hojas de cálculo.'
  );
  const [softwareTexto, setSoftwareTexto] = useState(
    proyectoActual?.aforoYPrerrequisitos?.softwareRequerido?.join(', ') || 'Microsoft Excel 365, Power BI Desktop, Zoom'
  );
  const [testDiagnosticoUrl, setTestDiagnosticoUrl] = useState(
    proyectoActual?.aforoYPrerrequisitos?.testDiagnosticoUrl || 'https://forms.google.com/test-diagnostico-summit'
  );

  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  const handleSeleccionarProyecto = (p: ProyectoEducativo) => {
    setProyectoSeleccionadoId(p.id);
    setAforoMaximo(p.aforoYPrerrequisitos?.aforoMaximo || 25);
    setAforoMinimoRequerido(p.aforoYPrerrequisitos?.aforoMinimoRequerido || 8);
    setNivelDificultad(p.aforoYPrerrequisitos?.nivelDificultad || (p.nivel === 'Avanzado' ? 'Avanzado' : 'Intermedio'));
    setExperienciaPrevia(p.aforoYPrerrequisitos?.experienciaPreviaRequerida || p.prerrequisitos || 'Conocimientos básicos.');
    setSoftwareTexto(p.aforoYPrerrequisitos?.softwareRequerido?.join(', ') || 'Microsoft Excel, Zoom');
    setTestDiagnosticoUrl(p.aforoYPrerrequisitos?.testDiagnosticoUrl || 'https://forms.google.com/test-diagnostico-summit');
    setGuardadoExitoso(false);
  };

  const inscritosActuales = proyectoActual?.alumnosFinal || proyectoActual?.alumnosProyectados || 0;

  const porcentajeOcupacion = aforoMaximo > 0 ? Math.round((inscritosActuales / aforoMaximo) * 100) : 0;

  let estadoAforo: 'Cupos Disponibles' | 'Casi Lleno' | 'Aforo Completo (Sold Out)' | 'En Lista de Espera' = 'Cupos Disponibles';
  if (inscritosActuales >= aforoMaximo) estadoAforo = 'Aforo Completo (Sold Out)';
  else if (porcentajeOcupacion >= 80) estadoAforo = 'Casi Lleno';

  const handleGuardarConfiguracion = () => {
    if (!proyectoActual) return;
    const softwareArray = softwareTexto.split(',').map(s => s.trim()).filter(Boolean);

    const proyectoActualizado: ProyectoEducativo = {
      ...proyectoActual,
      prerrequisitos: experienciaPrevia,
      aforoYPrerrequisitos: {
        aforoMaximo,
        aforoMinimoRequerido,
        inscritosConfirmados: inscritosActuales,
        estadoAforo,
        softwareRequerido: softwareArray,
        experienciaPreviaRequerida: experienciaPrevia,
        nivelDificultad,
        testDiagnosticoUrl,
      },
    };
    onGuardarProyecto(proyectoActualizado);
    setGuardadoExitoso(true);
    setTimeout(() => setGuardadoExitoso(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-cyan-950 text-white p-5 rounded-2xl shadow-md border border-teal-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Gauge className="w-5 h-5 text-teal-400" />
            <h3 className="font-black text-base text-white tracking-wide">
              Control de Aforo Pedagógico & Filtro de Prerrequisitos
            </h3>
            <span className="bg-teal-500/30 text-teal-200 border border-teal-400/40 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
              Calidad y Experiencia
            </span>
          </div>
          <p className="text-xs text-teal-200/90 max-w-2xl leading-relaxed">
            Limite los aforos máximos para garantizar interacción y mentoría personalizada, defina requerimientos de software y pruebas diagnósticas de admisión.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGuardarConfiguracion}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-all shadow-xs shrink-0"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Guardar Aforo & Requisitos</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Selector de Cursos */}
        <div className="lg:col-span-3 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Seleccionar Programa ({proyectos.length})
            </span>
          </div>
          <div className="space-y-1.5 max-h-[620px] overflow-y-auto pr-1">
            {proyectos.map((p) => {
              const isSelected = p.id === proyectoActual?.id;
              const max = p.aforoYPrerrequisitos?.aforoMaximo || 25;
              const insc = p.alumnosFinal || p.alumnosProyectados || 0;
              const pct = Math.round((insc / max) * 100);


              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSeleccionarProyecto(p)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-teal-50/90 border-teal-400 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold text-teal-900 bg-teal-100/80 px-1.5 py-0.5 rounded">
                      {p.codigoPrograma || `ACAD-${p.id}`}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border font-mono ${
                      pct >= 100
                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                        : pct >= 80
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    }`}>
                      {insc}/{max} ({pct}%)
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1.5 line-clamp-1">
                    {p.nombreProyecto}
                  </h4>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {p.modalidad || 'Virtual Sincrónica'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel de Aforo y Prerrequisitos */}
        {proyectoActual && (
          <div className="lg:col-span-9 space-y-4">
            {guardadoExitoso && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Parámetros de aforo pedagógico y prerrequisitos guardados correctamente.</span>
              </div>
            )}

            {/* SECCIÓN 1: TERMÓMETRO DE AFORO & CAPACIDAD */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    Aforo Pedagógico & Capacidad del Grupo
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Garantiza la relación óptima docente-alumno para sesiones prácticas de alto impacto.
                  </p>
                </div>

                <span className={`text-xs font-bold px-3 py-1 rounded-xl border ${
                  estadoAforo === 'Aforo Completo (Sold Out)'
                    ? 'bg-rose-50 text-rose-800 border-rose-300'
                    : estadoAforo === 'Casi Lleno'
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                }`}>
                  {estadoAforo}
                </span>
              </div>

              {/* Barra de progreso de aforo */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700 font-mono">
                  <span>Inscritos: {inscritosActuales} participantes</span>
                  <span>Aforo Máximo: {aforoMaximo} cupos ({porcentajeOcupacion}% ocupación)</span>
                </div>
                <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 flex">
                  <div
                    style={{ width: `${Math.min(100, porcentajeOcupacion)}%` }}
                    className={`h-full transition-all duration-500 ${
                      porcentajeOcupacion >= 100
                        ? 'bg-rose-600'
                        : porcentajeOcupacion >= 80
                        ? 'bg-amber-500'
                        : 'bg-teal-600'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Aforo Máximo Pedagógico (Cupos)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={aforoMaximo}
                    onChange={(e) => setAforoMaximo(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Aforo Mínimo de Apertura (Punto Eq.)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={aforoMinimoRequerido}
                    onChange={(e) => setAforoMinimoRequerido(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nivel de Complejidad Académica
                  </label>
                  <select
                    value={nivelDificultad}
                    onChange={(e) => setNivelDificultad(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="Introductorio">Introductorio / Principiante</option>
                    <option value="Intermedio">Intermedio</option>
                    <option value="Avanzado">Avanzado</option>
                    <option value="Experto / Ejecutivo">Experto / Nivel Ejecutivo</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: PRERREQUISITOS, SOFTWARE & TEST DIAGNÓSTICO */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm sm:text-base font-black text-slate-900 border-b border-slate-200 pb-3">
                Filtro de Admisión, Perfil de Ingreso & Herramientas
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Experiencia Previa Requerida (Perfil del Participante)
                  </label>
                  <textarea
                    rows={2}
                    value={experienciaPrevia}
                    onChange={(e) => setExperienciaPrevia(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Software & Herramientas Obligatorias (Separadas por coma)
                  </label>
                  <input
                    type="text"
                    value={softwareTexto}
                    onChange={(e) => setSoftwareTexto(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Enlace a Test Diagnóstico / Prueba de Nivelación Previa (Opcional)
                  </label>
                  <input
                    type="text"
                    value={testDiagnosticoUrl}
                    onChange={(e) => setTestDiagnosticoUrl(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono text-teal-900"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
