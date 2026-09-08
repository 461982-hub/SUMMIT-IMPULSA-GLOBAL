export type SeccionGerencia = 'general' | 'academica' | 'comercializacion' | 'todas';

export type VistaPrincipal = 
  | 'gerencia-general'
  | 'gerencia-academica'
  | 'gerencia-comercializacion'
  | 'registrar'
  | 'control' 
  | 'tabla' 
  | 'tarjetas' 
  | 'modificar' 
  | 'meses' 
  | 'analitica' 
  | 'guia' 
  | 'isv';

export type TipoProyecto = 
  | 'Capacitación profesional / Mentoría ejecutiva'
  | 'Formación académica acreditada (ej. convenios universitarios)'
  | 'Servicios educativos no acreditados (talleres, cursos libres)'
  | 'Consultoría empresarial'
  | 'Intermediación laboral / servicios de RRHH'
  | 'Servicios administrativos / gestión de proyectos'
  | string;

export type TipoServicioFiscal =
  | 'Capacitación profesional / Mentoría ejecutiva'
  | 'Formación académica acreditada (ej. convenios universitarios)'
  | 'Servicios educativos no acreditados (talleres, cursos libres)'
  | 'Consultoría empresarial'
  | 'Intermediación laboral / servicios de RRHH'
  | 'Servicios administrativos / gestión de proyectos';

export type NivelProyecto = 
  | 'Básico' 
  | 'Intermedio' 
  | 'Avanzado' 
  | 'Especializado' 
  | 'Todos los niveles';

export type MetodoVenta = 
  | 'Redes sociales' 
  | 'WhatsApp' 
  | 'Email Marketing' 
  | 'Referidos' 
  | 'Convenios / Empresas' 
  | 'Llamadas / Telemarketing' 
  | 'Página Web' 
  | 'Publicidad Paga (Ads)' 
  | 'Otro';

export type EstadoProyecto = 
  | 'Planificado' 
  | 'En proceso' 
  | 'Listo' 
  | 'Denegado' 
  | 'Realizar'
  | 'Sí' 
  | 'No' 
  | 'En curso' 
  | 'Pospuesto' 
  | 'Cancelado'
  | 'No se llevó a cabo';

export type TipoCambioHistorial = 
  | 'creacion' 
  | 'costos' 
  | 'proyeccion' 
  | 'margen_precio' 
  | 'estado' 
  | 'docente' 
  | 'manual';

export interface DetalleCampoModificado {
  campo: string;
  etiqueta: string;
  valorAnterior: string | number;
  valorNuevo: string | number;
  tipo?: 'moneda' | 'numero' | 'porcentaje' | 'texto';
}

export interface ImpactoFinancieroHistorial {
  gastoOperativoAnterior: number;
  gastoOperativoNuevo: number;
  precioSugeridoAnterior: number;
  precioSugeridoNuevo: number;
  gananciaFinalAnterior: number;
  gananciaFinalNueva: number;
  puntoEquilibrioAnterior: number;
  puntoEquilibrioNuevo: number;
}

export interface HistorialCambioProyecto {
  id: string;
  fecha: string; // ISO string
  usuario?: string;
  tipoCambio: TipoCambioHistorial;
  titulo: string;
  descripcion: string;
  modificaciones?: DetalleCampoModificado[];
  impactoFinanciero?: ImpactoFinancieroHistorial;
}

export interface ReglaISVServicio {
  servicio: TipoServicioFiscal;
  aplicaISV: boolean;
  tasaPorcentaje: number;
  observaciones: string;
  fundamentoLegal?: string;
}

export interface DesgloseFiscalCompleto {
  tipoServicio: TipoServicioFiscal;
  gravaISV: boolean;
  tasaISV: number; // 15 o 0
  
  // Ingresos
  precioSugeridoNetoAlumno: number;
  isvPorAlumno: number;
  precioFacturadoPorAlumno: number;
  
  alumnosBase: number;
  ingresoBrutoFacturado: number; // Ingreso total con ISV
  isvTotalTrasladarSAR: number;  // Impuesto indirecto a declarar
  ingresoNetoOperativo: number;  // Subtotal neto para SUMMIT
  
