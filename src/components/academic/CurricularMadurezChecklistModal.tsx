import React from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Award, 
  Clock, 
  ArrowRight, 
  BookOpen, 
  FileText, 
  Users, 
  Layers,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { ProyectoEducativo } from '../../types';
import { evaluarMadurezCurricular } from '../../utils/curricularMadurezUtils';

interface CurricularMadurezChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyecto: ProyectoEducativo | null;
  onEditar?: (p: ProyectoEducativo) => void;
}

export const CurricularMadurezChecklistModal: React.FC<CurricularMadurezChecklistModalProps> = ({
  isOpen,
  onClose,
  proyecto,
  onEditar,
}) => {
  if (!isOpen || !proyecto) return null;

  const evaluacion = evaluarMadurezCurricular(proyecto);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabecera */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Award className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 bg-blue-500/30 text-blue-200 rounded border border-blue-400/30">
                  Gerencia Académica
                </span>
                <span className="text-xs text-blue-300 font-medium">
                  Auditoría Curricular
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white truncate max-w-md">
                Checklist de Entrega a Comercialización
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen de Madurez y Barra de Progreso */}
        <div className="p-5 bg-gradient-to-br from-slate-50 to-blue-50/40 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Nivel de Madurez Curricular del Programa
              </span>
              <h4 className="text-base font-black text-slate-900 mt-0.5">
                {proyecto.nombreProyecto}
              </h4>
            </div>

            <div className="text-right">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${evaluacion.badgeColor.bg} ${evaluacion.badgeColor.text} ${evaluacion.badgeColor.border}`}>
                <span className={`w-2 h-2 rounded-full ${evaluacion.badgeColor.dot}`} />
                <span>{evaluacion.score}% • {evaluacion.nivel}</span>
              </span>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                evaluacion.score >= 85 
                  ? 'bg-emerald-500' 
                  : evaluacion.score >= 50 
                  ? 'bg-amber-500' 
                  : 'bg-rose-500'
              }`}
              style={{ width: `${evaluacion.score}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
            <span>{evaluacion.itemsCompletadosCount} de {evaluacion.itemsTotalesCount} criterios aprobados</span>
            <span>
              {evaluacion.listoParaVenta 
                ? '✅ Programa listo para entrega a Gerencia de Comercialización' 
                : '⚠️ Se recomienda completar los ítems pendientes antes de iniciar promoción'}
            </span>
          </div>
        </div>

        {/* Lista de Ítems del Checklist */}
        <div className="p-5 overflow-y-auto space-y-3">
          <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            Criterios Pedagógicos y Operativos Auditados
          </h5>

          <div className="space-y-2.5">
            {evaluacion.items.map((item) => (
              <div 
                key={item.id}
                className={`p-3 rounded-xl border text-xs transition-all flex items-start justify-between gap-3 ${
                  item.completado 
                    ? 'bg-emerald-50/50 border-emerald-200' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {item.completado ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">
                        {item.titulo}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                        {item.peso}% peso
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {item.descripcion}
                    </p>
                    {item.detalle && (
                      <div className="text-[11px] font-mono text-slate-700 mt-1 font-semibold">
                        Estado: {item.detalle}
                      </div>
                    )}
                    {!item.completado && item.sugerenciaAccion && (
                      <p className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 mt-1.5 inline-block">
                        💡 {item.sugerenciaAccion}
                      </p>
                    )}
                  </div>
                </div>

                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded shrink-0 ${
                  item.completado ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {item.completado ? 'Aprobado' : 'Pendiente'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Barra inferior */}
        <div className="px-5 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0 text-xs">
          <div className="text-slate-600 text-[11px]">
            {evaluacion.listoParaVenta ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Aprobación Académica Completa
              </span>
            ) : (
              <span className="text-amber-800 font-semibold">
                Faltan {evaluacion.faltantesCriticos.length} requisitos para el 100% de madurez.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onEditar && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditar(proyecto);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
              >
                Completar Requisitos
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
