import type { ReactNode } from 'react'
import type { TreeNodeData, MenuItem, NodeContext, NodeHandler } from './types'

// Default node handler - provides minimal functionality
export const DefaultNodeHandler: NodeHandler = {
  getIcon: (_node: TreeNodeData, _iconSize: number): ReactNode => null,

  getContextMenuItems: (_context: NodeContext): MenuItem[] => [],

  hasChildren: (node: TreeNodeData): boolean => {
    return node.is_expandable || !!(node.children && node.children.length > 0)
  },

  isLazyLoaded: (_node: TreeNodeData): boolean => false,

  getDisplayName: (node: TreeNodeData): string => node.name,
}

// Factory for creating container node handlers (nodes that contain lazy-loaded children)
export function createContainerNodeHandler(
  overrides: Partial<NodeHandler> & {
    icon: (iconSize: number) => ReactNode
    getTypeSpecificMenuItems?: (context: NodeContext) => MenuItem[]
  }
): NodeHandler {
  return {
    getIcon: (_node: TreeNodeData, iconSize: number): ReactNode => overrides.icon(iconSize),

    getContextMenuItems: (context: NodeContext): MenuItem[] => {
      return overrides.getTypeSpecificMenuItems?.(context) || []
    },

    hasChildren: overrides.hasChildren || (() => true),

    isLazyLoaded: overrides.isLazyLoaded || (() => true),

    getDisplayName: overrides.getDisplayName || DefaultNodeHandler.getDisplayName,
  }
}

// Factory for creating leaf node handlers (nodes without children)
export function createLeafNodeHandler(
  overrides: Partial<NodeHandler> & {
    icon: (iconSize: number) => ReactNode
    getTypeSpecificMenuItems?: (context: NodeContext) => MenuItem[]
    getDisplayName?: (node: TreeNodeData) => string
  }
): NodeHandler {
  return {
    getIcon: (_node: TreeNodeData, iconSize: number): ReactNode => overrides.icon(iconSize),

    getContextMenuItems: (context: NodeContext): MenuItem[] => {
      return overrides.getTypeSpecificMenuItems?.(context) || []
    },

    hasChildren: () => false,

    isLazyLoaded: () => false,

    getDisplayName: overrides.getDisplayName || DefaultNodeHandler.getDisplayName,
  }
}

// Factory for creating expandable entity node handlers (e.g., product-family that contains products)
export function createExpandableEntityHandler(
  overrides: Partial<NodeHandler> & {
    icon: (iconSize: number) => ReactNode
    getTypeSpecificMenuItems?: (context: NodeContext) => MenuItem[]
    getDisplayName?: (node: TreeNodeData) => string
  }
): NodeHandler {
  return {
    getIcon: (_node: TreeNodeData, iconSize: number): ReactNode => overrides.icon(iconSize),

    getContextMenuItems: (context: NodeContext): MenuItem[] => {
      return overrides.getTypeSpecificMenuItems?.(context) || []
    },

    hasChildren: () => true,

    isLazyLoaded: () => true,

    getDisplayName: overrides.getDisplayName || DefaultNodeHandler.getDisplayName,
  }
}
