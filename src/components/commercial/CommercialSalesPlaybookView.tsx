import React, { useState } from 'react';
import { ProyectoEducativo, Moneda } from '../../types';
import {
  BookOpen,
  MessageSquare,
  Phone,
  Copy,
  Check,
  Sparkles,
  ShieldAlert,
  HelpCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Flame,
  Clock,
  DollarSign
} from 'lucide-react';
import { formatearMoneda } from '../../utils/calculations';

interface CommercialSalesPlaybookViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto: (p: ProyectoEducativo) => void;
}

export interface GuionVenta {
  id: string;
  canal: 'WhatsApp' | 'Llamada Telefónica' | 'Correo Electrónico';
  etapa: 'Primer Contacto' | 'Calificación' | 'Presentación de Precio' | 'Seguimiento' | 'Cierre de Urgencia';
  titulo: string;
  plantillaTexto: string;
}

export interface ObjecionComercial {
  id: string;
  objecion: string;
  categoria: 'Precio / Dinero' | 'Tiempo / Horario' | 'Autoridad / Confianza' | 'Postergación' | 'Aprobación Corporativa';
  respuestaRecomendada: string;
  preguntaCierre: string;
}

const GUIONES_INICIALES: GuionVenta[] = [
  {
    id: 'g-1',
    canal: 'WhatsApp',
    etapa: 'Primer Contacto',
    titulo: 'Saludo Inicial & Envío de Brochure',
    plantillaTexto: `¡Hola, [NOMBRE_PROSPECTO]! 👋 Un gusto saludarte. Te escribe [NOMBRE_ASESOR] de *SUMMIT Escuela de Formación Continua*.\n\nVi tu interés en el programa de especialización *[NOMBRE_CURSO]*. Contamos con la instrucción exclusiva del docente *[DOCENTE]*, enfocado 100% en casos prácticos y aplicación profesional inmediata.\n\n¿Te gustaría que te comparta el temario detallado y las opciones de beca preventa disponibles para esta cohorte? 🚀`
  },
  {
    id: 'g-2',
    canal: 'Llamada Telefónica',
    etapa: 'Calificación',
    titulo: 'Speech de Calificación y Detección de Necesidad',
    plantillaTexto: `Buenos días/tardes [NOMBRE_PROSPECTO], le saluda [NOMBRE_ASESOR] de SUMMIT. Lo contacto porque solicitó información sobre el curso de [NOMBRE_CURSO].\n\nAntes de darle los detalles de horarios e inversión, me gustaría consultarle: ¿Cuál es su objetivo principal al capacitarse en esta área? ¿Lo requiere para un proyecto puntual en su empresa o para ascender a una posición de mayor liderazgo?`
  },
  {
    id: 'g-3',
    canal: 'WhatsApp',
    etapa: 'Presentación de Precio',
    titulo: 'Presentación de Inversión + Facilidades en Cuotas',
    plantillaTexto: `Estimado(a) [NOMBRE_PROSPECTO], la inversión regular para *[NOMBRE_CURSO]* es de [PRECIO_REGULAR].\n\nSin embargo, por reservar tu cupo durante la fase *Early Bird*, tu inversión final queda en solo *[PRECIO_PREVENTA]* (incluye certificación con aval formal, material digital de por vida y acceso a las grabaciones en alta definición).\n\n💳 Además, contamos con facilidad de pago en *2 cuotas quincenales* sin intereses. ¿Prefieres realizar tu reserva hoy con transferencia bancaria o tarjeta de crédito?`
  },
  {
    id: 'g-4',
    canal: 'WhatsApp',
    etapa: 'Cierre de Urgencia',
    titulo: 'Sprint de Cierre: Últimos 2 Cupos',
    plantillaTexto: `¡Hola [NOMBRE_PROSPECTO]! Te escribo rápidamente porque estamos a solo 48 horas de cerrar matrículas para *[NOMBRE_CURSO]* y nos quedan exactamente *2 cupos disponibles* en el aforo virtual para garantizar la atención personalizada del profesor [DOCENTE].\n\n¿Deseas que te reserve uno de estos últimos lugares antes de abrir la lista de espera oficial? ⏳`
  }
];

