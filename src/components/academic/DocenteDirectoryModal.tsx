import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  Check, 
  Star, 
  Mail, 
  Phone, 
  DollarSign, 
  ShieldCheck, 
  BookOpen, 
  Award,
  Save,
  AlertTriangle,
  RotateCcw,
  FileText,
  Upload,
  Download,
  Eye,
  Sparkles,
  Paperclip
} from 'lucide-react';
import { 
  DocenteBanco, 
  obtenerBancoDocentes, 
  guardarDocenteEnBanco, 
  eliminarDocenteDelBanco,
  restablecerDocentesPorDefecto
} from '../../utils/docenteDirectoryUtils';
import { 
  descargarDocenteCvPdf, 
  leerArchivoPdfComoDataUrl 
} from '../../utils/docenteCvPdfUtils';
import { DocenteCvPdfModal } from './DocenteCvPdfModal';
import { Moneda } from '../../types';
import { formatearMoneda } from '../../utils/calculations';

interface DocenteDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSeleccionarDocente?: (docente: DocenteBanco) => void;
  moneda?: Moneda;
  abrirEnCreacion?: boolean;
}

export const DocenteDirectoryModal: React.FC<DocenteDirectoryModalProps> = ({
  isOpen,
  onClose,
  onSeleccionarDocente,
  moneda = 'LPS',
  abrirEnCreacion = false,
}) => {
  const [docentes, setDocentes] = useState<DocenteBanco[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [docenteEditando, setDocenteEditando] = useState<Partial<DocenteBanco> | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);
  const [docenteAEliminar, setDocenteAEliminar] = useState<DocenteBanco | null>(null);
  const [mensajeEliminado, setMensajeEliminado] = useState<string | null>(null);
  const [docenteParaVerCv, setDocenteParaVerCv] = useState<DocenteBanco | null>(null);
  const [errorSubidaPdf, setErrorSubidaPdf] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDocentes(obtenerBancoDocentes());
      if (abrirEnCreacion) {
        setMostrarFormulario(true);
        setDocenteEditando({
          titulo: 'Licenciatura',
          tarifaHoraSugerida: 200,
          estadoSAR: 'Al Día',
          especialidad: '',
          email: '',
          telefono: '',
          nombre: ''
        });
      } else {
        setMostrarFormulario(false);
        setDocenteEditando(null);
      }
    }
  }, [isOpen, abrirEnCreacion]);

  const refrescar = () => {
    setDocentes(obtenerBancoDocentes());
  };

  if (!isOpen) return null;

  const filtrados = docentes.filter((d) => {
    const term = busqueda.toLowerCase();
    return (
      d.nombre.toLowerCase().includes(term) ||
      d.especialidad.toLowerCase().includes(term) ||
      (d.email && d.email.toLowerCase().includes(term))
    );
  });

  const handleGuardarDocente = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docenteEditando || !docenteEditando.nombre?.trim()) return;

    const guardado = guardarDocenteEnBanco(docenteEditando);
    refrescar();
    setDocenteEditando(null);
    setMostrarFormulario(false);
    setGuardadoExitoso(true);

    if (onSeleccionarDocente && guardado) {
      onSeleccionarDocente(guardado);
      setTimeout(() => {
        onClose();
      }, 300);
      return;
    }

    setTimeout(() => setGuardadoExitoso(false), 2500);
  };

  const handleIniciarEliminar = (docente: DocenteBanco) => {
    setDocenteAEliminar(docente);
  };

  const handleConfirmarEliminar = () => {
    if (!docenteAEliminar) return;
    const nombre = docenteAEliminar.nombre;
    eliminarDocenteDelBanco(docenteAEliminar.id);
    refrescar();
    if (docenteEditando?.id === docenteAEliminar.id) {
      setDocenteEditando(null);
      setMostrarFormulario(false);
    }
    setDocenteAEliminar(null);
    setMensajeEliminado(`El docente "${nombre}" ha sido eliminado exitosamente del Directorio.`);
    setTimeout(() => setMensajeEliminado(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] relative">
        
        {/* Cabecera */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <Users className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 bg-blue-500/30 text-blue-200 rounded border border-blue-400/30">
                  Gerencia Académica
                </span>
                <span className="text-xs text-blue-300 font-medium">
                  {docentes.length} Docentes Registrados
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Directorio y Banco de Docentes Institucionales
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!mostrarFormulario && (
              <button
                type="button"
                onClick={() => {
                  setDocenteEditando({
                    nombre: '',
                    titulo: '',
                    especialidad: '',
                    email: '',
                    telefono: '',
                    tarifaHoraSugerida: 200,
                    calificacionNPS: 4.8,
                    biografia: '',
                    estadoSAR: 'Al Día',
                  });
                  setMostrarFormulario(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Registrar Docente</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mensaje de confirmación de guardado */}
        {guardadoExitoso && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Docente guardado y actualizado con éxito en el Banco de Docentes.</span>
          </div>
        )}

        {/* Mensaje de confirmación de eliminación */}
        {mensajeEliminado && (
          <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 text-xs font-bold text-rose-800 flex items-center gap-2 animate-in fade-in duration-150">
            <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{mensajeEliminado}</span>
          </div>
        )}

        {/* Barra de búsqueda y filtros */}
        {!mostrarFormulario && (
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar docente por nombre, especialidad o correo..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
              />
            </div>
            <div className="text-[11px] text-slate-500 shrink-0 font-medium flex items-center gap-3">
              <span>
                Mostrando <strong>{filtrados.length}</strong> de {docentes.length} profesionales
              </span>
              {docentes.length < 5 && (
                <button
                  type="button"
                  onClick={() => {
                    restablecerDocentesPorDefecto();
                    refrescar();
                    setMensajeEliminado('Docentes base restablecidos.');
                    setTimeout(() => setMensajeEliminado(null), 2000);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 underline font-semibold cursor-pointer"
                  title="Restablecer docentes institucionales iniciales"
                >
                  Restablecer Base
                </button>
              )}
            </div>
          </div>
        )}

        {/* Contenedor principal scrollable */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          
          {/* Formulario para Crear / Editar */}
          {mostrarFormulario && docenteEditando ? (
            <form onSubmit={handleGuardarDocente} className="bg-slate-50 p-5 rounded-2xl border border-slate-300 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-blue-600" />
                  {docenteEditando.id ? 'Editar Perfil del Docente' : 'Registrar Nuevo Docente en el Directorio'}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarFormulario(false);
                    setDocenteEditando(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={docenteEditando.nombre || ''}
                    onChange={(e) => setDocenteEditando({ ...docenteEditando, nombre: e.target.value })}
                    placeholder="Ej. Ing. Juan Manuel Soto"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Grado Académico / Título</label>
                  <input
                    type="text"
                    value={docenteEditando.titulo || ''}
                    onChange={(e) => setDocenteEditando({ ...docenteEditando, titulo: e.target.value })}
                    placeholder="Ej. Master en Finanzas / Lic. en Contaduría"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Especialidad Principal *</label>
                  <input
                    type="text"
                    required
                    value={docenteEditando.especialidad || ''}
                    onChange={(e) => setDocenteEditando({ ...docenteEditando, especialidad: e.target.value })}
                    placeholder="Ej. Tributación, Finanzas, Scrum, Marketing"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tarifa Sugerida por Hora (LPS) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">L.</span>
                    <input
                      type="number"
                      required
                      min="50"
                      step="10"
                      value={docenteEditando.tarifaHoraSugerida || 200}
                      onChange={(e) => setDocenteEditando({ ...docenteEditando, tarifaHoraSugerida: Number(e.target.value) })}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">Se asignará automáticamente a Costos Operativos al seleccionarlo.</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={docenteEditando.email || ''}
                    onChange={(e) => setDocenteEditando({ ...docenteEditando, email: e.target.value })}
                    placeholder="docente@ejemplo.com"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={docenteEditando.telefono || ''}
                    onChange={(e) => setDocenteEditando({ ...docenteEditando, telefono: e.target.value })}
                    placeholder="+504 9999-9999"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Resumen Profesional / Biografía</label>
                  <textarea
                    rows={2}
                    value={docenteEditando.biografia || ''}
                    onChange={(e) => setDocenteEditando({ ...docenteEditando, biografia: e.target.value })}
                    placeholder="Trayectoria laboral, experiencia docente y certificaciones relevantes..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* SECCIÓN: CURRICULUM VITAE (CV) DEL DOCENTE EN FORMATO PDF */}
                <div className="sm:col-span-2 bg-white rounded-xl border border-blue-200/80 p-4 shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="font-black text-slate-900 text-xs">
                          Curriculum Vitae (CV) del Docente en Formato PDF
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          Formato PDF
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Adjunte el CV en PDF del facilitador o visualice / descargue la Hoja de Vida institucional oficial de Summit Impulsa Global.
                      </p>
                    </div>

                    {/* Estado del Archivo PDF */}
                    <div className="shrink-0 flex items-center gap-1.5">
                      {docenteEditando.cvPdfNombre ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>PDF Adjunto ({docenteEditando.cvPdfTamano || 'Válido'})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-medium">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Formato Institucional Disponible</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {errorSubidaPdf && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between">
                      <span>{errorSubidaPdf}</span>
                      <button 
                        type="button" 
                        onClick={() => setErrorSubidaPdf(null)}
                        className="text-rose-500 hover:text-rose-800"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {/* Detalle del PDF cargado o zona de carga y generación */}
                  {docenteEditando.cvPdfNombre ? (
                    <div className="p-3 bg-gradient-to-r from-blue-50/80 to-slate-50 rounded-xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-blue-600 border border-blue-700 flex items-center justify-center text-white shrink-0 font-black text-xs shadow-xs">
                          PDF
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 text-xs truncate max-w-xs sm:max-w-md">
                              {docenteEditando.cvPdfNombre}
                            </p>
                            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-300">
                              ✓ En Planilla
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Tamaño: {docenteEditando.cvPdfTamano || 'Documento PDF'} • Fecha:{' '}
                            {docenteEditando.cvPdfFechaSubida || 'Hoy'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          id="btn-ver-cv-pdf-formulario"
                          onClick={() => setDocenteParaVerCv(docenteEditando as DocenteBanco)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                          title="Visualizar el CV con la Planilla Oficial de la Empresa"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver CVPDF</span>
                        </button>

                        <button
                          type="button"
                          id="btn-descargar-cv-pdf-formulario"
                          onClick={() => {
                            if (docenteEditando.cvPdfDataUrl) {
                              const link = document.createElement('a');
                              link.href = docenteEditando.cvPdfDataUrl;
                              link.download = docenteEditando.cvPdfNombre || 'CV_Docente.pdf';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            } else {
                              descargarDocenteCvPdf(docenteEditando as DocenteBanco);
                            }
                          }}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-300"
                          title="Descargar archivo PDF del CV"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Descargar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDocenteEditando({
                              ...docenteEditando,
                              cvPdfDataUrl: undefined,
                              cvPdfNombre: undefined,
                              cvPdfTamano: undefined,
                              cvPdfFechaSubida: undefined,
                            });
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                          title="Quitar archivo adjunto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Opción 1: Subir Archivo PDF Propio */}
                      <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-3.5 flex items-center gap-3 cursor-pointer bg-slate-50 hover:bg-blue-50/40 transition-colors group">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 group-hover:bg-blue-200 text-blue-700 flex items-center justify-center shrink-0 transition-colors">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-slate-800 block group-hover:text-blue-700">
                            Cargar Archivo CV (.PDF)
                          </span>
                          <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                            Haga clic o arrastre el documento PDF del docente
                          </span>
                        </div>
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                setErrorSubidaPdf(null);
                                const resultado = await leerArchivoPdfComoDataUrl(file);
                                setDocenteEditando({
                                  ...docenteEditando,
                                  cvPdfDataUrl: resultado.dataUrl,
                                  cvPdfNombre: resultado.nombre,
                                  cvPdfTamano: resultado.tamano,
                                  cvPdfFechaSubida: new Date().toLocaleDateString('es-HN'),
                                });
                              } catch (err: any) {
                                setErrorSubidaPdf(err.message || 'Error al procesar el archivo PDF');
                              }
                            }
                          }}
                        />
                      </label>

                      {/* Opción 2: Formato Institucional Oficial Summit Impulsa */}
                      <div className="border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-2 bg-slate-50">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-slate-800 block">
                              CV Institucional Summit
                            </span>
                            <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                              Membretado con sello de Gerencia Académica
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const docTemporal: DocenteBanco = {
                                id: docenteEditando.id || 'doc-preview',
                                nombre: docenteEditando.nombre || 'Nombre del Docente',
                                titulo: docenteEditando.titulo || 'Especialista',
                                especialidad: docenteEditando.especialidad || 'Especialidad',
                                tarifaHoraSugerida: docenteEditando.tarifaHoraSugerida || 200,
                                calificacionNPS: docenteEditando.calificacionNPS || 5.0,
                                email: docenteEditando.email || '',
                                telefono: docenteEditando.telefono || '',
                                biografia: docenteEditando.biografia || '',
                                estadoSAR: docenteEditando.estadoSAR || 'Al Día',
                              };
                              setDocenteParaVerCv(docTemporal);
                            }}
                            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                            title="Previsualizar el CV institucional en PDF"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver PDF</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const docTemporal: DocenteBanco = {
                                id: docenteEditando.id || 'doc-temp',
                                nombre: docenteEditando.nombre || 'Nombre del Docente',
                                titulo: docenteEditando.titulo || 'Especialista',
                                especialidad: docenteEditando.especialidad || 'Especialidad',
                                tarifaHoraSugerida: docenteEditando.tarifaHoraSugerida || 200,
                                calificacionNPS: docenteEditando.calificacionNPS || 5.0,
                                email: docenteEditando.email || '',
                                telefono: docenteEditando.telefono || '',
                                biografia: docenteEditando.biografia || '',
                                estadoSAR: docenteEditando.estadoSAR || 'Al Día',
                              };
                              descargarDocenteCvPdf(docTemporal);
                            }}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer border border-slate-300"
                            title="Descargar PDF institucional oficial"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200">
                {docenteEditando.id ? (
                  <button
                    type="button"
                    onClick={() => {
                      const d = docentes.find(x => x.id === docenteEditando.id) || (docenteEditando as DocenteBanco);
                      handleIniciarEliminar(d);
                    }}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg border border-rose-200 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Eliminar Registro</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarFormulario(false);
                      setDocenteEditando(null);
                    }}
                    className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-300 text-xs transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar en Directorio</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Lista de Docentes */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filtrados.length === 0 ? (
                <div className="col-span-2 py-12 text-center text-slate-400 space-y-3">
                  <Users className="w-10 h-10 mx-auto opacity-30 text-slate-400" />
                  <div>
                    <p className="text-sm font-bold text-slate-700">No se encontraron docentes con ese criterio de búsqueda.</p>
                    <p className="text-xs text-slate-500 mt-0.5">Puedes registrar un nuevo docente o restablecer los docentes institucionales base.</p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDocenteEditando({
                          nombre: '',
                          titulo: '',
                          especialidad: '',
                          email: '',
                          telefono: '',
                          tarifaHoraSugerida: 200,
                          calificacionNPS: 4.8,
                          biografia: '',
                          estadoSAR: 'Al Día',
                        });
                        setMostrarFormulario(true);
                      }}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Registrar Nuevo Docente</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        restablecerDocentesPorDefecto();
                        refrescar();
                        setMensajeEliminado('Docentes iniciales restablecidos con éxito.');
                        setTimeout(() => setMensajeEliminado(null), 2500);
                      }}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-300"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restablecer Lista Base</span>
                    </button>
                  </div>
                </div>
              ) : (
                filtrados.map((docente) => (
                  <div 
                    key={docente.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                            {docente.titulo || 'Docente Especialista'}
                          </span>
                          <h4 className="text-sm font-black text-slate-900 leading-tight mt-0.5">
                            {docente.nombre}
                          </h4>
                          <p className="text-xs text-slate-600 font-medium mt-1">
                            {docente.especialidad}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 block">
                            {formatearMoneda(docente.tarifaHoraSugerida, (moneda as Moneda) || 'LPS')}/hr
                          </span>
                          {docente.calificacionNPS && (
                            <span className="text-[10px] text-amber-700 font-bold inline-flex items-center gap-0.5 mt-1">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {docente.calificacionNPS}/5.0
                            </span>
                          )}
                        </div>
                      </div>

                      {docente.biografia && (
                        <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                          {docente.biografia}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-600">
                        {docente.email && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" /> {docente.email}
                          </span>
                        )}
                        {docente.telefono && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" /> {docente.telefono}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          id={`btn-ver-cv-${docente.id}`}
                          onClick={() => setDocenteParaVerCv(docente)}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border border-blue-200/80 cursor-pointer shadow-2xs"
                          title={`Ver Curriculum Vitae (PDF) de ${docente.nombre}`}
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>CV (PDF)</span>
                          {docente.cvPdfNombre && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Archivo PDF adjunto" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDocenteEditando(docente);
                            setMostrarFormulario(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title={`Editar perfil de ${docente.nombre}`}
                          aria-label={`Editar ${docente.nombre}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleIniciarEliminar(docente)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title={`Eliminar registro de ${docente.nombre}`}
                          aria-label={`Eliminar ${docente.nombre}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {onSeleccionarDocente && (
                        <button
                          type="button"
                          onClick={() => {
                            onSeleccionarDocente(docente);
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Asignar a este Curso</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

        {/* Modal de Confirmación de Eliminación In-App (Sin window.confirm) */}
        {docenteAEliminar && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-rose-200 overflow-hidden p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    Eliminar Registro
                  </span>
                  <h4 className="text-base font-black text-slate-900 mt-1">
                    ¿Eliminar docente del Banco Institucional?
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Estás a punto de eliminar a <strong className="text-slate-900 font-bold">{docenteAEliminar.nombre}</strong> ({docenteAEliminar.especialidad}).
                  </p>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Esta acción removerá el registro del directorio institucional de docentes.</span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDocenteAEliminar(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarEliminar}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Sí, Eliminar Registro</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Barra inferior */}
        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-slate-500">
            Los honorarios por hora seleccionados aquí se transfieren directamente a los Costos Operativos del programa.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>

      {/* Modal Visor de CV en PDF */}
      {docenteParaVerCv && (
        <DocenteCvPdfModal
          isOpen={!!docenteParaVerCv}
          onClose={() => setDocenteParaVerCv(null)}
          docente={docenteParaVerCv}
        />
      )}
    </div>
  );
};
