import React, { useState } from 'react';
import { ProyectoEducativo, Moneda } from '../../types';
import { formatearMoneda } from '../../utils/calculations';
import { 
  X, 
  MessageSquare, 
  Send, 
  Copy, 
  Check, 
  CheckCircle2, 
  Sparkles, 
  FileText, 
  ShieldCheck, 
  Clock, 
  Building2, 
  Phone,
  ExternalLink
} from 'lucide-react';

interface QuickQuoteWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyecto: ProyectoEducativo | null;
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
}

type TipoMensaje = 'pitch_rapido' | 'cotizacion_formal' | 'urgencia_preventa' | 'cuentas_bancarias';

export const QuickQuoteWhatsAppModal: React.FC<QuickQuoteWhatsAppModalProps> = ({
  isOpen,
  onClose,
  proyecto,
  proyectos,
  moneda,
}) => {
  const [cursoId, setCursoId] = useState<string>(
    proyecto?.id || (proyectos.length > 0 ? proyectos[0].id : '')
  );

  const cursoActual = proyectos.find((p) => p.id === cursoId) || proyecto || proyectos[0];

  const [tipoMensaje, setTipoMensaje] = useState<TipoMensaje>('cotizacion_formal');
  const [telefonoProspecto, setTelefonoProspecto] = useState('');
  const [nombreProspecto, setNombreProspecto] = useState('');
  const [copiado, setCopiado] = useState(false);

  if (!isOpen || !cursoActual) return null;

  const precioRegular = cursoActual.precioSugeridoConISV || cursoActual.precioSugeridoAlumno || 2500;
  const precioPreventa = cursoActual.precioEarlyBird || Math.round(precioRegular * 0.85);
  const cuposRestantes = Math.max(1, (cursoActual.alumnosProyectados || 15) - (cursoActual.alumnosFinal || 0));
  const saludo = nombreProspecto.trim() ? `Estimado(a) *${nombreProspecto.trim()}*` : 'Estimado(a) profesional';

  // Generación de los 4 tipos de plantillas
  const generarTexto = (): string => {
    switch (tipoMensaje) {
      case 'pitch_rapido':
        return `¡Hola ${nombreProspecto.trim() || ''}! 👋 Te saluda el equipo de Admisiones de *Summit Impulsa Global*. 

Nos comunicamos porque abrimos convocatoria oficial para:
🎓 *${cursoActual.nombreProyecto}*
${cursoActual.codigoPrograma ? `📌 *Código Oficial:* ${cursoActual.codigoPrograma}\n` : ''}
👨‍🏫 *Docente Especialista:* ${cursoActual.nombreDocente}
⏱️ *Carga Horaria:* ${cursoActual.horasClase || 12} horas teórico-prácticas
📅 *Inicio:* ${cursoActual.fechaProgramacion || 'Próximamente'}
💻 *Modalidad:* ${cursoActual.modalidadEntrega || 'Virtual en Vivo (Zoom Institucional)'}

Quedan únicamente *${cuposRestantes} cupos disponibles*. ¿Te gustaría que te envíe el Sílabo oficial y el enlace de preventa?`;

      case 'cotizacion_formal':
        return `${saludo}:

Es un gusto presentarte la cotización oficial para tu participación en:
━━━━━━━━━━━━━━━━━━━━━━━━━━
🏛️ *${cursoActual.nombreProyecto.toUpperCase()}*
${cursoActual.codigoPrograma ? `Código SAR: ${cursoActual.codigoPrograma}\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 *INFORMACIÓN ACADÉMICA:*
• *Docente Titular:* ${cursoActual.nombreDocente}
• *Horas Académicas:* ${cursoActual.horasClase || 12} horas con certificación
• *Fecha de Inicio:* ${cursoActual.fechaProgramacion || 'Fecha confirmada'}
• *Horario:* ${cursoActual.horarioClases || 'Según cronograma oficial'}
• *Campus Virtual:* Acceso a grabaciones y materiales de estudio

💰 *INVERSIÓN Y BENEFICIO FISCAL:*
• *Precio de Preventa Especial:* *${formatearMoneda(precioPreventa, moneda)}* (Válido por tiempo limitado)
• *Inversión Regular:* ${formatearMoneda(precioRegular, moneda)}
⚖️ *Tratamiento Tributario:* Este programa califica como *Servicio de Enseñanza y Capacitación Formal EXENTO del Impuesto Sobre Ventas (ISV)* según el Artículo 15 de la Ley del ISV de la República de Honduras. (Emitimos Factura Fiscal con CAI).

Para asegurar tu vacante, respóndenos a este mensaje indicando tu nombre completo o comprobante de depósito. ¡Te esperamos!`;

      case 'urgencia_preventa':
        return `⚠️ *ÚLTIMOS CUPOS DISPONIBLES — FASE DE PREVENTA* ⚠️

${saludo}, te recordamos que la tarifa especial de preventa para:
🌟 *${cursoActual.nombreProyecto}*
está próxima a cerrar.

🔥 *Beneficio de Preventa:* Solo *${formatearMoneda(precioPreventa, moneda)}* (Ahorro directo frente al precio regular de ${formatearMoneda(precioRegular, moneda)}).
👥 *Vacantes restantes:* Solo *${cuposRestantes} cupos*.
📅 *Inicio impostergable:* ${cursoActual.fechaProgramacion || 'Próximos días'}.

¡No te quedes sin tu plaza certificada! Responde *QUIERO MI CUPO* para facilitarte el enlace de pago seguro en 1 minuto.`;

      case 'cuentas_bancarias':
        return `💳 *DATOS BANCARIOS OFICIALES PARA PAGO Y MATRÍCULA*

*Institución:* SUMMIT IMPULSA GLOBAL S. DE R.L.
*RTN Institucional:* 08019995123456
*Concepto:* Matrícula - ${cursoActual.nombreProyecto}
*Monto:* ${formatearMoneda(precioPreventa, moneda)} (Preventa) / ${formatearMoneda(precioRegular, moneda)} (Regular)

🏦 *CUENTAS DE CHEQUES DISPONIBLES:*
1. *BAC Credomatic Honduras:*
   • Cuenta No: 745-123456-7 (LPS)
2. *Banco Ficohsa:*
   • Cuenta No: 2000-112233-4 (LPS)
3. *Banco Atlántida:*
   • Cuenta No: 1100-998877-6 (LPS)

📲 *Confirmación:* Al realizar tu transferencia o depósito, por favor reenvíanos la captura o comprobante por esta vía junto con tu nombre completo y correo para emitir tu Factura Fiscal con CAI e inscribirte de inmediato.`;

      default:
        return '';
    }
  };

  const textoFinal = generarTexto();

  const handleCopiarTexto = () => {
    navigator.clipboard.writeText(textoFinal);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const handleAbrirWhatsApp = () => {
    let telefono = telefonoProspecto.replace(/[^0-9]/g, '');
    if (telefono && !telefono.startsWith('504')) {
      telefono = `504${telefono}`;
    }
    const url = telefono 
      ? `https://wa.me/${telefono}?text=${encodeURIComponent(textoFinal)}`
      : `https://wa.me/?text=${encodeURIComponent(textoFinal)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* Encabezado */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <MessageSquare className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-black text-base text-white tracking-tight">
                Cotizador & WhatsApp en 1 Clic
              </h3>
              <p className="text-xs text-emerald-100">
                Speeches de venta, desglose fiscal SAR y cuentas bancarias listos para enviar
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

        <div className="p-5 space-y-4">
          
          {/* Selector de Programa */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Curso / Programa a Cotizar
              </label>
              <select
                value={cursoId}
                onChange={(e) => setCursoId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                {proyectos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigoPrograma ? `[${p.codigoPrograma}] ` : ''}{p.nombreProyecto}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Precio Preventa / Regular
              </label>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 text-xs text-emerald-900 font-mono font-black">
                {formatearMoneda(precioPreventa, moneda)}
                <span className="text-[10px] text-slate-500 font-normal block">
                  Reg: {formatearMoneda(precioRegular, moneda)}
                </span>
              </div>
            </div>
          </div>

          {/* Personalización rápida del prospecto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Nombre del Prospecto (Opcional)
              </label>
              <input
                type="text"
                value={nombreProspecto}
                onChange={(e) => setNombreProspecto(e.target.value)}
                placeholder="Ej. Ing. Melissa Flores"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Teléfono / WhatsApp (Opcional)
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={telefonoProspecto}
                  onChange={(e) => setTelefonoProspecto(e.target.value)}
                  placeholder="9876-5432"
                  className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Pestañas de Tipo de Mensaje */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Selecciona el Formato de Mensaje:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => setTipoMensaje('pitch_rapido')}
                className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all border text-center ${
                  tipoMensaje === 'pitch_rapido'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                🚀 Pitch Rápido
              </button>

              <button
                type="button"
                onClick={() => setTipoMensaje('cotizacion_formal')}
                className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all border text-center ${
                  tipoMensaje === 'cotizacion_formal'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                📑 Cotización Formal
              </button>

              <button
                type="button"
                onClick={() => setTipoMensaje('urgencia_preventa')}
                className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all border text-center ${
                  tipoMensaje === 'urgencia_preventa'
                    ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                ⏳ Urgencia Cupos
              </button>

              <button
                type="button"
                onClick={() => setTipoMensaje('cuentas_bancarias')}
                className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all border text-center ${
                  tipoMensaje === 'cuentas_bancarias'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                🏦 Cuentas Banco
              </button>
            </div>
          </div>

          {/* Caja de Vista Previa del Mensaje */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-700">
                Vista Previa del Texto (Listo para WhatsApp):
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {textoFinal.length} caracteres
              </span>
            </div>

            <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto border border-slate-800 shadow-inner">
              {textoFinal}
            </div>
          </div>

          {/* Barra de Acciones */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-200">
            <div className="text-[11px] text-slate-500">
              💡 Incluye automáticamente el fundamento legal de exención de ISV ante el SAR.
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleCopiarTexto}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                {copiado ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleAbrirWhatsApp}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Enviar por WhatsApp</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
