import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  DollarSign, 
  Users, 
  ArrowRight, 
  Percent, 
  PlusCircle,
  HelpCircle,
  BookOpen,
  Calendar,
  Receipt,
  FileText,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Lightbulb,
  Zap
} from 'lucide-react';
import { Moneda, ProyectoEducativo, TipoProyecto, NivelProyecto, MetodoVenta, EstadoProyecto, TipoServicioFiscal } from '../types';
import { formatearMoneda, calcularMetricasProyecto } from '../utils/calculations';
import { REGLAS_ISV_SERVICIOS, obtenerReglaISVPorServicio, obtenerReglaFiscalPorTipoProyecto } from '../utils/isvRules';

interface QuickSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  moneda: Moneda;
  onCrearProyectoDesdeSimulador: (datos: Partial<ProyectoEducativo>) => void;
}

interface PresetProyecto {
  titulo: string;
  badge: string;
  icono: string;
  nombre: string;
  objetivo: string;
  docente: string;
  tipo: TipoProyecto;
  nivel: NivelProyecto;
  servicioFiscal: TipoServicioFiscal;
  horas: number;
  tarifaHora: number;
  zoom: number;
  papeleria: number;
  varios: number;
  margen: number;
  alumnosProyectados: number;
  alumnosFinal: number;
  metodoVenta: MetodoVenta;
  seLlevoACabo: EstadoProyecto;
}

const PRESETS_REALES: PresetProyecto[] = [
  {
    titulo: 'Curso Básico 12h',
    badge: '15% ISV',
    icono: '🎓',
    nombre: 'Curso de Excel Financiero & Modelaje',
    objetivo: 'Desarrollar modelos presupuestarios y proyecciones de flujo de caja para toma de decisiones.',
    docente: 'Walter Pedroza',
    tipo: 'Servicios educativos no acreditados (talleres, cursos libres)',
    nivel: 'Básico',
    servicioFiscal: 'Servicios educativos no acreditados (talleres, cursos libres)',
    horas: 12,
    tarifaHora: 200,
    zoom: 300,
    papeleria: 100,
    varios: 100,
    margen: 40,
    alumnosProyectados: 6,
    alumnosFinal: 6,
    metodoVenta: 'Redes sociales',
    seLlevoACabo: 'Planificado',
  },
  {
    titulo: 'Mentoría Ejecutiva 12h',
    badge: '15% ISV',
    icono: '🛠️',
    nombre: 'Programa de Capacitación & Mentoría Comercial B2B',
    objetivo: 'Técnicas de prospección, cierre comercial y negociación de alto impacto.',
    docente: 'Karla Mendoza',
    tipo: 'Capacitación profesional / Mentoría ejecutiva',
    nivel: 'Intermedio',
    servicioFiscal: 'Capacitación profesional / Mentoría ejecutiva',
    horas: 12,
    tarifaHora: 250,
    zoom: 300,
    papeleria: 100,
    varios: 100,
    margen: 40,
    alumnosProyectados: 6,
    alumnosFinal: 6,
    metodoVenta: 'WhatsApp',
    seLlevoACabo: 'Planificado',
  },
  {
    titulo: 'Bootcamp Tech 40h',
    badge: '15% ISV',
    icono: '🚀',
    nombre: 'Bootcamp de Análisis de Datos con Python & SQL',
    objetivo: 'Extracción, limpieza y visualización de datos aplicada al negocio.',
    docente: 'Carlos Alvarado',
    tipo: 'Servicios educativos no acreditados (talleres, cursos libres)',
    nivel: 'Avanzado',
    servicioFiscal: 'Servicios educativos no acreditados (talleres, cursos libres)',
    horas: 40,
    tarifaHora: 250,
    zoom: 300,
    papeleria: 100,
    varios: 100,
    margen: 50,
    alumnosProyectados: 8,
    alumnosFinal: 8,
    metodoVenta: 'Publicidad Paga (Ads)',
    seLlevoACabo: 'Planificado',
  },
  {
    titulo: 'Formación Universitaria',
    badge: 'Exento ISV (0%)',
    icono: '📜',
    nombre: 'Programa Universitario en Dirección Estratégica',
    objetivo: 'Formación acreditada universitaria en dirección ejecutiva y liderazgo corporativo.',
    docente: 'Andrea Paz',
    tipo: 'Formación académica acreditada (ej. convenios universitarios)',
    nivel: 'Avanzado',
    servicioFiscal: 'Formación académica acreditada (ej. convenios universitarios)',
    horas: 60,
    tarifaHora: 250,
    zoom: 300,
    papeleria: 100,
    varios: 100,
    margen: 50,
    alumnosProyectados: 12,
    alumnosFinal: 12,
    metodoVenta: 'Convenios / Empresas',
    seLlevoACabo: 'Planificado',
  },
  {
    titulo: 'Consultoría Especializada',
    badge: '15% ISV',
    icono: '⭐',
    nombre: 'Consultoría & Transformación con IA para Directivos',
    objetivo: 'Aplicación de agentes inteligentes y automatizaciones en procesos estratégicos.',
    docente: 'Walter Pedroza',
    tipo: 'Consultoría empresarial',
    nivel: 'Intermedio',
    servicioFiscal: 'Consultoría empresarial',
    horas: 6,
    tarifaHora: 350,
    zoom: 300,
    papeleria: 100,
    varios: 100,
    margen: 80,
    alumnosProyectados: 10,
    alumnosFinal: 10,
    metodoVenta: 'Email Marketing',
    seLlevoACabo: 'Planificado',
  }
];

