import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  listStripeCustomers,
  listStripeProducts,
  listStripePrices,
  createStripeSubscription,
  type Customer,
  type Product,
  type StripeSubscriptionRequest,
} from '../../../api'
import { useToast } from '../../Toast'

interface CreateStripeSubscriptionDialogProps {
  connectionId: number
  customerId?: string  // Pre-selected customer
  onClose: () => void
  onSuccess: () => void
}

/**
 * Stripe Subscription creation dialog
 * Maps to: POST /v1/subscriptions
 * https://docs.stripe.com/api/subscriptions/create
 */
export function CreateStripeSubscriptionDialog({ connectionId, customerId: preselectedCustomerId, onClose, onSuccess }: CreateStripeSubscriptionDialogProps) {
  // Required fields
  const [customerId, setCustomerId] = useState(preselectedCustomerId || '')
  const [priceId, setPriceId] = useState('')

  // Optional fields
  const [quantity, setQuantity] = useState('1')
  const [collectionMethod, setCollectionMethod] = useState<'charge_automatically' | 'send_invoice'>('charge_automatically')
  const [paymentBehavior, setPaymentBehavior] = useState<StripeSubscriptionRequest['payment_behavior']>('error_if_incomplete')
  const [daysUntilDue, setDaysUntilDue] = useState('30')
  const [trialPeriodDays, setTrialPeriodDays] = useState('')
  const [coupon, setCoupon] = useState('')
  const [description, setDescription] = useState('')
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false)

  const { showToast } = useToast()

  // Fetch customers for dropdown
  const { data: customers, isLoading: loadingCustomers } = useQuery({
    queryKey: ['stripe', 'customers', connectionId],
    queryFn: () => listStripeCustomers(connectionId),
    enabled: !preselectedCustomerId,
  })

  // Fetch products and their prices
  const { data: prices, isLoading: loadingPrices } = useQuery({
    queryKey: ['stripe', 'all-prices', connectionId],
    queryFn: async () => {
      const products = await listStripeProducts(connectionId)
      const allPrices: (Product & { productName: string })[] = []
      for (const product of products) {
        const productPrices = await listStripePrices(connectionId, product.id)
        allPrices.push(...productPrices.map(p => ({ ...p, productName: product.name })))
      }
      return allPrices
    },
  })

  const createMutation = useMutation({
    mutationFn: () => {
      const req: StripeSubscriptionRequest = {
        customer_id: customerId,
        price_id: priceId,
        quantity: parseInt(quantity, 10) || 1,
        collection_method: collectionMethod,
        payment_behavior: paymentBehavior,
        cancel_at_period_end: cancelAtPeriodEnd,
      }

      if (collectionMethod === 'send_invoice') {
        req.days_until_due = parseInt(daysUntilDue, 10) || 30
      }

      if (trialPeriodDays.trim()) {
        req.trial_period_days = parseInt(trialPeriodDays, 10)
      }

      if (coupon.trim()) {
        req.coupon = coupon.trim()
      }

      if (description.trim()) {
        req.description = description.trim()
      }

      return createStripeSubscription(connectionId, req)
    },
    onSuccess: () => {
      showToast('Subscription created successfully', 'success')
      onSuccess()
    },
    onError: (err) => {
      showToast(err, 'error')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerId) {
      showToast('Please select a customer', 'error')
      return
    }

    if (!priceId) {
      showToast('Please select a price', 'error')
      return
    }

    const qty = parseInt(quantity, 10)
    if (isNaN(qty) || qty < 1) {
      showToast('Quantity must be at least 1', 'error')
      return
    }

    if (trialPeriodDays.trim()) {
      const trial = parseInt(trialPeriodDays, 10)
      if (isNaN(trial) || trial < 0) {
        showToast('Trial days must be a positive number', 'error')
        return
      }
    }

    if (collectionMethod === 'send_invoice') {
      const days = parseInt(daysUntilDue, 10)
      if (isNaN(days) || days < 1) {
        showToast('Days until due must be at least 1', 'error')
        return
      }
    }

    createMutation.mutate()
  }

  const formatPrice = (price: Product & { productName: string }) => {
    const amount = (price.price_in_cents / 100).toFixed(2)
    const interval = price.interval === 1 ? price.interval_unit : `${price.interval} ${price.interval_unit}s`
    return `${price.productName} - $${amount} / ${interval}`
  }

  // Two-column form row style
  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
    gap: '8px',
  }

  const labelStyle: React.CSSProperties = {
    flex: '0 0 140px',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    textAlign: 'right',
    paddingRight: '8px',
  }

  const inputContainerStyle: React.CSSProperties = {
    flex: 1,
  }

  return (
    <div className="modal-overlay">
      <div className="modal-dialog" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          Create Stripe Subscription
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '12px 16px' }}>
            {/* Required Section */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Required
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>Customer *</label>
                <div style={inputContainerStyle}>
                  {preselectedCustomerId ? (
                    <div className="form-static" style={{ fontSize: '13px', padding: '6px 0' }}>{preselectedCustomerId}</div>
                  ) : (
                    <select
                      className="form-input"
                      style={{ fontSize: '13px', padding: '6px 8px' }}
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      disabled={loadingCustomers}
                    >
                      <option value="">Select a customer...</option>
                      {customers?.map((customer: Customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.email || `${customer.first_name} ${customer.last_name}`.trim() || customer.id}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>Price *</label>
                <div style={inputContainerStyle}>
                  <select
                    className="form-input"
                    style={{ fontSize: '13px', padding: '6px 8px' }}
                    value={priceId}
                    onChange={(e) => setPriceId(e.target.value)}
                    disabled={loadingPrices}
                  >
                    <option value="">Select a price...</option>
                    {prices?.map((price) => (
                      <option key={price.id} value={price.id}>
                        {formatPrice(price)}
                      </option>
                    ))}
                  </select>
                  {loadingPrices && <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Loading...</div>}
                </div>
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>Quantity</label>
                <div style={inputContainerStyle}>
                  <input
                    type="number"
                    className="form-input"
                    style={{ fontSize: '13px', padding: '6px 8px', width: '80px' }}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Billing Section */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Billing
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>Collection Method</label>
                <div style={inputContainerStyle}>
                  <select
                    className="form-input"
                    style={{ fontSize: '13px', padding: '6px 8px' }}
                    value={collectionMethod}
                    onChange={(e) => setCollectionMethod(e.target.value as 'charge_automatically' | 'send_invoice')}
                  >
                    <option value="charge_automatically">Charge automatically</option>
                    <option value="send_invoice">Send invoice</option>
                  </select>
                </div>
              </div>

              {collectionMethod === 'send_invoice' && (
                <div style={rowStyle}>
                  <label style={labelStyle}>Days Until Due</label>
                  <div style={inputContainerStyle}>
                    <input
                      type="number"
                      className="form-input"
                      style={{ fontSize: '13px', padding: '6px 8px', width: '80px' }}
                      value={daysUntilDue}
                      onChange={(e) => setDaysUntilDue(e.target.value)}
                      min="1"
                    />
                  </div>
                </div>
              )}

              <div style={rowStyle}>
                <label style={labelStyle}>Payment Behavior</label>
                <div style={inputContainerStyle}>
                  <select
                    className="form-input"
                    style={{ fontSize: '13px', padding: '6px 8px' }}
                    value={paymentBehavior}
                    onChange={(e) => setPaymentBehavior(e.target.value as StripeSubscriptionRequest['payment_behavior'])}
                  >
                    <option value="error_if_incomplete">Error if incomplete</option>
                    <option value="default_incomplete">Default incomplete</option>
                    <option value="allow_incomplete">Allow incomplete</option>
                    <option value="pending_if_incomplete">Pending if incomplete</option>
                  </select>
                </div>
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>Coupon Code</label>
                <div style={inputContainerStyle}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontSize: '13px', padding: '6px 8px' }}
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="Pre-created in Stripe"
                  />
                </div>
              </div>
            </div>

            {/* Trial & Options Section */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Trial & Options
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>Trial Period (days)</label>
                <div style={inputContainerStyle}>
                  <input
                    type="number"
                    className="form-input"
                    style={{ fontSize: '13px', padding: '6px 8px', width: '80px' }}
                    value={trialPeriodDays}
                    onChange={(e) => setTrialPeriodDays(e.target.value)}
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>Cancel at Period End</label>
                <div style={inputContainerStyle}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={cancelAtPeriodEnd}
                      onChange={(e) => setCancelAtPeriodEnd(e.target.checked)}
                    />
                    <span style={{ fontSize: '13px' }}>Auto-cancel after current period</span>
                  </label>
                </div>
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>Description</label>
                <div style={inputContainerStyle}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontSize: '13px', padding: '6px 8px' }}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Internal note"
                  />
                </div>
              </div>
            </div>

            {/* Info box */}
            <div style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
              padding: '8px',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: '4px',
              lineHeight: '1.4'
            }}>
              Note: Customer must have a payment method attached for automatic charging.
              In test mode, add a payment method via the Stripe Dashboard first.
            </div>
          </div>
          <div className="modal-footer" style={{ padding: '12px 16px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createMutation.isPending || !customerId || !priceId}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
