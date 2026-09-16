import React, { useState, useEffect, useMemo } from 'react';
import { Header, VistaPrincipal } from './components/Header';
import { ModifyProjectScreen } from './components/ModifyProjectScreen';
import { ProjectFormModal } from './components/ProjectFormModal';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { QuickSimulatorModal } from './components/QuickSimulatorModal';
import { ProjectExecutiveReportModal } from './components/ProjectExecutiveReportModal';
import { ReportsCenterModal } from './components/executive/ReportsCenterModal';
import { ExportMonthlyReportModal } from './components/executive/ExportMonthlyReportModal';
import { GerenciaGeneralView, SubPestanaGeneral } from './components/GerenciaGeneralView';
import { GerenciaAcademicaView, SubPestanaAcademica } from './components/GerenciaAcademicaView';
import { GerenciaComercializacionView } from './components/GerenciaComercializacionView';
import { NotificationsCenterModal } from './components/NotificationsCenterModal';
import { NotificationBannerToast } from './components/NotificationBannerToast';
import { ProyectoEducativo, Moneda, NotificacionGerencia } from './types';
import { PROYECTOS_INICIALES } from './utils/initialData';
import { calcularMetricasProyecto, formatearMoneda } from './utils/calculations';
import { exportarAExcel, exportarACSV, exportarProyectoPDF, exportarReporteMensualConsolidadoPDF } from './utils/exportUtils';
import { 
  obtenerClaveMesProyecto, 
  calcularResumenesMensuales, 
  formatearEtiquetaMes 
} from './utils/monthUtils';
import { 
  detectarCambiosProyecto, 
  crearEntradaHistorialCreacion, 
  crearEntradaHistorialManual 
} from './utils/historyUtils';
import { asegurarCorrelativos, asegurarCorrelativoUnico, generarSiguienteCorrelativo } from './utils/correlativoUtils';
import { 
  crearNotificacionNuevoProyecto, 
  crearNotificacionProyectoComercializado, 
  crearNotificacionDictamenGeneral,
  crearNotificacionSilaboGrabadoRevisionGG,
  crearNotificacionAprobacionGGAComercializacion,
  crearNotificacionRetornoGGAAcademica,
  cargarNotificacionesGuardadas,
  guardarNotificacionesStorage
} from './utils/notificationUtils';
import { reproducirAlertaSonoraRechazo } from './utils/audioAlertUtils';
import { enviarAlertaRechazoSilaboEmail } from './utils/gmailUtils';
import { useGoogleDriveAutoSync } from './utils/useGoogleDriveAutoSync';
import { GoogleDriveSyncBar } from './components/GoogleDriveSyncBar';
import { GoogleDriveSyncModal } from './components/GoogleDriveSyncModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { GoogleFormsModal } from './components/GoogleFormsModal';
import { GoogleMeetGerenciasModal } from './components/GoogleMeetGerenciasModal';
import { DirectorioGerenciasModal } from './components/DirectorioGerenciasModal';
import { POATableroControlModal } from './components/POATableroControlModal';
import { GerenciaGeneralAuthModal } from './components/GerenciaGeneralAuthModal';
import { SelectorPerfilGerenciaModal } from './components/auth/SelectorPerfilGerenciaModal';
import { PerfilGerencia, RolGerencia, getUsuarioActivo, setUsuarioActivo, PERFILES_GERENCIA } from './utils/authPorGerencia';
import { WorkflowStatusModal } from './components/WorkflowStatusModal';
import { CommercialProjectLauncherModal } from './components/commercial/CommercialProjectLauncherModal';
import { GlobalQuickOperationsModal } from './components/common/GlobalQuickOperationsModal';
import { WebPushNotificationModal } from './components/WebPushNotificationModal';
import { registrarServiceWorker, despacharAlertaCriticaWebPush } from './services/webPushService';
import { verificarPermisoModificacion } from './utils/gerenciaGeneralSecurity';
import { driveAuth } from './services/googleDriveService';
import { Footer } from './components/Footer';
import { ShieldAlert, ArrowRight, ShieldCheck, CalendarDays, X, Filter, FileDown } from 'lucide-react';

const STORAGE_KEY = 'matriz_rentabilidad_proyectos_poa2026_v5_manual';
const MONEDA_KEY = 'matriz_rentabilidad_moneda_v3';

