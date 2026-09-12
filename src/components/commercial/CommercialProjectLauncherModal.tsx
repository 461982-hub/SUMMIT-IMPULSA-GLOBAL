import React, { useState, useMemo } from 'react';
import {
  Rocket,
  Megaphone,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  Share2,
  Copy,
  ExternalLink,
  MessageSquare,
  Mail,
  Target,
  Sparkles,
  Filter,
  Search,
  BookOpen,
  ArrowRight,
  Layers,
  X,
  Calendar,
  BadgePercent,
  Send,
  AlertCircle,
  Eye,
  Edit3,
  Globe,
  Radio,
  Zap,
  CheckCheck,
} from 'lucide-react';
import { ProyectoEducativo, Moneda, MetodoVenta, EstadoProyecto } from '../../types';
import { formatearMoneda, calcularMetricasProyecto } from '../../utils/calculations';
import { SummitLogo } from '../SummitLogo';
import { ControlDecisionComercialSection } from './ControlDecisionComercialSection';

interface CommercialProjectLauncherModalProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  proyectoInicialId?: string;
  onCerrar: () => void;
  onGuardarProyecto: (p: ProyectoEducativo) => void;
  onEditarProyecto: (p: ProyectoEducativo) => void;
  onVerDetalle: (p: ProyectoEducativo) => void;
  onNotificar?: (mensaje: string) => void;
  onAbrirWorkflowStatusModal?: (proyectoId?: string) => void;
}

type SubTabLanzador = 'proceso_venta' | 'comercializacion' | 'redes_sociales' | 'difusion_directa' | 'simulador_opciones';
type VistaModal = 'catalogo_resumen' | 'detalle_proyecto';

