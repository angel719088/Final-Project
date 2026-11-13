import type { Project, Task, TaskStatus } from '../types'
import { TASK_STATUSES } from './constants'
import { completionRate, isOverdue } from './utils'

export interface DashboardStats {
  projectCount: number
  activeProjectCount: number
  taskCount: number
  openTaskCount: number
  overdueCount: number
  completionRate: number
  statusCounts: Record<TaskStatus, number>
}

export function getDashboardStats(projects: Project[], tasks: Task[]): DashboardStats {
  const statusCounts = Object.fromEntries(TASK_STATUSES.map((s) => [s, 0])) as Record<TaskStatus, number>
  tasks.forEach((t) => statusCounts[t.status]++)

  return {
    projectCount: projects.length,
    activeProjectCount: projects.filter((p) => p.status === 'active').length,
    taskCount: tasks.length,
    openTaskCount: tasks.length - statusCounts.done,
    overdueCount: tasks.filter((t) => isOverdue(t)).length,
    completionRate: completionRate(tasks),
    statusCounts,
  }
}

export function tasksOfProject(tasks: Task[], projectId: number): Task[] {
  return tasks.filter((t) => t.project_id === projectId)
}
