import { CreditCard, Plus, RefreshCw } from 'lucide-react'
import { createContainerNodeHandler, createLeafNodeHandler } from './BaseNode'
import type { MenuItem, NodeContext, TreeNodeData } from './types'
import type { Subscription } from '../../api'

// Subscriptions container node
export const SubscriptionsNode = createContainerNodeHandler({
  icon: (size) => <CreditCard size={size} />,

  getTypeSpecificMenuItems: (context: NodeContext): MenuItem[] => {
    const items: MenuItem[] = []
    const { connectionId, platformType, createSubscription, refreshQuery } = context

    if (connectionId && platformType) {
      items.push({
        label: 'Create Subscription',
        icon: <Plus size={14} />,
        action: () => createSubscription(connectionId, undefined, platformType),
      })
      items.push({
        label: 'Refresh',
        icon: <RefreshCw size={14} />,
        action: () => refreshQuery([platformType, 'subscriptions', String(connectionId)]),
      })
    }

    return items
  },
})

// Individual subscription node
export const SubscriptionNode = createLeafNodeHandler({
  icon: (size) => <CreditCard size={size} />,

  getDisplayName: (node: TreeNodeData): string => {
    if (node.data) {
      const subscription = node.data as Subscription
      return `#${subscription.id} (${subscription.state})`
    }
    return node.name
  },
})
