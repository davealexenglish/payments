import { Plus, RefreshCw, HelpCircle } from 'lucide-react'
import type { SelectedNode } from '../App'

interface ToolbarProps {
  selectedNode: SelectedNode | null
  onAddConnection: () => void
  onRefresh: () => void
}

// Helper to check if a node is a vendor root node
function isVendorNode(node: SelectedNode | null): boolean {
  if (!node) return false
  return node.type.startsWith('vendor-')
}

export function Toolbar({ selectedNode, onAddConnection, onRefresh }: ToolbarProps) {
  const handleHelp = () => {
    window.open('/docs/index.html', '_blank')
  }

  const canAddConnection = isVendorNode(selectedNode)

  return (
    <div className="toolbar">
      <span className="toolbar-title">Payment Billing Hub</span>
      <button
        className="btn btn-primary btn-sm"
        onClick={onAddConnection}
        disabled={!canAddConnection}
        title={canAddConnection ? 'Add a new connection' : 'Select a vendor (Maxio, Stripe, or Zuora) to add a connection'}
      >
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
