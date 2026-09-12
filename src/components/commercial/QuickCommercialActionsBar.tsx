import React, { useState } from 'react';
import { 
  Zap, 
  MessageCircle, 
  UserPlus, 
  Copy, 
  Check, 
  Percent, 
  TrendingUp, 
  Users, 
  DollarSign, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  ExternalLink,
  Mail,
  Calculator,
  Printer,
  FileSpreadsheet
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { calcularMetricasProyecto } from '../../utils/calculations';
import { formatearHNL } from '../../utils/poa2026Data';

interface QuickCommercialActionsBarProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto: (p: ProyectoEducativo) => void;
  onNotificar?: (mensaje: string) => void;
  onAbrirEmails?: () => void;
  onAbrirComisiones?: () => void;
  onAbrirCotizadorCorporativo?: () => void;
}

export const QuickCommercialActionsBar: React.FC<QuickCommercialActionsBarProps> = ({
  proyectos,
  moneda,
  onGuardarProyecto,
  onNotificar,
  onAbrirEmails,
  onAbrirComisiones,
  onAbrirCotizadorCorporativo,
}) => {
  const [expandido, setExpandido] = useState<boolean>(true);
  const [proyectoSeleccionadoId, setProyectoSeleccionadoId] = useState<string>(
    proyectos.length > 0 ? proyectos[0].id : ''
  );
  const [copiadoWhatsApp, setCopiadoWhatsApp] = useState<boolean>(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const proyectoActual = proyectos.find((p) => p.id === proyectoSeleccionadoId) || proyectos[0];

  // Handler: Incrementar Alumnos de forma instantánea
  const handleSumarAlumnos = (incremento: number) => {
    if (!proyectoActual) return;

    const nuevosAlumnos = Math.max(0, (proyectoActual.alumnosFinal || 0) + incremento);
    const nuevoPrecioReal = proyectoActual.precioRealCobradoAlumno || proyectoActual.precioSugeridoAlumno || 2500;
    const nuevoIngreso = nuevosAlumnos * nuevoPrecioReal;

    const baseActualizada: ProyectoEducativo = {
      ...proyectoActual,
      alumnosFinal: nuevosAlumnos,
      cuposReservados: Math.max(proyectoActual.cuposReservados || 0, nuevosAlumnos),
      ingresoRealTotal: nuevoIngreso,
      seLlevoACabo: nuevosAlumnos >= proyectoActual.puntoEquilibrioAlumnos ? 'Listo' : 'En proceso',
      comercializacionCompletada: true,
    };

    const recalculado = calcularMetricasProyecto(baseActualizada);
    onGuardarProyecto(recalculado);

    const txt = `+${incremento} alumno(s) registrado(s) en "${proyectoActual.nombreProyecto}". Total: ${nuevosAlumnos}.`;
    setMensajeExito(txt);
    if (onNotificar) onNotificar(txt);
    setTimeout(() => setMensajeExito(null), 3000);
  };

  // Handler: Calibrar Automáticamente Precios de Preventa y Urgencia
  const handleCalibrarPreventaAutomatica = () => {
    if (!proyectoActual) return;

    const regular = proyectoActual.precioSugeridoConISV || proyectoActual.precioSugeridoAlumno || 2500;
    const precioEarlyBird = Math.round(regular * 0.85); // 15% de descuento
    
    // Fecha límite dentro de 7 días calendario
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + 7);
    const fechaLimiteStr = fechaLimite.toISOString().split('T')[0];

    const actualizado: ProyectoEducativo = {
      ...proyectoActual,
      faseComercial: 'Preventa Early Bird',
      descuentoPreventaPct: 15,
      precioEarlyBird: precioEarlyBird,
      fechaVenta: fechaLimiteStr,
      comercializacionCompletada: true,
    };

    const recalculado = calcularMetricasProyecto(actualizado);
    onGuardarProyecto(recalculado);

    const txt = `¡Preventa Early Bird calibrada en "${proyectoActual.nombreProyecto}": ${formatearHNL(precioEarlyBird)} (15% OFF hasta el ${fechaLimiteStr})!`;
    setMensajeExito(txt);
    if (onNotificar) onNotificar(txt);
    setTimeout(() => setMensajeExito(null), 3500);
  };

  // Generador de Copy Comercial para WhatsApp
  const generarTextoWhatsApp = () => {
    if (!proyectoActual) return '';

    const regular = proyectoActual.precioSugeridoConISV || proyectoActual.precioSugeridoAlumno || 2500;
    const earlyBird = proyectoActual.precioEarlyBird || Math.round(regular * 0.85);
    const cuposRestantes = Math.max(1, (proyectoActual.alumnosProyectados || 20) - (proyectoActual.alumnosFinal || 0));

    return `*SUMMIT IMPULSA GLOBAL* 🎓
*Invitación Oficial al Programa Formativo:*

📘 *${proyectoActual.nombreProyecto}*
👨‍🏫 *Docente:* ${proyectoActual.nombreDocente}
⏱️ *Duración:* ${proyectoActual.horasDocente} horas académicas
📍 *Modalidad:* ${proyectoActual.modalidad}
🗓️ *Fecha Estimada de Inicio:* ${proyectoActual.fechaInicio || 'Próximo Grupo'}

🏷️ *Inversión del Programa:*
• *Precio Preventa Anticipada (15% OFF):* ${formatearHNL(earlyBird)}
• *Inversión Regular:* ${formatearHNL(regular)}
⚠️ *¡Solo quedan ${cuposRestantes} cupos disponibles para esta tarifa!*

✅ *Beneficios incluidos:*
• Certificado Oficial con Código Único de Registro
• Acceso a aula virtual y grabaciones en alta definición
• Material descargable y acompañamiento docente directo

📲 *Para reservar tu cupo o solicitar cotización empresarial:*
Escríbenos directamente o responde a este mensaje para enviarte los datos de matrícula bancaria oficial.`;
  };

  const handleCopiarTextoWhatsApp = () => {
    const texto = generarTextoWhatsApp();
    navigator.clipboard.writeText(texto);
    setCopiadoWhatsApp(true);
    if (onNotificar) onNotificar('¡Ficha de venta para WhatsApp copiada al portapapeles!');
    setTimeout(() => setCopiadoWhatsApp(false), 3000);
  };

  const handleAbrirWhatsAppWeb = () => {
    const texto = encodeURIComponent(generarTextoWhatsApp());
    window.open(`https://web.whatsapp.com/send?text=${texto}`, '_blank');
  };

  if (proyectos.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all">
      {/* Cabecera */}
      <div className="p-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-400/20 text-emerald-300 rounded-xl border border-emerald-400/30">
            <Zap className="w-5 h-5 fill-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                Centro de Aceleración Comercial • Matrícula Express & WhatsApp
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded-full">
                1 Clic
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/90 mt-0.5">
              Sume alumnos matriculados en 1 toque, genere fichas de venta para WhatsApp y calibre precios de preventa al instante.
            </p>
          </div>
        </div>

        <button
          onClick={() => setExpandido(!expandido)}
          className="self-end sm:self-center px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/15"
        >
          <span>{expandido ? 'Ocultar Acciones' : 'Mostrar Acelerador'}</span>
          {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Contenido expandible */}
      {expandido && (
        <div className="p-4 sm:p-5 bg-slate-50/60 border-t border-slate-200/80 space-y-4">
          
          {/* Mensaje de éxito temporal */}
          {mensajeExito && (
            <div className="p-3 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{mensajeExito}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            
            {/* 1. Selector de Programa */}
            <div className="lg:col-span-4 space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                1. Seleccionar Programa en Campaña:
              </label>
              <select
                value={proyectoActual?.id || ''}
                onChange={(e) => setProyectoSeleccionadoId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl shadow-2xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {proyectos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombreProyecto} ({p.alumnosFinal}/{p.alumnosProyectados} alum. • {formatearHNL(p.precioSugeridoAlumno || 0)})
                  </option>
                ))}
              </select>

              {proyectoActual && (
                <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-0.5">
                  <span className="font-semibold text-slate-700">Estado Ventas:</span>
                  <span className={`px-2 py-0.2 rounded font-bold text-[10px] ${
                    proyectoActual.alumnosFinal >= proyectoActual.puntoEquilibrioAlumnos
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {proyectoActual.alumnosFinal >= proyectoActual.puntoEquilibrioAlumnos
                      ? `Break-Even Cubierto (${proyectoActual.alumnosFinal}/${proyectoActual.puntoEquilibrioAlumnos})`
                      : `Faltan ${proyectoActual.puntoEquilibrioAlumnos - proyectoActual.alumnosFinal} p/equilibrio`}
                  </span>
                </div>
              )}
            </div>

            {/* 2. Matrícula Rápida en 1 Toque */}
            <div className="lg:col-span-4 space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="block text-[11px] font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                <span>2. Matrícula Express (+Alumnos):</span>
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSumarAlumnos(1)}
                  className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
                  title="Sumar 1 nuevo alumno matriculado"
                >
                  <span className="text-sm">+1</span>
                  <span className="text-[10px]">Alumno</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSumarAlumnos(3)}
                  className="py-1.5 px-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-400 rounded-lg text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
                  title="Sumar 3 nuevos alumnos matriculados (grupo pequeño)"
                >
                  <span className="text-sm">+3</span>
                  <span className="text-[10px]">Alumnos</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSumarAlumnos(5)}
                  className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
                  title="Sumar 5 nuevos alumnos matriculados (paquete empresarial)"
                >
                  <span className="text-sm">+5</span>
                  <span className="text-[10px]">Alumnos</span>
                </button>
              </div>
            </div>

            {/* 3. Acciones de Cierre: WhatsApp & Preventa */}
            <div className="lg:col-span-4 space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="block text-[11px] font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                <span>3. Cierre de Ventas WhatsApp:</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopiarTextoWhatsApp}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer border shadow-2xs ${
                    copiadoWhatsApp
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-green-500 hover:bg-green-600 text-white border-green-600'
                  }`}
                  title="Copiar texto con formato listo para enviar por WhatsApp"
                >
                  {copiadoWhatsApp ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiadoWhatsApp ? '¡Copiado!' : 'Copiar Copy WhatsApp'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCalibrarPreventaAutomatica}
                  className="py-1.5 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg text-xs font-black flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  title="Calibrar descuento preventa del 15% y fecha límite a 7 días"
                >
                  <Percent className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Early Bird (15% OFF)</span>
                </button>
              </div>
            </div>

          </div>

          {/* Barra de Herramientas de Simplificación Operativa Directa */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white px-2 py-0.5 rounded shadow-2xs">
                ⚡ Simplificación Activa
              </span>
              <span className="text-[11px] font-semibold text-slate-600">
                Herramientas inmediatas para cerrar ventas y liquidar comisiones:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onAbrirEmails && (
                <button
                  type="button"
                  onClick={onAbrirEmails}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  title="Abrir plantillas de correo institucional B2B y B2C"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-700" />
                  <span>Plantillas Correos B2B/B2C</span>
                </button>
              )}

              {onAbrirComisiones && (
                <button
                  type="button"
                  onClick={onAbrirComisiones}
                  className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  title="Calcular comisiones e incentivos por metas y break-even de asesores"
                >
                  <Calculator className="w-3.5 h-3.5 text-teal-700" />
                  <span>Calculadora Comisiones Asesores</span>
                </button>
              )}

              {onAbrirCotizadorCorporativo && (
                <button
                  type="button"
                  onClick={onAbrirCotizadorCorporativo}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  title="Generar e imprimir cotización empresarial formal en PDF con 15% ISV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-amber-700" />
                  <span>Cotizador B2B Imprimible / PDF</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
