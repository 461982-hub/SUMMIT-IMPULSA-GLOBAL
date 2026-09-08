import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  X, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  UserCheck, 
  Settings, 
  Eye, 
  EyeOff, 
  ShieldAlert,
  Sparkles,
  LogIn,
  Loader2
} from 'lucide-react';
import { 
  getCostosFijosSecurityConfig, 
  verifyMasterPin, 
  isEmailAuthorized, 
  updateMasterPin, 
  updateSecurityPolicy,
  DEFAULT_AUTHORIZED_EMAIL,
  DEFAULT_AUTHORIZED_NAME,
  DEFAULT_MASTER_PIN
} from '../utils/costosFijosAuth';
import { driveAuth, signInWithGoogleDrive } from '../services/googleDriveService';
import { onAuthStateChanged, User } from 'firebase/auth';

interface CostosFijosAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthorized: () => void;
  moneda: string;
}

export const CostosFijosAuthModal: React.FC<CostosFijosAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthorized,
  moneda,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => driveAuth.currentUser);
  const [activeTab, setActiveTab] = useState<'authorize' | 'settings'>('authorize');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Configuración actual
  const [config, setConfig] = useState(() => getCostosFijosSecurityConfig());

  // Estados para pestaña de configuración
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [requireGoogleOnly, setRequireGoogleOnly] = useState(config.requireGoogleAuthOnly);
  const [configSuccess, setConfigSuccess] = useState('');
  const [configError, setConfigError] = useState('');

  // Escuchar cambios de autenticación de Google en tiempo real
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(driveAuth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Actualizar config al abrir
  useEffect(() => {
    if (isOpen) {
      const freshConfig = getCostosFijosSecurityConfig();
      setConfig(freshConfig);
      setRequireGoogleOnly(freshConfig.requireGoogleAuthOnly);
      setPin('');
      setError('');
      setSuccessMsg('');
      setConfigError('');
      setConfigSuccess('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isCurrentEmailAuthorized = isEmailAuthorized(currentUser?.email);

  // Desbloqueo directo con cuenta de Google verificada
  const handleDesbloqueoPorGoogle = () => {
    if (!currentUser || !isCurrentEmailAuthorized) {
      setError(`Se requiere la cuenta autorizada (${config.authorizedEmail}).`);
      return;
    }

    setSuccessMsg('¡Identidad verificada exitosamente como Titular Exclusivo!');
    setTimeout(() => {
      onAuthorized();
      onClose();
    }, 450);
  };

  // Iniciar sesión con Google para verificar titularidad
  const handleConectarGoogle = async () => {
    setError('');
    setIsSigningIn(true);
    try {
      const result = await signInWithGoogleDrive();
      const signedEmail = result.user.email;

      if (isEmailAuthorized(signedEmail)) {
        setSuccessMsg(`¡Autenticado como ${signedEmail}! Desbloqueo concedido.`);
        setTimeout(() => {
          onAuthorized();
          onClose();
        }, 500);
      } else {
        setError(`Acceso denegado: El correo conectado (${signedEmail}) no tiene permisos de Dirección. Solo ${config.authorizedEmail} puede autorizar.`);
      }
    } catch (err: any) {
      console.error('Error al iniciar sesión con Google:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError('No se pudo completar la verificación con Google. Intente nuevamente o use su Clave Maestra.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  // Desbloqueo por Clave Maestra / PIN
  const handleDesbloqueoPorPin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (config.requireGoogleAuthOnly) {
      setError(`La política actual exige iniciar sesión exclusivamente con Google (${config.authorizedEmail}).`);
      return;
    }

    if (verifyMasterPin(pin)) {
      setSuccessMsg('Clave Maestra verificada. Edición habilitada.');
      setTimeout(() => {
        onAuthorized();
        onClose();
      }, 400);
    } else {
      setError('Clave Maestra incorrecta. Esta sección está protegida exclusivamente para la Dirección General.');
    }
  };

  // Guardar nueva configuración de seguridad
  const handleGuardarConfiguracion = (e: React.FormEvent) => {
    e.preventDefault();
    setConfigError('');
    setConfigSuccess('');

    // Solo se permite configurar si el usuario ya está autenticado con Google como dueño, o si conoce el PIN actual
    const tienePermiso = isCurrentEmailAuthorized || verifyMasterPin(pin);

    if (!tienePermiso) {
      setConfigError('Para modificar los parámetros de seguridad, primero verifique su identidad con Google o ingrese su Clave Maestra actual.');
      return;
    }

    if (newPin) {
      if (newPin.length < 4) {
        setConfigError('La nueva Clave Maestra debe tener al menos 4 caracteres.');
        return;
      }
      if (newPin !== confirmNewPin) {
        setConfigError('Las claves no coinciden.');
        return;
      }

      const res = updateMasterPin(newPin, true);
      if (!res.success) {
        setConfigError(res.message);
        return;
      }
    }

    updateSecurityPolicy(requireGoogleOnly);
    const updated = getCostosFijosSecurityConfig();
    setConfig(updated);
    setConfigSuccess('Configuración de seguridad exclusiva actualizada exitosamente.');
    setNewPin('');
    setConfirmNewPin('');
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Cabecera del Modal */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-xs">
              <ShieldCheck className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight flex items-center gap-1.5">
                <span>Acceso Exclusivo de Dirección</span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-900/50 text-amber-200 px-1.5 py-0.5 rounded border border-amber-400/40">
                  Costos Fijos
                </span>
              </h3>
              <p className="text-[11px] text-amber-100 font-medium">
                Sección restringida exclusivamente a Walter Pedroza
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('authorize');
              setError('');
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'authorize'
                ? 'border-amber-600 text-amber-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-700" />
            <span>Desbloquear Edición</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('settings');
              setError('');
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'border-amber-600 text-amber-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span>Configurar Acceso Exclusivo</span>
          </button>
        </div>

        {/* Contenido Principal */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700">

          {/* Explicación de la Política */}
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-950 text-xs">
              <Lock className="w-3.5 h-3.5 text-amber-800 shrink-0" />
              <span>Protección Institucional (Zoom {moneda} 300, Otros {moneda} 100)</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Los rubros de <strong>Zoom ({moneda} 300)</strong>, <strong>Papelería ({moneda} 100)</strong> y <strong>Gastos Varios ({moneda} 100)</strong> están estandarizados institucionalmente. Para garantizar que nadie más modifique estos valores, el desbloqueo está restringido al titular:
            </p>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="font-bold text-amber-900 bg-amber-200/70 border border-amber-300/80 px-2 py-0.5 rounded text-[11px] font-mono inline-flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-amber-800" />
                {config.authorizedEmail}
              </span>
            </div>
          </div>

          {activeTab === 'authorize' ? (
            <div className="space-y-4">
              {/* Opción 1: Autenticación con Google (Verificación Infalsificable) */}
              <div className="border border-slate-200 rounded-xl p-3.5 space-y-2.5 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">
                      1
                    </span>
                    Verificación con Google (Recomendada)
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                    100% Seguro
                  </span>
                </div>

                {currentUser ? (
                  isCurrentEmailAuthorized ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Sesión Verificada de Propietario</span>
                      </div>
                      <p className="text-[11px] text-emerald-800">
                        Has iniciado sesión con <strong>{currentUser.email}</strong>. Eres el administrador exclusivo facultado para modificar estos costos.
                      </p>
                      <button
                        type="button"
                        onClick={handleDesbloqueoPorGoogle}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition-colors cursor-pointer text-xs"
                      >
                        <Unlock className="w-4 h-4" />
                        <span>Desbloquear Edición Directamente</span>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5 space-y-2">
                      <div className="flex items-center gap-1.5 text-rose-900 font-bold text-xs">
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Cuenta no autorizada ({currentUser.email})</span>
                      </div>
                      <p className="text-[11px] text-rose-700">
                        Esta cuenta no coincide con el administrador facultado ({config.authorizedEmail}).
                      </p>
                      <button
                        type="button"
                        onClick={handleConectarGoogle}
                        disabled={isSigningIn}
                        className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-white border border-rose-300 text-rose-900 hover:bg-rose-100 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Cambiar a {config.authorizedEmail}</span>
                      </button>
                    </div>
                  )
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-600">
                      Inicia sesión con tu cuenta de Google ({config.authorizedEmail}) para desbloquear con un solo clic.
                    </p>
                    <button
                      type="button"
                      onClick={handleConectarGoogle}
                      disabled={isSigningIn}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-slate-50 text-slate-800 font-bold border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer text-xs"
                    >
                      {isSigningIn ? (
                        <>
                          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                          <span>Verificando con Google...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                          </svg>
                          <span>Acceder como {config.authorizedEmail}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Opción 2: Desbloqueo por Clave Maestra Personal */}
              {!config.requireGoogleAuthOnly && (
                <div className="border border-slate-200 rounded-xl p-3.5 space-y-2.5 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                      <span className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-black">
                        2
                      </span>
                      O ingresar Clave Maestra Privada
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Uso local / Offline</span>
                  </div>

                  <form onSubmit={handleDesbloqueoPorPin} className="space-y-2">
                    <div className="relative">
                      <input
                        id="input-clave-maestra-costos"
                        type={showPin ? 'text' : 'password'}
                        placeholder="Ingrese su Clave Maestra personal..."
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        className="w-full pl-3 pr-10 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono tracking-wider"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        title={showPin ? 'Ocultar' : 'Mostrar'}
                      >
                        {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-2xs transition-colors cursor-pointer text-xs"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Desbloquear con Clave Maestra</span>
                    </button>
                  </form>
                </div>
              )}

              {/* Mensajes de Estado */}
              {error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[11px] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}
            </div>
          ) : (
            /* Pestaña de Configuración Exclusiva */
            <form onSubmit={handleGuardarConfiguracion} className="space-y-3.5">
              <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-slate-600" />
                  <span>Administración de Credenciales y Política</span>
                </span>
                <p className="text-[11px] text-slate-600">
                  Configure su Clave Maestra secreta o active el modo de máxima seguridad para que nadie pueda desbloquear sin su cuenta Google.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nueva Clave Maestra Privada (Mínimo 4 caracteres)
                </label>
                <input
                  type="password"
                  placeholder="Definir nueva clave secreta..."
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Confirmar Nueva Clave Maestra
                </label>
                <input
                  type="password"
                  placeholder="Repita la nueva clave..."
                  value={confirmNewPin}
                  onChange={(e) => setConfirmNewPin(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100/80 transition-colors">
                  <input
                    type="checkbox"
                    checked={requireGoogleOnly}
                    onChange={(e) => setRequireGoogleOnly(e.target.checked)}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <div className="text-[11px]">
                    <span className="font-bold text-slate-800 block">
                      Exigir estrictamente autenticación con Google
                    </span>
                    <span className="text-slate-500">
                      Deshabilita el ingreso por PIN y solo permite editar a la cuenta verificada <strong>{config.authorizedEmail}</strong>.
                    </span>
                  </div>
                </label>
              </div>

              {/* Si no está autenticado por Google, requerir clave actual para guardar cambios */}
              {!isCurrentEmailAuthorized && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Clave Maestra Actual (Para validar cambios)
                  </label>
                  <input
                    type="password"
                    placeholder="Clave actual..."
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              {configError && (
                <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>{configError}</span>
                </div>
              )}

              {configSuccess && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{configSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Guardar Parámetros de Acceso Exclusivo</span>
              </button>
            </form>
          )}
        </div>

        {/* Pie de Página */}
        <div className="bg-slate-50 px-5 py-2.5 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Seguridad SUMMIT v2026</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-semibold px-2 py-1 rounded hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
