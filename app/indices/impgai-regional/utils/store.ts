"use client";

import { create } from "zustand";

export type Respuestas = Record<string, string>;

export interface ConfigIMPGaiRegional {
  region: string;
  fechaInicio: string;
  fechaFin: string;
  responsable: string;
  incluirPresupuesto: boolean;
  evaluarMarcos: boolean;
  analizarParticipacion: boolean;
  incluirIndicadores: boolean;
}

interface State {
  respuestas: Respuestas;
  configuracion: ConfigIMPGaiRegional;
  setRespuesta: (indicadorId: string, valor: string) => void;
  setConfiguracion: (patch: Partial<ConfigIMPGaiRegional>) => void;
  reset: () => void;
}

const initialConfig: ConfigIMPGaiRegional = {
  region: "",
  fechaInicio: "",
  fechaFin: "",
  responsable: "",
  incluirPresupuesto: false,
  evaluarMarcos: false,
  analizarParticipacion: false,
  incluirIndicadores: false,
};

export const useImpgaiStore = create<State>((set: (partial: Partial<State> | ((state: State) => Partial<State>)) => void) => ({
  respuestas: {},
  configuracion: initialConfig,
  setRespuesta: (indicadorId: string, valor: string) =>
    set((s: State) => ({ respuestas: { ...s.respuestas, [indicadorId]: valor } })),
  setConfiguracion: (patch: Partial<ConfigIMPGaiRegional>) =>
    set((s: State) => ({ configuracion: { ...s.configuracion, ...patch } })),
  reset: () => set({ respuestas: {}, configuracion: initialConfig }),
}));