import React, { useState, useMemo } from 'react';
import { 
  Users, 
  ShieldCheck, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  Edit3, 
  Save, 
  Building2, 
  Receipt, 
  Calendar, 
  Phone, 
  Mail, 
  CreditCard, 
  Check, 
  Copy, 
  Clock, 
  Award,
  AlertTriangle,
  FileCheck,
  FileSpreadsheet
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { INSTITUCION_INFO } from '../../utils/institutionalInfo';
import { formatearMoneda } from '../../utils/calculations';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AcademicDocenteExpedienteSARViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto?: (p: ProyectoEducativo) => void;
  onNotificar?: (mensaje: string) => void;
}

export interface ExpedienteDocente {
  nombre: string;
  rtn: string;
  especialidad: string;
  correo: string;
  telefono: string;
  tipoContratacion: 'Servicios Profesionales' | 'Planilla / Empleado' | 'Docente Internacional';
  condicionTributariaSAR: 'Nacional Residente (12.5% ISR)' | 'No Domiciliado (25% ISR)' | 'Persona Jurídica (0% - Constancia)';
  tasaRetencionISR: number;
  tieneConstanciaPagosCuenta: boolean;
  caiFactura: string;
  vencimientoCAI: string;
  contratoFirmado: boolean;
  syllabusAprobado: boolean;
  banco: string;
  numeroCuenta: string;
  tipoCuenta: 'Ahorro' | 'Cheques';
  totalHoras: number;
  totalHonorariosBrutos: number;
  totalRetencionISR: number;
  totalNetoDesembolsar: number;
  programas: ProyectoEducativo[];
}

