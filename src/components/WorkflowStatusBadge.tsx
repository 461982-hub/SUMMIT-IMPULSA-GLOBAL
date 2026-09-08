import React from 'react';
import { 
  GraduationCap, 
  Megaphone, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { ProyectoEducativo } from '../types';
import { 
  obtenerNivelFlujo, 
  calcularTiempoTranscurrido, 
  validarAprobacionGerenciaGeneral 
} from '../utils/workflowUtils';

interface WorkflowStatusBadgeProps {
  proyecto: ProyectoEducativo;
  onClick?: () => void;
  mostrarTiempo?: boolean;
  tamano?: 'compacto' | 'normal' | 'grande';
  className?: string;
}

export const WorkflowStatusBadge: React.FC<WorkflowStatusBadgeProps> = ({
  proyecto,
  onClick,
  mostrarTiempo = true,
  tamano = 'normal',
  className = '',
}) => {
  const infoNivel = obtenerNivelFlujo(proyecto);
  const tiempoInfo = calcularTiempoTranscurrido(proyecto.fechaCreacion || proyecto.fechaProgramacion);
  const validacion = validarAprobacionGerenciaGeneral(proyecto);

  const getIcono = () => {
    if (infoNivel.tituloCorto === 'No se llevó a cabo') {
      return <AlertCircle className="w-3.5 h-3.5 text-rose-700" />;
    }
    switch (infoNivel.nivel) {
      case 1:
        return <GraduationCap className="w-3.5 h-3.5 text-blue-700" />;
      case 2:
        return <Megaphone className="w-3.5 h-3.5 text-emerald-700" />;
      case 3:
        return <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />;
      case 4:
        return <CheckCircle2 className="w-3.5 h-3.5 text-indigo-700" />;
    }
  };

  const badgeEstilos = () => {
    if (infoNivel.tituloCorto === 'No se llevó a cabo') {
      return 'bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100';
    }
    switch (infoNivel.nivel) {
      case 1:
        return 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100';
      case 2:
        return 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100';
      case 3:
        return 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100';
      case 4:
        return 'bg-indigo-50 text-indigo-950 border-indigo-200 hover:bg-indigo-100';
    }
  };

  if (tamano === 'compacto') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer select-none ${badgeEstilos()} ${className}`}
        title={`Ver Nivel del Proyecto: ${infoNivel.titulo} • Clic para auditar flujo`}
      >
        {getIcono()}
        <span>N{infoNivel.nivel}: {infoNivel.tituloCorto}</span>
        {mostrarTiempo && tiempoInfo.texto && (
          <span className="text-[9px] opacity-75 font-mono">({tiempoInfo.texto})</span>
        )}
      </button>
    );
  }

  if (tamano === 'grande') {
    return (
      <div 
        onClick={onClick}
        className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all ${badgeEstilos()} ${onClick ? 'cursor-pointer hover:shadow-xs' : ''} ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-white/80 shadow-2xs">
            {getIcono()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider">
                {infoNivel.titulo}
              </span>
              {!validacion.puedeAprobar && infoNivel.nivel === 3 && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-amber-200/80 text-amber-950 px-1.5 py-0.2 rounded-full font-bold">
                  <AlertCircle className="w-2.5 h-2.5" />
                  Pendiente firmas
                </span>
              )}
            </div>
            <p className="text-[11px] opacity-80 mt-0.5 line-clamp-1">
              {infoNivel.descripcion}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-xs">
          {mostrarTiempo && (
            <div className="flex items-center gap-1 font-mono text-[11px] bg-white/70 px-2 py-1 rounded-md border border-black/5">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>{tiempoInfo.texto}</span>
            </div>
          )}
          {onClick && (
            <span className="text-[11px] font-bold underline flex items-center gap-0.5">
              <span>Auditar flujo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer select-none ${badgeEstilos()} ${className}`}
      title={`Nivel actual: ${infoNivel.titulo}. Haz clic para ver auditoría de cumplimiento y tiempos.`}
    >
      {getIcono()}
      <span>{infoNivel.tituloCorto}</span>
      {mostrarTiempo && tiempoInfo.texto && (
        <span className="inline-flex items-center gap-0.5 text-[10px] opacity-75 font-mono ml-0.5">
          <Clock className="w-2.5 h-2.5" />
          <span>{tiempoInfo.texto}</span>
        </span>
      )}
    </button>
  );
};