const OBJECIONES_INICIALES: ObjecionComercial[] = [
  {
    id: 'obj-1',
    objecion: '«El precio se sale de mi presupuesto en este momento»',
    categoria: 'Precio / Dinero',
    respuestaRecomendada: 'Comprendo perfectamente su situación. Sin embargo, más que un gasto, este programa está diseñado para que el retorno de inversión sea inmediato. Un solo proyecto bien implementado con lo aprendido en clase cubre con creces el costo del curso. Además, podemos dividir la matrícula en dos pagos.',
    preguntaCierre: '¿Si le habilitamos la opción de iniciar hoy con el 50% de la matrícula y completar el resto a mitad de curso, le permitiría aprovechar esta cohorte?'
  },
  {
    id: 'obj-2',
    objecion: '«No tengo tiempo en este momento / tengo mucho trabajo»',
    categoria: 'Tiempo / Horario',
    respuestaRecomendada: 'Precisamente por eso nuestro formato está adaptado a profesionales con alta carga laboral. Las sesiones son 100% en vivo pero quedan grabadas en la plataforma con resúmenes ejecutivos y soporte directo del profesor en el foro.',
    preguntaCierre: '¿Si cuenta con acceso permanente a las grabaciones para revisarlas a su propio ritmo los fines de semana, le resultaría viable?'
  },
  {
    id: 'obj-3',
    objecion: '«Tengo que consultarlo con mi jefe / empresa para que me lo paguen»',
    categoria: 'Aprobación Corporativa',
    respuestaRecomendada: 'Excelente iniciativa. De hecho, el 40% de nuestros alumnos son patrocinados por sus empresas. Le podemos emitir una carta formal de postulación y cotización B2B institucional dirigida a su departamento de RRHH o jefatura.',
    preguntaCierre: '¿A nombre de quién y qué cargo redactamos la carta de propuesta corporativa para hacérsela llegar hoy mismo?'
  },
  {
    id: 'obj-4',
    objecion: '«Prefiero esperar a la próxima cohorte / edición»',
    categoria: 'Postergación',
    respuestaRecomendada: 'Nuestros programas de especialización abren convocatorias únicamente 2 veces al año con cupos reducidos para asegurar calidad. Esperar significará retrasar su certificación y actualización 6 meses más.',
    preguntaCierre: '¿Qué le parece si asegura su cupo hoy con la tarifa preferencial y garantizamos su lugar en el aula?'
  }
];

