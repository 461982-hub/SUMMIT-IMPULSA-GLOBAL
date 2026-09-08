/**
 * Utilidades para manejo de fechas, días hábiles y proyecciones de programación académica y comercial en SUMMIT.
 */

/**
 * Suma días hábiles (lunes a viernes, excluyendo sábados y domingos)
 * a una fecha base en formato YYYY-MM-DD.
 * 
 * @param fechaInicioStr Fecha inicial en formato YYYY-MM-DD
 * @param diasHabiles Cantidad de días hábiles a sumar (por defecto 30)
 * @returns Fecha resultante en formato YYYY-MM-DD
 */
export function sumarDiasHabiles(fechaInicioStr: string, diasHabiles: number = 30): string {
  if (!fechaInicioStr) return '';

  const partes = fechaInicioStr.split('-');
  if (partes.length !== 3) return '';

  const anio = parseInt(partes[0], 10);
  const mes = parseInt(partes[1], 10) - 1;
  const dia = parseInt(partes[2], 10);

  if (isNaN(anio) || isNaN(mes) || isNaN(dia)) return '';

  const fecha = new Date(anio, mes, dia);
  let contadorDiasHabiles = 0;

  while (contadorDiasHabiles < diasHabiles) {
    fecha.setDate(fecha.getDate() + 1);
    const diaSemana = fecha.getDay(); // 0 = Domingo, 6 = Sábado
    if (diaSemana !== 0 && diaSemana !== 6) {
      contadorDiasHabiles++;
    }
  }

  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');

  return `${y}-${m}-${d}`;
}

/**
 * Suma días calendario corridos a una fecha base en formato YYYY-MM-DD.
 */
export function sumarDiasCalendario(fechaInicioStr: string, diasCalendario: number = 30): string {
  if (!fechaInicioStr) return '';

  const partes = fechaInicioStr.split('-');
  if (partes.length !== 3) return '';

  const anio = parseInt(partes[0], 10);
  const mes = parseInt(partes[1], 10) - 1;
  const dia = parseInt(partes[2], 10);

  if (isNaN(anio) || isNaN(mes) || isNaN(dia)) return '';

  const fecha = new Date(anio, mes, dia);
  fecha.setDate(fecha.getDate() + diasCalendario);

  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');

  return `${y}-${m}-${d}`;
}

/**
 * Calcula la diferencia en días hábiles entre dos fechas YYYY-MM-DD
 */
export function contarDiasHabilesEntreFechas(fechaInicioStr: string, fechaFinStr: string): number {
  if (!fechaInicioStr || !fechaFinStr) return 0;

  const [a1, m1, d1] = fechaInicioStr.split('-').map(Number);
  const [a2, m2, d2] = fechaFinStr.split('-').map(Number);

  const inicio = new Date(a1, m1 - 1, d1);
  const fin = new Date(a2, m2 - 1, d2);

  if (inicio > fin) return 0;

  let habiles = 0;
  const cursor = new Date(inicio);

  while (cursor < fin) {
    cursor.setDate(cursor.getDate() + 1);
    const dia = cursor.getDay();
    if (dia !== 0 && dia !== 6) {
      habiles++;
    }
  }

  return habiles;
}

/**
 * Calcula la diferencia en días calendario entre dos fechas YYYY-MM-DD
 */
export function contarDiasCalendarioEntreFechas(fechaInicioStr: string, fechaFinStr: string): number {
  if (!fechaInicioStr || !fechaFinStr) return 0;
  const [a1, m1, d1] = fechaInicioStr.split('-').map(Number);
  const [a2, m2, d2] = fechaFinStr.split('-').map(Number);
  const inicio = new Date(a1, m1 - 1, d1);
  const fin = new Date(a2, m2 - 1, d2);
  const diffMs = fin.getTime() - inicio.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Formatea una fecha YYYY-MM-DD a formato amigable DD/MM/YYYY
 */
export function formatearFechaCorta(fechaStr?: string): string {
  if (!fechaStr) return '-';
  const partes = fechaStr.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return fechaStr;
}
