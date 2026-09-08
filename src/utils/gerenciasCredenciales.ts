/**
 * Directorio Oficial de Cuentas de Correo Electrónico por Gerencia
 * SUMMIT IMPULSA GLOBAL
 * 
 * Asignación oficial:
 * 1. Gerencia Académica: academia.summitg@gmail.com
 * 2. Gerencia General / Administración: administracion.summitg@gmail.com
 * 3. Gerencia de Comercialización: comercial.summitg@gmail.com
 */

import { VistaPrincipal } from '../types';

export interface CredencialGerencia {
  id: 'gerencia-academica' | 'gerencia-general' | 'gerencia-comercializacion';
  claveCorta: 'academica' | 'administracion' | 'comercial';
  nombreGerencia: string;
  departamento: string;
  lider: string;
  correo: string;
  pasoFlujo: number;
  presupuestoAnualHNL: number;
  participacionPresupuesto: string;
  numActividades: number;
  porcentajeActividades: string;
  colorTema: {
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
    badgeText: string;
    accent: string;
  };
  descripcion: string;
  responsabilidades: string[];
}

export const CREDENCIALES_GERENCIAS: Record<'academica' | 'administracion' | 'comercial', CredencialGerencia> = {
  academica: {
    id: 'gerencia-academica',
    claveCorta: 'academica',
    nombreGerencia: 'Gerencia Académica',
    departamento: 'Pilar Central Formativo, Curricular & Gestión Docente',
    lider: 'Phd. Donal Reyes',
    correo: 'academia.summitg@gmail.com',
    pasoFlujo: 1,
    presupuestoAnualHNL: 759500,
    participacionPresupuesto: '47.4%',
    numActividades: 19,
    porcentajeActividades: '43.2%',
    colorTema: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-900',
      badgeBg: 'bg-blue-600',
      badgeText: 'text-white',
      accent: 'blue',
    },
    descripcion: 'Diseño curricular, cálculo de costos de honorarios docentes, acreditación SAR y asignación horaria.',
    responsabilidades: [
      'Creación inicial y formulación de programas educativos',
      'Cálculo de horas docentes y fijación de costos por hora',
      'Elaboración de Syllabus, planes de clase y rúbricas',
      'Control de expedientes docentes y retenciones SAR'
    ]
  },
  comercial: {
    id: 'gerencia-comercializacion',
    claveCorta: 'comercial',
    nombreGerencia: 'Gerencia Comercial y Expansión',
    departamento: 'Dirección Comercial, B2B, Marketing, Alianzas & Matrícula',
    lider: 'Msc. Lilian Ordoñez',
    correo: 'comercial.summitg@gmail.com',
    pasoFlujo: 2,
    presupuestoAnualHNL: 330000,
    participacionPresupuesto: '20.6%',
    numActividades: 12,
    porcentajeActividades: '27.3%',
    colorTema: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-900',
      badgeBg: 'bg-emerald-600',
      badgeText: 'text-white',
      accent: 'emerald',
    },
    descripcion: 'Embudo de conversión, precio preventa Early Bird, campañas CAC/ROAS y matrícula real de alumnos.',
    responsabilidades: [
      'Recepción de programas notificados por Gerencia Académica',
      'Fijación de precios preventa, tarifas finales y convenios B2B',
      'Presupuesto y ejecución de campañas de publicidad digital',
      'Registro de alumnos inscritos reales y cálculo de CAC/ROAS'
    ]
  },
  administracion: {
    id: 'gerencia-general',
    claveCorta: 'administracion',
    nombreGerencia: 'Gerencia General',
    departamento: 'Administración, Legal, TI ERP & Dirección Ejecutiva',
    lider: 'Dr. Walter Pedroza',
    correo: 'administracion.summitg@gmail.com',
    pasoFlujo: 3,
    presupuestoAnualHNL: 512000,
    participacionPresupuesto: '32.0%',
    numActividades: 13,
    porcentajeActividades: '29.5%',
    colorTema: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-900',
      badgeBg: 'bg-purple-600',
      badgeText: 'text-white',
      accent: 'purple',
    },
    descripcion: 'Supervisión de P&L integral, dictámenes finales de proyectos, autorización de costos fijos y auditoría.',
    responsabilidades: [
      'Emisión de dictamen financiero final ("Listo" para realizar)',
      'Autorización exclusiva de costos fijos y directrices presupuestarias',
      'Auditoría y conciliación fiscal ante el SAR (ISV 15%)',
      'Consolidación mensual de utilidades netas y ROI institucional'
    ]
  }
};

export const LISTA_CREDENCIALES_GERENCIAS: CredencialGerencia[] = [
  CREDENCIALES_GERENCIAS.academica,
  CREDENCIALES_GERENCIAS.comercial,
  CREDENCIALES_GERENCIAS.administracion,
];

/**
 * Obtiene la credencial correspondiente a una vista o identificador de gerencia
 */
export function obtenerCredencialPorVista(vista: VistaPrincipal | string): CredencialGerencia | null {
  if (vista === 'gerencia-academica' || vista === 'academica') {
    return CREDENCIALES_GERENCIAS.academica;
  }
  if (vista === 'gerencia-comercializacion' || vista === 'comercial' || vista === 'comercializacion') {
    return CREDENCIALES_GERENCIAS.comercial;
  }
  if (vista === 'gerencia-general' || vista === 'administracion' || vista === 'general') {
    return CREDENCIALES_GERENCIAS.administracion;
  }
  return null;
}

/**
 * Retorna el correo oficial institucional correspondiente a una gerencia
 */
export function obtenerCorreoOficialGerencia(vistaOGerencia: string): string {
  const cred = obtenerCredencialPorVista(vistaOGerencia);
  return cred ? cred.correo : 'info@summitimpulsa.com';
}