  // Gastos Operativos Deducibles
  costoDocenteCalculado: number;
  costoZoom: number;
  costoPapeleria: number;
  gastosVarios: number;
  gastoTotalOperativo: number;
  
  // Utilidad Operativa Pre-Impuestos
  utilidadOperativaPreImpuestos: number; // EBIT
  margenOperativoPreImpuestos: number;   // %
  
  // Impuestos Específicos Directos
  tasaMunicipalPct: number;
  tasaMunicipalMonto: number;
  
  baseImponibleISR: number;
  tasaISRCorporativo: number; // 25 o 0
  isrCorporativoMonto: number;
  
  aporteSolidarioMonto: number; // 5% si aplica
  
  // Retenciones a Docentes / Terceros (Art. 50 Ley de ISR)
  aplicaRetencionDocente: boolean;
  retencionDocentePct: number; // 12.5%
  retencionDocenteMonto: number;
  honorarioNetoDocente: number; // 87.5%
  
  // Resultados Finales Post-Impuestos
  totalImpuestosDirectos: number; // Tasa municipal + ISR + Aporte solidario
  gananciaNetaPostImpuestos: number;
  margenNetoPostImpuestos: number; // %
  gananciaNetaPorAlumno: number;
  
  // Indicadores de Carga y Flujo Tributario
  cargaTributariaEfectivaPct: number; // (Impuestos directos / EBIT) * 100
  flujoTotalEnterarSAR: number;      // ISV + ISR + Retención Docente
  flujoTotalAlcaldia: number;        // Tasa municipal
  flujoTotalObligacionesFiscales: number;
  
  // Dictámenes y Fundamentación Legal
  dictamenSAR: string;
  fundamentoLegalISV: string;
  fundamentoLegalISR: string;
  formularioSARPrincipal: string;
  recomendacionOptimizacion: string;
  badgeEstado: 'exento' | 'gravado_optimo' | 'gravado_estandar';
}

export type EtapaFlujoProyecto = 
  | 'elaboracion_academica' 
  | 'comercializacion' 
  | 'dictamen_general' 
  | 'aprobado_listo'
  | 'cerrado';

export interface NotificacionGerencia {
  id: string;
  fecha: string; // ISO string
  gerenciaDestino: 'gerencia-comercializacion' | 'gerencia-general' | 'gerencia-academica' | 'todas';
  gerenciaOrigen: 'gerencia-academica' | 'gerencia-comercializacion' | 'gerencia-general' | 'sistema';
  titulo: string;
  mensaje: string;
  proyectoId?: string;
  nombreProyecto?: string;
  leida: boolean;
  tipo: 'nuevo_proyecto' | 'proyecto_comercializado' | 'dictamen_general' | 'alerta';
  accion?: {
    etiqueta: string;
    vistaDestino: VistaPrincipal;
    proyectoId?: string;
  };
}

export interface ProyectoEducativo {
  id: string;
  nombreProyecto: string;
  objetivoGeneral: string;
  nombreDocente: string;
  tipoProyecto: TipoProyecto;
  nivel: NivelProyecto;
  fechaProgramacion: string;
  fechaVenta: string;
  horasClase: number;
  tarifaHoraDocente: number; // Por defecto 200 LPS
  costoDocenteManual?: number; // Si se ingresa directamente
  costoZoom: number;
  costoPapeleria: number;
  gastosVarios: number;
  margenGananciaOperativa: number; // Porcentaje, ej: 30 para 30%
  alumnosProyectados: number;
  alumnosFinal: number;
  metodoVenta: MetodoVenta;
  seLlevoACabo: EstadoProyecto;
  observaciones: string;
  mesControl?: string; // Formato YYYY-MM ej: '2026-08'
  
  // Control de Cierre Mensual
  cerradoEnCierreMensual?: boolean;
  fechaCierreMensual?: string;
  
  // Aprobación Final de la Gerencia General & Deducción de Meta POA Mensual
  aprobacionFinalGerenciaGeneral?: boolean; // true si cuenta con la aprobación final de GG
  fechaAprobacionGerenciaGeneral?: string; // Fecha en que GG emitió su aprobación final
  aprobadoPorGerenciaGeneral?: string; // Nombre y cargo de quien aprobó (ej: "Dr. Walter Pedroza - Gerencia General")
  observacionesAprobacionGeneral?: string; // Dictamen u observaciones de la Gerencia General
  montoFacturacionAprobadaHNL?: number; // Monto facturado que rebaja la cuota del mes del POA
  
