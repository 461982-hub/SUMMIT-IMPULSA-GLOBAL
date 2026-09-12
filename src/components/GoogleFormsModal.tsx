import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileCheck, 
  Copy, 
  Check, 
  ExternalLink, 
  Plus, 
  Sparkles, 
  RefreshCw, 
  Users, 
  GraduationCap, 
  Building2, 
  ShieldCheck, 
  BarChart3, 
  Trash2,
  FolderDown,
  Mail
} from 'lucide-react';
import { SummitLogo } from './SummitLogo';
import { ProyectoEducativo, Moneda } from '../types';
import { 
  TipoFormularioGoogle, 
  FormularioGoogleInfo, 
  crearFormularioGoogle, 
  consultarRespuestasGoogleForm, 
  obtenerFormulariosGuardados, 
  eliminarFormularioGuardado 
} from '../services/googleFormsService';
import { TARGET_DRIVE_FOLDER_URL, getDriveAccessToken, signInWithGoogleDrive } from '../services/googleDriveService';

interface GoogleFormsModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyecto?: ProyectoEducativo;
  proyectos?: ProyectoEducativo[];
  moneda?: Moneda;
  onNotificar?: (mensaje: string) => void;
}

export const GoogleFormsModal: React.FC<GoogleFormsModalProps> = ({
  isOpen,
  onClose,
  proyecto,
  proyectos = [],
  moneda = 'LPS',
  onNotificar,
}) => {
  const [formularios, setFormularios] = useState<FormularioGoogleInfo[]>([]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoFormularioGoogle>('evaluacion_docente');
  const [proyectoSeleccionadoId, setProyectoSeleccionadoId] = useState<string>(proyecto?.id || (proyectos[0]?.id || ''));
  const [creando, setCreando] = useState<boolean>(false);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [consultandoId, setConsultandoId] = useState<string | null>(null);
  const [respuestasDetalle, setRespuestasDetalle] = useState<{ formId: string; total: number } | null>(null);
  const [ultimoCreado, setUltimoCreado] = useState<FormularioGoogleInfo | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormularios(obtenerFormulariosGuardados());
      if (proyecto?.id) {
        setProyectoSeleccionadoId(proyecto.id);
      }
    }
  }, [isOpen, proyecto]);

  const proyectoActual = proyectos.find(p => p.id === proyectoSeleccionadoId) || proyecto;

  const handleCrearFormulario = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCreando(true);

    try {
      const nuevoForm = await crearFormularioGoogle(
        tipoSeleccionado,
        proyectoActual
      );
      
      setFormularios(obtenerFormulariosGuardados());
      setUltimoCreado(nuevoForm);
      onNotificar?.(`📝 Formulario oficial creado en Google Forms: "${nuevoForm.titulo}"`);
    } catch (err: any) {
      console.error('Error al crear Google Form:', err);
      onNotificar?.('⚠️ Error al crear formulario en Google Forms: ' + (err.message || 'Error'));
    } finally {
      setCreando(false);
    }
  };

  const handleConsultarRespuestas = async (form: FormularioGoogleInfo) => {
    setConsultandoId(form.formId);
    try {
      const res = await consultarRespuestasGoogleForm(form.formId);
      setRespuestasDetalle({ formId: form.formId, total: res.total });
      onNotificar?.(`📊 Google Forms: Se encontraron ${res.total} respuestas para "${form.titulo}"`);
    } catch (e) {
      console.error(e);
    } finally {
      setConsultandoId(null);
    }
  };

  const copiarEnlace = (enlace: string, id: string) => {
    navigator.clipboard.writeText(enlace);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2500);
    onNotificar?.('📋 Enlace público para responder copiado al portapapeles');
  };

  const handleEliminar = (formId: string) => {
    const act = eliminarFormularioGuardado(formId);
    setFormularios(act);
    if (ultimoCreado?.formId === formId) {
      setUltimoCreado(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      id="modal-google-forms-center"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Cabecera Modal */}
        <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 p-4 sm:p-5 text-white flex items-center justify-between border-b border-purple-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 p-2 flex items-center justify-center text-white shadow-md shrink-0">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 bg-purple-500/30 text-purple-200 border border-purple-400/30 rounded">
                  GOOGLE FORMS API v1
                </span>
                <span className="text-[11px] text-purple-300 font-semibold">
                  Summit Impulsa Global
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-0.5">
                Centro de Formularios & Encuestas Google Forms
              </h3>
            </div>
          </div>

          <button
            id="btn-cerrar-google-forms-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-banner explicativo */}
        <div className="bg-purple-50 border-b border-purple-200 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0 text-purple-900 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Genere encuestas de evaluación docente y formularios de pre-matrícula directamente en <strong>Google Forms</strong> con auto-guardado en Google Drive.</span>
          </div>
          <a
            href={TARGET_DRIVE_FOLDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1 font-bold text-purple-700 hover:text-purple-900 underline shrink-0"
          >
            <FolderDown className="w-3.5 h-3.5" />
            <span>Carpeta Drive</span>
          </a>
        </div>

        {/* Contenido Principal */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Formulario de Generación */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
              <Plus className="w-4 h-4 text-purple-600" />
              <span>Crear Nuevo Formulario en Google Forms</span>
            </h4>

            <form onSubmit={handleCrearFormulario} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Tipo de Formulario */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipo de Formulario / Plantilla Institucional
                  </label>
                  <select
                    id="select-tipo-formulario-google"
                    value={tipoSeleccionado}
                    onChange={(e) => setTipoSeleccionado(e.target.value as TipoFormularioGoogle)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="evaluacion_docente">
                      🎓 Encuesta de Satisfacción Estudiantil & Evaluación Docente
                    </option>
                    <option value="inscripcion_estudiantes">
                      📋 Formulario de Pre-Matrícula e Inscripción de Estudiantes
                    </option>
                    <option value="diagnostico_empresarial">
                      🏢 Diagnóstico de Capacitación Corporativa In-Company (B2B)
                    </option>
                    <option value="auditoria_calidad">
                      🛡️ Auditoría de Calidad y Cumplimiento Curricular
                    </option>
                  </select>
                </div>

                {/* Proyecto Educativo Vinculado */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vincular a Proyecto Educativo
                  </label>
                  <select
                    id="select-proyecto-formulario-google"
                    value={proyectoSeleccionadoId}
                    onChange={(e) => setProyectoSeleccionadoId(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    {proyectos.map((p) => (
                      <option key={p.id} value={p.id}>
                        #{String(p.numeroCorrelativo || p.id).padStart(3, '0')} - {p.nombreProyecto} ({p.docenteAsignado || 'Docente'})
                      </option>
                    ))}
                  </select>
                  {proyectoActual && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      Docente: <strong>{proyectoActual.docenteAsignado}</strong> | Horas: <strong>{proyectoActual.horasClase}h</strong>
                    </p>
                  )}
                </div>

              </div>

              {/* Botón Crear */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  id="btn-generar-google-form-api"
                  type="submit"
                  disabled={creando}
                  className="px-4 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>{creando ? 'Creando en Google Forms API...' : 'Crear Formulario en Google Forms'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Banner de Formulario Recién Creado */}
          {ultimoCreado && (
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-4 rounded-2xl border border-purple-400/40 shadow-lg animate-in zoom-in-95">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-purple-400 text-purple-950 rounded font-mono">
                    ✓ FORMULARIO GENERADO
                  </span>
                  <h4 className="text-sm font-black text-white mt-1">
                    {ultimoCreado.titulo}
                  </h4>
                  <p className="text-xs text-purple-200 mt-0.5 line-clamp-1">
                    {ultimoCreado.descripcion}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copiarEnlace(ultimoCreado.responderUri, ultimoCreado.formId)}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 border border-white/20 cursor-pointer"
                  >
                    {copiadoId === ultimoCreado.formId ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiadoId === ultimoCreado.formId ? '¡Copiado!' : 'Copiar Link Alumnos'}</span>
                  </button>

                  <a
                    href={ultimoCreado.responderUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-purple-400 hover:bg-purple-300 text-purple-950 text-xs font-black rounded-lg transition-colors flex items-center gap-1.5 shadow-md"
                  >
                    <span>Ver Formulario</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <a
                    href={ultimoCreado.editUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <span>Editar en Google</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Listado de Formularios Creados */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-600" />
                <span>Formularios Activos de Summit Impulsa ({formularios.length})</span>
              </h4>
              <span className="text-xs text-slate-500">
                Almacenados en Google Drive
              </span>
            </div>

            {formularios.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs">
                No hay formularios creados todavía. Utilice el botón superior para crear una encuesta de evaluación docente o un formulario de pre-matrícula.
              </div>
            ) : (
              <div className="space-y-2.5">
                {formularios.map((form) => (
                  <div 
                    key={form.formId}
                    className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-purple-50 text-purple-800 border-purple-200 uppercase">
                          {form.tipo.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {form.titulo}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>Creado: {new Date(form.creadoEn).toLocaleDateString()}</span>
                        {form.proyectoNombre && (
                          <span className="text-purple-700 font-semibold truncate">
                            Proyecto: {form.proyectoNombre}
                          </span>
                        )}
                        {respuestasDetalle?.formId === form.formId && (
                          <span className="text-emerald-600 font-bold">
                            ✓ {respuestasDetalle.total} respuestas recibidas
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handleConsultarRespuestas(form)}
                        disabled={consultandoId === form.formId}
                        className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border border-purple-200 cursor-pointer disabled:opacity-50"
                        title="Consultar respuestas con Google Forms API"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-purple-600 ${consultandoId === form.formId ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Respuestas</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => copiarEnlace(form.responderUri, form.formId)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Copiar link para enviar a estudiantes"
                      >
                        {copiadoId === form.formId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{copiadoId === form.formId ? 'Copiado' : 'Link Alumnos'}</span>
                      </button>

                      <a
                        href={form.responderUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border border-indigo-200"
                        title="Abrir formulario en Google"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Abrir</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleEliminar(form.formId)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Eliminar registro de la lista local"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Formularios sincronizados con Google Workspace & Google Drive</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
