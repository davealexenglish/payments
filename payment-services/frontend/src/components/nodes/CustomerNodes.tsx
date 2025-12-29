import { Users, User, Plus, RefreshCw, Pencil } from 'lucide-react'
import { createContainerNodeHandler, createLeafNodeHandler } from './BaseNode'
import type { MenuItem, NodeContext, TreeNodeData } from './types'
import type { Customer } from '../../api'

// Customers container node
export const CustomersNode = createContainerNodeHandler({
  icon: (size) => <Users size={size} />,

  getTypeSpecificMenuItems: (context: NodeContext): MenuItem[] => {
    const items: MenuItem[] = []
    const { connectionId, platformType, createCustomer, refreshQuery } = context

    if (connectionId && platformType) {
      items.push({
        label: 'Create Customer',
        icon: <Plus size={14} />,
        action: () => createCustomer(connectionId, platformType),
      })
      items.push({
        label: 'Refresh',
        icon: <RefreshCw size={14} />,
        action: () => refreshQuery([platformType, 'customers', String(connectionId)]),
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
    const { node, connectionId, platformType, createSubscription, editCustomer } = context

    if (connectionId && node.data) {
      const customer = node.data as Customer
      items.push({
        label: 'Edit Customer',
        icon: <Pencil size={14} />,
        action: () => editCustomer(connectionId, customer, platformType),
      })
      items.push({
        label: 'Create Subscription',
        icon: <Plus size={14} />,
        action: () => createSubscription(connectionId, customer.id, platformType),
      })
    }

    return items
  },

  getDisplayName: (node: TreeNodeData): string => {
    if (node.data) {
      const customer = node.data as Customer
      // Prefer organization, then email, then name
      if (customer.organization) {
        return customer.organization
      }
      if (customer.email) {
        return customer.email
      }
      const name = `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
      return name || customer.id
    }
    return node.name
  },
})
