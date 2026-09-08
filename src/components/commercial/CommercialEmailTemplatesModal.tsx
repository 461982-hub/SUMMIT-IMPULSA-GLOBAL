import React, { useState } from 'react';
import { 
  Mail, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  Sparkles, 
  Building2, 
  UserCheck, 
  Clock, 
  CreditCard, 
  Send,
  FileText
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { formatearHNL } from '../../utils/poa2027Data';

interface CommercialEmailTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onNotificar?: (msg: string) => void;
}

type TipoPlantilla = 'b2b_propuesta' | 'b2c_invitacion' | 'matricula_bancaria' | 'ultimos_cupos';

export const CommercialEmailTemplatesModal: React.FC<CommercialEmailTemplatesModalProps> = ({
  isOpen,
  onClose,
  proyectos,
  moneda,
  onNotificar,
}) => {
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoPlantilla>('b2b_propuesta');
  const [proyectoId, setProyectoId] = useState<string>(proyectos[0]?.id || '');
  const [nombreDestinatario, setNombreDestinatario] = useState<string>('Lic. Fernando Ramos');
  const [empresaDestinatario, setEmpresaDestinatario] = useState<string>('Corporación Flores S.A.');
  const [cargoDestinatario, setCargoDestinatario] = useState<string>('Gerente de Talento Humano');
  const [copiado, setCopiado] = useState<boolean>(false);

  if (!isOpen) return null;

  const proyecto = proyectos.find((p) => p.id === proyectoId) || proyectos[0];

  const precioRegular = proyecto?.precioSugeridoConISV || proyecto?.precioSugeridoAlumno || 2500;
  const precioEarlyBird = proyecto?.precioEarlyBird || Math.round(precioRegular * 0.85);
  const cuposDisponibles = Math.max(1, (proyecto?.alumnosProyectados || 20) - (proyecto?.alumnosFinal || 0));

  // Generador de Asunto y Cuerpo según el tipo
  const obtenerContenidoPlantilla = () => {
    if (!proyecto) {
      return {
        asunto: 'Propuesta de Capacitación Institucional - Summit Impulsa Global',
        cuerpo: 'Por favor seleccione un proyecto para generar la plantilla.',
      };
    }

    switch (tipoSeleccionado) {
      case 'b2b_propuesta':
        return {
          asunto: `Propuesta de Capacitación Ejecutiva: ${proyecto.nombreProyecto} • Summit Impulsa Global`,
          cuerpo: `Estimado(a) ${nombreDestinatario},
${cargoDestinatario} - ${empresaDestinatario}

Es un honor saludarle en nombre de Summit Impulsa Global, S.A. de C.V.

En atención al plan de fortalecimiento y desarrollo de competencias estratégicas de ${empresaDestinatario}, nos complace poner a su distinguida consideración nuestra propuesta formativa especializada:

PROGRAMA: ${proyecto.nombreProyecto}
• Facilitador / Docente Titular: ${proyecto.nombreDocente} (${proyecto.profesionDocente || 'Especialista del Área'})
• Duración Académica: ${proyecto.horasDocente} horas teórico-prácticas
• Modalidad: ${proyecto.modalidad} (con sesiones sincrónicas y plataforma 24/7)
• Fecha Estimada de Inicio: ${proyecto.fechaInicio || 'A convenir con la empresa'}
• Inversión por Colaborador: ${formatearHNL(precioRegular)} (Tarifas especiales para grupos de 3 o más colaboradores)
• Régimen Fiscal SAR: ${proyecto.aplicaISV ? 'Servicio Gravado con 15% ISV' : 'Educación Formal Exenta de ISV'} (Emitimos Facturación SAR con CAI)

BENEFICIOS INCLUIDOS:
1. Certificación Institucional Oficial con Código Único de Verificación para cada participante.
2. Acceso a plataforma de aprendizaje con grabaciones en alta resolución y material descargable.
3. Informes ejecutivos de asistencia, desempeño y calificaciones entregados a la Gerencia de Talento Humano.

Quedamos a su entera disposición para coordinar una breve llamada exploratoria o ajustar el contenido a los requerimientos específicos de su equipo.

Atentamente,

Lic. Marcio R. Aguilar
Gerencia de Comercialización
Summit Impulsa Global, S.A. de C.V.
Correo Oficial: comercializacion.summitg@gmail.com
Teléfono / WhatsApp: +504 9999-0000
Tegucigalpa, M.D.C., Honduras`,
        };

      case 'b2c_invitacion':
        return {
          asunto: `Invitación Oficial: ${proyecto.nombreProyecto} • Certifícate con Summit Impulsa Global`,
          cuerpo: `Estimado(a) ${nombreDestinatario},

Le extendemos un cordial saludo desde el equipo directivo de Summit Impulsa Global, S.A. de C.V.

Nos comunicamos para presentarle nuestro nuevo programa de alta especialización: "${proyecto.nombreProyecto}", diseñado para profesionales y líderes que buscan actualizar sus herramientas operativas e impulsar su competitividad en el mercado actual.

DETALLES CLAVE DEL PROGRAMA:
• Formador Principal: ${proyecto.nombreDocente}
• Carga Horaria: ${proyecto.horasDocente} horas académicas
• Modalidad: ${proyecto.modalidad}
• Inversión Regular: ${formatearHNL(precioRegular)}
• Tarifa Especial Preventa Anticipada (15% OFF): ${formatearHNL(precioEarlyBird)} (Válido por tiempo limitado)

Cupos limitados para garantizar una interacción personalizada y resolución de casos reales.

Si desea asegurar su matrícula o recibir el temario detallado (Syllabus Oficial), responda a este correo o contáctenos vía WhatsApp al +504 9999-0000.

Cordialmente,

Equipo de Admisiones y Comercialización
Summit Impulsa Global, S.A. de C.V.
comercializacion.summitg@gmail.com`,
        };

      case 'matricula_bancaria':
        return {
          asunto: `Instrucciones Oficiales de Matrícula & Cuentas Bancarias • ${proyecto.nombreProyecto}`,
          cuerpo: `Estimado(a) ${nombreDestinatario},

¡Gracias por su interés en matricularse en el programa "${proyecto.nombreProyecto}" de Summit Impulsa Global, S.A. de C.V.!

Para formalizar su registro y asegurar su plaza en el aula virtual, le compartimos los datos oficiales para realizar su transferencia o depósito bancario:

CUENTAS BANCARIAS OFICIALES (SUMMIT IMPULSA GLOBAL, S.A. DE C.V.):
• Beneficiario: Summit Impulsa Global, S.A. de C.V.
• RTN Institucional: 08019024000000
• Banco Ficohsa (Cuenta de Cheques HNL): 2000-1234-5678-90
• Banco Atlántida (Cuenta de Cheques HNL): 1100-9876-5432-10

DETALLE DE LA MATRÍCULA:
• Programa: ${proyecto.nombreProyecto}
• Inversión Confirmada: ${formatearHNL(precioEarlyBird > 0 ? precioEarlyBird : precioRegular)}
• Modalidad: ${proyecto.modalidad}

PASOS SIGUIENTES:
1. Realice la transferencia o depósito bancario.
2. Envíe el comprobante de pago respondiendo a este correo o al WhatsApp +504 9999-0000 indicando:
   - Nombre completo (tal como aparecerá en su diploma oficial).
   - Número de Identidad / DNI.
   - Correo electrónico para habilitar su usuario de aula virtual.

Una vez recibido su comprobante, la Gerencia Académica le enviará sus credenciales de acceso y el enlace a la sesión inaugural.

¡Bienvenido(a) a la comunidad de Summit Impulsa Global!

Atentamente,

Dpto. de Facturación y Admisiones
Summit Impulsa Global, S.A. de C.V.`,
        };

      case 'ultimos_cupos':
        return {
          asunto: `⚠️ Últimos ${cuposDisponibles} cupos disponibles: ${proyecto.nombreProyecto} (Cierre de Inscripciones)`,
          cuerpo: `Estimado(a) ${nombreDestinatario},

Le escribimos brevemente para informarle que el proceso de matrícula para el programa "${proyecto.nombreProyecto}" está por concluir, restando únicamente ${cuposDisponibles} cupos disponibles.

INFORMACIÓN RÁPIDA:
• Inicio: ${proyecto.fechaInicio || 'Próxima semana'}
• Modalidad: ${proyecto.modalidad}
• Docente: ${proyecto.nombreDocente}
• Inversión: ${formatearHNL(precioRegular)}

Si aún desea participar y acreditar sus horas formativas con nosotros, le invitamos a responder inmediatamente para reservar su espacio antes de que el cupo quede cerrado de forma definitiva.

Saludos cordiales,

Gerencia de Comercialización
Summit Impulsa Global, S.A. de C.V.`,
        };
    }
  };

  const { asunto, cuerpo } = obtenerContenidoPlantilla();

  const handleCopiarTodo = () => {
    const textoCompleto = `ASUNTO: ${asunto}\n\n${cuerpo}`;
    navigator.clipboard.writeText(textoCompleto);
    setCopiado(true);
    if (onNotificar) onNotificar('¡Plantilla de correo copiada al portapapeles!');
    setTimeout(() => setCopiado(false), 3000);
  };

  const handleAbrirEnGmail = () => {
    const mailto = `mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
    window.open(mailto, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Encabezado */}
        <div className="p-4 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-400/30">
              <Mail className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                  Plantillas de Correo Institucional B2B / B2C
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full">
                  1 Clic
                </span>
              </div>
              <p className="text-[11px] text-blue-200/90">
                Redacte propuestas corporativas, cartas formales y confirmaciones bancarias SAR en segundos.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Tipos de Plantilla */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTipoSeleccionado('b2b_propuesta')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              tipoSeleccionado === 'b2b_propuesta'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>1. Propuesta B2B Corporativa</span>
          </button>

          <button
            type="button"
            onClick={() => setTipoSeleccionado('b2c_invitacion')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              tipoSeleccionado === 'b2c_invitacion'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>2. Invitación Directa Profesional</span>
          </button>

          <button
            type="button"
            onClick={() => setTipoSeleccionado('matricula_bancaria')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              tipoSeleccionado === 'matricula_bancaria'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>3. Datos Bancarios & Pago Oficial</span>
          </button>

          <button
            type="button"
            onClick={() => setTipoSeleccionado('ultimos_cupos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              tipoSeleccionado === 'ultimos_cupos'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>4. Urgencia Últimos Cupos</span>
          </button>
        </div>

        {/* Campos de Personalización Rápida */}
        <div className="p-3 bg-white border-b border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
          <div>
            <label className="block text-[10.5px] font-bold text-slate-600 uppercase mb-0.5">
              Programa / Curso:
            </label>
            <select
              value={proyectoId}
              onChange={(e) => setProyectoId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-900"
            >
              {proyectos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombreProyecto}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10.5px] font-bold text-slate-600 uppercase mb-0.5">
              Nombre Destinatario:
            </label>
            <input
              type="text"
              value={nombreDestinatario}
              onChange={(e) => setNombreDestinatario(e.target.value)}
              placeholder="Ej: Lic. Carlos Mendoza"
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
            />
          </div>

          <div>
            <label className="block text-[10.5px] font-bold text-slate-600 uppercase mb-0.5">
              Empresa Cliente:
            </label>
            <input
              type="text"
              value={empresaDestinatario}
              onChange={(e) => setEmpresaDestinatario(e.target.value)}
              placeholder="Ej: Grupo Financiero S.A."
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
            />
          </div>

          <div>
            <label className="block text-[10.5px] font-bold text-slate-600 uppercase mb-0.5">
              Cargo Destinatario:
            </label>
            <input
              type="text"
              value={cargoDestinatario}
              onChange={(e) => setCargoDestinatario(e.target.value)}
              placeholder="Ej: Gerente de RRHH"
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
            />
          </div>
        </div>

        {/* Previsualización del Correo */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-slate-50/50 space-y-3 font-mono text-xs">
          
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Línea de Asunto:</span>
            <p className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5 font-sans">
              {asunto}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-slate-500 block mb-2">Cuerpo del Correo Oficial:</span>
            <pre className="whitespace-pre-wrap font-sans text-xs text-slate-800 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              {cuerpo}
            </pre>
          </div>

        </div>

        {/* Pie de Acciones Rápidas */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-slate-600">
            Firma predeterminada: <strong className="text-slate-800">Lic. Marcio R. Aguilar • Gerencia de Comercialización</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopiarTodo}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                copiado
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiado ? '¡Copiado al Portapapeles!' : 'Copiar Asunto y Mensaje'}</span>
            </button>

            <button
              type="button"
              onClick={handleAbrirEnGmail}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Abrir en Cliente de Correo</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
