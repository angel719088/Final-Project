import { FolderPlus, Plus, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { DataBoundary } from '../components/layout/DataBoundary'
import { KanbanBoard } from '../components/tasks/KanbanBoard'
import { TaskFormModal } from '../components/tasks/TaskFormModal'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { controlClass } from '../components/ui/Field'
import { PageHeader } from '../components/ui/PageHeader'
import { SegmentedControl, type SegmentOption } from '../components/ui/SegmentedControl'
import { useToast } from '../components/ui/Toast'
import { useData } from '../context/DataContext'
import { toApiError } from '../lib/api'
import { PRIORITY_META, TASK_PRIORITIES, TASK_STATUS_META } from '../lib/constants'
import { isOverdue } from '../lib/utils'
import type { Task, TaskPriority, TaskStatus } from '../types'

type PriorityFilter = 'all' | TaskPriority
type FormState = { mode: 'create'; status: TaskStatus } | { mode: 'edit'; task: Task } | null

export default function TasksPage() {
  const { projects, tasks, status, createTask, updateTask, updateTaskStatus, deleteTask } = useData()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [priority, setPriority] = useState<PriorityFilter>('all')
  const [form, setForm] = useState<FormState>(null)
  const [deleting, setDeleting] = useState<Task | null>(null)

  // --- 篩選 ---
  const projectId = Number(params.get('project')) || null
  const selectedProject = projects.find((p) => p.id === projectId)
  const projectTasks = selectedProject ? tasks.filter((t) => t.project_id === selectedProject.id) : tasks

  const q = query.trim().toLowerCase()
  const matchesQuery = (t: Task) => {
    if (!q) return true
    const projectName = projects.find((p) => p.id === t.project_id)?.name ?? ''
    return [t.title, t.description ?? '', t.assignee, projectName].some((s) => s.toLowerCase().includes(q))
  }
  const searched = projectTasks.filter(matchesQuery)
  const visible = priority === 'all' ? searched : searched.filter((t) => t.priority === priority)

  const hasFilters = Boolean(q) || priority !== 'all' || Boolean(selectedProject)
  const overdue = visible.filter((t) => isOverdue(t)).length
  const canCreate = status === 'ready' && projects.length > 0

  const priorityOptions: SegmentOption<PriorityFilter>[] = [
    { value: 'all', label: '全部', count: searched.length },
    ...TASK_PRIORITIES.map((p) => ({
      value: p,
      label: PRIORITY_META[p].label,
      count: searched.filter((t) => t.priority === p).length,
    })),
  ]

  const assignees = useMemo(() => [...new Set(tasks.map((t) => t.assignee))].sort(), [tasks])

  const clearFilters = () => {
    setQuery('')
    setPriority('all')
    setParams({})
  }

  const changeStatus = (id: number, next: TaskStatus) => {
    updateTaskStatus(id, next).catch((e) => {
      toast.error(`無法移至「${TASK_STATUS_META[next].label}」：${toApiError(e).message}`)
    })
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await deleteTask(deleting.id)
      toast.success(`已刪除任務「${deleting.title}」`)
      setDeleting(null)
      setForm(null)
    } catch (e) {
      toast.error(`刪除失敗：${toApiError(e).message}`)
      throw e
    }
  }

  return (
    <>
      <PageHeader
        title="Tasks"
        description={
          status !== 'ready'
            ? '管理所有任務'
            : hasFilters
              ? `顯示 ${visible.length} / ${tasks.length} 項任務${overdue ? `，${overdue} 項逾期` : ''}`
              : `${tasks.length} 項任務${overdue ? `，其中 ${overdue} 項逾期` : ''}・拖曳卡片即可變更狀態`
        }
        actions={
          <Button icon={Plus} onClick={() => setForm({ mode: 'create', status: 'todo' })} disabled={!canCreate}>
            新增任務
          </Button>
        }
      />

      <DataBoundary>
        {projects.length === 0 ? (
          <Card>
            <EmptyState icon={FolderPlus} title="請先建立專案" description="每個任務都必須屬於一個專案。">
              <Link
                to="/projects"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                前往 Projects
              </Link>
            </EmptyState>
          </Card>
        ) : (
          <>
            {/* 工具列：搜尋 / 專案 / 優先級 */}
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
              <div className="relative lg:w-72">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜尋標題、描述、負責人…"
                  aria-label="搜尋任務"
                  className={controlClass(false, 'pl-9')}
                />
              </div>
              <select
                aria-label="依專案篩選"
                value={selectedProject?.id ?? ''}
                onChange={(e) => setParams(e.target.value ? { project: e.target.value } : {})}
                className={controlClass(false, 'lg:w-48')}
              >
                <option value="">全部專案</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <SegmentedControl ariaLabel="依優先級篩選" options={priorityOptions} value={priority} onChange={setPriority} />
              {hasFilters && (
                <Button variant="ghost" size="sm" icon={X} onClick={clearFilters} className="self-start lg:self-auto">
                  清除篩選
                </Button>
              )}
            </div>

            <KanbanBoard
              tasks={visible}
              projects={projects}
              showProjectName={!selectedProject}
              emptyText={hasFilters ? '沒有符合條件的任務' : tasks.length === 0 ? '還沒有任務，點 ＋ 新增' : '拖曳任務到這裡'}
              onStatusChange={changeStatus}
              onEdit={(task) => setForm({ mode: 'edit', task })}
              onDelete={setDeleting}
              onAdd={(s) => setForm({ mode: 'create', status: s })}
            />
          </>
        )}
      </DataBoundary>

      {form && (
        <TaskFormModal
          key={form.mode === 'edit' ? `edit-${form.task.id}` : `create-${form.status}`}
          task={form.mode === 'edit' ? form.task : undefined}
          defaults={form.mode === 'create' ? { status: form.status, project_id: selectedProject?.id } : undefined}
          projects={projects}
          assignees={assignees}
          onClose={() => setForm(null)}
          onDelete={setDeleting}
          onSubmit={async (input) => {
            if (form.mode === 'edit') {
              await updateTask(form.task.id, input)
              toast.success(`已更新任務「${input.title}」`)
            } else {
              await createTask(input)
              toast.success(`已建立任務「${input.title}」`)
            }
            setForm(null)
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="刪除任務"
          confirmLabel="刪除"
          message={
            <>
              確定要刪除「<span className="font-medium text-slate-900">{deleting.title}</span>」嗎？此操作無法復原。
            </>
          }
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  )
}
