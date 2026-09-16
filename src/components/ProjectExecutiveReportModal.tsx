import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  FileText, 
  CheckCircle2, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Building2, 
  BookOpen, 
  ShieldCheck, 
  Calendar, 
  Sparkles,
  Layers,
  Edit3,
  Receipt
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../types';
import { formatearMoneda } from '../utils/calculations';
import { exportarProyectoPDF } from '../utils/exportUtils';
import { SummitLogo } from './SummitLogo';
import { DocumentOfficialHeader } from './common/DocumentOfficialHeader';
import { DocumentOfficialFooter } from './common/DocumentOfficialFooter';

interface ProjectExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyecto: ProyectoEducativo | null;
  moneda: Moneda;
}

export const ProjectExecutiveReportModal: React.FC<ProjectExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  proyecto,
  moneda,
}) => {
  const [comentariosPersonalizados, setComentariosPersonalizados] = useState<string>('');
  const [responsableAcademica, setResponsableAcademica] = useState<string>('Gerencia Académica');
  const [responsableComercial, setResponsableComercial] = useState<string>('Gerencia de Comercialización');
  const [responsableGeneral, setResponsableGeneral] = useState<string>('Gerencia General (Finanzas)');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!isOpen || !proyecto) return null;

  const esRentable = proyecto.totalGananciasFinales >= 0;
  const fechaHoy = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleDescargarPDF = () => {
    setIsExporting(true);
    try {
      exportarProyectoPDF(proyecto, moneda, comentariosPersonalizados);
    } catch (err) {
      console.error('Error generando PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  const desgloseCostos = [
    { nombre: 'Honorarios Docente', detalle: `${proyecto.horasClase} hrs calculadas`, valor: proyecto.costoDocenteCalculado, porcentaje: ((proyecto.costoDocenteCalculado / proyecto.gastoTotalOperativo) * 100).toFixed(1) },
    { nombre: 'Plataforma Zoom', detalle: 'Licencia e infraestructura virtual', valor: proyecto.costoZoom, porcentaje: ((proyecto.costoZoom / proyecto.gastoTotalOperativo) * 100).toFixed(1) },
    { nombre: 'Papelería y Didácticos', detalle: 'Guías, certificados y materiales', valor: proyecto.costoPapeleria, porcentaje: ((proyecto.costoPapeleria / proyecto.gastoTotalOperativo) * 100).toFixed(1) },
    { nombre: 'Gastos Varios e Imprevistos', detalle: 'Fondo de contingencia operativa', valor: proyecto.gastosVarios, porcentaje: ((proyecto.gastosVarios / proyecto.gastoTotalOperativo) * 100).toFixed(1) },
  ];

  const escenariosMargen = [30, 40, 50, 80, 100].map(m => {
    const vReq = proyecto.gastoTotalOperativo * (1 + m / 100);
    const gOp = vReq - proyecto.gastoTotalOperativo;
    const pSug = proyecto.alumnosProyectados > 0 ? vReq / proyecto.alumnosProyectados : 0;
    return {
      margen: m,
      vReq,
      gOp,
      pSug,
      esActual: m === proyecto.margenGananciaOperativa,
    };
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white print:static">
      <div 
        id="modal-reporte-ejecutivo"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[94vh] print:max-h-none print:shadow-none print:border-none animate-in fade-in zoom-in-95 duration-150"
      >
        
        {/* Barra Superior Oficial Estandarizada (No se imprime) */}
        <DocumentOfficialHeader
          gerencia="general"
          titulo={`Reporte Ejecutivo de Rentabilidad • #${proyecto.id}`}
          subtitulo={proyecto.nombreProyecto}
          codigoDocumento={proyecto.codigoFiscalSAR || `SAR-ISV-2026-${String(proyecto.numeroCorrelativo || proyecto.id).padStart(3, '0')}`}
          folioCorrelativo={String(proyecto.numeroCorrelativo || proyecto.id).padStart(3, '0')}
          moneda={moneda}
          onClose={onClose}
          actions={
            <>
              <button
                id="btn-imprimir-reporte"
                onClick={handleImprimir}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
                title="Imprimir o Guardar como PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Imprimir</span>
              </button>

              <button
                id="btn-descargar-pdf-directo"
                onClick={handleDescargarPDF}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExporting ? 'Generando...' : 'Descargar PDF'}</span>
              </button>
            </>
          }
        />

        {/* Hoja Ejecutiva Estilizada (Simula página física A4) */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-slate-100/50 print:bg-white print:p-0">
          
          <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-6 sm:p-8 space-y-6 print:border-none print:shadow-none print:p-0">
            
            {/* Encabezado Corporativo SUMMIT */}
            <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <SummitLogo variant="horizontal" size="sm" showTagline={true} />
                <div className="text-[10px] text-slate-500 mt-1 pl-1 font-medium">
                  <span className="font-bold text-slate-800">Summit Impulsa S. de R.L.</span> • RTN: <span className="font-mono font-bold text-slate-900">05019026435770</span>
                  <br />
                  San Pedro Sula, Cortés, Honduras
                </div>
              </div>

              <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-900 border border-blue-300 mb-1">
                  <ShieldCheck className="w-3 h-3" />
                  INFORME EJECUTIVO OFICIAL
                </div>
                <div className="flex items-center justify-end gap-2 mt-0.5">
                  <span className="text-[11px] text-slate-500 font-medium">Control Correlativo:</span>
                  <span className="text-sm font-bold text-blue-700 font-mono">
                    #{String(proyecto.numeroCorrelativo || proyecto.id).padStart(3, '0')}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block font-mono">
                  Cód: <strong>{proyecto.codigoPrograma || `SUM-2026-${String(proyecto.numeroCorrelativo || proyecto.id).padStart(3, '0')}`}</strong>
                </span>
                <span className="text-[10px] text-purple-700 block font-mono">
                  SAR: <strong>{proyecto.codigoFiscalSAR || `SAR-ISV-2026-${String(proyecto.numeroCorrelativo || proyecto.id).padStart(3, '0')}`}</strong>
                </span>
              </div>
            </div>

            {/* Identificación del Proyecto */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    #{String(proyecto.numeroCorrelativo || proyecto.id).padStart(3, '0')}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-900 text-white">
                    {proyecto.tipoProyecto}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-200 text-slate-700">
                    Nivel: {proyecto.nivel}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                    proyecto.aplicaISV 
                      ? 'bg-amber-100 text-amber-900 border-amber-300' 
                      : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  }`}>
                    {proyecto.aplicaISV ? 'ISV 15% (SAR Gravado)' : 'ISV 0% (SAR Exento)'}
                  </span>
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                    proyecto.seLlevoACabo === 'Listo' || proyecto.seLlevoACabo === 'Sí' || proyecto.seLlevoACabo === 'Realizar'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                      : proyecto.seLlevoACabo === 'Denegado' || proyecto.seLlevoACabo === 'No' || proyecto.seLlevoACabo === 'Cancelado'
                      ? 'bg-rose-100 text-rose-900 border-rose-300'
                      : proyecto.seLlevoACabo === 'En proceso' || proyecto.seLlevoACabo === 'En curso'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-blue-100 text-blue-900 border-blue-300'
                  }`}>
                    {proyecto.seLlevoACabo === 'Listo' || proyecto.seLlevoACabo === 'Sí' || proyecto.seLlevoACabo === 'Realizar'
                      ? '✓ Dictamen: LISTO (Aprobado)'
                      : proyecto.seLlevoACabo === 'Denegado' || proyecto.seLlevoACabo === 'No' || proyecto.seLlevoACabo === 'Cancelado'
                      ? '✗ Dictamen: DENEGADO'
                      : proyecto.seLlevoACabo === 'En proceso' || proyecto.seLlevoACabo === 'En curso'
                      ? '⏳ Comercialización: EN PROCESO'
                      : '📋 Académica: PLANIFICADO'}
                  </span>
                </div>
              </div>

              <h2 className="text-lg font-black text-slate-900">
                {proyecto.nombreProyecto}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 text-xs text-slate-600">
                <div>
                  <strong>Docente Titular:</strong> {proyecto.nombreDocente}
                  {proyecto.docenteClasificacion && (
                    <span className="ml-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1 py-0.2 rounded">
                      {proyecto.docenteClasificacion}
                    </span>
                  )}
                </div>
                <div>
                  <strong>Contacto Docente:</strong>{' '}
                  <span className="font-mono text-slate-800">
                    {proyecto.docenteTelefono || 'N/A'} {proyecto.docenteCorreo ? `• ${proyecto.docenteCorreo}` : ''}
                  </span>
                </div>
                <div>
                  <strong>Programación:</strong> {proyecto.fechaProgramacion || 'N/A'}
                </div>
                <div>
                  <strong>Sección / Grupo:</strong> <span className="font-semibold text-blue-800">{proyecto.seccion || 'Sección A'}</span>
                </div>
                <div>
                  <strong>Días de Clase:</strong> <span className="font-medium text-slate-800">{proyecto.diasClase || 'Lunes, Miércoles y Viernes'}</span>
                </div>
                <div>
                  <strong>Horario:</strong> <span className="font-mono font-semibold text-slate-800">{proyecto.horario || '06:00 PM - 08:00 PM'}</span>
                </div>
                <div>
                  <strong>Método Comercial:</strong> <span className="font-semibold text-amber-800">{proyecto.metodoVenta}</span>
                </div>
                <div>
                  <strong>Encuesta de Satisfacción:</strong>{' '}
                  <span className="font-bold text-amber-600">
                    ★ {proyecto.calificacionCurso ? proyecto.calificacionCurso.toFixed(1) : '5.0'} / 5.0
                  </span>
                </div>
                <div>
                  <strong>Cierre de Ventas:</strong> {proyecto.fechaVenta || 'N/A'}
                </div>
              </div>

              {proyecto.objetivoGeneral && (
                <div className="mt-3 pt-2 border-t border-slate-200 text-xs text-slate-700 space-y-1">
                  <div>
                    <strong className="text-slate-900">Objetivo del Programa:</strong> {proyecto.objetivoGeneral}
                  </div>
                  {proyecto.temasAImpartir && (
                    <div className="bg-white p-2 rounded border border-slate-200 mt-1">
                      <strong className="text-slate-900 block mb-0.5">Temas a Impartir (Contenido Programático):</strong>
                      <p className="whitespace-pre-line text-slate-600 font-mono text-[11px] leading-relaxed">
                        {proyecto.temasAImpartir}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cuadrícula de Indicadores Clave (KPIs) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl border border-amber-300 bg-amber-50/60">
                <span className="text-[10px] font-bold text-amber-800 uppercase block">Gasto Total Operativo</span>
                <span className="text-base sm:text-lg font-black text-amber-950 font-mono mt-0.5 block">
                  {formatearMoneda(proyecto.gastoTotalOperativo, moneda)}
                </span>
                <span className="text-[10px] text-amber-700 block mt-0.5">
                  {proyecto.horasClase} hrs @ {formatearMoneda(proyecto.tarifaHoraDocente, moneda)}/h
                </span>
              </div>

              <div className="p-3 rounded-xl border border-blue-300 bg-blue-50/60">
                <span className="text-[10px] font-bold text-blue-800 uppercase block">Precio Sugerido Alumno</span>
                <span className="text-base sm:text-lg font-black text-blue-950 font-mono mt-0.5 block">
                  {formatearMoneda(proyecto.precioSugeridoAlumno, moneda)}
                </span>
                <span className="text-[10px] text-blue-700 block mt-0.5">
                  Margen: {proyecto.margenGananciaOperativa}%
                </span>
              </div>

              <div className="p-3 rounded-xl border border-slate-300 bg-slate-100/70">
                <span className="text-[10px] font-bold text-slate-700 uppercase block">Punto de Equilibrio</span>
                <span className="text-base sm:text-lg font-black text-slate-900 font-mono mt-0.5 block">
                  {proyecto.puntoEquilibrioAlumnos} Alumnos
                </span>
                <span className="text-[10px] text-slate-600 block mt-0.5">
                  Meta: {proyecto.alumnosProyectados} | Real: {proyecto.alumnosFinal}
                </span>
              </div>

              <div className={`p-3 rounded-xl border ${
                esRentable ? 'border-emerald-300 bg-emerald-50/70' : 'border-rose-300 bg-rose-50/70'
              }`}>
                <span className={`text-[10px] font-bold uppercase block ${
                  esRentable ? 'text-emerald-800' : 'text-rose-800'
                }`}>
                  Ganancia Neta Final
                </span>
                <span className={`text-base sm:text-lg font-black font-mono mt-0.5 block ${
                  esRentable ? 'text-emerald-950' : 'text-rose-950'
                }`}>
                  {formatearMoneda(proyecto.totalGananciasFinales, moneda)}
                </span>
                <span className={`text-[10px] block mt-0.5 ${
                  esRentable ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  ROI: {proyecto.roiPorcentaje.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* 1. Desglose de Gastos Operativos */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                1. Estructura de Gastos Operativos (Costos Fijos y Variables)
              </h3>
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-900 text-white font-semibold">
                  <tr>
                    <th className="p-2">Rubro de Costo</th>
                    <th className="p-2">Detalle Operativo</th>
                    <th className="p-2 text-right">Monto</th>
                    <th className="p-2 text-center">% Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {desgloseCostos.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2 font-semibold text-slate-800">{item.nombre}</td>
                      <td className="p-2 text-slate-500">{item.detalle}</td>
                      <td className="p-2 text-right font-mono font-bold text-slate-900">{formatearMoneda(item.valor, moneda)}</td>
                      <td className="p-2 text-center font-mono text-slate-600">{item.porcentaje}%</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                    <td colSpan={2} className="p-2 text-slate-900">TOTAL GASTO OPERATIVO CONSOLIDADO</td>
                    <td className="p-2 text-right font-mono text-amber-950 font-black">{formatearMoneda(proyecto.gastoTotalOperativo, moneda)}</td>
                    <td className="p-2 text-center font-mono">100.0%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 2. Análisis de Precios Sugeridos por Margen */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                2. Sensibilidad de Precios Sugeridos por Margen de Rentabilidad
              </h3>
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-blue-900 text-white font-semibold">
                  <tr>
                    <th className="p-2">Margen</th>
                    <th className="p-2 text-right">Venta Total Requerida</th>
                    <th className="p-2 text-right">Ganancia Base</th>
                    <th className="p-2 text-right">Precio Sugerido / Alumno</th>
                    <th className="p-2 text-center">Nivel de Rendimiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {escenariosMargen.map((esc) => (
                    <tr key={esc.margen} className={esc.esActual ? 'bg-blue-50/80 font-bold text-blue-900' : 'hover:bg-slate-50'}>
                      <td className="p-2 font-sans font-bold">
                        {esc.margen}% {esc.esActual && <span className="text-[10px] bg-blue-200 text-blue-800 px-1 py-0.5 rounded ml-1">Actual</span>}
                      </td>
                      <td className="p-2 text-right">{formatearMoneda(esc.vReq, moneda)}</td>
                      <td className="p-2 text-right text-emerald-700">+{formatearMoneda(esc.gOp, moneda)}</td>
                      <td className="p-2 text-right font-bold text-blue-900">{formatearMoneda(esc.pSug, moneda)}</td>
                      <td className="p-2 text-center font-sans text-slate-500">
                        {esc.margen <= 40 ? 'Estándar' : esc.margen <= 60 ? 'Recomendado' : 'Alto Rendimiento'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 3. Dictamen y Liquidación Fiscal ISV (SAR Honduras) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                  3. Régimen Fiscal y Liquidación de ISV (SAR Honduras)
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  proyecto.aplicaISV
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}>
                  {proyecto.aplicaISV ? 'Servicio Gravado (15% ISV)' : 'Servicio Exento de ISV (0%)'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Clasificación de Servicio:</span>
                  <span className="font-bold text-slate-900 block mt-0.5">
                    {proyecto.servicioFiscal || 'Servicios educativos no acreditados (talleres, cursos libres)'}
                  </span>
                  <p className="text-[11px] text-slate-600 mt-1 bg-white p-2 rounded border border-slate-200">
                    <strong>Normativa SAR:</strong> {proyecto.aplicaISV ? 'Al no contar con acreditación formal de Educación Superior, el servicio está gravado con el 15% de ISV y SUMMIT debe trasladarlo a la SAR.' : 'Programa avalado por convenio institucional acreditado, amparado en exención tributaria de la Ley de Educación Superior.'}
                  </p>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5 font-mono">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-sans text-slate-600">Precio Sugerido Neto (SUMMIT):</span>
                    <span className="font-bold text-slate-900">{formatearMoneda(proyecto.precioSugeridoAlumno, moneda)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-amber-800">
                    <span className="font-sans">ISV 15% por Alumno:</span>
                    <span className="font-bold">+{formatearMoneda(proyecto.isvPorAlumno || 0, moneda)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 font-bold text-blue-900">
                    <span className="font-sans">Precio Total Facturado Alumno:</span>
                    <span className="text-sm">
                      {formatearMoneda(
                        proyecto.precioSugeridoConISV || 
                        ((proyecto.precioSugeridoAlumno || 0) + (proyecto.aplicaISV ? (proyecto.isvPorAlumno || 0) : 0)), 
                        moneda
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 text-slate-600 font-sans">
                    <span>Total ISV a Trasladar a SAR ({proyecto.alumnosFinal} alum):</span>
                    <span className="font-mono font-bold text-amber-900">{formatearMoneda(proyecto.isvTotalTrasladarSAR || 0, moneda)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Diagnóstico Financiero & Recomendaciones */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                4. Diagnóstico Financiero y Recomendaciones
              </h3>

              <div className={`p-3 rounded-lg border text-xs font-medium ${
                proyecto.alumnosFinal < proyecto.puntoEquilibrioAlumnos
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : proyecto.alumnosFinal === proyecto.puntoEquilibrioAlumnos
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                <strong>Diagnóstico Operativo: </strong>
                {proyecto.alumnosFinal < proyecto.puntoEquilibrioAlumnos ? (
                  <span>
                    Déficit operativo: faltan {proyecto.puntoEquilibrioAlumnos - proyecto.alumnosFinal} alumno(s) para cubrir los costos fijos. Pérdida acumulada: {formatearMoneda(Math.abs(proyecto.totalGananciasFinales), moneda)}.
                  </span>
                ) : proyecto.alumnosFinal === proyecto.puntoEquilibrioAlumnos ? (
                  <span>
                    El proyecto se encuentra exactamente en su punto de equilibrio ({proyecto.puntoEquilibrioAlumnos} alumnos). Cubre costos sin generar margen neto.
                  </span>
                ) : (
                  <span>
                    Proyecto rentable. Cumplió los requerimientos operativos con {proyecto.alumnosFinal} alumnos inscritos y un retorno de inversión (ROI) del {proyecto.roiPorcentaje.toFixed(1)}%.
                  </span>
                )}
              </div>

              {/* Campo para comentarios personalizados en el reporte */}
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1 print:hidden">
                  Observaciones adicionales para el reporte (opcional):
                </label>
                <textarea
                  value={comentariosPersonalizados}
                  onChange={(e) => setComentariosPersonalizados(e.target.value)}
                  placeholder="Escriba aquí notas de dirección, acuerdos especiales con el docente o recomendaciones comerciales..."
                  rows={2}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none print:hidden"
                />
                {comentariosPersonalizados && (
                  <p className="hidden print:block text-xs italic text-slate-700 bg-white p-2 border border-slate-200 rounded">
                    <strong>Observaciones:</strong> "{comentariosPersonalizados}"
                  </p>
                )}
              </div>
            </div>

            {/* Firmas de Validación y Aprobación del Flujo Integral (3 Gerencias) */}
            <div className="pt-6 border-t border-slate-300">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-6 text-center">
                Validación & Cadena de Responsabilidad Integral (Proceso 1-2-3)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs text-slate-600">
                
                {/* 1. Académica */}
                <div className="border-t border-slate-400 pt-2 bg-slate-50/50 p-2 rounded">
                  <input
                    type="text"
                    value={responsableAcademica}
                    onChange={(e) => setResponsableAcademica(e.target.value)}
                    className="w-full text-center font-bold text-slate-900 bg-transparent border-none focus:outline-none text-xs"
                  />
                  <span className="text-[10px] text-blue-700 font-extrabold block mt-0.5">
                    1. Gerencia Académica
                  </span>
                  <span className="text-[9px] text-slate-500 block">
                    Elaboración Técnica & Currículo
                  </span>
                </div>

                {/* 2. Comercial */}
                <div className="border-t border-slate-400 pt-2 bg-slate-50/50 p-2 rounded">
                  <input
                    type="text"
                    value={responsableComercial}
                    onChange={(e) => setResponsableComercial(e.target.value)}
                    className="w-full text-center font-bold text-slate-900 bg-transparent border-none focus:outline-none text-xs"
                  />
                  <span className="text-[10px] text-emerald-700 font-extrabold block mt-0.5">
                    2. Gerencia Comercial
                  </span>
                  <span className="text-[9px] text-slate-500 block">
                    Venta & Captación de Alumnos
                  </span>
                </div>

                {/* 3. General */}
                <div className="border-t border-slate-400 pt-2 bg-slate-50/50 p-2 rounded">
                  <input
                    type="text"
                    value={responsableGeneral}
                    onChange={(e) => setResponsableGeneral(e.target.value)}
                    className="w-full text-center font-bold text-slate-900 bg-transparent border-none focus:outline-none text-xs"
                  />
                  <span className="text-[10px] text-purple-700 font-extrabold block mt-0.5">
                    3. Gerencia General
                  </span>
                  <span className="text-[9px] text-slate-500 block">
                    Dictamen Financiero & Rentabilidad
                  </span>
                </div>

              </div>
            </div>

            {/* Pie de Página de Respaldo Legal de la Hoja Oficial */}
            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-1 text-[10px] text-slate-500">
              <span>
                <strong className="text-slate-700">Summit Impulsa S. de R.L.</strong> • RTN: <strong className="font-mono text-slate-800">05019026435770</strong> • San Pedro Sula, Cortés, Honduras
              </span>
              <span className="font-mono text-slate-400">
                SAR Honduras • Validación Curricular & Financiera
              </span>
            </div>

          </div>

        </div>

        {/* Footer del Modal con Acciones y Respaldo Institucional */}
        <DocumentOfficialFooter
          gerencia="general"
          codigoDocumento={proyecto.codigoFiscalSAR || `SAR-ISV-2026-${String(proyecto.numeroCorrelativo || proyecto.id).padStart(3, '0')}`}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={handleDescargarPDF}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExporting ? 'Generando PDF...' : 'Descargar PDF'}</span>
              </button>
            </div>
          }
        />

      </div>
    </div>
  );
};
