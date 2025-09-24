"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { dimensiones } from "../data/impgai-nacional-data";

export default function ConfiguracionPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    entidadFiscalizadora: "",
    institucionAuditada: "",
    anoPeriodoAuditado: "",
    modalidad: "",
    dimensionesSeleccionadas: [] as string[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.entidadFiscalizadora ||
      !formData.institucionAuditada ||
      !formData.anoPeriodoAuditado ||
      !formData.modalidad
    ) {
      alert("Por favor complete todos los campos obligatorios");
      return;
    }

    if (formData.modalidad === "dimension") {
      if (formData.dimensionesSeleccionadas.length === 0) {
        alert("Por favor seleccione al menos una dimensión");
        return;
      }
      if (formData.dimensionesSeleccionadas.length > 4) {
        alert(
          'No puede seleccionar más de 4 dimensiones. Si desea evaluar todas las dimensiones, seleccione la modalidad "Auditoría pura con perspectiva de género"'
        );
        return;
      }
    }

    // ✅ Guardar configuración en localStorage
    localStorage.setItem('impgai_nacional_configuracion', JSON.stringify({
      entidadFiscalizadora: formData.entidadFiscalizadora,
      institucionAuditada: formData.institucionAuditada,
      anoPeriodoAuditado: formData.anoPeriodoAuditado,
      modalidad: formData.modalidad,
      dimensionesSeleccionadas: formData.dimensionesSeleccionadas
    }));

    // ✅ Si todo está OK, avanzar a Dimensiones
    router.push("/indices/impgai-nacional/dimensiones");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "modalidad" && value === "completa"
        ? { dimensionesSeleccionadas: [] }
        : {}),
    }));
  };

  const handleDimensionChange = (dimensionId: string) => {
    setFormData((prev) => {
      const isSelected = prev.dimensionesSeleccionadas.includes(dimensionId);
      let newDimensiones: string[];

      if (isSelected) {
        newDimensiones = prev.dimensionesSeleccionadas.filter((id) => id !== dimensionId);
      } else {
        if (prev.dimensionesSeleccionadas.length >= 4) {
          alert(
            'No puede seleccionar más de 4 dimensiones. Si desea evaluar todas las dimensiones, seleccione la modalidad "Auditoría pura con perspectiva de género"'
          );
          return prev;
        }
        newDimensiones = [...prev.dimensionesSeleccionadas, dimensionId];
      }

      return { ...prev, dimensionesSeleccionadas: newDimensiones };
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-[#8350EB] mb-8 text-center">
            Configuración de la aplicación del IMPGAI nacional
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Entidad Fiscalizadora <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="entidadFiscalizadora"
                value={formData.entidadFiscalizadora}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                placeholder="Ingrese el nombre de la entidad fiscalizadora"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Organismo Auditado <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="institucionAuditada"
                value={formData.institucionAuditada}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                placeholder="Ingrese el nombre del organismo auditado"
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
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                placeholder="Ej: 2023, Enero-Marzo"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Modalidad de Aplicación del IMPGAI <span className="text-red-500">*</span>
              </label>
              <select
                name="modalidad"
                value={formData.modalidad}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                required
              >
                <option value="">Seleccione una modalidad</option>
                <option value="dimension">Auditoría de género por dimensión</option>
                <option value="completa">Auditoría pura con perspectiva de género</option>
              </select>
            </div>

            {formData.modalidad === "dimension" && (
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Dimensiones <span className="text-red-500">*</span>
                  <span className="text-sm text-gray-500 ml-2">(Máximo 4)</span>
                </label>
                <div className="space-y-2">
                  {dimensiones.map((dim) => (
                    <div key={dim.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`dimension-${dim.id}`}
                        checked={formData.dimensionesSeleccionadas.includes(dim.id)}
                        onChange={() => handleDimensionChange(dim.id)}
                        className="w-4 h-4 text-[#8350EB] border-gray-300 rounded focus:ring-purple-200"
                      />
                      <label htmlFor={`dimension-${dim.id}`} className="ml-2 text-gray-700">
                        Dimensión {dim.id}: {dim.nombre}
                      </label>
                    </div>
                  ))}
                </div>
                {formData.dimensionesSeleccionadas.length > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Dimensiones seleccionadas: {formData.dimensionesSeleccionadas.length}/4
                  </p>
                )}
              </div>
            )}

            <div className="pt-4 flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-md hover:bg-gray-600 transition-colors font-medium"
              >
                Atrás
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#8350EB] text-white py-3 px-6 rounded-md hover:bg-opacity-90 transition-colors font-medium"
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