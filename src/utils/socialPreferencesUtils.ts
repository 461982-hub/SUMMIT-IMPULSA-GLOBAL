import { 
  PreferenciasRedesSocialesComercial, 
  PlantillaHashtags, 
  PlantillaCTA, 
  TonoVozPublicidad,
  ProyectoEducativo,
  Moneda,
  FormatoPublicidad,
  InfoFormatoPublicidad
} from '../types';
import { formatearMoneda } from './calculations';

export const CLAVE_LOCALSTORAGE_PREF_REDES = 'summit_preferencias_redes_sociales_v1';

export const FORMATOS_PUBLICIDAD_DISPONIBLES: InfoFormatoPublicidad[] = [
  {
    id: 'cuadrado',
    nombre: 'Post Cuadrado Feed (1:1)',
    relacionAspecto: '1:1',
    ancho: 1080,
    alto: 1080,
    redesRecomendadas: ['Instagram Feed', 'Facebook Post', 'LinkedIn Feed'],
    descripcion: 'El estándar universal para feeds de escritorio, carruseles y cuadrícula de perfil.',
    etiquetaUso: 'Feed Universal',
    badgePopular: 'Estándar',
  },
  {
    id: 'story',
    nombre: 'Stories, Reels & Shorts (9:16)',
    relacionAspecto: '9:16',
    ancho: 1080,
    alto: 1920,
    redesRecomendadas: ['Instagram Stories', 'Reels', 'TikTok', 'WhatsApp Estados'],
    descripcion: 'Pantalla vertical completa (Full Screen) para consumo móvil dinámico e interactivo.',
    etiquetaUso: 'Móvil Vertical',
    badgePopular: 'Máximo Alcance',
  },
  {
    id: 'retrato',
    nombre: 'Post Retrato Móvil (4:5)',
    relacionAspecto: '4:5',
    ancho: 1080,
    alto: 1350,
    redesRecomendadas: ['Instagram Feed Retrato', 'Facebook Móvil'],
    descripcion: '+25% más de área visible en teléfonos sin recortes. Mayor tasa de clics y retención.',
    etiquetaUso: 'Feed Optimizado',
    badgePopular: 'Mayor CTR',
  },
  {
    id: 'banner',
    nombre: 'Banner Panorámico (16:9)',
    relacionAspecto: '16:9',
    ancho: 1200,
    alto: 675,
    redesRecomendadas: ['LinkedIn Portada', 'Miniatura YouTube', 'Banner Web / Newsletter'],
    descripcion: 'Ideal para presentaciones institucionales, eventos corporativos y cabeceras digitales.',
    etiquetaUso: 'B2B & Portadas',
  },
  {
    id: 'paisaje',
    nombre: 'Tarjeta Enlace / Paisaje (1.91:1)',
    relacionAspecto: '1.91:1',
    ancho: 1200,
    alto: 628,
    redesRecomendadas: ['Twitter / X Card', 'Facebook Link Share', 'Cabecera Correo'],
    descripcion: 'Especialmente dimensionado para previsualizaciones automáticas al compartir enlaces en web.',
    etiquetaUso: 'Compartir Enlaces',
  },
];

export const PLANTILLAS_HASHTAGS_DEFECTO: PlantillaHashtags[] = [
  {
    id: 'tag-general-summit',
    nombre: 'General Corporativo Summit',
    categoria: 'Institucional',
    hashtags: [
      '#SummitImpulsa',
      '#EducacionEjecutiva',
      '#CapacitacionHonduras',
      '#LiderazgoEmpresarial',
      '#FormacionProfesional',
      '#SanPedroSula',
      '#Tegucigalpa',
      '#POA2026'
    ],
  },
  {
    id: 'tag-finanzas-sar',
    nombre: 'Finanzas, Tributación y SAR',
    categoria: 'Especializada',
    hashtags: [
      '#FinanzasCorporativas',
      '#TributariaHonduras',
      '#SARHonduras',
      '#AuditoriaFiscal',
      '#ContabilidadGerencial',
      '#SummitImpulsa',
      '#ExitoEmpresarial'
    ],
  },
  {
    id: 'tag-tech-innovacion',
    nombre: 'Tecnología, Datos e Inteligencia',
    categoria: 'Tecnología',
    hashtags: [
      '#TransformacionDigital',
      '#TechHonduras',
      '#InnovacionEjecutiva',
      '#AnaliticaDeDatos',
      '#SummitImpulsa',
      '#HabilidadesDelFuturo'
    ],
  },
  {
    id: 'tag-rrhh-liderazgo',
    nombre: 'Recursos Humanos y Alta Gerencia',
    categoria: 'Gerencia',
    hashtags: [
      '#TalentoHumano',
      '#LiderazgoEstrategico',
      '#GestionDeEquipos',
      '#CulturaOrganizacional',
      '#SummitImpulsa',
      '#CapacitacionEjecutiva'
    ],
  },
];

