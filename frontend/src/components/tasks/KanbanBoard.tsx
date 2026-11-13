import { TASK_STATUSES } from '../../lib/constants'
import type { Project, Task, TaskStatus } from '../../types'
import { KanbanColumn } from './KanbanColumn'
import { TaskCard } from './TaskCard'

interface KanbanBoardProps {
  tasks: Task[]
  projects: Project[]
  showProjectName?: boolean
  emptyText?: string
  onStatusChange: (taskId: number, status: TaskStatus) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onAdd: (status: TaskStatus) => void
}

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 } as const

export function KanbanBoard({
  tasks,
  projects,
  showProjectName = true,
  emptyText = '拖曳任務到這裡',
  onStatusChange,
  onEdit,
  onDelete,
  onAdd,
}: KanbanBoardProps) {
  const projectName = (id: number) => projects.find((p) => p.id === id)?.name

  return (
    // 手機 / 平板：水平捲動；桌面（xl）：三欄 grid
    // relative：讓卡片內 absolute 元素（sr-only）以捲動容器為基準，避免撐寬整個頁面
    <div className="relative -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 xl:mx-0 xl:grid xl:grid-cols-3 xl:overflow-visible xl:px-0">
      {TASK_STATUSES.map((status) => {
        const columnTasks = tasks
          .filter((t) => t.status === status)
          .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.due_date.localeCompare(b.due_date))

        return (
          <KanbanColumn
            key={status}
            status={status}
            count={columnTasks.length}
            onDropTask={(id) => onStatusChange(id, status)}
            onAdd={() => onAdd(status)}
          >
            {columnTasks.length === 0 ? (
              <p className="rounded-lg border-2 border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">
                {emptyText}
              </p>
            ) : (
              columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  projectName={showProjectName ? projectName(task.project_id) : undefined}
                  onStatusChange={onStatusChange}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </KanbanColumn>
        )
      })}
    </div>
  )
}
