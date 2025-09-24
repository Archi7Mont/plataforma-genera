import type { Dimension } from "../../../../types/dimension";
import { NO_APLICA, opcionDe, maxPuntaje } from "./impgai";
import { dimensiones as DATA } from "../data/impgai-regional-data";
import { rangosPuntajes, getNivelDimension, getNivelGlobal } from "../config/rangos";

export function calcularPorcentajeDimension(dimension: Dimension, respuestas: Record<string, string>): number {
  let total = 0, max = 0;
  for (const sd of dimension.subdimensiones) for (const ind of sd.indicadores) {
    const m = maxPuntaje(ind); max += m;
    const op = opcionDe(ind, respuestas[ind.id]);
    if (!op) continue;
    if (op.valor === NO_APLICA) max -= m; else total += op.puntaje;
  }
  return max > 0 ? (total / max) * 100 : 0;
}

export function obtenerPorcentajesPorDimension(respuestas: Record<string, string>, dims: Dimension[] = DATA) {
  const out: Record<string, number> = {};
  for (const dim of dims) out[dim.nombre] = calcularPorcentajeDimension(dim, respuestas);
  return out;
}

export function clasificarDimensiones(
  respuestas: Record<string, string>,
  dims: Dimension[] = DATA
): Record<string, { porcentaje: number; nivel: "Inicial" | "Medio" | "Avanzado" }> {
  const res: Record<string, { porcentaje: number; nivel: "Inicial" | "Medio" | "Avanzado" }> = {};
  for (const dim of dims) {
    const p = calcularPorcentajeDimension(dim, respuestas);
    res[dim.nombre] = { porcentaje: p, nivel: getNivelDimension(dim.nombre, p) as any };
  }
  return res;
}

export function calcularGlobalAbsoluto(respuestas: Record<string, string>, dims: Dimension[] = DATA) {
  let total = 0, max = 0;
  for (const d of dims) for (const sd of d.subdimensiones) for (const ind of sd.indicadores) {
    const m = maxPuntaje(ind); max += m;
    const op = opcionDe(ind, respuestas[ind.id]);
    if (!op) continue;
    if (op.valor === NO_APLICA) max -= m; else total += op.puntaje;
  }
  const porcentaje = max > 0 ? (total / max) * 100 : 0;
  return { total, max, porcentaje };
}

export function clasificarGlobalPorPuntaje(respuestas: Record<string, string>) {
  const { total, max, porcentaje } = calcularGlobalAbsoluto(respuestas);
  return { total, max, porcentaje, nivel: getNivelGlobal(total) as any };
}

// (Opcional) cortes globales por porcentaje (rangos.global.porcentaje)
export function clasificarGlobalPorPorcentaje(respuestas: Record<string, string>) {
  const { total, max, porcentaje } = calcularGlobalAbsoluto(respuestas);
  const { inicial, medio, avanzado } = rangosPuntajes.global;
  let nivel: "Inicial" | "Medio" | "Avanzado" = "Inicial";
  if (porcentaje >= avanzado.porcentaje.min) nivel = "Avanzado";
  else if (porcentaje >= medio.porcentaje.min) nivel = "Medio";
  return { total, max, porcentaje, nivel };
}