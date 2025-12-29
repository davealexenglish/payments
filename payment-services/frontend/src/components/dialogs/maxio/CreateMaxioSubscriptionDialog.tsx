import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import api, { type Customer, type Product } from '../../../api'
import { useToast } from '../../Toast'

interface CreateMaxioSubscriptionDialogProps {
  connectionId: number
  customerId?: string  // Pre-selected customer
  onClose: () => void
  onSuccess: () => void
}

type PaymentMethod = 'credit_card' | 'invoice'

/**
 * Maxio Subscription creation dialog
 * Maps to: POST /subscriptions.json
 * https://developers.maxio.com/docs/api-docs/subscriptions
 */
export function CreateMaxioSubscriptionDialog({ connectionId, customerId: preselectedCustomerId, onClose, onSuccess }: CreateMaxioSubscriptionDialogProps) {
  const [customerId, setCustomerId] = useState(preselectedCustomerId || '')
  const [productId, setProductId] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [reference, setReference] = useState('')
  const { showToast } = useToast()

  // Payment fields
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card')
  const [cardNumber, setCardNumber] = useState('')
  const [expirationMonth, setExpirationMonth] = useState('')
  const [expirationYear, setExpirationYear] = useState('')
  const [cvv, setCvv] = useState('')

  // Fetch customers for dropdown
  const { data: customers, isLoading: loadingCustomers } = useQuery({
    queryKey: ['maxio', 'customers', connectionId],
    queryFn: () => api.listMaxioCustomers(connectionId),
    enabled: !preselectedCustomerId,
  })

  // Fetch products for dropdown
  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['maxio', 'products', connectionId],
    queryFn: () => api.listMaxioProducts(connectionId),
  })

  // Get preselected customer details
  const { data: preselectedCustomer } = useQuery({
    queryKey: ['maxio', 'customer', connectionId, preselectedCustomerId],
    queryFn: () => api.getMaxioCustomer(connectionId, preselectedCustomerId!),
    enabled: !!preselectedCustomerId,
  })

  const createMutation = useMutation({
    mutationFn: () => {
      const requestData: Parameters<typeof api.createMaxioSubscription>[1] = {
        customer_id: Number(customerId),
        product_id: Number(productId),
        coupon_code: couponCode.trim() || undefined,
        reference: reference.trim() || undefined,
      }

      if (paymentMethod === 'invoice') {
        requestData.payment_collection_method = 'invoice'
      } else {
        requestData.credit_card_attributes = {
          full_number: cardNumber.replace(/\s/g, ''),
          expiration_month: Number(expirationMonth),
          expiration_year: Number(expirationYear),
          cvv: cvv.trim() || undefined,
        }
      }

      return api.createMaxioSubscription(connectionId, requestData)
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

    if (!productId) {
      showToast('Please select a product', 'error')
      return
    }

    // Validate credit card if that payment method is selected
    if (paymentMethod === 'credit_card') {
      if (!cardNumber.trim()) {
        showToast('Card number is required', 'error')
        return
      }
      if (!expirationMonth || !expirationYear) {
        showToast('Expiration date is required', 'error')
        return
      }
      // Check if card is expired
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1
      const expYear = Number(expirationYear)
      const expMonth = Number(expirationMonth)

      if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        showToast('Credit card has expired. Please use a valid card.', 'error')
        return
      }
    }

    createMutation.mutate()
  }

  const formatPrice = (cents: number, interval: number, intervalUnit: string) => {
    const dollars = (cents / 100).toFixed(2)
    const unit = interval === 1 ? intervalUnit : `${interval} ${intervalUnit}s`
    return `$${dollars} / ${unit}`
  }

  return (
    <div className="modal-overlay">
      <div className="modal-dialog">
        <div className="modal-header">
          Create Maxio Subscription
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Customer *</label>
              {preselectedCustomerId && preselectedCustomer ? (
                <div className="form-static">
                  {preselectedCustomer.email || `${preselectedCustomer.first_name} ${preselectedCustomer.last_name}`}
                </div>
              ) : (
                <select
                  className="form-input"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  disabled={loadingCustomers}
                >
                  <option value="">Select a customer...</option>
                  {customers?.map((customer: Customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.email || `${customer.first_name} ${customer.last_name}`}
                    </option>
                  ))}
                </select>
              )}
              {loadingCustomers && <div className="form-hint">Loading customers...</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Product *</label>
              <select
                className="form-input"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                disabled={loadingProducts}
              >
                <option value="">Select a product...</option>
                {products?.map((product: Product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {formatPrice(product.price_in_cents, product.interval, product.interval_unit)}
                  </option>
                ))}
              </select>
              {loadingProducts && <div className="form-hint">Loading products...</div>}
              {products && products.length === 0 && (
                <div className="form-hint" style={{ color: 'var(--warning-color)' }}>
                  No products available. Create a product in Maxio first.
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Coupon Code</label>
              <input
                type="text"
                className="form-input"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Optional coupon code"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Reference</label>
              <input
                type="text"
                className="form-input"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Your internal subscription ID"
              />
              <div className="form-hint">Optional unique identifier from your system</div>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Method *</label>
              <select
                className="form-input"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              >
                <option value="credit_card">Credit Card</option>
                <option value="invoice">Invoice (no card required)</option>
              </select>
            </div>

            {paymentMethod === 'credit_card' && (
              <>
                <div className="form-group">
                  <label className="form-label">Card Number *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4111 1111 1111 1111"
                    maxLength={19}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Exp Month *</label>
                    <select
                      className="form-input"
                      value={expirationMonth}
                      onChange={(e) => setExpirationMonth(e.target.value)}
                    >
                      <option value="">Month</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>
                          {m.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Exp Year *</label>
                    <select
                      className="form-input"
                      value={expirationYear}
                      onChange={(e) => setExpirationYear(e.target.value)}
                    >
                      <option value="">Year</option>
                      {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">CVV</label>
                    <input
                      type="text"
                      className="form-input"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      placeholder="123"
                      maxLength={4}
                    />
                  </div>
                </div>
              </>
            )}

            {paymentMethod === 'invoice' && (
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px' }}>
                Invoice billing: Customer will be invoiced and can pay later. No credit card required.
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                createMutation.isPending ||
                !customerId ||
                !productId ||
                (paymentMethod === 'credit_card' && (!cardNumber.trim() || !expirationMonth || !expirationYear))
              }
            >
              {createMutation.isPending ? 'Creating...' : 'Create Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
