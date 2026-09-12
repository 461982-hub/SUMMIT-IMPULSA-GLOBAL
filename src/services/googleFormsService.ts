/**
 * SERVICIO GOOGLE FORMS API v1
 * SUMMIT IMPULSA GLOBAL, S.A. DE C.V.
 *
 * Permite crear, gestionar y leer respuestas de Formularios oficiales de Google Forms:
 * 1. Formulario de Pre-Matrícula e Inscripción de Estudiantes (Gerencia Comercial)
 * 2. Encuesta de Satisfacción Estudiantil & Evaluación Docente (Gerencia Académica)
 * 3. Diagnóstico de Necesidades de Capacitación Empresarial (B2B / Comercial)
 * 4. Auditoría de Calidad y Cumplimiento Curricular (Auditoría Interna)
 */

import { ProyectoEducativo } from '../types';
import { getDriveAccessToken, signInWithGoogleDrive, TARGET_DRIVE_FOLDER_ID } from './googleDriveService';

export type TipoFormularioGoogle = 
  | 'inscripcion_estudiantes'
  | 'evaluacion_docente'
  | 'diagnostico_empresarial'
  | 'auditoria_calidad';

export interface FormularioGoogleInfo {
  id: string;
  formId: string;
  titulo: string;
  descripcion: string;
  tipo: TipoFormularioGoogle;
  proyectoId?: string;
  proyectoNombre?: string;
  responderUri: string; // Enlace público para que los alumnos o clientes respondan
  editUri: string;      // Enlace para editar en Google Forms
  creadoEn: string;
  totalRespuestas: number;
  promedioSatisfaccion?: number;
  driveFolderId?: string;
}

export interface RespuestaFormularioGoogle {
  responseId: string;
  createTime: string;
  lastSubmittedTime: string;
  respondentEmail?: string;
  answers?: Record<string, {
    questionId: string;
    textAnswers?: {
      answers: { value: string }[];
    };
  }>;
}

const STORAGE_KEY_FORMS = 'summit_google_forms_list';

/**
 * Plantillas de preguntas según el tipo de formulario
 */
