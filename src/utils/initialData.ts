import { ProyectoEducativo } from '../types';

export const PROYECTOS_INICIALES: ProyectoEducativo[] = [];

export const MARGENES_REFERENCIA = [
  { margen: 30, alumnosMinimos: 4, descripcion: 'Margen estándar para cursos cortos y pilotos', color: 'emerald' },
  { margen: 40, alumnosMinimos: 4, descripcion: 'Margen recomendado para talleres especializados', color: 'blue' },
  { margen: 50, alumnosMinimos: 6, descripcion: 'Margen óptimo para programas grupales intermedios', color: 'indigo' },
  { margen: 80, alumnosMinimos: 8, descripcion: 'Margen de alto rendimiento para diplomados y masterclasses', color: 'purple' },
  { margen: 100, alumnosMinimos: 10, descripcion: 'Margen de escalabilidad para bootcamps y cursos masivos', color: 'amber' },
];
