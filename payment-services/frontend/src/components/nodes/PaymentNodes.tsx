import { DollarSign, RefreshCw } from 'lucide-react'
import { createContainerNodeHandler, createLeafNodeHandler } from './BaseNode'
import type { MenuItem, NodeContext, TreeNodeData } from './types'

// Payments container node
export const PaymentsNode = createContainerNodeHandler({
  icon: (size) => <DollarSign size={size} />,

  getTypeSpecificMenuItems: (context: NodeContext): MenuItem[] => {
    const items: MenuItem[] = []
    const { connectionId, platformType, refreshQuery } = context

    if (connectionId && platformType) {
      items.push({
        label: 'Refresh',
        icon: <RefreshCw size={14} />,
        action: () => refreshQuery([platformType, 'payments', String(connectionId)]),
      })
    }

    return items
  },
})

// Individual payment node
export const PaymentNode = createLeafNodeHandler({
  icon: (size) => <DollarSign size={size} />,

  getDisplayName: (node: TreeNodeData): string => {
    return node.name
  },
})
