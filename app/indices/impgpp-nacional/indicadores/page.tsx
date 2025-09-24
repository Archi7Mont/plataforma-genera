"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { dimensiones } from "../data/impgpp-nacional-data";
import { validarCondiciones } from "../utils/impgpp";
import { ChevronLeftIcon, ChevronDownIcon, CheckIcon, AlertTriangleIcon } from "lucide-react";

// Elegant color palette with proper hierarchy
const getDimensionColors = (dimensionId: string) => {
  const colorMap = {
    "A": {
      // Elegant orange palette
      dimension: "bg-orange-600",
      dimensionLight: "bg-orange-50",
      dimensionBorder: "border-orange-200",
      subdimension: "bg-orange-100",
      subdimensionBorder: "border-orange-150",
      indicator: "bg-orange-50",
      text: "text-orange-800",
      textLight: "text-orange-600",
      accent: "text-orange-700"
    },
    "B": {
      // Elegant green palette
      dimension: "bg-green-600",
      dimensionLight: "bg-green-50",
      dimensionBorder: "border-green-200",
      subdimension: "bg-green-100",
      subdimensionBorder: "border-green-150",
      indicator: "bg-green-50",
      text: "text-green-800",
      textLight: "text-green-600",
      accent: "text-green-700"
    },
    "C": {
      // Elegant blue palette
      dimension: "bg-blue-600",
      dimensionLight: "bg-blue-50",
      dimensionBorder: "border-blue-200",
      subdimension: "bg-blue-100",
      subdimensionBorder: "border-blue-150",
      indicator: "bg-blue-50",
      text: "text-blue-800",
      textLight: "text-blue-600",
      accent: "text-blue-700"
    }
  };
  
  return colorMap[dimensionId as keyof typeof colorMap] || colorMap["A"];
};

// Helper functions
const getOptionScore = (opciones: any[], valor: string) => {
  const opcion = opciones.find(o => o.valor === valor);
  return opcion ? opcion.puntaje : 0;
};

const getMaxScore = (opciones: any[]) => {
  return Math.max(...opciones.map(o => o.puntaje || 0));
};

