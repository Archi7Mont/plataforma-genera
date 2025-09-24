"use client";

import { useState } from "react";

export default function TestIndicadoresPage() {
  const [currentDimensionId, setCurrentDimensionId] = useState<string>("A");

  const getDimensionColors = (dimensionId: string) => {
    const colorMap = {
      "A": {
        dimension: "bg-orange-600",
        dimensionLight: "bg-orange-50",
        text: "text-orange-800",
        textLight: "text-orange-600"
      },
      "B": {
        dimension: "bg-green-600", 
        dimensionLight: "bg-green-50",
        text: "text-green-800",
        textLight: "text-green-600"
      },
      "C": {
        dimension: "bg-blue-600",
        dimensionLight: "bg-blue-50", 
        text: "text-blue-800",
        textLight: "text-blue-600"
      }
    };
    
    return colorMap[dimensionId as keyof typeof colorMap] || colorMap["A"];
  };

  const dimensions = [
    { id: 'A', nombre: 'Formulación y Diseño' },
    { id: 'B', nombre: 'Implementación' },
    { id: 'C', nombre: 'Evaluación y Monitoreo' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Navigation Sidebar */}
      <div className="w-80 bg-white shadow-lg border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Dimensiones</h2>
        </div>
        
        <nav className="p-4 space-y-2">
          {dimensions.map((dimension) => {
            const isActive = dimension.id === currentDimensionId;
            const colors = getDimensionColors(dimension.id);
            
            return (
              <button
                key={dimension.id}
                onClick={() => setCurrentDimensionId(dimension.id)}
                className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? `${colors.dimension} text-white shadow-md` 
                    : `${colors.dimensionLight} ${colors.text} hover:${colors.dimensionLight.replace('50', '100')}`
                }`}
              >
                <div className="font-medium">
                  {dimension.id}. {dimension.nombre}
                </div>
                <div className={`text-sm ${isActive ? 'text-white/80' : colors.textLight}`}>
                  {Math.floor(Math.random() * 100)}/{Math.floor(Math.random() * 100)} puntos
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Test - Indicadores Page
          </h1>
          <p className="text-gray-600">
            Current Dimension: {currentDimensionId}
          </p>
        </div>
        
        <div className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Elegant Color Palette Test
            </h2>
            <p className="text-gray-600">
              This page demonstrates the elegant color palette with proper hierarchy:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>• <strong>Dimension A (Orange):</strong> bg-orange-600 → bg-orange-100 → bg-orange-50</li>
              <li>• <strong>Dimension B (Green):</strong> bg-green-600 → bg-green-100 → bg-green-50</li>
              <li>• <strong>Dimension C (Blue):</strong> bg-blue-600 → bg-blue-100 → bg-blue-50</li>
            </ul>
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> Click on different dimensions in the left sidebar to see the color changes.
                The active dimension is highlighted with the darker color, while inactive dimensions use lighter tones.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

