export function getScoreCategory(percentage: number): string {
  if (percentage >= 80) return "Avanzado";
  if (percentage >= 60) return "Medio";
  if (percentage >= 40) return "Inicial";
  return "Fuera de rango";
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
