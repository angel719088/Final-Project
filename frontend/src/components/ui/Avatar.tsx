import { cn, initials } from '../../lib/utils'

const COLORS = [
  'bg-indigo-100 text-indigo-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
  'bg-teal-100 text-teal-700',
]

function colorFor(name: string): string {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return COLORS[Math.abs(hash) % COLORS.length]
}

interface AvatarProps {
  name: string
  size?: 'sm' | 'md'
  className?: string
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <span
      title={name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-white',
        size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs',
        colorFor(name),
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}

interface AvatarGroupProps {
  names: string[]
  max?: number
}

export function AvatarGroup({ names, max = 4 }: AvatarGroupProps) {
  const shown = names.slice(0, max)
  const rest = names.length - shown.length
  return (
    <div className="flex -space-x-1">
      {shown.map((n) => (
        <Avatar key={n} name={n} size="sm" />
      ))}
      {rest > 0 && (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 ring-2 ring-white">
          +{rest}
        </span>
      )}
    </div>
  )
}
