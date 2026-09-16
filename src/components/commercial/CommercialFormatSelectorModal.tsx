import React, { useState } from 'react';
import {
  X,
  Layout,
  Check,
  Smartphone,
  Square,
  Tv,
  Share2,
  Sparkles,
  ArrowRight,
  Download,
  Info,
  CheckCircle2,
  Layers,
  Calendar,
  User,
  ExternalLink
} from 'lucide-react';
import { ProyectoEducativo, FormatoPublicidad, Moneda } from '../../types';
import { 
  FORMATOS_PUBLICIDAD_DISPONIBLES, 
  obtenerPreferenciasRedesSociales,
  guardarPreferenciasRedesSociales
} from '../../utils/socialPreferencesUtils';

interface CommercialFormatSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyectoInicial?: ProyectoEducativo | null;
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onContinuarAlDisenador: (formato: FormatoPublicidad, proyecto: ProyectoEducativo) => void;
  onGenerarPackCompleto?: (proyecto: ProyectoEducativo) => void;
  onNotificar?: (mensaje: string) => void;
}

export const CommercialFormatSelectorModal: React.FC<CommercialFormatSelectorModalProps> = ({
  isOpen,
  onClose,
  proyectoInicial,
  proyectos,
  moneda,
  onContinuarAlDisenador,
  onGenerarPackCompleto,
  onNotificar,
}) => {
  const proyectosDisponibles = proyectos.filter((p) => !p.esSilaboBase && p.tipoRegistro !== 'silabo_base');

  const [proyectoSeleccionadoId, setProyectoSeleccionadoId] = useState<string>(() => {
    if (proyectoInicial?.id) return proyectoInicial.id;
    return proyectosDisponibles[0]?.id || '';
  });

  const proyectoActual = proyectosDisponibles.find((p) => p.id === proyectoSeleccionadoId) || proyectoInicial || proyectosDisponibles[0] || null;

  // Cargar formato predeterminado desde preferencias
  const [formatoSeleccionado, setFormatoSeleccionado] = useState<FormatoPublicidad>(() => {
    const prefs = obtenerPreferenciasRedesSociales();
    return prefs.formatoPredeterminado || 'cuadrado';
  });

  const [guardarComoPredeterminado, setGuardarComoPredeterminado] = useState(false);

  if (!isOpen || !proyectoActual) return null;

  const formatoInfo = FORMATOS_PUBLICIDAD_DISPONIBLES.find((f) => f.id === formatoSeleccionado) || FORMATOS_PUBLICIDAD_DISPONIBLES[0];

  const handleConfirmar = () => {
    if (guardarComoPredeterminado) {
      const prefs = obtenerPreferenciasRedesSociales();
      prefs.formatoPredeterminado = formatoSeleccionado;
      guardarPreferenciasRedesSociales(prefs);
      onNotificar?.(`Formato "${formatoInfo.nombre}" guardado como predeterminado para futuras publicaciones.`);
    }

    onContinuarAlDisenador(formatoSeleccionado, proyectoActual);
  };

  const getIconoFormato = (id: FormatoPublicidad) => {
    switch (id) {
      case 'story':
        return <Smartphone className="w-5 h-5 text-emerald-400" />;
      case 'retrato':
        return <Smartphone className="w-5 h-5 text-blue-400" />;
      case 'banner':
        return <Tv className="w-5 h-5 text-purple-400" />;
      case 'paisaje':
        return <Share2 className="w-5 h-5 text-amber-400" />;
      case 'cuadrado':
      default:
        return <Square className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* CABECERA */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Layout className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Seleccionar Formato de Salida para Publicidad
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Paso Previo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Elige la relación de aspecto recomendada según el canal de redes sociales antes de generar la imagen final.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CUERPO */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          
          {/* BARRA DE PROYECTO SELECCIONADO */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Proyecto Educativo a Publicitar
                </span>
                <h4 className="text-sm font-bold text-white truncate">
                  {proyectoActual.nombreProyecto}
                </h4>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300 mt-0.5">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" /> {proyectoActual.nombreDocente}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" /> {proyectoActual.fechaProgramacion || 'Próximo Inicio'}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold">
                    {proyectoActual.modalidad || 'En Vivo Virtual'}
                  </span>
                </div>
              </div>
            </div>

            {/* Selector de cambio rápido de proyecto */}
            <div className="shrink-0">
              <label htmlFor="select-proyecto-formato" className="sr-only">Cambiar Proyecto</label>
              <select
                id="select-proyecto-formato"
                value={proyectoSeleccionadoId}
                onChange={(e) => setProyectoSeleccionadoId(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer w-full sm:w-auto"
              >
                {proyectosDisponibles.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-slate-100">
                    {p.nombreProyecto}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* CATÁLOGO DE FORMATOS DISPONIBLES */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Layout className="w-4 h-4 text-indigo-400" />
                Formatos de Salida Disponibles para Redes Sociales
              </h4>
              <span className="text-[11px] text-slate-400">
                Selecciona uno para previsualizar y generar
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {FORMATOS_PUBLICIDAD_DISPONIBLES.map((f) => {
                const esSeleccionado = formatoSeleccionado === f.id;

                return (
                  <div
                    key={f.id}
                    onClick={() => setFormatoSeleccionado(f.id)}
                    className={`relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      esSeleccionado
                        ? 'bg-gradient-to-b from-indigo-950/60 to-slate-900 border-indigo-500 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-950/40'
                        : 'bg-slate-800/50 hover:bg-slate-800/80 border-slate-700/80 hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    {/* Badge Recomendado / Popular */}
                    {f.badgePopular && (
                      <span className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        f.id === 'story' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : f.id === 'retrato'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      }`}>
                        {f.badgePopular}
                      </span>
                    )}

                    {/* Previsualizador de Proporción Visual */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-14 h-16 flex items-center justify-center bg-slate-950/80 rounded-lg border border-slate-800 p-1 shrink-0">
                        {/* Miniatura con la proporción real */}
                        <div
                          className={`border-2 rounded-xs flex flex-col justify-between p-0.5 transition-all ${
                            esSeleccionado ? 'border-indigo-400 bg-indigo-950/50' : 'border-slate-600 bg-slate-900'
                          }`}
                          style={{
                            width: f.id === 'story' ? '28px' : f.id === 'banner' ? '48px' : f.id === 'paisaje' ? '48px' : f.id === 'retrato' ? '36px' : '40px',
                            height: f.id === 'story' ? '50px' : f.id === 'banner' ? '27px' : f.id === 'paisaje' ? '25px' : f.id === 'retrato' ? '45px' : '40px',
                          }}
                        >
                          <div className="w-full h-1 bg-current opacity-40 rounded-xs" />
                          <div className="w-3/4 h-1 bg-current opacity-60 rounded-xs mx-auto" />
                          <div className="w-1/2 h-1 bg-current opacity-80 rounded-xs mx-auto" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 pr-14">
                        <div className="flex items-center gap-1.5">
                          {getIconoFormato(f.id)}
                          <span className="font-bold text-xs text-white">
                            {f.relacionAspecto}
                          </span>
                        </div>
                        <h5 className="text-xs font-black text-slate-100 truncate mt-0.5">
                          {f.nombre}
                        </h5>
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                          {f.ancho} × {f.alto} px
                        </span>
                      </div>
                    </div>

                    {/* Descripción */}
                    <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                      {f.descripcion}
                    </p>

                    {/* Etiquetas de Canales */}
                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-1 items-center">
                      {f.redesRecomendadas.map((canal, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-slate-900 text-[10px] text-slate-300 border border-slate-800"
                        >
                          {canal}
                        </span>
                      ))}
                    </div>

                    {/* Indicador de selección */}
                    <div className="mt-3 flex items-center justify-between text-[11px] pt-1">
                      <span className={`font-bold flex items-center gap-1 ${esSeleccionado ? 'text-indigo-400' : 'text-slate-500'}`}>
                        {esSeleccionado ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Formato Seleccionado</span>
                          </>
                        ) : (
                          <span>Clic para elegir</span>
                        )}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {f.etiquetaUso}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FICHA TÉCNICA DEL FORMATO SELECCIONADO */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white">
                    Formato activo para la generación: {formatoInfo.nombre} ({formatoInfo.relacionAspecto})
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {formatoInfo.ancho} × {formatoInfo.alto} px (Alta Definición)
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Se configurará el lienzo, las fuentes tipográficas, las áreas seguras y la jerarquía de los campos según este formato antes de renderizar.
                </p>
                
                {/* Opción de guardar como predeterminado */}
                <label className="flex items-center gap-2 mt-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={guardarComoPredeterminado}
                    onChange={(e) => setGuardarComoPredeterminado(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                  />
                  <span className="text-xs text-slate-300">
                    Recordar <strong className="text-indigo-300">{formatoInfo.nombre}</strong> como mi formato predeterminado para futuras publicaciones
                  </span>
                </label>
              </div>
            </div>

            {/* Opción de generar Pack Multiformato */}
            {onGenerarPackCompleto && (
              <div className="shrink-0 flex md:flex-col justify-end gap-2">
                <button
                  type="button"
                  onClick={() => onGenerarPackCompleto(proyectoActual)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Genera automáticamente la imagen en formatos 1:1, 9:16 y 16:9"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Descargar Pack Multiformato</span>
                </button>
              </div>
            )}
          </div>

        </div>

        {/* PIE DE PÁGINA CON ACCIÓN PRINCIPAL */}
        <div className="px-6 py-3.5 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400">
            Formato: <strong className="text-white">{formatoInfo.nombre}</strong> ({formatoInfo.ancho}×{formatoInfo.alto} px)
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmar}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer ring-1 ring-white/20"
            >
              <span>Generar Imagen en {formatoInfo.relacionAspecto}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
