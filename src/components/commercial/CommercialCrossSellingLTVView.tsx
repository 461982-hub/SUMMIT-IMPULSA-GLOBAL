import React, { useState } from 'react';
import {
  ProyectoEducativo,
  Moneda,
} from '../../types';
import { formatearMoneda } from '../../utils/calculations';
import {
  TrendingUp,
  Award,
  ArrowRight,
  Sparkles,
  Users,
  Repeat,
  DollarSign,
  Send,
  CheckCircle2,
  Phone,
  Mail,
  GraduationCap,
  Save,
  Compass,
  Star,
} from 'lucide-react';

interface CommercialCrossSellingLTVViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto: (proyectoActualizado: ProyectoEducativo) => void;
}

export const CommercialCrossSellingLTVView: React.FC<CommercialCrossSellingLTVViewProps> = ({
  proyectos,
  moneda,
  onGuardarProyecto,
}) => {
  const [proyectoSeleccionadoId, setProyectoSeleccionadoId] = useState<string>(
    proyectos.length > 0 ? proyectos[0].id : ''
  );

  const proyectoActual = proyectos.find((p) => p.id === proyectoSeleccionadoId) || proyectos[0];

  // Egresados candidatos para re-compra
  const estudiantesGradebook = proyectoActual?.actaCalificaciones?.estudiantesNotas || [];

  const [egresadosRecompra, setEgresadosRecompra] = useState<
    NonNullable<NonNullable<ProyectoEducativo['rutasEspecializacionLTV']>['egresadosDistinguidosRecompra']>
  >(
    proyectoActual?.rutasEspecializacionLTV?.egresadosDistinguidosRecompra ||
      estudiantesGradebook.map((est, idx) => ({
        id: `recomp-${idx}`,
        idEstudiante: est.idEstudiante,
        nombre: est.nombreEstudiante,
        notaFinalGradebook: est.promedioFinal || 90,
        programaOrigen: proyectoActual?.nombreProyecto || 'Programa Base',
        interesadoEnPrograma: 'Programa de Continuidad Formativa',
        estadoContacto: 'Pendiente',
      }))
  );

  // Rutas de especialización sugeridas
  const [programasSiguientes, setProgramasSiguientes] = useState(
    proyectoActual?.rutasEspecializacionLTV?.programasSiguientes || []
  );

  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  // Formulario manual para agregar nueva ruta / programa de especialización
  const [nuevoProgNombre, setNuevoProgNombre] = useState('');
  const [nuevoProgDescPct, setNuevoProgDescPct] = useState(20);
  const [nuevoProgRazon, setNuevoProgRazon] = useState('');
  const [mostrarFormProg, setMostrarFormProg] = useState(false);

  // Formulario manual para agregar egresado a campaña
  const [nuevoEgresadoNombre, setNuevoEgresadoNombre] = useState('');
  const [nuevoEgresadoNota, setNuevoEgresadoNota] = useState(90);
  const [nuevoEgresadoPrograma, setNuevoEgresadoPrograma] = useState('');
  const [mostrarFormEgresado, setMostrarFormEgresado] = useState(false);

  const handleAgregarNuevoPrograma = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoProgNombre.trim()) return;
    const nuevo = {
      id: `prog-sig-${Date.now()}`,
      nombrePrograma: nuevoProgNombre.trim(),
      descuentoContinuidadPct: nuevoProgDescPct,
      razonRecomendacion: nuevoProgRazon.trim() || 'Programa de especialización y continuidad ejecutiva recomendada.',
    };
    const actualizados = [...programasSiguientes, nuevo];
    setProgramasSiguientes(actualizados);
    setNuevoProgNombre('');
    setNuevoProgRazon('');
    setMostrarFormProg(false);

    if (proyectoActual) {
      onGuardarProyecto({
        ...proyectoActual,
        rutasEspecializacionLTV: {
          ...(proyectoActual.rutasEspecializacionLTV || {}),
          programasSiguientes: actualizados,
          egresadosDistinguidosRecompra: egresadosRecompra,
        },
      });
    }
  };

  const handleEliminarPrograma = (id: string) => {
    const actualizados = programasSiguientes.filter((p) => p.id !== id);
    setProgramasSiguientes(actualizados);
    if (proyectoActual) {
      onGuardarProyecto({
        ...proyectoActual,
        rutasEspecializacionLTV: {
          ...(proyectoActual.rutasEspecializacionLTV || {}),
          programasSiguientes: actualizados,
          egresadosDistinguidosRecompra: egresadosRecompra,
        },
      });
    }
  };

  const handleAgregarEgresadoManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoEgresadoNombre.trim()) return;
    const nuevo = {
      id: `recomp-manual-${Date.now()}`,
      idEstudiante: `EST-${Math.floor(1000 + Math.random() * 9000)}`,
      nombre: nuevoEgresadoNombre.trim(),
      notaFinalGradebook: nuevoEgresadoNota,
      programaOrigen: proyectoActual?.nombreProyecto || 'Diplomado',
      interesadoEnPrograma: nuevoEgresadoPrograma || (programasSiguientes[0]?.nombrePrograma || 'Especialización Continua'),
      estadoContacto: 'Pendiente' as const,
    };
    const actualizados = [nuevo, ...egresadosRecompra];
    setEgresadosRecompra(actualizados);
    setNuevoEgresadoNombre('');
    setMostrarFormEgresado(false);

    if (proyectoActual) {
      onGuardarProyecto({
        ...proyectoActual,
        rutasEspecializacionLTV: {
          ...(proyectoActual.rutasEspecializacionLTV || {}),
          egresadosDistinguidosRecompra: actualizados,
          programasSiguientes,
        },
      });
    }
  };

  const handleSeleccionarProyecto = (p: ProyectoEducativo) => {
    setProyectoSeleccionadoId(p.id);
    if (p.rutasEspecializacionLTV?.egresadosDistinguidosRecompra) {
      setEgresadosRecompra(p.rutasEspecializacionLTV.egresadosDistinguidosRecompra);
    } else {
      const gbook = p.actaCalificaciones?.estudiantesNotas || [];
      const muestra = gbook.map((est, idx) => ({
        id: `recomp-${idx}-${Date.now()}`,
        idEstudiante: est.idEstudiante,
        nombre: est.nombreEstudiante,
        notaFinalGradebook: est.promedioFinal || 88,
        programaOrigen: p.nombreProyecto,
        interesadoEnPrograma: 'Programa de Continuidad y Especialización',
        estadoContacto: 'Pendiente' as const,
      }));
      setEgresadosRecompra(muestra);
    }
    if (p.rutasEspecializacionLTV?.programasSiguientes) {
      setProgramasSiguientes(p.rutasEspecializacionLTV.programasSiguientes);
    } else {
      setProgramasSiguientes([]);
    }
    setGuardadoExitoso(false);
  };

  const handleCambiarEstadoContacto = (
    id: string,
    nuevoEstado: NonNullable<NonNullable<ProyectoEducativo['rutasEspecializacionLTV']>['egresadosDistinguidosRecompra']>[0]['estadoContacto']
  ) => {
    const actualizados = egresadosRecompra.map((e) =>
      e.id === id ? { ...e, estadoContacto: nuevoEstado } : e
    );
    setEgresadosRecompra(actualizados);
    if (proyectoActual) {
      onGuardarProyecto({
        ...proyectoActual,
        rutasEspecializacionLTV: {
          ...(proyectoActual.rutasEspecializacionLTV || {}),
          egresadosDistinguidosRecompra: actualizados,
          programasSiguientes,
        },
      });
    }
  };

  const handleGuardarRutas = () => {
    if (!proyectoActual) return;
    onGuardarProyecto({
      ...proyectoActual,
      rutasEspecializacionLTV: {
        rutaSugeridaNombre: 'Ruta de Maestría Ejecutiva & Formación Continua',
        programasSiguientes,
        egresadosDistinguidosRecompra: egresadosRecompra,
        tasaRecompraHistoricaPct: 35,
      },
    });
    setGuardadoExitoso(true);
    setTimeout(() => setGuardadoExitoso(false), 3000);
  };

  // Cálculos de LTV
  const ticketPromedio = proyectoActual?.precioSugeridoAlumno || 2500;
  const ltvEstimadoPorAlumno = Math.round(ticketPromedio * 1.65);
  const matriculadosRecompra = egresadosRecompra.filter((e) => e.estadoContacto === 'Matriculado').length;
  const tasaRecompraActual = egresadosRecompra.length > 0 ? Math.round((matriculadosRecompra / egresadosRecompra.length) * 100) : 0;
  const ingresosCrossSellingGenerados = matriculadosRecompra * ticketPromedio * 0.8;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Encabezado del Módulo */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[11px] font-extrabold uppercase rounded tracking-wider">
              Student LTV & Cross-Selling Engine
            </span>
            <span className="text-xs text-slate-500 font-medium">Rutas de Carrera & Re-compra</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
            <Repeat className="w-5 h-5 text-indigo-600" />
            Motor de Re-compra & Rutas de Carrera (LTV)
          </h3>
          <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
            Maximiza el valor de vida del estudiante ofreciendo diplomados avanzados a los egresados con alto rendimiento del Libro de Calificaciones.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGuardarRutas}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-black rounded-lg transition-colors shadow-xs"
        >
          <Save className="w-4 h-4" />
          <span>Guardar Configuración LTV</span>
        </button>
      </div>

      {guardadoExitoso && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Rutas de especialización y seguimiento de re-compra guardados con éxito.</span>
        </div>
      )}

      {/* Selector de Proyecto */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <label className="text-xs font-bold text-slate-700 block mb-2">
          Seleccionar Programa Formativo de Origen (Cohorte Base):
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {proyectos.map((p) => {
            const isSelected = p.id === proyectoActual?.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSeleccionarProyecto(p)}
                className={`text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-indigo-800 text-white border-indigo-900 shadow-sm'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                <div className="text-[10px] font-mono uppercase tracking-wider opacity-80">
                  {p.codigoPrograma || `SEC-${p.id}`}
                </div>
                <h4 className="text-xs font-black line-clamp-1 mt-0.5">{p.nombreProyecto}</h4>
                <div className="flex items-center justify-between text-[10px] mt-1 opacity-90">
                  <span>Egresados: {p.alumnosFinal || p.alumnosProyectados || 0}</span>
                  <span className="font-bold">LTV: {formatearMoneda((p.precioSugeridoAlumno || 2500) * 1.6, moneda)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4 KPIs de LTV y Re-compra */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">LTV Proyectado x Alumno</span>
          <div className="text-2xl font-black font-mono mt-1 text-indigo-400">
            {formatearMoneda(ltvEstimadoPorAlumno, moneda)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">1.65 programas x estudiante</span>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Tasa de Re-Matrícula</span>
          <div className="text-2xl font-black font-mono mt-1 text-emerald-400">
            {tasaRecompraActual}%
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">{matriculadosRecompra} de {egresadosRecompra.length} alumnos</span>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Ingreso Cross-Selling</span>
          <div className="text-2xl font-black font-mono mt-1 text-amber-400">
            {formatearMoneda(ingresosCrossSellingGenerados, moneda)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Ventas de continuidad</span>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Egresados Distinguidos</span>
          <div className="text-2xl font-black font-mono mt-1 text-purple-400">
            {egresadosRecompra.filter((e) => e.notaFinalGradebook >= 85).length}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Promedio Gradebook &ge; 85</span>
        </div>
      </div>

      {/* Rutas de Carrera & Mapa de Especialización Sugerido */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-600" />
            Rutas de Especialización Sugeridas para Continuidad
          </h4>
          <button
            type="button"
            onClick={() => setMostrarFormProg(!mostrarFormProg)}
            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-lg text-xs font-bold transition-colors"
          >
            {mostrarFormProg ? '✕ Cancelar' : '+ Agregar Programa Continuo'}
          </button>
        </div>

        {mostrarFormProg && (
          <form onSubmit={handleAgregarNuevoPrograma} className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-4 mb-4 space-y-3">
            <h5 className="text-xs font-bold text-indigo-950">✍️ Registrar Nuevo Programa de Especialización Continua</h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase">Nombre del Programa</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Máster Ejecutivo en Estrategia Digital y AI"
                  value={nuevoProgNombre}
                  onChange={(e) => setNuevoProgNombre(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase">% Descuento Alumni</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={nuevoProgDescPct}
                  onChange={(e) => setNuevoProgDescPct(parseInt(e.target.value, 10) || 0)}
                  className="w-full text-xs font-mono font-bold p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-700 uppercase">Razón / Beneficio de la Recomendación</label>
              <input
                type="text"
                placeholder="Ej. Diseñado especialmente para egresados de finanzas que buscan automatización..."
                value={nuevoProgRazon}
                onChange={(e) => setNuevoProgRazon(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold"
              >
                Guardar Programa
              </button>
            </div>
          </form>
        )}

        {programasSiguientes.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
            <Compass className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">
              No hay rutas de continuidad o especialización registradas para este programa.
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 max-w-md mx-auto">
              Defina programas complementarios de la Gerencia Académica y asigne descuentos Alumni para impulsar el Life-Time Value (LTV).
            </p>
            <button
              type="button"
              onClick={() => setMostrarFormProg(true)}
              className="mt-3 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Configurar Programa Siguiente</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {programasSiguientes.map((prog, idx) => (
              <div key={prog.id} className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-4 flex flex-col justify-between relative group">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded">
                      Siguiente Nivel {idx + 1}
                    </span>
                    <span className="text-xs font-black font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      -{prog.descuentoContinuidadPct}% Alumni
                    </span>
                  </div>
                  <h5 className="text-xs font-black text-slate-900 mt-2">{prog.nombrePrograma}</h5>
                  <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">{prog.razonRecomendacion}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-indigo-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold text-[10px]">Beneficio de Lealtad</span>
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-900 font-black text-xs">Cupo VIP</span>
                    {programasSiguientes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleEliminarPrograma(prog.id)}
                        className="text-rose-500 hover:text-rose-700 text-[10px]"
                        title="Eliminar opción"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tablero de Egresados del Gradebook para Campaña de Re-compra */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            Egresados de la Cohorte & Campaña de Retención y Re-matrícula
          </h4>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMostrarFormEgresado(!mostrarFormEgresado)}
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-lg text-xs font-bold transition-colors"
            >
              {mostrarFormEgresado ? '✕ Cancelar' : '+ Registrar Alumno Egresado'}
            </button>
            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">Alimentado por Gradebook & CRM</span>
          </div>
        </div>

        {mostrarFormEgresado && (
          <form onSubmit={handleAgregarEgresadoManual} className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 space-y-3">
            <h5 className="text-xs font-bold text-slate-950">✍️ Registrar Alumno Egresado para Seguimiento de Re-compra</h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Ing. Roberto Ramos"
                  value={nuevoEgresadoNombre}
                  onChange={(e) => setNuevoEgresadoNombre(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase">Nota Gradebook (0-100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={nuevoEgresadoNota}
                  onChange={(e) => setNuevoEgresadoNota(parseInt(e.target.value, 10) || 0)}
                  className="w-full text-xs font-mono font-bold p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase">Oferta Sugerida</label>
                <select
                  value={nuevoEgresadoPrograma}
                  onChange={(e) => setNuevoEgresadoPrograma(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Seleccionar programa...</option>
                  {programasSiguientes.map((pr) => (
                    <option key={pr.id} value={pr.nombrePrograma}>
                      {pr.nombrePrograma}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold"
              >
                Agregar a Campaña de Re-compra
              </button>
            </div>
          </form>
        )}

        {egresadosRecompra.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">No hay registros de egresados disponibles en esta cohorte.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold">
                <tr>
                  <th className="p-2 text-left">Estudiante Egresado</th>
                  <th className="p-2 text-center">Nota Gradebook</th>
                  <th className="p-2 text-left">Programa Origen</th>
                  <th className="p-2 text-left">Oferta de Continuidad Sugerida</th>
                  <th className="p-2 text-center">Estado Contacto</th>
                  <th className="p-2 text-center">Gestión Comercial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {egresadosRecompra.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="p-2 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        {e.notaFinalGradebook >= 90 && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                        <span>{e.nombre}</span>
                      </div>
                    </td>
                    <td className="p-2 text-center font-mono font-bold">
                      <span className={e.notaFinalGradebook >= 85 ? 'text-emerald-700' : 'text-slate-700'}>
                        {e.notaFinalGradebook} pts
                      </span>
                    </td>
                    <td className="p-2 text-slate-600 max-w-xs truncate">{e.programaOrigen}</td>
                    <td className="p-2 text-indigo-900 font-medium max-w-xs truncate">{e.interesadoEnPrograma}</td>
                    <td className="p-2 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          e.estadoContacto === 'Matriculado'
                            ? 'bg-emerald-100 text-emerald-800'
                            : e.estadoContacto === 'Contactado'
                            ? 'bg-blue-100 text-blue-800'
                            : e.estadoContacto === 'No Interesado'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {e.estadoContacto}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <select
                        value={e.estadoContacto}
                        onChange={(eVal) => handleCambiarEstadoContacto(e.id, eVal.target.value as any)}
                        className="text-[10px] bg-white border border-slate-300 rounded p-1"
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="Contactado">Contactado</option>
                        <option value="Matriculado">Matriculado</option>
                        <option value="No Interesado">No Interesado</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
