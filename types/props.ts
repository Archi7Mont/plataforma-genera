import type { Dimension } from "./dimension"

export interface Respuestas {
  [indicatorId: string]: string
}

export interface DimensionPageProps {
  dimension: Dimension
  onBack: () => void
  onContinue: (data: { excludeFromTotal: boolean; noAplicaPercentage: number }) => void
  onHome: () => void
  respuestas: Respuestas
  setRespuestas: (respuestas: Respuestas | ((prev: Respuestas) => Respuestas)) => void
  currentDimensionIndex: number
  totalDimensions: number
}
