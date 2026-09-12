/**
 * SERVICIO DE INTEGRACIÓN CON GOOGLE SHEETS API v4
 * Summit Impulsa Global, S.A. de C.V.
 *
 * Permite exportar proyectos individuales y el consolidado del POA SEP - DIC 2026
 * directamente a Google Sheets en tiempo real, vinculando la trazabilidad de las 3 gerencias:
 * 1. Académica (Estructura y Docente)
 * 2. Comercial (Venta y Matrícula)
 * 3. General (Revisión, Aprobación y Rebaja del POA 2026)
 */

import { ProyectoEducativo, Moneda } from '../types';
import { formatearMoneda } from '../utils/calculations';
import { formatearHNL, POA_2026_DATOS } from '../utils/poa2026Data';
import { calcularSeguimientoMensualPOA } from '../utils/poaMonthlyTrackingUtils';
import { 
  getDriveAccessToken, 
  signInWithGoogleDrive, 
  setDriveAccessToken, 
  TARGET_DRIVE_FOLDER_ID 
} from './googleDriveService';

export interface ResultadoExportacionSheets {
  success: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  titulo?: string;
  error?: string;
}

/**
 * Obtiene el token de acceso válido de Google OAuth2
 */
async function obtenerTokenValido(): Promise<string> {
  let token = getDriveAccessToken();
  if (!token) {
    const authResult = await signInWithGoogleDrive();
    token = authResult.accessToken;
    setDriveAccessToken(token);
  }
  if (!token) {
    throw new Error('No se pudo obtener el token de autorización OAuth2 de Google.');
  }
  return token;
}

/**
 * Mueve un archivo recién creado en Google Drive a la carpeta institucional designada
 */
