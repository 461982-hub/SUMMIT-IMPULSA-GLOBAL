import React, { useState } from 'react';
import { ProyectoEducativo, Moneda } from '../../types';
import { formatearMoneda } from '../../utils/calculations';
import { 
  Zap, 
  Send, 
  Upload, 
  Rocket, 
  Search, 
  Users, 
  Target, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Minus,
  Edit3,
  Calendar,
  Layers,
  Sparkles,
  Phone,
  FileText
} from 'lucide-react';
import { CommercialGoNoGoWidget } from './CommercialGoNoGoWidget';

interface CommercialCockpitDailyViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onAbrirMatriculaRapida: (proyecto?: ProyectoEducativo) => void;
  onAbrirCotizadorWhatsApp: (proyecto?: ProyectoEducativo) => void;
  onAbrirImportadorLeads: () => void;
  onAbrirComercializarProyecto: (id?: string) => void;
  onAjustarAlumnosFinales: (proyecto: ProyectoEducativo, delta: number) => void;
  onEditarProyecto: (proyecto: ProyectoEducativo) => void;
  onVerDetalle: (proyecto: ProyectoEducativo) => void;
}

export const CommercialCockpitDailyView: React.FC<CommercialCockpitDailyViewProps> = ({
  proyectos,
  moneda,
  onAbrirMatriculaRapida,
  onAbrirCotizadorWhatsApp,
  onAbrirImportadorLeads,
  onAbrirComercializarProyecto,
  onAjustarAlumnosFinales,
  onEditarProyecto,
  onVerDetalle,
}) => {
  const [busqueda, setBusqueda] = useState('');

  // Filtrado de cursos en la tabla rápida
  const cursosFiltrados = proyectos.filter((p) => {
    return (
      p.nombreProyecto.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.nombreDocente.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.codigoPrograma && p.codigoPrograma.toLowerCase().includes(busqueda.toLowerCase()))
    );
  });

  return (
    <div className="space-y-5">
      
      {/* 1. Barra de Herramientas de Alta Velocidad (Fast-Track Bar) */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-800/40 rounded-2xl p-4 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-xs">
                ⚡ MESA DE OPERACIONES DIARIAS
              </span>
              <span className="text-xs text-emerald-300 font-bold">
                Gestión comercial sin fricción
              </span>
            </div>
            <h3 className="text-lg font-black text-white mt-1">
              Acciones Rápidas en 1 Clic
            </h3>
            <p className="text-xs text-slate-300">
              Registra alumnos al instante, genera cotizaciones con base fiscal SAR y comparte por WhatsApp sin demoras.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onAbrirMatriculaRapida()}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>Matrícula Exprés (30s)</span>
            </button>

            <button
              type="button"
              onClick={() => onAbrirCotizadorWhatsApp()}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Send className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp & Cotizador</span>
            </button>

            <button
              type="button"
              onClick={onAbrirImportadorLeads}
              className="px-3.5 py-2.5 bg-teal-800/80 hover:bg-teal-700 text-white font-bold text-xs rounded-xl border border-teal-600/50 flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4 text-teal-200" />
              <span>Importar Excel</span>
            </button>

            <button
              type="button"
              onClick={() => onAbrirComercializarProyecto()}
              className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl border border-emerald-500/50 flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Rocket className="w-4 h-4 text-amber-300" />
              <span>Comercializar Curso</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Semáforo Preventivo "Go / No-Go" */}
      <CommercialGoNoGoWidget
        proyectos={proyectos}
        moneda={moneda}
        onMatricularRapido={(p) => onAbrirMatriculaRapida(p)}
        onCotizarWhatsApp={(p) => onAbrirCotizadorWhatsApp(p)}
        onEditarProyecto={onEditarProyecto}
      />

      {/* 3. Tabla Operativa de Cursos en Captación Rápida */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <span>Catálogo Activo para Cierre y Matrículas</span>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {proyectos.length} Cursos
              </span>
            </h4>
            <p className="text-xs text-slate-500">
              Ajusta alumnos en 1 clic (+ / -) y comparte propuestas al instante
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar curso, docente o código..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-2.5">Código & Curso</th>
                <th className="p-2.5">Docente</th>
                <th className="p-2.5">Fecha Inicio</th>
                <th className="p-2.5 text-center">Matrícula vs. Break-Even</th>
                <th className="p-2.5 text-right">Inversión Alumno</th>
                <th className="p-2.5 text-center">Ajuste Rápido</th>
                <th className="p-2.5 text-right">Acciones Directas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cursosFiltrados.map((p) => {
                const matriculados = p.alumnosFinal || 0;
                const meta = p.alumnosProyectados || 15;
                const equilibrio = p.puntoEquilibrioAlumnos || 5;
                const estaCubierto = matriculados >= equilibrio;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-2.5 max-w-[240px]">
                      {p.codigoPrograma && (
                        <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mr-1.5">
                          {p.codigoPrograma}
                        </span>
                      )}
                      <span className="font-bold text-slate-900 block truncate" title={p.nombreProyecto}>
                        {p.nombreProyecto}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {p.tipoProyecto} • {p.modalidadEntrega || 'Virtual'}
                      </span>
                    </td>

                    <td className="p-2.5 text-slate-700">
                      <span className="font-medium block truncate max-w-[140px]">{p.nombreDocente}</span>
                      <span className="text-[10px] text-slate-400">{p.horasClase || 12} horas</span>
                    </td>

                    <td className="p-2.5 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      {p.fechaProgramacion || 'Por definir'}
                    </td>

                    <td className="p-2.5 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className={`font-mono font-black text-xs px-2 py-0.5 rounded-full border ${
                          estaCubierto
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}>
                          {matriculados} / {meta} (Eq: {equilibrio})
                        </span>
                        <span className="text-[9px] text-slate-400 mt-0.5">
                          {estaCubierto ? '🟢 Viable' : `🔴 Faltan ${Math.max(0, equilibrio - matriculados)}`}
                        </span>
                      </div>
                    </td>

                    <td className="p-2.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      <div>{formatearMoneda(p.precioSugeridoAlumno, moneda)}</div>
                      {p.precioEarlyBird && (
                        <div className="text-[10px] text-emerald-600 font-normal">
                          EB: {formatearMoneda(p.precioEarlyBird, moneda)}
                        </div>
                      )}
                    </td>

                    {/* Ajuste rápido + / - */}
                    <td className="p-2.5 text-center">
                      <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => onAjustarAlumnosFinales(p, -1)}
                          className="w-5 h-5 rounded bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer"
                          title="Restar 1 alumno"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono font-black text-xs px-1 text-slate-800">
                          {matriculados}
                        </span>
                        <button
                          type="button"
                          onClick={() => onAjustarAlumnosFinales(p, 1)}
                          className="w-5 h-5 rounded bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer"
                          title="Sumar 1 alumno (+1)"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* Botones de acción directa */}
                    <td className="p-2.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onAbrirMatriculaRapida(p)}
                          className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-2xs"
                          title="Matrícula Exprés (Formulario rápido)"
                        >
                          <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onAbrirCotizadorWhatsApp(p)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors shadow-2xs"
                          title="Generar mensaje para WhatsApp y cotización oficial"
                        >
                          <Send className="w-3.5 h-3.5 text-emerald-400" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onVerDetalle(p)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                          title="Ver ficha completa"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onEditarProyecto(p)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                          title="Editar parámetros comerciales"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
