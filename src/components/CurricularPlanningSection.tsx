import React, { useRef, useState, useEffect } from 'react';
import { 
  BookOpen, 
  Clock, 
  FileText, 
  UploadCloud, 
  FileCheck, 
  Trash2, 
  ExternalLink, 
  Sparkles, 
  Calculator, 
  AlertCircle,
  HelpCircle,
  Layers,
  GraduationCap,
  Award,
  Settings,
  Users
} from 'lucide-react';
import { TipoProyecto, NivelProyecto, ProyectoEducativo } from '../types';
import { 
  METODOLOGIAS_SUGERIDAS, 
  sugerirMetodologiaPorDefecto, 
  calcularTotalHorasCurso, 
  validarArchivoPDF, 
  convertirArchivoADataUrl,
  obtenerConfiguracionHorasPorNivel,
  ConfiguracionHorasNivel
} from '../utils/curricularUtils';
import { ConfiguracionHorasNivelModal } from './ConfiguracionHorasNivelModal';
import { CurricularCoherenceAlerts } from './academic/CurricularCoherenceAlerts';
import { DocenteDirectoryModal } from './academic/DocenteDirectoryModal';
import { DocenteBanco } from '../utils/docenteDirectoryUtils';

interface CurricularPlanningSectionProps {
  cantidadTemas: number;
  horasClasePorTema: number;
  totalHorasCurso: number;
  metodologia: string;
  planificacionPdf?: {
    nombreArchivo: string;
    dataUrl: string;
    tamanoKb?: number;
    fechaCarga?: string;
  };
  tipoProyecto?: TipoProyecto;
  nivelProyecto?: NivelProyecto;
  nombreProyecto?: string;
  proyectosExistentes?: ProyectoEducativo[];
  proyectoIdActual?: string;
  nombreDocente?: string;
  onDocenteSeleccionado?: (docente: DocenteBanco) => void;
  onNivelChange?: (valor: NivelProyecto, config?: { cantidadTemas: number; horasPorTema: number; totalHoras: number }) => void;
  onCantidadTemasChange: (valor: number) => void;
  onHorasClasePorTemaChange: (valor: number) => void;
  onTotalHorasCursoChange: (valor: number) => void;
  onMetodologiaChange: (valor: string) => void;
  onPlanificacionPdfChange: (pdfData?: {
    nombreArchivo: string;
    dataUrl: string;
    tamanoKb?: number;
    fechaCarga?: string;
  }) => void;
  modoLectura?: boolean;
  campoConError?: string | null;
}

