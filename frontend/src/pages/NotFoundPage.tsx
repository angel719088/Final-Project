import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'

export default function NotFoundPage() {
  return (
    <Card>
      <EmptyState icon={Compass} title="找不到此頁面" description="您要找的頁面不存在或已被移除。">
        <Link
          to="/"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          回到 Dashboard
        </Link>
      </EmptyState>
    </Card>
  )
}
