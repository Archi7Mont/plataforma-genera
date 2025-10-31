interface RangoPuntaje { min: number; max: number; }
interface RangoNivel { inicial: RangoPuntaje; medio: RangoPuntaje; avanzado: RangoPuntaje; }
interface RangoGlobal extends RangoPuntaje { porcentaje: RangoPuntaje; }
interface RangosGlobales { inicial: RangoGlobal; medio: RangoGlobal; avanzado: RangoGlobal; }
interface RangosPuntajes {
  dimensiones: { [key: string]: RangoNivel };
  global: RangosGlobales;
}

export const rangosPuntajes: RangosPuntajes = {
  dimensiones: {
    "Marco Legal": { inicial: { min: 0, max: 25 }, medio: { min: 26, max: 74 }, avanzado: { min: 75, max: 100 } },
    "Gestión de Personas": { inicial: { min: 0, max: 55 }, medio: { min: 56, max: 80 }, avanzado: { min: 81, max: 100 } },
    "Cultura Organizacional": { inicial: { min: 0, max: 50 }, medio: { min: 51, max: 79 }, avanzado: { min: 80, max: 100 } },
    "Planificación": { inicial: { min: 0, max: 50 }, medio: { min: 51, max: 89 }, avanzado: { min: 90, max: 100 } },
    "Mejora Continua": { inicial: { min: 0, max: 50 }, medio: { min: 51, max: 75 }, avanzado: { min: 76, max: 100 } },
  },
  global: {
    inicial:  { min: 0,   max: 230, porcentaje: { min: 0,   max: 46.1 } },
    medio:    { min: 231, max: 397, porcentaje: { min: 46.2, max: 79.5 } },
    avanzado: { min: 398, max: 500, porcentaje: { min: 79.6, max: 100 } },
  },
};

export const getNivelDimension = (dimension: string, puntaje: number): "Inicial" | "Medio" | "Avanzado" => {
  const rangos = rangosPuntajes.dimensiones[dimension];
  if (!rangos) return "Inicial";
  if (puntaje >= rangos.avanzado.min) return "Avanzado";
  if (puntaje >= rangos.medio.min) return "Medio";
  return "Inicial";
};

export const getNivelGlobal = (puntaje: number): "Inicial" | "Medio" | "Avanzado" => {
  if (puntaje >= rangosPuntajes.global.avanzado.min) return "Avanzado";
  if (puntaje >= rangosPuntajes.global.medio.min) return "Medio";
  return "Inicial";
};