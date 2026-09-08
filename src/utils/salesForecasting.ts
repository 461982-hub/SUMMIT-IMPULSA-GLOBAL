import { ProyectoEducativo, TipoProyecto } from '../types';

export interface PuntoDatosHistorico {
  id: string;
  nombre: string;
  tipoProyecto: TipoProyecto;
  fecha: string;
  cohorteIndex: number; // 1, 2, 3...
  alumnosReales: number;
  alumnosProyectados: number;
  precioSugeridoAlumno: number;
  puntoEquilibrioAlumnos: number;
  ingresoRealTotal: number;
  margenOperativo: number;
}

export interface ResultadoRegresion {
  n: number;
  pendiente: number; // m
  intercepto: number; // b
  r2: number; // Coeficiente de determinación (0 a 1)
  r: number; // Correlación de Pearson (-1 a 1)
  errorEstandar: number; // Se
  promedioX: number;
  promedioY: number;
  minY: number;
  maxY: number;
  ecuacionTexto: string; // ej: "y = 1.25x + 4.50"
}

export interface PrediccionCohorte {
  cohorteIndex: number;
  etiquetaCohorte: string;
  valorCalculado: number;
  alumnosSugeridos: number;
  rangoInferior: number;
  rangoSuperior: number;
  errorPrediccion: number;
}

export interface PronosticoPorTipo {
  tipoProyecto: TipoProyecto;
  color: string;
  descripcionCorta: string;
  totalProyectosHistoricos: number;
  puntosHistoricos: PuntoDatosHistorico[];
  regresion: ResultadoRegresion;
  
  // Pronóstico para la próxima cohorte (x = n + 1)
  proximaCohorte: PrediccionCohorte;
  
  // Proyecciones a horizonte extendido (n+1, n+2, n+3)
  horizonteProyecciones: PrediccionCohorte[];
  
  // Diagnóstico cualitativo
  tendencia: 'crecimiento_fuerte' | 'crecimiento_moderado' | 'estable' | 'contraccion_moderada' | 'alerta_caida';
  etiquetaTendencia: string;
  recomendacionComercial: string;
  
  // Comparativa con Punto de Equilibrio
  puntoEquilibrioPromedio: number;
  margenSeguridadAlumnos: number; // Alumnos sugeridos - Punto de equilibrio
  nivelRiesgo: 'Bajo' | 'Moderado' | 'Alto';
  
  // Datos listos para gráficos (Recharts)
  serieGrafico: {
    cohorte: number;
    etiqueta: string;
    nombreProyecto?: string;
    alumnosReales?: number;
    lineaRegresion: number;
    alumnosPronosticados?: number;
    rangoInferior?: number;
    rangoSuperior?: number;
    esHistorico: boolean;
  }[];
}

// Colores institucionales distintivos por tipo de programa
export const COLORES_TIPO_PROGRAMA: Record<string, { bg: string; text: string; border: string; chart: string }> = {
  'Capacitación profesional / Mentoría ejecutiva': {
    bg: 'bg-indigo-50',
    text: 'text-indigo-900',
    border: 'border-indigo-200',
    chart: '#4f46e5',
  },
  'Formación académica acreditada (ej. convenios universitarios)': {
    bg: 'bg-emerald-50',
    text: 'text-emerald-900',
    border: 'border-emerald-200',
    chart: '#059669',
  },
  'Servicios educativos no acreditados (talleres, cursos libres)': {
    bg: 'bg-blue-50',
    text: 'text-blue-900',
    border: 'border-blue-200',
    chart: '#2563eb',
  },
  'Consultoría empresarial': {
    bg: 'bg-purple-50',
    text: 'text-purple-900',
    border: 'border-purple-200',
    chart: '#7c3aed',
  },
  'Intermediación laboral / servicios de RRHH': {
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    border: 'border-amber-200',
    chart: '#d97706',
  },
  'Servicios administrativos / gestión de proyectos': {
    bg: 'bg-rose-50',
    text: 'text-rose-900',
    border: 'border-rose-200',
    chart: '#e11d48',
  },
};

