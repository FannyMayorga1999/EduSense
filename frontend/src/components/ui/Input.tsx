import type { InputHTMLAttributes } from 'react'

/**
 * Campo de texto base del kit UI de EduSense.
 *
 * @author Fanny Mayorga
 */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export default function Input({ className = '', ...props }: InputProps) {
  return <input className={`ed-input ${className}`} {...props} />
}