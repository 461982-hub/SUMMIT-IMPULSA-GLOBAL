import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Layers, 
  FileText, 
  FileDown, 
  Printer, 
  RotateCcw, 
  Sparkles, 
  ArrowRight,
  ClipboardCheck,
  Building2,
  Scale
} from 'lucide-react';
import { ProyectoEducativo, Moneda, RegistroCierreMensual, ChecklistCierreMensual } from '../types';
import { formatearMoneda } from '../utils/calculations';
import { formatearHNL } from '../utils/poa2026Data';
import { formatearEtiquetaMes } from '../utils/monthUtils';
import { 
  calcularRegistroCierreMes, 
  ejecutarCierreMensual, 
  reabrirMesCierre, 
  cargarCierresMensuales,
  META_MENSUAL_PROYECTOS_POA,
  BREAK_EVEN_PROYECTOS_POA,
  MARGEN_POA_META_PCT
} from '../utils/monthlyCloseUtils';
import { exportarReporteMensualConsolidadoPDF } from '../utils/monthlyPdfExportUtils';

interface CierreMensualModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  mesInicial?: string;
  onActualizarProyectos: (proyectosActualizados: ProyectoEducativo[]) => void;
  onNotificar?: (mensaje: string) => void;
}

export const CierreMensualModal: React.FC<CierreMensualModalProps> = ({
  isOpen,
  onClose,
  proyectos,
  moneda,
  mesInicial,
  onActualizarProyectos,
  onNotificar,
}) => {
  // Lista de todos los meses presentes en los proyectos o meses clave POA 2026 (Sep - Dic)
  const listaMeses = useMemo(() => {
    const mesesSet = new Set<string>();
    proyectos.forEach((p) => {
      const fecha = p.mesControl || p.fechaProgramacion || p.fechaVenta;
      if (fecha && /^\d{4}-\d{2}/.test(fecha)) {
        mesesSet.add(fecha.slice(0, 7));
      }
    });

    // Si no hay proyectos, al menos tener el mes actual
    if (mesesSet.size === 0) {
      const hoy = new Date();
      const anio = hoy.getFullYear();
      const mes = String(hoy.getMonth() + 1).padStart(2, '0');
      mesesSet.add(`${anio}-${mes}`);
    }

    return Array.from(mesesSet).sort();
  }, [proyectos]);

  const [mesSeleccionado, setMesSeleccionado] = useState<string>(() => {
    if (mesInicial && listaMeses.includes(mesInicial)) return mesInicial;
    return listaMeses[listaMeses.length - 1] || '2026-09';
  });

  useEffect(() => {
    if (mesInicial && listaMeses.includes(mesInicial)) {
      setMesSeleccionado(mesInicial);
    }
  }, [mesInicial, listaMeses]);

  // Cierres cargados
  const [cierresGuardados, setCierresGuardados] = useState<Record<string, RegistroCierreMensual>>(() => cargarCierresMensuales());

  // Registro actual calculado
  const registroActual = useMemo(() => {
    return calcularRegistroCierreMes(mesSeleccionado, proyectos, moneda, cierresGuardados[mesSeleccionado]);
  }, [mesSeleccionado, proyectos, moneda, cierresGuardados]);

  // Estados locales para el formulario de cierre
  const [cerradoPor, setCerradoPor] = useState<string>('Ing. Walter Pedroza');
  const [cargoCerrador, setCargoCerrador] = useState<string>('Gerencia General');
  const [observaciones, setObservaciones] = useState<string>('');
  const [planAccion, setPlanAccion] = useState<string>('');
  const [checklist, setChecklist] = useState<ChecklistCierreMensual>({
    alumnosConciliados: false,
    docentesHonorariosPagados: false,
    marketingConciliado: false,
    fiscalidadSARRevisada: false,
    actaDirectivaFirmada: false,
  });

  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [mostrarConfirmReapertura, setMostrarConfirmReapertura] = useState(false);
  const [motivoReapertura, setMotivoReapertura] = useState('');

  // Sincronizar campos al cambiar de mes
  useEffect(() => {
    if (registroActual) {
      setCerradoPor(registroActual.cerradoPor || 'Ing. Walter Pedroza');
      setCargoCerrador(registroActual.cargoCerrador || 'Gerencia General');
      setObservaciones(registroActual.observaciones || '');
      setPlanAccion(registroActual.planAccionSiguienteMes || '');
      setChecklist(registroActual.checklist || {
        alumnosConciliados: false,
        docentesHonorariosPagados: false,
        marketingConciliado: false,
        fiscalidadSARRevisada: false,
        actaDirectivaFirmada: false,
      });
      setMostrarConfirmReapertura(false);
    }
  }, [registroActual.mesKey]);

  if (!isOpen) return null;

  // Cursos de este mes
  const proyectosMes = proyectos.filter((p) => {
    const fecha = p.mesControl || p.fechaProgramacion || p.fechaVenta;
    return fecha && fecha.startsWith(mesSeleccionado);
  });

  // Ejecución de Cierre
  const handleEjecutarCierre = () => {
    const todosChecked = checklist.alumnosConciliados && 
                         checklist.docentesHonorariosPagados && 
                         checklist.marketingConciliado && 
                         checklist.fiscalidadSARRevisada;

    if (!todosChecked) {
      if (!window.confirm('Hay elementos pendientes en el checklist directivo de conciliación. ¿Desea proceder y asentar el cierre mensual de todas formas?')) {
        return;
      }
    }

    const res = ejecutarCierreMensual(
      mesSeleccionado,
      {
        cerradoPor,
        cargoCerrador,
        observaciones,
        planAccionSiguienteMes: planAccion,
        checklist,
      },
      proyectos,
      moneda
    );

    setCierresGuardados(res.todosCierres);
    onActualizarProyectos(res.proyectosActualizados);

    if (onNotificar) {
      onNotificar(`✅ Periodo de ${registroActual.etiquetaMes} cerrado y auditado exitosamente.`);
    }
  };

  // Reapertura
  const handleReabrirMes = () => {
    if (!motivoReapertura.trim()) {
      alert('Por favor ingrese el motivo institucional de reapertura.');
      return;
    }

    const res = reabrirMesCierre(
      mesSeleccionado,
      cerradoPor,
      motivoReapertura,
      proyectos,
      moneda
    );

    setCierresGuardados(res.todosCierres);
    onActualizarProyectos(res.proyectosActualizados);
    setMostrarConfirmReapertura(false);
    setMotivoReapertura('');

    if (onNotificar) {
      onNotificar(`🔓 Periodo de ${registroActual.etiquetaMes} reabierto para edición.`);
    }
  };

  // Exportar Acta PDF
  const handleExportarActaPDF = async () => {
    try {
      setIsExportingPDF(true);
      const comentarios = `ACTA OFICIAL DE CIERRE MENSUAL (${registroActual.estado})\nDictamen Directivo: ${registroActual.dictamen}\nCerrado por: ${registroActual.cerradoPor || cerradoPor} (${registroActual.cargoCerrador || cargoCerrador})\nObservaciones: ${registroActual.observaciones || observaciones || 'Sin observaciones adicionales.'}\nPlan de Acción: ${registroActual.planAccionSiguienteMes || planAccion || 'Continuidad de operaciones.'}`;
      
      const res = await exportarReporteMensualConsolidadoPDF({
        mesKey: mesSeleccionado,
        proyectos,
        moneda,
        incluirGraficos: true,
        comentariosPersonalizados: comentarios,
        autorizadoPor: registroActual.cerradoPor || cerradoPor,
      });

      if (onNotificar) {
        onNotificar(`✅ Acta de cierre de ${res.etiquetaMes} exportada correctamente.`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error al generar Acta PDF: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const estaCerrado = registroActual.estado === 'CERRADO_AUDITADO';
  const esDeficit = registroActual.dictamen === 'DEFICIT_CRITICO';
  const esCumplido = registroActual.dictamen === 'CUMPLIDO_POA' || registroActual.dictamen === 'SOBRESALIENTE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Cabecera Principal */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-start justify-between gap-4 border-b border-indigo-900">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                GOBERNANZA & AUDITORÍA DIRECTIVA
              </span>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                estaCerrado 
                  ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400/50'
                  : 'bg-amber-500/30 text-amber-200 border-amber-400/50'
              }`}>
                {estaCerrado ? '🔒 Mes Cerrado & Auditado' : '🔓 Mes Abierto en Ejecución'}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-indigo-400" />
              <span>Cierre Mensual de Proyectos: POA SEP - DIC 2026</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl">
              Conciliación operativa, liquidación de honorarios docentes, comprobación de metas mensuales (18.5 grupos piloto POA / 17.25 grupos Break-Even) y emisión del Acta Oficial de Cierre.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Selección de Mes y Estado */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Periodo a Evaluar:</span>
            <select
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(e.target.value)}
              className="bg-white border border-slate-300 text-slate-900 text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {listaMeses.map((m) => {
                const c = cierresGuardados[m];
                const cerr = c?.estado === 'CERRADO_AUDITADO';
                return (
                  <option key={m} value={m}>
                    {formatearEtiquetaMes(m)} {cerr ? '✓ (Cerrado)' : '(Abierto)'}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {estaCerrado && (
              <span className="text-xs text-slate-500 font-mono">
                Cerrado el {new Date(registroActual.fechaCierre!).toLocaleDateString('es-HN')} por {registroActual.cerradoPor}
              </span>
            )}
            <button
              onClick={handleExportarActaPDF}
              disabled={isExportingPDF}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>{isExportingPDF ? 'Generando Acta...' : 'Exportar Acta PDF'}</span>
            </button>
          </div>
        </div>

        {/* Contenido Desplazable */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">

          {/* Alertas del Mes */}
          {registroActual.alertas.length > 0 && (
            <div className={`p-4 rounded-xl border ${
              esDeficit 
                ? 'bg-rose-50 border-rose-200 text-rose-900' 
                : esCumplido
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center gap-2 mb-1.5">
                {esDeficit ? (
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                ) : esCumplido ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                )}
                <h4 className="text-xs font-black uppercase tracking-wide">
                  Diagnóstico y Alertas del Periodo: {registroActual.dictamen.replace('_', ' ')}
                </h4>
              </div>
              <ul className="text-xs space-y-1 list-disc list-inside">
                {registroActual.alertas.map((al, idx) => (
                  <li key={idx} className="leading-relaxed">{al}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Tarjetas de Métricas de Cumplimiento POA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* 1. Proyectos / Cursos */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase">Cartera de Cursos</span>
                <Layers className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {registroActual.proyectosRegistrados}
                </span>
                <span className="text-xs text-slate-500">
                  / Meta {META_MENSUAL_PROYECTOS_POA} POA
                </span>
              </div>
              {/* Barra de progreso hacia break-even (4) y meta (10) */}
              <div className="space-y-1">
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                  <div 
                    className={`h-full transition-all ${
                      registroActual.proyectosRegistrados >= 10 
                        ? 'bg-emerald-500' 
                        : registroActual.proyectosRegistrados >= 4 
                        ? 'bg-amber-500' 
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, (registroActual.proyectosRegistrados / 10) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0</span>
                  <span className="text-amber-600 font-bold">B-Even: 4</span>
                  <span className="text-emerald-600 font-bold">Meta: 10</span>
                </div>
              </div>
            </div>

            {/* 2. Facturación Real */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase">Facturación del Mes</span>
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-lg font-black text-blue-950 font-mono">
                {formatearHNL(registroActual.ingresoRealHNL)}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                <span>Plan POA Trimestre:</span>
                <span className="font-mono font-bold">{formatearHNL(registroActual.ingresoMetaPOAHNL)}</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Cumplimiento: {((registroActual.ingresoRealHNL / (registroActual.ingresoMetaPOAHNL || 1)) * 100).toFixed(1)}%
              </div>
            </div>

            {/* 3. Gastos Operativos */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase">Gastos Operativos</span>
                <Building2 className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-lg font-black text-slate-900 font-mono">
                {formatearHNL(registroActual.gastoRealHNL)}
              </div>
              <div className="text-[11px] text-slate-500">
                Honorarios docentes, plataforma y marketing
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {registroActual.alumnosReales} alumnos matriculados
              </div>
            </div>

            {/* 4. Superávit y Margen */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase">Superávit & Margen</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className={`text-lg font-black font-mono ${
                registroActual.superavitNetoHNL >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {formatearHNL(registroActual.superavitNetoHNL)}
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Margen Real:</span>
                <span className={`font-mono font-bold ${
                  registroActual.margenOperativoReal >= MARGEN_POA_META_PCT ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                  {registroActual.margenOperativoReal.toFixed(1)}% (POA {MARGEN_POA_META_PCT}%)
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                {registroActual.superavitNetoHNL >= 0 ? '🟢 Rentabilidad Positiva' : '🔴 Periodo en Pérdida'}
              </div>
            </div>

          </div>

          {/* Tabla de Cursos Impartidos en el Mes */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-3.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-bold text-slate-800">
                  Cursos Conciliados en {registroActual.etiquetaMes} ({proyectosMes.length})
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Break-Even: {BREAK_EVEN_PROYECTOS_POA} cursos mín. | Meta: {META_MENSUAL_PROYECTOS_POA} cursos
              </span>
            </div>

            {proyectosMes.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No hay cursos registrados para este mes. Formula proyectos en Gerencia Académica con fecha de programación en este mes.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Curso / Programa</th>
                      <th className="py-2.5 px-2">Docente</th>
                      <th className="py-2.5 px-2 text-center">Alumnos</th>
                      <th className="py-2.5 px-3 text-right">Ingreso</th>
                      <th className="py-2.5 px-3 text-right">Gasto</th>
                      <th className="py-2.5 px-3 text-right">Ganancia</th>
                      <th className="py-2.5 px-2 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {proyectosMes.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {p.nombreProyecto}
                        </td>
                        <td className="py-2.5 px-2 text-slate-600">{p.nombreDocente}</td>
                        <td className="py-2.5 px-2 text-center font-mono">{p.alumnosFinal || p.alumnosProyectados}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-blue-950">
                          {formatearMoneda(p.ingresoRealTotal || 0, moneda)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          {formatearMoneda(p.gastoTotalOperativo || 0, moneda)}
                        </td>
                        <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                          (p.totalGananciasFinales || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {formatearMoneda(p.totalGananciasFinales || 0, moneda)}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.seLlevoACabo === 'Sí' ? 'bg-emerald-100 text-emerald-800' :
                            p.seLlevoACabo === 'En curso' ? 'bg-blue-100 text-blue-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {p.seLlevoACabo}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Checklist Directivo de Cierre & Auditoría */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ClipboardCheck className="w-4 h-4 text-indigo-600" />
                <span>Checklist de Conciliación y Cumplimiento de Cierre</span>
              </h3>
              <span className="text-[11px] text-slate-500">
                Verificación previa al sellado mensual
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={checklist.alumnosConciliados}
                  disabled={estaCerrado}
                  onChange={(e) => setChecklist({ ...checklist, alumnosConciliados: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-slate-700">1. Alumnos y matrículas 100% conciliadas</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={checklist.docentesHonorariosPagados}
                  disabled={estaCerrado}
                  onChange={(e) => setChecklist({ ...checklist, docentesHonorariosPagados: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-slate-700">2. Honorarios docentes y retenciones (Art. 50 SAR) validadas</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={checklist.marketingConciliado}
                  disabled={estaCerrado}
                  onChange={(e) => setChecklist({ ...checklist, marketingConciliado: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-slate-700">3. Pauta comercial y comisiones publicitarias conciliadas</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={checklist.fiscalidadSARRevisada}
                  disabled={estaCerrado}
                  onChange={(e) => setChecklist({ ...checklist, fiscalidadSARRevisada: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-slate-700">4. Facturación, ISV 15% y Exoneraciones SAR comprobadas</span>
              </label>
            </div>
          </div>

          {/* Formulario de Cierre Directivo / Dictamen */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-4 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-indigo-600" />
              <span>Dictamen Institucional de Cierre</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Auditor / Responsable del Cierre:
                </label>
                <input
                  type="text"
                  value={cerradoPor}
                  disabled={estaCerrado}
                  onChange={(e) => setCerradoPor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Cargo Directivo:
                </label>
                <input
                  type="text"
                  value={cargoCerrador}
                  disabled={estaCerrado}
                  onChange={(e) => setCargoCerrador(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Observaciones y Hallazgos del Periodo:
              </label>
              <textarea
                value={observaciones}
                disabled={estaCerrado}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Indique si se cumplieron los objetivos, desvíos en honorarios docentes o incidencias de matrícula..."
                rows={2}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Plan de Acción y Compromisos para el Siguiente Mes:
              </label>
              <textarea
                value={planAccion}
                disabled={estaCerrado}
                onChange={(e) => setPlanAccion(e.target.value)}
                placeholder="Acciones comerciales correctivas, apertura de nuevas cohortes, ajuste de pauta publicitaria..."
                rows={2}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
              />
            </div>

            {/* Bloque de Acciones: Sellar Cierre vs Reabrir */}
            <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                {estaCerrado ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-700 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Periodo Sellado y Auditado Oficialmente</span>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">
                    Al ejecutar el cierre, se asienta la liquidación del periodo y se notifica a la directiva.
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {estaCerrado ? (
                  <>
                    {!mostrarConfirmReapertura ? (
                      <button
                        onClick={() => setMostrarConfirmReapertura(true)}
                        className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reabrir Mes para Ajustes</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="Motivo de reapertura..."
                          value={motivoReapertura}
                          onChange={(e) => setMotivoReapertura(e.target.value)}
                          className="text-xs border border-amber-300 rounded-lg px-2.5 py-1.5 bg-amber-50"
                        />
                        <button
                          onClick={handleReabrirMes}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setMostrarConfirmReapertura(false)}
                          className="px-2 py-1.5 text-slate-500 hover:text-slate-700 text-xs"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <button
                    onClick={handleEjecutarCierre}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Ejecutar y Sellar Cierre Mensual</span>
                  </button>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Pie del Modal */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between text-xs text-slate-500">
          <div className="font-mono">
            Summit Impulsa Global, S.A. de C.V. • T/C 27.00 HNL/USD
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-colors cursor-pointer"
          >
            Cerrar Ventana
          </button>
        </div>

      </div>
    </div>
  );
};
