import React, { useState } from 'react';
import {
  ProyectoEducativo,
  Moneda,
} from '../../types';
import { formatearMoneda } from '../../utils/calculations';
import {
  UserCheck,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Search,
  Filter,
  ArrowRight,
  GraduationCap,
  DollarSign,
  Phone,
  Mail,
  Building,
  Layers,
  Send,
  AlertCircle,
  ExternalLink,
  Users,
  ShieldCheck,
} from 'lucide-react';

interface CommercialAdmissionsCRMViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto: (proyectoActualizado: ProyectoEducativo) => void;
  onAutorizarComercial?: (proyecto: ProyectoEducativo) => void;
}

export const CommercialAdmissionsCRMView: React.FC<CommercialAdmissionsCRMViewProps> = ({
  proyectos,
  moneda,
  onGuardarProyecto,
  onAutorizarComercial,
}) => {
  const [proyectoSeleccionadoId, setProyectoSeleccionadoId] = useState<string>(
    proyectos.length > 0 ? proyectos[0].id : ''
  );

  const proyectoActual = proyectos.find((p) => p.id === proyectoSeleccionadoId) || proyectos[0];

  // Prospectos del CRM
  const [prospectos, setProspectos] = useState<
    NonNullable<ProyectoEducativo['crmProspectosCohorte']>
  >(
    proyectoActual?.crmProspectosCohorte || []
  );

  // Formulario nuevo lead
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [cargo, setCargo] = useState('');
  const [etapa, setEtapa] = useState<NonNullable<ProyectoEducativo['crmProspectosCohorte']>[0]['etapa']>('Lead Nuevo');
  const [origenLead, setOrigenLead] = useState<NonNullable<ProyectoEducativo['crmProspectosCohorte']>[0]['origenLead']>('Meta Ads');
  const [asesorAsignado, setAsesorAsignado] = useState('Lic. Andrea Mejía');
  const [filtroEtapa, setFiltroEtapa] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);
  const [mensajeTraspaso, setMensajeTraspaso] = useState<string | null>(null);

  const handleSeleccionarProyecto = (p: ProyectoEducativo) => {
    setProyectoSeleccionadoId(p.id);
    setProspectos(p.crmProspectosCohorte || []);
    setGuardadoExitoso(false);
  };

  const handleCrearLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !correo.trim()) return;

    const nuevo: NonNullable<ProyectoEducativo['crmProspectosCohorte']>[0] = {
      id: `lead-${Date.now()}`,
      nombre,
      correo,
      telefono,
      empresa,
      cargo,
      etapa,
      origenLead,
      cumplePrerrequisitos: false,
      montoPagado: etapa === 'Inscrito Oficial' ? (proyectoActual?.precioSugeridoAlumno || 2500) : 0,
      metodoPago: etapa === 'Inscrito Oficial' ? 'Transferencia' : 'Pendiente',
      fechaRegistro: new Date().toISOString().split('T')[0],
      asesorAsignado,
      traspasadoAAula: false,
    };

    const actualizados = [nuevo, ...prospectos];
    setProspectos(actualizados);

    // Resetear formulario
    setNombre('');
    setCorreo('');
    setTelefono('');
    setEmpresa('');
    setCargo('');
    setEtapa('Lead Nuevo');

    if (proyectoActual) {
      onGuardarProyecto({
        ...proyectoActual,
        crmProspectosCohorte: actualizados,
      });
      setGuardadoExitoso(true);
      setTimeout(() => setGuardadoExitoso(false), 3000);
    }
  };

  const handleCambiarEtapa = (
    id: string,
    nuevaEtapa: NonNullable<ProyectoEducativo['crmProspectosCohorte']>[0]['etapa']
  ) => {
    const actualizados = prospectos.map((p) => {
      if (p.id === id) {
        const monto = nuevaEtapa === 'Inscrito Oficial' && p.montoPagado === 0 ? (proyectoActual?.precioSugeridoAlumno || 2500) : p.montoPagado;
        return {
          ...p,
          etapa: nuevaEtapa,
          montoPagado: monto,
        };
      }
      return p;
    });
    setProspectos(actualizados);
    if (proyectoActual) {
      onGuardarProyecto({
        ...proyectoActual,
        crmProspectosCohorte: actualizados,
      });
    }
  };

  // Traspaso automático del estudiante al Gradebook y Control de Asistencia de Académica
  const handleTraspasarAAula = (lead: NonNullable<ProyectoEducativo['crmProspectosCohorte']>[0]) => {
    if (!proyectoActual) return;

    // Actualizar lista de estudiantes de Gradebook
    const notasExistentes = proyectoActual.actaCalificaciones?.estudiantesNotas || [];
    const yaExisteEnGradebook = notasExistentes.some((e) => e.correo === lead.correo || e.nombreEstudiante === lead.nombre);

    let nuevasNotas = [...notasExistentes];
    if (!yaExisteEnGradebook) {
      nuevasNotas.push({
        idEstudiante: `EST-${Date.now().toString().slice(-4)}`,
        nombreEstudiante: lead.nombre,
        correo: lead.correo,
        empresa: lead.empresa || 'Individual',
        notaTalleres: 0,
        notaProyectoFinal: 0,
        notaParticipacion: 100,
        notaExamen: 0,
        asistenciaPct: 100,
        promedioFinal: 0,
        estadoFinal: 'En Recuperación',
        observaciones: `Matriculado vía Comercialización (${lead.origenLead}). Asesor: ${lead.asesorAsignado || 'Comercial'}`,
      });
    }

    // Actualizar estado en CRM
    const prospectosActualizados = prospectos.map((p) =>
      p.id === lead.id ? { ...p, traspasadoAAula: true, etapa: 'Inscrito Oficial' as const } : p
    );
    setProspectos(prospectosActualizados);

    // Guardar proyecto integrado
    const proyectoActualizado: ProyectoEducativo = {
      ...proyectoActual,
      crmProspectosCohorte: prospectosActualizados,
      alumnosFinal: Math.max(proyectoActual.alumnosFinal || 0, nuevasNotas.length),
      actaCalificaciones: {
        estadoActa: proyectoActual.actaCalificaciones?.estadoActa || 'Abierta / En Curso',
        fechaCierre: proyectoActual.actaCalificaciones?.fechaCierre,
        docenteFirma: proyectoActual.actaCalificaciones?.docenteFirma,
        direccionFirma: proyectoActual.actaCalificaciones?.direccionFirma,
        estudiantesNotas: nuevasNotas,
      },
    };

    onGuardarProyecto(proyectoActualizado);
    setMensajeTraspaso(`¡Estudiante ${lead.nombre} traspasado exitosamente al Aula Virtual y Gradebook Académico!`);
    setTimeout(() => setMensajeTraspaso(null), 4000);
  };

  const handleEliminarLead = (id: string) => {
    const actualizados = prospectos.filter((p) => p.id !== id);
    setProspectos(actualizados);
    if (proyectoActual) {
      onGuardarProyecto({
        ...proyectoActual,
        crmProspectosCohorte: actualizados,
      });
    }
  };

  // Filtrado
  const prospectosFiltrados = prospectos.filter((p) => {
    const cumpleFiltroEtapa = filtroEtapa === 'todos' || p.etapa === filtroEtapa;
    const cumpleBusqueda =
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.correo.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.empresa && p.empresa.toLowerCase().includes(busqueda.toLowerCase()));
    return cumpleFiltroEtapa && cumpleBusqueda;
  });

  // Métricas del Pipeline
  const totalLeads = prospectos.length;
  const inscritosConfirmados = prospectos.filter((p) => p.etapa === 'Inscrito Oficial').length;
  const matriculasReservadas = prospectos.filter((p) => p.etapa === 'Matrícula Reservada').length;
  const totalRecaudadoCRM = prospectos.reduce((acc, p) => acc + (p.montoPagado || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Encabezado del Módulo */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[11px] font-extrabold uppercase rounded tracking-wider">
              Admissions CRM & Enrollment
            </span>
            <span className="text-xs text-slate-500 font-medium">Pipeline Individual por Cohorte</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-purple-600" />
            CRM de Admisiones & Traspaso al Aula Virtual
          </h3>
          <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
            Gestión individual de prospectos, validación de prerrequisitos, cobro de matrícula y traspaso automático de inscritos confirmados al Libro de Calificaciones Académico.
          </p>
        </div>

        {/* 3 KPIs de Admisiones */}
        <div className="flex items-center gap-3">
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-2.5 px-4 text-right">
            <span className="text-[10px] uppercase font-bold text-purple-800 block">Inscritos Oficiales</span>
            <span className="text-base font-black font-mono text-purple-950">
              {inscritosConfirmados} / {totalLeads}
            </span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 px-4 text-right">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">Recaudación CRM</span>
            <span className="text-base font-black font-mono text-emerald-950">
              {formatearMoneda(totalRecaudadoCRM, moneda)}
            </span>
          </div>
        </div>
      </div>

      {/* Indicador de Origen de Datos: Manual vs Automático */}
      <div className="bg-slate-900 text-white rounded-xl p-3.5 border border-purple-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-extrabold text-[10px] border border-blue-400/30 shrink-0">
            ✍️ GESTIÓN MANUAL
          </span>
          <span className="text-slate-300 text-xs">
            El asesor registra prospectos, teléfonos y califica el avance del postulante.
          </span>
        </div>
        <div className="flex items-center gap-2.5 sm:border-l sm:border-slate-700 sm:pl-3">
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] border border-emerald-400/30 shrink-0">
            ⚡ 100% AUTOMÁTICO
          </span>
          <span className="text-emerald-200 text-xs">
            Al pulsar <strong>"Traspasar a Aula"</strong>, se matricula directamente en el <em>Libro de Calificaciones</em> y <em>Asistencia</em>.
          </span>
        </div>
      </div>

      {mensajeTraspaso && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl text-xs font-black flex items-center gap-2 shadow-md animate-in fade-in">
          <GraduationCap className="w-5 h-5 shrink-0" />
          <span>{mensajeTraspaso}</span>
        </div>
      )}

      {guardadoExitoso && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>CRM de Admisiones sincronizado correctamente.</span>
        </div>
      )}

      {/* Selector de Cohorte / Proyecto */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <label className="text-xs font-bold text-slate-700 block mb-2">
          Seleccionar Cohorte / Programa Formativo:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {proyectos.map((p) => {
            const isSelected = p.id === proyectoActual?.id;
            const countLeads = p.crmProspectosCohorte?.length || 0;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSeleccionarProyecto(p)}
                className={`text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-purple-800 text-white border-purple-900 shadow-sm'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                <div className="text-[10px] font-mono uppercase tracking-wider opacity-80">
                  {p.codigoPrograma || `SEC-${p.id}`}
                </div>
                <h4 className="text-xs font-black line-clamp-1 mt-0.5">{p.nombreProyecto}</h4>
                <div className="flex items-center justify-between text-[10px] mt-1 opacity-90">
                  <span>Inscritos: {p.alumnosFinal || p.alumnosProyectados || 0}</span>
                  <span className="font-bold">{countLeads} prospectos</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Banner de Autorización Comercial para Gerencia General (Paso 2 -> Paso 3) */}
      {proyectoActual && (
        <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border border-emerald-700/80 rounded-xl p-4 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                Paso 2 de 3: Comercialización & Matrícula
              </span>
              <span className="text-xs text-white font-bold">
                {proyectoActual.nombreProyecto}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {proyectoActual.autorizacionComercial 
                ? '✓ Proceso comercial completado y autorizado. Remitido a Gerencia General para su revisión y rebaja formal del POA 2026.'
                : 'Al finalizar la captación, promoción y matrícula de estudiantes, pulse "Autorizar y Enviar a Gerencia General" para continuar el flujo institucional.'}
            </p>
          </div>

          <div className="shrink-0">
            {proyectoActual.autorizacionComercial ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-xl text-xs font-bold whitespace-nowrap">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Autorizado para Gerencia General</span>
              </span>
            ) : onAutorizarComercial ? (
              <button
                type="button"
                onClick={() => onAutorizarComercial(proyectoActual)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer hover:scale-105 whitespace-nowrap"
                title="Autorizar venta y matrícula y pasar a Gerencia General"
              >
                <ShieldCheck className="w-4 h-4 text-slate-950" />
                <span>Autorizar y Enviar a Gerencia General</span>
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* Grid: Formulario Nuevo Lead + Tabla / Pipeline del CRM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulario Registro Nuevo Lead */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <form onSubmit={handleCrearLead} className="space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <Plus className="w-4 h-4 text-purple-600" />
              Registrar Nuevo Prospecto
            </h4>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block">Nombre Completo del Postulante *</label>
              <input
                type="text"
                required
                placeholder="Lic. Daniel Osorto"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full mt-1 p-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="dosorto@empresa.com"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="w-full mt-1 p-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  placeholder="+504 9988-1122"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full mt-1 p-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block">Empresa / Institución</label>
                <input
                  type="text"
                  placeholder="Banco Central"
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  className="w-full mt-1 p-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block">Cargo Actual</label>
                <input
                  type="text"
                  placeholder="Analista Senior"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  className="w-full mt-1 p-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block">Origen del Lead:</label>
                <select
                  value={origenLead}
                  onChange={(e) => setOrigenLead(e.target.value as any)}
                  className="w-full mt-1 p-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Meta Ads">Meta Ads (Instagram/FB)</option>
                  <option value="Google Search">Google Search</option>
                  <option value="LinkedIn B2B">LinkedIn B2B</option>
                  <option value="Referido Alumni">Referido Alumni</option>
                  <option value="Convenio Institucional">Convenio Institucional</option>
                  <option value="Web Orgánica">Sitio Web Orgánico</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block">Asesor Asignado:</label>
                <select
                  value={asesorAsignado}
                  onChange={(e) => setAsesorAsignado(e.target.value)}
                  className="w-full mt-1 p-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Lic. Andrea Mejía">Lic. Andrea Mejía</option>
                  <option value="Lic. Kevin Castro">Lic. Kevin Castro</option>
                  <option value="Lic. Pamela Flores">Lic. Pamela Flores</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block">Etapa Inicial de Admisión:</label>
              <select
                value={etapa}
                onChange={(e) => setEtapa(e.target.value as any)}
                className="w-full mt-1 p-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="Lead Nuevo">Lead Nuevo</option>
                <option value="Contactado">Contactado</option>
                <option value="Test Prerrequisitos">Test Prerrequisitos</option>
                <option value="Entrevista Admisión">Entrevista Admisión</option>
                <option value="Matrícula Reservada">Matrícula Reservada</option>
                <option value="Inscrito Oficial">Inscrito Oficial (Pagado)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-black rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar en CRM</span>
            </button>
          </form>
        </div>

        {/* Tabla y Pipeline de Prospectos */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3.5">
          {/* Barra de Filtros & Búsqueda */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar prospecto por nombre, correo o empresa..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={filtroEtapa}
                onChange={(e) => setFiltroEtapa(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg p-1.5 bg-white"
              >
                <option value="todos">Todas las Etapas ({prospectos.length})</option>
                <option value="Lead Nuevo">Lead Nuevo</option>
                <option value="Contactado">Contactado</option>
                <option value="Test Prerrequisitos">Test Prerrequisitos</option>
                <option value="Entrevista Admisión">Entrevista Admisión</option>
                <option value="Matrícula Reservada">Matrícula Reservada</option>
                <option value="Inscrito Oficial">Inscrito Oficial</option>
              </select>
            </div>
          </div>

          {/* Listado de Prospectos */}
          {prospectosFiltrados.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">No se encontraron prospectos con los filtros seleccionados.</p>
          ) : (
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {prospectosFiltrados.map((lead) => {
                let badgeEtapa = 'bg-slate-100 text-slate-700';
                if (lead.etapa === 'Inscrito Oficial') badgeEtapa = 'bg-emerald-100 text-emerald-800 border border-emerald-300';
                if (lead.etapa === 'Matrícula Reservada') badgeEtapa = 'bg-purple-100 text-purple-800 border border-purple-300';
                if (lead.etapa === 'Test Prerrequisitos') badgeEtapa = 'bg-blue-100 text-blue-800 border border-blue-300';
                if (lead.etapa === 'Contactado') badgeEtapa = 'bg-amber-100 text-amber-800 border border-amber-300';

                return (
                  <div
                    key={lead.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white transition-all shadow-2xs space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-black text-slate-900">{lead.nombre}</h5>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${badgeEtapa}`}>
                            {lead.etapa}
                          </span>
                          {lead.traspasadoAAula && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-700 text-white flex items-center gap-1">
                              <GraduationCap className="w-3 h-3" />
                              En Aula Virtual
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {lead.cargo || 'Profesional'} • {lead.empresa || 'Individual'} • Origen: {lead.origenLead}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="font-black text-emerald-900">
                          {formatearMoneda(lead.montoPagado || 0, moneda)}
                        </span>
                        <select
                          value={lead.etapa}
                          onChange={(e) => handleCambiarEtapa(lead.id, e.target.value as any)}
                          className="text-[10px] border border-slate-300 rounded p-1 bg-white"
                        >
                          <option value="Lead Nuevo">Lead Nuevo</option>
                          <option value="Contactado">Contactado</option>
                          <option value="Test Prerrequisitos">Test Prerrequisitos</option>
                          <option value="Entrevista Admisión">Entrevista Admisión</option>
                          <option value="Matrícula Reservada">Matrícula Reservada</option>
                          <option value="Inscrito Oficial">Inscrito Oficial</option>
                          <option value="Descartado">Descartado</option>
                        </select>
                      </div>
                    </div>

                    {/* Detalle de Contacto & Botón de Traspaso */}
                    <div className="pt-2 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-600">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {lead.correo}
                        </span>
                        {lead.telefono && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {lead.telefono}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!lead.traspasadoAAula && lead.etapa === 'Inscrito Oficial' ? (
                          <button
                            type="button"
                            onClick={() => handleTraspasarAAula(lead)}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                          >
                            <GraduationCap className="w-3.5 h-3.5" />
                            <span>Traspasar a Aula Académica</span>
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => handleEliminarLead(lead.id)}
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
    </div>
  );
};
