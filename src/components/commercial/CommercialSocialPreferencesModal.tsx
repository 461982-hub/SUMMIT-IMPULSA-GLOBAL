import React from 'react';
import { X } from 'lucide-react';
import { PreferenciasRedesSocialesComercial, ProyectoEducativo, Moneda } from '../../types';
import { CommercialSocialPreferencesPanel } from './CommercialSocialPreferencesPanel';

interface CommercialSocialPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGuardar?: (prefs: PreferenciasRedesSocialesComercial) => void;
  onNotificar?: (mensaje: string) => void;
  proyectos?: ProyectoEducativo[];
  moneda?: Moneda;
  onAbrirFlyerConProyecto?: (proyecto: ProyectoEducativo) => void;
}

export const CommercialSocialPreferencesModal: React.FC<CommercialSocialPreferencesModalProps> = ({
  isOpen,
  onClose,
  onGuardar,
  onNotificar,
  proyectos = [],
  moneda = 'LPS',
  onAbrirFlyerConProyecto,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          title="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <CommercialSocialPreferencesPanel
          proyectos={proyectos}
          moneda={moneda}
          esModal={true}
          onCerrarModal={onClose}
          onGuardar={onGuardar}
          onNotificar={onNotificar}
          onAbrirFlyerConProyecto={onAbrirFlyerConProyecto}
        />
      </div>
    </div>
  );
};
