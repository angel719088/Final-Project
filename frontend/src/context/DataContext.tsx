import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ApiError, api, taskToInput, toApiError } from '../lib/api'
import type { Project, ProjectInput, Task, TaskInput, TaskStatus } from '../types'

export type LoadStatus = 'loading' | 'ready' | 'error'

interface DataContextValue {
  projects: Project[]
  tasks: Task[]
  status: LoadStatus
  error: ApiError | null
  reload: () => Promise<void>
  createProject: (input: ProjectInput) => Promise<Project>
  updateProject: (id: number, input: ProjectInput) => Promise<Project>
  deleteProject: (id: number) => Promise<void>
  createTask: (input: TaskInput) => Promise<Task>
  updateTask: (id: number, input: TaskInput) => Promise<Task>
  /** 樂觀更新：畫面立即變更，API 失敗時還原並拋出錯誤 */
  updateTaskStatus: (id: number, status: TaskStatus) => Promise<void>
  deleteTask: (id: number) => Promise<void>
}

const DataContext = createContext<DataContextValue | null>(null)

/**
 * 舊版（純前端）把任務存在 localStorage。後端成為唯一資料來源後，
 * 舊資料一律直接丟棄、不匯入，避免覆蓋資料庫。
 */
const LEGACY_STORAGE_KEYS = ['pm-copilot:tasks:v1']
function discardLegacyLocalData() {
  try {
    LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))
  } catch {
    // 無法存取 storage（隱私模式等）時忽略
  }
}

const replaceById = <T extends { id: number }>(list: T[], item: T) => list.map((x) => (x.id === item.id ? item : x))
const removeById = <T extends { id: number }>(list: T[], id: number) => list.filter((x) => x.id !== id)

/** 所有資料皆來自後端 API（SQLite）；寫入成功後以伺服器回傳的資料更新畫面 */
export function DataProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [error, setError] = useState<ApiError | null>(null)

  const tasksRef = useRef(tasks)
  useEffect(() => {
    tasksRef.current = tasks
  })

  // 只採用最後一次載入的結果（StrictMode 或快速重試時可能同時有多個請求）
  const loadSeq = useRef(0)
  const reload = useCallback(async () => {
    const seq = ++loadSeq.current
    setStatus('loading')
    setError(null)
    try {
      const [p, t] = await Promise.all([api.projects.list(), api.tasks.list()])
      if (seq !== loadSeq.current) return
      setProjects(p)
      setTasks(t)
      setStatus('ready')
    } catch (e) {
      if (seq !== loadSeq.current) return
      setError(toApiError(e))
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    discardLegacyLocalData()
    void reload()
  }, [reload])

  // ---------- Projects ----------

  const createProject = useCallback(async (input: ProjectInput) => {
    const project = await api.projects.create(input)
    setProjects((prev) => [...prev, project])
    return project
  }, [])

  const updateProject = useCallback(async (id: number, input: ProjectInput) => {
    try {
      const project = await api.projects.update(id, input)
      setProjects((prev) => replaceById(prev, project))
      return project
    } catch (e) {
      const err = toApiError(e)
      if (err.status === 404) {
        // 已被其他人刪除：同步移除畫面上的資料
        setProjects((prev) => removeById(prev, id))
        setTasks((prev) => prev.filter((t) => t.project_id !== id))
      }
      throw err
    }
  }, [])

  const deleteProject = useCallback(async (id: number) => {
    try {
      await api.projects.remove(id)
    } catch (e) {
      const err = toApiError(e)
      if (err.status !== 404) throw err // 404：已不存在，視為刪除成功
    }
    setProjects((prev) => removeById(prev, id))
    setTasks((prev) => prev.filter((t) => t.project_id !== id)) // 後端 cascade 刪除
  }, [])

  // ---------- Tasks ----------

  const createTask = useCallback(async (input: TaskInput) => {
    const task = await api.tasks.create(input)
    setTasks((prev) => [...prev, task])
    return task
  }, [])

  const updateTask = useCallback(async (id: number, input: TaskInput) => {
    try {
      const task = await api.tasks.update(id, input)
      setTasks((prev) => replaceById(prev, task))
      return task
    } catch (e) {
      const err = toApiError(e)
      if (err.status === 404) setTasks((prev) => removeById(prev, id))
      throw err
    }
  }, [])

  const updateTaskStatus = useCallback(async (id: number, status: TaskStatus) => {
    const current = tasksRef.current.find((t) => t.id === id)
    if (!current || current.status === status) return

    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
    try {
      const saved = await api.tasks.update(id, taskToInput({ ...current, status }))
      setTasks((prev) => replaceById(prev, saved))
    } catch (e) {
      const err = toApiError(e)
      setTasks((prev) =>
        err.status === 404
          ? removeById(prev, id)
          : // 只在狀態仍是這次的樂觀值時還原，避免蓋掉之後的變更
            prev.map((t) => (t.id === id && t.status === status ? { ...t, status: current.status } : t)),
      )
      throw err
    }
  }, [])

  const deleteTask = useCallback(async (id: number) => {
    try {
      await api.tasks.remove(id)
    } catch (e) {
      const err = toApiError(e)
      if (err.status !== 404) throw err
    }
    setTasks((prev) => removeById(prev, id))
  }, [])

  const value = useMemo(
    () => ({
      projects,
      tasks,
      status,
      error,
      reload,
      createProject,
      updateProject,
      deleteProject,
      createTask,
      updateTask,
      updateTaskStatus,
      deleteTask,
    }),
    [projects, tasks, status, error, reload, createProject, updateProject, deleteProject, createTask, updateTask, updateTaskStatus, deleteTask],
  )
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
