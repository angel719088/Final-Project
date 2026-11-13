import { useState, type ReactNode } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  title: string
  message: ReactNode
  confirmLabel?: string
  tone?: 'danger' | 'primary'
  /** 可為 async；執行期間按鈕停用、無法關閉。拋出錯誤時對話框保持開啟 */
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

/** 確認對話框；預設聚焦「取消」以避免誤按 Enter 執行破壞性操作 */
export function ConfirmDialog({ title, message, confirmLabel = '確認', tone = 'danger', onConfirm, onCancel }: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false)

  const handleConfirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
    } catch {
      // 錯誤由呼叫端顯示（例如 toast）；保持對話框開啟讓使用者重試或取消
    } finally {
      setBusy(false)
    }
  }
  const cancel = () => {
    if (!busy) onCancel()
  }

  return (
    <Modal
      size="sm"
      title={title}
      onClose={cancel}
      footer={
        <>
          <Button variant="secondary" onClick={cancel} disabled={busy} data-autofocus>
            取消
          </Button>
          <Button variant={tone} onClick={() => void handleConfirm()} disabled={busy}>
            {busy ? '處理中…' : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm text-slate-600">{message}</div>
    </Modal>
  )
}
