import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <Card className="w-full max-w-3xl p-16 text-center shadow-xl border-0">
          <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-8 text-balance">
            Géner.A
          </h1>

          <div className="w-24 h-1 bg-primary mx-auto mb-12 rounded-full"></div>

          <h2 className="text-2xl md:text-3xl font-semibold text-primary mb-8 text-balance">
            Herramienta metodológica para auditar con perspectiva de género
          </h2>

          <p className="text-lg md:text-xl text-muted-foreground mb-12 text-pretty leading-relaxed max-w-2xl mx-auto">
            Plataforma para seleccionar la herramienta para analizar y determinar el grado de aplicación de la perspectiva de
            género en los organismos auditados y en las políticas públicas.
          </p>

          <Link href="/login">
            <Button
              size="lg"
              className="text-lg px-12 py-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg"
            >
              Comenzar análisis
            </Button>
          </Link>
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 text-center">
        <p className="text-sm text-muted-foreground">Elaborado por Grupo EFSUR Argentina. V.1.0</p>
      </footer>
    </div>
  )
}
