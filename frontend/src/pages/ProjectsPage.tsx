import { FolderOpen, Plus } from 'lucide-react'
import { useState } from 'react'
import { DataBoundary } from '../components/layout/DataBoundary'
import { ProjectCard } from '../components/projects/ProjectCard'
import { ProjectFormModal } from '../components/projects/ProjectFormModal'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { SegmentedControl, type SegmentOption } from '../components/ui/SegmentedControl'
import { useToast } from '../components/ui/Toast'
import { useData } from '../context/DataContext'
import { toApiError } from '../lib/api'
import { PROJECT_STATUSES, PROJECT_STATUS_META } from '../lib/constants'
import { tasksOfProject } from '../lib/stats'
import type { Project, ProjectStatus } from '../types'

type Filter = 'all' | ProjectStatus
type FormState = { mode: 'create' } | { mode: 'edit'; project: Project } | null

export default function ProjectsPage() {
  const { projects, tasks, status, createProject, updateProject, deleteProject } = useData()
  const toast = useToast()
  const [filter, setFilter] = useState<Filter>('all')
  const [form, setForm] = useState<FormState>(null)
  const [deleting, setDeleting] = useState<Project | null>(null)

  const options: SegmentOption<Filter>[] = [
    { value: 'all', label: '全部', count: projects.length },
    ...PROJECT_STATUSES.map((s) => ({
      value: s,
      label: PROJECT_STATUS_META[s].label,
      count: projects.filter((p) => p.status === s).length,
    })),
  ]
  const visible = filter === 'all' ? projects : projects.filter((p) => p.status === filter)
  const openCreate = () => setForm({ mode: 'create' })

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await deleteProject(deleting.id)
      toast.success(`已刪除專案「${deleting.name}」`)
      setDeleting(null)
    } catch (e) {
      toast.error(`刪除失敗：${toApiError(e).message}`)
      throw e
    }
  }

  return (
    <>
      <PageHeader
        title="Projects"
        description="管理所有專案與進度"
        actions={
          <Button icon={Plus} onClick={openCreate} disabled={status !== 'ready'}>
            新增專案
          </Button>
        }
      />

      <DataBoundary>
        {projects.length === 0 ? (
          <Card>
            <EmptyState icon={FolderOpen} title="還沒有任何專案" description="建立第一個專案後，就可以開始新增任務。">
              <Button icon={Plus} onClick={openCreate}>
                新增專案
              </Button>
            </EmptyState>
          </Card>
        ) : (
          <>
            <div className="mb-6">
              <SegmentedControl ariaLabel="依狀態篩選專案" options={options} value={filter} onChange={setFilter} />
            </div>
            {visible.length === 0 ? (
              <Card>
                <EmptyState icon={FolderOpen} title="沒有符合條件的專案" description="試試切換其他狀態篩選。" />
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {visible.map((p) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    tasks={tasksOfProject(tasks, p.id)}
                    onEdit={(project) => setForm({ mode: 'edit', project })}
                    onDelete={setDeleting}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </DataBoundary>

      {form && (
        <ProjectFormModal
          key={form.mode === 'edit' ? form.project.id : 'create'}
          project={form.mode === 'edit' ? form.project : undefined}
          onClose={() => setForm(null)}
          onSubmit={async (input) => {
            if (form.mode === 'edit') {
              await updateProject(form.project.id, input)
              toast.success(`已更新專案「${input.name}」`)
            } else {
              await createProject(input)
              toast.success(`已建立專案「${input.name}」`)
            }
            setForm(null)
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="刪除專案"
          confirmLabel="刪除"
          message={
            <>
              確定要刪除「<span className="font-medium text-slate-900">{deleting.name}</span>」嗎？
              {(() => {
                const count = tasksOfProject(tasks, deleting.id).length
                return count > 0 ? (
                  <>
                    此專案的 <span className="font-medium text-red-600">{count} 項任務</span>也會一併刪除。
                  </>
                ) : null
              })()}
              此操作無法復原。
            </>
          }
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  )
}
