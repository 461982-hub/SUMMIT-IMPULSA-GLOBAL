import React, { useState } from 'react';
import { 
  Star, 
  Award, 
  CheckCircle2, 
  Save, 
  MessageSquare, 
  TrendingUp, 
  Users, 
  Sparkles, 
  ThumbsUp, 
  ThumbsDown,
  BarChart3
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';

interface AcademicFacultyEvaluationViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto: (p: ProyectoEducativo) => void;
}

export const AcademicFacultyEvaluationView: React.FC<AcademicFacultyEvaluationViewProps> = ({
  proyectos,
  onGuardarProyecto,
}) => {
  const [proyectoSeleccionadoId, setProyectoSeleccionadoId] = useState<string>(
    proyectos.length > 0 ? proyectos[0].id : ''
  );


  const proyectoActual = proyectos.find((p) => p.id === proyectoSeleccionadoId) || proyectos[0];

  const [criterios, setCriterios] = useState({
    dominioTecnico: proyectoActual?.evaluacionCalidadDocente?.criterios?.dominioTecnico || 4.9,
    claridadDidactica: proyectoActual?.evaluacionCalidadDocente?.criterios?.claridadDidactica || 4.8,
    cumplimientoSyllabus: proyectoActual?.evaluacionCalidadDocente?.criterios?.cumplimientoSyllabus || 5.0,
    puntualidad: proyectoActual?.evaluacionCalidadDocente?.criterios?.puntualidad || 4.7,
    disponibilidadDudas: proyectoActual?.evaluacionCalidadDocente?.criterios?.disponibilidadDudas || 4.9,
  });

  const [comentarios, setComentarios] = useState(() => {
    if (proyectoActual?.evaluacionCalidadDocente?.comentariosEstudiantes && proyectoActual.evaluacionCalidadDocente.comentariosEstudiantes.length > 0) {
      return proyectoActual.evaluacionCalidadDocente.comentariosEstudiantes;
    }
    return [
      {
        id: 'eval-1',
        estudiante: 'Ing. Carlos Eduardo Martínez (Banco Atlántida)',
        fecha: '2026-08-25',
        puntuacion: 5,
        comentario: 'Excelente dominio de casos reales y modelos financieros avanzados. Las plantillas compartidas son de uso inmediato en mi gerencia.',
        aspectoMejora: 'Continuar con más talleres en vivo.',
      },
      {
        id: 'eval-2',
        estudiante: 'Lic. Andrea Sofía Morales (Cervecería Hondureña)',
        fecha: '2026-08-26',
        puntuacion: 5,
        comentario: 'La metodología pedagógica fue muy dinámica. Explicaciones sumamente claras y retroalimentación personalizada.',
        aspectoMejora: 'Ninguno, superó mis expectativas.',
      },
      {
        id: 'eval-3',
        estudiante: 'MSc. Roberto José Zelaya (Ficohsa)',
        fecha: '2026-08-26',
        puntuacion: 4.8,
        comentario: 'Gran calidad docente. El proyecto final integrador nos retó a solucionar un problema real de nuestra empresa.',
        aspectoMejora: 'Ampliar 30 minutos más la sesión de dudas.',
      },
    ];
  });

  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  const handleSeleccionarProyecto = (p: ProyectoEducativo) => {
    setProyectoSeleccionadoId(p.id);
    setCriterios({
      dominioTecnico: p.evaluacionCalidadDocente?.criterios?.dominioTecnico || 4.9,
      claridadDidactica: p.evaluacionCalidadDocente?.criterios?.claridadDidactica || 4.8,
      cumplimientoSyllabus: p.evaluacionCalidadDocente?.criterios?.cumplimientoSyllabus || 5.0,
      puntualidad: p.evaluacionCalidadDocente?.criterios?.puntualidad || 4.7,
      disponibilidadDudas: p.evaluacionCalidadDocente?.criterios?.disponibilidadDudas || 4.9,
    });
    if (p.evaluacionCalidadDocente?.comentariosEstudiantes && p.evaluacionCalidadDocente.comentariosEstudiantes.length > 0) {
      setComentarios(p.evaluacionCalidadDocente.comentariosEstudiantes);
    }
    setGuardadoExitoso(false);
  };

  const promedioPuntuacion = Number(
    ((criterios.dominioTecnico +
      criterios.claridadDidactica +
      criterios.cumplimientoSyllabus +
      criterios.puntualidad +
      criterios.disponibilidadDudas) / 5).toFixed(2)
  );

  const npsCalculado = Math.round((promedioPuntuacion / 5) * 100);

  const handleGuardarEvaluacion = () => {
    if (!proyectoActual) return;
    const proyectoActualizado: ProyectoEducativo = {
      ...proyectoActual,
      docenteEvaluacionNPS: promedioPuntuacion,
      evaluacionCalidadDocente: {
        criterios,
        puntuacionPromedioDocente: promedioPuntuacion,
        npsDocentePct: npsCalculado,
        totalEvaluaciones: comentarios.length + 5,
        comentariosEstudiantes: comentarios,
      },
    };
    onGuardarProyecto(proyectoActualizado);
    setGuardadoExitoso(true);
    setTimeout(() => setGuardadoExitoso(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 text-white p-5 rounded-2xl shadow-md border border-indigo-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <h3 className="font-black text-base text-white tracking-wide">
              Evaluación de Calidad Docente & NPS Académico
            </h3>
            <span className="bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
              Control de Excelencia
            </span>
          </div>
          <p className="text-xs text-indigo-200/90 max-w-2xl leading-relaxed">
            Monitoree la calificación pedagógica del cuerpo docente, dominio temático, retroalimentación y nivel de satisfacción estudiantil.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGuardarEvaluacion}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-xs shrink-0"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Guardar Evaluación Docente</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Selector de Cursos */}
        <div className="lg:col-span-3 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Docente por Programa ({proyectos.length})
            </span>
          </div>
          <div className="space-y-1.5 max-h-[620px] overflow-y-auto pr-1">
            {proyectos.map((p) => {
              const isSelected = p.id === proyectoActual?.id;
              const nps = p.docenteEvaluacionNPS || 4.9;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSeleccionarProyecto(p)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-indigo-50/90 border-indigo-400 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold text-indigo-900 bg-indigo-100/80 px-1.5 py-0.5 rounded">
                      {p.codigoPrograma || `ACAD-${p.id}`}
                    </span>
                    <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                      {nps.toFixed(1)}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1.5 line-clamp-1">
                    {p.nombreDocente}
                  </h4>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {p.nombreProyecto}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel de Evaluación Docente */}
        {proyectoActual && (
          <div className="lg:col-span-9 space-y-4">
            {guardadoExitoso && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Métricas de calidad docente y retroalimentación guardadas con éxito.</span>
              </div>
            )}

            {/* Ficha Principal del Docente */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded">
                    {proyectoActual.docenteClasificacion || 'Maestría'}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                    {proyectoActual.nombreDocente}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cátedra: <strong>{proyectoActual.nombreProyecto}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-amber-50 border border-amber-300 px-4 py-2.5 rounded-xl">
                  <Star className="w-7 h-7 fill-amber-400 text-amber-500" />
                  <div>
                    <div className="text-xl font-black text-amber-950 font-mono leading-none">
                      {promedioPuntuacion} / 5.0
                    </div>
                    <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">
                      NPS Docente: {npsCalculado}% Satisfacción
                    </span>
                  </div>
                </div>
              </div>

              {/* Sliders / Criterios de Evaluación Pedagógica */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Criterios de Desempeño Evaluados por Alumnos & Dirección
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>1. Dominio Técnico y Experiencia Práctica</span>
                      <span className="font-mono text-indigo-700">{criterios.dominioTecnico} / 5.0</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="0.1"
                      value={criterios.dominioTecnico}
                      onChange={(e) => setCriterios({ ...criterios, dominioTecnico: Number(e.target.value) })}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>2. Claridad Expositiva y Didáctica</span>
                      <span className="font-mono text-indigo-700">{criterios.claridadDidactica} / 5.0</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="0.1"
                      value={criterios.claridadDidactica}
                      onChange={(e) => setCriterios({ ...criterios, claridadDidactica: Number(e.target.value) })}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>3. Cumplimiento Integral del Syllabus</span>
                      <span className="font-mono text-indigo-700">{criterios.cumplimientoSyllabus} / 5.0</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="0.1"
                      value={criterios.cumplimientoSyllabus}
                      onChange={(e) => setCriterios({ ...criterios, cumplimientoSyllabus: Number(e.target.value) })}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>4. Puntualidad e Inicio de Sesiones</span>
                      <span className="font-mono text-indigo-700">{criterios.puntualidad} / 5.0</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="0.1"
                      value={criterios.puntualidad}
                      onChange={(e) => setCriterios({ ...criterios, puntualidad: Number(e.target.value) })}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 sm:col-span-2">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>5. Disponibilidad y Acompañamiento en Dudas / Proyecto</span>
                      <span className="font-mono text-indigo-700">{criterios.disponibilidadDudas} / 5.0</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="0.1"
                      value={criterios.disponibilidadDudas}
                      onChange={(e) => setCriterios({ ...criterios, disponibilidadDudas: Number(e.target.value) })}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonios y Retroalimentación de Alumnos */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                Comentarios y Feedback Cualitativo de Estudiantes
              </h4>

              <div className="space-y-2.5">
                {comentarios.map((c, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">{c.estudiante}</span>
                      <span className="text-[10px] font-mono text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded">
                        ★ {c.puntuacion} / 5
                      </span>
                    </div>
                    <p className="text-slate-700 italic">"{c.comentario}"</p>
                    {c.aspectoMejora && (
                      <p className="text-[10px] text-slate-500 font-semibold">
                        Sugerencia: {c.aspectoMejora}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
