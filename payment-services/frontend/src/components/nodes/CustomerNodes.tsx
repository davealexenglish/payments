import { Users, User, Plus, RefreshCw } from 'lucide-react'
import { createContainerNodeHandler, createLeafNodeHandler } from './BaseNode'
import type { MenuItem, NodeContext, TreeNodeData } from './types'
import type { Customer } from '../../api'

// Customers container node
export const CustomersNode = createContainerNodeHandler({
  icon: (size) => <Users size={size} />,

  getTypeSpecificMenuItems: (context: NodeContext): MenuItem[] => {
    const items: MenuItem[] = []
    const { connectionId, createCustomer, refreshQuery } = context

    if (connectionId) {
      items.push({
        label: 'Create Customer',
        icon: <Plus size={14} />,
        action: () => createCustomer(connectionId),
      })
      items.push({
        label: 'Refresh',
        icon: <RefreshCw size={14} />,
        action: () => refreshQuery(['maxio', 'customers', String(connectionId)]),
      })
    }

    return items
  },
})

// Individual customer node
export const CustomerNode = createLeafNodeHandler({
  icon: (size) => <User size={size} />,

  getTypeSpecificMenuItems: (context: NodeContext): MenuItem[] => {
    const items: MenuItem[] = []
    const { node, connectionId, createSubscription } = context

    if (connectionId && node.data) {
      const customer = node.data as Customer
      items.push({
        label: 'Create Subscription',
        icon: <Plus size={14} />,
        action: () => createSubscription(connectionId, customer.id),
      })
    }

    return items
  },

  getDisplayName: (node: TreeNodeData): string => {
    if (node.data) {
      const customer = node.data as Customer
      return customer.email || `${customer.first_name} ${customer.last_name}`
    }
    return node.name
  },
})
