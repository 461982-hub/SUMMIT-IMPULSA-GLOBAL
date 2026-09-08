import React, { useState } from 'react';
import { 
  Award, 
  CheckCircle2, 
  QrCode, 
  Printer, 
  Download, 
  Save, 
  Sparkles, 
  ShieldCheck, 
  FileCheck, 
  Calendar, 
  GraduationCap,
  ExternalLink,
  Eye,
  Search,
  Check,
  Copy,
  AlertCircle
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { INSTITUCION_INFO } from '../../utils/institutionalInfo';
import { generarCodigoValidacionCertificado } from '../../utils/curricularUtils';
import { jsPDF } from 'jspdf';

interface AcademicCertificatesViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto: (p: ProyectoEducativo) => void;
  onNotificar?: (mensaje: string) => void;
}

export const AcademicCertificatesView: React.FC<AcademicCertificatesViewProps> = ({
  proyectos,
  onGuardarProyecto,
  onNotificar,
}) => {
  const [proyectoSeleccionadoId, setProyectoSeleccionadoId] = useState<number>(
    proyectos.length > 0 ? proyectos[0].id : 0
  );

  const proyectoActual = proyectos.find((p) => p.id === proyectoSeleccionadoId) || proyectos[0];

  const [tipoCertificacion, setTipoCertificacion] = useState(
    proyectoActual?.tipoCertificacion || 'Diploma de Aprobación'
  );
  const [horasCertificadas, setHorasCertificadas] = useState(
    proyectoActual?.horasCertificadas || proyectoActual?.horasClase || 20
  );
  const [codigoValidacion, setCodigoValidacion] = useState(
    proyectoActual?.codigoValidacionCertificado || generarCodigoValidacionCertificado(proyectoActual?.id || 1, proyectoActual?.codigoPrograma)
  );
  const [emisionEstado, setEmisionEstado] = useState(
    proyectoActual?.emisionCertificadosEstado || 'No Emitidos'
  );

  // Nombre de estudiante de muestra para el preview del diploma
  const [estudianteMuestra, setEstudianteMuestra] = useState('Ing. Carlos Eduardo Martínez');
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  // Verificador público de autenticidad
  const [codigoBusqueda, setCodigoBusqueda] = useState('');
  const [resultadoVerificacion, setResultadoVerificacion] = useState<{
    valido: boolean;
    proyecto?: ProyectoEducativo;
    mensaje: string;
  } | null>(null);

  const handleSeleccionarProyecto = (p: ProyectoEducativo) => {
    setProyectoSeleccionadoId(p.id);
    setTipoCertificacion(p.tipoCertificacion || 'Diploma de Aprobación');
    setHorasCertificadas(p.horasCertificadas || p.horasClase || 20);
    setCodigoValidacion(p.codigoValidacionCertificado || generarCodigoValidacionCertificado(p.id, p.codigoPrograma));
    setEmisionEstado(p.emisionCertificadosEstado || 'No Emitidos');
    setGuardadoExitoso(false);
  };

  const handleGuardarCertificacion = () => {
    if (!proyectoActual) return;
    const proyectoActualizado: ProyectoEducativo = {
      ...proyectoActual,
      tipoCertificacion,
      horasCertificadas,
      codigoValidacionCertificado: codigoValidacion,
      emisionCertificadosEstado: emisionEstado,
    };
    onGuardarProyecto(proyectoActualizado);
    setGuardadoExitoso(true);
    onNotificar?.('📜 Parámetros del diploma guardados exitosamente');
    setTimeout(() => setGuardadoExitoso(false), 3000);
  };

  // Generar Diploma Oficial en Formato PDF (Landscape / Alta Resolución)
  const handleDescargarDiplomaPDF = () => {
    if (!proyectoActual) return;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'letter', // 279.4 x 215.9 mm
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;

    // Orla exterior institucional (Azul Marino Profundo)
    doc.setDrawColor(26, 43, 73); // #1a2b49
    doc.setLineWidth(3);
    doc.rect(margin, margin, pageWidth - (margin * 2), pageHeight - (margin * 2));

    // Orla interior dorada fina
    doc.setDrawColor(217, 119, 6); // Amber-600
    doc.setLineWidth(0.8);
    doc.rect(margin + 4, margin + 4, pageWidth - (margin * 2) - 8, pageHeight - (margin * 2) - 8);

    // Fondo tenue apergaminado
    doc.setFillColor(253, 252, 248);
    doc.rect(margin + 5, margin + 5, pageWidth - (margin * 2) - 10, pageHeight - (margin * 2) - 10, 'F');

    // Encabezado Institucional
    doc.setTextColor(26, 43, 73);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('SUMMIT IMPULSA S. DE R.L.', pageWidth / 2, margin + 20, { align: 'center' });

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`RTN: ${INSTITUCION_INFO.rtn} • San Pedro Sula, Cortés, Honduras`, pageWidth / 2, margin + 26, { align: 'center' });
    doc.text('CENTRO DE FORMACIÓN EJECUTIVA, CAPACITACIÓN CONTINUA Y ACREDITACIÓN PROFESIONAL', pageWidth / 2, margin + 31, { align: 'center' });

    // Línea separadora decorativa
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - 50, margin + 35, pageWidth / 2 + 50, margin + 35);

    // Texto de concesión
    doc.setFont('times', 'italic');
    doc.setFontSize(13);
    doc.setTextColor(71, 85, 105);
    doc.text('Otorga el presente', pageWidth / 2, margin + 43, { align: 'center' });

    // Tipo de Certificación
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(180, 83, 9); // Amber-700
    doc.text(tipoCertificacion.toUpperCase(), pageWidth / 2, margin + 54, { align: 'center' });

    doc.setFont('times', 'italic');
    doc.setFontSize(12);
    doc.setTextColor(71, 85, 105);
    doc.text('a:', pageWidth / 2, margin + 63, { align: 'center' });

    // Nombre del Egresado
    doc.setFont('times', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(15, 23, 42);
    doc.text(estudianteMuestra, pageWidth / 2, margin + 74, { align: 'center' });

    // Línea bajo el nombre
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - 65, margin + 77, pageWidth / 2 + 65, margin + 77);

    // Texto de mérito y horas
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    doc.text(
      'Por haber cursado, participado activamente y cumplido con los requisitos de evaluación y competencias en:',
      pageWidth / 2,
      margin + 88,
      { align: 'center' }
    );

    // Nombre del Programa
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(26, 43, 73);
    doc.text(`"${proyectoActual.nombreProyecto.toUpperCase()}"`, pageWidth / 2, margin + 98, { align: 'center' });

    // Mención de horas y modalidad
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    const fechaTexto = new Date().toLocaleDateString('es-HN', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.text(
      `Con una duración de ${horasCertificadas} horas lectivas formalmente acreditadas • Modalidad: ${proyectoActual.modalidad || 'Virtual Sincrónica'}.`,
      pageWidth / 2,
      margin + 106,
      { align: 'center' }
    );
    doc.text(`Expedido en San Pedro Sula, Cortés, a los ${fechaTexto}.`, pageWidth / 2, margin + 112, { align: 'center' });

    // Firmas y Código QR simulado
    const posYFirmas = margin + 140;

    // Firma Docente
    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.5);
    doc.line(margin + 20, posYFirmas, margin + 85, posYFirmas);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(proyectoActual.nombreDocente, margin + 52.5, posYFirmas + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Docente Titular / Especialista', margin + 52.5, posYFirmas + 9, { align: 'center' });

    // Código QR y Hash Central
    doc.setFillColor(241, 245, 249);
    doc.rect(pageWidth / 2 - 16, posYFirmas - 14, 32, 22, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(pageWidth / 2 - 16, posYFirmas - 14, 32, 22);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(30, 41, 59);
    doc.text('[ VERIFICACIÓN QR ]', pageWidth / 2, posYFirmas - 7, { align: 'center' });
    doc.setFontSize(7.5);
    doc.setTextColor(180, 83, 9);
    doc.text(codigoValidacion, pageWidth / 2, posYFirmas + 1, { align: 'center' });
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Autenticidad Garantizada', pageWidth / 2, posYFirmas + 6, { align: 'center' });

    // Firma Dirección Académica
    doc.setDrawColor(100, 116, 139);
    doc.line(pageWidth - margin - 85, posYFirmas, pageWidth - margin - 20, posYFirmas);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Phd. Donal Reyes', pageWidth - margin - 52.5, posYFirmas + 4.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text('Dirección Académica & Rectoría', pageWidth - margin - 52.5, posYFirmas + 8, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text('Summit Impulsa S. de R.L.', pageWidth - margin - 52.5, posYFirmas + 11.5, { align: 'center' });

    // Pie de página de validez
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Registro Curricular: ${codigoValidacion} • RTN Institucional: ${INSTITUCION_INFO.rtn} • Consulte autenticidad en www.summitimpulsa.com/verificar`,
      pageWidth / 2,
      pageHeight - margin - 2,
      { align: 'center' }
    );

    doc.save(`Diploma_${estudianteMuestra.replace(/\s+/g, '_')}_${proyectoActual.codigoPrograma || 'SUM'}.pdf`);
    onNotificar?.(`🎓 Diploma oficial descargado en formato PDF de alta resolución`);
  };

  // Verificar código
  const handleVerificarCodigo = (e: React.FormEvent) => {
    e.preventDefault();
    const query = codigoBusqueda.trim().toUpperCase();
    if (!query) return;

    const match = proyectos.find((p) => {
      const code = (p.codigoValidacionCertificado || generarCodigoValidacionCertificado(p.id, p.codigoPrograma)).toUpperCase();
      return code.includes(query) || (p.codigoPrograma && p.codigoPrograma.toUpperCase().includes(query));
    });

    if (match) {
      setResultadoVerificacion({
        valido: true,
        proyecto: match,
        mensaje: `Certificado Válido: Avalado oficialmente por Summit Impulsa S. de R.L. (RTN: ${INSTITUCION_INFO.rtn})`,
      });
    } else {
      setResultadoVerificacion({
        valido: false,
        mensaje: 'No se encontró registro con el código ingresado. Verifique e intente nuevamente.',
      });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md border border-amber-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-5 h-5 text-amber-300" />
            <h3 className="font-black text-base text-white tracking-wide">
              Gestión de Certificación & Emisión de Diplomas Oficiales
            </h3>
            <span className="bg-amber-500/30 text-amber-200 border border-amber-400/40 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
              RTN: {INSTITUCION_INFO.rtn}
            </span>
          </div>
          <p className="text-xs text-amber-200/90 max-w-2xl leading-relaxed">
            Emisión de diplomas con membrete formal de Summit Impulsa S. de R.L., código hash criptográfico de verificación y generador de PDF de alta resolución.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDescargarDiplomaPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Diploma PDF (Oficial)</span>
          </button>
        </div>
      </div>

      {/* Módulo de Verificación Pública de Autenticidad */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <form onSubmit={handleVerificarCodigo} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Verificador Público de Autenticidad Curricular
              </h4>
              <span className="text-[10px] text-slate-500">
                Ingrese el código QR o correlativo para verificar la validez legal del diploma emitido.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="ej. SUM-2026-..."
              value={codigoBusqueda}
              onChange={(e) => setCodigoBusqueda(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 w-44"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Verificar
            </button>
          </div>
        </form>

        {resultadoVerificacion && (
          <div className={`mt-3 p-3 rounded-lg text-xs flex items-center gap-2 ${
            resultadoVerificacion.valido ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' : 'bg-rose-50 border border-rose-200 text-rose-900'
          }`}>
            {resultadoVerificacion.valido ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <div>
              <span className="font-bold">{resultadoVerificacion.mensaje}</span>
              {resultadoVerificacion.proyecto && (
                <div className="text-[10px] text-emerald-800 mt-0.5">
                  Programa: <strong>{resultadoVerificacion.proyecto.nombreProyecto}</strong> • Docente: {resultadoVerificacion.proyecto.nombreDocente} • {resultadoVerificacion.proyecto.horasClase} Horas Lectivas
                </div>
              )}
            </div>
          </div>
        )}
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
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSeleccionarProyecto(p)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50/90 border-amber-400 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-100/80 px-1.5 py-0.5 rounded">
                      {p.codigoPrograma || `ACAD-${p.id}`}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                      p.emisionCertificadosEstado === 'Emitidos y Entregados'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : p.emisionCertificadosEstado === 'En Proceso'
                        ? 'bg-blue-50 text-blue-800 border-blue-300'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {p.emisionCertificadosEstado || 'No Emitidos'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1.5 line-clamp-1">
                    {p.nombreProyecto}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                    <span className="truncate">{p.tipoCertificacion || 'Diploma de Aprobación'}</span>
                    <span className="font-mono">{p.horasClase}h</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel de Configuración y Previsualización de Certificado */}
        {proyectoActual && (
          <div className="lg:col-span-8 space-y-4">
            {/* Formulario de Parámetros de Certificación */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                    {proyectoActual.codigoPrograma || `ACAD-${proyectoActual.id}`}
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 mt-1">
                    {proyectoActual.nombreProyecto}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGuardarCertificacion}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-all shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar Parámetros</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDescargarDiplomaPDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar PDF</span>
                  </button>
                </div>
              </div>

              {guardadoExitoso && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Parámetros de certificación y código de validación guardados con éxito.</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Certificación Oficial
                  </label>
                  <select
                    value={tipoCertificacion}
                    onChange={(e) => setTipoCertificacion(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="Diploma de Aprobación">Diploma de Aprobación (Con Calificación)</option>
                    <option value="Certificado de Participación">Certificado de Participación / Asistencia</option>
                    <option value="Título Acreditado Universitario">Título Acreditado Universitario</option>
                    <option value="Certificación Profesional Internacional">Certificación Profesional Internacional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Horas Acreditadas
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={horasCertificadas}
                    onChange={(e) => setHorasCertificadas(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estado de Emisión
                  </label>
                  <select
                    value={emisionEstado}
                    onChange={(e) => setEmisionEstado(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="No Emitidos">No Emitidos</option>
                    <option value="En Proceso">En Proceso de Firma</option>
                    <option value="Emitidos y Entregados">Emitidos y Entregados</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código de Validación Institucional (QR / Web)
                  </label>
                  <input
                    type="text"
                    value={codigoValidacion}
                    onChange={(e) => setCodigoValidacion(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-amber-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre del Estudiante (Para Previsualización)
                  </label>
                  <input
                    type="text"
                    value={estudianteMuestra}
                    onChange={(e) => setEstudianteMuestra(e.target.value)}
                    placeholder="Ej. Ing. Carlos Eduardo Martínez"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* PREVISUALIZADOR DEL DIPLOMA INSTITUCIONAL OFICIAL SUMMIT */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between text-white">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-300">
                  <Eye className="w-4 h-4" />
                  Previsualización de Diploma Oficial de Summit Impulsa S. de R.L.
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  RTN Institucional: {INSTITUCION_INFO.rtn}
                </span>
              </div>

              {/* Contenedor del Diploma */}
              <div className="bg-[#fcfaf2] border-8 border-[#1a2b49] p-8 rounded-lg text-slate-900 relative overflow-hidden shadow-2xl font-serif">
                {/* Marco dorado interior */}
                <div className="absolute inset-2 border-2 border-amber-500/60 pointer-events-none"></div>

                {/* Sello de agua institucional de fondo */}
                <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                  <GraduationCap className="w-96 h-96 text-slate-900" />
                </div>

                <div className="relative z-10 text-center space-y-4">
                  {/* Encabezado Institucional */}
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center text-amber-400 shadow-md">
                      <GraduationCap className="w-7 h-7" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-widest text-[#1a2b49] uppercase mt-2">
                      SUMMIT IMPULSA S. DE R.L.
                    </h2>
                    <p className="text-[10px] tracking-widest text-slate-500 uppercase font-sans font-semibold">
                      Centro de Formación Ejecutiva, Capacitación Continua & Acreditación Profesional • RTN: {INSTITUCION_INFO.rtn}
                    </p>
                  </div>

                  <div className="py-2">
                    <p className="text-xs italic text-slate-600 font-serif">
                      Otorga el presente
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-black text-amber-700 uppercase tracking-wider my-1">
                      {tipoCertificacion}
                    </h1>
                    <p className="text-xs italic text-slate-600 font-serif">
                      a:
                    </p>
                  </div>

                  {/* Nombre del Estudiante */}
                  <div className="border-b-2 border-slate-400 pb-1 max-w-md mx-auto">
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif">
                      {estudianteMuestra}
                    </h3>
                  </div>

                  {/* Texto de Acreditación */}
                  <p className="text-xs text-slate-700 max-w-xl mx-auto font-sans leading-relaxed">
                    Por haber completado y aprobado satisfactoriamente todos los requisitos académicos, talleres prácticos y proyecto integrador del programa:
                  </p>

                  <div className="bg-amber-50/80 p-3 rounded-lg border border-amber-200 max-w-lg mx-auto">
                    <h4 className="text-sm sm:text-base font-black text-[#1a2b49] uppercase font-sans">
                      {proyectoActual.nombreProyecto}
                    </h4>
                    <p className="text-[11px] text-amber-900 font-sans font-semibold mt-0.5">
                      Intensidad Horaria: <strong>{horasCertificadas} Horas Académicas Certificadas</strong> • Modalidad: {proyectoActual.modalidad || 'Virtual Sincrónica'}
                    </p>
                  </div>

                  {/* Firmas y Código QR */}
                  <div className="grid grid-cols-3 gap-4 pt-6 mt-4 border-t border-slate-300 font-sans text-left">
                    <div className="text-center">
                      <div className="border-t border-slate-800 pt-1 font-bold text-[11px] text-slate-900">
                        {proyectoActual.nombreDocente}
                      </div>
                      <div className="text-[9px] text-slate-500">Docente Titular / Especialista</div>
                    </div>

                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 bg-white border border-slate-300 rounded flex items-center justify-center shadow-2xs">
                        <QrCode className="w-9 h-9 text-slate-900" />
                      </div>
                      <span className="text-[8px] font-mono font-bold text-slate-600 mt-1">
                        {codigoValidacion}
                      </span>
                    </div>

                    <div className="text-center">
                      <div className="border-t border-slate-800 pt-1 font-bold text-[11px] text-slate-900">
                        Phd. Donal Reyes
                      </div>
                      <div className="text-[9px] text-slate-700 font-semibold">Dirección Académica & Rectoría</div>
                      <div className="text-[8px] text-slate-500">Summit Impulsa S. de R.L.</div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
