import { puntajeDe, maxPuntaje } from './impgpp';

export function getIndicatorScore(indicador: any, respuesta: string): number {
  return puntajeDe(indicador, respuesta);
}

export function getIndicatorMaxScore(indicador: any): number {
  return maxPuntaje(indicador);
}

export function getDimensionColors(dimensionId: string) {
  const colors = {
    'A': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', textDark: 'text-green-900' },
    'B': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', textDark: 'text-blue-900' },
    'C': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', textDark: 'text-red-900' }
  };
  
  return colors[dimensionId as keyof typeof colors] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', textDark: 'text-gray-900' };
}

export function getSubdimensionColors(dimensionId: string, subdimensionId: string) {
  const baseColors = getDimensionColors(dimensionId);
  
  return {
    bg: baseColors.bg.replace('50', '100'),
    border: baseColors.border.replace('200', '300'),
    text: baseColors.text,
    textDark: baseColors.textDark
  };
}