  // Control de Plazo de Comercialización & Decisión Institucional (20 días calendario desde la creación por Gerencia Académica)
  fechaElaboracion?: string; // Fecha en que la Gerencia Académica elaboró / registró el proyecto
  horaElaboracion?: string; // Hora en que la Gerencia Académica elaboró / registró el proyecto
  diasHabilesVenta?: number; // Mantenido para retrocompatibilidad
  diasCalendarioVenta?: number; // Días calendario asignados para venta (20 días calendario por defecto)
  decisionPlazoVenta?: 'Si' | 'No'; // 'Si' = Continúa el proceso, 'No' = No se llevó a cabo (proceso cerrado)
  fechaRegistroDecision?: string; // Fecha en que se registró la decisión (Si/No)
  horaRegistroDecision?: string; // Hora en que se registró la decisión
  detalleRegistroDecision?: string; // Bitácora de registro de la decisión
  tiempoVentaCumplido?: boolean; // Mantenido para compatibilidad (true si fue cerrado por no llevarse a cabo)
  fechaCierrePorTiempo?: string; // Fecha en que se cerró por cumplimiento de tiempo
  motivoCierre?: string; // Ej: "Decisión NO: Plazo de venta cumplido (20 días calendario) - No se llevó a cabo"
  procesoCerrado?: boolean; // True si el proceso ha sido cerrado automáticamente (No se llevó a cabo)

  // Flujo inter-gerencial y Auditoría de Cumplimiento
  fechaCreacion?: string; // Timestamp ISO cuando se crea el proyecto (inicia el cronómetro del flujo)
  horaCreacion?: string; // Hora formateada en que se grabó el proyecto (ej: "10:30:15 AM")
  fechaHoraGrabacion?: string; // Fecha y hora completa de grabación del proyecto (ej: "06/09/2026, 10:30:15 AM")
  fechaModificacion?: string; // Fecha del último guardado
  horaModificacion?: string; // Hora del último guardado
  horaUltimaModificacion?: string; // Hora formateada del último guardado o modificación
  fechaRegistroCompleta?: string; // Timestamp legible completo de registro
  registroAuditoria?: {
    creadoPor?: string;
    fechaHoraCreacion?: string;
    ultimaModificacion?: string;
    equipoModifico?: string;
  };
  etapaFlujo?: EtapaFlujoProyecto;
  nivelFlujoActual?: 1 | 2 | 3 | 4; // 1: Académica, 2: Comercialización, 3: Dictamen GG, 4: Aprobado Listo
  
  // Paso 1: Gerencia Académica
  autorizacionAcademica?: boolean; // True si Académica completó y autorizó el proyecto
  fechaAutorizacionAcademica?: string;
  responsableAcademico?: string;
  
  // Paso 2: Gerencia de Comercialización
  comercializacionCompletada?: boolean;
  autorizacionComercial?: boolean; // True si Comercialización completó venta y autorizó paso a GG
  fechaAutorizacionComercial?: string;
  responsableComercial?: string;
  fechaNotificacionComercial?: string;
  fechaNotificacionGeneral?: string;
  
  // Historial de cambios
  historialCambios?: HistorialCambioProyecto[];
  
  // Control de Correlativo Automático & Enlace Fiscal SAR
  numeroCorrelativo?: number; // Correlativo secuencial automático (1, 2, 3, ...)
  codigoFiscalSAR?: string; // Código de control fiscal SAR para ISV (ej. SAR-2026-001)

  // Tratamiento Fiscal ISV (SAR)
  servicioFiscal?: TipoServicioFiscal;
  aplicaISV?: boolean;
  tasaISV?: number; // 15 o 0
  isvPorAlumno?: number;
  precioSugeridoConISV?: number;
  isvVentaRequeridaTotal?: number;
  precioVentaRequeridoConISV?: number;
  isvTotalTrasladarSAR?: number;
  ingresoFacturadoTotal?: number;
  ingresoTotalConISV?: number;
  ingresoTotalNeto?: number;
  gananciaNetaPostImpuestos?: number;
  margenNetoPostImpuestos?: number;
  isrCorporativoTotal?: number;
  retencionDocenteTotal?: number;
  tasaMunicipalTotal?: number;

