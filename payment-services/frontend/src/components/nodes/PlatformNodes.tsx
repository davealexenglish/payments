import { Database, TestTube, Trash2 } from 'lucide-react'
import { createContainerNodeHandler } from './BaseNode'
import type { MenuItem, NodeContext } from './types'

// Platform connection node (e.g., "Maxio Sandbox")
export const PlatformNode = createContainerNodeHandler({
  icon: (size) => <Database size={size} />,

  getTypeSpecificMenuItems: (context: NodeContext): MenuItem[] => {
    const items: MenuItem[] = []
    const { connectionId, testConnection, deleteConnection } = context

    if (connectionId) {
      items.push({
        label: 'Test Connection',
        icon: <TestTube size={14} />,
        action: () => testConnection(connectionId),
      })
      items.push({
        label: 'Delete Connection',
        icon: <Trash2 size={14} />,
        action: () => deleteConnection(connectionId),
        danger: true,
      })
    }

    return items
  },

  isLazyLoaded: () => false, // Platform has static children (customers, subscriptions, etc.)
})
