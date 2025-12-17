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
import type { ProductFamily, Customer, Product } from './api'
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

function App() {
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null)
  const [treePanelWidth, setTreePanelWidth] = useState(300)
  const [showConnectionDialog, setShowConnectionDialog] = useState(false)
  const [showCreateCustomerDialog, setShowCreateCustomerDialog] = useState(false)
  const [createCustomerConnectionId, setCreateCustomerConnectionId] = useState<number | null>(null)
  const [showCreateSubscriptionDialog, setShowCreateSubscriptionDialog] = useState(false)
  const [createSubscriptionConnectionId, setCreateSubscriptionConnectionId] = useState<number | null>(null)
  const [createSubscriptionCustomerId, setCreateSubscriptionCustomerId] = useState<number | undefined>(undefined)
  const [showCreateProductFamilyDialog, setShowCreateProductFamilyDialog] = useState(false)
  const [createProductFamilyConnectionId, setCreateProductFamilyConnectionId] = useState<number | null>(null)
  const [showCreateProductDialog, setShowCreateProductDialog] = useState(false)
  const [createProductConnectionId, setCreateProductConnectionId] = useState<number | null>(null)
  const [createProductFamily, setCreateProductFamily] = useState<ProductFamily | null>(null)
  // Edit states
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null)
  const [editCustomerConnectionId, setEditCustomerConnectionId] = useState<number | null>(null)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [editProductConnectionId, setEditProductConnectionId] = useState<number | null>(null)

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

  const handleCreateCustomer = useCallback((connectionId: number) => {
    setCreateCustomerConnectionId(connectionId)
    setShowCreateCustomerDialog(true)
  }, [])

  const handleCreateSubscription = useCallback((connectionId: number, customerId?: number) => {
    setCreateSubscriptionConnectionId(connectionId)
    setCreateSubscriptionCustomerId(customerId)
    setShowCreateSubscriptionDialog(true)
  }, [])

  const handleCreateProductFamily = useCallback((connectionId: number) => {
    setCreateProductFamilyConnectionId(connectionId)
    setShowCreateProductFamilyDialog(true)
  }, [])

  const handleCreateProduct = useCallback((connectionId: number, productFamily: ProductFamily) => {
    setCreateProductConnectionId(connectionId)
    setCreateProductFamily(productFamily)
    setShowCreateProductDialog(true)
  }, [])

  const handleEditCustomer = useCallback((connectionId: number, customer: Customer) => {
    setEditCustomerConnectionId(connectionId)
    setEditCustomer(customer)
    setShowCreateCustomerDialog(true)
  }, [])

  const handleEditProduct = useCallback((connectionId: number, product: Product) => {
    setEditProductConnectionId(connectionId)
    setEditProduct(product)
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
          onAddConnection={() => setShowConnectionDialog(true)}
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
        {showConnectionDialog && (
          <PlatformConnectionDialog
            onClose={() => setShowConnectionDialog(false)}
            onSuccess={() => {
              setShowConnectionDialog(false)
              handleRefreshTree()
            }}
          />
        )}

        {/* Create/Edit Customer Dialog */}
        {showCreateCustomerDialog && (createCustomerConnectionId || editCustomerConnectionId) && (
          <CreateCustomerDialog
            connectionId={(editCustomerConnectionId || createCustomerConnectionId)!}
            customer={editCustomer || undefined}
            onClose={() => {
              setShowCreateCustomerDialog(false)
              setCreateCustomerConnectionId(null)
              setEditCustomer(null)
              setEditCustomerConnectionId(null)
            }}
            onSuccess={() => {
              setShowCreateCustomerDialog(false)
              setCreateCustomerConnectionId(null)
              setEditCustomer(null)
              setEditCustomerConnectionId(null)
              queryClient.invalidateQueries({ queryKey: ['maxio', 'customers'] })
            }}
          />
        )}

        {/* Create Subscription Dialog */}
        {showCreateSubscriptionDialog && createSubscriptionConnectionId && (
          <CreateSubscriptionDialog
            connectionId={createSubscriptionConnectionId}
            customerId={createSubscriptionCustomerId}
            onClose={() => {
              setShowCreateSubscriptionDialog(false)
              setCreateSubscriptionConnectionId(null)
              setCreateSubscriptionCustomerId(undefined)
            }}
            onSuccess={() => {
              setShowCreateSubscriptionDialog(false)
              setCreateSubscriptionConnectionId(null)
              setCreateSubscriptionCustomerId(undefined)
              queryClient.invalidateQueries({ queryKey: ['maxio', 'subscriptions'] })
            }}
          />
        )}

        {/* Create Product Family Dialog */}
        {showCreateProductFamilyDialog && createProductFamilyConnectionId && (
          <CreateProductFamilyDialog
            connectionId={createProductFamilyConnectionId}
            onClose={() => {
              setShowCreateProductFamilyDialog(false)
              setCreateProductFamilyConnectionId(null)
            }}
            onSuccess={() => {
              setShowCreateProductFamilyDialog(false)
              setCreateProductFamilyConnectionId(null)
              queryClient.invalidateQueries({ queryKey: ['maxio', 'product-families'] })
            }}
          />
        )}

        {/* Create/Edit Product Dialog */}
        {showCreateProductDialog && ((createProductConnectionId && createProductFamily) || (editProductConnectionId && editProduct)) && (
          <CreateProductDialog
            connectionId={(editProductConnectionId || createProductConnectionId)!}
            productFamily={createProductFamily || undefined}
            product={editProduct || undefined}
            onClose={() => {
              setShowCreateProductDialog(false)
              setCreateProductConnectionId(null)
              setCreateProductFamily(null)
              setEditProduct(null)
              setEditProductConnectionId(null)
            }}
            onSuccess={() => {
              setShowCreateProductDialog(false)
              setCreateProductConnectionId(null)
              const familyId = createProductFamily?.id || editProduct?.product_family?.id
              setCreateProductFamily(null)
              setEditProduct(null)
              setEditProductConnectionId(null)
              if (familyId) {
                queryClient.invalidateQueries({ queryKey: ['maxio', `products-${familyId}`] })
              }
              queryClient.invalidateQueries({ queryKey: ['maxio', 'products'] })
            }}
          />
        )}
      </div>
      </ToastProvider>
    </QueryClientProvider>
  )
}

export default App
