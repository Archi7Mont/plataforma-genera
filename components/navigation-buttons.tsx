"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Home } from "lucide-react"
import Link from "next/link"

interface NavigationButtonsProps {
  previousPage?: {
    href: string
    label: string
  }
  nextPage?: {
    href: string
    label: string
  }
  showHome?: boolean
  // New props for dimension navigation
  prevHref?: string
  nextHref?: string
  prevLabel?: string
  nextLabel?: string
  onPrevClick?: () => void
  onNextClick?: () => void
}

export function NavigationButtons({
  previousPage,
  nextPage,
  showHome = true,
  prevHref,
  nextHref,
  prevLabel,
  nextLabel,
  onPrevClick,
  onNextClick,
}: NavigationButtonsProps) {
  const prevPage = previousPage || (prevHref ? { href: prevHref, label: prevLabel || "Anterior" } : null)
  const nextPageData = nextPage || (nextHref ? { href: nextHref, label: nextLabel || "Siguiente" } : null)

  return (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-purple-100">
      <div className="flex items-center gap-3">
        {showHome && (
          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              className="bg-white border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
            >
              <Home className="h-4 w-4 mr-2" />
              Inicio
            </Button>
          </Link>
        )}
        {prevPage && (
          <>
            {onPrevClick ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onPrevClick}
                className="bg-white border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                {prevPage.label}
              </Button>
            ) : (
              <Link href={prevPage.href}>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  {prevPage.label}
                </Button>
              </Link>
            )}
          </>
        )}
      </div>

      {nextPageData && (
        <>
          {onNextClick ? (
            <Button
              size="sm"
              onClick={onNextClick}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {nextPageData.label}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Link href={nextPageData.href}>
              <Button
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {nextPageData.label}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          )}
        </>
      )}
    </div>
  )
}

export default NavigationButtons
