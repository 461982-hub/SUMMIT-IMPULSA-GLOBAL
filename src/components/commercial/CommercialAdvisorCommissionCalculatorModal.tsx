import React, { useState } from 'react';
import { 
  Calculator, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Award, 
  Check, 
  Copy, 
  X, 
  Percent, 
  Sparkles,
  UserCheck,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { formatearHNL } from '../../utils/poa2027Data';

interface CommercialAdvisorCommissionCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onNotificar?: (msg: string) => void;
}

export const CommercialAdvisorCommissionCalculatorModal: React.FC<CommercialAdvisorCommissionCalculatorModalProps> = ({
  isOpen,
  onClose,
  proyectos,
  moneda,
  onNotificar,
}) => {
  const [proyectoId, setProyectoId] = useState<string>(proyectos[0]?.id || '');
  const [nombreAsesor, setNombreAsesor] = useState<string>('Lic. Marcio R. Aguilar');
  const [tipoComision, setTipoComision] = useState<'porcentaje' | 'fijo'>('porcentaje');
  const [tasaComisionPct, setTasaComisionPct] = useState<number>(10); // 10%
  const [comisionFijaPorAlumno, setComisionFijaPorAlumno] = useState<number>(300); // L. 300
  const [bonoBreakEven, setBonoBreakEven] = useState<number>(500); // L. 500 por superar punto equilibrio
  const [alumnosSimulados, setAlumnosSimulados] = useState<number>(
    proyectos[0]?.alumnosFinal || 6
  );
  const [copiado, setCopiado] = useState<boolean>(false);

  if (!isOpen) return null;

  const proyecto = proyectos.find((p) => p.id === proyectoId) || proyectos[0];

  const precioCobrado = proyecto?.precioRealCobradoAlumno || proyecto?.precioSugeridoAlumno || 2500;
  const breakEven = proyecto?.puntoEquilibrioAlumnos || 4;
  const facturacionTotal = alumnosSimulados * precioCobrado;

  // Cálculo de comisiones
  const comisionBase = tipoComision === 'porcentaje'
    ? facturacionTotal * (tasaComisionPct / 100)
    : alumnosSimulados * comisionFijaPorAlumno;

  const cumplioBreakEven = alumnosSimulados >= breakEven;
  const montoBonoBreakEven = cumplioBreakEven ? bonoBreakEven : 0;

  // Bono de aceleración por superar 10 alumnos
  const alumnosExcedentes = Math.max(0, alumnosSimulados - 10);
  const bonoAceleracionPOA = alumnosExcedentes * 150; // L. 150 extra por cada alumno sobre 10

  const totalComisiones = comisionBase + montoBonoBreakEven + bonoAceleracionPOA;

  // Costo docente y margen remanente
  const costoDocente = proyecto?.costoDocenteCalculado || (proyecto?.horasDocente || 40) * (proyecto?.costoPorHoraDocente || 300);
  const otrosCostos = (proyecto?.gastoPublicidad || 1200) + (proyecto?.plataformaVirtualZoom || 500) + (proyecto?.materialesDidacticos || 800);
  const costosTotalesConComision = costoDocente + otrosCostos + totalComisiones;
  const utilidadNetaEmpresa = facturacionTotal - costosTotalesConComision;
  const margenNetoEmpresa = facturacionTotal > 0 ? (utilidadNetaEmpresa / facturacionTotal) * 100 : 0;

  const generarLiquidacionTexto = () => {
    const ahora = new Date();
    return `SUMMIT IMPULSA GLOBAL, S.A. DE C.V.
LIQUIDACIÓN ESTIMADA DE COMISIONES Y METAS DE VENTAS
Fecha de Emisión: ${ahora.toLocaleDateString('es-HN')}
Asesor Comercial: ${nombreAsesor}
Programa Formativo: ${proyecto?.nombreProyecto || 'N/D'}

1. VOLUMEN DE VENTAS Y MATRÍCULA:
• Alumnos Matriculados: ${alumnosSimulados} participantes
• Precio Promedio por Alumno: ${formatearHNL(precioCobrado)}
• Facturación Total Bruta Generada: ${formatearHNL(facturacionTotal)}
• Punto de Equilibrio Requerido: ${breakEven} alumnos (Estado: ${cumplioBreakEven ? 'SUPERADO ✅' : 'PENDIENTE ⚠️'})

2. DESGLOSE DE COMISIONES E INCENTIVOS:
• Comisión Base (${tipoComision === 'porcentaje' ? `${tasaComisionPct}% de facturación` : `${formatearHNL(comisionFijaPorAlumno)} por alumno`}): ${formatearHNL(comisionBase)}
• Bono por Alcanzar Punto de Equilibrio: ${formatearHNL(montoBonoBreakEven)}
• Bono de Aceleración POA (>10 alumnos): ${formatearHNL(bonoAceleracionPOA)}
---------------------------------------------------------
TOTAL A LIQUIDAR AL ASESOR: ${formatearHNL(totalComisiones)}

3. CONTRIBUCIÓN INSTITUCIONAL:
• Costos Directos del Programa: ${formatearHNL(costoDocente + otrosCostos)}
• Superávit Neto para Summit Impulsa Global: ${formatearHNL(utilidadNetaEmpresa)} (${margenNetoEmpresa.toFixed(1)}% margen)`;
  };

  const handleCopiarLiquidacion = () => {
    const texto = generarLiquidacionTexto();
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    if (onNotificar) onNotificar('¡Liquidación de comisiones copiada al portapapeles!');
    setTimeout(() => setCopiado(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabecera */}
        <div className="p-4 bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-teal-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-500/20 text-teal-300 rounded-xl border border-teal-400/30">
              <Calculator className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                  Calculadora de Comisiones & Metas para Asesores
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full">
                  Transparente
                </span>
              </div>
              <p className="text-[11px] text-teal-200/90">
                Calcule en tiempo real incentivos por matrícula, bonos por superar el break-even y márgenes netos de la empresa.
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

        {/* Contenido interactivo */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Fila 1: Selector de Curso y Asesor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[10.5px] font-bold text-slate-600 uppercase mb-1">
                Programa Formativo:
              </label>
              <select
                value={proyectoId}
                onChange={(e) => {
                  setProyectoId(e.target.value);
                  const sel = proyectos.find((p) => p.id === e.target.value);
                  if (sel) setAlumnosSimulados(sel.alumnosFinal || 6);
                }}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
              >
                {proyectos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombreProyecto} ({p.alumnosFinal} matriculados)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-slate-600 uppercase mb-1">
                Nombre del Asesor / Ejecutivo de Ventas:
              </label>
              <input
                type="text"
                value={nombreAsesor}
                onChange={(e) => setNombreAsesor(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                placeholder="Ej: Lic. Marcio R. Aguilar"
              />
            </div>
          </div>

          {/* Fila 2: Parámetros del Esquema de Comisiones */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            
            <div>
              <label className="block text-[10.5px] font-bold text-slate-600 uppercase mb-1">
                Modalidad de Comisión:
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setTipoComision('porcentaje')}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs border ${
                    tipoComision === 'porcentaje'
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  % Porcentaje
                </button>
                <button
                  type="button"
                  onClick={() => setTipoComision('fijo')}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs border ${
                    tipoComision === 'fijo'
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  Monto Fijo
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-slate-600 uppercase mb-1">
                {tipoComision === 'porcentaje' ? 'Tasa de Comisión (%):' : 'Comisión por Alumno (HNL):'}
              </label>
              {tipoComision === 'porcentaje' ? (
                <div className="flex items-center gap-1.5">
                  {[8, 10, 12, 15].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setTasaComisionPct(pct)}
                      className={`px-2 py-1 rounded text-xs font-bold border ${
                        tasaComisionPct === pct
                          ? 'bg-teal-700 text-white border-teal-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="number"
                  value={comisionFijaPorAlumno}
                  onChange={(e) => setComisionFijaPorAlumno(Number(e.target.value))}
                  className="w-full px-3 py-1 bg-slate-50 border border-slate-300 rounded font-bold"
                  step={50}
                />
              )}
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-slate-600 uppercase mb-1">
                Bono por Superar Break-Even (≥ {breakEven} alum):
              </label>
              <input
                type="number"
                value={bonoBreakEven}
                onChange={(e) => setBonoBreakEven(Number(e.target.value))}
                className="w-full px-3 py-1 bg-slate-50 border border-slate-300 rounded font-bold"
                step={100}
              />
            </div>

          </div>

          {/* Fila 3: Simulador Dinámico de Alumnos */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-4 rounded-xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-teal-300 tracking-wider">
                  Simulador de Ventas del Asesor
                </span>
                <h4 className="text-base font-black text-white">
                  {alumnosSimulados} Alumnos Matriculados ({formatearHNL(facturacionTotal)} facturados)
                </h4>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAlumnosSimulados(Math.max(0, alumnosSimulados - 1))}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-black flex items-center justify-center text-base"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => setAlumnosSimulados(alumnosSimulados + 1)}
                  className="w-8 h-8 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-black flex items-center justify-center text-base"
                >
                  +
                </button>
              </div>
            </div>

            {/* Tarjetas de Métricas de Liquidación */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              
              <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                <span className="text-[10.5px] text-teal-200 block">Comisión Total Asesor</span>
                <span className="text-lg font-black text-emerald-300 font-mono">
                  {formatearHNL(totalComisiones)}
                </span>
                <span className="text-[10px] text-slate-300 block mt-0.5">
                  Base: {formatearHNL(comisionBase)} + Bonos: {formatearHNL(montoBonoBreakEven + bonoAceleracionPOA)}
                </span>
              </div>

              <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                <span className="text-[10.5px] text-indigo-200 block">Superávit Institucional Neto</span>
                <span className="text-lg font-black text-indigo-300 font-mono">
                  {formatearHNL(utilidadNetaEmpresa)}
                </span>
                <span className="text-[10px] text-slate-300 block mt-0.5">
                  Margen: {margenNetoEmpresa.toFixed(1)}% tras comisiones
                </span>
              </div>

              <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                <span className="text-[10.5px] text-amber-200 block">Estado Break-Even</span>
                <span className={`text-base font-black flex items-center gap-1 mt-0.5 ${
                  cumplioBreakEven ? 'text-emerald-300' : 'text-amber-300'
                }`}>
                  {cumplioBreakEven ? <Check className="w-4 h-4" /> : null}
                  {cumplioBreakEven ? 'Meta Alcanzada' : `Faltan ${breakEven - alumnosSimulados} alum.`}
                </span>
                <span className="text-[10px] text-slate-300 block mt-0.5">
                  Punto de equilibrio: {breakEven} participantes
                </span>
              </div>

            </div>
          </div>

        </div>

        {/* Pie de acciones */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500">
            Cálculo transparente para motivación de asesores y cumplimiento del POA Sep - Dic 2026.
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopiarLiquidacion}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                copiado
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiado ? '¡Liquidación Copiada!' : 'Copiar Ficha de Liquidación'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-300"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
