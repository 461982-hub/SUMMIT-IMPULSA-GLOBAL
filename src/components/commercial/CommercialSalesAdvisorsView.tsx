import React, { useState } from 'react';
import {
  ProyectoEducativo,
  Moneda,
} from '../../types';
import { formatearMoneda } from '../../utils/calculations';
import {
  Users,
  Award,
  DollarSign,
  TrendingUp,
  Percent,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Target,
  Trophy,
  Briefcase,
  Mail,
  Zap,
} from 'lucide-react';

interface CommercialSalesAdvisorsViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto: (proyectoActualizado: ProyectoEducativo) => void;
}

export const CommercialSalesAdvisorsView: React.FC<CommercialSalesAdvisorsViewProps> = ({
  proyectos,
  moneda,
  onGuardarProyecto,
}) => {
  const [proyectoSeleccionadoId, setProyectoSeleccionadoId] = useState<string>(
    proyectos.length > 0 ? proyectos[0].id : ''
  );

  const proyectoActual = proyectos.find((p) => p.id === proyectoSeleccionadoId) || proyectos[0];

  const ticketSugerido = proyectoActual?.precioSugeridoAlumno || 2500;

  // Asesores comerciales
  const [asesores, setAsesores] = useState<
    NonNullable<ProyectoEducativo['asesoresComercialesProyecto']>
  >(
    proyectoActual?.asesoresComercialesProyecto || []
  );

  // Formulario nuevo asesor
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoCorreo, setNuevoCorreo] = useState('');
  const [nuevaMeta, setNuevaMeta] = useState<number>(8);
  const [nuevoPctComision, setNuevoPctComision] = useState<number>(5.0);
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  const handleSeleccionarProyecto = (p: ProyectoEducativo) => {
    setProyectoSeleccionadoId(p.id);
    setAsesores(p.asesoresComercialesProyecto || []);
    setGuardadoExitoso(false);
  };

  const handleCrearAsesor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;

    const nuevo: NonNullable<ProyectoEducativo['asesoresComercialesProyecto']>[0] = {
      id: `adv-${Date.now()}`,
      nombre: nuevoNombre,
      correo: nuevoCorreo || `${nuevoNombre.toLowerCase().replace(/\s+/g, '')}@summitimpulsa.com`,
      metaInscritosMes: nuevaMeta,
      inscritosLogrados: 0,
      totalFacturado: 0,
      porcentajeComision: nuevoPctComision,
      comisionCalculada: 0,
      tasaConversionLeadAInscrito: 0,
    };

    const actualizados = [...asesores, nuevo];
    setAsesores(actualizados);
    setNuevoNombre('');
    setNuevoCorreo('');

    if (proyectoActual) {
      onGuardarProyecto({
        ...proyectoActual,
        asesoresComercialesProyecto: actualizados,
      });
      setGuardadoExitoso(true);
      setTimeout(() => setGuardadoExitoso(false), 3000);
    }
  };

  const handleActualizarInscritos = (id: string, nuevosInscritos: number) => {
    const actualizados = asesores.map((a) => {
      if (a.id === id) {
        const inscritos = Math.max(0, nuevosInscritos);
        const facturado = inscritos * ticketSugerido;
        const comision = Math.round(facturado * (a.porcentajeComision / 100));
        return {
          ...a,
          inscritosLogrados: inscritos,
          totalFacturado: facturado,
          comisionCalculada: comision,
        };
      }
      return a;
    });
    setAsesores(actualizados);
    if (proyectoActual) {
      onGuardarProyecto({
        ...proyectoActual,
        asesoresComercialesProyecto: actualizados,
      });
    }
  };

  const handleEliminarAsesor = (id: string) => {
    const actualizados = asesores.filter((a) => a.id !== id);
    setAsesores(actualizados);
    if (proyectoActual) {
      onGuardarProyecto({
        ...proyectoActual,
        asesoresComercialesProyecto: actualizados,
      });
    }
  };

  const handleGuardarTodo = () => {
    if (!proyectoActual) return;
    onGuardarProyecto({
      ...proyectoActual,
      asesoresComercialesProyecto: asesores,
    });
    setGuardadoExitoso(true);
    setTimeout(() => setGuardadoExitoso(false), 3000);
  };

  // Métricas de liquidación
  const totalInscritosEquipo = asesores.reduce((acc, a) => acc + a.inscritosLogrados, 0);
  const totalFacturadoEquipo = asesores.reduce((acc, a) => acc + a.totalFacturado, 0);
  const totalComisionesLiquidacion = asesores.reduce((acc, a) => acc + a.comisionCalculada, 0);
  const mejorAsesor = [...asesores].sort((a, b) => b.inscritosLogrados - a.inscritosLogrados)[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Encabezado del Módulo */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-teal-100 text-teal-800 text-[11px] font-extrabold uppercase rounded tracking-wider">
              Sales Team Performance & Commissions
            </span>
            <span className="text-xs text-slate-500 font-medium">Productividad & Comisiones</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-teal-600" />
            Tablero de Rendimiento de Asesores & Liquidación de Comisiones
          </h3>
          <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
            Mide el cumplimiento de metas individuales por asesor comercial y calcula automáticamente las comisiones por matrícula efectiva y solvente.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGuardarTodo}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-black rounded-lg transition-colors shadow-xs"
        >
          <Save className="w-4 h-4" />
          <span>Guardar Rendimiento</span>
        </button>
      </div>

      {guardadoExitoso && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Rendimiento y comisiones de asesores guardados exitosamente.</span>
        </div>
      )}

      {/* Selector de Proyecto */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <label className="text-xs font-bold text-slate-700 block mb-2">
          Seleccionar Programa Formativo:
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
                    ? 'bg-teal-800 text-white border-teal-900 shadow-sm'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                <div className="text-[10px] font-mono uppercase tracking-wider opacity-80">
                  {p.codigoPrograma || `SEC-${p.id}`}
                </div>
                <h4 className="text-xs font-black line-clamp-1 mt-0.5">{p.nombreProyecto}</h4>
                <div className="flex items-center justify-between text-[10px] mt-1 opacity-90">
                  <span>Asesores: {p.asesoresComercialesProyecto?.length || 2}</span>
                  <span className="font-bold">{p.alumnosFinal || p.alumnosProyectados || 0} matriculados</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4 KPIs de Ventas y Comisiones */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Matrículas del Equipo</span>
          <div className="text-2xl font-black font-mono mt-1 text-teal-400">
            {totalInscritosEquipo}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Alumnos captados</span>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Recaudación Facturada</span>
          <div className="text-2xl font-black font-mono mt-1 text-emerald-400">
            {formatearMoneda(totalFacturadoEquipo, moneda)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Ventas directas</span>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Comisiones a Liquidar</span>
          <div className="text-2xl font-black font-mono mt-1 text-amber-400">
            {formatearMoneda(totalComisionesLiquidacion, moneda)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Liquidación para nómina</span>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Top Performer del Mes</span>
          <div className="text-base font-black text-white mt-1 truncate">
            {mejorAsesor?.nombre || 'N/A'}
          </div>
          <span className="text-[10px] text-teal-300 font-mono mt-0.5 block">
            {mejorAsesor?.inscritosLogrados || 0} matrículas cerradas
          </span>
        </div>
      </div>

      {/* Grid: Formulario Agregar Asesor + Tabla de Rendimiento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulario Agregar Asesor */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <form onSubmit={handleCrearAsesor} className="space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <Plus className="w-4 h-4 text-teal-600" />
              Asignar Nuevo Asesor Comercial
            </h4>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block">Nombre del Asesor Comercial *</label>
              <input
                type="text"
                required
                placeholder="Lic. Karla Durón"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                className="w-full mt-1 p-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block">Correo Institucional:</label>
              <input
                type="email"
                placeholder="kduron@summitimpulsa.com"
                value={nuevoCorreo}
                onChange={(e) => setNuevoCorreo(e.target.value)}
                className="w-full mt-1 p-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block">Cuota Mensual (Meta):</label>
                <input
                  type="number"
                  min="1"
                  value={nuevaMeta}
                  onChange={(e) => setNuevaMeta(Number(e.target.value))}
                  className="w-full mt-1 p-2 text-xs font-mono border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block">Comisión (%):</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="20"
                  value={nuevoPctComision}
                  onChange={(e) => setNuevoPctComision(Number(e.target.value))}
                  className="w-full mt-1 p-2 text-xs font-mono border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-black rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Asesor</span>
            </button>
          </form>
        </div>

        {/* Tabla de Rendimiento & Liquidación */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-2">
            <span>Rendimiento Individual & Cuotas ({asesores.length})</span>
            <span className="text-[10px] text-slate-500 font-mono">Cálculo en Tiempo Real</span>
          </h4>

          {asesores.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">No hay asesores asignados a este programa.</p>
          ) : (
            <div className="space-y-3">
              {asesores.map((a, idx) => {
                const porcentajeMeta = a.metaInscritosMes > 0 ? Math.round((a.inscritosLogrados / a.metaInscritosMes) * 100) : 0;
                let barColor = 'bg-emerald-500';
                if (porcentajeMeta < 60) barColor = 'bg-red-500';
                else if (porcentajeMeta < 90) barColor = 'bg-amber-500';

                return (
                  <div key={a.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-teal-800 text-white text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </div>
                        <div>
                          <h5 className="text-xs font-black text-slate-900">{a.nombre}</h5>
                          <span className="text-[10px] text-slate-500 block">{a.correo}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-mono">
                        <div>
                          <span className="text-[9px] text-slate-500 block">Facturado:</span>
                          <span className="font-black text-slate-900">
                            {formatearMoneda(a.totalFacturado, moneda)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-slate-500 block">Comisión ({a.porcentajeComision}%):</span>
                          <span className="font-black text-emerald-700">
                            {formatearMoneda(a.comisionCalculada, moneda)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleEliminarAsesor(a.id)}
                          className="text-slate-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Barra de Progreso de Meta */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-600 font-semibold">
                          Cumplimiento: <strong>{a.inscritosLogrados}</strong> de <strong>{a.metaInscritosMes}</strong> alumnos ({porcentajeMeta}%)
                        </span>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[10px] text-slate-500 mr-0.5">Ajustar:</span>
                          <button
                            type="button"
                            onClick={() => handleActualizarInscritos(a.id, Math.max(0, a.inscritosLogrados - 1))}
                            className="w-5 h-5 flex items-center justify-center bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-black text-xs"
                            title="Disminuir 1 alumno"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={a.inscritosLogrados}
                            onChange={(e) => handleActualizarInscritos(a.id, Number(e.target.value))}
                            className="w-12 p-0.5 text-xs text-center font-mono border border-slate-300 rounded bg-white font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => handleActualizarInscritos(a.id, a.inscritosLogrados + 1)}
                            className="w-5 h-5 flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white rounded font-black text-xs"
                            title="Aumentar 1 alumno"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div className={`h-full ${barColor} transition-all duration-300`} style={{ width: `${Math.min(100, porcentajeMeta)}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
