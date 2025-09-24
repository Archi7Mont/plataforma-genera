"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { dimensiones } from "../data/impgpp-nacional-data";
import { calcularPuntajeDimension, calcularPuntajeMaximoDimension } from "../utils/impgpp";
import { getDimensionColors, getSubdimensionColors } from "../utils/dimensionUtils";
import { exportToPDF, exportToExcel, ExportData } from "../utils/exportUtils";
import { FileTextIcon, TableIcon } from "lucide-react";

type AuditConfig = {
  institucionAuditada: string;
  politicaPublicaAuditada: string;
  anoPeriodoAuditado: string;
};

function getScoreCategory(percentage: number): string {
  if (percentage >= 80) return "Avanzado";
  if (percentage >= 60) return "Medio";
  if (percentage >= 40) return "Inicial";
  return "Fuera de rango";
}

const LEVEL_COLORS = {
  Inicial: { bg: "#FFE5E5", dot: "#FF4444", text: "#CC0000" },
  Medio: { bg: "#FFF4E5", dot: "#FFA500", text: "#CC7A00" },
  Avanzado: { bg: "#EFFFEF", dot: "#2ECC71", text: "#27AE60" },
  "Fuera de rango": { bg: "#E5E7EB", dot: "#6B7280", text: "#4B5563" },
} as const;