export function obtenerEstructuraPreguntasFormulario(
  tipo: TipoFormularioGoogle, 
  proyecto?: ProyectoEducativo
): { titulo: string; descripcion: string; requests: any[] } {
  const nombreProyecto = proyecto?.nombreProyecto || 'Programa Educativo Summit';
  const nombreDocente = proyecto?.nombreDocente || 'Docente Titular';

  switch (tipo) {
    case 'inscripcion_estudiantes':
      return {
        titulo: `Pre-Matrícula e Inscripción: ${nombreProyecto}`,
        descripcion: `Formulario oficial de inscripción y registro estudiantil para el programa ${nombreProyecto}. Summit Impulsa Global, S.A. de C.V.`,
        requests: [
          {
            createItem: {
              item: {
                title: 'Nombre Completo del Estudiante',
                description: 'Tal como desea que figure en su certificado oficial de aprobación.',
                questionItem: {
                  question: {
                    required: true,
                    textQuestion: { paragraph: false },
                  },
                },
              },
              location: { index: 0 },
            },
          },
          {
            createItem: {
              item: {
                title: 'Número de Identidad (DNI / Pasaporte)',
                description: 'Documento nacional de identificación para el registro académico.',
                questionItem: {
                  question: {
                    required: true,
                    textQuestion: { paragraph: false },
                  },
                },
              },
              location: { index: 1 },
            },
          },
          {
            createItem: {
              item: {
                title: 'Correo Electrónico de Contacto',
                description: 'Para el envío de accesos al aula virtual y material didáctico.',
                questionItem: {
                  question: {
                    required: true,
                    textQuestion: { paragraph: false },
                  },
                },
              },
              location: { index: 2 },
            },
          },
          {
            createItem: {
              item: {
                title: 'Número de WhatsApp / Teléfono Móvil',
                questionItem: {
                  question: {
                    required: true,
                    textQuestion: { paragraph: false },
                  },
                },
              },
              location: { index: 3 },
            },
          },
          {
            createItem: {
              item: {
                title: 'Modalidad de Pago Preferida',
                questionItem: {
                  question: {
                    required: true,
                    choiceQuestion: {
                      type: 'RADIO',
                      options: [
                        { value: 'Transferencia Bancaria / Depósito' },
                        { value: 'Patrocinio Empresarial / Orden de Compra' },
                      ],
                    },
                  },
                },
              },
              location: { index: 4 },
            },
          },
          {
            createItem: {
              item: {
                title: '¿Cuáles son sus principales objetivos o expectativas al cursar este programa?',
                questionItem: {
                  question: {
                    required: false,
                    textQuestion: { paragraph: true },
                  },
                },
              },
              location: { index: 5 },
            },
          },
        ],
      };

    case 'evaluacion_docente':
      return {
        titulo: `Encuesta de Satisfacción & Evaluación Docente: ${nombreProyecto}`,
        descripcion: `Evaluación académica del programa ${nombreProyecto}. Docente: ${nombreDocente}. Sus respuestas son anónimas y contribuyen a la excelencia institucional de Summit Impulsa Global.`,
        requests: [
          {
            createItem: {
              item: {
                title: `1. Dominio y claridad temática del docente (${nombreDocente})`,
                description: '1 = Muy insatisfactorio, 5 = Excelente dominio pedagógico.',
                questionItem: {
                  question: {
                    required: true,
                    scaleQuestion: {
                      low: 1,
                      high: 5,
                      lowLabel: 'Deficiente',
                      highLabel: 'Excelente',
                    },
                  },
                },
              },
              location: { index: 0 },
            },
          },
          {
            createItem: {
              item: {
                title: '2. Calidad y aplicabilidad práctica del material didáctico y casos de estudio',
                questionItem: {
                  question: {
                    required: true,
                    scaleQuestion: {
                      low: 1,
                      high: 5,
                      lowLabel: 'Poco aplicable',
                      highLabel: 'Altamente aplicable',
                    },
                  },
                },
              },
              location: { index: 1 },
            },
          },
          {
            createItem: {
              item: {
                title: '3. Cumplimiento de horarios, puntualidad y asistencia en sesiones',
                questionItem: {
                  question: {
                    required: true,
                    scaleQuestion: {
                      low: 1,
                      high: 5,
                      lowLabel: 'No puntual',
                      highLabel: 'Siempre puntual',
                    },
                  },
                },
              },
              location: { index: 2 },
            },
          },
          {
            createItem: {
              item: {
                title: '4. Satisfacción general con el programa educativo',
                questionItem: {
                  question: {
                    required: true,
                    scaleQuestion: {
                      low: 1,
                      high: 5,
                      lowLabel: 'Insatisfecho',
                      highLabel: 'Muy Satisfecho',
                    },
                  },
                },
              },
              location: { index: 3 },
            },
          },
          {
            createItem: {
              item: {
                title: '¿Recomendaría este programa de Summit Impulsa a colegas o profesionales?',
                questionItem: {
                  question: {
                    required: true,
                    choiceQuestion: {
                      type: 'RADIO',
                      options: [
                        { value: 'Definitivamente sí' },
                        { value: 'Probablemente sí' },
                        { value: 'Tal vez' },
                        { value: 'No lo recomendaría' },
                      ],
                    },
                  },
                },
              },
              location: { index: 4 },
            },
          },
          {
            createItem: {
              item: {
                title: 'Comentarios, elogios o sugerencias de mejora:',
                questionItem: {
                  question: {
                    required: false,
                    textQuestion: { paragraph: true },
                  },
                },
              },
              location: { index: 5 },
            },
          },
        ],
      };

    case 'diagnostico_empresarial':
      return {
        titulo: 'Diagnóstico de Necesidades de Capacitación Corporativa (DNC)',
        descripcion: 'Levantamiento de requerimientos de formación y adiestramiento ejecutivo in-company. Summit Impulsa Global, S.A. de C.V.',
        requests: [
          {
            createItem: {
              item: {
                title: 'Razón Social de la Empresa / Institución',
                questionItem: {
                  question: {
                    required: true,
                    textQuestion: { paragraph: false },
                  },
                },
              },
              location: { index: 0 },
            },
          },
          {
            createItem: {
              item: {
                title: 'Área o Departamento que Requiere Formación',
                questionItem: {
                  question: {
                    required: true,
                    textQuestion: { paragraph: false },
                  },
                },
              },
              location: { index: 1 },
            },
          },
          {
            createItem: {
              item: {
                title: 'Número Estimado de Colaboradores a Capacitar',
                questionItem: {
                  question: {
                    required: true,
                    choiceQuestion: {
                      type: 'RADIO',
                      options: [
                        { value: '1 a 10 colaboradores' },
                        { value: '11 a 25 colaboradores' },
                        { value: '26 a 50 colaboradores' },
                        { value: 'Más de 50 colaboradores' },
                      ],
                    },
                  },
                },
              },
              location: { index: 2 },
            },
          },
          {
            createItem: {
              item: {
                title: 'Modalidad requerida',
                questionItem: {
                  question: {
                    required: true,
                    choiceQuestion: {
                      type: 'CHECKBOX',
                      options: [
                        { value: 'Virtual sincrónica (vía Zoom / Teams)' },
                        { value: 'Presencial in-company en instalaciones del cliente' },
                        { value: 'Híbrida' },
                        { value: 'Asincrónica auto-gestionada' },
                      ],
                    },
                  },
                },
              },
              location: { index: 3 },
            },
          },
        ],
      };

    case 'auditoria_calidad':
    default:
      return {
        titulo: `Auditoría de Calidad y Verificación Curricular: ${nombreProyecto}`,
        descripcion: 'Formulario de control de calidad, cumplimiento de contenidos programáticos y revisión de estándares normativos.',
        requests: [
          {
            createItem: {
              item: {
                title: 'Verificación del sílabo y plan de clases aprobado',
                questionItem: {
                  question: {
                    required: true,
                    choiceQuestion: {
                      type: 'RADIO',
                      options: [
                        { value: 'Cumple al 100% con los estándares institucionales' },
                        { value: 'Cumple parcialmente (requiere ajustes menores)' },
                        { value: 'No cumple (requiere reformulación)' },
                      ],
                    },
                  },
                },
              },
              location: { index: 0 },
            },
          },
          {
            createItem: {
              item: {
                title: 'Calificación de la pertinencia del perfil del docente',
                questionItem: {
                  question: {
                    required: true,
                    scaleQuestion: {
                      low: 1,
                      high: 5,
                      lowLabel: 'No idóneo',
                      highLabel: 'Totalmente idóneo',
                    },
                  },
                },
              },
              location: { index: 1 },
            },
          },
          {
            createItem: {
              item: {
                title: 'Dictamen de Auditoría Interna y Recomendaciones',
                questionItem: {
                  question: {
                    required: true,
                    textQuestion: { paragraph: true },
                  },
                },
              },
              location: { index: 2 },
            },
          },
        ],
      };
  }
}

