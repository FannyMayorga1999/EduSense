import { Loader2 } from 'lucide-react'

/**
 * Indicador de carga reutilizable (kit UI de EduSense).
 *
 * @author Fanny Mayorga
 */
interface SpinnerProps {
  className?: string
}

export default function Spinner({ className = '' }: SpinnerProps) {
  return <Loader2 className={`h-5 w-5 animate-spin text-primary-600 dark:text-primary-400 ${className}`} />
}