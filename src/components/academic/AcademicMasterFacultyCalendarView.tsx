import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  Laptop,
  Building,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Edit3,
  Calendar as CalendarIcon,
  Download,
  Check,
  Info,
  ArrowRight,
  TrendingUp,
  Award,
  AlertCircle,
  Eye,
  RefreshCw,
  DollarSign,
  Receipt,
  FileSpreadsheet
} from 'lucide-react';
import { ProyectoEducativo, Moneda } from '../../types';
import { formatearMoneda } from '../../utils/calculations';
import { INSTITUCION_INFO } from '../../utils/institutionalInfo';
import { generarPlanSesionesClase } from '../../utils/curricularUtils';
import { GoogleCalendarIntegrationBar } from './GoogleCalendarIntegrationBar';
import { ManualScheduleSessionModal } from './ManualScheduleSessionModal';
import { GoogleCalendarEventResponse } from '../../services/googleCalendarService';

interface AcademicMasterFacultyCalendarViewProps {
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onGuardarProyecto: (p: ProyectoEducativo) => void;
  onVerDetalle?: (p: ProyectoEducativo) => void;
}

export interface SesionCalendarioMaestro {
  id: string;
  proyectoId: string;
  nombreProyecto: string;
  codigoPrograma: string;
  nombreDocente: string;
  numeroSesion: number;
  fecha: string; // YYYY-MM-DD
  horaInicio: string; // HH:mm (24h)
  horaFin: string; // HH:mm (24h)
  horas: number;
  tema: string;
  modalidad: 'Virtual' | 'Presencial' | 'Híbrida';
  plataformaAula: string;
  estado: 'Programada' | 'Impartida' | 'Reprogramada';
  diasTexto: string;
}

export interface ConflictoSolapamiento {
  id: string;
  docente: string;
  fecha: string;
  tipo: 'SOLAPAMIENTO_HORARIO' | 'SOBRECARGA_DIARIA' | 'AULA_DUPLICADA';
  gravedad: 'ALTA' | 'MEDIA';
  sesion1: SesionCalendarioMaestro;
  sesion2?: SesionCalendarioMaestro;
  descripcion: string;
  recomendacion: string;
}

export interface EstadisticaDocente {
  nombreDocente: string;
  especialidad: string;
  clasificacion: string;
  proyectos: { id: string; nombre: string; codigo: string; horas: number }[];
  totalHorasMensuales: number;
  horasSemanalesPromedio: number;
  nps: number;
  totalSesiones: number;
  tieneConflictos: boolean;
  conflictosCount: number;
  limiteSemanalHoras: number;
  disponibilidadDeclarada: string;
  estadoCarga: 'LIBRE' | 'OPTIMA' | 'ALTA' | 'SOBRECARGA';
}

// Función auxiliar para parsear horario texto como "06:00 PM - 08:00 PM" o "18:00 - 20:00" a formato militar 24h
function parsearRangoHorario(horarioStr?: string): { horaInicio: string; horaFin: string } {
  if (!horarioStr) {
    return { horaInicio: '18:00', horaFin: '20:00' };
  }

  const str = horarioStr.trim();

  // Caso: 06:00 PM - 08:00 PM
  if (str.toUpperCase().includes('PM') || str.toUpperCase().includes('AM')) {
    const partes = str.split('-');
    if (partes.length === 2) {
      const convertir12a24 = (t: string) => {
        const limpia = t.trim().toUpperCase();
        const esPM = limpia.includes('PM');
        const soloHora = limpia.replace(/AM|PM/g, '').trim();
        const [hStr, mStr] = soloHora.split(':');
        let h = parseInt(hStr, 10) || 0;
        const m = mStr ? mStr.padStart(2, '0') : '00';
        if (esPM && h < 12) h += 12;
        if (!esPM && h === 12) h = 0;
        return `${h.toString().padStart(2, '0')}:${m}`;
      };
      return {
        horaInicio: convertir12a24(partes[0]),
        horaFin: convertir12a24(partes[1]),
      };
    }
  }

  // Caso: 18:00 - 20:00
  const match24 = str.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (match24) {
    return {
      horaInicio: `${match24[1].padStart(2, '0')}:${match24[2]}`,
      horaFin: `${match24[3].padStart(2, '0')}:${match24[4]}`,
    };
  }

  return { horaInicio: '18:00', horaFin: '20:00' };
}

// Convertir "HH:mm" a minutos del día para comparar solapamiento
function horaAMinutos(horaStr: string): number {
  const [h, m] = horaStr.split(':').map((x) => parseInt(x, 10) || 0);
  return h * 60 + m;
}

