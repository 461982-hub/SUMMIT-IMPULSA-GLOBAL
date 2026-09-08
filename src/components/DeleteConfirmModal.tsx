import React from 'react';
import { Trash2, AlertTriangle, X, Check, ArrowRight } from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../types';
import { formatearMoneda } from '../utils/calculations';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void;
  proyecto: ProyectoEducativo | null;
  moneda: Moneda;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  proyecto,
  moneda,
}) => {
  if (!isOpen || !proyecto) return null;

  const handleConfirm = () => {
    onConfirm(proyecto.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        id="modal-confirmar-eliminar"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-rose-100 flex items-center justify-between bg-rose-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-200">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-rose-950">
                Eliminar Proyecto
              </h2>
              <p className="text-xs text-rose-700">
                Esta acción no se puede deshacer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600">
            ¿Estás seguro de que deseas eliminar este proyecto de la matriz de rentabilidad?
          </p>

          {/* Tarjeta Resumen del Proyecto a Eliminar */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Proyecto a eliminar
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                {proyecto.tipoProyecto}
              </span>
            </div>

            <div className="text-sm font-bold text-slate-900">
              {proyecto.nombreProyecto}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px]">Docente:</span>
                <span className="font-semibold text-slate-800">{proyecto.nombreDocente}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Alumnos (Reales/Proy):</span>
                <span className="font-semibold text-slate-800">{proyecto.alumnosFinal} / {proyecto.alumnosProyectados}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Gasto Operativo:</span>
                <span className="font-mono font-semibold text-amber-700">
                  {formatearMoneda(proyecto.gastoTotalOperativo, moneda)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Ganancia Total:</span>
                <span className={`font-mono font-bold ${
                  proyecto.totalGananciasFinales >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  {formatearMoneda(proyecto.totalGananciasFinales, moneda)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Botones Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            id="btn-cancelar-eliminar"
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            id="btn-confirmar-eliminar"
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Eliminar Definitivamente</span>
          </button>
        </div>
      </div>
    </div>
  );
};
