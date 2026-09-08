import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ProyectoEducativo } from '../types';
import {
  SmartProjectSearchBar,
  coincideBusquedaInteligente,
  normalizarTexto,
  CriterioBusqueda
} from './SmartProjectSearchBar';

export { coincideBusquedaInteligente, normalizarTexto };
export type { CriterioBusqueda };

export interface ProjectQuickFilterBarProps {
  proyectos: ProyectoEducativo[];
  busqueda: string;
  onBusquedaChange: (valor: string) => void;
  filtroTipo: string;
  onFiltroTipoChange: (tipo: string) => void;
  filtroDocente: string;
  onFiltroDocenteChange: (docente: string) => void;
  filtroEstado?: string;
  onFiltroEstadoChange?: (estado: string) => void;
  totalFiltrados: number;
  onLimpiarFiltros: () => void;
  onIrAMatriz?: () => void;
  mostrarBotonIrAMatriz?: boolean;
  className?: string;
  modoCompacto?: boolean;
  criterioActivo?: CriterioBusqueda;
  onCriterioActivoChange?: (criterio: CriterioBusqueda) => void;
}

// Función auxiliar para normalizar y verificar coincidencia de tipos
export const coincideTipoProyecto = (p: ProyectoEducativo, tipoFiltro: string): boolean => {
  if (tipoFiltro === 'todos') return true;
  const pTipo = (p.tipoProyecto || '').toUpperCase();
  const fTipo = tipoFiltro.toUpperCase();

  if (pTipo === fTipo) return true;
  if (fTipo === 'CURSO' && (pTipo.includes('CURSO') || pTipo.includes('EDUCATIVOS NO ACREDITADOS'))) return true;
  if (fTipo === 'TALLER' && pTipo.includes('TALLER')) return true;
  if (fTipo === 'DIPLOMADO' && pTipo.includes('DIPLOMADO')) return true;
  if (fTipo === 'BOOTCAMP' && pTipo.includes('BOOTCAMP')) return true;
  if (fTipo === 'MASTERCLASS' && pTipo.includes('MASTERCLASS')) return true;
  if (fTipo === 'SEMINARIO' && pTipo.includes('SEMINARIO')) return true;
  if (fTipo === 'CONSULTORIA' && pTipo.includes('CONSULTOR')) return true;
  if (fTipo === 'MENTORIA' && (pTipo.includes('MENTOR') || pTipo.includes('CAPACITACIÓN PROFESIONAL'))) return true;

  return pTipo.includes(fTipo);
};

export const ProjectQuickFilterBar: React.FC<ProjectQuickFilterBarProps> = ({
  proyectos,
  busqueda,
  onBusquedaChange,
  filtroTipo,
  onFiltroTipoChange,
  filtroDocente,
  onFiltroDocenteChange,
  filtroEstado = 'todos',
  onFiltroEstadoChange,
  totalFiltrados,
  onLimpiarFiltros,
  onIrAMatriz,
  mostrarBotonIrAMatriz = false,
  className = '',
  criterioActivo,
  onCriterioActivoChange,
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <SmartProjectSearchBar
        proyectos={proyectos}
        busqueda={busqueda}
        onBusquedaChange={onBusquedaChange}
        filtroTipo={filtroTipo}
        onFiltroTipoChange={onFiltroTipoChange}
        filtroDocente={filtroDocente}
        onFiltroDocenteChange={onFiltroDocenteChange}
        filtroEstado={filtroEstado}
        onFiltroEstadoChange={onFiltroEstadoChange}
        totalFiltrados={totalFiltrados}
        onLimpiarFiltros={onLimpiarFiltros}
        criterioActivo={criterioActivo}
        onCriterioActivoChange={onCriterioActivoChange}
        placeholder="Buscar por nombre de curso, docente o tipo de programa..."
      />

      {mostrarBotonIrAMatriz && onIrAMatriz && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onIrAMatriz}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-purple-900 hover:bg-purple-950 rounded-xl shadow-2xs transition-all cursor-pointer group"
            title="Ir a la Matriz Maestra con estos filtros aplicados"
          >
            <span>Ver en Matriz Maestra</span>
            <ArrowRight className="w-3.5 h-3.5 text-purple-300 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
};
