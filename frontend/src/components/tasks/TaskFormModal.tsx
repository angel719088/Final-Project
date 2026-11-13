import { Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { PRIORITY_META, TASK_PRIORITIES, TASK_STATUSES, TASK_STATUS_META } from '../../lib/constants'
import {
  DESCRIPTION_MAX,
  FIELD_ORDER,
  TITLE_MAX,
  emptyTaskForm,
  formToTaskInput,
  taskToForm,
  validateTaskForm,
  type TaskFormErrors,
  type TaskFormValues,
} from '../../lib/taskForm'
import { toApiError } from '../../lib/api'
import { toISODate } from '../../lib/utils'
import type { Project, Task, TaskInput, TaskPriority, TaskStatus } from '../../types'
import { Button } from '../ui/Button'
import { Field, controlClass, fieldAria } from '../ui/Field'
import { FormAlert } from '../ui/FormAlert'
import { Modal } from '../ui/Modal'

const FORM_ID = 'task-form'
const fieldId = (key: keyof TaskFormValues) => `task-${key.replace('_', '-')}`

interface TaskFormModalProps {
  /** 有值為編輯模式，否則為新增 */
  task?: Task
  defaults?: { project_id?: number; status?: TaskStatus }
  projects: Project[]
  assignees: string[]
  /** 呼叫 API；拋出錯誤時表單保持開啟並顯示錯誤 */
  onSubmit: (input: TaskInput) => Promise<void>
  onDelete?: (task: Task) => void
  onClose: () => void
}

export function TaskFormModal({ task, defaults, projects, assignees, onSubmit, onDelete, onClose }: TaskFormModalProps) {
  const isEdit = Boolean(task)
  const [values, setValues] = useState<TaskFormValues>(() => (task ? taskToForm(task) : emptyTaskForm(defaults)))
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [serverErrors, setServerErrors] = useState<TaskFormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  const projectIds = projects.map((p) => p.id)
  // 前端驗證在第一次送出後才顯示、之後即時更新；後端回傳的欄位錯誤在該欄位被修改後清除
  const errors: TaskFormErrors = { ...(submitted ? validateTaskForm(values, projectIds) : {}), ...serverErrors }

  const set = <K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    setServerErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (saving) return
    const result = validateTaskForm(values, projectIds)
    const firstInvalid = FIELD_ORDER.find((key) => result[key])
    if (firstInvalid) {
      setSubmitted(true)
      document.getElementById(fieldId(firstInvalid))?.focus()
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      await onSubmit(formToTaskInput(values))
    } catch (err) {
      const apiError = toApiError(err)
      const fields = apiError.fieldErrors as TaskFormErrors
      setServerErrors(fields)
      setFormError(apiError.message)
      const first = FIELD_ORDER.find((key) => fields[key])
      if (first) document.getElementById(fieldId(first))?.focus()
    } finally {
      setSaving(false)
    }
  }

  const isPastDue = values.status !== 'done' && values.due_date !== '' && values.due_date < toISODate(new Date())

  return (
    <Modal
      size="lg"
      title={isEdit ? '編輯任務' : '新增任務'}
      description={isEdit ? undefined : '建立任務並指派負責人'}
      onClose={() => !saving && onClose()}
      footer={
        <>
          {task && onDelete && (
            <Button
              variant="ghost"
              icon={Trash2}
              onClick={() => onDelete(task)}
              disabled={saving}
              className="mr-auto text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              刪除
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            取消
          </Button>
          <Button type="submit" form={FORM_ID} disabled={saving}>
            {saving ? '儲存中…' : isEdit ? '儲存變更' : '建立任務'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} noValidate onSubmit={(e) => void handleSubmit(e)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {formError && (
          <div className="sm:col-span-2">
            <FormAlert message={formError} />
          </div>
        )}
        <Field
          id={fieldId('title')}
          label="標題"
          required
          error={errors.title}
          hint={`${values.title.trim().length}/${TITLE_MAX}`}
          className="sm:col-span-2"
        >
          <input
            {...fieldAria(fieldId('title'), errors.title, true)}
            data-autofocus
            type="text"
            value={values.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="例如：串接新金流 API"
            className={controlClass(Boolean(errors.title))}
          />
        </Field>

        <Field id={fieldId('project_id')} label="所屬專案" required error={errors.project_id}>
          <select
            {...fieldAria(fieldId('project_id'), errors.project_id)}
            value={values.project_id}
            onChange={(e) => set('project_id', e.target.value)}
            className={controlClass(Boolean(errors.project_id))}
          >
            <option value="">請選擇專案</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>

        <Field id={fieldId('assignee')} label="負責人" required error={errors.assignee}>
          <input
            {...fieldAria(fieldId('assignee'), errors.assignee)}
            type="text"
            list="assignee-options"
            value={values.assignee}
            onChange={(e) => set('assignee', e.target.value)}
            placeholder="輸入或選擇成員"
            className={controlClass(Boolean(errors.assignee))}
          />
          <datalist id="assignee-options">
            {assignees.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </Field>

        <Field
          id={fieldId('due_date')}
          label="截止日期"
          required
          error={errors.due_date}
          hint={isPastDue ? '此日期已過，任務將標示為逾期' : undefined}
        >
          <input
            {...fieldAria(fieldId('due_date'), errors.due_date, isPastDue)}
            type="date"
            value={values.due_date}
            onChange={(e) => set('due_date', e.target.value)}
            className={controlClass(Boolean(errors.due_date))}
          />
        </Field>

        <Field id={fieldId('priority')} label="優先級" required error={errors.priority}>
          <select
            {...fieldAria(fieldId('priority'), errors.priority)}
            value={values.priority}
            onChange={(e) => set('priority', e.target.value as TaskPriority)}
            className={controlClass(Boolean(errors.priority))}
          >
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_META[p].label}
              </option>
            ))}
          </select>
        </Field>

        <Field id={fieldId('status')} label="狀態" required error={errors.status} className="sm:col-span-2">
          <select
            {...fieldAria(fieldId('status'), errors.status)}
            value={values.status}
            onChange={(e) => set('status', e.target.value as TaskStatus)}
            className={controlClass(Boolean(errors.status))}
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {TASK_STATUS_META[s].label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          id={fieldId('description')}
          label="描述"
          error={errors.description}
          hint={`${values.description.trim().length}/${DESCRIPTION_MAX}`}
          className="sm:col-span-2"
        >
          <textarea
            {...fieldAria(fieldId('description'), errors.description, true)}
            rows={4}
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="補充任務背景、驗收條件或阻礙…"
            className={controlClass(Boolean(errors.description), 'resize-y')}
          />
        </Field>
      </form>
    </Modal>
  )
}
