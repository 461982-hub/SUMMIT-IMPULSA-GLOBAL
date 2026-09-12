import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Mail, 
  Phone, 
  DollarSign, 
  GraduationCap, 
  Sparkles, 
  CheckCircle2, 
  BookOpen, 
  ExternalLink,
  ShieldCheck,
  Award,
  FileText,
  Upload,
  Eye,
  Trash2,
  Check,
  Paperclip,
  Clock
} from 'lucide-react';
import { 
  DocenteBanco, 
  obtenerBancoDocentes, 
  guardarDocenteEnBanco 
} from '../../utils/docenteDirectoryUtils';
import { DocenteDirectoryModal } from './DocenteDirectoryModal';
import { DocenteCvPdfModal } from './DocenteCvPdfModal';
import { leerArchivoPdfComoDataUrl } from '../../utils/docenteCvPdfUtils';

export interface DocenteProfileSectionProps {
  nombreDocente: string;
  docenteClasificacion: 'Licenciatura' | 'Ingeniería' | 'Maestría' | 'Doctorado' | 'Posdoctorado' | 'Técnico';
  docenteTelefono: string;
  docenteCorreo: string;
  docenteEspecialidad?: string;
  tarifaHoraDocente?: number;
  campoConError?: string | null;
  idPrefijo?: string; // ej: "screen-" o ""
  onDocenteChange: (cambios: {
    nombreDocente?: string;
    docenteClasificacion?: 'Licenciatura' | 'Ingeniería' | 'Maestría' | 'Doctorado' | 'Posdoctorado' | 'Técnico';
    docenteTelefono?: string;
    docenteCorreo?: string;
    docenteEspecialidad?: string;
    tarifaHoraDocente?: number;
  }) => void;
  onClearError?: (campo: string) => void;
  moneda?: string;
}

