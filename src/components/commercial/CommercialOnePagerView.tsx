import React, { useState } from 'react';
import {
  ProyectoEducativo,
  Moneda,
} from '../../types';
import { formatearMoneda } from '../../utils/calculations';
import {
  FileText,
  Printer,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Award,
  Clock,
  Calendar,
  Users,
  Target,
  ShieldCheck,
  Building,
  Save,
  MessageSquare,
  Share2,
  Download,
  BookOpen,
  Send,
  Zap,
} from 'lucide-react';
import { SummitLogo } from '../SummitLogo';

interface CommercialOnePagerViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto: (proyectoActualizado: ProyectoEducativo) => void;
}

export const CommercialOnePagerView: React.FC<CommercialOnePagerViewProps> = ({
  proyectos,
  moneda,
  onGuardarProyecto,
}) => {
  const [proyectoSeleccionadoId, setProyectoSeleccionadoId] = useState<string>(
    proyectos.length > 0 ? proyectos[0].id : ''
  );

  const proyectoActual = proyectos.find((p) => p.id === proyectoSeleccionadoId) || proyectos[0];

  // Estado editable de la ficha comercial
  const [publicoObjetivo, setPublicoObjetivo] = useState(
    proyectoActual?.fichaComercial?.publicoObjetivo ||
      'Profesionales, directores de área, consultores, analistas financieros y líderes de equipo que buscan dominar herramientas analíticas aplicadas a decisiones estratégicas.'
  );

  const [propuestaValor, setPropuestaValor] = useState(
    proyectoActual?.fichaComercial?.propuestaValor ||
      `Programa ejecutivo integral diseñado para transferir habilidades prácticas de alto impacto en ${proyectoActual?.nombreProyecto || 'el área formativa'}, respaldado por casos reales y metodología aplicada.`
  );

  const [perfilEgresado, setPerfilEgresado] = useState(
    proyectoActual?.fichaComercial?.perfilEgresado ||
      proyectoActual?.perfilEgreso ||
      'El egresado estará facultado para diseñar modelos estratégicos, liderar la implementación de soluciones y sustentar proyectos de alto rendimiento en su organización.'
  );

  const [duracionSemanas, setDuracionSemanas] = useState(
    proyectoActual?.fichaComercial?.duracionSemanas ||
      Math.max(4, Math.ceil((proyectoActual?.horasClase || 24) / 4))
  );

  const [formatoImparticion, setFormatoImparticion] = useState(
    proyectoActual?.fichaComercial?.formatoImparticion ||
      `${proyectoActual?.modalidad || 'Virtual Sincrónico'} (${proyectoActual?.diasClase || 'Sábados'} | ${proyectoActual?.horario || '08:00 AM - 12:00 PM'})`
  );

  const [certificadoEmitido, setCertificadoEmitido] = useState(
    proyectoActual?.fichaComercial?.certificadoEmitido ||
      proyectoActual?.tipoCertificacion ||
      'Diploma Oficial de Aprobación respaldado por Summit Impulsa y Convenio Académico'
  );

  const [contactoAsesorLead, setContactoAsesorLead] = useState(
    proyectoActual?.fichaComercial?.contactoAsesorLead || 'Admisiones Ejecutivas Summit Impulsa'
  );

  const [telefonoWhatsAppLead, setTelefonoWhatsAppLead] = useState(
    proyectoActual?.fichaComercial?.telefonoWhatsAppLead || '+504 9988-7766'
  );

  // Objeciones frecuentes y pitch
  const [objeciones, setObjeciones] = useState(
    proyectoActual?.fichaComercial?.objecionesFrecuentes || [
      {
        id: '1',
        objecion: '¿Es 100% práctico o muy teórico?',
        respuestaPitch:
          'El 70% de las horas lectivas se compone de talleres en vivo, resolución de casos empresariales y desarrollo de un proyecto integrador (Capstone) aplicable a su puesto de trabajo.',
      },
      {
        id: '2',
        objecion: '¿Qué pasa si falto a una sesión?',
        respuestaPitch:
          'Todas las clases sincrónicas son grabadas en alta definición y quedan disponibles en el campus virtual 24/7 con materiales descargables y soporte para dudas del docente.',
      },
      {
        id: '3',
        objecion: '¿El certificado cuenta con valor curricular oficial?',
        respuestaPitch:
          'Sí, se emite Diploma de Aprobación con código QR de verificación digital y horas avaladas por convenios académicos institucionales que eximen de ISV según normativa fiscal.',
      },
    ]
  );

  const [nuevaObjecion, setNuevaObjecion] = useState('');
  const [nuevaRespuesta, setNuevaRespuesta] = useState('');
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  // Manejar cambio de proyecto
  const handleSeleccionarProyecto = (p: ProyectoEducativo) => {
    setProyectoSeleccionadoId(p.id);
    setPublicoObjetivo(
      p.fichaComercial?.publicoObjetivo ||
        'Profesionales, directores de área, consultores y analistas que buscan dominar herramientas analíticas aplicadas a decisiones estratégicas.'
    );
    setPropuestaValor(
      p.fichaComercial?.propuestaValor ||
        `Programa ejecutivo integral diseñado para transferir habilidades prácticas de alto impacto en ${p.nombreProyecto}, respaldado por casos reales.`
    );
    setPerfilEgresado(
      p.fichaComercial?.perfilEgresado ||
        p.perfilEgreso ||
        'El egresado estará facultado para diseñar modelos estratégicos, liderar la implementación de soluciones y sustentar proyectos de alto rendimiento.'
    );
    setDuracionSemanas(
      p.fichaComercial?.duracionSemanas || Math.max(4, Math.ceil((p.horasClase || 24) / 4))
    );
    setFormatoImparticion(
      p.fichaComercial?.formatoImparticion ||
        `${p.modalidad || 'Virtual Sincrónico'} (${p.diasClase || 'Sábados'} | ${p.horario || '08:00 AM - 12:00 PM'})`
    );
    setCertificadoEmitido(
      p.fichaComercial?.certificadoEmitido ||
        p.tipoCertificacion ||
        'Diploma Oficial de Aprobación respaldado por Summit Impulsa'
    );
    setContactoAsesorLead(p.fichaComercial?.contactoAsesorLead || 'Admisiones Ejecutivas Summit Impulsa');
    setTelefonoWhatsAppLead(p.fichaComercial?.telefonoWhatsAppLead || '+504 9988-7766');
    setObjeciones(
      p.fichaComercial?.objecionesFrecuentes || [
        {
          id: '1',
          objecion: '¿Es 100% práctico o muy teórico?',
          respuestaPitch:
            'El 70% de las horas lectivas se compone de talleres en vivo, resolución de casos empresariales y desarrollo de un proyecto integrador aplicable.',
        },
        {
          id: '2',
          objecion: '¿Qué pasa si falto a una sesión?',
          respuestaPitch:
            'Todas las clases sincrónicas son grabadas en HD y quedan disponibles en el campus virtual 24/7 con materiales y soporte docente.',
        },
      ]
    );
    setGuardadoExitoso(false);
  };

  const handleAgregarObjecion = () => {
    if (!nuevaObjecion.trim() || !nuevaRespuesta.trim()) return;
    setObjeciones([
      ...objeciones,
      {
        id: Date.now().toString(),
        objecion: nuevaObjecion,
        respuestaPitch: nuevaRespuesta,
      },
    ]);
    setNuevaObjecion('');
    setNuevaRespuesta('');
  };

  const handleEliminarObjecion = (id: string) => {
    setObjeciones(objeciones.filter((o) => o.id !== id));
  };

  const handleGuardarFicha = () => {
    if (!proyectoActual) return;
    const proyectoActualizado: ProyectoEducativo = {
      ...proyectoActual,
      fichaComercial: {
        publicoObjetivo,
        propuestaValor,
        perfilEgresado,
        duracionSemanas,
        formatoImparticion,
        certificadoEmitido,
        contactoAsesorLead,
        telefonoWhatsAppLead,
        objecionesFrecuentes: objeciones,
        diferenciadoresCompetencia: [
          'Docentes con trayectoria ejecutiva en empresas líderes',
          'Enfoque 100% práctico orientado a entregables reales',
          'Acreditación institucional y beneficios de exención fiscal 0% ISV',
          'Grabaciones y materiales con acceso extendido en campus virtual',
        ],
      },
    };
    onGuardarProyecto(proyectoActualizado);
    setGuardadoExitoso(true);
    setTimeout(() => setGuardadoExitoso(false), 3000);
  };

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Encabezado del Módulo */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase rounded tracking-wider">
              Sales Enablement & Pitch Guide
            </span>
            <span className="text-xs text-slate-500 font-medium">Material Comercial Oficial</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            Fichas Comerciales & One-Pagers de Venta
          </h3>
          <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
            Genera automáticamente la ficha técnica ejecutiva, argumentario de ventas (Pitch) y brochure descargable a partir de la planificación pedagógica.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleImprimir}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors border border-slate-300"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir One-Pager</span>
          </button>

          <button
            type="button"
            onClick={handleGuardarFicha}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-lg transition-colors shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Ficha</span>
          </button>
        </div>
      </div>

      {/* Indicador de Origen de Datos: Manual vs Automático */}
      <div className="bg-slate-900 text-white rounded-xl p-3.5 border border-blue-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] border border-emerald-400/30 shrink-0">
            ⚡ 100% AUTOMÁTICO
          </span>
          <span className="text-emerald-100 text-xs">
            El One-Pager y el Elevator Pitch extraen automáticamente docente, horas, módulos y precios desde la base académica y financiera.
          </span>
        </div>
        <div className="flex items-center gap-2.5 sm:border-l sm:border-slate-700 sm:pl-3">
          <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-extrabold text-[10px] border border-blue-400/30 shrink-0">
            ✍️ AJUSTE MANUAL
          </span>
          <span className="text-slate-300 text-xs">
            Los asesores pueden afinar y personalizar manualmente el copy de la propuesta y respuestas a objeciones.
          </span>
        </div>
      </div>

      {guardadoExitoso && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Ficha Comercial y Guía de Pitch actualizadas y guardadas con éxito.</span>
        </div>
      )}

      {/* Selector de Proyecto */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <label className="text-xs font-bold text-slate-700 block mb-2">
          Seleccionar Programa Formativo para Generar One-Pager:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {proyectos.map((p) => {
            const isSelected = p.id === proyectoActual?.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSeleccionarProyecto(p)}
                className={`text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-emerald-800 text-white border-emerald-900 shadow-sm'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                <div className="text-[10px] font-mono uppercase tracking-wider opacity-80">
                  {p.codigoPrograma || `SEC-${p.id}`}
                </div>
                <h4 className="text-xs font-black line-clamp-1 mt-0.5">{p.nombreProyecto}</h4>
                <div className="flex items-center justify-between text-[10px] mt-1 opacity-90">
                  <span>{p.nombreDocente}</span>
                  <span className="font-mono font-bold">{formatearMoneda(p.precioSugeridoAlumno, moneda)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenedor Principal: Vista Previa One-Pager + Configuración de Pitch */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Vista Previa del One-Pager (Brochure Digital) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border-2 border-emerald-700 shadow-md p-6 relative overflow-hidden">
            {/* Header del Brochure One-Pager */}
            <div className="flex items-start justify-between border-b-2 border-emerald-600 pb-4">
              <div className="flex items-center gap-3">
                <SummitLogo variant="full" size="md" />
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    FICHA TÉCNICA OFICIAL • ADMISIONES
                  </span>
                  <h2 className="text-lg font-black text-slate-900 leading-tight mt-1">
                    {proyectoActual?.nombreProyecto}
                  </h2>
                  <p className="text-xs font-semibold text-emerald-700">
                    Docente Titular: {proyectoActual?.nombreDocente} ({proyectoActual?.docenteEspecialidad || 'Especialista'})
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-500 font-semibold block">Inversión del Programa</span>
                <span className="text-xl font-black font-mono text-emerald-900">
                  {formatearMoneda(proyectoActual?.precioSugeridoAlumno || 0, moneda)}
                </span>
                <span className="text-[9px] text-emerald-700 font-bold block">
                  {proyectoActual?.aplicaISV ? '+ 15% ISV' : '0% ISV (Exento por Ley)'}
                </span>
              </div>
            </div>

            {/* Propuesta de Valor Destacada */}
            <div className="my-4 bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                Propuesta de Valor & Impacto Profesional
              </span>
              <p className="text-xs text-slate-800 font-medium mt-1 leading-relaxed">
                {propuestaValor}
              </p>
            </div>

            {/* Grid de 4 Datos Clave */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
                <Clock className="w-4 h-4 text-emerald-700 mx-auto" />
                <span className="text-[9px] text-slate-500 font-bold uppercase block mt-1">Duración</span>
                <span className="text-xs font-black text-slate-900 font-mono">
                  {proyectoActual?.horasClase || 24} hrs ({duracionSemanas} sem.)
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
                <Calendar className="w-4 h-4 text-emerald-700 mx-auto" />
                <span className="text-[9px] text-slate-500 font-bold uppercase block mt-1">Horario</span>
                <span className="text-xs font-black text-slate-900 line-clamp-1">
                  {proyectoActual?.diasClase || 'Sábados'}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
                <Target className="w-4 h-4 text-emerald-700 mx-auto" />
                <span className="text-[9px] text-slate-500 font-bold uppercase block mt-1">Modalidad</span>
                <span className="text-xs font-black text-slate-900">
                  {proyectoActual?.modalidad || 'En Vivo'}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
                <Award className="w-4 h-4 text-emerald-700 mx-auto" />
                <span className="text-[9px] text-slate-500 font-bold uppercase block mt-1">Certificación</span>
                <span className="text-xs font-black text-slate-900 line-clamp-1">
                  Aprobación QR
                </span>
              </div>
            </div>

            {/* Temario y Módulos Sintetizados */}
            <div className="my-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                Estructura Curricular & Temas Principales
              </h4>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-line max-h-36 overflow-y-auto">
                {proyectoActual?.temasImpartir ||
                  `Módulo 1: Fundamentos y Marco Metodológico
Módulo 2: Modelado Aplicado y Casos Empresariales
Módulo 3: Automatización y Herramientas Analíticas
Módulo 4: Proyecto Integrador de Graduación`}
              </div>
            </div>

            {/* Perfil del Egresado y Competencias */}
            <div className="my-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <span className="text-[10px] font-extrabold uppercase text-slate-800 block mb-1">
                  Perfil de Egreso
                </span>
                <p className="text-[11px] text-slate-600 leading-normal">{perfilEgresado}</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <span className="text-[10px] font-extrabold uppercase text-slate-800 block mb-1">
                  Público Dirigido
                </span>
                <p className="text-[11px] text-slate-600 leading-normal">{publicoObjetivo}</p>
              </div>
            </div>

            {/* Footer con Contacto Asesor Comercial */}
            <div className="mt-5 pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-slate-900">{contactoAsesorLead}</span>
                <span className="text-slate-500 block text-[11px]">WhatsApp & Admisiones: {telefonoWhatsAppLead}</span>
              </div>
              <div className="text-[10px] text-emerald-900 font-extrabold bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-300">
                Cupos Limitados por Aforo Pedagógico
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Configuración de Ficha & Argumentario de Venta (Pitch Guide) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Editor Rápido de Datos del One-Pager */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              Personalización de la Ficha Comercial
            </h4>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block">Propuesta de Valor Comercial:</label>
              <textarea
                value={propuestaValor}
                onChange={(e) => setPropuestaValor(e.target.value)}
                rows={2}
                className="w-full mt-1 p-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block">Duración (Semanas):</label>
                <input
                  type="number"
                  value={duracionSemanas}
                  onChange={(e) => setDuracionSemanas(Number(e.target.value))}
                  className="w-full mt-1 p-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block">Teléfono / WhatsApp Asesor:</label>
                <input
                  type="text"
                  value={telefonoWhatsAppLead}
                  onChange={(e) => setTelefonoWhatsAppLead(e.target.value)}
                  className="w-full mt-1 p-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block">Público Objetivo:</label>
              <textarea
                value={publicoObjetivo}
                onChange={(e) => setPublicoObjetivo(e.target.value)}
                rows={2}
                className="w-full mt-1 p-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Argumentario de Ventas (Pitch Guide & Manejo de Objeciones) */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              Argumentario de Ventas & Respuestas a Objeciones
            </h4>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {objeciones.map((item) => (
                <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      {item.objecion}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleEliminarObjecion(item.id)}
                      className="text-slate-400 hover:text-red-600 text-[10px]"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-700 pl-5 leading-normal bg-white p-2 rounded border border-slate-200">
                    <span className="font-bold text-emerald-700">Pitch recomendado: </span>
                    {item.respuestaPitch}
                  </p>
                </div>
              ))}
            </div>

            {/* Agregar nueva objeción */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-[10px] font-extrabold text-slate-700 uppercase block">
                + Agregar Nueva Objeción y Argumento:
              </span>
              <input
                type="text"
                placeholder="Ej. ¿Ofrecen facilidades de pago o cuotas?"
                value={nuevaObjecion}
                onChange={(e) => setNuevaObjecion(e.target.value)}
                className="w-full p-2 text-xs border border-slate-300 rounded-lg"
              />
              <textarea
                placeholder="Argumento de venta y respuesta oficial del asesor..."
                value={nuevaRespuesta}
                onChange={(e) => setNuevaRespuesta(e.target.value)}
                rows={2}
                className="w-full p-2 text-xs border border-slate-300 rounded-lg"
              />
              <button
                type="button"
                onClick={handleAgregarObjecion}
                className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Insertar en Guía de Pitch
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