async function moverAFolderInstitucional(fileId: string, token: string): Promise<void> {
  try {
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${TARGET_DRIVE_FOLDER_ID}&fields=id,parents`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (err) {
    console.warn('Aviso: No se pudo mover a la carpeta destino de Drive:', err);
  }
}

/**
 * 1. EXPORTAR UN PROYECTO EDUCATIVO INDIVIDUAL A GOOGLE SHEETS
 * Incluye la auditoría del flujo: Académica -> Comercial -> General (Rebaja POA)
 */
export async function exportarProyectoAGoogleSheets(
  proyecto: ProyectoEducativo,
  moneda: Moneda = 'LPS'
): Promise<ResultadoExportacionSheets> {
  try {
    const token = await obtenerTokenValido();
    const codigoPry = proyecto.codigoFiscalSAR || proyecto.codigoPrograma || `PRY-${proyecto.id.slice(0, 8)}`;
    const titulo = `[POA 2026] ${codigoPry} - ${proyecto.nombreProyecto}`;

    // Paso 1: Crear la hoja de cálculo
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: titulo,
        },
        sheets: [
          { properties: { title: 'Ficha Ejecutiva & Flujo' } },
          { properties: { title: 'Estructura Curricular' } },
          { properties: { title: 'Comercial & Matrícula' } },
          { properties: { title: 'Finanzas & Deducción POA' } },
        ],
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Error HTTP ${createRes.status} al crear Google Sheet`);
    }

    const sheetData = await createRes.json();
    const spreadsheetId = sheetData.spreadsheetId;
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    // Mover a la carpeta de Google Drive
    await moverAFolderInstitucional(spreadsheetId, token);

    // Preparar contenido para cada pestaña
    const utilidadTotal = proyecto.totalGananciasFinales ?? ((proyecto.ingresoRealTotal || 0) - (proyecto.gastoTotalOperativo || 0));
    const costoOperativo = (proyecto.gastoTotalOperativo || 0) + (proyecto.costoDocenteCalculado || 0);

    // Datos Ficha Ejecutiva
    const dataFichaEjecutiva = [
      ['SUMMIT IMPULSA GLOBAL, S.A. DE C.V.'],
      ['FICHA OFICIAL DE PROYECTO EDUCATIVO - POA SEP - DIC 2026'],
      ['Fecha de Generación:', new Date().toLocaleString('es-HN')],
      [],
      ['PARÁMETRO', 'VALOR INSTITUCIONAL', 'ESTADO / DETALLE'],
      ['Código Programa:', codigoPry, 'Correlativo: ' + (proyecto.numeroCorrelativo || 'N/A')],
      ['Nombre del Proyecto:', proyecto.nombreProyecto, 'Modalidad: ' + (proyecto.modalidad || 'Virtual')],
      ['Sección / Grupo:', proyecto.seccion || 'Sección A', 'Horario: ' + (proyecto.horario || 'N/A')],
      ['Fecha Programada:', proyecto.fechaProgramacion || 'Por definir', 'Días: ' + (proyecto.diasClase || 'N/A')],
      [],
      ['--- FLUJO INTER-GERENCIAL SECUENCIAL ---', '', ''],
      [
        'Paso 1: Gerencia Académica',
        proyecto.autorizacionAcademica ? 'AUTORIZADO / COMPLETADO' : 'EN ELABORACIÓN',
        proyecto.responsableAcademico || 'MSc. Elena Rostrán'
      ],
      [
        'Paso 2: Gerencia Comercial',
        proyecto.autorizacionComercial ? 'AUTORIZADO PARA DICTAMEN' : 'EN MATRÍCULA Y VENTA',
        proyecto.responsableComercial || 'Lic. Carlos Mendoza'
      ],
      [
        'Paso 3: Gerencia General',
        proyecto.aprobacionFinalGerenciaGeneral ? 'APROBADO FORMALMENTE' : 'PENDIENTE DE APROBACIÓN',
        proyecto.aprobadoPorGerenciaGeneral || 'Dr. Walter Pedroza'
      ],
      [
        'Deducción del POA 2026:',
        proyecto.aprobacionFinalGerenciaGeneral ? 'REBAJADO DEL MES DE FACTURACIÓN' : 'NO REBAJADO AÚN',
        proyecto.montoFacturacionAprobadaHNL ? formatearHNL(proyecto.montoFacturacionAprobadaHNL) : 'Pendiente'
      ],
      [],
      ['MÉTRICAS CLAVE', 'CANTIDAD', 'OBSERVACIÓN'],
      ['Alumnos Proyectados:', proyecto.alumnosProyectados || 0, 'Meta base'],
      ['Alumnos Matriculados:', proyecto.alumnosFinal || 0, 'Punto de equilibrio: ' + (proyecto.puntoEquilibrioAlumnos || 0)],
      ['Ingreso Total Estimado:', formatearMoneda(proyecto.ingresoRealTotal || 0, moneda), 'Facturación esperada'],
      ['Costo Directo Operativo:', formatearMoneda(costoOperativo, moneda), 'Docencia + Operación'],
      ['Utilidad Operativa:', formatearMoneda(utilidadTotal, moneda), 'Margen: ' + (proyecto.margenGananciaOperativa || 0) + '%'],
    ];

    // Datos Estructura Curricular
    const dataEstructuraCurricular = [
      ['DISEÑO CURRICULAR Y CUERPO DOCENTE - GERENCIA ACADÉMICA'],
      ['Proyecto:', proyecto.nombreProyecto],
      [],
      ['Campo Curricular', 'Detalle'],
      ['Docente Asignado:', proyecto.nombreDocente],
      ['Grado Académico:', proyecto.docenteClasificacion || 'Licenciatura'],
      ['Correo Docente:', proyecto.docenteCorreo || 'No especificado'],
      ['Teléfono Docente:', proyecto.docenteTelefono || 'No especificado'],
      ['Horas Totales del Curso:', (proyecto.horasClase || 0) + ' horas'],
      ['Cantidad de Temas:', proyecto.cantidadTemas || 4],
      ['Horas por Tema:', proyecto.horasClasePorTema || 3],
      ['Metodología Pedagógica:', proyecto.metodologia || 'Aprendizaje Basado en Proyectos (ABP)'],
      ['Objetivo General:', proyecto.objetivoGeneral || 'Capacitación integral especializada'],
      ['Temario General:', proyecto.temasImpartir || 'Contenido curricular estándar'],
    ];

    // Datos Comercial & Matrícula
    const prospectosCRM = proyecto.crmProspectosCohorte || [];
    const dataComercial = [
      ['GESTIÓN COMERCIAL, DISTRIBUCIÓN Y ADMISIONES - GERENCIA COMERCIAL'],
      ['Proyecto:', proyecto.nombreProyecto],
      [],
      ['Parámetro Comercial', 'Valor'],
      ['Canal de Venta Principal:', proyecto.metodoVenta || 'Redes sociales'],
      ['Precio Regular por Alumno:', formatearMoneda(proyecto.precioSugeridoAlumno || 0, moneda)],
      ['Precio Preventa Early Bird:', formatearMoneda(proyecto.precioEarlyBird || 0, moneda)],
      ['Descuento Preventa (%):', (proyecto.descuentoPreventaPct || 0) + '%'],
      ['Leads Generados:', proyecto.leadsGenerados || prospectosCRM.length],
      ['Prospectos Calificados:', proyecto.prospectosCalificados || 0],
      ['Cupos Reservados:', proyecto.cuposReservados || 0],
      ['Alumnos Pagados / Confirmados:', proyecto.alumnosFinal || 0],
      [],
      ['LISTA DE ESTUDIANTES Y PROSPECTOS EN CRM'],
      ['#', 'Nombre Estudiante', 'Correo', 'Teléfono', 'Empresa', 'Etapa CRM', 'Monto Pagado', 'Traspasado a Aula'],
      ...prospectosCRM.map((lead, idx) => [
        idx + 1,
        lead.nombre,
        lead.correo,
        lead.telefono || '',
        lead.empresa || 'Individual',
        lead.etapa,
        formatearMoneda(lead.montoPagado || 0, moneda),
        lead.traspasadoAAula ? 'SÍ' : 'NO'
      ]),
    ];

    // Datos Finanzas & POA
    const dataFinanzas = [
      ['ANÁLISIS FINANCIERO Y CONTROL DE DEDUCCIÓN POA SEP - DIC 2026'],
      ['Proyecto:', proyecto.nombreProyecto],
      [],
      ['Concepto Financiero', 'Monto (' + moneda + ')', 'Notas'],
      ['Ingreso Real Total:', formatearMoneda(proyecto.ingresoRealTotal || 0, moneda), 'Alumnos matriculados x precio'],
      ['Gasto Total Operativo:', formatearMoneda(proyecto.gastoTotalOperativo || 0, moneda), 'Incluye Zoom, papelería y varios'],
      ['Costo Docente Calculado:', formatearMoneda(proyecto.costoDocenteCalculado || 0, moneda), 'Horas x tarifa docente'],
      ['Ganancia Neta Final:', formatearMoneda(utilidadTotal, moneda), 'Utilidad institucional'],
      ['Punto de Equilibrio:', (proyecto.puntoEquilibrioAlumnos || 0) + ' alumnos', 'Mínimo para no perder'],
      ['Margen Operativo (%):', (proyecto.margenGananciaOperativa || 0) + '%', 'Retorno sobre venta'],
      ['Aplica ISV (15%):', proyecto.aplicaISV ? 'SÍ' : 'EXENTO', proyecto.servicioFiscal || 'Servicio educativo'],
      [],
      ['CONTROL DIRECTIVO DE DEDUCCIÓN DEL POA 2026'],
      ['Meta Anual POA 2026:', formatearHNL(POA_2026_DATOS.resumen.ingresosProyectados), '74 grupos cuatrimestre'],
      ['Estado Dictamen Gerencia General:', proyecto.aprobacionFinalGerenciaGeneral ? 'APROBADO' : 'PENDIENTE'],
      ['Monto Facturación Rebajado:', proyecto.aprobacionFinalGerenciaGeneral ? formatearHNL(proyecto.montoFacturacionAprobadaHNL || 0) : 'L. 0.00'],
      ['Fecha Autorización GG:', proyecto.fechaAprobacionGerenciaGeneral || 'Pendiente'],
      ['Responsable Aprobación:', proyecto.aprobadoPorGerenciaGeneral || 'Dr. Walter Pedroza'],
    ];

    // Paso 2: Enviar los datos en lote a las 4 pestañas
    const updateRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: [
            { range: "'Ficha Ejecutiva & Flujo'!A1", values: dataFichaEjecutiva },
            { range: "'Estructura Curricular'!A1", values: dataEstructuraCurricular },
            { range: "'Comercial & Matrícula'!A1", values: dataComercial },
            { range: "'Finanzas & Deducción POA'!A1", values: dataFinanzas },
          ],
        }),
      }
    );

    if (!updateRes.ok) {
      const err = await updateRes.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Error al escribir datos en Google Sheets');
    }

    return {
      success: true,
      spreadsheetId,
      spreadsheetUrl,
      titulo,
    };
  } catch (error: any) {
    console.error('Error al exportar a Google Sheets:', error);
    return {
      success: false,
      error: error?.message || 'Error desconocido al interactuar con Google Sheets API.',
    };
  }
}

