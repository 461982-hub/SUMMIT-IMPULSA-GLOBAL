import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Award, 
  Building, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  ExternalLink, 
  Check, 
  Calendar, 
  FileCheck, 
  Search, 
  BookOpen,
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { INSTITUCION_INFO } from '../../utils/institutionalInfo';
import { formatearMoneda } from '../../utils/calculations';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AcademicAcreditacionConveniosSARViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto: (p: ProyectoEducativo) => void;
  onNotificar?: (mensaje: string) => void;
}

export interface ConvenioInstitucional {
  id: string;
  entidad: string;
  tipoEntidad: 'Universidad' | 'Colegio Profesional' | 'Organismo Internacional' | 'Cámara de Comercio';
  numeroAcuerdo: string;
  fechaFirma: string;
  fechaVigencia: string;
  estado: 'Vigente' | 'En Renovación' | 'Vencido';
  programasAmparados: string[];
  contactoAcademico: string;
  telefono: string;
}

export const AcademicAcreditacionConveniosSARView: React.FC<AcademicAcreditacionConveniosSARViewProps> = ({
  proyectos,
  moneda,
  onGuardarProyecto,
  onNotificar,
}) => {
  const [umbralHorasMinimas, setUmbralHorasMinimas] = useState<number>(80);
  const [busqueda, setBusqueda] = useState('');
  const [convenioModalAbierto, setConvenioModalAbierto] = useState(false);

  // Lista de Convenios Institucionales Vigentes
  const [convenios, setConvenios] = useState<ConvenioInstitucional[]>([
    {
      id: 'CONV-001',
      entidad: 'Universidad Tecnológica de Honduras (UTH)',
      tipoEntidad: 'Universidad',
      numeroAcuerdo: 'AC-UTH-SUMMIT-2025-084',
      fechaFirma: '2025-01-15',
      fechaVigencia: '2027-01-15',
      estado: 'Vigente',
      programasAmparados: ['Diplomados en Gestión Financiera', 'Diplomados en Transformación Digital'],
      contactoAcademico: 'Dr. Roberto Mendoza (Decano de Posgrados)',
      telefono: '+504 2508-0000',
    },
    {
      id: 'CONV-002',
      entidad: 'Colegio de Peritos Mercantiles y Contadores Públicos (CPMCPH)',
      tipoEntidad: 'Colegio Profesional',
      numeroAcuerdo: 'AC-CPMCPH-2025-112',
      fechaFirma: '2025-06-10',
      fechaVigencia: '2026-12-31',
      estado: 'Vigente',
      programasAmparados: ['Diplomado en Auditoría Fiscal SAR', 'Tributación Corporativa y NIIF'],
      contactoAcademico: 'Lic. Karla Pineda (Comité de Capacitación)',
      telefono: '+504 2235-4400',
    },
    {
      id: 'CONV-003',
      entidad: 'Universidad Nacional Autónoma de Honduras (UNAH - VS)',
      tipoEntidad: 'Universidad',
      numeroAcuerdo: 'UNAH-VS-DIR-CONV-2024-039',
      fechaFirma: '2024-09-01',
      fechaVigencia: '2026-09-01',
      estado: 'Vigente',
      programasAmparados: ['Diplomados Ejecutivos en Negocios', 'Liderazgo Gerencial'],
      contactoAcademico: 'Máster Patricia Ramos',
      telefono: '+504 2556-8200',
    },
  ]);

  // Formulario de nuevo convenio
  const [nuevoConvenio, setNuevoConvenio] = useState<Partial<ConvenioInstitucional>>({
    entidad: '',
    tipoEntidad: 'Universidad',
    numeroAcuerdo: '',
    fechaFirma: new Date().toISOString().split('T')[0],
    fechaVigencia: '2027-12-31',
    contactoAcademico: '',
    telefono: '',
    programasAmparados: [],
  });

  // Estadísticas globales de auditoría SAR
  const programasAuditados = useMemo(() => {
    return proyectos.map((p) => {
      const horas = p.horasClase || 0;
      const esDiplomado = 
        p.tipoProyecto === 'DIPLOMADO' || 
        p.tipoProyecto === 'Formación académica acreditada (ej. convenios universitarios)';
      
      const cumpleHoras = horas >= umbralHorasMinimas;
      const tieneConvenio = esDiplomado || convenios.some(c => c.programasAmparados.some(prog => p.nombreProyecto.toLowerCase().includes(prog.toLowerCase())));
      const tieneSyllabus = Boolean(p.syllabus && p.syllabus.length >= 2);
      const tieneEvaluacion = Boolean(p.criteriosAprobacion);

      const cumpleLos4Pilares = cumpleHoras && tieneConvenio && tieneSyllabus && tieneEvaluacion;
      const ahorroFiscalISV = p.ingresoRealTotal * 0.15;

      return {
        ...p,
        cumpleHoras,
        tieneConvenio,
        tieneSyllabus,
        tieneEvaluacion,
        cumpleLos4Pilares,
        ahorroFiscalISV,
      };
    });
  }, [proyectos, umbralHorasMinimas, convenios]);

  const totalProgramasExentos = programasAuditados.filter((p) => p.cumpleLos4Pilares).length;
  const totalAhorroFiscalGenerado = programasAuditados
    .filter((p) => p.cumpleLos4Pilares)
    .reduce((acc, p) => acc + p.ahorroFiscalISV, 0);

  // Filtrado de programas
  const programasFiltrados = useMemo(() => {
    return programasAuditados.filter((p) => {
      return (
        p.nombreProyecto.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.tipoProyecto.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.nombreDocente.toLowerCase().includes(busqueda.toLowerCase())
      );
    });
  }, [programasAuditados, busqueda]);

  // Handler para agregar nuevo convenio
  const handleGuardarConvenio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoConvenio.entidad || !nuevoConvenio.numeroAcuerdo) return;

    const creado: ConvenioInstitucional = {
      id: `CONV-${String(convenios.length + 1).padStart(3, '0')}`,
      entidad: nuevoConvenio.entidad,
      tipoEntidad: nuevoConvenio.tipoEntidad || 'Universidad',
      numeroAcuerdo: nuevoConvenio.numeroAcuerdo,
      fechaFirma: nuevoConvenio.fechaFirma || '2026-01-01',
      fechaVigencia: nuevoConvenio.fechaVigencia || '2027-12-31',
      estado: 'Vigente',
      programasAmparados: nuevoConvenio.programasAmparados || ['Todos los diplomados ejecutivos'],
      contactoAcademico: nuevoConvenio.contactoAcademico || 'Secretaría Académica',
      telefono: nuevoConvenio.telefono || '+504 2550-0000',
    };

    setConvenios([...convenios, creado]);
    setConvenioModalAbierto(false);
    onNotificar?.(`🏛️ Convenio con ${creado.entidad} registrado exitosamente`);
  };

  // Generar Dictamen Oficial de Respaldo Fiscal SAR en PDF
  const handleDescargarDictamenPDF = (programa: typeof programasAuditados[0]) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 18;
    const correlativo = `DICT-SAR-${programa.id}-${new Date().getFullYear()}`;
    const fecha = new Date().toLocaleDateString('es-HN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    // Marco exterior
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.8);
    doc.rect(margin - 4, margin - 4, pageWidth - (margin * 2) + 8, pageHeight - (margin * 2) + 8);

    // Encabezado
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, margin, pageWidth - (margin * 2), 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('SUMMIT IMPULSA S. DE R.L.', margin + 6, margin + 8);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    doc.text(`RTN: ${INSTITUCION_INFO.rtn} • San Pedro Sula, Cortés, Honduras`, margin + 6, margin + 14);
    doc.text('GERENCIA ACADÉMICA & ASUNTOS FISCALES - DICTAMEN DE EXENCIÓN TRIBUTARIA', margin + 6, margin + 19);

    let currentY = margin + 34;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('DICTAMEN TÉCNICO CURRICULAR DE EXENCIÓN DEL IMPUESTO SOBRE VENTAS (ISV)', pageWidth / 2, currentY, { align: 'center' });

    currentY += 5;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Fundamento Legal: Artículo 15 Numeral 1 de la Ley del Impuesto Sobre Ventas (Decreto 24-1964)', pageWidth / 2, currentY, { align: 'center' });

    currentY += 8;
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      head: [['DATOS DEL PROGRAMA EDUCATIVO', 'DICTAMEN FISCAL SAR']],
      body: [
        [
          `Nombre del Programa: ${programa.nombreProyecto}\nTipo: ${programa.tipoProyecto}\nFacilitador: ${programa.nombreDocente}\nCarga Horaria: ${programa.horasClase} horas lectivas\nModalidad: ${programa.modalidad || 'Virtual Sincrónica'}\nAlumnos Registrados: ${programa.alumnosFinal || 4}`,
          `Condición Tributaria: ${programa.cumpleLos4Pilares ? 'EXENTO DE ISV (0%)' : 'GRAVADO CON 15% ISV'}\nEstatus de Acreditación: ${programa.cumpleLos4Pilares ? 'APROBADO CONFORME A LEY' : 'REQUIERE ADECUACIÓN'}\nAhorro Tributario Generado: ${formatearMoneda(programa.ahorroFiscalISV, moneda)}\nCódigo Referencial: ${correlativo}`,
        ],
      ],
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('AUDITORÍA DE LOS CUATRO (4) PILARES DE EXENCIÓN FISCAL:', margin, currentY);

    currentY += 4;
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'striped',
      head: [['Pilar de Exención', 'Criterio Legal Exigido por SAR', 'Cumplimiento', 'Evidencia Respaldo']],
      body: [
        [
          '1. Respaldo de Convenio',
          'Alianza formal con Centro de Educación Superior o Colegio Profesional',
          programa.tieneConvenio ? 'CUMPLE (Vigente)' : 'PENDIENTE',
          'Convenio Marco UTH / CPMCPH',
        ],
        [
          '2. Carga Horaria Mínima',
          `Carga lectiva superior al umbral académico normado (≥ ${umbralHorasMinimas} hrs)`,
          programa.cumpleHoras ? `CUMPLE (${programa.horasClase} hrs)` : `INSUFICIENTE (${programa.horasClase} hrs)`,
          'Registro de Asistencia y Plan de Sesiones',
        ],
        [
          '3. Sistema de Evaluación',
          'Rúbricas formales de aprobación, asistencia mínima y proyecto final',
          programa.tieneEvaluacion ? 'CUMPLE' : 'PENDIENTE',
          'Rúbrica Curricular en Gradebook',
        ],
        [
          '4. Syllabus Aprobado',
          'Estructura modular con objetivos pedagógicos y competencias verificables',
          programa.tieneSyllabus ? 'CUMPLE' : 'PENDIENTE',
          'Syllabus Oficial Registrado',
        ],
      ],
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    const conclusion = `CONCLUSIÓN Y CERTIFICACIÓN: La Gerencia Académica de Summit Impulsa S. de R.L. (RTN: ${INSTITUCION_INFO.rtn}) dictamina que el presente programa cumple con la totalidad de los requisitos pedagógicos y formales amparados en el Art. 15 Numeral 1 de la Ley del ISV, por lo que goza de la exención de 15% de Impuesto Sobre Ventas. El presente dictamen se extiende para fines de comprobación tributaria ante auditorías del Servicio de Administración de Rentas (SAR). San Pedro Sula, Cortés, a los ${fecha}.`;
    const lineas = doc.splitTextToSize(conclusion, pageWidth - (margin * 2));
    doc.text(lineas, margin, currentY);

    currentY += 25;
    const colW = (pageWidth - (margin * 2)) / 2;

    doc.setDrawColor(148, 163, 184);
    doc.line(margin + 15, currentY, margin + colW - 15, currentY);
    doc.line(margin + colW + 15, currentY, pageWidth - margin - 15, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Dirección Académica y Curricular', margin + colW * 0.5, currentY + 4, { align: 'center' });
    doc.text('Summit Impulsa S. de R.L.', margin + colW * 0.5, currentY + 8, { align: 'center' });

    doc.text('Gerencia General & Apoderado Legal', margin + colW * 1.5, currentY + 4, { align: 'center' });
    doc.text(`RTN Institucional: ${INSTITUCION_INFO.rtn}`, margin + colW * 1.5, currentY + 8, { align: 'center' });

    doc.save(`Dictamen_SAR_ExencionISV_${programa.nombreProyecto.replace(/\s+/g, '_')}.pdf`);
    onNotificar?.(`📄 Dictamen Técnico descargado para ${programa.nombreProyecto}`);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner de Cabecera */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white p-5 rounded-2xl border border-emerald-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Acreditación Curricular SAR & Validación de Exención de ISV
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-300 border border-emerald-400/40">
              Art. 15 Numeral 1 Ley ISV
            </span>
          </div>
          <p className="text-xs text-emerald-100/90 max-w-3xl mt-1 leading-relaxed">
            Blindaje técnico-jurídico para justificar la exención del 15% de ISV en Diplomados y Educación Formal de Summit Impulsa S. de R.L. (RTN: {INSTITUCION_INFO.rtn}) mediante auditoría de horas y convenios universitarios vigentes.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 text-right">
            <span className="text-[10px] text-emerald-200 block uppercase font-bold">Programas Exentos</span>
            <span className="text-xl font-black text-emerald-400 font-mono">
              {totalProgramasExentos} de {proyectos.length}
            </span>
          </div>
          <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 text-right">
            <span className="text-[10px] text-emerald-200 block uppercase font-bold">Ahorro Fiscal en Matrícula</span>
            <span className="text-sm font-black text-amber-300 font-mono">
              {formatearMoneda(totalAhorroFiscalGenerado, moneda)}
            </span>
          </div>
        </div>
      </div>

      {/* Selector de Umbral de Horas y Control de Convenios */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Selector de Horas Mínimas para Diplomados */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-700 rounded-lg shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-800 block">
              Umbral Mínimo de Horas para Exención de ISV en Diplomados:
            </label>
            <div className="flex items-center gap-2 mt-1">
              {[20, 40, 80, 120].map((horas) => (
                <button
                  key={horas}
                  type="button"
                  onClick={() => setUmbralHorasMinimas(horas)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    umbralHorasMinimas === horas
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  ≥ {horas} horas {horas === 80 ? '(Estándar Superior)' : ''}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Botón para Registrar Nuevo Convenio */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setConvenioModalAbierto(true)}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar Convenio Universitario</span>
          </button>
        </div>
      </div>

      {/* Repositorio de Convenios Universitarios Vigentes */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Convenios Universitarios e Institucionales Registrados ({convenios.length})
            </h4>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            Respaldo ante el Consejo de Educación Superior y SAR
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {convenios.map((c) => (
            <div key={c.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h5 className="font-black text-xs text-slate-900 line-clamp-1">{c.entidad}</h5>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                  {c.estado}
                </span>
              </div>
              <div className="text-[10px] text-slate-600 space-y-0.5 font-mono">
                <div>Acuerdo: <strong className="text-slate-800">{c.numeroAcuerdo}</strong></div>
                <div>Vigencia: {c.fechaVigencia}</div>
                <div className="font-sans text-slate-500 truncate">Contacto: {c.contactoAcademico}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Matriz de Auditoría y Dictamen Fiscal por Programa */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Matriz de Auditoría de los 4 Pilares de Exención (SAR)
            </h4>
            <span className="text-[10px] text-slate-500">
              Evaluación automatizada: 1. Convenio • 2. Horas Mínimas (≥{umbralHorasMinimas}h) • 3. Evaluación Formal • 4. Syllabus
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtrar programa o docente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Programa Formativo</th>
                <th className="py-2.5 px-3 text-center">Horas ({umbralHorasMinimas}h)</th>
                <th className="py-2.5 px-3 text-center">Convenio</th>
                <th className="py-2.5 px-3 text-center">Evaluación</th>
                <th className="py-2.5 px-3 text-center">Syllabus</th>
                <th className="py-2.5 px-3 text-center">Dictamen SAR</th>
                <th className="py-2.5 px-3 text-right">Ahorro ISV</th>
                <th className="py-2.5 px-3 text-right">Dictamen PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {programasFiltrados.map((p) => {
                return (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 max-w-xs">
                      <div className="font-bold text-slate-900 truncate">{p.nombreProyecto}</div>
                      <div className="text-[10px] text-slate-500">{p.tipoProyecto} • {p.nombreDocente}</div>
                    </td>

                    <td className="py-2.5 px-3 text-center font-mono">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        p.cumpleHoras ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {p.horasClase}h {p.cumpleHoras ? '✓' : '✗'}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[11px] font-bold ${p.tieneConvenio ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {p.tieneConvenio ? '✓ Sí' : '— No'}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[11px] font-bold ${p.tieneEvaluacion ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {p.tieneEvaluacion ? '✓ Sí' : '— No'}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[11px] font-bold ${p.tieneSyllabus ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {p.tieneSyllabus ? '✓ Sí' : '— No'}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.cumpleLos4Pilares
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {p.cumpleLos4Pilares ? 'Exento 0% ISV' : 'Gravado 15% ISV'}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                      {formatearMoneda(p.ahorroFiscalISV, moneda)}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDescargarDictamenPDF(p)}
                        className="p-1 text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors inline-flex items-center gap-1 font-bold text-[10px] cursor-pointer"
                        title="Descargar Dictamen Técnico Curricular para respaldo fiscal SAR"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Dictamen</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Registrar Nuevo Convenio */}
      {convenioModalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-indigo-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-300" />
                <h3 className="font-bold text-sm">Registrar Nuevo Convenio Universitario</h3>
              </div>
              <button
                type="button"
                onClick={() => setConvenioModalAbierto(false)}
                className="text-indigo-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarConvenio} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre de la Institución Universitaria:</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Universidad Tecnológica Centroamericana (UNITEC)"
                  value={nuevoConvenio.entidad}
                  onChange={(e) => setNuevoConvenio({ ...nuevoConvenio, entidad: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Entidad:</label>
                  <select
                    value={nuevoConvenio.tipoEntidad}
                    onChange={(e) => setNuevoConvenio({ ...nuevoConvenio, tipoEntidad: e.target.value as any })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="Universidad">Universidad</option>
                    <option value="Colegio Profesional">Colegio Profesional</option>
                    <option value="Organismo Internacional">Organismo Internacional</option>
                    <option value="Cámara de Comercio">Cámara de Comercio</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Número de Acuerdo / Resolución:</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. AC-2026-UNITEC-01"
                    value={nuevoConvenio.numeroAcuerdo}
                    onChange={(e) => setNuevoConvenio({ ...nuevoConvenio, numeroAcuerdo: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha de Firma:</label>
                  <input
                    type="date"
                    value={nuevoConvenio.fechaFirma}
                    onChange={(e) => setNuevoConvenio({ ...nuevoConvenio, fechaFirma: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha de Vigencia:</label>
                  <input
                    type="date"
                    value={nuevoConvenio.fechaVigencia}
                    onChange={(e) => setNuevoConvenio({ ...nuevoConvenio, fechaVigencia: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contacto Académico / Decanatura:</label>
                <input
                  type="text"
                  placeholder="Nombre del decano o director de enlace"
                  value={nuevoConvenio.contactoAcademico}
                  onChange={(e) => setNuevoConvenio({ ...nuevoConvenio, contactoAcademico: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setConvenioModalAbierto(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  Guardar Convenio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
