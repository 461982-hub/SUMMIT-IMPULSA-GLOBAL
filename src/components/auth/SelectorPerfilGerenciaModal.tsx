import React, { useState } from 'react';
import { 
  Building2, 
  GraduationCap, 
  Megaphone, 
  Scale, 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ShieldCheck, 
  ShieldAlert,
  HelpCircle,
  Settings,
  ArrowRight
} from 'lucide-react';
import { 
  RolGerencia, 
  PerfilGerencia, 
  PERFILES_GERENCIA, 
  validarPinGerencia, 
  setUsuarioActivo, 
  getPinsConfigurados,
  actualizarPinGerencia
} from '../../utils/authPorGerencia';
import { SummitLogo } from '../SummitLogo';

interface SelectorPerfilGerenciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuarioActivo: PerfilGerencia;
  onUsuarioCambiado: (nuevoPerfil: PerfilGerencia) => void;
  rolSugerido?: RolGerencia;
}

export const SelectorPerfilGerenciaModal: React.FC<SelectorPerfilGerenciaModalProps> = ({
  isOpen,
  onClose,
  usuarioActivo,
  onUsuarioCambiado,
  rolSugerido,
}) => {
  const [rolSeleccionado, setRolSeleccionado] = useState<RolGerencia>(rolSugerido || usuarioActivo.id);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mostrarCambioPin, setMostrarCambioPin] = useState(false);
  const [nuevoPin, setNuevoPin] = useState('');
  const [confirmarNuevoPin, setConfirmarNuevoPin] = useState('');

  if (!isOpen) return null;

  const perfilDestino = PERFILES_GERENCIA[rolSeleccionado];
  const pinsActuales = getPinsConfigurados();

  const handleSeleccionarRol = (rol: RolGerencia) => {
    setRolSeleccionado(rol);
    setPin('');
    setError('');
    setSuccess('');
    setMostrarCambioPin(false);
  };

  const handleAutenticar = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!pin.trim()) {
      setError('Por favor ingrese el PIN de acceso.');
      return;
    }

    if (validarPinGerencia(rolSeleccionado, pin)) {
      setSuccess(`¡Acceso concedido! Sesión iniciada como ${perfilDestino.nombre}.`);
      setUsuarioActivo(rolSeleccionado);
      setTimeout(() => {
        onUsuarioCambiado(perfilDestino);
        onClose();
      }, 400);
    } else {
      setError('PIN incorrecto. Verifique el código de seguridad o consulte el PIN por defecto.');
    }
  };

  const handleGuardarNuevoPin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nuevoPin.trim() || nuevoPin.length < 4) {
      setError('El nuevo PIN debe tener al menos 4 dígitos numéricos.');
      return;
    }

    if (nuevoPin !== confirmarNuevoPin) {
      setError('Los nuevos PINs no coinciden.');
      return;
    }

    // Verificar si el PIN actual ingresado es válido
    if (!validarPinGerencia(rolSeleccionado, pin)) {
      setError('Debe ingresar el PIN actual correcto para autorizar el cambio.');
      return;
    }

    const exito = actualizarPinGerencia(rolSeleccionado, nuevoPin);
    if (exito) {
      setSuccess(`PIN actualizado exitosamente para ${perfilDestino.nombre}.`);
      setPin(nuevoPin);
      setMostrarCambioPin(false);
      setNuevoPin('');
      setConfirmarNuevoPin('');
    } else {
      setError('Ocurrió un error al actualizar el PIN.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="modal-selector-perfil-gerencia"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Cabecera Institucional */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600/30 rounded-xl border border-purple-500/40 text-purple-300">
              <ShieldCheck className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black uppercase tracking-wider text-white">
                  Seguridad y Control de Acceso por Gerencia
                </h2>
                <span className="text-[10px] bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded font-mono font-bold border border-purple-400/30">
                  Opción A • PIN
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Seleccione su gerencia e ingrese su PIN para habilitar los permisos correspondientes.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Indicador de Usuario Actual */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-slate-500 font-medium">Sesión activa actualmente:</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${usuarioActivo.colorTema.badgeBg} ${usuarioActivo.colorTema.badgeText}`}>
                {usuarioActivo.nombre}
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-700">
              {usuarioActivo.titular}
            </span>
          </div>

          {/* Selector de Gerencias (4 opciones) */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2.5">
              Seleccione la Gerencia a Autenticar:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* 1. Gerencia General */}
              <button
                type="button"
                onClick={() => handleSeleccionarRol('gerencia-general')}
                className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  rolSeleccionado === 'gerencia-general'
                    ? 'border-purple-600 bg-purple-50/80 shadow-xs ring-2 ring-purple-400/50'
                    : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900">Gerencia General</div>
                      <div className="text-[11px] text-purple-700 font-bold">Dr. Walter René Pedroza</div>
                    </div>
                  </div>
                  {rolSeleccionado === 'gerencia-general' && (
                    <span className="w-2 h-2 rounded-full bg-purple-600 ring-4 ring-purple-200" />
                  )}
                </div>
                <div className="mt-2 text-[10px] text-slate-500 leading-snug">
                  Acceso total, dictamen oficial de cursos, rebaja POA y auditoría SAR.
                </div>
              </button>

              {/* 2. Gerencia Académica */}
              <button
                type="button"
                onClick={() => handleSeleccionarRol('gerencia-academica')}
                className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  rolSeleccionado === 'gerencia-academica'
                    ? 'border-blue-600 bg-blue-50/80 shadow-xs ring-2 ring-blue-400/50'
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900">Gerencia Académica</div>
                      <div className="text-[11px] text-blue-700 font-bold">Phd. Donal Reyes</div>
                    </div>
                  </div>
                  {rolSeleccionado === 'gerencia-academica' && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 ring-4 ring-blue-200" />
                  )}
                </div>
                <div className="mt-2 text-[10px] text-slate-500 leading-snug">
                  Creación de programas, horas de clase, honorarios docentes y syllabus.
                </div>
              </button>

              {/* 3. Gerencia Comercial */}
              <button
                type="button"
                onClick={() => handleSeleccionarRol('gerencia-comercializacion')}
                className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  rolSeleccionado === 'gerencia-comercializacion'
                    ? 'border-emerald-600 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-400/50'
                    : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900">Gerencia Comercial</div>
                      <div className="text-[11px] text-emerald-700 font-bold">Msc. Lilian Ordoñez</div>
                    </div>
                  </div>
                  {rolSeleccionado === 'gerencia-comercializacion' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600 ring-4 ring-emerald-200" />
                  )}
                </div>
                <div className="mt-2 text-[10px] text-slate-500 leading-snug">
                  Precios preventa, matrícula de alumnos, canales de venta y satisfacción NPS.
                </div>
              </button>

              {/* 4. Auditoría Interna */}
              <button
                type="button"
                onClick={() => handleSeleccionarRol('auditor-interno')}
                className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  rolSeleccionado === 'auditor-interno'
                    ? 'border-amber-600 bg-amber-50/80 shadow-xs ring-2 ring-amber-400/50'
                    : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900">Auditoría & SAR</div>
                      <div className="text-[11px] text-amber-700 font-bold">Control Interno</div>
                    </div>
                  </div>
                  {rolSeleccionado === 'auditor-interno' && (
                    <span className="w-2 h-2 rounded-full bg-amber-600 ring-4 ring-amber-200" />
                  )}
                </div>
                <div className="mt-2 text-[10px] text-slate-500 leading-snug">
                  Fiscalización de solo lectura, verificación ISV 15% y actas institucionales.
                </div>
              </button>

            </div>
          </div>

          {/* Formulario de Ingreso de PIN */}
          <form onSubmit={handleAutenticar} className="space-y-4 pt-2 border-t border-slate-200">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  PIN de Acceso para <strong className="text-indigo-900">{perfilDestino.nombre}</strong>:
                </label>
                <button
                  type="button"
                  onClick={() => setMostrarCambioPin(!mostrarCambioPin)}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Settings className="w-3 h-3" />
                  <span>{mostrarCambioPin ? 'Cancelar cambio' : 'Cambiar PIN'}</span>
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPin ? 'text' : 'password'}
                  maxLength={8}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Ingrese el PIN numérico"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-sm tracking-widest focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Ayuda de PIN por defecto */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-100/80 px-3 py-2 rounded-lg border border-slate-200">
              <div className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>PIN configurado por defecto para pruebas:</span>
              </div>
              <button
                type="button"
                onClick={() => setPin(pinsActuales[rolSeleccionado])}
                className="font-mono font-bold text-indigo-700 hover:underline cursor-pointer bg-white px-2 py-0.5 rounded border border-slate-200"
                title="Pulsar para auto-completar este PIN"
              >
                {pinsActuales[rolSeleccionado]}
              </button>
            </div>

            {/* Mensajes de Estado */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Panel de Cambio de PIN */}
            {mostrarCambioPin && (
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2.5 animate-in fade-in">
                <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Modificar PIN de {perfilDestino.nombre}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="password"
                    maxLength={8}
                    value={nuevoPin}
                    onChange={(e) => setNuevoPin(e.target.value)}
                    placeholder="Nuevo PIN (mín 4 dígitos)"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                  <input
                    type="password"
                    maxLength={8}
                    value={confirmarNuevoPin}
                    onChange={(e) => setConfirmarNuevoPin(e.target.value)}
                    placeholder="Confirmar Nuevo PIN"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleGuardarNuevoPin}
                    className="px-3 py-1 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                  >
                    Guardar Nuevo PIN
                  </button>
                </div>
              </div>
            )}

            {/* Botones de Acción */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 text-xs font-black text-white bg-indigo-700 hover:bg-indigo-800 rounded-xl shadow-sm transition-all hover:scale-[1.01] cursor-pointer"
              >
                <span>Autenticar y Cambiar a {perfilDestino.nombre}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </form>

        </div>

        {/* Footer del Modal */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <SummitLogo className="h-4 w-auto" />
            <span>Summit Impulsa Global • Seguridad Operativa Multi-Gerencial</span>
          </div>
          <span className="font-mono text-slate-400">v5.2026-POA</span>
        </div>

      </div>
    </div>
  );
};
