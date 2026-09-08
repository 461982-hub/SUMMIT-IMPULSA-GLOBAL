import React, { useState } from 'react';
import { 
  Building2, 
  Award, 
  FileCheck, 
  ExternalLink, 
  Save, 
  CheckCircle2, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Sparkles,
  Layers,
  GraduationCap
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';

interface AcademicAgreementsAndCapstonesViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto: (p: ProyectoEducativo) => void;
}

export const AcademicAgreementsAndCapstonesView: React.FC<AcademicAgreementsAndCapstonesViewProps> = ({
  proyectos,
  onGuardarProyecto,
}) => {
  const [proyectoSeleccionadoId, setProyectoSeleccionadoId] = useState<string>(
    proyectos.length > 0 ? proyectos[0].id : ''
  );


  const proyectoActual = proyectos.find((p) => p.id === proyectoSeleccionadoId) || proyectos[0];

  // Estado del Convenio
  const [entidadCoCertificadora, setEntidadCoCertificadora] = useState(
    proyectoActual?.convenioInstitucionalDetalle?.entidadCoCertificadora || 'Universidad Tecnológica Centroamericana (UNITEC)'
  );
  const [numeroResolucion, setNumeroResolucion] = useState(
    proyectoActual?.convenioInstitucionalDetalle?.numeroResolucionOConvenio || 'RES-ACAD-2026-0814'
  );
  const [tipoAval, setTipoAval] = useState<any>(
    proyectoActual?.convenioInstitucionalDetalle?.tipoAval || 'Aval Académico Oficial'
  );
  const [contactoResponsable, setContactoResponsable] = useState(
    proyectoActual?.convenioInstitucionalDetalle?.contactoResponsableConvenio || 'Dirección de Educación Continua UNITEC (convenios@unitec.edu)'
  );

  // Estado de Banco de Proyectos / Casos de Éxito
  const [proyectosGraduacion, setProyectosGraduacion] = useState(() => {
    if (proyectoActual?.bancoProyectosGraduacion && proyectoActual.bancoProyectosGraduacion.length > 0) {
      return proyectoActual.bancoProyectosGraduacion;
    }
    return [
      {
        id: 'cap-1',
        tituloProyecto: 'Modelo Financiero Dinámico & Automatización de Flujos para Banco Atlántida',
        autores: ['Ing. Carlos Eduardo Martínez', 'Lic. Andrea Sofía Morales'],
        empresaAplicacion: 'Banco Atlántida Honduras',
        resumenEjecutivo: 'Desarrollo de modelo automatizado en Excel y macros para análisis de riesgo crediticio corporativo reduciendo tiempos de reporte en un 45%.',
        calificacionObtenida: 98,
        urlEntregableORepositorio: 'https://drive.google.com/drive/folders/summit-capstones-01',
        destacadoComoCasoExito: true,
        fechaAprobacion: '2026-08-28',
      },
      {
        id: 'cap-2',
        tituloProyecto: 'Dashboard Ejecutivo de Control de Merma y Cadena de Suministro',
        autores: ['Lic. Claudia María Flores', 'Ing. Luis Mario Bueso'],
        empresaAplicacion: 'Cervecería Hondureña / AB InBev',
        resumenEjecutivo: 'Implementación de tablero interactivo de control de inventarios y KPI logísticos con pronóstico de demanda semanal.',
        calificacionObtenida: 95,
        urlEntregableORepositorio: 'https://drive.google.com/drive/folders/summit-capstones-02',
        destacadoComoCasoExito: true,
        fechaAprobacion: '2026-08-29',
      },
    ];
  });

  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  const handleSeleccionarProyecto = (p: ProyectoEducativo) => {
    setProyectoSeleccionadoId(p.id);
    setEntidadCoCertificadora(p.convenioInstitucionalDetalle?.entidadCoCertificadora || 'Universidad Tecnológica Centroamericana (UNITEC)');
    setNumeroResolucion(p.convenioInstitucionalDetalle?.numeroResolucionOConvenio || 'RES-ACAD-2026-0814');
    setTipoAval(p.convenioInstitucionalDetalle?.tipoAval || 'Aval Académico Oficial');
    setContactoResponsable(p.convenioInstitucionalDetalle?.contactoResponsableConvenio || 'Dirección de Educación Continua');

    if (p.bancoProyectosGraduacion && p.bancoProyectosGraduacion.length > 0) {
      setProyectosGraduacion(p.bancoProyectosGraduacion);
    } else {
      setProyectosGraduacion([]);
    }
    setGuardadoExitoso(false);
  };

  const handleAgregarProyectoGraduacion = () => {
    const num = proyectosGraduacion.length + 1;
    setProyectosGraduacion([
      ...proyectosGraduacion,
      {
        id: `cap-${Date.now()}`,
        tituloProyecto: `Proyecto Integrador #${num}: Caso de Negocio Aplicado`,
        autores: ['Estudiante Titular'],
        empresaAplicacion: 'Empresa Privada',
        resumenEjecutivo: 'Solución empresarial desarrollada aplicando las competencias del programa formativo.',
        calificacionObtenida: 90,
        urlEntregableORepositorio: 'https://drive.google.com/drive/folders/summit',
        destacadoComoCasoExito: true,
        fechaAprobacion: new Date().toISOString().split('T')[0],
      },
    ]);
  };

  const handleEliminarProyectoGraduacion = (idx: number) => {
    setProyectosGraduacion(proyectosGraduacion.filter((_, i) => i !== idx));
  };

  const handleGuardarTodo = () => {
    if (!proyectoActual) return;
    const proyectoActualizado: ProyectoEducativo = {
      ...proyectoActual,
      convenioUniversitario: entidadCoCertificadora,
      convenioInstitucionalDetalle: {
        entidadCoCertificadora,
        numeroResolucionOConvenio: numeroResolucion,
        tipoAval,
        contactoResponsableConvenio: contactoResponsable,
      },
      bancoProyectosGraduacion: proyectosGraduacion,
    };
    onGuardarProyecto(proyectoActualizado);
    setGuardadoExitoso(true);
    setTimeout(() => setGuardadoExitoso(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-950 text-white p-5 rounded-2xl shadow-md border border-amber-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-5 h-5 text-amber-400" />
            <h3 className="font-black text-base text-white tracking-wide">
              Convenios Universitarios & Banco de Proyectos de Graduación
            </h3>
            <span className="bg-amber-500/30 text-amber-200 border border-amber-400/40 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
              Acreditación Institucional
            </span>
          </div>
          <p className="text-xs text-amber-200/90 max-w-2xl leading-relaxed">
            Administre las alianzas de co-certificación universitaria, resoluciones oficiales y el repositorio de casos de éxito empresariales desarrollados por alumnos.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGuardarTodo}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 transition-all shadow-xs shrink-0"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Guardar Convenios & Casos</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Selector de Cursos */}
        <div className="lg:col-span-3 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Seleccionar Programa ({proyectos.length})
            </span>
          </div>
          <div className="space-y-1.5 max-h-[620px] overflow-y-auto pr-1">
            {proyectos.map((p) => {
              const isSelected = p.id === proyectoActual?.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSeleccionarProyecto(p)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-amber-50/90 border-amber-400 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-100/80 px-1.5 py-0.5 rounded">
                      {p.codigoPrograma || `ACAD-${p.id}`}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 truncate max-w-[100px]">
                      {p.convenioUniversitario || 'UNITEC'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1.5 line-clamp-1">
                    {p.nombreProyecto}
                  </h4>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {p.nombreDocente}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel de Convenios & Casos */}
        {proyectoActual && (
          <div className="lg:col-span-9 space-y-4">
            {guardadoExitoso && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Datos de convenio universitario y proyectos integradores guardados correctamente.</span>
              </div>
            )}

            {/* SECCIÓN 1: GESTIÓN DEL CONVENIO UNIVERSITARIO / AVAL OFICIAL */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    Convenio Institucional & Co-Certificación Académica
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                  0% ISV Homologado
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Entidad Universitaria / Gremio Co-Certificador
                  </label>
                  <input
                    type="text"
                    value={entidadCoCertificadora}
                    onChange={(e) => setEntidadCoCertificadora(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Número de Resolución / Código de Convenio
                  </label>
                  <input
                    type="text"
                    value={numeroResolucion}
                    onChange={(e) => setNumeroResolucion(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold text-amber-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Aval Académico
                  </label>
                  <select
                    value={tipoAval}
                    onChange={(e) => setTipoAval(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-semibold text-slate-800"
                  >
                    <option value="Aval Académico Oficial">Aval Académico Oficial (Educación Continua)</option>
                    <option value="Doble Titulación">Doble Titulación Internacional</option>
                    <option value="Créditos Universitarios Transferibles">Créditos Universitarios Transferibles</option>
                    <option value="Certificación de Gremio Profesional">Certificación de Gremio Profesional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contacto Responsable Institucional
                  </label>
                  <input
                    type="text"
                    value={contactoResponsable}
                    onChange={(e) => setContactoResponsable(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-700"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: BANCO DE PROYECTOS DE GRADUACIÓN (CAPSTONES) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                    Banco de Proyectos de Graduación & Portafolio de Casos Reales
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Custodia de proyectos finales desarrollados e implementados en empresas por los egresados.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAgregarProyectoGraduacion}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registrar Proyecto</span>
                </button>
              </div>

              {proyectosGraduacion.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                  <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">
                    No hay proyectos de graduación registrados aún para este programa.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {proyectosGraduacion.map((cap, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 hover:border-indigo-300 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                            ★ Nota: {cap.calificacionObtenida} / 100
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {cap.empresaAplicacion}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {cap.destacadoComoCasoExito && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-600" />
                              Caso de Éxito
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleEliminarProyectoGraduacion(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-900">
                          {cap.tituloProyecto}
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {cap.resumenEjecutivo}
                        </p>
                        <div className="text-[11px] text-slate-500 font-semibold pt-1">
                          Autores: <strong>{cap.autores.join(', ')}</strong> • Aprobado: {cap.fechaAprobacion}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
