
"use client";

import { useState, useEffect, useMemo } from "react";
import { dimensiones } from "../data/impgai-regional-data";
import { calcularPuntajeDimension } from "../utils/impgai";
import { rangosPuntajes, getNivelDimension as getNivelDimensionRangos } from "../config/rangos";
// import { clasificarDimensiones, clasificarGlobalPorPuntaje } from "../utils/impgai-niveles";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronDownIcon } from "lucide-react";

// Tipos y configuraciones del segundo código
type DimensionId = 'A' | 'B' | 'C' | 'D' | 'E';

interface RangeConfig {
  min: number;
  max: number;
}

interface DimensionRanges {
  inicial: RangeConfig;
  medio: RangeConfig;
  avanzado: RangeConfig;
}

type DimensionRangesConfig = {
  [key in DimensionId]: DimensionRanges;
};

interface LevelColorScheme {
  bg: string;
  dot: string;
  text: string;
}

type LevelColors = {
  Inicial: LevelColorScheme;
  Medio: LevelColorScheme;
  Avanzado: LevelColorScheme;
}

// Configuraciones de colores y rangos del segundo código
const DIMENSION_RANGES: DimensionRangesConfig = {
  'A': {
    inicial: { min: 0, max: 25 },
    medio: { min: 26, max: 74 },
    avanzado: { min: 75, max: 100 }
  },
  'B': {
    inicial: { min: 0, max: 55 },
    medio: { min: 56, max: 80 },
    avanzado: { min: 81, max: 100 }
  },
  'C': {
    inicial: { min: 0, max: 50 },
    medio: { min: 51, max: 79 },
    avanzado: { min: 80, max: 100 }
  },
  'D': {
    inicial: { min: 0, max: 50 },
    medio: { min: 51, max: 89 },
    avanzado: { min: 90, max: 100 }
  },
  'E': {
    inicial: { min: 0, max: 50 },
    medio: { min: 51, max: 75 },
    avanzado: { min: 76, max: 100 }
  }
};

const LEVEL_COLORS: LevelColors = {
  Inicial: { bg: '#FFE5E5', dot: '#FF4444', text: '#CC0000' },
  Medio: { bg: '#FFF4E5', dot: '#FFA500', text: '#CC7A00' },
  Avanzado: { bg: '#EFFFEF', dot: '#2ECC71', text: '#27AE60' }
};

// Función para obtener colores de dimensión
const getDimensionColors = (dimensionId: string) => {
  const colorMap: { [key: string]: { hex: string; light: string } } = {
    'A': { hex: '#8B5CF6', light: 'bg-purple-50' },
    'B': { hex: '#10B981', light: 'bg-emerald-50' },
    'C': { hex: '#F59E0B', light: 'bg-amber-50' },
    'D': { hex: '#EF4444', light: 'bg-red-50' },
    'E': { hex: '#3B82F6', light: 'bg-blue-50' },
  };
  return colorMap[dimensionId] || { hex: '#6B7280', light: 'bg-gray-50' };
};

