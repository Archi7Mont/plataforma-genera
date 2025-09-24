"use client"

import React, { useState, useMemo, useCallback } from "react"
import { HomeIcon, ChevronLeftIcon } from "@heroicons/react/24/solid"
import type { DimensionPageProps } from "../types/props"
import type { Respuestas, Indicador } from "../types"
import {
  getDimensionColors,
  getIndicatorScore,
  getIndicatorMaxScore,
  INDICATOR_SCORES,
  formatScore,
} from "../utils/dimensionUtils"

const DimensionPage: React.FC<DimensionPageProps> = ({
  dimension,
  onBack,
  onContinue,
  onHome,
  respuestas,
  setRespuestas,
  currentDimensionIndex,
  totalDimensions,
}) => {
  const [openSubdimensions, setOpenSubdimensions] = useState<{ [key: string]: boolean }>({})

  // Indicadores que deben tener "No aplica" por defecto
  const defaultNoAplicaIndicators = ["A.1.2", "B.4.2", "B.4.3", "C.1.2", "D.1.2"]

  // Initialize default values for specific indicators
  React.useEffect(() => {
    const newRespuestas = { ...respuestas }
    let hasChanges = false

    defaultNoAplicaIndicators.forEach((indicatorId) => {
      if (!(indicatorId in newRespuestas)) {
        newRespuestas[indicatorId] = "No aplica"
        hasChanges = true
      }
    })

    if (hasChanges) {
      setRespuestas(newRespuestas)
    }
  }, [dimension.id, setRespuestas])

  const toggleSubdimension = (subdimId: string) => {
    setOpenSubdimensions((prev) => ({
      ...prev,
      [subdimId]: !prev[subdimId],
    }))
  }

  const handleRespuestaChange = (indicadorId: string, valor: string) => {
    setRespuestas((prev: Respuestas) => ({
      ...prev,
      [indicadorId]: valor,
    }))
  }

  const isIndicadorEnabled = (indicador: Indicador): boolean => {
    if (!indicador.condicion) return true

    const dependsOnValue = respuestas[indicador.condicion.dependeDe]
    if (indicador.condicion.valoresRequeridos) {
      return indicador.condicion.valoresRequeridos.includes(dependsOnValue)
    }
    return dependsOnValue === indicador.condicion.valorRequerido
  }

  const getConditionMessage = (indicador: any) => {
    if (!indicador.condicion) return null

    if (indicador.condicion.valoresRequeridos) {
      return `Este indicador sólo puede ser medido si el Indicador ${indicador.condicion.dependeDe} tiene uno de los siguientes valores: ${indicador.condicion.valoresRequeridos.join(" u ")}`
    }
    return `Este indicador sólo puede ser medido si el Indicador ${indicador.condicion.dependeDe} tiene el valor: ${indicador.condicion.valorRequerido}`
  }

  const calculateSubdimensionScore = useCallback(
    (subdim: any) => {
      return subdim.indicadores.reduce((acc: number, indicador: any) => {
        const valor = respuestas[indicador.id]
        if (valor && valor !== "No aplica") {
          return acc + getIndicatorScore(indicador.id, valor)
        }
        return acc
      }, 0)
    },
    [respuestas],
  )

  const calculateSubdimensionMaxScore = useCallback(
    (subdim: any) => {
      return subdim.indicadores.reduce((acc: number, indicador: any) => {
        const valor = respuestas[indicador.id]
        if (valor !== "No aplica") {
          return acc + getIndicatorMaxScore(indicador.id, valor)
        }
        return acc
      }, 0)
    },
    [respuestas],
  )

  const dimensionScore = useMemo(() => {
    return dimension.subdimensiones.reduce((acc: number, subdim: any) => {
      return acc + calculateSubdimensionScore(subdim)
    }, 0)
  }, [dimension.subdimensiones, calculateSubdimensionScore])

  const dimensionMaxScore = useMemo(() => {
    return dimension.subdimensiones.reduce((acc: number, subdim: any) => {
      return acc + calculateSubdimensionMaxScore(subdim)
    }, 0)
  }, [dimension.subdimensiones, calculateSubdimensionMaxScore])

  const getAvailableOptions = (indicadorId: string) => {
    const scores = INDICATOR_SCORES[indicadorId]
    if (!scores) return []

    return Object.entries(scores)
      .filter(([valor]) => valor !== "No aplica") // Put 'No aplica' at the end
      .sort((a, b) => (a[1] || 0) - (b[1] || 0)) // Sort by score
      .concat([["No aplica", null]])
      .map(([valor, puntos]) => ({
        valor,
        puntos: puntos === null ? "-" : puntos,
      }))
  }

  const { dark, textDark, light } = getDimensionColors(dimension.id)

  // --- CORRECCIÓN ACÁ ---
  // Se corrigió la sintaxis de useCallback y se aseguró que el reduce devuelva un número.
  const calculateTotalMaxScore = useCallback(() => {
    return dimension.subdimensiones.reduce((acc, subdim) => {
      return (
        acc +
        subdim.indicadores.reduce((subAcc, indicador) => {
          return subAcc + getIndicatorMaxScore(indicador.id, "Avanzado")
        }, 0)
      )
    }, 0)
  }, [dimension.subdimensiones])

  const calculateNoAplicaScore = useCallback(() => {
    return dimension.subdimensiones.reduce((acc, subdim) => {
      return (
        acc +
        subdim.indicadores.reduce((subAcc, indicador) => {
          const valor = respuestas[indicador.id]
          if (valor === "No aplica") {
            return subAcc + getIndicatorMaxScore(indicador.id, "Avanzado")
          }
          return subAcc
        }, 0)
      )
    }, 0)
  }, [dimension.subdimensiones, respuestas])

  // --- CORRECCIÓN ACÁ ---
  // useMemo para calcular el porcentaje de 'No aplica' y el estado de la advertencia
  const noAplicaPercentage = useMemo(() => {
    const totalMaxScore = calculateTotalMaxScore()
    const noAplicaScore = calculateNoAplicaScore()
    if (totalMaxScore === 0) return 0
    return (noAplicaScore / totalMaxScore) * 100
  }, [calculateTotalMaxScore, calculateNoAplicaScore])

  const showNoAplicaWarning = useMemo(() => {
    return noAplicaPercentage > 25
  }, [noAplicaPercentage])

  const handleContinueClick = () => {
    // La advertencia ya está calculada, solo la pasamos a la función onContinue
    onContinue({
      excludeFromTotal: showNoAplicaWarning,
      noAplicaPercentage,
    })
  }

  // FUNCION DE AYUDA PARA CHEQUEAR SI EL INDICADOR NO ESTÁ CONTESTADO-
  const isUnanswered = (indicador: any): boolean => {
    const isEnabled = isIndicadorEnabled(indicador)
    const valor = respuestas[indicador.id]
    // Por default "No aplica" indicadores, son considerados no respondidos
    if (defaultNoAplicaIndicators.includes(indicador.id)) {
      return false
    }
    return isEnabled && (!valor || valor === "")
  }

  // Check if all required questions are answered
  const hasUnansweredQuestions = useMemo(() => {
    return dimension.subdimensiones.some((subdim) => subdim.indicadores.some((indicador) => isUnanswered(indicador)))
  }, [dimension.subdimensiones, respuestas])

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-purple-700">
          <span className="text-2xl font-semibold">Dimensión {dimension.id}:</span> {dimension.nombre}
        </h2>
        <div className="text-sm text-gray-600">
          Dimensión {currentDimensionIndex + 1} de {totalDimensions}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-purple-300 rounded-lg text-purple-700 font-semibold hover:bg-purple-50 transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5" />
          Volver
        </button>
        <button
          onClick={onHome}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-purple-300 rounded-lg text-purple-700 font-semibold hover:bg-purple-50 transition-colors"
        >
          <HomeIcon className="w-5 h-5" />
          Configuración
        </button>
      </div>

      <div className="space-y-4">
        {dimension.subdimensiones.map((subdim) => {
          const subdimensionScore = calculateSubdimensionScore(subdim)
          const subdimensionMaxScore = calculateSubdimensionMaxScore(subdim)

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
                <svg
                  className={`w-6 h-6 text-white transform transition-transform duration-200 ${
                    openSubdimensions[subdim.id] ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openSubdimensions[subdim.id] && (
                <div className={`p-6 space-y-6 ${light}`}>
                  {subdim.indicadores.map((indicador) => {
                    const isEnabled = isIndicadorEnabled(indicador)
                    const conditionMessage = getConditionMessage(indicador)
                    const valor = respuestas[indicador.id] || ""
                    const currentScore = getIndicatorScore(indicador.id, valor)
                    const maxScore = getIndicatorMaxScore(indicador.id, valor)
                    const options = getAvailableOptions(indicador.id)
                    const unanswered = isUnanswered(indicador)
                    const isDefaultNoAplica = defaultNoAplicaIndicators.includes(indicador.id)

                    return (
                      <div
                        key={indicador.id}
                        className={`bg-white rounded-lg p-6 shadow-sm transition-all duration-200 ${
                          !isEnabled ? "opacity-75" : ""
                        } ${unanswered ? "border-2 border-red-300 shadow-red-100" : "border border-gray-200"}`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <p className="text-gray-800 flex-grow">
                            <span className={`font-medium ${textDark} ${unanswered ? "relative" : ""}`}>
                              Indicador {indicador.id}:
                              {unanswered && <span className="text-red-500 ml-1 font-bold text-lg">*</span>}
                            </span>{" "}
                            {indicador.texto}
                            {isDefaultNoAplica && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Criterio específico
                              </span>
                            )}
                          </p>
                          <div className={`${textDark} text-sm font-medium ml-4`}>
                            Puntaje: {formatScore(valor, currentScore)}/{maxScore}
                          </div>
                        </div>

                        {unanswered && (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                            <svg className="inline w-4 h-4 mr-2 -mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Esta pregunta requiere una respuesta para continuar.
                          </div>
                        )}

                        {conditionMessage && !isEnabled && (
                          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 text-sm">
                            <svg className="inline w-5 h-5 mr-2 -mt-1" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {conditionMessage}
                          </div>
                        )}

                        <div className={`${!isEnabled ? "pointer-events-none" : ""}`}>
                          <select
                            value={valor}
                            onChange={(e) => handleRespuestaChange(indicador.id, e.target.value)}
                            disabled={!isEnabled}
                            className={`w-full p-2 border rounded-md ${textDark} focus:ring-2 focus:ring-opacity-50 focus:ring-current disabled:bg-gray-100 transition-all duration-200 ${
                              unanswered ? "border-red-300 focus:border-red-400 focus:ring-red-200" : ""
                            }`}
                          >
                            {isDefaultNoAplica ? (
                              <>
                                {options.map(({ valor, puntos }) => (
                                  <option key={valor} value={valor}>
                                    {valor}{" "}
                                    {puntos !== "-" ? `(${puntos} ${Number(puntos) === 1 ? "punto" : "puntos"})` : ""}
                                  </option>
                                ))}
                              </>
                            ) : (
                              <>
                                <option value="">Seleccionar categoría</option>
                                {options.map(({ valor, puntos }) => (
                                  <option key={valor} value={valor}>
                                    {valor}{" "}
                                    {puntos !== "-" ? `(${puntos} ${Number(puntos) === 1 ? "punto" : "puntos"})` : ""}
                                  </option>
                                ))}
                              </>
                            )}
                          </select>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-8">
        {showNoAplicaWarning && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
            <div className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="font-semibold">Advertencia sobre el análisis de la dimensión</p>
                <p className="mt-1">
                  Debido a que los indicadores marcados como "No aplica" superan el 25% del puntaje total de la
                  dimensión ({noAplicaPercentage.toFixed(1)}%), esta dimensión no podrá ser analizada, como así tampoco
                  ser incluida en el puntaje global. Puede continuar con el análisis, pero tenga en cuenta que los
                  puntos de esta dimensión serán excluidos del cálculo del puntaje global del IMPGAI.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div>
            <div className={`${textDark} text-lg font-semibold`}>
              Puntaje Total: {dimensionScore}/{dimensionMaxScore}
            </div>
            {showNoAplicaWarning && (
              <div className="text-sm text-yellow-700 mt-1">Esta dimensión será excluida del puntaje global</div>
            )}
          </div>
          <div className="flex flex-col items-end">
            <button
              onClick={handleContinueClick}
              disabled={hasUnansweredQuestions}
              className={`px-6 py-2 rounded-md transition-all duration-200 ${
                hasUnansweredQuestions
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : `${dark} text-white hover:opacity-90`
              }`}
            >
              {currentDimensionIndex === totalDimensions - 1 ? "Finalizar" : "Guardar y Continuar"}
            </button>
            {hasUnansweredQuestions && (
              <div className="text-xs text-gray-500 mt-1 text-right max-w-48">
                Complete todas las preguntas para continuar
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DimensionPage