export default function App() {
  const [proyectos, setProyectos] = useState<ProyectoEducativo[]>(() => {
    try {
      // Limpiar versiones anteriores y proyectos ficticios de prueba para arrancar de cero de forma manual
      const clavesObsoletas = [
        'matriz_rentabilidad_proyectos_poa2026_real',
        'matriz_rentabilidad_proyectos_v3_user',
        'matriz_rentabilidad_proyectos_v1',
        'matriz_rentabilidad_proyectos_v2',
        'proyectos_educativos_v1',
      ];
      clavesObsoletas.forEach((c) => {
        try {
          if (localStorage.getItem(c) !== null) {
            localStorage.removeItem(c);
          }
        } catch (_) {}
      });

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const calculados = parsed.map((p) => {
            const alumnosProy = Math.max(1, Number(p.alumnosProyectados) || 1);
            const alumnosFin = Math.max(1, Number(p.alumnosFinal) || 1);
            const margen = p.margenGananciaOperativa || 30;
            return calcularMetricasProyecto({
              ...p,
              alumnosProyectados: alumnosProy,
              alumnosFinal: alumnosFin,
              margenGananciaOperativa: margen,
            });
          });
          return asegurarCorrelativos(calculados);
        }
      }
    } catch (e) {
      console.error('Error al cargar datos guardados:', e);
    }
    // Estado inicial completamente limpio en blanco para ingresar proyectos de forma manual
    return [];
  });

  const [moneda, setMoneda] = useState<Moneda>(() => {
    try {
      const saved = localStorage.getItem(MONEDA_KEY);
      if (saved && ['LPS', 'USD', 'EUR', 'MXN'].includes(saved)) {
        return saved as Moneda;
      }
    } catch (e) {
      console.error(e);
    }
    return 'LPS';
  });

  const [vistaActual, setVistaActual] = useState<VistaPrincipal>('gerencia-academica');
  const [subPestanaGeneral, setSubPestanaGeneral] = useState<SubPestanaGeneral>('dashboard');
  const [subPestanaAcademica, setSubPestanaAcademica] = useState<SubPestanaAcademica>('proyectos_creados');
  const [mesFiltro, setMesFiltro] = useState<string>('todos');

  // Modales
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [proyectoAEditar, setProyectoAEditar] = useState<ProyectoEducativo | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<ProyectoEducativo | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [proyectoAEliminar, setProyectoAEliminar] = useState<ProyectoEducativo | null>(null);

  const [isSimulatorModalOpen, setIsSimulatorModalOpen] = useState(false);
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState(false);
  const [isGoogleFormsModalOpen, setIsGoogleFormsModalOpen] = useState(false);
  const [isGoogleMeetGerenciasModalOpen, setIsGoogleMeetGerenciasModalOpen] = useState(false);

  // Modal para Reporte Ejecutivo en PDF
  const [isPDFReportModalOpen, setIsPDFReportModalOpen] = useState(false);
  const [proyectoParaReportePDF, setProyectoParaReportePDF] = useState<ProyectoEducativo | null>(null);

  // Modal para Reporte Consolidado Mensual en PDF
  const [isExportMonthlyModalOpen, setIsExportMonthlyModalOpen] = useState(false);
  const [mesParaExportar, setMesParaExportar] = useState<string>('todos');

  const handleAbrirExportarMes = (mesKey?: string) => {
    const objetivo = mesKey || (mesFiltro !== 'todos' ? mesFiltro : 'todos');
    setMesParaExportar(objetivo);
    setIsExportMonthlyModalOpen(true);
  };

  const handleExportarMesPDFDirecto = async (mesKey: string) => {
    try {
      mostrarToast(`Generando reporte consolidado de ${formatearEtiquetaMes(mesKey)}...`);
      const res = await exportarReporteMensualConsolidadoPDF({
        mesKey,
        proyectos,
        moneda,
        incluirGraficos: true,
        guardarEnDrive: driveSync.isAuthenticated,
      });
      mostrarToast(`✅ Reporte consolidado de ${res.etiquetaMes} generado.${res.guardadoEnDrive ? ' Copia en Drive.' : ''}`);
    } catch (err: any) {
      console.error('Error generando reporte mensual:', err);
      mostrarToast(`Error al exportar: ${err.message || 'Error desconocido'}`);
    }
  };

  // Centro de Reportes por Gerencia con Auto-Guardado en Google Drive
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [reportsModalGerenciaInicial, setReportsModalGerenciaInicial] = useState<
    'Gerencia General' | 'Gerencia Académica' | 'Gerencia de Comercialización' | 'Auditoría Interna' | 'Historial' | 'Visualizador Margenes' | 'Tendencia Docente' | 'Comparador Proyectos' | 'Optimizador Fiscal' | 'Proyección de Crecimiento'
  >('Gerencia General');

  const handleAbrirCentroReportes = (
    gerenciaInicial?: 'Gerencia General' | 'Gerencia Académica' | 'Gerencia de Comercialización' | 'Auditoría Interna' | 'Historial' | 'Visualizador Margenes' | 'Tendencia Docente' | 'Comparador Proyectos' | 'Optimizador Fiscal' | 'Proyección de Crecimiento'
  ) => {
    if (gerenciaInicial) {
      setReportsModalGerenciaInicial(gerenciaInicial);
    } else {
      if (vistaActual === 'gerencia-academica') {
        setReportsModalGerenciaInicial('Gerencia Académica');
      } else if (vistaActual === 'gerencia-comercializacion') {
        setReportsModalGerenciaInicial('Gerencia de Comercialización');
      } else if (vistaActual === 'control' || (vistaActual === 'gerencia-general' && subPestanaGeneral === 'auditor_interno')) {
        setReportsModalGerenciaInicial('Auditoría Interna');
      } else {
        setReportsModalGerenciaInicial('Gerencia General');
      }
    }
    setIsReportsModalOpen(true);
  };

  // Centro de Notificaciones y Alerta Flotante
  const [notificaciones, setNotificaciones] = useState<NotificacionGerencia[]>(() => {
    return cargarNotificacionesGuardadas();
  });
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [notificacionActivaBanner, setNotificacionActivaBanner] = useState<NotificacionGerencia | null>(null);

  // Notificación toast o status
  const [mensajeToast, setMensajeToast] = useState<string | null>(null);

  const mostrarToast = (msg: string) => {
    setMensajeToast(msg);
    setTimeout(() => {
      setMensajeToast(null);
    }, 3500);
  };

  // Sincronización Automática en Google Drive
  const driveSync = useGoogleDriveAutoSync(proyectos, moneda, notificaciones, (msg) => {
    mostrarToast(msg);
  });
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);

  // Directorio y Credenciales Oficiales de Gerencias
  const [isDirectorioGerenciasModalOpen, setIsDirectorioGerenciasModalOpen] = useState(false);

  // Modal Centralizado Unificado: Comercializar Sílabo / Proyecto (Todas las Gerencias)
  const [isComercializarModalOpen, setIsComercializarModalOpen] = useState(false);
  const [proyectoIdParaComercializar, setProyectoIdParaComercializar] = useState<string | undefined>(undefined);

  const handleAbrirComercializarProyecto = (proyectoId?: string) => {
    setProyectoIdParaComercializar(proyectoId);
    setIsComercializarModalOpen(true);
  };

  // Tablero Directivo POA SEP - DIC 2026 & Cuadro de Mando Integral
  const [isPOAModalOpen, setIsPOAModalOpen] = useState(false);

  // Rastreador de Flujo, Nivel y Cumplimiento de Proyectos Inter-Gerencial
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [workflowProyectoId, setWorkflowProyectoId] = useState<string | undefined>(undefined);

  const handleAbrirWorkflowModal = (proyectoId?: string) => {
    setWorkflowProyectoId(proyectoId);
    setIsWorkflowModalOpen(true);
  };

  // Modal Centro de Operación Rápida 1 Clic (Todas las Gerencias)
  const [isGlobalQuickOperationsModalOpen, setIsGlobalQuickOperationsModalOpen] = useState(false);

  // Modal Sistema de Notificaciones Web Push de Navegador (Segundo Plano)
  const [isWebPushModalOpen, setIsWebPushModalOpen] = useState(false);

  // Seguridad y Perfiles de Usuario por Gerencia (Opción A: Selector de Roles + PIN)
  const [usuarioActivo, setUsuarioActivoState] = useState<PerfilGerencia>(() => getUsuarioActivo());
  const [isSelectorPerfilModalOpen, setIsSelectorPerfilModalOpen] = useState(false);
  const [rolSugeridoModal, setRolSugeridoModal] = useState<RolGerencia | undefined>(undefined);

  useEffect(() => {
    const handleAuthChange = (e: any) => {
      if (e.detail?.rol && PERFILES_GERENCIA[e.detail.rol as RolGerencia]) {
        setUsuarioActivoState(PERFILES_GERENCIA[e.detail.rol as RolGerencia]);
      }
    };
    window.addEventListener('summit-auth-usuario-cambio', handleAuthChange);
    return () => window.removeEventListener('summit-auth-usuario-cambio', handleAuthChange);
  }, []);

  const handleCambiarPerfilUsuario = (nuevoPerfil: PerfilGerencia) => {
    setUsuarioActivoState(nuevoPerfil);
    if (nuevoPerfil.id === 'gerencia-academica') {
      setVistaActual('gerencia-academica');
    } else if (nuevoPerfil.id === 'gerencia-comercializacion') {
      setVistaActual('gerencia-comercializacion');
    } else if (nuevoPerfil.id === 'gerencia-general') {
      setVistaActual('gerencia-general');
    } else if (nuevoPerfil.id === 'auditor-interno') {
      setVistaActual('gerencia-general');
      setSubPestanaGeneral('auditor_interno');
    }
    mostrarToast(`Sesión activa: ${nuevoPerfil.nombre} (${nuevoPerfil.titular})`);
    
    if (pendingActionCallback && nuevoPerfil.id === 'gerencia-general') {
      const cb = pendingActionCallback;
      setPendingActionCallback(null);
      setTimeout(() => cb(), 150);
    }
  };

  // Parámetro de Seguridad Estricta: Solo la Gerencia General puede realizar cambios de cualquier índole
  const [isGGAuthModalOpen, setIsGGAuthModalOpen] = useState(false);
  const [ggAuthAccionDesc, setGgAuthAccionDesc] = useState('realizar modificaciones en el sistema');
  const [pendingActionCallback, setPendingActionCallback] = useState<(() => void) | null>(null);

  const ejecutarConSeguridadGG = (accion: () => void, accionDesc: string = 'realizar cambios en el sistema') => {
    if (usuarioActivo.id === 'gerencia-general') {
      accion();
      return;
    }
    const usuarioEmail = driveAuth.currentUser?.email;
    const chequeo = verificarPermisoModificacion(usuarioEmail);
    if (chequeo.permitido) {
      accion();
    } else {
      setGgAuthAccionDesc(accionDesc);
      setPendingActionCallback(() => accion);
      setRolSugeridoModal('gerencia-general');
      setIsSelectorPerfilModalOpen(true);
    }
  };

  // Guardar notificaciones en localStorage
  useEffect(() => {
    guardarNotificacionesStorage(notificaciones);
  }, [notificaciones]);

  const handleMarcarNotificacionLeida = (id: string) => {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    );
  };

  const handleMarcarTodasLeidas = () => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    mostrarToast('Todas las notificaciones marcadas como leídas');
  };

  const handleLimpiarNotificaciones = () => {
    setNotificaciones([]);
    guardarNotificacionesStorage([]);
    mostrarToast('Historial de notificaciones vaciado');
  };

  const handleEjecutarAccionNotificacion = (vista: VistaPrincipal, proyectoId?: string) => {
    if (['control', 'tabla', 'tarjetas', 'meses', 'analitica', 'isv', 'guia'].includes(vista)) {
      setVistaActual('gerencia-general');
      if (vista === 'control') setSubPestanaGeneral('control');
      else if (vista === 'tabla') setSubPestanaGeneral('matriz');
      else if (vista === 'tarjetas') setSubPestanaGeneral('tarjetas');
      else if (vista === 'meses') setSubPestanaGeneral('meses');
      else if (vista === 'analitica') setSubPestanaGeneral('analitica');
      else if (vista === 'isv') setSubPestanaGeneral('isv');
      else if (vista === 'guia') setSubPestanaGeneral('guia');
    } else {
      setVistaActual(vista);
    }
    if (proyectoId) {
      const p = proyectos.find((item) => item.id === proyectoId);
      if (p) {
        setProyectoSeleccionado(p);
      }
    }
  };

  // Inicializar Service Worker de Web Push y escuchar navegación por clics en alertas
  useEffect(() => {
    registrarServiceWorker();

    const handleSwMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'WEB_PUSH_NAVIGATE') {
        const { vista, proyectoId } = event.data;
        if (vista) {
          handleEjecutarAccionNotificacion(vista, proyectoId);
        }
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
    }
    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      }
    };
  }, [proyectos]);

  // Lista de meses disponibles y filtro activo
  const listaMesesDisponibles = useMemo(() => {
    const resumenes = calcularResumenesMensuales(proyectos);
    return resumenes.map((r) => ({ mesKey: r.mesKey, etiqueta: r.etiquetaMes }));
  }, [proyectos]);

  const proyectosVisibles = useMemo(() => {
    if (mesFiltro === 'todos') return proyectos;
    return proyectos.filter((p) => obtenerClaveMesProyecto(p) === mesFiltro);
  }, [proyectos, mesFiltro]);

  // Proyectos críticos con riesgo de pérdida (basados en los visibles)
  const proyectosCriticos = proyectosVisibles.filter((p) => p.alumnosFinal < p.puntoEquilibrioAlumnos);
  const perdidaPotencial = proyectosCriticos.reduce((acc, p) => acc + Math.abs(p.totalGananciasFinales), 0);

  // Guardar en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(proyectos));
    } catch (e) {
      console.error('Error guardando en localStorage:', e);
    }
  }, [proyectos]);

  useEffect(() => {
    try {
      localStorage.setItem(MONEDA_KEY, moneda);
    } catch (e) {
      console.error('Error guardando moneda:', e);
    }
  }, [moneda]);

  // Handlers CRUD
  const handleNuevoProyecto = () => {
    // Habilitado libremente para que Gerencia Académica llene nuevos proyectos educativos sin restricciones de seguridad
    setProyectoAEditar(null);
    setIsFormModalOpen(true);
  };

  const handleEditarProyecto = (p: ProyectoEducativo) => {
    ejecutarConSeguridadGG(() => {
      setProyectoAEditar(p);
      setIsFormModalOpen(true);
    }, `modificar el proyecto "${p.nombreProyecto}"`);
  };

  const handleVerDetalle = (p: ProyectoEducativo) => {
    setProyectoSeleccionado(p);
    setIsDetailModalOpen(true);
  };

  const handleSolicitarEliminar = (p: ProyectoEducativo) => {
    // Si la acción se originó en Gerencia Académica o el proyecto fue creado por Académica,
    // se abre el modal de confirmación de eliminación directamente sin requerir PIN de GG
    if (vistaActual === 'gerencia-academica' || p.gerenciaOrigen === 'gerencia-academica' || p.creadoPorGerencia === 'gerencia-academica') {
      setProyectoAEliminar(p);
      setIsDeleteModalOpen(true);
      return;
    }

    ejecutarConSeguridadGG(() => {
      setProyectoAEliminar(p);
      setIsDeleteModalOpen(true);
    }, `eliminar el proyecto "${p.nombreProyecto}"`);
  };

  const handleSolicitarEliminarPorId = (id: string) => {
    const p = proyectos.find(item => item.id === id);
    if (p) {
      handleSolicitarEliminar(p);
    }
  };

  const handleConfirmarEliminar = (id: string) => {
    setProyectos((prev) => prev.filter((p) => p.id !== id));
    mostrarToast('Proyecto eliminado de la matriz institucional');
  };

  const handleEliminarMultiples = (ids: string[]) => {
    setProyectos((prev) => prev.filter((p) => !ids.includes(p.id)));
    mostrarToast(`${ids.length} proyectos eliminados de la matriz`);
  };

  const ejecutarGuardadoInterno = (proyectoGuardado: ProyectoEducativo, origenVista?: string) => {
    const ahora = new Date();
    const horaActualFormateada = ahora.toLocaleTimeString('es-HN', {
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

    setProyectos((prev) => {
      // Garantizar que siempre tenga los correlativos automáticos de Empresa y SAR
      const proyectoConCorrelativos = asegurarCorrelativoUnico(proyectoGuardado, prev);

      const index = prev.findIndex((p) => p.id === proyectoConCorrelativos.id);
      if (index >= 0) {
        const proyectoAnterior = prev[index];
        const nuevoCambio = detectarCambiosProyecto(proyectoAnterior, proyectoConCorrelativos);
        
        let historialActualizado = [...(proyectoAnterior.historialCambios || [])];
        if (nuevoCambio) {
          historialActualizado = [nuevoCambio, ...historialActualizado];
        }

        const proyectoConHistorial: ProyectoEducativo = {
          ...proyectoConCorrelativos,
          horaUltimaModificacion: horaActualFormateada,
          historialCambios: historialActualizado,
        };

        const actualizados = [...prev];
        actualizados[index] = proyectoConHistorial;

        // 0. Detectar si Gerencia General rechazó el sílabo y lo retorna a Gerencia Académica
        const esRechazadoPorGG = 
          (proyectoConHistorial.etapaFlujo === 'rechazado_gerencia_general' && proyectoAnterior.etapaFlujo !== 'rechazado_gerencia_general') ||
          (proyectoConHistorial.rechazadoPorGerenciaGeneral && !proyectoAnterior.rechazadoPorGerenciaGeneral);

        // 1. Detectar si Gerencia General aprobó el sílabo y lo traslada a Comercialización
        const pasaAComercializacionDesdeGG = 
          (proyectoConHistorial.aprobadoGerenciaGeneral && !proyectoAnterior.aprobadoGerenciaGeneral) ||
          (proyectoConHistorial.etapaFlujo === 'comercializacion' && proyectoAnterior.etapaFlujo === 'revision_gerencia_general');

        // 2. Detectar si fue grabado desde Sílabo / Gerencia Académica y enviado a Gerencia General
        const esGrabacionAcademica = 
          (origenVista === 'silabo' || origenVista === 'gerencia-academica') &&
          (proyectoConHistorial.etapaFlujo === 'revision_gerencia_general' || !proyectoAnterior.autorizacionAcademica);

        // 3. Detectar si fue trabajado en Gerencia de Comercialización
        const esTrabajoComercial = 
          (proyectoConHistorial.comercializacionCompletada && !proyectoAnterior.comercializacionCompletada) ||
          origenVista === 'gerencia-comercializacion' ||
          vistaActual === 'gerencia-comercializacion';

        if (esRechazadoPorGG) {
          const motivo = proyectoConHistorial.motivoRechazoGerenciaGeneral || 'La Gerencia General determinó ajustes obligatorios en costos o estructura.';
          const { notificacion: notifRechazo, aviso } = crearNotificacionRetornoGGAAcademica(
            proyectoConHistorial,
            motivo
          );
          const avisosPrevios = proyectoConHistorial.avisosProyecto || [];
          proyectoConHistorial.avisosProyecto = [aviso, ...avisosPrevios];

          setNotificaciones((prevNotifs) => [notifRechazo, ...prevNotifs]);
          setNotificacionActivaBanner(notifRechazo);

          // Emitir alerta acústica ejecutiva
          reproducirAlertaSonoraRechazo();

          // Despacho de Notificación Nativa Web Push a Navegador / Sistema Operativo (Segundo Plano)
          despacharAlertaCriticaWebPush({
            tipo: 'rechazo_gg',
            titulo: `🚨 RETORNO URGENTE A GERENCIA ACADÉMICA (${proyectoConHistorial.codigoProyecto || 'SIG-ACAD'})`,
            cuerpo: `Gerencia General retornó "${proyectoConHistorial.nombreProyecto}" para corrección financiera obligatoria: ${motivo}`,
            gerenciaDestino: 'gerencia-academica',
            gerenciaOrigen: 'gerencia-general',
            proyectoId: proyectoConHistorial.id,
            codigoEmpresa: proyectoConHistorial.codigoProyecto,
            correlativoSAR: proyectoConHistorial.correlativoSAR,
            nombreProyecto: proyectoConHistorial.nombreProyecto,
            vistaDestino: 'gerencia-academica',
            accionEtiqueta: 'Corregir Sílabo en Académica ↗',
          });

          // Despacho proactivo de correo electrónico (Gmail API con fallback mailto)
          enviarAlertaRechazoSilaboEmail(proyectoConHistorial, motivo, moneda)
            .then((res) => {
              if (res.success && !res.simulado) {
                mostrarToast(`📧 Alerta de correo enviada a Gerencia Académica (${res.destinatarios.join(', ')})`);
              }
            })
            .catch((err) => console.error('Error al despachar alerta email:', err));

          mostrarToast(`🚨 Sílabo rechazado y devuelto a Gerencia Académica. Alerta proactiva y correo notificados.`);
        } else if (pasaAComercializacionDesdeGG) {
          const { notificacion: notifCom, aviso } = crearNotificacionAprobacionGGAComercializacion(
            proyectoConHistorial,
            proyectoConHistorial.observacionesGerenciaGeneral
          );
          const avisosPrevios = proyectoConHistorial.avisosProyecto || [];
          proyectoConHistorial.avisosProyecto = [aviso, ...avisosPrevios];
          setNotificaciones((prevNotifs) => [notifCom, ...prevNotifs]);
          setNotificacionActivaBanner(notifCom);

          // Despacho de Notificación Nativa Web Push a Gerencia de Comercialización
          despacharAlertaCriticaWebPush({
            tipo: 'aprobacion_gg',
            titulo: `🟢 PROYECTO APROBADO ➔ COMERCIALIZACIÓN (${proyectoConHistorial.codigoProyecto || 'SIG-ACAD'})`,
            cuerpo: `Gerencia General auditó y aprobó "${proyectoConHistorial.nombreProyecto}". Habilitado para inicio de pauta publicitaria y captación de alumnos.`,
            gerenciaDestino: 'gerencia-comercializacion',
            gerenciaOrigen: 'gerencia-general',
            proyectoId: proyectoConHistorial.id,
            codigoEmpresa: proyectoConHistorial.codigoProyecto,
            correlativoSAR: proyectoConHistorial.correlativoSAR,
            nombreProyecto: proyectoConHistorial.nombreProyecto,
            vistaDestino: 'gerencia-comercializacion',
            accionEtiqueta: 'Abrir en Comercialización ↗',
          });

          mostrarToast(`¡Sílabo aprobado por Gerencia General! Remitido a Gerencia de Comercialización para inicio de captación.`);
        } else if (esGrabacionAcademica) {
          const { notificacion: notifGG, aviso } = crearNotificacionSilaboGrabadoRevisionGG(proyectoConHistorial);
          const avisosPrevios = proyectoConHistorial.avisosProyecto || [];
          proyectoConHistorial.avisosProyecto = [aviso, ...avisosPrevios];
          setNotificaciones((prevNotifs) => [notifGG, ...prevNotifs]);
          setNotificacionActivaBanner(notifGG);

          // Despacho Web Push a Gerencia General
          despacharAlertaCriticaWebPush({
            tipo: 'nuevo_silabo',
            titulo: `📘 NUEVO SÍLABO PARA DICTAMEN GG (${proyectoConHistorial.codigoProyecto || 'SIG-ACAD'})`,
            cuerpo: `Gerencia Académica concluyó el Sílabo Oficial de "${proyectoConHistorial.nombreProyecto}". Remitido a Gerencia General para su revisión y dictamen.`,
            gerenciaDestino: 'gerencia-general',
            gerenciaOrigen: 'gerencia-academica',
            proyectoId: proyectoConHistorial.id,
            codigoEmpresa: proyectoConHistorial.codigoProyecto,
            correlativoSAR: proyectoConHistorial.correlativoSAR,
            nombreProyecto: proyectoConHistorial.nombreProyecto,
            vistaDestino: 'gerencia-general',
            accionEtiqueta: 'Revisar en Gerencia General ↗',
          });

          mostrarToast(`Sílabo oficial grabado (${proyectoConHistorial.codigoProyecto} / SAR: ${proyectoConHistorial.correlativoSAR}). Remitido a Gerencia General.`);
        } else if (esTrabajoComercial) {
          const notifGen = crearNotificacionProyectoComercializado(proyectoConHistorial);
          setNotificaciones((prevNotifs) => [notifGen, ...prevNotifs]);
          setNotificacionActivaBanner(notifGen);
          mostrarToast(`Estrategia comercial guardada a las ${horaActualFormateada}. Notificación enviada a Gerencia General.`);
        } else if (proyectoConHistorial.seLlevoACabo === 'Listo' && proyectoAnterior.seLlevoACabo !== 'Listo') {
          const notifDictamen = crearNotificacionDictamenGeneral(proyectoConHistorial, true);
          setNotificaciones((prevNotifs) => [notifDictamen, ...prevNotifs]);
          setNotificacionActivaBanner(notifDictamen);

          despacharAlertaCriticaWebPush({
            tipo: 'cambio_estado',
            titulo: `✅ DICTAMEN FAVORABLE: PROYECTO LISTO (${proyectoConHistorial.codigoProyecto || 'SIG-ACAD'})`,
            cuerpo: `"${proyectoConHistorial.nombreProyecto}" ha recibido Dictamen 'Listo'. Rebaja POA aplicada y viabilidad completada.`,
            gerenciaDestino: 'todas',
            gerenciaOrigen: 'gerencia-general',
            proyectoId: proyectoConHistorial.id,
            codigoEmpresa: proyectoConHistorial.codigoProyecto,
            correlativoSAR: proyectoConHistorial.correlativoSAR,
            nombreProyecto: proyectoConHistorial.nombreProyecto,
            estadoNuevo: 'Listo',
            vistaDestino: 'gerencia-general',
          });

          mostrarToast(`Dictamen 'Listo' registrado a las ${horaActualFormateada}. Rebaja POA aplicada.`);
        } else if (
          (proyectoConHistorial.seLlevoACabo === 'Cancelado' || proyectoConHistorial.seLlevoACabo === 'Denegado') &&
          proyectoAnterior.seLlevoACabo !== proyectoConHistorial.seLlevoACabo
        ) {
          despacharAlertaCriticaWebPush({
            tipo: 'cambio_estado',
            titulo: `⚠️ ESTADO CRÍTICO: PROYECTO ${proyectoConHistorial.seLlevoACabo.toUpperCase()} (${proyectoConHistorial.codigoProyecto || 'SIG-ACAD'})`,
            cuerpo: `"${proyectoConHistorial.nombreProyecto}" ha sido marcado como ${proyectoConHistorial.seLlevoACabo}.`,
            gerenciaDestino: 'todas',
            gerenciaOrigen: 'gerencia-general',
            proyectoId: proyectoConHistorial.id,
            codigoEmpresa: proyectoConHistorial.codigoProyecto,
            correlativoSAR: proyectoConHistorial.correlativoSAR,
            nombreProyecto: proyectoConHistorial.nombreProyecto,
            estadoNuevo: proyectoConHistorial.seLlevoACabo,
            vistaDestino: 'gerencia-general',
          });
          mostrarToast(`Proyecto marcado como ${proyectoConHistorial.seLlevoACabo}.`);
        } else {
          mostrarToast(`Proyecto actualizado a las ${horaActualFormateada}`);
        }

        return actualizados;
      } else {
        // En el nuevo flujo institucional: El Sílabo ES el Proyecto Oficial
        // Se registra de manera automática con numeración para la Empresa y para la SAR,
        // y se remite a Gerencia General para su revisión y dictamen de aprobación previa a Comercialización.
        const entradaCreacion = crearEntradaHistorialCreacion(proyectoConCorrelativos);

        const proyectoConHistorial: ProyectoEducativo = {
          ...proyectoConCorrelativos,
          fechaCreacion: proyectoConCorrelativos.fechaCreacion || ahora.toISOString(),
          horaCreacion: proyectoConCorrelativos.horaCreacion || horaActualFormateada,
          fechaHoraGrabacion: proyectoConCorrelativos.fechaHoraGrabacion || fechaHoraCompleta,
          horaUltimaModificacion: horaActualFormateada,
          etapaFlujo: proyectoConCorrelativos.etapaFlujo || 'revision_gerencia_general',
          seLlevoACabo: proyectoConCorrelativos.seLlevoACabo || 'Planificado',
          historialCambios: [entradaCreacion, ...(proyectoConCorrelativos.historialCambios || [])],
        };

        // Generar notificación oficial por correo a Gerencia General, Comercialización y Académica
        const { notificacion: notifGG, aviso } = crearNotificacionSilaboGrabadoRevisionGG(proyectoConHistorial);
        const avisosPrevios = proyectoConHistorial.avisosProyecto || [];
        proyectoConHistorial.avisosProyecto = [aviso, ...avisosPrevios];

        setNotificaciones((prevNotifs) => [notifGG, ...prevNotifs]);
        setNotificacionActivaBanner(notifGG);

        // Despacho Web Push a Gerencia General por nuevo proyecto
        despacharAlertaCriticaWebPush({
          tipo: 'nuevo_silabo',
          titulo: `📘 NUEVO SÍLABO OFICIAL GRABADO (${proyectoConCorrelativos.codigoProyecto || 'SIG-ACAD'})`,
          cuerpo: `Nuevo Sílabo Oficial "${proyectoConCorrelativos.nombreProyecto}" registrado. Remitido a Gerencia General para su revisión y dictamen.`,
          gerenciaDestino: 'gerencia-general',
          gerenciaOrigen: 'gerencia-academica',
          proyectoId: proyectoConHistorial.id,
          codigoEmpresa: proyectoConCorrelativos.codigoProyecto,
          correlativoSAR: proyectoConCorrelativos.correlativoSAR,
          nombreProyecto: proyectoConCorrelativos.nombreProyecto,
          vistaDestino: 'gerencia-general',
          accionEtiqueta: 'Revisar en Gerencia General ↗',
        });

        mostrarToast(`Sílabo Oficial "${proyectoConCorrelativos.nombreProyecto}" grabado (Empresa: ${proyectoConCorrelativos.codigoProyecto || 'SIG-ACAD'} | SAR: ${proyectoConCorrelativos.correlativoSAR}). Remitido a Gerencia General.`);
        return [proyectoConHistorial, ...prev];
      }
    });
  };

  const handleGuardarProyecto = (proyectoGuardado: ProyectoEducativo, origenVista?: string) => {
    // Si es nuevo proyecto o procede de Gerencia Académica, se guarda de forma directa sin barreras de seguridad
    const esNuevo = !proyectos.some((p) => p.id === proyectoGuardado.id);
    if (esNuevo || origenVista === 'gerencia-academica' || vistaActual === 'gerencia-academica') {
      ejecutarGuardadoInterno(proyectoGuardado, origenVista);
      return;
    }

    ejecutarConSeguridadGG(() => {
      ejecutarGuardadoInterno(proyectoGuardado, origenVista);
    }, `guardar los cambios en el proyecto "${proyectoGuardado.nombreProyecto}"`);
  };

  const handleGuardarDesdePantalla = (proyecto: ProyectoEducativo) => {
    handleGuardarProyecto(proyecto);
  };

  const handleDuplicarProyecto = (p: ProyectoEducativo) => {
    ejecutarConSeguridadGG(() => {
      const nuevoProyectoBase = {
        ...p,
        id: Date.now().toString(),
        nombreProyecto: `${p.nombreProyecto} (Copia)`,
        seLlevoACabo: 'Planificado' as const,
      };
      const entradaCreacion = crearEntradaHistorialCreacion(
        calcularMetricasProyecto(nuevoProyectoBase),
        'Duplicado por Administrador'
      );
      const duplicado = calcularMetricasProyecto({
        ...nuevoProyectoBase,
        historialCambios: [entradaCreacion],
      });
      setProyectos((prev) => [duplicado, ...prev]);
      mostrarToast(`Proyecto duplicado: ${duplicado.nombreProyecto}`);
    }, `duplicar el proyecto "${p.nombreProyecto}"`);
  };

  const handleActualizarRapido = (id: string, campo: keyof ProyectoEducativo, valor: any) => {
    ejecutarConSeguridadGG(() => {
      setProyectos((prev) =>
        prev.map((p) => {
          if (p.id === id) {
            const modificado = calcularMetricasProyecto({ ...p, [campo]: valor });
            const nuevoCambio = detectarCambiosProyecto(p, modificado);
            
            let historialActualizado = [...(p.historialCambios || [])];
            if (nuevoCambio) {
              historialActualizado = [nuevoCambio, ...historialActualizado];
            }

            return {
              ...modificado,
              historialCambios: historialActualizado,
            };
          }
          return p;
        })
      );
    }, `actualizar el campo ${String(campo)} del proyecto`);
  };

  const handleAgregarEntradaHistorial = (proyectoId: string, entrada: any) => {
    setProyectos((prev) =>
      prev.map((p) => {
        if (p.id === proyectoId) {
          const historialActualizado = [entrada, ...(p.historialCambios || [])];
          return {
            ...p,
            historialCambios: historialActualizado,
          };
        }
        return p;
      })
    );
    mostrarToast('Nota de auditoría registrada en el historial');
  };

  const handleVaciarDatos = () => {
    ejecutarConSeguridadGG(() => {
      const confirmar = window.confirm('¿Estás seguro de que deseas vaciar todos los proyectos? La matriz quedará lista en ceros para alimentar los datos reales del POA 2026 por cada gerencia.');
      if (confirmar) {
        setProyectos([]);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        } catch (e) {
          console.error(e);
        }
        mostrarToast('Matriz de proyectos vaciada. Lista para comenzar a registrar datos reales del POA 2026.');
      }
    }, 'vaciar todos los datos de la matriz institucional');
  };

  const handleCargarPlantilla = () => {
    ejecutarConSeguridadGG(() => {
      const confirmar = window.confirm('¿Deseas reiniciar la matriz a ceros para el POA 2026?');
      if (confirmar) {
        setProyectos([]);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        } catch (e) {
          console.error(e);
        }
        mostrarToast('Matriz reiniciada en blanco para alimentar con valores reales del POA 2026.');
      }
    }, 'reiniciar la matriz para el POA 2026');
  };

  const handleCrearDesdeSimulador = (datos: Partial<ProyectoEducativo>) => {
    ejecutarConSeguridadGG(() => {
      const siguiente = generarSiguienteCorrelativo(proyectos, datos.tipoProyecto || 'CURSO', 2026);
      const nuevo = calcularMetricasProyecto({
        id: datos.id || Date.now().toString(),
        numeroCorrelativo: datos.numeroCorrelativo || siguiente.numeroCorrelativo,
        codigoPrograma: datos.codigoPrograma || siguiente.codigoPrograma,
        codigoFiscalSAR: datos.codigoFiscalSAR || siguiente.codigoFiscalSAR,
        nombreProyecto: datos.nombreProyecto || 'Nuevo Proyecto Educativo',
        objetivoGeneral: datos.objetivoGeneral || '',
        nombreDocente: datos.nombreDocente || 'Walter Pedroza',
        tipoProyecto: datos.tipoProyecto || 'CURSO',
        nivel: datos.nivel || 'Básico',
        servicioFiscal: datos.servicioFiscal || 'Servicios educativos no acreditados (talleres, cursos libres)',
        aplicaISV: datos.aplicaISV !== undefined ? datos.aplicaISV : true,
      fechaProgramacion: datos.fechaProgramacion || new Date().toISOString().slice(0, 10),
      fechaVenta: datos.fechaVenta || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      horasClase: datos.horasClase ?? 20,
      tarifaHoraDocente: datos.tarifaHoraDocente ?? 200,
      costoDocenteManual: datos.costoDocenteManual,
      costoZoom: datos.costoZoom ?? 300,
      costoPapeleria: datos.costoPapeleria ?? 100,
      gastosVarios: datos.gastosVarios ?? 100,
      margenGananciaOperativa: datos.margenGananciaOperativa ?? 30,
      alumnosProyectados: datos.alumnosProyectados ?? 4,
      alumnosFinal: datos.alumnosFinal ?? 4,
      metodoVenta: datos.metodoVenta || 'Redes sociales',
      seLlevoACabo: datos.seLlevoACabo || 'Planificado',
      observaciones: datos.observaciones || 'Generado desde el Simulador Integral de Proyectos',
    });

    handleGuardarProyecto(nuevo);
    mostrarToast(`¡Proyecto #${String(nuevo.numeroCorrelativo).padStart(3, '0')} registrado con correlativo automático!`);
    }, 'crear un nuevo proyecto desde el simulador');
  };

  const handleExportarExcel = () => {
    exportarAExcel(proyectos, moneda);
    mostrarToast('Archivo Excel descargado');
  };

  const handleExportarCSV = () => {
    exportarACSV(proyectos);
    mostrarToast('Archivo CSV descargado');
  };

  const handleImprimir = () => {
    window.print();
  };

  const handleAbrirReportePDF = (p: ProyectoEducativo) => {
    setProyectoParaReportePDF(p);
    setIsPDFReportModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Toast Notification */}
      {mensajeToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{mensajeToast}</span>
        </div>
      )}

      {/* Header con Navegación por Pantallas y Filtro de Mes */}
      <Header
        proyectos={proyectos}
        moneda={moneda}
        setMoneda={setMoneda}
        onExportarExcel={handleExportarExcel}
        onExportarCSV={handleExportarCSV}
        onImprimir={handleImprimir}
        onAbrirSimulador={() => setIsSimulatorModalOpen(true)}
        onVaciarDatos={handleVaciarDatos}
        onCargarPlantilla={handleCargarPlantilla}
        vistaActual={vistaActual}
        setVistaActual={setVistaActual}
        mesFiltro={mesFiltro}
        setMesFiltro={setMesFiltro}
        listaMesesDisponibles={listaMesesDisponibles}
        notificaciones={notificaciones}
        onAbrirNotificaciones={() => setIsNotificationsModalOpen(true)}
        onAbrirWebPushModal={() => setIsWebPushModalOpen(true)}
        onAbrirGoogleDriveModal={() => setIsDriveModalOpen(true)}
        onAbrirGoogleSheetsModal={() => setIsGoogleSheetsModalOpen(true)}
        onAbrirGoogleFormsModal={() => setIsGoogleFormsModalOpen(true)}
        onAbrirGoogleMeetGerenciasModal={() => setIsGoogleMeetGerenciasModalOpen(true)}
        onAbrirCentroReportes={handleAbrirCentroReportes}
        onAbrirDirectorioGerencias={() => setIsDirectorioGerenciasModalOpen(true)}
        onAbrirTableroPOA={() => setIsPOAModalOpen(true)}
        isDriveConnected={driveSync.isAuthenticated}
        isDriveSyncing={driveSync.isSyncing}
        onExportarReporteMesPDF={handleAbrirExportarMes}
        onAbrirWorkflowStatusModal={() => handleAbrirWorkflowModal()}
        onAbrirOperacionRapida={() => setIsGlobalQuickOperationsModalOpen(true)}
        usuarioActivo={usuarioActivo}
        onAbrirSelectorPerfil={() => {
          setRolSugeridoModal(usuarioActivo.id);
          setIsSelectorPerfilModalOpen(true);
        }}
      />

      {/* Barra Permanente de Auto-Guardado en Google Drive */}
      <GoogleDriveSyncBar
        driveSync={driveSync}
        onAbrirModalDrive={() => setIsDriveModalOpen(true)}
      />

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Banner Informativo si hay un Filtro por Mes activo en vistas generales */}
        {mesFiltro !== 'todos' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <span className="text-slate-500 font-medium">Filtrando vista por: </span>
                <span className="font-bold text-blue-900">{formatearEtiquetaMes(mesFiltro)}</span>
                <span className="text-slate-500 ml-1.5">
                  ({proyectosVisibles.length} {proyectosVisibles.length === 1 ? 'curso' : 'cursos'} de {proyectos.length} totales)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => handleAbrirExportarMes(mesFiltro)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors cursor-pointer"
                title={`Exportar reporte consolidado en PDF de ${formatearEtiquetaMes(mesFiltro)}`}
              >
                <FileDown className="w-3.5 h-3.5 text-blue-600" />
                <span>Exportar Reporte Mes (PDF)</span>
              </button>
              <button
                onClick={() => {
                  setVistaActual('gerencia-general');
                  setSubPestanaGeneral('meses');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-100/70 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
              >
                <span>Comparativa Mensual</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setMesFiltro('todos')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Mostrar todos los meses"
              >
                <X className="w-3.5 h-3.5 text-slate-500" />
                <span>Quitar Filtro</span>
              </button>
            </div>
          </div>
        )}

        {/* Alerta de Control Preventivo si hay proyectos en déficit */}
        {proyectosCriticos.length > 0 && !(vistaActual === 'gerencia-general' && subPestanaGeneral === 'control') && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-rose-900">
                  Control de Alerta: {proyectosCriticos.length} proyecto(s) por debajo del punto de equilibrio
                </h4>
                <p className="text-rose-700 mt-0.5">
                  Hay un riesgo de déficit operativo estimado en {formatearMoneda(perdidaPotencial, moneda)}. Se requiere ajustar inscripciones o tomar acción preventiva.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setVistaActual('gerencia-general');
                setSubPestanaGeneral('control');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shrink-0 transition-colors"
            >
              <span>Abrir Centro de Control</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Renderizado de la Pantalla Activa: 3 Gerencias */}
        {(vistaActual === 'gerencia-general' || ['control', 'tabla', 'tarjetas', 'meses', 'analitica', 'isv', 'guia'].includes(vistaActual)) && (
          <GerenciaGeneralView
            proyectos={proyectosVisibles}
            moneda={moneda}
            onEditarProyecto={handleEditarProyecto}
            onVerDetalle={handleVerDetalle}
            onGenerarReportePDF={handleAbrirReportePDF}
            onGuardarProyecto={handleGuardarProyecto}
            onDuplicarProyecto={handleDuplicarProyecto}
            onEliminarProyecto={handleSolicitarEliminar}
            onEliminarPorId={handleSolicitarEliminarPorId}
            onActualizarRapido={handleActualizarRapido}
            subPestanaInicial={subPestanaGeneral}
            onCambiarSubPestana={setSubPestanaGeneral}
            onFiltrarPorMes={(mesKey) => {
              setMesFiltro(mesKey);
              mostrarToast(`Filtrando matriz por ${formatearEtiquetaMes(mesKey)}`);
            }}
            mesFiltro={mesFiltro}
            onExportarReporteMesPDF={handleAbrirExportarMes}
            onAbrirTableroPOA={() => setIsPOAModalOpen(true)}
            onAbrirWorkflowStatusModal={handleAbrirWorkflowModal}
            onAbrirComercializarProyecto={handleAbrirComercializarProyecto}
            onNotificar={mostrarToast}
          />
        )}

        {vistaActual === 'gerencia-academica' && (
          <GerenciaAcademicaView
            proyectos={proyectosVisibles}
            moneda={moneda}
            onEditarProyecto={handleEditarProyecto}
            onVerDetalle={handleVerDetalle}
            onNuevoProyecto={handleNuevoProyecto}
            onGuardarProyecto={handleGuardarProyecto}
            onEliminarProyecto={handleSolicitarEliminar}
            onEliminarMultiples={handleEliminarMultiples}
            onAbrirWorkflowStatusModal={handleAbrirWorkflowModal}
            onAbrirComercializarProyecto={handleAbrirComercializarProyecto}
            onNotificar={mostrarToast}
            subPestanaInicial={subPestanaAcademica}
            onCambiarSubPestana={setSubPestanaAcademica}
          />
        )}

        {vistaActual === 'gerencia-comercializacion' && (
          <GerenciaComercializacionView
            proyectos={proyectosVisibles}
            moneda={moneda}
            onEditarProyecto={handleEditarProyecto}
            onVerDetalle={handleVerDetalle}
            onGuardarProyecto={handleGuardarProyecto}
            onNotificar={(msg) => mostrarToast(msg)}
            onAbrirWorkflowStatusModal={handleAbrirWorkflowModal}
            onAbrirComercializarProyecto={handleAbrirComercializarProyecto}
          />
        )}

        {vistaActual === 'modificar' && (
          <ModifyProjectScreen
            proyectos={proyectos}
            proyectoInicialId={proyectoAEditar ? proyectoAEditar.id : null}
            moneda={moneda}
            onGuardar={handleGuardarDesdePantalla}
            onCancelar={() => setVistaActual('gerencia-general')}
          />
        )}

      </main>

      {/* Footer Corporativo Oficial con Respaldo Legal (RTN y Dirección) */}
      <Footer
        onCargarPlantilla={handleCargarPlantilla}
        onVaciarDatos={handleVaciarDatos}
      />

      {/* Modal para Agregar / Editar Proyecto */}
      <ProjectFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onGuardar={handleGuardarProyecto}
        proyectoAEditar={proyectoAEditar}
        proyectosExistentes={proyectos}
        moneda={moneda}
        vistaActual={vistaActual}
        usuarioActivo={usuarioActivo}
      />

      {/* Modal para Ver Detalle y Sensibilidad */}
      <ProjectDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        proyecto={proyectoSeleccionado ? proyectos.find(p => p.id === proyectoSeleccionado.id) || proyectoSeleccionado : null}
        moneda={moneda}
        onEditar={handleEditarProyecto}
        onExportarPDF={handleAbrirReportePDF}
        onAgregarHistorial={handleAgregarEntradaHistorial}
        onActualizarProyecto={handleGuardarProyecto}
        vistaActual={vistaActual}
      />

      {/* Modal para Reporte Ejecutivo en PDF */}
      <ProjectExecutiveReportModal
        isOpen={isPDFReportModalOpen}
        onClose={() => {
          setIsPDFReportModalOpen(false);
          setProyectoParaReportePDF(null);
        }}
        proyecto={proyectoParaReportePDF}
        moneda={moneda}
      />

      {/* Modal Seguro de Confirmación para Eliminar */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmarEliminar}
        proyecto={proyectoAEliminar}
        moneda={moneda}
      />

      {/* Modal Simulador Rápido */}
      <QuickSimulatorModal
        isOpen={isSimulatorModalOpen}
        onClose={() => setIsSimulatorModalOpen(false)}
        moneda={moneda}
        onCrearProyectoDesdeSimulador={handleCrearDesdeSimulador}
      />

      {/* Modal Centro de Notificaciones Inter-Gerenciales */}
      <NotificationsCenterModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        notificaciones={notificaciones}
        onMarcarLeida={handleMarcarNotificacionLeida}
        onMarcarTodasLeidas={handleMarcarTodasLeidas}
        onLimpiarNotificaciones={handleLimpiarNotificaciones}
        onEjecutarAccion={handleEjecutarAccionNotificacion}
        onAbrirConfigWebPush={() => setIsWebPushModalOpen(true)}
      />

      {/* Modal Sistema de Notificaciones Web Push de Navegador (Segundo Plano) */}
      <WebPushNotificationModal
        isOpen={isWebPushModalOpen}
        onClose={() => setIsWebPushModalOpen(false)}
        onEjecutarAccion={handleEjecutarAccionNotificacion}
      />

      {/* Banner / Toast Flotante Interactivo cuando se envía una notificación */}
      <NotificationBannerToast
        notificacion={notificacionActivaBanner}
        onCerrar={() => setNotificacionActivaBanner(null)}
        onEjecutarAccion={handleEjecutarAccionNotificacion}
      />

      {/* Modal de Control y Sincronización con Google Drive */}
      <GoogleDriveSyncModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        driveSync={driveSync}
        proyectos={proyectos}
        moneda={moneda}
        onRestaurarDatos={(datos) => {
          if (datos.proyectos && datos.proyectos.length > 0) {
            setProyectos(datos.proyectos);
          }
          if (datos.moneda) {
            setMoneda(datos.moneda);
          }
        }}
      />

      {/* Modal Centro de Reportes Ejecutivos por Gerencia con Auto-Guardado en Drive */}
      <ReportsCenterModal
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
        proyectos={proyectos}
        moneda={moneda}
        gerenciaInicial={reportsModalGerenciaInicial}
        isDriveConnected={driveSync.isAuthenticated}
        onConectarDrive={driveSync.conectarGoogleDrive}
        onNotificar={(msg) => mostrarToast(msg)}
        onActualizarProyecto={handleGuardarProyecto}
        onActualizarVariosProyectos={(ps) => {
          setProyectos(ps);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(ps));
          } catch (e) {
            console.error(e);
          }
        }}
      />

      {/* Modal de Exportación Consolidada Mensual en PDF */}
      <ExportMonthlyReportModal
        isOpen={isExportMonthlyModalOpen}
        onClose={() => setIsExportMonthlyModalOpen(false)}
        proyectos={proyectos}
        moneda={moneda}
        mesSeleccionadoInicial={mesParaExportar}
        isDriveConnected={driveSync.isAuthenticated}
        onNotificar={(msg) => mostrarToast(msg)}
      />

      {/* Modal Directorio de Correos & Credenciales Oficiales de Gerencias */}
      <DirectorioGerenciasModal
        isOpen={isDirectorioGerenciasModalOpen}
        onClose={() => setIsDirectorioGerenciasModalOpen(false)}
        onSeleccionarGerencia={(vista) => setVistaActual(vista)}
        onAbrirTableroPOA={() => setIsPOAModalOpen(true)}
        gerenciaInicialId={vistaActual}
        proyectos={proyectos}
        moneda={moneda}
        onAbrirGoogleMeetGerenciasModal={() => setIsGoogleMeetGerenciasModalOpen(true)}
        onSolicitarAutorizacionGG={(accionDesc) => {
          setGgAuthAccionDesc(accionDesc || 'habilitar permisos de modificación para la Gerencia General');
          setPendingActionCallback(null);
          setIsGGAuthModalOpen(true);
        }}
      />

      {/* Modal Rastreador de Flujo, Nivel y Cumplimiento Inter-Gerencial */}
      <WorkflowStatusModal
        isOpen={isWorkflowModalOpen}
        onClose={() => setIsWorkflowModalOpen(false)}
        proyectos={proyectos}
        moneda={moneda}
        proyectoInicialId={workflowProyectoId}
        onActualizarProyecto={handleGuardarProyecto}
        onNavegarGerencia={(vista) => setVistaActual(vista)}
        onNotificar={(msg) => mostrarToast(msg)}
      />

      {/* Modal Centro de Operación Rápida 1 Clic (Todas las Gerencias) */}
      <GlobalQuickOperationsModal
        isOpen={isGlobalQuickOperationsModalOpen}
        onClose={() => setIsGlobalQuickOperationsModalOpen(false)}
        proyectos={proyectos}
        moneda={moneda}
        onGuardarProyecto={handleGuardarProyecto}
        onCrearProyecto={handleGuardarProyecto}
        onNotificar={mostrarToast}
        onNavegarVista={(v) => {
          setVistaActual(v);
          setIsGlobalQuickOperationsModalOpen(false);
        }}
      />

      {/* Modal Tablero de Control Directivo • Cuadro de Mando Integral POA SEP - DIC 2026 */}
      <POATableroControlModal
        isOpen={isPOAModalOpen}
        onClose={() => setIsPOAModalOpen(false)}
        onNavegarGerencia={(vista) => setVistaActual(vista)}
        proyectos={proyectos}
        moneda={moneda}
      />

      {/* Modal Integración Oficial Google Sheets API v4 */}
      {isGoogleSheetsModalOpen && (
        <GoogleSheetsModal
          isOpen={isGoogleSheetsModalOpen}
          onClose={() => setIsGoogleSheetsModalOpen(false)}
          proyectos={proyectos}
          moneda={moneda}
        />
      )}

      {/* Modal Integración Oficial Google Forms API v1 */}
      {isGoogleFormsModalOpen && (
        <GoogleFormsModal
          isOpen={isGoogleFormsModalOpen}
          onClose={() => setIsGoogleFormsModalOpen(false)}
          proyectos={proyectos}
          moneda={moneda}
        />
      )}

      {/* Modal Exclusivo Reunión de Gerencias con Google Meet API v2 */}
      {isGoogleMeetGerenciasModalOpen && (
        <GoogleMeetGerenciasModal
          isOpen={isGoogleMeetGerenciasModalOpen}
          onClose={() => setIsGoogleMeetGerenciasModalOpen(false)}
          proyectos={proyectos}
          onNotificar={(msg) => mostrarToast(msg)}
        />
      )}

      {/* Modal de Validación y Parámetro de Seguridad Exclusiva de Gerencia General */}
      <GerenciaGeneralAuthModal
        isOpen={isGGAuthModalOpen}
        onClose={() => {
          setIsGGAuthModalOpen(false);
          setPendingActionCallback(null);
        }}
        onAuthorized={() => {
          if (pendingActionCallback) {
            const cb = pendingActionCallback;
            setPendingActionCallback(null);
            cb();
          }
          mostrarToast('Autorización de Gerencia General verificada con éxito.');
        }}
        accionDescripcion={ggAuthAccionDesc}
      />

      {/* Modal Centralizado Unificado: Comercializar Sílabo / Proyecto (Todas las Gerencias) */}
      {isComercializarModalOpen && (
        <CommercialProjectLauncherModal
          proyectos={proyectos}
          moneda={moneda}
          proyectoInicialId={proyectoIdParaComercializar}
          onCerrar={() => {
            setIsComercializarModalOpen(false);
            setProyectoIdParaComercializar(undefined);
          }}
          onGuardarProyecto={handleGuardarProyecto}
          onEditarProyecto={handleEditarProyecto}
          onVerDetalle={handleVerDetalle}
          onNotificar={mostrarToast}
          onAbrirWorkflowStatusModal={handleAbrirWorkflowModal}
        />
      )}

      {/* Modal de Selección y Autenticación por Gerencia (Opción A) */}
      <SelectorPerfilGerenciaModal
        isOpen={isSelectorPerfilModalOpen}
        onClose={() => {
          setIsSelectorPerfilModalOpen(false);
          setRolSugeridoModal(undefined);
          setPendingActionCallback(null);
        }}
        usuarioActivo={usuarioActivo}
        onUsuarioCambiado={handleCambiarPerfilUsuario}
        rolSugerido={rolSugeridoModal}
      />

    </div>
  );
}
