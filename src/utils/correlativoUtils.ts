import { ProyectoEducativo, TipoProyecto } from '../types';

/**
 * Obtiene el prefijo de código institucional según la clasificación oficial del SAR.
 */
export function obtenerPrefijoTipo(tipo?: TipoProyecto | string): string {
  switch (tipo) {
    case 'Capacitación profesional / Mentoría ejecutiva':
      return 'CAP';
    case 'Consultoría empresarial':
      return 'CON';
    case 'Formación académica acreditada (ej. convenios universitarios)':
      return 'ACA';
    case 'Intermediación laboral / servicios de RRHH':
      return 'RRHH';
    case 'Servicios administrativos / gestión de proyectos':
      return 'ADM';
    case 'Servicios educativos no acreditados (talleres, cursos libres)':
      return 'EDU';
    default:
      return 'SUM';
  }
}

/**
 * Calcula el siguiente número correlativo disponible y genera los códigos automáticos
 * para control académico, comercial y fiscal ante el SAR.
 */
export function generarSiguienteCorrelativo(
  proyectos: ProyectoEducativo[],
  tipo?: TipoProyecto | string,
  anio: number = 2026
): {
  numeroCorrelativo: number;
  codigoPrograma: string;
  codigoFiscalSAR: string;
} {
  let maxCorrelativo = 0;

  proyectos.forEach((p) => {
    if (p.numeroCorrelativo && typeof p.numeroCorrelativo === 'number') {
      if (p.numeroCorrelativo > maxCorrelativo) {
        maxCorrelativo = p.numeroCorrelativo;
      }
    } else if (p.codigoPrograma) {
      // Intentar extraer números al final del código (ej: SUM-2026-003 -> 3, ACAD-2026-ING01 -> 1)
      const match = p.codigoPrograma.match(/(\d+)$/);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxCorrelativo) {
          maxCorrelativo = num;
        }
      }
    }
  });

  const siguienteNumero = maxCorrelativo + 1;
  const correlativoPad = String(siguienteNumero).padStart(3, '0');
  const prefijo = obtenerPrefijoTipo(tipo);

  // Código estándar de control SUMMIT: ej. SUM-2026-001 o CUR-2026-001
  const codigoPrograma = `SUM-${anio}-${correlativoPad}`;
  
  // Correlativo fiscal para vinculación directa con comprobantes y libros de ISV ante el SAR
  const codigoFiscalSAR = `SAR-ISV-${anio}-${correlativoPad}`;

  return {
    numeroCorrelativo: siguienteNumero,
    codigoPrograma,
    codigoFiscalSAR,
  };
}

/**
 * Garantiza que cada proyecto en la lista tenga su correlativo secuencial único,
 * su código de programa y su correlativo fiscal SAR perfectamente sincronizados.
 */
export function asegurarCorrelativos(proyectos: ProyectoEducativo[]): ProyectoEducativo[] {
  let contador = 1;
  const anio = 2026;

  return proyectos.map((p) => {
    const num = p.numeroCorrelativo && p.numeroCorrelativo > 0 ? p.numeroCorrelativo : contador;
    contador = Math.max(contador + 1, num + 1);
    
    const correlativoPad = String(num).padStart(3, '0');
    const codigoPrograma = p.codigoPrograma || `SUM-${anio}-${correlativoPad}`;
    const codigoFiscalSAR = p.codigoFiscalSAR || `SAR-ISV-${anio}-${correlativoPad}`;

    return {
      ...p,
      numeroCorrelativo: num,
      codigoPrograma,
      codigoFiscalSAR,
    };
  });
}

/**
 * Formato corto para etiquetas y tablas: ej. "#001" o "#001 • SUM-2026-001"
 */
export function formatearCorrelativo(numero?: number, codigo?: string): string {
  if (!numero && !codigo) return '#001';
  const numStr = numero ? `#${String(numero).padStart(3, '0')}` : '';
  if (numStr && codigo) return `${numStr} • ${codigo}`;
  return numStr || codigo || '#001';
}
