import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  X, 
  KeyRound, 
  Lock, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  LogIn,
  Eye,
  EyeOff
} from 'lucide-react';
import { SummitLogo } from './SummitLogo';
import { 
  autorizarGerenciaGeneralConPin, 
  DATOS_SEGURIDAD_GERENCIA_GENERAL,
  isSeguridadSoloGerenciaGeneralActiva,
  setSeguridadSoloGerenciaGeneralActiva
} from '../utils/gerenciaGeneralSecurity';
import { driveAuth, signInWithGoogleDrive } from '../services/googleDriveService';

interface GerenciaGeneralAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthorized?: () => void;
  accionDescripcion?: string; // ej: "crear un nuevo proyecto", "modificar este proyecto", etc.
}

export const GerenciaGeneralAuthModal: React.FC<GerenciaGeneralAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthorized,
  accionDescripcion = 'realizar modificaciones en el sistema',
}) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  if (!isOpen) return null;

  const handleSubmitPin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!pin.trim()) {
      setError('Por favor ingrese el PIN de Gerencia General.');
      return;
    }

    const resultado = autorizarGerenciaGeneralConPin(pin);
    if (resultado.success) {
      setSuccess(resultado.message);
      setTimeout(() => {
        if (onAuthorized) onAuthorized();
        onClose();
      }, 500);
    } else {
      setError(resultado.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setError('');
      const cred = await signInWithGoogleDrive();
      if (cred && cred.user) {
        const email = cred.user.email?.toLowerCase() || '';
        if (
          email === DATOS_SEGURIDAD_GERENCIA_GENERAL.correoOficial.toLowerCase() ||
          email === DATOS_SEGURIDAD_GERENCIA_GENERAL.correoAlterno.toLowerCase()
        ) {
          autorizarGerenciaGeneralConPin('8826'); // Valida sesión
          setSuccess(`¡Bienvenido ${cred.user.displayName || 'Dr. Walter Pedroza'}! Identidad validada.`);
          setTimeout(() => {
            if (onAuthorized) onAuthorized();
            onClose();
          }, 600);
        } else {
          setError(`La cuenta (${email}) no tiene facultades de Gerencia General.`);
        }
      }
    } catch (e: any) {
      setError(e.message || 'Error al iniciar sesión con Google.');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Header Directivo */}
        <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-4 sm:p-5 text-white flex items-center justify-between border-b border-purple-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-600/30 border border-purple-400/30">
              <ShieldCheck className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 bg-purple-500/30 text-purple-200 rounded border border-purple-400/30">
                  POA SEP - DIC 2026 SEGURIDAD
                </span>
                <span className="text-[11px] text-purple-200 font-bold">
                  Gobernanza Institucional
                </span>
              </div>
              <h3 className="text-base font-black text-white mt-0.5">
                Autorización de Gerencia General
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-5 space-y-4">
          
          {/* Advertencia del Parámetro de Seguridad */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-950">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Parámetro de Seguridad Activo: Exclusividad Gerencia General</span>
            </div>
            <p className="leading-relaxed text-amber-900/90 text-[11.5px]">
              Para garantizar el estricto cumplimiento del <strong>POA SEP - DIC 2026</strong> y blindar las metas presupuestarias y de facturación, <strong>solo la Gerencia General puede realizar cambios de cualquier índole</strong> ({accionDescripcion}).
            </p>
            <div className="pt-1 border-t border-amber-200/70 flex items-center justify-between text-[11px] font-semibold text-amber-900">
              <span>Titular Autorizado:</span>
              <span className="font-bold text-slate-900">{DATOS_SEGURIDAD_GERENCIA_GENERAL.titular}</span>
            </div>
          </div>

          {/* Formulario de PIN Maestro */}
          <form onSubmit={handleSubmitPin} className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ingrese Clave o PIN Maestro de Gerencia General:
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="PIN Maestro (ej: 8826)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm tracking-widest text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                PIN oficial institucional: <span className="font-mono font-bold text-purple-700">8826</span>
              </span>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Autorizar con Clave Maestra</span>
            </button>
          </form>

          {/* Opción de Acceso con Cuenta Google */}
          <div className="pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="w-full py-2 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-indigo-600" />
              <span>{isSigningIn ? 'Verificando con Google...' : 'Verificar con Cuenta Google (Walter Pedroza)'}</span>
            </button>
            <span className="text-[10px] text-slate-400 block text-center mt-1">
              {DATOS_SEGURIDAD_GERENCIA_GENERAL.correoOficial} / {DATOS_SEGURIDAD_GERENCIA_GENERAL.correoAlterno}
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>SUMMIT IMPULSA GLOBAL, S.A. DE C.V.</span>
          <button
            onClick={onClose}
            className="font-bold text-slate-700 hover:text-slate-900"
          >
            Cancelar
          </button>
        </div>

      </div>
    </div>
  );
};
