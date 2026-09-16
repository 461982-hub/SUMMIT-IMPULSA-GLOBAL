import React from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Rocket, 
  ArrowRight,
  Sparkles,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { ProyectoEducativo } from '../../types';
import { calcularSlaComercial } from '../../utils/commercialSlaUtils';
import { formatearMoneda } from '../../utils/calculations';

interface CommercialSlaWidgetProps {
  proyecto: ProyectoEducativo;
  onIniciarCurso?: (p: ProyectoEducativo) => void;
  onAbrirMatricula?: (p: ProyectoEducativo) => void;
  modoCompacto?: boolean;
}

export const CommercialSlaWidget: React.FC<CommercialSlaWidgetProps> = ({
  proyecto,
  onIniciarCurso,
  onAbrirMatricula,
  modoCompacto = false,
}) => {
  const sla = calcularSlaComercial(proyecto);

  if (modoCompacto) {
    return (
      <div className="bg-gradient-to-r from-slate-50 to-indigo-50/50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-xs">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <span>SLA: 25 Días Hábiles</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${sla.colorBadge}`}>
                {sla.estadoEtiqueta}
              </span>
            </div>
            <div className="text-slate-500 text-[11px] mt-0.5">
              GG usó {sla.diasUsadosGG}/5d • Comercialización tiene {sla.diasAsignadosComercial}d ({sla.diasRestantesComercial}d restantes)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold">
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span className={sla.cupoMinimoCubierto ? 'text-emerald-700' : 'text-amber-700'}>
              {sla.alumnosMatriculados}/6 Alumnos
            </span>
          </div>

          {sla.cupoMinimoCubierto && !sla.cursoIniciadoComercial && onIniciarCurso && (
            <button
              type="button"
              onClick={() => onIniciarCurso(proyecto)}
              className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-lg shadow-xs transition-all cursor-pointer animate-pulse text-xs"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>Comenzar Curso</span>
            </button>
          )}

          {onAbrirMatricula && (
            <button
              type="button"
              onClick={() => onAbrirMatricula(proyecto)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-lg shadow-xs transition-all cursor-pointer text-xs"
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Matricular</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs transition-all">
      {/* Encabezado del Widget */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Control de Plazo Institucional (25 Días Hábiles) & Matrícula
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${sla.colorBadge}`}>
                {sla.estadoEtiqueta}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Flujo oficial: Gerencia Académica ➔ Gerencia General ➔ Comercialización ➔ Retorno a GG para Rebaja del POA.
            </p>
          </div>
        </div>

        {/* Indicador de Facturación que rebajará el POA */}
        <div className="text-right bg-indigo-50/60 border border-indigo-100 px-3.5 py-1.5 rounded-xl">
          <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-700 block">
            Impacto POA 2026
          </span>
          <span className="text-sm font-black text-indigo-950">
            {formatearMoneda(sla.montoRebajaPOAHNL, 'LPS')}
          </span>
        </div>
      </div>

      {/* Grid de Desglose de Tiempos y Alumnos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Tarjeta 1: Desglose del Plazo de 25 Días Hábiles */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                Cronómetro de 25 Días Hábiles
              </span>
              <span className="text-[11px] font-extrabold text-slate-500">
                Creado: {sla.fechaCreacionFormateada}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {/* Etapa GG */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/60">
                <span className="text-slate-600">Revisión Gerencia General (Máx 5d):</span>
                <span className="font-bold text-slate-900">
                  {sla.diasUsadosGG} de 5 días hábiles
                </span>
              </div>

              {/* Bonificación por rapidez de GG */}
              {sla.diasAhorradosGG > 0 && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
                  <span className="flex items-center gap-1 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Ahorro de GG transferido:
                  </span>
                  <span className="font-black text-emerald-700">
                    +{sla.diasAhorradosGG} días hábiles extra
                  </span>
                </div>
              )}

              {/* Tiempo Asignado a Comercialización */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-indigo-50/70 border border-indigo-200 text-indigo-900">
                <span className="font-medium">Total para Comercialización (25 - GG):</span>
                <span className="font-black text-indigo-800">
                  {sla.diasAsignadosComercial} días hábiles ({sla.diasRestantesComercial}d restantes)
                </span>
              </div>
            </div>
          </div>

          {/* Barra de progreso de tiempo comercial */}
          <div className="mt-3 pt-2 border-t border-slate-200/60">
            <div className="flex items-center justify-between text-[11px] mb-1 font-medium text-slate-500">
              <span>Tiempo consumido comercialización</span>
              <span>{sla.porcentajeTiempoConsumido}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  sla.porcentajeTiempoConsumido > 80 ? 'bg-rose-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${sla.porcentajeTiempoConsumido}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tarjeta 2: Umbral de Matrícula (Mínimo 6 Alumnos) */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-600" />
                Matrícula de Alumnos (Meta: 6 Alumnos)
              </span>
              <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                sla.cupoMinimoCubierto ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {sla.alumnosMatriculados} / 6 Inscritos
              </span>
            </div>

            {/* Estado del cupo */}
            {sla.cupoMinimoCubierto ? (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 mb-2">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>¡Cupo Mínimo de 6 Alumnos Cubierto con Éxito!</span>
                </div>
                <p className="text-[11px] text-emerald-700 mt-1">
                  Comercialización puede formalizar el inicio del curso y trasladar a Gerencia General para rebaja del POA.
                </p>
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 mb-2">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Faltan {sla.alumnosFaltantes} alumnos para iniciar</span>
                </div>
                <p className="text-[11px] text-amber-700 mt-1">
                  Continúa la captación y pauta en redes sociales para alcanzar el umbral obligatorio de 6 inscritos.
                </p>
              </div>
            )}

            {/* Barra de progreso de alumnos */}
            <div className="mt-2">
              <div className="flex items-center justify-between text-[11px] mb-1 font-medium text-slate-500">
                <span>Progreso hacia el mínimo de 6</span>
                <span>{sla.porcentajeAlumnosMeta}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    sla.cupoMinimoCubierto ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${sla.porcentajeAlumnosMeta}%` }}
                />
              </div>
            </div>
          </div>

          {/* Acciones de Matrícula e Inicio */}
          <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-end gap-2">
            {onAbrirMatricula && (
              <button
                type="button"
                onClick={() => onAbrirMatricula(proyecto)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-lg shadow-xs transition-all cursor-pointer text-xs"
              >
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>Gestionar Matrícula</span>
              </button>
            )}

            {/* Botón Principal: Comenzar Curso (Habilitado inmediatamente al alcanzar >= 6 alumnos) */}
            {sla.cupoMinimoCubierto && !sla.cursoIniciadoComercial && onIniciarCurso && (
              <button
                type="button"
                onClick={() => onIniciarCurso(proyecto)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer animate-pulse text-xs"
              >
                <Rocket className="w-4 h-4 text-emerald-200" />
                <span>Comenzar Curso y Remitir a GG</span>
                <ArrowRight className="w-3.5 h-3.5 text-white/80" />
              </button>
            )}

            {sla.cursoIniciadoComercial && !sla.aprobadoFinalPOA && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-800 font-bold rounded-lg text-xs border border-purple-200">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                <span>Enviado a GG para Rebaja del POA</span>
              </span>
            )}

            {sla.aprobadoFinalPOA && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs border border-emerald-300">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Inicio Aprobado y Rebajado del POA</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
