"use client";

import { useState, useMemo, useCallback } from "react";
import { useImpgaiStore } from "../utils/store";
import StepNav from "../components/StepNav";
import { dimensiones } from "../data/impgai-nacional-data";
import { validarCondiciones } from "../utils/impgai";
import { ChevronDownIcon, AlertTriangleIcon, AlertCircleIcon } from "lucide-react";

// Función para obtener colores según la dimensión
const getDimensionColors = (dimensionId: string) => {
  const colorMap: { [key: string]: { dark: string; textDark: string; light: string; medium: string; indicator: string } } = {
    "A": { // Marco Legal - Green
      dark: "bg-green-500",
      textDark: "text-green-700", 
      light: "bg-green-50",
      medium: "bg-green-100",
      indicator: "bg-green-25"
    },
    "B": { // Gestión de Personas - Blue
      dark: "bg-blue-500",
      textDark: "text-blue-700",
      light: "bg-blue-50",
      medium: "bg-blue-100",
      indicator: "bg-blue-25"
    },
    "C": { // Cultura Organizacional - Red
      dark: "bg-red-500", 
      textDark: "text-red-700",
      light: "bg-red-50",
      medium: "bg-red-100",
      indicator: "bg-red-25"
    },
    "D": { // Planificación - Gray
      dark: "bg-gray-500",
      textDark: "text-gray-700", 
      light: "bg-gray-50",
      medium: "bg-gray-100",
      indicator: "bg-gray-25"
    },
    "E": { // Participación Ciudadana - Light Blue
      dark: "bg-cyan-500",
      textDark: "text-cyan-700",
      light: "bg-cyan-50",
      medium: "bg-cyan-100",
      indicator: "bg-cyan-25"
    },
    "F": { // Mejora Continua - Orange
      dark: "bg-orange-500",
      textDark: "text-orange-700",
      light: "bg-orange-50",
      medium: "bg-orange-100",
      indicator: "bg-orange-25"
    }
  };
  
  return colorMap[dimensionId] || colorMap["A"];
};

// Función para obtener el puntaje de una opción
const getOptionScore = (opciones: any[], valor: string) => {
  const opcion = opciones.find((o: any) => o.valor === valor);
  return opcion ? opcion.puntaje : 0;
};

// Función para obtener el puntaje máximo de un indicador
const getMaxScore = (opciones: any[]) => {
  return Math.max(...opciones.map((o: any) => o.puntaje || 0));
};

