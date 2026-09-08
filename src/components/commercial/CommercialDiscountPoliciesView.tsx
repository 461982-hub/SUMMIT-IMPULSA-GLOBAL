import React, { useState } from 'react';
import {
  ProyectoEducativo,
  Moneda,
} from '../../types';
import { formatearMoneda } from '../../utils/calculations';
import {
  Tag,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Percent,
  Plus,
  Trash2,
  Save,
  DollarSign,
  Ticket,
  Sliders,
  Users,
  Award,
  Sparkles,
} from 'lucide-react';

interface CommercialDiscountPoliciesViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto: (proyectoActualizado: ProyectoEducativo) => void;
}

export const CommercialDiscountPoliciesView: React.FC<CommercialDiscountPoliciesViewProps> = ({
  proyectos,
  moneda,
  onGuardarProyecto,
}) => {
  const [proyectoSeleccionadoId, setProyectoSeleccionadoId] = useState<string>(
    proyectos.length > 0 ? proyectos[0].id : ''
  );

  const proyectoActual = proyectos.find((p) => p.id === proyectoSeleccionadoId) || proyectos[0];

  // Variables de políticas de descuento
  const precioListaBase = proyectoActual?.precioSugeridoAlumno || 2500;
  const costoMinimoPorAlumno =
    proyectoActual && proyectoActual.alumnosProyectados > 0
      ? Math.round(proyectoActual.gastoTotalOperativo / proyectoActual.alumnosProyectados)
      : 800;

  const [descuentoEarlyBirdPct, setDescuentoEarlyBirdPct] = useState<number>(
    proyectoActual?.politicasDescuentos?.descuentoEarlyBirdPct || proyectoActual?.descuentoPreventaPct || 15
  );
  const [cuposPreventaEarlyBird, setCuposPreventaEarlyBird] = useState<number>(
    proyectoActual?.politicasDescuentos?.cuposPreventaEarlyBird || 5
  );

  const [descuentoConvenioPct, setDescuentoConvenioPct] = useState<number>(
    proyectoActual?.politicasDescuentos?.descuentoConvenioInstitucionalPct || 20
  );

  const [descuentoAlumniPct, setDescuentoAlumniPct] = useState<number>(
    proyectoActual?.politicasDescuentos?.descuentoAlumniPct || 25
  );

  const [descuentoGrupalPct, setDescuentoGrupalPct] = useState<number>(
    proyectoActual?.politicasDescuentos?.descuentoGrupalEmpresarialPct || 10
  );

  const [descuentoBecaMeritoPct, setDescuentoBecaMeritoPct] = useState<number>(
    proyectoActual?.politicasDescuentos?.descuentoBecaMeritoPct || 30
  );
  const [cuposBecaMerito, setCuposBecaMerito] = useState<number>(
    proyectoActual?.politicasDescuentos?.cuposBecaMerito || 2
  );

  const [margenMinimoSeguridadPct, setMargenMinimoSeguridadPct] = useState<number>(
    proyectoActual?.politicasDescuentos?.margenMinimoSeguridadPct || 20
  );

  // Cupones generados
  const [cupones, setCupones] = useState<
    NonNullable<NonNullable<ProyectoEducativo['politicasDescuentos']>['cuponesEmitidos']>
  >(
    proyectoActual?.politicasDescuentos?.cuponesEmitidos || [
      {
        id: 'cup-1',
        codigo: 'EARLYBIRD-2026',
        tipo: 'Early Bird',
        porcentajeDescuento: 15,
        beneficiario: 'Inscripción Preventa (Primeros 5 cupos)',
        utilizado: true,
        fechaUso: '2026-08-10',
      },
      {
        id: 'cup-2',
        codigo: 'ALUMNI-VIP-25',
        tipo: 'Alumni',
        porcentajeDescuento: 25,
        beneficiario: 'Ing. Fernando Ramos (Graduado 2025)',
        utilizado: false,
      },
      {
        id: 'cup-3',
        codigo: 'UNITEC-CONV-20',
        tipo: 'Convenio',
        porcentajeDescuento: 20,
        beneficiario: 'Convenio Docentes y Alumnos UNITEC',
        utilizado: true,
        fechaUso: '2026-08-14',
      },
    ]
  );

  const [nuevoCodigo, setNuevoCodigo] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState<'Early Bird' | 'Convenio' | 'Alumni' | 'Beca Mérito' | 'Grupal'>('Alumni');
  const [nuevoPct, setNuevoPct] = useState<number>(20);
  const [nuevoBeneficiario, setNuevoBeneficiario] = useState('');
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  const handleSeleccionarProyecto = (p: ProyectoEducativo) => {
    setProyectoSeleccionadoId(p.id);
    setDescuentoEarlyBirdPct(p.politicasDescuentos?.descuentoEarlyBirdPct || p.descuentoPreventaPct || 15);
    setCuposPreventaEarlyBird(p.politicasDescuentos?.cuposPreventaEarlyBird || 5);
    setDescuentoConvenioPct(p.politicasDescuentos?.descuentoConvenioInstitucionalPct || 20);
    setDescuentoAlumniPct(p.politicasDescuentos?.descuentoAlumniPct || 25);
    setDescuentoGrupalPct(p.politicasDescuentos?.descuentoGrupalEmpresarialPct || 10);
    setDescuentoBecaMeritoPct(p.politicasDescuentos?.descuentoBecaMeritoPct || 30);
    setCuposBecaMerito(p.politicasDescuentos?.cuposBecaMerito || 2);
    setMargenMinimoSeguridadPct(p.politicasDescuentos?.margenMinimoSeguridadPct || 20);
    if (p.politicasDescuentos?.cuponesEmitidos) {
      setCupones(p.politicasDescuentos.cuponesEmitidos);
    }
    setGuardadoExitoso(false);
  };

  // Función de cálculo de precio y semáforo de seguridad
  const calcularDetalleTarifa = (descuentoPct: number) => {
    const precioFinal = Math.round(precioListaBase * (1 - descuentoPct / 100));
    const gananciaUnitaria = precioFinal - costoMinimoPorAlumno;
    const margenRealPct = precioFinal > 0 ? Math.round((gananciaUnitaria / precioFinal) * 100) : 0;

    let estado: 'Seguro' | 'Alerta' | 'Riesgo Crítico' = 'Seguro';
    if (margenRealPct < margenMinimoSeguridadPct && margenRealPct > 0) {
      estado = 'Alerta';
    } else if (margenRealPct <= 0) {
      estado = 'Riesgo Crítico';
    }

    return {
      precioFinal,
      gananciaUnitaria,
      margenRealPct,
      estado,
    };
  };

  const handleGenerarCupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoBeneficiario.trim()) return;

    const codigoGenerado = nuevoCodigo.trim().toUpperCase() || `${nuevoTipo.toUpperCase().replace(/\s+/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const nuevoCupon = {
      id: `cup-${Date.now()}`,
      codigo: codigoGenerado,
      tipo: nuevoTipo,
      porcentajeDescuento: nuevoPct,
      beneficiario: nuevoBeneficiario,
      utilizado: false,
    };

    const actualizados = [nuevoCupon, ...cupones];
    setCupones(actualizados);
    setNuevoCodigo('');
    setNuevoBeneficiario('');

    if (proyectoActual) {
      onGuardarProyecto({
        ...proyectoActual,
        politicasDescuentos: {
          precioLista: precioListaBase,
          cuposPreventaEarlyBird,
          descuentoEarlyBirdPct,
          descuentoConvenioInstitucionalPct: descuentoConvenioPct,
          descuentoAlumniPct,
          descuentoGrupalEmpresarialPct: descuentoGrupalPct,
          cuposBecaMerito,
          descuentoBecaMeritoPct,
          margenMinimoSeguridadPct,
          cuponesEmitidos: actualizados,
        },
      });
      setGuardadoExitoso(true);
      setTimeout(() => setGuardadoExitoso(false), 3000);
    }
  };

  const handleEliminarCupon = (id: string) => {
    const actualizados = cupones.filter((c) => c.id !== id);
    setCupones(actualizados);
    if (proyectoActual) {
      onGuardarProyecto({
        ...proyectoActual,
        politicasDescuentos: {
          ...(proyectoActual.politicasDescuentos || {}),
          cuponesEmitidos: actualizados,
        },
      });
    }
  };

  const handleGuardarPoliticas = () => {
    if (!proyectoActual) return;
    onGuardarProyecto({
      ...proyectoActual,
      politicasDescuentos: {
        precioLista: precioListaBase,
        cuposPreventaEarlyBird,
        descuentoEarlyBirdPct,
        descuentoConvenioInstitucionalPct: descuentoConvenioPct,
        descuentoAlumniPct,
        descuentoGrupalEmpresarialPct: descuentoGrupalPct,
        cuposBecaMerito,
        descuentoBecaMeritoPct,
        margenMinimoSeguridadPct,
        cuponesEmitidos: cupones,
      },
    });
    setGuardadoExitoso(true);
    setTimeout(() => setGuardadoExitoso(false), 3000);
  };

  // Tarifas a evaluar
  const tarifas = [
    {
      nombre: 'Tarifa Estándar (Precio de Lista)',
      descuento: 0,
      detalle: calcularDetalleTarifa(0),
      cupos: 'Sin límite',
      color: 'border-slate-300 bg-slate-50',
    },
    {
      nombre: `Preventa Early Bird (-${descuentoEarlyBirdPct}%)`,
      descuento: descuentoEarlyBirdPct,
      detalle: calcularDetalleTarifa(descuentoEarlyBirdPct),
      cupos: `${cuposPreventaEarlyBird} cupos asignados`,
      color: 'border-emerald-300 bg-emerald-50/50',
    },
    {
      nombre: `Convenio Institucional / Universitario (-${descuentoConvenioPct}%)`,
      descuento: descuentoConvenioPct,
      detalle: calcularDetalleTarifa(descuentoConvenioPct),
      cupos: 'Con credencial oficial',
      color: 'border-blue-300 bg-blue-50/50',
    },
    {
      nombre: `Alumni & Egresados Distinguidos (-${descuentoAlumniPct}%)`,
      descuento: descuentoAlumniPct,
      detalle: calcularDetalleTarifa(descuentoAlumniPct),
      cupos: 'Ex-alumnos Summit',
      color: 'border-indigo-300 bg-indigo-50/50',
    },
    {
      nombre: `Grupal Empresarial (-${descuentoGrupalPct}%)`,
      descuento: descuentoGrupalPct,
      detalle: calcularDetalleTarifa(descuentoGrupalPct),
      cupos: 'Mínimo 3 personas',
      color: 'border-amber-300 bg-amber-50/50',
    },
    {
      nombre: `Beca al Mérito Académico (-${descuentoBecaMeritoPct}%)`,
      descuento: descuentoBecaMeritoPct,
      detalle: calcularDetalleTarifa(descuentoBecaMeritoPct),
      cupos: `Máx ${cuposBecaMerito} becas`,
      color: 'border-purple-300 bg-purple-50/50',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Encabezado del Módulo */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-extrabold uppercase rounded tracking-wider">
              Yield Management & Pricing
            </span>
            <span className="text-xs text-slate-500 font-medium">Control de Rentabilidad</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-600" />
            Matriz de Políticas de Descuentos & Alerta de Margen
          </h3>
          <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
            Controla las tarifas promocionales, convenios institucionales y becas garantizando que ningún descuento comprometa el punto de equilibrio financiero del programa.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGuardarPoliticas}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-lg transition-colors shadow-xs"
        >
          <Save className="w-4 h-4" />
          <span>Guardar Políticas de Precios</span>
        </button>
      </div>

      {/* Indicador de Origen de Datos: Manual vs Automático */}
      <div className="bg-slate-900 text-white rounded-xl p-3.5 border border-orange-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-extrabold text-[10px] border border-blue-400/30 shrink-0">
            ✍️ GESTIÓN MANUAL
          </span>
          <span className="text-slate-300 text-xs">
            La gerencia comercial define los topes de descuento (Early Bird, Becas, Convenios) y genera cupones personalizados.
          </span>
        </div>
        <div className="flex items-center gap-2.5 sm:border-l sm:border-slate-700 sm:pl-3">
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] border border-emerald-400/30 shrink-0">
            ⚡ 100% AUTOMÁTICO
          </span>
          <span className="text-emerald-100 text-xs">
            Auditoría en tiempo real: compara precio con descuento vs costo por alumno y alerta si el margen de seguridad cae bajo el 20%.
          </span>
        </div>
      </div>

      {guardadoExitoso && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Políticas de precios y cupones promocionales actualizados con éxito.</span>
        </div>
      )}

      {/* Selector de Proyecto */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <label className="text-xs font-bold text-slate-700 block mb-2">
          Seleccionar Programa Formativo:
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
                    ? 'bg-amber-700 text-white border-amber-800 shadow-sm'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                <div className="text-[10px] font-mono uppercase tracking-wider opacity-80">
                  {p.codigoPrograma || `SEC-${p.id}`}
                </div>
                <h4 className="text-xs font-black line-clamp-1 mt-0.5">{p.nombreProyecto}</h4>
                <div className="flex items-center justify-between text-[10px] mt-1 opacity-90">
                  <span>Base: {formatearMoneda(p.precioSugeridoAlumno, moneda)}</span>
                  <span>Margen: {p.margenGananciaOperativa}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Semáforo de Margen y Referencia Financiera */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Precio de Lista Base</span>
          <div className="text-2xl font-black font-mono mt-1 text-emerald-400">
            {formatearMoneda(precioListaBase, moneda)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Tarifa 100% sin descuentos</span>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Costo Operativo Unitario x Alumno</span>
          <div className="text-2xl font-black font-mono mt-1 text-amber-400">
            {formatearMoneda(costoMinimoPorAlumno, moneda)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Gasto total / Alumnos proyectados</span>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Margen Mínimo de Seguridad Requerido</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black font-mono text-white">{margenMinimoSeguridadPct}%</span>
            <span className="text-xs text-emerald-400 font-bold">Límite de protección</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Alerta si el margen cae bajo este valor</span>
        </div>
      </div>

      {/* Matriz de Tarifas & Semáforo */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
          <Sliders className="w-4 h-4 text-amber-600" />
          Simulador y Auditoría de Tarifas Diferenciadas
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {tarifas.map((tarifa, idx) => {
            const { precioFinal, gananciaUnitaria, margenRealPct, estado } = tarifa.detalle;
            let badgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-300';
            if (estado === 'Alerta') badgeBg = 'bg-amber-100 text-amber-900 border-amber-300';
            if (estado === 'Riesgo Crítico') badgeBg = 'bg-red-100 text-red-900 border-red-300';

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border ${tarifa.color} shadow-xs relative flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="text-xs font-black text-slate-900">{tarifa.nombre}</h5>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${badgeBg}`}>
                      {estado}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{tarifa.cupos}</span>

                  <div className="my-3 pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase font-semibold block">Precio Final:</span>
                      <span className="text-lg font-black font-mono text-slate-900">
                        {formatearMoneda(precioFinal, moneda)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase font-semibold block">Margen Real:</span>
                      <span
                        className={`text-lg font-black font-mono ${
                          margenRealPct >= margenMinimoSeguridadPct
                            ? 'text-emerald-700'
                            : margenRealPct > 0
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}
                      >
                        {margenRealPct}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 rounded-lg p-2 border border-slate-200/60 text-[10px] flex items-center justify-between text-slate-600">
                  <span>Ganancia neta x alumno:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatearMoneda(gananciaUnitaria, moneda)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gestor y Administrador de Cupones Promocionales */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulario Crear Cupón */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <form onSubmit={handleGenerarCupon} className="space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <Ticket className="w-4 h-4 text-amber-600" />
              Emitir Nuevo Cupón Promocional
            </h4>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block">Tipo de Beneficio / Política:</label>
              <select
                value={nuevoTipo}
                onChange={(e) => setNuevoTipo(e.target.value as any)}
                className="w-full mt-1 p-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="Early Bird">Preventa Early Bird</option>
                <option value="Convenio">Convenio Institucional / Universitario</option>
                <option value="Alumni">Tarifa Alumni (Egresados)</option>
                <option value="Grupal">Descuento Grupal Empresarial</option>
                <option value="Beca Mérito">Beca por Mérito Académico</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block">Código Promocional:</label>
                <input
                  type="text"
                  placeholder="Ej. ALUMNI2026"
                  value={nuevoCodigo}
                  onChange={(e) => setNuevoCodigo(e.target.value)}
                  className="w-full mt-1 p-2 text-xs uppercase font-mono border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block">Descuento (%):</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={nuevoPct}
                  onChange={(e) => setNuevoPct(Number(e.target.value))}
                  className="w-full mt-1 p-2 text-xs font-mono border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block">Beneficiario / Justificación *</label>
              <input
                type="text"
                required
                placeholder="Ej. Lic. Carlos Pineda (Egresado Finanzas 2025)"
                value={nuevoBeneficiario}
                onChange={(e) => setNuevoBeneficiario(e.target.value)}
                className="w-full mt-1 p-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-black rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Emitir y Registrar Cupón</span>
            </button>
          </form>
        </div>

        {/* Listado de Cupones Emitidos */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <span>Cupones y Becas Emitidas ({cupones.length})</span>
            <span className="text-[10px] text-slate-500 font-mono">Auditoría Comercial</span>
          </h4>

          {cupones.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No hay cupones registrados para este programa.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="p-2 text-left">Código</th>
                    <th className="p-2 text-left">Tipo</th>
                    <th className="p-2 text-center">Descuento</th>
                    <th className="p-2 text-left">Beneficiario</th>
                    <th className="p-2 text-center">Estado</th>
                    <th className="p-2 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {cupones.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-2 font-mono font-bold text-amber-900">{c.codigo}</td>
                      <td className="p-2 text-[11px] text-slate-700">{c.tipo}</td>
                      <td className="p-2 text-center font-mono font-bold text-slate-900">-{c.porcentajeDescuento}%</td>
                      <td className="p-2 text-slate-600 text-[11px] max-w-xs truncate">{c.beneficiario}</td>
                      <td className="p-2 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            c.utilizado
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {c.utilizado ? `Canjeado (${c.fechaUso || 'Usado'})` : 'Disponible'}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleEliminarCupon(c.id)}
                          className="text-slate-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
