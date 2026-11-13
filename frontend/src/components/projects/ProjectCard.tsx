import { ArrowRight, CalendarDays, Pencil, Trash2, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PROJECT_STATUS_META } from '../../lib/constants'
import { completionRate, formatDateTime, isOverdue } from '../../lib/utils'
import type { Project, Task } from '../../types'
import { AvatarGroup } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { IconButton } from '../ui/Button'
import { Card } from '../ui/Card'
import { ProgressBar } from '../ui/ProgressBar'

interface ProjectCardProps {
  project: Project
  tasks: Task[]
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
}

export function ProjectCard({ project, tasks, onEdit, onDelete }: ProjectCardProps) {
  const status = PROJECT_STATUS_META[project.status]
  const rate = completionRate(tasks)
  const done = tasks.filter((t) => t.status === 'done').length
  const overdue = tasks.filter((t) => isOverdue(t)).length
  const members = [...new Set(tasks.map((t) => t.assignee))]

  return (
    <Card className="flex flex-col p-5 transition hover:shadow-md" data-project-id={project.id}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 text-base font-semibold text-slate-900">{project.name}</h3>
        <div className="-mr-1.5 -mt-1 flex shrink-0 items-center gap-1">
          <Badge tone={status.tone}>{status.label}</Badge>
          <IconButton icon={Pencil} label={`編輯「${project.name}」`} onClick={() => onEdit(project)} />
          <IconButton icon={Trash2} label={`刪除「${project.name}」`} tone="danger" onClick={() => onDelete(project)} />
        </div>
      </div>
      <p className="mt-2 line-clamp-2 min-h-10 text-sm text-slate-500">{project.description || '（沒有描述）'}</p>

      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium text-slate-600">
            進度 {done}/{tasks.length} 任務
          </span>
          <span className="font-semibold tabular-nums text-slate-900">{rate}%</span>
        </div>
        <ProgressBar
          value={rate}
          label={`${project.name} 完成率`}
          barClassName={tasks.length > 0 && rate === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
          建立於 {formatDateTime(project.created_at)}
        </span>
        {overdue > 0 && (
          <span className="inline-flex items-center gap-1 font-medium text-red-600">
            <TriangleAlert className="h-3.5 w-3.5" aria-hidden />
            {overdue} 項逾期
          </span>
        )}
      </div>

      <div className="flex-1" aria-hidden />
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        {members.length > 0 ? <AvatarGroup names={members} /> : <span className="text-xs text-slate-400">尚無成員</span>}
        <Link
          to={`/tasks?project=${project.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          查看任務
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </Card>
  )
}
