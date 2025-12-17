import { Plus, RefreshCw } from 'lucide-react'
import type { SelectedNode } from '../App'

interface ToolbarProps {
  selectedNode: SelectedNode | null
  onAddConnection: () => void
  onRefresh: () => void
}

export function Toolbar({ onAddConnection, onRefresh }: ToolbarProps) {
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
    </div>
  )
}
