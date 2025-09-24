import type { Dimension } from "../../../../types/dimension";

export const dimensiones: Dimension[] = [
  {
    id: 'A',
    nombre: 'Marco Legal',
    subdimensiones: [
      {
        id: 'A.1',
        nombre: 'Política',
        indicadores: [
          {
            id: 'A.1.1',
            texto: '¿El organismo cuenta con una política institucional con perspectiva de género y no discriminación?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'En formación', puntaje: 5 },
              { valor: 'En desarrollo', puntaje: 10 },
              { valor: 'Optimizado', puntaje: 20 },
              { valor: 'No aplica', puntaje: 0 },
            ],
          },
          {
            id: 'A.1.2',
            texto: '¿La política institucional con perspectiva de género y no discriminación es implementada por el organismo?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'Optimizado', puntaje: 20 },
              { valor: 'No aplica', puntaje: 0 },
            ],
            condicion: {
              dependeDe: 'A.1.1',
              valorRequerido: 'Optimizado',
              mensaje: 'ATENCIÓN: Esta pregunta solamente puede ser respondida por Sí cuando la respuesta a la pregunta anterior (A.1.1) es Optimizado.'
            },
          },
        ],
      },
      {
        id: 'A.2',
        nombre: 'Normativas',
        indicadores: [
          {
            id: 'A.2.1',
            texto: '¿El organismo cuenta con una o varias normativas internas con perspectiva de género y no discriminación?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'Optimizado', puntaje: 60 },
              { valor: 'No aplica', puntaje: 0 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'B',
    nombre: 'Gestión de Personas',
    subdimensiones: [
      {
        id: 'B.1',
        nombre: 'Paridad en el acceso y dotación del personal',
        indicadores: [
          {
            id: 'B.1.1',
            texto: '¿Existe paridad entre mujeres e identidades de género diversas respecto de los varones cisgénero en el acceso al organismo en el último año?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'En formación', puntaje: 2 },
              { valor: 'En desarrollo', puntaje: 5 },
              { valor: 'Optimizado', puntaje: 10 },
              { valor: 'No aplica', puntaje: 0 },
            ],
          },
          {
            id: 'B.1.2',
            texto: '¿Existe paridad entre mujeres e identidades de género diversas respecto de los varones cisgénero en la dotación de personal del organismo?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'En formación', puntaje: 2 },
              { valor: 'En desarrollo', puntaje: 5 },
              { valor: 'Optimizado', puntaje: 10 },
              { valor: 'No aplica', puntaje: 0 },
            ],
          },
          {
            id: 'B.1.3',
            texto: '¿Cuál es el porcentaje de personal travesti, transexual o transgénero incorporado con respecto a la dotación total del organismo?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'Optimizado', puntaje: 10 },
              { valor: 'No aplica', puntaje: 0 },
            ],
          },
        ],
      },
      {
        id: 'B.2',
        nombre: 'Carrera profesional',
        indicadores: [
          {
            id: 'B.2.1',
            texto: '¿Qué proporción del personal de género femenino e identidades de género diversas participa de cargos jerárquicos con respecto al total de cargos jerárquicos en el organismo?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'En formación', puntaje: 10 },
              { valor: 'En desarrollo', puntaje: 20 },
              { valor: 'Optimizado', puntaje: 30 },
              { valor: 'No aplica', puntaje: 0 },
            ],
          },
        ],
      },
      {
        id: 'B.3',
        nombre: 'Retribución',
        indicadores: [
          {
            id: 'B.3.1',
            texto: '¿Existe en el organismo igual remuneración para igual tarea entre el personal de género femenino y de identidades de género diversas en relación con los varones cisgénero?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'Optimizado', puntaje: 15 },
              { valor: 'No aplica', puntaje: 0 },
            ],
          },
          {
            id: 'B.3.2',
            texto: '¿Existen en el organismo áreas o puestos de trabajo feminizados o masculinizados?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'Optimizado', puntaje: 15 },
              { valor: 'No aplica', puntaje: 0 },
            ],
          },
        ],
      },
      {
        id: 'B.4',
        nombre: 'Formación institucional',
        indicadores: [
          {
            id: 'B.4.1',
            texto: '¿En qué medida el organismo cumple con la Ley 27.499 de Capacitación Obligatoria en la Temática de Género y Violencia contra las Mujeres (Ley Micaela)?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'En formación', puntaje: 2 },
              { valor: 'En desarrollo', puntaje: 4 },
              { valor: 'Optimizado', puntaje: 5 },
              { valor: 'No aplica', puntaje: 0 },
            ],
          },
          {
            id: 'B.4.2',
            texto: '¿Qué proporción del personal que ocupa puestos jerárquicos se encuentra capacitada con la Ley Micaela en el organismo?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'En formación', puntaje: 2 },
              { valor: 'En desarrollo', puntaje: 4 },
              { valor: 'Optimizado', puntaje: 5 },
              { valor: 'No aplica', puntaje: 0 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'C',
    nombre: 'Cultura Organizacional',
    subdimensiones: [
      {
        id: 'C.1',
        nombre: 'Prevención y sanción de la violencia por motivos de género',
        indicadores: [
          {
            id: 'C.1.1',
            texto: '¿Existe en el organismo un protocolo para actuar ante situaciones de violencia por motivos de género?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'En formación', puntaje: 20 },
              { valor: 'En desarrollo', puntaje: 30 },
              { valor: 'Optimizado', puntaje: 50 },
              { valor: 'No aplica', puntaje: 0 },
            ],
          },
        ],
      },
      {
        id: 'C.2',
        nombre: 'Protección y salud laboral',
        indicadores: [
          {
            id: 'C.2.1',
            texto: '¿Existen en el organismo acciones positivas dirigidas a reducir las desigualdades por motivos de género en el ámbito laboral?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'Optimizado', puntaje: 30 },
              { valor: 'No aplica', puntaje: 0 },
            ],
          },
        ],
      },
      {
        id: 'C.3',
        nombre: 'Comunicación y lenguaje',
        indicadores: [
          {
            id: 'C.3.1',
            texto: '¿Existe un manual de lenguaje neutro o no sexista que se utilice a nivel institucional?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'En formación', puntaje: 10 },
              { valor: 'En desarrollo', puntaje: 15 },
              { valor: 'Optimizado', puntaje: 20 },
              { valor: 'No aplica', puntaje: 0 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'D',
    nombre: 'Planificación',
    subdimensiones: [
      {
        id: 'D.1',
        nombre: 'Presupuesto',
        indicadores: [
          {
            id: 'D.1.1',
            texto: '¿Existen partidas presupuestarias asignadas a políticas, programas o proyectos con perspectiva de género en el organismo?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'Optimizado', puntaje: 25 },
              { valor: 'No aplica', puntaje: 0 },
            ],
          },
          {
            id: 'D.1.2',
            texto: '¿Cuál es el grado de ejecución presupuestaria de las partidas asignadas a políticas, programas y proyectos con perspectiva de género en el organismo?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'En formación', puntaje: 10 },
              { valor: 'En desarrollo', puntaje: 20 },
              { valor: 'Optimizado', puntaje: 25 },
              { valor: 'No aplica', puntaje: 0 },
            ],
            condicion: {
              dependeDe: 'D.1.1',
              valorRequerido: 'Optimizado',
              mensaje: 'ATENCIÓN: Esta pregunta solamente puede ser respondida cuando la respuesta a la pregunta anterior (D.1.1) es "Optimizado". Si la respuesta es "No implementado", seleccione "No aplica".'
            },
          },
        ],
      },
      {
        id: 'D.2',
        nombre: 'Plan de acción',
        indicadores: [
          {
            id: 'D.2.1',
            texto: '¿Las políticas, programas o proyectos con perspectiva de género están incluidas en un Plan de Acción del organismo?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'Optimizado', puntaje: 50 },
              { valor: 'No aplica', puntaje: 0 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'E',
    nombre: 'Participación Ciudadana',
    subdimensiones: [
      {
        id: 'E.1',
        nombre: 'Participación de organizaciones de la sociedad civil (OSC)',
        indicadores: [
          {
            id: 'E.1.1',
            texto: '¿El organismo articula acciones con organizaciones de la sociedad civil (OSC) para la gestión de las políticas, programas o proyectos con perspectiva de género?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'En formación', puntaje: 30 },
              { valor: 'En desarrollo', puntaje: 70 },
              { valor: 'Optimizado', puntaje: 100 },
              { valor: 'No aplica', puntaje: 0 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'F',
    nombre: 'Mejora Continua',
    subdimensiones: [
      {
        id: 'F.1',
        nombre: 'Área institucional de género y diversidad',
        indicadores: [
          {
            id: 'F.1.1',
            texto: '¿Existe en el organismo un área especializada en materia de género y diversidad?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'Optimizado', puntaje: 50 },
              { valor: 'No aplica', puntaje: 0 },
            ],
          },
        ],
      },
      {
        id: 'F.2',
        nombre: 'Evaluación y retroalimentación',
        indicadores: [
          {
            id: 'F.2.1',
            texto: '¿El organismo cuenta con informes de gestión y evaluaciones de resultados acerca de la ejecución de las políticas, programas y/o proyectos con perspectiva de género que permitan una retroalimentación?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'Optimizado', puntaje: 50 },
              { valor: 'No aplica', puntaje: 0 },
            ],
          },
        ],
      },
    ],
  },
];