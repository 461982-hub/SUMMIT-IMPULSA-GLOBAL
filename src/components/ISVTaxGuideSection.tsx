import React, { useState } from 'react';
import { 
  Receipt, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  FileText, 
  Calculator, 
  Building2, 
  GraduationCap, 
  Briefcase, 
  Users, 
  AlertTriangle,
  Info,
  DollarSign,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { REGLAS_ISV_SERVICIOS, ReglaISVServicio, calcularDesgloseFiscal } from '../utils/isvRules';
import { Moneda, ProyectoEducativo } from '../types';
import { formatearMoneda } from '../utils/calculations';
import { formatearCorrelativo } from '../utils/correlativoUtils';
import { SummitLogo } from './SummitLogo';

interface ISVTaxGuideSectionProps {
  moneda?: Moneda;
  proyectos?: ProyectoEducativo[];
}

export const ISVTaxGuideSection: React.FC<ISVTaxGuideSectionProps> = ({ 
  moneda = 'LPS' as const,
  proyectos = []
}) => {
  const monedaActual: Moneda = (moneda as Moneda) || 'LPS';
  const [servicioSeleccionado, setServicioSeleccionado] = useState<string>(REGLAS_ISV_SERVICIOS[0].id);
  const [precioNetoPrueba, setPrecioNetoPrueba] = useState<number>(3500);
  const [alumnosPrueba, setAlumnosPrueba] = useState<number>(10);

  const reglaActual = REGLAS_ISV_SERVICIOS.find(r => r.id === servicioSeleccionado) || REGLAS_ISV_SERVICIOS[0];
  const desglose = calcularDesgloseFiscal(precioNetoPrueba, reglaActual.gravaISV, reglaActual.tasaISV);
  const totalFacturadoAlumnos = desglose.precioFacturadoFinal * alumnosPrueba;
  const totalISVRecaudarSAR = desglose.isvMonto * alumnosPrueba;
  const totalIngresoNetoSUMMIT = desglose.precioNeto * alumnosPrueba;

  // Métricas del Portafolio Actual para el SAR
  const totalProgramas = proyectos.length;
  const programasGravados = proyectos.filter(p => p.aplicaISV).length;
  const programasExentos = proyectos.filter(p => !p.aplicaISV).length;

  const totalBaseGravada = proyectos
    .filter(p => p.aplicaISV)
    .reduce((acc, p) => acc + (p.precioSugeridoAlumno * (Number(p.alumnosFinal) || 4)), 0);

  const totalISVPorPagarSAR = totalBaseGravada * 0.15;

  const totalBaseExenta = proyectos
    .filter(p => !p.aplicaISV)
    .reduce((acc, p) => acc + (p.precioSugeridoAlumno * (Number(p.alumnosFinal) || 4)), 0);

  return (
    <div className="space-y-6">
      
      {/* Encabezado Principal de la Sección */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="bg-amber-50 p-2 rounded-2xl border border-amber-200/80 shadow-2xs shrink-0 mt-0.5">
            <SummitLogo variant="icon" size="sm" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-800 font-sans tracking-wide">SUMMIT IMPULSA GLOBAL</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                Régimen SAR 15% / Exención
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              Control Fiscal & Tratamiento del ISV
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Normativa tributaria oficial aplicada a programas educativos, capacitaciones y asesorías de <strong>SUMMIT IMPULSA GLOBAL</strong> (Summit Impulsa S. de R.L. • RTN: <span className="font-mono font-bold text-slate-800">05019026435770</span> • San Pedro Sula, Cortés, Honduras) de acuerdo a la Ley del Impuesto Sobre Ventas de Honduras y el SAR.
            </p>
          </div>
        </div>

        <div className="bg-amber-50 p-3 rounded-xl border border-amber-200/80 text-xs text-amber-900 shrink-0 self-start md:self-auto flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
          <div>
            <span className="font-bold block">Tasa General: 15% ISV</span>
            <span className="text-[11px] text-amber-800">Facturación & Traslado mensual a la SAR</span>
          </div>
        </div>
      </div>

      {/* Tabla Oficial Solicitada */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Tabla de Clasificación de Servicios y Aplicación del ISV</span>
            </h3>
            <p className="text-xs text-slate-500">
              Criterios de gravamen fiscal y obligaciones de retención y traslado
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200 self-start sm:self-auto font-mono">
            6 Categorías Tipificadas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <th className="py-3.5 px-6 w-1/3">Servicio</th>
                <th className="py-3.5 px-6 w-36 text-center">¿Grava ISV?</th>
                <th className="py-3.5 px-6">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 text-xs">
              {REGLAS_ISV_SERVICIOS.map((regla) => (
                <tr 
                  key={regla.id}
                  className={`transition-colors hover:bg-slate-50/80 ${
                    servicioSeleccionado === regla.id ? 'bg-amber-50/40' : ''
                  }`}
                >
                  <td className="py-4 px-6 align-top">
                    <div className="font-bold text-slate-900 text-[13px]">
                      {regla.servicio}
                    </div>
                    {regla.baseLegal && (
                      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1 font-mono">
                        <span>Ref: {regla.baseLegal}</span>
                      </div>
                    )}
                  </td>

                  <td className="py-4 px-6 align-top text-center">
                    {regla.gravaISV ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs whitespace-nowrap">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                        <span>✅ Sí (15%)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs whitespace-nowrap">
                        <XCircle className="w-3.5 h-3.5 text-emerald-700" />
                        <span>❌ Exento</span>
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-6 align-top text-slate-700 leading-relaxed">
                    <div className="font-medium">
                      {regla.observaciones}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulador Interactivo de Facturación con ISV */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md border border-slate-700/60 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/70 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Simulador de Facturación e Impacto ISV (SAR)</span>
                <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  En Vivo
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Verifique cómo calcular el ticket al cliente y el monto exacto a declarar a la SAR
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controles de Simulación */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Seleccione el Servicio a Cotizar
              </label>
              <select
                id="select-simulador-servicio-isv"
                value={servicioSeleccionado}
                onChange={(e) => setServicioSeleccionado(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-600 rounded-xl text-white font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none cursor-pointer"
              >
                {REGLAS_ISV_SERVICIOS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.servicio} ({r.etiquetaGrava})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Precio Base / Neto ({moneda})
                </label>
                <input
                  id="input-simulador-precio-neto"
                  type="number"
                  min="1"
                  step="50"
                  value={precioNetoPrueba}
                  onChange={(e) => setPrecioNetoPrueba(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-600 rounded-xl text-white font-mono font-bold focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Alumnos / Participantes
                </label>
                <input
                  id="input-simulador-alumnos-isv"
                  type="number"
                  min="1"
                  value={alumnosPrueba}
                  onChange={(e) => setAlumnosPrueba(Number(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-600 rounded-xl text-white font-mono font-bold focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs text-slate-300 space-y-1">
              <span className="font-bold text-amber-300 block">Dictamen Fiscal para este Servicio:</span>
              <p className="text-[11px] leading-relaxed">
                {reglaActual.observaciones}
              </p>
            </div>
          </div>

          {/* Resultados y Desglose Visual */}
          <div className="lg:col-span-7 bg-slate-800/90 rounded-xl p-5 border border-slate-700/80 flex flex-col justify-between space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-700/70 pb-3">
              <div className="text-xs font-semibold text-slate-300">
                Desglose por Alumno (Ticket Unitario)
              </div>
              <div>
                {reglaActual.gravaISV ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                    Aplica 15% ISV
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/40">
                    Exento de ISV (0%)
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700">
                <span className="text-[11px] text-slate-400 block mb-1">Precio Neto (SUMMIT)</span>
                <span className="text-sm sm:text-base font-bold font-mono text-white">
                  {formatearMoneda(desglose.precioNeto, monedaActual)}
                </span>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700">
                <span className="text-[11px] text-amber-400 block mb-1">+ ISV (15%)</span>
                <span className="text-sm sm:text-base font-bold font-mono text-amber-300">
                  {formatearMoneda(desglose.isvMonto, monedaActual)}
                </span>
              </div>

              <div className="bg-amber-400/10 p-3 rounded-lg border border-amber-400/40">
                <span className="text-[11px] text-amber-300 font-bold block mb-1">Precio Total Factura</span>
                <span className="text-sm sm:text-base font-black font-mono text-amber-400">
                  {formatearMoneda(desglose.precioFacturadoFinal, monedaActual)}
                </span>
              </div>
            </div>

            {/* Totales Generales del Grupo */}
            <div className="pt-3 border-t border-slate-700/70 space-y-2">
              <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Total Facturación del Grupo ({alumnosPrueba} participantes)</span>
                <span className="font-mono font-bold text-white text-sm">
                  {formatearMoneda(totalFacturadoAlumnos, monedaActual)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-700 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Ingreso Neto SUMMIT:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {formatearMoneda(totalIngresoNetoSUMMIT, monedaActual)}
                  </span>
                </div>

                <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-700 flex items-center justify-between text-xs">
                  <span className="text-amber-400 font-medium">A Trasladar a la SAR:</span>
                  <span className="font-mono font-bold text-amber-300">
                    {formatearMoneda(totalISVRecaudarSAR, monedaActual)}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Matriz Oficial de Correlativos y Declaración Fiscal SAR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <span>Libro de Control Correlativo & Declaración Fiscal SAR (ISV 15%)</span>
              </h3>
              <span className="text-[10px] font-mono uppercase bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded">
                Oficial
              </span>
            </div>
            <p className="text-xs text-blue-200 mt-0.5">
              Control secuencial automático por programa para emisión de facturas y liquidación tributaria ante el SAR
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-white/10 px-3 py-1 rounded-lg border border-white/20 font-mono text-white">
              {totalProgramas} Programas Registrados
            </span>
          </div>
        </div>

        {/* Resumen de Declaración Fiscal */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Prog. Gravados (15%)</span>
            <span className="text-base font-black text-amber-900 mt-0.5 block">{programasGravados} programas</span>
            <span className="text-[10px] text-amber-700">Facturan con 15% ISV</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Prog. Exentos (0%)</span>
            <span className="text-base font-black text-emerald-900 mt-0.5 block">{programasExentos} programas</span>
            <span className="text-[10px] text-emerald-700">Convenio / Formal</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Base Gravable Total</span>
            <span className="text-base font-black text-blue-900 font-mono mt-0.5 block">
              {formatearMoneda(totalBaseGravada, monedaActual)}
            </span>
            <span className="text-[10px] text-blue-700">Ventas netas gravadas</span>
          </div>

          <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-300 shadow-2xs">
            <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">Débito Fiscal ISV (SAR)</span>
            <span className="text-base font-black text-amber-950 font-mono mt-0.5 block">
              {formatearMoneda(totalISVPorPagarSAR, monedaActual)}
            </span>
            <span className="text-[10px] font-bold text-amber-800">Monto total a trasladar</span>
          </div>
        </div>

        {/* Tabla de Programas con Correlativo y SAR */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <th className="py-3 px-4 text-center">N° Correlativo</th>
                <th className="py-3 px-4">Código Programa</th>
                <th className="py-3 px-4">Correlativo Fiscal SAR</th>
                <th className="py-3 px-4">Nombre del Programa</th>
                <th className="py-3 px-4">Docente</th>
                <th className="py-3 px-4 text-center">Régimen ISV</th>
                <th className="py-3 px-4 text-right">Precio Sugerido / Alumno</th>
                <th className="py-3 px-4 text-right">Total Facturación</th>
                <th className="py-3 px-4 text-right text-amber-900 bg-amber-50">ISV 15% Traslado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {proyectos.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No hay programas registrados todavía. Registra un programa desde el botón "Nuevo Proyecto" para generar su correlativo automático.
                  </td>
                </tr>
              ) : (
                proyectos.map((p, idx) => {
                  const numCorrelativo = p.numeroCorrelativo || idx + 1;
                  const codPrograma = p.codigoPrograma || `SUM-2026-${String(numCorrelativo).padStart(3, '0')}`;
                  const codSAR = p.codigoFiscalSAR || `SAR-ISV-2026-${String(numCorrelativo).padStart(3, '0')}`;
                  const alumnos = Number(p.alumnosFinal) || 4;
                  const totalVenta = p.precioSugeridoAlumno * alumnos;
                  const isvMonto = p.aplicaISV ? totalVenta * 0.15 : 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-xs">
                          #{String(numCorrelativo).padStart(3, '0')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {codPrograma}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-purple-900">
                        <span className="bg-purple-50 border border-purple-200 px-2 py-0.5 rounded text-[11px]">
                          {codSAR}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {p.nombreProyecto}
                        <div className="text-[10px] text-slate-500 font-normal truncate max-w-xs">
                          {p.servicioFiscal || p.tipoProyecto}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {p.nombreDocente}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {p.aplicaISV ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            15% ISV
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            Exento (0%)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                        {formatearMoneda(p.precioSugeridoAlumno, monedaActual)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatearMoneda(totalVenta, monedaActual)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-amber-950 bg-amber-50/60">
                        {p.aplicaISV ? formatearMoneda(isvMonto, monedaActual) : <span className="text-emerald-700 font-normal">L 0.00 (Exento)</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tarjetas de Claves Normativas e Implicaciones para SUMMIT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Cobro y Traslado a la SAR</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Para servicios gravados al 15%, SUMMIT actúa como <strong>agente retenedor/recaudador</strong>. El ISV se suma al precio final cobrado al cliente y se declara mensualmente en la declaración jurada ante la SAR.
          </p>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            <span>Condición de Exención Académica</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Únicamente gozan de exención de ISV los programas que cuenten con aval, reconocimiento oficial o convenio formal de instituciones de <strong>educación superior acreditadas</strong> bajo el Consejo de Educación Superior.
          </p>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
            <FileText className="w-4 h-4 text-purple-600" />
            <span>Emisión de Facturas y CAI</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Toda venta debe respaldarse con documento fiscal con CAI vigente emitido por SUMMIT, detallando por separado el valor neto del servicio y el 15% de ISV (o indicando "Venta Exenta" si aplica convenio universitario).
          </p>
        </div>
      </div>

    </div>
  );
};
