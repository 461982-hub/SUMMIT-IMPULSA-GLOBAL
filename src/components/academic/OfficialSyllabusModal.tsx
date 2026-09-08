import React, { useRef, useState, useEffect } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  X, 
  Award, 
  BookOpen, 
  Clock, 
  Users, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  Calendar, 
  Laptop, 
  ShieldCheck,
  ExternalLink,
  Plus,
  Edit3,
  Trash2,
  Save,
  AlertTriangle,
  RotateCcw,
  Sliders,
  ChevronDown,
  GraduationCap
} from 'lucide-react';
import { ProyectoEducativo, Moneda, NivelProyecto, TipoProyecto } from '../../types';
import { SummitLogo } from '../SummitLogo';
import { formatearMoneda } from '../../utils/calculations';

export interface OfficialSyllabusModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyecto: ProyectoEducativo | null;
  proyectos?: ProyectoEducativo[];
  moneda?: Moneda;
  onGuardarProyecto?: (p: ProyectoEducativo) => void;
  onCrearProyecto?: (p: ProyectoEducativo) => void;
  onEliminarProyecto?: (p: ProyectoEducativo) => void;
  onNuevoProyecto?: () => void;
}

export const OfficialSyllabusModal: React.FC<OfficialSyllabusModalProps> = ({
  isOpen,
  onClose,
  proyecto,
  proyectos = [],
  moneda = 'HNL',
  onGuardarProyecto,
  onCrearProyecto,
  onEliminarProyecto,
}) => {
  // Lista de proyectos disponibles
  const listaProyectos = proyectos && proyectos.length > 0 ? proyectos : (proyecto ? [proyecto] : []);
  
  // Estados de navegación y modo
  const [proyectoActivoId, setProyectoActivoId] = useState<string>(proyecto?.id || '');
  const [modo, setModo] = useState<'vista' | 'editar' | 'crear'>('vista');
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [mensajeAlerta, setMensajeAlerta] = useState<{ tipo: 'exito' | 'error' | 'info'; texto: string } | null>(null);

  // Estados para formulario de edición / creación
  const [proyectoEditando, setProyectoEditando] = useState<Partial<ProyectoEducativo>>({});
  const [modulosEditando, setModulosEditando] = useState<Array<{ numero: number; titulo: string; horas: number }>>([]);
  const [rubricaEditando, setRubricaEditando] = useState({
    proyectoFinalPct: 40,
    talleresPracticosPct: 35,
    participacionAsistenciaPct: 15,
    examenFinalPct: 10,
    notaMinimaAprobacion: 75,
    asistenciaMinimaPct: 80,
  });

  const printableAreaRef = useRef<HTMLDivElement>(null);

  // Sincronizar ID activo al abrir o cambiar la prop de proyecto
  useEffect(() => {
    if (proyecto?.id) {
      setProyectoActivoId(proyecto.id);
      setModo('vista');
      setConfirmarEliminar(false);
      setMensajeAlerta(null);
    } else if (listaProyectos.length > 0) {
      setProyectoActivoId(listaProyectos[0].id);
      setModo('vista');
    }
  }, [proyecto?.id, isOpen, listaProyectos.length]);

  if (!isOpen) return null;

  // Proyecto actual seleccionado
  const proyectoActual = listaProyectos.find(p => p.id === proyectoActivoId) || proyecto || (listaProyectos.length > 0 ? listaProyectos[0] : null);
  
  if (!proyectoActual && modo !== 'crear') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-2xl border border-slate-200">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto shadow-inner">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-slate-900">Catálogo Listo para el POA 2026</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            La base de proyectos ha sido inicializada para arrancar con números reales. Gerencia Académica puede formular y registrar el primer sílabo oficial garantizado por Phd. Donal Reyes.
          </p>
          <div className="flex gap-2 justify-center pt-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cerrar
            </button>
            <button
              onClick={handleIniciarCreacion}
              className="px-4 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-transform hover:scale-[1.02]"
            >
              + Registrar Primer Sílabo Real
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Extractor modular de temas
  const extraerModulosDeProyecto = (p: Partial<ProyectoEducativo> | null): Array<{ numero: number; titulo: string; horas: number }> => {
    if (!p) return [];
    const totalHoras = p.horasClase || 12;
    const numTemas = p.cantidadTemas || 4;
    const horasPorTema = p.horasClasePorTema || Math.max(1, Math.round(totalHoras / numTemas));

    const lista: Array<{ numero: number; titulo: string; horas: number }> = [];
    if (p.temasImpartir && p.temasImpartir.trim()) {
      const lineas = p.temasImpartir
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);

      lineas.forEach((linea, index) => {
        const limpia = linea.replace(/^([0-9]+\.|\*|-|Módulo\s+[0-9]+:?|Tema\s+[0-9]+:?)\s*/i, '');
        lista.push({
          numero: index + 1,
          titulo: limpia || `Módulo ${index + 1}`,
          horas: horasPorTema,
        });
      });
    }

    if (lista.length === 0) {
      for (let i = 1; i <= numTemas; i++) {
        let desc = 'Fundamentos teóricos y conceptualización';
        if (i === 2) desc = 'Herramientas operativas y aplicación guiada';
        if (i === 3) desc = 'Resolución de casos de estudio y simulación práctica';
        if (i >= 4) desc = 'Taller integrador, buenas prácticas y proyecto final';
        lista.push({
          numero: i,
          titulo: `Módulo ${i}: ${desc}`,
          horas: horasPorTema,
        });
      }
    }
    return lista;
  };

  // Datos calculados del proyecto actual
  const correlativoFormateado = String(proyectoActual?.numeroCorrelativo || proyectoActual?.id || '1').padStart(3, '0');
  const codigoOficial = proyectoActual?.codigoPrograma || `SMT-DIP-2026-${correlativoFormateado}`;
  const totalHoras = proyectoActual?.horasClase || 12;
  const horasTeoricas = proyectoActual?.horasTeoricas || Math.round(totalHoras * 0.4);
  const horasPracticas = proyectoActual?.horasPracticas || Math.round(totalHoras * 0.6);
  const listaModulosActuales = extraerModulosDeProyecto(proyectoActual);
  const numTemas = listaModulosActuales.length || proyectoActual?.cantidadTemas || 4;
  const horasPorTema = proyectoActual?.horasClasePorTema || Math.max(1, Math.round(totalHoras / numTemas));

  const rubrica = proyectoActual?.rubricaEvaluacion || {
    proyectoFinalPct: 40,
    talleresPracticosPct: 35,
    participacionAsistenciaPct: 15,
    examenFinalPct: 10,
    notaMinimaAprobacion: 75,
    asistenciaMinimaPct: 80,
  };

  // Acciones de Gerencia Académica
  const handlePrint = () => {
    window.print();
  };

  const handleCopiarTexto = () => {
    if (!proyectoActual) return;
    const textoCompleto = `
SUMMIT IMPULSA GLOBAL - SÍLABO OFICIAL INSTITUCIONAL
=====================================================
CÓDIGO OFICIAL: ${codigoOficial}
PROGRAMA: ${proyectoActual.nombreProyecto}
NIVEL ACADÉMICO: ${proyectoActual.nivel || 'Básico'}
DOCENTE TITULAR: ${proyectoActual.nombreDocente} (${proyectoActual.docenteEspecialidad || 'Especialista Docente'})
MODALIDAD: ${proyectoActual.modalidad || 'Virtual Sincrónica'} (${proyectoActual.plataformaLMS || 'Zoom Pro'})
CARGA HORARIA: ${totalHoras} Horas Totales (${horasTeoricas}h Teóricas / ${horasPracticas}h Prácticas)
HORARIO: ${proyectoActual.horario || '06:00 PM - 08:00 PM'} | DÍAS: ${proyectoActual.diasClase || 'Lunes, Miércoles y Viernes'}
FECHA DE INICIO: ${proyectoActual.fechaProgramacion || 'Por definir'}

OBJETIVO GENERAL:
${proyectoActual.objetivoGeneral || 'Formación especializada orientada al desarrollo de competencias aplicadas.'}

METODOLOGÍA PEDAGÓGICA:
${proyectoActual.metodologia || 'Aprendizaje Basado en Proyectos (ABP) & Casos Prácticos Aplicados'}

ESTRUCTURA MODULAR (${numTemas} Módulos):
${listaModulosActuales.map(m => `  • Módulo ${m.numero} (${m.horas} hrs): ${m.titulo}`).join('\n')}

POLÍTICA DE EVALUACIÓN:
  - Proyecto Final Aplicado: ${rubrica.proyectoFinalPct}%
  - Talleres Prácticos y Asignaciones: ${rubrica.talleresPracticosPct}%
  - Asistencia y Participación Activa: ${rubrica.participacionAsistenciaPct}%
  - Evaluación / Test de Conocimiento: ${rubrica.examenFinalPct || 10}%
  - NOTA MÍNIMA DE APROBACIÓN: ${rubrica.notaMinimaAprobacion} / 100 puntos
  - ASISTENCIA MÍNIMA REQUERIDA: ${rubrica.asistenciaMinimaPct}%

CERTIFICACIÓN:
${proyectoActual.tipoCertificacion || 'Diploma de Aprobación Formal'} emitida por Summit Impulsa Global.

AUTORIZACIÓN Y VALIDEZ CURRICULAR:
  • Phd. Donal Reyes — Dirección de Gerencia Académica (Summit Impulsa Global)
  • ${proyectoActual.nombreDocente} — Docente Titular y Facilitador del Programa
    `.trim();

    navigator.clipboard.writeText(textoCompleto).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  };

  // 1. INICIAR EDICIÓN / ACTUALIZACIÓN
  const handleIniciarEdicion = () => {
    if (!proyectoActual) return;
    setProyectoEditando({ ...proyectoActual });
    setModulosEditando(extraerModulosDeProyecto(proyectoActual));
    setRubricaEditando(proyectoActual.rubricaEvaluacion || {
      proyectoFinalPct: 40,
      talleresPracticosPct: 35,
      participacionAsistenciaPct: 15,
      examenFinalPct: 10,
      notaMinimaAprobacion: 75,
      asistenciaMinimaPct: 80,
    });
    setModo('editar');
  };

  // 2. INICIAR CREACIÓN DE NUEVO SÍLABO
  function handleIniciarCreacion() {
    const correlativo = String(listaProyectos.length + 1).padStart(3, '0');
    const nuevoCodigo = `SMT-DIP-2026-${correlativo}`;
    setProyectoEditando({
      id: `p-${Date.now()}`,
      nombreProyecto: 'Nuevo Diplomado Ejecutivo 2026',
      codigoPrograma: nuevoCodigo,
      tipoProyecto: 'Diplomado',
      nivel: 'Intermedio',
      modalidad: 'Virtual Sincrónica',
      plataformaLMS: 'Zoom Pro',
      horasClase: 40,
      horasTeoricas: 16,
      horasPracticas: 24,
      tarifaHoraDocente: 200,
      costoZoom: 300,
      costoPapeleria: 100,
      gastosVarios: 100,
      margenGananciaOperativa: 30,
      alumnosProyectados: 15,
      alumnosFinal: 15,
      metodoVenta: 'Corporativo',
      seLlevoACabo: 'Por Llevar a Cabo',
      observaciones: 'Elaborado por Dirección de Gerencia Académica (Phd. Donal Reyes)',
      nombreDocente: 'Phd. Donal Reyes',
      docenteEspecialidad: 'Dirección Pedagógica y Gestión Estratégica',
      horario: '06:00 PM - 08:00 PM',
      diasClase: 'Lunes, Miércoles y Viernes',
      fechaProgramacion: new Date().toISOString().split('T')[0],
      fechaVenta: new Date().toISOString().split('T')[0],
      objetivoGeneral: 'Desarrollar competencias técnicas, estratégicas y operativas aplicadas al contexto empresarial moderno.',
      metodologia: 'Aprendizaje Basado en Proyectos (ABP) & Casos Prácticos Aplicados',
      tipoCertificacion: 'Diploma de Aprobación Formal con Validez Institucional',
      autorizacionAcademica: true,
      responsableAcademico: 'Phd. Donal Reyes - Dirección de Gerencia Académica',
    });

    setModulosEditando([
      { numero: 1, titulo: 'Fundamentos y Marco Conceptual Aplicado', horas: 10 },
      { numero: 2, titulo: 'Herramientas Técnicas y Desarrollo de Habilidades', horas: 10 },
      { numero: 3, titulo: 'Análisis de Casos Reales y Simulación Práctica', horas: 10 },
      { numero: 4, titulo: 'Taller Integrador Final y Proyecto de Aplicación', horas: 10 },
    ]);

    setRubricaEditando({
      proyectoFinalPct: 40,
      talleresPracticosPct: 35,
      participacionAsistenciaPct: 15,
      examenFinalPct: 10,
      notaMinimaAprobacion: 75,
      asistenciaMinimaPct: 80,
    });

    setModo('crear');
  };

  // 3. GUARDAR ACTUALIZACIÓN DE SÍLABO EXISTENTE
  const handleGuardarEdicion = () => {
    if (!proyectoEditando.nombreProyecto?.trim()) {
      setMensajeAlerta({ tipo: 'error', texto: 'El nombre del programa no puede estar vacío.' });
      return;
    }

    const temasConsolidados = modulosEditando
      .map(m => `Módulo ${m.numero}: ${m.titulo}`)
      .join('\n');

    const totalHorasCalculadas = modulosEditando.reduce((acc, m) => acc + (Number(m.horas) || 0), 0);
    const horasClase = totalHorasCalculadas > 0 ? totalHorasCalculadas : (proyectoEditando.horasClase || 24);

    const proyectoActualizado: ProyectoEducativo = {
      ...(proyectoActual as ProyectoEducativo),
      ...proyectoEditando,
      horasClase,
      cantidadTemas: modulosEditando.length,
      horasClasePorTema: modulosEditando.length > 0 ? Math.round(horasClase / modulosEditando.length) : 10,
      temasImpartir: temasConsolidados,
      rubricaEvaluacion: rubricaEditando,
      fechaModificacion: new Date().toLocaleDateString('es-HN'),
      horaModificacion: new Date().toLocaleTimeString('es-HN'),
      horaUltimaModificacion: new Date().toLocaleTimeString('es-HN'),
      responsableAcademico: 'Phd. Donal Reyes - Dirección de Gerencia Académica',
    };

    if (onGuardarProyecto) {
      onGuardarProyecto(proyectoActualizado);
    }

    setModo('vista');
    setMensajeAlerta({ 
      tipo: 'exito', 
      texto: `¡Sílabo de "${proyectoActualizado.nombreProyecto}" actualizado exitosamente y garantizado por Gerencia Académica!` 
    });
    setTimeout(() => setMensajeAlerta(null), 4000);
  };

  // 4. GUARDAR NUEVO PROGRAMA Y SÍLABO
  const handleGuardarNuevoPrograma = () => {
    if (!proyectoEditando.nombreProyecto?.trim()) {
      setMensajeAlerta({ tipo: 'error', texto: 'Ingrese el nombre del nuevo programa.' });
      return;
    }

    const temasConsolidados = modulosEditando
      .map(m => `Módulo ${m.numero}: ${m.titulo}`)
      .join('\n');

    const totalHorasCalculadas = modulosEditando.reduce((acc, m) => acc + (Number(m.horas) || 0), 0);
    const horasClase = totalHorasCalculadas > 0 ? totalHorasCalculadas : (proyectoEditando.horasClase || 40);

    const nuevoId = proyectoEditando.id || `p-${Date.now()}`;
    const nuevoProyecto: ProyectoEducativo = {
      ...(proyectoEditando as ProyectoEducativo),
      id: nuevoId,
      horasClase,
      cantidadTemas: modulosEditando.length,
      horasClasePorTema: modulosEditando.length > 0 ? Math.round(horasClase / modulosEditando.length) : 10,
      temasImpartir: temasConsolidados,
      rubricaEvaluacion: rubricaEditando,
      fechaCreacion: new Date().toISOString(),
      horaCreacion: new Date().toLocaleTimeString('es-HN'),
      fechaHoraGrabacion: `${new Date().toLocaleDateString('es-HN')}, ${new Date().toLocaleTimeString('es-HN')}`,
      responsableAcademico: 'Phd. Donal Reyes - Dirección de Gerencia Académica',
    };

    if (onCrearProyecto) {
      onCrearProyecto(nuevoProyecto);
    } else if (onGuardarProyecto) {
      onGuardarProyecto(nuevoProyecto);
    }

    setProyectoActivoId(nuevoId);
    setModo('vista');
    setMensajeAlerta({
      tipo: 'exito',
      texto: `¡Nuevo programa "${nuevoProyecto.nombreProyecto}" registrado y garantizado por Gerencia Académica!`,
    });
    setTimeout(() => setMensajeAlerta(null), 4000);
  };

  // 5. BORRADO / ELIMINACIÓN DE PROGRAMA Y SÍLABO
  const handleConfirmarEliminacion = () => {
    if (!proyectoActual) return;
    const nombreEliminado = proyectoActual.nombreProyecto;
    const idEliminado = proyectoActual.id;

    if (onEliminarProyecto) {
      onEliminarProyecto(proyectoActual);
    }

    setConfirmarEliminar(false);

    // Cambiar al siguiente proyecto disponible o cerrar
    const restantes = listaProyectos.filter(p => p.id !== idEliminado);
    if (restantes.length > 0) {
      setProyectoActivoId(restantes[0].id);
      setModo('vista');
      setMensajeAlerta({
        tipo: 'exito',
        texto: `Programa "${nombreEliminado}" eliminado correctamente del catálogo.`,
      });
      setTimeout(() => setMensajeAlerta(null), 4000);
    } else {
      onClose();
    }
  };

  // Manejo de módulos dinámicos
  const handleAgregarModulo = () => {
    const nuevoNum = modulosEditando.length + 1;
    setModulosEditando([
      ...modulosEditando,
      { numero: nuevoNum, titulo: `Módulo ${nuevoNum}: Aplicación y Casos de Estudio`, horas: 10 }
    ]);
  };

  const handleEliminarModulo = (indexAEliminar: number) => {
    if (modulosEditando.length <= 1) {
      setMensajeAlerta({ tipo: 'error', texto: 'El sílabo debe contener al menos un módulo temático.' });
      return;
    }
    const filtrados = modulosEditando
      .filter((_, idx) => idx !== indexAEliminar)
      .map((mod, idx) => ({ ...mod, numero: idx + 1 }));
    setModulosEditando(filtrados);
  };

  const handleCambiarModulo = (idx: number, campo: 'titulo' | 'horas', valor: any) => {
    const copia = [...modulosEditando];
    copia[idx] = { ...copia[idx], [campo]: valor };
    setModulosEditando(copia);
  };

  // Suma de ponderación de rúbrica
  const sumaPonderacion = 
    (Number(rubricaEditando.proyectoFinalPct) || 0) +
    (Number(rubricaEditando.talleresPracticosPct) || 0) +
    (Number(rubricaEditando.participacionAsistenciaPct) || 0) +
    (Number(rubricaEditando.examenFinalPct) || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] print:max-h-none print:border-none print:shadow-none print:rounded-none">
        
        {/* BARRA SUPERIOR DE CONTROL INSTITUCIONAL (Print:hidden) */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 print:hidden border-b border-blue-800/40">
          
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-blue-500/30 text-blue-200 rounded border border-blue-400/30">
                  GERENCIA ACADÉMICA
                </span>

                {/* Selector rápido de programas si hay más de uno */}
                {listaProyectos.length > 1 && modo === 'vista' ? (
                  <div className="relative inline-block">
                    <select
                      id="select-programa-syllabo"
                      value={proyectoActual?.id}
                      onChange={(e) => {
                        setProyectoActivoId(e.target.value);
                        setMensajeAlerta(null);
                      }}
                      className="text-xs font-mono font-bold bg-blue-900/80 text-blue-100 border border-blue-500/40 rounded-lg px-2.5 py-1 pr-6 cursor-pointer hover:bg-blue-800/90 transition-colors focus:ring-1 focus:ring-blue-400 appearance-none"
                      title="Cambiar de programa para ver o editar su sílabo"
                    >
                      {listaProyectos.map((p) => (
                        <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                          {p.codigoPrograma || `SMT-${p.id}`} • {p.nombreProyecto}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-blue-300 absolute right-1.5 top-2 pointer-events-none" />
                  </div>
                ) : (
                  <span className="text-xs text-blue-200 font-mono font-bold">
                    {codigoOficial}
                  </span>
                )}

                {modo !== 'vista' && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded">
                    {modo === 'editar' ? 'Modo Actualización' : 'Modo Creación'}
                  </span>
                )}
              </div>

              <h3 className="text-sm font-bold text-white truncate max-w-sm sm:max-w-md mt-0.5">
                {modo === 'crear' 
                  ? 'Nuevo Sílabo Oficial y Guía Pedagógica Institucional' 
                  : (proyectoActual?.nombreProyecto || 'Sílabo Oficial y Guía Pedagógica Institucional')}
              </h3>
            </div>
          </div>

          {/* BOTONERA DE ACCIONES DE GERENCIA ACADÉMICA */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap self-end sm:self-center">
            
            {modo === 'vista' ? (
              <>
                {/* 1. Botón Actualizar Sílabo */}
                <button
                  type="button"
                  id="btn-actualizar-syllabo"
                  onClick={handleIniciarEdicion}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-colors cursor-pointer shadow-xs"
                  title="Editar y actualizar la información pedagógica del sílabo para garantizar su precisión"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Actualizar</span>
                </button>

                {/* 2. Botón Crear Nuevo Sílabo */}
                <button
                  type="button"
                  id="btn-crear-nuevo-syllabo"
                  onClick={handleIniciarCreacion}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  title="Crear y registrar un nuevo programa curricular en la Gerencia Académica"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Nuevo</span>
                </button>

                {/* 3. Botón Borrar / Eliminar */}
                <button
                  type="button"
                  id="btn-eliminar-syllabo"
                  onClick={() => setConfirmarEliminar(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer"
                  title="Eliminar este programa y sílabo del catálogo institucional"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Eliminar</span>
                </button>

                <div className="h-5 w-px bg-white/20 mx-0.5" />

                {/* Copiar al Portapapeles */}
                <button
                  type="button"
                  onClick={handleCopiarTexto}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors cursor-pointer border border-white/15"
                  title="Copiar contenido en formato texto"
                >
                  {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                  <span className="hidden md:inline">{copiado ? 'Copiado' : 'Copiar'}</span>
                </button>

                {/* Imprimir / Guardar PDF */}
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs border border-blue-400/30"
                  title="Imprimir o guardar como documento PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Imprimir / Guardar PDF</span>
                </button>
              </>
            ) : (
              <>
                {/* Botón Cancelar Edición/Creación */}
                <button
                  type="button"
                  onClick={() => {
                    setModo('vista');
                    setMensajeAlerta(null);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Cancelar</span>
                </button>

                {/* Botón Guardar */}
                <button
                  type="button"
                  id="btn-guardar-cambios-syllabo"
                  onClick={modo === 'editar' ? handleGuardarEdicion : handleGuardarNuevoPrograma}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-colors cursor-pointer shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{modo === 'editar' ? 'Guardar Cambios' : 'Crear y Registrar Sílabo'}</span>
                </button>
              </>
            )}

            {/* Cerrar Modal */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors ml-1 cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ALERTA DE MENSAJES Y ACCIONES REALIZADAS */}
        {mensajeAlerta && (
          <div className={`px-5 py-2.5 text-xs font-bold flex items-center justify-between border-b ${
            mensajeAlerta.tipo === 'exito' 
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
              : mensajeAlerta.tipo === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-blue-50 text-blue-900 border-blue-200'
          } print:hidden`}>
            <div className="flex items-center gap-2">
              {mensajeAlerta.tipo === 'exito' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              {mensajeAlerta.tipo === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600" />}
              <span>{mensajeAlerta.texto}</span>
            </div>
            <button
              type="button"
              onClick={() => setMensajeAlerta(null)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer text-sm font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* MODAL DE CONFIRMACIÓN DE BORRADO */}
        {confirmarEliminar && proyectoActual && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs print:hidden animate-in fade-in duration-150">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <p className="font-black text-rose-950 text-xs">
                  ¿Confirma la eliminación del programa y su sílabo oficial?
                </p>
                <p className="text-rose-800 text-[11px] mt-0.5">
                  Se removerá "{proyectoActual.nombreProyecto}" ({codigoOficial}) del catálogo de Gerencia Académica.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => setConfirmarEliminar(false)}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirmar-eliminar-syllabo"
                onClick={handleConfirmarEliminacion}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              >
                Sí, Eliminar Programa
              </button>
            </div>
          </div>
        )}

        {/* CONTENIDO PRINCIPAL: VISTA PREVIA IMPRIMIBLE O FORMULARIO DE EDICIÓN/CREACIÓN */}
        {modo === 'vista' && proyectoActual ? (
          /* =========================================================================
             1. VISTA OFICIAL DEL SÍLABO (FORMATO INSTITUCIONAL SUMMIT IMPULSA)
             ========================================================================= */
          <div ref={printableAreaRef} className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-900 print:p-8 print:overflow-visible font-sans">
            
            {/* Encabezado Membretado Oficial */}
            <div className="border-b-2 border-blue-900 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <SummitLogo variant="full" size="md" />
                  <div className="border-l border-slate-300 pl-3.5">
                    <div className="text-[11px] font-black uppercase tracking-widest text-blue-950">
                      DIRECCIÓN PEDAGÓGICA Y CURRICULAR
                    </div>
                    <div className="text-[10px] text-slate-600 font-medium">
                      Summit Impulsa Global • Sistema de Gestión Académica
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg text-right">
                    <div className="text-[9px] font-bold text-blue-700 uppercase tracking-wider">Folio Oficial de Registro</div>
                    <div className="text-sm font-black font-mono text-blue-950">{codigoOficial}</div>
                    <div className="text-[9px] font-mono text-slate-500">
                      {proyectoActual.fechaHoraGrabacion || proyectoActual.horaCreacion ? `Emitido: ${proyectoActual.fechaHoraGrabacion || proyectoActual.horaCreacion}` : 'Vigencia: 2026-2027'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-center sm:text-left">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                  SÍLABO OFICIAL DEL CURSO • PROGRAMA ACADÉMICO
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-950 mt-1.5 tracking-tight">
                  {proyectoActual.nombreProyecto}
                </h1>
                <p className="text-xs text-slate-600 font-medium mt-1">
                  {proyectoActual.objetivoGeneral || 'Desarrollo de competencias técnicas, estratégicas y operativas aplicadas al contexto empresarial.'}
                </p>
              </div>
            </div>

            {/* 1. Datos Generales de la Asignatura */}
            <div className="space-y-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                <BookOpen className="w-3.5 h-3.5 text-blue-700" />
                1. Ficha Técnica y Datos Generales del Programa
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Nivel Académico</span>
                  <span className="font-bold text-blue-900 block mt-0.5">{proyectoActual.nivel || 'Básico'}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Carga Horaria Total</span>
                  <span className="font-black text-slate-900 font-mono block mt-0.5">{totalHoras} Horas de Clase</span>
                  <span className="text-[9px] text-slate-500">{horasTeoricas}h Teóricas • {horasPracticas}h Prácticas</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Modalidad de Impartición</span>
                  <span className="font-bold text-slate-900 block mt-0.5">{proyectoActual.modalidad || 'Virtual Sincrónica'}</span>
                  <span className="text-[9px] text-slate-500">{proyectoActual.plataformaLMS || 'Zoom Pro'}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Horario y Días</span>
                  <span className="font-bold text-slate-900 block mt-0.5 truncate">{proyectoActual.horario || '06:00 PM - 08:00 PM'}</span>
                  <span className="text-[9px] text-slate-500 truncate block">{proyectoActual.diasClase || 'Lunes, Miércoles y Viernes'}</span>
                </div>
              </div>
            </div>

            {/* 2. Cuerpo Docente Responsable */}
            <div className="space-y-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                <Users className="w-3.5 h-3.5 text-blue-700" />
                2. Docente Titular y Facilitador
              </h2>
              <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="text-xs font-bold text-blue-950 flex items-center gap-2">
                    <span>{proyectoActual.nombreDocente}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 bg-blue-200 text-blue-900 rounded">
                      Docente Asignado
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    {proyectoActual.docenteEspecialidad || 'Especialista en Capacitación Profesional y Desarrollo de Competencias'}
                  </p>
                </div>
                <div className="text-right text-[11px] text-slate-600 shrink-0">
                  <div>Sección: <strong className="text-slate-900">{proyectoActual.seccion || 'Sección A'}</strong></div>
                  <div>Fecha Inicio: <strong className="font-mono text-slate-900">{proyectoActual.fechaProgramacion || 'Programada'}</strong></div>
                </div>
              </div>
            </div>

            {/* 3. Metodología Pedagógica */}
            <div className="space-y-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                3. Metodología de Enseñanza y Enfoque Didáctico
              </h2>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 space-y-1.5">
                <p className="font-bold text-slate-900">
                  {proyectoActual.metodologia || 'Aprendizaje Basado en Proyectos (ABP) & Casos Prácticos Aplicados'}
                </p>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  El curso combina exposición conceptual sincrónica con talleres aplicados y análisis de casos reales. Se promueve la participación activa, el debate guiado y la entrega de un proyecto práctico acumulativo que consolida las competencias transferibles al ámbito laboral.
                </p>
              </div>
            </div>

            {/* 4. Desglose Temático y Distribución Modular */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <h2 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-700" />
                  4. Estructura Modular y Contenido Temático ({numTemas} Módulos)
                </h2>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {horasPorTema} hrs / módulo • {totalHoras} hrs totales
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200 text-xs">
                {listaModulosActuales.map((mod) => (
                  <div key={mod.numero} className="p-3 bg-white hover:bg-slate-50/80 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-900 font-bold flex items-center justify-center shrink-0 text-xs font-mono">
                        {mod.numero}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{mod.titulo}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Ejercicios guiados, aplicación de plantillas y discusión de casos prácticos.
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-xs font-black font-mono text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {mod.horas} horas
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Criterios de Evaluación y Acreditación */}
            <div className="space-y-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                <Award className="w-3.5 h-3.5 text-blue-700" />
                5. Sistema de Evaluación y Requisitos de Aprobación
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 font-bold block uppercase">Proyecto Integrador</span>
                  <span className="text-lg font-black text-emerald-950 font-mono block mt-0.5">{rubrica.proyectoFinalPct}%</span>
                  <span className="text-[9px] text-emerald-700">Entregable práctico final</span>
                </div>
                <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-[10px] text-blue-800 font-bold block uppercase">Talleres & Casos</span>
                  <span className="text-lg font-black text-blue-950 font-mono block mt-0.5">{rubrica.talleresPracticosPct}%</span>
                  <span className="text-[9px] text-blue-700">Asignaciones en clase</span>
                </div>
                <div className="p-2.5 bg-purple-50 rounded-lg border border-purple-200">
                  <span className="text-[10px] text-purple-800 font-bold block uppercase">Participación</span>
                  <span className="text-lg font-black text-purple-950 font-mono block mt-0.5">{rubrica.participacionAsistenciaPct}%</span>
                  <span className="text-[9px] text-purple-700">Interacción y debates</span>
                </div>
                <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200">
                  <span className="text-[10px] text-amber-800 font-bold block uppercase">Nota Mínima</span>
                  <span className="text-lg font-black text-amber-950 font-mono block mt-0.5">{rubrica.notaMinimaAprobacion} pts</span>
                  <span className="text-[9px] text-amber-700">Asistencia mín: {rubrica.asistenciaMinimaPct}%</span>
                </div>
              </div>
            </div>

            {/* Documento adjunto de referencia */}
            {proyectoActual.planificacionPdf && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs print:hidden">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="text-slate-700 truncate font-semibold">
                    Documento PDF de Planificación Curricular Adjunto: <strong>{proyectoActual.planificacionPdf.nombreArchivo}</strong>
                  </span>
                </div>
                <a
                  href={proyectoActual.planificacionPdf.dataUrl}
                  download={proyectoActual.planificacionPdf.nombreArchivo}
                  className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 inline-flex items-center gap-1 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" /> Descargar PDF Original
                </a>
              </div>
            )}

            {/* 6. Cuadro de Firmas Oficiales (DIRECCIÓN ACADÉMICA: Phd. Donal Reyes) */}
            <div className="pt-6 border-t-2 border-slate-300">
              <div className="grid grid-cols-2 gap-8 text-center pt-8">
                <div>
                  <div className="w-52 mx-auto border-b-2 border-slate-900 pb-1 mb-1">
                    <div className="font-serif italic text-slate-800 text-base font-semibold tracking-wide">
                      Phd. Donal Reyes
                    </div>
                  </div>
                  <div className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Phd. Donal Reyes
                  </div>
                  <div className="text-[10px] text-slate-600 font-bold uppercase">
                    Dirección de Gerencia Académica
                  </div>
                  <div className="text-[9px] text-slate-400 font-medium">
                    Summit Impulsa Global • Sello de Autorización y Validez Curricular
                  </div>
                </div>

                <div>
                  <div className="w-52 mx-auto border-b-2 border-slate-900 pb-1 mb-1">
                    <div className="font-serif italic text-slate-800 text-base font-semibold tracking-wide">
                      {proyectoActual.nombreDocente}
                    </div>
                  </div>
                  <div className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    {proyectoActual.nombreDocente}
                  </div>
                  <div className="text-[10px] text-slate-600 font-bold uppercase">
                    {proyectoActual.docenteEspecialidad || 'Docente Titular y Facilitador'}
                  </div>
                  <div className="text-[9px] text-slate-400 font-medium">
                    Cuerpo Docente Institucional Acreditado
                  </div>
                </div>
              </div>
            </div>

            {/* Pie de página institucional */}
            <div className="pt-3 border-t border-slate-200 text-center text-[9px] text-slate-400 font-mono">
              Documento de control académico interno y público • Summit Impulsa Global • Todos los derechos reservados • Código de Verificación: {codigoOficial} • Autorizado por Phd. Donal Reyes
            </div>

          </div>
        ) : (
          /* =========================================================================
             2. MODO ACTUALIZACIÓN / CREACIÓN CURRICULAR (FORMULARIO GERENCIA ACADÉMICA)
             ========================================================================= */
          <div className="p-6 overflow-y-auto space-y-6">
            
            {/* Banner orientativo */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-600 text-white shrink-0 shadow-2xs">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-blue-950 uppercase tracking-wider">
                  {modo === 'editar' ? 'Actualización y Garantía Curricular' : 'Creación de Nuevo Programa Curricular'}
                </h4>
                <p className="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
                  Gerencia Académica: Ingrese y garantice la información oficial del sílabo. Todos los datos, carga horaria, desglose modular y ponderaciones de evaluación quedarán sellados y autorizados bajo la firma de <strong>Phd. Donal Reyes</strong>.
                </p>
              </div>
            </div>

            {/* Formulario en Secciones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              
              {/* SECCIÓN 1: FICHA TÉCNICA */}
              <div className="space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span className="font-black text-slate-900 text-xs uppercase">
                    1. Ficha Técnica Institucional
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nombre del Programa Académico *
                  </label>
                  <input
                    type="text"
                    value={proyectoEditando.nombreProyecto || ''}
                    onChange={(e) => setProyectoEditando({ ...proyectoEditando, nombreProyecto: e.target.value })}
                    placeholder="Ej. Diplomado Ejecutivo en Gestión de Proyectos"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Código Oficial
                    </label>
                    <input
                      type="text"
                      value={proyectoEditando.codigoPrograma || ''}
                      onChange={(e) => setProyectoEditando({ ...proyectoEditando, codigoPrograma: e.target.value })}
                      placeholder="Ej. SMT-DIP-2026-001"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-blue-950 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Tipo de Formación
                    </label>
                    <select
                      value={proyectoEditando.tipoProyecto || 'Diplomado'}
                      onChange={(e) => setProyectoEditando({ ...proyectoEditando, tipoProyecto: e.target.value as TipoProyecto })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Diplomado">Diplomado</option>
                      <option value="Curso">Curso</option>
                      <option value="Certificación">Certificación</option>
                      <option value="Taller">Taller</option>
                      <option value="Conferencia">Conferencia</option>
                      <option value="Seminario">Seminario</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nivel Académico
                    </label>
                    <select
                      value={proyectoEditando.nivel || 'Básico'}
                      onChange={(e) => setProyectoEditando({ ...proyectoEditando, nivel: e.target.value as NivelProyecto })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Básico">Básico</option>
                      <option value="Intermedio">Intermedio</option>
                      <option value="Avanzado">Avanzado</option>
                      <option value="Maestría / Alta Especialización">Maestría / Alta Especialización</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Modalidad
                    </label>
                    <select
                      value={proyectoEditando.modalidad || 'Virtual Sincrónica'}
                      onChange={(e) => setProyectoEditando({ ...proyectoEditando, modalidad: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Virtual Sincrónica">Virtual Sincrónica</option>
                      <option value="Híbrida">Híbrida</option>
                      <option value="Presencial">Presencial</option>
                      <option value="Asincrónica LMS">Asincrónica LMS</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      Carga Horaria Total
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={proyectoEditando.horasClase || 24}
                      onChange={(e) => setProyectoEditando({ ...proyectoEditando, horasClase: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      Horas Teóricas
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={proyectoEditando.horasTeoricas || 10}
                      onChange={(e) => setProyectoEditando({ ...proyectoEditando, horasTeoricas: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      Horas Prácticas
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={proyectoEditando.horasPracticas || 14}
                      onChange={(e) => setProyectoEditando({ ...proyectoEditando, horasPracticas: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Horario de Impartición
                    </label>
                    <input
                      type="text"
                      value={proyectoEditando.horario || ''}
                      onChange={(e) => setProyectoEditando({ ...proyectoEditando, horario: e.target.value })}
                      placeholder="Ej. 06:00 PM - 08:00 PM"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Días de Clase
                    </label>
                    <input
                      type="text"
                      value={proyectoEditando.diasClase || ''}
                      onChange={(e) => setProyectoEditando({ ...proyectoEditando, diasClase: e.target.value })}
                      placeholder="Ej. Lunes, Miércoles y Viernes"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: DOCENCIA Y ENFOQUE PEDAGÓGICO */}
              <div className="space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span className="font-black text-slate-900 text-xs uppercase">
                    2. Facilitador y Propósito Pedagógico
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Docente Titular Asignado
                  </label>
                  <input
                    type="text"
                    value={proyectoEditando.nombreDocente || ''}
                    onChange={(e) => setProyectoEditando({ ...proyectoEditando, nombreDocente: e.target.value })}
                    placeholder="Ej. Ing. Walter René Pedroza"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Especialidad y Perfil Profesional del Docente
                  </label>
                  <input
                    type="text"
                    value={proyectoEditando.docenteEspecialidad || ''}
                    onChange={(e) => setProyectoEditando({ ...proyectoEditando, docenteEspecialidad: e.target.value })}
                    placeholder="Ej. Especialista en Normativa Fiscal, Finanzas y Estrategia"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Objetivo General del Programa
                  </label>
                  <textarea
                    rows={2}
                    value={proyectoEditando.objetivoGeneral || ''}
                    onChange={(e) => setProyectoEditando({ ...proyectoEditando, objetivoGeneral: e.target.value })}
                    placeholder="Describa el objetivo formativo general..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Metodología Didáctica Aplicada
                  </label>
                  <textarea
                    rows={2}
                    value={proyectoEditando.metodologia || ''}
                    onChange={(e) => setProyectoEditando({ ...proyectoEditando, metodologia: e.target.value })}
                    placeholder="Ej. Aprendizaje Basado en Proyectos (ABP), estudio de casos reales..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                  />
                </div>

                {/* Sello oficial no editable */}
                <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
                  <div className="text-[11px] text-blue-900">
                    <span className="font-bold">Firma Institucional Garantizada: </span>
                    <span>Phd. Donal Reyes — Dirección de Gerencia Académica</span>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: ESTRUCTURA MODULAR / TEMAS */}
              <div className="md:col-span-2 space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span className="font-black text-slate-900 text-xs uppercase">
                      3. Estructura Modular y Desglose de Horas ({modulosEditando.length} Módulos)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAgregarModulo}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Módulo</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {modulosEditando.map((mod, idx) => (
                    <div key={idx} className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center gap-3">
                      <span className="w-6 h-6 rounded bg-blue-100 text-blue-900 font-bold flex items-center justify-center shrink-0 font-mono text-xs">
                        {mod.numero}
                      </span>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={mod.titulo}
                          onChange={(e) => handleCambiarModulo(idx, 'titulo', e.target.value)}
                          placeholder={`Título o descripción del Módulo ${mod.numero}`}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-900 focus:bg-white"
                        />
                      </div>
                      <div className="w-24 shrink-0 flex items-center gap-1">
                        <input
                          type="number"
                          min={1}
                          value={mod.horas}
                          onChange={(e) => handleCambiarModulo(idx, 'horas', Number(e.target.value))}
                          className="w-14 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-bold text-right"
                        />
                        <span className="text-[10px] text-slate-500">hrs</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleEliminarModulo(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title="Eliminar módulo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECCIÓN 4: RÚBRICA DE EVALUACIÓN */}
              <div className="md:col-span-2 space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span className="font-black text-slate-900 text-xs uppercase">
                      4. Rúbrica y Criterios de Aprobación
                    </span>
                  </div>

                  <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                    sumaPonderacion === 100 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                      : 'bg-amber-50 text-amber-700 border-amber-300'
                  }`}>
                    {sumaPonderacion === 100 
                      ? '✓ Ponderación exacta: 100%' 
                      : `⚠ Suma actual: ${sumaPonderacion}% (Debe ser 100%)`}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      Proyecto Integrador (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={rubricaEditando.proyectoFinalPct}
                      onChange={(e) => setRubricaEditando({ ...rubricaEditando, proyectoFinalPct: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-emerald-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      Talleres y Casos (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={rubricaEditando.talleresPracticosPct}
                      onChange={(e) => setRubricaEditando({ ...rubricaEditando, talleresPracticosPct: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-blue-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      Participación (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={rubricaEditando.participacionAsistenciaPct}
                      onChange={(e) => setRubricaEditando({ ...rubricaEditando, participacionAsistenciaPct: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-purple-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      Examen / Evaluación (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={rubricaEditando.examenFinalPct}
                      onChange={(e) => setRubricaEditando({ ...rubricaEditando, examenFinalPct: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-amber-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      Nota Mínima de Aprobación (puntos)
                    </label>
                    <input
                      type="number"
                      min={60}
                      max={100}
                      value={rubricaEditando.notaMinimaAprobacion}
                      onChange={(e) => setRubricaEditando({ ...rubricaEditando, notaMinimaAprobacion: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      Asistencia Mínima Requerida (%)
                    </label>
                    <input
                      type="number"
                      min={50}
                      max={100}
                      value={rubricaEditando.asistenciaMinimaPct}
                      onChange={(e) => setRubricaEditando({ ...rubricaEditando, asistenciaMinimaPct: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Botones inferiores en modo edición/creación */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setModo('vista');
                  setMensajeAlerta(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-guardar-formulario-syllabo"
                onClick={modo === 'editar' ? handleGuardarEdicion : handleGuardarNuevoPrograma}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-xs transition-colors cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{modo === 'editar' ? 'Guardar y Garantizar Información' : 'Crear y Registrar Sílabo Oficial'}</span>
              </button>
            </div>

          </div>
        )}

        {/* BARRA INFERIOR DE ACCIONES (Print:hidden) */}
        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs print:hidden">
          <span className="text-slate-500 text-[11px]">
            {modo === 'vista' ? (
              <>Sugerencia: Puedes usar <strong>Ctrl + P</strong> o el botón para imprimir o guardar como PDF. Firma: <strong>Phd. Donal Reyes</strong>.</>
            ) : (
              <>Modo de administración curricular de Gerencia Académica.</>
            )}
          </span>
          <div className="flex items-center gap-2">
            {modo !== 'vista' && (
              <button
                type="button"
                onClick={() => setModo('vista')}
                className="px-3 py-1.5 bg-white hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-300 transition-colors cursor-pointer"
              >
                Volver a Vista Previa
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
