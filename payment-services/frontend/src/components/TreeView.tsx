import { useState, useCallback, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronRight,
  ChevronDown,
  Database,
  Users,
  CreditCard,
  FileText,
  Package,
  DollarSign,
  User,
  RefreshCw,
  Plus,
  Trash2,
  TestTube,
} from 'lucide-react'
import api, { type TreeNode, type Customer, type Subscription, type Product, type Invoice } from '../api'
import type { SelectedNode } from '../App'

interface TreeViewProps {
  onSelectNode: (node: SelectedNode) => void
  onCreateCustomer: (connectionId: number) => void
}

interface ContextMenuState {
  x: number
  y: number
  node: TreeNode
}

export function TreeView({ onSelectNode, onCreateCustomer }: TreeViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const queryClient = useQueryClient()

  // Fetch tree structure
  const { data: tree, isLoading } = useQuery({
    queryKey: ['tree'],
    queryFn: api.getTree,
  })

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }, [])

  const handleNodeClick = useCallback(
    (node: TreeNode) => {
      setSelectedNodeId(node.id)
      onSelectNode({
        id: node.id,
        type: node.type,
        name: node.name,
        data: node.data,
        connectionId: node.connection_id,
        platformType: node.platform_type,
      })
    },
    [onSelectNode]
  )

  const handleContextMenu = useCallback((e: React.MouseEvent, node: TreeNode) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, node })
  }, [])

  const handleRefresh = useCallback(
    (connectionId: number, type: string) => {
      queryClient.invalidateQueries({ queryKey: ['maxio', type, connectionId] })
    },
    [queryClient]
  )

  const handleTestConnection = useCallback(
    async (connectionId: number) => {
      try {
        await api.testConnection(connectionId)
        queryClient.invalidateQueries({ queryKey: ['tree'] })
      } catch (err) {
        console.error('Test connection failed:', err)
      }
    },
    [queryClient]
  )

  const handleDeleteConnection = useCallback(
    async (connectionId: number) => {
      if (!confirm('Are you sure you want to delete this connection?')) return
      try {
        await api.deleteConnection(connectionId)
        queryClient.invalidateQueries({ queryKey: ['tree'] })
      } catch (err) {
        console.error('Delete connection failed:', err)
      }
    },
    [queryClient]
  )

  const getIcon = (type: string) => {
    const iconProps = { size: 14 }
    switch (type) {
      case 'platform-maxio':
      case 'platform-zuora':
      case 'platform-stripe':
        return <Database {...iconProps} />
      case 'customers':
        return <Users {...iconProps} />
      case 'customer':
        return <User {...iconProps} />
      case 'subscriptions':
        return <CreditCard {...iconProps} />
      case 'subscription':
        return <CreditCard {...iconProps} />
      case 'products':
        return <Package {...iconProps} />
      case 'product':
        return <Package {...iconProps} />
      case 'invoices':
        return <FileText {...iconProps} />
      case 'invoice':
        return <FileText {...iconProps} />
      case 'payments':
        return <DollarSign {...iconProps} />
      default:
        return <Database {...iconProps} />
    }
  }

  const renderContextMenu = () => {
    if (!contextMenu) return null

    const { node } = contextMenu
    const items: { label: string; icon: React.ReactNode; action: () => void; danger?: boolean }[] =
      []

    if (node.type.startsWith('platform-') && node.connection_id) {
      items.push({
        label: 'Test Connection',
        icon: <TestTube size={14} />,
        action: () => handleTestConnection(node.connection_id!),
      })
      items.push({
        label: 'Delete Connection',
        icon: <Trash2 size={14} />,
        action: () => handleDeleteConnection(node.connection_id!),
        danger: true,
      })
    }

    if (node.type === 'customers' && node.connection_id) {
      items.push({
        label: 'Create Customer',
        icon: <Plus size={14} />,
        action: () => onCreateCustomer(node.connection_id!),
      })
      items.push({
        label: 'Refresh',
        icon: <RefreshCw size={14} />,
        action: () => handleRefresh(node.connection_id!, 'customers'),
      })
    }

    if (['subscriptions', 'products', 'invoices', 'payments'].includes(node.type) && node.connection_id) {
      items.push({
        label: 'Refresh',
        icon: <RefreshCw size={14} />,
        action: () => handleRefresh(node.connection_id!, node.type),
      })
    }

    if (items.length === 0) return null

    return (
      <div
        className="context-menu"
        style={{ left: contextMenu.x, top: contextMenu.y }}
        onClick={(e) => e.stopPropagation()}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className={`context-menu-item ${item.danger ? 'danger' : ''}`}
            onClick={() => {
              item.action()
              setContextMenu(null)
            }}
          >
            {item.icon}
            {item.label}
          </div>
        ))}
      </div>
    )
  }

  const renderNode = (node: TreeNode, depth = 0) => {
    const isExpanded = expandedNodes.has(node.id)
    const isSelected = selectedNodeId === node.id
    const hasChildren = node.is_expandable || (node.children && node.children.length > 0)

    return (
      <div key={node.id}>
        <div
          className={`tree-node ${isSelected ? 'selected' : ''}`}
          style={{ paddingLeft: depth * 16 + 8 }}
          onClick={() => {
            handleNodeClick(node)
            if (hasChildren) toggleNode(node.id)
          }}
          onContextMenu={(e) => handleContextMenu(e, node)}
        >
          <span className="tree-node-toggle">
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )
            ) : null}
          </span>
          <span className="tree-node-icon">{getIcon(node.type)}</span>
          <span className="tree-node-name">{node.name}</span>
        </div>
        {isExpanded && hasChildren && (
          <div className="tree-children">
            {node.children?.map((child) => renderNode(child, depth + 1))}
            {/* Lazy load children for entity containers */}
            {!node.children && node.connection_id && (
              <LazyEntityList
                type={node.type}
                connectionId={node.connection_id}
                platformType={node.platform_type}
                depth={depth + 1}
                selectedNodeId={selectedNodeId}
                onNodeClick={handleNodeClick}
                onContextMenu={handleContextMenu}
                getIcon={getIcon}
              />
            )}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="tree-loading">
        <div className="spinner" />
        Loading...
      </div>
    )
  }

  if (!tree || tree.length === 0) {
    return <div className="tree-empty">No connections. Click "Add Connection" to get started.</div>
  }

  return (
    <>
      {tree.map((node) => renderNode(node))}
      {renderContextMenu()}
    </>
  )
}

