"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { dimensiones } from "../data/impgai-regional-data";
import { validarCondiciones } from "../utils/impgai";
import { ChevronDownIcon, AlertTriangleIcon, AlertCircleIcon } from "lucide-react";

// Función para obtener colores según la dimensión
const getDimensionColors = (dimensionId: string) => {
  const colorMap: { [key: string]: { 
    dark: string; 
    textDark: string; 
    light: string; 
    border: string;
    pastel: string;
    accent: string;
  } } = {
    "A": { // Marco Legal - Green
      dark: "bg-green-600",
      textDark: "text-green-600", 
      light: "bg-green-50",
      border: "border-green-200",
      pastel: "bg-green-100",
      accent: "bg-green-500"
    },
    "B": { // Gestión de Personas - Blue
      dark: "bg-blue-600",
      textDark: "text-blue-600",
      light: "bg-blue-50",
      border: "border-blue-200",
      pastel: "bg-blue-100",
      accent: "bg-blue-500"
    },
    "C": { // Cultura organizacional - Red
      dark: "bg-red-600", 
      textDark: "text-red-600",
      light: "bg-red-50",
      border: "border-red-200",
      pastel: "bg-red-100",
      accent: "bg-red-500"
    },
    "D": { // Planificación - Gray
      dark: "bg-gray-600",
      textDark: "text-gray-600", 
      light: "bg-gray-50",
      border: "border-gray-200",
      pastel: "bg-gray-100",
      accent: "bg-gray-500"
    },
    "E": { // Mejora Continua - Orange
      dark: "bg-orange-600",
      textDark: "text-orange-600",
      light: "bg-orange-50",
      border: "border-orange-200",
      pastel: "bg-orange-100",
      accent: "bg-orange-500"
    }
  };
  
  return colorMap[dimensionId] || colorMap["A"];
};

// Función para obtener el puntaje de una opción
const getOptionScore = (opciones: any[], valor: string) => {
  const opcion = opciones.find(o => o.valor === valor);
  return opcion ? opcion.puntaje : 0;
};

// Función para obtener el puntaje máximo de un indicador
const getMaxScore = (opciones: any[]) => {
  return Math.max(...opciones.map(o => o.puntaje || 0));
};