export const DocenteProfileSection: React.FC<DocenteProfileSectionProps> = ({
  nombreDocente,
  docenteClasificacion,
  docenteTelefono,
  docenteCorreo,
  docenteEspecialidad = '',
  tarifaHoraDocente = 200,
  campoConError,
  idPrefijo = '',
  onDocenteChange,
  onClearError,
  moneda = 'LPS',
}) => {
  const [bancoDocentes, setBancoDocentes] = useState<DocenteBanco[]>([]);
  const [modalDirectorioAbierto, setModalDirectorioAbierto] = useState(false);
  const [docenteParaVerCv, setDocenteParaVerCv] = useState<DocenteBanco | null>(null);
  const [subiendoCv, setSubiendoCv] = useState(false);
  const [errorSubidaCv, setErrorSubidaCv] = useState<string | null>(null);

  // Cargar docentes registrados
  useEffect(() => {
    const cargar = () => setBancoDocentes(obtenerBancoDocentes());
    cargar();

    const handleActualizado = (e: any) => {
      if (e.detail) setBancoDocentes(e.detail);
      else cargar();
    };

    window.addEventListener('summit_banco_docentes_actualizado', handleActualizado);
    return () => window.removeEventListener('summit_banco_docentes_actualizado', handleActualizado);
  }, []);

  const inputDocenteId = `${idPrefijo}input-docente`;
  const selectClasificacionId = `${idPrefijo}select-clasificacion-docente`;
  const tieneError = campoConError === inputDocenteId || campoConError === selectClasificacionId;

  const docenteActualEnBanco = bancoDocentes.find(
    d => d.nombre.trim().toLowerCase() === (nombreDocente || '').trim().toLowerCase()
  );

  const tieneCvCargado = Boolean(docenteActualEnBanco?.cvPdfDataUrl || docenteActualEnBanco?.cvPdfNombre);

  const docenteParaCv: DocenteBanco = {
    id: docenteActualEnBanco?.id || `doc-${(nombreDocente || 'actual').toLowerCase().replace(/\s+/g, '-')}`,
    nombre: nombreDocente || 'Docente Institucional',
    titulo: docenteClasificacion || 'Docente Institucional',
    clasificacion: docenteClasificacion,
    especialidad: docenteEspecialidad || 'Capacitación Profesional',
    email: docenteCorreo || '',
    correo: docenteCorreo || '',
    telefono: docenteTelefono || '',
    tarifaHoraSugerida: tarifaHoraDocente || 200,
    calificacionNPS: docenteActualEnBanco?.calificacionNPS || 5.0,
    biografia: docenteActualEnBanco?.biografia || '',
    estadoSAR: docenteActualEnBanco?.estadoSAR || 'Al Día',
    cvPdfDataUrl: docenteActualEnBanco?.cvPdfDataUrl,
    cvPdfNombre: docenteActualEnBanco?.cvPdfNombre,
    cvPdfTamano: docenteActualEnBanco?.cvPdfTamano,
    cvPdfFechaSubida: docenteActualEnBanco?.cvPdfFechaSubida,
  };

  const handleSubirCv = async (file: File) => {
    try {
      setSubiendoCv(true);
      setErrorSubidaCv(null);
      const res = await leerArchivoPdfComoDataUrl(file);

      guardarDocenteEnBanco({
        ...(docenteActualEnBanco || {}),
        id: docenteActualEnBanco?.id || `doc-${Date.now()}`,
        nombre: (nombreDocente || 'Docente Institucional').trim(),
        titulo: docenteClasificacion,
        clasificacion: docenteClasificacion,
        especialidad: docenteEspecialidad,
        email: docenteCorreo,
        correo: docenteCorreo,
        telefono: docenteTelefono,
        tarifaHoraSugerida: tarifaHoraDocente,
        cvPdfDataUrl: res.dataUrl,
        cvPdfNombre: res.nombre,
        cvPdfTamano: res.tamano,
        cvPdfFechaSubida: new Date().toLocaleDateString('es-HN'),
      });

      setBancoDocentes(obtenerBancoDocentes());
    } catch (err: any) {
      setErrorSubidaCv(err.message || 'Error al procesar el archivo PDF');
    } finally {
      setSubiendoCv(false);
    }
  };

  const handleQuitarCv = () => {
    if (docenteActualEnBanco) {
      guardarDocenteEnBanco({
        ...docenteActualEnBanco,
        cvPdfDataUrl: undefined,
        cvPdfNombre: undefined,
        cvPdfTamano: undefined,
        cvPdfFechaSubida: undefined,
      });
      setBancoDocentes(obtenerBancoDocentes());
    }
  };

  // Manejar selección de docente desde el Banco
  const handleSeleccionarDeBanco = (docenteId: string) => {
    if (!docenteId) return;

    if (docenteId === '__nuevo__') {
      setModalDirectorioAbierto(true);
      return;
    }

    const encontrado = bancoDocentes.find(d => d.id === docenteId);
    if (encontrado) {
      onDocenteChange({
        nombreDocente: encontrado.nombre,
        docenteClasificacion: (encontrado.clasificacion as any) || (encontrado.titulo as any) || 'Licenciatura',
        docenteTelefono: encontrado.telefono || docenteTelefono,
        docenteCorreo: encontrado.email || encontrado.correo || docenteCorreo,
        docenteEspecialidad: encontrado.especialidad || docenteEspecialidad,
        tarifaHoraDocente: encontrado.tarifaHoraSugerida || tarifaHoraDocente,
      });
      if (onClearError) {
        onClearError(inputDocenteId);
        onClearError(selectClasificacionId);
      }
    }
  };

  return (
    <div className={`p-4 rounded-xl border space-y-3 transition-all ${
      tieneError
        ? 'bg-rose-50/50 border-rose-300 ring-2 ring-rose-200'
        : 'bg-white border-slate-200 shadow-xs'
    }`}>
      {/* Encabezado y Acción hacia Banco de Docentes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Perfil Docente y Canales de Contacto Directo
            </span>
            <span className="text-[10px] text-slate-500 block">
              Cuerpo Académico Titular del Programa
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {nombreDocente ? (
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Docente Asignado</span>
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Ingreso Libre o Selección del Banco
            </span>
          )}

          <button
            type="button"
            onClick={() => setModalDirectorioAbierto(true)}
            className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Users className="w-3 h-3 text-blue-600" />
            <span>Directorio de Docentes</span>
          </button>
        </div>
      </div>

      {/* Selector Rápido del Banco Institucional */}
      <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex-1">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Halar Datos Automáticamente desde el Banco Institucional:</span>
          </label>
          <select
            value={docenteActualEnBanco ? docenteActualEnBanco.id : ''}
            onChange={(e) => handleSeleccionarDeBanco(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">
              {bancoDocentes.length === 0
                ? '-- No hay docentes en el directorio (Crear en Directorio Docentes) --'
                : '-- Seleccionar Docente Registrado o Escribir Abajo --'}
            </option>
            {bancoDocentes.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre} • {d.especialidad} ({d.clasificacion || d.titulo || 'Docente'} - L. {d.tarifaHoraSugerida}/h)
              </option>
            ))}
            <option value="__nuevo__">+ Registrar Nuevo Docente en el Banco...</option>
          </select>
        </div>

        {docenteActualEnBanco && (
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-1 rounded-md flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>SAR: {docenteActualEnBanco.estadoSAR || 'Al Día'}</span>
            </span>
          </div>
        )}
      </div>

      {/* Cuadrícula de Campos de Datos del Docente */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Nombre Docente */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor={inputDocenteId} className="block text-[11px] font-semibold text-slate-700">
              Docente Asignado <span className="text-rose-500">*</span>
            </label>
            {campoConError === inputDocenteId && (
              <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">Requerido</span>
            )}
          </div>
          <input
            id={inputDocenteId}
            type="text"
            required
            placeholder="Nombre del docente"
            value={nombreDocente}
            onChange={(e) => {
              onDocenteChange({ nombreDocente: e.target.value });
              if (onClearError) onClearError(inputDocenteId);
            }}
            className={`w-full px-2.5 py-1.5 text-xs bg-white border rounded-lg font-medium transition-all ${
              campoConError === inputDocenteId
                ? 'border-rose-500 ring-2 ring-rose-300 bg-rose-50/40 text-rose-950 font-bold'
                : 'border-slate-300 focus:ring-2 focus:ring-blue-500'
            }`}
          />
        </div>

        {/* 2. Clasificación Académica */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor={selectClasificacionId} className="block text-[11px] font-semibold text-slate-700">
              Clasificación Académica <span className="text-rose-500">*</span>
            </label>
            {campoConError === selectClasificacionId && (
              <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">Requerido</span>
            )}
          </div>
          <select
            id={selectClasificacionId}
            value={docenteClasificacion}
            onChange={(e) => {
              onDocenteChange({ docenteClasificacion: e.target.value as any });
              if (onClearError) onClearError(selectClasificacionId);
            }}
            className={`w-full px-2.5 py-1.5 text-xs bg-white border rounded-lg font-semibold transition-all ${
              campoConError === selectClasificacionId
                ? 'border-rose-500 ring-2 ring-rose-300 bg-rose-50/40 text-rose-950'
                : 'border-slate-300 focus:ring-2 focus:ring-blue-500 text-slate-800'
            }`}
          >
            <option value="Licenciatura">Licenciatura</option>
            <option value="Ingeniería">Ingeniería</option>
            <option value="Maestría">Maestría</option>
            <option value="Doctorado">Doctorado</option>
            <option value="Posdoctorado">Posdoctorado</option>
            <option value="Técnico">Técnico Superior</option>
          </select>
        </div>

        {/* 3. Teléfono de Contacto */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Número de Contacto <span className="text-slate-400 font-normal">(Tel/WhatsApp)</span>
          </label>
          <div className="relative">
            <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Ej: +504 9876-5432"
              value={docenteTelefono}
              onChange={(e) => onDocenteChange({ docenteTelefono: e.target.value })}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
        </div>

        {/* 4. Correo Electrónico */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Correo Electrónico
          </label>
          <div className="relative">
            <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="email"
              placeholder="docente@summit.hn"
              value={docenteCorreo}
              onChange={(e) => onDocenteChange({ docenteCorreo: e.target.value })}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Fila Secundaria: Especialidad y Tarifa con conexión a Costos */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1 border-t border-slate-100">
        <div className="sm:col-span-8">
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Especialidad o Área Técnica de Dominio
          </label>
          <input
            type="text"
            placeholder="Ej: Finanzas Corporativas, Ciencia de Datos, Gestión de Proyectos"
            value={docenteEspecialidad}
            onChange={(e) => onDocenteChange({ docenteEspecialidad: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="sm:col-span-4">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-semibold text-slate-700">
              Tarifa Pactada ({moneda}/hora)
            </label>
            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              ⚡ A Costos Operativos
            </span>
          </div>
          <div className="relative">
            <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="number"
              min="0"
              step="10"
              value={tarifaHoraDocente || ''}
              onChange={(e) => onDocenteChange({ tarifaHoraDocente: Number(e.target.value) || 0 })}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Sección de Expediente Curricular y Carga de CV con Planilla de la Empresa */}
      <div className="pt-2 border-t border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-700" />
            <span className="text-xs font-bold text-slate-800">
              Expediente Curricular & CV del Docente
            </span>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full border border-blue-200">
              Planilla de la Empresa
            </span>
          </div>

          {tieneCvCargado && (
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-600" />
              CV Integrado a Planilla
            </span>
          )}
        </div>

        {/* Tarjeta de Estado del CV */}
        <div className={`p-3 rounded-lg border transition-all ${
          tieneCvCargado 
            ? 'bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 border-blue-200' 
            : 'bg-slate-50 border-slate-200'
        }`}>
          {tieneCvCargado ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                      {docenteActualEnBanco?.cvPdfNombre || 'CV_Docente_Adjunto.pdf'}
                    </p>
                    <span className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {docenteActualEnBanco?.cvPdfTamano || 'PDF'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
                    <span>Homologado e integrado en la <strong>Planilla Oficial Summit Impulsa Global</strong></span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Botón Principal: Ver CVPDF con la planilla de la empresa */}
                <button
                  type="button"
                  id={`${idPrefijo}btn-ver-cvpdf`}
                  onClick={() => setDocenteParaVerCv(docenteParaCv)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  title="Ver Curriculum Vitae en PDF con la Planilla Oficial de la Empresa"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver CVPDF</span>
                </button>

                {/* Cambiar archivo */}
                <label
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-300 cursor-pointer"
                  title="Cargar una versión actualizada del CV"
                >
                  <Upload className="w-3 h-3 text-slate-500" />
                  <span className="hidden sm:inline">Cambiar</span>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleSubirCv(file);
                      e.target.value = '';
                    }}
                  />
                </label>

                {/* Quitar archivo */}
                <button
                  type="button"
                  onClick={handleQuitarCv}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                  title="Quitar archivo adjunto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Cargar CV del Docente (.PDF)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Al cargarlo se agregará automáticamente a la opción <strong>Ver CVPDF</strong> con la planilla oficial de la empresa.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                  subiendoCv
                    ? 'bg-slate-200 text-slate-500 cursor-wait'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}>
                  <Upload className="w-3.5 h-3.5" />
                  <span>{subiendoCv ? 'Procesando PDF...' : 'Cargar CV (.PDF)'}</span>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    disabled={subiendoCv}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleSubirCv(file);
                      e.target.value = '';
                    }}
                  />
                </label>

                {nombreDocente && (
                  <button
                    type="button"
                    onClick={() => setDocenteParaVerCv(docenteParaCv)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-300 cursor-pointer"
                    title="Previsualizar la planilla oficial generada para este docente"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ver CVPDF Institucional</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {errorSubidaCv && (
            <p className="text-xs text-red-600 mt-2 font-medium bg-red-50 p-1.5 rounded border border-red-200">
              {errorSubidaCv}
            </p>
          )}
        </div>
      </div>

      {/* Banner de Automatización Preventiva: Sin pedir de nuevo los datos */}
      <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/80 border border-blue-200 text-[11px] text-blue-900">
        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
        <span>
          ⚡ <strong>Flujo Automático:</strong> Esta información se transfiere automáticamente a <strong>Planificación Curricular</strong>, al <strong>Sílabo Oficial (.PDF)</strong> y a la <strong>Estructura de Costos Operativos</strong> sin necesidad de volver a solicitarla.
        </span>
      </div>

      {/* Modal del Directorio de Docentes */}
      <DocenteDirectoryModal
        isOpen={modalDirectorioAbierto}
        onClose={() => setModalDirectorioAbierto(false)}
        onSeleccionarDocente={(docente) => {
          onDocenteChange({
            nombreDocente: docente.nombre,
            docenteClasificacion: (docente.clasificacion as any) || (docente.titulo as any) || 'Licenciatura',
            docenteTelefono: docente.telefono || docenteTelefono,
            docenteCorreo: docente.email || docente.correo || docenteCorreo,
            docenteEspecialidad: docente.especialidad || docenteEspecialidad,
            tarifaHoraDocente: docente.tarifaHoraSugerida || tarifaHoraDocente,
          });
          if (onClearError) {
            onClearError(inputDocenteId);
            onClearError(selectClasificacionId);
          }
          setModalDirectorioAbierto(false);
        }}
        moneda={moneda as any}
      />

      {/* Visor de CV en PDF con Planilla Oficial de la Empresa */}
      <DocenteCvPdfModal
        isOpen={Boolean(docenteParaVerCv)}
        onClose={() => setDocenteParaVerCv(null)}
        docente={docenteParaVerCv}
      />
    </div>
  );
};
