import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  Sliders, 
  BarChart3, 
  PieChart, 
  ShieldAlert, 
  RefreshCw, 
  Calculator,
  ArrowRight,
  TrendingDown,
  Percent,
  Check
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { formatearMoneda } from '../../utils/calculations';

interface AcademicDocenteRoiDesercionViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto?: (p: ProyectoEducativo) => void;
  onNotificar?: (mensaje: string) => void;
}

export const AcademicDocenteRoiDesercionView: React.FC<AcademicDocenteRoiDesercionViewProps> = ({
  proyectos,
  moneda,
  onNotificar,
}) => {
  // Proyecto seleccionado para el simulador de deserción
  const [proyectoSeleccionadoId, setProyectoSeleccionadoId] = useState<number>(
    proyectos.length > 0 ? proyectos[0].id : 0
  );

  const proyectoActual = proyectos.find((p) => p.id === proyectoSeleccionadoId) || proyectos[0];

  // Variables interactivas del simulador
  const [alumnosInscritosSim, setAlumnosInscritosSim] = useState<number>(
    proyectoActual?.alumnosFinal || 12
  );
  const [desercionesSim, setDesercionesSim] = useState<number>(1);
  const [tarifaPorAlumnoSim, setTarifaPorAlumnoSim] = useState<number>(
    proyectoActual?.precioSugeridoAlumno || 350
  );
  const [honorarioDocenteSim, setHonorarioDocenteSim] = useState<number>(
    proyectoActual?.costoDocenteCalculado || (proyectoActual?.horasClase || 20) * (proyectoActual?.tarifaHoraDocente || 200)
  );
  const [costoPlataformaMaterialSim, setCostoPlataformaMaterialSim] = useState<number>(
    proyectoActual?.gastoTotalOperativo || 150
  );

  // Actualizar variables cuando cambia de proyecto
  const handleCambiarProyecto = (p: ProyectoEducativo) => {
    setProyectoSeleccionadoId(p.id);
    const alumnos = p.alumnosFinal || 10;
    setAlumnosInscritosSim(alumnos);
    setDesercionesSim(Math.min(2, Math.floor(alumnos * 0.15)));
    setTarifaPorAlumnoSim(p.precioSugeridoAlumno || 350);
    setHonorarioDocenteSim(p.costoDocenteCalculado || (p.horasClase || 20) * (p.tarifaHoraDocente || 200));
    setCostoPlataformaMaterialSim(p.gastoTotalOperativo || 150);
  };

  // Cálculos dinámicos del simulador de deserción
  const alumnosActivosSim = Math.max(0, alumnosInscritosSim - desercionesSim);
  const porcentajeDesercion = alumnosInscritosSim > 0 ? (desercionesSim / alumnosInscritosSim) * 100 : 0;
  
  const ingresoTotalSim = alumnosActivosSim * tarifaPorAlumnoSim;
  const costoTotalProgramaSim = honorarioDocenteSim + costoPlataformaMaterialSim;
  const margenNetoSim = ingresoTotalSim - costoTotalProgramaSim;
  const margenPorcentualSim = ingresoTotalSim > 0 ? (margenNetoSim / ingresoTotalSim) * 100 : -100;

  // Punto de equilibrio dinámico (Break-even): cuántos alumnos activos se requieren para no perder
  const puntoEquilibrioAlumnos = tarifaPorAlumnoSim > 0 
    ? Math.ceil(costoTotalProgramaSim / tarifaPorAlumnoSim)
    : 0;

  const margenSeguridadAlumnos = alumnosActivosSim - puntoEquilibrioAlumnos;

  // Scorecard de Rentabilidad por Docente
  const rentabilidadPorDocente = useMemo(() => {
    const mapa = new Map<string, {
      nombre: string;
      especialidad: string;
      totalHoras: number;
      totalCursos: number;
      alumnosTotales: number;
      honorariosTotales: number;
      ingresosTotalesGenerados: number;
      margenNetoGenerado: number;
      roiDocente: number; // Margen generado por cada $1 pagado de honorario
      ratioAlumnosPorHora: number;
    }>();

    proyectos.forEach((p) => {
      const doc = p.nombreDocente.trim() || 'Docente no asignado';
      const actual = mapa.get(doc) || {
        nombre: doc,
        especialidad: p.docenteEspecialidad || 'Especialista en Capacitación',
        totalHoras: 0,
        totalCursos: 0,
        alumnosTotales: 0,
        honorariosTotales: 0,
        ingresosTotalesGenerados: 0,
        margenNetoGenerado: 0,
        roiDocente: 0,
        ratioAlumnosPorHora: 0,
      };

      const horas = p.horasClase || 0;
      const alumnos = p.alumnosFinal || 0;
      const honorario = p.costoDocenteCalculado || (horas * (p.tarifaHoraDocente || 200));
      const ingreso = p.ingresoRealTotal || (alumnos * (p.precioVentaSugeridoPorAlumno || 350));
      const margen = p.totalGananciasFinales || (ingreso - honorario);

      actual.totalHoras += horas;
      actual.totalCursos += 1;
      actual.alumnosTotales += alumnos;
      actual.honorariosTotales += honorario;
      actual.ingresosTotalesGenerados += ingreso;
      actual.margenNetoGenerado += margen;

      mapa.set(doc, actual);
    });

    return Array.from(mapa.values()).map((d) => {
      const roi = d.honorariosTotales > 0 ? (d.margenNetoGenerado / d.honorariosTotales) : 0;
      const ratio = d.totalHoras > 0 ? (d.alumnosTotales / d.totalHoras) : 0;
      return {
        ...d,
        roiDocente: Number(roi.toFixed(2)),
        ratioAlumnosPorHora: Number(ratio.toFixed(2)),
      };
    }).sort((a, b) => b.margenNetoGenerado - a.margenNetoGenerado);
  }, [proyectos]);

  return (
    <div className="space-y-6">
      
      {/* Banner Principal */}
      <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl border border-indigo-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Matriz de Rentabilidad Docente & Análisis de Deserción
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-400/40">
              Break-Even Dinámico
            </span>
          </div>
          <p className="text-xs text-indigo-200/90 max-w-3xl mt-1 leading-relaxed">
            Medición de eficiencia económica por facilitador (ROI), ratio de alumnos por hora de clase y simulador interactivo de impacto de deserciones sobre el punto de equilibrio.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 text-right">
            <span className="text-[10px] text-indigo-200 block uppercase font-bold">Margen Académico Total</span>
            <span className="text-xl font-black text-emerald-400 font-mono">
              {formatearMoneda(rentabilidadPorDocente.reduce((acc, d) => acc + d.margenNetoGenerado, 0), moneda)}
            </span>
          </div>
        </div>
      </div>

      {/* SECCIÓN 1: SIMULADOR INTERACTIVO DE DESERCIÓN & BREAK-EVEN */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Simulador Dinámico de Deserción y Punto de Equilibrio (Break-Even)
              </h4>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Evalúe la resiliencia financiera de cualquier cohorte si algunos estudiantes abandonan el programa.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700">Cohorte:</label>
            <select
              value={proyectoSeleccionadoId}
              onChange={(e) => {
                const found = proyectos.find((p) => p.id === Number(e.target.value));
                if (found) handleCambiarProyecto(found);
              }}
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800"
            >
              {proyectos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombreProyecto} ({p.nombreDocente})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Controles de Simulación */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          
          <div>
            <div className="flex justify-between font-bold text-slate-700 mb-1">
              <span>Alumnos Iniciales:</span>
              <span className="font-mono text-blue-700">{alumnosInscritosSim} alumnos</span>
            </div>
            <input
              type="range"
              min={4}
              max={30}
              value={alumnosInscritosSim}
              onChange={(e) => setAlumnosInscritosSim(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between font-bold text-slate-700 mb-1">
              <span>Deserciones (Bajas):</span>
              <span className="font-mono text-rose-600">-{desercionesSim} ({porcentajeDesercion.toFixed(0)}%)</span>
            </div>
            <input
              type="range"
              min={0}
              max={alumnosInscritosSim}
              value={desercionesSim}
              onChange={(e) => setDesercionesSim(Number(e.target.value))}
              className="w-full accent-rose-600 cursor-pointer"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Precio Matrícula / Alumno:</label>
            <input
              type="number"
              value={tarifaPorAlumnoSim}
              onChange={(e) => setTarifaPorAlumnoSim(Number(e.target.value))}
              className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Honorario Total Docente:</label>
            <input
              type="number"
              value={honorarioDocenteSim}
              onChange={(e) => setHonorarioDocenteSim(Number(e.target.value))}
              className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
            />
          </div>

        </div>

        {/* Resultados del Break-Even */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center text-xs">
          
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <span className="text-[10px] font-bold text-blue-800 uppercase block">Alumnos Activos</span>
            <div className="text-xl font-black text-blue-900 font-mono mt-0.5">
              {alumnosActivosSim} / {alumnosInscritosSim}
            </div>
            <span className="text-[10px] text-blue-700">Tasa retención: {(100 - porcentajeDesercion).toFixed(0)}%</span>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <span className="text-[10px] font-bold text-amber-800 uppercase block">Punto de Equilibrio</span>
            <div className="text-xl font-black text-amber-900 font-mono mt-0.5">
              {puntoEquilibrioAlumnos} alumnos
            </div>
            <span className="text-[10px] text-amber-700">Mínimo para no perder</span>
          </div>

          <div className={`p-3 rounded-xl border ${
            margenSeguridadAlumnos >= 2 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
              : margenSeguridadAlumnos >= 0 
              ? 'bg-amber-50 border-amber-200 text-amber-900' 
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            <span className="text-[10px] font-bold uppercase block">Margen de Seguridad</span>
            <div className="text-xl font-black font-mono mt-0.5">
              {margenSeguridadAlumnos >= 0 ? `+${margenSeguridadAlumnos}` : margenSeguridadAlumnos} alumnos
            </div>
            <span className="text-[10px]">
              {margenSeguridadAlumnos >= 2 ? 'Colchón holgado' : margenSeguridadAlumnos >= 0 ? 'En umbral crítico' : 'Déficit / Pérdida'}
            </span>
          </div>

          <div className={`p-3 rounded-xl border ${
            margenNetoSim >= 0 
              ? 'bg-indigo-50 border-indigo-200 text-indigo-950' 
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            <span className="text-[10px] font-bold uppercase block">Margen Neto Proyectado</span>
            <div className="text-xl font-black font-mono mt-0.5">
              {formatearMoneda(margenNetoSim, moneda)}
            </div>
            <span className="text-[10px] font-bold">
              {margenPorcentualSim.toFixed(1)}% de utilidad
            </span>
          </div>

        </div>

        {/* Diagnóstico Automatizado de Viabilidad */}
        <div className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
          margenNetoSim >= 0 && margenSeguridadAlumnos >= 2
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            : margenNetoSim >= 0
            ? 'bg-amber-50/70 border-amber-200 text-amber-900'
            : 'bg-rose-50/70 border-rose-200 text-rose-900'
        }`}>
          {margenNetoSim >= 0 ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-bold block">
              Dictamen Operativo: {margenNetoSim >= 0 ? 'Programa Financieramente Sostenible' : '¡Alerta de Déficit por Deserción!'}
            </span>
            <p className="mt-0.5 text-[11px] leading-relaxed">
              {margenNetoSim >= 0 ? (
                <>
                  Con {alumnosActivosSim} alumnos activos, la cohorte genera un ingreso bruto de {formatearMoneda(ingresoTotalSim, moneda)}, cubriendo holgadamente el costo del docente ({formatearMoneda(honorarioDocenteSim, moneda)}) y arrojando un margen de ganancia neta de {formatearMoneda(margenNetoSim, moneda)}.
                </>
              ) : (
                <>
                  Las deserciones dejaron al grupo con solo {alumnosActivosSim} alumnos, por debajo del punto de equilibrio ({puntoEquilibrioAlumnos} alumnos). Se proyecta una pérdida de {formatearMoneda(Math.abs(margenNetoSim), moneda)}. Se recomienda renegociar tarifa docente o fusionar grupo.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: SCORECARD DE RENTABILIDAD & ROI POR DOCENTE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Scorecard de Rentabilidad Docente & Eficiencia (ROI)
            </h4>
            <span className="text-[10px] text-slate-500">
              Evaluación del retorno financiero que cada facilitador aporta a Summit Impulsa S. de R.L.
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
            {rentabilidadPorDocente.length} Docentes Analizados
          </span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Docente / Especialidad</th>
                <th className="py-2.5 px-3 text-center">Cursos / Horas</th>
                <th className="py-2.5 px-3 text-center">Ratio Alum/Hora</th>
                <th className="py-2.5 px-3 text-right">Honorarios Pagados</th>
                <th className="py-2.5 px-3 text-right">Ingresos Facturados</th>
                <th className="py-2.5 px-3 text-right">Margen Neto Aportado</th>
                <th className="py-2.5 px-3 text-center">ROI Docente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rentabilidadPorDocente.map((doc) => {
                return (
                  <tr key={doc.nombre} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{doc.nombre}</div>
                      <div className="text-[10px] text-slate-500">{doc.especialidad}</div>
                    </td>

                    <td className="py-2.5 px-3 text-center font-mono">
                      <span className="font-bold text-slate-800">{doc.totalCursos} cursos</span>
                      <span className="text-[10px] text-slate-500 block">{doc.totalHoras} hrs</span>
                    </td>

                    <td className="py-2.5 px-3 text-center font-mono">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {doc.ratioAlumnosPorHora} alum/h
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono text-rose-700 font-medium">
                      {formatearMoneda(doc.honorariosTotales, moneda)}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono text-slate-800 font-medium">
                      {formatearMoneda(doc.ingresosTotalesGenerados, moneda)}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                      {formatearMoneda(doc.margenNetoGenerado, moneda)}
                    </td>

                    <td className="py-2.5 px-3 text-center font-mono">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        doc.roiDocente >= 2.0 
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                          : doc.roiDocente >= 1.0 
                          ? 'bg-blue-100 text-blue-900 border border-blue-300' 
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {doc.roiDocente}x ROI
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
