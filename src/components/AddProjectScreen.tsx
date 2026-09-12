import React, { useState } from 'react';
import { 
  PlusCircle, 
  Save, 
  Calculator, 
  BookOpen, 
  DollarSign, 
  Users, 
  Percent, 
  Sparkles, 
  ArrowLeft,
  CheckCircle2,
  Receipt,
  FileText,
  ShieldCheck,
  Info,
  Clock,
  ArrowRight,
  Building2,
  GraduationCap,
  Megaphone,
  Check,
  Layers,
  ShoppingBag,
  Calendar,
  Lock,
  Unlock,
  KeyRound,
  RotateCcw,
  Settings,
  ShieldAlert,
  AlertTriangle,
  X
} from 'lucide-react';
import { ProyectoEducativo, Moneda, TipoProyecto, NivelProyecto, MetodoVenta, EstadoProyecto, TipoServicioFiscal, VistaPrincipal } from '../types';
import { calcularMetricasProyecto, formatearMoneda } from '../utils/calculations';
import { REGLAS_ISV_SERVICIOS, obtenerReglaISVPorServicio, obtenerReglaFiscalPorTipoProyecto } from '../utils/isvRules';
import { generarSiguienteCorrelativo, formatearCorrelativo } from '../utils/correlativoUtils';
import { sumarDiasHabiles, sumarDiasCalendario, contarDiasHabilesEntreFechas } from '../utils/dateUtils';
import { CurricularPlanningSection } from './CurricularPlanningSection';
import { DocenteProfileSection } from './academic/DocenteProfileSection';
import { obtenerConfiguracionHorasPorNivel } from '../utils/curricularUtils';
import { sugerirMetodologiaPorDefecto } from '../utils/curricularUtils';
import { CostosFijosAuthModal } from './CostosFijosAuthModal';
import { 
  CostoOperativoBannerPreventivo, 
  CostoOperativoModalPreventivo, 
  cargarUmbralCriticoGuardado, 
  guardarUmbralCriticoStorage 
} from './CostoOperativoAlertaPreventiva';

interface AddProjectScreenProps {
  moneda: Moneda;
  proyectosExistentes?: ProyectoEducativo[];
  onGuardar: (proyecto: ProyectoEducativo) => void;
  onCancelar: () => void;
  onNavegarVista?: (vista: VistaPrincipal) => void;
}

