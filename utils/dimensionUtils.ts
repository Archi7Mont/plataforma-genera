export const INDICATOR_SCORES: { [key: string]: { [key: string]: number } } = {
  // Dimension A - Marco Legal
  "A.1.1": { "No implementado": 0, "En formación": 10, "En desarrollo": 20, Optimizado: 25, "No aplica": 0 },
  "A.1.2": { "No implementado": 0, Optimizado: 25, "No aplica": 0 },
  "A.2.1": { "No implementado": 0, Optimizado: 50, "No aplica": 0 },

  // Dimension B - Gestión de Personas
  "B.1.1": { "No implementado": 0, "En formación": 2, "En desarrollo": 4, Optimizado: 5, "No aplica": 0 },
  "B.1.2": { "No implementado": 0, "En formación": 4, "En desarrollo": 8, Optimizado: 10, "No aplica": 0 },
  "B.1.3": { "No implementado": 0, "En formación": 4, "En desarrollo": 8, Optimizado: 10, "No aplica": 0 },
  "B.1.4": { "No implementado": 0, Optimizado: 10, "No aplica": 0 },
  "B.2.1": { "No implementado": 0, "En formación": 10, "En desarrollo": 15, Optimizado: 20, "No aplica": 0 },
  "B.3.1": { "No implementado": 0, Optimizado: 10, "No aplica": 0 },
  "B.3.2": { "No implementado": 0, Optimizado: 10, "No aplica": 0 },
  "B.4.1": { "No implementado": 0, "En formación": 4, "En desarrollo": 6, Optimizado: 10, "No aplica": 0 },
  "B.4.2": { "No implementado": 0, "En formación": 2, "En desarrollo": 3, Optimizado: 5, "No aplica": 0 },
  "B.4.3": { "No implementado": 0, "En formación": 4, "En desarrollo": 6, Optimizado: 10, "No aplica": 0 },

  // Dimension C - Cultura Organizacional
  "C.1.1": { "No implementado": 0, "En formación": 10, "En desarrollo": 20, Optimizado: 25, "No aplica": 0 },
  "C.1.2": { "No implementado": 0, Optimizado: 25, "No aplica": 0 },
  "C.2.1": { "No implementado": 0, Optimizado: 30, "No aplica": 0 },
  "C.3.1": { "No implementado": 0, "En formación": 2, "En desarrollo": 5, Optimizado: 10, "No aplica": 0 },
  "C.4.1": { "No implementado": 0, "En formación": 4, "En desarrollo": 5, Optimizado: 10, "No aplica": 0 },

  // Dimension D - Planificación
  "D.1.1": { "No implementado": 0, Optimizado: 30, "No aplica": 0 },
  "D.1.2": { "No implementado": 0, "En formación": 10, "En desarrollo": 20, Optimizado: 30, "No aplica": 0 },
  "D.2.1": { "No implementado": 0, Optimizado: 40, "No aplica": 0 },

  // Dimension E - Mejora Continua
  "E.1.1": { "No implementado": 0, Optimizado: 50, "No aplica": 0 },
  "E.2.1": { "No implementado": 0, Optimizado: 25, "No aplica": 0 },
  "E.2.2": { "No implementado": 0, Optimizado: 25, "No aplica": 0 },
}

export const getIndicatorScore = (indicatorId: string, valor: string): number => {
  const scores = INDICATOR_SCORES[indicatorId]
  if (!scores) return 0
  return scores[valor] || 0
}

export const getIndicatorMaxScore = (indicatorId: string, valor?: string): number => {
  const scores = INDICATOR_SCORES[indicatorId]
  if (!scores) return 0

  // If valor is "No aplica", max score is 0 for calculation purposes
  if (valor === "No aplica") return 0

  // Return the maximum possible score for this indicator
  return Math.max(...Object.values(scores))
}

export const formatScore = (valor: string, score: number): string => {
  if (!valor || valor === "") return "-"
  if (valor === "No aplica") return "-"
  return score.toString()
}

export const getDimensionColors = (dimensionId: string) => {
  // Using purple theme for all dimensions to match the design
  return {
    dark: "bg-purple-600",
    textDark: "text-purple-700",
    light: "bg-purple-50",
  }
}
