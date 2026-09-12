import React, { useState } from 'react';
import { 
  X, 
  Zap, 
  Sparkles, 
  GraduationCap, 
  Megaphone, 
  Building2, 
  CheckCircle2, 
  Send, 
  Plus, 
  MessageSquare, 
  FileText, 
  Mail, 
  Calculator, 
  ShieldCheck, 
  Copy, 
  Check, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { ProyectoEducativo, Moneda, VistaPrincipal } from '../../types';
import { formatearHNL } from '../../utils/poa2026Data';
import { emitirAprobacionFinalGerenciaGeneral } from '../../utils/poaMonthlyTrackingUtils';
import { calcularMetricasProyecto } from '../../utils/calculations';

interface GlobalQuickOperationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto: (p: ProyectoEducativo) => void;
  onCrearProyecto: (p: ProyectoEducativo) => void;
  onNotificar?: (mensaje: string) => void;
  onNavegarVista: (vista: VistaPrincipal) => void;
}

export const GlobalQuickOperationsModal: React.FC<GlobalQuickOperationsModalProps> = ({
  isOpen,
  onClose,
  proyectos,
  moneda,
  onGuardarProyecto,
  onCrearProyecto,
  onNotificar,
  onNavegarVista,
}) => {
  const [gerenciaActiva, setGerenciaActiva] = useState<'academica' | 'comercial' | 'general'>('academica');
  const [cursoSeleccionadoId, setCursoSeleccionadoId] = useState<string>(
    proyectos.length > 0 ? proyectos[0].id : ''
  );
  const [copiadoMinuta, setCopiadoMinuta] = useState<boolean>(false);
  const [copiadoWhatsApp, setCopiadoWhatsApp] = useState<boolean>(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  if (!isOpen) return null;

  const cursoSeleccionado = proyectos.find((p) => p.id === cursoSeleccionadoId) || proyectos[0];

  // Métricas rápidas
  const pendientesAutorizarAcademica = proyectos.filter((p) => !p.autorizacionAcademica);
  const sinSyllabus = proyectos.filter((p) => !p.rubricaEvaluacion || !p.metodologia);
  const pendientesAprobacionGG = proyectos.filter(
    (p) => !p.aprobacionFinalGerenciaGeneral && p.totalGananciasFinales >= 0
  );

  // 1. CREAR CURSO EXPRESS ACADÉMICO
  const handleCrearCursoExpress = (tipo: 'Curso 40h' | 'Masterclass 16h' | 'Seminario B2B 24h') => {
    const ahora = new Date();
    const timestamp = ahora.getTime();
    const correlativo = proyectos.length + 1;

    let base: Partial<ProyectoEducativo> = {};
    if (tipo === 'Curso 40h') {
      base = {
        nombreProyecto: `Curso Aplicado #${correlativo} - Piloto 2026`,
        tipoProyecto: 'Curso',
        modalidad: 'Virtual Sincrónica',
        horasClase: 40,
        tarifaHoraDocente: 300,
        alumnosProyectados: 20,
        alumnosFinal: 8,
        precioSugeridoAlumno: 2500,
        servicioFiscal: 'Formación académica acreditada (ej. convenios universitarios)',
        aplicaISV: false,
      };
    } else if (tipo === 'Masterclass 16h') {
      base = {
        nombreProyecto: `Masterclass Intensiva #${correlativo} - Piloto 2026`,
        tipoProyecto: 'Taller',
        modalidad: 'Virtual Sincrónica',
        horasClase: 16,
        tarifaHoraDocente: 400,
        alumnosProyectados: 30,
        alumnosFinal: 12,
        precioSugeridoAlumno: 1200,
        servicioFiscal: 'Formación académica acreditada (ej. convenios universitarios)',
        aplicaISV: false,
      };
    } else {
      base = {
        nombreProyecto: `Seminario Corporativo B2B #${correlativo} - Piloto 2026`,
        tipoProyecto: 'Seminario',
        modalidad: 'Presencial',
        horasClase: 24,
        tarifaHoraDocente: 450,
        alumnosProyectados: 18,
        alumnosFinal: 10,
        precioSugeridoAlumno: 2800,
        servicioFiscal: 'Capacitación profesional / Mentoría ejecutiva',
        aplicaISV: true,
      };
    }

    const nuevo = calcularMetricasProyecto({
      ...base,
      id: `proy-fast-${timestamp}`,
      codigoPrograma: `SMT-${tipo.substring(0, 3).toUpperCase()}-2026-${String(correlativo).padStart(3, '0')}`,
      nombreDocente: 'Walter Pedroza',
      nivel: 'Intermedio',
      fechaProgramacion: ahora.toISOString().split('T')[0],
      fechaVenta: ahora.toISOString().split('T')[0],
      costoPapeleria: 800,
      costoZoom: 500,
      gastosVarios: 400,
      margenGananciaOperativa: 40,
      metodoVenta: 'Redes sociales',
      seLlevoACabo: 'Planificado',
      observaciones: `Formulado de forma ultra-rápida desde el Centro Global de Operación 2026.`,
      horaCreacion: ahora.toLocaleTimeString('es-HN'),
      fechaHoraGrabacion: ahora.toLocaleString('es-HN'),
    } as ProyectoEducativo);

    onCrearProyecto(nuevo);
    setCursoSeleccionadoId(nuevo.id);
    const msg = `¡Creado con éxito: ${nuevo.nombreProyecto}!`;
    setMensajeExito(msg);
    onNotificar?.(msg);
    setTimeout(() => setMensajeExito(null), 3000);
  };

  // 2. MATRÍCULA EXPRÉS (+1, +3, +5)
  const handleSumarAlumnos = (cantidad: number) => {
    if (!cursoSeleccionado) return;
    const nuevoTotal = (cursoSeleccionado.alumnosFinal || 0) + cantidad;
    const actualizado = calcularMetricasProyecto({
      ...cursoSeleccionado,
      alumnosFinal: nuevoTotal,
      seLlevoACabo: nuevoTotal >= cursoSeleccionado.puntoEquilibrioAlumnos ? 'Listo' : cursoSeleccionado.seLlevoACabo,
      fechaModificacion: new Date().toISOString(),
    });
    onGuardarProyecto(actualizado);
    const msg = `¡Se registraron +${cantidad} estudiantes en "${cursoSeleccionado.nombreProyecto}"! Total: ${nuevoTotal} alumnos.`;
    setMensajeExito(msg);
    onNotificar?.(msg);
    setTimeout(() => setMensajeExito(null), 3000);
  };

  // 3. WHATSAPP DE VENTA EN 1 CLIC
  const handleCopiarWhatsApp = () => {
    if (!cursoSeleccionado) return;
    const texto = `¡Hola! 👋 Te saluda el equipo de Admisiones de *Summit Impulsa Global, S.A. de C.V.*\n\n` +
      `Te compartimos la información oficial de tu programa formativo:\n` +
      `🎓 *${cursoSeleccionado.nombreProyecto}*\n` +
      `👨‍🏫 *Facilitador:* ${cursoSeleccionado.nombreDocente}\n` +
      `⏱️ *Duración:* ${cursoSeleccionado.horasClase} Horas académicas\n` +
      `💰 *Inversión:* ${formatearHNL(cursoSeleccionado.precioSugeridoAlumno || 0)} por participante\n` +
      `💳 *Cuentas Institucionales:* Banco Ficohsa o Banco Atlántida a nombre de Summit Impulsa Global\n\n` +
      `¿Deseas que reservemos tu cupo en este momento? 📲`;

    navigator.clipboard.writeText(texto);
    setCopiadoWhatsApp(true);
    onNotificar?.('¡Mensaje de WhatsApp copiado al portapapeles!');
    setTimeout(() => setCopiadoWhatsApp(false), 2500);
  };

  // 4. APROBAR TODOS EN GERENCIA GENERAL
  const handleAprobarTodosGG = () => {
    if (pendientesAprobacionGG.length === 0) {
      onNotificar?.('No hay programas pendientes de aprobación general.');
      return;
    }

    let count = 0;
    pendientesAprobacionGG.forEach((p) => {
      const aprobado = emitirAprobacionFinalGerenciaGeneral(
        p,
        'Aprobación ejecutiva institucional en bloque desde el Centro Global 1 Clic.'
      );
      onGuardarProyecto(aprobado);
      count++;
    });

    const msg = `¡Se emitieron ${count} Aprobaciones Finales por Gerencia General con deducción de cuota POA!`;
    setMensajeExito(msg);
    onNotificar?.(msg);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  // 5. COPIAR MINUTA EJECUTIVA GG
  const handleCopiarMinuta = () => {
    const ahora = new Date();
    const facturacionTotal = proyectos.reduce((acc, p) => acc + (p.alumnosFinal * (p.precioSugeridoAlumno || 0)), 0);
    const gananciaNetaTotal = proyectos.reduce((acc, p) => acc + (p.totalGananciasFinales || 0), 0);

    const minuta = `MINUTA EJECUTIVA DE JUNTA DIRECTIVA • SUMMIT IMPULSA GLOBAL, S.A. DE C.V.\n` +
      `Fecha: ${ahora.toLocaleDateString('es-HN')} | Hora: ${ahora.toLocaleTimeString('es-HN')}\n` +
      `Gerencia General: Dr. Walter René Pedroza\n` +
      `----------------------------------------------------------------------\n` +
      `1. REVISIÓN POA SEP - DIC 2026:\n` +
      `   - Total Programas Formulados: ${proyectos.length}\n` +
      `   - Facturación Real Ejecutada: ${formatearHNL(facturacionTotal)}\n` +
      `   - Superávit Neto Proyectado: ${formatearHNL(gananciaNetaTotal)}\n\n` +
      `2. DICTAMEN DE OPERACIONES:\n` +
      `   - Se ratifican los programas rentables con margen superior al 40%.\n` +
      `   - Se instruye a Gerencia de Comercialización intensificar preventa Early Bird.\n` +
      `   - Se instruye a Gerencia Académica garantizar cumplimiento de syllabus SAR.`;

    navigator.clipboard.writeText(minuta);
    setCopiadoMinuta(true);
    onNotificar?.('¡Minuta Ejecutiva copiada al portapapeles!');
    setTimeout(() => setCopiadoMinuta(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Cabecera del Modal */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white p-5 px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Zap className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Centro de Operación Rápida • 1 Clic
                </h2>
                <span className="text-[10px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                  Todas las Gerencias
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Acceda instantáneamente a las tareas más frecuentes de cada departamento sin navegar por múltiples menús.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificación de Éxito Temporal */}
        {mensajeExito && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs px-6 py-2.5 flex items-center gap-2 font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{mensajeExito}</span>
          </div>
        )}

        {/* Selector de Gerencias */}
        <div className="bg-slate-100/90 p-2 border-b border-slate-200 flex items-center justify-around gap-2 text-xs">
          <button
            onClick={() => setGerenciaActiva('academica')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black transition-all ${
              gerenciaActiva === 'academica'
                ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-500'
                : 'text-slate-600 hover:text-blue-900 hover:bg-white bg-transparent'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>1. Gerencia Académica</span>
            {pendientesAutorizarAcademica.length > 0 && (
              <span className="text-[9px] bg-white text-blue-900 font-black px-1.5 py-0.2 rounded-full">
                {pendientesAutorizarAcademica.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setGerenciaActiva('comercial')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black transition-all ${
              gerenciaActiva === 'comercial'
                ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-500'
                : 'text-slate-600 hover:text-emerald-900 hover:bg-white bg-transparent'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>2. Comercialización</span>
          </button>

          <button
            onClick={() => setGerenciaActiva('general')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black transition-all ${
              gerenciaActiva === 'general'
                ? 'bg-purple-900 text-white shadow-md ring-2 ring-purple-800'
                : 'text-slate-600 hover:text-purple-900 hover:bg-white bg-transparent'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>3. Gerencia General</span>
            {pendientesAprobacionGG.length > 0 && (
              <span className="text-[9px] bg-amber-400 text-purple-950 font-black px-1.5 py-0.2 rounded-full">
                {pendientesAprobacionGG.length}
              </span>
            )}
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* ========================================================================= */}
          {/* TAB 1: GERENCIA ACADÉMICA */}
          {/* ========================================================================= */}
          {gerenciaActiva === 'academica' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Formulación y Operaciones Curriculares Rápidas
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cree cursos optimizados para rentabilidad o complete syllabus faltantes en 1 solo clic.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onNavegarVista('gerencia-academica');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline"
                >
                  <span>Ir a Vista Académica Completa</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tarjetas de Creación Express */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md uppercase">
                      40 Horas • Curso
                    </span>
                    <h4 className="font-black text-slate-900 text-sm mt-2">Curso Aplicado</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Meta: 20 cupos. L. 2,500/alumno. Exento de ISV SAR. Margen ~58%.
                    </p>
                  </div>
                  <button
                    onClick={() => handleCrearCursoExpress('Curso 40h')}
                    className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Crear en 1 Clic</span>
                  </button>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md uppercase">
                      16 Horas • Taller
                    </span>
                    <h4 className="font-black text-slate-900 text-sm mt-2">Masterclass Rápida</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Meta: 30 cupos. L. 1,200/alumno. Fin de semana intensivo. Margen ~72%.
                    </p>
                  </div>
                  <button
                    onClick={() => handleCrearCursoExpress('Masterclass 16h')}
                    className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Crear en 1 Clic</span>
                  </button>
                </div>

                <div className="bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-800 bg-white px-2 py-0.5 rounded-md uppercase">
                      24 Horas • B2B
                    </span>
                    <h4 className="font-black text-slate-900 text-sm mt-2">Seminario Corporativo</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Meta: 18 cupos. L. 2,800/colab. Facturación SAR 15% ISV. Margen ~64%.
                    </p>
                  </div>
                  <button
                    onClick={() => handleCrearCursoExpress('Seminario B2B 24h')}
                    className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Crear en 1 Clic</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: GERENCIA DE COMERCIALIZACIÓN */}
          {/* ========================================================================= */}
          {gerenciaActiva === 'comercial' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Aceleración Comercial y Matrícula en 30 Segundos
                  </h3>
                  <p className="text-xs text-slate-500">
                    Seleccione un curso para matricular alumnos, enviar WhatsApp o generar propuestas B2B.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onNavegarVista('gerencia-comercializacion');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
                >
                  <span>Ir a Vista Comercial Completa</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Selector del curso activo */}
              {proyectos.length > 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-700">
                      Curso / Programa a gestionar:
                    </label>
                    <select
                      value={cursoSeleccionadoId}
                      onChange={(e) => setCursoSeleccionadoId(e.target.value)}
                      className="w-full sm:w-80 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {proyectos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.codigoPrograma || 'SMT'} - {p.nombreProyecto} ({p.alumnosFinal} alum.)
                        </option>
                      ))}
                    </select>
                  </div>

                  {cursoSeleccionado && (
                    <div className="pt-2 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      <div className="bg-white p-2 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Matriculados</span>
                        <span className="font-black text-emerald-700 text-sm">{cursoSeleccionado.alumnosFinal}</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Break-Even</span>
                        <span className="font-black text-slate-800 text-sm">{cursoSeleccionado.puntoEquilibrioAlumnos} alum.</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Precio/Alumno</span>
                        <span className="font-black text-blue-700 text-sm">{formatearHNL(cursoSeleccionado.precioSugeridoAlumno || 0)}</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Ganancia Neta</span>
                        <span className="font-black text-emerald-700 text-sm">{formatearHNL(cursoSeleccionado.totalGananciasFinales || 0)}</span>
                      </div>
                    </div>
                  )}

                  {/* Botones de Matrícula Rápida (+1, +3, +5) */}
                  <div className="pt-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-700">Registrar Alumnos:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSumarAlumnos(1)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        +1 Alumno
                      </button>
                      <button
                        onClick={() => handleSumarAlumnos(3)}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        +3 Alumnos
                      </button>
                      <button
                        onClick={() => handleSumarAlumnos(5)}
                        className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        +5 Alumnos (B2B)
                      </button>
                    </div>
                  </div>

                  {/* Acciones de Comunicación en 1 Clic */}
                  <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleCopiarWhatsApp}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      {copiadoWhatsApp ? <Check className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                      <span>{copiadoWhatsApp ? '¡Copiado!' : 'Copiar WhatsApp Venta'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                  No hay proyectos registrados aún. Utilice la pestaña Académica para crear el primer curso en 1 clic.
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: GERENCIA GENERAL */}
          {/* ========================================================================= */}
          {gerenciaActiva === 'general' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Aprobación Ejecutiva Directiva • Dr. Walter René Pedroza
                  </h3>
                  <p className="text-xs text-slate-500">
                    Emita el dictamen final sobre proyectos viables, deduzca la meta del POA 2026 y genere actas de Junta Directiva.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onNavegarVista('gerencia-general');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:text-purple-900 hover:underline"
                >
                  <span>Ir a Vista Gerencia General Completa</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Métricas de Aprobación */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-purple-700" />
                        <span>Aprobación Final POA en Bloque</span>
                      </span>
                      <span className="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded-full font-black">
                        {pendientesAprobacionGG.length} pendientes
                      </span>
                    </div>
                    <p className="text-xs text-purple-800/80 mt-2">
                      Valida todos los proyectos que cubren break-even y reduce automáticamente la cuota del mes correspondiente del POA Sep - Dic 2026.
                    </p>
                  </div>
                  <button
                    onClick={handleAprobarTodosGG}
                    disabled={pendientesAprobacionGG.length === 0}
                    className={`mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-black transition-all ${
                      pendientesAprobacionGG.length > 0
                        ? 'bg-purple-900 hover:bg-purple-800 text-white shadow-md cursor-pointer active:scale-98'
                        : 'bg-purple-200 text-purple-400 cursor-not-allowed'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Aprobar Todos los Rentables ({pendientesAprobacionGG.length})</span>
                  </button>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-slate-700" />
                        <span>Minuta Ejecutiva de Junta Directiva</span>
                      </span>
                      <span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full font-black">
                        Oficial
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-2">
                      Genera el acta consolidada en texto estructurado con balance real vs planificado, lista para enviar por correo o archivar.
                    </p>
                  </div>
                  <button
                    onClick={handleCopiarMinuta}
                    className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer active:scale-98"
                  >
                    {copiadoMinuta ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiadoMinuta ? '¡Minuta Copiada!' : 'Copiar Minuta de Dirección'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer del Modal */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between text-xs text-slate-500">
          <span>Summit Impulsa Global, S.A. de C.V. • POA SEP - DIC 2026</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
