import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export type BadgeTone = 'gray' | 'blue' | 'green' | 'amber' | 'red' | 'violet'

const TONES: Record<BadgeTone, string> = {
  gray: 'bg-slate-100 text-slate-700 ring-slate-500/15',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/15',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  amber: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/15',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/15',
}

interface BadgeProps {
  tone?: BadgeTone
  children: ReactNode
  className?: string
}

export function Badge({ tone = 'gray', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