export default function DimensionesAdvancedPage() {
  const router = useRouter();
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [openSubdimensions, setOpenSubdimensions] = useState<{ [key: string]: boolean }>({});
  const [currentDimensionIndex, setCurrentDimensionIndex] = useState(0);
  const [completedDimensions, setCompletedDimensions] = useState<Set<number>>(new Set());
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>([]);
  const [filteredDimensiones, setFilteredDimensiones] = useState(dimensiones);

  // Cargar configuración al montar el componente
  useEffect(() => {
    const configuracion = localStorage.getItem('impgai_configuracion');
    if (configuracion) {
      const config = JSON.parse(configuracion);
      console.log('Configuración cargada:', config);
      
      if (config.modalidad === 'completa') {
        // Si es auditoría completa, mostrar todas las dimensiones
        setSelectedDimensions(dimensiones.map(d => d.id));
        setFilteredDimensiones(dimensiones);
      } else if (config.dimensionesSeleccionadas && config.dimensionesSeleccionadas.length > 0) {
        // Si hay dimensiones específicas seleccionadas, filtrar
        setSelectedDimensions(config.dimensionesSeleccionadas);
        const filtered = dimensiones.filter(d => config.dimensionesSeleccionadas.includes(d.id));
        setFilteredDimensiones(filtered);
        console.log('Dimensiones filtradas:', filtered);
      }
    }
  }, []);

  const currentDimension = filteredDimensiones[currentDimensionIndex];

  // Indicadores que deben tener "No aplica" por defecto
  const defaultNoAplicaIndicators = ['A.1.2', 'B.4.2', 'B.4.3', 'C.1.2', 'D.1.2'];

  // Inicializar valores por defecto
  useEffect(() => {
    const newRespuestas = { ...respuestas };
    let hasChanges = false;

    defaultNoAplicaIndicators.forEach(indicatorId => {
      if (!(indicatorId in newRespuestas)) {
        newRespuestas[indicatorId] = 'No aplica';
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setRespuestas(newRespuestas);
    }
  }, [currentDimension.id]);

  const toggleSubdimension = (subdimId: string) => {
    setOpenSubdimensions(prev => ({
      ...prev,
      [subdimId]: !prev[subdimId]
    }));
  };

  const handleRespuestaChange = (indicadorId: string, valor: string) => {
    setRespuestas(prev => ({ ...prev, [indicadorId]: valor }));
  };

  // Función para calcular el porcentaje de "No aplica" en la dimensión actual
  const calcularPorcentajeNoAplica = useCallback(() => {
    if (!currentDimension) return 0;
    
    let totalIndicadores = 0;
    let noAplicaIndicadores = 0;
    
    currentDimension.subdimensiones.forEach((subdimension: any) => {
      subdimension.indicadores.forEach((indicador: any) => {
        totalIndicadores++;
        const respuesta = respuestas[indicador.id];
        if (respuesta === 'No aplica') {
          noAplicaIndicadores++;
        }
      });
    });
    
    return totalIndicadores > 0 ? (noAplicaIndicadores / totalIndicadores) * 100 : 0;
  }, [currentDimension, respuestas]);

  // Verificar si la dimensión actual tiene más del 25% de "No aplica"
  const tieneAdvertenciaNoAplica = calcularPorcentajeNoAplica() > 25;

  // Función para verificar si una dimensión está completa
  const isDimensionComplete = useCallback((dimensionIndex: number) => {
    const dimension = filteredDimensiones[dimensionIndex];
    return dimension.subdimensiones.every((subdim: any) => {
      return subdim.indicadores.every((indicador: any) => {
        const valor = respuestas[indicador.id];
        return valor && valor !== '';
      });
    });
  }, [respuestas]);

  // Marcar dimensión como completada cuando se complete, pero NO auto-avanzar
  useEffect(() => {
    if (isDimensionComplete(currentDimensionIndex) && !completedDimensions.has(currentDimensionIndex)) {
      setCompletedDimensions(prev => new Set([...prev, currentDimensionIndex]));
      // NO auto-avanzar automáticamente - el usuario debe hacer clic en "Guardar"
    }
  }, [currentDimensionIndex, isDimensionComplete, completedDimensions]);

  // Navegación
  const goToPreviousDimension = () => {
    if (currentDimensionIndex > 0) {
      setCurrentDimensionIndex(prev => prev - 1);
    }
  };

  const goToNextDimension = () => {
    if (currentDimensionIndex < filteredDimensiones.length - 1) {
      setCurrentDimensionIndex(prev => prev + 1);
    }
  };

  const guardarYContinuar = () => {
    if (isComplete) {
      if (currentDimensionIndex < filteredDimensiones.length - 1) {
        goToNextDimension();
      } else {
        finalizarEvaluacion();
      }
    }
  };

  const finalizarEvaluacion = () => {
    console.log('Finalizando evaluación...', { respuestas });
    
    // Guardar respuestas en localStorage para que la página de resultados pueda acceder a ellas
    localStorage.setItem('impgai_respuestas', JSON.stringify(respuestas));
    localStorage.setItem('impgai_fecha', new Date().toISOString());
    
    console.log('Datos guardados en localStorage:', {
      respuestas: Object.keys(respuestas).length,
      fecha: new Date().toISOString()
    });
    
    // Navegar a la página de resultados
    window.location.href = '/indices/impgai-regional/resultados';
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

  const dimensionScore = useMemo(() => {
    return currentDimension.subdimensiones.reduce((acc: number, subdim: any) => {
      return acc + calculateSubdimensionScore(subdim);
    }, 0);
  }, [currentDimension.subdimensiones, calculateSubdimensionScore]);

  const dimensionMaxScore = useMemo(() => {
    return currentDimension.subdimensiones.reduce((acc: number, subdim: any) => {
      return acc + calculateSubdimensionMaxScore(subdim);
    }, 0);
  }, [currentDimension.subdimensiones, calculateSubdimensionMaxScore]);

  const calculateTotalMaxScore = useCallback(() => {
    return currentDimension.subdimensiones.reduce((acc, subdim) => {
      return acc + subdim.indicadores.reduce((subAcc, indicador) => {
        return subAcc + getMaxScore(indicador.opciones);
      }, 0);
    }, 0);
  }, [currentDimension.subdimensiones]);

  const calculateNoAplicaScore = useCallback(() => {
    return currentDimension.subdimensiones.reduce((acc, subdim) => {
      return acc + subdim.indicadores.reduce((subAcc, indicador) => {
        const valor = respuestas[indicador.id];
        if (valor === 'No aplica') {
          return subAcc + getMaxScore(indicador.opciones);
        }
        return subAcc;
      }, 0);
    }, 0);
  }, [currentDimension.subdimensiones, respuestas]);

  const totalMaxScore = calculateTotalMaxScore();
  const noAplicaScore = calculateNoAplicaScore();
  const adjustedMaxScore = totalMaxScore - noAplicaScore;

  const isComplete = useMemo(() => {
    return currentDimension.subdimensiones.every((subdim: any) => {
      return subdim.indicadores.every((indicador: any) => {
        const valor = respuestas[indicador.id];
        return valor && valor !== '';
      });
    });
  }, [currentDimension.subdimensiones, respuestas]);

  const colors = getDimensionColors(currentDimension.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Dimensiones</h2>
            <div className="space-y-2">
                     {filteredDimensiones.map((dim, index) => {
                const dimColors = getDimensionColors(dim.id);
                const isActive = index === currentDimensionIndex;
                const isCompleted = completedDimensions.has(index);
                const isComplete = isDimensionComplete(index);
                
                return (
                  <button
                    key={dim.id}
                    onClick={() => setCurrentDimensionIndex(index)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 border-2 ${
                      isActive 
                        ? `${dimColors.dark} text-white border-${dimColors.textDark.split('-')[1]}-600` 
                        : isCompleted || isComplete
                          ? `${dimColors.light} ${dimColors.textDark} border-${dimColors.textDark.split('-')[1]}-300 hover:${dimColors.pastel}`
                          : `${dimColors.light} ${dimColors.textDark} border-transparent hover:${dimColors.pastel} hover:border-${dimColors.textDark.split('-')[1]}-200`
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{dim.id}. {dim.nombre}</div>
                      {isCompleted || isComplete ? (
                        <div className={`w-2 h-2 rounded-full ${dimColors.accent}`}></div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className={`text-3xl font-bold ${colors.textDark}`}>
                    Dimensión {currentDimension.id}: {currentDimension.nombre}
                  </h1>
                  <p className="text-gray-600">Dimensión {currentDimensionIndex + 1} de {filteredDimensiones.length}</p>
                </div>
                <div className="flex gap-3">
                  {currentDimensionIndex > 0 && (
                    <button 
                      onClick={goToPreviousDimension}
                      className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <ChevronDownIcon className="w-4 h-4 rotate-90" />
                      Atrás
                    </button>
                  )}
                  <button 
                    onClick={() => router.push('/indices/impgai-regional/configuracion-simple')}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <ChevronDownIcon className="w-4 h-4" />
                    Configuración
                  </button>
                </div>
              </div>
            </div>

            {/* Subdimensiones */}
            <div className="space-y-4 mb-8">
              {currentDimension.subdimensiones.map((subdim) => {
                const isOpen = openSubdimensions[subdim.id];
                const score = calculateSubdimensionScore(subdim);
                const maxScore = calculateSubdimensionMaxScore(subdim);
                
                return (
                  <div key={subdim.id} className={`bg-white rounded-lg shadow-sm border-2 ${colors.border} hover:shadow-md transition-all duration-200`}>
                    <button
                      onClick={() => toggleSubdimension(subdim.id)}
                      className={`w-full p-4 text-left flex items-center justify-between hover:${colors.pastel} transition-colors rounded-lg`}
                    >
                      <div>
                        <h3 className={`font-semibold ${colors.textDark}`}>
                          Subdimensión {subdim.id}: {subdim.nombre}
                        </h3>
                        <p className="text-sm text-gray-600">Puntaje: {score}/{maxScore}</p>
                      </div>
                      <ChevronDownIcon 
                        className={`w-5 h-5 ${colors.textDark} transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                      />
                    </button>
                    
                    {isOpen && (
                      <div className="border-t p-4 space-y-6">
                        {subdim.indicadores.map((indicador) => {
                          const isEnabled = isIndicadorEnabled(indicador);
                          const conditionMessage = getConditionMessage(indicador);
                          const currentValue = respuestas[indicador.id] || '';
                          const hasAnswer = currentValue !== '';
                          
                          return (
                            <div key={indicador.id} className={`border-2 rounded-lg p-4 transition-all duration-200 ${
                              hasAnswer 
                                ? `border-green-200 bg-green-50` 
                                : `border-red-200 bg-red-50`
                            }`}>
                              <h4 className="font-medium text-gray-800 mb-3">
                                {indicador.id}: {indicador.texto}
                              </h4>
                              
                              {!isEnabled && conditionMessage && (
                                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                                  <AlertCircleIcon className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                  <p className="text-sm text-yellow-800">{conditionMessage}</p>
                                </div>
                              )}
                              
                              <div className="space-y-2">
                                <select
                                  value={currentValue}
                                  onChange={(e) => handleRespuestaChange(indicador.id, e.target.value)}
                                  disabled={!isEnabled}
                                  className={`w-full p-3 border rounded-lg text-sm transition-colors ${
                                    !isEnabled 
                                      ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
                                      : currentValue === ''
                                        ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                                        : `border-gray-300 focus:border-${colors.textDark.split('-')[1]}-500 focus:ring-2 focus:ring-${colors.textDark.split('-')[1]}-200`
                                  }`}
                                >
                                  <option value="">Seleccionar categoría</option>
                                  {indicador.opciones.map((opcion) => (
                                    <option key={opcion.valor} value={opcion.valor}>
                                      {opcion.valor} ({opcion.puntaje} puntos)
                                    </option>
                                  ))}
                                </select>
                                
                                {currentValue === '' && isEnabled && (
                                  <div className="flex items-center gap-2 text-red-600 text-sm">
                                    <AlertTriangleIcon className="w-4 h-4" />
                                    <span>Esta pregunta requiere una respuesta para continuar.</span>
                                  </div>
                                )}
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

            {/* Advertencia sobre "No aplica" */}
            {tieneAdvertenciaNoAplica && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-red-800 mb-1">
                      Advertencia sobre el análisis de la dimensión
                    </h4>
                    <p className="text-sm text-red-700">
                      Debido a que los indicadores marcados como "No aplica" superan el 25% del puntaje total de la dimensión ({calcularPorcentajeNoAplica().toFixed(1)}%), esta dimensión no podrá ser analizada, como así tampoco ser incluida en el puntaje global. Puede continuar con el análisis, pero tenga en cuenta que los puntos de esta dimensión serán excluidos del cálculo del puntaje global del IMPGAI.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className={`bg-white rounded-lg shadow-sm border-2 ${colors.border} p-6`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-lg font-semibold ${colors.textDark}`}>Puntaje Total: {dimensionScore}/{adjustedMaxScore}</h3>
                  <p className="text-sm text-gray-600">
                    {adjustedMaxScore > 0 ? Math.round((dimensionScore / adjustedMaxScore) * 100) : 0}% completado
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                       {isComplete && currentDimensionIndex < filteredDimensiones.length - 1 && (
                  <button
                    onClick={guardarYContinuar}
                    className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${colors.dark} text-white hover:opacity-90`}
                  >
                    Guardar y Continuar
                  </button>
                )}
                
                       {isComplete && currentDimensionIndex === filteredDimensiones.length - 1 && (
                  <button
                    onClick={guardarYContinuar}
                    className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${colors.dark} text-white hover:opacity-90`}
                  >
                    Guardar y Finalizar
                  </button>
                )}
                
                {!isComplete && (
                  <button
                    disabled
                    className="w-full py-3 px-6 rounded-lg font-medium bg-gray-300 text-gray-500 cursor-not-allowed"
                  >
                    Complete todas las preguntas para continuar
                  </button>
                )}
              </div>
              
              {!isComplete && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Complete todas las preguntas para continuar
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