  // Gestión Curricular y Académica Avanzada (Sección, Horario, Días, Temario, Metodología & Planificación PDF)
  cantidadTemas?: number; // Cantidad total de temas / módulos
  horasClasePorTema?: number; // Horas clase por cada tema
  metodologia?: string; // Metodología pedagógica a implementar
  planificacionPdf?: {
    nombreArchivo: string;
    dataUrl: string; // Base64 del documento PDF
    tamanoKb?: number;
    fechaCarga?: string;
  };
  temasImpartir?: string; // Temas detallados a impartir en el curso/programa
  seccion?: string; // Ej: "Sección A", "Sec. 01", "Matutina-A", "Fin de Semana"
  horario?: string; // Ej: "06:00 PM - 08:00 PM", "08:00 AM - 12:00 PM", "19:00 - 21:00"
  diasClase?: string; // Ej: "Lunes a Jueves", "Sábados", "Lunes, Miércoles y Viernes", "Martes y Jueves"
  codigoPrograma?: string;
  horasTeoricas?: number;
  horasPracticas?: number;
  modalidad?: 'Virtual Sincrónica' | 'Presencial' | 'Híbrida' | 'Asincrónica LMS';
  plataformaLMS?: string;
  enlaceAulaVirtual?: string; // Enlace a Zoom, Google Classroom, Teams, Moodle
  idReunionVirtual?: string; // ID o clave de acceso de la reunión
  codigoAccesoVirtual?: string;
  
  // Recursos Didácticos y Entregables
  recursosDidacticos?: Array<{
    id: string;
    tipo: 'Presentación PPT/PDF' | 'Grabación de Clase' | 'Plantilla / Código' | 'Guía de Laboratorio' | 'Caso de Estudio';
    titulo: string;
    urlOArchivo?: string;
    estado: 'Disponible' | 'Pendiente';
    fecha?: string;
  }>;

  // Rúbrica de Evaluación & Criterios de Aprobación
  rubricaEvaluacion?: {
    proyectoFinalPct: number; // Ej. 40%
    talleresPracticosPct: number; // Ej. 35%
    participacionAsistenciaPct: number; // Ej. 15%
    examenFinalPct?: number; // Ej. 10%
    notaMinimaAprobacion: number; // Ej. 75 o 80 puntos sobre 100
    asistenciaMinimaPct: number; // Ej. 80%
  };

  // Matriz de Competencias, Perfil de Egreso y Prerrequisitos
  perfilEgreso?: string;
  prerrequisitos?: string;
  competenciasClave?: string[];

  // Certificación y Emisión de Diplomas
  tipoCertificacion?: 'Diploma de Aprobación' | 'Certificado de Participación' | 'Título Acreditado Universitario' | 'Certificación Profesional Internacional';
  horasCertificadas?: number;
  codigoValidacionCertificado?: string; // Ej. SUMMIT-CERT-2026-0814
  emisionCertificadosEstado?: 'No Emitidos' | 'En Proceso' | 'Emitidos y Entregados';

  // Control de Calidad Docente & Auditoría del Syllabus
  estadoSyllabus?: 'En Elaboración' | 'En Revisión Académica' | 'Aprobado por Dirección';
  observacionesAcademicas?: string;

  // Validación y Aseguramiento de Calidad Académica
  validacionCalidadAcademica?: {
    estadoGeneral: 'Aprobado' | 'En Revisión' | 'Pendiente' | 'Observado';
    porcentajeCalidad?: number;
    syllabusValidado: boolean;
    rubricaValidada: boolean;
    recursosValidados: boolean;
    docenteValidado: boolean;
    sesionesValidadas: boolean;
    requisitosValidados: boolean;
    validadorPor?: string;
    fechaValidacion?: string;
    observacionesCalidad?: string;
  };

