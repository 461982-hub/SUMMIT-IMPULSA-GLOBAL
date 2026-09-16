import React, { useState } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RotateCcw, 
  Eye, 
  AlertTriangle, 
  Search, 
  GraduationCap, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Target, 
  FileText, 
  ShieldAlert, 
  ShieldCheck, 
  HelpCircle,
  Calendar,
  Sparkles,
  ArrowRight,
  Filter,
  Check,
  Rocket
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { formatearMoneda } from '../../utils/calculations';

interface ColaRevisionProyectosGGProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onAprobarProyecto: (p: ProyectoEducativo, motivo: string) => void;
  onRechazarProyecto: (p: ProyectoEducativo, motivo: string) => void;
  onVerFichaCompleta: (p: ProyectoEducativo) => void;
  onAprobarInicioDefinitivoYRebajarPOA?: (p: ProyectoEducativo, motivo?: string) => void;
  onAbrirComercializarProyecto?: (proyectoId?: string) => void;
  titulo?: string;
  subtitulo?: string;
  mostrarFiltrosAvanzados?: boolean;
}

export type FiltroColaGG = 'pendientes' | 'inicio_poa' | 'subsanados' | 'aprobados' | 'rechazados' | 'todos';

export const ColaRevisionProyectosGG: React.FC<ColaRevisionProyectosGGProps> = ({
  proyectos,
  moneda,
  onAprobarProyecto,
  onRechazarProyecto,
  onVerFichaCompleta,
  onAprobarInicioDefinitivoYRebajarPOA,
  onAbrirComercializarProyecto,
  titulo = 'Cola de Revisión y Dictamen de Sílabos (Gerencia General)',
  subtitulo = 'Flujo Institucional: Gerencia Académica (Elabora) → Gerencia General (Revisa y Dictamina) → Gerencia Comercial (Vende)',
  mostrarFiltrosAvanzados = true,
}) => {
  const [filtroActivo, setFiltroActivo] = useState<FiltroColaGG>('pendientes');
  const [busqueda, setBusqueda] = useState('');

  // Modales de Dictamen Obligatorio
  const [modalAprobacion, setModalAprobacion] = useState<{
    abierto: boolean;
    proyecto: ProyectoEducativo | null;
    motivo: string;
    error: string | null;
  }>({
    abierto: false,
    proyecto: null,
    motivo: '',
    error: null,
  });

  const [modalRechazo, setModalRechazo] = useState<{
    abierto: boolean;
    proyecto: ProyectoEducativo | null;
    motivo: string;
    error: string | null;
  }>({
    abierto: false,
    proyecto: null,
    motivo: '',
    error: null,
  });

  const [modalInicioPOA, setModalInicioPOA] = useState<{
    abierto: boolean;
    proyecto: ProyectoEducativo | null;
    motivo: string;
  }>({
    abierto: false,
    proyecto: null,
    motivo: '',
  });

  // Clasificación de la Cola
  const proyectosPendientes = proyectos.filter(
    (p) =>
      !p.aprobadoPorGerenciaGeneralPrevia &&
      !p.rechazadoPorGerenciaGeneral &&
      (p.etapaFlujo === 'revision_gerencia_general' || p.etapaFlujo === 'elaboracion_academica' || !p.etapaFlujo)
  );

  // Proyectos con quórum cubierto (>= 6 alumnos) remitidos a Gerencia General para Aprobación Final y Rebaja de POA
  const proyectosInicioPOA = proyectos.filter(
    (p) =>
      (p.remitidoGGParaAprobacionPOA || p.inicioCursoHabilitadoComercial || (p.etapaFlujo === 'dictamen_general' && (p.alumnosFinal || 0) >= 6)) &&
      !p.aprobadoInicioDefinitivoGG &&
      !p.aprobacionFinalGerenciaGeneral
  );

  const proyectosSubsanados = proyectos.filter(
    (p) =>
      p.corregidoReenviadoRevisionGG === true &&
      !p.aprobadoPorGerenciaGeneralPrevia
  );

  const proyectosAprobados = proyectos.filter(
    (p) =>
      p.aprobadoPorGerenciaGeneralPrevia === true ||
      p.etapaFlujo === 'comercializacion'
  );

  const proyectosRechazados = proyectos.filter(
    (p) =>
      p.rechazadoPorGerenciaGeneral === true ||
      p.etapaFlujo === 'rechazado_gerencia_general'
  );

  // Filtrado según selección
  const proyectosFiltrados = proyectos.filter((p) => {
    // Filtro de estado
    if (filtroActivo === 'pendientes') {
      const esPendiente = (!p.aprobadoPorGerenciaGeneralPrevia && !p.rechazadoPorGerenciaGeneral) || p.etapaFlujo === 'revision_gerencia_general';
      if (!esPendiente) return false;
    } else if (filtroActivo === 'inicio_poa') {
      const esInicioPOA = (p.remitidoGGParaAprobacionPOA || p.inicioCursoHabilitadoComercial || (p.etapaFlujo === 'dictamen_general' && (p.alumnosFinal || 0) >= 6)) &&
        !p.aprobadoInicioDefinitivoGG &&
        !p.aprobacionFinalGerenciaGeneral;
      if (!esInicioPOA) return false;
    } else if (filtroActivo === 'subsanados') {
      if (!p.corregidoReenviadoRevisionGG || p.aprobadoPorGerenciaGeneralPrevia) return false;
    } else if (filtroActivo === 'aprobados') {
      if (!p.aprobadoPorGerenciaGeneralPrevia && p.etapaFlujo !== 'comercializacion') return false;
    } else if (filtroActivo === 'rechazados') {
      if (!p.rechazadoPorGerenciaGeneral && p.etapaFlujo !== 'rechazado_gerencia_general') return false;
    }

    // Filtro de búsqueda
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      const matchNombre = p.nombreProyecto.toLowerCase().includes(q);
      const matchCodigo = (p.codigoProyecto || p.codigoPrograma || '').toLowerCase().includes(q);
      const matchSAR = (p.correlativoSAR || '').toLowerCase().includes(q);
      const matchDocente = (p.nombreDocente || '').toLowerCase().includes(q);
      const matchMotivoAprob = (p.motivoAprobacionGerenciaGeneral || '').toLowerCase().includes(q);
      const matchMotivoRech = (p.motivoRechazoGerenciaGeneral || '').toLowerCase().includes(q);
      if (!matchNombre && !matchCodigo && !matchSAR && !matchDocente && !matchMotivoAprob && !matchMotivoRech) {
        return false;
      }
    }

    return true;
  });

  // Handlers de Apertura de Modales
  const abrirModalAprobar = (p: ProyectoEducativo) => {
    // Sugerencia predeterminada de fundamentación positiva
    const sugerencia = `Viabilidad financiera y pedagógica verificada conforme al POA 2026. Honorarios del docente (${p.nombreDocente || 'docente'}) calculados a razón de L. ${p.tarifaHoraDocente || 200}/h, margen proyectado del ${p.margenGananciaOperativa || 30}% y tratamiento tributario SAR con ISV 15% validado. Se autoriza su traslado formal a Gerencia de Comercialización para apertura de matrícula.`;
    setModalAprobacion({
      abierto: true,
      proyecto: p,
      motivo: sugerencia,
      error: null,
    });
  };

  const abrirModalRechazar = (p: ProyectoEducativo) => {
    setModalRechazo({
      abierto: true,
      proyecto: p,
      motivo: '',
      error: null,
    });
  };

  const abrirModalInicioPOA = (p: ProyectoEducativo) => {
    const alumnos = p.alumnosFinal || 6;
    const precio = p.precioFinalAlumnoConISV || p.precioSugeridoConISV || 2500;
    const recaudado = p.montoFacturacionAprobadaHNL || p.ingresoTotalConISV || p.ingresoRealTotal || (precio * alumnos);
    const sugerencia = `Aprobación Formal de Inicio de Curso & Deducción de Metas POA 2026. Quórum de ${alumnos} alumnos alcanzado satisfactoriamente por Comercialización. Se autoriza el inicio de actividades académicas e imputación de ${formatearMoneda(recaudado, moneda)} a la meta mensual del POA. Dr. Walter Rene Pedroza.`;
    setModalInicioPOA({
      abierto: true,
      proyecto: p,
      motivo: sugerencia,
    });
  };

  // Handlers de Confirmación
  const confirmarAprobacion = () => {
    if (!modalAprobacion.proyecto) return;
    const motivoLimpio = modalAprobacion.motivo.trim();
    if (!motivoLimpio || motivoLimpio.length < 5) {
      setModalAprobacion((prev) => ({
        ...prev,
        error: 'El motivo de aprobación es un campo obligatorio. Ingrese una justificación técnica o financiera (mínimo 5 caracteres).',
      }));
      return;
    }

    onAprobarProyecto(modalAprobacion.proyecto, motivoLimpio);
    setModalAprobacion({ abierto: false, proyecto: null, motivo: '', error: null });
  };

  const confirmarRechazo = () => {
    if (!modalRechazo.proyecto) return;
    const motivoLimpio = modalRechazo.motivo.trim();
    if (!motivoLimpio || motivoLimpio.length < 5) {
      setModalRechazo((prev) => ({
        ...prev,
        error: 'El motivo del rechazo es estrictamente obligatorio para que Gerencia Académica sepa con exactitud qué corregir (mínimo 5 caracteres).',
      }));
      return;
    }

    onRechazarProyecto(modalRechazo.proyecto, motivoLimpio);
    setModalRechazo({ abierto: false, proyecto: null, motivo: '', error: null });
  };

  return (
    <div className="space-y-6">
      {/* TARJETA PRINCIPAL DE ENCABEZADO DE COLA */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-2xl p-5 text-white shadow-md border border-purple-800/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black tracking-wide text-white">
                  {titulo}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-600 text-white font-mono shadow-xs">
                  {proyectosPendientes.length} por revisar
                </span>
                {proyectosSubsanados.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-600 text-white font-mono shadow-xs animate-pulse">
                    🔄 {proyectosSubsanados.length} subsanados por Académica
                  </span>
                )}
              </div>
              <p className="text-xs text-purple-200/90 mt-1 max-w-3xl leading-relaxed">
                {subtitulo}
              </p>
              <div className="flex items-center gap-2 mt-2 text-[11px] text-purple-300">
                <span className="font-semibold text-white">Gerente General:</span>
                <span>Dr. Walter Rene Pedroza</span>
                <span>•</span>
                <span className="bg-purple-900/60 px-2 py-0.5 rounded text-purple-200 border border-purple-700/50">
                  Dictamen obligatorio con registro de motivos
                </span>
              </div>
            </div>
          </div>

          {/* Resumen Visual del Flujo Paso a Paso */}
          <div className="bg-white/10 rounded-xl p-3 border border-white/10 shrink-0 text-xs space-y-1.5 self-start lg:self-auto">
            <div className="font-bold text-purple-200 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <span>Flujo Oficial POA 2026</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-200 text-[11px] font-medium">
              <span className="px-2 py-0.5 rounded bg-blue-900/80 text-blue-200 font-bold">1. Académica</span>
              <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
              <span className="px-2 py-0.5 rounded bg-purple-600 text-white font-black shadow-xs ring-1 ring-purple-300">
                2. G. General
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
              <span className="px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-200 font-bold">3. Comercial</span>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS & SELECTOR DE ESTADOS DE LA COLA */}
      {mostrarFiltrosAvanzados && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Pestañas de Estado */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                id="btn-cola-filtro-pendientes"
                onClick={() => setFiltroActivo('pendientes')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filtroActivo === 'pendientes'
                    ? 'bg-purple-900 text-white shadow-xs font-black'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>En Cola de Revisión</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-black ${
                  proyectosPendientes.length > 0 ? 'bg-purple-600 text-white' : 'bg-slate-300 text-slate-700'
                }`}>
                  {proyectosPendientes.length}
                </span>
              </button>

              <button
                type="button"
                id="btn-cola-filtro-inicio-poa"
                onClick={() => setFiltroActivo('inicio_poa')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filtroActivo === 'inicio_poa'
                    ? 'bg-purple-700 text-white shadow-xs font-black ring-2 ring-purple-400'
                    : 'bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200'
                }`}
                title="Proyectos comercializados con quórum (mínimo 6 alumnos) remitidos a Gerencia General para inicio y rebaja del POA"
              >
                <Rocket className="w-3.5 h-3.5 text-purple-500" />
                <span>🚀 Listos Inicio & Rebaja POA</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-black ${
                  proyectosInicioPOA.length > 0 ? 'bg-purple-600 text-white animate-pulse' : 'bg-purple-200 text-purple-900'
                }`}>
                  {proyectosInicioPOA.length}
                </span>
              </button>

              <button
                type="button"
                id="btn-cola-filtro-subsanados"
                onClick={() => setFiltroActivo('subsanados')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filtroActivo === 'subsanados'
                    ? 'bg-blue-800 text-white shadow-xs font-black'
                    : 'bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
                <span>Subsanados por Académica</span>
                <span className="px-1.5 py-0.2 bg-blue-200 text-blue-900 rounded text-[10px] font-mono font-black">
                  {proyectosSubsanados.length}
                </span>
              </button>

              <button
                type="button"
                id="btn-cola-filtro-aprobados"
                onClick={() => setFiltroActivo('aprobados')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filtroActivo === 'aprobados'
                    ? 'bg-emerald-800 text-white shadow-xs font-black'
                    : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Aprobados (En Comercialización)</span>
                <span className="px-1.5 py-0.2 bg-emerald-200 text-emerald-900 rounded text-[10px] font-mono font-black">
                  {proyectosAprobados.length}
                </span>
              </button>

              <button
                type="button"
                id="btn-cola-filtro-rechazados"
                onClick={() => setFiltroActivo('rechazados')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filtroActivo === 'rechazados'
                    ? 'bg-rose-800 text-white shadow-xs font-black'
                    : 'bg-rose-50 text-rose-900 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Rechazados (En Académica)</span>
                <span className="px-1.5 py-0.2 bg-rose-200 text-rose-900 rounded text-[10px] font-mono font-black">
                  {proyectosRechazados.length}
                </span>
              </button>

              <button
                type="button"
                id="btn-cola-filtro-todos"
                onClick={() => setFiltroActivo('todos')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filtroActivo === 'todos'
                    ? 'bg-slate-800 text-white shadow-xs font-black'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>Todos los Sílabos</span>
                <span className="px-1.5 py-0.2 bg-slate-200 text-slate-800 rounded text-[10px] font-mono font-black">
                  {proyectos.length}
                </span>
              </button>
            </div>

            {/* Buscador de la Cola */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="input-busqueda-cola-gg"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por programa, código, docente o dictamen..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>
      )}

      {/* ESTADO VACÍO */}
      {proyectosFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-base font-bold text-slate-900">
              {filtroActivo === 'pendientes'
                ? '¡No hay sílabos pendientes de revisión!'
                : 'No se encontraron proyectos en esta vista'}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {filtroActivo === 'pendientes'
                ? 'Todos los proyectos elaborados por Gerencia Académica han sido revisados y dictaminados formalmente.'
                : `No hay registros que coincidan con el filtro seleccionado "${filtroActivo}".`}
            </p>
          </div>
        </div>
      ) : (
        /* LISTADO DE TARJETAS DE PROYECTOS EN LA COLA */
        <div className="space-y-4">
          {proyectosFiltrados.map((p) => {
            const codEmpresa = p.codigoProyecto || p.codigoPrograma || `SIG-ACAD-${p.id}`;
            const codSAR = p.correlativoSAR || 'Sin asignar';
            const precioConISV = p.precioFinalAlumnoConISV || p.precioSugeridoConISV || (p.precioSugeridoAlumno * 1.15);
            const esAprobado = p.aprobadoPorGerenciaGeneralPrevia || p.etapaFlujo === 'comercializacion';
            const esRechazado = p.rechazadoPorGerenciaGeneral || p.etapaFlujo === 'rechazado_gerencia_general';
            const esSubsanado = p.corregidoReenviadoRevisionGG === true && !esAprobado;
            const esInicioPOA = (p.remitidoGGParaAprobacionPOA || p.inicioCursoHabilitadoComercial || (p.etapaFlujo === 'dictamen_general' && (p.alumnosFinal || 0) >= 6)) && !p.aprobadoInicioDefinitivoGG && !p.aprobacionFinalGerenciaGeneral;
            const esAprobadoFinalPOA = Boolean(p.aprobadoInicioDefinitivoGG || p.aprobacionFinalGerenciaGeneral || p.etapaFlujo === 'aprobado_listo');

            return (
              <div
                key={p.id}
                id={`card-proyecto-cola-${p.id}`}
                className={`bg-white rounded-2xl border-2 transition-all shadow-xs hover:shadow-md overflow-hidden ${
                  esAprobadoFinalPOA
                    ? 'border-emerald-400 ring-2 ring-emerald-200'
                    : esInicioPOA
                    ? 'border-purple-400 ring-2 ring-purple-200'
                    : esAprobado
                    ? 'border-emerald-200 ring-1 ring-emerald-100'
                    : esRechazado
                    ? 'border-rose-200 ring-1 ring-rose-100'
                    : esSubsanado
                    ? 'border-blue-300 ring-2 ring-blue-100'
                    : 'border-purple-200 hover:border-purple-300'
                }`}
              >
                {/* Cabecera Superior del Card */}
                <div className={`px-5 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  esAprobadoFinalPOA
                    ? 'bg-emerald-50/90 border-emerald-200'
                    : esInicioPOA
                    ? 'bg-purple-50/90 border-purple-200'
                    : esAprobado
                    ? 'bg-emerald-50/70 border-emerald-100'
                    : esRechazado
                    ? 'bg-rose-50/70 border-rose-100'
                    : esSubsanado
                    ? 'bg-blue-50/80 border-blue-100'
                    : 'bg-purple-50/60 border-purple-100'
                }`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Badge de Estado del Flujo */}
                    {esAprobadoFinalPOA ? (
                      <span className="px-2.5 py-0.5 bg-emerald-700 text-white rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                        <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                        <span>Inicio Aprobado • POA Rebajado</span>
                      </span>
                    ) : esInicioPOA ? (
                      <span className="px-2.5 py-0.5 bg-purple-700 text-white rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs animate-pulse">
                        <Rocket className="w-3 h-3 text-purple-200" />
                        <span>Listo para Inicio & Rebaja POA ({p.alumnosFinal || 6} alumnos)</span>
                      </span>
                    ) : esAprobado ? (
                      <span className="px-2.5 py-0.5 bg-emerald-600 text-white rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Aprobado • En Comercialización</span>
                      </span>
                    ) : esRechazado ? (
                      <span className="px-2.5 py-0.5 bg-rose-600 text-white rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                        <XCircle className="w-3 h-3" />
                        <span>Rechazado • Devuelto a Académica</span>
                      </span>
                    ) : esSubsanado ? (
                      <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs animate-pulse">
                        <RotateCcw className="w-3 h-3" />
                        <span>Subsanado por Académica • Listo para Dictamen</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-purple-700 text-white rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                        <Clock className="w-3 h-3" />
                        <span>En Cola de Revisión GG</span>
                      </span>
                    )}

                    <span className="text-xs font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                      Código: {codEmpresa}
                    </span>
                    <span className="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      SAR: {codSAR}
                    </span>
                    <span className="text-xs font-semibold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {p.tipoProyecto}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {p.modalidad || 'Virtual Sincrónica'}
                    </span>
                  </div>

                  <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1 shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Registro: <strong className="text-slate-700">{p.fechaHoraGrabacion || p.fechaCreacion || '2026'}</strong></span>
                  </div>
                </div>

                {/* Contenido Principal */}
                <div className="p-5 space-y-4">
                  {/* Título y Docente */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-black text-slate-900 tracking-tight">
                        {p.nombreProyecto}
                      </h4>
                      {p.objetivoGeneral && (
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                          {p.objetivoGeneral}
                        </p>
                      )}
                    </div>
                    
                    {/* Tarifa & Docente */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shrink-0 text-xs space-y-1 md:text-right">
                      <div className="flex items-center md:justify-end gap-1.5 font-bold text-slate-800">
                        <Users className="w-3.5 h-3.5 text-purple-600" />
                        <span>{p.nombreDocente || 'Docente no asignado'}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {p.horasClase}h impartición • {formatearMoneda(p.tarifaHoraDocente || 200, moneda)}/h
                      </div>
                      <div className="text-[11px] font-bold text-indigo-700 font-mono">
                        Costo Docente: {formatearMoneda(p.costoDocenteCalculado || (p.horasClase * (p.tarifaHoraDocente || 200)), moneda)}
                      </div>
                    </div>
                  </div>

                  {/* Cuadrícula de Métricas Financieras Clave para la Decisión */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                        Gasto Total Operativo
                      </span>
                      <span className="font-mono font-black text-slate-900 text-sm block mt-0.5">
                        {formatearMoneda(p.gastoTotalOperativo, moneda)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Docente + Plataforma + SAR
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                        Punto de Equilibrio
                      </span>
                      <span className={`font-mono font-black text-sm block mt-0.5 ${
                        p.puntoEquilibrioAlumnos > p.alumnosProyectados ? 'text-rose-600' : 'text-emerald-700'
                      }`}>
                        {p.puntoEquilibrioAlumnos} de {p.alumnosProyectados} alumnos
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {p.puntoEquilibrioAlumnos <= p.alumnosProyectados ? '✓ Viable y seguro' : '⚠️ Alerta de déficit'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                        Margen Operativo
                      </span>
                      <span className={`font-mono font-black text-sm block mt-0.5 ${
                        (p.margenGananciaOperativa || 30) >= 25 ? 'text-purple-700' : 'text-amber-600'
                      }`}>
                        {p.margenGananciaOperativa || 30}% Proyectado
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Piso institucional: 25%
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                        Precio con ISV 15%
                      </span>
                      <span className="font-mono font-black text-emerald-800 text-sm block mt-0.5">
                        {formatearMoneda(precioConISV, moneda)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Neto: {formatearMoneda(p.precioSugeridoAlumno, moneda)}
                      </span>
                    </div>
                  </div>

                  {/* ======================================================== */}
                  {/* SECCIÓN OBLIGATORIA: EXPLICACIÓN DE POR QUÉ SE APROBÓ O RECHAZÓ */}
                  {/* ======================================================== */}
                  {esAprobado && (
                    <div 
                      id={`seccion-dictamen-aprobado-${p.id}`}
                      className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-300 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-emerald-950 font-black text-xs uppercase tracking-wide">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Sección de Dictamen: Fundamentación de la Aprobación</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-900 border border-emerald-300">
                          Dictamen Favorable
                        </span>
                      </div>
                      <div className="text-xs text-emerald-950 font-medium bg-white/90 p-3 rounded-lg border border-emerald-200 leading-relaxed shadow-2xs">
                        "{p.motivoAprobacionGerenciaGeneral || p.observacionesRevisionGeneral || 'Se verificó la viabilidad financiera, el costeo de honorarios y la rentabilidad del proyecto conforme a los lineamientos del POA 2026. Aprobado para venta.'}"
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-emerald-900 pt-1 gap-1 border-t border-emerald-200/60">
                        <span>
                          Firmado digitalmente por: <strong>{p.aprobadoPor || 'Dr. Walter Rene Pedroza - Gerente General'}</strong>
                        </span>
                        {p.fechaAprobacionGerenciaGeneralPrevia && (
                          <span className="font-mono">
                            Fecha: {new Date(p.fechaAprobacionGerenciaGeneralPrevia).toLocaleString('es-HN')}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {esRechazado && (
                    <div 
                      id={`seccion-dictamen-rechazado-${p.id}`}
                      className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-rose-950 font-black text-xs uppercase tracking-wide">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>Sección de Dictamen: Causa y Motivo del Rechazo</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-200 text-rose-900 border border-rose-300">
                          Devuelto a Académica
                        </span>
                      </div>
                      <div className="text-xs text-rose-950 font-medium bg-white/90 p-3 rounded-lg border border-rose-200 leading-relaxed shadow-2xs">
                        "{p.motivoRechazoGerenciaGeneral || p.observacionesRevisionGeneral || 'Se identificaron inconsistencias presupuestarias o en la tarifa docente. Requiere corrección por Gerencia Académica.'}"
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-rose-900 pt-1 gap-1 border-t border-rose-200/60">
                        <span>
                          Dictaminado por: <strong>Dr. Walter Rene Pedroza (Gerencia General)</strong>
                        </span>
                        {p.fechaRechazoGerenciaGeneral && (
                          <span className="font-mono">
                            Fecha de Rechazo: {new Date(p.fechaRechazoGerenciaGeneral).toLocaleString('es-HN')}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {esSubsanado && (
                    <div className="p-4 rounded-xl bg-blue-50 border-2 border-blue-300 space-y-2">
                      <div className="flex items-center gap-2 text-blue-950 font-black text-xs uppercase tracking-wide">
                        <RotateCcw className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Proyecto Subsanado por Gerencia Académica — Reenviado para Revisión</span>
                      </div>
                      {p.motivoRechazoGerenciaGeneral && (
                        <div className="text-xs text-slate-700 bg-white/90 p-2.5 rounded-lg border border-blue-200">
                          <strong className="text-rose-900 block text-[11px] uppercase">Observación anterior subsanada:</strong>
                          <span>"{p.motivoRechazoGerenciaGeneral}"</span>
                        </div>
                      )}
                      <p className="text-[11px] text-blue-900">
                        Gerencia Académica ha actualizado los parámetros. Proceda a evaluar y dictaminar definitivamente la aprobación o un nuevo ajuste.
                      </p>
                    </div>
                  )}

                  {esInicioPOA && (
                    <div 
                      id={`banner-inicio-poa-${p.id}`}
                      className="p-4 rounded-xl bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-2 border-purple-400 space-y-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 text-purple-950 font-black text-xs uppercase tracking-wide">
                          <Rocket className="w-4 h-4 text-purple-600 shrink-0 animate-bounce" />
                          <span>🚀 Quórum de Matrícula Alcanzado — Remitido a Gerencia General para Inicio y Rebaja POA</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-200 text-purple-900 border border-purple-300">
                          {p.alumnosFinal || 6} Alumnos Inscritos
                        </span>
                      </div>
                      <p className="text-xs text-purple-900 font-medium">
                        Gerencia Comercial ha completado la matrícula alcanzando el quórum institucional (mínimo 6 alumnos). Corresponde a la Gerencia General dictaminar el inicio oficial y aplicar la rebaja mensual al Plan Operativo Anual (POA).
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-white/90 p-3 rounded-lg border border-purple-200">
                        <span className="text-slate-600">
                          Monto a descontar de la meta POA: <strong className="font-mono text-emerald-700 text-sm">{formatearMoneda(p.montoFacturacionAprobadaHNL || p.ingresoTotalConISV || p.ingresoRealTotal || 0, moneda)}</strong>
                        </span>
                        {onAprobarInicioDefinitivoYRebajarPOA && (
                          <button
                            type="button"
                            id={`btn-aprobar-inicio-poa-${p.id}`}
                            onClick={() => abrirModalInicioPOA(p)}
                            className="px-4 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md hover:shadow-purple-700/20 cursor-pointer transition-all"
                          >
                            <ShieldCheck className="w-4 h-4 text-purple-200" />
                            <span>Aprobar Inicio Definitivo & Rebajar POA</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {esAprobadoFinalPOA && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border-2 border-emerald-300 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 text-emerald-950">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <strong className="block text-[11px] uppercase font-black text-emerald-900">
                            Inicio Definitivo Aprobado & Meta POA Imputada
                          </strong>
                          <span className="text-[11px] text-emerald-800">
                            Aprobado por: {p.aprobadoPorGerenciaGeneral || 'Dr. Walter Rene Pedroza'} • Deducción formal realizada
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-200 text-emerald-900 font-bold rounded-lg text-[10px] border border-emerald-300 shrink-0 font-mono">
                        ✓ En Ejecución
                      </span>
                    </div>
                  )}

                  {!esAprobado && !esRechazado && !esSubsanado && !esInicioPOA && !esAprobadoFinalPOA && (
                    <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-950 flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>Estado:</strong> En espera de revisión y dictamen oficial por Gerencia General. Debe hacer clic en <strong>Aprobar</strong> o <strong>Rechazar</strong> indicando el motivo correspondiente.
                      </span>
                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* BOTONES DE ACCIÓN CLARAMENTE VISIBLES */}
                  {/* ======================================================== */}
                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="button"
                      id={`btn-ver-ficha-${p.id}`}
                      onClick={() => onVerFichaCompleta(p)}
                      className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-300"
                    >
                      <Eye className="w-4 h-4 text-slate-600" />
                      <span>Ver Ficha Completa del Sílabo</span>
                    </button>

                    <div className="w-full sm:w-auto flex items-center gap-2.5 flex-wrap justify-end">
                      {/* BOTÓN INICIO POA (Si está listo para inicio y rebaja) */}
                      {esInicioPOA && onAprobarInicioDefinitivoYRebajarPOA && (
                        <button
                          type="button"
                          id={`btn-aprobar-inicio-final-${p.id}`}
                          onClick={() => abrirModalInicioPOA(p)}
                          className="px-4 py-2.5 rounded-xl font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white ring-2 ring-purple-400/40"
                          title="Aprobar inicio definitivo de curso y rebajar formalmente la meta de facturación del POA"
                        >
                          <ShieldCheck className="w-4 h-4 text-purple-200" />
                          <span>Aprobar Inicio & Rebajar POA</span>
                        </button>
                      )}

                      {/* BOTÓN RECHAZAR */}
                      <button
                        type="button"
                        id={`btn-rechazar-proyecto-${p.id}`}
                        onClick={() => abrirModalRechazar(p)}
                        className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-black text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
                          esRechazado
                            ? 'bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300'
                            : 'bg-rose-600 hover:bg-rose-700 text-white hover:shadow-rose-600/20'
                        }`}
                        title="Rechazar y devolver a Gerencia Académica con motivo obligatorio"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>{esRechazado ? 'Actualizar Motivo de Rechazo' : 'Rechazar Sílabo'}</span>
                      </button>

                      {/* ACCIÓN PRINCIPAL DE SÍLABO/PROYECTO */}
                      {esAprobado ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            id={`btn-comercializar-proyecto-${p.id}`}
                            onClick={() => (onAbrirComercializarProyecto ? onAbrirComercializarProyecto(p.id) : abrirModalAprobar(p))}
                            className="flex-1 sm:flex-initial px-4 py-2.5 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-emerald-500/20 transition-all hover:scale-[1.02] border border-emerald-300 cursor-pointer"
                            title="Procesos cumplidos: Comercializar Sílabo / Proyecto (Redes, Matrícula, Precios, Difusión)"
                          >
                            <Rocket className="w-4 h-4 text-slate-950 stroke-[2.5] shrink-0" />
                            <span>Comercializar Sílabo/Proyecto</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => abrirModalAprobar(p)}
                            className="px-2.5 py-2 text-slate-500 hover:text-slate-800 text-[11px] font-bold underline transition-colors cursor-pointer"
                            title="Editar motivo del dictamen de Gerencia General"
                          >
                            Editar dictamen
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          id={`btn-aprobar-proyecto-${p.id}`}
                          onClick={() => abrirModalAprobar(p)}
                          className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-emerald-600/30 ring-2 ring-emerald-400/40"
                          title="Aprobar y trasladar a Gerencia de Comercialización con justificación obligatoria"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Aprobar Sílabo/Proyecto</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL INTERACTIVO: APROBAR SÍLABO CON CAMPO DE TEXTO OBLIGATORIO */}
      {/* ========================================================================= */}
      {modalAprobacion.abierto && modalAprobacion.proyecto && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-emerald-500 max-w-xl w-full overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-emerald-900 to-teal-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">
                    Aprobar Sílabo y Trasladar a Comercialización
                  </h3>
                  <p className="text-xs text-emerald-200">
                    Dictamen Ejecutivo de Gerencia General (Dr. Walter Rene Pedroza)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAprobacion({ abierto: false, proyecto: null, motivo: '', error: null })}
                className="text-white/70 hover:text-white font-bold p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-6 space-y-4">
              {/* Resumen del Programa */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-700">
                    {modalAprobacion.proyecto.codigoProyecto || modalAprobacion.proyecto.codigoPrograma || 'PROY-001'}
                  </span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ISV 15% Incluido: {formatearMoneda(modalAprobacion.proyecto.precioFinalAlumnoConISV || modalAprobacion.proyecto.precioSugeridoConISV || 0, moneda)}
                  </span>
                </div>
                <div className="font-black text-slate-900 text-sm">
                  {modalAprobacion.proyecto.nombreProyecto}
                </div>
                <div className="text-slate-500 text-[11px]">
                  Docente: <strong>{modalAprobacion.proyecto.nombreDocente}</strong> • Duración: <strong>{modalAprobacion.proyecto.horasClase} horas</strong>
                </div>
              </div>

              {/* CAMPO DE TEXTO OBLIGATORIO */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-900">
                  Motivo / Fundamentación de la Aprobación (Campo Obligatorio) <span className="text-rose-600">*</span>
                </label>
                <textarea
                  id="textarea-motivo-aprobacion"
                  rows={4}
                  value={modalAprobacion.motivo}
                  onChange={(e) =>
                    setModalAprobacion((prev) => ({
                      ...prev,
                      motivo: e.target.value,
                      error: null,
                    }))
                  }
                  placeholder="Detalle los fundamentos por los cuales se aprueba el sílabo (ej. viabilidad presupuestaria, margen proyectado óptimo, cumplimiento de políticas del POA 2026)..."
                  className={`w-full p-3 text-xs rounded-xl border font-medium focus:ring-2 transition-all ${
                    modalAprobacion.error
                      ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/50'
                      : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-200 bg-slate-50/50 focus:bg-white'
                  }`}
                />

                <div className="flex items-center justify-between text-[11px]">
                  <span className={modalAprobacion.motivo.trim().length >= 5 ? 'text-emerald-700 font-bold' : 'text-slate-400 font-medium'}>
                    Caracteres: {modalAprobacion.motivo.trim().length} (Mínimo 5 requeridos)
                  </span>
                  <span className="text-slate-400">
                    Se guardará en la ficha histórica y se notificará a Comercialización
                  </span>
                </div>

                {modalAprobacion.error && (
                  <p className="text-xs text-rose-600 font-bold flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{modalAprobacion.error}</span>
                  </p>
                )}
              </div>

              {/* Plantillas Rápidas de Aprobación */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Plantillas sugeridas de fundamentación:
                </span>
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setModalAprobacion((prev) => ({
                        ...prev,
                        motivo: '✓ Costeo docente y gastos operativos verificados conforme a los tabuladores del POA 2026. Punto de equilibrio y margen del 30% validados para comercialización.',
                        error: null,
                      }))
                    }
                    className="text-left text-[11px] p-2 rounded-lg bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition-colors"
                  >
                    • <strong>Finanzas Óptimas:</strong> Costeo docente y gastos operativos verificados conforme al tabulador POA 2026.
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setModalAprobacion((prev) => ({
                        ...prev,
                        motivo: '✓ Ficha académica completa, horas pedagógicas balanceadas y régimen fiscal SAR con ISV 15% correctamente imputado. Se traslada a Comercialización para apertura de matrícula.',
                        error: null,
                      }))
                    }
                    className="text-left text-[11px] p-2 rounded-lg bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition-colors"
                  >
                    • <strong>Fiscal & Curricular:</strong> Régimen fiscal SAR 15% e insumos pedagógicos validados para apertura inmediata.
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setModalAprobacion({ abierto: false, proyecto: null, motivo: '', error: null })}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirmar-aprobacion-gg"
                onClick={() => {
                  const proyecto = modalAprobacion.proyecto;
                  confirmarAprobacion();
                  if (proyecto && onAbrirComercializarProyecto) {
                    setTimeout(() => onAbrirComercializarProyecto(proyecto.id), 150);
                  }
                }}
                disabled={modalAprobacion.motivo.trim().length < 5}
                className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                  modalAprobacion.motivo.trim().length >= 5
                    ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 text-slate-950 shadow-emerald-500/20 border border-emerald-300 hover:scale-[1.02]'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
                title="Aprobar dictamen ejecutivo y trasladar para Comercializar Sílabo / Proyecto"
              >
                <Rocket className="w-4 h-4 text-slate-950 stroke-[2.5] shrink-0" />
                <span>Confirmar Aprobación & Comercializar Sílabo/Proyecto</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL INTERACTIVO: RECHAZAR SÍLABO CON CAMPO DE TEXTO OBLIGATORIO */}
      {/* ========================================================================= */}
      {modalRechazo.abierto && modalRechazo.proyecto && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-rose-500 max-w-xl w-full overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-rose-950 to-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/30 border border-rose-400/40 flex items-center justify-center text-rose-300">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">
                    Rechazar Sílabo y Devolver a Gerencia Académica
                  </h3>
                  <p className="text-xs text-rose-200">
                    Se devolverá al equipo académico con las observaciones requeridas
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalRechazo({ abierto: false, proyecto: null, motivo: '', error: null })}
                className="text-white/70 hover:text-white font-bold p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-6 space-y-4">
              {/* Resumen del Programa */}
              <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-700">
                    {modalRechazo.proyecto.codigoProyecto || modalRechazo.proyecto.codigoPrograma || 'PROY-001'}
                  </span>
                  <span className="font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-200">
                    Retorno a Académica
                  </span>
                </div>
                <div className="font-black text-slate-900 text-sm">
                  {modalRechazo.proyecto.nombreProyecto}
                </div>
                <div className="text-slate-500 text-[11px]">
                  Docente: <strong>{modalRechazo.proyecto.nombreDocente}</strong> (Tarifa: L. {modalRechazo.proyecto.tarifaHoraDocente}/h)
                </div>
              </div>

              {/* CAMPO DE TEXTO OBLIGATORIO */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-900">
                  Motivo / Justificación del Rechazo (Campo Obligatorio) <span className="text-rose-600">*</span>
                </label>
                <textarea
                  id="textarea-motivo-rechazo"
                  rows={4}
                  value={modalRechazo.motivo}
                  onChange={(e) =>
                    setModalRechazo((prev) => ({
                      ...prev,
                      motivo: e.target.value,
                      error: null,
                    }))
                  }
                  placeholder="Detalle puntualmente las causas del rechazo para que Gerencia Académica sepa qué ajustar (ej. la tarifa docente de L. 350/h excede el presupuesto; el punto de equilibrio es inalcanzable; revisar objetivos del curso)..."
                  className={`w-full p-3 text-xs rounded-xl border font-medium focus:ring-2 transition-all ${
                    modalRechazo.error
                      ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/50'
                      : 'border-slate-300 focus:border-rose-500 focus:ring-rose-200 bg-slate-50/50 focus:bg-white'
                  }`}
                />

                <div className="flex items-center justify-between text-[11px]">
                  <span className={modalRechazo.motivo.trim().length >= 5 ? 'text-emerald-700 font-bold' : 'text-slate-400 font-medium'}>
                    Caracteres: {modalRechazo.motivo.trim().length} (Mínimo 5 requeridos)
                  </span>
                  <span className="text-rose-600 font-medium">
                    * El motivo es obligatorio para procesar el rechazo
                  </span>
                </div>

                {modalRechazo.error && (
                  <p className="text-xs text-rose-600 font-bold flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{modalRechazo.error}</span>
                  </p>
                )}
              </div>

              {/* Plantillas Rápidas de Rechazo */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Plantillas sugeridas de observaciones:
                </span>
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setModalRechazo((prev) => ({
                        ...prev,
                        motivo: '⚠️ La tarifa horaria propuesta para el docente supera el tabulador financiero del POA 2026. Ajustar a un máximo de L. 200/h o recalcular las horas del programa.',
                        error: null,
                      }))
                    }
                    className="text-left text-[11px] p-2 rounded-lg bg-rose-50/80 hover:bg-rose-100 text-rose-900 border border-rose-200 transition-colors"
                  >
                    • <strong>Tarifa Docente Excedida:</strong> Reducir honorarios o ajustar horas para garantizar rentabilidad.
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setModalRechazo((prev) => ({
                        ...prev,
                        motivo: '⚠️ El punto de equilibrio calculado sobrepasa el número mínimo de alumnos proyectados, elevando el riesgo financiero. Se requiere reestructurar costos o sugerir un arancel mayor.',
                        error: null,
                      }))
                    }
                    className="text-left text-[11px] p-2 rounded-lg bg-rose-50/80 hover:bg-rose-100 text-rose-900 border border-rose-200 transition-colors"
                  >
                    • <strong>Punto de Equilibrio Alto:</strong> Ajustar costos directos para bajar la cantidad de alumnos mínimos.
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setModalRechazo((prev) => ({
                        ...prev,
                        motivo: '⚠️ El sílabo presenta vacíos en los contenidos temáticos o en la distribución de horas teóricas y prácticas. Favor completar la ficha pedagógica antes de solicitar aprobación.',
                        error: null,
                      }))
                    }
                    className="text-left text-[11px] p-2 rounded-lg bg-rose-50/80 hover:bg-rose-100 text-rose-900 border border-rose-200 transition-colors"
                  >
                    • <strong>Inconsistencia Pedagógica:</strong> Completar objetivos, competencias y horas de práctica.
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setModalRechazo({ abierto: false, proyecto: null, motivo: '', error: null })}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirmar-rechazo-gg"
                onClick={confirmarRechazo}
                disabled={modalRechazo.motivo.trim().length < 5}
                className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                  modalRechazo.motivo.trim().length >= 5
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30 ring-2 ring-rose-400/40'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>Confirmar Rechazo y Devolver a Académica</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: APROBACIÓN FINAL DE INICIO Y REBAJA DEL POA (GERENCIA GENERAL) */}
      {/* ========================================================================= */}
      {modalInicioPOA.abierto && modalInicioPOA.proyecto && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-purple-500 max-w-xl w-full overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/30 border border-purple-400/40 flex items-center justify-center text-purple-300">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">
                    Aprobación Final de Inicio & Rebaja del POA 2026
                  </h3>
                  <p className="text-xs text-purple-200">
                    Resolución Ejecutiva de Gerencia General (Dr. Walter Rene Pedroza)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalInicioPOA({ abierto: false, proyecto: null, motivo: '' })}
                className="text-white/70 hover:text-white font-bold p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-6 space-y-4">
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-purple-950 font-mono">
                    {modalInicioPOA.proyecto.codigoProyecto || modalInicioPOA.proyecto.codigoPrograma || 'PROY-001'}
                  </span>
                  <span className="bg-purple-200 text-purple-900 px-2.5 py-0.5 rounded-full font-black">
                    {modalInicioPOA.proyecto.alumnosFinal || 6} Alumnos Oficiales Matriculados
                  </span>
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm">
                  {modalInicioPOA.proyecto.nombreProyecto}
                </h4>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-200/60 text-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Docente Asignado</span>
                    <strong className="text-slate-800">{modalInicioPOA.proyecto.nombreDocente || 'Docente'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Facturación a Rebajar del POA</span>
                    <strong className="text-emerald-700 font-mono text-sm">
                      {formatearMoneda(
                        modalInicioPOA.proyecto.montoFacturacionAprobadaHNL ||
                        modalInicioPOA.proyecto.ingresoTotalConISV ||
                        modalInicioPOA.proyecto.ingresoRealTotal || 0,
                        moneda
                      )}
                    </strong>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Dictamen Formal de Gerencia General (Deducción POA 2026):
                </label>
                <textarea
                  rows={3}
                  value={modalInicioPOA.motivo}
                  onChange={(e) => setModalInicioPOA(prev => ({ ...prev, motivo: e.target.value }))}
                  className="w-full p-3 text-xs border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="Fundamento de la aprobación definitiva e imputación en el POA mensual..."
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Al emitir esta resolución, el proyecto pasa al estado <strong>Listo / En Ejecución</strong>, se notifica a Administración, Académica y Comercialización, y el monto facturado se deduce de la meta mensual del Plan Operativo Anual (POA).
                </span>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setModalInicioPOA({ abierto: false, proyecto: null, motivo: '' })}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirmar-inicio-poa-gg"
                onClick={() => {
                  if (modalInicioPOA.proyecto && onAprobarInicioDefinitivoYRebajarPOA) {
                    onAprobarInicioDefinitivoYRebajarPOA(modalInicioPOA.proyecto, modalInicioPOA.motivo);
                    setModalInicioPOA({ abierto: false, proyecto: null, motivo: '' });
                  }
                }}
                className="px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white shadow-purple-700/30 ring-2 ring-purple-400/40"
              >
                <ShieldCheck className="w-4 h-4 text-purple-200" />
                <span>Emitir Aprobación Final & Rebajar del POA</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
