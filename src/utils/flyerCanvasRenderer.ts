import { 
  FormatoPublicidad, 
  TemaVisualPublicidad, 
  CamposSeleccionadosPublicidad, 
  TextosPersonalizadosPublicidad, 
  ProyectoEducativo, 
  Moneda, 
  PreferenciasRedesSocialesComercial 
} from '../types';
import { formatearMoneda } from './calculations';

export interface DimensionesFormato {
  width: number;
  height: number;
  label: string;
  aspect: string;
}

export function obtenerDimensionesFormato(formato: FormatoPublicidad): DimensionesFormato {
  switch (formato) {
    case 'story':
      return { width: 1080, height: 1920, label: 'Story / Reels 9:16 (1080x1920)', aspect: '9:16' };
    case 'retrato':
      return { width: 1080, height: 1350, label: 'Feed Retrato 4:5 (1080x1350)', aspect: '4:5' };
    case 'banner':
      return { width: 1200, height: 675, label: 'Banner Panorámico 16:9 (1200x675)', aspect: '16:9' };
    case 'paisaje':
      return { width: 1200, height: 628, label: 'Tarjeta Enlace 1.91:1 (1200x628)', aspect: '1.91:1' };
    case 'cuadrado':
    default:
      return { width: 1080, height: 1080, label: 'Post Cuadrado 1:1 (1080x1080)', aspect: '1:1' };
  }
}

export interface RenderFlyerOptions {
  formato: FormatoPublicidad;
  proyecto: ProyectoEducativo;
  temaVisual: TemaVisualPublicidad;
  campos: CamposSeleccionadosPublicidad;
  textos: TextosPersonalizadosPublicidad;
  moneda: Moneda;
  preferencias: PreferenciasRedesSocialesComercial;
}

/**
 * Renderiza el flyer publicitario completo en cualquier canvas HTML5 de forma determinista y adaptada al formato.
 */
