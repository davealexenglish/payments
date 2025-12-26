import { useState, useCallback, useRef } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TreeView } from './components/TreeView'
import { PropertiesPanel } from './components/PropertiesPanel'
import { Toolbar } from './components/Toolbar'
import { PlatformConnectionDialog } from './components/dialogs/PlatformConnectionDialog'
import { CreateCustomerDialog } from './components/dialogs/CreateCustomerDialog'
import { CreateSubscriptionDialog } from './components/dialogs/CreateSubscriptionDialog'
import { CreateProductFamilyDialog } from './components/dialogs/CreateProductFamilyDialog'
import { CreateProductDialog } from './components/dialogs/CreateProductDialog'
import { ToastProvider } from './components/Toast'
import type { ProductFamily, Customer, Product, PlatformConnection } from './api'
import './App.css'

const queryClient = new QueryClient()

export interface SelectedNode {
  id: string
  type: string
  name: string
  data: unknown
  connectionId?: number
  platformType?: string
}

// Helper to extract platform type from vendor node type
function getPlatformTypeFromVendorNode(nodeType: string): PlatformConnection['platform_type'] | null {
  if (nodeType === 'vendor-maxio') return 'maxio'
  if (nodeType === 'vendor-stripe') return 'stripe'
  if (nodeType === 'vendor-zuora') return 'zuora'
  return null
}

