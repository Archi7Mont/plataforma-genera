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
    set((s: State) => {
      const updated = { ...s.respuestas, [indicadorId]: valor };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('impgai_respuestas', JSON.stringify(updated));
          if (!localStorage.getItem('impgai_fecha')) {
            localStorage.setItem('impgai_fecha', new Date().toISOString());
          }
        } catch {}
      }
      return { respuestas: updated };
    }),
  setConfiguracion: (patch: Partial<ConfigIMPGaiNacional>) =>
    set((s: State) => {
      const updated = { ...s.configuracion, ...patch } as ConfigIMPGaiNacional;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('impgai_nacional_configuracion', JSON.stringify(updated));
        } catch {}
      }
      return { configuracion: updated };
    }),
  reset: () => set(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('impgai_respuestas');
        localStorage.removeItem('impgai_nacional_configuracion');
        localStorage.removeItem('impgai_fecha');
      } catch {}
    }
    return { respuestas: {}, configuracion: initialConfig };
  }),
}));
