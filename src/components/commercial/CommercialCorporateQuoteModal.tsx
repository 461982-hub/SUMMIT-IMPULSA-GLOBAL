import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Building2, 
  Users, 
  DollarSign, 
  Check, 
  Copy, 
  X, 
  Percent, 
  ShieldCheck, 
  Calendar,
  MessageCircle,
  FileCheck,
  Building
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { formatearHNL } from '../../utils/poa2026Data';

interface CommercialCorporateQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onNotificar?: (msg: string) => void;
}

export const CommercialCorporateQuoteModal: React.FC<CommercialCorporateQuoteModalProps> = ({
  isOpen,
  onClose,
  proyectos,
  moneda,
  onNotificar,
}) => {
  const [proyectoId, setProyectoId] = useState<string>(proyectos[0]?.id || '');
  const [empresaCliente, setEmpresaCliente] = useState<string>('Corporación Flores, S.A.');
  const [rtnCliente, setRtnCliente] = useState<string>('08019001234567');
  const [nombreContacto, setNombreContacto] = useState<string>('Lic. Claudia Morales');
  const [cargoContacto, setCargoContacto] = useState<string>('Directora de Talento Humano');
  const [correoContacto, setCorreoContacto] = useState<string>('cmorales@grupoflores.com');
  const [cantidadParticipantes, setCantidadParticipantes] = useState<number>(5);
  const [descuentoVolumenPct, setDescuentoVolumenPct] = useState<number>(10); // 10% por paquete de 5
  const [validezDias, setValidezDias] = useState<number>(15);
  const [copiado, setCopiado] = useState<boolean>(false);

  if (!isOpen) return null;

  const proyecto = proyectos.find((p) => p.id === proyectoId) || proyectos[0];

  const precioUnitarioBase = proyecto?.precioSugeridoAlumno || 2500;
  const precioUnitarioConDescuento = precioUnitarioBase * (1 - descuentoVolumenPct / 100);
  const subtotalBruto = cantidadParticipantes * precioUnitarioBase;
  const montoDescuento = subtotalBruto * (descuentoVolumenPct / 100);
  const subtotalNeto = subtotalBruto - montoDescuento;

  const aplicaISV = proyecto?.aplicaISV ?? true;
  const impuestoISV = aplicaISV ? subtotalNeto * 0.15 : 0;
  const totalFacturableHNL = subtotalNeto + impuestoISV;
  const totalUSD = totalFacturableHNL / 24.8; // Tasa referencial USD

  const fechaCotizacion = new Date();
  const fechaVencimiento = new Date();
  fechaVencimiento.setDate(fechaCotizacion.getDate() + validezDias);

  const correlativoCotizacion = `COT-B2B-2026-${String(Math.floor(Math.random() * 900) + 100)}`;

  const handleImprimir = () => {
    window.print();
  };

  const generarTextoWhatsApp = () => {
    return `*SUMMIT IMPULSA GLOBAL, S.A. DE C.V.* 🎓
*Cotización Corporativa Formal #${correlativoCotizacion}*

🏢 *Cliente:* ${empresaCliente}
👤 *Atención:* ${nombreContacto} (${cargoContacto})
📅 *Validez:* ${validezDias} días (hasta el ${fechaVencimiento.toLocaleDateString('es-HN')})

📘 *Programa Formativo:* ${proyecto?.nombreProyecto}
⏱️ *Duración:* ${proyecto?.horasDocente} horas académicas • ${proyecto?.modalidad}
👨‍🏫 *Docente Titular:* ${proyecto?.nombreDocente}

💼 *Detalle Económico Corporativo:*
• Participantes: ${cantidadParticipantes} colaboradores
• Precio Regular Unitario: ${formatearHNL(precioUnitarioBase)}
• Descuento por Volumen (${descuentoVolumenPct}%): -${formatearHNL(montoDescuento)}
• Subtotal: ${formatearHNL(subtotalNeto)}
• ISV SAR (15%): ${aplicaISV ? formatearHNL(impuestoISV) : 'Exento de ISV (Educación Formal)'}
--------------------------------------------------
*TOTAL FACTURABLE:* ${formatearHNL(totalFacturableHNL)} (Aprox. $${totalUSD.toFixed(2)} USD)

🏦 *Cuentas Oficiales:* Banco Ficohsa Cta. Cheques HNL 2000-1234-5678-90
RTN Summit: 08019024000000

¿Desea que le emitamos la orden de servicio formal?`;
  };

  const handleCopiarWhatsApp = () => {
    const texto = generarTextoWhatsApp();
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    if (onNotificar) onNotificar('¡Cotización corporativa para WhatsApp copiada!');
    setTimeout(() => setCopiado(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 print:max-w-none print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Encabezado No-Imprimible */}
        <div className="p-4 bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-amber-900 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-400/30">
              <FileSpreadsheet className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                  Cotizador Corporativo B2B Imprimible / PDF
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded-full">
                  SAR 15% ISV
                </span>
              </div>
              <p className="text-[11px] text-amber-200/90">
                Genere propuestas comerciales con desglose fiscal SAR, descuentos por volumen y firmas oficiales.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Panel de Configuración Rápida (No imprimible) */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs print:hidden">
          <div>
            <label className="block text-[10.5px] font-bold text-slate-600 uppercase mb-0.5">
              Empresa Cliente:
            </label>
            <input
              type="text"
              value={empresaCliente}
              onChange={(e) => setEmpresaCliente(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-[10.5px] font-bold text-slate-600 uppercase mb-0.5">
              Contacto RRHH / Cargo:
            </label>
            <input
              type="text"
              value={nombreContacto}
              onChange={(e) => setNombreContacto(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-[10.5px] font-bold text-slate-600 uppercase mb-0.5">
              Colaboradores en Paquete:
            </label>
            <div className="flex items-center gap-1.5">
              {[3, 5, 10, 15].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setCantidadParticipantes(num);
                    if (num >= 10) setDescuentoVolumenPct(15);
                    else if (num >= 5) setDescuentoVolumenPct(10);
                    else setDescuentoVolumenPct(5);
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-black text-xs border ${
                    cantidadParticipantes === num
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10.5px] font-bold text-slate-600 uppercase mb-0.5">
              Descuento Volumen (%):
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={descuentoVolumenPct}
                onChange={(e) => setDescuentoVolumenPct(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                min={0}
                max={50}
              />
              <span className="font-bold text-slate-500">%</span>
            </div>
          </div>
        </div>

        {/* Hoja de Cotización Formal (Imprimible en Alta Calidad) */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white text-slate-900 font-sans print:p-6 print:overflow-visible" id="hoja-cotizacion-b2b">
          
          {/* Encabezado Corporativo Oficial */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-base">
                  S
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
                    SUMMIT IMPULSA GLOBAL, S.A. DE C.V.
                  </h1>
                  <p className="text-[11px] text-slate-600 font-semibold">
                    Capacitación Ejecutiva, Dirección Estratégica & Formación Continua
                  </p>
                </div>
              </div>
              <div className="text-[10.5px] text-slate-500 mt-2 space-y-0.5">
                <p>RTN: <strong className="text-slate-800">08019024000000</strong> • Correo: comercializacion.summitg@gmail.com</p>
                <p>Edificio Torre Alianza, Piso 7, Tegucigalpa, M.D.C., Honduras • Tel: +504 2234-5678</p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-black rounded-lg uppercase tracking-wider">
                COTIZACIÓN CORPORATIVA
              </span>
              <p className="text-xs font-mono font-black text-slate-800 mt-1">
                {correlativoCotizacion}
              </p>
              <p className="text-[10.5px] text-slate-500 mt-1">
                Fecha: <strong>{fechaCotizacion.toLocaleDateString('es-HN')}</strong>
              </p>
              <p className="text-[10.5px] text-amber-700 font-bold">
                Válido hasta: {fechaVencimiento.toLocaleDateString('es-HN')}
              </p>
            </div>
          </div>

          {/* Datos del Cliente */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 mb-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Empresa / Razón Social:</span>
              <p className="font-black text-slate-900 text-sm">{empresaCliente}</p>
              <p className="text-slate-600">RTN: {rtnCliente || 'Consumidor Final / Por Notificar'}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Atención a:</span>
              <p className="font-black text-slate-900 text-sm">{nombreContacto}</p>
              <p className="text-slate-600">{cargoContacto} • {correoContacto}</p>
            </div>
          </div>

          {/* Tabla de Servicios Formativos */}
          <div className="border border-slate-300 rounded-xl overflow-hidden mb-5">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-black text-[11px] uppercase">
                  <th className="p-3">Descripción del Programa</th>
                  <th className="p-3 text-center">Modalidad / Horas</th>
                  <th className="p-3 text-center">Participantes</th>
                  <th className="p-3 text-right">Precio Unitario</th>
                  <th className="p-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                <tr>
                  <td className="p-3">
                    <p className="font-black text-slate-900">{proyecto?.nombreProyecto}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Docente: {proyecto?.nombreDocente} • Incluye diplomas oficiales, aula virtual y reportes de RRHH.
                    </p>
                  </td>
                  <td className="p-3 text-center font-bold">
                    {proyecto?.modalidad}
                    <span className="block text-[10px] text-slate-500">{proyecto?.horasDocente} hrs académicas</span>
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-slate-900 text-sm">
                    {cantidadParticipantes}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-700">
                    {formatearHNL(precioUnitarioBase)}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">
                    {formatearHNL(subtotalBruto)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Resumen Fiscal SAR y Totales */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
            
            {/* Cuentas Bancarias Institucionales */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[11px] space-y-1.5 flex-1 w-full sm:w-auto">
              <span className="text-[10px] font-black uppercase text-slate-700 block flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-blue-700" />
                <span>Datos Bancarios para Pago / Transferencia:</span>
              </span>
              <p className="text-slate-700">
                • <strong>Banco Ficohsa</strong>: Cta. Cheques HNL <strong>2000-1234-5678-90</strong>
              </p>
              <p className="text-slate-700">
                • <strong>Banco Atlántida</strong>: Cta. Cheques HNL <strong>1100-9876-5432-10</strong>
              </p>
              <p className="text-slate-600 text-[10px] pt-1 border-t border-slate-200">
                Beneficiario: <strong>Summit Impulsa Global, S.A. de C.V.</strong> (RTN 08019024000000)
              </p>
            </div>

            {/* Cuadro de Liquidación Fiscal */}
            <div className="w-full sm:w-72 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Bruto:</span>
                <span>{formatearHNL(subtotalBruto)}</span>
              </div>

              {descuentoVolumenPct > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Desc. Corporativo ({descuentoVolumenPct}%):</span>
                  <span>-{formatearHNL(montoDescuento)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-800 font-bold border-t border-slate-200 pt-1">
                <span>Subtotal Neto:</span>
                <span>{formatearHNL(subtotalNeto)}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>ISV (15% SAR):</span>
                <span>{aplicaISV ? formatearHNL(impuestoISV) : 'Exento (L. 0.00)'}</span>
              </div>

              <div className="flex justify-between text-slate-900 font-black text-sm border-t-2 border-slate-900 pt-1.5">
                <span className="font-sans">TOTAL A PAGAR:</span>
                <span className="text-slate-950">{formatearHNL(totalFacturableHNL)}</span>
              </div>

              <div className="text-right text-[10px] text-slate-500 font-sans">
                Equivalente aproximado: ${totalUSD.toFixed(2)} USD
              </div>
            </div>

          </div>

          {/* Firmas Autorizadas */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="w-44 border-b border-slate-800 mx-auto mb-1"></div>
              <p className="font-black text-slate-900">Lic. Marcio R. Aguilar</p>
              <p className="text-[10.5px] text-slate-500">Gerencia de Comercialización</p>
              <p className="text-[10px] text-slate-400">Summit Impulsa Global, S.A. de C.V.</p>
            </div>

            <div>
              <div className="w-44 border-b border-slate-800 mx-auto mb-1"></div>
              <p className="font-black text-slate-900">Dr. Walter René Pedroza</p>
              <p className="text-[10.5px] text-slate-500">Gerencia General / Dirección</p>
              <p className="text-[10px] text-slate-400">Summit Impulsa Global, S.A. de C.V.</p>
            </div>
          </div>

        </div>

        {/* Pie de Acciones (No imprimible) */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="text-[11px] text-slate-600">
            Formato oficial con CAI y desglose para deducción de impuesto sobre la renta empresarial.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopiarWhatsApp}
              className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                copiado
                  ? 'bg-emerald-600 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {copiado ? <Check className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
              <span>{copiado ? '¡Copiado!' : 'Copy Cotización WhatsApp'}</span>
            </button>

            <button
              type="button"
              onClick={handleImprimir}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4" />
              <span>🖨️ Imprimir / Guardar en PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
