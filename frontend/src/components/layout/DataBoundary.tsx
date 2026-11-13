import type { ReactNode } from 'react'
import { useData } from '../../context/DataContext'
import { ErrorState, LoadingState } from '../ui/States'

/** 依資料載入狀態顯示 Loading / Error，資料就緒後才渲染內容 */
export function DataBoundary({ children }: { children: ReactNode }) {
  const { status, error, reload } = useData()
  if (status === 'loading') return <LoadingState />
  if (status === 'error') return <ErrorState message={error?.message ?? '發生未知錯誤'} onRetry={() => void reload()} />
  return <>{children}</>
}
