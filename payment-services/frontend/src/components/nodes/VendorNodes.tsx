import { Database } from 'lucide-react'
import { createContainerNodeHandler } from './BaseNode'
import type { MenuItem, NodeContext } from './types'

// Vendor root nodes (Maxio, Stripe, Zuora)
// These are static parent nodes that contain connection children

const createVendorNodeHandler = (vendorName: string) => createContainerNodeHandler({
  icon: (size) => <Database size={size} />,

  getTypeSpecificMenuItems: (_context: NodeContext): MenuItem[] => {
    // Vendor nodes don't have context menu items
    // Add Connection is handled via toolbar
    return []
  },

  isLazyLoaded: () => false, // Vendor has static children (connections)

  getDisplayName: () => vendorName,
})

export const VendorMaxioNode = createVendorNodeHandler('Maxio (Chargify)')
export const VendorStripeNode = createVendorNodeHandler('Stripe')
export const VendorZuoraNode = createVendorNodeHandler('Zuora')
