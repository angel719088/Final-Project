import { CircleCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PRIORITY_META, TASK_STATUS_META } from '../../lib/constants'
import { formatDate, isOverdue } from '../../lib/utils'
import type { Project, Task } from '../../types'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Card, CardHeader } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'

interface AttentionTaskListProps {
  tasks: Task[]
  projects: Project[]
}

/** 已過截止日且未完成的任務，依截止日排序 */
export function AttentionTaskList({ tasks, projects }: AttentionTaskListProps) {
  const items = tasks
    .filter((t) => isOverdue(t))
    .sort((a, b) => a.due_date.localeCompare(b.due_date))

  return (
    <Card>
      <CardHeader
        title="逾期任務"
        description="已過截止日且尚未完成"
        action={
          <Link to="/tasks" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
            前往看板
          </Link>
        }
      />
      {items.length === 0 ? (
        <EmptyState icon={CircleCheck} title="目前沒有逾期任務" />
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((t) => (
            <li key={t.id} className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar name={t.assignee} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{t.title}</p>
                  <p className="truncate text-xs text-slate-500">
                    {projects.find((p) => p.id === t.project_id)?.name} · {t.assignee}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pl-9 sm:pl-0">
                <Badge tone={PRIORITY_META[t.priority].tone}>{PRIORITY_META[t.priority].label}</Badge>
                <Badge tone={TASK_STATUS_META[t.status].tone}>{TASK_STATUS_META[t.status].label}</Badge>
                <span
                  className={
                    isOverdue(t)
                      ? 'w-16 text-right text-xs font-medium tabular-nums text-red-600'
                      : 'w-16 text-right text-xs tabular-nums text-slate-500'
                  }
                >
                  {formatDate(t.due_date)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