export const QuickSimulatorModal: React.FC<QuickSimulatorModalProps> = ({
  isOpen,
  onClose,
  moneda,
  onCrearProyectoDesdeSimulador,
}) => {
  // Estado completo como proyecto real
  const [nombreProyecto, setNombreProyecto] = useState('Curso de Finanzas Aplicadas & Presupuesto');
  const [objetivoGeneral, setObjetivoGeneral] = useState('Desarrollar competencias para estructurar costos, precios y rentabilidad financiera.');
  const [nombreDocente, setNombreDocente] = useState('Walter Pedroza');
  const [tipoProyecto, setTipoProyecto] = useState<TipoProyecto>('Capacitación profesional / Mentoría ejecutiva');
  const [nivel, setNivel] = useState<NivelProyecto>('Básico');
  const [servicioFiscal, setServicioFiscal] = useState<TipoServicioFiscal>('Capacitación profesional / Mentoría ejecutiva');
  const [aplicaISV, setAplicaISV] = useState(true);
  
  const [fechaProgramacion, setFechaProgramacion] = useState(new Date().toISOString().slice(0, 10));
  const [fechaVenta, setFechaVenta] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  
  const [horasClase, setHorasClase] = useState(20);
  const [tarifaHoraDocente, setTarifaHoraDocente] = useState(200);
  const [costoZoom, setCostoZoom] = useState(300);
  const [costoPapeleria, setCostoPapeleria] = useState(100);
  const [gastosVarios, setGastosVarios] = useState(100);
  
  const [margenGananciaOperativa, setMargenGananciaOperativa] = useState(40);
  const [alumnosProyectados, setAlumnosProyectados] = useState(6);
  const [alumnosFinal, setAlumnosFinal] = useState(6);
  
  const [metodoVenta, setMetodoVenta] = useState<MetodoVenta>('Redes sociales');
  const [seLlevoACabo, setSeLlevoACabo] = useState<EstadoProyecto>('Planificado');
  const [observaciones, setObservaciones] = useState('Simulación de proyecto para evaluación de rentabilidad.');

  if (!isOpen) return null;

  // Regla tributaria del SAR en tiempo real
  const reglaFiscalActual = obtenerReglaISVPorServicio(servicioFiscal);

  const handleCambioServicio = (nuevoServicio: TipoServicioFiscal) => {
    const regla = obtenerReglaISVPorServicio(nuevoServicio);
    setServicioFiscal(nuevoServicio);
    setAplicaISV(regla.gravaISV);
  };

  const aplicarPreset = (p: PresetProyecto) => {
    setNombreProyecto(p.nombre);
    setObjetivoGeneral(p.objetivo);
    setNombreDocente(p.docente);
    setTipoProyecto(p.tipo);
    setNivel(p.nivel);
    setServicioFiscal(p.servicioFiscal);
    const regla = obtenerReglaISVPorServicio(p.servicioFiscal);
    setAplicaISV(regla.gravaISV);
    setHorasClase(p.horas);
    setTarifaHoraDocente(p.tarifaHora);
    setCostoZoom(p.zoom);
    setCostoPapeleria(p.papeleria);
    setGastosVarios(p.varios);
    setMargenGananciaOperativa(p.margen);
    setAlumnosProyectados(p.alumnosProyectados);
    setAlumnosFinal(p.alumnosFinal);
    setMetodoVenta(p.metodoVenta);
    setSeLlevoACabo(p.seLlevoACabo);
    setObservaciones(`Simulado en base a plantilla: ${p.titulo}`);
  };

  // Cálculo integral en vivo de todas las métricas reales
  const resultado = calcularMetricasProyecto({
    id: 'simulacion-en-vivo',
    nombreProyecto: nombreProyecto || 'Proyecto Simulado',
    objetivoGeneral,
    nombreDocente: nombreDocente || 'Docente Responsable',
    tipoProyecto,
    nivel,
    servicioFiscal,
    aplicaISV,
    fechaProgramacion,
    fechaVenta,
    horasClase: Number(horasClase) || 0,
    tarifaHoraDocente: Number(tarifaHoraDocente) || 200,
    costoZoom: Number(costoZoom) || 0,
    costoPapeleria: Number(costoPapeleria) || 0,
    gastosVarios: Number(gastosVarios) || 0,
    margenGananciaOperativa: Number(margenGananciaOperativa) || 0,
    alumnosProyectados: Number(alumnosProyectados) || 6,
    alumnosFinal: Math.max(6, Number(alumnosFinal) || 6),
    metodoVenta,
    seLlevoACabo,
    observaciones,
  });

  const handleCrearProyectoReal = () => {
    onCrearProyectoDesdeSimulador({
      nombreProyecto: nombreProyecto.trim() || 'Proyecto Educativo Simulado',
      objetivoGeneral: objetivoGeneral.trim(),
      nombreDocente: nombreDocente.trim() || 'Docente Asignado',
      tipoProyecto,
      nivel,
      servicioFiscal,
      aplicaISV,
      fechaProgramacion,
      fechaVenta,
      horasClase: Number(horasClase) || 0,
      tarifaHoraDocente: Number(tarifaHoraDocente) || 200,
      costoDocenteManual: (Number(horasClase) || 0) * (Number(tarifaHoraDocente) || 200),
      costoZoom: Number(costoZoom) || 0,
      costoPapeleria: Number(costoPapeleria) || 0,
      gastosVarios: Number(gastosVarios) || 0,
      margenGananciaOperativa: Number(margenGananciaOperativa) || 0,
      alumnosProyectados: Number(alumnosProyectados) || 6,
      alumnosFinal: Math.max(6, Number(alumnosFinal) || 6),
      metodoVenta,
      seLlevoACabo,
      observaciones: observaciones.trim() || 'Proyecto configurado y validado en el Simulador Integral',
    });
    onClose();
  };

  const margenesPredefinidos = [40, 50, 70, 80, 100];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div 
        id="modal-simulador-integral"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-150"
      >
        
        {/* Header Principal */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/30 border border-purple-400/40 text-purple-200 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Simulador Integral de Proyectos Educativos Reales
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded">
                  En Vivo
                </span>
              </div>
              <p className="text-xs text-purple-200/80 mt-0.5">
                Modela y analiza proyectos con todos los parámetros académicos, operativos y régimen tributario ISV (SAR)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-purple-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Presets Rápidos */}
        <div className="bg-purple-50/60 px-5 sm:px-6 py-2.5 border-b border-purple-100 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="font-bold text-purple-900 shrink-0 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-purple-600" />
            <span>Plantillas Rápidas:</span>
          </span>
          <div className="flex gap-1.5 shrink-0">
            {PRESETS_REALES.map((preset) => (
              <button
                key={preset.titulo}
                type="button"
                onClick={() => aplicarPreset(preset)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-purple-100/80 text-slate-700 hover:text-purple-900 border border-purple-200 rounded-lg font-medium text-[11px] shadow-2xs transition-colors"
              >
                <span>{preset.icono}</span>
                <span>{preset.titulo}</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-purple-100 text-purple-800 font-semibold">
                  {preset.badge}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Cuerpo con 2 Columnas */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Columna Izquierda: Parámetros Completos del Proyecto Real (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* 1. Datos Académicos & Generales */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  <span>1. Información General del Proyecto</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nombre del Proyecto Educativo <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={nombreProyecto}
                      onChange={(e) => setNombreProyecto(e.target.value)}
                      placeholder="Ej: Taller de Análisis Financiero"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Objetivo General de Aprendizaje
                    </label>
                    <input
                      type="text"
                      value={objetivoGeneral}
                      onChange={(e) => setObjetivoGeneral(e.target.value)}
                      placeholder="Competencias que adquirirá el participante..."
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Docente Responsable
                      </label>
                      <input
                        type="text"
                        value={nombreDocente}
                        onChange={(e) => setNombreDocente(e.target.value)}
                        placeholder="Nombre docente"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Clasificación Oficial del SAR
                        </label>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          {aplicaISV ? '15% ISV' : 'Exento (0%)'}
                        </span>
                      </div>
                      <select
                        value={tipoProyecto}
                        onChange={(e) => {
                          const nuevoTipo = e.target.value as TipoProyecto;
                          const regla = obtenerReglaFiscalPorTipoProyecto(nuevoTipo);
                          setTipoProyecto(nuevoTipo);
                          setServicioFiscal(regla.servicio as TipoServicioFiscal);
                          setAplicaISV(regla.gravaISV);
                        }}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="Capacitación profesional / Mentoría ejecutiva">Capacitación profesional / Mentoría ejecutiva (15% ISV)</option>
                        <option value="Formación académica acreditada (ej. convenios universitarios)">Formación académica acreditada (Exento 0% ISV)</option>
                        <option value="Servicios educativos no acreditados (talleres, cursos libres)">Servicios educativos no acreditados (talleres, cursos libres) (15% ISV)</option>
                        <option value="Consultoría empresarial">Consultoría empresarial (15% ISV)</option>
                        <option value="Intermediación laboral / servicios de RRHH">Intermediación laboral / servicios de RRHH (15% ISV)</option>
                        <option value="Servicios administrativos / gestión de proyectos">Servicios administrativos / gestión de proyectos (15% ISV)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nivel Académico
                      </label>
                      <select
                        value={nivel}
                        onChange={(e) => {
                          const nuevoNivel = e.target.value as NivelProyecto;
                          setNivel(nuevoNivel);
                          if (nuevoNivel === 'Básico') {
                            setHorasClase(12);
                          }
                        }}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                      >
                        <option value="Básico">Básico (Auto: 12 horas - Norma)</option>
                        <option value="Intermedio">Intermedio</option>
                        <option value="Avanzado">Avanzado</option>
                        <option value="Todos los niveles">Todos los niveles</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Fecha de Programación / Inicio</span>
                      </label>
                      <input
                        type="date"
                        value={fechaProgramacion}
                        onChange={(e) => setFechaProgramacion(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Fecha Límite de Venta</span>
                      </label>
                      <input
                        type="date"
                        value={fechaVenta}
                        onChange={(e) => setFechaVenta(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Estructura de Gastos Operativos Reales */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
                    <DollarSign className="w-4 h-4 text-amber-600" />
                    <span>2. Costos & Gastos Operativos</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Gasto Total: {formatearMoneda(resultado.gastoTotalOperativo, moneda)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Horas de Clase Totales
                      </label>
                      {nivel === 'Básico' && (
                        <span className="text-[10px] font-black text-blue-800 bg-blue-100 border border-blue-200 px-1.5 py-0.2 rounded">
                          ⚡ 12h Norma Básica
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={horasClase}
                      onChange={(e) => setHorasClase(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tarifa Docente por Hora ({moneda})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={tarifaHoraDocente}
                      onChange={(e) => setTarifaHoraDocente(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-500">
                      Subtotal Honorarios: {formatearMoneda(resultado.costoDocenteCalculado, moneda)}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Costos Institucionales de Soporte ({moneda})
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1 font-medium">Plataforma Zoom</label>
                      <input
                        type="number"
                        min="0"
                        value={costoZoom}
                        onChange={(e) => setCostoZoom(Number(e.target.value))}
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1 font-medium">Papelería / Guías</label>
                      <input
                        type="number"
                        min="0"
                        value={costoPapeleria}
                        onChange={(e) => setCostoPapeleria(Number(e.target.value))}
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1 font-medium">Gastos Varios</label>
                      <input
                        type="number"
                        min="0"
                        value={gastosVarios}
                        onChange={(e) => setGastosVarios(Number(e.target.value))}
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Margen Deseado & Metas de Alumnos */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  <Percent className="w-4 h-4 text-blue-600" />
                  <span>3. Margen de Ganancia & Alumnos</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5 text-xs">
                    <label className="font-semibold text-slate-700">
                      Margen de Ganancia Operativa deseado (%)
                    </label>
                    <span className="font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      {margenGananciaOperativa}%
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {margenesPredefinidos.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMargenGananciaOperativa(m)}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                          margenGananciaOperativa === m
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {m}%
                      </button>
                    ))}
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={margenesPredefinidos.length - 1}
                    step={1}
                    value={(() => {
                      const idx = margenesPredefinidos.indexOf(margenGananciaOperativa);
                      return idx !== -1 ? idx : 0;
                    })()}
                    onChange={(e) => {
                      const idx = Number(e.target.value);
                      setMargenGananciaOperativa(margenesPredefinidos[idx]);
                    }}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5 px-0.5">
                    {margenesPredefinidos.map((m) => (
                      <span 
                        key={m} 
                        className={margenGananciaOperativa === m ? 'text-blue-700 font-black' : ''}
                      >
                        {m}%
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Alumnos Proyectados (Meta Base)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={alumnosProyectados}
                      onChange={(e) => setAlumnosProyectados(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-500">
                      Determina el costo y precio base por cupo
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Alumnos Finales (Inscritos Reales)
                    </label>
                    <input
                      type="number"
                      min="4"
                      value={alumnosFinal}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setAlumnosFinal(val < 4 ? 4 : val);
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-emerald-50 border border-emerald-300 rounded-lg font-mono font-bold text-emerald-900"
                    />
                    <span className="text-[10px] text-slate-500">
                      Simula el escenario de recaudación real (Mínimo: 4)
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Régimen Fiscal ISV (SAR Honduras) */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                    <Receipt className="w-4 h-4 text-indigo-600" />
                    <span>4. Régimen Fiscal ISV (SAR Honduras)</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    aplicaISV 
                      ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  }`}>
                    {aplicaISV ? '✅ Grava 15% ISV' : '❌ Exento de ISV'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Clasificación del Servicio (Catálogo SAR)
                  </label>
                  <select
                    value={servicioFiscal}
                    onChange={(e) => handleCambioServicio(e.target.value as TipoServicioFiscal)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                  >
                    {REGLAS_ISV_SERVICIOS.map((regla) => (
                      <option key={regla.servicio} value={regla.servicio}>
                        {regla.servicio} ({regla.gravaISV ? 'Grava 15%' : 'Exento'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs flex items-center justify-between gap-2">
                  <span className="text-slate-600 text-[11px]">
                    <strong>Base Legal:</strong> {reglaFiscalActual.baseLegal || 'Ley del ISV (SAR Honduras)'}
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={aplicaISV}
                      onChange={(e) => setAplicaISV(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-slate-800 font-semibold text-[11px]">
                      Aplicar 15% ISV
                    </span>
                  </label>
                </div>
              </div>

              {/* 5. Comercialización & Estado */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Método de Venta
                    </label>
                    <select
                      value={metodoVenta}
                      onChange={(e) => setMetodoVenta(e.target.value as MetodoVenta)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                    >
                      <option value="Redes sociales">Redes sociales</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Publicidad Paga (Ads)">Publicidad Paga (Ads)</option>
                      <option value="Email Marketing">Email Marketing</option>
                      <option value="Referidos">Referidos</option>
                      <option value="Convenios / Empresas">Convenios / Empresas</option>
                      <option value="Llamadas / Telemarketing">Llamadas / Telemarketing</option>
                      <option value="Página Web">Página Web</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Estado del Proyecto
                    </label>
                    <select
                      value={seLlevoACabo}
                      onChange={(e) => setSeLlevoACabo(e.target.value as EstadoProyecto)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-semibold"
                    >
                      <option value="Planificado">Planificado</option>
                      <option value="En curso">En curso</option>
                      <option value="Sí">Sí (Realizado con éxito)</option>
                      <option value="Pospuesto">Pospuesto</option>
                      <option value="Cancelado">Cancelado</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Observaciones / Notas
                  </label>
                  <input
                    type="text"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Notas o condiciones del proyecto..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

            </div>

            {/* Columna Derecha: HUD Financiero & Fiscal en Tiempo Real (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-xl space-y-4 sticky top-4">
                
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Resultados Financieros & Fiscales
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800">
                    {moneda}
                  </span>
                </div>

                {/* Tarjeta de Ticket Sugerido al Alumno */}
                <div className="bg-purple-950/70 border border-purple-800/90 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
                      Ticket por Alumno ({resultado.alumnosProyectados} proyectados)
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      resultado.aplicaISV 
                        ? 'bg-amber-900/60 text-amber-300 border border-amber-700' 
                        : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                    }`}>
                      {resultado.aplicaISV ? 'ISV 15%' : 'Exento'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Precio Neto:</span>
                      <span className="font-mono font-bold text-sm text-slate-100">
                        {formatearMoneda(resultado.precioSugeridoAlumno, moneda)}
                      </span>
                    </div>

                    <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">ISV (15%):</span>
                      <span className="font-mono font-bold text-sm text-amber-400">
                        +{formatearMoneda(resultado.isvPorAlumno, moneda)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-blue-950/70 border border-blue-800/80 rounded-lg p-3 text-center">
                    <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider block">
                      Precio Final Facturado al Alumno:
                    </span>
                    <div className="text-2xl font-black text-blue-400 font-mono mt-0.5">
                      {formatearMoneda(resultado.precioSugeridoConISV, moneda)}
                    </div>
                  </div>
                </div>

                {/* Métricas de Costos y Ventas */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Gasto Total Operativo:</span>
                    <span className="font-mono font-bold text-amber-400">
                      {formatearMoneda(resultado.gastoTotalOperativo, moneda)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Venta Requerida Base ({resultado.margenGananciaOperativa}%):</span>
                    <span className="font-mono font-semibold text-slate-200">
                      {formatearMoneda(resultado.precioVentaRequerido, moneda)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Punto de Equilibrio:</span>
                    <span className="font-mono font-bold text-purple-300">
                      {resultado.puntoEquilibrioAlumnos} alumnos
                    </span>
                  </div>
                </div>

                {/* Liquidación Escenario Real */}
                <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Liquidación ({resultado.alumnosFinal} alumnos inscritos)</span>
                    <span className="font-mono text-slate-400">
                      Dif: {resultado.diferenciaAlumnos > 0 ? `+${resultado.diferenciaAlumnos}` : resultado.diferenciaAlumnos}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span>Facturación Total c/ ISV:</span>
                    <span className="font-mono font-bold text-slate-100">
                      {formatearMoneda(resultado.ingresoTotalConISV, moneda)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span>Ingreso Neto SUMMIT:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {formatearMoneda(resultado.ingresoTotalNeto, moneda)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-amber-400">
                    <span>ISV a Trasladar SAR (15%):</span>
                    <span className="font-mono font-bold">
                      {formatearMoneda(resultado.isvTotalTrasladarSAR, moneda)}
                    </span>
                  </div>
                </div>

                {/* Resultado de Ganancia Final */}
                <div className={`rounded-xl p-4 border ${
                  resultado.totalGananciasFinales >= 0
                    ? 'bg-emerald-950/70 border-emerald-700/80 text-emerald-100'
                    : 'bg-rose-950/70 border-rose-700/80 text-rose-100'
                }`}>
                  <div className="text-[11px] font-bold uppercase tracking-wider">
                    Total Ganancias Finales SUMMIT
                  </div>
                  <div className="text-2xl font-black font-mono mt-0.5">
                    {formatearMoneda(resultado.totalGananciasFinales, moneda)}
                  </div>
                  <div className="text-[10px] opacity-80 mt-1">
                    {resultado.totalGananciasFinales >= 0
                      ? '✅ Proyecto rentable. Cumple la meta de rentabilidad esperada.'
                      : '⚠️ En pérdida. Se requieren más alumnos para cubrir costos.'}
                  </div>
                </div>

                {/* Botón Principal Guardar en Matriz */}
                <button
                  id="btn-guardar-simulacion-matriz"
                  onClick={handleCrearProyectoReal}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Guardar Proyecto Real en la Matriz</span>
                </button>

              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
