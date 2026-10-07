import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'

/**
 * Base text input of the EduSense UI kit.
 *
 * @author Fanny Mayorga
 * @date   26-09-2026
 */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = '', ...props },
  ref,
) {
  return <input ref={ref} className={`ed-input ${className}`} {...props} />
})

export default Input