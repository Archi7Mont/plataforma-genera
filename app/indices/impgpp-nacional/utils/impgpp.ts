import type { Dimension, Indicador, Opcion } from "../../../../types/dimension";

export const NO_APLICA = "No aplica" as const;

export function opcionDe(ind: Indicador, valor?: string): Opcion | undefined {
  return ind.opciones.find((op: Opcion) => op.valor === valor);
}

export function maxPuntaje(ind: Indicador): number {
  const candidates = ind.opciones.filter((op: Opcion) => op.valor !== NO_APLICA).map((op: Opcion) => op.puntaje);
  return candidates.length ? Math.max(...candidates) : 0;
}

export function puntajeDe(ind: Indicador, valor?: string): number {
  const opcion = opcionDe(ind, valor);
  return opcion ? opcion.puntaje : 0;
}

export function calcularPuntajeDimension(dimension: Dimension, respuestas: Record<string, string>): number {
  let total = 0;
  
  dimension.subdimensiones.forEach(subdimension => {
    subdimension.indicadores.forEach(indicador => {
      const respuesta = respuestas[indicador.id];
      if (respuesta && respuesta !== NO_APLICA) {
        total += puntajeDe(indicador, respuesta);
      }
    });
  });
  
  return total;
}

export function calcularPuntajeMaximoDimension(dimension: Dimension): number {
  let total = 0;
  
  dimension.subdimensiones.forEach(subdimension => {
    subdimension.indicadores.forEach(indicador => {
      total += maxPuntaje(indicador);
    });
  });
  
  return total;
}

export function validarCondiciones(indicador: Indicador, respuestas: Record<string, string>): boolean {
  if (!indicador.condicion) return true;
  
  const { dependeDe, valorRequerido, valoresRequeridos } = indicador.condicion;
  const respuestaDependiente = respuestas[dependeDe];
  
  if (valorRequerido) {
    return respuestaDependiente === valorRequerido;
  }
  
  if (valoresRequeridos) {
    return valoresRequeridos.includes(respuestaDependiente);
  }
  
  return true;
}