/**
 * 2. EXPORTAR CONSOLIDADO MULTI-GERENCIAL POA SEP - DIC 2026 A GOOGLE SHEETS
 * Incluye la matriz general de todos los proyectos y el control de deducciones mensuales
 */
export async function exportarConsolidadoPOAApi(
  proyectos: ProyectoEducativo[],
  moneda: Moneda = 'LPS'
): Promise<ResultadoExportacionSheets> {
  try {
    const token = await obtenerTokenValido();
    const titulo = `POA SEP - DIC 2026 Consolidado Multi-Gerencial - Summit Impulsa Global`;

    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: titulo,
        },
        sheets: [
          { properties: { title: 'Control Deducción POA 2026' } },
          { properties: { title: 'Matriz General de Proyectos' } },
          { properties: { title: 'Resumen Flujo de 3 Gerencias' } },
        ],
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Error HTTP ${createRes.status} al crear consolidado en Sheets`);
    }

    const sheetData = await createRes.json();
    const spreadsheetId = sheetData.spreadsheetId;
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    await moverAFolderInstitucional(spreadsheetId, token);

    // Obtener resumen del POA 2026
    const resumenPOA = calcularSeguimientoMensualPOA(proyectos, moneda);

    // Pestaña 1: Control Deducción POA 2026
    const dataControlPOA = [
      ['SUMMIT IMPULSA GLOBAL, S.A. DE C.V.'],
      ['TABLERO OFICIAL DE CONTROL Y DEDUCCIÓN MENSUAL POA SEP - DIC 2026'],
      ['Meta Anual Planificada:', formatearHNL(resumenPOA.metaAnualPOAHNL), 'Cuatrimestre 2026'],
      ['Total Facturación Aprobada por Gerencia General:', formatearHNL(resumenPOA.totalAprobadoGGHNL), 'Monto formalmente deducido'],
      ['Saldo Restante por Facturar:', formatearHNL(resumenPOA.saldoRestanteAnualHNL), 'Brecha cuatrimestral'],
      ['% Cumplimiento Aprobado:', resumenPOA.porcentajeCumplimientoAnualAprobado.toFixed(1) + '%'],
      [],
      ['SEGUIMIENTO MENSUAL DE DEDUCCIÓN POR GERENCIA GENERAL'],
      [
        'Mes Cuatrimestre',
        'Meta Planificada (HNL)',
        'Total Facturado (HNL)',
        'Deducción Aprobada GG (HNL)',
        'Saldo Restante (HNL)',
        '% Cumplimiento',
        'Estado'
      ],
      ...resumenPOA.meses.map((m) => [
        m.etiquetaMes,
        formatearHNL(m.metaFacturacionPOAHNL),
        formatearHNL(m.facturacionTotalMesHNL),
        formatearHNL(m.facturacionAprobadaGGHNL),
        formatearHNL(m.saldoRestantePOAHNL),
        m.porcentajeCumplimientoAprobado.toFixed(1) + '%',
        m.estadoCumplimiento
      ]),
    ];

    // Pestaña 2: Matriz General de Proyectos
    const dataMatriz = [
      ['MATRIZ INTEGRAL DE PROYECTOS EDUCATIVOS - POA SEP - DIC 2026'],
      ['Generado el:', new Date().toLocaleString('es-HN')],
      [],
      [
        '#',
        'Código SAR / Prog',
        'Nombre del Proyecto',
        'Docente Asignado',
        'Modalidad',
        'Horas',
        'Alumnos Proy',
        'Alumnos Matriculados',
        'Punto Equilibrio',
        'Precio Alumno (' + moneda + ')',
        'Costo Directo (' + moneda + ')',
        'Ingreso Real (' + moneda + ')',
        'Utilidad Final (' + moneda + ')',
        'Margen %',
        'Fase Académica',
        'Fase Comercial',
        'Dictamen Gerencia General',
        'Rebajado del POA 2026'
      ],
      ...proyectos.map((p, i) => {
        const util = p.totalGananciasFinales ?? ((p.ingresoRealTotal || 0) - (p.gastoTotalOperativo || 0));
        const costo = (p.gastoTotalOperativo || 0) + (p.costoDocenteCalculado || 0);
        return [
          i + 1,
          p.codigoFiscalSAR || p.codigoPrograma || p.id,
          p.nombreProyecto,
          p.nombreDocente,
          p.modalidad || 'Virtual',
          p.horasClase || 0,
          p.alumnosProyectados || 0,
          p.alumnosFinal || 0,
          p.puntoEquilibrioAlumnos || 0,
          p.precioSugeridoAlumno || 0,
          costo,
          p.ingresoRealTotal || 0,
          util,
          (p.margenGananciaOperativa || 0) + '%',
          p.autorizacionAcademica ? 'AUTORIZADO' : 'PENDIENTE',
          p.autorizacionComercial ? 'AUTORIZADO' : 'PENDIENTE',
          p.aprobacionFinalGerenciaGeneral ? 'APROBADO' : 'PENDIENTE',
          p.aprobacionFinalGerenciaGeneral ? 'SÍ (REBAJADO)' : 'NO'
        ];
      }),
    ];

    // Pestaña 3: Resumen Flujo
    const dataFlujo = [
      ['CONTROL DEL FLUJO SECUENCIAL INTER-GERENCIAL'],
      ['Lógica de Negocio Institucional:'],
      ['1. Gerencia Académica: Crea el proyecto y toda su estructura curricular -> Al guardar, pasa a Gerencia Comercial.'],
      ['2. Gerencia Comercial: Gestiona la venta, distribución y matrícula -> Al autorizar, pasa a Gerencia General.'],
      ['3. Gerencia General: Revisa y aprueba formalmente -> Al autorizar, se rebaja automáticamente del POA 2026.'],
      [],
      ['Total de Proyectos en Cartera:', proyectos.length],
      ['En Elaboración Académica:', proyectos.filter(p => !p.autorizacionAcademica).length],
      ['En Comercialización / Matrícula:', proyectos.filter(p => p.autorizacionAcademica && !p.autorizacionComercial).length],
      ['En Revisión Gerencia General:', proyectos.filter(p => p.autorizacionComercial && !p.aprobacionFinalGerenciaGeneral).length],
      ['Aprobados y Rebajados del POA 2026:', proyectos.filter(p => p.aprobacionFinalGerenciaGeneral).length],
    ];

    // Enviar datos
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: [
            { range: "'Control Deducción POA 2026'!A1", values: dataControlPOA },
            { range: "'Matriz General de Proyectos'!A1", values: dataMatriz },
            { range: "'Resumen Flujo de 3 Gerencias'!A1", values: dataFlujo },
          ],
        }),
      }
    );

    return {
      success: true,
      spreadsheetId,
      spreadsheetUrl,
      titulo,
    };
  } catch (error: any) {
    console.error('Error al exportar consolidado a Google Sheets:', error);
    return {
      success: false,
      error: error?.message || 'Error al exportar consolidado a Google Sheets.',
    };
  }
}
