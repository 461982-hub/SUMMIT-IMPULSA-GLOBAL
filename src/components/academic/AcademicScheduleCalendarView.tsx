import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  BookOpen, 
  FileText, 
  Filter, 
  Sparkles,
  Layers,
  MapPin,
  Laptop
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';

interface AcademicScheduleCalendarViewProps {
  proyectos: ProyectoEducativo[];
  onVerSyllabus: (proyecto: ProyectoEducativo) => void;
  onEditarProyecto?: (proyecto: ProyectoEducativo) => void;
  moneda?: Moneda;
}

export const AcademicScheduleCalendarView: React.FC<AcademicScheduleCalendarViewProps> = ({
  proyectos,
  onVerSyllabus,
  onEditarProyecto,
  moneda = 'HNL',
}) => {
  const [fechaBase, setFechaBase] = useState(() => new Date());
  const [filtroDocente, setFiltroDocente] = useState<string>('todos');
  const [filtroModalidad, setFiltroModalidad] = useState<string>('todas');

  const anoActual = fechaBase.getFullYear();
  const mesActual = fechaBase.getMonth(); // 0 - 11

  const nombreMes = fechaBase.toLocaleString('es-HN', { month: 'long' });
  const nombreMesCapitalizado = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);

  // Lista única de docentes
  const listaDocentes = useMemo(() => {
    const setDoc = new Set<string>();
    proyectos.forEach(p => {
      if (p.nombreDocente && p.nombreDocente.trim()) {
        setDoc.add(p.nombreDocente.trim());
      }
    });
    return Array.from(setDoc);
  }, [proyectos]);

  // Detector de Solapamientos de Horarios y Docentes
  const solapamientosDocentes = useMemo(() => {
    const conflictos: Array<{
      docente: string;
      curso1: ProyectoEducativo;
      curso2: ProyectoEducativo;
      motivo: string;
    }> = [];

    for (let i = 0; i < proyectos.length; i++) {
      for (let j = i + 1; j < proyectos.length; j++) {
        const p1 = proyectos[i];
        const p2 = proyectos[j];

        if (
          p1.nombreDocente &&
          p2.nombreDocente &&
          p1.nombreDocente.trim().toLowerCase() === p2.nombreDocente.trim().toLowerCase() &&
          p1.seLlevoACabo !== 'Cancelado' &&
          p2.seLlevoACabo !== 'Cancelado' &&
          p1.seLlevoACabo !== 'No se llevó a cabo' &&
          p2.seLlevoACabo !== 'No se llevó a cabo'
        ) {
          // Comparar horario y días
          const h1 = (p1.horario || '').toLowerCase().trim();
          const h2 = (p2.horario || '').toLowerCase().trim();
          const d1 = (p1.diasClase || '').toLowerCase().trim();
          const d2 = (p2.diasClase || '').toLowerCase().trim();

          if (h1 && h2 && h1 === h2 && d1 && d2 && d1 === d2) {
            conflictos.push({
              docente: p1.nombreDocente,
              curso1: p1,
              curso2: p2,
              motivo: `Mismo horario (${p1.horario}) y mismos días (${p1.diasClase})`,
            });
          }
        }
      }
    }

    return conflictos;
  }, [proyectos]);

  // Filtrar proyectos
  const proyectosFiltrados = useMemo(() => {
    return proyectos.filter(p => {
      if (filtroDocente !== 'todos' && p.nombreDocente !== filtroDocente) return false;
      if (filtroModalidad !== 'todas' && p.modalidad !== filtroModalidad) return false;
      return true;
    });
  }, [proyectos, filtroDocente, filtroModalidad]);

  // Generar cuadrícula del mes
  const diasMes = useMemo(() => {
    const primerDiaSemana = new Date(anoActual, mesActual, 1).getDay(); // 0 = Domingo
    const totalDiasEnMes = new Date(anoActual, mesActual + 1, 0).getDate();

    // Ajustar para que la semana empiece en Lunes (0 = Lunes, 6 = Domingo)
    const offset = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;

    const casillas: Array<{
      numeroDia: number | null;
      fechaString?: string;
      proyectosDelDia: ProyectoEducativo[];
    }> = [];

    // Celdas vacías previas
    for (let i = 0; i < offset; i++) {
      casillas.push({ numeroDia: null, proyectosDelDia: [] });
    }

    // Días del mes
    for (let dia = 1; dia <= totalDiasEnMes; dia++) {
      const fechaStr = `${anoActual}-${String(mesActual + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      const cursos = proyectosFiltrados.filter(p => {
        if (!p.fechaProgramacion) return false;
        return p.fechaProgramacion.startsWith(fechaStr);
      });

      casillas.push({
        numeroDia: dia,
        fechaString: fechaStr,
        proyectosDelDia: cursos,
      });
    }

    return casillas;
  }, [anoActual, mesActual, proyectosFiltrados]);

  const irMesAnterior = () => {
    setFechaBase(new Date(anoActual, mesActual - 1, 1));
  };

  const irMesSiguiente = () => {
    setFechaBase(new Date(anoActual, mesActual + 1, 1));
  };

  const irMesActual = () => {
    setFechaBase(new Date());
  };

  return (
    <div className="space-y-5">
      
      {/* Alerta de Solapamientos de Docentes */}
      {solapamientosDocentes.length > 0 && (
        <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl text-rose-950 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <h4 className="text-xs sm:text-sm font-black text-rose-900 uppercase tracking-wider">
              ¡Alerta Crítica de Solapamiento Docente Detectada! ({solapamientosDocentes.length})
            </h4>
          </div>
          <p className="text-xs text-rose-800 leading-relaxed">
            Se han identificado docentes asignados simultáneamente a dos o más programas en la misma franja horaria y días de clase:
          </p>
          <div className="space-y-1.5 pt-1">
            {solapamientosDocentes.map((conflicto, idx) => (
              <div key={idx} className="p-2.5 bg-white rounded-xl border border-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                <div>
                  <span className="font-black text-rose-900">{conflicto.docente}</span>: conflicto entre{' '}
                  <strong className="text-slate-900">{conflicto.curso1.nombreProyecto} ({conflicto.curso1.seccion || 'Sec. A'})</strong> y{' '}
                  <strong className="text-slate-900">{conflicto.curso2.nombreProyecto} ({conflicto.curso2.seccion || 'Sec. B'})</strong>.
                  <div className="text-[11px] text-rose-700 font-mono mt-0.5">{conflicto.motivo}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {onEditarProyecto && (
                    <button
                      type="button"
                      onClick={() => onEditarProyecto(conflicto.curso2)}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[11px] transition-colors"
                    >
                      Ajustar Horario
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barra de Filtros y Controles del Calendario */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Navegación del Mes */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                {nombreMesCapitalizado} {anoActual}
              </h3>
              <button
                type="button"
                onClick={irMesActual}
                className="px-2 py-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors cursor-pointer"
              >
                Hoy
              </button>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Cronograma de Aperturas y Sesiones Curriculares
            </span>
          </div>

          <div className="flex items-center gap-1 ml-2">
            <button
              type="button"
              onClick={irMesAnterior}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              title="Mes Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={irMesSiguiente}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              title="Mes Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-600">Docente:</span>
            <select
              value={filtroDocente}
              onChange={(e) => setFiltroDocente(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos los Docentes ({listaDocentes.length})</option>
              {listaDocentes.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-600">Modalidad:</span>
            <select
              value={filtroModalidad}
              onChange={(e) => setFiltroModalidad(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
            >
              <option value="todas">Todas las Modalidades</option>
              <option value="Virtual Sincrónica">Virtual Sincrónica</option>
              <option value="Presencial">Presencial</option>
              <option value="Híbrida">Híbrida</option>
              <option value="Asincrónica LMS">Asincrónica LMS</option>
            </select>
          </div>
        </div>

      </div>

      {/* Cuadrícula del Calendario Mensual */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Días de la semana */}
        <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200 text-center text-xs font-black text-slate-700 py-2.5 uppercase tracking-wider">
          <div>Lun</div>
          <div>Mar</div>
          <div>Mié</div>
          <div>Jue</div>
          <div>Vie</div>
          <div className="text-blue-900 font-extrabold">Sáb</div>
          <div className="text-rose-900 font-extrabold">Dom</div>
        </div>

        {/* Casillas de los días */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-200">
          {diasMes.map((casilla, index) => {
            if (casilla.numeroDia === null) {
              return <div key={index} className="min-h-[105px] bg-slate-50/50 p-2" />;
            }

            const hoy = new Date();
            const esHoy = hoy.getFullYear() === anoActual && hoy.getMonth() === mesActual && hoy.getDate() === casilla.numeroDia;

            return (
              <div 
                key={index}
                className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors ${
                  esHoy ? 'bg-blue-50/40 font-bold' : 'hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-mono font-bold ${
                    esHoy 
                      ? 'w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center' 
                      : 'text-slate-700'
                  }`}>
                    {casilla.numeroDia}
                  </span>

                  {casilla.proyectosDelDia.length > 0 && (
                    <span className="text-[9px] font-black uppercase px-1 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                      {casilla.proyectosDelDia.length} Inicio{casilla.proyectosDelDia.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Listado de cursos que inician ese día */}
                <div className="space-y-1 mt-1.5 flex-1">
                  {casilla.proyectosDelDia.map((curso) => (
                    <div
                      key={curso.id}
                      onClick={() => onVerSyllabus(curso)}
                      className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[10px] text-blue-950 cursor-pointer transition-colors shadow-2xs group"
                      title={`${curso.nombreProyecto} - ${curso.nombreDocente} (${curso.horario || 'Sin horario'})`}
                    >
                      <div className="font-bold truncate group-hover:text-blue-700">
                        {curso.nombreProyecto}
                      </div>
                      <div className="text-[9px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                        <Users className="w-2.5 h-2.5 shrink-0" />
                        <span>{curso.nombreDocente}</span>
                      </div>
                      {curso.horario && (
                        <div className="text-[9px] font-mono text-blue-800 font-semibold truncate flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 shrink-0" />
                          <span>{curso.horario}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Resumen de Próximas Aperturas */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-blue-600" />
          Listado Maestro de Próximas Aperturas Académicas
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {proyectosFiltrados.map((p) => (
            <div 
              key={p.id}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-blue-300 transition-all text-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded">
                    {p.nivel || 'Básico'}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    {p.fechaProgramacion || 'Por definir'}
                  </span>
                </div>

                <h5 className="font-black text-slate-900 mt-1.5 text-xs line-clamp-2">
                  {p.nombreProyecto}
                </h5>

                <div className="space-y-1 mt-2 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">{p.nombreDocente}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{p.horasClase} hrs • {p.diasClase || 'Días regulares'}</span>
                  </div>
                  {p.horario && (
                    <div className="text-slate-500 font-mono text-[10px]">
                      {p.horario} ({p.modalidad || 'Virtual'})
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => onVerSyllabus(p)}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                >
                  <FileText className="w-3 h-3" />
                  <span>Sílabo Oficial</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
