/**
 * Node Handler System for Payment Billing Hub
 *
 * Each node type has a handler that defines:
 * - getIcon: Returns the icon component
 * - getContextMenuItems: Returns context menu items
 * - hasChildren: Whether the node can have children
 * - isLazyLoaded: Whether children are loaded on demand
 * - getDisplayName: How to display the node name
 */

// Types
export * from './types'

// Base handlers
export { DefaultNodeHandler, createContainerNodeHandler, createLeafNodeHandler, createExpandableEntityHandler } from './BaseNode'

// Specific node handlers
export { PlatformNode } from './PlatformNodes'
export { CustomersNode, CustomerNode } from './CustomerNodes'
export { ProductFamiliesNode, ProductFamilyNode, ProductNode } from './ProductNodes'
export { SubscriptionsNode, SubscriptionNode } from './SubscriptionNodes'
export { InvoicesNode, InvoiceNode } from './InvoiceNodes'
export { PaymentsNode, PaymentNode } from './PaymentNodes'

// Import handlers for registry
import type { NodeHandler } from './types'
import { DefaultNodeHandler } from './BaseNode'
import { PlatformNode } from './PlatformNodes'
import { CustomersNode, CustomerNode } from './CustomerNodes'
import { ProductFamiliesNode, ProductFamilyNode, ProductNode } from './ProductNodes'
import { SubscriptionsNode, SubscriptionNode } from './SubscriptionNodes'
import { InvoicesNode, InvoiceNode } from './InvoiceNodes'
import { PaymentsNode, PaymentNode } from './PaymentNodes'

// Node type registry - maps node.type to handler
export const nodeRegistry: Record<string, NodeHandler> = {
  // Platform nodes
  'platform-maxio': PlatformNode,
  'platform-zuora': PlatformNode,
  'platform-stripe': PlatformNode,

  // Container nodes (contain lazy-loaded children)
  'customers': CustomersNode,
  'subscriptions': SubscriptionsNode,
  'product-families': ProductFamiliesNode,
  'invoices': InvoicesNode,
  'payments': PaymentsNode,

  // Entity nodes (individual items)
  'customer': CustomerNode,
  'subscription': SubscriptionNode,
  'product-family': ProductFamilyNode,
  'product': ProductNode,
  'invoice': InvoiceNode,
  'payment': PaymentNode,
}

/**
 * Get the appropriate handler for a node type
 */
export function getNodeHandler(nodeType: string): NodeHandler {
  return nodeRegistry[nodeType] || DefaultNodeHandler
}
