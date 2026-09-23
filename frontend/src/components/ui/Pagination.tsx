import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from './Button'

/**
 * Paginación simple del kit UI: botones anterior/siguiente y el rótulo de la
 * página actual. Las etiquetas llegan traducidas desde la página que lo usa.
 *
 * @author Fanny Mayorga
 */

interface PaginationProps {
  pagina: number
  totalPaginas: number
  onCambiar: (pagina: number) => void
  etiquetaPagina: string
  etiquetaAnterior: string
  etiquetaSiguiente: string
}

export default function Pagination({
  pagina,
  totalPaginas,
  onCambiar,
  etiquetaPagina,
  etiquetaAnterior,
  etiquetaSiguiente,
}: PaginationProps) {
  if (totalPaginas <= 1) {
    return null
  }

  return (
    <div className="flex items-center justify-between gap-3 border-t border-stone-200 px-5 py-3 dark:border-stone-700">
      <p className="text-xs font-medium text-stone-500 dark:text-stone-400">{etiquetaPagina}</p>

      <div className="flex gap-2">
        <Button
          variante="secondary"
          tamano="sm"
          disabled={pagina <= 1}
          onClick={() => onCambiar(pagina - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          {etiquetaAnterior}
        </Button>

        <Button
          variante="secondary"
          tamano="sm"
          disabled={pagina >= totalPaginas}
          onClick={() => onCambiar(pagina + 1)}
        >
          {etiquetaSiguiente}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}