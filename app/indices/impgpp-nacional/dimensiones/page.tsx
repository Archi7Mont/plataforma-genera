"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { dimensiones } from "../data/impgpp-nacional-data";
import { calcularPuntajeDimension, calcularPuntajeMaximoDimension, validarCondiciones, puntajeDe, maxPuntaje } from "../utils/impgpp";
import { ChevronDownIcon, AlertTriangleIcon, AlertCircleIcon, CheckIcon } from "lucide-react";

// Función para obtener colores según la dimensión
const getLocalDimensionColors = (dimensionId: string) => {
  const colorMap: { [key: string]: { dark: string; textDark: string; light: string } } = {
    "A": {
      dark: "bg-orange-400",
      textDark: "text-orange-700", 
      light: "bg-orange-50"
    },
    "B": {
      dark: "bg-green-400",
      textDark: "text-green-700",
      light: "bg-green-50"
    },
    "C": {
      dark: "bg-blue-400", 
      textDark: "text-blue-700",
      light: "bg-blue-50"
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

export default function DimensionesPage() {
  const router = useRouter();
  const [configuracion, setConfiguracion] = useState<any>(null);
  const [openSubdimensions, setOpenSubdimensions] = useState<{ [key: string]: boolean }>({});
  const [respuestas, setRespuestas] = useState<{ [key: string]: string }>({});
  const [currentDimensionId, setCurrentDimensionId] = useState<string>("A");

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

  const isDimensionCompleted = useCallback((dimensionId: string) => {
    const dimension = dimensiones.find(d => d.id === dimensionId);
    if (!dimension) return false;

    return dimension.subdimensiones.every((subdim: any) =>
      subdim.indicadores.every((indicador: any) => {
        const isEnabled = isIndicadorEnabled(indicador);
        const valor = respuestas[indicador.id];
        return !isEnabled || (valor && valor !== '');
      })
    );
  }, [respuestas]);

  const isCurrentDimensionCompleted = useMemo(() => {
    return isDimensionCompleted(currentDimensionId);
  }, [isDimensionCompleted, currentDimensionId]);

  const isLastDimension = currentDimensionId === 'C'; // IMPGPP Nacional has 3 dimensions: A, B, C

  const isUnanswered = (indicador: any): boolean => {
    const isEnabled = isIndicadorEnabled(indicador);
    const valor = respuestas[indicador.id];
    return isEnabled && (!valor || valor === '');
  };

  const hasUnansweredQuestionsInCurrentDimension = useMemo(() => {
    const currentDimension = dimensiones.find(d => d.id === currentDimensionId);
    if (!currentDimension) return false;

    return currentDimension.subdimensiones.some((subdim) =>
      subdim.indicadores.some((indicador) => isUnanswered(indicador))
    );
  }, [currentDimensionId, respuestas]);

  const handleSaveAndNavigate = () => {
    if (isCurrentDimensionCompleted) {
      if (isLastDimension) {
        // Finalizar evaluación
        localStorage.setItem('impgpp_respuestas', JSON.stringify(respuestas));
        localStorage.setItem('impgpp_fecha', new Date().toLocaleDateString());
        router.push('/indices/impgpp-nacional/resultados');
      } else {
        // Ir a la siguiente dimensión
        const dimensionIds = ['A', 'B', 'C'];
        const currentIndex = dimensionIds.indexOf(currentDimensionId);
        const nextDimension = dimensionIds[currentIndex + 1];
        setCurrentDimensionId(nextDimension);
      }
    }
  };

  const handleGoBack = () => {
    const dimensionIds = ['A', 'B', 'C'];
    const currentIndex = dimensionIds.indexOf(currentDimensionId);
    if (currentIndex > 0) {
      const previousDimension = dimensionIds[currentIndex - 1];
      setCurrentDimensionId(previousDimension);
    }
  };

  if (!configuracion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

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
            const colors = getLocalDimensionColors(dimension.id);
            const dimensionScore = calculateDimensionScore(dimension);
            const maxScore = calculateDimensionMaxScore(dimension);
            const isCompleted = isDimensionCompleted(dimension.id);
            
            return (
              <button
                key={dimension.id}
                onClick={() => setCurrentDimensionId(dimension.id)}
                className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? `${colors.dark} text-white shadow-md` 
                    : `${colors.light} ${colors.textDark} hover:${colors.light.replace('50', '100')}`
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {dimension.id}. {dimension.nombre}
                    </div>
                    <div className={`text-sm ${isActive ? 'text-white/80' : colors.textDark}`}>
                      {dimensionScore}/{maxScore} puntos
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
            <div>
              <h1 className="text-2xl font-bold text-teal-700">Dimensiones de Evaluación IMP-GPP</h1>
              <p className="text-gray-600 mt-1">
                Política Pública: <strong>{configuracion.politicaPublicaAuditada}</strong>
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/indices/impgpp-nacional/configuracion')}
                className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ChevronDownIcon className="w-4 h-4 mr-1 rotate-90" />
                Volver a Configuración
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="space-y-6">
            {(() => {
              const currentDimension = dimensiones.find(d => d.id === currentDimensionId);
              if (!currentDimension) return null;
              
              const colors = getLocalDimensionColors(currentDimension.id);
              const dimensionScore = calculateDimensionScore(currentDimension);
              const maxScore = calculateDimensionMaxScore(currentDimension);
              const percentage = maxScore > 0 ? Math.round((dimensionScore / maxScore) * 100) : 0;
              
              return (
                <div key={currentDimension.id} className={`bg-white rounded-lg shadow-sm border-2 ${colors.dark.replace('bg-', 'border-')} overflow-hidden`}>
                  {/* Dimension Header */}
                  <div className={`${colors.dark} px-6 py-4 border-b ${colors.dark.replace('bg-', 'border-')}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className={`text-xl font-semibold text-white`}>
                          {currentDimension.id}. {currentDimension.nombre}
                        </h2>
                        <p className={`text-sm text-white/80 mt-1`}>
                          Puntaje: {dimensionScore}/{maxScore} ({percentage}%)
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold text-white`}>
                          {percentage}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Subdimensions */}
                  <div className="p-6">
                    <div className="space-y-4">
                      {currentDimension.subdimensiones.map((subdimension) => {
                        const isOpen = openSubdimensions[subdimension.id];
                        const subdimensionScore = calculateSubdimensionScore(subdimension);
                        const subdimensionMaxScore = calculateSubdimensionMaxScore(subdimension);

                        return (
                          <div key={subdimension.id} className={`border rounded-lg ${colors.light.replace('bg-', 'border-')}`}>
                            {/* Subdimension Header */}
                            <button
                              onClick={() => toggleSubdimension(subdimension.id)}
                              className={`w-full ${colors.light} px-4 py-3 text-left hover:bg-opacity-80 transition-colors`}
                            >
                              <div className="flex items-center justify-between">
                                <h3 className={`font-medium ${colors.textDark}`}>
                                  {subdimension.id}. {subdimension.nombre}
                                </h3>
                                <div className="flex items-center space-x-2">
                                  <span className={`text-sm ${colors.textDark}`}>
                                    Puntaje: {subdimensionScore}/{subdimensionMaxScore}
                                  </span>
                                  <ChevronDownIcon 
                                    className={`w-4 h-4 ${colors.textDark} transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                  />
                                </div>
                              </div>
                            </button>

                            {/* Indicators */}
                            {isOpen && (
                              <div className="p-4 space-y-4">
                                {subdimension.indicadores.map((indicador) => {
                                  const puedeResponder = validarCondiciones(indicador, respuestas);
                                  const respuestaActual = respuestas[indicador.id] || '';
                                  const currentScore = getOptionScore(indicador.opciones, respuestaActual);
                                  const maxScore = getMaxScore(indicador.opciones);
                                  const unanswered = isUnanswered(indicador);

                                  return (
                                    <div key={indicador.id} className={`bg-gray-50 rounded-lg p-4 ${unanswered ? 'border-2 border-red-300 shadow-red-100' : 'border border-gray-200'}`}>
                                      <div className="mb-3">
                                        <h4 className="font-medium text-gray-900 mb-2">
                                          {indicador.id}. {indicador.texto}
                                          {unanswered && (
                                            <span className="text-red-500 ml-1 font-bold text-lg">*</span>
                                          )}
                                        </h4>
                                        <div className={`${colors.textDark} text-sm font-medium`}>
                                          Puntaje: {respuestaActual ? currentScore : '-'}/{maxScore}
                                        </div>
                                      </div>
                                      
                                      {unanswered && (
                                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm flex items-start">
                                          <AlertCircleIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                                          Esta pregunta requiere una respuesta para continuar.
                                        </div>
                                      )}
                                      
                                      <div className="space-y-2">
                                        <select
                                          value={respuestaActual}
                                          onChange={(e) => handleRespuestaChange(indicador.id, e.target.value)}
                                          disabled={!puedeResponder}
                                          className={`w-full p-3 border rounded-lg text-sm transition-colors ${
                                            !puedeResponder
                                              ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                              : respuestaActual === ''
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
                </div>
              );
            })()}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {currentDimensionId !== 'A' && (
                <button
                  onClick={handleGoBack}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  ← Anterior
                </button>
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Resumen de Evaluación</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Dimensión {currentDimensionId} de 3
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <button
                onClick={handleSaveAndNavigate}
                disabled={!isCurrentDimensionCompleted}
                className={`px-6 py-2 rounded-md transition-all duration-200 ${
                  !isCurrentDimensionCompleted
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-teal-600 text-white hover:bg-teal-700'
                }`}
              >
                {isLastDimension ? 'Guardar y Finalizar' : 'Guardar y Seguir'}
              </button>
              {!isCurrentDimensionCompleted && (
                <div className="text-xs text-gray-500 mt-1 text-right max-w-48">
                  Complete todas las preguntas de esta dimensión para continuar
                </div>
              )}
              {isCurrentDimensionCompleted && !isLastDimension && (
                <div className="text-xs text-gray-500 mt-1 text-right max-w-48">
                  Continuar a la siguiente dimensión
                </div>
              )}
              {isCurrentDimensionCompleted && isLastDimension && (
                <div className="text-xs text-gray-500 mt-1 text-right max-w-48">
                  Finalizar evaluación y ver resultados
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}