import { ProyectoEducativo } from '../types';

export function calcularMetricasProyecto(
  input: Omit<
    ProyectoEducativo,
    | 'costoDocenteCalculado'
    | 'gastoTotalOperativo'
    | 'precioVentaRequerido'
    | 'gananciaOperativa'
    | 'precioSugeridoAlumno'
    | 'diferenciaAlumnos'
    | 'gananciaAlumnosAdicionales'
    | 'ingresoRealTotal'
    | 'totalGananciasFinales'
    | 'puntoEquilibrioAlumnos'
    | 'roiPorcentaje'
  >
): ProyectoEducativo {
  const horas = Math.max(0, input.horasClase || 0);
  const tarifaDocente = Math.max(0, input.tarifaHoraDocente ?? 200);
  
  // Costo Docente: si se ingresó costoDocenteManual se respeta, sino horas * tarifa
  const costoDocenteCalculado =
    input.costoDocenteManual !== undefined && input.costoDocenteManual > 0
      ? input.costoDocenteManual
      : horas * tarifaDocente;

  const costoZoom = Math.max(0, input.costoZoom || 0);
  const costoPapeleria = Math.max(0, input.costoPapeleria || 0);
  const gastosVarios = Math.max(0, input.gastosVarios || 0);

  // Gasto Total Operativo = Costo Docente + Costo Zoom + Papelería + Gastos Varios
  const gastoTotalOperativo =
    costoDocenteCalculado + costoZoom + costoPapeleria + gastosVarios;

  // Margen de ganancia operativa (ej: 30%)
  const margenDecimal = (input.margenGananciaOperativa || 0) / 100;

  // Precio de Venta Requerido = Gasto Total Operativo * (1 + Margen)
  const precioVentaRequerido = gastoTotalOperativo * (1 + margenDecimal);

  // Ganancia Operativa = Precio de Venta Requerido - Gasto Total Operativo (o gastoTotalOperativo * margen)
  const gananciaOperativa = precioVentaRequerido - gastoTotalOperativo;

  // Alumnos Proyectados (Base mínima institucional: 6 alumnos)
  const alumnosProyectados = Math.max(1, input.alumnosProyectados || 6);

  // Precio Sugerido Costo Alumno = Precio de Venta Requerido / Alumnos Proyectados
  const precioSugeridoAlumno = precioVentaRequerido / alumnosProyectados;

  // Alumnos Final (Inscritos reales) - Base mínima institucional: 6 alumnos
  const alumnosFinal = Math.max(6, Number(input.alumnosFinal) || 6);

  // Diferencia Alumnos = Alumnos Final - Alumnos Proyectados
  const diferenciaAlumnos = alumnosFinal - alumnosProyectados;

  // Ganancia por Alumnos Adicionales = Diferencia positiva * Precio Sugerido Alumno
  const gananciaAlumnosAdicionales =
    diferenciaAlumnos > 0 ? diferenciaAlumnos * precioSugeridoAlumno : 0;

  // Ingreso Real Total = Alumnos Final * Precio Sugerido Alumno
  const ingresoRealTotal = alumnosFinal * precioSugeridoAlumno;

  // Total Ganancias Finales = Ingreso Real Total - Gasto Total Operativo
  const totalGananciasFinales = ingresoRealTotal - gastoTotalOperativo;

  // Punto de equilibrio en alumnos: cantidad mínima de alumnos para cubrir todos los gastos operativos
  const puntoEquilibrioAlumnos =
    precioSugeridoAlumno > 0
      ? Math.ceil(gastoTotalOperativo / precioSugeridoAlumno)
      : 0;

  // Retorno de Inversión (ROI %): (Total Ganancias Finales / Gasto Total Operativo) * 100
  const roiPorcentaje =
    gastoTotalOperativo > 0
      ? (totalGananciasFinales / gastoTotalOperativo) * 100
      : 0;

  // Lógica Fiscal ISV (SAR - 15% o Exento)
  // Formación académica acreditada está exenta de ISV por ley
  const esExentoPorDefecto = input.servicioFiscal === 'Formación académica acreditada (ej. convenios universitarios)';
  const aplicaISV = input.aplicaISV !== undefined ? input.aplicaISV : !esExentoPorDefecto;
  const tasaISV = aplicaISV ? 15 : 0;
  
  // 15% ISV aplicado a la venta requerida total del curso
  const isvVentaRequeridaTotal = aplicaISV ? precioVentaRequerido * 0.15 : 0;
  const precioVentaRequeridoConISV = precioVentaRequerido + isvVentaRequeridaTotal;

  // ISV por cada alumno (calculado sobre el precio sugerido neto)
  const isvPorAlumno = aplicaISV ? precioSugeridoAlumno * 0.15 : 0;
  
  // Precio total con ISV al cliente / alumno
  const precioSugeridoConISV = precioSugeridoAlumno + isvPorAlumno;
  
  // Total ISV a trasladar a la SAR según ingresos reales facturados (15% sobre las ventas totales reales del curso)
  const isvTotalTrasladarSAR = aplicaISV ? ingresoRealTotal * 0.15 : 0;
  
  // Ingreso total facturado (Subtotal neto + ISV recaudado)
  const ingresoFacturadoTotal = ingresoRealTotal + isvTotalTrasladarSAR;

  return {
    ...input,
    horaCreacion: input.horaCreacion || new Date().toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
    fechaHoraGrabacion: input.fechaHoraGrabacion || new Date().toLocaleString('es-HN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
    horaUltimaModificacion: input.horaUltimaModificacion || new Date().toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
    horasClase: horas,
    tarifaHoraDocente: tarifaDocente,
    costoDocenteManual: input.costoDocenteManual,
    costoZoom,
    costoPapeleria,
    gastosVarios,
    alumnosProyectados,
    alumnosFinal,
    servicioFiscal: input.servicioFiscal || 'Servicios educativos no acreditados (talleres, cursos libres)',
    aplicaISV,
    tasaISV,
    isvPorAlumno,
    precioSugeridoConISV,
    isvVentaRequeridaTotal,
    precioVentaRequeridoConISV,
    isvTotalTrasladarSAR,
    ingresoFacturadoTotal,
    ingresoTotalConISV: ingresoFacturadoTotal,
    ingresoTotalNeto: ingresoRealTotal,
    costoDocenteCalculado,
    gastoTotalOperativo,
    precioVentaRequerido,
    gananciaOperativa,
    precioSugeridoAlumno,
    diferenciaAlumnos,
    gananciaAlumnosAdicionales,
    ingresoRealTotal,
    totalGananciasFinales,
    puntoEquilibrioAlumnos,
    roiPorcentaje,
  };
}

export function formatearMoneda(
  monto: number,
  moneda: 'LPS' | 'USD' | 'EUR' | 'MXN' = 'LPS'
): string {
  const formatoNumero = new Intl.NumberFormat('es-HN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(monto);

  switch (moneda) {
    case 'USD':
      return `$ ${formatoNumero}`;
    case 'EUR':
      return `€ ${formatoNumero}`;
    case 'MXN':
      return `$ ${formatoNumero} MXN`;
    case 'LPS':
    default:
      return `L ${formatoNumero}`;
  }
}
