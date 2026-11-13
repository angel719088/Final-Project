import { FileText, ShieldAlert, Sparkles, type LucideIcon } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'

const PLANNED: { icon: LucideIcon; title: string; description: string }[] = [
  { icon: FileText, title: '會議摘要', description: '貼上會議紀錄，自動整理摘要、決議與 Action Items。' },
  { icon: ShieldAlert, title: '風險分析', description: '依逾期 / 受阻任務與會議內容，建議潛在專案風險。' },
]

/** AI 功能尚未實作（見 DEVELOPMENT_PLAN.md Phase 4–6），此頁僅為佔位 */
export default function AIAssistantPage() {
  return (
    <>
      <PageHeader title="AI Assistant" description="以 AI 協助整理會議與辨識風險" actions={<Badge tone="violet">即將推出</Badge>} />

      <Card>
        <EmptyState
          icon={Sparkles}
          title="AI 助理開發中"
          description="此功能將在後端 AI Provider 整合完成後開放。"
        >
          <div className="grid max-w-2xl gap-3 text-left sm:grid-cols-2">
            {PLANNED.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-lg border border-slate-200 p-4">
                <Icon className="h-5 w-5 text-indigo-600" aria-hidden />
                <p className="mt-2 text-sm font-semibold text-slate-900">{title}</p>
                <p className="mt-1 text-xs text-slate-500">{description}</p>
              </div>
            ))}
          </div>
        </EmptyState>
      </Card>
    </>
  )
}
