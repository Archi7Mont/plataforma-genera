"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

// Renombramos la interfaz para evitar conflictos con FormData global del DOM
interface ConfigFormData {
  pais: string;
  entidadFiscalizadora: string;
  institucionAuditada: string;
  politicaPublicaAuditada: string;
  anoPeriodoAuditado: string;
}

export default function ConfiguracionPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState<ConfigFormData>({
    pais: "",
    entidadFiscalizadora: "",
    institucionAuditada: "",
    politicaPublicaAuditada: "",
    anoPeriodoAuditado: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validamos que los campos no estén vacíos
    if (Object.values(formData).some(value => value === '')) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    // Guardar configuración en localStorage
    localStorage.setItem('impgpp_configuracion', JSON.stringify(formData));
    
    console.log('Configuración guardada:', formData);
    console.log('Navegando a dimensiones...');

    // Navegar a dimensiones
    console.log('Attempting navigation to dimensions...');
    router.push("/indices/impgpp-regional/dimensiones");
    
    // Fallback navigation
    setTimeout(() => {
      window.location.href = "/indices/impgpp-regional/dimensiones";
    }, 100);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Configuración del IMPGPP Regional
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                País <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="pais"
                value={formData.pais}
                onChange={handleInputChange}
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all duration-200 hover:border-purple-300"
                placeholder="Ingrese el país"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Entidad Fiscalizadora <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="entidadFiscalizadora"
                value={formData.entidadFiscalizadora}
                onChange={handleInputChange}
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all duration-200 hover:border-purple-300"
                placeholder="Ingrese el nombre de la entidad"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Institución Pública Auditada <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="institucionAuditada"
                value={formData.institucionAuditada}
                onChange={handleInputChange}
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all duration-200 hover:border-purple-300"
                placeholder="Ingrese el nombre de la institución"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Política Pública Auditada <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="politicaPublicaAuditada"
                value={formData.politicaPublicaAuditada}
                onChange={handleInputChange}
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all duration-200 hover:border-purple-300"
                placeholder="Ingrese el nombre de la política pública"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Periodo auditado <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="anoPeriodoAuditado"
                value={formData.anoPeriodoAuditado}
                onChange={handleInputChange}
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all duration-200 hover:border-purple-300"
                placeholder="Ej: 2023, Enero-Marzo"
                required
              />
            </div>

            <div className="pt-4 flex gap-4">
              <button
                type="button"
                onClick={() => router.push('/indices/impgpp-regional')}
                className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-md hover:bg-gray-600 transition-colors font-medium"
              >
                Atrás
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Empezar análisis
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}