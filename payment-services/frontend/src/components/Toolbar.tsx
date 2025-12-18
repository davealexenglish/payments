import { Plus, RefreshCw, HelpCircle } from 'lucide-react'
import type { SelectedNode } from '../App'

interface ToolbarProps {
  selectedNode: SelectedNode | null
  onAddConnection: () => void
  onRefresh: () => void
}

export function Toolbar({ onAddConnection, onRefresh }: ToolbarProps) {
  const handleHelp = () => {
    window.open('/docs/index.html', '_blank')
  }

  return (
    <div className="toolbar">
      <span className="toolbar-title">Payment Billing Hub</span>
      <button className="btn btn-primary btn-sm" onClick={onAddConnection}>
        <Plus size={14} />
        Add Connection
      </button>
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
