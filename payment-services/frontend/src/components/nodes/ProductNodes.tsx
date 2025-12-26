import { FolderTree, Folder, Package, Plus, RefreshCw, Pencil } from 'lucide-react'
import { createContainerNodeHandler, createExpandableEntityHandler, createLeafNodeHandler } from './BaseNode'
import type { MenuItem, NodeContext, TreeNodeData } from './types'
import type { ProductFamily, Product } from '../../api'

// Product Families container node
export const ProductFamiliesNode = createContainerNodeHandler({
  icon: (size) => <FolderTree size={size} />,

  getTypeSpecificMenuItems: (context: NodeContext): MenuItem[] => {
    const items: MenuItem[] = []
    const { connectionId, platformType, createProductFamily, refreshQuery } = context

    if (connectionId && platformType) {
      items.push({
        label: 'Create Product Family',
        icon: <Plus size={14} />,
        action: () => createProductFamily(connectionId, platformType),
      })
      items.push({
        label: 'Refresh',
        icon: <RefreshCw size={14} />,
        action: () => refreshQuery([platformType, 'product-families', String(connectionId)]),
      })
    }

    return items
  },
})

// Individual product family node (expandable - contains products)
export const ProductFamilyNode = createExpandableEntityHandler({
  icon: (size) => <Folder size={size} />,

  getTypeSpecificMenuItems: (context: NodeContext): MenuItem[] => {
    const items: MenuItem[] = []
    const { node, connectionId, platformType, createProduct, refreshQuery } = context

    if (connectionId && platformType && node.data) {
      const family = node.data as ProductFamily
      items.push({
        label: 'Create Product',
        icon: <Plus size={14} />,
        action: () => createProduct(connectionId, family, platformType),
      })
      items.push({
        label: 'Refresh',
        icon: <RefreshCw size={14} />,
        action: () => refreshQuery([platformType, `products-${family.id}`, String(connectionId)]),
      })
    }

    return items
  },

  getDisplayName: (node: TreeNodeData): string => {
    if (node.data) {
      const family = node.data as ProductFamily
      return family.name
    }
    return node.name
  },
})

// Individual product node (leaf)
export const ProductNode = createLeafNodeHandler({
  icon: (size) => <Package size={size} />,

  getTypeSpecificMenuItems: (context: NodeContext): MenuItem[] => {
    const items: MenuItem[] = []
    const { node, connectionId, platformType, editProduct } = context

    if (connectionId && node.data) {
      const product = node.data as Product
      items.push({
        label: 'Edit Product',
        icon: <Pencil size={14} />,
        action: () => editProduct(connectionId, product, platformType),
      })
    }

    return items
  },

  getDisplayName: (node: TreeNodeData): string => {
    if (node.data) {
      const product = node.data as Product
      return product.name
    }
    return node.name
  },
})
