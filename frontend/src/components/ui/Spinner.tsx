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
  return <Loader2 className={`ed-spinner ${className}`} />
}