export function dibujarFlyerCanvas(canvas: HTMLCanvasElement, options: RenderFlyerOptions): void {
  const {
    formato,
    proyecto,
    temaVisual,
    campos,
    textos,
    moneda,
    preferencias,
  } = options;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dim = obtenerDimensionesFormato(formato);
  const W = dim.width;
  const H = dim.height;

  canvas.width = W;
  canvas.height = H;

  // 1. Paletas cromáticas según Tema Visual
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

  // Fondo principal
  ctx.fillStyle = gradBg;
  ctx.fillRect(0, 0, W, H);

  // Decoraciones sutiles geométricas en el fondo
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
  ctx.lineWidth = 1.5;
  const stepGrid = formato === 'story' ? 70 : 60;
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
  const radG1 = ctx.createRadialGradient(W * 0.85, H * 0.15, 10, W * 0.85, H * 0.15, W * 0.45);
  radG1.addColorStop(0, accentColor + '30');
  radG1.addColorStop(1, 'transparent');
  ctx.fillStyle = radG1;
  ctx.fillRect(0, 0, W, H);

  const radG2 = ctx.createRadialGradient(W * 0.15, H * 0.85, 10, W * 0.15, H * 0.85, W * 0.5);
  radG2.addColorStop(0, accentSecundario + '22');
  radG2.addColorStop(1, 'transparent');
  ctx.fillStyle = radG2;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // Marco exterior de alta gama con esquinas acentuadas
  ctx.save();
  const marginOffset = formato === 'banner' || formato === 'paisaje' ? 20 : 28;
  ctx.strokeStyle = accentColor + '35';
  ctx.lineWidth = formato === 'banner' || formato === 'paisaje' ? 2 : 3;
  ctx.strokeRect(marginOffset, marginOffset, W - marginOffset * 2, H - marginOffset * 2);

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = formato === 'banner' || formato === 'paisaje' ? 4 : 6;
  const cornerSize = formato === 'banner' || formato === 'paisaje' ? 26 : 40;
  
  // Top-left
  ctx.beginPath();
  ctx.moveTo(marginOffset - 3, marginOffset - 3 + cornerSize);
  ctx.lineTo(marginOffset - 3, marginOffset - 3);
  ctx.lineTo(marginOffset - 3 + cornerSize, marginOffset - 3);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(W - marginOffset + 3 - cornerSize, marginOffset - 3);
  ctx.lineTo(W - marginOffset + 3, marginOffset - 3);
  ctx.lineTo(W - marginOffset + 3, marginOffset - 3 + cornerSize);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(marginOffset - 3, H - marginOffset + 3 - cornerSize);
  ctx.lineTo(marginOffset - 3, H - marginOffset + 3);
  ctx.lineTo(marginOffset - 3 + cornerSize, H - marginOffset + 3);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(W - marginOffset + 3 - cornerSize, H - marginOffset + 3);
  ctx.lineTo(W - marginOffset + 3, H - marginOffset + 3);
  ctx.lineTo(W - marginOffset + 3, H - marginOffset + 3 - cornerSize);
  ctx.stroke();
  ctx.restore();

  // Parámetros de diseño adaptativo según formato
  const esStory = formato === 'story';
  const esRetrato = formato === 'retrato';
  const esHorizontal = formato === 'banner' || formato === 'paisaje';

  const paddingX = esHorizontal ? 50 : esStory ? 70 : 65;
  const contentW = W - paddingX * 2;

  // Altura del bloque inferior (CTA + contacto + nota al pie)
  let bottomH = esHorizontal ? 68 : esStory ? 105 : 95;
  let bottomY = esStory 
    ? H - bottomH - 125 // Safe area en stories para barra de respuesta
    : esRetrato 
    ? H - bottomH - 45 
    : esHorizontal 
    ? H - bottomH - 18 
    : H - bottomH - 35;

  let cursorY = esStory ? 125 : esRetrato ? 85 : esHorizontal ? 36 : 70;

  // 2. Encabezado Oficial Institucional
  if (campos.incluirLogoYCertificacion) {
    ctx.save();
    const logoRadius = esHorizontal ? 20 : 26;
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
    ctx.lineWidth = esHorizontal ? 2 : 2.5;
    ctx.beginPath();
    ctx.ellipse(logoX, logoY, logoRadius + 8, logoRadius * 0.45, -Math.PI / 6, 0, Math.PI * 2);
    ctx.stroke();

    // Picos montañosos internos
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    const sc = esHorizontal ? 0.75 : 1;
    ctx.moveTo(logoX - 16 * sc, logoY + 12 * sc);
    ctx.lineTo(logoX - 5 * sc, logoY - 8 * sc);
    ctx.lineTo(logoX + 2 * sc, logoY + 4 * sc);
    ctx.lineTo(logoX + 10 * sc, logoY - 14 * sc);
    ctx.lineTo(logoX + 18 * sc, logoY + 12 * sc);
    ctx.closePath();
    ctx.fill();

    // Tipografía de Marca
    ctx.fillStyle = textPrimary;
    ctx.font = `bold ${esHorizontal ? 20 : 26}px system-ui, sans-serif`;
    ctx.fillText('SUMMIT IMPULSA GLOBAL', logoX + logoRadius + 16, logoY - 2);

    ctx.fillStyle = accentColor;
    ctx.font = `bold ${esHorizontal ? 10 : 13}px system-ui, sans-serif`;
    ctx.letterSpacing = '1px';
    ctx.fillText('FORMACIÓN EJECUTIVA • CERTIFICACIÓN INTERNACIONAL', logoX + logoRadius + 16, logoY + (esHorizontal ? 15 : 18));
    ctx.letterSpacing = '0px';

    // Sello derecho de Acreditación (solo si hay espacio horizontal)
    if (!esHorizontal || W >= 1100) {
      const selloW = esHorizontal ? 150 : 180;
      const selloH = esHorizontal ? 34 : 42;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.roundRect(W - paddingX - selloW, cursorY + 4, selloW, selloH, 8);
      ctx.fill();
      ctx.strokeStyle = accentSecundario + '80';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = accentSecundario;
      ctx.font = `bold ${esHorizontal ? 9.5 : 11}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('★ ACREDITACIÓN SAR & POA ★', W - paddingX - selloW / 2, cursorY + (esHorizontal ? 18 : 22));
      ctx.fillStyle = '#E2E8F0';
      ctx.font = `${esHorizontal ? 8.5 : 10}px system-ui, sans-serif`;
      ctx.fillText('Validez Curricular 2026', W - paddingX - selloW / 2, cursorY + (esHorizontal ? 29 : 36));
      ctx.textAlign = 'left';
    }

    ctx.restore();
    cursorY += esHorizontal ? 55 : esStory ? 86 : 80;
  } else {
    cursorY += esHorizontal ? 15 : 20;
  }

  // 3. Badge de Modalidad y Nivel
  if (campos.incluirBadgeModalidad) {
    ctx.save();
    const badgeText = `🔴 EN VIVO • ${proyecto.modalidad || 'VIRTUAL SINCRÓNICA (ZOOM)'}  |  NIVEL: ${proyecto.nivel || 'ESPECIALIZADO'}`.toUpperCase();
    ctx.font = `bold ${esHorizontal ? 11 : 13}px system-ui, sans-serif`;
    const badgeW = ctx.measureText(badgeText).width + (esHorizontal ? 24 : 36);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.roundRect(paddingX, cursorY, badgeW, esHorizontal ? 26 : 32, 16);
    ctx.fill();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = accentColor;
    ctx.fillText(badgeText, paddingX + (esHorizontal ? 12 : 18), cursorY + (esHorizontal ? 17 : 21));
    ctx.restore();

    cursorY += esHorizontal ? 36 : esStory ? 52 : 48;
  }

  // 4. Titular Principal y Subtítulo
  if (campos.incluirTitulo) {
    ctx.save();
    const titulo = textos.titularGancho || proyecto.nombreProyecto;
    ctx.fillStyle = textPrimary;

    // Calcular tamaño de fuente según longitud y formato
    let fontSize = esStory ? 48 : esRetrato ? 44 : esHorizontal ? 32 : 42;
    if (titulo.length > 50) fontSize -= esHorizontal ? 4 : 6;
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

    const maxLineas = esHorizontal ? 2 : 3;
    lineasTitulo.slice(0, maxLineas).forEach((linea) => {
      ctx.fillText(linea.trim(), paddingX, cursorY + fontSize * 0.9);
      cursorY += fontSize * (esStory ? 1.2 : 1.15);
    });
    ctx.restore();

    cursorY += esStory ? 8 : 4;
  }

  // Subtítulo
  if (campos.incluirSubtitulo && textos.subtitulo) {
    ctx.save();
    ctx.fillStyle = accentColor;
    ctx.font = `600 ${esHorizontal ? 14 : 18}px system-ui, sans-serif`;
    ctx.fillText(textos.subtitulo, paddingX, cursorY + (esHorizontal ? 12 : 16));
    ctx.restore();
    cursorY += esHorizontal ? 24 : esStory ? 38 : 34;
  }

  // 5. Docente Facilitador
  if (campos.incluirDocente) {
    ctx.save();
    const docenteNombre = textos.docenteTitulo || `${proyecto.nombreDocente} • Facilitador Especialista`;
    const docH = esHorizontal ? 38 : esStory ? 54 : 50;

    // Contenedor tarjeta docente
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.roundRect(paddingX, cursorY, contentW, docH, 10);
    ctx.fill();
    ctx.strokeStyle = cardBorder;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Ícono de facilitador
    ctx.fillStyle = accentSecundario;
    ctx.font = `bold ${esHorizontal ? 16 : 20}px system-ui, sans-serif`;
    ctx.fillText('🎓', paddingX + (esHorizontal ? 12 : 16), cursorY + (esHorizontal ? 25 : 32));

    ctx.fillStyle = textPrimary;
    ctx.font = `bold ${esHorizontal ? 13 : 16}px system-ui, sans-serif`;
    ctx.fillText(docenteNombre, paddingX + (esHorizontal ? 38 : 50), cursorY + (esHorizontal ? 24 : 31));

    ctx.restore();
    cursorY += docH + (esStory ? 20 : esHorizontal ? 12 : 16);
  }

  // 6. Tarjetas de Metadatos (Fechas, Horario, Horas Acreditadas)
  if (campos.incluirFechasHorario || campos.incluirHorasCertificacion) {
    ctx.save();
    const cards: Array<{ label: string; valor: string; icono: string }> = [];

    if (campos.incluirFechasHorario) {
      cards.push({
        icono: '📅',
        label: 'INICIO & DÍAS',
        valor: `${proyecto.fechaProgramacion || 'Próximo Inicio'} • ${proyecto.diasClase || 'Lunes y Miércoles'}`,
      });
      cards.push({
        icono: '⏰',
        label: 'HORARIO DE CLASE',
        valor: proyecto.horario || '06:00 PM - 08:00 PM (En vivo)',
      });
    }

    if (campos.incluirHorasCertificacion) {
      cards.push({
        icono: '⏳',
        label: 'DURACIÓN CERTIFICADA',
        valor: `${proyecto.horasClase || 12} Horas Acreditadas`,
      });
    }

    const numCols = cards.length;
    const cardGap = esHorizontal ? 10 : 16;
    const singleCardW = (contentW - cardGap * (numCols - 1)) / numCols;
    const cardHeight = esHorizontal ? 50 : esStory ? 74 : 68;

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
      ctx.font = `bold ${esHorizontal ? 9.5 : 11}px system-ui, sans-serif`;
      ctx.fillText(`${c.icono} ${c.label}`, cX + (esHorizontal ? 10 : 14), cursorY + (esHorizontal ? 18 : 22));

      ctx.fillStyle = textPrimary;
      ctx.font = `bold ${esHorizontal ? 11 : 13}px system-ui, sans-serif`;

      let valTxt = c.valor;
      const maxW = singleCardW - (esHorizontal ? 20 : 28);
      if (ctx.measureText(valTxt).width > maxW) {
        while (ctx.measureText(valTxt + '...').width > maxW && valTxt.length > 5) {
          valTxt = valTxt.slice(0, -1);
        }
        valTxt += '...';
      }
      ctx.fillText(valTxt, cX + (esHorizontal ? 10 : 14), cursorY + (esHorizontal ? 38 : 48));
    });

    ctx.restore();
    cursorY += cardHeight + (esStory ? 24 : esHorizontal ? 12 : 20);
  }

  // 7. Temario / Módulos Destacados
  if (campos.incluirTemario && textos.temasDestacados && textos.temasDestacados.length > 0) {
    ctx.save();
    const maxTemas = esStory ? 5 : esHorizontal ? 2 : 4;
    const temasAMostrar = textos.temasDestacados.slice(0, maxTemas);
    const itemHeight = esHorizontal ? 22 : esStory ? 30 : 28;
    const boxH = (esHorizontal ? 26 : 34) + temasAMostrar.length * itemHeight;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.roundRect(paddingX, cursorY, contentW, boxH, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.stroke();

    ctx.fillStyle = accentSecundario;
    ctx.font = `bold ${esHorizontal ? 11 : 13}px system-ui, sans-serif`;
    ctx.fillText('✨ LO QUE APRENDERÁS EN ESTE PROGRAMA:', paddingX + (esHorizontal ? 14 : 18), cursorY + (esHorizontal ? 18 : 24));

    temasAMostrar.forEach((tema, idx) => {
      const itemY = cursorY + (esHorizontal ? 36 : 48) + idx * itemHeight;
      ctx.fillStyle = accentColor;
      ctx.font = `bold ${esHorizontal ? 11 : 14}px system-ui, sans-serif`;
      ctx.fillText('✔', paddingX + (esHorizontal ? 14 : 20), itemY);

      ctx.fillStyle = textSecondary;
      ctx.font = `500 ${esHorizontal ? 11 : 13}px system-ui, sans-serif`;
      let tText = tema;
      const maxTW = contentW - (esHorizontal ? 40 : 60);
      if (ctx.measureText(tText).width > maxTW) {
        while (ctx.measureText(tText + '...').width > maxTW && tText.length > 5) {
          tText = tText.slice(0, -1);
        }
        tText += '...';
      }
      ctx.fillText(tText, paddingX + (esHorizontal ? 32 : 44), itemY);
    });

    ctx.restore();
    cursorY += boxH + (esStory ? 24 : esHorizontal ? 12 : 20);
  }

  // 8. Precios & Preventa Early Bird
  if (campos.incluirPrecio) {
    ctx.save();
    const precioBase = textos.precioPersonalizado ?? (proyecto.precioSugeridoConISV || proyecto.precioSugeridoAlumno || 2500);
    const precioPreventa = textos.precioPreventaPersonalizado ?? (proyecto.precioEarlyBird || Math.round(precioBase * 0.85));

    const priceBoxH = esHorizontal ? 56 : esStory ? 84 : 74;
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

    ctx.fillStyle = accentSecundario;
    ctx.font = `bold ${esHorizontal ? 9.5 : 11}px system-ui, sans-serif`;
    ctx.fillText('INVERSIÓN ESPECIAL CON DESCUENTO DE PREVENTA:', paddingX + (esHorizontal ? 14 : 20), cursorY + (esHorizontal ? 18 : 24));

    if (campos.incluirDescuentoPreventa && precioPreventa < precioBase) {
      // Precio Regular tachado
      ctx.fillStyle = '#94A3B8';
      ctx.font = `bold ${esHorizontal ? 13 : 16}px system-ui, sans-serif`;
      const regularStr = formatearMoneda(precioBase, moneda);
      ctx.fillText(regularStr, paddingX + (esHorizontal ? 14 : 20), cursorY + (esHorizontal ? 42 : 54));
      const regW = ctx.measureText(regularStr).width;

      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(paddingX + (esHorizontal ? 12 : 16), cursorY + (esHorizontal ? 38 : 49));
      ctx.lineTo(paddingX + (esHorizontal ? 14 : 20) + regW + 4, cursorY + (esHorizontal ? 38 : 49));
      ctx.stroke();

      // Precio Preventa Destacado
      ctx.fillStyle = '#10B981';
      ctx.font = `900 ${esHorizontal ? 22 : 28}px system-ui, sans-serif`;
      ctx.fillText(formatearMoneda(precioPreventa, moneda), paddingX + regW + (esHorizontal ? 24 : 36), cursorY + (esHorizontal ? 44 : 56));

      // Badge Ahorro
      const ahorroPct = Math.round(((precioBase - precioPreventa) / precioBase) * 100);
      const prevStr = formatearMoneda(precioPreventa, moneda);
      const prevW = ctx.measureText(prevStr).width;
      const badgeX = paddingX + regW + prevW + (esHorizontal ? 32 : 48);

      if (badgeX + 75 < W - paddingX - 160) {
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.roundRect(badgeX, cursorY + (esHorizontal ? 26 : 36), 75, esHorizontal ? 20 : 24, 6);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${esHorizontal ? 9.5 : 11}px system-ui, sans-serif`;
        ctx.fillText(`AHORRA ${ahorroPct}%`, badgeX + 7, cursorY + (esHorizontal ? 40 : 52));
      }
    } else {
      ctx.fillStyle = '#10B981';
      ctx.font = `900 ${esHorizontal ? 22 : 28}px system-ui, sans-serif`;
      ctx.fillText(formatearMoneda(precioBase, moneda), paddingX + (esHorizontal ? 14 : 20), cursorY + (esHorizontal ? 44 : 56));
    }

    // Columna derecha: Facilidades / Cuotas
    if (!esHorizontal || W >= 1000) {
      ctx.fillStyle = textPrimary;
      ctx.font = `bold ${esHorizontal ? 10.5 : 12}px system-ui, sans-serif`;
      ctx.textAlign = 'right';
      ctx.fillText('💳 Facilidades de Pago & 2 Cuotas', W - paddingX - 20, cursorY + (esHorizontal ? 26 : 34));
      ctx.fillStyle = textSecondary;
      ctx.font = `${esHorizontal ? 9.5 : 11}px system-ui, sans-serif`;
      ctx.fillText('Incluye Material Didáctico y Diploma', W - paddingX - 20, cursorY + (esHorizontal ? 42 : 52));
      ctx.textAlign = 'left';
    }

    ctx.restore();
    cursorY += priceBoxH + (esStory ? 20 : esHorizontal ? 10 : 16);
  }

  // 9. Mensaje de Urgencia
  if (campos.incluirCuposUrgencia && textos.mensajeUrgencia) {
    ctx.save();
    ctx.fillStyle = '#FEF3C7';
    ctx.font = `bold ${esHorizontal ? 11 : 13}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`⚡ ${textos.mensajeUrgencia} ⚡`, W / 2, cursorY + (esHorizontal ? 12 : 16));
    ctx.textAlign = 'left';
    ctx.restore();
    cursorY += esHorizontal ? 20 : 32;
  }

  // 10. Hashtags Institucionales Dibujados en Canvas
  if (campos.incluirHashtags !== false) {
    ctx.save();
    const plantillaTags = preferencias.plantillasHashtags.find((p) => p.id === preferencias.plantillaHashtagsActivaId) || preferencias.plantillasHashtags[0];
    const tagsADibujar = (textos.hashtags && textos.hashtags.length > 0)
      ? textos.hashtags
      : (plantillaTags ? plantillaTags.hashtags : ['#SummitImpulsa', '#EducacionEjecutiva']);

    const tagsY = bottomY - (esHorizontal ? 22 : 26);
    let tagCursorX = paddingX;

    ctx.font = `bold ${esHorizontal ? 9.5 : 11}px system-ui, sans-serif`;
    tagsADibujar.slice(0, esHorizontal ? 3 : esStory ? 6 : 5).forEach((tag) => {
      const tagText = tag.startsWith('#') ? tag : `#${tag}`;
      const tagW = ctx.measureText(tagText).width + 16;
      if (tagCursorX + tagW < W - paddingX) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.roundRect(tagCursorX, tagsY, tagW, esHorizontal ? 18 : 20, 5);
        ctx.fill();
        ctx.strokeStyle = accentColor + '70';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = accentColor;
        ctx.fillText(tagText, tagCursorX + 8, tagsY + (esHorizontal ? 13 : 14));
        tagCursorX += tagW + 8;
      }
    });
    ctx.restore();
  }

  // 11. Botón / Barra Inferior de Llamada a la Acción (CTA)
  ctx.save();
  const ctaH = esHorizontal ? 48 : 64;
  const ctaGrad = ctx.createLinearGradient(paddingX, bottomY, paddingX + contentW, bottomY);
  ctaGrad.addColorStop(0, '#2563EB');
  ctaGrad.addColorStop(0.5, '#1D4ED8');
  ctaGrad.addColorStop(1, '#059669');

  ctx.fillStyle = ctaGrad;
  ctx.beginPath();
  ctx.roundRect(paddingX, bottomY, contentW, ctaH, 14);
  ctx.fill();
  ctx.strokeStyle = '#93C5FD';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Texto CTA Automático según Preferencias de Redes Sociales
  const ctaDefault = preferencias.plantillasCTA.find((c) => c.id === preferencias.ctaPredeterminadoId) || preferencias.plantillasCTA[0];
  const rawCta = (textos.ctaTexto || ctaDefault?.texto || '👉 RESERVA TU CUPO O SOLICITA INFORMACIÓN:').replace(/[\r\n]+/g, ' ');
  let ctaAMostrar = rawCta.startsWith('👉') || rawCta.startsWith('⚡') || rawCta.startsWith('📲') ? rawCta : `👉 ${rawCta}`;

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `900 ${esHorizontal ? 13 : 16}px system-ui, sans-serif`;
  if (ctx.measureText(ctaAMostrar).width > contentW - 48) {
    while (ctx.measureText(ctaAMostrar + '...').width > contentW - 48 && ctaAMostrar.length > 15) {
      ctaAMostrar = ctaAMostrar.slice(0, -1);
    }
    ctaAMostrar += '...';
  }
  ctx.fillText(ctaAMostrar, paddingX + (esHorizontal ? 16 : 24), bottomY + (esHorizontal ? 20 : 28));

  // Datos de Contacto
  ctx.fillStyle = '#FEF08A';
  ctx.font = `bold ${esHorizontal ? 12 : 16}px system-ui, sans-serif`;
  const tel = textos.telefonoContacto || preferencias.telefonoWhatsAppPredeterminado || '+504 9500-1234';
  ctx.fillText(`📲 WhatsApp: ${tel}`, paddingX + (esHorizontal ? 16 : 24), bottomY + (esHorizontal ? 38 : 51));

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `600 ${esHorizontal ? 11 : 14}px system-ui, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText('🌐 ' + (textos.linkRegistro || preferencias.linkRegistroPredeterminado || 'summitimpulsaglobal.com'), W - paddingX - (esHorizontal ? 16 : 24), bottomY + (esHorizontal ? 30 : 39));
  ctx.textAlign = 'left';

  // Nota al pie institucional
  if (!esHorizontal || H >= 650) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = `${esHorizontal ? 8.5 : 10}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    const pieY = esStory ? H - 45 : H - (esHorizontal ? 22 : 36);
    ctx.fillText(textos.notaPie || preferencias.piePaginaPredeterminado || 'SUMMIT IMPULSA GLOBAL, S.A. DE C.V. • RTN: 05019026435770 • San Pedro Sula, Honduras', W / 2, pieY);
    ctx.textAlign = 'left';
  }

  // Indicador especial interactivo en Stories (9:16)
  if (esStory) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👆 TOCA AQUÍ O ENVÍA UN MENSAJE PARA RESERVAR TU CUPO 👆', W / 2, bottomY + ctaH + 32);
    ctx.textAlign = 'left';
  }

  ctx.restore();
}

/**
 * Descarga una imagen generada en un formato específico
 */
export function descargarFlyerFormato(options: RenderFlyerOptions, nombrePersonalizado?: string): string {
  const offscreen = document.createElement('canvas');
  dibujarFlyerCanvas(offscreen, options);

  const dataUrl = offscreen.toDataURL('image/png');
  const safeName = (options.proyecto.nombreProyecto || 'curso')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-');
  const filename = nombrePersonalizado || `flyer-${safeName}-${options.formato}.png`;

  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return filename;
}

/**
 * Genera y descarga el paquete completo multiformato (1:1, 9:16, 4:5, 16:9)
 */
export async function descargarPackMultiformato(
  options: Omit<RenderFlyerOptions, 'formato'>,
  onProgreso?: (actual: number, total: number, formato: FormatoPublicidad) => void
): Promise<void> {
  const formatosPack: FormatoPublicidad[] = ['cuadrado', 'story', 'retrato', 'banner'];

  for (let i = 0; i < formatosPack.length; i++) {
    const f = formatosPack[i];
    onProgreso?.(i + 1, formatosPack.length, f);

    descargarFlyerFormato({
      ...options,
      formato: f,
    });

    // Pausa técnica para permitir la descarga múltiple en navegadores
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
}
