import { Plus } from 'lucide-react'
import { useState, type DragEvent, type ReactNode } from 'react'
import { TASK_STATUS_META } from '../../lib/constants'
import { cn } from '../../lib/utils'
import type { TaskStatus } from '../../types'
import { IconButton } from '../ui/Button'
import { TASK_DRAG_TYPE } from './TaskCard'

interface KanbanColumnProps {
  status: TaskStatus
  count: number
  onDropTask: (taskId: number) => void
  onAdd: () => void
  children: ReactNode
}

export function KanbanColumn({ status, count, onDropTask, onAdd, children }: KanbanColumnProps) {
  const [isOver, setIsOver] = useState(false)
  const meta = TASK_STATUS_META[status]
  const isTaskDrag = (e: DragEvent) => e.dataTransfer.types.includes(TASK_DRAG_TYPE)

  return (
    <section
      aria-label={`${meta.label}（${count}）`}
      data-status={status}
      onDragOver={(e) => {
        if (!isTaskDrag(e)) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setIsOver(true)
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setIsOver(false)
      }}
      onDrop={(e) => {
        if (!isTaskDrag(e)) return
        e.preventDefault()
        setIsOver(false)
        const id = Number(e.dataTransfer.getData(TASK_DRAG_TYPE))
        if (id) onDropTask(id)
      }}
      className={cn(
        'flex w-[85vw] max-w-sm shrink-0 snap-start flex-col rounded-xl bg-slate-100/80 p-3 transition sm:w-80 xl:w-auto xl:max-w-none',
        isOver && 'bg-indigo-50 ring-2 ring-indigo-300',
      )}
    >
      <header className="mb-3 flex items-center gap-2 px-1">
        <span className={cn('h-2 w-2 rounded-full', meta.dot)} aria-hidden />
        <h3 className="text-sm font-semibold text-slate-800">{meta.label}</h3>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium tabular-nums text-slate-600">{count}</span>
        <IconButton icon={Plus} label={`新增任務到 ${meta.label}`} onClick={onAdd} className="ml-auto" />
      </header>
      <div className="flex min-h-24 flex-1 flex-col gap-3">{children}</div>
    </section>
  )
}