export const CurricularPlanningSection: React.FC<CurricularPlanningSectionProps> = ({
  cantidadTemas,
  horasClasePorTema,
  totalHorasCurso,
  metodologia,
  planificacionPdf,
  tipoProyecto,
  nivelProyecto,
  nombreProyecto = '',
  proyectosExistentes = [],
  proyectoIdActual,
  nombreDocente,
  onDocenteSeleccionado,
  onNivelChange,
  onCantidadTemasChange,
  onHorasClasePorTemaChange,
  onTotalHorasCursoChange,
  onMetodologiaChange,
  onPlanificacionPdfChange,
  modoLectura = false,
  campoConError = null,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [errorPdf, setErrorPdf] = useState<string | null>(null);
  const [sugerenciaAplicada, setSugerenciaAplicada] = useState(false);
  const [modalConfigAbierto, setModalConfigAbierto] = useState(false);
  const [modalDocentesAbierto, setModalDocentesAbierto] = useState(false);

  // Manejar cambio de nivel académico del curso y colocar automáticamente las horas para costos operativos
  const handleNivelSelect = (nuevoNivel: NivelProyecto) => {
    const config = obtenerConfiguracionHorasPorNivel(nuevoNivel);
    onNivelChange?.(nuevoNivel, config);
    onCantidadTemasChange(config.cantidadTemas);
    onHorasClasePorTemaChange(config.horasPorTema);
    onTotalHorasCursoChange(config.totalHoras);
  };

  // Reaccionar a cambios en la configuración global de horas por nivel
  useEffect(() => {
    const handleConfigChange = () => {
      const config = obtenerConfiguracionHorasPorNivel(nivelProyecto || 'Básico');
      onCantidadTemasChange(config.cantidadTemas);
      onHorasClasePorTemaChange(config.horasPorTema);
      onTotalHorasCursoChange(config.totalHoras);
      onNivelChange?.(nivelProyecto || 'Básico', config);
    };

    window.addEventListener('summit_config_horas_nivel_cambio', handleConfigChange);
    return () => window.removeEventListener('summit_config_horas_nivel_cambio', handleConfigChange);
  }, [nivelProyecto, onCantidadTemasChange, onHorasClasePorTemaChange, onTotalHorasCursoChange, onNivelChange]);

  // Manejar cambio en temas o en horas por tema para sincronizar el total
  const handleTemasChange = (nuevoTemas: number) => {
    onCantidadTemasChange(nuevoTemas);
    const nuevoTotal = calcularTotalHorasCurso(nuevoTemas, horasClasePorTema);
    onTotalHorasCursoChange(nuevoTotal);
  };

  const handleHorasPorTemaChange = (nuevoHorasTema: number) => {
    onHorasClasePorTemaChange(nuevoHorasTema);
    const nuevoTotal = calcularTotalHorasCurso(cantidadTemas, nuevoHorasTema);
    onTotalHorasCursoChange(nuevoTotal);
  };

  // Sugerir metodología automática
  const aplicarSugerenciaMetodologia = () => {
    const sugerida = sugerirMetodologiaPorDefecto(tipoProyecto, nivelProyecto);
    onMetodologiaChange(sugerida);
    setSugerenciaAplicada(true);
    setTimeout(() => setSugerenciaAplicada(false), 3000);
  };

  // Procesar archivo PDF
  const procesarArchivoPDF = async (file: File) => {
    setErrorPdf(null);
    const validacion = validarArchivoPDF(file);
    if (!validacion.valido) {
      setErrorPdf(validacion.error || 'Solo se permiten archivos en formato PDF (.pdf)');
      return;
    }

    try {
      const dataUrl = await convertirArchivoADataUrl(file);
      const tamanoKb = Math.round(file.size / 1024);
      onPlanificacionPdfChange({
        nombreArchivo: file.name,
        dataUrl,
        tamanoKb,
        fechaCarga: new Date().toISOString(),
      });
    } catch (err) {
      setErrorPdf('Error al leer el archivo PDF. Intente nuevamente.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      procesarArchivoPDF(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      procesarArchivoPDF(e.dataTransfer.files[0]);
    }
  };

  const abrirVisualizadorPDF = () => {
    if (!planificacionPdf?.dataUrl) return;
    const win = window.open();
    if (win) {
      win.document.write(
        `<iframe src="${planificacionPdf.dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
      );
      win.document.title = `Planificación del Curso - ${planificacionPdf.nombreArchivo}`;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-blue-200/80 shadow-xs p-4 sm:p-5 space-y-5">
      {/* Encabezado de la Sección */}
      <div className="flex items-center justify-between border-b border-blue-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-2">
              Planificación Curricular, Horas por Tema & Metodología
            </h3>
            <p className="text-[11px] text-slate-500">
              Desglose temático, cálculo paramétrico de horas y carga de documento oficial en PDF.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!modoLectura && onDocenteSeleccionado && (
            <button
              type="button"
              onClick={() => setModalDocentesAbierto(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
              title="Abrir el Banco de Docentes para seleccionar instructor y transferir tarifa automáticamente a Costos Operativos"
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>👥 Banco de Docentes</span>
            </button>
          )}
          <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            Gerencia Académica
          </span>
        </div>
      </div>

      {/* Bloque 1: Nivel del Curso (Ubicado antes del Desglose y Total de Horas) */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-blue-600" />
            <label htmlFor="select-nivel-curricular" className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              1. Nivel Académico del Curso <span className="text-rose-500">*</span>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-slate-500 hidden sm:inline">
              Complejidad y perfil de ingreso
            </span>
            {!modoLectura && (
              <button
                type="button"
                onClick={() => setModalConfigAbierto(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-800 bg-blue-100/90 hover:bg-blue-200 border border-blue-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
                title="Configurar las horas y temas predeterminados por cada nivel académico"
              >
                <Settings className="w-3.5 h-3.5 text-blue-700" />
                <span>⚙️ Configurar Horas por Nivel</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          <div>
            <select
              id="select-nivel-curricular"
              disabled={modoLectura}
              value={nivelProyecto || 'Básico'}
              onChange={(e) => handleNivelSelect(e.target.value as NivelProyecto)}
              className={`w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold shadow-2xs cursor-pointer ${
                campoConError === 'select-nivel-curricular'
                  ? 'border-rose-500 bg-rose-50/70 ring-2 ring-rose-400 text-rose-950 font-bold'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              <option value="Básico">Básico (Auto: {obtenerConfiguracionHorasPorNivel('Básico').totalHoras} hrs clase)</option>
              <option value="Intermedio">Intermedio (Auto: {obtenerConfiguracionHorasPorNivel('Intermedio').totalHoras} hrs clase)</option>
              <option value="Avanzado">Avanzado (Auto: {obtenerConfiguracionHorasPorNivel('Avanzado').totalHoras} hrs clase)</option>
              <option value="Especializado">Especializado (Auto: {obtenerConfiguracionHorasPorNivel('Especializado').totalHoras} hrs clase)</option>
              <option value="Todos los niveles">Todos los niveles (Auto: {obtenerConfiguracionHorasPorNivel('Todos los niveles').totalHoras} hrs clase)</option>
            </select>
            {campoConError === 'select-nivel-curricular' && (
              <span className="text-[10px] text-rose-700 font-bold mt-1 block flex items-center gap-1">
                ⚠️ Seleccione el nivel curricular oficial del programa
              </span>
            )}
          </div>

          {/* Píldoras de Selección Rápida */}
          {!modoLectura && (
            <div className="flex flex-wrap items-center gap-1.5">
              {(['Básico', 'Intermedio', 'Avanzado', 'Especializado', 'Todos los niveles'] as NivelProyecto[]).map((nv) => {
                const configNv = obtenerConfiguracionHorasPorNivel(nv);
                const activo = (nivelProyecto || 'Básico') === nv;
                return (
                  <button
                    key={nv}
                    type="button"
                    onClick={() => handleNivelSelect(nv)}
                    className={`px-2.5 py-1 text-[11px] rounded-lg border font-medium transition-all cursor-pointer flex items-center gap-1 ${
                      activo
                        ? 'bg-blue-600 text-white border-blue-700 font-bold shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-300'
                    }`}
                  >
                    <span>{nv}</span>
                    <span className={`text-[10px] font-mono font-bold px-1 rounded ${activo ? 'bg-blue-800 text-blue-100' : 'bg-slate-100 text-slate-600'}`}>
                      {configNv.totalHoras}h
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Aviso de Automatización hacia Costos Operativos */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 bg-gradient-to-r from-blue-50/90 to-indigo-50/80 border border-blue-200 rounded-lg text-xs text-blue-950 font-medium shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
            <span>
              {nivelProyecto === 'Básico' || !nivelProyecto ? (
                <>
                  Norma institucional para nivel Básico: <strong>{cantidadTemas} temas × {horasClasePorTema} horas = {totalHorasCurso} horas totales</strong>
                </>
              ) : (
                <>
                  Configuración para nivel {nivelProyecto}: <strong>{cantidadTemas} temas × {horasClasePorTema} horas = {totalHorasCurso} horas totales</strong>
                </>
              )}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-md shrink-0">
            <span>⚡ Asignado automáticamente a Costos Operativos:</span>
            <span className="font-mono text-emerald-950 font-black">{totalHorasCurso} hrs</span>
          </div>
        </div>
      </div>

      {/* Bloque 2: Desglose y Total de Horas del Curso */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            2. Desglose y Total de Horas del Curso
          </span>
          <span className="text-[10px] font-semibold text-slate-500 font-mono">
            {cantidadTemas || 0} temas × {horasClasePorTema || 0} hrs = {totalHorasCurso || 0} hrs
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Campo A: Cantidad de Temas */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Cantidad de Temas / Módulos <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-cantidad-temas"
              type="number"
              min="1"
              max="50"
              disabled={modoLectura}
              value={cantidadTemas || ''}
              onChange={(e) => handleTemasChange(Math.max(1, Number(e.target.value) || 1))}
              placeholder="Ej: 4"
              className={`w-full px-3 py-1.5 text-xs border rounded-lg font-mono font-bold focus:ring-2 focus:ring-blue-500 ${
                campoConError === 'input-cantidad-temas'
                  ? 'border-rose-500 bg-rose-50/70 ring-2 ring-rose-400 text-rose-950'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
            {campoConError === 'input-cantidad-temas' ? (
              <span className="text-[10px] text-rose-700 font-bold mt-0.5 block">
                ⚠️ Mínimo 1 tema obligatorio
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Módulos o unidades a impartir
              </span>
            )}
          </div>

          {/* Campo B: Horas Clase por Tema */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Horas Clase por Tema <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-horas-por-tema"
              type="number"
              min="1"
              max="100"
              step="0.5"
              disabled={modoLectura}
              value={horasClasePorTema || ''}
              onChange={(e) => handleHorasPorTemaChange(Math.max(0.5, Number(e.target.value) || 1))}
              placeholder="Ej: 5"
              className={`w-full px-3 py-1.5 text-xs border rounded-lg font-mono font-bold focus:ring-2 focus:ring-blue-500 ${
                campoConError === 'input-horas-por-tema'
                  ? 'border-rose-500 bg-rose-50/70 ring-2 ring-rose-400 text-rose-950'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
            {campoConError === 'input-horas-por-tema' ? (
              <span className="text-[10px] text-rose-700 font-bold mt-0.5 block">
                ⚠️ Horas por tema requeridas (mínimo 1h)
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Duración promedio por cada tema
              </span>
            )}
          </div>

          {/* Campo C: Total Horas Cursos (Resultado Calculado) */}
          <div className={`p-2.5 rounded-lg border ${
            campoConError === 'input-total-horas-curso'
              ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-400'
              : 'bg-blue-50/90 border-blue-200'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-blue-950">
                Total Horas Curso <span className="text-rose-500">*</span>
              </label>
              <span className="text-[9px] font-black uppercase tracking-wider bg-blue-600 text-white px-1.5 py-0.2 rounded">
                ⚡ Automático
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="input-total-horas-curso"
                type="number"
                min="1"
                disabled={modoLectura}
                value={totalHorasCurso || ''}
                onChange={(e) => onTotalHorasCursoChange(Math.max(1, Number(e.target.value) || 1))}
                className={`w-full px-2.5 py-1 text-sm rounded-lg font-mono font-black focus:ring-2 focus:ring-blue-500 ${
                  campoConError === 'input-total-horas-curso'
                    ? 'bg-white border-2 border-rose-500 text-rose-950'
                    : 'bg-white border border-blue-300 text-blue-900'
                }`}
              />
              <span className="text-xs font-bold text-blue-900 font-mono">Horas</span>
            </div>
            <span className="text-[10px] text-blue-800 mt-1 block leading-tight">
              = ({cantidadTemas || 0} temas × {horasClasePorTema || 0} hrs/tema)
            </span>
            {campoConError === 'input-total-horas-curso' && (
              <span className="text-[10px] text-rose-700 font-bold mt-1 block">
                ⚠️ Total de horas no puede ser 0
              </span>
            )}
          </div>
        </div>

        {/* Atajos Rápidos de Carga Temática */}
        {!modoLectura && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] text-slate-600">
            <span className="font-semibold text-slate-500">Configuraciones sugeridas:</span>
            {[
              { temas: 4, hrs: 3, label: '4 temas × 3h (12h Cursos Básicos)', destacada: true },
              { temas: 4, hrs: 5, label: '4 temas × 5h (20h Especial)' },
              { temas: 6, hrs: 4, label: '6 temas × 4h (24h Intermedio)' },
              { temas: 8, hrs: 5, label: '8 temas × 5h (40h Diplomado)' },
              { temas: 2, hrs: 4, label: '2 temas × 4h (8h Taller)' },
            ].map((cfg, idx) => {
              const esActivo = cantidadTemas === cfg.temas && horasClasePorTema === cfg.hrs;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    handleTemasChange(cfg.temas);
                    handleHorasPorTemaChange(cfg.hrs);
                  }}
                  className={`px-2 py-0.5 border rounded font-mono transition-all cursor-pointer ${
                    esActivo
                      ? 'bg-blue-600 text-white border-blue-700 font-bold shadow-2xs'
                      : cfg.destacada && (nivelProyecto === 'Básico' || !nivelProyecto)
                      ? 'bg-blue-50 text-blue-800 border-blue-300 font-bold hover:bg-blue-100'
                      : 'bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-700 border-slate-200'
                  }`}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Matriz de Coherencia Curricular & Alertas Pedagógicas Preventivas */}
        <CurricularCoherenceAlerts
          nombreCurso={nombreProyecto || ''}
          nivel={nivelProyecto || 'Básico'}
          cantidadTemas={cantidadTemas}
          horasPorTema={horasClasePorTema}
          totalHoras={totalHorasCurso}
          proyectosExistentes={proyectosExistentes}
          proyectoIdActual={proyectoIdActual}
        />
      </div>

      {/* Bloque 3: Metodología a Implementar (con sugerencias por lógica) */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              3. Metodología a Implementar <span className="text-rose-500">*</span>
            </label>
          </div>

          {!modoLectura && (
            <button
              type="button"
              onClick={aplicarSugerenciaMetodologia}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>{sugerenciaAplicada ? '✓ Sugerencia Aplicada' : 'Sugerir Metodología por Lógica'}</span>
            </button>
          )}
        </div>

        <textarea
          id="input-metodologia"
          rows={2}
          disabled={modoLectura}
          value={metodologia}
          onChange={(e) => onMetodologiaChange(e.target.value)}
          placeholder="Describa la metodología pedagógica a implementar (ej. Aprendizaje Basado en Proyectos, Masterclass con análisis de casos reales, 80% Práctica y entregables modulares)..."
          className={`w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 leading-relaxed font-medium ${
            campoConError === 'input-metodologia'
              ? 'border-rose-500 bg-rose-50/70 ring-2 ring-rose-400 text-rose-950'
              : 'bg-white border-slate-300 text-slate-800'
          }`}
        />
        {campoConError === 'input-metodologia' && (
          <span className="text-[10px] text-rose-700 font-bold block">
            ⚠️ La metodología pedagógica es obligatoria para el diseño curricular
          </span>
        )}

        {/* Píldoras de Metodologías Sugeridas */}
        {!modoLectura && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-semibold text-slate-500 block">
              💡 Metodologías recomendadas para seleccionar con 1 clic:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {METODOLOGIAS_SUGERIDAS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onMetodologiaChange(item.nombre)}
                  className={`text-[10px] px-2.5 py-1 rounded-lg border text-left transition-all ${
                    metodologia === item.nombre
                      ? 'bg-blue-600 text-white border-blue-700 font-bold shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-300'
                  }`}
                  title={item.descripcion}
                >
                  <span>{item.nombre}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bloque 4: Carga de Documento de Planificación del Curso (Solo formato PDF) */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              4. Documento de Planificación del Curso
            </label>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            Solo Formato PDF (.pdf)
          </span>
        </div>

        {/* Mensaje de error de formato si aplica */}
        {errorPdf && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Error en el archivo</p>
              <p className="text-[11px]">{errorPdf}</p>
            </div>
          </div>
        )}

        {/* Estado si YA hay un PDF cargado */}
        {planificacionPdf?.dataUrl ? (
          <div className="bg-white p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <FileCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 bg-emerald-200 text-emerald-900 rounded">
                    PDF Cargado
                  </span>
                  {planificacionPdf.tamanoKb && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      {planificacionPdf.tamanoKb} KB
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-slate-900 truncate max-w-xs sm:max-w-md mt-0.5">
                  {planificacionPdf.nombreArchivo}
                </h4>
                {planificacionPdf.fechaCarga && (
                  <p className="text-[10px] text-slate-400">
                    Cargado: {new Date(planificacionPdf.fechaCarga).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={abrirVisualizadorPDF}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                title="Ver o descargar documento PDF"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ver PDF</span>
              </button>

              {!modoLectura && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors"
                  >
                    <span>Reemplazar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onPlanificacionPdfChange(undefined);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Eliminar PDF cargado"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Zona de Carga Drag & Drop para PDF */
          !modoLectura && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-blue-500 bg-blue-50/70 scale-[0.99]'
                  : 'border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50/60'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                Arrastre aquí el documento de <span className="text-blue-600">Planificación del Curso</span> o haga clic para buscar
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Formato requerido: <strong>Documento PDF (.pdf)</strong> • Tamaño máx: 25 MB
              </p>
            </div>
          )
        )}

        {/* Input file oculto con restricción estricta .pdf */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Modal de Configuración de Horas por Nivel */}
      <ConfiguracionHorasNivelModal
        isOpen={modalConfigAbierto}
        onClose={() => setModalConfigAbierto(false)}
        nivelActual={nivelProyecto || 'Básico'}
        onConfiguracionGuardada={(nuevasConfigs) => {
          const cfg = nuevasConfigs[nivelProyecto || 'Básico'];
          if (cfg) {
            onCantidadTemasChange(cfg.cantidadTemas);
            onHorasClasePorTemaChange(cfg.horasClasePorTema);
            onTotalHorasCursoChange(cfg.totalHoras);
            onNivelChange?.(nivelProyecto || 'Básico', {
              cantidadTemas: cfg.cantidadTemas,
              horasPorTema: cfg.horasClasePorTema,
              totalHoras: cfg.totalHoras
            });
          }
        }}
      />

      {/* Modal del Banco y Directorio de Docentes */}
      <DocenteDirectoryModal
        isOpen={modalDocentesAbierto}
        onClose={() => setModalDocentesAbierto(false)}
        onSeleccionarDocente={(docente) => {
          onDocenteSeleccionado?.(docente);
        }}
      />
    </div>
  );
};
