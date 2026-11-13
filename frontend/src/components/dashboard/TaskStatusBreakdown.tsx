import { TASK_STATUSES, TASK_STATUS_META } from '../../lib/constants'
import { cn } from '../../lib/utils'
import type { TaskStatus } from '../../types'
import { Card, CardHeader } from '../ui/Card'

interface TaskStatusBreakdownProps {
  counts: Record<TaskStatus, number>
  total: number
}

export function TaskStatusBreakdown({ counts, total }: TaskStatusBreakdownProps) {
  return (
    <Card>
      <CardHeader title="任務狀態分布" description={`共 ${total} 項任務`} />
      <div className="px-5 py-4">
        {/* 堆疊長條 */}
        <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100" aria-hidden>
          {TASK_STATUSES.map((s) =>
            counts[s] > 0 ? (
              <div key={s} className={TASK_STATUS_META[s].dot} style={{ width: `${(counts[s] / total) * 100}%` }} />
            ) : null,
          )}
        </div>
        <ul className="mt-4 space-y-2.5">
          {TASK_STATUSES.map((s) => (
            <li key={s} className="flex items-center gap-2.5 text-sm">
              <span className={cn('h-2.5 w-2.5 rounded-sm', TASK_STATUS_META[s].dot)} aria-hidden />
              <span className="text-slate-600">{TASK_STATUS_META[s].label}</span>
              <span className="ml-auto font-semibold tabular-nums text-slate-900">{counts[s]}</span>
              <span className="w-10 text-right text-xs tabular-nums text-slate-400">
                {total ? Math.round((counts[s] / total) * 100) : 0}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}
