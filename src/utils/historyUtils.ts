import { 
  ProyectoEducativo, 
  HistorialCambioProyecto, 
  TipoCambioHistorial, 
  DetalleCampoModificado, 
  ImpactoFinancieroHistorial 
} from '../types';

export function crearEntradaHistorialCreacion(
  proyecto: ProyectoEducativo, 
  usuario: string = 'Coordinación Académica'
): HistorialCambioProyecto {
  return {
    id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    fecha: proyecto.fechaProgramacion 
      ? `${proyecto.fechaProgramacion}T09:00:00.000Z` 
      : new Date().toISOString(),
    usuario,
    tipoCambio: 'creacion',
    titulo: 'Registro inicial del proyecto',
    descripcion: `Creación del proyecto educativo "${proyecto.nombreProyecto}" con ${proyecto.horasClase} hrs de clase, presupuesto de ${proyecto.alumnosProyectados} alumnos proyectados y ${proyecto.margenGananciaOperativa}% de margen operativo.`,
    modificaciones: [
      { campo: 'nombreProyecto', etiqueta: 'Proyecto', valorAnterior: 'N/A', valorNuevo: proyecto.nombreProyecto, tipo: 'texto' },
      { campo: 'nombreDocente', etiqueta: 'Docente Titular', valorAnterior: 'N/A', valorNuevo: proyecto.nombreDocente, tipo: 'texto' },
      { campo: 'horasClase', etiqueta: 'Horas de Clase', valorAnterior: 0, valorNuevo: `${proyecto.horasClase} hrs`, tipo: 'numero' },
      { campo: 'tarifaHoraDocente', etiqueta: 'Tarifa Hora Docente', valorAnterior: 0, valorNuevo: proyecto.tarifaHoraDocente, tipo: 'moneda' },
      { campo: 'alumnosProyectados', etiqueta: 'Alumnos Proyectados', valorAnterior: 0, valorNuevo: `${proyecto.alumnosProyectados} alumnos`, tipo: 'numero' },
      { campo: 'margenGananciaOperativa', etiqueta: 'Margen Objetivo', valorAnterior: 0, valorNuevo: `${proyecto.margenGananciaOperativa}%`, tipo: 'porcentaje' },
    ],
    impactoFinanciero: {
      gastoOperativoAnterior: 0,
      gastoOperativoNuevo: proyecto.gastoTotalOperativo,
      precioSugeridoAnterior: 0,
      precioSugeridoNuevo: proyecto.precioSugeridoAlumno,
      gananciaFinalAnterior: 0,
      gananciaFinalNueva: proyecto.totalGananciasFinales,
      puntoEquilibrioAnterior: 0,
      puntoEquilibrioNuevo: proyecto.puntoEquilibrioAlumnos,
    }
  };
}