export default function DimensionesPage() {
  const { respuestas, setRespuesta } = useImpgaiStore();
  const [currentDimensionIndex, setCurrentDimensionIndex] = useState(0);
  const [openSubdimensions, setOpenSubdimensions] = useState<{ [key: string]: boolean }>({});

  // Load configuration from localStorage
  const [configuracion, setConfiguracion] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('impgai_nacional_configuracion');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  // Filter dimensions based on configuration
  const filteredDimensiones = useMemo(() => {
    if (!configuracion) return dimensiones;

    if (configuracion.modalidad === "completa") {
      return dimensiones; // Show all dimensions
    } else if (configuracion.modalidad === "dimension" && configuracion.dimensionesSeleccionadas.length > 0) {
      return dimensiones.filter(dim => configuracion.dimensionesSeleccionadas.includes(dim.id));
    }

    return dimensiones; // Fallback to all dimensions
  }, [configuracion]);

  const currentDimension = filteredDimensiones[currentDimensionIndex];

  // Indicadores que por defecto son "No aplica"
  const defaultNoAplicaIndicators = [
    'A.1.2', 'D.1.2'
  ];

  const toggleSubdimension = (subdimensionId: string) => {
    setOpenSubdimensions(prev => ({
      ...prev,
      [subdimensionId]: !prev[subdimensionId]
    }));
  };

  const handleRespuestaChange = (indicadorId: string, valor: string) => {
    setRespuesta(indicadorId, valor);

    // Handle cascading logic for dependent indicators
    const currentIndicador = currentDimension.subdimensiones
      .flatMap(sub => sub.indicadores)
      .find(ind => ind.id === indicadorId);

    // Find all indicators that depend on this one
    const dependentIndicators = currentDimension.subdimensiones
      .flatMap(sub => sub.indicadores)
      .filter(ind => ind.condicion && ind.condicion.dependeDe === indicadorId);

    // Update dependent indicators based on the new value
    dependentIndicators.forEach(depInd => {
      if (depInd.condicion && valor !== depInd.condicion.valorRequerido) {
        // If condition is not met, set to "No aplica" if available
        const noAplicaOption = depInd.opciones.find(opt => opt.valor === 'No aplica');
        if (noAplicaOption) {
          setRespuesta(depInd.id, 'No aplica');
        }
      }
    });
  };

  const isLastDimension = currentDimensionIndex === filteredDimensiones.length - 1;

  const handleSaveAndContinue = () => {
    // Save current dimension progress
    if (!hasUnansweredQuestions) {
      if (isLastDimension) {
        // Navigate to results
        window.location.href = '/indices/impgai-nacional/resultados';
      } else {
        // Go to next dimension
        setCurrentDimensionIndex(currentDimensionIndex + 1);
      }
    }
  };

  const isIndicadorEnabled = (indicador: any): boolean => {
    if (!indicador.condicion) return true;
    
    const { dependeDe, valorRequerido } = indicador.condicion;
    const respuestaDependiente = respuestas[dependeDe];
    
    return respuestaDependiente === valorRequerido;
  };

  const getConditionMessage = (indicador: any): string | null => {
    if (!indicador.condicion || isIndicadorEnabled(indicador)) return null;
    return indicador.condicion.mensaje;
  };

  const calculateSubdimensionScore = useCallback((subdimension: any) => {
    return subdimension.indicadores.reduce((acc: number, indicador: any) => {
      const valor = respuestas[indicador.id];
      if (!valor) return acc;
      
      const opcion = indicador.opciones.find((o: any) => o.valor === valor);
      return acc + (opcion ? opcion.puntaje : 0);
    }, 0);
  }, [respuestas]);

  const calculateSubdimensionMaxScore = useCallback((subdimension: any) => {
    return subdimension.indicadores.reduce((acc: number, indicador: any) => {
      return acc + getMaxScore(indicador.opciones);
    }, 0);
  }, []);

  const calculateDimensionScore = useCallback(() => {
    return currentDimension.subdimensiones.reduce((acc: number, subdim: any) => {
      return acc + calculateSubdimensionScore(subdim);
    }, 0);
  }, [currentDimension.subdimensiones, calculateSubdimensionScore]);

  const calculateDimensionMaxScore = useCallback(() => {
    return currentDimension.subdimensiones.reduce((acc: number, subdim: any) => {
      return acc + calculateSubdimensionMaxScore(subdim);
    }, 0);
  }, [currentDimension.subdimensiones, calculateSubdimensionMaxScore]);

  const calculateTotalMaxScore = useCallback(() => {
    return filteredDimensiones.reduce((acc: number, dim: any) => {
      return acc + dim.subdimensiones.reduce((subAcc: number, subdim: any) => {
        return subAcc + calculateSubdimensionMaxScore(subdim);
      }, 0);
    }, 0);
  }, [filteredDimensiones, calculateSubdimensionMaxScore]);

  const calculateTotalScore = useCallback(() => {
    return filteredDimensiones.reduce((acc: number, dim: any) => {
      return acc + dim.subdimensiones.reduce((subAcc: number, subdim: any) => {
        return subAcc + calculateSubdimensionScore(subdim);
      }, 0);
    }, 0);
  }, [filteredDimensiones, calculateSubdimensionScore]);

  const dimensionScore = calculateDimensionScore();
  const dimensionMaxScore = calculateDimensionMaxScore();

  const calculateNoAplicaScore = useCallback(() => {
    return currentDimension.subdimensiones.reduce((acc: number, subdim: any) => {
      return acc + subdim.indicadores.reduce((subAcc: number, indicador: any) => {
        const valor = respuestas[indicador.id];
        if (valor === 'No aplica') {
          return subAcc + getMaxScore(indicador.opciones);
        }
        return subAcc;
      }, 0);
    }, 0);
  }, [currentDimension.subdimensiones, respuestas]);

  const calculateTotalNoAplicaScore = useCallback(() => {
    return filteredDimensiones.reduce((acc: number, dim: any) => {
      return acc + dim.subdimensiones.reduce((subAcc: number, subdim: any) => {
        return subAcc + subdim.indicadores.reduce((indicatorAcc: number, indicador: any) => {
          const valor = respuestas[indicador.id];
          if (valor === 'No aplica') {
            return indicatorAcc + getMaxScore(indicador.opciones);
          }
          return indicatorAcc;
        }, 0);
      }, 0);
    }, 0);
  }, [filteredDimensiones, respuestas]);

  const noAplicaPercentage = useMemo(() => {
    const totalMaxScore = calculateDimensionMaxScore();
    const noAplicaScore = calculateNoAplicaScore();
    if (totalMaxScore === 0) return 0;
    return (noAplicaScore / totalMaxScore) * 100;
  }, [calculateDimensionMaxScore, calculateNoAplicaScore]);

  const globalNoAplicaPercentage = useMemo(() => {
    const totalMaxScore = calculateTotalMaxScore();
    const totalNoAplicaScore = calculateTotalNoAplicaScore();
    if (totalMaxScore === 0) return 0;
    return (totalNoAplicaScore / totalMaxScore) * 100;
  }, [calculateTotalMaxScore, calculateTotalNoAplicaScore]);

  const showNoAplicaWarning = useMemo(() => {
    return noAplicaPercentage > 25;
  }, [noAplicaPercentage]);

  const isUnanswered = (indicador: any): boolean => {
    const isEnabled = isIndicadorEnabled(indicador);
    const valor = respuestas[indicador.id];
    if (defaultNoAplicaIndicators.includes(indicador.id)) {
      return false;
    }
    return isEnabled && (!valor || valor === '');
  };

  const hasUnansweredQuestions = useMemo(() => {
    return currentDimension.subdimensiones.some((subdim) =>
      subdim.indicadores.some((indicador) => isUnanswered(indicador))
    );
  }, [currentDimension.subdimensiones, respuestas]);

  const globalShowNoAplicaWarning = useMemo(() => {
    return globalNoAplicaPercentage > 25;
  }, [globalNoAplicaPercentage]);

  const { dark, textDark, light, medium, indicator } = getDimensionColors(currentDimension.id);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Navigation Sidebar */}
      <div className="w-80 bg-white shadow-lg border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">IMPGAI Nacional</h1>
          <p className="text-sm text-gray-600 mt-1">Dimensiones</p>
        </div>
        
        <div className="p-4 space-y-2">
          {filteredDimensiones.map((dimension, index) => {
            const isActive = index === currentDimensionIndex;
            const isCompleted = dimension.subdimensiones.every(subdim =>
              subdim.indicadores.every(ind => respuestas[ind.id] && respuestas[ind.id] !== '')
            );
            const { dark: dimColor, light: dimLight } = getDimensionColors(dimension.id);

            return (
              <button
                key={dimension.id}
                onClick={() => setCurrentDimensionIndex(index)}
                className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                  isActive
                    ? `${dimColor} text-white shadow-lg`
                    : `${dimLight} text-gray-700 hover:shadow-md`
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{dimension.id}</span>
                      {isCompleted && (
                        <span className="text-green-400">✓</span>
                      )}
                    </div>
                    <div className={`text-sm mt-1 ${isActive ? 'text-white' : 'text-gray-600'}`}>
                      {dimension.nombre}
                    </div>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-200 mt-4">
          <div className="text-xs text-gray-500 text-center">
            Dimensión {currentDimensionIndex + 1} de {filteredDimensiones.length}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className={`text-3xl font-bold ${textDark}`}>
            <span className="text-2xl font-semibold">Dimensión {currentDimension.id}:</span> {currentDimension.nombre}
          </h2>
          <button
            onClick={() => window.location.href = '/indices/impgai-nacional/configuracion'}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
          >
            Configuración
          </button>
        </div>

        <div className="space-y-4">
          {currentDimension.subdimensiones.map((subdim) => {
            const subdimensionScore = calculateSubdimensionScore(subdim);
            const subdimensionMaxScore = calculateSubdimensionMaxScore(subdim);
            
            return (
              <div key={subdim.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <button
                  onClick={() => toggleSubdimension(subdim.id)}
                  className={`w-full text-left ${dark} p-4 flex justify-between items-center transition-colors duration-200 hover:opacity-90`}
                >
                  <div className="flex-grow">
                    <h3 className="text-xl font-semibold text-white">
                      <span className="text-lg">Subdimensión {subdim.id}:</span> {subdim.nombre}
                    </h3>
                    <div className="text-white text-sm mt-1">
                      Puntaje: {subdimensionScore}/{subdimensionMaxScore}
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`w-6 h-6 text-white transform transition-transform duration-200 ${
                      openSubdimensions[subdim.id] ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                
                {openSubdimensions[subdim.id] && (
                  <div className={`p-6 space-y-6 ${medium}`}>
                    {subdim.indicadores.map((indicador) => {
                      const isEnabled = isIndicadorEnabled(indicador);
                      const conditionMessage = getConditionMessage(indicador);
                      const valor = respuestas[indicador.id] || '';
                      const currentScore = getOptionScore(indicador.opciones, valor);
                      const maxScore = getMaxScore(indicador.opciones);
                      const unanswered = isUnanswered(indicador);
                      const isDefaultNoAplica = defaultNoAplicaIndicators.includes(indicador.id);

                      // Preparar opciones ordenadas
                      const sortedOptions = [...indicador.opciones]
                        .filter(o => o.valor !== 'No aplica')
                        .sort((a, b) => (a.puntaje || 0) - (b.puntaje || 0));
                      
                      const noAplicaOption = indicador.opciones.find(o => o.valor === 'No aplica');
                      if (noAplicaOption) {
                        sortedOptions.push(noAplicaOption);
                      }

                      return (
                        <div key={indicador.id} 
                          className={`${indicator} rounded-lg p-6 shadow-sm transition-all duration-200 ${
                            !isEnabled ? 'opacity-75' : ''
                          } ${
                            unanswered ? 'border-2 border-red-300 shadow-red-100' : 'border border-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <p className="text-gray-800 flex-grow">
                              <span className={`font-medium ${textDark} ${unanswered ? 'relative' : ''}`}>
                                Indicador {indicador.id}:
                                {unanswered && (
                                  <span className="text-red-500 ml-1 font-bold text-lg">*</span>
                                )}
                              </span> {indicador.texto}
                              {isDefaultNoAplica && (
                                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Criterio específico
                                </span>
                              )}
                            </p>
                            <div className="text-right">
                              <div className={`text-sm font-medium ${textDark}`}>
                                {currentScore}/{maxScore} puntos
                              </div>
                            </div>
                          </div>

                          {conditionMessage && !isEnabled && (
                            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 text-sm flex items-start">
                              <AlertTriangleIcon className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                              {conditionMessage}
                            </div>
                          )}

                          <div className="space-y-3">
                            <select
                              value={valor}
                              onChange={(e) => handleRespuestaChange(indicador.id, e.target.value)}
                              disabled={!isEnabled}
                              className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                                valor
                                  ? `${light} border-current ${textDark} font-medium shadow-sm`
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              } ${
                                !isEnabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'bg-white'
                              } ${unanswered ? 'border-red-300 shadow-red-100' : ''}`}
                            >
                              <option value="">Seleccionar categoría</option>
                              {sortedOptions.map((opcion) => (
                                <option
                                  key={opcion.valor}
                                  value={opcion.valor}
                                  className="font-medium"
                                >
                                  {opcion.valor} - {opcion.puntaje} puntos
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

        {globalShowNoAplicaWarning && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
            <div className="flex items-start">
              <AlertTriangleIcon className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Advertencia sobre el análisis general</p>
                <p className="mt-1">
                  Debido a que los indicadores marcados como "No aplica" superan el 25% del puntaje total del IMPGAI ({globalNoAplicaPercentage.toFixed(1)}%),
                  el análisis no podrá ser completado correctamente. Puede continuar con el análisis, pero tenga en cuenta que los puntos
                  de las dimensiones afectadas serán excluidos del cálculo del puntaje global.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-4">
            {currentDimensionIndex > 0 && (
              <button
                onClick={() => setCurrentDimensionIndex(currentDimensionIndex - 1)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                ← Anterior
              </button>
            )}
            <div>
              <div className={`${textDark} text-lg font-semibold`}>
                Puntaje Total: {dimensionScore}/{dimensionMaxScore}
              </div>
              {showNoAplicaWarning && (
                <div className="text-sm text-yellow-700 mt-1">
                  Esta dimensión será excluida del puntaje global
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <button
              onClick={handleSaveAndContinue}
              disabled={hasUnansweredQuestions}
              className={`px-6 py-2 rounded-md transition-all duration-200 ${
                hasUnansweredQuestions
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : `${dark} text-white hover:opacity-90`
              }`}
            >
              {isLastDimension ? 'Guardar y Finalizar' : 'Guardar y Seguir'}
            </button>
            {hasUnansweredQuestions && (
              <div className="text-xs text-gray-500 mt-1 text-right max-w-48">
                Complete todas las preguntas para continuar
              </div>
            )}
            {!hasUnansweredQuestions && !isLastDimension && (
              <div className="text-xs text-gray-500 mt-1 text-right max-w-48">
                Continuar a la siguiente dimensión
              </div>
            )}
            {!hasUnansweredQuestions && isLastDimension && (
              <div className="text-xs text-gray-500 mt-1 text-right max-w-48">
                Finalizar evaluación y ver resultados
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}