import React, { useState } from 'react';
import { 
  Zap, 
  Sparkles, 
  CheckCircle2, 
  Send, 
  BookOpen, 
  GraduationCap, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Users, 
  Award,
  CalendarCheck,
  FileCheck2
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';

interface AcademicQuickBatchActionsBarProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto: (p: ProyectoEducativo) => void;
  onNotificar?: (mensaje: string) => void;
  onAbrirWorkflowStatusModal?: (proyectoId?: string) => void;
}

export const AcademicQuickBatchActionsBar: React.FC<AcademicQuickBatchActionsBarProps> = ({
  proyectos,
  moneda,
  onGuardarProyecto,
  onNotificar,
  onAbrirWorkflowStatusModal,
}) => {
  const [expandido, setExpandido] = useState<boolean>(true);
  const [procesando, setProcesando] = useState<boolean>(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Proyectos sin syllabus o sin rúbrica
  const sinSyllabus = proyectos.filter(
    (p) => !p.rubricaEvaluacion || !p.metodologia || !p.temasImpartir
  );

  // Proyectos pendientes de autorización académica para pasar a Comercialización
  const pendientesAutorizar = proyectos.filter(
    (p) => !p.autorizacionAcademica && p.seLlevoACabo !== 'Cancelado' && p.seLlevoACabo !== 'No se llevó a cabo'
  );

  // Proyectos sin horario asignado
  const sinHorario = proyectos.filter((p) => !p.horario || !p.diasClase);

  // 1. AUTO-COMPLETAR SYLLABUS, RÚBRICA Y AULA VIRTUAL EN 1 CLIC
  const handleAutoCompletarSyllabusYRúbricas = () => {
    if (sinSyllabus.length === 0) {
      onNotificar?.('Todos los proyectos ya cuentan con Syllabus y Rúbricas completas.');
      return;
    }

    setProcesando(true);
    let count = 0;

    sinSyllabus.forEach((p) => {
      const ahora = new Date();
      const rubricaEstandar = {
        proyectoFinalPct: 40,
        talleresPracticosPct: 35,
        participacionAsistenciaPct: 15,
        examenFinalPct: 10,
        notaMinimaAprobacion: 75,
        asistenciaMinimaPct: 80,
      };

      const temarioSugerido = p.temasImpartir || 
        `Módulo 1: Fundamentos y Marco Estratégico Integral\n` +
        `Módulo 2: Metodología Aplicada y Casos Reales del Sector\n` +
        `Módulo 3: Herramientas Técnicas, Automatización y Práctica Guiada\n` +
        `Módulo 4: Desarrollo de Proyecto Final y Sustentación Ejecutiva`;

      const actualizado: ProyectoEducativo = {
        ...p,
        metodologia: p.metodologia || 'Metodología 70/20/10: 70% práctica basada en retos reales, 20% feedback docente y 10% teoría clave.',
        rubricaEvaluacion: p.rubricaEvaluacion || rubricaEstandar,
        temasImpartir: temarioSugerido,
        cantidadTemas: p.cantidadTemas || 4,
        horasClasePorTema: p.horasClasePorTema || Math.max(4, Math.round((p.horasClase || 20) / 4)),
        modalidad: p.modalidad || 'Virtual Sincrónica',
        plataformaLMS: p.plataformaLMS || 'Google Classroom + Zoom Summit Enterprise',
        enlaceAulaVirtual: p.enlaceAulaVirtual || 'https://zoom.us/j/summit-impulsa-global',
        codigoAccesoVirtual: p.codigoAccesoVirtual || 'SUMMIT2026',
        seccion: p.seccion || 'Cohorte Piloto 2026',
        horario: p.horario || '06:30 PM - 08:30 PM',
        diasClase: p.diasClase || 'Martes y Jueves',
        estadoSyllabus: 'Aprobado por Dirección',
        observacionesAcademicas: 'Syllabus estandarizado y rubricado automáticamente bajo normativa institucional.',
        fechaModificacion: ahora.toISOString(),
      };

      onGuardarProyecto(actualizado);
      count++;
    });

    setProcesando(false);
    const msg = `¡Se completaron automáticamente el Syllabus, Rúbrica y Aula Virtual de ${count} proyectos!`;
    setMensajeExito(msg);
    onNotificar?.(msg);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  // 2. AUTORIZAR Y TRASPASAR TODOS A COMERCIALIZACIÓN EN 1 CLIC
  const handleAutorizarYTraspasarTodos = () => {
    if (pendientesAutorizar.length === 0) {
      onNotificar?.('No hay proyectos pendientes de autorización en Gerencia Académica.');
      return;
    }

    setProcesando(true);
    let count = 0;
    const ahora = new Date();

    pendientesAutorizar.forEach((p) => {
      const actualizado: ProyectoEducativo = {
        ...p,
        autorizacionAcademica: true,
        fechaAutorizacionAcademica: ahora.toISOString(),
        responsableAcademico: 'Ing. Carlos M. Estrada - Gerente Académico',
        nivelFlujoActual: 2, // Pasa a Comercialización
        etapaFlujo: 'comercializacion',
        comercializacionCompletada: false,
        fechaModificacion: ahora.toISOString(),
        historialCambios: [
          ...(p.historialCambios || []),
          {
            fecha: ahora.toISOString(),
            usuario: 'Ing. Carlos M. Estrada (G. Académica)',
            tipoCambio: 'estado',
            titulo: 'Autorización Académica en Bloque Emitida',
            descripcion: 'Proyecto curricularmente validado y transferido oficialmente al Paso 2: Gerencia de Comercialización para inicio de ventas.',
          }
        ]
      };

      onGuardarProyecto(actualizado);
      count++;
    });

    setProcesando(false);
    const msg = `¡${count} proyectos autorizados curricularmente y transferidos a Gerencia de Comercialización!`;
    setMensajeExito(msg);
    onNotificar?.(msg);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  // 3. ASIGNAR HORARIOS Y DIAS EN 1 CLIC
  const handleAsignarHorariosEstandar = () => {
    if (sinHorario.length === 0) {
      onNotificar?.('Todos los proyectos ya tienen horario y días asignados.');
      return;
    }

    setProcesando(true);
    let count = 0;
    sinHorario.forEach((p) => {
      const ahora = new Date();
      const actualizado: ProyectoEducativo = {
        ...p,
        horario: '06:30 PM - 08:30 PM',
        diasClase: 'Lunes y Miércoles',
        seccion: 'Sección Regular',
        fechaModificacion: ahora.toISOString(),
      };
      onGuardarProyecto(actualizado);
      count++;
    });

    setProcesando(false);
    const msg = `¡Horarios y días regulares asignados a ${count} proyectos!`;
    setMensajeExito(msg);
    onNotificar?.(msg);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  return (
    <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl shadow-lg border border-blue-800/80 p-4 transition-all">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        
        {/* Título y Badge de Simplificación */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0 shadow-inner">
            <Zap className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5">
                <span>Operaciones Académicas Rápidas</span>
                <span className="text-[10px] bg-blue-500/30 text-blue-200 border border-blue-400/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  1 Clic
                </span>
              </h3>
            </div>
            <p className="text-xs text-blue-200/90 font-medium">
              Simplifique la formulación curricular: complete syllabus, estandarice rúbricas y transfiera a Comercialización en segundos.
            </p>
          </div>
        </div>

        {/* Botón toggle expandir / contraer */}
        <button
          onClick={() => setExpandido(!expandido)}
          className="self-end sm:self-center flex items-center gap-1.5 text-xs text-blue-200 hover:text-white bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-xl transition-colors border border-white/10"
        >
          <span>{expandido ? 'Ocultar Herramientas' : 'Ver Herramientas Rápidas'}</span>
          {expandido ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {mensajeExito && (
        <div className="mt-3 bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{mensajeExito}</span>
        </div>
      )}

      {expandido && (
        <div className="mt-4 pt-3 border-t border-blue-800/60 grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Acción 1: Auto-Completar Syllabus & Rúbricas */}
          <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 flex flex-col justify-between transition-colors">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-cyan-400" />
                  <span>Syllabus & Rúbricas</span>
                </span>
                {sinSyllabus.length > 0 ? (
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.2 rounded-full font-bold">
                    {sinSyllabus.length} pendientes
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.2 rounded-full font-bold">
                    100% al día
                  </span>
                )}
              </div>
              <p className="text-[11px] text-blue-100/80 leading-snug mb-3">
                Llena automáticamente rúbrica 40/35/15/10, temario en 4 módulos y parámetros de Zoom/LMS para todos los cursos sin configurar.
              </p>
            </div>

            <button
              onClick={handleAutoCompletarSyllabusYRúbricas}
              disabled={procesando || sinSyllabus.length === 0}
              className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black transition-all ${
                sinSyllabus.length > 0
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-sm cursor-pointer active:scale-98'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-Completar Todo ({sinSyllabus.length})</span>
            </button>
          </div>

          {/* Acción 2: Autorizar y Traspasar Todos a Comercialización */}
          <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 flex flex-col justify-between transition-colors">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-emerald-400" />
                  <span>Pase a Comercialización</span>
                </span>
                {pendientesAutorizar.length > 0 ? (
                  <span className="text-[10px] bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.2 rounded-full font-bold">
                    {pendientesAutorizar.length} listos
                  </span>
                ) : (
                  <span className="text-[10px] bg-blue-400/20 text-blue-300 border border-blue-400/30 px-2 py-0.2 rounded-full font-bold">
                    Todos autorizados
                  </span>
                )}
              </div>
              <p className="text-[11px] text-blue-100/80 leading-snug mb-3">
                Emite la autorización de la Gerencia Académica y habilita la preventa comercial inmediata para el equipo de ventas.
              </p>
            </div>

            <button
              onClick={handleAutorizarYTraspasarTodos}
              disabled={procesando || pendientesAutorizar.length === 0}
              className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black transition-all ${
                pendientesAutorizar.length > 0
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm cursor-pointer active:scale-98'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Autorizar y Enviar a Ventas ({pendientesAutorizar.length})</span>
            </button>
          </div>

          {/* Acción 3: Asignar Horarios y Días Regulares */}
          <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 flex flex-col justify-between transition-colors">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Horarios & Secciones</span>
                </span>
                {sinHorario.length > 0 ? (
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.2 rounded-full font-bold">
                    {sinHorario.length} sin horario
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.2 rounded-full font-bold">
                    Asignados
                  </span>
                )}
              </div>
              <p className="text-[11px] text-blue-100/80 leading-snug mb-3">
                Asigna horario nocturno estándar (06:30 PM - 08:30 PM) y días de semana para rápida colocación en catálogo.
              </p>
            </div>

            <button
              onClick={handleAsignarHorariosEstandar}
              disabled={procesando || sinHorario.length === 0}
              className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black transition-all ${
                sinHorario.length > 0
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-sm cursor-pointer active:scale-98'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Asignar Horarios Regulares ({sinHorario.length})</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
