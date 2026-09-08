import React, { useState } from 'react';
import { 
  Zap, 
  ShieldCheck, 
  CheckCheck, 
  FileText, 
  Copy, 
  Check, 
  DollarSign, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp, 
  Lock,
  Sparkles,
  Printer
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { emitirAprobacionFinalGerenciaGeneral } from '../../utils/poaMonthlyTrackingUtils';
import { formatearHNL } from '../../utils/poa2027Data';

interface ExecutiveFastApprovalBarProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto: (p: ProyectoEducativo) => void;
  onNotificar?: (mensaje: string) => void;
  esGGAutorizada?: boolean;
}

export const ExecutiveFastApprovalBar: React.FC<ExecutiveFastApprovalBarProps> = ({
  proyectos,
  moneda,
  onGuardarProyecto,
  onNotificar,
  esGGAutorizada = true,
}) => {
  const [expandido, setExpandido] = useState<boolean>(true);
  const [copiadoMinuta, setCopiadoMinuta] = useState<boolean>(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Proyectos pendientes de Aprobación Final por Gerencia General
  const pendientesAprobacionGG = proyectos.filter(
    (p) => !p.aprobacionFinalGerenciaGeneral && p.totalGananciasFinales >= 0
  );

  // Proyectos con dictamen pendiente ('Listo')
  const pendientesListo = proyectos.filter(
    (p) => p.seLlevoACabo !== 'Listo' && p.seLlevoACabo !== 'Sí' && p.totalGananciasFinales >= 0
  );

  // Facturación total de los pendientes
  const facturacionPendienteHNL = pendientesAprobacionGG.reduce(
    (acc, p) => acc + (p.ingresoTotalConISV || p.ingresoRealTotal || 0),
    0
  );

  // Handler: Aprobar en Lote todos los proyectos rentables
  const handleAprobarEnLote = () => {
    if (pendientesAprobacionGG.length === 0) return;

    let totalAprobados = 0;
    pendientesAprobacionGG.forEach((p) => {
      const aprobado = emitirAprobacionFinalGerenciaGeneral(
        p,
        'Dr. Walter Pedroza - Gerencia General',
        'Aprobado formalmente en lote por Gerencia General. Cumple rentabilidad y descuenta meta de facturación mensual del POA SEP - DIC 2026.',
        moneda
      );
      onGuardarProyecto(aprobado);
      totalAprobados++;
    });

    const msg = `¡Se aprobaron oficialmente ${totalAprobados} proyectos en lote! Facturación de ${formatearHNL(facturacionPendienteHNL)} rebajada del POA 2026.`;
    setMensajeExito(msg);
    if (onNotificar) onNotificar(msg);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  // Handler: Marcar 'Listo' a proyectos rentables
  const handleMarcarListoEnLote = () => {
    if (pendientesListo.length === 0) return;

    let totalListos = 0;
    pendientesListo.forEach((p) => {
      const actualizado: ProyectoEducativo = {
        ...p,
        seLlevoACabo: 'Listo',
        estadoAprobacion: 'Aprobado Internamente',
      };
      onGuardarProyecto(actualizado);
      totalListos++;
    });

    const msg = `¡Se marcaron ${totalListos} proyectos rentables como "Listo (Viabilidad Aprobada)"!`;
    setMensajeExito(msg);
    if (onNotificar) onNotificar(msg);
    setTimeout(() => setMensajeExito(null), 3500);
  };

  // Generador de Minuta Ejecutiva
  const generarMinutaEjecutiva = () => {
    const ahora = new Date();
    const totalFacturado = proyectos.reduce((acc, p) => acc + (p.ingresoRealTotal || 0), 0);
    const totalUtilidad = proyectos.reduce((acc, p) => acc + (p.totalGananciasFinales || 0), 0);
    const aprobadosGG = proyectos.filter((p) => p.aprobacionFinalGerenciaGeneral);

    return `SUMMIT IMPULSA GLOBAL, S.A. DE C.V.
GERENCIA GENERAL & DIRECCIÓN EJECUTIVA
ACTA EJECUTIVA DE CONTROL Y GOBERNANZA - POA SEP - DIC 2026
Fecha y Hora de Emisión: ${ahora.toLocaleString('es-HN')}
Emitido por: Dr. Walter René Pedroza - Gerente General

1. SÍNTESIS OPERATIVA INSTITUCIONAL:
• Total de Proyectos Registrados: ${proyectos.length}
• Proyectos Aprobados Formalmente por GG: ${aprobadosGG.length} de ${proyectos.length}
• Facturación Total Acumulada: ${formatearHNL(totalFacturado)}
• Superávit Neto Institucional: ${formatearHNL(totalUtilidad)}

2. ESTADO DEL PLAN OPERATIVO ANUAL (PILOTO SEP - DIC 2026):
• Meta Cuatrimestral de Facturación: L. 346,320.00
• Meta de Grupos Formativos: 74 grupos
• Punto de Equilibrio Institucional: 69 grupos (Break-Even)

3. DICTAMEN DE LA DIRECCIÓN:
Se valida el cumplimiento de las políticas de precios, márgenes de rentabilidad operativa y retenciones fiscales SAR. Todos los proyectos con dictamen oficial reducen la cuota pendiente del presupuesto mensual institucional.

Firma Oficial:
Dr. Walter René Pedroza
Gerencia General / Summit Impulsa Global, S.A. de C.V.`;
  };

  const handleCopiarMinuta = () => {
    const texto = generarMinutaEjecutiva();
    navigator.clipboard.writeText(texto);
    setCopiadoMinuta(true);
    if (onNotificar) onNotificar('¡Acta ejecutiva copiada al portapapeles!');
    setTimeout(() => setCopiadoMinuta(false), 3000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all">
      {/* Cabecera */}
      <div className="p-4 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-purple-400/20 text-purple-300 rounded-xl border border-purple-400/30">
            <Zap className="w-5 h-5 fill-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                Centro de Dictamen Express & Aprobación en Lote • Gerencia General
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-400/40 rounded-full">
                Dr. Walter Pedroza
              </span>
            </div>
            <p className="text-[11px] text-purple-200/90 mt-0.5">
              Simplifique la gobernanza: apruebe proyectos en lote para rebajar inmediatamente la facturación del POA SEP - DIC 2026 y emita minutas ejecutivas en 1 clic.
            </p>
          </div>
        </div>

        <button
          onClick={() => setExpandido(!expandido)}
          className="self-end sm:self-center px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/15"
        >
          <span>{expandido ? 'Ocultar Centro Express' : 'Mostrar Centro Express'}</span>
          {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Contenido expandible */}
      {expandido && (
        <div className="p-4 sm:p-5 bg-slate-50/60 border-t border-slate-200/80 space-y-4">
          
          {mensajeExito && (
            <div className="p-3 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{mensajeExito}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            
            {/* Tarjeta 1: Aprobación en Lote GG */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                    Aprobación POA 2026
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                    pendientesAprobacionGG.length > 0
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  }`}>
                    {pendientesAprobacionGG.length} Pendiente(s)
                  </span>
                </div>
                <h4 className="text-xs font-black text-slate-900">
                  Dictamen Final GG en Lote
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Aprueba formalmente todos los proyectos rentables y descuenta su facturación ({formatearHNL(facturacionPendienteHNL)}) de la meta mensual del POA.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAprobarEnLote}
                disabled={pendientesAprobacionGG.length === 0}
                className={`w-full py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-2xs ${
                  pendientesAprobacionGG.length > 0
                    ? 'bg-purple-700 hover:bg-purple-800 text-white cursor-pointer hover:shadow-sm active:scale-95'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {pendientesAprobacionGG.length > 0
                    ? `Aprobar ${pendientesAprobacionGG.length} Proy. en 1 Clic`
                    : 'Todo al día con Aprobación GG'}
                </span>
              </button>
            </div>

            {/* Tarjeta 2: Marcar 'Listo' a Proyectos Rentables */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                    Viabilidad Operativa
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                    pendientesListo.length > 0
                      ? 'bg-blue-100 text-blue-900 border-blue-300'
                      : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  }`}>
                    {pendientesListo.length} Por Validar
                  </span>
                </div>
                <h4 className="text-xs font-black text-slate-900">
                  Validación Masiva 'Listo'
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Cambia el estado de los proyectos solventes a "Listo (Aprobado)", habilitándolos inmediatamente para la firma oficial y emisión de syllabus.
                </p>
              </div>

              <button
                type="button"
                onClick={handleMarcarListoEnLote}
                disabled={pendientesListo.length === 0}
                className={`w-full py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-2xs ${
                  pendientesListo.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer hover:shadow-sm active:scale-95'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
              >
                <CheckCheck className="w-4 h-4" />
                <span>
                  {pendientesListo.length > 0
                    ? `Marcar 'Listo' (${pendientesListo.length})`
                    : 'Todos Validados'}
                </span>
              </button>
            </div>

            {/* Tarjeta 3: Copiar Minuta Ejecutiva Directiva */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                    Junta & Asambleas
                  </span>
                  <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                    Directorio
                  </span>
                </div>
                <h4 className="text-xs font-black text-slate-900">
                  Acta Ejecutiva Directiva
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Genera una síntesis directiva formal con el total de ingresos, superávit, proyectos dictaminados y estado del POA Sep - Dic 2026 para junta.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopiarMinuta}
                className={`w-full py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                  copiadoMinuta
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {copiadoMinuta ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiadoMinuta ? '¡Acta Copiada!' : 'Copiar Acta para Minuta'}</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
