export interface ReglaISVServicio {
  id: string;
  servicio: TipoServicioFiscal;
  gravaISV: boolean;
  tasaISV: number; // 15 o 0
  etiquetaGrava: string; // '✅ Sí (15%)' o '❌ Exento'
  observaciones: string;
  badgeColor: 'emerald' | 'amber' | 'blue' | 'slate';
  baseLegal?: string;
  fundamentoLegal?: string;
  aplicaRetencion?: boolean;
}

import { TipoServicioFiscal } from '../types';

export const REGLAS_ISV_SERVICIOS: ReglaISVServicio[] = [
  {
    id: 'consultoria',
    servicio: 'Consultoría empresarial',
    gravaISV: true,
    tasaISV: 15,
    etiquetaGrava: '✅ Sí (15%)',
    observaciones: 'Se considera servicio profesional gravado. SUMMIT debe cobrar el ISV al cliente y trasladarlo a la SAR.',
    badgeColor: 'amber',
    baseLegal: 'Art. 1 y 15 Ley de Impuesto Sobre Ventas (SAR) - Servicios Profesionales y Asesorías',
  },
  {
    id: 'capacitacion_mentoria',
    servicio: 'Capacitación profesional / Mentoría ejecutiva',
    gravaISV: true,
    tasaISV: 15,
    etiquetaGrava: '✅ Sí (15%)',
    observaciones: 'Al no estar acreditada como educación formal bajo la Ley de Educación Superior, se grava con ISV.',
    badgeColor: 'amber',
    baseLegal: 'Ley del ISV / Criterios SAR sobre capacitación técnica privada no universitaria',
  },
  {
    id: 'formacion_acreditada',
    servicio: 'Formación académica acreditada (ej. convenios universitarios)',
    gravaISV: false,
    tasaISV: 0,
    etiquetaGrava: '❌ Exento',
    observaciones: 'Si SUMMIT ofrece programas avalados por una institución de educación superior reconocida, puede estar exento de ISV.',
    badgeColor: 'emerald',
    baseLegal: 'Art. 15 numeral 1 Ley del ISV - Servicios de Educación Formal y Universitaria Acreditada',
  },
  {
    id: 'intermediacion_rrhh',
    servicio: 'Intermediación laboral / servicios de RRHH',
    gravaISV: true,
    tasaISV: 15,
    etiquetaGrava: '✅ Sí (15%)',
    observaciones: 'Clasificado como servicio gravado.',
    badgeColor: 'amber',
    baseLegal: 'Ley del ISV - Servicios Terciarios, Selección de Personal y Reclutamiento',
  },
  {
    id: 'servicios_administrativos',
    servicio: 'Servicios administrativos / gestión de proyectos',
    gravaISV: true,
    tasaISV: 15,
    etiquetaGrava: '✅ Sí (15%)',
    observaciones: 'Gravados como servicios profesionales.',
    badgeColor: 'amber',
    baseLegal: 'Ley del ISV - Honorarios Profesionales y Servicios de Administración Tercerizados',
  },
  {
    id: 'servicios_educativos_no_acreditados',
    servicio: 'Servicios educativos no acreditados (talleres, cursos libres)',
    gravaISV: true,
    tasaISV: 15,
    etiquetaGrava: '✅ Sí (15%)',
    observaciones: 'Se consideran servicios gravados, salvo que tengan reconocimiento oficial.',
    badgeColor: 'amber',
    baseLegal: 'Ley del ISV - Educación No Formal / Cursos Libres y Talleres de Extensión Privada',
  },
];

export function obtenerReglaISVPorServicio(servicioNombre?: string): ReglaISVServicio {
  if (!servicioNombre) {
    return REGLAS_ISV_SERVICIOS[5];
  }

  const encontrada = REGLAS_ISV_SERVICIOS.find(
    (r) => r.servicio.toLowerCase() === servicioNombre.toLowerCase() || r.id === servicioNombre
  );

  return encontrada || REGLAS_ISV_SERVICIOS[5];
}

/**
 * Mapeo automático inteligente: Determina el servicio fiscal, estado de gravabilidad de ISV
 * y observaciones oficiales del SAR de acuerdo con el Tipo de Proyecto seleccionado.
 */
export function obtenerReglaFiscalPorTipoProyecto(tipoProyecto?: string): ReglaISVServicio {
  if (!tipoProyecto) {
    return REGLAS_ISV_SERVICIOS[5];
  }

  const normalizado = tipoProyecto.toLowerCase().trim();

  // 1. Consultoría empresarial
  if (
    normalizado.includes('consultor') || 
    normalizado === 'consultoría empresarial' ||
    normalizado === 'consultoria empresarial' ||
    normalizado === 'consultoria'
  ) {
    return REGLAS_ISV_SERVICIOS[0];
  }

  // 2. Capacitación profesional / Mentoría ejecutiva
  if (
    normalizado.includes('mentor') ||
    normalizado.includes('capacitaci') ||
    normalizado.includes('ejecutiv') ||
    normalizado === 'capacitación profesional / mentoría ejecutiva' ||
    normalizado === 'capacitacion profesional / mentoria ejecutiva' ||
    normalizado === 'capacitacion profesional' ||
    normalizado === 'masterclass'
  ) {
    return REGLAS_ISV_SERVICIOS[1];
  }

  // 3. Formación académica acreditada (ej. convenios universitarios) -> EXENTO
  if (
    normalizado.includes('acreditad') ||
    normalizado.includes('convenio') ||
    normalizado.includes('universit') ||
    normalizado === 'diplomado' ||
    normalizado === 'formación académica acreditada (ej. convenios universitarios)' ||
    normalizado === 'formacion academica acreditada (ej. convenios universitarios)' ||
    normalizado === 'formacion acreditada'
  ) {
    return REGLAS_ISV_SERVICIOS[2];
  }

  // 4. Intermediación laboral / servicios de RRHH
  if (
    normalizado.includes('rrhh') ||
    normalizado.includes('laboral') ||
    normalizado.includes('intermediaci') ||
    normalizado.includes('recursos humanos') ||
    normalizado.includes('reclutamiento') ||
    normalizado === 'intermediación laboral / servicios de rrhh' ||
    normalizado === 'intermediacion laboral / servicios de rrhh'
  ) {
    return REGLAS_ISV_SERVICIOS[3];
  }

  // 5. Servicios administrativos / gestión de proyectos
  if (
    normalizado.includes('administrativ') ||
    normalizado.includes('gestión de proyectos') ||
    normalizado.includes('gestion de proyectos') ||
    normalizado.includes('gestion') ||
    normalizado === 'servicios administrativos / gestión de proyectos' ||
    normalizado === 'servicios administrativos / gestion de proyectos'
  ) {
    return REGLAS_ISV_SERVICIOS[4];
  }

  // 6. Servicios educativos no acreditados (talleres, cursos libres, bootcamps, seminarios, certificaciones)
  return REGLAS_ISV_SERVICIOS[5];
}

export function calcularDesgloseFiscal(
  precioNeto: number,
  gravaISV: boolean,
  tasaISV: number = 15
) {
  const tasa = gravaISV ? tasaISV / 100 : 0;
  const isvMonto = precioNeto * tasa;
  const precioFacturadoFinal = precioNeto + isvMonto;

  return {
    precioNeto,
    gravaISV,
    tasaISV: gravaISV ? tasaISV : 0,
    isvMonto,
    precioFacturadoFinal,
  };
}
