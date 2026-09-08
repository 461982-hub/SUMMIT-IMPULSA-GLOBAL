import React, { useState, useMemo } from 'react';
import { ProyectoEducativo, Moneda } from '../../types';
import { formatearMoneda } from '../../utils/calculations';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Users, 
  Zap, 
  Send, 
  Edit3, 
  ArrowRight,
  TrendingUp,
  Clock,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface CommercialGoNoGoWidgetProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onMatricularRapido: (proyecto: ProyectoEducativo) => void;
  onCotizarWhatsApp: (proyecto: ProyectoEducativo) => void;
  onEditarProyecto: (proyecto: ProyectoEducativo) => void;
}

export const CommercialGoNoGoWidget: React.FC<CommercialGoNoGoWidgetProps> = ({
  proyectos,
  moneda,
  onMatricularRapido,
  onCotizarWhatsApp,
  onEditarProyecto,
}) => {
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'alerta' | 'asegurado' | 'critico'>('todos');

  // Análisis de viabilidad de cada proyecto
  const proyectosAnalizados = useMemo(() => {
    return proyectos.map((p) => {
      const matriculados = p.alumnosFinal || 0;
      const equilibrio = p.puntoEquilibrioAlumnos || 5;
      const brecha = matriculados - equilibrio; // >= 0 es verde, < 0 es deficit
      const deficitAlumnos = Math.max(0, equilibrio - matriculados);

      // Calcular urgencia por fecha
      let diasRestantes = 30;
      if (p.fechaProgramacion) {
        const fechaInicio = new Date(p.fechaProgramacion);
        const hoy = new Date();
        const diffMs = fechaInicio.getTime() - hoy.getTime();
        diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      }

      let estadoViabilidad: 'asegurado' | 'alerta' | 'critico' = 'alerta';
      if (matriculados >= equilibrio) {
        estadoViabilidad = 'asegurado';
      } else if (deficitAlumnos <= 2 && diasRestantes > 5) {
        estadoViabilidad = 'alerta';
      } else {
        estadoViabilidad = 'critico';
      }

      return {
        proyecto: p,
        matriculados,
        equilibrio,
        brecha,
        deficitAlumnos,
        diasRestantes,
        estadoViabilidad,
      };
    }).sort((a, b) => {
      // Priorizar los más críticos y urgentes primero
      if (a.estadoViabilidad === 'critico' && b.estadoViabilidad !== 'critico') return -1;
      if (a.estadoViabilidad !== 'critico' && b.estadoViabilidad === 'critico') return 1;
      return a.diasRestantes - b.diasRestantes;
    });
  }, [proyectos]);

  const filtrados = proyectosAnalizados.filter((item) => {
    if (filtroEstado === 'todos') return true;
    return item.estadoViabilidad === filtroEstado;
  });

  const conteoAsegurados = proyectosAnalizados.filter((i) => i.estadoViabilidad === 'asegurado').length;
  const conteoAlerta = proyectosAnalizados.filter((i) => i.estadoViabilidad === 'alerta').length;
  const conteoCriticos = proyectosAnalizados.filter((i) => i.estadoViabilidad === 'critico').length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
      
      {/* Encabezado del Semáforo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <span>Semáforo Preventivo "Go / No-Go" (Apertura Segura)</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Punto de Equilibrio Operativo
              </span>
            </h4>
            <p className="text-xs text-slate-500">
              Garantiza que ningún curso inicie con pérdidas antes de pagar al docente y logística
            </p>
          </div>
        </div>

        {/* Filtros Rápidos de Píldora */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFiltroEstado('todos')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              filtroEstado === 'todos'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Todos ({proyectos.length})
          </button>

          <button
            type="button"
            onClick={() => setFiltroEstado('critico')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
              filtroEstado === 'critico'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-700'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            <span>Riesgo No-Go ({conteoCriticos})</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroEstado('alerta')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
              filtroEstado === 'alerta'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            <span>Alerta 1-2 cupos ({conteoAlerta})</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroEstado('asegurado')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
              filtroEstado === 'asegurado'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            <span>Go Asegurado ({conteoAsegurados})</span>
          </button>
        </div>
      </div>

      {/* Tarjetas / Filas de Cursos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtrados.map(({ proyecto: p, matriculados, equilibrio, brecha, deficitAlumnos, diasRestantes, estadoViabilidad }) => {
          const porcentajeEquilibrio = Math.min(100, Math.round((matriculados / Math.max(1, equilibrio)) * 100));

          return (
            <div
              key={p.id}
              className={`rounded-xl p-3.5 border transition-all hover:shadow-md flex flex-col justify-between ${
                estadoViabilidad === 'asegurado'
                  ? 'bg-emerald-50/40 border-emerald-200'
                  : estadoViabilidad === 'alerta'
                  ? 'bg-amber-50/40 border-amber-200'
                  : 'bg-rose-50/50 border-rose-200'
              }`}
            >
              <div>
                {/* Cabecera de la tarjeta */}
                <div className="flex items-start justify-between gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                    estadoViabilidad === 'asegurado'
                      ? 'bg-emerald-600 text-white'
                      : estadoViabilidad === 'alerta'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-rose-600 text-white'
                  }`}>
                    {estadoViabilidad === 'asegurado' && <CheckCircle2 className="w-3 h-3" />}
                    {estadoViabilidad === 'alerta' && <AlertTriangle className="w-3 h-3" />}
                    {estadoViabilidad === 'critico' && <XCircle className="w-3 h-3" />}
                    <span>{estadoViabilidad === 'asegurado' ? 'GO (Viable)' : estadoViabilidad === 'alerta' ? 'Alerta Brecha' : 'Riesgo NO-GO'}</span>
                  </span>

                  <span className="text-[11px] font-bold font-mono text-slate-600 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Inicia: {p.fechaProgramacion || 'Sin fecha'}</span>
                  </span>
                </div>

                {/* Título y Docente */}
                <h5 className="font-bold text-xs text-slate-900 mt-2 line-clamp-2" title={p.nombreProyecto}>
                  {p.nombreProyecto}
                </h5>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Docente: <strong className="text-slate-700">{p.nombreDocente}</strong>
                </p>

                {/* Medidor visual de Punto de Equilibrio */}
                <div className="mt-3 bg-white/80 p-2.5 rounded-lg border border-slate-200/80 space-y-1.5">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-slate-600 font-medium text-[11px]">
                      Matrícula vs. Break-Even:
                    </span>
                    <span className="font-mono font-black text-slate-900">
                      {matriculados} / <span className="text-slate-500">{equilibrio} alumnos</span>
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        estadoViabilidad === 'asegurado'
                          ? 'bg-emerald-500'
                          : estadoViabilidad === 'alerta'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${porcentajeEquilibrio}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-mono">{porcentajeEquilibrio}% cubierto</span>
                    {deficitAlumnos > 0 ? (
                      <span className="font-bold text-rose-700 font-mono">
                        Faltan {deficitAlumnos} alumno{deficitAlumnos > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="font-bold text-emerald-700 font-mono">
                        +{brecha} superávit
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Botones de Acción Inmediata */}
              <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => onMatricularRapido(p)}
                  className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
                  title="Registrar una matrícula exprés directa en este curso"
                >
                  <Zap className="w-3 h-3 fill-amber-300 text-amber-300" />
                  <span>Matricular (+1)</span>
                </button>

                <button
                  type="button"
                  onClick={() => onCotizarWhatsApp(p)}
                  className="py-1.5 px-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
                  title="Abrir cotización y mensaje listo para WhatsApp"
                >
                  <Send className="w-3 h-3 text-emerald-400" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => onEditarProyecto(p)}
                  className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                  title="Editar parámetros comerciales"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
