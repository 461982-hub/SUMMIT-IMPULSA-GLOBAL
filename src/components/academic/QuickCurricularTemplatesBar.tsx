import React, { useState } from 'react';
import { 
  BookOpen, 
  GraduationCap, 
  Sparkles, 
  Briefcase, 
  ChevronDown, 
  ChevronUp,
  Scale,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Users,
  Plus,
  ArrowRight,
  FileText,
  Sliders,
  DollarSign,
  Layers,
  Clock,
  Building2,
  BadgeCheck
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { formatearMoneda, calcularMetricasProyecto } from '../../utils/calculations';
import { formatearHNL } from '../../utils/poa2026Data';

export interface QuickCurricularTemplatesBarProps {
  proyectos?: ProyectoEducativo[];
  onCrearProyecto?: (p: ProyectoEducativo) => void;
  onEditarProyecto?: (p: ProyectoEducativo) => void;
  onNuevoProyecto?: () => void;
  onAbrirSyllabusModal?: (p?: ProyectoEducativo | null) => void;
  moneda: Moneda;
  totalProyectosActuales: number;
}

interface PlantillaCurricular {
  id: string;
  nombre: string;
  subtitulo: string;
  icono: React.ElementType;
  colorGradiente: string;
  badgeColor: string;
  horasDocente: number;
  costoHoraDocente: number;
  alumnosProyectados: number;
  precioSugerido: number;
  tipoProyecto: ProyectoEducativo['tipoProyecto'];
  servicioFiscal: string;
  aplicaISV: boolean;
  modalidad: ProyectoEducativo['modalidad'];
  descripcion: string;
  margenEstimado: string;
  alumnosMinimos: number;
}

const VALORES_REFERENCIA_POA: PlantillaCurricular[] = [
  {
    id: 'diplomado_ejecutivo',
    nombre: 'Diplomado Ejecutivo',
    subtitulo: '80 Horas • Dirección Estratégica',
    icono: GraduationCap,
    colorGradiente: 'from-blue-600 to-indigo-700',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-200',
    horasDocente: 80,
    costoHoraDocente: 350,
    alumnosProyectados: 25,
    precioSugerido: 3500,
    alumnosMinimos: 8,
    tipoProyecto: 'Diplomado',
    servicioFiscal: 'Educación Formal (Exento)',
    aplicaISV: false,
    modalidad: 'Híbrida',
    descripcion: 'Parámetro de referencia para programas ejecutivos y diplomados de alta especialización.',
    margenEstimado: '~68% margen',
  },
  {
    id: 'curso_especializado',
    nombre: 'Curso de Especialización',
    subtitulo: '40 Horas • Herramientas Prácticas',
    icono: BookOpen,
    colorGradiente: 'from-emerald-600 to-teal-700',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    horasDocente: 40,
    costoHoraDocente: 300,
    alumnosProyectados: 20,
    precioSugerido: 2500,
    alumnosMinimos: 6,
    tipoProyecto: 'Curso',
    servicioFiscal: 'Educación Formal (Exento)',
    aplicaISV: false,
    modalidad: 'Virtual Sincrónica',
    descripcion: 'Parámetro de referencia para cursos técnicos y formación profesional con evaluación.',
    margenEstimado: '~58% margen',
  },
  {
    id: 'taller_masterclass',
    nombre: 'Taller / Masterclass',
    subtitulo: '16 Horas • Intensivo Rápido',
    icono: Sparkles,
    colorGradiente: 'from-purple-600 to-indigo-700',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-200',
    horasDocente: 16,
    costoHoraDocente: 400,
    alumnosProyectados: 30,
    precioSugerido: 1200,
    alumnosMinimos: 4,
    tipoProyecto: 'Taller',
    servicioFiscal: 'Educación Formal (Exento)',
    aplicaISV: false,
    modalidad: 'Virtual Sincrónica',
    descripcion: 'Parámetro de referencia para talleres cortos intensivos de rápida colocación comercial.',
    margenEstimado: '~72% margen',
  },
  {
    id: 'seminario_incompany',
    nombre: 'Seminario Corporativo B2B',
    subtitulo: '24 Horas • A la Medida de Empresas',
    icono: Briefcase,
    colorGradiente: 'from-slate-800 to-slate-900',
    badgeColor: 'bg-slate-100 text-slate-900 border-slate-300',
    horasDocente: 24,
    costoHoraDocente: 450,
    alumnosProyectados: 18,
    precioSugerido: 2800,
    alumnosMinimos: 6,
    tipoProyecto: 'Seminario',
    servicioFiscal: 'Capacitación Empresarial (Grava 15%)',
    aplicaISV: true,
    modalidad: 'Presencial',
    descripcion: 'Parámetro de referencia para capacitación in-situ corporativa con facturación gravada.',
    margenEstimado: '~64% margen',
  },
];

export const QuickCurricularTemplatesBar: React.FC<QuickCurricularTemplatesBarProps> = ({
  proyectos = [],
  onCrearProyecto,
  onEditarProyecto,
  onNuevoProyecto,
  onAbrirSyllabusModal,
  moneda,
  totalProyectosActuales,
}) => {
  const [expandido, setExpandido] = useState<boolean>(true);
  // Si hay proyectos registrados, mostrar por defecto la vista de Controles de Rentabilidad Real;
  // de lo contrario o si el usuario lo desea, mostrar los Valores de Referencia del POA 2026.
  const tieneProyectos = proyectos.length > 0;
  const [vistaActiva, setVistaActiva] = useState<'controles' | 'referencia'>(
    tieneProyectos ? 'controles' : 'referencia'
  );

  // Cálculos consolidados de los proyectos llenos por Gerencia Académica
  const numProyectos = proyectos.length;
  const metaPOAProyectos = 74;
  const avanceMetaPct = Math.round((numProyectos / metaPOAProyectos) * 100);

  const margenPromedioReal = numProyectos > 0
    ? Math.round(proyectos.reduce((acc, p) => acc + (p.margenGananciaOperativa || 0), 0) / numProyectos)
    : 0;

  const tarifaDocentePromedio = numProyectos > 0
    ? Math.round(proyectos.reduce((acc, p) => acc + (p.tarifaHoraDocente || 0), 0) / numProyectos)
    : 0;

  const totalHorasDocente = proyectos.reduce((acc, p) => acc + (p.horasClase || 0), 0);
  
  const facturacionProyectadaTotal = proyectos.reduce((acc, p) => {
    const matriculas = p.alumnosFinal || p.alumnosProyectados || 0;
    const precio = p.precioSugeridoAlumno || 0;
    return acc + (matriculas * precio);
  }, 0);

  const puntoEquilibrioPromedio = numProyectos > 0
    ? (proyectos.reduce((acc, p) => acc + (p.alumnosPuntoEquilibrio || 4), 0) / numProyectos).toFixed(1)
    : '4.2';

  // Iniciar registro manual utilizando el arquetipo de referencia como base de datos inicial
  const handleIniciarManualConReferencia = (ref: PlantillaCurricular) => {
    if (onNuevoProyecto) {
      onNuevoProyecto();
      return;
    }

    if (onCrearProyecto) {
      const ahora = new Date();
      const timestamp = ahora.getTime();
      const correlativo = numProyectos + 1;
      const baseProyecto: Partial<ProyectoEducativo> = {
        id: `proy-manual-${timestamp}`,
        codigoPrograma: `SMT-${ref.tipoProyecto.substring(0, 3).toUpperCase()}-2026-${String(correlativo).padStart(3, '0')}`,
        nombreProyecto: `Nuevo ${ref.nombre} (Registro Manual Académica)`,
        tipoProyecto: ref.tipoProyecto,
        modalidad: ref.modalidad,
        horasClase: ref.horasDocente,
        tarifaHoraDocente: ref.costoHoraDocente,
        alumnosProyectados: ref.alumnosProyectados,
        alumnosFinal: ref.alumnosMinimos,
        precioSugeridoAlumno: ref.precioSugerido,
        costoPapeleria: 500,
        costoZoom: 300,
        gastosVarios: 200,
        servicioFiscal: ref.servicioFiscal as any,
        aplicaISV: ref.aplicaISV,
        tasaISV: ref.aplicaISV ? 0.15 : 0,
        nombreDocente: 'Phd. Donal Reyes',
        docenteEspecialidad: 'Dirección Académica y Gestión Estratégica',
        docenteCorreo: 'academia.summitg@gmail.com',
        docenteTelefono: '+504 9999-0000',
        fechaProgramacion: ahora.toISOString().split('T')[0],
        fechaVenta: ahora.toISOString().split('T')[0],
        seLlevoACabo: 'Planificado',
        observaciones: `Registrado manualmente por Gerencia Académica bajo parámetros de referencia del POA 2026. Pendiente alimentación de comercialización y cobros.`,
      };

      const proyectoCompleto = calcularMetricasProyecto(baseProyecto as ProyectoEducativo);
      onCrearProyecto(proyectoCompleto);
    }
  };

  return (
    <div id="seccion-controles-rentabilidad-poa" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
      {/* Cabecera Principal */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-400/30 shrink-0">
            <Scale className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                {tieneProyectos && vistaActiva === 'controles'
                  ? 'Controles de Rentabilidad • Proyectos Registrados (POA 2026)'
                  : 'Valores de Referencia para Controles de Rentabilidad • POA 2026'}
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-blue-500/30 text-blue-200 border border-blue-400/40 rounded-full">
                {tieneProyectos ? `${numProyectos} Registrados Manualmente` : 'Alimentación Manual Requerida'}
              </span>
            </div>
            <p className="text-[11px] text-blue-200/90 mt-0.5 max-w-2xl leading-relaxed">
              En el POA 2026 los valores de referencia guían el control de rentabilidad institucional. Todos los proyectos, comercialización y cobranzas son alimentados de manera manual por cada gerencia.
            </p>
          </div>
        </div>

        {/* Controles de Navegación y Expansión */}
        <div className="flex items-center gap-2 self-end md:self-center">
          {tieneProyectos && (
            <div className="bg-white/10 p-1 rounded-xl border border-white/15 flex items-center text-xs font-bold">
              <button
                id="btn-ver-controles-rentabilidad"
                onClick={() => setVistaActiva('controles')}
                className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  vistaActiva === 'controles'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Controles Real ({numProyectos})</span>
              </button>
              <button
                id="btn-ver-referencias-poa"
                onClick={() => setVistaActiva('referencia')}
                className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  vistaActiva === 'referencia'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Valores de Referencia</span>
              </button>
            </div>
          )}

          <button
            id="btn-toggle-expandir-controles"
            onClick={() => setExpandido(!expandido)}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/15"
          >
            <span>{expandido ? 'Ocultar' : 'Mostrar'}</span>
            {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expandido && (
        <div className="p-4 sm:p-5 bg-slate-50/70 border-t border-slate-200 space-y-4">
          
          {/* Banner Institucional de Gobernanza y Alimentación Manual por Gerencia */}
          <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2.5">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-700" />
                <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  Flujo de Alimentación Manual por Gerencia Responsable
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                Sin generación automática • Valores reales
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
              {/* 1. Gerencia Académica */}
              <div className="bg-blue-50/60 rounded-lg p-2.5 border border-blue-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-blue-900 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-700" />
                    1. Gerencia Académica
                  </span>
                  <span className="text-[9.5px] font-black uppercase px-1.5 py-0.2 bg-blue-200/70 text-blue-900 rounded">
                    {numProyectos > 0 ? `${numProyectos} cargados` : 'Pendiente'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Alimenta manualmente proyectos, carga horaria, temarios, honorarios docentes y sílabos oficiales garantizados por Phd. Donal Reyes.
                </p>
              </div>

              {/* 2. Gerencia de Comercialización */}
              <div className="bg-emerald-50/60 rounded-lg p-2.5 border border-emerald-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-emerald-900 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                    2. Gerencia Comercial
                  </span>
                  <span className="text-[9.5px] font-black uppercase px-1.5 py-0.2 bg-emerald-200/70 text-emerald-900 rounded">
                    Manual en Sitio
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Alimenta manualmente prospectos (leads), inversión publicitaria, tasa de cierre, matrículas reales y precios finales de venta.
                </p>
              </div>

              {/* 3. Gerencia General / Cobros y SAR */}
              <div className="bg-purple-50/60 rounded-lg p-2.5 border border-purple-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-purple-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                    3. Cobros & SAR
                  </span>
                  <span className="text-[9.5px] font-black uppercase px-1.5 py-0.2 bg-purple-200/70 text-purple-900 rounded">
                    Conciliación Real
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Alimenta manualmente cobros recaudados, facturación fiscal SAR con CAI, retención de ISV y deducción formal de metas POA.
                </p>
              </div>
            </div>
          </div>

          {/* VISTA A: CONTROLES DE RENTABILIDAD DE PROYECTOS LLENOS (CUANDO HAY PROYECTOS) */}
          {vistaActiva === 'controles' && tieneProyectos && (
            <div className="space-y-3.5">
              {/* Métricas de Control de Rentabilidad Consolidada */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs">
                  <span className="text-[10.5px] font-semibold text-slate-500 block">Margen Promedio Real</span>
                  <div className="text-xl font-black text-emerald-700 mt-0.5 flex items-baseline gap-1">
                    {margenPromedioReal}%
                    <span className="text-[10px] font-bold text-slate-500">vs ≥40% ref.</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                    {margenPromedioReal >= 40 ? '🟢 Cumple estándar POA' : '🟡 Bajo parámetro ref.'}
                  </span>
                </div>

                <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs">
                  <span className="text-[10.5px] font-semibold text-slate-500 block">Tarifa Docente Prom.</span>
                  <div className="text-xl font-black text-blue-900 mt-0.5 flex items-baseline gap-1">
                    L. {tarifaDocentePromedio}
                    <span className="text-[10px] font-normal text-slate-500">/hr</span>
                  </div>
                  <span className="text-[10px] text-blue-700 font-bold block mt-0.5">
                    Tope ref: L. 300 - L. 450/hr
                  </span>
                </div>

                <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs">
                  <span className="text-[10.5px] font-semibold text-slate-500 block">Punto Equilibrio Prom.</span>
                  <div className="text-xl font-black text-slate-900 mt-0.5 flex items-baseline gap-1">
                    {puntoEquilibrioPromedio}
                    <span className="text-[10px] font-normal text-slate-500">alumnos/grupo</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                    Base operativa segura
                  </span>
                </div>

                <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs">
                  <span className="text-[10.5px] font-semibold text-slate-500 block">Avance Cartera POA</span>
                  <div className="text-xl font-black text-indigo-900 mt-0.5 flex items-baseline gap-1">
                    {numProyectos} / {metaPOAProyectos}
                    <span className="text-[10px] font-bold text-indigo-600">({avanceMetaPct}%)</span>
                  </div>
                  <span className="text-[10px] text-indigo-600 font-bold block mt-0.5">
                    Grupos cuatrimestre 2026
                  </span>
                </div>
              </div>

              {/* Lista Resumida de Proyectos Llenados con Estatus de Rentabilidad */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-700" />
                    <span className="text-xs font-black text-slate-900">
                      Monitoreo de Rentabilidad por Programa Registrado ({numProyectos})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {onNuevoProyecto && (
                      <button
                        id="btn-formular-nuevo-proyecto-manual"
                        onClick={onNuevoProyecto}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Formular Nuevo Proyecto Manual</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {proyectos.map((p) => {
                    const margen = p.margenGananciaOperativa || 0;
                    const cumpleReferencia = margen >= 40;
                    const precio = p.precioSugeridoAlumno || 0;
                    const alumnos = p.alumnosFinal || p.alumnosProyectados || 0;
                    const ingresosEst = alumnos * precio;

                    return (
                      <div key={p.id} className="p-3 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded border border-slate-200">
                              {p.codigoPrograma || `SMT-2026-${String(p.numeroCorrelativo || p.id).padStart(3, '0')}`}
                            </span>
                            <span className="text-xs font-black text-slate-900">
                              {p.nombreProyecto}
                            </span>
                            <span className="text-[9.5px] px-1.5 py-0.2 rounded font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {p.tipoProyecto}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                            <span>Docente: <strong className="text-slate-700 font-bold">{p.nombreDocente || 'Por Asignar'}</strong></span>
                            <span>Horas: <strong className="text-slate-700 font-bold">{p.horasClase || 0} hrs</strong> (L. {p.tarifaHoraDocente || 0}/hr)</span>
                            <span>Alumnos: <strong className="text-slate-700 font-bold">{alumnos}</strong></span>
                            <span>Punto Eq: <strong className="text-slate-700 font-bold">{p.alumnosPuntoEquilibrio || 4} alum.</strong></span>
                            <span>Facturación Est: <strong className="text-indigo-700 font-bold">{formatearHNL(ingresosEst)}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                            cumpleReferencia 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {margen}% Margen Real
                          </span>

                          {onAbrirSyllabusModal && (
                            <button
                              onClick={() => onAbrirSyllabusModal(p)}
                              className="px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-50 rounded-lg border border-blue-200 flex items-center gap-1 transition-colors cursor-pointer"
                              title="Ver Sílabo Oficial con Firma de Phd. Donal Reyes"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                              <span>Sílabo Oficial</span>
                            </button>
                          )}

                          {onEditarProyecto && (
                            <button
                              onClick={() => onEditarProyecto(p)}
                              className="px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Sliders className="w-3.5 h-3.5 text-slate-600" />
                              <span>Editar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* VISTA B: VALORES DE REFERENCIA PARA CONTROLES DE RENTABILIDAD POA 2026 */}
          {(vistaActiva === 'referencia' || !tieneProyectos) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    Arquetipos de Referencia Institucional para Control de Rentabilidad
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Utilice estos estándares como parámetro de control para registrar los proyectos manualmente.
                  </p>
                </div>

                {tieneProyectos && (
                  <button
                    onClick={() => setVistaActiva('controles')}
                    className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Volver a Proyectos Registrados ({numProyectos})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {VALORES_REFERENCIA_POA.map((ref) => {
                  const Icono = ref.icono;

                  return (
                    <div
                      key={ref.id}
                      className="bg-white rounded-xl p-4 border border-slate-200 flex flex-col justify-between hover:shadow-xs transition-all"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${ref.badgeColor}`}>
                            {ref.tipoProyecto}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            {ref.margenEstimado}
                          </span>
                        </div>

                        <div className="flex items-start gap-2.5 pt-1">
                          <div className={`p-2 rounded-xl text-white bg-gradient-to-br ${ref.colorGradiente} shrink-0 shadow-2xs`}>
                            <Icono className="w-4 h-4" />
                          </div>
                          <div>
                            <h5 className="text-xs font-black text-slate-900 leading-snug">
                              {ref.nombre}
                            </h5>
                            <span className="text-[10.5px] text-slate-500 block">
                              {ref.subtitulo}
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {ref.descripcion}
                        </p>

                        {/* Parámetros de Referencia */}
                        <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 space-y-1 text-[10.5px]">
                          <div className="flex justify-between text-slate-600">
                            <span>Horas Referencia:</span>
                            <span className="font-mono font-bold text-slate-800">{ref.horasDocente} hrs</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Tarifa Docente Tope:</span>
                            <span className="font-mono font-bold text-blue-900">L. {ref.costoHoraDocente}/hr</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Precio Sugerido:</span>
                            <span className="font-mono font-bold text-indigo-700">{formatearHNL(ref.precioSugerido)}</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Punto de Equilibrio:</span>
                            <span className="font-bold text-slate-800">{ref.alumnosMinimos} alumnos mín.</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Régimen Fiscal:</span>
                            <span className="font-bold text-slate-700">{ref.aplicaISV ? 'Grava 15%' : 'Exento SAR'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Botón para Formular Manualmente con esta Base */}
                      <button
                        onClick={() => handleIniciarManualConReferencia(ref)}
                        className="mt-3.5 w-full py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-2xs bg-slate-900 hover:bg-blue-600 text-white cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Formular Manualmente con esta Base</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
