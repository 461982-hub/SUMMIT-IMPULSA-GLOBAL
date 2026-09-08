import React, { useMemo } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Sparkles, 
  Layers, 
  Clock, 
  HelpCircle,
  Copy
} from 'lucide-react';
import { NivelProyecto, ProyectoEducativo } from '../../types';
import { obtenerConfiguracionHorasPorNivel } from '../../utils/curricularUtils';

interface CurricularCoherenceAlertsProps {
  nombreCurso?: string;
  nivel: NivelProyecto;
  cantidadTemas: number;
  horasPorTema: number;
  totalHoras: number;
  proyectosExistentes?: ProyectoEducativo[];
  proyectoIdActual?: string;
}

export const CurricularCoherenceAlerts: React.FC<CurricularCoherenceAlertsProps> = ({
  nombreCurso = '',
  nivel,
  cantidadTemas,
  horasPorTema,
  totalHoras,
  proyectosExistentes = [],
  proyectoIdActual,
}) => {
  const configInstitucional = useMemo(() => {
    return obtenerConfiguracionHorasPorNivel(nivel);
  }, [nivel]);

  const alertas = useMemo(() => {
    const list: Array<{
      tipo: 'error' | 'warning' | 'success' | 'info';
      titulo: string;
      mensaje: string;
    }> = [];

    // 1. Verificación de cálculo matemático
    const horasCalculadas = (cantidadTemas || 0) * (horasPorTema || 0);
    if (horasCalculadas !== totalHoras) {
      list.push({
        tipo: 'warning',
        titulo: 'Desfase en Carga Horaria',
        mensaje: `La multiplicación de ${cantidadTemas} temas × ${horasPorTema} hrs/tema (${horasCalculadas} hrs) difiere de las ${totalHoras} horas totales registradas.`,
      });
    }

    // 2. Alerta de sobrecarga temática (> 40% en un tema)
    if (totalHoras > 0 && horasPorTema > 0) {
      const porcentajeTema = (horasPorTema / totalHoras) * 100;
      if (porcentajeTema > 40) {
        list.push({
          tipo: 'warning',
          titulo: 'Alerta de Sobrecarga Temática',
          mensaje: `Un solo tema concentra el ${Math.round(porcentajeTema)}% de la carga horaria total. Se aconseja subdividir en 2 temas para mantener una curva de atención óptima.`,
        });
      }
    }

    // 3. Comparación con estándar institucional
    if (totalHoras === configInstitucional.totalHoras && cantidadTemas === configInstitucional.cantidadTemas) {
      list.push({
        tipo: 'success',
        titulo: `Carga Curricular Estándar (${nivel})`,
        mensaje: `Cumple al 100% con la norma institucional establecida para el nivel ${nivel} (${configInstitucional.totalHoras} horas en ${configInstitucional.cantidadTemas} temas).`,
      });
    } else {
      list.push({
        tipo: 'info',
        titulo: `Carga Personalizada para Nivel ${nivel}`,
        mensaje: `El estándar institucional para ${nivel} es de ${configInstitucional.totalHoras} hrs (${configInstitucional.cantidadTemas} temas × ${configInstitucional.horasPorTema} hrs). Has personalizado a ${totalHoras} hrs.`,
      });
    }

    // 4. Verificación de duplicidad en el catálogo de cursos
    if (nombreCurso && nombreCurso.trim().length >= 4) {
      const nombreNorm = nombreCurso.trim().toLowerCase();
      const duplicado = proyectosExistentes.find(p => 
        p.id !== proyectoIdActual && 
        p.nombreProyecto.trim().toLowerCase() === nombreNorm
      );

      if (duplicado) {
        list.push({
          tipo: 'error',
          titulo: 'Posible Duplicado en el Catálogo',
          mensaje: `Ya existe un programa activo con el nombre exacto "${duplicado.nombreProyecto}" (#${duplicado.numeroCorrelativo || duplicado.id}). Si es una nueva versión, te sugerimos llamarlo "Sección B" o "Edición II".`,
        });
      }
    }

    return list;
  }, [nombreCurso, nivel, cantidadTemas, horasPorTema, totalHoras, configInstitucional, proyectosExistentes, proyectoIdActual]);

  return (
    <div className="space-y-2 mt-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          Matriz de Coherencia Curricular & Alertas Pedagógicas
        </span>
        <span className="text-[10px] text-slate-500 font-mono">
          Norma Nivel {nivel}: {configInstitucional.totalHoras}h
        </span>
      </div>

      <div className="space-y-1.5">
        {alertas.map((alerta, idx) => {
          let bg = 'bg-blue-50 border-blue-200 text-blue-900';
          let icon = <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />;

          if (alerta.tipo === 'success') {
            bg = 'bg-emerald-50 border-emerald-200 text-emerald-950';
            icon = <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />;
          } else if (alerta.tipo === 'warning') {
            bg = 'bg-amber-50 border-amber-300 text-amber-950';
            icon = <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />;
          } else if (alerta.tipo === 'error') {
            bg = 'bg-rose-50 border-rose-300 text-rose-950';
            icon = <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />;
          }

          return (
            <div key={idx} className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 ${bg}`}>
              {icon}
              <div className="min-w-0">
                <span className="font-bold block text-xs">{alerta.titulo}</span>
                <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">{alerta.mensaje}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