  // Plan de Sesiones / Cronograma de Clases Detallado
  sesionesClase?: Array<{
    numeroSesion: number;
    fecha?: string;
    tema: string;
    modalidad?: 'Virtual' | 'Presencial';
    horas: number;
    entregable?: string;
    estado: 'Programada' | 'Impartida' | 'Reprogramada';
  }>;

  docenteEspecialidad?: string;
  docenteClasificacion?: 'Licenciatura' | 'Ingeniería' | 'Maestría' | 'Doctorado' | 'Posdoctorado' | 'Técnico';
  docenteTelefono?: string;
  docenteCorreo?: string;
  docenteEvaluacionNPS?: number; // 1.0 a 5.0
  docenteCvUrl?: string; // Enlace a CV o portafolio (LinkedIn, Google Drive, OneDrive, sitio web)
  docenteCvPdf?: {
    nombreArchivo: string;
    dataUrl: string; // Base64 o blob del documento PDF
    tamanoKb?: number;
    fechaCarga?: string;
  };
  docenteExpediente?: {
    universidadEgreso?: string;
    numeroColegiacion?: string;
    anosExperiencia?: number;
    resumenPerfil?: string;
    fechaActualizacion?: string;
  };
  temarioResumen?: string;
  convenioUniversitario?: string;
  cumpleAcreditacionSAR?: boolean;
  requisitosAcreditacionSAR?: {
    tieneConvenio: boolean;
    horasMinimas: boolean;
    evaluacionFormal: boolean;
    temarioAprobado: boolean;
  };
  fechaFin?: string;

  // 1. Libro de Calificaciones & Actas Académicas (Gradebook)
  actaCalificaciones?: {
    estadoActa: 'Abierta / En Curso' | 'Cerrada por Docente' | 'Aprobada por Dirección Académica';
    fechaCierre?: string;
    docenteFirma?: boolean;
    direccionFirma?: boolean;
    estudiantesNotas?: Array<{
      idEstudiante: string;
      nombreEstudiante: string;
      correo?: string;
      empresa?: string;
      notaTalleres: number; // base 100
      notaProyectoFinal: number;
      notaParticipacion: number;
      notaExamen: number;
      asistenciaPct: number;
      promedioFinal: number;
      estadoFinal: 'Aprobado con Distinción' | 'Aprobado' | 'En Recuperación' | 'Reprobado';
      observaciones?: string;
    }>;
  };

  // 2. Control de Asistencia & Alerta Temprana de Deserción
  controlAsistencia?: {
    sesionesRegistro?: Array<{
      numeroSesion: number;
      fecha: string;
      tema: string;
      registros: Array<{
        idEstudiante: string;
        nombreEstudiante: string;
        estado: 'Presente' | 'Tardanza' | 'Falta Justificada' | 'Falta Injustificada';
      }>;
    }>;
  };

  // 3. Evaluación de Calidad Docente & Encuestas de Satisfacción Académica (NPS Académico)
  evaluacionCalidadDocente?: {
    criterios?: {
      dominioTecnico: number; // 1 a 5
      claridadDidactica: number; // 1 a 5
      cumplimientoSyllabus: number; // 1 a 5
      puntualidad: number; // 1 a 5
      disponibilidadDudas: number; // 1 a 5
    };
    puntuacionPromedioDocente?: number; // 1.0 a 5.0
    npsDocentePct?: number; // %
    totalEvaluaciones?: number;
    comentariosEstudiantes?: Array<{
      id: string;
      estudiante: string;
      fecha: string;
      puntuacion: number;
      comentario: string;
      aspectoMejora?: string;
    }>;
  };

  // 4. Banco de Proyectos de Graduación & Casos de Éxito
  bancoProyectosGraduacion?: Array<{
    id: string;
    tituloProyecto: string;
    autores: string[];
    empresaAplicacion?: string;
    resumenEjecutivo: string;
    calificacionObtenida?: number;
    urlEntregableORepositorio?: string;
    destacadoComoCasoExito?: boolean;
    fechaAprobacion?: string;
  }>;

