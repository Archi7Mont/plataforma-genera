"use client";

import { create } from "zustand";

export type Respuestas = Record<string, string>;

export interface ConfigIMPGaiNacional {
  entidadFiscalizadora: string;
  organismoPublicoAuditado: string;
  periodoAuditado: string;
  modalidadAplicacion: string;
}

interface State {
  respuestas: Respuestas;
  configuracion: ConfigIMPGaiNacional;
  setRespuesta: (indicadorId: string, valor: string) => void;
  setConfiguracion: (patch: Partial<ConfigIMPGaiNacional>) => void;
  reset: () => void;
}

const initialConfig: ConfigIMPGaiNacional = {
  entidadFiscalizadora: "",
  organismoPublicoAuditado: "",
  periodoAuditado: "",
  modalidadAplicacion: "",
};

export const useImpgaiStore = create<State>((set: (partial: Partial<State> | ((state: State) => Partial<State>)) => void) => ({
  respuestas: {},
  configuracion: initialConfig,
  setRespuesta: (indicadorId: string, valor: string) =>
    set((s: State) => ({ respuestas: { ...s.respuestas, [indicadorId]: valor } })),
  setConfiguracion: (patch: Partial<ConfigIMPGaiNacional>) =>
    set((s: State) => ({ configuracion: { ...s.configuracion, ...patch } })),
  reset: () => set({ respuestas: {}, configuracion: initialConfig }),
}));
