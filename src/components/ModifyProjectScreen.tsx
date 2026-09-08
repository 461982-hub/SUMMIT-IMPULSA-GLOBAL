import React, { useState, useEffect } from 'react';
import { 
  Edit3, 
  Save, 
  Calculator, 
  BookOpen, 
  DollarSign, 
  Users, 
  Percent, 
  Sparkles, 
  ArrowLeft,
  CheckCircle2,
  Plus,
  FileSpreadsheet,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
  X,
  Receipt,
  FileText,
  Clock,
  Calendar,
  Settings
} from 'lucide-react';
import { ProyectoEducativo, Moneda, TipoProyecto, NivelProyecto, MetodoVenta, EstadoProyecto, TipoServicioFiscal } from '../types';
import { calcularMetricasProyecto, formatearMoneda } from '../utils/calculations';
import { REGLAS_ISV_SERVICIOS, obtenerReglaISVPorServicio, obtenerReglaFiscalPorTipoProyecto } from '../utils/isvRules';
import { generarSiguienteCorrelativo, formatearCorrelativo } from '../utils/correlativoUtils';
import { sumarDiasHabiles, sumarDiasCalendario, contarDiasHabilesEntreFechas } from '../utils/dateUtils';
import { CurricularPlanningSection } from './CurricularPlanningSection';
import { obtenerConfiguracionHorasPorNivel } from '../utils/curricularUtils';
import { CostosFijosAuthModal } from './CostosFijosAuthModal';
import { 
  CostoOperativoBannerPreventivo, 
  CostoOperativoModalPreventivo, 
  cargarUmbralCriticoGuardado, 
  guardarUmbralCriticoStorage 
} from './CostoOperativoAlertaPreventiva';

interface ModifyProjectScreenProps {
  proyectos: ProyectoEducativo[];
  proyectoInicialId?: string | null;
  moneda: Moneda;
  onGuardar: (proyecto: ProyectoEducativo) => void;
  onCancelar: () => void;
}