  // 5. Gestión de Convenios Universitarios & Avales Internacionales
  convenioInstitucionalDetalle?: {
    entidadCoCertificadora: string; // Ej. "Universidad Tecnológica Centroamericana (UNITEC)", "Cámara de Comercio", "Florida Global University"
    numeroResolucionOConvenio: string; // Ej. "RES-CSU-2026-894"
    tipoAval: 'Doble Titulación' | 'Aval Académico Oficial' | 'Créditos Universitarios Transferibles' | 'Certificación de Gremio Profesional';
    fechaVigenciaInicio?: string;
    fechaVigenciaFin?: string;
    selloInstitucionalUrl?: string;
    contactoResponsableConvenio?: string;
  };

  // 6. Control de Cupos, Aforo Máximo & Filtro de Prerrequisitos
  aforoYPrerrequisitos?: {
    aforoMaximo: number; // Ej. 25
    aforoMinimoRequerido: number; // Ej. 8
    inscritosConfirmados?: number;
    estadoAforo: 'Cupos Disponibles' | 'Casi Lleno' | 'Aforo Completo (Sold Out)' | 'En Lista de Espera';
    softwareRequerido?: string[]; // Ej. ['Excel Avanzado', 'Power BI Desktop', 'Python 3.11']
    experienciaPreviaRequerida?: string;
    nivelDificultad: 'Introductorio' | 'Intermedio' | 'Avanzado' | 'Experto / Ejecutivo';
    testDiagnosticoUrl?: string;
  };

  // =========================================================================
  // MÓDULOS AVANZADOS DE GERENCIA DE COMERCIALIZACIÓN
  // =========================================================================

  // 1. Ficha Comercial & One-Pager de Venta (Sales Enablement & Pitch Guide)
  fichaComercial?: {
    publicoObjetivo?: string;
    propuestaValor?: string;
    competenciasClave?: string[];
    perfilEgresado?: string;
    objecionesFrecuentes?: Array<{
      id: string;
      objecion: string;
      respuestaPitch: string;
    }>;
    diferenciadoresCompetencia?: string[];
    formatoImparticion?: string;
    duracionSemanas?: number;
    certificadoEmitido?: string;
    contactoAsesorLead?: string;
    telefonoWhatsAppLead?: string;
  };

  // 2. Propuestas Corporativas B2B & Capacitación In-Company
  propuestasCorporativasB2B?: Array<{
    id: string;
    empresaCliente: string;
    rtnOIdentificacion?: string;
    contactoNombre: string;
    contactoEmail: string;
    contactoTelefono?: string;
    cantidadColaboradores: number;
    modulosSeleccionados: string[];
    costoDocenteAjustado: number;
    margenB2BPct: number;
    precioTotalCotizado: number;
    precioPorColaborador: number;
    estado: 'Borrador' | 'Enviada' | 'Negociación' | 'Ganada / Aprobada' | 'Rechazada';
    fechaEmision: string;
    fechaValidez: string;
    notasNegociacion?: string;
    aplicaExencionISV: boolean;
  }>;

  // 3. Matriz de Políticas de Descuentos, Becas & Alerta de Margen
  politicasDescuentos?: {
    precioLista?: number;
    cuposPreventaEarlyBird?: number;
    descuentoEarlyBirdPct?: number;
    descuentoConvenioInstitucionalPct?: number;
    descuentoAlumniPct?: number;
    descuentoGrupalEmpresarialPct?: number;
    cuposBecaMerito?: number;
    descuentoBecaMeritoPct?: number;
    margenMinimoSeguridadPct?: number;
    cuponesEmitidos?: Array<{
      id: string;
      codigo: string;
      tipo: 'Early Bird' | 'Convenio' | 'Alumni' | 'Beca Mérito' | 'Grupal';
      porcentajeDescuento: number;
      beneficiario: string;
      utilizado: boolean;
      fechaUso?: string;
    }>;
  };

