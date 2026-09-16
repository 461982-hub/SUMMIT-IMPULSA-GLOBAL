import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Sparkles, 
  Hash, 
  MessageSquare, 
  Save, 
  Plus, 
  Trash2, 
  Check, 
  RotateCcw, 
  Phone, 
  Globe, 
  Building, 
  Copy, 
  CheckCheck,
  Megaphone,
  Eye,
  ArrowRight
} from 'lucide-react';
import { 
  PreferenciasRedesSocialesComercial, 
  PlantillaHashtags, 
  PlantillaCTA, 
  TonoVozPublicidad,
  ProyectoEducativo,
  Moneda 
} from '../../types';
import { 
  obtenerPreferenciasRedesSociales, 
  guardarPreferenciasRedesSociales,
  DESCRIPCIONES_TONOS,
  PLANTILLAS_HASHTAGS_DEFECTO,
  PLANTILLAS_CTA_DEFECTO,
  PREFERENCIAS_REDES_POR_DEFECTO,
  generarCopyPublicitarioConPreferencias
} from '../../utils/socialPreferencesUtils';

interface CommercialSocialPreferencesPanelProps {
  proyectos?: ProyectoEducativo[];
  moneda?: Moneda;
  esModal?: boolean;
  onCerrarModal?: () => void;
  onGuardar?: (prefs: PreferenciasRedesSocialesComercial) => void;
  onNotificar?: (mensaje: string) => void;
  onAbrirFlyerConProyecto?: (proyecto: ProyectoEducativo) => void;
}