export const AddProjectScreen: React.FC<AddProjectScreenProps> = ({
  moneda,
  proyectosExistentes = [],
  onGuardar,
  onCancelar,
  onNavegarVista,
}) => {
  // Generar correlativo inicial
  const correlativoInicial = generarSiguienteCorrelativo(proyectosExistentes, 'Capacitación profesional / Mentoría ejecutiva', 2026);

  const [formData, setFormData] = useState({
    numeroCorrelativo: correlativoInicial.numeroCorrelativo,
    codigoPrograma: correlativoInicial.codigoPrograma,
    codigoFiscalSAR: correlativoInicial.codigoFiscalSAR,
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
    horario: '', // En blanco para rellenar manualmente
    diasClase: '', // En blanco para rellenar manualmente
    calificacionCurso: 5.0,
    tipoProyecto: 'Capacitación profesional / Mentoría ejecutiva' as TipoProyecto,
    nivel: 'Básico' as NivelProyecto,
    servicioFiscal: 'Capacitación profesional / Mentoría ejecutiva' as TipoServicioFiscal,
    aplicaISV: true,
    fechaProgramacion: new Date().toISOString().slice(0, 10),
    fechaVenta: sumarDiasHabiles(new Date().toISOString().slice(0, 10), 30),
    horasClase: 12,
    tarifaHoraDocente: 200,
    costoZoom: 300,
    costoPapeleria: 100,
    gastosVarios: 100,
    margenGananciaOperativa: 40,
    alumnosProyectados: 4,
    alumnosFinal: 4,
    metodoVenta: 'Redes sociales' as MetodoVenta,
    seLlevoACabo: 'Planificado' as EstadoProyecto,
    observaciones: '',
  });

  const [proyectoRecienCreado, setProyectoRecienCreado] = useState<ProyectoEducativo | null>(null);
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);
  const [costosFijosAutorizados, setCostosFijosAutorizados] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [umbralCritico, setUmbralCritico] = useState<number>(() => cargarUmbralCriticoGuardado(moneda));
  const [mostrarAvisoPreventivoModal, setMostrarAvisoPreventivoModal] = useState(false);
  const [proyectoParaGuardarPendiente, setProyectoParaGuardarPendiente] = useState<ProyectoEducativo | null>(null);

  // Obtener regla fiscal seleccionada
  const reglaFiscalActual = obtenerReglaISVPorServicio(formData.servicioFiscal);

  // Cálculo fiscal y financiero en vivo totalmente automático
  const calculoEnVivo = calcularMetricasProyecto({
    id: 'nuevo-temp',
    numeroCorrelativo: formData.numeroCorrelativo,
    codigoPrograma: formData.codigoPrograma,
    codigoFiscalSAR: formData.codigoFiscalSAR,
    nombreProyecto: formData.nombreProyecto || 'Nuevo Proyecto Educativo',
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
    horasClase: Number(formData.horasClase) || 0,
    tarifaHoraDocente: Number(formData.tarifaHoraDocente) || 200,
    costoZoom: Number(formData.costoZoom) || 0,
    costoPapeleria: Number(formData.costoPapeleria) || 0,
    gastosVarios: Number(formData.gastosVarios) || 0,
    margenGananciaOperativa: Number(formData.margenGananciaOperativa) || 0,
    alumnosProyectados: Number(formData.alumnosProyectados) || 1,
    alumnosFinal: Math.max(4, Number(formData.alumnosFinal) || 4),
    metodoVenta: formData.metodoVenta,
    seLlevoACabo: formData.seLlevoACabo,
    observaciones: formData.observaciones,
  });

  const handleCambioTipoProyecto = (nuevoTipo: TipoProyecto) => {
    const regla = obtenerReglaFiscalPorTipoProyecto(nuevoTipo);
    setFormData(prev => ({
      ...prev,
      tipoProyecto: nuevoTipo,
      servicioFiscal: regla.servicio as TipoServicioFiscal,
      aplicaISV: regla.gravaISV,
    }));
  };

  const handleCambioServicioFiscal = (nuevoServicio: TipoServicioFiscal) => {
    const regla = obtenerReglaISVPorServicio(nuevoServicio);
    setFormData(prev => ({
      ...prev,
      servicioFiscal: nuevoServicio,
      aplicaISV: regla.gravaISV,
    }));
  };

  // Estado para resaltar visualmente el campo que falta por completar
  const [campoConError, setCampoConError] = useState<string | null>(null);

  // Alerta flotante informativa de medida de seguridad
  const [alertaSeguridad, setAlertaSeguridad] = useState<{
    mensaje: string;
    camposFaltantes: Array<{
      idElemento: string;
      nombreCampo: string;
      seccion: string;
      autoRellenar?: () => void;
      textoAutoRellenar?: string;
    }>;
  } | null>(null);

  // Función de scroll suave y foco exacto hacia el campo faltante
  const llevarAlCampoFaltante = (idElemento: string) => {
    setCampoConError(idElemento);
    setTimeout(() => {
      const elemento = document.getElementById(idElemento);
      if (elemento) {
        elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if ('focus' in elemento && typeof (elemento as HTMLElement).focus === 'function') {
          (elemento as HTMLElement).focus();
        }
        elemento.classList.add('ring-4', 'ring-rose-500', 'scale-[1.01]', 'animate-pulse');
        setTimeout(() => {
          elemento.classList.remove('ring-4', 'ring-rose-500', 'scale-[1.01]', 'animate-pulse');
        }, 3500);
      }
    }, 120);
  };

  // Rellenar automáticamente todos los campos pendientes
  const autoRellenarTodosLosFaltantes = () => {
    setFormData(prev => ({
      ...prev,
      objetivoGeneral: prev.objetivoGeneral && prev.objetivoGeneral.trim().length >= 5
        ? prev.objetivoGeneral
        : prev.nombreProyecto
        ? `Desarrollar competencias teórico-prácticas fundamentales en ${prev.nombreProyecto}, asegurando la aplicación de técnicas y metodologías con estándares de excelencia.`
        : 'Capacitar a los estudiantes en las competencias técnicas y metodológicas fundamentales del programa formativo.',
      temasImpartir: prev.temasImpartir && prev.temasImpartir.trim().length >= 10
        ? prev.temasImpartir
        : `Módulo 1: Fundamentos y conceptos esenciales de ${prev.nombreProyecto || 'la materia'}\nMódulo 2: Técnicas aplicadas y resolución de casos prácticos\nMódulo 3: Métodos avanzados y optimización operativa\nMódulo 4: Proyecto integrador y evaluación final de competencias`,
      cantidadTemas: Number(prev.cantidadTemas) >= 1 ? prev.cantidadTemas : 4,
      horasClasePorTema: Number(prev.horasClasePorTema) >= 1 ? prev.horasClasePorTema : 3,
      horasClase: Number(prev.horasClase) >= 1 ? prev.horasClase : 12,
      metodologia: prev.metodologia && prev.metodologia.trim().length >= 5
        ? prev.metodologia
        : 'Aprendizaje Basado en Proyectos (ABP) & Casos Reales',
      nombreDocente: prev.nombreDocente && prev.nombreDocente.trim().length >= 3 ? prev.nombreDocente : 'Walter Pedroza',
      seccion: prev.seccion && prev.seccion.trim() ? prev.seccion : 'Sección A',
      horario: prev.horario && prev.horario.trim() ? prev.horario : '06:00 PM - 08:00 PM',
      diasClase: prev.diasClase && prev.diasClase.trim() ? prev.diasClase : 'Lunes, Miércoles y Viernes',
      tarifaHoraDocente: Number(prev.tarifaHoraDocente) > 0 ? prev.tarifaHoraDocente : 200,
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
        idElemento: 'screen-input-nombre-proyecto',
        nombreCampo: 'Nombre del Proyecto / Curso',
        seccion: '1. Información Curricular',
        esValido: () => Boolean(formData.nombreProyecto && formData.nombreProyecto.trim().length >= 3),
        mensaje: 'Debe ingresar el nombre oficial del curso o programa formativo (mínimo 3 caracteres).'
      },
      {
        idElemento: 'screen-input-objetivo',
        nombreCampo: 'Objetivo General del Curso',
        seccion: '1. Información Curricular',
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
        idElemento: 'screen-input-temas-impartir',
        nombreCampo: 'Temas a Impartir (Contenido Curricular / Syllabus)',
        seccion: '1. Información Curricular',
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
        seccion: 'Planificación Curricular',
        esValido: () => Boolean(formData.nivel),
        mensaje: 'Debe seleccionar el nivel académico del curso (Básico, Intermedio, Avanzado, etc.).'
      },
      {
        idElemento: 'input-cantidad-temas',
        nombreCampo: 'Cantidad de Temas / Módulos',
        seccion: 'Planificación Curricular',
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
        seccion: 'Planificación Curricular',
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
        seccion: 'Planificación Curricular',
        esValido: () => Number(formData.horasClase) >= 1,
        mensaje: 'El total de horas de clase del curso no puede ser 0 ni quedar vacío (en cursos básicos la norma es 12 horas).',
        autoRellenar: () => {
          const c = Number(formData.cantidadTemas) || 4;
          const h = Number(formData.horasClasePorTema) || 3;
          setFormData(prev => ({ ...prev, horasClase: c * h }));
        },
        textoAutoRellenar: 'Calcular Total de Horas Automático'
      },
      {
        idElemento: 'input-metodologia',
        nombreCampo: 'Metodología Didáctica',
        seccion: 'Planificación Curricular',
        esValido: () => Boolean(formData.metodologia && formData.metodologia.trim().length >= 5),
        mensaje: 'Debe seleccionar o detallar la metodología didáctica institucional a emplear.',
        autoRellenar: () => {
          const sugerida = sugerirMetodologiaPorDefecto(formData.tipoProyecto, formData.nivel);
          setFormData(prev => ({ ...prev, metodologia: sugerida }));
        },
        textoAutoRellenar: 'Aplicar Metodología Sugerida Institucional'
      },
      {
        idElemento: 'screen-input-docente',
        nombreCampo: 'Nombre del Docente Responsable',
        seccion: 'Perfil Docente',
        esValido: () => Boolean(formData.nombreDocente && formData.nombreDocente.trim().length >= 3),
        mensaje: 'Debe asignar el nombre del docente titular del curso.',
        autoRellenar: () => {
          setFormData(prev => ({ ...prev, nombreDocente: 'Walter Pedroza' }));
        },
        textoAutoRellenar: 'Asignar Docente Titular Walter Pedroza'
      },
      {
        idElemento: 'screen-input-seccion',
        nombreCampo: 'Sección Académica',
        seccion: 'Programación Académica',
        esValido: () => Boolean(formData.seccion && formData.seccion.trim().length >= 1),
        mensaje: 'Debe indicar la sección asignada para el curso formativo.',
        autoRellenar: () => {
          setFormData(prev => ({ ...prev, seccion: 'Sección A' }));
        },
        textoAutoRellenar: 'Asignar Sección A'
      },
      {
        idElemento: 'screen-input-horario',
        nombreCampo: 'Horario de Clase',
        seccion: 'Programación Académica',
        esValido: () => Boolean(formData.horario && formData.horario.trim().length >= 3),
        mensaje: 'El horario de impartición es obligatorio para planificar la sala virtual y la asistencia estudiantil.',
        autoRellenar: () => {
          setFormData(prev => ({ ...prev, horario: '06:00 PM - 08:00 PM' }));
        },
        textoAutoRellenar: 'Fijar Horario 06:00 PM - 08:00 PM'
      },
      {
        idElemento: 'screen-input-dias',
        nombreCampo: 'Días de Clase',
        seccion: 'Programación Académica',
        esValido: () => Boolean(formData.diasClase && formData.diasClase.trim().length >= 3),
        mensaje: 'Debe especificar los días en que se impartirán las sesiones de clase sincrónicas.',
        autoRellenar: () => {
          setFormData(prev => ({ ...prev, diasClase: 'Lunes, Miércoles y Viernes' }));
        },
        textoAutoRellenar: 'Fijar Lunes, Miércoles y Viernes'
      },
      {
        idElemento: 'screen-input-tarifa-docente',
        nombreCampo: 'Tarifa por Hora Docente',
        seccion: 'Costos Operativos',
        esValido: () => Number(formData.tarifaHoraDocente) > 0,
        mensaje: 'La tarifa de honorarios docentes por hora debe ser un valor numérico positivo mayor a 0.',
        autoRellenar: () => {
          setFormData(prev => ({ ...prev, tarifaHoraDocente: 200 }));
        },
        textoAutoRellenar: 'Asignar Tarifa Base L. 200/hr'
      },
    ];

    const camposInvalidos = reglas.filter(r => !r.esValido());

    if (camposInvalidos.length > 0) {
      const primerInvalido = camposInvalidos[0];
      setAlertaSeguridad({
        mensaje: `⚠️ Medida de Seguridad Institucional: No se puede grabar el diseño curricular porque hay ${camposInvalidos.length} campo(s) obligatorio(s) pendiente(s). Primer campo requerido: "${primerInvalido.nombreCampo}" (${primerInvalido.seccion}).`,
        camposFaltantes: camposInvalidos
      });
      llevarAlCampoFaltante(primerInvalido.idElemento);
      return false;
    }

    setAlertaSeguridad(null);
    setCampoConError(null);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificación estricta de campos obligatorios como medida de seguridad
    if (!validarFormularioSeguridad()) {
      return;
    }

    // Sellado oficial de fecha y hora automática al grabar el proyecto
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

    const nuevoProyecto = calcularMetricasProyecto({
      id: Date.now().toString(),
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
      encuestaSatisfaccion: {
        estado: 'No Generada',
        calificacionPromedio: Number(formData.calificacionCurso) || 5.0,
      },
      tipoProyecto: formData.tipoProyecto,
      nivel: formData.nivel,
      servicioFiscal: formData.servicioFiscal,
      aplicaISV: formData.aplicaISV,
      fechaProgramacion: formData.fechaProgramacion,
      fechaVenta: formData.fechaVenta,
      horasClase: Number(formData.horasClase) || 0,
      tarifaHoraDocente: Number(formData.tarifaHoraDocente) || 200,
      costoZoom: Number(formData.costoZoom) || 0,
      costoPapeleria: Number(formData.costoPapeleria) || 0,
      gastosVarios: Number(formData.gastosVarios) || 0,
      margenGananciaOperativa: Number(formData.margenGananciaOperativa) || 0,
      alumnosProyectados: Number(formData.alumnosProyectados) || 1,
      alumnosFinal: Math.max(4, Number(formData.alumnosFinal) || 4),
      metodoVenta: formData.metodoVenta,
      seLlevoACabo: 'Planificado', // Registro académico inicial: se traslada a comercialización
      observaciones: formData.observaciones.trim(),

      // Sello institucional de fecha y hora automática de grabación
      fechaElaboracion: fechaActual,
      horaElaboracion: horaActual,
      fechaModificacion: fechaActual,
      horaModificacion: horaActual,
      fechaHoraGrabacion: fechaHoraCompleta,
      fechaRegistroCompleta: fechaHoraCompleta,
      registroAuditoria: {
        creadoPor: 'Gerencia Académica (Walter Pedroza)',
        fechaHoraCreacion: fechaHoraCompleta,
        ultimaModificacion: fechaHoraCompleta,
        equipoModifico: 'Gerencia Académica',
      },
    });

    // Validación preventiva en tiempo real antes de guardar
    if (nuevoProyecto.gastoTotalOperativo > umbralCritico) {
      setProyectoParaGuardarPendiente(nuevoProyecto);
      setMostrarAvisoPreventivoModal(true);
      return;
    }

    onGuardar(nuevoProyecto);
    setProyectoRecienCreado(nuevoProyecto);
    setGuardadoExitoso(true);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado de la Pantalla */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-blue-100 text-blue-800 rounded border border-blue-200">
                Paso 1: Gerencia Académica
              </span>
              <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border">
                {formatearCorrelativo(formData.numeroCorrelativo, formData.codigoPrograma)}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              Registrar Programa Educativo & Trasladar al Flujo Institucional
            </h2>
            <p className="text-xs text-slate-500">
              Formulación curricular y costos operativos base. Al registrarse, el proyecto se trasladará a la Gerencia de Comercialización (Paso 2) y a la Gerencia General (Paso 3).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancelar}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Catálogo</span>
        </button>
      </div>

      {/* Stepper de Flujo de Traslado Institucional (1-2-3) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
          Cadena de Responsabilidad y Traslado de Proyectos (Flujo 1-2-3)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Paso 1: Académica */}
          <div className="p-3 rounded-lg border bg-blue-50/80 border-blue-300 flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-blue-700" />
                <span className="text-xs font-bold text-blue-950">Gerencia Académica</span>
                <span className="text-[9px] bg-blue-200/80 text-blue-900 font-extrabold px-1.5 py-0.2 rounded">ACTIVO</span>
              </div>
              <p className="text-[11px] text-blue-800 mt-0.5 leading-snug">
                Formulación curricular, docente, horario, insumos fijos y costos operativos.
              </p>
            </div>
          </div>

          {/* Paso 2: Comercial */}
          <div className="p-3 rounded-lg border bg-slate-50 border-slate-200 flex items-start gap-3 opacity-90">
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0 border border-emerald-300">
              2
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <Megaphone className="w-3.5 h-3.5 text-emerald-700" />
                <span className="text-xs font-bold text-slate-800">Gerencia Comercial</span>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">SIGUIENTE</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                Asignación de canal de venta, proyección de matrícula y captación de alumnos.
              </p>
            </div>
          </div>

          {/* Paso 3: General */}
          <div className="p-3 rounded-lg border bg-slate-50 border-slate-200 flex items-start gap-3 opacity-90">
            <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-800 font-black text-xs flex items-center justify-center shrink-0 border border-purple-300">
              3
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-purple-700" />
                <span className="text-xs font-bold text-slate-800">Gerencia General</span>
                <span className="text-[9px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded">DICTAMEN</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                Dictamen financiero 'Listo', punto de equilibrio y emisión de Ficha Oficial.
              </p>
            </div>
          </div>

        </div>
      </div>

      {guardadoExitoso && proyectoRecienCreado ? (
        <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 border-2 border-emerald-300 rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-lg animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner border border-emerald-300">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          
          <div className="space-y-1 max-w-xl mx-auto">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-200/80 px-3 py-1 rounded-full border border-emerald-400">
              ¡Formulación Académica Registrada Exitosamente!
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 pt-2">
              {proyectoRecienCreado.nombreProyecto}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Código: <strong className="font-mono text-blue-900">{proyectoRecienCreado.codigoPrograma}</strong> • Docente: <strong className="text-slate-800">{proyectoRecienCreado.nombreDocente}</strong> ({proyectoRecienCreado.horasClase} hrs)
            </p>
          </div>

          {/* Tarjeta de Traslado Activo */}
          <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-xs max-w-2xl mx-auto text-left space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                Estado del Traslado Institucional
              </span>
              <span className="text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                Estado: Planificado (En Bandeja Comercial)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
                <span className="text-[10px] font-bold text-blue-800 uppercase block">1. Académica</span>
                <span className="text-xs font-black text-blue-950 block mt-0.5">✓ Formulado</span>
                <span className="text-[10px] text-blue-700">Costos: {formatearMoneda(proyectoRecienCreado.gastoTotalOperativo, moneda)}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50 border-2 border-emerald-400 shadow-2xs">
                <span className="text-[10px] font-black text-emerald-800 uppercase block flex items-center gap-1">
                  <Megaphone className="w-3 h-3 text-emerald-600" />
                  2. Comercial
                </span>
                <span className="text-xs font-black text-emerald-950 block mt-0.5">⏳ En Espera</span>
                <span className="text-[10px] text-emerald-700">Asignar método de venta y meta</span>
              </div>

              <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200">
                <span className="text-[10px] font-bold text-purple-800 uppercase block">3. General</span>
                <span className="text-xs font-black text-purple-950 block mt-0.5">📋 Pendiente</span>
                <span className="text-[10px] text-purple-700">Dictamen 'Listo' y firma</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
              🔔 <strong>Acción siguiente requerida:</strong> El proyecto ha sido trasladado automáticamente a la bandeja de <strong>Gerencia de Comercialización</strong> para definir el canal de venta y la matrícula meta.
            </p>
          </div>

          {/* Botones de Navegación por Gerencias */}
          <div className="pt-2 flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
            {onNavegarVista && (
              <button
                id="btn-traslado-a-comercializacion"
                type="button"
                onClick={() => onNavegarVista('gerencia-comercializacion')}
                className="px-5 py-2.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md flex items-center gap-2"
              >
                <Megaphone className="w-4 h-4" />
                <span>Ir a Gerencia de Comercialización (Paso 2)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {onNavegarVista && (
              <button
                type="button"
                onClick={() => onNavegarVista('gerencia-general')}
                className="px-4 py-2.5 text-xs font-bold text-purple-900 bg-purple-100 hover:bg-purple-200 border border-purple-300 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Building2 className="w-4 h-4 text-purple-700" />
                <span>Ver en Gerencia General</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                const nuevoCorr = generarSiguienteCorrelativo([...proyectosExistentes, proyectoRecienCreado], formData.tipoProyecto, 2026);
                setGuardadoExitoso(false);
                setProyectoRecienCreado(null);
                setFormData({
                  ...formData,
                  numeroCorrelativo: nuevoCorr.numeroCorrelativo,
                  codigoPrograma: nuevoCorr.codigoPrograma,
                  codigoFiscalSAR: nuevoCorr.codigoFiscalSAR,
                  nombreProyecto: '',
                  objetivoGeneral: '',
                  temasImpartir: '',
                  observaciones: '',
                });
              }}
              className="px-4 py-2.5 text-xs font-bold text-blue-900 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded-xl transition-colors"
            >
              + Registrar Otro Proyecto Académico
            </button>

            <button
              type="button"
              onClick={onCancelar}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors"
            >
              Ver Matriz Principal
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Banner de Medida de Seguridad Institucional: Control de Cumplimiento Curricular */}
          {alertaSeguridad && (
            <div 
              id="alerta-seguridad-curricular-pantalla"
              className="bg-rose-50 border-2 border-rose-500 rounded-xl p-4 shadow-lg animate-in fade-in slide-in-from-top-3 duration-200"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-rose-900 bg-rose-200/80 px-2 py-0.5 rounded">
                        Medida de Seguridad y Cumplimiento Obligatorio
                      </span>
                      <span className="text-xs font-bold text-rose-700">
                        ({alertaSeguridad.camposFaltantes.length} campos por completar)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAlertaSeguridad(null)}
                      className="text-rose-400 hover:text-rose-700 p-0.5 rounded transition-colors"
                      title="Cerrar aviso de seguridad"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs font-semibold text-rose-950 mt-1 leading-relaxed">
                    {alertaSeguridad.mensaje}
                  </p>

                  {/* Lista de campos faltantes con botón directo para llevar al usuario al lugar exacto */}
                  <div className="mt-3 pt-2.5 border-t border-rose-200 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-rose-800 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      Ir al lugar donde falta información:
                    </span>
                    {alertaSeguridad.camposFaltantes.map((cf, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => llevarAlCampoFaltante(cf.idElemento)}
                        className={`text-[11px] px-2.5 py-1 rounded-md font-bold transition-all border flex items-center gap-1 ${
                          campoConError === cf.idElemento
                            ? 'bg-rose-600 text-white border-rose-700 ring-2 ring-rose-300'
                            : 'bg-white text-rose-700 border-rose-300 hover:bg-rose-100 hover:border-rose-400'
                        }`}
                      >
                        <span>→ {cf.nombreCampo}</span>
                        <span className="text-[9px] opacity-75 font-normal">({cf.seccion})</span>
                      </button>
                    ))}
                    
                    {/* Botón de Autocompletado de Seguridad */}
                    <button
                      type="button"
                      onClick={autoRellenarTodosLosFaltantes}
                      className="ml-auto text-[11px] px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold transition-all shadow-xs flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Rellenar Automáticamente Campos Faltantes</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Formulario Principal (7 columnas) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* 1. Información General */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-950 uppercase tracking-wider">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>1. Información Curricular (Gerencia Académica)</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-blue-800 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded">
                  {formatearCorrelativo(formData.numeroCorrelativo, formData.codigoPrograma)}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Nombre del Proyecto Educativo <span className="text-rose-500">*</span>
                    </label>
                    {campoConError === 'screen-input-nombre-proyecto' && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        ⚠️ Campo Obligatorio Requerido
                      </span>
                    )}
                  </div>
                  <input
                    id="screen-input-nombre-proyecto"
                    type="text"
                    required
                    placeholder="Ej: Taller de Finanzas para No Financieros"
                    value={formData.nombreProyecto}
                    onChange={(e) => {
                      setFormData({ ...formData, nombreProyecto: e.target.value });
                      if (campoConError === 'screen-input-nombre-proyecto') setCampoConError(null);
                    }}
                    className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium transition-all ${
                      campoConError === 'screen-input-nombre-proyecto'
                        ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/20'
                        : 'border-slate-300'
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Objetivo General del Programa <span className="text-rose-500">*</span>
                    </label>
                    {campoConError === 'screen-input-objetivo' && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        ⚠️ Requisito Pedagógico Obligatorio
                      </span>
                    )}
                  </div>
                  <textarea
                    id="screen-input-objetivo"
                    rows={2}
                    placeholder="Describir las competencias o conocimientos que adquirirá el participante..."
                    value={formData.objetivoGeneral}
                    onChange={(e) => {
                      setFormData({ ...formData, objetivoGeneral: e.target.value });
                      if (campoConError === 'screen-input-objetivo') setCampoConError(null);
                    }}
                    className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none transition-all ${
                      campoConError === 'screen-input-objetivo'
                        ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/20'
                        : 'border-slate-300'
                    }`}
                  />
                  {campoConError === 'screen-input-objetivo' && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          objetivoGeneral: prev.nombreProyecto
                            ? `Desarrollar en los participantes las competencias fundamentales de ${prev.nombreProyecto}, facilitando la aplicación práctica de herramientas con estándares de calidad.`
                            : 'Capacitar a los estudiantes en las competencias técnicas y metodológicas fundamentales del programa formativo.'
                        }));
                        setCampoConError(null);
                      }}
                      className="mt-1 text-[10px] font-bold text-blue-700 hover:text-blue-900 underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-blue-600" />
                      <span>Generar objetivo sugerido automáticamente</span>
                    </button>
                  )}
                </div>

                {/* Temas a Impartir (Syllabus Curricular) */}
                <div className={`p-3.5 rounded-xl border space-y-1.5 transition-all ${
                  campoConError === 'screen-input-temas-impartir'
                    ? 'bg-rose-50/60 border-rose-400 ring-2 ring-rose-200'
                    : 'bg-blue-50/60 border-blue-200/80'
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-blue-950 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-700" />
                      Temas a Impartir (Contenido / Syllabus Curricular) <span className="text-rose-500">*</span>
                    </label>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                      campoConError === 'screen-input-temas-impartir'
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : 'text-blue-800 bg-blue-100 border-blue-300'
                    }`}>
                      {campoConError === 'screen-input-temas-impartir' ? '⚠️ Syllabus Pendiente' : 'Estructura Académica'}
                    </span>
                  </div>
                  <textarea
                    id="screen-input-temas-impartir"
                    rows={3}
                    placeholder="Tema 1: Fundamentos y conceptos clave&#10;Tema 2: Herramientas prácticas y metodologías&#10;Tema 3: Casos de estudio y aplicación real&#10;Tema 4: Proyecto final y evaluación de competencias"
                    value={formData.temasImpartir}
                    onChange={(e) => {
                      setFormData({ ...formData, temasImpartir: e.target.value });
                      if (campoConError === 'screen-input-temas-impartir') setCampoConError(null);
                    }}
                    className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-slate-800 leading-relaxed transition-all ${
                      campoConError === 'screen-input-temas-impartir'
                        ? 'border-rose-500 ring-2 ring-rose-200'
                        : 'border-blue-300/80'
                    }`}
                  />
                  <div className="flex items-center justify-between text-[10px] text-blue-800">
                    <span>Desglose temático que guiará las sesiones de clase.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          temasImpartir: `Módulo 1: Introducción y fundamentos teóricos de ${formData.nombreProyecto || 'la materia'}\nMódulo 2: Técnicas aplicadas y resolución de casos prácticos\nMódulo 3: Herramientas de optimización y mejores prácticas\nMódulo 4: Proyecto integrador y evaluación final de desempeño`
                        });
                        if (campoConError === 'screen-input-temas-impartir') setCampoConError(null);
                      }}
                      className="text-[10px] font-semibold text-blue-700 hover:text-blue-900 underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-blue-600" />
                      <span>Cargar plantilla de syllabus sugerida (4 temas)</span>
                    </button>
                  </div>
                </div>

                {/* Perfil Docente y Canales de Contacto Directo: Se completa o selecciona primero para propagación automática */}
                <DocenteProfileSection
                  nombreDocente={formData.nombreDocente}
                  docenteClasificacion={formData.docenteClasificacion}
                  docenteTelefono={formData.docenteTelefono}
                  docenteCorreo={formData.docenteCorreo}
                  docenteEspecialidad={formData.docenteEspecialidad}
                  tarifaHoraDocente={formData.tarifaHoraDocente}
                  campoConError={campoConError}
                  idPrefijo="screen-"
                  moneda={moneda}
                  onDocenteChange={(cambios) => {
                    setFormData(prev => ({
                      ...prev,
                      ...cambios
                    }));
                  }}
                  onClearError={(campo) => {
                    if (campoConError === campo) setCampoConError(null);
                  }}
                />

                {/* Planificación Curricular Avanzada: Horas por Tema, Total Horas, Metodología y Documento PDF */}
                <CurricularPlanningSection
                  cantidadTemas={formData.cantidadTemas}
                  horasClasePorTema={formData.horasClasePorTema}
                  totalHorasCurso={formData.horasClase}
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
                    if (campoConError === 'screen-input-docente') setCampoConError(null);
                  }}
                  campoConError={campoConError}
                  onNivelChange={(val, configNivel) => {
                    const cfg = configNivel || obtenerConfiguracionHorasPorNivel(val);
                    setFormData(prev => ({
                      ...prev,
                      nivel: val,
                      cantidadTemas: cfg.cantidadTemas,
                      horasClasePorTema: cfg.horasPorTema,
                      horasClase: cfg.totalHoras
                    }));
                    if (campoConError === 'select-nivel-curricular') setCampoConError(null);
                    if (campoConError === 'screen-input-horas-clase') setCampoConError(null);
                  }}
                  onCantidadTemasChange={(val) => {
                    setFormData(prev => ({ ...prev, cantidadTemas: val }));
                    if (campoConError === 'input-cantidad-temas') setCampoConError(null);
                  }}
                  onHorasClasePorTemaChange={(val) => {
                    setFormData(prev => ({ ...prev, horasClasePorTema: val }));
                    if (campoConError === 'input-horas-por-tema') setCampoConError(null);
                  }}
                  onTotalHorasCursoChange={(val) => {
                    setFormData(prev => ({ ...prev, horasClase: val }));
                    if (campoConError === 'input-total-horas-curso') setCampoConError(null);
                  }}
                  onMetodologiaChange={(val) => {
                    setFormData(prev => ({ ...prev, metodologia: val }));
                    if (campoConError === 'input-metodologia') setCampoConError(null);
                  }}
                  onPlanificacionPdfChange={(pdf) => setFormData(prev => ({ ...prev, planificacionPdf: pdf }))}
                />

                {/* Sección, Horarios y Días de Clase */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                    <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      Programación Académica (Sección, Horarios y Días)
                    </span>
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded">
                      Calendario
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-semibold text-slate-700">
                          Sección <span className="text-rose-500">*</span>
                        </label>
                        {campoConError === 'screen-input-seccion' && (
                          <span className="text-[9px] font-bold text-rose-600">Requerido</span>
                        )}
                      </div>
                      <select
                        id="screen-input-seccion"
                        value={formData.seccion}
                        onChange={(e) => {
                          setFormData({ ...formData, seccion: e.target.value });
                          if (campoConError === 'screen-input-seccion') setCampoConError(null);
                        }}
                        className={`w-full px-2.5 py-1.5 text-xs bg-white border rounded-lg font-medium transition-all ${
                          campoConError === 'screen-input-seccion'
                            ? 'border-rose-500 ring-2 ring-rose-200'
                            : 'border-slate-300'
                        }`}
                      >
                        <option value="Sección A">Sección A</option>
                        <option value="Sección B">Sección B</option>
                        <option value="Sección C">Sección C</option>
                        <option value="Fines de semana">Fines de semana</option>
                        <option value="Matutina">Matutina</option>
                        <option value="Vespertina">Vespertina</option>
                        <option value="Nocturna">Nocturna</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-semibold text-slate-700">
                          Horario de Clase <span className="text-rose-500">*</span>
                          <span className="text-[9px] font-normal text-slate-400 ml-1">(Llenar libre)</span>
                        </label>
                        {campoConError === 'screen-input-horario' && (
                          <span className="text-[9px] font-bold text-rose-600">Requerido</span>
                        )}
                      </div>
                      <input
                        id="screen-input-horario"
                        type="text"
                        placeholder="Ej: 06:00 PM - 08:00 PM / 08:00 AM - 12:00 PM"
                        value={formData.horario}
                        onChange={(e) => {
                          setFormData({ ...formData, horario: e.target.value });
                          if (campoConError === 'screen-input-horario') setCampoConError(null);
                        }}
                        className={`w-full px-2.5 py-1.5 text-xs bg-white border rounded-lg font-mono font-medium transition-all ${
                          campoConError === 'screen-input-horario'
                            ? 'border-rose-500 ring-2 ring-rose-200'
                            : 'border-slate-300'
                        }`}
                      />
                      <div className="flex flex-wrap gap-1 mt-1">
                        {['08:00 AM - 12:00 PM', '06:00 PM - 08:00 PM', '02:00 PM - 05:00 PM', '07:00 PM - 09:00 PM'].map((hor) => (
                          <button
                            key={hor}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, horario: hor });
                              if (campoConError === 'screen-input-horario') setCampoConError(null);
                            }}
                            className="text-[9px] px-1.5 py-0.5 bg-white text-slate-600 hover:text-blue-700 hover:border-blue-400 border border-slate-200 rounded font-mono truncate max-w-[120px]"
                            title={hor}
                          >
                            {hor}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-semibold text-slate-700">
                          Días de Clase <span className="text-rose-500">*</span>
                          <span className="text-[9px] font-normal text-slate-400 ml-1">(Llenar libre)</span>
                        </label>
                        {campoConError === 'screen-input-dias' && (
                          <span className="text-[9px] font-bold text-rose-600">Requerido</span>
                        )}
                      </div>
                      <input
                        id="screen-input-dias"
                        type="text"
                        placeholder="Ej: Sábados y Domingos / Lunes a Viernes"
                        value={formData.diasClase}
                        onChange={(e) => {
                          setFormData({ ...formData, diasClase: e.target.value });
                          if (campoConError === 'screen-input-dias') setCampoConError(null);
                        }}
                        className={`w-full px-2.5 py-1.5 text-xs bg-white border rounded-lg font-medium transition-all ${
                          campoConError === 'screen-input-dias'
                            ? 'border-rose-500 ring-2 ring-rose-200'
                            : 'border-slate-300'
                        }`}
                      />
                      <div className="flex flex-wrap gap-1 mt-1">
                        {['Fines de semana', 'Lun, Mié y Vie', 'Mar y Jue', 'Sábados', 'Lun a Jue'].map((dia) => (
                          <button
                            key={dia}
                            type="button"
                            onClick={() => {
                              setFormData({ 
                                ...formData, 
                                diasClase: dia === 'Fines de semana' 
                                  ? 'Sábados y Domingos (Fines de semana)' 
                                  : dia === 'Lun, Mié y Vie' 
                                  ? 'Lunes, Miércoles y Viernes' 
                                  : dia === 'Mar y Jue' 
                                  ? 'Martes y Jueves' 
                                  : dia === 'Lun a Jue' 
                                  ? 'Lunes a Jueves' 
                                  : 'Sábados' 
                              });
                              if (campoConError === 'screen-input-dias') setCampoConError(null);
                            }}
                            className="text-[9px] px-1.5 py-0.5 bg-white text-slate-600 hover:text-blue-700 hover:border-blue-400 border border-slate-200 rounded font-mono"
                          >
                            {dia}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fechas de Programación Curricular & Proyección de Venta */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                    <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      Cronograma & Proyección de Campaña (30 Días Hábiles)
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300">
                      ⚡ Cálculo Automático
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-semibold text-slate-700">
                          Fecha Programación / Inicio <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[10px] text-blue-600 font-medium">Inicio de clases</span>
                      </div>
                      <input
                        type="date"
                        required
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
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-medium focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-semibold text-slate-700">
                          Fecha de Venta / Fin <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          +30d Hábiles
                        </span>
                      </div>
                      <input
                        type="date"
                        required
                        value={formData.fechaVenta}
                        onChange={(e) => setFormData({ ...formData, fechaVenta: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-medium focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="bg-white p-2 rounded-lg border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-600">
                      💡 Proyección: <strong>{contarDiasHabilesEntreFechas(formData.fechaProgramacion, formData.fechaVenta)} días hábiles</strong> de captación y venta.
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const finAuto = sumarDiasHabiles(formData.fechaProgramacion, 30);
                          if (finAuto) setFormData({ ...formData, fechaVenta: finAuto });
                        }}
                        className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded font-semibold transition-colors"
                      >
                        +30d Hábiles (Auto)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const finCal = sumarDiasCalendario(formData.fechaProgramacion, 30);
                          if (finCal) setFormData({ ...formData, fechaVenta: finCal });
                        }}
                        className="text-[10px] px-2 py-0.5 bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded transition-colors"
                      >
                        +30d Calendario
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* 2. Estructura de Gastos Operativos (Académica) */}
            <div 
              id="seccion-costos-operativos"
              className={`p-5 rounded-xl border shadow-xs space-y-4 transition-all duration-200 ${
                calculoEnVivo.gastoTotalOperativo > umbralCritico
                  ? 'bg-rose-50/40 border-rose-300 ring-2 ring-rose-200/60'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  <span>2. Estructura de Gastos Operativos Base</span>
                </div>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                  calculoEnVivo.gastoTotalOperativo > umbralCritico
                    ? 'text-rose-900 bg-rose-100 border-rose-300'
                    : 'text-amber-900 bg-amber-50 border-amber-200'
                }`}>
                  Gasto Total: {formatearMoneda(calculoEnVivo.gastoTotalOperativo, moneda)}
                </span>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="screen-input-horas-clase" className="block text-xs font-semibold text-slate-700">
                      Horas de Clase Totales <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-bold text-blue-800 bg-blue-100 border border-blue-200 px-1.5 py-0.2 rounded inline-flex items-center gap-1">
                      ⚡ Nivel {formData.nivel || 'Básico'}: {formData.horasClase} hrs
                    </span>
                  </div>
                  <input
                    id="screen-input-horas-clase"
                    type="number"
                    min="1"
                    value={formData.horasClase}
                    onChange={(e) => {
                      setFormData({ ...formData, horasClase: Number(e.target.value) });
                      if (campoConError === 'screen-input-horas-clase') setCampoConError(null);
                    }}
                    className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg font-mono font-bold ${
                      campoConError === 'screen-input-horas-clase'
                        ? 'border-rose-500 ring-2 ring-rose-200'
                        : 'border-slate-300'
                    }`}
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Colocado automáticamente según el nivel académico seleccionado ({formData.nivel || 'Básico'}).
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
                    {campoConError === 'screen-input-tarifa-docente' && (
                      <span className="text-[9px] font-bold text-rose-600">Requerido (&gt; 0)</span>
                    )}
                  </div>
                  <input
                    id="screen-input-tarifa-docente"
                    type="number"
                    min="0"
                    step="10"
                    value={formData.tarifaHoraDocente}
                    onChange={(e) => {
                      setFormData({ ...formData, tarifaHoraDocente: Number(e.target.value) });
                      if (campoConError === 'screen-input-tarifa-docente') setCampoConError(null);
                    }}
                    className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg font-mono font-bold transition-all ${
                      campoConError === 'screen-input-tarifa-docente'
                        ? 'border-rose-500 ring-2 ring-rose-200'
                        : 'border-slate-300'
                    }`}
                  />
                  <span className="text-[10px] text-slate-500 flex items-center justify-between mt-0.5">
                    <span>Docente: {formData.nombreDocente || 'Sin asignar'}</span>
                    <strong className="text-emerald-700 font-bold font-mono">Honorarios: {formatearMoneda(calculoEnVivo.costoDocenteCalculado, moneda)}</strong>
                  </span>
                </div>
              </div>

              {/* Subsección: Costos Institucionales Fijos */}
              <div className="pt-2 border-t border-amber-200/60 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/80">
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
                          onClick={() => setFormData({ ...formData, costoZoom: 300, costoPapeleria: 100, gastosVarios: 100 })}
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

                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Costo Zoom ({moneda})
                    </label>
                    <input
                      type="number"
                      min="0"
                      readOnly={!costosFijosAutorizados}
                      disabled={!costosFijosAutorizados}
                      value={formData.costoZoom}
                      onChange={(e) => setFormData({ ...formData, costoZoom: Number(e.target.value) })}
                      className={`w-full px-3 py-1.5 text-xs rounded-lg font-mono font-bold ${
                        costosFijosAutorizados 
                          ? 'bg-white border-emerald-400 text-slate-900' 
                          : 'bg-slate-100 border-slate-300 text-slate-700 cursor-not-allowed'
                      } border`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Papelería ({moneda})
                    </label>
                    <input
                      type="number"
                      min="0"
                      readOnly={!costosFijosAutorizados}
                      disabled={!costosFijosAutorizados}
                      value={formData.costoPapeleria}
                      onChange={(e) => setFormData({ ...formData, costoPapeleria: Number(e.target.value) })}
                      className={`w-full px-3 py-1.5 text-xs rounded-lg font-mono font-bold ${
                        costosFijosAutorizados 
                          ? 'bg-white border-emerald-400 text-slate-900' 
                          : 'bg-slate-100 border-slate-300 text-slate-700 cursor-not-allowed'
                      } border`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Gastos Varios ({moneda})
                    </label>
                    <input
                      type="number"
                      min="0"
                      readOnly={!costosFijosAutorizados}
                      disabled={!costosFijosAutorizados}
                      value={formData.gastosVarios}
                      onChange={(e) => setFormData({ ...formData, gastosVarios: Number(e.target.value) })}
                      className={`w-full px-3 py-1.5 text-xs rounded-lg font-mono font-bold ${
                        costosFijosAutorizados 
                          ? 'bg-white border-emerald-400 text-slate-900' 
                          : 'bg-slate-100 border-slate-300 text-slate-700 cursor-not-allowed'
                      } border`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Margen Base & Régimen ISV */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  <span>3. Tratamiento Fiscal SAR & Margen Inicial</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  formData.aplicaISV 
                    ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}>
                  {formData.aplicaISV ? '✅ Grava ISV (15%)' : '❌ Exento de ISV'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clasificación del Servicio (Catálogo SAR Honduras)
                </label>
                <select
                  value={formData.servicioFiscal}
                  onChange={(e) => handleCambioServicioFiscal(e.target.value as TipoServicioFiscal)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {REGLAS_ISV_SERVICIOS.map((regla) => (
                    <option key={regla.servicio} value={regla.servicio}>
                      {regla.servicio} ({regla.gravaISV ? 'Grava 15%' : 'Exento'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Margen Operativo Objetivo (%)
                    </label>
                    <span className="text-xs font-bold font-mono text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                      {formData.margenGananciaOperativa}%
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {[40, 50, 70, 80, 100].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setFormData({ ...formData, margenGananciaOperativa: m })}
                        className={`px-2 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                          formData.margenGananciaOperativa === m
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                        }`}
                      >
                        {m}%
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-500">Pol&iacute;tica oficial: 40%, 50%, 70%, 80%, 100%</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alumnos Meta Inicial
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.alumnosProyectados}
                    onChange={(e) => setFormData({ ...formData, alumnosProyectados: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={onCancelar}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              
              <button
                id="btn-guardar-pantalla-proyecto"
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Registrar Proyecto y Trasladar a Comercialización (Paso 2) →</span>
              </button>
            </div>

          </div>

          {/* Columna Derecha: Panel de Previsualización Financiera y Fiscal en Vivo (5 columnas) */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900 text-white rounded-xl p-5 shadow-lg border border-slate-800 space-y-4 sticky top-20">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Proyección Financiera & Fiscal en Vivo
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  {moneda}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Gasto Total Operativo:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {formatearMoneda(calculoEnVivo.gastoTotalOperativo, moneda)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Venta Requerida Base ({calculoEnVivo.margenGananciaOperativa}%):</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {formatearMoneda(calculoEnVivo.precioVentaRequerido, moneda)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">15% ISV Total Curso (SAR):</span>
                  <span className="font-mono font-semibold text-amber-400">
                    {formatearMoneda(calculoEnVivo.isvVentaRequeridaTotal || 0, moneda)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-300 font-semibold">Total Facturación Bruta con ISV:</span>
                  <span className="font-mono font-bold text-emerald-300">
                    {formatearMoneda(calculoEnVivo.precioVentaRequeridoConISV || calculoEnVivo.precioVentaRequerido, moneda)}
                  </span>
                </div>
              </div>

              {/* Tarjeta Destacada de Facturación Ticket / Alumno */}
              <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider">
                    Estructura Ticket / Alumno
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    calculoEnVivo.aplicaISV ? 'bg-amber-900/60 text-amber-300 border border-amber-700' : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                  }`}>
                    {calculoEnVivo.aplicaISV ? 'ISV 15%' : 'Exento ISV'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Precio Neto (SUMMIT):</span>
                    <span className="font-mono font-bold text-sm text-slate-100">
                      {formatearMoneda(calculoEnVivo.precioSugeridoAlumno, moneda)}
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">ISV (15%):</span>
                    <span className="font-mono font-bold text-sm text-amber-400">
                      {formatearMoneda(calculoEnVivo.isvPorAlumno, moneda)}
                    </span>
                  </div>
                </div>

                <div className="bg-blue-950/70 border border-blue-800/80 rounded-lg p-3">
                  <div className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">
                    Precio Final al Alumno (con ISV):
                  </div>
                  <div className="text-2xl font-black text-blue-400 font-mono mt-0.5">
                    {formatearMoneda(calculoEnVivo.precioSugeridoConISV, moneda)}
                  </div>
                </div>
              </div>

              {/* Punto de Equilibrio y Estado */}
              <div className="bg-emerald-950/70 border border-emerald-700/80 rounded-xl p-4 text-emerald-100">
                <div className="text-[11px] font-bold uppercase tracking-wider">
                  Punto de Equilibrio
                </div>
                <div className="text-2xl font-black font-mono mt-0.5 text-emerald-300">
                  {calculoEnVivo.puntoEquilibrioAlumnos} alumnos
                </div>
                <p className="text-[10px] text-emerald-300/80 mt-1">
                  Mínimo de inscritos requerido para cubrir el 100% de los gastos operativos ({formatearMoneda(calculoEnVivo.gastoTotalOperativo, moneda)}).
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
          setProyectoRecienCreado(proyectoParaGuardarPendiente);
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
        esEdicion={false}
      />
    </div>
  );
};