/**
 * Crea un formulario oficial en Google Forms utilizando la API v1 de Google Forms
 * Endpoint: POST https://forms.googleapis.com/v1/forms
 */
export async function crearFormularioGoogle(
  tipo: TipoFormularioGoogle,
  proyecto?: ProyectoEducativo,
  token?: string | null
): Promise<FormularioGoogleInfo> {
  let authToken = token || getDriveAccessToken();

  if (!authToken) {
    try {
      const authResult = await signInWithGoogleDrive();
      authToken = authResult.accessToken;
    } catch (e) {
      console.warn('Google Forms: Autenticación OAuth requerida:', e);
      throw new Error('Debe iniciar sesión con Google para crear formularios en Google Forms.');
    }
  }

  const estructura = obtenerEstructuraPreguntasFormulario(tipo, proyecto);

  // 1. Crear el formulario base (POST https://forms.googleapis.com/v1/forms)
  const createRes = await fetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      info: {
        title: estructura.titulo,
        documentTitle: estructura.titulo.slice(0, 100),
      },
    }),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    console.error('Error al crear formulario en Google Forms API:', errorText);
    throw new Error(`Google Forms API error: ${createRes.status} - ${errorText}`);
  }

  const formData = await createRes.json();
  const formId = formData.formId;
  const responderUri = formData.responderUri || `https://docs.google.com/forms/d/e/${formId}/viewform`;
  const editUri = `https://docs.google.com/forms/d/${formId}/edit`;

  // 2. Insertar las preguntas y la descripción usando batchUpdate
  try {
    const updateRequests: any[] = [
      {
        updateFormInfo: {
          info: {
            description: estructura.descripcion,
          },
          updateMask: 'description',
        },
      },
      ...estructura.requests,
    ];

    const updateRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: updateRequests,
      }),
    });

    if (!updateRes.ok) {
      console.warn('Advertencia en batchUpdate de preguntas de Google Forms:', await updateRes.text());
    }
  } catch (errBatch) {
    console.warn('Error en batchUpdate de preguntas en Google Forms:', errBatch);
  }

  // 3. Mover el formulario a la carpeta institucional en Google Drive
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${formId}?addParents=${TARGET_DRIVE_FOLDER_ID}&enforceSingleParent=true`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
  } catch (eDrive) {
    console.warn('No se pudo mover el formulario a la carpeta destino de Drive:', eDrive);
  }

  const nuevoRegistro: FormularioGoogleInfo = {
    id: `form-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    formId,
    titulo: estructura.titulo,
    descripcion: estructura.descripcion,
    tipo,
    proyectoId: proyecto?.id,
    proyectoNombre: proyecto?.nombreProyecto,
    responderUri,
    editUri,
    creadoEn: new Date().toISOString(),
    totalRespuestas: 0,
    driveFolderId: TARGET_DRIVE_FOLDER_ID,
  };

  registrarFormularioGuardado(nuevoRegistro);
  return nuevoRegistro;
}

