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
 * para control interno de la empresa y control fiscal ante el SAR.
 */
export function generarSiguienteCorrelativo(
  proyectos: ProyectoEducativo[],
  tipo?: TipoProyecto | string,
  anio: number = 2026,
  aplicaISV?: boolean
): {
  numeroCorrelativo: number;
  codigoProyecto: string;
  codigoPrograma: string;
  correlativoSAR: string;
  codigoFiscalSAR: string;
} {
  let maxCorrelativo = 0;

  proyectos.forEach((p) => {
    if (p.numeroCorrelativo && typeof p.numeroCorrelativo === 'number') {
      if (p.numeroCorrelativo > maxCorrelativo) {
        maxCorrelativo = p.numeroCorrelativo;
      }
    } else {
      // Intentar extraer números al final de codigoProyecto o codigoPrograma
      const codigoAProbar = p.codigoProyecto || p.codigoPrograma || '';
      const match = codigoAProbar.match(/(\d+)$/);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxCorrelativo) {
          maxCorrelativo = num;
        }
      }
    }
  });

  const siguienteNumero = maxCorrelativo + 1;
  const correlativoPad3 = String(siguienteNumero).padStart(3, '0');
  const correlativoPad8 = String(siguienteNumero).padStart(8, '0');

  // 1. Control Interno de la Empresa: SIG-ACAD-2026-001
  const codigoProyecto = `SIG-ACAD-${anio}-${correlativoPad3}`;
  const codigoPrograma = codigoProyecto; // Retrocompatibilidad

  // 2. Control Fiscal Oficial ante el SAR: Formato Oficial SAR de 8 dígitos (Punto Emisión - Establecimiento - Tipo Doc - Número Secuencial)
  // En Honduras SAR: 000-001-01-XXXXXXXX
  const correlativoSAR = `000-001-01-${correlativoPad8}`;
  const tipoFiscal = aplicaISV ? 'ISV' : 'EXENTO';
  const codigoFiscalSAR = `SAR-${tipoFiscal}-${anio}-${correlativoPad3}`;

  return {
    numeroCorrelativo: siguienteNumero,
    codigoProyecto,
    codigoPrograma,
    correlativoSAR,
    codigoFiscalSAR,
  };
}

/**
 * Garantiza que cada proyecto en la lista tenga su correlativo secuencial único,
 * su código interno institucional de la empresa y su correlativo oficial SAR.
 */
export function asegurarCorrelativos(proyectos: ProyectoEducativo[]): ProyectoEducativo[] {
  let contador = 1;
  const anio = 2026;

  return proyectos.map((p) => {
    const num = p.numeroCorrelativo && p.numeroCorrelativo > 0 ? p.numeroCorrelativo : contador;
    contador = Math.max(contador + 1, num + 1);
    
    const correlativoPad3 = String(num).padStart(3, '0');
    const correlativoPad8 = String(num).padStart(8, '0');
    const codigoProyecto = p.codigoProyecto || p.codigoPrograma || `SIG-ACAD-${anio}-${correlativoPad3}`;
    const correlativoSAR = p.correlativoSAR || `000-001-01-${correlativoPad8}`;
    const codigoFiscalSAR = p.codigoFiscalSAR || `SAR-ISV-${anio}-${correlativoPad3}`;

    return {
      ...p,
      numeroCorrelativo: num,
      codigoProyecto,
      codigoPrograma: codigoProyecto,
      correlativoSAR,
      codigoFiscalSAR,
    };
  });
}

/**
 * Asegura que un proyecto individual cuente con sus correlativos automáticos (Empresa y SAR).
 */
export function asegurarCorrelativoUnico(
  proyecto: ProyectoEducativo,
  listaExistente: ProyectoEducativo[] = []
): ProyectoEducativo {
  if (proyecto.numeroCorrelativo && proyecto.codigoProyecto && proyecto.correlativoSAR) {
    return proyecto;
  }
  const correlativos = generarSiguienteCorrelativo(
    listaExistente,
    proyecto.tipoProyecto,
    2026,
    proyecto.aplicaISV
  );
  return {
    ...proyecto,
    numeroCorrelativo: proyecto.numeroCorrelativo || correlativos.numeroCorrelativo,
    codigoProyecto: proyecto.codigoProyecto || correlativos.codigoProyecto,
    codigoPrograma: proyecto.codigoPrograma || correlativos.codigoPrograma,
    correlativoSAR: proyecto.correlativoSAR || correlativos.correlativoSAR,
    codigoFiscalSAR: proyecto.codigoFiscalSAR || correlativos.codigoFiscalSAR,
  };
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