export const CommercialProjectLauncherModal: React.FC<CommercialProjectLauncherModalProps> = ({
  proyectos,
  moneda,
  proyectoInicialId,
  onCerrar,
  onGuardarProyecto,
  onEditarProyecto,
  onVerDetalle,
  onNotificar,
  onAbrirWorkflowStatusModal,
}) => {
  // Modal view switcher: 'catalogo_resumen' (all academic projects) vs 'detalle_proyecto' (single project)
  const [vistaModal, setVistaModal] = useState<VistaModal>(() => {
    return proyectoInicialId ? 'detalle_proyecto' : 'catalogo_resumen';
  });

  // Búsqueda y filtrado de proyectos elaborados por la Gerencia Académica
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'nuevos_academica' | 'en_campana' | 'meta_cumplida'>('todos');

  // Excluir sílabos base: son la estructura curricular básica custodiada en Académica, no se envían a comercialización
  const proyectosOperativos = useMemo(() => {
    return proyectos.filter((p) => !p.esSilaboBase && p.tipoRegistro !== 'silabo_base');
  }, [proyectos]);

  // Proyecto seleccionado para comercializar
  const [proyectoSeleccionadoId, setProyectoSeleccionadoId] = useState<string>(() => {
    if (proyectoInicialId && proyectosOperativos.some((p) => p.id === proyectoInicialId)) {
      return proyectoInicialId;
    }
    // Preferir uno en comercialización o el primero
    const preferido = proyectosOperativos.find((p) => p.etapaFlujo === 'comercializacion' || !p.comercializacionCompletada);
    return preferido ? preferido.id : (proyectosOperativos[0]?.id || '');
  });

  const [subTabActiva, setSubTabActiva] = useState<SubTabLanzador>('proceso_venta');
  const [copiadoTexto, setCopiadoTexto] = useState<string | null>(null);

  // Proyecto activo en vista
  const proyectoActivo = useMemo(() => {
    return proyectosOperativos.find((p) => p.id === proyectoSeleccionadoId) || proyectosOperativos[0] || null;
  }, [proyectosOperativos, proyectoSeleccionadoId]);

  // Resumen ejecutivo de alto nivel para el catálogo
  const resumenEjecutivo = useMemo(() => {
    const total = proyectosOperativos.length;
    const enCampana = proyectosOperativos.filter((p) => p.seLlevoACabo === 'En proceso' || p.comercializacionCompletada).length;
    const pendientes = proyectosOperativos.filter(
      (p) => !p.comercializacionCompletada || p.etapaFlujo === 'comercializacion' || p.seLlevoACabo === 'Planificado'
    ).length;
    const facturacionTotal = proyectosOperativos.reduce((acc, p) => {
      const precio = p.precioSugeridoConISV || p.precioSugeridoAlumno || 2500;
      const alumnos = p.alumnosFinal || p.alumnosProyectados || 12;
      return acc + (p.ingresoRealTotal || precio * alumnos);
    }, 0);
    const alumnosTotal = proyectosOperativos.reduce((acc, p) => acc + (p.alumnosFinal || 0), 0);
    const metaTotal = proyectosOperativos.reduce((acc, p) => acc + (p.alumnosProyectados || 0), 0);

    return { total, enCampana, pendientes, facturacionTotal, alumnosTotal, metaTotal };
  }, [proyectosOperativos]);

  // Lista filtrada de todos los proyectos elaborados por Académica
  const proyectosFiltrados = useMemo(() => {
    return proyectosOperativos.filter((p) => {
      const matchBusqueda =
        p.nombreProyecto.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.nombreDocente.toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.codigoPrograma && p.codigoPrograma.toLowerCase().includes(busqueda.toLowerCase())) ||
        p.tipoProyecto.toLowerCase().includes(busqueda.toLowerCase());

      if (!matchBusqueda) return false;

      if (filtroEstado === 'nuevos_academica') {
        return p.etapaFlujo === 'comercializacion' || !p.comercializacionCompletada || p.seLlevoACabo === 'Planificado';
      }
      if (filtroEstado === 'en_campana') {
        return p.seLlevoACabo === 'En proceso' || p.seLlevoACabo === 'En curso';
      }
      if (filtroEstado === 'meta_cumplida') {
        return p.alumnosFinal >= p.alumnosProyectados;
      }
      return true;
    });
  }, [proyectosOperativos, busqueda, filtroEstado]);

  // Estados locales para editar y guardar interactivamente el proyecto activo
  const [leadsInput, setLeadsInput] = useState<number>(proyectoActivo?.leadsGenerados || 35);
  const [calificadosInput, setCalificadosInput] = useState<number>(proyectoActivo?.prospectosCalificados || 15);
  const [reservasInput, setReservasInput] = useState<number>(proyectoActivo?.cuposReservados || 7);
  const [inscritosInput, setInscritosInput] = useState<number>(proyectoActivo?.alumnosFinal || 8);
  const [asesorAsignado, setAsesorAsignado] = useState<string>(proyectoActivo?.responsableComercial || 'Lic. Carlos Mendoza - Admisiones');
  const [canalPrincipal, setCanalPrincipal] = useState<MetodoVenta>(proyectoActivo?.metodoVenta || 'Publicidad Paga (Ads)');

  // Estados para Comercialización y Precios
  const [faseComercial, setFaseComercial] = useState<NonNullable<ProyectoEducativo['faseComercial']>>(
    proyectoActivo?.faseComercial || 'Preventa Early Bird'
  );
  const [descuentoEarlyBirdPct, setDescuentoEarlyBirdPct] = useState<number>(proyectoActivo?.descuentoPreventaPct || 15);
  const [fechaLimitePreventa, setFechaLimitePreventa] = useState<string>(proyectoActivo?.fechaVenta || '');

  // Estados para Redes Sociales
  const [pautaPresupuesto, setPautaPresupuesto] = useState<number>(proyectoActivo?.gastoPublicidad || 1800);
  const [canalPauta, setCanalPauta] = useState<'meta' | 'linkedin' | 'tiktok' | 'google'>('meta');
  const [tipoCopy, setTipoCopy] = useState<'instagram_facebook' | 'linkedin' | 'tiktok_reels'>('instagram_facebook');

  // Estados para Cotizador Rápido
  const [nombreClienteCotizacion, setNombreClienteCotizacion] = useState<string>('');
  const [empresaClienteCotizacion, setEmpresaClienteCotizacion] = useState<string>('');
  const [incluirISVCotizacion, setIncluirISVCotizacion] = useState<boolean>(true);

  // Simulador local
  const [simuladorAlumnosExtra, setSimuladorAlumnosExtra] = useState<number>(0);

  // Actualizar estados locales cuando cambia el proyecto seleccionado
  const handleSeleccionarProyecto = (id: string) => {
    setProyectoSeleccionadoId(id);
    const p = proyectos.find((item) => item.id === id);
    if (p) {
      setLeadsInput(p.leadsGenerados || 35);
      setCalificadosInput(p.prospectosCalificados || 15);
      setReservasInput(p.cuposReservados || 7);
      setInscritosInput(p.alumnosFinal || 8);
      setAsesorAsignado(p.responsableComercial || 'Lic. Carlos Mendoza - Admisiones');
      setCanalPrincipal(p.metodoVenta || 'Publicidad Paga (Ads)');
      setFaseComercial(p.faseComercial || 'Preventa Early Bird');
      setDescuentoEarlyBirdPct(p.descuentoPreventaPct || 15);
      setFechaLimitePreventa(p.fechaVenta || '');
      setPautaPresupuesto(p.gastoPublicidad || 1800);
      setSimuladorAlumnosExtra(0);
    }
  };

  // Helper para aplicar automatización comercial instantánea en 1 clic
  const handleAplicarEstrategiaAutomatica = (p: ProyectoEducativo) => {
    const precioBase = p.precioSugeridoConISV || p.precioSugeridoAlumno || 2500;
    const descuentoEB = 15;
    const precioEB = Math.round(precioBase * (1 - descuentoEB / 100));
    const be = p.puntoEquilibrioAlumnos || 5;
    const targetInscritos = Math.max(p.alumnosFinal || 0, be + 2);
    const cuposReservados = Math.max(p.cuposReservados || 0, Math.round(targetInscritos * 1.4));
    const prospectosCalificados = Math.max(p.prospectosCalificados || 0, Math.round(cuposReservados * 2.2));
    const leadsGenerados = Math.max(p.leadsGenerados || 0, Math.round(prospectosCalificados * 2.5));
    const pautaOptima = Math.max(1500, be * 320);

    const actualizado = calcularMetricasProyecto({
      ...p,
      faseComercial: 'Preventa Early Bird',
      descuentoPreventaPct: descuentoEB,
      precioEarlyBird: precioEB,
      gastoPublicidad: pautaOptima,
      metodoVenta: 'Publicidad Paga (Ads)',
      leadsGenerados,
      prospectosCalificados,
      cuposReservados,
      alumnosFinal: targetInscritos,
      responsableComercial: p.responsableComercial || 'Lic. Carlos Mendoza - Admisiones',
      comercializacionCompletada: true,
      autorizacionComercial: true,
      fechaAutorizacionComercial: new Date().toISOString(),
      etapaFlujo: 'dictamen_general',
      fechaNotificacionGeneral: new Date().toISOString(),
      seLlevoACabo: 'En proceso',
      observaciones: p.observaciones
        ? `${p.observaciones} | [⚡ Comercialización Automática - ${new Date().toLocaleTimeString()}]`
        : `[⚡ Comercialización Automática - ${new Date().toLocaleTimeString()}] Preventa Early Bird 15% desc., pauta optimizada L. ${pautaOptima} y embudo activo.`,
    });

    onGuardarProyecto(actualizado);
    if (p.id === proyectoActivo?.id) {
      setLeadsInput(leadsGenerados);
      setCalificadosInput(prospectosCalificados);
      setReservasInput(cuposReservados);
      setInscritosInput(targetInscritos);
      setFaseComercial('Preventa Early Bird');
      setDescuentoEarlyBirdPct(descuentoEB);
      setPautaPresupuesto(pautaOptima);
      setCanalPrincipal('Publicidad Paga (Ads)');
    }

    if (onNotificar) {
      onNotificar(`⚡ ¡Estrategia comercial automática aplicada con éxito a "${p.nombreProyecto}"!`);
    }
  };

  // Helper para automatizar TODOS los proyectos pendientes de Académica
  const handleAutomatizarTodosLosPendientes = () => {
    const pendientes = proyectos.filter(
      (p) => !p.comercializacionCompletada || p.etapaFlujo === 'comercializacion' || p.seLlevoACabo === 'Planificado'
    );
    if (pendientes.length === 0) {
      if (onNotificar) onNotificar('Todos los programas de Académica ya cuentan con comercialización activa.');
      return;
    }

    pendientes.forEach((p) => {
      const precioBase = p.precioSugeridoConISV || p.precioSugeridoAlumno || 2500;
      const descuentoEB = 15;
      const precioEB = Math.round(precioBase * (1 - descuentoEB / 100));
      const be = p.puntoEquilibrioAlumnos || 5;
      const targetInscritos = Math.max(p.alumnosFinal || 0, be + 2);
      const cuposReservados = Math.max(p.cuposReservados || 0, Math.round(targetInscritos * 1.4));
      const prospectosCalificados = Math.max(p.prospectosCalificados || 0, Math.round(cuposReservados * 2.2));
      const leadsGenerados = Math.max(p.leadsGenerados || 0, Math.round(prospectosCalificados * 2.5));
      const pautaOptima = Math.max(1500, be * 320);

      const actualizado = calcularMetricasProyecto({
        ...p,
        faseComercial: 'Preventa Early Bird',
        descuentoPreventaPct: descuentoEB,
        precioEarlyBird: precioEB,
        gastoPublicidad: pautaOptima,
        metodoVenta: 'Publicidad Paga (Ads)',
        leadsGenerados,
        prospectosCalificados,
        cuposReservados,
        alumnosFinal: targetInscritos,
        responsableComercial: p.responsableComercial || 'Lic. Carlos Mendoza - Admisiones',
        comercializacionCompletada: true,
        autorizacionComercial: true,
        fechaAutorizacionComercial: new Date().toISOString(),
        etapaFlujo: 'dictamen_general',
        fechaNotificacionGeneral: new Date().toISOString(),
        seLlevoACabo: 'En proceso',
      });
      onGuardarProyecto(actualizado);
    });

    if (onNotificar) {
      onNotificar(`⚡ ¡Se aplicó comercialización automática a ${pendientes.length} programas académicos con éxito!`);
    }
  };

  // Helper para copiar al portapapeles con confirmación visual
  const copiarAlPortapapeles = (texto: string, clave: string) => {
    navigator.clipboard.writeText(texto);
    setCopiadoTexto(clave);
    if (onNotificar) {
      onNotificar('Copiado al portapapeles con éxito');
    }
    setTimeout(() => {
      setCopiadoTexto(null);
    }, 2500);
  };

  // Guardar datos del Proceso de Venta / Embudo
  const handleGuardarProcesoVenta = () => {
    if (!proyectoActivo) return;
    const actualizado = calcularMetricasProyecto({
      ...proyectoActivo,
      leadsGenerados: Math.max(0, Number(leadsInput)),
      prospectosCalificados: Math.max(0, Number(calificadosInput)),
      cuposReservados: Math.max(0, Number(reservasInput)),
      alumnosFinal: Math.max(4, Number(inscritosInput)),
      responsableComercial: asesorAsignado,
      metodoVenta: canalPrincipal,
      seLlevoACabo: proyectoActivo.seLlevoACabo === 'Planificado' ? 'En proceso' : proyectoActivo.seLlevoACabo,
    });
    onGuardarProyecto(actualizado);
    if (onNotificar) {
      onNotificar(`Embudo de ventas de "${proyectoActivo.nombreProyecto}" actualizado exitosamente.`);
    }
  };

  // Guardar Estrategia Comercial y Precios
  const handleGuardarEstrategiaComercial = () => {
    if (!proyectoActivo) return;
    const precioBase = proyectoActivo.precioSugeridoConISV || proyectoActivo.precioSugeridoAlumno || 2500;
    const precioEB = Math.round(precioBase * (1 - descuentoEarlyBirdPct / 100));

    const actualizado = calcularMetricasProyecto({
      ...proyectoActivo,
      faseComercial,
      descuentoPreventaPct: Number(descuentoEarlyBirdPct),
      precioEarlyBird: precioEB,
      fechaVenta: fechaLimitePreventa,
      seLlevoACabo: 'En proceso',
    });
    onGuardarProyecto(actualizado);
    if (onNotificar) {
      onNotificar(`Estrategia de precios y fase "${faseComercial}" guardada.`);
    }
  };

  // Guardar Pauta Publicitaria y Redes Sociales
  const handleGuardarRedesSociales = () => {
    if (!proyectoActivo) return;
    const canalTexto: MetodoVenta = canalPauta === 'meta'
      ? 'Publicidad Paga (Ads)'
      : canalPauta === 'linkedin'
      ? 'Convenios / Empresas'
      : 'Redes sociales';

    const actualizado = calcularMetricasProyecto({
      ...proyectoActivo,
      gastoPublicidad: Math.max(0, Number(pautaPresupuesto)),
      metodoVenta: canalTexto,
    });
    onGuardarProyecto(actualizado);
    if (onNotificar) {
      onNotificar(`Pauta publicitaria de ${formatearMoneda(pautaPresupuesto, moneda)} asignada a "${proyectoActivo.nombreProyecto}".`);
    }
  };

  // Acción Principal: Autorizar Envío a Gerencia General
  const handleAutorizarYEnviarAGeneral = () => {
    if (!proyectoActivo) return;
    const actualizado = calcularMetricasProyecto({
      ...proyectoActivo,
      comercializacionCompletada: true,
      autorizacionComercial: true,
      fechaAutorizacionComercial: new Date().toISOString(),
      responsableComercial: asesorAsignado,
      etapaFlujo: 'dictamen_general',
      fechaNotificacionGeneral: new Date().toISOString(),
      seLlevoACabo: 'En proceso',
      leadsGenerados: Math.max(0, Number(leadsInput)),
      prospectosCalificados: Math.max(0, Number(calificadosInput)),
      cuposReservados: Math.max(0, Number(reservasInput)),
      alumnosFinal: Math.max(4, Number(inscritosInput)),
      gastoPublicidad: Math.max(0, Number(pautaPresupuesto)),
      faseComercial,
    });
    onGuardarProyecto(actualizado);
    if (onNotificar) {
      onNotificar(`✅ Proyecto "${proyectoActivo.nombreProyecto}" enviado con Dictamen Comercial a Gerencia General.`);
    }
  };

  // Textos y Copies autogenerados para redes sociales
  const copiesPublicitarios = useMemo(() => {
    if (!proyectoActivo) {
      return {
        instagram_facebook: '',
        linkedin: '',
        tiktok_reels: '',
        whatsappSpeech: '',
        emailSubject: '',
        emailBody: '',
      };
    }

    const nombre = proyectoActivo.nombreProyecto;
    const docente = proyectoActivo.nombreDocente;
    const horas = proyectoActivo.horasClaseTotales || 24;
    const precio = formatearMoneda(proyectoActivo.precioSugeridoConISV || proyectoActivo.precioSugeridoAlumno || 2500, moneda);
    const precioEB = formatearMoneda(
      proyectoActivo.precioEarlyBird || Math.round((proyectoActivo.precioSugeridoConISV || 2500) * 0.85),
      moneda
    );
    const fecha = proyectoActivo.fechaProgramacion || 'Próximo Inicio';

    const igFb = `🚀 ¡IMPULSA TU CARRERA PROFESIONAL EN HONDURAS! 🇭🇳✨\n\n` +
      `¿Listo para dominar las habilidades más demandadas del mercado? Inscríbete en nuestro programa de alto impacto:\n\n` +
      `📚 "${nombre}"\n` +
      `👨‍🏫 Impartido por: ${docente}\n` +
      `⏱️ Duración: ${horas} horas de formación práctica y aplicable\n` +
      `🗓️ Fecha de inicio: ${fecha}\n\n` +
      `💥 PREVENTA EARLY BIRD DISPONIBLE:\n` +
      `Asegura tu cupo con precio especial de ${precioEB} (Precio regular: ${precio}).\n\n` +
      `🎯 Incluye:\n` +
      `✔️ Certificado avalado con respaldo institucional\n` +
      `✔️ Materiales ejecutivos, plantillas y casos reales\n` +
      `✔️ Acceso a grabaciones y networking profesional\n\n` +
      `📲 ¡Cupos estrictamente limitados! Escríbenos por DM o haz clic en el enlace para apartar tu lugar hoy mismo 👇\n` +
      `#SummitImpulsa #EducacionEjecutiva #Honduras #CapacitacionProfesional #Cursos2026`;

    const lk = `📢 Convocatoria de Formación Ejecutiva | SUMMIT IMPULSA\n\n` +
      `Nos complace anunciar la apertura de admisiones para el programa especializado:\n` +
      `👉 "${nombre}"\n\n` +
      `Diseñado estratégicamente por nuestra Gerencia Académica para directores, gerentes y profesionales que buscan liderazgo e innovación táctica en sus organizaciones.\n\n` +
      `• Docente Facilitador: ${docente}\n` +
      `• Carga Académica: ${horas} horas certificadas\n` +
      `• Inicio Programado: ${fecha}\n` +
      `• Inversión Preferencial Preventa: ${precioEB} (Planes corporativos disponibles)\n\n` +
      `Beneficios clave para empresas e instituciones:\n` +
      `🔹 Deducción de gastos de capacitación conforme a normativa fiscal hondureña.\n` +
      `🔹 Aplicabilidad inmediata mediante resolución de casos de negocio.\n` +
      `🔹 Certificación de competencias ejecutivas.\n\n` +
      `Para cotizaciones institucionales y reservas de cupos, contáctenos vía mensaje directo o a nuestro departamento de admisiones.`;

    const tt = `🔥 ¿Trabajas en tu área y quieres ganar más y liderar proyectos? Tienes que ver esto 👇\n\n` +
      `Llega a Honduras el programa "${nombre}" con el experto ${docente}.\n` +
      `En solo ${horas} horas vas a dominar todo lo que necesitas sin rodeos.\n\n` +
      `Aprovecha el precio de preventa (${precioEB}) antes de que se agoten los cupos.\n` +
      `Comenta "INFO" o ve al link del perfil para apartar tu cupo hoy mismo 🚀`;

    const wa = `¡Hola! 👋 Te saluda el equipo de admisiones de Summit Impulsa Honduras 🇭🇳.\n\n` +
      `Es un placer saludarte. Con respecto a tu consulta sobre el programa:\n` +
      `✨ "${nombre}" ✨\n\n` +
      `📅 Fecha de inicio: ${fecha}\n` +
      `⏱️ Carga horaria: ${horas} horas académicas\n` +
      `👨‍🏫 Docente titular: ${docente}\n` +
      `💳 Inversión: Precio Preventa Early Bird ${precioEB} (Precio regular ${precio})\n\n` +
      `¿Te gustaría que reservemos tu cupo preliminar o prefieres que te envíe el temario detallado en PDF? Quedo muy atento/a para ayudarte con tu inscripción. 😊`;

    const mailSub = `[Lanzamiento Oficial] Especialízate en ${nombre} - Cupos Limitados Summit Impulsa`;

    const mailBody = `Estimado(a) profesional,\n\n` +
      `En un entorno competitivo y en constante evolución, actualizar tus competencias es la mejor decisión para tu crecimiento.\n\n` +
      `La Gerencia Académica de Summit Impulsa le invita a participar en el programa:\n` +
      `"${nombre}"\n\n` +
      `Detalles Clave:\n` +
      `- Facilitador: ${docente}\n` +
      `- Duración: ${horas} horas con metodología práctica\n` +
      `- Inicio: ${fecha}\n` +
      `- Inversión Promocional Preventa: ${precioEB} (Aplica descuentos por grupos empresariales)\n\n` +
      `Asegure su participación ingresando al siguiente enlace o respondiendo a este correo para coordinar su factura o enlace de pago en línea.\n\n` +
      `Atentamente,\n` +
      `Gerencia de Comercialización & Admisiones\n` +
      `Summit Impulsa S. de R.L. | San Pedro Sula, Cortés, Honduras`;

    return {
      instagram_facebook: igFb,
      linkedin: lk,
      tiktok_reels: tt,
      whatsappSpeech: wa,
      emailSubject: mailSub,
      emailBody: mailBody,
    };
  }, [proyectoActivo, moneda]);

  // Enlace UTM para pauta digital
  const enlaceUTM = useMemo(() => {
    if (!proyectoActivo) return '';
    const codigo = proyectoActivo.codigoPrograma || 'PROG';
    const slug = proyectoActivo.nombreProyecto.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const canal = canalPauta === 'meta' ? 'facebook_instagram' : canalPauta === 'linkedin' ? 'linkedin_ads' : canalPauta === 'tiktok' ? 'tiktok_ads' : 'google_search';
    return `https://summitimpulsa.hn/programas/${codigo}?utm_source=${canal}&utm_medium=paid_social&utm_campaign=lanzamiento_${slug}&utm_content=preventa_eb`;
  }, [proyectoActivo, canalPauta]);

  if (!proyectoActivo) {
    return null;
  }

  // Métricas calculadas en tiempo real para el proyecto seleccionado
  const breakEven = proyectoActivo.puntoEquilibrioAlumnos || 5;
  const inscritosActuales = Number(inscritosInput);
  const leadsActuales = Number(leadsInput);
  const tasaConversion = leadsActuales > 0 ? (inscritosActuales / leadsActuales) * 100 : 0;
  const precioUnitario = proyectoActivo.precioSugeridoConISV || proyectoActivo.precioSugeridoAlumno || 2500;
  const facturacionProyectada = (inscritosActuales + simuladorAlumnosExtra) * precioUnitario;
  const costoTotalOperativo = proyectoActivo.gastoTotalOperativo || 10000;
  const margenEstimadoLPS = facturacionProyectada - costoTotalOperativo - pautaPresupuesto;
  const roasEstimado = pautaPresupuesto > 0 ? facturacionProyectada / pautaPresupuesto : 0;
  const cacEstimado = inscritosActuales > 0 ? pautaPresupuesto / inscritosActuales : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] my-auto">
        
        {/* Cabecera Principal del Modal */}
        <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 border-b border-emerald-800">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 shadow-md shrink-0">
              <Rocket className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 rounded">
                  Gerencia de Comercialización
                </span>
                <span className="text-xs font-bold text-emerald-300">
                  Centro de Comercialización de Proyectos Académicos
                </span>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300 font-mono">
                  {proyectos.length} programas elaborados por Gerencia Académica
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                Comercializar Programa Educativo & Campañas de Matrícula
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {onAbrirWorkflowStatusModal && (
              <button
                type="button"
                onClick={() => onAbrirWorkflowStatusModal(proyectoActivo.id)}
                className="px-3 py-1.5 bg-teal-800/80 hover:bg-teal-700 text-teal-100 text-xs font-bold rounded-lg border border-teal-600/40 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Ver estado de flujo institucional"
              >
                <Layers className="w-3.5 h-3.5 text-teal-300" />
                <span>Nivel & Status</span>
              </button>
            )}

            <button
              type="button"
              onClick={onCerrar}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Selector de Modo: Catálogo Resumen (Todos los Proyectos) vs Configuración Detallada */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-2.5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setVistaModal('catalogo_resumen')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                vistaModal === 'catalogo_resumen'
                  ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/40'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
              <span>📋 Catálogo & Resúmenes de Académica ({proyectos.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setVistaModal('detalle_proyecto')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                vistaModal === 'detalle_proyecto'
                  ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/40'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-emerald-300" />
              <span>🎯 Configuración Detallada ({proyectoActivo.nombreProyecto.slice(0, 20)}...)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutomatizarTodosLosPendientes}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-all hover:scale-[1.02] cursor-pointer"
              title="Aplica la estrategia comercial óptima a todos los programas de Académica que no están en campaña"
            >
              <Zap className="w-3.5 h-3.5 fill-current text-amber-100" />
              <span>⚡ Automatizar Todos los Pendientes ({resumenEjecutivo.pendientes})</span>
            </button>
          </div>
        </div>

        {/* CONTENIDO SEGÚN VISTA SELECCIONADA */}
        {vistaModal === 'catalogo_resumen' ? (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/60">
            {/* 4 Tarjetas de Resumen Ejecutivo (Solo resúmenes claros para no crear confusión) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                  <span>Programas Académicos</span>
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                  {resumenEjecutivo.total}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Elaborados por Gerencia Académica</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                  <span>En Comercialización</span>
                  <Rocket className="w-4 h-4 text-teal-600" />
                </div>
                <div className="text-2xl font-black text-teal-700 font-mono mt-1">
                  {resumenEjecutivo.enCampana}
                </div>
                <p className="text-[11px] text-teal-600 font-semibold mt-0.5">Con estrategia y pauta activa</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                  <span>Pendientes de Lanzamiento</span>
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-black text-amber-600 font-mono mt-1">
                  {resumenEjecutivo.pendientes}
                </div>
                <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Esperando activación de ventas</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                  <span>Facturación Proyectada</span>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
                  {formatearMoneda(resumenEjecutivo.facturacionTotal, moneda)}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {resumenEjecutivo.alumnosTotal} de {resumenEjecutivo.metaTotal} alumnos meta
                </p>
              </div>
            </div>

            {/* Barra de Búsqueda y Filtros de Proyectos */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar proyectos de Académica por nombre, docente o código..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value as any)}
                  className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl text-xs py-2 px-3 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="todos">Todos los Programas ({proyectos.length})</option>
                  <option value="nuevos_academica">⏳ Pendientes de Comercializar ({resumenEjecutivo.pendientes})</option>
                  <option value="en_campana">🚀 En Campaña Activa ({resumenEjecutivo.enCampana})</option>
                  <option value="meta_cumplida">🎯 Meta Cumplida</option>
                </select>
              </div>
            </div>

            {/* Catálogo de Tarjetas Resumen de Todos los Proyectos Elaborados por Académica */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {proyectosFiltrados.map((p) => {
                const be = p.puntoEquilibrioAlumnos || 5;
                const inscritos = p.alumnosFinal || 0;
                const cubrioBE = inscritos >= be;
                const precioUnitario = p.precioSugeridoConISV || p.precioSugeridoAlumno || 2500;
                const precioEB = p.precioEarlyBird || Math.round(precioUnitario * 0.85);
                const estaComercializado = Boolean(p.comercializacionCompletada);

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                  >
                    <div className="p-4 space-y-3">
                      {/* Header de la Tarjeta */}
                      <div className="flex items-center justify-between gap-1 text-[10px]">
                        <span className="font-mono font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          {p.codigoPrograma || 'PROG'} • Académica
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                            estaComercializado
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : p.seLlevoACabo === 'En proceso'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {estaComercializado
                            ? '⚡ Comercializado'
                            : p.seLlevoACabo === 'En proceso'
                            ? '🚀 En Campaña'
                            : '⏳ Pendiente'}
                        </span>
                      </div>

                      {/* Título y Docente */}
                      <div>
                        <h4 className="text-sm font-black text-slate-900 line-clamp-2 leading-snug">
                          {p.nombreProyecto}
                        </h4>
                        <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                          <span>
                            Prof. <strong className="text-slate-700">{p.nombreDocente}</strong>
                          </span>
                          {p.horaCreacion ? (
                            <span className="font-mono text-[10px] text-emerald-700 flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/50">
                              <Clock className="w-2.5 h-2.5" />
                              {p.horaCreacion}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">{p.horasClaseTotales || 24} hrs</span>
                          )}
                        </div>
                      </div>

                      {/* Resumen Métrico Claro (Sin confusión) */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Alumnos Inscritos / Meta:</span>
                          <span className="font-mono font-bold text-slate-900">
                            {inscritos} / {p.alumnosProyectados || 12}
                          </span>
                        </div>

                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${cubrioBE ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${Math.min(100, (inscritos / (p.alumnosProyectados || 12)) * 100)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                          <div>
                            <span className="text-[10px] text-slate-400 block">P. Regular c/ISV</span>
                            <span className="font-mono font-bold text-slate-800">
                              {formatearMoneda(precioUnitario, moneda)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-teal-600 font-bold block">Preventa Early Bird</span>
                            <span className="font-mono font-bold text-teal-700">
                              {formatearMoneda(precioEB, moneda)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Acciones Rápidas del Proyecto: Automático o Manual */}
                    <div className="p-3 bg-slate-50 border-t border-slate-100 flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAplicarEstrategiaAutomatica(p)}
                          className="flex-1 px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg text-xs font-black shadow-2xs flex items-center justify-center gap-1 transition-all cursor-pointer hover:scale-[1.01]"
                          title="Aplica la estrategia comercial de preventa, pauta y embudo en 1 clic"
                        >
                          <Zap className="w-3.5 h-3.5 fill-current" />
                          <span>⚡ Aplicar Automático</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            handleSeleccionarProyecto(p.id);
                            setVistaModal('detalle_proyecto');
                          }}
                          className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-black shadow-2xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                          title="Abrir configuración manual de ventas, precios, redes sociales y WhatsApp"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>✍️ Manual</span>
                        </button>
                      </div>

                      {/* Botones de difusión rápida */}
                      <div className="flex items-center justify-between gap-1 pt-1 text-[11px]">
                        <button
                          type="button"
                          onClick={() => {
                            const text = `🔥 ¡Inscripciones Abiertas! Especialízate en "${p.nombreProyecto}" con ${p.nombreDocente}. Precio de preventa disponible. Cupos limitados. ¡Escríbenos para asegurar tu cupo! 🚀`;
                            copiarAlPortapapeles(text, `copy_${p.id}`);
                          }}
                          className="flex-1 py-1 px-2 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200 text-center font-semibold text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3 text-slate-500" />
                          <span>{copiadoTexto === `copy_${p.id}` ? '¡Copiado!' : 'Copiar Copy'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const waText = encodeURIComponent(
                              `¡Hola! Quisiera más información sobre el programa "${p.nombreProyecto}" impartido por ${p.nombreDocente}. ¿Cuáles son las fechas y formas de pago?`
                            );
                            window.open(`https://wa.me/?text=${waText}`, '_blank');
                          }}
                          className="flex-1 py-1 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded border border-emerald-200 text-center font-semibold text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* =========================================================================
             VISTA 2: CONFIGURACIÓN DETALLADA DEL PROYECTO SELECCIONADO
             ========================================================================= */
          <>
            {/* Barra de Selección y Catálogo de Proyectos de Gerencia Académica */}
            <div className="bg-slate-50 border-b border-slate-200 p-3 sm:p-4 shrink-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => setVistaModal('catalogo_resumen')}
                    className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <span>← Ver Todos</span>
                  </button>
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar proyectos de Académica por nombre, docente o código..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs font-medium"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600 shrink-0">
                  <span className="font-bold text-slate-800">
                    Seleccionado: <strong className="text-emerald-700">{proyectoActivo.nombreProyecto}</strong>
                  </span>
                  {proyectoActivo.horaCreacion && (
                    <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                      <Clock className="w-3 h-3 text-emerald-600" />
                      Creado: {proyectoActivo.horaCreacion}
                    </span>
                  )}
                </div>
              </div>

              {/* Carrusel Horizontal de Proyectos de Académica para Selección Inmediata */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-3 mt-1">
                {proyectosFiltrados.map((p) => {
                  const seleccionado = p.id === proyectoActivo.id;
                  const alcanzado = p.alumnosFinal >= p.puntoEquilibrioAlumnos;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSeleccionarProyecto(p.id)}
                      className={`px-3 py-2 rounded-xl text-left transition-all shrink-0 w-64 border cursor-pointer ${
                        seleccionado
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md border-emerald-500 ring-2 ring-emerald-400'
                          : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 text-[10px]">
                        <span className={`font-mono font-bold truncate ${seleccionado ? 'text-emerald-200' : 'text-slate-500'}`}>
                          {p.codigoPrograma || 'PROG'} • {p.tipoProyecto}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold ${
                            seleccionado
                              ? 'bg-white/20 text-white'
                              : alcanzado
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {alcanzado ? 'BE Cubierto' : 'Por Cubrir'}
                        </span>
                      </div>

                      <h4 className={`text-xs font-bold line-clamp-1 mt-0.5 ${seleccionado ? 'text-white' : 'text-slate-900'}`}>
                        {p.nombreProyecto}
                      </h4>

                      <div className="flex items-center justify-between text-[10px] mt-1 pt-1 border-t border-white/20">
                        <span className={seleccionado ? 'text-emerald-100' : 'text-slate-600'}>
                          Prof. {p.nombreDocente.split(' ')[0]}
                        </span>
                        <span className={`font-mono font-bold ${seleccionado ? 'text-emerald-200' : 'text-emerald-700'}`}>
                          {p.alumnosFinal}/{p.alumnosProyectados} cupos
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ficha Resumen del Proyecto Académico Seleccionado con Botón de Automatización 1-Clic */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white px-4 sm:px-6 py-3 border-b border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
              <div className="flex items-start md:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-base border border-emerald-500/40 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-mono text-emerald-300 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      {proyectoActivo.codigoPrograma || 'PROG-2026'}
                    </span>
                    <span className="text-slate-300">
                      Docente: <strong className="text-white">{proyectoActivo.nombreDocente}</strong>
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-300">
                      Carga: <strong className="text-white">{proyectoActivo.horasClaseTotales || 24} hrs</strong>
                    </span>
                    {proyectoActivo.fechaProgramacion && (
                      <>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-300">
                          Fecha: <strong className="text-white">{proyectoActivo.fechaProgramacion}</strong>
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                    {proyectoActivo.nombreProyecto}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-center shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleAplicarEstrategiaAutomatica(proyectoActivo)}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Aplica la configuración recomendada de preventa y presupuesto en 1 clic"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>⚡ Aplicar Automático</span>
                </button>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Precio Regular Sugerido</span>
                  <span className="text-sm sm:text-base font-black font-mono text-emerald-400">
                    {formatearMoneda(proyectoActivo.precioSugeridoConISV || proyectoActivo.precioSugeridoAlumno || 2500, moneda)}
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-700 hidden sm:block" />
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Break-Even (Meta Base)</span>
                  <span className="text-sm sm:text-base font-black font-mono text-amber-300">
                    {breakEven} alumnos ({inscritosActuales} confirmados)
                  </span>
                </div>
              </div>
            </div>

            {/* Selector de Pestañas Interactivas de Comercialización */}
            <div className="flex items-center gap-1 sm:gap-2 px-4 pt-3 bg-white border-b border-slate-200 overflow-x-auto no-scrollbar shrink-0">
              <button
                type="button"
                onClick={() => setSubTabActiva('proceso_venta')}
                className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  subTabActiva === 'proceso_venta'
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60 rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Target className="w-4 h-4 text-emerald-600" />
                <span>1. Proceso de Venta (Pipeline)</span>
              </button>

              <button
                type="button"
                onClick={() => setSubTabActiva('comercializacion')}
                className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  subTabActiva === 'comercializacion'
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60 rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <BadgePercent className="w-4 h-4 text-teal-600" />
                <span>2. Comercialización & Precios</span>
              </button>

              <button
                type="button"
                onClick={() => setSubTabActiva('redes_sociales')}
                className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  subTabActiva === 'redes_sociales'
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60 rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Share2 className="w-4 h-4 text-blue-600" />
                <span>3. Redes Sociales & Marketing</span>
              </button>

              <button
                type="button"
                onClick={() => setSubTabActiva('difusion_directa')}
                className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  subTabActiva === 'difusion_directa'
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60 rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-green-600" />
                <span>4. Difusión Directa (WhatsApp / Email)</span>
              </button>

              <button
                type="button"
                onClick={() => setSubTabActiva('simulador_opciones')}
                className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  subTabActiva === 'simulador_opciones'
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60 rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span>5. Simulador & Más Opciones</span>
              </button>
            </div>

            {/* Contenido Principal de las Pestañas de Comercialización */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">
          
          {/* =========================================================================
              PESTAÑA 1: PROCESO DE VENTA & PIPELINE DE ADMISIONES
              ========================================================================= */}
          {subTabActiva === 'proceso_venta' && (
            <div className="space-y-6">
              
              {/* Sección de Control de Decisión en Plazo de 20 Días Calendario Corridos */}
              <ControlDecisionComercialSection
                proyectos={proyectos}
                moneda={moneda}
                onGuardarProyecto={onGuardarProyecto}
                onVerDetalle={onVerDetalle}
                onNotificar={onNotificar}
                filtroProyectoId={proyectoActivo.id}
              />

              {/* Embudo de Conversión Visual Interactivo */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                      <Target className="w-4 h-4 text-emerald-600" />
                      <span>Embudo de Admisiones & Etapas de Conversión</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Actualiza en vivo el flujo de prospectos desde la primera interacción hasta el cierre de matrícula.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800">
                    <span>Tasa de Conversión:</span>
                    <strong className="text-emerald-700 font-mono text-sm">{tasaConversion.toFixed(1)}%</strong>
                  </div>
                </div>

                {/* 4 Pasos del Embudo con Inputs Editables */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  
                  {/* Etapa 1: Leads Generados */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px]">1</span>
                        Leads Generados
                      </span>
                      <Users className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={leadsInput}
                      onChange={(e) => setLeadsInput(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-base font-black font-mono text-blue-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 block">Prospectos interesados totales</span>
                  </div>

                  {/* Etapa 2: Prospectos Calificados */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-[11px]">2</span>
                        Calificados (Perfil)
                      </span>
                      <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={calificadosInput}
                      onChange={(e) => setCalificadosInput(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-base font-black font-mono text-teal-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 block">Cumplen requisitos de admisión</span>
                  </div>

                  {/* Etapa 3: Cupos Reservados */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[11px]">3</span>
                        Reservas con Abono
                      </span>
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={reservasInput}
                      onChange={(e) => setReservasInput(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-base font-black font-mono text-amber-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 block">Pre-matrícula confirmada</span>
                  </div>

                  {/* Etapa 4: Alumnos Inscritos Definitivos */}
                  <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-300 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                      <span className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px]">4</span>
                        Inscritos (Cierre)
                      </span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <input
                      type="number"
                      min={4}
                      value={inscritosInput}
                      onChange={(e) => setInscritosInput(Math.max(4, parseInt(e.target.value) || 4))}
                      className="w-full bg-white border border-emerald-400 rounded-lg px-3 py-2 text-base font-black font-mono text-emerald-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-emerald-700 font-semibold block">
                      Meta: {proyectoActivo.alumnosProyectados} • BE: {breakEven}
                    </span>
                  </div>

                </div>

                {/* Asignación de Asesor & Canal Principal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Asesor de Admisiones Responsable
                    </label>
                    <select
                      value={asesorAsignado}
                      onChange={(e) => setAsesorAsignado(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                    >
                      <option value="Lic. Carlos Mendoza - Admisiones">Lic. Carlos Mendoza - Admisiones</option>
                      <option value="Licda. Sofía Reyes - Cuentas Corporativas">Licda. Sofía Reyes - Cuentas Corporativas</option>
                      <option value="Lic. Roberto Durón - Ventas Digitales">Lic. Roberto Durón - Ventas Digitales</option>
                      <option value="Licda. Elena Morales - Admisiones Postgrado">Licda. Elena Morales - Admisiones Postgrado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Canal Primario de Captación
                    </label>
                    <select
                      value={canalPrincipal}
                      onChange={(e) => setCanalPrincipal(e.target.value as MetodoVenta)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                    >
                      <option value="Publicidad Paga (Ads)">Publicidad Paga (Ads / Meta / Google)</option>
                      <option value="Redes sociales">Redes Sociales Orgánicas</option>
                      <option value="Email Marketing">Email Marketing Corporativo / Base Exalumnos</option>
                      <option value="Convenios / Empresas">Convenios / Empresas B2B</option>
                      <option value="Referidos">Referidos y Recomendaciones</option>
                      <option value="WhatsApp">WhatsApp Business / Chat</option>
                      <option value="Llamadas / Telemarketing">Llamadas / Telemarketing</option>
                      <option value="Página Web">Página Web / Portal Institucional</option>
                    </select>
                  </div>
                </div>

                {/* Botón de Guardar Proceso de Venta */}
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleGuardarProcesoVenta}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-all hover:scale-[1.01] cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Guardar Avance del Embudo de Ventas</span>
                  </button>
                </div>

              </div>

              {/* Generador de Cotización Rápida para Prospectos */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span>Generador de Cotización Inmediata para Clientes / Empresas</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Prepara una cotización formal lista para enviar por correo o WhatsApp con un solo clic.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Nombre del Prospecto</label>
                    <input
                      type="text"
                      placeholder="Ej. Ing. Juan Pérez"
                      value={nombreClienteCotizacion}
                      onChange={(e) => setNombreClienteCotizacion(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Empresa / Institución</label>
                    <input
                      type="text"
                      placeholder="Ej. Banco de Occidente / Particular"
                      value={empresaClienteCotizacion}
                      onChange={(e) => setEmpresaClienteCotizacion(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  <div className="flex items-center gap-2 self-end pb-1.5">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={incluirISVCotizacion}
                        onChange={(e) => setIncluirISVCotizacion(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Incluir 15% ISV en desglose fiscal</span>
                    </label>
                  </div>
                </div>

                {/* Previsualización y Copiado de Cotización */}
                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs space-y-2 relative">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] border-b border-slate-800 pb-2">
                    <span>COTIZACIÓN COMERCIAL OFICIAL • SUMMIT IMPULSA</span>
                    <button
                      type="button"
                      onClick={() => {
                        const texto = `*COTIZACIÓN DE CAPACITACIÓN PROFESIONAL*\n` +
                          `SUMMIT IMPULSA S. DE R.L. | RTN: 05019026435770\n\n` +
                          `Atención: ${nombreClienteCotizacion || 'Estimado(a) Cliente'} (${empresaClienteCotizacion || 'Corporativo'})\n` +
                          `Programa: ${proyectoActivo.nombreProyecto}\n` +
                          `Carga Horaria: ${proyectoActivo.horasClaseTotales || 24} Horas Académicas\n` +
                          `Docente Facilitador: ${proyectoActivo.nombreDocente}\n` +
                          `Fecha Estimada: ${proyectoActivo.fechaProgramacion || 'A coordinar'}\n\n` +
                          `INVERSIÓN POR PARTICIPANTE:\n` +
                          `- Precio Neto: ${formatearMoneda(proyectoActivo.precioSugeridoAlumno || 2500, moneda)}\n` +
                          (incluirISVCotizacion ? `- 15% ISV: ${formatearMoneda((proyectoActivo.precioSugeridoAlumno || 2500) * 0.15, moneda)}\n- Total Facturado: ${formatearMoneda(proyectoActivo.precioSugeridoConISV || 2875, moneda)}\n` : '') +
                          `\nCondiciones: Factura legal SAR con CAI institucional. Incluye diploma y material digital.`;

                        copiarAlPortapapeles(texto, 'cotizacion');
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-sans text-xs font-bold transition-colors cursor-pointer"
                    >
                      {copiadoTexto === 'cotizacion' ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiadoTexto === 'cotizacion' ? '¡Cotización Copiada!' : 'Copiar Cotización'}</span>
                    </button>
                  </div>

                  <p className="text-slate-300">
                    Propuesta para: <strong className="text-emerald-300">{nombreClienteCotizacion || '[Nombre Cliente]'}</strong> • {empresaClienteCotizacion || '[Empresa]'}
                  </p>
                  <p className="text-white font-bold">
                    Programa: {proyectoActivo.nombreProyecto} ({proyectoActivo.horasClaseTotales || 24} hrs con {proyectoActivo.nombreDocente})
                  </p>
                  <p className="text-emerald-400 font-bold">
                    Inversión: {formatearMoneda(incluirISVCotizacion ? (proyectoActivo.precioSugeridoConISV || 2875) : (proyectoActivo.precioSugeridoAlumno || 2500), moneda)} por participante
                  </p>
                </div>

              </div>

            </div>
          )}

          {/* =========================================================================
              PESTAÑA 2: COMERCIALIZACIÓN & ESTRATEGIA DE PRECIOS
              ========================================================================= */}
          {subTabActiva === 'comercializacion' && (
            <div className="space-y-6">
              
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                      <BadgePercent className="w-4 h-4 text-teal-600" />
                      <span>Fases de Comercialización y Precios Promocionales</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Define la fase activa del programa (Early Bird, Regular o Cierre) para optimizar la velocidad de matrícula.
                    </p>
                  </div>

                  <span className="px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-xs font-bold">
                    Fase Actual: {faseComercial}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Fase Comercial Activa
                    </label>
                    <select
                      value={faseComercial}
                      onChange={(e) => setFaseComercial(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none cursor-pointer"
                    >
                      <option value="Preventa Early Bird">Preventa Early Bird (Descuento)</option>
                      <option value="Venta Regular">Venta Regular (Precio Estándar)</option>
                      <option value="Cierre de Matrícula">Cierre de Matrícula (Últimos Cupos)</option>
                      <option value="Lanzamiento Institucional">Lanzamiento Institucional</option>
                      <option value="In Company / Corporativo">In Company / Corporativo B2B</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      % Descuento Preventa Early Bird
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={descuentoEarlyBirdPct}
                        onChange={(e) => setDescuentoEarlyBirdPct(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Fecha Límite de Preventa
                    </label>
                    <input
                      type="date"
                      value={fechaLimitePreventa}
                      onChange={(e) => setFechaLimitePreventa(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Comparativa de Estructura de Precios */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Precio Regular Neto</span>
                    <span className="text-base font-black font-mono text-slate-800">
                      {formatearMoneda(proyectoActivo.precioSugeridoAlumno || 2500, moneda)}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Definido por Académica</span>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Precio Regular + ISV (15%)</span>
                    <span className="text-base font-black font-mono text-slate-900">
                      {formatearMoneda(proyectoActivo.precioSugeridoConISV || 2875, moneda)}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Precio de lista final</span>
                  </div>

                  <div className="bg-teal-50 p-3.5 rounded-xl border border-teal-200">
                    <span className="text-[10px] text-teal-800 block uppercase font-bold">Precio Early Bird (-{descuentoEarlyBirdPct}%)</span>
                    <span className="text-base font-black font-mono text-teal-700">
                      {formatearMoneda(
                        Math.round((proyectoActivo.precioSugeridoConISV || 2875) * (1 - descuentoEarlyBirdPct / 100)),
                        moneda
                      )}
                    </span>
                    <span className="text-[10px] text-teal-700 block mt-0.5">Ahorro para el estudiante</span>
                  </div>

                  <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-300">
                    <span className="text-[10px] text-emerald-800 block uppercase font-bold">Break-Even de Alumnos</span>
                    <span className="text-base font-black font-mono text-emerald-800">
                      {breakEven} inscritos
                    </span>
                    <span className="text-[10px] text-emerald-700 block mt-0.5">Cubre 100% de costos</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-500">
                    Los cambios en precios actualizan automáticamente las métricas fiscales y el desglose de ingresos.
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGuardarEstrategiaComercial}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Guardar Precios
                    </button>

                    <button
                      type="button"
                      onClick={handleAutorizarYEnviarAGeneral}
                      className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-md transition-all hover:scale-[1.02] flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Autorizar & Enviar a Gerencia General</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* =========================================================================
              PESTAÑA 3: REDES SOCIALES & MARKETING DIGITAL
              ========================================================================= */}
          {subTabActiva === 'redes_sociales' && (
            <div className="space-y-6">
              
              {/* Configuración de Pauta & Canales Digitales */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-blue-600" />
                      <span>Campañas de Pauta Publicitaria & Redes Sociales</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Asigna presupuesto para Meta Ads (Facebook/Instagram), LinkedIn y Google Ads, y genera copys de venta listos.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Plataforma Digital de Lanzamiento
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCanalPauta('meta')}
                        className={`p-2 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                          canalPauta === 'meta'
                            ? 'bg-blue-50 border-blue-500 text-blue-800 ring-1 ring-blue-500'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Meta (FB/IG)
                      </button>

                      <button
                        type="button"
                        onClick={() => setCanalPauta('linkedin')}
                        className={`p-2 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                          canalPauta === 'linkedin'
                            ? 'bg-blue-50 border-blue-500 text-blue-800 ring-1 ring-blue-500'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        LinkedIn Ads
                      </button>

                      <button
                        type="button"
                        onClick={() => setCanalPauta('tiktok')}
                        className={`p-2 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                          canalPauta === 'tiktok'
                            ? 'bg-blue-50 border-blue-500 text-blue-800 ring-1 ring-blue-500'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        TikTok Ads
                      </button>

                      <button
                        type="button"
                        onClick={() => setCanalPauta('google')}
                        className={`p-2 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                          canalPauta === 'google'
                            ? 'bg-blue-50 border-blue-500 text-blue-800 ring-1 ring-blue-500'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Google Ads
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Presupuesto de Pauta ({moneda})
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={pautaPresupuesto}
                      onChange={(e) => setPautaPresupuesto(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-black font-mono text-blue-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 block mt-1">Inversión directa en pauta digital</span>
                  </div>

                  <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Proyecciones de Campaña</span>
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-600">CAC Proyectado:</span>
                      <span className="font-mono text-emerald-700">{formatearMoneda(cacEstimado, moneda)}/alumno</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-600">ROAS Proyectado:</span>
                      <span className="font-mono text-blue-700">{roasEstimado.toFixed(2)}x inversión</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-600">Leads Estimados:</span>
                      <span className="font-mono text-purple-700">{Math.round(pautaPresupuesto / 45)} prospectos</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleGuardarRedesSociales}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Guardar Presupuesto de Pauta
                  </button>
                </div>

              </div>

              {/* Generador de Copies Persuasivos para Redes Sociales */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Generador de Copies Publicitarios Listos para Publicar</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Redacción publicitaria optimizada con ganchos de conversión, propuesta de valor y llamados a la acción.
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setTipoCopy('instagram_facebook')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        tipoCopy === 'instagram_facebook' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Instagram / Facebook
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoCopy('linkedin')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        tipoCopy === 'linkedin' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      LinkedIn B2B
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoCopy('tiktok_reels')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        tipoCopy === 'tiktok_reels' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      TikTok / Reels Corto
                    </button>
                  </div>
                </div>

                {/* Área de Visualización y Copiado de Copy */}
                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                      {tipoCopy === 'instagram_facebook'
                        ? '📱 Copy Optimizado para Meta Ads (Feed & Stories)'
                        : tipoCopy === 'linkedin'
                        ? '💼 Copy Ejecutivo B2B para LinkedIn'
                        : '🎬 Guión / Copy Dinámico para TikTok & Reels'}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        const copyActual =
                          tipoCopy === 'instagram_facebook'
                            ? copiesPublicitarios.instagram_facebook
                            : tipoCopy === 'linkedin'
                            ? copiesPublicitarios.linkedin
                            : copiesPublicitarios.tiktok_reels;
                        copiarAlPortapapeles(copyActual, 'copy_redes');
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      {copiadoTexto === 'copy_redes' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiadoTexto === 'copy_redes' ? '¡Copiado!' : 'Copiar Copy'}</span>
                    </button>
                  </div>

                  <pre className="text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                    {tipoCopy === 'instagram_facebook'
                      ? copiesPublicitarios.instagram_facebook
                      : tipoCopy === 'linkedin'
                      ? copiesPublicitarios.linkedin
                      : copiesPublicitarios.tiktok_reels}
                  </pre>
                </div>

                {/* Generador de Enlaces con UTMs */}
                <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                      Enlace de Campaña Rastreado con UTMs para Redes Sociales
                    </span>

                    <button
                      type="button"
                      onClick={() => copiarAlPortapapeles(enlaceUTM, 'enlace_utm')}
                      className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                    >
                      {copiadoTexto === 'enlace_utm' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiadoTexto === 'enlace_utm' ? '¡Enlace Copiado!' : 'Copiar Enlace'}</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    readOnly
                    value={enlaceUTM}
                    className="w-full bg-white border border-blue-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-700"
                  />
                </div>

              </div>

            </div>
          )}

          {/* =========================================================================
              PESTAÑA 4: DIFUSIÓN DIRECTA (WHATSAPP & EMAIL MARKETING)
              ========================================================================= */}
          {subTabActiva === 'difusion_directa' && (
            <div className="space-y-6">
              
              {/* WhatsApp Business Speech para Asesores */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      <span>Speech Comercial para WhatsApp Business (Admisiones)</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Plantilla prediseñada para asesores de admisiones lista para responder consultas o enviar mensajes masivos autorizados.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copiarAlPortapapeles(copiesPublicitarios.whatsappSpeech, 'whatsapp_speech')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiadoTexto === 'whatsapp_speech' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiadoTexto === 'whatsapp_speech' ? '¡Speech Copiado!' : 'Copiar Speech'}</span>
                    </button>

                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(copiesPublicitarios.whatsappSpeech)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir WhatsApp Web</span>
                    </a>
                  </div>
                </div>

                <div className="bg-emerald-950/90 text-emerald-100 p-4 rounded-xl space-y-2 border border-emerald-800">
                  <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
                    📱 Plantilla Lista para Enviar por WhatsApp
                  </div>
                  <pre className="text-xs font-sans whitespace-pre-wrap leading-relaxed text-slate-100 max-h-56 overflow-y-auto">
                    {copiesPublicitarios.whatsappSpeech}
                  </pre>
                </div>
              </div>

              {/* Campaña de Email Marketing Masivo */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-indigo-600" />
                      <span>Campaña de Email Marketing (Bases de Datos & Exalumnos)</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Estructura formal con asunto de alta apertura y cuerpo persuasivo para convocatorias masivas.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const correoCompleto = `Asunto: ${copiesPublicitarios.emailSubject}\n\n${copiesPublicitarios.emailBody}`;
                      copiarAlPortapapeles(correoCompleto, 'email_campana');
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiadoTexto === 'email_campana' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiadoTexto === 'email_campana' ? '¡Correo Copiado!' : 'Copiar Correo'}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Línea de Asunto Sugerida</span>
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      {copiesPublicitarios.emailSubject}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <pre className="text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                      {copiesPublicitarios.emailBody}
                    </pre>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* =========================================================================
              PESTAÑA 5: SIMULADOR & MÁS OPCIONES COMERCIALES
              ========================================================================= */}
          {subTabActiva === 'simulador_opciones' && (
            <div className="space-y-6">
              
              {/* Simulador de Matrícula Adicional vs Utilidad */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      <span>Simulador de Escalabilidad Comercial en Vivo</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Calcula qué ocurre con la facturación y la rentabilidad neta si la fuerza de ventas consigue alumnos extra.
                    </p>
                  </div>
                </div>

                <div className="bg-purple-50/70 p-4 rounded-xl border border-purple-200 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-purple-900">
                    <span>Simular Alumnos Adicionales a la Matrícula Actual:</span>
                    <span className="font-mono text-base font-black text-purple-700">
                      +{simuladorAlumnosExtra} alumnos ({inscritosActuales + simuladorAlumnosExtra} totales)
                    </span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={25}
                    step={1}
                    value={simuladorAlumnosExtra}
                    onChange={(e) => setSimuladorAlumnosExtra(parseInt(e.target.value) || 0)}
                    className="w-full accent-purple-600 cursor-pointer"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="bg-white p-3 rounded-lg border border-purple-200 text-center">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Facturación Simulada</span>
                      <span className="text-sm sm:text-base font-black font-mono text-purple-900">
                        {formatearMoneda(facturacionProyectada, moneda)}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-purple-200 text-center">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Margen Neto Estimado</span>
                      <span className="text-sm sm:text-base font-black font-mono text-emerald-700">
                        {formatearMoneda(margenEstimadoLPS, moneda)}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-purple-200 text-center">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Superávit vs Break-Even</span>
                      <span className="text-sm sm:text-base font-black font-mono text-blue-700">
                        +{(inscritosActuales + simuladorAlumnosExtra) - breakEven} alumnos
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Acciones Rápidas & Enlaces Estratégicos */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-emerald-600" />
                  <span>Acceso a Herramientas Integrales del Proyecto</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      onEditarProyecto(proyectoActivo);
                    }}
                    className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-left transition-all flex flex-col justify-between gap-2 cursor-pointer shadow-2xs group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-950">Formulario Comercial Completo</span>
                      <Edit3 className="w-4 h-4 text-emerald-700 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-tight">
                      Abre el modal de edición de datos para ajustar fechas, costos, profesores o metas de ingresos.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onVerDetalle(proyectoActivo);
                    }}
                    className="p-3.5 rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 text-left transition-all flex flex-col justify-between gap-2 cursor-pointer shadow-2xs group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-blue-950">Ficha Técnica / One-Pager</span>
                      <Eye className="w-4 h-4 text-blue-700 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-[11px] text-blue-800 leading-tight">
                      Visualiza el desglose financiero, fiscal SAR y curricular completo del proyecto.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={handleAutorizarYEnviarAGeneral}
                    className="p-3.5 rounded-xl border border-teal-300 bg-teal-50 hover:bg-teal-100 text-left transition-all flex flex-col justify-between gap-2 cursor-pointer shadow-2xs group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-teal-950">Enviar a Gerencia General</span>
                      <Send className="w-4 h-4 text-teal-700 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-[11px] text-teal-800 leading-tight">
                      Concluye la fase comercial y remite el programa al dictamen final ejecutivo.
                    </p>
                  </button>
                </div>
              </div>

            </div>
          )}

            </div>
          </>
        )}

        {/* Footer del Modal con Acciones de Guardado */}
        <div className="bg-white px-4 sm:px-6 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono w-full sm:w-auto justify-between sm:justify-start">
            <span className="flex items-center gap-1.5 text-slate-700 font-sans font-bold">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              {vistaModal === 'catalogo_resumen' ? 'Proyectos Elaborados por Académica:' : 'Sello de Creación Académica:'}
            </span>
            <strong className="text-emerald-700 font-bold">
              {vistaModal === 'catalogo_resumen'
                ? `${proyectos.length} Programas Registrados`
                : proyectoActivo.horaCreacion || 'Automático'}
            </strong>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cerrar
            </button>

            {vistaModal === 'catalogo_resumen' ? (
              <button
                type="button"
                onClick={handleAutomatizarTodosLosPendientes}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs rounded-xl shadow-md transition-all hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Automatizar Todos los Pendientes ({resumenEjecutivo.pendientes})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAutorizarYEnviarAGeneral}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-md transition-all hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Guardar y Autorizar Envío a Gerencia General</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
