export default function IMPGAIRegionalIndex() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-purple-700 mb-4">IMPGAI Regional</h1>
        <p className="text-gray-600 mb-6">Índice de Políticas de Género e Igualdad - Nivel Regional</p>
        <a 
          href="/indices/impgai-regional/configuracion-simple"
          className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
        >
          Comenzar Análisis
        </a>
      </div>
    </div>
  );
}