function App() {
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null)
  const [treePanelWidth, setTreePanelWidth] = useState(300)
  const [showConnectionDialog, setShowConnectionDialog] = useState(false)
  const [connectionDialogPlatformType, setConnectionDialogPlatformType] = useState<PlatformConnection['platform_type'] | null>(null)
  const [showCreateCustomerDialog, setShowCreateCustomerDialog] = useState(false)
  const [createCustomerConnectionId, setCreateCustomerConnectionId] = useState<number | null>(null)
  const [createCustomerPlatformType, setCreateCustomerPlatformType] = useState<string | null>(null)
  const [showCreateSubscriptionDialog, setShowCreateSubscriptionDialog] = useState(false)
  const [createSubscriptionConnectionId, setCreateSubscriptionConnectionId] = useState<number | null>(null)
  const [createSubscriptionCustomerId, setCreateSubscriptionCustomerId] = useState<string | undefined>(undefined)
  const [createSubscriptionPlatformType, setCreateSubscriptionPlatformType] = useState<string | null>(null)
  const [showCreateProductFamilyDialog, setShowCreateProductFamilyDialog] = useState(false)
  const [createProductFamilyConnectionId, setCreateProductFamilyConnectionId] = useState<number | null>(null)
  const [createProductFamilyPlatformType, setCreateProductFamilyPlatformType] = useState<string | null>(null)
  const [showCreateProductDialog, setShowCreateProductDialog] = useState(false)
  const [createProductConnectionId, setCreateProductConnectionId] = useState<number | null>(null)
  const [createProductFamily, setCreateProductFamily] = useState<ProductFamily | null>(null)
  const [createProductPlatformType, setCreateProductPlatformType] = useState<string | null>(null)
  // Edit states
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null)
  const [editCustomerConnectionId, setEditCustomerConnectionId] = useState<number | null>(null)
  const [editCustomerPlatformType, setEditCustomerPlatformType] = useState<string | null>(null)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [editProductConnectionId, setEditProductConnectionId] = useState<number | null>(null)
  const [editProductPlatformType, setEditProductPlatformType] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef<string | null>(null)

  const handleMouseDown = useCallback((resizer: string) => {
    isDragging.current = resizer
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    if (isDragging.current === 'left') {
      const newWidth = Math.max(200, Math.min(600, e.clientX - rect.left))
      setTreePanelWidth(newWidth)
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    isDragging.current = null
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])

  const handleCreateCustomer = useCallback((connectionId: number, platformType?: string) => {
    setCreateCustomerConnectionId(connectionId)
    setCreateCustomerPlatformType(platformType || null)
    setShowCreateCustomerDialog(true)
  }, [])

  const handleCreateSubscription = useCallback((connectionId: number, customerId?: string, platformType?: string) => {
    setCreateSubscriptionConnectionId(connectionId)
    setCreateSubscriptionCustomerId(customerId)
    setCreateSubscriptionPlatformType(platformType || null)
    setShowCreateSubscriptionDialog(true)
  }, [])

  const handleCreateProductFamily = useCallback((connectionId: number, platformType?: string) => {
    setCreateProductFamilyConnectionId(connectionId)
    setCreateProductFamilyPlatformType(platformType || null)
    setShowCreateProductFamilyDialog(true)
  }, [])

  const handleCreateProduct = useCallback((connectionId: number, productFamily: ProductFamily, platformType?: string) => {
    setCreateProductConnectionId(connectionId)
    setCreateProductFamily(productFamily)
    setCreateProductPlatformType(platformType || null)
    setShowCreateProductDialog(true)
  }, [])

  const handleEditCustomer = useCallback((connectionId: number, customer: Customer, platformType?: string) => {
    setEditCustomerConnectionId(connectionId)
    setEditCustomer(customer)
    setEditCustomerPlatformType(platformType || null)
    setShowCreateCustomerDialog(true)
  }, [])

  const handleEditProduct = useCallback((connectionId: number, product: Product, platformType?: string) => {
    setEditProductConnectionId(connectionId)
    setEditProduct(product)
    setEditProductPlatformType(platformType || null)
    setShowCreateProductDialog(true)
  }, [])

  const handleRefreshTree = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['tree'] })
    queryClient.invalidateQueries({ queryKey: ['connections'] })
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
      <div
        className="app"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <Toolbar
          selectedNode={selectedNode}
          onAddConnection={() => {
            const platformType = selectedNode ? getPlatformTypeFromVendorNode(selectedNode.type) : null
            if (platformType) {
              setConnectionDialogPlatformType(platformType)
              setShowConnectionDialog(true)
            }
          }}
          onRefresh={handleRefreshTree}
        />
        <div className="main-layout">
          {/* Left: Tree Panel */}
          <div className="panel tree-panel" style={{ width: treePanelWidth }}>
            <div className="panel-header">Payment Platforms</div>
            <div className="panel-content">
              <TreeView
                onSelectNode={setSelectedNode}
                onCreateCustomer={handleCreateCustomer}
                onCreateSubscription={handleCreateSubscription}
                onCreateProductFamily={handleCreateProductFamily}
                onCreateProduct={handleCreateProduct}
                onEditCustomer={handleEditCustomer}
                onEditProduct={handleEditProduct}
              />
            </div>
          </div>

          {/* Resizer */}
          <div
            className="resizer resizer-vertical"
            onMouseDown={() => handleMouseDown('left')}
          />

          {/* Right: Properties Panel */}
          <div className="panel properties-panel">
            <div className="panel-header">
              {selectedNode ? `${selectedNode.name}` : 'Select an item'}
            </div>
            <div className="panel-content">
              <PropertiesPanel selectedNode={selectedNode} />
            </div>
          </div>
        </div>

        {/* Connection Dialog */}
        {showConnectionDialog && connectionDialogPlatformType && (
          <PlatformConnectionDialog
            platformType={connectionDialogPlatformType}
            onClose={() => {
              setShowConnectionDialog(false)
              setConnectionDialogPlatformType(null)
            }}
            onSuccess={() => {
              setShowConnectionDialog(false)
              setConnectionDialogPlatformType(null)
              handleRefreshTree()
            }}
          />
        )}

        {/* Create/Edit Customer Dialog */}
        {showCreateCustomerDialog && (createCustomerConnectionId || editCustomerConnectionId) && (
          <CreateCustomerDialog
            connectionId={(editCustomerConnectionId || createCustomerConnectionId)!}
            platformType={(editCustomerPlatformType || createCustomerPlatformType) || 'maxio'}
            customer={editCustomer || undefined}
            onClose={() => {
              setShowCreateCustomerDialog(false)
              setCreateCustomerConnectionId(null)
              setCreateCustomerPlatformType(null)
              setEditCustomer(null)
              setEditCustomerConnectionId(null)
              setEditCustomerPlatformType(null)
            }}
            onSuccess={() => {
              setShowCreateCustomerDialog(false)
              setCreateCustomerConnectionId(null)
              setCreateCustomerPlatformType(null)
              setEditCustomer(null)
              setEditCustomerConnectionId(null)
              setEditCustomerPlatformType(null)
              const pt = editCustomerPlatformType || createCustomerPlatformType || 'maxio'
              queryClient.invalidateQueries({ queryKey: [pt, 'customers'] })
            }}
          />
        )}

        {/* Create Subscription Dialog */}
        {showCreateSubscriptionDialog && createSubscriptionConnectionId && (
          <CreateSubscriptionDialog
            connectionId={createSubscriptionConnectionId}
            platformType={createSubscriptionPlatformType || 'maxio'}
            customerId={createSubscriptionCustomerId}
            onClose={() => {
              setShowCreateSubscriptionDialog(false)
              setCreateSubscriptionConnectionId(null)
              setCreateSubscriptionCustomerId(undefined)
              setCreateSubscriptionPlatformType(null)
            }}
            onSuccess={() => {
              setShowCreateSubscriptionDialog(false)
              setCreateSubscriptionConnectionId(null)
              setCreateSubscriptionCustomerId(undefined)
              const pt = createSubscriptionPlatformType || 'maxio'
              setCreateSubscriptionPlatformType(null)
              queryClient.invalidateQueries({ queryKey: [pt, 'subscriptions'] })
            }}
          />
        )}

        {/* Create Product Family Dialog */}
        {showCreateProductFamilyDialog && createProductFamilyConnectionId && (
          <CreateProductFamilyDialog
            connectionId={createProductFamilyConnectionId}
            platformType={createProductFamilyPlatformType || 'maxio'}
            onClose={() => {
              setShowCreateProductFamilyDialog(false)
              setCreateProductFamilyConnectionId(null)
              setCreateProductFamilyPlatformType(null)
            }}
            onSuccess={() => {
              setShowCreateProductFamilyDialog(false)
              setCreateProductFamilyConnectionId(null)
              const pt = createProductFamilyPlatformType || 'maxio'
              setCreateProductFamilyPlatformType(null)
              queryClient.invalidateQueries({ queryKey: [pt, 'product-families'] })
            }}
          />
        )}

        {/* Create/Edit Product Dialog */}
        {showCreateProductDialog && ((createProductConnectionId && createProductFamily) || (editProductConnectionId && editProduct)) && (
          <CreateProductDialog
            connectionId={(editProductConnectionId || createProductConnectionId)!}
            platformType={(editProductPlatformType || createProductPlatformType) || 'maxio'}
            productFamily={createProductFamily || undefined}
            product={editProduct || undefined}
            onClose={() => {
              setShowCreateProductDialog(false)
              setCreateProductConnectionId(null)
              setCreateProductFamily(null)
              setCreateProductPlatformType(null)
              setEditProduct(null)
              setEditProductConnectionId(null)
              setEditProductPlatformType(null)
            }}
            onSuccess={() => {
              setShowCreateProductDialog(false)
              setCreateProductConnectionId(null)
              const familyId = createProductFamily?.id || editProduct?.product_family?.id
              const pt = editProductPlatformType || createProductPlatformType || 'maxio'
              setCreateProductFamily(null)
              setCreateProductPlatformType(null)
              setEditProduct(null)
              setEditProductConnectionId(null)
              setEditProductPlatformType(null)
              if (familyId) {
                queryClient.invalidateQueries({ queryKey: [pt, `products-${familyId}`] })
              }
              queryClient.invalidateQueries({ queryKey: [pt, 'products'] })
            }}
          />
        )}
      </div>
      </ToastProvider>
    </QueryClientProvider>
  )
}

export default App
