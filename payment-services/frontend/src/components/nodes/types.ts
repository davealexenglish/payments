// Types for tree node handlers - payment billing hub version

import type { ReactNode } from 'react'
import type { ProductFamily, Customer, Product } from '../../api'

export interface TreeNodeData {
  id: string
  type: string
  name: string
  connection_id?: number
  platform_type?: string
  children?: TreeNodeData[]
  data?: unknown
  is_expandable: boolean
}

export interface MenuItem {
  label: string
  icon?: ReactNode
  action: () => void
  danger?: boolean
  disabled?: boolean
}

// Context passed to node handlers for performing actions
export interface NodeContext {
  node: TreeNodeData
  connectionId?: number
  platformType?: string
  // Tree operations
  toggleNode: (id: string) => void
  refreshQuery: (queryKey: string[]) => void
  // Dialog/action operations - Create
  createCustomer: (connectionId: number) => void
  createSubscription: (connectionId: number, customerId?: number) => void
  createProductFamily: (connectionId: number) => void
  createProduct: (connectionId: number, productFamily: ProductFamily) => void
  // Dialog/action operations - Edit
  editCustomer: (connectionId: number, customer: Customer) => void
  editProduct: (connectionId: number, product: Product) => void
  // Connection operations
  testConnection: (connectionId: number) => void
  deleteConnection: (connectionId: number) => void
}

// Base interface for all node handlers
export interface NodeHandler {
  // Returns the icon component for this node type
  getIcon: (node: TreeNodeData, iconSize: number) => ReactNode

  // Returns context menu items for this node
  getContextMenuItems: (context: NodeContext) => MenuItem[]

  // Returns true if this node type has children that can be expanded
  hasChildren: (node: TreeNodeData) => boolean

  // Returns true if this node type should lazy-load children
  isLazyLoaded: (node: TreeNodeData) => boolean

  // Returns the display name for this node
  getDisplayName: (node: TreeNodeData) => string
}
