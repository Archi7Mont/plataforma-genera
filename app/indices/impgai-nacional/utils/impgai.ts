import type { Dimension, Indicador, Opcion } from "../../../../types/dimension";

export const NO_APLICA = "No aplica" as const;

export function opcionDe(ind: Indicador, valor?: string): Opcion | undefined {
  return ind.opciones.find((op: Opcion) => op.valor === valor);
}

export function maxPuntaje(ind: Indicador): number {
  const candidates = ind.opciones.filter((op: Opcion) => op.valor !== NO_APLICA).map((op: Opcion) => op.puntaje);
  return candidates.length ? Math.max(...candidates) : 0;
}

export function validarCondiciones(indicador: Indicador, respuestas: Record<string, string>): boolean {
  if (!indicador.condicion) return true;
  const r = respuestas[indicador.condicion.dependeDe];
  if (indicador.condicion.valorRequerido) return r === indicador.condicion.valorRequerido;
  if (indicador.condicion.valoresRequeridos) return indicador.condicion.valoresRequeridos.includes(r);
  return true;
}

export function calcularPuntajeDimension(dimension: Dimension, respuestas: Record<string, string>): number {
  // Deprecated: previously returned %; keep for backward-compat but align to raw points
  const { total } = calcularPuntosYMaxDimension(dimension, respuestas);
  return total;
}

export function calcularPuntajeTotal(dims: Dimension[], respuestas: Record<string, string>): number {
  let total = 0, max = 0;
  for (const d of dims) for (const sd of d.subdimensiones) for (const ind of sd.indicadores) {
    const m = maxPuntaje(ind); max += m;
    const op = opcionDe(ind, respuestas[ind.id]);
    if (!op) continue;
    if (op.valor === NO_APLICA) max -= m; else total += op.puntaje;
  }
  return max > 0 ? (total / max) * 100 : 0;
}

// New helpers that compute raw points and effective max considering "No aplica" and unmet conditions
export function calcularPuntosYMaxDimension(dimension: Dimension, respuestas: Record<string, string>): { total: number; max: number } {
  let total = 0;
  let max = 0;
  for (const sd of dimension.subdimensiones) {
    for (const ind of sd.indicadores) {
      // Skip indicators whose conditions are not met
      if (!validarCondiciones(ind, respuestas)) continue;
      const m = maxPuntaje(ind);
      const op = opcionDe(ind, respuestas[ind.id]);
      // If explicitly marked as "No aplica", exclude from max
      if (op?.valor === NO_APLICA) continue;
      max += m;
      if (op) total += op.puntaje;
    }
  }
  return { total, max };
}

export function calcularPuntosDimension(dimension: Dimension, respuestas: Record<string, string>): number {
  return calcularPuntosYMaxDimension(dimension, respuestas).total;
}

export function calcularMaxPuntosDimension(dimension: Dimension, respuestas: Record<string, string>): number {
  return calcularPuntosYMaxDimension(dimension, respuestas).max;
}