export default function ResultadosPage() {
  const router = useRouter();
  const [configuracion, setConfiguracion] = useState<AuditConfig | null>(null);
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [fecha, setFecha] = useState<string>("");
  const [expandedSubdimensions, setExpandedSubdimensions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const storedConfig = localStorage.getItem('impgpp_configuracion');
    const storedRespuestas = localStorage.getItem('impgpp_respuestas');
    const storedFecha = localStorage.getItem('impgpp_fecha');

    if (storedConfig) {
      setConfiguracion(JSON.parse(storedConfig));
    } else {
      router.push('/indices/impgpp-nacional/configuracion');
      return;
    }

    if (storedRespuestas) {
      setRespuestas(JSON.parse(storedRespuestas));
    }

    if (storedFecha) {
      setFecha(storedFecha);
    }
  }, [router]);

  const resultados = useMemo(() => {
    if (!configuracion) return null;

    const dimensionesConPuntajes = dimensiones.map(dimension => {
      const puntaje = calcularPuntajeDimension(dimension, respuestas);
      const maxPuntaje = calcularPuntajeMaximoDimension(dimension);
      const porcentaje = maxPuntaje > 0 ? (puntaje / maxPuntaje) * 100 : 0;
      const categoria = getScoreCategory(porcentaje);

      return {
        ...dimension,
        puntaje,
        maxPuntaje,
        porcentaje,
        categoria
      };
    });

    const totalPuntos = dimensionesConPuntajes.reduce((total, dim) => total + dim.puntaje, 0);
    const maxPuntos = dimensionesConPuntajes.reduce((total, dim) => total + dim.maxPuntaje, 0);
    const porcentajeGlobal = maxPuntos > 0 ? (totalPuntos / maxPuntos) * 100 : 0;
    const categoriaGlobal = getScoreCategory(porcentajeGlobal);

    return {
      dimensiones: dimensionesConPuntajes,
      totalPuntos,
      maxPuntos,
      porcentajeGlobal,
      categoriaGlobal
    };
  }, [configuracion, respuestas]);

  const handleExportPDF = () => {
    if (!configuracion || !resultados) return;
    
    const exportData: ExportData = {
      configuracion,
      respuestas,
      fecha,
      resultados
    };
    
    exportToPDF(exportData);
  };

  const handleExportExcel = () => {
    if (!configuracion || !resultados) return;

    const exportData: ExportData = {
      configuracion,
      respuestas,
      fecha,
      resultados
    };

    exportToExcel(exportData);
  };

  const toggleSubdimension = (subdimensionId: string) => {
    setExpandedSubdimensions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subdimensionId)) {
        newSet.delete(subdimensionId);
      } else {
        newSet.add(subdimensionId);
      }
      return newSet;
    });
  };

  const handleResetAnalysis = () => {
    if (confirm('¿Está seguro de que desea reiniciar el análisis? Se perderán todos los datos ingresados.')) {
      // Clear all localStorage data
      localStorage.removeItem('impgpp_configuracion');
      localStorage.removeItem('impgpp_respuestas');
      localStorage.removeItem('impgpp_fecha');

      // Reset state
      setConfiguracion(null);
      setRespuestas({});
      setFecha("");

      // Navigate to configuration
      router.push('/indices/impgpp-nacional/configuracion');
    }
  };

  if (!configuracion || !resultados) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando resultados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-teal-100 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-teal-700">Resultados IMP-GPP</h1>
              <div className="text-gray-600 mt-2 space-y-1">
                <p>
                  Organismo Auditado: <strong>{configuracion.institucionAuditada}</strong>
                </p>
                <p>
                  Política Pública: <strong>{configuracion.politicaPublicaAuditada}</strong>
                </p>
                <p>
                  Período Auditado: <strong>{configuracion.anoPeriodoAuditado}</strong>
                </p>
                <p>
                  Fecha de Evaluación: <strong>{new Date(fecha).toLocaleDateString('es-ES')}</strong>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/indices/impgpp-nacional/dimensiones')}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Atrás
              </button>
              <button
                onClick={handleResetAnalysis}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Reiniciar Análisis
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Global Results */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Resultados Globales</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-600">
                {resultados.totalPuntos.toFixed(0)}
              </div>
              <div className="text-sm text-gray-600">Puntos Obtenidos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600">
                {resultados.maxPuntos.toFixed(0)}
              </div>
              <div className="text-sm text-gray-600">Puntos Máximos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-600">
                {resultados.porcentajeGlobal.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Porcentaje Global</div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              LEVEL_COLORS[resultados.categoriaGlobal as keyof typeof LEVEL_COLORS]?.bg || 'bg-gray-100'
            }`}>
              <span className={`w-2 h-2 rounded-full mr-2 ${
                LEVEL_COLORS[resultados.categoriaGlobal as keyof typeof LEVEL_COLORS]?.dot || 'bg-gray-400'
              }`}></span>
              <span className={`${
                LEVEL_COLORS[resultados.categoriaGlobal as keyof typeof LEVEL_COLORS]?.text || 'text-gray-600'
              }`}>
                {resultados.categoriaGlobal}
              </span>
            </span>
          </div>
        </div>

        {/* No Aplica Summary */}
        {(() => {
          const noAplicaIndicators: Array<{
            dimension: string;
            subdimension: string;
            indicador: string;
            id: string;
          }> = [];
          resultados.dimensiones.forEach((dimension: any) => {
            dimension.subdimensiones.forEach((subdimension: any) => {
              subdimension.indicadores.forEach((indicador: any) => {
                if (respuestas[indicador.id] === 'No aplica') {
                  noAplicaIndicators.push({
                    dimension: dimension.nombre,
                    subdimension: subdimension.nombre,
                    indicador: indicador.texto,
                    id: indicador.id
                  });
                }
              });
            });
          });

          if (noAplicaIndicators.length > 0) {
            return (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
                <h2 className="text-lg font-semibold text-yellow-800 mb-4">
                  Indicadores Marcados como "No Aplica"
                </h2>
                <div className="space-y-3">
                  {noAplicaIndicators.map((item, index) => (
                    <div key={index} className="bg-white border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {item.id}. {item.indicador}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {item.dimension} → {item.subdimension}
                          </div>
                        </div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          No Aplica
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-sm text-yellow-700">
                  <strong>Nota:</strong> Los indicadores marcados como "No aplica" no contribuyen al puntaje total de la evaluación.
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Dimension Results */}
        <div className="space-y-6">
          {resultados.dimensiones.map((dimension) => {
            const colors = getDimensionColors(dimension.id);
            const levelColors = LEVEL_COLORS[dimension.categoria as keyof typeof LEVEL_COLORS];

            return (
              <div key={dimension.id} className={`bg-white rounded-lg shadow-sm border-2 ${colors.border} overflow-hidden`}>
                <div className={`${colors.bg} px-6 py-4 border-b ${colors.border}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-lg font-semibold ${colors.textDark}`}>
                        {dimension.id}. {dimension.nombre}
                      </h3>
                      <p className={`text-sm ${colors.text} mt-1`}>
                        Puntaje: {dimension.puntaje}/{dimension.maxPuntaje} ({dimension.porcentaje.toFixed(1)}%)
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${colors.textDark}`}>
                        {dimension.porcentaje.toFixed(1)}%
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        levelColors?.bg || 'bg-gray-100'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1 ${
                          levelColors?.dot || 'bg-gray-400'
                        }`}></span>
                        <span className={`${
                          levelColors?.text || 'text-gray-600'
                        }`}>
                          {dimension.categoria}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                  <div className="p-6">
                    <div className="space-y-4">
                      {dimension.subdimensiones.map((subdimension) => {
                        const subColors = getSubdimensionColors(dimension.id, subdimension.id);
                        const isExpanded = expandedSubdimensions.has(subdimension.id);

                        return (
                          <div key={subdimension.id} className={`border rounded-lg ${subColors.border}`}>
                            <button
                              onClick={() => toggleSubdimension(subdimension.id)}
                              className={`${subColors.bg} px-4 py-3 w-full text-left hover:opacity-90 transition-opacity border-b ${subColors.border}`}
                            >
                              <div className="flex items-center justify-between">
                                <h4 className={`font-medium ${subColors.textDark}`}>
                                  {subdimension.id}. {subdimension.nombre}
                                </h4>
                                <div className="flex items-center space-x-2">
                                  <span className={`text-sm ${subColors.textDark}`}>
                                    {subdimension.indicadores.length} indicadores
                                  </span>
                                  <svg
                                    className={`w-4 h-4 ${subColors.textDark} transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="p-4 bg-white">
                                <div className="space-y-3">
                                  {subdimension.indicadores.map((indicador) => {
                                    const respuesta = respuestas[indicador.id];
                                    const opcion = indicador.opciones.find(op => op.valor === respuesta);
                                    const isNoAplica = respuesta === 'No aplica';

                                    return (
                                      <div key={indicador.id} className={`rounded-lg p-3 ${
                                        isNoAplica ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
                                      }`}>
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <p className="text-sm text-gray-900 mb-2">
                                              {indicador.id}. {indicador.texto}
                                            </p>
                                            <div className="flex items-center space-x-2">
                                              <span className="text-sm text-gray-600">Respuesta:</span>
                                              <span className={`text-sm font-medium ${
                                                isNoAplica ? 'text-yellow-800' : 'text-gray-900'
                                              }`}>
                                                {respuesta || 'Sin respuesta'}
                                              </span>
                                              {opcion && !isNoAplica && (
                                                <span className="text-sm text-gray-500">
                                                  ({opcion.puntaje} puntos)
                                                </span>
                                              )}
                                              {isNoAplica && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                  No Aplica
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
              </div>
            );
          })}
        </div>

        {/* Export Buttons */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Exportar Resultados</h3>
              <p className="text-sm text-gray-600 mt-1">
                Descarga los resultados en PDF o Excel con toda la información de la evaluación
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleExportPDF}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                <FileTextIcon className="w-4 h-4 mr-2" />
                Exportar PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <TableIcon className="w-4 h-4 mr-2" />
                Exportar Excel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}