export const AcademicDocenteExpedienteSARView: React.FC<AcademicDocenteExpedienteSARViewProps> = ({
  proyectos,
  moneda,
  onNotificar,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroRegimen, setFiltroRegimen] = useState<string>('todos');
  const [docenteSeleccionadoNombre, setDocenteSeleccionadoNombre] = useState<string>('');
  const [copiado, setCopiado] = useState(false);

  // Estados editables para el docente seleccionado
  const [datosEditables, setDatosEditables] = useState<Record<string, Partial<ExpedienteDocente>>>({});

  // Construcción de expedientes a partir de los proyectos y docentes
  const expedientesDocentes = useMemo(() => {
    const mapa = new Map<string, ExpedienteDocente>();

    proyectos.forEach((p, idx) => {
      const doc = p.nombreDocente.trim() || 'Docente no asignado';
      if (!mapa.has(doc)) {
        // Generar RTN predeterminado verosímil si no existe
        const digitosAleatorios = String(100000 + (idx * 37) % 899999);
        const rtnDefault = `05011985${digitosAleatorios}`;

        mapa.set(doc, {
          nombre: doc,
          rtn: rtnDefault,
          especialidad: p.docenteEspecialidad || 'Especialista en Capacitación Ejecutiva',
          correo: `${doc.toLowerCase().replace(/[^a-z]/g, '')}@summitimpulsa.edu.hn`,
          telefono: '+504 9876-5432',
          tipoContratacion: 'Servicios Profesionales',
          condicionTributariaSAR: 'Nacional Residente (12.5% ISR)',
          tasaRetencionISR: 12.5,
          tieneConstanciaPagosCuenta: false,
          caiFactura: '3B4F5C-6D7E8F-9A0B1C-2D3E4F',
          vencimientoCAI: '2026-12-31',
          contratoFirmado: true,
          syllabusAprobado: true,
          banco: 'Banco Ficohsa Honduras',
          numeroCuenta: '2000-1234-5678',
          tipoCuenta: 'Ahorro',
          totalHoras: 0,
          totalHonorariosBrutos: 0,
          totalRetencionISR: 0,
          totalNetoDesembolsar: 0,
          programas: [],
        });
      }

      const exp = mapa.get(doc)!;
      exp.totalHoras += p.horasClase || 0;
      exp.programas.push(p);
      const costo = p.costoDocenteCalculado || ((p.horasClase || 0) * (p.tarifaHoraDocente || 200));
      exp.totalHonorariosBrutos += costo;
      
      // Aplicar retención según condición
      const tasa = exp.tasaRetencionISR;
      const retencion = costo * (tasa / 100);
      exp.totalRetencionISR += retencion;
      exp.totalNetoDesembolsar += costo - retencion;
    });

    // Sobrescribir con cambios guardados localmente
    const lista = Array.from(mapa.values()).map((exp) => {
      const custom = datosEditables[exp.nombre];
      if (custom) {
        const merge = { ...exp, ...custom };
        // Recalcular montos si cambió la tasa de retención
        const ret = merge.totalHonorariosBrutos * (merge.tasaRetencionISR / 100);
        merge.totalRetencionISR = ret;
        merge.totalNetoDesembolsar = merge.totalHonorariosBrutos - ret;
        return merge;
      }
      return exp;
    });

    return lista.sort((a, b) => b.totalHonorariosBrutos - a.totalHonorariosBrutos);
  }, [proyectos, datosEditables]);

  // Docente actualmente seleccionado para ver o emitir constancia
  const docenteSeleccionado = useMemo(() => {
    if (docenteSeleccionadoNombre) {
      const match = expedientesDocentes.find((d) => d.nombre === docenteSeleccionadoNombre);
      if (match) return match;
    }
    return expedientesDocentes[0] || null;
  }, [expedientesDocentes, docenteSeleccionadoNombre]);

  // Manejo de actualización de campos del docente
  const handleActualizarDocente = (campo: keyof ExpedienteDocente, valor: any) => {
    if (!docenteSeleccionado) return;
    setDatosEditables((prev) => ({
      ...prev,
      [docenteSeleccionado.nombre]: {
        ...prev[docenteSeleccionado.nombre],
        [campo]: valor,
      },
    }));
  };

  // Filtrado de la lista
  const expedientesFiltrados = useMemo(() => {
    return expedientesDocentes.filter((doc) => {
      const matchBusq = 
        doc.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        doc.rtn.includes(busqueda) ||
        doc.especialidad.toLowerCase().includes(busqueda.toLowerCase());
      
      const matchReg = filtroRegimen === 'todos' || doc.condicionTributariaSAR.includes(filtroRegimen);
      return matchBusq && matchReg;
    });
  }, [expedientesDocentes, busqueda, filtroRegimen]);

  // Generar Constancia Oficial de Retención SAR-272 en PDF
  const handleDescargarConstanciaPDF = (docente: ExpedienteDocente) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 18;
    const correlativo = `RET-2026-${String(Math.floor(Math.random() * 89999 + 10000))}`;
    const fechaEmision = new Date().toLocaleDateString('es-HN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    // Marco formal exterior
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.8);
    doc.rect(margin - 4, margin - 4, pageWidth - (margin * 2) + 8, pageHeight - (margin * 2) + 8);

    // Encabezado Institucional
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, margin, pageWidth - (margin * 2), 26, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('SUMMIT IMPULSA S. DE R.L.', margin + 6, margin + 8);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    doc.text(`RTN: ${INSTITUCION_INFO.rtn} • San Pedro Sula, Cortés, Honduras`, margin + 6, margin + 14);
    doc.text('AGENTE DE RETENCIÓN AUTORIZADO ANTE EL SERVICIO DE ADMINISTRACIÓN DE RENTAS (SAR)', margin + 6, margin + 19);

    // Número de Comprobante
    doc.setFillColor(241, 245, 249);
    doc.rect(pageWidth - margin - 52, margin + 5, 46, 16, 'F');
    doc.setDrawColor(148, 163, 184);
    doc.rect(pageWidth - margin - 52, margin + 5, 46, 16);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('CONSTANCIA DE RETENCIÓN', pageWidth - margin - 29, margin + 10, { align: 'center' });
    doc.setTextColor(180, 83, 9);
    doc.setFontSize(9);
    doc.text(`Nº: ${correlativo}`, pageWidth - margin - 29, margin + 16, { align: 'center' });

    // Título Principal del Documento
    let currentY = margin + 35;
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('CONSTANCIA OFICIAL DE RETENCIÓN DEL IMPUESTO SOBRE LA RENTA (SAR-272)', pageWidth / 2, currentY, { align: 'center' });

    currentY += 5;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('(En aplicación al Artículo 50 de la Ley del Impuesto Sobre la Renta y Decreto 24-1964)', pageWidth / 2, currentY, { align: 'center' });

    // Cuadro de Datos del Sujeto Retenido
    currentY += 8;
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      head: [['DATOS DEL AGENTE DE RETENCIÓN', 'DATOS DEL SUJETO RETENIDO (DOCENTE / FACILITADOR)']],
      body: [
        [
          `Razón Social: ${INSTITUCION_INFO.razonSocial}\nRTN: ${INSTITUCION_INFO.rtn}\nDomicilio: ${INSTITUCION_INFO.direccion}\nTeléfono: +504 2550-0000\nCorreo: administracion@summitimpulsa.com`,
          `Nombre: ${docente.nombre}\nRTN: ${docente.rtn}\nEspecialidad: ${docente.especialidad}\nCondición: ${docente.condicionTributariaSAR}\nTeléfono: ${docente.telefono}`,
        ],
      ],
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // Tabla de Detalle de Programas y Liquidación de Honorarios
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('DETALLE DE SERVICIOS DOCENTES IMPARTIDOS Y RETENCIÓN PRACTICADA:', margin, currentY);

    currentY += 4;
    const bodyCursos = docente.programas.map((p, index) => {
      const costoCurso = p.costoDocenteCalculado || ((p.horasClase || 0) * (p.tarifaHoraDocente || 200));
      const retCurso = costoCurso * (docente.tasaRetencionISR / 100);
      const netoCurso = costoCurso - retCurso;
      return [
        String(index + 1),
        p.nombreProyecto,
        `${p.horasClase || 0} hrs`,
        formatearMoneda(costoCurso, moneda),
        `${docente.tasaRetencionISR}%`,
        formatearMoneda(retCurso, moneda),
        formatearMoneda(netoCurso, moneda),
      ];
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'striped',
      head: [['#', 'Programa Académico / Módulo', 'Horas', 'Honorario Bruto', 'Tasa ISR', 'Valor Retenido', 'Valor Neto']],
      body: bodyCursos,
      foot: [
        [
          '',
          'TOTALES CONSOLIDADOS:',
          `${docente.totalHoras} hrs`,
          formatearMoneda(docente.totalHonorariosBrutos, moneda),
          `${docente.tasaRetencionISR}%`,
          formatearMoneda(docente.totalRetencionISR, moneda),
          formatearMoneda(docente.totalNetoDesembolsar, moneda),
        ],
      ],
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 8 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        2: { halign: 'center', cellWidth: 16 },
        3: { halign: 'right', cellWidth: 26 },
        4: { halign: 'center', cellWidth: 16 },
        5: { halign: 'right', cellWidth: 26 },
        6: { halign: 'right', cellWidth: 26 },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // Declaración Jurada Legal
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const textoLegal = `Se extiende la presente constancia a solicitud del interesado y para los efectos legales de acreditar el pago del Impuesto Sobre la Renta retenido en la fuente por la cantidad de ${formatearMoneda(docente.totalRetencionISR, moneda)}, la cual fue enterada a la Tesorería General de la República a través del Servicio de Administración de Rentas (SAR) mediante formulario SAR-272 correspondiente al período fiscal 2026. Dado en la ciudad de San Pedro Sula, Cortés, a los ${fechaEmision}.`;
    const lineas = doc.splitTextToSize(textoLegal, pageWidth - (margin * 2));
    doc.text(lineas, margin, currentY);

    // Firmas y Sellos
    currentY += 28;
    const colW = (pageWidth - (margin * 2)) / 3;

    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.5);
    doc.line(margin + 5, currentY, margin + colW - 5, currentY);
    doc.line(margin + colW + 5, currentY, margin + colW * 2 - 5, currentY);
    doc.line(margin + colW * 2 + 5, currentY, pageWidth - margin - 5, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text('Gerencia Financiera & Fiscal', margin + colW * 0.5, currentY + 4, { align: 'center' });
    doc.text('Summit Impulsa S. de R.L.', margin + colW * 0.5, currentY + 8, { align: 'center' });

    doc.text('Dirección Académica', margin + colW * 1.5, currentY + 4, { align: 'center' });
    doc.text('Aprobación de Servicios', margin + colW * 1.5, currentY + 8, { align: 'center' });

    doc.text(`${docente.nombre}`, margin + colW * 2.5, currentY + 4, { align: 'center' });
    doc.text(`Firma del Sujeto Retenido (RTN: ${docente.rtn})`, margin + colW * 2.5, currentY + 8, { align: 'center' });

    // Pie de página
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `SUMMIT IMPULSA GLOBAL • RTN: ${INSTITUCION_INFO.rtn} • San Pedro Sula, Cortés • Documento Fiscal Oficial • ${correlativo}`,
      margin,
      pageHeight - 6
    );

    doc.save(`Constancia_Retencion_SAR272_${docente.nombre.replace(/\s+/g, '_')}_2026.pdf`);
    onNotificar?.(`📄 Constancia SAR-272 generada exitosamente para ${docente.nombre}`);
  };

  // Copiar resumen de expediente al portapapeles
  const handleCopiarExpediente = () => {
    if (!docenteSeleccionado) return;
    const resumen = `EXPEDIENTE DOCENTE & FISCAL SAR - SUMMIT IMPULSA GLOBAL
-----------------------------------------------------
Docente: ${docenteSeleccionado.nombre}
RTN Registrado: ${docenteSeleccionado.rtn}
Especialidad: ${docenteSeleccionado.especialidad}
Condición Fiscal: ${docenteSeleccionado.condicionTributariaSAR}
Tasa de Retención ISR: ${docenteSeleccionado.tasaRetencionISR}% (Art. 50 Ley de ISR)
Total Horas Asignadas: ${docenteSeleccionado.totalHoras} hrs
Honorarios Brutos: ${formatearMoneda(docenteSeleccionado.totalHonorariosBrutos, moneda)}
Retención ISR SAR-272: ${formatearMoneda(docenteSeleccionado.totalRetencionISR, moneda)}
Valor Neto a Desembolsar: ${formatearMoneda(docenteSeleccionado.totalNetoDesembolsar, moneda)}
Banco: ${docenteSeleccionado.banco} • Cuenta: ${docenteSeleccionado.numeroCuenta} (${docenteSeleccionado.tipoCuenta})
Estado Contractual: ${docenteSeleccionado.contratoFirmado ? 'Contrato Firmado' : 'Pendiente de Firma'}
Agente de Retención: ${INSTITUCION_INFO.razonSocial} (RTN: ${INSTITUCION_INFO.rtn}, San Pedro Sula)
-----------------------------------------------------`;

    navigator.clipboard.writeText(resumen).then(() => {
      setCopiado(true);
      onNotificar?.('📋 Expediente docente copiado al portapapeles');
      setTimeout(() => setCopiado(false), 2500);
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Banner Principal de Expediente Docente & Control SAR */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-500/30 text-blue-300 border border-blue-400/40 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              Directorio Fiscal de Facilitadores
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-400 text-slate-950">
              Agente Retenedor RTN: {INSTITUCION_INFO.rtn}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Expediente Docente Digital & Control de Retenciones SAR
          </h3>
          <p className="text-xs text-slate-300 max-w-3xl mt-1 leading-relaxed">
            Gestión integral de facilitadores, validación de RTN (14 dígitos), contratos de prestación de servicios y generación automática de constancias oficiales de retención de ISR (formulario SAR-272).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 text-right">
            <span className="text-[10px] text-slate-300 block uppercase font-bold">Docentes en Nómina</span>
            <span className="text-xl font-black text-emerald-400 font-mono">{expedientesDocentes.length}</span>
          </div>
          <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 text-right">
            <span className="text-[10px] text-slate-300 block uppercase font-bold">Total Retenciones ISR</span>
            <span className="text-sm font-black text-amber-300 font-mono">
              {formatearMoneda(expedientesDocentes.reduce((acc, d) => acc + d.totalRetencionISR, 0), moneda)}
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre de docente, RTN o especialidad..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={filtroRegimen}
            onChange={(e) => setFiltroRegimen(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 cursor-pointer"
          >
            <option value="todos">Todos los regímenes SAR</option>
            <option value="12.5%">Nacional Residente (12.5% ISR)</option>
            <option value="25%">No Domiciliado (25% ISR)</option>
            <option value="0%">Persona Jurídica (0% SAR)</option>
          </select>
        </div>
      </div>

      {/* Grid Principal: Listado Lateral + Expediente Detallado */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMNA IZQUIERDA: Listado de Docentes */}
        <div className="lg:col-span-4 space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
          {expedientesFiltrados.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-white rounded-xl border border-slate-200">
              No se encontraron docentes con los criterios seleccionados.
            </div>
          ) : (
            expedientesFiltrados.map((doc) => {
              const esSeleccionado = docenteSeleccionado?.nombre === doc.nombre;
              return (
                <div
                  key={doc.nombre}
                  onClick={() => setDocenteSeleccionadoNombre(doc.nombre)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    esSeleccionado
                      ? 'bg-blue-50/80 border-blue-500 shadow-xs ring-1 ring-blue-500'
                      : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{doc.nombre}</h4>
                      <span className="text-[10px] text-slate-500 line-clamp-1">{doc.especialidad}</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 font-mono shrink-0">
                      {doc.tasaRetencionISR}% ISR
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-mono">RTN: {doc.rtn}</span>
                    <span className="font-bold text-blue-900 font-mono">
                      {formatearMoneda(doc.totalHonorariosBrutos, moneda)}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-[9px]">
                    <span className={`px-1.5 py-0.2 rounded font-bold ${
                      doc.contratoFirmado ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {doc.contratoFirmado ? '✓ Contrato OK' : '⚠ Contrato Pendiente'}
                    </span>
                    <span className="text-slate-400 font-medium">
                      {doc.programas.length} cursos ({doc.totalHoras}h)
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* COLUMNA DERECHA: Expediente Detallado & Emisión de Constancia */}
        <div className="lg:col-span-8">
          {docenteSeleccionado ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-6 p-5 sm:p-6">
              
              {/* Encabezado del Docente */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      {docenteSeleccionado.nombre}
                    </h3>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-100 text-blue-900 border border-blue-200">
                      RTN: {docenteSeleccionado.rtn}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {docenteSeleccionado.especialidad} • {docenteSeleccionado.correo}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopiarExpediente}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiado ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiado ? 'Copiado' : 'Copiar'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDescargarConstanciaPDF(docenteSeleccionado)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Constancia SAR-272 (PDF)</span>
                  </button>
                </div>
              </div>

              {/* Semáforo de Cumplimiento para Autorización de Desembolso */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider block mb-2">
                  Semáforo de Cumplimiento Legal para Pago de Honorarios:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  
                  <div className={`p-2 rounded-lg border flex items-center gap-2 ${
                    docenteSeleccionado.rtn && docenteSeleccionado.rtn.length === 14
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}>
                    {docenteSeleccionado.rtn && docenteSeleccionado.rtn.length === 14 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <span className="text-[10px] block font-bold">RTN 14 Dígitos</span>
                      <span className="text-[9px] font-mono">{docenteSeleccionado.rtn ? 'Validado' : 'Pendiente'}</span>
                    </div>
                  </div>

                  <div className={`p-2 rounded-lg border flex items-center gap-2 ${
                    docenteSeleccionado.contratoFirmado
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}>
                    {docenteSeleccionado.contratoFirmado ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <div>
                      <span className="text-[10px] block font-bold">Contrato Docente</span>
                      <span className="text-[9px]">{docenteSeleccionado.contratoFirmado ? 'Firmado' : 'Sin firmar'}</span>
                    </div>
                  </div>

                  <div className={`p-2 rounded-lg border flex items-center gap-2 ${
                    docenteSeleccionado.caiFactura
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}>
                    {docenteSeleccionado.caiFactura ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <span className="text-[10px] block font-bold">Factura con CAI</span>
                      <span className="text-[9px] font-mono truncate max-w-[80px]">{docenteSeleccionado.caiFactura ? 'Vigente' : 'Incompleto'}</span>
                    </div>
                  </div>

                  <div className={`p-2 rounded-lg border flex items-center gap-2 ${
                    docenteSeleccionado.syllabusAprobado
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}>
                    {docenteSeleccionado.syllabusAprobado ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <div>
                      <span className="text-[10px] block font-bold">Syllabus & Rúbricas</span>
                      <span className="text-[9px]">{docenteSeleccionado.syllabusAprobado ? 'Aprobado' : 'Revisión'}</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Formulario de Configuración de Datos Fiscales del Docente */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Número de RTN Oficial (14 dígitos):
                  </label>
                  <input
                    type="text"
                    maxLength={14}
                    value={docenteSeleccionado.rtn}
                    onChange={(e) => handleActualizarDocente('rtn', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Utilizado en la constancia SAR-272 y deducción institucional.
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Condición Tributaria ante el SAR:
                  </label>
                  <select
                    value={docenteSeleccionado.condicionTributariaSAR}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      let tasa = 12.5;
                      if (val.includes('25%')) tasa = 25.0;
                      if (val.includes('0%')) tasa = 0.0;
                      handleActualizarDocente('condicionTributariaSAR', val);
                      handleActualizarDocente('tasaRetencionISR', tasa);
                    }}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                  >
                    <option value="Nacional Residente (12.5% ISR)">Nacional Residente (12.5% Retención ISR - Art. 50)</option>
                    <option value="No Domiciliado (25% ISR)">Extranjero No Domiciliado (25% Retención ISR - Art. 5)</option>
                    <option value="Persona Jurídica (0% - Constancia)">Persona Jurídica / Constancia SAR Pagos a Cuenta (0%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    CAI de Facturación de Honorarios:
                  </label>
                  <input
                    type="text"
                    value={docenteSeleccionado.caiFactura}
                    onChange={(e) => handleActualizarDocente('caiFactura', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Banco y Cuenta de Desembolso:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Banco"
                      value={docenteSeleccionado.banco}
                      onChange={(e) => handleActualizarDocente('banco', e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                    />
                    <input
                      type="text"
                      placeholder="Nº Cuenta"
                      value={docenteSeleccionado.numeroCuenta}
                      onChange={(e) => handleActualizarDocente('numeroCuenta', e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-800"
                    />
                  </div>
                </div>

              </div>

              {/* Liquidación Económica del Docente */}
              <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Liquidación Consolidada de Honorarios
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono font-bold">
                    Agente: {INSTITUCION_INFO.razonSocial}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-800/80 p-2.5 rounded-lg">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Honorario Bruto</span>
                    <span className="text-base font-black font-mono text-white">
                      {formatearMoneda(docenteSeleccionado.totalHonorariosBrutos, moneda)}
                    </span>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-lg">
                    <span className="text-[10px] text-amber-400 block uppercase font-semibold">
                      Retención ISR ({docenteSeleccionado.tasaRetencionISR}%)
                    </span>
                    <span className="text-base font-black font-mono text-amber-400">
                      -{formatearMoneda(docenteSeleccionado.totalRetencionISR, moneda)}
                    </span>
                  </div>
                  <div className="bg-emerald-950/60 border border-emerald-800/60 p-2.5 rounded-lg">
                    <span className="text-[10px] text-emerald-300 block uppercase font-semibold">Neto a Transferir</span>
                    <span className="text-base font-black font-mono text-emerald-300">
                      {formatearMoneda(docenteSeleccionado.totalNetoDesembolsar, moneda)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Programas Impartidos por este Docente */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Cursos & Módulos Impartidos ({docenteSeleccionado.programas.length})
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Programa</th>
                        <th className="py-2 px-3 text-center">Horas</th>
                        <th className="py-2 px-3 text-right">Honorario Bruto</th>
                        <th className="py-2 px-3 text-right">Retención ISR</th>
                        <th className="py-2 px-3 text-right">Líquido</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {docenteSeleccionado.programas.map((p) => {
                        const costo = p.costoDocenteCalculado || ((p.horasClase || 0) * (p.tarifaHoraDocente || 200));
                        const ret = costo * (docenteSeleccionado.tasaRetencionISR / 100);
                        const liq = costo - ret;
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-medium text-slate-900">{p.nombreProyecto}</td>
                            <td className="py-2 px-3 text-center font-mono text-slate-600">{p.horasClase}h</td>
                            <td className="py-2 px-3 text-right font-mono">{formatearMoneda(costo, moneda)}</td>
                            <td className="py-2 px-3 text-right font-mono text-amber-700">-{formatearMoneda(ret, moneda)}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">{formatearMoneda(liq, moneda)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white p-12 text-center text-slate-400 rounded-xl border border-slate-200">
              Seleccione un docente del panel izquierdo para consultar y gestionar su expediente fiscal.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
