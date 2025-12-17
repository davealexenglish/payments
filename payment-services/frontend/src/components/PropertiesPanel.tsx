import type { SelectedNode } from '../App'

interface PropertiesPanelProps {
  selectedNode: SelectedNode | null
}

export function PropertiesPanel({ selectedNode }: PropertiesPanelProps) {
  if (!selectedNode) {
    return <div className="empty-state">Select an item to view details</div>
  }

  const renderProperties = () => {
    const data = selectedNode.data as Record<string, unknown> | undefined

    if (!data) {
      return (
        <div className="properties-section">
          <div className="properties-grid">
            <span className="properties-label">Type</span>
            <span className="properties-value">{selectedNode.type}</span>
            <span className="properties-label">ID</span>
            <span className="properties-value">{selectedNode.id}</span>
          </div>
        </div>
      )
    }

    // Render based on node type
    switch (selectedNode.type) {
      case 'customer':
        return renderCustomerProperties(data)
      case 'subscription':
        return renderSubscriptionProperties(data)
      case 'product':
        return renderProductProperties(data)
      case 'invoice':
        return renderInvoiceProperties(data)
      default:
        return renderGenericProperties(data)
    }
  }

  const renderCustomerProperties = (data: Record<string, unknown>) => (
    <>
      <div className="properties-section">
        <div className="properties-section-title">Customer Details</div>
        <div className="properties-grid">
          <span className="properties-label">ID</span>
          <span className="properties-value">{String(data.id || '-')}</span>
          <span className="properties-label">Email</span>
          <span className="properties-value">{String(data.email || '-')}</span>
          <span className="properties-label">First Name</span>
          <span className="properties-value">{String(data.first_name || '-')}</span>
          <span className="properties-label">Last Name</span>
          <span className="properties-value">{String(data.last_name || '-')}</span>
          <span className="properties-label">Organization</span>
          <span className="properties-value">{String(data.organization || '-')}</span>
          <span className="properties-label">Reference</span>
          <span className="properties-value">{String(data.reference || '-')}</span>
          <span className="properties-label">Created</span>
          <span className="properties-value">{formatDate(data.created_at as string)}</span>
        </div>
      </div>
      {renderRawJson(data)}
    </>
  )

  const renderSubscriptionProperties = (data: Record<string, unknown>) => (
    <>
      <div className="properties-section">
        <div className="properties-section-title">Subscription Details</div>
        <div className="properties-grid">
          <span className="properties-label">ID</span>
          <span className="properties-value">{String(data.id || '-')}</span>
          <span className="properties-label">State</span>
          <span className="properties-value">
            <span className={`tree-node-status ${data.state === 'active' ? 'connected' : ''}`}>
              {String(data.state || '-')}
            </span>
          </span>
          <span className="properties-label">Product</span>
          <span className="properties-value">
            {(data.product as Record<string, unknown>)?.name as string || '-'}
          </span>
          <span className="properties-label">Period Ends</span>
          <span className="properties-value">{formatDate(data.current_period_ends_at as string)}</span>
          <span className="properties-label">Activated</span>
          <span className="properties-value">{formatDate(data.activated_at as string)}</span>
          <span className="properties-label">Created</span>
          <span className="properties-value">{formatDate(data.created_at as string)}</span>
        </div>
      </div>
      {renderRawJson(data)}
    </>
  )

  const renderProductProperties = (data: Record<string, unknown>) => (
    <>
      <div className="properties-section">
        <div className="properties-section-title">Product Details</div>
        <div className="properties-grid">
          <span className="properties-label">ID</span>
          <span className="properties-value">{String(data.id || '-')}</span>
          <span className="properties-label">Name</span>
          <span className="properties-value">{String(data.name || '-')}</span>
          <span className="properties-label">Handle</span>
          <span className="properties-value">{String(data.handle || '-')}</span>
          <span className="properties-label">Price</span>
          <span className="properties-value">
            {data.price_in_cents ? `$${(Number(data.price_in_cents) / 100).toFixed(2)}` : '-'}
          </span>
          <span className="properties-label">Interval</span>
          <span className="properties-value">
            {data.interval && data.interval_unit
              ? `${data.interval} ${data.interval_unit}(s)`
              : '-'}
          </span>
          <span className="properties-label">Description</span>
          <span className="properties-value">{String(data.description || '-')}</span>
        </div>
      </div>
      {renderRawJson(data)}
    </>
  )

  const renderInvoiceProperties = (data: Record<string, unknown>) => (
    <>
      <div className="properties-section">
        <div className="properties-section-title">Invoice Details</div>
        <div className="properties-grid">
          <span className="properties-label">UID</span>
          <span className="properties-value">{String(data.uid || '-')}</span>
          <span className="properties-label">Number</span>
          <span className="properties-value">{String(data.number || '-')}</span>
          <span className="properties-label">Status</span>
          <span className="properties-value">
            <span className={`tree-node-status ${data.status === 'paid' ? 'connected' : ''}`}>
              {String(data.status || '-')}
            </span>
          </span>
          <span className="properties-label">Total</span>
          <span className="properties-value">{String(data.total_amount || '-')}</span>
          <span className="properties-label">Due Date</span>
          <span className="properties-value">{String(data.due_date || '-')}</span>
          <span className="properties-label">Created</span>
          <span className="properties-value">{formatDate(data.created_at as string)}</span>
        </div>
      </div>
      {renderRawJson(data)}
    </>
  )

  const renderGenericProperties = (data: Record<string, unknown>) => (
    <>
      <div className="properties-section">
        <div className="properties-section-title">Properties</div>
        <div className="properties-grid">
          {Object.entries(data).slice(0, 10).map(([key, value]) => (
            <>
              <span key={`label-${key}`} className="properties-label">{key}</span>
              <span key={`value-${key}`} className="properties-value">
                {typeof value === 'object' ? JSON.stringify(value) : String(value ?? '-')}
              </span>
            </>
          ))}
        </div>
      </div>
      {renderRawJson(data)}
    </>
  )

  const renderRawJson = (data: Record<string, unknown>) => (
    <div className="properties-section">
      <div className="properties-section-title">Raw JSON</div>
      <pre className="properties-json">{JSON.stringify(data, null, 2)}</pre>
    </div>
  )

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-'
    try {
      return new Date(dateStr).toLocaleString()
    } catch {
      return dateStr
    }
  }

  return <div>{renderProperties()}</div>
}
