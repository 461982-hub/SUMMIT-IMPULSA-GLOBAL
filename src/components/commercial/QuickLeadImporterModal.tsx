import React, { useState } from 'react';
import { ProyectoEducativo, Moneda } from '../../types';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Sparkles,
  ArrowRight,
  Database
} from 'lucide-react';

interface QuickLeadImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto: (proyectoActualizado: ProyectoEducativo) => void;
  onNotificar?: (mensaje: string) => void;
}

interface ProspectoParseado {
  nombre: string;
  telefono: string;
  correo: string;
  empresa: string;
  cargo: string;
}

export const QuickLeadImporterModal: React.FC<QuickLeadImporterModalProps> = ({
  isOpen,
  onClose,
  proyectos,
  moneda,
  onGuardarProyecto,
  onNotificar,
}) => {
  const [proyectoId, setProyectoId] = useState<string>(
    proyectos.length > 0 ? proyectos[0].id : ''
  );
  const [textoPegado, setTextoPegado] = useState('');
  const [prospectosParseados, setProspectosParseados] = useState<ProspectoParseado[]>([]);
  const [etapaDestino, setEtapaDestino] = useState<'Lead Nuevo' | 'Inscrito Oficial'>('Lead Nuevo');
  const [asesorAsignado, setAsesorAsignado] = useState('Lic. Walter Rene');

  if (!isOpen) return null;

  const proyectoSeleccionado = proyectos.find((p) => p.id === proyectoId) || proyectos[0];

  const handleParsearTexto = () => {
    if (!textoPegado.trim()) {
      alert('Por favor pega el texto copiado de Excel o tu hoja de cálculo.');
      return;
    }

    const lineas = textoPegado.trim().split(/\r?\n/);
    const lista: ProspectoParseado[] = [];

    lineas.forEach((linea) => {
      // Separar por tabulaciones (Excel) o comas/punto y coma (CSV)
      let partes = linea.split('\t');
      if (partes.length < 2) {
        partes = linea.split(';');
      }
      if (partes.length < 2) {
        partes = linea.split(',');
      }

      if (partes.length > 0 && partes[0].trim()) {
        const nombre = partes[0]?.trim() || 'Prospecto sin nombre';
        // Ignorar encabezados típicos
        if (nombre.toLowerCase() === 'nombre' || nombre.toLowerCase() === 'nombres') {
          return;
        }

        const telefono = partes[1]?.trim() || '+504 0000-0000';
        const correo = partes[2]?.trim() || 'contacto@empresa.hn';
        const empresa = partes[3]?.trim() || 'Empresa Particular';
        const cargo = partes[4]?.trim() || 'Profesional';

        lista.push({
          nombre,
          telefono,
          correo,
          empresa,
          cargo,
        });
      }
    });

    setProspectosParseados(lista);
  };

  const handleConfirmarImportacion = () => {
    if (!proyectoSeleccionado || prospectosParseados.length === 0) return;

    const fechaHoy = new Date().toISOString().slice(0, 10);
    const nuevosRegistros = prospectosParseados.map((item, idx) => ({
      id: `lead-imp-${Date.now()}-${idx}`,
      nombre: item.nombre,
      correo: item.correo,
      telefono: item.telefono,
      empresa: item.empresa,
      cargo: item.cargo,
      etapa: etapaDestino,
      origenLead: 'Web Orgánica' as const,
      montoPagado: etapaDestino === 'Inscrito Oficial' ? (proyectoSeleccionado.precioSugeridoAlumno || 2500) : 0,
      metodoPago: etapaDestino === 'Inscrito Oficial' ? ('Transferencia' as const) : undefined,
      fechaRegistro: fechaHoy,
      asesorAsignado,
      cumplePrerrequisitos: true,
      traspasadoAAula: etapaDestino === 'Inscrito Oficial',
      notas: `Importado masivamente desde Excel/CSV por ${asesorAsignado}.`,
    }));

    const crmActualizado = [
      ...nuevosRegistros,
      ...(proyectoSeleccionado.crmProspectosCohorte || [])
    ];

    const incrementoAlumnos = etapaDestino === 'Inscrito Oficial' ? nuevosRegistros.length : 0;
    const alumnosFinalNuevos = (proyectoSeleccionado.alumnosFinal || 0) + incrementoAlumnos;
    const leadsGeneradosNuevos = (proyectoSeleccionado.leadsGenerados || 0) + nuevosRegistros.length;

    const proyectoActualizado: ProyectoEducativo = {
      ...proyectoSeleccionado,
      alumnosFinal: alumnosFinalNuevos,
      leadsGenerados: leadsGeneradosNuevos,
      crmProspectosCohorte: crmActualizado,
    };

    onGuardarProyecto(proyectoActualizado);
    if (onNotificar) {
      onNotificar(`¡Se importaron ${nuevosRegistros.length} prospectos en ${proyectoSeleccionado.nombreProyecto}!`);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* Encabezado */}
        <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-800 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-black text-base text-white tracking-tight">
                Importador Masivo de Leads desde Excel / CSV
              </h3>
              <p className="text-xs text-emerald-100">
                Pega directamente tus columnas copiadas sin formularios lentos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          
          {/* Parámetros de Destino */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Curso / Cohorte de Destino
              </label>
              <select
                value={proyectoId}
                onChange={(e) => setProyectoId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                {proyectos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigoPrograma ? `[${p.codigoPrograma}] ` : ''}{p.nombreProyecto}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Etapa de Entrada
              </label>
              <select
                value={etapaDestino}
                onChange={(e) => setEtapaDestino(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="Lead Nuevo">Lead Nuevo (CRM)</option>
                <option value="Inscrito Oficial">Inscrito Oficial (+1 Matrícula)</option>
              </select>
            </div>
          </div>

          {/* Área de Pegado */}
          {prospectosParseados.length === 0 ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Copia y pega las filas de tu Excel / Google Sheets:
                </label>
                <span className="text-[10px] text-slate-500">
                  Formato: Nombre [tab] Teléfono [tab] Correo [tab] Empresa
                </span>
              </div>

              <textarea
                rows={7}
                value={textoPegado}
                onChange={(e) => setTextoPegado(e.target.value)}
                placeholder="Ejemplo:&#10;Lic. Claudia Mendoza	9876-5432	cmendoza@banco.hn	Banco Atlántida&#10;Ing. Roberto Cáceres	9911-2233	rcaceres@empresa.hn	Consultora Sigma"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              ></textarea>

              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={handleParsearTexto}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Analizar y Previsualizar Filas</span>
                </button>
              </div>
            </div>
          ) : (
            /* Vista Previa de Filas */
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-700">
                  Se detectaron <strong className="text-emerald-700 font-black">{prospectosParseados.length} contactos</strong> listos para ingresar:
                </span>
                <button
                  type="button"
                  onClick={() => setProspectosParseados([])}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Volver a pegar texto
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2">#</th>
                      <th className="p-2">Nombre Completo</th>
                      <th className="p-2">Teléfono</th>
                      <th className="p-2">Correo</th>
                      <th className="p-2">Empresa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {prospectosParseados.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-2 font-bold text-slate-900">{item.nombre}</td>
                        <td className="p-2 text-slate-600 font-mono">{item.telefono}</td>
                        <td className="p-2 text-slate-600">{item.correo}</td>
                        <td className="p-2 text-slate-500">{item.empresa}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Botones de Confirmación */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            {prospectosParseados.length > 0 && (
              <button
                type="button"
                onClick={handleConfirmarImportacion}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Database className="w-4 h-4" />
                <span>Importar los {prospectosParseados.length} Contactos</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
