import { CircleAlert, CircleCheck, X } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../lib/utils'

type ToastTone = 'success' | 'error'

interface ToastItem {
  id: number
  tone: ToastTone
  message: string
}

const ToastContext = createContext<((tone: ToastTone, message: string) => void) | null>(null)

const DURATION: Record<ToastTone, number> = { success: 3000, error: 6000 }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => setItems((prev) => prev.filter((t) => t.id !== id)), [])

  const show = useCallback(
    (tone: ToastTone, message: string) => {
      const id = ++nextId.current
      setItems((prev) => [...prev.slice(-3), { id, tone, message }])
      setTimeout(() => dismiss(id), DURATION[tone])
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
      >
        {items.map((t) => {
          const Icon = t.tone === 'error' ? CircleAlert : CircleCheck
          return (
            <div
              key={t.id}
              role={t.tone === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg bg-white p-3.5 shadow-lg ring-1 ring-slate-200"
            >
              <Icon
                className={cn('mt-0.5 h-5 w-5 shrink-0', t.tone === 'error' ? 'text-red-500' : 'text-emerald-500')}
                aria-hidden
              />
              <p className="flex-1 text-sm text-slate-700">{t.message}</p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="關閉通知"
                className="rounded p-0.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const show = useContext(ToastContext)
  if (!show) throw new Error('useToast must be used within ToastProvider')
  return useMemo(
    () => ({
      success: (message: string) => show('success', message),
      error: (message: string) => show('error', message),
    }),
    [show],
  )
}
