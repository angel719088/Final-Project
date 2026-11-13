import { CalendarDays, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { PRIORITY_META, TASK_STATUSES, TASK_STATUS_META } from '../../lib/constants'
import { cn, formatDate, isOverdue } from '../../lib/utils'
import type { Task, TaskStatus } from '../../types'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { IconButton } from '../ui/Button'

/** 拖曳時使用的 MIME type，避免接受頁面上其他不相干的拖曳 */
export const TASK_DRAG_TYPE = 'application/x-pm-task-id'

interface TaskCardProps {
  task: Task
  projectName?: string
  onStatusChange: (taskId: number, status: TaskStatus) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

export function TaskCard({ task, projectName, onStatusChange, onEdit, onDelete }: TaskCardProps) {
  const [dragging, setDragging] = useState(false)
  const priority = PRIORITY_META[task.priority]
  const overdue = isOverdue(task)

  return (
    <article
      draggable
      data-task-id={task.id}
      onDragStart={(e) => {
        e.dataTransfer.setData(TASK_DRAG_TYPE, String(task.id))
        e.dataTransfer.effectAllowed = 'move'
        setDragging(true)
      }}
      onDragEnd={() => setDragging(false)}
      className={cn(
        'relative cursor-grab rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-slate-300 hover:shadow active:cursor-grabbing',
        dragging && 'opacity-40 ring-2 ring-indigo-300',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={priority.tone}>{priority.label}</Badge>
          {overdue && <Badge tone="red">逾期</Badge>}
        </div>
        <div className="-mr-1.5 -mt-1 flex shrink-0">
          <IconButton icon={Pencil} label={`編輯「${task.title}」`} onClick={() => onEdit(task)} />
          <IconButton icon={Trash2} label={`刪除「${task.title}」`} tone="danger" onClick={() => onDelete(task)} />
        </div>
      </div>

      <h4 className="mt-2 text-sm font-medium text-slate-900">
        <button type="button" onClick={() => onEdit(task)} className="text-left hover:text-indigo-600">
          {task.title}
        </button>
      </h4>
      {projectName && <p className="mt-0.5 text-xs text-slate-500">{projectName}</p>}
      {task.description && <p className="mt-2 line-clamp-2 text-xs text-slate-500">{task.description}</p>}

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar name={task.assignee} size="sm" />
          <span className="truncate text-xs text-slate-600">{task.assignee}</span>
        </div>
        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1 text-xs tabular-nums',
            overdue ? 'font-medium text-red-600' : 'text-slate-500',
          )}
        >
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
          {formatDate(task.due_date)}
        </span>
      </div>

      {/* 鍵盤與觸控裝置也能變更狀態（手機無法拖曳） */}
      <label className="mt-3 block">
        <span className="sr-only">變更「{task.title}」的狀態</span>
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
          className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              移至：{TASK_STATUS_META[s].label}
            </option>
          ))}
        </select>
      </label>
    </article>
  )
}
