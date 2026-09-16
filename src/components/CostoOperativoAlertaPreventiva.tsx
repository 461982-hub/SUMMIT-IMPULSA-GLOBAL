import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Sliders, 
  ArrowLeft, 
  CheckCircle2, 
  Save, 
  TrendingUp, 
  Users, 
  DollarSign, 
  HelpCircle,
  X,
  Info
} from 'lucide-react';
import { Moneda } from '../types';
import { formatearMoneda } from '../utils/calculations';

export const UMBRAL_CRITICO_STORAGE_KEY = 'summit_umbral_critico_costo_operativo';

export const OBTENER_UMBRAL_POR_DEFECTO = (moneda: Moneda): number => {
  return moneda === 'USD' ? 250 : 5000;
};

export const PRESETS_UMBRAL_HNL = [3500, 4500, 5000, 6000, 8000];
export const PRESETS_UMBRAL_USD = [150, 200, 250, 300, 400];

export function cargarUmbralCriticoGuardado(moneda: Moneda): number {
  try {
    const saved = localStorage.getItem(UMBRAL_CRITICO_STORAGE_KEY);
    if (saved) {
      const val = parseFloat(saved);
      if (!isNaN(val) && val > 0) {
        return val;
      }
    }
  } catch (e) {
    console.warn('Error leyendo umbral crítico:', e);
  }
  return OBTENER_UMBRAL_POR_DEFECTO(moneda);
}

export function guardarUmbralCriticoStorage(valor: number): void {
  try {
    localStorage.setItem(UMBRAL_CRITICO_STORAGE_KEY, valor.toString());
  } catch (e) {
    console.warn('Error guardando umbral crítico:', e);
  }
}

// ----------------------------------------------------------------------
// 1. BANNER PREVENTIVO EN TIEMPO REAL (Para incluir en la sección de costos)
// ----------------------------------------------------------------------
interface CostoOperativoBannerPreventivoProps {
  gastoTotalOperativo: number;
  umbralCritico: number;
  moneda: Moneda;
  costoDocente: number;
  costosFijos: number;
  puntoEquilibrio: number;
  precioSugerido: number;
  alumnosProyectados: number;
  tarifaHoraDocente: number;
  horasClase: number;
  onCambiarUmbral: (nuevoUmbral: number) => void;
  ingresoTotalEsperado?: number;
}