export const CommercialSocialPreferencesPanel: React.FC<CommercialSocialPreferencesPanelProps> = ({
  proyectos = [],
  moneda = 'LPS',
  esModal = false,
  onCerrarModal,
  onGuardar,
  onNotificar,
  onAbrirFlyerConProyecto,
}) => {
  const [preferencias, setPreferencias] = useState<PreferenciasRedesSocialesComercial>(obtenerPreferenciasRedesSociales);
  const [tabActiva, setTabActiva] = useState<'tono_voz' | 'hashtags' | 'cta' | 'contacto' | 'simulador'>('tono_voz');
  
  // Estado para nuevo hashtag individual
  const [nuevoHashtagInput, setNuevoHashtagInput] = useState('');
  
  // Estado para nuevo CTA
  const [nuevoCtaTexto, setNuevoCtaTexto] = useState('');
  const [nuevoCtaSubtexto, setNuevoCtaSubtexto] = useState('');
  const [nuevoCtaCanal, setNuevoCtaCanal] = useState<'whatsapp' | 'web' | 'directo'>('whatsapp');
  const [mostrarFormNuevoCta, setMostrarFormNuevoCta] = useState(false);

  // Estado para nueva plantilla de hashtags
  const [nuevoNombrePlantilla, setNuevoNombrePlantilla] = useState('');
  const [mostrarFormNuevaPlantillaTags, setMostrarFormNuevaPlantillaTags] = useState(false);

  // Proyecto seleccionado para simulador
  const [proyectoSimuladorId, setProyectoSimuladorId] = useState<string>(() => {
    return proyectos[0]?.id || '';
  });

  // Estado de copiado en simulador
  const [copiado, setCopiado] = useState(false);
  const [guardadoReciente, setGuardadoReciente] = useState(false);

  // Sincronizar proyecto seleccionado
  useEffect(() => {
    if (proyectos.length > 0 && !proyectoSimuladorId) {
      setProyectoSimuladorId(proyectos[0].id);
    }
  }, [proyectos, proyectoSimuladorId]);

  // Proyecto activo para simulador
  const proyectoSimulador = proyectos.find((p) => p.id === proyectoSimuladorId) || proyectos[0] || null;

  // Plantilla activa
  const plantillaActiva = preferencias.plantillasHashtags.find((p) => p.id === preferencias.plantillaHashtagsActivaId) 
    || preferencias.plantillasHashtags[0];

  // CTA activo
  const ctaActivo = preferencias.plantillasCTA.find((c) => c.id === preferencias.ctaPredeterminadoId) 
    || preferencias.plantillasCTA[0];

  // Cambiar tono de voz
  const handleSeleccionarTono = (tono: TonoVozPublicidad) => {
    setPreferencias((prev) => ({
      ...prev,
      tonoVozPredeterminado: tono,
    }));
  };

  // Cambiar CTA predeterminado
  const handleSeleccionarCTA = (ctaId: string) => {
    setPreferencias((prev) => ({
      ...prev,
      ctaPredeterminadoId: ctaId,
    }));
  };

  // Cambiar plantilla de hashtags activa
  const handleSeleccionarPlantillaTags = (plantillaId: string) => {
    setPreferencias((prev) => ({
      ...prev,
      plantillaHashtagsActivaId: plantillaId,
    }));
  };

  // Agregar hashtag a la plantilla activa
  const handleAgregarHashtag = () => {
    let tag = nuevoHashtagInput.trim();
    if (!tag) return;
    if (!tag.startsWith('#')) {
      tag = `#${tag}`;
    }
    tag = tag.replace(/\s+/g, '');

    setPreferencias((prev) => {
      const actualizadas = prev.plantillasHashtags.map((pl) => {
        if (pl.id === prev.plantillaHashtagsActivaId) {
          if (pl.hashtags.includes(tag)) return pl;
          return {
            ...pl,
            hashtags: [...pl.hashtags, tag],
          };
        }
        return pl;
      });
      return { ...prev, plantillasHashtags: actualizadas };
    });
    setNuevoHashtagInput('');
  };

  // Eliminar hashtag de la plantilla activa
  const handleEliminarHashtag = (tagAEliminar: string) => {
    setPreferencias((prev) => {
      const actualizadas = prev.plantillasHashtags.map((pl) => {
        if (pl.id === prev.plantillaHashtagsActivaId) {
          return {
            ...pl,
            hashtags: pl.hashtags.filter((t) => t !== tagAEliminar),
          };
        }
        return pl;
      });
      return { ...prev, plantillasHashtags: actualizadas };
    });
  };

  // Crear nueva plantilla de hashtags
  const handleCrearNuevaPlantillaTags = () => {
    if (!nuevoNombrePlantilla.trim()) return;
    const nueva: PlantillaHashtags = {
      id: `tag-custom-${Date.now()}`,
      nombre: nuevoNombrePlantilla.trim(),
      categoria: 'Personalizada',
      hashtags: ['#SummitImpulsa', '#EducacionEjecutiva'],
    };
    setPreferencias((prev) => ({
      ...prev,
      plantillasHashtags: [...prev.plantillasHashtags, nueva],
      plantillaHashtagsActivaId: nueva.id,
    }));
    setNuevoNombrePlantilla('');
    setMostrarFormNuevaPlantillaTags(false);
  };

  // Eliminar plantilla de hashtags personalizada
  const handleEliminarPlantillaTags = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (preferencias.plantillasHashtags.length <= 1) return;
    setPreferencias((prev) => {
      const filtradas = prev.plantillasHashtags.filter((p) => p.id !== id);
      const nuevoActivoId = prev.plantillaHashtagsActivaId === id ? filtradas[0].id : prev.plantillaHashtagsActivaId;
      return {
        ...prev,
        plantillasHashtags: filtradas,
        plantillaHashtagsActivaId: nuevoActivoId,
      };
    });
  };

  // Crear nuevo CTA
  const handleCrearNuevoCTA = () => {
    if (!nuevoCtaTexto.trim()) return;
    const nuevo: PlantillaCTA = {
      id: `cta-custom-${Date.now()}`,
      texto: nuevoCtaTexto.trim(),
      subtexto: nuevoCtaSubtexto.trim() || undefined,
      canalRecomendado: nuevoCtaCanal,
    };
    setPreferencias((prev) => ({
      ...prev,
      plantillasCTA: [...prev.plantillasCTA, nuevo],
      ctaPredeterminadoId: nuevo.id,
    }));
    setNuevoCtaTexto('');
    setNuevoCtaSubtexto('');
    setMostrarFormNuevoCta(false);
  };

  // Eliminar CTA
  const handleEliminarCTA = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (preferencias.plantillasCTA.length <= 1) return;
    setPreferencias((prev) => {
      const filtradas = prev.plantillasCTA.filter((c) => c.id !== id);
      const nuevoActivoId = prev.ctaPredeterminadoId === id ? filtradas[0].id : prev.ctaPredeterminadoId;
      return {
        ...prev,
        plantillasCTA: filtradas,
        ctaPredeterminadoId: nuevoActivoId,
      };
    });
  };

  // Restaurar valores por defecto
  const handleRestaurarDefecto = () => {
    if (confirm('¿Desea restablecer todas las preferencias de redes sociales a los valores corporativos originales?')) {
      setPreferencias({ ...PREFERENCIAS_REDES_POR_DEFECTO });
      guardarPreferenciasRedesSociales({ ...PREFERENCIAS_REDES_POR_DEFECTO });
      if (onNotificar) {
        onNotificar('Preferencias de redes sociales restablecidas a valores de fábrica.');
      }
    }
  };

  // Guardar permanente
  const handleGuardar = () => {
    guardarPreferenciasRedesSociales(preferencias);
    setGuardadoReciente(true);
    setTimeout(() => setGuardadoReciente(false), 3000);
    if (onGuardar) {
      onGuardar(preferencias);
    }
    if (onNotificar) {
      onNotificar('Preferencias de redes sociales guardadas. Se aplicarán automáticamente al generar imágenes de publicidad para los proyectos.');
    }
    if (esModal && onCerrarModal) {
      onCerrarModal();
    }
  };

  // Texto generado en el simulador
  const copySimulado = proyectoSimulador
    ? generarCopyPublicitarioConPreferencias(proyectoSimulador, preferencias, (moneda || 'LPS') as Moneda)
    : `🔥 ¡CONVOCATORIA CONFIRMADA • SUMMIT IMPULSA GLOBAL!
Tono configurado: ${DESCRIPCIONES_TONOS[preferencias.tonoVozPredeterminado].nombre} (${DESCRIPCIONES_TONOS[preferencias.tonoVozPredeterminado].emoji})

📌 DIPLOMADO EJECUTIVO EN FINANZAS CORPORATIVAS Y GESTIÓN TRIBUTARIA SAR 2026
👨‍🏫 Docente: Facilitador Especialista
📅 Inicio: Próxima Apertura • ⏰ 06:00 PM - 08:00 PM
⏳ 24 Horas Acreditadas • Modalidad Virtual Interactiva Zoom

💰 Inversión con Descuento de Preventa Early Bird

${ctaActivo ? ctaActivo.texto : '📲 ¡Inscríbete hoy por WhatsApp y asegura tu lugar!'}

📲 WhatsApp Admisiones: ${preferencias.telefonoWhatsAppPredeterminado || '+504 9500-1234'}
🌐 Portal Web: ${preferencias.linkRegistroPredeterminado || 'https://summitimpulsaglobal.com'}

${plantillaActiva ? plantillaActiva.hashtags.join(' ') : '#SummitImpulsa'}`;

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col ${esModal ? 'h-full' : ''}`}>
      {/* Cabecera del Panel */}
      <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-900/50 shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-400/20 shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                Gerencia de Comercialización
              </span>
              <span className="text-xs text-indigo-200 font-semibold">Configuración Central de Difusión</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
              Panel de Configuración de Redes Sociales & Marketing
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Define y guarda plantillas de hashtags, tonos de voz y llamadas a la acción (CTA) que se aplican automáticamente al generar imágenes de publicidad para los proyectos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={handleRestaurarDefecto}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700/60"
            title="Restablecer valores originales corporativos"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Valores por Defecto</span>
          </button>

          <button
            type="button"
            onClick={handleGuardar}
            className={`px-4 py-2 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer ${
              guardadoReciente
                ? 'bg-emerald-400 ring-2 ring-emerald-300 scale-105'
                : 'bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 hover:scale-[1.02]'
            }`}
          >
            {guardadoReciente ? (
              <>
                <CheckCheck className="w-4 h-4 text-emerald-950 stroke-[2.5]" />
                <span>¡Guardado Exitoso!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                <span>Guardar Configuración</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Barra de Pestañas */}
      <div className="px-6 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0 py-2.5">
        <button
          type="button"
          onClick={() => setTabActiva('tono_voz')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            tabActiva === 'tono_voz'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>1. Tonos de Voz ({DESCRIPCIONES_TONOS[preferencias.tonoVozPredeterminado]?.nombre || 'Activo'})</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('hashtags')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            tabActiva === 'hashtags'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Hash className="w-3.5 h-3.5 text-teal-300" />
          <span>2. Plantillas de Hashtags ({preferencias.plantillasHashtags.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('cta')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            tabActiva === 'cta'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-emerald-300" />
          <span>3. Llamadas a la Acción (CTA) ({preferencias.plantillasCTA.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('contacto')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            tabActiva === 'contacto'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Phone className="w-3.5 h-3.5 text-blue-300" />
          <span>4. Canales de Contacto & Enlaces</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('simulador')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            tabActiva === 'simulador'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Eye className="w-3.5 h-3.5 text-amber-300" />
          <span>5. Simulador de Proyecto & Lanzar Flyer</span>
        </button>
      </div>

      {/* Contenido Principal de Pestañas */}
      <div className="p-6 overflow-y-auto max-h-[calc(85vh-160px)] space-y-6">
        {/* ========================================================================= */}
        {/* TAB 1: TONOS DE VOZ PREDEFINIDOS */}
        {/* ========================================================================= */}
        {tabActiva === 'tono_voz' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wide">
                  Tono de Voz Persuasivo y Redacción Automatizada
                </h4>
                <p className="text-xs text-indigo-900 mt-0.5 leading-relaxed">
                  El tono de voz predeterminado modula la estructura de apertura, el llamado a la urgencia y el estilo de los titulares al generar automáticamente copys y las imágenes de publicidad para cualquier proyecto educativo.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.keys(DESCRIPCIONES_TONOS) as TonoVozPublicidad[]).map((tonoKey) => {
                const info = DESCRIPCIONES_TONOS[tonoKey];
                const estaSeleccionado = preferencias.tonoVozPredeterminado === tonoKey;

                return (
                  <div
                    key={tonoKey}
                    onClick={() => handleSeleccionarTono(tonoKey)}
                    className={`rounded-2xl p-5 border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                      estaSeleccionado
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-300/40'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{info.emoji}</span>
                          <div>
                            <h4 className="text-sm font-black text-slate-900 leading-tight">
                              {info.nombre}
                            </h4>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-600 font-bold">
                              {tonoKey}
                            </span>
                          </div>
                        </div>

                        {estaSeleccionado ? (
                          <span className="inline-flex items-center gap-1 bg-indigo-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Predeterminado</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600 font-semibold px-2 py-0.5 rounded-lg border border-slate-200">
                            Clic para activar
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        {info.descripcion}
                      </p>

                      <div className="mt-4 bg-slate-900 text-slate-200 p-3 rounded-xl text-xs space-y-1">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1">
                          <Megaphone className="w-3 h-3" />
                          Ejemplo de redacción generada:
                        </span>
                        <p className="text-xs italic text-slate-300 leading-relaxed">
                          "{info.ejemplo}"
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-600">Impacto en Flyers e Imágenes:</span>
                      <span className="font-bold text-indigo-700">
                        Ajusta titular, badge y mensaje de urgencia
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PLANTILLAS DE HASHTAGS */}
        {/* ========================================================================= */}
        {tabActiva === 'hashtags' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Hash className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-teal-950 uppercase tracking-wide">
                  Gestión de Colecciones de Hashtags Institucionales
                </h4>
                <p className="text-xs text-teal-900 mt-0.5 leading-relaxed">
                  Crea y organiza conjuntos de etiquetas para distintas temáticas (tributaria, tecnología, liderazgo, convocatorias generales). La plantilla activa se aplicará automáticamente en los copies y en la barra de etiquetas del flyer.
                </p>
              </div>
            </div>

            {/* Selector de Plantilla de Hashtags */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                  Plantillas Disponibles ({preferencias.plantillasHashtags.length}):
                </label>
                <button
                  type="button"
                  onClick={() => setMostrarFormNuevaPlantillaTags(!mostrarFormNuevaPlantillaTags)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear Nueva Plantilla</span>
                </button>
              </div>

              {mostrarFormNuevaPlantillaTags && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={nuevoNombrePlantilla}
                    onChange={(e) => setNuevoNombrePlantilla(e.target.value)}
                    placeholder="Nombre de la colección (ej. Diplomados en Salud, Ventas B2B...)"
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleCrearNuevaPlantillaTags}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                  >
                    Guardar Colección
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {preferencias.plantillasHashtags.map((p) => {
                  const estaActiva = p.id === preferencias.plantillaHashtagsActivaId;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSeleccionarPlantillaTags(p.id)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                        estaActiva
                          ? 'border-teal-600 bg-teal-50/60 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <span className="text-[9px] font-mono uppercase tracking-wider font-bold bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded">
                            {p.categoria || 'Colección'}
                          </span>
                          <h5 className="text-xs font-black text-slate-900 mt-1 line-clamp-1">
                            {p.nombre}
                          </h5>
                          <span className="text-[11px] text-slate-600 font-medium">
                            {p.hashtags.length} hashtags
                          </span>
                        </div>

                        {estaActiva ? (
                          <span className="bg-teal-600 text-white rounded-full p-1 shadow-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        ) : p.id.startsWith('tag-custom') ? (
                          <button
                            type="button"
                            onClick={(e) => handleEliminarPlantillaTags(p.id, e)}
                            className="p-1 text-slate-600 hover:text-red-500 rounded transition-colors"
                            title="Eliminar plantilla personalizada"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Editor de Hashtags de la Plantilla Activa */}
            {plantillaActiva && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">
                        Hashtags de la plantilla: "{plantillaActiva.nombre}"
                      </span>
                      <span className="text-[10px] bg-teal-100 text-teal-900 font-bold px-2 py-0.5 rounded-full">
                        {plantillaActiva.hashtags.length} activos
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Haz clic en la 'x' para remover un hashtag o escribe uno nuevo abajo para agregarlo.
                    </p>
                  </div>
                </div>

                {/* Chips de hashtags */}
                <div className="flex flex-wrap gap-2">
                  {plantillaActiva.hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
                    >
                      <Hash className="w-3 h-3 text-teal-600" />
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleEliminarHashtag(tag)}
                        className="w-4 h-4 rounded-full hover:bg-red-500 hover:text-white flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                        title="Eliminar etiqueta"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                {/* Formulario para agregar hashtag */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-slate-600 font-bold text-xs">#</span>
                    <input
                      type="text"
                      value={nuevoHashtagInput}
                      onChange={(e) => setNuevoHashtagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAgregarHashtag();
                        }
                      }}
                      placeholder="Escribe nuevo hashtag (ej: Liderazgo2026) y presiona Enter..."
                      className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAgregarHashtag}
                    className="px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Etiqueta</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: LLAMADAS A LA ACCIÓN (CTA) */}
        {/* ========================================================================= */}
        {tabActiva === 'cta' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                  Llamadas a la Acción (CTA) de Cierre y Conversión
                </h4>
                <p className="text-xs text-emerald-900 mt-0.5 leading-relaxed">
                  Define las frases de cierre con las que invitas a los prospectos a reservar su cupo, solicitar el brochure o escribir por WhatsApp. La plantilla seleccionada se dibuja en la barra inferior del flyer e inicia los copys digitales.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Plantillas de CTA Disponibles ({preferencias.plantillasCTA.length}):
              </label>
              <button
                type="button"
                onClick={() => setMostrarFormNuevoCta(!mostrarFormNuevoCta)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Nuevo CTA</span>
              </button>
            </div>

            {mostrarFormNuevoCta && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h5 className="text-xs font-black text-slate-800 uppercase">Nuevo Llamado a la Acción</h5>
                <input
                  type="text"
                  value={nuevoCtaTexto}
                  onChange={(e) => setNuevoCtaTexto(e.target.value)}
                  placeholder="Frase principal (ej: ⚡ ¡Cupos exclusivos de preventa! Reserva con el 50% hoy mismo)"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <input
                  type="text"
                  value={nuevoCtaSubtexto}
                  onChange={(e) => setNuevoCtaSubtexto(e.target.value)}
                  placeholder="Subtexto opcional (ej: Atención personalizada con asesor de admisiones)"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-600 font-semibold">Canal recomendado:</span>
                    <select
                      value={nuevoCtaCanal}
                      onChange={(e) => setNuevoCtaCanal(e.target.value as any)}
                      className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="whatsapp">WhatsApp Directo</option>
                      <option value="web">Sitio Web / Registro</option>
                      <option value="directo">Contacto Directo General</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleCrearNuevoCTA}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                  >
                    Guardar CTA
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {preferencias.plantillasCTA.map((cta) => {
                const esPredeterminado = cta.id === preferencias.ctaPredeterminadoId;
                return (
                  <div
                    key={cta.id}
                    onClick={() => handleSeleccionarCTA(cta.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      esPredeterminado
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-300/40'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">
                          {cta.texto}
                        </span>
                        <span className="text-[9px] uppercase font-bold font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                          {cta.canalRecomendado || 'whatsapp'}
                        </span>
                      </div>
                      {cta.subtexto && (
                        <p className="text-[11px] text-slate-600">
                          {cta.subtexto}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {esPredeterminado ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Predeterminado</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSeleccionarCTA(cta.id);
                          }}
                          className="text-xs text-slate-600 hover:text-slate-900 font-semibold px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100"
                        >
                          Elegir como Activo
                        </button>
                      )}

                      {cta.id.startsWith('cta-custom') && (
                        <button
                          type="button"
                          onClick={(e) => handleEliminarCTA(cta.id, e)}
                          className="p-1.5 text-slate-600 hover:text-red-500 rounded transition-colors"
                          title="Eliminar CTA"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: CANALES DE CONTACTO & ENLACES */}
        {/* ========================================================================= */}
        {tabActiva === 'contacto' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-blue-950 uppercase tracking-wide">
                  Datos de Contacto Institucionales para Honduras
                </h4>
                <p className="text-xs text-blue-900 mt-0.5 leading-relaxed">
                  Estos datos se incorporan en los enlaces UTM, en el botón directo de WhatsApp y en el pie del flyer publicitario de cada proyecto educativo.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <label className="text-xs font-black text-slate-900 uppercase">
                    Teléfono Oficial de WhatsApp (Admisiones)
                  </label>
                </div>
                <input
                  type="text"
                  value={preferencias.telefonoWhatsAppPredeterminado || ''}
                  onChange={(e) => setPreferencias((prev) => ({ ...prev, telefonoWhatsAppPredeterminado: e.target.value }))}
                  placeholder="+504 9500-1234"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <span className="text-[11px] text-slate-600 block">
                  Incluye el prefijo nacional <strong>+504</strong> para Honduras.
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <label className="text-xs font-black text-slate-900 uppercase">
                    Enlace Web Oficial de Registro
                  </label>
                </div>
                <input
                  type="text"
                  value={preferencias.linkRegistroPredeterminado || ''}
                  onChange={(e) => setPreferencias((prev) => ({ ...prev, linkRegistroPredeterminado: e.target.value }))}
                  placeholder="https://summitimpulsaglobal.com"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <span className="text-[11px] text-slate-600 block">
                  Página de aterrizaje institucional o catálogo de programas.
                </span>
              </div>

              <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-600" />
                  <label className="text-xs font-black text-slate-900 uppercase">
                    Pie de Página Institucional & RTN
                  </label>
                </div>
                <input
                  type="text"
                  value={preferencias.piePaginaPredeterminado || ''}
                  onChange={(e) => setPreferencias((prev) => ({ ...prev, piePaginaPredeterminado: e.target.value }))}
                  placeholder="SUMMIT IMPULSA GLOBAL, S.A. DE C.V. • RTN: 05019026435770 • San Pedro Sula, Honduras"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <span className="text-[11px] text-slate-600 block">
                  Texto legal de acreditación que se imprime en la parte inferior del flyer canvas.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: SIMULADOR DE PROYECTO & GENERADOR DE FLYER */}
        {/* ========================================================================= */}
        {tabActiva === 'simulador' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 border border-emerald-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-400 text-slate-950 px-2 py-0.5 rounded shadow-xs">
                  ⚡ Aplicación Automática Inmediata
                </span>
                <h4 className="text-sm sm:text-base font-black text-white mt-1">
                  Simula y Genera el Flyer con Estas Preferencias
                </h4>
                <p className="text-xs text-emerald-200/80 mt-0.5 max-w-xl">
                  Selecciona cualquiera de tus proyectos educativos para comprobar en tiempo real cómo se combinan el tono de voz, la plantilla de hashtags y la llamada a la acción.
                </p>
              </div>

              {proyectoSimulador && onAbrirFlyerConProyecto && (
                <button
                  type="button"
                  onClick={() => {
                    handleGuardar();
                    onAbrirFlyerConProyecto(proyectoSimulador);
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0 border border-emerald-300 hover:scale-105"
                >
                  <Megaphone className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                  <span>🎨 Abrir Diseñador de Flyer para este Proyecto</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Selector de Proyecto */}
            {proyectos.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Proyecto a simular:</span>
                  <select
                    value={proyectoSimuladorId}
                    onChange={(e) => setProyectoSimuladorId(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    {proyectos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.codigoProyecto || p.codigoPrograma || 'PRG'} - {p.nombreProyecto} ({p.nombreDocente})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-600">Tono activo:</span>
                  <strong className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {DESCRIPCIONES_TONOS[preferencias.tonoVozPredeterminado]?.nombre}
                  </strong>
                </div>
              </div>
            )}

            {/* Cuadro de Copy con botón de copiado */}
            <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 space-y-3 shadow-inner">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                    Copy Publicitario Formateado con Preferencias
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                    Listo para Meta Ads, WhatsApp y LinkedIn
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(copySimulado);
                    setCopiado(true);
                    setTimeout(() => setCopiado(false), 2000);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700"
                >
                  {copiado ? (
                    <>
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Texto</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                {copySimulado}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Pie con Resumen y Botón de Guardado */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span>Configuración activa:</span>
          <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[11px] font-bold text-slate-800">
            <span>Tono:</span>
            <strong className="text-indigo-600">{DESCRIPCIONES_TONOS[preferencias.tonoVozPredeterminado]?.nombre}</strong>
          </span>
          <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[11px] font-bold text-slate-800">
            <span>Hashtags:</span>
            <strong className="text-teal-600">{plantillaActiva?.nombre}</strong>
          </span>
          <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[11px] font-bold text-slate-800">
            <span>CTA:</span>
            <strong className="text-emerald-600 truncate max-w-[150px]">{ctaActivo?.texto}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {esModal && onCerrarModal && (
            <button
              type="button"
              onClick={onCerrarModal}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          )}

          <button
            type="button"
            onClick={handleGuardar}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Preferencias de Redes Sociales</span>
          </button>
        </div>
      </div>
    </div>
  );
};
