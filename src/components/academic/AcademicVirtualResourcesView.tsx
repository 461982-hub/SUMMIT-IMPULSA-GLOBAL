import React, { useState } from 'react';
import { 
  Video, 
  Laptop, 
  Link as LinkIcon, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  Copy, 
  Save, 
  Sparkles,
  FolderPlus,
  KeyRound,
  Eye
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { generarRecursosDidacticosPorDefecto } from '../../utils/curricularUtils';

interface AcademicVirtualResourcesViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto: (p: ProyectoEducativo) => void;
}

export const AcademicVirtualResourcesView: React.FC<AcademicVirtualResourcesViewProps> = ({
  proyectos,
  onGuardarProyecto,
}) => {
  const [proyectoSeleccionadoId, setProyectoSeleccionadoId] = useState<number>(
    proyectos.length > 0 ? proyectos[0].id : 0
  );

  const proyectoActual = proyectos.find((p) => p.id === proyectoSeleccionadoId) || proyectos[0];

  // Estado local para los datos del entorno virtual
  const [aulaVirtual, setAulaVirtual] = useState({
    enlaceAulaVirtual: proyectoActual?.enlaceAulaVirtual || '',
    idReunionVirtual: proyectoActual?.idReunionVirtual || '',
    codigoAccesoVirtual: proyectoActual?.codigoAccesoVirtual || '',
    plataformaLMS: proyectoActual?.plataformaLMS || 'Zoom Pro Sincrónico',
  });

  const [recursos, setRecursos] = useState(() => {
    return proyectoActual?.recursosDidacticos || generarRecursosDidacticosPorDefecto(proyectoActual?.nombreProyecto || 'Curso');
  });

  // Modal para agregar nuevo recurso
  const [nuevoRecursoModal, setNuevoRecursoModal] = useState(false);
  const [nuevoRecurso, setNuevoRecurso] = useState<{
    tipo: 'Presentación PPT/PDF' | 'Grabación de Clase' | 'Plantilla / Código' | 'Guía de Laboratorio' | 'Caso de Estudio';
    titulo: string;
    urlOArchivo: string;
    estado: 'Disponible' | 'Pendiente';
  }>({
    tipo: 'Presentación PPT/PDF',
    titulo: '',
    urlOArchivo: '',
    estado: 'Disponible',
  });

  const [copiado, setCopiado] = useState(false);
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  const handleSeleccionarProyecto = (p: ProyectoEducativo) => {
    setProyectoSeleccionadoId(p.id);
    setAulaVirtual({
      enlaceAulaVirtual: p.enlaceAulaVirtual || '',
      idReunionVirtual: p.idReunionVirtual || '',
      codigoAccesoVirtual: p.codigoAccesoVirtual || '',
      plataformaLMS: p.plataformaLMS || 'Zoom Pro Sincrónico',
    });
    setRecursos(p.recursosDidacticos || generarRecursosDidacticosPorDefecto(p.nombreProyecto));
    setGuardadoExitoso(false);
  };

  const handleGuardarCambios = () => {
    if (!proyectoActual) return;
    const proyectoActualizado: ProyectoEducativo = {
      ...proyectoActual,
      enlaceAulaVirtual: aulaVirtual.enlaceAulaVirtual,
      idReunionVirtual: aulaVirtual.idReunionVirtual,
      codigoAccesoVirtual: aulaVirtual.codigoAccesoVirtual,
      plataformaLMS: aulaVirtual.plataformaLMS,
      recursosDidacticos: recursos,
    };
    onGuardarProyecto(proyectoActualizado);
    setGuardadoExitoso(true);
    setTimeout(() => setGuardadoExitoso(false), 3000);
  };

  const handleAgregarRecurso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoRecurso.titulo.trim()) return;

    const item = {
      id: `rec-${Date.now()}`,
      tipo: nuevoRecurso.tipo,
      titulo: nuevoRecurso.titulo.trim(),
      urlOArchivo: nuevoRecurso.urlOArchivo.trim(),
      estado: nuevoRecurso.estado,
      fecha: new Date().toISOString().split('T')[0],
    };

    setRecursos((prev) => [...prev, item]);
    setNuevoRecurso({
      tipo: 'Presentación PPT/PDF',
      titulo: '',
      urlOArchivo: '',
      estado: 'Disponible',
    });
    setNuevoRecursoModal(false);
  };

  const handleEliminarRecurso = (id: string) => {
    setRecursos((prev) => prev.filter((r) => r.id !== id));
  };

  const handleToggleEstado = (id: string) => {
    setRecursos((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, estado: r.estado === 'Disponible' ? 'Pendiente' : 'Disponible' }
          : r
      )
    );
  };

  const handleCopiarAcceso = () => {
    const texto = `🎓 ACCESO AL AULA VIRTUAL - SUMMIT
Programa: ${proyectoActual?.nombreProyecto}
Docente: ${proyectoActual?.nombreDocente}
Plataforma: ${aulaVirtual.plataformaLMS}
Enlace: ${aulaVirtual.enlaceAulaVirtual || 'https://zoom.us/j/summit-clase'}
ID de Reunión: ${aulaVirtual.idReunionVirtual || 'SUMMIT-LIVE-01'}
Código / Clave: ${aulaVirtual.codigoAccesoVirtual || 'SUMMIT2026'}`;

    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const renderIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'Presentación PPT/PDF':
        return <FileText className="w-4 h-4 text-purple-600" />;
      case 'Grabación de Clase':
        return <Video className="w-4 h-4 text-rose-600" />;
      case 'Plantilla / Código':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
      case 'Guía de Laboratorio':
        return <Laptop className="w-4 h-4 text-blue-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md border border-blue-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Laptop className="w-5 h-5 text-blue-300" />
            <h3 className="font-black text-base text-white tracking-wide">
              Entorno Virtual, LMS & Recursos Didácticos
            </h3>
            <span className="bg-blue-500/30 text-blue-200 border border-blue-400/40 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
              Aula & Entregables
            </span>
          </div>
          <p className="text-xs text-blue-200/90 max-w-2xl leading-relaxed">
            Centralice los enlaces a salas sincrónicas (Zoom, Teams, Google Meet, Moodle), credenciales de acceso y checklist de materiales pedagógicos descargables para estudiantes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopiarAcceso}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-blue-200 hover:text-white rounded-lg text-xs font-bold border border-white/20 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiado ? '¡Copiado al Portapapeles!' : 'Copiar Datos de Acceso'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Selector de Cursos */}
        <div className="lg:col-span-4 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Seleccionar Programa ({proyectos.length})
            </span>
          </div>
          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {proyectos.map((p) => {
              const isSelected = p.id === proyectoActual?.id;
              const tieneEnlace = !!p.enlaceAulaVirtual;
              const totalRec = p.recursosDidacticos?.length || 4;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSeleccionarProyecto(p)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-blue-50/90 border-blue-400 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold text-blue-900 bg-blue-100/80 px-1.5 py-0.5 rounded">
                      {p.codigoPrograma || `ACAD-${p.id}`}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      tieneEnlace 
                        ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' 
                        : 'text-slate-600 bg-slate-100 border border-slate-200'
                    }`}>
                      {totalRec} recursos
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1.5 line-clamp-1">
                    {p.nombreProyecto}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                    <span className="truncate">{p.modalidad || 'Virtual Sincrónica'}</span>
                    <span className="font-mono">{p.plataformaLMS || 'Zoom Pro'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel de Configuración de Aula Virtual & Recursos */}
        {proyectoActual && (
          <div className="lg:col-span-8 space-y-4">
            {/* Tarjeta de Acceso y Enlace al Aula */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                    {proyectoActual.codigoPrograma || `ACAD-${proyectoActual.id}`}
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 mt-1">
                    {proyectoActual.nombreProyecto}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGuardarCambios}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar Cambios</span>
                  </button>
                </div>
              </div>

              {guardadoExitoso && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Datos de acceso y recursos didácticos actualizados con éxito.</span>
                </div>
              )}

              {/* Formulario de Configuración del Aula */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                    Enlace a Sala Sincrónica / Aula Virtual (Zoom, Teams, Meet, Moodle)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://zoom.us/j/123456789 o https://meet.google.com/..."
                      value={aulaVirtual.enlaceAulaVirtual}
                      onChange={(e) => setAulaVirtual({ ...aulaVirtual, enlaceAulaVirtual: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500"
                    />
                    {aulaVirtual.enlaceAulaVirtual && (
                      <a
                        href={aulaVirtual.enlaceAulaVirtual}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir</span>
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Plataforma LMS / Herramienta
                  </label>
                  <select
                    value={aulaVirtual.plataformaLMS}
                    onChange={(e) => setAulaVirtual({ ...aulaVirtual, plataformaLMS: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="Zoom Pro Sincrónico">Zoom Pro Sincrónico</option>
                    <option value="Microsoft Teams Educativo">Microsoft Teams Educativo</option>
                    <option value="Google Meet & Classroom">Google Meet & Classroom</option>
                    <option value="Moodle LMS Institucional">Moodle LMS Institucional</option>
                    <option value="Campus Presencial SUMMIT">Campus Presencial SUMMIT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                    ID de Reunión / Código de Sala
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 845 9921 4452"
                    value={aulaVirtual.idReunionVirtual}
                    onChange={(e) => setAulaVirtual({ ...aulaVirtual, idReunionVirtual: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                    Código o Contraseña de Acceso
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. SUMMIT2026"
                    value={aulaVirtual.codigoAccesoVirtual}
                    onChange={(e) => setAulaVirtual({ ...aulaVirtual, codigoAccesoVirtual: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleCopiarAcceso}
                    className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Credenciales para WhatsApp / Email</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Checklist y Repositorio de Recursos Didácticos */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    Materiales & Recursos Didácticos del Programa ({recursos.length})
                  </h4>
                  <span className="text-[10px] text-slate-500">
                    Presentaciones, guías de práctica, archivos de trabajo y grabaciones sincrónicas.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setNuevoRecursoModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 rounded-xl transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Material</span>
                </button>
              </div>

              {/* Lista de Recursos */}
              <div className="space-y-2">
                {recursos.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                        {renderIconoTipo(rec.tipo)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            {rec.tipo}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleEstado(rec.id)}
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border transition-colors ${
                              rec.estado === 'Disponible'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            {rec.estado === 'Disponible' ? '✓ Disponible' : '⏳ Pendiente de Carga'}
                          </button>
                        </div>
                        <h5 className="text-xs font-bold text-slate-900 truncate">
                          {rec.titulo}
                        </h5>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {rec.urlOArchivo && (
                        <a
                          href={rec.urlOArchivo}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-white text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors"
                          title="Abrir enlace de recurso"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleEliminarRecurso(rec.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar recurso"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal para Agregar Nuevo Recurso */}
      {nuevoRecursoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <FolderPlus className="w-4 h-4 text-emerald-400" />
                Agregar Recurso Didáctico
              </h4>
              <button
                type="button"
                onClick={() => setNuevoRecursoModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAgregarRecurso} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de Material
                </label>
                <select
                  value={nuevoRecurso.tipo}
                  onChange={(e) => setNuevoRecurso({ ...nuevoRecurso, tipo: e.target.value as any })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-semibold"
                >
                  <option value="Presentación PPT/PDF">Presentación PPT/PDF</option>
                  <option value="Plantilla / Código">Plantilla / Código / Excel</option>
                  <option value="Guía de Laboratorio">Guía de Laboratorio</option>
                  <option value="Grabación de Clase">Grabación de Clase</option>
                  <option value="Caso de Estudio">Caso de Estudio</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título / Descripción del Material <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Guía Práctica de Modelado Financiero - Sesión 2"
                  value={nuevoRecurso.titulo}
                  onChange={(e) => setNuevoRecurso({ ...nuevoRecurso, titulo: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enlace Web / Carpeta en la Nube (Google Drive, Dropbox, OneDrive)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={nuevoRecurso.urlOArchivo}
                  onChange={(e) => setNuevoRecurso({ ...nuevoRecurso, urlOArchivo: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estado de Disponibilidad
                </label>
                <select
                  value={nuevoRecurso.estado}
                  onChange={(e) => setNuevoRecurso({ ...nuevoRecurso, estado: e.target.value as any })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-semibold"
                >
                  <option value="Disponible">Disponible para Descarga Inmediata</option>
                  <option value="Pendiente">Pendiente de Elaboración / Carga</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNuevoRecursoModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Agregar a la Lista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
