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
              { valor: 'En formación', puntaje: 10 },
              { valor: 'En desarrollo', puntaje: 20 },
              { valor: 'Optimizado', puntaje: 25 },
              { valor: 'No aplica', puntaje: 0 },
            ],
          },
          {
            id: 'A.1.2',
            texto: '¿La política institucional con perspectiva de género y no discriminación es implementada por el organismo?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'Optimizado', puntaje: 25 },
              { valor: 'No aplica', puntaje: 0 },
            ],
            condicion: {
              dependeDe: 'A.1.1',
              valorRequerido: 'Optimizado',
              mensaje: 'Este indicador solo puede ser respondido si el indicador A.1.1 tiene por resultado "Optimizado"'
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
              { valor: 'Optimizado', puntaje: 50 },
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
        nombre: 'Paridad en el acceso del personal activo',
        indicadores: [
          {
            id: 'B.1.1',
            texto: '¿Existe paridad de género en el acceso al organismo en el último año?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'En formación', puntaje: 2 },
              { valor: 'En desarrollo', puntaje: 4 },
              { valor: 'Optimizado', puntaje: 5 },
              { valor: 'No aplica', puntaje: 0 },
            ],
          },
          {
            id: 'B.1.2',
            texto: '¿Existe paridad de género en la totalidad del personal activo del organismo?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'En formación', puntaje: 4 },
              { valor: 'En desarrollo', puntaje: 8 },
              { valor: 'Optimizado', puntaje: 10 },
              { valor: 'No aplica', puntaje: 0 },
            ],
          },
          {
            id: 'B.1.3',
            texto: '¿El organismo implementa acciones para promover la contratación de agentes con identidades de género diversas?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'En formación', puntaje: 4 },
              { valor: 'En desarrollo', puntaje: 8 },
              { valor: 'Optimizado', puntaje: 10 },
              { valor: 'No aplica', puntaje: 0 },
            ],
          },
          {
            id: 'B.1.4',
            texto: '¿El proceso de reclutamiento y selección se llevó a cabo de manera inclusiva, evitando sesgos de género y promoviendo la diversidad de género en el último año?',
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
            texto: '¿Qué proporción de agentes de género femenino e identidades de género diversas participa de cargos jerárquicos con respecto al total de cargos jerárquicos en el organismo?',
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
      {
        id: 'B.3',
        nombre: 'Retribución',
        indicadores: [
          {
            id: 'B.3.1',
            texto: '¿Existe en el organismo igual remuneración para igual tarea entre los distintos géneros?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'Optimizado', puntaje: 10 },
              { valor: 'No aplica', puntaje: 0 },
            ],
          },
          {
            id: 'B.3.2',
            texto: '¿Existen en el organismo áreas o puestos de trabajo feminizados o masculinizados?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'Optimizado', puntaje: 10 },
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
            texto: '¿Existe alguna modalidad de capacitación del organismo en la temática de género y/o violencia por motivos de género?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'En formación', puntaje: 4 },
              { valor: 'En desarrollo', puntaje: 6 },
              { valor: 'Optimizado', puntaje: 10 },
              { valor: 'No aplica', puntaje: 0 },
            ],
          },
          {
            id: 'B.4.2',
            texto: '¿Qué proporción de agentes fueron capacitados por el organismo en la temática de género y/o violencia por motivos de género?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'En formación', puntaje: 2 },
              { valor: 'En desarrollo', puntaje: 3 },
              { valor: 'Optimizado', puntaje: 5 },
              { valor: 'No aplica', puntaje: 0 },
            ],
            condicion: {
              dependeDe: 'B.4.1',
              valoresRequeridos: ['En desarrollo', 'Optimizado'],
              mensaje: 'Este indicador solo puede ser respondido si el indicador B.4.1 tiene por resultado "En desarrollo" u "Optimizado"'
            },
          },
          {
            id: 'B.4.3',
            texto: '¿Qué proporción de agentes que ocupan puestos jerárquicos se encuentran capacitados en la temática de género y/o violencia por motivos de género en el organismo?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'En formación', puntaje: 4 },
              { valor: 'En desarrollo', puntaje: 6 },
              { valor: 'Optimizado', puntaje: 10 },
              { valor: 'No aplica', puntaje: 0 },
            ],
            condicion: {
              dependeDe: 'B.4.1',
              valoresRequeridos: ['En desarrollo', 'Optimizado'],
              mensaje: 'Este indicador solo puede ser respondido si el indicador B.4.1 tiene por resultado "En desarrollo" u "Optimizado"'
            },
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
            texto: '¿Existe en el organismo un protocolo que incluya el abordaje y la sanción de situaciones de violencia por motivos de género?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'En formación', puntaje: 10 },
              { valor: 'En desarrollo', puntaje: 20 },
              { valor: 'Optimizado', puntaje: 25 },
              { valor: 'No aplica', puntaje: 0 },
            ],
          },
          {
            id: 'C.1.2',
            texto: '¿Se implementa el protocolo de violencia por motivos de género?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'Optimizado', puntaje: 25 },
              { valor: 'No aplica', puntaje: 0 },
            ],
            condicion: {
              dependeDe: 'C.1.1',
              valoresRequeridos: ['En desarrollo', 'Optimizado'],
              mensaje: 'Este indicador solo puede ser respondido si el indicador C.1.1 tiene por resultado "En desarrollo" u "Optimizado"'
            },
          },
        ],
      },
      {
        id: 'C.2',
        nombre: 'Protección y salud laboral',
        indicadores: [
          {
            id: 'C.2.1',
            texto: '¿Existen en el organismo acciones positivas dirigidas a reducir las desigualdades por motivos de género a fin de garantizar la igualdad y no discriminación en el ámbito laboral?',
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
            texto: '¿Existe un manual de lenguaje neutro y/o no sexista que se utilice a nivel institucional?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'En formación', puntaje: 2 },
              { valor: 'En desarrollo', puntaje: 5 },
              { valor: 'Optimizado', puntaje: 10 },
              { valor: 'No aplica', puntaje: 0 },
            ],
          },
        ],
      },
      {
        id: 'C.4',
        nombre: 'Participación Ciudadana',
        indicadores: [
          {
            id: 'C.4.1',
            texto: '¿El organismo articula acciones con organizaciones de la sociedad civil (OSC) para la gestión de las políticas, programas o proyectos con perspectiva de género?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'En formación', puntaje: 4 },
              { valor: 'En desarrollo', puntaje: 5 },
              { valor: 'Optimizado', puntaje: 10 },
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
              { valor: 'Optimizado', puntaje: 30 },
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
              { valor: 'Optimizado', puntaje: 30 },
              { valor: 'No aplica', puntaje: 0 },
            ],
            condicion: {
              dependeDe: 'D.1.1',
              valorRequerido: 'Optimizado',
              mensaje: 'Este indicador solo puede ser respondido si el indicador D.1.1 tiene por resultado "Optimizado"'
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
              { valor: 'Optimizado', puntaje: 40 },
              { valor: 'No aplica', puntaje: 0 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'E',
    nombre: 'Mejora Continua',
    subdimensiones: [
      {
        id: 'E.1',
        nombre: 'Área institucional de género',
        indicadores: [
          {
            id: 'E.1.1',
            texto: '¿Existe en el organismo un área especializada en materia de género?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'Optimizado', puntaje: 50 },
              { valor: 'No aplica', puntaje: 0 },
            ],
          },
        ],
      },
      {
        id: 'E.2',
        nombre: 'Monitoreo, Seguimiento y Evaluación',
        indicadores: [
          {
            id: 'E.2.1',
            texto: '¿Las políticas, programas y/o acciones con perspectiva de género están sujetas a mecanismos de monitoreo y seguimiento?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'Optimizado', puntaje: 25 },
              { valor: 'No aplica', puntaje: 0 },
            ],
          },
          {
            id: 'E.2.2',
            texto: '¿El organismo cuenta con informes de gestión y evaluaciones de resultados acerca de la ejecución de las políticas, programas y/o proyectos con perspectiva de género que permitan una retroalimentación?',
            opciones: [
              { valor: 'No implementado', puntaje: 0 },
              { valor: 'Optimizado', puntaje: 25 },
              { valor: 'No aplica', puntaje: 0 },
            ],
          },
        ],
      },
    ],
  },
];