export const CostoOperativoBannerPreventivo: React.FC<CostoOperativoBannerPreventivoProps> = ({
  gastoTotalOperativo,
  umbralCritico,
  moneda,
  costoDocente,
  costosFijos,
  puntoEquilibrio,
  precioSugerido,
  alumnosProyectados,
  tarifaHoraDocente,
  horasClase,
  onCambiarUmbral,
  ingresoTotalEsperado,
}) => {
  const [mostrarAjusteUmbral, setMostrarAjusteUmbral] = useState(false);
  const [umbralInput, setUmbralInput] = useState(umbralCritico.toString());

  const esCritico = gastoTotalOperativo > umbralCritico;
  const exceso = Math.max(0, gastoTotalOperativo - umbralCritico);
  const porcentajeExceso = umbralCritico > 0 ? ((exceso / umbralCritico) * 100).toFixed(1) : '0';
  const ratioBarra = Math.min(100, Math.round((gastoTotalOperativo / (umbralCritico || 1)) * 100));

  const pctDocente = gastoTotalOperativo > 0 ? Math.round((costoDocente / gastoTotalOperativo) * 100) : 0;
  const pctFijos = gastoTotalOperativo > 0 ? Math.round((costosFijos / gastoTotalOperativo) * 100) : 0;

  const pctSobreIngreso = ingresoTotalEsperado && ingresoTotalEsperado > 0 
    ? (gastoTotalOperativo / ingresoTotalEsperado) * 100 
    : 0;
  const excede60PctIngreso = gastoTotalOperativo > 0 && pctSobreIngreso > 60;

  const presets = moneda === 'USD' ? PRESETS_UMBRAL_USD : PRESETS_UMBRAL_HNL;

  const handleGuardarNuevoUmbral = (valor: number) => {
    if (valor > 0) {
      onCambiarUmbral(valor);
      guardarUmbralCriticoStorage(valor);
      setUmbralInput(valor.toString());
      setMostrarAjusteUmbral(false);
    }
  };

  return (
    <div 
      id="contenedor-alerta-costo-operativo-tiempo-real"
      className="space-y-2.5 transition-all duration-200"
    >
      {/* Barra de estado y configuración de umbral */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          {gastoTotalOperativo <= 0 ? (
            <span 
              id="badge-estado-costo-invalido"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-black bg-rose-100 text-rose-900 border border-rose-400 shadow-2xs animate-pulse"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>COSTO CERO INVÁLIDO ({formatearMoneda(0, moneda)}) • RESTRICCIÓN DE ENVÍO GG</span>
            </span>
          ) : esCritico ? (
            <span 
              id="badge-estado-costo-critico"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs animate-pulse"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>SUPERÓ UMBRAL CRÍTICO (+{formatearMoneda(exceso, moneda)} / +{porcentajeExceso}%)</span>
            </span>
          ) : (
            <span 
              id="badge-estado-costo-seguro"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Costo Seguro (≤ {formatearMoneda(umbralCritico, moneda)})</span>
            </span>
          )}

          {excede60PctIngreso && (
            <span 
              id="badge-banner-costo-excede-60-resaltado"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-black bg-amber-500 text-slate-950 border-2 border-amber-600 shadow-sm animate-pulse"
              title={`Alerta: El costo operativo representa el ${pctSobreIngreso.toFixed(1)}% del ingreso total esperado, superando el límite del 60%.`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-slate-950 shrink-0" />
              <span>⚠️ COSTO &gt; 60% DEL INGRESO ({pctSobreIngreso.toFixed(1)}%)</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            id="btn-configurar-umbral-critico"
            onClick={() => setMostrarAjusteUmbral(!mostrarAjusteUmbral)}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded shadow-2xs transition-colors cursor-pointer"
            title="Ajustar el umbral crítico institucional para este tipo de proyecto"
          >
            <Sliders className="w-3 h-3 text-slate-500" />
            <span>Umbral Crítico: <strong>{formatearMoneda(umbralCritico, moneda)}</strong></span>
          </button>
        </div>
      </div>

      {/* Selector de Presets de Umbral Desplegable */}
      {mostrarAjusteUmbral && (
        <div className="p-3 bg-white rounded-lg border border-slate-300 shadow-xs space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              Definir Umbral Crítico de Costo Operativo ({moneda})
            </span>
            <button
              type="button"
              onClick={() => setMostrarAjusteUmbral(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-slate-500">
            Si un proyecto supera este monto en sus costos operativos directos (docente + zoom + papelería + varios), el sistema emitirá avisos preventivos en tiempo real y solicitará confirmación antes de guardar.
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold text-slate-600 mr-1">Preajustes:</span>
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleGuardarNuevoUmbral(preset)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-colors ${
                  umbralCritico === preset
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {formatearMoneda(preset, moneda)}
                {preset === OBTENER_UMBRAL_POR_DEFECTO(moneda) && ' (Norma)'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="number"
              min="100"
              step="100"
              value={umbralInput}
              onChange={(e) => setUmbralInput(e.target.value)}
              placeholder="Ingresar valor personalizado..."
              className="px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono font-bold w-36"
            />
            <button
              type="button"
              onClick={() => handleGuardarNuevoUmbral(Number(umbralInput))}
              className="px-2.5 py-1 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded transition-colors"
            >
              Fijar Umbral
            </button>
          </div>
        </div>
      )}

      {/* AVISO PREVENTIVO EN TIEMPO REAL SI SE SUPERA EL UMBRAL */}
      {esCritico && (
        <div 
          id="banner-alerta-preventiva-tiempo-real"
          className="bg-rose-50 border-2 border-rose-300 rounded-xl p-3.5 space-y-3 shadow-xs text-xs animate-in fade-in duration-200"
        >
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-200 text-rose-800 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5 text-rose-700" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h4 className="font-extrabold text-rose-950 text-xs sm:text-sm">
                  Aviso Preventivo: Costo Operativo Supera el Umbral Crítico
                </h4>
                <span className="px-2 py-0.5 bg-rose-200 text-rose-900 font-mono font-black text-[11px] rounded">
                  Exceso: +{formatearMoneda(exceso, moneda)} (+{porcentajeExceso}%)
                </span>
              </div>
              <p className="text-rose-800 text-[11px] mt-1 leading-relaxed">
                El costo operativo calculado es de <strong>{formatearMoneda(gastoTotalOperativo, moneda)}</strong>, excediendo el límite institucional de <strong>{formatearMoneda(umbralCritico, moneda)}</strong>. Al intentar guardar, se le solicitará una confirmación preventiva adicional.
              </p>
            </div>
          </div>

          {/* Comparativa visual de barra de costo vs umbral */}
          <div className="space-y-1 bg-white/80 p-2.5 rounded-lg border border-rose-200">
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-700">
              <span>Costo Actual: {formatearMoneda(gastoTotalOperativo, moneda)}</span>
              <span>Límite Máximo: {formatearMoneda(umbralCritico, moneda)}</span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
              <div 
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.round((umbralCritico / (gastoTotalOperativo || 1)) * 100))}%` }}
                title="Rango dentro del umbral seguro"
              />
              <div 
                className="bg-rose-600 h-full transition-all duration-300 animate-pulse"
                style={{ width: `${Math.max(0, 100 - Math.min(100, Math.round((umbralCritico / (gastoTotalOperativo || 1)) * 100)))}%` }}
                title="Exceso por encima del umbral"
              />
            </div>
            <div className="flex items-center justify-between text-[9px] text-slate-500">
              <span className="text-emerald-700 font-bold">Zona Autorizada (≤ {formatearMoneda(umbralCritico, moneda)})</span>
              <span className="text-rose-700 font-bold">Zona Crítica (+{porcentajeExceso}%)</span>
            </div>
          </div>

          {/* Tarjetas de Diagnóstico de Composición del Costo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="bg-white p-2 rounded-lg border border-rose-200">
              <span className="text-[10px] text-slate-500 block">Honorarios Docente</span>
              <span className="font-mono font-bold text-slate-900 text-xs">
                {formatearMoneda(costoDocente, moneda)}
              </span>
              <span className="text-[9px] text-blue-600 font-semibold block">{pctDocente}% del total</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-rose-200">
              <span className="text-[10px] text-slate-500 block">Costos Fijos</span>
              <span className="font-mono font-bold text-slate-900 text-xs">
                {formatearMoneda(costosFijos, moneda)}
              </span>
              <span className="text-[9px] text-slate-500 font-semibold block">{pctFijos}% del total</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-rose-200">
              <span className="text-[10px] text-slate-500 block">Pto. Equilibrio Mín.</span>
              <span className="font-mono font-bold text-amber-700 text-xs">
                {puntoEquilibrio} alumnos
              </span>
              <span className="text-[9px] text-slate-500 block">para cubrir gastos</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-rose-200">
              <span className="text-[10px] text-slate-500 block">Precio Neto / Alumno</span>
              <span className="font-mono font-bold text-indigo-700 text-xs">
                {formatearMoneda(precioSugerido, moneda)}
              </span>
              <span className="text-[9px] text-slate-500 block">base {alumnosProyectados} alumnos</span>
            </div>
          </div>

          {/* Recomendaciones preventivas antes de guardar */}
          <div className="p-2.5 bg-rose-100/70 rounded-lg text-[11px] text-rose-900 space-y-1 border border-rose-200">
            <span className="font-bold flex items-center gap-1 text-rose-950">
              <Info className="w-3.5 h-3.5 text-rose-700" />
              Sugerencias de Ajuste Preventivo:
            </span>
            <ul className="list-disc list-inside space-y-0.5 text-[10px] text-rose-800 ml-1">
              <li>
                <strong>Tarifa o Duración:</strong> Actualmente proyecta <strong>{horasClase} horas</strong> a <strong>{formatearMoneda(tarifaHoraDocente, moneda)}/hora</strong>. Ajustar horas o tarifa reduce directamente el gasto operativo.
              </li>
              <li>
                <strong>Capacidad de Matrícula:</strong> Se requieren al menos <strong>{puntoEquilibrio} alumnos</strong> inscritos para no incurrir en déficit operativo.
              </li>
              <li>
                <strong>Aprobación:</strong> Si este curso requiere un presupuesto mayor por su nivel de especialización o docente internacional, podrá confirmar el guardado en el aviso preventivo.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};


// ----------------------------------------------------------------------
// 2. MODAL DE AVISO PREVENTIVO ANTES DE GUARDAR (Intercepta el submit)
// ----------------------------------------------------------------------
interface CostoOperativoModalPreventivoProps {
  isOpen: boolean;
  onClose: () => void; // Cancela para volver al formulario y revisar/ajustar
  onConfirmarGuardado: () => void; // Guarda a pesar de superar el umbral
  nombreProyecto: string;
  codigoPrograma: string;
  gastoTotalOperativo: number;
  umbralCritico: number;
  moneda: Moneda;
  costoDocente: number;
  costosFijos: number;
  puntoEquilibrio: number;
  precioSugeridoConISV: number;
  alumnosProyectados: number;
  esEdicion?: boolean;
}

export const CostoOperativoModalPreventivo: React.FC<CostoOperativoModalPreventivoProps> = ({
  isOpen,
  onClose,
  onConfirmarGuardado,
  nombreProyecto,
  codigoPrograma,
  gastoTotalOperativo,
  umbralCritico,
  moneda,
  costoDocente,
  costosFijos,
  puntoEquilibrio,
  precioSugeridoConISV,
  alumnosProyectados,
  esEdicion = false,
}) => {
  const [justificacion, setJustificacion] = useState('');
  const [checkEntendido, setCheckEntendido] = useState(true);

  if (!isOpen) return null;

  const exceso = Math.max(0, gastoTotalOperativo - umbralCritico);
  const porcentajeExceso = umbralCritico > 0 ? ((exceso / umbralCritico) * 100).toFixed(1) : '0';

  return (
    <div 
      id="modal-aviso-preventivo-costo-operativo"
      className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-rose-400 w-full max-w-xl overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200">
        
        {/* Cabecera del Aviso */}
        <div className="px-6 py-4 bg-rose-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-rose-900/60 px-2 py-0.5 rounded text-rose-200 border border-rose-500">
                  Control Financiero Preventivo
                </span>
                <span className="font-mono text-xs text-rose-100 font-bold">
                  {codigoPrograma}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                Aviso Preventivo: Costo Operativo Crítico
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Principal */}
        <div className="p-6 space-y-4 text-xs">
          
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-2">
            <p className="text-slate-800 text-xs leading-relaxed">
              El costo operativo registrado para el programa <strong>«{nombreProyecto || 'Sin Título'}»</strong> asciende a <strong>{formatearMoneda(gastoTotalOperativo, moneda)}</strong>, el cual <strong>supera en {formatearMoneda(exceso, moneda)} (+{porcentajeExceso}%)</strong> el umbral crítico institucional fijado en <strong>{formatearMoneda(umbralCritico, moneda)}</strong>.
            </p>
          </div>

          {/* Comparativa de Cifras Clave */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 font-medium block">Costo Ingresado</span>
              <span className="font-mono font-black text-rose-600 text-sm block mt-0.5">
                {formatearMoneda(gastoTotalOperativo, moneda)}
              </span>
              <span className="text-[9px] text-rose-700 font-bold">Exceso +{porcentajeExceso}%</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 font-medium block">Umbral Crítico</span>
              <span className="font-mono font-bold text-slate-700 text-sm block mt-0.5">
                {formatearMoneda(umbralCritico, moneda)}
              </span>
              <span className="text-[9px] text-emerald-600 font-semibold">Límite Seguro</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 font-medium block">Pto. de Equilibrio</span>
              <span className="font-mono font-black text-amber-700 text-sm block mt-0.5">
                {puntoEquilibrio} alumnos
              </span>
              <span className="text-[9px] text-slate-500 font-semibold">Meta para no perder</span>
            </div>
          </div>

          {/* Desglose de Impacto */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
            <div className="font-bold text-slate-800 text-[11px] flex items-center justify-between">
              <span>Impacto Financiero de este Registro:</span>
              <span className="text-indigo-700 font-mono">
                Precio Sugerido Alumno: {formatearMoneda(precioSugeridoConISV, moneda)}
              </span>
            </div>
            <ul className="list-disc list-inside text-slate-600 space-y-1 text-[11px]">
              <li>
                <strong>Honorarios Docentes:</strong> {formatearMoneda(costoDocente, moneda)} representará la mayor parte de la erogación.
              </li>
              <li>
                <strong>Riesgo de Deserción:</strong> Con un costo de {formatearMoneda(gastoTotalOperativo, moneda)}, una deserción de alumnos por debajo de {puntoEquilibrio} estudiantes generará saldo negativo inmediato.
              </li>
              <li>
                <strong>Recomendación:</strong> Se aconseja confirmar que Comercialización valide la venta a este precio o renegociar las horas de capacitación.
              </li>
            </ul>
          </div>

          {/* Confirmación y justificación */}
          <div className="space-y-2 pt-1 border-t border-slate-200">
            <label className="flex items-start gap-2 cursor-pointer select-none text-slate-700">
              <input
                type="checkbox"
                id="check-confirmacion-umbral"
                checked={checkEntendido}
                onChange={(e) => setCheckEntendido(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 mt-0.5 cursor-pointer"
              />
              <span className="text-[11px] font-medium leading-tight">
                He verificado la estructura de costos y confirmo el registro con este nivel de presupuesto operativo.
              </span>
            </label>

            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                Justificación u Observación del Sobrecosto (Opcional):
              </label>
              <input
                type="text"
                id="input-justificacion-sobrecosto"
                value={justificacion}
                onChange={(e) => setJustificacion(e.target.value)}
                placeholder="Ej: Aprobado por Dirección General para certificación especializada..."
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>

        </div>

        {/* Botones de Acción */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            id="btn-revisar-ajustar-costos"
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span>Revisar y Ajustar Costos</span>
          </button>

          <button
            type="button"
            id="btn-confirmar-guardar-sobrecosto"
            disabled={!checkEntendido}
            onClick={() => {
              onConfirmarGuardado();
            }}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-extrabold text-white rounded-lg shadow-sm transition-all cursor-pointer ${
              checkEntendido
                ? 'bg-rose-600 hover:bg-rose-700 active:scale-98'
                : 'bg-slate-400 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{esEdicion ? 'Confirmar y Guardar Cambios' : 'Confirmar y Registrar Proyecto'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
