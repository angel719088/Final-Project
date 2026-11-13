// 與後端 API schema（backend/app/schemas）一一對應的型別
// 對照：http://localhost:8000/docs → Schemas

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

/** ProjectOut */
export interface Project {
  id: number
  name: string
  description: string
  status: ProjectStatus
  created_at: string // ISO 8601（UTC）
}

/** ProjectIn：POST / PUT 的請求內容 */
export type ProjectInput = Pick<Project, 'name' | 'description' | 'status'>

/** TaskOut */
export interface Task {
  id: number
  project_id: number
  title: string
  description: string | null
  assignee: string
  priority: TaskPriority
  status: TaskStatus
  due_date: string // YYYY-MM-DD
  created_at: string // ISO 8601（UTC）
}

/** TaskIn：POST / PUT 的請求內容（PUT 為完整取代） */
export type TaskInput = Omit<Task, 'id' | 'created_at'>

/** FastAPI 422 回應中 detail 陣列的元素 */
export interface ApiValidationError {
  type: string
  loc: (string | number)[]
  msg: string
  input?: unknown
}

export interface HealthResponse {
  status: string
  app: string
  env: string
  ai_provider: string
}