  // 4. CRM de Admisiones & Calificación de Prospectos (Pipeline por Cohorte)
  crmProspectosCohorte?: Array<{
    id: string;
    nombre: string;
    correo: string;
    telefono: string;
    empresa?: string;
    cargo?: string;
    etapa: 'Lead Nuevo' | 'Contactado' | 'Test Prerrequisitos' | 'Entrevista Admisión' | 'Matrícula Reservada' | 'Inscrito Oficial' | 'Descartado';
    origenLead: 'Meta Ads' | 'Google Search' | 'LinkedIn B2B' | 'Referido Alumni' | 'Convenio Institucional' | 'Web Orgánica';
    puntajeTestPrerrequisitos?: number;
    cumplePrerrequisitos: boolean;
    montoPagado: number;
    metodoPago?: 'Transferencia' | 'Tarjeta de Crédito / Enlace' | 'Depósito Bancario' | 'Convenio Empresa' | 'Pendiente';
    fechaRegistro: string;
    asesorAsignado?: string;
    notas?: string;
    traspasadoAAula: boolean;
  }>;

  // 5. Motor de Re-compra, Rutas de Carrera & Cross-Selling (LTV del Estudiante)
  rutasEspecializacionLTV?: {
    rutaSugeridaNombre?: string;
    programasSiguientes?: Array<{
      id: string;
      nombrePrograma: string;
      descuentoContinuidadPct: number;
      razonRecomendacion: string;
    }>;
    egresadosDistinguidosRecompra?: Array<{
      id: string;
      idEstudiante: string;
      nombre: string;
      notaFinalGradebook: number;
      programaOrigen: string;
      interesadoEnPrograma?: string;
      estadoContacto: 'Pendiente' | 'Contactado' | 'Matriculado' | 'No Interesado';
    }>;
    tasaRecompraHistoricaPct?: number;
  };

  // 6. Tablero de Rendimiento de Asesores Comerciales & Comisiones
  asesoresComercialesProyecto?: Array<{
    id: string;
    nombre: string;
    correo: string;
    metaInscritosMes: number;
    inscritosLogrados: number;
    totalFacturado: number;
    porcentajeComision: number;
    comisionCalculada: number;
    tasaConversionLeadAInscrito: number;
  }>;

  // Calificación del Curso & Encuesta de Satisfacción (Generada por Gerencia Comercial)
  calificacionCurso?: number; // Promedio de 1.0 a 5.0 o 1 a 10
  encuestaSatisfaccion?: {
    estado: 'No Generada' | 'Enviada a Estudiantes' | 'Respuestas Recibidas' | 'Finalizada';
    fechaEnvio?: string;
    enlaceEncuesta?: string;
    totalRespuestas?: number;
    calificacionPromedio?: number;
    metricaCSAT?: number; // 0% a 100%
    metricaNPS?: number; // -100 a +100
    comentariosEstudiantes?: Array<{
      id: string;
      estudiante: string;
      correo?: string;
      puntuacion: number; // 1 a 5
      comentario: string;
      fecha: string;
    }>;
  };

  // Gestión de Comercialización & Marketing Avanzada
  leadsGenerados?: number;
  prospectosCalificados?: number;
  cuposReservados?: number;
  gastoPublicidad?: number; // Presupuesto invertido en pauta/marketing (LPS)
  faseComercial?: 'Preventa Early Bird' | 'Venta Regular' | 'Cierre Final' | 'Venta Corporativa';
  precioEarlyBird?: number;
  descuentoPreventaPct?: number;
  metaVentaIngreso?: number;

  // Campos calculados
  costoDocenteCalculado: number;
  gastoTotalOperativo: number;
  precioVentaRequerido: number;
  gananciaOperativa: number;
  precioSugeridoAlumno: number;
  diferenciaAlumnos: number;
  gananciaAlumnosAdicionales: number;
  ingresoRealTotal: number;
  totalGananciasFinales: number;
  puntoEquilibrioAlumnos: number;
  roiPorcentaje: number;
}

export type Moneda = 'LPS' | 'USD' | 'EUR' | 'MXN';

export interface ConfiguracionMoneda {
  codigo: Moneda;
  simbolo: string;
  nombre: string;
  tasaCambioRespectoLPS: number; // 1 para LPS, 0.040 para USD aprox
}

