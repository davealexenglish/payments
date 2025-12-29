import { Database, Plus } from 'lucide-react'
import { createContainerNodeHandler } from './BaseNode'
import type { MenuItem, NodeContext } from './types'

// Vendor root nodes (Maxio, Stripe, Zuora)
// These are static parent nodes that contain connection children

const createVendorNodeHandler = (
  vendorName: string,
  platformType: 'maxio' | 'stripe' | 'zuora'
) => createContainerNodeHandler({
  icon: (size) => <Database size={size} />,

  getTypeSpecificMenuItems: (context: NodeContext): MenuItem[] => {
    return [
      {
        label: `Add ${vendorName} Connection`,
        icon: <Plus size={14} />,
        action: () => context.addConnection(platformType),
      },
    ]
  },

  isLazyLoaded: () => false, // Vendor has static children (connections)

  getDisplayName: () => vendorName,
})

export const VendorMaxioNode = createVendorNodeHandler('Maxio', 'maxio')
export const VendorStripeNode = createVendorNodeHandler('Stripe', 'stripe')
export const VendorZuoraNode = createVendorNodeHandler('Zuora', 'zuora')
