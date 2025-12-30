import { useState, useCallback, useRef } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TreeView } from './components/TreeView'
import { PropertiesPanel } from './components/PropertiesPanel'
import { Toolbar } from './components/Toolbar'
import { ToastProvider } from './components/Toast'
import { ConfirmProvider, useConfirm } from './components/ConfirmDialog'
import { AlertProvider, useAlert } from './components/AlertDialog'
// Stripe dialogs
import {
  CreateStripeCustomerDialog,
  CreateStripeProductDialog,
  CreateStripePriceDialog,
  CreateStripeSubscriptionDialog,
  CreateStripeCouponDialog,
  StripeConnectionDialog,
  EditStripeCustomerDialog,
  EditStripeSubscriptionDialog,
} from './components/dialogs/stripe'
import { EditStripeCouponDialog } from './components/dialogs/stripe/EditStripeCouponDialog'
// Maxio dialogs
import {
  CreateMaxioCustomerDialog,
  CreateMaxioProductFamilyDialog,
  CreateMaxioProductDialog,
  CreateMaxioSubscriptionDialog,
  MaxioConnectionDialog,
} from './components/dialogs/maxio'
// Zuora dialogs
import { ZuoraConnectionDialog } from './components/dialogs/zuora'
import type { ProductFamily, Customer, Product, StripeCoupon } from './api'
import type { ConnectionData } from './components/nodes/types'
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

// Dialog state types
interface CustomerDialogState {
  show: boolean
  connectionId: number | null
  platformType: string | null
  customer?: Customer // For edit mode
}

interface SubscriptionDialogState {
  show: boolean
  connectionId: number | null
  platformType: string | null
  customerId?: string
}

interface ProductFamilyDialogState {
  show: boolean
  connectionId: number | null
  platformType: string | null
}

interface ProductDialogState {
  show: boolean
  connectionId: number | null
  platformType: string | null
  productFamily: ProductFamily | null
  product?: Product // For edit mode
}

interface CouponDialogState {
  show: boolean
  connectionId: number | null
}

interface EditCouponDialogState {
  show: boolean
  connectionId: number | null
  coupon: StripeCoupon | null
}

interface EditSubscriptionDialogState {
  show: boolean
  connectionId: number | null
  subscriptionId: string | null
  platformType: string | null
}

interface ConnectionDialogState {
  show: boolean
  mode: 'create' | 'edit'
  platformType: 'maxio' | 'stripe' | 'zuora' | null
  connectionId: number | null
  connectionData: ConnectionData | null
}

