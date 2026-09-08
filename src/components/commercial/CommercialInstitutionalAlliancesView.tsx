import React, { useState } from 'react';
import { ProyectoEducativo, Moneda } from '../../types';
import {
  Building,
  Handshake,
  Plus,
  CheckCircle2,
  Percent,
  Users,
  DollarSign,
  Copy,
  Check,
  Trash2,
  FileCheck,
  Search,
  ExternalLink,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { formatearMoneda } from '../../utils/calculations';

export interface CommercialInstitutionalAlliancesViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto: (p: ProyectoEducativo) => void;
  conveniosCompartidos?: ConvenioInstitucional[];
  setConveniosCompartidos?: React.Dispatch<React.SetStateAction<ConvenioInstitucional[]>>;
}

export interface ConvenioInstitucional {
  id: string;
  nombreInstitucion: string;
  tipo: 'Colegio Profesional' | 'Cámara de Comercio' | 'Empresa Privada' | 'Universidad Aliada' | 'Asociación Gremial';
  contactoClave: string;
  cargoContacto: string;
  telefono: string;
  correo: string;
  codigoConvenio: string;
  descuentoAfiliadosPct: number;
  alumnosMatriculados: number;
  facturadoTotalLPS: number;
  fechaFirma: string;
  fechaVigenciaFin: string;
  estado: 'Activo Vigente' | 'En Renovación' | 'Pausado' | 'Vencido';
  programasAplica: string[];
  beneficioAdicional: string;
}

export const CONVENIOS_INICIALES: ConvenioInstitucional[] = [];

