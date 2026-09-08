import React, { useState } from 'react';
import { 
  GraduationCap, 
  FileSpreadsheet, 
  CheckCircle2, 
  Save, 
  Printer, 
  ShieldCheck, 
  Download, 
  Plus, 
  Trash2, 
  Award,
  Sparkles,
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { formatearMoneda } from '../../utils/calculations';
import { generarEstudiantesMuestraGradebook } from '../../utils/curricularUtils';

interface AcademicGradebookViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto: (p: ProyectoEducativo) => void;
}

export const AcademicGradebookView: React.FC<AcademicGradebookViewProps> = ({
  proyectos,
  onGuardarProyecto,
}) => {
  const [proyectoSeleccionadoId, setProyectoSeleccionadoId] = useState<string>(
    proyectos.length > 0 ? proyectos[0].id : ''
  );

  const proyectoActual = proyectos.find((p) => p.id === proyectoSeleccionadoId) || proyectos[0];

  const rubrica = proyectoActual?.rubricaEvaluacion || {
    talleresPracticosPct: 35,
    proyectoFinalPct: 40,
    participacionAsistenciaPct: 15,
    examenFinalPct: 10,
    notaMinimaAprobacion: 75,
    asistenciaMinimaPct: 80,
  };

  const [estadoActa, setEstadoActa] = useState<any>(
    proyectoActual?.actaCalificaciones?.estadoActa || 'Abierta / En Curso'
  );
  const [docenteFirma, setDocenteFirma] = useState<boolean>(
    proyectoActual?.actaCalificaciones?.docenteFirma ?? true
  );
  const [direccionFirma, setDireccionFirma] = useState<boolean>(
    proyectoActual?.actaCalificaciones?.direccionFirma ?? false
  );

  const [estudiantes, setEstudiantes] = useState(() => {
    if (
      proyectoActual?.actaCalificaciones?.estudiantesNotas &&
      proyectoActual.actaCalificaciones.estudiantesNotas.length > 0
    ) {
      return proyectoActual.actaCalificaciones.estudiantesNotas;
    }
    return generarEstudiantesMuestraGradebook(proyectoActual?.alumnosFinal || proyectoActual?.alumnosProyectados || 8);
  });

  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  const handleSeleccionarProyecto = (p: ProyectoEducativo) => {
    setProyectoSeleccionadoId(p.id);
    setEstadoActa(p.actaCalificaciones?.estadoActa || 'Abierta / En Curso');
    setDocenteFirma(p.actaCalificaciones?.docenteFirma ?? true);
    setDireccionFirma(p.actaCalificaciones?.direccionFirma ?? false);

    if (p.actaCalificaciones?.estudiantesNotas && p.actaCalificaciones.estudiantesNotas.length > 0) {
      setEstudiantes(p.actaCalificaciones.estudiantesNotas);
    } else {
      setEstudiantes(generarEstudiantesMuestraGradebook(p.alumnosFinal || p.alumnosProyectados || 8));
    }
    setGuardadoExitoso(false);
  };


  const recalcularPromedioYEstado = (
    talleres: number,
    proyecto: number,
    participacion: number,
    examen: number,
    asistencia: number
  ) => {
    const pTalleres = (rubrica.talleresPracticosPct || 35) / 100;
    const pProyecto = (rubrica.proyectoFinalPct || 40) / 100;
    const pPart = (rubrica.participacionAsistenciaPct || 15) / 100;
    const pExam = (rubrica.examenFinalPct || 10) / 100;

    const prom = Math.round(
      talleres * pTalleres +
      proyecto * pProyecto +
      participacion * pPart +
      examen * pExam
    );

    let estadoFinal: 'Aprobado con Distinción' | 'Aprobado' | 'En Recuperación' | 'Reprobado' = 'Aprobado';
    if (prom >= 92 && asistencia >= 90) {
      estadoFinal = 'Aprobado con Distinción';
    } else if (prom >= rubrica.notaMinimaAprobacion && asistencia >= rubrica.asistenciaMinimaPct) {
      estadoFinal = 'Aprobado';
    } else if (prom >= 65) {
      estadoFinal = 'En Recuperación';
    } else {
      estadoFinal = 'Reprobado';
    }

    return { prom, estadoFinal };
  };

  const handleActualizarNota = (
    index: number,
    campo: 'notaTalleres' | 'notaProyectoFinal' | 'notaParticipacion' | 'notaExamen' | 'asistenciaPct' | 'nombreEstudiante' | 'empresa',
    valor: any
  ) => {
    const nuevosEstudiantes = [...estudiantes];
    const est = { ...nuevosEstudiantes[index], [campo]: valor };

    if (campo !== 'nombreEstudiante' && campo !== 'empresa') {
      const numVal = Math.max(0, Math.min(100, Number(valor) || 0));
      est[campo] = numVal;

      const { prom, estadoFinal } = recalcularPromedioYEstado(
        campo === 'notaTalleres' ? numVal : est.notaTalleres,
        campo === 'notaProyectoFinal' ? numVal : est.notaProyectoFinal,
        campo === 'notaParticipacion' ? numVal : est.notaParticipacion,
        campo === 'notaExamen' ? numVal : est.notaExamen,
        campo === 'asistenciaPct' ? numVal : est.asistenciaPct
      );

      est.promedioFinal = prom;
      est.estadoFinal = estadoFinal;
    }

    nuevosEstudiantes[index] = est;
    setEstudiantes(nuevosEstudiantes);
  };

  const handleAgregarEstudiante = () => {
    const num = estudiantes.length + 1;
    const nuevo = {
      idEstudiante: `EST-2026-${String(num).padStart(3, '0')}`,
      nombreEstudiante: `Nuevo Participante #${num}`,
      correo: `participante${num}@summit.hn`,
      empresa: 'Corporación Nacional',
      notaTalleres: 80,
      notaProyectoFinal: 80,
      notaParticipacion: 90,
      notaExamen: 80,
      asistenciaPct: 100,
      promedioFinal: 82,
      estadoFinal: 'Aprobado' as const,
      observaciones: 'Inscrito y activo.',
    };
    setEstudiantes([...estudiantes, nuevo]);
  };

  const handleEliminarEstudiante = (idx: number) => {
    setEstudiantes(estudiantes.filter((_, i) => i !== idx));
  };

  const handleGuardarActa = () => {
    if (!proyectoActual) return;
    const proyectoActualizado: ProyectoEducativo = {
      ...proyectoActual,
      actaCalificaciones: {
        estadoActa,
        fechaCierre: new Date().toISOString().split('T')[0],
        docenteFirma,
        direccionFirma,
        estudiantesNotas: estudiantes,
      },
    };
    onGuardarProyecto(proyectoActualizado);
    setGuardadoExitoso(true);
    setTimeout(() => setGuardadoExitoso(false), 3000);
  };

  const handleImprimirActa = () => {
    window.print();
  };

  // Métricas del acta
  const totalEstudiantes = estudiantes.length;
  const aprobados = estudiantes.filter((e) => e.estadoFinal === 'Aprobado' || e.estadoFinal === 'Aprobado con Distinción').length;
  const distincion = estudiantes.filter((e) => e.estadoFinal === 'Aprobado con Distinción').length;
  const enRecuperacion = estudiantes.filter((e) => e.estadoFinal === 'En Recuperación').length;
  const reprobados = estudiantes.filter((e) => e.estadoFinal === 'Reprobado').length;
  const tasaAprobacion = totalEstudiantes > 0 ? Math.round((aprobados / totalEstudiantes) * 100) : 0;
  const promedioGeneralCurso = totalEstudiantes > 0 ? Math.round(estudiantes.reduce((acc, e) => acc + e.promedioFinal, 0) / totalEstudiantes) : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-blue-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileSpreadsheet className="w-5 h-5 text-blue-300" />
            <h3 className="font-black text-base text-white tracking-wide">
              Libro de Calificaciones & Actas Académicas Oficiales (Gradebook)
            </h3>
            <span className="bg-blue-500/30 text-blue-200 border border-blue-400/40 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
              Auditoría Académica
            </span>
          </div>
          <p className="text-xs text-blue-200/90 max-w-2xl leading-relaxed">
            Consigne y valide las calificaciones ponderadas de cada participante, cierre de actas institucionales y firmas para emisión de certificados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleImprimirActa}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Acta Oficial</span>
          </button>
        </div>
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
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSeleccionarProyecto(p)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-blue-50/90 border-blue-400 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold text-blue-900 bg-blue-100/80 px-1.5 py-0.5 rounded">
                      {p.codigoPrograma || `ACAD-${p.id}`}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                      p.actaCalificaciones?.estadoActa === 'Aprobada por Dirección Académica'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : p.actaCalificaciones?.estadoActa === 'Cerrada por Docente'
                        ? 'bg-blue-50 text-blue-800 border-blue-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}>
                      {p.actaCalificaciones?.estadoActa || 'En Curso'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1.5 line-clamp-1">
                    {p.nombreProyecto}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                    <span>{p.nombreDocente}</span>
                    <span className="font-mono font-bold text-slate-700">{p.alumnosFinal || p.alumnosProyectados || 0} est.</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel de Libro de Calificaciones y Acta */}
        {proyectoActual && (
          <div className="lg:col-span-9 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            {/* Header del Acta */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                    {proyectoActual.codigoPrograma || `ACAD-${proyectoActual.id}`}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    Docente: <strong>{proyectoActual.nombreDocente}</strong>
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 mt-1">
                  {proyectoActual.nombreProyecto}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAgregarEstudiante}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Alumno</span>
                </button>

                <button
                  type="button"
                  onClick={handleGuardarActa}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Acta Oficial</span>
                </button>
              </div>
            </div>

            {guardadoExitoso && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Libro de calificaciones y estado del acta oficial guardados con éxito.</span>
              </div>
            )}

            {/* Métricas Resumen del Rendimiento Académico */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Matrícula Total</span>
                <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                  {totalEstudiantes} estudiantes
                </div>
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-900 uppercase">Aprobados</span>
                <div className="text-base font-black text-emerald-950 font-mono mt-0.5">
                  {aprobados} ({tasaAprobacion}%)
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
                <span className="text-[10px] font-bold text-amber-900 uppercase">Distinción Sobresaliente</span>
                <div className="text-base font-black text-amber-950 font-mono mt-0.5">
                  {distincion} alumnos
                </div>
              </div>

              <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200">
                <span className="text-[10px] font-bold text-rose-900 uppercase">En Riesgo / Reprob.</span>
                <div className="text-base font-black text-rose-950 font-mono mt-0.5">
                  {enRecuperacion + reprobados} alumnos
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200">
                <span className="text-[10px] font-bold text-blue-900 uppercase">Promedio General</span>
                <div className="text-base font-black text-blue-950 font-mono mt-0.5">
                  {promedioGeneralCurso} / 100
                </div>
              </div>
            </div>

            {/* Controles de Cierre y Firmas Oficiales */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Estado del Acta:</span>
                <select
                  value={estadoActa}
                  onChange={(e) => setEstadoActa(e.target.value as any)}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                >
                  <option value="Abierta / En Curso">📝 Abierta / En Curso</option>
                  <option value="Cerrada por Docente">🔒 Cerrada por Docente</option>
                  <option value="Aprobada por Dirección Académica">✓ Aprobada por Dirección Académica</option>
                </select>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={docenteFirma}
                    onChange={(e) => setDocenteFirma(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-semibold text-slate-700">Firma Docente Titular</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={direccionFirma}
                    onChange={(e) => setDireccionFirma(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-semibold text-slate-700">Firma Dirección Académica (Phd. Donal Reyes)</span>
                </label>
              </div>
            </div>

            {/* TABLA DE CALIFICACIONES INTERACTIVA */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Código / Estudiante</th>
                    <th className="p-2.5">Empresa / Institución</th>
                    <th className="p-2.5 text-center">Talleres ({rubrica.talleresPracticosPct}%)</th>
                    <th className="p-2.5 text-center">Proyecto ({rubrica.proyectoFinalPct}%)</th>
                    <th className="p-2.5 text-center">Part. ({rubrica.participacionAsistenciaPct}%)</th>
                    <th className="p-2.5 text-center">Examen ({rubrica.examenFinalPct || 10}%)</th>
                    <th className="p-2.5 text-center">Asist. (%)</th>
                    <th className="p-2.5 text-center font-black">Promedio</th>
                    <th className="p-2.5 text-center">Estado Final</th>
                    <th className="p-2.5 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {estudiantes.map((est, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                      <td className="p-2.5">
                        <div className="font-mono text-[10px] text-slate-400">{est.idEstudiante}</div>
                        <input
                          type="text"
                          value={est.nombreEstudiante}
                          onChange={(e) => handleActualizarNota(idx, 'nombreEstudiante', e.target.value)}
                          className="font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white px-1 py-0.5 rounded w-full"
                        />
                      </td>

                      <td className="p-2.5">
                        <input
                          type="text"
                          value={est.empresa || ''}
                          onChange={(e) => handleActualizarNota(idx, 'empresa', e.target.value)}
                          className="text-slate-600 text-[11px] bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white px-1 py-0.5 rounded w-full"
                        />
                      </td>

                      <td className="p-2.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={est.notaTalleres}
                          onChange={(e) => handleActualizarNota(idx, 'notaTalleres', e.target.value)}
                          className="w-14 text-center font-mono font-bold p-1 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-blue-500"
                        />
                      </td>

                      <td className="p-2.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={est.notaProyectoFinal}
                          onChange={(e) => handleActualizarNota(idx, 'notaProyectoFinal', e.target.value)}
                          className="w-14 text-center font-mono font-bold p-1 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-blue-500 text-blue-900"
                        />
                      </td>

                      <td className="p-2.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={est.notaParticipacion}
                          onChange={(e) => handleActualizarNota(idx, 'notaParticipacion', e.target.value)}
                          className="w-14 text-center font-mono font-bold p-1 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-blue-500"
                        />
                      </td>

                      <td className="p-2.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={est.notaExamen}
                          onChange={(e) => handleActualizarNota(idx, 'notaExamen', e.target.value)}
                          className="w-14 text-center font-mono font-bold p-1 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-blue-500"
                        />
                      </td>

                      <td className="p-2.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={est.asistenciaPct}
                          onChange={(e) => handleActualizarNota(idx, 'asistenciaPct', e.target.value)}
                          className={`w-14 text-center font-mono font-bold p-1 border rounded focus:bg-white ${
                            est.asistenciaPct < rubrica.asistenciaMinimaPct
                              ? 'bg-rose-50 border-rose-300 text-rose-700'
                              : 'bg-slate-50 border-slate-300 text-slate-900'
                          }`}
                        />
                      </td>

                      <td className="p-2.5 text-center font-mono font-black text-sm">
                        <span className={`px-2 py-0.5 rounded ${
                          est.promedioFinal >= 90
                            ? 'bg-amber-100 text-amber-900 font-bold'
                            : est.promedioFinal >= rubrica.notaMinimaAprobacion
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-rose-100 text-rose-900'
                        }`}>
                          {est.promedioFinal}
                        </span>
                      </td>

                      <td className="p-2.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                          est.estadoFinal === 'Aprobado con Distinción'
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : est.estadoFinal === 'Aprobado'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : est.estadoFinal === 'En Recuperación'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}>
                          {est.estadoFinal}
                        </span>
                      </td>

                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleEliminarEstudiante(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Eliminar de acta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