export const CommercialSalesPlaybookView: React.FC<CommercialSalesPlaybookViewProps> = ({
  proyectos,
  moneda,
  onGuardarProyecto: _onGuardarProyecto,
}) => {
  const [guiones, setGuiones] = useState<GuionVenta[]>(GUIONES_INICIALES);
  const [objeciones, setObjeciones] = useState<ObjecionComercial[]>(OBJECIONES_INICIALES);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<ProyectoEducativo>(proyectos[0] || {} as ProyectoEducativo);
  const [nombreAsesor, setNombreAsesor] = useState('Asesor Comercial SUMMIT');
  const [nombreProspecto, setNombreProspecto] = useState('Estimado(a) Colega');
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  // Formulario nueva objeción
  const [mostrarFormObjecion, setMostrarFormObjecion] = useState(false);
  const [nuevaObjecionTexto, setNuevaObjecionTexto] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState<ObjecionComercial['categoria']>('Precio / Dinero');
  const [nuevaRespuesta, setNuevaRespuesta] = useState('');
  const [nuevaPreguntaCierre, setNuevaPreguntaCierre] = useState('');

  // Formatear texto con placeholders
  const personalizarTexto = (texto: string): string => {
    if (!proyectoSeleccionado) return texto;
    const precioReg = formatearMoneda(proyectoSeleccionado.precioSugeridoConISV || proyectoSeleccionado.precioSugeridoAlumno || 2500, moneda);
    const precioEB = formatearMoneda(
      proyectoSeleccionado.precioEarlyBird || Math.round((proyectoSeleccionado.precioSugeridoConISV || 2500) * 0.85),
      moneda
    );

    return texto
      .replace(/\[NOMBRE_PROSPECTO\]/g, nombreProspecto)
      .replace(/\[NOMBRE_ASESOR\]/g, nombreAsesor)
      .replace(/\[NOMBRE_CURSO\]/g, proyectoSeleccionado.nombreProyecto || 'Curso Especializado')
      .replace(/\[DOCENTE\]/g, proyectoSeleccionado.nombreDocente || 'Especialista')
      .replace(/\[PRECIO_REGULAR\]/g, precioReg)
      .replace(/\[PRECIO_PREVENTA\]/g, precioEB);
  };

  const handleCopiar = (id: string, texto: string) => {
    navigator.clipboard.writeText(personalizarTexto(texto));
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2500);
  };

  const handleCrearObjecion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaObjecionTexto.trim() || !nuevaRespuesta.trim()) return;

    const nueva: ObjecionComercial = {
      id: `obj-${Date.now()}`,
      objecion: nuevaObjecionTexto.trim(),
      categoria: nuevaCategoria,
      respuestaRecomendada: nuevaRespuesta.trim(),
      preguntaCierre: nuevaPreguntaCierre.trim()
    };

    setObjeciones([nueva, ...objeciones]);
    setNuevaObjecionTexto('');
    setNuevaRespuesta('');
    setNuevaPreguntaCierre('');
    setMostrarFormObjecion(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-emerald-950 text-white p-5 rounded-2xl border border-teal-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-teal-500/20 text-teal-300 text-xs font-bold mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Manual de Conversión & Argumentario de Ventas</span>
            </div>
            <h2 className="text-xl font-black tracking-tight">
              Playbook Comercial, Speeches & Manejo de Objeciones
            </h2>
            <p className="text-xs text-teal-200/80 mt-0.5">
              Guiones para WhatsApp, llamadas de calificación y respuestas estructuradas para objeciones de prospectos.
            </p>
          </div>
        </div>

        {/* Barra de personalización de variables */}
        <div className="mt-4 pt-4 border-t border-teal-800/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-[11px] text-teal-300 font-bold mb-1">
              1. Programa a Personalizar:
            </label>
            <select
              value={proyectoSeleccionado?.id || ''}
              onChange={(e) => {
                const found = proyectos.find(p => p.id === e.target.value);
                if (found) setProyectoSeleccionado(found);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-900 text-white border border-teal-700 rounded-lg text-xs font-semibold"
            >
              {proyectos.map(p => (
                <option key={p.id} value={p.id}>{p.nombreProyecto}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-teal-300 font-bold mb-1">
              2. Nombre del Prospecto:
            </label>
            <input
              type="text"
              value={nombreProspecto}
              onChange={(e) => setNombreProspecto(e.target.value)}
              placeholder="Ej: Lic. Carlos Gómez"
              className="w-full px-2.5 py-1.5 bg-slate-900 text-white border border-teal-700 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] text-teal-300 font-bold mb-1">
              3. Nombre del Asesor:
            </label>
            <input
              type="text"
              value={nombreAsesor}
              onChange={(e) => setNombreAsesor(e.target.value)}
              placeholder="Ej: Andrea Vallecillo"
              className="w-full px-2.5 py-1.5 bg-slate-900 text-white border border-teal-700 rounded-lg text-xs"
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN 1: GUIONES DE CONVERSIÓN POR ETAPA */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Guiones y Speeches de Contacto (WhatsApp & Teléfono)</span>
          </h3>
          <span className="text-xs text-slate-500 font-semibold">
            Copie directamente el texto con los datos del curso ya incrustados
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guiones.map((g) => {
            const textoAdaptado = personalizarTexto(g.plantillaTexto);
            return (
              <div
                key={g.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between hover:border-emerald-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {g.etapa}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                      {g.canal === 'WhatsApp' ? <MessageSquare className="w-3 h-3 text-emerald-600" /> : <Phone className="w-3 h-3 text-blue-600" />}
                      {g.canal}
                    </span>
                  </div>

                  <h4 className="text-xs font-black text-slate-900 mb-2">
                    {g.titulo}
                  </h4>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-line leading-relaxed">
                    {textoAdaptado}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleCopiar(g.id, g.plantillaTexto)}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    {copiadoId === g.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-200" />
                        <span>¡Texto Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Mensaje Listo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECCIÓN 2: MATRIZ DE MANEJO DE OBJECIONES */}
      <div className="space-y-3 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Matriz de Manejo de Objeciones & Respuestas Recomendadas</span>
            </h3>
            <p className="text-xs text-slate-500">
              Argumentos probados para neutralizar dudas de presupuesto, tiempo y postergación.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setMostrarFormObjecion(!mostrarFormObjecion)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>✍️ Agregar Nueva Objeción</span>
          </button>
        </div>

        {mostrarFormObjecion && (
          <form onSubmit={handleCrearObjecion} className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200 space-y-3 text-xs">
            <h4 className="font-bold text-amber-950">Registrar Nueva Objeción al Playbook</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Frase de la Objeción *</label>
                <input
                  type="text"
                  required
                  value={nuevaObjecionTexto}
                  onChange={(e) => setNuevaObjecionTexto(e.target.value)}
                  placeholder="Ej: «El diplomado me parece muy largo»"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Categoría</label>
                <select
                  value={nuevaCategoria}
                  onChange={(e) => setNuevaCategoria(e.target.value as ObjecionComercial['categoria'])}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="Precio / Dinero">Precio / Dinero</option>
                  <option value="Tiempo / Horario">Tiempo / Horario</option>
                  <option value="Autoridad / Confianza">Autoridad / Confianza</option>
                  <option value="Postergación">Postergación</option>
                  <option value="Aprobación Corporativa">Aprobación Corporativa</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Respuesta y Reencuadre Recomendado *</label>
              <textarea
                rows={2}
                required
                value={nuevaRespuesta}
                onChange={(e) => setNuevaRespuesta(e.target.value)}
                placeholder="Argumento de valor que neutraliza la duda..."
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pregunta de Cierre Inmediato (Call to Action)</label>
              <input
                type="text"
                value={nuevaPreguntaCierre}
                onChange={(e) => setNuevaPreguntaCierre(e.target.value)}
                placeholder="Ej: ¿Le gustaría que le habilitemos el acceso de prueba por 24 horas?"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-amber-200">
              <button
                type="button"
                onClick={() => setMostrarFormObjecion(false)}
                className="px-3 py-1.5 text-slate-600 hover:bg-white rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg"
              >
                Guardar en Playbook
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {objeciones.map((o) => (
            <div
              key={o.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between hover:border-amber-300 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                    {o.categoria}
                  </span>
                </div>

                <h4 className="text-xs font-black text-slate-900 mb-2 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{o.objecion}</span>
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-0.5">
                      💡 Respuesta Sugerida:
                    </span>
                    <p className="text-slate-700 text-xs leading-relaxed">
                      {o.respuestaRecomendada}
                    </p>
                  </div>

                  {o.preguntaCierre && (
                    <div className="p-2 bg-blue-50/50 rounded-xl border border-blue-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block mb-0.5">
                        🎯 Pregunta de Cierre (CTA):
                      </span>
                      <p className="text-blue-950 font-semibold text-xs italic">
                        "{o.preguntaCierre}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
