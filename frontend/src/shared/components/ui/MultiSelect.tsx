import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { ChevronDown, X } from 'lucide-react'

/**
 * Generic multi-select of the EduSense UI kit: a trigger that shows the
 * placeholder (or a count of selected options) and a dropdown with a checkbox
 * per option. Selected values are NOT rendered inside the trigger — each
 * module shows them as removable chips in its own "active filters" section,
 * keeping the trigger clean and summarized.
 *
 * @author Fanny Mayorga | @date 26-09-2026
 */

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  countText?: (count: number) => string
  clearAllLabel?: string
  ariaLabel?: string
  className?: string
}

export default function MultiSelect({
  options,
  value,
  onChange,
  placeholder = '',
  countText,
  clearAllLabel = '',
  ariaLabel,
  className = '',
}: MultiSelectProps) {
  const [open, setOpen] = useState<boolean>(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const onPointerDown = (event: MouseEvent): void => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const onKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const toggle = (selected: string): void => {
    onChange(value.includes(selected) ? value.filter((item) => item !== selected) : [...value, selected])
  }

  const triggerKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setOpen((current) => !current)
    }
  }

  const summary =
    value.length > 0 && countText !== undefined ? (
      <span className="ed-multiselect__contador">{countText(value.length)}</span>
    ) : (
      <span className="ed-multiselect__placeholder">{placeholder}</span>
    )

  return (
    <div ref={containerRef} className={`ed-multiselect ${className}`}>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={triggerKeyDown}
        className="ed-multiselect__trigger"
      >
        <span className="ed-multiselect__contenido">{summary}</span>
        <ChevronDown className="ed-multiselect__chevron" />
      </div>

      {open && (
        <div className="ed-multiselect__panel" role="listbox" aria-multiselectable="true">
          <ul className="ed-multiselect__lista">
            {options.map((option) => (
              <li
                key={option.value}
                role="option"
                aria-selected={value.includes(option.value)}
                className="ed-multiselect__item"
              >
                <label className="ed-multiselect__opcion">
                  <input
                    type="checkbox"
                    checked={value.includes(option.value)}
                    onChange={() => toggle(option.value)}
                    className="ed-checkbox"
                  />
                  <span>{option.label}</span>
                </label>
              </li>
            ))}
          </ul>

          {value.length > 0 && (
            <button type="button" onClick={() => onChange([])} className="ed-multiselect__limpiar">
              <X className="h-3.5 w-3.5" />
              {clearAllLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}