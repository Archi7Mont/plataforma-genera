import type { Dimension } from "../../../../types/dimension";

export const dimensiones: Dimension[] = [
  {
    id: 'A',
    nombre: 'Formulación y Diseño',
    subdimensiones: [
      {
        id: 'A.1',
        nombre: 'Identificación del problema',
        indicadores: [
          {
            id: 'A.1.1',
            texto: '¿Se realizaron evaluaciones o diagnósticos relativos a problemáticas de género para determinar el objeto de la política pública?',
            opciones: [
              { valor: 'No Implementado', puntaje: 0 },
              { valor: 'Optimizado', puntaje: 15 },
              { valor: 'No aplica', puntaje: 0 }
            ]
          },
          {
            id: 'A.1.2',
            texto: '¿Se dispuso de mediciones relativas a la población objetivo desagregadas por género?',
            opciones: [
              { valor: 'No Implementado', puntaje: 0 },
              { valor: 'Optimizado', puntaje: 10 },
              { valor: 'No aplica', puntaje: 0 }
            ]
          }
        ]
      },
      {
        id: 'A.2',
        nombre: 'Diseño',
        indicadores: [
          {
            id: 'A.2.1',
            texto: '¿El diseño de la política pública establece objetivos medibles orientados a reducir brechas de género?',
            opciones: [
              { valor: 'No Implementado', puntaje: 0 },
              { valor: 'Optimizado', puntaje: 20 },
              { valor: 'No aplica', puntaje: 0 }
            ]
          },
          {
            id: 'A.2.2',
            texto: '¿Se incluyó la participación de OSC especializadas en género durante la etapa de diseño de la política pública?',
            opciones: [
              { valor: 'No Implementado', puntaje: 0 },
              { valor: 'Optimizado', puntaje: 10 },
              { valor: 'No aplica', puntaje: 0 }
            ]
          }
        ]
      },
      {
        id: 'A.3',
        nombre: 'Formulación presupuestaria',
        indicadores: [
          {
            id: 'A.3.1',
            texto: '¿Existió un análisis de los costos asociados a las actividades de la política pública al momento de definir el presupuesto inicial?',
            opciones: [
              { valor: 'No Implementado', puntaje: 0 },
              { valor: 'Optimizado', puntaje: 10 },
              { valor: 'No aplica', puntaje: 0 }
            ]
          },
          {
            id: 'A.3.2',
            texto: '¿En la elaboración del presupuesto de la política pública se tuvo en consideración la perspectiva de género?',
            opciones: [
              { valor: 'No Implementado', puntaje: 0 },
              { valor: 'Optimizado', puntaje: 15 },
              { valor: 'No aplica', puntaje: 0 }
            ]
          }
        ]
      },
      {
        id: 'A.4',
        nombre: 'Marco Legal',
        indicadores: [
          {
            id: 'A.4.1',
            texto: '¿La política pública se encuentra alineada con los compromisos internacionales asumidos por el Estado en materia de género?',
            opciones: [
              { valor: 'No Implementado', puntaje: 0 },
              { valor: 'Optimizado', puntaje: 10 },
              { valor: 'No aplica', puntaje: 0 }
            ]
          },
          {
            id: 'A.4.2',
            texto: '¿La política pública se encuentra aprobada por una norma?',
            opciones: [
              { valor: 'No Implementado', puntaje: 0 },
              { valor: 'Optimizado', puntaje: 10 },
              { valor: 'No aplica', puntaje: 0 }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'B',
    nombre: 'Implementación',
    subdimensiones: [
      {
        id: 'B.1',
        nombre: 'Asignación de responsables',
        indicadores: [
          {
            id: 'B.1.1',
            texto: '¿Se establecieron organismos responsables para asegurar la implementación de la política pública?',
            opciones: [
              { valor: 'No Implementado', puntaje: 0 },
              { valor: 'Optimizado', puntaje: 10 },
              { valor: 'No aplica', puntaje: 0 }
            ]
          }
        ]
      },
      {
        id: 'B.2',
        nombre: 'Articulación con OSC',
        indicadores: [
          {
            id: 'B.2.1',
            texto: '¿Se constató la participación de las OSC especializadas en materia de género durante la implementación de la política pública?',
            opciones: [
              { valor: 'No Implementado', puntaje: 0 },
              { valor: 'En formación', puntaje: 4 },
              { valor: 'En desarrollo', puntaje: 6 },
              { valor: 'Optimizado', puntaje: 10 },
              { valor: 'No aplica', puntaje: 0 }
            ]
          }
        ]
      },
      {
        id: 'B.3',
        nombre: 'Articulación con instituciones públicas',
        indicadores: [
          {
            id: 'B.3.1',
            texto: '¿Existe una coordinación entre las instituciones públicas involucradas en la implementación de la política pública que permita garantizar una intersectorialidad en la promoción de la igualdad de género?',
            opciones: [
              { valor: 'No Implementado', puntaje: 0 },
              { valor: 'Optimizado', puntaje: 15 },
              { valor: 'No aplica', puntaje: 0 }
            ]
          }
        ]
      },
      {
        id: 'B.4',
        nombre: 'Sensibilización y capacitación',
        indicadores: [
          {
            id: 'B.4.1',
            texto: '¿Se llevan adelante procesos de sensibilización y/o capacitación en la temática de género del personal involucrado en la implementación de la política pública?',
            opciones: [
              { valor: 'No Implementado', puntaje: 0 },
              { valor: 'En formación', puntaje: 10 },
              { valor: 'En desarrollo', puntaje: 20 },
              { valor: 'Optimizado', puntaje: 25 },
              { valor: 'No aplica', puntaje: 0 }
            ]
          }
        ]
      },
      {
        id: 'B.5',
        nombre: 'Comunicación y difusión',
        indicadores: [
          {
            id: 'B.5.1',
            texto: '¿Se estableció un mecanismo de difusión de la política con perspectiva de género para que la misma sea conocida por la población objetivo?',
            opciones: [
              { valor: 'No Implementado', puntaje: 0 },
              { valor: 'Optimizado', puntaje: 15 },
              { valor: 'No aplica', puntaje: 0 }
            ]
          },
          {
            id: 'B.5.2',
            texto: '¿La difusión de la política pública fue realizada a través de una comunicación con lenguaje neutro y/o no sexista?',
            opciones: [
              { valor: 'No Implementado', puntaje: 0 },
              { valor: 'Optimizado', puntaje: 10 },
              { valor: 'No aplica', puntaje: 0 }
            ]
          },
          {
            id: 'B.5.3',
            texto: '¿La información sobre la política pública se encuentra disponible en plataformas accesibles y actualizadas?',
            opciones: [
              { valor: 'No Implementado', puntaje: 0 },
              { valor: 'En formación', puntaje: 4 },
              { valor: 'En desarrollo', puntaje: 8 },
              { valor: 'Optimizado', puntaje: 15 },
              { valor: 'No aplica', puntaje: 0 }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'C',
    nombre: 'Evaluación y Monitoreo',
    subdimensiones: [
      {
        id: 'C.1',
        nombre: 'Monitoreo de la política',
        indicadores: [
          {
            id: 'C.1.1',
            texto: '¿Se cuenta con mecanismos de seguimiento y monitoreo de la implementación de la política, con información desagregada por género de la población destinataria de la política?',
            opciones: [
              { valor: 'No Implementado', puntaje: 0 },
              { valor: 'En formación', puntaje: 10 },
              { valor: 'En desarrollo', puntaje: 20 },
              { valor: 'Optimizado', puntaje: 25 },
              { valor: 'No aplica', puntaje: 0 }
            ]
          }
        ]
      },
      {
        id: 'C.2',
        nombre: 'Evaluación de la política',
        indicadores: [
          {
            id: 'C.2.1',
            texto: '¿Se realizan evaluaciones de implementación y/o impacto de la política pública respecto de las brechas de género abordadas por la política?',
            opciones: [
              { valor: 'No Implementado', puntaje: 0 },
              { valor: 'Optimizado', puntaje: 15 },
              { valor: 'No aplica', puntaje: 0 }
            ]
          },
          {
            id: 'C.2.2',
            texto: '¿Se prevén instancias de participación de OSC especializadas en materia de género en la evaluación de la política pública?',
            opciones: [
              { valor: 'No Implementado', puntaje: 0 },
              { valor: 'Optimizado', puntaje: 10 },
              { valor: 'No aplica', puntaje: 0 }
            ]
          }
        ]
      },
      {
        id: 'C.3',
        nombre: 'Evaluación presupuestaria',
        indicadores: [
          {
            id: 'C.3.1',
            texto: '¿Los recursos asignados a la política se ejecutaron íntegramente en las actividades previstas?',
            opciones: [
              { valor: 'No Implementado', puntaje: 0 },
              { valor: 'Optimizado', puntaje: 25 },
              { valor: 'No aplica', puntaje: 0 }
            ]
          },
          {
            id: 'C.3.2',
            texto: '¿Se han establecido mecanismos de seguimiento y evaluación del gasto para asegurar que los recursos se estén utilizando en función de los objetivos de la política pública?',
            opciones: [
              { valor: 'No Implementado', puntaje: 0 },
              { valor: 'Optimizado', puntaje: 25 },
              { valor: 'No aplica', puntaje: 0 }
            ]
          }
        ]
      }
    ]
  }
];
