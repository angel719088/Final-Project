/**
 * 集中管理的 API Client：所有後端呼叫都經過這裡。
 *
 * BASE_URL 預設為 `/api`，開發時由 Vite proxy 轉發到 FastAPI（見 vite.config.ts），
 * 因此瀏覽器視為同源、不需要 CORS。若要直接呼叫後端，設定 VITE_API_BASE_URL=http://localhost:8000/api。
 */
import type {
  ApiValidationError,
  HealthResponse,
  Project,
  ProjectInput,
  Task,
  TaskInput,
} from '../types'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '')
const TIMEOUT_MS = 15_000

export class ApiError extends Error {
  /** HTTP 狀態碼；0 代表網路錯誤或逾時 */
  readonly status: number
  /** 422 時各欄位的錯誤訊息（key 為欄位名稱） */
  readonly fieldErrors: Record<string, string>
  /** 後端原始 detail，方便除錯 */
  readonly detail: unknown

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}, detail?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
    this.detail = detail
  }
}

/** 把任何錯誤轉成 ApiError，讓 UI 只需處理一種型別 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  return new ApiError(0, error instanceof Error ? error.message : '發生未知錯誤')
}

/** 後端自訂的驗證錯誤類型 → 中文訊息；其餘沿用 Pydantic 的訊息（前端驗證通常會先攔下） */
const VALIDATION_MESSAGES: Record<string, string> = {
  project_not_found: '此專案已不存在（可能已被刪除），請重新選擇',
}

async function parseError(res: Response): Promise<ApiError> {
  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    // 非 JSON（例如 Vite proxy 連不到後端時的 500）
  }
  const detail = (body as { detail?: unknown } | null)?.detail

  if (res.status === 422 && Array.isArray(detail)) {
    const fieldErrors: Record<string, string> = {}
    for (const err of detail as ApiValidationError[]) {
      const field = err.loc?.[err.loc.length - 1]
      if (err.loc?.[0] === 'body' && typeof field === 'string' && !fieldErrors[field]) {
        fieldErrors[field] = VALIDATION_MESSAGES[err.type] ?? err.msg
      }
    }
    return new ApiError(422, '資料驗證失敗，請檢查欄位內容', fieldErrors, detail)
  }
  if (res.status === 404) return new ApiError(404, '找不到此資料，可能已被刪除', {}, detail)
  if (res.status >= 500 || body === null) {
    return new ApiError(res.status, '伺服器無回應或發生錯誤，請確認後端已啟動', {}, detail)
  }
  return new ApiError(res.status, typeof detail === 'string' ? detail : `請求失敗（HTTP ${res.status}）`, {}, detail)
}

async function request<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })
  } catch {
    throw new ApiError(0, controller.signal.aborted ? '連線逾時，請稍後再試' : '無法連線到伺服器，請確認後端已啟動')
  } finally {
    clearTimeout(timer)
  }

  if (!res.ok) throw await parseError(res)
  return (res.status === 204 ? undefined : await res.json()) as T
}

export const api = {
  health: () => request<HealthResponse>('GET', '/health'),

  projects: {
    list: () => request<Project[]>('GET', '/projects'),
    create: (input: ProjectInput) => request<Project>('POST', '/projects', input),
    update: (id: number, input: ProjectInput) => request<Project>('PUT', `/projects/${id}`, input),
    remove: (id: number) => request<void>('DELETE', `/projects/${id}`),
  },

  tasks: {
    list: () => request<Task[]>('GET', '/tasks'),
    create: (input: TaskInput) => request<Task>('POST', '/tasks', input),
    update: (id: number, input: TaskInput) => request<Task>('PUT', `/tasks/${id}`, input),
    remove: (id: number) => request<void>('DELETE', `/tasks/${id}`),
  },
}

/** Task → TaskInput（PUT 需完整欄位） */
export function taskToInput(task: Task): TaskInput {
  const { project_id, title, description, assignee, priority, status, due_date } = task
  return { project_id, title, description, assignee, priority, status, due_date }
}
