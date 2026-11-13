import { CloudOff, Loader2, RotateCw } from 'lucide-react'
import { Button } from './Button'
import { Card } from './Card'
import { EmptyState } from './EmptyState'

export function LoadingState({ label = '載入中…' }: { label?: string }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-20 text-sm text-slate-500">
      <Loader2 className="h-6 w-6 animate-spin text-indigo-600" aria-hidden />
      {label}
    </div>
  )
}

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorState({ title = '無法載入資料', message, onRetry }: ErrorStateProps) {
  return (
    <Card role="alert">
      <EmptyState icon={CloudOff} title={title} description={message}>
        {onRetry && (
          <Button icon={RotateCw} onClick={onRetry}>
            重新載入
          </Button>
        )}
      </EmptyState>
    </Card>
  )
}
