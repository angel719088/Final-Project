import { CircleAlert } from 'lucide-react'

/** 表單層級的錯誤訊息（例如無法連線伺服器） */
export function FormAlert({ message }: { message: string }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      {message}
    </div>
  )
}