export const PLANTILLAS_CTA_DEFECTO: PlantillaCTA[] = [
  {
    id: 'cta-whatsapp-urgente',
    texto: '📲 ¡Inscríbete hoy por WhatsApp y asegura tu tarifa especial de preventa!',
    subtexto: 'Atención personalizada y reserva inmediata con un asesor de admisiones.',
    canalRecomendado: 'whatsapp',
  },
  {
    id: 'cta-reserva-cupo',
    texto: '👉 Reserva tu plaza ejecutiva antes del cierre de convocatoria oficial.',
    subtexto: 'Cupos reducidos para asegurar aprendizaje interactivo directo.',
    canalRecomendado: 'directo',
  },
  {
    id: 'cta-temario-brochure',
    texto: '🎓 Solicita el temario detallado y el plan de acreditación curricular aquí.',
    subtexto: 'Diploma oficial con horas certificadas por Summit Impulsa Global.',
    canalRecomendado: 'web',
  },
  {
    id: 'cta-cuotas-facilidades',
    texto: '⚡ ¡Apertura confirmada! Inicia tu matrícula con facilidades de pago en cuotas.',
    subtexto: 'Planes flexibles y pagos corporativos autorizados.',
    canalRecomendado: 'whatsapp',
  },
];

export const DESCRIPCIONES_TONOS: Record<TonoVozPublicidad, { nombre: string; descripcion: string; emoji: string; ejemplo: string }> = {
  ejecutivo_formal: {
    nombre: 'Ejecutivo y Corporativo',
    descripcion: 'Enfoque sobrio y de alto nivel. Destaca el retorno de inversión, la competitividad empresarial y el rigor directivo.',
    emoji: '🏛️',
    ejemplo: 'Potencie la toma de decisiones financieras en su organización mediante metodologías contrastadas internacionalmente.',
  },
  urgente_persuasivo: {
    nombre: 'Urgente y Persuasivo (Alta Conversión)',
    descripcion: 'Maximiza la escasez, fechas límites de preventa y cupos limitados. Estimula la acción inmediata.',
    emoji: '⚡',
    ejemplo: '¡Últimos 3 cupos con 15% de descuento Early Bird! No deje pasar el plazo límite de inscripción este viernes.',
  },
  academico_prestigio: {
    nombre: 'Académico y Prestigio Curricular',
    descripcion: 'Prioriza la validez pedagógica, el perfil del docente PhD y las horas certificadas con rigor institucional.',
    emoji: '🎓',
    ejemplo: 'Programa de alto impacto formativo avalado con horas lectivas y certificación emitida por Summit Impulsa Global.',
  },
  cercano_dinamico: {
    nombre: 'Cercano y Dinámico (Redes Sociales)',
    descripcion: 'Conversacional, accesible y con uso equilibrado de emojis. Muy efectivo en WhatsApp, Instagram y Reels.',
    emoji: '🚀',
    ejemplo: '¿Listo para subir de nivel tu perfil laboral este mes? Acompáñanos en sesiones 100% en vivo vía Zoom interactivo.',
  },
};