export default function ResultadosPage() {
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [fecha, setFecha] = useState<string>("");
  const [configInfo, setConfigInfo] = useState<any>({});
  const [filteredDimensiones, setFilteredDimensiones] = useState(dimensiones);

  useEffect(() => {
    // Cargar respuestas desde localStorage
    const respuestasGuardadas = localStorage.getItem('impgai_respuestas');
    const fechaGuardada = localStorage.getItem('impgai_fecha');
    const configuracion = localStorage.getItem('impgai_configuracion');
    
    console.log('Loading results page...', { respuestasGuardadas, fechaGuardada, configuracion });
    
    if (respuestasGuardadas) {
      setRespuestas(JSON.parse(respuestasGuardadas));
      console.log('Responses loaded:', JSON.parse(respuestasGuardadas));
    }
    
    if (fechaGuardada) {
      setFecha(new Date(fechaGuardada).toLocaleDateString('es-ES'));
    }

    // Cargar configuración y filtrar dimensiones
    if (configuracion) {
      const config = JSON.parse(configuracion);
      setConfigInfo(config);
      console.log('Configuración cargada en resultados:', config);
      
      if (config.modalidad === 'completa') {
        // Si es auditoría completa, mostrar todas las dimensiones
        setFilteredDimensiones(dimensiones);
        console.log('Usando todas las dimensiones (auditoría completa)');
      } else if (config.dimensionesSeleccionadas && config.dimensionesSeleccionadas.length > 0) {
        // Si hay dimensiones específicas seleccionadas, filtrar
        const filtered = dimensiones.filter(d => config.dimensionesSeleccionadas.includes(d.id));
        setFilteredDimensiones(filtered);
        console.log('Dimensiones filtradas en resultados:', filtered);
        console.log('Dimensiones seleccionadas:', config.dimensionesSeleccionadas);
      } else {
        // Si no hay configuración válida, usar todas las dimensiones
        setFilteredDimensiones(dimensiones);
        console.log('No hay configuración válida, usando todas las dimensiones');
      }
    } else {
      // Si no hay configuración, usar todas las dimensiones
      setFilteredDimensiones(dimensiones);
      console.log('No hay configuración guardada, usando todas las dimensiones');
    }
  }, []);

  const [expandedDimensions, setExpandedDimensions] = useState<{ [key: string]: boolean }>({});

  // Mostrar loading si no hay respuestas aún
  if (Object.keys(respuestas).length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando resultados...</p>
          <p className="text-sm text-gray-500 mt-2">Versión actualizada - Cargando datos del usuario</p>
          <p className="text-xs text-gray-400 mt-1">Si no se cargan los datos, verifique que completó todas las dimensiones</p>
        </div>
      </div>
    );
  }

  // Calcular resultados de forma simple
  const puntajeTotal = filteredDimensiones.reduce((total, dim) => {
    const puntajeDim = calcularPuntajeDimension(dim, respuestas);
    return total + puntajeDim;
  }, 0) / filteredDimensiones.length;

  const obtenerClasificacion = (puntaje: number): string => {
    if (puntaje >= 80) return 'Avanzado';
    if (puntaje >= 60) return 'Medio';
    return 'Inicial';
  };

  // Función simplificada para obtener nivel
  const getNivelGlobal = (porcentaje: number): { nivel: string; color: string } => {
    const g = (rangosPuntajes && rangosPuntajes.global) || {
      inicial:  { porcentaje: { min: 0,   max: 46.1 } },
      medio:    { porcentaje: { min: 46.2, max: 79.5 } },
      avanzado: { porcentaje: { min: 79.6, max: 100 } },
    } as any;
    let nivel: 'Inicial' | 'Medio' | 'Avanzado' = 'Inicial';
    if (porcentaje >= g.avanzado.porcentaje.min) nivel = 'Avanzado';
    else if (porcentaje >= g.medio.porcentaje.min) nivel = 'Medio';
    const color = nivel === 'Avanzado' ? '#10B981' : nivel === 'Medio' ? '#F59E0B' : '#EF4444';
    return { nivel, color };
  };

  const getNivelDimension = (dimensionNombre: string, porcentaje: number): { nivel: string; color: string } => {
    const nivel = typeof getNivelDimensionRangos === 'function'
      ? getNivelDimensionRangos(dimensionNombre, porcentaje)
      : (porcentaje >= 80 ? 'Avanzado' : porcentaje >= 60 ? 'Medio' : 'Inicial');
    const color = nivel === 'Avanzado' ? '#10B981' : nivel === 'Medio' ? '#F59E0B' : '#EF4444';
    return { nivel, color };
  };

  const toggleDimension = (dimensionId: string) => {
    setExpandedDimensions(prev => ({
      ...prev,
      [dimensionId]: !prev[dimensionId]
    }));
  };

  const calcularPuntajeSubdimension = (subdimension: any, respuestas: any) => {
    let puntaje = 0;
    
    // Verificar que subdimension e indicadores existan
    if (!subdimension || !subdimension.indicadores || !Array.isArray(subdimension.indicadores)) {
      console.warn('Subdimension o indicadores no válidos en calcularPuntajeSubdimension:', subdimension);
      return 0;
    }
    
    subdimension.indicadores.forEach((indicador: any) => {
      const valor = respuestas[indicador.id];
      if (valor && valor !== 'No aplica') {
        const puntajeIndicador = indicador.opciones.find((opcion: any) => opcion.valor === valor)?.puntaje || 0;
        puntaje += puntajeIndicador;
      }
    });
    return puntaje;
  };

  const calcularPuntajeMaximoSubdimension = (subdimension: any, respuestas: any) => {
    let puntajeMaximo = 0;
    
    // Verificar que subdimension e indicadores existan
    if (!subdimension || !subdimension.indicadores || !Array.isArray(subdimension.indicadores)) {
      console.warn('Subdimension o indicadores no válidos:', subdimension);
      return 0;
    }
    
    subdimension.indicadores.forEach((indicador: any) => {
      const respuesta = respuestas[indicador.id];
      if (respuesta !== 'No aplica') {
        const maxPuntaje = Math.max(...indicador.opciones
          .filter((opcion: any) => opcion.valor !== 'No aplica')
          .map((opcion: any) => opcion.puntaje || 0));
        puntajeMaximo += maxPuntaje;
      }
    });
    return puntajeMaximo;
  };

  // Verificar que filteredDimensiones tenga la estructura correcta
  console.log('Filtered dimensiones en resultados:', filteredDimensiones);
  console.log('Primera dimensión:', filteredDimensiones[0]);
  
  // Función para calcular el porcentaje de "No aplica" en una dimensión
  const calcularPorcentajeNoAplica = (dimension: any) => {
    let totalIndicadores = 0;
    let noAplicaIndicadores = 0;
    
    dimension.subdimensiones.forEach((subdimension: any) => {
      subdimension.indicadores.forEach((indicador: any) => {
        totalIndicadores++;
        const respuesta = respuestas[indicador.id];
        if (respuesta === 'No aplica') {
          noAplicaIndicadores++;
        }
      });
    });
    
    return totalIndicadores > 0 ? (noAplicaIndicadores / totalIndicadores) * 100 : 0;
  };

  // Separar dimensiones en aplicables y no aplicables
  const dimensionesAplicables = filteredDimensiones.filter(dim => {
    const porcentajeNoAplica = calcularPorcentajeNoAplica(dim);
    return porcentajeNoAplica <= 25; // Solo incluir si menos del 25% son "No aplica"
  });

  const dimensionesNoAplicables = filteredDimensiones.filter(dim => {
    const porcentajeNoAplica = calcularPorcentajeNoAplica(dim);
    return porcentajeNoAplica > 25; // Incluir si más del 25% son "No aplica"
  });
  
  const calcularPuntajeMaximoDimension = (dimension: any) => {
    let puntajeMaximo = 0;
    
    if (!dimension || !dimension.subdimensiones) {
      console.warn('Dimensión inválida en calcularPuntajeMaximoDimension:', dimension);
      return 0;
    }
    
    dimension.subdimensiones.forEach((subdimension: any) => {
      if (subdimension && subdimension.indicadores) {
        subdimension.indicadores.forEach((indicador: any) => {
          if (indicador && indicador.opciones) {
            const maxPuntaje = Math.max(...indicador.opciones
              .filter((opcion: any) => opcion.valor !== 'No aplica')
              .map((opcion: any) => opcion.puntaje || 0));
            puntajeMaximo += maxPuntaje;
          }
        });
      }
    });
    
    return puntajeMaximo;
  };

  // Calcular valores globales solo con dimensiones aplicables
  const totalPuntos = dimensionesAplicables.reduce((total, dim) => {
    if (!dim || !dim.subdimensiones) {
      console.warn('Dimensión inválida:', dim);
      return total;
    }
    return total + calcularPuntajeDimension(dim, respuestas);
  }, 0);
  
  const maxPuntos = dimensionesAplicables.reduce((total, dim) => {
    if (!dim || !dim.subdimensiones) {
      console.warn('Dimensión inválida en maxPuntos:', dim);
      return total;
    }
    return total + calcularPuntajeMaximoDimension(dim);
  }, 0);
  
  const porcentajeGlobal = maxPuntos > 0 ? (totalPuntos / maxPuntos) * 100 : 0;
  const nivelGlobal = getNivelGlobal(porcentajeGlobal);

  // Recopilar indicadores "No aplica" con contexto
  const indicadoresNoAplica: Array<{dimensionId: string; dimensionNombre: string; subdimensionId: string; subdimensionNombre: string; indicadorId: string; texto: string; }>= [];
  filteredDimensiones.forEach(dim => {
    dim.subdimensiones.forEach((sd: any) => {
      sd.indicadores.forEach((ind: any) => {
        if (respuestas[ind.id] === 'No aplica') {
          indicadoresNoAplica.push({
            dimensionId: dim.id,
            dimensionNombre: dim.nombre,
            subdimensionId: sd.id,
            subdimensionNombre: sd.nombre,
            indicadorId: ind.id,
            texto: ind.pregunta || ind.texto || ''
          });
        }
      })
    })
  });

  // Funciones de exportación
  const exportToPDF = async () => {
    const { jsPDF } = await import('jspdf');
    // Obtener información de configuración
    const configuracion = localStorage.getItem('impgai_configuracion');
    let configInfo: any = {};
    if (configuracion) {
      configInfo = JSON.parse(configuracion);
    }
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 48;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const addPageIfNeeded = (needed: number) => {
      if (y + needed > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    const writeWrapped = (text: string, x: number, maxWidth: number, lineHeight = 14, color = '#4B5563', fontSize = 11) => {
      doc.setTextColor(color);
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach((line: string) => {
        addPageIfNeeded(lineHeight);
        doc.text(line, x, y);
        y += lineHeight;
      });
    };

    // Header
    doc.setFontSize(20); doc.setTextColor('#8350EB');
    doc.text('Géner.A.', pageWidth/2, y, { align: 'center' }); y += 20;
    doc.setFontSize(12); doc.setTextColor('#6B7280');
    doc.text('Herramienta para auditar con perspectiva de género', pageWidth/2, y, { align: 'center' }); y += 16;
    doc.text('IMPGAI - Índice de Medición de la Perspectiva de Género en el Ámbito Institucional', pageWidth/2, y, { align: 'center' }); y += 24;

    // Config (wrapped columns)
    const configBoxHeight = 180;
    doc.setDrawColor('#E5E7EB'); doc.setFillColor('#F9FAFB');
    doc.roundedRect(margin, y, contentWidth, configBoxHeight, 6, 6, 'FD');
    doc.setTextColor('#374151'); doc.setFontSize(13);
    doc.text('Información de Configuración', margin + 16, y + 22);
    doc.setFontSize(11); doc.setTextColor('#4B5563');
    const leftColX = margin + 16;
    const rightColX = margin + contentWidth / 2 + 8;
    const colWidth = contentWidth / 2 - 24;
    let yLeft = y + 40;
    let yRight = y + 40;
    const confLeft = [
      `País: ${configInfo.pais || 'No especificado'}`,
      `Entidad Fiscalizadora: ${configInfo.entidadFiscalizadora || 'No especificado'}`,
      `Institución Auditada: ${configInfo.institucionAuditada || 'No especificado'}`,
    ];
    const confRight = [
      `Año/Período Auditado: ${configInfo.anoPeriodoAuditado || 'No especificado'}`,
      `Modalidad: ${configInfo.modalidad === 'completa' ? 'Auditoría pura con perspectiva de género' : 'Auditoría de género por dimensión'}`,
      `Fecha de Evaluación: ${fecha}`,
    ];
    confLeft.forEach((t: string) => {
      const lines = doc.splitTextToSize(t, colWidth);
      lines.forEach((line: string) => { doc.text(line, leftColX, yLeft); yLeft += 14; });
      yLeft += 2;
    });
    confRight.forEach((t: string) => {
      const lines = doc.splitTextToSize(t, colWidth);
      lines.forEach((line: string) => { doc.text(line, rightColX, yRight); yRight += 14; });
      yRight += 2;
    });
    y = Math.max(yLeft, yRight) + 12;

    // Global results
    doc.setFillColor('#F0F9FF'); doc.setDrawColor('#0EA5E9');
    doc.roundedRect(margin, y, contentWidth, 100, 6, 6, 'FD');
    doc.setTextColor('#0C4A6E'); doc.setFontSize(13);
    doc.text('Resultados Globales', margin + 16, y + 22);
    doc.setTextColor('#8350EB'); doc.setFontSize(18);
    doc.text(`${totalPuntos.toFixed(0)}`, margin + 16, y + 50);
    doc.setTextColor('#6B7280'); doc.setFontSize(11);
    doc.text(`de ${maxPuntos.toFixed(0)} puntos posibles`, margin + 70, y + 50);
    doc.setTextColor('#8350EB'); doc.setFontSize(16);
    doc.text(`${porcentajeGlobal.toFixed(1)}%`, margin + contentWidth - 80, y + 50, { align: 'right' });
    doc.setTextColor(nivelGlobal.color); doc.setFontSize(12);
    doc.text(`Nivel: ${nivelGlobal.nivel}`, margin + 16, y + 74);
    y += 120;

    // Dimensions
    doc.setTextColor('#374151'); doc.setFontSize(13);
    doc.text('Resultados por Dimensión', margin, y); y += 16;
    filteredDimensiones.forEach(dim => {
      const puntajeDim = calcularPuntajeDimension(dim as any, respuestas);
      const puntajeMaxDim = calcularPuntajeMaximoDimension(dim as any);
          const porcentaje = puntajeMaxDim > 0 ? (puntajeDim / puntajeMaxDim) * 100 : 0;
          const { hex } = getDimensionColors(dim.id);
      addPageIfNeeded(40);
      // Header bar
      doc.setFillColor(hex);
      doc.rect(margin, y + 10, contentWidth, 6, 'F');
      doc.setTextColor('#111827'); doc.setFontSize(12);
      doc.text(`${dim.id}. ${dim.nombre}`, margin, y + 8);
      doc.setTextColor('#4B5563');
      doc.text(`${puntajeDim.toFixed(0)} / ${puntajeMaxDim.toFixed(0)} (${porcentaje.toFixed(1)}%)`, margin + contentWidth, y + 8, { align: 'right' });
      y += 30;

      // Subdimensions and indicators
      (dim as any).subdimensiones.forEach((sd: any) => {
        addPageIfNeeded(28);
        doc.setTextColor('#1F2937'); doc.setFontSize(12);
        doc.text(`${sd.id}. ${sd.nombre}`, margin, y); y += 6;
        doc.setDrawColor('#E5E7EB');
        doc.line(margin, y + 6, margin + contentWidth, y + 6); y += 18;

        sd.indicadores.forEach((ind: any) => {
          const respuesta = (respuestas as any)[ind.id];
          const opcionElegida = ind.opciones.find((op: any) => op.valor === respuesta);
          const max = Math.max(...ind.opciones.filter((op: any) => op.valor !== 'No aplica').map((op: any) => op.puntaje || 0));
          // Ensure we have space for at least the question block
          addPageIfNeeded(28);
          // Question
          writeWrapped(`${ind.id}. ${ind.pregunta || ind.texto}`, margin + 8, contentWidth - 16, 14, '#374151', 11);
          // Answer and points
          const detail = `Respuesta: ${respuesta || '—'}   Puntos: ${(opcionElegida?.puntaje || 0)} / ${max}`;
          writeWrapped(detail, margin + 20, contentWidth - 32, 13, '#6B7280', 10);
          y += 8;
          addPageIfNeeded(16);
        });
        y += 8;
      });

      y += 8;
    });

    // Not applicable
    if (indicadoresNoAplica.length) {
      doc.addPage(); y = margin;
      doc.setTextColor('#374151'); doc.setFontSize(13);
      doc.text('Indicadores No Aplica', margin, y); y += 14;
      doc.setFontSize(10); doc.setTextColor('#4B5563');
      indicadoresNoAplica.forEach(item => {
        const row = `${item.dimensionId} ${item.dimensionNombre} > ${item.subdimensionId} ${item.subdimensionNombre} > ${item.indicadorId}: ${item.texto}`;
        writeWrapped(row, margin, contentWidth, 12, '#4B5563', 10);
        y += 4;
      });
    }

    // Footer
    const footer = 'Desarrollado por EFSUR Argentina, Version 1.0';
    const footnote = 'Informe generado en el Sistema Informático Géner.A';
    const footerY = doc.internal.pageSize.getHeight() - 24;
    doc.setFontSize(9); doc.setTextColor('#6B7280');
    doc.text(footnote, pageWidth/2, footerY - 12, { align: 'center' });
    doc.text(footer, pageWidth/2, footerY, { align: 'center' });

    doc.save(`resultados-impgai-regional-${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const exportToExcel = async () => {
    const ExcelJS = await import('exceljs');
    // Obtener información de configuración
    const configuracion = localStorage.getItem('impgai_configuracion');
    let configInfo: any = {};
    if (configuracion) {
      configInfo = JSON.parse(configuracion);
    }

    // Crear workbook y hoja
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Resultados');

    worksheet.addRow(['Géner.A.']);
    worksheet.addRow(['Herramienta para auditar con perspectiva de género']);
    worksheet.addRow(['Índice de Medición de la Perspectiva de Género en el Ámbito Institucional']);
    worksheet.addRow(['']);
    worksheet.addRow(['INFORMACIÓN DE CONFIGURACIÓN']);
    worksheet.addRow(['País', configInfo.pais || 'No especificado']);
    worksheet.addRow(['Entidad Fiscalizadora', configInfo.entidadFiscalizadora || 'No especificado']);
    worksheet.addRow(['Institución Auditada', configInfo.institucionAuditada || 'No especificado']);
    worksheet.addRow(['Año/Período Auditado', configInfo.anoPeriodoAuditado || 'No especificado']);
    worksheet.addRow(['Modalidad', configInfo.modalidad === 'completa' ? 'Auditoría pura con perspectiva de género' : 'Auditoría de género por dimensión']);
    worksheet.addRow(['Fecha de Evaluación', fecha]);
    worksheet.addRow(['']);
    worksheet.addRow(['RESULTADOS GLOBALES']);
    worksheet.addRow(['Puntaje Global', totalPuntos.toFixed(0)]);
    worksheet.addRow(['Puntos Máximos', maxPuntos.toFixed(0)]);
    worksheet.addRow(['Porcentaje Global', `${porcentajeGlobal.toFixed(1)}%`]);
    worksheet.addRow(['Nivel Global', nivelGlobal.nivel]);
    worksheet.addRow(['']);
    worksheet.addRow(['RESULTADOS POR DIMENSIÓN']);
    worksheet.addRow(['Dimensión', 'Subdimensión', 'Indicador', 'Pregunta', 'Respuesta', 'Puntos', 'Máximo', 'Porcentaje / Nivel']);

    // Agregar dimensiones aplicables con subdimensiones e indicadores
    dimensionesAplicables.forEach(dim => {
      const puntajeDim = calcularPuntajeDimension(dim, respuestas);
      const puntajeMaxDim = calcularPuntajeMaximoDimension(dim);
      const porcentajeDim = puntajeMaxDim > 0 ? (puntajeDim / puntajeMaxDim) * 100 : 0;
      const nivelDim = getNivelDimension(dim.nombre, porcentajeDim);
      // Fila de cabecera de dimensión
      worksheet.addRow([`${dim.id}. ${dim.nombre}`, '', '', '', '', '', '', `${porcentajeDim.toFixed(1)}% / ${nivelDim.nivel}`]);

      (dim as any).subdimensiones.forEach((sd: any) => {
        const puntajeSubdim = calcularPuntajeSubdimension(sd, respuestas);
        const maxSubdim = calcularPuntajeMaximoSubdimension(sd, respuestas);
        const pctSubdim = maxSubdim > 0 ? (puntajeSubdim / maxSubdim) * 100 : 0;
        // Fila de subdimensión
        worksheet.addRow(['', `${sd.id}. ${sd.nombre}`, '', '', '', puntajeSubdim, maxSubdim, `${pctSubdim.toFixed(1)}%`]);
        // Indicadores
        sd.indicadores.forEach((ind: any) => {
          const respuesta = (respuestas as any)[ind.id];
          const opcion = ind.opciones.find((op: any) => op.valor === respuesta);
          const max = Math.max(...ind.opciones.filter((op: any) => op.valor !== 'No aplica').map((op: any) => op.puntaje || 0));
          worksheet.addRow(['', '', ind.id, ind.pregunta || ind.texto, respuesta || '—', opcion?.puntaje || 0, max, '']);
        });
      });
    });

    // Agregar dimensiones no aplicables
    dimensionesNoAplicables.forEach(dim => {
      const porcentajeNoAplica = calcularPorcentajeNoAplica(dim);
      worksheet.addRow([
        `${dim.id}. ${dim.nombre}`,
        '',
        '',
        '',
        '',
        '',
        '',
        `${porcentajeNoAplica.toFixed(1)}% No Aplica`
      ]);
    });

    // Agregar dimensiones seleccionadas si aplica
    if (configInfo.modalidad !== 'completa' && configInfo.dimensionesSeleccionadas) {
      worksheet.addRow(['']);
      worksheet.addRow(['DIMENSIONES SELECCIONADAS']);
      configInfo.dimensionesSeleccionadas.forEach((dimId: string) => {
        const dim = dimensiones.find(d => d.id === dimId);
        worksheet.addRow([`${dimId}. ${dim ? dim.nombre : 'Dimensión no encontrada'}`]);
      });
    }

    // Agregar sección No Aplica
    worksheet.addRow(['']);
    worksheet.addRow(['INDICADORES NO APLICA']);
    worksheet.addRow(['Dimensión', 'Subdimensión', 'Indicador', 'Pregunta']);
    indicadoresNoAplica.forEach(i => {
      worksheet.addRow([`${i.dimensionId}. ${i.dimensionNombre}`, `${i.subdimensionId}. ${i.subdimensionNombre}`, i.indicadorId, i.texto]);
    });

    // Save the file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const { saveAs } = await import('file-saver');
    saveAs(blob, `resultados-impgai-regional-${new Date().toISOString().slice(0,10)}.xlsx`);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center mb-4">
          <h1 className="text-4xl font-bold text-[#8350EB] mb-2">Resultados del análisis</h1>
          <p className="text-gray-600 text-lg">IMPGAI - Índice de Medición de la Perspectiva de Género en el Ámbito Institucional</p>
          </div>
          {/* Config resumen */}
          <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
            <h3 className="text-gray-800 font-semibold mb-3">Información de Configuración</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
              <div><span className="text-gray-500">País:</span> {configInfo.pais || 'No especificado'}</div>
              <div><span className="text-gray-500">Entidad Fiscalizadora:</span> {configInfo.entidadFiscalizadora || 'No especificado'}</div>
              <div><span className="text-gray-500">Institución Auditada:</span> {configInfo.institucionAuditada || 'No especificado'}</div>
              <div><span className="text-gray-500">Año/Período Auditado:</span> {configInfo.anoPeriodoAuditado || 'No especificado'}</div>
              <div><span className="text-gray-500">Modalidad:</span> {configInfo.modalidad === 'completa' ? 'Auditoría pura con perspectiva de género' : 'Auditoría de género por dimensión'}</div>
              <div><span className="text-gray-500">Fecha:</span> {fecha}</div>
            </div>
          </div>
        </div>

        {/* Puntaje Global */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Puntaje Global IMPGAI</h2>
              <div className="flex items-baseline gap-3">
                <p className="text-5xl font-bold text-[#8350EB]">{totalPuntos.toFixed(0)}</p>
                <p className="text-gray-500">de {maxPuntos.toFixed(0)} puntos posibles</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-right">
                <p className="text-3xl font-semibold text-[#8350EB]">
                  {porcentajeGlobal.toFixed(1)}%
                </p>
                <p className="text-gray-500">Porcentaje total</p>
              </div>
              <div className="bg-gray-100 rounded-lg p-3 min-w-[200px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Nivel de implementación:</span>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: nivelGlobal.color }}
                  />
                  <span 
                    className="font-semibold px-3 py-1 rounded-full text-sm"
                    style={{ 
                      backgroundColor: LEVEL_COLORS[nivelGlobal.nivel as keyof LevelColors].bg,
                      color: LEVEL_COLORS[nivelGlobal.nivel as keyof LevelColors].text
                    }}
                  >
                    {nivelGlobal.nivel}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="h-3 rounded-full transition-all duration-500"
              style={{ 
                width: `${porcentajeGlobal}%`,
                backgroundColor: nivelGlobal.color
              }}
            ></div>
          </div>
        </div>

        {/* Dimensiones Aplicables */}
        {dimensionesAplicables.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Dimensiones Evaluadas</h2>
            <div className="grid grid-cols-1 gap-6">
              {dimensionesAplicables.map((dimension) => {
            const puntajeDim = calcularPuntajeDimension(dimension, respuestas);
            const puntajeMaxDim = calcularPuntajeMaximoDimension(dimension);
            const porcentaje = puntajeMaxDim > 0 ? (puntajeDim / puntajeMaxDim) * 100 : 0;
            const { hex, light } = getDimensionColors(dimension.id);
            const { nivel: nivelDimension } = getNivelDimension(dimension.nombre, porcentaje);
            const isExpanded = expandedDimensions[dimension.id];
            
            return (
              <div key={dimension.id} className={`${light} rounded-xl shadow-lg overflow-hidden border border-opacity-20`} style={{ borderColor: hex }}>
                <div 
                  className="p-6 cursor-pointer"
                  onClick={() => toggleDimension(dimension.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold" style={{ color: hex }}>
                          Dimensión {dimension.id}
                        </h3>
                        <svg
                          className={`w-5 h-5 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                          style={{ color: hex }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      <p className="text-gray-600">{dimension.nombre}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex flex-col items-end">
                        <p className="text-3xl font-bold" style={{ color: hex }}>
                          {porcentaje.toFixed(1)}%
                        </p>
                        <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                          <span className="font-medium">{puntajeDim}</span>
                          <span>de</span>
                          <span>{puntajeMaxDim}</span>
                          <span>puntos</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full bg-white rounded-full h-2 mb-4">
                    <div 
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${porcentaje}%`, backgroundColor: hex }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div></div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ 
                          backgroundColor: LEVEL_COLORS[nivelDimension as keyof LevelColors].dot,
                          borderColor: LEVEL_COLORS[nivelDimension as keyof LevelColors].dot
                        }}
                      />
                      <span 
                        className="font-semibold px-3 py-1 rounded-full text-sm"
                        style={{
                          backgroundColor: LEVEL_COLORS[nivelDimension as keyof LevelColors].bg,
                          color: LEVEL_COLORS[nivelDimension as keyof LevelColors].text
                        }}
                      >
                        {nivelDimension}
                      </span>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-6 pt-0">
                    {dimension.subdimensiones.map((subdimension: any) => {
                      const puntajeSubdim = calcularPuntajeSubdimension(subdimension, respuestas);
                      const puntajeMaxSubdim = calcularPuntajeMaximoSubdimension(subdimension, respuestas);
                      const porcentajeSubdim = puntajeMaxSubdim > 0 ? ((puntajeSubdim / puntajeMaxSubdim) * 100).toFixed(1) : '0.0';
                      
                      return (
                        <div key={subdimension.id} className="mt-4 p-4 rounded-lg bg-white shadow-sm border border-gray-200">
                          <h4 className="text-lg font-semibold text-gray-800">
                            {subdimension.id}. {subdimension.nombre}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            Puntaje: {puntajeSubdim} / {puntajeMaxSubdim} ({porcentajeSubdim}%)
                          </p>
                          <div className="space-y-3 mt-4 text-sm">
                            {subdimension.indicadores.map((indicador: any) => {
                              const respuesta = respuestas[indicador.id];
                              const opcionElegida = indicador.opciones.find((op: any) => op.valor === respuesta);
                              
                              if (respuesta && respuesta !== 'No aplica') {
                                return (
                                  <div key={indicador.id} className="p-3 bg-gray-50 rounded-md border border-gray-100">
                                    <p><strong>{indicador.id}. {indicador.pregunta || indicador.texto}</strong></p>
                                    <p className="mt-1 ml-2 text-gray-700">
                                      Respuesta: <span className="font-medium">{respuesta}</span>
                                      <span className="ml-2 text-gray-500">
                                        (Puntos: {opcionElegida?.puntaje || 0} de {Math.max(...indicador.opciones.filter((op: any) => op.valor !== 'No aplica').map((op: any) => op.puntaje || 0))})
                                      </span>
                                    </p>
                                    {opcionElegida?.justificacion && (
                                      <p className="mt-1 ml-2 text-gray-600">
                                        Justificación: {opcionElegida.justificacion}
                                      </p>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            })}
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
        )}

        {/* Dimensiones No Aplicables */}
        {dimensionesNoAplicables.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Dimensiones No Aplicables</h2>
            <div className="grid grid-cols-1 gap-6">
              {dimensionesNoAplicables.map((dimension) => {
                const porcentajeNoAplica = calcularPorcentajeNoAplica(dimension);
                const { hex, light } = getDimensionColors(dimension.id);
                const isExpanded = expandedDimensions[dimension.id];
                
                return (
                  <div key={dimension.id} className={`${light} rounded-xl shadow-lg overflow-hidden border border-opacity-20`} style={{ borderColor: hex }}>
                    <div 
                      className="p-6 cursor-pointer"
                      onClick={() => toggleDimension(dimension.id)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-semibold" style={{ color: hex }}>
                              Dimensión {dimension.id}
                            </h3>
                            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                              No Aplica
                            </span>
                          </div>
                          <p className="text-gray-600 mt-1">{dimension.nombre}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-medium text-red-600">
                              {porcentajeNoAplica.toFixed(1)}% No Aplica
                            </p>
                            <p className="text-sm text-gray-500">No evaluable</p>
                          </div>
                          <ChevronDownIcon 
                            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                            style={{ color: hex }} 
                          />
                        </div>
                      </div>
                      
                      {/* Advertencia */}
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
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
                              Debido a que los indicadores marcados como "No aplica" superan el 25% del puntaje total de la dimensión ({porcentajeNoAplica.toFixed(1)}%), esta dimensión no podrá ser analizada, como así tampoco ser incluida en el puntaje global. Puede continuar con el análisis, pero tenga en cuenta que los puntos de esta dimensión serán excluidos del cálculo del puntaje global del IMPGAI.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-6 border-t border-opacity-20" style={{ borderColor: hex }}>
                        <div className="space-y-4">
                          {dimension.subdimensiones.map((subdimension: any) => (
                            <div key={subdimension.id}>
                              <h4 className="font-semibold text-gray-800 mb-2">{subdimension.id}. {subdimension.nombre}</h4>
                              <div className="space-y-3 pl-4">
                                {subdimension.indicadores.map((indicador: any) => {
                                  const respuesta = respuestas[indicador.id];
                                  
                                  return (
                                    <div key={indicador.id} className="p-3 bg-gray-50 rounded-md border border-gray-100">
                                      <p><strong>{indicador.id}. {indicador.pregunta || indicador.texto}</strong></p>
                                      <p className="mt-1 ml-2 text-gray-700">
                                        Respuesta: <span className="font-medium text-red-600">{respuesta || 'No respondido'}</span>
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Caja "No aplica" con indicadores listados */}
        {indicadoresNoAplica.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">No aplica</h2>
            <div className="bg-white rounded-xl shadow border border-gray-200">
              <div className="p-4 text-sm text-gray-600">
                Se listan los indicadores marcados como "No aplica" con su contexto.
              </div>
              <div className="divide-y">
                {indicadoresNoAplica.map((i, idx) => (
                  <div key={idx} className="p-4 text-sm bg-gray-50">
                    <div className="text-gray-800 font-medium mb-1">
                      {i.dimensionId}. {i.dimensionNombre} → {i.subdimensionId}. {i.subdimensionNombre}
                    </div>
                    <div className="text-gray-700">
                      <span className="font-mono mr-2">{i.indicadorId}</span>{i.texto}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Exportar Resultados */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Exportar Resultados</CardTitle>
            <CardDescription>Descargue el informe completo en diferentes formatos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <button 
                onClick={() => exportToPDF()} 
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                📄 Descargar PDF
              </button>
              <button 
                onClick={() => exportToExcel()} 
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
              >
                📊 Exportar Excel
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Navegación */}
        <div className="mt-8 flex justify-between">
          <a
            href="/indices/impgai-regional/dimensiones-advanced"
            className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Volver a Dimensiones
          </a>
          <a
            href="/indices/impgai-regional/configuracion-simple"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Empezar Nuevo Análisis
          </a>
        </div>
      </div>
    </div>
  );
}