import React, { useState, useMemo } from 'react';
import { 
  ProyectoEducativo, 
  Moneda, 
  EtapaFlujoProyecto, 
  AvisoProyectoItem, 
  NotificacionGerencia 
} from '../../types';
import { formatearMoneda } from '../../utils/calculations';
import { CREDENCIALES_GERENCIAS } from '../../utils/gerenciasCredenciales';
import { 
  crearNotificacionAprobacionGGAComercializacion,
  crearNotificacionRetornoGGAAcademica
} from '../../utils/notificationUtils';
import { 
  Bell, 
  Mail, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  FileText, 
  Send, 
  Building2, 
  ExternalLink, 
  CheckCheck, 
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Hash,
  Briefcase,
  Users,
  ChevronRight,
  Eye,
  X
} from 'lucide-react';
import { SummitLogo } from '../SummitLogo';

interface ProjectNoticesWorkflowSectionProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto: (p: ProyectoEducativo, origen?: string) => void;
  onVerDetalle?: (p: ProyectoEducativo) => void;
  onNotificar?: (mensaje: string) => void;
  onAbrirSilabo?: (p: ProyectoEducativo) => void;
  rolActual?: 'academica' | 'general' | 'comercial' | 'todos';
  proyectoInicialId?: string;
}

export const ProjectNoticesWorkflowSection: React.FC<ProjectNoticesWorkflowSectionProps> = ({
  proyectos,
  moneda,
  onGuardarProyecto,
  onVerDetalle,
  onNotificar,
  onAbrirSilabo,
  rolActual = 'todos',
  proyectoInicialId,
}) => {
  const [filtroEtapa, setFiltroEtapa] = useState<'todas' | 'revision_gg' | 'retornados' | 'comercial' | 'listo'>('todas');
  const [busqueda, setBusqueda] = useState('');
  const [proyectoSeleccionadoId, setProyectoSeleccionadoId] = useState<string>(() => {
    if (proyectoInicialId) return proyectoInicialId;
    return proyectos[0]?.id || '';
  });
  const [modalEmailAbierto, setModalEmailAbierto] = useState(false);
  const [emailVisualizado, setEmailVisualizado] = useState<{
    asunto: string;
    destinatarios: string[];
    cuerpo: string;
    fecha: string;
  } | null>(null);

  // Modal para retorno de Gerencia General a Académica por corrección financiera
  const [modalRetornoAbierto, setModalRetornoAbierto] = useState(false);
  const [motivoRetornoTexto, setMotivoRetornoTexto] = useState('');

  // Proyectos con correlativos y avisos
  const proyectosFiltrados = useMemo(() => {
    return proyectos.filter((p) => {
      const cumpleBusqueda =
        p.nombreProyecto.toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.codigoProyecto && p.codigoProyecto.toLowerCase().includes(busqueda.toLowerCase())) ||
        (p.codigoPrograma && p.codigoPrograma.toLowerCase().includes(busqueda.toLowerCase())) ||
        (p.correlativoSAR && p.correlativoSAR.toLowerCase().includes(busqueda.toLowerCase())) ||
        p.nombreDocente.toLowerCase().includes(busqueda.toLowerCase());

      if (!cumpleBusqueda) return false;

      if (filtroEtapa === 'revision_gg') {
        return p.etapaFlujo === 'revision_gerencia_general' || (!p.aprobadoPorGerenciaGeneralPrevia && p.autorizacionAcademica && p.etapaFlujo !== 'elaboracion_academica');
      }
      if (filtroEtapa === 'retornados') {
        return p.etapaFlujo === 'elaboracion_academica' && (p.observacionesRevisionGeneral?.includes('RETORNADO') || !p.aprobadoPorGerenciaGeneralPrevia);
      }
      if (filtroEtapa === 'comercial') {
        return p.etapaFlujo === 'comercializacion' || (p.aprobadoPorGerenciaGeneralPrevia && p.seLlevoACabo !== 'Listo');
      }
      if (filtroEtapa === 'listo') {
        return p.seLlevoACabo === 'Listo' || p.aprobacionFinalGerenciaGeneral;
      }
      return true;
    });
  }, [proyectos, busqueda, filtroEtapa]);

  const proyectoActivo = useMemo(() => {
    const encontrado = proyectos.find((p) => p.id === proyectoSeleccionadoId);
    return encontrado || proyectosFiltrados[0] || proyectos[0] || null;
  }, [proyectos, proyectoSeleccionadoId, proyectosFiltrados]);

  // Manejador para aprobación de GG que traslada el proyecto a Comercialización
  const handleAprobarGerenciaGeneral = (proyecto: ProyectoEducativo) => {
    const ahora = new Date().toISOString();
    const proyectoActualizado: ProyectoEducativo = {
      ...proyecto,
      etapaFlujo: 'comercializacion',
      aprobadoPorGerenciaGeneralPrevia: true,
      fechaAprobacionGerenciaGeneralPrevia: ahora,
      fechaRevisionGerenciaGeneral: new Date().toLocaleDateString('es-HN'),
      fechaEnvioComercializacion: ahora,
      observacionesRevisionGeneral: 'Sílabo revisado y aprobado formalmente por Gerencia General. Viabilidad de costos y margen autorizada. Habilitado para inicio de comercialización y matrícula.',
    };

    // Crear notificación formal y enviar correos
    const { notificacion, aviso } = crearNotificacionAprobacionGGAComercializacion(
      proyectoActualizado,
      proyectoActualizado.observacionesRevisionGeneral
    );

    proyectoActualizado.avisosProyecto = [aviso, ...(proyectoActualizado.avisosProyecto || [])];

    onGuardarProyecto(proyectoActualizado, 'gerencia-general');
    
    if (onNotificar) {
      onNotificar(`✅ Proyecto "${proyecto.nombreProyecto}" (${proyecto.codigoProyecto || 'SIG-ACAD-2026-001'}) APROBADO por Gerencia General y trasladado a Gerencia de Comercialización. Notificación por correo enviada.`);
    }
  };

  // Manejador para retorno de GG a Académica por corrección financiera
  const handleRegresarAAcademica = (proyecto: ProyectoEducativo, motivo?: string) => {
    const ahora = new Date().toISOString();
    const fechaHoy = new Date().toLocaleDateString('es-HN');
    const horaHoy = new Date().toLocaleTimeString('es-HN');
    const motivoFinal = motivo?.trim() || 'La Gerencia General determinó que los costos operativos, tarifa docente o margen de rentabilidad requieren revisión y ajuste. Se devuelve a Gerencia Académica para su corrección.';

    const proyectoActualizado: ProyectoEducativo = {
      ...proyecto,
      etapaFlujo: 'elaboracion_academica',
      aprobadoPorGerenciaGeneralPrevia: false,
      observacionesRevisionGeneral: `RETORNADO POR GERENCIA GENERAL (${fechaHoy} ${horaHoy}): ${motivoFinal}`,
      fechaModificacion: fechaHoy,
      horaModificacion: horaHoy,
      horaUltimaModificacion: horaHoy,
      registroAuditoria: {
        ...proyecto.registroAuditoria,
        ultimaModificacion: `${fechaHoy}, ${horaHoy} por Gerencia General (Retorno por Inconsistencia Financiera)`,
        equipoModifico: 'Gerencia General',
      }
    };

    const { notificacion, aviso } = crearNotificacionRetornoGGAAcademica(
      proyectoActualizado,
      motivoFinal
    );

    proyectoActualizado.avisosProyecto = [aviso, ...(proyectoActualizado.avisosProyecto || [])];

    onGuardarProyecto(proyectoActualizado, 'gerencia-general');
    setModalRetornoAbierto(false);
    setMotivoRetornoTexto('');
    
    if (onNotificar) {
      onNotificar(`⚠️ Proyecto "${proyecto.nombreProyecto}" RETORNADO a Gerencia Académica para su corrección financiera. Notificación enviada a Phd. Donal Reyes.`);
    }
  };

  // Ver vista previa del correo electrónico generado
  const handleVerEmailAviso = (p: ProyectoEducativo) => {
    const codEmpresa = p.codigoProyecto || p.codigoPrograma || 'SIG-ACAD-2026-001';
    const codSAR = p.correlativoSAR || '000-001-01-00000001';
    const fechaHora = p.fechaHoraGrabacion || `${new Date().toLocaleDateString('es-HN')} 08:30 AM`;

    const destinatarios = [
      CREDENCIALES_GERENCIAS.administracion.correo,
      CREDENCIALES_GERENCIAS.comercial.correo,
      CREDENCIALES_GERENCIAS.academica.correo,
    ];

    const asunto = `[NUEVO PROYECTO / SÍLABO OFICIAL] Empresa: ${codEmpresa} | SAR: ${codSAR} - ${p.nombreProyecto}`;

    const cuerpo = `
================================================================================
SUMMIT IMPULSA GLOBAL, S.A. DE C.V.
NOTIFICACIÓN OFICIAL INTER-GERENCIAL - NUEVO SÍLABO REGISTRADO
================================================================================

Estimadas Gerencias:

La Gerencia Académica ha concluido la formulación pedagógica y registrado el Sílabo Oficial (Proyecto Educativo) en el sistema. Conforme al nuevo flujo de gobernanza institucional, el proyecto ha sido remitido formalmente a la GERENCIA GENERAL para su revisión ejecutiva y dictamen de aprobación previa a su paso a Comercialización.

DATOS INSTITUCIONALES DEL PROGRAMA:
--------------------------------------------------------------------------------
• Código de Control Empresa:     ${codEmpresa}
• Correlativo Fiscal SAR:        ${codSAR} (${p.codigoFiscalSAR || 'SAR-ISV-2026-001'})
• Nombre del Programa:           ${p.nombreProyecto}
• Tipo de Programa / Nivel:      ${p.tipoProyecto} | Nivel: ${p.nivel || 'Básico'}
• Docente Responsable:           ${p.nombreDocente} (Tarifa: L. ${p.tarifaHoraDocente || 200}/hr)
• Horas Clase Académicas:        ${p.horasClase} horas
• Inversión Operativa Base:      L. ${(p.gastoTotalOperativo || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
• Margen Operativo Objetivo:     ${p.margenGananciaOperativa || 40}%
• Tratamiento Fiscal (SAR):      ${p.aplicaISV ? 'GRAVADO CON ISV (15%)' : 'EXENTO DE ISV'}
• Venta Requerida Base:          L. ${(p.precioVentaRequerido || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
• Cupos / Alumnos Proyectados:   ${p.alumnosProyectados || 6} alumnos
• Precio Sugerido por Alumno:    L. ${(p.precioSugeridoVentaNeto || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })} ${p.aplicaISV ? `(L. ${(p.precioSugeridoConISV || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })} con ISV 15%)` : '(Exento)'}

FLUJO DE APROBACIÓN ACTUAL:
--------------------------------------------------------------------------------
[PASO 1: GERENCIA ACADÉMICA]  -->  REGISTRADO Y SELLADO (Completado)
[PASO 2: GERENCIA GENERAL]    -->  EN REVISIÓN Y APROBACIÓN (Acción Requerida)
[PASO 3: COMERCIALIZACIÓN]    -->  EN ESPERA DE APROBACIÓN DE GG

Destinatarios Notificados:
- Gerencia General: ${CREDENCIALES_GERENCIAS.administracion.correo}
- Gerencia de Comercialización: ${CREDENCIALES_GERENCIAS.comercial.correo}
- Gerencia Académica: ${CREDENCIALES_GERENCIAS.academica.correo}

Fecha y Hora de Emisión: ${fechaHora}
Emitido por: Phd. Donal Reyes - Dirección de Gerencia Académica
================================================================================
`.trim();

    setEmailVisualizado({
      asunto,
      destinatarios,
      cuerpo,
      fecha: fechaHora,
    });
    setModalEmailAbierto(true);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Banner Oficial de Avisos & Workflow */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-indigo-900/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="bg-white/10 p-2.5 rounded-2xl border border-white/20 shadow-inner shrink-0">
              <SummitLogo variant="icon" size="md" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 rounded-full">
                  Nuevo Flujo Institucional
                </span>
                <span className="text-xs text-indigo-300 font-medium">
                  Gobernanza & Correlativos Empresa / SAR
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
                <Bell className="w-6 h-6 text-amber-400" />
                <span>Sección de Avisos de Proyectos & Notificaciones</span>
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl">
                Control de correlativo automático (Empresa & SAR). Toda formulación de sílabo se remite a{' '}
                <strong className="text-amber-300">Gerencia General para revisión y aprobación</strong>, pasando
                posteriormente a <strong className="text-emerald-300">Gerencia de Comercialización</strong> con aviso
                automático a los correos de las gerencias.
              </p>
            </div>
          </div>

          {/* Estado de Notificaciones por Correo Electrónico */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-indigo-800/60 shrink-0 space-y-1.5 self-start lg:self-center">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Notificaciones por Correo Activas</span>
            </div>
            <div className="text-[11px] text-slate-300 space-y-0.5">
              <div>• GG: <span className="font-mono text-indigo-200">{CREDENCIALES_GERENCIAS.administracion.correo}</span></div>
              <div>• Académica: <span className="font-mono text-indigo-200">{CREDENCIALES_GERENCIAS.academica.correo}</span></div>
              <div>• Comercial: <span className="font-mono text-indigo-200">{CREDENCIALES_GERENCIAS.comercial.correo}</span></div>
            </div>
          </div>
        </div>

        {/* Barra de Pipeline de 3 Pasos */}
        <div className="mt-5 pt-4 border-t border-indigo-800/40 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-blue-950/60 border border-blue-600/40 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/80 text-white font-black flex items-center justify-center text-xs shrink-0">
              1
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-blue-300 tracking-wider block">Paso 1: Académica</span>
              <span className="text-xs font-bold text-white">Sílabo Oficial & Correlativos</span>
              <p className="text-[11px] text-blue-200/80">Diseño pedagógico, costos y envío a GG</p>
            </div>
          </div>

          <div className="bg-purple-950/60 border border-purple-600/40 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600/80 text-white font-black flex items-center justify-center text-xs shrink-0">
              2
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-purple-300 tracking-wider block">Paso 2: Gerencia General</span>
              <span className="text-xs font-bold text-white">Revisión y Aprobación</span>
              <p className="text-[11px] text-purple-200/80">Auditoría de margen y pase formal</p>
            </div>
          </div>

          <div className="bg-emerald-950/60 border border-emerald-600/40 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/80 text-white font-black flex items-center justify-center text-xs shrink-0">
              3
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-300 tracking-wider block">Paso 3: Comercialización</span>
              <span className="text-xs font-bold text-white">Ventas y Matrícula</span>
              <p className="text-[11px] text-emerald-200/80">Pauta, captación y cierre de cupos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controles de Filtrado y Búsqueda */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-600">Filtrar Avisos:</span>
          <button
            type="button"
            onClick={() => setFiltroEtapa('todas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filtroEtapa === 'todas'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Todos ({proyectos.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEtapa('revision_gg')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filtroEtapa === 'revision_gg'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>En Revisión GG ({proyectos.filter(p => p.etapaFlujo === 'revision_gerencia_general' || (!p.aprobadoPorGerenciaGeneralPrevia && p.autorizacionAcademica && p.etapaFlujo !== 'elaboracion_academica')).length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFiltroEtapa('retornados')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filtroEtapa === 'retornados'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retornados a Académica ({proyectos.filter(p => p.etapaFlujo === 'elaboracion_academica' && (p.observacionesRevisionGeneral?.includes('RETORNADO') || !p.aprobadoPorGerenciaGeneralPrevia)).length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFiltroEtapa('comercial')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filtroEtapa === 'comercial'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>En Comercialización ({proyectos.filter(p => p.etapaFlujo === 'comercializacion').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFiltroEtapa('listo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filtroEtapa === 'listo'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Aprobado Listo ({proyectos.filter(p => p.seLlevoACabo === 'Listo').length})</span>
          </button>
        </div>

        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Buscar por código, SAR o nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Grid Principal: Selector Lateral de Proyectos y Ficha Detallada de Avisos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Lista Lateral de Proyectos */}
        <div className="lg:col-span-5 space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
          {proyectosFiltrados.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
              No se encontraron proyectos en la etapa seleccionada.
            </div>
          ) : (
            proyectosFiltrados.map((p) => {
              const esActivo = proyectoActivo?.id === p.id;
              const codEmpresa = p.codigoProyecto || p.codigoPrograma || `SIG-ACAD-2026-${String(p.numeroCorrelativo || 1).padStart(3, '0')}`;
              const codSAR = p.correlativoSAR || `000-001-01-${String(p.numeroCorrelativo || 1).padStart(8, '0')}`;
              const estaEnRevisionGG = p.etapaFlujo === 'revision_gerencia_general' || (!p.aprobadoPorGerenciaGeneralPrevia && p.autorizacionAcademica);
              const estaEnComercial = p.etapaFlujo === 'comercializacion' || p.aprobadoPorGerenciaGeneralPrevia;

              return (
                <div
                  key={p.id}
                  onClick={() => setProyectoSeleccionadoId(p.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    esActivo
                      ? 'bg-indigo-50/80 border-indigo-400 shadow-sm ring-1 ring-indigo-300'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[10px] font-black bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded border border-indigo-200">
                          {codEmpresa}
                        </span>
                        <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          SAR: {codSAR}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{p.nombreProyecto}</h4>
                      <p className="text-[11px] text-slate-500">{p.nombreDocente} • {p.horasClase} hrs</p>
                    </div>

                    <div className="shrink-0 text-right">
                      {estaEnRevisionGG ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 bg-purple-100 text-purple-900 border border-purple-200 rounded-full">
                          <Clock className="w-3 h-3 text-purple-600" />
                          <span>Revisión GG</span>
                        </span>
                      ) : estaEnComercial ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-full">
                          <CheckCheck className="w-3 h-3 text-emerald-600" />
                          <span>Comercial</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 bg-blue-100 text-blue-900 border border-blue-200 rounded-full">
                          <span>Académica</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detalle y Centro de Avisos del Proyecto Seleccionado */}
        <div className="lg:col-span-7">
          {proyectoActivo ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
              
              {/* Cabecera del Proyecto Activo */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-indigo-900 text-white font-mono font-black text-xs rounded-md shadow-xs flex items-center gap-1">
                      <Hash className="w-3 h-3 text-indigo-300" />
                      <span>{proyectoActivo.codigoProyecto || proyectoActivo.codigoPrograma || 'SIG-ACAD-2026-001'}</span>
                    </span>
                    <span className="px-2.5 py-0.5 bg-amber-50 text-amber-900 border border-amber-300 font-mono font-bold text-xs rounded-md">
                      SAR: {proyectoActivo.correlativoSAR || '000-001-01-00000001'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      proyectoActivo.aplicaISV
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}>
                      {proyectoActivo.aplicaISV ? 'ISV 15% Gravado' : 'ISV Exento (SAR)'}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                    {proyectoActivo.nombreProyecto}
                  </h3>
                  <p className="text-xs text-slate-600">
                    Docente: <strong className="text-slate-800">{proyectoActivo.nombreDocente}</strong> ({proyectoActivo.horasClase} hrs académicas) | Margen Institucional: <strong className="text-indigo-700">{proyectoActivo.margenGananciaOperativa || 40}%</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleVerEmailAviso(proyectoActivo)}
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold rounded-xl border border-indigo-200 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    title="Ver copia del correo electrónico enviado a las gerencias"
                  >
                    <Mail className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Ver Correo Notificado</span>
                  </button>

                  {onAbrirSilabo && (
                    <button
                      type="button"
                      onClick={() => onAbrirSilabo(proyectoActivo)}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-300" />
                      <span>Abrir Sílabo</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Estado del Flujo de Gobernanza del Proyecto */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  Estado de Aprobación & Transición Inter-Gerencial
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {/* Etapa 1 */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">1. Académica</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-[11px] text-slate-500">Sílabo Oficial y Correlativos emitidos</p>
                    <span className="text-[10px] text-emerald-700 font-bold block">✓ Formalizado</span>
                  </div>

                  {/* Etapa 2 */}
                  <div className={`p-3 rounded-lg border space-y-1 ${
                    proyectoActivo.aprobadoPorGerenciaGeneralPrevia
                      ? 'bg-white border-emerald-200'
                      : 'bg-purple-50/70 border-purple-300'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-950">2. Gerencia General</span>
                      {proyectoActivo.aprobadoPorGerenciaGeneralPrevia ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-purple-600 animate-pulse" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600">
                      {proyectoActivo.aprobadoPorGerenciaGeneralPrevia
                        ? 'Aprobado formalmente'
                        : 'En revisión ejecutiva'}
                    </p>
                    <span className={`text-[10px] font-bold block ${
                      proyectoActivo.aprobadoPorGerenciaGeneralPrevia ? 'text-emerald-700' : 'text-purple-700'
                    }`}>
                      {proyectoActivo.aprobadoPorGerenciaGeneralPrevia ? '✓ Aprobado' : '⏳ Pendiente Dictamen'}
                    </span>
                  </div>

                  {/* Etapa 3 */}
                  <div className={`p-3 rounded-lg border space-y-1 ${
                    proyectoActivo.etapaFlujo === 'comercializacion' || proyectoActivo.aprobadoPorGerenciaGeneralPrevia
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : 'bg-slate-100 border-slate-200 text-slate-400'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">3. Comercialización</span>
                      {proyectoActivo.etapaFlujo === 'comercializacion' ? (
                        <Send className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {proyectoActivo.etapaFlujo === 'comercializacion' || proyectoActivo.aprobadoPorGerenciaGeneralPrevia
                        ? 'Ventas & Matrícula activas'
                        : 'Esperando pase de GG'}
                    </p>
                    <span className={`text-[10px] font-bold block ${
                      proyectoActivo.etapaFlujo === 'comercializacion' ? 'text-emerald-700' : 'text-slate-400'
                    }`}>
                      {proyectoActivo.etapaFlujo === 'comercializacion' ? '⚡ En Venta' : 'En cola'}
                    </span>
                  </div>
                </div>

                {/* ACCIÓN DE GERENCIA GENERAL SI ESTÁ EN REVISIÓN */}
                {(!proyectoActivo.aprobadoPorGerenciaGeneralPrevia || proyectoActivo.etapaFlujo === 'revision_gerencia_general') && (
                  <div className="p-4 bg-gradient-to-r from-purple-50 via-indigo-50 to-rose-50 border border-purple-200 rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-purple-600 shrink-0" />
                          <span>Revisión Financiera y Dictamen de Gerencia General</span>
                        </span>
                        <p className="text-[11px] text-purple-900 leading-relaxed">
                          Conforme a la gobernanza institucional: si la estructura de costos y márgenes es viable, apruebe el traslado a Comercialización. Si no ve bien la parte financiera, regréselo a Académica para su corrección.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-purple-200/70">
                      <button
                        type="button"
                        id="btn-aprobar-gg-workflow"
                        onClick={() => handleAprobarGerenciaGeneral(proyectoActivo)}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span>Aprobar Viabilidad y Trasladar a Comercialización</span>
                      </button>

                      <button
                        type="button"
                        id="btn-regresar-academica-workflow"
                        onClick={() => setModalRetornoAbierto(true)}
                        className="px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-700 hover:from-rose-700 hover:to-amber-800 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4 text-white" />
                        <span>Regresar a Académica para Corrección Financiera</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* BANNER SI EL PROYECTO FUE RETORNADO A ACADÉMICA */}
                {proyectoActivo.etapaFlujo === 'elaboracion_academica' && proyectoActivo.observacionesRevisionGeneral?.includes('RETORNADO') && (
                  <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Proyecto en Corrección por Devolución de Gerencia General</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded">
                        Requiere Ajuste Financiero
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-900 bg-white/80 p-2.5 rounded-lg border border-amber-200 font-mono">
                      {proyectoActivo.observacionesRevisionGeneral}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-amber-800">
                        La Gerencia Académica debe ajustar los honorarios o gastos y volver a guardar para remitirlo a GG.
                      </span>
                      {onAbrirSilabo && (
                        <button
                          type="button"
                          onClick={() => onAbrirSilabo(proyectoActivo)}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Abrir Sílabo para Corregir</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Bitácora de Avisos y Notificaciones del Proyecto */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Bitácora de Avisos & Correos Notificados</span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {(proyectoActivo.avisosProyecto || []).length > 0 ? `${proyectoActivo.avisosProyecto?.length} aviso(s)` : 'Aviso inicial registrado'}
                  </span>
                </div>

                <div className="space-y-2">
                  {(proyectoActivo.avisosProyecto && proyectoActivo.avisosProyecto.length > 0) ? (
                    proyectoActivo.avisosProyecto.map((aviso) => (
                      <div key={aviso.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900">{aviso.titulo}</span>
                          <span className="text-[10px] text-slate-400">{aviso.fechaHora}</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">{aviso.descripcion}</p>
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60 text-[10px] text-slate-500">
                          <span>De: <strong>{aviso.origen}</strong></span>
                          <span>➔ Para: <strong>{aviso.destino}</strong></span>
                          <span className="text-emerald-700 font-bold ml-auto">✓ Correos Notificados ({aviso.correosNotificados.length})</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-950">
                          Registro de Sílabo Oficial (Proyecto) - {proyectoActivo.codigoProyecto || proyectoActivo.codigoPrograma || 'SIG-ACAD-2026-001'}
                        </span>
                        <span className="text-[10px] text-indigo-600 font-mono">
                          {proyectoActivo.fechaHoraGrabacion || 'Sincronizado'}
                        </span>
                      </div>
                      <p className="text-indigo-900 text-[11px]">
                        El Sílabo fue formalizado en Gerencia Académica con asignación de correlativo de empresa y fiscal SAR. Notificación emitida a Gerencia General, Comercialización y Académica.
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-indigo-700 pt-1 border-t border-indigo-200/60">
                        <span>Correos: {CREDENCIALES_GERENCIAS.administracion.correo}, {CREDENCIALES_GERENCIAS.comercial.correo}</span>
                        <span className="font-bold text-emerald-700">✓ Enviado</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Ficha Resumen de Costos y Margen del Proyecto */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Inversión Operativa</span>
                  <span className="text-xs font-mono font-black text-slate-800">
                    {formatearMoneda(proyectoActivo.gastoTotalOperativo || 0, moneda)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Margen Objetivo</span>
                  <span className="text-xs font-mono font-black text-indigo-700">
                    {proyectoActivo.margenGananciaOperativa || 40}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Venta Requerida</span>
                  <span className="text-xs font-mono font-black text-slate-800">
                    {formatearMoneda(proyectoActivo.precioVentaRequerido || 0, moneda)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Precio Alumno</span>
                  <span className="text-xs font-mono font-black text-emerald-700">
                    {formatearMoneda(proyectoActivo.precioSugeridoVentaNeto || 0, moneda)}
                  </span>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
              Seleccione un proyecto para auditar sus avisos y estado de flujo.
            </div>
          )}
        </div>
      </div>

      {/* Modal de Inspección del Correo Electrónico Notificado */}
      {modalEmailAbierto && emailVisualizado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-black">Copia de Notificación Oficial por Correo</span>
              </div>
              <button
                type="button"
                onClick={() => setModalEmailAbierto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div><strong>Asunto:</strong> <span className="text-slate-800 font-mono">{emailVisualizado.asunto}</span></div>
                <div><strong>Destinatarios:</strong> <span className="text-indigo-700 font-mono">{emailVisualizado.destinatarios.join(', ')}</span></div>
                <div><strong>Fecha de Envío:</strong> <span className="text-slate-600">{emailVisualizado.fecha}</span></div>
                <div><strong>Estado de Entrega:</strong> <span className="text-emerald-700 font-bold">✓ Enviado y Registrado en Bitácora</span></div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-700 uppercase block mb-1">Cuerpo del Mensaje Notificado:</span>
                <pre className="p-4 bg-slate-950 text-emerald-300 font-mono text-[11px] rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {emailVisualizado.cuerpo}
                </pre>
              </div>
            </div>

            <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setModalEmailAbierto(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Retornar Proyecto a Académica por Corrección Financiera */}
      {modalRetornoAbierto && proyectoActivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-rose-200 overflow-hidden flex flex-col">
            <div className="bg-rose-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-300" />
                <span className="text-sm font-black">Regresar a Gerencia Académica para Corrección</span>
              </div>
              <button
                type="button"
                onClick={() => setModalRetornoAbierto(false)}
                className="text-rose-200 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-900 space-y-1">
                <span className="font-bold block text-[11px] uppercase tracking-wider">Flujo de Gobernanza Institucional</span>
                <p className="text-[11px] leading-relaxed">
                  Al retornar el proyecto <strong>"{proyectoActivo.nombreProyecto}"</strong> ({proyectoActivo.codigoProyecto || proyectoActivo.codigoPrograma || 'SIG-ACAD-2026-001'}), volverá al estado <strong>"elaboración académica"</strong> y no pasará a Comercialización hasta que los costos sean corregidos y aprobados.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-700">
                  Motivo o Inconsistencia Financiera Observada:
                </label>
                <textarea
                  rows={3}
                  value={motivoRetornoTexto}
                  onChange={(e) => setMotivoRetornoTexto(e.target.value)}
                  placeholder="Describa el motivo: ej. Tarifa docente excede el límite presupuestario o el margen operativo es menor al 25% requerido..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />

                {/* Motivos rápidos */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 block">Sugerencias rápidas:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Tarifa docente fuera del presupuesto autorizado',
                      'Margen proyectado inferior al 25% institucional',
                      'Costos operativos indirectos no justificados',
                      'Revisar horas prácticas y honorarios totales'
                    ].map((motivoRapido) => (
                      <button
                        key={motivoRapido}
                        type="button"
                        onClick={() => setMotivoRetornoTexto(motivoRapido)}
                        className="px-2 py-1 bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-900 rounded-md text-[10px] font-medium transition-colors cursor-pointer"
                      >
                        + {motivoRapido}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-[11px] text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Destino: <strong>Gerencia Académica</strong></span>
                  <span>Responsable: <strong>Phd. Donal Reyes</strong></span>
                </div>
                <div>Aviso por Correo: <strong>{CREDENCIALES_GERENCIAS.academica.correo}</strong></div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalRetornoAbierto(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirmar-retorno-academica"
                onClick={() => handleRegresarAAcademica(proyectoActivo, motivoRetornoTexto)}
                className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Confirmar y Retornar a Académica</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