export const PREFERENCIAS_REDES_POR_DEFECTO: PreferenciasRedesSocialesComercial = {
  tonoVozPredeterminado: 'urgente_persuasivo',
  formatoPredeterminado: 'cuadrado',
  ctaPredeterminadoId: 'cta-whatsapp-urgente',
  plantillaHashtagsActivaId: 'tag-general-summit',
  plantillasHashtags: PLANTILLAS_HASHTAGS_DEFECTO,
  plantillasCTA: PLANTILLAS_CTA_DEFECTO,
  telefonoWhatsAppPredeterminado: '+504 9500-1234',
  linkRegistroPredeterminado: 'https://summitimpulsaglobal.com',
  piePaginaPredeterminado: 'SUMMIT IMPULSA GLOBAL, S.A. DE C.V. • RTN: 05019026435770 • San Pedro Sula, Honduras',
  fechaActualizacion: new Date().toISOString(),
};

/**
 * Obtiene las preferencias de redes sociales guardadas en localStorage o retorna los defaults
 */
export function obtenerPreferenciasRedesSociales(): PreferenciasRedesSocialesComercial {
  try {
    const data = localStorage.getItem(CLAVE_LOCALSTORAGE_PREF_REDES);
    if (data) {
      const parsed = JSON.parse(data);
      // Garantizar que no falten arrays obligatorios
      return {
        ...PREFERENCIAS_REDES_POR_DEFECTO,
        ...parsed,
        plantillasHashtags: parsed.plantillasHashtags?.length ? parsed.plantillasHashtags : PLANTILLAS_HASHTAGS_DEFECTO,
        plantillasCTA: parsed.plantillasCTA?.length ? parsed.plantillasCTA : PLANTILLAS_CTA_DEFECTO,
      };
    }
  } catch (err) {
    console.warn('Error leyendo preferencias de redes sociales:', err);
  }
  return { ...PREFERENCIAS_REDES_POR_DEFECTO };
}

/**
 * Guarda las preferencias en localStorage
 */
export function guardarPreferenciasRedesSociales(prefs: PreferenciasRedesSocialesComercial): void {
  try {
    const actualizada = {
      ...prefs,
      fechaActualizacion: new Date().toISOString(),
    };
    localStorage.setItem(CLAVE_LOCALSTORAGE_PREF_REDES, JSON.stringify(actualizada));
  } catch (err) {
    console.error('Error guardando preferencias de redes sociales:', err);
  }
}

/**
 * Genera el copy persuasivo final de publicación combinando el proyecto con las preferencias
 */
