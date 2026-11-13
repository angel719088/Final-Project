import type { Task, TaskInput, TaskPriority, TaskStatus } from '../types'
import { TASK_PRIORITIES, TASK_STATUSES } from './constants'
import { daysFromToday, toISODate } from './utils'

export const TITLE_MAX = 100
export const DESCRIPTION_MAX = 500
export const ASSIGNEE_MAX = 50

/** 表單欄位皆以字串保存，送出時再轉成 TaskInput */
export interface TaskFormValues {
  title: string
  description: string
  project_id: string
  assignee: string
  due_date: string
  priority: TaskPriority
  status: TaskStatus
}

export type TaskFormErrors = Partial<Record<keyof TaskFormValues, string>>

/** 驗證失敗時依此順序聚焦第一個錯誤欄位 */
export const FIELD_ORDER: (keyof TaskFormValues)[] = [
  'title',
  'project_id',
  'assignee',
  'due_date',
  'priority',
  'status',
  'description',
]

export function emptyTaskForm(defaults?: { project_id?: number; status?: TaskStatus }): TaskFormValues {
  return {
    title: '',
    description: '',
    project_id: defaults?.project_id ? String(defaults.project_id) : '',
    assignee: '',
    due_date: daysFromToday(7),
    priority: 'medium',
    status: defaults?.status ?? 'todo',
  }
}

export function taskToForm(task: Task): TaskFormValues {
  return {
    title: task.title,
    description: task.description ?? '',
    project_id: String(task.project_id),
    assignee: task.assignee,
    due_date: task.due_date,
    priority: task.priority,
    status: task.status,
  }
}

export function formToTaskInput(values: TaskFormValues): TaskInput {
  const description = values.description.trim()
  return {
    title: values.title.trim(),
    description: description || null,
    project_id: Number(values.project_id),
    assignee: values.assignee.trim(),
    due_date: values.due_date,
    priority: values.priority,
    status: values.status,
  }
}

export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00`)
  return !Number.isNaN(date.getTime()) && toISODate(date) === value
}

export function validateTaskForm(values: TaskFormValues, projectIds: number[]): TaskFormErrors {
  const errors: TaskFormErrors = {}

  const title = values.title.trim()
  if (!title) errors.title = '請輸入任務標題'
  else if (title.length > TITLE_MAX) errors.title = `標題不可超過 ${TITLE_MAX} 字`

  if (values.description.trim().length > DESCRIPTION_MAX) errors.description = `描述不可超過 ${DESCRIPTION_MAX} 字`

  if (!values.project_id) errors.project_id = '請選擇所屬專案'
  else if (!projectIds.includes(Number(values.project_id))) errors.project_id = '找不到此專案'

  const assignee = values.assignee.trim()
  if (!assignee) errors.assignee = '請輸入負責人'
  else if (assignee.length > ASSIGNEE_MAX) errors.assignee = `負責人不可超過 ${ASSIGNEE_MAX} 字`

  if (!values.due_date) errors.due_date = '請選擇截止日期'
  else if (!isValidISODate(values.due_date)) errors.due_date = '日期格式不正確'

  if (!TASK_PRIORITIES.includes(values.priority)) errors.priority = '請選擇優先級'
  if (!TASK_STATUSES.includes(values.status)) errors.status = '請選擇狀態'

  return errors
}