export function detectarCambiosProyecto(
  anterior: ProyectoEducativo,
  nuevo: ProyectoEducativo,
  usuario: string = 'Administrador Financiero'
): HistorialCambioProyecto | null {
  const modificaciones: DetalleCampoModificado[] = [];

  // Mapeo de campos a revisar
  if (anterior.horasClase !== nuevo.horasClase) {
    modificaciones.push({
      campo: 'horasClase',
      etiqueta: 'Horas de Clase',
      valorAnterior: `${anterior.horasClase} hrs`,
      valorNuevo: `${nuevo.horasClase} hrs`,
      tipo: 'numero',
    });
  }

  if (anterior.tarifaHoraDocente !== nuevo.tarifaHoraDocente) {
    modificaciones.push({
      campo: 'tarifaHoraDocente',
      etiqueta: 'Tarifa por Hora Docente',
      valorAnterior: anterior.tarifaHoraDocente,
      valorNuevo: nuevo.tarifaHoraDocente,
      tipo: 'moneda',
    });
  }

  if ((anterior.costoDocenteManual || 0) !== (nuevo.costoDocenteManual || 0)) {
    modificaciones.push({
      campo: 'costoDocenteManual',
      etiqueta: 'Costo Docente Fijo',
      valorAnterior: anterior.costoDocenteManual || 0,
      valorNuevo: nuevo.costoDocenteManual || 0,
      tipo: 'moneda',
    });
  }

  if (anterior.costoZoom !== nuevo.costoZoom) {
    modificaciones.push({
      campo: 'costoZoom',
      etiqueta: 'Costo Plataforma Zoom',
      valorAnterior: anterior.costoZoom,
      valorNuevo: nuevo.costoZoom,
      tipo: 'moneda',
    });
  }

  if (anterior.costoPapeleria !== nuevo.costoPapeleria) {
    modificaciones.push({
      campo: 'costoPapeleria',
      etiqueta: 'Papelería y Didácticos',
      valorAnterior: anterior.costoPapeleria,
      valorNuevo: nuevo.costoPapeleria,
      tipo: 'moneda',
    });
  }

  if (anterior.gastosVarios !== nuevo.gastosVarios) {
    modificaciones.push({
      campo: 'gastosVarios',
      etiqueta: 'Gastos Varios / Contingencia',
      valorAnterior: anterior.gastosVarios,
      valorNuevo: nuevo.gastosVarios,
      tipo: 'moneda',
    });
  }

  if (anterior.margenGananciaOperativa !== nuevo.margenGananciaOperativa) {
    modificaciones.push({
      campo: 'margenGananciaOperativa',
      etiqueta: 'Margen de Ganancia Objetivo',
      valorAnterior: `${anterior.margenGananciaOperativa}%`,
      valorNuevo: `${nuevo.margenGananciaOperativa}%`,
      tipo: 'porcentaje',
    });
  }

  if (anterior.alumnosProyectados !== nuevo.alumnosProyectados) {
    modificaciones.push({
      campo: 'alumnosProyectados',
      etiqueta: 'Meta de Alumnos Proyectados',
      valorAnterior: `${anterior.alumnosProyectados} alumnos`,
      valorNuevo: `${nuevo.alumnosProyectados} alumnos`,
      tipo: 'numero',
    });
  }

  if (anterior.alumnosFinal !== nuevo.alumnosFinal) {
    modificaciones.push({
      campo: 'alumnosFinal',
      etiqueta: 'Alumnos Inscritos Reales',
      valorAnterior: `${anterior.alumnosFinal} alumnos`,
      valorNuevo: `${nuevo.alumnosFinal} alumnos`,
      tipo: 'numero',
    });
  }

  if (anterior.seLlevoACabo !== nuevo.seLlevoACabo) {
    modificaciones.push({
      campo: 'seLlevoACabo',
      etiqueta: 'Estado de Ejecución',
      valorAnterior: anterior.seLlevoACabo,
      valorNuevo: nuevo.seLlevoACabo,
      tipo: 'texto',
    });
  }

  if (anterior.nombreDocente !== nuevo.nombreDocente) {
    modificaciones.push({
      campo: 'nombreDocente',
      etiqueta: 'Docente Titular',
      valorAnterior: anterior.nombreDocente,
      valorNuevo: nuevo.nombreDocente,
      tipo: 'texto',
    });
  }

  if (anterior.tipoProyecto !== nuevo.tipoProyecto) {
    modificaciones.push({
      campo: 'tipoProyecto',
      etiqueta: 'Tipo de Proyecto',
      valorAnterior: anterior.tipoProyecto,
      valorNuevo: nuevo.tipoProyecto,
      tipo: 'texto',
    });
  }

  if (anterior.nivel !== nuevo.nivel) {
    modificaciones.push({
      campo: 'nivel',
      etiqueta: 'Nivel Académico',
      valorAnterior: anterior.nivel,
      valorNuevo: nuevo.nivel,
      tipo: 'texto',
    });
  }

  if (anterior.metodoVenta !== nuevo.metodoVenta) {
    modificaciones.push({
      campo: 'metodoVenta',
      etiqueta: 'Canal de Venta',
      valorAnterior: anterior.metodoVenta,
      valorNuevo: nuevo.metodoVenta,
      tipo: 'texto',
    });
  }

  if (anterior.fechaProgramacion !== nuevo.fechaProgramacion) {
    modificaciones.push({
      campo: 'fechaProgramacion',
      etiqueta: 'Fecha de Programación',
      valorAnterior: anterior.fechaProgramacion || 'N/A',
      valorNuevo: nuevo.fechaProgramacion || 'N/A',
      tipo: 'texto',
    });
  }

  if (anterior.fechaVenta !== nuevo.fechaVenta) {
    modificaciones.push({
      campo: 'fechaVenta',
      etiqueta: 'Fecha Cierre de Ventas',
      valorAnterior: anterior.fechaVenta || 'N/A',
      valorNuevo: nuevo.fechaVenta || 'N/A',
      tipo: 'texto',
    });
  }

  if (anterior.nombreProyecto !== nuevo.nombreProyecto) {
    modificaciones.push({
      campo: 'nombreProyecto',
      etiqueta: 'Nombre del Proyecto',
      valorAnterior: anterior.nombreProyecto,
      valorNuevo: nuevo.nombreProyecto,
      tipo: 'texto',
    });
  }

  if (modificaciones.length === 0) {
    return null;
  }

  // Determinar categoría del cambio
  const tieneCostos = modificaciones.some(m => 
    ['horasClase', 'tarifaHoraDocente', 'costoDocenteManual', 'costoZoom', 'costoPapeleria', 'gastosVarios'].includes(m.campo)
  );
  const tieneProyeccion = modificaciones.some(m => 
    ['alumnosProyectados', 'alumnosFinal'].includes(m.campo)
  );
  const tieneMargen = modificaciones.some(m => 
    ['margenGananciaOperativa'].includes(m.campo)
  );
  const tieneEstado = modificaciones.some(m => 
    ['seLlevoACabo'].includes(m.campo)
  );
  const tieneDocente = modificaciones.some(m => 
    ['nombreDocente'].includes(m.campo)
  );

  let tipoCambio: TipoCambioHistorial = 'costos';
  let titulo = 'Ajuste de parámetros';

  if (tieneCostos && tieneProyeccion) {
    tipoCambio = 'costos';
    titulo = 'Reestructuración de Costos y Proyección de Alumnos';
  } else if (tieneCostos) {
    tipoCambio = 'costos';
    titulo = 'Ajuste en Estructura de Gastos Operativos';
  } else if (tieneProyeccion) {
    tipoCambio = 'proyeccion';
    titulo = 'Actualización en Proyección o Cierre de Inscripciones';
  } else if (tieneMargen) {
    tipoCambio = 'margen_precio';
    titulo = 'Modificación de Margen Operativo y Precios';
  } else if (tieneEstado) {
    tipoCambio = 'estado';
    titulo = `Cambio de Estado a "${nuevo.seLlevoACabo}"`;
  } else if (tieneDocente) {
    tipoCambio = 'docente';
    titulo = 'Asignación o Cambio de Docente Titular';
  } else {
    tipoCambio = 'manual';
    titulo = 'Actualización de Datos Generales';
  }

  // Resumen textual de cambios
  const resumenCampos = modificaciones
    .map(m => `${m.etiqueta}: ${m.valorAnterior} ➔ ${m.valorNuevo}`)
    .join(' • ');

  const impactoFinanciero: ImpactoFinancieroHistorial = {
    gastoOperativoAnterior: anterior.gastoTotalOperativo,
    gastoOperativoNuevo: nuevo.gastoTotalOperativo,
    precioSugeridoAnterior: anterior.precioSugeridoAlumno,
    precioSugeridoNuevo: nuevo.precioSugeridoAlumno,
    gananciaFinalAnterior: anterior.totalGananciasFinales,
    gananciaFinalNueva: nuevo.totalGananciasFinales,
    puntoEquilibrioAnterior: anterior.puntoEquilibrioAlumnos,
    puntoEquilibrioNuevo: nuevo.puntoEquilibrioAlumnos,
  };

  return {
    id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    fecha: new Date().toISOString(),
    usuario,
    tipoCambio,
    titulo,
    descripcion: `Se modificaron ${modificaciones.length} campo(s): ${resumenCampos}`,
    modificaciones,
    impactoFinanciero,
  };
}

export function crearEntradaHistorialManual(
  titulo: string,
  descripcion: string,
  tipoCambio: TipoCambioHistorial = 'manual',
  usuario: string = 'Dirección Financiera'
): HistorialCambioProyecto {
  return {
    id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    fecha: new Date().toISOString(),
    usuario,
    tipoCambio,
    titulo,
    descripcion,
  };
}

export function formatearFechaHistorial(fechaISO: string): string {
  try {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return fechaISO;
  }
}