export const ModifyProjectScreen: React.FC<ModifyProjectScreenProps> = ({
  proyectos,
  proyectoInicialId,
  moneda,
  onGuardar,
  onCancelar,
}) => {
  const [selectedId, setSelectedId] = useState<string>(() => {
    if (proyectoInicialId && proyectos.some(p => p.id === proyectoInicialId)) {
      return proyectoInicialId;
    }
    return proyectos.length > 0 ? proyectos[0].id : 'nuevo';
  });

  const [formData, setFormData] = useState({
    id: 'nuevo',
    numeroCorrelativo: 1,
    codigoPrograma: 'SUM-2026-001',
    codigoFiscalSAR: 'SAR-ISV-2026-001',
    nombreProyecto: '',
    objetivoGeneral: '',
    temasImpartir: '',
    cantidadTemas: 4,
    horasClasePorTema: 3,
    metodologia: 'Aprendizaje Basado en Proyectos (ABP) & Casos Reales',
    planificacionPdf: undefined as {
      nombreArchivo: string;
      dataUrl: string;
      tamanoKb?: number;
      fechaCarga?: string;
    } | undefined,
    nombreDocente: '',
    docenteClasificacion: 'Licenciatura' as 'Licenciatura' | 'Ingeniería' | 'Maestría' | 'Doctorado' | 'Posdoctorado' | 'Técnico',
    docenteTelefono: '',
    docenteCorreo: '',
    seccion: 'Sección A',
    horario: '06:00 PM - 08:00 PM',
    diasClase: 'Lunes, Miércoles y Viernes',
    calificacionCurso: 5.0,
    tipoProyecto: 'Capacitación profesional / Mentoría ejecutiva' as TipoProyecto,
    nivel: 'Básico' as NivelProyecto,
    servicioFiscal: 'Capacitación profesional / Mentoría ejecutiva' as TipoServicioFiscal,
    aplicaISV: true,
    fechaProgramacion: new Date().toISOString().slice(0, 10),
    fechaVenta: sumarDiasHabiles(new Date().toISOString().slice(0, 10), 30),
    horasClase: 12,
    tarifaHoraDocente: 200 as string | number,
    costoZoom: 300 as string | number,
    costoPapeleria: 100 as string | number,
    gastosVarios: 100 as string | number,
    margenGananciaOperativa: 40 as string | number,
    alumnosProyectados: 6 as string | number,
    alumnosFinal: 6 as string | number,
    metodoVenta: 'Redes sociales' as MetodoVenta,
    seLlevoACabo: 'Planificado' as EstadoProyecto,
    observaciones: '',
  });

  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  // Estado de autorización para modificar costos fijos (Zoom, Papelería, Varios = 500 c/u)
  const [costosFijosAutorizados, setCostosFijosAutorizados] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Umbral crítico institucional para validación preventiva de costos operativos
  const [umbralCritico, setUmbralCritico] = useState<number>(() => cargarUmbralCriticoGuardado(moneda));
  const [mostrarAvisoPreventivoModal, setMostrarAvisoPreventivoModal] = useState(false);
  const [proyectoParaGuardarPendiente, setProyectoParaGuardarPendiente] = useState<ProyectoEducativo | null>(null);

  // Reloj digital y fecha en vivo para el sellado automático de fecha y hora al grabar
  const [fechaHoraEnVivo, setFechaHoraEnVivo] = useState(() => {
    const ahora = new Date();
    return {
      fecha: ahora.toLocaleDateString('es-HN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      hora: ahora.toLocaleTimeString('es-HN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }),
    };
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const ahora = new Date();
      setFechaHoraEnVivo({
        fecha: ahora.toLocaleDateString('es-HN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        hora: ahora.toLocaleTimeString('es-HN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setUmbralCritico(cargarUmbralCriticoGuardado(moneda));
  }, [moneda]);

  // Cargar datos cuando cambia el proyecto seleccionado
  useEffect(() => {
    if (selectedId === 'nuevo' || proyectos.length === 0) {
      const siguiente = generarSiguienteCorrelativo(proyectos, 'Capacitación profesional / Mentoría ejecutiva', 2026);
      setFormData({
        id: Date.now().toString(),
        numeroCorrelativo: siguiente.numeroCorrelativo,
        codigoPrograma: siguiente.codigoPrograma,
        codigoFiscalSAR: siguiente.codigoFiscalSAR,
        nombreProyecto: '',
        objetivoGeneral: '',
        nombreDocente: '',
        seccion: 'Sección A',
        horario: '', // En blanco para rellenar manualmente
        diasClase: '', // En blanco para rellenar manualmente
        tipoProyecto: 'Capacitación profesional / Mentoría ejecutiva',
        nivel: 'Básico',
        servicioFiscal: 'Capacitación profesional / Mentoría ejecutiva',
        aplicaISV: true,
        fechaProgramacion: new Date().toISOString().slice(0, 10),
        fechaVenta: sumarDiasHabiles(new Date().toISOString().slice(0, 10), 30),
        horasClase: 12,
        cantidadTemas: 4,
        horasClasePorTema: 3,
        tarifaHoraDocente: 200,
        costoZoom: 300, // Fijado por política
        costoPapeleria: 100, // Fijado por política
        gastosVarios: 100, // Fijado por política
        margenGananciaOperativa: 40,
        alumnosProyectados: 6,
        alumnosFinal: 6,
        metodoVenta: 'Redes sociales',
        seLlevoACabo: 'Planificado',
        observaciones: '',
      });
      setCostosFijosAutorizados(false);
    } else {
      const p = proyectos.find(item => item.id === selectedId);
      if (p) {
        const servicioFiscal = p.servicioFiscal || 'Servicios educativos no acreditados (talleres, cursos libres)';
        const regla = obtenerReglaISVPorServicio(servicioFiscal);
        const aplicaISV = p.aplicaISV !== undefined ? p.aplicaISV : regla.gravaISV;
        const numCorrelativo = p.numeroCorrelativo || parseInt(p.id, 10) || 1;
        const padNum = String(numCorrelativo).padStart(3, '0');

        setFormData({
          id: p.id,
          numeroCorrelativo: numCorrelativo,
          codigoPrograma: p.codigoPrograma || `SUM-2026-${padNum}`,
          codigoFiscalSAR: p.codigoFiscalSAR || `SAR-ISV-2026-${padNum}`,
          nombreProyecto: p.nombreProyecto,
          objetivoGeneral: p.objetivoGeneral || '',
          temasImpartir: p.temasImpartir || '',
          cantidadTemas: p.cantidadTemas || 4,
          horasClasePorTema: p.horasClasePorTema || (p.horasClase ? Math.max(1, Math.round(p.horasClase / (p.cantidadTemas || 4))) : (p.nivel === 'Básico' ? 3 : 5)),
          metodologia: p.metodologia || 'Aprendizaje Basado en Proyectos (ABP) & Casos Reales',
          planificacionPdf: p.planificacionPdf,
          nombreDocente: p.nombreDocente,
          docenteClasificacion: (p.docenteClasificacion || 'Licenciatura') as 'Licenciatura' | 'Ingeniería' | 'Maestría' | 'Doctorado' | 'Posdoctorado' | 'Técnico',
          docenteTelefono: p.docenteTelefono || '',
          docenteCorreo: p.docenteCorreo || '',
          seccion: p.seccion || 'Sección A',
          horario: p.horario || '06:00 PM - 08:00 PM',
          diasClase: p.diasClase || 'Lunes, Miércoles y Viernes',
          calificacionCurso: p.calificacionCurso || 5.0,
          tipoProyecto: p.tipoProyecto,
          nivel: p.nivel,
          servicioFiscal,
          aplicaISV,
          fechaProgramacion: p.fechaProgramacion,
          fechaVenta: p.fechaVenta,
          horasClase: p.horasClase,
          tarifaHoraDocente: p.tarifaHoraDocente,
          costoZoom: p.costoZoom ?? 300,
          costoPapeleria: p.costoPapeleria ?? 100,
          gastosVarios: p.gastosVarios ?? 100,
          margenGananciaOperativa: p.margenGananciaOperativa,
          alumnosProyectados: p.alumnosProyectados,
          alumnosFinal: Math.max(4, Number(p.alumnosFinal) || 4),
          metodoVenta: p.metodoVenta,
          seLlevoACabo: p.seLlevoACabo,
          observaciones: p.observaciones || '',
        });
        setCostosFijosAutorizados(false);
      }
    }
  }, [selectedId, proyectos]);

  const handleRestablecerCostosEstandar = () => {
    setFormData({
      ...formData,
      costoZoom: 300,
      costoPapeleria: 100,
      gastosVarios: 100,
    });
  };

  // Conversión segura de horas a número entero
  const horasClaseEntero = parseInt(String(formData.horasClase || '0'), 10) || 0;

  // Cálculo en vivo
  const calculoEnVivo = calcularMetricasProyecto({
    id: formData.id || 'temp',
    nombreProyecto: formData.nombreProyecto || 'Proyecto en Edición',
    objetivoGeneral: formData.objetivoGeneral,
    temasImpartir: formData.temasImpartir,
    nombreDocente: formData.nombreDocente,
    docenteClasificacion: formData.docenteClasificacion,
    docenteTelefono: formData.docenteTelefono,
    docenteCorreo: formData.docenteCorreo,
    seccion: formData.seccion,
    horario: formData.horario,
    diasClase: formData.diasClase,
    calificacionCurso: Number(formData.calificacionCurso) || 5.0,
    tipoProyecto: formData.tipoProyecto,
    nivel: formData.nivel,
    servicioFiscal: formData.servicioFiscal,
    aplicaISV: formData.aplicaISV,
    fechaProgramacion: formData.fechaProgramacion,
    fechaVenta: formData.fechaVenta,
    horasClase: horasClaseEntero,
    tarifaHoraDocente: Number(formData.tarifaHoraDocente) || 0,
    costoZoom: Number(formData.costoZoom) || 0,
    costoPapeleria: Number(formData.costoPapeleria) || 0,
    gastosVarios: Number(formData.gastosVarios) || 0,
    margenGananciaOperativa: Number(formData.margenGananciaOperativa) || 0,
    alumnosProyectados: Math.max(6, Number(formData.alumnosProyectados) || 6),
    alumnosFinal: Math.max(6, Number(formData.alumnosFinal) || 6),
    metodoVenta: formData.metodoVenta,
    seLlevoACabo: formData.seLlevoACabo,
    observaciones: formData.observaciones,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombreProyecto.trim()) return;

    const alumnosProyVal = Number(formData.alumnosProyectados);
    if (isNaN(alumnosProyVal) || alumnosProyVal < 6) {
      alert('⚠️ No es rentable: Todos los proyectos deben arrancar con 6 alumnos como mínimo.');
      return;
    }

    const horasFinal = parseInt(String(formData.horasClase || '0'), 10) || 0;
    const proyectoOriginal = proyectos.find(p => p.id === selectedId);

    const ahora = new Date();
    const horaActual = ahora.toLocaleTimeString('es-HN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    const fechaActual = ahora.toLocaleDateString('es-HN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const fechaHoraCompleta = `${fechaActual}, ${horaActual}`;

    const proyectoModificado = calcularMetricasProyecto({
      id: formData.id && formData.id !== 'nuevo' ? formData.id : Date.now().toString(),
      fechaCreacion: proyectoOriginal?.fechaCreacion || ahora.toISOString(),
      horaCreacion: proyectoOriginal?.horaCreacion || horaActual,
      fechaHoraGrabacion: fechaHoraCompleta,
      horaUltimaModificacion: horaActual,
      numeroCorrelativo: formData.numeroCorrelativo,
      codigoPrograma: formData.codigoPrograma,
      codigoFiscalSAR: formData.codigoFiscalSAR,
      nombreProyecto: formData.nombreProyecto.trim(),
      objetivoGeneral: formData.objetivoGeneral.trim(),
      temasImpartir: formData.temasImpartir.trim(),
      cantidadTemas: Number(formData.cantidadTemas) || 1,
      horasClasePorTema: Number(formData.horasClasePorTema) || 1,
      metodologia: formData.metodologia.trim(),
      planificacionPdf: formData.planificacionPdf,
      nombreDocente: formData.nombreDocente.trim() || 'Docente Asignado',
      docenteClasificacion: formData.docenteClasificacion,
      docenteTelefono: formData.docenteTelefono.trim(),
      docenteCorreo: formData.docenteCorreo.trim(),
      seccion: formData.seccion.trim() || 'Sección A',
      horario: formData.horario.trim() || '06:00 PM - 08:00 PM',
      diasClase: formData.diasClase.trim() || 'Lunes, Miércoles y Viernes',
      calificacionCurso: Number(formData.calificacionCurso) || 5.0,
      encuestaSatisfaccion: proyectoOriginal?.encuestaSatisfaccion || {
        estado: 'No Generada',
        calificacionPromedio: Number(formData.calificacionCurso) || 5.0,
      },
      tipoProyecto: formData.tipoProyecto,
      nivel: formData.nivel,
      servicioFiscal: formData.servicioFiscal,
      aplicaISV: formData.aplicaISV,
      fechaProgramacion: formData.fechaProgramacion,
      fechaVenta: formData.fechaVenta,
      mesControl: formData.fechaProgramacion ? formData.fechaProgramacion.slice(0, 7) : undefined,
      horasClase: horasFinal,
      tarifaHoraDocente: Number(formData.tarifaHoraDocente) || 0,
      costoZoom: Number(formData.costoZoom) || 0,
      costoPapeleria: Number(formData.costoPapeleria) || 0,
      gastosVarios: Number(formData.gastosVarios) || 0,
      margenGananciaOperativa: Number(formData.margenGananciaOperativa) || 0,
      alumnosProyectados: Math.max(6, Number(formData.alumnosProyectados) || 6),
      alumnosFinal: Math.max(6, Number(formData.alumnosFinal) || 6),
      metodoVenta: formData.metodoVenta,
      seLlevoACabo: formData.seLlevoACabo,
      observaciones: formData.observaciones.trim(),
    });

    // Validación preventiva en tiempo real antes de guardar
    if (proyectoModificado.gastoTotalOperativo > umbralCritico) {
      setProyectoParaGuardarPendiente(proyectoModificado);
      setMostrarAvisoPreventivoModal(true);
      return;
    }

    onGuardar(proyectoModificado);
    setGuardadoExitoso(true);
  };

  const margenesPredefinidos = [40, 50, 70, 90, 100];
  const esEdicion = selectedId !== 'nuevo' && proyectos.some(p => p.id === selectedId);

  return (
    <div className="space-y-6">
      {/* Encabezado de la Pantalla */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                {esEdicion ? 'Modificar Proyecto Educativo' : 'Registrar / Modificar Proyecto'}
              </h2>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                {esEdicion ? 'Modo Edición' : 'Nuevo Registro'}
              </span>
              <span className="font-mono font-bold text-blue-800 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded text-xs">
                {formatearCorrelativo(formData.numeroCorrelativo, formData.codigoPrograma)}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Modifica costos, correlativo institucional, enlace fiscal SAR, margen y alumnos con recálculo automático
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancelar}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la Matriz</span>
          </button>
        </div>
      </div>

      {/* Selector de Proyecto a Modificar si hay proyectos en la matriz */}
      {proyectos.length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-slate-500" />
            <label htmlFor="selector-proyecto-modificar" className="text-xs font-bold text-slate-700">
              Seleccionar Proyecto a Modificar:
            </label>
          </div>
          <select
            id="selector-proyecto-modificar"
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              setGuardadoExitoso(false);
            }}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[260px]"
          >
            {proyectos.map((p) => (
              <option key={p.id} value={p.id}>
                #{String(p.numeroCorrelativo || p.id).padStart(3, '0')} - {p.nombreProyecto} ({p.tipoProyecto})
              </option>
            ))}
          </select>
        </div>
      )}

      {guardadoExitoso ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-emerald-900">
            {esEdicion ? '¡Proyecto modificado y guardado con éxito!' : '¡Proyecto registrado exitosamente!'}
          </h3>
          <p className="text-xs text-emerald-700 max-w-md mx-auto">
            Los cambios se han actualizado en la matriz de rentabilidad y se ha generado el registro en el historial de auditoría.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setGuardadoExitoso(false);
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Continuar editando
            </button>
            <button
              onClick={onCancelar}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
            >
              Ver en la Matriz
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Tarjeta de Control de Correlativo & Fiscal SAR */}
          <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-purple-50/90 p-4 rounded-xl border border-blue-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-950 uppercase tracking-wider">
                <Receipt className="w-4 h-4 text-blue-700" />
                <span>Control de Correlativo Institucional & Identificación SAR (ISV)</span>
              </div>
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                formData.aplicaISV 
                  ? 'bg-amber-100 text-amber-900 border-amber-300' 
                  : 'bg-emerald-100 text-emerald-900 border-emerald-300'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                {formData.aplicaISV ? 'Tributa 15% ISV (SAR)' : 'Exento de ISV (0% Ley SAR)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-blue-200/90 shadow-2xs">
                <span className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider">
                  N° Correlativo Automático
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-sm font-black font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    #{String(formData.numeroCorrelativo || 1).padStart(3, '0')}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">(Secuencial único)</span>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-blue-200/90 shadow-2xs">
                <label className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider mb-0.5">
                  Código de Programa SUMMIT
                </label>
                <input
                  type="text"
                  value={formData.codigoPrograma}
                  onChange={(e) => setFormData({ ...formData, codigoPrograma: e.target.value.toUpperCase() })}
                  className="w-full px-2 py-1 text-xs font-mono font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  placeholder="Ej: SUM-2026-001"
                />
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-blue-200/90 shadow-2xs">
                <label className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider mb-0.5">
                  Correlativo Fiscal SAR (ISV)
                </label>
                <input
                  type="text"
                  value={formData.codigoFiscalSAR}
                  onChange={(e) => setFormData({ ...formData, codigoFiscalSAR: e.target.value.toUpperCase() })}
                  className="w-full px-2 py-1 text-xs font-mono font-bold text-purple-900 bg-purple-50/50 border border-purple-200 rounded focus:ring-1 focus:ring-purple-500 focus:bg-white"
                  placeholder="Ej: SAR-ISV-2026-001"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Columna Izquierda: Formulario de Modificación (7 columnas) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* 1. Información General */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>1. Datos del Programa (Académica & Logística)</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md">
                  Llenado por Gerencia Académica
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre del Proyecto / Curso <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Inglés Básico, Taller de Liderazgo, Excel Avanzado..."
                    value={formData.nombreProyecto}
                    onChange={(e) => setFormData({ ...formData, nombreProyecto: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Objetivo General
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Objetivo principal del programa educativo..."
                    value={formData.objetivoGeneral}
                    onChange={(e) => setFormData({ ...formData, objetivoGeneral: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Temas a Impartir (Ubicado debajo del Objetivo General) */}
                <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-700" />
                      Temas a Impartir (Contenido / Syllabus Curricular)
                    </label>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      Estructura Académica
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Tema 1: Fundamentos y conceptos clave&#10;Tema 2: Herramientas prácticas y metodologías&#10;Tema 3: Casos de estudio y aplicación real&#10;Tema 4: Proyecto final y evaluación de competencias"
                    value={formData.temasImpartir}
                    onChange={(e) => setFormData({ ...formData, temasImpartir: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-emerald-300/80 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono text-slate-800 leading-relaxed"
                  />
                  <div className="flex items-center justify-between text-[10px] text-emerald-800">
                    <span>Desglose temático que guiará las sesiones de clase.</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (!formData.temasImpartir) {
                          setFormData({
                            ...formData,
                            temasImpartir: `Módulo 1: Introducción y fundamentos teóricos de ${formData.nombreProyecto || 'la materia'}\nMódulo 2: Técnicas aplicadas y resolución de casos prácticos\nMódulo 3: Herramientas de optimización y mejores prácticas\nMódulo 4: Proyecto integrador y evaluación final de desempeño`
                          });
                        }
                      }}
                      className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-900 underline"
                    >
                      + Cargar plantilla de temas sugeridos
                    </button>
                  </div>
                </div>

                {/* Planificación Curricular Avanzada: Horas por Tema, Total Horas, Metodología y Documento PDF */}
                <CurricularPlanningSection
                  cantidadTemas={Number(formData.cantidadTemas) || 4}
                  horasClasePorTema={Number(formData.horasClasePorTema) || (formData.nivel === 'Básico' ? 3 : 5)}
                  totalHorasCurso={Number(formData.horasClase) || 0}
                  metodologia={formData.metodologia}
                  planificacionPdf={formData.planificacionPdf}
                  tipoProyecto={formData.tipoProyecto}
                  nivelProyecto={formData.nivel}
                  onNivelChange={(val, configNivel) => {
                    const cfg = configNivel || obtenerConfiguracionHorasPorNivel(val);
                    setFormData(prev => ({
                      ...prev,
                      nivel: val,
                      cantidadTemas: cfg.cantidadTemas,
                      horasClasePorTema: cfg.horasPorTema,
                      horasClase: cfg.totalHoras
                    }));
                  }}
                  onCantidadTemasChange={(val) => setFormData(prev => ({ ...prev, cantidadTemas: val }))}
                  onHorasClasePorTemaChange={(val) => setFormData(prev => ({ ...prev, horasClasePorTema: val }))}
                  onTotalHorasCursoChange={(val) => setFormData(prev => ({ ...prev, horasClase: val }))}
                  onMetodologiaChange={(val) => setFormData(prev => ({ ...prev, metodologia: val }))}
                  onPlanificacionPdfChange={(pdf) => setFormData(prev => ({ ...prev, planificacionPdf: pdf }))}
                />

                {/* Perfil Docente y Canales de Contacto */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                    <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      Perfil Docente y Canales de Contacto Directo
                    </span>
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded">
                      Cuerpo Académico
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Docente Asignado <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Nombre del docente"
                        value={formData.nombreDocente}
                        onChange={(e) => setFormData({ ...formData, nombreDocente: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Clasificación Académica <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.docenteClasificacion}
                        onChange={(e) => setFormData({ ...formData, docenteClasificacion: e.target.value as any })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-semibold text-slate-800"
                      >
                        <option value="Licenciatura">Licenciatura</option>
                        <option value="Ingeniería">Ingeniería</option>
                        <option value="Maestría">Maestría</option>
                        <option value="Doctorado">Doctorado</option>
                        <option value="Posdoctorado">Posdoctorado</option>
                        <option value="Técnico">Técnico</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Número de Contacto <span className="text-slate-400 font-normal">(Tel/WhatsApp)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: +504 9876-5432"
                        value={formData.docenteTelefono}
                        onChange={(e) => setFormData({ ...formData, docenteTelefono: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        placeholder="docente@summit.hn"
                        value={formData.docenteCorreo}
                        onChange={(e) => setFormData({ ...formData, docenteCorreo: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Clasificación Oficial del SAR</label>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                      {formData.aplicaISV ? '15% ISV' : 'Exento (0%)'}
                    </span>
                  </div>
                  <select
                    value={formData.tipoProyecto}
                    onChange={(e) => {
                      const nuevoTipo = e.target.value as TipoProyecto;
                      const regla = obtenerReglaFiscalPorTipoProyecto(nuevoTipo);
                      setFormData({
                        ...formData,
                        tipoProyecto: nuevoTipo,
                        servicioFiscal: regla.servicio as TipoServicioFiscal,
                        aplicaISV: regla.gravaISV,
                      });
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="Capacitación profesional / Mentoría ejecutiva">Capacitación profesional / Mentoría ejecutiva (15% ISV)</option>
                    <option value="Formación académica acreditada (ej. convenios universitarios)">Formación académica acreditada (Exento 0% ISV)</option>
                    <option value="Servicios educativos no acreditados (talleres, cursos libres)">Servicios educativos no acreditados (talleres, cursos libres) (15% ISV)</option>
                    <option value="Consultoría empresarial">Consultoría empresarial (15% ISV)</option>
                    <option value="Intermediación laboral / servicios de RRHH">Intermediación laboral / servicios de RRHH (15% ISV)</option>
                    <option value="Servicios administrativos / gestión de proyectos">Servicios administrativos / gestión de proyectos (15% ISV)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">Fecha de Programación / Inicio</label>
                      <span className="text-[10px] text-blue-600 font-medium">Inicio ciclo</span>
                    </div>
                    <input
                      type="date"
                      value={formData.fechaProgramacion}
                      onChange={(e) => {
                        const nuevaFechaInicio = e.target.value;
                        const fechaFinProyectada = sumarDiasHabiles(nuevaFechaInicio, 30);
                        setFormData({ 
                          ...formData, 
                          fechaProgramacion: nuevaFechaInicio,
                          fechaVenta: fechaFinProyectada || formData.fechaVenta 
                        });
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">Fecha de Venta / Fin</label>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        ⚡ Auto (+30d hábiles)
                      </span>
                    </div>
                    <input
                      type="date"
                      value={formData.fechaVenta}
                      onChange={(e) => setFormData({ ...formData, fechaVenta: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Proyección de Fechas y Días Hábiles */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-slate-700 text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>
                      Proyección comercial: <strong>{contarDiasHabilesEntreFechas(formData.fechaProgramacion, formData.fechaVenta)} días hábiles</strong> de campaña
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const finAuto = sumarDiasHabiles(formData.fechaProgramacion, 30);
                        if (finAuto) setFormData({ ...formData, fechaVenta: finAuto });
                      }}
                      className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded font-semibold transition-colors"
                      title="Calcular exactamente 30 días hábiles (lunes a viernes)"
                    >
                      +30d Hábiles
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const finCal = sumarDiasCalendario(formData.fechaProgramacion, 30);
                        if (finCal) setFormData({ ...formData, fechaVenta: finCal });
                      }}
                      className="text-[10px] px-2 py-0.5 bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 rounded transition-colors"
                      title="Calcular 30 días calendario corridos"
                    >
                      +30d Calendario
                    </button>
                  </div>
                </div>

                {/* Sección, Horario y Días (Gerencia Académica) */}
                <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      Programación Curricular: Sección, Horario y Días
                    </span>
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded border border-blue-300">
                      Gerencia Académica
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Sección / Grupo <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Fines de semana, Sec. A, etc."
                        value={formData.seccion}
                        onChange={(e) => setFormData({ ...formData, seccion: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                      />
                      <div className="flex flex-wrap gap-1 mt-1">
                        {['Sec. A', 'Sec. B', 'Matutina', 'Sabatina', 'Fines de semana'].map((sec) => (
                          <button
                            key={sec}
                            type="button"
                            onClick={() => setFormData({ ...formData, seccion: sec })}
                            className="text-[9px] px-1.5 py-0.5 bg-white text-slate-600 hover:text-blue-700 hover:border-blue-400 border border-slate-200 rounded font-mono"
                          >
                            {sec}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Horario de Clase <span className="text-rose-500">*</span>
                        <span className="text-[9px] font-normal text-slate-400 ml-1">(Llenar manualmente)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: 06:00 PM - 08:00 PM (Escribir horario)"
                        value={formData.horario}
                        onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                      />
                      <div className="flex flex-wrap gap-1 mt-1">
                        {['06:00 PM - 08:00 PM', '07:00 PM - 09:00 PM', '08:00 AM - 12:00 PM'].map((hor) => (
                          <button
                            key={hor}
                            type="button"
                            onClick={() => setFormData({ ...formData, horario: hor })}
                            className="text-[9px] px-1.5 py-0.5 bg-white text-slate-600 hover:text-blue-700 hover:border-blue-400 border border-slate-200 rounded font-mono truncate max-w-[120px]"
                            title={hor}
                          >
                            {hor}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Días de Clase <span className="text-rose-500">*</span>
                        <span className="text-[9px] font-normal text-slate-400 ml-1">(Llenar manualmente)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Sábados y Domingos / Lunes a Viernes"
                        value={formData.diasClase}
                        onChange={(e) => setFormData({ ...formData, diasClase: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                      />
                      <div className="flex flex-wrap gap-1 mt-1">
                        {['Fines de semana', 'Lun, Mié y Vie', 'Mar y Jue', 'Sábados', 'Lun a Jue'].map((dia) => (
                          <button
                            key={dia}
                            type="button"
                            onClick={() => setFormData({ ...formData, diasClase: dia === 'Fines de semana' ? 'Sábados y Domingos (Fines de semana)' : dia === 'Lun, Mié y Vie' ? 'Lunes, Miércoles y Viernes' : dia === 'Mar y Jue' ? 'Martes y Jueves' : dia === 'Lun a Jue' ? 'Lunes a Jueves' : 'Sábados' })}
                            className="text-[9px] px-1.5 py-0.5 bg-white text-slate-600 hover:text-blue-700 hover:border-blue-400 border border-slate-200 rounded font-mono"
                          >
                            {dia}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {formData.fechaProgramacion && (
                  <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-lg flex items-center justify-between text-xs text-blue-900">
                    <span className="text-slate-600">Mes de control financiero:</span>
                    <span className="font-bold bg-white px-2 py-0.5 rounded border border-blue-200 shadow-2xs">
                      {new Date(formData.fechaProgramacion + 'T12:00:00Z').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Estructura de Costos Operativos */}
            <div 
              id="seccion-costos-operativos"
              className={`p-5 rounded-xl border shadow-xs space-y-4 transition-all duration-200 ${
                calculoEnVivo.gastoTotalOperativo > umbralCritico
                  ? 'bg-rose-50/40 border-rose-300 ring-2 ring-rose-200/60'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>2. Costos Operativos ({moneda})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md">
                    Llenado por Gerencia Académica
                  </span>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                    calculoEnVivo.gastoTotalOperativo > umbralCritico
                      ? 'text-rose-900 bg-rose-100 border-rose-300'
                      : 'text-slate-800 bg-slate-100 border-slate-200'
                  }`}>
                    Total: {formatearMoneda(calculoEnVivo.gastoTotalOperativo, moneda)}
                  </span>
                </div>
              </div>

              {/* Banner de Validación en Tiempo Real con Umbral Crítico Definido */}
              <CostoOperativoBannerPreventivo
                gastoTotalOperativo={calculoEnVivo.gastoTotalOperativo}
                umbralCritico={umbralCritico}
                moneda={moneda}
                costoDocente={calculoEnVivo.costoDocenteCalculado}
                costosFijos={calculoEnVivo.gastoTotalOperativo - calculoEnVivo.costoDocenteCalculado}
                puntoEquilibrio={calculoEnVivo.puntoEquilibrioAlumnos}
                precioSugerido={calculoEnVivo.precioSugeridoAlumno}
                alumnosProyectados={calculoEnVivo.alumnosProyectados}
                tarifaHoraDocente={Number(formData.tarifaHoraDocente) || 0}
                horasClase={Number(formData.horasClase) || 0}
                onCambiarUmbral={(nuevo) => {
                  setUmbralCritico(nuevo);
                  guardarUmbralCriticoStorage(nuevo);
                }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Honorarios Docente</span>
                    <span className="text-emerald-700 font-semibold">
                      = {formatearMoneda(calculoEnVivo.costoDocenteCalculado, moneda)}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Horas de Clase Totales <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-blue-800 bg-blue-100/90 border border-blue-200 px-1.5 py-0.2 rounded inline-flex items-center gap-1">
                          ⚡ Auto Nivel {formData.nivel || 'Básico'}: {formData.horasClase} hrs
                        </span>
                        <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-200">
                          Solo enteros
                        </span>
                      </div>
                    </div>
                    <input
                      id="input-mod-horas-clase"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      placeholder="Ej: 20 (Relleno manual)"
                      value={formData.horasClase}
                      onKeyDown={(e) => {
                        if (['.', ',', 'e', 'E', '+', '-', ' '].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setFormData({ ...formData, horasClase: val });
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold font-mono text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Admite solo números enteros sin decimales • Colocado de forma automática según el nivel académico ({formData.nivel || 'Básico'}).
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Tarifa por Hora ({moneda})</label>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      placeholder="Ej: 200"
                      value={formData.tarifaHoraDocente}
                      onChange={(e) => setFormData({ ...formData, tarifaHoraDocente: Number(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-2">
                    <div className="flex items-center gap-2">
                      {costosFijosAutorizados ? (
                        <Unlock className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                      )}
                      <div>
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                          <span>Costos Fijos Operativos (Zoom {moneda} 300, Otros {moneda} 100)</span>
                          {costosFijosAutorizados ? (
                            <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded inline-flex items-center gap-1">
                              <Unlock className="w-2.5 h-2.5" />
                              Edición Autorizada (Walter Pedroza)
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-200 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded inline-flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              Protegido • Exclusivo Walter Pedroza
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-600">
                          {costosFijosAutorizados 
                            ? 'Permiso de edición activo. Puede modificar los importes o restablecerlos a la norma.' 
                            : `Establecidos en Zoom: ${moneda} 300, Papelería: ${moneda} 100, Gastos Varios: ${moneda} 100. Modificación restringida exclusivamente a Walter Pedroza (pedrozawalterrene@gmail.com).`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                      {costosFijosAutorizados ? (
                        <>
                          <button
                            type="button"
                            onClick={handleRestablecerCostosEstandar}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded shadow-2xs transition-colors cursor-pointer"
                            title="Restablecer a Zoom 300 / Otros 100"
                          >
                            <RotateCcw className="w-3 h-3 text-slate-500" />
                            <span>300 / 100</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAuthModal(true)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded shadow-2xs transition-colors cursor-pointer"
                            title="Ajustes de Clave Maestra y Seguridad"
                          >
                            <Settings className="w-3 h-3 text-slate-500" />
                            <span className="hidden sm:inline">Ajustes</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCostosFijosAutorizados(false)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-amber-900 bg-amber-200 hover:bg-amber-300 border border-amber-300 rounded shadow-2xs transition-colors cursor-pointer"
                          >
                            <Lock className="w-3 h-3" />
                            <span>Bloquear</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowAuthModal(true)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-amber-900 bg-amber-200/90 hover:bg-amber-300 border border-amber-300 rounded shadow-2xs transition-colors cursor-pointer"
                          title="Autorización exclusiva para Walter Pedroza"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-800" />
                          <span>Modificar con Autorización</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Costo Zoom / Plataforma ({moneda})
                        </label>
                        {!costosFijosAutorizados && <Lock className="w-3 h-3 text-slate-400" />}
                      </div>
                      <input
                        type="number"
                        min="0"
                        placeholder="500"
                        readOnly={!costosFijosAutorizados}
                        disabled={!costosFijosAutorizados}
                        value={formData.costoZoom}
                        onChange={(e) => setFormData({ ...formData, costoZoom: Number(e.target.value) || 0 })}
                        className={`w-full px-3 py-1.5 text-xs rounded-lg font-bold font-mono ${
                          costosFijosAutorizados
                            ? 'bg-white border-emerald-400 text-slate-900 focus:ring-2 focus:ring-emerald-500'
                            : 'bg-slate-100/90 border-slate-300 text-slate-700 cursor-not-allowed'
                        } border`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Papelería / Materiales ({moneda})
                        </label>
                        {!costosFijosAutorizados && <Lock className="w-3 h-3 text-slate-400" />}
                      </div>
                      <input
                        type="number"
                        min="0"
                        placeholder="500"
                        readOnly={!costosFijosAutorizados}
                        disabled={!costosFijosAutorizados}
                        value={formData.costoPapeleria}
                        onChange={(e) => setFormData({ ...formData, costoPapeleria: Number(e.target.value) || 0 })}
                        className={`w-full px-3 py-1.5 text-xs rounded-lg font-bold font-mono ${
                          costosFijosAutorizados
                            ? 'bg-white border-emerald-400 text-slate-900 focus:ring-2 focus:ring-emerald-500'
                            : 'bg-slate-100/90 border-slate-300 text-slate-700 cursor-not-allowed'
                        } border`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Gastos Varios / Imprevistos ({moneda})
                        </label>
                        {!costosFijosAutorizados && <Lock className="w-3 h-3 text-slate-400" />}
                      </div>
                      <input
                        type="number"
                        min="0"
                        placeholder="500"
                        readOnly={!costosFijosAutorizados}
                        disabled={!costosFijosAutorizados}
                        value={formData.gastosVarios}
                        onChange={(e) => setFormData({ ...formData, gastosVarios: Number(e.target.value) || 0 })}
                        className={`w-full px-3 py-1.5 text-xs rounded-lg font-bold font-mono ${
                          costosFijosAutorizados
                            ? 'bg-white border-emerald-400 text-slate-900 focus:ring-2 focus:ring-emerald-500'
                            : 'bg-slate-100/90 border-slate-300 text-slate-700 cursor-not-allowed'
                        } border`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Régimen Fiscal & Tratamiento ISV (SAR) */}
            <div className="bg-amber-50/70 p-5 rounded-xl border border-amber-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-950 uppercase tracking-wider">
                  <Receipt className="w-4 h-4 text-amber-700" />
                  <span>3. Régimen Fiscal & Tratamiento ISV (SAR)</span>
                </div>
                {formData.aplicaISV ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-amber-200 text-amber-950 border border-amber-300">
                    ✅ Grava ISV (15%)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-950 border border-emerald-300">
                    ❌ Exento de ISV (0%)
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Clasificación del Servicio Educativo / Profesional
                </label>
                <select
                  value={formData.servicioFiscal}
                  onChange={(e) => {
                    const nuevoServicio = e.target.value as TipoServicioFiscal;
                    const regla = obtenerReglaISVPorServicio(nuevoServicio);
                    setFormData({
                      ...formData,
                      servicioFiscal: nuevoServicio,
                      aplicaISV: regla.gravaISV,
                    });
                  }}
                  className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {REGLAS_ISV_SERVICIOS.map((r) => (
                    <option key={r.id} value={r.servicio}>
                      {r.servicio} — {r.etiquetaGrava}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dictamen oficial SAR */}
              <div className="p-3 bg-white rounded-lg border border-amber-200 text-xs text-slate-700 space-y-1">
                <span className="font-bold text-amber-900 block text-[11px] uppercase tracking-wider">
                  Dictamen SAR & Base Legal:
                </span>
                <p className="leading-relaxed">
                  {obtenerReglaISVPorServicio(formData.servicioFiscal).observaciones}
                </p>
              </div>

              {/* Checkbox override */}
              <div className="flex items-center justify-between pt-1">
                <label htmlFor="checkbox-aplica-isv-screen" className="text-xs text-slate-700 font-medium cursor-pointer select-none">
                  Cobrar y trasladar 15% de ISV en la facturación del alumno / cliente
                </label>
                <input
                  id="checkbox-aplica-isv-screen"
                  type="checkbox"
                  checked={formData.aplicaISV}
                  onChange={(e) => setFormData({ ...formData, aplicaISV: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* 4. Margen y Proyección de Alumnos */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                <Percent className="w-4 h-4 text-purple-600" />
                <span>4. Margen de Ganancia y Alumnos</span>
              </div>

              {/* Selector de Margen */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Margen de Ganancia Operativa Deseado:</span>
                  <span className="text-purple-700 font-bold text-sm">
                    {formData.margenGananciaOperativa}%
                  </span>
                </div>

                <input
                  type="range"
                  min="10"
                  max="150"
                  step="5"
                  value={formData.margenGananciaOperativa}
                  onChange={(e) => setFormData({ ...formData, margenGananciaOperativa: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {margenesPredefinidos.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setFormData({ ...formData, margenGananciaOperativa: m })}
                      className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-colors ${
                        formData.margenGananciaOperativa === m
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {m}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Alumnos Proyectados vs Finales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className={`p-3.5 rounded-lg border transition-all ${
                  Number(formData.alumnosProyectados) < 6
                    ? 'bg-rose-50/80 border-rose-300'
                    : 'bg-blue-50/60 border-blue-200'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-blue-950">
                      Alumnos Proyectados (Meta) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-bold text-slate-500 font-mono">
                      Mínimo: 6 alumnos
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-700 mb-2">
                    Base para fijar el precio unitario sugerido (mínimo 6 alumnos)
                  </p>
                  <input
                    type="number"
                    min="6"
                    required
                    value={formData.alumnosProyectados}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ ...formData, alumnosProyectados: val === '' ? '' : Number(val) });
                    }}
                    onBlur={() => {
                      if (Number(formData.alumnosProyectados) < 6) {
                        setFormData({ ...formData, alumnosProyectados: 6 });
                      }
                    }}
                    className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg font-bold transition-all ${
                      Number(formData.alumnosProyectados) < 6
                        ? 'border-rose-400 text-rose-900 focus:ring-2 focus:ring-rose-400 bg-rose-50'
                        : 'border-blue-300 text-blue-900 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {Number(formData.alumnosProyectados) < 6 && (
                    <div className="mt-2 p-2 bg-rose-100/90 border border-rose-300 rounded-md flex items-center gap-1.5 text-[11px] font-bold text-rose-800 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>No es rentable (Mínimo institucional requerido: 6 alumnos)</span>
                    </div>
                  )}
                </div>

                <div className="bg-emerald-50/60 p-3.5 rounded-lg border border-emerald-200">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-emerald-950">
                      Alumnos Finales (Reales Inscritos)
                    </label>
                    <span className="text-[10px] font-bold text-emerald-700 font-mono">
                      Mínimo: 6
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 mb-2">
                    Inscritos confirmados (Base mínima institucional: 6 alumnos)
                  </p>
                  <input
                    type="number"
                    min="6"
                    value={formData.alumnosFinal}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFormData({ ...formData, alumnosFinal: val < 6 ? 6 : val });
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-lg font-bold text-emerald-900"
                  />
                </div>
              </div>
            </div>

            {/* 4. Comercialización y Estado */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>4. Canal de Venta & Estado</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  5. Comercialización & Ciclo de Vida del Proyecto
                </span>
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Gerencia de Comercialización & General
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Método de Venta
                    </label>
                    <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                      Gerencia Comercial
                    </span>
                  </div>
                  <select
                    value={formData.metodoVenta}
                    onChange={(e) => {
                      const nuevoMetodo = e.target.value as MetodoVenta;
                      const nuevoEstado: EstadoProyecto = formData.seLlevoACabo === 'Planificado' ? 'En proceso' : formData.seLlevoACabo;
                      setFormData({ 
                        ...formData, 
                        metodoVenta: nuevoMetodo,
                        seLlevoACabo: nuevoEstado
                      });
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                  >
                    <option value="Redes sociales">Redes sociales</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Publicidad Paga (Ads)">Publicidad Paga (Ads)</option>
                    <option value="Email Marketing">Email Marketing</option>
                    <option value="Referidos">Referidos</option>
                    <option value="Convenios / Empresas">Convenios / Empresas</option>
                    <option value="Llamadas / Telemarketing">Llamadas / Telemarketing</option>
                    <option value="Página Web">Página Web</option>
                    <option value="Otro">Otro</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Al asignarse por Comercialización, el estado avanza automáticamente a <span className="font-semibold text-amber-700">En proceso</span>.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Estado de Realización / Dictamen
                    </label>
                    <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                      Dictamen Gerencial
                    </span>
                  </div>
                  <select
                    value={formData.seLlevoACabo}
                    onChange={(e) => setFormData({ ...formData, seLlevoACabo: e.target.value as EstadoProyecto })}
                    className={`w-full px-3 py-1.5 text-xs border rounded-lg font-bold ${
                      formData.seLlevoACabo === 'Listo' || formData.seLlevoACabo === 'Sí' || formData.seLlevoACabo === 'Realizar'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : formData.seLlevoACabo === 'En proceso' || formData.seLlevoACabo === 'En curso'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : formData.seLlevoACabo === 'Denegado' || formData.seLlevoACabo === 'No' || formData.seLlevoACabo === 'Cancelado'
                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                        : 'bg-purple-50 text-purple-800 border-purple-300'
                    }`}
                  >
                    <option value="Planificado">Planificado (Inicial)</option>
                    <option value="En proceso">En proceso (Comercialización activa)</option>
                    <option value="Listo">Listo (Aprobado para Realizar / Imprimir)</option>
                    <option value="Denegado">Denegado (Rechazado por Gerencia)</option>
                    <option value="Sí">Sí (Completado y ejecutado)</option>
                    <option value="Pospuesto">Pospuesto</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {formData.seLlevoACabo === 'Planificado' && 'Inicial: Pendiente de estrategia comercial.'}
                    {formData.seLlevoACabo === 'En proceso' && 'En proceso: Estrategia de venta en marcha.'}
                    {formData.seLlevoACabo === 'Listo' && 'Listo: Aprobado por Gerencia General, listo para guardar e imprimir.'}
                    {formData.seLlevoACabo === 'Denegado' && 'Denegado: No aprobado para ejecución.'}
                  </p>
                </div>
              </div>

              {/* Calificación del Curso & Encuesta de Satisfacción (Gerencia de Comercialización) */}
              <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Calificación del Curso & Encuesta de Satisfacción Estudiantil
                  </span>
                  <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-300">
                    Gerencia de Comercialización
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Calificación del Curso (Escala 1.0 - 5.0)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        min="1.0"
                        max="5.0"
                        value={formData.calificacionCurso}
                        onChange={(e) => setFormData({ ...formData, calificacionCurso: Number(e.target.value) })}
                        className="w-24 px-2.5 py-1.5 text-xs bg-white border border-indigo-300 rounded-lg font-bold text-indigo-900 font-mono focus:ring-1 focus:ring-indigo-500"
                      />
                      <div className="flex items-center gap-1 text-amber-500 text-xs">
                        {['★', '★', '★', '★', '★'].map((star, idx) => (
                          <span key={idx} className={idx < Math.round(Number(formData.calificacionCurso) || 5) ? 'text-amber-500' : 'text-slate-300'}>
                            ★
                          </span>
                        ))}
                        <span className="text-[11px] font-bold text-slate-700 ml-1">
                          ({formData.calificacionCurso || '5.0'} / 5.0)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/80 p-2.5 rounded-lg border border-indigo-100 text-[11px] text-slate-600 flex flex-col justify-center">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">Canal de retroalimentación:</span>
                      <span className="font-semibold text-indigo-700">Encuesta CSAT / NPS</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      La Gerencia Comercial genera el link de evaluación y lo distribuye a los estudiantes vía WhatsApp y correo al finalizar el curso.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observaciones / Notas de Gestión
                </label>
                <input
                  type="text"
                  placeholder="Detalles sobre resultados, evaluación o requerimientos especiales..."
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {/* Botones de Acción con Sello Automático */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-600 font-mono bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 w-full sm:w-auto justify-between sm:justify-start">
                <span className="flex items-center gap-1.5 text-emerald-800 font-sans font-medium text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Sello automático de fecha y hora al grabar:
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-800 font-bold bg-emerald-100/90 px-2 py-0.5 rounded text-[11px] border border-emerald-300">
                    {fechaHoraEnVivo.fecha}
                  </span>
                  <strong className="text-emerald-700 font-bold">{fechaHoraEnVivo.hora}</strong>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onCancelar}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-guardar-modificaciones-proyecto"
                  type="submit"
                  className="flex items-center gap-1.5 px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{esEdicion ? 'Guardar Modificaciones' : 'Guardar Proyecto en Matriz'}</span>
                </button>
              </div>
            </div>

          </div>

          {/* Columna Derecha: Previsualización Financiera en Vivo (5 columnas) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs sticky top-20 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Cálculos en Tiempo Real
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Recálculo instantáneo con las fórmulas de la matriz
                    </p>
                  </div>
                </div>
              </div>

              {/* Tarjeta Destacada: Precio Sugerido por Alumno & Tratamiento Fiscal */}
              <div className="bg-linear-to-br from-emerald-700 via-teal-800 to-slate-900 rounded-xl p-4 text-white shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider">
                    Precio Sugerido Ticket
                  </span>
                  {calculoEnVivo.aplicaISV ? (
                    <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded">
                      +15% ISV SAR
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 px-2 py-0.5 rounded">
                      Exento de ISV
                    </span>
                  )}
                </div>

                <div>
                  <div className="text-xs text-emerald-200">Neto (Ingreso SUMMIT):</div>
                  <div className="text-xl font-bold font-mono text-emerald-100">
                    {formatearMoneda(calculoEnVivo.precioSugeridoAlumno, moneda)}
                  </div>
                </div>

                {calculoEnVivo.aplicaISV && (
                  <div className="text-xs text-amber-200 pt-1 border-t border-emerald-600/40 flex items-center justify-between">
                    <span>+ ISV (15%):</span>
                    <span className="font-mono font-bold">
                      +{formatearMoneda(calculoEnVivo.isvPorAlumno || 0, moneda)}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-emerald-500/50 flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Total Factura al Alumno:
                  </span>
                  <span className="text-lg font-black font-mono text-amber-300">
                    {formatearMoneda(calculoEnVivo.precioSugeridoConISV || calculoEnVivo.precioSugeridoAlumno, moneda)}
                  </span>
                </div>

                <div className="text-[10px] text-emerald-200/80 flex items-center justify-between pt-1">
                  <span>Con {formData.alumnosProyectados} alumnos proyectados</span>
                  <span className="font-bold">+{formData.margenGananciaOperativa}% margen</span>
                </div>
              </div>

              {/* Métricas Clave de Rentabilidad */}
              <div className="space-y-2 text-xs">
                
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-600">Gasto Total Operativo:</span>
                  <span className="font-bold text-slate-900">
                    {formatearMoneda(calculoEnVivo.gastoTotalOperativo, moneda)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-600">Venta Requerida Base (Meta):</span>
                  <span className="font-bold text-slate-900">
                    {formatearMoneda(calculoEnVivo.precioVentaRequerido, moneda)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-amber-50/60 rounded-lg border border-amber-200/60">
                  <span className="text-amber-900 font-medium">15% ISV Total Curso (Venta):</span>
                  <span className="font-bold text-amber-800">
                    {formatearMoneda(calculoEnVivo.isvVentaRequeridaTotal || 0, moneda)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="text-emerald-900 font-bold">Total Venta Requerida + ISV:</span>
                  <span className="font-black text-emerald-700">
                    {formatearMoneda(calculoEnVivo.precioVentaRequeridoConISV || calculoEnVivo.precioVentaRequerido, moneda)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-purple-50 rounded-lg border border-purple-100">
                  <span className="text-purple-900 font-medium">Ganancia Operativa Base:</span>
                  <span className="font-bold text-purple-700">
                    {formatearMoneda(calculoEnVivo.gananciaOperativa, moneda)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                  <span className="text-blue-900 font-medium">Punto de Equilibrio (Mínimo):</span>
                  <span className="font-bold text-blue-700">
                    {calculoEnVivo.puntoEquilibrioAlumnos} alumnos
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-600">Diferencia de Alumnos:</span>
                  <span className={`font-bold ${calculoEnVivo.diferenciaAlumnos >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {calculoEnVivo.diferenciaAlumnos >= 0 ? `+${calculoEnVivo.diferenciaAlumnos}` : calculoEnVivo.diferenciaAlumnos} alumnos
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-600">Ingreso Real Total:</span>
                  <span className="font-bold text-slate-900">
                    {formatearMoneda(calculoEnVivo.ingresoRealTotal, moneda)}
                  </span>
                </div>

                <div className={`flex items-center justify-between p-3 rounded-lg border ${
                  calculoEnVivo.totalGananciasFinales >= 0 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}>
                  <span className="font-bold">Total Ganancias Finales:</span>
                  <span className={`font-black text-sm ${
                    calculoEnVivo.totalGananciasFinales >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {formatearMoneda(calculoEnVivo.totalGananciasFinales, moneda)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-600">Retorno de Inversión (ROI):</span>
                  <span className="font-bold text-slate-900">
                    {calculoEnVivo.roiPorcentaje.toFixed(1)}%
                  </span>
                </div>

              </div>

              {/* Diagnóstico Rápido de Viabilidad */}
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-amber-700" />
                  <span>Diagnóstico de Viabilidad</span>
                </div>
                <p>
                  {calculoEnVivo.alumnosFinal >= calculoEnVivo.puntoEquilibrioAlumnos
                    ? `✓ Los ${calculoEnVivo.alumnosFinal} alumnos inscritos cubren los costos y generan rentabilidad positiva.`
                    : `⚠️ Se necesitan al menos ${calculoEnVivo.puntoEquilibrioAlumnos} alumnos para no tener pérdidas operativas.`}
                </p>
              </div>

            </div>
          </div>

        </div>

        </form>
      )}

      {/* Modal de Autorización Exclusiva de Modificación de Costos Fijos */}
      <CostosFijosAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthorized={() => setCostosFijosAutorizados(true)}
        moneda={moneda}
      />

      {/* Modal de Aviso Preventivo de Costo Operativo Crítico antes de Guardar */}
      <CostoOperativoModalPreventivo
        isOpen={mostrarAvisoPreventivoModal}
        onClose={() => {
          setMostrarAvisoPreventivoModal(false);
          setTimeout(() => {
            document.getElementById('seccion-costos-operativos')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 80);
        }}
        onConfirmarGuardado={() => {
          if (!proyectoParaGuardarPendiente) return;
          onGuardar(proyectoParaGuardarPendiente);
          setGuardadoExitoso(true);
          setMostrarAvisoPreventivoModal(false);
          setProyectoParaGuardarPendiente(null);
        }}
        nombreProyecto={formData.nombreProyecto}
        codigoPrograma={formData.codigoPrograma}
        gastoTotalOperativo={calculoEnVivo.gastoTotalOperativo}
        umbralCritico={umbralCritico}
        moneda={moneda}
        costoDocente={calculoEnVivo.costoDocenteCalculado}
        costosFijos={calculoEnVivo.gastoTotalOperativo - calculoEnVivo.costoDocenteCalculado}
        puntoEquilibrio={calculoEnVivo.puntoEquilibrioAlumnos}
        precioSugeridoConISV={calculoEnVivo.precioSugeridoConISV || calculoEnVivo.precioSugeridoAlumno}
        alumnosProyectados={calculoEnVivo.alumnosProyectados}
        esEdicion={esEdicion}
      />

    </div>
  );
};