export const CommercialInstitutionalAlliancesView: React.FC<CommercialInstitutionalAlliancesViewProps> = ({
  proyectos,
  moneda,
  onGuardarProyecto: _onGuardarProyecto,
  conveniosCompartidos,
  setConveniosCompartidos,
}) => {
  const [conveniosLocales, setConveniosLocales] = useState<ConvenioInstitucional[]>(CONVENIOS_INICIALES);
  
  const convenios = conveniosCompartidos || conveniosLocales;
  const setConvenios = setConveniosCompartidos || setConveniosLocales;

  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Formulario de nuevo convenio
  const [nombreInstitucion, setNombreInstitucion] = useState('');
  const [tipo, setTipo] = useState<ConvenioInstitucional['tipo']>('Colegio Profesional');
  const [contactoClave, setContactoClave] = useState('');
  const [cargoContacto, setCargoContacto] = useState('');
  const [telefono, setTelefono] = useState('+504 ');
  const [correo, setCorreo] = useState('');
  const [codigoConvenio, setCodigoConvenio] = useState('');
  const [descuentoPct, setDescuentoPct] = useState(15);
  const [fechaFin, setFechaFin] = useState('2026-12-31');
  const [beneficioAdicional, setBeneficioAdicional] = useState('');
  const [programaAplicaSel, setProgramaAplicaSel] = useState<string>('todos');

  const handleCrearConvenio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreInstitucion.trim()) return;

    const codigoGenerado = codigoConvenio.trim() || `${nombreInstitucion.slice(0, 4).toUpperCase()}-SUMMIT-${descuentoPct}`;

    const nuevo: ConvenioInstitucional = {
      id: `conv-${Date.now()}`,
      nombreInstitucion: nombreInstitucion.trim(),
      tipo,
      contactoClave: contactoClave.trim(),
      cargoContacto: cargoContacto.trim(),
      telefono: telefono.trim(),
      correo: correo.trim(),
      codigoConvenio: codigoGenerado,
      descuentoAfiliadosPct: Number(descuentoPct),
      alumnosMatriculados: 0,
      facturadoTotalLPS: 0,
      fechaFirma: new Date().toISOString().split('T')[0],
      fechaVigenciaFin: fechaFin,
      estado: 'Activo Vigente',
      programasAplica: [programaAplicaSel],
      beneficioAdicional: beneficioAdicional.trim() || 'Descuento para afiliados activos presentado su carnet o constancia.'
    };

    setConvenios([nuevo, ...convenios]);
    setNombreInstitucion('');
    setContactoClave('');
    setCargoContacto('');
    setCorreo('');
    setCodigoConvenio('');
    setBeneficioAdicional('');
    setMostrarFormulario(false);
    setMensajeExito(`¡Convenio con "${nuevo.nombreInstitucion}" registrado exitosamente con código ${nuevo.codigoConvenio}!`);
    setTimeout(() => setMensajeExito(null), 3500);
  };

  const handleCopiarCodigo = (id: string, codigo: string) => {
    navigator.clipboard.writeText(codigo);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2500);
  };

  const handleAjustarAlumnos = (id: string, incremento: number) => {
    setConvenios(convenios.map(c => {
      if (c.id === id) {
        const nuevos = Math.max(0, c.alumnosMatriculados + incremento);
        const valorEstimadoPorAlumno = 3200 * (1 - c.descuentoAfiliadosPct / 100);
        return {
          ...c,
          alumnosMatriculados: nuevos,
          facturadoTotalLPS: Math.round(nuevos * valorEstimadoPorAlumno)
        };
      }
      return c;
    }));
  };

  const handleEliminar = (id: string) => {
    setConvenios(convenios.filter(c => c.id !== id));
  };

  const conveniosFiltrados = convenios.filter(c => {
    if (filtroTipo !== 'todos' && c.tipo !== filtroTipo) return false;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      return (
        c.nombreInstitucion.toLowerCase().includes(q) ||
        c.codigoConvenio.toLowerCase().includes(q) ||
        c.contactoClave.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalConvenios = convenios.length;
  const totalAlumnosConvenios = convenios.reduce((acc, c) => acc + c.alumnosMatriculados, 0);
  const totalFacturadoConvenios = convenios.reduce((acc, c) => acc + c.facturadoTotalLPS, 0);

  return (
    <div className="space-y-6">
      {/* Header y métricas */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 text-white p-5 rounded-2xl border border-blue-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 text-xs font-bold mb-2">
              <Handshake className="w-3.5 h-3.5" />
              <span>Directorio de Convenios y Gremios</span>
            </div>
            <h2 className="text-xl font-black tracking-tight">
              Alianzas Institucionales & Colegios Profesionales
            </h2>
            <p className="text-xs text-blue-200/80 mt-0.5">
              Acuerdos marco de descuento y paquetes educativos para colegios de ingenieros, cámaras y empresas.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>✍️ Registrar Nuevo Convenio</span>
          </button>
        </div>

        {/* Métricas de impacto de convenios */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-blue-800/60 text-xs">
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-blue-200">Convenios Vigentes</span>
              <div className="text-lg font-black font-mono">{totalConvenios} instituciones</div>
            </div>
          </div>

          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-blue-200">Alumnos Captados x Convenio</span>
              <div className="text-lg font-black font-mono text-emerald-400">{totalAlumnosConvenios} alumnos</div>
            </div>
          </div>

          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-blue-200">Facturación Generada</span>
              <div className="text-lg font-black font-mono text-amber-300">
                {formatearMoneda(totalFacturadoConvenios, moneda)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {mensajeExito && (
        <div className="p-3 bg-blue-50 border border-blue-300 text-blue-950 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* Formulario Manual de Alta de Convenio */}
      {mostrarFormulario && (
        <form onSubmit={handleCrearConvenio} className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-blue-100">
            <h3 className="text-sm font-black text-blue-950 flex items-center gap-2">
              <Handshake className="w-4 h-4 text-blue-600" />
              <span>Alta de Convenio Institucional o Gremial</span>
            </h3>
            <button
              type="button"
              onClick={() => setMostrarFormulario(false)}
              className="text-xs text-slate-400 hover:text-slate-700"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nombre de la Institución / Gremio / Empresa *
              </label>
              <input
                type="text"
                required
                value={nombreInstitucion}
                onChange={(e) => setNombreInstitucion(e.target.value)}
                placeholder="Ej: Asociación Hondureña de Instituciones Bancarias (AHIBA)"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipo de Organización
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as ConvenioInstitucional['tipo'])}
                className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg font-semibold"
              >
                <option value="Colegio Profesional">Colegio Profesional</option>
                <option value="Cámara de Comercio">Cámara de Comercio</option>
                <option value="Empresa Privada">Empresa Privada</option>
                <option value="Universidad Aliada">Universidad Aliada</option>
                <option value="Asociación Gremial">Asociación Gremial</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contacto Principal
              </label>
              <input
                type="text"
                value={contactoClave}
                onChange={(e) => setContactoClave(e.target.value)}
                placeholder="Ej: Lic. Mario Santos"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cargo
              </label>
              <input
                type="text"
                value={cargoContacto}
                onChange={(e) => setCargoContacto(e.target.value)}
                placeholder="Ej: Gerente de RRHH"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Teléfono / WhatsApp
              </label>
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="convenios@empresa.hn"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Código Promocional de Convenio
              </label>
              <input
                type="text"
                value={codigoConvenio}
                onChange={(e) => setCodigoConvenio(e.target.value.toUpperCase())}
                placeholder="Ej: AHIBA-SUMMIT-20"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                % Descuento Autorizado a Afiliados
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  max="40"
                  value={descuentoPct}
                  onChange={(e) => setDescuentoPct(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold text-blue-900"
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">%</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha Límite de Vigencia
              </label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Programa Académico Asociado (Gerencia Académica)
              </label>
              {proyectos.length > 0 ? (
                <select
                  value={programaAplicaSel}
                  onChange={(e) => setProgramaAplicaSel(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-semibold text-slate-800"
                >
                  <option value="todos">Todos los programas autorizados (POA 2026)</option>
                  {proyectos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.codigoPrograma || 'PROG'} - {p.nombreProyecto}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-[11px] bg-amber-50 text-amber-800 p-2 rounded-lg border border-amber-200">
                  ⚠️ Sin proyectos en Gerencia Académica. El convenio aplicará a toda la oferta POA 2026 tan pronto se formulen los cursos.
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Condiciones y Beneficios Pactados
            </label>
            <textarea
              rows={2}
              value={beneficioAdicional}
              onChange={(e) => setBeneficioAdicional(e.target.value)}
              placeholder="Ej: Aplicable a todos los cursos de SUMMIT. Exige presentar constancia de colegiación activa..."
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Guardar Convenio Institucional</span>
            </button>
          </div>
        </form>
      )}

      {/* Barra de búsqueda y filtro */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por institución, código de convenio o contacto..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
          />
        </div>

        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
        >
          <option value="todos">Todos los Tipos de Alianza</option>
          <option value="Colegio Profesional">Colegios Profesionales</option>
          <option value="Cámara de Comercio">Cámaras de Comercio</option>
          <option value="Empresa Privada">Empresas Privadas</option>
          <option value="Universidad Aliada">Universidades Aliadas</option>
          <option value="Asociación Gremial">Asociaciones Gremiales</option>
        </select>
      </div>

      {/* Tarjetas de Convenios */}
      {conveniosFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-blue-200 p-8 text-center shadow-xs">
          <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-blue-200 shadow-2xs">
            <Handshake className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-black text-slate-900">
            Sin Alianzas ni Convenios Institucionales Registrados
          </h4>
          <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
            {busqueda.trim() || filtroTipo !== 'todos'
              ? 'No se encontraron convenios que coincidan con la búsqueda o filtro aplicado.'
              : 'Bajo la lógica del POA 2026, los convenios con colegios profesionales, cámaras y empresas aliadas se registran manualmente y se vinculan a la oferta de programas autorizados por la Gerencia Académica.'}
          </p>
          {!mostrarFormulario && (
            <button
              type="button"
              onClick={() => setMostrarFormulario(true)}
              className="mt-4 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>✍️ Registrar Primer Convenio (POA 2026)</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {conveniosFiltrados.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between hover:border-blue-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                    {c.tipo}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {c.estado}
                  </span>
                </div>

                <h4 className="text-sm font-black text-slate-900 leading-snug">
                  {c.nombreInstitucion}
                </h4>

                {/* Cupón & Descuento */}
                <div className="mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Código Convenio</span>
                    <span className="font-mono text-xs font-black text-blue-900 tracking-wider">
                      {c.codigoConvenio}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      -{c.descuentoAfiliadosPct}%
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopiarCodigo(c.id, c.codigoConvenio)}
                      className="p-1 text-slate-500 hover:text-blue-700 rounded hover:bg-slate-200 transition-colors"
                      title="Copiar código al portapapeles"
                    >
                      {copiadoId === c.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Datos de contacto */}
                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  {c.contactoClave && (
                    <p className="text-[11px]">
                      👤 <strong>{c.contactoClave}</strong> {c.cargoContacto ? `(${c.cargoContacto})` : ''}
                    </p>
                  )}
                  {c.telefono && (
                    <p className="text-[11px] font-mono text-slate-500">
                      📞 {c.telefono}
                    </p>
                  )}
                  {c.correo && (
                    <p className="text-[11px] text-blue-700 truncate">
                      ✉️ {c.correo}
                    </p>
                  )}
                </div>

                {/* Rendimiento comercial del convenio */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-600 font-semibold">Alumnos matriculados:</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleAjustarAlumnos(c.id, -1)}
                        className="w-5 h-5 flex items-center justify-center bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-bold text-xs"
                        title="Restar 1 alumno"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-mono font-black text-slate-900 text-xs">
                        {c.alumnosMatriculados}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAjustarAlumnos(c.id, 1)}
                        className="w-5 h-5 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs"
                        title="Sumar 1 alumno"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Facturado estimado:</span>
                    <span className="font-mono font-bold text-emerald-800">
                      {formatearMoneda(c.facturadoTotalLPS, moneda)}
                    </span>
                  </div>
                </div>

                {c.beneficioAdicional && (
                  <p className="text-[10px] text-slate-500 italic mt-2 bg-blue-50/40 p-2 rounded-lg border border-blue-100/50">
                    "{c.beneficioAdicional}"
                  </p>
                )}
              </div>

              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Vence: {c.fechaVigenciaFin}</span>
                <button
                  type="button"
                  onClick={() => handleEliminar(c.id)}
                  className="text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