export const COLOR_FALLBACK = {
  bg: 'bg-slate-50',
  text: 'text-slate-900',
  border: 'border-slate-200',
  chart: '#0284c7',
};

/**
 * Realiza el cálculo matemático de una Regresión Lineal Simple:
 * y = m * x + b
 */
export function calcularRegresionLineal(puntos: { x: number; y: number }[]): ResultadoRegresion {
  const n = puntos.length;

  if (n === 0) {
    return {
      n: 0,
      pendiente: 0,
      intercepto: 0,
      r2: 0,
      r: 0,
      errorEstandar: 0,
      promedioX: 0,
      promedioY: 0,
      minY: 0,
      maxY: 0,
      ecuacionTexto: 'y = 0',
    };
  }

  const ys = puntos.map((p) => p.y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  if (n === 1) {
    const yVal = puntos[0].y;
    return {
      n: 1,
      pendiente: 0,
      intercepto: yVal,
      r2: 1,
      r: 1,
      errorEstandar: 0,
      promedioX: puntos[0].x,
      promedioY: yVal,
      minY,
      maxY,
      ecuacionTexto: `y = ${yVal.toFixed(2)} (Muestra Única)`,
    };
  }

  const sumX = puntos.reduce((acc, p) => acc + p.x, 0);
  const sumY = puntos.reduce((acc, p) => acc + p.y, 0);
  const promedioX = sumX / n;
  const promedioY = sumY / n;

  let ssXX = 0;
  let ssYY = 0;
  let ssXY = 0;

  for (const p of puntos) {
    const diffX = p.x - promedioX;
    const diffY = p.y - promedioY;
    ssXX += diffX * diffX;
    ssYY += diffY * diffY;
    ssXY += diffX * diffY;
  }

  // Pendiente m e intercepto b
  const pendiente = ssXX !== 0 ? ssXY / ssXX : 0;
  const intercepto = promedioY - pendiente * promedioX;

  // Coeficiente de determinación R² y Pearson r
  let r2 = 0;
  let r = 0;
  if (ssXX > 0 && ssYY > 0) {
    r2 = (ssXY * ssXY) / (ssXX * ssYY);
    r = ssXY / Math.sqrt(ssXX * ssYY);
  } else if (ssYY === 0) {
    // Todos los valores de y son idénticos
    r2 = 1.0;
    r = 0;
  }

  // Error estándar de los residuales: Se = sqrt( sum( (yi - y_hat)^2 ) / (n - 2) )
  let sumResiduosCuadrados = 0;
  for (const p of puntos) {
    const yHat = pendiente * p.x + intercepto;
    const residuo = p.y - yHat;
    sumResiduosCuadrados += residuo * residuo;
  }

  const gradosLibertad = Math.max(1, n - 2);
  const errorEstandar = Math.sqrt(sumResiduosCuadrados / gradosLibertad);

  const signo = intercepto >= 0 ? '+' : '-';
  const ecuacionTexto = `y = ${pendiente.toFixed(2)}x ${signo} ${Math.abs(intercepto).toFixed(2)}`;

  return {
    n,
    pendiente,
    intercepto,
    r2: Math.min(1, Math.max(0, r2)),
    r: Math.min(1, Math.max(-1, r)),
    errorEstandar,
    promedioX,
    promedioY,
    minY,
    maxY,
    ecuacionTexto,
  };
}

/**
 * Predice el valor de y para un x dado, incluyendo intervalos de confianza.
 */
export function predecirConRegresion(
  xFuturo: number,
  regresion: ResultadoRegresion,
  puntosHistoricos: { x: number; y: number }[]
): PrediccionCohorte {
  const yCalculado = regresion.pendiente * xFuturo + regresion.intercepto;

  // Si hay al menos 2 datos, calculamos el error estándar de predicción
  let sePred = regresion.errorEstandar;
  if (regresion.n > 2) {
    let ssXX = 0;
    for (const p of puntosHistoricos) {
      const diff = p.x - regresion.promedioX;
      ssXX += diff * diff;
    }
    if (ssXX > 0) {
      const apalancamiento = 1 + 1 / regresion.n + ((xFuturo - regresion.promedioX) ** 2) / ssXX;
      sePred = regresion.errorEstandar * Math.sqrt(apalancamiento);
    }
  }

  // Valor sugerido entero (no podemos inscribir fracciones de alumnos)
  const alumnosSugeridos = Math.max(1, Math.round(yCalculado));

  // Margen de confianza aprox (1.645 para ~90% de confianza bilateral)
  const margen = Math.max(1, sePred * 1.645);
  const rangoInferior = Math.max(1, Math.floor(yCalculado - margen));
  const rangoSuperior = Math.max(alumnosSugeridos, Math.ceil(yCalculado + margen));

  return {
    cohorteIndex: xFuturo,
    etiquetaCohorte: `Cohorte #${xFuturo}`,
    valorCalculado: yCalculado,
    alumnosSugeridos,
    rangoInferior,
    rangoSuperior,
    errorPrediccion: sePred,
  };
}

/**
 * Clasifica la tendencia cuantitativa y genera recomendaciones comerciales basadas en el resultado.
 */
function obtenerDiagnosticoYRecomendacion(
  regresion: ResultadoRegresion,
  alumnosSugeridos: number,
  pePromedio: number
): {
  tendencia: PronosticoPorTipo['tendencia'];
  etiquetaTendencia: string;
  recomendacionComercial: string;
} {
  const { pendiente, r2, n } = regresion;

  if (n <= 1) {
    return {
      tendencia: 'estable',
      etiquetaTendencia: 'Muestra Base (1 Cohorte)',
      recomendacionComercial:
        'Se cuenta con una sola cohorte histórica. La meta sugerida se basa en la matrícula real obtenida. Al registrar el próximo ciclo, el modelo trazará la pendiente de crecimiento.',
    };
  }

  if (pendiente >= 1.0 && r2 >= 0.4) {
    return {
      tendencia: 'crecimiento_fuerte',
      etiquetaTendencia: `Crecimiento Acelerado (+${pendiente.toFixed(1)} alumnos/cohorte)`,
      recomendacionComercial:
        `Alta tracción en el mercado. Sugerimos planificar cupos para ${alumnosSugeridos} alumnos, evaluar apertura de una segunda sección o elevar ligeramente el arancel para capturar mayor valor sin perder demanda.`,
    };
  }

  if (pendiente > 0.1) {
    return {
      tendencia: 'crecimiento_moderado',
      etiquetaTendencia: `Tendencia Positiva (+${pendiente.toFixed(1)} alumnos/cohorte)`,
      recomendacionComercial:
        `Crecimiento gradual sostenido. La regresión sugiere ${alumnosSugeridos} alumnos para la próxima convocatoria. Mantener la inversión publicitaria y activar preventa temprana.`,
    };
  }

  if (pendiente >= -0.1 && pendiente <= 0.1) {
    return {
      tendencia: 'estable',
      etiquetaTendencia: 'Demanda Estable / Inelástica',
      recomendacionComercial:
        `El volumen de matrícula se mantiene predecible alrededor de ${alumnosSugeridos} alumnos. Recomendado para estabilizar el flujo de caja operativo institucional.`,
    };
  }

  if (pendiente >= -1.0) {
    return {
      tendencia: 'contraccion_moderada',
      etiquetaTendencia: `Contracción Ligera (${pendiente.toFixed(1)} alumnos/cohorte)`,
      recomendacionComercial:
        `Se observa una leve desaceleración en las últimas ediciones. Ajustar la meta conservadora a ${alumnosSugeridos} alumnos y reforzar los canales de venta institucional o alianzas.`,
    };
  }

  return {
    tendencia: 'alerta_caida',
    etiquetaTendencia: `Alerta: Caída Continua (${pendiente.toFixed(1)} alumnos/cohorte)`,
    recomendacionComercial:
      `La demanda muestra contracción marcada. La sugerencia estadística es de ${alumnosSugeridos} alumnos. Se aconseja rediseñar el temario académico, revisar el precio o realizar sondeo de mercado antes del relanzamiento.`,
  };
}

/**
 * Agrupa todos los proyectos por tipo de programa, ordenados cronológicamente,
 * y genera el pronóstico de ventas mediante regresión lineal simple.
 */
export function generarPronosticosPorTipoPrograma(
  proyectos: ProyectoEducativo[]
): PronosticoPorTipo[] {
  // Extraer todos los tipos de programa presentes
  const tiposPresentes = Array.from(
    new Set(proyectos.map((p) => p.tipoProyecto).filter(Boolean))
  );

  // Si no hay tipos, usar tipos estándar
  const listaTipos =
    tiposPresentes.length > 0
      ? tiposPresentes
      : [
          'Capacitación profesional / Mentoría ejecutiva',
          'Formación académica acreditada (ej. convenios universitarios)',
          'Servicios educativos no acreditados (talleres, cursos libres)',
          'Consultoría empresarial',
        ];

  const resultados: PronosticoPorTipo[] = [];

  for (const tipo of listaTipos) {
    // Filtrar proyectos de este tipo
    const proyectosDelTipo = proyectos
      .filter((p) => p.tipoProyecto === tipo)
      // Ordenar cronológicamente por fecha de venta, programación o correlativo
      .sort((a, b) => {
        const fechaA = a.fechaVenta || a.fechaProgramacion || a.id;
        const fechaB = b.fechaVenta || b.fechaProgramacion || b.id;
        return fechaA.localeCompare(fechaB);
      });

    const totalProyectos = proyectosDelTipo.length;

    // Convertir a puntos de datos históricos
    const puntosHistoricos: PuntoDatosHistorico[] = proyectosDelTipo.map((p, idx) => {
      // Priorizar alumnos reales matriculados (alumnosFinal), si no, alumnosProyectados
      const alumnosReales = Number(p.alumnosFinal) || Number(p.alumnosProyectados) || 4;
      return {
        id: p.id,
        nombre: p.nombreProyecto,
        tipoProyecto: p.tipoProyecto,
        fecha: p.fechaVenta || p.fechaProgramacion || '2026-08',
        cohorteIndex: idx + 1,
        alumnosReales,
        alumnosProyectados: Number(p.alumnosProyectados) || alumnosReales,
        precioSugeridoAlumno: p.precioSugeridoAlumno || 0,
        puntoEquilibrioAlumnos: p.puntoEquilibrioAlumnos || 3,
        ingresoRealTotal: p.ingresoRealTotal || 0,
        margenOperativo: p.margenGananciaOperativa || 30,
      };
    });

    // Puntos (x, y) para el modelo de regresión
    // x = secuencia temporal de cohorte (1, 2, 3...)
    // y = alumnos matriculados
    const puntosRegresion = puntosHistoricos.map((p) => ({
      x: p.cohorteIndex,
      y: p.alumnosReales,
    }));

    const regresion = calcularRegresionLineal(puntosRegresion);

    // Próxima cohorte (x = n + 1)
    const proximaX = totalProyectos > 0 ? totalProyectos + 1 : 1;
    const proximaCohorte = predecirConRegresion(proximaX, regresion, puntosRegresion);

    // Horizonte extendido: cohortes n+1, n+2, n+3
    const horizonteProyecciones: PrediccionCohorte[] = [
      proximaCohorte,
      predecirConRegresion(proximaX + 1, regresion, puntosRegresion),
      predecirConRegresion(proximaX + 2, regresion, puntosRegresion),
    ];

    // Promedio de punto de equilibrio histórico del tipo
    const pePromedio =
      totalProyectos > 0
        ? Math.round(
            puntosHistoricos.reduce((acc, p) => acc + p.puntoEquilibrioAlumnos, 0) / totalProyectos
          )
        : 3;

    const margenSeguridad = proximaCohorte.alumnosSugeridos - pePromedio;
    const nivelRiesgo: 'Bajo' | 'Moderado' | 'Alto' =
      margenSeguridad >= 2 ? 'Bajo' : margenSeguridad >= 0 ? 'Moderado' : 'Alto';

    const { tendencia, etiquetaTendencia, recomendacionComercial } =
      obtenerDiagnosticoYRecomendacion(regresion, proximaCohorte.alumnosSugeridos, pePromedio);

    // Construir serie de datos para Recharts
    const serieGrafico: PronosticoPorTipo['serieGrafico'] = [];

    // 1. Datos históricos con ajuste de regresión
    puntosHistoricos.forEach((p) => {
      const yReg = regresion.n > 1 ? regresion.pendiente * p.cohorteIndex + regresion.intercepto : p.alumnosReales;
      serieGrafico.push({
        cohorte: p.cohorteIndex,
        etiqueta: `C#${p.cohorteIndex} (${p.nombre.substring(0, 15)}...)`,
        nombreProyecto: p.nombre,
        alumnosReales: p.alumnosReales,
        lineaRegresion: Math.max(0, Number(yReg.toFixed(2))),
        esHistorico: true,
      });
    });

    // 2. Datos proyectados futuros (n+1, n+2, n+3)
    horizonteProyecciones.forEach((pred, idx) => {
      serieGrafico.push({
        cohorte: pred.cohorteIndex,
        etiqueta: idx === 0 ? `C#${pred.cohorteIndex} (PRÓXIMA)` : `C#${pred.cohorteIndex} (Horizonte)`,
        nombreProyecto: `Proyección Cohorte #${pred.cohorteIndex}`,
        lineaRegresion: Math.max(0, Number(pred.valorCalculado.toFixed(2))),
        alumnosPronosticados: pred.alumnosSugeridos,
        rangoInferior: pred.rangoInferior,
        rangoSuperior: pred.rangoSuperior,
        esHistorico: false,
      });
    });

    const colores = COLORES_TIPO_PROGRAMA[tipo] || COLOR_FALLBACK;

    resultados.push({
      tipoProyecto: tipo,
      color: colores.chart,
      descripcionCorta: tipo.split('/')[0].trim(),
      totalProyectosHistoricos: totalProyectos,
      puntosHistoricos,
      regresion,
      proximaCohorte,
      horizonteProyecciones,
      tendencia,
      etiquetaTendencia,
      recomendacionComercial,
      puntoEquilibrioPromedio: pePromedio,
      margenSeguridadAlumnos: margenSeguridad,
      nivelRiesgo,
      serieGrafico,
    });
  }

  // Ordenar por volumen de proyectos y tracción
  return resultados.sort((a, b) => b.totalProyectosHistoricos - a.totalProyectosHistoricos);
}

/**
 * Calcula un modelo global para toda la institución (todos los programas combinados),
 * útil como benchmark comparativo institucional.
 */
export function generarPronosticoGlobalInstitucional(
  proyectos: ProyectoEducativo[]
): PronosticoPorTipo {
  const proyectosOrdenados = [...proyectos].sort((a, b) => {
    const fechaA = a.fechaVenta || a.fechaProgramacion || a.id;
    const fechaB = b.fechaVenta || b.fechaProgramacion || b.id;
    return fechaA.localeCompare(fechaB);
  });

  const totalProyectos = proyectosOrdenados.length;

  const puntosHistoricos: PuntoDatosHistorico[] = proyectosOrdenados.map((p, idx) => {
    const alumnosReales = Number(p.alumnosFinal) || Number(p.alumnosProyectados) || 4;
    return {
      id: p.id,
      nombre: p.nombreProyecto,
      tipoProyecto: p.tipoProyecto,
      fecha: p.fechaVenta || p.fechaProgramacion || '2026-08',
      cohorteIndex: idx + 1,
      alumnosReales,
      alumnosProyectados: Number(p.alumnosProyectados) || alumnosReales,
      precioSugeridoAlumno: p.precioSugeridoAlumno || 0,
      puntoEquilibrioAlumnos: p.puntoEquilibrioAlumnos || 3,
      ingresoRealTotal: p.ingresoRealTotal || 0,
      margenOperativo: p.margenGananciaOperativa || 30,
    };
  });

  const puntosRegresion = puntosHistoricos.map((p) => ({
    x: p.cohorteIndex,
    y: p.alumnosReales,
  }));

  const regresion = calcularRegresionLineal(puntosRegresion);
  const proximaX = totalProyectos + 1;
  const proximaCohorte = predecirConRegresion(proximaX, regresion, puntosRegresion);

  const horizonteProyecciones: PrediccionCohorte[] = [
    proximaCohorte,
    predecirConRegresion(proximaX + 1, regresion, puntosRegresion),
    predecirConRegresion(proximaX + 2, regresion, puntosRegresion),
  ];

  const pePromedio =
    totalProyectos > 0
      ? Math.round(
          puntosHistoricos.reduce((acc, p) => acc + p.puntoEquilibrioAlumnos, 0) / totalProyectos
        )
      : 3;

  const margenSeguridad = proximaCohorte.alumnosSugeridos - pePromedio;
  const nivelRiesgo = margenSeguridad >= 2 ? 'Bajo' : margenSeguridad >= 0 ? 'Moderado' : 'Alto';

  const { tendencia, etiquetaTendencia, recomendacionComercial } =
    obtenerDiagnosticoYRecomendacion(regresion, proximaCohorte.alumnosSugeridos, pePromedio);

  const serieGrafico: PronosticoPorTipo['serieGrafico'] = [];
  puntosHistoricos.forEach((p) => {
    const yReg = regresion.n > 1 ? regresion.pendiente * p.cohorteIndex + regresion.intercepto : p.alumnosReales;
    serieGrafico.push({
      cohorte: p.cohorteIndex,
      etiqueta: `#${p.cohorteIndex}`,
      nombreProyecto: p.nombre,
      alumnosReales: p.alumnosReales,
      lineaRegresion: Math.max(0, Number(yReg.toFixed(2))),
      esHistorico: true,
    });
  });

  horizonteProyecciones.forEach((pred, idx) => {
    serieGrafico.push({
      cohorte: pred.cohorteIndex,
      etiqueta: idx === 0 ? `C#${pred.cohorteIndex} (Prox)` : `C#${pred.cohorteIndex}`,
      nombreProyecto: `Global #${pred.cohorteIndex}`,
      lineaRegresion: Math.max(0, Number(pred.valorCalculado.toFixed(2))),
      alumnosPronosticados: pred.alumnosSugeridos,
      rangoInferior: pred.rangoInferior,
      rangoSuperior: pred.rangoSuperior,
      esHistorico: false,
    });
  });

  return {
    tipoProyecto: 'Promedio Institucional Global (Todos los Programas)' as TipoProyecto,
    color: '#0f172a',
    descripcionCorta: 'Consolidado Institucional',
    totalProyectosHistoricos: totalProyectos,
    puntosHistoricos,
    regresion,
    proximaCohorte,
    horizonteProyecciones,
    tendencia,
    etiquetaTendencia,
    recomendacionComercial,
    puntoEquilibrioPromedio: pePromedio,
    margenSeguridadAlumnos: margenSeguridad,
    nivelRiesgo,
    serieGrafico,
  };
}
