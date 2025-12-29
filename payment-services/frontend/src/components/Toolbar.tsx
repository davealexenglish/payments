import { RefreshCw, HelpCircle } from 'lucide-react'

interface ToolbarProps {
  onRefresh: () => void
}

export function Toolbar({ onRefresh }: ToolbarProps) {
  const handleHelp = () => {
    window.open('/docs/index.html', '_blank')
  }

  return (
    <div className="toolbar">
      <span className="toolbar-title">Payment Billing Hub</span>
      <button className="btn btn-secondary btn-sm" onClick={onRefresh}>
        <RefreshCw size={14} />
        Refresh
      </button>
      <button className="btn btn-secondary btn-sm" onClick={handleHelp}>
        <HelpCircle size={14} />
        Help
      </button>
    </div>
  )
}