export interface ResumenMensual {
  mesKey: string; // '2026-08'
  anio: number;
  mesNumero: number;
  etiquetaMes: string; // 'Agosto 2026'
  etiquetaCorta: string; // 'Ago 26'
  totalProyectos: number;
  proyectosRealizados: number;
  proyectosEnCurso: number;
  proyectosCancelados: number;
  gastoTotalOperativo: number;
  ingresoRealTotal: number;
  totalGananciasFinales: number;
  alumnosProyectados: number;
  alumnosReales: number;
  diferenciaAlumnosTotal: number;
  tasaCumplimientoAlumnos: number; // %
  margenRealPromedio: number; // %
  roiPromedio: number; // %
  precioTicketPromedio: number;
  proyectos: ProyectoEducativo[];
}

export interface ComparativaDosMeses {
  mesBase: ResumenMensual;
  mesComparado: ResumenMensual;
  deltaIngresos: number;
  deltaIngresosPct: number;
  deltaGastos: number;
  deltaGastosPct: number;
  deltaGanancias: number;
  deltaGananciasPct: number;
  deltaAlumnos: number;
  deltaAlumnosPct: number;
  deltaProyectos: number;
  deltaROI: number;
}

export type PrioridadAccionCorrectiva = 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA';
export type EstadoAccionCorrectiva = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADA' | 'VENCIDA';
export type GerenciaResponsable = 'Académica' | 'Comercial' | 'General';

export interface TareaAccionCorrectiva {
  id: string;
  alertaOrigenId?: string;
  titulo: string;
  descripcion: string;
  gerencia: GerenciaResponsable;
  gerenciaKey: 'ACADEMICA' | 'COMERCIAL' | 'GENERAL';
  responsableNombre: string;
  responsableCargo: string;
  fechaLimite: string; // Formato YYYY-MM-DD
  fechaCreacion: string; // Formato YYYY-MM-DD
  prioridad: PrioridadAccionCorrectiva;
  estado: EstadoAccionCorrectiva;
  kpiVinculado?: string;
  proyectosAfectados?: Array<{ id?: string; nombre: string; detalle?: string }>;
  avancePorcentaje: number; // 0 a 100
  notasSeguimiento?: string;
  fechaCompletada?: string;
}

export type EstadoCierreMensual = 'ABIERTO' | 'CERRADO_AUDITADO' | 'EN_REVISION';
export type DictamenCierreMensual = 'SOBRESALIENTE' | 'CUMPLIDO_POA' | 'BREAK_EVEN_MINIMO' | 'DEFICIT_CRITICO';

export interface ChecklistCierreMensual {
  alumnosConciliados: boolean;
  docentesHonorariosPagados: boolean;
  marketingConciliado: boolean;
  fiscalidadSARRevisada: boolean;
  actaDirectivaFirmada: boolean;
}

export interface RegistroCierreMensual {
  mesKey: string; // Formato 'YYYY-MM', ej: '2026-08'
  anio: number;
  mesNumero: number;
  etiquetaMes: string;
  estado: EstadoCierreMensual;
  fechaCierre?: string; // ISO string
  cerradoPor?: string;
  cargoCerrador?: string;
  
  // Metas POA 2027
  metaProyectosPOA: number; // Por defecto 10
  breakEvenProyectosPOA: number; // Por defecto 4
  proyectosRegistrados: number;
  proyectosCompletados: number;
  proyectosEnCurso: number;
  proyectosCancelados: number;
  
  // Financiero
  ingresoMetaPOAHNL: number;
  ingresoRealHNL: number;
  gastoRealHNL: number;
  superavitNetoHNL: number;
  margenOperativoReal: number; // %
  alumnosReales: number;
  alumnosProyectados: number;
  
  // Diagnóstico / Dictamen
  dictamen: DictamenCierreMensual;
  alertaDeficit: boolean;
  alertaMargenBajo: boolean;
  alertaMetaProyectos: boolean;
  alertas: string[];
  
  // Checklist de Control
  checklist: ChecklistCierreMensual;
  observaciones?: string;
  planAccionSiguienteMes?: string;
  
  historial?: Array<{
    fecha: string;
    accion: string;
    usuario: string;
    detalle?: string;
  }>;
}

export interface AlertaCierreMensual {
  id: string;
  mesKey: string;
  etiquetaMes: string;
  nivel: 'CRITICA' | 'PREVENTIVA' | 'INFORMATIVA';
  titulo: string;
  mensaje: string;
  accionSugerida: string;
}

