import { useState, type FormEvent } from 'react'
import { toApiError } from '../../lib/api'
import { PROJECT_STATUSES, PROJECT_STATUS_META } from '../../lib/constants'
import {
  PROJECT_DESCRIPTION_MAX,
  PROJECT_FIELD_ORDER,
  PROJECT_NAME_MAX,
  emptyProjectForm,
  formToProjectInput,
  projectToForm,
  validateProjectForm,
  type ProjectFormErrors,
  type ProjectFormValues,
} from '../../lib/projectForm'
import type { Project, ProjectInput, ProjectStatus } from '../../types'
import { Button } from '../ui/Button'
import { Field, controlClass, fieldAria } from '../ui/Field'
import { FormAlert } from '../ui/FormAlert'
import { Modal } from '../ui/Modal'

const FORM_ID = 'project-form'
const fieldId = (key: keyof ProjectFormValues) => `project-${key}`

interface ProjectFormModalProps {
  project?: Project
  onSubmit: (input: ProjectInput) => Promise<void>
  onClose: () => void
}

export function ProjectFormModal({ project, onSubmit, onClose }: ProjectFormModalProps) {
  const [values, setValues] = useState<ProjectFormValues>(() => (project ? projectToForm(project) : emptyProjectForm()))
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [serverErrors, setServerErrors] = useState<ProjectFormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  const errors: ProjectFormErrors = { ...(submitted ? validateProjectForm(values) : {}), ...serverErrors }

  const set = <K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) => {
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
    const result = validateProjectForm(values)
    const firstInvalid = PROJECT_FIELD_ORDER.find((k) => result[k])
    if (firstInvalid) {
      setSubmitted(true)
      document.getElementById(fieldId(firstInvalid))?.focus()
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      await onSubmit(formToProjectInput(values))
    } catch (err) {
      const apiError = toApiError(err)
      const fields = apiError.fieldErrors as ProjectFormErrors
      setServerErrors(fields)
      setFormError(apiError.message)
      const first = PROJECT_FIELD_ORDER.find((k) => fields[k])
      if (first) document.getElementById(fieldId(first))?.focus()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={project ? '編輯專案' : '新增專案'}
      onClose={() => !saving && onClose()}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            取消
          </Button>
          <Button type="submit" form={FORM_ID} disabled={saving}>
            {saving ? '儲存中…' : project ? '儲存變更' : '建立專案'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} noValidate onSubmit={(e) => void handleSubmit(e)} className="grid gap-4">
        {formError && <FormAlert message={formError} />}

        <Field
          id={fieldId('name')}
          label="專案名稱"
          required
          error={errors.name}
          hint={`${values.name.trim().length}/${PROJECT_NAME_MAX}`}
        >
          <input
            {...fieldAria(fieldId('name'), errors.name, true)}
            data-autofocus
            type="text"
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="例如：電商平台改版"
            className={controlClass(Boolean(errors.name))}
          />
        </Field>

        <Field id={fieldId('status')} label="狀態" required error={errors.status}>
          <select
            {...fieldAria(fieldId('status'), errors.status)}
            value={values.status}
            onChange={(e) => set('status', e.target.value as ProjectStatus)}
            className={controlClass(Boolean(errors.status))}
          >
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PROJECT_STATUS_META[s].label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          id={fieldId('description')}
          label="描述"
          error={errors.description}
          hint={`${values.description.trim().length}/${PROJECT_DESCRIPTION_MAX}`}
        >
          <textarea
            {...fieldAria(fieldId('description'), errors.description, true)}
            rows={4}
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="專案目標、範圍…"
            className={controlClass(Boolean(errors.description), 'resize-y')}
          />
        </Field>
      </form>
    </Modal>
  )
}
