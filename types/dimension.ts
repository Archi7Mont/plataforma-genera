export interface Opcion {
  valor: string
  puntaje: number
}

export interface Condicion {
  dependeDe: string
  valorRequerido?: string
  valoresRequeridos?: string[]
  mensaje: string
}

export interface Indicador {
  id: string
  texto: string
  opciones: Opcion[]
  condicion?: Condicion
}

export interface Subdimension {
  id: string
  nombre: string
  indicadores: Indicador[]
}

export interface Dimension {
  id: string
  nombre: string
  subdimensiones: Subdimension[]
}
