import { FileText, RefreshCw } from 'lucide-react'
import { createContainerNodeHandler, createLeafNodeHandler } from './BaseNode'
import type { MenuItem, NodeContext, TreeNodeData } from './types'
import type { Invoice } from '../../api'

// Invoices container node
export const InvoicesNode = createContainerNodeHandler({
  icon: (size) => <FileText size={size} />,

  getTypeSpecificMenuItems: (context: NodeContext): MenuItem[] => {
    const items: MenuItem[] = []
    const { connectionId, platformType, refreshQuery } = context

    if (connectionId && platformType) {
      items.push({
        label: 'Refresh',
        icon: <RefreshCw size={14} />,
        action: () => refreshQuery([platformType, 'invoices', String(connectionId)]),
      })
    }

    return items
  },
})

// Individual invoice node
export const InvoiceNode = createLeafNodeHandler({
  icon: (size) => <FileText size={size} />,

  getDisplayName: (node: TreeNodeData): string => {
    if (node.data) {
      const invoice = node.data as Invoice
      return `#${invoice.number} (${invoice.status})`
    }
    return node.name
  },
})
