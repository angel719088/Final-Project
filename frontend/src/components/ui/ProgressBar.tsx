import { cn } from '../../lib/utils'

interface ProgressBarProps {
  value: number // 0–100
  className?: string
  barClassName?: string
  label?: string
}

export function ProgressBar({ value, className, barClassName = 'bg-indigo-600', label }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-100', className)}
    >
      <div className={cn('h-full rounded-full transition-all', barClassName)} style={{ width: `${clamped}%` }} />
    </div>
  )
}