export default function IndicadoresPage() {
  const router = useRouter();
  const [configuracion, setConfiguracion] = useState<any>(null);
  const [openSubdimensions, setOpenSubdimensions] = useState<{ [key: string]: boolean }>({});
  const [respuestas, setRespuestas] = useState<{ [key: string]: string }>({});
  const [currentDimensionId, setCurrentDimensionId] = useState<string>("A");

  const currentDimension = dimensiones.find(d => d.id === currentDimensionId);

  useEffect(() => {
    const storedConfig = localStorage.getItem('impgpp_configuracion');
    if (storedConfig) {
      const parsedConfig = JSON.parse(storedConfig);
      setConfiguracion(parsedConfig);
    } else {
      router.push('/indices/impgpp-nacional/configuracion');
    }
  }, [router]);

  const toggleSubdimension = (subdimId: string) => {
    setOpenSubdimensions(prev => ({
      ...prev,
      [subdimId]: !prev[subdimId]
    }));
  };

  const handleRespuestaChange = (indicadorId: string, valor: string) => {
    setRespuestas(prev => ({ ...prev, [indicadorId]: valor }));
  };

  const isIndicadorEnabled = (indicador: any): boolean => {
    return validarCondiciones(indicador, respuestas);
  };

  const getConditionMessage = (indicador: any) => {
    if (!indicador.condicion) return null;
    return indicador.condicion.mensaje || `Este indicador depende de otra respuesta.`;
  };

  const calculateSubdimensionScore = useCallback((subdim: any) => {
    return subdim.indicadores.reduce((acc: number, indicador: any) => {
      const valor = respuestas[indicador.id];
      if (valor && valor !== 'No aplica') {
        return acc + getOptionScore(indicador.opciones, valor);
      }
      return acc;
    }, 0);
  }, [respuestas]);

  const calculateSubdimensionMaxScore = useCallback((subdim: any) => {
    return subdim.indicadores.reduce((acc: number, indicador: any) => {
      const valor = respuestas[indicador.id];
      if (valor !== 'No aplica') {
        return acc + getMaxScore(indicador.opciones);
      }
      return acc;
    }, 0);
  }, [respuestas]);

  const calculateDimensionScore = useCallback((dimension: any) => {
    return dimension.subdimensiones.reduce((acc: number, subdim: any) => {
      return acc + calculateSubdimensionScore(subdim);
    }, 0);
  }, [calculateSubdimensionScore]);

  const calculateDimensionMaxScore = useCallback((dimension: any) => {
    return dimension.subdimensiones.reduce((acc: number, subdim: any) => {
      return acc + calculateSubdimensionMaxScore(subdim);
    }, 0);
  }, [calculateSubdimensionMaxScore]);

  const isUnanswered = (indicador: any): boolean => {
    const isEnabled = isIndicadorEnabled(indicador);
    const valor = respuestas[indicador.id];
    return isEnabled && (!valor || valor === '');
  };

  const isDimensionCompleted = useCallback((dimension: any) => {
    return dimension.subdimensiones.every((subdim: any) =>
      subdim.indicadores.every((indicador: any) => {
        const isEnabled = isIndicadorEnabled(indicador);
        const valor = respuestas[indicador.id];
        return !isEnabled || (valor && valor !== '');
      })
    );
  }, [respuestas]);

  const hasUnansweredQuestions = useMemo(() => {
    return currentDimension?.subdimensiones.some((subdim) =>
      subdim.indicadores.some((indicador) => isUnanswered(indicador))
    ) || false;
  }, [currentDimension, respuestas]);

  const handleFinalizar = () => {
    localStorage.setItem('impgpp_respuestas', JSON.stringify(respuestas));
    localStorage.setItem('impgpp_fecha', new Date().toLocaleDateString());
    router.push('/indices/impgpp-nacional/resultados');
  };

  if (!configuracion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  const currentDimensionIndex = dimensiones.findIndex(d => d.id === currentDimensionId) + 1;
  const colors = getDimensionColors(currentDimensionId);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Navigation Sidebar */}
      <div className="w-80 bg-white shadow-lg border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Dimensiones</h2>
        </div>
        
        <nav className="p-4 space-y-2">
          {dimensiones.map((dimension) => {
            const isActive = dimension.id === currentDimensionId;
            const isCompleted = isDimensionCompleted(dimension);
            const dimensionColors = getDimensionColors(dimension.id);
            
            return (
              <button
                key={dimension.id}
                onClick={() => setCurrentDimensionId(dimension.id)}
                className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? `${dimensionColors.dimension} text-white shadow-md` 
                    : `${dimensionColors.dimensionLight} ${dimensionColors.text} hover:${dimensionColors.subdimension}`
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {dimension.id}. {dimension.nombre}
                    </div>
                    <div className={`text-sm ${isActive ? 'text-white/80' : dimensionColors.textLight}`}>
                      {calculateDimensionScore(dimension)}/{calculateDimensionMaxScore(dimension)} puntos
                    </div>
                  </div>
                  {isCompleted && (
                    <CheckIcon className="w-5 h-5 text-green-500" />
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/indices/impgpp-nacional/dimensiones')}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ChevronLeftIcon className="w-4 h-4 mr-1" />
                Atrás
              </button>
              <button
                onClick={() => router.push('/indices/impgpp-nacional/configuracion')}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Configuración
              </button>
            </div>
            
            <div className="text-center">
              <h1 className={`text-2xl font-bold ${colors.text}`}>
                Dimensión {currentDimensionId}: {currentDimension?.nombre}
              </h1>
            </div>
            
            <div className="text-sm text-gray-600">
              Dimensión {currentDimensionIndex} de {dimensiones.length}
            </div>
          </div>
        </div>

        {/* Warning for unanswered questions */}
        {hasUnansweredQuestions && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700 font-medium">Hay preguntas sin responder</span>
            </div>
          </div>
        )}

        {/* Subdimensions */}
        <div className="flex-1 p-6">
          <div className="space-y-4">
            {currentDimension?.subdimensiones.map((subdim) => {
              const isOpen = openSubdimensions[subdim.id];
              const subdimensionScore = calculateSubdimensionScore(subdim);
              const subdimensionMaxScore = calculateSubdimensionMaxScore(subdim);
              
              return (
                <div key={subdim.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => toggleSubdimension(subdim.id)}
                    className={`w-full text-left ${colors.subdimension} p-6 hover:${colors.indicator} transition-colors duration-200`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className={`text-lg font-medium ${colors.text}`}>
                          {subdim.id}. {subdim.nombre}
                        </h3>
                        <div className={`text-sm ${colors.textLight} mt-1`}>
                          Puntaje: {subdimensionScore}/{subdimensionMaxScore}
                        </div>
                      </div>
                      <ChevronDownIcon
                        className={`w-5 h-5 ${colors.text} transform transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>
                  
                  {isOpen && (
                    <div className="p-6 space-y-4">
                      {subdim.indicadores.map((indicador) => {
                        const isEnabled = isIndicadorEnabled(indicador);
                        const conditionMessage = getConditionMessage(indicador);
                        const valor = respuestas[indicador.id] || '';
                        const currentScore = getOptionScore(indicador.opciones, valor);
                        const maxScore = getMaxScore(indicador.opciones);
                        const unanswered = isUnanswered(indicador);

                        return (
                          <div key={indicador.id} 
                            className={`${colors.indicator} rounded-lg p-4 border ${colors.dimensionBorder} ${
                              unanswered ? 'border-red-300 shadow-red-100' : ''
                            }`}
                          >
                            <div className="mb-4">
                              <h4 className={`font-medium ${colors.text} mb-2`}>
                                {indicador.id}. {indicador.texto}
                                {unanswered && (
                                  <span className="text-red-500 ml-1 font-bold">*</span>
                                )}
                              </h4>
                              <div className={`text-sm ${colors.textLight}`}>
                                Puntaje: {valor ? currentScore : '-'}/{maxScore}
                              </div>
                            </div>
                            
                            {unanswered && (
                              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                                Esta pregunta requiere una respuesta para continuar.
                              </div>
                            )}
                            
                            {conditionMessage && !isEnabled && (
                              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 text-sm">
                                {conditionMessage}
                              </div>
                            )}

                            <div className={`${!isEnabled ? 'pointer-events-none' : ''}`}>
                              <select
                                value={valor}
                                onChange={(e) => handleRespuestaChange(indicador.id, e.target.value)}
                                disabled={!isEnabled}
                                className={`w-full p-3 border rounded-lg text-sm transition-all duration-200 ${
                                  !isEnabled
                                    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                    : valor === ''
                                      ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                                      : 'border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200'
                                }`}
                              >
                                <option value="">Seleccionar categoría</option>
                                {indicador.opciones.map((opcion) => (
                                  <option key={opcion.valor} value={opcion.valor}>
                                    {opcion.valor} ({opcion.puntaje} puntos)
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Resumen de Evaluación</h3>
              <p className="text-sm text-gray-600">
                Complete todas las dimensiones para finalizar la evaluación
              </p>
            </div>
            <button
              onClick={handleFinalizar}
              disabled={hasUnansweredQuestions}
              className={`px-6 py-3 rounded-lg transition-colors font-medium ${
                hasUnansweredQuestions
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-teal-600 text-white hover:bg-teal-700'
              }`}
            >
              Ver Resultados
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
