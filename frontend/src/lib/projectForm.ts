import type { Project, ProjectInput, ProjectStatus } from '../types'
import { PROJECT_STATUSES } from './constants'

// 與後端 ProjectIn 的限制一致（backend/app/schemas/project.py）
export const PROJECT_NAME_MAX = 200
export const PROJECT_DESCRIPTION_MAX = 2000

export interface ProjectFormValues {
  name: string
  description: string
  status: ProjectStatus
}

export type ProjectFormErrors = Partial<Record<keyof ProjectFormValues, string>>

export const PROJECT_FIELD_ORDER: (keyof ProjectFormValues)[] = ['name', 'status', 'description']

export const emptyProjectForm = (): ProjectFormValues => ({ name: '', description: '', status: 'planning' })

export const projectToForm = (p: Project): ProjectFormValues => ({
  name: p.name,
  description: p.description,
  status: p.status,
})

export const formToProjectInput = (v: ProjectFormValues): ProjectInput => ({
  name: v.name.trim(),
  description: v.description.trim(),
  status: v.status,
})

export function validateProjectForm(v: ProjectFormValues): ProjectFormErrors {
  const errors: ProjectFormErrors = {}
  const name = v.name.trim()
  if (!name) errors.name = '請輸入專案名稱'
  else if (name.length > PROJECT_NAME_MAX) errors.name = `名稱不可超過 ${PROJECT_NAME_MAX} 字`
  if (v.description.trim().length > PROJECT_DESCRIPTION_MAX) errors.description = `描述不可超過 ${PROJECT_DESCRIPTION_MAX} 字`
  if (!PROJECT_STATUSES.includes(v.status)) errors.status = '請選擇狀態'
  return errors
}
