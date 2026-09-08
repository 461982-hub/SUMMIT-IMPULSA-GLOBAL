import React from 'react';

interface SummitLogoProps {
  variant?: 'full' | 'horizontal' | 'icon' | 'compact';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTagline?: boolean;
}

/**
 * Componente oficial de Identidad de Marca SUMMIT IMPULSA GLOBAL
 * Renderiza el emblema 3D del globo terráqueo azul con picos montañosos plateados,
 * anillo orbital, estrellas de brillo y tipografía corporativa oficial:
 * "SUMMIT IMPULSA GLOBAL - Transformando talento en resultados globales."
 */
export const SummitLogo: React.FC<SummitLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  className = '',
  showTagline = true,
}) => {
  // Dimensiones según tamaño
  const iconDimensions = {
    xs: 28,
    sm: 36,
    md: 44,
    lg: 64,
    xl: 96,
  }[size];

  // SVG del Emblema 3D (Globo Azul + Montañas Cromadas + Anillo + Destellos)
  const renderGlobeEmblem = (dim: number) => (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 drop-shadow-sm select-none"
    >
      <defs>
        {/* Gradiente de la Esfera 3D Azul Profundo */}
        <radialGradient id="summitGlobeGrad" cx="38%" cy="32%" r="65%" fx="35%" fy="28%">
          <stop offset="0%" stopColor="#4A90E2" />
          <stop offset="25%" stopColor="#2563EB" />
          <stop offset="60%" stopColor="#1D4ED8" />
          <stop offset="85%" stopColor="#0F2C69" />
          <stop offset="100%" stopColor="#071638" />
        </radialGradient>

        {/* Gradiente del Anillo Orbital Plateado */}
        <linearGradient id="summitRingGrad" x1="10%" y1="90%" x2="90%" y2="10%">
          <stop offset="0%" stopColor="#64748B" />
          <stop offset="25%" stopColor="#CBD5E1" />
          <stop offset="50%" stopColor="#FFFFFF" />
          <stop offset="75%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>

        {/* Gradiente de Montañas - Facetas Iluminadas */}
        <linearGradient id="summitPeakLight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#F1F5F9" />
          <stop offset="80%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>

        {/* Gradiente de Montañas - Facetas Sombra / Metálicas */}
        <linearGradient id="summitPeakDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="50%" stopColor="#475569" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>

        {/* Gradiente de Montañas - Facetas Intermedias */}
        <linearGradient id="summitPeakMid" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#64748B" />
          <stop offset="50%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>

        {/* Sombra suave de las montañas */}
        <filter id="peakGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#071638" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Globo Base Azul 3D */}
      <circle cx="100" cy="95" r="62" fill="url(#summitGlobeGrad)" />

      {/* Líneas de Latitud y Longitud del Globo */}
      <g opacity="0.32" stroke="#BAE6FD" strokeWidth="1.2" fill="none">
        {/* Ecuador y Paralelos */}
        <ellipse cx="100" cy="95" rx="62" ry="24" transform="rotate(-15 100 95)" />
        <ellipse cx="100" cy="75" rx="54" ry="16" transform="rotate(-15 100 75)" />
        <ellipse cx="100" cy="115" rx="54" ry="16" transform="rotate(-15 100 115)" />
        {/* Meridianos */}
        <ellipse cx="100" cy="95" rx="28" ry="62" transform="rotate(-15 100 95)" />
        <ellipse cx="100" cy="95" rx="48" ry="62" transform="rotate(-15 100 95)" />
        <line x1="40" y1="95" x2="160" y2="95" transform="rotate(-15 100 95)" />
      </g>

      {/* Brillo Especular Superior del Globo */}
      <ellipse cx="78" cy="62" rx="28" ry="16" fill="#FFFFFF" opacity="0.22" transform="rotate(-30 78 62)" />

      {/* Anillo Orbital Trasero (detrás de las montañas) */}
      <path
        d="M 45 125 C 25 110, 32 80, 75 62 C 118 44, 168 55, 178 78"
        stroke="url(#summitRingGrad)"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />

      {/* Picos Montañosos Cromados 3D (Summit) */}
      <g filter="url(#peakGlow)">
        {/* Pico Principal Central-Derecho (Más Alto) */}
        {/* Faceta Iluminada Izquierda */}
        <path d="M 128 38 L 102 112 L 128 106 Z" fill="url(#summitPeakLight)" />
        {/* Faceta Sombra Derecha */}
        <path d="M 128 38 L 128 106 L 152 98 Z" fill="url(#summitPeakDark)" />
        {/* Borde Cresta Brillante */}
        <path d="M 128 38 L 128 106" stroke="#FFFFFF" strokeWidth="1" />

        {/* Pico Medio Izquierdo */}
        {/* Faceta Iluminada Izquierda */}
        <path d="M 104 44 L 82 108 L 104 104 Z" fill="url(#summitPeakLight)" />
        {/* Faceta Sombra Derecha */}
        <path d="M 104 44 L 104 104 L 120 96 Z" fill="url(#summitPeakMid)" />

        {/* Pico Menor Izquierdo */}
        <path d="M 78 64 L 62 108 L 78 105 Z" fill="url(#summitPeakLight)" />
        <path d="M 78 64 L 78 105 L 94 102 Z" fill="url(#summitPeakDark)" />

        {/* Pico Extremo Izquierdo Bajo */}
        <path d="M 64 78 L 52 110 L 68 108 Z" fill="url(#summitPeakLight)" />

        {/* Pico Menor Derecho (Flecha Ascendente) */}
        <path d="M 148 54 L 136 100 L 158 92 Z" fill="url(#summitPeakLight)" />
        <path d="M 148 54 L 158 92 L 168 84 Z" fill="url(#summitPeakDark)" />
      </g>

      {/* Anillo Orbital Delantero (Abraza el Globo y Montañas) */}
      <path
        d="M 38 102 C 34 122, 58 144, 98 144 C 138 144, 168 126, 172 106 C 174 98, 170 90, 162 86 C 158 98, 134 116, 98 116 C 62 116, 44 106, 38 102 Z"
        fill="url(#summitRingGrad)"
        stroke="#E2E8F0"
        strokeWidth="0.8"
      />
      {/* Segundo Ribete Inferior del Anillo Orbital */}
      <path
        d="M 46 120 C 58 138, 82 148, 114 146 C 142 144, 162 130, 166 118"
        stroke="#F8FAFC"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* 3 Estrellas de Brillo / Destellos Corporativos en el cuadrante superior derecho */}
      {/* Estrella Principal */}
      <g transform="translate(152, 34) scale(1)">
        <path d="M 0 -10 Q 0 0 10 0 Q 0 0 0 10 Q 0 0 -10 0 Q 0 0 0 -10 Z" fill="#93C5FD" />
        <circle cx="0" cy="0" r="2.5" fill="#FFFFFF" />
      </g>
      {/* Estrella Secundaria Superior */}
      <g transform="translate(138, 26) scale(0.65)">
        <path d="M 0 -8 Q 0 0 8 0 Q 0 0 0 8 Q 0 0 -8 0 Q 0 0 0 -8 Z" fill="#BAE6FD" />
        <circle cx="0" cy="0" r="1.5" fill="#FFFFFF" />
      </g>
      {/* Estrella Terciaria Derecha */}
      <g transform="translate(162, 48) scale(0.75)">
        <path d="M 0 -8 Q 0 0 8 0 Q 0 0 0 8 Q 0 0 -8 0 Q 0 0 0 -8 Z" fill="#60A5FA" />
        <circle cx="0" cy="0" r="1.8" fill="#FFFFFF" />
      </g>
    </svg>
  );

  // Variante Solo Icono
  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {renderGlobeEmblem(iconDimensions)}
      </div>
    );
  }

  // Variante Compacta (Para Headers o Badges reducidos)
  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        {renderGlobeEmblem(iconDimensions)}
        <div className="flex flex-col leading-tight">
          <span className="font-black text-sm tracking-wider text-slate-900 font-sans">
            SUMMIT
          </span>
          <span className="text-[9px] font-extrabold tracking-widest text-blue-800 uppercase">
            IMPULSA GLOBAL
          </span>
        </div>
      </div>
    );
  }

  // Variante Horizontal (Recomendada para Barra Superior de Navegación)
  if (variant === 'horizontal') {
    return (
      <div className={`inline-flex items-center gap-3 ${className}`}>
        {renderGlobeEmblem(iconDimensions)}
        <div className="flex flex-col justify-center">
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 drop-shadow-2xs font-sans">
              SUMMIT
            </span>
            <span className="text-[11px] sm:text-xs font-black tracking-widest text-blue-800 uppercase border-b-2 border-blue-600 pb-0.5">
              IMPULSA GLOBAL
            </span>
          </div>
          {showTagline && (
            <p className="text-[11px] sm:text-xs font-medium text-slate-600 tracking-normal mt-0.5">
              Transformando talento en resultados globales.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Variante Completa Stacked (Para Reportes Ejecutivos, Modales, Carátulas y Fichas Oficiales)
  return (
    <div className={`flex flex-col items-center text-center p-4 ${className}`}>
      {renderGlobeEmblem(iconDimensions || 90)}
      
      {/* Texto SUMMIT 3D Metálico */}
      <div className="mt-2 relative">
        <h2 className="text-2xl sm:text-3xl font-black tracking-wider text-slate-800 uppercase font-sans">
          SUMMIT
        </h2>
      </div>

      {/* Línea Divisoria con IMPULSA GLOBAL */}
      <div className="flex items-center justify-center gap-2 w-full max-w-xs mt-1">
        <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent to-slate-400"></div>
        <span className="text-xs sm:text-sm font-extrabold tracking-widest text-blue-900 uppercase">
          IMPULSA GLOBAL
        </span>
        <div className="h-0.5 flex-1 bg-gradient-to-l from-transparent to-slate-400"></div>
      </div>

      {/* Tagline Oficial */}
      {showTagline && (
        <p className="text-xs sm:text-sm font-medium text-blue-950/80 mt-1.5 tracking-tight italic">
          Transformando talento en resultados globales.
        </p>
      )}
    </div>
  );
};
