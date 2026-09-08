import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Target, 
  Calendar, 
  ArrowRight, 
  Sparkles, 
  Filter, 
  Lightbulb, 
  Calculator,
  Flame,
  Check,
  Zap,
  Info,
  FileText,
  PlusCircle
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../types';
import { formatearMoneda } from '../utils/calculations';
import { SummitLogo } from './SummitLogo';

interface ProfitabilityControlCenterProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onEditar: (p: ProyectoEducativo) => void;
  onVerDetalle: (p: ProyectoEducativo) => void;
  onActualizarRapido: (id: string, campo: keyof ProyectoEducativo, valor: any) => void;
  onExportarPDF?: (p: ProyectoEducativo) => void;
}

export type NivelSalud = 'critico' | 'en_riesgo' | 'en_meta' | 'superada';

export interface DiagnosticoProyecto {
  proyecto: ProyectoEducativo;
  salud: NivelSalud;
  alumnosFaltantesPuntoEquilibrio: number;
  alumnosFaltantesMeta: number;
  porcentajeCumplimientoMeta: number;
  margenRealEfectivo: number;
  diasRestantes?: number;
  recomendacion: string;
  accionSugerida: string;
}

export const ProfitabilityControlCenter: React.FC<ProfitabilityControlCenterProps> = ({
  proyectos,
  moneda,
  onEditar,
  onVerDetalle,
  onActualizarRapido,
  onExportarPDF,
}) => {
  const [filtroSalud, setFiltroSalud] = useState<'todos' | NivelSalud>('todos');

  // Calculadora de Meta Inversa de Rentabilidad
  const [metaGananciaDeseada, setMetaGananciaDeseada] = useState<number>(5000);
  const [costoOperativoEstimado, setCostoOperativoEstimado] = useState<number>(4500);
  const [precioTicketEstimado, setPrecioTicketEstimado] = useState<number>(1500);

  // Diagnóstico Financiero de cada proyecto
  const diagnosticos: DiagnosticoProyecto[] = useMemo(() => {
    const hoy = new Date();
    
    return proyectos.map((p) => {
      const pe = p.puntoEquilibrioAlumnos;
      const alumnos = p.alumnosFinal;
      const meta = p.alumnosProyectados;
      
      let salud: NivelSalud = 'critico';
      let recomendacion = '';
      let accionSugerida = '';

      const faltantesPE = Math.max(0, pe - alumnos);
      const faltantesMeta = Math.max(0, meta - alumnos);
      const cumplimiento = meta > 0 ? (alumnos / meta) * 100 : 0;
      const margenReal = p.gastoTotalOperativo > 0 
        ? (p.totalGananciasFinales / p.gastoTotalOperativo) * 100 
        : 0;

      // Calcular días restantes de venta
      let diasRestantes: number | undefined = undefined;
      if (p.fechaVenta) {
        const fVenta = new Date(p.fechaVenta);
        const diffTime = fVenta.getTime() - hoy.getTime();
        diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      if (alumnos < pe) {
        salud = 'critico';
        recomendacion = `Déficit operativo: faltan ${faltantesPE} alumno(s) para no perder dinero. La pérdida actual es de ${formatearMoneda(Math.abs(p.totalGananciasFinales), moneda)}.`;
        accionSugerida = diasRestantes !== undefined && diasRestantes > 0
          ? `Lanzar promoción de última hora o contactar lista de espera. Quedan ${diasRestantes} días para el cierre.`
          : 'Evaluar reprogramar fecha de inicio o cancelar el grupo para no incurrir en costos fijos.';
      } else if (alumnos === pe && pe < meta) {
        salud = 'en_riesgo';
        recomendacion = `En punto de equilibrio exacto. Se cubren los costos pero la ganancia neta es ${formatearMoneda(p.totalGananciasFinales, moneda)} (0% utilidad).`;
        accionSugerida = `Conseguir al menos ${faltantesMeta} alumno(s) más para alcanzar el margen proyectado del ${p.margenGananciaOperativa}%.`;
      } else if (alumnos >= pe && alumnos < meta) {
        salud = 'en_riesgo';
        recomendacion = `Proyecto rentable pero por debajo del margen objetivo (${cumplimiento.toFixed(0)}% de la meta). Ganancia actual: ${formatearMoneda(p.totalGananciasFinales, moneda)}.`;
        accionSugerida = `Faltan ${faltantesMeta} alumno(s) para completar la meta de ganancia prevista (${formatearMoneda(p.gananciaOperativa, moneda)}).`;
      } else if (alumnos === meta) {
        salud = 'en_meta';
        recomendacion = `Meta financiera alcanzada con precisión. Margen operativo del ${p.margenGananciaOperativa}% asegurado (+${formatearMoneda(p.gananciaOperativa, moneda)}).`;
        accionSugerida = 'Confirmar inicio y logística. Cada alumno adicional a partir de ahora aportará 100% de utilidad neta.';
      } else {
        salud = 'superada';
        const alumnosExtra = alumnos - meta;
        recomendacion = `¡Excelente rentabilidad! Superó la meta con +${alumnosExtra} alumno(s) extra, logrando un ROI real del ${margenReal.toFixed(1)}%.`;
        accionSugerida = `Proyecto de alto rendimiento. Se recomienda replicar el formato, crear nivel avanzado o abrir un segundo horario.`;
      }

      return {
        proyecto: p,
        salud,
        alumnosFaltantesPuntoEquilibrio: faltantesPE,
        alumnosFaltantesMeta: faltantesMeta,
        porcentajeCumplimientoMeta: cumplimiento,
        margenRealEfectivo: margenReal,
        diasRestantes,
        recomendacion,
        accionSugerida,
      };
    });
  }, [proyectos, moneda]);

  // Conteo por estado de salud
  const conteoSalud = useMemo(() => {
    return {
      critico: diagnosticos.filter((d) => d.salud === 'critico').length,
      en_riesgo: diagnosticos.filter((d) => d.salud === 'en_riesgo').length,
      en_meta: diagnosticos.filter((d) => d.salud === 'en_meta').length,
      superada: diagnosticos.filter((d) => d.salud === 'superada').length,
      total: diagnosticos.length,
    };
  }, [diagnosticos]);

  const diagnosticosFiltrados = useMemo(() => {
    if (filtroSalud === 'todos') return diagnosticos;
    return diagnosticos.filter((d) => d.salud === filtroSalud);
  }, [diagnosticos, filtroSalud]);

  // Cálculo inverso de Meta de Ganancia
  const alumnosNecesariosParaMeta = precioTicketEstimado > 0 
    ? Math.ceil((costoOperativoEstimado + metaGananciaDeseada) / precioTicketEstimado)
    : 0;

  const precioSugeridoParaMeta = 4 > 0 // asumiendo 4 alumnos base
    ? (costoOperativoEstimado + metaGananciaDeseada) / 4
    : 0;

  return (
    <div className="space-y-6">
      
      {/* Encabezado del Centro de Control */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-200 shrink-0">
            <SummitLogo variant="icon" size="sm" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-800 font-sans tracking-wide">SUMMIT IMPULSA GLOBAL</span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                Auditoría en Vivo
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Tablero de Control de Rentabilidad & Semáforo Financiero
            </h2>
            <p className="text-xs text-slate-500">
              Supervisión preventiva para asegurar utilidades, evitar pérdidas y monitorear el punto de equilibrio
            </p>
          </div>
        </div>

        {/* Indicador de Tasa de Salud General */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Efectividad Rentable</span>
            <span className="text-base font-black text-slate-900 font-mono">
              {conteoSalud.total > 0 
                ? (((conteoSalud.en_meta + conteoSalud.superada) / conteoSalud.total) * 100).toFixed(0)
                : 0}%
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
            {conteoSalud.en_meta + conteoSalud.superada}/{conteoSalud.total}
          </div>
        </div>
      </div>

      {/* Semáforo de Control Rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* 1. Superada */}
        <button
          onClick={() => setFiltroSalud(filtroSalud === 'superada' ? 'todos' : 'superada')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            filtroSalud === 'superada'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400'
              : 'bg-white hover:bg-emerald-50/50 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${
              filtroSalud === 'superada' ? 'text-emerald-100' : 'text-emerald-700'
            }`}>
              Meta Superada
            </span>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              filtroSalud === 'superada' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-700'
            }`}>
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono mt-1">
            {conteoSalud.superada}
          </div>
          <span className={`text-[10px] block mt-0.5 ${
            filtroSalud === 'superada' ? 'text-emerald-100' : 'text-slate-500'
          }`}>
            Utilidad extra generada
          </span>
        </button>

        {/* 2. En Meta */}
        <button
          onClick={() => setFiltroSalud(filtroSalud === 'en_meta' ? 'todos' : 'en_meta')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            filtroSalud === 'en_meta'
              ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-400'
              : 'bg-white hover:bg-blue-50/50 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${
              filtroSalud === 'en_meta' ? 'text-blue-100' : 'text-blue-700'
            }`}>
              En Meta
            </span>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              filtroSalud === 'en_meta' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono mt-1">
            {conteoSalud.en_meta}
          </div>
          <span className={`text-[10px] block mt-0.5 ${
            filtroSalud === 'en_meta' ? 'text-blue-100' : 'text-slate-500'
          }`}>
            Margen 100% cumplido
          </span>
        </button>

        {/* 3. En Riesgo */}
        <button
          onClick={() => setFiltroSalud(filtroSalud === 'en_riesgo' ? 'todos' : 'en_riesgo')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            filtroSalud === 'en_riesgo'
              ? 'bg-amber-600 text-white border-amber-700 shadow-md ring-2 ring-amber-400'
              : 'bg-white hover:bg-amber-50/50 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${
              filtroSalud === 'en_riesgo' ? 'text-amber-100' : 'text-amber-700'
            }`}>
              En Riesgo
            </span>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              filtroSalud === 'en_riesgo' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-700'
            }`}>
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono mt-1">
            {conteoSalud.en_riesgo}
          </div>
          <span className={`text-[10px] block mt-0.5 ${
            filtroSalud === 'en_riesgo' ? 'text-amber-100' : 'text-slate-500'
          }`}>
            Cubre costos, bajo margen
          </span>
        </button>

        {/* 4. Crítico / Pérdida */}
        <button
          onClick={() => setFiltroSalud(filtroSalud === 'critico' ? 'todos' : 'critico')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            filtroSalud === 'critico'
              ? 'bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-400'
              : 'bg-white hover:bg-rose-50/50 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${
              filtroSalud === 'critico' ? 'text-rose-100' : 'text-rose-700'
            }`}>
              Crítico (Pérdida)
            </span>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              filtroSalud === 'critico' ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-700'
            }`}>
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono mt-1">
            {conteoSalud.critico}
          </div>
          <span className={`text-[10px] block mt-0.5 ${
            filtroSalud === 'critico' ? 'text-rose-100' : 'text-slate-500'
          }`}>
            Alumnos &lt; Punto Equilibrio
          </span>
        </button>

      </div>

      {/* Lista de Diagnóstico y Control de Acciones */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Evaluación & Acciones de Control por Proyecto ({diagnosticosFiltrados.length})
            </h3>
            {filtroSalud !== 'todos' && (
              <button
                onClick={() => setFiltroSalud('todos')}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                (Mostrar todos)
              </button>
            )}
          </div>
        </div>

        {proyectos.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-dashed border-slate-300 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800">
              Control 360° en espera de programas
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              La creación y alta curricular de nuevos proyectos se realiza exclusivamente desde el módulo <strong>1. Gerencia Académica</strong>.
            </p>
          </div>
        ) : diagnosticosFiltrados.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
            No hay proyectos con el estado de salud seleccionado.
          </div>
        ) : (
          <div className="space-y-3">
            {diagnosticosFiltrados.map((item) => {
              const p = item.proyecto;
              const esCritico = item.salud === 'critico';
              const esRiesgo = item.salud === 'en_riesgo';
              const esSuperada = item.salud === 'superada';
              
              return (
                <div
                  key={p.id}
                  id={`control-card-${p.id}`}
                  className={`bg-white rounded-xl border p-4 sm:p-5 shadow-xs transition-all ${
                    esCritico
                      ? 'border-rose-300 bg-rose-50/20'
                      : esRiesgo
                      ? 'border-amber-300 bg-amber-50/20'
                      : esSuperada
                      ? 'border-emerald-300 bg-emerald-50/10'
                      : 'border-blue-200'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    
                    {/* Info Básica del Proyecto */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          esCritico 
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : esRiesgo
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : esSuperada
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {item.salud === 'critico' && '🔴 Riesgo de Pérdida'}
                          {item.salud === 'en_riesgo' && '🟡 En Umbral / Riesgo'}
                          {item.salud === 'en_meta' && '🔵 Meta Cumplida'}
                          {item.salud === 'superada' && '🟢 Alta Rentabilidad'}
                        </span>

                        <span className="text-xs font-semibold text-slate-500">
                          {p.tipoProyecto} • {p.nivel}
                        </span>

                        <span className="text-xs text-slate-400">
                          Docente: <strong className="text-slate-700">{p.nombreDocente}</strong>
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900">
                        {p.nombreProyecto}
                      </h4>

                      {/* Barra de Progreso de Alumnos vs Meta y Punto de Equilibrio */}
                      <div className="pt-2 max-w-xl">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-500" />
                            Inscritos: <strong className="font-mono">{p.alumnosFinal}</strong> de <span className="font-mono text-slate-500">{p.alumnosProyectados} meta</span>
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            Punto de Equilibrio: <strong>{p.puntoEquilibrioAlumnos} alumnos</strong>
                          </span>
                        </div>

                        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden flex">
                          {/* Segmento cubierto */}
                          <div
                            className={`h-full rounded-full transition-all ${
                              esCritico ? 'bg-rose-500' : esRiesgo ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{
                              width: `${Math.min(100, item.porcentajeCumplimientoMeta)}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Diagnóstico y Recomendación de Acción */}
                      <div className="pt-2 space-y-1">
                        <p className="text-xs text-slate-700 font-medium">
                          <strong>Diagnóstico:</strong> {item.recomendacion}
                        </p>
                        <div className="flex items-start gap-1.5 text-xs text-slate-600 bg-white/80 p-2 rounded-lg border border-slate-200/80">
                          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <span>
                            <strong>Acción de Control Sugerida:</strong> {item.accionSugerida}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Métricas Financieras & Control de Acciones */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-200">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Resultado Financiero
                        </span>
                        <div className={`text-xl font-black font-mono ${
                          p.totalGananciasFinales >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {formatearMoneda(p.totalGananciasFinales, moneda)}
                        </div>
                        <span className="text-[11px] text-slate-500 block">
                          Gasto Operativo: {formatearMoneda(p.gastoTotalOperativo, moneda)}
                        </span>
                      </div>

                      {/* Ajuste Rápido de Alumnos & Botones */}
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center bg-slate-100 border border-slate-300 rounded-lg px-2 py-1 text-xs">
                          <span className="text-slate-500 mr-1 text-[11px]">Alumnos:</span>
                          <button
                            onClick={() => onActualizarRapido(p.id, 'alumnosFinal', Math.max(0, p.alumnosFinal - 1))}
                            className="w-5 h-5 rounded bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center border border-slate-300"
                            title="Restar 1 alumno"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold px-2 text-slate-900">{p.alumnosFinal}</span>
                          <button
                            onClick={() => onActualizarRapido(p.id, 'alumnosFinal', p.alumnosFinal + 1)}
                            className="w-5 h-5 rounded bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center border border-slate-300"
                            title="Sumar 1 alumno"
                          >
                            +
                          </button>
                        </div>

                        {onExportarPDF && (
                          <button
                            onClick={() => onExportarPDF(p)}
                            className="px-2.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1"
                            title="Exportar Reporte Ejecutivo PDF"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">PDF</span>
                          </button>
                        )}
                        <button
                          onClick={() => onVerDetalle(p)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg"
                        >
                          Simular
                        </button>
                        <button
                          onClick={() => onEditar(p)}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                        >
                          Editar
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Herramienta de Planificación: Calculadora Inversa de Metas de Rentabilidad */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Calculadora Inversa de Metas de Ganancia
              </h3>
              <p className="text-xs text-slate-500">
                Define cuánto deseas ganar y la herramienta calculará los alumnos requeridos o el precio óptimo del ticket
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
            Control Preventivo
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              1. Ganancia Neta Deseada ({moneda})
            </label>
            <input
              type="number"
              min="0"
              step="500"
              value={metaGananciaDeseada}
              onChange={(e) => setMetaGananciaDeseada(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <span className="text-[10px] text-slate-400">Utilidad que quieres llevarte limpia</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              2. Gasto Operativo Estimado ({moneda})
            </label>
            <input
              type="number"
              min="0"
              step="500"
              value={costoOperativoEstimado}
              onChange={(e) => setCostoOperativoEstimado(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <span className="text-[10px] text-slate-400">Docente + Zoom + Materiales</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              3. Precio Ticket que el Mercado Paga ({moneda})
            </label>
            <input
              type="number"
              min="100"
              step="100"
              value={precioTicketEstimado}
              onChange={(e) => setPrecioTicketEstimado(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <span className="text-[10px] text-slate-400">Precio de venta por alumno</span>
          </div>
        </div>

        {/* Resultados del Cálculo Inverso */}
        <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-purple-800 font-semibold block">Facturación Total Necesaria:</span>
            <span className="text-lg font-black text-purple-950 font-mono">
              {formatearMoneda(costoOperativoEstimado + metaGananciaDeseada, moneda)}
            </span>
            <span className="text-[10px] text-purple-700 block">Cubre {formatearMoneda(costoOperativoEstimado, moneda)} de costo</span>
          </div>

          <div>
            <span className="text-purple-800 font-semibold block">Alumnos Necesarios (a {formatearMoneda(precioTicketEstimado, moneda)}):</span>
            <span className="text-lg font-black text-purple-950 font-mono">
              {alumnosNecesariosParaMeta} alumnos
            </span>
            <span className="text-[10px] text-purple-700 block">Mínimo para asegurar tu ganancia</span>
          </div>

          <div>
            <span className="text-purple-800 font-semibold block">O si tienes solo 4 alumnos, cobrar:</span>
            <span className="text-lg font-black text-purple-950 font-mono">
              {formatearMoneda(precioSugeridoParaMeta, moneda)} / alum.
            </span>
            <span className="text-[10px] text-purple-700 block">Precio por cupo con grupo de 4</span>
          </div>
        </div>
      </div>

    </div>
  );
};
