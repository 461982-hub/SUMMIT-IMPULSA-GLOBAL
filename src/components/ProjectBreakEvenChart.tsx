import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceDot
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Users,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
  Sliders,
  Sparkles,
  HelpCircle,
  Table as TableIcon,
  BarChart3
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../types';
import { formatearMoneda } from '../utils/calculations';

interface ProjectBreakEvenChartProps {
  proyecto: ProyectoEducativo;
  moneda: Moneda;
  alumnosSimulados?: number;
  onCambiarAlumnosSimulados?: (cantidad: number) => void;
}

export const ProjectBreakEvenChart: React.FC<ProjectBreakEvenChartProps> = ({
  proyecto,
  moneda,
  alumnosSimulados,
  onCambiarAlumnosSimulados
}) => {
  // Variables financieras del proyecto
  const P = Math.max(1, proyecto.precioSugeridoAlumno || 1);
  const CF = Math.max(0, proyecto.gastoTotalOperativo || 0);
  
  // Punto de equilibrio exacto (decimal) y entero (redondeado hacia arriba)
  const exactBreakeven = P > 0 ? CF / P : 0;
  const breakEvenEntero = Math.ceil(exactBreakeven);
  
  const alumnosFinal = Math.max(0, proyecto.alumnosFinal || 0);
  const alumnosProyectados = Math.max(1, proyecto.alumnosProyectados || 1);

  // Margen de seguridad: cuánto por encima del punto de equilibrio está la venta real
  const margenSeguridadAlumnos = alumnosFinal - breakEvenEntero;
  const margenSeguridadPct = alumnosFinal > 0 
    ? ((alumnosFinal - exactBreakeven) / alumnosFinal) * 100 
    : 0;

  // Rango máximo de alumnos a graficar
  const maximoSugerido = Math.max(16, Math.ceil(Math.max(breakEvenEntero, alumnosProyectados, alumnosFinal) * 1.5));
  const [limiteAlumnos, setLimiteAlumnos] = useState<number>(maximoSugerido);
  const [mostrarTabla, setMostrarTabla] = useState<boolean>(false);
  const [sliderInterno, setSliderInterno] = useState<number>(alumnosSimulados ?? alumnosFinal);

  // Valor simulado actual (prop o estado interno)
  const alumnoSimuladoActual = alumnosSimulados !== undefined ? alumnosSimulados : sliderInterno;
  const setAlumnoSimulado = (val: number) => {
    setSliderInterno(val);
    if (onCambiarAlumnosSimulados) {
      onCambiarAlumnosSimulados(val);
    }
  };

  // Generar datos para la curva de Recharts
  const chartData = useMemo(() => {
    const data = [];
    const maxQ = Math.max(limiteAlumnos, breakEvenEntero + 2);

    for (let q = 0; q <= maxQ; q++) {
      const ingresos = q * P;
      const costos = CF;
      const utilidad = ingresos - costos;
      
      data.push({
        alumnos: q,
        ingresos: Math.round(ingresos),
        costos: Math.round(costos),
        utilidad: Math.round(utilidad),
        // Área sombreada de pérdida (cuando costos > ingresos)
        perdidaArea: ingresos < costos ? costos : ingresos,
        // Área base para delimitar
        costosBase: costos,
        esPuntoEquilibrio: q === breakEvenEntero,
        esActual: q === alumnosFinal,
        esProyectado: q === alumnosProyectados
      });
    }
    return data;
  }, [P, CF, limiteAlumnos, breakEvenEntero, alumnosFinal, alumnosProyectados]);

  // Formato compacto para ejes Y
  const formatoEjeY = (valor: number) => {
    if (valor >= 1000000) return `${(valor / 1000000).toFixed(1)}M`;
    if (valor >= 1000) return `${(valor / 1000).toFixed(0)}k`;
    return valor.toString();
  };

  // Componente de Tooltip Personalizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const q = Number(label);
    const ingreso = q * P;
    const costo = CF;
    const ganancia = ingreso - costo;
    const esRentable = ganancia >= 0;
    const esExacto = q === breakEvenEntero;

    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-xl border border-slate-700 shadow-xl text-xs space-y-2 min-w-[230px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            {q} Alumnos Inscritos
          </span>
          {esExacto && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-400 text-slate-900">
              EQUILIBRIO
            </span>
          )}
          {q === alumnosFinal && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white">
              ACTUAL
            </span>
          )}
        </div>

        <div className="space-y-1.5 font-mono">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-slate-400 font-sans">Total Ingresos:</span>
            <span className="font-bold">{formatearMoneda(ingreso, moneda)}</span>
          </div>
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-slate-400 font-sans">Costos Totales (CF):</span>
            <span className="font-bold">{formatearMoneda(costo, moneda)}</span>
          </div>
          <div className={`flex items-center justify-between pt-1 border-t border-slate-800 font-bold ${
            esRentable ? 'text-emerald-300' : 'text-rose-400'
          }`}>
            <span className="font-sans">Resultado Neto:</span>
            <span>
              {ganancia > 0 ? '+' : ''}{formatearMoneda(ganancia, moneda)}
            </span>
          </div>
        </div>

        <div className={`text-[10px] p-1.5 rounded flex items-center gap-1.5 ${
          esRentable 
            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50' 
            : 'bg-rose-950/80 text-rose-300 border border-rose-800/50'
        }`}>
          {esRentable ? (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Zona Rentable (+{q - breakEvenEntero} alumnos sobre el umbral)</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
              <span>Zona de Déficit (faltan {breakEvenEntero - q} alumnos para equilibrio)</span>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div id="seccion-grafico-punto-equilibrio" className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-5 p-5 sm:p-6">
      
      {/* Header del Gráfico */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                Gráfico de Punto de Equilibrio (Break-Even Analysis)
              </h3>
              <p className="text-xs text-slate-500">
                Comparativa gráfica de ingresos totales vs. costos fijos operativos en función de los alumnos matriculados.
              </p>
            </div>
          </div>
        </div>

        {/* Badge de Estado Actual */}
        <div className="flex items-center gap-2 self-start md:self-center">
          {alumnosFinal >= breakEvenEntero ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Rentabilidad Cubierta ({margenSeguridadAlumnos >= 0 ? `+${margenSeguridadAlumnos}` : 0} alumnos de colchón)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold shadow-2xs">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Déficit Operativo (Faltan {breakEvenEntero - alumnosFinal} alumnos)</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMostrarTabla(!mostrarTabla)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-300 cursor-pointer"
            title="Ver tabla detallada por alumno"
          >
            <TableIcon className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">{mostrarTabla ? 'Ocultar Tabla' : 'Ver Tabla'}</span>
          </button>
        </div>
      </div>

      {/* HERO CALLOUT: EL NÚMERO EXACTO DONDE SE ALCANZA LA RENTABILIDAD */}
      <div className="bg-linear-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-purple-900/50 relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          
          {/* Bloque Destacado del Número Exacto */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-linear-to-br from-amber-400 to-amber-500 text-slate-950 flex flex-col items-center justify-center font-black shadow-lg shrink-0 border-2 border-amber-300">
              <span className="text-2xl sm:text-3xl leading-none font-mono tracking-tighter">
                {breakEvenEntero}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-900">
                Alumnos
              </span>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Punto Exacto de Rentabilidad
              </div>
              <h4 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Se requieren {breakEvenEntero} alumnos para alcanzar la rentabilidad
              </h4>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                Valor exacto matemático: <strong className="text-amber-300 font-mono">{exactBreakeven.toFixed(2)} alumnos</strong>. Con {breakEvenEntero} estudiantes se recaudan <strong className="text-emerald-300 font-mono">{formatearMoneda(breakEvenEntero * P, moneda)}</strong>, absorbiendo el 100% de los costos fijos operativos (<strong className="text-amber-300 font-mono">{formatearMoneda(CF, moneda)}</strong>).
              </p>
            </div>
          </div>

          {/* Estadísticas Clave del Equilibrio */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-center sm:text-left">
              <span className="text-[10px] text-slate-300 uppercase font-bold block">
                Costo Total (CF)
              </span>
              <span className="text-sm sm:text-base font-black font-mono text-amber-300">
                {formatearMoneda(CF, moneda)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Gasto operativo 100% fijo
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-center sm:text-left">
              <span className="text-[10px] text-slate-300 uppercase font-bold block">
                Precio Sugerido / Alumno
              </span>
              <span className="text-sm sm:text-base font-black font-mono text-blue-300">
                {formatearMoneda(P, moneda)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Ingreso unitario por matrícula
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-center sm:text-left col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-300 uppercase font-bold block">
                Margen de Seguridad
              </span>
              <span className={`text-sm sm:text-base font-black font-mono ${
                margenSeguridadPct >= 0 ? 'text-emerald-300' : 'text-rose-400'
              }`}>
                {margenSeguridadPct > 0 ? '+' : ''}{margenSeguridadPct.toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {margenSeguridadAlumnos >= 0 
                  ? `+${margenSeguridadAlumnos} alumnos sobre el corte` 
                  : `Faltan ${Math.abs(margenSeguridadAlumnos)} alumnos`}
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* Controles de Escala de Alumnos para el Gráfico */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-600 font-bold">Escala de Alumnos en el Gráfico:</span>
          <div className="flex items-center gap-1">
            {[15, 20, 30, 40].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setLimiteAlumnos(num)}
                className={`px-2.5 py-1 rounded-lg font-bold font-mono transition-colors ${
                  limiteAlumnos === num
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                0 - {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setLimiteAlumnos(maximoSugerido)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                limiteAlumnos === maximoSugerido
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              Óptimo ({maximoSugerido})
            </button>
          </div>
        </div>

        {/* Leyenda Visual Resumida */}
        <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
            Total Ingresos (Ventas)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-amber-500 inline-block border-t-2 border-dashed border-amber-500" />
            Costos Totales (CF)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block ring-2 ring-purple-300" />
            Punto de Equilibrio ({breakEvenEntero} alumnos)
          </span>
        </div>
      </div>

      {/* ÁREA PRINCIPAL DEL GRÁFICO RECHARTS */}
      <div className="relative w-full h-[360px] sm:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 25, right: 30, left: 10, bottom: 25 }}
          >
            <defs>
              <linearGradient id="gradientIngresosVerde" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="gradientPerdidaRojo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.20} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={true} />

            <XAxis
              dataKey="alumnos"
              type="number"
              domain={[0, limiteAlumnos]}
              tickCount={limiteAlumnos <= 20 ? limiteAlumnos + 1 : 11}
              stroke="#64748b"
              fontSize={11}
              label={{
                value: 'Cantidad de Alumnos Matriculados',
                position: 'insideBottom',
                offset: -12,
                fill: '#475569',
                fontSize: 12,
                fontWeight: 'bold'
              }}
            />

            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickFormatter={formatoEjeY}
              label={{
                value: `Monto (${moneda})`,
                angle: -90,
                position: 'insideLeft',
                offset: 5,
                fill: '#475569',
                fontSize: 12,
                fontWeight: 'bold'
              }}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: 15, fontSize: 12 }}
            />

            {/* Sombra de ingresos */}
            <Area
              type="monotone"
              dataKey="ingresos"
              name="Área de Ingresos"
              fill="url(#gradientIngresosVerde)"
              stroke="none"
              legendType="none"
            />

            {/* Línea horizontal de Costos Fijos Totales */}
            <Line
              type="monotone"
              dataKey="costos"
              name="Costos Totales Operativos (CF)"
              stroke="#f59e0b"
              strokeWidth={3}
              strokeDasharray="6 4"
              dot={false}
              activeDot={{ r: 6, fill: '#f59e0b' }}
            />

            {/* Línea ascendente de Ingresos Totales */}
            <Line
              type="monotone"
              dataKey="ingresos"
              name="Total Ingresos (Q × Precio)"
              stroke="#10b981"
              strokeWidth={3.5}
              dot={{ r: 3, fill: '#10b981' }}
              activeDot={{ r: 7, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
            />

            {/* LÍNEA DE REFERENCIA VERTICAL: PUNTO DE EQUILIBRIO EXACTO */}
            <ReferenceLine
              x={exactBreakeven}
              stroke="#7c3aed"
              strokeWidth={2.5}
              strokeDasharray="4 3"
              label={{
                value: `🎯 Eq. Exacto: ${exactBreakeven.toFixed(1)} alumnos`,
                position: 'top',
                fill: '#6d28d9',
                fontSize: 11,
                fontWeight: 'bold'
              }}
            />

            {/* PUNTO DE INTERSECCIÓN (BREAK-EVEN EXACTO) */}
            <ReferenceDot
              x={exactBreakeven}
              y={CF}
              r={7}
              fill="#7c3aed"
              stroke="#ffffff"
              strokeWidth={3}
            />

            {/* Línea de Alumnos Actuales (si aplica) */}
            {alumnosFinal > 0 && (
              <ReferenceLine
                x={alumnosFinal}
                stroke="#0284c7"
                strokeWidth={2}
                strokeDasharray="3 3"
                label={{
                  value: `Actual: ${alumnosFinal} alum.`,
                  position: 'insideTopLeft',
                  fill: '#0284c7',
                  fontSize: 10,
                  fontWeight: 'bold'
                }}
              />
            )}

            {/* Línea de Alumnos Proyectados (Meta Comercial) */}
            {alumnosProyectados > 0 && alumnosProyectados !== alumnosFinal && (
              <ReferenceLine
                x={alumnosProyectados}
                stroke="#475569"
                strokeWidth={1.5}
                strokeDasharray="2 2"
                label={{
                  value: `Meta: ${alumnosProyectados}`,
                  position: 'insideBottomRight',
                  fill: '#475569',
                  fontSize: 10
                }}
              />
            )}

          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Slider Interactivo de Sensibilidad en el Gráfico */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Simulador Dinámico de Alumnos sobre el Punto de Equilibrio
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Alumnos seleccionados:</span>
            <span className="px-2.5 py-0.5 rounded-md font-mono font-black text-sm bg-purple-100 text-purple-900 border border-purple-300">
              {alumnoSimuladoActual} alumnos
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
              alumnoSimuladoActual >= breakEvenEntero
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-rose-100 text-rose-800'
            }`}>
              {alumnoSimuladoActual >= breakEvenEntero
                ? `Rentable (+${alumnoSimuladoActual - breakEvenEntero})`
                : `Déficit (-${breakEvenEntero - alumnoSimuladoActual})`}
            </span>
          </div>
        </div>

        <input
          type="range"
          min="0"
          max={limiteAlumnos}
          value={alumnoSimuladoActual}
          onChange={(e) => setAlumnoSimulado(Number(e.target.value))}
          className="w-full accent-purple-600 cursor-pointer"
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase block">Ingreso Simulado</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              {formatearMoneda(alumnoSimuladoActual * P, moneda)}
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase block">Costo Fijo Cubierto</span>
            <span className="font-mono font-bold text-amber-700 text-sm">
              {formatearMoneda(CF, moneda)}
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase block">Utilidad Simulada</span>
            <span className={`font-mono font-bold text-sm ${
              alumnoSimuladoActual * P - CF >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}>
              {alumnoSimuladoActual * P - CF > 0 ? '+' : ''}
              {formatearMoneda(alumnoSimuladoActual * P - CF, moneda)}
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase block">Margen Operativo</span>
            <span className={`font-mono font-bold text-sm ${
              alumnoSimuladoActual * P > 0 && alumnoSimuladoActual * P - CF >= 0
                ? 'text-emerald-700'
                : 'text-rose-600'
            }`}>
              {alumnoSimuladoActual * P > 0
                ? `${(((alumnoSimuladoActual * P - CF) / (alumnoSimuladoActual * P)) * 100).toFixed(1)}%`
                : '0.0%'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabla Opcional de Sensibilidad Alumno por Alumno */}
      {mostrarTabla && (
        <div className="border border-slate-200 rounded-xl overflow-hidden animate-in fade-in duration-200">
          <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
            <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <TableIcon className="w-3.5 h-3.5 text-slate-600" />
              Progresión Financiera Alumno por Alumno (Hasta {Math.min(limiteAlumnos, 25)} alumnos)
            </h5>
            <span className="text-[11px] text-slate-500 font-mono">
              Fila dorada = Punto de Equilibrio
            </span>
          </div>

          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3 text-center"># Alumnos</th>
                  <th className="py-2 px-3 text-right">Total Ingresos</th>
                  <th className="py-2 px-3 text-right">Costos Fijos</th>
                  <th className="py-2 px-3 text-right">Utilidad / Pérdida</th>
                  <th className="py-2 px-3 text-right">Margen %</th>
                  <th className="py-2 px-3 text-center">Estado Financiero</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {Array.from({ length: Math.min(limiteAlumnos + 1, 26) }).map((_, idx) => {
                  const q = idx;
                  const ingreso = q * P;
                  const costo = CF;
                  const ganancia = ingreso - costo;
                  const esEq = q === breakEvenEntero;
                  const esAct = q === alumnosFinal;
                  const margen = ingreso > 0 ? (ganancia / ingreso) * 100 : 0;

                  return (
                    <tr
                      key={q}
                      className={`transition-colors ${
                        esEq
                          ? 'bg-amber-100/90 font-bold border-y-2 border-amber-400'
                          : esAct
                          ? 'bg-blue-50/80 font-semibold'
                          : q % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                      }`}
                    >
                      <td className="py-1.5 px-3 text-center font-mono">
                        <span className="inline-flex items-center gap-1">
                          {q}
                          {esEq && <span className="text-amber-700 text-[10px]">🎯</span>}
                          {esAct && <span className="text-blue-700 text-[10px]">📍</span>}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono text-emerald-700">
                        {formatearMoneda(ingreso, moneda)}
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono text-amber-700">
                        {formatearMoneda(costo, moneda)}
                      </td>
                      <td className={`py-1.5 px-3 text-right font-mono font-bold ${
                        ganancia >= 0 ? 'text-emerald-700' : 'text-rose-600'
                      }`}>
                        {ganancia > 0 ? '+' : ''}{formatearMoneda(ganancia, moneda)}
                      </td>
                      <td className={`py-1.5 px-3 text-right font-mono ${
                        margen >= 0 ? 'text-emerald-700' : 'text-rose-600'
                      }`}>
                        {margen.toFixed(1)}%
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        {esEq ? (
                          <span className="px-2 py-0.5 rounded-full font-black text-[9px] bg-amber-500 text-white shadow-2xs">
                            PUNTO DE EQUILIBRIO
                          </span>
                        ) : ganancia > 0 ? (
                          <span className="px-2 py-0.5 rounded-full font-bold text-[9px] bg-emerald-100 text-emerald-800">
                            Rentable
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full font-bold text-[9px] bg-rose-100 text-rose-800">
                            Déficit
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Principio Económico y Conclusión de Rentabilidad */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-600">
        <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-800 block">
            Dinámica Financiera del Punto de Equilibrio en Summit Impulsa Global
          </span>
          <p className="leading-relaxed">
            Antes de los <strong>{breakEvenEntero} alumnos</strong>, cada alumno matriculado reduce el déficit operativo del proyecto. A partir del alumno <strong>#{breakEvenEntero + 1}</strong>, la totalidad del precio unitario (<strong className="text-slate-800">{formatearMoneda(P, moneda)}</strong>) se convierte en margen de contribución puro directo a la utilidad neta de la institución, dado que los costos docentes y operativos ya han sido completamente absorbidos.
          </p>
        </div>
      </div>

    </div>
  );
};
