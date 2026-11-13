import type { Task } from '../types'

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 以今天為基準產生日期字串，讓 Mock Data 永遠有逾期 / 即將到期的任務 */
export function daysFromToday(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })
}

/** ISO 8601 日期時間（後端 created_at）→ 本地日期 */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('zh-TW', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function isOverdue(task: Task, today = toISODate(new Date())): boolean {
  return task.status !== 'done' && task.due_date < today
}

export function completionRate(tasks: Task[]): number {
  if (tasks.length === 0) return 0
  return Math.round((tasks.filter((t) => t.status === 'done').length / tasks.length) * 100)
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}