/**
 * Consulta las respuestas recibidas en un Google Form utilizando Google Forms API
 * Endpoint: GET https://forms.googleapis.com/v1/forms/{formId}/responses
 */
export async function consultarRespuestasGoogleForm(
  formId: string, 
  token?: string | null
): Promise<{ total: number; respuestas: RespuestaFormularioGoogle[] }> {
  const authToken = token || getDriveAccessToken();
  if (!authToken) {
    return { total: 0, respuestas: [] };
  }

  try {
    const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}/responses`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      const respuestas: RespuestaFormularioGoogle[] = data.responses || [];
      return {
        total: respuestas.length,
        respuestas,
      };
    } else {
      console.warn('Google Forms responses API error:', await res.text());
    }
  } catch (e) {
    console.warn('Error al consultar respuestas de Google Forms:', e);
  }

  return { total: 0, respuestas: [] };
}

/**
 * Persistencia en almacenamiento local
 */
export function obtenerFormulariosGuardados(): FormularioGoogleInfo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FORMS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error al leer formularios guardados:', e);
  }
  return [];
}

export function guardarFormularios(formularios: FormularioGoogleInfo[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_FORMS, JSON.stringify(formularios));
  } catch (e) {
    console.warn('Error al guardar formularios:', e);
  }
}

export function registrarFormularioGuardado(formulario: FormularioGoogleInfo): FormularioGoogleInfo[] {
  const actuales = obtenerFormulariosGuardados();
  const actualizados = [formulario, ...actuales.filter(f => f.formId !== formulario.formId)];
  guardarFormularios(actualizados);
  return actualizados;
}

export function eliminarFormularioGuardado(formId: string): FormularioGoogleInfo[] {
  const actuales = obtenerFormulariosGuardados();
  const actualizados = actuales.filter(f => f.formId !== formId);
  guardarFormularios(actualizados);
  return actualizados;
}
