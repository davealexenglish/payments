import { useState, useCallback, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, ChevronDown } from 'lucide-react'
import api, { type TreeNode, type Customer, type Subscription, type Product, type Invoice, type ProductFamily, type StripeCoupon, type StripePayment, type ZuoraPayment } from '../api'
import type { SelectedNode } from '../App'
import { getNodeHandler, type TreeNodeData, type NodeContext, type MenuItem, type ConnectionData } from './nodes'
import { useConfirm } from './ConfirmDialog'

interface TreeViewProps {
  onSelectNode: (node: SelectedNode) => void
  onCreateCustomer: (connectionId: number, platformType?: string) => void
  onCreateSubscription: (connectionId: number, customerId?: string, platformType?: string) => void
  onCreateProductFamily: (connectionId: number, platformType?: string) => void
  onCreateProduct: (connectionId: number, productFamily: ProductFamily, platformType?: string) => void
  onEditCustomer: (connectionId: number, customer: Customer, platformType?: string) => void
  onEditProduct: (connectionId: number, product: Product, platformType?: string) => void
  onCreateCoupon?: (connectionId: number) => void
  onEditCoupon?: (connectionId: number, coupon: StripeCoupon) => void
  onDeleteCoupon?: (connectionId: number, couponId: string) => void
  onArchivePrice?: (connectionId: number, priceId: string) => void
  onEditSubscription?: (connectionId: number, subscriptionId: string, platformType?: string) => void
  onAddConnection: (platformType: 'maxio' | 'stripe' | 'zuora') => void
  onEditConnection: (connectionId: number, platformType: string, connectionData: ConnectionData) => void
}

interface ContextMenuState {
  x: number
  y: number
  items: MenuItem[]
}

const ICON_SIZE = 14

