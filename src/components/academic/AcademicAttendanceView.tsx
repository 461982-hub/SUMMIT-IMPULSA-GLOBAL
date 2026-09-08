import React, { useState } from 'react';
import { 
  UserCheck, 
  Users, 
  CalendarDays, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  XCircle, 
  Clock, 
  AlertCircle, 
  ShieldAlert,
  Sparkles,
  PhoneCall,
  Mail
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { generarPlanSesionesClase } from '../../utils/curricularUtils';

interface AcademicAttendanceViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto: (p: ProyectoEducativo) => void;
}

export const AcademicAttendanceView: React.FC<AcademicAttendanceViewProps> = ({
  proyectos,
  onGuardarProyecto,
}) => {
  const [proyectoSeleccionadoId, setProyectoSeleccionadoId] = useState<string>(
    proyectos.length > 0 ? proyectos[0].id : ''
  );


  const proyectoActual = proyectos.find((p) => p.id === proyectoSeleccionadoId) || proyectos[0];

  const estudiantesBase = proyectoActual?.actaCalificaciones?.estudiantesNotas?.map(e => ({
    idEstudiante: e.idEstudiante,
    nombreEstudiante: e.nombreEstudiante,
    correo: e.correo,
  })) || [
    { idEstudiante: 'EST-2026-001', nombreEstudiante: 'Ing. Carlos Eduardo Martínez', correo: 'cmartinez@bancoatlan.hn' },
    { idEstudiante: 'EST-2026-002', nombreEstudiante: 'Lic. Andrea Sofía Morales', correo: 'andrea.morales@ab-inbev.com' },
    { idEstudiante: 'EST-2026-003', nombreEstudiante: 'MSc. Roberto José Zelaya', correo: 'rzelaya@ficohsa.com' },
    { idEstudiante: 'EST-2026-004', nombreEstudiante: 'Lic. Claudia María Flores', correo: 'claudia.flores@millicom.com' },
    { idEstudiante: 'EST-2026-005', nombreEstudiante: 'Ing. Fernando Gabriel Ramos', correo: 'f.ramos@karimsgroup.com' },
    { idEstudiante: 'EST-2026-006', nombreEstudiante: 'Lic. Gabriela Isabel Pineda', correo: 'gpineda@dinant.com' },
  ];

  const [sesionesRegistro, setSesionesRegistro] = useState(() => {
    if (proyectoActual?.controlAsistencia?.sesionesRegistro && proyectoActual.controlAsistencia.sesionesRegistro.length > 0) {
      return proyectoActual.controlAsistencia.sesionesRegistro;
    }
    const sesionesCronograma = proyectoActual?.sesionesClase || generarPlanSesionesClase(
      proyectoActual?.cantidadTemas || 4,
      proyectoActual?.horasClasePorTema || 5,
      proyectoActual?.fechaProgramacion || new Date().toISOString().split('T')[0]
    );

    return sesionesCronograma.map((s, idx) => ({
      numeroSesion: s.numeroSesion || idx + 1,
      fecha: s.fecha || new Date().toISOString().split('T')[0],
      tema: s.tema,
      registros: estudiantesBase.map(est => ({
        idEstudiante: est.idEstudiante,
        nombreEstudiante: est.nombreEstudiante,
        estado: (Math.random() > 0.15 ? 'Presente' : Math.random() > 0.6 ? 'Tardanza' : 'Falta Injustificada') as any,
      })),
    }));
  });

  const [sesionActivaIdx, setSesionActivaIdx] = useState<number>(0);
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  const handleSeleccionarProyecto = (p: ProyectoEducativo) => {
    setProyectoSeleccionadoId(p.id);
    if (p.controlAsistencia?.sesionesRegistro && p.controlAsistencia.sesionesRegistro.length > 0) {
      setSesionesRegistro(p.controlAsistencia.sesionesRegistro);
    } else {
      const sesionesCronograma = p.sesionesClase || generarPlanSesionesClase(
        p.cantidadTemas || 4,
        p.horasClasePorTema || 5,
        p.fechaProgramacion || new Date().toISOString().split('T')[0]
      );
      setSesionesRegistro(
        sesionesCronograma.map((s, idx) => ({
          numeroSesion: s.numeroSesion || idx + 1,
          fecha: s.fecha || new Date().toISOString().split('T')[0],
          tema: s.tema,
          registros: estudiantesBase.map(est => ({
            idEstudiante: est.idEstudiante,
            nombreEstudiante: est.nombreEstudiante,
            estado: 'Presente' as const,
          })),
        }))
      );
    }
    setSesionActivaIdx(0);
    setGuardadoExitoso(false);
  };

  const handleCambiarEstadoAsistencia = (
    sesionIndex: number,
    estudianteIndex: number,
    nuevoEstado: 'Presente' | 'Tardanza' | 'Falta Justificada' | 'Falta Injustificada'
  ) => {
    const copia = [...sesionesRegistro];
    copia[sesionIndex].registros[estudianteIndex].estado = nuevoEstado;
    setSesionesRegistro(copia);
  };

  const handleMarcarTodosPresentes = (sesionIndex: number) => {
    const copia = [...sesionesRegistro];
    copia[sesionIndex].registros = copia[sesionIndex].registros.map(r => ({
      ...r,
      estado: 'Presente',
    }));
    setSesionesRegistro(copia);
  };

  const handleGuardarAsistencia = () => {
    if (!proyectoActual) return;
    const proyectoActualizado: ProyectoEducativo = {
      ...proyectoActual,
      controlAsistencia: {
        sesionesRegistro,
      },
    };
    onGuardarProyecto(proyectoActualizado);
    setGuardadoExitoso(true);
    setTimeout(() => setGuardadoExitoso(false), 3000);
  };

  // Cálculo de estadísticas acumuladas por estudiante
  const totalSesiones = sesionesRegistro.length || 1;
  const statsEstudiantes = estudiantesBase.map(est => {
    let asistencias = 0;
    let tardanzas = 0;
    let faltas = 0;

    sesionesRegistro.forEach(ses => {
      const reg = ses.registros.find(r => r.idEstudiante === est.idEstudiante);
      if (reg?.estado === 'Presente') asistencias += 1;
      else if (reg?.estado === 'Tardanza') {
        asistencias += 0.5;
        tardanzas += 1;
      } else if (reg?.estado === 'Falta Justificada' || reg?.estado === 'Falta Injustificada') {
        faltas += 1;
      }
    });

    const porcentajeAsistencia = Math.round((asistencias / totalSesiones) * 100);
    const nivelRiesgo = porcentajeAsistencia < 80 ? 'Alto Riesgo (Deserción)' : porcentajeAsistencia < 90 ? 'Atención' : 'Normal';

    return {
      ...est,
      porcentajeAsistencia,
      tardanzas,
      faltas,
      nivelRiesgo,
    };
  });

  const estudiantesEnRiesgo = statsEstudiantes.filter(e => e.porcentajeAsistencia < 80);
  const sesionActual = sesionesRegistro[sesionActivaIdx] || sesionesRegistro[0];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-5 rounded-2xl shadow-md border border-emerald-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-black text-base text-white tracking-wide">
              Control de Asistencia & Sistema de Alerta Temprana de Deserción
            </h3>
            <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
              Monitoreo en Tiempo Real
            </span>
          </div>
          <p className="text-xs text-emerald-200/90 max-w-2xl leading-relaxed">
            Pase de lista digital sesión por sesión, detección automática de alumnos con menos del 80% de asistencia y protocolos de retención.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGuardarAsistencia}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Guardar Registro de Asistencia</span>
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
                      ? 'bg-emerald-50/90 border-emerald-400 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold text-emerald-900 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                      {p.codigoPrograma || `ACAD-${p.id}`}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                      {totalSesiones} clases
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1.5 line-clamp-1">
                    {p.nombreProyecto}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                    <span>{p.nombreDocente}</span>
                    <span className="font-mono">{p.diasClase || 'Lun, Mié y Vie'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel de Asistencia & Alerta Temprana */}
        {proyectoActual && (
          <div className="lg:col-span-9 space-y-4">
            {/* Banner de Alerta Temprana si hay riesgo */}
            {estudiantesEnRiesgo.length > 0 && (
              <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700 shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-rose-950 uppercase tracking-wide">
                      Alerta Temprana: {estudiantesEnRiesgo.length} Participante(s) en Riesgo de Inasistencia (&lt;80%)
                    </h4>
                    <p className="text-xs text-rose-800 mt-0.5">
                      No cumplen el porcentaje mínimo reglamentario para recibir diploma. Se recomienda llamada o correo de seguimiento preventivo.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-rose-900 bg-rose-200/80 px-2.5 py-1 rounded-lg">
                    Acción de Retención Requerida
                  </span>
                </div>
              </div>
            )}

            {guardadoExitoso && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Registro de asistencia actualizado y guardado correctamente.</span>
              </div>
            )}

            {/* Pestañas de Sesiones de Clase para Pase de Lista */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Seleccionar Sesión de Clase para Pase de Lista
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {sesionesRegistro.map((ses, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSesionActivaIdx(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          sesionActivaIdx === idx
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        Sesión #{ses.numeroSesion} ({ses.fecha})
                      </button>
                    ))}
                  </div>
                </div>

                {sesionActual && (
                  <button
                    type="button"
                    onClick={() => handleMarcarTodosPresentes(sesionActivaIdx)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Marcar Todos Presentes</span>
                  </button>
                )}
              </div>

              {sesionActual && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Sesión #{sesionActual.numeroSesion}: {sesionActual.tema}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Fecha: {sesionActual.fecha} • Total Inscritos: {sesionActual.registros.length}
                      </p>
                    </div>
                  </div>

                  {/* Lista de Asistencia de la Sesión Activa */}
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Participante</th>
                          <th className="p-2.5 text-center">Estado de Asistencia</th>
                          <th className="p-2.5 text-center">Acciones Rápidas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sesionActual.registros.map((reg, estIdx) => (
                          <tr key={estIdx} className="hover:bg-slate-50">
                            <td className="p-2.5 font-semibold text-slate-900">
                              <span className="font-mono text-[10px] text-slate-400 block">{reg.idEstudiante}</span>
                              {reg.nombreEstudiante}
                            </td>

                            <td className="p-2.5 text-center">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleCambiarEstadoAsistencia(sesionActivaIdx, estIdx, 'Presente')}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                    reg.estado === 'Presente'
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  ✓ Presente
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCambiarEstadoAsistencia(sesionActivaIdx, estIdx, 'Tardanza')}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                    reg.estado === 'Tardanza'
                                      ? 'bg-amber-500 text-white shadow-xs'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  ⏱ Tardanza
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCambiarEstadoAsistencia(sesionActivaIdx, estIdx, 'Falta Justificada')}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                    reg.estado === 'Falta Justificada'
                                      ? 'bg-blue-600 text-white shadow-xs'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  📄 Justificada
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCambiarEstadoAsistencia(sesionActivaIdx, estIdx, 'Falta Injustificada')}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                    reg.estado === 'Falta Injustificada'
                                      ? 'bg-rose-600 text-white shadow-xs'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  ✕ Falta
                                </button>
                              </div>
                            </td>

                            <td className="p-2.5 text-center">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                reg.estado === 'Presente'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : reg.estado === 'Tardanza'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : reg.estado === 'Falta Justificada'
                                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                                  : 'bg-rose-50 text-rose-800 border-rose-300'
                              }`}>
                                {reg.estado}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* TABLA RESUMEN ACUMULADA POR PARTICIPANTE */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                Matriz Acumulada de Asistencia & Semáforo de Deserción
              </h4>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Participante</th>
                      <th className="p-2.5 text-center">Tardanzas</th>
                      <th className="p-2.5 text-center">Inasistencias</th>
                      <th className="p-2.5 text-center">% Asistencia</th>
                      <th className="p-2.5 text-center">Semáforo de Riesgo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {statsEstudiantes.map((est, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5">
                          <div className="font-bold text-slate-900">{est.nombreEstudiante}</div>
                          <div className="text-[10px] text-slate-500">{est.correo}</div>
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold text-amber-700">{est.tardanzas}</td>
                        <td className="p-2.5 text-center font-mono font-bold text-rose-700">{est.faltas}</td>
                        <td className="p-2.5 text-center font-mono font-black text-sm">
                          <span className={`px-2 py-0.5 rounded ${
                            est.porcentajeAsistencia >= 90
                              ? 'bg-emerald-100 text-emerald-900'
                              : est.porcentajeAsistencia >= 80
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-rose-100 text-rose-900'
                          }`}>
                            {est.porcentajeAsistencia}%
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                            est.porcentajeAsistencia >= 90
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : est.porcentajeAsistencia >= 80
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}>
                            {est.nivelRiesgo}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
