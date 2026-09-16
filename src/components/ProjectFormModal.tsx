import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Save, 
  Calculator, 
  BookOpen, 
  DollarSign, 
  Users, 
  Sparkles,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Percent,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
  Receipt,
  FileText,
  Clock,
  Settings,
  XCircle,
  ShieldAlert,
  ArrowRight,
  AlertTriangle,
  GraduationCap,
  Scale,
  Edit3,
  ChevronDown,
  ChevronUp,
  Layers,
  Check,
  ExternalLink
} from 'lucide-react';
import { ProyectoEducativo, Moneda, TipoProyecto, NivelProyecto, MetodoVenta, EstadoProyecto, TipoServicioFiscal } from '../types';
import { calcularMetricasProyecto, formatearMoneda } from '../utils/calculations';
import { REGLAS_ISV_SERVICIOS, obtenerReglaISVPorServicio, obtenerReglaFiscalPorTipoProyecto } from '../utils/isvRules';
import { generarSiguienteCorrelativo, formatearCorrelativo } from '../utils/correlativoUtils';
import { sumarDiasHabiles, sumarDiasCalendario, contarDiasHabilesEntreFechas, formatearFechaCorta } from '../utils/dateUtils';
import { CurricularPlanningSection } from './CurricularPlanningSection';
import { DocenteProfileSection } from './academic/DocenteProfileSection';
import { obtenerConfiguracionHorasPorNivel } from '../utils/curricularUtils';
import { CostosFijosAuthModal } from './CostosFijosAuthModal';
import { 
  obtenerTodosLosSilabos, 
  buscarSilabo, 
  extraerDatosPedagogicosDeSilabo, 
  SilaboOficial 
} from '../utils/silaboCatalogUtils';
import { DocenteBanco, obtenerBancoDocentes } from '../utils/docenteDirectoryUtils';
import { 
  CostoOperativoBannerPreventivo, 
  CostoOperativoModalPreventivo, 
  cargarUmbralCriticoGuardado, 
  guardarUmbralCriticoStorage 
} from './CostoOperativoAlertaPreventiva';
import { 
  obtenerMetaFacturacionMensualPOA, 
  convertirAHNL, 
  obtenerTrimestrePorMes 
} from '../utils/poaMonthlyTrackingUtils';
import { formatearHNL } from '../utils/poa2026Data';
import { formatearEtiquetaMes } from '../utils/monthUtils';
import { PerfilGerencia } from '../utils/authPorGerencia';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGuardar: (proyecto: ProyectoEducativo) => void;
  proyectoAEditar?: ProyectoEducativo | null;
  proyectosExistentes?: ProyectoEducativo[];
  moneda: Moneda;
  vistaActual?: string;
  usuarioActivo?: PerfilGerencia;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  onClose,
  onGuardar,
  proyectoAEditar,
  proyectosExistentes = [],
  moneda,
  vistaActual,
  usuarioActivo,
}) => {
  const [formData, setFormData] = useState({
    id: '',
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
    docenteEspecialidad: '',
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
    fechaElaboracion: new Date().toISOString().slice(0, 10),
    diasHabilesVenta: 20,
    decisionPlazoVenta: undefined as 'Si' | 'No' | undefined,
    fechaRegistroDecision: '',
    horaRegistroDecision: '',
    detalleRegistroDecision: '',
    tiempoVentaCumplido: false,
    fechaProgramacion: new Date().toISOString().slice(0, 10),
    fechaVenta: sumarDiasHabiles(new Date().toISOString().slice(0, 10), 20),
    horasClase: 12,
    tarifaHoraDocente: 200 as string | number,
    costoDocenteManual: 0 as string | number,
    usarTarifaHora: true,
    costoZoom: 300 as string | number,
    costoPapeleria: 100 as string | number,
    gastosVarios: 100 as string | number,
    margenGananciaOperativa: 40 as string | number,
    alumnosProyectados: 6 as string | number,
    alumnosFinal: 6 as string | number,
    metodoVenta: 'Redes sociales' as MetodoVenta,
    seLlevoACabo: 'Planificado' as EstadoProyecto,
    observaciones: '',
    aprobacionFinalGerenciaGeneral: false,
    fechaAprobacionGerenciaGeneral: '',
    aprobadoPorGerenciaGeneral: 'Dr. Walter Pedroza - Gerencia General',
    observacionesAprobacionGeneral: '',
    silaboOrigenId: '',
    codigoSilaboOrigen: '',
    nombreSilaboOrigen: '',
  });

  // Catálogo unificado de sílabos oficiales y registrados
  const silabosDisponibles = useMemo(() => {
    return obtenerTodosLosSilabos(proyectosExistentes);
  }, [proyectosExistentes]);

  const [silaboSeleccionadoId, setSilaboSeleccionadoId] = useState<string>('');
  const [mostrarEdicionManualPedagogica, setMostrarEdicionManualPedagogica] = useState(false);
  const [mostrarVistaPreviaSilabo, setMostrarVistaPreviaSilabo] = useState(false);

  const silaboActual = useMemo(() => {
    if (!silaboSeleccionadoId) return null;
    return silabosDisponibles.find((s) => s.id === silaboSeleccionadoId) || null;
  }, [silaboSeleccionadoId, silabosDisponibles]);

  const handleSeleccionarSilabo = (id: string) => {
    setSilaboSeleccionadoId(id);
    if (!id) return;
    const silabo = buscarSilabo(id, proyectosExistentes);
    if (silabo) {
      const datos = extraerDatosPedagogicosDeSilabo(silabo);
      const reglaFiscal = obtenerReglaFiscalPorTipoProyecto(datos.tipoProyecto);
      
      // REGLA INSTITUCIONAL OBLIGATORIA: Todos los cursos básicos son de 12 horas automáticas
      const esCursoBasico = datos.nivel === 'Básico' ||
        /b[áa]sico/i.test(datos.nombreProyecto || '') ||
        /curso.*b[áa]sico/i.test(datos.nombreProyecto || '') ||
        (datos.tipoProyecto === 'Curso' && !datos.nivel);

      const horasFinales = esCursoBasico ? 12 : datos.horasClase;
      const temasFinales = esCursoBasico ? 4 : datos.cantidadTemas;
      const horasTemaFinales = esCursoBasico ? 3 : datos.horasClasePorTema;
      const nivelFinal: NivelProyecto = esCursoBasico ? 'Básico' : (datos.nivel || 'Básico');

      setFormData((prev) => ({
        ...prev,
        ...datos,
        nivel: nivelFinal,
        tipoProyecto: datos.tipoProyecto,
        servicioFiscal: reglaFiscal.servicio as TipoServicioFiscal,
        aplicaISV: reglaFiscal.gravaISV,
        tarifaHoraDocente: datos.tarifaHoraDocente || prev.tarifaHoraDocente,
        cantidadTemas: temasFinales,
        horasClasePorTema: horasTemaFinales,
        horasClase: horasFinales,
        costoDocenteManual: prev.usarTarifaHora ? prev.costoDocenteManual : (horasFinales * (Number(datos.tarifaHoraDocente) || 200)),
      }));
      if (
        campoConError === 'select-silabo-oficial' || 
        campoConError === 'input-nombre-proyecto' || 
        campoConError === 'input-objetivo' || 
        campoConError === 'input-temas-impartir' || 
        campoConError === 'input-docente'
      ) {
        setCampoConError(null);
        setAlertaSeguridad(null);
      }
    }
  };

  // Modo de visualización según rol de usuario autenticado y gerencia
  const [modoFormulario, setModoFormulario] = useState<'academica' | 'comercial' | 'integral'>(() => {
    if (usuarioActivo) {
      if (usuarioActivo.id === 'gerencia-academica') return 'academica';
      if (usuarioActivo.id === 'gerencia-comercializacion') return 'comercial';
      if (usuarioActivo.id === 'gerencia-general') return 'integral';
    }
    if (vistaActual === 'gerencia-academica') return 'academica';
    if (vistaActual === 'gerencia-comercializacion') return 'comercial';
    return 'integral';
  });

  useEffect(() => {
    if (usuarioActivo) {
      if (usuarioActivo.id === 'gerencia-academica') {
        setModoFormulario('academica');
        return;
      }
      if (usuarioActivo.id === 'gerencia-comercializacion') {
        setModoFormulario('comercial');
        return;
      }
      if (usuarioActivo.id === 'auditor-interno') {
        setModoFormulario('integral');
        return;
      }
    }
    if (vistaActual === 'gerencia-academica') {
      setModoFormulario('academica');
    } else if (vistaActual === 'gerencia-comercializacion') {
      setModoFormulario('comercial');
    } else {
      setModoFormulario('integral');
    }
  }, [vistaActual, isOpen, usuarioActivo]);

  const esModoAcad = modoFormulario === 'academica';

  // Estado de autorización para modificar costos fijos (Zoom, Papelería, Varios = 500 c/u)
  const [costosFijosAutorizados, setCostosFijosAutorizados] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Umbral crítico institucional para validación preventiva de costos operativos
  const [umbralCritico, setUmbralCritico] = useState<number>(() => cargarUmbralCriticoGuardado(moneda));
  const [mostrarAvisoPreventivoModal, setMostrarAvisoPreventivoModal] = useState(false);
  const [proyectoParaGuardarPendiente, setProyectoParaGuardarPendiente] = useState<ProyectoEducativo | null>(null);

  // Estados para Medida de Seguridad y Control de Cumplimiento Curricular
  const [campoConError, setCampoConError] = useState<string | null>(null);
  const [alertaSeguridad, setAlertaSeguridad] = useState<{
    idElemento: string;
    nombreCampo: string;
    seccion: string;
    mensaje: string;
    totalFaltantes: number;
    listaPendientes: Array<{ id: string; nombre: string }>;
    autoRellenar?: () => void;
    textoAutoRellenar?: string;
  } | null>(null);

  // Reloj digital y fecha en vivo para el sellado automático de la fecha y hora al grabar
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

  const horaEnVivo = fechaHoraEnVivo.hora;
  const fechaEnVivo = fechaHoraEnVivo.fecha;

  useEffect(() => {
    setUmbralCritico(cargarUmbralCriticoGuardado(moneda));
  }, [moneda]);

  useEffect(() => {
    if (proyectoAEditar) {
      const servicioFiscal = proyectoAEditar.servicioFiscal || 'Servicios educativos no acreditados (talleres, cursos libres)';
      const regla = obtenerReglaISVPorServicio(servicioFiscal);
      const aplicaISV = proyectoAEditar.aplicaISV !== undefined ? proyectoAEditar.aplicaISV : regla.gravaISV;
      const numCorrelativo = proyectoAEditar.numeroCorrelativo || parseInt(proyectoAEditar.id, 10) || 1;
      const padNum = String(numCorrelativo).padStart(3, '0');

      const silaboEncontrado = silabosDisponibles.find(
        (s) => s.id === proyectoAEditar.silaboOrigenId ||
               s.codigoPrograma === proyectoAEditar.codigoSilaboOrigen ||
               s.nombreProyecto.trim().toLowerCase() === proyectoAEditar.nombreProyecto?.trim().toLowerCase()
      );
      setSilaboSeleccionadoId(silaboEncontrado?.id || proyectoAEditar.silaboOrigenId || '');

      setFormData({
        id: proyectoAEditar.id,
        numeroCorrelativo: numCorrelativo,
        codigoPrograma: proyectoAEditar.codigoPrograma || `SUM-2026-${padNum}`,
        codigoFiscalSAR: proyectoAEditar.codigoFiscalSAR || `SAR-ISV-2026-${padNum}`,
        nombreProyecto: proyectoAEditar.nombreProyecto,
        objetivoGeneral: proyectoAEditar.objetivoGeneral,
        temasImpartir: proyectoAEditar.temasImpartir || '',
        cantidadTemas: proyectoAEditar.cantidadTemas || 4,
        horasClasePorTema: proyectoAEditar.horasClasePorTema || (proyectoAEditar.horasClase ? Math.max(1, Math.round(proyectoAEditar.horasClase / (proyectoAEditar.cantidadTemas || 4))) : (proyectoAEditar.nivel === 'Básico' ? 3 : 5)),
        metodologia: proyectoAEditar.metodologia || 'Aprendizaje Basado en Proyectos (ABP) & Casos Reales',
        planificacionPdf: proyectoAEditar.planificacionPdf,
        nombreDocente: proyectoAEditar.nombreDocente,
        docenteClasificacion: (proyectoAEditar.docenteClasificacion || 'Licenciatura') as 'Licenciatura' | 'Ingeniería' | 'Maestría' | 'Doctorado' | 'Posdoctorado' | 'Técnico',
        docenteTelefono: proyectoAEditar.docenteTelefono || '',
        docenteCorreo: proyectoAEditar.docenteCorreo || '',
        seccion: proyectoAEditar.seccion || 'Sección A',
        horario: proyectoAEditar.horario || '06:00 PM - 08:00 PM',
        diasClase: proyectoAEditar.diasClase || 'Lunes, Miércoles y Viernes',
        calificacionCurso: proyectoAEditar.calificacionCurso || 5.0,
        tipoProyecto: proyectoAEditar.tipoProyecto,
        nivel: proyectoAEditar.nivel,
        servicioFiscal,
        aplicaISV,
        fechaElaboracion: proyectoAEditar.fechaElaboracion || proyectoAEditar.fechaProgramacion || new Date().toISOString().slice(0, 10),
        diasHabilesVenta: proyectoAEditar.diasHabilesVenta || 20,
        decisionPlazoVenta: proyectoAEditar.decisionPlazoVenta || (proyectoAEditar.seLlevoACabo === 'No se llevó a cabo' || proyectoAEditar.procesoCerrado ? 'No' : (proyectoAEditar.seLlevoACabo === 'Listo' || proyectoAEditar.seLlevoACabo === 'Sí' || proyectoAEditar.seLlevoACabo === 'En proceso' ? 'Si' : undefined)),
        fechaRegistroDecision: proyectoAEditar.fechaRegistroDecision || '',
        horaRegistroDecision: proyectoAEditar.horaRegistroDecision || '',
        detalleRegistroDecision: proyectoAEditar.detalleRegistroDecision || '',
        tiempoVentaCumplido: Boolean(proyectoAEditar.decisionPlazoVenta === 'No' || proyectoAEditar.seLlevoACabo === 'No se llevó a cabo' || proyectoAEditar.procesoCerrado),
        fechaProgramacion: proyectoAEditar.fechaProgramacion || new Date().toISOString().slice(0, 10),
        fechaVenta: proyectoAEditar.fechaVenta || sumarDiasHabiles(proyectoAEditar.fechaElaboracion || proyectoAEditar.fechaProgramacion || new Date().toISOString().slice(0, 10), 20),
        horasClase: proyectoAEditar.horasClase,
        tarifaHoraDocente: proyectoAEditar.tarifaHoraDocente ?? 200,
        costoDocenteManual: proyectoAEditar.costoDocenteManual ?? (proyectoAEditar.horasClase * (proyectoAEditar.tarifaHoraDocente ?? 200)),
        usarTarifaHora: !proyectoAEditar.costoDocenteManual || proyectoAEditar.costoDocenteManual === (proyectoAEditar.horasClase * (proyectoAEditar.tarifaHoraDocente ?? 200)),
        costoZoom: proyectoAEditar.costoZoom ?? 300,
        costoPapeleria: proyectoAEditar.costoPapeleria ?? 100,
        gastosVarios: proyectoAEditar.gastosVarios ?? 100,
        margenGananciaOperativa: proyectoAEditar.margenGananciaOperativa,
        alumnosProyectados: proyectoAEditar.alumnosProyectados,
        alumnosFinal: Math.max(4, Number(proyectoAEditar.alumnosFinal) || 4),
        metodoVenta: proyectoAEditar.metodoVenta,
        seLlevoACabo: proyectoAEditar.seLlevoACabo,
        observaciones: proyectoAEditar.observaciones,
        aprobacionFinalGerenciaGeneral: proyectoAEditar.aprobacionFinalGerenciaGeneral || false,
        fechaAprobacionGerenciaGeneral: proyectoAEditar.fechaAprobacionGerenciaGeneral || (proyectoAEditar.aprobacionFinalGerenciaGeneral ? new Date().toISOString().slice(0, 10) : ''),
        aprobadoPorGerenciaGeneral: proyectoAEditar.aprobadoPorGerenciaGeneral || 'Dr. Walter Pedroza - Gerencia General',
        observacionesAprobacionGeneral: proyectoAEditar.observacionesAprobacionGeneral || '',
        silaboOrigenId: proyectoAEditar.silaboOrigenId || silaboEncontrado?.id || '',
        codigoSilaboOrigen: proyectoAEditar.codigoSilaboOrigen || silaboEncontrado?.codigoPrograma || '',
        nombreSilaboOrigen: proyectoAEditar.nombreSilaboOrigen || silaboEncontrado?.nombreProyecto || '',
      });
      setCostosFijosAutorizados(false);
    } else {
      // Cálculo automático del siguiente correlativo secuencial
      const siguiente = generarSiguienteCorrelativo(proyectosExistentes, 'Capacitación profesional / Mentoría ejecutiva', 2026);
      const hoyISO = new Date().toISOString().slice(0, 10);
      const primerSilabo = silabosDisponibles[0];
      const datosPed = primerSilabo ? extraerDatosPedagogicosDeSilabo(primerSilabo) : null;
      setSilaboSeleccionadoId(primerSilabo?.id || '');

      const bancoDocentes = obtenerBancoDocentes();
      const docentePorDefecto = bancoDocentes.length > 0 ? bancoDocentes[0] : null;

      setFormData({
        id: Date.now().toString(),
        numeroCorrelativo: siguiente.numeroCorrelativo,
        codigoPrograma: siguiente.codigoPrograma,
        codigoFiscalSAR: siguiente.codigoFiscalSAR,
        nombreProyecto: datosPed?.nombreProyecto || '',
        objetivoGeneral: datosPed?.objetivoGeneral || '',
        temasImpartir: datosPed?.temasImpartir || '',
        cantidadTemas: datosPed?.cantidadTemas || 4,
        horasClasePorTema: datosPed?.horasClasePorTema || 3,
        horasClase: datosPed?.horasClase || 12,
        metodologia: datosPed?.metodologia || 'Aprendizaje Basado en Proyectos (ABP) & Casos Reales',
        planificacionPdf: undefined,
        nombreDocente: datosPed?.nombreDocente || docentePorDefecto?.nombre || '',
        docenteEspecialidad: datosPed?.docenteEspecialidad || docentePorDefecto?.especialidad || '',
        docenteClasificacion: (datosPed?.docenteClasificacion as any) || (docentePorDefecto?.clasificacion as any) || 'Licenciatura',
        docenteTelefono: datosPed?.docenteTelefono || docentePorDefecto?.telefono || '',
        docenteCorreo: datosPed?.docenteCorreo || docentePorDefecto?.email || docentePorDefecto?.correo || '',
        tarifaHoraDocente: datosPed?.tarifaHoraDocente || docentePorDefecto?.tarifaHoraSugerida || 200,
        costoHoraDocente: datosPed?.tarifaHoraDocente || docentePorDefecto?.tarifaHoraSugerida || 200,
        seccion: 'Sección A',
        horario: '06:00 PM - 08:00 PM',
        diasClase: 'Lunes, Miércoles y Viernes',
        calificacionCurso: 5.0,
        tipoProyecto: datosPed?.tipoProyecto || 'Capacitación profesional / Mentoría ejecutiva',
        nivel: (datosPed?.nivel || 'Básico') as NivelProyecto,
        servicioFiscal: (datosPed?.servicioFiscal as any) || 'Capacitación profesional / Mentoría ejecutiva',
        aplicaISV: datosPed?.aplicaISV !== undefined ? datosPed.aplicaISV : true,
        fechaElaboracion: hoyISO,
        diasHabilesVenta: 20,
        decisionPlazoVenta: undefined,
        fechaRegistroDecision: '',
        horaRegistroDecision: '',
        detalleRegistroDecision: '',
        tiempoVentaCumplido: false,
        fechaProgramacion: hoyISO,
        fechaVenta: sumarDiasHabiles(hoyISO, 20),
        costoDocenteManual: 0,
        usarTarifaHora: true,
        costoZoom: 300, // Fijado por política
        costoPapeleria: 100, // Fijado por política
        gastosVarios: 100, // Fijado por política
        margenGananciaOperativa: 40,
        alumnosProyectados: 6,
        alumnosFinal: 6,
        metodoVenta: 'Redes sociales',
        seLlevoACabo: 'Planificado',
        observaciones: '',
        aprobacionFinalGerenciaGeneral: false,
        fechaAprobacionGerenciaGeneral: '',
        aprobadoPorGerenciaGeneral: 'Dr. Walter Pedroza - Gerencia General',
        observacionesAprobacionGeneral: '',
        silaboOrigenId: primerSilabo?.id || '',
        codigoSilaboOrigen: primerSilabo?.codigoPrograma || '',
        nombreSilaboOrigen: primerSilabo?.nombreProyecto || '',
      });
      setCostosFijosAutorizados(false);
    }
  }, [proyectoAEditar, isOpen, proyectosExistentes, silabosDisponibles]);

  const handleRestablecerCostosEstandar = () => {
    setFormData(prev => ({
      ...prev,
      costoZoom: 300,
      costoPapeleria: 100,
      gastosVarios: 100,
      tarifaHoraDocente: Number(prev.tarifaHoraDocente) > 0 ? prev.tarifaHoraDocente : 200,
      horasClase: Number(prev.horasClase) > 0 ? prev.horasClase : 12,
      usarTarifaHora: true,
    }));
    if (campoConError === 'seccion-costos-operativos' || campoConError === 'input-costo-zoom' || campoConError === 'input-tarifa-docente') {
      setCampoConError(null);
      setAlertaSeguridad(null);
    }
  };

  // Conversión segura de horas a número entero
  const horasClaseEntero = parseInt(String(formData.horasClase || '0'), 10) || 0;

  // Cálculo en vivo
  const calculoEnVivo = calcularMetricasProyecto({
    id: formData.id || 'preview',
    nombreProyecto: formData.nombreProyecto || 'Nuevo Proyecto',
    objetivoGeneral: formData.objetivoGeneral,
    nombreDocente: formData.nombreDocente,
    tipoProyecto: formData.tipoProyecto,
    nivel: formData.nivel,
    servicioFiscal: formData.servicioFiscal,
    aplicaISV: formData.aplicaISV,
    fechaProgramacion: formData.fechaProgramacion,
    fechaVenta: formData.fechaVenta,
    horasClase: horasClaseEntero,
    tarifaHoraDocente: Number(formData.tarifaHoraDocente) || 0,
    costoDocenteManual: formData.usarTarifaHora ? undefined : Number(formData.costoDocenteManual),
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

  // Métricas para verificación de POA 2026 y Rebaja Mensual
  const mesNumProyecto = formData.fechaProgramacion ? (parseInt(formData.fechaProgramacion.slice(5, 7), 10) || 9) : 9;
  const mesKeyProyecto = formData.fechaProgramacion ? formData.fechaProgramacion.slice(0, 7) : '2026-09';
  const metaMesPOA = obtenerMetaFacturacionMensualPOA(mesNumProyecto);
  const trimestreMesPOA = obtenerTrimestrePorMes(mesNumProyecto);
  const impactoRebajaHNL = convertirAHNL(calculoEnVivo.ingresoRealTotal || 0, moneda);
  const saldoRestanteMesEstimado = Math.max(0, metaMesPOA - (formData.aprobacionFinalGerenciaGeneral ? impactoRebajaHNL : 0));

  // Detección institucional: Costo Operativo Proyectado vs. Ingreso Total Esperado (Límite prudencial: 60%)
  const costoOperativoProyectado = Number(calculoEnVivo.gastoTotalOperativo) || 0;
  // Ingreso Total Esperado: Se calcula sobre el ingreso total facturado/previsto (ingresoRealTotal si hay participantes o precioVentaRequerido si se proyecta)
  const ingresoTotalEsperado = (calculoEnVivo.ingresoRealTotal && calculoEnVivo.ingresoRealTotal > 0)
    ? calculoEnVivo.ingresoRealTotal
    : (calculoEnVivo.precioVentaRequerido || 0);
  const porcentajeCostoSobreIngreso = ingresoTotalEsperado > 0
    ? (costoOperativoProyectado / ingresoTotalEsperado) * 100
    : 0;
  const excedeSesentaPorcientoCostoOperativo = costoOperativoProyectado > 0 && ingresoTotalEsperado > 0 && porcentajeCostoSobreIngreso > 60;

  if (!isOpen) return null;

  // Función para llevar al usuario de forma suave y automática al campo faltante y enfocarlo
  const llevarAlCampoFaltante = (idElemento: string) => {
    setCampoConError(idElemento);
    setTimeout(() => {
      const el = document.getElementById(idElemento);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
        if ('select' in el && typeof (el as any).select === 'function') {
          (el as any).select();
        }
      }
    }, 120);
  };

  // Función de apoyo para rellenar de forma automática todos los campos institucionales y sugeridos faltantes
  const rellenarTodosLosCamposPendientes = () => {
    const sig = generarSiguienteCorrelativo(proyectosExistentes, formData.tipoProyecto, 2026);
    const nombreDef = formData.nombreProyecto.trim() || 'Curso de Capacitación Profesional';
    setFormData(prev => ({
      ...prev,
      nombreProyecto: prev.nombreProyecto.trim() || 'Curso de Capacitación Profesional',
      codigoPrograma: prev.codigoPrograma && prev.codigoPrograma.trim() ? prev.codigoPrograma : sig.codigoPrograma,
      codigoFiscalSAR: prev.codigoFiscalSAR && prev.codigoFiscalSAR.trim() ? prev.codigoFiscalSAR : sig.codigoFiscalSAR,
      objetivoGeneral: prev.objetivoGeneral && prev.objetivoGeneral.trim().length >= 5 ? prev.objetivoGeneral : `Desarrollar en los participantes las competencias teórico-prácticas fundamentales de ${nombreDef}, facilitando la aplicación operativa de metodologías clave en su desempeño profesional con altos estándares de calidad.`,
      temasImpartir: prev.temasImpartir && prev.temasImpartir.trim().length >= 10 ? prev.temasImpartir : `Módulo 1: Fundamentos y conceptos esenciales de ${nombreDef}\nMódulo 2: Técnicas aplicadas y resolución de casos prácticos\nMódulo 3: Métodos avanzados y mejores prácticas operativas\nMódulo 4: Proyecto integrador y evaluación final de competencias`,
      nivel: prev.nivel || 'Básico',
      cantidadTemas: Number(prev.cantidadTemas) >= 1 ? Number(prev.cantidadTemas) : 4,
      horasClasePorTema: Number(prev.horasClasePorTema) >= 1 ? Number(prev.horasClasePorTema) : 3,
      horasClase: Number(prev.horasClase) >= 1 ? Number(prev.horasClase) : 12,
      metodologia: prev.metodologia && prev.metodologia.trim().length >= 5 ? prev.metodologia : 'Aprendizaje Basado en Proyectos (ABP) & Casos Reales',
      nombreDocente: prev.nombreDocente && prev.nombreDocente.trim().length >= 3 ? prev.nombreDocente : 'MSc. Elena Rostrán',
      seccion: prev.seccion && prev.seccion.trim() ? prev.seccion : 'Sección A',
      horario: prev.horario && prev.horario.trim() ? prev.horario : '06:00 PM - 08:00 PM',
      diasClase: prev.diasClase && prev.diasClase.trim() ? prev.diasClase : 'Lunes, Miércoles y Viernes',
      tarifaHoraDocente: Number(prev.tarifaHoraDocente) > 0 ? prev.tarifaHoraDocente : 200,
      costoZoom: Number(prev.costoZoom) > 0 ? prev.costoZoom : 300,
      costoPapeleria: Number(prev.costoPapeleria) > 0 ? prev.costoPapeleria : 100,
      gastosVarios: Number(prev.gastosVarios) > 0 ? prev.gastosVarios : 100,
      margenGananciaOperativa: Number(prev.margenGananciaOperativa) > 0 ? prev.margenGananciaOperativa : 40,
      alumnosProyectados: Number(prev.alumnosProyectados) >= 6 && Number.isInteger(Number(prev.alumnosProyectados)) ? prev.alumnosProyectados : 6,
    }));
    setAlertaSeguridad(null);
    setCampoConError(null);
  };

  // Medida de Seguridad y Control de Cumplimiento Curricular:
  // Todos los campos obligatorios del diseño curricular deben estar completos.
  // Si falta información, el sistema impide la grabación y traslada automáticamente al usuario al campo exacto.
  const validarFormularioSeguridad = (): boolean => {
    const reglas: Array<{
      idElemento: string;
      nombreCampo: string;
      seccion: string;
      esValido: () => boolean;
      mensaje: string;
      autoRellenar?: () => void;
      textoAutoRellenar?: string;
    }> = [
      {
        idElemento: 'input-codigo-programa',
        nombreCampo: 'Código de Programa SUMMIT',
        seccion: 'Control Correlativo Institucional',
        esValido: () => Boolean(formData.codigoPrograma && formData.codigoPrograma.trim().length >= 3),
        mensaje: 'El Código de Programa SUMMIT es obligatorio para la trazabilidad y control correlativo institucional.',
        autoRellenar: () => {
          const sig = generarSiguienteCorrelativo(proyectosExistentes, formData.tipoProyecto, 2026);
          setFormData(prev => ({ ...prev, codigoPrograma: sig.codigoPrograma }));
        },
        textoAutoRellenar: 'Regenerar Código SUMMIT'
      },
      {
        idElemento: 'input-codigo-fiscal-sar',
        nombreCampo: 'Correlativo Fiscal SAR (ISV)',
        seccion: 'Control Fiscal SAR',
        esValido: () => Boolean(formData.codigoFiscalSAR && formData.codigoFiscalSAR.trim().length >= 3),
        mensaje: 'El Correlativo Fiscal SAR es obligatorio para la coincidencia tributaria del 15% ISV ante el SAR.',
        autoRellenar: () => {
          const sig = generarSiguienteCorrelativo(proyectosExistentes, formData.tipoProyecto, 2026);
          setFormData(prev => ({ ...prev, codigoFiscalSAR: sig.codigoFiscalSAR }));
        },
        textoAutoRellenar: 'Regenerar Correlativo Fiscal SAR'
      },
      {
        idElemento: 'select-silabo-oficial',
        nombreCampo: 'Selección de Sílabo Oficial Base',
        seccion: '1. Estructura Pedagógica',
        esValido: () => Boolean(formData.nombreProyecto && formData.nombreProyecto.trim().length >= 3),
        mensaje: silabosDisponibles.length > 0 
          ? 'Seleccione un sílabo creado en Gerencia Académica o ingrese el nombre del proyecto educativo.' 
          : 'Ingrese el nombre del proyecto educativo.',
        autoRellenar: () => {
          if (silabosDisponibles[0]) {
            handleSeleccionarSilabo(silabosDisponibles[0].id);
          }
        },
        textoAutoRellenar: 'Vincular Sílabo Oficial Creado'
      },
      {
        idElemento: 'input-objetivo',
        nombreCampo: 'Objetivo General del Curso',
        seccion: '1. Datos del Programa',
        esValido: () => Boolean(formData.objetivoGeneral && formData.objetivoGeneral.trim().length >= 5),
        mensaje: 'El Objetivo General es un requisito pedagógico obligatorio para validar el diseño curricular.',
        autoRellenar: () => {
          setFormData(prev => ({
            ...prev,
            objetivoGeneral: prev.nombreProyecto
              ? `Desarrollar en los participantes las competencias teórico-prácticas fundamentales de ${prev.nombreProyecto}, facilitando la aplicación efectiva de metodologías clave en su desempeño profesional con altos estándares de calidad.`
              : 'Capacitar a los estudiantes en las competencias técnicas y metodológicas fundamentales del programa formativo.'
          }));
        },
        textoAutoRellenar: 'Generar Objetivo Pedagógico Sugerido'
      },
      {
        idElemento: 'input-temas-impartir',
        nombreCampo: 'Temas a Impartir (Contenido Curricular / Syllabus)',
        seccion: '1. Datos del Programa',
        esValido: () => Boolean(formData.temasImpartir && formData.temasImpartir.trim().length >= 10),
        mensaje: 'Debe detallar el contenido temático / syllabus curricular que se impartirá en las sesiones de clase.',
        autoRellenar: () => {
          setFormData(prev => ({
            ...prev,
            temasImpartir: `Módulo 1: Fundamentos y conceptos esenciales de ${prev.nombreProyecto || 'la materia'}\nMódulo 2: Técnicas aplicadas y resolución de casos prácticos\nMódulo 3: Métodos avanzados y optimización operativa\nMódulo 4: Proyecto integrador y evaluación final de competencias`
          }));
        },
        textoAutoRellenar: 'Cargar Syllabus Estructurado (4 Módulos)'
      },
      {
        idElemento: 'select-nivel-curricular',
        nombreCampo: 'Nivel Académico del Curso',
        seccion: 'Estructura Curricular',
        esValido: () => Boolean(formData.nivel),
        mensaje: 'Debe seleccionar el nivel académico del curso (Básico, Intermedio, Avanzado, etc.).'
      },
      {
        idElemento: 'input-cantidad-temas',
        nombreCampo: 'Cantidad de Temas / Módulos',
        seccion: 'Estructura Curricular',
        esValido: () => Number(formData.cantidadTemas) >= 1,
        mensaje: 'La cantidad de temas debe ser al menos 1 (en cursos básicos la norma institucional es 4 temas).',
        autoRellenar: () => {
          setFormData(prev => ({ ...prev, cantidadTemas: 4, horasClasePorTema: 3, horasClase: 12 }));
        },
        textoAutoRellenar: 'Aplicar Norma Básica (4 Temas)'
      },
      {
        idElemento: 'input-horas-por-tema',
        nombreCampo: 'Horas Clase por Tema',
        seccion: 'Estructura Curricular',
        esValido: () => Number(formData.horasClasePorTema) >= 1,
        mensaje: 'Debe especificar las horas de clase por cada tema (en cursos básicos la norma institucional es 3 horas).',
        autoRellenar: () => {
          const cant = Number(formData.cantidadTemas) || 4;
          setFormData(prev => ({ ...prev, horasClasePorTema: 3, horasClase: cant * 3 }));
        },
        textoAutoRellenar: 'Fijar 3 Horas por Tema'
      },
      {
        idElemento: 'input-total-horas-curso',
        nombreCampo: 'Total Horas del Curso',
        seccion: 'Estructura Curricular',
        esValido: () => Number(formData.horasClase) >= 1,
        mensaje: 'El total de horas de clase del curso no puede ser 0 ni quedar vacío (en cursos básicos la norma es 12 horas).',
        autoRellenar: () => {
          const cant = Number(formData.cantidadTemas) || 4;
          const hpt = Number(formData.horasClasePorTema) || 3;
          setFormData(prev => ({ ...prev, horasClase: cant * hpt }));
        },
        textoAutoRellenar: 'Calcular Total Horas Automático'
      },
      {
        idElemento: 'input-metodologia',
        nombreCampo: 'Metodología a Implementar',
        seccion: 'Estructura Curricular',
        esValido: () => Boolean(formData.metodologia && formData.metodologia.trim().length >= 5),
        mensaje: 'La metodología pedagógica es obligatoria para garantizar la calidad docente del diseño curricular.',
        autoRellenar: () => {
          setFormData(prev => ({ ...prev, metodologia: 'Aprendizaje Basado en Proyectos (ABP) & Casos Reales' }));
        },
        textoAutoRellenar: 'Aplicar Metodología ABP'
      },
      {
        idElemento: 'input-docente',
        nombreCampo: 'Docente Asignado',
        seccion: 'Cuerpo Académico',
        esValido: () => Boolean(formData.nombreDocente && formData.nombreDocente.trim().length >= 3),
        mensaje: 'Debe asignar el nombre del docente que impartirá el programa formativo (mínimo 3 caracteres).'
      },
      {
        idElemento: 'select-clasificacion-docente',
        nombreCampo: 'Clasificación Académica del Docente',
        seccion: 'Cuerpo Académico',
        esValido: () => Boolean(formData.docenteClasificacion),
        mensaje: 'Debe seleccionar el grado académico del docente (Licenciatura, Maestría, Doctorado, etc.).'
      },
      {
        idElemento: 'input-seccion',
        nombreCampo: 'Sección / Grupo',
        seccion: 'Programación Académica',
        esValido: () => Boolean(formData.seccion && formData.seccion.trim().length >= 1),
        mensaje: 'Debe indicar la sección o grupo asignado al curso (ej. Sección A, Fines de semana).',
        autoRellenar: () => {
          setFormData(prev => ({ ...prev, seccion: 'Sección A' }));
        },
        textoAutoRellenar: 'Asignar Sección A'
      },
      {
        idElemento: 'input-horario',
        nombreCampo: 'Horario de Clase',
        seccion: 'Programación Académica',
        esValido: () => Boolean(formData.horario && formData.horario.trim().length >= 3),
        mensaje: 'Debe especificar el horario de clase (ej. 06:00 PM - 08:00 PM).',
        autoRellenar: () => {
          setFormData(prev => ({ ...prev, horario: '06:00 PM - 08:00 PM' }));
        },
        textoAutoRellenar: 'Asignar 06:00 PM - 08:00 PM'
      },
      {
        idElemento: 'input-dias',
        nombreCampo: 'Días de Clase',
        seccion: 'Programación Académica',
        esValido: () => Boolean(formData.diasClase && formData.diasClase.trim().length >= 3),
        mensaje: 'Debe indicar los días de clase asignados (ej. Sábados y Domingos / Lunes a Viernes).',
        autoRellenar: () => {
          setFormData(prev => ({ ...prev, diasClase: 'Lunes, Miércoles y Viernes' }));
        },
        textoAutoRellenar: 'Asignar Lunes, Miércoles y Viernes'
      },
      {
        idElemento: 'input-tarifa-docente',
        nombreCampo: 'Honorarios Docentes',
        seccion: 'Costos Operativos Directos',
        esValido: () => {
          const horas = parseInt(String(formData.horasClase || '0'), 10) || 0;
          const tarifa = Number(formData.tarifaHoraDocente) || 0;
          const costoManual = Number(formData.costoDocenteManual) || 0;
          const honorarios = formData.usarTarifaHora ? horas * tarifa : (costoManual > 0 ? costoManual : horas * tarifa);
          return honorarios > 0;
        },
        mensaje: 'Los honorarios docentes no pueden ser cero (0.00). Todo proyecto educativo elevado a Gerencia General debe registrar una tarifa horaria y horas válidas o un costo docente asignado.',
        autoRellenar: () => {
          setFormData(prev => ({
            ...prev,
            tarifaHoraDocente: Number(prev.tarifaHoraDocente) > 0 ? prev.tarifaHoraDocente : 200,
            horasClase: Number(prev.horasClase) > 0 ? prev.horasClase : 12,
            usarTarifaHora: true,
          }));
        },
        textoAutoRellenar: 'Asignar Tarifa Estándar (200 / 12 hrs)'
      },
      {
        idElemento: 'input-costo-zoom',
        nombreCampo: 'Costos Fijos Operativos (Zoom, Papelería, Varios)',
        seccion: 'Costos Operativos Fijos',
        esValido: () => {
          const totalFijos = Number(formData.costoZoom || 0) + Number(formData.costoPapeleria || 0) + Number(formData.gastosVarios || 0);
          return totalFijos > 0;
        },
        mensaje: 'Los costos fijos de soporte operativo (Zoom, papelería y gastos varios) no pueden ser cero (0.00). Se requiere sustento operativo institucional antes del dictamen de Gerencia General.',
        autoRellenar: () => {
          setFormData(prev => ({
            ...prev,
            costoZoom: 300,
            costoPapeleria: 100,
            gastosVarios: 100,
          }));
        },
        textoAutoRellenar: 'Restablecer Costos Fijos (300 / 100 / 100)'
      },
      {
        idElemento: 'seccion-costos-operativos',
        nombreCampo: 'Gasto Total Operativo del Proyecto',
        seccion: '2. Costos Operativos',
        esValido: () => calculoEnVivo.gastoTotalOperativo > 0,
        mensaje: 'El Gasto Total Operativo del proyecto no puede ser cero (0.00). La Gerencia General prohíbe dictaminar o autorizar proyectos con presupuesto operativo nulo.',
        autoRellenar: handleRestablecerCostosEstandar,
        textoAutoRellenar: 'Restablecer Costos Operativos Estándar'
      },
      {
        idElemento: 'input-margen-ganancia',
        nombreCampo: 'Margen de Ganancia Operativa',
        seccion: 'Costos y Rentabilidad',
        esValido: () => Number(formData.margenGananciaOperativa) > 0,
        mensaje: 'El margen de ganancia operativa debe ser mayor a 0% para garantizar un precio de venta económicamente sostenible.',
        autoRellenar: () => {
          setFormData(prev => ({ ...prev, margenGananciaOperativa: 40 }));
        },
        textoAutoRellenar: 'Fijar Margen Institucional (40%)'
      },
      {
        idElemento: 'input-alumnos-proyectados',
        nombreCampo: 'Alumnos Proyectados (Existencia Numérica)',
        seccion: 'Costos y Rentabilidad',
        esValido: () => {
          const val = formData.alumnosProyectados;
          if (val === '' || val === null || val === undefined) return false;
          const num = Number(val);
          return !isNaN(num) && num > 0;
        },
        mensaje: 'Debe ingresar una cantidad numérica válida de alumnos proyectados.',
        autoRellenar: () => {
          setFormData(prev => ({ ...prev, alumnosProyectados: 6 }));
        },
        textoAutoRellenar: 'Fijar 6 Alumnos'
      },
      {
        idElemento: 'input-alumnos-proyectados',
        nombreCampo: 'Alumnos Proyectados (Número Entero)',
        seccion: 'Costos y Rentabilidad',
        esValido: () => {
          const num = Number(formData.alumnosProyectados);
          return Number.isInteger(num) && num > 0;
        },
        mensaje: 'Inconsistencia en la proyección de alumnos: La meta debe ser un número entero de estudiantes (sin decimales ni fracciones).',
        autoRellenar: () => {
          setFormData(prev => ({
            ...prev,
            alumnosProyectados: Math.max(6, Math.round(Number(prev.alumnosProyectados) || 6))
          }));
        },
        textoAutoRellenar: 'Redondear a Entero'
      },
      {
        idElemento: 'input-alumnos-proyectados',
        nombreCampo: 'Alumnos Proyectados (Mínimo Institucional)',
        seccion: 'Costos y Rentabilidad',
        esValido: () => Number(formData.alumnosProyectados) >= 6,
        mensaje: 'Regla Institucional: La meta mínima de alumnos proyectados debe ser de al menos 6 estudiantes para ser financieramente viable antes de enviar a Gerencia General.',
        autoRellenar: () => {
          setFormData(prev => ({ ...prev, alumnosProyectados: 6 }));
        },
        textoAutoRellenar: 'Fijar Mínimo Institucional (6 Alumnos)'
      },
      {
        idElemento: 'input-alumnos-proyectados',
        nombreCampo: 'Alumnos Proyectados (Límite por Sección)',
        seccion: 'Costos y Rentabilidad',
        esValido: () => Number(formData.alumnosProyectados) <= 250,
        mensaje: 'Inconsistencia en la proyección: Una meta superior a 250 alumnos para un solo grupo formativo excede la capacidad pedagógica estándar. Para grupos masivos, aperture secciones adicionales.',
        autoRellenar: () => {
          setFormData(prev => ({ ...prev, alumnosProyectados: 30 }));
        },
        textoAutoRellenar: 'Ajustar a Cupo Estándar (30 Alumnos)'
      },
      {
        idElemento: 'input-alumnos-proyectados',
        nombreCampo: 'Precio Sugerido por Alumno Resultante',
        seccion: 'Costos y Rentabilidad',
        esValido: () => calculoEnVivo.precioSugeridoAlumno > 0 && !isNaN(calculoEnVivo.precioSugeridoAlumno) && isFinite(calculoEnVivo.precioSugeridoAlumno),
        mensaje: 'Inconsistencia financiera: El precio resultante sugerido por alumno es 0.00 o inconsistente debido a costos operativos nulos o proyecciones distorsionadas.',
        autoRellenar: () => {
          setFormData(prev => ({
            ...prev,
            tarifaHoraDocente: 200,
            costoZoom: 300,
            costoPapeleria: 100,
            gastosVarios: 100,
            alumnosProyectados: 6,
            margenGananciaOperativa: 40,
            usarTarifaHora: true,
          }));
        },
        textoAutoRellenar: 'Reajustar Parámetros Financieros Base'
      }
    ];

    const errores = reglas.filter(r => !r.esValido());

    if (errores.length > 0) {
      const primerError = errores[0];
      setCampoConError(primerError.idElemento);
      setAlertaSeguridad({
        idElemento: primerError.idElemento,
        nombreCampo: primerError.nombreCampo,
        seccion: primerError.seccion,
        mensaje: primerError.mensaje,
        totalFaltantes: errores.length,
        listaPendientes: errores.map(e => ({ id: e.idElemento, nombre: e.nombreCampo })),
        autoRellenar: primerError.autoRellenar,
        textoAutoRellenar: primerError.textoAutoRellenar,
      });

      // Llevar automáticamente al usuario al lugar donde no está rellenada la información
      llevarAlCampoFaltante(primerError.idElemento);
      return false;
    }

    setCampoConError(null);
    setAlertaSeguridad(null);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Medida de Seguridad y Control de Cumplimiento Curricular:
    // Si falta cualquier campo obligatorio, se cancela la grabación y se lleva al usuario al campo exacto.
    if (!validarFormularioSeguridad()) {
      return;
    }

    const horasFinal = parseInt(String(formData.horasClase || '0'), 10) || 0;

    // Si es creado o editado desde Gerencia Académica, los parámetros de comercialización y satisfacción quedan para Gerencia Comercial
    const metodoFinal: MetodoVenta = proyectoAEditar 
      ? proyectoAEditar.metodoVenta 
      : (modoFormulario === 'academica' ? 'Redes sociales' : formData.metodoVenta);
    const califFinal = proyectoAEditar 
      ? proyectoAEditar.calificacionCurso 
      : (modoFormulario === 'academica' ? 5.0 : Number(formData.calificacionCurso) || 5.0);
    const alumnosFinalCalc = modoFormulario === 'academica'
      ? Math.max(6, Number(formData.alumnosProyectados) || 6)
      : Math.max(6, Number(formData.alumnosFinal) || 6);

    // Control del flujo de trabajo secuencial inter-gerencial
    const fechaCreacionFinal = proyectoAEditar?.fechaCreacion || new Date().toISOString();
    const esModoAcad = modoFormulario === 'academica';
    const esModoCom = modoFormulario === 'comercial';

    // Autorizaciones según gerencia
    const autorizacionAcademica = esModoAcad 
      ? true 
      : (proyectoAEditar?.autorizacionAcademica ?? true);
    const fechaAutorizacionAcademica = esModoAcad 
      ? (proyectoAEditar?.fechaAutorizacionAcademica || new Date().toISOString()) 
      : proyectoAEditar?.fechaAutorizacionAcademica;
    const responsableAcademico = esModoAcad 
      ? 'MSc. Elena Rostrán - Gerencia Académica' 
      : (proyectoAEditar?.responsableAcademico || 'MSc. Elena Rostrán - Gerencia Académica');

    const autorizacionComercial = esModoCom 
      ? true 
      : (proyectoAEditar?.autorizacionComercial ?? false);
    const fechaAutorizacionComercial = esModoCom 
      ? new Date().toISOString() 
      : proyectoAEditar?.fechaAutorizacionComercial;
    const responsableComercial = esModoCom 
      ? 'Lic. Carlos Mendoza - Gerencia Comercial' 
      : (proyectoAEditar?.responsableComercial || 'Lic. Carlos Mendoza - Gerencia Comercial');

    // Etapa en el flujo y control de plazo de venta (20 días calendario desde la creación académica)
    const fechaElaboracionFinal = formData.fechaElaboracion || new Date().toISOString().slice(0, 10);
    const fechaVentaAuto20 = sumarDiasCalendario(fechaElaboracionFinal, 20);
    const fechaVentaFinal = (esModoAcad || !formData.fechaVenta) ? fechaVentaAuto20 : formData.fechaVenta;

    // Control de decisión institucional dentro del plazo de 20 días calendario:
    // - Si se selecciona "No": el proceso se cierra automáticamente y se registra formalmente como "No se llevó a cabo".
    // - Si se selecciona "Sí": el proceso continúa en el flujo institucional activo.
    // - Ambos procesos quedan formalmente registrados con fecha, hora y detalle para el control de todo.
    const esDecisionNo = formData.decisionPlazoVenta === 'No' || formData.seLlevoACabo === 'No se llevó a cabo';
    const esDecisionSi = formData.decisionPlazoVenta === 'Si';

    const estadoFinal = esDecisionNo
      ? ('No se llevó a cabo' as const)
      : (formData.seLlevoACabo === 'No se llevó a cabo' 
          ? (esDecisionSi ? 'En proceso' : 'No se llevó a cabo') 
          : (esModoAcad ? (esDecisionSi ? 'En proceso' : 'Planificado') : (esDecisionSi && formData.seLlevoACabo === 'Planificado' ? 'En proceso' : formData.seLlevoACabo)));
    const procesoCerradoFinal = esDecisionNo;
    const etapaFlujoFinal = esDecisionNo
      ? ('cerrado' as const)
      : (esModoAcad 
          ? 'comercializacion' 
          : (esModoCom ? 'dictamen_general' : (proyectoAEditar?.etapaFlujo || 'comercializacion')));

    // Tiempos y sellado automático de fecha y hora para control de flujo
    const ahora = new Date();
    const horaActual = ahora.toLocaleTimeString('es-HN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    const fechaHoraCompleta = ahora.toLocaleString('es-HN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    const horaCreacionFinal = proyectoAEditar?.horaCreacion || horaActual;
    const fechaHoraGrabacionFinal = fechaHoraCompleta;
    const horaUltimaModificacionFinal = horaActual;

    const fechaRegistroDecisionFinal = formData.fechaRegistroDecision || (esDecisionNo || esDecisionSi ? ahora.toISOString().slice(0, 10) : undefined);
    const horaRegistroDecisionFinal = formData.horaRegistroDecision || (esDecisionNo || esDecisionSi ? horaActual : undefined);
    const detalleRegistroDecisionFinal = formData.detalleRegistroDecision || (
      esDecisionNo
        ? `Decisión institucional: NO - Proceso cerrado formalmente como "No se llevó a cabo" (${ahora.toISOString().slice(0, 10)} ${horaActual}).`
        : (esDecisionSi ? `Decisión institucional: SÍ - El proceso continúa activo (${ahora.toISOString().slice(0, 10)} ${horaActual}).` : undefined)
    );

    const proyectoCalculado = calcularMetricasProyecto({
      id: formData.id || Date.now().toString(),
      fechaCreacion: fechaCreacionFinal,
      horaCreacion: horaCreacionFinal,
      fechaHoraGrabacion: fechaHoraGrabacionFinal,
      horaUltimaModificacion: horaUltimaModificacionFinal,
      etapaFlujo: etapaFlujoFinal,
      autorizacionAcademica,
      fechaAutorizacionAcademica,
      responsableAcademico,
      autorizacionComercial,
      fechaAutorizacionComercial,
      responsableComercial,
      comercializacionCompletada: esModoCom ? true : (proyectoAEditar?.comercializacionCompletada || false),
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
      calificacionCurso: califFinal,
      encuestaSatisfaccion: proyectoAEditar?.encuestaSatisfaccion || {
        estado: 'No Generada',
        calificacionPromedio: califFinal,
      },
      tipoProyecto: formData.tipoProyecto,
      nivel: formData.nivel,
      servicioFiscal: formData.servicioFiscal,
      aplicaISV: formData.aplicaISV,
      fechaElaboracion: fechaElaboracionFinal,
      diasHabilesVenta: 20,
      diasCalendarioVenta: 20,
      decisionPlazoVenta: formData.decisionPlazoVenta,
      fechaRegistroDecision: fechaRegistroDecisionFinal,
      horaRegistroDecision: horaRegistroDecisionFinal,
      detalleRegistroDecision: detalleRegistroDecisionFinal,
      tiempoVentaCumplido: esDecisionNo,
      procesoCerrado: procesoCerradoFinal,
      fechaCierrePorTiempo: esDecisionNo ? (formData.fechaCierrePorTiempo || proyectoAEditar?.fechaCierrePorTiempo || ahora.toISOString().slice(0, 10)) : undefined,
      motivoCierre: esDecisionNo ? (formData.motivoCierre || `Decisión institucional: NO - Proceso cerrado formalmente como "No se llevó a cabo" (Plazo de 20 días calendario)`) : undefined,
      fechaProgramacion: fechaElaboracionFinal,
      fechaVenta: fechaVentaFinal,
      mesControl: fechaElaboracionFinal ? fechaElaboracionFinal.slice(0, 7) : undefined,
      horasClase: horasFinal,
      tarifaHoraDocente: Number(formData.tarifaHoraDocente) || 0,
      costoDocenteManual: formData.usarTarifaHora ? undefined : Number(formData.costoDocenteManual),
      costoZoom: Number(formData.costoZoom) || 0,
      costoPapeleria: Number(formData.costoPapeleria) || 0,
      gastosVarios: Number(formData.gastosVarios) || 0,
      margenGananciaOperativa: Number(formData.margenGananciaOperativa) || 0,
      alumnosProyectados: Math.max(6, Math.round(Number(formData.alumnosProyectados)) || 6),
      alumnosFinal: alumnosFinalCalc,
      metodoVenta: metodoFinal,
      seLlevoACabo: estadoFinal,
      observaciones: formData.observaciones.trim(),
      silaboOrigenId: formData.silaboOrigenId || undefined,
      codigoSilaboOrigen: formData.codigoSilaboOrigen || undefined,
      nombreSilaboOrigen: formData.nombreSilaboOrigen || undefined,
      esSilaboBase: false,
      tipoRegistro: 'curso_proyecto',
      aprobacionFinalGerenciaGeneral: formData.aprobacionFinalGerenciaGeneral,
      fechaAprobacionGerenciaGeneral: formData.aprobacionFinalGerenciaGeneral ? (formData.fechaAprobacionGerenciaGeneral || new Date().toISOString().slice(0, 10)) : undefined,
      aprobadoPorGerenciaGeneral: formData.aprobacionFinalGerenciaGeneral ? (formData.aprobadoPorGerenciaGeneral || 'Dr. Walter Pedroza - Gerencia General') : undefined,
      observacionesAprobacionGeneral: formData.observacionesAprobacionGeneral?.trim() || undefined,
      montoFacturacionAprobadaHNL: formData.aprobacionFinalGerenciaGeneral ? convertirAHNL(calculoEnVivo.ingresoRealTotal || 0, moneda) : 0,
    });

    // Salvaguarda institucional de Costos Operativos:
    // Nunca permitir guardar o enviar un proyecto con costos operativos en cero a Gerencia General
    if (proyectoCalculado.gastoTotalOperativo <= 0) {
      setCampoConError('seccion-costos-operativos');
      setAlertaSeguridad({
        idElemento: 'seccion-costos-operativos',
        nombreCampo: 'Gasto Total Operativo del Proyecto',
        seccion: 'Costos Operativos',
        mensaje: 'Bloqueo Institucional: No se puede guardar ni elevar a Gerencia General un proyecto con costo operativo igual a cero (0.00). Restablezca los costos estándar.',
        totalFaltantes: 1,
        listaPendientes: [{ id: 'seccion-costos-operativos', nombre: 'Costos Operativos' }],
        autoRellenar: handleRestablecerCostosEstandar,
        textoAutoRellenar: 'Restablecer Costos Estándar',
      });
      llevarAlCampoFaltante('seccion-costos-operativos');
      return;
    }

    // Salvaguarda institucional de Proyecciones de Alumnos:
    // Nunca permitir guardar proyecciones inconsistentes (< 6 o no entero)
    if (proyectoCalculado.alumnosProyectados < 6 || !Number.isInteger(proyectoCalculado.alumnosProyectados)) {
      setCampoConError('input-alumnos-proyectados');
      setAlertaSeguridad({
        idElemento: 'input-alumnos-proyectados',
        nombreCampo: 'Alumnos Proyectados',
        seccion: 'Costos y Rentabilidad',
        mensaje: 'Bloqueo Institucional: La meta de alumnos proyectados debe ser un número entero mayor o igual a 6 para garantizar viabilidad antes de remitir a Gerencia General.',
        totalFaltantes: 1,
        listaPendientes: [{ id: 'input-alumnos-proyectados', nombre: 'Alumnos Proyectados' }],
        autoRellenar: () => setFormData(prev => ({ ...prev, alumnosProyectados: 6 })),
        textoAutoRellenar: 'Fijar 6 Alumnos Mínimos',
      });
      llevarAlCampoFaltante('input-alumnos-proyectados');
      return;
    }

    // Si tiene aprobación final de GG y estaba planificado o en proceso, asegurar estado 'Listo'
    if (formData.aprobacionFinalGerenciaGeneral && (proyectoCalculado.seLlevoACabo === 'Planificado' || proyectoCalculado.seLlevoACabo === 'En proceso')) {
      proyectoCalculado.seLlevoACabo = 'Listo';
    }

    // Validación en tiempo real antes de guardar: Si supera el umbral crítico, muestra aviso preventivo
    if (proyectoCalculado.gastoTotalOperativo > umbralCritico) {
      setProyectoParaGuardarPendiente(proyectoCalculado);
      setMostrarAvisoPreventivoModal(true);
      return;
    }

    onGuardar(proyectoCalculado);
    onClose();
  };

  const handleConfirmarGuardadoPreventivo = () => {
    if (!proyectoParaGuardarPendiente) return;
    onGuardar(proyectoParaGuardarPendiente);
    setMostrarAvisoPreventivoModal(false);
    setProyectoParaGuardarPendiente(null);
    onClose();
  };

  const margenesPredefinidos = [40, 50, 70, 80, 100];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        id="modal-formulario-proyecto"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
      >
        
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl text-white flex items-center justify-center ${
              modoFormulario === 'academica' ? 'bg-indigo-600' : modoFormulario === 'comercial' ? 'bg-emerald-600' : 'bg-slate-800'
            }`}>
              {modoFormulario === 'academica' ? <BookOpen className="w-5 h-5" /> : <Calculator className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {proyectoAEditar 
                    ? (modoFormulario === 'academica' ? 'Editar Diseño Curricular' : 'Editar Programa Educativo') 
                    : (modoFormulario === 'academica' ? 'Nuevo Diseño Curricular de Programa' : 'Nuevo Programa Educativo')}
                </h2>
                <span className="font-mono font-bold text-blue-800 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded text-xs">
                  {formatearCorrelativo(formData.numeroCorrelativo, formData.codigoPrograma)}
                </span>
                {modoFormulario === 'academica' && (
                  <span className="text-[10px] font-bold text-indigo-900 bg-indigo-100 border border-indigo-300 px-2 py-0.5 rounded-full">
                    🎓 Foco Exclusivo: Gerencia Académica
                  </span>
                )}
                {modoFormulario === 'comercial' && (
                  <span className="text-[10px] font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                    📈 Gerencia de Comercialización
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {modoFormulario === 'academica'
                  ? 'Diseño curricular, programación de fechas, asignación docente y costos operativos. Comercialización delegada al equipo comercial.'
                  : 'Calculadora automática de rentabilidad, correlativo institucional y enlace fiscal ISV (SAR)'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {usuarioActivo?.id === 'gerencia-academica' && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
                🔒 Permisos: Gerencia Académica
              </span>
            )}
            {usuarioActivo?.id === 'gerencia-comercializacion' && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                🔒 Permisos: Gerencia Comercial
              </span>
            )}
            {usuarioActivo?.id === 'auditor-interno' && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                ⚖️ Auditoría SAR (Solo Lectura)
              </span>
            )}
            {(!usuarioActivo || usuarioActivo.id === 'gerencia-general') && vistaActual !== 'gerencia-academica' && vistaActual !== 'gerencia-comercializacion' && (
              <div className="hidden sm:inline-flex items-center p-0.5 bg-slate-200 rounded-lg text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setModoFormulario('academica')}
                  className={`px-2 py-1 rounded-md transition-colors ${modoFormulario === 'academica' ? 'bg-white text-indigo-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  🎓 Solo Académico
                </button>
                <button
                  type="button"
                  onClick={() => setModoFormulario('comercial')}
                  className={`px-2 py-1 rounded-md transition-colors ${modoFormulario === 'comercial' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  📈 Comercial
                </button>
                <button
                  type="button"
                  onClick={() => setModoFormulario('integral')}
                  className={`px-2 py-1 rounded-md transition-colors ${modoFormulario === 'integral' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  🌐 Integral
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido del Formulario */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          
          {/* Banner de Medida de Seguridad y Control de Cumplimiento Curricular (Aparece cuando faltan campos) */}
          {alertaSeguridad && (
            <div 
              id="banner-alerta-seguridad-curricular"
              className="bg-rose-50/95 border-2 border-rose-400 rounded-xl p-4 shadow-md animate-in fade-in slide-in-from-top-2 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-rose-600 text-white shadow-xs shrink-0 mt-0.5">
                    <ShieldAlert className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-rose-200 text-rose-900 border border-rose-300 rounded">
                        Medida de Seguridad Curricular Activa
                      </span>
                      <span className="text-xs font-bold text-rose-950">
                        Grabación Bloqueada por Información Incompleta ({alertaSeguridad.totalFaltantes} campos pendientes)
                      </span>
                    </div>
                    <p className="text-xs text-rose-800 font-medium mt-1">
                      Por normativa de calidad y cumplimiento institucional, todos los campos del diseño curricular son obligatorios. No es posible grabar el proyecto hasta completar los datos requeridos.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAlertaSeguridad(null)}
                  className="text-rose-400 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-100"
                  title="Cerrar aviso"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Detalle del Campo Faltante Principal */}
              <div className="bg-white/90 p-3 rounded-lg border border-rose-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-rose-600 bg-rose-100 px-1.5 py-0.2 rounded">
                      {alertaSeguridad.seccion}
                    </span>
                    <span className="text-xs font-black text-slate-900">
                      👉 Campo Faltante: {alertaSeguridad.nombreCampo}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 font-medium">
                    {alertaSeguridad.mensaje}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {alertaSeguridad.autoRellenar && (
                    <button
                      type="button"
                      onClick={() => {
                        alertaSeguridad.autoRellenar?.();
                        setAlertaSeguridad(null);
                        setCampoConError(null);
                      }}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{alertaSeguridad.textoAutoRellenar || 'Rellenar Automáticamente'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => llevarAlCampoFaltante(alertaSeguridad.idElemento)}
                    className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ir al Campo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Lista Rápida de Otros Campos Pendientes */}
              {alertaSeguridad.totalFaltantes > 1 && (
                <div className="pt-1 flex items-center justify-between flex-wrap gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-rose-900">Otros pendientes:</span>
                    {alertaSeguridad.listaPendientes.slice(1, 5).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => llevarAlCampoFaltante(p.id)}
                        className="text-[10px] px-2 py-0.5 bg-white text-rose-700 hover:bg-rose-100 border border-rose-300 rounded font-medium cursor-pointer transition-colors"
                      >
                        {p.nombre}
                      </button>
                    ))}
                    {alertaSeguridad.totalFaltantes > 5 && (
                      <span className="text-[10px] text-rose-600 font-bold">
                        +{alertaSeguridad.totalFaltantes - 5} más
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={rellenarTodosLosCamposPendientes}
                    className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Rellenar automáticamente todos los campos sugeridos</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tarjeta de Control de Flujo & Sellado Automático de Hora */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 p-4 rounded-xl border border-emerald-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded">
                    Control de Flujo Institucional
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    Sellado Automático de Hora de Grabación
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                    Control de Cumplimiento Activo
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {proyectoAEditar
                    ? `Proyecto registrado originalmente a las ${proyectoAEditar.horaCreacion || 'la hora inicial'}. Al guardar, se estampará automáticamente la hora de última modificación.`
                    : 'La Gerencia Académica puede diseñar y registrar proyectos de forma directa. La hora exacta de creación y grabación se sellará automáticamente en el sistema para control del flujo.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <div className="bg-white px-3 py-1.5 rounded-lg border border-emerald-300 shadow-2xs text-right">
                <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider">
                  Fecha de Elaboración
                </span>
                <span className="text-xs font-black font-mono text-emerald-800">
                  {formatearFechaCorta(formData.fechaElaboracion || new Date().toISOString().slice(0, 10))}
                </span>
              </div>
              <div className="bg-white px-3 py-1.5 rounded-lg border border-emerald-300 shadow-2xs text-right">
                <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider">
                  Sello Fecha y Hora (Grabación)
                </span>
                <span className="text-xs font-black font-mono text-emerald-700">
                  {fechaEnVivo} • {horaEnVivo}
                </span>
              </div>
            </div>
          </div>

          {/* Tarjeta de Correlativo Automático & Enlace Fiscal SAR */}
          <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-purple-50/90 p-4 rounded-xl border border-blue-200/80 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-950 uppercase tracking-wider">
                <Receipt className="w-4 h-4 text-blue-700" />
                <span>Control de Correlativo & Identificación Fiscal SAR</span>
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
              
              {/* N° Correlativo Secuencial */}
              <div className="bg-white p-2.5 rounded-lg border border-blue-200/90 shadow-2xs">
                <span className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider">
                  N° Correlativo Automático
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-sm font-black font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    #{String(formData.numeroCorrelativo || 1).padStart(3, '0')}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">(Asignación única)</span>
                </div>
              </div>

              {/* Código de Programa */}
              <div className={`p-2.5 rounded-lg border shadow-2xs transition-all ${campoConError === 'input-codigo-programa' ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400' : 'bg-white border-blue-200/90'}`}>
                <label className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider mb-0.5">
                  Código de Programa SUMMIT <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-codigo-programa"
                  type="text"
                  value={formData.codigoPrograma}
                  onChange={(e) => {
                    setFormData({ ...formData, codigoPrograma: e.target.value.toUpperCase() });
                    if (campoConError === 'input-codigo-programa') setCampoConError(null);
                  }}
                  className={`w-full px-2 py-1 text-xs font-mono font-bold rounded transition-colors ${
                    campoConError === 'input-codigo-programa'
                      ? 'bg-white border border-rose-400 text-rose-900 focus:ring-2 focus:ring-rose-500'
                      : 'text-slate-800 bg-slate-50 border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:bg-white'
                  }`}
                  placeholder="Ej: SUM-2026-001"
                />
              </div>

              {/* Código Fiscal SAR ISV */}
              <div className={`p-2.5 rounded-lg border shadow-2xs transition-all ${campoConError === 'input-codigo-fiscal-sar' ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400' : 'bg-white border-blue-200/90'}`}>
                <label className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider mb-0.5">
                  Correlativo Fiscal SAR (ISV) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-codigo-fiscal-sar"
                  type="text"
                  value={formData.codigoFiscalSAR}
                  onChange={(e) => {
                    setFormData({ ...formData, codigoFiscalSAR: e.target.value.toUpperCase() });
                    if (campoConError === 'input-codigo-fiscal-sar') setCampoConError(null);
                  }}
                  className={`w-full px-2 py-1 text-xs font-mono font-bold rounded transition-colors ${
                    campoConError === 'input-codigo-fiscal-sar'
                      ? 'bg-white border border-rose-400 text-rose-900 focus:ring-2 focus:ring-rose-500'
                      : 'text-purple-900 bg-purple-50/50 border border-purple-200 focus:ring-1 focus:ring-purple-500 focus:bg-white'
                  }`}
                  placeholder="Ej: SAR-ISV-2026-001"
                />
              </div>

            </div>

            <p className="text-[11px] text-blue-900/80 leading-relaxed">
              💡 <strong>Coincidencia de Control:</strong> Este correlativo vincula automáticamente el programa formativo con la emisión de facturas, libro fiscal de ventas y la declaración mensual del <strong>15% ISV</strong> ante el SAR.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Columna Izquierda: Entradas de Datos (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Sección 1: Estructura Pedagógica (Cargada Automáticamente desde Sílabo Oficial) */}
              <div className="bg-gradient-to-b from-indigo-50/50 via-slate-50/70 to-white p-4 rounded-xl border border-indigo-200/90 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-200/70 pb-2.5">
                  <div className="flex items-center gap-2 text-xs font-black text-indigo-950 uppercase tracking-wider">
                    <GraduationCap className="w-4 h-4 text-indigo-700" />
                    <span>1. Estructura Pedagógica del Programa</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Auto-Cargado desde Sílabo
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-md">
                      Gerencia Académica
                    </span>
                  </div>
                </div>

                {/* SELECTOR OFICIAL DE SÍLABO BASE */}
                <div className={`p-3.5 rounded-xl border-2 transition-all space-y-2.5 ${
                  campoConError === 'select-silabo-oficial'
                    ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400'
                    : 'bg-white border-indigo-300 shadow-2xs'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label htmlFor="select-silabo-oficial" className="block text-xs font-black text-indigo-950 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>Seleccionar Sílabo Oficial Acreditado *</span>
                    </label>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 w-fit">
                      Estructura Básica Curricular Aprobada
                    </span>
                  </div>
                  
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Seleccione el sílabo curricular institucional. La estructura pedagógica (nombre, objetivo, módulos temáticos, horas totales y perfil docente) se cargará y vinculará de forma <strong>100% automática</strong>.
                  </p>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1">
                      <select
                        id="select-silabo-oficial"
                        value={silaboSeleccionadoId}
                        onChange={(e) => handleSeleccionarSilabo(e.target.value)}
                        className={`w-full pl-3 pr-8 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          campoConError === 'select-silabo-oficial'
                            ? 'bg-rose-50 text-rose-950 border-2 border-rose-500 ring-2 ring-rose-300'
                            : 'bg-slate-50 hover:bg-white text-slate-900 border-2 border-indigo-400 focus:ring-2 focus:ring-indigo-500'
                        }`}
                      >
                        <option value="">
                          {silabosDisponibles.length === 0
                            ? '-- No hay sílabos creados aún (Crear en Sílabos Oficiales) --'
                            : '-- Seleccionar Sílabo Creado en Gerencia Académica --'}
                        </option>
                        {silabosDisponibles.map((silabo) => (
                          <option key={silabo.id} value={silabo.id}>
                            [{silabo.codigoPrograma}] {silabo.nombreProyecto} • {silabo.horasClase}h ({silabo.nivel}) - {silabo.nombreDocente || 'Docente'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {silaboActual && (
                      <button
                        type="button"
                        onClick={() => setMostrarVistaPreviaSilabo(!mostrarVistaPreviaSilabo)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-800 bg-indigo-100 hover:bg-indigo-200 border border-indigo-300 rounded-lg transition-all shrink-0 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {mostrarVistaPreviaSilabo ? 'Ocultar Ficha' : 'Ver Sílabo Completo'}
                      </button>
                    )}
                  </div>

                  {silabosDisponibles.length === 0 && (
                    <div className="bg-amber-50/90 border border-amber-300 rounded-lg p-2.5 text-xs text-amber-900 flex items-start gap-2 mt-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="font-bold text-amber-950 text-[11px]">
                          No hay sílabos guardados en el sistema
                        </p>
                        <p className="text-[10px] text-amber-800 leading-relaxed">
                          Solo aparecerán aquí los sílabos creados en la sección <strong>Planes de Estudio (Syllabus) & PDF</strong>. Puede redactar los datos del proyecto manualmente aquí abajo, o crear primero el sílabo y docente en Gerencia Académica para cargarlos con un solo clic.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* VISTA PREVIA DETALLADA DEL SÍLABO EXPANDIBLE */}
                {mostrarVistaPreviaSilabo && silaboActual && (
                  <div className="bg-indigo-950 text-indigo-50 p-4 rounded-xl shadow-inner space-y-3 text-xs border border-indigo-800 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between border-b border-indigo-800 pb-2">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-indigo-300" />
                        <span className="font-bold uppercase tracking-wider text-white">
                          Ficha Curricular Oficial: {silaboActual.codigoPrograma}
                        </span>
                      </div>
                      <span className="bg-indigo-900 text-indigo-200 text-[10px] font-mono px-2 py-0.5 rounded border border-indigo-700">
                        Acreditado por Gerencia Académica
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <span className="text-indigo-300 font-bold block mb-0.5">Fundamentación y Enfoque:</span>
                        <p className="text-indigo-100/90 leading-relaxed bg-indigo-900/60 p-2 rounded border border-indigo-800/80">
                          {silaboActual.fundamentacion || 'Programa curricular diseñado para el fortalecimiento de capacidades técnicas y metodológicas aplicadas.'}
                        </p>
                      </div>
                      <div>
                        <span className="text-indigo-300 font-bold block mb-0.5">Competencias Generales a Desarrollar:</span>
                        <ul className="list-disc list-inside text-indigo-100/90 space-y-0.5 bg-indigo-900/60 p-2 rounded border border-indigo-800/80">
                          {silaboActual.competenciasGenerales && silaboActual.competenciasGenerales.length > 0 ? (
                            silaboActual.competenciasGenerales.map((comp, idx) => (
                              <li key={idx}>{comp}</li>
                            ))
                          ) : (
                            <li>Aplicación práctica de metodologías profesionales y resolución de casos.</li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {silaboActual.sistemaEvaluacion && (
                      <div className="border-t border-indigo-800/80 pt-2 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                        <span className="text-indigo-300 font-bold">Rúbrica de Evaluación Institucional:</span>
                        <div className="flex items-center gap-2">
                          <span className="bg-indigo-900 px-2 py-0.5 rounded border border-indigo-800">Casos: {silaboActual.sistemaEvaluacion.porcentajeCasosPracticos}%</span>
                          <span className="bg-indigo-900 px-2 py-0.5 rounded border border-indigo-800">Proyecto: {silaboActual.sistemaEvaluacion.porcentajeProyectoIntegrador}%</span>
                          <span className="bg-indigo-900 px-2 py-0.5 rounded border border-indigo-800">Talleres: {silaboActual.sistemaEvaluacion.porcentajeTalleresEjercicios}%</span>
                          <span className="bg-indigo-900 px-2 py-0.5 rounded border border-indigo-800">Participación: {silaboActual.sistemaEvaluacion.porcentajeParticipacion}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TARJETA DE ESTRUCTURA PEDAGÓGICA VINCULADA Y RELLENADA AUTOMÁTICAMENTE */}
                {formData.nombreProyecto ? (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs space-y-0">
                    {/* Barra Superior con Check y Código */}
                    <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 px-3.5 py-2 text-white flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
                        <span className="text-xs font-black uppercase tracking-wide">
                          Estructura Pedagógica Oficial Vinculada
                        </span>
                        {formData.codigoSilaboOrigen && (
                          <span className="text-[10px] font-mono font-bold bg-white/20 px-2 py-0.5 rounded border border-white/30">
                            {formData.codigoSilaboOrigen}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-black/25 px-2 py-0.5 rounded">
                          Nivel: {formData.nivel}
                        </span>
                        <span className="text-[10px] font-bold bg-black/25 px-2 py-0.5 rounded">
                          {formData.horasClase} Horas Totales
                        </span>
                      </div>
                    </div>

                    {/* Resumen pedagógico claro y legible */}
                    <div className="p-3.5 space-y-3 bg-slate-50/50">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">
                          Nombre del Programa / Curso Oficial:
                        </span>
                        <p className="text-sm font-black text-slate-900 leading-tight">
                          {formData.nombreProyecto}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">
                          Objetivo General Pedagógico:
                        </span>
                        <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed font-medium">
                          {formData.objetivoGeneral || 'Objetivo formativo institucional establecido por Gerencia Académica.'}
                        </p>
                      </div>

                      {/* Temas / Módulos del Sílabo */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1">
                            <FileText className="w-3 h-3 text-emerald-600" />
                            Contenido Curricular / Módulos Impartidos:
                          </span>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                            {formData.cantidadTemas} Módulos • {formData.horasClasePorTema}h por módulo
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-emerald-200 text-xs font-mono text-slate-800 whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto">
                          {formData.temasImpartir || 'Contenido curricular oficial.'}
                        </div>
                      </div>

                      {/* Docente y Metodología */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900 block mb-0.5">
                            Docente Designado en Sílabo:
                          </span>
                          <p className="text-xs font-bold text-slate-900">
                            {formData.nombreDocente || 'Docente asignado por Gerencia Académica'}
                          </p>
                          <p className="text-[10px] text-slate-600">
                            {formData.docenteClasificacion} • {formData.docenteEspecialidad || 'Especialista Curricular'}
                          </p>
                          {formData.docenteCorreo && (
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                              {formData.docenteCorreo} {formData.docenteTelefono ? `• ${formData.docenteTelefono}` : ''}
                            </p>
                          )}
                        </div>

                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-0.5">
                            Metodología de Aprendizaje:
                          </span>
                          <p className="text-xs font-semibold text-slate-800 leading-snug">
                            {formData.metodologia || 'Aprendizaje Basado en Proyectos (ABP) & Casos Reales'}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-indigo-700 font-medium">
                            <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span>Validado por Dirección de Gerencia Académica</span>
                          </div>
                        </div>
                      </div>

                      {/* Botón discreto para permitir excepciones pedagógicas manuales */}
                      <div className="pt-1 flex items-center justify-between border-t border-slate-200 text-[11px]">
                        <span className="text-slate-500 italic text-[10px]">
                          Estructura protegida y estandarizada. No requiere tipeo manual.
                        </span>
                        <button
                          type="button"
                          onClick={() => setMostrarEdicionManualPedagogica(!mostrarEdicionManualPedagogica)}
                          className="text-indigo-700 hover:text-indigo-900 font-semibold underline text-[10px] flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          {mostrarEdicionManualPedagogica ? 'Ocultar campos manuales' : 'Ajustar datos pedagógicos manualmente (excepción)'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center gap-2 text-xs text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Por favor seleccione un Sílabo Oficial para auto-completar toda la estructura pedagógica requerida.</span>
                  </div>
                )}

                {/* CAMPOS MANUALES DE EMERGENCIA (Colapsados por defecto) */}
                {mostrarEdicionManualPedagogica && (
                  <div className="bg-slate-100/90 p-3.5 rounded-xl border border-slate-300 space-y-3 transition-all animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-300 pb-1.5">
                      <span>Ajustes Curriculares Manuales (Excepción Académica)</span>
                      <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-semibold">
                        Solo para casos especiales
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nombre del Proyecto / Curso
                      </label>
                      <input
                        id="input-nombre-proyecto"
                        type="text"
                        value={formData.nombreProyecto}
                        onChange={(e) => setFormData({ ...formData, nombreProyecto: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Objetivo General
                      </label>
                      <textarea
                        id="input-objetivo"
                        rows={2}
                        value={formData.objetivoGeneral}
                        onChange={(e) => setFormData({ ...formData, objetivoGeneral: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Temas a Impartir (Contenido Curricular)
                      </label>
                      <textarea
                        id="input-temas-impartir"
                        rows={3}
                        value={formData.temasImpartir}
                        onChange={(e) => setFormData({ ...formData, temasImpartir: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono text-slate-800 leading-relaxed"
                      />
                    </div>

                    {/* Perfil Docente y Planificación Curricular */}
                    <DocenteProfileSection
                      nombreDocente={formData.nombreDocente}
                      docenteClasificacion={formData.docenteClasificacion}
                      docenteTelefono={formData.docenteTelefono}
                      docenteCorreo={formData.docenteCorreo}
                      docenteEspecialidad={formData.docenteEspecialidad}
                      tarifaHoraDocente={formData.tarifaHoraDocente}
                      campoConError={campoConError}
                      idPrefijo=""
                      moneda={moneda}
                      onDocenteChange={(cambios) => {
                        setFormData(prev => ({ ...prev, ...cambios }));
                      }}
                      onClearError={(campo) => {
                        if (campoConError === campo) setCampoConError(null);
                      }}
                    />

                    <CurricularPlanningSection
                      campoConError={campoConError}
                      cantidadTemas={Number(formData.cantidadTemas) || 4}
                      horasClasePorTema={Number(formData.horasClasePorTema) || (formData.nivel === 'Básico' ? 3 : 5)}
                      totalHorasCurso={Number(formData.horasClase) || 0}
                      metodologia={formData.metodologia}
                      planificacionPdf={formData.planificacionPdf}
                      tipoProyecto={formData.tipoProyecto}
                      nivelProyecto={formData.nivel}
                      nombreProyecto={formData.nombreProyecto}
                      proyectosExistentes={proyectosExistentes}
                      proyectoIdActual={formData.id}
                      nombreDocente={formData.nombreDocente}
                      docenteEspecialidad={formData.docenteEspecialidad}
                      docenteCorreo={formData.docenteCorreo}
                      docenteTelefono={formData.docenteTelefono}
                      docenteClasificacion={formData.docenteClasificacion}
                      tarifaHoraDocente={formData.tarifaHoraDocente}
                      temasImpartir={formData.temasImpartir}
                      objetivoGeneral={formData.objetivoGeneral}
                      horario={formData.horario}
                      diasClase={formData.diasClase}
                      onDocenteSeleccionado={(docente) => {
                        setFormData(prev => ({
                          ...prev,
                          nombreDocente: docente.nombre,
                          docenteEspecialidad: docente.especialidad,
                          docenteCorreo: docente.email || docente.correo || prev.docenteCorreo,
                          docenteTelefono: docente.telefono || prev.docenteTelefono,
                          docenteClasificacion: (docente.clasificacion as any) || (docente.titulo as any) || prev.docenteClasificacion,
                          tarifaHoraDocente: docente.tarifaHoraSugerida,
                        }));
                        if (campoConError === 'input-docente') setCampoConError(null);
                      }}
                      onNivelChange={(val, configNivel) => {
                        const esBasico = val === 'Básico';
                        const cfg = configNivel || obtenerConfiguracionHorasPorNivel(val);
                        const horasTotales = esBasico ? 12 : cfg.totalHoras;
                        const temas = esBasico ? 4 : cfg.cantidadTemas;
                        const horasPorTema = esBasico ? 3 : cfg.horasPorTema;
                        setFormData(prev => ({
                          ...prev,
                          nivel: val,
                          cantidadTemas: temas,
                          horasClasePorTema: horasPorTema,
                          horasClase: horasTotales,
                          costoDocenteManual: prev.usarTarifaHora ? prev.costoDocenteManual : (horasTotales * (Number(prev.tarifaHoraDocente) || 200)),
                        }));
                      }}
                      onCantidadTemasChange={(val) => setFormData(prev => ({ ...prev, cantidadTemas: val }))}
                      onHorasClasePorTemaChange={(val) => setFormData(prev => ({ ...prev, horasClasePorTema: val }))}
                      onTotalHorasCursoChange={(val) => setFormData(prev => ({ ...prev, horasClase: val }))}
                      onMetodologiaChange={(val) => setFormData(prev => ({ ...prev, metodologia: val }))}
                      onPlanificacionPdfChange={(pdf) => setFormData(prev => ({ ...prev, planificacionPdf: pdf }))}
                    />
                  </div>
                )}

                {/* PARTE FISCAL DEL SAR (LLENADO A MANO) */}
                <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/90 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="select-tipo" className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-amber-700" />
                      <span>Clasificación Oficial del SAR & Régimen de ISV *</span>
                    </label>
                    <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded border shadow-2xs ${
                      formData.aplicaISV
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    }`}>
                      {formData.aplicaISV ? '🔴 Grava 15% ISV' : '🟢 Exento (0% ISV)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                        Tipo de Servicio Fiscal SAR *
                      </label>
                      <select
                        id="select-tipo"
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
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-bold text-slate-900"
                      >
                        <option value="Capacitación profesional / Mentoría ejecutiva">Capacitación profesional / Mentoría ejecutiva (15% ISV)</option>
                        <option value="Formación académica acreditada (ej. convenios universitarios)">Formación académica acreditada (Exento 0% ISV)</option>
                        <option value="Servicios educativos no acreditados (talleres, cursos libres)">Servicios educativos no acreditados (talleres, cursos libres) (15% ISV)</option>
                        <option value="Consultoría empresarial">Consultoría empresarial (15% ISV)</option>
                        <option value="Intermediación laboral / servicios de RRHH">Intermediación laboral / servicios de RRHH (15% ISV)</option>
                        <option value="Servicios administrativos / gestión de proyectos">Servicios administrativos / gestión de proyectos (15% ISV)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                        Correlativo Fiscal SAR (ISV) *
                      </label>
                      <input
                        id="input-codigo-fiscal-sar"
                        type="text"
                        value={formData.codigoFiscalSAR}
                        onChange={(e) => {
                          setFormData({ ...formData, codigoFiscalSAR: e.target.value.toUpperCase() });
                          if (campoConError === 'input-codigo-fiscal-sar') setCampoConError(null);
                        }}
                        placeholder="Ej: SAR-ISV-2026-001"
                        className={`w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white border rounded-lg focus:ring-2 focus:ring-amber-500 text-slate-900 ${
                          campoConError === 'input-codigo-fiscal-sar'
                            ? 'border-rose-500 ring-2 ring-rose-400 bg-rose-50/50'
                            : 'border-slate-300'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

                  {/* Control de Cronología de Elaboración, Plazo de 20 Días Calendario y Decisión Comercial (Exclusivo Gerencia de Comercialización) */}
                  {!esModoAcad && (
                    <div className="bg-gradient-to-r from-emerald-50/80 via-teal-50/70 to-blue-50/70 p-3.5 rounded-xl border border-emerald-200/90 shadow-2xs space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                            Cronología de Elaboración & Plazo de Comercialización
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                          ⚡ 20 Días Calendario Corridos
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Fecha de Elaboración Automática (Fecha del día de hoy en vivo) */}
                        <div className="bg-white p-3 rounded-lg border border-emerald-300/80 shadow-2xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                              Fecha de Elaboración (Automática)
                            </span>
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-200">
                              Creación Académica
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-sm font-black font-mono text-emerald-900">
                              {formatearFechaCorta(formData.fechaElaboracion || new Date().toISOString().slice(0, 10))}
                            </span>
                            <div className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <Clock className="w-3 h-3 text-emerald-500 animate-pulse" />
                              <span>{horaEnVivo}</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1.5">
                            Sello automático de la fecha institucional en que la Gerencia Académica elabora y crea el proyecto.
                          </p>
                        </div>

                        {/* Fecha de Venta (20 Días Calendario Corridos) */}
                        <div className="bg-white p-3 rounded-lg border border-blue-200 shadow-2xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-blue-600" />
                              Fecha de Venta (Fin de Plazo)
                            </span>
                            <span className="text-[10px] font-extrabold text-blue-800 bg-blue-100 px-1.5 py-0.2 rounded border border-blue-200">
                              20 Días Calendario
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-sm font-black font-mono text-blue-900">
                              {formatearFechaCorta(
                                formData.fechaVenta || 
                                sumarDiasCalendario(formData.fechaElaboracion || new Date().toISOString().slice(0, 10), 20)
                              )}
                            </span>
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              Días Corridos
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1.5">
                            Calculado automáticamente a 20 días calendario corridos contados desde la creación por Gerencia Académica.
                          </p>
                        </div>
                      </div>

                      {/* Modo Comercial: Control Interactivo de Ejecución / Decisión (20 Días Calendario) */}
                      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4 text-blue-700 shrink-0" />
                              <span className="text-xs font-bold text-slate-900">
                                Decisión en Plazo de 20 Días Calendario: ¿Se lleva a cabo / Continúa el proceso?
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                              • <strong>"Sí":</strong> El proceso <strong>continúa</strong> su curso normal hacia comercialización y ejecución.<br />
                              • <strong>"No":</strong> Se <strong>cierra automáticamente</strong> y queda registrado como <strong>"No se llevó a cabo"</strong>.<br />
                              <span className="text-slate-500 font-medium italic">Ambos procesos quedan formalmente registrados con fecha y hora para el control de todo.</span>
                            </p>
                          </div>

                          {/* Botones Sí / No */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const ahora = new Date();
                                const fechaHoy = ahora.toISOString().slice(0, 10);
                                const horaHoy = ahora.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
                                setFormData({
                                  ...formData,
                                  decisionPlazoVenta: 'Si',
                                  tiempoVentaCumplido: false,
                                  seLlevoACabo: formData.seLlevoACabo === 'No se llevó a cabo' ? 'En proceso' : (formData.seLlevoACabo || 'En proceso'),
                                  procesoCerrado: false,
                                  fechaRegistroDecision: fechaHoy,
                                  horaRegistroDecision: horaHoy,
                                  detalleRegistroDecision: `Decisión registrada en Comercialización: SÍ - El proceso continúa (${fechaHoy} ${horaHoy}).`,
                                });
                              }}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                                formData.decisionPlazoVenta === 'Si' || (formData.seLlevoACabo !== 'No se llevó a cabo' && formData.decisionPlazoVenta !== 'No' && formData.fechaRegistroDecision)
                                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-300'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Sí</span>
                              <span className="text-[9px] opacity-90">(Continúa)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const ahora = new Date();
                                const fechaHoy = ahora.toISOString().slice(0, 10);
                                const horaHoy = ahora.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
                                setFormData({
                                  ...formData,
                                  decisionPlazoVenta: 'No',
                                  tiempoVentaCumplido: true,
                                  seLlevoACabo: 'No se llevó a cabo',
                                  procesoCerrado: true,
                                  fechaCierrePorTiempo: fechaHoy,
                                  fechaRegistroDecision: fechaHoy,
                                  horaRegistroDecision: horaHoy,
                                  motivoCierre: `Decisión en Comercialización: NO - Proceso cerrado formalmente como "No se llevó a cabo" (Plazo de 20 días calendario) (${fechaHoy} ${horaHoy}).`,
                                  detalleRegistroDecision: `Decisión registrada en Comercialización: NO - Proceso cerrado formalmente como "No se llevó a cabo" (${fechaHoy} ${horaHoy}).`,
                                });
                              }}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                                formData.decisionPlazoVenta === 'No' || formData.seLlevoACabo === 'No se llevó a cabo'
                                  ? 'bg-rose-600 text-white border-rose-700 shadow-xs ring-2 ring-rose-300'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-rose-50'
                              }`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>No</span>
                              <span className="text-[9px] opacity-90">(Cerrar)</span>
                            </button>
                          </div>
                        </div>

                        {/* Registro Formal Visible: Decisión SÍ (El proceso continúa) */}
                        {(formData.decisionPlazoVenta === 'Si' || (formData.seLlevoACabo !== 'No se llevó a cabo' && formData.decisionPlazoVenta !== 'No' && formData.fechaRegistroDecision)) && (
                          <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs flex items-start gap-2.5 shadow-2xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2 flex-wrap font-bold">
                                <span className="text-emerald-900">✅ Decisión Registrada: SÍ — El proceso continúa</span>
                                {formData.fechaRegistroDecision && (
                                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    Registrado: {formData.fechaRegistroDecision} {formData.horaRegistroDecision}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-emerald-800">
                                El proyecto continúa activo en el flujo institucional para la Gerencia de Comercialización, matrícula de participantes y dictamen de Gerencia General.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Registro Formal Visible: Decisión NO (Proceso cerrado - No se llevó a cabo) */}
                        {(formData.decisionPlazoVenta === 'No' || formData.seLlevoACabo === 'No se llevó a cabo') && (
                          <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-300 text-rose-950 text-xs flex items-start gap-2.5 shadow-2xs">
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2 flex-wrap font-bold">
                                <span className="text-rose-900">⏹️ Decisión Registrada: NO — Proceso cerrado automáticamente</span>
                                {formData.fechaRegistroDecision && (
                                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                                    Cerrado: {formData.fechaRegistroDecision} {formData.horaRegistroDecision}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-rose-800">
                                El proyecto ha sido registrado formalmente bajo el estado institucional <strong>"No se llevó a cabo"</strong> dentro del plazo de 20 días calendario.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Programación Curricular & Horarios (Gerencia Académica) */}
                  <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        Programación Académica: Sección, Horario y Días
                      </span>
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded border border-blue-300">
                        Logística Curricular
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Sección / Grupo <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="input-seccion"
                          type="text"
                          placeholder="Ej: Fines de semana, Sec. A, etc."
                          value={formData.seccion}
                          onChange={(e) => {
                            setFormData({ ...formData, seccion: e.target.value });
                            if (campoConError === 'input-seccion') setCampoConError(null);
                          }}
                          className={`w-full px-2.5 py-1.5 text-xs bg-white border rounded-lg font-medium transition-all ${
                            campoConError === 'input-seccion'
                              ? 'border-rose-500 ring-2 ring-rose-400 bg-rose-50/50 text-rose-950 font-bold'
                              : 'border-slate-300 focus:ring-1 focus:ring-blue-500'
                          }`}
                        />
                        <div className="flex flex-wrap gap-1 mt-1">
                          {['Sec. A', 'Sec. B', 'Matutina', 'Sabatina', 'Fines de semana'].map((sec) => (
                            <button
                              key={sec}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, seccion: sec });
                                if (campoConError === 'input-seccion') setCampoConError(null);
                              }}
                              className="text-[9px] px-1.5 py-0.5 bg-white text-slate-600 hover:text-blue-700 hover:border-blue-400 border border-slate-200 rounded font-mono cursor-pointer"
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
                          id="input-horario"
                          type="text"
                          placeholder="Ej: 06:00 PM - 08:00 PM (Escribir horario)"
                          value={formData.horario}
                          onChange={(e) => {
                            setFormData({ ...formData, horario: e.target.value });
                            if (campoConError === 'input-horario') setCampoConError(null);
                          }}
                          className={`w-full px-2.5 py-1.5 text-xs bg-white border rounded-lg font-mono transition-all ${
                            campoConError === 'input-horario'
                              ? 'border-rose-500 ring-2 ring-rose-400 bg-rose-50/50 text-rose-950 font-bold'
                              : 'border-slate-300 focus:ring-1 focus:ring-blue-500'
                          }`}
                        />
                        <div className="flex flex-wrap gap-1 mt-1">
                          {['06:00 PM - 08:00 PM', '07:00 PM - 09:00 PM', '08:00 AM - 12:00 PM'].map((hor) => (
                            <button
                              key={hor}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, horario: hor });
                                if (campoConError === 'input-horario') setCampoConError(null);
                              }}
                              className="text-[9px] px-1.5 py-0.5 bg-white text-slate-600 hover:text-blue-700 hover:border-blue-400 border border-slate-200 rounded font-mono truncate max-w-[120px] cursor-pointer"
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
                          id="input-dias"
                          type="text"
                          placeholder="Ej: Sábados y Domingos / Lunes a Viernes"
                          value={formData.diasClase}
                          onChange={(e) => {
                            setFormData({ ...formData, diasClase: e.target.value });
                            if (campoConError === 'input-dias') setCampoConError(null);
                          }}
                          className={`w-full px-2.5 py-1.5 text-xs bg-white border rounded-lg font-medium transition-all ${
                            campoConError === 'input-dias'
                              ? 'border-rose-500 ring-2 ring-rose-400 bg-rose-50/50 text-rose-950 font-bold'
                              : 'border-slate-300 focus:ring-1 focus:ring-blue-500'
                          }`}
                        />
                        <div className="flex flex-wrap gap-1 mt-1">
                          {['Fines de semana', 'Lun, Mié y Vie', 'Mar y Jue', 'Sábados', 'Lun a Jue'].map((dia) => (
                            <button
                              key={dia}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, diasClase: dia === 'Fines de semana' ? 'Sábados y Domingos (Fines de semana)' : dia === 'Lun, Mié y Vie' ? 'Lunes, Miércoles y Viernes' : dia === 'Mar y Jue' ? 'Martes y Jueves' : dia === 'Lun a Jue' ? 'Lunes a Jueves' : 'Sábados' });
                                if (campoConError === 'input-dias') setCampoConError(null);
                              }}
                              className="text-[9px] px-1.5 py-0.5 bg-white text-slate-600 hover:text-blue-700 hover:border-blue-400 border border-slate-200 rounded font-mono cursor-pointer"
                            >
                              {dia}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

              {/* Sección 2: Estructura de Costos Operativos */}
              <div 
                id="seccion-costos-operativos"
                className={`p-4 rounded-xl border space-y-3.5 transition-all duration-200 ${
                  calculoEnVivo.gastoTotalOperativo <= 0
                    ? 'bg-rose-50/70 border-rose-400 ring-2 ring-rose-300'
                    : excedeSesentaPorcientoCostoOperativo
                    ? 'bg-amber-50/90 border-2 border-amber-500 ring-2 ring-amber-400/70 shadow-md'
                    : calculoEnVivo.gastoTotalOperativo > umbralCritico
                    ? 'bg-rose-50/40 border-rose-300 ring-2 ring-rose-200/60'
                    : 'bg-amber-50/50 border-amber-200/80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/70 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
                    <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                    <span>2. Costos Operativos</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {excedeSesentaPorcientoCostoOperativo && (
                      <span 
                        id="badge-alerta-costo-60-seccion2"
                        className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 border border-amber-600 px-2 py-0.5 rounded-md shadow-2xs animate-pulse font-mono"
                      >
                        <AlertTriangle className="w-3 h-3 text-slate-950" />
                        <span>⚠️ Costo excede 60% del Ingreso ({porcentajeCostoSobreIngreso.toFixed(1)}%)</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-200/90 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md">
                      Llenado por Gerencia Académica
                    </span>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                      calculoEnVivo.gastoTotalOperativo <= 0
                        ? 'text-rose-900 bg-rose-200 border-rose-400 animate-pulse'
                        : excedeSesentaPorcientoCostoOperativo
                        ? 'text-amber-950 bg-amber-200 border-amber-400 font-black ring-1 ring-amber-400'
                        : calculoEnVivo.gastoTotalOperativo > umbralCritico
                        ? 'text-rose-900 bg-rose-100 border-rose-300'
                        : 'text-amber-900 bg-amber-100 border-amber-200'
                    }`}>
                      {calculoEnVivo.gastoTotalOperativo <= 0
                        ? `❌ Costo en Cero (Inválido: ${formatearMoneda(0, moneda)})`
                        : `Total: ${formatearMoneda(calculoEnVivo.gastoTotalOperativo, moneda)}`}
                    </span>
                  </div>
                </div>

                {/* Banner de Advertencia con Color de Resaltado: Costo Operativo > 60% del Ingreso Total Esperado */}
                {excedeSesentaPorcientoCostoOperativo && (
                  <div 
                    id="alerta-costo-excede-60-ingreso"
                    className="p-3.5 bg-amber-100/95 border-2 border-amber-500 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-950 shadow-sm animate-in fade-in"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="p-2.5 bg-amber-500 text-slate-950 rounded-lg shrink-0 shadow-xs">
                        <AlertTriangle className="w-5 h-5 text-slate-950" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-black text-amber-950 uppercase tracking-wide">
                            Alerta Financiera: Costo Operativo Excede el 60% del Ingreso Esperado
                          </span>
                          <span className="text-[10px] font-black bg-amber-600 text-white px-2 py-0.5 rounded-full shadow-2xs font-mono">
                            {porcentajeCostoSobreIngreso.toFixed(1)}% del Ingreso
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-900 font-medium mt-0.5 leading-snug">
                          El costo operativo proyectado (<strong>{formatearMoneda(costoOperativoProyectado, moneda)}</strong>) absorbe el <strong>{porcentajeCostoSobreIngreso.toFixed(1)}%</strong> del ingreso total esperado (<strong>{formatearMoneda(ingresoTotalEsperado, moneda)}</strong>), superando el umbral prudencial del <strong>60%</strong>.
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] text-amber-800 font-semibold">
                          <span className="text-amber-950 font-bold">💡 Medidas correctivas sugeridas:</span>
                          <span className="bg-amber-200/90 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                            Aumentar margen de ganancia en Sección 4 (recomendado ≥ 67%)
                          </span>
                          <span className="bg-amber-200/90 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                            Incrementar meta de alumnos
                          </span>
                          <span className="bg-amber-200/90 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                            Optimizar costos docentes/fijos
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Banner de Advertencia cuando el Costo Operativo Total es Cero */}
                {calculoEnVivo.gastoTotalOperativo <= 0 && (
                  <div 
                    id="alerta-costo-cero-bloqueo"
                    className="p-3 bg-rose-100/95 border-2 border-rose-400 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-rose-950 shadow-2xs animate-in fade-in"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-rose-200 text-rose-800 rounded-lg shrink-0">
                        <AlertTriangle className="w-5 h-5 text-rose-600" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-rose-900 block">
                          Restricción Institucional: Costo Operativo Igual a Cero ({formatearMoneda(0, moneda)})
                        </span>
                        <p className="text-[11px] text-rose-800 font-medium">
                          No es posible someter este proyecto a dictamen de la Gerencia General sin registrar costos operativos comprobables (honorarios docentes calculados y costos fijos de apertura).
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRestablecerCostosEstandar}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restablecer Costos Estándar</span>
                    </button>
                  </div>
                )}

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
                  horasClase={horasClaseEntero}
                  ingresoTotalEsperado={ingresoTotalEsperado}
                  onCambiarUmbral={(nuevo) => {
                    setUmbralCritico(nuevo);
                    guardarUmbralCriticoStorage(nuevo);
                  }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-800">
                        Horas de Clase <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-blue-800 bg-blue-100/90 border border-blue-200 px-1.5 py-0.2 rounded inline-flex items-center gap-1">
                          ⚡ Auto Nivel {formData.nivel || 'Básico'}: {formData.horasClase} hrs
                        </span>
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded">
                          Solo enteros
                        </span>
                      </div>
                    </div>
                    <input
                      id="input-horas-clase"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      placeholder="Ej: 20 (Relleno manual)"
                      value={formData.horasClase}
                      onKeyDown={(e) => {
                        // Impedir puntos, comas, exponentes y signos para admitir solo enteros positivos
                        if (['.', ',', 'e', 'E', '+', '-', ' '].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setFormData({ ...formData, horasClase: val });
                        if (campoConError === 'input-horas-clase') setCampoConError(null);
                      }}
                      className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg font-mono font-bold transition-all ${
                        campoConError === 'input-horas-clase'
                          ? 'border-rose-500 ring-2 ring-rose-400 bg-rose-50/50 text-rose-950 font-bold'
                          : 'border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500'
                      }`}
                    />
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Admite solo números enteros sin decimales • Colocado de forma automática según el nivel académico ({formData.nivel || 'Básico'}).
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Tarifa Docente por Hora ({moneda}) <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 rounded inline-flex items-center gap-1">
                        ⚡ Halado de Perfil Docente
                      </span>
                    </div>
                    <input
                      id="input-tarifa-docente"
                      type="number"
                      min="0"
                      step="10"
                      placeholder="Ej: 200"
                      value={formData.tarifaHoraDocente}
                      onChange={(e) => {
                        setFormData({ ...formData, tarifaHoraDocente: Number(e.target.value) || 0 });
                        if (campoConError === 'input-tarifa-docente') setCampoConError(null);
                      }}
                      className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg font-mono transition-all ${
                        campoConError === 'input-tarifa-docente'
                          ? 'border-rose-500 ring-2 ring-rose-400 bg-rose-50/50 text-rose-950 font-bold'
                          : 'border-slate-300 focus:ring-2 focus:ring-blue-500'
                      }`}
                    />
                    <span className="text-[10px] text-slate-500 flex items-center justify-between mt-0.5">
                      <span>Docente: {formData.nombreDocente || 'Sin asignar'}</span>
                      <strong className="text-emerald-700 font-bold font-mono">Honorarios: {formatearMoneda(calculoEnVivo.costoDocenteCalculado, moneda)}</strong>
                    </span>
                  </div>
                </div>

                {/* Subsección: Costos Institucionales Fijos (Zoom, Papelería, Gastos Varios = 500 c/u) */}
                <div className="pt-2 border-t border-amber-200/60 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-amber-100/50 p-2.5 rounded-lg border border-amber-200/80">
                    <div className="flex items-center gap-2">
                      {costosFijosAutorizados ? (
                        <Unlock className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                      )}
                      <div>
                        <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
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

                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-semibold text-slate-700">
                          Costo Zoom ({moneda})
                        </label>
                        {!costosFijosAutorizados && <Lock className="w-3 h-3 text-slate-400" />}
                      </div>
                      <input
                        id="input-costo-zoom"
                        type="number"
                        min="0"
                        placeholder="500"
                        readOnly={!costosFijosAutorizados}
                        disabled={!costosFijosAutorizados}
                        value={formData.costoZoom}
                        onChange={(e) => setFormData({ ...formData, costoZoom: Number(e.target.value) || 0 })}
                        className={`w-full px-2.5 py-1.5 text-xs rounded-lg font-mono font-bold ${
                          costosFijosAutorizados
                            ? 'bg-white border-emerald-400 text-slate-900 focus:ring-2 focus:ring-emerald-500'
                            : 'bg-slate-100/90 border-slate-300 text-slate-700 cursor-not-allowed'
                        } border`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-semibold text-slate-700">
                          Papelería ({moneda})
                        </label>
                        {!costosFijosAutorizados && <Lock className="w-3 h-3 text-slate-400" />}
                      </div>
                      <input
                        id="input-costo-papeleria"
                        type="number"
                        min="0"
                        placeholder="500"
                        readOnly={!costosFijosAutorizados}
                        disabled={!costosFijosAutorizados}
                        value={formData.costoPapeleria}
                        onChange={(e) => setFormData({ ...formData, costoPapeleria: Number(e.target.value) || 0 })}
                        className={`w-full px-2.5 py-1.5 text-xs rounded-lg font-mono font-bold ${
                          costosFijosAutorizados
                            ? 'bg-white border-emerald-400 text-slate-900 focus:ring-2 focus:ring-emerald-500'
                            : 'bg-slate-100/90 border-slate-300 text-slate-700 cursor-not-allowed'
                        } border`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-semibold text-slate-700">
                          Gastos Varios ({moneda})
                        </label>
                        {!costosFijosAutorizados && <Lock className="w-3 h-3 text-slate-400" />}
                      </div>
                      <input
                        id="input-gastos-varios"
                        type="number"
                        min="0"
                        placeholder="500"
                        readOnly={!costosFijosAutorizados}
                        disabled={!costosFijosAutorizados}
                        value={formData.gastosVarios}
                        onChange={(e) => setFormData({ ...formData, gastosVarios: Number(e.target.value) || 0 })}
                        className={`w-full px-2.5 py-1.5 text-xs rounded-lg font-mono font-bold ${
                          costosFijosAutorizados
                            ? 'bg-white border-emerald-400 text-slate-900 focus:ring-2 focus:ring-emerald-500'
                            : 'bg-slate-100/90 border-slate-300 text-slate-700 cursor-not-allowed'
                        } border`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección 3: Régimen Fiscal & Tratamiento ISV (SAR) */}
              <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
                    <Receipt className="w-3.5 h-3.5 text-amber-700" />
                    <span>3. Régimen Fiscal & Tratamiento ISV (SAR)</span>
                  </div>
                  {formData.aplicaISV ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-200/80 text-amber-900 border border-amber-300">
                      ✅ Grava ISV (15%)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      ❌ Exento de ISV (0%)
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Servicio Prestado (Clasificación SAR)
                  </label>
                  <select
                    id="select-servicio-fiscal"
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
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {REGLAS_ISV_SERVICIOS.map((r) => (
                      <option key={r.id} value={r.servicio}>
                        {r.servicio} — {r.etiquetaGrava}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Observación Oficial de la SAR según el servicio */}
                <div className="p-2.5 bg-white rounded-lg border border-amber-200 text-[11px] text-slate-700 leading-relaxed">
                  <span className="font-bold text-amber-900 block mb-0.5">Dictamen Fiscal SAR:</span>
                  {obtenerReglaISVPorServicio(formData.servicioFiscal).observaciones}
                </div>

                {/* Toggle de anulación manual de ISV si hay convenio específico */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <label htmlFor="checkbox-aplica-isv" className="text-slate-600 cursor-pointer select-none">
                    ¿Gravar 15% de ISV en la facturación?
                  </label>
                  <input
                    id="checkbox-aplica-isv"
                    type="checkbox"
                    checked={formData.aplicaISV}
                    onChange={(e) => setFormData({ ...formData, aplicaISV: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Sección 4: Margen y Proyección */}
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200/80 space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
                  <Percent className="w-3.5 h-3.5 text-blue-600" />
                  <span>4. Margen & Proyección de Alumnos</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Margen de Ganancia Operativa (%)
                    </label>
                    <span className="font-mono font-bold text-blue-700 text-xs bg-blue-100 px-2 py-0.5 rounded">
                      {formData.margenGananciaOperativa}%
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {margenesPredefinidos.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setFormData({ ...formData, margenGananciaOperativa: m })}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                          formData.margenGananciaOperativa === m
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {m}%
                      </button>
                    ))}
                  </div>

                  <input
                    type="range"
                    min="10"
                    max="150"
                    step="5"
                    value={formData.margenGananciaOperativa}
                    onChange={(e) => setFormData({ ...formData, margenGananciaOperativa: Number(e.target.value) })}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Alumnos Proyectados (Meta Mínima)
                      </label>
                      <span className="text-[10px] font-bold text-slate-500 font-mono">
                        Base mínima: 6 alumnos
                      </span>
                    </div>
                    <input
                      id="input-alumnos-proyectados"
                      type="number"
                      min="6"
                      step="1"
                      value={formData.alumnosProyectados}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, alumnosProyectados: val === '' ? '' : Number(val) });
                      }}
                      onBlur={() => {
                        if (Number(formData.alumnosProyectados) < 6) {
                          setFormData({ ...formData, alumnosProyectados: 6 });
                        } else if (!Number.isInteger(Number(formData.alumnosProyectados))) {
                          setFormData({ ...formData, alumnosProyectados: Math.round(Number(formData.alumnosProyectados)) });
                        }
                      }}
                      className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg font-mono font-bold transition-all ${
                        Number(formData.alumnosProyectados) < 6 || !Number.isInteger(Number(formData.alumnosProyectados)) || Number(formData.alumnosProyectados) > 250
                          ? 'border-rose-500 bg-rose-50/80 text-rose-900 focus:ring-2 focus:ring-rose-400'
                          : 'border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500'
                      }`}
                    />
                    
                    {/* Alertas dinámicas de inconsistencia en proyección de alumnos */}
                    {formData.alumnosProyectados === '' || isNaN(Number(formData.alumnosProyectados)) || Number(formData.alumnosProyectados) <= 0 ? (
                      <div className="mt-1.5 p-1.5 bg-rose-50 border border-rose-200 rounded-md flex items-center justify-between gap-1.5 text-[11px] font-bold text-rose-700 animate-in fade-in">
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Proyección vacía o en cero (Mínimo institucional: 6 alumnos)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, alumnosProyectados: 6 })}
                          className="text-[10px] bg-rose-600 hover:bg-rose-700 text-white px-2 py-0.5 rounded cursor-pointer transition-colors shrink-0"
                        >
                          Fijar 6
                        </button>
                      </div>
                    ) : Number(formData.alumnosProyectados) < 6 ? (
                      <div className="mt-1.5 p-1.5 bg-rose-50 border border-rose-200 rounded-md flex items-center justify-between gap-1.5 text-[11px] font-bold text-rose-700 animate-in fade-in">
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>No es viable financieramente (Mínimo requerido: 6 alumnos)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, alumnosProyectados: 6 })}
                          className="text-[10px] bg-rose-600 hover:bg-rose-700 text-white px-2 py-0.5 rounded cursor-pointer transition-colors shrink-0"
                        >
                          Fijar 6
                        </button>
                      </div>
                    ) : !Number.isInteger(Number(formData.alumnosProyectados)) ? (
                      <div className="mt-1.5 p-1.5 bg-rose-50 border border-rose-200 rounded-md flex items-center justify-between gap-1.5 text-[11px] font-bold text-rose-700 animate-in fade-in">
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Inconsistencia: Debe ser un número entero (sin decimales)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, alumnosProyectados: Math.round(Number(formData.alumnosProyectados)) })}
                          className="text-[10px] bg-rose-600 hover:bg-rose-700 text-white px-2 py-0.5 rounded cursor-pointer transition-colors shrink-0"
                        >
                          Redondear
                        </button>
                      </div>
                    ) : Number(formData.alumnosProyectados) > 250 ? (
                      <div className="mt-1.5 p-1.5 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 animate-in fade-in">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Meta alta ({formData.alumnosProyectados} alumnos): Valide capacidad o aperture secciones.</span>
                      </div>
                    ) : calculoEnVivo.puntoEquilibrioAlumnos > Number(formData.alumnosProyectados) ? (
                      <div className="mt-1.5 p-1.5 bg-rose-50 border border-rose-200 rounded-md flex items-center gap-1.5 text-[11px] font-bold text-rose-700 animate-in fade-in">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>Inconsistencia: La proyección no alcanza el punto de equilibrio ({calculoEnVivo.puntoEquilibrioAlumnos} alumnos).</span>
                      </div>
                    ) : (
                      <div className="mt-1 text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Proyección válida y consistente con las metas institucionales.</span>
                      </div>
                    )}
                  </div>

                  {modoFormulario === 'academica' ? (
                    <div className="bg-indigo-50/80 p-2.5 rounded-lg border border-indigo-200 flex flex-col justify-center">
                      <span className="text-[11px] font-bold text-indigo-950 flex items-center gap-1.5">
                        <span>👥</span> Matrícula Real (Inscritos)
                      </span>
                      <span className="text-xs font-semibold text-indigo-800 mt-0.5">
                        Asignada a Gerencia Comercial
                      </span>
                      <span className="text-[10px] text-indigo-600">
                        Comercialización registrará los cupos pagados reales.
                      </span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Alumnos Finales (Inscritos Reales)
                        </label>
                        <span className="text-[10px] font-bold text-emerald-700 font-mono">
                          Mínimo: 6
                        </span>
                      </div>
                      <input
                        id="input-alumnos-final"
                        type="number"
                        min="6"
                        value={formData.alumnosFinal}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFormData({ ...formData, alumnosFinal: val < 6 ? 6 : val });
                        }}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold text-emerald-800 bg-emerald-50/50"
                      />
                    </div>
                  )}
                </div>

                {/* Alerta de Resaltado: Costo Operativo > 60% del Ingreso Total Esperado */}
                {excedeSesentaPorcientoCostoOperativo && (
                  <div 
                    id="alerta-resaltada-margen-costo-60"
                    className="p-3 bg-amber-100/90 border-2 border-amber-500 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-amber-950 shadow-xs animate-in fade-in"
                  >
                    <div className="flex items-start sm:items-center gap-2.5">
                      <div className="p-1.5 bg-amber-500 text-slate-950 rounded-lg shrink-0">
                        <AlertTriangle className="w-4 h-4 text-slate-950" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-amber-950">
                            Advertencia: Costo Operativo Absorbe el {porcentajeCostoSobreIngreso.toFixed(1)}% del Ingreso Esperado
                          </span>
                          <span className="text-[10px] font-black bg-amber-600 text-white px-2 py-0.5 rounded-full font-mono shadow-2xs">
                            Excede 60%
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-900 font-medium mt-0.5">
                          Con el margen operativo actual ({formData.margenGananciaOperativa}%), los costos de operación superan el 60% prudencial de las ventas estimadas. Se sugiere elevar el margen a ≥ 70% o aumentar la meta de inscritos.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, margenGananciaOperativa: 70 })}
                        className="px-2.5 py-1 text-[11px] font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 border border-amber-500 rounded-lg shadow-2xs transition-colors cursor-pointer"
                        title="Fijar margen de ganancia en 70%"
                      >
                        Fijar 70%
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, margenGananciaOperativa: 80 })}
                        className="px-2.5 py-1 text-[11px] font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
                        title="Fijar margen de ganancia en 80%"
                      >
                        Fijar 80%
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sección 4: Método de Venta, Estado & Observaciones */}
              {modoFormulario === 'academica' ? (
                <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-blue-50 p-4 rounded-xl border border-indigo-200/90 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                        🎓
                      </div>
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-indigo-950 block">
                          Enfoque Curricular & Académico
                        </span>
                        <span className="text-[11px] text-indigo-700">
                          La Gerencia Académica se concentra exclusivamente en el componente curricular y pedagógico.
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full shadow-2xs">
                      Estado: Planificado
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-700 bg-white/95 p-3 rounded-lg border border-indigo-100 leading-relaxed space-y-1">
                    <p>
                      ✨ <strong>Optimización del Flujo de Trabajo:</strong> La sección de <strong>Comercialización & Estado del Ciclo de Vida</strong> (Método de Venta, Matrícula Real, Descuentos Preventa y Encuesta de Satisfacción Estudiantil CSAT/NPS) ha sido trasladada a la <strong>Gerencia de Comercialización</strong>.
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Al guardar este programa, pasará inmediatamente a la Gerencia de Comercialización para fijar su estrategia de ventas, canal publicitario y metas de captación.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Observaciones Curriculares & Requisitos Académicos
                    </label>
                    <input
                      id="input-observaciones"
                      type="text"
                      placeholder="Requisitos previos de admisión, software requerido, perfil del estudiante..."
                      value={formData.observaciones}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                    <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                      Comercialización & Estado del Ciclo de Vida
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Gerencia Comercial & General
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
                        id="select-metodo-venta"
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
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium"
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
                        Al asignarse por Comercialización, avanza automáticamente a <span className="font-semibold text-amber-700">En proceso</span>.
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Se llevó a cabo / Estado
                        </label>
                        <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                          Dictamen Gerencial
                        </span>
                      </div>
                      <select
                        id="select-estado"
                        value={formData.seLlevoACabo}
                        onChange={(e) => setFormData({ ...formData, seLlevoACabo: e.target.value as EstadoProyecto })}
                        className={`w-full px-2.5 py-1.5 text-xs border rounded-lg font-bold ${
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
                        {formData.seLlevoACabo === 'Planificado' && 'Inicial: Pendiente de comercialización.'}
                        {formData.seLlevoACabo === 'En proceso' && 'En proceso: Comercialización en marcha.'}
                        {formData.seLlevoACabo === 'Listo' && 'Listo: Aprobado por Dirección para imprimir y ejecutar.'}
                        {formData.seLlevoACabo === 'Denegado' && 'Denegado: No aprobado.'}
                      </p>
                    </div>
                  </div>

                  {/* Sección: Calificación del Curso & Encuesta de Satisfacción (Gerencia de Comercialización) */}
                  <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-200/80 space-y-2.5">
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
                            id="input-calificacion-curso"
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

                      <div className="bg-white/80 p-2 rounded-lg border border-indigo-100 text-[11px] text-slate-600 flex flex-col justify-center">
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
                      Observaciones
                    </label>
                    <input
                      id="input-observaciones"
                      type="text"
                      placeholder="Comentarios sobre resultados, logística o evaluación..."
                      value={formData.observaciones}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* 4. Aprobación Final de la Gerencia General & Deducción Mensual de Facturación POA 2026 */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 rounded-xl border border-indigo-900 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-900/60 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">
                        4. Aprobación Final de la Gerencia General (POA 2026)
                      </h4>
                      <p className="text-[11px] text-indigo-200">
                        La aprobación oficial de Gerencia General rebaja el monto facturado de este proyecto de la cuota mensual del POA.
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                    formData.aprobacionFinalGerenciaGeneral
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                      : 'bg-amber-500/20 text-amber-300 border-amber-400/50'
                  }`}>
                    {formData.aprobacionFinalGerenciaGeneral ? '✅ Aprobado por GG' : '⏳ Pendiente de Aprobación'}
                  </span>
                </div>

                {/* Switch de Aprobación */}
                <div className="bg-white/10 rounded-xl p-3.5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <label className="text-xs font-bold text-white flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.aprobacionFinalGerenciaGeneral}
                        onChange={(e) => {
                          const aprobado = e.target.checked;
                          setFormData({
                            ...formData,
                            aprobacionFinalGerenciaGeneral: aprobado,
                            fechaAprobacionGerenciaGeneral: aprobado 
                              ? (formData.fechaAprobacionGerenciaGeneral || new Date().toISOString().slice(0, 10))
                              : '',
                            aprobadoPorGerenciaGeneral: aprobado
                              ? (formData.aprobadoPorGerenciaGeneral || 'Dr. Walter Pedroza - Gerencia General')
                              : '',
                            seLlevoACabo: aprobado && (formData.seLlevoACabo === 'Planificado' || formData.seLlevoACabo === 'En proceso')
                              ? 'Listo'
                              : formData.seLlevoACabo
                          });
                        }}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                      />
                      <span>Conceder Aprobación Final de la Gerencia General</span>
                    </label>
                    <p className="text-[10px] text-slate-300">
                      Al marcar esta casilla, el proyecto queda formalmente avalado por la Dirección General y su facturación real ({formatearHNL(impactoRebajaHNL)}) se descuenta de la meta mensual del POA.
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 block uppercase">Monto a Rebajar</span>
                    <span className="text-sm font-black font-mono text-emerald-400">
                      {formatearHNL(impactoRebajaHNL)}
                    </span>
                  </div>
                </div>

                {/* Desglose de Impacto en Cuota Mensual */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                  <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                    <span className="text-[10px] text-slate-400 block uppercase">Meta Mes ({formatearEtiquetaMes(mesKeyProyecto)})</span>
                    <span className="text-xs font-bold font-mono text-slate-200">
                      {formatearHNL(metaMesPOA)}
                    </span>
                  </div>

                  <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                    <span className="text-[10px] text-slate-400 block uppercase">Rebaja por este Curso</span>
                    <span className={`text-xs font-bold font-mono ${formData.aprobacionFinalGerenciaGeneral ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {formData.aprobacionFinalGerenciaGeneral ? `-${formatearHNL(impactoRebajaHNL)}` : 'L. 0.00 (Pendiente)'}
                    </span>
                  </div>

                  <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                    <span className="text-[10px] text-slate-400 block uppercase">Saldo Restante Estimado</span>
                    <span className="text-xs font-bold font-mono text-indigo-300">
                      {formatearHNL(saldoRestanteMesEstimado)}
                    </span>
                  </div>
                </div>

                {/* Campos Adicionales de Autorización si está marcado */}
                {formData.aprobacionFinalGerenciaGeneral && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-indigo-900/60 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Aprobado Por (Titular)
                      </label>
                      <input
                        type="text"
                        value={formData.aprobadoPorGerenciaGeneral}
                        onChange={(e) => setFormData({ ...formData, aprobadoPorGerenciaGeneral: e.target.value })}
                        placeholder="Dr. Walter Pedroza - Gerencia General"
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Fecha de Aprobación
                      </label>
                      <input
                        type="date"
                        value={formData.fechaAprobacionGerenciaGeneral}
                        onChange={(e) => setFormData({ ...formData, fechaAprobacionGerenciaGeneral: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Dictamen / Observaciones de la Gerencia General
                      </label>
                      <input
                        type="text"
                        value={formData.observacionesAprobacionGeneral}
                        onChange={(e) => setFormData({ ...formData, observacionesAprobacionGeneral: e.target.value })}
                        placeholder="Ej: Aprobado formalmente. Cumple con rentabilidad mínima y rebaja de meta mensual POA 2026."
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Columna Derecha: Tarjeta de Cálculos en Tiempo Real (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900 text-white rounded-xl p-5 shadow-lg border border-slate-800 space-y-4 sticky top-4">
                
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Resultados Financieros en Vivo
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                    {moneda}
                  </span>
                </div>

                {/* 1. Gasto Operativo */}
                <div className={`flex items-center justify-between text-xs py-1.5 px-2 rounded-lg border transition-colors ${
                  calculoEnVivo.gastoTotalOperativo <= 0
                    ? 'bg-rose-950/90 border-rose-500 text-rose-200 ring-1 ring-rose-500/50'
                    : excedeSesentaPorcientoCostoOperativo
                    ? 'bg-amber-950/90 border-2 border-amber-500 text-amber-100 ring-1 ring-amber-400/80 shadow-xs'
                    : calculoEnVivo.gastoTotalOperativo > umbralCritico
                    ? 'bg-rose-950/80 border-rose-700/80 text-rose-200'
                    : 'border-b border-slate-800/80'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <span className={
                      calculoEnVivo.gastoTotalOperativo <= 0 
                        ? 'text-rose-300 font-bold' 
                        : excedeSesentaPorcientoCostoOperativo
                        ? 'text-amber-200 font-bold'
                        : calculoEnVivo.gastoTotalOperativo > umbralCritico 
                        ? 'text-rose-200 font-bold' 
                        : 'text-slate-400'
                    }>
                      Gasto Total Operativo:
                    </span>
                    {calculoEnVivo.gastoTotalOperativo <= 0 ? (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-rose-900 text-rose-200 px-1.5 py-0.2 rounded border border-rose-500 animate-pulse">
                        Inválido (0.00)
                      </span>
                    ) : excedeSesentaPorcientoCostoOperativo ? (
                      <span 
                        id="tag-resaltado-costo-60-vivo"
                        className="text-[9px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded border border-amber-400 animate-pulse font-mono shadow-2xs"
                        title={`Costo operativo representa el ${porcentajeCostoSobreIngreso.toFixed(1)}% del ingreso total esperado (> 60%)`}
                      >
                        &gt; 60% Ingreso ({porcentajeCostoSobreIngreso.toFixed(1)}%)
                      </span>
                    ) : calculoEnVivo.gastoTotalOperativo > umbralCritico && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-rose-900/90 text-rose-200 px-1.5 py-0.2 rounded border border-rose-600">
                        &gt; Umbral
                      </span>
                    )}
                  </div>
                  <span className={`font-mono font-bold ${
                    calculoEnVivo.gastoTotalOperativo <= 0
                      ? 'text-rose-400 font-black text-xs'
                      : excedeSesentaPorcientoCostoOperativo
                      ? 'text-amber-300 font-black text-sm'
                      : calculoEnVivo.gastoTotalOperativo > umbralCritico
                      ? 'text-rose-300 font-black text-sm'
                      : 'text-amber-400'
                  }`}>
                    {calculoEnVivo.gastoTotalOperativo <= 0 ? 'L 0.00 (Inválido)' : formatearMoneda(calculoEnVivo.gastoTotalOperativo, moneda)}
                  </span>
                </div>

                {/* Indicador de Proporción Costo Operativo vs. Ingreso Total Esperado */}
                {ingresoTotalEsperado > 0 && (
                  <div className={`flex items-center justify-between text-xs py-1 px-2 rounded-md border ${
                    excedeSesentaPorcientoCostoOperativo
                      ? 'bg-amber-900/40 border-amber-600/70 text-amber-200'
                      : 'border-b border-slate-800/60 text-slate-400'
                  }`}>
                    <span className="flex items-center gap-1">
                      {excedeSesentaPorcientoCostoOperativo && (
                        <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                      )}
                      <span>Costo / Ingreso Esperado:</span>
                    </span>
                    <span className={`font-mono font-bold ${
                      excedeSesentaPorcientoCostoOperativo ? 'text-amber-300 font-black' : 'text-slate-300'
                    }`}>
                      {porcentajeCostoSobreIngreso.toFixed(1)}% 
                      <span className="text-[10px] ml-1 font-normal text-slate-400">
                        {excedeSesentaPorcientoCostoOperativo ? '(Máx rec. 60%)' : '(≤ 60% OK)'}
                      </span>
                    </span>
                  </div>
                )}

                {/* 2. Precio Venta Requerido */}
                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Venta Requerida Base ({calculoEnVivo.margenGananciaOperativa}%):</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {formatearMoneda(calculoEnVivo.precioVentaRequerido, moneda)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">15% ISV Total Curso (Ventas):</span>
                  <span className="font-mono font-semibold text-amber-400">
                    {formatearMoneda(calculoEnVivo.isvVentaRequeridaTotal || 0, moneda)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-800/80">
                  <span className="text-slate-300 font-semibold">Total Venta Requerida + ISV:</span>
                  <span className="font-mono font-bold text-emerald-300">
                    {formatearMoneda(calculoEnVivo.precioVentaRequeridoConISV || calculoEnVivo.precioVentaRequerido, moneda)}
                  </span>
                </div>

                {/* 3. Ganancia Operativa Proyectada */}
                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Ganancia Operativa Base:</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    +{formatearMoneda(calculoEnVivo.gananciaOperativa, moneda)}
                  </span>
                </div>

                {/* 4. Precio Sugerido por Alumno & Desglose ISV */}
                <div className="bg-blue-950/60 border border-blue-800/60 rounded-lg p-3 my-2 space-y-2">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-blue-300 uppercase tracking-wider">
                      <span>Precio Neto / Alumno:</span>
                      <span className="font-mono text-blue-400 font-bold">
                        {formatearMoneda(calculoEnVivo.precioSugeridoAlumno, moneda)}
                      </span>
                    </div>
                    
                    {calculoEnVivo.aplicaISV ? (
                      <div className="flex items-center justify-between text-[11px] text-amber-300 font-semibold pt-1 border-t border-blue-900/60">
                        <span>+ 15% ISV (SAR):</span>
                        <span className="font-mono">
                          +{formatearMoneda(calculoEnVivo.isvPorAlumno || 0, moneda)}
                        </span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-emerald-400 font-semibold pt-1 border-t border-blue-900/60 flex items-center justify-between">
                        <span>Tratamiento Fiscal:</span>
                        <span>Exento de ISV (0%)</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs font-black text-amber-400 pt-1.5 border-t border-blue-800/80">
                      <span>Precio Factura al Alumno:</span>
                      <span className="font-mono text-sm">
                        {formatearMoneda(calculoEnVivo.precioSugeridoConISV || calculoEnVivo.precioSugeridoAlumno, moneda)}
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Proyección calculada con {calculoEnVivo.alumnosProyectados} alumnos mín.
                  </div>
                </div>

                {/* 5. Alumnos y Resultados Finales */}
                <div className="space-y-2 pt-1 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Alumnos Inscritos:</span>
                    <span className="font-mono font-bold text-slate-200">
                      {calculoEnVivo.alumnosFinal} de {calculoEnVivo.alumnosProyectados}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Diferencia de Alumnos:</span>
                    <span className={`font-mono font-bold ${
                      calculoEnVivo.diferenciaAlumnos > 0 ? 'text-emerald-400' : calculoEnVivo.diferenciaAlumnos < 0 ? 'text-rose-400' : 'text-slate-400'
                    }`}>
                      {calculoEnVivo.diferenciaAlumnos > 0 ? `+${calculoEnVivo.diferenciaAlumnos}` : calculoEnVivo.diferenciaAlumnos}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Ganancia Alumnos Adicionales:</span>
                    <span className="font-mono text-emerald-400">
                      +{formatearMoneda(calculoEnVivo.gananciaAlumnosAdicionales, moneda)}
                    </span>
                  </div>
                </div>

                {/* Total Ganancias Finales Card */}
                <div className={`rounded-xl p-3.5 border ${
                  calculoEnVivo.totalGananciasFinales >= 0
                    ? 'bg-emerald-950/70 border-emerald-700/80 text-emerald-100'
                    : 'bg-rose-950/70 border-rose-700/80 text-rose-100'
                }`}>
                  <div className="text-[11px] font-bold uppercase tracking-wider">
                    Total Ganancias Finales
                  </div>
                  <div className="text-2xl font-black font-mono mt-0.5">
                    {formatearMoneda(calculoEnVivo.totalGananciasFinales, moneda)}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-emerald-800/40 text-[11px]">
                    <span>ROI Real:</span>
                    <span className="font-bold font-mono">
                      {calculoEnVivo.roiPorcentaje.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-300 mt-0.5">
                    <span>Punto de equilibrio:</span>
                    <span className="font-mono font-semibold">
                      {calculoEnVivo.puntoEquilibrioAlumnos} alumnos mín.
                    </span>
                  </div>
                </div>

                {/* Control POA 2026 y Rebaja Mensual */}
                <div className="bg-slate-800/90 rounded-xl p-3 border border-slate-700 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                      Control POA Mensual ({trimestreMesPOA})
                    </span>
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${
                      formData.aprobacionFinalGerenciaGeneral
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}>
                      {formData.aprobacionFinalGerenciaGeneral ? '✅ Aprobado GG' : '⏳ Pendiente GG'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Meta POA Mes:</span>
                    <span className="font-mono text-slate-200">
                      {formatearHNL(metaMesPOA)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Rebaja por este curso:</span>
                    <span className={`font-mono font-bold ${formData.aprobacionFinalGerenciaGeneral ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {formData.aprobacionFinalGerenciaGeneral ? `-${formatearHNL(impactoRebajaHNL)}` : 'L. 0.00 (Pendiente)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-700">
                    <span className="text-slate-400">Saldo Restante Mes:</span>
                    <span className="font-mono font-bold text-indigo-300">
                      {formatearHNL(saldoRestanteMesEstimado)}
                    </span>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Footer Botones */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 text-xs text-slate-600 font-mono bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 w-full sm:w-auto justify-between sm:justify-start">
              <span className="flex items-center gap-1.5 text-emerald-800 font-sans font-medium text-[11px]">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                Sello automático de fecha y hora al grabar:
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-800 font-bold bg-emerald-100/90 px-2 py-0.5 rounded text-[11px] border border-emerald-300">
                  {fechaEnVivo}
                </span>
                <strong className="text-emerald-700 font-bold">{horaEnVivo}</strong>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              {/* Indicador de Bloqueo Institucional si Costos son Cero o Proyecciones Inconsistentes */}
              {(calculoEnVivo.gastoTotalOperativo <= 0 ||
                calculoEnVivo.costoDocenteCalculado <= 0 ||
                formData.alumnosProyectados === '' ||
                Number(formData.alumnosProyectados) < 6 ||
                !Number.isInteger(Number(formData.alumnosProyectados)) ||
                Number(formData.alumnosProyectados) > 250) && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 text-[11px] font-bold">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>
                    {calculoEnVivo.gastoTotalOperativo <= 0
                      ? 'Costo operativo en 0.00'
                      : calculoEnVivo.costoDocenteCalculado <= 0
                      ? 'Honorarios docentes en 0.00'
                      : formData.alumnosProyectados === '' || Number(formData.alumnosProyectados) < 6
                      ? 'Proyección < 6 alumnos'
                      : !Number.isInteger(Number(formData.alumnosProyectados))
                      ? 'Alumnos deben ser enteros'
                      : 'Proyección excede límite'}
                  </span>
                </div>
              )}

              <button
                id="btn-cancelar-modal"
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                id="btn-guardar-proyecto"
                type="submit"
                disabled={
                  usuarioActivo?.id === 'auditor-interno' ||
                  calculoEnVivo.gastoTotalOperativo <= 0 ||
                  calculoEnVivo.costoDocenteCalculado <= 0 ||
                  formData.alumnosProyectados === '' ||
                  Number(formData.alumnosProyectados) < 6 ||
                  !Number.isInteger(Number(formData.alumnosProyectados)) ||
                  Number(formData.alumnosProyectados) > 250
                }
                title={
                  usuarioActivo?.id === 'auditor-interno'
                    ? 'Auditoría SAR: Perfil de solo lectura. No autorizado para modificar o crear proyectos.'
                    : calculoEnVivo.gastoTotalOperativo <= 0
                    ? 'Bloqueo: El costo operativo total no puede ser cero (0.00)'
                    : calculoEnVivo.costoDocenteCalculado <= 0
                    ? 'Bloqueo: Los honorarios docentes no pueden ser cero (0.00)'
                    : formData.alumnosProyectados === '' || Number(formData.alumnosProyectados) < 6
                    ? 'No es rentable: Se requieren mínimo 6 alumnos proyectados'
                    : !Number.isInteger(Number(formData.alumnosProyectados))
                    ? 'Inconsistencia: La cantidad de alumnos debe ser un número entero'
                    : Number(formData.alumnosProyectados) > 250
                    ? 'Proyección excesiva (> 250): Considere aperturar secciones adicionales'
                    : undefined
                }
                className={`flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition-colors ${
                  usuarioActivo?.id === 'auditor-interno'
                    ? 'bg-slate-400 cursor-not-allowed opacity-60'
                    : calculoEnVivo.gastoTotalOperativo <= 0 ||
                  calculoEnVivo.costoDocenteCalculado <= 0 ||
                  formData.alumnosProyectados === '' ||
                  Number(formData.alumnosProyectados) < 6 ||
                  !Number.isInteger(Number(formData.alumnosProyectados)) ||
                  Number(formData.alumnosProyectados) > 250
                    ? 'bg-slate-400 cursor-not-allowed opacity-60'
                    : calculoEnVivo.gastoTotalOperativo > umbralCritico
                    ? 'bg-amber-600 hover:bg-amber-700 cursor-pointer'
                    : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>
                  {usuarioActivo?.id === 'auditor-interno'
                    ? 'Solo Lectura (Auditoría)'
                    : modoFormulario === 'academica'
                    ? (proyectoAEditar ? 'Guardar y Reenviar a Comercialización' : 'Guardar y Autorizar Envío a Comercialización')
                    : modoFormulario === 'comercial'
                    ? 'Guardar y Autorizar Envío a Gerencia General'
                    : (proyectoAEditar ? 'Guardar Cambios' : 'Registrar Proyecto')}
                </span>
                {calculoEnVivo.gastoTotalOperativo > umbralCritico && calculoEnVivo.gastoTotalOperativo > 0 && (
                  <span className="text-[10px] bg-amber-800/90 text-amber-100 px-1.5 py-0.2 rounded font-bold">
                    ⚠️ Costo Crítico
                  </span>
                )}
                {excedeSesentaPorcientoCostoOperativo && (
                  <span 
                    id="tag-btn-costo-60"
                    className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-black border border-amber-300 shadow-2xs font-mono"
                    title={`Costo Operativo (${porcentajeCostoSobreIngreso.toFixed(1)}%) supera el 60% del ingreso esperado`}
                  >
                    ⚠️ Costo &gt; 60%
                  </span>
                )}
              </button>
            </div>
          </div>

        </form>

      </div>

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
        onConfirmarGuardado={handleConfirmarGuardadoPreventivo}
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
        esEdicion={Boolean(proyectoAEditar)}
      />

    </div>
  );
};
