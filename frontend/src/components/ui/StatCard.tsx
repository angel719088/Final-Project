import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { Card } from './Card'

type Accent = 'indigo' | 'sky' | 'red' | 'emerald'

const ACCENTS: Record<Accent, string> = {
  indigo: 'bg-indigo-50 text-indigo-600',
  sky: 'bg-sky-50 text-sky-600',
  red: 'bg-red-50 text-red-600',
  emerald: 'bg-emerald-50 text-emerald-600',
}

interface StatCardProps {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon: LucideIcon
  accent?: Accent
  children?: ReactNode
}

export function StatCard({ label, value, hint, icon: Icon, accent = 'indigo', children }: StatCardProps) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums sm:text-3xl">{value}</p>
        </div>
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10',
            ACCENTS[accent],
          )}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
        </span>
      </div>
      {children && <div className="mt-3">{children}</div>}
      {hint && <p className="mt-3 text-xs text-slate-500">{hint}</p>}
    </Card>
  )
}