function AppContent() {
  const confirm = useConfirm()
  const alert = useAlert()
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null)
  const [treePanelWidth, setTreePanelWidth] = useState(300)
  const [connectionDialog, setConnectionDialog] = useState<ConnectionDialogState>({
    show: false,
    mode: 'create',
    platformType: null,
    connectionId: null,
    connectionData: null,
  })

  // Dialog states
  const [customerDialog, setCustomerDialog] = useState<CustomerDialogState>({
    show: false,
    connectionId: null,
    platformType: null,
  })
  const [subscriptionDialog, setSubscriptionDialog] = useState<SubscriptionDialogState>({
    show: false,
    connectionId: null,
    platformType: null,
  })
  const [productFamilyDialog, setProductFamilyDialog] = useState<ProductFamilyDialogState>({
    show: false,
    connectionId: null,
    platformType: null,
  })
  const [productDialog, setProductDialog] = useState<ProductDialogState>({
    show: false,
    connectionId: null,
    platformType: null,
    productFamily: null,
  })
  const [couponDialog, setCouponDialog] = useState<CouponDialogState>({
    show: false,
    connectionId: null,
  })
  const [editCouponDialog, setEditCouponDialog] = useState<EditCouponDialogState>({
    show: false,
    connectionId: null,
    coupon: null,
  })
  const [editSubscriptionDialog, setEditSubscriptionDialog] = useState<EditSubscriptionDialogState>({
    show: false,
    connectionId: null,
    subscriptionId: null,
    platformType: null,
  })

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
    setCustomerDialog({
      show: true,
      connectionId,
      platformType: platformType || null,
    })
  }, [])

  const handleCreateSubscription = useCallback((connectionId: number, customerId?: string, platformType?: string) => {
    setSubscriptionDialog({
      show: true,
      connectionId,
      platformType: platformType || null,
      customerId,
    })
  }, [])

  const handleCreateProductFamily = useCallback((connectionId: number, platformType?: string) => {
    setProductFamilyDialog({
      show: true,
      connectionId,
      platformType: platformType || null,
    })
  }, [])

  const handleCreateProduct = useCallback((connectionId: number, productFamily: ProductFamily, platformType?: string) => {
    setProductDialog({
      show: true,
      connectionId,
      platformType: platformType || null,
      productFamily,
    })
  }, [])

  const handleEditCustomer = useCallback((connectionId: number, customer: Customer, platformType?: string) => {
    setCustomerDialog({
      show: true,
      connectionId,
      platformType: platformType || null,
      customer,
    })
  }, [])

  const handleEditProduct = useCallback((connectionId: number, product: Product, platformType?: string) => {
    setProductDialog({
      show: true,
      connectionId,
      platformType: platformType || null,
      productFamily: product.product_family || null,
      product,
    })
  }, [])

  const handleCreateCoupon = useCallback((connectionId: number) => {
    setCouponDialog({
      show: true,
      connectionId,
    })
  }, [])

  const handleDeleteCoupon = useCallback(async (connectionId: number, couponId: string) => {
    const confirmed = await confirm({
      title: 'Delete Coupon',
      message: `Are you sure you want to delete coupon "${couponId}"?`,
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!confirmed) return
    try {
      const { deleteStripeCoupon } = await import('./api')
      await deleteStripeCoupon(connectionId, couponId)
      queryClient.invalidateQueries({ queryKey: ['stripe', 'coupons', connectionId] })
    } catch (err) {
      console.error('Delete coupon failed:', err)
    }
  }, [confirm])

  const handleEditCoupon = useCallback((connectionId: number, coupon: StripeCoupon) => {
    setEditCouponDialog({
      show: true,
      connectionId,
      coupon,
    })
  }, [])

  const handleArchivePrice = useCallback(async (connectionId: number, priceId: string) => {
    const confirmed = await confirm({
      title: 'Archive Price',
      message: 'Are you sure you want to archive this price? It will no longer be available for new subscriptions.',
      confirmLabel: 'Archive',
      danger: true,
    })
    if (!confirmed) return
    try {
      const { archiveStripePrice } = await import('./api')
      await archiveStripePrice(connectionId, priceId)
      // Refresh the products tree to show the price is archived
      queryClient.invalidateQueries({ queryKey: ['stripe', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['stripe', `products-`] })
    } catch (err) {
      console.error('Archive price failed:', err)
      await alert({
        title: 'Archive Failed',
        message: 'Failed to archive price. It may be in use by active subscriptions.',
        type: 'error',
      })
    }
  }, [confirm, alert])

  const handleEditSubscription = useCallback((connectionId: number, subscriptionId: string, platformType?: string) => {
    setEditSubscriptionDialog({
      show: true,
      connectionId,
      subscriptionId,
      platformType: platformType || null,
    })
  }, [])

  const handleAddConnection = useCallback((platformType: 'maxio' | 'stripe' | 'zuora') => {
    setConnectionDialog({
      show: true,
      mode: 'create',
      platformType,
      connectionId: null,
      connectionData: null,
    })
  }, [])

  const handleEditConnection = useCallback((connectionId: number, platformType: string, connectionData: ConnectionData) => {
    setConnectionDialog({
      show: true,
      mode: 'edit',
      platformType: platformType as 'maxio' | 'stripe' | 'zuora',
      connectionId,
      connectionData,
    })
  }, [])

  const closeConnectionDialog = useCallback(() => {
    setConnectionDialog({
      show: false,
      mode: 'create',
      platformType: null,
      connectionId: null,
      connectionData: null,
    })
  }, [])

  const handleRefreshTree = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['tree'] })
    queryClient.invalidateQueries({ queryKey: ['connections'] })
  }, [])

  const closeCustomerDialog = useCallback(() => {
    setCustomerDialog({ show: false, connectionId: null, platformType: null })
  }, [])

  const closeSubscriptionDialog = useCallback(() => {
    setSubscriptionDialog({ show: false, connectionId: null, platformType: null })
  }, [])

  const closeProductFamilyDialog = useCallback(() => {
    setProductFamilyDialog({ show: false, connectionId: null, platformType: null })
  }, [])

  const closeProductDialog = useCallback(() => {
    setProductDialog({ show: false, connectionId: null, platformType: null, productFamily: null })
  }, [])

  const closeCouponDialog = useCallback(() => {
    setCouponDialog({ show: false, connectionId: null })
  }, [])

  const closeEditCouponDialog = useCallback(() => {
    setEditCouponDialog({ show: false, connectionId: null, coupon: null })
  }, [])

  const closeEditSubscriptionDialog = useCallback(() => {
    setEditSubscriptionDialog({ show: false, connectionId: null, subscriptionId: null, platformType: null })
  }, [])

  // Render vendor-specific customer dialog
  const renderCustomerDialog = () => {
    if (!customerDialog.show || !customerDialog.connectionId) return null

    const { connectionId, platformType, customer } = customerDialog
    const onCreateSuccess = () => {
      closeCustomerDialog()
      queryClient.invalidateQueries({ queryKey: [platformType, 'customers'] })
    }
    const onEditSuccess = (updatedCustomer: Customer) => {
      closeCustomerDialog()
      queryClient.invalidateQueries({ queryKey: [platformType, 'customers'] })
      // Update the selected node with the new customer data
      if (selectedNode && selectedNode.type === 'customer') {
        setSelectedNode({
          ...selectedNode,
          name: updatedCustomer.email || `${updatedCustomer.first_name} ${updatedCustomer.last_name}`.trim() || selectedNode.name,
          data: updatedCustomer,
        })
      }
    }

    switch (platformType) {
      case 'stripe':
        // Use edit dialog if customer is provided, otherwise create dialog
        if (customer) {
          return (
            <EditStripeCustomerDialog
              connectionId={connectionId}
              customer={customer}
              onClose={closeCustomerDialog}
              onSuccess={onEditSuccess}
            />
          )
        }
        return (
          <CreateStripeCustomerDialog
            connectionId={connectionId}
            onClose={closeCustomerDialog}
            onSuccess={onCreateSuccess}
          />
        )
      case 'maxio':
        return (
          <CreateMaxioCustomerDialog
            connectionId={connectionId}
            customer={customer}
            onClose={closeCustomerDialog}
            onSuccess={onCreateSuccess}
          />
        )
      default:
        return null
    }
  }

  // Render vendor-specific subscription dialog
  const renderSubscriptionDialog = () => {
    if (!subscriptionDialog.show || !subscriptionDialog.connectionId) return null

    const { connectionId, platformType, customerId } = subscriptionDialog
    const onSuccess = () => {
      closeSubscriptionDialog()
      queryClient.invalidateQueries({ queryKey: [platformType, 'subscriptions'] })
    }

    // Get customer label from selected node if this is a customer subscription
    const customerData = selectedNode?.type === 'customer' ? selectedNode.data as Customer | undefined : undefined
    const customerLabel = customerData?.email || (customerData ? `${customerData.first_name || ''} ${customerData.last_name || ''}`.trim() : undefined) || undefined

    switch (platformType) {
      case 'stripe':
        return (
          <CreateStripeSubscriptionDialog
            connectionId={connectionId}
            customerId={customerId}
            customerLabel={customerLabel}
            onClose={closeSubscriptionDialog}
            onSuccess={onSuccess}
          />
        )
      case 'maxio':
        return (
          <CreateMaxioSubscriptionDialog
            connectionId={connectionId}
            customerId={customerId}
            onClose={closeSubscriptionDialog}
            onSuccess={onSuccess}
          />
        )
      default:
        return null
    }
  }

  // Render vendor-specific product family dialog
  const renderProductFamilyDialog = () => {
    if (!productFamilyDialog.show || !productFamilyDialog.connectionId) return null

    const { connectionId, platformType } = productFamilyDialog
    const onSuccess = () => {
      closeProductFamilyDialog()
      queryClient.invalidateQueries({ queryKey: [platformType, 'product-families'] })
    }

    switch (platformType) {
      case 'stripe':
        // In Stripe, "Product Family" = Product
        return (
          <CreateStripeProductDialog
            connectionId={connectionId}
            onClose={closeProductFamilyDialog}
            onSuccess={onSuccess}
          />
        )
      case 'maxio':
        return (
          <CreateMaxioProductFamilyDialog
            connectionId={connectionId}
            onClose={closeProductFamilyDialog}
            onSuccess={onSuccess}
          />
        )
      default:
        return null
    }
  }

  // Render vendor-specific product dialog
  const renderProductDialog = () => {
    if (!productDialog.show || !productDialog.connectionId) return null

    const { connectionId, platformType, productFamily, product } = productDialog
    const onSuccess = () => {
      closeProductDialog()
      if (productFamily?.id) {
        queryClient.invalidateQueries({ queryKey: [platformType, `products-${productFamily.id}`] })
      }
      queryClient.invalidateQueries({ queryKey: [platformType, 'products'] })
    }

    switch (platformType) {
      case 'stripe':
        // In Stripe, "Product" under a Product = Price
        if (!productFamily) return null
        return (
          <CreateStripePriceDialog
            connectionId={connectionId}
            product={productFamily}
            onClose={closeProductDialog}
            onSuccess={onSuccess}
          />
        )
      case 'maxio':
        if (!productFamily) return null
        return (
          <CreateMaxioProductDialog
            connectionId={connectionId}
            productFamily={productFamily}
            product={product}
            onClose={closeProductDialog}
            onSuccess={onSuccess}
          />
        )
      default:
        return null
    }
  }

  // Render coupon dialog (Stripe only)
  const renderCouponDialog = () => {
    if (!couponDialog.show || !couponDialog.connectionId) return null

    const { connectionId } = couponDialog
    const onSuccess = () => {
      closeCouponDialog()
      queryClient.invalidateQueries({ queryKey: ['stripe', 'coupons', connectionId] })
    }

    return (
      <CreateStripeCouponDialog
        connectionId={connectionId}
        onClose={closeCouponDialog}
        onSuccess={onSuccess}
      />
    )
  }

  // Render edit coupon dialog (Stripe only)
  const renderEditCouponDialog = () => {
    if (!editCouponDialog.show || !editCouponDialog.connectionId || !editCouponDialog.coupon) return null

    const { connectionId, coupon } = editCouponDialog
    const onSuccess = () => {
      closeEditCouponDialog()
      queryClient.invalidateQueries({ queryKey: ['stripe', 'coupons', connectionId] })
    }

    return (
      <EditStripeCouponDialog
        connectionId={connectionId}
        coupon={coupon}
        onClose={closeEditCouponDialog}
        onSuccess={onSuccess}
      />
    )
  }

  // Render edit subscription dialog (Stripe only)
  const renderEditSubscriptionDialog = () => {
    if (!editSubscriptionDialog.show || !editSubscriptionDialog.connectionId || !editSubscriptionDialog.subscriptionId) return null

    const { connectionId, subscriptionId, platformType } = editSubscriptionDialog
    const onSuccess = () => {
      closeEditSubscriptionDialog()
      queryClient.invalidateQueries({ queryKey: [platformType, 'subscriptions', connectionId] })
    }

    // Currently only Stripe is supported
    if (platformType === 'stripe') {
      return (
        <EditStripeSubscriptionDialog
          connectionId={connectionId}
          subscriptionId={subscriptionId}
          onClose={closeEditSubscriptionDialog}
          onSuccess={onSuccess}
        />
      )
    }

    return null
  }

  // Render vendor-specific connection dialog
  const renderConnectionDialog = () => {
    if (!connectionDialog.show || !connectionDialog.platformType) return null

    const { mode, platformType, connectionId, connectionData } = connectionDialog
    const onSuccess = () => {
      closeConnectionDialog()
      handleRefreshTree()
    }

    switch (platformType) {
      case 'maxio':
        return (
          <MaxioConnectionDialog
            connectionId={mode === 'edit' ? connectionId ?? undefined : undefined}
            existingData={mode === 'edit' && connectionData ? {
              name: connectionData.name,
              subdomain: connectionData.subdomain || '',
              is_sandbox: connectionData.is_sandbox,
              api_key: connectionData.api_key,
            } : undefined}
            onClose={closeConnectionDialog}
            onSuccess={onSuccess}
          />
        )
      case 'stripe':
        return (
          <StripeConnectionDialog
            connectionId={mode === 'edit' ? connectionId ?? undefined : undefined}
            existingData={mode === 'edit' && connectionData ? {
              name: connectionData.name,
              is_sandbox: connectionData.is_sandbox,
              api_key: connectionData.api_key,
            } : undefined}
            onClose={closeConnectionDialog}
            onSuccess={onSuccess}
          />
        )
      case 'zuora':
        return (
          <ZuoraConnectionDialog
            connectionId={mode === 'edit' ? connectionId ?? undefined : undefined}
            existingData={mode === 'edit' && connectionData ? {
              name: connectionData.name,
              base_url: connectionData.base_url || 'https://rest.sandbox.na.zuora.com',
              is_sandbox: connectionData.is_sandbox,
              client_id: connectionData.client_id,
              client_secret: connectionData.client_secret,
            } : undefined}
            onClose={closeConnectionDialog}
            onSuccess={onSuccess}
          />
        )
      default:
        return null
    }
  }

  return (
    <div
      className="app"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <Toolbar onRefresh={handleRefreshTree} />
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
              onCreateCoupon={handleCreateCoupon}
              onEditCoupon={handleEditCoupon}
              onDeleteCoupon={handleDeleteCoupon}
              onArchivePrice={handleArchivePrice}
              onEditSubscription={handleEditSubscription}
              onAddConnection={handleAddConnection}
              onEditConnection={handleEditConnection}
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

      {/* Connection dialogs */}
      {renderConnectionDialog()}

      {/* Vendor-specific dialogs */}
      {renderCustomerDialog()}
      {renderSubscriptionDialog()}
      {renderProductFamilyDialog()}
      {renderProductDialog()}
      {renderCouponDialog()}
      {renderEditCouponDialog()}
      {renderEditSubscriptionDialog()}
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ConfirmProvider>
          <AlertProvider>
            <AppContent />
          </AlertProvider>
        </ConfirmProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}

export default App
