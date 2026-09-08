import React, { useState } from 'react';
import { ProyectoEducativo, Moneda } from '../../types';
import { formatearMoneda, calcularMetricasProyecto } from '../../utils/calculations';
import { 
  X, 
  Zap, 
  UserCheck, 
  DollarSign, 
  CheckCircle2, 
  Phone, 
  Mail, 
  Building, 
  CreditCard, 
  Send, 
  Copy, 
  ExternalLink,
  Users,
  Calendar,
  Sparkles
} from 'lucide-react';

interface QuickEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyectos: ProyectoEducativo[];
  proyectoInicial?: ProyectoEducativo | null;
  moneda: Moneda;
  onGuardarProyecto: (proyectoActualizado: ProyectoEducativo) => void;
  onNotificar?: (mensaje: string) => void;
}

export const QuickEnrollmentModal: React.FC<QuickEnrollmentModalProps> = ({
  isOpen,
  onClose,
  proyectos,
  proyectoInicial,
  moneda,
  onGuardarProyecto,
  onNotificar,
}) => {
  const [proyectoId, setProyectoId] = useState<string>(
    proyectoInicial?.id || (proyectos.length > 0 ? proyectos[0].id : '')
  );

  const proyectoSeleccionado = proyectos.find((p) => p.id === proyectoId) || proyectos[0];

  // Datos del alumno
  const [nombreAlumno, setNombreAlumno] = useState('');
  const [telefonoAlumno, setTelefonoAlumno] = useState('');
  const [correoAlumno, setCorreoAlumno] = useState('');
  const [empresaAlumno, setEmpresaAlumno] = useState('');
  const [cargoAlumno, setCargoAlumno] = useState('');

  // Datos de pago
  const [montoCobrado, setMontoCobrado] = useState<number>(
    proyectoSeleccionado ? (proyectoSeleccionado.precioEarlyBird || proyectoSeleccionado.precioSugeridoAlumno || 2500) : 2500
  );
  const [metodoPago, setMetodoPago] = useState<'Transferencia' | 'Tarjeta de Crédito / Enlace' | 'Depósito Bancario' | 'Convenio Empresa' | 'Efectivo'>('Transferencia');
  const [numeroComprobante, setNumeroComprobante] = useState('');
  const [asesorAsignado, setAsesorAsignado] = useState('Lic. Walter Rene');

  // Estado post-registro exitoso
  const [registroExitoso, setRegistroExitoso] = useState(false);
  const [copiadoWhatsapp, setCopiadoWhatsapp] = useState(false);

  if (!isOpen) return null;

  // Actualizar precio sugerido al cambiar curso
  const handleCambiarCurso = (nuevoId: string) => {
    setProyectoId(nuevoId);
    const p = proyectos.find((item) => item.id === nuevoId);
    if (p) {
      setMontoCobrado(p.precioEarlyBird || p.precioSugeridoAlumno || 2500);
    }
  };

  const handleProcesarMatricula = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proyectoSeleccionado) return;
    if (!nombreAlumno.trim()) {
      alert('Por favor ingrese el nombre del alumno.');
      return;
    }

    const nuevoLeadId = `lead-${Date.now()}`;
    const nuevoLead = {
      id: nuevoLeadId,
      nombre: nombreAlumno.trim(),
      correo: correoAlumno.trim() || 'sin-correo@estudiante.hn',
      telefono: telefonoAlumno.trim() || '+504 0000-0000',
      empresa: empresaAlumno.trim() || 'Estudiante Particular',
      cargo: cargoAlumno.trim() || 'Profesional',
      etapa: 'Inscrito Oficial' as const,
      origenLead: 'Web Orgánica' as const,
      montoPagado: Number(montoCobrado) || 0,
      metodoPago: (metodoPago === 'Efectivo' ? 'Depósito Bancario' : metodoPago) as any,
      fechaRegistro: new Date().toISOString().slice(0, 10),
      asesorAsignado,
      cumplePrerrequisitos: true,
      traspasadoAAula: true,
      notas: `Matrícula exprés. Comprobante: ${numeroComprobante || 'S/N'}. Registrado por ${asesorAsignado}.`,
    };

    const crmActualizado = [
      nuevoLead,
      ...(proyectoSeleccionado.crmProspectosCohorte || [])
    ];

    // Incremento de alumnos y cálculo financiero
    const nuevosAlumnosFinal = (proyectoSeleccionado.alumnosFinal || 0) + 1;
    const ingresoAdicional = Number(montoCobrado) || 0;
    const nuevoIngresoReal = (proyectoSeleccionado.ingresoRealTotal || 0) + ingresoAdicional;

    const proyectoActualizado = calcularMetricasProyecto({
      ...proyectoSeleccionado,
      alumnosFinal: nuevosAlumnosFinal,
      ingresoRealTotal: nuevoIngresoReal,
      crmProspectosCohorte: crmActualizado,
      seLlevoACabo: proyectoSeleccionado.seLlevoACabo === 'Planificado' ? 'En proceso' : proyectoSeleccionado.seLlevoACabo,
    });

    onGuardarProyecto(proyectoActualizado);
    if (onNotificar) {
      onNotificar(`¡Matrícula confirmada para ${nombreAlumno.trim()} en ${proyectoSeleccionado.nombreProyecto}!`);
    }

    setRegistroExitoso(true);
  };

  const mensajeBienvenidaWA = proyectoSeleccionado ? 
    `¡Hola ${nombreAlumno.split(' ')[0] || 'Estimado(a)'}! 🎉 Te confirmamos con éxito tu matrícula oficial en *${proyectoSeleccionado.nombreProyecto}* de Summit Impulsa Global. 

📅 *Fecha de inicio:* ${proyectoSeleccionado.fechaProgramacion || 'Próximamente'}
⏰ *Horario:* ${proyectoSeleccionado.horarioClases || 'Según cronograma oficial'}
👨‍🏫 *Docente titular:* ${proyectoSeleccionado.nombreDocente}
📄 *Comprobante ref:* ${numeroComprobante || 'Confirmado'}

En breve tu asesor (${asesorAsignado}) te enviará los accesos al Campus Virtual y el Sílabo oficial. ¡Bienvenido(a) a la comunidad!`
    : '';

  const handleCopiarMensajeWA = () => {
    navigator.clipboard.writeText(mensajeBienvenidaWA);
    setCopiadoWhatsapp(true);
    setTimeout(() => setCopiadoWhatsapp(false), 3000);
  };

  const handleAbrirWhatsAppDirecto = () => {
    const telefonoLimpio = telefonoAlumno.replace(/[^0-9]/g, '');
    const telefonoFinal = telefonoLimpio.startsWith('504') ? telefonoLimpio : `504${telefonoLimpio}`;
    const url = `https://wa.me/${telefonoFinal}?text=${encodeURIComponent(mensajeBienvenidaWA)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* Encabezado */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
            </div>
            <div>
              <h3 className="font-black text-base text-white tracking-tight">
                Matrícula Exprés en 30 Segundos
              </h3>
              <p className="text-xs text-emerald-100">
                Inscripción rápida, cobro y confirmación automática por WhatsApp
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {registroExitoso ? (
          /* Pantalla de Confirmación y Envío de WhatsApp */
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h4 className="text-lg font-black text-slate-900">
                ¡Matrícula Registrada con Éxito!
              </h4>
              <p className="text-sm text-slate-600 mt-1">
                Se actualizó el aforo a <span className="font-black text-emerald-700 font-mono">{proyectoSeleccionado?.alumnosFinal} inscritos</span> en <strong>{proyectoSeleccionado?.nombreProyecto}</strong>.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-left text-xs font-mono text-slate-800 whitespace-pre-wrap max-h-36 overflow-y-auto">
              {mensajeBienvenidaWA}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleAbrirWhatsAppDirecto}
                disabled={!telefonoAlumno}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Enviar WhatsApp ({telefonoAlumno || 'Sin número'})</span>
              </button>

              <button
                type="button"
                onClick={handleCopiarMensajeWA}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                {copiadoWhatsapp ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Mensaje</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setRegistroExitoso(false);
                  setNombreAlumno('');
                  setTelefonoAlumno('');
                  setCorreoAlumno('');
                  setNumeroComprobante('');
                }}
                className="w-full sm:w-auto px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                + Matricular Otro
              </button>
            </div>
          </div>
        ) : (
          /* Formulario Rápido */
          <form onSubmit={handleProcesarMatricula} className="p-5 space-y-4">
            
            {/* Selector de Curso */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Programa Educativo / Curso Destino <span className="text-rose-500">*</span>
              </label>
              <select
                value={proyectoId}
                onChange={(e) => handleCambiarCurso(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                {proyectos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigoPrograma ? `[${p.codigoPrograma}] ` : ''}{p.nombreProyecto} ({p.alumnosFinal || 0} matriculados • Eq: {p.puntoEquilibrioAlumnos})
                  </option>
                ))}
              </select>

              {proyectoSeleccionado && (
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 px-1">
                  <span>Docente: <strong>{proyectoSeleccionado.nombreDocente}</strong></span>
                  <span className="font-mono">
                    P. Venta: <strong>{formatearMoneda(proyectoSeleccionado.precioSugeridoAlumno, moneda)}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Datos del Alumno */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Completo del Estudiante <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={nombreAlumno}
                    onChange={(e) => setNombreAlumno(e.target.value)}
                    placeholder="Ej. Ing. Carlos Alvarado"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WhatsApp / Teléfono <span className="text-emerald-600">(Para envío directo)</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={telefonoAlumno}
                    onChange={(e) => setTelefonoAlumno(e.target.value)}
                    placeholder="+504 9988-7766"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={correoAlumno}
                    onChange={(e) => setCorreoAlumno(e.target.value)}
                    placeholder="alumno@ejemplo.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Empresa / Institución (Opcional)
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={empresaAlumno}
                    onChange={(e) => setEmpresaAlumno(e.target.value)}
                    placeholder="Ej. Ficohsa, Cervecería..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Asesor Responsable
                </label>
                <select
                  value={asesorAsignado}
                  onChange={(e) => setAsesorAsignado(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="Lic. Walter Rene">Lic. Walter Rene</option>
                  <option value="Lic. Andrea Mejía">Lic. Andrea Mejía</option>
                  <option value="Ing. Carlos Pineda">Ing. Carlos Pineda</option>
                  <option value="Lic. Gabriela Reyes">Lic. Gabriela Reyes</option>
                </select>
              </div>
            </div>

            {/* Datos Financieros de Pago */}
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Cobro & Comprobante
                </span>
                <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">
                  Exento de ISV según SAR Art. 15
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Monto Cobrado ({moneda}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={montoCobrado}
                    onChange={(e) => setMontoCobrado(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-black text-emerald-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Método de Pago
                  </label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="Tarjeta de Crédito / Enlace">Enlace / Tarjeta</option>
                    <option value="Depósito Bancario">Depósito Ventanilla</option>
                    <option value="Convenio Empresa">Convenio Empresa</option>
                    <option value="Efectivo">Efectivo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    No. Comprobante / Ref
                  </label>
                  <input
                    type="text"
                    value={numeroComprobante}
                    onChange={(e) => setNumeroComprobante(e.target.value)}
                    placeholder="Ej. BAC-88219"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                <span>Confirmar e Inscribir (+1)</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