// Lazy loading component for entity lists
interface LazyEntityListProps {
  type: string
  connectionId: number
  platformType?: string
  depth: number
  selectedNodeId: string | null
  onNodeClick: (node: TreeNode) => void
  onContextMenu: (e: React.MouseEvent, node: TreeNode) => void
  getIcon: (type: string) => React.ReactNode
}

type EntityItem = Customer | Subscription | Product | Invoice

function LazyEntityList({
  type,
  connectionId,
  platformType,
  depth,
  selectedNodeId,
  onNodeClick,
  onContextMenu,
  getIcon,
}: LazyEntityListProps) {
  const fetchFn = useCallback(async (): Promise<EntityItem[]> => {
    if (platformType !== 'maxio') return []

    switch (type) {
      case 'customers':
        return api.listMaxioCustomers(connectionId)
      case 'subscriptions':
        return api.listMaxioSubscriptions(connectionId)
      case 'products':
        return api.listMaxioProducts(connectionId)
      case 'invoices':
        return api.listMaxioInvoices(connectionId)
      default:
        return []
    }
  }, [type, connectionId, platformType])

  const { data, isLoading, error } = useQuery<EntityItem[]>({
    queryKey: ['maxio', type, connectionId],
    queryFn: fetchFn,
    enabled: platformType === 'maxio',
  })

  if (isLoading) {
    return (
      <div className="tree-loading" style={{ paddingLeft: depth * 16 + 8 }}>
        <div className="spinner" />
        Loading...
      </div>
    )
  }

  if (error) {
    return (
      <div className="tree-empty" style={{ paddingLeft: depth * 16 + 8, color: 'var(--error-color)' }}>
        Error loading data
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="tree-empty" style={{ paddingLeft: depth * 16 + 8 }}>
        No items
      </div>
    )
  }

  const getNodeName = (item: EntityItem): string => {
    if ('email' in item && 'first_name' in item) {
      const customer = item as Customer
      return customer.email || `${customer.first_name} ${customer.last_name}`
    }
    if ('state' in item && 'id' in item && !('number' in item)) {
      const subscription = item as Subscription
      return `#${subscription.id} (${subscription.state})`
    }
    if ('name' in item) {
      const product = item as Product
      return product.name
    }
    if ('number' in item && 'status' in item) {
      const invoice = item as Invoice
      return `#${invoice.number} (${invoice.status})`
    }
    return 'Unknown'
  }

  const getItemId = (item: EntityItem): string => {
    if ('uid' in item) return item.uid
    if ('id' in item) return String(item.id)
    return 'unknown'
  }

  const getItemType = () => {
    switch (type) {
      case 'customers':
        return 'customer'
      case 'subscriptions':
        return 'subscription'
      case 'products':
        return 'product'
      case 'invoices':
        return 'invoice'
      default:
        return type.slice(0, -1)
    }
  }

  return (
    <>
      {data.map((item: EntityItem) => {
        const itemId = getItemId(item)
        const nodeId = `${type.slice(0, -1)}-${connectionId}-${itemId}`
        const isSelected = selectedNodeId === nodeId
        const itemType = getItemType()

        return (
          <div
            key={nodeId}
            className={`tree-node ${isSelected ? 'selected' : ''}`}
            style={{ paddingLeft: depth * 16 + 8 }}
            onClick={() =>
              onNodeClick({
                id: nodeId,
                type: itemType,
                name: getNodeName(item),
                data: item,
                connection_id: connectionId,
                platform_type: platformType,
                is_expandable: false,
              })
            }
            onContextMenu={(e) =>
              onContextMenu(e, {
                id: nodeId,
                type: itemType,
                name: getNodeName(item),
                data: item,
                connection_id: connectionId,
                platform_type: platformType,
                is_expandable: false,
              })
            }
          >
            <span className="tree-node-toggle" />
            <span className="tree-node-icon">{getIcon(itemType)}</span>
            <span className="tree-node-name">{getNodeName(item)}</span>
          </div>
        )
      })}
    </>
  )
}