export function TreeView({ onSelectNode, onCreateCustomer, onCreateSubscription, onCreateProductFamily, onCreateProduct, onEditCustomer, onEditProduct, onCreateCoupon, onEditCoupon, onDeleteCoupon, onArchivePrice, onEditSubscription, onAddConnection, onEditConnection }: TreeViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const queryClient = useQueryClient()
  const confirm = useConfirm()

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
    (node: TreeNodeData) => {
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

  const handleContextMenu = useCallback((e: React.MouseEvent, node: TreeNodeData) => {
    e.preventDefault()

    // Select the node on right-click
    setSelectedNodeId(node.id)
    onSelectNode({
      id: node.id,
      type: node.type,
      name: node.name,
      data: node.data,
      connectionId: node.connection_id,
      platformType: node.platform_type,
    })

    const handler = getNodeHandler(node.type)
    const context: NodeContext = {
      node,
      connectionId: node.connection_id,
      platformType: node.platform_type,
      toggleNode,
      refreshQuery: (key: string[]) => queryClient.invalidateQueries({ queryKey: key }),
      createCustomer: onCreateCustomer,
      createSubscription: onCreateSubscription,
      createProductFamily: onCreateProductFamily,
      createProduct: onCreateProduct,
      editCustomer: onEditCustomer,
      editProduct: onEditProduct,
      onCreateCoupon,
      onEditCoupon,
      onDeleteCoupon,
      onArchivePrice,
      editSubscription: onEditSubscription,
      addConnection: onAddConnection,
      editConnection: onEditConnection,
      testConnection: handleTestConnection,
      deleteConnection: handleDeleteConnection,
    }

    const items = handler.getContextMenuItems(context)
    if (items.length > 0) {
      setContextMenu({ x: e.clientX, y: e.clientY, items })
    }
  }, [queryClient, toggleNode, onSelectNode, onCreateCustomer, onCreateSubscription, onCreateProductFamily, onCreateProduct, onEditCustomer, onEditProduct, onCreateCoupon, onEditCoupon, onDeleteCoupon, onArchivePrice, onEditSubscription, onAddConnection, onEditConnection])

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
      const confirmed = await confirm({
        title: 'Delete Connection',
        message: 'Are you sure you want to delete this connection? This action cannot be undone.',
        confirmLabel: 'Delete',
        danger: true,
      })
      if (!confirmed) return
      try {
        await api.deleteConnection(connectionId)
        queryClient.invalidateQueries({ queryKey: ['tree'] })
      } catch (err) {
        console.error('Delete connection failed:', err)
      }
    },
    [queryClient, confirm]
  )

  const renderContextMenu = () => {
    if (!contextMenu) return null

    return (
      <div
        className="context-menu"
        style={{ left: contextMenu.x, top: contextMenu.y }}
        onClick={(e) => e.stopPropagation()}
      >
        {contextMenu.items.map((item, index) => (
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
    const handler = getNodeHandler(node.type)
    const treeNodeData: TreeNodeData = {
      id: node.id,
      type: node.type,
      name: node.name,
      connection_id: node.connection_id,
      platform_type: node.platform_type,
      children: node.children as TreeNodeData[] | undefined,
      data: node.data,
      is_expandable: node.is_expandable,
    }

    const isExpanded = expandedNodes.has(node.id)
    const isSelected = selectedNodeId === node.id
    const hasChildren = handler.hasChildren(treeNodeData)
    const isLazyLoaded = handler.isLazyLoaded(treeNodeData)

    return (
      <div key={node.id}>
        <div
          className={`tree-node ${isSelected ? 'selected' : ''}`}
          style={{ paddingLeft: depth * 16 + 8 }}
          onClick={() => handleNodeClick(treeNodeData)}
          onContextMenu={(e) => handleContextMenu(e, treeNodeData)}
        >
          <span
            className="tree-node-toggle"
            onClick={(e) => {
              if (hasChildren) {
                e.stopPropagation()
                toggleNode(node.id)
              }
            }}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )
            ) : null}
          </span>
          <span className="tree-node-icon">{handler.getIcon(treeNodeData, ICON_SIZE)}</span>
          <span className="tree-node-name">{handler.getDisplayName(treeNodeData)}</span>
        </div>
        {isExpanded && hasChildren && (
          <div className="tree-children">
            {node.children?.map((child) => renderNode(child, depth + 1))}
            {/* Lazy load children for entity containers */}
            {isLazyLoaded && !node.children && node.connection_id && (
              <LazyEntityList
                type={node.type}
                connectionId={node.connection_id}
                platformType={node.platform_type}
                depth={depth + 1}
                selectedNodeId={selectedNodeId}
                expandedNodes={expandedNodes}
                onNodeClick={handleNodeClick}
                onContextMenu={handleContextMenu}
                onToggleNode={toggleNode}
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
    return <div className="tree-empty">No connections. Right-click on a vendor to add a connection.</div>
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
  expandedNodes: Set<string>
  onNodeClick: (node: TreeNodeData) => void
  onContextMenu: (e: React.MouseEvent, node: TreeNodeData) => void
  onToggleNode: (nodeId: string) => void
}

type EntityItem = Customer | Subscription | Product | Invoice | ProductFamily | StripeCoupon | StripePayment | ZuoraPayment

function LazyEntityList({
  type,
  connectionId,
  platformType,
  depth,
  selectedNodeId,
  expandedNodes,
  onNodeClick,
  onContextMenu,
  onToggleNode,
}: LazyEntityListProps) {
  const fetchFn = useCallback(async (): Promise<EntityItem[]> => {
    if (platformType === 'maxio') {
      switch (type) {
        case 'customers':
          return api.listMaxioCustomers(connectionId)
        case 'subscriptions':
          return api.listMaxioSubscriptions(connectionId)
        case 'product-families':
          return api.listMaxioProductFamilies(connectionId)
        case 'invoices':
          return api.listMaxioInvoices(connectionId)
        default:
          return []
      }
    } else if (platformType === 'zuora') {
      switch (type) {
        case 'customers':
          return api.listZuoraAccounts(connectionId)
        case 'subscriptions':
          return api.listZuoraSubscriptions(connectionId)
        case 'product-families':
          return api.listZuoraProductCatalogs(connectionId)
        case 'invoices':
          return api.listZuoraInvoices(connectionId)
        case 'payments':
          return api.listZuoraPayments(connectionId)
        default:
          return []
      }
    } else if (platformType === 'stripe') {
      switch (type) {
        case 'customers':
          return api.listStripeCustomers(connectionId)
        case 'subscriptions':
          return api.listStripeSubscriptions(connectionId)
        case 'product-families':
          return api.listStripeProducts(connectionId)
        case 'invoices':
          return api.listStripeInvoices(connectionId)
        case 'payments':
          return api.listStripePayments(connectionId)
        case 'coupons':
          return api.listStripeCoupons(connectionId)
        default:
          return []
      }
    }
    return []
  }, [type, connectionId, platformType])

  const { data, isLoading, error } = useQuery<EntityItem[]>({
    queryKey: [platformType || 'unknown', type, connectionId],
    queryFn: fetchFn,
    enabled: platformType === 'maxio' || platformType === 'zuora' || platformType === 'stripe',
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

  // Determine the entity type from the container type
  const getEntityType = (): string => {
    switch (type) {
      case 'customers': return 'customer'
      case 'subscriptions': return 'subscription'
      case 'product-families': return 'product-family'
      case 'invoices': return 'invoice'
      case 'coupons': return 'coupon'
      default: return type.slice(0, -1)
    }
  }

  const entityType = getEntityType()

  return (
    <>
      {data.map((item: EntityItem) => {
        const itemId = 'uid' in item ? item.uid : String(item.id)
        const nodeId = `${entityType}-${connectionId}-${itemId}`
        const handler = getNodeHandler(entityType)
        const isExpandable = handler.hasChildren({ id: nodeId, type: entityType, name: '', is_expandable: true, data: item })

        const treeNodeData: TreeNodeData = {
          id: nodeId,
          type: entityType,
          name: '', // Will be derived by handler
          data: item,
          connection_id: connectionId,
          platform_type: platformType,
          is_expandable: isExpandable,
        }

        const isSelected = selectedNodeId === nodeId
        const isExpanded = expandedNodes.has(nodeId)

        return (
          <div key={nodeId}>
            <div
              className={`tree-node ${isSelected ? 'selected' : ''}`}
              style={{ paddingLeft: depth * 16 + 8 }}
              onClick={() => {
                onNodeClick(treeNodeData)
                if (isExpandable) {
                  onToggleNode(nodeId)
                }
              }}
              onContextMenu={(e) => onContextMenu(e, treeNodeData)}
            >
              <span className="tree-node-toggle">
                {isExpandable ? (
                  isExpanded ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )
                ) : null}
              </span>
              <span className="tree-node-icon">{handler.getIcon(treeNodeData, ICON_SIZE)}</span>
              <span className="tree-node-name">{handler.getDisplayName(treeNodeData)}</span>
            </div>
            {/* Show products inside expanded product family */}
            {isExpandable && isExpanded && entityType === 'product-family' && (
              <ProductsList
                connectionId={connectionId}
                familyId={itemId}
                platformType={platformType}
                depth={depth + 1}
                selectedNodeId={selectedNodeId}
                onNodeClick={onNodeClick}
                onContextMenu={onContextMenu}
              />
            )}
          </div>
        )
      })}
    </>
  )
}

// Separate component for loading products within a product family
interface ProductsListProps {
  connectionId: number
  familyId: string
  platformType?: string
  depth: number
  selectedNodeId: string | null
  onNodeClick: (node: TreeNodeData) => void
  onContextMenu: (e: React.MouseEvent, node: TreeNodeData) => void
}

function ProductsList({
  connectionId,
  familyId,
  platformType,
  depth,
  selectedNodeId,
  onNodeClick,
  onContextMenu,
}: ProductsListProps) {
  const handler = getNodeHandler('product')

  const fetchProductsFn = useCallback(async (): Promise<Product[]> => {
    if (platformType === 'maxio') {
      return api.listMaxioProductsByFamily(connectionId, familyId)
    } else if (platformType === 'zuora') {
      return api.listZuoraProductsByRatePlan(connectionId, familyId)
    } else if (platformType === 'stripe') {
      return api.listStripePrices(connectionId, familyId)
    }
    return []
  }, [connectionId, familyId, platformType])

  const { data, isLoading, error } = useQuery<Product[]>({
    queryKey: [platformType || 'unknown', `products-${familyId}`, connectionId],
    queryFn: fetchProductsFn,
    enabled: platformType === 'maxio' || platformType === 'zuora' || platformType === 'stripe',
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
        Error loading products
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="tree-empty" style={{ paddingLeft: depth * 16 + 8 }}>
        No products
      </div>
    )
  }

  return (
    <>
      {data.map((product: Product) => {
        const nodeId = `product-${connectionId}-${product.id}`
        const isSelected = selectedNodeId === nodeId

        const treeNodeData: TreeNodeData = {
          id: nodeId,
          type: 'product',
          name: product.name,
          data: product,
          connection_id: connectionId,
          platform_type: platformType,
          is_expandable: false,
        }

        return (
          <div
            key={nodeId}
            className={`tree-node ${isSelected ? 'selected' : ''}`}
            style={{ paddingLeft: depth * 16 + 8 }}
            onClick={() => onNodeClick(treeNodeData)}
            onContextMenu={(e) => onContextMenu(e, treeNodeData)}
          >
            <span className="tree-node-toggle" />
            <span className="tree-node-icon">{handler.getIcon(treeNodeData, ICON_SIZE)}</span>
            <span className="tree-node-name">{handler.getDisplayName(treeNodeData)}</span>
          </div>
        )
      })}
    </>
  )
}
