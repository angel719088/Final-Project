import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

/** input / select / textarea 共用樣式 */
export function controlClass(hasError?: boolean, className?: string): string {
  return cn(
    'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2',
    hasError
      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
      : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20',
    className,
  )
}

interface FieldProps {
  id: string
  label: string
  required?: boolean
  error?: string
  hint?: ReactNode
  className?: string
  children: ReactNode
}

/**
 * 表單欄位外框：label、必填標記、錯誤與提示訊息。
 * 錯誤訊息 id 為 `${id}-error`，提示為 `${id}-hint`，供 aria-describedby 使用。
 */
export function Field({ id, label, required, error, hint, className, children }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && (
          <span className="ml-0.5 text-red-500" aria-hidden>
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

/** 產生欄位的 aria 屬性 */
export function fieldAria(id: string, error?: string, hasHint?: boolean) {
  return {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : hasHint ? `${id}-hint` : undefined,
  } as const
}
