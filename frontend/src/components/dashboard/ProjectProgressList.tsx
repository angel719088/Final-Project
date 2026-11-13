import { Link } from 'react-router-dom'
import { PROJECT_STATUS_META } from '../../lib/constants'
import { tasksOfProject } from '../../lib/stats'
import { completionRate } from '../../lib/utils'
import type { Project, Task } from '../../types'
import { Badge } from '../ui/Badge'
import { FolderOpen } from 'lucide-react'
import { Card, CardHeader } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { ProgressBar } from '../ui/ProgressBar'

interface ProjectProgressListProps {
  projects: Project[]
  tasks: Task[]
}

export function ProjectProgressList({ projects, tasks }: ProjectProgressListProps) {
  return (
    <Card>
      <CardHeader
        title="專案進度"
        description="依任務完成率計算"
        action={
          <Link to="/projects" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
            全部專案
          </Link>
        }
      />
      {projects.length === 0 && <EmptyState icon={FolderOpen} title="還沒有任何專案" description="前往 Projects 建立第一個專案。" />}
      <ul className="divide-y divide-slate-100">
        {projects.map((p) => {
          const rate = completionRate(tasksOfProject(tasks, p.id))
          const status = PROJECT_STATUS_META[p.status]
          return (
            <li key={p.id} className="px-5 py-3.5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-medium text-slate-800">{p.name}</span>
                  <Badge tone={status.tone} className="hidden sm:inline-flex">
                    {status.label}
                  </Badge>
                </div>
                <span className="text-sm font-semibold tabular-nums text-slate-900">{rate}%</span>
              </div>
              <ProgressBar value={rate} label={`${p.name} 完成率`} barClassName={rate === 100 ? 'bg-emerald-500' : 'bg-indigo-600'} />
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
