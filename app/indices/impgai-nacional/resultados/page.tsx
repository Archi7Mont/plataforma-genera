
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { dimensiones } from "../data/impgai-nacional-data";
import { calcularPuntajeDimension } from "../utils/impgai";
// import { clasificarDimensiones, clasificarGlobalPorPuntaje } from "../utils/impgai-niveles";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronDownIcon } from "lucide-react";
import jsPDF from 'jspdf';
import ExcelJS from 'exceljs';
// @ts-ignore
import { saveAs } from 'file-saver';

// Tipos y configuraciones del segundo código
type DimensionId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

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
  },
  'F': {
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
    'A': { hex: '#10B981', light: 'bg-green-50' }, // Marco Legal - Green
    'B': { hex: '#3B82F6', light: 'bg-blue-50' }, // Gestión de Personas - Blue
    'C': { hex: '#EF4444', light: 'bg-red-50' }, // Cultura Organizacional - Red
    'D': { hex: '#6B7280', light: 'bg-gray-50' }, // Planificación - Gray
    'E': { hex: '#06B6D4', light: 'bg-cyan-50' }, // Participación Ciudadana - Light Blue
    'F': { hex: '#F59E0B', light: 'bg-orange-50' }, // Mejora Continua - Orange
  };
  return colorMap[dimensionId] || { hex: '#6B7280', light: 'bg-gray-50' };
};

