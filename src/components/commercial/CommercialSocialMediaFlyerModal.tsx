import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  X,
  Sparkles,
  Copy,
  Download,
  Share2,
  CheckCircle2,
  Save,
  RefreshCw,
  Sliders,
  Calendar,
  DollarSign,
  Users,
  Phone,
  ExternalLink,
  MessageSquare,
  Award,
  Layers,
  Eye,
  Check,
  Palette,
  Layout,
  Plus,
  Trash2,
  Clock,
  ShieldCheck,
  AlertCircle,
  FileText,
  Megaphone,
  Smartphone,
  Tv,
  Settings,
  Hash,
  Square,
  ArrowRight,
} from 'lucide-react';
import {
  ProyectoEducativo,
  Moneda,
  PublicidadRedesSocialesConfig,
  FormatoPublicidad,
  TemaVisualPublicidad,
  CamposSeleccionadosPublicidad,
  TextosPersonalizadosPublicidad,
  PreferenciasRedesSocialesComercial,
} from '../../types';
import { formatearMoneda } from '../../utils/calculations';
import { SUMMIT_BRANDING } from '../../utils/brandingUtils';
import { CREDENCIALES_GERENCIAS } from '../../utils/gerenciasCredenciales';
import { 
  obtenerPreferenciasRedesSociales, 
  generarCopyPublicitarioConPreferencias,
  DESCRIPCIONES_TONOS,
  FORMATOS_PUBLICIDAD_DISPONIBLES
} from '../../utils/socialPreferencesUtils';
import {
  obtenerDimensionesFormato,
  dibujarFlyerCanvas,
  descargarFlyerFormato,
  descargarPackMultiformato,
} from '../../utils/flyerCanvasRenderer';
import { CommercialSocialPreferencesModal } from './CommercialSocialPreferencesModal';

interface CommercialSocialMediaFlyerModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyectoInicial?: ProyectoEducativo | null;
  formatoInicial?: FormatoPublicidad;
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto: (p: ProyectoEducativo) => void;
  onNotificar?: (mensaje: string) => void;
}

// Valores por defecto para inicialización inteligente
const DEFAULT_CAMPOS: CamposSeleccionadosPublicidad = {
  incluirTitulo: true,
  incluirSubtitulo: true,
  incluirBadgeModalidad: true,
  incluirDocente: true,
  incluirFechasHorario: true,
  incluirHorasCertificacion: true,
  incluirTemario: true,
  incluirPrecio: true,
  incluirDescuentoPreventa: true,
  incluirCuposUrgencia: true,
  incluirContactoWhatsApp: true,
  incluirLogoYCertificacion: true,
  incluirHashtags: true,
};

