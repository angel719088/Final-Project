import type { ProjectStatus, TaskPriority, TaskStatus } from '../types'
import type { BadgeTone } from '../components/ui/Badge'

export const TASK_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done']
export const TASK_PRIORITIES: TaskPriority[] = ['urgent', 'high', 'medium', 'low']
export const PROJECT_STATUSES: ProjectStatus[] = ['planning', 'active', 'on_hold', 'completed', 'archived']

export const TASK_STATUS_META: Record<TaskStatus, { label: string; tone: BadgeTone; dot: string }> = {
  todo: { label: 'To Do', tone: 'gray', dot: 'bg-slate-400' },
  in_progress: { label: 'In Progress', tone: 'blue', dot: 'bg-blue-500' },
  done: { label: 'Done', tone: 'green', dot: 'bg-emerald-500' },
}

export const PRIORITY_META: Record<TaskPriority, { label: string; tone: BadgeTone }> = {
  low: { label: '低', tone: 'gray' },
  medium: { label: '中', tone: 'blue' },
  high: { label: '高', tone: 'amber' },
  urgent: { label: '緊急', tone: 'red' },
}

export const PROJECT_STATUS_META: Record<ProjectStatus, { label: string; tone: BadgeTone }> = {
  planning: { label: '規劃中', tone: 'violet' },
  active: { label: '進行中', tone: 'blue' },
  on_hold: { label: '暫停', tone: 'amber' },
  completed: { label: '已完成', tone: 'green' },
  archived: { label: '已封存', tone: 'gray' },
}
