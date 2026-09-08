import { ProyectoEducativo, ResumenMensual, ComparativaDosMeses } from '../types';

const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const NOMBRES_MESES_CORTOS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

/**
 * Obtiene la clave YYYY-MM a partir de un proyecto (prioriza mesControl, luego fechaProgramacion o fechaVenta)
 */
export function obtenerClaveMesProyecto(proyecto: ProyectoEducativo): string {
  if (proyecto.mesControl && /^\d{4}-\d{2}$/.test(proyecto.mesControl)) {
    return proyecto.mesControl;
  }
  
  const fecha = proyecto.fechaProgramacion || proyecto.fechaVenta;
  if (fecha && /^\d{4}-\d{2}/.test(fecha)) {
    return fecha.slice(0, 7);
  }

  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  return `${anio}-${mes}`;
}

/**
 * Formatea una clave YYYY-MM en etiqueta legible ej: 'Agosto 2026'
 */
export function formatearEtiquetaMes(mesKey: string): string {
  if (!mesKey || !mesKey.includes('-')) return mesKey || 'Sin Fecha';
  const [anioStr, mesStr] = mesKey.split('-');
  const mesIdx = parseInt(mesStr, 10) - 1;
  if (mesIdx >= 0 && mesIdx < 12) {
    return `${NOMBRES_MESES[mesIdx]} ${anioStr}`;
  }
  return mesKey;
}

/**
 * Formatea una clave YYYY-MM en etiqueta corta ej: 'Ago 26'
 */
export function formatearEtiquetaCortaMes(mesKey: string): string {
  if (!mesKey || !mesKey.includes('-')) return mesKey || '';
  const [anioStr, mesStr] = mesKey.split('-');
  const mesIdx = parseInt(mesStr, 10) - 1;
  if (mesIdx >= 0 && mesIdx < 12) {
    return `${NOMBRES_MESES_CORTOS[mesIdx]} ${anioStr.slice(2)}`;
  }
  return mesKey;
}

/**
 * Agrupa y calcula el resumen financiero consolidado por cada mes
 */
export function calcularResumenesMensuales(proyectos: ProyectoEducativo[]): ResumenMensual[] {
  const agrupado: Record<string, ProyectoEducativo[]> = {};

  proyectos.forEach((p) => {
    const key = obtenerClaveMesProyecto(p);
    if (!agrupado[key]) {
      agrupado[key] = [];
    }
    agrupado[key].push(p);
  });

  const keys = Object.keys(agrupado).sort((a, b) => a.localeCompare(b));

  return keys.map((mesKey) => {
    const proys = agrupado[mesKey];
    const [anioStr, mesStr] = mesKey.split('-');
    const anio = parseInt(anioStr, 10);
    const mesNumero = parseInt(mesStr, 10);

    const totalProyectos = proys.length;
    const proyectosRealizados = proys.filter(p => p.seLlevoACabo === 'Sí').length;
    const proyectosEnCurso = proys.filter(p => p.seLlevoACabo === 'En curso').length;
    const proyectosCancelados = proys.filter(p => p.seLlevoACabo === 'Cancelado' || p.seLlevoACabo === 'No').length;

    const gastoTotalOperativo = proys.reduce((sum, p) => sum + (p.gastoTotalOperativo || 0), 0);
    const ingresoRealTotal = proys.reduce((sum, p) => sum + (p.ingresoRealTotal || 0), 0);
    const totalGananciasFinales = proys.reduce((sum, p) => sum + (p.totalGananciasFinales || 0), 0);

    const alumnosProyectados = proys.reduce((sum, p) => sum + (p.alumnosProyectados || 0), 0);
    const alumnosReales = proys.reduce((sum, p) => sum + (p.alumnosFinal || 0), 0);
    const diferenciaAlumnosTotal = alumnosReales - alumnosProyectados;

    const tasaCumplimientoAlumnos = alumnosProyectados > 0 
      ? (alumnosReales / alumnosProyectados) * 100 
      : 0;

    const margenRealPromedio = gastoTotalOperativo > 0 
      ? (totalGananciasFinales / gastoTotalOperativo) * 100 
      : 0;

    const roiPromedio = gastoTotalOperativo > 0 
      ? (totalGananciasFinales / gastoTotalOperativo) * 100 
      : 0;

    const precioTicketPromedio = alumnosReales > 0 
      ? ingresoRealTotal / alumnosReales 
      : (proys.reduce((sum, p) => sum + (p.precioSugeridoAlumno || 0), 0) / (totalProyectos || 1));

    return {
      mesKey,
      anio,
      mesNumero,
      etiquetaMes: formatearEtiquetaMes(mesKey),
      etiquetaCorta: formatearEtiquetaCortaMes(mesKey),
      totalProyectos,
      proyectosRealizados,
      proyectosEnCurso,
      proyectosCancelados,
      gastoTotalOperativo,
      ingresoRealTotal,
      totalGananciasFinales,
      alumnosProyectados,
      alumnosReales,
      diferenciaAlumnosTotal,
      tasaCumplimientoAlumnos,
      margenRealPromedio,
      roiPromedio,
      precioTicketPromedio,
      proyectos: proys,
    };
  });
}

/**
 * Realiza una comparación frente a frente (cara a cara) entre dos meses seleccionados
 */
export function compararDosMeses(mesBase: ResumenMensual, mesComparado: ResumenMensual): ComparativaDosMeses {
  const deltaIngresos = mesComparado.ingresoRealTotal - mesBase.ingresoRealTotal;
  const deltaIngresosPct = mesBase.ingresoRealTotal > 0 
    ? (deltaIngresos / mesBase.ingresoRealTotal) * 100 
    : 0;

  const deltaGastos = mesComparado.gastoTotalOperativo - mesBase.gastoTotalOperativo;
  const deltaGastosPct = mesBase.gastoTotalOperativo > 0 
    ? (deltaGastos / mesBase.gastoTotalOperativo) * 100 
    : 0;

  const deltaGanancias = mesComparado.totalGananciasFinales - mesBase.totalGananciasFinales;
  const deltaGananciasPct = mesBase.totalGananciasFinales !== 0 
    ? (deltaGanancias / Math.abs(mesBase.totalGananciasFinales)) * 100 
    : 0;

  const deltaAlumnos = mesComparado.alumnosReales - mesBase.alumnosReales;
  const deltaAlumnosPct = mesBase.alumnosReales > 0 
    ? (deltaAlumnos / mesBase.alumnosReales) * 100 
    : 0;

  const deltaProyectos = mesComparado.totalProyectos - mesBase.totalProyectos;
  const deltaROI = mesComparado.roiPromedio - mesBase.roiPromedio;

  return {
    mesBase,
    mesComparado,
    deltaIngresos,
    deltaIngresosPct,
    deltaGastos,
    deltaGastosPct,
    deltaGanancias,
    deltaGananciasPct,
    deltaAlumnos,
    deltaAlumnosPct,
    deltaProyectos,
    deltaROI,
  };
}