export const CommercialSocialMediaFlyerModal: React.FC<CommercialSocialMediaFlyerModalProps> = ({
  isOpen,
  onClose,
  proyectoInicial,
  formatoInicial,
  proyectos,
  moneda,
  onGuardarProyecto,
  onNotificar,
}) => {
  // Proyectos operativos aptos para comercialización
  const proyectosDisponibles = useMemo(() => {
    return proyectos.filter((p) => !p.esSilaboBase && p.tipoRegistro !== 'silabo_base');
  }, [proyectos]);

  // Proyecto seleccionado
  const [proyectoSeleccionadoId, setProyectoSeleccionadoId] = useState<string>(() => {
    if (proyectoInicial?.id) return proyectoInicial.id;
    return proyectosDisponibles[0]?.id || '';
  });

  const proyectoActual = useMemo(() => {
    return proyectosDisponibles.find((p) => p.id === proyectoSeleccionadoId) || proyectoInicial || proyectosDisponibles[0] || null;
  }, [proyectosDisponibles, proyectoSeleccionadoId, proyectoInicial]);

  // Formato y tema
  const [formato, setFormato] = useState<FormatoPublicidad>(() => {
    if (formatoInicial) return formatoInicial;
    const prefs = obtenerPreferenciasRedesSociales();
    return prefs.formatoPredeterminado || 'cuadrado';
  });

  useEffect(() => {
    if (formatoInicial) {
      setFormato(formatoInicial);
    }
  }, [formatoInicial]);

  const [temaVisual, setTemaVisual] = useState<TemaVisualPublicidad>('summit_corporativo');

  // Campos seleccionados
  const [campos, setCampos] = useState<CamposSeleccionadosPublicidad>(DEFAULT_CAMPOS);

  // Textos personalizados
  const [textos, setTextos] = useState<TextosPersonalizadosPublicidad>({
    titularGancho: '',
    subtitulo: '',
    docenteTitulo: '',
    temasDestacados: [],
    mensajeUrgencia: '¡Cupos Limitados! Asegura tu inscripción oficial hoy.',
    telefonoContacto: '+504 9500-1234',
    linkRegistro: 'https://summitimpulsaglobal.com',
    notaPie: 'Certificación oficial emitida por Summit Impulsa Global.',
    precioPersonalizado: undefined,
    precioPreventaPersonalizado: undefined,
  });

  // Viñeta nueva temporal
  const [nuevoTemaTexto, setNuevoTemaTexto] = useState('');

  // Preferencias de Redes Sociales
  const [preferencias, setPreferencias] = useState<PreferenciasRedesSocialesComercial>(obtenerPreferenciasRedesSociales);
  const [mostrarModalPreferencias, setMostrarModalPreferencias] = useState(false);

  // Recargar preferencias al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setPreferencias(obtenerPreferenciasRedesSociales());
    }
  }, [isOpen]);

  // Estados de retroalimentación
  const [mensajeEstado, setMensajeEstado] = useState<{ tipo: 'exito' | 'error' | 'info'; texto: string } | null>(null);
  const [copiandoImagen, setCopiandoImagen] = useState(false);
  const [guardandoConfig, setGuardandoConfig] = useState(false);

  // Referencia al canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Cargar configuración guardada del proyecto o inicializar
  useEffect(() => {
    if (!proyectoActual) return;

    // 1. Verificar si el proyecto ya tiene publicidadConfig guardada
    let configGuardada: PublicidadRedesSocialesConfig | null = proyectoActual.publicidadConfig || null;

    // 2. Si no en el proyecto, revisar en localStorage
    if (!configGuardada) {
      try {
        const item = localStorage.getItem(`summit_flyer_config_${proyectoActual.id}`);
        if (item) {
          configGuardada = JSON.parse(item);
        }
      } catch (e) {
        console.warn('No se pudo leer config de localStorage', e);
      }
    }

    if (configGuardada) {
      setFormato(configGuardada.formato || 'cuadrado');
      setTemaVisual(configGuardada.temaVisual || 'summit_corporativo');
      setCampos({ ...DEFAULT_CAMPOS, ...(configGuardada.camposSeleccionados || {}) });
      const ctaDefault = preferencias.plantillasCTA.find((c) => c.id === preferencias.ctaPredeterminadoId) || preferencias.plantillasCTA[0];
      const plantillaTags = preferencias.plantillasHashtags.find((p) => p.id === preferencias.plantillaHashtagsActivaId) || preferencias.plantillasHashtags[0];

      setTextos({
        titularGancho: configGuardada.textosPersonalizados?.titularGancho || proyectoActual.nombreProyecto,
        subtitulo: configGuardada.textosPersonalizados?.subtitulo || proyectoActual.tipoProyecto || 'Programa de Especialización Ejecutiva',
        docenteTitulo: configGuardada.textosPersonalizados?.docenteTitulo || `${proyectoActual.nombreDocente} • Docente Especialista`,
        temasDestacados: configGuardada.textosPersonalizados?.temasDestacados?.length
          ? configGuardada.textosPersonalizados.temasDestacados
          : extraerTemasPredeterminados(proyectoActual),
        mensajeUrgencia: configGuardada.textosPersonalizados?.mensajeUrgencia || ctaDefault?.texto || '¡Apertura Confirmada! Últimos cupos para matrícula.',
        telefonoContacto: configGuardada.textosPersonalizados?.telefonoContacto || preferencias.telefonoWhatsAppPredeterminado || '+504 9500-1234',
        linkRegistro: configGuardada.textosPersonalizados?.linkRegistro || preferencias.linkRegistroPredeterminado || 'https://summitimpulsaglobal.com',
        notaPie: configGuardada.textosPersonalizados?.notaPie || preferencias.piePaginaPredeterminado || 'Acreditado y formalizado por Summit Impulsa Global, S.A.',
        precioPersonalizado: configGuardada.textosPersonalizados?.precioPersonalizado,
        precioPreventaPersonalizado: configGuardada.textosPersonalizados?.precioPreventaPersonalizado,
        ctaTexto: configGuardada.textosPersonalizados?.ctaTexto || ctaDefault?.texto || '👉 RESERVA TU CUPO O SOLICITA INFORMACIÓN:',
        hashtags: configGuardada.textosPersonalizados?.hashtags?.length ? configGuardada.textosPersonalizados.hashtags : (plantillaTags ? [...plantillaTags.hashtags] : ['#SummitImpulsa', '#EducacionEjecutiva']),
        tonoVoz: configGuardada.textosPersonalizados?.tonoVoz || preferencias.tonoVozPredeterminado,
      });
    } else {
      // Configuración predeterminada inicial basada en datos reales del proyecto y preferencias de redes sociales
      setFormato('cuadrado');
      setTemaVisual('summit_corporativo');
      setCampos(DEFAULT_CAMPOS);
      const precioBase = proyectoActual.precioSugeridoConISV || proyectoActual.precioSugeridoAlumno || 2500;
      const desc = proyectoActual.descuentoPreventaPct || 15;
      const preventa = proyectoActual.precioEarlyBird || Math.round(precioBase * (1 - desc / 100));

      const ctaDefault = preferencias.plantillasCTA.find((c) => c.id === preferencias.ctaPredeterminadoId) || preferencias.plantillasCTA[0];
      const plantillaTags = preferencias.plantillasHashtags.find((p) => p.id === preferencias.plantillaHashtagsActivaId) || preferencias.plantillasHashtags[0];

      let mensajeCta = ctaDefault ? ctaDefault.texto : '¡Apertura Confirmada! Cupos limitados para garantizar interactividad.';
      if (preferencias.tonoVozPredeterminado === 'urgente_persuasivo') {
        mensajeCta = '⚡ ¡Últimos cupos con precio especial de preventa!';
      } else if (preferencias.tonoVozPredeterminado === 'ejecutivo_formal') {
        mensajeCta = '🏛️ Convocatoria Oficial para Directores y Ejecutivos';
      } else if (preferencias.tonoVozPredeterminado === 'academico_prestigio') {
        mensajeCta = '🎓 Certificación Curricular con Horas Acreditadas';
      } else if (preferencias.tonoVozPredeterminado === 'cercano_dinamico') {
        mensajeCta = '🚀 ¡Eleva tu perfil profesional con sesiones 100% en vivo!';
      }

      setTextos({
        titularGancho: proyectoActual.nombreProyecto,
        subtitulo: proyectoActual.tipoProyecto || 'Programa de Especialización Ejecutiva',
        docenteTitulo: `${proyectoActual.nombreDocente}${proyectoActual.docenteClasificacion ? ` • ${proyectoActual.docenteClasificacion}` : ' • Facilitador Experto'}`,
        temasDestacados: extraerTemasPredeterminados(proyectoActual),
        mensajeUrgencia: mensajeCta,
        telefonoContacto: preferencias.telefonoWhatsAppPredeterminado || '+504 9500-1234',
        linkRegistro: preferencias.linkRegistroPredeterminado || 'https://summitimpulsaglobal.com',
        notaPie: preferencias.piePaginaPredeterminado || 'Acreditado y formalizado por Summit Impulsa Global, S.A.',
        precioPersonalizado: precioBase,
        precioPreventaPersonalizado: preventa,
        ctaTexto: ctaDefault?.texto || '👉 RESERVA TU CUPO O SOLICITA INFORMACIÓN:',
        hashtags: plantillaTags ? [...plantillaTags.hashtags] : ['#SummitImpulsa', '#EducacionEjecutiva'],
        tonoVoz: preferencias.tonoVozPredeterminado,
      });
    }
  }, [proyectoActual]);

  // Helper para extraer temas del temario o sesiones del proyecto
  function extraerTemasPredeterminados(p: ProyectoEducativo): string[] {
    const list: string[] = [];
    if (p.temasImpartir) {
      const lineas = p.temasImpartir.split(/[\n,;•-]+/).map((t) => t.trim()).filter((t) => t.length > 5);
      if (lineas.length > 0) {
        list.push(...lineas.slice(0, 4));
      }
    }
    if (list.length < 3 && p.sesionesClase && p.sesionesClase.length > 0) {
      p.sesionesClase.forEach((s) => {
        if (list.length < 4 && s.tema && !list.includes(s.tema)) {
          list.push(s.tema);
        }
      });
    }
    if (list.length === 0) {
      list.push('Metodología práctica orientada a casos reales');
      list.push('Herramientas estratégicas y análisis de desempeño');
      list.push('Ejercicios aplicados y retroalimentación docente');
      list.push('Proyecto final y acreditación con diploma oficial');
    }
    return list;
  }

  // Dimensiones del lienzo según formato
  const dimensiones = useMemo(() => {
    return obtenerDimensionesFormato(formato);
  }, [formato]);

  // Función de renderizado del canvas
  const dibujarFlyerEnCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !proyectoActual) return;

    dibujarFlyerCanvas(canvas, {
      formato,
      proyecto: proyectoActual,
      temaVisual,
      campos,
      textos,
      moneda,
      preferencias,
    });
  }, [formato, proyectoActual, temaVisual, campos, textos, moneda, preferencias]);

  // Estado para exportación masiva de formatos
  const [generandoPack, setGenerandoPack] = useState(false);

  // Descarga secuencial de paquete multiformato (1:1 + 9:16 + 4:5 + 16:9)
  const handleDescargarPackMultiformato = async () => {
    if (!proyectoActual) return;
    setGenerandoPack(true);
    setMensajeEstado({
      tipo: 'info',
      texto: 'Iniciando generación de paquete multiformato (1:1, 9:16, 4:5, 16:9)...',
    });

    try {
      await descargarPackMultiformato(
        {
          proyecto: proyectoActual,
          temaVisual,
          campos,
          textos,
          moneda,
          preferencias,
        },
        (actual, total, f) => {
          const info = FORMATOS_PUBLICIDAD_DISPONIBLES.find((item) => item.id === f);
          setMensajeEstado({
            tipo: 'info',
            texto: `Generando archivo ${actual} de ${total}: ${info?.nombre || f}...`,
          });
        }
      );

      setMensajeEstado({
        tipo: 'exito',
        texto: '¡Paquete multiformato descargado con éxito! Se obtuvieron las 4 versiones para tus redes.',
      });
      setTimeout(() => setMensajeEstado(null), 5000);
    } catch (err) {
      console.error('Error generando pack multiformato:', err);
      setMensajeEstado({
        tipo: 'error',
        texto: 'Hubo un inconveniente al generar el paquete de imágenes.',
      });
      setTimeout(() => setMensajeEstado(null), 4000);
    } finally {
      setGenerandoPack(false);
    }
  };

  /*
  const old_dibujar_unused = () => {
    const canvas = canvasRef.current;
    if (!canvas || !proyectoActual) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = dimensiones.width;
    const H = dimensiones.height;
    canvas.width = W;
    canvas.height = H;

    // 1. Fondos y Gradientes según Tema
    let gradBg: CanvasGradient;
    let accentColor = '#00D2D3';
    let accentSecundario = '#F59E0B';
    let cardBg = 'rgba(255, 255, 255, 0.07)';
    let cardBorder = 'rgba(255, 255, 255, 0.15)';
    let textPrimary = '#FFFFFF';
    let textSecondary = '#CBD5E1';

    if (temaVisual === 'summit_corporativo') {
      gradBg = ctx.createLinearGradient(0, 0, W, H);
      gradBg.addColorStop(0, '#0B192C');
      gradBg.addColorStop(0.4, '#1E3E62');
      gradBg.addColorStop(1, '#002B5B');
      accentColor = '#00ADB5';
      accentSecundario = '#F59E0B';
      cardBg = 'rgba(15, 23, 42, 0.65)';
      cardBorder = 'rgba(0, 173, 181, 0.35)';
    } else if (temaVisual === 'dark_tech') {
      gradBg = ctx.createLinearGradient(0, 0, W, H);
      gradBg.addColorStop(0, '#090D16');
      gradBg.addColorStop(0.5, '#0F172A');
      gradBg.addColorStop(1, '#1A103C');
      accentColor = '#10B981';
      accentSecundario = '#8B5CF6';
      cardBg = 'rgba(17, 24, 39, 0.75)';
      cardBorder = 'rgba(16, 185, 129, 0.4)';
    } else if (temaVisual === 'ejecutivo_prestigio') {
      gradBg = ctx.createLinearGradient(0, 0, W, H);
      gradBg.addColorStop(0, '#070C1E');
      gradBg.addColorStop(0.5, '#131D38');
      gradBg.addColorStop(1, '#0A0F24');
      accentColor = '#FBBF24';
      accentSecundario = '#60A5FA';
      cardBg = 'rgba(19, 29, 56, 0.7)';
      cardBorder = 'rgba(251, 191, 36, 0.4)';
    } else {
      // esmeralda_crecimiento
      gradBg = ctx.createLinearGradient(0, 0, W, H);
      gradBg.addColorStop(0, '#022C22');
      gradBg.addColorStop(0.45, '#064E3B');
      gradBg.addColorStop(1, '#042F2E');
      accentColor = '#34D399';
      accentSecundario = '#FBBF24';
      cardBg = 'rgba(6, 78, 59, 0.65)';
      cardBorder = 'rgba(52, 211, 153, 0.35)';
    }

    ctx.fillStyle = gradBg;
    ctx.fillRect(0, 0, W, H);

    // Decoraciones sutiles geométricas en el fondo
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1.5;
    const stepGrid = 60;
    for (let x = 0; x < W; x += stepGrid) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += stepGrid) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    // Halos de resplandor
    const radG1 = ctx.createRadialGradient(W * 0.85, H * 0.15, 10, W * 0.85, H * 0.15, W * 0.4);
    radG1.addColorStop(0, accentColor + '33');
    radG1.addColorStop(1, 'transparent');
    ctx.fillStyle = radG1;
    ctx.fillRect(0, 0, W, H);

    const radG2 = ctx.createRadialGradient(W * 0.15, H * 0.8, 10, W * 0.15, H * 0.8, W * 0.45);
    radG2.addColorStop(0, accentSecundario + '26');
    radG2.addColorStop(1, 'transparent');
    ctx.fillStyle = radG2;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // Marco exterior de alta gama
    ctx.save();
    ctx.strokeStyle = accentColor + '40';
    ctx.lineWidth = 3;
    ctx.strokeRect(28, 28, W - 56, H - 56);
    // Esquinas doradas/acentuadas
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 6;
    const cornerSize = 40;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(25, 25 + cornerSize);
    ctx.lineTo(25, 25);
    ctx.lineTo(25 + cornerSize, 25);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(W - 25 - cornerSize, 25);
    ctx.lineTo(W - 25, 25);
    ctx.lineTo(W - 25, 25 + cornerSize);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(25, H - 25 - cornerSize);
    ctx.lineTo(25, H - 25);
    ctx.lineTo(25 + cornerSize, H - 25);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(W - 25 - cornerSize, H - 25);
    ctx.lineTo(W - 25, H - 25);
    ctx.lineTo(W - 25, H - 25 - cornerSize);
    ctx.stroke();
    ctx.restore();

    let cursorY = 70;
    const paddingX = 65;
    const contentW = W - paddingX * 2;

    // 2. Encabezado Oficial Institucional
    if (campos.incluirLogoYCertificacion) {
      // Emblema circular 3D dibujado en canvas
      ctx.save();
      const logoRadius = 26;
      const logoX = paddingX + logoRadius;
      const logoY = cursorY + logoRadius;

      // Globo terráqueo azul con gradiente radial
      const globeGrad = ctx.createRadialGradient(logoX - 8, logoY - 8, 3, logoX, logoY, logoRadius);
      globeGrad.addColorStop(0, '#60A5FA');
      globeGrad.addColorStop(0.5, '#2563EB');
      globeGrad.addColorStop(1, '#0F2C69');
      ctx.fillStyle = globeGrad;
      ctx.beginPath();
      ctx.arc(logoX, logoY, logoRadius, 0, Math.PI * 2);
      ctx.fill();

      // Anillo orbital plateado
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(logoX, logoY, logoRadius + 8, logoRadius * 0.45, -Math.PI / 6, 0, Math.PI * 2);
      ctx.stroke();

      // Picos montañosos internos
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(logoX - 16, logoY + 12);
      ctx.lineTo(logoX - 5, logoY - 8);
      ctx.lineTo(logoX + 2, logoY + 4);
      ctx.lineTo(logoX + 10, logoY - 14);
      ctx.lineTo(logoX + 18, logoY + 12);
      ctx.closePath();
      ctx.fill();

      // Tipografía de Marca
      ctx.fillStyle = textPrimary;
      ctx.font = 'bold 26px system-ui, sans-serif';
      ctx.fillText('SUMMIT IMPULSA GLOBAL', logoX + logoRadius + 18, logoY - 3);

      ctx.fillStyle = accentColor;
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.letterSpacing = '1.5px';
      ctx.fillText('FORMACIÓN EJECUTIVA • CERTIFICACIÓN INTERNACIONAL', logoX + logoRadius + 18, logoY + 18);
      ctx.letterSpacing = '0px';

      // Sello derecho de Acreditación
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.roundRect(W - paddingX - 180, cursorY + 6, 180, 42, 8);
      ctx.fill();
      ctx.strokeStyle = accentSecundario + '80';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = accentSecundario;
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★ ACREDITACIÓN SAR & POA ★', W - paddingX - 90, cursorY + 24);
      ctx.fillStyle = '#E2E8F0';
      ctx.font = '10px system-ui, sans-serif';
      ctx.fillText('Validez Curricular 2026', W - paddingX - 90, cursorY + 38);
      ctx.textAlign = 'left';

      ctx.restore();
      cursorY += 80;
    } else {
      cursorY += 20;
    }

    // 3. Badge de Modalidad y Nivel
    if (campos.incluirBadgeModalidad) {
      ctx.save();
      const badgeText = `🔴 EN VIVO • ${proyectoActual.modalidad || 'VIRTUAL SINCRÓNICA (ZOOM)'}  |  NIVEL: ${proyectoActual.nivel || 'ESPECIALIZADO'}`.toUpperCase();
      ctx.font = 'bold 13px system-ui, sans-serif';
      const badgeW = ctx.measureText(badgeText).width + 36;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.roundRect(paddingX, cursorY, badgeW, 32, 16);
      ctx.fill();
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = accentColor;
      ctx.fillText(badgeText, paddingX + 18, cursorY + 21);
      ctx.restore();

      cursorY += 48;
    }

    // 4. Titular Principal y Subtítulo
    if (campos.incluirTitulo) {
      ctx.save();
      const titulo = textos.titularGancho || proyectoActual.nombreProyecto;
      ctx.fillStyle = textPrimary;

      // Calcular tamaño de fuente según longitud y formato
      let fontSize = formato === 'story' ? 44 : formato === 'banner' ? 38 : 42;
      if (titulo.length > 50) fontSize -= 6;
      ctx.font = `900 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

      // Word wrapping del titular
      const palabras = titulo.split(' ');
      let lineaActual = '';
      const lineasTitulo: string[] = [];

      for (let i = 0; i < palabras.length; i++) {
        const prueba = lineaActual + palabras[i] + ' ';
        const metrics = ctx.measureText(prueba);
        if (metrics.width > contentW && i > 0) {
          lineasTitulo.push(lineaActual);
          lineaActual = palabras[i] + ' ';
        } else {
          lineaActual = prueba;
        }
      }
      lineasTitulo.push(lineaActual);

      // Dibujar líneas de título con sombra de texto
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;

      lineasTitulo.forEach((linea) => {
        ctx.fillText(linea.trim(), paddingX, cursorY + fontSize * 0.9);
        cursorY += fontSize * 1.15;
      });
      ctx.restore();

      cursorY += 6;
    }

    // Subtítulo
    if (campos.incluirSubtitulo && textos.subtitulo) {
      ctx.save();
      ctx.fillStyle = accentColor;
      ctx.font = '600 18px system-ui, sans-serif';
      ctx.fillText(textos.subtitulo, paddingX, cursorY + 16);
      ctx.restore();
      cursorY += 34;
    }

    // 5. Docente Facilitador
    if (campos.incluirDocente) {
      ctx.save();
      const docenteNombre = textos.docenteTitulo || `${proyectoActual.nombreDocente} • Facilitador Especialista`;
      
      // Contenedor tarjeta docente
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.roundRect(paddingX, cursorY, contentW, 50, 10);
      ctx.fill();
      ctx.strokeStyle = cardBorder;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Ícono de facilitador
      ctx.fillStyle = accentSecundario;
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.fillText('🎓', paddingX + 16, cursorY + 32);

      ctx.fillStyle = textPrimary;
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillText(docenteNombre, paddingX + 50, cursorY + 31);

      ctx.restore();
      cursorY += 66;
    }

    // 6. Tarjetas de Metadatos (Fechas, Horario, Horas Acreditadas)
    if (campos.incluirFechasHorario || campos.incluirHorasCertificacion) {
      ctx.save();
      const cards: Array<{ label: string; valor: string; icono: string }> = [];

      if (campos.incluirFechasHorario) {
        cards.push({
          icono: '📅',
          label: 'INICIO & DÍAS',
          valor: `${proyectoActual.fechaProgramacion || 'Próximo Inicio'} • ${proyectoActual.diasClase || 'Lunes y Miércoles'}`,
        });
        cards.push({
          icono: '⏰',
          label: 'HORARIO DE CLASE',
          valor: proyectoActual.horario || '06:00 PM - 08:00 PM (En vivo)',
        });
      }

      if (campos.incluirHorasCertificacion) {
        cards.push({
          icono: '⏳',
          label: 'DURACIÓN CERTIFICADA',
          valor: `${proyectoActual.horasClase || 12} Horas Acreditadas`,
        });
      }

      const numCols = cards.length;
      const cardGap = 16;
      const singleCardW = (contentW - cardGap * (numCols - 1)) / numCols;
      const cardHeight = 68;

      cards.forEach((c, idx) => {
        const cX = paddingX + idx * (singleCardW + cardGap);
        ctx.fillStyle = cardBg;
        ctx.beginPath();
        ctx.roundRect(cX, cursorY, singleCardW, cardHeight, 10);
        ctx.fill();
        ctx.strokeStyle = cardBorder;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = accentColor;
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.fillText(`${c.icono} ${c.label}`, cX + 14, cursorY + 22);

        ctx.fillStyle = textPrimary;
        ctx.font = 'bold 13px system-ui, sans-serif';
        // Truncar si excede
        let valTxt = c.valor;
        if (ctx.measureText(valTxt).width > singleCardW - 28) {
          while (ctx.measureText(valTxt + '...').width > singleCardW - 28 && valTxt.length > 5) {
            valTxt = valTxt.slice(0, -1);
          }
          valTxt += '...';
        }
        ctx.fillText(valTxt, cX + 14, cursorY + 48);
      });

      ctx.restore();
      cursorY += cardHeight + 20;
    }

    // 7. Temario / Módulos Destacados
    if (campos.incluirTemario && textos.temasDestacados && textos.temasDestacados.length > 0) {
      ctx.save();
      const temasAMostrar = textos.temasDestacados.slice(0, formato === 'banner' ? 3 : 4);
      const boxH = 34 + temasAMostrar.length * 28;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.roundRect(paddingX, cursorY, contentW, boxH, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.stroke();

      ctx.fillStyle = accentSecundario;
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillText('✨ LO QUE APRENDERÁS EN ESTE PROGRAMA:', paddingX + 18, cursorY + 24);

      temasAMostrar.forEach((tema, idx) => {
        const itemY = cursorY + 48 + idx * 26;
        ctx.fillStyle = accentColor;
        ctx.font = 'bold 14px system-ui, sans-serif';
        ctx.fillText('✔', paddingX + 20, itemY);

        ctx.fillStyle = textSecondary;
        ctx.font = '500 13px system-ui, sans-serif';
        let tText = tema;
        if (ctx.measureText(tText).width > contentW - 60) {
          while (ctx.measureText(tText + '...').width > contentW - 60 && tText.length > 5) {
            tText = tText.slice(0, -1);
          }
          tText += '...';
        }
        ctx.fillText(tText, paddingX + 44, itemY);
      });

      ctx.restore();
      cursorY += boxH + 20;
    }

    // 8. Precios & Preventa Early Bird
    if (campos.incluirPrecio) {
      ctx.save();
      const precioBase = textos.precioPersonalizado ?? (proyectoActual.precioSugeridoConISV || proyectoActual.precioSugeridoAlumno || 2500);
      const precioPreventa = textos.precioPreventaPersonalizado ?? (proyectoActual.precioEarlyBird || Math.round(precioBase * 0.85));

      const priceBoxH = 74;
      const priceGrad = ctx.createLinearGradient(paddingX, cursorY, paddingX + contentW, cursorY);
      priceGrad.addColorStop(0, 'rgba(245, 158, 11, 0.18)');
      priceGrad.addColorStop(1, 'rgba(16, 185, 129, 0.18)');

      ctx.fillStyle = priceGrad;
      ctx.beginPath();
      ctx.roundRect(paddingX, cursorY, contentW, priceBoxH, 12);
      ctx.fill();
      ctx.strokeStyle = accentSecundario;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Columna izquierda: Precio Preventa y Regular
      ctx.fillStyle = accentSecundario;
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText('INVERSIÓN ESPECIAL CON DESCUENTO DE PREVENTA:', paddingX + 20, cursorY + 24);

      if (campos.incluirDescuentoPreventa && precioPreventa < precioBase) {
        // Precio Regular tachado
        ctx.fillStyle = '#94A3B8';
        ctx.font = 'bold 16px system-ui, sans-serif';
        const regularStr = formatearMoneda(precioBase, moneda);
        ctx.fillText(regularStr, paddingX + 20, cursorY + 54);
        const regW = ctx.measureText(regularStr).width;
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(paddingX + 16, cursorY + 49);
        ctx.lineTo(paddingX + 20 + regW + 4, cursorY + 49);
        ctx.stroke();

        // Precio Preventa Destacado
        ctx.fillStyle = '#10B981';
        ctx.font = '900 28px system-ui, sans-serif';
        ctx.fillText(formatearMoneda(precioPreventa, moneda), paddingX + regW + 36, cursorY + 56);

        // Badge Ahorro
        const ahorroPct = Math.round(((precioBase - precioPreventa) / precioBase) * 100);
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.roundRect(paddingX + regW + ctx.measureText(formatearMoneda(precioPreventa, moneda)).width + 48, cursorY + 36, 80, 24, 6);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.fillText(`AHORRA ${ahorroPct}%`, paddingX + regW + ctx.measureText(formatearMoneda(precioPreventa, moneda)).width + 56, cursorY + 52);
      } else {
        ctx.fillStyle = '#10B981';
        ctx.font = '900 28px system-ui, sans-serif';
        ctx.fillText(formatearMoneda(precioBase, moneda), paddingX + 20, cursorY + 56);
      }

      // Columna derecha: Facilidades / Cuotas
      ctx.fillStyle = textPrimary;
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('💳 Facilidades de Pago & 2 Cuotas', W - paddingX - 20, cursorY + 34);
      ctx.fillStyle = textSecondary;
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillText('Incluye Material Didáctico y Diploma', W - paddingX - 20, cursorY + 52);
      ctx.textAlign = 'left';

      ctx.restore();
      cursorY += priceBoxH + 16;
    }

    // 9. Mensaje de Urgencia
    if (campos.incluirCuposUrgencia && textos.mensajeUrgencia) {
      ctx.save();
      ctx.fillStyle = '#FEF3C7';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`⚡ ${textos.mensajeUrgencia} ⚡`, W / 2, cursorY + 16);
      ctx.textAlign = 'left';
      ctx.restore();
      cursorY += 32;
    }

    // 10. Hashtags Institucionales Dibujados en Canvas
    const bottomH = 95;
    const bottomY = H - bottomH - 35;

    if (campos.incluirHashtags !== false) {
      ctx.save();
      const plantillaTags = preferencias.plantillasHashtags.find((p) => p.id === preferencias.plantillaHashtagsActivaId) || preferencias.plantillasHashtags[0];
      const tagsADibujar = (textos.hashtags && textos.hashtags.length > 0)
        ? textos.hashtags
        : (plantillaTags ? plantillaTags.hashtags : ['#SummitImpulsa', '#EducacionEjecutiva']);

      const tagsY = bottomY - 26;
      let tagCursorX = paddingX;

      ctx.font = 'bold 11px system-ui, sans-serif';
      tagsADibujar.slice(0, formato === 'banner' ? 3 : 5).forEach((tag) => {
        const tagText = tag.startsWith('#') ? tag : `#${tag}`;
        const tagW = ctx.measureText(tagText).width + 16;
        if (tagCursorX + tagW < W - paddingX) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.beginPath();
          ctx.roundRect(tagCursorX, tagsY, tagW, 20, 5);
          ctx.fill();
          ctx.strokeStyle = accentColor + '70';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = accentColor;
          ctx.fillText(tagText, tagCursorX + 8, tagsY + 14);
          tagCursorX += tagW + 8;
        }
      });
      ctx.restore();
    }

    ctx.save();
    // Botón / Barra CTA
    const ctaGrad = ctx.createLinearGradient(paddingX, bottomY, paddingX + contentW, bottomY);
    ctaGrad.addColorStop(0, '#2563EB');
    ctaGrad.addColorStop(0.5, '#1D4ED8');
    ctaGrad.addColorStop(1, '#059669');

    ctx.fillStyle = ctaGrad;
    ctx.beginPath();
    ctx.roundRect(paddingX, bottomY, contentW, 64, 14);
    ctx.fill();
    ctx.strokeStyle = '#93C5FD';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Texto CTA Automático según Preferencias de Redes Sociales
    const ctaDefault = preferencias.plantillasCTA.find((c) => c.id === preferencias.ctaPredeterminadoId) || preferencias.plantillasCTA[0];
    const rawCta = (textos.ctaTexto || ctaDefault?.texto || '👉 RESERVA TU CUPO O SOLICITA INFORMACIÓN:').replace(/[\r\n]+/g, ' ');
    let ctaAMostrar = rawCta.startsWith('👉') || rawCta.startsWith('⚡') || rawCta.startsWith('📲') ? rawCta : `👉 ${rawCta}`;

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 16px system-ui, sans-serif';
    if (ctx.measureText(ctaAMostrar).width > contentW - 48) {
      while (ctx.measureText(ctaAMostrar + '...').width > contentW - 48 && ctaAMostrar.length > 15) {
        ctaAMostrar = ctaAMostrar.slice(0, -1);
      }
      ctaAMostrar += '...';
    }
    ctx.fillText(ctaAMostrar, paddingX + 24, bottomY + 28);

    // Datos de Contacto
    ctx.fillStyle = '#FEF08A';
    ctx.font = 'bold 16px system-ui, sans-serif';
    const tel = textos.telefonoContacto || '+504 9500-1234';
    ctx.fillText(`📲 WhatsApp: ${tel}`, paddingX + 24, bottomY + 51);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 14px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('🌐 ' + (textos.linkRegistro || 'summitimpulsaglobal.com'), W - paddingX - 24, bottomY + 39);
    ctx.textAlign = 'left';

    // Nota al pie institucional
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(textos.notaPie || 'SUMMIT IMPULSA GLOBAL, S.A. DE C.V. • RTN: 05019026435770 • San Pedro Sula, Honduras', W / 2, H - 42);
    ctx.textAlign = 'left';

    ctx.restore();
  };
  */

  // Handler: Guardar Configuración en el Proyecto y LocalStorage
  const handleGuardarConfiguracion = async () => {
    if (!proyectoActual) return;
    setGuardandoConfig(true);

    const configAGuardar: PublicidadRedesSocialesConfig = {
      formato,
      temaVisual,
      camposSeleccionados: { ...campos },
      textosPersonalizados: { ...textos },
      fechaUltimaGeneracion: new Date().toISOString(),
      historialGeneraciones: (proyectoActual.publicidadConfig?.historialGeneraciones || 0) + 1,
    };

    const proyectoActualizado: ProyectoEducativo = {
      ...proyectoActual,
      publicidadConfig: configAGuardar,
    };

    try {
      // Guardar en localStorage para acceso inmediato y offline
      localStorage.setItem(`summit_flyer_config_${proyectoActual.id}`, JSON.stringify(configAGuardar));

      // Guardar en el estado global mediante onGuardarProyecto
      onGuardarProyecto(proyectoActualizado);

      setMensajeEstado({
        tipo: 'exito',
        texto: '¡Configuración publicitaria guardada exitosamente! Se mantendrá guardada para cuando la vuelvas a consultar.',
      });

      if (onNotificar) {
        onNotificar(`Configuración publicitaria guardada para "${proyectoActual.nombreProyecto}"`);
      }
    } catch (e) {
      console.error(e);
      setMensajeEstado({
        tipo: 'error',
        texto: 'Hubo un error al guardar la configuración.',
      });
    } finally {
      setGuardandoConfig(false);
      setTimeout(() => setMensajeEstado(null), 4000);
    }
  };

  // Handler: Copiar Imagen al Portapapeles (PNG Blob)
  const handleCopiarImagen = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setCopiandoImagen(true);
    setMensajeEstado(null);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setCopiandoImagen(false);
        return;
      }

      try {
        if (navigator.clipboard && navigator.clipboard.write) {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          setMensajeEstado({
            tipo: 'exito',
            texto: '¡Imagen copiada al portapapeles! Ya puedes presionar Ctrl+V en WhatsApp Web, Facebook o Instagram.',
          });
        } else {
          // Fallback descarga automática si la API de clipboard no está soportada o permitida en iframe
          handleDescargarImagen();
          setMensajeEstado({
            tipo: 'info',
            texto: 'Imagen descargada en PNG para tus redes (el navegador requiere descarga en este contexto).',
          });
        }
      } catch (err) {
        console.warn('Fallo al copiar imagen al portapapeles, recurriendo a descarga', err);
        handleDescargarImagen();
        setMensajeEstado({
          tipo: 'info',
          texto: 'Imagen descargada como PNG para compartir directamente en tus redes sociales.',
        });
      } finally {
        setCopiandoImagen(false);
        setTimeout(() => setMensajeEstado(null), 5000);
      }
    }, 'image/png');
  };

  // Handler: Descargar Imagen PNG en Alta Resolución
  const handleDescargarImagen = () => {
    const canvas = canvasRef.current;
    if (!canvas || !proyectoActual) return;

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const safeName = (proyectoActual.nombreProyecto || 'curso')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-');
      const filename = `flyer-publicidad-${safeName}-${formato}.png`;

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setMensajeEstado({
        tipo: 'exito',
        texto: `¡Imagen descargada exitosamente como "${filename}"!`,
      });
      setTimeout(() => setMensajeEstado(null), 4000);
    } catch (e) {
      console.error('Error al descargar imagen', e);
    }
  };

  // Handler: Copiar Copy de Texto para Redes Sociales
  const handleCopiarCopyTexto = () => {
    if (!proyectoActual) return;

    const copyCompleto = generarCopyPublicitarioConPreferencias(
      proyectoActual,
      preferencias,
      moneda,
      {
        precioPersonalizado: textos.precioPersonalizado,
        precioPreventaPersonalizado: textos.precioPreventaPersonalizado,
        temas: textos.temasDestacados,
      }
    );

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(copyCompleto).then(() => {
        const tonoNombre = DESCRIPCIONES_TONOS[preferencias.tonoVozPredeterminado]?.nombre || 'Personalizado';
        setMensajeEstado({
          tipo: 'exito',
          texto: `¡Copy de publicación copiado! Formato aplicado: Tono "${tonoNombre}" con hashtags y CTA predeterminados.`,
        });
        setTimeout(() => setMensajeEstado(null), 4000);
      });
    }
  };

  // Handler: Compartir por WhatsApp Web
  const handleCompartirWhatsApp = () => {
    if (!proyectoActual) return;
    const precioBase = textos.precioPersonalizado ?? (proyectoActual.precioSugeridoConISV || proyectoActual.precioSugeridoAlumno || 2500);
    const mensaje = `¡Hola! Te comparto la información del curso "${textos.titularGancho || proyectoActual.nombreProyecto}" en Summit Impulsa Global.\nInversión: ${formatearMoneda(precioBase, moneda)}.\nHorario: ${proyectoActual.horario || '06:00 PM'}.\nMás información al WhatsApp: +504 9500-1234.`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  // Agregar viñeta al temario
  const handleAgregarTema = () => {
    if (!nuevoTemaTexto.trim()) return;
    setTextos((prev) => ({
      ...prev,
      temasDestacados: [...(prev.temasDestacados || []), nuevoTemaTexto.trim()],
    }));
    setNuevoTemaTexto('');
  };

  // Eliminar viñeta
  const handleEliminarTema = (index: number) => {
    setTextos((prev) => ({
      ...prev,
      temasDestacados: (prev.temasDestacados || []).filter((_, i) => i !== index),
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-7xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* CABECERA SUPERIOR */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white">
                  Generador de Publicidad & Flyers para Redes Sociales
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Gerencia Comercial
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Diseña, selecciona los campos publicitarios, copia la imagen al portapapeles y guárdala permanentemente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Selector de Proyecto */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <label htmlFor="select-proyecto-publicidad" className="sr-only">Proyecto a Publicitar</label>
              <select
                id="select-proyecto-publicidad"
                aria-label="Proyecto a Publicitar"
                value={proyectoSeleccionadoId}
                onChange={(e) => setProyectoSeleccionadoId(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none max-w-[200px] sm:max-w-xs truncate cursor-pointer"
              >
                {proyectosDisponibles.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-slate-100">
                    {p.nombreProyecto} ({p.nombreDocente})
                  </option>
                ))}
              </select>
            </div>

            {/* Acceso a Preferencias de Redes Sociales */}
            <button
              type="button"
              onClick={() => setMostrarModalPreferencias(true)}
              className="px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs border border-indigo-500/50 cursor-pointer"
              title="Configurar plantillas de hashtags, tonos de voz y llamadas a la acción (CTA) predeterminados"
            >
              <Settings className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden md:inline">Preferencias Redes</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NOTIFICACIÓN / ESTADO TOAST */}
        {mensajeEstado && (
          <div
            className={`px-4 py-2.5 text-xs font-bold flex items-center justify-between gap-2 shrink-0 ${
              mensajeEstado.tipo === 'exito'
                ? 'bg-emerald-950/90 border-b border-emerald-500 text-emerald-200'
                : mensajeEstado.tipo === 'error'
                ? 'bg-rose-950/90 border-b border-rose-500 text-rose-200'
                : 'bg-blue-950/90 border-b border-blue-500 text-blue-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {mensajeEstado.tipo === 'exito' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span>{mensajeEstado.texto}</span>
            </div>
            <button
              type="button"
              onClick={() => setMensajeEstado(null)}
              className="text-xs hover:underline cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* CUERPO PRINCIPAL EN 2 COLUMNAS */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* COLUMNA IZQUIERDA: CONFIGURADOR DE CAMPOS & PERSONALIZACIÓN (5 cols) */}
          <div className="lg:col-span-5 border-r border-slate-800 bg-slate-900/60 overflow-y-auto p-4 space-y-5">
            
            {/* 1. SELECCIÓN DE FORMATO & TEMA VISUAL */}
            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <Layout className="w-3.5 h-3.5 text-indigo-400" />
                  1. Formato de Red Social
                </span>
                <span className="text-[10px] font-mono text-slate-400">{dimensiones.label}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FORMATOS_PUBLICIDAD_DISPONIBLES.map((fInfo) => {
                  const activo = formato === fInfo.id;
                  const iconoEmoji = fInfo.id === 'cuadrado' ? '⏹️' : fInfo.id === 'story' ? '📱' : fInfo.id === 'retrato' ? '🖼️' : fInfo.id === 'banner' ? '🖥️' : '🔗';
                  return (
                    <button
                      key={fInfo.id}
                      type="button"
                      onClick={() => setFormato(fInfo.id)}
                      className={`p-2 rounded-lg border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                        activo
                          ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-sm ring-1 ring-indigo-400'
                          : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs">{iconoEmoji}</span>
                        <span className="text-[9px] font-mono font-bold px-1 py-0.5 rounded bg-slate-900/80 text-slate-300">
                          {fInfo.relacionAspecto}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-200 leading-tight">
                        {fInfo.nombre}
                      </span>
                      <span className="text-[9px] text-slate-400 leading-tight line-clamp-1">
                        {fInfo.redesRecomendadas.join(', ')}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Temas Visuales */}
              <div className="pt-2 border-t border-slate-700/60">
                <span className="text-xs font-black text-slate-200 flex items-center gap-1.5 uppercase tracking-wider mb-2">
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  Tema y Paleta Visual
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTemaVisual('summit_corporativo')}
                    className={`p-2 rounded-lg border text-left text-xs font-bold transition-all cursor-pointer ${
                      temaVisual === 'summit_corporativo'
                        ? 'bg-blue-900/40 border-blue-400 text-white ring-1 ring-blue-400'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="text-blue-300 block">Summit Corporativo</span>
                    <span className="text-[10px] text-slate-400 font-normal">Azul profundo y cian</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTemaVisual('dark_tech')}
                    className={`p-2 rounded-lg border text-left text-xs font-bold transition-all cursor-pointer ${
                      temaVisual === 'dark_tech'
                        ? 'bg-purple-900/40 border-purple-400 text-white ring-1 ring-purple-400'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="text-purple-300 block">Dark Tech</span>
                    <span className="text-[10px] text-slate-400 font-normal">Carbón y esmeralda neón</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTemaVisual('ejecutivo_prestigio')}
                    className={`p-2 rounded-lg border text-left text-xs font-bold transition-all cursor-pointer ${
                      temaVisual === 'ejecutivo_prestigio'
                        ? 'bg-amber-900/40 border-amber-400 text-white ring-1 ring-amber-400'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="text-amber-300 block">Ejecutivo Prestigio</span>
                    <span className="text-[10px] text-slate-400 font-normal">Navy y oro de alta gama</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTemaVisual('esmeralda_crecimiento')}
                    className={`p-2 rounded-lg border text-left text-xs font-bold transition-all cursor-pointer ${
                      temaVisual === 'esmeralda_crecimiento'
                        ? 'bg-emerald-900/40 border-emerald-400 text-white ring-1 ring-emerald-400'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="text-emerald-300 block">Esmeralda Impulsa</span>
                    <span className="text-[10px] text-slate-400 font-normal">Verde bosque y oro</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. SELECTOR DE CAMPOS A MOSTRAR EN EL FLYER */}
            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  2. Campos a Incluir en la Publicidad
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCampos({
                      incluirTitulo: true,
                      incluirSubtitulo: true,
                      incluirBadgeModalidad: true,
                      incluirDocente: true,
                      incluirFechasHorario: true,
                      incluirHorasCertificacion: true,
                      incluirTemario: true,
                      incluirPrecio: true,
                      incluirDescuentoPreventa: true,
                      incluirCuposUrgencia: true,
                      incluirContactoWhatsApp: true,
                      incluirLogoYCertificacion: true,
                    })
                  }
                  className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
                >
                  Marcar Todos
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-1.5 bg-slate-900/70 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-900">
                  <input
                    type="checkbox"
                    checked={campos.incluirLogoYCertificacion}
                    onChange={(e) => setCampos({ ...campos, incluirLogoYCertificacion: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Logo & Sello de Calidad</span>
                </label>

                <label className="flex items-center gap-2 p-1.5 bg-slate-900/70 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-900">
                  <input
                    type="checkbox"
                    checked={campos.incluirBadgeModalidad}
                    onChange={(e) => setCampos({ ...campos, incluirBadgeModalidad: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Modalidad & Nivel</span>
                </label>

                <label className="flex items-center gap-2 p-1.5 bg-slate-900/70 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-900">
                  <input
                    type="checkbox"
                    checked={campos.incluirTitulo}
                    onChange={(e) => setCampos({ ...campos, incluirTitulo: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Título del Sílabo / Curso</span>
                </label>

                <label className="flex items-center gap-2 p-1.5 bg-slate-900/70 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-900">
                  <input
                    type="checkbox"
                    checked={campos.incluirSubtitulo}
                    onChange={(e) => setCampos({ ...campos, incluirSubtitulo: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Subtítulo / Especialidad</span>
                </label>

                <label className="flex items-center gap-2 p-1.5 bg-slate-900/70 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-900">
                  <input
                    type="checkbox"
                    checked={campos.incluirDocente}
                    onChange={(e) => setCampos({ ...campos, incluirDocente: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Docente Facilitador</span>
                </label>

                <label className="flex items-center gap-2 p-1.5 bg-slate-900/70 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-900">
                  <input
                    type="checkbox"
                    checked={campos.incluirFechasHorario}
                    onChange={(e) => setCampos({ ...campos, incluirFechasHorario: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Fechas & Horario de Clase</span>
                </label>

                <label className="flex items-center gap-2 p-1.5 bg-slate-900/70 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-900">
                  <input
                    type="checkbox"
                    checked={campos.incluirHorasCertificacion}
                    onChange={(e) => setCampos({ ...campos, incluirHorasCertificacion: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Horas de Certificación</span>
                </label>

                <label className="flex items-center gap-2 p-1.5 bg-slate-900/70 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-900">
                  <input
                    type="checkbox"
                    checked={campos.incluirTemario}
                    onChange={(e) => setCampos({ ...campos, incluirTemario: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Temario Destacado</span>
                </label>

                <label className="flex items-center gap-2 p-1.5 bg-slate-900/70 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-900">
                  <input
                    type="checkbox"
                    checked={campos.incluirPrecio}
                    onChange={(e) => setCampos({ ...campos, incluirPrecio: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Inversión / Precio</span>
                </label>

                <label className="flex items-center gap-2 p-1.5 bg-slate-900/70 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-900">
                  <input
                    type="checkbox"
                    checked={campos.incluirDescuentoPreventa}
                    onChange={(e) => setCampos({ ...campos, incluirDescuentoPreventa: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Descuento Preventa Early Bird</span>
                </label>

                <label className="flex items-center gap-2 p-1.5 bg-slate-900/70 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-900">
                  <input
                    type="checkbox"
                    checked={campos.incluirCuposUrgencia}
                    onChange={(e) => setCampos({ ...campos, incluirCuposUrgencia: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Mensaje de Urgencia / Cupos</span>
                </label>

                <label className="flex items-center gap-2 p-1.5 bg-slate-900/70 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-900">
                  <input
                    type="checkbox"
                    checked={campos.incluirContactoWhatsApp}
                    onChange={(e) => setCampos({ ...campos, incluirContactoWhatsApp: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Barra WhatsApp & Registro</span>
                </label>

                <label className="flex items-center gap-2 p-1.5 bg-slate-900/70 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-900">
                  <input
                    type="checkbox"
                    checked={campos.incluirHashtags !== false}
                    onChange={(e) => setCampos({ ...campos, incluirHashtags: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3 text-teal-400" />
                    <span>Hashtags Institucionales</span>
                  </span>
                </label>
              </div>
            </div>

            {/* 3. PERSONALIZACIÓN DE TEXTOS & CONTENIDO */}
            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  3. Personalización del Mensaje
                </span>

                <button
                  type="button"
                  onClick={() => setMostrarModalPreferencias(true)}
                  className="text-[10px] text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer font-bold"
                  title="Configurar plantillas de hashtags, tonos y CTAs"
                >
                  <Settings className="w-3 h-3" />
                  <span>Preferencias</span>
                </button>
              </div>

              {/* Botón de Re-aplicar Preferencias Oficiales */}
              <button
                type="button"
                onClick={() => {
                  const p = obtenerPreferenciasRedesSociales();
                  setPreferencias(p);
                  const ctaDefault = p.plantillasCTA.find((c) => c.id === p.ctaPredeterminadoId) || p.plantillasCTA[0];
                  const plantillaTags = p.plantillasHashtags.find((t) => t.id === p.plantillaHashtagsActivaId) || p.plantillasHashtags[0];
                  let mensajeCta = ctaDefault ? ctaDefault.texto : '¡Apertura Confirmada! Cupos limitados para matrícula.';
                  if (p.tonoVozPredeterminado === 'urgente_persuasivo') {
                    mensajeCta = '⚡ ¡Últimos cupos con precio especial de preventa!';
                  } else if (p.tonoVozPredeterminado === 'ejecutivo_formal') {
                    mensajeCta = '🏛️ Convocatoria Oficial para Directores y Ejecutivos';
                  } else if (p.tonoVozPredeterminado === 'academico_prestigio') {
                    mensajeCta = '🎓 Certificación Curricular con Horas Acreditadas';
                  } else if (p.tonoVozPredeterminado === 'cercano_dinamico') {
                    mensajeCta = '🚀 ¡Eleva tu perfil profesional con sesiones 100% en vivo!';
                  }
                  setTextos((prev) => ({
                    ...prev,
                    mensajeUrgencia: mensajeCta,
                    ctaTexto: ctaDefault?.texto || prev.ctaTexto,
                    hashtags: plantillaTags ? [...plantillaTags.hashtags] : prev.hashtags,
                    telefonoContacto: p.telefonoWhatsAppPredeterminado || prev.telefonoContacto,
                    linkRegistro: p.linkRegistroPredeterminado || prev.linkRegistro,
                    notaPie: p.piePaginaPredeterminado || prev.notaPie,
                    tonoVoz: p.tonoVozPredeterminado,
                  }));
                  setCampos((prev) => ({ ...prev, incluirHashtags: true }));
                  setMensajeEstado({
                    tipo: 'exito',
                    texto: `Preferencias aplicadas: ${DESCRIPCIONES_TONOS[p.tonoVozPredeterminado].nombre}, ${plantillaTags?.nombre || 'Hashtags'} y CTA actualizado.`,
                  });
                }}
                className="w-full py-1.5 px-3 bg-gradient-to-r from-indigo-900 to-indigo-800 hover:from-indigo-800 hover:to-indigo-700 text-amber-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-indigo-500/40 shadow-xs cursor-pointer transition-all"
                title="Cargar automáticamente el tono, la llamada a la acción (CTA) y los hashtags guardados"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>⚡ Re-aplicar Preferencias Guardadas de Redes</span>
              </button>

              {/* Indicador de Preferencias Activas */}
              <div className="p-2 rounded-lg bg-indigo-950/50 border border-indigo-500/30 flex items-center justify-between gap-2 text-[11px]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-amber-300 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {DESCRIPCIONES_TONOS[preferencias.tonoVozPredeterminado]?.nombre || 'Tono Predeterminado'}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-teal-300 flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {preferencias.plantillasHashtags.find((p) => p.id === preferencias.plantillaHashtagsActivaId)?.nombre || 'General'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMostrarModalPreferencias(true)}
                  className="text-[10px] text-indigo-300 hover:text-white underline cursor-pointer shrink-0"
                >
                  Editar
                </button>
              </div>

              {/* Titular Principal */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Titular Principal del Flyer
                </label>
                <input
                  type="text"
                  value={textos.titularGancho || ''}
                  onChange={(e) => setTextos({ ...textos, titularGancho: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Ej: Diplomado en Gerencia Financiera y Tributaria"
                />
              </div>

              {/* Subtítulo */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Subtítulo / Especialidad
                </label>
                <input
                  type="text"
                  value={textos.subtitulo || ''}
                  onChange={(e) => setTextos({ ...textos, subtitulo: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Ej: Formación Académica Ejecutiva con Acreditación SAR"
                />
              </div>

              {/* Docente Título */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Nombre y Cargo del Docente
                </label>
                <input
                  type="text"
                  value={textos.docenteTitulo || ''}
                  onChange={(e) => setTextos({ ...textos, docenteTitulo: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Ej: Dr. Walter René Pedroza • Consultor Senior"
                />
              </div>

              {/* Temas / Viñetas */}
              {campos.incluirTemario && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Módulos o Temas Destacados (Máx. 4 viñetas)
                  </label>
                  <div className="space-y-1.5 mb-2">
                    {(textos.temasDestacados || []).map((tema, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-700 text-xs">
                        <span className="text-emerald-400 font-bold shrink-0">✔</span>
                        <input
                          type="text"
                          value={tema}
                          onChange={(e) => {
                            const newTemas = [...(textos.temasDestacados || [])];
                            newTemas[idx] = e.target.value;
                            setTextos({ ...textos, temasDestacados: newTemas });
                          }}
                          className="w-full bg-transparent text-xs text-slate-200 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleEliminarTema(idx)}
                          className="text-slate-500 hover:text-rose-400 cursor-pointer p-0.5"
                          title="Eliminar tema"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {(textos.temasDestacados || []).length < 5 && (
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={nuevoTemaTexto}
                        onChange={(e) => setNuevoTemaTexto(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAgregarTema();
                          }
                        }}
                        placeholder="Agregar nuevo punto..."
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAgregarTema}
                        className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Ajuste de Precios Personalizados para el Flyer */}
              {campos.incluirPrecio && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
                      Precio Regular ({moneda})
                    </label>
                    <input
                      type="number"
                      value={textos.precioPersonalizado ?? (proyectoActual?.precioSugeridoConISV || 2500)}
                      onChange={(e) => setTextos({ ...textos, precioPersonalizado: Number(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
                      Precio Preventa ({moneda})
                    </label>
                    <input
                      type="number"
                      value={textos.precioPreventaPersonalizado ?? (proyectoActual?.precioEarlyBird || 2125)}
                      onChange={(e) => setTextos({ ...textos, precioPreventaPersonalizado: Number(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-emerald-400"
                    />
                  </div>
                </div>
              )}

              {/* Teléfono de Contacto */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Teléfono / WhatsApp de Admisiones
                </label>
                <input
                  type="text"
                  value={textos.telefonoContacto || ''}
                  onChange={(e) => setTextos({ ...textos, telefonoContacto: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="+504 9500-1234"
                />
              </div>

              {/* Mensaje de Urgencia / Llamada a la Acción (CTA) */}
              {campos.incluirCuposUrgencia && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-300">
                      Llamada a la Acción (CTA) / Urgencia
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Plantillas Disponibles
                    </span>
                  </div>

                  {/* Selector rápido con las plantillas de CTA de las preferencias */}
                  <select
                    value={preferencias.plantillasCTA.find((c) => c.texto === textos.mensajeUrgencia)?.id || ''}
                    onChange={(e) => {
                      const selected = preferencias.plantillasCTA.find((c) => c.id === e.target.value);
                      if (selected) {
                        setTextos({ ...textos, mensajeUrgencia: selected.texto });
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Seleccionar plantilla de CTA o personalizar abajo --</option>
                    {preferencias.plantillasCTA.map((cta) => (
                      <option key={cta.id} value={cta.id} className="bg-slate-900 text-slate-100">
                        {cta.texto}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={textos.mensajeUrgencia || ''}
                    onChange={(e) => setTextos({ ...textos, mensajeUrgencia: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="¡Apertura Confirmada! Últimos cupos disponibles."
                  />
                </div>
              )}

            </div>

            {/* BOTÓN DE GUARDADO PERMANENTE DE CONFIGURACIÓN */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleGuardarConfiguracion}
                disabled={guardandoConfig}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{guardandoConfig ? 'Guardando...' : 'Guardar Configuración de Publicidad'}</span>
              </button>
              <span className="block text-[10px] text-slate-400 text-center mt-1">
                La configuración se mantendrá guardada para este proyecto en futuras sesiones.
              </span>
            </div>

          </div>

          {/* COLUMNA DERECHA: LIENZO EN VIVO DE ALTA RESOLUCIÓN & ACCIONES (7 cols) */}
          <div className="lg:col-span-7 bg-slate-950 p-4 flex flex-col justify-between overflow-y-auto space-y-4">
            
            {/* BARRA SUPERIOR DE SELECTOR RÁPIDO DE FORMATOS & HERRAMIENTAS */}
            <div className="space-y-2 shrink-0">
              {/* Selector Rápido de Formato */}
              <div className="flex items-center justify-between gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 shrink-0">
                  <Layout className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Formato Activo:</span>
                </span>
                <div className="flex flex-wrap items-center gap-1">
                  {FORMATOS_PUBLICIDAD_DISPONIBLES.map((fInfo) => {
                    const activo = formato === fInfo.id;
                    const iconoEmoji = fInfo.id === 'cuadrado' ? '⏹️' : fInfo.id === 'story' ? '📱' : fInfo.id === 'retrato' ? '🖼️' : fInfo.id === 'banner' ? '🖥️' : '🔗';
                    return (
                      <button
                        key={fInfo.id}
                        type="button"
                        onClick={() => setFormato(fInfo.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          activo
                            ? 'bg-indigo-600 text-white shadow-xs ring-1 ring-indigo-400'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700/80'
                        }`}
                        title={`${fInfo.nombre} (${fInfo.ancho}x${fInfo.alto}px) - ${fInfo.redesRecomendadas.join(', ')}`}
                      >
                        <span>{iconoEmoji}</span>
                        <span>{fInfo.relacionAspecto}</span>
                        <span className="hidden sm:inline font-normal text-[10px] opacity-80">({fInfo.nombre.split(' ')[0]})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Barra de Acciones de Exportación */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-300 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-indigo-400" />
                    Lienzo en Vivo
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {dimensiones.width} x {dimensiones.height} px
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {/* 1. COPIAR IMAGEN AL PORTAPAPELES (PREMISA PRINCIPAL) */}
                  <button
                    type="button"
                    onClick={handleCopiarImagen}
                    disabled={copiandoImagen}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Copiar imagen en formato PNG para pegar con Ctrl+V en WhatsApp, Facebook, etc."
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiandoImagen ? 'Copiando...' : 'Copiar'}</span>
                  </button>

                  {/* 2. DESCARGAR PNG */}
                  <button
                    type="button"
                    onClick={handleDescargarImagen}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Descargar archivo PNG en alta definición"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>PNG {dimensiones.width}x{dimensiones.height}</span>
                  </button>

                  {/* 3. DESCARGAR PACK MULTIFORMATO */}
                  <button
                    type="button"
                    onClick={handleDescargarPackMultiformato}
                    disabled={generandoPack}
                    className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Descarga secuencial de todas las versiones (1:1, 9:16, 4:5 y 16:9) para todas tus redes"
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-300" />
                    <span>{generandoPack ? 'Generando Pack...' : 'Pack 4 Formatos'}</span>
                  </button>

                  {/* 4. COPIAR TEXTO / COPY */}
                  <button
                    type="button"
                    onClick={handleCopiarCopyTexto}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg border border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                    title="Copiar texto persuasivo con emojis para acompañar la publicación"
                  >
                    <Share2 className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Copiar Copy</span>
                  </button>

                  {/* 5. ENVIAR A WHATSAPP */}
                  <button
                    type="button"
                    onClick={handleCompartirWhatsApp}
                    className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                    title="Abrir WhatsApp con el texto preparado"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>

            {/* CONTENEDOR DEL CANVAS (CENTRAL Y ESCALADO) */}
            <div className="flex-1 flex items-center justify-center p-2 bg-slate-900/40 rounded-xl border border-slate-800/80 min-h-[380px] overflow-hidden">
              <div
                className="relative flex items-center justify-center shadow-2xl rounded-xl overflow-hidden border border-slate-700"
                style={{
                  maxWidth: '100%',
                  maxHeight: '62vh',
                  aspectRatio: `${dimensiones.width} / ${dimensiones.height}`,
                }}
              >
                <canvas
                  ref={canvasRef}
                  className="w-full h-full object-contain block bg-slate-950 select-none cursor-pointer"
                  title="Haz clic para copiar la imagen al portapapeles"
                  onClick={handleCopiarImagen}
                />

                {/* Tooltip flotante sobre el canvas */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/75 backdrop-blur-xs rounded-full border border-white/20 text-[10px] font-bold text-white pointer-events-none flex items-center gap-1.5">
                  <Copy className="w-3 h-3 text-indigo-300" />
                  <span>Haz clic en la imagen o en "Copiar Imagen" para compartir en redes</span>
                </div>
              </div>
            </div>

            {/* GUÍA RÁPIDA DE PUBLICACIÓN EN REDES SOCIALES */}
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
              <div className="flex items-start gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 font-black flex items-center justify-center shrink-0 text-[10px]">
                  1
                </span>
                <span>
                  Haz clic en <strong>"Copiar Imagen"</strong> para capturar el flyer en tu portapapeles.
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-black flex items-center justify-center shrink-0 text-[10px]">
                  2
                </span>
                <span>
                  Abre <strong>WhatsApp Web, Facebook o Instagram</strong> y presiona <strong>Ctrl+V</strong> en la conversación o publicación.
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-black flex items-center justify-center shrink-0 text-[10px]">
                  3
                </span>
                <span>
                  Haz clic en <strong>"Guardar Configuración"</strong> para reutilizar estos ajustes siempre que lo necesites.
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* PIE DE PÁGINA */}
        <div className="px-5 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              Módulo Oficial de Difusión Comercial • <strong>{CREDENCIALES_GERENCIAS.comercial.lider}</strong> ({CREDENCIALES_GERENCIAS.comercial.correo})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleCopiarImagen}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar y Compartir</span>
            </button>
          </div>
        </div>

      </div>

      {/* Modal de Configuración de Preferencias de Redes Sociales */}
      <CommercialSocialPreferencesModal
        isOpen={mostrarModalPreferencias}
        onClose={() => setMostrarModalPreferencias(false)}
        onGuardar={(nuevasPrefs) => {
          setPreferencias(nuevasPrefs);
          // Actualizar CTA si existe plantilla predeterminada
          const nuevoCta = nuevasPrefs.plantillasCTA.find((c) => c.id === nuevasPrefs.ctaPredeterminadoId);
          if (nuevoCta) {
            setTextos((prev) => ({
              ...prev,
              mensajeUrgencia: nuevoCta.texto,
              telefonoContacto: nuevasPrefs.telefonoWhatsAppPredeterminado || prev.telefonoContacto,
              linkRegistro: nuevasPrefs.linkRegistroPredeterminado || prev.linkRegistro,
              notaPie: nuevasPrefs.piePaginaPredeterminado || prev.notaPie,
            }));
          }
        }}
        onNotificar={onNotificar}
      />
    </div>
  );
};
