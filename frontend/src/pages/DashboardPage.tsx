import { CircleCheck, FolderKanban, ListTodo, TriangleAlert } from 'lucide-react'
import { DataBoundary } from '../components/layout/DataBoundary'
import { AttentionTaskList } from '../components/dashboard/AttentionTaskList'
import { ProjectProgressList } from '../components/dashboard/ProjectProgressList'
import { TaskStatusBreakdown } from '../components/dashboard/TaskStatusBreakdown'
import { PageHeader } from '../components/ui/PageHeader'
import { ProgressBar } from '../components/ui/ProgressBar'
import { StatCard } from '../components/ui/StatCard'
import { useData } from '../context/DataContext'
import { getDashboardStats } from '../lib/stats'

export default function DashboardPage() {
  const { projects, tasks } = useData()
  const stats = getDashboardStats(projects, tasks)
  const visibleProjects = projects.filter((p) => p.status !== 'archived')

  return (
    <>
      <PageHeader title="Dashboard" description="所有專案的整體狀況一覽" />

      <DataBoundary>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatCard label="專案數量" value={stats.projectCount} icon={FolderKanban} accent="indigo" hint={`${stats.activeProjectCount} 個進行中`} />
          <StatCard label="任務數量" value={stats.taskCount} icon={ListTodo} accent="sky" hint={`${stats.openTaskCount} 項未完成`} />
          <StatCard
            label="逾期任務"
            value={<span className={stats.overdueCount > 0 ? 'text-red-600' : undefined}>{stats.overdueCount}</span>}
            icon={TriangleAlert}
            accent="red"
            hint="未完成且已過截止日"
          />
          <StatCard label="完成率" value={`${stats.completionRate}%`} icon={CircleCheck} accent="emerald">
            <ProgressBar value={stats.completionRate} label="整體完成率" barClassName="bg-emerald-500" />
          </StatCard>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ProjectProgressList projects={visibleProjects} tasks={tasks} />
          </div>
          <TaskStatusBreakdown counts={stats.statusCounts} total={stats.taskCount} />
        </div>

        <div className="mt-6">
          <AttentionTaskList tasks={tasks} projects={projects} />
        </div>
      </DataBoundary>
    </>
  )
}
