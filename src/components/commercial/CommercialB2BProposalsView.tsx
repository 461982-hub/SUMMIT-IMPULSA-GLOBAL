import React, { useState } from 'react';
import {
  ProyectoEducativo,
  Moneda,
} from '../../types';
import { formatearMoneda } from '../../utils/calculations';
import {
  Building2,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  FileCheck,
  Printer,
  Calendar,
  Users,
  DollarSign,
  Briefcase,
  Layers,
  Send,
  Building,
  Check,
  TrendingUp,
} from 'lucide-react';
import { SummitLogo } from '../SummitLogo';

interface CommercialB2BProposalsViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto: (proyectoActualizado: ProyectoEducativo) => void;
}

export const CommercialB2BProposalsView: React.FC<CommercialB2BProposalsViewProps> = ({
  proyectos,
  moneda,
  onGuardarProyecto,
}) => {
  const [proyectoSeleccionadoId, setProyectoSeleccionadoId] = useState<string>(
    proyectos.length > 0 ? proyectos[0].id : ''
  );

  const proyectoActual = proyectos.find((p) => p.id === proyectoSeleccionadoId) || proyectos[0];

  // Lista de propuestas B2B guardadas para este proyecto
  const [propuestas, setPropuestas] = useState<
    NonNullable<ProyectoEducativo['propuestasCorporativasB2B']>
  >(
    proyectoActual?.propuestasCorporativasB2B || []
  );

  // Formulario de nueva propuesta B2B
  const [empresaCliente, setEmpresaCliente] = useState('');
  const [rtnOIdentificacion, setRtnOIdentificacion] = useState('');
  const [contactoNombre, setContactoNombre] = useState('');
  const [contactoEmail, setContactoEmail] = useState('');
  const [contactoTelefono, setContactoTelefono] = useState('');
  const [cantidadColaboradores, setCantidadColaboradores] = useState<number>(10);
  const [costoDocenteAjustado, setCostoDocenteAjustado] = useState<number>(
    (proyectoActual?.costoDocenteCalculado || 4800) * 1.2
  );
  const [margenB2BPct, setMargenB2BPct] = useState<number>(35);
  const [aplicaExencionISV, setAplicaExencionISV] = useState<boolean>(true);
  const [notasNegociacion, setNotasNegociacion] = useState('');

  // Propuesta seleccionada para ver/imprimir en modo carta formal
  const [propuestaActiva, setPropuestaActiva] = useState<
    NonNullable<ProyectoEducativo['propuestasCorporativasB2B']>[0] | null
  >(propuestas.length > 0 ? propuestas[0] : null);

  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  // Cálculos dinámicos del cotizador B2B
  const costoTotalBase = costoDocenteAjustado + (proyectoActual?.costoZoom || 0) + (proyectoActual?.costoPapeleria || 0) + 1500;
  const precioTotalCotizadoSugerido = Math.round(costoTotalBase / (1 - (margenB2BPct / 100)));
  const precioPorColaboradorSugerido = cantidadColaboradores > 0 ? Math.round(precioTotalCotizadoSugerido / cantidadColaboradores) : 0;

  const handleSeleccionarProyecto = (p: ProyectoEducativo) => {
    setProyectoSeleccionadoId(p.id);
    const lista = p.propuestasCorporativasB2B || [];
    setPropuestas(lista);
    setPropuestaActiva(lista[0] || null);
    setCostoDocenteAjustado((p.costoDocenteCalculado || 4800) * 1.2);
    setGuardadoExitoso(false);
  };

  const handleCrearPropuesta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaCliente.trim() || !contactoNombre.trim()) return;

    const nueva: NonNullable<ProyectoEducativo['propuestasCorporativasB2B']>[0] = {
      id: `prop-${Date.now()}`,
      empresaCliente,
      rtnOIdentificacion: rtnOIdentificacion || 'N/D',
      contactoNombre,
      contactoEmail,
      contactoTelefono,
      cantidadColaboradores: Math.max(1, cantidadColaboradores),
      modulosSeleccionados: ['Programa Completo Adaptado In-Company'],
      costoDocenteAjustado,
      margenB2BPct,
      precioTotalCotizado: precioTotalCotizadoSugerido,
      precioPorColaborador: precioPorColaboradorSugerido,
      estado: 'Borrador',
      fechaEmision: new Date().toISOString().split('T')[0],
      fechaValidez: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notasNegociacion,
      aplicaExencionISV,
    };

    const actualizadas = [nueva, ...propuestas];
    setPropuestas(actualizadas);
    setPropuestaActiva(nueva);

    // Resetear formulario
    setEmpresaCliente('');
    setRtnOIdentificacion('');
    setContactoNombre('');
    setContactoEmail('');
    setContactoTelefono('');
    setNotasNegociacion('');

    if (proyectoActual) {
      onGuardarProyecto({
        ...proyectoActual,
        propuestasCorporativasB2B: actualizadas,
      });
      setGuardadoExitoso(true);
      setTimeout(() => setGuardadoExitoso(false), 3000);
    }
  };

  const handleCambiarEstado = (id: string, nuevoEstado: NonNullable<ProyectoEducativo['propuestasCorporativasB2B']>[0]['estado']) => {
    const actualizadas = propuestas.map((prop) =>
      prop.id === id ? { ...prop, estado: nuevoEstado } : prop
    );
    setPropuestas(actualizadas);
    if (propuestaActiva?.id === id) {
      setPropuestaActiva({ ...propuestaActiva, estado: nuevoEstado });
    }
    if (proyectoActual) {
      onGuardarProyecto({
        ...proyectoActual,
        propuestasCorporativasB2B: actualizadas,
      });
    }
  };

  const handleEliminarPropuesta = (id: string) => {
    const actualizadas = propuestas.filter((p) => p.id !== id);
    setPropuestas(actualizadas);
    if (propuestaActiva?.id === id) {
      setPropuestaActiva(actualizadas.length > 0 ? actualizadas[0] : null);
    }
    if (proyectoActual) {
      onGuardarProyecto({
        ...proyectoActual,
        propuestasCorporativasB2B: actualizadas,
      });
    }
  };

  const handleImprimirPropuesta = () => {
    window.print();
  };

  // Métricas globales de B2B
  const totalCotizadoB2B = propuestas.reduce((acc, p) => acc + p.precioTotalCotizado, 0);
  const propuestasGanadas = propuestas.filter((p) => p.estado === 'Ganada / Aprobada').length;
  const colaboradoresTotalB2B = propuestas.reduce((acc, p) => acc + p.cantidadColaboradores, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Encabezado del Módulo */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-extrabold uppercase rounded tracking-wider">
              B2B & Capacitación Corporativa
            </span>
            <span className="text-xs text-slate-500 font-medium">Cotizador In-Company & Propuestas</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Gestor de Propuestas Corporativas B2B
          </h3>
          <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
            Estructura y cotiza diplomados cerrados a la medida de empresas e instituciones con cálculo dinámico de margen y emisión de carta comercial oficial.
          </p>
        </div>

        {/* Métricas Rápidas B2B */}
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 px-4 text-right">
            <span className="text-[10px] uppercase font-bold text-blue-800 block">Total Cotizado B2B</span>
            <span className="text-base font-black font-mono text-blue-950">
              {formatearMoneda(totalCotizadoB2B, moneda)}
            </span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 px-4 text-right">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">Ganadas / Aprobadas</span>
            <span className="text-base font-black font-mono text-emerald-950">
              {propuestasGanadas} / {propuestas.length}
            </span>
          </div>
        </div>
      </div>

      {/* Indicador de Origen de Datos: Manual vs Automático */}
      <div className="bg-slate-900 text-white rounded-xl p-3.5 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-extrabold text-[10px] border border-blue-400/30 shrink-0">
            ✍️ GESTIÓN MANUAL
          </span>
          <span className="text-slate-300 text-xs">
            Ingreso de empresa cliente, RTN, número de colaboradores requeridos y mentorías personalizadas.
          </span>
        </div>
        <div className="flex items-center gap-2.5 sm:border-l sm:border-slate-700 sm:pl-3">
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] border border-emerald-400/30 shrink-0">
            ⚡ 100% AUTOMÁTICO
          </span>
          <span className="text-emerald-100 text-xs">
            Escalas de descuento por volumen (10%, 18%, 25%), desglose de ISV y generación instantánea de la carta propuesta.
          </span>
        </div>
      </div>

      {guardadoExitoso && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Propuesta B2B registrada y actualizada en la base del programa.</span>
        </div>
      )}

      {/* Selector de Proyecto Base */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <label className="text-xs font-bold text-slate-700 block mb-2">
          Seleccionar Programa Formativo Base para Cotización In-Company:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {proyectos.map((p) => {
            const isSelected = p.id === proyectoActual?.id;
            const countPropuestas = p.propuestasCorporativasB2B?.length || 0;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSeleccionarProyecto(p)}
                className={`text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-blue-800 text-white border-blue-900 shadow-sm'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                <div className="text-[10px] font-mono uppercase tracking-wider opacity-80">
                  {p.codigoPrograma || `PROY-${p.id}`}
                </div>
                <h4 className="text-xs font-black line-clamp-1 mt-0.5">{p.nombreProyecto}</h4>
                <div className="flex items-center justify-between text-[10px] mt-1 opacity-90">
                  <span>Docente: {p.nombreDocente}</span>
                  <span className="font-bold">{countPropuestas} cotizaciones</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido: Cotizador + Listado + Visor de Carta Formal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Cotizador In-Company & Formulario */}
        <div className="lg:col-span-5 space-y-4">
          <form onSubmit={handleCrearPropuesta} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3.5">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <Plus className="w-4 h-4 text-blue-600" />
              Nueva Cotización In-Company
            </h4>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block">Empresa Cliente / Razón Social *</label>
              <input
                type="text"
                required
                placeholder="Ej. Cervecería Hondureña S.A. / Grupo Ficohsa"
                value={empresaCliente}
                onChange={(e) => setEmpresaCliente(e.target.value)}
                className="w-full mt-1 p-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block">RTN / Registro Fiscal</label>
                <input
                  type="text"
                  placeholder="08019001234567"
                  value={rtnOIdentificacion}
                  onChange={(e) => setRtnOIdentificacion(e.target.value)}
                  className="w-full mt-1 p-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block">Colaboradores (Lote) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={cantidadColaboradores}
                  onChange={(e) => setCantidadColaboradores(Number(e.target.value))}
                  className="w-full mt-1 p-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block">Contacto Responsable *</label>
                <input
                  type="text"
                  required
                  placeholder="Lic. Karla Durón"
                  value={contactoNombre}
                  onChange={(e) => setContactoNombre(e.target.value)}
                  className="w-full mt-1 p-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="kduron@empresa.com"
                  value={contactoEmail}
                  onChange={(e) => setContactoEmail(e.target.value)}
                  className="w-full mt-1 p-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {/* Parámetros Financieros B2B */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 block">
                Estructura de Costos & Margen B2B
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 block">Honorarios Docente In-Company:</label>
                  <input
                    type="number"
                    value={costoDocenteAjustado}
                    onChange={(e) => setCostoDocenteAjustado(Number(e.target.value))}
                    className="w-full mt-0.5 p-1.5 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 block">Margen B2B Deseado (%):</label>
                  <input
                    type="number"
                    min="10"
                    max="80"
                    value={margenB2BPct}
                    onChange={(e) => setMargenB2BPct(Number(e.target.value))}
                    className="w-full mt-0.5 p-1.5 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Resumen Calculado */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Precio Total Cotizado:</span>
                  <span className="text-sm font-black font-mono text-blue-900">
                    {formatearMoneda(precioTotalCotizadoSugerido, moneda)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px]">Inversión x Colaborador:</span>
                  <span className="text-sm font-black font-mono text-emerald-700">
                    {formatearMoneda(precioPorColaboradorSugerido, moneda)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-exencion-b2b"
                  checked={aplicaExencionISV}
                  onChange={(e) => setAplicaExencionISV(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <label htmlFor="chk-exencion-b2b" className="text-[11px] text-slate-700 font-semibold cursor-pointer">
                  Aplica Exención 0% ISV (Acreditación Educativa)
                </label>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block">Condiciones & Notas de Negociación:</label>
              <textarea
                placeholder="Ej. Fechas especiales, 2 pagos (50% anticipo, 50% al finalizar)..."
                value={notasNegociacion}
                onChange={(e) => setNotasNegociacion(e.target.value)}
                rows={2}
                className="w-full mt-1 p-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-black rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Generar y Guardar Propuesta B2B</span>
            </button>
          </form>

          {/* Listado de Propuestas Existentes */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2.5">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-2">
              <span>Propuestas B2B en Seguimiento ({propuestas.length})</span>
            </h4>

            {propuestas.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No hay propuestas B2B registradas para este programa.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {propuestas.map((p) => {
                  const isActive = propuestaActiva?.id === p.id;
                  let badgeColor = 'bg-slate-100 text-slate-700';
                  if (p.estado === 'Ganada / Aprobada') badgeColor = 'bg-emerald-100 text-emerald-800';
                  if (p.estado === 'Negociación') badgeColor = 'bg-blue-100 text-blue-800';
                  if (p.estado === 'Enviada') badgeColor = 'bg-amber-100 text-amber-800';
                  if (p.estado === 'Rechazada') badgeColor = 'bg-red-100 text-red-800';

                  return (
                    <div
                      key={p.id}
                      onClick={() => setPropuestaActiva(p)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isActive
                          ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-400'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h5 className="text-xs font-bold text-slate-900">{p.empresaCliente}</h5>
                          <span className="text-[10px] text-slate-500 block">
                            {p.cantidadColaboradores} colaboradores • {p.contactoNombre}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${badgeColor}`}>
                          {p.estado}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-xs font-mono">
                        <span className="font-black text-blue-900">
                          {formatearMoneda(p.precioTotalCotizado, moneda)}
                        </span>
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={p.estado}
                            onChange={(e) =>
                              handleCambiarEstado(
                                p.id,
                                e.target.value as NonNullable<ProyectoEducativo['propuestasCorporativasB2B']>[0]['estado']
                              )
                            }
                            className="text-[10px] bg-white border border-slate-300 rounded p-0.5"
                          >
                            <option value="Borrador">Borrador</option>
                            <option value="Enviada">Enviada</option>
                            <option value="Negociación">Negociación</option>
                            <option value="Ganada / Aprobada">Ganada</option>
                            <option value="Rechazada">Rechazada</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleEliminarPropuesta(p.id)}
                            className="text-slate-400 hover:text-red-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Vista Previa de la Carta Propuesta Formal B2B */}
        <div className="lg:col-span-7 space-y-4">
          {propuestaActiva ? (
            <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-md p-6 relative overflow-hidden">
              {/* Botón Imprimir Carta Formal */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-900 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                  DOCUMENTO OFICIAL • PROPUESTA TÉCNICA Y ECONÓMICA B2B
                </span>
                <button
                  type="button"
                  onClick={handleImprimirPropuesta}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Propuesta</span>
                </button>
              </div>

              {/* Membrete Oficial */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <SummitLogo variant="full" size="md" />
                  <div className="text-[10px] text-slate-500 mt-1">
                    <span className="font-bold text-slate-800">Summit Impulsa S. de R.L.</span> | RTN: <span className="font-mono font-bold text-slate-900">05019026435770</span>
                    <br />
                    San Pedro Sula, Cortés, Honduras | info@summitimpulsa.com
                  </div>
                </div>
                <div className="text-right text-xs">
                  <span className="font-mono text-slate-500 block text-[10px]">CÓDIGO DE COTIZACIÓN</span>
                  <span className="font-mono font-bold text-slate-900 uppercase">
                    B2B-{propuestaActiva.id.slice(-6)}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Fecha: {propuestaActiva.fechaEmision}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Vigencia hasta: {propuestaActiva.fechaValidez}
                  </span>
                </div>
              </div>

              {/* Destinatario */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-5 text-xs">
                <span className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider block">
                  DIRIGIDO A:
                </span>
                <h3 className="text-sm font-black text-slate-900">{propuestaActiva.empresaCliente}</h3>
                <div className="text-slate-600 mt-0.5">
                  <span className="font-semibold">Atención: </span>
                  {propuestaActiva.contactoNombre} • {propuestaActiva.contactoEmail} • {propuestaActiva.contactoTelefono || 'N/D'}
                </div>
                <div className="text-slate-500 text-[10px]">RTN: {propuestaActiva.rtnOIdentificacion || 'Consumidor Final'}</div>
              </div>

              {/* Cuerpo de la Carta */}
              <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
                <p>
                  Estimados señores de <strong>{propuestaActiva.empresaCliente}</strong>, por medio de la presente nos complace someter a su consideración nuestra propuesta técnica y económica para la impartición del programa de formación ejecutiva in-company titulado:
                </p>

                <div className="bg-blue-900 text-white rounded-xl p-4">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-300 block">
                    PROGRAMA CORPORATIVO A LA MEDIDA
                  </span>
                  <h4 className="text-base font-black text-white mt-0.5">
                    {proyectoActual?.nombreProyecto}
                  </h4>
                  <div className="flex flex-wrap gap-4 text-xs text-blue-200 mt-2 pt-2 border-t border-blue-800">
                    <span><strong>Duración:</strong> {proyectoActual?.horasClase || 24} Horas Lectivas</span>
                    <span><strong>Docente Titular:</strong> {proyectoActual?.nombreDocente}</span>
                    <span><strong>Grupo:</strong> {propuestaActiva.cantidadColaboradores} Colaboradores</span>
                  </div>
                </div>

                {/* Desglose de Inversión */}
                <div>
                  <h5 className="font-bold text-slate-900 uppercase text-[11px] mb-1.5">
                    1. Desglose de Inversión Económica:
                  </h5>
                  <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        <th className="p-2 text-left">Concepto</th>
                        <th className="p-2 text-center">Colaboradores</th>
                        <th className="p-2 text-right">Inversión x Pax</th>
                        <th className="p-2 text-right">Total Neto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-2 font-medium">
                          Paquete de Capacitación Ejecutiva Cerrada (Syllabus Completo + Materiales + Campus Virtual + Certificación QR)
                        </td>
                        <td className="p-2 text-center font-mono">{propuestaActiva.cantidadColaboradores}</td>
                        <td className="p-2 text-right font-mono font-bold">
                          {formatearMoneda(propuestaActiva.precioPorColaborador, moneda)}
                        </td>
                        <td className="p-2 text-right font-mono font-black text-blue-950">
                          {formatearMoneda(propuestaActiva.precioTotalCotizado, moneda)}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold">
                      <tr>
                        <td colSpan={3} className="p-2 text-right text-slate-600">
                          Tratamiento Fiscal (0% ISV según Acreditación Académica):
                        </td>
                        <td className="p-2 text-right font-mono text-emerald-800">
                          {propuestaActiva.aplicaExencionISV ? 'Exento 0% ISV' : '+ 15% ISV'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Condiciones Comerciales */}
                <div>
                  <h5 className="font-bold text-slate-900 uppercase text-[11px] mb-1">
                    2. Condiciones y Términos Comerciales:
                  </h5>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                    <li>Modalidad y plataforma: Aula virtual Summit Impulsa con acceso 24/7 a grabaciones en HD.</li>
                    <li>Forma de pago: 50% al aceptar la propuesta y 50% contra entrega de actas de calificaciones y diplomas.</li>
                    <li>Reporte de gestión: Se entregará informe de asistencia semanal y reporte final de competencias adquiridas.</li>
                    {propuestaActiva.notasNegociacion && (
                      <li className="font-semibold text-blue-900">Nota especial: {propuestaActiva.notasNegociacion}</li>
                    )}
                  </ul>
                </div>

                {/* Firmas */}
                <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-slate-200 text-center">
                  <div>
                    <div className="border-b border-slate-400 w-40 mx-auto pb-6"></div>
                    <span className="text-xs font-bold text-slate-900 block mt-1.5">Lic. Walter Pedroza</span>
                    <span className="text-[10px] text-slate-500 block">Gerencia de Comercialización & B2B</span>
                    <span className="text-[9px] text-slate-400">Summit Impulsa</span>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 w-40 mx-auto pb-6"></div>
                    <span className="text-xs font-bold text-slate-900 block mt-1.5">{propuestaActiva.contactoNombre}</span>
                    <span className="text-[10px] text-slate-500 block">Aceptación y Firma Cliente</span>
                    <span className="text-[9px] text-slate-400">{propuestaActiva.empresaCliente}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center text-slate-500">
              <Building2 className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-xs font-semibold">Seleccione una propuesta de la lista o genere una nueva para visualizar la carta oficial.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