export const AcademicMasterFacultyCalendarView: React.FC<AcademicMasterFacultyCalendarViewProps> = ({
  proyectos,
  moneda,
  onGuardarProyecto,
  onVerDetalle,
}) => {
  // Pestaña principal de visualización del módulo
  const [vistaModo, setVistaModo] = useState<'calendario' | 'docentes' | 'conflictos' | 'programador' | 'lista' | 'desembolsos'>('calendario');

  // Filtros interactivos
  const [filtroDocente, setFiltroDocente] = useState<string>('todos');
  const [filtroProyecto, setFiltroProyecto] = useState<string>('todos');
  const [filtroModalidad, setFiltroModalidad] = useState<string>('todos');
  const [filtroSolapamientos, setFiltroSolapamientos] = useState<boolean>(false);
  const [busqueda, setBusqueda] = useState<string>('');

  // Navegación de Fecha en Calendario (Año / Mes)
  const [fechaActual, setFechaActual] = useState(() => {
    // Tomar fecha del primer proyecto o fecha de hoy
    if (proyectos.length > 0 && proyectos[0].fechaProgramacion) {
      return new Date(proyectos[0].fechaProgramacion);
    }
    return new Date('2026-09-01');
  });

  // Modal para reprogramar sesión o fijar fecha/hora manualmente
  const [sesionEditando, setSesionEditando] = useState<SesionCalendarioMaestro | null>(null);
  const [nuevaFechaSesion, setNuevaFechaSesion] = useState<string>('');
  const [nuevoHorarioInicio, setNuevoHorarioInicio] = useState<string>('18:00');
  const [nuevoHorarioFin, setNuevoHorarioFin] = useState<string>('20:00');
  const [nuevoDocenteAsignado, setNuevoDocenteAsignado] = useState<string>('');
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Estados de integración con Google Calendar y Programación Manual
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEventResponse[]>([]);
  const [mostrarModalManual, setMostrarModalManual] = useState<boolean>(false);
  const [fechaPreviaManual, setFechaPreviaManual] = useState<string | undefined>(undefined);
  const [sesionParaEditarManual, setSesionParaEditarManual] = useState<SesionCalendarioMaestro | null>(null);

  // Programador rápido de nueva sesión
  const [nuevoProyectoId, setNuevoProyectoId] = useState<string>(proyectos.length > 0 ? proyectos[0].id : '');
  const [nuevoTema, setNuevoTema] = useState<string>('Sesión Especial de Nivelación y Asesoría Técnica');
  const [nuevaFechaProgramador, setNuevaFechaProgramador] = useState<string>('2026-09-15');
  const [nuevoInicioProgramador, setNuevoInicioProgramador] = useState<string>('18:00');
  const [nuevoFinProgramador, setNuevoFinProgramador] = useState<string>('20:00');
  const [nuevaModalidadProgramador, setNuevaModalidadProgramador] = useState<'Virtual' | 'Presencial'>('Virtual');

  // =========================================================================
  // 1. GENERACIÓN Y CONSOLIDACIÓN DE TODAS LAS SESIONES DE TODOS LOS PROYECTOS
  // =========================================================================
  const todasLasSesiones: SesionCalendarioMaestro[] = useMemo(() => {
    const lista: SesionCalendarioMaestro[] = [];

    proyectos.forEach((p) => {
      const parsedHorario = parsearRangoHorario(p.horario);
      const mod = p.modalidad === 'Presencial' ? 'Presencial' : p.modalidad === 'Híbrida' ? 'Híbrida' : 'Virtual';

      if (p.sesionesClase && p.sesionesClase.length > 0) {
        p.sesionesClase.forEach((s) => {
          lista.push({
            id: `ses-${p.id}-${s.numeroSesion}-${s.fecha}`,
            proyectoId: p.id,
            nombreProyecto: p.nombreProyecto,
            codigoPrograma: p.codigoPrograma || `ACAD-${p.id}`,
            nombreDocente: p.nombreDocente || 'Docente No Asignado',
            numeroSesion: s.numeroSesion,
            fecha: s.fecha || p.fechaProgramacion || '2026-09-01',
            horaInicio: parsedHorario.horaInicio,
            horaFin: parsedHorario.horaFin,
            horas: Number(s.horas) || 3,
            tema: s.tema || `Sesión ${s.numeroSesion}: Módulo Curricular`,
            modalidad: (s.modalidad as any) || mod,
            plataformaAula: p.plataformaLMS || p.enlaceAulaVirtual || (mod === 'Presencial' ? 'Aula Magna 102' : 'Zoom Pro'),
            estado: s.estado || 'Programada',
            diasTexto: p.diasClase || 'Lun, Mié y Vie',
          });
        });
      } else {
        // Generar sesiones virtuales estimadas a partir de los datos del proyecto
        const sesionesAuto = generarPlanSesionesClase(
          p.cantidadTemas || 4,
          p.horasClasePorTema || 4,
          p.fechaProgramacion || '2026-09-01',
          p.diasClase || 'Lunes, Miércoles y Viernes',
          p.modalidad === 'Presencial' ? 'Presencial' : 'Virtual'
        );

        sesionesAuto.forEach((s) => {
          lista.push({
            id: `ses-${p.id}-${s.numeroSesion}-${s.fecha}`,
            proyectoId: p.id,
            nombreProyecto: p.nombreProyecto,
            codigoPrograma: p.codigoPrograma || `ACAD-${p.id}`,
            nombreDocente: p.nombreDocente || 'Docente No Asignado',
            numeroSesion: s.numeroSesion,
            fecha: s.fecha || p.fechaProgramacion || '2026-09-01',
            horaInicio: parsedHorario.horaInicio,
            horaFin: parsedHorario.horaFin,
            horas: Number(s.horas) || 3,
            tema: s.tema,
            modalidad: (s.modalidad as any) || mod,
            plataformaAula: p.plataformaLMS || (mod === 'Presencial' ? 'Aula Magna' : 'Zoom Pro'),
            estado: s.estado || 'Programada',
            diasTexto: p.diasClase || 'Lun, Mié y Vie',
          });
        });
      }
    });

    return lista;
  }, [proyectos]);

  // =========================================================================
  // 2. MOTOR INTELIGENTE DE DETECCIÓN DE SOLAPAMIENTOS Y CONFLICTOS
  // =========================================================================
  const { conflictos, sesionesConConflictoIds } = useMemo(() => {
    const listaConflictos: ConflictoSolapamiento[] = [];
    const conflictIds = new Set<string>();

    // Agrupar sesiones por Docente y Fecha
    const agrupadoPorDocenteFecha: Record<string, SesionCalendarioMaestro[]> = {};

    todasLasSesiones.forEach((s) => {
      const clave = `${s.nombreDocente.trim().toLowerCase()}___${s.fecha}`;
      if (!agrupadoPorDocenteFecha[clave]) {
        agrupadoPorDocenteFecha[clave] = [];
      }
      agrupadoPorDocenteFecha[clave].push(s);
    });

    // Analizar solapamientos de horario en el mismo día para el mismo docente
    Object.entries(agrupadoPorDocenteFecha).forEach(([clave, sesionesDelDia]) => {
      const [docente, fecha] = clave.split('___');

      if (sesionesDelDia.length > 1) {
        // Comparar cada par de sesiones
        for (let i = 0; i < sesionesDelDia.length; i++) {
          for (let j = i + 1; j < sesionesDelDia.length; j++) {
            const s1 = sesionesDelDia[i];
            const s2 = sesionesDelDia[j];

            const minInicio1 = horaAMinutos(s1.horaInicio);
            const minFin1 = horaAMinutos(s1.horaFin);
            const minInicio2 = horaAMinutos(s2.horaInicio);
            const minFin2 = horaAMinutos(s2.horaFin);

            // Hay cruce si (Inicio1 < Fin2) y (Inicio2 < Fin1)
            const hayCruceHorario = minInicio1 < minFin2 && minInicio2 < minFin1;

            if (hayCruceHorario) {
              conflictIds.add(s1.id);
              conflictIds.add(s2.id);

              listaConflictos.push({
                id: `conf-${s1.id}-${s2.id}`,
                docente: s1.nombreDocente,
                fecha: s1.fecha,
                tipo: 'SOLAPAMIENTO_HORARIO',
                gravedad: 'ALTA',
                sesion1: s1,
                sesion2: s2,
                descripcion: `¡Solapamiento Crítico! El docente "${s1.nombreDocente}" está asignado a dos clases simultáneas el ${s1.fecha}: "${s1.nombreProyecto}" (${s1.horaInicio}-${s1.horaFin}) y "${s2.nombreProyecto}" (${s2.horaInicio}-${s2.horaFin}).`,
                recomendacion: `Mover una de las sesiones a otro horario (ej. tarde/mañana) o reasignar a un docente alternativo calificado.`,
              });
            }
          }
        }

        // Revisar si la suma de horas del día supera 6 horas continuas (sobrecarga diaria)
        const totalHorasDia = sesionesDelDia.reduce((acc, s) => acc + s.horas, 0);
        if (totalHorasDia > 6) {
          sesionesDelDia.forEach((s) => conflictIds.add(s.id));
          listaConflictos.push({
            id: `conf-sobrecarga-${clave}`,
            docente: sesionesDelDia[0].nombreDocente,
            fecha: fecha,
            tipo: 'SOBRECARGA_DIARIA',
            gravedad: 'MEDIA',
            sesion1: sesionesDelDia[0],
            descripcion: `Carga Extenuante: El docente "${sesionesDelDia[0].nombreDocente}" tiene ${totalHorasDia} horas lectivas asignadas en un solo día (${fecha}) repartidas en ${sesionesDelDia.length} programas.`,
            recomendacion: `Distribuir las sesiones en días alternos para garantizar la calidad pedagógica y evitar agotamiento.`,
          });
        }
      }
    });

    return { conflictos: listaConflictos, sesionesConConflictoIds: conflictIds };
  }, [todasLasSesiones]);

  // =========================================================================
  // 3. MATRIZ DE CARGA HORARIA Y DISPONIBILIDAD DE TODOS LOS DOCENTES
  // =========================================================================
  const docentesStats: EstadisticaDocente[] = useMemo(() => {
    const mapaDocentes: Record<string, EstadisticaDocente> = {};

    proyectos.forEach((p) => {
      const doc = p.nombreDocente || 'Docente No Asignado';
      if (!mapaDocentes[doc]) {
        mapaDocentes[doc] = {
          nombreDocente: doc,
          especialidad: p.docenteEspecialidad || 'Especialista de Área',
          clasificacion: p.docenteClasificacion || 'Ingeniería / Maestría',
          proyectos: [],
          totalHorasMensuales: 0,
          horasSemanalesPromedio: 0,
          nps: p.docenteEvaluacionNPS || 4.9,
          totalSesiones: 0,
          tieneConflictos: false,
          conflictosCount: 0,
          limiteSemanalHoras: 20, // 20 hrs semanales sugeridas
          disponibilidadDeclarada: 'Lunes a Viernes (18:00 - 22:00) & Sábados (08:00 - 13:00)',
          estadoCarga: 'LIBRE',
        };
      }

      const horasProg = p.horasClase || 20;
      mapaDocentes[doc].proyectos.push({
        id: p.id,
        nombre: p.nombreProyecto,
        codigo: p.codigoPrograma || `ACAD-${p.id}`,
        horas: horasProg,
      });
      mapaDocentes[doc].totalHorasMensuales += horasProg;
    });

    // Calcular sesiones y conflictos por docente
    Object.values(mapaDocentes).forEach((docStat) => {
      const sesionesDoc = todasLasSesiones.filter((s) => s.nombreDocente.toLowerCase() === docStat.nombreDocente.toLowerCase());
      docStat.totalSesiones = sesionesDoc.length;

      // Horas semanales estimadas (dividido entre ~4 semanas)
      const horasSem = Math.round(docStat.totalHorasMensuales / 4);
      docStat.horasSemanalesPromedio = horasSem;

      const confsDoc = conflictos.filter((c) => c.docente.toLowerCase() === docStat.nombreDocente.toLowerCase());
      docStat.conflictosCount = confsDoc.length;
      docStat.tieneConflictos = confsDoc.length > 0;

      if (horasSem <= 8) {
        docStat.estadoCarga = 'LIBRE';
      } else if (horasSem <= 18) {
        docStat.estadoCarga = 'OPTIMA';
      } else if (horasSem <= 24) {
        docStat.estadoCarga = 'ALTA';
      } else {
        docStat.estadoCarga = 'SOBRECARGA';
      }
    });

    return Object.values(mapaDocentes).sort((a, b) => b.totalHorasMensuales - a.totalHorasMensuales);
  }, [proyectos, todasLasSesiones, conflictos]);

  // =========================================================================
  // 4. LISTA FILTRADA DE SESIONES
  // =========================================================================
  const sesionesFiltradas = useMemo(() => {
    return todasLasSesiones.filter((s) => {
      if (filtroDocente !== 'todos' && s.nombreDocente !== filtroDocente) return false;
      if (filtroProyecto !== 'todos' && s.proyectoId !== filtroProyecto) return false;
      if (filtroModalidad !== 'todos' && s.modalidad !== filtroModalidad) return false;
      if (filtroSolapamientos && !sesionesConConflictoIds.has(s.id)) return false;
      if (busqueda.trim() !== '') {
        const q = busqueda.toLowerCase();
        const coincide =
          s.nombreProyecto.toLowerCase().includes(q) ||
          s.nombreDocente.toLowerCase().includes(q) ||
          s.tema.toLowerCase().includes(q) ||
          s.codigoPrograma.toLowerCase().includes(q);
        if (!coincide) return false;
      }
      return true;
    });
  }, [todasLasSesiones, filtroDocente, filtroProyecto, filtroModalidad, filtroSolapamientos, busqueda, sesionesConConflictoIds]);

  // =========================================================================
  // 5. CÁLCULO DE DÍAS DEL MES PARA LA CUADRÍCULA CALENDARIO
  // =========================================================================
  const { diasDelMes, mesNombre, anioNumero } = useMemo(() => {
    const anio = fechaActual.getFullYear();
    const mes = fechaActual.getMonth(); // 0-indexed

    const primerDiaMes = new Date(anio, mes, 1);
    const ultimoDiaMes = new Date(anio, mes + 1, 0);
    const totalDias = ultimoDiaMes.getDate();

    // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    let diaSemanaInicio = primerDiaMes.getDay();
    // Convertir para que Lunes sea 0 y Domingo 6
    diaSemanaInicio = diaSemanaInicio === 0 ? 6 : diaSemanaInicio - 1;

    const dias: Array<{ 
      fechaStr: string; 
      diaNumero: number; 
      esMesActual: boolean; 
      sesiones: SesionCalendarioMaestro[];
      eventosGoogle?: GoogleCalendarEventResponse[];
    }> = [];

    // Rellenar días del mes anterior
    const ultimoDiaMesAnterior = new Date(anio, mes, 0).getDate();
    for (let i = diaSemanaInicio - 1; i >= 0; i--) {
      const diaNum = ultimoDiaMesAnterior - i;
      const mesAnt = mes === 0 ? 12 : mes;
      const anioAnt = mes === 0 ? anio - 1 : anio;
      const fStr = `${anioAnt}-${mesAnt.toString().padStart(2, '0')}-${diaNum.toString().padStart(2, '0')}`;
      dias.push({ fechaStr: fStr, diaNumero: diaNum, esMesActual: false, sesiones: [], eventosGoogle: [] });
    }

    // Días del mes actual
    for (let d = 1; d <= totalDias; d++) {
      const fStr = `${anio}-${(mes + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      const sesionesDelDia = sesionesFiltradas.filter((s) => s.fecha === fStr);
      const eventosGoogleDelDia = googleEvents.filter((g) => {
        const fechaG = g.start.dateTime ? g.start.dateTime.split('T')[0] : g.start.date;
        return fechaG === fStr;
      });
      dias.push({ 
        fechaStr: fStr, 
        diaNumero: d, 
        esMesActual: true, 
        sesiones: sesionesDelDia,
        eventosGoogle: eventosGoogleDelDia
      });
    }

    // Rellenar días del mes siguiente para completar la matriz (múltiplo de 7)
    const resto = dias.length % 7;
    if (resto !== 0) {
      const faltan = 7 - resto;
      for (let s = 1; s <= faltan; s++) {
        const mesSig = mes + 2 > 12 ? 1 : mes + 2;
        const anioSig = mes + 2 > 12 ? anio + 1 : anio;
        const fStr = `${anioSig}-${mesSig.toString().padStart(2, '0')}-${s.toString().padStart(2, '0')}`;
        dias.push({ fechaStr: fStr, diaNumero: s, esMesActual: false, sesiones: [], eventosGoogle: [] });
      }
    }

    const nombresMeses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];

    return {
      diasDelMes: dias,
      mesNombre: nombresMeses[mes],
      anioNumero: anio,
    };
  }, [fechaActual, sesionesFiltradas, googleEvents]);

  // Handlers de cambio de mes
  const handleMesAnterior = () => {
    setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1));
  };

  const handleMesSiguiente = () => {
    setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 1));
  };

  const handleMesHoy = () => {
    setFechaActual(new Date());
  };

  // =========================================================================
  // 6. ACCIONES DE PROGRAMACIÓN MANUAL Y RESOLUCIÓN DE SOLAPAMIENTO
  // =========================================================================
  const handleAbrirEditarSesion = (sesion: SesionCalendarioMaestro) => {
    setSesionParaEditarManual(sesion);
    setFechaPreviaManual(sesion.fecha);
    setMostrarModalManual(true);
  };

  const handleGuardarSesionManual = (datos: {
    proyectoId: string;
    numeroSesion?: number;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    horas: number;
    tema: string;
    nombreDocente: string;
    modalidad: 'Virtual' | 'Presencial' | 'Híbrida';
    plataformaAula: string;
    sincronizadoGoogle?: boolean;
  }) => {
    const proyectoAfectado = proyectos.find((p) => p.id === datos.proyectoId);
    if (!proyectoAfectado) return;

    const sesionesActuales = proyectoAfectado.sesionesClase || [];
    const numero = datos.numeroSesion || sesionesActuales.length + 1;
    const sesionExiste = sesionesActuales.some((s) => s.numeroSesion === numero);

    let nuevasSesiones = [...sesionesActuales];
    if (sesionExiste) {
      nuevasSesiones = nuevasSesiones.map((s) => {
        if (s.numeroSesion === numero) {
          return {
            ...s,
            fecha: datos.fecha,
            tema: datos.tema,
            modalidad: datos.modalidad as any,
            horas: datos.horas,
            estado: 'Reprogramada',
          };
        }
        return s;
      });
    } else {
      nuevasSesiones.push({
        numeroSesion: numero,
        fecha: datos.fecha,
        tema: datos.tema,
        modalidad: datos.modalidad as any,
        horas: datos.horas,
        entregable: `Taller Práctico ${numero}`,
        estado: 'Programada',
      });
    }

    const proyectoActualizado: ProyectoEducativo = {
      ...proyectoAfectado,
      nombreDocente: datos.nombreDocente || proyectoAfectado.nombreDocente,
      horario: `${datos.horaInicio} - ${datos.horaFin}`,
      sesionesClase: nuevasSesiones,
    };

    onGuardarProyecto(proyectoActualizado);
    setMensajeExito(
      `¡Sesión #${numero} de "${proyectoAfectado.nombreProyecto}" configurada manualmente: ${datos.fecha} (${datos.horaInicio} - ${datos.horaFin})!${
        datos.sincronizadoGoogle ? ' Sincronizada con tu Google Calendar.' : ''
      }`
    );
    setSesionParaEditarManual(null);
    setMostrarModalManual(false);
    setTimeout(() => setMensajeExito(null), 5000);
  };

  const handleGuardarReprogramacion = () => {
    if (!sesionEditando) return;

    const proyectoAfectado = proyectos.find((p) => p.id === sesionEditando.proyectoId);
    if (!proyectoAfectado) return;

    // Actualizar las sesiones del proyecto
    const sesionesActuales = proyectoAfectado.sesionesClase || [];
    const sesionExiste = sesionesActuales.some((s) => s.numeroSesion === sesionEditando.numeroSesion);

    let nuevasSesiones = [...sesionesActuales];

    if (sesionExiste) {
      nuevasSesiones = nuevasSesiones.map((s) => {
        if (s.numeroSesion === sesionEditando.numeroSesion) {
          return {
            ...s,
            fecha: nuevaFechaSesion,
            estado: 'Reprogramada',
          };
        }
        return s;
      });
    } else {
      nuevasSesiones.push({
        numeroSesion: sesionEditando.numeroSesion,
        fecha: nuevaFechaSesion,
        tema: sesionEditando.tema,
        modalidad: sesionEditando.modalidad as any,
        horas: sesionEditando.horas,
        entregable: `Taller Práctico ${sesionEditando.numeroSesion}`,
        estado: 'Reprogramada',
      });
    }

    const proyectoActualizado: ProyectoEducativo = {
      ...proyectoAfectado,
      nombreDocente: nuevoDocenteAsignado || proyectoAfectado.nombreDocente,
      horario: `${nuevoHorarioInicio} - ${nuevoHorarioFin}`,
      sesionesClase: nuevasSesiones,
    };

    onGuardarProyecto(proyectoActualizado);
    setMensajeExito(`¡Sesión #${sesionEditando.numeroSesion} de "${proyectoAfectado.nombreProyecto}" reprogramada al ${nuevaFechaSesion} (${nuevoHorarioInicio} - ${nuevoHorarioFin}) exitosamente!`);
    setSesionEditando(null);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  // Programar nueva sesión rápida
  const handleCrearSesionRapida = (e: React.FormEvent) => {
    e.preventDefault();
    const proyecto = proyectos.find((p) => p.id === nuevoProyectoId);
    if (!proyecto) return;

    const num = (proyecto.sesionesClase?.length || 0) + 1;
    const nuevas = [
      ...(proyecto.sesionesClase || []),
      {
        numeroSesion: num,
        fecha: nuevaFechaProgramador,
        tema: nuevoTema,
        modalidad: nuevaModalidadProgramador,
        horas: 3,
        entregable: `Entregable Evaluativo Sesión ${num}`,
        estado: 'Programada' as const,
      },
    ];

    const actualizado: ProyectoEducativo = {
      ...proyecto,
      sesionesClase: nuevas,
    };

    onGuardarProyecto(actualizado);
    setMensajeExito(`Sesión #${num} agendada para el programa "${proyecto.nombreProyecto}" el ${nuevaFechaProgramador}.`);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  // Obtener lista única de docentes
  const listaDocentesUnicos = useMemo(() => {
    const setDocs = new Set<string>();
    proyectos.forEach((p) => {
      if (p.nombreDocente) setDocs.add(p.nombreDocente);
    });
    return Array.from(setDocs);
  }, [proyectos]);

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* ========================================================================= */}
      {/* BANNER PRINCIPAL: CALENDARIO MAESTRO & DETECTOR DE SOLAPAMIENTOS */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-5 sm:p-6 rounded-2xl shadow-md border border-indigo-800/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shrink-0 shadow-inner">
              <CalendarDays className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 rounded">
                  🗓️ Control Maestro Curricular
                </span>
                <span className="text-xs text-indigo-300 font-medium">Gestión de Carga & Solapamientos</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                Calendario General & Carga Docente
              </h2>
              <p className="text-xs sm:text-sm text-indigo-200/80 mt-1 max-w-2xl">
                Visualización centralizada de horarios, detección automática de solapamientos entre programas y balance de horas de la plantilla de instructores.
              </p>
            </div>
          </div>

          {/* 4 KPIs Clave en el Header */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-center min-w-[90px]">
              <span className="text-[10px] text-blue-200 uppercase font-bold block">Sesiones Totales</span>
              <span className="text-lg font-black text-white font-mono">{todasLasSesiones.length} Clases</span>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-center min-w-[90px]">
              <span className="text-[10px] text-emerald-200 uppercase font-bold block">Docentes Activos</span>
              <span className="text-lg font-black text-emerald-300 font-mono">{docentesStats.length} Prof.</span>
            </div>
            <div className={`border rounded-xl px-3 py-2 text-center min-w-[90px] ${
              conflictos.length > 0 ? 'bg-rose-500/20 border-rose-400/60 text-rose-300' : 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
            }`}>
              <span className="text-[10px] uppercase font-bold block">Solapamientos</span>
              <span className="text-lg font-black font-mono flex items-center justify-center gap-1">
                {conflictos.length > 0 ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>{conflictos.length} Alertas</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>0 Conflictos</span>
                  </>
                )}
              </span>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-center min-w-[90px]">
              <span className="text-[10px] text-purple-200 uppercase font-bold block">Horas Mensuales</span>
              <span className="text-lg font-black text-purple-300 font-mono">
                {todasLasSesiones.reduce((acc, s) => acc + s.horas, 0)} hrs
              </span>
            </div>
          </div>
        </div>

        {/* Alerta de Conflicto Activo si existe */}
        {conflictos.length > 0 && (
          <div className="mt-4 p-3 bg-rose-500/20 border border-rose-400/50 rounded-xl flex items-center justify-between gap-3 text-xs text-rose-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
              <span>
                <strong>Atención:</strong> Se han detectado <strong>{conflictos.length} cruces de horario o sobrecargas</strong> en la asignación docente. Revise la pestaña de Solapamientos para resolverlos.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setVistaModo('conflictos')}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition-colors shrink-0 shadow-xs"
            >
              Auditar Solapamientos →
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* BARRA DE INTEGRACIÓN CON GOOGLE CALENDAR Y ASIGNACIÓN MANUAL */}
      {/* ========================================================================= */}
      <GoogleCalendarIntegrationBar
        todasLasSesiones={todasLasSesiones}
        onEventosGoogleCargados={(evs) => setGoogleEvents(evs)}
        onAbrirProgramadorManual={(fecha) => {
          setSesionParaEditarManual(null);
          setFechaPreviaManual(fecha || new Date().toISOString().split('T')[0]);
          setMostrarModalManual(true);
        }}
        onNotificarExito={(msg) => {
          setMensajeExito(msg);
          setTimeout(() => setMensajeExito(null), 5000);
        }}
        onNotificarError={(msg) => {
          setMensajeError(msg);
          setTimeout(() => setMensajeError(null), 5000);
        }}
      />

      {mensajeError && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2.5 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{mensajeError}</span>
        </div>
      )}

      {mensajeExito && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SELECTOR DE SUB-MODOS DE VISTA DEL CALENDARIO MAESTRO */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setVistaModo('calendario')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all ${
              vistaModo === 'calendario'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>📅 Cuadrícula Mensual</span>
          </button>

          <button
            type="button"
            onClick={() => setVistaModo('docentes')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all ${
              vistaModo === 'docentes'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>👥 Matriz de Carga Docente ({docentesStats.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setVistaModo('conflictos')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all relative ${
              vistaModo === 'conflictos'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>⚠️ Detector de Solapamientos</span>
            {conflictos.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute top-1 right-1" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setVistaModo('lista')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all ${
              vistaModo === 'lista'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>📋 Agenda Consolidada ({sesionesFiltradas.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setVistaModo('programador')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all ${
              vistaModo === 'programador'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>⚡ Programador Rápido</span>
          </button>

          <button
            type="button"
            onClick={() => setVistaModo('desembolsos')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all ${
              vistaModo === 'desembolsos'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>💰 Flujo de Desembolsos SAR</span>
          </button>
        </div>

        {/* Barra de Búsqueda Rápida */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar curso, docente, tema..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 w-48 sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BARRA DE FILTROS SUPERIORES (Docente, Proyecto, Modalidad, Solapamientos) */}
      {/* ========================================================================= */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Filtrar por:</span>
          </div>

          {/* Filtro Docente */}
          <select
            value={filtroDocente}
            onChange={(e) => setFiltroDocente(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800"
          >
            <option value="todos">👨‍🏫 Todos los Docentes ({listaDocentesUnicos.length})</option>
            {listaDocentesUnicos.map((doc) => (
              <option key={doc} value={doc}>{doc}</option>
            ))}
          </select>

          {/* Filtro Proyecto */}
          <select
            value={filtroProyecto}
            onChange={(e) => setFiltroProyecto(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 max-w-[200px]"
          >
            <option value="todos">📚 Todos los Programas ({proyectos.length})</option>
            {proyectos.map((p) => (
              <option key={p.id} value={p.id}>{p.nombreProyecto}</option>
            ))}
          </select>

          {/* Filtro Modalidad */}
          <select
            value={filtroModalidad}
            onChange={(e) => setFiltroModalidad(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800"
          >
            <option value="todos">🌐 Todas las Modalidades</option>
            <option value="Virtual">Virtual Sincrónica</option>
            <option value="Presencial">Presencial</option>
            <option value="Híbrida">Híbrida</option>
          </select>

          {/* Checkbox Solo Solapamientos */}
          <button
            type="button"
            onClick={() => setFiltroSolapamientos(!filtroSolapamientos)}
            className={`px-3 py-1.5 rounded-lg border font-bold flex items-center gap-1.5 transition-colors ${
              filtroSolapamientos
                ? 'bg-rose-100 text-rose-800 border-rose-300'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${filtroSolapamientos ? 'text-rose-600' : 'text-slate-400'}`} />
            <span>Solo con Solapamientos</span>
          </button>
        </div>

        {(filtroDocente !== 'todos' || filtroProyecto !== 'todos' || filtroModalidad !== 'todos' || filtroSolapamientos || busqueda) && (
          <button
            type="button"
            onClick={() => {
              setFiltroDocente('todos');
              setFiltroProyecto('todos');
              setFiltroModalidad('todos');
              setFiltroSolapamientos(false);
              setBusqueda('');
            }}
            className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: CALENDARIO MENSUAL CON SESIONES Y DETECTOR VISUAL */}
      {/* ========================================================================= */}
      {vistaModo === 'calendario' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Cabecera del Calendario: Mes, Año, Botones de Navegación */}
          <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h3 className="text-lg sm:text-xl font-black text-white tracking-wide">
                {mesNombre} {anioNumero}
              </h3>
              <span className="bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
                {sesionesFiltradas.length} Sesiones Programadas
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleMesAnterior}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                title="Mes Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleMesHoy}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
              >
                Hoy / Mes Actual
              </button>
              <button
                type="button"
                onClick={handleMesSiguiente}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                title="Mes Siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Días de la Semana */}
          <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200 text-center text-xs font-bold text-slate-700 py-2">
            <div>LUNES</div>
            <div>MARTES</div>
            <div>MIÉRCOLES</div>
            <div>JUEVES</div>
            <div>VIERNES</div>
            <div className="text-indigo-700">SÁBADO</div>
            <div className="text-rose-700">DOMINGO</div>
          </div>

          {/* Cuadrícula de Días */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 bg-slate-50 min-h-[500px]">
            {diasDelMes.map((dia, idx) => {
              const tieneSolapamientoEnDia = dia.sesiones.some((s) => sesionesConConflictoIds.has(s.id));
              const esHoy = dia.fechaStr === new Date().toISOString().split('T')[0];

              return (
                <div
                  key={idx}
                  className={`p-1.5 sm:p-2 flex flex-col justify-between min-h-[110px] sm:min-h-[130px] transition-colors ${
                    dia.esMesActual ? 'bg-white' : 'bg-slate-50/60 opacity-60'
                  } ${esHoy ? 'ring-2 ring-blue-500 ring-inset bg-blue-50/20' : ''}`}
                >
                  {/* Encabezado del Día */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-full ${
                        esHoy
                          ? 'bg-blue-600 text-white'
                          : dia.esMesActual
                          ? 'text-slate-800 font-mono'
                          : 'text-slate-400 font-mono'
                      }`}
                    >
                      {dia.diaNumero}
                    </span>

                    {tieneSolapamientoEnDia && (
                      <span
                        className="p-0.5 rounded bg-rose-100 text-rose-700 border border-rose-300 text-[10px] font-bold flex items-center gap-0.5"
                        title="¡Conflicto de Horario detectado en este día!"
                      >
                        <AlertTriangle className="w-3 h-3 text-rose-600 animate-pulse" />
                        <span className="hidden sm:inline">Solapamiento</span>
                      </span>
                    )}
                  </div>

                  {/* Lista de Sesiones en ese Día y Eventos Google Calendar */}
                  <div className="space-y-1 overflow-y-auto max-h-[110px] pr-0.5">
                    {/* Eventos de Google Calendar */}
                    {dia.eventosGoogle && dia.eventosGoogle.map((gEv) => (
                      <div
                        key={gEv.id}
                        className="p-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-950 text-[9px] font-semibold truncate hover:bg-indigo-100 transition-colors"
                        title={`Google Calendar: ${gEv.summary}${gEv.location ? ' • ' + gEv.location : ''}`}
                      >
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0"></span>
                          <span className="font-extrabold text-[8px] uppercase tracking-wider text-indigo-700">Google:</span>
                          <span className="truncate">{gEv.summary}</span>
                        </div>
                      </div>
                    ))}

                    {/* Sesiones de Clases de los Programas */}
                    {dia.sesiones.map((ses) => {
                      const tieneConflicto = sesionesConConflictoIds.has(ses.id);

                      return (
                        <div
                          key={ses.id}
                          onClick={() => handleAbrirEditarSesion(ses)}
                          className={`p-1.5 rounded-lg border text-[10px] cursor-pointer transition-all hover:scale-[1.02] ${
                            tieneConflicto
                              ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-xs'
                              : ses.modalidad === 'Presencial'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                              : 'bg-blue-50 border-blue-200 text-blue-950'
                          }`}
                          title={`${ses.nombreProyecto}\nDocente: ${ses.nombreDocente}\nHorario: ${ses.horaInicio} - ${ses.horaFin}\nTema: ${ses.tema}\n(Haz clic para modificar fecha y hora manualmente)`}
                        >
                          <div className="flex items-center justify-between gap-1 font-bold">
                            <span className="font-mono text-[9px] text-blue-900 truncate">
                              ⏰ {ses.horaInicio} - {ses.horaFin}
                            </span>
                            {tieneConflicto && (
                              <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                            )}
                          </div>
                          <p className="font-bold truncate mt-0.5">{ses.nombreProyecto}</p>
                          <div className="flex items-center justify-between text-[9px] text-slate-500 mt-0.5">
                            <span className="truncate">👨‍🏫 {ses.nombreDocente.split(' ')[0]}</span>
                            <span className="font-mono">{ses.horas}h</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Botón rápido para fijar manualmente fecha y hora en este día */}
                  {dia.esMesActual && (
                    <button
                      type="button"
                      onClick={() => {
                        setSesionParaEditarManual(null);
                        setFechaPreviaManual(dia.fechaStr);
                        setMostrarModalManual(true);
                      }}
                      className="mt-1 w-full py-0.5 text-[9px] font-bold text-slate-500 hover:text-indigo-700 bg-slate-100/60 hover:bg-indigo-50 border border-dashed border-slate-200 hover:border-indigo-300 rounded transition-colors flex items-center justify-center gap-0.5"
                      title={`Colocar manualmente fecha y hora para el ${dia.fechaStr}`}
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>+ Hora manual</span>
                    </button>
                  )}

                  {dia.sesiones.length === 0 && (!dia.eventosGoogle || dia.eventosGoogle.length === 0) && dia.esMesActual && (
                    <div className="text-[10px] text-slate-300 text-center py-1 font-mono">
                      -
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: MATRIZ DE CARGA HORARIA Y DISPONIBILIDAD DOCENTE */}
      {/* ========================================================================= */}
      {vistaModo === 'docentes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {docentesStats.map((doc) => {
              const semaforoColor =
                doc.estadoCarga === 'SOBRECARGA'
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : doc.estadoCarga === 'ALTA'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : doc.estadoCarga === 'OPTIMA'
                  ? 'bg-blue-50 border-blue-200 text-blue-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900';

              const badgeColor =
                doc.estadoCarga === 'SOBRECARGA'
                  ? 'bg-rose-600 text-white'
                  : doc.estadoCarga === 'ALTA'
                  ? 'bg-amber-600 text-white'
                  : doc.estadoCarga === 'OPTIMA'
                  ? 'bg-blue-600 text-white'
                  : 'bg-emerald-600 text-white';

              const pctCapacidad = Math.min(100, Math.round((doc.horasSemanalesPromedio / doc.limiteSemanalHoras) * 100));

              return (
                <div
                  key={doc.nombreDocente}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between gap-3.5 hover:shadow-md transition-shadow"
                >
                  <div>
                    {/* Header del Docente */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 text-indigo-800 font-bold flex items-center justify-center text-sm shadow-inner shrink-0">
                          {doc.nombreDocente.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 line-clamp-1" title={doc.nombreDocente}>
                            {doc.nombreDocente}
                          </h4>
                          <span className="text-[11px] text-slate-500 block">
                            {doc.especialidad} • ⭐ {doc.nps}/5.0
                          </span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${badgeColor}`}>
                        {doc.estadoCarga}
                      </span>
                    </div>

                    {/* Barra de Carga y Capacidad Semanal */}
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-semibold">Carga Semanal Asignada:</span>
                        <span className="font-black font-mono text-slate-900">
                          {doc.horasSemanalesPromedio}h / {doc.limiteSemanalHoras}h ({pctCapacidad}%)
                        </span>
                      </div>

                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            pctCapacidad > 90
                              ? 'bg-rose-500'
                              : pctCapacidad > 75
                              ? 'bg-amber-500'
                              : pctCapacidad > 40
                              ? 'bg-blue-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${pctCapacidad}%` }}
                        />
                      </div>
                    </div>

                    {/* Estadísticas Resumidas */}
                    <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Mensual</span>
                        <span className="text-xs font-black text-slate-900 font-mono">{doc.totalHorasMensuales} hrs</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Sesiones</span>
                        <span className="text-xs font-black text-blue-900 font-mono">{doc.totalSesiones}</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Cursos</span>
                        <span className="text-xs font-black text-purple-900 font-mono">{doc.proyectos.length}</span>
                      </div>
                    </div>

                    {/* Programas Asignados */}
                    <div className="mt-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Cursos Impartidos:
                      </span>
                      <div className="space-y-1">
                        {doc.proyectos.map((p) => (
                          <div
                            key={p.id}
                            className="text-[11px] bg-slate-50 p-1.5 rounded-lg border border-slate-200 flex items-center justify-between text-slate-700"
                          >
                            <span className="font-semibold truncate max-w-[190px]">{p.nombre}</span>
                            <span className="font-mono text-[10px] font-bold text-indigo-700">{p.horas}h</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Disponibilidad Declarada */}
                    <div className="mt-2.5 p-2 bg-blue-50/50 rounded-lg border border-blue-100 text-[10px] text-blue-900 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{doc.disponibilidadDeclarada}</span>
                    </div>
                  </div>

                  {/* Alerta de Conflicto o Estado Óptimo */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    {doc.tieneConflictos ? (
                      <span className="text-[11px] font-bold text-rose-700 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        {doc.conflictosCount} Solapamiento(s)
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Horarios Disponibles
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setFiltroDocente(doc.nombreDocente);
                        setVistaModo('calendario');
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <span>Ver Agenda</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 3: AUDITOR & DETECTOR DE SOLAPAMIENTOS EN TIEMPO REAL */}
      {/* ========================================================================= */}
      {vistaModo === 'conflictos' && (
        <div className="space-y-4">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-rose-950">
                  Panel de Auditoría de Conflictos & Solapamientos de Horario
                </h3>
                <p className="text-xs text-rose-800 mt-0.5">
                  El motor académico revisa en tiempo real que ningún docente tenga clases simultáneas en dos programas distintos ni sobrecargas horarias no autorizadas.
                </p>
              </div>
            </div>
          </div>

          {conflictos.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-black text-slate-900">
                ¡Excelente! Cero Solapamientos Detectados
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Todos los docentes y programas cuentan con horarios libres, sin cruces ni choques en la parrilla curricular.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {conflictos.map((conf) => (
                <div
                  key={conf.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-rose-300 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-rose-600 text-white font-extrabold text-[10px] rounded-full uppercase tracking-wider">
                        {conf.tipo === 'SOLAPAMIENTO_HORARIO' ? 'Cruce de Horario Crítico' : 'Sobrecarga Diaria'}
                      </span>
                      <span className="text-xs font-black text-slate-900">
                        Docente: {conf.docente}
                      </span>
                    </div>

                    <span className="text-xs font-mono font-bold text-slate-500">
                      Fecha: {conf.fecha}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {conf.descripcion}
                  </p>

                  {/* Comparativa de los dos programas en conflicto */}
                  {conf.sesion2 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="p-2.5 bg-white rounded-lg border border-rose-200">
                        <span className="text-[10px] font-bold text-rose-700 uppercase block">Programa 1</span>
                        <h5 className="text-xs font-bold text-slate-900 mt-0.5">{conf.sesion1.nombreProyecto}</h5>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                          <span>⏰ {conf.sesion1.horaInicio} - {conf.sesion1.horaFin}</span>
                          <span>Sesión #{conf.sesion1.numeroSesion}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAbrirEditarSesion(conf.sesion1)}
                          className="w-full mt-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-[10px] transition-colors"
                        >
                          Reprogramar este Curso
                        </button>
                      </div>

                      <div className="p-2.5 bg-white rounded-lg border border-rose-200">
                        <span className="text-[10px] font-bold text-rose-700 uppercase block">Programa 2</span>
                        <h5 className="text-xs font-bold text-slate-900 mt-0.5">{conf.sesion2.nombreProyecto}</h5>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                          <span>⏰ {conf.sesion2.horaInicio} - {conf.sesion2.horaFin}</span>
                          <span>Sesión #{conf.sesion2.numeroSesion}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAbrirEditarSesion(conf.sesion2!)}
                          className="w-full mt-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-[10px] transition-colors"
                        >
                          Reprogramar este Curso
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Info className="w-3.5 h-3.5 text-blue-600" />
                      <strong>Recomendación Académica:</strong> {conf.recomendacion}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 4: AGENDA CONSOLIDADA EN LISTA (CRONOGRAMA DETALLADO) */}
      {/* ========================================================================= */}
      {vistaModo === 'lista' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <h3 className="font-bold text-sm">
              Agenda Cronológica de Sesiones ({sesionesFiltradas.length})
            </h3>
            <span className="text-xs text-slate-300">
              Ordenadas por fecha y hora
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">Fecha & Horario</th>
                  <th className="py-2.5 px-3">Programa / Curso</th>
                  <th className="py-2.5 px-3">Docente Asignado</th>
                  <th className="py-2.5 px-3">Sesión / Módulo</th>
                  <th className="py-2.5 px-3">Modalidad / Aula</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                  <th className="py-2.5 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sesionesFiltradas.map((ses) => {
                  const tieneConflicto = sesionesConConflictoIds.has(ses.id);

                  return (
                    <tr
                      key={ses.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        tieneConflicto ? 'bg-rose-50/60' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{ses.fecha}</div>
                        <div className="font-mono text-[10px] text-blue-700">
                          ⏰ {ses.horaInicio} - {ses.horaFin} ({ses.horas}h)
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{ses.nombreProyecto}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{ses.codigoPrograma}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-800">{ses.nombreDocente}</div>
                        {tieneConflicto && (
                          <span className="text-[9px] font-extrabold text-rose-600 bg-rose-100 px-1.5 py-0.2 rounded inline-flex items-center gap-0.5 mt-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Solapamiento
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-indigo-900">Sesión #{ses.numeroSesion}</span>
                        <div className="text-[10px] text-slate-600 truncate max-w-[200px]" title={ses.tema}>
                          {ses.tema}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          ses.modalidad === 'Presencial'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {ses.modalidad}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[120px]">
                          {ses.plataformaAula}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold">
                          {ses.estado}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleAbrirEditarSesion(ses)}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-[11px] border border-blue-200 transition-colors"
                        >
                          Reprogramar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 5: PROGRAMADOR RÁPIDO CON VERIFICADOR ANTI-SOLAPAMIENTO EN VIVO */}
      {/* ========================================================================= */}
      {vistaModo === 'programador' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-4 sm:p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/30 border border-blue-400/40 flex items-center justify-center shrink-0">
                <CalendarIcon className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Agendamiento Manual & Google Calendar</h4>
                <p className="text-xs text-blue-200">
                  Coloca manualmente la fecha, hora exacta de inicio/fin, calcula horas lectivas y sincroniza en vivo con Google Calendar.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSesionParaEditarManual(null);
                setFechaPreviaManual(new Date().toISOString().split('T')[0]);
                setMostrarModalManual(true);
              }}
              className="px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Abrir Agendador Manual con Google Calendar</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-sm text-slate-900">
                  Programador Rápido de Nuevas Sesiones
                </h3>
              </div>

              <form onSubmit={handleCrearSesionRapida} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Seleccionar Programa / Curso
                </label>
                <select
                  value={nuevoProyectoId}
                  onChange={(e) => setNuevoProyectoId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  {proyectos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombreProyecto} (Docente: {p.nombreDocente})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tema / Módulo a Impartir
                </label>
                <input
                  type="text"
                  required
                  value={nuevoTema}
                  onChange={(e) => setNuevoTema(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fecha de la Clase
                  </label>
                  <input
                    type="date"
                    required
                    value={nuevaFechaProgramador}
                    onChange={(e) => setNuevaFechaProgramador(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hora Inicio (24h)
                  </label>
                  <input
                    type="time"
                    required
                    value={nuevoInicioProgramador}
                    onChange={(e) => setNuevoInicioProgramador(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hora Fin (24h)
                  </label>
                  <input
                    type="time"
                    required
                    value={nuevoFinProgramador}
                    onChange={(e) => setNuevoFinProgramador(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Modalidad
                </label>
                <select
                  value={nuevaModalidadProgramador}
                  onChange={(e) => setNuevaModalidadProgramador(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                >
                  <option value="Virtual">Virtual Sincrónica (Zoom / Teams)</option>
                  <option value="Presencial">Presencial (Aula Física)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Agendar Sesión en Cronograma Maestro</span>
              </button>
            </form>
          </div>

          {/* Verificador de Disponibilidad en Tiempo Real */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md border border-indigo-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-indigo-800/80 pb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="font-black text-sm text-white">
                Validación Anti-Solapamiento en Vivo
              </h3>
            </div>

            {(() => {
              const proj = proyectos.find((p) => p.id === nuevoProyectoId);
              const docente = proj?.nombreDocente || '';
              const cruces = todasLasSesiones.filter(
                (s) =>
                  s.nombreDocente.toLowerCase() === docente.toLowerCase() &&
                  s.fecha === nuevaFechaProgramador
              );

              return (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                    <span className="text-indigo-200 block text-[10px] uppercase font-bold">Docente Evaluado</span>
                    <strong className="text-white text-sm">{docente || 'Sin Docente'}</strong>
                  </div>

                  <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                    <span className="text-indigo-200 block text-[10px] uppercase font-bold">Fecha & Horario Evaluado</span>
                    <strong className="text-white font-mono text-xs">{nuevaFechaProgramador} • {nuevoInicioProgramador} a {nuevoFinProgramador}</strong>
                  </div>

                  {cruces.length === 0 ? (
                    <div className="p-3 bg-emerald-500/20 border border-emerald-400/50 rounded-xl text-emerald-300 font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                      <span>✅ Horario 100% Disponible. Sin conflictos para este docente.</span>
                    </div>
                  ) : (
                    <div className="p-3 bg-rose-500/20 border border-rose-400/60 rounded-xl text-rose-200 space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-rose-300">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                        <span>⚠️ ¡Atención! El docente ya tiene clases en esa fecha:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-200/90 pl-1">
                        {cruces.map((c) => (
                          <li key={c.id}>
                            <strong>{c.nombreProyecto}</strong> ({c.horaInicio} - {c.horaFin})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 6: PROYECCIÓN DE FLUJO DE DESEMBOLSOS DOCENTES & RETENCIÓN SAR */}
      {/* ========================================================================= */}
      {vistaModo === 'desembolsos' && (() => {
        // Cálculo del flujo de caja docente en el mes visualizado
        const anio = fechaActual.getFullYear();
        const mes = fechaActual.getMonth(); // 0-indexed
        const prefijoMes = `${anio}-${(mes + 1).toString().padStart(2, '0')}`;

        // Filtrar sesiones del mes actual
        const sesionesDelMes = todasLasSesiones.filter((s) => s.fecha.startsWith(prefijoMes));

        // Agrupar por docente
        const desembolsosMap = new Map<string, {
          docente: string;
          rtnDocente: string;
          programas: Set<string>;
          tarifaHora: number;
          horasQ1: number; // días 1 al 15
          horasQ2: number; // días 16 en adelante
          totalHoras: number;
          brutoTotal: number;
          retencionISR: number;
          netoTotal: number;
          sesionesQ1: number;
          sesionesQ2: number;
        }>();

        sesionesDelMes.forEach((s) => {
          const doc = s.nombreDocente.trim() || 'Docente sin asignar';
          const dia = parseInt(s.fecha.split('-')[2] || '1', 10);
          const proj = proyectos.find((p) => p.id === s.proyectoId);
          const tarifa = proj?.tarifaHoraDocente || 200;

          const actual = desembolsosMap.get(doc) || {
            docente: doc,
            rtnDocente: proj?.docenteRtn || '08011985123450',
            programas: new Set<string>(),
            tarifaHora: tarifa,
            horasQ1: 0,
            horasQ2: 0,
            totalHoras: 0,
            brutoTotal: 0,
            retencionISR: 0,
            netoTotal: 0,
            sesionesQ1: 0,
            sesionesQ2: 0,
          };

          actual.programas.add(s.nombreProyecto);
          actual.totalHoras += s.horas;

          if (dia <= 15) {
            actual.horasQ1 += s.horas;
            actual.sesionesQ1 += 1;
          } else {
            actual.horasQ2 += s.horas;
            actual.sesionesQ2 += 1;
          }

          desembolsosMap.set(doc, actual);
        });

        const listaDesembolsos = Array.from(desembolsosMap.values()).map((d) => {
          const bruto = d.totalHoras * d.tarifaHora;
          const retencion = bruto * 0.125; // 12.5% ISR persona natural residente
          const neto = bruto - retencion;
          return {
            ...d,
            brutoTotal: bruto,
            retencionISR: retencion,
            netoTotal: neto,
          };
        }).sort((a, b) => b.brutoTotal - a.brutoTotal);

        const totalBrutoMes = listaDesembolsos.reduce((acc, d) => acc + d.brutoTotal, 0);
        const totalRetencionMes = listaDesembolsos.reduce((acc, d) => acc + d.retencionISR, 0);
        const totalNetoMes = listaDesembolsos.reduce((acc, d) => acc + d.netoTotal, 0);

        const totalBrutoQ1 = listaDesembolsos.reduce((acc, d) => acc + (d.horasQ1 * d.tarifaHora), 0);
        const totalNetoQ1 = totalBrutoQ1 * (1 - 0.125);

        const totalBrutoQ2 = listaDesembolsos.reduce((acc, d) => acc + (d.horasQ2 * d.tarifaHora), 0);
        const totalNetoQ2 = totalBrutoQ2 * (1 - 0.125);

        // Exportar a CSV
        const handleExportarCSV = () => {
          const headers = ['Docente', 'RTN', 'Horas Q1', 'Horas Q2', 'Total Horas', 'Tarifa/Hora', 'Bruto Total', 'Retencion ISR (12.5%)', 'Neto a Pagar'];
          const rows = listaDesembolsos.map((d) => [
            `"${d.docente}"`,
            `"${d.rtnDocente}"`,
            d.horasQ1,
            d.horasQ2,
            d.totalHoras,
            d.tarifaHora,
            d.brutoTotal.toFixed(2),
            d.retencionISR.toFixed(2),
            d.netoTotal.toFixed(2),
          ]);
          const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
          const encodedUri = encodeURI(csvContent);
          const link = document.createElement('a');
          link.setAttribute('href', encodedUri);
          link.setAttribute('download', `Desembolsos_Docentes_${mesNombre}_${anioNumero}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };

        return (
          <div className="space-y-6">
            {/* Header del módulo de desembolsos */}
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-5 rounded-2xl border border-emerald-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-black text-white tracking-wide">
                    Planificador Financiero de Cargas & Desembolsos Docentes
                  </h3>
                  <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                    SAR Formulario 272
                  </span>
                </div>
                <p className="text-xs text-emerald-200/90 max-w-2xl leading-relaxed">
                  Proyección del flujo de caja requerido para el pago de honorarios profesionales docentes en {mesNombre} {anioNumero}, desglosado por quincenas y con retención fiscal del 12.5% de ISR para {INSTITUCION_INFO.razonSocial}.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportarCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Exportar Planilla a CSV</span>
              </button>
            </div>

            {/* Tarjetas de Resumen de Tesorería */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Honorario Bruto Mes</span>
                <div className="text-xl font-black text-slate-900 font-mono mt-1">
                  {formatearMoneda(totalBrutoMes, moneda)}
                </div>
                <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
                  {sesionesDelMes.length} clases programadas en {mesNombre}
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-2xs">
                <span className="text-[10px] font-bold text-rose-700 uppercase block">Retención Fiscal ISR (12.5%)</span>
                <div className="text-xl font-black text-rose-600 font-mono mt-1">
                  {formatearMoneda(totalRetencionMes, moneda)}
                </div>
                <span className="text-[10px] text-rose-700 font-medium mt-0.5 block">
                  A enterar al SAR antes del día 10 del mes siguiente
                </span>
              </div>

              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-300 shadow-2xs">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Flujo Neto a Desembolsar</span>
                <div className="text-xl font-black text-emerald-900 font-mono mt-1">
                  {formatearMoneda(totalNetoMes, moneda)}
                </div>
                <span className="text-[10px] text-emerald-700 font-bold mt-0.5 block">
                  Transferencia bancaria a facilitadores
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Distribución Quincenal</span>
                <div className="text-xs space-y-1 font-mono mt-1">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Q1 (Día 15):</span>
                    <strong className="text-slate-900">{formatearMoneda(totalNetoQ1, moneda)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Q2 (Fin de mes):</span>
                    <strong className="text-slate-900">{formatearMoneda(totalNetoQ2, moneda)}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de Desglose de Desembolsos */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Nómina de Honorarios y Retención Docente ({mesNombre} {anioNumero})
                  </h4>
                  <span className="text-[10px] text-slate-500">
                    Cálculo automático de retención del 12.5% conforme al Art. 50 de la Ley de ISR.
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  {listaDesembolsos.length} Docentes en Planilla
                </span>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Docente / RTN</th>
                      <th className="py-2.5 px-3">Programas Impartidos</th>
                      <th className="py-2.5 px-3 text-center">Horas Q1</th>
                      <th className="py-2.5 px-3 text-center">Horas Q2</th>
                      <th className="py-2.5 px-3 text-center">Total Horas</th>
                      <th className="py-2.5 px-3 text-right">Tarifa/H</th>
                      <th className="py-2.5 px-3 text-right">Honorario Bruto</th>
                      <th className="py-2.5 px-3 text-right text-rose-700">Retención 12.5%</th>
                      <th className="py-2.5 px-3 text-right text-emerald-800">Neto a Transferir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {listaDesembolsos.map((d) => (
                      <tr key={d.docente} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{d.docente}</div>
                          <div className="text-[10px] font-mono text-slate-500">RTN: {d.rtnDocente}</div>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {Array.from(d.programas).map((prog, idx) => (
                              <span key={idx} className="bg-slate-100 text-slate-700 text-[9px] px-1.5 py-0.5 rounded font-medium truncate">
                                {prog}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-center font-mono font-medium">
                          {d.horasQ1}h ({d.sesionesQ1} ses)
                        </td>

                        <td className="py-2.5 px-3 text-center font-mono font-medium">
                          {d.horasQ2}h ({d.sesionesQ2} ses)
                        </td>

                        <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-900">
                          {d.totalHoras}h
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          {formatearMoneda(d.tarifaHora, moneda)}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {formatearMoneda(d.brutoTotal, moneda)}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">
                          -{formatearMoneda(d.retencionISR, moneda)}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-800 bg-emerald-50/40">
                          {formatearMoneda(d.netoTotal, moneda)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-300">
                    <tr>
                      <td colSpan={4} className="py-2.5 px-3 text-slate-800 text-right uppercase text-[10px]">
                        Totales Consolidados del Mes:
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-blue-900">
                        {listaDesembolsos.reduce((acc, d) => acc + d.totalHoras, 0)}h
                      </td>
                      <td></td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-900">
                        {formatearMoneda(totalBrutoMes, moneda)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-700">
                        -{formatearMoneda(totalRetencionMes, moneda)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-900 font-black">
                        {formatearMoneda(totalNetoMes, moneda)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL PARA AGENDAR/REPROGRAMAR SESIÓN CON HORA MANUAL Y GOOGLE CALENDAR */}
      {/* ========================================================================= */}
      {mostrarModalManual && (
        <ManualScheduleSessionModal
          proyectos={proyectos}
          sesionExistente={sesionParaEditarManual}
          fechaInicial={fechaPreviaManual}
          todasLasSesiones={todasLasSesiones}
          onCerrar={() => {
            setMostrarModalManual(false);
            setSesionParaEditarManual(null);
            setFechaPreviaManual(undefined);
          }}
          onGuardar={handleGuardarSesionManual}
          onNotificarExito={(msg) => {
            setMensajeExito(msg);
            setTimeout(() => setMensajeExito(null), 5000);
          }}
          onNotificarError={(msg) => {
            setMensajeError(msg);
            setTimeout(() => setMensajeError(null), 5000);
          }}
        />
      )}
    </div>
  );
};