export default function ResultadosPage() {
  const router = useRouter();
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [fecha, setFecha] = useState<string>("");
  const [filteredDimensiones, setFilteredDimensiones] = useState(dimensiones);
  const [configuracion, setConfiguracion] = useState<any>(null);

  useEffect(() => {
    // Cargar respuestas desde localStorage
    const respuestasGuardadas = localStorage.getItem('impgai_respuestas');
    const fechaGuardada = localStorage.getItem('impgai_fecha');
    const configuracionGuardada = localStorage.getItem('impgai_nacional_configuracion');
    
    console.log('Loading results page...', { respuestasGuardadas, fechaGuardada, configuracionGuardada });
    
    if (respuestasGuardadas) {
      setRespuestas(JSON.parse(respuestasGuardadas));
      console.log('Responses loaded:', JSON.parse(respuestasGuardadas));
    }
    
    if (fechaGuardada) {
      setFecha(new Date(fechaGuardada).toLocaleDateString('es-ES'));
    }

    // Cargar configuración y filtrar dimensiones
    if (configuracionGuardada) {
      const config = JSON.parse(configuracionGuardada);
      setConfiguracion(config);
      console.log('Configuración cargada en resultados:', config);
      
      if (config.modalidad === 'completa') {
        // Si es auditoría completa, mostrar todas las dimensiones
        setFilteredDimensiones(dimensiones);
        console.log('Usando todas las dimensiones (auditoría completa)');
      } else if (config.dimensionesSeleccionadas && config.dimensionesSeleccionadas.length > 0) {
        // Si hay dimensiones específicas seleccionadas, filtrar
        const filtered = dimensiones.filter((d: any) => config.dimensionesSeleccionadas.includes(d.id));
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
  const puntajeTotal = filteredDimensiones.reduce((total: number, dim: any) => {
    const puntajeDim = calcularPuntajeDimension(dim, respuestas);
    return total + puntajeDim;
  }, 0) / filteredDimensiones.length;

  const obtenerClasificacion = (puntaje: number): string => {
    if (puntaje >= 80) return 'Avanzado';
    if (puntaje >= 60) return 'Medio';
    return 'Inicial';
  };

  // Función simplificada para obtener nivel
  const getNivelGlobal = (puntaje: number): { nivel: string; color: string } => {
    if (puntaje >= 80) return { nivel: 'Avanzado', color: '#10B981' };
    if (puntaje >= 60) return { nivel: 'Medio', color: '#F59E0B' };
    return { nivel: 'Inicial', color: '#EF4444' };
  };

  const getNivelDimension = (puntaje: number): { nivel: string; color: string } => {
    if (puntaje >= 80) return { nivel: 'Avanzado', color: '#10B981' };
    if (puntaje >= 60) return { nivel: 'Medio', color: '#F59E0B' };
    return { nivel: 'Inicial', color: '#EF4444' };
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

  // Funciones de exportación
  const exportToPDF = () => {
    // datos de configuración
    const configStr = localStorage.getItem('impgai_nacional_configuracion');
    const configInfo = configStr ? JSON.parse(configStr) : {};

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

    // Título
    doc.setFontSize(20); doc.setTextColor('#8350EB');
    doc.text('Géner.A.', pageWidth/2, y, { align: 'center' }); y += 20;
    doc.setFontSize(12); doc.setTextColor('#6B7280');
    doc.text('IMPGAI Nacional - Índice de Medición de la Perspectiva de Género', pageWidth/2, y, { align: 'center' }); y += 24;

    // Caja configuración
    const configBoxHeight = 180;
    doc.setDrawColor('#E5E7EB'); doc.setFillColor('#F9FAFB');
    doc.roundedRect(margin, y, contentWidth, configBoxHeight, 6, 6, 'FD');
    doc.setTextColor('#374151'); doc.setFontSize(13);
    doc.text('Información de Configuración', margin + 16, y + 22);
    doc.setFontSize(11); doc.setTextColor('#4B5563');
    const leftX = margin + 16, rightX = margin + contentWidth/2 + 8; const colW = contentWidth/2 - 24; let yL = y + 40, yR = y + 40;
    const leftItems = [
      `Entidad Fiscalizadora: ${configInfo.entidadFiscalizadora || 'No especificado'}`,
      `Organismo Auditado: ${configInfo.institucionAuditada || 'No especificado'}`,
      `Período Auditado: ${configInfo.anoPeriodoAuditado || 'No especificado'}`,
    ];
    const rightItems = [
      `Modalidad: ${configInfo.modalidad === 'completa' ? 'Auditoría pura con perspectiva de género' : 'Auditoría de género por dimensión'}`,
      `Fecha de Evaluación: ${fecha}`,
      configInfo.modalidad !== 'completa' && configInfo.dimensionesSeleccionadas ? `Dimensiones Seleccionadas: ${configInfo.dimensionesSeleccionadas.length} de 6` : ''
    ].filter(Boolean);
    leftItems.forEach((t: string) => { doc.text(doc.splitTextToSize(t, colW) as any, leftX, yL); yL += 28; });
    rightItems.forEach((t: string) => { doc.text(doc.splitTextToSize(t as string, colW) as any, rightX, yR); yR += 28; });
    y = Math.max(yL, yR) + 12;

    // Caja resultados globales
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

    // Caja dimensiones con subdimensiones e indicadores
    doc.setTextColor('#374151'); doc.setFontSize(13);
    doc.text('Resultados por Dimensión', margin, y); y += 16;
    filteredDimensiones.forEach((dim: any) => {
      const puntajeDim = calcularPuntajeDimension(dim, respuestas);
      const puntajeMaxDim = calcularPuntajeMaximoDimension(dim);
      const porcentaje = puntajeMaxDim > 0 ? (puntajeDim / puntajeMaxDim) * 100 : 0;
      const { hex } = getDimensionColors(dim.id);

      addPageIfNeeded(40);
      doc.setFillColor(hex); doc.rect(margin, y + 10, contentWidth, 6, 'F');
      doc.setTextColor('#111827'); doc.setFontSize(12); doc.text(`${dim.id}. ${dim.nombre}`, margin, y + 8);
      doc.setTextColor('#4B5563'); doc.text(`${puntajeDim.toFixed(0)} / ${puntajeMaxDim.toFixed(0)} (${porcentaje.toFixed(1)}%)`, margin + contentWidth, y + 8, { align: 'right' });
      y += 30;

      (dim.subdimensiones || []).forEach((sd: any) => {
        addPageIfNeeded(28);
        doc.setTextColor('#1F2937'); doc.setFontSize(12); doc.text(`${sd.id}. ${sd.nombre}`, margin, y); y += 6;
        doc.setDrawColor('#E5E7EB'); doc.line(margin, y + 6, margin + contentWidth, y + 6); y += 18;

        (sd.indicadores || []).forEach((ind: any) => {
          const respuesta = respuestas[ind.id];
          const opcion = ind.opciones.find((op: any) => op.valor === respuesta);
          const max = Math.max(...ind.opciones.filter((op: any) => op.valor !== 'No aplica').map((op: any) => op.puntaje || 0));
          addPageIfNeeded(28);
          writeWrapped(`${ind.id}. ${ind.pregunta || ind.texto}`, margin + 8, contentWidth - 16, 14, '#374151', 11);
          writeWrapped(`Respuesta: ${respuesta || '—'}   Puntos: ${(opcion?.puntaje || 0)} / ${max}`, margin + 20, contentWidth - 32, 13, '#6B7280', 10);
          y += 8; addPageIfNeeded(16);
        });
        y += 8;
      });

      y += 8;
    });

    // Caja No aplica (indicadores)
    const noAplica: Array<{dimensionId:string; dimensionNombre:string; subdimensionId:string; subdimensionNombre:string; indicadorId:string; texto:string;}> = [];
    filteredDimensiones.forEach((d: any) => d.subdimensiones.forEach((sd: any) => sd.indicadores.forEach((ind: any) => {
      if (respuestas[ind.id] === 'No aplica') noAplica.push({ dimensionId: d.id, dimensionNombre: d.nombre, subdimensionId: sd.id, subdimensionNombre: sd.nombre, indicadorId: ind.id, texto: ind.pregunta || ind.texto });
    })));
    if (noAplica.length) {
      doc.addPage(); y = margin;
      doc.setTextColor('#374151'); doc.setFontSize(13); doc.text('Indicadores No Aplica', margin, y); y += 14;
      noAplica.forEach((it) => {
        const row = `${it.dimensionId} ${it.dimensionNombre} > ${it.subdimensionId} ${it.subdimensionNombre} > ${it.indicadorId}: ${it.texto}`;
        writeWrapped(row, margin, contentWidth, 12, '#4B5563', 10); y += 4;
      });
    }

    // Footer
    const foot1 = 'Informe generado en el Sistema Informático Géner.A';
    const foot2 = 'Desarrollado por EFSUR Argentina, Version 1.0';
    const footerY = pageHeight - 24;
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i); doc.setFontSize(9); doc.setTextColor('#6B7280');
      doc.text(foot1, pageWidth/2, footerY - 12, { align: 'center' });
      doc.text(foot2, pageWidth/2, footerY, { align: 'center' });
    }

    doc.save(`IMPGAI_Nacional_Resultados_${(configInfo.institucionAuditada || 'Sin_Nombre').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const exportToExcel = async () => {
    // datos de configuración
    const configStr = localStorage.getItem('impgai_nacional_configuracion');
    const configInfo = configStr ? JSON.parse(configStr) : {};

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Resultados');

    worksheet.addRow(['Géner.A.']);
    worksheet.addRow(['IMPGAI Nacional - Índice de Medición de la Perspectiva de Género']);
    worksheet.addRow(['']);
    worksheet.addRow(['INFORMACIÓN DE CONFIGURACIÓN']);
    worksheet.addRow(['Entidad Fiscalizadora', configInfo.entidadFiscalizadora || 'No especificado']);
    worksheet.addRow(['Organismo Auditado', configInfo.institucionAuditada || 'No especificado']);
    worksheet.addRow(['Período Auditado', configInfo.anoPeriodoAuditado || 'No especificado']);
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

    filteredDimensiones.forEach((dim: any) => {
      const puntajeDim = calcularPuntajeDimension(dim, respuestas);
      const puntajeMaxDim = calcularPuntajeMaximoDimension(dim);
      const pctDim = puntajeMaxDim > 0 ? (puntajeDim / puntajeMaxDim) * 100 : 0;
      const nivelDim = getNivelDimension(pctDim);
      worksheet.addRow([`${dim.id}. ${dim.nombre}`, '', '', '', '', '', '', `${pctDim.toFixed(1)}% / ${nivelDim.nivel}`]);
      (dim.subdimensiones || []).forEach((sd: any) => {
        const puntajeSub = calcularPuntajeSubdimension(sd, respuestas);
        const maxSub = calcularPuntajeMaximoSubdimension(sd, respuestas);
        const pctSub = maxSub > 0 ? (puntajeSub / maxSub) * 100 : 0;
        worksheet.addRow(['', `${sd.id}. ${sd.nombre}`, '', '', '', puntajeSub, maxSub, `${pctSub.toFixed(1)}%`]);
        (sd.indicadores || []).forEach((ind: any) => {
          const resp = respuestas[ind.id];
          const op = ind.opciones.find((o: any) => o.valor === resp);
          const max = Math.max(...ind.opciones.filter((o: any) => o.valor !== 'No aplica').map((o: any) => o.puntaje || 0));
          worksheet.addRow(['', '', ind.id, ind.pregunta || ind.texto, resp || '—', op?.puntaje || 0, max, '']);
        });
      });
    });

    // Sección No Aplica
    const noAplica: Array<{d:string; dn:string; sd:string; sdn:string; id:string; t:string;}> = [];
    filteredDimensiones.forEach((d: any) => d.subdimensiones.forEach((sd: any) => sd.indicadores.forEach((ind: any) => {
      if (respuestas[ind.id] === 'No aplica') noAplica.push({ d: d.id, dn: d.nombre, sd: sd.id, sdn: sd.nombre, id: ind.id, t: ind.pregunta || ind.texto });
    })));
    worksheet.addRow(['']);
    worksheet.addRow(['INDICADORES NO APLICA']);
    worksheet.addRow(['Dimensión', 'Subdimensión', 'Indicador', 'Pregunta']);
    noAplica.forEach(i => worksheet.addRow([`${i.d}. ${i.dn}`, `${i.sd}. ${i.sdn}`, i.id, i.t]));

    // Save the file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `IMPGAI_Nacional_Resultados_${(configInfo.institucionAuditada || 'Sin_Nombre').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-purple-100 mb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#8350EB]">Resultados IMPGAI Nacional</h1>
                <div className="text-gray-600 mt-2 space-y-1">
                  <p>
                    Entidad Fiscalizadora: <strong>{configuracion.entidadFiscalizadora}</strong>
                  </p>
                  <p>
                    Organismo Auditado: <strong>{configuracion.institucionAuditada}</strong>
                  </p>
                  <p>
                    Período Auditado: <strong>{configuracion.anoPeriodoAuditado}</strong>
                  </p>
                  <p>
                    Modalidad: <strong>{configuracion.modalidad === 'completa' ? 'Auditoría pura con perspectiva de género' : 'Auditoría de género por dimensión'}</strong>
                  </p>
                  <p>
                    Fecha de Evaluación: <strong>{new Date(fecha).toLocaleDateString('es-ES')}</strong>
                  </p>
                  {configuracion.modalidad !== 'completa' && configuracion.dimensionesSeleccionadas && (
                    <p>
                      Dimensiones Seleccionadas: <strong>{configuracion.dimensionesSeleccionadas.length} de 6</strong>
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/indices/impgai-nacional/dimensiones')}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  ← Atrás
                </button>
                <button
                  onClick={() => {
                    if (confirm('¿Está seguro de que desea reiniciar el análisis? Se perderán todos los datos ingresados.')) {
                      localStorage.removeItem('impgai_nacional_configuracion');
                      localStorage.removeItem('impgai_respuestas');
                      localStorage.removeItem('impgai_fecha');
                      router.push('/indices/impgai-nacional/configuracion');
                    }
                  }}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reiniciar Análisis
                </button>
              </div>
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
            const { nivel: nivelDimension } = getNivelDimension(porcentaje);
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

        {/* No Aplica Summary */}
        {(() => {
          const noAplicaIndicators: Array<{
            dimension: string;
            dimensionId: string;
            subdimension: string;
            indicador: string;
            id: string;
          }> = [];

          filteredDimensiones.forEach((dimension: any) => {
            dimension.subdimensiones.forEach((subdimension: any) => {
              subdimension.indicadores.forEach((indicador: any) => {
                if (respuestas[indicador.id] === 'No aplica') {
                  noAplicaIndicators.push({
                    dimension: dimension.nombre,
                    dimensionId: dimension.id,
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
                  {noAplicaIndicators.map((item, index) => {
                    const { hex } = getDimensionColors(item.dimensionId);
                    return (
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
                    );
                  })}
                </div>
                <div className="mt-4 text-sm text-yellow-700">
                  <strong>Nota:</strong> Los indicadores marcados como "No aplica" no contribuyen al puntaje total de la evaluación.
                </div>
              </div>
            );
          }
          return null;
        })()}

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
          <button
            onClick={() => router.push('/indices/impgai-nacional/dimensiones')}
            className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
          >
            ← Atrás
          </button>
          <button
            onClick={() => router.push('/indices/impgai-nacional/configuracion')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Nueva Evaluación
          </button>
        </div>
      </div>
    </div>
  );
}