export function generarCopyPublicitarioConPreferencias(
  p: ProyectoEducativo,
  prefs: PreferenciasRedesSocialesComercial,
  moneda: Moneda,
  opciones?: {
    precioPersonalizado?: number;
    precioPreventaPersonalizado?: number;
    temas?: string[];
  }
): string {
  const precioBase = opciones?.precioPersonalizado ?? (p.precioSugeridoConISV || p.precioSugeridoAlumno || 2500);
  const precioPreventa = opciones?.precioPreventaPersonalizado ?? (p.precioEarlyBird || Math.round(precioBase * 0.85));
  const tieneDescuento = precioPreventa < precioBase;

  // 1. Obtener CTA
  const ctaObj = prefs.plantillasCTA.find((c) => c.id === prefs.ctaPredeterminadoId) || prefs.plantillasCTA[0];
  const ctaTexto = ctaObj ? ctaObj.texto : '📲 ¡Inscríbete hoy por WhatsApp y asegura tu lugar!';

  // 2. Obtener Hashtags
  const plantillaTags = prefs.plantillasHashtags.find((h) => h.id === prefs.plantillaHashtagsActivaId) || prefs.plantillasHashtags[0];
  const hashtagsArray = plantillaTags?.hashtags || ['#SummitImpulsa', '#EducacionEjecutiva'];
  const hashtagsTexto = hashtagsArray.join(' ');

  // 3. Modulación según Tono de Voz
  let ganchoApertura = '';
  let cuerpoBeneficio = '';
  let cierreTono = '';

  switch (prefs.tonoVozPredeterminado) {
    case 'ejecutivo_formal':
      ganchoApertura = `💼 PROGRAMA DE ESPECIALIZACIÓN EJECUTIVA 2026\nSUMMIT IMPULSA GLOBAL presenta:`;
      cuerpoBeneficio = `Diseñado para directores, gerentes y profesionales que buscan fortalecer capacidades estratégicas con estándares internacionales y aplicación inmediata.`;
      cierreTono = `Inversión deducible y formalizada bajo normativa tributaria SAR.`;
      break;
    case 'urgente_persuasivo':
      ganchoApertura = `🔥 ¡CONVOCATORIA ABIERTA • ÚLTIMOS CUPOS CONFIRMADOS!\nNo dejes pasar la oportunidad de capacitarte con los mejores:`;
      cuerpoBeneficio = `Metodología 100% práctica en vivo vía Zoom. ¡Asegura tu tarifa reducida de preventa antes del cierre de matrículas!`;
      cierreTono = `⚡ Solo plazas limitadas disponibles para garantizar interacción directa con el docente.`;
      break;
    case 'academico_prestigio':
      ganchoApertura = `🎓 EXCELENCIA ACADÉMICA Y FORMACIÓN DE ALTO RIGOR\nSummit Impulsa Global, S.A. convoca a:`;
      cuerpoBeneficio = `Programa curricular validado pedagógicamente, con desglose de sesiones y acreditación institucional por ${p.horasClase || 12} horas lectivas.`;
      cierreTono = `Emisión de diploma y certificado oficial curricular.`;
      break;
    case 'cercano_dinamico':
    default:
      ganchoApertura = `🚀 ¡IMPULSA TU CARRERA AL SIGUIENTE NIVEL! ✨\nLlegó el momento de potenciar tu perfil profesional:`;
      cuerpoBeneficio = `Aprende con casos reales, herramientas prácticas y feedback directo en sesiones interactivas.`;
      cierreTono = `¡Facilidades de pago en cuotas para que comiences sin complicaciones!`;
      break;
  }

  // Temas a listar
  const temasList = opciones?.temas && opciones.temas.length > 0
    ? opciones.temas.slice(0, 4)
    : p.temasImpartir
    ? p.temasImpartir.split(/[\n,;•-]+/).map((t) => t.trim()).filter((t) => t.length > 5).slice(0, 4)
    : [
        'Metodología orientada a resolución de casos reales',
        'Herramientas prácticas para optimización de procesos',
        'Acreditación formal con diploma curricular'
      ];

  const whatsappTel = prefs.telefonoWhatsAppPredeterminado || '+504 9500-1234';
  const cleanPhone = whatsappTel.replace(/[^0-9]/g, '');
  const linkRegistro = prefs.linkRegistroPredeterminado || 'https://summitimpulsaglobal.com';

  return `${ganchoApertura}

📌 ${p.nombreProyecto.toUpperCase()}
${p.tipoProyecto ? `✨ Modalidad: ${p.modalidad || 'Virtual Sincrónica (Zoom)'} • Nivel: ${p.nivel || 'Especializado'}\n` : ''}
👨‍🏫 Facilitador: ${p.nombreDocente}${p.docenteClasificacion ? ` (${p.docenteClasificacion})` : ''}
📅 Inicio de Clases: ${p.fechaProgramacion || 'Próxima Apertura'}
⏰ Horario: ${p.horario || '06:00 PM - 08:00 PM'} (${p.diasClase || 'Lunes y Miércoles'})
⏳ Horas Acreditadas: ${p.horasClase || 12} Horas Institucionales

💡 ${cuerpoBeneficio}

🎯 ¿QUÉ APRENDERÁS EN ESTE PROGRAMA?
${temasList.map((t) => `✔ ${t}`).join('\n')}

💰 INVERSIÓN ESPECIAL:
${tieneDescuento
  ? `❌ Precio regular: ${formatearMoneda(precioBase, moneda)}\n✅ PRECIO PREVENTA: ${formatearMoneda(precioPreventa, moneda)} (¡Ahorro exclusivo de preventa!)`
  : `✅ Inversión: ${formatearMoneda(precioBase, moneda)}`}
${cierreTono ? `ℹ️ ${cierreTono}\n` : ''}
${ctaTexto}

📲 WhatsApp Directo de Admisiones: https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hola, deseo inscribirme en el programa "${p.nombreProyecto}" en Summit Impulsa Global.`)}
🌐 Más información: ${linkRegistro}

${prefs.piePaginaPredeterminado || 'Summit Impulsa Global, S.A. de C.V. • Formación Ejecutiva'}

${hashtagsTexto}`;
}
